import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../services/firebase';
import { Loader2, QrCode, Camera, CheckCircle, XCircle, AlertCircle } from '../../shared/icons/lucide-shim.jsx';

const resizeImageForCloudFunction = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('تعذر قراءة الصورة.'));
  reader.onload = () => {
    const img = new Image();
    img.onerror = () => reject(new Error('الصورة غير صالحة.'));
    img.onload = () => {
      const maxSide = 1400;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

const formatDate = (value) => {
  if (!value) return '';
  try {
    const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
    return date.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
  } catch (_) {
    return '';
  }
};

const SmartHomeworkScanner = ({ hwId, user, onClose }) => {
    const [homeworkData, setHomeworkData] = useState(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [attemptInfo, setAttemptInfo] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchHw = async () => {
            try {
              const docRef = doc(db, 'smart_homeworks', hwId);
              const snap = await getDoc(docRef);
              if (snap.exists()) {
                  setHomeworkData({ id: snap.id, ...snap.data() });
              } else {
                  setLoadError('الواجب غير موجود أو تم حذفه.');
              }
            } catch (error) {
              console.error('Error loading smart homework:', error);
              setLoadError('تعذر فتح الواجب الآن.');
            }
        };
        fetchHw();
    }, [hwId]);

    const handleImageCapture = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const resized = await resizeImageForCloudFunction(file);
          setImageSrc(resized);
          setResult(null);
        } catch (error) {
          alert(error.message || 'تعذر تجهيز الصورة.');
        }
    };

    const analyzeImageWithCloudFunction = async () => {
        if (!imageSrc || !homeworkData) return;
        setIsAnalyzing(true);
        setAttemptInfo(null);
        try {
            const [, meta = '', base64Data = ''] = imageSrc.match(/^data:(.*?);base64,(.*)$/) || [];
            const correctHomework = httpsCallable(functions, 'correctSmartHomework');
            const response = await correctHomework({
              homeworkId: homeworkData.id,
              imageBase64: base64Data,
              mimeType: meta || 'image/jpeg'
            });
            const payload = response.data || {};
            setResult(payload.result || payload);
            setAttemptInfo({ attemptCount: payload.attemptCount, attemptsRemaining: payload.attemptsRemaining });
        } catch (error) {
            console.error('Error analyzing homework image:', error);
            alert(error?.message || 'حدث خطأ أثناء التصحيح. تأكد من وضوح الصورة وحاول مرة أخرى.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (loadError) {
      return (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 text-white flex items-center justify-center p-6 font-['Cairo']" dir="rtl">
          <div className="bg-white text-slate-900 rounded-3xl p-8 max-w-md text-center shadow-2xl">
            <XCircle className="text-red-500 w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2">لم يتم فتح الواجب</h2>
            <p className="text-slate-600 mb-6">{loadError}</p>
            <button onClick={onClose} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">العودة للمنصة</button>
          </div>
        </div>
      );
    }

    if (!homeworkData) return <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-12 h-12"/></div>;

    const now = Date.now();
    const startAtMs = homeworkData.startAt ? (homeworkData.startAt?.toDate?.()?.getTime?.() || new Date(homeworkData.startAt).getTime()) : null;
    const endAtMs = homeworkData.endAt ? (homeworkData.endAt?.toDate?.()?.getTime?.() || new Date(homeworkData.endAt).getTime()) : null;
    const isNotStarted = startAtMs && now < startAtMs;
    const isExpired = endAtMs && now > endAtMs;
    const isClosed = homeworkData.status === 'closed' || homeworkData.isActive === false || isNotStarted || isExpired;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 text-white flex flex-col font-['Cairo']" dir="rtl">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <h2 className="font-bold flex items-center gap-2 text-blue-400"><QrCode/> تسليم الواجب: {homeworkData.title} {homeworkData.bookName && `(${homeworkData.bookName})`}</h2>
                <button onClick={onClose} className="bg-red-600 px-4 py-1 rounded text-sm font-bold">إلغاء</button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
                {isClosed ? (
                  <div className="bg-white text-slate-900 p-8 rounded-3xl max-w-md shadow-2xl">
                    <AlertCircle className="text-amber-500 w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-2xl font-black mb-3">الواجب غير متاح الآن</h3>
                    {isNotStarted && <p className="text-slate-600">سيبدأ في: {formatDate(homeworkData.startAt)}</p>}
                    {isExpired && <p className="text-slate-600">انتهى في: {formatDate(homeworkData.endAt)}</p>}
                    {!isNotStarted && !isExpired && <p className="text-slate-600">تم إغلاق الواجب من الإدارة.</p>}
                    <button onClick={onClose} className="mt-6 w-full bg-slate-900 text-white py-3 rounded-xl font-bold">العودة</button>
                  </div>
                ) : !imageSrc ? (
                    <div className="space-y-6">
                        <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-4 border-blue-500 border-dashed">
                            <Camera size={48} className="text-blue-400"/>
                        </div>
                        <h3 className="text-2xl font-bold">صوّر صفحة الواجب</h3>
                        <p className="text-slate-400 max-w-md">تأكد من أن الإضاءة جيدة وأن الورقة كاملة وواضحة. التصحيح يتم الآن من السيرفر لحماية نموذج الإجابة ومفتاح Gemini.</p>
                        {homeworkData.instructions && <p className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 max-w-md">{homeworkData.instructions}</p>}
                        <button onClick={() => fileInputRef.current.click()} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg flex items-center gap-2 mx-auto">
                            <Camera /> افتح الكاميرا
                        </button>
                        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageCapture} className="hidden" />
                    </div>
                ) : !result ? (
                    <div className="space-y-6 w-full max-w-md">
                        <img src={imageSrc} alt="Homework" className="w-full h-80 object-cover rounded-xl border-4 border-slate-700" />
                        {isAnalyzing ? (
                            <div className="bg-slate-800 p-6 rounded-xl border border-blue-500/50 flex flex-col items-center">
                                <Loader2 className="animate-spin text-blue-500 w-10 h-10 mb-4"/>
                                <p className="font-bold text-blue-400">جاري التصحيح الآمن من Cloud Function...</p>
                                <p className="text-xs text-slate-400 mt-2">الذكاء الاصطناعي بيفتح الكراسة دلوقتي، ادعيله يلاقي الخط واضح 😄</p>
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                <button onClick={() => setImageSrc(null)} className="flex-1 bg-slate-700 py-3 rounded-xl font-bold hover:bg-slate-600">إعادة التصوير</button>
                                <button onClick={analyzeImageWithCloudFunction} className="flex-1 bg-green-600 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-500/20">تأكيد وتصحيح</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white text-slate-900 p-8 rounded-3xl w-full max-w-md shadow-2xl">
                        <CheckCircle className="text-green-500 w-20 h-20 mx-auto mb-4"/>
                        <h2 className="text-3xl font-black mb-2 text-slate-800">النتيجة</h2>
                        {result.hiddenFromStudent ? (
                          <p className="text-slate-600 font-bold mb-6">تم تسليم الواجب بنجاح، والنتيجة متاحة للإدارة فقط.</p>
                        ) : (
                          <>
                            <div className="text-5xl font-black text-amber-600 mb-4">{result.score} / {result.total}</div>
                            <p className="text-slate-600 font-bold mb-4">{result.feedback}</p>
                            {Array.isArray(result.questions) && result.questions.length > 0 && (
                              <div className="text-right bg-slate-50 rounded-xl p-3 max-h-48 overflow-y-auto mb-4">
                                <p className="font-black text-sm mb-2">تفصيل الأسئلة:</p>
                                {result.questions.slice(0, 40).map((q, idx) => (
                                  <div key={idx} className="text-xs border-b last:border-b-0 py-1 flex justify-between gap-2">
                                    <span>س{q.q ?? idx + 1}: إجابتك {q.studentAnswer || '-'}</span>
                                    <span className={q.isCorrect ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{q.isCorrect ? 'صح' : `خطأ (${q.correctAnswer || '-'})`}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                        {attemptInfo && <p className="text-xs text-slate-400 mb-4">عدد المحاولات: {attemptInfo.attemptCount}{attemptInfo.attemptsRemaining !== null && attemptInfo.attemptsRemaining !== undefined ? ` - المتبقي: ${attemptInfo.attemptsRemaining}` : ''}</p>}
                        <p className="text-xs text-slate-400 mb-6">تم إرسال التسليم للمستر بنجاح.</p>
                        <button onClick={onClose} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800">العودة للمنصة</button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default SmartHomeworkScanner;
