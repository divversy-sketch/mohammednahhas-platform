import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, getDoc, getDocs, collection, addDoc, query, where, 
  onSnapshot, updateDoc, deleteDoc, orderBy, serverTimestamp, writeBatch, limit 
} from 'firebase/firestore';
import { 
  PlayCircle, FileText, LogOut, User, GraduationCap, Quote, CheckCircle, 
  Lock, Mail, ChevronRight, Menu, X, Loader2, AlertTriangle, PlusCircle, 
  Check, Trash2, Eye, ShieldAlert, Video, UploadCloud, Phone, Edit, KeyRound,
  MessageSquare, Send, MessageCircle, Facebook, BookOpen, Feather, Radio, 
  ExternalLink, ClipboardList, Timer, AlertOctagon, Flag, Save, HelpCircle, 
  Reply, Unlock, Layout, Settings, Trophy, Megaphone, Bell, Download, XCircle, 
  Calendar, Clock, FileWarning, Settings as GearIcon, Star, Bot, Power, Upload,
  Users, PenTool, Hash, Activity, Zap, ShieldCheck, Globe, Monitor, Smartphone,
  Layers, HardDrive, RefreshCw, Filter, Search, Award, Book, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * =================================================================
 * 1. تهيئة نظام Firebase (الإعدادات الأصلية)
 * =================================================================
 */
const firebaseConfig = {
  apiKey: "AIzaSyDE7PASs4dt2aD912Jerm7260142Hee4W0",
  authDomain: "exam-f6804.firebaseapp.com",
  projectId: "exam-f6804",
  storageBucket: "exam-f6804.firebasestorage.app",
  messagingSenderId: "1029912301794",
  appId: "1:1029912301794:web:57673ad6f7331136e80ebb",
  measurementId: "G-PCEZQ7H2EV"
};

let app, auth, db;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) { 
  console.error("خطأ في تهيئة Firebase:", error); 
}

/**
 * =================================================================
 * 2. دوال النظام المساعدة (Utility Functions)
 * =================================================================
 */

// طلب الإذن للإشعارات المتصفح
const requestNotificationPermission = () => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().then(permission => {
      if(permission === "granted") console.log("تم تفعيل نظام الإشعارات");
    });
  }
};

// إرسال إشعار نظام حقيقي للطالب
const sendSystemNotification = (title, body) => {
  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body: body,
        icon: "https://cdn-icons-png.flaticon.com/512/3449/3449750.png",
        vibrate: [200, 100, 200]
      });
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) { console.error("خطأ في الإشعار:", e); }
  }
};

// استخراج معرف اليوتيوب من أي رابط
const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * =================================================================
 * 3. نظام توليد التقارير الذكي (PDF Engine)
 * =================================================================
 */
