import React, { useState, useEffect, useRef, useMemo } from 'react';
import {  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail 
} from 'firebase/auth';
import {  doc, setDoc, getDoc, getDocs, collection, addDoc, query, where, 
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
  Target, AlertCircle, Crown, CreditCard, Key, Wand2, WalletCards, Smartphone
} from '../../shared/icons/lucide-shim.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, savePushTokenForUser, setupForegroundPushListener } from '../../services/firebase';
import SecureVideoPlayer from '../../features/lectures/SecureVideoPlayer';
import MobileStudentBottomNav from '../../features/student/MobileStudentBottomNav';
import MobileExamHelperStyles from '../../shared/components/MobileExamHelperStyles';
import DesignSystemLoader from '../../shared/components/DesignSystemLoader';
import { GradeOptions, getGradeLabel } from '../../shared/constants/grades';
import { normalizeEgyptPhone, isValidEgyptPhone, validateEgyptianPhones } from '../../shared/utils/phone';
import { PWAInstallBox, ModernLogo, FloatingArabicBackground, WisdomBox, Announcements, Leaderboard } from '../../features/home/HomeWidgets';
import PomodoroFocusMode from '../../features/study/PomodoroFocusMode';
import InteractiveViewer from '../../features/content/InteractiveViewer';
import { AdminCoursesManager, StudentCoursesHub } from '../../features/courses/CourseSystem';
import { uploadToCloudinary } from '../../services/cloudinaryUpload';
import { uploadToFirebaseContent, detectContentType, readHtmlFileAsInlineContent } from '../../services/firebaseContentUpload';
import {
  platformNotify,
  platformConfirm,
  platformPrompt,
  ToastCenter,
  formatWatchTime,
  requestNotificationPermission,
  sendSystemNotification,
  getYouTubeID,
  PLATFORM_WHATSAPP_NUMBER,
  openPlatformWhatsApp,
  WhatsAppContactButton,
  renderBracketHighlightedText,
  getQuestionsForExam,
  generatePDF,
  safeNumber,
  getResultPercentage,
  getGradeBadge,
  VIDEO_EXAM_UNLOCK_PERCENT,
  InlineTabs,
  TabPaneCard,
  getQuestionMaxScore,
  extractAllQuestions,
  calculateDetailedExamMetrics,
  getPerformanceInsights,
  getReviewRecommendations,
  StudentLocalAdvice,
  StudentLocalHomeCoach,
  LocalQuestionExplanation,
  LocalEssayReviewBox
} from '../../shared/core/platformShared.jsx';
import { isActiveAdminSnapshot, getInitialRouteMode, navigatePlatform, DebugCollector, DebugPanel } from '../../shared/core/debugTools.jsx';




