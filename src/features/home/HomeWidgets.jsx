import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { CheckCircle, DownloadCloud, Feather, Quote, Megaphone, Trophy, Star, X } from '../../shared/icons/lucide-shim.jsx';
import { platformNotify } from '../../shared/core/platformShared.jsx';

const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const extractAllQuestions = (exam) => (exam?.questions || []).flatMap(block =>
  (block?.subQuestions || []).map(q => ({ ...q, blockText: block?.text || '', branch: q?.branch || 'عام' }))
);

const PWAInstallBox = ({ installPrompt }) => {
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const checkStandalone = () => setIsStandalone(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
        checkStandalone();
        window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', checkStandalone);
    }, []);

    if (isStandalone) {
        return (
            <div className="glass-panel p-5 rounded-2xl border border-emerald-100 bg-emerald-50/70">
                <h3 className="font-bold text-emerald-800 flex items-center gap-2 mb-1"><CheckCircle size={18}/> المنصة مثبتة كتطبيق</h3>
                <p className="text-sm text-emerald-700">تقدر تفتحها من أيقونة الهاتف أو الكمبيوتر مباشرة.</p>
            </div>
        );
    }

    const handleInstall = async () => {
        if (typeof installPrompt === 'function') {
            await installPrompt();
        } else if (installPrompt?.prompt) {
            installPrompt.prompt();
            await installPrompt.userChoice;
        } else {
            platformNotify('للتثبيت: من المتصفح اضغط القائمة ⋮ ثم Install app أو Add to Home Screen.');
        }
    };

    return (
        <div className="glass-panel p-5 rounded-2xl border border-amber-100 bg-amber-50/70">
            <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-2"><DownloadCloud size={18}/> تثبيت المنصة كتطبيق</h3>
            <p className="text-sm text-amber-700 mb-3">يمكن تثبيت المنصة على الهاتف أو الكمبيوتر لتفتح كأنها تطبيق مستقل.</p>
            <button onClick={handleInstall} className="bg-amber-600 text-white px-5 py-2 rounded-xl font-bold shadow hover:bg-amber-700 transition">تثبيت الآن</button>
        </div>
    );
};


const getResultPercentage = (result) => {
    const total = safeNumber(result?.total, 0);
    if (safeNumber(result?.percentage, -1) >= 0) return safeNumber(result.percentage, 0);
    return total > 0 ? Math.round((safeNumber(result?.score, 0) / total) * 100) : 0;
};

const getGradeBadge = (percentage) => {
    if (percentage >= 85) return { text: 'ممتاز', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (percentage >= 70) return { text: 'جيد جدًا', tone: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (percentage >= 50) return { text: 'جيد', tone: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { text: 'يحتاج مراجعة', tone: 'text-red-700 bg-red-50 border-red-200' };
};

const getUnreviewedEssayCount = (result, exam) => {
    const questions = extractAllQuestions(exam || {});
    const essayQuestions = questions.filter(q => q.type === 'essay');
    if (essayQuestions.length === 0) return 0;
    const reviewed = safeNumber(result?.reviewedEssayCount, 0);
    return Math.max(0, essayQuestions.length - reviewed);
};


const ModernLogo = () => (
  <div className="relative w-20 h-20 drop-shadow-2xl cursor-pointer hover:scale-105 hover:rotate-6 transition-transform">
      <svg width="80" height="80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fbbf24" /><stop offset="50%" stopColor="#d97706" /><stop offset="100%" stopColor="#78350f" /></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <path d="M100 20C55.8 20 20 55.8 20 100s35.8 80 80 80 80-35.8 80-80-35.8-80-80-80zm0 150c-38.6 0-70-31.4-70-70s31.4-70 70-70 70 31.4 70 70-31.4 70-70 70z" fill="url(#logoGrad)" opacity="0.2" />
        <path d="M160 80 V 130 A 60 60 0 0 1 40 130 V 110" stroke="url(#logoGrad)" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#glow)" />
        <rect x="85" y="40" width="30" height="30" rx="4" fill="url(#logoGrad)" transform="rotate(45 100 55)" />
      </svg>
  </div>
);

const FloatingArabicBackground = React.memo(() => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0, background: 'radial-gradient(circle at center, #fdfbf7 0%, #e2e8f0 100%)' }}>
    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/arabesque.png")` }} />
    {['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ض', 'ع'].map((char, i) => (
        <div key={i} className="absolute text-amber-500/15 font-arabic font-bold select-none floating-char" style={{ left: `${(i * 8.5) % 90 + 5}vw`, top: `${(i * 13) % 90 + 5}vh`, fontSize: `${(i % 3) + 3}rem`, animationDelay: `${i * 0.5}s`, animationDuration: `${15 + (i % 5)}s` }}>{char}</div>
    ))}
    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-400/10 rounded-full blur-xl animate-pulse-slow" />
    <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
  </div>
));

