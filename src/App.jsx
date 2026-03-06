import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Users, PenTool, Code, Sparkles, Lamp, Ban, Shield, RefreshCw, Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * =================================================================
 * 1. إعدادات Firebase والتهيئة
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
  console.error("Firebase Initialization Error:", error); 
}

/**
 * =================================================================
 * 2. دوال مساعدة (Utility Functions)
 * =================================================================
 */

const requestNotificationPermission = () => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().then(permission => {
      if(permission === "granted") console.log("الإشعارات مفعلة");
    });
  }
};

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
      audio.play().catch(e => {});
    } catch (e) { console.error("Notification Error:", e); }
  }
};

const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const generatePDF = (type, data) => {
    if (!window.html2pdf) {
        alert("جاري تحميل نظام الطباعة... يرجى الانتظار ثوانٍ والمحاولة مرة أخرى.");
        return;
    }

    const percentage = data.total > 0 ? Math.round((data.score / data.total) * 100) : 0;
    const date = new Date().toLocaleDateString('ar-EG');
    const element = document.createElement('div');
    
    let answersTable = '';
    if (data.questions && data.answers) {
        answersTable = `
        <div style="margin-top: 30px; page-break-before: always;">
            <h3 style="background: #eee; padding: 10px; border-right: 5px solid #d97706;">تفاصيل الإجابات</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 15px;">
                <thead>
                    <tr style="background-color: #f3f4f6; color: #333;">
                        <th style="border: 1px solid #ddd; padding: 10px; width: 5%;">#</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">السؤال</th>
                        <th style="border: 1px solid #ddd; padding: 10px; width: 15%;">إجابتك</th>
                        <th style="border: 1px solid #ddd; padding: 10px; width: 15%;">الصح</th>
                        <th style="border: 1px solid #ddd; padding: 10px; width: 10%;">الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.questions.map((q, i) => {
                        const studentAnsIdx = data.answers[q.id];
                        const correctAnsIdx = q.correctIdx;
                        const isCorrect = studentAnsIdx === correctAnsIdx;
                        const studentAnsText = studentAnsIdx !== undefined ? q.options[studentAnsIdx] : 'لم يجب';
                        const correctAnsText = q.options[correctAnsIdx];
                        
                        return `
                        <tr style="background-color: ${isCorrect ? '#f0fdf4' : '#fef2f2'};">
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${i + 1}</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${q.text}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${studentAnsText}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; color: green;">${correctAnsText}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                                ${isCorrect ? '<span style="color:green">✔ صحيح</span>' : '<span style="color:red">✘ خطأ</span>'}
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        `;
    }

    const header = `
      <div style="padding: 40px; font-family: 'Cairo', sans-serif; direction: rtl; color: #333;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #d97706; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="text-align: right;">
                <h1 style="margin: 0; color: #d97706; font-size: 28px;">منصة النحاس التعليمية</h1>
                <p style="margin: 5px 0 0; color: #666;">للغة العربية - أ/ محمد النحاس</p>
            </div>
            <div style="text-align: left;">
                <p style="margin: 0; font-weight: bold;">تقرير نتيجة امتحان</p>
                <p style="margin: 5px 0 0; color: #666;">${date}</p>
            </div>
        </div>
        
        <div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <table style="width: 100%; font-size: 18px;">
                <tr>
                    <td style="padding: 10px; font-weight: bold; width: 20%;">اسم الطالب:</td>
                    <td style="padding: 10px;">${data.studentName}</td>
                    <td style="padding: 10px; font-weight: bold; width: 20%;">الامتحان:</td>
                    <td style="padding: 10px;">${data.examTitle || 'اختبار عام'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; font-weight: bold; vertical-align: middle;">الدرجة:</td>
                    <td style="padding: 10px;">
                        <div style="
                            display: inline-block;
                            border: 3px solid #d97706;
                            border-radius: 8px;
                            padding: 5px 20px;
                            font-weight: bold;
                            color: #d97706;
                            direction: ltr;
                            font-family: sans-serif;
                            font-size: 20px;
                            background: #fffbeb;
                        ">
                            ${data.score} / ${data.total}
                        </div>
                    </td>
                    <td style="padding: 10px; font-weight: bold; vertical-align: middle;">النسبة:</td>
                    <td style="padding: 10px; font-size: 20px; font-weight: bold;">${percentage}%</td>
                </tr>
                <tr>
                    <td style="padding: 10px; font-weight: bold;">الحالة:</td>
                    <td style="padding: 10px;" colspan="3">
                        <span style="background: ${data.status === 'cheated' ? '#fee2e2' : '#dcfce7'}; color: ${data.status === 'cheated' ? '#991b1b' : '#166534'}; padding: 5px 15px; border-radius: 20px; font-size: 14px;">
                            ${data.status === 'cheated' ? 'تم إلغاؤه (غش)' : percentage >= 50 ? 'ناجح' : 'راسب'}
                        </span>
                    </td>
                </tr>
            </table>
        </div>
        
        ${answersTable}

        <div style="margin-top: 50px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
             <p style="font-size: 14px; color: #999;">تم استخراج هذا التقرير آلياً من منصة النحاس التعليمية</p>
        </div>
      </div>
    `;

    element.innerHTML = header;
    
    const opt = { 
        margin: 0.5, 
        filename: `تقرير_${data.studentName}_${date}.pdf`, 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2, useCORS: true, logging: false }, 
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } 
    };
    
    window.html2pdf().set(opt).from(element).save();
};

/**
 * =================================================================
 * 3. المكونات الرسومية الأساسية وتحسينات الأداء
 * =================================================================
 */

const DesignSystemLoader = () => {
  useEffect(() => {
    if (!document.getElementById('tailwind-script')) {
      const script = document.createElement('script');
      script.id = 'tailwind-script';
      script.src = "https://cdn.tailwindcss.com";
      script.onload = () => {
        if(window.tailwind) {
            window.tailwind.config = {
              theme: {
                extend: {
                  fontFamily: { 
                      sans: ['Cairo', 'sans-serif'],
                      arabic: ['Aref Ruqaa', 'serif'],
                  },
                  colors: { 
                      amber: { 50: '#fffbeb', 100: '#fef3c7', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 900: '#78350f' },
                      royal: { 900: '#0f172a', 800: '#1e293b' }
                  },
                  backgroundImage: {
                      'arabesque': "url('https://www.transparenttextures.com/patterns/arabesque.png')",
                  }
                }
              }
            }
        }
      };
      document.head.appendChild(script);
    }
    
    if (!document.getElementById('cairo-font')) {
      const link = document.createElement('link');
      link.id = 'cairo-font';
      link.rel = 'stylesheet';
      link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Aref+Ruqaa:wght@400;700&display=swap";
      document.head.appendChild(link);
    }
    
    if (!document.getElementById('html2pdf-script')) {
        const script = document.createElement('script');
        script.id = 'html2pdf-script';
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        document.head.appendChild(script);
    }
  }, []);

  return (
    <style>{`
      /* تحسين أداء السكرول ومنع اللاج */
      html, body {
          font-family: 'Cairo', sans-serif; 
          background-color: #f8fafc; 
          direction: rtl; 
          -webkit-font-smoothing: antialiased;
          scroll-behavior: smooth;
      }
      
      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-track { background: #f1f1f1; }
      ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #d97706, #b45309); border-radius: 4px; }
      
      /* Glassmorphism Classes Optimized for Mobile */
      .glass-panel { 
          background: rgba(255, 255, 255, 0.9); 
          backdrop-filter: blur(8px); 
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.4); 
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      }
      
      .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          will-change: transform;
      }
      
      .glass-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(217, 119, 6, 0.15);
          border-color: #fbbf24;
      }

      /* Text Gradients */
      .text-gradient-gold {
          background: linear-gradient(45deg, #b45309, #d97706, #fbbf24, #d97706);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% auto;
          animation: shine 3s linear infinite;
      }

      @keyframes shine {
          to { background-position: 200% center; }
      }

      /* Background Animations (Hardware Accelerated) */
      @keyframes floatChar {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(0, -30px, 0) rotate(10deg); }
      }
      .floating-char {
          animation: floatChar ease-in-out infinite;
          will-change: transform;
      }

      @keyframes pulseSlow {
          0%, 100% { transform: scale3d(1, 1, 1); opacity: 0.2; }
          50% { transform: scale3d(1.1, 1.1, 1); opacity: 0.4; }
      }
      .animate-pulse-slow {
          animation: pulseSlow 8s ease-in-out infinite;
          will-change: transform, opacity;
      }

      /* Dynamic Watermark Styles - Zero Lag */
      .watermark-text {
        position: absolute;
        pointer-events: none;
        z-index: 9999;
        color: rgba(0, 0, 0, 0.08);
        font-weight: 900;
        font-size: 1.5rem;
        transform: rotate(-30deg);
        white-space: nowrap;
        text-shadow: 0 0 2px rgba(255,255,255,0.5);
      }
      
      .watermark-video {
        position: absolute;
        top: 0; left: 0;
        animation: floatWatermark 20s linear infinite alternate;
        pointer-events: none;
        z-index: 50;
        color: rgba(255, 255, 255, 0.2); 
        font-weight: 900;
        font-size: 1.5rem;
        text-shadow: 0 0 5px rgba(0,0,0,0.8);
        white-space: nowrap;
        will-change: transform;
        -webkit-transform: translateZ(0);
      }
      
      @keyframes floatWatermark {
        0% { transform: translate3d(5vw, 10vh, 0) rotate(-10deg); }
        25% { transform: translate3d(40vw, 70vh, 0) rotate(5deg); }
        50% { transform: translate3d(10vw, 50vh, 0) rotate(-5deg); }
        75% { transform: translate3d(50vw, 20vh, 0) rotate(10deg); }
        100% { transform: translate3d(5vw, 10vh, 0) rotate(-10deg); }
      }
      
      .no-select { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
    `}</style>
  );
};

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
    return map[g] || g;
};

const ModernLogo = () => (
  <div className="relative w-20 h-20 drop-shadow-2xl cursor-pointer hover:scale-105 hover:rotate-6 transition-transform">
      <svg width="80" height="80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
        </defs>
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
        <div
            key={i}
            className="absolute text-amber-500/15 font-arabic font-bold select-none floating-char"
            style={{ 
                left: `${(i * 8.5) % 90 + 5}vw`, 
                top: `${(i * 13) % 90 + 5}vh`,
                fontSize: `${(i % 3) + 3}rem`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${15 + (i % 5)}s`
            }}
        >
            {char}
        </div>
    ))}
    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-400/10 rounded-full blur-xl animate-pulse-slow" />
    <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
  </div>
));

