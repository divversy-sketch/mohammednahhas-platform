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




export const AssignmentsManager = ({ adminGradeFilter }) => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState({ title: '', grade: adminGradeFilter === 'all' ? '3sec' : adminGradeFilter, branch: 'التعبير', description: '', dueDate: '', totalMarks: 20, deliveryType: 'text_or_image' });
  const [submissionFilter, setSubmissionFilter] = useState('pending');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'assignments'), snap => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setAssignments(rows);
    }, error => { console.warn('assignments listener blocked:', error?.message); setAssignments([]); });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'assignment_submissions'), snap => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
      setSubmissions(rows);
    }, error => { console.warn('assignment_submissions listener blocked:', error?.message); setSubmissions([]); });
    return () => unsub();
  }, []);

  const createAssignment = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return platformNotify('اكتب عنوان الواجب');
    await addDoc(collection(db, 'assignments'), { ...form, totalMarks: safeNumber(form.totalMarks, 20), createdAt: serverTimestamp(), status: 'active' });
    setForm(prev => ({ ...prev, title: '', description: '' }));
  };

  const reviewSubmission = async (submission) => {
    const scoreValue = platformPrompt('أدخل الدرجة التي حصل عليها الطالب', submission.score ?? 0);
    if (scoreValue === null) return;
    const maxValue = platformPrompt('ومن كام؟', submission.maxScore ?? submission.totalMarks ?? 20);
    if (maxValue === null) return;
    const feedback = platformPrompt('تعليقك على الواجب', submission.feedback || '');
    await updateDoc(doc(db, 'assignment_submissions', submission.id), {
      score: safeNumber(scoreValue, 0),
      maxScore: safeNumber(maxValue, submission.totalMarks ?? 20),
      feedback: feedback || '',
      reviewStatus: 'graded',
      gradedAt: serverTimestamp()
    });
    platformNotify('تم حفظ تصحيح الواجب');
  };

  const visibleSubmissions = submissions.filter(item => {
    if (adminGradeFilter !== 'all' && item.grade !== adminGradeFilter) return false;
    if (submissionFilter === 'pending') return item.reviewStatus !== 'graded';
    if (submissionFilter === 'graded') return item.reviewStatus === 'graded';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2"><FileCheck/> نظام الواجبات</h2>
        <form onSubmit={createAssignment} className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input className="border p-3 rounded md:col-span-2" placeholder="عنوان الواجب" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
            <select className="border p-3 rounded" value={form.grade} onChange={e=>setForm({...form, grade:e.target.value})}><GradeOptions/></select>
            <input className="border p-3 rounded" placeholder="الفرع" value={form.branch} onChange={e=>setForm({...form, branch:e.target.value})} />
          </div>
          <textarea className="border p-3 rounded h-24" placeholder="وصف الواجب والتعليمات" value={form.description} onChange={e=>setForm({...form, description:e.target.value})}></textarea>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="datetime-local" className="border p-3 rounded" value={form.dueDate} onChange={e=>setForm({...form, dueDate:e.target.value})} />
            <input type="number" className="border p-3 rounded" value={form.totalMarks} onChange={e=>setForm({...form, totalMarks:e.target.value})} />
            <select className="border p-3 rounded" value={form.deliveryType} onChange={e=>setForm({...form, deliveryType:e.target.value})}>
              <option value="text_or_image">نص أو صورة</option><option value="image_only">صورة فقط</option><option value="text_only">نص فقط</option>
            </select>
          </div>
          <button className="bg-blue-600 text-white py-3 rounded-xl font-bold">نشر الواجب</button>
        </form>
      </div>
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <h3 className="font-bold text-slate-800">التسليمات</h3>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            {[["pending","غير مصحح"], ["graded","مصحح"], ["all","الكل"]].map(([key,label]) => (
              <button key={key} onClick={() => setSubmissionFilter(key)} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold ${submissionFilter === key ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>{label}</button>
            ))}
          </div>
        </div>
        <div className="space-y-3 max-h-[550px] overflow-y-auto">
          {visibleSubmissions.map(item => <div key={item.id} className="bg-white border rounded-2xl p-4">
            <div className="flex flex-col md:flex-row justify-between gap-3">
              <div>
                <p className="font-bold text-slate-800">{item.studentName} — {item.assignmentTitle}</p>
                <p className="text-xs text-slate-500 mt-1">{item.branch} • {getGradeLabel(item.grade)}</p>
                {item.answerText && <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl mt-2 whitespace-pre-wrap">{item.answerText}</p>}
                {item.answerImage && <img src={item.answerImage} alt="assignment" className="w-40 h-40 object-cover rounded-xl border mt-2" />}
              </div>
              <div className="flex flex-col gap-2 min-w-[180px]">
                <div className="text-xs bg-slate-100 px-3 py-2 rounded-xl text-center">{item.reviewStatus === 'graded' ? `تم التصحيح: ${item.score}/${item.maxScore}` : 'بانتظار التصحيح'}</div>
                <button onClick={() => reviewSubmission(item)} className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-bold">تصحيح الواجب</button>
              </div>
            </div>
          </div>)}
          {visibleSubmissions.length === 0 && <p className="text-slate-500 text-center py-8">لا توجد تسليمات مطابقة لهذا الفلتر.</p>}
        </div>
      </div>
    </div>
  );
};

export default AssignmentsManager;