const WisdomBox = () => {
  const [idx, setIdx] = useState(0);
  const [quotes, setQuotes] = useState([
    { text: "النجاح مش صدفة، النجاح عزيمة وإصرار", source: "تحفيز" }, { text: "ذاكر صح، مش تذاكر كتير.. ركز يا بطل", source: "نصيحة" }, { text: "حلمك يستاهل تعبك، متوقفش", source: "تحفيز" }, { text: "وَمَا نَيْلُ الْمَطَالِبِ بِالتَّمَنِّي ... وَلَكِنْ تُؤْخَذُ الدُّنْيَا غِلَابَا", source: "شعر" }
  ]);
  useEffect(() => {
      const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => { if (!snap.empty) setQuotes(snap.docs.map(d => d.data())); });
      return () => unsub();
  }, []);
  useEffect(() => { const t = setInterval(() => setIdx(i => (i+1)%quotes.length), 6000); return () => clearInterval(t); }, [quotes]);
  if (quotes.length === 0) return null;
  return (
    <div className="relative bg-gradient-to-r from-amber-600 to-amber-800 text-white p-8 rounded-2xl shadow-xl mb-8 overflow-hidden z-20 border-2 border-amber-400/30">
      <div className="absolute top-0 right-0 p-4 opacity-10"><Feather size={100} /></div>
      <Quote className="absolute top-4 left-4 text-amber-300 opacity-40 w-12 h-12" />
      <div className="relative z-10 text-center">
        <p className="text-2xl font-arabic font-bold mb-3 drop-shadow-md transition-opacity duration-500">"{quotes[idx].text}"</p>
        <span className="bg-black/20 px-4 py-1 rounded-full text-sm font-bold border border-white/20 text-amber-200">- {quotes[idx].source}</span>
      </div>
    </div>
  );
};

const Announcements = () => {
    const [announcements, setAnnouncements] = useState([]);
    useEffect(() => {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => setAnnouncements(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    }, []);
    if(announcements.length === 0) return null;
    return (
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-4 rounded-xl shadow-lg mb-6 relative overflow-hidden z-20 border border-blue-700/50">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Megaphone size={60}/></div>
            <h3 className="font-bold font-arabic text-lg flex items-center gap-2 mb-2 relative z-10 text-blue-200"><Megaphone size={20}/> تنبيهات هامة</h3>
            <div className="relative z-10 space-y-2">
                {announcements.map((a, i) => (
                    <div key={i} className="text-sm border-b border-blue-800 last:border-0 pb-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>{a.text}
                    </div>
                ))}
            </div>
        </div>
    );
};

const Leaderboard = () => {
    const [topStudents, setTopStudents] = useState([]);
    const [config, setConfig] = useState({ show: false });
    useEffect(() => {
        const unsubConfig = onSnapshot(doc(db, 'settings', 'leaderboard_config'), (snap) => { if(snap.exists()) setConfig(snap.data()); });
        const unsub = onSnapshot(query(collection(db, 'exam_results')), (snap) => {
            const scores = {};
            snap.docs.forEach(doc => {
                const data = doc.data();
                if(data.score && data.status === 'completed') {
                    if(!scores[data.studentName]) scores[data.studentName] = 0;
                    scores[data.studentName] += parseInt(data.score);
                }
            });
            const sorted = Object.entries(scores).map(([name, score]) => ({ name, score })).sort((a, b) => b.score - a.score).slice(0, 5); 
            setTopStudents(sorted);
        });
        return () => { unsub(); unsubConfig(); };
    }, []);
    if(!config.show) return null;
    return (
        <div className="glass-panel p-6 rounded-2xl mb-6">
            <h3 className="text-xl font-bold font-arabic mb-4 flex items-center gap-2 text-amber-700"><Trophy className="text-amber-500 fill-amber-500" /> لوحة الشرف (الأوائل)</h3>
            <div className="space-y-3">
                {topStudents.length === 0 ? <p className="text-slate-400 text-sm">لسه مفيش حد امتحن..</p> : topStudents.map((s, i) => (
                    <div key={i} className={`flex justify-between items-center p-3 rounded-lg border-b-2 ${i===0 ? 'bg-gradient-to-r from-yellow-50 to-white border-yellow-400' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md ${i===0?'bg-yellow-400 text-white':i===1?'bg-gray-300 text-gray-700':i===2?'bg-orange-300 text-white':'bg-slate-100 text-slate-500'}`}>
                                {i < 3 ? <Star size={14} fill="currentColor" /> : i+1}
                            </div>
                            <span className="font-bold text-slate-800">{s.name}</span>
                        </div>
                        <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">{s.score} نقطة</span>
                    </div>
                ))}
            </div>
        </div>
    );
};





export { PWAInstallBox, ModernLogo, FloatingArabicBackground, WisdomBox, Announcements, Leaderboard };
