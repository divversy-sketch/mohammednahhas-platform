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

export default function AdminContentTab({ ctx }) {
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
{activeTab === 'content' && (
              <div className="glass-panel p-4 md:p-6 rounded-xl">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4">
                    <h2 className="font-bold font-arabic text-xl">إضافة محتوى</h2>
                    {contentList.length > 0 && <button type="button" onClick={handleDeleteAllContent} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 justify-center"><Trash2 size={16}/> حذف كل المحتوى</button>}
                  </div>
                  <form onSubmit={handleAddContent} className="grid gap-4 mb-6">
                      <input className="border p-3 rounded w-full" placeholder="العنوان" value={newContent.title} onChange={e=>setNewContent({...newContent, title:e.target.value})}/>
                      <input className="border p-3 rounded w-full" placeholder="الرابط (يفضل Google Drive للملفات الكبيرة)" value={newContent.url} onChange={e=>setNewContent({...newContent, url:e.target.value})}/>
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <div>
                            <label className="block text-sm font-black text-amber-900 mb-1">صورة المحتوى / الغلاف الظاهر للطالب</label>
                            <input className="border p-3 rounded-xl w-full bg-white" placeholder="رابط الصورة أو ارفع صورة من الزر" value={newContent.thumbnailUrl || ''} onChange={e=>setNewContent({...newContent, thumbnailUrl:e.target.value})}/>
                            <p className="text-xs text-amber-800 font-bold mt-1">تعمل مع الفيديو، PDF، المحتوى التفاعلي، الامتحان التفاعلي، والروابط.</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="bg-amber-600 text-white px-5 py-3 rounded-xl font-black cursor-pointer text-center">
                              رفع صورة
                              <input type="file" accept="image/*" className="hidden" onChange={handleVideoThumbnailSelect} />
                            </label>
                          </div>
                          <div className="md:col-span-2">
                            <ImageFitControls imageUrl={newContent.thumbnailUrl} value={newContent.imagePlacement} onChange={(v)=>setNewContent({...newContent, imagePlacement:v})} title="تظبيط صورة المحتوى داخل الإطار" />
                          </div>
                        </div>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition relative">
                          <input type="file" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                              <Upload size={32} />
                              <span className="text-sm font-bold">اضغط هنا لرفع ملف عام على Firebase</span><span className="text-xs text-emerald-600">يدعم HTML وPDF وأي ملف عام حتى 100MB — والكورسات تظل على Cloudinary</span>
                          </div>
                          {isUploading && (
                              <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center rounded-xl z-10">
                                  <span className="text-sm font-bold text-amber-600 mb-1">جاري تجهيز/رفع الملف... {uploadProgress}%</span>
                                  <div className="w-3/4 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div></div>
                              </div>
                          )}
                          {!isUploading && uploadProgress === 100 && (<div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl z-10"><span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={20}/> تم اختيار الملف</span></div>)}
                      </div>
                      
                      <div className="flex flex-col md:flex-row gap-2">
                          <select className="border p-3 rounded flex-1" value={newContent.type} onChange={e=>setNewContent({...newContent, type:e.target.value})}>
                              <option value="video">فيديو مدمج</option><option value="file">ملف (PDF)</option><option value="html">ملف تفاعلي (HTML)</option><option value="interactive_exam">امتحان تفاعلي (رابط/HTML)</option><option value="link">رابط خارجي (Google Meet, Drive, etc)</option>
                          </select>
                          {newContent.type === 'video' && (
                              <select className="border p-3 rounded flex-1" value={newContent.videoSection} onChange={e=>setNewContent({...newContent, videoSection:e.target.value})}>
                                  <option value="explanation">شرح الدرس</option>
                                  <option value="exercises">حل التدريبات</option>
                                  <option value="reviews">مراجعة نهائية</option>
                              </select>
                          )}
                          <select className="border p-3 rounded flex-1" value={newContent.grade} onChange={e=>setNewContent({...newContent, grade:e.target.value})}><GradeOptions/></select>
                      </div>

                      {newContent.type === 'video' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                              <div>
                                  <label className="block text-sm font-bold text-blue-800 mb-1">ربط الفيديو بامتحان</label>
                                  <select
                                      className="border p-3 rounded w-full bg-white"
                                      value={newContent.linkedExamId || ''}
                                      onChange={(e) => setNewContent({ ...newContent, linkedExamId: e.target.value })}
                                  >
                                      <option value="">بدون امتحان مرتبط</option>
                                      {examsList
                                          .filter(exam => !newContent.grade || exam.grade === newContent.grade)
                                          .map(exam => (
                                              <option key={exam.id} value={exam.id}>{exam.title}</option>
                                          ))}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-blue-800 mb-1">مدة الفيديو بالدقائق</label>
                                  <input
                                      type="number"
                                      min="1"
                                      className="border p-3 rounded w-full bg-white"
                                      placeholder="مثال: 30"
                                      value={newContent.estimatedDurationMinutes || ''}
                                      onChange={(e) => setNewContent({ ...newContent, estimatedDurationMinutes: e.target.value })}
                                  />
                              </div>
                              <div className="md:col-span-2 bg-white/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 font-bold leading-relaxed">
                                  عند ربط الفيديو بامتحان لن يظهر زر دخول الامتحان للطالب إلا بعد مشاهدة {VIDEO_EXAM_UNLOCK_PERCENT}% من الفيديو.
                                  مع فيديوهات YouTube يجب إدخال مدة الفيديو يدويًا حتى يتم حساب النسبة بشكل صحيح.
                              </div>
                          </div>
                      )}

                      <div className="flex items-center bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <input type="checkbox" id="vipContent" className="w-5 h-5 ml-3" checked={newContent.isPremium} onChange={e=>setNewContent({...newContent, isPremium:e.target.checked})} />
                          <label htmlFor="vipContent" className="font-bold text-amber-800 text-sm flex items-center gap-1 cursor-pointer"><Crown size={18}/> محتوى VIP (مغلق ومخصص للمشتركين فقط)</label>
                      </div>
                      
                      <div className="border p-3 rounded-lg bg-gray-50">
                          <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><Lock size={14}/> تخصيص لطلاب محددين (اختياري)</label>
                          <input className="border p-2 rounded w-full text-sm" placeholder="اكتب إيميلات الطلاب مفصولة بفاصلة" value={newContent.allowedEmails} onChange={e=>setNewContent({...newContent, allowedEmails:e.target.value})} />
                          <p className="text-xs text-gray-500 mt-1">اتركه فارغاً لكي يظهر المحتوى للجميع.</p>
                      </div>
                      
                      <div className="flex items-center gap-2"><input type="checkbox" checked={newContent.isPublic} onChange={e=>setNewContent({...newContent, isPublic:e.target.checked})}/> <label>عام (يظهر للزوار في الصفحة الرئيسية)</label></div>
                      <button className="bg-amber-600 text-white p-3 rounded font-bold shadow-lg shadow-amber-500/30 w-full md:w-auto">نشر</button>
                  </form>
                  <div className="space-y-2 overflow-x-auto">
                      <div className="min-w-[600px]">
                          {filteredContentList.map(c=>(
                              <div key={c.id} className="flex justify-between border-b p-3 items-center bg-white/50 rounded hover:bg-white transition mb-2">
                                  <div className="flex items-center flex-wrap gap-2">
                                      <span className="font-bold ml-2">{c.title}</span>
                                      {c.type === 'video' && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold">{c.videoSection === 'exercises' ? 'حل تدريبات' : c.videoSection === 'reviews' ? 'مراجعة' : 'شرح'}</span>}
                                      {c.isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Crown size={10}/> VIP</span>}
                                      {c.allowedEmails && c.allowedEmails.length > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded flex items-center gap-1 inline-flex"><Lock size={10}/> خاص</span>}
                                      {c.type === 'interactive_exam' && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded">امتحان تفاعلي</span>}
                                      {c.type === 'html' && <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded">HTML</span>}
                                      {c.type === 'link' && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded">رابط خارجي</span>}
                                  </div>
                                  <div className="flex gap-2">
                                      <button onClick={() => openFullContentEditor(c)} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded" title="تعديل كامل / نسخة جديدة"><Edit size={18}/></button>
                                      <button onClick={() => handleDeleteContent(c.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}
    </>
  );
}
