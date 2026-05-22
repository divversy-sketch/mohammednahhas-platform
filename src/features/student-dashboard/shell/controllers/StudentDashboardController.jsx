import { useState, lazy, Suspense } from 'react';
import { signOut } from 'firebase/auth';
import { PlayCircle, FileText, LogOut, User, Lock, Menu, X, Loader2, Phone, MessageSquare, BookOpen, ClipboardList, Unlock, Settings, Bell, Download, Code, Sparkles, Ban, RefreshCw, Link as LinkIcon, QrCode, FileCheck, BarChart3, BrainCircuit, Headphones, DownloadCloud, Play, Target, Crown, CreditCard, Key } from '@shared/icons/lucide-shim.jsx';
import { motion } from 'framer-motion';
import { auth } from '@services/firebase';
import MobileStudentBottomNav from '@features/student/MobileStudentBottomNav';


import { GradeOptions, getGradeLabel } from '@shared/constants/grades';
import { PWAInstallBox, ModernLogo, FloatingArabicBackground } from '@features/home/HomeWidgets';
import PomodoroFocusMode from '@features/study/PomodoroFocusMode';


import { platformNotify, platformPrompt, generatePDF, safeNumber, getResultPercentage, VIDEO_EXAM_UNLOCK_PERCENT } from '@shared/core/platformShared.jsx';


import PerformanceOverview from '@features/student-dashboard/components/PerformanceOverview.jsx';
import { useStudentDashboardData } from '@features/student-dashboard/hooks/useStudentDashboardData.js';
import { StudentUnifiedHomeDashboard } from '@features/student-dashboard/components/home/StudentHomeCards.jsx';
import { LearningHubTabs } from '@features/student-dashboard/components/layout/StudentLayoutParts.jsx';
import { StudentV2SectionTitle, StudentV2Sidebar, StudentV2Topbar } from '@features/student-dashboard/components/chrome/StudentV2Chrome.jsx';
import StudentAssignmentsPanel from '@features/students/assignments/StudentAssignmentsPanel.jsx';
import StudentSuccessPanel from '@features/studentSuccess/StudentSuccessPanel.jsx';
import { imagePlacementStyle } from '@shared/utils/imagePlacement.js';
import { StudentLiveClassesPanel, StudentExamReviewCenter, StudentCertificatePanel } from '@features/product/ProductExperienceSuite.jsx';
import { StudentReviewQuiz } from '@features/review/ReviewQuizSystem.jsx';
import { useBrowserBackTab } from '@features/student-dashboard/hooks/useBrowserBackTab.js';
import { useStudentPaymentActions } from '@features/student-dashboard/hooks/useStudentPaymentActions.js';
import { useStudentProfileActions } from '@features/student-dashboard/hooks/useStudentProfileActions.js';
import { useStudentSubscriptionActions } from '@features/student-dashboard/hooks/useStudentSubscriptionActions.js';
import { useStudentSupportActions } from '@features/student-dashboard/hooks/useStudentSupportActions.js';
import { useStudentVideoProgress } from '@features/student-dashboard/hooks/useStudentVideoProgress.js';
import { getStudentAssignmentSummary, getStudentContentBuckets, getStudentPerformanceSummary, getSubscriptionDaysLeft, getVideoCompletionSummary, getWeakBranches } from '@features/student-dashboard/selectors.js';
import { resolveStudentExamAccessState } from '@features/exams/utils/studentExamAccess.js';

