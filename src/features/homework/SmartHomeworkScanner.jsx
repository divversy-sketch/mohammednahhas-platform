import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../services/firebase';
import { Loader2, QrCode, Camera, CheckCircle, AlertTriangle } from '../../shared/icons/lucide-shim.jsx';

const toDate = (value) => {
    if (!value) return null;
    if (value?.toDate) return value.toDate();
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

const compressImage = (dataUrl, maxWidth = 1400, quality = 0.78) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
});

const SmartHomeworkScanner = ({ hwId, user, onClose }) => {
    const [homeworkData, setHomeworkData] = useState(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchHw = async () => {
            try {
                const docRef = doc(db, 'smart_homeworks', hwId);
                const snap = await getDoc(docRef);
                if (!snap.exists()) {
                    setError('الواجب غير موجود أو تم حذفه.');
                    return;
                }
                const data = { id: snap.id, ...snap.data() };
                const now = new Date();
                const start = toDate(data.startAt);
                const end = toDate(data.endAt);
                if (data.status && data.status !== 'active') setError('هذا الواجب غير متاح حالياً.');
                else if (start && now < start) setError('هذا الواجب لم يبدأ بعد.');
                else if (end && now > end) setError('انتهى وقت تسليم هذا الواجب.');
                setHomeworkData(data);
            } catch (err) {
                console.error(err);
                setError('تعذر تحميل الواجب.');
            }
        };
        fetchHw();
    }, [hwId]);

    const handleImageCapture = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const compressed = await compressImage(event.target.result);
            setImageSrc(compressed);
            setResult(null);
            setError('');
        };
        reader.readAsDataURL(file);
    };

    const analyzeHomework = async () => {
        if (!imageSrc || !homeworkData) return;
        setIsAnalyzing(true);
        setError('');
        try {
            const base64Data = imageSrc.split(',')[1];
            const callable = httpsCallable(functions, 'correctSmartHomework');
            const response = await callable({ homeworkId: homeworkData.id, imageBase64: base64Data, mimeType: 'image/jpeg' });
            setResult(response.data?.result || response.data || {});
        } catch (error) {
            console.error('Smart homework correction error:', error);
            setError(error?.message || 'حدث خطأ أثناء التصحيح. تأكد من وضوح الصورة.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!homeworkData && !error) return <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-12 h-12"/></div>;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 text-white flex flex-col font-['Cairo']" dir="rtl">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <h2 className="font-bold flex items-center gap-2 text-blue-400"><QrCode/> تسليم الواجب: {homeworkData?.title || 'واجب QR'} {homeworkData?.bookName && `(${homeworkData.bookName})`}</h2>
                <button onClick={onClose} className="bg-red-600 px-4 py-1 rounded text-sm font-bold">إغلاق</button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
                {error && !imageSrc && (
                    <div className="bg-white text-slate-900 rounded-3xl p-8 max-w-md shadow-2xl">
                        <AlertTriangle className="text-red-500 w-16 h-16 mx-auto mb-4"/>
                        <h3 className="text-2xl font-black mb-2">تعذر فتح الواجب</h3>
                        <p className="text-slate-600 font-bold mb-6">{error}</p>
                        <button onClick={onClose} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold">العودة</button>
                    </div>
                )}

                {!error && !imageSrc ? (
                    <div className="space-y-6">
                        <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-4 border-blue-500 border-dashed"><Camera size={48} className="text-blue-400"/></div>
                        <h3 className="text-2xl font-bold">صوّر صفحة الواجب</h3>
                        {homeworkData?.instructions && <p className="text-blue-100 bg-blue-950/40 border border-blue-800 rounded-2xl p-4 max-w-md font-bold">{homeworkData.instructions}</p>}
                        <p className="text-slate-400 max-w-md">التصحيح يتم الآن من Cloud Function آمنة، لذلك نموذج الإجابة ومفتاح Gemini غير ظاهرين للطالب.</p>
                        <button onClick={() => fileInputRef.current.click()} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg flex items-center gap-2 mx-auto"><Camera /> افتح الكاميرا</button>
                        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageCapture} className="hidden" />
                    </div>
                ) : null}

                {imageSrc && !result && (
                    <div className="space-y-6 w-full max-w-md">
                        <img src={imageSrc} alt="Homework" className="w-full h-80 object-cover rounded-xl border-4 border-slate-700" />
                        {error && <div className="bg-red-950/50 border border-red-700 text-red-100 p-3 rounded-xl font-bold text-sm">{error}</div>}
                        {isAnalyzing ? (
                            <div className="bg-slate-800 p-6 rounded-xl border border-blue-500/50 flex flex-col items-center"><Loader2 className="animate-spin text-blue-500 w-10 h-10 mb-4"/><p className="font-bold text-blue-400">جاري التصحيح الآمن...</p><p className="text-xs text-slate-400 mt-2">لحظات والتقرير يظهر</p></div>
                        ) : (
                            <div className="flex gap-4">
                                <button onClick={() => { setImageSrc(null); setError(''); }} className="flex-1 bg-slate-700 py-3 rounded-xl font-bold hover:bg-slate-600">إعادة التصوير</button>
                                <button onClick={analyzeHomework} className="flex-1 bg-green-600 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-500/20">تأكيد وتصحيح</button>
                            </div>
                        )}
                    </div>
                )}

                {result && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white text-slate-900 p-8 rounded-3xl w-full max-w-md shadow-2xl">
                        <CheckCircle className="text-green-500 w-20 h-20 mx-auto mb-4"/>
                        <h2 className="text-3xl font-black mb-2 text-slate-800">تم التسليم</h2>
                        {homeworkData?.showResultToStudent !== false ? <div className="text-5xl font-black text-amber-600 mb-6">{result.score} / {result.total}</div> : <p className="font-bold text-slate-600 mb-6">تم إرسال الواجب للمراجعة.</p>}
                        {homeworkData?.showFeedbackToStudent !== false && <p className="text-slate-600 font-bold mb-6 whitespace-pre-wrap">{result.feedback}</p>}
                        {Array.isArray(result.questions) && result.questions.length > 0 && homeworkData?.showFeedbackToStudent !== false && <div className="text-right max-h-44 overflow-y-auto bg-slate-50 rounded-2xl p-3 mb-5 text-sm space-y-2">{result.questions.map((q, i) => <div key={i} className="border-b pb-2"><b>س{q.q || i+1}:</b> إجابتك {q.studentAnswer || '-'} · الصحيح {q.correctAnswer || '-'} {q.isCorrect ? '✅' : '❌'}</div>)}</div>}
                        <p className="text-xs text-slate-400 mb-6">تم حفظ الدرجة في حسابك ولوحة الأدمن.</p>
                        <button onClick={onClose} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800">العودة للمنصة</button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default SmartHomeworkScanner;
