import React from 'react';
import { CheckCircle, Lock, X, AlertTriangle, Trash2, Eye, ShieldAlert, Phone, Edit, KeyRound, Send, MessageCircle, ClipboardList, Unlock, Layout, Bell, Download, Calendar, Clock, Upload, Users, RefreshCw, FileCheck, Crown, Key } from '@shared/icons/lucide-shim.jsx';
import { AdminReviewQuizPanel } from '@features/review/ReviewQuizSystem.jsx';


import { GradeOptions, getGradeLabel } from '@shared/constants/grades';
import { normalizeEgyptPhone } from '@shared/utils/phone';


import { AdminCoursesManager } from '@features/courses/CourseSystem';


import { platformNotify, getQuestionsForExam, generatePDF, VIDEO_EXAM_UNLOCK_PERCENT, InlineTabs } from '@shared/core/platformShared.jsx';
import { usePagination } from '@shared/hooks/usePagination.js';
import PaginationBar from '@shared/components/PaginationBar.jsx';
import ImageFitControls from '@shared/ui/ImageFitControls.jsx';
import { downloadXlsx } from '@shared/utils/exportData.js';


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
import { canAccessAdminTab } from '@config/adminPermissions';
import AdminCommandCenter from '@admin/components/AdminCommandCenter.jsx';
import AdminSystemHealthPanel from '@admin/components/AdminSystemHealthPanel.jsx';
import AdminV2PageFrame from '@admin/v2/AdminV2PageFrame.jsx';
import AdminStudentSuccessSuite from '@features/studentSuccess/StudentSuccessAdminSuite.jsx';
import { AdminGlobalSearch, AdminLiveClassesPanel, AdminCertificatesPanel, AdminCommandQuickActions } from '@features/product/ProductExperienceSuite.jsx';
import AdminAllUsersTab from '../users/AdminAllUsersTab.jsx';
import AdminDashboardOverviewTab from '../dashboard/AdminDashboardOverviewTab.jsx';

import AdminDashboardTab from '../split/AdminDashboardTab.jsx';
import AdminFollowUpTab from '../split/AdminFollowUpTab.jsx';
import AdminPendingUsersTab from '../split/AdminPendingUsersTab.jsx';
import AdminUsersTab from '../split/AdminUsersTab.jsx';
import AdminPasswordResetsTab from '../split/AdminPasswordResetsTab.jsx';
import AdminPaymentsTab from '../split/AdminPaymentsTab.jsx';
import AdminSubscriptionsLegacyTab from '../split/AdminSubscriptionsLegacyTab.jsx';
import AdminSmartHomeworkTab from '../split/AdminSmartHomeworkTab.jsx';
import AdminQuestionBankTab from '../split/AdminQuestionBankTab.jsx';
import AdminSmartExamEngineTab from '../split/AdminSmartExamEngineTab.jsx';
import AdminStudentReportsTab from '../split/AdminStudentReportsTab.jsx';
import AdminStudentGroupsTab from '../split/AdminStudentGroupsTab.jsx';
import AdminMessagesCenterTab from '../split/AdminMessagesCenterTab.jsx';
import AdminFinanceDashboardTab from '../split/AdminFinanceDashboardTab.jsx';
import AdminVideoSecurityTab from '../split/AdminVideoSecurityTab.jsx';
import AdminAssignmentsTab from '../split/AdminAssignmentsTab.jsx';
import AdminExamViewNavTab from '../split/AdminExamViewNavTab.jsx';
import AdminExamManageTab from '../split/AdminExamManageTab.jsx';
import AdminExamResultsTab from '../split/AdminExamResultsTab.jsx';
import AdminSecurityCenterTab from '../split/AdminSecurityCenterTab.jsx';
import AdminRolesTab from '../split/AdminRolesTab.jsx';
import AdminAuditLogsTab from '../split/AdminAuditLogsTab.jsx';
import AdminNotificationsAdminTab from '../split/AdminNotificationsAdminTab.jsx';
import AdminCoursesTab from '../split/AdminCoursesTab.jsx';
import AdminMistakesTab from '../split/AdminMistakesTab.jsx';
import AdminContentTab from '../split/AdminContentTab.jsx';
import AdminNotificationsTab from '../split/AdminNotificationsTab.jsx';
import AdminNotificationsGrowthTab from '../split/AdminNotificationsGrowthTab.jsx';