import StudentHomeTab from '../tabs/StudentHomeTab.jsx';
import StudentPerformanceTab from '../tabs/StudentPerformanceTab.jsx';
import StudentSubscriptionTab from '../tabs/StudentSubscriptionTab.jsx';
import StudentMistakesBankTab from '../tabs/StudentMistakesBankTab.jsx';
import StudentCoursesTab from '../tabs/StudentCoursesTab.jsx';
import StudentReviewQuizTab from '../tabs/StudentReviewQuizTab.jsx';
import StudentLearningPathTab from '../tabs/StudentLearningPathTab.jsx';
import StudentRemediationTab from '../tabs/StudentRemediationTab.jsx';
import StudentMessagesTab from '../tabs/StudentMessagesTab.jsx';
import StudentSupportTab from '../tabs/StudentSupportTab.jsx';
import StudentVideosTab from '../tabs/StudentVideosTab.jsx';
import StudentFilesTab from '../tabs/StudentFilesTab.jsx';
import StudentHtmlsTab from '../tabs/StudentHtmlsTab.jsx';
import StudentInteractiveExamsTab from '../tabs/StudentInteractiveExamsTab.jsx';
import StudentExamsTab from '../tabs/StudentExamsTab.jsx';
import StudentAssignmentsTab from '../tabs/StudentAssignmentsTab.jsx';
import StudentSmartHomeworkResultsTab from '../tabs/StudentSmartHomeworkResultsTab.jsx';
import StudentSettingsTab from '../tabs/StudentSettingsTab.jsx';
import StudentDashboardMainView from '../views/StudentDashboardMainView.jsx';
import { consumeExamAttemptContinueDecision, consumeExamAttemptRestartDecision, createStudentExamAttempt } from '@features/exams/services/examAttempts.js';


const SecureVideoPlayer = lazy(() => import('@features/video-security/player/SecureVideoPlayer.jsx'));
const InteractiveViewer = lazy(() => import('@features/content/InteractiveViewer'));
const ExamRunner = lazy(() => import('@features/exams/runner/ExamRunner.jsx'));
const StudentGrowthPanel = lazy(() => import('@features/insights/StudentGrowthPanel.jsx'));
const StudentLearningPath = lazy(() => import('@features/student/StudentLearningPath.jsx'));
const StudentCoursesHub = lazy(() => import('@features/courses/CourseSystem').then((module) => ({ default: module.StudentCoursesHub })));
const StudentMessagesInbox = lazy(() => import('@features/smartLearning/SmartLearningEngine.jsx').then((module) => ({ default: module.StudentMessagesInbox })));
const StudentRemediationCenter = lazy(() => import('@features/smartLearning/SmartLearningEngine.jsx').then((module) => ({ default: module.StudentRemediationCenter })));
const ExamPreStartPanel = lazy(() => import('@features/smartLearning/SmartLearningEngine.jsx').then((module) => ({ default: module.ExamPreStartPanel })));

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





