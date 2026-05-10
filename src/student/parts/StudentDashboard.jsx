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



import ExamRunner from '../../shared/platformParts/ExamRunner.jsx';
import PerformanceOverview from './PerformanceOverview.jsx';
import { useStudentDashboardData } from '../hooks/useStudentDashboardData.js';

export const StudentDashboard = ({ user, userData, installPrompt }) => {
  userData = userData || {
    name: user?.displayName || user?.email?.split('@')?.[0] || 'طالب',
    email: user?.email || '',
    grade: '1sec',
    phone: '',
    parentPhone: '',
    role: 'student',
    status: 'pending',
    subscriptionStatus: 'free',
    subscriptionExpiry: null
  };
  userData.name = userData?.name || user?.displayName || user?.email?.split('@')?.[0] || 'طالب';
  userData.grade = userData?.grade || '1sec';
  const [activeTab, setActiveTab] = useState('home');
  const [videoSectionTab, setVideoSectionTab] = useState('recorded');
  const [lectureInnerTab, setLectureInnerTab] = useState('explanation');
  const [learningHubTab, setLearningHubTab] = useState('assignments');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeExam, setActiveExam] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [playingHtml, setPlayingHtml] = useState(null);
  const [reviewingExam, setReviewingExam] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pushStatus, setPushStatus] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', parentPhone: '', grade: '' });
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [scanningHwId, setScanningHwId] = useState(null);
  
  const [subscriptionCodeInput, setSubscriptionCodeInput] = useState('');
  const [isCharging, setIsCharging] = useState(false);

  const {
    content, exams, examResults, hwResults, assignments, assignmentSubmissions, videoViews,
    mistakes, notifications, hasNewNotif, setContent, setExams, setExamResults, setHwResults,
    setAssignments, setAssignmentSubmissions, setVideoViews, setMistakes, setNotifications, setHasNewNotif
  } = useStudentDashboardData({ user, userData, setScanningHwId, setEditFormData });

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

  // بيانات الطالب الحية انتقلت إلى useStudentDashboardData.

  const enableMobilePushNotifications = async () => {
    setPushStatus('disabled');
    platformNotify('إشعارات المتصفح متوقفة مؤقتًا. ستظهر تنبيهات المنصة داخل حساب الطالب فقط.');
  };

  const isPremium = userData.subscriptionStatus === 'premium' && (!userData?.subscriptionExpiry || userData?.subscriptionExpiry.toDate() > new Date());
  
  const startMistakesExam = () => {
      if (mistakes.length === 0) return platformNotify("ليس لديك أي أخطاء مسجلة بعد! استمر في التميز 👏");
      const shuffledMistakes = [...mistakes].sort(() => 0.5 - Math.random()).slice(0, 20);
      const generatedExam = {
          id: 'custom_mistakes_exam', title: 'امتحان نقاط الضعف (بنك الأخطاء) 🏦', duration: shuffledMistakes.length * 2, 
          questions: [ { text: 'أجب عن هذه الأسئلة التي أخطأت بها سابقاً:', subQuestions: shuffledMistakes.map(m => m.question) } ]
      };
      setActiveExam(generatedExam);
  };

  const handleChargeSubscriptionCode = async (e) => {
      e.preventDefault();
      if(!subscriptionCodeInput.trim()) return platformNotify("أدخل الكود أولاً");
      setIsCharging(true);
      try {
          const qStr = query(collection(db, 'subscription_codes'), where('code', '==', subscriptionCodeInput.trim()));
          const snap = await getDocs(qStr);
          if(snap.empty) { platformNotify("الكود غير صحيح أو غير موجود."); setIsCharging(false); return; }
          
          const codeDoc = snap.docs[0];
          const codeData = codeDoc.data();
          if(codeData.used) { platformNotify("عفواً، هذا الكود تم استخدامه من قبل."); setIsCharging(false); return; }

          const days = codeData.days;
          let newExpiry = new Date();
          if(isPremium && userData?.subscriptionExpiry) {
              newExpiry = userData?.subscriptionExpiry.toDate();
          }
          newExpiry.setDate(newExpiry.getDate() + days);

          const batch = writeBatch(db);
          batch.update(doc(db, 'users', user.uid), { subscriptionStatus: 'premium', subscriptionExpiry: newExpiry });
          batch.update(doc(db, 'subscription_codes', codeDoc.id), { used: true, usedBy: user.displayName, usedById: user.uid, usedAt: serverTimestamp() });
          
          await batch.commit();
          platformNotify(`تم شحن الكود بنجاح! تم تفعيل اشتراكك لمدة ${days} يوم.`);
          setSubscriptionCodeInput('');
      } catch (err) { console.error(err); platformNotify("حدث خطأ أثناء الشحن"); }
      setIsCharging(false);
  };

  const videos = content.filter(c => c.type === 'video');
  const filesAndLinks = content.filter(c => c.type === 'file' || c.type === 'link');
  const htmls = content.filter(c => c.type === 'html');
  const interactiveExams = content.filter(c => c.type === 'interactive_exam');

  const handlePremiumClick = (callback) => {
      if(!isPremium) {
          platformNotify("عفواً يا بطل، هذا المحتوى مخصص للطلاب المشتركين في الباقة المدفوعة (VIP). يرجى شحن حسابك أو التواصل مع المستر لترقية حسابك!");
          setActiveTab('subscription');
      } else {
          callback();
      }
  };

  const getVideoWatchPercent = (videoItem) => {
      const match = videoViews.find(v => v.videoId === videoItem.id);
      if (!match) return 0;
      if (safeNumber(match.watchedPercent, -1) >= 0) return safeNumber(match.watchedPercent, 0);
      const durationSeconds = safeNumber(videoItem.durationSeconds, safeNumber(videoItem.estimatedDurationMinutes, 0) * 60);
      return durationSeconds > 0 ? Math.min(100, Math.round((safeNumber(match.watchedSeconds, 0) / durationSeconds) * 100)) : 0;
  };

  const canOpenLinkedExam = (videoItem) => {
      if (!videoItem?.linkedExamId) return false;
      return getVideoWatchPercent(videoItem) >= VIDEO_EXAM_UNLOCK_PERCENT;
  };

  const openLinkedExamFromVideo = (videoItem) => {
      if (!videoItem?.linkedExamId) return;
      const watchPercent = getVideoWatchPercent(videoItem);
      if (watchPercent < VIDEO_EXAM_UNLOCK_PERCENT) {
          return platformNotify(`امتحان الفيديو سيفتح بعد مشاهدة ${VIDEO_EXAM_UNLOCK_PERCENT}% من الفيديو. شاهدت الآن ${watchPercent}%.`);
      }
      const linkedExam = exams.find(e => e.id === videoItem.linkedExamId);
      if (!linkedExam) return platformNotify('الامتحان المرتبط بهذا الفيديو غير موجود حالياً أو لم يتم نشره.');
      startExamWithCode(linkedExam, { skipCode: true, sourceVideoId: videoItem.id });
  };

  const handleVideoProgress = (videoId, percent, watchedSeconds) => {
      setVideoViews(prev => {
          const others = prev.filter(v => v.videoId !== videoId);
          return [...others, { videoId, watchedPercent: percent, watchedSeconds }];
      });
  };


  const latestVideoActivity = (() => {
      const views = Array.isArray(videoViews) ? videoViews : [];
      const byView = [...views].sort((a, b) => {
          const bTime = safeNumber(b?.viewedAt?.seconds, safeNumber(b?.updatedAt, safeNumber(b?.lastPositionSeconds, safeNumber(b?.watchedSeconds, 0))));
          const aTime = safeNumber(a?.viewedAt?.seconds, safeNumber(a?.updatedAt, safeNumber(a?.lastPositionSeconds, safeNumber(a?.watchedSeconds, 0))));
          return bTime - aTime;
      })[0];
      let localActivity = null;
      try {
          const raw = user?.uid ? localStorage.getItem('nahhas-latest-video-' + user.uid) : '';
          localActivity = raw ? JSON.parse(raw) : null;
      } catch (e) {}
      const picked = byView || localActivity;
      if (!picked) return null;
      const videoId = picked.videoId;
      const videoItem = videos.find(v => v.id === videoId) || (localActivity?.videoId === videoId ? videos.find(v => v.id === localActivity.videoId) : null);
      if (!videoItem) return null;
      const watchedSeconds = safeNumber(picked.lastPositionSeconds, safeNumber(picked.watchedSeconds, safeNumber(localActivity?.watchedSeconds, 0)));
      const percent = Math.max(0, Math.min(100, getVideoWatchPercent(videoItem)));
      return {
          video: videoItem,
          watchedSeconds,
          percent,
          isCompleted: percent >= 95
      };
  })();

  const latestCompletedResult = examResults.find(r => r.status === 'completed') || examResults[0] || null;
  const inProgressExamResult = examResults.find(r => ['in_progress', 'security_hold'].includes(r.status));
  const inProgressExam = inProgressExamResult ? exams.find(e => e.id === inProgressExamResult.examId) : null;
  const submittedAssignmentIds = new Set((assignmentSubmissions || []).map(s => s.assignmentId));
  const pendingAssignments = (assignments || []).filter(a => !submittedAssignmentIds.has(a.id));
  const pendingAssignmentsCount = pendingAssignments.length;
  const completedVideoCount = (videos || []).filter(v => getVideoWatchPercent(v) >= VIDEO_EXAM_UNLOCK_PERCENT).length;
  const videoCompletionPercent = videos.length > 0 ? Math.round((completedVideoCount / videos.length) * 100) : 0;
  const completedExamResults = (examResults || []).filter(r => r.status === 'completed');
  const averageScore = completedExamResults.length > 0
      ? Math.round(completedExamResults.reduce((sum, r) => sum + getResultPercentage(r), 0) / completedExamResults.length)
      : 0;
  const unseenNotificationCount = 0;
  const recentNotificationItems = [];

  const smartWeakBranches = (() => {
      const totals = {};
      completedExamResults.slice(0, 8).forEach(result => {
          const stats = result.performanceAnalysis?.branchStats || result.branchStats || result.branchAnalysis || {};
          Object.entries(stats).forEach(([branch, data]) => {
              totals[branch] = totals[branch] || { earned: 0, possible: 0, wrong: 0 };
              totals[branch].earned += safeNumber(data.earned, 0);
              totals[branch].possible += safeNumber(data.possible, safeNumber(data.total, 0));
              totals[branch].wrong += safeNumber(data.wrong, 0);
          });
      });
      return Object.entries(totals)
          .map(([branch, data]) => ({
              branch,
              pct: data.possible > 0 ? Math.round((data.earned / data.possible) * 100) : 0,
              wrong: data.wrong
          }))
          .filter(item => item.pct < 75 || item.wrong > 0)
          .sort((a, b) => a.pct - b.pct)
          .slice(0, 3);
  })();

  const nextStudyAction = (() => {
      if (latestVideoActivity && !latestVideoActivity.isCompleted) {
          return {
              title: 'استكمل آخر محاضرة',
              text: latestVideoActivity.video?.title || 'محاضرة محفوظة',
              action: () => setPlayingVideo(latestVideoActivity.video),
              button: 'استكمال الآن',
              icon: <Play size={18} fill="currentColor" />,
              tone: 'from-amber-400 to-orange-500 text-slate-950'
          };
      }
      if (inProgressExam) {
          return {
              title: 'استكمل امتحانك',
              text: inProgressExam.title || 'امتحان محفوظ',
              action: () => startExamWithCode(inProgressExam, { skipCode: true }),
              button: 'دخول الامتحان',
              icon: <ClipboardList size={18} />,
              tone: 'from-blue-500 to-indigo-600 text-white'
          };
      }
      if (pendingAssignments[0]) {
          return {
              title: 'عندك واجب مطلوب',
              text: pendingAssignments[0].title || 'واجب جديد',
              action: () => setActiveTab('assignments'),
              button: 'فتح الواجبات',
              icon: <QrCode size={18} />,
              tone: 'from-emerald-500 to-teal-600 text-white'
          };
      }
      return {
          title: 'ابدأ خطوة جديدة',
          text: videos[0]?.title || 'افتح المحاضرات المتاحة لك',
          action: () => setActiveTab('videos'),
          button: 'فتح المحاضرات',
          icon: <PlayCircle size={18} />,
          tone: 'from-slate-900 to-slate-700 text-white'
      };
  })();

  const StudentContinueCard = () => {
      const currentTitle = latestVideoActivity?.video?.title || inProgressExam?.title || pendingAssignments[0]?.title || 'ابدأ مذاكرتك التالية';
      const currentSubtitle = latestVideoActivity
          ? ('آخر موضع مشاهدة: ' + formatWatchTime(Math.round(latestVideoActivity.watchedSeconds || 0)))
          : inProgressExam
            ? 'عندك محاولة امتحان محفوظة تقدر تكملها.'
            : pendingAssignments[0]
              ? 'ابدأ الواجب المطلوب قبل تراكم المهام.'
              : 'كل أدواتك المهمة جاهزة بضغطة واحدة.';
      return (
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-900 text-white rounded-3xl p-5 md:p-6 shadow-xl overflow-hidden relative border border-white/10">
            <div className="absolute -left-16 -top-16 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl"></div>
            <div className="absolute right-8 bottom-4 opacity-10"><GraduationCap size={130}/></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="min-w-0">
                <p className="text-amber-200 text-sm font-bold mb-2 flex items-center gap-2"><Sparkles size={16}/> أكمل من حيث توقفت</p>
                <h3 className="text-2xl md:text-3xl font-black leading-relaxed truncate md:whitespace-normal">{currentTitle}</h3>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed">{currentSubtitle}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button onClick={nextStudyAction.action} className={`bg-gradient-to-r ${nextStudyAction.tone} px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-[1.02] transition flex items-center justify-center gap-2`}>
                  {nextStudyAction.icon} {nextStudyAction.button}
                </button>
                <button onClick={() => setActiveTab('settings')} className="bg-white/10 text-white border border-white/20 px-6 py-3 rounded-2xl font-bold hover:bg-white/15 transition flex items-center justify-center gap-2"><BarChart3 size={18}/> أدائي</button>
              </div>
            </div>
            {latestVideoActivity && (
              <div className="relative z-10 mt-5">
                <div className="h-3 bg-white/15 rounded-full overflow-hidden"><div className="h-full bg-amber-300 rounded-full transition-all" style={{ width: String(Math.min(100, latestVideoActivity.percent || 0)) + '%' }} /></div>
                <p className="text-xs text-amber-100 mt-2 font-bold">نسبة المشاهدة: {latestVideoActivity.percent || 0}%</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-1 gap-4">
            <button onClick={() => setActiveTab('settings')} className="text-right bg-white rounded-3xl p-5 border border-blue-100 shadow-sm hover:shadow-md transition"><p className="text-xs font-bold text-blue-600 mb-1">متوسط أدائك</p><p className="text-3xl font-black text-slate-900">{completedExamResults.length ? String(averageScore) + '%' : '—'}</p><p className="text-xs text-slate-500 mt-1">{latestCompletedResult?.examTitle || 'ابدأ أول امتحان لتظهر النتائج'}</p></button>
            <button onClick={() => setActiveTab('assignments')} className="text-right bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition"><p className="text-xs font-bold text-emerald-600 mb-1">واجبات مطلوبة</p><p className="text-3xl font-black text-slate-900">{pendingAssignmentsCount}</p><p className="text-xs text-slate-500 mt-1">{pendingAssignments[0]?.title || 'لا توجد واجبات معلقة'}</p></button>
          </div>
        </section>
      );
  };

  const StudentSmartDashboard = () => (
    <section className="glass-panel rounded-3xl p-5 md:p-6 border border-white/60">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><BrainCircuit className="text-amber-600"/> لوحة الطالب الذكية</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setActiveTab('videos')} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap">المحاضرات</button>
          <button onClick={() => setActiveTab('exams')} className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap">الامتحانات</button>
          <button onClick={() => setActiveTab('assignments')} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap">الواجبات</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-white rounded-2xl p-4 border border-slate-100"><p className="text-xs text-slate-500 font-bold">تقدم المحاضرات</p><p className="text-3xl font-black text-blue-700 mt-1">{videoCompletionPercent}%</p><p className="text-xs text-slate-400 mt-1">{completedVideoCount}/{videos.length} مكتملة</p></div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100"><p className="text-xs text-slate-500 font-bold">متوسط الامتحانات</p><p className="text-3xl font-black text-emerald-700 mt-1">{completedExamResults.length ? averageScore + '%' : '—'}</p><p className="text-xs text-slate-400 mt-1">{completedExamResults.length} امتحان مكتمل</p></div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100"><p className="text-xs text-slate-500 font-bold">واجبات مطلوبة</p><p className="text-3xl font-black text-amber-700 mt-1">{pendingAssignmentsCount}</p><p className="text-xs text-slate-400 mt-1">تابعها قبل المحاضرة القادمة</p></div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100"><p className="text-xs text-slate-500 font-bold">نتائج مسجلة</p><p className="text-3xl font-black text-purple-700 mt-1">{examResults.length}</p><p className="text-xs text-slate-400 mt-1">سجل امتحاناتك</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-950 text-white rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl"></div>
          <p className="text-amber-200 text-sm font-bold mb-2">خطة اليوم المقترحة</p>
          <h3 className="text-xl md:text-2xl font-black mb-2">{nextStudyAction.title}</h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">{nextStudyAction.text}</p>
          <button onClick={nextStudyAction.action} className={`bg-gradient-to-r ${nextStudyAction.tone} px-5 py-3 rounded-2xl font-black shadow flex items-center gap-2 w-full sm:w-auto justify-center`}>{nextStudyAction.icon} {nextStudyAction.button}</button>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-slate-100">
          <h3 className="font-black text-slate-800 flex items-center gap-2 mb-3"><Target className="text-red-500"/> ركز على</h3>
          {smartWeakBranches.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-emerald-700 text-sm font-bold leading-relaxed">أداؤك مستقر. راجع آخر أخطائك وحافظ على الاستمرارية.</div>
          ) : (
            <div className="space-y-2">
              {smartWeakBranches.map(item => (
                <div key={item.branch} className="bg-red-50/70 border border-red-100 rounded-2xl p-3">
                  <div className="flex items-center justify-between gap-2"><span className="font-black text-red-800">{item.branch}</span><span className="text-xs bg-white text-red-700 px-2 py-1 rounded-full font-bold">{item.pct}%</span></div>
                  <p className="text-xs text-red-600 mt-1">{item.wrong} أخطاء تحتاج مراجعة.</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const StudentNotificationCenter = () => (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><Bell className="text-amber-600"/> مركز الإشعارات</h3>
            <p className="text-sm text-slate-500 mt-1">المحاضرات والامتحانات والواجبات في مكان واحد، والتواصل عبر واتساب فقط.</p>
          </div>
          <button onClick={() => { setShowNotifications(true); setHasNewNotif(false); }} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold hover:bg-slate-800 transition">عرض الكل</button>
        </div>
        <div className="space-y-2">
          {recentNotificationItems.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-5 text-center text-slate-500 font-bold">لا توجد إشعارات جديدة حاليًا.</div>
          ) : recentNotificationItems.map((n, i) => (
            <div key={n.id || i} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"><Bell size={17}/></div>
              <div className="min-w-0"><p className="font-black text-slate-800 truncate">{n.title || 'تنبيه جديد'}</p><p className="text-sm text-slate-600 leading-relaxed">{n.text || n.body}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-900 flex items-center gap-2 mb-2"><Bell className="text-amber-600"/> تنبيهات داخل المنصة</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">لأي استفسار أو مشكلة في التفعيل استخدم واتساب الإدارة فقط، بدون رسائل داخلية أو إشعارات داخل المنصة.</p>
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl p-3 text-sm font-black">النظام الداخلي للتنبيهات يعمل بدون طلب صلاحيات من المتصفح.</div>
      </div>
    </section>
  );

  const StudentCompactHome = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <button onClick={()=> !isBannedContent && setActiveTab('videos')} className="text-right bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition"><div><p className="text-sm text-slate-500 font-bold">المحاضرات</p><p className="text-3xl font-black text-blue-700">{videos.length}</p></div><PlayCircle className="text-blue-200 w-14 h-14"/></button>
      <button onClick={()=> !isBannedExam && setActiveTab('exams')} className="text-right bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition"><div><p className="text-sm text-slate-500 font-bold">الامتحانات</p><p className="text-3xl font-black text-amber-700">{exams.length}</p></div><ClipboardList className="text-amber-200 w-14 h-14"/></button>
      <button onClick={()=> setActiveTab('settings')} className="text-right bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition"><div><p className="text-sm text-slate-500 font-bold">نتائجي</p><p className="text-3xl font-black text-emerald-700">{examResults.length}</p></div><Target className="text-emerald-200 w-14 h-14"/></button>
    </div>
  );

  const handleUpdateMyProfile = async (e) => {
      e.preventDefault();

      const normalizedPhone = normalizeEgyptPhone(editFormData.phone);
      if (!isValidEgyptPhone(normalizedPhone)) {
          return platformNotify("رقم الهاتف غير صحيح! يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015");
      }

      if (normalizedPhone === normalizeEgyptPhone(editFormData.parentPhone)) {
          return platformNotify("لا يمكن أن يكون رقم الطالب هو نفسه رقم ولي الأمر.");
      }

      const payload = { phone: normalizedPhone };

      if (editFormData.grade !== userData?.grade) {
          payload.requestedGrade = editFormData.grade;
          payload.gradeUpdateStatus = 'pending';
      }

      await updateDoc(doc(db, 'users', user.uid), payload);
      platformNotify(editFormData.grade !== userData?.grade ? "تم حفظ رقم الهاتف وإرسال طلب تغيير المرحلة إلى الأدمن." : "تم تحديث رقم الهاتف بنجاح.");
  };
  if (activeExam) return <ExamRunner exam={activeExam} user={user} onClose={() => setActiveExam(null)} />;
  if (showFocusMode) return <PomodoroFocusMode onClose={() => setShowFocusMode(false)} />;
  if (reviewingExam) {
      const result = examResults.find(r => r.examId === reviewingExam.id);
      return <ExamRunner exam={reviewingExam} user={user} onClose={() => setReviewingExam(null)} isReviewMode={true} existingResult={result} />;
  }

  const isBannedAll = userData.status === 'banned_all';
  const isBannedExam = userData.status === 'banned_exam' || userData.status === 'banned_cheating'; 
  const isBannedContent = userData.status === 'banned_content';

  if(userData.status === 'pending') return <div className="h-screen flex items-center justify-center bg-amber-50 text-center p-4"><div className="bg-white p-8 rounded-2xl shadow-xl"><h2 className="text-2xl font-bold mb-2">طلبك قيد المراجعة ⏳</h2><button onClick={()=>signOut(auth)} className="mt-4 text-red-500 underline">خروج</button></div></div>;
  if(userData.status === 'rejected') return <div className="h-screen flex items-center justify-center bg-red-50"><div className="text-red-600 font-bold">تم رفض طلبك</div><button onClick={()=>signOut(auth)} className="ml-4 bg-white px-4 py-1 rounded">خروج</button></div>;
  if (isBannedAll) return (
      <div className="h-screen flex flex-col items-center justify-center bg-red-50 text-center p-6"><Ban size={80} className="text-red-600 mb-4" /><h2 className="text-3xl font-bold text-red-800 mb-2 font-arabic">تم حظر حسابك</h2><p className="text-red-600 mb-6 font-bold">يرجى التواصل مع الإدارة أو المستر لمعرفة السبب.</p><button onClick={()=>signOut(auth)} className="bg-white text-red-600 px-6 py-2 rounded-full font-bold shadow-md hover:bg-red-100">تسجيل الخروج</button></div>
  );

  const startExamWithCode = async (exam, options = {}) => {
    if (isBannedExam) return platformNotify("أنت محظور من دخول الامتحانات.");

    const previousResult = examResults.find(r => r.examId === exam.id);
    const openExamFromSavedResult = (result, resumeData = null) => {
      setActiveExam({
        ...exam,
        attemptId: result.id,
        resumeData: resumeData || result,
        sourceVideoId: result.sourceVideoId || options.sourceVideoId || null
      });
    };

    if (previousResult) {
        const hasAdminContinueApproval = previousResult.adminDecision === 'continue';
        const hasAdminRestartApproval = previousResult.adminDecision === 'restart';

        if (previousResult.status === 'completed') {
          platformNotify(`أنت امتحنت الامتحان ده قبل كده وجبت ${previousResult.score}.`);
          return;
        }

        if (hasAdminContinueApproval && ['security_hold', 'in_progress', 'cheated'].includes(previousResult.status)) {
          const approvedResume = {
            ...previousResult,
            status: 'in_progress',
            answers: previousResult.answers || {},
            remainingTime: safeNumber(previousResult.remainingTime, exam.duration * 60),
            currentQIndex: safeNumber(previousResult.currentQIndex, 0),
            antiCheatWarnings: safeNumber(previousResult.antiCheatWarnings, 0),
            antiCheatLog: previousResult.antiCheatLog || []
          };

          await setDoc(doc(db, 'exam_results', previousResult.id), {
            status: 'in_progress',
            adminDecision: 'continue_consumed',
            resumeApproved: false,
            adminSecurityAction: 'continue_consumed',
            resumedAfterAdminApprovalAt: serverTimestamp(),
            lastSavedAt: serverTimestamp(),
            sourceVideoId: previousResult.sourceVideoId || options.sourceVideoId || null
          }, { merge: true });

          openExamFromSavedResult({ ...previousResult, ...approvedResume, adminDecision: 'continue_consumed' }, approvedResume);
          return;
        }

        if (hasAdminRestartApproval && ['security_hold', 'in_progress', 'cheated'].includes(previousResult.status)) {
          const freshResume = {
            answers: {},
            remainingTime: exam.duration * 60,
            currentQIndex: 0,
            antiCheatWarnings: 0,
            antiCheatLog: previousResult.antiCheatLog || []
          };

          await setDoc(doc(db, 'exam_results', previousResult.id), {
            answers: {},
            remainingTime: exam.duration * 60,
            currentQIndex: 0,
            score: 0,
            total: 0,
            status: 'in_progress',
            adminDecision: 'restart_consumed',
            resumeApproved: false,
            antiCheatWarnings: 0,
            restartedByAdminDecisionAt: serverTimestamp(),
            sourceVideoId: previousResult.sourceVideoId || options.sourceVideoId || null
          }, { merge: true });

          openExamFromSavedResult({ ...previousResult, ...freshResume, status: 'in_progress', adminDecision: 'restart_consumed' }, freshResume);
          return;
        }

        if (previousResult.status === 'security_hold') {
          platformNotify('تم إيقاف محاولتك مؤقتًا بسبب تنبيهات الأمان. انتظر موافقة الأدمن على الاستكمال أو الإعادة.');
          return;
        }

        if (previousResult.status === 'in_progress') {
          platformNotify('لديك محاولة غير مكتملة. لا يمكن الاستكمال إلا بعد موافقة الأدمن من لوحة النتائج.');
          return;
        }

        if (previousResult.status === 'cheated') {
          platformNotify('هذه المحاولة مسجلة كمخالفة أمان. لا يمكن إعادة الامتحان أو استكماله إلا إذا سمح الأدمن من لوحة النتائج.');
          return;
        }
    }

    const now = new Date(); const start = new Date(exam.startTime); const end = new Date(exam.endTime);
    if (now < start) return platformNotify(`الامتحان لم يبدأ بعد. موعد البدء: ${start.toLocaleString('ar-EG')}`);
    if (now > end) return platformNotify("عفواً، انتهى وقت الامتحان.");
    const code = options.skipCode ? exam.accessCode : platformPrompt("أدخل كود الامتحان:");
    if (options.skipCode || code === exam.accessCode) {
        try {
            const attemptRef = await addDoc(collection(db, 'exam_results'), {
              examId: exam.id,
              studentId: user.uid,
              studentName: user.displayName,
              score: 0,
              total: 0,
              status: 'in_progress',
              adminDecision: null,
              resumeApproved: false,
              sourceVideoId: options.sourceVideoId || null,
              startedFromVideo: !!options.skipCode,
              submittedAt: serverTimestamp()
            });
            setActiveExam({ ...exam, attemptId: attemptRef.id, sourceVideoId: options.sourceVideoId || null });
        } catch (error) { console.error("Error creating attempt record:", error); platformNotify("حدث خطأ أثناء بدء الامتحان. حاول مرة أخرى."); }
    } else { platformNotify("كود خاطئ!"); }
  };

  const studentFirstName = String(userData?.name || user?.displayName || 'طالب').split(' ')[0];
  const StudentTopGreeting = () => (
    <section className="student-sticky-hero bg-white/95 backdrop-blur-xl border border-amber-100 rounded-3xl shadow-xl p-4 md:p-5 mb-6 overflow-hidden relative">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-arabic flex flex-wrap items-center gap-2">
            منور يا <span className="text-amber-600">{studentFirstName}</span> 👋
            <span className="text-sm font-normal text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-sans">{getGradeLabel(userData?.grade)}</span>
            {isPremium ? (
              <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm"><Crown size={14}/> حساب VIP</span>
            ) : (
              <button className="bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 transition" onClick={()=>setActiveTab('subscription')}>مجاني (رقي حسابك)</button>
            )}
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center min-w-[220px]">
          <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100"><p className="text-xl font-black text-amber-700">{videos.length}</p><p className="text-[11px] text-amber-800 font-bold">محاضرة</p></div>
          <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100"><p className="text-xl font-black text-blue-700">{exams.length}</p><p className="text-[11px] text-blue-800 font-bold">امتحان</p></div>
          <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100"><p className="text-xl font-black text-emerald-700">{examResults.length}</p><p className="text-[11px] text-emerald-800 font-bold">نتيجة</p></div>
        </div>
      </div>
    </section>
  );

  const LearningHubTabs = () => (
    <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm mb-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <button onClick={() => { setLearningHubTab('assignments'); setActiveTab('assignments'); }} className={`px-5 py-3 rounded-2xl font-black transition ${activeTab === 'assignments' ? 'bg-emerald-600 text-white shadow' : 'bg-emerald-50 text-emerald-700'}`}>الواجبات</button>
        <button onClick={() => { setLearningHubTab('history'); setActiveTab('smart_hw_results'); }} className={`px-5 py-3 rounded-2xl font-black transition ${activeTab === 'smart_hw_results' ? 'bg-blue-600 text-white shadow' : 'bg-blue-50 text-blue-700'}`}>سجل الواجبات</button>
        <button onClick={() => { setLearningHubTab('mistakes'); setActiveTab('mistakes_bank'); }} className={`px-5 py-3 rounded-2xl font-black transition ${activeTab === 'mistakes_bank' ? 'bg-red-600 text-white shadow' : 'bg-red-50 text-red-700'}`}>بنك الأخطاء</button>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 relative font-['Cairo'] min-h-screen block" dir="rtl">

      <MobileStudentBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      {playingVideo && <SecureVideoPlayer video={playingVideo} user={user} userName={userData?.name} onClose={() => setPlayingVideo(null)} onProgress={handleVideoProgress} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={userData} onClose={() => setPlayingHtml(null)} />}
      {/* النظام امتحانات الطلاب متوقفة مؤقتًا  */}
      <FloatingArabicBackground />
      
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
                <div onClick={() => {setActiveTab('courses'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='courses'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><BookOpen/> الكورسات التعليمية</div>
                <div onClick={() => {setActiveTab('videos'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='videos'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><PlayCircle/> المحاضرات</div>
                <div onClick={() => {setActiveTab('files'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='files'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><FileText/> الملفات و الروابط</div>
                <div onClick={() => {setActiveTab('htmls'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='htmls'?'bg-purple-100 text-purple-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-purple-600'}`}><Code/> محتوى تفاعلي</div>
              </>
          )}
          {!isBannedExam && (
              <>
                <div onClick={() => {setActiveTab('exams'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='exams'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><ClipboardList/> الامتحانات</div>
                <div onClick={() => {setLearningHubTab('assignments'); setActiveTab('assignments'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${['assignments','smart_hw_results','mistakes_bank'].includes(activeTab)?'bg-emerald-100 text-emerald-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'}`}><FileCheck/> الواجبات وبنك الأخطاء</div>
              </>
          )}
          <button onClick={() => {setActiveTab('settings'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition ${['settings','performance'].includes(activeTab)?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><Settings/> ملفي الشخصي والأداء</button>
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
                {isPremium && <span className="hidden md:flex bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold items-center gap-1 border border-amber-200"><Crown size={14}/> VIP صالح حتى: {userData?.subscriptionExpiry?.toDate().toLocaleDateString('ar-EG')}</span>}
            </div>
        </div>

        <StudentTopGreeting />
        {activeTab === 'home' && <div className="mb-6"><WisdomBox /></div>}

        {activeTab === 'home' && (
            <div className="space-y-8 page-soft-enter">
                <StudentContinueCard />
                <StudentSmartDashboard />
                <StudentCompactHome />
                                <Announcements />
                <PWAInstallBox installPrompt={installPrompt} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div whileHover={{ scale: 1.01 }} onClick={()=> !isBannedContent && setActiveTab('videos')} className={`bg-gradient-to-br from-blue-950 via-blue-800 to-sky-700 text-white p-7 rounded-[2rem] relative overflow-hidden cursor-pointer shadow-xl group ${isBannedContent ? 'opacity-50 grayscale' : ''}`}>
                        <div className="relative z-10"><p className="text-sky-200 font-black text-sm mb-2">مركز المحاضرات</p><h3 className="text-3xl font-black mb-3">المحاضرات والمساحات الأونلاين</h3><p className="text-blue-100 leading-relaxed text-sm">كل الشرح، التدريبات، المراجعات، والمحاضرات المباشرة داخل تبويبات منظمة.</p><div className="flex gap-3 mt-5"><span className="bg-white/15 px-4 py-2 rounded-2xl font-bold">{videos.length} فيديو</span></div></div><PlayCircle className="absolute -bottom-8 -left-8 text-white/10 w-52 h-52 group-hover:scale-110 transition"/>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.01 }} onClick={()=> setActiveTab('settings')} className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 text-white p-7 rounded-[2rem] relative overflow-hidden cursor-pointer shadow-xl group">
                        <div className="relative z-10"><p className="text-emerald-200 font-black text-sm mb-2">النتائج والتطور</p><h3 className="text-3xl font-black mb-3">نتائجك وتحليل أدائك</h3><p className="text-emerald-100 leading-relaxed text-sm">تابع متوسطك، سجل امتحاناتك، ونقاط الضعف من مكان واحد داخل ملفك.</p><div className="flex gap-3 mt-5"><span className="bg-white/15 px-4 py-2 rounded-2xl font-bold">{examResults.length} نتيجة</span><span className="bg-white/15 px-4 py-2 rounded-2xl font-bold">{completedExamResults.length ? averageScore + '%' : '—'} متوسط</span></div></div><BarChart3 className="absolute -bottom-8 -left-8 text-white/10 w-52 h-52 group-hover:scale-110 transition"/>
                    </motion.div>
                </div>
                <Leaderboard />
                <PerformanceOverview examResults={examResults} content={content} />
            </div>
        )}


        {activeTab === 'performance' && (
            <div className="space-y-6">
                <PerformanceOverview examResults={examResults} content={content} />
                <div className="glass-panel p-6 rounded-2xl">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart3/> سجل الامتحانات</h2>
                    <div className="space-y-3">
                        {examResults.length === 0 ? <p className="text-slate-500 text-center py-8 bg-white rounded-xl border">لم يتم تسجيل نتائج بعد.</p> : examResults.map(result => {
                            const pct = getResultPercentage(result);
                            const badge = getGradeBadge(pct);
                            return <div key={result.id} className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div><p className="font-bold text-slate-800">{result.examTitle || 'امتحان'}</p><p className="text-xs text-slate-500">{result.submittedAt?.toDate?.().toLocaleString('ar-EG') || 'بدون تاريخ'}</p></div>
                                <div className="flex items-center gap-2"><span className={`px-3 py-1 rounded-full border text-xs font-bold ${badge.tone}`}>{badge.text}</span><span className="font-black text-slate-800">{result.score}/{result.total} - {pct}%</span></div>
                            </div>;
                        })}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'subscription' && (
            <div className="glass-panel p-4 md:p-8 rounded-2xl max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <Crown size={64} className={`mx-auto mb-4 ${isPremium ? 'text-amber-500' : 'text-slate-300'}`} />
                    <h2 className="text-3xl font-bold font-arabic text-slate-800 mb-2">حالة اشتراكك</h2>
                    {isPremium ? (
                        <p className="text-green-600 font-bold text-lg bg-green-50 inline-block px-4 py-2 rounded-full border border-green-200">أنت الآن على الباقة المدفوعة (VIP). صالحة حتى: {userData?.subscriptionExpiry?.toDate().toLocaleDateString('ar-EG')}</p>
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
            <div className="space-y-5">
              <LearningHubTabs />
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
                                {m.question.blockText && <div className="mt-6 mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-slate-800 leading-relaxed whitespace-pre-wrap"><p className="text-xs font-black text-amber-700 mb-2">القطعة المرتبطة بالسؤال</p>{renderBracketHighlightedText(m.question.blockText)}</div>}
                                <h3 className="text-lg md:text-xl font-bold text-slate-800 mt-6 md:mt-4 mb-4 leading-relaxed font-sans">{renderBracketHighlightedText(m.question.text)}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100"><p className="text-xs text-red-500 font-bold mb-1">إجابتك الخاطئة كانت:</p><p className="font-bold text-slate-800">{m.question.studentAnswerText || 'غير معروف'}</p></div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100"><p className="text-xs text-green-600 font-bold mb-1">الإجابة الصحيحة هي:</p><p className="font-bold text-green-800">{m.question.correctAnswerText || 'غير معروف'}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
              </div>
            </div>
        )}

          {activeTab === 'courses' && !isBannedContent && <StudentCoursesHub user={user} userData={userData} exams={exams} onStartExam={startExamWithCode} />}

          {activeTab === 'videos' && !isBannedContent && (
            <div className="space-y-6">
                <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setVideoSectionTab('recorded')} className={`px-6 py-3 rounded-2xl font-black whitespace-nowrap transition ${videoSectionTab === 'recorded' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-600'}`}>المحاضرات المسجلة</button>
                        
                    </div>
                    {videoSectionTab === 'recorded' && <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <button onClick={() => setLectureInnerTab('explanation')} className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition ${lectureInnerTab === 'explanation' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}>شرح الدروس</button>
                        <button onClick={() => setLectureInnerTab('exercises')} className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition ${lectureInnerTab === 'exercises' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}>حل التدريبات</button>
                        <button onClick={() => setLectureInnerTab('reviews')} className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition ${lectureInnerTab === 'reviews' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}>المراجعات النهائية</button>
                    </div>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {videos.filter(v => videoSectionTab === 'recorded' && (v.videoSection || 'explanation') === lectureInnerTab).length === 0 ? (
                         <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
                             <PlayCircle className="mx-auto text-slate-300 w-16 h-16 mb-4"/>
                             <p className="text-slate-500 font-bold">لا توجد فيديوهات في هذا القسم حالياً.</p>
                         </div>
                    ) : videos.filter(v => videoSectionTab === 'recorded' && (v.videoSection || 'explanation') === lectureInnerTab).map(v => {
                        const watchPercent = getVideoWatchPercent(v);
                        return (
                        <div key={v.id} className="glass-card rounded-xl overflow-hidden cursor-pointer relative group">
                            <div className="h-48 bg-gradient-to-br from-slate-800 to-black flex items-center justify-center relative" onClick={() => handlePremiumClick(() => setPlayingVideo(v))}>
                                {v.isPremium && !isPremium ? <Lock className="text-slate-400 w-16 h-16 opacity-80" /> : <PlayCircle className="text-white w-16 h-16 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/>}
                                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(v.grade)}</span>
                                {v.isPremium && <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-md"><Crown size={12}/> VIP</span>}
                            </div>
                            <div className="p-4 space-y-3">
                                <h3 className={`font-bold text-lg ${v.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'}`}>{v.title}</h3>
                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${watchPercent}%` }} /></div>
                                <div className="flex items-center justify-between text-xs text-slate-500"><span>المشاهدة</span><span>{watchPercent}%</span></div>
                                {v.linkedExamId && (
                                  <div className="space-y-2">
                                    {watchPercent >= VIDEO_EXAM_UNLOCK_PERCENT ? (
                                      <button
                                        onClick={() => openLinkedExamFromVideo(v)}
                                        className="w-full py-2 rounded-xl font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow"
                                      >
                                        ابدأ امتحان الفيديو الآن
                                      </button>
                                    ) : (
                                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                                        <p className="text-xs font-bold text-slate-600">
                                          شاهد {Math.max(0, VIDEO_EXAM_UNLOCK_PERCENT - watchPercent)}% إضافية لفتح امتحان الفيديو
                                        </p>
                                        <button
                                          onClick={() => handlePremiumClick(() => setPlayingVideo(v))}
                                          className="mt-2 w-full py-2 rounded-xl font-bold text-sm bg-blue-100 text-blue-700 hover:bg-blue-200"
                                        >
                                          استكمال مشاهدة الفيديو
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                            </div>
                        </div>
                    )})}
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
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:col-span-3 text-amber-800 font-bold">امتحان النظام المخصص متوقف مؤقتًا للطلاب. ستظل الامتحانات التفاعلية المنشورة من الأدمن متاحة هنا.</div>
                
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
                const canResumeByAdmin = prevResult && prevResult.adminDecision === 'continue';
                const canRestartByAdmin = prevResult && prevResult.adminDecision === 'restart';
                const waitingAdminDecision = prevResult && ['security_hold', 'in_progress', 'cheated'].includes(prevResult.status) && !canResumeByAdmin && !canRestartByAdmin;
                if (prevResult) {
                    if (prevResult.status === 'completed') { statusText = `تم الحل: ${prevResult.score} درجة`; statusClass = "bg-green-500 text-white"; } 
                    else if (canResumeByAdmin) { statusText = "مسموح بالاستكمال ✅"; statusClass = "bg-blue-600 text-white"; }
                    else if (canRestartByAdmin) { statusText = "مسموح بالإعادة ✅"; statusClass = "bg-amber-600 text-white"; }
                    else if (prevResult.status === 'security_hold') { statusText = "موقوف في انتظار الأدمن 🛡️"; statusClass = "bg-red-600 text-white"; }
                    else if (prevResult.status === 'in_progress') { statusText = "ينتظر موافقة الأدمن ⏳"; statusClass = "bg-yellow-500 text-white"; } 
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
                        ) : canResumeByAdmin ? (
                            <button onClick={() => startExamWithCode(e, { skipCode: true })} className="w-full bg-blue-600 text-white py-2 md:py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg transition text-sm">
                                <Play size={14}/> استكمال الامتحان بموافقة الأدمن
                            </button>
                        ) : canRestartByAdmin ? (
                            <button onClick={() => startExamWithCode(e, { skipCode: true })} className="w-full bg-amber-600 text-white py-2 md:py-3 rounded-xl font-bold hover:bg-amber-700 flex items-center justify-center gap-2 shadow-lg transition text-sm">
                                <RefreshCw size={14}/> بدء الامتحان من جديد بموافقة الأدمن
                            </button>
                        ) : waitingAdminDecision ? (
                            <div className="bg-amber-50 text-amber-700 p-2 md:p-3 rounded-xl font-bold text-center border border-amber-200 text-sm">
                                المحاولة محفوظة. انتظر موافقة الأدمن للاستكمال أو الإعادة.
                            </div>
                        ) : prevResult ? (
                            <div className="bg-red-50 text-red-600 p-2 md:p-3 rounded-xl font-bold text-center border border-red-200 text-sm">لا يمكن دخول الامتحان</div>
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

        {activeTab === 'assignments' && !isBannedExam && (
            <div className="space-y-5">
              <LearningHubTabs />
              <StudentAssignmentsPanel assignments={assignments} submissions={assignmentSubmissions} user={user} userData={userData} />
            </div>
        )}

        {activeTab === 'smart_hw_results' && !isBannedExam && (
            <div className="space-y-5">
              <LearningHubTabs />
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
            </div>
        )}

        {activeTab === 'settings' && (
              <div className="space-y-6 max-w-5xl">
                <div className="glass-panel p-4 md:p-6 rounded-2xl"><PerformanceOverview examResults={examResults} content={content} /></div>
                <div className="glass-panel p-4 md:p-6 rounded-xl max-w-2xl">
                <form onSubmit={handleUpdateMyProfile} className="space-y-4">
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">الاسم</label><input disabled className="w-full border p-3 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed" value={editFormData.name} /><p className="text-xs text-red-500 mt-1">لا يمكن تغيير الاسم (تواصل مع الإدارة).</p></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label><input className="w-full border p-3 rounded-xl" value={editFormData.phone} onChange={e=>setEditFormData({...editFormData, phone: normalizeEgyptPhone(e.target.value)})} /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">رقم ولي الأمر</label><input disabled className="w-full border p-3 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed" value={editFormData.parentPhone} /><p className="text-xs text-red-500 mt-1">لا يمكن تغيير رقم ولي الأمر.</p></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">الصف الدراسي (يتطلب موافقة الأدمن)</label><select className="w-full border p-3 rounded-xl bg-white" value={editFormData.grade} onChange={e=>setEditFormData({...editFormData, grade:e.target.value})}><GradeOptions /></select></div>
                  <button className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/40 transition mt-4">حفظ التعديلات</button>
                </form>
                </div>
              </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
