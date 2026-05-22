import React, { lazy, Suspense } from 'react';
import { PlayCircle, FileText, LogOut, User, Lock, Menu, X, Loader2, Phone, MessageSquare, BookOpen, ClipboardList, Unlock, Settings, Bell, Download, Code, Sparkles, Ban, RefreshCw, Link as LinkIcon, QrCode, FileCheck, BarChart3, BrainCircuit, Headphones, DownloadCloud, Play, Target, Crown, CreditCard, Key } from '@shared/icons/lucide-shim.jsx';
import { motion } from 'framer-motion';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades';
import { PWAInstallBox, ModernLogo, FloatingArabicBackground } from '@features/home/HomeWidgets';
import PomodoroFocusMode from '@features/study/PomodoroFocusMode';
import { platformNotify, platformPrompt, generatePDF, safeNumber, getResultPercentage, VIDEO_EXAM_UNLOCK_PERCENT } from '@shared/core/platformShared.jsx';
import PerformanceOverview from '@features/student-dashboard/components/PerformanceOverview.jsx';
import { StudentUnifiedHomeDashboard } from '@features/student-dashboard/components/home/StudentHomeCards.jsx';
import { LearningHubTabs } from '@features/student-dashboard/components/layout/StudentLayoutParts.jsx';
import { StudentV2SectionTitle, StudentV2Sidebar, StudentV2Topbar } from '@features/student-dashboard/components/chrome/StudentV2Chrome.jsx';
import StudentAssignmentsPanel from '@features/students/assignments/StudentAssignmentsPanel.jsx';
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

export default function StudentHtmlsTab({ ctx }) {
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

  return (
    <>
{activeTab === 'htmls' && !isBannedContent && (
            <div className="space-y-6 page-soft-enter">
              <StudentV2SectionTitle badge="تفاعلي" title="المحتوى التفاعلي" description="تجارب تعليمية تفاعلية جاهزة للفتح داخل المنصة." />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {htmls.map(h => (
                    <motion.div whileHover={{y:-5}} key={h.id} className="glass-card rounded-xl overflow-hidden cursor-pointer relative" onClick={() => handlePremiumClick(() => setPlayingHtml(h))}>
                        <div className="h-48 bg-gradient-to-br from-purple-600 to-indigo-900 flex items-center justify-center relative group">
                            {(h.thumbnailUrl || h.image || h.posterUrl) && <img src={h.thumbnailUrl || h.image || h.posterUrl} className="absolute inset-0 w-full h-full" style={imagePlacementStyle(h.imagePlacement)} alt={h.title || 'غلاف المحتوى'} />}<div className="absolute inset-0 bg-black/25" />{h.isPremium && !isPremium ? <Lock className="relative z-10 text-slate-200 w-20 h-20 opacity-80" /> : <Code className="relative z-10 text-white w-20 h-20 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/>}
                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(h.grade)}</span>
                            {h.isPremium && <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-md"><Crown size={12}/> VIP</span>}
                        </div>
                        <div className="p-4"><h3 className={`font-bold text-lg ${h.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'}`}>{h.title}</h3><button className={`mt-2 w-full font-bold py-2 rounded-lg transition shadow-sm ${h.isPremium && !isPremium ? 'bg-slate-100 text-slate-400' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>{h.isPremium && !isPremium ? 'مقفل' : 'تشغيل'}</button></div>
                    </motion.div>
                ))}
            </div>
            </div>
        )}
    </>
  );
}
