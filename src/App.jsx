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
  Users, PenTool, Code, Sparkles, Lamp, Ban, Shield, RefreshCw, Link as LinkIcon, 
  History, Camera, QrCode, FileCheck, MousePointerClick, BarChart3, Layers,
  BrainCircuit, Headphones, DownloadCloud, PenLine, Play, Pause, SkipForward, 
  Target, AlertCircle, Crown, CreditCard, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app, auth, db;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) { 
  console.error("Firebase Initialization Error:", error); 
}

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
      new Notification(title, { body: body, icon: "https://cdn-icons-png.flaticon.com/512/3449/3449750.png", vibrate: [200, 100, 200] });
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5; audio.play().catch(e => {});
    } catch (e) { console.error("Notification Error:", e); }
  }
};

const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const getQuestionsForExam = (examData) => {
    if (!examData?.questions) return [];
    const flat = [];
    examData.questions.forEach((block) => {
        const subQuestions = Array.isArray(block?.subQuestions) ? block.subQuestions : [];
        subQuestions.forEach((q) => {
            flat.push({
                ...q,
                blockText: block?.text || '',
                branch: q?.branch || 'عام'
            });
        });
    });
    return flat;
};


const generatePDF = (type, data) => {
    if (!window.html2pdf) return alert("جاري تحميل نظام الطباعة... يرجى الانتظار ثوانٍ والمحاولة مرة أخرى.");
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
                        const branchName = q.branch || 'عام';

                        if (q.type === 'essay') {
                            const essayAnswer = data.answers?.[q.id];
                            const studentEssayText = typeof essayAnswer === 'object'
                                ? (essayAnswer?.text || (essayAnswer?.image ? 'تم رفع صورة إجابة' : 'لم يجب'))
                                : (essayAnswer || 'لم يجب');
                            const modelEssayAnswer = q.modelAnswer || 'سؤال مقالي - يحتاج مراجعة يدوية';
                            return `
                            <tr style="background-color: #eff6ff;">
                                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${i + 1}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${q.text.replace(/\|/g, '<br>')}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #0284c7;">${branchName}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${studentEssayText}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; color: #1d4ed8;">${modelEssayAnswer}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><span style="color:#1d4ed8">📝 مقالي</span></td>
                            </tr>`;
                        }

                        const studentAnsIdx = data.answers[q.id];
                        const correctAnsIdx = q.correctIdx;
                        const isCorrect = studentAnsIdx === correctAnsIdx;
                        const studentAnsText = studentAnsIdx !== undefined ? q.options?.[studentAnsIdx] || 'لم يجب' : 'لم يجب';
                        const correctAnsText = q.options?.[correctAnsIdx] || 'غير محدد';
                        return `
                        <tr style="background-color: ${isCorrect ? '#f0fdf4' : '#fef2f2'};">
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${i + 1}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${q.text.replace(/\|/g, '<br>')}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #0284c7;">${branchName}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${studentAnsText}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; color: green;">${correctAnsText}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${isCorrect ? '<span style="color:green">✔ صحيح</span>' : '<span style="color:red">✘ خطأ</span>'}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    }

    const header = `
      <div style="padding: 40px; font-family: 'Cairo', sans-serif; direction: rtl; color: #333;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #d97706; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="text-align: right;"><h1 style="margin: 0; color: #d97706; font-size: 28px;">منصة النحاس التعليمية</h1><p style="margin: 5px 0 0; color: #666;">للغة العربية - أ/ محمد النحاس</p></div>
            <div style="text-align: left;"><p style="margin: 0; font-weight: bold;">تقرير نتيجة امتحان</p><p style="margin: 5px 0 0; color: #666;">${date}</p></div>
        </div>
        <div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <table style="width: 100%; font-size: 18px; font-family: 'Cairo', sans-serif;">
                <tr><td style="padding: 10px; font-weight: bold; width: 20%;">اسم الطالب:</td><td style="padding: 10px;">${data.studentName}</td><td style="padding: 10px; font-weight: bold; width: 20%;">الامتحان:</td><td style="padding: 10px;">${data.examTitle || 'اختبار عام'}</td></tr>
                <tr><td style="padding: 10px; font-weight: bold; vertical-align: middle;">الدرجة:</td><td style="padding: 10px;"><div style="display: inline-block; border: 3px solid #d97706; border-radius: 8px; padding: 5px 20px; font-weight: bold; color: #d97706; direction: ltr; font-family: sans-serif; font-size: 20px; background: #fffbeb;">${data.score} / ${data.total}</div></td><td style="padding: 10px; font-weight: bold; vertical-align: middle;">النسبة:</td><td style="padding: 10px; font-size: 20px; font-weight: bold;">${percentage}%</td></tr>
                <tr><td style="padding: 10px; font-weight: bold;">الحالة:</td><td style="padding: 10px;" colspan="3"><span style="background: ${data.status === 'cheated' ? '#fee2e2' : '#dcfce7'}; color: ${data.status === 'cheated' ? '#991b1b' : '#166534'}; padding: 5px 15px; border-radius: 20px; font-size: 14px;">${data.status === 'cheated' ? 'تم إلغاؤه (غش)' : percentage >= 50 ? 'ناجح' : 'راسب'}</span></td></tr>
            </table>
        </div>
        ${answersTable}
        <div style="margin-top: 50px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;"><p style="font-size: 14px; color: #999;">تم استخراج هذا التقرير آلياً من منصة النحاس التعليمية</p></div>
      </div>`;
    element.innerHTML = header;
    const opt = { margin: 0.5, filename: `تقرير_${data.studentName}_${date}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, logging: false }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
    window.html2pdf().set(opt).from(element).save();
};

