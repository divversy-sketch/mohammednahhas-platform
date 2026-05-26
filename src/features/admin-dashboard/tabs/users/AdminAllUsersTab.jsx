import React from 'react';
import { Clock, Crown, Download, Edit, FileCheck, KeyRound, Phone, RefreshCw, Trash2, Users, X } from '@shared/icons/lucide-shim.jsx';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades';
import { normalizeEgyptPhone } from '@shared/utils/phone';
import PaginationBar from '@shared/components/PaginationBar.jsx';

export default function AdminAllUsersTab({
  dailyFilteredActiveUsers,
  filteredActiveUsers,
  adminGradeFilter,
  setAdminGradeFilter,
  dailyAdminStats,
  studentSearchTerm,
  setStudentSearchTerm,
  studentStatusFilter,
  setStudentStatusFilter,
  studentSubscriptionFilter,
  setStudentSubscriptionFilter,
  exportStudentsExcel,
  editingUser,
  setEditingUser,
  handleUpdateUser,
  studentsPagination,
  handleToggleSubscription,
  handleChangeUserStatus,
  openStudentProfile,
  handleSendResetPassword,
  handleDeleteUser,
  approveGrade,
  rejectGrade,
}) {
  return (
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
  );
}
