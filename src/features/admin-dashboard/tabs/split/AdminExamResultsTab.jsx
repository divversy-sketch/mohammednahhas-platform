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
             <div className="glass-panel p-4 md:p-6 rounded-xl">
               <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                 <h2 className="font-bold flex items-center gap-2 font-arabic text-xl"><Layout/> نتائج الامتحانات</h2>
                 {!viewingResult && examResults.length > 0 && (
                     <button onClick={handleDeleteAllResults} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition shadow-lg w-full md:w-auto justify-center"><Trash2 size={16}/> حذف جميع النتائج</button>
                 )}
               </div>
               {viewingResult ? (
                   <div className="bg-slate-50 p-4 rounded-xl border">
                       <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                           <button onClick={() => setViewingResult(null)} className="text-sm text-slate-500 underline font-bold text-right">العودة للقائمة</button>
                           {(() => {
                               const examData = examsList.find(e => e.id === viewingResult.examId);
                               const questions = getQuestionsForExam(examData);
                               return (
                                   <div className="flex gap-2">
                                       <button onClick={() => sendWhatsAppToParent(viewingResult)} className="flex-1 md:flex-none justify-center bg-green-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-bold hover:bg-green-600 shadow-sm"><MessageCircle size={16}/> واتساب لولي الأمر</button>
                                       <button onClick={() => generatePDF('admin', {...viewingResult, total: viewingResult.total || 0, examTitle: examData?.title, questions: questions, answers: viewingResult.answers })} className="flex-1 md:flex-none justify-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm"><Download size={16}/> التقرير</button>
                                   </div>
                               );
                           })()}
                       </div>
                       <h3 className="font-bold text-lg mb-2">إجابات الطالب: {viewingResult.studentName}</h3>
                       {(!['continue', 'restart'].includes(viewingResult.adminDecision)) && (
                         <div className="mb-4 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl">
                           <p className="font-black mb-2 flex items-center gap-2"><ShieldAlert size={18}/> هذه المحاولة تحتاج قرار الأدمن</p>
                           <p className="text-sm font-bold mb-3">يمكنك السماح للطالب بالاستكمال من نفس الإجابات والوقت المتبقي، أو السماح بإعادة الامتحان من البداية.</p>
                           <div className="flex flex-col md:flex-row gap-2">
                             <button onClick={() => handleApproveSecurityContinue(viewingResult)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">السماح بالاستكمال</button>
                             <button onClick={() => handleApproveSecurityRestart(viewingResult)} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700">السماح بالإعادة من البداية</button>
                           </div>
                         </div>
                       )}
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
                   <div className="overflow-x-auto">
                       <div className="min-w-[600px] space-y-2">
                           {examResults.map(res => (
                               <div key={res.id} className="flex justify-between items-center border p-3 rounded hover:bg-slate-50 transition bg-white/50">
                                   <div>
                                       <p className="font-bold flex items-center gap-2">
                                           {res.studentName}
                                           {res.hasEssay && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold">مقالي</span>}
                                       </p>
                                       <p className="text-xs text-slate-500">
                                           {res.status==='security_hold'
                                             ? 'موقوف أمنيًا في انتظار قرار الأدمن 🛡️'
                                             : res.status==='cheated'
                                               ? 'غش 🚫'
                                               : res.status==='in_progress'
                                                 ? 'قيد التنفيذ (لم يسلم) ⏳'
                                                 : `درجة: ${res.score}/${res.total}`}
                                       </p>
                                   </div>
                                   <div className="flex gap-2 flex-wrap justify-end">
                                      {(!['continue', 'restart'].includes(res.adminDecision)) && (
                                        <>
                                          <button onClick={()=>handleApproveSecurityContinue(res)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700">السماح بالاستكمال</button>
                                          <button onClick={()=>handleApproveSecurityRestart(res)} className="bg-amber-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-amber-700">السماح بالإعادة</button>
                                        </>
                                      )}
                                      {res.status === 'completed' && <button onClick={()=>sendWhatsAppToParent(res)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-green-200"><MessageCircle size={14}/><span className="hidden md:inline"> إرسال لولي الأمر</span></button>}
                                      <button onClick={()=>setViewingResult(res)} className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs font-bold">التفاصيل</button>
                                      <button onClick={()=>openAdminResultReview(res)} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-1"><Eye size={14}/> مراجعة الامتحان</button>
                                      <button onClick={()=>handleDeleteResult(res.id)} className="bg-amber-100 text-amber-600 px-3 py-1 rounded text-xs font-bold">إعادة</button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )}
             </div>
          )}
    </>
  );
}
