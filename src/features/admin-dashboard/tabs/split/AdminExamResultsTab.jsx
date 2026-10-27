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
import AdminResultsV2, { ResultDetailHeader } from '@admin/v2/AdminResultsV2.jsx';

export default function AdminExamResultsTab({ ctx }) {
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
{activeTab === 'exams' && adminExamView === 'results' && (
             <div className={viewingResult ? "glass-panel p-4 md:p-6 rounded-xl" : ""}>
               {viewingResult ? (
                   <div className="bg-slate-50 p-4 rounded-xl border">
                       {(() => {
                           const examData = examsList.find(e => e.id === viewingResult.examId);
                           return (
                               <ResultDetailHeader
                                   result={viewingResult}
                                   exam={examData}
                                   onBack={() => setViewingResult(null)}
                                   onWhatsApp={viewingResult.status === 'completed' ? () => sendWhatsAppToParent(viewingResult) : null}
                                   onPdf={examData ? () => generatePDF('admin', { ...viewingResult, total: viewingResult.total || 0, examTitle: examData?.title, questions: getQuestionsForExam(examData), answers: viewingResult.answers }) : null}
                                   onApproveContinue={() => handleApproveSecurityContinue({ ...viewingResult, totalTime: viewingResult.totalTime || examData?.duration })}
                                   onApproveRestart={() => handleApproveSecurityRestart({ ...viewingResult, totalTime: viewingResult.totalTime || examData?.duration })}
                               />
                           );
                       })()}
                       {viewingResult.hasEssay && (
                           <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl font-bold text-sm">
                               هذا الامتحان يحتوي على أسئلة مقالية، ويمكنك تصحيح كل سؤال يدويًا وتحديد الدرجة النهائية له من نفس الصفحة.
                           </div>
                       )}
                       <div className="space-y-4 mt-4">
                           {(() => {
                               const examData = examsList.find(e => e.id === viewingResult.examId);
                               if(!examData) return <p>بيانات الامتحان محذوفة</p>;
                               const questions = getQuestionsForExam(examData);
                               const groupedQuestions = questions.reduce((acc, q) => { const b = q.branch || 'عام'; if(!acc[b]) acc[b] = []; acc[b].push(q); return acc; }, {});
                               return Object.entries(groupedQuestions).map(([branch, qs]) => (
                                   <div key={branch} className="mb-6">
                                       <h4 className="font-bold text-xl text-amber-700 bg-amber-100 p-2 rounded-lg mb-4">{branch}</h4>
                                       <div className="space-y-4">
                                           {qs.map((q, idx) => (
                                               <div key={idx} className="bg-white p-4 rounded border relative">
                                                   <p className="font-bold mb-2 text-lg md:text-xl text-blue-900 font-sans pr-10">
                                                       {q.text.split('|').map((part, i) => (<React.Fragment key={i}>{part.trim()}{i !== q.text.split('|').length - 1 && <br />}</React.Fragment>))}
                                                   </p>
                                                   {q.type === 'essay' ? (
                                                       <div className="space-y-4">
                                                           <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                                               <p className="font-bold text-slate-800 mb-2">إجابة الطالب النصية</p>
                                                               <p className="whitespace-pre-wrap text-slate-700">
                                                                   {typeof viewingResult.answers?.[q.id] === 'object'
                                                                       ? (viewingResult.answers?.[q.id]?.text || 'لم يكتب الطالب إجابة نصية')
                                                                       : (viewingResult.answers?.[q.id] || 'لم يكتب الطالب إجابة نصية')}
                                                               </p>
                                                           </div>
                                                           {typeof viewingResult.answers?.[q.id] === 'object' && viewingResult.answers?.[q.id]?.image && (
                                                               <div className="bg-white border border-slate-200 rounded-xl p-4">
                                                                   <p className="font-bold text-slate-800 mb-3">الصورة المرفوعة</p>
                                                                   <img src={viewingResult.answers[q.id].image} alt="إجابة مقالية" className="max-h-96 rounded-xl border border-slate-200 mx-auto" />
                                                               </div>
                                                           )}
                                                           <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                                               <p className="font-bold text-amber-800 mb-3">تصحيح السؤال المقالي</p>
                                                               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                   <input
                                                                       type="number"
                                                                       min="0"
                                                                       step="0.5"
                                                                       className="border p-3 rounded-lg"
                                                                       placeholder="درجة الطالب"
                                                                       value={essayScoreDrafts[getEssayDraftKey(viewingResult.id, q.id)] ?? (viewingResult.essayScores?.[q.id] ?? '')}
                                                                       onChange={(e) => setEssayScoreDrafts((prev) => ({ ...prev, [getEssayDraftKey(viewingResult.id, q.id)]: e.target.value }))}
                                                                   />
                                                                   <input
                                                                       type="number"
                                                                       min="0.5"
                                                                       step="0.5"
                                                                       className="border p-3 rounded-lg"
                                                                       placeholder="من كام"
                                                                       value={essayMaxDrafts[getEssayDraftKey(viewingResult.id, q.id)] ?? (viewingResult.essayMaxScores?.[q.id] ?? '')}
                                                                       onChange={(e) => setEssayMaxDrafts((prev) => ({ ...prev, [getEssayDraftKey(viewingResult.id, q.id)]: e.target.value }))}
                                                                   />
                                                                   <button
                                                                       onClick={() => handleSaveEssayGrade(viewingResult, q, questions)}
                                                                       className="bg-amber-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-amber-700 transition"
                                                                   >
                                                                       حفظ التصحيح
                                                                   </button>
                                                               </div>
                                                               {(viewingResult.essayScores?.[q.id] !== undefined && viewingResult.essayMaxScores?.[q.id] !== undefined) && (
                                                                   <p className="text-sm text-amber-900 mt-3 font-bold">
                                                                       الدرجة المحفوظة: {viewingResult.essayScores[q.id]} / {viewingResult.essayMaxScores[q.id]}
                                                                   </p>
                                                               )}
                                                           </div>
                                                       </div>
                                                   ) : (
                                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                           {q.options.map((opt, oIdx) => {
                                                               const isCorrect = oIdx === q.correctIdx;
                                                               const isSelected = viewingResult.answers[q.id] === oIdx;
                                                               let style = "bg-gray-50 text-gray-500";
                                                               if (isCorrect) style = "bg-green-100 text-green-800 border-green-500 border font-bold md:text-lg";
                                                               if (isSelected && !isCorrect) style = "bg-red-100 text-red-800 border-red-500 border font-bold md:text-lg";
                                                               return <div key={oIdx} className={`p-3 rounded font-sans font-bold ${style}`}>{opt}</div>
                                                           })}
                                                       </div>
                                                   )}
                                               </div>
                                           ))}
                                       </div>
                                   </div>
                               ));
                           })()}
                       </div>
                   </div>
               ) : (
                   <AdminResultsV2 ctx={ctx} />
               )}
             </div>
          )}
    </>
  );
}
