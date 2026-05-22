import React from 'react';
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
import { AdminAuditLogViewer, AdminNotificationsManager, AdminPlatformSettingsManager, AdminRolesManager, AdminGrowthSuite } from '@features/admin-dashboard/operations/index.js';
import { AdminSmartExamEngine, AdminStudentReports, AdminGroupsManager, AdminMessagingCenter, AdminFinanceDashboard, AdminVideoSecurityPanel } from '@features/smartLearning/SmartLearningEngine.jsx';
import AdminStudentSuccessSuite from '@features/studentSuccess/StudentSuccessAdminSuite.jsx';
import { AdminGlobalSearch, AdminLiveClassesPanel, AdminCertificatesPanel, AdminCommandQuickActions } from '@features/product/ProductExperienceSuite.jsx';
import AdminAllUsersTab from '@features/admin-dashboard/tabs/users/AdminAllUsersTab.jsx';
import AdminDashboardOverviewTab from '@features/admin-dashboard/tabs/dashboard/AdminDashboardOverviewTab.jsx';

export default function AdminNotificationsTab({ ctx }) {
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

  return (
    <>
{activeTab === 'notifications' && (
            <div className="glass-panel p-4 md:p-6 rounded-2xl space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Bell className="text-amber-600"/> إرسال إشعار للطلاب</h2>
                <p className="text-sm text-slate-500 mt-1">الإشعار سيظهر داخل منصة الطالب فقط بدون طلب صلاحيات من المتصفح.</p>
              </div>
              <form onSubmit={handleSendStudentNotification} className="grid gap-4 bg-white border rounded-2xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="border p-3 rounded-xl" placeholder="عنوان الإشعار مثل: امتحان جديد" value={newStudentNotification.title} onChange={e=>setNewStudentNotification({...newStudentNotification, title:e.target.value})} />
                  <select className="border p-3 rounded-xl" value={newStudentNotification.grade} onChange={e=>setNewStudentNotification({...newStudentNotification, grade:e.target.value})}>
                    <option value="all">كل الطلاب</option>
                    <GradeOptions />
                  </select>
                </div>
                <textarea className="border p-3 rounded-xl min-h-[120px]" placeholder="اكتب نص الإشعار... مثال: تم فتح امتحان فيديو جديد" value={newStudentNotification.text} onChange={e=>setNewStudentNotification({...newStudentNotification, text:e.target.value})} />
                <input className="border p-3 rounded-xl" placeholder="رابط الفتح داخل المنصة / اتركه /" value={newStudentNotification.clickUrl} onChange={e=>setNewStudentNotification({...newStudentNotification, clickUrl:e.target.value})} />
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl text-sm font-bold">
                  ملاحظة: الإشعار يظهر داخل المنصة فورًا. تم إيقاف Push Notifications مؤقتًا للحفاظ على السلاسة ومنع رسائل VAPID.
                </div>
                <button className="bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 flex items-center justify-center gap-2"><Send size={18}/> إرسال الإشعار</button>
              </form>
              <div className="bg-slate-50 border rounded-2xl p-4">
                <h3 className="font-bold text-slate-700 mb-3">آخر الإشعارات</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {announcements.length === 0 ? <p className="text-slate-400 text-sm">لا توجد تنبيهات عامة بعد.</p> : announcements.slice(0, 10).map(item => <div key={item.id} className="bg-white border rounded-xl p-3 text-sm text-slate-700">{item.text}</div>)}
                </div>
              </div>
            </div>
          )}
    </>
  );
}
