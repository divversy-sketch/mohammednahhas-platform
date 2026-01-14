import React, { useState, useEffect, useRef } from 'react';
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
  Calendar, Clock, FileWarning, Settings as GearIcon, Star
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

// طلب إذن الإشعارات من المتصفح
const requestNotificationPermission = () => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().then(permission => {
      if(permission === "granted") console.log("الإشعارات مفعلة");
    });
  }
};

// إرسال إشعار للنظام
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

// استخراج كود الفيديو من روابط اليوتيوب المختلفة
const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// توليد ملف PDF (التصميم الأسود والذهبي الجديد)
const generatePDF = (type, data) => {
    if (!window.html2pdf) {
        alert("جاري تحميل نظام الطباعة... يرجى الانتظار ثوانٍ والمحاولة مرة أخرى.");
        return;
    }

    const percentage = Math.round((data.score / data.total) * 100);
    const date = new Date().toLocaleDateString('ar-EG');
    const element = document.createElement('div');
    
    // 1. تقرير الأدمن (تفصيلي لولي الأمر)
    if (type === 'admin') {
         element.innerHTML = `
          <div style="padding: 40px; font-family: 'Cairo', sans-serif; direction: rtl; border: 2px solid #333; text-align: center;">
            <h1 style="color: #d97706;">تقرير طالب - منصة النحاس</h1>
            <hr style="margin: 20px 0; border-top: 1px solid #ccc;"/>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 18px;">
                <tr><td style="padding: 15px; border: 1px solid #ccc; background: #f9f9f9; width: 30%;">اسم الطالب</td><td style="padding: 15px; border: 1px solid #ccc;">${data.studentName}</td></tr>
                <tr><td style="padding: 15px; border: 1px solid #ccc; background: #f9f9f9;">الدرجة</td><td style="padding: 15px; border: 1px solid #ccc; font-weight: bold;">${data.score} / ${data.total} (${percentage}%)</td></tr>
                <tr><td style="padding: 15px; border: 1px solid #ccc; background: #f9f9f9;">الحالة</td><td style="padding: 15px; border: 1px solid #ccc; color: ${data.status === 'cheated' ? 'red' : 'green'};">${data.status === 'cheated' ? 'تم إلغاؤه (غش)' : 'تم الانتهاء'}</td></tr>
                <tr><td style="padding: 15px; border: 1px solid #ccc; background: #f9f9f9;">التاريخ</td><td style="padding: 15px; border: 1px solid #ccc;">${date}</td></tr>
            </table>
            <div style="margin-top: 50px; text-align: left;">
                <p style="font-size: 16px;">يعتمد، معلم المادة</p>
                <h3 style="font-weight: bold; margin-top: 10px;">أ / محمد النحاس</h3>
            </div>
          </div>`;
    } 
    // 2. شهادة التفوق (أسود وذهبي - ناجح)
    else if (percentage >= 85) {
        element.innerHTML = `
          <div style="width: 297mm; height: 210mm; padding: 0; margin: 0; background-color: #0F0F0F; color: #D4AF37; font-family: 'Cairo', sans-serif; position: relative; text-align: center; border: 20px solid #D4AF37; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center;">
              <!-- زخرفة الخلفية -->
              <div style="position: absolute; top: 10px; left: 10px; right: 10px; bottom: 10px; border: 5px solid #fff; opacity: 0.1; pointer-events: none;"></div>
              
              <div style="position: relative; z-index: 10;">
                  <h1 style="font-size: 64px; margin: 0; text-shadow: 2px 2px 4px #000; letter-spacing: 2px; font-weight: 900;">شهادة تقدير وتفوق</h1>
                  <p style="font-size: 24px; color: #fff; margin-top: 20px; letter-spacing: 1px;">تتشرف منصة النحاس التعليمية للغة العربية بأن تمنح</p>
                  
                  <h2 style="font-size: 72px; margin: 40px 0; color: #fff; font-family: 'Reem Kufi', sans-serif; text-shadow: 0 0 10px #D4AF37;">${data.studentName}</h2>
                  
                  <p style="font-size: 28px; color: #eee; line-height: 1.6; margin-bottom: 30px;">
                      وذلك لتفوقه الباهر وحصوله على درجة متميزة في الاختبار. <br/>
                      مع خالص تمنياتنا بدوام التوفيق والنجاح.
                  </p>
                  
                  <!-- مربع الدرجة -->
                  <div style="border: 4px solid #D4AF37; display: inline-block; padding: 15px 60px; border-radius: 50px; background: rgba(212, 175, 55, 0.1); box-shadow: 0 0 30px rgba(212, 175, 55, 0.2);">
                      <span style="font-size: 22px; color: #fff;">التقدير العام</span><br/>
                      <span style="font-size: 56px; font-weight: 900; text-shadow: 2px 2px 4px #000;">%${percentage}</span>
                  </div>

                  <!-- التوقيع -->
                  <div style="margin-top: 80px; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 80px;">
                      <div style="text-align: right;">
                          <p style="font-size: 20px; color: #aaa; margin-bottom: 5px;">تحريراً في</p>
                          <p style="font-size: 24px; color: #fff; font-weight: bold;">${date}</p>
                      </div>
                      
                      <div style="text-align: center; font-size: 80px; color: #D4AF37;">★</div>

                      <div style="text-align: left;">
                          <p style="font-size: 20px; color: #aaa; margin-bottom: 15px;">معلم المادة</p>
                          <h3 style="font-size: 40px; font-family: 'Reem Kufi', sans-serif; margin: 0; color: #D4AF37;">أ / محمد النحاس</h3>
                          <div style="height: 4px; width: 100%; background: #D4AF37; border-radius: 2px; margin-top: 5px;"></div>
                      </div>
                  </div>
              </div>
          </div>
        `;
    } 
    // 3. تقرير مستوى (راسب)
    else {
        element.innerHTML = `
          <div style="width: 297mm; height: 210mm; padding: 40px; font-family: 'Cairo', sans-serif; direction: rtl; text-align: center; background: #fff; border: 15px solid #ef4444; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center;">
            <h1 style="color: #b91c1c; font-size: 56px; margin-bottom: 30px; font-weight: 900;">تقرير مستوى (تنبيه)</h1>
            
            <h2 style="font-size: 48px; color: #333; margin: 20px 0;">الطالب / ${data.studentName}</h2>
            
            <div style="background: #fef2f2; padding: 30px; border-radius: 20px; border: 3px solid #fecaca; margin: 40px auto; width: 70%;">
                <p style="font-size: 24px; color: #7f1d1d;">للأسف، لم تحقق المستوى المطلوب في هذا الاختبار.</p>
                <hr style="border: 0; border-top: 2px solid #eee; margin: 20px 0;">
                <p style="font-size: 20px; color: #555;">الدرجة: <strong>${data.score}</strong> من <strong>${data.total}</strong></p>
                <h3 style="font-size: 60px; color: #ef4444; margin: 15px 0; font-weight: 900;">%${percentage}</h3>
            </div>

            <div style="text-align: center; margin-top: 40px;">
                <p style="font-size: 28px; color: #4b5563; line-height: 1.6; font-weight: bold;">
                    "النجاح محتاج مجهود.. شد حيلك في اللي جاي!"
                </p>
            </div>
            
            <div style="margin-top: 80px; text-align: left; padding-left: 60px;">
                 <h3 style="font-size: 32px; color: #555;">أ / محمد النحاس</h3>
            </div>
          </div>
        `;
    }
    
    const opt = { 
        margin: 0, 
        filename: percentage >= 85 ? `شهادة_${data.studentName}.pdf` : `تقرير_${data.studentName}.pdf`, 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2, useCORS: true }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: type === 'admin' ? 'portrait' : 'landscape' } 
    };
    
    window.html2pdf().set(opt).from(element).save();
};

