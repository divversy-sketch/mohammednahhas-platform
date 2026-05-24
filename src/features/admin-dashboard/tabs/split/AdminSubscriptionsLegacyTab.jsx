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
import { AdminAuditLogViewer, AdminNotificationsManager, AdminPlatformSettingsManager, AdminRolesManager, AdminGrowthSuite } from '@admin/parts/AdminOperationsSuite.jsx';
import { AdminSmartExamEngine, AdminStudentReports, AdminGroupsManager, AdminMessagingCenter, AdminFinanceDashboard, AdminVideoSecurityPanel } from '@features/smartLearning/SmartLearningEngine.jsx';
import AdminStudentSuccessSuite from '@features/studentSuccess/StudentSuccessAdminSuite.jsx';
import { AdminGlobalSearch, AdminLiveClassesPanel, AdminCertificatesPanel, AdminCommandQuickActions } from '@features/product/ProductExperienceSuite.jsx';
import AdminAllUsersTab from '@features/admin-dashboard/tabs/users/AdminAllUsersTab.jsx';
import AdminDashboardOverviewTab from '@features/admin-dashboard/tabs/dashboard/AdminDashboardOverviewTab.jsx';

export default function AdminSubscriptionsLegacyTab({ ctx }) {
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
{activeTab === 'subscriptions_legacy' && (
              <div className="space-y-6">
                  {(() => {
                    const unusedCodes = subscriptionCodes.filter(c => !c.used);
                    const usedCodesList = subscriptionCodes.filter(c => c.used);
                    const premiumStudents = filteredActiveUsers.filter(u => u.subscriptionStatus === 'premium');
                    const expiringSoon = premiumStudents.filter(u => {
                      const d = u.subscriptionExpiry?.toDate ? u.subscriptionExpiry.toDate() : null;
                      return d && d > new Date() && (d.getTime() - Date.now()) / (1000*60*60*24) <= 7;
                    });
                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4"><p className="text-sm font-bold text-amber-700">أكواد متاحة</p><p className="text-3xl font-black text-amber-900">{unusedCodes.length}</p></div>
                          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4"><p className="text-sm font-bold text-emerald-700">أكواد مستخدمة</p><p className="text-3xl font-black text-emerald-900">{usedCodesList.length}</p></div>
                          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4"><p className="text-sm font-bold text-blue-700">طلاب VIP</p><p className="text-3xl font-black text-blue-900">{premiumStudents.length}</p></div>
                          <div className="bg-red-50 border border-red-100 rounded-2xl p-4"><p className="text-sm font-bold text-red-700">ينتهي خلال 7 أيام</p><p className="text-3xl font-black text-red-900">{expiringSoon.length}</p></div>
                        </div>

                        <div className="glass-panel p-4 md:p-6 rounded-xl border-t-4 border-amber-500">
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                            <div>
                              <h2 className="text-xl font-bold flex items-center gap-2 text-amber-700"><Key/> نظام الاشتراكات وكروت الشحن</h2>
                              <p className="text-sm text-slate-500 mt-1">ولّد أكواد، انسخها، صدّرها Excel، وراقب الطلاب المشتركين.</p>
                            </div>
                            <div className="flex flex-col md:flex-row gap-2">
                              <button onClick={copyUnusedSubscriptionCodes} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2"><ClipboardList size={16}/> نسخ الأكواد الجديدة</button>
                              <button onClick={exportSubscriptionCodesCSV} className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2"><Download size={16}/> تصدير Excel</button>
                              <button onClick={extendPremiumForAll} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2"><Crown size={16}/> تمديد VIP</button>
                            </div>
                          </div>

                          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
                              <p className="text-sm text-amber-800 font-bold mb-4">هذه الأكواد يمكن طباعتها أو إرسالها للطلاب لتفعيل باقة VIP فورًا عند إدخال الكود من صفحة الاشتراك.</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-600 mb-1">عدد الأكواد المطلوبة</label>
                                      <input type="number" min="1" className="w-full border p-3 rounded-lg" value={codeGenCount} onChange={e=>setCodeGenCount(e.target.value)} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-600 mb-1">مدة الاشتراك بالأيام</label>
                                      <input type="number" min="1" className="w-full border p-3 rounded-lg" value={codeGenDays} onChange={e=>setCodeGenDays(e.target.value)} />
                                  </div>
                                  <div className="flex items-end">
                                      <button onClick={generateSubscriptionCodes} className="w-full bg-amber-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-amber-700 transition">توليد الأكواد</button>
                                  </div>
                              </div>
                          </div>

                          {expiringSoon.length > 0 && (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
                              <h3 className="font-black text-red-700 mb-3 flex items-center gap-2"><AlertTriangle size={18}/> اشتراكات قربت تنتهي</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {expiringSoon.map(s => <div key={s.id} className="bg-white rounded-xl p-3 border"><p className="font-bold">{s.name || s.email}</p><p className="text-xs text-red-600">ينتهي: {s.subscriptionExpiry?.toDate?.().toLocaleDateString('ar-EG')}</p></div>)}
                              </div>
                            </div>
                          )}

                          <div className="overflow-x-auto">
                              <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm text-sm whitespace-nowrap">
                                  <thead className="bg-slate-800 text-white">
                                      <tr>
                                          <th className="p-3 text-right">الكود</th>
                                          <th className="p-3 text-center">المدة</th>
                                          <th className="p-3 text-center">الحالة</th>
                                          <th className="p-3 text-right">استخدم بواسطة</th>
                                          <th className="p-3 text-center">تاريخ الاستخدام</th>
                                          <th className="p-3 text-center">إجراء</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {subscriptionCodes.map((code) => (
                                          <tr key={code.id} className={`border-b ${code.used ? 'bg-red-50 opacity-70' : 'hover:bg-slate-50'}`}>
                                              <td className="p-3 font-mono font-black text-blue-700 select-all">{code.code}</td>
                                              <td className="p-3 text-center font-bold">{code.days} يوم</td>
                                              <td className="p-3 text-center">
                                                  {code.used ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">مُستخدم</span> : <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">جديد</span>}
                                              </td>
                                              <td className="p-3 text-slate-600">{code.usedBy || '-'}</td>
                                              <td className="p-3 text-center text-slate-500">{code.usedAt?.toDate ? code.usedAt.toDate().toLocaleString('ar-EG') : '-'}</td>
                                              <td className="p-3 text-center">
                                                  <button onClick={() => navigator.clipboard.writeText(code.code)} className="text-blue-600 hover:bg-blue-100 p-2 rounded ml-1"><ClipboardList size={16}/></button>
                                                  <button onClick={() => handleDeleteCode(code.id)} className="text-red-500 hover:bg-red-100 p-2 rounded"><Trash2 size={16}/></button>
                                              </td>
                                          </tr>
                                      ))}
                                      {subscriptionCodes.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-500">لم يتم توليد أي أكواد بعد.</td></tr>}
                                  </tbody>
                              </table>
                          </div>
                        </div>
                      </>
                    );
                  })()}
              </div>
          )}
    </>
  );
}