const generatePDF = (type, data) => {
    if (!window.html2pdf) {
        alert("يرجى الانتظار لحين تحميل محرك الطباعة...");
        return;
    }

    const percentage = data.total > 0 ? Math.round((data.score / data.total) * 100) : 0;
    const date = new Date().toLocaleDateString('ar-EG');
    const element = document.createElement('div');
    
    let answersTable = '';
    if (data.questions && data.answers) {
        answersTable = `
        <div style="margin-top: 35px; page-break-before: always;">
            <h3 style="background: #f1f5f9; padding: 15px; border-right: 8px solid #d97706; font-family: 'Cairo', sans-serif; color: #1e293b;">تحليل أداء الطالب في الأسئلة</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px; font-family: 'Cairo', sans-serif; direction: rtl;">
                <thead>
                    <tr style="background-color: #0f172a; color: #ffffff;">
                        <th style="border: 1px solid #cbd5e1; padding: 12px; width: 6%;">رقم</th>
                        <th style="border: 1px solid #cbd5e1; padding: 12px; text-align: right;">السؤال المطروح</th>
                        <th style="border: 1px solid #cbd5e1; padding: 12px; width: 18%;">إجابتك</th>
                        <th style="border: 1px solid #cbd5e1; padding: 12px; width: 18%;">الإجابة الصحيحة</th>
                        <th style="border: 1px solid #cbd5e1; padding: 12px; width: 12%;">التقييم</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.questions.map((q, i) => {
                        const studentAnsIdx = data.answers[q.id];
                        const correctAnsIdx = q.correctIdx;
                        const isCorrect = studentAnsIdx === correctAnsIdx;
                        const studentAnsText = studentAnsIdx !== undefined ? q.options[studentAnsIdx] : 'لم تتم الإجابة';
                        const correctAnsText = q.options[correctAnsIdx];
                        
                        return `
                        <tr style="background-color: ${isCorrect ? '#f0fdf4' : '#fef2f2'}; border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px; text-align: center; font-weight: bold;">${i + 1}</td>
                            <td style="padding: 12px; font-weight: 500;">${q.text}</td>
                            <td style="padding: 12px; font-weight: 700; color: ${isCorrect ? '#166534' : '#991b1b'};">${studentAnsText}</td>
                            <td style="padding: 12px; color: #15803d; font-weight: 600;">${correctAnsText}</td>
                            <td style="padding: 12px; text-align: center; font-weight: 900; color: ${isCorrect ? '#166534' : '#991b1b'};">
                                ${isCorrect ? 'صحيح ✔' : 'خطأ ✘'}
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        `;
    }

    const htmlContent = `
      <div style="padding: 50px; font-family: 'Cairo', sans-serif; direction: rtl; color: #1e293b; background: white;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 5px solid #d97706; padding-bottom: 30px; margin-bottom: 50px;">
            <div style="text-align: right;">
                <h1 style="margin: 0; color: #d97706; font-size: 36px; font-weight: 900;">منصة النحاس التعليمية</h1>
                <p style="margin: 10px 0 0; color: #475569; font-size: 20px; font-weight: 600;">تحت إشراف الأستاذ محمد النحاس</p>
            </div>
            <div style="text-align: left;">
                <h2 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 800;">تقرير أداء أكاديمي</h2>
                <p style="margin: 5px 0 0; color: #94a3b8; font-weight: bold;">بتاريخ: ${date}</p>
            </div>
        </div>
        
        <div style="background: #f8fafc; border: 3px solid #e2e8f0; border-radius: 24px; padding: 40px; margin-bottom: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.02);">
            <table style="width: 100%; font-size: 20px; border-spacing: 0 20px;">
                <tr>
                    <td style="font-weight: 900; color: #334155; width: 25%;">اسم الطالب:</td>
                    <td style="color: #0f172a; font-weight: 700;">${data.studentName}</td>
                </tr>
                <tr>
                    <td style="font-weight: 900; color: #334155;">عنوان الاختبار:</td>
                    <td style="color: #0f172a; font-weight: 700;">${data.examTitle || 'اختبار شامل'}</td>
                </tr>
                <tr>
                    <td style="font-weight: 900; color: #334155;">النتيجة الإجمالية:</td>
                    <td>
                        <div style="display: inline-block; background: #d97706; color: white; padding: 12px 35px; border-radius: 12px; font-weight: 900; font-size: 28px; box-shadow: 0 5px 15px rgba(217,119,6,0.3);">
                            ${data.score} / ${data.total}
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="font-weight: 900; color: #334155;">النسبة المئوية:</td>
                    <td style="font-size: 32px; font-weight: 900; color: ${percentage >= 50 ? '#15803d' : '#b91c1c'}">${percentage}%</td>
                </tr>
                <tr>
                    <td style="font-weight: 900; color: #334155;">الحالة النهائية:</td>
                    <td>
                        <span style="background: ${data.status === 'cheated' ? '#fee2e2' : '#dcfce7'}; color: ${data.status === 'cheated' ? '#991b1b' : '#166534'}; padding: 10px 25px; border-radius: 40px; font-weight: 900; font-size: 18px; border: 2px solid currentColor;">
                            ${data.status === 'cheated' ? 'لاغي (غش مرصود)' : percentage >= 50 ? 'اجتاز الاختبار بنجاح' : 'لم يوفق - يحتاج مراجعة'}
                        </span>
                    </td>
                </tr>
            </table>
        </div>
        
        ${answersTable}

        <div style="margin-top: 80px; text-align: center; border-top: 3px dashed #cbd5e1; padding-top: 40px;">
             <p style="font-size: 16px; color: #64748b; font-weight: 900;">هذه الوثيقة رسمية ومستخرجة إلكترونياً من المنصة</p>
             <div style="margin-top: 20px; display: flex; justify-content: center; gap: 50px;">
                <div style="text-align: center;">
                    <p style="font-weight: 900; color: #1e293b;">ختم المنصة</p>
                    <div style="width: 100px; height: 100px; border: 2px solid #d97706; border-radius: 50%; margin: 10px auto; opacity: 0.3;"></div>
                </div>
             </div>
        </div>
      </div>
    `;

    element.innerHTML = htmlContent;
    
    const opt = { 
        margin: 0, 
        filename: `شهادة_النحاس_${data.studentName}.pdf`, 
        image: { type: 'jpeg', quality: 1 }, 
        html2canvas: { scale: 3, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    };
    
    window.html2pdf().set(opt).from(element).save();
};

/**
 * =================================================================
 * 4. نظام التصميم والأنميشن (Premium UI System)
 * =================================================================
 */

const DesignSystemLoader = () => {
  useEffect(() => {
    // إدراج Tailwind CSS
    if (!document.getElementById('tailwind-script')) {
      const script = document.createElement('script');
      script.id = 'tailwind-script';
      script.src = "https://cdn.tailwindcss.com";
      script.onload = () => {
        if(window.tailwind) {
            window.tailwind.config = {
              theme: {
                extend: {
                  fontFamily: { sans: ['Cairo', 'sans-serif'] },
                  colors: { 
                    amber: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f' },
                    slate: { 850: '#1e293b', 950: '#0f172a' }
                  },
                  borderRadius: { '4xl': '2rem', '5xl': '3rem' },
                  animation: {
                    'spin-slow': 'spin 12s linear infinite',
                    'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    'bounce-gentle': 'bounceGentle 3s ease-in-out infinite',
                  },
                  keyframes: {
                    bounceGentle: {
                        '0%, 100%': { transform: 'translateY(0)' },
                        '50%': { transform: 'translateY(-10px)' }
                    }
                  }
                }
              }
            }
        }
      };
      document.head.appendChild(script);
    }
    
    // إدراج خط القاهرة
    if (!document.getElementById('cairo-font')) {
      const link = document.createElement('link');
      link.id = 'cairo-font';
      link.rel = 'stylesheet';
      link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&family=Reem+Kufi:wght@400;700&display=swap";
      document.head.appendChild(link);
    }
    
    // إدراج مكتبة html2pdf
    if (!document.getElementById('html2pdf-script')) {
        const script = document.createElement('script');
        script.id = 'html2pdf-script';
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        document.head.appendChild(script);
    }
  }, []);

  return (
    <style>{`
      body { font-family: 'Cairo', sans-serif; background-color: #f8fafc; direction: rtl; user-select: none; -webkit-tap-highlight-color: transparent; overflow-x: hidden; }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: #f1f5f9; }
      ::-webkit-scrollbar-thumb { background: #d97706; border-radius: 20px; }
      
      .glass-morphism { background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.5); }
      .gradient-border { border: 2px solid; border-image: linear-gradient(to right, #d97706, #78350f) 1; }
      
      /* نظام العلامة المائية الشفافة المتحركة (تم التحسين لمنع الرمش عند التحديث) */
      .watermark-container-root {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
        z-index: 9999;
      }

      .watermark-unit {
        position: absolute;
        white-space: nowrap;
        font-weight: 900;
        user-select: none;
        pointer-events: none;
        opacity: 0.12;
        transform-origin: center;
      }

      @keyframes floatAnimation {
        0% { transform: translate(0, 0) rotate(-25deg); opacity: 0.1; }
        25% { transform: translate(25vw, 15vh) rotate(-20deg); opacity: 0.15; }
        50% { transform: translate(60vw, -5vh) rotate(-30deg); opacity: 0.1; }
        75% { transform: translate(20vw, 40vh) rotate(-25deg); opacity: 0.15; }
        100% { transform: translate(0, 0) rotate(-25deg); opacity: 0.1; }
      }

      .float-watermark {
        animation: floatAnimation 30s ease-in-out infinite alternate;
      }

      .video-layer-watermark {
        color: rgba(255, 255, 255, 0.6);
        text-shadow: 2px 2px 5px rgba(0,0,0,0.8);
        font-size: 1.1rem;
        z-index: 100;
      }

      .exam-layer-watermark {
        color: rgba(15, 23, 42, 0.15);
        font-size: 1.3rem;
      }

      .no-select { -webkit-user-select: none; user-select: none; }
      .perspective { perspective: 1500px; }
      .preserve-3d { transform-style: preserve-3d; }
      
      .modern-shadow { box-shadow: 0 20px 50px rgba(0,0,0,0.05); }
      .amber-glow { filter: drop-shadow(0 0 10px rgba(217, 119, 6, 0.3)); }
    `}</style>
  );
};

// مكون العلامة المائية المتقدم (المتحرك والشفاف)
const DynamicWatermark = ({ text, type = 'exam' }) => {
    // استخدام useMemo لضمان عدم إعادة حساب الإحداثيات عند الريندير
    const items = useMemo(() => [
        { id: 'w1', top: '10%', left: '5%', delay: '0s' },
        { id: 'w2', top: '50%', left: '75%', delay: '-5s' },
        { id: 'w3', top: '85%', left: '20%', delay: '-10s' },
        { id: 'w4', top: '25%', left: '45%', delay: '-15s' },
        { id: 'w5', top: '70%', left: '85%', delay: '-20s' },
        { id: 'w6', top: '40%', left: '15%', delay: '-25s' }
    ], []);

    return (
        <div className="watermark-container-root">
            {items.map((item) => (
                <div 
                    key={item.id} 
                    className={`watermark-unit float-watermark ${type === 'video' ? 'video-layer-watermark' : 'exam-layer-watermark'}`}
                    style={{ 
                        top: item.top, 
                        left: item.left,
                        animationDelay: item.delay
                    }}
                >
                    {text}
                </div>
            ))}
        </div>
    );
};

/**
 * =================================================================
 * 5. المكونات البصرية الأساسية (Modern Logo & Branding)
 * =================================================================
 */

const ModernLogo = () => (
  <motion.svg 
    width="90" height="90" viewBox="0 0 200 200" fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    whileHover={{ scale: 1.1, rotate: 10 }} 
    className="drop-shadow-2xl cursor-pointer relative z-10"
  >
    <defs>
      <linearGradient id="nahaasMainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <filter id="nahaasGlow">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <motion.circle 
      cx="100" cy="100" r="94" 
      stroke="#e2e8f0" strokeWidth="2" strokeDasharray="10 10" 
      opacity="0.3" 
      animate={{ rotate: 360 }} 
      transition={{ duration: 40, repeat: Infinity, ease: "linear" }} 
    />
    <motion.path 
      d="M170 90 V 140 A 70 70 0 0 1 30 140 V 120" 
      stroke="url(#nahaasMainGrad)" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" 
      fill="none" 
      initial={{ pathLength: 0 }} 
      animate={{ pathLength: 1 }} 
      transition={{ duration: 2, ease: "easeInOut" }} 
      filter="url(#nahaasGlow)"
    />
    <motion.rect 
      x="85" y="30" width="30" height="30" rx="8" 
      fill="url(#nahaasMainGrad)" 
      transform="rotate(45 100 45)" 
      initial={{ scale: 0, opacity: 0 }} 
      animate={{ scale: 1, opacity: 1 }} 
      transition={{ delay: 1.2, type: "spring", stiffness: 150 }} 
    />
    <motion.path 
      d="M 170 90 L 145 65" 
      stroke="#1e293b" strokeWidth="10" strokeLinecap="round" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ delay: 1.8 }} 
    />
  </motion.svg>
);

// مكون الحكم والأقوال المتحرك
const WisdomBox = () => {
  const [idx, setIdx] = useState(0);
  const [quotes, setQuotes] = useState([
    { text: "اللغة العربية هي لغة الفكر، فتعلمها بقلبك قبل عقلك.", source: "كلمة الأستاذ" }, 
    { text: "إنما النجاح صبر ساعة، فاستعن بالله ولا تعجز.", source: "نصيحة اليوم" }, 
    { text: "ذاكر لتفهم، ونافس لتتميز، وكن فخوراً بنفسك دائماً.", source: "رسالة تحفيزية" }, 
    { text: "أَنَا البَحرُ في أَحشائِهِ الدُرُّ كامِنٌ.. فَهَل سَأَلوا الغَوّاصَ عَن صَدَفاتي", source: "حافظ إبراهيم" },
    { text: "من سلك طريقاً يلتمس فيه علماً، سهل الله له به طريقاً إلى الجنة.", source: "حديث شريف" }
  ]);

  useEffect(() => {
      const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
          if (!snap.empty) {
              setQuotes(snap.docs.map(d => d.data()));
          }
      });
      return () => unsub();
  }, []);

  useEffect(() => { 
    const t = setInterval(() => setIdx(i => (i + 1) % quotes.length), 8500); 
    return () => clearInterval(t); 
  }, [quotes]);
  
  if (quotes.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="relative bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-white p-10 rounded-[3rem] shadow-2xl mb-12 overflow-hidden z-20 group"
    >
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-[100px] group-hover:bg-white/20 transition-all duration-1000"></div>
      <Quote className="absolute top-8 left-8 opacity-20 w-24 h-24 rotate-12 group-hover:scale-110 transition-transform" />
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <AnimatePresence mode='wait'>
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-3xl font-black mb-6 leading-relaxed tracking-tight font-['Reem_Kufi']">"{quotes[idx].text}"</p>
            <div className="flex items-center justify-center gap-4">
              <div className="h-[3px] w-12 bg-amber-400 rounded-full"></div>
              <span className="bg-slate-900/40 px-6 py-2 rounded-full text-sm font-black tracking-widest backdrop-blur-xl border border-white/10">{quotes[idx].source}</span>
              <div className="h-[3px] w-12 bg-amber-400 rounded-full"></div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// لوحة الشرف للأوائل
const Leaderboard = () => {
    const [topStudents, setTopStudents] = useState([]);
    const [config, setConfig] = useState({ show: true });

    useEffect(() => {
        const unsubConfig = onSnapshot(doc(db, 'settings', 'config'), (snap) => {
            if(snap.exists()) setConfig(snap.data());
        });
        const unsub = onSnapshot(query(collection(db, 'exam_results')), (snap) => {
            const scores = {};
            snap.docs.forEach(doc => {
                const data = doc.data();
                if(data.score && data.status !== 'cheated') {
                    if(!scores[data.studentName]) scores[data.studentName] = 0;
                    scores[data.studentName] += parseInt(data.score);
                }
            });
            const sorted = Object.entries(scores)
                .map(([name, score]) => ({ name, score }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 5); 
            setTopStudents(sorted);
        });
        return () => { unsub(); unsubConfig(); };
    }, []);

    if(!config.show) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-white p-10 rounded-[4rem] shadow-[0_30px_100px_rgba(0,0,0,0.04)] border border-slate-50 mb-14"
        >
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-amber-100 text-amber-600 rounded-[2rem] shadow-inner rotate-12 hover:rotate-0 transition-transform"><Trophy size={40}/></div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tighter">لوحة شرف الأوائل</h3>
                        <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">Hall of Fame - Top Performers</p>
                    </div>
                </div>
                <div className="hidden md:flex gap-2">
                    {[1,2,3].map(i => <div key={i} className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: `${i*0.2}s` }}></div>)}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-5">
                {topStudents.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <Star className="mx-auto text-slate-200 w-16 h-16 mb-4 animate-pulse" />
                        <p className="text-slate-400 font-black text-lg uppercase tracking-widest">التنافس لم يبدأ بعد!</p>
                    </div>
                ) : topStudents.map((s, i) => (
                    <motion.div 
                        whileHover={{ scale: 1.01, x: -10 }}
                        key={i} 
                        className={`flex justify-between items-center p-6 rounded-[2.5rem] border-2 transition-all group ${
                            i === 0 ? 'bg-amber-50 border-amber-200 shadow-lg shadow-amber-100' : 'bg-white border-slate-100 shadow-sm'
                        }`}
                    >
                        <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center font-black text-2xl transition-all ${
                                i === 0 ? 'bg-amber-600 text-white shadow-xl shadow-amber-300 -rotate-6 group-hover:rotate-0' : 
                                i === 1 ? 'bg-slate-300 text-white' : 
                                i === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                                {i + 1}
                            </div>
                            <div>
                                <span className="font-black text-slate-800 text-xl block mb-1 group-hover:text-amber-700 transition-colors">{s.name}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verified Student Account</span>
                            </div>
                        </div>
                        <div className="bg-slate-900 px-8 py-3 rounded-2xl shadow-xl shadow-slate-200">
                            <span className="text-amber-500 font-black text-2xl">{s.score}</span>
                            <span className="text-white text-xs font-black mr-2 uppercase">Pts</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

/**
 * =================================================================
 * 6. نظام المحادثة المتطور (Smart AI Chat Widget)
 * =================================================================
 */

const ChatWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ id: 1, text: "أهلاً بك في منصة النحاس الذكية! 🎓\nمعك المساعد الآلي المتطور، كيف أخدمك؟", sender: 'bot' }]);
  const [inputText, setInputText] = useState("");
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9)); 
  const chatEndRef = useRef(null);
  const [isContactAdminMode, setIsContactAdminMode] = useState(false);
  const [autoReplies, setAutoReplies] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'auto_replies'), (snap) => {
        const rules = snap.docs.map(d => d.data()).filter(r => r.isActive);
        setAutoReplies(rules);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const userId = user ? user.email : sessionId;
    const q = query(collection(db, 'messages'), where('sender', '==', userId), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const serverMessages = snap.docs.map(d => ({ id: d.id, ...d.data(), sender: 'user' }));
      const replies = snap.docs.filter(d => d.data().adminReply).map(d => ({ id: d.id + '_reply', text: d.data().adminReply, sender: 'bot', isReply: true }));
      
      setMessages(prev => {
          const combined = [...prev];
          serverMessages.forEach(m => { if(!combined.some(p => p.id === m.id)) combined.push(m); });
          replies.forEach(r => { if(!combined.some(p => p.id === r.id)) combined.push(r); });
          return combined.sort((a,b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      });
    });
    return () => unsub();
  }, [isOpen, user, sessionId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userMsg = { id: Date.now(), text: inputText, sender: 'user', createdAt: { seconds: Date.now() / 1000 } };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    
    setTimeout(async () => {
      let botResponse = "";
      const lowerText = userMsg.text.toLowerCase();

      if (isContactAdminMode) {
           botResponse = "تم استلام رسالتك بنجاح! سيقوم الأستاذ أو فريق الدعم بالرد عليك قريباً في هذا الشات. ✅";
           await addDoc(collection(db, 'messages'), {
             text: userMsg.text, 
             sender: user ? user.email : sessionId, 
             senderName: user ? user.displayName : 'زائر المنصة (' + sessionId.substr(0,4) + ')', 
             createdAt: serverTimestamp(), 
             read: false
           });
           setIsContactAdminMode(false);
      } 
      else {
          let matchedRule = null;
          for (const rule of autoReplies) {
              const keywords = rule.keywords.split(',').map(k => k.trim().toLowerCase());
              if (keywords.some(k => lowerText.includes(k) && k.length > 0)) {
                  matchedRule = rule;
                  break; 
              }
          }

          if (matchedRule) {
              botResponse = matchedRule.response;
          } 
          else if (lowerText.includes("ادمن") || lowerText.includes("مستر") || lowerText.includes("تواصل") || lowerText.includes("سؤال")) {
               botResponse = "تفضل بكتابة رسالتك للأستاذ محمد النحاس وسأقوم بنقلها له فوراً: 👇";
               setIsContactAdminMode(true);
          } else {
               botResponse = "أنا هنا لمساعدتك! يمكنك الاستفسار عن المواعيد، الاشتراك، أو طلب الدعم الفني. ما هو سؤالك؟";
          }
      }

      if(botResponse) setMessages(prev => [...prev, { id: Date.now()+1, text: botResponse, sender: 'bot', createdAt: { seconds: Date.now() / 1000 } }]);
    }, 800);
  };

  const openWhatsApp = () => window.open("https://wa.me/201500076322", "_blank");
  const openFacebook = () => window.open("https://www.facebook.com/share/17aiUQWKf5/", "_blank");

  return (
    <>
      <motion.button 
        whileHover={{ scale: 1.1, rotate: 5 }} 
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-10 left-10 z-[100] bg-slate-900 text-amber-500 p-6 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-black transition-all flex items-center justify-center border-2 border-amber-500/20" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={32}/> : <MessageCircle size={36} className="animate-bounce-gentle" />}
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, x: -50, y: 50 }} 
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }} 
            exit={{ opacity: 0, scale: 0.8, x: -50, y: 50 }} 
            className="fixed bottom-32 left-10 z-[100] w-[24rem] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col font-['Cairo'] border border-slate-100 modern-shadow" 
            style={{ height: '580px' }}
          >
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 bg-amber-500 rounded-[1.2rem] flex items-center justify-center shadow-xl rotate-6"><Bot size={28} className="text-slate-900"/></div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-slate-900 animate-pulse"></div>
                </div>
                <div>
                    <h4 className="font-black text-md tracking-tight">مساعد النحاس الذكي</h4>
                    <span className="text-[10px] text-amber-400 font-black uppercase tracking-[2px]">Core AI Integration</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Facebook size={20} onClick={openFacebook} className="cursor-pointer hover:text-amber-500 transition-colors"/>
                <Phone size={20} onClick={openWhatsApp} className="cursor-pointer hover:text-amber-500 transition-colors"/>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-5 scrollbar-hide">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-[2rem] text-sm max-w-[90%] shadow-sm ${
                        msg.sender === 'user' 
                        ? 'bg-amber-600 text-white rounded-br-none shadow-amber-200' 
                        : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed font-bold">{msg.text}</p>
                    {msg.isReply && (
                        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100 opacity-60">
                            <ShieldCheck size={12} className="text-blue-500"/>
                            <span className="text-[9px] font-black uppercase tracking-widest">رد معتمد من الإدارة</span>
                        </div>
                    )}
                  </motion.div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            
            {!isContactAdminMode && (
              <div className="px-5 py-3 bg-white flex gap-3 overflow-x-auto no-select scrollbar-hide border-t border-slate-50">
                <button onClick={() => setInputText("تفاصيل الحجز")} className="text-[11px] bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2 rounded-full whitespace-nowrap font-black hover:bg-amber-500 hover:text-white transition-all">مواعيد السناتر</button>
                <button onClick={() => setInputText("كيفية الاشتراك")} className="text-[11px] bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2 rounded-full whitespace-nowrap font-black hover:bg-amber-500 hover:text-white transition-all">الاشتراك بالمنصة</button>
                <button onClick={() => setInputText("سؤال تعليمي")} className="text-[11px] bg-amber-600 text-white px-4 py-2 rounded-full whitespace-nowrap font-black shadow-lg shadow-amber-200 transition-transform active:scale-95">سؤال للمستر</button>
              </div>
            )}
            
            <div className="p-5 border-t border-slate-100 flex gap-3 bg-white">
              <input 
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] px-5 py-3 text-sm focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-bold" 
                placeholder={isContactAdminMode ? "اكتب رسالتك للمستر هنا..." : "اكتب استفسارك..."} 
              />
              <button 
                onClick={handleSend} 
                className="bg-slate-900 text-amber-500 p-4 rounded-[1.5rem] hover:bg-amber-600 hover:text-white transition-all shadow-xl active:scale-90 flex items-center justify-center"
              >
                <Send size={24}/>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * =================================================================
 * 7. مشغل الفيديو المطور (Secure Video Player)
 * =================================================================
 */

const SecureVideoPlayer = ({ video, userName, onClose }) => {
  const videoId = getYouTubeID(video.url || video.file);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const videoRef = useRef(null);
  const finalUrl = video.url || video.file;

  const changeSpeed = (rate) => {
    setPlaybackRate(rate);
    if(videoRef.current) videoRef.current.playbackRate = rate;
    setShowSettings(false);
  };

  const youtubeEmbedUrl = videoId 
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&autoplay=1&enablejsapi=1&origin=${window.location.origin}` 
    : '';

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-slate-950/98 flex items-center justify-center p-4 md:p-8 backdrop-blur-2xl"
    >
      <div className="w-full max-w-7xl bg-black rounded-[3rem] overflow-hidden relative shadow-[0_0_80px_rgba(0,0,0,0.9)] border border-slate-800 perspective">
        {/* شريط التحكم العلوي */}
        <div className="absolute top-8 right-8 z-[160] flex gap-4">
            <div className="relative">
                <button 
                  onClick={() => setShowSettings(!showSettings)} 
                  className="bg-white/10 hover:bg-white/25 text-white p-4 rounded-2xl backdrop-blur-2xl transition-all border border-white/10 shadow-2xl active:scale-90"
                >
                  <GearIcon size={28}/>
                </button>
                <AnimatePresence>
                {showSettings && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15, rotateX: -20 }} 
                      animate={{ opacity: 1, y: 0, rotateX: 0 }} 
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute top-20 left-0 bg-white text-slate-900 rounded-[2rem] shadow-2xl py-4 w-52 z-[170] overflow-hidden border border-slate-100"
                    >
                        <div className="px-6 py-2 border-b border-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">سرعة العرض</div>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                            <button 
                                key={rate} 
                                onClick={() => changeSpeed(rate)} 
                                className={`block w-full text-right px-6 py-3 hover:bg-amber-50 font-black transition-all ${playbackRate === rate ? 'text-amber-600 bg-amber-50/50' : 'text-slate-600'}`}
                            >
                                {rate === 1 ? 'السرعة الطبيعية (1x)' : `سرعة ${rate}x`}
                            </button>
                        ))}
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
            <button 
              onClick={onClose} 
              className="bg-red-600 hover:bg-red-700 hover:rotate-90 text-white p-4 rounded-2xl shadow-xl shadow-red-500/40 transition-all duration-500 active:scale-90"
            >
              <X size={28}/>
            </button>
        </div>

        {/* حاوية الفيديو الرئيسية */}
        <div className="aspect-video relative flex items-center justify-center bg-black overflow-hidden group">
          
          {/* العلامة المائية المدمجة فوق الفيديو */}
          <DynamicWatermark text={`${userName} - منصة النحاس`} type="video" />
          
          {videoId ? (
            <iframe 
              className="w-full h-full relative z-10 pointer-events-auto" 
              src={youtubeEmbedUrl} 
              title="Educational Lecture" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          ) : (
             <video 
               ref={videoRef} 
               controls 
               autoPlay
               onContextMenu={(e)=>e.preventDefault()}
               controlsList="nodownload" 
               className="w-full h-full object-contain relative z-10" 
               src={finalUrl}
             >
                عفواً، متصفحك قديم ولا يدعم تشغيل هذا الفيديو.
             </video>
          )}

          {/* تراكب معلومات الفيديو */}
          <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-10 group-hover:translate-y-0">
              <div className="flex items-center gap-4 mb-2">
                  <div className="p-2 bg-amber-600 rounded-lg text-white"><PlayCircle size={20}/></div>
                  <h3 className="text-white text-3xl font-black tracking-tight">{video.title}</h3>
              </div>
              <p className="text-amber-500 text-sm font-black tracking-[4px] uppercase mr-12">{getGradeLabel(video.grade)} - المحاضرة معتمدة</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * =================================================================
 * 8. نظام الامتحانات الذكي (Professional Exam Runner)
 * =================================================================
 */

const ExamRunner = ({ exam, user, onClose, isReviewMode = false, existingResult = null }) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState(existingResult?.answers || {});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [isCheating, setIsCheating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(isReviewMode);
  const [score, setScore] = useState(existingResult?.score || 0);
  const [startTime] = useState(Date.now()); 

  const flatQuestions = useMemo(() => {
    const flat = [];
    if (exam.questions) {
        exam.questions.forEach((block) => {
            block.subQuestions.forEach((q) => {
                flat.push({ ...q, blockText: block.text });
            });
        });
    }
    return flat;
  }, [exam.questions]);

  // دالة الحظر التلقائي (الغش)
  const handleCheating = useCallback(async (reason = "محاولة غش") => {
    if(isReviewMode || isSubmitted || isCheating) return;
    setIsCheating(true); 
    setIsSubmitted(true);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    if (exam.attemptId) {
        await updateDoc(doc(db, 'exam_results', exam.attemptId), { 
            score: 0, status: 'cheated', cheatReason: reason, timeTaken: timeTaken, submittedAt: serverTimestamp() 
        });
    }
    await updateDoc(doc(db, 'users', user.uid), { status: 'banned_cheating' });
  }, [exam.attemptId, isCheating, isReviewMode, isSubmitted, startTime, user.uid]);

  // مراقبة اختصارات لوحة المفاتيح
  const handleKeyDown = useCallback((e) => {
    if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
        (e.ctrlKey && e.key === 'U') ||
        e.key === 'PrintScreen'
    ) {
        e.preventDefault();
        handleCheating("محاولة استخدام أدوات المطور أو تصوير الشاشة");
    }
  }, [handleCheating]);

  // تفعيل كافة أنظمة الحماية
  useEffect(() => {
    if (isReviewMode || isSubmitted) return;

    const handleVisibilityChange = () => { 
        if (document.hidden) handleCheating("مغادرة تبويب الامتحان"); 
    };
    const handleBlur = () => {
        handleCheating("تغيير النافذة النشطة أو سحب الإشعارات");
    };
    const handleBeforeUnload = (e) => {
        handleCheating("محاولة إعادة تحميل الصفحة (Refresh)"); 
        e.preventDefault();
        e.returnValue = ''; 
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener('contextmenu', e => e.preventDefault());

    return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("blur", handleBlur);
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener('contextmenu', e => e.preventDefault());
    };
  }, [isSubmitted, isReviewMode, handleCheating, handleKeyDown]);

  // عداد الوقت التنازلي
  useEffect(() => {
    if (isReviewMode || isSubmitted) return;
    if (timeLeft > 0 && !isCheating) {
      const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      handleSubmit(true);
    }
  }, [timeLeft, isSubmitted, isCheating, isReviewMode]);

  const calculateScore = () => {
      let s = 0;
      flatQuestions.forEach(q => {
          if (answers[q.id] === q.correctIdx) s++;
      });
      return s;
  };

  const handleSubmit = async (auto = false) => {
    if (isSubmitted && !auto) return;
    const totalQs = flatQuestions.length;
    if (!auto && Object.keys(answers).length < totalQs && !window.confirm("لا تزال هناك أسئلة بدون إجابة، هل أنت متأكد من تسليم الامتحان الآن؟")) return;
    
    const finalScore = calculateScore();
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    setScore(finalScore);
    setIsSubmitted(true);
    
    if (exam.attemptId) {
        await updateDoc(doc(db, 'exam_results', exam.attemptId), { 
            score: finalScore, 
            total: totalQs, 
            answers, 
            status: 'completed',
            timeTaken: timeTaken,
            totalTime: exam.duration, 
            submittedAt: serverTimestamp() 
        });
    }
  };

  const handleAnswer = (qId, idx) => {
      if (isReviewMode || isSubmitted) return;
      setAnswers(prev => ({ ...prev, [qId]: idx }));
  };

  const currentQObj = flatQuestions[currentQIndex];
  const hasPassage = currentQObj?.blockText && currentQObj.blockText.trim().length > 0;

  // شاشة الحظر
  if (isCheating) return (
    <div className="fixed inset-0 z-[200] bg-red-950 flex items-center justify-center text-white text-center p-8">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <AlertOctagon size={150} className="mx-auto mb-8 text-red-500 animate-pulse"/>
            <h1 className="text-5xl font-black mb-6 uppercase tracking-tighter">لقد تم حظرك!</h1>
            <p className="text-2xl text-red-200 mb-10 max-w-2xl mx-auto leading-relaxed">لقد قمت بمحاولة غش واضحة أو تصوير للشاشة. تم إغلاق حسابك فوراً وإرسال تقرير للأستاذ محمد النحاس.</p>
            <button onClick={() => window.location.reload()} className="bg-white text-red-950 px-16 py-5 rounded-[2rem] font-black text-2xl hover:bg-slate-100 shadow-[0_20px_50px_rgba(255,255,255,0.2)] transition-all">العودة للرئيسية</button>
        </motion.div>
    </div>
  );

  // شاشة النتيجة النهائية
  if (isSubmitted && !isReviewMode) {
     return (
        <div className="fixed inset-0 z-[180] bg-slate-50 overflow-y-auto p-6 md:p-14 font-['Cairo']">
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-5xl mx-auto bg-white rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.08)] p-12 mt-10 text-center border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-600 to-amber-900"></div>
                <div className="w-28 h-28 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><CheckCircle size={60}/></div>
                <h2 className="text-5xl font-black mb-4 text-slate-800 tracking-tight">اكتمل الاختبار!</h2>
                <p className="text-slate-400 font-black text-xl mb-12 uppercase tracking-widest">Exam Successfully Submitted</p>
                
                <div className="flex flex-col md:flex-row justify-center items-center gap-12 my-14">
                    <div className="text-center">
                        <div className={`text-9xl font-black tracking-tighter mb-2 ${score >= flatQuestions.length / 2 ? 'text-green-600' : 'text-red-600'}`}>
                            {score}
                        </div>
                        <span className="text-slate-300 font-black text-2xl uppercase">الدرجة النهائية</span>
                    </div>
                    <div className="w-[2px] h-32 bg-slate-100 hidden md:block"></div>
                    <div className="text-center">
                        <div className="text-9xl font-black tracking-tighter text-slate-900 mb-2">
                            {flatQuestions.length}
                        </div>
                        <span className="text-slate-300 font-black text-2xl uppercase">إجمالي الأسئلة</span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 justify-center items-center mt-16">
                    <button onClick={() => generatePDF('student', {studentName: user.displayName, score, total: flatQuestions.length, status: 'completed', examTitle: exam.title, questions: flatQuestions, answers: answers })} className="w-full md:w-auto bg-blue-600 text-white px-12 py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-2xl shadow-blue-300 hover:bg-blue-700 transition-all hover:-translate-y-1"><Download size={28}/> تحميل شهادة الأداء</button>
                    <button onClick={onClose} className="w-full md:w-auto bg-slate-900 text-white py-5 px-16 rounded-[2rem] font-black text-xl shadow-2xl shadow-slate-300 hover:scale-105 transition-all">العودة للوحة التحكم</button>
                </div>
            </motion.div>
        </div>
     );
  }
  
  if (!currentQObj) return null;

  return (
    <div className="fixed inset-0 z-[180] bg-slate-100 flex flex-col font-['Cairo'] no-select overflow-hidden" dir="rtl">
      
      {/* طبقة العلامة المائية الشفافة المتحركة للوقاية من التصوير */}
      {!isReviewMode && <DynamicWatermark text={`${user.displayName} - ${user.email}`} type="exam" />}
      
      {/* شريط الامتحان العلوي */}
      <div className="bg-slate-900 text-white p-6 flex justify-between items-center shadow-2xl relative z-[190] border-b border-white/5">
        <div className="flex items-center gap-6">
            <div className="p-3 bg-amber-500 rounded-2xl text-slate-900 shadow-xl rotate-3"><ClipboardList size={26}/></div>
            <div>
                <h2 className="font-black text-xl tracking-tight">{exam.title} {isReviewMode && <span className="text-amber-500 mr-2">(مراجعة الإجابات)</span>}</h2>
                <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[3px]">Authorized Assessment Session</span>
                    {!isReviewMode && (
                        <div className="flex items-center gap-2 px-3 py-0.5 bg-red-500/10 text-red-500 rounded-full border border-red-500/20 animate-pulse">
                            <ShieldAlert size={10}/>
                            <span className="text-[9px] font-black uppercase">حماية الغش نشطة</span>
                        </div>
                    )}
                </div>
            </div>
            {!isReviewMode && (
                <div className={`mr-8 px-8 py-3 rounded-[1.2rem] font-mono text-3xl font-black shadow-inner border-2 transition-all flex items-center gap-3 ${timeLeft < 300 ? 'bg-red-600 text-white border-red-400 animate-pulse' : 'bg-slate-800 text-amber-500 border-slate-700'}`}>
                    <Clock size={24}/>
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
            )}
        </div>
        <div className="flex items-center gap-4">
            {!isReviewMode ? (
                <button onClick={() => handleSubmit()} className="bg-green-600 hover:bg-green-700 px-12 py-4 rounded-2xl font-black text-xl shadow-2xl shadow-green-900/40 transition-all active:scale-95 flex items-center gap-3"><Send size={24}/> تسليم الاختبار</button>
            ) : (
                <button onClick={onClose} className="bg-slate-700 hover:bg-slate-800 px-12 py-4 rounded-2xl font-black text-xl shadow-xl transition-all">إغلاق المراجعة</button>
            )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative z-[185]">
        
        {/* شريط التنقل الجانبي بين الأسئلة */}
        <div className="w-24 md:w-32 bg-white border-l border-slate-200 flex flex-col p-4 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 gap-4">
              {flatQuestions.map((q, idx) => {
                  let statusClass = 'bg-slate-50 text-slate-300 border-slate-200';
                  if (isReviewMode) {
                      if (answers[q.id] === q.correctIdx) statusClass = 'bg-green-100 text-green-700 border-green-400 shadow-lg shadow-green-100';
                      else statusClass = 'bg-red-100 text-red-700 border-red-400 shadow-lg shadow-red-100';
                  } else if (answers[q.id] !== undefined) {
                      statusClass = 'bg-slate-900 text-amber-500 border-slate-900 shadow-xl shadow-slate-200 scale-105';
                  }
                  return (
                    <button 
                        key={idx} 
                        onClick={() => setCurrentQIndex(idx)} 
                        className={`relative aspect-square rounded-[1.2rem] font-black text-xl transition-all border-2 flex items-center justify-center ${currentQIndex === idx ? 'ring-4 ring-amber-500 scale-110 z-10' : ''} ${statusClass}`}
                    >
                        {idx + 1}
                        {flagged[q.id] && !isReviewMode && <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 rounded-full border-4 border-white"></div>}
                    </button>
                  )
              })}
          </div>
        </div>

        {/* منطقة المحتوى: القطعة + السؤال */}
        <div className={`flex-1 flex flex-col ${hasPassage ? 'md:flex-row' : 'items-center'} h-full overflow-hidden bg-slate-100/50 w-full`}>
          
          {/* عرض القطعة النصية إن وجدت */}
          {hasPassage && (
            <div className="flex-1 w-full bg-amber-50/40 p-10 md:p-16 overflow-y-auto border-l border-amber-100 shadow-inner">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-10 pb-6 border-b-2 border-amber-200/50">
                    <div className="p-3 bg-amber-600 rounded-2xl text-white shadow-lg"><BookOpen size={32}/></div>
                    <h3 className="font-black text-3xl text-amber-900 tracking-tight">اقرأ النص بتركيز:</h3>
                </div>
                <p className="whitespace-pre-line leading-[2.4] text-2xl font-medium text-slate-800 font-serif tracking-wide px-4">
                    {currentQObj.blockText}
                </p>
              </div>
            </div>
          )}
          
          {/* عرض السؤال والخيارات */}
          <div className={`${hasPassage ? 'flex-1' : 'w-full max-w-5xl mx-auto'} bg-white p-10 md:p-16 overflow-y-auto flex flex-col shadow-2xl m-6 rounded-[4rem] h-fit max-h-[96%] border border-slate-100 relative modern-shadow`}>
            <div className="flex justify-between items-start mb-12">
              <div className="bg-slate-900 text-amber-500 px-8 py-3 rounded-2xl text-sm font-black tracking-[4px] uppercase shadow-xl shadow-slate-200">
                Question {currentQIndex + 1}
              </div>
              {!isReviewMode && (
                <button 
                  onClick={() => { setFlagged({...flagged, [currentQObj.id]: !flagged[currentQObj.id]}) }} 
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-black transition-all ${flagged[currentQObj.id] ? 'bg-amber-100 text-amber-700 shadow-inner ring-2 ring-amber-500' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  <Flag size={20} fill={flagged[currentQObj.id] ? "currentColor" : "none"}/> {flagged[currentQObj.id] ? 'تم التمييز للمراجعة' : 'مراجعة لاحقاً'}
                </button>
              )}
            </div>
            
            <div className="bg-slate-50/60 p-10 rounded-[2.5rem] border-2 border-slate-50 mb-12 shadow-inner group hover:border-amber-100 transition-colors">
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 leading-[1.4] whitespace-pre-line group-hover:text-amber-800 transition-colors tracking-tight">
                {currentQObj.text}
              </h3>
            </div>

            <div className="space-y-5">
              {currentQObj.options.map((opt, idx) => {
                  let optionClass = 'border-slate-100 hover:bg-slate-50 hover:border-slate-300';
                  if (isReviewMode) {
                      if (idx === currentQObj.correctIdx) optionClass = 'border-green-500 bg-green-50 text-green-900 shadow-xl shadow-green-100 ring-2 ring-green-500'; 
                      else if (answers[currentQObj.id] === idx) optionClass = 'border-red-500 bg-red-50 text-red-900 shadow-xl shadow-red-100 ring-2 ring-red-500'; 
                  } else {
                      if (answers[currentQObj.id] === idx) optionClass = 'border-amber-600 bg-amber-600/5 text-amber-950 shadow-2xl shadow-amber-200 ring-4 ring-amber-600/20 scale-[1.02]';
                  }

                  return (
                    <motion.div 
                      whileTap={{ scale: 0.98 }}
                      key={idx} 
                      onClick={() => handleAnswer(currentQObj.id, idx)} 
                      className={`p-7 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-6 text-2xl font-bold ${optionClass}`}
                    >
                      <div className={`w-10 h-10 rounded-[1.2rem] border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                          answers[currentQObj.id] === idx || (isReviewMode && idx === currentQObj.correctIdx) 
                          ? 'bg-amber-600 border-amber-600 shadow-xl shadow-amber-300 rotate-45 scale-110' 
                          : 'border-slate-300 bg-white'
                      }`}>
                        {(answers[currentQObj.id] === idx || (isReviewMode && idx === currentQObj.correctIdx)) && <Check size={24} className="text-white -rotate-45"/>}
                      </div>
                      <span className="whitespace-pre-line leading-relaxed flex-1">{opt}</span>
                      {isReviewMode && idx === currentQObj.correctIdx && <Award className="text-green-600 mr-auto animate-bounce-gentle"/>}
                      {isReviewMode && answers[currentQObj.id] === idx && idx !== currentQObj.correctIdx && <XCircle className="text-red-600 mr-auto animate-shake"/>}
                    </motion.div>
                  )
              })}
            </div>

            <div className="mt-20 flex justify-between gap-8">
              <button 
                disabled={currentQIndex === 0} 
                onClick={() => setCurrentQIndex(p => p - 1)} 
                className="flex-1 py-6 rounded-[2rem] bg-slate-100 text-slate-600 font-black text-xl disabled:opacity-30 hover:bg-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm"
              >
                <ChevronRight className="rotate-180 w-8 h-8"/> السؤال السابق
              </button>
              <button 
                disabled={currentQIndex === flatQuestions.length - 1} 
                onClick={() => setCurrentQIndex(p => p + 1)} 
                className="flex-1 py-6 rounded-[2rem] bg-slate-900 text-white font-black text-xl disabled:opacity-30 hover:bg-black transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95"
              >
                السؤال التالي <ChevronRight className="w-8 h-8"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * =================================================================
 * 9. لوحة تحكم الإدارة (Admin Dashboard) - النسخة الكاملة
 * =================================================================
 */

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('users'); 
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsersList, setActiveUsersList] = useState([]);
  const [contentList, setContentList] = useState([]);
  const [messagesList, setMessagesList] = useState([]); 
  const [newContent, setNewContent] = useState({ title: '', url: '', type: 'video', isPublic: false, grade: '3sec', allowedEmails: '' });
  const [liveData, setLiveData] = useState({ title: '', liveUrl: '', grade: '3sec' });
  const [isLive, setIsLive] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [examBuilder, setExamBuilder] = useState({ title: '', grade: '3sec', duration: 60, startTime: '', endTime: '', questions: [], accessCode: '' });
  const [bulkText, setBulkText] = useState('');
  const [examsList, setExamsList] = useState([]);
  const [examResults, setExamResults] = useState([]); 
  const [viewingResult, setViewingResult] = useState(null); 
  const [newAnnouncement, setNewAnnouncement] = useState(""); 
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  
  const [autoReplies, setAutoReplies] = useState([]);
  const [newAutoReply, setNewAutoReply] = useState({ keywords: '', response: '', isActive: true });
  const [quotesList, setQuotesList] = useState([]);
  const [newQuote, setNewQuote] = useState({ text: '', source: '' });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, 'users'), where('status','==','pending')), s => setPendingUsers(s.docs.map(d=>({id:d.id,...d.data()}))));
    const unsubActive = onSnapshot(query(collection(db, 'users'), where('status', 'in', ['active', 'banned_cheating', 'rejected'])), s => setActiveUsersList(s.docs.map(d=>({id:d.id,...d.data()}))));
    const unsubContent = onSnapshot(query(collection(db, 'content'), orderBy('createdAt','desc')), s => setContentList(s.docs.map(d=>({id:d.id,...d.data()}))));
    const unsubMsgs = onSnapshot(query(collection(db, 'messages'), orderBy('createdAt','desc')), s => setMessagesList(s.docs.map(d=>({id:d.id,...d.data()}))));
    const unsubLive = onSnapshot(query(collection(db, 'live_sessions'), where('status', '==', 'active')), s => setIsLive(!s.empty));
    const unsubExams = onSnapshot(query(collection(db, 'exams'), orderBy('createdAt', 'desc')), s => setExamsList(s.docs.map(d=>({id:d.id,...d.data()}))));
    const unsubResults = onSnapshot(query(collection(db, 'exam_results'), orderBy('submittedAt', 'desc')), s => setExamResults(s.docs.map(d=>({id:d.id,...d.data()}))));
    const unsubAnnounce = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), s => setAnnouncements(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubAuto = onSnapshot(collection(db, 'auto_replies'), s => setAutoReplies(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubQuotes = onSnapshot(collection(db, 'quotes'), s => setQuotesList(s.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => {
        unsubUsers(); unsubActive(); unsubContent(); unsubMsgs(); unsubLive(); unsubExams(); unsubResults(); unsubAnnounce(); unsubAuto(); unsubQuotes();
    };
  }, []);

  const handleApprove = async (id) => {
    await updateDoc(doc(db,'users',id), {status:'active'});
    sendSystemNotification("إشعار الإدارة", "تم قبول الطالب بنجاح.");
  };
  const handleReject = async (id) => updateDoc(doc(db,'users',id), {status:'rejected'});
  const handleUnban = async (id) => updateDoc(doc(db,'users',id), {status:'active'});
  const handleDeleteUser = async (id) => { if(window.confirm("حذف الطالب نهائياً؟")) await deleteDoc(doc(db,'users',id)); };
  const handleDeleteMessage = async (id) => { if(window.confirm("حذف الرسالة؟")) await deleteDoc(doc(db,'messages',id)); };
  const handleDeleteExam = async (id) => { if(window.confirm("حذف الامتحان؟")) await deleteDoc(doc(db, 'exams', id)); };
  const handleDeleteAnnouncement = async (id) => { if(window.confirm("حذف الإعلان؟")) await deleteDoc(doc(db, 'announcements', id)); };
  const handleDeleteResult = async (resultId) => { if(window.confirm("حذف النتيجة؟")) await deleteDoc(doc(db, 'exam_results', resultId)); };
  
  const handleReplyMessage = async (msgId) => {
    const text = replyTexts[msgId];
    if (!text?.trim()) return;
    await updateDoc(doc(db, 'messages', msgId), { adminReply: text });
    setReplyTexts(prev => ({ ...prev, [msgId]: '' }));
    alert("تم الرد");
  };
  
  const handleAddAnnouncement = async () => {
      if(!newAnnouncement.trim()) return;
      await addDoc(collection(db, 'announcements'), { text: newAnnouncement, createdAt: serverTimestamp() });
      await addDoc(collection(db, 'notifications'), { text: `إعلان جديد: ${newAnnouncement}`, grade: 'all', createdAt: serverTimestamp() });
      setNewAnnouncement("");
  };

  const handleUpdateUser = async (e) => { 
    e.preventDefault(); 
    if(!editingUser) return; 
    await updateDoc(doc(db, 'users', editingUser.id), { ...editingUser }); 
    setEditingUser(null); 
  };

  const handleAddContent = async (e) => {
      e.preventDefault();
      const emails = newContent.allowedEmails ? newContent.allowedEmails.split(',').map(e => e.trim()) : [];
      await addDoc(collection(db, 'content'), { ...newContent, allowedEmails: emails, createdAt: serverTimestamp() });
      alert("تم النشر");
      setNewContent({ title: '', url: '', type: 'video', isPublic: false, grade: '3sec', allowedEmails: '' });
  };

  const parseExam = async () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l);
    const blocks = [];
    let currentBlock = { text: '', subQuestions: [] };
    let currentQ = null;
    let isReadingPassage = false;

    lines.forEach(line => {
      if (line === 'بداية القطعة') { if (currentBlock.subQuestions.length > 0 || currentQ) { if(currentQ) currentBlock.subQuestions.push(currentQ); blocks.push(currentBlock); } currentBlock = { text: '', subQuestions: [] }; currentQ = null; isReadingPassage = true; return; }
      if (line === 'نهاية القطعة') { isReadingPassage = false; return; }
      if (line === 'حذف القطعة') { if(currentQ) currentBlock.subQuestions.push(currentQ); blocks.push(currentBlock); currentBlock = { text: '', subQuestions: [] }; currentQ = null; return; }

      if (isReadingPassage) { currentBlock.text += line + '\n'; } 
      else {
        if (line.startsWith('*') || (currentQ && currentQ.options.length < 4)) {
          if (!currentQ) return; 
          const isCorrect = line.startsWith('*');
          const optText = isCorrect ? line.substring(1).trim() : line;
          if (isCorrect) currentQ.correctIdx = currentQ.options.length;
          currentQ.options.push(optText);
        } else {
          if (currentQ) currentBlock.subQuestions.push(currentQ);
          currentQ = { id: Date.now() + Math.random(), text: line, options: [], correctIdx: 0 };
        }
      }
    });
    if (currentQ) currentBlock.subQuestions.push(currentQ);
    blocks.push(currentBlock);

    await addDoc(collection(db, 'exams'), { ...examBuilder, questions: blocks, createdAt: serverTimestamp() });
    setBulkText(""); alert("تم النشر");
  };
const startLiveStream = async () => {
    if (!liveData.liveUrl || !liveData.title) return alert("يرجى ملء رابط البث والعنوان!");
    try {
      await addDoc(collection(db, 'live_sessions'), { ...liveData, status: 'active', createdAt: serverTimestamp() });
      await addDoc(collection(db, 'notifications'), { text: `بث مباشر الآن: ${liveData.title}`, grade: liveData.grade, createdAt: serverTimestamp() });
      setIsLive(true);
      alert("تم بدء البث وإشعار الطلاب بنجاح! 🔴");
    } catch (e) { console.error(e); alert("حدث خطأ أثناء بدء البث"); }
  };

  const stopLiveStream = async () => {
    try {
      const q = query(collection(db, 'live_sessions'), where('status', '==', 'active'));
      const snap = await getDocs(q);
      snap.forEach(async (d) => await updateDoc(doc(db, 'live_sessions', d.id), { status: 'ended' }));
      setIsLive(false);
      alert("تم إيقاف البث المباشر ⬛");
    } catch (e) { console.error(e); }
  };

  // 2. دوال الرد الآلي
  const handleAddAutoReply = async () => {
      if(!newAutoReply.keywords || !newAutoReply.response) return alert("اكتب الكلمات الدالة والرد!");
      await addDoc(collection(db, 'auto_replies'), { ...newAutoReply, isActive: true });
      setNewAutoReply({ keywords: '', response: '', isActive: true });
      alert("تم حفظ قاعدة الرد الآلي ✅");
  };

  const toggleAutoReply = async (id, currentStatus) => {
      await updateDoc(doc(db, 'auto_replies', id), { isActive: !currentStatus });
  };

  const deleteAutoReply = async (id) => {
      if(window.confirm("هل أنت متأكد من حذف هذا الرد التلقائي؟")) await deleteDoc(doc(db, 'auto_replies', id));
  };

  // 3. دوال الحكم والأقوال
  const handleAddQuote = async () => {
    if(!newQuote.text || !newQuote.source) return alert("اكتب نص الحكمة والمصدر!");
    await addDoc(collection(db, 'quotes'), { ...newQuote, createdAt: serverTimestamp() });
    setNewQuote({ text: '', source: '' });
    alert("تم نشر الحكمة الجديدة 📢");
  };

  const deleteQuote = async (id) => {
     if(window.confirm("حذف هذه الحكمة؟")) await deleteDoc(doc(db, 'quotes', id));
  };

  // 4. دوال الإعدادات (لوحة الشرف)
  const toggleLeaderboard = async () => {
     const newStatus = !showLeaderboard;
     setShowLeaderboard(newStatus);
     // حفظ الإعداد في قاعدة البيانات لكي يراه الطلاب
     await setDoc(doc(db, 'settings', 'config'), { show: newStatus }, { merge: true });
  };

  const handleSendResetPassword = async (email) => {
     try {
        await sendPasswordResetEmail(auth, email);
        alert("تم إرسال رابط إعادة تعيين كلمة المرور للطالب.");
     } catch (err) { alert("حدث خطأ، تأكد من صحة البريد."); }
  };
  
  const handleDeleteContent = async (id) => {
      if(window.confirm("هل أنت متأكد من حذف هذا المحتوى؟")) await deleteDoc(doc(db, 'content', id));
  };
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-['Cairo']" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 gap-6">
        <div className="flex items-center gap-5">
            <div className="p-4 bg-slate-900 text-amber-500 rounded-[1.5rem] shadow-2xl"><ShieldAlert size={36}/></div>
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tighter">لوحة التحكم الإدارية</h1>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[4px]">Advanced Management Suite v2.0</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
                <span className="text-amber-600 font-black text-sm uppercase">Administrator</span>
                <span className="text-slate-400 text-[10px] font-bold">{user.email}</span>
            </div>
            <button onClick={() => signOut(auth)} className="bg-red-50 text-red-600 font-black px-8 py-3 rounded-2xl border-2 border-red-100 hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-xl shadow-red-100">تسجيل الخروج</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
        {/* القائمة الجانبية للأدمن */}
        <div className="lg:col-span-1 space-y-3">
          {[
            { id: 'users', label: 'الطلبات', icon: <Users size={20}/> },
            { id: 'all_users', label: 'الطلاب', icon: <Smartphone size={20}/> },
            { id: 'exams', label: 'الامتحانات', icon: <ClipboardList size={20}/> },
            { id: 'results', label: 'النتائج', icon: <Award size={20}/> },
            { id: 'live', label: 'البث', icon: <Radio size={20}/> },
            { id: 'content', label: 'المحتوى', icon: <Layers size={20}/> },
            { id: 'messages', label: 'الرسائل', icon: <MessageSquare size={20}/> },
            { id: 'auto_reply', label: 'الرد الآلي', icon: <Bot size={20}/> },
            { id: 'quotes', label: 'الحكم', icon: <PenTool size={20}/> },
            { id: 'settings', label: 'الإعدادات', icon: <GearIcon size={20}/> }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`w-full text-right p-5 rounded-[1.5rem] font-black flex items-center gap-4 transition-all duration-300 ${
                activeTab === tab.id 
                ? 'bg-slate-900 text-amber-500 shadow-2xl shadow-slate-300 translate-x-2' 
                : 'bg-white text-slate-500 hover:bg-white hover:shadow-lg'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* منطقة المحتوى للأدمن */}
        <div className="lg:col-span-5 bg-white p-10 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.03)] border border-slate-50 min-h-[80vh]">
          
          {activeTab === 'users' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-2xl font-black mb-8 text-slate-800 flex items-center gap-3"><RefreshCw className="text-amber-600"/> طلبات الانضمام الجديدة</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pendingUsers.length === 0 ? <p className="text-slate-400 font-bold col-span-2 text-center py-20">لا توجد طلبات معلقة حالياً</p> : pendingUsers.map(u=>(
                          <div key={u.id} className="border-2 border-slate-50 p-8 rounded-[2.5rem] bg-slate-50/30 flex flex-col justify-between hover:border-amber-200 transition-colors">
                              <div className="mb-6">
                                  <h4 className="font-black text-slate-800 text-2xl mb-1">{u.name}</h4>
                                  <div className="flex gap-2 mb-3">
                                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-black">{getGradeLabel(u.grade)}</span>
                                    <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-xs font-black">{u.phone}</span>
                                  </div>
                                  <p className="text-xs text-slate-400 font-bold">{u.email}</p>
                              </div>
                              <div className="flex gap-3">
                                  <button onClick={()=>handleApprove(u.id)} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-green-100 active:scale-95">تفعيل</button>
                                  <button onClick={()=>handleReject(u.id)} className="flex-1 bg-white text-red-600 border-2 border-red-50 py-4 rounded-2xl font-black text-lg hover:bg-red-50 active:scale-95">رفض</button>
                              </div>
                          </div>
                      ))}
                  </div>
              </motion.div>
          )}

          {activeTab === 'all_users' && (
              <div>
                  <div className="flex justify-between items-center mb-10">
                    <h2 className="text-2xl font-black text-slate-800">إدارة قاعدة بيانات الطلاب</h2>
                    <div className="flex gap-2">
                        <div className="relative"><Search className="absolute top-3 right-4 text-slate-300"/><input className="bg-slate-50 border-0 p-3 pr-12 rounded-xl text-sm w-64" placeholder="ابحث باسم الطالب..."/></div>
                    </div>
                  </div>
                  {editingUser && (
                      <form onSubmit={handleUpdateUser} className="mb-12 bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative">
                          <button onClick={()=>setEditingUser(null)} className="absolute top-6 left-6 text-slate-500 hover:text-white"><X/></button>
                          <h3 className="font-black text-xl mb-8 border-b border-slate-800 pb-4">تحديث بيانات الطالب</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-amber-500 mr-2">الاسم بالكامل</label><input className="w-full bg-slate-850 border-0 p-4 rounded-2xl" value={editingUser.name} onChange={e=>setEditingUser({...editingUser, name:e.target.value})}/></div>
                              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-amber-500 mr-2">رقم الهاتف</label><input className="w-full bg-slate-850 border-0 p-4 rounded-2xl" value={editingUser.phone} onChange={e=>setEditingUser({...editingUser, phone:e.target.value})}/></div>
                              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-amber-500 mr-2">المرحلة الدراسية</label><select className="w-full bg-slate-850 border-0 p-4 rounded-2xl font-black" value={editingUser.grade} onChange={e=>setEditingUser({...editingUser, grade:e.target.value})}><GradeOptions/></select></div>
                              <div className="flex items-end"><button className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black text-lg shadow-2xl shadow-amber-900/40">حفظ كافة التغييرات</button></div>
                          </div>
                      </form>
                  )}
                  <div className="space-y-4">
                      {activeUsersList.map(u=>(
                          <div key={u.id} className={`flex flex-col md:flex-row justify-between items-center p-6 border-2 rounded-[2.5rem] transition-all hover:bg-slate-50 ${u.status==='banned_cheating'?'border-red-100 bg-red-50/20':'border-slate-50 bg-white'}`}>
                              <div className="flex items-center gap-6 mb-4 md:mb-0">
                                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner ${u.status === 'banned_cheating' ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-900 text-amber-500'}`}>
                                      {u.name.charAt(0)}
                                  </div>
                                  <div>
                                      <p className="font-black text-slate-800 text-xl">{u.name}</p>
                                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{u.email}</p>
                                      {u.status==='banned_cheating' && <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black uppercase mt-2 inline-block">محظور غش</span>}
                                  </div>
                              </div>
                              <div className="flex gap-3">
                                  {u.status==='banned_cheating' ? (
                                      <button onClick={()=>handleUnban(u.id)} className="bg-green-100 text-green-700 px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 border border-green-200 hover:bg-green-600 hover:text-white transition-all"><Unlock size={16}/> فك الحظر المباشر</button>
                                  ) : (
                                      <button onClick={()=>setEditingUser(u)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"><Edit size={22}/></button>
                                  )}
                                  <button onClick={()=>handleSendResetPassword(u.email)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-amber-600 hover:text-white transition-all active:scale-90"><KeyRound size={22}/></button>
                                  <button onClick={()=>handleDeleteUser(u.id)} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-90"><Trash2 size={22}/></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'exams' && (
              <div className="space-y-12">
                  <div className="bg-slate-50 p-10 rounded-[3.5rem] border-2 border-slate-100 relative overflow-hidden">
                      <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl"></div>
                      <h3 className="font-black text-2xl mb-10 flex items-center gap-4 text-slate-800"><PlusCircle className="text-amber-600" size={32}/> بناء اختبار تفاعلي جديد</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                          <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">عنوان الاختبار</label><input className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:border-amber-500 outline-none transition-all" placeholder="مثال: اختبار الوحدة الأولى" value={examBuilder.title} onChange={e=>setExamBuilder({...examBuilder, title:e.target.value})}/></div>
                          <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">كود الدخول</label><input className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:border-amber-500 outline-none transition-all font-black text-center" placeholder="1234" value={examBuilder.accessCode} onChange={e=>setExamBuilder({...examBuilder, accessCode:e.target.value})}/></div>
                          <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">المدة (بالدقائق)</label><input type="number" className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:border-amber-500 outline-none transition-all text-center" value={examBuilder.duration} onChange={e=>setExamBuilder({...examBuilder, duration:parseInt(e.target.value)})}/></div>
                          <div className="md:col-span-4 space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">الصف الموجه له</label><select className="w-full border-2 border-slate-200 p-4 rounded-2xl font-black bg-white" value={examBuilder.grade} onChange={e=>setExamBuilder({...examBuilder, grade:e.target.value})}><GradeOptions/></select></div>
                      </div>
                      <div className="space-y-2 mb-8">
                        <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">محتوى الأسئلة (التنسيق المعتمد)</label>
                        <textarea className="w-full border-2 border-slate-200 p-8 rounded-[2.5rem] h-96 font-mono text-sm shadow-inner focus:border-amber-500 outline-none transition-all" placeholder="بداية القطعة\nالنص هنا...\nنهاية القطعة\nالسؤال الأول\n*خيار صحيح\nخيار خطأ\n..." value={bulkText} onChange={e=>setBulkText(e.target.value)}/>
                      </div>
                      <button onClick={parseExam} className="w-full bg-slate-900 text-amber-500 py-6 rounded-[2rem] font-black text-2xl hover:bg-black transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4"><Zap size={28}/> إطلاق الاختبار على المنصة</button>
                  </div>
                  <div>
                      <h3 className="font-black text-xl mb-6 flex items-center gap-3"><Hash className="text-slate-400"/> الأرشيف الجاري</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {examsList.map(ex=>(
                              <div key={ex.id} className="flex justify-between items-center p-6 bg-white border-2 border-slate-50 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                                  <div>
                                      <p className="font-black text-slate-800 text-lg mb-1">{ex.title}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px]">Code: <span className="text-amber-600">{ex.accessCode}</span> | {getGradeLabel(ex.grade)}</p>
                                  </div>
                                  <button onClick={()=>handleDeleteExam(ex.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors active:scale-90"><Trash2 size={24}/></button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'results' && (
              <div>
                  <div className="flex justify-between items-center mb-10">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Trophy className="text-amber-500"/> تحليل نتائج الاختبارات</h2>
                    <button className="text-xs font-black uppercase text-amber-600 border-2 border-amber-100 px-6 py-2 rounded-xl hover:bg-amber-50 transition-colors">تصدير إكسيل</button>
                  </div>
                  <div className="space-y-4">
                      {examResults.length === 0 ? <p className="text-center py-20 text-slate-300">لا توجد نتائج مسجلة حتى الآن</p> : examResults.map(res => (
                          <div key={res.id} className={`flex flex-col md:flex-row justify-between items-center p-7 border-2 rounded-[3rem] transition-all ${res.status==='cheated' ? 'bg-red-50 border-red-100 shadow-red-50' : 'bg-white border-slate-50 shadow-sm'}`}>
                              <div className="flex items-center gap-6 mb-4 md:mb-0">
                                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black ${res.status==='cheated' ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                                      {res.studentName.charAt(0)}
                                  </div>
                                  <div>
                                      <p className="font-black text-slate-800 text-xl">{res.studentName}</p>
                                      <div className="flex gap-3 mt-1">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Status: {res.status === 'cheated' ? '❌ Blocked' : '✅ Completed'}</span>
                                          <span className="text-[10px] font-black text-amber-600 uppercase tracking-tighter">Score: {res.score} / {res.total}</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="flex gap-3">
                                  <button onClick={()=>handleDeleteResult(res.id)} className="px-8 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-xs hover:bg-red-600 hover:text-white transition-all active:scale-95 border border-red-100">حذف وإعادة</button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'auto_reply' && (
              <div className="space-y-10">
                  <div className="bg-slate-50 p-10 rounded-[3rem] border-2 border-slate-100">
                      <h3 className="font-black text-xl mb-8 flex items-center gap-3"><Bot className="text-amber-600"/> برمجة الرد الآلي الذكي</h3>
                      <div className="grid gap-6">
                          <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase mr-2">كلمات البحث (افصل بينها بفاصلة)</label><input className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:border-amber-500 outline-none transition-all" placeholder="مثال: سعر، حجز، سنتر، ميعاد" value={newAutoReply.keywords} onChange={e=>setNewAutoReply({...newAutoReply, keywords:e.target.value})}/></div>
                          <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase mr-2">محتوى الرد التلقائي</label><textarea className="w-full border-2 border-slate-200 p-4 rounded-2xl h-32 focus:border-amber-500 outline-none transition-all" placeholder="اكتب الرد الذي سيظهر للطالب..." value={newAutoReply.response} onChange={e=>setNewAutoReply({...newAutoReply, response:e.target.value})}/></div>
                          <button onClick={handleAddAutoReply} className="w-full bg-amber-600 text-white py-5 rounded-2xl font-black text-xl shadow-2xl shadow-amber-200 hover:bg-amber-700 transition-all active:scale-95">حفظ القاعدة البرمجية</button>
                      </div>
                  </div>
                  <div className="space-y-4">
                      {autoReplies.map(rule => (
                          <div key={rule.id} className={`p-8 rounded-[2.5rem] border-2 flex justify-between items-center transition-all ${rule.isActive ? 'bg-white border-green-100 shadow-md shadow-green-50' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                              <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><p className="font-black text-slate-800 uppercase text-xs tracking-[2px]">Keywords: {rule.keywords}</p></div>
                                  <p className="text-slate-600 font-bold text-lg leading-relaxed">{rule.response}</p>
                              </div>
                              <div className="flex gap-3 ml-6">
                                  <button onClick={()=>toggleAutoReply(rule.id, rule.isActive)} className={`p-4 rounded-2xl transition-all active:scale-90 ${rule.isActive ? 'text-green-600 bg-green-50 hover:bg-green-600 hover:text-white' : 'text-slate-400 bg-slate-100'}`}><Power size={24}/></button>
                                  <button onClick={()=>deleteAutoReply(rule.id)} className="p-4 text-red-500 bg-red-50 rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-90"><Trash2 size={24}/></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'live' && (
              <div className="max-w-4xl mx-auto py-10">
                  <div className="bg-red-50 border-4 border-red-100 p-12 rounded-[4rem] text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl"></div>
                      <Radio size={80} className="mx-auto text-red-600 mb-8 animate-pulse"/>
                      <h2 className="text-4xl font-black text-slate-800 mb-6 tracking-tighter">بث مباشر للمحاضرة</h2>
                      <p className="text-slate-500 font-bold mb-12 text-lg">تحكم في ظهور غرفة البث المباشر للطلاب المسجلين في المنصة.</p>
                      
                      <div className="space-y-6 text-right">
                          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-red-400 mr-4">رابط الغرفة (YouTube/Meet/Zoom)</label><input className="w-full p-5 rounded-[2rem] border-2 border-red-100 focus:border-red-500 outline-none transition-all font-bold" placeholder="أدخل الرابط هنا..." value={liveData.liveUrl} onChange={e=>setLiveData({...liveData, liveUrl:e.target.value})}/></div>
                          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-red-400 mr-4">عنوان المحاضرة المباشرة</label><input className="w-full p-5 rounded-[2rem] border-2 border-red-100 focus:border-red-500 outline-none transition-all font-bold" placeholder="مثال: مراجعة نهائية ليلة الامتحان" value={liveData.title} onChange={e=>setLiveData({...liveData, title:e.target.value})}/></div>
                          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-red-400 mr-4">المرحلة المستهدفة</label><select className="w-full p-5 rounded-[2rem] border-2 border-red-100 focus:border-red-500 outline-none transition-all font-black bg-white" value={liveData.grade} onChange={e=>setLiveData({...liveData, grade:e.target.value})}><GradeOptions/></select></div>
                      </div>

                      <div className="mt-12">
                          {!isLive ? (
                              <button onClick={startLiveStream} className="w-full bg-red-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-4">انطلاق الآن 🔴</button>
                          ) : (
                              <button onClick={stopLiveStream} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-4">إيقاف البث ⬛</button>
                          )}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'content' && (
              <div className="space-y-12">
                  <div className="bg-slate-50 p-10 rounded-[3.5rem] border-2 border-slate-100">
                      <h3 className="font-black text-2xl mb-8 flex items-center gap-4 text-slate-800"><UploadCloud className="text-blue-600" size={32}/> رفع محتوى تعليمي ذكي</h3>
                      <form onSubmit={handleAddContent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">عنوان المحتوى</label><input required className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:border-blue-500 outline-none transition-all" placeholder="مثال: شرح درس النحو الشامل" value={newContent.title} onChange={e=>setNewContent({...newContent, title:e.target.value})}/></div>
                          <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">رابط الفيديو أو الملف</label><input required className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:border-blue-500 outline-none transition-all" placeholder="ضع الرابط المباشر هنا..." value={newContent.url} onChange={e=>setNewContent({...newContent, url:e.target.value})}/></div>
                          
                          {/* سحب الملفات محلياً */}
                          <div className="md:col-span-2 border-4 border-dashed border-slate-200 rounded-[2.5rem] p-10 text-center hover:bg-slate-100 transition-all relative group">
                              <input type="file" onChange={(e)=>{
                                  const file = e.target.files[0];
                                  if(!file) return;
                                  setIsUploading(true);
                                  const reader = new FileReader();
                                  reader.onprogress = (p) => setUploadProgress(Math.round((p.loaded/p.total)*100));
                                  reader.onloadend = () => { setNewContent({...newContent, url: reader.result}); setIsUploading(false); setUploadProgress(100); };
                                  reader.readAsDataURL(file);
                              }} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                              <div className="flex flex-col items-center gap-4">
                                  <div className="p-6 bg-white rounded-[2rem] shadow-xl text-blue-600 group-hover:scale-110 transition-transform"><Upload size={40}/></div>
                                  <div>
                                      <p className="font-black text-slate-800 text-lg">اضغط أو اسحب الملف هنا</p>
                                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Max file size: 1MB (Database Limit)</p>
                                  </div>
                              </div>
                              {isUploading && (
                                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center rounded-[2.5rem] z-20">
                                      <RefreshCw className="animate-spin text-blue-600 mb-4" size={40}/>
                                      <p className="font-black text-blue-600">جاري قراءة البيانات... {uploadProgress}%</p>
                                      <div className="w-2/3 h-3 bg-slate-100 rounded-full mt-4 overflow-hidden"><div className="h-full bg-blue-600 transition-all" style={{width: `${uploadProgress}%`}}></div></div>
                                  </div>
                              )}
                              {!isUploading && uploadProgress === 100 && (
                                  <div className="absolute inset-0 bg-green-50/95 flex flex-col items-center justify-center rounded-[2.5rem] z-20">
                                      <CheckCircle className="text-green-600 mb-2" size={40}/>
                                      <p className="font-black text-green-600">تم تجهيز الملف للنشر!</p>
                                  </div>
                              )}
                          </div>

                          <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">نوع المحتوى</label><select className="w-full border-2 border-slate-200 p-4 rounded-2xl font-black bg-white" value={newContent.type} onChange={e=>setNewContent({...newContent, type:e.target.value})}><option value="video">محاضرة فيديو</option><option value="file">ملخص PDF</option></select></div>
                          <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">الصف الدراسي</label><select className="w-full border-2 border-slate-200 p-4 rounded-2xl font-black bg-white" value={newContent.grade} onChange={e=>setNewContent({...newContent, grade:e.target.value})}><GradeOptions/></select></div>
                          
                          <div className="md:col-span-2 space-y-2 bg-white p-6 rounded-3xl border-2 border-slate-100">
                              <label className="text-[10px] font-black text-slate-400 mr-2 uppercase flex items-center gap-2"><Lock size={12}/> تخصيص لمشتركين محددين (اختياري)</label>
                              <textarea className="w-full border-0 bg-slate-50 p-4 rounded-xl text-xs font-bold" placeholder="اكتب إيميلات الطلاب هنا مفصولة بفاصلة (مثال: s1@g.com, s2@g.com)... اتركها فارغة للجميع" value={newContent.allowedEmails} onChange={e=>setNewContent({...newContent, allowedEmails:e.target.value})}/>
                          </div>

                          <div className="md:col-span-2 flex items-center gap-3 px-4">
                              <input type="checkbox" id="pub" className="w-6 h-6 accent-blue-600" checked={newContent.isPublic} onChange={e=>setNewContent({...newContent, isPublic:e.target.checked})}/> 
                              <label htmlFor="pub" className="font-black text-slate-700 cursor-pointer">نشر في الصفحة الرئيسية (متاح للزوار)</label>
                          </div>
                          
                          <button className="md:col-span-2 bg-blue-600 text-white py-5 rounded-[2rem] font-black text-2xl shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 mt-4">نشر المحتوى الآن</button>
                      </form>
                  </div>
                  <div className="space-y-3">
                      <h3 className="font-black text-lg mb-4 px-4 border-r-4 border-blue-600">المحتوى المنشور حالياً</h3>
                      {contentList.map(c=>(
                          <div key={c.id} className="flex justify-between items-center p-6 bg-white border-2 border-slate-50 rounded-[2.5rem] shadow-sm group hover:border-blue-200 transition-all">
                              <div className="flex items-center gap-5">
                                  <div className={`p-4 rounded-2xl ${c.type==='video'?'bg-blue-100 text-blue-600':'bg-red-100 text-red-600'}`}>{c.type==='video'?<Video/>:<FileText/>}</div>
                                  <div>
                                      <p className="font-black text-slate-800 text-xl">{c.title}</p>
                                      <div className="flex gap-3 mt-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{getGradeLabel(c.grade)}</span>
                                        {c.allowedEmails && c.allowedEmails.length > 0 && <span className="text-[9px] bg-slate-900 text-amber-500 px-2 rounded-full font-black uppercase tracking-tighter flex items-center gap-1"><Lock size={8}/> Private Access</span>}
                                      </div>
                                  </div>
                              </div>
                              <button onClick={() => handleDeleteContent(c.id)} className="p-4 text-red-400 hover:text-red-600 transition-colors active:scale-90"><Trash2 size={26}/></button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'messages' && (
              <div>
                  <h2 className="text-2xl font-black mb-8 text-slate-800 flex items-center gap-4"><MessageCircle className="text-blue-500" size={32}/> صندوق رسائل الطلاب</h2>
                  <div className="grid grid-cols-1 gap-6">
                      {messagesList.length === 0 ? <p className="text-center py-20 text-slate-300">لا توجد رسائل واردة حالياً</p> : messagesList.map(m=>(
                          <div key={m.id} className="border-2 border-slate-50 p-8 bg-white rounded-[3rem] shadow-sm relative group hover:border-blue-100 transition-all">
                              <button onClick={()=>handleDeleteMessage(m.id)} className="absolute top-8 left-8 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                              <div className="flex items-center gap-4 mb-6">
                                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 tracking-tighter uppercase text-xs shadow-inner">
                                      {m.senderName.substring(0,2)}
                                  </div>
                                  <div>
                                      <h4 className="font-black text-slate-800 text-lg">{m.senderName}</h4>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{m.sender} | {m.createdAt?.toDate().toLocaleString()}</p>
                                  </div>
                              </div>
                              <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-50 mb-6 italic text-slate-700 font-bold leading-relaxed shadow-inner">
                                  {m.text}
                              </div>
                              {m.adminReply ? (
                                  <div className="bg-green-50 p-6 rounded-[2rem] border-2 border-green-100 flex gap-4">
                                      <div className="p-2 bg-green-600 rounded-lg text-white h-fit mt-1"><Reply size={16}/></div>
                                      <div>
                                          <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">رد الإدارة المعتمد:</p>
                                          <p className="text-green-900 font-black">{m.adminReply}</p>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="flex flex-col md:flex-row gap-3">
                                      <input 
                                        className="flex-1 bg-white border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all font-bold" 
                                        placeholder="اكتب ردك هنا..." 
                                        value={replyTexts[m.id]||""} 
                                        onChange={e=>setReplyTexts({...replyTexts,[m.id]:e.target.value})}
                                      />
                                      <button 
                                        onClick={()=>handleReplyMessage(m.id)} 
                                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                                      >
                                        إرسال الرد
                                      </button>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'quotes' && (
              <div className="space-y-10">
                  <div className="bg-slate-50 p-10 rounded-[3rem] border-2 border-slate-100">
                      <h3 className="font-black text-xl mb-8">إضافة حكمة أو قول مأثور</h3>
                      <div className="grid gap-6">
                          <input className="w-full border-2 border-slate-200 p-5 rounded-[1.5rem] focus:border-amber-500 outline-none font-bold" placeholder="نص الحكمة..." value={newQuote.text} onChange={e=>setNewQuote({...newQuote, text:e.target.value})} />
                          <input className="w-full border-2 border-slate-200 p-5 rounded-[1.5rem] focus:border-amber-500 outline-none font-black" placeholder="المصدر (مثال: المتنبي)" value={newQuote.source} onChange={e=>setNewQuote({...newQuote, source:e.target.value})} />
                          <button onClick={handleAddQuote} className="w-full bg-slate-900 text-amber-500 py-5 rounded-[1.5rem] font-black text-xl shadow-2xl hover:bg-black transition-all">إضافة للأرشيف</button>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {quotesList.map(q => (
                          <div key={q.id} className="p-6 rounded-[2rem] border-2 bg-white flex justify-between items-center shadow-sm">
                              <div><p className="font-black text-slate-800 leading-relaxed mb-1">"{q.text}"</p><p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">- {q.source}</p></div>
                              <button onClick={() => deleteQuote(q.id)} className="p-4 text-red-400 hover:text-red-600 transition-all active:scale-90"><Trash2 size={24} /></button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'settings' && (
              <div className="space-y-12">
                  <h2 className="text-2xl font-black mb-8 text-slate-800">إعدادات المنصة العامة</h2>
                  
                  <div className="bg-slate-50 p-10 rounded-[4rem] border-2 border-slate-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl"></div>
                      <h3 className="font-black text-xl mb-6 text-amber-600 flex items-center gap-3"><Megaphone/> شريط الإعلانات العلوية</h3>
                      <div className="flex flex-col md:flex-row gap-4 mb-8">
                          <input className="flex-1 border-2 border-slate-200 p-5 rounded-[1.5rem] focus:border-amber-500 outline-none font-bold" placeholder="اكتب نص الإعلان هنا..." value={newAnnouncement} onChange={e=>setNewAnnouncement(e.target.value)} />
                          <button onClick={handleAddAnnouncement} className="bg-amber-600 text-white px-10 py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-amber-200 hover:bg-amber-700 transition-all active:scale-95">نشر الإعلان</button>
                      </div>
                      <div className="space-y-3">
                          {announcements.map(a => (
                              <div key={a.id} className="flex justify-between items-center bg-white p-5 rounded-[1.5rem] border-2 border-slate-50 shadow-sm">
                                  <div className="flex items-center gap-3"><div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div><span className="font-black text-slate-700">{a.text}</span></div>
                                  <button onClick={() => handleDeleteAnnouncement(a.id)} className="p-3 text-red-400 hover:text-red-600 transition-all active:scale-90"><Trash2 size={20}/></button>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="bg-white p-10 rounded-[4rem] border-2 border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 group hover:border-blue-100 transition-colors shadow-sm">
                      <div className="text-right">
                          <h3 className="text-2xl font-black text-slate-800 mb-2 flex items-center gap-3"><Trophy className="text-blue-600"/> لوحة الشرف (Leaderboard)</h3>
                          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">إظهار أو إخفاء قائمة الطلاب الأوائل في الصفحة الرئيسية للطلاب.</p>
                      </div>
                      <button onClick={toggleLeaderboard} className={`relative inline-flex h-14 w-32 items-center rounded-full transition-all duration-500 shadow-xl ${showLeaderboard ? 'bg-green-600' : 'bg-slate-300'}`}>
                          <span className={`inline-block h-10 w-10 transform rounded-full bg-white transition-all duration-500 shadow-lg ${showLeaderboard ? '-translate-x-2' : '-translate-x-20'}`} />
                          <span className={`absolute font-black text-[10px] uppercase text-white ${showLeaderboard ? 'right-4' : 'left-4'}`}>{showLeaderboard ? 'ON' : 'OFF'}</span>
                      </button>
                  </div>

                  <div className="bg-slate-900 p-12 rounded-[4rem] text-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent"></div>
                        <Activity size={60} className="mx-auto text-amber-500 mb-6 group-hover:scale-110 transition-transform duration-700"/>
                        <h4 className="text-white text-2xl font-black mb-4 tracking-tighter">إحصائيات المنصة المتقدمة</h4>
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-[4px] mb-10">Real-time Platform Analytics</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-inner"><p className="text-amber-500 text-3xl font-black mb-1">{activeUsersList.length}</p><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">الطالب</p></div>
                            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-inner"><p className="text-white text-3xl font-black mb-1">{examsList.length}</p><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">الاختبار</p></div>
                            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-inner"><p className="text-white text-3xl font-black mb-1">{contentList.length}</p><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">المحاضرة</p></div>
                            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-inner"><p className="text-white text-3xl font-black mb-1">{examResults.length}</p><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">النتيجة</p></div>
                        </div>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * =================================================================
 * 10. واجهة حساب الطالب (Student Dashboard) - النسخة الكاملة
 * =================================================================
 */

const StudentDashboard = ({ user, userData }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [content, setContent] = useState([]);
  const [liveSession, setLiveSession] = useState(null);
  const [exams, setExams] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [examResults, setExamResults] = useState([]);
  const [reviewingExam, setReviewingExam] = useState(null);
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotif, setHasNewNotif] = useState(false);

  const [editFormData, setEditFormData] = useState({ name: '', phone: '', parentPhone: '', grade: '' });

  useEffect(() => {
    if(!userData) return;
    const grade = userData.grade;

    // اشتراك حي في المحتوى
    const unsubContent = onSnapshot(query(collection(db, 'content'), where('grade', '==', grade)), s => {
        const allContent = s.docs.map(d=>({id:d.id,...d.data()}));
        const visibleContent = allContent.filter(c => {
            if (!c.allowedEmails || c.allowedEmails.length === 0) return true; 
            return c.allowedEmails.includes(user.email); 
        });
        setContent(visibleContent);
    });

    // اشتراك حي في البث المباشر
    const unsubLive = onSnapshot(query(collection(db, 'live_sessions'), where('status', '==', 'active'), where('grade', '==', grade)), s => {
        setLiveSession(s.empty ? null : {id:s.docs[0].id, ...s.docs[0].data()});
    });

    // اشتراك حي في الامتحانات
    const unsubExams = onSnapshot(query(collection(db, 'exams'), where('grade', '==', grade)), s => {
        setExams(s.docs.map(d=>({id:d.id,...d.data()}))).sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds);
    });

    // اشتراك حي في النتائج
    const unsubResults = onSnapshot(query(collection(db, 'exam_results'), where('studentId', '==', user.uid)), s => {
        setExamResults(s.docs.map(d=>({id:d.id,...d.data()})));
    });
    
    // اشتراك حي في التنبيهات
    const unsubNotif = onSnapshot(query(collection(db, 'notifications'), where('grade', 'in', ['all', grade]), orderBy('createdAt', 'desc'), limit(10)), s => {
        const list = s.docs.map(d => d.data());
        if(list.length > 0) {
            setHasNewNotif(true);
            if(list[0].text) sendSystemNotification("تنبيه جديد من منصة النحاس", list[0].text);
        }
        setNotifications(list);
    });

    setEditFormData({ name: userData.name, phone: userData.phone, parentPhone: userData.parentPhone, grade: userData.grade });

    return () => {
        unsubContent(); unsubLive(); unsubExams(); unsubResults(); unsubNotif();
    };
  }, [userData, user.email, user.uid]);

  // <<< تم نقل كود الحماية هنا بعد انتهاء جميع الـ Hooks >>>
  if (!userData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 font-['Cairo']">
        <Loader2 className="animate-spin text-amber-600 w-16 h-16 mb-4" />
        <p className="text-slate-500 font-black text-xl animate-pulse">جاري جلب بيانات الطالب...</p>
        <button onClick={() => window.location.reload()} className="mt-8 text-sm text-blue-500 underline font-bold">اضغط هنا لو طولت</button>
      </div>
    );
  }
  
  // واجهة البث المباشر
  if(liveSession) return (
      <div className="fixed inset-0 z-[150] bg-slate-900 flex flex-col md:flex-row font-['Cairo'] no-select overflow-hidden">
          <div className="flex-1 flex flex-col relative overflow-hidden bg-black">
              {/* علامة مائية عائمة فوق البث */}
              <DynamicWatermark text={user.displayName} type="video" />
              
              <div className="bg-red-600 p-5 text-white flex justify-between items-center shadow-2xl relative z-[160]">
                  <div className="flex items-center gap-4">
                      <div className="w-4 h-4 bg-white rounded-full animate-pulse-fast border-4 border-red-500 shadow-[0_0_15px_white]"></div>
                      <h2 className="font-black text-xl uppercase tracking-tighter">بث مباشر الآن: {liveSession.title}</h2>
                  </div>
                  <button onClick={() => window.location.reload()} className="text-sm font-black bg-slate-900/40 px-6 py-2 rounded-xl hover:bg-slate-900 active:scale-95 transition-all">إنهاء الجلسة</button>
              </div>
              <div className="flex-1 relative flex items-center justify-center bg-black">
                  {getYouTubeID(liveSession.liveUrl) ? (
                      <iframe width="100%" height="100%" src={`https://www.youtube-nocookie.com/embed/${getYouTubeID(liveSession.liveUrl)}?autoplay=1&controls=1&rel=0&modestbranding=1`} title="Educational Live Stream" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                  ) : (
                      <div className="text-center p-12 bg-slate-850 rounded-[4rem] max-w-xl shadow-2xl border-4 border-white/5 mx-4">
                          <ExternalLink size={100} className="mx-auto text-amber-500 mb-8 opacity-40"/>
                          <h3 className="text-4xl font-black text-white mb-6 tracking-tighter">رابط خارجي للمحاضرة</h3>
                          <p className="text-slate-400 font-bold mb-10 leading-relaxed text-lg">هذا البث يتم من خلال منصة خارجية (Zoom/Meet). اضغط للانضمام والمشاركة.</p>
                          <a href={liveSession.liveUrl} target="_blank" rel="noreferrer" className="inline-flex bg-green-600 text-white text-2xl font-black py-6 px-16 rounded-[2.5rem] shadow-2xl shadow-green-900/40 hover:bg-green-700 transition-all hover:scale-105 active:scale-95"><Zap size={28} className="ml-3"/> دخول المحاضرة</a>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
  
  if (activeExam) return <ExamRunner exam={activeExam} user={user} onClose={() => setActiveExam(null)} />;
  
  if (reviewingExam) {
      const result = examResults.find(r => r.examId === reviewingExam.id);
      return <ExamRunner exam={reviewingExam} user={user} onClose={() => setReviewingExam(null)} isReviewMode={true} existingResult={result} />;
  }

  const isBanned = userData?.status === 'banned_cheating';

  if(userData?.status === 'pending') return (
    <div className="h-screen flex items-center justify-center bg-amber-50/30 font-['Cairo'] p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 rounded-[4rem] shadow-2xl text-center border-4 border-white border-t-amber-500">
            <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><Clock size={50} className="animate-spin-slow"/></div>
            <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter">طلبك قيد المراجعة ⏳</h2>
            <p className="text-slate-400 font-bold text-lg mb-10 leading-relaxed max-w-sm mx-auto">سيقوم فريق العمل بتفعيل حسابك خلال دقائق. يرجى المتابعة والانتظار.</p>
            <button onClick={()=>signOut(auth)} className="text-red-500 font-black text-xl underline underline-offset-8 decoration-2 decoration-red-200 hover:text-red-700 transition-all">تسجيل الخروج</button>
        </motion.div>
    </div>
  );
  
  if(userData?.status === 'rejected') return (
    <div className="h-screen flex items-center justify-center bg-red-50 font-['Cairo'] p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 rounded-[4rem] shadow-2xl text-center border-4 border-white border-t-red-600">
            <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><XCircle size={50}/></div>
            <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter">عفواً، تم رفض طلبك 🚫</h2>
            <p className="text-slate-400 font-bold text-lg mb-10 leading-relaxed max-w-sm mx-auto">لم يتم قبول بيانات حسابك، يرجى التواصل مع المستر مباشرة عبر الواتساب لحل المشكلة.</p>
            <button onClick={()=>signOut(auth)} className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-slate-200 transition-all active:scale-95">خروج</button>
        </motion.div>
    </div>
  );
  
  const startExamWithCode = async (exam) => {
    const previousResult = examResults.find(r => r.examId === exam.id);
    if (previousResult) return alert("لقد قمت بحل هذا الامتحان مسبقاً، يمكنك عرض الأخطاء فقط.");

    const now = new Date();
    const start = new Date(exam.startTime || now);
    const end = new Date(exam.endTime || new Date(now.getTime() + 86400000));
    
    if (now < start) return alert(`الامتحان لم يبدأ بعد. موعد البدء: ${start.toLocaleString('ar-EG')}`);
    if (now > end) return alert("انتهى وقت الامتحان المتاح.");

    const code = prompt("أدخل كود الدخول الخاص بالاختبار:");
    if (code === exam.accessCode) {
        try {
            const attemptRef = await addDoc(collection(db, 'exam_results'), { 
                examId: exam.id, 
                studentId: user.uid, 
                studentName: user.displayName, 
                score: 0, 
                total: 0,
                status: 'started', 
                startedAt: serverTimestamp() 
            });
            setActiveExam({ ...exam, attemptId: attemptRef.id });
        } catch (err) { alert("حدث خطأ تقني، تأكد من اتصالك بالإنترنت."); }
    } else {
        alert("كود خاطئ! لا يمكنك دخول الامتحان.");
    }
  };

  const handleUpdateMyProfile = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, 'users', user.uid), { phone: editFormData.phone, grade: editFormData.grade });
    alert("تم تحديث بياناتك بنجاح!");
  };

  const videos = content.filter(c => c.type === 'video');
  const files = content.filter(c => c.type === 'file');

  return (
    <div className="min-h-screen flex bg-slate-50 relative font-['Cairo'] overflow-hidden" dir="rtl">
      
      {/* مشغل الفيديو المنفصل */}
      {playingVideo && <SecureVideoPlayer video={playingVideo} userName={userData.name} onClose={() => setPlayingVideo(null)} />}
      
      <FloatingArabicBackground />
      <ChatWidget user={user} />
      
      {/* القائمة الجانبية (Sidebar) */}
      <aside className={`fixed md:relative z-[100] bg-white/95 backdrop-blur-3xl h-full w-80 p-10 shadow-[40px_0_100px_rgba(0,0,0,0.02)] transition-all duration-700 ease-in-out ${mobileMenu ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} right-0 border-l-2 border-white flex flex-col`}>
        <div className="flex items-center gap-5 mb-16 relative">
            <ModernLogo />
            <div>
                <h1 className="text-3xl font-black text-slate-850 leading-[0.8] tracking-tighter">النحاس</h1>
                <span className="text-[10px] text-amber-600 font-black uppercase tracking-[3px] mt-2 block">Educational Platform</span>
            </div>
            <button onClick={() => setMobileMenu(false)} className="md:hidden mr-auto p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-800 transition-colors"><X size={20}/></button>
        </div>
        <nav className="space-y-4 flex-1">
          {[
            { id: 'home', label: 'الرئيسية', icon: <Globe size={22}/> },
            { id: 'videos', label: 'المحاضرات', icon: <PlayCircle size={22}/> },
            { id: 'files', label: 'المذكرات', icon: <FileText size={22}/> },
            { id: 'exams', label: 'الامتحانات', icon: <ClipboardList size={22}/> },
            { id: 'settings', label: 'إعدادات الحساب', icon: <Settings size={22}/> }
          ].map(item => (
            <button 
                key={item.id} 
                onClick={() => {setActiveTab(item.id); setMobileMenu(false)}} 
                className={`flex items-center gap-5 w-full p-5 rounded-[2rem] font-black transition-all duration-500 shadow-amber-200 ${activeTab===item.id ? 'bg-amber-100 text-amber-800 shadow-2xl translate-x-3' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
                <div className={`p-2 rounded-xl transition-all ${activeTab===item.id ? 'bg-white text-amber-600 shadow-sm' : 'bg-transparent'}`}>{item.icon}</div>
                {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-10 border-t-2 border-slate-50">
            <button onClick={() => signOut(auth)} className="group flex items-center gap-5 text-red-500 font-black hover:bg-red-50 w-full p-5 rounded-[2rem] transition-all duration-500 active:scale-95 shadow-red-100 hover:shadow-2xl">
                <div className="p-2 bg-red-100 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-all"><LogOut size={22}/></div>
                تسجيل الخروج
            </button>
        </div>
      </aside>

      {/* منطقة المحتوى الرئيسية للطلاب */}
      <main className="flex-1 p-6 md:p-14 relative z-10 overflow-y-auto h-screen scrollbar-hide perspective">
        
        {/* هيدر الموبايل */}
        <div className="md:hidden flex justify-between items-center mb-10 bg-white/80 p-6 rounded-[2.5rem] backdrop-blur-2xl shadow-xl shadow-slate-100 border border-white">
            <div className="flex items-center gap-3"><ModernLogo /><h1 className="font-black text-slate-800 text-xl tracking-tighter">منصة النحاس</h1></div>
            <button onClick={() => setMobileMenu(true)} className="p-4 bg-slate-900 rounded-2xl text-amber-500 shadow-2xl active:scale-90 transition-all"><Menu size={24}/></button>
        </div>
        
        {/* هيدر الترحيب والإشعارات */}
        <div className="flex justify-between items-center mb-14 relative z-[110]">
            <div className="hidden md:block">
                <h2 className="text-5xl font-black text-slate-850 tracking-tighter mb-2">منور يا {userData.name.split(' ')[0]} 👋</h2>
                <div className="flex items-center gap-4">
                    <span className="bg-amber-100 text-amber-700 px-5 py-1 rounded-full text-xs font-black tracking-widest uppercase shadow-sm">{getGradeLabel(userData.grade)}</span>
                    <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[4px]">Verified Active Learner Account</p>
                </div>
            </div>
            <div className="relative mr-auto">
                <button 
                  onClick={() => {requestNotificationPermission(); setShowNotifications(!showNotifications); setHasNewNotif(false);}} 
                  className="relative p-4 bg-white rounded-3xl shadow-xl border border-white hover:bg-slate-50 transition-all duration-300 group"
                >
                    <Bell className="text-slate-600 group-hover:rotate-12 transition-transform" size={28}/>
                    {hasNewNotif && <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 rounded-full border-4 border-white animate-pulse-fast shadow-lg"></span>}
                </button>
                <AnimatePresence>
                {showNotifications && (
                    <motion.div 
                        initial={{ opacity: 0, y: 30, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        className="absolute top-20 left-0 w-[24rem] bg-white/95 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-slate-50 p-8 z-[120] modern-shadow"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="font-black text-xl text-slate-900 tracking-tight">آخر التحديثات والتنبيهات</h3>
                            <span className="text-[10px] bg-amber-600 text-white px-3 py-1 rounded-full font-black uppercase">Live Updates</span>
                        </div>
                        <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-2 scrollbar-hide">
                            {notifications.length === 0 ? (
                                <div className="text-center py-10">
                                    <Bell size={40} className="mx-auto text-slate-100 mb-2"/>
                                    <p className="text-xs text-slate-400 font-black uppercase">لا توجد إشعارات حالية</p>
                                </div>
                            ) : notifications.map((n, i) => (
                                <div key={i} className="text-sm bg-slate-50/50 p-5 rounded-[1.8rem] border-l-8 border-amber-600 font-bold text-slate-700 leading-relaxed shadow-sm hover:translate-x-1 transition-transform">
                                    {n.text}
                                    <div className="flex items-center gap-2 text-[9px] text-slate-300 mt-3 font-black uppercase tracking-widest"><Clock size={10}/> {n.createdAt?.toDate().toLocaleDateString('ar-EG')}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>

        {/* التبويب الأول: الرئيسية */}
        {activeTab === 'home' && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-14">
                <WisdomBox />
                <Announcements />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {[
                        { tab: 'videos', title: 'المحاضرات', count: videos.length, icon: <PlayCircle size={60}/>, color: 'from-blue-600 to-blue-800', shadow: 'rgba(37,99,235,0.3)' },
                        { tab: 'files', title: 'المذكرات', count: files.length, icon: <FileText size={60}/>, color: 'from-amber-500 to-amber-700', shadow: 'rgba(217,119,6,0.3)' },
                        { tab: 'exams', title: 'الامتحانات', count: exams.length, icon: <ClipboardList size={60}/>, color: 'from-slate-800 to-black', shadow: 'rgba(0,0,0,0.1)' }
                    ].map((stat, i) => (
                        <motion.div 
                            key={i}
                            whileHover={{ y: -15, scale: 1.02 }} 
                            onClick={()=>setActiveTab(stat.tab)} 
                            className={`bg-gradient-to-br ${stat.color} text-white p-12 rounded-[3.5rem] relative overflow-hidden cursor-pointer group shadow-2xl transition-all duration-500`}
                            style={{ boxShadow: `0 30px 60px ${stat.shadow}` }}
                        >
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                            <div className="relative z-10 flex flex-col justify-between h-full">
                                <h3 className="text-3xl font-black mb-4 tracking-tighter">{stat.title}</h3>
                                <p className="text-7xl font-black tracking-tighter opacity-100 group-hover:scale-110 transition-transform origin-right">{stat.count}</p>
                            </div>
                            <div className="absolute -bottom-10 -left-10 opacity-15 w-56 h-56 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                {stat.icon}
                            </div>
                        </motion.div>
                    ))}
                </div>
                
                <Leaderboard />
            </motion.div>
        )}

        {/* التبويب الثاني: الفيديوهات */}
        {activeTab === 'videos' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-4 mb-12 px-6 border-r-8 border-blue-600">
                    <h3 className="text-4xl font-black text-slate-850 tracking-tighter">محاضرات الشرح والتدريبات</h3>
                    <div className="w-full h-[2px] bg-slate-100 flex-1 mr-10 hidden md:block"></div>
                </div>
                {videos.length === 0 ? (
                    <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                        <Video size={100} className="mx-auto text-slate-100 mb-6 opacity-40"/>
                        <p className="text-2xl font-black text-slate-300 uppercase tracking-widest">محتوى الفيديو غير متوفر حالياً</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {videos.map(v => (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }} 
                                animate={{ opacity: 1, scale: 1 }}
                                key={v.id} 
                                className="bg-white rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-slate-50 overflow-hidden cursor-pointer group hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 hover:-translate-y-2 relative" 
                                onClick={() => setPlayingVideo(v)}
                            >
                                <div className="h-52 bg-slate-900 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent"></div>
                                    <div className="p-5 bg-white/10 rounded-[1.5rem] backdrop-blur-xl group-hover:scale-125 transition-all duration-700 shadow-2xl relative z-10 border border-white/10"><PlayCircle className="text-white w-14 h-14"/></div>
                                    <span className="absolute bottom-6 left-6 bg-amber-600 text-white text-[10px] px-4 py-1.5 rounded-full font-black tracking-[3px] uppercase z-10 shadow-xl">{getGradeLabel(v.grade)}</span>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-[5]"><span className="text-white font-black text-xs uppercase tracking-widest border-2 border-white/20 px-6 py-2 rounded-full backdrop-blur-sm">شاهد الآن</span></div>
                                </div>
                                <div className="p-8">
                                    <h3 className="font-black text-xl text-slate-800 leading-[1.3] group-hover:text-blue-600 transition-colors tracking-tight line-clamp-2">{v.title}</h3>
                                    <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-50">
                                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><User size={14} className="text-slate-400"/></div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">أ. محمد النحاس</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        )}

        {/* التبويب الثالث: المذكرات */}
        {activeTab === 'files' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-4 mb-12 px-6 border-r-8 border-amber-600">
                    <h3 className="text-4xl font-black text-slate-800 tracking-tighter">مكتبة المذكرات والملفات</h3>
                    <div className="w-full h-[2px] bg-slate-100 flex-1 mr-10 hidden md:block"></div>
                </div>
                {files.length === 0 ? (
                    <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                        <FileText size={100} className="mx-auto text-slate-100 mb-6 opacity-40"/>
                        <p className="text-2xl font-black text-slate-300 uppercase tracking-widest">المكتبة فارغة حالياً</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {files.map(f => (
                            <motion.div 
                                whileHover={{ scale: 1.02, x: -10 }}
                                key={f.id} 
                                className="p-8 bg-white rounded-[3rem] flex justify-between items-center shadow-lg shadow-slate-200/50 border border-white hover:border-amber-100 transition-all duration-500"
                            >
                                <div className="flex items-center gap-8">
                                    <div className="bg-red-50 text-red-600 p-6 rounded-[2rem] shadow-inner rotate-3 group-hover:rotate-0 transition-transform"><FileText size={40}/></div>
                                    <div>
                                        <h4 className="font-black text-2xl text-slate-850 tracking-tight mb-1">{f.title}</h4>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-lg font-black uppercase tracking-widest">{getGradeLabel(f.grade)}</span>
                                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest flex items-center gap-2"><HardDrive size={10}/> PDF Content</span>
                                        </div>
                                    </div>
                                </div>
                                <a 
                                    href={f.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="bg-slate-900 text-amber-500 px-10 py-5 rounded-[1.8rem] font-black text-lg hover:bg-black transition-all active:scale-90 shadow-2xl shadow-slate-200 flex items-center gap-3"
                                >
                                    <Download size={24}/> تحميل
                                </a>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        )}

        {/* التبويب الرابع: الامتحانات */}
        {activeTab === 'exams' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-4 mb-12 px-6 border-r-8 border-slate-900">
                    <h3 className="text-4xl font-black text-slate-800 tracking-tighter">الاختبارات الذكية والتقييمات</h3>
                    <div className="w-full h-[2px] bg-slate-100 flex-1 mr-10 hidden md:block"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {isBanned ? (
                        <div className="col-span-full bg-red-50 border-4 border-red-100 p-16 rounded-[4rem] text-center shadow-2xl shadow-red-100">
                            <AlertTriangle size={120} className="mx-auto text-red-600 mb-8 animate-bounce-gentle" />
                            <h3 className="text-4xl font-black text-red-800 mb-6 tracking-tighter uppercase">لقد تم حظرك من نظام الامتحانات!</h3>
                            <p className="text-red-500 font-bold text-xl mb-10 leading-relaxed max-w-2xl mx-auto italic">لقد رصد النظام محاولة غش سابقة باستخدام هذا الحساب. يرجى مراجعة إدارة المنصة لفك الحظر إن كان هناك خطأ.</p>
                            <button onClick={()=>window.open("https://wa.me/201500076322")} className="bg-red-600 text-white px-16 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95">تواصل مع الدعم الفني الآن</button>
                        </div>
                    ) : exams.length === 0 ? (
                        <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                            <ClipboardList size={100} className="mx-auto text-slate-100 mb-6 opacity-40"/>
                            <p className="text-2xl font-black text-slate-300 uppercase tracking-widest">لا توجد اختبارات متاحة لصفك حالياً</p>
                        </div>
                    ) : exams.map(e => {
                        const prevResult = examResults.find(r => r.examId === e.id);
                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }}
                            key={e.id} 
                            className="bg-white p-10 rounded-[3.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 relative group transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                          >
                            {prevResult && (
                                <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] px-8 py-2 rounded-bl-[2rem] font-black tracking-widest shadow-xl rotate-0 flex items-center gap-2">
                                    <Check size={12}/> تم الحل بنجاح
                                </div>
                            )}
                            <div className="flex items-center gap-5 mb-8">
                                <div className="p-4 bg-slate-900 text-amber-500 rounded-[1.5rem] group-hover:rotate-6 transition-transform shadow-xl"><ClipboardList size={32}/></div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-amber-600 transition-colors leading-none">{e.title}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Professional Academic Assessment</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] mb-10 shadow-inner">
                                <div className="flex flex-col items-center">
                                    <span className="text-xs text-slate-400 font-black uppercase tracking-widest">المدة</span>
                                    <span className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-2"><Timer size={18} className="text-amber-600"/> {e.duration} د</span>
                                </div>
                                <div className="w-[2px] h-10 bg-slate-200"></div>
                                <div className="flex flex-col items-center">
                                    <span className="text-xs text-slate-400 font-black uppercase tracking-widest">الأسئلة</span>
                                    <span className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-2"><Layers size={18} className="text-blue-600"/> {e.questions.reduce((acc,g)=>acc+g.subQuestions.length,0)} ق</span>
                                </div>
                            </div>
                            
                            {prevResult ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between px-4 py-2 border-b-2 border-slate-50 mb-2">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">درجتك المحققة:</span>
                                        <span className="text-2xl font-black text-green-600">{prevResult.score} / {prevResult.total || e.questions.reduce((acc,g)=>acc+g.subQuestions.length,0)}</span>
                                    </div>
                                    <div className="flex gap-4">
                                         <button onClick={() => setReviewingExam(e)} className="flex-1 bg-slate-900 text-white py-5 rounded-[1.8rem] font-black text-lg hover:bg-black transition-all shadow-xl active:scale-95">عرض الأخطاء</button>
                                         <button onClick={() => generatePDF('student', {studentName: user.displayName, score: prevResult.score, total: e.questions.reduce((acc,g)=>acc+g.subQuestions.length,0), status: prevResult.status, examTitle: e.title, questions: e.questions.flatMap(q => q.subQuestions), answers: prevResult.answers })} className="flex-1 bg-blue-100 text-blue-700 py-5 rounded-[1.8rem] font-black text-lg hover:bg-blue-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3"><Download size={22}/> الشهادة</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-100 flex items-start gap-4">
                                        <AlertCircle size={20} className="text-amber-600 shrink-0 mt-1"/>
                                        <p className="text-[10px] text-amber-800 font-black leading-relaxed">تنبيه: الامتحان بنظام الحماية الذكي، لا تحاول الخروج من النافذة أو استخدام برامج التصوير وإلا سيتم حظر حسابك آلياً.</p>
                                    </div>
                                    <button onClick={() => startExamWithCode(e)} className="w-full bg-slate-900 text-amber-500 py-6 rounded-[2rem] font-black text-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-4"><Lock size={28}/> ابدأ الاختبار الآن</button>
                                </div>
                            )}
                          </motion.div>
                        )
                    })}
                </div>
            </motion.div>
        )}

        {/* التبويب الخامس: الإعدادات */}
        {activeTab === 'settings' && (
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
               <div className="bg-white p-14 rounded-[4rem] shadow-2xl border-2 border-slate-50 relative overflow-hidden">
                 <div className="absolute -top-20 -right-20 w-80 h-80 bg-slate-900/5 rounded-full blur-[100px]"></div>
                 <div className="flex items-center gap-6 mb-14 relative z-10">
                    <div className="w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-amber-500 shadow-2xl rotate-12"><GearIcon size={40}/></div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-850 tracking-tighter mb-2">إعدادات ملفك الشخصي</h2>
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-[4px]">Manage your account Preferences</p>
                    </div>
                 </div>
                 <form onSubmit={handleUpdateMyProfile} className="space-y-8 relative z-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase mr-4 tracking-widest">الاسم الكامل (غير قابل للتغيير)</label>
                            <div className="w-full bg-slate-100 border-2 border-slate-100 p-5 rounded-[1.5rem] text-slate-400 font-black flex items-center gap-4 cursor-not-allowed">
                                <User size={20} className="opacity-40"/> {editFormData.name}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase mr-4 tracking-widest">رقم الهاتف</label>
                            <div className="relative">
                                <Phone className="absolute top-1/2 -translate-y-1/2 right-6 text-slate-300" size={20}/>
                                <input className="w-full bg-white border-2 border-slate-100 p-5 pr-14 rounded-[1.5rem] outline-none focus:border-amber-500 transition-all font-black text-slate-800" value={editFormData.phone} onChange={e=>setEditFormData({...editFormData, phone:e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase mr-4 tracking-widest">رقم ولي الأمر</label>
                            <div className="w-full bg-slate-100 border-2 border-slate-100 p-5 rounded-[1.5rem] text-slate-400 font-black flex items-center gap-4 cursor-not-allowed">
                                <Phone size={20} className="opacity-40"/> {editFormData.parentPhone}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase mr-4 tracking-widest">المرحلة الدراسية</label>
                            <div className="relative">
                                <GraduationCap className="absolute top-1/2 -translate-y-1/2 right-6 text-slate-300" size={20}/>
                                <select className="w-full bg-white border-2 border-slate-100 p-5 pr-14 rounded-[1.5rem] outline-none focus:border-amber-500 transition-all font-black text-slate-800 appearance-none" value={editFormData.grade} onChange={e=>setEditFormData({...editFormData, grade:e.target.value})}>
                                    <GradeOptions />
                                </select>
                            </div>
                        </div>
                   </div>
                   <div className="pt-8">
                        <button className="w-full bg-slate-900 text-amber-500 py-6 rounded-[2.2rem] font-black text-2xl shadow-2xl shadow-slate-200 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-4">
                            <Save size={28}/> حفظ كافة التعديلات الجديدة
                        </button>
                        <p className="text-center mt-6 text-slate-300 font-black text-[10px] uppercase tracking-widest">Your data is secured and encrypted</p>
                   </div>
                 </form>
               </div>
               
               <div className="mt-10 bg-red-50 p-10 rounded-[3rem] border-2 border-red-100 border-dashed text-center">
                    <h4 className="text-red-700 font-black text-xl mb-2">هل تواجه مشكلة في البيانات؟</h4>
                    <p className="text-red-400 font-bold mb-6">لا يمكن تغيير الاسم أو رقم ولي الأمر إلا من خلال التواصل مع الأستاذ محمد النحاس مباشرة.</p>
                    <button onClick={openWhatsApp} className="bg-white text-red-600 border-2 border-red-100 px-12 py-4 rounded-[1.5rem] font-black shadow-xl hover:bg-red-600 hover:text-white transition-all flex items-center gap-3 mx-auto"><Phone size={20}/> التواصل مع المستر</button>
               </div>
             </motion.div>
        )}
      </main>
    </div>
  );
};

/**
 * =================================================================
 * 11. الصفحة الرئيسية العامة (Landing Page)
 * =================================================================
 */

const LandingPage = ({ onAuthClick }) => {
  const [publicContent, setPublicContent] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null); 
  
  useEffect(() => { 
    onSnapshot(query(collection(db, 'content'), where('isPublic', '==', true)), s => setPublicContent(s.docs.map(d=>d.data()))); 
  }, []);

  return (
    <div className="min-h-screen font-['Cairo'] relative bg-slate-50 overflow-hidden" dir="rtl">
      
      {playingVideo && <SecureVideoPlayer video={playingVideo} userName="زائر المنصة" onClose={() => setPlayingVideo(null)} />}
      
      <FloatingArabicBackground />
      <ChatWidget />
      
      {/* نافيجبار اللاندينج */}
      <nav className="relative z-50 flex justify-between items-center p-8 md:p-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-5">
            <ModernLogo />
            <div>
                <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none block">منصة النحاس</span>
                <span className="text-[10px] text-amber-600 font-black uppercase tracking-[5px] mt-1 block">The Arabic Master</span>
            </div>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={onAuthClick} 
                className="bg-slate-900 text-amber-500 px-10 py-4 rounded-[1.5rem] font-black text-lg shadow-2xl shadow-slate-400 hover:scale-110 hover:bg-black transition-all active:scale-95 border-b-4 border-amber-500"
            >
                دخول الطالب
            </button>
        </div>
      </nav>

      {/* الهيرو سيكشن */}
      <main className="relative z-20 px-8 mt-20 max-w-7xl mx-auto text-center perspective">
        <motion.div initial={{ opacity: 0, y: 50, rotateX: -10 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 1.2 }}>
            <h1 className="text-7xl md:text-[10rem] font-black text-slate-950 mb-10 leading-[0.8] tracking-tighter drop-shadow-sm">
                اللغة العربية <br/> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-800 to-amber-900 amber-glow">بأسلوب عبقري</span>
            </h1>
            <p className="text-xl md:text-3xl text-slate-400 mb-16 max-w-4xl mx-auto font-black leading-relaxed tracking-tight">
                أقوى منصة تعليمية للمرحلتين الإعدادية والثانوية مع الأستاذ محمد النحاس. شرح تفاعلي، مراجعات نهائية، واختبارات بنظام الحماية الذكي.
            </p>
            <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
                <button onClick={onAuthClick} className="bg-amber-600 text-white px-20 py-7 rounded-[3rem] text-3xl font-black shadow-[0_30px_100px_rgba(217,119,6,0.3)] hover:bg-amber-700 transition-all transform hover:-translate-y-3 active:scale-90 flex items-center gap-5">سجل الآن 🚀</button>
                <div className="flex flex-col items-center md:items-start text-slate-500">
                    <div className="flex items-center gap-4 mb-2"><div className="flex -space-x-4"><div className="w-10 h-10 rounded-full bg-amber-400 border-4 border-white"></div><div className="w-10 h-10 rounded-full bg-blue-500 border-4 border-white"></div><div className="w-10 h-10 rounded-full bg-slate-800 border-4 border-white"></div></div><span className="text-2xl font-black text-slate-900">+5000</span></div>
                    <span className="text-xs font-black uppercase tracking-widest">طالب وطالبة يثقون فينا</span>
                </div>
            </div>
        </motion.div>
        
        {/* صندوق الحكمة في اللاندينج */}
        <div className="mt-32 max-w-5xl mx-auto"><WisdomBox /></div>
        
        {/* المحتوى المجاني المتاح للجميع */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-24 mb-32">
            <motion.div initial={{ x: 50, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} className="bg-white/70 backdrop-blur-2xl p-14 rounded-[5rem] border-2 border-white shadow-2xl text-right relative overflow-hidden group hover:border-blue-500 transition-all">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-all"></div>
                <div className="flex items-center gap-6 mb-10"><div className="p-4 bg-blue-600 rounded-[1.8rem] text-white shadow-xl"><Video size={40}/></div> <h3 className="text-4xl font-black text-slate-850 tracking-tighter">عينات مجانية</h3></div>
                <div className="space-y-6">
                    {publicContent.filter(c => c.type === 'video').length === 0 ? <p className="text-slate-300 font-black">لا توجد محاضرات عامة متاحة حالياً</p> : publicContent.filter(c => c.type === 'video').map((v, i) => (
                        <div key={i} className="flex items-center gap-6 p-6 bg-white rounded-[2rem] shadow-sm border border-slate-50 cursor-pointer hover:shadow-2xl transition-all duration-500 hover:scale-[1.03]" onClick={()=>setPlayingVideo(v)}>
                            <div className="p-3 bg-amber-600 rounded-xl text-white shadow-lg"><PlayCircle size={28}/></div>
                            <span className="font-black text-xl text-slate-700 flex-1">{v.title}</span>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full font-black uppercase tracking-widest">مشاهدة</span>
                        </div>
                    ))}
                </div>
            </motion.div>
            <motion.div initial={{ x: -50, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} className="bg-white/70 backdrop-blur-2xl p-14 rounded-[5rem] border-2 border-white shadow-2xl text-right relative overflow-hidden group hover:border-green-500 transition-all">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-green-600/5 rounded-full blur-3xl group-hover:bg-green-600/10 transition-all"></div>
                <div className="flex items-center gap-6 mb-10"><div className="p-4 bg-green-600 rounded-[1.8rem] text-white shadow-xl"><UploadCloud size={40}/></div> <h3 className="text-4xl font-black text-slate-850 tracking-tighter">مذكرات التحميل</h3></div>
                <div className="space-y-6">
                    {publicContent.filter(c => c.type === 'file').length === 0 ? <p className="text-slate-300 font-black">لا توجد مذكرات متاحة حالياً</p> : publicContent.filter(c => c.type === 'file').map((f, i) => (
                        <div key={i} className="flex items-center gap-6 p-6 bg-white rounded-[2rem] shadow-sm border border-slate-50 hover:shadow-2xl transition-all duration-500 hover:scale-[1.03]">
                            <div className="p-3 bg-red-600 rounded-xl text-white shadow-lg"><FileText size={28}/></div>
                            <span className="font-black text-xl text-slate-700 flex-1">{f.title}</span>
                            <a href={f.url} target="_blank" rel="noreferrer" className="text-[10px] bg-green-100 text-green-700 px-4 py-1.5 rounded-full font-black uppercase tracking-widest">تحميل</a>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
      </main>

      {/* الفوتر المودرن */}
      <footer className="bg-slate-950 text-white py-24 px-10 relative z-30 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-16">
              <div className="text-center md:text-right">
                  <div className="flex items-center gap-5 justify-center md:justify-start mb-8">
                      <ModernLogo />
                      <div>
                        <h4 className="text-4xl font-black tracking-tighter">منصة النحاس</h4>
                        <p className="text-amber-500 text-xs font-black tracking-[4px] uppercase mt-1">Academy of Excellence</p>
                      </div>
                  </div>
                  <p className="text-slate-500 font-bold text-lg max-w-md leading-relaxed">الوجهة الأولى لكل باحث عن التفوق في اللغة العربية بالجمهورية. خبرة، جودة، ونظام تعليمي فريد.</p>
              </div>
              <div className="flex flex-col items-center md:items-end gap-6">
                  <h5 className="text-white font-black text-xl tracking-tighter">تواصل معنا الآن</h5>
                  <div className="flex gap-6">
                      <motion.div whileHover={{ scale: 1.2 }} className="p-5 bg-white/5 rounded-[1.5rem] border border-white/10 hover:bg-blue-600 cursor-pointer transition-all shadow-xl" onClick={()=>window.open("https://www.facebook.com/share/17aiUQWKf5/")}><Facebook size={32}/></motion.div>
                      <motion.div whileHover={{ scale: 1.2 }} className="p-5 bg-white/5 rounded-[1.5rem] border border-white/10 hover:bg-green-600 cursor-pointer transition-all shadow-xl" onClick={()=>window.open("https://wa.me/201500076322")}><Phone size={32}/></motion.div>
                      <motion.div whileHover={{ scale: 1.2 }} className="p-5 bg-white/5 rounded-[1.5rem] border border-white/10 hover:bg-red-600 cursor-pointer transition-all shadow-xl"><Mail size={32}/></motion.div>
                  </div>
              </div>
          </div>
          <div className="mt-24 text-center">
              <div className="inline-block px-10 py-3 bg-white/5 border border-white/10 rounded-full">
                <span className="text-slate-500 text-xs font-black uppercase tracking-[5px]">All Rights Reserved © {new Date().getFullYear()} - Mohammed Al-Nahaas</span>
              </div>
          </div>
      </footer>
    </div>
  );
};

/**
 * =================================================================
 * 12. صفحة الدخول والتسجيل (Authentication System)
 * =================================================================
 */

const AuthPage = ({ onBack }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', grade: '1sec', phone: '', parentPhone: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // التحقق من صحة الأرقام المصرية
    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (isRegister) {
        if (!phoneRegex.test(formData.phone)) { setLoading(false); return alert("رقم هاتفك الشخصي غير صحيح!"); }
        if (!phoneRegex.test(formData.parentPhone)) { setLoading(false); return alert("رقم ولي الأمر غير صحيح!"); }
        if (formData.phone === formData.parentPhone) { setLoading(false); return alert("عفواً، لا يمكن تكرار نفس رقم الهاتف!"); }
    }

    try {
      if (isRegister) {
        const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCred.user, { displayName: formData.name });
        await setDoc(doc(db, 'users', userCred.user.uid), {
          name: formData.name, 
          email: formData.email, 
          grade: formData.grade, 
          phone: formData.phone, 
          parentPhone: formData.parentPhone, 
          role: 'student', 
          status: 'pending', 
          createdAt: new Date()
        });
        alert("تم إنشاء الحساب بنجاح! يرجى التواصل مع المستر لتفعيل الحساب.");
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
    } catch (error) { 
        let errorMsg = "حدث خطأ غير متوقع";
        if(error.code === 'auth/email-already-in-use') errorMsg = "هذا البريد مسجل بالفعل!";
        if(error.code === 'auth/wrong-password') errorMsg = "كلمة السر خاطئة!";
        alert(errorMsg); 
    } 
    finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if(!formData.email) return alert("يرجى كتابة بريدك الإلكتروني أولاً");
    try {
        await sendPasswordResetEmail(auth, formData.email);
        alert("تم إرسال رابط استعادة كلمة السر لبريدك.");
    } catch(err) { alert("حدث خطأ في الإرسال"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 font-['Cairo'] relative overflow-hidden" dir="rtl">
      <FloatingArabicBackground />
      <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-transparent to-blue-600/10"></div>
      
      <motion.div 
        initial={{ scale: 0.85, opacity: 0, y: 50 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        className="bg-white rounded-[4rem] p-12 w-full max-w-lg shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative z-10 border-4 border-white group overflow-y-auto max-h-[95vh] scrollbar-hide"
      >
        <button onClick={onBack} className="text-slate-400 hover:text-slate-900 text-sm mb-10 flex items-center gap-3 font-black uppercase tracking-widest transition-colors"><ChevronRight size={24} className="p-1 bg-slate-100 rounded-full"/> العودة للرئيسية</button>
        
        <div className="flex justify-center mb-10"><ModernLogo /></div>
        
        <h2 className="text-4xl font-black text-slate-850 mb-4 text-center tracking-tighter">{isRegister ? 'انضم لرحلة التفوق' : 'مرحباً بك مجدداً'}</h2>
        <p className="text-center text-slate-400 font-bold mb-12 uppercase text-[10px] tracking-[5px]">{isRegister ? 'Create your Student Account' : 'Login to your Learning Portal'}</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {isRegister && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="relative"><User className="absolute top-1/2 -translate-y-1/2 right-6 text-slate-300" size={22}/><input required className="w-full py-5 pr-16 pl-6 rounded-[1.8rem] border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-amber-500 outline-none transition-all font-bold shadow-inner" placeholder="الاسم الثلاثي للطالب" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="relative"><Phone className="absolute top-1/2 -translate-y-1/2 right-6 text-slate-300" size={22}/><input required type="tel" className="w-full py-5 pr-16 pl-6 rounded-[1.8rem] border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-amber-500 outline-none transition-all font-bold shadow-inner" placeholder="رقم هاتفك الشخصي" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="relative"><Smartphone className="absolute top-1/2 -translate-y-1/2 right-6 text-slate-300" size={22}/><input required type="tel" className="w-full py-5 pr-16 pl-6 rounded-[1.8rem] border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-amber-500 outline-none transition-all font-bold shadow-inner" placeholder="رقم هاتف ولي الأمر" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} /></div>
              <div className="relative"><GraduationCap className="absolute top-1/2 -translate-y-1/2 right-6 text-slate-300" size={22}/><select className="w-full py-5 pr-16 pl-6 rounded-[1.8rem] border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-amber-500 outline-none transition-all font-black shadow-inner appearance-none" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}><GradeOptions /></select></div>
            </motion.div>
          )}
          <div className="relative"><Mail className="absolute top-1/2 -translate-y-1/2 right-6 text-slate-300" size={22}/><input required type="email" className="w-full py-5 pr-16 pl-6 rounded-[1.8rem] border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-amber-500 outline-none transition-all font-bold shadow-inner" placeholder="البريد الإلكتروني" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          <div className="relative"><Lock className="absolute top-1/2 -translate-y-1/2 right-6 text-slate-300" size={22}/><input required type="password" className="w-full py-5 pr-16 pl-6 rounded-[1.8rem] border-2 border-slate-50 bg-slate-50/50 focus:bg-white focus:border-amber-500 outline-none transition-all font-bold shadow-inner" placeholder="كلمة السر" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
          
          {!isRegister && (
            <div className="text-left px-4"><button type="button" onClick={handleResetPassword} className="text-xs text-amber-600 font-black hover:underline underline-offset-4">نسيت كلمة السر؟</button></div>
          )}
          
          <button disabled={loading} className="bg-slate-900 text-amber-500 py-6 rounded-[2rem] font-black text-2xl shadow-2xl shadow-slate-200 hover:bg-black transition-all transform active:scale-95 mt-4 flex items-center justify-center gap-4">
              {loading ? <Loader2 className="animate-spin" size={28}/> : (isRegister ? <Zap size={28}/> : <ShieldCheck size={28}/>)}
              {isRegister ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </button>
        </form>
        
        <div className="mt-10 pt-10 border-t border-slate-50 text-center">
            <button onClick={() => setIsRegister(!isRegister)} className="text-slate-800 font-black text-lg hover:text-amber-600 transition-colors">
                {isRegister ? 'تمتلك حساب بالفعل؟ سجل دخول' : 'لا تملك حساب؟ انضم إلينا الآن'}
            </button>
        </div>
      </motion.div>
      <div className="fixed bottom-10 right-10 text-white/5 font-black text-[12vw] pointer-events-none select-none leading-none z-0">ARABIC</div>
    </div>
  );
};

// خلفية الأرابيسك العائمة
const FloatingArabicBackground = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%)' }}>
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 50L0 0M50 50L100 0M50 50L0 100M50 50L100 100' stroke='%23d97706' stroke-width='2'/%3E%3C/svg%3E")` }} />
      <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-amber-200/20 rounded-full blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-blue-200/10 rounded-full blur-[150px] animate-spin-slow"></div>
    </div>
);

// استخراج المكونات الفرعية والخيارات
const GradeOptions = () => (
    <>
        <optgroup label="المرحلة الإعدادية">
            <option value="1prep">الصف الأول الإعدادي</option>
            <option value="2prep">الصف الثاني الإعدادي</option>
            <option value="3prep">الصف الثالث الإعدادي</option>
        </optgroup>
        <optgroup label="المرحلة الثانوية">
            <option value="1sec">الصف الأول الثانوي</option>
            <option value="2sec">الصف الثاني الثانوي</option>
            <option value="3sec">الصف الثالث الثانوي</option>
        </optgroup>
    </>
);

const getGradeLabel = (g) => {
    const map = { 
        '1prep': 'أولى إعدادي', '2prep': 'تانية إعدادي', '3prep': 'تالتة إعدادي', 
        '1sec': 'أولى ثانوي', '2sec': 'تانية ثانوي', '3sec': 'تالتة ثانوي' 
    };
    return map[g] || 'غير محدد';
};

/**
 * =================================================================
 * 13. التطبيق الرئيسي (Main App Component)
 * =================================================================
 */

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('landing');

  useEffect(() => {
    if (!auth) return;
    const unsubAuth = onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) {
        onSnapshot(doc(db, 'users', u.uid), s => {
          if(s.exists()) setUserData(s.data());
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  // شاشة التحميل الاحترافية
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 font-['Cairo'] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-amber-600/5 to-transparent"></div>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1 }} className="relative z-10 text-center">
            <ModernLogo />
            <Loader2 className="animate-spin text-amber-500 mt-12 w-14 h-14 mx-auto" />
            <p className="text-slate-500 mt-6 font-black uppercase text-xs tracking-[6px] animate-pulse">Initializing Arabic Platform</p>
        </motion.div>
        <div className="absolute bottom-10 text-white/5 font-black text-6xl select-none">NAHAAS</div>
    </div>
  );

  return (
    <AnimatePresence mode='wait'>
      <DesignSystemLoader />
      {!user ? (
        viewMode === 'landing' ? (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LandingPage onAuthClick={() => setViewMode('auth')} />
            </motion.div>
        ) : (
            <motion.div key="auth" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }}>
                <AuthPage onBack={() => setViewMode('landing')} />
            </motion.div>
        )
      ) : (
        user.email === 'mido16280@gmail.com' ? (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AdminDashboard user={user} />
            </motion.div>
        ) : (
            <motion.div key="student" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <StudentDashboard user={user} userData={userData} />
            </motion.div>
        )
      )}
    </AnimatePresence>
  );
}