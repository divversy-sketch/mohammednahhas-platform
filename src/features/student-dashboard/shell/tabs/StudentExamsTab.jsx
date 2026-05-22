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

export default function StudentExamsTab({ ctx }) {
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
{activeTab === 'exams' && !isBannedExam && (
          <div className="space-y-6 page-soft-enter">
            <StudentV2SectionTitle badge="الامتحانات" title="مركز الاختبارات" description="اعرف حالة كل امتحان، المحاولات السابقة، والشهادات المتاحة بعد الانتهاء." />
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
                    {(e.examImageUrl || e.thumbnailUrl || e.image) && (
                      <div className="h-40 rounded-2xl bg-slate-100 overflow-hidden border mb-4 mt-4">
                        <img src={e.examImageUrl || e.thumbnailUrl || e.image} className="w-full h-full" style={imagePlacementStyle(e.imagePlacement)} alt={e.title || 'غلاف الامتحان'} />
                      </div>
                    )}
                    
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
            </div>
        )}
    </>
  );
}