const WisdomBox = () => {
  const [idx, setIdx] = useState(0);
  const [quotes, setQuotes] = useState([
    { text: "النجاح مش صدفة، النجاح عزيمة وإصرار", source: "تحفيز" }, 
    { text: "ذاكر صح، مش تذاكر كتير.. ركز يا بطل", source: "نصيحة" }, 
    { text: "حلمك يستاهل تعبك، متوقفش", source: "تحفيز" }, 
    { text: "وَمَا نَيْلُ الْمَطَالِبِ بِالتَّمَنِّي ... وَلَكِنْ تُؤْخَذُ الدُّنْيَا غِلَابَا", source: "شعر" }
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
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                        {a.text}
                    </div>
                ))}
            </div>
        </div>
    );
};

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
                if(data.score && data.status === 'completed') {
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
        <div className="glass-panel p-6 rounded-2xl mb-6">
            <h3 className="text-xl font-bold font-arabic mb-4 flex items-center gap-2 text-amber-700"><Trophy className="text-amber-500 fill-amber-500" /> لوحة الشرف (الأوائل)</h3>
            <div className="space-y-3">
                {topStudents.length === 0 ? <p className="text-slate-400 text-sm">لسه مفيش حد امتحن..</p> : topStudents.map((s, i) => (
                    <div 
                        key={i} 
                        className={`flex justify-between items-center p-3 rounded-lg border-b-2 ${i===0 ? 'bg-gradient-to-r from-yellow-50 to-white border-yellow-400' : 'bg-white border-slate-100'}`}
                    >
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

const ChatWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ id: 1, text: "أهلاً بيك في منصة النحاس! 🎓\nمعاك المساعد الذكي، اسألني عن أي حاجة.", sender: 'bot' }]);
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
      if (serverMessages.length > 0 || replies.length > 0) {
        setMessages(prev => {
            const combined = [...prev];
             replies.forEach(r => { if(!combined.some(m => m.id === r.id)) combined.push(r); });
             return combined.sort((a,b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        });
      }
    });
    return () => unsub();
  }, [isOpen, user, sessionId]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userMsg = { id: Date.now(), text: inputText, sender: 'user', createdAt: { seconds: Date.now() / 1000 } };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    
    setTimeout(async () => {
      let botResponse = "";
      const lowerText = userMsg.text.toLowerCase();

      if (isContactAdminMode) {
           botResponse = "تم استلام رسالتك! المستر أو الأدمن هيشوفها ويرد عليك في أقرب وقت. ✅";
           await addDoc(collection(db, 'messages'), {
             text: userMsg.text, 
             sender: user ? user.email : sessionId, 
             senderName: user ? user.displayName : 'زائر (' + sessionId.substr(0,4) + ')', 
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
          else if (lowerText.includes("ادمن") || lowerText.includes("مستر") || lowerText.includes("تواصل")) {
               botResponse = "اكتب رسالتك للمستر وهيتم الرد عليك هنا 👇";
               setIsContactAdminMode(true);
          } else {
               botResponse = "ممكن تختار:\n1. تفاصيل الحجز (اسأل عن الحجز)\n2. رقم الواتس (اسأل عن الرقم)\n3. التواصل مع الادمن";
          }
      }

      if(botResponse) setMessages(prev => [...prev, { id: Date.now()+1, text: botResponse, sender: 'bot', createdAt: { seconds: Date.now() / 1000 } }]);
    }, 500);
  };

  const openWhatsApp = () => window.open("https://wa.me/201500076322", "_blank");
  const openFacebook = () => window.open("https://www.facebook.com/share/17aiUQWKf5/", "_blank");

  return (
    <>
      <button className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 rounded-full shadow-2xl hover:shadow-amber-500/50 transition flex items-center gap-2 transform hover:scale-105" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X /> : <MessageCircle size={28} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-24 right-6 z-50 w-80 bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-white/50 overflow-hidden flex flex-col font-['Cairo']" style={{ height: '450px' }}>
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4 text-white font-bold flex justify-between items-center shadow-md">
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div><span>مساعد النحاس</span></div>
              <div className="flex gap-2"><Facebook size={18} onClick={openFacebook} className="cursor-pointer hover:text-blue-200"/><Phone size={18} onClick={openWhatsApp} className="cursor-pointer hover:text-green-200"/></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl text-sm max-w-[85%] whitespace-pre-line shadow-sm ${msg.sender === 'user' ? 'bg-amber-100 text-amber-900 rounded-br-none' : 'bg-white border text-slate-700 rounded-bl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            {!isContactAdminMode && (
              <div className="p-2 bg-slate-100 flex gap-2 overflow-x-auto">
                <button onClick={() => setInputText("التواصل مع الادمن")} className="text-xs bg-white border px-3 py-1 rounded-full whitespace-nowrap hover:bg-slate-200 text-slate-700">تحدث مع المستر</button>
                <button onClick={openWhatsApp} className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full whitespace-nowrap hover:bg-green-100">واتساب</button>
              </div>
            )}
            <div className="p-3 border-t flex gap-2 bg-white">
              <input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} className="flex-1 border rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" placeholder={isContactAdminMode ? "اكتب رسالتك للمستر..." : "اكتب سؤالك..."} />
              <button onClick={handleSend} className="bg-amber-600 text-white p-2 rounded-lg hover:bg-amber-700 transition"><Send size={16}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const LiveSessionView = ({ session, user, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const chatRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, `live_sessions/${session.id}/chat`), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => d.data()));
      chatRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return () => unsub();
  }, [session.id]);

  const sendChat = async (e) => {
    e.preventDefault();
    if(!msgInput.trim()) return;
    await addDoc(collection(db, `live_sessions/${session.id}/chat`), {
      text: msgInput, user: user.displayName || 'طالب', createdAt: serverTimestamp()
    });
    setMsgInput("");
  };

  const isYouTube = (url) => url.includes("youtube") || url.includes("youtu.be");
  const videoId = getYouTubeID(session.liveUrl);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col md:flex-row font-['Cairo']" dir="rtl">
      <div className="flex-1 flex flex-col">
        <div className="bg-gradient-to-r from-red-600 to-red-800 p-3 text-white flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></span>
            <h2 className="font-bold">بث مباشر: {session.title}</h2>
          </div>
          <button onClick={onClose} className="text-sm bg-black/30 hover:bg-black/50 px-3 py-1 rounded transition">العودة للمنصة</button>
        </div>
        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
          <div className="watermark-video z-50">{user.displayName}</div>
          {isYouTube ? (
            <iframe width="100%" height="100%" src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1`} title="Live" frameBorder="0" allowFullScreen style={{ WebkitTransform: 'translateZ(0)' }}></iframe>
          ) : (
            <div className="w-full h-full relative">
              <iframe 
                width="100%" 
                height="100%" 
                src={session.liveUrl} 
                title="Live Meeting" 
                frameBorder="0" 
                allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen" 
                allowFullScreen
                className="relative z-10"
                style={{ WebkitTransform: 'translateZ(0)' }}
              ></iframe>
              <a href={session.liveUrl} target="_blank" rel="noopener noreferrer" className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md border border-white/20 transition flex items-center gap-2 z-50 shadow-lg">
                  <ExternalLink size={14}/> للموبايل (لو البث مش شغال)
              </a>
            </div>
          )}
        </div>
      </div>
      <div className="w-full md:w-80 bg-white border-r flex flex-col h-1/3 md:h-full">
        <div className="p-3 border-b bg-slate-50 font-bold text-slate-700">المحادثة المباشرة</div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map((m, i) => (
            <div key={i} className="text-sm bg-slate-50 p-2 rounded">
              <span className="font-bold text-amber-700">{m.user}: </span>
              <span className="text-slate-800">{m.text}</span>
            </div>
          ))}
          <div ref={chatRef} />
        </div>
        <form onSubmit={sendChat} className="p-2 border-t flex gap-2">
          <input className="flex-1 border rounded px-2 py-1 text-sm" placeholder="اكتب تعليق..." value={msgInput} onChange={e=>setMsgInput(e.target.value)} />
          <button className="bg-blue-600 text-white p-2 rounded"><Send size={16}/></button>
        </form>
      </div>
    </div>
  );
};

const SecureVideoPlayer = ({ video, userName, onClose }) => {
  const videoId = getYouTubeID(video.url || video.file);
  const [showSettings, setShowSettings] = useState(false);
  const videoRef = useRef(null);
  const finalUrl = video.url || video.file;

  const changeSpeed = (rate) => {
    if(videoRef.current) videoRef.current.playbackRate = rate;
    setShowSettings(false);
  };

  const youtubeEmbedUrl = videoId 
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&loop=1&playlist=${videoId}&playsinline=1` 
    : '';

  return (
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center p-4">
      <div className="w-full h-full max-w-7xl bg-black rounded-xl overflow-hidden relative shadow-2xl border border-gray-800 flex flex-col justify-center">
        <div className="absolute top-4 right-4 z-50 flex gap-4">
            <div className="relative">
                <button onClick={() => setShowSettings(!showSettings)} className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition"><GearIcon size={24}/></button>
                {showSettings && (
                    <div className="absolute top-12 left-0 bg-white text-black rounded-lg shadow-xl py-2 w-40 z-50 text-sm font-bold">
                        <div className="px-4 py-2 border-b text-gray-400 text-xs">سرعة التشغيل</div>
                        {[0.5, 1, 1.25, 1.5, 2].map(rate => (
                            <button key={rate} onClick={() => changeSpeed(rate)} className="block w-full text-right px-4 py-2 hover:bg-gray-100">{rate}x</button>
                        ))}
                    </div>
                )}
            </div>
            <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"><X size={24}/></button>
        </div>

        <div className="w-full relative flex items-center justify-center bg-black overflow-hidden" style={{ height: '80vh' }}>
          <div className="watermark-video">
             {userName} - {video.grade} — منصة النحاس
          </div>
          
          {videoId ? (
            <iframe 
              className="w-full h-full" 
              src={youtubeEmbedUrl} 
              title="Video" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              loading="lazy"
              style={{ WebkitTransform: 'translateZ(0)' }}
            ></iframe>
          ) : (
             <video 
                ref={videoRef} 
                controls 
                controlsList="nodownload" 
                className="w-full h-full object-contain relative z-40" 
                src={finalUrl}
                playsInline
                preload="metadata"
                disablePictureInPicture
                style={{ WebkitTransform: 'translateZ(0)' }}
             >
                المتصفح لا يدعم هذا الفيديو.
             </video>
          )}
        </div>
      </div>
    </div>
  );
};

const InteractiveViewer = ({ content, user, onClose }) => {
    const handleContextMenu = (e) => e.preventDefault();
    const [iframeSrc, setIframeSrc] = useState('');
    
    // الخدعة السحرية لحل مشكلة حظر جوجل كروم لملفات HTML
    useEffect(() => {
        let activeBlobUrl = null;
        
        if (content.url && content.url.startsWith('data:')) {
            // تحويل الملف من Data URL المحظور إلى Blob URL الآمن جداً
            fetch(content.url)
                .then(res => res.blob())
                .then(blob => {
                    activeBlobUrl = URL.createObjectURL(blob);
                    setIframeSrc(activeBlobUrl);
                })
                .catch(err => {
                    console.error("Error creating blob:", err);
                    setIframeSrc(content.url);
                });
        } else {
            // لو كان رابط خارجي عادي بنسيبه زي ما هو
            setIframeSrc(content.url);
        }

        return () => {
            // تنظيف الذاكرة عند إغلاق الملف
            if (activeBlobUrl) {
                URL.revokeObjectURL(activeBlobUrl);
            }
        };
    }, [content.url]);
    
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'PrintScreen') {
                alert('غير مسموح بأخذ لقطات شاشة! المحتوى محمي.');
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText('Screenshots are disabled');
                }
            }
        };
        
        const handleCopy = (e) => { e.preventDefault(); alert("النسخ غير مسموح!"); };
        
        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('cut', handleCopy);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('cut', handleCopy);
        };
    }, []);

    return (
        <div 
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 select-none" 
            onContextMenu={handleContextMenu}
        >
            <div className="w-full h-full max-w-7xl bg-white rounded-xl overflow-hidden relative shadow-2xl border border-gray-800 flex flex-col">
                <div className="bg-slate-900 p-3 flex justify-between items-center text-white border-b border-gray-700 select-none">
                   <div className="flex items-center gap-4">
                       <h3 className="font-bold flex items-center gap-2"><Code /> {content.title}</h3>
                       <span className="hidden md:block text-xs bg-amber-600 px-3 py-1 rounded-full text-white font-bold">منصة النحاس - أ/ محمد النحاس</span>
                   </div>
                   <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded font-bold transition">خروج</button>
                </div>
                <div className="flex-1 bg-white relative overflow-hidden">
                   {user && (
                       <div className="watermark-video" style={{ pointerEvents: 'none', zIndex: 9999 }}>
                           {user.name} - {user.grade} — منصة النحاس — أ/ محمد النحاس
                       </div>
                   )}
                   
                   <div className="absolute inset-0 z-[9998] pointer-events-none select-none"></div>

                   <iframe 
                     src={iframeSrc} 
                     className="w-full h-full border-0 relative z-40 bg-white" 
                     title={content.title}
                     sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
                     style={{ pointerEvents: 'auto', WebkitTransform: 'translateZ(0)' }}
                   ></iframe>
                </div>
            </div>
        </div>
    );
};

