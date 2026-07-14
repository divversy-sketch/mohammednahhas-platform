import React, { useMemo, useState } from 'react';
import { CheckCircle, Lock, X, AlertTriangle, Trash2, Eye, ShieldAlert, Phone, Edit, KeyRound, Send, MessageCircle, ClipboardList, Unlock, Layout, Bell, Download, Calendar, Clock, Upload, Users, RefreshCw, FileCheck, Crown, Key } from '@shared/icons/lucide-shim.jsx';
import { AdminReviewQuizPanel } from '@features/review/ReviewQuizSystem.jsx';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades';
import { normalizeEgyptPhone } from '@shared/utils/phone';
import { AdminCoursesManager } from '@features/courses/CourseSystem';
import { platformNotify, getQuestionsForExam, generatePDF, VIDEO_EXAM_UNLOCK_PERCENT, InlineTabs } from '@shared/core/platformShared.jsx';
import PaginationBar from '@shared/components/PaginationBar.jsx';
import ImageFitControls from '@shared/ui/ImageFitControls.jsx';
import AdminPaymentRequestsPanel from '@features/payments/admin/AdminPaymentRequestsPanel.jsx';
import AdminPerformanceAnalytics from '@features/admin-dashboard/analytics/AdminPerformanceAnalytics.jsx';
import AdminProDashboard from '@features/admin-dashboard/analytics/AdminProDashboard.jsx';
import AdminQuestionDeepAnalytics from '@features/admin-dashboard/analytics/AdminQuestionDeepAnalytics.jsx';
import AdvancedAntiCheatInsights from '@features/admin-dashboard/security/AdvancedAntiCheatInsights.jsx';
import LeaderboardPanel from '@features/leaderboard/components/LeaderboardPanel.jsx';
import SmartSubscriptionManager from '@features/subscriptions/admin/SmartSubscriptionManager.jsx';
import AdminPendingUsersPage from '@admin/pages/AdminPendingUsersPage.jsx';
import { AdminAssignmentsPage, AdminExamViewTabs, AdminQuestionBankPage } from '@admin/pages/AdminUtilityPages.jsx';
import AdminFollowUpPanel from '@features/insights/AdminFollowUpPanel.jsx';
import AdminSmartHomeworkManager from '@features/homework/AdminSmartHomeworkManager.jsx';
import { AdminAuditLogViewer, AdminNotificationsManager, AdminPlatformSettingsManager, AdminRolesManager, AdminGrowthSuite } from '@admin/parts/AdminOperationsSuite.jsx';
import { AdminSmartExamEngine, AdminStudentReports, AdminGroupsManager, AdminMessagingCenter, AdminFinanceDashboard, AdminVideoSecurityPanel } from '@features/smartLearning/SmartLearningEngine.jsx';
import AdminStudentSuccessSuite from '@features/studentSuccess/StudentSuccessAdminSuite.jsx';
import { AdminGlobalSearch, AdminLiveClassesPanel, AdminCertificatesPanel, AdminCommandQuickActions } from '@features/product/ProductExperienceSuite.jsx';
import AdminAllUsersTab from '@features/admin-dashboard/tabs/users/AdminAllUsersTab.jsx';
import AdminDashboardOverviewTab from '@features/admin-dashboard/tabs/dashboard/AdminDashboardOverviewTab.jsx';

