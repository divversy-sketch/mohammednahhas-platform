import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Loader2, QrCode, Camera, CheckCircle, XCircle } from '../../shared/icons/lucide-shim.jsx';

const getAdminAIHeaders = async () => {
  const token = await auth?.currentUser?.getIdToken?.();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const SmartHomeworkScanner = ({ hwId, user, onClose }) => {
    const [homeworkData, setHomeworkData] = useState(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchHw = async () => {
            const docRef = doc(db, 'smart_homeworks', hwId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setHomeworkData({ id: snap.id, ...snap.data() });
            } else {
                alert("الواجب غير موجود أو تم حذفه.");
                onClose();
            }
        };
        fetchHw();
    }, [hwId, onClose]);

    const handleImageCapture = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageSrc(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeImageWithGemini = async () => {
        if (!imageSrc || !homeworkData) return;
        setIsAnalyzing(true);
        
        try {
            const base64Data = imageSrc.split(',')[1];
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
            
            if(!apiKey) {
                setTimeout(async () => {
                    const dummyResult = { score: Math.floor(Math.random() * 10), total: 10, feedback: "تم استلام الواجب (محاكاة)." };
                    await saveResult(dummyResult);
                }, 2000);
                return;
            }

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
            const promptText = `أنت معلم لغة عربية. قم بتصحيح صورة الواجب هذه المكونة من أسئلة اختيار من متعدد. مفتاح الإجابة الصحيح هو: ${homeworkData.answerKey}. قم بإرجاع النتيجة بصيغة JSON فقط تحتوي على: {"score": عدد الإجابات الصحيحة, "total": العدد الكلي للأسئلة, "feedback": "تعليق قصير"}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: await getAdminAIHeaders(),
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [
                            { text: promptText },
                            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
                        ]
                    }]
                })
            });

            const data = await response.json();
            const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            const cleanJson = textResult.replace(/```json/g, '').replace(/```/g, '');
            const parsedResult = JSON.parse(cleanJson);
            
            await saveResult(parsedResult);

        } catch (error) {
            console.error("Error analyzing image:", error);
            alert("حدث خطأ أثناء التصحيح. تأكد من وضوح الصورة.");
            setIsAnalyzing(false);
        }
    };

    const saveResult = async (aiResult) => {
        const finalData = {
            studentId: user.uid,
            studentName: user.displayName,
            homeworkId: homeworkData.id,
            homeworkTitle: homeworkData.title,
            bookName: homeworkData.bookName || 'عام',
            grade: homeworkData.grade || 'غير محدد',
            score: aiResult.score,
            total: aiResult.total,
            feedback: aiResult.feedback,
            submittedAt: serverTimestamp()
        };
        await addDoc(collection(db, 'homework_results'), finalData);
        setResult(aiResult);
        setIsAnalyzing(false);
    };

    if (!homeworkData) return <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-12 h-12"/></div>;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 text-white flex flex-col font-['Cairo']" dir="rtl">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <h2 className="font-bold flex items-center gap-2 text-blue-400"><QrCode/> تسليم الواجب: {homeworkData.title} {homeworkData.bookName && `(${homeworkData.bookName})`}</h2>
                <button onClick={onClose} className="bg-red-600 px-4 py-1 rounded text-sm font-bold">إلغاء</button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
                {!imageSrc ? (
                    <div className="space-y-6">
                        <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-4 border-blue-500 border-dashed">
                            <Camera size={48} className="text-blue-400"/>
                        </div>
                        <h3 className="text-2xl font-bold">صوّر صفحة الواجب</h3>
                        <p className="text-slate-400 max-w-md">تأكد من أن الإضاءة جيدة وأن الإجابات (أ، ب، ج، د) واضحة في الصورة ليتمكن الذكاء الاصطناعي من قراءتها بدقة.</p>
                        
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
                                <p className="font-bold text-blue-400">الذكاء الاصطناعي يقوم بالتصحيح الآن...</p>
                                <p className="text-xs text-slate-400 mt-2">يرجى الانتظار ثوانٍ قليلة</p>
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                <button onClick={() => setImageSrc(null)} className="flex-1 bg-slate-700 py-3 rounded-xl font-bold hover:bg-slate-600">إعادة التصوير</button>
                                <button onClick={analyzeImageWithGemini} className="flex-1 bg-green-600 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-500/20">تأكيد وتصحيح</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white text-slate-900 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
                        <CheckCircle className="text-green-500 w-20 h-20 mx-auto mb-4"/>
                        <h2 className="text-3xl font-black mb-2 text-slate-800">النتيجة</h2>
                        <div className="text-5xl font-black text-amber-600 mb-6">{result.score} / {result.total}</div>
                        <p className="text-slate-600 font-bold mb-6">{result.feedback}</p>
                        <p className="text-xs text-slate-400 mb-6">تم إرسال الدرجة للمستر بنجاح.</p>
                        <button onClick={onClose} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800">العودة للمنصة</button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};








export default SmartHomeworkScanner;
