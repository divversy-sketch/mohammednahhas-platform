import { useState, lazy, Suspense } from 'react';
import { signOut } from 'firebase/auth';
import { addDoc, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@services/firebase';
import { platformNotify, platformPromptAsync, safeNumber, VIDEO_EXAM_UNLOCK_PERCENT } from '@shared/core/platformShared.jsx';
import { useStudentDashboardData } from '@features/student-dashboard/hooks/useStudentDashboardData.js';
import { useStudentPaymentActions } from '@features/student-dashboard/hooks/useStudentPaymentActions.js';
import { useStudentProfileActions } from '@features/student-dashboard/hooks/useStudentProfileActions.js';
import { useStudentSubscriptionActions } from '@features/student-dashboard/hooks/useStudentSubscriptionActions.js';
import { useStudentSupportActions } from '@features/student-dashboard/hooks/useStudentSupportActions.js';
import { useStudentVideoProgress } from '@features/student-dashboard/hooks/useStudentVideoProgress.js';
import { getStudentAssignmentSummary, getStudentContentBuckets, getStudentPerformanceSummary, getSubscriptionDaysLeft, getVideoCompletionSummary, getWeakBranches } from '@features/student-dashboard/selectors.js';
import { resolveStudentExamAccessState } from '@features/exams/utils/studentExamAccess.js';
import StudentSmartTeacherPopup from '@features/smart-teacher/StudentSmartTeacherPopup.jsx';
import StudentAppV2 from '@v2/student/StudentAppV2.jsx';
import { AccountStatusScreen, AppLoading } from '@v2/student/AccountStatusScreen.jsx';

const ExamRunner = lazy(() => import('@features/exams/runner/ExamRunner.jsx'));
const PomodoroFocusMode = lazy(() => import('@features/study/PomodoroFocusMode'));

const LazyPanel = ({ children }) => <Suspense fallback={<AppLoading />}>{children}</Suspense>;

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
  
  const { subscriptionCodeInput, setSubscriptionCodeInput, isCharging, handleChargeSubscriptionCode } = useStudentSubscriptionActions();
  const { paymentDraft, setPaymentDraft, isSendingPayment, handleSubmitPaymentRequest } = useStudentPaymentActions({ user, userData });
  const { supportDraft, setSupportDraft, isSendingSupport, handleSendSupportTicket } = useStudentSupportActions({ user, userData });
  const { handleUpdateMyProfile } = useStudentProfileActions({ user, userData, editFormData });

  const {
    content, exams, examResults, hwResults, assignments, assignmentSubmissions, videoViews,
    mistakes, notifications, hasNewNotif, examAccessOverrides, setContent, setExams, setExamResults, setHwResults,
    setAssignments, setAssignmentSubmissions, setVideoViews, setMistakes, setNotifications, setHasNewNotif
  } = useStudentDashboardData({ user, userData, setScanningHwId, setEditFormData });


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
  const weakBranches = smartWeakBranches;


  if (activeExam) return <LazyPanel><ExamRunner exam={activeExam} user={user} onClose={() => setActiveExam(null)} /></LazyPanel>;
  if (showFocusMode) return <LazyPanel><PomodoroFocusMode onClose={() => setShowFocusMode(false)} /></LazyPanel>;
  if (reviewingExam) {
      const result = examResults.find(r => r.examId === reviewingExam.id);
      return <LazyPanel><ExamRunner exam={reviewingExam} user={user} onClose={() => setReviewingExam(null)} isReviewMode={true} existingResult={result} /></LazyPanel>;
  }

  const isBannedAll = userData.status === 'banned_all';
  const isBannedExam = userData.status === 'banned_exam' || userData.status === 'banned_cheating'; 
  const isBannedContent = userData.status === 'banned_content';

  if (userData.status === 'pending') return <AccountStatusScreen kind="pending" onSignOut={() => signOut(auth)} />;
  if (userData.status === 'rejected') return <AccountStatusScreen kind="rejected" onSignOut={() => signOut(auth)} />;
  if (isBannedAll) return <AccountStatusScreen kind="banned" onSignOut={() => signOut(auth)} />;

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
    // Lesson exams open by the course's own rules (watch percentage), not by the exam's public window.
    if (!options.fromCourse && now < start) return platformNotify(`الامتحان لم يبدأ بعد. موعد البدء: ${start.toLocaleString('ar-EG')}`);
    if (!options.fromCourse && now > end) return platformNotify("عفواً، انتهى وقت الامتحان.");
    let code = exam.accessCode;
    if (!options.skipCode && exam.accessCode) {
      code = await platformPromptAsync(`اكتب كود «${exam.title || 'الامتحان'}» اللي المستر إداه لك.`, { title: 'كود الامتحان', placeholder: 'الكود', icon: 'key', confirmLabel: 'ابدأ الامتحان' });
      if (code === null || code === undefined) return;
      code = String(code).trim();
    }
    if (options.skipCode || !exam.accessCode || code === String(exam.accessCode).trim()) {
        try {
            const attemptRef = await addDoc(collection(db, 'exam_results'), {
              examId: exam.id,
              studentId: user.uid,
              studentName: user.displayName,
              status: 'in_progress',
              adminDecision: null,
              resumeApproved: false,
              sourceVideoId: options.sourceVideoId || null,
              startedFromVideo: !!options.sourceVideoId,
              courseId: options.sourceCourseId || null,
              lessonId: options.sourceLessonId || null,
              submittedAt: serverTimestamp()
            });
            setActiveExam({ ...exam, attemptId: attemptRef.id, sourceVideoId: options.sourceVideoId || null });
        } catch (error) { console.error("Error creating attempt record:", error); platformNotify("حدث خطأ أثناء بدء الامتحان. حاول مرة أخرى."); }
    } else { platformNotify("الكود غلط. اتأكد منه وجرّب تاني."); }
  };


  const studentTabCtx = {
    user,
    userData,
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

  return <>
    <StudentAppV2 ctx={studentTabCtx} />
    <StudentSmartTeacherPopup user={user} userData={userData} />
  </>;
};

export default StudentDashboard;