export default function AdminMistakesTab({ ctx }) {
  const {
    adminReviewExamData,
    setAdminReviewExamData,
    adminReviewResult,
    setAdminReviewResult,
    activeTab,
    setActiveTab,
    adminExamView,
    setAdminExamView,
    adminGradeFilter,
    setAdminGradeFilter,
    newContent,
    setNewContent,
    editingUser,
    setEditingUser,
    replyTexts,
    setReplyTexts,
    examBuilder,
    setExamBuilder,
    examOverrideDraft,
    setExamOverrideDraft,
    bulkText,
    setBulkText,
    viewingResult,
    setViewingResult,
    resultsFilter,
    setResultsFilter,
    essayScoreDrafts,
    setEssayScoreDrafts,
    essayMaxDrafts,
    setEssayMaxDrafts,
    newAnnouncement,
    setNewAnnouncement,
    newStudentNotification,
    setNewStudentNotification,
    showLeaderboard,
    setShowLeaderboard,
    autoReplies,
    setAutoReplies,
    newAutoReply,
    setNewAutoReply,
    newQuote,
    setNewQuote,
    uploadProgress,
    setUploadProgress,
    isUploading,
    setIsUploading,
    viewingStudentProfile,
    setViewingStudentProfile,
    studentHistoryData,
    setStudentHistoryData,
    editingExamTime,
    setEditingExamTime,
    newEndTime,
    setNewEndTime,
    editingFullExam,
    setEditingFullExam,
    examEditMode,
    setExamEditMode,
    recalculateAfterExamEdit,
    setRecalculateAfterExamEdit,
    examEditDraft,
    setExamEditDraft,
    editingFullContent,
    setEditingFullContent,
    contentEditMode,
    setContentEditMode,
    contentEditDraft,
    setContentEditDraft,
    newSmartHw,
    setNewSmartHw,
    codeGenCount,
    setCodeGenCount,
    codeGenDays,
    setCodeGenDays,
    userData,
    adminProfile,
    examEditQuestionsPreview,
    updateQuestionInExamDraft,
    updateStudentStatusSafely,
    handleApprove,
    handleReject,
    handleChangeUserStatus,
    handleToggleSubscription,
    generateSubscriptionCodes,
    handleDeleteCode,
    copyUnusedSubscriptionCodes,
    exportSubscriptionCodesCSV,
    extendPremiumForAll,
    handleDeleteUser,
    handleDeleteMessage,
    handleDeleteExam,
    handleDeleteAnnouncement,
    handleDeleteResult,
    openAdminResultReview,
    openFullExamEditor,
    recalculateExamResultsAfterAnswerEdit,
    saveFullExamEdit,
    openFullContentEditor,
    saveFullContentEdit,
    handleApproveSecurityContinue,
    handleApproveSecurityRestart,
    deleteDocsByCollection,
    handleDeleteAllResults,
    handleDeleteAllContent,
    handleDeleteAllExams,
    handleDeleteAllHomework,
    handleDeleteAllMistakes,
    getEssayDraftKey,
    handleSaveEssayGrade,
    sendWhatsAppToParent,
    openStudentProfile,
    handleUpdateExamTime,
    handleCreateSmartHw,
    handleReplyMessage,
    handleAddAnnouncement,
    handleSendStudentNotification,
    handleUpdateUser,
    handleSendResetPassword,
    AdminPasswordResetRequestsPanel,
    openExamAccessOverride,
    revokeExamAccessOverride,
    approveGrade,
    rejectGrade,
    handleFileSelect,
    handleVideoThumbnailSelect,
    handleExamImageSelect,
    handleAddContent,
    handleDeleteContent,
    parseExam,
    toggleLeaderboard,
    handleAddAutoReply,
    toggleAutoReply,
    deleteAutoReply,
    handleAddQuote,
    deleteQuote,
    filteredPendingUsers,
    filteredActiveUsers,
    filteredContentList,
    filteredExamsList,
    pendingUsers,
    activeUsersList,
    contentList,
    messagesList,
    examsList,
    examResults,
    examAccessOverrides,
    gatedExamsList,
    announcements,
    quotesList,
    smartHomeworks,
    hwResults,
    subscriptionCodes,
    assignments,
    assignmentSubmissions,
    mistakes,
    videoViews,
    passwordResetRequests,
    setPendingUsers,
    setActiveUsersList,
    setContentList,
    setMessagesList,
    setExamsList,
    setExamResults,
    setAnnouncements,
    setQuotesList,
    setSmartHomeworks,
    setHwResults,
    setSubscriptionCodes,
    studentSearchTerm,
    setStudentSearchTerm,
    studentStatusFilter,
    setStudentStatusFilter,
    studentSubscriptionFilter,
    setStudentSubscriptionFilter,
    dailyFilteredActiveUsers,
    studentsPagination,
    dailyAdminStats,
    exportStudentsExcel,
    v2AdminStats,
  } = ctx;

  const [mistakeSearch, setMistakeSearch] = useState('');
  const [mistakeTopic, setMistakeTopic] = useState('');
  const [mistakePage, setMistakePage] = useState(1);
  const mistakePageSize = 20;
  const mistakeTopics = useMemo(() => Array.from(new Set((mistakes || []).map((m) => m.topic || m.question?.topic || m.question?.lesson || m.question?.branch).filter(Boolean))).sort(), [mistakes]);
  const filteredMistakes = useMemo(() => (mistakes || []).filter((m) => {
    const text = `${m.question?.text || m.questionText || ''} ${m.studentName || m.userName || m.userEmail || ''} ${m.topic || m.question?.topic || m.question?.lesson || ''}`.toLowerCase();
    const topic = m.topic || m.question?.topic || m.question?.lesson || m.question?.branch || 'عام';
    return (!mistakeSearch || text.includes(mistakeSearch.toLowerCase())) && (!mistakeTopic || topic === mistakeTopic);
  }), [mistakes, mistakeSearch, mistakeTopic]);
  const mistakePages = Math.max(1, Math.ceil(filteredMistakes.length / mistakePageSize));
  const pagedMistakes = filteredMistakes.slice((mistakePage - 1) * mistakePageSize, mistakePage * mistakePageSize);

  return (
    <>
{activeTab === 'mistakes_admin' && (
  <div className="space-y-5" dir="rtl">
    <section className="glass-panel rounded-3xl p-5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs font-black text-red-600">تحليل أخطاء الطلاب</p><h2 className="font-arabic text-2xl font-black">بنك الأخطاء الذكي</h2><p className="mt-1 text-sm font-bold text-slate-500">بدل قائمة عشوائية، راجع الأخطاء بالطالب والدرس واعرف أكثر نقاط الضعف تكرارًا.</p></div>
        <button onClick={handleDeleteAllMistakes} className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white"><Trash2 size={16}/> حذف البنك بالكامل</button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3"><div className="rounded-2xl bg-red-50 p-4"><p className="text-xs font-black text-red-600">إجمالي الأخطاء</p><p className="text-3xl font-black text-red-800">{(mistakes||[]).length}</p></div><div className="rounded-2xl bg-amber-50 p-4"><p className="text-xs font-black text-amber-600">موضوعات تحتاج مراجعة</p><p className="text-3xl font-black text-amber-800">{mistakeTopics.length}</p></div><div className="rounded-2xl bg-blue-50 p-4"><p className="text-xs font-black text-blue-600">نتائج الفلتر</p><p className="text-3xl font-black text-blue-800">{filteredMistakes.length}</p></div></div>
    </section>
    <section className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="mb-4 grid gap-3 md:grid-cols-3"><input className="rounded-xl border p-3 font-bold md:col-span-2" placeholder="ابحث باسم الطالب أو نص السؤال" value={mistakeSearch} onChange={(e)=>{setMistakeSearch(e.target.value);setMistakePage(1)}}/><select className="rounded-xl border p-3 font-bold" value={mistakeTopic} onChange={(e)=>{setMistakeTopic(e.target.value);setMistakePage(1)}}><option value="">كل الدروس والموضوعات</option>{mistakeTopics.map((t)=><option key={t}>{t}</option>)}</select></div>
      <div className="overflow-hidden rounded-2xl border"><div className="hidden grid-cols-[80px_1fr_180px_180px] gap-3 bg-slate-100 px-4 py-3 text-xs font-black text-slate-600 lg:grid"><span>#</span><span>السؤال</span><span>الطالب</span><span>الدرس</span></div><div className="divide-y">{pagedMistakes.map((m,i)=>{const q=m.question||{}; const topic=m.topic||q.topic||q.lesson||q.branch||'عام'; return <div key={m.id||`${i}_${q.text}`} className="grid gap-2 px-4 py-4 lg:grid-cols-[80px_1fr_180px_180px] lg:items-center"><span className="text-xs font-black text-red-600">{(mistakePage-1)*mistakePageSize+i+1}</span><div><p className="font-black leading-7">{q.text||m.questionText||'سؤال غير متاح'}</p>{Array.isArray(q.options)&&q.options.length>0&&<p className="mt-1 text-xs text-slate-500">الإجابة الصحيحة: <span className="font-black underline decoration-2 underline-offset-4">{q.options[Number(q.correctIdx??0)]||'—'}</span></p>}</div><span className="text-sm font-bold">{m.studentName||m.userName||m.userEmail||m.userId||'طالب'}</span><span className="rounded-full bg-violet-50 px-3 py-2 text-center text-xs font-black text-violet-700">{topic}</span></div>})}</div></div>
      {!pagedMistakes.length&&<div className="py-12 text-center font-bold text-slate-500">لا توجد أخطاء مطابقة.</div>}
      {filteredMistakes.length>0&&<div className="mt-4 flex items-center justify-center gap-3"><button disabled={mistakePage<=1} onClick={()=>setMistakePage((p)=>Math.max(1,p-1))} className="rounded-xl border px-4 py-2 font-black disabled:opacity-40">السابق</button><span className="font-black">صفحة {mistakePage} من {mistakePages}</span><button disabled={mistakePage>=mistakePages} onClick={()=>setMistakePage((p)=>Math.min(mistakePages,p+1))} className="rounded-xl border px-4 py-2 font-black disabled:opacity-40">التالي</button></div>}
    </section>
  </div>
)}
    </>
  );
}