// Render-only split from AdminDashboard.jsx.
// Keeps the large tab UI isolated so the main dashboard file stays readable.
export default function AdminDashboardTabs({ ctx }) {
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
    setSubscriptionCodes
  } = ctx;


  const [studentSearchTerm, setStudentSearchTerm] = React.useState('');
  const [studentStatusFilter, setStudentStatusFilter] = React.useState('all');
  const [studentSubscriptionFilter, setStudentSubscriptionFilter] = React.useState('all');

  const getDateText = (value) => {
    const date = value?.toDate ? value.toDate() : (value ? new Date(value) : null);
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('ar-EG') : '';
  };

  const dailyFilteredActiveUsers = React.useMemo(() => {
    const q = studentSearchTerm.trim().toLowerCase();
    return (filteredActiveUsers || []).filter((student) => {
      const searchable = [student.name, student.email, student.phone, student.parentPhone, student.id].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !q || searchable.includes(q);
      const matchesStatus = studentStatusFilter === 'all' || student.status === studentStatusFilter || (studentStatusFilter === 'banned' && String(student.status || '').startsWith('banned'));
      const matchesSubscription = studentSubscriptionFilter === 'all' || (studentSubscriptionFilter === 'premium' ? student.subscriptionStatus === 'premium' : student.subscriptionStatus !== 'premium');
      return matchesSearch && matchesStatus && matchesSubscription;
    });
  }, [filteredActiveUsers, studentSearchTerm, studentStatusFilter, studentSubscriptionFilter]);

  const studentsPagination = usePagination(dailyFilteredActiveUsers, { pageSize: 25 });

  const dailyAdminStats = React.useMemo(() => {
    const users = filteredActiveUsers || [];
    const pendingGradeUpdates = users.filter((student) => student.gradeUpdateStatus === 'pending').length;
    const vipUsers = users.filter((student) => student.subscriptionStatus === 'premium').length;
    const bannedUsers = users.filter((student) => String(student.status || '').startsWith('banned')).length;
    const securityHeldAttempts = (examResults || []).filter((result) => ['security_hold', 'cheated', 'in_progress'].includes(result.status)).length;
    return { total: users.length, vipUsers, bannedUsers, pendingGradeUpdates, securityHeldAttempts };
  }, [filteredActiveUsers, examResults]);


  const v2AdminStats = React.useMemo(() => ({
    students: (activeUsersList || []).length,
    exams: (examsList || []).length,
    content: (contentList || []).length,
    alerts: (pendingUsers || []).length + (passwordResetRequests || []).length + (examResults || []).filter((result) => ['security_hold', 'cheated', 'in_progress'].includes(result.status)).length,
  }), [activeUsersList, examsList, contentList, pendingUsers, passwordResetRequests, examResults]);

  const exportStudentsExcel = async () => {
    const header = ['name','email','phone','parentPhone','grade','status','subscriptionStatus','subscriptionExpiry'];
    const rows = dailyFilteredActiveUsers.map((student) => [
      student.name || '',
      student.email || '',
      student.phone || '',
      student.parentPhone || '',
      getGradeLabel(student.grade),
      student.status || '',
      student.subscriptionStatus || 'free',
      getDateText(student.subscriptionExpiry)
    ]);
    await downloadXlsx(`students-${new Date().toISOString().slice(0, 10)}.xlsx`, [header, ...rows]);
    platformNotify('تم تجهيز ملف Excel للطلاب.');
  };

  if (!canAccessAdminTab(adminProfile || userData, activeTab)) {
    return (
      <div className="md:col-span-3 w-full overflow-hidden" dir="rtl">
        <div className="bg-white border rounded-3xl p-8 text-center shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 mb-2">هذه الصفحة خارج صلاحيات هذا الحساب</h2>
          <p className="text-slate-500 font-bold">سيظهر للمساعد فقط الأقسام التي حددها المالك من صفحة صلاحيات الأدمن.</p>
        </div>
      </div>
    );
  }


  const tabCtx = {
    ...ctx,
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
  };

  return (
        <div className="md:col-span-3 w-full overflow-hidden">
          <AdminV2PageFrame
            activeTab={activeTab}
            onNavigate={setActiveTab}
            stats={v2AdminStats}
            adminName={adminProfile?.name || userData?.name || userData?.email}
          >
          <AdminDashboardTab ctx={tabCtx} />

          <AdminFollowUpTab ctx={tabCtx} />

          <AdminPendingUsersTab ctx={tabCtx} />

          <AdminUsersTab ctx={tabCtx} />

          <AdminPasswordResetsTab ctx={tabCtx} />

          <AdminPaymentsTab ctx={tabCtx} />

          <AdminSubscriptionsLegacyTab ctx={tabCtx} />

          <AdminSmartHomeworkTab ctx={tabCtx} />

          <AdminQuestionBankTab ctx={tabCtx} />

          <AdminSmartExamEngineTab ctx={tabCtx} />

          <AdminStudentReportsTab ctx={tabCtx} />

          <AdminStudentGroupsTab ctx={tabCtx} />

          <AdminMessagesCenterTab ctx={tabCtx} />

          <AdminFinanceDashboardTab ctx={tabCtx} />

          <AdminVideoSecurityTab ctx={tabCtx} />

          <AdminAssignmentsTab ctx={tabCtx} />

          <AdminExamViewNavTab ctx={tabCtx} />

          <AdminExamManageTab ctx={tabCtx} />

          

          <AdminExamResultsTab ctx={tabCtx} />

          
          
          
          
          

          <AdminSecurityCenterTab ctx={tabCtx} />


          <AdminRolesTab ctx={tabCtx} />

          <AdminAuditLogsTab ctx={tabCtx} />

          <AdminNotificationsAdminTab ctx={tabCtx} />


<AdminCoursesTab ctx={tabCtx} />

<AdminMistakesTab ctx={tabCtx} />

<AdminContentTab ctx={tabCtx} />


          <AdminNotificationsTab ctx={tabCtx} />



          <AdminNotificationsGrowthTab ctx={tabCtx} />

          {/* تم حذف صفحة الرد الآلي وإدارة الحكم من لوحة الأدمن */}
          </AdminV2PageFrame>
        </div>
  );
}
