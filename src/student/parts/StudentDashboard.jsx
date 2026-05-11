import { useState, useEffect, lazy, Suspense } from 'react';
import { signOut } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { PlayCircle, FileText, LogOut, User, Lock, Menu, X, Loader2, Phone, MessageSquare, BookOpen, ClipboardList, Unlock, Settings, Bell, Download, Code, Sparkles, Ban, RefreshCw, Link as LinkIcon, QrCode, FileCheck, BarChart3, BrainCircuit, Headphones, DownloadCloud, Play, Target, Crown, CreditCard, Key } from '../../shared/icons/lucide-shim.jsx';
import { motion } from 'framer-motion';
import { auth, db, functions } from '../../services/firebase';
import MobileStudentBottomNav from '../../features/student/MobileStudentBottomNav';


import { GradeOptions, getGradeLabel } from '../../shared/constants/grades';
import { normalizeEgyptPhone, isValidEgyptPhone } from '../../shared/utils/phone';
import { PWAInstallBox, ModernLogo, FloatingArabicBackground, WisdomBox, Announcements, Leaderboard } from '../../features/home/HomeWidgets';
import PomodoroFocusMode from '../../features/study/PomodoroFocusMode';


import { platformNotify, platformPrompt, generatePDF, safeNumber, getResultPercentage, VIDEO_EXAM_UNLOCK_PERCENT } from '../../shared/core/platformShared.jsx';


import PerformanceOverview from './PerformanceOverview.jsx';
import { useStudentDashboardData } from '../hooks/useStudentDashboardData.js';
import { StudentContinueCard, StudentSmartDashboard, StudentCompactHome } from '../components/home/StudentHomeCards.jsx';
import { StudentTopGreeting, LearningHubTabs } from '../components/layout/StudentLayoutParts.jsx';
import StudentAssignmentsPanel from '../../admin/parts/StudentAssignmentsPanel.jsx';
import StudentSuccessPanel from '../../features/studentSuccess/StudentSuccessPanel.jsx';


const SecureVideoPlayer = lazy(() => import('../../features/lectures/SecureVideoPlayer'));
const InteractiveViewer = lazy(() => import('../../features/content/InteractiveViewer'));
const ExamRunner = lazy(() => import('../../shared/platformParts/ExamRunner.jsx'));
const SmartHomeworkScanner = lazy(() => import('../../features/homework/SmartHomeworkScanner.jsx'));
const StudentGrowthPanel = lazy(() => import('../../features/insights/StudentGrowthPanel.jsx'));
const StudentLearningPath = lazy(() => import('../../features/student/StudentLearningPath.jsx'));
const StudentCoursesHub = lazy(() => import('../../features/courses/CourseSystem').then((module) => ({ default: module.StudentCoursesHub })));
const StudentMessagesInbox = lazy(() => import('../../features/smartLearning/SmartLearningEngine.jsx').then((module) => ({ default: module.StudentMessagesInbox })));
const StudentRemediationCenter = lazy(() => import('../../features/smartLearning/SmartLearningEngine.jsx').then((module) => ({ default: module.StudentRemediationCenter })));
const ExamPreStartPanel = lazy(() => import('../../features/smartLearning/SmartLearningEngine.jsx').then((module) => ({ default: module.ExamPreStartPanel })));

const LazyPanelFallback = () => (
  <div className="rounded-3xl border border-amber-100 bg-white/80 p-6 text-center text-sm font-bold text-amber-700 shadow-sm">
    جاري تحميل الجزء المطلوب...
  </div>
);

const LazyPanel = ({ children }) => (
  <Suspense fallback={<LazyPanelFallback />}>
    {children}
  </Suspense>
);