export const QuestionBankManager = ({ adminGradeFilter }) => {
  const [questions, setQuestions] = useState([]);
  const [filters, setFilters] = useState({ grade: adminGradeFilter === 'all' ? '' : adminGradeFilter, branch: '', type: '' });
  const [form, setForm] = useState({ text: '', grade: adminGradeFilter === 'all' ? '3sec' : adminGradeFilter, branch: 'النحو', type: 'mcq', difficulty: 'medium', optionsText: '', correctIdx: 0, explanation: '', mark: 1, tags: '' });

  useEffect(() => {
      const unsub = onSnapshot(collection(db, 'question_bank'), (snap) => {
          const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setQuestions(rows);
      }, (error) => {
          console.warn('question_bank listener blocked:', error?.message);
          setQuestions([]);
      });
      return () => unsub();
  }, []);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    const options = form.type === 'mcq' ? form.optionsText.split('\n').map(o => o.trim()).filter(Boolean) : [];
    if (!form.text.trim()) return platformNotify('اكتب نص السؤال أولاً');
    if (form.type === 'mcq' && options.length < 2) return platformNotify('أضف اختيارين على الأقل');
    await addDoc(collection(db, 'question_bank'), {
      text: form.text.trim(),
      grade: form.grade,
      branch: form.branch,
      type: form.type,
      difficulty: form.difficulty,
      options,
      correctIdx: safeNumber(form.correctIdx, 0),
      explanation: form.explanation,
      mark: safeNumber(form.mark, form.type === 'essay' ? 10 : 1),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: serverTimestamp()
    });
    setForm(prev => ({ ...prev, text: '', optionsText: '', explanation: '', tags: '' }));
  };

  const createExamFromBank = async () => {
    const pool = questions.filter(q => (!filters.grade || q.grade === filters.grade) && (!filters.branch || q.branch === filters.branch) && (!filters.type || q.type === filters.type));
    if (pool.length === 0) return platformNotify('لا توجد أسئلة مطابقة للفلاتر الحالية');
    const selected = pool.slice(0, Math.min(pool.length, 20));
    const grouped = {};
    selected.forEach(q => {
      grouped[q.branch] = grouped[q.branch] || { text: '', subQuestions: [] };
      grouped[q.branch].subQuestions.push({
        id: `qb_${q.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        text: q.text,
        options: q.options || [],
        correctIdx: q.correctIdx ?? 0,
        branch: q.branch,
        type: q.type || 'mcq',
        explanation: q.explanation || '',
        maxScore: getQuestionMaxScore(q),
        modelAnswer: q.modelAnswer || ''
      });
    });
    await addDoc(collection(db, 'exams'), {
      title: `امتحان مُولَّد من بنك الأسئلة - ${getGradeLabel(filters.grade || selected[0].grade)}`,
      grade: filters.grade || selected[0].grade,
      duration: Math.max(15, selected.length * 2),
      startTime: new Date().toISOString().slice(0,16),
      endTime: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0,16),
      accessCode: Math.random().toString(36).slice(2, 7).toUpperCase(),
      isPremium: false,
      questions: Object.values(grouped),
      createdAt: serverTimestamp(),
      source: 'question_bank'
    });
    platformNotify('تم إنشاء امتحان جديد من بنك الأسئلة بنجاح');
  };

  const visible = questions.filter(q => (!filters.grade || q.grade === filters.grade) && (!filters.branch || q.branch === filters.branch) && (!filters.type || q.type === filters.type));

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 md:p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-indigo-700 flex items-center gap-2"><Layers/> بنك الأسئلة</h2>
        <form onSubmit={handleAddQuestion} className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select className="border p-3 rounded" value={form.grade} onChange={e=>setForm({...form, grade:e.target.value})}><GradeOptions/></select>
            <input className="border p-3 rounded" placeholder="الفرع مثل النحو أو الأدب" value={form.branch} onChange={e=>setForm({...form, branch:e.target.value})}/>
            <select className="border p-3 rounded" value={form.type} onChange={e=>setForm({...form, type:e.target.value, mark: e.target.value === 'essay' ? 10 : 1})}>
              <option value="mcq">اختياري</option><option value="essay">مقالي</option>
            </select>
            <select className="border p-3 rounded" value={form.difficulty} onChange={e=>setForm({...form, difficulty:e.target.value})}>
              <option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option>
            </select>
          </div>
          <textarea className="border p-3 rounded h-24" placeholder="نص السؤال" value={form.text} onChange={e=>setForm({...form, text:e.target.value})}/>
          {form.type === 'mcq' && <textarea className="border p-3 rounded h-28 font-mono" placeholder="كل اختيار في سطر منفصل" value={form.optionsText} onChange={e=>setForm({...form, optionsText:e.target.value})}/>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {form.type === 'mcq' && <input type="number" min="0" className="border p-3 rounded" placeholder="رقم الإجابة الصحيحة" value={form.correctIdx} onChange={e=>setForm({...form, correctIdx:e.target.value})}/>}
            <input type="number" min="1" className="border p-3 rounded" placeholder="درجة السؤال" value={form.mark} onChange={e=>setForm({...form, mark:e.target.value})}/>
            <input className="border p-3 rounded" placeholder="tags مفصولة بفاصلة" value={form.tags} onChange={e=>setForm({...form, tags:e.target.value})}/>
          </div>
          <textarea className="border p-3 rounded h-20" placeholder="شرح الإجابة / قاعدة المراجعة الذكية" value={form.explanation} onChange={e=>setForm({...form, explanation:e.target.value})}/>
          <div className="flex flex-col md:flex-row gap-3">
            <button className="bg-indigo-600 text-white py-3 px-6 rounded-xl font-bold">إضافة للسجل</button>
            <button type="button" onClick={createExamFromBank} className="bg-emerald-600 text-white py-3 px-6 rounded-xl font-bold">توليد امتحان من الفلاتر الحالية</button>
          </div>
        </form>
      </div>
      <div className="glass-panel p-4 md:p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select className="border p-3 rounded" value={filters.grade} onChange={e=>setFilters({...filters, grade:e.target.value})}><option value="">كل المراحل</option><GradeOptions/></select>
          <input className="border p-3 rounded" placeholder="فلترة الفرع" value={filters.branch} onChange={e=>setFilters({...filters, branch:e.target.value})}/>
          <select className="border p-3 rounded" value={filters.type} onChange={e=>setFilters({...filters, type:e.target.value})}><option value="">كل الأنواع</option><option value="mcq">اختياري</option><option value="essay">مقالي</option></select>
        </div>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {visible.map(q => <div key={q.id} className="bg-white border rounded-xl p-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">{getGradeLabel(q.grade)}</span>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{q.branch}</span>
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded">{q.type === 'essay' ? 'مقالي' : 'اختياري'}</span>
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded">{getQuestionMaxScore(q)} درجة</span>
            </div>
            <p className="font-bold text-slate-800">{q.text}</p>
            {q.explanation && <p className="text-xs text-slate-500 mt-2">شرح: {q.explanation}</p>}
          </div>)}
          {visible.length === 0 && <p className="text-slate-500 text-center py-8">لا توجد أسئلة مطابقة.</p>}
        </div>
      </div>
    </div>
  );
};

export default QuestionBankManager;