const ExamRunner = ({ exam, user, onClose, isReviewMode = false, existingResult = null }) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState(existingResult?.answers || {});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [isCheating, setIsCheating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(isReviewMode);
  const [score, setScore] = useState(existingResult?.score || 0);
  const [startTime] = useState(Date.now()); 
  const [wmPositions, setWmPositions] = useState([]);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const flatQuestions = useMemo(() => {
    const flat = [];
    if (exam.questions) {
        let processedBlocks = [...exam.questions];

        if (!isReviewMode && !existingResult) {
            processedBlocks = shuffleArray(processedBlocks);
        }

        processedBlocks.forEach((block) => {
            let subQs = [...block.subQuestions];
            
            if (!isReviewMode && !existingResult) {
                subQs = shuffleArray(subQs);
            }

            subQs.forEach((q) => {
                flat.push({ ...q, blockText: block.text });
            });
        });
    }
    return flat;
  }, [exam.questions, isReviewMode, existingResult]);

  if (flatQuestions.length === 0) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">عفواً، لا توجد أسئلة.<button onClick={onClose} className="ml-4 bg-gray-200 px-4 py-2 rounded">خروج</button></div>;

  useEffect(() => {
    if (isReviewMode) return;
    const updatePositions = () => {
        const newPos = [...Array(6)].map(() => ({
            top: Math.floor(Math.random() * 90) + '%',
            left: Math.floor(Math.random() * 90) + '%',
        }));
        setWmPositions(newPos);
    };
    updatePositions();
    const interval = setInterval(updatePositions, 6000); 
    return () => clearInterval(interval);
  }, [isReviewMode]);

  // تحديث جذري لنظام الحماية: استخدام المراجع الحية لضمان عدم تهرب الطالب
  const stateRefs = useRef({ isSubmitted, showSubmitConfirm, isCheating });
  useEffect(() => {
      stateRefs.current = { isSubmitted, showSubmitConfirm, isCheating };
  });

  const handleCheatingRef = useRef();
  handleCheatingRef.current = async () => {
      const { isSubmitted, isCheating } = stateRefs.current;
      if(isReviewMode || isSubmitted || isCheating) return;
      
      setIsCheating(true); 
      setIsSubmitted(true);
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      
      if (exam.attemptId) {
          await setDoc(doc(db, 'exam_results', exam.attemptId), { 
              examId: exam.id, 
              studentId: user.uid, 
              studentName: user.displayName, 
              score: 0, 
              total: flatQuestions.length,
              status: 'cheated', 
              timeTaken: timeTaken,
              totalTime: exam.duration,
              submittedAt: serverTimestamp() 
          });
      }
      
      // التعديل: جعل الحظر مقتصر على الامتحانات فقط وليس حظر كامل
      await updateDoc(doc(db, 'users', user.uid), { status: 'banned_exam' });
  };

  useEffect(() => {
      if (isReviewMode) return;

      const handleBeforeUnload = (e) => {
          if (!stateRefs.current.isSubmitted) {
              e.preventDefault();
              e.returnValue = "هل أنت متأكد؟ الخروج سيمنعك من العودة للامتحان!";
              return e.returnValue;
          }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // التعديل: تفعيل رادار المراقبة الشامل ضد تغيير التبويب أو غلق الشاشة
      const handleAntiCheat = () => { 
          const { showSubmitConfirm, isSubmitted } = stateRefs.current;
          if (!showSubmitConfirm && !isSubmitted) {
              handleCheatingRef.current();
          }
      };

      const handleVisibilityChange = () => { 
          if (document.hidden) handleAntiCheat(); 
      };
      
      const blockContextMenu = (e) => e.preventDefault();

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("blur", handleAntiCheat);
      window.addEventListener("pagehide", handleAntiCheat);
      document.addEventListener('contextmenu', blockContextMenu); 
      
      return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          document.removeEventListener("visibilitychange", handleVisibilityChange);
          window.removeEventListener("blur", handleAntiCheat);
          window.removeEventListener("pagehide", handleAntiCheat);
          document.removeEventListener('contextmenu', blockContextMenu);
      };
  }, [isReviewMode]);

  useEffect(() => {
    if (isReviewMode || isSubmitted) return;
    if (timeLeft > 0 && !isCheating) {
      const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      handleSubmit(true);
    }
  }, [timeLeft, isSubmitted, isCheating, isReviewMode]);

  const handleAnswer = (qId, optionIdx) => { 
    if(!isReviewMode && !isSubmitted) {
        setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
    }
  };
  
  const calculateScore = () => {
    let rawScore = 0;
    flatQuestions.forEach(q => { 
        if (answers[q.id] === q.correctIdx) rawScore++; 
    });
    return rawScore;
  };

  const confirmSubmit = () => {
    setShowSubmitConfirm(true);
  };

  const handleSubmit = async (auto = false) => {
    setShowSubmitConfirm(false);
    const totalQs = flatQuestions.length;
    
    const finalScore = calculateScore();
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    setScore(finalScore);
    setIsSubmitted(true);
    
    if (exam.attemptId) {
        await setDoc(doc(db, 'exam_results', exam.attemptId), { 
            examId: exam.id, 
            studentId: user.uid, 
            studentName: user.displayName, 
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

  const currentQObj = flatQuestions[currentQIndex];
  const hasPassage = currentQObj?.blockText && currentQObj.blockText.trim().length > 0;

  if (isCheating) return <div className="fixed inset-0 z-[60] bg-red-900 flex items-center justify-center text-white text-center font-['Cairo']"><div><AlertOctagon size={80} className="mx-auto mb-4"/><h1>تم رصد محاولة غش!</h1><p className="text-red-200 mt-2">خرجت من الامتحان. تم رصد درجتك (صفر) وحظرك من الامتحانات القادمة.</p><button onClick={() => window.location.reload()} className="mt-4 bg-white text-red-900 px-6 py-2 rounded-full font-bold">العودة للرئيسية</button></div></div>;

  if (isSubmitted && !isReviewMode) {
     const endTime = new Date(exam.endTime).getTime();
     const now = Date.now();
     const canReview = now > endTime;

     return (
        <div className="fixed inset-0 z-[60] bg-slate-50 overflow-y-auto p-4 font-['Cairo']" dir="rtl">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 mt-10 text-center border border-slate-200">
                <h2 className="text-3xl font-bold mb-4 font-sans text-amber-700">تم تسليم الامتحان بنجاح</h2>
                <div className={`text-6xl font-black my-6 ${score >= flatQuestions.length / 2 ? 'text-green-600' : 'text-red-600'}`}>{score} / {flatQuestions.length}</div>
                
                {!canReview && (
                    <div className="mb-6 bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200">
                        <p className="font-bold flex items-center justify-center gap-2">
                            <Clock size={20}/>
                            نموذج الإجابة والمراجعة سيظهر تلقائياً بعد انتهاء وقت الامتحان الأصلي.
                        </p>
                        <p className="text-sm mt-1 font-bold">موعد الانتهاء: {new Date(exam.endTime).toLocaleString('ar-EG')}</p>
                    </div>
                )}

                <div className="flex gap-4 justify-center">
                    {canReview ? (
                        <button onClick={() => generatePDF('student', {studentName: user.displayName, score, total: flatQuestions.length, status: 'completed', examTitle: exam.title, questions: flatQuestions, answers: answers })} className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg"><Download size={18}/> تحميل التقرير الشامل</button>
                    ) : (
                        <button disabled className="bg-gray-300 text-gray-500 px-6 py-2 rounded-lg font-bold flex items-center gap-2 cursor-not-allowed"><Lock size={18}/> التقرير مغلق حالياً</button>
                    )}
                    <button onClick={onClose} className="bg-slate-900 text-white py-3 px-8 rounded-xl font-bold shadow-lg">عودة للرئيسية</button>
                </div>
            </div>
        </div>
     );
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col font-['Cairo'] no-select" dir="rtl">
      {!isReviewMode && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {wmPositions.map((pos, i) => (
                <div key={i} className="watermark-text" style={{ top: pos.top, left: pos.left }}>
                    {user.displayName} - {user.email}
                </div>
            ))}
        </div>
      )}
      
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center border-t-4 border-amber-500">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4"/>
                <h3 className="text-xl font-bold mb-2">هل أنت متأكد من التسليم؟</h3>
                <p className="text-gray-600 mb-6">لن يمكنك تعديل الإجابات بعد ذلك.</p>
                <div className="flex gap-3">
                    <button onClick={() => handleSubmit(false)} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 shadow-md">نعم، سلم الامتحان</button>
                    <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-bold hover:bg-gray-300 shadow-sm">تراجع</button>
                </div>
            </div>
        </div>
      )}

      <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md relative z-50">
        <div className="flex items-center gap-4">
            <h2 className="font-bold text-lg font-sans text-amber-400">{exam.title} {isReviewMode ? '(مراجعة الإجابات)' : ''}</h2>
            {!isReviewMode && <div className="bg-slate-700 px-4 py-1 rounded-full font-mono shadow-inner border border-slate-600">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</div>}
        </div>
        {!isReviewMode ? (
            <button onClick={confirmSubmit} className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-2 rounded-lg font-bold shadow-lg hover:shadow-green-500/50 transition">تسليم</button>
        ) : (
            <button onClick={onClose} className="bg-slate-700 px-6 py-2 rounded-lg font-bold hover:bg-slate-600 transition">إغلاق</button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden relative z-50">
        <div className="w-16 md:w-24 bg-white border-l flex flex-col p-2 overflow-y-auto shadow-inner">
          <div className="grid grid-cols-1 gap-2">
              {flatQuestions.map((q, idx) => {
                  let statusClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
                  if (isReviewMode) {
                      if (answers[q.id] === q.correctIdx) statusClass = 'bg-green-100 text-green-700 border border-green-400 shadow-sm';
                      else statusClass = 'bg-red-100 text-red-700 border border-red-400 shadow-sm';
                  } else if (answers[q.id] !== undefined) {
                      statusClass = 'bg-blue-100 text-blue-700 border border-blue-400 shadow-sm';
                  }
                  return (
                    <button key={idx} onClick={() => setCurrentQIndex(idx)} className={`aspect-square rounded-lg font-bold text-sm transition-all ${currentQIndex === idx ? 'ring-2 ring-amber-500 shadow-md scale-105' : ''} ${statusClass}`}>
                        {idx + 1}
                        {flagged[q.id] && !isReviewMode && <div className="absolute top-0 right-0 w-3 h-3 bg-amber-500 rounded-full border-2 border-white shadow-sm"></div>}
                    </button>
                  )
              })}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${hasPassage ? 'md:flex-row' : 'items-center'} h-full overflow-hidden bg-slate-50 w-full`}>
          {hasPassage && (
            <div className="flex-1 w-full bg-gradient-to-b from-amber-50 to-orange-50 p-8 overflow-y-auto border-l border-amber-200 shadow-inner">
              <h3 className="font-bold text-amber-900 mb-6 flex items-center gap-2 text-xl border-b border-amber-200 pb-2 font-sans"><BookOpen size={24}/> اقرأ النص التالي بعناية:</h3>
              <p className="whitespace-pre-line leading-loose text-lg font-bold text-slate-800 font-sans">{currentQObj.blockText}</p>
            </div>
          )}
          
          <div className={`${hasPassage ? 'flex-1' : 'w-full max-w-4xl mx-auto'} bg-white p-8 overflow-y-auto flex flex-col shadow-lg m-4 rounded-3xl h-fit max-h-[95%] border border-slate-100`}>
            <div className="flex justify-between items-start mb-8">
              <span className="bg-slate-100 text-slate-600 px-4 py-1 rounded-full text-sm font-bold shadow-sm">سؤال {currentQIndex + 1}</span>
              {!isReviewMode && <button onClick={() => { setFlagged({...flagged, [currentQObj.id]: !flagged[currentQObj.id]}) }} className={`flex items-center gap-2 px-4 py-1 rounded-full text-sm font-bold transition shadow-sm ${flagged[currentQObj.id] ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><Flag size={16} /> مراجعة لاحقاً</button>}
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 shadow-inner">
              <h3 className="text-3xl md:text-4xl font-bold text-blue-900 leading-relaxed font-sans drop-shadow-sm">{currentQObj.text}</h3>
            </div>

            <div className="space-y-4">
              {currentQObj.options.map((opt, idx) => {
                  let optionClass = 'border-slate-200 hover:bg-slate-50';
                  const isSelected = answers[currentQObj.id] === idx;
                  
                  if (isReviewMode) {
                      if (idx === currentQObj.correctIdx) optionClass = 'border-green-500 bg-green-50 text-green-900 shadow-sm'; 
                      else if (isSelected) optionClass = 'border-red-500 bg-red-50 text-red-900 shadow-sm'; 
                  } else {
                      if (isSelected) optionClass = 'border-amber-500 bg-amber-50 text-amber-900 shadow-md transform scale-[1.01]';
                  }

                  return (
                    <div key={idx} onClick={() => handleAnswer(currentQObj.id, idx)} className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${optionClass}`}>
                      <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected || (isReviewMode && idx === currentQObj.correctIdx) ? 'border-transparent bg-current' : 'border-slate-300'}`}>
                      </div>
                      <span className="font-sans text-xl md:text-2xl font-bold">{opt}</span>
                      {isReviewMode && idx === currentQObj.correctIdx && <CheckCircle className="text-green-600 mr-auto w-8 h-8"/>}
                      {isReviewMode && isSelected && idx !== currentQObj.correctIdx && <XCircle className="text-red-600 mr-auto w-8 h-8"/>}
                    </div>
                  )
              })}
            </div>

            <div className="mt-12 flex justify-between">
              <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(p => p - 1)} className="px-8 py-3 rounded-xl bg-slate-200 text-slate-600 font-bold disabled:opacity-50 hover:bg-slate-300 transition shadow-sm">السابق</button>
              <button disabled={currentQIndex === flatQuestions.length - 1} onClick={() => setCurrentQIndex(p => p + 1)} className="px-8 py-3 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-50 hover:bg-slate-800 transition shadow-sm">التالي</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- لوحة تحكم الأدمن ---
const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('users'); 
  const [adminGradeFilter, setAdminGradeFilter] = useState('all'); // فلتر المرحلة الدراسية
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsersList, setActiveUsersList] = useState([]);
  const [contentList, setContentList] = useState([]);
  const [messagesList, setMessagesList] = useState([]); 
  const [newContent, setNewContent] = useState({ title: '', url: '', type: 'video', isPublic: false, grade: '3sec', allowedEmails: '' });
  const [liveData, setLiveData] = useState({ title: '', liveUrl: '', grade: '3sec', passcode: '', allowedEmails: '' });
  const [activeLiveSessions, setActiveLiveSessions] = useState([]);
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

  useEffect(() => { const u = onSnapshot(query(collection(db, 'users'), where('status','==','pending')), s => setPendingUsers(s.docs.map(d=>({id:d.id,...d.data()})))); return u; }, []);
  useEffect(() => { const u = onSnapshot(query(collection(db, 'users'), where('status', 'in', ['active', 'banned_cheating', 'banned_all', 'banned_exam', 'banned_content', 'rejected'])), s => setActiveUsersList(s.docs.map(d=>({id:d.id,...d.data()})))); return u; }, []);
  useEffect(() => { const u = onSnapshot(query(collection(db, 'content'), orderBy('createdAt','desc')), s => setContentList(s.docs.map(d=>({id:d.id,...d.data()})))); return u; }, []);
  useEffect(() => { const u = onSnapshot(query(collection(db, 'messages'), orderBy('createdAt','desc')), s => setMessagesList(s.docs.map(d=>({id:d.id,...d.data()})))); return u; }, []);
  useEffect(() => { const u = onSnapshot(query(collection(db, 'live_sessions'), where('status', '==', 'active')), s => setActiveLiveSessions(s.docs.map(d=>({id:d.id,...d.data()})))); return u; }, []);
  useEffect(() => { const u = onSnapshot(query(collection(db, 'exams'), orderBy('createdAt', 'desc')), s => setExamsList(s.docs.map(d=>({id:d.id,...d.data()})))); return u; }, []);
  useEffect(() => { const u = onSnapshot(query(collection(db, 'exam_results'), orderBy('submittedAt', 'desc')), s => setExamResults(s.docs.map(d=>({id:d.id,...d.data()})))); return u; }, []);
  useEffect(() => { const u = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), s => setAnnouncements(s.docs.map(d => ({id: d.id, ...d.data()})))); return u; }, []);
  useEffect(() => { const u = onSnapshot(collection(db, 'auto_replies'), s => setAutoReplies(s.docs.map(d => ({id: d.id, ...d.data()})))); return u; }, []);
  useEffect(() => { const u = onSnapshot(collection(db, 'quotes'), s => setQuotesList(s.docs.map(d => ({id: d.id, ...d.data()})))); return u; }, []);

  const handleApprove = async (id) => {
    await updateDoc(doc(db,'users',id), {status:'active'});
    sendSystemNotification("مبروك! 🎉", "تم تفعيل حسابك بنجاح.");
  };
  const handleReject = async (id) => updateDoc(doc(db,'users',id), {status:'rejected'});
  
  const handleChangeUserStatus = async (id, newStatus) => {
      await updateDoc(doc(db,'users',id), {status: newStatus});
  };

  const handleDeleteUser = async (id) => { if(window.confirm("حذف نهائي؟")) await deleteDoc(doc(db,'users',id)); };
  const handleDeleteMessage = async (id) => { if(window.confirm("حذف الرسالة؟")) await deleteDoc(doc(db,'messages',id)); };
  const handleDeleteExam = async (id) => { if(window.confirm("حذف الامتحان؟")) await deleteDoc(doc(db, 'exams', id)); };
  const handleDeleteAnnouncement = async (id) => { if(window.confirm("حذف الإعلان؟")) await deleteDoc(doc(db, 'announcements', id)); };
  
  const handleDeleteResult = async (resultId) => { if(window.confirm("حذف النتيجة؟")) await deleteDoc(doc(db, 'exam_results', resultId)); };
  
  const handleDeleteAllResults = async () => {
    if(window.confirm("تحذير خطير: سيتم حذف جميع نتائج الامتحانات لكل الطلاب. هل أنت متأكد؟")) {
      const batch = writeBatch(db);
      examResults.forEach(res => {
        batch.delete(doc(db, 'exam_results', res.id));
      });
      await batch.commit();
      alert("تم حذف جميع النتائج بنجاح.");
    }
  };

  const handleReplyMessage = async (msgId) => {
    const text = replyTexts[msgId];
    if (!text?.trim()) return;
    await updateDoc(doc(db, 'messages', msgId), { adminReply: text });
    setReplyTexts(prev => ({ ...prev, [msgId]: '' }));
    alert("تم إرسال الرد!");
  };
  
  const handleAddAnnouncement = async () => {
      if(!newAnnouncement.trim()) return;
      await addDoc(collection(db, 'announcements'), { text: newAnnouncement, createdAt: serverTimestamp() });
      await addDoc(collection(db, 'notifications'), {
        text: `تنبيه هام: ${newAnnouncement}`,
        grade: 'all',
        createdAt: serverTimestamp()
      });
      setNewAnnouncement("");
      alert("تم نشر الإعلان");
  };

  const handleUpdateUser = async (e) => { e.preventDefault(); if(!editingUser) return; await updateDoc(doc(db, 'users', editingUser.id), { name: editingUser.name, phone: editingUser.phone, parentPhone: editingUser.parentPhone, grade: editingUser.grade }); setEditingUser(null); };
  const handleSendResetPassword = async (email) => { if(window.confirm(`إرسال رابط تغيير كلمة السر لـ ${email}؟`)) await sendPasswordResetEmail(auth, email); };
  
  const approveGrade = async (user) => {
      if (!user.requestedGrade) return;
      await updateDoc(doc(db, 'users', user.id), {
          grade: user.requestedGrade,
          requestedGrade: null,
          gradeUpdateStatus: null
      });
      alert(`تم تغيير مرحلة الطالب ${user.name} بنجاح.`);
  };

  const rejectGrade = async (user) => {
      await updateDoc(doc(db, 'users', user.id), {
          requestedGrade: null,
          gradeUpdateStatus: null
      });
      alert(`تم رفض طلب تغيير المرحلة للطالب ${user.name}.`);
  };

  const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 1048576) { 
          alert("⚠️ تنبيه: حجم الملف أكبر من 1 ميجا.\n\nقواعد البيانات لا تقبل ملفات ضخمة مباشرة. لرفع ملفات كبيرة (كتب كاملة أو فيديوهات)، يرجى رفعها على Google Drive ونسخ الرابط هنا في خانة 'الرابط'.");
          e.target.value = null; 
          return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onprogress = (event) => {
          if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percent);
          }
      };
      reader.onloadend = () => {
          setNewContent({...newContent, url: reader.result});
          setIsUploading(false);
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(0), 2000);
      };
      reader.readAsDataURL(file);
  };

  const handleAddContent = async (e) => { 
      e.preventDefault(); 
      const allowedEmailsArray = newContent.allowedEmails 
        ? newContent.allowedEmails.split(',').map(email => email.trim()) 
        : [];

      const contentData = { 
          ...newContent, 
          file: newContent.url, 
          allowedEmails: allowedEmailsArray,
          createdAt: new Date() 
      };
      
      await addDoc(collection(db, 'content'), contentData);
      
      if (allowedEmailsArray.length === 0) {
          await addDoc(collection(db, 'notifications'), { text: `تم إضافة درس جديد: ${newContent.title}`, grade: newContent.grade, createdAt: serverTimestamp() });
      } 
      
      alert("تم النشر!"); 
      setNewContent({ title: '', url: '', type: 'video', isPublic: false, grade: '3sec', allowedEmails: '' });
  }; 
  
  const handleDeleteContent = async (id) => { if(window.confirm("حذف هذا المحتوى؟")) await deleteDoc(doc(db, 'content', id)); };

  const startLiveStream = async () => { 
      if(!liveData.liveUrl) return alert("الرابط مطلوب!"); 
      const allowedEmailsArray = liveData.allowedEmails ? liveData.allowedEmails.split(',').map(email => email.trim()) : [];
      await addDoc(collection(db, 'live_sessions'), { 
          ...liveData, 
          allowedEmails: allowedEmailsArray,
          status: 'active', 
          createdAt: serverTimestamp() 
      }); 
      if (allowedEmailsArray.length === 0) {
          await addDoc(collection(db, 'notifications'), { text: `🔴 بث مباشر الآن: ${liveData.title}`, grade: liveData.grade, createdAt: serverTimestamp() }); 
      }
      alert("بدأ البث!"); 
      setLiveData({ title: '', liveUrl: '', grade: '3sec', passcode: '', allowedEmails: '' });
  };

  const stopLiveStream = async (id) => { 
      if(window.confirm("إنهاء البث؟")) { 
          await updateDoc(doc(db, 'live_sessions', id), { status: 'ended' }); 
          alert("تم الإنهاء"); 
      } 
  };

  const parseExam = async () => {
    if (!bulkText.trim()) return alert("أدخل نص الامتحان");
    if (!examBuilder.accessCode) return alert("أدخل كود للامتحان");
    if (!examBuilder.startTime || !examBuilder.endTime) return alert("يرجى تحديد وقت البدء والانتهاء");

    const lines = bulkText.split('\n').map(l => l.trim());
    const blocks = [];
    let currentBlock = { text: '', subQuestions: [] };
    let currentQ = null;
    let isReadingPassage = false;

    lines.forEach(line => {
      if (line === 'بداية القطعة') { 
          if (currentQ) { currentBlock.subQuestions.push(currentQ); currentQ = null; }
          if (currentBlock.subQuestions.length > 0) { blocks.push(currentBlock); } 
          currentBlock = { text: '', subQuestions: [] }; 
          isReadingPassage = true; 
          return; 
      }
      if (line === 'نهاية القطعة') { isReadingPassage = false; return; }
      if (line === 'حذف القطعة') { 
          if(currentQ) { currentBlock.subQuestions.push(currentQ); currentQ = null; } 
          if (currentBlock.subQuestions.length > 0) { blocks.push(currentBlock); }
          currentBlock = { text: '', subQuestions: [] }; 
          return; 
      }

      if (isReadingPassage) { 
          if(line !== '') currentBlock.text += line + '\n'; 
      } 
      else {
        if (line === '') {
            if (currentQ && currentQ.options.length > 0) {
                currentBlock.subQuestions.push(currentQ);
                currentQ = null;
            }
            return;
        }

        const isCorrect = line.startsWith('*');
        const optText = isCorrect ? line.substring(1).trim() : line.trim();

        if (currentQ && currentQ.options.length >= 4 && !isCorrect) {
            currentBlock.subQuestions.push(currentQ);
            currentQ = null;
        }

        if (!currentQ) {
            currentQ = { id: Date.now() + Math.random(), text: optText, options: [], correctIdx: 0 };
        } else {
            if (isCorrect) {
                currentQ.correctIdx = currentQ.options.length;
            }
            currentQ.options.push(optText);
        }
      }
    });
    
    if (currentQ && currentQ.options.length > 0) currentBlock.subQuestions.push(currentQ);
    if (currentBlock.subQuestions.length > 0) blocks.push(currentBlock);

    const finalBlocks = blocks.filter(b => b.subQuestions.length > 0);
    if (finalBlocks.length === 0) return alert("لم يتم التعرف على أسئلة بشكل صحيح. تأكد من وجود إجابات تحت كل سؤال.");

    await addDoc(collection(db, 'exams'), { 
        title: examBuilder.title, grade: examBuilder.grade, duration: examBuilder.duration, 
        startTime: examBuilder.startTime, endTime: examBuilder.endTime, accessCode: examBuilder.accessCode, 
        questions: finalBlocks, createdAt: serverTimestamp() 
    });
    
    await addDoc(collection(db, 'notifications'), { text: `امتحان جديد: ${examBuilder.title}`, grade: examBuilder.grade, createdAt: serverTimestamp() });
    setBulkText(""); alert(`تم نشر الامتحان بنجاح!`);
  };
  
  const getQuestionsForExam = (examData) => {
      const flat = [];
      if(examData && examData.questions) { examData.questions.forEach(group => { group.subQuestions.forEach(q => { flat.push({ ...q, blockText: group.text }); }); }); }
      return flat;
  };

  const toggleLeaderboard = async () => {
      await setDoc(doc(db, 'settings', 'config'), { show: !showLeaderboard }, { merge: true });
      setShowLeaderboard(!showLeaderboard);
  };

  const handleAddAutoReply = async () => {
      if(!newAutoReply.keywords || !newAutoReply.response) return alert("أكمل البيانات");
      await addDoc(collection(db, 'auto_replies'), newAutoReply);
      setNewAutoReply({ keywords: '', response: '', isActive: true });
  };
  const toggleAutoReply = async (id, currentStatus) => {
      await updateDoc(doc(db, 'auto_replies', id), { isActive: !currentStatus });
  };
  const deleteAutoReply = async (id) => {
      if(window.confirm("حذف هذا الرد؟")) await deleteDoc(doc(db, 'auto_replies', id));
  };

  const handleAddQuote = async () => {
      if(!newQuote.text || !newQuote.source) return alert("أكمل البيانات");
      await addDoc(collection(db, 'quotes'), { ...newQuote, createdAt: serverTimestamp() });
      setNewQuote({ text: '', source: '' });
  };
  const deleteQuote = async (id) => {
      if(window.confirm("حذف هذه الحكمة؟")) await deleteDoc(doc(db, 'quotes', id));
  };

  // تطبيق الفلترة على القوائم بناءً على اختيار الأدمن
  const filteredPendingUsers = pendingUsers.filter(u => adminGradeFilter === 'all' || u.grade === adminGradeFilter);
  const filteredActiveUsers = activeUsersList.filter(u => adminGradeFilter === 'all' || u.grade === adminGradeFilter);
  const filteredContentList = contentList.filter(c => adminGradeFilter === 'all' || c.grade === adminGradeFilter);
  const filteredExamsList = examsList.filter(e => adminGradeFilter === 'all' || e.grade === adminGradeFilter);
  const filteredLiveSessions = activeLiveSessions.filter(ls => adminGradeFilter === 'all' || ls.grade === adminGradeFilter);

  return (
    <div className="min-h-screen bg-slate-100 font-['Cairo'] relative" dir="rtl">
      <FloatingArabicBackground />
      
      <header className="flex justify-between items-center mb-8 glass-panel p-4 rounded-xl relative z-10 m-4">
        <div className="flex items-center gap-2"><ShieldAlert className="text-amber-600"/> <h1 className="text-2xl font-bold font-arabic text-slate-800">لوحة تحكم النحاس (الأدمن)</h1></div>
        <div className="flex gap-4 items-center">
            <select 
                className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold shadow-sm cursor-pointer"
                value={adminGradeFilter}
                onChange={(e) => setAdminGradeFilter(e.target.value)}
            >
                <option value="all">كل المراحل الدراسية</option>
                <GradeOptions />
            </select>
            <button onClick={() => signOut(auth)} className="text-red-500 font-bold px-4 py-2 flex gap-2 hover:bg-red-50 rounded-lg transition"><LogOut /> خروج</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 relative z-10">
        <div className="glass-panel p-4 rounded-xl h-fit space-y-2">
          {['users', 'all_users', 'exams', 'results', 'live', 'content', 'messages', 'auto_reply', 'quotes', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-right p-3 rounded-lg font-bold flex gap-2 transition-all ${activeTab===tab?'bg-amber-100 text-amber-700 shadow-sm border-r-4 border-amber-500':'hover:bg-slate-50 text-slate-600'}`}>
              {tab === 'users' ? 'الطلبات' : tab === 'all_users' ? 'الطلاب' : tab === 'exams' ? 'الامتحانات' : tab === 'results' ? 'النتائج' : tab === 'live' ? 'البث' : tab === 'content' ? 'المحتوى' : tab === 'messages' ? 'الرسائل' : tab === 'auto_reply' ? 'الرد الآلي' : tab === 'quotes' ? 'إدارة الحكم' : 'الإعدادات'}
            </button>
          ))}
        </div>

        <div className="md:col-span-3">
          {activeTab === 'users' && <div className="glass-panel p-6 rounded-xl"><h2 className="font-bold mb-4 font-arabic text-xl">طلبات الانضمام</h2>{filteredPendingUsers.map(u=><div key={u.id} className="border p-4 mb-2 rounded-lg flex justify-between bg-white/50 backdrop-blur-sm"><div><p className="font-bold">{u.name}</p><p className="text-sm">{u.grade}</p></div><div className="flex gap-2"><button onClick={()=>handleApprove(u.id)} className="bg-green-600 text-white px-3 py-1 rounded shadow-lg hover:shadow-green-500/50 transition"><Check/></button><button onClick={()=>handleReject(u.id)} className="bg-red-600 text-white px-3 py-1 rounded shadow-lg hover:shadow-red-500/50 transition"><X/></button></div></div>)}</div>}

          {activeTab === 'all_users' && (
              <div className="glass-panel p-6 rounded-xl">
                  <h2 className="font-bold mb-4 font-arabic text-xl">قائمة الطلاب ({filteredActiveUsers.length})</h2>
                  {editingUser&&<form onSubmit={handleUpdateUser} className="mb-4 bg-amber-50 p-4 rounded grid gap-2"><input className="border p-2" value={editingUser.name} onChange={e=>setEditingUser({...editingUser, name:e.target.value})}/><button className="bg-green-600 text-white px-4 py-1 rounded">حفظ</button></form>}
                  
                  <div className="grid gap-4">
                      {filteredActiveUsers.map(u=>(
                          <div key={u.id} className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all hover:shadow-lg ${u.status.startsWith('banned') ? 'bg-red-50 border-red-200' : 'bg-white/50 border-slate-100'}`}>
                              <div className="flex flex-col md:flex-row justify-between w-full">
                                  <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                          <p className="font-bold text-lg text-slate-800">{u.name}</p>
                                          <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{getGradeLabel(u.grade)}</span>
                                          {u.status.startsWith('banned') && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-bold">محظور</span>}
                                      </div>
                                      <div className="text-sm text-slate-500 space-y-1">
                                          <p className="flex items-center gap-2"><Mail size={14}/> {u.email}</p>
                                          <p className="flex items-center gap-2"><Phone size={14} className="text-blue-600"/> الطالب: {u.phone}</p>
                                          <p className="flex items-center gap-2 font-bold text-amber-700"><Users size={14}/> ولي الأمر: {u.parentPhone}</p>
                                          <p className="text-xs text-slate-400">تاريخ الانضمام: {u.createdAt?.toDate().toLocaleDateString()}</p>
                                      </div>
                                  </div>
                                  
                                  <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                                      <div className="flex gap-2">
                                          {u.status.startsWith('banned') && (
                                              <button 
                                                  onClick={() => handleChangeUserStatus(u.id, 'active')}
                                                  className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-200 flex items-center gap-1"
                                              >
                                                  <Unlock size={14} /> فك الحظر
                                              </button>
                                          )}
                                          <select 
                                              className="text-xs border p-2 rounded-lg bg-white"
                                              value={u.status}
                                              onChange={(e) => handleChangeUserStatus(u.id, e.target.value)}
                                          >
                                              <option value="active">نشط (Active)</option>
                                              <option value="banned_all">حظر شامل (Full Ban)</option>
                                              <option value="banned_exam">حظر امتحانات (Exam Ban)</option>
                                              <option value="banned_content">حظر محتوى (Content Ban)</option>
                                          </select>
                                      </div>
                                      <div className="flex gap-2 justify-end">
                                          <button onClick={()=>setEditingUser(u)} className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200" title="تعديل"><Edit size={16}/></button>
                                          <button onClick={()=>handleSendResetPassword(u.email)} className="bg-amber-100 text-amber-600 p-2 rounded-lg hover:bg-amber-200" title="تغيير كلمة السر"><KeyRound size={16}/></button>
                                          <button onClick={()=>handleDeleteUser(u.id)} className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200" title="حذف"><Trash2 size={16}/></button>
                                      </div>
                                  </div>
                              </div>

                              {u.gradeUpdateStatus === 'pending' && (
                                  <div className="w-full bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex justify-between items-center">
                                      <div className="flex items-center gap-2 text-yellow-800 text-sm font-bold">
                                          <RefreshCw size={16} className="animate-spin-slow" />
                                          يريد التحويل إلى: <span className="bg-white px-2 rounded border">{getGradeLabel(u.requestedGrade)}</span>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => approveGrade(u)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700">موافقة</button>
                                          <button onClick={() => rejectGrade(u)} className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700">رفض</button>
                                      </div>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'exams' && <div className="space-y-8"><div className="glass-panel p-6 rounded-xl"><h2 className="text-xl font-bold mb-6 border-b pb-2 font-arabic text-amber-700">إنشاء امتحان</h2><div className="grid grid-cols-4 gap-4 mb-6"><input className="border p-2 rounded col-span-2" placeholder="العنوان" value={examBuilder.title} onChange={e=>setExamBuilder({...examBuilder, title:e.target.value})}/><input className="border p-2 rounded" placeholder="الكود" value={examBuilder.accessCode} onChange={e=>setExamBuilder({...examBuilder, accessCode:e.target.value})}/><input type="number" className="border p-2 rounded" placeholder="المدة (دقائق)" value={examBuilder.duration} onChange={e=>setExamBuilder({...examBuilder, duration:parseInt(e.target.value)})}/><select className="border p-2 rounded col-span-4" value={examBuilder.grade} onChange={e=>setExamBuilder({...examBuilder, grade:e.target.value})}><GradeOptions/></select><div className="col-span-2"><label className="block text-xs font-bold mb-1">وقت البدء</label><input type="datetime-local" className="border p-2 rounded w-full" onChange={e=>setExamBuilder({...examBuilder, startTime:e.target.value})}/></div><div className="col-span-2"><label className="block text-xs font-bold mb-1">وقت الانتهاء</label><input type="datetime-local" className="border p-2 rounded w-full" onChange={e=>setExamBuilder({...examBuilder, endTime:e.target.value})}/></div></div><div className="bg-slate-50 p-4 rounded-xl border mb-6"><textarea className="w-full border p-4 rounded-lg h-96 font-mono text-sm" placeholder="اكتب الأسئلة هنا...&#10;(هام: افصل بين كل سؤال والذي يليه بسطر فارغ تماماً، وضع علامة * قبل الإجابة الصحيحة)" value={bulkText} onChange={e=>setBulkText(e.target.value)}/><button onClick={parseExam} className="mt-4 w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-green-500/50 transition">نشر</button></div></div><div className="glass-panel p-6 rounded-xl"><h3 className="font-bold mb-4 font-arabic">الامتحانات الحالية</h3>{filteredExamsList.map(exam=><div key={exam.id} className="flex justify-between items-center border-b py-3 last:border-0 hover:bg-slate-50/50 px-2 rounded transition"><div><p className="font-bold">{exam.title}</p><p className="text-xs text-slate-500">من: {new Date(exam.startTime).toLocaleString('ar-EG')} | إلى: {new Date(exam.endTime).toLocaleString('ar-EG')}</p><p className="text-xs text-slate-400">كود: {exam.accessCode}</p></div><div className="flex gap-2"><button onClick={()=>handleDeleteExam(exam.id)} className="text-red-500 p-2"><Trash2 size={18}/></button></div></div>)}</div></div>}

          {activeTab === 'results' && (
             <div className="glass-panel p-6 rounded-xl">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="font-bold flex items-center gap-2 font-arabic text-xl"><Layout/> نتائج الامتحانات</h2>
                 {!viewingResult && examResults.length > 0 && (
                     <button onClick={handleDeleteAllResults} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition shadow-lg">
                         <Trash2 size={16}/> حذف جميع النتائج
                     </button>
                 )}
               </div>
               {viewingResult ? (
                   <div className="bg-slate-50 p-4 rounded-xl border">
                       <div className="flex justify-between mb-4">
                           <button onClick={() => setViewingResult(null)} className="mb-4 text-sm text-slate-500 underline font-bold">العودة للقائمة</button>
                           {(() => {
                               const examData = examsList.find(e => e.id === viewingResult.examId);
                               const questions = getQuestionsForExam(examData);
                               return (
                                   <button onClick={() => generatePDF('admin', {...viewingResult, total: viewingResult.total || 0, examTitle: examData?.title, questions: questions, answers: viewingResult.answers })} className="bg-blue-600 text-white px-4 py-1 rounded text-sm flex items-center gap-2"><Download size={16}/> تحميل التقرير الكامل</button>
                               );
                           })()}
                       </div>
                       <h3 className="font-bold text-lg mb-2">إجابات الطالب: {viewingResult.studentName}</h3>
                       <div className="space-y-4 mt-4">
                           {(() => {
                               const examData = examsList.find(e => e.id === viewingResult.examId);
                               if(!examData) return <p>بيانات الامتحان محذوفة</p>;
                               const questions = getQuestionsForExam(examData);
                               return questions.map((q, idx) => (
                                   <div key={idx} className="bg-white p-4 rounded border">
                                           <p className="font-bold mb-2 text-xl text-blue-900 font-sans">{q.text}</p>
                                           <div className="grid grid-cols-2 gap-2 text-sm">
                                               {q.options.map((opt, oIdx) => {
                                                   const isCorrect = oIdx === q.correctIdx;
                                                   const isSelected = viewingResult.answers[q.id] === oIdx;
                                                   let style = "bg-gray-50 text-gray-500";
                                                   if (isCorrect) style = "bg-green-100 text-green-800 border-green-500 border font-bold text-lg";
                                                   if (isSelected && !isCorrect) style = "bg-red-100 text-red-800 border-red-500 border font-bold text-lg";
                                                   return <div key={oIdx} className={`p-2 rounded font-sans font-bold ${style}`}>{opt}</div>
                                               })}
                                           </div>
                                   </div>
                               ));
                           })()}
                       </div>
                   </div>
               ) : (
                   <div className="space-y-2">
                       {examResults.map(res => (
                           <div key={res.id} className="flex justify-between items-center border p-3 rounded hover:bg-slate-50 transition bg-white/50">
                               <div><p className="font-bold">{res.studentName}</p><p className="text-xs text-slate-500">{res.status==='cheated'?'غش 🚫': res.status==='in_progress' ? 'قيد التنفيذ (لم يسلم) ⏳' : `درجة: ${res.score}/${res.total}`}</p></div>
                               <div className="flex gap-2"><button onClick={()=>setViewingResult(res)} className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs">التفاصيل</button><button onClick={()=>handleDeleteResult(res.id)} className="bg-amber-100 text-amber-600 px-3 py-1 rounded text-xs">إعادة</button></div>
                           </div>
                       ))}
                   </div>
               )}
             </div>
          )}

          {activeTab === 'live' && (
              <div className="glass-panel p-8 rounded-xl border-t-4 border-red-600">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-red-600 font-arabic"><Radio size={32}/> البث المباشر</h2>
                  <div className="grid gap-4 mb-8">
                      <input className="border p-3 rounded-xl" placeholder="العنوان" value={liveData.title} onChange={e=>setLiveData({...liveData, title:e.target.value})}/>
                      <input className="border p-3 rounded-xl" placeholder="رابط البث (Zoom/YouTube/Meet)" value={liveData.liveUrl} onChange={e=>setLiveData({...liveData, liveUrl:e.target.value})}/>
                      <input className="border p-3 rounded-xl" placeholder="الرقم السري (اختياري، اتركه فارغاً للدخول بدون كود)" value={liveData.passcode} onChange={e=>setLiveData({...liveData, passcode:e.target.value})}/>
                      <input className="border p-3 rounded-xl" placeholder="إيميلات مخصصة (اختياري، افصل بفاصلة)" value={liveData.allowedEmails} onChange={e=>setLiveData({...liveData, allowedEmails:e.target.value})}/>
                      <select className="border p-3 rounded-xl" value={liveData.grade} onChange={e=>setLiveData({...liveData, grade:e.target.value})}><GradeOptions/></select>
                      <button onClick={startLiveStream} className="bg-red-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-red-500/30">بدء بث جديد</button>
                  </div>
                  
                  {filteredLiveSessions.length > 0 && (
                      <div className="mt-8 border-t pt-6">
                          <h3 className="font-bold mb-4">البث المباشر الحالي</h3>
                          <div className="space-y-3">
                              {filteredLiveSessions.map(session => (
                                  <div key={session.id} className="p-4 bg-red-50 border border-red-200 rounded-xl flex justify-between items-center">
                                      <div>
                                          <p className="font-bold text-red-800">{session.title} <span className="text-xs bg-red-200 px-2 py-1 rounded-full text-red-700">{getGradeLabel(session.grade)}</span></p>
                                          {session.passcode && <p className="text-xs text-red-600 mt-1">كود الدخول: {session.passcode}</p>}
                                      </div>
                                      <button onClick={() => stopLiveStream(session.id)} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-900 transition">إنهاء البث</button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'content' && (
              <div className="glass-panel p-6 rounded-xl">
                  <h2 className="font-bold mb-4 font-arabic text-xl">إضافة محتوى</h2>
                  <form onSubmit={handleAddContent} className="grid gap-4 mb-6">
                      <input className="border p-3 rounded" placeholder="العنوان" value={newContent.title} onChange={e=>setNewContent({...newContent, title:e.target.value})}/>
                      <input className="border p-3 rounded" placeholder="الرابط (يفضل Google Drive للملفات الكبيرة)" value={newContent.url} onChange={e=>setNewContent({...newContent, url:e.target.value})}/>
                      
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition relative">
                          <input type="file" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                              <Upload size={32} />
                              <span className="text-sm font-bold">اضغط هنا لرفع ملف (الحد الأقصى 1 ميجا)</span>
                              <span className="text-xs text-red-400">للملفات الأكبر، استخدم رابط خارجي</span>
                          </div>
                          {isUploading && (
                              <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center rounded-xl z-10">
                                  <span className="text-sm font-bold text-amber-600 mb-1">جاري القراءة... {uploadProgress}%</span>
                                  <div className="w-3/4 h-2 bg-slate-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                  </div>
                              </div>
                          )}
                          {!isUploading && uploadProgress === 100 && (
                              <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl z-10">
                                  <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={20}/> تم اختيار الملف</span>
                              </div>
                          )}
                      </div>

                      <div className="flex gap-2">
                          <select className="border p-3 rounded flex-1" value={newContent.type} onChange={e=>setNewContent({...newContent, type:e.target.value})}>
                              <option value="video">فيديو مدمج</option>
                              <option value="file">ملف (PDF)</option>
                              <option value="html">ملف تفاعلي (HTML)</option>
                              <option value="interactive_exam">امتحان تفاعلي (رابط/HTML)</option>
                              <option value="link">رابط خارجي (Google Meet, Drive, etc)</option>
                          </select>
                          <select className="border p-3 rounded flex-1" value={newContent.grade} onChange={e=>setNewContent({...newContent, grade:e.target.value})}><GradeOptions/></select>
                      </div>
                      
                      <div className="border p-3 rounded-lg bg-gray-50">
                          <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><Lock size={14}/> تخصيص لطلاب محددين (اختياري)</label>
                          <input 
                            className="border p-2 rounded w-full text-sm" 
                            placeholder="اكتب إيميلات الطلاب مفصولة بفاصلة (مثال: student1@gmail.com, student2@yahoo.com)" 
                            value={newContent.allowedEmails} 
                            onChange={e=>setNewContent({...newContent, allowedEmails:e.target.value})}
                          />
                          <p className="text-xs text-gray-500 mt-1">اتركه فارغاً لكي يظهر المحتوى لجميع طلاب الصف.</p>
                      </div>

                      <div className="flex items-center gap-2">
                          <input type="checkbox" checked={newContent.isPublic} onChange={e=>setNewContent({...newContent, isPublic:e.target.checked})}/> <label>عام (للصفحة الرئيسية)</label>
                      </div>
                      <button className="bg-amber-600 text-white p-3 rounded font-bold shadow-lg shadow-amber-500/30">نشر</button>
                  </form>
                  <div className="space-y-2">
                      {filteredContentList.map(c=>(
                          <div key={c.id} className="flex justify-between border-b p-2 items-center bg-white/50 rounded hover:bg-white transition">
                              <div>
                                  <span className="font-bold">{c.title}</span>
                                  {c.allowedEmails && c.allowedEmails.length > 0 && <span className="mr-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded flex items-center gap-1 inline-flex"><Lock size={10}/> خاص</span>}
                                  {c.type === 'interactive_exam' && <span className="mr-2 text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded">امتحان تفاعلي</span>}
                                  {c.type === 'html' && <span className="mr-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">HTML</span>}
                                  {c.type === 'link' && <span className="mr-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">رابط خارجي</span>}
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => handleDeleteContent(c.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'messages' && <div className="glass-panel p-6 rounded-xl"><h2 className="font-bold mb-4 font-arabic text-xl">الرسائل</h2>{messagesList.map(m=><div key={m.id} className="border-b p-4 bg-slate-50 mb-3 rounded-lg relative"><button onClick={()=>handleDeleteMessage(m.id)} className="absolute top-2 left-2 text-red-400"><Trash2 size={16}/></button><div className="mb-2"><p className="font-bold text-amber-800">{m.senderName} <span className="text-xs text-slate-500">({m.sender})</span></p><p className="text-sm text-slate-400">{m.createdAt?.toDate?m.createdAt.toDate().toLocaleString():'الآن'}</p></div><p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 mb-3">{m.text}</p>{m.adminReply?<div className="bg-green-50 p-3 rounded-lg border border-green-200 text-sm"><span className="font-bold text-green-700">ردك: </span>{m.adminReply}</div>:<div className="flex gap-2"><input className="flex-1 border p-2 rounded text-sm" placeholder="اكتب ردك..." value={replyTexts[m.id]||""} onChange={e=>setReplyTexts({...replyTexts,[m.id]:e.target.value})}/><button onClick={()=>handleReplyMessage(m.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm"><Reply size={14}/></button></div>}</div>)}</div>}
           
          {activeTab === 'auto_reply' && (
              <div className="glass-panel p-6 rounded-xl">
                  <h2 className="font-bold mb-4 flex items-center gap-2 font-arabic text-xl"><Bot /> إعدادات الرد الآلي</h2>
                  <div className="bg-slate-50 p-4 rounded-xl border mb-6">
                      <h3 className="font-bold mb-2 text-sm">إضافة قاعدة جديدة</h3>
                      <div className="grid gap-3">
                          <input className="border p-2 rounded" placeholder="الكلمات المفتاحية (افصل بينها بفاصلة، مثال: سعر,حجز,مواعيد)" value={newAutoReply.keywords} onChange={e=>setNewAutoReply({...newAutoReply, keywords:e.target.value})} />
                          <textarea className="border p-2 rounded h-20" placeholder="الرد الذي سيظهر للطالب..." value={newAutoReply.response} onChange={e=>setNewAutoReply({...newAutoReply, response:e.target.value})} />
                          <button onClick={handleAddAutoReply} className="bg-amber-600 text-white py-2 rounded font-bold hover:bg-amber-700">إضافة القاعدة</button>
                      </div>
                  </div>
                  <div className="space-y-3">
                      {autoReplies.map(rule => (
                          <div key={rule.id} className={`p-4 rounded-lg border flex justify-between items-center ${rule.isActive ? 'bg-white border-green-200' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
                              <div className="flex-1">
                                  <p className="font-bold text-sm text-slate-600 mb-1">الكلمات: <span className="text-blue-600">{rule.keywords}</span></p>
                                  <p className="text-slate-800">{rule.response}</p>
                              </div>
                              <div className="flex items-center gap-2 mr-4">
                                  <button onClick={() => toggleAutoReply(rule.id, rule.isActive)} className={`p-2 rounded-full ${rule.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`} title={rule.isActive ? "تعطيل" : "تنشيط"}>
                                      <Power size={18} />
                                  </button>
                                  <button onClick={() => deleteAutoReply(rule.id)} className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200">
                                      <Trash2 size={18} />
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'quotes' && (
              <div className="glass-panel p-6 rounded-xl">
                  <h2 className="font-bold mb-4 flex items-center gap-2 font-arabic text-xl"><PenTool /> إدارة الحكم والأقوال</h2>
                  <div className="bg-slate-50 p-4 rounded-xl border mb-6">
                      <h3 className="font-bold mb-2 text-sm">إضافة حكمة جديدة</h3>
                      <div className="grid gap-3">
                          <input className="border p-2 rounded" placeholder="نص الحكمة" value={newQuote.text} onChange={e=>setNewQuote({...newQuote, text:e.target.value})} />
                          <input className="border p-2 rounded" placeholder="المصدر (مثال: تحفيز، شعر، حكمة)" value={newQuote.source} onChange={e=>setNewQuote({...newQuote, source:e.target.value})} />
                          <button onClick={handleAddQuote} className="bg-amber-600 text-white py-2 rounded font-bold hover:bg-amber-700">إضافة</button>
                      </div>
                  </div>
                  <div className="space-y-3">
                      {quotesList.map(q => (
                          <div key={q.id} className="p-3 rounded-lg border bg-white flex justify-between items-center">
                              <div>
                                  <p className="font-bold text-slate-800">"{q.text}"</p>
                                  <p className="text-xs text-slate-500">- {q.source}</p>
                              </div>
                              <button onClick={() => deleteQuote(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                  <Trash2 size={18} />
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'settings' && (
              <div className="glass-panel p-6 rounded-xl space-y-6">
                  <h2 className="font-bold mb-4 font-arabic text-xl">إدارة الموقع</h2>
                  <div className="border p-4 rounded-xl">
                      <h3 className="font-bold mb-2 text-amber-600">شريط الإعلانات</h3>
                      <div className="flex gap-2 mb-2">
                          <input className="border p-2 flex-1 rounded" placeholder="نص الإعلان" value={newAnnouncement} onChange={e=>setNewAnnouncement(e.target.value)} />
                          <button onClick={handleAddAnnouncement} className="bg-green-600 text-white px-4 rounded">نشر</button>
                      </div>
                      <div className="space-y-1">
                          {announcements.map(a => (
                              <div key={a.id} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                                  <span className="text-sm">{a.text}</span>
                                  <button onClick={() => handleDeleteAnnouncement(a.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="border p-4 rounded-xl flex justify-between items-center">
                      <div>
                          <h3 className="font-bold text-blue-600">لوحة الشرف (الأوائل)</h3>
                          <p className="text-sm text-slate-500">إظهار أو إخفاء لوحة الأوائل في صفحة الطلاب</p>
                      </div>
                      <button onClick={toggleLeaderboard} className={`px-6 py-2 rounded-full font-bold ${showLeaderboard ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                          {showLeaderboard ? 'ظاهرة' : 'مخفية'}
                      </button>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 4. حساب الطالب ---
const StudentDashboard = ({ user, userData }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [content, setContent] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]); 
  const [activeLiveView, setActiveLiveView] = useState(null); 
  const [exams, setExams] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [playingHtml, setPlayingHtml] = useState(null);
  const [examResults, setExamResults] = useState([]);
  const [reviewingExam, setReviewingExam] = useState(null);
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotif, setHasNewNotif] = useState(false);

  const [editFormData, setEditFormData] = useState({ name: '', phone: '', parentPhone: '', grade: '' });

  useEffect(() => {
    if(!userData) return;
    
    const unsubContent = onSnapshot(query(collection(db, 'content'), where('grade', '==', userData.grade)), s => {
        const allContent = s.docs.map(d=>({id:d.id,...d.data()}));
        const visibleContent = allContent.filter(c => {
            if (!c.allowedEmails || c.allowedEmails.length === 0) return true;
            return c.allowedEmails.includes(user.email);
        });
        setContent(visibleContent);
    });

    const unsubLive = onSnapshot(query(collection(db, 'live_sessions'), where('status', '==', 'active'), where('grade', '==', userData.grade)), s => {
        const activeSessions = s.docs.map(d=>({id:d.id, ...d.data()}));
        const visibleSessions = activeSessions.filter(ls => {
            if (!ls.allowedEmails || ls.allowedEmails.length === 0) return true;
            return ls.allowedEmails.includes(user.email);
        });
        setLiveSessions(visibleSessions);
    });

    const unsubExams = onSnapshot(query(collection(db, 'exams'), where('grade', '==', userData.grade)), s => setExams(s.docs.map(d=>({id:d.id,...d.data()}))));
    const unsubResults = onSnapshot(query(collection(db, 'exam_results'), where('studentId', '==', user.uid)), s => setExamResults(s.docs.map(d=>({id:d.id,...d.data()}))));
    
    const unsubNotif = onSnapshot(query(collection(db, 'notifications'), where('grade', 'in', ['all', userData.grade]), orderBy('createdAt', 'desc'), limit(10)), s => {
        const newNotifs = s.docs.map(d => d.data());
        setNotifications(newNotifs);
        if(newNotifs.length > 0) {
             setHasNewNotif(true);
             if(newNotifs[0].text) sendSystemNotification("تنبيه جديد 🔔", newNotifs[0].text);
        }
    });

    setEditFormData({ name: userData.name, phone: userData.phone, parentPhone: userData.parentPhone, grade: userData.grade });

    return () => { unsubContent(); unsubLive(); unsubExams(); unsubResults(); unsubNotif(); };
  }, [userData, user]);

  if(activeLiveView) return <LiveSessionView session={activeLiveView} user={user} onClose={() => setActiveLiveView(null)} />;
  
  if (activeExam) return <ExamRunner exam={activeExam} user={user} onClose={() => setActiveExam(null)} />;
  
  if (reviewingExam) {
      const result = examResults.find(r => r.examId === reviewingExam.id);
      return <ExamRunner exam={reviewingExam} user={user} onClose={() => setReviewingExam(null)} isReviewMode={true} existingResult={result} />;
  }

  // --- منطق الحظر ---
  const isBannedAll = userData?.status === 'banned_all';
  const isBannedExam = userData?.status === 'banned_exam' || userData?.status === 'banned_cheating'; 
  const isBannedContent = userData?.status === 'banned_content';

  if(userData?.status === 'pending') return <div className="h-screen flex items-center justify-center bg-amber-50 text-center p-4"><div className="bg-white p-8 rounded-2xl shadow-xl"><h2 className="text-2xl font-bold mb-2">طلبك قيد المراجعة ⏳</h2><button onClick={()=>signOut(auth)} className="mt-4 text-red-500 underline">خروج</button></div></div>;
  if(userData?.status === 'rejected') return <div className="h-screen flex items-center justify-center bg-red-50"><div className="text-red-600 font-bold">تم رفض طلبك</div><button onClick={()=>signOut(auth)} className="ml-4 bg-white px-4 py-1 rounded">خروج</button></div>;
  
  if (isBannedAll) return (
      <div className="h-screen flex flex-col items-center justify-center bg-red-50 text-center p-6">
          <Ban size={80} className="text-red-600 mb-4" />
          <h2 className="text-3xl font-bold text-red-800 mb-2 font-arabic">تم حظر حسابك</h2>
          <p className="text-red-600 mb-6 font-bold">يرجى التواصل مع الإدارة أو المستر لمعرفة السبب.</p>
          <button onClick={()=>signOut(auth)} className="bg-white text-red-600 px-6 py-2 rounded-full font-bold shadow-md hover:bg-red-100">تسجيل الخروج</button>
      </div>
  );

  const videos = content.filter(c => c.type === 'video');
  const filesAndLinks = content.filter(c => c.type === 'file' || c.type === 'link');
  const htmls = content.filter(c => c.type === 'html');
  const interactiveExams = content.filter(c => c.type === 'interactive_exam');

  const handleJoinLive = (session) => {
      if (session.passcode) {
          const code = prompt("أدخل الكود السري الخاص بالبث المباشر:");
          if (code !== session.passcode) {
              return alert("عفواً، الكود غير صحيح!");
          }
      }
      setActiveLiveView(session);
  };

  const startExamWithCode = async (exam) => {
    if (isBannedExam) return alert("أنت محظور من دخول الامتحانات.");

    const previousResult = examResults.find(r => r.examId === exam.id);
    
    if (previousResult) {
        if (previousResult.status === 'completed') {
            alert(`أنت امتحنت الامتحان ده قبل كده وجبت ${previousResult.score}.`);
        } else if (previousResult.status === 'in_progress' || previousResult.status === 'cheated') {
            alert("لقد بدأت هذا الامتحان بالفعل وتم احتسابه عليك. لا يمكن الإعادة.");
        }
        return;
    }

    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(exam.endTime);

    if (now < start) return alert(`الامتحان لم يبدأ بعد. موعد البدء: ${start.toLocaleString('ar-EG')}`);
    if (now > end) return alert("عفواً، انتهى وقت الامتحان.");

    const code = prompt("أدخل كود الامتحان:");
    if (code === exam.accessCode) {
        try {
            const attemptRef = await addDoc(collection(db, 'exam_results'), { 
                examId: exam.id, 
                studentId: user.uid, 
                studentName: user.displayName,
                score: 0,
                total: 0,
                status: 'in_progress', 
                submittedAt: serverTimestamp() 
            });
            setActiveExam({ ...exam, attemptId: attemptRef.id });
        } catch (error) {
            console.error("Error creating attempt record:", error);
            alert("حدث خطأ أثناء بدء الامتحان. حاول مرة أخرى.");
        }
    } else {
        alert("كود خاطئ!");
    }
  };

  const handleUpdateMyProfile = async (e) => {
    e.preventDefault();
    if (editFormData.grade !== userData.grade) {
        await updateDoc(doc(db, 'users', user.uid), {
            phone: editFormData.phone,
            requestedGrade: editFormData.grade,
            gradeUpdateStatus: 'pending'
        });
        alert("تم إرسال طلب تغيير الصف الدراسي إلى الإدارة للموافقة.");
    } else {
        await updateDoc(doc(db, 'users', user.uid), {
            phone: editFormData.phone,
        });
        alert("تم تحديث بياناتك بنجاح!");
    }
  };

  return (
    <div className="bg-slate-50 relative font-['Cairo'] min-h-screen block" dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} userName={userData.name} onClose={() => setPlayingVideo(null)} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={userData} onClose={() => setPlayingHtml(null)} />}
      
      <FloatingArabicBackground />
      <ChatWidget user={user} />
      
      <aside className={`fixed top-0 bottom-0 right-0 z-40 bg-white/95 backdrop-blur-xl w-72 p-6 shadow-xl transition-transform duration-300 ${mobileMenu ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} border-l border-slate-200 flex flex-col`}>
        <div className="flex items-center gap-3 mb-10 px-2"><ModernLogo /><h1 className="text-2xl font-bold font-arabic text-amber-800">النحاس</h1><button onClick={() => setMobileMenu(false)} className="md:hidden mr-auto"><X /></button></div>
        <div className="space-y-2 flex-1 overflow-y-auto pr-2">
          <button onClick={() => {setActiveTab('home'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition ${activeTab==='home'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><User/> الرئيسية</button>
          
          {!isBannedContent && (
              <>
                <div onClick={() => setActiveTab('videos')} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='videos'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><PlayCircle/> المحاضرات</div>
                <div onClick={() => setActiveTab('files')} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='files'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><FileText/> الملفات و الروابط</div>
                <div onClick={() => setActiveTab('htmls')} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='htmls'?'bg-purple-100 text-purple-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-purple-600'}`}><Code/> محتوى تفاعلي</div>
              </>
          )}
          
          {!isBannedExam && (
              <>
                <div onClick={() => setActiveTab('exams')} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='exams'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><ClipboardList/> الامتحانات</div>
                <div onClick={() => setActiveTab('interactive_exams')} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='interactive_exams'?'bg-emerald-100 text-emerald-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'}`}><Sparkles/> امتحان تفاعلي</div>
              </>
          )}
          
          <button onClick={() => {setActiveTab('settings'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition ${activeTab==='settings'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><Settings/> ملفي الشخصي</button>
        </div>
        <div className="mt-auto pt-6"><button onClick={() => signOut(auth)} className="flex items-center gap-3 text-red-500 font-bold hover:bg-red-50 w-full p-4 rounded-xl transition"><LogOut/> خروج</button></div>
      </aside>

      <main className="p-4 md:p-10 relative z-10 min-h-screen md:pr-72 w-full transition-all">
        <div className="md:hidden flex justify-between items-center mb-6 glass-panel p-4 rounded-2xl shadow-sm"><h1 className="font-bold text-lg text-slate-800">منصة النحاس</h1><button onClick={() => setMobileMenu(true)} className="p-2 bg-slate-100 rounded-lg"><Menu /></button></div>
        
        <div className="flex justify-end mb-6 relative">
            <button onClick={() => {requestNotificationPermission(); setShowNotifications(!showNotifications); setHasNewNotif(false);}} className="relative p-2 glass-panel rounded-full shadow-sm hover:bg-white transition">
                <Bell className="text-slate-600"/>
                {hasNewNotif && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
            </button>
            {showNotifications && (
                <div className="absolute top-12 left-0 w-80 glass-panel rounded-xl shadow-xl border border-white/50 p-4 z-50 max-h-96 overflow-y-auto">
                    <h3 className="font-bold mb-3 text-sm text-slate-500">الإشعارات</h3>
                    {notifications.length === 0 ? <p className="text-xs text-slate-400">لا توجد إشعارات جديدة</p> : (
                        <div className="space-y-3">
                            {notifications.map((n, i) => (
                                <div key={i} className="text-sm bg-slate-50/50 p-2 rounded border-l-4 border-amber-500">
                                    {n.text}
                                    <div className="text-[10px] text-slate-400 mt-1">{n.createdAt?.toDate().toLocaleDateString()}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>

        {activeTab === 'home' && (
            <div className="space-y-8">
                {liveSessions.map(ls => (
                    <div key={ls.id} className="bg-gradient-to-r from-red-600 to-red-800 text-white p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg border border-red-500/50 animate-pulse-slow">
                        <div>
                           <h3 className="font-bold font-arabic text-xl flex items-center gap-2"><Radio className="animate-pulse"/> بث مباشر الآن: {ls.title}</h3>
                           {ls.passcode && <p className="text-xs text-red-200 mt-1">هذا البث محمي برقم سري</p>}
                        </div>
                        <button onClick={() => handleJoinLive(ls)} className="bg-white text-red-700 px-6 py-2 rounded-full font-bold shadow-md hover:bg-red-50 transition w-full md:w-auto">انضمام الآن</button>
                    </div>
                ))}

                <WisdomBox />
                <Announcements />
                <h2 className="text-3xl font-bold text-slate-800 font-arabic">منور يا <span className="text-amber-600">{userData.name.split(' ')[0]}</span> 👋 <span className="text-sm font-normal text-slate-500 bg-slate-200 px-2 py-1 rounded-full font-sans">{getGradeLabel(userData.grade)}</span></h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    <motion.div whileHover={{ scale: 1.02 }} onClick={()=> !isBannedContent && setActiveTab('videos')} className={`glass-card p-8 rounded-3xl relative overflow-hidden cursor-pointer group ${isBannedContent ? 'opacity-50 grayscale' : ''}`}>
                        <h3 className="relative z-10 text-xl font-bold mb-2 text-blue-900 group-hover:text-blue-600 transition">المحاضرات</h3>
                        <p className="relative z-10 text-3xl font-black text-blue-600">{videos.length}</p>
                        <PlayCircle className="absolute -bottom-6 -left-6 text-blue-200 opacity-50 w-40 h-40 group-hover:scale-110 transition"/>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} onClick={()=> !isBannedContent && setActiveTab('files')} className={`glass-card p-8 rounded-3xl relative overflow-hidden cursor-pointer group ${isBannedContent ? 'opacity-50 grayscale' : ''}`}>
                        <h3 className="relative z-10 text-xl font-bold mb-2 text-amber-900 group-hover:text-amber-600 transition">الملفات</h3>
                        <p className="relative z-10 text-3xl font-black text-amber-600">{filesAndLinks.length}</p>
                        <FileText className="absolute -bottom-6 -left-6 text-amber-200 opacity-50 w-40 h-40 group-hover:scale-110 transition"/>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} onClick={()=> !isBannedContent && setActiveTab('htmls')} className={`glass-card p-8 rounded-3xl relative overflow-hidden cursor-pointer group ${isBannedContent ? 'opacity-50 grayscale' : ''}`}>
                        <h3 className="relative z-10 text-xl font-bold mb-2 text-purple-900 group-hover:text-purple-600 transition">تفاعلي</h3>
                        <p className="relative z-10 text-3xl font-black text-purple-600">{htmls.length}</p>
                        <Code className="absolute -bottom-6 -left-6 text-purple-200 opacity-50 w-40 h-40 group-hover:scale-110 transition"/>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} onClick={()=> !isBannedExam && setActiveTab('exams')} className={`glass-card p-8 rounded-3xl relative overflow-hidden cursor-pointer group ${isBannedExam ? 'opacity-50 grayscale' : ''}`}>
                        <h3 className="relative z-10 text-xl font-bold mb-2 text-slate-900 group-hover:text-slate-600 transition">الامتحانات</h3>
                        <p className="relative z-10 text-3xl font-black text-slate-600">{exams.length}</p>
                        <ClipboardList className="absolute -bottom-6 -left-6 text-slate-200 opacity-50 w-40 h-40 group-hover:scale-110 transition"/>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} onClick={()=> !isBannedExam && setActiveTab('interactive_exams')} className={`glass-card p-8 rounded-3xl relative overflow-hidden cursor-pointer group ${isBannedExam ? 'opacity-50 grayscale' : ''}`}>
                        <h3 className="relative z-10 text-xl font-bold mb-2 text-emerald-900 group-hover:text-emerald-600 transition">امتحان تفاعلي</h3>
                        <p className="relative z-10 text-3xl font-black text-emerald-600">{interactiveExams.length}</p>
                        <Sparkles className="absolute -bottom-6 -left-6 text-emerald-200 opacity-50 w-40 h-40 group-hover:scale-110 transition"/>
                    </motion.div>
                </div>
                <Leaderboard />
            </div>
        )}
        
        {activeTab === 'videos' && !isBannedContent && <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{videos.map(v => (<div key={v.id} className="glass-card rounded-xl overflow-hidden cursor-pointer" onClick={() => setPlayingVideo(v)}><div className="h-48 bg-gradient-to-br from-slate-800 to-black flex items-center justify-center relative group"><PlayCircle className="text-white w-16 h-16 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/><span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(v.grade)}</span></div><div className="p-4"><h3 className="font-bold text-lg text-slate-800">{v.title}</h3></div></div>))}</div>}
        
        {activeTab === 'files' && !isBannedContent && (
            <div className="glass-panel rounded-xl overflow-hidden">
                {filesAndLinks.map(f => (
                    <div key={f.id} className="p-4 flex justify-between items-center border-b last:border-0 hover:bg-white/50 transition">
                        <div className="flex items-center gap-4">
                            {f.type === 'link' ? (
                                <div className="bg-blue-100 text-blue-600 p-3 rounded-lg font-bold text-xs shadow-sm flex items-center justify-center"><LinkIcon size={16}/></div>
                            ) : (
                                <div className="bg-red-100 text-red-600 p-3 rounded-lg font-bold text-xs shadow-sm">PDF</div>
                            )}
                            <div>
                                <h4 className="font-bold text-lg text-slate-800">{f.title}</h4>
                                <span className="text-xs text-slate-500">{getGradeLabel(f.grade)}</span>
                            </div>
                        </div>
                        <a href={f.url} target="_blank" rel="noopener noreferrer" className={`px-4 py-2 rounded-lg font-bold transition shadow-sm ${f.type === 'link' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                            {f.type === 'link' ? 'فتح الرابط' : 'تحميل'}
                        </a>
                    </div>
                ))}
            </div>
        )}
        
        {activeTab === 'htmls' && !isBannedContent && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {htmls.map(h => (
                    <motion.div whileHover={{y:-5}} key={h.id} className="glass-card rounded-xl overflow-hidden cursor-pointer" onClick={() => setPlayingHtml(h)}>
                        <div className="h-48 bg-gradient-to-br from-purple-600 to-indigo-900 flex items-center justify-center relative group">
                            <Code className="text-white w-20 h-20 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/>
                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(h.grade)}</span>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-lg text-slate-800">{h.title}</h3>
                            <button className="mt-2 w-full bg-purple-100 text-purple-700 font-bold py-2 rounded-lg hover:bg-purple-200 transition shadow-sm">تشغيل</button>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}

        {activeTab === 'interactive_exams' && !isBannedExam && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {interactiveExams.map(h => (
                    <motion.div whileHover={{y:-5}} key={h.id} className="glass-card rounded-xl overflow-hidden cursor-pointer" onClick={() => setPlayingHtml(h)}>
                        <div className="h-48 bg-gradient-to-br from-emerald-600 to-teal-900 flex items-center justify-center relative group">
                            <Sparkles className="text-white w-20 h-20 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/>
                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(h.grade)}</span>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-lg text-slate-800">{h.title}</h3>
                            <button className="mt-2 w-full bg-emerald-100 text-emerald-700 font-bold py-2 rounded-lg hover:bg-emerald-200 transition shadow-sm">بدء الامتحان</button>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
        
        {activeTab === 'exams' && !isBannedExam && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {exams.map(e => {
                const prevResult = examResults.find(r => r.examId === e.id);
                const isExamTimeOver = Date.now() > new Date(e.endTime).getTime();
                
                let statusText = null;
                let statusClass = "";
                if (prevResult) {
                    if (prevResult.status === 'completed') {
                        statusText = `تم الحل: ${prevResult.score} درجة`;
                        statusClass = "bg-green-500 text-white";
                    } else if (prevResult.status === 'in_progress') {
                        statusText = "قيد التنفيذ / انسحاب ⚠️";
                        statusClass = "bg-yellow-500 text-white";
                    } else if (prevResult.status === 'cheated') {
                        statusText = "تم الحظر (غش)";
                        statusClass = "bg-red-600 text-white";
                    }
                }

                return (
                  <motion.div whileHover={{scale:1.01}} key={e.id} className="glass-card p-6 rounded-2xl relative overflow-hidden">
                    {statusText && <div className={`absolute top-0 left-0 text-xs px-3 py-1 rounded-br-xl font-bold shadow-md ${statusClass}`}>{statusText}</div>}
                    <h3 className="text-xl font-bold mb-2 text-slate-800">{e.title}</h3>
                    <div className="flex justify-between text-sm text-slate-500 mb-4"><span>⏳ {e.duration} دقيقة</span><span>📝 {e.questions.reduce((acc,g)=>acc+g.subQuestions.length,0)} سؤال</span></div>
                    {prevResult && prevResult.status === 'completed' ? (
                        <div className="flex gap-2">
                             <button disabled className="flex-1 bg-slate-200 text-slate-500 py-3 rounded-xl font-bold cursor-not-allowed">تم الانتهاء</button>
                             {isExamTimeOver ? (
                                <button onClick={() => setReviewingExam(e)} className="flex-1 bg-blue-100 text-blue-700 py-3 rounded-xl font-bold hover:bg-blue-200 transition shadow-sm">عرض الأخطاء</button>
                             ) : (
                                <button disabled className="flex-1 bg-gray-100 text-gray-400 py-3 rounded-xl font-bold cursor-not-allowed text-xs">المراجعة بعد الوقت</button>
                             )}
                             <button onClick={() => generatePDF('student', {studentName: user.displayName, score: prevResult.score, total: e.questions.reduce((acc,g)=>acc+g.subQuestions.length,0), status: prevResult.status, examTitle: e.title, questions: e.questions.flatMap(q => q.subQuestions), answers: prevResult.answers })} className="flex-1 bg-green-100 text-green-700 py-3 rounded-xl font-bold hover:bg-green-200 flex items-center justify-center gap-1 transition shadow-sm"><Download size={16}/> شهادة</button>
                        </div>
                    ) : prevResult ? (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl font-bold text-center border border-red-200">
                            لا يمكن إعادة الامتحان
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs text-slate-500">يبدأ: {new Date(e.startTime).toLocaleString('ar-EG')}</p>
                            <button onClick={() => startExamWithCode(e)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-lg hover:shadow-slate-500/30 transition"><Lock size={16}/> ابدأ الامتحان</button>
                        </div>
                    )}
                  </motion.div>
                )
             })}
          </div>
        )}

        {activeTab === 'settings' && (
              <div className="glass-panel p-8 rounded-xl max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 font-arabic text-slate-800"><Settings className="text-slate-700"/> إعدادات الحساب</h2>
                
                {userData.gradeUpdateStatus === 'pending' && (
                    <div className="mb-4 bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200 flex items-center gap-2 font-bold">
                        <RefreshCw className="animate-spin-slow" size={20} />
                        لقد قمت بطلب تغيير المرحلة إلى {getGradeLabel(userData.requestedGrade)}. الطلب قيد المراجعة.
                    </div>
                )}

                <form onSubmit={handleUpdateMyProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">الاسم</label>
                    <input disabled className="w-full border p-3 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed" value={editFormData.name} />
                    <p className="text-xs text-red-500 mt-1">لا يمكن تغيير الاسم (تواصل مع الإدارة).</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label>
                    <input className="w-full border p-3 rounded-xl" value={editFormData.phone} onChange={e=>setEditFormData({...editFormData, phone:e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">رقم ولي الأمر</label>
                    <input disabled className="w-full border p-3 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed" value={editFormData.parentPhone} />
                    <p className="text-xs text-red-500 mt-1">لا يمكن تغيير رقم ولي الأمر.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">الصف الدراسي (يتطلب موافقة الأدمن)</label>
                    <select 
                        className="w-full border p-3 rounded-xl bg-white" 
                        value={editFormData.grade} 
                        onChange={e=>setEditFormData({...editFormData, grade:e.target.value})}
                    >
                      <GradeOptions />
                    </select>
                  </div>
                  <button className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/40 transition">حفظ التعديلات</button>
                </form>
              </div>
        )}
      </main>
    </div>
  );
};

// --- 5. الصفحة الرئيسية العامة (Landing) ---
const LandingPage = ({ onAuthClick }) => {
  const [publicContent, setPublicContent] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null); 
  const [playingHtml, setPlayingHtml] = useState(null);
  
  useEffect(() => { const u = onSnapshot(query(collection(db, 'content'), where('isPublic', '==', true)), s => setPublicContent(s.docs.map(d=>d.data()))); return u; }, []);
  const openFacebook = () => window.open("https://www.facebook.com/share/17aiUQWKf5/", "_blank");

  return (
    <div className="min-h-screen font-['Cairo'] relative" dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} userName="زائر" onClose={() => setPlayingVideo(null)} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={null} onClose={() => setPlayingHtml(null)} />}
      <FloatingArabicBackground />
      <ChatWidget />
      <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto glass-panel mt-4 rounded-full mx-4 shadow-lg">
        <div className="flex items-center gap-2"><ModernLogo /><span className="text-2xl font-bold font-arabic text-amber-800">منصة النحاس</span></div>
        <div className="flex gap-4 items-center">
          <button onClick={openFacebook} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/50"><Facebook size={20}/></button>
          <button onClick={onAuthClick} className="bg-slate-900 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:shadow-slate-500/50 transition transform hover:-translate-y-0.5">دخول الطالب</button>
        </div>
      </nav>
      <main className="relative z-10 px-4 mt-10 max-w-7xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6">اللغة العربية <span className="text-amber-600">لعبتك</span></h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">أقوى منصة تعليمية للمرحلة الإعدادية والثانوية.</p>
        <button onClick={onAuthClick} className="bg-amber-600 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-xl hover:bg-amber-700 transition transform hover:-translate-y-1">اشترك الآن 🚀</button>
        
        <div className="my-12">
            <WisdomBox />
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-10 mb-20">
          <div className="bg-white/80 backdrop-blur p-6 rounded-3xl border border-white shadow-sm">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-700"><Video /> فيديوهات مجانية</h3>
            <div className="space-y-4">
              {publicContent.filter(c => c.type === 'video').length > 0 ? publicContent.filter(c => c.type === 'video').map((v, i) => (
                 <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm cursor-pointer hover:bg-gray-50" onClick={() => setPlayingVideo(v)}>
                    <PlayCircle className="text-amber-500"/>
                    <span className="font-bold">{v.title}</span>
                    <span className="mr-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">مشاهدة</span>
                 </div>
               )) : <p className="text-slate-500">مفيش فيديوهات عامة حالياً</p>}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur p-6 rounded-3xl border border-white shadow-sm">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-purple-700"><Code /> تفاعلي عام</h3>
            <div className="space-y-4">
              {publicContent.filter(c => c.type === 'html').length > 0 ? publicContent.filter(c => c.type === 'html').map((h, i) => (
                 <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm cursor-pointer hover:bg-gray-50" onClick={() => setPlayingHtml(h)}>
                    <Code className="text-purple-500"/>
                    <span className="font-bold">{h.title}</span>
                    <span className="mr-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">تشغيل</span>
                 </div>
               )) : <p className="text-slate-500">مفيش محتوى تفاعلي عام حالياً</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// صفحة الدخول والتسجيل
const AuthPage = ({ onBack }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', grade: '1sec', phone: '', parentPhone: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // التحقق من صحة الأرقام
    const egyptPhoneRegex = /^01[0125][0-9]{8}$/;
    if (isRegister) {
        if (!egyptPhoneRegex.test(formData.phone)) return alert("رقم الطالب غير صحيح! يجب أن يكون 11 رقم ويبدأ بـ 010, 011, 012, أو 015");
        if (!egyptPhoneRegex.test(formData.parentPhone)) return alert("رقم ولي الأمر غير صحيح!");
        if (formData.phone === formData.parentPhone) return alert("عفواً، لا يمكن تكرار رقم الهاتف!");
    }

    try {
      if (isRegister) {
        const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCred.user, { displayName: formData.name });
        await setDoc(doc(db, 'users', userCred.user.uid), {
          name: formData.name, email: formData.email, grade: formData.grade, phone: formData.phone, parentPhone: formData.parentPhone, role: 'student', status: 'pending', createdAt: new Date()
        });
        alert("تم إنشاء الحساب! انتظر تفعيل الأدمن.");
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
    } catch (error) { alert("حدث خطأ: " + error.message); } 
    finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if(!formData.email) { alert("من فضلك اكتب الإيميل الأول."); return; }
    try { await sendPasswordResetEmail(auth, formData.email); alert("تم إرسال رابط استعادة كلمة السر."); } catch (error) { alert("حدث خطأ: " + error.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 font-['Cairo'] relative overflow-hidden" dir="rtl">
      <FloatingArabicBackground />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-2xl relative z-10 my-10 overflow-y-auto max-h-[90vh] border border-white/50">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-sm mb-6 flex items-center gap-1 font-bold"><ChevronRight size={18} /> العودة</button>
        <div className="flex justify-center mb-4"><ModernLogo /></div>
        <h2 className="text-3xl font-bold font-arabic text-slate-800 mb-2 text-center">{isRegister ? 'حساب جديد' : 'تسجيل دخول'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
          {isRegister && (
            <>
              <div className="relative"><User className="absolute top-3.5 right-4 text-slate-400" size={20} /><input required type="text" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition" placeholder="الاسم ثلاثي" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="relative"><Phone className="absolute top-3.5 right-4 text-slate-400" size={20} /><input required type="tel" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition" placeholder="رقم هاتفك" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="relative"><Phone className="absolute top-3.5 right-4 text-slate-400" size={20} /><input required type="tel" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition" placeholder="رقم ولي الأمر" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} /></div>
              <div className="relative"><GraduationCap className="absolute top-3.5 right-4 text-slate-400" size={20} />
                <select className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 appearance-none focus:border-amber-500 outline-none transition" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                  <GradeOptions />
                </select>
              </div>
            </>
          )}
          <div className="relative"><Mail className="absolute top-3.5 right-4 text-slate-400" size={20} /><input required type="email" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition" placeholder="البريد" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          <div className="relative"><Lock className="absolute top-3.5 right-4 text-slate-400" size={20} /><input required type="password" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition" placeholder="كلمة السر" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
          {!isRegister && (<div className="text-left"><button type="button" onClick={handleForgotPassword} className="text-xs text-amber-600 font-bold hover:underline">نسيت كلمة السر؟</button></div>)}
          <button disabled={loading} className="bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/50 transition mt-2 flex justify-center">{loading ? <Loader2 className="animate-spin" /> : (isRegister ? 'تسجيل' : 'دخول')}</button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)} className="mt-6 text-amber-800 font-bold hover:underline w-full text-center block text-sm">{isRegister ? 'تسجيل الدخول' : 'حساب جديد'}</button>
      </motion.div>
      <ChatWidget />
    </div>
  );
};

// --- التطبيق الرئيسي ---
export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [viewMode, setViewMode] = useState('landing');

  useEffect(() => {
    if (!auth) return;
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        setLoading(true);
        const unsubUser = onSnapshot(doc(db, 'users', u.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
          setLoading(false);
        });
        return () => unsubUser();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  if (authLoading || (user && loading)) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-amber-600 w-12 h-12"/></div>;

  return (
    <AnimatePresence mode='wait'>
      <DesignSystemLoader />
      {!user ? (
        viewMode === 'landing' ? <LandingPage key="landing" onAuthClick={() => setViewMode('auth')} /> : <AuthPage key="auth" onBack={() => setViewMode('landing')} />
      ) : (
        user.email === 'mido16280@gmail.com' ? <AdminDashboard key="admin" user={user} /> : <StudentDashboard key="student" user={user} userData={userData} />
      )}
    </AnimatePresence>
  );
}