/**
 * =================================================================
 * 3. المكونات الرسومية الأساسية (Design System)
 * =================================================================
 */

// مكون تحميل التصميم والمكتبات الخارجية
const DesignSystemLoader = () => {
  useEffect(() => {
    // 1. تحميل Tailwind CSS
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
                  colors: { amber: { 50: '#fffbeb', 100: '#fef3c7', 600: '#d97706', 700: '#b45309' } }
                }
              }
            }
        }
      };
      document.head.appendChild(script);
    }
    
    // 2. تحميل خط Cairo و Reem Kufi
    if (!document.getElementById('cairo-font')) {
      const link = document.createElement('link');
      link.id = 'cairo-font';
      link.rel = 'stylesheet';
      link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Reem+Kufi:wght@700&display=swap";
      document.head.appendChild(link);
    }
    
    // 3. تحميل مكتبة html2pdf
    if (!document.getElementById('html2pdf-script')) {
        const script = document.createElement('script');
        script.id = 'html2pdf-script';
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        document.head.appendChild(script);
    }
  }, []);

  return (
    <style>{`
      body { font-family: 'Cairo', sans-serif; background-color: #f8fafc; direction: rtl; user-select: none; }
      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-track { background: #f1f1f1; }
      ::-webkit-scrollbar-thumb { background: #d97706; border-radius: 4px; }
      .glass-panel { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.5); }
      
      .watermark-text {
        position: absolute;
        animation: floatWatermark 20s linear infinite;
        pointer-events: none;
        z-index: 9999;
        color: rgba(0, 0, 0, 0.06);
        font-weight: 900;
        font-size: 1.5rem;
        transform: rotate(-30deg);
        white-space: nowrap;
        text-shadow: 0 0 2px rgba(255,255,255,0.5);
      }
      
      .watermark-video {
        position: absolute;
        animation: floatWatermark 15s linear infinite;
        pointer-events: none;
        z-index: 50;
        color: rgba(255, 255, 255, 0.3);
        font-weight: 900;
        font-size: 1.2rem;
        text-shadow: 0 0 5px rgba(0,0,0,0.8);
      }

      @keyframes floatWatermark {
        0% { top: 10%; left: 10%; opacity: 0.3; }
        25% { top: 60%; left: 80%; opacity: 0.5; }
        50% { top: 80%; left: 20%; opacity: 0.3; }
        75% { top: 20%; left: 40%; opacity: 0.5; }
        100% { top: 10%; left: 10%; opacity: 0.3; }
      }
      
      .live-pulse { animation: pulse-red 2s infinite; }
      @keyframes pulse-red {
        0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
      }
      .no-select { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
    `}</style>
  );
};

// خيارات الصفوف
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
  <motion.svg width="80" height="80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" whileHover={{ scale: 1.05 }} className="drop-shadow-xl cursor-pointer">
    <defs><linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#d97706" /><stop offset="100%" stopColor="#78350f" /></linearGradient></defs>
    <motion.circle cx="100" cy="100" r="90" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="20 10" opacity="0.5" animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
    <motion.path d="M160 80 V 130 A 60 60 0 0 1 40 130 V 110" stroke="url(#logoGrad)" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} />
    <motion.rect x="85" y="40" width="30" height="30" rx="4" fill="url(#logoGrad)" transform="rotate(45 100 55)" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1, type: "spring" }} />
    <motion.path d="M 160 80 L 140 60" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} />
  </motion.svg>
);

const FloatingArabicBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
    {['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج'].map((char, i) => (
      <motion.div key={i} className="absolute text-amber-600/10 font-black select-none" initial={{ x: Math.random() * 1000, y: Math.random() * 800 }} animate={{ y: [0, -50, 0], rotate: [0, 20, -20, 0], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, ease: "easeInOut" }} style={{ fontSize: `${Math.random() * 60 + 40}px`, left: `${Math.random() * 90}%`, top: `${Math.random() * 90}%` }}>{char}</motion.div>
    ))}
  </div>
);