const StudentDailyCommandCenter = ({
  userData,
  isPremium,
  nextStudyAction,
  inProgressExam,
  nextOpenExam,
  pendingAssignmentsCount,
  averageScore,
  videoCompletionPercent,
  subscriptionDaysLeft,
  setActiveTab
}) => {
  const subscriptionText = isPremium
    ? (subscriptionDaysLeft === null ? 'VIP مفعل' : `${subscriptionDaysLeft} يوم متبقي`)
    : 'مجاني / يحتاج تفعيل';

  const quickCards = [
    { label: 'حالة الاشتراك', value: subscriptionText, icon: <Crown size={18} />, action: () => setActiveTab('subscription'), tone: isPremium ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100' },
    { label: 'تقدم المحاضرات', value: `${videoCompletionPercent}%`, icon: <PlayCircle size={18} />, action: () => setActiveTab('videos'), tone: 'bg-blue-50 text-blue-700 border-blue-100' },
    { label: 'متوسط الامتحانات', value: averageScore ? `${averageScore}%` : 'ابدأ أول امتحان', icon: <ClipboardList size={18} />, action: () => setActiveTab('exams'), tone: 'bg-purple-50 text-purple-700 border-purple-100' },
    { label: 'واجبات مطلوبة', value: pendingAssignmentsCount ? `${pendingAssignmentsCount} واجب` : 'لا يوجد', icon: <QrCode size={18} />, action: () => setActiveTab('assignments'), tone: pendingAssignmentsCount ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-100' }
  ];

  return (
    <div className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-4 md:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black text-amber-700">مركز اليوم الدراسي</p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">ابدأ من هنا يا {userData?.name || 'بطل'}</h2>
          <p className="text-sm text-slate-500 mt-2">خطوة واحدة واضحة بدل ما الطالب يلف في المنصة كأنه بيدوّر على ريموت التلفزيون.</p>
        </div>
        <button onClick={nextStudyAction.action} className={`rounded-2xl px-5 py-3 font-black shadow-lg transition hover:-translate-y-0.5 ${nextStudyAction.tone || 'bg-slate-900 text-white'}`}>
          <span className="flex items-center justify-center gap-2">{nextStudyAction.icon}{nextStudyAction.button}</span>
          <span className="block text-xs opacity-80 mt-1">{nextStudyAction.text}</span>
        </button>
      </div>

      {(inProgressExam || nextOpenExam) && (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-900">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-black">{inProgressExam ? 'لديك محاولة محفوظة' : 'أقرب امتحان متاح'}</p>
              <p className="text-sm font-bold text-blue-700 mt-1">{(inProgressExam || nextOpenExam)?.title || 'امتحان متاح'}</p>
            </div>
            <button onClick={() => setActiveTab('exams')} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700">فتح الامتحانات</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {quickCards.map((card) => (
          <button key={card.label} onClick={card.action} className={`text-right rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${card.tone}`}>
            <div className="flex items-center justify-between gap-2"><span className="font-black text-xs">{card.label}</span>{card.icon}</div>
            <p className="text-lg font-black mt-2">{card.value}</p>
          </button>
        ))}
      </div>
    </div>
  );
};


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
  const [preExam, setPreExam] = useState(null);
  const [scanningHwId, setScanningHwId] = useState(null);
  
  const [subscriptionCodeInput, setSubscriptionCodeInput] = useState('');
  const [isCharging, setIsCharging] = useState(false);
  const [supportDraft, setSupportDraft] = useState({ category: 'exam', message: '' });
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState({ amount: '', method: 'vodafone_cash', transactionId: '', note: '' });
  const [isSendingPayment, setIsSendingPayment] = useState(false);

  const {
    content, exams, examResults, hwResults, assignments, assignmentSubmissions, videoViews,
    mistakes, notifications, hasNewNotif, examAccessOverrides, setContent, setExams, setExamResults, setHwResults,
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
          const redeemCode = httpsCallable(functions, 'redeemSubscriptionCode');
          const res = await redeemCode({ code: subscriptionCodeInput.trim() });
          const days = res.data?.days || 0;
          platformNotify(`تم شحن الكود بنجاح! تم تفعيل اشتراكك لمدة ${days} يوم.`);
          setSubscriptionCodeInput('');
      } catch (err) { console.error(err); platformNotify("حدث خطأ أثناء الشحن"); }
      setIsCharging(false);
  };


  const handleSubmitPaymentRequest = async (e) => {
      e.preventDefault();
      if (!paymentDraft.amount || Number(paymentDraft.amount) <= 0) return platformNotify('اكتب قيمة التحويل أولاً.');
      if (!paymentDraft.transactionId.trim()) return platformNotify('اكتب رقم العملية أو آخر 4 أرقام من الوصل.');
      setIsSendingPayment(true);
      try {
          await addDoc(collection(db, 'payment_requests'), {
              userId: user.uid,
              studentId: user.uid,
              studentName: userData?.name || user.displayName || user.email || 'طالب',
              studentEmail: user.email || userData?.email || '',
              grade: userData?.grade || '',
              amount: Number(paymentDraft.amount || 0),
              method: paymentDraft.method,
              transactionId: paymentDraft.transactionId.trim(),
              note: paymentDraft.note.trim(),
              status: 'pending',
              days: 30,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
          });
          setPaymentDraft({ amount: '', method: 'vodafone_cash', transactionId: '', note: '' });
          platformNotify('تم إرسال طلب الدفع للإدارة. سيتم تفعيل الاشتراك بعد المراجعة.');
      } catch (error) {
          console.error('payment request error:', error);
          platformNotify('تعذر إرسال طلب الدفع الآن. حاول مرة أخرى.');
      } finally {
          setIsSendingPayment(false);
      }
  };


  const handleSendSupportTicket = async (e) => {
      e.preventDefault();
      if (!supportDraft.message.trim()) return platformNotify('اكتب تفاصيل المشكلة أولاً.');
      setIsSendingSupport(true);
      try {
          const chatRef = doc(db, 'student_chats', user.uid);
          await setDoc(chatRef, {
              userId: user.uid,
              studentId: user.uid,
              studentName: userData?.name || user.displayName || user.email || 'طالب',
              studentEmail: user.email || userData?.email || '',
              lastMessage: supportDraft.message.trim().slice(0, 180),
              category: supportDraft.category,
              status: 'open',
              updatedAt: serverTimestamp(),
          }, { merge: true });
          await addDoc(collection(db, 'student_chats', user.uid, 'messages'), {
              senderId: user.uid,
              senderRole: 'student',
              senderName: userData?.name || user.displayName || 'طالب',
              category: supportDraft.category,
              text: supportDraft.message.trim(),
              readByAdmin: false,
              createdAt: serverTimestamp(),
          });
          setSupportDraft({ category: 'exam', message: '' });
          platformNotify('تم إرسال تذكرة الدعم. هتظهر للإدارة في مركز الرسائل.');
      } catch (error) {
          console.error('support ticket error:', error);
          platformNotify('تعذر إرسال تذكرة الدعم الآن. حاول مرة أخرى.');
      } finally {
          setIsSendingSupport(false);
      }
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
  const recentNotificationItems = (notifications || []).slice(0, 5);
  const unseenNotificationCount = (notifications || []).filter((n) => !n.read).length;

  const nowForStudentDashboard = Date.now();
  const nextOpenExam = (exams || [])
      .filter((exam) => {
          const alreadyCompleted = (examResults || []).some((result) => result.examId === exam.id && result.status === 'completed');
          const startMs = new Date(exam.startTime).getTime();
          const endMs = new Date(exam.endTime).getTime();
          return !alreadyCompleted && Number.isFinite(startMs) && Number.isFinite(endMs) && startMs <= nowForStudentDashboard && endMs >= nowForStudentDashboard;
      })
      .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime())[0] || null;
  const subscriptionExpiryDate = userData?.subscriptionExpiry?.toDate ? userData.subscriptionExpiry.toDate() : null;
  const subscriptionDaysLeft = isPremium && subscriptionExpiryDate
      ? Math.max(0, Math.ceil((subscriptionExpiryDate.getTime() - nowForStudentDashboard) / (1000 * 60 * 60 * 24)))
      : null;

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
      if (nextOpenExam) {
          return {
              title: 'امتحان متاح الآن',
              text: nextOpenExam.title || 'ادخل قبل انتهاء الوقت',
              action: () => setActiveTab('exams'),
              button: 'فتح صفحة الامتحانات',
              icon: <ClipboardList size={18} />,
              tone: 'from-purple-600 to-indigo-700 text-white'
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
  if (activeExam) return <LazyPanel><ExamRunner exam={activeExam} user={user} onClose={() => setActiveExam(null)} /></LazyPanel>;
  if (showFocusMode) return <PomodoroFocusMode onClose={() => setShowFocusMode(false)} />;
  if (reviewingExam) {
      const result = examResults.find(r => r.examId === reviewingExam.id);
      return <LazyPanel><ExamRunner exam={reviewingExam} user={user} onClose={() => setReviewingExam(null)} isReviewMode={true} existingResult={result} /></LazyPanel>;
  }

  const isBannedAll = userData.status === 'banned_all';
  const isBannedExam = userData.status === 'banned_exam' || userData.status === 'banned_cheating'; 
  const isBannedContent = userData.status === 'banned_content';

  if(userData.status === 'pending') return <div className="h-screen flex items-center justify-center bg-amber-50 text-center p-4"><div className="bg-white p-8 rounded-2xl shadow-xl"><h2 className="text-2xl font-bold mb-2">طلبك قيد المراجعة ⏳</h2><button onClick={()=>signOut(auth)} className="mt-4 text-red-500 underline">خروج</button></div></div>;
  if(userData.status === 'rejected') return <div className="h-screen flex items-center justify-center bg-red-50"><div className="text-red-600 font-bold">تم رفض طلبك</div><button onClick={()=>signOut(auth)} className="ml-4 bg-white px-4 py-1 rounded">خروج</button></div>;
  if (isBannedAll) return (
      <div className="h-screen flex flex-col items-center justify-center bg-red-50 text-center p-6"><Ban size={80} className="text-red-600 mb-4" /><h2 className="text-3xl font-bold text-red-800 mb-2 font-arabic">تم حظر حسابك</h2><p className="text-red-600 mb-6 font-bold">يرجى التواصل مع الإدارة أو المستر لمعرفة السبب.</p><button onClick={()=>signOut(auth)} className="bg-white text-red-600 px-6 py-2 rounded-full font-bold shadow-md hover:bg-red-100">تسجيل الخروج</button></div>
  );

  const getExamAccessState = (exam) => {
    const rule = exam?.accessRule;
    if (!rule?.enabled || !rule.requiredExamId) return { allowed: true, locked: false };

    const override = (examAccessOverrides || []).find((item) => item.examId === exam.id && item.studentId === user.uid && item.allowed !== false);
    if (override && rule.allowAdminOverride !== false) {
      return { allowed: true, locked: false, override: true, message: 'مفتوح لك باستثناء من الإدارة.' };
    }

    const requiredExam = exams.find((item) => item.id === rule.requiredExamId);
    const attempts = examResults.filter((result) => result.examId === rule.requiredExamId && result.status === 'completed');
    const percentages = attempts.map((result) => {
      if (result.percentage !== undefined) return safeNumber(result.percentage, 0);
      return getResultPercentage(result);
    });
    const bestPercentage = percentages.length ? Math.max(...percentages) : null;
    const requiredPercentage = Math.min(100, Math.max(0, safeNumber(rule.requiredPercentage, 70)));

    if (bestPercentage !== null && bestPercentage >= requiredPercentage) {
      return { allowed: true, locked: false, bestPercentage, requiredPercentage };
    }

    const requiredTitle = requiredExam?.title || 'الامتحان السابق';
    const message = bestPercentage === null
      ? `يجب حل ${requiredTitle} أولًا بنسبة ${requiredPercentage}% أو أكثر.`
      : `يجب اجتياز ${requiredTitle} بنسبة ${requiredPercentage}% أو أكثر. درجتك الحالية: ${bestPercentage}%.`;

    return {
      allowed: false,
      locked: true,
      bestPercentage,
      requiredPercentage,
      requiredTitle,
      message
    };
  };

  const startExamWithCode = async (exam, options = {}) => {
    if (isBannedExam) return platformNotify("أنت محظور من دخول الامتحانات.");
    const accessState = getExamAccessState(exam);
    if (!accessState.allowed && !options.skipCode) {
      platformNotify(accessState.message || 'هذا الامتحان مقفول حاليًا.');
      return;
    }

    const previousAttempts = examResults.filter(r => r.examId === exam.id);
    const previousResult = previousAttempts.find(r => ['continue', 'restart'].includes(r.adminDecision))
      || previousAttempts.find(r => ['security_hold', 'in_progress', 'cheated'].includes(r.status))
      || previousAttempts[0];
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

        if (hasAdminContinueApproval) {
          const approvedResume = {
            ...previousResult,
            status: 'in_progress',
            answers: previousResult.answers || {},
            remainingTime: safeNumber(previousResult.remainingTime, exam.duration * 60) > 0 ? safeNumber(previousResult.remainingTime, exam.duration * 60) : exam.duration * 60,
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

        if (hasAdminRestartApproval) {
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

        if (previousResult.status === 'completed') {
          platformNotify(`أنت امتحنت الامتحان ده قبل كده وجبت ${previousResult.score}.`);
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

  return (
    <LazyPanel>
    <div className="bg-slate-50 relative font-['Cairo'] min-h-screen block" dir="rtl">

      <MobileStudentBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      {playingVideo && <LazyPanel><SecureVideoPlayer video={playingVideo} user={user} userName={userData?.name} onClose={() => setPlayingVideo(null)} onProgress={handleVideoProgress} /></LazyPanel>}
      {playingHtml && <LazyPanel><InteractiveViewer content={playingHtml} user={userData} onClose={() => setPlayingHtml(null)} /></LazyPanel>}
      {/* النظام امتحانات الطلاب متوقفة مؤقتًا  */}
      <FloatingArabicBackground />
      {showNotifications && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNotifications(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-auto p-5" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-black flex items-center gap-2"><Bell className="text-amber-600"/> إشعارات المنصة</h2><button onClick={() => setShowNotifications(false)} className="bg-slate-100 rounded-full p-2"><X size={18}/></button></div>
            {(notifications || []).length ? (notifications || []).map((n, i) => (
              <div key={n.id || i} className="border rounded-2xl p-4 mb-3 bg-slate-50"><p className="font-black text-slate-900">{n.title || 'تنبيه جديد'}</p><p className="text-sm text-slate-600 mt-1 leading-6">{n.body || n.text || n.message}</p><p className="text-[11px] text-slate-400 mt-2">{n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString('ar-EG') : ''}</p></div>
            )) : <div className="text-center text-slate-500 font-bold py-8">لا توجد إشعارات حاليًا.</div>}
          </div>
        </div>
      )}
      
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
                <div onClick={() => {setActiveTab('learning_path'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='learning_path'?'bg-blue-100 text-blue-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}><Target/> مساري التعليمي</div>
                <div onClick={() => {setActiveTab('remediation'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='remediation'?'bg-red-100 text-red-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-red-600'}`}><BrainCircuit/> العلاج الذكي</div>
                <div onClick={() => {setActiveTab('student_messages'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='student_messages'?'bg-emerald-100 text-emerald-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'}`}><MessageSquare/> رسائلي</div>
                <div onClick={() => {setActiveTab('support'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='support'?'bg-sky-100 text-sky-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-sky-600'}`}><MessageSquare/> الدعم الفني</div>
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
                <button onClick={() => setShowNotifications(true)} className="relative bg-white hover:bg-amber-50 text-slate-800 px-4 py-2 rounded-full font-bold shadow border transition flex items-center gap-2"><Bell size={18}/><span className="hidden md:inline">الإشعارات</span>{unseenNotificationCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">{unseenNotificationCount}</span>}</button>
            </div>
            <div className="flex items-center gap-3">
                {isPremium && <span className="hidden md:flex bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold items-center gap-1 border border-amber-200"><Crown size={14}/> VIP صالح حتى: {userData?.subscriptionExpiry?.toDate().toLocaleDateString('ar-EG')}</span>}
            </div>
        </div>

        <StudentTopGreeting user={user} userData={userData} isPremium={isPremium} videos={videos} exams={exams} examResults={examResults} setActiveTab={setActiveTab} />
        {activeTab === 'home' && <div className="mb-6"><WisdomBox /></div>}

        {activeTab === 'home' && (
            <div className="space-y-8 page-soft-enter">
                <StudentContinueCard latestVideoActivity={latestVideoActivity} inProgressExam={inProgressExam} pendingAssignments={pendingAssignments} nextStudyAction={nextStudyAction} setActiveTab={setActiveTab} completedExamResults={completedExamResults} averageScore={averageScore} latestCompletedResult={latestCompletedResult} pendingAssignmentsCount={pendingAssignmentsCount} />
                <StudentSmartDashboard setActiveTab={setActiveTab} videoCompletionPercent={videoCompletionPercent} completedVideoCount={completedVideoCount} videos={videos} completedExamResults={completedExamResults} averageScore={averageScore} pendingAssignmentsCount={pendingAssignmentsCount} examResults={examResults} nextStudyAction={nextStudyAction} smartWeakBranches={smartWeakBranches} />
                <StudentSuccessPanel userData={userData} videos={videos} exams={exams} examResults={examResults} assignments={assignments} assignmentSubmissions={assignmentSubmissions} videoViews={videoViews} setActiveTab={setActiveTab} />
                <StudentCompactHome setActiveTab={setActiveTab} isBannedContent={isBannedContent} isBannedExam={isBannedExam} videos={videos} exams={exams} examResults={examResults} />
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
            <StudentGrowthPanel
              user={user}
              userData={userData}
              exams={exams}
              examResults={examResults}
              assignments={assignments}
              assignmentSubmissions={assignmentSubmissions}
              hwResults={hwResults}
              mistakes={mistakes}
              videoViews={videoViews}
              content={content}
              onStartMistakesExam={startMistakesExam}
            />
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

                    <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-emerald-500 md:col-span-2">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CreditCard className="text-emerald-500"/> إرسال طلب دفع من داخل المنصة</h3>
                        <p className="text-slate-500 text-sm mb-4">بعد التحويل اكتب بيانات العملية هنا، وستظهر مباشرة في لوحة الأدمن داخل مركز التشغيل الشامل.</p>
                        <form onSubmit={handleSubmitPaymentRequest} className="grid md:grid-cols-4 gap-3">
                            <input type="number" className="border p-3 rounded-xl" placeholder="المبلغ" value={paymentDraft.amount} onChange={(e)=>setPaymentDraft({...paymentDraft, amount:e.target.value})} />
                            <select className="border p-3 rounded-xl" value={paymentDraft.method} onChange={(e)=>setPaymentDraft({...paymentDraft, method:e.target.value})}>
                                <option value="vodafone_cash">فودافون كاش</option>
                                <option value="instapay">إنستا باي</option>
                                <option value="center">دفع في السنتر</option>
                            </select>
                            <input className="border p-3 rounded-xl" placeholder="رقم العملية / آخر 4 أرقام" value={paymentDraft.transactionId} onChange={(e)=>setPaymentDraft({...paymentDraft, transactionId:e.target.value})} />
                            <input className="border p-3 rounded-xl" placeholder="ملاحظة اختيارية" value={paymentDraft.note} onChange={(e)=>setPaymentDraft({...paymentDraft, note:e.target.value})} />
                            <button disabled={isSendingPayment} className="md:col-span-4 bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 shadow-lg flex items-center justify-center gap-2">
                                {isSendingPayment ? <Loader2 className="animate-spin" /> : 'إرسال طلب الدفع للمراجعة'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'mistakes_bank' && !isBannedExam && (
            <div className="space-y-5">
              <LearningHubTabs activeTab={activeTab} setActiveTab={setActiveTab} setLearningHubTab={setLearningHubTab} />
              <StudentGrowthPanel
                user={user}
                userData={userData}
                exams={exams}
                examResults={examResults}
                assignments={assignments}
                assignmentSubmissions={assignmentSubmissions}
                hwResults={hwResults}
                mistakes={mistakes}
                videoViews={videoViews}
                content={content}
                onStartMistakesExam={startMistakesExam}
              />
            </div>
        )}

          {activeTab === 'courses' && !isBannedContent && <LazyPanel><StudentCoursesHub user={user} userData={userData} exams={exams} onStartExam={startExamWithCode} /></LazyPanel>}

          {activeTab === 'learning_path' && !isBannedContent && (
            <StudentLearningPath
              videos={videos}
              exams={exams}
              examResults={examResults}
              assignments={assignments}
              assignmentSubmissions={assignmentSubmissions}
              videoViews={videoViews}
              mistakes={mistakes}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'remediation' && !isBannedExam && (
            <StudentRemediationCenter
              user={user}
              exams={exams}
              examResults={examResults}
              mistakes={mistakes}
              content={content}
              onStartMistakesExam={startMistakesExam}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'student_messages' && (
            <StudentMessagesInbox user={user} userData={userData} />
          )}

          {activeTab === 'support' && (
            <div className="glass-panel p-4 md:p-8 rounded-2xl max-w-4xl mx-auto">
              <div className="mb-6">
                <p className="text-sm font-black text-sky-700">الدعم الفني</p>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900">افتح تذكرة للإدارة</h2>
                <p className="text-slate-500 font-bold mt-2">اكتب المشكلة مرة واحدة بوضوح، وهتظهر للأدمن في مركز الدعم والرسائل.</p>
              </div>
              <form onSubmit={handleSendSupportTicket} className="bg-white rounded-3xl border p-5 space-y-4">
                <select className="w-full border p-3 rounded-xl font-bold" value={supportDraft.category} onChange={(e)=>setSupportDraft({...supportDraft, category:e.target.value})}>
                  <option value="exam">مشكلة امتحان</option>
                  <option value="payment">دفع أو اشتراك</option>
                  <option value="video">فيديو أو ملف</option>
                  <option value="account">حسابي وبياناتي</option>
                  <option value="other">أخرى</option>
                </select>
                <textarea className="w-full border p-3 rounded-xl min-h-36" placeholder="اكتب تفاصيل المشكلة هنا..." value={supportDraft.message} onChange={(e)=>setSupportDraft({...supportDraft, message:e.target.value})} />
                <button disabled={isSendingSupport} className="w-full bg-sky-700 text-white font-bold py-4 rounded-xl hover:bg-sky-800 flex items-center justify-center gap-2">
                  {isSendingSupport ? <Loader2 className="animate-spin" /> : <><MessageSquare size={20}/> إرسال التذكرة</>}
                </button>
              </form>
            </div>
          )}

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
                const examAttempts = examResults.filter(r => r.examId === e.id);
                const prevResult = examAttempts.find(r => ['continue', 'restart'].includes(r.adminDecision))
                  || examAttempts.find(r => ['security_hold', 'in_progress', 'cheated'].includes(r.status))
                  || examAttempts.find(r => r.status === 'completed')
                  || examAttempts[0];
                const isExamTimeOver = Date.now() > new Date(e.endTime).getTime();
                const accessState = getExamAccessState(e);
                
                let statusText = null; let statusClass = "";
                const canResumeByAdmin = prevResult && prevResult.adminDecision === 'continue';
                const canRestartByAdmin = prevResult && prevResult.adminDecision === 'restart';
                const waitingAdminDecision = prevResult && ['security_hold', 'in_progress', 'cheated'].includes(prevResult.status) && !canResumeByAdmin && !canRestartByAdmin;
                if (prevResult) {
                    if (canResumeByAdmin) { statusText = "مسموح بالاستكمال ✅"; statusClass = "bg-blue-600 text-white"; }
                    else if (canRestartByAdmin) { statusText = "مسموح بالإعادة ✅"; statusClass = "bg-amber-600 text-white"; }
                    else if (prevResult.status === 'completed') { statusText = `تم الحل: ${prevResult.score} درجة`; statusClass = "bg-green-500 text-white"; }
                    else if (prevResult.status === 'security_hold') { statusText = "موقوف في انتظار الأدمن 🛡️"; statusClass = "bg-red-600 text-white"; }
                    else if (prevResult.status === 'in_progress') { statusText = "ينتظر موافقة الأدمن ⏳"; statusClass = "bg-yellow-500 text-white"; } 
                    else if (prevResult.status === 'cheated') { statusText = "تم الحظر (غش)"; statusClass = "bg-red-600 text-white"; }
                }

                return (
                  <motion.div whileHover={{scale:1.01}} key={e.id} className={`glass-card p-4 md:p-6 rounded-2xl relative overflow-hidden flex flex-col ${(e.isPremium && !isPremium) || accessState.locked ? 'opacity-80' : ''}`}>
                    {statusText && <div className={`absolute top-0 left-0 text-[10px] md:text-xs px-2 md:px-3 py-1 rounded-br-xl font-bold shadow-md ${statusClass}`}>{statusText}</div>}
                    {e.isPremium && <div className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1"><Crown size={12}/> VIP</div>}
                    
                    <h3 className={`text-lg md:text-xl font-bold mb-2 mt-4 md:mt-0 ${e.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'}`}>{e.title}</h3>
                    <div className="flex justify-between text-xs md:text-sm text-slate-500 mb-4"><span>⏳ {e.duration} دقيقة</span><span>📝 {e.questions.reduce((acc,g)=>acc+g.subQuestions.length,0)} سؤال</span></div>
                    
                    {accessState.locked && (
                      <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-3 text-sm font-bold flex items-start gap-2">
                        <Lock size={16} className="mt-0.5 shrink-0"/>
                        <span>{accessState.message}</span>
                      </div>
                    )}
                    {accessState.override && (
                      <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-sm font-bold flex items-center gap-2">
                        <Unlock size={16}/> مفتوح لك باستثناء من الإدارة
                      </div>
                    )}

                    <div className="mt-auto">
                        {accessState.locked ? (
                            <button disabled className="w-full bg-blue-100 text-blue-500 py-2 md:py-3 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2 text-sm"><Lock size={14}/> الامتحان مقفول بشرط سابق</button>
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
                        ) : prevResult && prevResult.status === 'completed' ? (
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
                            <div className="bg-red-50 text-red-600 p-2 md:p-3 rounded-xl font-bold text-center border border-red-200 text-sm">لا يمكن دخول الامتحان</div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs text-slate-500">يبدأ: {new Date(e.startTime).toLocaleString('ar-EG')}</p>
                                {e.isPremium && !isPremium ? (
                                    <button onClick={()=>handlePremiumClick(()=>{})} className="w-full bg-slate-200 text-slate-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed text-sm"><Lock size={16}/> امتحان مقفل (للمشتركين)</button>
                                ) : (
                                    <button onClick={() => setPreExam(e)} className="w-full bg-slate-900 text-white py-2 md:py-3 rounded-xl font-bold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-lg hover:shadow-slate-500/30 transition text-sm"><Lock size={14}/> صفحة ما قبل الامتحان</button>
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
              <LearningHubTabs activeTab={activeTab} setActiveTab={setActiveTab} setLearningHubTab={setLearningHubTab} />
              <StudentAssignmentsPanel assignments={assignments} submissions={assignmentSubmissions} user={user} userData={userData} />
            </div>
        )}

        {activeTab === 'smart_hw_results' && !isBannedExam && (
            <div className="space-y-5">
              <LearningHubTabs activeTab={activeTab} setActiveTab={setActiveTab} setLearningHubTab={setLearningHubTab} />
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
      {preExam && (
        <LazyPanel>
        <ExamPreStartPanel
          exam={preExam}
          results={examResults}
          previousExam={preExam.accessRule?.requiredExamId ? exams.find((e) => e.id === preExam.accessRule.requiredExamId) : null}
          previousPercent={(() => {
            const prev = preExam.accessRule?.requiredExamId ? examResults.filter((r) => r.examId === preExam.accessRule.requiredExamId && r.status === 'completed') : [];
            return prev.length ? Math.max(...prev.map((r) => Number(r.percentage ?? r.percent ?? r.scorePercentage ?? r.score ?? 0))) : null;
          })()}
          onStart={() => { const target = preExam; setPreExam(null); startExamWithCode(target); }}
          onClose={() => setPreExam(null)}
        />
        </LazyPanel>
      )}
      {scanningHwId && <LazyPanel><SmartHomeworkScanner hwId={scanningHwId} user={user} onClose={() => setScanningHwId(null)} /></LazyPanel>}
    </div>
    </LazyPanel>
  );
};

export default StudentDashboard;
