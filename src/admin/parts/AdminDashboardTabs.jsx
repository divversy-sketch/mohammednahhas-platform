import React from 'react';
import { CheckCircle, Lock, X, AlertTriangle, Trash2, Eye, ShieldAlert, Phone, Edit, KeyRound, Send, MessageCircle, ClipboardList, Unlock, Layout, Bell, Download, Calendar, Clock, Upload, Users, RefreshCw, FileCheck, Crown, Key } from '../../shared/icons/lucide-shim.jsx';


import { GradeOptions, getGradeLabel } from '../../shared/constants/grades';
import { normalizeEgyptPhone } from '../../shared/utils/phone';


import { AdminCoursesManager } from '../../features/courses/CourseSystem';


import { platformNotify, getQuestionsForExam, generatePDF, VIDEO_EXAM_UNLOCK_PERCENT, InlineTabs } from '../../shared/core/platformShared.jsx';
import { usePagination } from '../../shared/hooks/usePagination.js';
import PaginationBar from '../../shared/components/PaginationBar.jsx';
import ImageFitControls from '../../shared/ui/ImageFitControls.jsx';
import { downloadXlsx } from '../../shared/utils/exportData.js';


import AdminPaymentRequestsPanel from './AdminPaymentRequestsPanel.jsx';
import AdminPerformanceAnalytics from './AdminPerformanceAnalytics.jsx';
import AdminProDashboard from './AdminProDashboard.jsx';
import AdminQuestionDeepAnalytics from './AdminQuestionDeepAnalytics.jsx';
import AdvancedAntiCheatInsights from './AdvancedAntiCheatInsights.jsx';


import LeaderboardPanel from '../../shared/platformParts/LeaderboardPanel.jsx';

import SmartSubscriptionManager from './SmartSubscriptionManager.jsx';


import AdminPendingUsersPage from '../pages/AdminPendingUsersPage.jsx';
import { AdminAssignmentsPage, AdminExamViewTabs, AdminQuestionBankPage } from '../pages/AdminUtilityPages.jsx';