export const StudentDashboardController = ({ user, userData, installPrompt }) => {
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
  
  const { subscriptionCodeInput, setSubscriptionCodeInput, isCharging, handleChargeSubscriptionCode } = useStudentSubscriptionActions();
  const { paymentDraft, setPaymentDraft, isSendingPayment, handleSubmitPaymentRequest } = useStudentPaymentActions({ user, userData });
  const { supportDraft, setSupportDraft, isSendingSupport, handleSendSupportTicket } = useStudentSupportActions({ user, userData });
  const { handleUpdateMyProfile } = useStudentProfileActions({ user, userData, editFormData });

  const {
    content, exams, examResults, hwResults, assignments, assignmentSubmissions, videoViews,
    mistakes, notifications, hasNewNotif, examAccessOverrides, setContent, setExams, setExamResults, setHwResults,
    setAssignments, setAssignmentSubmissions, setVideoViews, setMistakes, setNotifications, setHasNewNotif
  } = useStudentDashboardData({ user, userData, setScanningHwId, setEditFormData });

  useBrowserBackTab({ activeTab, setActiveTab, setMobileMenu, fallbackTab: 'home' });

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

  const { videos, filesAndLinks, htmls, interactiveExams } = getStudentContentBuckets(content);

  const handlePremiumClick = (callback) => {
      if(!isPremium) {
          platformNotify("عفواً يا بطل، هذا المحتوى مخصص للطلاب المشتركين في الباقة المدفوعة (VIP). يرجى شحن حسابك أو التواصل مع المستر لترقية حسابك!");
          setActiveTab('subscription');
      } else {
          callback();
      }
  };

  const { getStoredLocalVideoProgress, getVideoWatchPercent, handleVideoProgress, latestVideoActivity } = useStudentVideoProgress({ user, videos, videoViews, setVideoViews });

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

  const latestCompletedResult = examResults.find(r => r.status === 'completed') || examResults[0] || null;
  const inProgressExamResult = examResults.find(r => ['in_progress', 'security_hold'].includes(r.status));
  const inProgressExam = inProgressExamResult ? exams.find(e => e.id === inProgressExamResult.examId) : null;
  const { pendingAssignments, pendingAssignmentsCount } = getStudentAssignmentSummary({ assignments, assignmentSubmissions });
  const { completedVideoCount, videoCompletionPercent } = getVideoCompletionSummary({ videos, getVideoWatchPercent });
  const { completedExamResults, averageScore } = getStudentPerformanceSummary({ examResults });
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
  const subscriptionDaysLeft = getSubscriptionDaysLeft({ isPremium, subscriptionExpiry: userData?.subscriptionExpiry, now: nowForStudentDashboard });

  const smartWeakBranches = getWeakBranches({ completedExamResults });

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

  const getExamAccessState = (exam) => resolveStudentExamAccessState({
    exam,
    exams,
    examResults,
    examAccessOverrides,
    studentId: user.uid
  });

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

          await consumeExamAttemptContinueDecision(previousResult, options);

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

          await consumeExamAttemptRestartDecision(previousResult, options, exam);

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
            const attemptRef = await createStudentExamAttempt({ exam, user, options });
            setActiveExam({ ...exam, attemptId: attemptRef.id, sourceVideoId: options.sourceVideoId || null });
        } catch (error) { console.error("Error creating attempt record:", error); platformNotify("حدث خطأ أثناء بدء الامتحان. حاول مرة أخرى."); }
    } else { platformNotify("كود خاطئ!"); }
  };


  const studentTabCtx = {
    user,
    userData,
    studentAuth: auth,
    installPrompt,
    activeTab,
    setActiveTab,
    videoSectionTab,
    setVideoSectionTab,
    lectureInnerTab,
    setLectureInnerTab,
    learningHubTab,
    setLearningHubTab,
    mobileMenu,
    setMobileMenu,
    activeExam,
    setActiveExam,
    playingVideo,
    setPlayingVideo,
    playingHtml,
    setPlayingHtml,
    reviewingExam,
    setReviewingExam,
    showNotifications,
    setShowNotifications,
    pushStatus,
    setPushStatus,
    editFormData,
    setEditFormData,
    showFocusMode,
    setShowFocusMode,
    preExam,
    setPreExam,
    scanningHwId,
    setScanningHwId,
    subscriptionCodeInput,
    setSubscriptionCodeInput,
    isCharging,
    handleChargeSubscriptionCode,
    paymentDraft,
    setPaymentDraft,
    isSendingPayment,
    handleSubmitPaymentRequest,
    supportDraft,
    setSupportDraft,
    isSendingSupport,
    handleSendSupportTicket,
    handleUpdateMyProfile,
    content,
    exams,
    examResults,
    hwResults,
    assignments,
    assignmentSubmissions,
    videoViews,
    mistakes,
    notifications,
    hasNewNotif,
    examAccessOverrides,
    setContent,
    setExams,
    setExamResults,
    setHwResults,
    setAssignments,
    setAssignmentSubmissions,
    setVideoViews,
    setMistakes,
    setNotifications,
    setHasNewNotif,
    enableMobilePushNotifications,
    isPremium,
    startMistakesExam,
    videos,
    filesAndLinks,
    htmls,
    interactiveExams,
    handlePremiumClick,
    getStoredLocalVideoProgress,
    getVideoWatchPercent,
    canOpenLinkedExam,
    openLinkedExamFromVideo,
    handleVideoProgress,
    latestVideoActivity,
    latestCompletedResult,
    inProgressExamResult,
    inProgressExam,
    pendingAssignments,
    pendingAssignmentsCount,
    completedVideoCount,
    videoCompletionPercent,
    completedExamResults,
    averageScore,
    recentNotificationItems,
    unseenNotificationCount,
    nowForStudentDashboard,
    nextOpenExam,
    weakBranches,
    subscriptionDaysLeft,
    isBannedAll,
    isBannedContent,
    isBannedExam,
    getExamAccessState,
    startExamWithCode,
  };

  return <StudentDashboardMainView ctx={studentTabCtx} />;
};

export const StudentDashboard = StudentDashboardController;
export default StudentDashboardController;
