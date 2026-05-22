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

export default function StudentVideosTab({ ctx }) {
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
{activeTab === 'videos' && !isBannedContent && (
            <div className="space-y-6 page-soft-enter">
                <StudentV2SectionTitle badge="المحاضرات" title="مكتبة الفيديوهات" description="تابع الشرح وسجّل تقدمك وافتح الامتحانات المرتبطة بعد المشاهدة." />
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
                            <div className="h-48 bg-gradient-to-br from-slate-800 to-black flex items-center justify-center relative overflow-hidden" onClick={() => handlePremiumClick(() => setPlayingVideo(v))}>
                                {(v.thumbnailUrl || v.posterUrl || v.image) && <img src={v.thumbnailUrl || v.posterUrl || v.image} className="absolute inset-0 w-full h-full transition duration-500 group-hover:scale-105" style={imagePlacementStyle(v.imagePlacement)} alt={v.title || 'غلاف الفيديو'} />}
                                <div className="absolute inset-0 bg-black/35" />
                                {v.isPremium && !isPremium ? <Lock className="relative z-10 text-white w-16 h-16 opacity-90 drop-shadow-lg" /> : <PlayCircle className="relative z-10 text-white w-16 h-16 opacity-90 group-hover:scale-110 transition drop-shadow-lg"/>}
                                <span className="absolute bottom-2 left-2 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(v.grade)}</span>
                                {v.isPremium && <span className="absolute top-2 right-2 z-10 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-md"><Crown size={12}/> VIP</span>}
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
    </>
  );
}