import AdminFollowUpPanel from '../../features/insights/AdminFollowUpPanel.jsx';
import AdminSmartHomeworkManager from '../../features/homework/AdminSmartHomeworkManager.jsx';
import { AdminAuditLogViewer, AdminNotificationsManager, AdminPlatformSettingsManager, AdminRolesManager, AdminGrowthSuite } from './AdminOperationsSuite.jsx';
import { AdminSmartExamEngine, AdminStudentReports, AdminGroupsManager, AdminMessagingCenter, AdminFinanceDashboard, AdminVideoSecurityPanel } from '../../features/smartLearning/SmartLearningEngine.jsx';
import { canAccessAdminTab } from '../../config/adminPermissions';
import AdminCommandCenter from '../components/AdminCommandCenter.jsx';
import AdminSystemHealthPanel from '../components/AdminSystemHealthPanel.jsx';
import AdminV2PageFrame from '../v2/AdminV2PageFrame.jsx';
import AdminStudentSuccessSuite from '../../features/studentSuccess/StudentSuccessAdminSuite.jsx';
import { AdminGlobalSearch, AdminLiveClassesPanel, AdminCertificatesPanel, AdminCommandQuickActions } from '../../features/product/ProductExperienceSuite.jsx';


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

  return (
        <div className="md:col-span-3 w-full overflow-hidden">
          <AdminV2PageFrame
            activeTab={activeTab}
            onNavigate={setActiveTab}
            stats={v2AdminStats}
            adminName={adminProfile?.name || userData?.name || userData?.email}
          >
          {activeTab === 'dashboard' && (
            <InlineTabs
              defaultTab="overview"
              tabs={[
                { key: 'overview', label: 'نظرة عامة', content: <div className="space-y-6"><AdminGlobalSearch users={activeUsersList} exams={examsList} content={contentList} assignments={assignments} examResults={examResults} supportTickets={messagesList} onNavigate={setActiveTab} /><AdminCommandQuickActions onNavigate={setActiveTab} /><AdminCommandCenter users={activeUsersList} exams={examsList} examResults={examResults} onNavigate={setActiveTab} /><AdminStudentSuccessSuite variant="dashboard" users={activeUsersList} exams={examsList} examResults={examResults} content={contentList} assignments={assignments} assignmentSubmissions={assignmentSubmissions} videoViews={videoViews} /><AdminProDashboard users={activeUsersList} exams={examsList} results={examResults} content={contentList} subscriptionCodes={subscriptionCodes} hwResults={hwResults} adminGradeFilter={adminGradeFilter} /></div> },
                { key: 'performance', label: 'تحليل الأداء', content: <AdminPerformanceAnalytics examResults={examResults} examsList={examsList} users={activeUsersList} adminGradeFilter={adminGradeFilter} /> },
                { key: 'questions', label: 'تحليل الأسئلة', content: <AdminQuestionDeepAnalytics examsList={examsList} examResults={examResults} /> },
                { key: 'leaderboard', label: 'لوحة الشرف', content: <LeaderboardPanel examResults={examResults} users={activeUsersList} gradeFilter={adminGradeFilter} /> }
              ]}
            />
          )}

          {activeTab === 'follow_up' && (
            <AdminFollowUpPanel
              users={activeUsersList}
              exams={examsList}
              examResults={examResults}
              assignments={assignments}
              assignmentSubmissions={assignmentSubmissions}
              hwResults={hwResults}
              mistakes={mistakes}
              videoViews={videoViews}
              adminGradeFilter={adminGradeFilter}
            />
          )}

          {activeTab === 'users' && <AdminPendingUsersPage filteredPendingUsers={filteredPendingUsers} handleApprove={handleApprove} handleReject={handleReject} />}

          {activeTab === 'all_users' && (
              <div className="glass-panel p-4 md:p-6 rounded-xl">
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                      <h2 className="font-bold font-arabic text-xl">قائمة الطلاب ({dailyFilteredActiveUsers.length} / {filteredActiveUsers.length})</h2>
                      <div className="md:hidden">
                          <select className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold shadow-sm w-full" value={adminGradeFilter} onChange={(e) => setAdminGradeFilter(e.target.value)}>
                              <option value="all">كل المراحل</option><GradeOptions />
                          </select>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
                      <div className="rounded-2xl border border-slate-100 bg-white p-4"><p className="text-xs font-bold text-slate-500">إجمالي الطلاب</p><p className="text-2xl font-black text-slate-900">{dailyAdminStats.total}</p></div>
                      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4"><p className="text-xs font-bold text-amber-700">VIP</p><p className="text-2xl font-black text-amber-900">{dailyAdminStats.vipUsers}</p></div>
                      <div className="rounded-2xl border border-red-100 bg-red-50 p-4"><p className="text-xs font-bold text-red-700">محظورين</p><p className="text-2xl font-black text-red-900">{dailyAdminStats.bannedUsers}</p></div>
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-bold text-blue-700">طلبات مرحلة</p><p className="text-2xl font-black text-blue-900">{dailyAdminStats.pendingGradeUpdates}</p></div>
                      <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4"><p className="text-xs font-bold text-purple-700">محاولات تحتاج متابعة</p><p className="text-2xl font-black text-purple-900">{dailyAdminStats.securityHeldAttempts}</p></div>
                  </div>

                  <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <input value={studentSearchTerm} onChange={(e) => setStudentSearchTerm(e.target.value)} placeholder="بحث بالاسم / الهاتف / البريد" className="md:col-span-2 border border-slate-200 p-3 rounded-xl font-bold outline-none focus:border-blue-400" />
                          <select value={studentStatusFilter} onChange={(e) => setStudentStatusFilter(e.target.value)} className="border border-slate-200 p-3 rounded-xl font-bold bg-white">
                              <option value="all">كل الحالات</option>
                              <option value="active">نشط</option>
                              <option value="banned">أي حظر</option>
                              <option value="banned_exam">حظر امتحانات</option>
                              <option value="banned_content">حظر محتوى</option>
                              <option value="banned_all">حظر شامل</option>
                          </select>
                          <select value={studentSubscriptionFilter} onChange={(e) => setStudentSubscriptionFilter(e.target.value)} className="border border-slate-200 p-3 rounded-xl font-bold bg-white">
                              <option value="all">كل الاشتراكات</option>
                              <option value="premium">VIP فقط</option>
                              <option value="free">مجاني فقط</option>
                          </select>
                          <button onClick={exportStudentsExcel} className="bg-slate-900 text-white rounded-xl font-black flex items-center justify-center gap-2 px-4 py-3 hover:bg-slate-800"><Download size={16}/> تصدير الطلاب</button>
                      </div>
                  </div>
                  
                  {editingUser && (
                      <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                              <button onClick={() => setEditingUser(null)} className="absolute top-4 left-4 text-slate-400 hover:text-red-500"><X size={24}/></button>
                              <h3 className="text-xl font-bold mb-6 text-blue-800 flex items-center gap-2 border-b pb-2"><Edit size={24}/> تعديل بيانات الطالب</h3>
                              <form onSubmit={handleUpdateUser} className="space-y-4">
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">اسم الطالب</label><input className="w-full border-2 border-blue-100 p-3 rounded-xl bg-blue-50 focus:border-blue-500 outline-none transition" value={editingUser.name || ''} onChange={e=>setEditingUser({...editingUser, name:e.target.value})} required/></div>
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">رقم هاتف الطالب</label><input type="tel" className="w-full border-2 border-blue-100 p-3 rounded-xl bg-blue-50 focus:border-blue-500 outline-none transition" value={editingUser.phone || ''} onChange={e=>setEditingUser({...editingUser, phone: normalizeEgyptPhone(e.target.value)})} required/></div>
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">رقم هاتف ولي الأمر</label><input type="tel" className="w-full border-2 border-blue-100 p-3 rounded-xl bg-blue-50 focus:border-blue-500 outline-none transition" value={editingUser.parentPhone || ''} onChange={e=>setEditingUser({...editingUser, parentPhone: normalizeEgyptPhone(e.target.value)})} required/></div>
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">المرحلة الدراسية</label><select className="w-full border-2 border-blue-100 p-3 rounded-xl bg-white focus:border-blue-500 outline-none transition" value={editingUser.grade || '1sec'} onChange={e=>setEditingUser({...editingUser, grade:e.target.value})}><GradeOptions /></select></div>
                                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/50 mt-2">حفظ التعديلات</button>
                              </form>
                          </div>
                      </div>
                  )}
                  
                  <div className="grid gap-4">
                      {studentsPagination.pageItems.map(u=> (
                          <div key={u.id} className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all hover:shadow-lg ${u.status.startsWith('banned') ? 'bg-red-50 border-red-200' : 'bg-white/50 border-slate-100'}`}>
                              <div className="flex flex-col lg:flex-row justify-between w-full gap-4">
                                  <div className="flex-1">
                                      <div className="flex flex-wrap items-center gap-2 mb-2">
                                          <p className="font-bold text-lg text-slate-800">{u.name}</p>
                                          <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{getGradeLabel(u.grade)}</span>
                                          {u.subscriptionStatus === 'premium' ? (
                                              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><Crown size={12}/> VIP</span>
                                          ) : (
                                              <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full font-bold">مجاني</span>
                                          )}
                                          {u.status.startsWith('banned') && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-bold">محظور</span>}
                                      </div>
                                      <div className="text-sm text-slate-500 space-y-1">
                                          <p className="flex items-center gap-2"><Phone size={14} className="text-blue-600"/> الطالب: {u.phone}</p>
                                          <p className="flex items-center gap-2 font-bold text-amber-700"><Users size={14}/> ولي الأمر: {u.parentPhone}</p>
                                          {u.subscriptionStatus === 'premium' && u.subscriptionExpiry && (
                                              <p className="flex items-center gap-2 text-green-600 font-bold"><Clock size={14}/> ينتهي اشتراكه: {u.subscriptionExpiry.toDate().toLocaleDateString('ar-EG')}</p>
                                          )}
                                      </div>
                                  </div>
                                  
                                  <div className="flex flex-col gap-2 w-full lg:w-auto">
                                      <div className="flex flex-wrap gap-2">
                                          <button onClick={() => handleToggleSubscription(u)} className={`flex-1 lg:flex-none px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm ${u.subscriptionStatus === 'premium' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}>
                                              <Crown size={14}/> {u.subscriptionStatus === 'premium' ? 'إلغاء الباقة' : 'تفعيل باقة VIP'}
                                          </button>
                                          <select className="flex-1 lg:flex-none text-xs border p-2 rounded-lg bg-white font-bold" value={u.status} onChange={(e) => handleChangeUserStatus(u.id, e.target.value)}>
                                              <option value="active">نشط</option><option value="banned_all">حظر شامل</option><option value="banned_exam">حظر امتحانات</option><option value="banned_content">حظر محتوى</option>
                                          </select>
                                      </div>
                                      <div className="flex gap-2 justify-end mt-2">
                                          <button onClick={()=>openStudentProfile(u)} className="flex-1 lg:flex-none bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-bold shadow-md flex items-center justify-center gap-2"><FileCheck size={16}/> ملف الطالب</button>
                                          <button onClick={()=>setEditingUser(u)} className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200"><Edit size={16}/></button>
                                          <button onClick={()=>handleSendResetPassword(u)} title="تغيير كلمة السر من الأدمن" className="bg-amber-100 text-amber-600 p-2 rounded-lg hover:bg-amber-200"><KeyRound size={16}/></button>
                                          <button onClick={()=>handleDeleteUser(u.id)} className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200"><Trash2 size={16}/></button>
                                      </div>
                                  </div>
                              </div>

                              {u.gradeUpdateStatus === 'pending' && (
                                  <div className="w-full bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex flex-col md:flex-row justify-between items-center gap-3 mt-2">
                                      <div className="flex items-center gap-2 text-yellow-800 text-sm font-bold"><RefreshCw size={16} className="animate-spin-slow" /> يريد التحويل إلى: <span className="bg-white px-2 rounded border">{getGradeLabel(u.requestedGrade)}</span></div>
                                      <div className="flex gap-2 w-full md:w-auto"><button onClick={() => approveGrade(u)} className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-xs font-bold hover:bg-green-700">موافقة</button><button onClick={() => rejectGrade(u)} className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-xs font-bold hover:bg-red-700">رفض</button></div>
                                  </div>
                              )}
                          </div>
                      ))}
                      {dailyFilteredActiveUsers.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center font-bold text-slate-500">لا يوجد طلاب مطابقين للفلاتر الحالية.</div>}
                      <PaginationBar page={studentsPagination.page} totalPages={studentsPagination.totalPages} totalItems={studentsPagination.totalItems} pageSize={studentsPagination.pageSize} onPageChange={studentsPagination.setPage} label="الطلاب" />
                  </div>
              </div>
          )}

          {activeTab === 'password_resets' && AdminPasswordResetRequestsPanel && (
            <AdminPasswordResetRequestsPanel requests={passwordResetRequests || []} users={[...(activeUsersList || []), ...(pendingUsers || [])]} />
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <AdminPaymentRequestsPanel users={activeUsersList} />
              <SmartSubscriptionManager users={activeUsersList} adminGradeFilter={adminGradeFilter} />
              <AdminGrowthSuite initialTab="payments" compact users={activeUsersList} exams={examsList} examResults={examResults} content={contentList} assignments={assignments} assignmentSubmissions={assignmentSubmissions} subscriptionCodes={subscriptionCodes} notifications={announcements} userData={userData} />
            </div>
          )}

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

          {activeTab === 'smart_hw' && (
            <AdminSmartHomeworkManager
              smartHomeworks={smartHomeworks}
              hwResults={hwResults}
              adminGradeFilter={adminGradeFilter}
              onNotify={platformNotify}
              onDeleteAll={handleDeleteAllHomework}
            />
          )}

          {activeTab === 'question_bank' && (
            <div className="space-y-6">
              <AdminQuestionBankPage adminGradeFilter={adminGradeFilter} />
              <AdminGrowthSuite initialTab="questions" compact users={activeUsersList} exams={examsList} examResults={examResults} content={contentList} assignments={assignments} assignmentSubmissions={assignmentSubmissions} subscriptionCodes={subscriptionCodes} notifications={announcements} userData={userData} />
            </div>
          )}

          {activeTab === 'smart_exam_engine' && <AdminSmartExamEngine adminGradeFilter={adminGradeFilter} exams={examsList} examResults={examResults} userData={userData} />}

          {activeTab === 'student_reports' && (
            <div className="space-y-6">
              <AdminStudentReports users={activeUsersList} exams={examsList} examResults={examResults} content={contentList} videoViews={videoViews} mistakes={mistakes} assignments={assignments} assignmentSubmissions={assignmentSubmissions} />
              <AdminCertificatesPanel users={activeUsersList} examResults={examResults} />
              <AdminStudentSuccessSuite variant="reports" users={activeUsersList} exams={examsList} examResults={examResults} content={contentList} assignments={assignments} assignmentSubmissions={assignmentSubmissions} videoViews={videoViews} />
              <AdminGrowthSuite initialTab="analytics" compact users={activeUsersList} exams={examsList} examResults={examResults} content={contentList} assignments={assignments} assignmentSubmissions={assignmentSubmissions} subscriptionCodes={subscriptionCodes} notifications={announcements} userData={userData} />
            </div>
          )}

          {activeTab === 'student_groups' && <AdminGroupsManager users={activeUsersList} userData={userData} />}

          {activeTab === 'messages_center' && (
            <div className="space-y-6">
              <AdminMessagingCenter users={activeUsersList} userData={userData} />
              <AdminStudentSuccessSuite variant="parent" users={activeUsersList} examResults={examResults} assignments={assignments} assignmentSubmissions={assignmentSubmissions} />
              <AdminGrowthSuite initialTab="support" compact users={activeUsersList} exams={examsList} examResults={examResults} content={contentList} assignments={assignments} assignmentSubmissions={assignmentSubmissions} subscriptionCodes={subscriptionCodes} notifications={announcements} userData={userData} />
            </div>
          )}

          {activeTab === 'finance_dashboard' && <AdminFinanceDashboard users={activeUsersList} subscriptionCodes={subscriptionCodes} />}

          {activeTab === 'video_security' && <div className="space-y-6"><AdminVideoSecurityPanel /><AdminStudentSuccessSuite variant="security" users={activeUsersList} /></div>}

          {activeTab === 'assignments' && <div className="space-y-6"><AdminAssignmentsPage adminGradeFilter={adminGradeFilter} handleDeleteAllHomework={handleDeleteAllHomework} /><AdminStudentSuccessSuite variant="assignments" assignments={assignments} assignmentSubmissions={assignmentSubmissions} /></div>}

          {activeTab === 'exams' && <AdminExamViewTabs adminExamView={adminExamView} setAdminExamView={setAdminExamView} />}

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

          
          
          
          
          

          {activeTab === 'security_center' && (
            <InlineTabs tabs={[{ key: 'anti_cheat', label: 'تنبيهات الحماية', content: <AdvancedAntiCheatInsights examResults={examResults} /> }]} />
          )}


          {activeTab === 'platform_settings' && (
            <div className="space-y-6">
              <AdminPlatformSettingsManager userData={userData} />
              <AdminGrowthSuite initialTab="mobile" compact users={activeUsersList} exams={examsList} examResults={examResults} content={contentList} assignments={assignments} assignmentSubmissions={assignmentSubmissions} subscriptionCodes={subscriptionCodes} notifications={announcements} userData={userData} />
              <AdminStudentSuccessSuite variant="gamification" users={activeUsersList} examResults={examResults} />
              <AdminSystemHealthPanel />
            </div>
          )}

          {activeTab === 'admin_roles' && <AdminRolesManager users={activeUsersList} userData={userData} />}

          {activeTab === 'audit_logs' && <AdminAuditLogViewer />}

          {activeTab === 'notifications_admin' && <div className="space-y-6"><AdminNotificationsManager users={activeUsersList} userData={userData} /><AdminStudentSuccessSuite variant="broadcast" users={activeUsersList} /></div>}


{activeTab === 'courses' && (
  <div className="space-y-6">
    <AdminLiveClassesPanel users={activeUsersList} adminUser={userData} />
    <AdminCoursesManager users={activeUsersList} exams={examsList} adminUser={userData} />
    <AdminGrowthSuite initialTab="courses" compact users={activeUsersList} exams={examsList} examResults={examResults} content={contentList} assignments={assignments} assignmentSubmissions={assignmentSubmissions} subscriptionCodes={subscriptionCodes} notifications={announcements} userData={userData} />
  </div>
)}

{activeTab === 'mistakes_admin' && (
  <div className="glass-panel p-4 md:p-6 rounded-xl space-y-4">
    <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
      <div>
        <h2 className="font-bold font-arabic text-xl">بنك الأخطاء</h2>
        <p className="text-sm text-slate-500 font-bold mt-1">حذف كل أخطاء الطلاب المسجلة مرة واحدة.</p>
      </div>
      <button onClick={handleDeleteAllMistakes} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 justify-center"><Trash2 size={16}/> حذف بنك الأخطاء بالكامل</button>
    </div>
  </div>
)}

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



          {activeTab === 'notifications' && (
            <div className="mt-6">
              <AdminGrowthSuite initialTab="notifications" compact users={activeUsersList} exams={examsList} examResults={examResults} content={contentList} assignments={assignments} assignmentSubmissions={assignmentSubmissions} subscriptionCodes={subscriptionCodes} notifications={announcements} userData={userData} />
            </div>
          )}

          {/* تم حذف صفحة الرد الآلي وإدارة الحكم من لوحة الأدمن */}
          </AdminV2PageFrame>
        </div>
  );
}
