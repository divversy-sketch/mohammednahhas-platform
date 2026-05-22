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

export default function StudentSmartHomeworkResultsTab({ ctx }) {
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
    </>
  );
}