const DesignSystemLoader = () => {
  useEffect(() => {
    if (!document.getElementById('tailwind-script')) {
      const script = document.createElement('script'); script.id = 'tailwind-script'; script.src = "https://cdn.tailwindcss.com";
      script.onload = () => {
        if(window.tailwind) {
            window.tailwind.config = {
              theme: {
                extend: {
                  fontFamily: { sans: ['Cairo', 'sans-serif'], arabic: ['Aref Ruqaa', 'serif'] },
                  colors: { amber: { 50: '#fffbeb', 100: '#fef3c7', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 900: '#78350f' }, royal: { 900: '#0f172a', 800: '#1e293b' } },
                  backgroundImage: { 'arabesque': "url('https://www.transparenttextures.com/patterns/arabesque.png')" }
                }
              }
            }
        }
      };
      document.head.appendChild(script);
    }
    if (!document.getElementById('cairo-font')) {
      const link = document.createElement('link'); link.id = 'cairo-font'; link.rel = 'stylesheet'; link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Aref+Ruqaa:wght@400;700&display=swap"; document.head.appendChild(link);
    }
    if (!document.getElementById('html2pdf-script')) {
        const script = document.createElement('script'); script.id = 'html2pdf-script'; script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"; document.head.appendChild(script);
    }
  }, []);

  return (
    <style>{`
      html, body { font-family: 'Cairo', sans-serif; background-color: #f8fafc; direction: rtl; -webkit-font-smoothing: antialiased; scroll-behavior: smooth; }
      ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #f1f1f1; } ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #d97706, #b45309); border-radius: 4px; }
      .glass-panel { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.4); box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
      .glass-card { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(6px); border: 1px solid rgba(255, 255, 255, 0.4); box-shadow: 0 4px 10px rgba(0,0,0,0.05); transition: transform 0.2s ease, box-shadow 0.2s ease; will-change: transform; }
      .glass-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(217, 119, 6, 0.15); border-color: #fbbf24; }
      .text-gradient-gold { background: linear-gradient(45deg, #b45309, #d97706, #fbbf24, #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-size: 200% auto; animation: shine 3s linear infinite; }
      @keyframes shine { to { background-position: 200% center; } }
      @keyframes floatChar { 0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); } 50% { transform: translate3d(0, -30px, 0) rotate(10deg); } }
      .floating-char { animation: floatChar ease-in-out infinite; will-change: transform; }
      @keyframes pulseSlow { 0%, 100% { transform: scale3d(1, 1, 1); opacity: 0.2; } 50% { transform: scale3d(1.1, 1.1, 1); opacity: 0.4; } }
      .animate-pulse-slow { animation: pulseSlow 8s ease-in-out infinite; will-change: transform, opacity; }
      .watermark-text { position: absolute; pointer-events: none; z-index: 9999; color: rgba(0, 0, 0, 0.08); font-weight: 900; font-size: 1.5rem; transform: rotate(-30deg); white-space: nowrap; text-shadow: 0 0 2px rgba(255,255,255,0.5); }
      .watermark-video { position: absolute; pointer-events: none; z-index: 9999; color: rgba(255, 255, 255, 0.4); font-weight: 900; font-size: 1.5rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); white-space: nowrap; animation: moveWatermark 25s linear infinite; }
      @keyframes moveWatermark { 0% { top: 10%; left: 10%; transform: rotate(-5deg); } 25% { top: 80%; left: 50%; transform: rotate(5deg); } 50% { top: 30%; left: 80%; transform: rotate(-5deg); } 75% { top: 70%; left: 10%; transform: rotate(5deg); } 100% { top: 10%; left: 10%; transform: rotate(-5deg); } }
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
    const map = { '1prep': 'أولى إعدادي', '2prep': 'تانية إعدادي', '3prep': 'تالتة إعدادي', '1sec': 'أولى ثانوي', '2sec': 'تانية ثانوي', '3sec': 'تالتة ثانوي' };
    return map[g] || g;
};


const normalizeEgyptPhone = (value = '') => value.replace(/\D/g, '').slice(0, 11);

const isValidEgyptPhone = (value = '') => /^01[0125]\d{8}$/.test(normalizeEgyptPhone(value));

const validateEgyptianPhones = (studentPhone, parentPhone) => {
    const normalizedStudentPhone = normalizeEgyptPhone(studentPhone);
    const normalizedParentPhone = normalizeEgyptPhone(parentPhone);

    if (!isValidEgyptPhone(normalizedStudentPhone)) {
        return { ok: false, message: "رقم الطالب غير صحيح! يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015" };
    }

    if (!isValidEgyptPhone(normalizedParentPhone)) {
        return { ok: false, message: "رقم ولي الأمر غير صحيح! يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015" };
    }

    if (normalizedStudentPhone === normalizedParentPhone) {
        return { ok: false, message: "عفواً، لا يمكن أن يكون رقم الطالب هو نفسه رقم ولي الأمر." };
    }

    return {
        ok: true,
        normalizedStudentPhone,
        normalizedParentPhone
    };
};

const safeNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const getExamQuestionCount = (exam) => (exam?.questions || []).reduce((acc, block) => acc + (block?.subQuestions?.length || 0), 0);

const extractAllQuestions = (exam) => (exam?.questions || []).flatMap(block =>
    (block?.subQuestions || []).map(q => ({ ...q, blockText: block?.text || '', branch: q?.branch || 'عام' }))
);

const getQuestionMaxScore = (q) => safeNumber(q?.maxScore ?? q?.mark ?? q?.points, q?.type === 'essay' ? 10 : 1);

const calculateDetailedExamMetrics = (exam, answers = {}, essayGrades = {}) => {
    const questions = extractAllQuestions(exam);
    const branchStats = {};
    let totalScore = 0;
    let totalPossible = 0;
    let mcqCount = 0;
    let essayCount = 0;

    questions.forEach(q => {
        const branch = q.branch || 'عام';
        branchStats[branch] = branchStats[branch] || { earned: 0, possible: 0, answered: 0, total: 0, correct: 0, wrong: 0, essay: 0 };
        const maxScore = getQuestionMaxScore(q);
        totalPossible += maxScore;
        branchStats[branch].possible += maxScore;
        branchStats[branch].total += 1;
        const answerValue = answers[q.id];
        const answered = q.type === 'essay'
            ? !!(answerValue && ((typeof answerValue === 'string' && answerValue.trim()) || answerValue.text || answerValue.image))
            : answerValue !== undefined;
        if (answered) branchStats[branch].answered += 1;

        if (q.type === 'essay') {
            essayCount += 1;
            branchStats[branch].essay += 1;
            const gradeInfo = essayGrades[q.id] || {};
            const earned = safeNumber(gradeInfo.score, 0);
            totalScore += earned;
            branchStats[branch].earned += earned;
        } else {
            mcqCount += 1;
            const isCorrect = answerValue === q.correctIdx;
            if (isCorrect) {
                totalScore += maxScore;
                branchStats[branch].earned += maxScore;
                branchStats[branch].correct += 1;
            } else if (answered) {
                branchStats[branch].wrong += 1;
            }
        }
    });

    return {
        totalScore,
        totalPossible,
        percentage: totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0,
        branchStats,
        mcqCount,
        essayCount,
        questions
    };
};

const getPerformanceInsights = (metrics) => {
    const branches = Object.entries(metrics?.branchStats || {});
    if (branches.length === 0) return [];
    const enriched = branches.map(([branch, data]) => ({ branch, pct: data.possible > 0 ? Math.round((data.earned / data.possible) * 100) : 0, ...data })).sort((a, b) => b.pct - a.pct);
    const best = enriched[0];
    const worst = enriched[enriched.length - 1];
    const notes = [];
    if (best) notes.push(`أفضل فروعك حالياً: ${best.branch} (${best.pct}%)`);
    if (worst && worst.branch !== best?.branch) notes.push(`أكثر فرع يحتاج مراجعة: ${worst.branch} (${worst.pct}%)`);
    if ((metrics?.essayCount || 0) > 0) notes.push('تأكد من متابعة تصحيح الأسئلة المقالية بعد اعتمادها من الأدمن.');
    if ((metrics?.percentage || 0) >= 85) notes.push('أداء ممتاز جدًا، استمر على نفس المستوى.');
    else if ((metrics?.percentage || 0) >= 70) notes.push('أداؤك جيد جدًا، ركز على الفروع الأضعف لرفع النسبة.');
    else notes.push('راجع بنك الأخطاء والمراجعة الذكية قبل الامتحان التالي.');
    return notes;
};

const getReviewRecommendations = (branchStats = {}, content = []) => {
    const weakBranches = Object.entries(branchStats)
        .map(([branch, data]) => ({ branch, pct: data.possible > 0 ? Math.round((data.earned / data.possible) * 100) : 0 }))
        .filter(item => item.pct < 70)
        .sort((a, b) => a.pct - b.pct)
        .slice(0, 3);
    return weakBranches.map(item => {
        const related = content.find(c => (c.branch || '').trim() === item.branch || (c.title || '').includes(item.branch));
        return { branch: item.branch, pct: item.pct, title: related?.title || `راجع فرع ${item.branch}` };
    });
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
    const [config, setConfig] = useState({ show: true });
    useEffect(() => {
        const unsubConfig = onSnapshot(doc(db, 'settings', 'config'), (snap) => { if(snap.exists()) setConfig(snap.data()); });
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
             text: userMsg.text, sender: user ? user.email : sessionId, 
             senderName: user ? user.displayName : 'زائر (' + sessionId.substr(0,4) + ')', 
             createdAt: serverTimestamp(), read: false
           });
           setIsContactAdminMode(false);
      } 
      else {
          let matchedRule = null;
          for (const rule of autoReplies) {
              const keywords = rule.keywords.split(',').map(k => k.trim().toLowerCase());
              if (keywords.some(k => lowerText.includes(k) && k.length > 0)) { matchedRule = rule; break; }
          }
          if (matchedRule) botResponse = matchedRule.response;
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
    await addDoc(collection(db, `live_sessions/${session.id}/chat`), { text: msgInput, user: user.displayName || 'طالب', createdAt: serverTimestamp() });
    setMsgInput("");
  };

  const isYouTube = (url) => url.includes("youtube") || url.includes("youtu.be");
  const videoId = getYouTubeID(session.liveUrl);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col md:flex-row font-['Cairo']" dir="rtl">
      <div className="flex-1 flex flex-col">
        <div className="bg-gradient-to-r from-red-600 to-red-800 p-3 text-white flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></span><h2 className="font-bold">بث مباشر: {session.title}</h2></div>
          <button onClick={onClose} className="text-sm bg-black/30 hover:bg-black/50 px-3 py-1 rounded transition">العودة للمنصة</button>
        </div>
        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
          <div className="watermark-video z-50">{user?.displayName || 'طالب'}</div>
          {isYouTube ? (
            <iframe width="100%" height="100%" src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1`} title="Live" frameBorder="0" allowFullScreen style={{ WebkitTransform: 'translateZ(0)' }}></iframe>
          ) : (
            <div className="w-full h-full relative">
              <iframe width="100%" height="100%" src={session.liveUrl} title="Live Meeting" frameBorder="0" allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen" allowFullScreen className="relative z-10" style={{ WebkitTransform: 'translateZ(0)' }}></iframe>
              <a href={session.liveUrl} target="_blank" rel="noopener noreferrer" className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md border border-white/20 transition flex items-center gap-2 z-50 shadow-lg"><ExternalLink size={14}/> للموبايل (لو البث مش شغال)</a>
            </div>
          )}
        </div>
      </div>
      <div className="w-full md:w-80 bg-white border-r flex flex-col h-1/3 md:h-full">
        <div className="p-3 border-b bg-slate-50 font-bold text-slate-700">المحادثة المباشرة</div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map((m, i) => (
            <div key={i} className="text-sm bg-slate-50 p-2 rounded"><span className="font-bold text-amber-700">{m.user}: </span><span className="text-slate-800">{m.text}</span></div>
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

const SecureVideoPlayer = ({ video, user, userName, onClose, onProgress }) => {
  const videoId = getYouTubeID(video.url || video.file);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState("");
  const videoRef = useRef(null);
  const finalUrl = video.url || video.file;
  const [watchedPercent, setWatchedPercent] = useState(0);

  useEffect(() => {
      if(!user || !video.id) return;
      const q = query(collection(db, 'video_notes'), where('userId', '==', user.uid), where('videoId', '==', video.id), orderBy('timestamp', 'asc'));
      const unsub = onSnapshot(q, (snap) => { setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
      return () => unsub();
  }, [user, video.id]);

  useEffect(() => {
      if (!user || !video.id) return;
      const viewId = `${user.uid}_${video.id}`;
      const viewRef = doc(db, 'video_views', viewId);
      let timerInterval; let localSeconds = 0; let lastSyncedSeconds = 0;
      const estimatedDuration = safeNumber(video.durationSeconds, safeNumber(video.estimatedDurationMinutes, 0) * 60);

      const syncToDatabase = async (secondsToAdd, overrideSeconds = null) => {
          const watchedSeconds = overrideSeconds ?? localSeconds;
          const currentDuration = safeNumber(videoRef.current?.duration, estimatedDuration);
          const watchedPercentValue = currentDuration > 0 ? Math.min(100, Math.round((watchedSeconds / currentDuration) * 100)) : 0;
          setWatchedPercent(watchedPercentValue);
          onProgress?.(video.id, watchedPercentValue, watchedSeconds);
          try {
              await setDoc(viewRef, {
                  userId: user.uid,
                  userName: userName,
                  videoId: video.id,
                  videoTitle: video.title,
                  viewedAt: serverTimestamp(),
                  watchedSeconds: increment(secondsToAdd),
                  estimatedDuration: currentDuration,
                  watchedPercent: watchedPercentValue,
                  linkedExamId: video.linkedExamId || null,
              }, { merge: true });
          } catch (e) { console.error("Sync error:", e); }
      };
      syncToDatabase(0, 0);

      timerInterval = setInterval(() => {
          let isPlaying = true;
          if (!videoId && videoRef.current) isPlaying = !videoRef.current.paused && !videoRef.current.ended;
          if (!document.hidden && isPlaying) {
              localSeconds += 1;
              const currentDuration = safeNumber(videoRef.current?.duration, estimatedDuration);
              const currentPercent = currentDuration > 0 ? Math.min(100, Math.round((localSeconds / currentDuration) * 100)) : 0;
              setWatchedPercent(currentPercent);
              onProgress?.(video.id, currentPercent, localSeconds);
              if (localSeconds - lastSyncedSeconds >= 10) { syncToDatabase(localSeconds - lastSyncedSeconds); lastSyncedSeconds = localSeconds; }
          }
      }, 1000);
      return () => { clearInterval(timerInterval); const remaining = localSeconds - lastSyncedSeconds; if (remaining > 0) syncToDatabase(remaining); };
  }, [user, video.id, video.title, userName, videoId, video.durationSeconds, video.estimatedDurationMinutes, video.linkedExamId, onProgress]);

  const changeSpeed = (rate) => { if(videoRef.current) videoRef.current.playbackRate = rate; setShowSettings(false); };

  const handleAddNote = async (e) => {
      e.preventDefault();
      if(!currentNote.trim()) return;
      let currentTime = 0;
      if (videoRef.current) currentTime = videoRef.current.currentTime;
      await addDoc(collection(db, 'video_notes'), { userId: user.uid, videoId: video.id, text: currentNote, timestamp: currentTime, createdAt: serverTimestamp() });
      setCurrentNote("");
  };

  const handleJumpToTime = (time) => {
      if(videoRef.current) { videoRef.current.currentTime = time; videoRef.current.play(); } else if(videoId) { alert("عفواً، ميزة القفز للوقت المحدد تعمل مع الفيديوهات المرفوعة على المنصة فقط وليس يوتيوب."); }
  };

  const deleteNote = async (noteId) => { if(window.confirm("حذف هذه الملاحظة؟")) await deleteDoc(doc(db, 'video_notes', noteId)); };
  const formatMinSec = (seconds) => { const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60); return `${m}:${s.toString().padStart(2, '0')}`; };
  const youtubeEmbedUrl = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&loop=1&playlist=${videoId}&playsinline=1` : '';

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col md:flex-row items-center justify-center p-0 md:p-4 font-['Cairo']" dir="rtl">
      <AnimatePresence>
          {showNotes && (
              <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }} className="w-full md:w-80 h-1/2 md:h-full bg-white rounded-t-2xl md:rounded-l-none md:rounded-r-2xl flex flex-col shadow-2xl relative z-[70] overflow-hidden">
                  <div className="p-4 bg-blue-600 text-white font-bold flex justify-between items-center shadow-md">
                      <div className="flex items-center gap-2"><PenLine size={20}/> دفتر الملاحظات</div>
                      <button onClick={() => setShowNotes(false)} className="hover:bg-blue-700 p-1 rounded"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
                      {notes.length === 0 ? (
                          <div className="text-center text-slate-400 mt-10"><PenLine size={40} className="mx-auto mb-2 opacity-50"/><p>لم تضف أي ملاحظات بعد.</p><p className="text-xs mt-1">الملاحظات بتتربط بوقت الفيديو عشان ترجعلها بسرعة.</p></div>
                      ) : (
                          notes.map(note => (
                              <div key={note.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 group">
                                  <div className="flex justify-between items-start mb-2">
                                      <button onClick={() => handleJumpToTime(note.timestamp)} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold hover:bg-blue-200 transition flex items-center gap-1"><Play size={10} fill="currentColor"/> الدقيقة {formatMinSec(note.timestamp)}</button>
                                      <button onClick={() => deleteNote(note.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14}/></button>
                                  </div>
                                  <p className="text-sm text-slate-700 font-bold whitespace-pre-wrap">{note.text}</p>
                              </div>
                          ))
                      )}
                  </div>
                  <form onSubmit={handleAddNote} className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2">
                      <textarea className="w-full border-2 border-slate-200 rounded-xl p-2 text-sm focus:border-blue-500 outline-none transition resize-none h-20" placeholder="اكتب ملاحظتك هنا (سيتم حفظها بوقت الفيديو الحالي)..." value={currentNote} onChange={e => setCurrentNote(e.target.value)} />
                      <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl shadow-md hover:bg-blue-700 transition">إضافة الملاحظة</button>
                  </form>
              </motion.div>
          )}
      </AnimatePresence>

      <div className={`w-full h-full md:max-w-7xl bg-black ${showNotes ? 'md:rounded-l-2xl' : 'rounded-xl'} overflow-hidden relative shadow-2xl border border-gray-800 flex flex-col justify-center flex-1 transition-all duration-300`}>
        <div className="absolute top-4 right-4 z-50 flex gap-4">
            <button onClick={() => setShowNotes(!showNotes)} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold backdrop-blur-md transition shadow-lg ${showNotes ? 'bg-blue-600 text-white' : 'bg-black/50 text-white hover:bg-black/80 border border-white/20'}`}>
                <PenLine size={18}/> <span className="hidden md:inline">ملاحظاتي</span>
            </button>
            <div className="relative">
                <button onClick={() => setShowSettings(!showSettings)} className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition border border-white/20"><GearIcon size={24}/></button>
                {showSettings && (
                    <div className="absolute top-12 left-0 bg-white text-black rounded-lg shadow-xl py-2 w-40 z-50 text-sm font-bold">
                        <div className="px-4 py-2 border-b text-gray-400 text-xs">سرعة التشغيل</div>
                        {[0.5, 1, 1.25, 1.5, 2].map(rate => ( <button key={rate} onClick={() => changeSpeed(rate)} className="block w-full text-right px-4 py-2 hover:bg-gray-100">{rate}x</button> ))}
                    </div>
                )}
            </div>
            <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg"><X size={24}/></button>
            <div className="hidden md:flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full font-bold text-sm border border-white/10"><BarChart3 size={16}/> {watchedPercent}% مشاهدة</div>
        </div>

        <div className="w-full relative flex items-center justify-center bg-black overflow-hidden" style={{ height: showNotes ? '50vh' : '100%', md: { height: '100%' } }}>
          <div className="watermark-video">{userName} - {video.grade} — منصة النحاس</div>
          <div className="absolute bottom-4 right-4 z-50 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-bold border border-white/20">{watchedPercent}% مشاهدة</div>
          {videoId ? (
            <iframe className="w-full h-full" src={youtubeEmbedUrl} title="Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
          ) : (
             <video ref={videoRef} controls controlsList="nodownload" className="w-full h-full object-contain relative z-40" src={finalUrl} playsInline preload="auto" disablePictureInPicture>المتصفح لا يدعم هذا الفيديو.</video>
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
        if (isActive && timeLeft > 0) { interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000); } 
        else if (timeLeft === 0) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); audio.play();
            if (isBreak) { setIsBreak(false); setTimeLeft(25 * 60); setIsActive(false); } 
            else { setIsBreak(true); setTimeLeft(5 * 60); setIsActive(false); }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, isBreak]);

    const toggleTimer = () => {
        setIsActive(!isActive);
        if(!isActive && audioRef.current && !isBreak) { audioRef.current.play().catch(e => console.log("Audio play blocked")); } 
        else if(isActive && audioRef.current) { audioRef.current.pause(); }
    };

    const addTask = (e) => { e.preventDefault(); if(newTask.trim()) { setTasks([...tasks, { id: Date.now(), text: newTask, done: false }]); setNewTask(""); } };
    const toggleTask = (id) => { setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)); };

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
                    <div className={`text-9xl font-black font-sans my-12 drop-shadow-2xl tracking-widest ${isBreak ? 'text-green-400' : 'text-amber-400'}`}>{m}:{s}</div>
                    <div className="flex items-center gap-6">
                        <button onClick={toggleTimer} className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 ${isActive ? 'bg-red-500 text-white shadow-red-500/50' : 'bg-white text-slate-900 shadow-white/20'}`}>
                            {isActive ? <Pause size={40} fill="currentColor"/> : <Play size={40} fill="currentColor" className="ml-2"/>}
                        </button>
                        <button onClick={() => setTimeLeft(isBreak ? 5*60 : 25*60)} className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center hover:bg-slate-600 transition text-slate-300"><RefreshCw size={24}/></button>
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
            fetch(content.url).then(res => res.blob()).then(blob => { activeBlobUrl = URL.createObjectURL(blob); setIframeSrc(activeBlobUrl); }).catch(err => { console.error("Error creating blob:", err); setIframeSrc(content.url); });
        } else { setIframeSrc(content.url); }
        return () => { if (activeBlobUrl) { URL.revokeObjectURL(activeBlobUrl); } };
    }, [content.url]);
    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'PrintScreen') { alert('غير مسموح بأخذ لقطات شاشة! المحتوى محمي.'); if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText('Screenshots are disabled'); } } };
        const handleCopy = (e) => { e.preventDefault(); alert("النسخ غير مسموح!"); };
        window.addEventListener('keydown', handleKeyDown); document.addEventListener('copy', handleCopy); document.addEventListener('cut', handleCopy);
        return () => { window.removeEventListener('keydown', handleKeyDown); document.removeEventListener('copy', handleCopy); document.removeEventListener('cut', handleCopy); };
    }, []);
    return (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 select-none" onContextMenu={handleContextMenu}>
            <div className="w-full h-full max-w-7xl bg-white rounded-xl overflow-hidden relative shadow-2xl border border-gray-800 flex flex-col">
                <div className="bg-slate-900 p-3 flex justify-between items-center text-white border-b border-gray-700 select-none">
                   <div className="flex items-center gap-4">
                       <h3 className="font-bold flex items-center gap-2"><Code /> {content.title}</h3>
                       <span className="hidden md:block text-xs bg-amber-600 px-3 py-1 rounded-full text-white font-bold">منصة النحاس - أ/ محمد النحاس</span>
                   </div>
                   <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded font-bold transition">خروج</button>
                </div>
                <div className="flex-1 bg-white relative overflow-hidden">
                   {user && (<div className="watermark-video" style={{ pointerEvents: 'none', zIndex: 9999 }}>{user.name} - {user.grade} — منصة النحاس — أ/ محمد النحاس</div>)}
                   <div className="absolute inset-0 z-[9998] pointer-events-none select-none"></div>
                   <iframe src={iframeSrc} className="w-full h-full border-0 relative z-40 bg-white" title={content.title} sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals" style={{ pointerEvents: 'auto', WebkitTransform: 'translateZ(0)' }}></iframe>
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
  const [antiCheatLog, setAntiCheatLog] = useState(existingResult?.antiCheatLog || []);

  const fileDialogBypassRef = useRef(false);
  const stateRefs = useRef({ isSubmitted, showSubmitConfirm, isCheating });

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
        let subQs = [...(block.subQuestions || [])];
        const hasEssay = subQs.some((q) => q.type === 'essay');
        if (!isReviewMode && !existingResult && !hasEssay) subQs = shuffleArray(subQs);

        subQs.forEach((q) => {
          flat.push({
            ...q,
            type: q.type || 'mcq',
            blockText: block.text || '',
            branch: q.branch || 'عام'
          });
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

  const mcqQuestions = useMemo(() => flatQuestions.filter(q => q.type !== 'essay'), [flatQuestions]);
  const essayQuestions = useMemo(() => flatQuestions.filter(q => q.type === 'essay'), [flatQuestions]);

  useEffect(() => {
    if (isSubmitted) setCurrentQIndex(0);
  }, [activeBranchTab, isSubmitted]);

  useEffect(() => {
    stateRefs.current = { isSubmitted, showSubmitConfirm, isCheating };
  }, [isSubmitted, showSubmitConfirm, isCheating]);

  useEffect(() => {
    if (isReviewMode) return;

    const updatePositions = () => {
      const newPos = [...Array(6)].map(() => ({
        top: Math.floor(Math.random() * 90) + '%',
        left: Math.floor(Math.random() * 90) + '%'
      }));
      setWmPositions(newPos);
    };

    updatePositions();
    const interval = setInterval(updatePositions, 6000);
    return () => clearInterval(interval);
  }, [isReviewMode]);

  useEffect(() => {
    const restoreBypass = () => {
      setTimeout(() => {
        fileDialogBypassRef.current = false;
      }, 1200);
    };

    window.addEventListener('focus', restoreBypass);
    return () => window.removeEventListener('focus', restoreBypass);
  }, []);

  const handleCheatingRef = useRef();
  handleCheatingRef.current = async () => {
    const { isSubmitted, isCheating } = stateRefs.current;
    if (fileDialogBypassRef.current || isReviewMode || isSubmitted || isCheating) return;

    setIsCheating(true);
    setIsSubmitted(true);
    setActiveView('dashboard');

    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    if (exam.attemptId) {
      await setDoc(doc(db, 'exam_results', exam.attemptId), {
        examId: exam.id,
        studentId: user.uid,
        studentName: user.displayName,
        score: 0,
        total: mcqQuestions.length,
        status: 'cheated',
        timeTaken,
        totalTime: exam.duration,
        submittedAt: serverTimestamp()
      });
    }

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

    const handleAntiCheat = () => {
      const { showSubmitConfirm, isSubmitted } = stateRefs.current;
      if (fileDialogBypassRef.current) return;
      if (!showSubmitConfirm && !isSubmitted) handleCheatingRef.current();
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !fileDialogBypassRef.current) handleAntiCheat();
    };

    const blockContextMenu = (e) => e.preventDefault();

    window.addEventListener('beforeunload', handleBeforeUnload);
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
  }, [isReviewMode, mcqQuestions.length, exam.attemptId, exam.id, exam.duration, startTime, user.uid, user.displayName]);

  useEffect(() => {
    if (isReviewMode || isSubmitted) return;
    if (timeLeft > 0 && !isCheating) {
      const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      handleSubmit(true);
    }
  }, [timeLeft, isSubmitted, isCheating, isReviewMode]);

  const handleAnswer = (qId, value) => {
    if (!isReviewMode && !isSubmitted) {
      setAnswers((prev) => ({ ...prev, [qId]: value }));
    }
  };

  const handleEssayImageUpload = (qId, file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("حجم الصورة كبير. الحد الأقصى 2 ميجا.");
      fileDialogBypassRef.current = false;
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const previousAnswer = answers[qId];
      const currentText = typeof previousAnswer === 'object' ? previousAnswer?.text || '' : '';
      handleAnswer(qId, { text: currentText, image: reader.result, fileName: file.name });
      fileDialogBypassRef.current = false;
    };
    reader.onerror = () => {
      alert("حدث خطأ أثناء قراءة الصورة.");
      fileDialogBypassRef.current = false;
    };
    reader.readAsDataURL(file);
  };

  const calculateScore = () => {
    let rawScore = 0;
    mcqQuestions.forEach((q) => {
      if (answers[q.id] === q.correctIdx) rawScore++;
    });
    return rawScore;
  };

  const confirmSubmit = () => setShowSubmitConfirm(true);

  const handleSubmit = async (auto = false) => {
    setShowSubmitConfirm(false);
    const finalScore = calculateScore();
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    setScore(finalScore);
    setIsSubmitted(true);
    setActiveView('dashboard');

    const batch = writeBatch(db);

    mcqQuestions.forEach((q) => {
      const studentAns = answers[q.id];
      const isAnswered = studentAns !== undefined;
      const isCorrect = studentAns === q.correctIdx;

      if (isAnswered && !isCorrect) {
        const mistakeRef = doc(collection(db, 'student_mistakes'));
        batch.set(mistakeRef, {
          userId: user.uid,
          examTitle: exam.title,
          question: {
            ...q,
            studentAnswerText: q.options?.[studentAns],
            correctAnswerText: q.options?.[q.correctIdx]
          },
          timestamp: serverTimestamp()
        });
      }
    });

    if (exam.attemptId && exam.id !== 'custom_mistakes_exam') {
      const attemptRef = doc(db, 'exam_results', exam.attemptId);
      batch.set(attemptRef, {
        examId: exam.id,
        studentId: user.uid,
        studentName: user.displayName,
        score: finalScore,
        mcqScore: finalScore,
        total: mcqQuestions.length,
        answers,
        status: 'completed',
        timeTaken,
        totalTime: exam.duration,
        hasEssay: essayQuestions.length > 0,
        submittedAt: serverTimestamp()
      }, { merge: true });
    }

    try {
      await batch.commit();
    } catch (err) {
      console.error("Error saving results or mistakes", err);
    }
  };

  if (flatQuestions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white font-['Cairo']">
        عفواً، لا توجد أسئلة.
        <button onClick={onClose} className="ml-4 bg-gray-200 px-4 py-2 rounded">خروج</button>
      </div>
    );
  }

  const currentQObj = displayQuestions[currentQIndex];
  if (!currentQObj) return null;

  if (isCheating) {
    return (
      <div className="fixed inset-0 z-[60] bg-red-900 flex items-center justify-center text-white text-center font-['Cairo']">
        <div>
          <AlertOctagon size={80} className="mx-auto mb-4" />
          <h1>تم رصد محاولة غش!</h1>
          <p className="text-red-200 mt-2">خرجت من الامتحان. تم رصد درجتك (صفر) وحظرك من الامتحانات القادمة.</p>
          <button onClick={() => window.location.reload()} className="mt-4 bg-white text-red-900 px-6 py-2 rounded-full font-bold">العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  const totalQs = flatQuestions.length;
  const solvedQs = flatQuestions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== '' && answers[q.id] !== null).length;
  const unsolvedQs = totalQs - solvedQs;
  const correctQs = score;
  const wrongQs = mcqQuestions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== q.correctIdx).length;
  const percentage = mcqQuestions.length > 0 ? Math.round((score / mcqQuestions.length) * 100) : 0;
  const essayAnswered = essayQuestions.filter((q) => {
    const val = answers[q.id];
    if (typeof val === 'object') return !!(val?.text?.trim() || val?.image);
    return !!val;
  }).length;

  const branchStats = {};
  flatQuestions.forEach((q) => {
    const b = q.branch;
    if (!branchStats[b]) branchStats[b] = { total: 0, solved: 0, correct: 0, wrong: 0, unsolved: 0, essay: 0 };
    branchStats[b].total++;
    const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '' && answers[q.id] !== null;
    if (isAnswered) branchStats[b].solved++;
    else branchStats[b].unsolved++;

    if (q.type === 'essay') {
      branchStats[b].essay++;
    } else if (answers[q.id] === q.correctIdx) {
      branchStats[b].correct++;
    } else if (answers[q.id] !== undefined) {
      branchStats[b].wrong++;
    }
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
                  <button
                    onClick={() => generatePDF('student', { studentName: user.displayName, score, total: mcqQuestions.length, status: 'completed', examTitle: exam.title, questions: flatQuestions, answers })}
                    className="w-12 h-12 bg-blue-600 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition"
                    title="تحميل التقرير PDF"
                  >
                    <FileText size={20} />
                  </button>
                  <button onClick={onClose} className="bg-slate-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-600 shadow-lg transition flex items-center gap-2">
                    خروج <LogOut size={18} />
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setActiveView('questions')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2">
                    استكمال الامتحان <Play size={18} />
                  </button>
                  <button onClick={confirmSubmit} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-green-700 transition flex items-center gap-2">
                    تسليم الآن <CheckCircle size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-10">
            <div className="bg-[#1e293b] p-6 rounded-2xl text-center border-t-4 border-slate-500 shadow-xl flex flex-col justify-center">
              <p className="text-slate-400 text-sm mb-3 font-bold">عدد الأسئلة</p>
              <p className="text-4xl md:text-5xl font-black text-white">{totalQs}</p>
            </div>
            <div className="bg-[#1e293b] p-6 rounded-2xl text-center border-t-4 border-slate-500 shadow-xl flex flex-col justify-center">
              <p className="text-slate-400 text-sm mb-3 font-bold">{isSubmitted ? 'النتيجة' : 'تم الحل'}</p>
              <p className="text-4xl md:text-5xl font-black text-white">{isSubmitted ? `${percentage}%` : `${solvedQs}/${totalQs}`}</p>
            </div>
            <div className="bg-[#0e7490] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
              <p className="text-cyan-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><CheckCircle size={16} /> المحلولة</p>
              <p className="text-4xl md:text-5xl font-black text-white">{solvedQs}</p>
            </div>
            <div className="bg-[#115e59] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
              <p className="text-teal-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><Check size={16} /> الصحيحة</p>
              <p className="text-4xl md:text-5xl font-black text-teal-50">{correctQs}</p>
            </div>
            <div className="bg-[#831843] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
              <p className="text-pink-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><XCircle size={16} /> الخاطئة</p>
              <p className="text-4xl md:text-5xl font-black text-pink-50">{wrongQs}</p>
            </div>
            <div className="bg-[#78350f] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
              <p className="text-amber-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><PenTool size={16} /> المقالي</p>
              <p className="text-4xl md:text-5xl font-black text-amber-50">{essayAnswered}/{essayQuestions.length}</p>
            </div>
          </div>

          {!isSubmitted && (
            <div className="mb-6 bg-blue-900/20 text-blue-300 p-4 rounded-2xl border border-blue-900/40 text-center font-bold">
              زر التسليم أصبح ظاهرًا في أعلى صفحة الأسئلة وأيضًا داخل لوحة التحكم.
            </div>
          )}

          {Object.keys(branchStats).length > 0 && (
            <div className="mb-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-2 text-teal-400"><Layers size={28} /> {isSubmitted ? 'ملخص الفروع' : 'أقسام الامتحان'}</h3>
                {(canReview || !isSubmitted) && (
                  <button onClick={() => { setActiveBranchTab('الكل'); setActiveView('questions'); }} className="text-teal-400 bg-teal-900/30 px-4 py-2 rounded-lg font-bold hover:bg-teal-900/50 transition text-sm flex items-center gap-2">
                    مراجعة الامتحان كله <ClipboardList size={16} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {Object.entries(branchStats).map(([branch, stats], idx) => {
                  const branchMcqTotal = flatQuestions.filter(q => q.branch === branch && q.type !== 'essay').length;
                  const bPercent = branchMcqTotal > 0 ? Math.round((stats.correct / branchMcqTotal) * 100) : 100;
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
                        <span className={`${isSubmitted ? 'text-teal-400' : 'text-blue-400'} text-4xl font-black`}>{bPercent}%</span>
                        <span className="text-xl font-bold text-white bg-slate-800 px-3 py-1 rounded-lg">{branch}</span>
                      </div>
                      <div className="w-full bg-[#0f172a] rounded-full h-2.5 mb-6 overflow-hidden">
                        <div className={`${isSubmitted ? 'bg-teal-400' : 'bg-blue-400'} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${bPercent}%` }} />
                      </div>
                      <div className="text-sm mt-4 bg-[#0f172a] p-3 rounded-lg text-slate-300 space-y-1">
                        <div className="flex justify-between"><span>إجمالي</span><span>{stats.total}</span></div>
                        <div className="flex justify-between"><span>صحيحة</span><span className="text-teal-300">{stats.correct}</span></div>
                        <div className="flex justify-between"><span>خاطئة</span><span className="text-pink-300">{stats.wrong}</span></div>
                        <div className="flex justify-between"><span>مقالي</span><span className="text-amber-300">{stats.essay}</span></div>
                      </div>
                      {(canReview || !isSubmitted) && (
                        <div className="mt-4 text-center text-teal-300 text-xs font-bold">
                          اضغط لمراجعة هذا الفرع فقط
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!canReview && isSubmitted && (
            <div className="mt-8 bg-amber-900/30 text-amber-400 p-6 rounded-2xl border border-amber-900 text-center font-bold text-lg flex flex-col items-center gap-3">
              <Clock size={32} />
              نموذج الإجابة والمراجعة سيظهر هنا تلقائياً بعد انتهاء وقت الامتحان للأغلبية.
            </div>
          )}

          {!isSubmitted && (
            <div className="flex justify-end mt-8 border-t border-slate-700 pt-6">
              <button onClick={confirmSubmit} className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 transition flex items-center justify-center gap-2">
                <CheckCircle size={20} /> تسليم الامتحان نهائياً
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

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
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
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
              <Layout size={16} /> العودة للنتيجة
            </button>
          )}
          <h2 className="font-bold text-lg font-sans text-amber-400 truncate hidden md:block">{exam.title} {isSubmitted ? '(مراجعة الإجابات)' : ''}</h2>
          {!isSubmitted && (
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 px-6 py-2 rounded-full font-mono shadow-inner border border-slate-700 font-bold text-amber-400 text-lg flex items-center gap-2">
                <Timer size={18} /> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
              <button onClick={confirmSubmit} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2 shadow-lg">
                <CheckCircle size={18} /> تسليم
              </button>
            </div>
          )}
        </div>

        {isSubmitted && (
          <div className="flex flex-wrap gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide items-center">
            <button
              onClick={() => setActiveBranchTab('الكل')}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-colors ${activeBranchTab === 'الكل' ? 'bg-emerald-500 text-slate-900 shadow-md' : 'bg-emerald-900/40 text-emerald-200 hover:bg-emerald-900/60'}`}
            >
              مراجعة الامتحان كله
            </button>
            {uniqueBranches.filter(branch => branch !== 'الكل').map((branch, i) => (
              <button
                key={i}
                onClick={() => setActiveBranchTab(branch)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-colors ${activeBranchTab === branch ? 'bg-amber-500 text-slate-900 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                {branch}
              </button>
            ))}
          </div>
        )}

        {!isSubmitted && (
          <button onClick={() => setActiveView('dashboard')} className="bg-slate-700 hover:bg-slate-600 px-6 py-2.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2">
            <Layout size={18} /> لوحة التحكم
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden relative z-50">
        <div className="w-16 md:w-24 bg-white border-l flex flex-col p-2 overflow-y-auto shadow-inner scrollbar-hide">
          <div className="grid grid-cols-1 gap-3">
            {displayQuestions.map((q, idx) => {
              let statusClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-transparent';
              const currentAnswer = answers[q.id];
              const isAnswered = currentAnswer !== undefined && currentAnswer !== '' && currentAnswer !== null;

              if (isSubmitted) {
                if (q.type === 'essay') {
                  statusClass = isAnswered ? 'bg-blue-100 text-blue-700 border-blue-500 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-300 border-dashed';
                } else if (answers[q.id] === q.correctIdx) {
                  statusClass = 'bg-green-100 text-green-700 border-green-500 shadow-sm';
                } else if (isAnswered) {
                  statusClass = 'bg-red-100 text-red-700 border-red-500 shadow-sm';
                } else {
                  statusClass = 'bg-slate-100 text-slate-400 border-slate-300 border-dashed';
                }
              } else if (isAnswered) {
                statusClass = q.type === 'essay' ? 'bg-purple-100 text-purple-700 border-purple-400 shadow-sm' : 'bg-blue-100 text-blue-700 border-blue-400 shadow-sm';
              }

              const originalIndex = flatQuestions.findIndex(origQ => origQ.id === q.id) + 1;
              return (
                <button key={idx} onClick={() => setCurrentQIndex(idx)} className={`aspect-square rounded-xl font-bold text-base transition-all relative ${currentQIndex === idx ? 'ring-4 ring-amber-500 ring-offset-2 scale-105 z-10' : ''} ${statusClass}`}>
                  {originalIndex}
                  {flagged[q.id] && !isSubmitted && <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-sm"></div>}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${currentQObj?.blockText && currentQObj.blockText.trim().length > 0 ? 'md:flex-row' : 'items-center'} h-full overflow-hidden bg-slate-100 w-full p-4 md:p-8 gap-6`}>
          {currentQObj?.blockText && currentQObj.blockText.trim().length > 0 && (
            <div className="flex-1 w-full bg-white p-6 md:p-10 overflow-y-auto rounded-3xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-blue-900 mb-6 flex items-center gap-2 text-xl border-b border-blue-100 pb-4 font-['Cairo']"><FileText size={24} /> نص المراجعة / القراءة:</h3>
              <p className="whitespace-pre-line leading-loose text-lg md:text-xl font-bold text-slate-700 font-['Cairo']">{currentQObj.blockText}</p>
            </div>
          )}

          <div className={`${currentQObj?.blockText && currentQObj.blockText.trim().length > 0 ? 'flex-1' : 'w-full max-w-4xl mx-auto'} bg-white p-6 md:p-10 overflow-y-auto flex flex-col shadow-xl rounded-3xl h-full border border-slate-200 relative`}>
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-3">
                <span className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md font-['Cairo']">سؤال {flatQuestions.findIndex(origQ => origQ.id === currentQObj.id) + 1}</span>
                {currentQObj.branch && currentQObj.branch !== 'عام' && (
                  <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100 flex items-center gap-2"><Layers size={16} /> {currentQObj.branch}</span>
                )}
                {currentQObj.type === 'essay' && (
                  <span className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-bold border border-purple-100 flex items-center gap-2"><PenTool size={16} /> سؤال مقالي</span>
                )}
              </div>
              {!isSubmitted && <button onClick={() => { setFlagged({ ...flagged, [currentQObj.id]: !flagged[currentQObj.id] }); }} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition shadow-sm ${flagged[currentQObj.id] ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}><Flag size={16} /> {flagged[currentQObj.id] ? 'محدد للمراجعة' : 'تحديد لمراجعته لاحقاً'}</button>}
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

            {currentQObj.type === 'essay' ? (
              <div className="space-y-4">
                {!isSubmitted ? (
                  <>
                    <textarea
                      className="w-full min-h-[180px] border-2 border-slate-200 rounded-2xl p-4 text-lg focus:border-amber-500 outline-none transition"
                      placeholder="اكتب إجابتك المقالية هنا..."
                      value={typeof answers[currentQObj.id] === 'object' ? (answers[currentQObj.id]?.text || '') : (answers[currentQObj.id] || '')}
                      onChange={(e) => {
                        const previousImage = typeof answers[currentQObj.id] === 'object' ? answers[currentQObj.id]?.image : null;
                        const previousFileName = typeof answers[currentQObj.id] === 'object' ? answers[currentQObj.id]?.fileName : null;
                        handleAnswer(currentQObj.id, { text: e.target.value, image: previousImage, fileName: previousFileName });
                      }}
                    />
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 bg-slate-50">
                      <label className="cursor-pointer flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-700 flex items-center gap-2"><UploadCloud size={18} /> أو ارفع صورة لإجابة مكتوبة يدويًا</p>
                          <p className="text-sm text-slate-500 mt-1">فتح الكاميرا/الملفات لهذا السؤال لا يُعتبر غشًا.</p>
                        </div>
                        <span className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold">اختيار صورة</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onClick={() => { fileDialogBypassRef.current = true; }}
                          onChange={(e) => handleEssayImageUpload(currentQObj.id, e.target.files?.[0])}
                        />
                      </label>
                      {typeof answers[currentQObj.id] === 'object' && answers[currentQObj.id]?.image && (
                        <div className="mt-4">
                          <img src={answers[currentQObj.id].image} alt="إجابة مقالية" className="max-h-64 rounded-xl border border-slate-200 mx-auto" />
                          <p className="text-xs text-slate-500 mt-2">{answers[currentQObj.id]?.fileName || 'تم رفع صورة'}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                      <p className="font-bold text-blue-800 mb-2">إجابتك النصية</p>
                      <p className="whitespace-pre-wrap text-slate-700">
                        {typeof answers[currentQObj.id] === 'object' ? (answers[currentQObj.id]?.text || 'لم يتم إدخال نص') : (answers[currentQObj.id] || 'لم يتم إدخال نص')}
                      </p>
                    </div>
                    {typeof answers[currentQObj.id] === 'object' && answers[currentQObj.id]?.image && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                        <p className="font-bold text-slate-800 mb-2">الصورة المرفوعة</p>
                        <img src={answers[currentQObj.id].image} alt="إجابة مقالية" className="max-h-80 rounded-xl border border-slate-200 mx-auto" />
                      </div>
                    )}
                    {currentQObj.modelAnswer && (
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                        <p className="font-bold text-green-800 mb-2">نموذج الإجابة</p>
                        <p className="whitespace-pre-wrap text-slate-700">{currentQObj.modelAnswer}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {currentQObj.options?.map((opt, idx) => {
                  let optionClass = 'border-slate-200 hover:bg-slate-50 bg-white text-slate-700';
                  const isSelected = answers[currentQObj.id] === idx;

                  if (isSubmitted) {
                    if (idx === currentQObj.correctIdx) optionClass = 'border-green-500 bg-green-50 text-green-900 shadow-md ring-2 ring-green-200';
                    else if (isSelected) optionClass = 'border-red-500 bg-red-50 text-red-900 shadow-md';
                    else optionClass = 'border-slate-200 bg-slate-50 opacity-50';
                  } else if (isSelected) {
                    optionClass = 'border-amber-500 bg-amber-50 text-amber-900 shadow-md transform scale-[1.02] ring-2 ring-amber-200';
                  }

                  return (
                    <div key={idx} onClick={() => handleAnswer(currentQObj.id, idx)} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 ${optionClass}`}>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected || (isSubmitted && idx === currentQObj.correctIdx) ? 'border-transparent bg-current' : 'border-slate-300'}`}>
                        {(isSubmitted && idx === currentQObj.correctIdx) && <Check size={16} className="text-white" />}
                        {(isSubmitted && isSelected && idx !== currentQObj.correctIdx) && <X size={16} className="text-white" />}
                      </div>
                      <span className="font-['Cairo'] text-xl font-bold leading-relaxed">{opt}</span>
                      {isSubmitted && idx === currentQObj.correctIdx && <span className="mr-auto text-green-600 bg-green-100 px-3 py-1 rounded-lg text-xs font-bold">الإجابة الصحيحة</span>}
                      {isSubmitted && isSelected && idx !== currentQObj.correctIdx && <span className="mr-auto text-red-600 bg-red-100 px-3 py-1 rounded-lg text-xs font-bold">إجابتك (خطأ)</span>}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-auto pt-10 flex justify-between">
              <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex((p) => p - 1)} className="px-8 py-4 rounded-xl bg-slate-200 text-slate-700 font-bold disabled:opacity-50 hover:bg-slate-300 transition shadow-sm font-['Cairo'] flex items-center gap-2"><ChevronRight size={20} /> السابق</button>
              <button disabled={currentQIndex === displayQuestions.length - 1} onClick={() => setCurrentQIndex((p) => p + 1)} className="px-8 py-4 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-50 hover:bg-slate-800 transition shadow-lg font-['Cairo'] flex items-center gap-2">التالي <ChevronRight size={20} className="rotate-180" /></button>
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
                headers: { 'Content-Type': 'application/json' },
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


const QuestionBankManager = ({ adminGradeFilter }) => {
  const [questions, setQuestions] = useState([]);
  const [filters, setFilters] = useState({ grade: adminGradeFilter === 'all' ? '' : adminGradeFilter, branch: '', type: '' });
  const [form, setForm] = useState({ text: '', grade: adminGradeFilter === 'all' ? '3sec' : adminGradeFilter, branch: 'النحو', type: 'mcq', difficulty: 'medium', optionsText: '', correctIdx: 0, explanation: '', mark: 1, tags: '' });
  useEffect(() => onSnapshot(query(collection(db, 'question_bank'), orderBy('createdAt', 'desc')), snap => setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })))), []);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    const options = form.type === 'mcq' ? form.optionsText.split('\n').map(o => o.trim()).filter(Boolean) : [];
    if (!form.text.trim()) return alert('اكتب نص السؤال أولاً');
    if (form.type === 'mcq' && options.length < 2) return alert('أضف اختيارين على الأقل');
    await addDoc(collection(db, 'question_bank'), {
      text: form.text.trim(), grade: form.grade, branch: form.branch, type: form.type, difficulty: form.difficulty,
      options, correctIdx: safeNumber(form.correctIdx, 0), explanation: form.explanation,
      mark: safeNumber(form.mark, form.type === 'essay' ? 10 : 1), tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), createdAt: serverTimestamp()
    });
    setForm(prev => ({ ...prev, text: '', optionsText: '', explanation: '', tags: '' }));
  };

  const createExamFromBank = async () => {
    const pool = questions.filter(q => (!filters.grade || q.grade === filters.grade) && (!filters.branch || q.branch === filters.branch) && (!filters.type || q.type === filters.type));
    if (pool.length === 0) return alert('لا توجد أسئلة مطابقة للفلاتر الحالية');
    const selected = pool.slice(0, Math.min(pool.length, 20));
    const grouped = {};
    selected.forEach(q => {
      grouped[q.branch] = grouped[q.branch] || { text: '', subQuestions: [] };
      grouped[q.branch].subQuestions.push({ id: `qb_${q.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, text: q.text, options: q.options || [], correctIdx: q.correctIdx ?? 0, branch: q.branch, type: q.type || 'mcq', explanation: q.explanation || '', maxScore: getQuestionMaxScore(q) });
    });
    await addDoc(collection(db, 'exams'), { title: `امتحان مُولَّد من بنك الأسئلة - ${getGradeLabel(filters.grade || selected[0].grade)}`, grade: filters.grade || selected[0].grade, duration: Math.max(15, selected.length * 2), startTime: new Date().toISOString().slice(0,16), endTime: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0,16), accessCode: Math.random().toString(36).slice(2, 7).toUpperCase(), isPremium: false, questions: Object.values(grouped), createdAt: serverTimestamp(), source: 'question_bank' });
    alert('تم إنشاء امتحان جديد من بنك الأسئلة بنجاح');
  };

  const visible = questions.filter(q => (!filters.grade || q.grade === filters.grade) && (!filters.branch || q.branch === filters.branch) && (!filters.type || q.type === filters.type));
  return (<div className="space-y-6"><div className="glass-panel p-4 md:p-6 rounded-xl"><h2 className="text-xl font-bold mb-4 text-indigo-700 flex items-center gap-2"><Layers/> بنك الأسئلة</h2><form onSubmit={handleAddQuestion} className="grid gap-4"><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><select className="border p-3 rounded" value={form.grade} onChange={e=>setForm({...form, grade:e.target.value})}><GradeOptions/></select><input className="border p-3 rounded" placeholder="الفرع مثل النحو أو الأدب" value={form.branch} onChange={e=>setForm({...form, branch:e.target.value})}/><select className="border p-3 rounded" value={form.type} onChange={e=>setForm({...form, type:e.target.value, mark: e.target.value === 'essay' ? 10 : 1})}><option value="mcq">اختياري</option><option value="essay">مقالي</option></select><select className="border p-3 rounded" value={form.difficulty} onChange={e=>setForm({...form, difficulty:e.target.value})}><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select></div><textarea className="border p-3 rounded h-24" placeholder="نص السؤال" value={form.text} onChange={e=>setForm({...form, text:e.target.value})}/>{form.type === 'mcq' && <textarea className="border p-3 rounded h-28 font-mono" placeholder="كل اختيار في سطر منفصل" value={form.optionsText} onChange={e=>setForm({...form, optionsText:e.target.value})}/>}<div className="grid grid-cols-1 md:grid-cols-3 gap-4">{form.type === 'mcq' && <input type="number" min="0" className="border p-3 rounded" placeholder="رقم الإجابة الصحيحة" value={form.correctIdx} onChange={e=>setForm({...form, correctIdx:e.target.value})}/>}<input type="number" min="1" className="border p-3 rounded" placeholder="درجة السؤال" value={form.mark} onChange={e=>setForm({...form, mark:e.target.value})}/><input className="border p-3 rounded" placeholder="tags مفصولة بفاصلة" value={form.tags} onChange={e=>setForm({...form, tags:e.target.value})}/></div><textarea className="border p-3 rounded h-20" placeholder="شرح الإجابة / قاعدة المراجعة الذكية" value={form.explanation} onChange={e=>setForm({...form, explanation:e.target.value})}/><div className="flex flex-col md:flex-row gap-3"><button className="bg-indigo-600 text-white py-3 px-6 rounded-xl font-bold">إضافة للسجل</button><button type="button" onClick={createExamFromBank} className="bg-emerald-600 text-white py-3 px-6 rounded-xl font-bold">توليد امتحان من الفلاتر الحالية</button></div></form></div><div className="glass-panel p-4 md:p-6 rounded-xl"><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"><select className="border p-3 rounded" value={filters.grade} onChange={e=>setFilters({...filters, grade:e.target.value})}><option value="">كل المراحل</option><GradeOptions/></select><input className="border p-3 rounded" placeholder="فلترة الفرع" value={filters.branch} onChange={e=>setFilters({...filters, branch:e.target.value})}/><select className="border p-3 rounded" value={filters.type} onChange={e=>setFilters({...filters, type:e.target.value})}><option value="">كل الأنواع</option><option value="mcq">اختياري</option><option value="essay">مقالي</option></select></div><div className="space-y-3 max-h-[500px] overflow-y-auto">{visible.map(q => <div key={q.id} className="bg-white border rounded-xl p-4"><div className="flex flex-wrap gap-2 mb-2"><span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">{getGradeLabel(q.grade)}</span><span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{q.branch}</span><span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded">{q.type === 'essay' ? 'مقالي' : 'اختياري'}</span><span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded">{getQuestionMaxScore(q)} درجة</span></div><p className="font-bold text-slate-800">{q.text}</p>{q.explanation && <p className="text-xs text-slate-500 mt-2">شرح: {q.explanation}</p>}</div>)}{visible.length === 0 && <p className="text-slate-500 text-center py-8">لا توجد أسئلة مطابقة.</p>}</div></div></div>);
};

const AssignmentsManager = ({ adminGradeFilter }) => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState({ title: '', grade: adminGradeFilter === 'all' ? '3sec' : adminGradeFilter, branch: 'التعبير', description: '', dueDate: '', totalMarks: 20, deliveryType: 'text_or_image' });
  useEffect(() => onSnapshot(query(collection(db, 'assignments'), orderBy('createdAt', 'desc')), snap => setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })))), []);
  useEffect(() => onSnapshot(query(collection(db, 'assignment_submissions'), orderBy('submittedAt', 'desc')), snap => setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })))), []);
  const createAssignment = async (e) => { e.preventDefault(); if (!form.title.trim()) return alert('اكتب عنوان الواجب'); await addDoc(collection(db, 'assignments'), { ...form, totalMarks: safeNumber(form.totalMarks, 20), createdAt: serverTimestamp(), status: 'active' }); setForm(prev => ({ ...prev, title: '', description: '' })); };
  const reviewSubmission = async (submission) => { const scoreValue = prompt('أدخل الدرجة التي حصل عليها الطالب', submission.score ?? 0); if (scoreValue === null) return; const maxValue = prompt('ومن كام؟', submission.maxScore ?? submission.totalMarks ?? 20); if (maxValue === null) return; const feedback = prompt('تعليقك على الواجب', submission.feedback || ''); await updateDoc(doc(db, 'assignment_submissions', submission.id), { score: safeNumber(scoreValue, 0), maxScore: safeNumber(maxValue, submission.totalMarks ?? 20), feedback: feedback || '', reviewStatus: 'graded', gradedAt: serverTimestamp() }); alert('تم حفظ تصحيح الواجب'); };
  return (<div className="space-y-6"><div className="glass-panel p-6 rounded-2xl"><h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2"><FileCheck/> نظام الواجبات</h2><form onSubmit={createAssignment} className="grid gap-4"><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><input className="border p-3 rounded md:col-span-2" placeholder="عنوان الواجب" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} /><select className="border p-3 rounded" value={form.grade} onChange={e=>setForm({...form, grade:e.target.value})}><GradeOptions/></select><input className="border p-3 rounded" placeholder="الفرع" value={form.branch} onChange={e=>setForm({...form, branch:e.target.value})} /></div><textarea className="border p-3 rounded h-24" placeholder="وصف الواجب والتعليمات" value={form.description} onChange={e=>setForm({...form, description:e.target.value})}></textarea><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><input type="datetime-local" className="border p-3 rounded" value={form.dueDate} onChange={e=>setForm({...form, dueDate:e.target.value})} /><input type="number" className="border p-3 rounded" value={form.totalMarks} onChange={e=>setForm({...form, totalMarks:e.target.value})} /><select className="border p-3 rounded" value={form.deliveryType} onChange={e=>setForm({...form, deliveryType:e.target.value})}><option value="text_or_image">نص أو صورة</option><option value="image_only">صورة فقط</option><option value="text_only">نص فقط</option></select></div><button className="bg-blue-600 text-white py-3 rounded-xl font-bold">نشر الواجب</button></form></div><div className="glass-panel p-6 rounded-2xl"><h3 className="font-bold mb-4 text-slate-800">التسليمات</h3><div className="space-y-3 max-h-[550px] overflow-y-auto">{submissions.map(item => <div key={item.id} className="bg-white border rounded-2xl p-4"><div className="flex flex-col md:flex-row justify-between gap-3"><div><p className="font-bold text-slate-800">{item.studentName} — {item.assignmentTitle}</p><p className="text-xs text-slate-500 mt-1">{item.branch} • {getGradeLabel(item.grade)}</p>{item.answerText && <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl mt-2 whitespace-pre-wrap">{item.answerText}</p>}{item.answerImage && <img src={item.answerImage} alt="assignment" className="w-40 h-40 object-cover rounded-xl border mt-2" />}</div><div className="flex flex-col gap-2 min-w-[180px]"><div className="text-xs bg-slate-100 px-3 py-2 rounded-xl text-center">{item.reviewStatus === 'graded' ? `تم التصحيح: ${item.score}/${item.maxScore}` : 'بانتظار التصحيح'}</div><button onClick={() => reviewSubmission(item)} className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-bold">تصحيح الواجب</button></div></div></div>)}{submissions.length === 0 && <p className="text-slate-500 text-center py-8">لا توجد تسليمات حتى الآن.</p>}</div></div></div>);
};

const PerformanceOverview = ({ examResults = [], content = [] }) => {
  const metrics = useMemo(() => {
    const completed = examResults.filter(r => r.status === 'completed');
    const avg = completed.length ? Math.round(completed.reduce((acc, item) => acc + safeNumber(item.percentage, item.total ? (item.score / item.total) * 100 : 0), 0) / completed.length) : 0;
    return { completed, avg };
  }, [examResults]);
  return (<div className="glass-panel p-6 rounded-2xl"><h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800"><BarChart3/> تحليل الأداء</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="bg-white border rounded-2xl p-4 text-center"><p className="text-slate-500 text-sm">الاختبارات المكتملة</p><p className="text-3xl font-black text-blue-600">{metrics.completed.length}</p></div><div className="bg-white border rounded-2xl p-4 text-center"><p className="text-slate-500 text-sm">متوسط الأداء</p><p className="text-3xl font-black text-emerald-600">{metrics.avg}%</p></div><div className="bg-white border rounded-2xl p-4 text-center"><p className="text-slate-500 text-sm">محتوى متاح للمراجعة</p><p className="text-3xl font-black text-amber-600">{content.length}</p></div></div></div>);
};

const StudentAssignmentsPanel = ({ assignments = [], submissions = [], user, userData }) => {
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [answerImage, setAnswerImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const uploadImage = (file) => { const reader = new FileReader(); reader.onloadend = () => setAnswerImage(reader.result); reader.readAsDataURL(file); };
  const submitAssignment = async () => { if (!selectedAssignment) return; if (!answerText.trim() && !answerImage) return alert('أضف نص الإجابة أو صورة واحدة على الأقل'); setIsSubmitting(true); const existing = submissions.find(s => s.assignmentId === selectedAssignment.id); const payload = { assignmentId: selectedAssignment.id, assignmentTitle: selectedAssignment.title, grade: selectedAssignment.grade, branch: selectedAssignment.branch, studentId: user.uid, studentName: userData.name, answerText, answerImage, reviewStatus: 'submitted', totalMarks: safeNumber(selectedAssignment.totalMarks, 20), submittedAt: serverTimestamp() }; if (existing) await updateDoc(doc(db, 'assignment_submissions', existing.id), payload); else await addDoc(collection(db, 'assignment_submissions'), payload); setIsSubmitting(false); setSelectedAssignment(null); setAnswerText(''); setAnswerImage(''); alert('تم تسليم الواجب بنجاح'); };
  return (<div className="space-y-6"><div className="glass-panel p-6 rounded-2xl"><h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2"><FileCheck/> الواجبات</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{assignments.map(item => { const sub = submissions.find(s => s.assignmentId === item.id); return <div key={item.id} className="bg-white border rounded-2xl p-4"><div className="flex flex-wrap gap-2 mb-2"><span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{item.branch}</span><span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">{getGradeLabel(item.grade)}</span></div><h3 className="font-bold text-lg text-slate-800">{item.title}</h3><p className="text-sm text-slate-500 my-2">{item.description}</p><div className="flex items-center justify-between text-xs text-slate-500"><span>الدرجة: {item.totalMarks}</span><span>{sub ? (sub.reviewStatus === 'graded' ? `تم التصحيح: ${sub.score}/${sub.maxScore}` : 'تم التسليم') : 'لم يُسلَّم بعد'}</span></div><button onClick={() => setSelectedAssignment(item)} className="mt-3 w-full bg-emerald-100 text-emerald-700 py-2 rounded-xl font-bold">{sub ? 'تعديل / عرض التسليم' : 'ابدأ الواجب'}</button></div>; })}{assignments.length === 0 && <div className="col-span-full bg-white border rounded-2xl p-8 text-center text-slate-500">لا توجد واجبات متاحة حالياً.</div>}</div></div>{selectedAssignment && <div className="glass-panel p-6 rounded-2xl"><h3 className="text-xl font-bold mb-4">تسليم واجب: {selectedAssignment.title}</h3><textarea className="w-full border rounded-xl p-3 h-32 mb-3" placeholder="اكتب إجابتك هنا" value={answerText} onChange={e=>setAnswerText(e.target.value)}></textarea><input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} className="mb-3" />{answerImage && <img src={answerImage} alt="submission" className="w-40 h-40 object-cover rounded-xl border mb-3" />}<div className="flex gap-3"><button onClick={submitAssignment} disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">{isSubmitting ? 'جارٍ الحفظ...' : 'تسليم الواجب'}</button><button onClick={() => setSelectedAssignment(null)} className="bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold">إلغاء</button></div></div>}</div>);
};

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('users'); 
  const [adminGradeFilter, setAdminGradeFilter] = useState('all'); 
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsersList, setActiveUsersList] = useState([]);
  const [contentList, setContentList] = useState([]);
  const [messagesList, setMessagesList] = useState([]); 
  const [newContent, setNewContent] = useState({ title: '', url: '', type: 'video', videoSection: 'explanation', isPublic: false, grade: '3sec', allowedEmails: '', isPremium: false, linkedExamId: '', estimatedDurationMinutes: '', branch: '' });
  const [liveData, setLiveData] = useState({ title: '', liveUrl: '', grade: '3sec', passcode: '', allowedEmails: '' });
  const [activeLiveSessions, setActiveLiveSessions] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [examBuilder, setExamBuilder] = useState({ title: '', grade: '3sec', duration: 60, startTime: '', endTime: '', questions: [], accessCode: '', isPremium: false });
  const [bulkText, setBulkText] = useState('');
  const [examsList, setExamsList] = useState([]);
  const [examResults, setExamResults] = useState([]); 
  const [viewingResult, setViewingResult] = useState(null); 
  const [essayScoreDrafts, setEssayScoreDrafts] = useState({});
  const [essayMaxDrafts, setEssayMaxDrafts] = useState({});
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

  // أكواد الاشتراك
  const [subscriptionCodes, setSubscriptionCodes] = useState([]);
  const [codeGenCount, setCodeGenCount] = useState(10);
  const [codeGenDays, setCodeGenDays] = useState(30);
  const [questionBankCount, setQuestionBankCount] = useState(0);
  const [assignmentsCount, setAssignmentsCount] = useState(0);

  // تحديث حالة زر الرجوع للموبايل للأدمن
  useEffect(() => {
      window.history.pushState({ tab: activeTab }, '');
      const handlePopState = (e) => {
          if (e.state && e.state.tab) { setActiveTab(e.state.tab); } 
          else { setActiveTab('users'); }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  useEffect(() => {
      const q = query(collection(db, 'users'), where('status','==','pending'));
      const u = onSnapshot(q, s => setPendingUsers(s.docs.map(d=>({id:d.id,...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'users'), where('status', 'in', ['active', 'banned_cheating', 'banned_all', 'banned_exam', 'banned_content', 'rejected']));
      const u = onSnapshot(q, s => setActiveUsersList(s.docs.map(d=>({id:d.id,...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'content'), orderBy('createdAt','desc'));
      const u = onSnapshot(q, s => setContentList(s.docs.map(d=>({id:d.id,...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'messages'), orderBy('createdAt','desc'));
      const u = onSnapshot(q, s => setMessagesList(s.docs.map(d=>({id:d.id,...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'live_sessions'), where('status', '==', 'active'));
      const u = onSnapshot(q, s => setActiveLiveSessions(s.docs.map(d=>({id:d.id,...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'exams'), orderBy('createdAt', 'desc'));
      const u = onSnapshot(q, s => setExamsList(s.docs.map(d=>({id:d.id,...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'exam_results'), orderBy('submittedAt', 'desc'));
      const u = onSnapshot(q, s => setExamResults(s.docs.map(d=>({id:d.id,...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const u = onSnapshot(q, s => setAnnouncements(s.docs.map(d => ({id: d.id, ...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const u = onSnapshot(collection(db, 'auto_replies'), s => setAutoReplies(s.docs.map(d => ({id: d.id, ...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const u = onSnapshot(collection(db, 'quotes'), s => setQuotesList(s.docs.map(d => ({id: d.id, ...d.data()}))));
      return u;
  }, []);
  
  useEffect(() => {
      const u = onSnapshot(collection(db, 'smart_homeworks'), s => setSmartHomeworks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'homework_results'), orderBy('submittedAt', 'desc'));
      const u = onSnapshot(q, s => setHwResults(s.docs.map(d => ({id: d.id, ...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'subscription_codes'), orderBy('createdAt', 'desc'));
      const u = onSnapshot(q, s => setSubscriptionCodes(s.docs.map(d => ({id: d.id, ...d.data()}))));
      return u;
  }, []);
  useEffect(() => onSnapshot(collection(db, 'question_bank'), snap => setQuestionBankCount(snap.size), (error) => { console.warn('Question bank counter blocked:', error?.message); setQuestionBankCount(0); }), []);
  useEffect(() => onSnapshot(collection(db, 'assignments'), snap => setAssignmentsCount(snap.size), (error) => { console.warn('Assignments counter blocked:', error?.message); setAssignmentsCount(0); }), []);

  const handleApprove = async (id) => {
    await updateDoc(doc(db,'users',id), {status:'active'});
    sendSystemNotification("مبروك! 🎉", "تم تفعيل حسابك بنجاح.");
  };

  const handleReject = async (id) => {
      await updateDoc(doc(db,'users',id), {status:'rejected'});
  };
  
  const handleChangeUserStatus = async (id, newStatus) => {
      await updateDoc(doc(db,'users',id), {status: newStatus});
  };

  const handleToggleSubscription = async (user) => {
      const isCurrentlyPremium = user.subscriptionStatus === 'premium';
      if (isCurrentlyPremium) {
          if(window.confirm("تحويل الطالب لباقة مجانية؟")) {
              await updateDoc(doc(db, 'users', user.id), { subscriptionStatus: 'free', subscriptionExpiry: null });
          }
      } else {
          const days = prompt("كم يوم تريد تفعيل الباقة لهذا الطالب؟", "30");
          if (days && !isNaN(days)) {
              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + parseInt(days));
              await updateDoc(doc(db, 'users', user.id), { subscriptionStatus: 'premium', subscriptionExpiry: expiryDate });
              alert(`تم تفعيل الطالب لمدة ${days} يوم.`);
          }
      }
  };

  const generateSubscriptionCodes = async () => {
      if(!codeGenCount || !codeGenDays) return;
      if(window.confirm(`هل أنت متأكد من توليد ${codeGenCount} كود جديد لمدة ${codeGenDays} يوم؟`)) {
          const batch = writeBatch(db);
          for(let i=0; i<codeGenCount; i++) {
              const codeString = 'NAHAS-' + Math.random().toString(36).substring(2,8).toUpperCase();
              const newDocRef = doc(collection(db, 'subscription_codes'));
              batch.set(newDocRef, {
                  code: codeString,
                  days: parseInt(codeGenDays),
                  used: false,
                  usedBy: null,
                  createdAt: serverTimestamp()
              });
          }
          await batch.commit();
          alert("تم توليد الأكواد بنجاح!");
      }
  };

  const handleDeleteCode = async (id) => {
      if(window.confirm("حذف هذا الكود؟")) await deleteDoc(doc(db, 'subscription_codes', id));
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

  const getEssayDraftKey = (resultId, questionId) => `${resultId}__${questionId}`;

  const handleSaveEssayGrade = async (resultDoc, question, questions) => {
      const draftKey = getEssayDraftKey(resultDoc.id, question.id);
      const rawScoreValue = essayScoreDrafts[draftKey] ?? resultDoc.essayScores?.[question.id] ?? '';
      const rawMaxValue = essayMaxDrafts[draftKey] ?? resultDoc.essayMaxScores?.[question.id] ?? '';

      const scoreValue = Number(rawScoreValue);
      const maxValue = Number(rawMaxValue);

      if (rawScoreValue === '' || rawMaxValue === '' || Number.isNaN(scoreValue) || Number.isNaN(maxValue)) {
          return alert("من فضلك أدخل الدرجة والدرجة النهائية لهذا السؤال.");
      }
      if (maxValue <= 0) {
          return alert("الدرجة النهائية يجب أن تكون أكبر من صفر.");
      }
      if (scoreValue < 0 || scoreValue > maxValue) {
          return alert("درجة الطالب يجب أن تكون بين صفر والدرجة النهائية.");
      }

      const nextEssayScores = { ...(resultDoc.essayScores || {}), [question.id]: scoreValue };
      const nextEssayMaxScores = { ...(resultDoc.essayMaxScores || {}), [question.id]: maxValue };

      const mcqQuestions = questions.filter((q) => q.type !== 'essay');
      const essayQuestions = questions.filter((q) => q.type === 'essay');

      const fallbackMcqScore = mcqQuestions.reduce((sum, q) => (
          resultDoc.answers?.[q.id] === q.correctIdx ? sum + 1 : sum
      ), 0);
      const mcqScore = typeof resultDoc.mcqScore === 'number' ? resultDoc.mcqScore : fallbackMcqScore;

      const essayTotal = essayQuestions.reduce((sum, q) => sum + Number(nextEssayScores[q.id] || 0), 0);
      const essayMaxTotal = essayQuestions.reduce((sum, q) => sum + Number(nextEssayMaxScores[q.id] || 0), 0);

      const reviewedEssayCount = essayQuestions.filter((q) => (
          nextEssayScores[q.id] !== undefined && nextEssayMaxScores[q.id] !== undefined
      )).length;

      const payload = {
          essayScores: nextEssayScores,
          essayMaxScores: nextEssayMaxScores,
          reviewedEssayCount,
          hasEssay: essayQuestions.length > 0,
          score: mcqScore + essayTotal,
          total: mcqQuestions.length + essayMaxTotal,
          essayReviewedAt: serverTimestamp()
      };

      try {
          await updateDoc(doc(db, 'exam_results', resultDoc.id), payload);
          const nextViewingResult = { ...resultDoc, ...payload };
          setViewingResult(nextViewingResult);
          setExamResults((prev) => prev.map((res) => res.id === resultDoc.id ? nextViewingResult : res));
          alert("تم حفظ تصحيح السؤال المقالي بنجاح.");
      } catch (error) {
          console.error("Error saving essay grade:", error);
          alert("حدث خطأ أثناء حفظ التصحيح.");
      }
  };


  const sendWhatsAppToParent = (result) => {
      const student = activeUsersList.find(u => u.id === result.studentId);
      if (!student || !student.parentPhone) return alert("لا يوجد رقم ولي أمر مسجل لهذا الطالب!");
      let phone = student.parentPhone.trim();
      if (phone.startsWith('0')) phone = '20' + phone.substring(1);
      const examName = examsList.find(e => e.id === result.examId)?.title || 'اختبار';
      const message = `مرحباً ولي أمر الطالب/ة: *${result.studentName}* 🎓\n\nنحيط سيادتكم علماً بنتيجة امتحان: *${examName}*\nالدرجة التي حصل عليها: *${result.score}* من *${result.total}* 📊\n\nمع خالص تحيات إدارة منصة النحاس - أ/ محمد النحاس.`;
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
  };

  const openStudentProfile = async (student) => {
      setViewingStudentProfile(student);
      try {
          const q = query(collection(db, 'video_views'), where('userId', '==', student.id));
          const snap = await getDocs(q);
          const history = snap.docs.map(d => d.data());
          history.sort((a, b) => (b.viewedAt?.seconds || 0) - (a.viewedAt?.seconds || 0));
          setStudentHistoryData(history);
      } catch (error) { console.error("Error fetching history:", error); }
  };

  const handleUpdateExamTime = async (e) => {
      e.preventDefault();
      if (!newEndTime) return;
      try {
          await updateDoc(doc(db, 'exams', editingExamTime.id), { endTime: newEndTime });
          alert("تم تمديد وقت الامتحان بنجاح!");
          setEditingExamTime(null);
          setNewEndTime('');
      } catch (error) { console.error("Error updating exam time:", error); alert("حدث خطأ أثناء تعديل الوقت."); }
  };

  const handleCreateSmartHw = async (e) => {
      e.preventDefault();
      if (!newSmartHw.title || !newSmartHw.answerKey || !newSmartHw.bookName) return alert("أكمل البيانات (الاسم، الإجابة، والكتاب)");
      await addDoc(collection(db, 'smart_homeworks'), { ...newSmartHw, createdAt: serverTimestamp() });
      setNewSmartHw(prev => ({ ...prev, title: '', answerKey: '' }));
      alert("تم إنشاء الواجب! يمكنك نسخ الرابط الآن.");
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
      await addDoc(collection(db, 'notifications'), { text: `تنبيه هام: ${newAnnouncement}`, grade: 'all', createdAt: serverTimestamp() });
      setNewAnnouncement("");
      alert("تم نشر الإعلان");
  };

  const handleUpdateUser = async (e) => { 
      e.preventDefault(); 
      if(!editingUser) return; 

      const validation = validateEgyptianPhones(editingUser.phone, editingUser.parentPhone);
      if (!validation.ok) return alert(validation.message);

      await updateDoc(doc(db, 'users', editingUser.id), { 
          name: editingUser.name?.trim(), phone: validation.normalizedStudentPhone, parentPhone: validation.normalizedParentPhone, grade: editingUser.grade 
      }); 
      setEditingUser(null); 
  };
  
  const handleSendResetPassword = async (email) => { 
      if(window.confirm(`إرسال رابط تغيير كلمة السر لـ ${email}؟`)) await sendPasswordResetEmail(auth, email); 
  };
  
  const approveGrade = async (user) => {
      if (!user.requestedGrade) return;
      await updateDoc(doc(db, 'users', user.id), { grade: user.requestedGrade, requestedGrade: null, gradeUpdateStatus: null });
      alert(`تم تغيير مرحلة الطالب ${user.name} بنجاح.`);
  };

  const rejectGrade = async (user) => {
      await updateDoc(doc(db, 'users', user.id), { requestedGrade: null, gradeUpdateStatus: null });
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
      setNewContent({ title: '', url: '', type: 'video', videoSection: 'explanation', isPublic: false, grade: '3sec', allowedEmails: '', isPremium: false, linkedExamId: '', estimatedDurationMinutes: '', branch: '' });
  }; 
  
  const handleDeleteContent = async (id) => { 
      if(window.confirm("حذف هذا المحتوى؟")) await deleteDoc(doc(db, 'content', id)); 
  };

  const startLiveStream = async () => { 
      if(!liveData.liveUrl) return alert("الرابط مطلوب!"); 
      const allowedEmailsArray = liveData.allowedEmails ? liveData.allowedEmails.split(',').map(email => email.trim()) : [];
      await addDoc(collection(db, 'live_sessions'), { 
          ...liveData, allowedEmails: allowedEmailsArray, status: 'active', createdAt: serverTimestamp() 
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
    let currentQuestion = null;
    let currentBranch = 'عام';
    let isReadingPassage = false;

    const pushCurrentQuestion = () => {
        if (!currentQuestion) return;

        if (currentQuestion.type === 'essay') {
            currentBlock.subQuestions.push({
                id: currentQuestion.id,
                type: 'essay',
                text: currentQuestion.text.trim(),
                branch: currentQuestion.branch || currentBranch,
                modelAnswer: currentQuestion.modelAnswer || ''
            });
            currentQuestion = null;
            return;
        }

        if (currentQuestion.text?.trim() && currentQuestion.options.length >= 2) {
            if (currentQuestion.correctIdx < 0) currentQuestion.correctIdx = 0;
            currentBlock.subQuestions.push({
                ...currentQuestion,
                text: currentQuestion.text.trim(),
                branch: currentQuestion.branch || currentBranch
            });
        }
        currentQuestion = null;
    };

    const pushCurrentBlock = () => {
        pushCurrentQuestion();
        if (currentBlock.text.trim() || currentBlock.subQuestions.length > 0) {
            blocks.push({
                text: currentBlock.text.trim(),
                subQuestions: currentBlock.subQuestions
            });
        }
        currentBlock = { text: '', subQuestions: [] };
    };

    lines.forEach((line) => {
        if (!line) {
            pushCurrentQuestion();
            return;
        }

        const branchMatch = line.match(/^#\s*(?:فرع|الفرع)\s*:\s*(.+)$/);
        if (branchMatch) {
            pushCurrentQuestion();
            currentBranch = branchMatch[1].trim() || 'عام';
            return;
        }

        if (line === 'بداية القطعة') {
            pushCurrentBlock();
            isReadingPassage = true;
            return;
        }

        if (line === 'نهاية القطعة') {
            isReadingPassage = false;
            return;
        }

        if (line === 'حذف القطعة') {
            pushCurrentBlock();
            isReadingPassage = false;
            return;
        }

        if (isReadingPassage) {
            currentBlock.text += (currentBlock.text ? '\n' : '') + line;
            return;
        }

        const essayMatch = line.match(/^#?\s*(?:مقالي|essay)\s*[:：\-\)\.]?\s*(.+)$/i);
        if (essayMatch) {
            pushCurrentQuestion();
            currentQuestion = {
                id: Date.now() + Math.random(),
                type: 'essay',
                text: (essayMatch[1] || '').trim(),
                branch: currentBranch,
                modelAnswer: ''
            };
            return;
        }

        const isCorrect = line.startsWith('*');
        const cleanLine = isCorrect ? line.slice(1).trim() : line.trim();

        if (!currentQuestion) {
            currentQuestion = {
                id: Date.now() + Math.random(),
                type: 'mcq',
                text: cleanLine.replace(/^(س|سؤال)\s*[:：-]\s*/i, ''),
                options: [],
                correctIdx: -1,
                branch: currentBranch
            };
            return;
        }

        if (currentQuestion.type === 'essay') {
            if (cleanLine.startsWith('نموذج:') || cleanLine.startsWith('إجابة نموذجية:')) {
                currentQuestion.modelAnswer = cleanLine.replace('نموذج:', '').replace('إجابة نموذجية:', '').trim();
            } else {
                currentQuestion.text += '\n' + cleanLine;
            }
            return;
        }

        currentQuestion.options.push(cleanLine);
        if (isCorrect) currentQuestion.correctIdx = currentQuestion.options.length - 1;

        if (currentQuestion.options.length >= 4) {
            pushCurrentQuestion();
        }
    });

    pushCurrentBlock();

    const finalBlocks = blocks.filter(b => b.subQuestions.length > 0);
    if (finalBlocks.length === 0) return alert("لم يتم التعرف على الأسئلة بشكل صحيح. افصل بين كل سؤال بسطر فارغ، واستخدم #فرع: للفروع و #مقالي: للسؤال المقالي.");

    await addDoc(collection(db, 'exams'), { 
        title: examBuilder.title, grade: examBuilder.grade, duration: examBuilder.duration, 
        startTime: examBuilder.startTime, endTime: examBuilder.endTime, accessCode: examBuilder.accessCode, 
        isPremium: examBuilder.isPremium,
        questions: finalBlocks, createdAt: serverTimestamp() 
    });

    await addDoc(collection(db, 'notifications'), { text: `امتحان جديد: ${examBuilder.title}`, grade: examBuilder.grade, createdAt: serverTimestamp() });
    setBulkText(""); 
    alert(`تم نشر الامتحان بنجاح!`);
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
  
  const toggleAutoReply = async (id, currentStatus) => { await updateDoc(doc(db, 'auto_replies', id), { isActive: !currentStatus }); };
  const deleteAutoReply = async (id) => { if(window.confirm("حذف هذا الرد؟")) await deleteDoc(doc(db, 'auto_replies', id)); };
  const handleAddQuote = async () => {
      if(!newQuote.text || !newQuote.source) return alert("أكمل البيانات");
      await addDoc(collection(db, 'quotes'), { ...newQuote, createdAt: serverTimestamp() });
      setNewQuote({ text: '', source: '' });
  };
  const deleteQuote = async (id) => { if(window.confirm("حذف هذه الحكمة؟")) await deleteDoc(doc(db, 'quotes', id)); };

  const filteredPendingUsers = pendingUsers.filter(u => adminGradeFilter === 'all' || u.grade === adminGradeFilter);
  const filteredActiveUsers = activeUsersList.filter(u => adminGradeFilter === 'all' || u.grade === adminGradeFilter);
  const filteredContentList = contentList.filter(c => adminGradeFilter === 'all' || c.grade === adminGradeFilter);
  const filteredExamsList = examsList.filter(e => adminGradeFilter === 'all' || e.grade === adminGradeFilter);
  const filteredLiveSessions = activeLiveSessions.filter(ls => adminGradeFilter === 'all' || ls.grade === adminGradeFilter);

  return (
    <div className="min-h-screen bg-slate-100 font-['Cairo'] relative overflow-x-hidden" dir="rtl">
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
          <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
              <div className="bg-slate-50 rounded-3xl w-full max-w-6xl h-full md:h-[90vh] shadow-2xl flex flex-col relative overflow-hidden border border-slate-300">
                  <button onClick={() => setViewingStudentProfile(null)} className="absolute top-4 left-4 md:top-6 md:left-6 z-50 bg-red-100 p-2 md:p-3 rounded-full text-red-600 hover:bg-red-200 hover:text-red-700 transition shadow-md border border-red-200"><X size={24}/></button>
                  <div className="bg-white border-b border-slate-200 p-6 pt-16 md:pt-6 flex justify-between items-start flex-shrink-0">
                      <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner">
                              {viewingStudentProfile.name.charAt(0)}
                          </div>
                          <div>
                              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                  {viewingStudentProfile.name} 
                                  <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{getGradeLabel(viewingStudentProfile.grade)}</span>
                                  {viewingStudentProfile.subscriptionStatus === 'premium' && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><Crown size={12}/> VIP</span>}
                              </h2>
                              <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-2 text-sm text-slate-500 font-bold">
                                  <span className="flex items-center gap-1"><Phone size={14}/> {viewingStudentProfile.phone}</span>
                                  <span className="flex items-center gap-1 text-amber-600"><Users size={14}/> ولي الأمر: {viewingStudentProfile.parentPhone}</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 md:p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
                              <h3 className="font-bold text-lg mb-4 text-blue-800 flex items-center gap-2 border-b pb-2"><PlayCircle/> سجل مشاهدات الفيديوهات</h3>
                              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                  {studentHistoryData.length === 0 ? <p className="text-slate-400 text-center py-10">لم يفتح أي فيديو.</p> : studentHistoryData.map((v, i) => (
                                      <div key={i} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center border border-slate-100">
                                          <div>
                                              <p className="font-bold text-slate-800">{v.videoTitle}</p>
                                              <p className="text-xs text-slate-400 mt-1">آخر فتح: {v.viewedAt?.toDate().toLocaleString('ar-EG')}</p>
                                          </div>
                                          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold text-center">شاهد لمدة<br/><span className="text-sm">{formatWatchTime(v.watchedSeconds)}</span></div>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div className="flex flex-col gap-6 h-[500px]">
                              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
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

                              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
                                  <h3 className="font-bold text-lg mb-4 text-amber-800 flex items-center gap-2 border-b pb-2"><QrCode/> سجل واجبات (QR)</h3>
                                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                      {(() => {
                                          const sHw = hwResults.filter(r => r.studentId === viewingStudentProfile.id);
                                          if (sHw.length === 0) return <p className="text-slate-400 text-center py-4">لم يقم بتسليم أي واجب QR.</p>;
                                          return sHw.map(hw => (
                                              <div key={hw.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                  <div>
                                                      <p className="font-bold text-slate-700 text-sm">{hw.homeworkTitle}</p>
                                                      <p className="text-xs text-slate-400">{hw.bookName}</p>
                                                  </div>
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
            <select className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold shadow-sm cursor-pointer hidden md:block" value={adminGradeFilter} onChange={(e) => setAdminGradeFilter(e.target.value)}>
                <option value="all">كل المراحل الدراسية</option>
                <GradeOptions />
            </select>
            <button onClick={() => signOut(auth)} className="text-red-500 font-bold px-4 py-2 flex gap-2 hover:bg-red-50 rounded-lg transition"><LogOut /> خروج</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 md:p-6 relative z-10">
        <div className="glass-panel p-4 rounded-xl h-fit space-y-2 flex md:flex-col overflow-x-auto md:overflow-x-visible whitespace-nowrap scrollbar-hide">
          {['users', 'all_users', 'subscriptions', 'question_bank', 'assignments', 'exams', 'results', 'smart_hw', 'live', 'content', 'messages', 'auto_reply', 'quotes', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-right p-3 rounded-lg font-bold flex gap-2 transition-all ${activeTab===tab?'bg-amber-100 text-amber-700 shadow-sm border-b-4 md:border-b-0 md:border-r-4 border-amber-500':'hover:bg-slate-50 text-slate-600'}`}>
              {tab === 'users' ? 'الطلبات' : tab === 'all_users' ? 'الطلاب' : tab === 'subscriptions' ? 'أكواد الاشتراكات' : tab === 'question_bank' ? `بنك الأسئلة (${questionBankCount})` : tab === 'assignments' ? `الواجبات (${assignmentsCount})` : tab === 'exams' ? 'الامتحانات' : tab === 'results' ? 'النتائج' : tab === 'smart_hw' ? 'الواجب الذكي (QR)' : tab === 'live' ? 'البث' : tab === 'content' ? 'المحتوى' : tab === 'messages' ? 'الرسائل' : tab === 'auto_reply' ? 'الرد الآلي' : tab === 'quotes' ? 'إدارة الحكم' : 'الإعدادات'}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 w-full overflow-hidden">
          {activeTab === 'users' && <div className="glass-panel p-4 md:p-6 rounded-xl"><h2 className="font-bold mb-4 font-arabic text-xl">طلبات الانضمام</h2>{filteredPendingUsers.map(u=><div key={u.id} className="border p-4 mb-2 rounded-lg flex flex-col md:flex-row gap-3 justify-between bg-white/50 backdrop-blur-sm"><div><p className="font-bold">{u.name}</p><p className="text-sm">{u.grade}</p></div><div className="flex gap-2"><button onClick={()=>handleApprove(u.id)} className="bg-green-600 text-white px-3 py-1 rounded shadow-lg hover:shadow-green-500/50 transition flex-1"><Check className="mx-auto"/></button><button onClick={()=>handleReject(u.id)} className="bg-red-600 text-white px-3 py-1 rounded shadow-lg hover:shadow-red-500/50 transition flex-1"><X className="mx-auto"/></button></div></div>)}</div>}

          {activeTab === 'all_users' && (
              <div className="glass-panel p-4 md:p-6 rounded-xl">
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                      <h2 className="font-bold font-arabic text-xl">قائمة الطلاب ({filteredActiveUsers.length})</h2>
                      <div className="md:hidden">
                          <select className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold shadow-sm w-full" value={adminGradeFilter} onChange={(e) => setAdminGradeFilter(e.target.value)}>
                              <option value="all">كل المراحل</option><GradeOptions />
                          </select>
                      </div>
                  </div>
                  
                  {editingUser && (
                      <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                              <button onClick={() => setEditingUser(null)} className="absolute top-4 left-4 text-slate-400 hover:text-red-500"><X size={24}/></button>
                              <h3 className="text-xl font-bold mb-6 text-blue-800 flex items-center gap-2 border-b pb-2"><Edit size={24}/> تعديل بيانات الطالب</h3>
                              <form onSubmit={handleUpdateUser} className="space-y-4">
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">اسم الطالب</label><input className="w-full border-2 border-blue-100 p-3 rounded-xl bg-blue-50 focus:border-blue-500 outline-none transition" value={editingUser.name || ''} onChange={e=>setEditingUser({...editingUser, name:e.target.value})} required/></div>
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">رقم هاتف الطالب</label><input type="tel" className="w-full border-2 border-blue-100 p-3 rounded-xl bg-blue-50 focus:border-blue-500 outline-none transition" value={editingUser.phone || ''} onChange={e=>setEditingUser({...editingUser, phone: normalizeEgyptPhone(e.target.value)})} required/></div>
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">رقم هاتف ولي الأمر</label><input type="tel" className="w-full border-2 border-blue-100 p-3 rounded-xl bg-blue-50 focus:border-blue-500 outline-none transition" value={editingUser.parentPhone || ''} onChange={e=>setEditingUser({...editingUser, parentPhone: normalizeEgyptPhone(e.target.value)})} required/></div>
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">المرحلة الدراسية</label><select className="w-full border-2 border-blue-100 p-3 rounded-xl bg-white focus:border-blue-500 outline-none transition" value={editingUser.grade || '1sec'} onChange={e=>setEditingUser({...editingUser, grade:e.target.value})}><GradeOptions /></select></div>
                                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/50 mt-2">حفظ التعديلات</button>
                              </form>
                          </div>
                      </div>
                  )}
                  
                  <div className="grid gap-4">
                      {filteredActiveUsers.map(u=>(
                          <div key={u.id} className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all hover:shadow-lg ${u.status.startsWith('banned') ? 'bg-red-50 border-red-200' : 'bg-white/50 border-slate-100'}`}>
                              <div className="flex flex-col lg:flex-row justify-between w-full gap-4">
                                  <div className="flex-1">
                                      <div className="flex flex-wrap items-center gap-2 mb-2">
                                          <p className="font-bold text-lg text-slate-800">{u.name}</p>
                                          <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{getGradeLabel(u.grade)}</span>
                                          {u.subscriptionStatus === 'premium' ? (
                                              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><Crown size={12}/> VIP</span>
                                          ) : (
                                              <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full font-bold">مجاني</span>
                                          )}
                                          {u.status.startsWith('banned') && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-bold">محظور</span>}
                                      </div>
                                      <div className="text-sm text-slate-500 space-y-1">
                                          <p className="flex items-center gap-2"><Phone size={14} className="text-blue-600"/> الطالب: {u.phone}</p>
                                          <p className="flex items-center gap-2 font-bold text-amber-700"><Users size={14}/> ولي الأمر: {u.parentPhone}</p>
                                          {u.subscriptionStatus === 'premium' && u.subscriptionExpiry && (
                                              <p className="flex items-center gap-2 text-green-600 font-bold"><Clock size={14}/> ينتهي اشتراكه: {u.subscriptionExpiry.toDate().toLocaleDateString('ar-EG')}</p>
                                          )}
                                      </div>
                                  </div>
                                  
                                  <div className="flex flex-col gap-2 w-full lg:w-auto">
                                      <div className="flex flex-wrap gap-2">
                                          <button onClick={() => handleToggleSubscription(u)} className={`flex-1 lg:flex-none px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm ${u.subscriptionStatus === 'premium' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}>
                                              <Crown size={14}/> {u.subscriptionStatus === 'premium' ? 'إلغاء الباقة' : 'تفعيل باقة VIP'}
                                          </button>
                                          <select className="flex-1 lg:flex-none text-xs border p-2 rounded-lg bg-white font-bold" value={u.status} onChange={(e) => handleChangeUserStatus(u.id, e.target.value)}>
                                              <option value="active">نشط</option><option value="banned_all">حظر شامل</option><option value="banned_exam">حظر امتحانات</option><option value="banned_content">حظر محتوى</option>
                                          </select>
                                      </div>
                                      <div className="flex gap-2 justify-end mt-2">
                                          <button onClick={()=>openStudentProfile(u)} className="flex-1 lg:flex-none bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-bold shadow-md flex items-center justify-center gap-2"><FileCheck size={16}/> ملف الطالب</button>
                                          <button onClick={()=>setEditingUser(u)} className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200"><Edit size={16}/></button>
                                          <button onClick={()=>handleSendResetPassword(u.email)} className="bg-amber-100 text-amber-600 p-2 rounded-lg hover:bg-amber-200"><KeyRound size={16}/></button>
                                          <button onClick={()=>handleDeleteUser(u.id)} className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200"><Trash2 size={16}/></button>
                                      </div>
                                  </div>
                              </div>

                              {u.gradeUpdateStatus === 'pending' && (
                                  <div className="w-full bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex flex-col md:flex-row justify-between items-center gap-3 mt-2">
                                      <div className="flex items-center gap-2 text-yellow-800 text-sm font-bold"><RefreshCw size={16} className="animate-spin-slow" /> يريد التحويل إلى: <span className="bg-white px-2 rounded border">{getGradeLabel(u.requestedGrade)}</span></div>
                                      <div className="flex gap-2 w-full md:w-auto"><button onClick={() => approveGrade(u)} className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-xs font-bold hover:bg-green-700">موافقة</button><button onClick={() => rejectGrade(u)} className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-xs font-bold hover:bg-red-700">رفض</button></div>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'subscriptions' && (
              <div className="space-y-6">
                  <div className="glass-panel p-4 md:p-6 rounded-xl border-t-4 border-amber-500">
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-amber-700"><Key/> توليد أكواد اشتراكات (كروت شحن)</h2>
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
                          <p className="text-sm text-amber-800 font-bold mb-4">هذه الأكواد يمكن طباعتها وبيعها للطلاب لتفعيل باقة VIP لديهم فوراً عند إدخال الكود.</p>
                          <div className="flex flex-col md:flex-row gap-4">
                              <div className="flex-1">
                                  <label className="block text-xs font-bold text-slate-600 mb-1">عدد الأكواد المطلوبة</label>
                                  <input type="number" className="w-full border p-3 rounded-lg" value={codeGenCount} onChange={e=>setCodeGenCount(e.target.value)} />
                              </div>
                              <div className="flex-1">
                                  <label className="block text-xs font-bold text-slate-600 mb-1">مدة الاشتراك (بالأيام)</label>
                                  <input type="number" className="w-full border p-3 rounded-lg" value={codeGenDays} onChange={e=>setCodeGenDays(e.target.value)} />
                              </div>
                              <div className="flex items-end">
                                  <button onClick={generateSubscriptionCodes} className="w-full md:w-auto bg-amber-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-amber-700 transition">توليد الأكواد</button>
                              </div>
                          </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                          <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm text-sm whitespace-nowrap">
                              <thead className="bg-slate-800 text-white">
                                  <tr>
                                      <th className="p-3 text-right">الكود</th>
                                      <th className="p-3 text-center">المدة</th>
                                      <th className="p-3 text-center">الحالة</th>
                                      <th className="p-3 text-right">استخدم بواسطة</th>
                                      <th className="p-3 text-center">إجراء</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {subscriptionCodes.map((code, idx) => (
                                      <tr key={code.id} className={`border-b ${code.used ? 'bg-red-50 opacity-60' : 'hover:bg-slate-50'}`}>
                                          <td className="p-3 font-mono font-bold text-blue-700">{code.code}</td>
                                          <td className="p-3 text-center font-bold">{code.days} يوم</td>
                                          <td className="p-3 text-center">
                                              {code.used ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">مُستخدم</span> : <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">جديد (صالح)</span>}
                                          </td>
                                          <td className="p-3 text-slate-600">{code.usedBy || '-'}</td>
                                          <td className="p-3 text-center">
                                              <button onClick={() => handleDeleteCode(code.id)} className="text-red-500 hover:bg-red-100 p-2 rounded"><Trash2 size={16}/></button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'question_bank' && (<QuestionBankManager adminGradeFilter={adminGradeFilter} />)}

          {activeTab === 'assignments' && (<AssignmentsManager adminGradeFilter={adminGradeFilter} />)}

          {activeTab === 'smart_hw' && (
              <div className="space-y-6">
                  <div className="glass-panel p-4 md:p-6 rounded-xl">
                      <h2 className="text-xl font-bold mb-4 font-arabic text-blue-700 flex items-center gap-2"><QrCode/> إضافة واجب (للكتاب)</h2>
                      <form onSubmit={handleCreateSmartHw} className="grid gap-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div><label className="block text-xs font-bold mb-1 text-slate-500">المرحلة الدراسية</label><select className="border p-3 rounded w-full bg-white" value={newSmartHw.grade} onChange={e=>setNewSmartHw({...newSmartHw, grade:e.target.value})}><GradeOptions/></select></div>
                              <div><label className="block text-xs font-bold mb-1 text-slate-500">اسم الكتاب</label><input className="border p-3 rounded w-full" placeholder="مثال: كتاب النحو الجزء الأول" value={newSmartHw.bookName} onChange={e=>setNewSmartHw({...newSmartHw, bookName:e.target.value})} required/></div>
                          </div>
                          <input className="border p-3 rounded" placeholder="اسم الواجب/رقم الصفحة (مثال: تدريبات صفحة 15)" value={newSmartHw.title} onChange={e=>setNewSmartHw({...newSmartHw, title:e.target.value})} required/>
                          <textarea className="border p-3 rounded h-24" placeholder="نموذج الإجابة (مثال: 1-أ, 2-ج, 3-د...)" value={newSmartHw.answerKey} onChange={e=>setNewSmartHw({...newSmartHw, answerKey:e.target.value})} required/>
                          <button type="submit" className="bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-blue-500/50">توليد رابط للصفحة</button>
                      </form>
                  </div>
                  
                  <div className="glass-panel p-4 md:p-6 rounded-xl">
                      <h3 className="font-bold mb-4">الواجبات المضافة</h3>
                      <div className="space-y-6">
                          {(() => {
                              const filteredHw = smartHomeworks.filter(hw => adminGradeFilter === 'all' || hw.grade === adminGradeFilter);
                              if (filteredHw.length === 0) return <p className="text-slate-500">لا توجد واجبات في هذه المرحلة.</p>;
                              const hwByBook = filteredHw.reduce((acc, hw) => { const book = hw.bookName || 'كتب غير مصنفة'; if(!acc[book]) acc[book] = []; acc[book].push(hw); return acc; }, {});
                              return Object.entries(hwByBook).map(([bookName, hws]) => (
                                  <div key={bookName} className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
                                      <h4 className="font-bold text-lg text-amber-700 bg-amber-100 p-2 rounded-lg mb-4 flex items-center gap-2 w-max"><BookOpen size={20}/> كتاب: {bookName}</h4>
                                      <div className="space-y-3 pl-4 border-r-4 border-amber-300 pr-4 w-max min-w-full">
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
                                                          <button onClick={() => { navigator.clipboard.writeText(hwLink); alert("تم نسخ الرابط!"); }} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-700 text-sm h-fit shadow-md">نسخ الرابط</button>
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

                  <div className="glass-panel p-4 md:p-6 rounded-xl">
                      <h3 className="font-bold mb-4 text-green-700">نتائج تصحيح الذكاء الاصطناعي</h3>
                      <div className="space-y-2 overflow-x-auto">
                          <div className="min-w-max">
                              {hwResults.filter(res => adminGradeFilter === 'all' || res.grade === adminGradeFilter).map(res => (
                                  <div key={res.id} className="flex justify-between items-center border p-3 rounded hover:bg-slate-50 transition bg-white/50 mb-2">
                                      <div className="ml-4">
                                          <p className="font-bold">{res.studentName} <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600 mx-1">{getGradeLabel(res.grade)}</span></p>
                                          <p className="text-slate-500 text-xs font-bold mt-1">الكتاب: {res.bookName} - {res.homeworkTitle}</p>
                                          <p className="text-sm text-green-600 font-bold mt-1">الدرجة: {res.score}/{res.total}</p>
                                      </div>
                                      <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded-lg text-center flex-shrink-0">
                                          {res.submittedAt?.toDate().toLocaleDateString('ar-EG')}<br/>{res.submittedAt?.toDate().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'exams' && (
              <div className="space-y-8">
                  <div className="glass-panel p-4 md:p-6 rounded-xl">
                      <h2 className="text-xl font-bold mb-6 border-b pb-2 font-arabic text-amber-700">إنشاء امتحان</h2>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <input className="border p-2 rounded md:col-span-2" placeholder="العنوان" value={examBuilder.title} onChange={e=>setExamBuilder({...examBuilder, title:e.target.value})}/>
                          <input className="border p-2 rounded" placeholder="الكود" value={examBuilder.accessCode} onChange={e=>setExamBuilder({...examBuilder, accessCode:e.target.value})}/>
                          <input type="number" className="border p-2 rounded" placeholder="المدة (دقائق)" value={examBuilder.duration} onChange={e=>setExamBuilder({...examBuilder, duration:parseInt(e.target.value)})}/>
                          
                          <select className="border p-2 rounded md:col-span-2" value={examBuilder.grade} onChange={e=>setExamBuilder({...examBuilder, grade:e.target.value})}>
                              <GradeOptions/>
                          </select>
                          <div className="md:col-span-2 flex items-center bg-amber-50 border border-amber-200 rounded p-2">
                              <input type="checkbox" id="examVip" className="w-5 h-5 ml-2" checked={examBuilder.isPremium} onChange={e=>setExamBuilder({...examBuilder, isPremium: e.target.checked})} />
                              <label htmlFor="examVip" className="font-bold text-amber-800 text-sm flex items-center gap-1 cursor-pointer"><Crown size={16}/> امتحان VIP (مغلق لغير المشتركين)</label>
                          </div>

                          <div className="md:col-span-2">
                              <label className="block text-xs font-bold mb-1">وقت البدء</label>
                              <input type="datetime-local" className="border p-2 rounded w-full" onChange={e=>setExamBuilder({...examBuilder, startTime:e.target.value})}/>
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-xs font-bold mb-1">وقت الانتهاء</label>
                              <input type="datetime-local" className="border p-2 rounded w-full" onChange={e=>setExamBuilder({...examBuilder, endTime:e.target.value})}/>
                          </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border mb-6">
                          <textarea className="w-full border p-4 rounded-lg h-96 font-mono text-sm" placeholder="اكتب الأسئلة هنا...&#10;(هام 1: افصل بين كل سؤال والذي يليه بسطر فارغ تماماً، وضع علامة * قبل الإجابة الصحيحة)&#10;(هام 2: لتحديد فرع، اكتب #فرع: اسم_الفرع في سطر لوحده)&#10;(هام 3: للسؤال المقالي اكتب #مقالي: نص السؤال)" value={bulkText} onChange={e=>setBulkText(e.target.value)}/>
                          <button onClick={parseExam} className="mt-4 w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-green-500/50 transition">نشر</button>
                      </div>
                  </div>
                  <div className="glass-panel p-4 md:p-6 rounded-xl">
                      <h3 className="font-bold mb-4 font-arabic">الامتحانات الحالية</h3>
                      <div className="overflow-x-auto">
                          <div className="min-w-[600px]">
                              {filteredExamsList.map(exam=>(
                                  <div key={exam.id} className="flex justify-between items-center border-b py-3 last:border-0 hover:bg-slate-50/50 px-2 rounded transition">
                                      <div>
                                          <p className="font-bold flex items-center gap-2">
                                              {exam.title}
                                              {exam.isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Crown size={10}/> VIP</span>}
                                          </p>
                                          <p className="text-xs text-slate-500">من: {new Date(exam.startTime).toLocaleString('ar-EG')} | إلى: {new Date(exam.endTime).toLocaleString('ar-EG')}</p>
                                          <p className="text-xs text-slate-400">كود: {exam.accessCode}</p>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => { setEditingExamTime(exam); setNewEndTime(exam.endTime); }} className="text-blue-600 p-2 bg-blue-100 rounded-lg hover:bg-blue-200" title="تمديد الوقت"><Calendar size={18}/></button>
                                          <button onClick={()=>handleDeleteExam(exam.id)} className="text-red-600 p-2 bg-red-100 rounded-lg hover:bg-red-200" title="حذف"><Trash2 size={18}/></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'results' && (
             <div className="glass-panel p-4 md:p-6 rounded-xl">
               <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                 <h2 className="font-bold flex items-center gap-2 font-arabic text-xl"><Layout/> نتائج الامتحانات</h2>
                 {!viewingResult && examResults.length > 0 && (
                     <button onClick={handleDeleteAllResults} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition shadow-lg w-full md:w-auto justify-center"><Trash2 size={16}/> حذف جميع النتائج</button>
                 )}
               </div>
               {viewingResult ? (
                   <div className="bg-slate-50 p-4 rounded-xl border">
                       <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                           <button onClick={() => setViewingResult(null)} className="text-sm text-slate-500 underline font-bold text-right">العودة للقائمة</button>
                           {(() => {
                               const examData = examsList.find(e => e.id === viewingResult.examId);
                               const questions = getQuestionsForExam(examData);
                               return (
                                   <div className="flex gap-2">
                                       <button onClick={() => sendWhatsAppToParent(viewingResult)} className="flex-1 md:flex-none justify-center bg-green-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-bold hover:bg-green-600 shadow-sm"><MessageCircle size={16}/> واتساب لولي الأمر</button>
                                       <button onClick={() => generatePDF('admin', {...viewingResult, total: viewingResult.total || 0, examTitle: examData?.title, questions: questions, answers: viewingResult.answers })} className="flex-1 md:flex-none justify-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm"><Download size={16}/> التقرير</button>
                                   </div>
                               );
                           })()}
                       </div>
                       <h3 className="font-bold text-lg mb-2">إجابات الطالب: {viewingResult.studentName}</h3>
                       {viewingResult.hasEssay && (
                           <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl font-bold text-sm">
                               هذا الامتحان يحتوي على أسئلة مقالية، ويمكنك تصحيح كل سؤال يدويًا وتحديد الدرجة النهائية له من نفس الصفحة.
                           </div>
                       )}
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
                                                   <p className="font-bold mb-2 text-lg md:text-xl text-blue-900 font-sans pr-10">
                                                       {q.text.split('|').map((part, i) => (<React.Fragment key={i}>{part.trim()}{i !== q.text.split('|').length - 1 && <br />}</React.Fragment>))}
                                                   </p>
                                                   {q.type === 'essay' ? (
                                                       <div className="space-y-4">
                                                           <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                                               <p className="font-bold text-slate-800 mb-2">إجابة الطالب النصية</p>
                                                               <p className="whitespace-pre-wrap text-slate-700">
                                                                   {typeof viewingResult.answers?.[q.id] === 'object'
                                                                       ? (viewingResult.answers?.[q.id]?.text || 'لم يكتب الطالب إجابة نصية')
                                                                       : (viewingResult.answers?.[q.id] || 'لم يكتب الطالب إجابة نصية')}
                                                               </p>
                                                           </div>
                                                           {typeof viewingResult.answers?.[q.id] === 'object' && viewingResult.answers?.[q.id]?.image && (
                                                               <div className="bg-white border border-slate-200 rounded-xl p-4">
                                                                   <p className="font-bold text-slate-800 mb-3">الصورة المرفوعة</p>
                                                                   <img src={viewingResult.answers[q.id].image} alt="إجابة مقالية" className="max-h-96 rounded-xl border border-slate-200 mx-auto" />
                                                               </div>
                                                           )}
                                                           <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                                               <p className="font-bold text-amber-800 mb-3">تصحيح السؤال المقالي</p>
                                                               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                   <input
                                                                       type="number"
                                                                       min="0"
                                                                       step="0.5"
                                                                       className="border p-3 rounded-lg"
                                                                       placeholder="درجة الطالب"
                                                                       value={essayScoreDrafts[getEssayDraftKey(viewingResult.id, q.id)] ?? (viewingResult.essayScores?.[q.id] ?? '')}
                                                                       onChange={(e) => setEssayScoreDrafts((prev) => ({ ...prev, [getEssayDraftKey(viewingResult.id, q.id)]: e.target.value }))}
                                                                   />
                                                                   <input
                                                                       type="number"
                                                                       min="0.5"
                                                                       step="0.5"
                                                                       className="border p-3 rounded-lg"
                                                                       placeholder="من كام"
                                                                       value={essayMaxDrafts[getEssayDraftKey(viewingResult.id, q.id)] ?? (viewingResult.essayMaxScores?.[q.id] ?? '')}
                                                                       onChange={(e) => setEssayMaxDrafts((prev) => ({ ...prev, [getEssayDraftKey(viewingResult.id, q.id)]: e.target.value }))}
                                                                   />
                                                                   <button
                                                                       onClick={() => handleSaveEssayGrade(viewingResult, q, questions)}
                                                                       className="bg-amber-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-amber-700 transition"
                                                                   >
                                                                       حفظ التصحيح
                                                                   </button>
                                                               </div>
                                                               {(viewingResult.essayScores?.[q.id] !== undefined && viewingResult.essayMaxScores?.[q.id] !== undefined) && (
                                                                   <p className="text-sm text-amber-900 mt-3 font-bold">
                                                                       الدرجة المحفوظة: {viewingResult.essayScores[q.id]} / {viewingResult.essayMaxScores[q.id]}
                                                                   </p>
                                                               )}
                                                           </div>
                                                       </div>
                                                   ) : (
                                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                           {q.options.map((opt, oIdx) => {
                                                               const isCorrect = oIdx === q.correctIdx;
                                                               const isSelected = viewingResult.answers[q.id] === oIdx;
                                                               let style = "bg-gray-50 text-gray-500";
                                                               if (isCorrect) style = "bg-green-100 text-green-800 border-green-500 border font-bold md:text-lg";
                                                               if (isSelected && !isCorrect) style = "bg-red-100 text-red-800 border-red-500 border font-bold md:text-lg";
                                                               return <div key={oIdx} className={`p-3 rounded font-sans font-bold ${style}`}>{opt}</div>
                                                           })}
                                                       </div>
                                                   )}
                                               </div>
                                           ))}
                                       </div>
                                   </div>
                               ));
                           })()}
                       </div>
                   </div>
               ) : (
                   <div className="overflow-x-auto">
                       <div className="min-w-[600px] space-y-2">
                           {examResults.map(res => (
                               <div key={res.id} className="flex justify-between items-center border p-3 rounded hover:bg-slate-50 transition bg-white/50">
                                   <div>
                                       <p className="font-bold flex items-center gap-2">
                                           {res.studentName}
                                           {res.hasEssay && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold">مقالي</span>}
                                       </p>
                                       <p className="text-xs text-slate-500">{res.status==='cheated'?'غش 🚫': res.status==='in_progress' ? 'قيد التنفيذ (لم يسلم) ⏳' : `درجة: ${res.score}/${res.total}`}</p>
                                   </div>
                                   <div className="flex gap-2">
                                      {res.status === 'completed' && <button onClick={()=>sendWhatsAppToParent(res)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-green-200"><MessageCircle size={14}/><span className="hidden md:inline"> إرسال لولي الأمر</span></button>}
                                      <button onClick={()=>setViewingResult(res)} className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs font-bold">التفاصيل</button>
                                      <button onClick={()=>handleDeleteResult(res.id)} className="bg-amber-100 text-amber-600 px-3 py-1 rounded text-xs font-bold">إعادة</button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )}
             </div>
          )}

          {activeTab === 'live' && (
              <div className="glass-panel p-4 md:p-8 rounded-xl border-t-4 border-red-600">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-red-600 font-arabic"><Radio size={32}/> البث المباشر</h2>
                  <div className="grid gap-4 mb-8">
                      <input className="border p-3 rounded-xl w-full" placeholder="العنوان" value={liveData.title} onChange={e=>setLiveData({...liveData, title:e.target.value})}/>
                      <input className="border p-3 rounded-xl w-full" placeholder="رابط البث (Zoom/YouTube/Meet)" value={liveData.liveUrl} onChange={e=>setLiveData({...liveData, liveUrl:e.target.value})}/>
                      <input className="border p-3 rounded-xl w-full" placeholder="الرقم السري (اختياري، اتركه فارغاً للدخول بدون كود)" value={liveData.passcode} onChange={e=>setLiveData({...liveData, passcode:e.target.value})}/>
                      <input className="border p-3 rounded-xl w-full" placeholder="إيميلات مخصصة (اختياري، افصل بفاصلة)" value={liveData.allowedEmails} onChange={e=>setLiveData({...liveData, allowedEmails:e.target.value})}/>
                      <select className="border p-3 rounded-xl w-full" value={liveData.grade} onChange={e=>setLiveData({...liveData, grade:e.target.value})}><GradeOptions/></select>
                      <button onClick={startLiveStream} className="bg-red-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-red-500/30 w-full md:w-auto">بدء بث جديد</button>
                  </div>
                  {filteredLiveSessions.length > 0 && (
                      <div className="mt-8 border-t pt-6">
                          <h3 className="font-bold mb-4">البث المباشر الحالي</h3>
                          <div className="space-y-3">
                              {filteredLiveSessions.map(session => (
                                  <div key={session.id} className="p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col md:flex-row gap-4 justify-between md:items-center">
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
              <div className="glass-panel p-4 md:p-6 rounded-xl">
                  <h2 className="font-bold mb-4 font-arabic text-xl">إضافة محتوى</h2>
                  <form onSubmit={handleAddContent} className="grid gap-4 mb-6">
                      <input className="border p-3 rounded w-full" placeholder="العنوان" value={newContent.title} onChange={e=>setNewContent({...newContent, title:e.target.value})}/>
                      <input className="border p-3 rounded w-full" placeholder="الرابط (يفضل Google Drive للملفات الكبيرة)" value={newContent.url} onChange={e=>setNewContent({...newContent, url:e.target.value})}/>
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
                      
                      <div className="flex flex-col md:flex-row gap-2">
                          <select className="border p-3 rounded flex-1" value={newContent.type} onChange={e=>setNewContent({...newContent, type:e.target.value})}>
                              <option value="video">فيديو مدمج</option><option value="file">ملف (PDF)</option><option value="html">ملف تفاعلي (HTML)</option><option value="interactive_exam">امتحان تفاعلي (رابط/HTML)</option><option value="link">رابط خارجي (Google Meet, Drive, etc)</option>
                          </select>
                          {newContent.type === 'video' && (
                              <select className="border p-3 rounded flex-1" value={newContent.videoSection} onChange={e=>setNewContent({...newContent, videoSection:e.target.value})}>
                                  <option value="explanation">شرح الدرس</option>
                                  <option value="exercises">حل التدريبات</option>
                                  <option value="reviews">مراجعة نهائية</option>
                              </select>
                          )}
                          <select className="border p-3 rounded flex-1" value={newContent.grade} onChange={e=>setNewContent({...newContent, grade:e.target.value})}><GradeOptions/></select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input className="border p-3 rounded" placeholder="الفرع المرتبط (اختياري)" value={newContent.branch} onChange={e=>setNewContent({...newContent, branch:e.target.value})} />
                          <input className="border p-3 rounded" placeholder="معرّف امتحان مرتبط بالفيديو" value={newContent.linkedExamId} onChange={e=>setNewContent({...newContent, linkedExamId:e.target.value})} />
                          <input type="number" className="border p-3 rounded" placeholder="مدة الفيديو بالدقائق للربط 75%" value={newContent.estimatedDurationMinutes} onChange={e=>setNewContent({...newContent, estimatedDurationMinutes:e.target.value})} />
                      </div>

                      <div className="flex items-center bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <input type="checkbox" id="vipContent" className="w-5 h-5 ml-3" checked={newContent.isPremium} onChange={e=>setNewContent({...newContent, isPremium:e.target.checked})} />
                          <label htmlFor="vipContent" className="font-bold text-amber-800 text-sm flex items-center gap-1 cursor-pointer"><Crown size={18}/> محتوى VIP (مغلق ومخصص للمشتركين فقط)</label>
                      </div>
                      
                      <div className="border p-3 rounded-lg bg-gray-50">
                          <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><Lock size={14}/> تخصيص لطلاب محددين (اختياري)</label>
                          <input className="border p-2 rounded w-full text-sm" placeholder="اكتب إيميلات الطلاب مفصولة بفاصلة" value={newContent.allowedEmails} onChange={e=>setNewContent({...newContent, allowedEmails:e.target.value})} />
                          <p className="text-xs text-gray-500 mt-1">اتركه فارغاً لكي يظهر المحتوى للجميع.</p>
                      </div>
                      
                      <div className="flex items-center gap-2"><input type="checkbox" checked={newContent.isPublic} onChange={e=>setNewContent({...newContent, isPublic:e.target.checked})}/> <label>عام (يظهر للزوار في الصفحة الرئيسية)</label></div>
                      <button className="bg-amber-600 text-white p-3 rounded font-bold shadow-lg shadow-amber-500/30 w-full md:w-auto">نشر</button>
                  </form>
                  <div className="space-y-2 overflow-x-auto">
                      <div className="min-w-[600px]">
                          {filteredContentList.map(c=>(
                              <div key={c.id} className="flex justify-between border-b p-3 items-center bg-white/50 rounded hover:bg-white transition mb-2">
                                  <div className="flex items-center flex-wrap gap-2">
                                      <span className="font-bold ml-2">{c.title}</span>
                                      {c.type === 'video' && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold">{c.videoSection === 'exercises' ? 'حل تدريبات' : c.videoSection === 'reviews' ? 'مراجعة' : 'شرح'}</span>}
                                      {c.isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Crown size={10}/> VIP</span>}
                                      {c.allowedEmails && c.allowedEmails.length > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded flex items-center gap-1 inline-flex"><Lock size={10}/> خاص</span>}
                                      {c.type === 'interactive_exam' && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded">امتحان تفاعلي</span>}
                                      {c.type === 'html' && <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded">HTML</span>}
                                      {c.type === 'link' && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded">رابط خارجي</span>}
                                  </div>
                                  <div className="flex gap-2"><button onClick={() => handleDeleteContent(c.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button></div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'messages' && <div className="glass-panel p-4 md:p-6 rounded-xl"><h2 className="font-bold mb-4 font-arabic text-xl">الرسائل</h2>{messagesList.map(m=><div key={m.id} className="border-b p-4 bg-slate-50 mb-3 rounded-lg relative"><button onClick={()=>handleDeleteMessage(m.id)} className="absolute top-2 left-2 text-red-400 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button><div className="mb-2"><p className="font-bold text-amber-800">{m.senderName} <span className="text-xs text-slate-500">({m.sender})</span></p><p className="text-sm text-slate-400">{m.createdAt?.toDate?m.createdAt.toDate().toLocaleString():'الآن'}</p></div><p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 mb-3 text-sm md:text-base">{m.text}</p>{m.adminReply?<div className="bg-green-50 p-3 rounded-lg border border-green-200 text-sm"><span className="font-bold text-green-700">ردك: </span>{m.adminReply}</div>:<div className="flex flex-col md:flex-row gap-2"><input className="flex-1 border p-2 rounded text-sm w-full" placeholder="اكتب ردك..." value={replyTexts[m.id]||""} onChange={e=>setReplyTexts({...replyTexts,[m.id]:e.target.value})}/><button onClick={()=>handleReplyMessage(m.id)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm w-full md:w-auto flex justify-center"><Reply size={16}/></button></div>}</div>)}</div>}
           
          {activeTab === 'auto_reply' && (
              <div className="glass-panel p-4 md:p-6 rounded-xl">
                  <h2 className="font-bold mb-4 flex items-center gap-2 font-arabic text-xl"><Bot /> إعدادات الرد الآلي</h2>
                  <div className="bg-slate-50 p-4 rounded-xl border mb-6">
                      <h3 className="font-bold mb-2 text-sm">إضافة قاعدة جديدة</h3>
                      <div className="grid gap-3">
                          <input className="border p-2 rounded w-full" placeholder="الكلمات المفتاحية (افصل بينها بفاصلة، مثال: سعر,حجز,مواعيد)" value={newAutoReply.keywords} onChange={e=>setNewAutoReply({...newAutoReply, keywords:e.target.value})} />
                          <textarea className="border p-2 rounded h-20 w-full" placeholder="الرد الذي سيظهر للطالب..." value={newAutoReply.response} onChange={e=>setNewAutoReply({...newAutoReply, response:e.target.value})} />
                          <button onClick={handleAddAutoReply} className="bg-amber-600 text-white py-2 rounded font-bold hover:bg-amber-700 w-full md:w-auto">إضافة القاعدة</button>
                      </div>
                  </div>
                  <div className="space-y-3">
                      {autoReplies.map(rule => (
                          <div key={rule.id} className={`p-4 rounded-lg border flex flex-col md:flex-row justify-between md:items-center gap-4 ${rule.isActive ? 'bg-white border-green-200' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
                              <div className="flex-1">
                                  <p className="font-bold text-sm text-slate-600 mb-1">الكلمات: <span className="text-blue-600">{rule.keywords}</span></p>
                                  <p className="text-slate-800 text-sm md:text-base">{rule.response}</p>
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => toggleAutoReply(rule.id, rule.isActive)} className={`p-2 rounded-full ${rule.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`} title={rule.isActive ? "تعطيل" : "تنشيط"}><Power size={18} /></button>
                                  <button onClick={() => deleteAutoReply(rule.id)} className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"><Trash2 size={18} /></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'quotes' && (
              <div className="glass-panel p-4 md:p-6 rounded-xl">
                  <h2 className="font-bold mb-4 flex items-center gap-2 font-arabic text-xl"><PenTool /> إدارة الحكم والأقوال</h2>
                  <div className="bg-slate-50 p-4 rounded-xl border mb-6">
                      <h3 className="font-bold mb-2 text-sm">إضافة حكمة جديدة</h3>
                      <div className="grid gap-3">
                          <input className="border p-2 rounded w-full" placeholder="نص الحكمة" value={newQuote.text} onChange={e=>setNewQuote({...newQuote, text:e.target.value})} />
                          <input className="border p-2 rounded w-full" placeholder="المصدر (مثال: تحفيز، شعر، حكمة)" value={newQuote.source} onChange={e=>setNewQuote({...newQuote, source:e.target.value})} />
                          <button onClick={handleAddQuote} className="bg-amber-600 text-white py-2 rounded font-bold hover:bg-amber-700 w-full md:w-auto">إضافة</button>
                      </div>
                  </div>
                  <div className="space-y-3">
                      {quotesList.map(q => (
                          <div key={q.id} className="p-3 rounded-lg border bg-white flex justify-between items-center gap-2">
                              <div><p className="font-bold text-slate-800 text-sm md:text-base">"{q.text}"</p><p className="text-xs text-slate-500">- {q.source}</p></div>
                              <button onClick={() => deleteQuote(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'settings' && (
              <div className="glass-panel p-4 md:p-6 rounded-xl space-y-6">
                  <h2 className="font-bold mb-4 font-arabic text-xl">إدارة الموقع</h2>
                  <div className="border p-4 rounded-xl">
                      <h3 className="font-bold mb-2 text-amber-600">شريط الإعلانات</h3>
                      <div className="flex flex-col md:flex-row gap-2 mb-4">
                          <input className="border p-2 flex-1 rounded w-full" placeholder="نص الإعلان" value={newAnnouncement} onChange={e=>setNewAnnouncement(e.target.value)} />
                          <button onClick={handleAddAnnouncement} className="bg-green-600 text-white px-6 py-2 rounded font-bold w-full md:w-auto">نشر</button>
                      </div>
                      <div className="space-y-2">
                          {announcements.map(a => (
                              <div key={a.id} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                                  <span className="text-sm">{a.text}</span><button onClick={() => handleDeleteAnnouncement(a.id)} className="text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={14}/></button>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="border p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div><h3 className="font-bold text-blue-600">لوحة الشرف (الأوائل)</h3><p className="text-sm text-slate-500">إظهار أو إخفاء لوحة الأوائل في صفحة الطلاب</p></div>
                      <button onClick={toggleLeaderboard} className={`px-6 py-2 rounded-full font-bold w-full md:w-auto ${showLeaderboard ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{showLeaderboard ? 'ظاهرة' : 'مخفية'}</button>
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
  const [videoSectionTab, setVideoSectionTab] = useState('explanation');
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
  
  const [subscriptionCodeInput, setSubscriptionCodeInput] = useState('');
  const [isCharging, setIsCharging] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [videoProgressMap, setVideoProgressMap] = useState({});

  useEffect(() => {
      window.history.pushState({ tab: activeTab }, '');
      const handlePopState = (e) => {
          if (e.state && e.state.tab) {
              setActiveTab(e.state.tab);
              setMobileMenu(false);
          } else {
              setActiveTab('home');
          }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

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
    const unsubAssignments = onSnapshot(query(collection(db, 'assignments'), where('grade', '==', userData.grade)), s => setAssignments(s.docs.map(d=>({id:d.id,...d.data()}))), (error) => { console.warn('Assignments listener blocked:', error?.message); setAssignments([]); });
    const unsubResults = onSnapshot(query(collection(db, 'exam_results'), where('studentId', '==', user.uid)), s => setExamResults(s.docs.map(d=>({id:d.id,...d.data()}))));
    const unsubHwResults = onSnapshot(query(collection(db, 'homework_results'), where('studentId', '==', user.uid)), s => {
        const results = s.docs.map(d=>({id:d.id,...d.data()})); results.sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)); setHwResults(results);
    });
    const unsubAssignmentSubs = onSnapshot(query(collection(db, 'assignment_submissions'), where('studentId', '==', user.uid)), s => setAssignmentSubmissions(s.docs.map(d=>({id:d.id,...d.data()}))), (error) => { console.warn('Assignment submissions listener blocked:', error?.message); setAssignmentSubmissions([]); });
    const unsubVideoViews = onSnapshot(query(collection(db, 'video_views'), where('userId', '==', user.uid)), s => { const map = {}; s.docs.forEach(d => { const data = d.data(); map[data.videoId] = data; }); setVideoProgressMap(map); }, (error) => { console.warn('Video views listener blocked:', error?.message); setVideoProgressMap({}); });
    const unsubMistakes = onSnapshot(query(collection(db, 'student_mistakes'), where('userId', '==', user.uid), orderBy('timestamp', 'desc')), s => { setMistakes(s.docs.map(d => ({id: d.id, ...d.data()}))); });
    const unsubNotif = onSnapshot(query(collection(db, 'notifications'), where('grade', 'in', ['all', userData.grade]), orderBy('createdAt', 'desc'), limit(10)), s => {
        const newNotifs = s.docs.map(d => d.data()); setNotifications(newNotifs);
        if(newNotifs.length > 0) { setHasNewNotif(true); if(newNotifs[0].text) sendSystemNotification("تنبيه جديد 🔔", newNotifs[0].text); }
    });

    setEditFormData({ name: userData.name, phone: userData.phone, parentPhone: userData.parentPhone, grade: userData.grade });

    return () => { unsubContent(); unsubLive(); unsubExams(); unsubAssignments(); unsubResults(); unsubHwResults(); unsubAssignmentSubs(); unsubVideoViews(); unsubMistakes(); unsubNotif(); };
  }, [userData, user]);

  const isPremium = userData?.subscriptionStatus === 'premium' && (!userData.subscriptionExpiry || userData.subscriptionExpiry.toDate() > new Date());
  
  const startMistakesExam = () => {
      if (mistakes.length === 0) return alert("ليس لديك أي أخطاء مسجلة بعد! استمر في التميز 👏");
      const shuffledMistakes = [...mistakes].sort(() => 0.5 - Math.random()).slice(0, 20);
      const generatedExam = {
          id: 'custom_mistakes_exam', title: 'امتحان نقاط الضعف (بنك الأخطاء) 🏦', duration: shuffledMistakes.length * 2, 
          questions: [ { text: 'أجب عن هذه الأسئلة التي أخطأت بها سابقاً:', subQuestions: shuffledMistakes.map(m => m.question) } ]
      };
      setActiveExam(generatedExam);
  };

  const handleChargeSubscriptionCode = async (e) => {
      e.preventDefault();
      if(!subscriptionCodeInput.trim()) return alert("أدخل الكود أولاً");
      setIsCharging(true);
      try {
          const qStr = query(collection(db, 'subscription_codes'), where('code', '==', subscriptionCodeInput.trim()));
          const snap = await getDocs(qStr);
          if(snap.empty) { alert("الكود غير صحيح أو غير موجود."); setIsCharging(false); return; }
          
          const codeDoc = snap.docs[0];
          const codeData = codeDoc.data();
          if(codeData.used) { alert("عفواً، هذا الكود تم استخدامه من قبل."); setIsCharging(false); return; }

          const days = codeData.days;
          let newExpiry = new Date();
          if(isPremium && userData.subscriptionExpiry) {
              newExpiry = userData.subscriptionExpiry.toDate();
          }
          newExpiry.setDate(newExpiry.getDate() + days);

          const batch = writeBatch(db);
          batch.update(doc(db, 'users', user.uid), { subscriptionStatus: 'premium', subscriptionExpiry: newExpiry });
          batch.update(doc(db, 'subscription_codes', codeDoc.id), { used: true, usedBy: user.displayName });
          
          await batch.commit();
          alert(`تم شحن الكود بنجاح! تم تفعيل اشتراكك لمدة ${days} يوم.`);
          setSubscriptionCodeInput('');
      } catch (err) { console.error(err); alert("حدث خطأ أثناء الشحن"); }
      setIsCharging(false);
  };

  const handlePremiumClick = (callback) => {
      if(!isPremium) {
          alert("عفواً يا بطل، هذا المحتوى مخصص للطلاب المشتركين في الباقة المدفوعة (VIP). يرجى شحن حسابك أو التواصل مع المستر لترقية حسابك!");
          setActiveTab('subscription');
      } else {
          callback();
      }
  };

  const handleUpdateMyProfile = async (e) => {
      e.preventDefault();

      const normalizedPhone = normalizeEgyptPhone(editFormData.phone);
      if (!isValidEgyptPhone(normalizedPhone)) {
          return alert("رقم الهاتف غير صحيح! يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015");
      }

      if (normalizedPhone === normalizeEgyptPhone(editFormData.parentPhone)) {
          return alert("لا يمكن أن يكون رقم الطالب هو نفسه رقم ولي الأمر.");
      }

      const payload = { phone: normalizedPhone };

      if (editFormData.grade !== userData.grade) {
          payload.requestedGrade = editFormData.grade;
          payload.gradeUpdateStatus = 'pending';
      }

      await updateDoc(doc(db, 'users', user.uid), payload);
      alert(editFormData.grade !== userData.grade ? "تم حفظ رقم الهاتف وإرسال طلب تغيير المرحلة إلى الأدمن." : "تم تحديث رقم الهاتف بنجاح.");
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

  return (
    <div className="bg-slate-50 relative font-['Cairo'] min-h-screen block" dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} user={user} userName={userData.name} onClose={() => setPlayingVideo(null)} onProgress={(videoId, percent, watchedSeconds) => setVideoProgressMap(prev => ({...prev, [videoId]: { ...(prev[videoId] || {}), watchedPercent: percent, watchedSeconds }}))} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={userData} onClose={() => setPlayingHtml(null)} />}
      <FloatingArabicBackground />
      <ChatWidget user={user} />
      
      <aside className={`fixed top-0 bottom-0 right-0 z-40 bg-white/95 backdrop-blur-xl w-72 p-6 shadow-xl transition-transform duration-300 ${mobileMenu ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} border-l border-slate-200 flex flex-col`}>
        <div className="flex items-center justify-between mb-10 px-2">
            <div className="flex items-center gap-3">
                <ModernLogo />
                <h1 className="text-2xl font-bold font-arabic text-amber-800">النحاس</h1>
            </div>
            <button onClick={() => setMobileMenu(false)} className="md:hidden"><X /></button>
        </div>
        <div className="space-y-2 flex-1 overflow-y-auto pr-2">
          <button onClick={() => {setActiveTab('home'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition ${activeTab==='home'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><User/> الرئيسية</button>
          
          <button onClick={() => {setActiveTab('subscription'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition ${activeTab==='subscription'?'bg-red-100 text-red-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-red-600'}`}><Crown/> الباقة والاشتراك</button>

          {!isBannedContent && (
              <>
                <div onClick={() => {setActiveTab('videos'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='videos'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><PlayCircle/> المحاضرات</div>
                <div onClick={() => {setActiveTab('files'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='files'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><FileText/> الملفات و الروابط</div>
                <div onClick={() => {setActiveTab('htmls'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='htmls'?'bg-purple-100 text-purple-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-purple-600'}`}><Code/> محتوى تفاعلي</div>
              </>
          )}
          {!isBannedExam && (
              <>
                <div onClick={() => {setActiveTab('exams'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='exams'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><ClipboardList/> الامتحانات</div>
                <div onClick={() => {setActiveTab('interactive_exams'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='interactive_exams'?'bg-emerald-100 text-emerald-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'}`}><Sparkles/> امتحان تفاعلي</div>
                <div onClick={() => {setActiveTab('smart_hw_results'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='smart_hw_results'?'bg-blue-100 text-blue-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}><QrCode/> سجل الواجبات (QR)</div>
                <div onClick={() => {setActiveTab('mistakes_bank'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='mistakes_bank'?'bg-red-100 text-red-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-red-600'}`}><BrainCircuit/> بنك الأخطاء</div>
                <div onClick={() => {setActiveTab('assignments'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='assignments'?'bg-blue-100 text-blue-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}><FileCheck/> الواجبات</div>
                <div onClick={() => {setActiveTab('analytics'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='analytics'?'bg-emerald-100 text-emerald-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'}`}><BarChart3/> تحليلي</div>
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
                {installPrompt && ( <button onClick={installPrompt} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-green-500/30 transition flex items-center gap-2"><DownloadCloud size={18}/><span className="hidden md:inline">تثبيت التطبيق</span></button> )}
                <button onClick={() => setShowFocusMode(true)} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-full font-bold shadow-lg transition flex items-center gap-2"><Headphones size={18}/><span className="hidden md:inline">التركيز</span></button>
            </div>
            <div className="flex items-center gap-3">
                {isPremium && <span className="hidden md:flex bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold items-center gap-1 border border-amber-200"><Crown size={14}/> VIP صالح حتى: {userData.subscriptionExpiry?.toDate().toLocaleDateString('ar-EG')}</span>}
                <button onClick={() => {requestNotificationPermission(); setShowNotifications(!showNotifications); setHasNewNotif(false);}} className="relative p-2 glass-panel rounded-full shadow-sm hover:bg-white transition">
                    <Bell className="text-slate-600"/>{hasNewNotif && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                </button>
            </div>
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
                <h2 className="text-3xl font-bold text-slate-800 font-arabic flex flex-wrap items-center gap-2">
                    منور يا <span className="text-amber-600">{userData.name.split(' ')[0]}</span> 👋 
                    <span className="text-sm font-normal text-slate-500 bg-slate-200 px-3 py-1 rounded-full font-sans">{getGradeLabel(userData.grade)}</span>
                    {isPremium ? (
                        <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm"><Crown size={14}/> حساب VIP</span>
                    ) : (
                        <span className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 cursor-pointer" onClick={()=>setActiveTab('subscription')}>مجاني (رقي حسابك)</span>
                    )}
                </h2>
                
                <PerformanceOverview examResults={examResults} content={content} />
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
                    <motion.div whileHover={{ scale: 1.02 }} onClick={()=> setActiveTab('assignments')} className="glass-card p-8 rounded-3xl relative overflow-hidden cursor-pointer group">
                        <h3 className="relative z-10 text-xl font-bold mb-2 text-emerald-900 group-hover:text-emerald-600 transition">الواجبات</h3>
                        <p className="relative z-10 text-3xl font-black text-emerald-600">{assignmentStats.total}</p><FileCheck className="absolute -bottom-6 -left-6 text-emerald-200 opacity-50 w-40 h-40 group-hover:scale-110 transition"/>
                    </motion.div>
                </div>
                <Leaderboard />
            </div>
        )}

        {activeTab === 'subscription' && (
            <div className="glass-panel p-4 md:p-8 rounded-2xl max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <Crown size={64} className={`mx-auto mb-4 ${isPremium ? 'text-amber-500' : 'text-slate-300'}`} />
                    <h2 className="text-3xl font-bold font-arabic text-slate-800 mb-2">حالة اشتراكك</h2>
                    {isPremium ? (
                        <p className="text-green-600 font-bold text-lg bg-green-50 inline-block px-4 py-2 rounded-full border border-green-200">أنت الآن على الباقة المدفوعة (VIP). صالحة حتى: {userData.subscriptionExpiry?.toDate().toLocaleDateString('ar-EG')}</p>
                    ) : (
                        <p className="text-slate-500 font-bold text-lg">حسابك الآن مجاني. اشحن لتتمكن من فتح كل الفيديوهات والامتحانات المغلقة.</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-amber-500">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Key className="text-amber-500"/> شحن بكود (كارت)</h3>
                        <p className="text-slate-500 text-sm mb-6">إذا اشتريت كارت شحن أو حصلت على كود من السنتر، اكتبه هنا لتفعيل اشتراكك فوراً.</p>
                        <form onSubmit={handleChargeSubscriptionCode} className="flex flex-col gap-3">
                            <input 
                                className="border-2 border-slate-200 p-4 rounded-xl text-center font-mono font-bold text-lg tracking-widest focus:border-amber-500 outline-none" 
                                placeholder="مثال: NAHAS-XXXXXX"
                                value={subscriptionCodeInput}
                                onChange={e=>setSubscriptionCodeInput(e.target.value.toUpperCase())}
                            />
                            <button disabled={isCharging} className="bg-amber-600 text-white font-bold py-4 rounded-xl hover:bg-amber-700 shadow-lg flex justify-center items-center">
                                {isCharging ? <Loader2 className="animate-spin" /> : 'اشحن الكود الآن'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-blue-500">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CreditCard className="text-blue-500"/> شحن فودافون كاش / إنستا باي</h3>
                        <p className="text-slate-500 text-sm mb-4">للشحن اليدوي، قم بتحويل قيمة الاشتراك إلى أحد الأرقام التالية:</p>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 text-center">
                            <p className="font-bold text-lg text-blue-900 font-mono">010XXXXXXXX</p>
                            <p className="text-xs text-slate-400 mt-1">(فودافون كاش - إنستا باي)</p>
                        </div>
                        <p className="text-sm font-bold text-slate-700 mb-4">بعد التحويل، أرسل صورة الوصل على الواتساب مع إيميلك ليتم التفعيل.</p>
                        <button onClick={() => window.open("https://wa.me/201500076322", "_blank")} className="w-full bg-green-500 text-white font-bold py-4 rounded-xl hover:bg-green-600 shadow-lg flex items-center justify-center gap-2">
                            <Phone size={20}/> إرسال الوصل واتساب
                        </button>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'mistakes_bank' && !isBannedExam && (
            <div className="glass-panel p-4 md:p-8 rounded-2xl">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold font-arabic text-red-700 flex items-center gap-3"><BrainCircuit size={32} className="text-red-500" /> بنك أخطاء الطالب 🏦</h2>
                        <p className="text-slate-500 mt-2 text-sm md:text-lg">كل سؤال أخطأت فيه سيتم تسجيله هنا لتتمكن من مراجعته والتدرب عليه.</p>
                    </div>
                    <button onClick={startMistakesExam} className="bg-red-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold shadow-xl shadow-red-500/30 hover:bg-red-700 transition flex items-center gap-2 transform hover:scale-105 w-full md:w-auto justify-center"><Target size={20}/> امتحان من أخطائي</button>
                </div>
                {mistakes.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm"><Trophy size={64} className="mx-auto text-amber-400 mb-4 opacity-80" /><h3 className="text-2xl font-bold text-slate-700">ممتاز جداً يا بطل! 👏</h3><p className="text-slate-500 mt-2">بنك الأخطاء الخاص بك فارغ تماماً. استمر على هذا المستوى.</p></div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 font-bold flex items-center gap-2 text-sm md:text-base">
                            <AlertOctagon /> لديك {mistakes.length} سؤال في بنك الأخطاء. يجب مراجعتها جيداً قبل الامتحان النهائي!
                        </div>
                        {mistakes.map(m => (
                            <div key={m.id} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-red-300 transition relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-slate-800 text-white text-xs px-3 py-1 rounded-bl-lg font-bold">من امتحان: {m.examTitle}</div>
                                <h3 className="text-lg md:text-xl font-bold text-slate-800 mt-6 md:mt-4 mb-4 leading-relaxed font-sans">{m.question.text}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100"><p className="text-xs text-red-500 font-bold mb-1">إجابتك الخاطئة كانت:</p><p className="font-bold text-slate-800">{m.question.studentAnswerText || 'غير معروف'}</p></div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100"><p className="text-xs text-green-600 font-bold mb-1">الإجابة الصحيحة هي:</p><p className="font-bold text-green-800">{m.question.correctAnswerText || 'غير معروف'}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
        
        {activeTab === 'videos' && !isBannedContent && (
            <div className="space-y-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-200">
                    <button onClick={() => setVideoSectionTab('explanation')} className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition ${videoSectionTab === 'explanation' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}>شرح الدروس</button>
                    <button onClick={() => setVideoSectionTab('exercises')} className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition ${videoSectionTab === 'exercises' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}>حل التدريبات</button>
                    <button onClick={() => setVideoSectionTab('reviews')} className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition ${videoSectionTab === 'reviews' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}>المراجعات النهائية</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {videos.filter(v => (v.videoSection || 'explanation') === videoSectionTab).length === 0 ? (
                         <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
                             <PlayCircle className="mx-auto text-slate-300 w-16 h-16 mb-4"/>
                             <p className="text-slate-500 font-bold">لا توجد فيديوهات في هذا القسم حالياً.</p>
                         </div>
                    ) : videos.filter(v => (v.videoSection || 'explanation') === videoSectionTab).map(v => (
                        <div key={v.id} className="glass-card rounded-xl overflow-hidden relative group">
                            <div className="h-48 bg-gradient-to-br from-slate-800 to-black flex items-center justify-center relative cursor-pointer" onClick={() => handlePremiumClick(() => setPlayingVideo(v))}>
                                {v.isPremium && !isPremium ? <Lock className="text-slate-400 w-16 h-16 opacity-80" /> : <PlayCircle className="text-white w-16 h-16 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/>}
                                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(v.grade)}</span>
                                {v.isPremium && <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-md"><Crown size={12}/> VIP</span>}
                                <span className="absolute bottom-2 right-2 bg-white/10 text-white text-xs px-2 py-1 rounded-full border border-white/10">{getVideoWatchPercent(v)}%</span>
                            </div>
                            <div className="p-4 space-y-3"><h3 className={`font-bold text-lg ${v.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'}`}>{v.title}</h3><div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden"><div className="bg-blue-600 h-2 rounded-full" style={{width: `${Math.min(100, getVideoWatchPercent(v))}%`}}></div></div>{v.linkedExamId && <button onClick={() => openLinkedExamFromVideo(v)} className={`w-full py-2 rounded-xl font-bold text-sm ${canOpenLinkedExam(v) ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500'}`}>{canOpenLinkedExam(v) ? 'ابدأ امتحان الفيديو' : `شاهد 75% أولاً (${getVideoWatchPercent(v)}%)`}</button>}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'files' && !isBannedContent && (
            <div className="glass-panel rounded-xl overflow-hidden">
                {filesAndLinks.map(f => (
                    <div key={f.id} className="p-4 flex flex-col md:flex-row justify-between md:items-center border-b last:border-0 hover:bg-white/50 transition gap-4">
                        <div className="flex items-center gap-4">
                            {f.type === 'link' ? (<div className="bg-blue-100 text-blue-600 p-3 rounded-lg font-bold text-xs shadow-sm flex items-center justify-center"><LinkIcon size={16}/></div>) : (<div className="bg-red-100 text-red-600 p-3 rounded-lg font-bold text-xs shadow-sm">PDF</div>)}
                            <div>
                                <h4 className={`font-bold text-lg ${f.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'} flex items-center gap-2`}>
                                    {f.title}
                                    {f.isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Crown size={10}/> VIP</span>}
                                </h4>
                                <span className="text-xs text-slate-500">{getGradeLabel(f.grade)}</span>
                            </div>
                        </div>
                        {f.isPremium && !isPremium ? (
                            <button onClick={()=>handlePremiumClick(()=>{})} className="px-4 py-2 rounded-lg font-bold transition shadow-sm bg-slate-100 text-slate-400 flex items-center justify-center gap-2"><Lock size={16}/> مقفل</button>
                        ) : (
                            <a href={f.url} target="_blank" rel="noopener noreferrer" className={`px-4 py-2 rounded-lg font-bold transition shadow-sm text-center ${f.type === 'link' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>{f.type === 'link' ? 'فتح الرابط' : 'تحميل'}</a>
                        )}
                    </div>
                ))}
            </div>
        )}
        
        {activeTab === 'htmls' && !isBannedContent && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {htmls.map(h => (
                    <motion.div whileHover={{y:-5}} key={h.id} className="glass-card rounded-xl overflow-hidden cursor-pointer relative" onClick={() => handlePremiumClick(() => setPlayingHtml(h))}>
                        <div className="h-48 bg-gradient-to-br from-purple-600 to-indigo-900 flex items-center justify-center relative group">
                            {h.isPremium && !isPremium ? <Lock className="text-slate-400 w-20 h-20 opacity-80" /> : <Code className="text-white w-20 h-20 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/>}
                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(h.grade)}</span>
                            {h.isPremium && <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-md"><Crown size={12}/> VIP</span>}
                        </div>
                        <div className="p-4"><h3 className={`font-bold text-lg ${h.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'}`}>{h.title}</h3><button className={`mt-2 w-full font-bold py-2 rounded-lg transition shadow-sm ${h.isPremium && !isPremium ? 'bg-slate-100 text-slate-400' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>{h.isPremium && !isPremium ? 'مقفل' : 'تشغيل'}</button></div>
                    </motion.div>
                ))}
            </div>
        )}

        {activeTab === 'interactive_exams' && !isBannedExam && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {interactiveExams.map(h => (
                    <motion.div whileHover={{y:-5}} key={h.id} className="glass-card rounded-xl overflow-hidden cursor-pointer relative" onClick={() => handlePremiumClick(() => setPlayingHtml(h))}>
                        <div className="h-48 bg-gradient-to-br from-emerald-600 to-teal-900 flex items-center justify-center relative group">
                            {h.isPremium && !isPremium ? <Lock className="text-slate-400 w-20 h-20 opacity-80" /> : <Sparkles className="text-white w-20 h-20 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/>}
                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(h.grade)}</span>
                            {h.isPremium && <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-md"><Crown size={12}/> VIP</span>}
                        </div>
                        <div className="p-4"><h3 className={`font-bold text-lg ${h.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'}`}>{h.title}</h3><button className={`mt-2 w-full font-bold py-2 rounded-lg transition shadow-sm ${h.isPremium && !isPremium ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>{h.isPremium && !isPremium ? 'مقفل' : 'بدء الامتحان'}</button></div>
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
                  <motion.div whileHover={{scale:1.01}} key={e.id} className={`glass-card p-4 md:p-6 rounded-2xl relative overflow-hidden flex flex-col ${e.isPremium && !isPremium ? 'opacity-70' : ''}`}>
                    {statusText && <div className={`absolute top-0 left-0 text-[10px] md:text-xs px-2 md:px-3 py-1 rounded-br-xl font-bold shadow-md ${statusClass}`}>{statusText}</div>}
                    {e.isPremium && <div className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1"><Crown size={12}/> VIP</div>}
                    
                    <h3 className={`text-lg md:text-xl font-bold mb-2 mt-4 md:mt-0 ${e.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'}`}>{e.title}</h3>
                    <div className="flex justify-between text-xs md:text-sm text-slate-500 mb-4"><span>⏳ {e.duration} دقيقة</span><span>📝 {e.questions.reduce((acc,g)=>acc+g.subQuestions.length,0)} سؤال</span></div>
                    
                    <div className="mt-auto">
                        {prevResult && prevResult.status === 'completed' ? (
                            <div className="flex flex-col sm:flex-row gap-2">
                                 <button disabled className="flex-1 bg-slate-200 text-slate-500 py-2 md:py-3 rounded-xl font-bold cursor-not-allowed text-xs md:text-sm">تم الانتهاء</button>
                                 {isExamTimeOver ? (
                                    <button onClick={() => setReviewingExam(e)} className="flex-1 bg-blue-100 text-blue-700 py-2 md:py-3 rounded-xl font-bold hover:bg-blue-200 transition shadow-sm text-xs md:text-sm">عرض الأخطاء</button>
                                 ) : (
                                    <button disabled className="flex-1 bg-gray-100 text-gray-400 py-2 md:py-3 rounded-xl font-bold cursor-not-allowed text-[10px] md:text-xs">المراجعة بعد الوقت</button>
                                 )}
                                 <button onClick={() => generatePDF('student', {studentName: user.displayName, score: prevResult.score, total: e.questions.reduce((acc,g)=>acc+g.subQuestions.length,0), status: prevResult.status, examTitle: e.title, questions: e.questions.flatMap(q => q.subQuestions), answers: prevResult.answers })} className="flex-1 bg-green-100 text-green-700 py-2 md:py-3 rounded-xl font-bold hover:bg-green-200 flex items-center justify-center gap-1 transition shadow-sm text-xs md:text-sm"><Download size={14}/> شهادة</button>
                            </div>
                        ) : prevResult ? (
                            <div className="bg-red-50 text-red-600 p-2 md:p-3 rounded-xl font-bold text-center border border-red-200 text-sm">لا يمكن إعادة الامتحان</div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs text-slate-500">يبدأ: {new Date(e.startTime).toLocaleString('ar-EG')}</p>
                                {e.isPremium && !isPremium ? (
                                    <button onClick={()=>handlePremiumClick(()=>{})} className="w-full bg-slate-200 text-slate-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed text-sm"><Lock size={16}/> امتحان مقفل (للمشتركين)</button>
                                ) : (
                                    <button onClick={() => startExamWithCode(e)} className="w-full bg-slate-900 text-white py-2 md:py-3 rounded-xl font-bold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-lg hover:shadow-slate-500/30 transition text-sm"><Lock size={14}/> ابدأ الامتحان</button>
                                )}
                            </div>
                        )}
                    </div>
                  </motion.div>
                )
             })}
          </div>
        )}

        {activeTab === 'assignments' && !isBannedExam && (<StudentAssignmentsPanel assignments={assignments} submissions={assignmentSubmissions} user={user} userData={userData} />)}

        {activeTab === 'analytics' && (
            <div className="space-y-6">
                <PerformanceOverview examResults={examResults} content={content} />
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2"><Lamp/> التوصيات الذكية</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getReviewRecommendations(examResults.filter(r => r.status === 'completed').reduce((acc, r) => { Object.entries(r.branchStats || {}).forEach(([k,v]) => { acc[k] = acc[k] || { earned:0, possible:0 }; acc[k].earned += safeNumber(v.earned); acc[k].possible += safeNumber(v.possible); }); return acc; }, {}), content).map((rec, idx) => (
                            <div key={idx} className="bg-white border rounded-xl p-4 font-bold text-slate-700">{rec.title} — {rec.branch}</div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'smart_hw_results' && !isBannedExam && (
            <div className="glass-panel p-4 md:p-6 rounded-xl">
                <h2 className="text-xl md:text-2xl font-bold mb-6 font-arabic text-blue-800 flex items-center gap-2"><QrCode/> سجل الواجبات الذكية (QR)</h2>
                {hwResults.length === 0 ? (
                    <p className="text-slate-500 text-center py-10 bg-white rounded-xl border font-bold text-sm md:text-base">لم تقم بتسليم أي واجب ذكي عبر الكاميرا حتى الآن.</p>
                ) : (
                    <div className="space-y-6">
                        {(() => {
                            const hwByBook = hwResults.reduce((acc, hw) => { const book = hw.bookName || 'كتب غير مصنفة'; if(!acc[book]) acc[book] = []; acc[book].push(hw); return acc; }, {});
                            return Object.entries(hwByBook).map(([bookName, hws]) => (
                                <div key={bookName} className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
                                    <h4 className="font-bold text-base md:text-lg text-amber-700 bg-amber-100 p-2 rounded-lg mb-4 flex items-center gap-2 w-max"><BookOpen size={18}/> كتاب: {bookName}</h4>
                                    <div className="space-y-3 pl-4 border-r-4 border-amber-300 pr-4 w-max min-w-full">
                                        {hws.map(hw => (
                                            <div key={hw.id} className="bg-white border shadow-sm p-4 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-amber-400 transition">
                                                <div className="flex-1">
                                                    <p className="font-bold text-base md:text-lg text-slate-800">{hw.homeworkTitle}</p>
                                                    <p className="text-xs md:text-sm text-slate-500 mb-2 mt-1 bg-slate-50 p-2 rounded text-wrap break-words whitespace-normal">تعليق المصحح: <span className="font-bold text-blue-600">{hw.feedback}</span></p>
                                                </div>
                                                <div className="flex flex-col md:items-end gap-2 flex-shrink-0 border-t md:border-t-0 pt-2 md:pt-0 mt-2 md:mt-0">
                                                    <span className="text-lg md:text-xl font-black text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200 w-fit">{hw.score} / {hw.total}</span>
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
              <div className="glass-panel p-4 md:p-8 rounded-xl max-w-2xl mx-auto">
                <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2 font-arabic text-slate-800"><Settings className="text-slate-700"/> إعدادات الحساب</h2>
                {userData.gradeUpdateStatus === 'pending' && (
                    <div className="mb-4 bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200 flex flex-col md:flex-row items-center gap-2 font-bold text-center md:text-right text-sm">
                        <RefreshCw className="animate-spin-slow" size={20} /> 
                        لقد قمت بطلب تغيير المرحلة إلى {getGradeLabel(userData.requestedGrade)}. الطلب قيد المراجعة.
                    </div>
                )}
                <form onSubmit={handleUpdateMyProfile} className="space-y-4">
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">الاسم</label><input disabled className="w-full border p-3 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed" value={editFormData.name} /><p className="text-xs text-red-500 mt-1">لا يمكن تغيير الاسم (تواصل مع الإدارة).</p></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label><input className="w-full border p-3 rounded-xl" value={editFormData.phone} onChange={e=>setEditFormData({...editFormData, phone: normalizeEgyptPhone(e.target.value)})} /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">رقم ولي الأمر</label><input disabled className="w-full border p-3 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed" value={editFormData.parentPhone} /><p className="text-xs text-red-500 mt-1">لا يمكن تغيير رقم ولي الأمر.</p></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">الصف الدراسي (يتطلب موافقة الأدمن)</label><select className="w-full border p-3 rounded-xl bg-white" value={editFormData.grade} onChange={e=>setEditFormData({...editFormData, grade:e.target.value})}><GradeOptions /></select></div>
                  <button className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/40 transition mt-4">حفظ التعديلات</button>
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
    <div className="min-h-screen font-['Cairo'] relative overflow-x-hidden" dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} user={null} userName="زائر" onClose={() => setPlayingVideo(null)} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={null} onClose={() => setPlayingHtml(null)} />}
      <FloatingArabicBackground />
      <ChatWidget />
      <nav className="relative z-10 flex justify-between items-center p-4 md:p-6 max-w-7xl mx-auto glass-panel mt-4 rounded-full mx-2 md:mx-4 shadow-lg">
        <div className="flex items-center gap-2"><ModernLogo /><span className="text-xl md:text-2xl font-bold font-arabic text-amber-800 hidden md:block">منصة النحاس</span></div>
        <div className="flex gap-2 md:gap-4 items-center">
          {installPrompt && ( <button onClick={installPrompt} className="hidden md:flex bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-green-500/30 transition items-center gap-2"><DownloadCloud size={18}/> تثبيت</button> )}
          <button onClick={openFacebook} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/50"><Facebook size={20}/></button>
          <button onClick={onAuthClick} className="bg-slate-900 text-white px-4 md:px-6 py-2 rounded-full font-bold shadow-lg hover:shadow-slate-500/50 transition transform hover:-translate-y-0.5 text-sm md:text-base">دخول الطالب</button>
        </div>
      </nav>
      <main className="relative z-10 px-4 mt-10 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-6 leading-tight">اللغة العربية <span className="text-amber-600">لعبتك</span></h1>
        <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">أقوى منصة تعليمية للمرحلة الإعدادية والثانوية.</p>
        <button onClick={onAuthClick} className="bg-amber-600 text-white px-8 md:px-10 py-3 md:py-4 rounded-2xl text-lg md:text-xl font-bold shadow-xl hover:bg-amber-700 transition transform hover:-translate-y-1">اشترك الآن 🚀</button>
        {installPrompt && (<div className="md:hidden mt-6"><button onClick={installPrompt} className="bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 mx-auto text-sm"><DownloadCloud size={18}/> تثبيت المنصة على هاتفك</button></div>)}
        <div className="my-12 px-2"><WisdomBox /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-10 mb-20 px-2">
          <div className="bg-white/80 backdrop-blur p-4 md:p-6 rounded-3xl border border-white shadow-sm overflow-hidden">
            <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 text-blue-700"><Video /> فيديوهات للجميع</h3>
            <div className="space-y-4">
              {publicContent.filter(c => c.type === 'video').length > 0 ? publicContent.filter(c => c.type === 'video').map((v, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm cursor-pointer hover:bg-gray-50" onClick={() => setPlayingVideo(v)}>
                     <div className="flex items-center gap-3 overflow-hidden">
                         <PlayCircle className="text-amber-500 shrink-0"/>
                         <span className="font-bold truncate text-sm md:text-base">{v.title}</span>
                     </div>
                     <span className="text-[10px] md:text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded shrink-0">مشاهدة</span>
                 </div>
               )) : <p className="text-slate-500 text-sm">لا توجد فيديوهات عامة حالياً</p>}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur p-4 md:p-6 rounded-3xl border border-white shadow-sm overflow-hidden">
            <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 text-purple-700"><Code /> تفاعلي للجميع</h3>
            <div className="space-y-4">
              {publicContent.filter(c => c.type === 'html').length > 0 ? publicContent.filter(c => c.type === 'html').map((h, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm cursor-pointer hover:bg-gray-50" onClick={() => setPlayingHtml(h)}>
                     <div className="flex items-center gap-3 overflow-hidden">
                         <Code className="text-purple-500 shrink-0"/>
                         <span className="font-bold truncate text-sm md:text-base">{h.title}</span>
                     </div>
                     <span className="text-[10px] md:text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded shrink-0">تشغيل</span>
                 </div>
               )) : <p className="text-slate-500 text-sm">لا يوجد محتوى تفاعلي عام حالياً</p>}
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

    if (isRegister) {
        const validation = validateEgyptianPhones(formData.phone, formData.parentPhone);
        if (!validation.ok) {
            alert(validation.message);
            setLoading(false);
            return;
        }
    }

    try {
      if (isRegister) {
        const validation = validateEgyptianPhones(formData.phone, formData.parentPhone);
        const userCred = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        await updateProfile(userCred.user, { displayName: formData.name.trim() });
        await setDoc(doc(db, 'users', userCred.user.uid), { 
            name: formData.name.trim(), email: formData.email.trim(), grade: formData.grade, phone: validation.normalizedStudentPhone, 
            parentPhone: validation.normalizedParentPhone, role: 'student', status: 'pending', 
            subscriptionStatus: 'free', subscriptionExpiry: null, createdAt: new Date() 
        });
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
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative z-10 my-10 overflow-y-auto max-h-[90vh] border border-white/50 scrollbar-hide">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-sm mb-4 md:mb-6 flex items-center gap-1 font-bold"><ChevronRight size={18} /> العودة</button>
        <div className="flex justify-center mb-4"><ModernLogo /></div>
        <h2 className="text-2xl md:text-3xl font-bold font-arabic text-slate-800 mb-2 text-center">{isRegister ? 'حساب جديد' : 'تسجيل دخول'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:gap-4 mt-4 md:mt-6">
          {isRegister && (
            <>
              <div className="relative"><User className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="text" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="الاسم ثلاثي" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="relative"><Phone className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="tel" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="رقم هاتفك" value={formData.phone} onChange={e => setFormData({...formData, phone: normalizeEgyptPhone(e.target.value)})} /></div>
              <div className="relative"><Phone className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="tel" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="رقم ولي الأمر" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: normalizeEgyptPhone(e.target.value)})} /></div>
              <div className="relative"><GraduationCap className="absolute top-3.5 right-4 text-slate-400" size={18} /><select className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 appearance-none focus:border-amber-500 outline-none transition text-sm md:text-base" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}><GradeOptions /></select></div>
            </>
          )}
          <div className="relative"><Mail className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="email" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="البريد" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          <div className="relative"><Lock className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="password" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="كلمة السر" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
          {!isRegister && (<div className="text-left"><button type="button" onClick={handleForgotPassword} className="text-xs text-amber-600 font-bold hover:underline">نسيت كلمة السر؟</button></div>)}
          <button disabled={loading} className="bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/50 transition mt-2 flex justify-center">{loading ? <Loader2 className="animate-spin" /> : (isRegister ? 'تسجيل' : 'دخول')}</button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)} className="mt-4 md:mt-6 text-amber-800 font-bold hover:underline w-full text-center block text-sm">{isRegister ? 'تسجيل الدخول' : 'حساب جديد'}</button>
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