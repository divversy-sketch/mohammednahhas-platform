import React, { lazy, Suspense } from 'react';
import { PlayCircle, FileText, LogOut, User, Lock, Menu, X, Loader2, Phone, MessageSquare, BookOpen, ClipboardList, Unlock, Settings, Bell, Download, Code, Sparkles, Ban, RefreshCw, Link as LinkIcon, QrCode, FileCheck, BarChart3, BrainCircuit, Headphones, DownloadCloud, Play, Target, Crown, CreditCard, Key } from '@shared/icons/lucide-shim.jsx';
import { signOut } from 'firebase/auth';
import { motion } from 'framer-motion';
import { auth } from '@services/firebase';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades';
import { PWAInstallBox, ModernLogo, FloatingArabicBackground } from '@features/home/HomeWidgets';
import PomodoroFocusMode from '@features/study/PomodoroFocusMode';
import { platformNotify, platformPrompt, generatePDF, safeNumber, getResultPercentage, VIDEO_EXAM_UNLOCK_PERCENT } from '@shared/core/platformShared.jsx';
import PerformanceOverview from '@features/student-dashboard/components/PerformanceOverview.jsx';
import { StudentUnifiedHomeDashboard } from '@features/student-dashboard/components/home/StudentHomeCards.jsx';
import { LearningHubTabs } from '@features/student-dashboard/components/layout/StudentLayoutParts.jsx';
import { StudentV2SectionTitle, StudentV2Sidebar, StudentV2Topbar } from '@features/student-dashboard/components/chrome/StudentV2Chrome.jsx';
import StudentAssignmentsPanel from '@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx';
import StudentSuccessPanel from '@features/studentSuccess/StudentSuccessPanel.jsx';
import { imagePlacementStyle } from '@shared/utils/imagePlacement.js';
import { StudentLiveClassesPanel, StudentExamReviewCenter, StudentCertificatePanel } from '@features/product/ProductExperienceSuite.jsx';
import { StudentReviewQuiz } from '@features/review/ReviewQuizSystem.jsx';

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

export default function StudentHomeTab({ ctx }) {
  const {
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
  } = ctx;

  const smartWeakBranches = ctx.smartWeakBranches || ctx.weakBranches || weakBranches || [];

  const nextStudyAction = ctx.nextStudyAction || (() => {
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
    if (pendingAssignments?.[0]) {
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
      text: videos?.[0]?.title || 'افتح المحاضرات المتاحة لك',
      action: () => setActiveTab('videos'),
      button: 'فتح المحاضرات',
      icon: <PlayCircle size={18} />,
      tone: 'from-slate-900 to-slate-700 text-white'
    };
  })();

  return (
    <>
{activeTab === 'home' && (
          <StudentUnifiedHomeDashboard
            userData={userData}
            isPremium={isPremium}
            nextStudyAction={nextStudyAction}
            latestVideoActivity={latestVideoActivity}
            inProgressExam={inProgressExam}
            nextOpenExam={nextOpenExam}
            pendingAssignments={pendingAssignments}
            pendingAssignmentsCount={pendingAssignmentsCount}
            videoCompletionPercent={videoCompletionPercent}
            completedVideoCount={completedVideoCount}
            videos={videos}
            exams={exams}
            filesAndLinks={filesAndLinks}
            htmls={htmls}
            completedExamResults={completedExamResults}
            averageScore={averageScore}
            examResults={examResults}
            subscriptionDaysLeft={subscriptionDaysLeft}
            smartWeakBranches={smartWeakBranches}
            recentNotificationItems={recentNotificationItems}
            unseenNotificationCount={unseenNotificationCount}
            setActiveTab={setActiveTab}
            setShowNotifications={setShowNotifications}
            setHasNewNotif={setHasNewNotif}
            isBannedContent={isBannedContent}
            isBannedExam={isBannedExam}
            userId={user?.uid}
          />
        )}
    </>
  );
}
