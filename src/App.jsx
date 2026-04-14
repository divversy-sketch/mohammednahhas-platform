import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, getDoc, getDocs, collection, addDoc, query, where, 
  onSnapshot, updateDoc, deleteDoc, orderBy, serverTimestamp, writeBatch, limit, increment 
} from 'firebase/firestore';
import { 
  PlayCircle, FileText, LogOut, User, GraduationCap, Quote, CheckCircle, 
  Lock, Mail, ChevronRight, Menu, X, Loader2, AlertTriangle, PlusCircle, 
  Check, Trash2, Eye, ShieldAlert, Video, UploadCloud, Phone, Edit, KeyRound,
  MessageSquare, Send, MessageCircle, Facebook, BookOpen, Feather, Radio, 
  ExternalLink, ClipboardList, Timer, AlertOctagon, Flag, Save, HelpCircle, 
  Reply, Unlock, Layout, Settings, Trophy, Megaphone, Bell, Download, XCircle, 
  Calendar, Clock, FileWarning, Settings as GearIcon, Star, Bot, Power, Upload,
  Users, PenTool, Code, Sparkles, Lamp, Ban, Shield, RefreshCw, Link as LinkIcon, History, Camera, QrCode, FileCheck, MousePointerClick, BarChart3, Layers,
  BrainCircuit, Headphones, DownloadCloud, PenLine, Play, Pause, SkipForward
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

const formatWatchTime = (totalSeconds) => {
    if (!totalSeconds || totalSeconds < 0) return 'أقل من ثانية';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    let res = [];
    if (h > 0) res.push(`${h} ساعة`);
    if (m > 0) res.push(`${m} دقيقة`);
    if (s > 0 || res.length === 0) res.push(`${s} ثانية`);
    
    return res.join(' و ');
};

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
    } catch (e) { 
        console.error("Notification Error:", e); 
    }
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
            <h3 style="background: #eee; padding: 10px; border-right: 5px solid #d97706; font-family: 'Cairo', sans-serif;">تفاصيل الإجابات</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 15px; font-family: 'Cairo', sans-serif;">
                <thead>
                    <tr style="background-color: #f3f4f6; color: #333;">
                        <th style="border: 1px solid #ddd; padding: 10px; width: 5%;">#</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">السؤال</th>
                        <th style="border: 1px solid #ddd; padding: 10px; width: 10%;">الفرع</th>
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
                        const branchName = q.branch || 'عام';
                        
                        return `
                        <tr style="background-color: ${isCorrect ? '#f0fdf4' : '#fef2f2'};">
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${i + 1}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${q.text.replace(/\|/g, '<br>')}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #0284c7;">${branchName}</td>
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
            <table style="width: 100%; font-size: 18px; font-family: 'Cairo', sans-serif;">
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
        pointer-events: none;
        z-index: 9999;
        color: rgba(255, 255, 255, 0.4); 
        font-weight: 900;
        font-size: 1.5rem;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        white-space: nowrap;
        animation: moveWatermark 25s linear infinite;
      }
      
      .no-select { 
          -webkit-user-select: none; 
          -moz-user-select: none; 
          -ms-user-select: none; 
          user-select: none; 
      }
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

  useEffect(() => { 
      const t = setInterval(() => setIdx(i => (i+1)%quotes.length), 6000); 
      return () => clearInterval(t); 
  }, [quotes]);
  
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
          <div className="watermark-video z-50">{user?.displayName || 'طالب'}</div>
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

const SecureVideoPlayer = ({ video, user, userName, onClose }) => {
  const videoId = getYouTubeID(video.url || video.file);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState("");
  const videoRef = useRef(null);
  const finalUrl = video.url || video.file;

  useEffect(() => {
      if(!user || !video.id) return;
      const q = query(collection(db, 'video_notes'), where('userId', '==', user.uid), where('videoId', '==', video.id), orderBy('timestamp', 'asc'));
      const unsub = onSnapshot(q, (snap) => {
          setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
  }, [user, video.id]);

  useEffect(() => {
      if (!user || !video.id) return;
      
      const viewId = `${user.uid}_${video.id}`;
      const viewRef = doc(db, 'video_views', viewId);
      
      let timerInterval;
      let localSeconds = 0;
      let lastSyncedSeconds = 0;

      const syncToDatabase = async (secondsToAdd) => {
          try {
              await setDoc(viewRef, {
                  userId: user.uid,
                  userName: userName,
                  videoId: video.id,
                  videoTitle: video.title,
                  viewedAt: serverTimestamp(), 
                  watchedSeconds: increment(secondsToAdd)
              }, { merge: true }); 
          } catch (e) {
              console.error("Sync error:", e);
          }
      };

      syncToDatabase(0);

      timerInterval = setInterval(() => {
          let isPlaying = true;
          
          if (!videoId && videoRef.current) {
              isPlaying = !videoRef.current.paused && !videoRef.current.ended;
          }

          if (!document.hidden && isPlaying) {
              localSeconds += 1;
              if (localSeconds - lastSyncedSeconds >= 15) {
                  syncToDatabase(localSeconds - lastSyncedSeconds);
                  lastSyncedSeconds = localSeconds;
              }
          }
      }, 1000);

      return () => {
          clearInterval(timerInterval);
          const remaining = localSeconds - lastSyncedSeconds;
          if (remaining > 0) syncToDatabase(remaining);
      };
  }, [user, video.id, video.title, userName, videoId]);

  const changeSpeed = (rate) => {
    if(videoRef.current) videoRef.current.playbackRate = rate;
    setShowSettings(false);
  };

  const handleAddNote = async (e) => {
      e.preventDefault();
      if(!currentNote.trim()) return;

      let currentTime = 0;
      if (videoRef.current) {
          currentTime = videoRef.current.currentTime;
      }

      await addDoc(collection(db, 'video_notes'), {
          userId: user.uid,
          videoId: video.id,
          text: currentNote,
          timestamp: currentTime,
          createdAt: serverTimestamp()
      });
      setCurrentNote("");
  };

  const handleJumpToTime = (time) => {
      if(videoRef.current) {
          videoRef.current.currentTime = time;
          videoRef.current.play();
      } else if(videoId) {
          alert("عفواً، ميزة القفز للوقت المحدد تعمل مع الفيديوهات المرفوعة على المنصة فقط وليس يوتيوب.");
      }
  };

  const deleteNote = async (noteId) => {
      if(window.confirm("حذف هذه الملاحظة؟")) {
          await deleteDoc(doc(db, 'video_notes', noteId));
      }
  };

  const formatMinSec = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const youtubeEmbedUrl = videoId 
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&loop=1&playlist=${videoId}&playsinline=1` 
    : '';

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col md:flex-row items-center justify-center p-0 md:p-4 font-['Cairo']" dir="rtl">
      
      <AnimatePresence>
          {showNotes && (
              <motion.div 
                  initial={{ opacity: 0, x: 300 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 300 }} 
                  className="w-full md:w-80 h-1/2 md:h-full bg-white rounded-t-2xl md:rounded-l-none md:rounded-r-2xl flex flex-col shadow-2xl relative z-[70] overflow-hidden"
              >
                  <div className="p-4 bg-blue-600 text-white font-bold flex justify-between items-center shadow-md">
                      <div className="flex items-center gap-2"><PenLine size={20}/> دفتر الملاحظات</div>
                      <button onClick={() => setShowNotes(false)} className="hover:bg-blue-700 p-1 rounded"><X size={20}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
                      {notes.length === 0 ? (
                          <div className="text-center text-slate-400 mt-10">
                              <PenLine size={40} className="mx-auto mb-2 opacity-50"/>
                              <p>لم تضف أي ملاحظات بعد.</p>
                              <p className="text-xs mt-1">الملاحظات بتتربط بوقت الفيديو عشان ترجعلها بسرعة.</p>
                          </div>
                      ) : (
                          notes.map(note => (
                              <div key={note.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 group">
                                  <div className="flex justify-between items-start mb-2">
                                      <button 
                                          onClick={() => handleJumpToTime(note.timestamp)} 
                                          className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold hover:bg-blue-200 transition flex items-center gap-1"
                                      >
                                          <Play size={10} fill="currentColor"/> الدقيقة {formatMinSec(note.timestamp)}
                                      </button>
                                      <button onClick={() => deleteNote(note.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14}/></button>
                                  </div>
                                  <p className="text-sm text-slate-700 font-bold whitespace-pre-wrap">{note.text}</p>
                              </div>
                          ))
                      )}
                  </div>

                  <form onSubmit={handleAddNote} className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2">
                      <textarea 
                          className="w-full border-2 border-slate-200 rounded-xl p-2 text-sm focus:border-blue-500 outline-none transition resize-none h-20" 
                          placeholder="اكتب ملاحظتك هنا (سيتم حفظها بوقت الفيديو الحالي)..."
                          value={currentNote}
                          onChange={e => setCurrentNote(e.target.value)}
                      />
                      <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl shadow-md hover:bg-blue-700 transition">إضافة الملاحظة</button>
                  </form>
              </motion.div>
          )}
      </AnimatePresence>

      <div className={`w-full h-full md:max-w-7xl bg-black ${showNotes ? 'md:rounded-l-2xl' : 'rounded-xl'} overflow-hidden relative shadow-2xl border border-gray-800 flex flex-col justify-center flex-1 transition-all duration-300`}>
        <div className="absolute top-4 right-4 z-50 flex gap-4">
            
            <button 
                onClick={() => setShowNotes(!showNotes)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold backdrop-blur-md transition shadow-lg ${showNotes ? 'bg-blue-600 text-white' : 'bg-black/50 text-white hover:bg-black/80 border border-white/20'}`}
            >
                <PenLine size={18}/> <span className="hidden md:inline">ملاحظاتي</span>
            </button>

            <div className="relative">
                <button onClick={() => setShowSettings(!showSettings)} className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition border border-white/20"><GearIcon size={24}/></button>
                {showSettings && (
                    <div className="absolute top-12 left-0 bg-white text-black rounded-lg shadow-xl py-2 w-40 z-50 text-sm font-bold">
                        <div className="px-4 py-2 border-b text-gray-400 text-xs">سرعة التشغيل</div>
                        {[0.5, 1, 1.25, 1.5, 2].map(rate => (
                            <button key={rate} onClick={() => changeSpeed(rate)} className="block w-full text-right px-4 py-2 hover:bg-gray-100">{rate}x</button>
                        ))}
                    </div>
                )}
            </div>
            <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg"><X size={24}/></button>
        </div>

        <div className="w-full relative flex items-center justify-center bg-black overflow-hidden" style={{ height: showNotes ? '50vh' : '100%', md: { height: '100%' } }}>
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
            ></iframe>
          ) : (
             <video 
                ref={videoRef} 
                controls 
                controlsList="nodownload" 
                className="w-full h-full object-contain relative z-40" 
                src={finalUrl}
                playsInline
                preload="auto"
                disablePictureInPicture
             >
                المتصفح لا يدعم هذا الفيديو.
             </video>
          )}
        </div>
      </div>
    </div>
  );
};

const PomodoroFocusMode = ({ onClose }) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState("");
    const audioRef = useRef(null);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play();
            if (isBreak) {
                setIsBreak(false);
                setTimeLeft(25 * 60);
                setIsActive(false);
            } else {
                setIsBreak(true);
                setTimeLeft(5 * 60);
                setIsActive(false);
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, isBreak]);

    const toggleTimer = () => {
        setIsActive(!isActive);
        if(!isActive && audioRef.current && !isBreak) {
            audioRef.current.play().catch(e => console.log("Audio play blocked"));
        } else if(isActive && audioRef.current) {
            audioRef.current.pause();
        }
    };

    const addTask = (e) => {
        e.preventDefault();
        if(newTask.trim()) {
            setTasks([...tasks, { id: Date.now(), text: newTask, done: false }]);
            setNewTask("");
        }
    };

    const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 text-white flex flex-col font-['Cairo']" dir="rtl">
            <audio ref={audioRef} loop src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3" />
            
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
                <div className="flex items-center gap-2 text-2xl font-bold text-amber-400"><Headphones/> وضع التركيز (Pomodoro)</div>
                <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition"><X size={24}/></button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row p-6 gap-8 overflow-y-auto">
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-800/50 rounded-3xl p-8 border border-slate-700 relative overflow-hidden">
                    <div className="absolute top-6 left-6 flex gap-2">
                        <button onClick={() => { setIsBreak(false); setTimeLeft(25 * 60); setIsActive(false); }} className={`px-4 py-1 rounded-full text-sm font-bold transition ${!isBreak ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>مذاكرة (25)</button>
                        <button onClick={() => { setIsBreak(true); setTimeLeft(5 * 60); setIsActive(false); }} className={`px-4 py-1 rounded-full text-sm font-bold transition ${isBreak ? 'bg-green-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>راحة (5)</button>
                    </div>

                    <div className={`text-9xl font-black font-sans my-12 drop-shadow-2xl tracking-widest ${isBreak ? 'text-green-400' : 'text-amber-400'}`}>
                        {m}:{s}
                    </div>

                    <div className="flex items-center gap-6">
                        <button onClick={toggleTimer} className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 ${isActive ? 'bg-red-500 text-white shadow-red-500/50' : 'bg-white text-slate-900 shadow-white/20'}`}>
                            {isActive ? <Pause size={40} fill="currentColor"/> : <Play size={40} fill="currentColor" className="ml-2"/>}
                        </button>
                        <button onClick={() => setTimeLeft(isBreak ? 5*60 : 25*60)} className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center hover:bg-slate-600 transition text-slate-300">
                            <RefreshCw size={24}/>
                        </button>
                    </div>
                    <p className="mt-8 text-slate-400 flex items-center gap-2"><Headphones size={16}/> موسيقى Lo-Fi للتركيز تعمل تلقائياً أثناء جلسة المذاكرة</p>
                </div>

                <div className="w-full lg:w-96 flex flex-col gap-4">
                    <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2"><CheckCircle className="text-amber-400"/> مهام الجلسة</h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                            {tasks.length === 0 ? <p className="text-slate-500 text-center mt-10">أضف مهامك هنا لتركز عليها.</p> : tasks.map(t => (
                                <div key={t.id} onClick={() => toggleTask(t.id)} className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${t.done ? 'bg-slate-700/50 border-slate-600 text-slate-500 line-through' : 'bg-slate-700 border-slate-500 text-white'}`}>
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${t.done ? 'border-amber-500 bg-amber-500 text-slate-900' : 'border-slate-400'}`}>
                                        {t.done && <Check size={14} strokeWidth={4}/>}
                                    </div>
                                    <span className="font-bold">{t.text}</span>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={addTask} className="flex gap-2">
                            <input value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="أضف مهمة جديدة..." className="flex-1 bg-slate-900 border border-slate-600 rounded-xl p-3 outline-none focus:border-amber-500 transition"/>
                            <button type="submit" className="bg-amber-600 text-white p-3 rounded-xl font-bold hover:bg-amber-700"><PlusCircle/></button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InteractiveViewer = ({ content, user, onClose }) => {
    const handleContextMenu = (e) => e.preventDefault();
    const [iframeSrc, setIframeSrc] = useState('');
    
    useEffect(() => {
        let activeBlobUrl = null;
        
        if (content.url && content.url.startsWith('data:')) {
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
            setIframeSrc(content.url);
        }

        return () => {
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
  const [activeView, setActiveView] = useState(isReviewMode || existingResult ? 'dashboard' : 'questions'); 
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState(existingResult?.answers || {});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [isCheating, setIsCheating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(isReviewMode || existingResult !== null);
  const [score, setScore] = useState(existingResult?.score || 0);
  const [startTime] = useState(Date.now()); 
  const [wmPositions, setWmPositions] = useState([]);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const [activeBranchTab, setActiveBranchTab] = useState('الكل');

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
        if (!isReviewMode && !existingResult) processedBlocks = shuffleArray(processedBlocks);
        processedBlocks.forEach((block) => {
            let subQs = [...block.subQuestions];
            if (!isReviewMode && !existingResult) subQs = shuffleArray(subQs);
            subQs.forEach((q) => {
                flat.push({ ...q, blockText: block.text, branch: q.branch || 'عام' });
            });
        });
    }
    return flat;
  }, [exam.questions, isReviewMode, existingResult]);

  const uniqueBranches = useMemo(() => ['الكل', ...new Set(flatQuestions.map(q => q.branch))], [flatQuestions]);

  const displayQuestions = useMemo(() => {
      if (!isSubmitted || activeBranchTab === 'الكل') return flatQuestions;
      return flatQuestions.filter(q => q.branch === activeBranchTab);
  }, [flatQuestions, isSubmitted, activeBranchTab]);

  useEffect(() => {
      if (isSubmitted) setCurrentQIndex(0);
  }, [activeBranchTab, isSubmitted]);

  if (flatQuestions.length === 0) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-white font-['Cairo']">عفواً، لا توجد أسئلة.<button onClick={onClose} className="ml-4 bg-gray-200 px-4 py-2 rounded">خروج</button></div>;

  useEffect(() => {
    if (isReviewMode) return;
    const updatePositions = () => {
        const newPos = [...Array(6)].map(() => ({ top: Math.floor(Math.random() * 90) + '%', left: Math.floor(Math.random() * 90) + '%' }));
        setWmPositions(newPos);
    };
    updatePositions();
    const interval = setInterval(updatePositions, 6000); 
    return () => clearInterval(interval);
  }, [isReviewMode]);

  const stateRefs = useRef({ isSubmitted, showSubmitConfirm, isCheating });
  useEffect(() => { stateRefs.current = { isSubmitted, showSubmitConfirm, isCheating }; });

  const handleCheatingRef = useRef();
  handleCheatingRef.current = async () => {
      const { isSubmitted, isCheating } = stateRefs.current;
      if(isReviewMode || isSubmitted || isCheating) return;
      setIsCheating(true); setIsSubmitted(true); setActiveView('dashboard');
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      if (exam.attemptId) {
          await setDoc(doc(db, 'exam_results', exam.attemptId), { 
              examId: exam.id, studentId: user.uid, studentName: user.displayName, 
              score: 0, total: flatQuestions.length, status: 'cheated', timeTaken: timeTaken, totalTime: exam.duration, submittedAt: serverTimestamp() 
          });
      }
      await updateDoc(doc(db, 'users', user.uid), { status: 'banned_exam' });
  };

  useEffect(() => {
      if (isReviewMode) return;
      const handleBeforeUnload = (e) => {
          if (!stateRefs.current.isSubmitted) {
              e.preventDefault(); e.returnValue = "هل أنت متأكد؟ الخروج سيمنعك من العودة للامتحان!"; return e.returnValue;
          }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      const handleAntiCheat = () => { 
          const { showSubmitConfirm, isSubmitted } = stateRefs.current;
          if (!showSubmitConfirm && !isSubmitted) handleCheatingRef.current();
      };
      const handleVisibilityChange = () => { if (document.hidden) handleAntiCheat(); };
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
    if(!isReviewMode && !isSubmitted) setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };
  
  const calculateScore = () => {
    let rawScore = 0;
    flatQuestions.forEach(q => { if (answers[q.id] === q.correctIdx) rawScore++; });
    return rawScore;
  };

  const confirmSubmit = () => setShowSubmitConfirm(true);

  const handleSubmit = async (auto = false) => {
    setShowSubmitConfirm(false);
    const totalQs = flatQuestions.length;
    const finalScore = calculateScore();
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    setScore(finalScore);
    setIsSubmitted(true);
    setActiveView('dashboard'); 

    const batch = writeBatch(db);
    flatQuestions.forEach(q => {
        const studentAns = answers[q.id];
        const isAnswered = studentAns !== undefined;
        const isCorrect = studentAns === q.correctIdx;
        
        if (isAnswered && !isCorrect) {
            const mistakeRef = doc(collection(db, 'student_mistakes'));
            batch.set(mistakeRef, {
                userId: user.uid, examTitle: exam.title,
                question: { ...q, studentAnswerText: q.options[studentAns], correctAnswerText: q.options[q.correctIdx] },
                timestamp: serverTimestamp()
            });
        }
    });

    if (exam.attemptId && exam.id !== 'custom_mistakes_exam') {
        const attemptRef = doc(db, 'exam_results', exam.attemptId);
        batch.set(attemptRef, { 
            examId: exam.id, studentId: user.uid, studentName: user.displayName, 
            score: finalScore, total: totalQs, answers, status: 'completed', timeTaken: timeTaken, totalTime: exam.duration, submittedAt: serverTimestamp() 
        }, { merge: true });
    }
    try { await batch.commit(); } catch(err) { console.error("Error saving results or mistakes", err); }
  };

  const currentQObj = displayQuestions[currentQIndex];
  
  if (isCheating) return <div className="fixed inset-0 z-[60] bg-red-900 flex items-center justify-center text-white text-center font-['Cairo']"><div><AlertOctagon size={80} className="mx-auto mb-4"/><h1>تم رصد محاولة غش!</h1><p className="text-red-200 mt-2">خرجت من الامتحان. تم رصد درجتك (صفر) وحظرك من الامتحانات القادمة.</p><button onClick={() => window.location.reload()} className="mt-4 bg-white text-red-900 px-6 py-2 rounded-full font-bold">العودة للرئيسية</button></div></div>;

  const totalQs = flatQuestions.length;
  const solvedQs = Object.keys(answers).length;
  const unsolvedQs = totalQs - solvedQs;
  const correctQs = score;
  const wrongQs = solvedQs - correctQs;
  const percentage = totalQs > 0 ? Math.round((score / totalQs) * 100) : 0;
  
  const branchStats = {};
  flatQuestions.forEach(q => {
      const b = q.branch;
      if (!branchStats[b]) branchStats[b] = { total: 0, solved: 0, correct: 0, wrong: 0, unsolved: 0 };
      branchStats[b].total++;
      const isSelected = answers[q.id] !== undefined;
      const isCorrect = answers[q.id] === q.correctIdx;
      if (isSelected) branchStats[b].solved++;
      if (!isSelected) branchStats[b].unsolved++;
      else if (isCorrect) branchStats[b].correct++;
      else branchStats[b].wrong++;
  });

  const canReview = exam.id === 'custom_mistakes_exam' || Date.now() > new Date(exam.endTime).getTime();

  if (activeView === 'dashboard') {
     return (
        <div className="fixed inset-0 z-[60] bg-[#0f172a] overflow-y-auto p-4 md:p-8 font-['Cairo'] text-slate-200" dir="rtl">
            <div className="max-w-6xl mx-auto mt-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-slate-700 pb-4 gap-4">
                    <div className="text-center md:text-right">
                        <h2 className="text-3xl font-black text-white mb-2">{exam.title}</h2>
                        {isSubmitted ? (
                            <p className="text-lg text-slate-400">الطالب: {user.displayName}</p>
                        ) : (
                            <p className="text-amber-400 font-bold">⏳ الوقت المتبقي: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {isSubmitted ? (
                            <>
                                <button onClick={() => generatePDF('student', {studentName: user.displayName, score, total: flatQuestions.length, status: 'completed', examTitle: exam.title, questions: flatQuestions, answers: answers })} className="w-12 h-12 bg-blue-600 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition" title="تحميل التقرير PDF">
                                    <FileText size={20}/>
                                </button>
                                <button onClick={onClose} className="bg-slate-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-600 shadow-lg transition flex items-center gap-2">
                                    خروج <LogOut size={18}/>
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setActiveView('questions')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2">
                                استكمال الامتحان <Play size={18}/>
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-10">
                    <div className="bg-[#1e293b] p-6 rounded-2xl text-center border-t-4 border-slate-500 shadow-xl flex flex-col justify-center">
                        <p className="text-slate-400 text-sm mb-3 font-bold">عدد الأسئلة</p>
                        <p className="text-4xl md:text-5xl font-black text-white">{totalQs}</p>
                    </div>
                    {isSubmitted ? (
                        <div className="bg-[#1e293b] p-6 rounded-2xl text-center border-t-4 border-slate-500 shadow-xl flex flex-col justify-center">
                            <p className="text-slate-400 text-sm mb-3 font-bold">النتيجة</p>
                            <p className="text-4xl md:text-5xl font-black text-white">{percentage}%</p>
                        </div>
                    ) : (
                        <div className="bg-[#1e293b] p-6 rounded-2xl text-center border-t-4 border-slate-500 shadow-xl flex flex-col justify-center cursor-pointer hover:bg-slate-700 transition" onClick={() => {setActiveBranchTab('الكل'); setActiveView('questions');}}>
                            <p className="text-slate-400 text-sm mb-3 font-bold">عرض الكل</p>
                            <p className="text-4xl md:text-5xl font-black text-blue-400">{solvedQs}/{totalQs}</p>
                        </div>
                    )}
                    <div className="bg-[#0e7490] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
                        <p className="text-cyan-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><CheckCircle size={16}/> المحلولة</p>
                        <p className="text-4xl md:text-5xl font-black text-white">{solvedQs}</p>
                    </div>
                    {isSubmitted ? (
                        <>
                            <div className="bg-[#831843] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
                                <p className="text-pink-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><XCircle size={16}/> الخاطئة</p>
                                <p className="text-4xl md:text-5xl font-black text-pink-50">{wrongQs}</p>
                            </div>
                            <div className="bg-[#115e59] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
                                <p className="text-teal-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><Check size={16}/> الصحيحة</p>
                                <p className="text-4xl md:text-5xl font-black text-teal-50">{correctQs}</p>
                            </div>
                        </>
                    ) : (
                        <div className="bg-[#b45309] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center col-span-2">
                            <p className="text-amber-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><Flag size={16}/> أسئلة محددة للمراجعة</p>
                            <p className="text-4xl md:text-5xl font-black text-amber-50">{Object.values(flagged).filter(v=>v).length}</p>
                        </div>
                    )}
                    <div className="bg-[#78350f] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
                        <p className="text-amber-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><AlertCircle size={16}/> لم تُحل</p>
                        <p className="text-4xl md:text-5xl font-black text-amber-50">{unsolvedQs}</p>
                    </div>
                </div>

                {Object.keys(branchStats).length > 0 && (
                    <div className="mb-10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold flex items-center gap-2 text-teal-400"><Layers size={28}/> {isSubmitted ? 'ملخص الفروع' : 'أقسام الامتحان (اضغط للدخول)'}</h3>
                            {canReview && isSubmitted && (
                                <button onClick={() => { setActiveBranchTab('الكل'); setActiveView('questions'); }} className="text-teal-400 bg-teal-900/30 px-4 py-2 rounded-lg font-bold hover:bg-teal-900/50 transition text-sm flex items-center gap-2">
                                    عرض كل الأسئلة <ClipboardList size={16}/>
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {Object.entries(branchStats).map(([branch, stats], idx) => {
                                const bPercent = isSubmitted 
                                    ? Math.round((stats.correct / stats.total) * 100) 
                                    : Math.round((stats.solved / stats.total) * 100);
                                
                                let message = "";
                                if (isSubmitted) {
                                    message = bPercent >= 90 ? `عاش يا بطل، مقفل ${branch} 🌟` : bPercent >= 70 ? `أداء محترم في ${branch} 👏` : "شد حيلك أكتر، تقدر تجيب أعلى 💪";
                                } else {
                                    message = bPercent === 100 ? "تم حل كل أسئلة القسم ✅" : "يوجد أسئلة متبقية ⏳";
                                }

                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => {
                                            if (!isSubmitted || canReview) {
                                                setActiveBranchTab(branch);
                                                setActiveView('questions');
                                            } else {
                                                alert("نموذج الإجابة سيتاح بعد انتهاء وقت الامتحان للجميع.");
                                            }
                                        }}
                                        className={`bg-[#1e293b] p-6 rounded-2xl border border-[#334155] shadow-lg transition group ${(!isSubmitted || canReview) ? 'cursor-pointer hover:border-teal-400 hover:-translate-y-1' : ''}`}
                                    >
                                        <div className="flex justify-between items-center mb-6">
                                            <span className={`text-4xl font-black ${isSubmitted ? 'text-teal-400' : 'text-blue-400'}`}>{bPercent}%</span>
                                            <span className="text-xl font-bold text-white bg-slate-800 px-3 py-1 rounded-lg">{branch}</span>
                                        </div>
                                        <p className="text-sm text-slate-400 text-left mb-2 font-bold">{isSubmitted ? 'نسبة النجاح' : 'نسبة الحل'}</p>
                                        <div className="w-full bg-[#0f172a] rounded-full h-2.5 mb-6 overflow-hidden">
                                            <div className={`${isSubmitted ? 'bg-teal-400' : 'bg-blue-400'} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${bPercent}%` }}></div>
                                        </div>
                                        <div className="text-sm mt-4 bg-[#0f172a] p-3 rounded-lg">
                                            {!isSubmitted ? (
                                                <div className="flex justify-between text-slate-400 font-bold">
                                                    <span>محلول: <span className="text-blue-400">{stats.solved}</span></span>
                                                    <span>المجموع: {stats.total}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-slate-500 mb-1 text-xs">رسالة المنصة:</p>
                                                    <p className={`${bPercent >= 90 ? 'text-teal-300' : 'text-amber-300'} font-bold`}>{message}</p>
                                                </>
                                            )}
                                        </div>
                                        {(canReview && isSubmitted) && (
                                            <div className="mt-4 text-center opacity-0 group-hover:opacity-100 transition-opacity text-teal-400 text-xs font-bold flex items-center justify-center gap-1">
                                                اضغط لمراجعة أخطاء {branch} <MousePointerClick size={12}/>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {!canReview && isSubmitted && (
                    <div className="mt-8 bg-amber-900/30 text-amber-400 p-6 rounded-2xl border border-amber-900 text-center font-bold text-lg flex flex-col items-center gap-3">
                        <Clock size={32}/>
                        نموذج الإجابة والمراجعة سيظهر هنا تلقائياً بعد انتهاء وقت الامتحان للأغلبية.
                    </div>
                )}

                {!isSubmitted && (
                    <div className="flex justify-end mt-8 border-t border-slate-700 pt-6">
                        <button onClick={confirmSubmit} className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 transition flex items-center justify-center gap-2">
                            <CheckCircle size={20}/> تسليم الامتحان نهائياً
                        </button>
                    </div>
                )}
            </div>
        </div>
     );
  }

  if (!currentQObj) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col font-['Cairo'] no-select" dir="rtl">
      {!isSubmitted && (
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
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border-t-8 border-amber-500">
                <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4"/>
                <h3 className="text-2xl font-bold mb-2 text-slate-800">هل أنت متأكد من التسليم؟</h3>
                <p className="text-slate-500 mb-8 font-bold">لن يمكنك تعديل إجاباتك بعد ذلك، وسيتم نقلك للوحة النتيجة.</p>
                <div className="flex gap-4">
                    <button onClick={() => handleSubmit(false)} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-md transition">نعم، سلم الآن</button>
                    <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300 shadow-sm transition">تراجع</button>
                </div>
            </div>
        </div>
      )}

      <div className="bg-slate-900 text-white p-4 flex flex-col md:flex-row justify-between items-center shadow-md relative z-50 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between">
            {isSubmitted && (
                <button onClick={() => setActiveView('dashboard')} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 shadow-sm text-sm">
                    <Layout size={16}/> العودة للنتيجة
                </button>
            )}
            <h2 className="font-bold text-lg font-sans text-amber-400 truncate hidden md:block">{exam.title} {isSubmitted ? '(مراجعة الإجابات)' : ''}</h2>
            {!isSubmitted && <div className="bg-slate-800 px-6 py-2 rounded-full font-mono shadow-inner border border-slate-700 font-bold text-amber-400 text-lg flex items-center gap-2"><Timer size={18}/> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</div>}
        </div>

        {isSubmitted && uniqueBranches.length > 2 && (
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                {uniqueBranches.map((branch, i) => (
                    <button 
                        key={i} onClick={() => setActiveBranchTab(branch)}
                        className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-colors ${activeBranchTab === branch ? 'bg-amber-500 text-slate-900 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                        {branch}
                    </button>
                ))}
            </div>
        )}

        {!isSubmitted && (
            <button onClick={() => setActiveView('dashboard')} className="bg-slate-700 hover:bg-slate-600 px-6 py-2.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2">
                <Layout size={18}/> لوحة التحكم
            </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden relative z-50">
        <div className="w-16 md:w-24 bg-white border-l flex flex-col p-2 overflow-y-auto shadow-inner scrollbar-hide">
          <div className="grid grid-cols-1 gap-3">
              {displayQuestions.map((q, idx) => {
                  let statusClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-transparent';
                  if (isSubmitted) {
                      if (answers[q.id] === q.correctIdx) statusClass = 'bg-green-100 text-green-700 border-green-500 shadow-sm';
                      else if (answers[q.id] !== undefined) statusClass = 'bg-red-100 text-red-700 border-red-500 shadow-sm';
                      else statusClass = 'bg-slate-100 text-slate-400 border-slate-300 border-dashed'; 
                  } else if (answers[q.id] !== undefined) {
                      statusClass = 'bg-blue-100 text-blue-700 border-blue-400 shadow-sm';
                  }
                  const originalIndex = flatQuestions.findIndex(origQ => origQ.id === q.id) + 1;
                  return (
                    <button key={idx} onClick={() => setCurrentQIndex(idx)} className={`aspect-square rounded-xl font-bold text-base transition-all relative ${currentQIndex === idx ? 'ring-4 ring-amber-500 ring-offset-2 scale-105 z-10' : ''} ${statusClass}`}>
                        {originalIndex}
                        {flagged[q.id] && !isSubmitted && <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-sm"></div>}
                    </button>
                  )
              })}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${currentQObj?.blockText && currentQObj.blockText.trim().length > 0 ? 'md:flex-row' : 'items-center'} h-full overflow-hidden bg-slate-100 w-full p-4 md:p-8 gap-6`}>
          {currentQObj?.blockText && currentQObj.blockText.trim().length > 0 && (
            <div className="flex-1 w-full bg-white p-6 md:p-10 overflow-y-auto rounded-3xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-blue-900 mb-6 flex items-center gap-2 text-xl border-b border-blue-100 pb-4 font-['Cairo']"><FileText size={24}/> نص المراجعة / القراءة:</h3>
              <p className="whitespace-pre-line leading-loose text-lg md:text-xl font-bold text-slate-700 font-['Cairo']">{currentQObj.blockText}</p>
            </div>
          )}
          
          <div className={`${currentQObj?.blockText && currentQObj.blockText.trim().length > 0 ? 'flex-1' : 'w-full max-w-4xl mx-auto'} bg-white p-6 md:p-10 overflow-y-auto flex flex-col shadow-xl rounded-3xl h-full border border-slate-200 relative`}>
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-3">
                  <span className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md font-['Cairo']">سؤال {flatQuestions.findIndex(origQ => origQ.id === currentQObj.id) + 1}</span>
                  {currentQObj.branch && currentQObj.branch !== 'عام' && (
                      <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100 flex items-center gap-2"><Layers size={16}/> {currentQObj.branch}</span>
                  )}
              </div>
              {!isSubmitted && <button onClick={() => { setFlagged({...flagged, [currentQObj.id]: !flagged[currentQObj.id]}) }} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition shadow-sm ${flagged[currentQObj.id] ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}><Flag size={16} /> {flagged[currentQObj.id] ? 'محدد للمراجعة' : 'تحديد لمراجعته لاحقاً'}</button>}
            </div>
            
            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 mb-8 shadow-inner text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-loose font-['Cairo'] drop-shadow-sm">
                  {currentQObj.text.split('|').map((part, i) => (
                      <React.Fragment key={i}>
                          {part.trim()}
                          {i !== currentQObj.text.split('|').length - 1 && <br />}
                      </React.Fragment>
                  ))}
              </h3>
            </div>

            <div className="space-y-4">
              {currentQObj.options.map((opt, idx) => {
                  let optionClass = 'border-slate-200 hover:bg-slate-50 bg-white text-slate-700';
                  const isSelected = answers[currentQObj.id] === idx;
                  
                  if (isSubmitted) {
                      if (idx === currentQObj.correctIdx) optionClass = 'border-green-500 bg-green-50 text-green-900 shadow-md ring-2 ring-green-200'; 
                      else if (isSelected) optionClass = 'border-red-500 bg-red-50 text-red-900 shadow-md'; 
                      else optionClass = 'border-slate-200 bg-slate-50 opacity-50'; 
                  } else {
                      if (isSelected) optionClass = 'border-amber-500 bg-amber-50 text-amber-900 shadow-md transform scale-[1.02] ring-2 ring-amber-200';
                  }

                  return (
                    <div key={idx} onClick={() => handleAnswer(currentQObj.id, idx)} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 ${optionClass}`}>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected || (isSubmitted && idx === currentQObj.correctIdx) ? 'border-transparent bg-current' : 'border-slate-300'}`}>
                          {(isSubmitted && idx === currentQObj.correctIdx) && <Check size={16} className="text-white"/>}
                          {(isSubmitted && isSelected && idx !== currentQObj.correctIdx) && <X size={16} className="text-white"/>}
                      </div>
                      <span className="font-['Cairo'] text-xl font-bold leading-relaxed">{opt}</span>
                      {isSubmitted && idx === currentQObj.correctIdx && <span className="mr-auto text-green-600 bg-green-100 px-3 py-1 rounded-lg text-xs font-bold">الإجابة الصحيحة</span>}
                      {isSubmitted && isSelected && idx !== currentQObj.correctIdx && <span className="mr-auto text-red-600 bg-red-100 px-3 py-1 rounded-lg text-xs font-bold">إجابتك (خطأ)</span>}
                    </div>
                  )
              })}
            </div>

            <div className="mt-auto pt-10 flex justify-between">
              <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(p => p - 1)} className="px-8 py-4 rounded-xl bg-slate-200 text-slate-700 font-bold disabled:opacity-50 hover:bg-slate-300 transition shadow-sm font-['Cairo'] flex items-center gap-2"><ChevronRight size={20}/> السابق</button>
              <button disabled={currentQIndex === displayQuestions.length - 1} onClick={() => setCurrentQIndex(p => p + 1)} className="px-8 py-4 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-50 hover:bg-slate-800 transition shadow-lg font-['Cairo'] flex items-center gap-2">التالي <ChevronRight size={20} className="rotate-180"/></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
            if (snap.exists()) { setHomeworkData({ id: snap.id, ...snap.data() }); } else { alert("الواجب غير موجود أو تم حذفه."); onClose(); }
        };
        fetchHw();
    }, [hwId, onClose]);

    const handleImageCapture = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => { setImageSrc(event.target.result); };
            reader.readAsDataURL(file);
        }
    };

    const analyzeImageWithGemini = async () => {
        if (!imageSrc || !homeworkData) return;
        setIsAnalyzing(true);
        try {
            const base64Data = imageSrc.split(',')[1];
            const apiKey = "AIzaSyAkxZD3GCtHK1_9DgsdCOPr69M1nOV13Hw"; 
            if(!apiKey) {
                setTimeout(async () => { const dummyResult = { score: Math.floor(Math.random() * 10), total: 10, feedback: "تم استلام الواجب (محاكاة)." }; await saveResult(dummyResult); }, 2000);
                return;
            }
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
            const promptText = `أنت معلم لغة عربية. قم بتصحيح صورة الواجب هذه المكونة من أسئلة اختيار من متعدد. مفتاح الإجابة الصحيح هو: ${homeworkData.answerKey}. قم بإرجاع النتيجة بصيغة JSON فقط تحتوي على: {"score": عدد الإجابات الصحيحة, "total": العدد الكلي للأسئلة, "feedback": "تعليق قصير"}`;
            const response = await fetch(url, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ role: "user", parts: [ { text: promptText }, { inlineData: { mimeType: "image/jpeg", data: base64Data } } ] }] })
            });
            const data = await response.json();
            const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
            const cleanJson = textResult.replace(/```json/g, '').replace(/```/g, '');
            const parsedResult = JSON.parse(cleanJson);
            await saveResult(parsedResult);
        } catch (error) { console.error("Error analyzing image:", error); alert("حدث خطأ أثناء التصحيح. تأكد من وضوح الصورة."); setIsAnalyzing(false); }
    };

    const saveResult = async (aiResult) => {
        const finalData = { studentId: user.uid, studentName: user.displayName, homeworkId: homeworkData.id, homeworkTitle: homeworkData.title, bookName: homeworkData.bookName || 'عام', grade: homeworkData.grade || 'غير محدد', score: aiResult.score, total: aiResult.total, feedback: aiResult.feedback, submittedAt: serverTimestamp() };
        await addDoc(collection(db, 'homework_results'), finalData);
        setResult(aiResult); setIsAnalyzing(false);
    };

    if (!homeworkData) return <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-12 h-12"/></div>;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 text-white flex flex-col font-['Cairo']" dir="rtl">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <h2 className="font-bold flex items-center gap-2 text-blue-400"><QrCode/> تسليم الواجب: {homeworkData.title} {homeworkData.bookName && `(${homeworkData.bookName})`}</h2>
                <button onClick={onClose} className="bg-red-600 px-4 py-1 rounded text-sm font-bold">إلغاء</button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                {!imageSrc ? (
                    <div className="space-y-6">
                        <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-4 border-blue-500 border-dashed"><Camera size={48} className="text-blue-400"/></div>
                        <h3 className="text-2xl font-bold">صوّر صفحة الواجب</h3>
                        <p className="text-slate-400 max-w-md">تأكد من أن الإضاءة جيدة وأن الإجابات واضحة في الصورة ليتمكن الذكاء الاصطناعي من قراءتها بدقة.</p>
                        <button onClick={() => fileInputRef.current.click()} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg flex items-center gap-2 mx-auto"><Camera /> افتح الكاميرا</button>
                        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageCapture} className="hidden" />
                    </div>
                ) : !result ? (
                    <div className="space-y-6 w-full max-w-md">
                        <img src={imageSrc} alt="Homework" className="w-full h-80 object-cover rounded-xl border-4 border-slate-700" />
                        {isAnalyzing ? (
                            <div className="bg-slate-800 p-6 rounded-xl border border-blue-500/50 flex flex-col items-center"><Loader2 className="animate-spin text-blue-500 w-10 h-10 mb-4"/><p className="font-bold text-blue-400">الذكاء الاصطناعي يقوم بالتصحيح الآن...</p><p className="text-xs text-slate-400 mt-2">يرجى الانتظار ثوانٍ قليلة</p></div>
                        ) : (
                            <div className="flex gap-4"><button onClick={() => setImageSrc(null)} className="flex-1 bg-slate-700 py-3 rounded-xl font-bold hover:bg-slate-600">إعادة التصوير</button><button onClick={analyzeImageWithGemini} className="flex-1 bg-green-600 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-500/20">تأكيد وتصحيح</button></div>
                        )}
                    </div>
                ) : (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white text-slate-900 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
                        <CheckCircle className="text-green-500 w-20 h-20 mx-auto mb-4"/><h2 className="text-3xl font-black mb-2 text-slate-800">النتيجة</h2>
                        <div className="text-5xl font-black text-amber-600 mb-6">{result.score} / {result.total}</div><p className="text-slate-600 font-bold mb-6">{result.feedback}</p><p className="text-xs text-slate-400 mb-6">تم إرسال الدرجة للمستر بنجاح.</p>
                        <button onClick={onClose} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800">العودة للمنصة</button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('users'); 
  const [adminGradeFilter, setAdminGradeFilter] = useState('all'); 
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
  const [viewingStudentProfile, setViewingStudentProfile] = useState(null);
  const [studentHistoryData, setStudentHistoryData] = useState([]);
  const [editingExamTime, setEditingExamTime] = useState(null);
  const [newEndTime, setNewEndTime] = useState('');
  const [smartHomeworks, setSmartHomeworks] = useState([]);
  const [newSmartHw, setNewSmartHw] = useState({ title: '', answerKey: '', grade: '3sec', bookName: '' });
  const [hwResults, setHwResults] = useState([]);

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
  useEffect(() => { const u = onSnapshot(collection(db, 'smart_homeworks'), s => setSmartHomeworks(s.docs.map(d => ({id: d.id, ...d.data()})))); return u; }, []);
  useEffect(() => { const u = onSnapshot(query(collection(db, 'homework_results'), orderBy('submittedAt', 'desc')), s => setHwResults(s.docs.map(d => ({id: d.id, ...d.data()})))); return u; }, []);

  const handleApprove = async (id) => { await updateDoc(doc(db,'users',id), {status:'active'}); sendSystemNotification("مبروك! 🎉", "تم تفعيل حسابك بنجاح."); };
  const handleReject = async (id) => updateDoc(doc(db,'users',id), {status:'rejected'});
  const handleChangeUserStatus = async (id, newStatus) => { await updateDoc(doc(db,'users',id), {status: newStatus}); };
  const handleDeleteUser = async (id) => { if(window.confirm("حذف نهائي؟")) await deleteDoc(doc(db,'users',id)); };
  const handleDeleteMessage = async (id) => { if(window.confirm("حذف الرسالة؟")) await deleteDoc(doc(db,'messages',id)); };
  const handleDeleteExam = async (id) => { if(window.confirm("حذف الامتحان؟")) await deleteDoc(doc(db, 'exams', id)); };
  const handleDeleteAnnouncement = async (id) => { if(window.confirm("حذف الإعلان؟")) await deleteDoc(doc(db, 'announcements', id)); };
  const handleDeleteResult = async (resultId) => { if(window.confirm("حذف النتيجة؟")) await deleteDoc(doc(db, 'exam_results', resultId)); };
  const handleDeleteAllResults = async () => { if(window.confirm("تحذير خطير: سيتم حذف جميع نتائج الامتحانات لكل الطلاب. هل أنت متأكد؟")) { const batch = writeBatch(db); examResults.forEach(res => { batch.delete(doc(db, 'exam_results', res.id)); }); await batch.commit(); alert("تم حذف جميع النتائج بنجاح."); } };

  const sendWhatsAppToParent = (result) => {
      const student = activeUsersList.find(u => u.id === result.studentId);
      if (!student || !student.parentPhone) return alert("لا يوجد رقم ولي أمر مسجل لهذا الطالب!");
      let phone = student.parentPhone.trim();
      if (phone.startsWith('0')) phone = '20' + phone.substring(1);
      const examName = examsList.find(e => e.id === result.examId)?.title || 'اختبار';
      const message = `مرحباً ولي أمر الطالب/ة: *${result.studentName}* 🎓\n\nنحيط سيادتكم علماً بنتيجة امتحان: *${examName}*\nالدرجة التي حصل عليها: *${result.score}* من *${result.total}* 📊\n\nمع خالص تحيات إدارة منصة النحاس.`;
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`; window.open(whatsappUrl, '_blank');
  };

  const openStudentProfile = async (student) => {
      setViewingStudentProfile(student);
      try {
          const q = query(collection(db, 'video_views'), where('userId', '==', student.id));
          const snap = await getDocs(q); const history = snap.docs.map(d => d.data()); history.sort((a, b) => (b.viewedAt?.seconds || 0) - (a.viewedAt?.seconds || 0)); setStudentHistoryData(history);
      } catch (error) { console.error("Error fetching history:", error); }
  };

  const handleUpdateExamTime = async (e) => {
      e.preventDefault(); if (!newEndTime) return;
      try { await updateDoc(doc(db, 'exams', editingExamTime.id), { endTime: newEndTime }); alert("تم تمديد وقت الامتحان بنجاح!"); setEditingExamTime(null); setNewEndTime(''); } catch (error) { console.error("Error updating exam time:", error); alert("حدث خطأ أثناء تعديل الوقت."); }
  };

  const handleCreateSmartHw = async (e) => {
      e.preventDefault();
      if (!newSmartHw.title || !newSmartHw.answerKey || !newSmartHw.bookName) return alert("أكمل البيانات (الاسم، الإجابة، والكتاب)");
      await addDoc(collection(db, 'smart_homeworks'), { ...newSmartHw, createdAt: serverTimestamp() });
      setNewSmartHw(prev => ({ ...prev, title: '', answerKey: '' })); alert("تم إنشاء الواجب! يمكنك نسخ الرابط الآن.");
  };

  const handleReplyMessage = async (msgId) => { const text = replyTexts[msgId]; if (!text?.trim()) return; await updateDoc(doc(db, 'messages', msgId), { adminReply: text }); setReplyTexts(prev => ({ ...prev, [msgId]: '' })); alert("تم إرسال الرد!"); };
  
  const handleAddAnnouncement = async () => {
      if(!newAnnouncement.trim()) return;
      await addDoc(collection(db, 'announcements'), { text: newAnnouncement, createdAt: serverTimestamp() });
      await addDoc(collection(db, 'notifications'), { text: `تنبيه هام: ${newAnnouncement}`, grade: 'all', createdAt: serverTimestamp() });
      setNewAnnouncement(""); alert("تم نشر الإعلان");
  };

  const handleUpdateUser = async (e) => { e.preventDefault(); if(!editingUser) return; await updateDoc(doc(db, 'users', editingUser.id), { name: editingUser.name, phone: editingUser.phone, parentPhone: editingUser.parentPhone, grade: editingUser.grade }); setEditingUser(null); };
  const handleSendResetPassword = async (email) => { if(window.confirm(`إرسال رابط تغيير كلمة السر لـ ${email}؟`)) await sendPasswordResetEmail(auth, email); };
  
  const approveGrade = async (user) => { if (!user.requestedGrade) return; await updateDoc(doc(db, 'users', user.id), { grade: user.requestedGrade, requestedGrade: null, gradeUpdateStatus: null }); alert(`تم تغيير مرحلة الطالب ${user.name} بنجاح.`); };
  const rejectGrade = async (user) => { await updateDoc(doc(db, 'users', user.id), { requestedGrade: null, gradeUpdateStatus: null }); alert(`تم رفض طلب تغيير المرحلة للطالب ${user.name}.`); };

  const handleFileSelect = (e) => {
      const file = e.target.files[0]; if (!file) return;
      if (file.size > 1048576) { alert("⚠️ تنبيه: حجم الملف أكبر من 1 ميجا.\n\nقواعد البيانات لا تقبل ملفات ضخمة مباشرة. لرفع ملفات كبيرة (كتب كاملة أو فيديوهات)، يرجى رفعها على Google Drive ونسخ الرابط هنا في خانة 'الرابط'."); e.target.value = null; return; }
      setIsUploading(true); const reader = new FileReader();
      reader.onprogress = (event) => { if (event.lengthComputable) { const percent = Math.round((event.loaded / event.total) * 100); setUploadProgress(percent); } };
      reader.onloadend = () => { setNewContent({...newContent, url: reader.result}); setIsUploading(false); setUploadProgress(100); setTimeout(() => setUploadProgress(0), 2000); };
      reader.readAsDataURL(file);
  };

  const handleAddContent = async (e) => { 
      e.preventDefault(); 
      const allowedEmailsArray = newContent.allowedEmails ? newContent.allowedEmails.split(',').map(email => email.trim()) : [];
      const contentData = { ...newContent, file: newContent.url, allowedEmails: allowedEmailsArray, createdAt: new Date() };
      await addDoc(collection(db, 'content'), contentData);
      if (allowedEmailsArray.length === 0) { await addDoc(collection(db, 'notifications'), { text: `تم إضافة درس جديد: ${newContent.title}`, grade: newContent.grade, createdAt: serverTimestamp() }); } 
      alert("تم النشر!"); setNewContent({ title: '', url: '', type: 'video', isPublic: false, grade: '3sec', allowedEmails: '' });
  }; 
  
  const handleDeleteContent = async (id) => { if(window.confirm("حذف هذا المحتوى؟")) await deleteDoc(doc(db, 'content', id)); };

  const startLiveStream = async () => { 
      if(!liveData.liveUrl) return alert("الرابط مطلوب!"); 
      const allowedEmailsArray = liveData.allowedEmails ? liveData.allowedEmails.split(',').map(email => email.trim()) : [];
      await addDoc(collection(db, 'live_sessions'), { ...liveData, allowedEmails: allowedEmailsArray, status: 'active', createdAt: serverTimestamp() }); 
      if (allowedEmailsArray.length === 0) { await addDoc(collection(db, 'notifications'), { text: `🔴 بث مباشر الآن: ${liveData.title}`, grade: liveData.grade, createdAt: serverTimestamp() }); }
      alert("بدأ البث!"); setLiveData({ title: '', liveUrl: '', grade: '3sec', passcode: '', allowedEmails: '' });
  };

  const stopLiveStream = async (id) => { if(window.confirm("إنهاء البث؟")) { await updateDoc(doc(db, 'live_sessions', id), { status: 'ended' }); alert("تم الإنهاء"); } };

  const parseExam = async () => {
    if (!bulkText.trim()) return alert("أدخل نص الامتحان");
    if (!examBuilder.accessCode) return alert("أدخل كود للامتحان");
    if (!examBuilder.startTime || !examBuilder.endTime) return alert("يرجى تحديد وقت البدء والانتهاء");

    const lines = bulkText.split('\n').map(l => l.trim());
    const blocks = []; let currentBlock = { text: '', subQuestions: [] }; let currentQ = null; let isReadingPassage = false; let currentBranch = 'عام'; 

    lines.forEach(line => {
      if (line.startsWith('#فرع:') || line.startsWith('#الفرع:')) { currentBranch = line.replace('#فرع:', '').replace('#الفرع:', '').trim(); return; }
      if (line === 'بداية القطعة') { if (currentQ) { currentBlock.subQuestions.push(currentQ); currentQ = null; } if (currentBlock.subQuestions.length > 0) { blocks.push(currentBlock); } currentBlock = { text: '', subQuestions: [] }; isReadingPassage = true; return; }
      if (line === 'نهاية القطعة') { isReadingPassage = false; return; }
      if (line === 'حذف القطعة') { if(currentQ) { currentBlock.subQuestions.push(currentQ); currentQ = null; } if (currentBlock.subQuestions.length > 0) { blocks.push(currentBlock); } currentBlock = { text: '', subQuestions: [] }; return; }

      if (isReadingPassage) { if(line !== '') currentBlock.text += line + '\n'; } 
      else {
        if (line === '') { if (currentQ && currentQ.options.length > 0) { currentBlock.subQuestions.push(currentQ); currentQ = null; } return; }
        const isCorrect = line.startsWith('*'); const optText = isCorrect ? line.substring(1).trim() : line.trim();
        if (currentQ && currentQ.options.length >= 4 && !isCorrect) { currentBlock.subQuestions.push(currentQ); currentQ = null; }
        if (!currentQ) { currentQ = { id: Date.now() + Math.random(), text: optText, options: [], correctIdx: 0, branch: currentBranch }; } 
        else { if (isCorrect) { currentQ.correctIdx = currentQ.options.length; } currentQ.options.push(optText); }
      }
    });
    
    if (currentQ && currentQ.options.length > 0) currentBlock.subQuestions.push(currentQ);
    if (currentBlock.subQuestions.length > 0) blocks.push(currentBlock);
    const finalBlocks = blocks.filter(b => b.subQuestions.length > 0);
    if (finalBlocks.length === 0) return alert("لم يتم التعرف على أسئلة بشكل صحيح. تأكد من وجود إجابات تحت كل سؤال.");

    await addDoc(collection(db, 'exams'), { title: examBuilder.title, grade: examBuilder.grade, duration: examBuilder.duration, startTime: examBuilder.startTime, endTime: examBuilder.endTime, accessCode: examBuilder.accessCode, questions: finalBlocks, createdAt: serverTimestamp() });
    await addDoc(collection(db, 'notifications'), { text: `امتحان جديد: ${examBuilder.title}`, grade: examBuilder.grade, createdAt: serverTimestamp() });
    setBulkText(""); alert(`تم نشر الامتحان بنجاح!`);
  };
  
  const getQuestionsForExam = (examData) => { const flat = []; if(examData && examData.questions) { examData.questions.forEach(group => { group.subQuestions.forEach(q => { flat.push({ ...q, blockText: group.text }); }); }); } return flat; };

  const toggleLeaderboard = async () => { await setDoc(doc(db, 'settings', 'config'), { show: !showLeaderboard }, { merge: true }); setShowLeaderboard(!showLeaderboard); };
  const handleAddAutoReply = async () => { if(!newAutoReply.keywords || !newAutoReply.response) return alert("أكمل البيانات"); await addDoc(collection(db, 'auto_replies'), newAutoReply); setNewAutoReply({ keywords: '', response: '', isActive: true }); };
  const toggleAutoReply = async (id, currentStatus) => { await updateDoc(doc(db, 'auto_replies', id), { isActive: !currentStatus }); };
  const deleteAutoReply = async (id) => { if(window.confirm("حذف هذا الرد؟")) await deleteDoc(doc(db, 'auto_replies', id)); };
  const handleAddQuote = async () => { if(!newQuote.text || !newQuote.source) return alert("أكمل البيانات"); await addDoc(collection(db, 'quotes'), { ...newQuote, createdAt: serverTimestamp() }); setNewQuote({ text: '', source: '' }); };
  const deleteQuote = async (id) => { if(window.confirm("حذف هذه الحكمة؟")) await deleteDoc(doc(db, 'quotes', id)); };

  const filteredPendingUsers = pendingUsers.filter(u => adminGradeFilter === 'all' || u.grade === adminGradeFilter);
  const filteredActiveUsers = activeUsersList.filter(u => adminGradeFilter === 'all' || u.grade === adminGradeFilter);
  const filteredContentList = contentList.filter(c => adminGradeFilter === 'all' || c.grade === adminGradeFilter);
  const filteredExamsList = examsList.filter(e => adminGradeFilter === 'all' || e.grade === adminGradeFilter);
  const filteredLiveSessions = activeLiveSessions.filter(ls => adminGradeFilter === 'all' || ls.grade === adminGradeFilter);

  return (
    <div className="min-h-screen bg-slate-100 font-['Cairo'] relative" dir="rtl">
      <FloatingArabicBackground />

      {editingExamTime && (
          <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
                  <button onClick={() => setEditingExamTime(null)} className="absolute top-4 left-4 text-slate-400 hover:text-red-500"><X size={24}/></button>
                  <h3 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2"><Calendar size={24}/> تمديد وقت الامتحان</h3>
                  <p className="text-sm text-slate-600 mb-6 font-bold">{editingExamTime.title}</p>
                  <form onSubmit={handleUpdateExamTime}>
                      <label className="block text-sm font-bold mb-2 text-slate-800">تاريخ ووقت الانتهاء الجديد:</label>
                      <input type="datetime-local" className="w-full border-2 border-blue-200 p-3 rounded-xl mb-6 bg-blue-50 focus:border-blue-500 outline-none transition" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} required />
                      <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/50">حفظ التعديل</button>
                  </form>
              </div>
          </div>
      )}

      {viewingStudentProfile && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-50 rounded-3xl w-full max-w-6xl h-[90vh] shadow-2xl flex flex-col relative overflow-hidden border border-slate-300">
                  <div className="bg-white border-b border-slate-200 p-6 flex justify-between items-start flex-shrink-0">
                      <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner">{viewingStudentProfile.name.charAt(0)}</div>
                          <div>
                              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">{viewingStudentProfile.name} <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{getGradeLabel(viewingStudentProfile.grade)}</span></h2>
                              <div className="flex gap-4 mt-2 text-sm text-slate-500 font-bold"><span className="flex items-center gap-1"><Phone size={14}/> {viewingStudentProfile.phone}</span><span className="flex items-center gap-1 text-amber-600"><Users size={14}/> ولي الأمر: {viewingStudentProfile.parentPhone}</span></div>
                          </div>
                      </div>
                      <button onClick={() => setViewingStudentProfile(null)} className="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-500 transition"><X size={24}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
                              <h3 className="font-bold text-lg mb-4 text-blue-800 flex items-center gap-2 border-b pb-2"><PlayCircle/> سجل مشاهدات الفيديوهات</h3>
                              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                  {studentHistoryData.length === 0 ? <p className="text-slate-400 text-center py-10">لم يفتح أي فيديو.</p> : studentHistoryData.map((v, i) => (
                                      <div key={i} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center border border-slate-100">
                                          <div><p className="font-bold text-slate-800">{v.videoTitle}</p><p className="text-xs text-slate-400 mt-1">آخر فتح: {v.viewedAt?.toDate().toLocaleString('ar-EG')}</p></div>
                                          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold text-center">شاهد لمدة<br/><span className="text-sm">{formatWatchTime(v.watchedSeconds)}</span></div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                          <div className="flex flex-col gap-6 h-[500px]">
                              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
                                  <h3 className="font-bold text-lg mb-4 text-emerald-800 flex items-center gap-2 border-b pb-2"><ClipboardList/> نتائج الامتحانات</h3>
                                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                      {(() => {
                                          const sExams = examResults.filter(r => r.studentId === viewingStudentProfile.id);
                                          if (sExams.length === 0) return <p className="text-slate-400 text-center py-4">لم يقم بحل أي امتحان.</p>;
                                          return sExams.map(ex => (
                                              <div key={ex.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                  <p className="font-bold text-slate-700 text-sm">{examsList.find(e => e.id === ex.examId)?.title || 'امتحان محذوف'}</p>
                                                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${ex.status === 'cheated' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>{ex.status === 'cheated' ? 'غش 🚫' : `${ex.score}/${ex.total}`}</span>
                                              </div>
                                          ))
                                      })()}
                                  </div>
                              </div>
                              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
                                  <h3 className="font-bold text-lg mb-4 text-amber-800 flex items-center gap-2 border-b pb-2"><QrCode/> سجل واجبات (QR)</h3>
                                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                      {(() => {
                                          const sHw = hwResults.filter(r => r.studentId === viewingStudentProfile.id);
                                          if (sHw.length === 0) return <p className="text-slate-400 text-center py-4">لم يقم بتسليم أي واجب QR.</p>;
                                          return sHw.map(hw => (
                                              <div key={hw.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                  <div><p className="font-bold text-slate-700 text-sm">{hw.homeworkTitle}</p><p className="text-xs text-slate-400">{hw.bookName}</p></div>
                                                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-sm font-bold">{hw.score}/${hw.total}</span>
                                              </div>
                                          ))
                                      })()}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <header className="flex justify-between items-center mb-8 glass-panel p-4 rounded-xl relative z-10 m-4">
        <div className="flex items-center gap-2"><ShieldAlert className="text-amber-600"/> <h1 className="text-2xl font-bold font-arabic text-slate-800">لوحة تحكم النحاس (الأدمن)</h1></div>
        <div className="flex gap-4 items-center">
            <select className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold shadow-sm cursor-pointer" value={adminGradeFilter} onChange={(e) => setAdminGradeFilter(e.target.value)}><option value="all">كل المراحل الدراسية</option><GradeOptions /></select>
            <button onClick={() => signOut(auth)} className="text-red-500 font-bold px-4 py-2 flex gap-2 hover:bg-red-50 rounded-lg transition"><LogOut /> خروج</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 relative z-10">
        <div className="glass-panel p-4 rounded-xl h-fit space-y-2">
          {['users', 'all_users', 'exams', 'results', 'smart_hw', 'live', 'content', 'messages', 'auto_reply', 'quotes', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-right p-3 rounded-lg font-bold flex gap-2 transition-all ${activeTab===tab?'bg-amber-100 text-amber-700 shadow-sm border-r-4 border-amber-500':'hover:bg-slate-50 text-slate-600'}`}>
              {tab === 'users' ? 'الطلبات' : tab === 'all_users' ? 'الطلاب' : tab === 'exams' ? 'الامتحانات' : tab === 'results' ? 'النتائج' : tab === 'smart_hw' ? 'الواجب الذكي (QR)' : tab === 'live' ? 'البث' : tab === 'content' ? 'المحتوى' : tab === 'messages' ? 'الرسائل' : tab === 'auto_reply' ? 'الرد الآلي' : tab === 'quotes' ? 'إدارة الحكم' : 'الإعدادات'}
            </button>
          ))}
        </div>

        <div className="md:col-span-3">
          {activeTab === 'users' && <div className="glass-panel p-6 rounded-xl"><h2 className="font-bold mb-4 font-arabic text-xl">طلبات الانضمام</h2>{filteredPendingUsers.map(u=><div key={u.id} className="border p-4 mb-2 rounded-lg flex justify-between bg-white/50 backdrop-blur-sm"><div><p className="font-bold">{u.name}</p><p className="text-sm">{u.grade}</p></div><div className="flex gap-2"><button onClick={()=>handleApprove(u.id)} className="bg-green-600 text-white px-3 py-1 rounded shadow-lg hover:shadow-green-500/50 transition"><Check/></button><button onClick={()=>handleReject(u.id)} className="bg-red-600 text-white px-3 py-1 rounded shadow-lg hover:shadow-red-500/50 transition"><X/></button></div></div>)}</div>}

          {activeTab === 'all_users' && (
              <div className="glass-panel p-6 rounded-xl">
                  <h2 className="font-bold mb-4 font-arabic text-xl">قائمة الطلاب ({filteredActiveUsers.length})</h2>
                  {editingUser && (
                      <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                              <button onClick={() => setEditingUser(null)} className="absolute top-4 left-4 text-slate-400 hover:text-red-500"><X size={24}/></button>
                              <h3 className="text-xl font-bold mb-6 text-blue-800 flex items-center gap-2 border-b pb-2"><Edit size={24}/> تعديل بيانات الطالب</h3>
                              <form onSubmit={handleUpdateUser} className="space-y-4">
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">اسم الطالب</label><input className="w-full border-2 border-blue-100 p-3 rounded-xl bg-blue-50 focus:border-blue-500 outline-none transition" value={editingUser.name || ''} onChange={e=>setEditingUser({...editingUser, name:e.target.value})} required/></div>
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">رقم هاتف الطالب</label><input type="tel" className="w-full border-2 border-blue-100 p-3 rounded-xl bg-blue-50 focus:border-blue-500 outline-none transition" value={editingUser.phone || ''} onChange={e=>setEditingUser({...editingUser, phone:e.target.value})} required/></div>
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">رقم هاتف ولي الأمر</label><input type="tel" className="w-full border-2 border-blue-100 p-3 rounded-xl bg-blue-50 focus:border-blue-500 outline-none transition" value={editingUser.parentPhone || ''} onChange={e=>setEditingUser({...editingUser, parentPhone:e.target.value})} required/></div>
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">المرحلة الدراسية</label><select className="w-full border-2 border-blue-100 p-3 rounded-xl bg-white focus:border-blue-500 outline-none transition" value={editingUser.grade || '1sec'} onChange={e=>setEditingUser({...editingUser, grade:e.target.value})}><GradeOptions /></select></div>
                                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/50 mt-2">حفظ التعديلات</button>
                              </form>
                          </div>
                      </div>
                  )}
                  <div className="grid gap-4">
                      {filteredActiveUsers.map(u=>(
                          <div key={u.id} className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all hover:shadow-lg ${u.status.startsWith('banned') ? 'bg-red-50 border-red-200' : 'bg-white/50 border-slate-100'}`}>
                              <div className="flex flex-col md:flex-row justify-between w-full">
                                  <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1"><p className="font-bold text-lg text-slate-800">{u.name}</p><span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{getGradeLabel(u.grade)}</span>{u.status.startsWith('banned') && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-bold">محظور</span>}</div>
                                      <div className="text-sm text-slate-500 space-y-1"><p className="flex items-center gap-2"><Mail size={14}/> {u.email}</p><p className="flex items-center gap-2"><Phone size={14} className="text-blue-600"/> الطالب: {u.phone}</p><p className="flex items-center gap-2 font-bold text-amber-700"><Users size={14}/> ولي الأمر: {u.parentPhone}</p></div>
                                  </div>
                                  <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                                      <div className="flex gap-2">
                                          {u.status.startsWith('banned') && (<button onClick={() => handleChangeUserStatus(u.id, 'active')} className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-200 flex items-center gap-1"><Unlock size={14} /> فك الحظر</button>)}
                                          <select className="text-xs border p-2 rounded-lg bg-white" value={u.status} onChange={(e) => handleChangeUserStatus(u.id, e.target.value)}><option value="active">نشط (Active)</option><option value="banned_all">حظر شامل (Full Ban)</option><option value="banned_exam">حظر امتحانات (Exam Ban)</option><option value="banned_content">حظر محتوى (Content Ban)</option></select>
                                      </div>
                                      <div className="flex gap-2 justify-end">
                                          <button onClick={()=>openStudentProfile(u)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-bold shadow-md flex items-center gap-2" title="ملف الطالب الشامل"><FileCheck size={16}/> ملف الطالب</button>
                                          <button onClick={()=>setEditingUser(u)} className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200" title="تعديل"><Edit size={16}/></button>
                                          <button onClick={()=>handleSendResetPassword(u.email)} className="bg-amber-100 text-amber-600 p-2 rounded-lg hover:bg-amber-200" title="تغيير كلمة السر"><KeyRound size={16}/></button>
                                          <button onClick={()=>handleDeleteUser(u.id)} className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200" title="حذف"><Trash2 size={16}/></button>
                                      </div>
                                  </div>
                              </div>
                              {u.gradeUpdateStatus === 'pending' && (
                                  <div className="w-full bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex justify-between items-center">
                                      <div className="flex items-center gap-2 text-yellow-800 text-sm font-bold"><RefreshCw size={16} className="animate-spin-slow" /> يريد التحويل إلى: <span className="bg-white px-2 rounded border">{getGradeLabel(u.requestedGrade)}</span></div>
                                      <div className="flex gap-2"><button onClick={() => approveGrade(u)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700">موافقة</button><button onClick={() => rejectGrade(u)} className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700">رفض</button></div>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'smart_hw' && (
              <div className="space-y-6">
                  <div className="glass-panel p-6 rounded-xl">
                      <h2 className="text-xl font-bold mb-4 font-arabic text-blue-700 flex items-center gap-2"><QrCode/> إضافة واجب (للكتاب)</h2>
                      <form onSubmit={handleCreateSmartHw} className="grid gap-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div><label className="block text-xs font-bold mb-1 text-slate-500">المرحلة الدراسية</label><select className="border p-3 rounded w-full bg-white" value={newSmartHw.grade} onChange={e=>setNewSmartHw({...newSmartHw, grade:e.target.value})}><GradeOptions/></select></div>
                              <div><label className="block text-xs font-bold mb-1 text-slate-500">اسم الكتاب (سيتم تجميع الصفحات تحته)</label><input className="border p-3 rounded w-full" placeholder="مثال: كتاب النحو الجزء الأول" value={newSmartHw.bookName} onChange={e=>setNewSmartHw({...newSmartHw, bookName:e.target.value})} required/></div>
                          </div>
                          <input className="border p-3 rounded" placeholder="اسم الواجب/رقم الصفحة (مثال: تدريبات صفحة 15)" value={newSmartHw.title} onChange={e=>setNewSmartHw({...newSmartHw, title:e.target.value})} required/>
                          <textarea className="border p-3 rounded h-24" placeholder="نموذج الإجابة (مثال: 1-أ, 2-ج, 3-د...)" value={newSmartHw.answerKey} onChange={e=>setNewSmartHw({...newSmartHw, answerKey:e.target.value})} required/>
                          <button type="submit" className="bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-blue-500/50">توليد رابط للصفحة</button>
                      </form>
                  </div>
                  <div className="glass-panel p-6 rounded-xl">
                      <h3 className="font-bold mb-4">الواجبات المضافة (مقسمة حسب المرحلة التي تم اختيارها من الأعلى)</h3>
                      <div className="space-y-6">
                          {(() => {
                              const filteredHw = smartHomeworks.filter(hw => adminGradeFilter === 'all' || hw.grade === adminGradeFilter);
                              if (filteredHw.length === 0) return <p className="text-slate-500">لا توجد واجبات في هذه المرحلة.</p>;
                              const hwByBook = filteredHw.reduce((acc, hw) => { const book = hw.bookName || 'كتب غير مصنفة'; if(!acc[book]) acc[book] = []; acc[book].push(hw); return acc; }, {});
                              return Object.entries(hwByBook).map(([bookName, hws]) => (
                                  <div key={bookName} className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                      <h4 className="font-bold text-lg text-amber-700 bg-amber-100 p-2 rounded-lg mb-4 flex items-center gap-2 inline-flex"><BookOpen size={20}/> كتاب: {bookName}</h4>
                                      <div className="space-y-3 pl-4 border-r-4 border-amber-300 pr-4">
                                          {hws.map(hw => {
                                              const hwLink = `${window.location.origin}/?hw=${hw.id}`;
                                              return (
                                                  <div key={hw.id} className="bg-white border shadow-sm p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 hover:border-amber-400 transition">
                                                      <div className="flex-1">
                                                          <p className="font-bold text-lg text-slate-800">{hw.title} <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{getGradeLabel(hw.grade)}</span></p>
                                                          <p className="text-sm text-slate-500 mb-2 mt-1 bg-slate-50 p-2 rounded">الإجابات: <span className="font-mono text-blue-600">{hw.answerKey}</span></p>
                                                          <code className="bg-slate-100 p-2 rounded text-xs break-all border block select-all">{hwLink}</code>
                                                      </div>
                                                      <div className="flex gap-2 items-center flex-shrink-0">
                                                          <button onClick={() => { navigator.clipboard.writeText(hwLink); alert("تم نسخ الرابط! اذهب لموقع QR Generator لتحويله."); }} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-700 text-sm h-fit shadow-md">نسخ الرابط</button>
                                                          <button onClick={async () => { if(window.confirm('هل أنت متأكد من حذف هذه الصفحة؟')) await deleteDoc(doc(db, 'smart_homeworks', hw.id)); }} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg"><Trash2 size={18}/></button>
                                                      </div>
                                                  </div>
                                              )
                                          })}
                                      </div>
                                  </div>
                              ));
                          })()}
                      </div>
                  </div>
                  <div className="glass-panel p-6 rounded-xl">
                      <h3 className="font-bold mb-4 text-green-700">نتائج تصحيح الذكاء الاصطناعي</h3>
                      <div className="space-y-2">
                          {hwResults.filter(res => adminGradeFilter === 'all' || res.grade === adminGradeFilter).map(res => (
                              <div key={res.id} className="flex justify-between items-center border p-3 rounded hover:bg-slate-50 transition bg-white/50">
                                  <div>
                                      <p className="font-bold">{res.studentName} <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600 mx-1">{getGradeLabel(res.grade)}</span></p>
                                      <p className="text-slate-500 text-xs font-bold mt-1">الكتاب: {res.bookName} - {res.homeworkTitle}</p>
                                      <p className="text-sm text-green-600 font-bold mt-1">الدرجة: {res.score}/{res.total}</p>
                                  </div>
                                  <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded-lg text-center">
                                      {res.submittedAt?.toDate().toLocaleDateString('ar-EG')}<br/>{res.submittedAt?.toDate().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'exams' && <div className="space-y-8"><div className="glass-panel p-6 rounded-xl"><h2 className="text-xl font-bold mb-6 border-b pb-2 font-arabic text-amber-700">إنشاء امتحان</h2><div className="grid grid-cols-4 gap-4 mb-6"><input className="border p-2 rounded col-span-2" placeholder="العنوان" value={examBuilder.title} onChange={e=>setExamBuilder({...examBuilder, title:e.target.value})}/><input className="border p-2 rounded" placeholder="الكود" value={examBuilder.accessCode} onChange={e=>setExamBuilder({...examBuilder, accessCode:e.target.value})}/><input type="number" className="border p-2 rounded" placeholder="المدة (دقائق)" value={examBuilder.duration} onChange={e=>setExamBuilder({...examBuilder, duration:parseInt(e.target.value)})}/><select className="border p-2 rounded col-span-4" value={examBuilder.grade} onChange={e=>setExamBuilder({...examBuilder, grade:e.target.value})}><GradeOptions/></select><div className="col-span-2"><label className="block text-xs font-bold mb-1">وقت البدء</label><input type="datetime-local" className="border p-2 rounded w-full" onChange={e=>setExamBuilder({...examBuilder, startTime:e.target.value})}/></div><div className="col-span-2"><label className="block text-xs font-bold mb-1">وقت الانتهاء</label><input type="datetime-local" className="border p-2 rounded w-full" onChange={e=>setExamBuilder({...examBuilder, endTime:e.target.value})}/></div></div><div className="bg-slate-50 p-4 rounded-xl border mb-6"><textarea className="w-full border p-4 rounded-lg h-96 font-mono text-sm" placeholder="اكتب الأسئلة هنا...&#10;(هام 1: افصل بين كل سؤال والذي يليه بسطر فارغ تماماً، وضع علامة * قبل الإجابة الصحيحة)&#10;(هام 2: لتحديد فرع، اكتب #فرع: اسم_الفرع في سطر لوحده)" value={bulkText} onChange={e=>setBulkText(e.target.value)}/><button onClick={parseExam} className="mt-4 w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-green-500/50 transition">نشر</button></div></div><div className="glass-panel p-6 rounded-xl"><h3 className="font-bold mb-4 font-arabic">الامتحانات الحالية</h3>{filteredExamsList.map(exam=><div key={exam.id} className="flex justify-between items-center border-b py-3 last:border-0 hover:bg-slate-50/50 px-2 rounded transition"><div><p className="font-bold">{exam.title}</p><p className="text-xs text-slate-500">من: {new Date(exam.startTime).toLocaleString('ar-EG')} | إلى: {new Date(exam.endTime).toLocaleString('ar-EG')}</p><p className="text-xs text-slate-400">كود: {exam.accessCode}</p></div><div className="flex gap-2"><button onClick={() => { setEditingExamTime(exam); setNewEndTime(exam.endTime); }} className="text-blue-600 p-2 bg-blue-100 rounded-lg hover:bg-blue-200" title="تمديد الوقت"><Calendar size={18}/></button><button onClick={()=>handleDeleteExam(exam.id)} className="text-red-600 p-2 bg-red-100 rounded-lg hover:bg-red-200" title="حذف"><Trash2 size={18}/></button></div></div>)}</div></div>}

          {activeTab === 'results' && (
             <div className="glass-panel p-6 rounded-xl">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="font-bold flex items-center gap-2 font-arabic text-xl"><Layout/> نتائج الامتحانات</h2>
                 {!viewingResult && examResults.length > 0 && (
                     <button onClick={handleDeleteAllResults} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition shadow-lg"><Trash2 size={16}/> حذف جميع النتائج</button>
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
                                   <div className="flex gap-2">
                                       <button onClick={() => sendWhatsAppToParent(viewingResult)} className="bg-green-500 text-white px-4 py-1 rounded text-sm flex items-center gap-2 font-bold hover:bg-green-600"><MessageCircle size={16}/> واتساب لولي الأمر</button>
                                       <button onClick={() => generatePDF('admin', {...viewingResult, total: viewingResult.total || 0, examTitle: examData?.title, questions: questions, answers: viewingResult.answers })} className="bg-blue-600 text-white px-4 py-1 rounded text-sm flex items-center gap-2"><Download size={16}/> التقرير</button>
                                   </div>
                               );
                           })()}
                       </div>
                       <h3 className="font-bold text-lg mb-2">إجابات الطالب: {viewingResult.studentName}</h3>
                       <div className="space-y-4 mt-4">
                           {(() => {
                               const examData = examsList.find(e => e.id === viewingResult.examId);
                               if(!examData) return <p>بيانات الامتحان محذوفة</p>;
                               const questions = getQuestionsForExam(examData);
                               const groupedQuestions = questions.reduce((acc, q) => { const b = q.branch || 'عام'; if(!acc[b]) acc[b] = []; acc[b].push(q); return acc; }, {});
                               return Object.entries(groupedQuestions).map(([branch, qs]) => (
                                   <div key={branch} className="mb-6">
                                       <h4 className="font-bold text-xl text-amber-700 bg-amber-100 p-2 rounded-lg mb-4">{branch}</h4>
                                       <div className="space-y-4">
                                           {qs.map((q, idx) => (
                                               <div key={idx} className="bg-white p-4 rounded border relative">
                                                   <p className="font-bold mb-2 text-xl text-blue-900 font-sans pr-10">
                                                       {q.text.split('|').map((part, i) => (<React.Fragment key={i}>{part.trim()}{i !== q.text.split('|').length - 1 && <br />}</React.Fragment>))}
                                                   </p>
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
                                           ))}
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
                               <div className="flex gap-2">
                                  {res.status === 'completed' && <button onClick={()=>sendWhatsAppToParent(res)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-green-200"><MessageCircle size={14}/> إرسال لولي الأمر</button>}
                                  <button onClick={()=>setViewingResult(res)} className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs">التفاصيل</button>
                                  <button onClick={()=>handleDeleteResult(res.id)} className="bg-amber-100 text-amber-600 px-3 py-1 rounded text-xs">إعادة</button>
                               </div>
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
                                      <div><p className="font-bold text-red-800">{session.title} <span className="text-xs bg-red-200 px-2 py-1 rounded-full text-red-700">{getGradeLabel(session.grade)}</span></p>{session.passcode && <p className="text-xs text-red-600 mt-1">كود الدخول: {session.passcode}</p>}</div>
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
                              <span className="text-sm font-bold">اضغط هنا لرفع ملف (الحد الأقصى 1 ميجا)</span><span className="text-xs text-red-400">للملفات الأكبر، استخدم رابط خارجي</span>
                          </div>
                          {isUploading && (
                              <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center rounded-xl z-10">
                                  <span className="text-sm font-bold text-amber-600 mb-1">جاري القراءة... {uploadProgress}%</span>
                                  <div className="w-3/4 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div></div>
                              </div>
                          )}
                          {!isUploading && uploadProgress === 100 && (<div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl z-10"><span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={20}/> تم اختيار الملف</span></div>)}
                      </div>
                      <div className="flex gap-2">
                          <select className="border p-3 rounded flex-1" value={newContent.type} onChange={e=>setNewContent({...newContent, type:e.target.value})}>
                              <option value="video">فيديو مدمج</option><option value="file">ملف (PDF)</option><option value="html">ملف تفاعلي (HTML)</option><option value="interactive_exam">امتحان تفاعلي (رابط/HTML)</option><option value="link">رابط خارجي (Google Meet, Drive, etc)</option>
                          </select>
                          <select className="border p-3 rounded flex-1" value={newContent.grade} onChange={e=>setNewContent({...newContent, grade:e.target.value})}><GradeOptions/></select>
                      </div>
                      <div className="border p-3 rounded-lg bg-gray-50">
                          <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><Lock size={14}/> تخصيص لطلاب محددين (اختياري)</label>
                          <input className="border p-2 rounded w-full text-sm" placeholder="اكتب إيميلات الطلاب مفصولة بفاصلة (مثال: student1@gmail.com, student2@yahoo.com)" value={newContent.allowedEmails} onChange={e=>setNewContent({...newContent, allowedEmails:e.target.value})} />
                          <p className="text-xs text-gray-500 mt-1">اتركه فارغاً لكي يظهر المحتوى لجميع طلاب الصف.</p>
                      </div>
                      <div className="flex items-center gap-2"><input type="checkbox" checked={newContent.isPublic} onChange={e=>setNewContent({...newContent, isPublic:e.target.checked})}/> <label>عام (للصفحة الرئيسية)</label></div>
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
                              <div className="flex gap-2"><button onClick={() => handleDeleteContent(c.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button></div>
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
                                  <button onClick={() => toggleAutoReply(rule.id, rule.isActive)} className={`p-2 rounded-full ${rule.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`} title={rule.isActive ? "تعطيل" : "تنشيط"}><Power size={18} /></button>
                                  <button onClick={() => deleteAutoReply(rule.id)} className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"><Trash2 size={18} /></button>
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
                              <div><p className="font-bold text-slate-800">"{q.text}"</p><p className="text-xs text-slate-500">- {q.source}</p></div>
                              <button onClick={() => deleteQuote(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
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
                                  <span className="text-sm">{a.text}</span><button onClick={() => handleDeleteAnnouncement(a.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="border p-4 rounded-xl flex justify-between items-center">
                      <div><h3 className="font-bold text-blue-600">لوحة الشرف (الأوائل)</h3><p className="text-sm text-slate-500">إظهار أو إخفاء لوحة الأوائل في صفحة الطلاب</p></div>
                      <button onClick={toggleLeaderboard} className={`px-6 py-2 rounded-full font-bold ${showLeaderboard ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{showLeaderboard ? 'ظاهرة' : 'مخفية'}</button>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StudentDashboard = ({ user, userData, installPrompt }) => {
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
  const [hwResults, setHwResults] = useState([]); 
  const [reviewingExam, setReviewingExam] = useState(null);
  const [mistakes, setMistakes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotif, setHasNewNotif] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', parentPhone: '', grade: '' });
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [scanningHwId, setScanningHwId] = useState(null);

  useEffect(() => {
    if(!userData) return;
    const urlParams = new URLSearchParams(window.location.search);
    const hwParam = urlParams.get('hw');
    if (hwParam) { setScanningHwId(hwParam); window.history.replaceState({}, document.title, window.location.pathname); }

    const unsubContent = onSnapshot(query(collection(db, 'content'), where('grade', '==', userData.grade)), s => {
        const allContent = s.docs.map(d=>({id:d.id,...d.data()}));
        const visibleContent = allContent.filter(c => { if (!c.allowedEmails || c.allowedEmails.length === 0) return true; return c.allowedEmails.includes(user.email); });
        setContent(visibleContent);
    });

    const unsubLive = onSnapshot(query(collection(db, 'live_sessions'), where('status', '==', 'active'), where('grade', '==', userData.grade)), s => {
        const activeSessions = s.docs.map(d=>({id:d.id, ...d.data()}));
        const visibleSessions = activeSessions.filter(ls => { if (!ls.allowedEmails || ls.allowedEmails.length === 0) return true; return ls.allowedEmails.includes(user.email); });
        setLiveSessions(visibleSessions);
    });

    const unsubExams = onSnapshot(query(collection(db, 'exams'), where('grade', '==', userData.grade)), s => setExams(s.docs.map(d=>({id:d.id,...d.data()}))));
    const unsubResults = onSnapshot(query(collection(db, 'exam_results'), where('studentId', '==', user.uid)), s => setExamResults(s.docs.map(d=>({id:d.id,...d.data()}))));
    const unsubHwResults = onSnapshot(query(collection(db, 'homework_results'), where('studentId', '==', user.uid)), s => {
        const results = s.docs.map(d=>({id:d.id,...d.data()})); results.sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)); setHwResults(results);
    });
    const unsubMistakes = onSnapshot(query(collection(db, 'student_mistakes'), where('userId', '==', user.uid), orderBy('timestamp', 'desc')), s => { setMistakes(s.docs.map(d => ({id: d.id, ...d.data()}))); });
    const unsubNotif = onSnapshot(query(collection(db, 'notifications'), where('grade', 'in', ['all', userData.grade]), orderBy('createdAt', 'desc'), limit(10)), s => {
        const newNotifs = s.docs.map(d => d.data()); setNotifications(newNotifs);
        if(newNotifs.length > 0) { setHasNewNotif(true); if(newNotifs[0].text) sendSystemNotification("تنبيه جديد 🔔", newNotifs[0].text); }
    });

    setEditFormData({ name: userData.name, phone: userData.phone, parentPhone: userData.parentPhone, grade: userData.grade });

    return () => { unsubContent(); unsubLive(); unsubExams(); unsubResults(); unsubHwResults(); unsubMistakes(); unsubNotif(); };
  }, [userData, user]);

  const startMistakesExam = () => {
      if (mistakes.length === 0) return alert("ليس لديك أي أخطاء مسجلة بعد! استمر في التميز 👏");
      const shuffledMistakes = [...mistakes].sort(() => 0.5 - Math.random()).slice(0, 20);
      const generatedExam = {
          id: 'custom_mistakes_exam', title: 'امتحان نقاط الضعف (بنك الأخطاء) 🏦', duration: shuffledMistakes.length * 2, 
          questions: [ { text: 'أجب عن هذه الأسئلة التي أخطأت بها سابقاً:', subQuestions: shuffledMistakes.map(m => m.question) } ]
      };
      setActiveExam(generatedExam);
  };

  if (scanningHwId) return <SmartHomeworkScanner hwId={scanningHwId} user={user} onClose={() => setScanningHwId(null)} />;
  if (activeLiveView) return <LiveSessionView session={activeLiveView} user={user} onClose={() => setActiveLiveView(null)} />;
  if (activeExam) return <ExamRunner exam={activeExam} user={user} onClose={() => setActiveExam(null)} />;
  if (showFocusMode) return <PomodoroFocusMode onClose={() => setShowFocusMode(false)} />;
  if (reviewingExam) {
      const result = examResults.find(r => r.examId === reviewingExam.id);
      return <ExamRunner exam={reviewingExam} user={user} onClose={() => setReviewingExam(null)} isReviewMode={true} existingResult={result} />;
  }

  const isBannedAll = userData?.status === 'banned_all';
  const isBannedExam = userData?.status === 'banned_exam' || userData?.status === 'banned_cheating'; 
  const isBannedContent = userData?.status === 'banned_content';

  if(userData?.status === 'pending') return <div className="h-screen flex items-center justify-center bg-amber-50 text-center p-4"><div className="bg-white p-8 rounded-2xl shadow-xl"><h2 className="text-2xl font-bold mb-2">طلبك قيد المراجعة ⏳</h2><button onClick={()=>signOut(auth)} className="mt-4 text-red-500 underline">خروج</button></div></div>;
  if(userData?.status === 'rejected') return <div className="h-screen flex items-center justify-center bg-red-50"><div className="text-red-600 font-bold">تم رفض طلبك</div><button onClick={()=>signOut(auth)} className="ml-4 bg-white px-4 py-1 rounded">خروج</button></div>;
  if (isBannedAll) return (
      <div className="h-screen flex flex-col items-center justify-center bg-red-50 text-center p-6"><Ban size={80} className="text-red-600 mb-4" /><h2 className="text-3xl font-bold text-red-800 mb-2 font-arabic">تم حظر حسابك</h2><p className="text-red-600 mb-6 font-bold">يرجى التواصل مع الإدارة أو المستر لمعرفة السبب.</p><button onClick={()=>signOut(auth)} className="bg-white text-red-600 px-6 py-2 rounded-full font-bold shadow-md hover:bg-red-100">تسجيل الخروج</button></div>
  );

  const videos = content.filter(c => c.type === 'video');
  const filesAndLinks = content.filter(c => c.type === 'file' || c.type === 'link');
  const htmls = content.filter(c => c.type === 'html');
  const interactiveExams = content.filter(c => c.type === 'interactive_exam');

  const handleJoinLive = (session) => {
      if (session.passcode) { const code = prompt("أدخل الكود السري الخاص بالبث المباشر:"); if (code !== session.passcode) { return alert("عفواً، الكود غير صحيح!"); } }
      setActiveLiveView(session);
  };

  const startExamWithCode = async (exam) => {
    if (isBannedExam) return alert("أنت محظور من دخول الامتحانات.");
    const previousResult = examResults.find(r => r.examId === exam.id);
    if (previousResult) {
        if (previousResult.status === 'completed') { alert(`أنت امتحنت الامتحان ده قبل كده وجبت ${previousResult.score}.`); } 
        else if (previousResult.status === 'in_progress' || previousResult.status === 'cheated') { alert("لقد بدأت هذا الامتحان بالفعل وتم احتسابه عليك. لا يمكن الإعادة."); }
        return;
    }
    const now = new Date(); const start = new Date(exam.startTime); const end = new Date(exam.endTime);
    if (now < start) return alert(`الامتحان لم يبدأ بعد. موعد البدء: ${start.toLocaleString('ar-EG')}`);
    if (now > end) return alert("عفواً، انتهى وقت الامتحان.");
    const code = prompt("أدخل كود الامتحان:");
    if (code === exam.accessCode) {
        try {
            const attemptRef = await addDoc(collection(db, 'exam_results'), { examId: exam.id, studentId: user.uid, studentName: user.displayName, score: 0, total: 0, status: 'in_progress', submittedAt: serverTimestamp() });
            setActiveExam({ ...exam, attemptId: attemptRef.id });
        } catch (error) { console.error("Error creating attempt record:", error); alert("حدث خطأ أثناء بدء الامتحان. حاول مرة أخرى."); }
    } else { alert("كود خاطئ!"); }
  };

  const handleUpdateMyProfile = async (e) => {
    e.preventDefault();
    if (editFormData.grade !== userData.grade) {
        await updateDoc(doc(db, 'users', user.uid), { phone: editFormData.phone, requestedGrade: editFormData.grade, gradeUpdateStatus: 'pending' });
        alert("تم إرسال طلب تغيير الصف الدراسي إلى الإدارة للموافقة.");
    } else { await updateDoc(doc(db, 'users', user.uid), { phone: editFormData.phone }); alert("تم تحديث بياناتك بنجاح!"); }
  };

  return (
    <div className="bg-slate-50 relative font-['Cairo'] min-h-screen block" dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} user={user} userName={userData.name} onClose={() => setPlayingVideo(null)} />}
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
                <div onClick={() => setActiveTab('smart_hw_results')} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='smart_hw_results'?'bg-blue-100 text-blue-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}><QrCode/> سجل الواجبات (QR)</div>
                <div onClick={() => setActiveTab('mistakes_bank')} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='mistakes_bank'?'bg-red-100 text-red-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-red-600'}`}><BrainCircuit/> بنك الأخطاء</div>
              </>
          )}
          <button onClick={() => {setActiveTab('settings'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition ${activeTab==='settings'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><Settings/> ملفي الشخصي</button>
        </div>
        <div className="mt-auto pt-6"><button onClick={() => signOut(auth)} className="flex items-center gap-3 text-red-500 font-bold hover:bg-red-50 w-full p-4 rounded-xl transition"><LogOut/> خروج</button></div>
      </aside>

      <main className="p-4 md:p-10 relative z-10 min-h-screen md:pr-72 w-full transition-all">
        <div className="md:hidden flex justify-between items-center mb-6 glass-panel p-4 rounded-2xl shadow-sm"><h1 className="font-bold text-lg text-slate-800">منصة النحاس</h1><button onClick={() => setMobileMenu(true)} className="p-2 bg-slate-100 rounded-lg"><Menu /></button></div>
        <div className="flex justify-between items-center mb-6 relative">
            <div className="flex gap-2">
                {installPrompt && ( <button onClick={installPrompt} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-green-500/30 transition flex items-center gap-2"><DownloadCloud size={18}/> تثبيت التطبيق</button> )}
                <button onClick={() => setShowFocusMode(true)} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-full font-bold shadow-lg transition flex items-center gap-2"><Headphones size={18}/> وضع التركيز</button>
            </div>
            <button onClick={() => {requestNotificationPermission(); setShowNotifications(!showNotifications); setHasNewNotif(false);}} className="relative p-2 glass-panel rounded-full shadow-sm hover:bg-white transition">
                <Bell className="text-slate-600"/>{hasNewNotif && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
            </button>
            {showNotifications && (
                <div className="absolute top-12 left-0 w-80 glass-panel rounded-xl shadow-xl border border-white/50 p-4 z-50 max-h-96 overflow-y-auto">
                    <h3 className="font-bold mb-3 text-sm text-slate-500">الإشعارات</h3>
                    {notifications.length === 0 ? <p className="text-xs text-slate-400">لا توجد إشعارات جديدة</p> : (
                        <div className="space-y-3">
                            {notifications.map((n, i) => (
                                <div key={i} className="text-sm bg-slate-50/50 p-2 rounded border-l-4 border-amber-500">{n.text}<div className="text-[10px] text-slate-400 mt-1">{n.createdAt?.toDate().toLocaleDateString()}</div></div>
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
                        <p className="relative z-10 text-3xl font-black text-blue-600">{videos.length}</p><PlayCircle className="absolute -bottom-6 -left-6 text-blue-200 opacity-50 w-40 h-40 group-hover:scale-110 transition"/>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} onClick={()=> !isBannedContent && setActiveTab('files')} className={`glass-card p-8 rounded-3xl relative overflow-hidden cursor-pointer group ${isBannedContent ? 'opacity-50 grayscale' : ''}`}>
                        <h3 className="relative z-10 text-xl font-bold mb-2 text-amber-900 group-hover:text-amber-600 transition">الملفات</h3>
                        <p className="relative z-10 text-3xl font-black text-amber-600">{filesAndLinks.length}</p><FileText className="absolute -bottom-6 -left-6 text-amber-200 opacity-50 w-40 h-40 group-hover:scale-110 transition"/>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} onClick={()=> !isBannedContent && setActiveTab('htmls')} className={`glass-card p-8 rounded-3xl relative overflow-hidden cursor-pointer group ${isBannedContent ? 'opacity-50 grayscale' : ''}`}>
                        <h3 className="relative z-10 text-xl font-bold mb-2 text-purple-900 group-hover:text-purple-600 transition">تفاعلي</h3>
                        <p className="relative z-10 text-3xl font-black text-purple-600">{htmls.length}</p><Code className="absolute -bottom-6 -left-6 text-purple-200 opacity-50 w-40 h-40 group-hover:scale-110 transition"/>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} onClick={()=> !isBannedExam && setActiveTab('exams')} className={`glass-card p-8 rounded-3xl relative overflow-hidden cursor-pointer group ${isBannedExam ? 'opacity-50 grayscale' : ''}`}>
                        <h3 className="relative z-10 text-xl font-bold mb-2 text-slate-900 group-hover:text-slate-600 transition">الامتحانات</h3>
                        <p className="relative z-10 text-3xl font-black text-slate-600">{exams.length}</p><ClipboardList className="absolute -bottom-6 -left-6 text-slate-200 opacity-50 w-40 h-40 group-hover:scale-110 transition"/>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} onClick={()=> !isBannedExam && setActiveTab('smart_hw_results')} className={`glass-card p-8 rounded-3xl relative overflow-hidden cursor-pointer group ${isBannedExam ? 'opacity-50 grayscale' : ''}`}>
                        <h3 className="relative z-10 text-xl font-bold mb-2 text-blue-900 group-hover:text-blue-600 transition">واجبات (QR)</h3>
                        <p className="relative z-10 text-3xl font-black text-blue-600">{hwResults.length}</p><QrCode className="absolute -bottom-6 -left-6 text-blue-200 opacity-50 w-40 h-40 group-hover:scale-110 transition"/>
                    </motion.div>
                </div>
                <Leaderboard />
            </div>
        )}

        {activeTab === 'mistakes_bank' && !isBannedExam && (
            <div className="glass-panel p-8 rounded-2xl">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <h2 className="text-3xl font-bold font-arabic text-red-700 flex items-center gap-3"><BrainCircuit size={32} className="text-red-500" /> بنك أخطاء الطالب 🏦</h2>
                        <p className="text-slate-500 mt-2 text-lg">كل سؤال أخطأت فيه سيتم تسجيله هنا لتتمكن من مراجعته والتدرب عليه.</p>
                    </div>
                    <button onClick={startMistakesExam} className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-red-500/30 hover:bg-red-700 transition flex items-center gap-2 transform hover:scale-105"><Target size={20}/> توليد امتحان من أخطائي</button>
                </div>
                {mistakes.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm"><Trophy size={64} className="mx-auto text-amber-400 mb-4 opacity-80" /><h3 className="text-2xl font-bold text-slate-700">ممتاز جداً يا بطل! 👏</h3><p className="text-slate-500 mt-2">بنك الأخطاء الخاص بك فارغ تماماً. استمر على هذا المستوى.</p></div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 font-bold flex items-center gap-2">
                            <AlertOctagon /> لديك {mistakes.length} سؤال في بنك الأخطاء. يجب مراجعتها جيداً قبل الامتحان النهائي!
                        </div>
                        {mistakes.map(m => (
                            <div key={m.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-red-300 transition relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-slate-800 text-white text-xs px-3 py-1 rounded-bl-lg font-bold">من امتحان: {m.examTitle}</div>
                                <h3 className="text-xl font-bold text-slate-800 mt-4 mb-4 leading-relaxed font-sans">{m.question.text}</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100"><p className="text-xs text-red-500 font-bold mb-1">إجابتك الخاطئة كانت:</p><p className="font-bold text-slate-800">{m.question.studentAnswerText || 'غير معروف'}</p></div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100"><p className="text-xs text-green-600 font-bold mb-1">الإجابة الصحيحة هي:</p><p className="font-bold text-green-800">{m.question.correctAnswerText || 'غير معروف'}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
        
        {activeTab === 'videos' && !isBannedContent && <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{videos.map(v => (<div key={v.id} className="glass-card rounded-xl overflow-hidden cursor-pointer" onClick={() => setPlayingVideo(v)}><div className="h-48 bg-gradient-to-br from-slate-800 to-black flex items-center justify-center relative group"><PlayCircle className="text-white w-16 h-16 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/><span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(v.grade)}</span></div><div className="p-4"><h3 className="font-bold text-lg text-slate-800">{v.title}</h3></div></div>))}</div>}
        {activeTab === 'files' && !isBannedContent && (
            <div className="glass-panel rounded-xl overflow-hidden">
                {filesAndLinks.map(f => (
                    <div key={f.id} className="p-4 flex justify-between items-center border-b last:border-0 hover:bg-white/50 transition">
                        <div className="flex items-center gap-4">
                            {f.type === 'link' ? (<div className="bg-blue-100 text-blue-600 p-3 rounded-lg font-bold text-xs shadow-sm flex items-center justify-center"><LinkIcon size={16}/></div>) : (<div className="bg-red-100 text-red-600 p-3 rounded-lg font-bold text-xs shadow-sm">PDF</div>)}
                            <div><h4 className="font-bold text-lg text-slate-800">{f.title}</h4><span className="text-xs text-slate-500">{getGradeLabel(f.grade)}</span></div>
                        </div>
                        <a href={f.url} target="_blank" rel="noopener noreferrer" className={`px-4 py-2 rounded-lg font-bold transition shadow-sm ${f.type === 'link' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>{f.type === 'link' ? 'فتح الرابط' : 'تحميل'}</a>
                    </div>
                ))}
            </div>
        )}
        
        {activeTab === 'htmls' && !isBannedContent && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {htmls.map(h => (
                    <motion.div whileHover={{y:-5}} key={h.id} className="glass-card rounded-xl overflow-hidden cursor-pointer" onClick={() => setPlayingHtml(h)}>
                        <div className="h-48 bg-gradient-to-br from-purple-600 to-indigo-900 flex items-center justify-center relative group"><Code className="text-white w-20 h-20 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/><span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(h.grade)}</span></div>
                        <div className="p-4"><h3 className="font-bold text-lg text-slate-800">{h.title}</h3><button className="mt-2 w-full bg-purple-100 text-purple-700 font-bold py-2 rounded-lg hover:bg-purple-200 transition shadow-sm">تشغيل</button></div>
                    </motion.div>
                ))}
            </div>
        )}

        {activeTab === 'interactive_exams' && !isBannedExam && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {interactiveExams.map(h => (
                    <motion.div whileHover={{y:-5}} key={h.id} className="glass-card rounded-xl overflow-hidden cursor-pointer" onClick={() => setPlayingHtml(h)}>
                        <div className="h-48 bg-gradient-to-br from-emerald-600 to-teal-900 flex items-center justify-center relative group"><Sparkles className="text-white w-20 h-20 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/><span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(h.grade)}</span></div>
                        <div className="p-4"><h3 className="font-bold text-lg text-slate-800">{h.title}</h3><button className="mt-2 w-full bg-emerald-100 text-emerald-700 font-bold py-2 rounded-lg hover:bg-emerald-200 transition shadow-sm">بدء الامتحان</button></div>
                    </motion.div>
                ))}
            </div>
        )}
        
        {activeTab === 'exams' && !isBannedExam && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {exams.map(e => {
                const prevResult = examResults.find(r => r.examId === e.id);
                const isExamTimeOver = Date.now() > new Date(e.endTime).getTime();
                
                let statusText = null; let statusClass = "";
                if (prevResult) {
                    if (prevResult.status === 'completed') { statusText = `تم الحل: ${prevResult.score} درجة`; statusClass = "bg-green-500 text-white"; } 
                    else if (prevResult.status === 'in_progress') { statusText = "قيد التنفيذ / انسحاب ⚠️"; statusClass = "bg-yellow-500 text-white"; } 
                    else if (prevResult.status === 'cheated') { statusText = "تم الحظر (غش)"; statusClass = "bg-red-600 text-white"; }
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
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl font-bold text-center border border-red-200">لا يمكن إعادة الامتحان</div>
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

        {activeTab === 'smart_hw_results' && !isBannedExam && (
            <div className="glass-panel p-6 rounded-xl">
                <h2 className="text-2xl font-bold mb-6 font-arabic text-blue-800 flex items-center gap-2"><QrCode/> سجل الواجبات الذكية (QR)</h2>
                {hwResults.length === 0 ? (
                    <p className="text-slate-500 text-center py-10 bg-white rounded-xl border font-bold">لم تقم بتسليم أي واجب ذكي عبر الكاميرا حتى الآن.</p>
                ) : (
                    <div className="space-y-6">
                        {(() => {
                            const hwByBook = hwResults.reduce((acc, hw) => { const book = hw.bookName || 'كتب غير مصنفة'; if(!acc[book]) acc[book] = []; acc[book].push(hw); return acc; }, {});
                            return Object.entries(hwByBook).map(([bookName, hws]) => (
                                <div key={bookName} className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <h4 className="font-bold text-lg text-amber-700 bg-amber-100 p-2 rounded-lg mb-4 flex items-center gap-2 inline-flex"><BookOpen size={20}/> كتاب: {bookName}</h4>
                                    <div className="space-y-3 pl-4 border-r-4 border-amber-300 pr-4">
                                        {hws.map(hw => (
                                            <div key={hw.id} className="bg-white border shadow-sm p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 hover:border-amber-400 transition">
                                                <div className="flex-1">
                                                    <p className="font-bold text-lg text-slate-800">{hw.homeworkTitle}</p>
                                                    <p className="text-sm text-slate-500 mb-2 mt-1 bg-slate-50 p-2 rounded">تعليق المصحح: <span className="font-bold text-blue-600">{hw.feedback}</span></p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                    <span className="text-xl font-black text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">{hw.score} / {hw.total}</span>
                                                    <span className="text-xs text-slate-400">{hw.submittedAt?.toDate().toLocaleDateString('ar-EG')}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'settings' && (
              <div className="glass-panel p-8 rounded-xl max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 font-arabic text-slate-800"><Settings className="text-slate-700"/> إعدادات الحساب</h2>
                {userData.gradeUpdateStatus === 'pending' && (
                    <div className="mb-4 bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200 flex items-center gap-2 font-bold"><RefreshCw className="animate-spin-slow" size={20} /> لقد قمت بطلب تغيير المرحلة إلى {getGradeLabel(userData.requestedGrade)}. الطلب قيد المراجعة.</div>
                )}
                <form onSubmit={handleUpdateMyProfile} className="space-y-4">
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">الاسم</label><input disabled className="w-full border p-3 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed" value={editFormData.name} /><p className="text-xs text-red-500 mt-1">لا يمكن تغيير الاسم (تواصل مع الإدارة).</p></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label><input className="w-full border p-3 rounded-xl" value={editFormData.phone} onChange={e=>setEditFormData({...editFormData, phone:e.target.value})} /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">رقم ولي الأمر</label><input disabled className="w-full border p-3 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed" value={editFormData.parentPhone} /><p className="text-xs text-red-500 mt-1">لا يمكن تغيير رقم ولي الأمر.</p></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">الصف الدراسي (يتطلب موافقة الأدمن)</label><select className="w-full border p-3 rounded-xl bg-white" value={editFormData.grade} onChange={e=>setEditFormData({...editFormData, grade:e.target.value})}><GradeOptions /></select></div>
                  <button className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/40 transition">حفظ التعديلات</button>
                </form>
              </div>
        )}
      </main>
    </div>
  );
};

const LandingPage = ({ onAuthClick, installPrompt }) => {
  const [publicContent, setPublicContent] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null); 
  const [playingHtml, setPlayingHtml] = useState(null);
  
  useEffect(() => { const u = onSnapshot(query(collection(db, 'content'), where('isPublic', '==', true)), s => setPublicContent(s.docs.map(d=>d.data()))); return u; }, []);
  const openFacebook = () => window.open("https://www.facebook.com/share/17aiUQWKf5/", "_blank");

  return (
    <div className="min-h-screen font-['Cairo'] relative" dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} user={null} userName="زائر" onClose={() => setPlayingVideo(null)} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={null} onClose={() => setPlayingHtml(null)} />}
      <FloatingArabicBackground />
      <ChatWidget />
      <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto glass-panel mt-4 rounded-full mx-4 shadow-lg">
        <div className="flex items-center gap-2"><ModernLogo /><span className="text-2xl font-bold font-arabic text-amber-800">منصة النحاس</span></div>
        <div className="flex gap-4 items-center">
          {installPrompt && ( <button onClick={installPrompt} className="hidden md:flex bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-green-500/30 transition items-center gap-2"><DownloadCloud size={18}/> تثبيت التطبيق</button> )}
          <button onClick={openFacebook} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/50"><Facebook size={20}/></button>
          <button onClick={onAuthClick} className="bg-slate-900 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:shadow-slate-500/50 transition transform hover:-translate-y-0.5">دخول الطالب</button>
        </div>
      </nav>
      <main className="relative z-10 px-4 mt-10 max-w-7xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6">اللغة العربية <span className="text-amber-600">لعبتك</span></h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">أقوى منصة تعليمية للمرحلة الإعدادية والثانوية.</p>
        <button onClick={onAuthClick} className="bg-amber-600 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-xl hover:bg-amber-700 transition transform hover:-translate-y-1">اشترك الآن 🚀</button>
        {installPrompt && (<div className="md:hidden mt-6"><button onClick={installPrompt} className="bg-green-600 text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 mx-auto"><DownloadCloud size={18}/> تثبيت المنصة كتطبيق على هاتفك</button></div>)}
        <div className="my-12"><WisdomBox /></div>
        <div className="grid md:grid-cols-2 gap-8 mt-10 mb-20">
          <div className="bg-white/80 backdrop-blur p-6 rounded-3xl border border-white shadow-sm">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-700"><Video /> فيديوهات مجانية</h3>
            <div className="space-y-4">
              {publicContent.filter(c => c.type === 'video').length > 0 ? publicContent.filter(c => c.type === 'video').map((v, i) => (
                 <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm cursor-pointer hover:bg-gray-50" onClick={() => setPlayingVideo(v)}><PlayCircle className="text-amber-500"/><span className="font-bold">{v.title}</span><span className="mr-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">مشاهدة</span></div>
               )) : <p className="text-slate-500">مفيش فيديوهات عامة حالياً</p>}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur p-6 rounded-3xl border border-white shadow-sm">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-purple-700"><Code /> تفاعلي عام</h3>
            <div className="space-y-4">
              {publicContent.filter(c => c.type === 'html').length > 0 ? publicContent.filter(c => c.type === 'html').map((h, i) => (
                 <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm cursor-pointer hover:bg-gray-50" onClick={() => setPlayingHtml(h)}><Code className="text-purple-500"/><span className="font-bold">{h.title}</span><span className="mr-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">تشغيل</span></div>
               )) : <p className="text-slate-500">مفيش محتوى تفاعلي عام حالياً</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const AuthPage = ({ onBack }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', grade: '1sec', phone: '', parentPhone: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
        await setDoc(doc(db, 'users', userCred.user.uid), { name: formData.name, email: formData.email, grade: formData.grade, phone: formData.phone, parentPhone: formData.parentPhone, role: 'student', status: 'pending', createdAt: new Date() });
        alert("تم إنشاء الحساب! انتظر تفعيل الأدمن.");
      } else { await signInWithEmailAndPassword(auth, formData.email, formData.password); }
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
              <div className="relative"><GraduationCap className="absolute top-3.5 right-4 text-slate-400" size={20} /><select className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 appearance-none focus:border-amber-500 outline-none transition" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}><GradeOptions /></select></div>
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

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [viewMode, setViewMode] = useState('landing');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
      const handleBeforeInstallPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); };
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
      if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') { setDeferredPrompt(null); } }
  };

  useEffect(() => {
    if (!auth) return;
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        setLoading(true);
        const unsubUser = onSnapshot(doc(db, 'users', u.uid), (docSnap) => {
          if (docSnap.exists()) { setUserData(docSnap.data()); }
          setLoading(false);
        });
        return () => unsubUser();
      } else { setUserData(null); setLoading(false); }
    });
    return () => unsubAuth();
  }, []);

  if (authLoading || (user && loading)) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-amber-600 w-12 h-12"/></div>;

  return (
    <AnimatePresence mode='wait'>
      <DesignSystemLoader />
      {!user ? (
        viewMode === 'landing' ? <LandingPage key="landing" onAuthClick={() => setViewMode('auth')} installPrompt={deferredPrompt ? handleInstallClick : null} /> : <AuthPage key="auth" onBack={() => setViewMode('landing')} />
      ) : (
        user.email === 'mido16280@gmail.com' ? <AdminDashboard key="admin" user={user} /> : <StudentDashboard key="student" user={user} userData={userData} installPrompt={deferredPrompt ? handleInstallClick : null} />
      )}
    </AnimatePresence>
  );
}
const StudentDashboard = ({ user, userData, installPrompt }) => {
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
  const [hwResults, setHwResults] = useState([]); 
  const [reviewingExam, setReviewingExam] = useState(null);
  
  const [mistakes, setMistakes] = useState([]);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotif, setHasNewNotif] = useState(false);

  const [editFormData, setEditFormData] = useState({ 
      name: '', 
      phone: '', 
      parentPhone: '', 
      grade: '' 
  });

  const [showFocusMode, setShowFocusMode] = useState(false);
  const [scanningHwId, setScanningHwId] = useState(null);

  useEffect(() => {
    if(!userData) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const hwParam = urlParams.get('hw');
    if (hwParam) {
        setScanningHwId(hwParam);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const unsubContent = onSnapshot(query(collection(db, 'content'), where('grade', '==', userData.grade)), s => {
        const allContent = s.docs.map(d => ({id: d.id, ...d.data()}));
        const visibleContent = allContent.filter(c => {
            if (!c.allowedEmails || c.allowedEmails.length === 0) return true;
            return c.allowedEmails.includes(user.email);
        });
        setContent(visibleContent);
    });

    const unsubLive = onSnapshot(query(collection(db, 'live_sessions'), where('status', '==', 'active'), where('grade', '==', userData.grade)), s => {
        const activeSessions = s.docs.map(d => ({id: d.id, ...d.data()}));
        const visibleSessions = activeSessions.filter(ls => {
            if (!ls.allowedEmails || ls.allowedEmails.length === 0) return true;
            return ls.allowedEmails.includes(user.email);
        });
        setLiveSessions(visibleSessions);
    });

    const unsubExams = onSnapshot(query(collection(db, 'exams'), where('grade', '==', userData.grade)), s => {
        setExams(s.docs.map(d => ({id: d.id, ...d.data()})));
    });

    const unsubResults = onSnapshot(query(collection(db, 'exam_results'), where('studentId', '==', user.uid)), s => {
        setExamResults(s.docs.map(d => ({id: d.id, ...d.data()})));
    });
    
    const unsubHwResults = onSnapshot(query(collection(db, 'homework_results'), where('studentId', '==', user.uid)), s => {
        const results = s.docs.map(d => ({id: d.id, ...d.data()}));
        results.sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
        setHwResults(results);
    });

    const unsubMistakes = onSnapshot(query(collection(db, 'student_mistakes'), where('userId', '==', user.uid), orderBy('timestamp', 'desc')), s => {
        setMistakes(s.docs.map(d => ({id: d.id, ...d.data()})));
    });

    const unsubNotif = onSnapshot(query(collection(db, 'notifications'), where('grade', 'in', ['all', userData.grade]), orderBy('createdAt', 'desc'), limit(10)), s => {
        const newNotifs = s.docs.map(d => d.data());
        setNotifications(newNotifs);
        if(newNotifs.length > 0) {
             setHasNewNotif(true);
             if(newNotifs[0].text) sendSystemNotification("تنبيه جديد 🔔", newNotifs[0].text);
        }
    });

    setEditFormData({ 
        name: userData.name, 
        phone: userData.phone, 
        parentPhone: userData.parentPhone, 
        grade: userData.grade 
    });

    return () => { 
        unsubContent(); 
        unsubLive(); 
        unsubExams(); 
        unsubResults(); 
        unsubHwResults(); 
        unsubMistakes(); 
        unsubNotif(); 
    };
  }, [userData, user]);

  const startMistakesExam = () => {
      if (mistakes.length === 0) return alert("ليس لديك أي أخطاء مسجلة بعد! استمر في التميز 👏");
      
      const shuffledMistakes = [...mistakes].sort(() => 0.5 - Math.random()).slice(0, 20);
      
      const generatedExam = {
          id: 'custom_mistakes_exam', 
          title: 'امتحان نقاط الضعف (بنك الأخطاء) 🏦',
          duration: shuffledMistakes.length * 2, 
          questions: [
              {
                  text: 'أجب عن هذه الأسئلة التي أخطأت بها سابقاً:',
                  subQuestions: shuffledMistakes.map(m => m.question)
              }
          ]
      };
      setActiveExam(generatedExam);
  };

  if (scanningHwId) return <SmartHomeworkScanner hwId={scanningHwId} user={user} onClose={() => setScanningHwId(null)} />;
  if (activeLiveView) return <LiveSessionView session={activeLiveView} user={user} onClose={() => setActiveLiveView(null)} />;
  if (activeExam) return <ExamRunner exam={activeExam} user={user} onClose={() => setActiveExam(null)} />;
  if (showFocusMode) return <PomodoroFocusMode onClose={() => setShowFocusMode(false)} />;
  
  if (reviewingExam) {
      const result = examResults.find(r => r.examId === reviewingExam.id);
      return <ExamRunner exam={reviewingExam} user={user} onClose={() => setReviewingExam(null)} isReviewMode={true} existingResult={result} />;
  }

  const isBannedAll = userData?.status === 'banned_all';
  const isBannedExam = userData?.status === 'banned_exam' || userData?.status === 'banned_cheating'; 
  const isBannedContent = userData?.status === 'banned_content';

  if(userData?.status === 'pending') {
      return (
          <div className="h-screen flex items-center justify-center bg-amber-50 text-center p-4">
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                  <h2 className="text-2xl font-bold mb-2">طلبك قيد المراجعة ⏳</h2>
                  <button onClick={() => signOut(auth)} className="mt-4 text-red-500 underline">خروج</button>
              </div>
          </div>
      );
  }
  
  if(userData?.status === 'rejected') {
      return (
          <div className="h-screen flex items-center justify-center bg-red-50">
              <div className="text-red-600 font-bold">تم رفض طلبك</div>
              <button onClick={() => signOut(auth)} className="ml-4 bg-white px-4 py-1 rounded">خروج</button>
          </div>
      );
  }
  
  if (isBannedAll) {
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-red-50 text-center p-6">
              <Ban size={80} className="text-red-600 mb-4" />
              <h2 className="text-3xl font-bold text-red-800 mb-2 font-arabic">تم حظر حسابك</h2>
              <p className="text-red-600 mb-6 font-bold">يرجى التواصل مع الإدارة أو المستر لمعرفة السبب.</p>
              <button onClick={() => signOut(auth)} className="bg-white text-red-600 px-6 py-2 rounded-full font-bold shadow-md hover:bg-red-100">
                  تسجيل الخروج
              </button>
          </div>
      );
  }

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
      {playingVideo && (
          <SecureVideoPlayer 
              video={playingVideo} 
              user={user} 
              userName={userData.name} 
              onClose={() => setPlayingVideo(null)} 
          />
      )}
      {playingHtml && (
          <InteractiveViewer 
              content={playingHtml} 
              user={userData} 
              onClose={() => setPlayingHtml(null)} 
          />
      )}
      
      <FloatingArabicBackground />
      <ChatWidget user={user} />
      
      <aside className={`fixed top-0 bottom-0 right-0 z-40 bg-white/95 backdrop-blur-xl w-72 p-6 shadow-xl transition-transform duration-300 ${mobileMenu ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} border-l border-slate-200 flex flex-col`}>
        <div className="flex items-center gap-3 mb-10 px-2">
            <ModernLogo />
            <h1 className="text-2xl font-bold font-arabic text-amber-800">النحاس</h1>
            <button onClick={() => setMobileMenu(false)} className="md:hidden mr-auto"><X /></button>
        </div>
        
        <div className="space-y-2 flex-1 overflow-y-auto pr-2">
          <button 
              onClick={() => {setActiveTab('home'); setMobileMenu(false);}} 
              className={`flex items-center gap-3 w-full p-4 rounded-xl transition ${activeTab === 'home' ? 'bg-amber-100 text-amber-700 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}
          >
              <User/> الرئيسية
          </button>
          
          {!isBannedContent && (
              <>
                <div 
                    onClick={() => setActiveTab('videos')} 
                    className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab === 'videos' ? 'bg-amber-100 text-amber-700 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}
                >
                    <PlayCircle/> المحاضرات
                </div>
                <div 
                    onClick={() => setActiveTab('files')} 
                    className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab === 'files' ? 'bg-amber-100 text-amber-700 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}
                >
                    <FileText/> الملفات و الروابط
                </div>
                <div 
                    onClick={() => setActiveTab('htmls')} 
                    className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab === 'htmls' ? 'bg-purple-100 text-purple-700 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-purple-600'}`}
                >
                    <Code/> محتوى تفاعلي
                </div>
              </>
          )}
          
          {!isBannedExam && (
              <>
                <div 
                    onClick={() => setActiveTab('exams')} 
                    className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab === 'exams' ? 'bg-amber-100 text-amber-700 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}
                >
                    <ClipboardList/> الامتحانات
                </div>
                <div 
                    onClick={() => setActiveTab('interactive_exams')} 
                    className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab === 'interactive_exams' ? 'bg-emerald-100 text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'}`}
                >
                    <Sparkles/> امتحان تفاعلي
                </div>
                <div 
                    onClick={() => setActiveTab('smart_hw_results')} 
                    className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab === 'smart_hw_results' ? 'bg-blue-100 text-blue-700 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}
                >
                    <QrCode/> سجل الواجبات (QR)
                </div>
                <div 
                    onClick={() => setActiveTab('mistakes_bank')} 
                    className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab === 'mistakes_bank' ? 'bg-red-100 text-red-700 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-red-600'}`}
                >
                    <BrainCircuit/> بنك الأخطاء
                </div>
              </>
          )}
          
          <button 
              onClick={() => {setActiveTab('settings'); setMobileMenu(false);}} 
              className={`flex items-center gap-3 w-full p-4 rounded-xl transition ${activeTab === 'settings' ? 'bg-amber-100 text-amber-700 shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}
          >
              <Settings/> ملفي الشخصي
          </button>
        </div>
        <div className="mt-auto pt-6">
            <button onClick={() => signOut(auth)} className="flex items-center gap-3 text-red-500 font-bold hover:bg-red-50 w-full p-4 rounded-xl transition">
                <LogOut/> خروج
            </button>
        </div>
      </aside>

      <main className="p-4 md:p-10 relative z-10 min-h-screen md:pr-72 w-full transition-all">
        <div className="md:hidden flex justify-between items-center mb-6 glass-panel p-4 rounded-2xl shadow-sm">
            <h1 className="font-bold text-lg text-slate-800">منصة النحاس</h1>
            <button onClick={() => setMobileMenu(true)} className="p-2 bg-slate-100 rounded-lg"><Menu /></button>
        </div>
        
        <div className="flex justify-between items-center mb-6 relative">
            <div className="flex gap-2">
                {installPrompt && (
                    <button onClick={installPrompt} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-green-500/30 transition flex items-center gap-2">
                        <DownloadCloud size={18}/> تثبيت التطبيق
                    </button>
                )}
                <button onClick={() => setShowFocusMode(true)} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-full font-bold shadow-lg transition flex items-center gap-2">
                    <Headphones size={18}/> وضع التركيز
                </button>
            </div>

            <button onClick={() => {requestNotificationPermission(); setShowNotifications(!showNotifications); setHasNewNotif(false);}} className="relative p-2 glass-panel rounded-full shadow-sm hover:bg-white transition">
                <Bell className="text-slate-600"/>
                {hasNewNotif && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
            </button>
            
            {showNotifications && (
                <div className="absolute top-12 left-0 w-80 glass-panel rounded-xl shadow-xl border border-white/50 p-4 z-50 max-h-96 overflow-y-auto">
                    <h3 className="font-bold mb-3 text-sm text-slate-500">الإشعارات</h3>
                    {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400">لا توجد إشعارات جديدة</p>
                    ) : (
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
                
                <h2 className="text-3xl font-bold text-slate-800 font-arabic">
                    منور يا <span className="text-amber-600">{userData.name.split(' ')[0]}</span> 👋 
                    <span className="text-sm font-normal text-slate-500 bg-slate-200 px-2 py-1 rounded-full font-sans">{getGradeLabel(userData.grade)}</span>
                </h2>
                
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
                    
                    <motion.div whileHover={{ scale: 1.02 }} onClick={()=> !isBannedExam && setActiveTab('smart_hw_results')} className={`glass-card p-8 rounded-3xl relative overflow-hidden cursor-pointer group ${isBannedExam ? 'opacity-50 grayscale' : ''}`}>
                        <h3 className="relative z-10 text-xl font-bold mb-2 text-blue-900 group-hover:text-blue-600 transition">واجبات (QR)</h3>
                        <p className="relative z-10 text-3xl font-black text-blue-600">{hwResults.length}</p>
                        <QrCode className="absolute -bottom-6 -left-6 text-blue-200 opacity-50 w-40 h-40 group-hover:scale-110 transition"/>
                    </motion.div>
                </div>
                <Leaderboard />
            </div>
        )}

        {activeTab === 'mistakes_bank' && !isBannedExam && (
            <div className="glass-panel p-8 rounded-2xl">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <h2 className="text-3xl font-bold font-arabic text-red-700 flex items-center gap-3">
                            <BrainCircuit size={32} className="text-red-500" /> بنك أخطاء الطالب 🏦
                        </h2>
                        <p className="text-slate-500 mt-2 text-lg">كل سؤال أخطأت فيه سيتم تسجيله هنا لتتمكن من مراجعته والتدرب عليه.</p>
                    </div>
                    <button 
                        onClick={startMistakesExam} 
                        className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-red-500/30 hover:bg-red-700 transition flex items-center gap-2 transform hover:scale-105"
                    >
                        <Target size={20}/> توليد امتحان من أخطائي
                    </button>
                </div>

                {mistakes.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <Trophy size={64} className="mx-auto text-amber-400 mb-4 opacity-80" />
                        <h3 className="text-2xl font-bold text-slate-700">ممتاز جداً يا بطل! 👏</h3>
                        <p className="text-slate-500 mt-2">بنك الأخطاء الخاص بك فارغ تماماً. استمر على هذا المستوى.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 font-bold flex items-center gap-2">
                            <AlertOctagon /> لديك {mistakes.length} سؤال في بنك الأخطاء. يجب مراجعتها جيداً قبل الامتحان النهائي!
                        </div>
                        {mistakes.map(m => (
                            <div key={m.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-red-300 transition relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-slate-800 text-white text-xs px-3 py-1 rounded-bl-lg font-bold">من امتحان: {m.examTitle}</div>
                                <h3 className="text-xl font-bold text-slate-800 mt-4 mb-4 leading-relaxed font-sans">{m.question.text}</h3>
                                
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                        <p className="text-xs text-red-500 font-bold mb-1">إجابتك الخاطئة كانت:</p>
                                        <p className="font-bold text-slate-800">{m.question.studentAnswerText || 'غير معروف'}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                        <p className="text-xs text-green-600 font-bold mb-1">الإجابة الصحيحة هي:</p>
                                        <p className="font-bold text-green-800">{m.question.correctAnswerText || 'غير معروف'}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
        
        {activeTab === 'videos' && !isBannedContent && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {videos.map(v => (
                    <div key={v.id} className="glass-card rounded-xl overflow-hidden cursor-pointer" onClick={() => setPlayingVideo(v)}>
                        <div className="h-48 bg-gradient-to-br from-slate-800 to-black flex items-center justify-center relative group">
                            <PlayCircle className="text-white w-16 h-16 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/>
                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                {getGradeLabel(v.grade)}
                            </span>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-lg text-slate-800">{v.title}</h3>
                        </div>
                    </div>
                ))}
            </div>
        )}
        
        {activeTab === 'files' && !isBannedContent && (
            <div className="glass-panel rounded-xl overflow-hidden">
                {filesAndLinks.map(f => (
                    <div key={f.id} className="p-4 flex justify-between items-center border-b last:border-0 hover:bg-white/50 transition">
                        <div className="flex items-center gap-4">
                            {f.type === 'link' ? (
                                <div className="bg-blue-100 text-blue-600 p-3 rounded-lg font-bold text-xs shadow-sm flex items-center justify-center">
                                    <LinkIcon size={16}/>
                                </div>
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
                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                {getGradeLabel(h.grade)}
                            </span>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-lg text-slate-800">{h.title}</h3>
                            <button className="mt-2 w-full bg-purple-100 text-purple-700 font-bold py-2 rounded-lg hover:bg-purple-200 transition shadow-sm">
                                تشغيل
                            </button>
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
                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                {getGradeLabel(h.grade)}
                            </span>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-lg text-slate-800">{h.title}</h3>
                            <button className="mt-2 w-full bg-emerald-100 text-emerald-700 font-bold py-2 rounded-lg hover:bg-emerald-200 transition shadow-sm">
                                بدء الامتحان
                            </button>
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
                    {statusText && (
                        <div className={`absolute top-0 left-0 text-xs px-3 py-1 rounded-br-xl font-bold shadow-md ${statusClass}`}>
                            {statusText}
                        </div>
                    )}
                    
                    <h3 className="text-xl font-bold mb-2 text-slate-800">{e.title}</h3>
                    
                    <div className="flex justify-between text-sm text-slate-500 mb-4">
                        <span>⏳ {e.duration} دقيقة</span>
                        <span>📝 {e.questions.reduce((acc,g) => acc + g.subQuestions.length, 0)} سؤال</span>
                    </div>
                    
                    {prevResult && prevResult.status === 'completed' ? (
                        <div className="flex gap-2">
                             <button disabled className="flex-1 bg-slate-200 text-slate-500 py-3 rounded-xl font-bold cursor-not-allowed">
                                 تم الانتهاء
                             </button>
                             {isExamTimeOver ? (
                                <button onClick={() => setReviewingExam(e)} className="flex-1 bg-blue-100 text-blue-700 py-3 rounded-xl font-bold hover:bg-blue-200 transition shadow-sm">
                                    عرض الأخطاء
                                </button>
                             ) : (
                                <button disabled className="flex-1 bg-gray-100 text-gray-400 py-3 rounded-xl font-bold cursor-not-allowed text-xs">
                                    المراجعة بعد الوقت
                                </button>
                             )}
                             <button onClick={() => generatePDF('student', {studentName: user.displayName, score: prevResult.score, total: e.questions.reduce((acc,g)=>acc+g.subQuestions.length,0), status: prevResult.status, examTitle: e.title, questions: e.questions.flatMap(q => q.subQuestions), answers: prevResult.answers })} className="flex-1 bg-green-100 text-green-700 py-3 rounded-xl font-bold hover:bg-green-200 flex items-center justify-center gap-1 transition shadow-sm">
                                 <Download size={16}/> شهادة
                             </button>
                        </div>
                    ) : prevResult ? (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl font-bold text-center border border-red-200">
                            لا يمكن إعادة الامتحان
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs text-slate-500">يبدأ: {new Date(e.startTime).toLocaleString('ar-EG')}</p>
                            <button onClick={() => startExamWithCode(e)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-lg hover:shadow-slate-500/30 transition">
                                <Lock size={16}/> ابدأ الامتحان
                            </button>
                        </div>
                    )}
                  </motion.div>
                )
             })}
          </div>
        )}

        {activeTab === 'smart_hw_results' && !isBannedExam && (
            <div className="glass-panel p-6 rounded-xl">
                <h2 className="text-2xl font-bold mb-6 font-arabic text-blue-800 flex items-center gap-2"><QrCode/> سجل الواجبات الذكية (QR)</h2>
                {hwResults.length === 0 ? (
                    <p className="text-slate-500 text-center py-10 bg-white rounded-xl border font-bold">لم تقم بتسليم أي واجب ذكي عبر الكاميرا حتى الآن.</p>
                ) : (
                    <div className="space-y-6">
                        {(() => {
                            const hwByBook = hwResults.reduce((acc, hw) => { 
                                const book = hw.bookName || 'كتب غير مصنفة'; 
                                if(!acc[book]) acc[book] = []; 
                                acc[book].push(hw); 
                                return acc; 
                            }, {});
                            
                            return Object.entries(hwByBook).map(([bookName, hws]) => (
                                <div key={bookName} className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <h4 className="font-bold text-lg text-amber-700 bg-amber-100 p-2 rounded-lg mb-4 flex items-center gap-2 inline-flex">
                                        <BookOpen size={20}/> كتاب: {bookName}
                                    </h4>
                                    <div className="space-y-3 pl-4 border-r-4 border-amber-300 pr-4">
                                        {hws.map(hw => (
                                            <div key={hw.id} className="bg-white border shadow-sm p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 hover:border-amber-400 transition">
                                                <div className="flex-1">
                                                    <p className="font-bold text-lg text-slate-800">{hw.homeworkTitle}</p>
                                                    <p className="text-sm text-slate-500 mb-2 mt-1 bg-slate-50 p-2 rounded">
                                                        تعليق المصحح: <span className="font-bold text-blue-600">{hw.feedback}</span>
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                    <span className="text-xl font-black text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                                                        {hw.score} / {hw.total}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {hw.submittedAt?.toDate().toLocaleDateString('ar-EG')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                )}
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
                  <button className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/40 transition">
                      حفظ التعديلات
                  </button>
                </form>
              </div>
        )}
      </main>
    </div>
  );
};

const LandingPage = ({ onAuthClick, installPrompt }) => {
  const [publicContent, setPublicContent] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null); 
  const [playingHtml, setPlayingHtml] = useState(null);
  
  useEffect(() => { 
      const u = onSnapshot(query(collection(db, 'content'), where('isPublic', '==', true)), s => setPublicContent(s.docs.map(d=>d.data()))); 
      return u; 
  }, []);

  const openFacebook = () => window.open("https://www.facebook.com/share/17aiUQWKf5/", "_blank");

  return (
    <div className="min-h-screen font-['Cairo'] relative" dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} user={null} userName="زائر" onClose={() => setPlayingVideo(null)} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={null} onClose={() => setPlayingHtml(null)} />}
      
      <FloatingArabicBackground />
      <ChatWidget />
      
      <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto glass-panel mt-4 rounded-full mx-4 shadow-lg">
        <div className="flex items-center gap-2">
            <ModernLogo />
            <span className="text-2xl font-bold font-arabic text-amber-800">منصة النحاس</span>
        </div>
        <div className="flex gap-4 items-center">
          {installPrompt && (
              <button onClick={installPrompt} className="hidden md:flex bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-green-500/30 transition items-center gap-2">
                  <DownloadCloud size={18}/> تثبيت التطبيق
              </button>
          )}
          <button onClick={openFacebook} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/50">
              <Facebook size={20}/>
          </button>
          <button onClick={onAuthClick} className="bg-slate-900 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:shadow-slate-500/50 transition transform hover:-translate-y-0.5">
              دخول الطالب
          </button>
        </div>
      </nav>

      <main className="relative z-10 px-4 mt-10 max-w-7xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6">اللغة العربية <span className="text-amber-600">لعبتك</span></h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">أقوى منصة تعليمية للمرحلة الإعدادية والثانوية.</p>
        <button onClick={onAuthClick} className="bg-amber-600 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-xl hover:bg-amber-700 transition transform hover:-translate-y-1">
            اشترك الآن 🚀
        </button>
        
        {installPrompt && (
            <div className="md:hidden mt-6">
                <button onClick={installPrompt} className="bg-green-600 text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 mx-auto">
                    <DownloadCloud size={18}/> تثبيت المنصة كتطبيق على هاتفك
                </button>
            </div>
        )}

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

const AuthPage = ({ onBack }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
      email: '', 
      password: '', 
      name: '', 
      grade: '1sec', 
      phone: '', 
      parentPhone: '' 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
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
            name: formData.name, 
            email: formData.email, 
            grade: formData.grade, 
            phone: formData.phone, 
            parentPhone: formData.parentPhone, 
            role: 'student', 
            status: 'pending', 
            createdAt: new Date() 
        });
        alert("تم إنشاء الحساب! انتظر تفعيل الأدمن.");
      } else { 
          await signInWithEmailAndPassword(auth, formData.email, formData.password); 
      }
    } catch (error) { 
        alert("حدث خطأ: " + error.message); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleForgotPassword = async () => {
    if(!formData.email) { alert("من فضلك اكتب الإيميل الأول."); return; }
    try { 
        await sendPasswordResetEmail(auth, formData.email); 
        alert("تم إرسال رابط استعادة كلمة السر."); 
    } catch (error) { 
        alert("حدث خطأ: " + error.message); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 font-['Cairo'] relative overflow-hidden" dir="rtl">
      <FloatingArabicBackground />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-2xl relative z-10 my-10 overflow-y-auto max-h-[90vh] border border-white/50">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-sm mb-6 flex items-center gap-1 font-bold">
            <ChevronRight size={18} /> العودة
        </button>
        <div className="flex justify-center mb-4"><ModernLogo /></div>
        <h2 className="text-3xl font-bold font-arabic text-slate-800 mb-2 text-center">{isRegister ? 'حساب جديد' : 'تسجيل دخول'}</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
          {isRegister && (
            <>
              <div className="relative">
                  <User className="absolute top-3.5 right-4 text-slate-400" size={20} />
                  <input required type="text" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition" placeholder="الاسم ثلاثي" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="relative">
                  <Phone className="absolute top-3.5 right-4 text-slate-400" size={20} />
                  <input required type="tel" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition" placeholder="رقم هاتفك" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="relative">
                  <Phone className="absolute top-3.5 right-4 text-slate-400" size={20} />
                  <input required type="tel" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition" placeholder="رقم ولي الأمر" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} />
              </div>
              <div className="relative">
                  <GraduationCap className="absolute top-3.5 right-4 text-slate-400" size={20} />
                  <select className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 appearance-none focus:border-amber-500 outline-none transition" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                      <GradeOptions />
                  </select>
              </div>
            </>
          )}
          
          <div className="relative">
              <Mail className="absolute top-3.5 right-4 text-slate-400" size={20} />
              <input required type="email" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition" placeholder="البريد" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="relative">
              <Lock className="absolute top-3.5 right-4 text-slate-400" size={20} />
              <input required type="password" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition" placeholder="كلمة السر" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          
          {!isRegister && (
              <div className="text-left">
                  <button type="button" onClick={handleForgotPassword} className="text-xs text-amber-600 font-bold hover:underline">
                      نسيت كلمة السر؟
                  </button>
              </div>
          )}
          
          <button disabled={loading} className="bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/50 transition mt-2 flex justify-center">
              {loading ? <Loader2 className="animate-spin" /> : (isRegister ? 'تسجيل' : 'دخول')}
          </button>
        </form>
        
        <button onClick={() => setIsRegister(!isRegister)} className="mt-6 text-amber-800 font-bold hover:underline w-full text-center block text-sm">
            {isRegister ? 'تسجيل الدخول' : 'حساب جديد'}
        </button>
      </motion.div>
      <ChatWidget />
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [viewMode, setViewMode] = useState('landing');
  
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
      const handleBeforeInstallPrompt = (e) => { 
          e.preventDefault(); 
          setDeferredPrompt(e); 
      };
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
      if (deferredPrompt) { 
          deferredPrompt.prompt(); 
          const { outcome } = await deferredPrompt.userChoice; 
          if (outcome === 'accepted') { 
              setDeferredPrompt(null); 
          } 
      }
  };

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
        viewMode === 'landing' ? <LandingPage key="landing" onAuthClick={() => setViewMode('auth')} installPrompt={deferredPrompt ? handleInstallClick : null} /> : <AuthPage key="auth" onBack={() => setViewMode('landing')} />
      ) : (
        user.email === 'mido16280@gmail.com' ? <AdminDashboard key="admin" user={user} /> : <StudentDashboard key="student" user={user} userData={userData} installPrompt={deferredPrompt ? handleInstallClick : null} />
      )}
    </AnimatePresence>
  );
}