const WisdomBox = () => {
  const [idx, setIdx] = useState(0);
  const quotes = [
    { text: "النجاح مش صدفة، النجاح عزيمة وإصرار", source: "تحفيز" }, 
    { text: "ذاكر صح، مش تذاكر كتير.. ركز يا بطل", source: "نصيحة" }, 
    { text: "حلمك يستاهل تعبك، متوقفش", source: "تحفيز" }, 
    { text: "وَمَا نَيْلُ الْمَطَالِبِ بِالتَّمَنِّي ... وَلَكِنْ تُؤْخَذُ الدُّنْيَا غِلَابَا", source: "شعر" }
  ];
  useEffect(() => { const t = setInterval(() => setIdx(i => (i+1)%quotes.length), 6000); return () => clearInterval(t); }, []);
  
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6 rounded-2xl shadow-xl mb-8 overflow-hidden z-20">
      <Quote className="absolute top-4 left-4 opacity-20 w-16 h-16" />
      <div className="relative z-10 text-center">
        <p className="text-xl font-bold mb-2">"{quotes[idx].text}"</p>
        <span className="bg-white/20 px-3 py-1 rounded text-sm">- {quotes[idx].source}</span>
      </div>
    </motion.div>
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
        <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg mb-6 relative overflow-hidden z-20">
            <div className="absolute top-0 right-0 p-4 opacity-20"><Megaphone size={40}/></div>
            <h3 className="font-bold flex items-center gap-2 mb-2 relative z-10"><Megaphone size={18}/> تنبيهات هامة</h3>
            <div className="relative z-10 space-y-1">
                {announcements.map((a, i) => (
                    <p key={i} className="text-sm border-b border-blue-400/30 last:border-0 pb-1">{a.text}</p>
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
                if(data.score) {
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-amber-600"><Trophy /> لوحة الشرف (الأوائل)</h3>
            <div className="space-y-3">
                {topStudents.length === 0 ? <p className="text-slate-400 text-sm">لسه مفيش حد امتحن..</p> : topStudents.map((s, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border-l-4 border-amber-400">
                        <div className="flex items-center gap-3">
                            <span className={`font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs ${i===0?'bg-yellow-400 text-white':i===1?'bg-gray-300':i===2?'bg-orange-300':'bg-slate-200'}`}>{i+1}</span>
                            <span className="font-bold text-slate-800">{s.name}</span>
                        </div>
                        <span className="text-sm font-bold text-amber-600">{s.score} نقطة</span>
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
  
  // الاستماع للرسائل
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

      if (lowerText.includes("ادمن") || lowerText.includes("مستر") || lowerText.includes("تواصل") || lowerText.includes("سؤال") || isContactAdminMode) {
        if (!isContactAdminMode) {
             botResponse = "اكتب رسالتك للمستر وهيتم الرد عليك هنا 👇";
             setIsContactAdminMode(true);
        } else {
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
      } 
      else if (lowerText.includes("مواعيد") || lowerText.includes("امتى")) {
        botResponse = "المواعيد بتنزل أسبوعياً على الجروب وصفحة الفيسبوك.";
      }
      else if (lowerText.includes("مكان") || lowerText.includes("عنوان")) {
        botResponse = "تقدر تعرف أماكن السنتر من خلال التواصل واتس آب.";
      }
      else {
        botResponse = "ممكن تختار:\n1. تفاصيل الحجز\n2. رقم الواتس\n3. التواصل مع الادمن";
      }

      if(botResponse) setMessages(prev => [...prev, { id: Date.now()+1, text: botResponse, sender: 'bot', createdAt: { seconds: Date.now() / 1000 } }]);
    }, 500);
  };

  const openWhatsApp = () => window.open("https://wa.me/201500076322", "_blank");
  const openFacebook = () => window.open("https://www.facebook.com/share/17aiUQWKf5/", "_blank");

  return (
    <>
      <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} className="fixed bottom-6 right-6 z-50 bg-amber-600 text-white p-4 rounded-full shadow-2xl hover:bg-amber-700 transition flex items-center gap-2" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X /> : <MessageCircle size={28} />}
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col font-['Cairo']" style={{ height: '450px' }}>
            <div className="bg-amber-600 p-4 text-white font-bold flex justify-between items-center">
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div><span>مساعد النحاس</span></div>
              <div className="flex gap-2"><Facebook size={18} onClick={openFacebook} className="cursor-pointer"/><Phone size={18} onClick={openWhatsApp} className="cursor-pointer"/></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl text-sm max-w-[85%] whitespace-pre-line ${msg.sender === 'user' ? 'bg-amber-100 text-amber-900 rounded-br-none' : 'bg-white border text-slate-700 rounded-bl-none shadow-sm'}`}>
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
              <button onClick={handleSend} className="bg-amber-600 text-white p-2 rounded-lg"><Send size={16}/></button>
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
        <div className="bg-amber-600 p-3 text-white flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            <h2 className="font-bold">بث مباشر: {session.title}</h2>
          </div>
          <button onClick={onClose} className="text-sm bg-red-700 px-3 py-1 rounded hover:bg-red-800 transition">خروج</button>
        </div>
        <div className="flex-1 bg-black relative flex items-center justify-center">
          <div className="watermark-text">{user.displayName}</div>
          {isYouTube ? (
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1`} title="Live" frameBorder="0" allowFullScreen></iframe>
          ) : (
            <div className="text-center p-8 bg-slate-800 rounded-2xl max-w-md">
              <h3 className="text-2xl font-bold text-white mb-4">اجتماع خارجي</h3>
              <a href={session.liveUrl} target="_blank" className="bg-green-600 text-white text-lg font-bold py-3 px-8 rounded-full hover:bg-green-700 flex items-center justify-center gap-2"><ExternalLink size={20}/> اضغط للانضمام</a>
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

// --- مشغل الفيديو الجديد مع الترس والـ Pop-up ---
const SecureVideoPlayer = ({ video, userName, onClose }) => {
  const videoId = getYouTubeID(video.url || video.file);
  const [showSettings, setShowSettings] = useState(false);
  const videoRef = useRef(null);
  const finalUrl = video.url || video.file;

  const changeSpeed = (rate) => {
    if(videoRef.current) videoRef.current.playbackRate = rate;
    setShowSettings(false);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-black rounded-xl overflow-hidden relative shadow-2xl border border-gray-800">
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

        <div className="aspect-video relative flex items-center justify-center bg-black">
          <div className="watermark-video">{userName} - {video.grade}</div>
          
          {videoId ? (
            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1`} title="Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
          ) : (
             <video ref={videoRef} controls controlsList="nodownload" className="w-full h-full object-contain" src={finalUrl}>المتصفح لا يدعم هذا الفيديو.</video>
          )}
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

  const flatQuestions = [];
  if (exam.questions) {
    exam.questions.forEach((block) => {
      block.subQuestions.forEach((q) => {
        flatQuestions.push({ ...q, blockText: block.text });
      });
    });
  }

  if (flatQuestions.length === 0) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">عفواً، لا توجد أسئلة.<button onClick={onClose} className="ml-4 bg-gray-200 px-4 py-2 rounded">خروج</button></div>;

  useEffect(() => {
    if (isReviewMode || isSubmitted) return;
    const handleVisibilityChange = () => { if (document.hidden) handleCheating(); };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener('contextmenu', event => event.preventDefault()); 
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener('contextmenu', event => event.preventDefault());
    };
  }, [isSubmitted, isReviewMode]);

  useEffect(() => {
    if (isReviewMode || isSubmitted) return;
    if (timeLeft > 0 && !isCheating) {
      const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      handleSubmit(true);
    }
  }, [timeLeft, isSubmitted, isCheating, isReviewMode]);

  const handleCheating = async () => {
    if(isReviewMode || isSubmitted) return;
    setIsCheating(true); 
    setIsSubmitted(true);
    await addDoc(collection(db, 'exam_results'), { examId: exam.id, studentId: user.uid, studentName: user.displayName, score: 0, status: 'cheated', submittedAt: serverTimestamp() });
    await updateDoc(doc(db, 'users', user.uid), { status: 'banned_cheating' });
  };

  const handleAnswer = (qId, optionIdx) => { 
    if(!isReviewMode && !isSubmitted) setAnswers({ ...answers, [qId]: optionIdx }); 
  };
  
  const calculateScore = () => {
    let rawScore = 0;
    flatQuestions.forEach(q => { if (answers[q.id] === q.correctIdx) rawScore++; });
    return rawScore;
  };

  const handleSubmit = async (auto = false) => {
    const totalQs = flatQuestions.length;
    if (!auto && Object.keys(answers).length < totalQs && !window.confirm("لم تجب على كل الأسئلة، هل أنت متأكد؟")) return;
    const finalScore = calculateScore();
    setScore(finalScore);
    setIsSubmitted(true);
    await addDoc(collection(db, 'exam_results'), { 
      examId: exam.id, studentId: user.uid, studentName: user.displayName, score: finalScore, total: totalQs, answers, status: 'completed', submittedAt: serverTimestamp() 
    });
  };

  const currentQObj = flatQuestions[currentQIndex];
  const hasPassage = currentQObj?.blockText && currentQObj.blockText.trim().length > 0;

  if (isCheating) return <div className="fixed inset-0 z-[60] bg-red-900 flex items-center justify-center text-white text-center font-['Cairo']"><div><AlertOctagon size={80} className="mx-auto mb-4"/><h1>تم رصد محاولة غش!</h1><p className="text-red-200 mt-2">خرجت من الامتحان. تم رصد درجتك (صفر) وحظرك.</p><button onClick={() => window.location.reload()} className="mt-4 bg-white text-red-900 px-6 py-2 rounded-full font-bold">خروج</button></div></div>;

  if (isSubmitted && !isReviewMode) {
     return (
        <div className="fixed inset-0 z-[60] bg-slate-50 overflow-y-auto p-4 font-['Cairo']" dir="rtl">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 mt-10 text-center">
                <h2 className="text-3xl font-black mb-4">تم الانتهاء من الامتحان</h2>
                <div className={`text-6xl font-black my-6 ${score >= flatQuestions.length / 2 ? 'text-green-600' : 'text-red-600'}`}>{score} / {flatQuestions.length}</div>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => generatePDF('student', {studentName: user.displayName, score, total: flatQuestions.length, status: 'completed'})} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"><Download size={18}/> الشهادة</button>
                    <button onClick={onClose} className="bg-slate-900 text-white py-3 px-8 rounded-xl font-bold">عودة للرئيسية</button>
                </div>
            </div>
        </div>
     );
  }
  
  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col font-['Cairo'] no-select" dir="rtl">
      {!isReviewMode && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-[9999]">{[...Array(6)].map((_, i) => (<div key={i} className="watermark-text" style={{ top: `${Math.random()*100}%`, left: `${Math.random()*100}%` }}>{user.displayName} - {user.email}</div>))}</div>
      )}
      
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md relative z-50">
        <div className="flex items-center gap-4">
            <h2 className="font-bold text-lg">{exam.title} {isReviewMode ? '(مراجعة الإجابات)' : ''}</h2>
            {!isReviewMode && <div className="bg-slate-700 px-4 py-1 rounded-full font-mono">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</div>}
        </div>
        {!isReviewMode ? (
            <button onClick={() => handleSubmit()} className="bg-green-600 px-6 py-2 rounded-lg font-bold">تسليم</button>
        ) : (
            <button onClick={onClose} className="bg-slate-700 px-6 py-2 rounded-lg font-bold">إغلاق</button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden relative z-50">
        <div className="w-16 md:w-24 bg-white border-l flex flex-col p-2 overflow-y-auto">
          <div className="grid grid-cols-1 gap-2">
              {flatQuestions.map((q, idx) => {
                  let statusClass = 'bg-slate-100 text-slate-600';
                  if (isReviewMode) {
                      if (answers[q.id] === q.correctIdx) statusClass = 'bg-green-100 text-green-700 border border-green-400';
                      else statusClass = 'bg-red-100 text-red-700 border border-red-400';
                  } else if (answers[q.id] !== undefined) {
                      statusClass = 'bg-blue-100 text-blue-700 border border-blue-400';
                  }
                  return (
                    <button key={idx} onClick={() => setCurrentQIndex(idx)} className={`aspect-square rounded-lg font-bold text-sm ${currentQIndex === idx ? 'ring-2 ring-amber-500 shadow-md' : ''} ${statusClass}`}>
                        {idx + 1}
                        {flagged[q.id] && !isReviewMode && <div className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full"></div>}
                    </button>
                  )
              })}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${hasPassage ? 'md:flex-row' : 'items-center'} h-full overflow-hidden bg-slate-50 w-full`}>
          {hasPassage && (
            <div className="flex-1 w-full bg-amber-50 p-8 overflow-y-auto border-l border-amber-200 shadow-inner">
              <h3 className="font-bold text-amber-800 mb-6 flex items-center gap-2 text-xl border-b border-amber-200 pb-2"><BookOpen size={24}/> اقرأ النص التالي بعناية:</h3>
              <p className="whitespace-pre-line leading-loose text-lg font-medium text-slate-800 font-serif">{currentQObj.blockText}</p>
            </div>
          )}
          
          <div className={`${hasPassage ? 'flex-1' : 'w-full max-w-4xl mx-auto'} bg-white p-8 overflow-y-auto flex flex-col shadow-sm m-4 rounded-3xl h-fit max-h-[95%] border border-slate-200`}>
            <div className="flex justify-between items-start mb-8">
              <span className="bg-slate-100 text-slate-600 px-4 py-1 rounded-full text-sm font-bold">سؤال {currentQIndex + 1}</span>
              {!isReviewMode && <button onClick={() => { setFlagged({...flagged, [currentQObj.id]: !flagged[currentQObj.id]}) }} className={`flex items-center gap-2 px-4 py-1 rounded-full text-sm font-bold transition ${flagged[currentQObj.id] ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}><Flag size={16} /> مراجعة لاحقاً</button>}
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 shadow-inner">
              <h3 className="text-2xl font-bold text-slate-900 leading-relaxed">{currentQObj.text}</h3>
            </div>

            <div className="space-y-4">
              {currentQObj.options.map((opt, idx) => {
                  let optionClass = 'border-slate-200 hover:bg-slate-50';
                  if (isReviewMode) {
                      if (idx === currentQObj.correctIdx) optionClass = 'border-green-500 bg-green-50 text-green-900'; 
                      else if (answers[currentQObj.id] === idx) optionClass = 'border-red-500 bg-red-50 text-red-900'; 
                  } else {
                      if (answers[currentQObj.id] === idx) optionClass = 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm';
                  }

                  return (
                    <div key={idx} onClick={() => handleAnswer(currentQObj.id, idx)} className={`p-5 rounded-xl border-2 cursor-pointer transition flex items-center gap-4 text-lg font-medium ${optionClass}`}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${answers[currentQObj.id] === idx || (isReviewMode && idx === currentQObj.correctIdx) ? 'border-transparent bg-current' : 'border-slate-300'}`}>
                      </div>
                      <span>{opt}</span>
                      {isReviewMode && idx === currentQObj.correctIdx && <CheckCircle className="text-green-600 mr-auto"/>}
                      {isReviewMode && answers[currentQObj.id] === idx && idx !== currentQObj.correctIdx && <XCircle className="text-red-600 mr-auto"/>}
                    </div>
                  )
              })}
            </div>

            <div className="mt-12 flex justify-between">
              <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(p => p - 1)} className="px-8 py-3 rounded-xl bg-slate-200 text-slate-600 font-bold disabled:opacity-50 hover:bg-slate-300 transition">السابق</button>
              <button disabled={currentQIndex === flatQuestions.length - 1} onClick={() => setCurrentQIndex(p => p + 1)} className="px-8 py-3 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-50 hover:bg-slate-800 transition">التالي</button>
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
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsersList, setActiveUsersList] = useState([]);
  const [contentList, setContentList] = useState([]);
  const [messagesList, setMessagesList] = useState([]); 
  const [newContent, setNewContent] = useState({ title: '', url: '', type: 'video', isPublic: false, grade: '3sec' });
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
  const [notifData, setNotifData] = useState({ text: '', grade: 'all' });

  useEffect(() => { const u = onSnapshot(query(collection(db, 'users'), where('status','==','pending')), s => setPendingUsers(s.docs.map(d=>({id:d.id,...d.data()})))); return u; }, []);
  useEffect(() => { const u = onSnapshot(query(collection(db, 'users'), where('status', 'in', ['active', 'banned_cheating', 'rejected'])), s => setActiveUsersList(s.docs.map(d=>({id:d.id,...d.data()})))); return u; }, []);
  useEffect(() => { const u = onSnapshot(query(collection(db, 'content'), orderBy('createdAt','desc')), s => setContentList(s.docs.map(d=>({id:d.id,...d.data()})))); return u; }, []);
  useEffect(() => { const u = onSnapshot(query(collection(db, 'messages'), orderBy('createdAt','desc')), s => setMessagesList(s.docs.map(d=>({id:d.id,...d.data()})))); return u; }, []);
  useEffect(() => { const u = onSnapshot(query(collection(db, 'live_sessions'), where('status', '==', 'active')), s => setIsLive(!s.empty)); return u; }, []);
  useEffect(() => { const u = onSnapshot(query(collection(db, 'exams'), orderBy('createdAt', 'desc')), s => setExamsList(s.docs.map(d=>({id:d.id,...d.data()})))); return u; }, []);
  useEffect(() => { const u = onSnapshot(query(collection(db, 'exam_results'), orderBy('submittedAt', 'desc')), s => setExamResults(s.docs.map(d=>({id:d.id,...d.data()})))); return u; }, []);
  useEffect(() => { const u = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), s => setAnnouncements(s.docs.map(d => ({id: d.id, ...d.data()})))); return u; }, []);

  const handleApprove = async (id) => { await updateDoc(doc(db,'users',id), {status:'active'}); sendSystemNotification("مبروك! 🎉", "تم تفعيل حسابك بنجاح."); };
  const handleReject = async (id) => updateDoc(doc(db,'users',id), {status:'rejected'});
  const handleUnban = async (id) => updateDoc(doc(db,'users',id), {status:'active'});
  const handleDeleteUser = async (id) => { if(window.confirm("حذف نهائي؟")) await deleteDoc(doc(db,'users',id)); };
  const handleDeleteMessage = async (id) => { if(window.confirm("حذف الرسالة؟")) await deleteDoc(doc(db,'messages',id)); };
  const handleDeleteExam = async (id) => { if(window.confirm("حذف الامتحان؟")) await deleteDoc(doc(db, 'exams', id)); };
  const handleDeleteAnnouncement = async (id) => { if(window.confirm("حذف الإعلان؟")) await deleteDoc(doc(db, 'announcements', id)); };
  const handleDeleteResult = async (resultId) => { if(window.confirm("حذف النتيجة؟")) await deleteDoc(doc(db, 'exam_results', resultId)); };
  const handleDeleteAllResults = async () => { if(window.confirm("تحذير خطير: سيتم حذف جميع نتائج الامتحانات لكل الطلاب. هل أنت متأكد؟")) { const batch = writeBatch(db); examResults.forEach(res => { batch.delete(doc(db, 'exam_results', res.id)); }); await batch.commit(); alert("تم حذف جميع النتائج بنجاح."); } };
  const handleReplyMessage = async (msgId) => { if (!replyTexts[msgId]?.trim()) return; await updateDoc(doc(db, 'messages', msgId), { adminReply: replyTexts[msgId] }); setReplyTexts(prev => ({ ...prev, [msgId]: '' })); alert("تم إرسال الرد!"); };
  const handleAddAnnouncement = async () => { if(!newAnnouncement.trim()) return; await addDoc(collection(db, 'announcements'), { text: newAnnouncement, createdAt: serverTimestamp() }); await addDoc(collection(db, 'notifications'), { text: `تنبيه هام: ${newAnnouncement}`, grade: 'all', createdAt: serverTimestamp() }); setNewAnnouncement(""); alert("تم نشر الإعلان"); };
  const handleUpdateUser = async (e) => { e.preventDefault(); if(!editingUser) return; await updateDoc(doc(db, 'users', editingUser.id), { name: editingUser.name, phone: editingUser.phone, parentPhone: editingUser.parentPhone, grade: editingUser.grade }); setEditingUser(null); };
  const handleSendResetPassword = async (email) => { if(window.confirm(`إرسال رابط تغيير كلمة السر لـ ${email}؟`)) await sendPasswordResetEmail(auth, email); };
  
  const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
          if (file.size > 2000000) return alert("حجم الملف كبير جداً! (الحد الأقصى 2 ميجا).");
          const reader = new FileReader();
          reader.onloadend = () => { setNewContent({...newContent, url: reader.result}); };
          reader.readAsDataURL(file);
      }
  };

  const handleAddContent = async (e) => { 
      e.preventDefault(); 
      // سواء كان رابط يوتيوب أو ملف مرفوع، سيتم تخزينه في `url` أو `file`
      const contentData = { ...newContent, file: newContent.url, createdAt: new Date() };
      await addDoc(collection(db, 'content'), contentData);
      await addDoc(collection(db, 'notifications'), { text: `تم إضافة درس جديد: ${newContent.title}`, grade: newContent.grade, createdAt: serverTimestamp() });
      alert("تم النشر!"); 
  }; 
  
  const handleDeleteContent = async (id) => { if(window.confirm("حذف هذا المحتوى؟")) await deleteDoc(doc(db, 'content', id)); };

  const startLiveStream = async () => { if(!liveData.liveUrl) return alert("الرابط؟"); await addDoc(collection(db, 'live_sessions'), { ...liveData, status: 'active', createdAt: serverTimestamp() }); await addDoc(collection(db, 'notifications'), { text: `🔴 بث مباشر الآن: ${liveData.title}`, grade: liveData.grade, createdAt: serverTimestamp() }); alert("بدا البث!"); };
  const stopLiveStream = async () => { if(window.confirm("إنهاء البث؟")) { const q = query(collection(db, 'live_sessions'), where('status', '==', 'active')); const snap = await getDocs(q); snap.forEach(async (d) => await updateDoc(doc(db, 'live_sessions', d.id), { status: 'ended' })); alert("تم الإنهاء"); } };

  const parseExam = async () => {
    if (!bulkText.trim()) return alert("أدخل نص الامتحان");
    if (!examBuilder.accessCode) return alert("أدخل كود للامتحان");
    if (!examBuilder.startTime || !examBuilder.endTime) return alert("يرجى تحديد وقت البدء والانتهاء");

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

    const finalBlocks = blocks.filter(b => b.subQuestions.length > 0);
    if (finalBlocks.length === 0) return alert("لم يتم التعرف على أسئلة.");

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

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-['Cairo']" dir="rtl">
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2"><ShieldAlert className="text-amber-600"/> <h1 className="text-2xl font-black">لوحة تحكم النحاس (الأدمن)</h1></div>
        <button onClick={() => signOut(auth)} className="text-red-500 font-bold px-4 py-2 flex gap-2"><LogOut /> خروج</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm h-fit space-y-2">
          {['users', 'all_users', 'exams', 'results', 'live', 'content', 'messages', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-right p-3 rounded-lg font-bold flex gap-2 ${activeTab===tab?'bg-amber-100 text-amber-700':'hover:bg-slate-50'}`}>
              {tab === 'users' ? 'الطلبات' : tab === 'all_users' ? 'الطلاب' : tab === 'exams' ? 'الامتحانات' : tab === 'results' ? 'النتائج' : tab === 'live' ? 'البث' : tab === 'content' ? 'المحتوى' : tab === 'messages' ? 'الرسائل' : 'الإعدادات'}
            </button>
          ))}
        </div>

        <div className="md:col-span-3">
          {activeTab === 'users' && <div className="bg-white p-6 rounded-xl shadow-sm"><h2 className="font-bold mb-4">طلبات الانضمام</h2>{pendingUsers.map(u=><div key={u.id} className="border p-4 mb-2 rounded-lg flex justify-between bg-slate-50"><div><p className="font-bold">{u.name}</p><p className="text-sm">{u.grade}</p></div><div className="flex gap-2"><button onClick={()=>handleApprove(u.id)} className="bg-green-600 text-white px-3 py-1 rounded"><Check/></button><button onClick={()=>handleReject(u.id)} className="bg-red-600 text-white px-3 py-1 rounded"><X/></button></div></div>)}</div>}

          {activeTab === 'all_users' && <div className="bg-white p-6 rounded-xl shadow-sm"><h2 className="font-bold mb-4">قائمة الطلاب</h2>{editingUser&&<form onSubmit={handleUpdateUser} className="mb-4 bg-amber-50 p-4 rounded grid gap-2"><input className="border p-2" value={editingUser.name} onChange={e=>setEditingUser({...editingUser, name:e.target.value})}/><button className="bg-green-600 text-white px-4 py-1 rounded">حفظ</button></form>}{activeUsersList.map(u=><div key={u.id} className={`border p-4 mb-2 rounded-lg flex justify-between items-center ${u.status==='banned_cheating'?'bg-red-50 border-red-200':''}`}><div><p className="font-bold">{u.name} {u.status==='banned_cheating'&&<span className="text-red-600 text-xs">(محظور)</span>}</p><p className="text-xs text-slate-500">{u.email}</p></div><div className="flex gap-2">{u.status==='banned_cheating'?<button onClick={()=>handleUnban(u.id)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold flex gap-1"><Unlock size={16}/>فك</button>:<button onClick={()=>setEditingUser(u)} className="bg-blue-100 text-blue-600 p-2 rounded"><Edit size={16}/></button>}<button onClick={()=>handleSendResetPassword(u.email)} className="bg-amber-100 text-amber-600 p-2 rounded"><KeyRound size={16}/></button><button onClick={()=>handleDeleteUser(u.id)} className="bg-red-100 text-red-600 p-2 rounded"><Trash2 size={16}/></button></div></div>)}</div>}

          {activeTab === 'exams' && <div className="space-y-8"><div className="bg-white p-6 rounded-xl shadow-sm"><h2 className="text-xl font-bold mb-6 border-b pb-2">إنشاء امتحان</h2><div className="grid grid-cols-4 gap-4 mb-6"><input className="border p-2 rounded col-span-2" placeholder="العنوان" value={examBuilder.title} onChange={e=>setExamBuilder({...examBuilder, title:e.target.value})}/><input className="border p-2 rounded" placeholder="الكود" value={examBuilder.accessCode} onChange={e=>setExamBuilder({...examBuilder, accessCode:e.target.value})}/><input type="number" className="border p-2 rounded" placeholder="المدة (دقائق)" value={examBuilder.duration} onChange={e=>setExamBuilder({...examBuilder, duration:parseInt(e.target.value)})}/><select className="border p-2 rounded col-span-4" value={examBuilder.grade} onChange={e=>setExamBuilder({...examBuilder, grade:e.target.value})}><GradeOptions/></select><div className="col-span-2"><label className="block text-xs font-bold mb-1">وقت البدء</label><input type="datetime-local" className="border p-2 rounded w-full" onChange={e=>setExamBuilder({...examBuilder, startTime:e.target.value})}/></div><div className="col-span-2"><label className="block text-xs font-bold mb-1">وقت الانتهاء</label><input type="datetime-local" className="border p-2 rounded w-full" onChange={e=>setExamBuilder({...examBuilder, endTime:e.target.value})}/></div></div><div className="bg-slate-50 p-4 rounded-xl border mb-6"><textarea className="w-full border p-4 rounded-lg h-96 font-mono text-sm" placeholder="اكتب الأسئلة هنا..." value={bulkText} onChange={e=>setBulkText(e.target.value)}/><button onClick={parseExam} className="mt-4 w-full bg-green-600 text-white py-3 rounded-xl font-bold">نشر</button></div></div><div className="bg-white p-6 rounded-xl shadow-sm"><h3 className="font-bold mb-4">الامتحانات الحالية</h3>{examsList.map(exam=><div key={exam.id} className="flex justify-between items-center border-b py-3 last:border-0"><div><p className="font-bold">{exam.title}</p><p className="text-xs text-slate-500">من: {new Date(exam.startTime).toLocaleString('ar-EG')} | إلى: {new Date(exam.endTime).toLocaleString('ar-EG')}</p><p className="text-xs text-slate-400">كود: {exam.accessCode}</p></div><div className="flex gap-2"><button onClick={()=>handleDeleteExam(exam.id)} className="text-red-500 p-2"><Trash2 size={18}/></button></div></div>)}</div></div>}

          {activeTab === 'results' && (
             <div className="bg-white p-6 rounded-xl shadow-sm">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="font-bold flex items-center gap-2"><Layout/> نتائج الامتحانات</h2>
                 {!viewingResult && examResults.length > 0 && (
                     <button onClick={handleDeleteAllResults} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition">
                         <Trash2 size={16}/> حذف جميع النتائج
                     </button>
                 )}
               </div>
               {viewingResult ? (
                   <div className="bg-slate-50 p-4 rounded-xl border">
                       <div className="flex justify-between mb-4">
                           <button onClick={() => setViewingResult(null)} className="mb-4 text-sm text-slate-500 underline font-bold">العودة للقائمة</button>
                           <button onClick={() => generatePDF('admin', {...viewingResult, total: viewingResult.total || 0})} className="bg-blue-600 text-white px-4 py-1 rounded text-sm flex items-center gap-2"><Download size={16}/> تحميل PDF</button>
                       </div>
                       <h3 className="font-bold text-lg mb-2">إجابات الطالب: {viewingResult.studentName}</h3>
                       <div className="space-y-4 mt-4">
                           {(() => {
                               const examData = examsList.find(e => e.id === viewingResult.examId);
                               if(!examData) return <p>بيانات الامتحان محذوفة</p>;
                               const questions = getQuestionsForExam(examData);
                               return questions.map((q, idx) => (
                                   <div key={idx} className="bg-white p-4 rounded border">
                                       <p className="font-bold mb-2">{q.text}</p>
                                       <div className="grid grid-cols-2 gap-2 text-sm">
                                           {q.options.map((opt, oIdx) => {
                                               const isCorrect = oIdx === q.correctIdx;
                                               const isSelected = viewingResult.answers[q.id] === oIdx;
                                               let style = "bg-gray-50 text-gray-500";
                                               if (isCorrect) style = "bg-green-100 text-green-800 border-green-500 border font-bold";
                                               if (isSelected && !isCorrect) style = "bg-red-100 text-red-800 border-red-500 border font-bold";
                                               return <div key={oIdx} className={`p-2 rounded ${style}`}>{opt}</div>
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
                           <div key={res.id} className="flex justify-between items-center border p-3 rounded hover:bg-slate-50">
                               <div><p className="font-bold">{res.studentName}</p><p className="text-xs text-slate-500">{res.status==='cheated'?'غش 🚫':`درجة: ${res.score}/${res.total}`}</p></div>
                               <div className="flex gap-2"><button onClick={()=>setViewingResult(res)} className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs">التفاصيل</button><button onClick={()=>handleDeleteResult(res.id)} className="bg-amber-100 text-amber-600 px-3 py-1 rounded text-xs">إعادة</button></div>
                           </div>
                       ))}
                   </div>
               )}
             </div>
          )}

          {activeTab === 'live' && <div className="bg-white p-8 rounded-xl shadow-sm border-t-4 border-red-600"><h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-red-600"><Radio size={32}/> البث المباشر</h2><div className="grid gap-4"><input className="border p-3 rounded-xl" placeholder="العنوان" value={liveData.title} onChange={e=>setLiveData({...liveData, title:e.target.value})}/><input className="border p-3 rounded-xl" placeholder="رابط البث (Zoom/YouTube/Meet)" value={liveData.liveUrl} onChange={e=>setLiveData({...liveData, liveUrl:e.target.value})}/><select className="border p-3 rounded-xl" value={liveData.grade} onChange={e=>setLiveData({...liveData, grade:e.target.value})}><GradeOptions/></select>{!isLive?<button onClick={startLiveStream} className="bg-red-600 text-white py-4 rounded-xl font-bold">بدء البث</button>:<button onClick={stopLiveStream} className="bg-slate-800 text-white py-4 rounded-xl font-bold">إنهاء البث</button>}</div></div>}

          {activeTab === 'content' && <div className="bg-white p-6 rounded-xl shadow-sm"><h2 className="font-bold mb-4">إضافة محتوى</h2><form onSubmit={handleAddContent} className="grid gap-4 mb-6"><input className="border p-3 rounded" placeholder="العنوان" value={newContent.title} onChange={e=>setNewContent({...newContent, title:e.target.value})}/><input className="border p-3 rounded" placeholder="الرابط (أو اختر ملف)" value={newContent.url} onChange={e=>setNewContent({...newContent, url:e.target.value})}/><input type="file" onChange={handleFileSelect} className="border p-2 rounded text-sm"/><div className="flex gap-2"><select className="border p-3 rounded flex-1" value={newContent.type} onChange={e=>setNewContent({...newContent, type:e.target.value})}><option value="video">فيديو</option><option value="file">ملف</option></select><select className="border p-3 rounded flex-1" value={newContent.grade} onChange={e=>setNewContent({...newContent, grade:e.target.value})}><GradeOptions/></select></div><div className="flex items-center gap-2"><input type="checkbox" checked={newContent.isPublic} onChange={e=>setNewContent({...newContent, isPublic:e.target.checked})}/> <label>عام</label></div><button className="bg-amber-600 text-white p-3 rounded font-bold">نشر</button></form><div className="space-y-2">{contentList.map(c=><div key={c.id} className="flex justify-between border-b p-2"><span>{c.title}</span><div className="flex gap-2"><button onClick={() => handleDeleteContent(c.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button></div></div>)}</div></div>}

          {activeTab === 'messages' && <div className="bg-white p-6 rounded-xl shadow-sm"><h2 className="font-bold mb-4">الرسائل</h2>{messagesList.map(m=><div key={m.id} className="border-b p-4 bg-slate-50 mb-3 rounded-lg relative"><button onClick={()=>handleDeleteMessage(m.id)} className="absolute top-2 left-2 text-red-400"><Trash2 size={16}/></button><div className="mb-2"><p className="font-bold text-amber-800">{m.senderName} <span className="text-xs text-slate-500">({m.sender})</span></p><p className="text-sm text-slate-400">{m.createdAt?.toDate?m.createdAt.toDate().toLocaleString():'الآن'}</p></div><p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 mb-3">{m.text}</p>{m.adminReply?<div className="bg-green-50 p-3 rounded-lg border border-green-200 text-sm"><span className="font-bold text-green-700">ردك: </span>{m.adminReply}</div>:<div className="flex gap-2"><input className="flex-1 border p-2 rounded text-sm" placeholder="اكتب ردك..." value={replyTexts[m.id]||""} onChange={e=>setReplyTexts({...replyTexts,[m.id]:e.target.value})}/><button onClick={()=>handleReplyMessage(m.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm"><Reply size={14}/></button></div>}</div>)}</div>}

          {activeTab === 'settings' && (
              <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
                  <h2 className="font-bold mb-4">إدارة الموقع</h2>
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
    const unsubContent = onSnapshot(query(collection(db, 'content'), where('grade', '==', userData.grade)), s => setContent(s.docs.map(d=>({id:d.id,...d.data()}))));
    const unsubLive = onSnapshot(query(collection(db, 'live_sessions'), where('status', '==', 'active'), where('grade', '==', userData.grade)), s => setLiveSession(s.empty ? null : {id:s.docs[0].id, ...s.docs[0].data()}));
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

  if(liveSession) return <LiveSessionView session={liveSession} user={user} onClose={() => window.location.reload()} />;
  
  if (activeExam) return <ExamRunner exam={activeExam} user={user} onClose={() => setActiveExam(null)} />;
  
  if (reviewingExam) {
      const result = examResults.find(r => r.examId === reviewingExam.id);
      return <ExamRunner exam={reviewingExam} user={user} onClose={() => setReviewingExam(null)} isReviewMode={true} existingResult={result} />;
  }

  const isBanned = userData?.status === 'banned_cheating';

  if(userData?.status === 'pending') return <div className="h-screen flex items-center justify-center bg-amber-50 text-center p-4"><div className="bg-white p-8 rounded-2xl shadow-xl"><h2 className="text-2xl font-bold mb-2">طلبك قيد المراجعة ⏳</h2><button onClick={()=>signOut(auth)} className="mt-4 text-red-500 underline">خروج</button></div></div>;
  if(userData?.status === 'rejected') return <div className="h-screen flex items-center justify-center bg-red-50"><div className="text-red-600 font-bold">تم رفض طلبك</div><button onClick={()=>signOut(auth)} className="ml-4 bg-white px-4 py-1 rounded">خروج</button></div>;
  
  const videos = content.filter(c => c.type === 'video');
  const files = content.filter(c => c.type === 'file');

  const startExamWithCode = (exam) => {
    const previousResult = examResults.find(r => r.examId === exam.id);
    if (previousResult) {
        alert(`أنت امتحنت الامتحان ده قبل كده وجبت ${previousResult.score}.`);
        return;
    }

    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(exam.endTime);

    if (now < start) return alert(`الامتحان لم يبدأ بعد. موعد البدء: ${start.toLocaleString('ar-EG')}`);
    if (now > end) return alert("عفواً، انتهى وقت الامتحان.");

    const code = prompt("أدخل كود الامتحان:");
    if (code === exam.accessCode) {
        setActiveExam(exam);
    } else {
        alert("كود خاطئ!");
    }
  };

  const handleUpdateMyProfile = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, 'users', user.uid), {
        phone: editFormData.phone,
        grade: editFormData.grade
    });
    alert("تم تحديث بياناتك بنجاح!");
  };

  return (
    <div className="min-h-screen flex bg-slate-50 relative font-['Cairo']" dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} userName={userData.name} onClose={() => setPlayingVideo(null)} />}
      <FloatingArabicBackground />
      <ChatWidget user={user} />
      
      <aside className={`fixed md:relative z-30 bg-white/95 backdrop-blur h-full w-72 p-6 shadow-xl transition-transform duration-300 ${mobileMenu ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} right-0 border-l border-white flex flex-col`}>
        <div className="flex items-center gap-3 mb-10 px-2"><ModernLogo /><h1 className="text-2xl font-black text-slate-800">النحاس</h1><button onClick={() => setMobileMenu(false)} className="md:hidden mr-auto"><X /></button></div>
        <div className="space-y-2 flex-1">
          <button onClick={() => {setActiveTab('home'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition ${activeTab==='home'?'bg-amber-100 text-amber-700':'text-slate-600 hover:bg-slate-50'}`}><User/> الرئيسية</button>
          <div onClick={() => {setActiveTab('videos'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='videos'?'bg-amber-100 text-amber-700':'text-slate-600 hover:bg-slate-50'}`}><PlayCircle/> المحاضرات</div>
          <div onClick={() => {setActiveTab('files'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='files'?'bg-amber-100 text-amber-700':'text-slate-600 hover:bg-slate-50'}`}><FileText/> المذكرات</div>
          <div onClick={() => {setActiveTab('exams'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='exams'?'bg-amber-100 text-amber-700':'text-slate-600 hover:bg-slate-50'}`}><ClipboardList/> الامتحانات</div>
          <button onClick={() => {setActiveTab('settings'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition ${activeTab==='settings'?'bg-amber-100 text-amber-700':'text-slate-600 hover:bg-slate-50'}`}><Settings/> ملفي الشخصي</button>
        </div>
        <div className="mt-auto pt-6"><button onClick={() => signOut(auth)} className="flex items-center gap-3 text-red-500 font-bold hover:bg-red-50 w-full p-4 rounded-xl transition"><LogOut/> خروج</button></div>
      </aside>

      <main className="flex-1 p-4 md:p-10 relative z-10 overflow-y-auto h-screen">
        <div className="md:hidden flex justify-between items-center mb-6 bg-white/80 p-4 rounded-2xl shadow-sm"><h1 className="font-bold text-lg text-slate-800">منصة النحاس</h1><button onClick={() => setMobileMenu(true)} className="p-2 bg-slate-100 rounded-lg"><Menu /></button></div>
        
        <div className="flex justify-end mb-6 relative">
            <button onClick={() => {requestNotificationPermission(); setShowNotifications(!showNotifications); setHasNewNotif(false);}} className="relative p-2 bg-white rounded-full shadow-sm hover:bg-slate-50">
                <Bell className="text-slate-600"/>
                {hasNewNotif && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
            </button>
            {showNotifications && (
                <div className="absolute top-12 left-0 w-80 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 max-h-96 overflow-y-auto">
                    <h3 className="font-bold mb-3 text-sm text-slate-500">الإشعارات</h3>
                    {notifications.length === 0 ? <p className="text-xs text-slate-400">لا توجد إشعارات جديدة</p> : (
                        <div className="space-y-3">
                            {notifications.map((n, i) => (
                                <div key={i} className="text-sm bg-slate-50 p-2 rounded border-l-4 border-amber-500">
                                    {n.text}
                                    <div className="text-[10px] text-slate-400 mt-1">{n.createdAt?.toDate().toLocaleDateString()}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>

        {activeTab === 'home' && (<div className="space-y-8"><WisdomBox /><Announcements /><h2 className="text-3xl font-bold text-slate-800">منور يا {userData.name.split(' ')[0]} 👋 <span className="text-sm font-normal text-slate-500 bg-slate-200 px-2 py-1 rounded-full">{getGradeLabel(userData.grade)}</span></h2><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div onClick={()=>setActiveTab('videos')} className="bg-blue-600 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden cursor-pointer hover:scale-105 transition-transform"><h3 className="relative z-10 text-2xl font-bold mb-2">المحاضرات</h3><p className="relative z-10 text-4xl font-black">{videos.length}</p><PlayCircle className="absolute -bottom-6 -left-6 opacity-20 w-40 h-40"/></div><div onClick={()=>setActiveTab('files')} className="bg-amber-500 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden cursor-pointer hover:scale-105 transition-transform"><h3 className="relative z-10 text-2xl font-bold mb-2">الملفات</h3><p className="relative z-10 text-4xl font-black">{files.length}</p><FileText className="absolute -bottom-6 -left-6 opacity-20 w-40 h-40"/></div><div onClick={()=>setActiveTab('exams')} className="bg-slate-800 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden cursor-pointer hover:scale-105 transition-transform"><h3 className="relative z-10 text-2xl font-bold mb-2">الامتحانات</h3><p className="relative z-10 text-4xl font-black">{exams.length}</p><ClipboardList className="absolute -bottom-6 -left-6 opacity-20 w-40 h-40"/></div></div><Leaderboard /></div>)}
        {activeTab === 'videos' && <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{videos.map(v => (<div key={v.id} className="bg-white rounded-xl shadow-sm border overflow-hidden cursor-pointer hover:shadow-md transition" onClick={() => setPlayingVideo(v)}><div className="h-40 bg-slate-800 flex items-center justify-center relative group"><PlayCircle className="text-white w-12 h-12 opacity-80 group-hover:scale-110 transition"/><span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">{getGradeLabel(v.grade)}</span></div><div className="p-4"><h3 className="font-bold text-lg">{v.title}</h3></div></div>))}</div>}
        {activeTab === 'files' && <div className="bg-white rounded-xl shadow-sm border overflow-hidden">{files.map(f => (<div key={f.id} className="p-4 flex justify-between items-center border-b last:border-0 hover:bg-slate-50"><div className="flex items-center gap-4"><div className="bg-red-100 text-red-600 p-3 rounded-lg font-bold text-xs">PDF</div><div><h4 className="font-bold text-lg">{f.title}</h4><span className="text-xs text-slate-500">{getGradeLabel(f.grade)}</span></div></div><a href={f.url} target="_blank" className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-100">تحميل</a></div>))}</div>}
        
        {activeTab === 'exams' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isBanned ? (
                <div className="col-span-full bg-red-50 border border-red-200 p-8 rounded-3xl text-center">
                    <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-red-800 mb-2">عفواً، تم حظرك من الامتحانات</h3>
                    <p className="text-red-600">تم رصد محاولة غش سابقة. يرجى التواصل مع الإدارة لفك الحظر.</p>
                </div>
            ) : exams.map(e => {
                const prevResult = examResults.find(r => r.examId === e.id);
                return (
                  <div key={e.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                    {prevResult && <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-3 py-1 rounded-br-xl font-bold">تم الحل: {prevResult.score} درجة</div>}
                    <h3 className="text-xl font-bold mb-2">{e.title}</h3>
                    <div className="flex justify-between text-sm text-slate-500 mb-4"><span>⏳ {e.duration} دقيقة</span><span>📝 {e.questions.reduce((acc,g)=>acc+g.subQuestions.length,0)} سؤال</span></div>
                    {prevResult ? (
                        <div className="flex gap-2">
                             <button disabled className="flex-1 bg-slate-200 text-slate-500 py-3 rounded-xl font-bold cursor-not-allowed">تم الانتهاء</button>
                             <button onClick={() => setReviewingExam(e)} className="flex-1 bg-blue-100 text-blue-700 py-3 rounded-xl font-bold hover:bg-blue-200">عرض الأخطاء</button>
                             <button onClick={() => generatePDF('student', {studentName: user.displayName, score: prevResult.score, total: e.questions.reduce((acc,g)=>acc+g.subQuestions.length,0), status: prevResult.status})} className="flex-1 bg-green-100 text-green-700 py-3 rounded-xl font-bold hover:bg-green-200 flex items-center justify-center gap-1"><Download size={16}/> شهادة</button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs text-slate-500">يبدأ: {new Date(e.startTime).toLocaleString('ar-EG')}</p>
                            <button onClick={() => startExamWithCode(e)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 flex items-center justify-center gap-2"><Lock size={16}/> ابدأ الامتحان</button>
                        </div>
                    )}
                  </div>
                )
            })}
          </div>
        )}

        {activeTab === 'settings' && (
             <div className="bg-white p-8 rounded-xl shadow-sm max-w-2xl mx-auto">
               <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Settings className="text-slate-700"/> إعدادات الحساب</h2>
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
                   <label className="block text-sm font-bold text-slate-700 mb-2">الصف الدراسي (يمكنك تغييره عند النجاح)</label>
                   <select className="w-full border p-3 rounded-xl bg-white" value={editFormData.grade} onChange={e=>setEditFormData({...editFormData, grade:e.target.value})}>
                     <GradeOptions />
                   </select>
                 </div>
                 <button className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition">حفظ التعديلات</button>
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
  const [playingVideo, setPlayingVideo] = useState(null); // حالة لتشغيل الفيديو العام في النافذة
  
  useEffect(() => { const u = onSnapshot(query(collection(db, 'content'), where('isPublic', '==', true)), s => setPublicContent(s.docs.map(d=>d.data()))); return u; }, []);
  const openFacebook = () => window.open("https://www.facebook.com/share/17aiUQWKf5/", "_blank");

  return (
    <div className="min-h-screen font-['Cairo'] relative" dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} userName="زائر" onClose={() => setPlayingVideo(null)} />}
      <FloatingArabicBackground />
      <ChatWidget />
      <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2"><ModernLogo /><span className="text-2xl font-black text-slate-900">منصة النحاس</span></div>
        <div className="flex gap-4 items-center">
          <button onClick={openFacebook} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"><Facebook size={20}/></button>
          <button onClick={onAuthClick} className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold shadow hover:bg-slate-50 transition border">دخول الطالب</button>
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
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-green-700"><UploadCloud /> ملفات للجميع</h3>
            <div className="space-y-4">
              {publicContent.filter(c => c.type === 'file').length > 0 ? publicContent.filter(c => c.type === 'file').map((f, i) => (
                 <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm"><FileText className="text-red-500"/><span className="font-bold">{f.title}</span><a href={f.url} target="_blank" className="mr-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded">تحميل</a></div>
               )) : <p className="text-slate-500">مفيش ملفات عامة حالياً</p>}
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
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative z-10 my-10 overflow-y-auto max-h-[90vh]">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-sm mb-6 flex items-center gap-1 font-bold"><ChevronRight size={18} /> العودة</button>
        <div className="flex justify-center mb-4"><ModernLogo /></div>
        <h2 className="text-3xl font-black text-slate-800 mb-2 text-center">{isRegister ? 'حساب جديد' : 'تسجيل دخول'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
          {isRegister && (
            <>
              <div className="relative"><User className="absolute top-3.5 right-4 text-slate-400" size={20} /><input required type="text" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50" placeholder="الاسم ثلاثي" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="relative"><Phone className="absolute top-3.5 right-4 text-slate-400" size={20} /><input required type="tel" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50" placeholder="رقم هاتفك" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="relative"><Phone className="absolute top-3.5 right-4 text-slate-400" size={20} /><input required type="tel" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50" placeholder="رقم ولي الأمر" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} /></div>
              <div className="relative"><GraduationCap className="absolute top-3.5 right-4 text-slate-400" size={20} />
                <select className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 appearance-none" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                  <GradeOptions />
                </select>
              </div>
            </>
          )}
          <div className="relative"><Mail className="absolute top-3.5 right-4 text-slate-400" size={20} /><input required type="email" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50" placeholder="البريد" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          <div className="relative"><Lock className="absolute top-3.5 right-4 text-slate-400" size={20} /><input required type="password" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50" placeholder="كلمة السر" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
          {!isRegister && (<div className="text-left"><button type="button" onClick={handleForgotPassword} className="text-xs text-amber-600 font-bold hover:underline">نسيت كلمة السر؟</button></div>)}
          <button disabled={loading} className="bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition shadow-lg mt-2 flex justify-center">{loading ? <Loader2 className="animate-spin" /> : (isRegister ? 'تسجيل' : 'دخول')}</button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)} className="mt-6 text-amber-700 font-bold hover:underline w-full text-center block text-sm">{isRegister ? 'تسجيل الدخول' : 'حساب جديد'}</button>
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