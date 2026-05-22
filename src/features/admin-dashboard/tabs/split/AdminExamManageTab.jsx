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

export default function AdminExamManageTab({ ctx }) {
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
{activeTab === 'exams' && adminExamView === 'manage' && (
              <div className="space-y-8">
                  <div className="glass-panel p-4 md:p-6 rounded-xl">
                      <h2 className="text-xl font-bold mb-6 border-b pb-2 font-arabic text-amber-700">إنشاء امتحان</h2>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <input className="border p-2 rounded md:col-span-2" placeholder="العنوان" value={examBuilder.title} onChange={e=>setExamBuilder({...examBuilder, title:e.target.value})}/>
                          <input className="border p-2 rounded" placeholder="الكود" value={examBuilder.accessCode} onChange={e=>setExamBuilder({...examBuilder, accessCode:e.target.value})}/>
                          <input type="number" className="border p-2 rounded" placeholder="المدة (دقائق)" value={examBuilder.duration} onChange={e=>setExamBuilder({...examBuilder, duration:parseInt(e.target.value)})}/>
                          
                          <select className="border p-2 rounded md:col-span-2" value={examBuilder.grade} onChange={e=>setExamBuilder({...examBuilder, grade:e.target.value})}>
                              <GradeOptions/>
                          </select>
                          <div className="md:col-span-2 flex items-center bg-amber-50 border border-amber-200 rounded p-2">
                              <input type="checkbox" id="examVip" className="w-5 h-5 ml-2" checked={examBuilder.isPremium} onChange={e=>setExamBuilder({...examBuilder, isPremium: e.target.checked})} />
                              <label htmlFor="examVip" className="font-bold text-amber-800 text-sm flex items-center gap-1 cursor-pointer"><Crown size={16}/> امتحان VIP (مغلق لغير المشتركين)</label>
                          </div>

                          <div className="md:col-span-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                              <label className="block text-sm font-black text-emerald-900">صورة الامتحان / الغلاف</label>
                              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                                  <input className="border p-3 rounded-xl bg-white" placeholder="رابط الصورة أو ارفع صورة" value={examBuilder.examImageUrl || ''} onChange={e=>setExamBuilder({...examBuilder, examImageUrl:e.target.value})}/>
                                  <label className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-black cursor-pointer text-center">
                                      رفع صورة
                                      <input type="file" accept="image/*" className="hidden" onChange={handleExamImageSelect} />
                                  </label>
                              </div>
                              <ImageFitControls imageUrl={examBuilder.examImageUrl} value={examBuilder.imagePlacement} onChange={(v)=>setExamBuilder({...examBuilder, imagePlacement:v})} title="تظبيط صورة الامتحان داخل الكارت" />
                          </div>

                          <div className="md:col-span-4 bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                              <label className="flex items-center gap-2 font-black text-blue-900 text-sm">
                                  <input
                                    type="checkbox"
                                    className="w-5 h-5"
                                    checked={!!examBuilder.accessRule?.enabled}
                                    onChange={e=>setExamBuilder({...examBuilder, accessRule: {...(examBuilder.accessRule || {}), enabled: e.target.checked, visibilityWhenLocked: 'locked', allowAdminOverride: true}})}
                                  />
                                  شروط فتح الامتحان: يظهر مقفولًا حتى يجتاز الطالب امتحانًا سابقًا بالنسبة المطلوبة
                              </label>
                              {examBuilder.accessRule?.enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <select
                                    className="border p-2 rounded-xl bg-white"
                                    value={examBuilder.accessRule?.requiredExamId || ''}
                                    onChange={e=>setExamBuilder({...examBuilder, accessRule: {...(examBuilder.accessRule || {}), requiredExamId: e.target.value}})}
                                  >
                                    <option value="">اختر الامتحان السابق</option>
                                    {examsList.map(prevExam => <option key={prevExam.id} value={prevExam.id}>{prevExam.title}</option>)}
                                  </select>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="border p-2 rounded-xl"
                                    placeholder="النسبة المطلوبة %"
                                    value={examBuilder.accessRule?.requiredPercentage ?? 70}
                                    onChange={e=>setExamBuilder({...examBuilder, accessRule: {...(examBuilder.accessRule || {}), requiredPercentage: Number(e.target.value)}})}
                                  />
                                  <label className="bg-white border rounded-xl p-2 text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={examBuilder.accessRule?.useBestAttempt !== false}
                                      onChange={e=>setExamBuilder({...examBuilder, accessRule: {...(examBuilder.accessRule || {}), useBestAttempt: e.target.checked}})}
                                    />
                                    اعتماد أفضل محاولة للطالب
                                  </label>
                                </div>
                              )}
                          </div>

                          <div className="md:col-span-2">
                              <label className="block text-xs font-bold mb-1">وقت البدء</label>
                              <input type="datetime-local" className="border p-2 rounded w-full" onChange={e=>setExamBuilder({...examBuilder, startTime:e.target.value})}/>
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-xs font-bold mb-1">وقت الانتهاء</label>
                              <input type="datetime-local" className="border p-2 rounded w-full" onChange={e=>setExamBuilder({...examBuilder, endTime:e.target.value})}/>
                          </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border mb-6">
                          <textarea className="w-full border p-4 rounded-lg h-96 font-mono text-sm" placeholder="اكتب الأسئلة هنا...&#10;(هام 1: افصل بين كل سؤال والذي يليه بسطر فارغ تماماً، وضع علامة * قبل الإجابة الصحيحة)&#10;(هام 2: لتحديد فرع، اكتب #فرع: اسم_الفرع في سطر لوحده)&#10;(هام 3: للسؤال المقالي اكتب #مقالي: نص السؤال)" value={bulkText} onChange={e=>setBulkText(e.target.value)}/>
                          <button onClick={parseExam} className="mt-4 w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-green-500/50 transition">نشر</button>
                      </div>
                  </div>
                  <div className="glass-panel p-4 md:p-6 rounded-xl">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4">
                        <h3 className="font-bold font-arabic">الامتحانات الحالية</h3>
                        {examsList.length > 0 && <button onClick={handleDeleteAllExams} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 justify-center"><Trash2 size={16}/> حذف كل الامتحانات</button>}
                      </div>
                      <div className="overflow-x-auto">
                          <div className="min-w-[600px]">
                              {filteredExamsList.map(exam=>(
                                  <div key={exam.id} className="flex justify-between items-center border-b py-3 last:border-0 hover:bg-slate-50/50 px-2 rounded transition">
                                      <div>
                                          <p className="font-bold flex items-center gap-2">
                                              {exam.title}
                                              {exam.isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Crown size={10}/> VIP</span>}
                                          </p>
                                          <p className="text-xs text-slate-500">من: {new Date(exam.startTime).toLocaleString('ar-EG')} | إلى: {new Date(exam.endTime).toLocaleString('ar-EG')}</p>
                                          <p className="text-xs text-slate-400">كود: {exam.accessCode}</p>
                                          {exam.accessRule?.enabled && (
                                            <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1 mt-1 inline-flex items-center gap-1 font-bold">
                                              <Lock size={12}/> مقفول حتى اجتياز: {examsList.find(x => x.id === exam.accessRule?.requiredExamId)?.title || 'امتحان سابق'} بنسبة {exam.accessRule?.requiredPercentage || 70}%
                                            </p>
                                          )}
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => openFullExamEditor(exam)} className="text-emerald-600 p-2 bg-emerald-100 rounded-lg hover:bg-emerald-200" title="تعديل كامل / نسخة جديدة"><Edit size={18}/></button>
                                          <button onClick={() => { setEditingExamTime(exam); setNewEndTime(exam.endTime); }} className="text-blue-600 p-2 bg-blue-100 rounded-lg hover:bg-blue-200" title="تمديد الوقت"><Calendar size={18}/></button>
                                          <button onClick={()=>handleDeleteExam(exam.id)} className="text-red-600 p-2 bg-red-100 rounded-lg hover:bg-red-200" title="حذف"><Trash2 size={18}/></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="glass-panel p-4 md:p-6 rounded-xl border border-blue-100">
                    <h3 className="font-black text-blue-900 mb-2 flex items-center gap-2"><Unlock size={18}/> فتح امتحان استثنائي لطالب</h3>
                    <p className="text-sm text-slate-500 mb-4">استخدمها لو الطالب لم يحقق النسبة المطلوبة، لكن تريد السماح له بدخول الامتحان يدويًا.</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <select className="border p-3 rounded-xl bg-white" value={examOverrideDraft.examId} onChange={e=>setExamOverrideDraft({...examOverrideDraft, examId: e.target.value})}>
                        <option value="">اختر الامتحان المقفول</option>
                        {(gatedExamsList || []).map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
                      </select>
                      <select className="border p-3 rounded-xl bg-white" value={examOverrideDraft.studentId} onChange={e=>setExamOverrideDraft({...examOverrideDraft, studentId: e.target.value})}>
                        <option value="">اختر الطالب</option>
                        {activeUsersList.map(student => <option key={student.id} value={student.id}>{student.name || student.displayName || student.email}</option>)}
                      </select>
                      <input className="border p-3 rounded-xl" placeholder="سبب الاستثناء اختياري" value={examOverrideDraft.reason} onChange={e=>setExamOverrideDraft({...examOverrideDraft, reason: e.target.value})}/>
                      <button onClick={openExamAccessOverride} className="bg-blue-700 text-white rounded-xl font-black px-4 py-3 hover:bg-blue-800 flex items-center justify-center gap-2"><Unlock size={16}/> فتح استثنائي</button>
                    </div>
                    <div className="mt-5 space-y-2">
                      {(examAccessOverrides || []).filter(o => o.allowed).slice(0, 10).map(override => (
                        <div key={override.id} className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
                          <div className="text-sm">
                            <p className="font-black text-blue-900">{override.studentName || override.studentEmail || override.studentId}</p>
                            <p className="text-blue-700">{override.examTitle || examsList.find(e => e.id === override.examId)?.title || 'امتحان'} — {override.reason || 'فتح استثنائي'}</p>
                          </div>
                          <button onClick={() => revokeExamAccessOverride(override)} className="bg-white text-red-600 border border-red-200 px-3 py-2 rounded-xl font-bold hover:bg-red-50">إلغاء الاستثناء</button>
                        </div>
                      ))}
                      {(!examAccessOverrides || examAccessOverrides.filter(o => o.allowed).length === 0) && <p className="text-sm text-slate-400 font-bold">لا توجد استثناءات مفتوحة حاليًا.</p>}
                    </div>
                  </div>
              </div>
          )}
    </>
  );
}
