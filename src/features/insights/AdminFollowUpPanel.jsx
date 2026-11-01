import { useMemo, useState } from 'react';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { AlertTriangle, BarChart3, ClipboardList, MessageCircle, Users, Bell, Crown } from '../../shared/icons/lucide-shim.jsx';
import { buildAdminInsights, buildParentReportText, buildWhatsAppLink } from './learningInsights.js';
import { getGradeLabel } from '../../shared/constants/grades';
import { buildNotification } from '../../shared/notifications/notify.js';

const AdminFollowUpPanel = ({ users = [], exams = [], examResults = [], assignments = [], assignmentSubmissions = [], hwResults = [], mistakes = [], videoViews = [], adminGradeFilter = 'all' }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const insights = useMemo(() => buildAdminInsights({
    users,
    exams,
    results: examResults,
    assignments,
    submissions: assignmentSubmissions,
    hwResults,
    mistakes,
    videoViews,
    gradeFilter: adminGradeFilter
  }), [users, exams, examResults, assignments, assignmentSubmissions, hwResults, mistakes, videoViews, adminGradeFilter]);

  const selectedRow = insights.rows.find(r => r.studentId === selectedStudentId) || insights.rows[0];
  const selectedStudent = users.find(u => u.id === selectedRow?.studentId) || {};
  const reportText = selectedRow ? buildParentReportText(selectedStudent, selectedRow) : '';

  const copyReport = async (row) => {
    const text = row ? buildParentReportText(users.find(u => u.id === row.studentId) || {}, row) : reportText;
    try { await navigator.clipboard?.writeText(text); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('nahhas-toast', { detail: { message: 'تم نسخ تقرير ولي الأمر.', type: 'success' } }));
  };

  const setStudentGroup = async (studentId, value) => {
    await updateDoc(doc(db, 'users', studentId), { studyGroup: value || null, updatedAt: serverTimestamp() });
    window.dispatchEvent(new CustomEvent('nahhas-toast', { detail: { message: 'تم تحديث مجموعة الطالب.', type: 'success' } }));
  };

  const sendAlertNotification = async (row) => {
    const body = `راجع خطتك: ${(row.recommendations || []).join('، ') || 'كمّل وذاكر الدروس اللي فاتتك'}`;
    await addDoc(collection(db, 'notifications'), { ...buildNotification({ audienceKeys: [`user:${row.studentId}`], category: 'reminder', priority: 'high', title: 'خطة متابعة جديدة', body, source: 'admin_follow_up' }), userId: row.studentId });
    window.dispatchEvent(new CustomEvent('nahhas-toast', { detail: { message: 'تم إرسال تنبيه للطالب.', type: 'success' } }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border shadow-sm"><p className="text-xs font-black text-slate-500">متوسط عام</p><p className="text-3xl font-black text-slate-900">{insights.average}%</p></div>
        <div className="bg-red-50 p-5 rounded-3xl border border-red-100"><p className="text-xs font-black text-red-600">إنذار عالي</p><p className="text-3xl font-black text-red-700">{insights.high}</p></div>
        <div className="bg-amber-50 p-5 rounded-3xl border border-amber-100"><p className="text-xs font-black text-amber-700">يحتاج متابعة</p><p className="text-3xl font-black text-amber-800">{insights.medium}</p></div>
        <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100"><p className="text-xs font-black text-emerald-700">مستقر</p><p className="text-3xl font-black text-emerald-800">{insights.active}</p></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2"><AlertTriangle className="text-red-500"/> متابعة الطلاب والإنذارات</h2>
          <div className="space-y-2">
            {insights.rows.sort((a,b) => (b.riskReasons.length - a.riskReasons.length) || (a.average - b.average)).map(row => {
              const student = users.find(u => u.id === row.studentId) || {};
              const wa = buildWhatsAppLink(student.parentPhone, buildParentReportText(student, row));
              return (
                <div key={row.studentId} className="flex flex-wrap gap-x-4 gap-y-2 items-center border border-slate-100 rounded-2xl p-3 bg-slate-50">
                  <div className="flex-1 min-w-[150px]"><p className="font-black text-slate-800">{row.name}</p><p className="text-xs text-slate-500">{getGradeLabel(row.grade)} · {student.studyGroup || 'بدون مجموعة'}</p></div>
                  <div className="font-black text-center w-12">{row.average}%</div>
                  <div className="text-xs font-bold text-slate-600 flex-1 min-w-[120px]">{row.riskReasons.join('، ') || 'مستقر'}</div>
                  <div className="w-36"><input className="w-full border rounded-xl p-2 text-xs" placeholder="اسم المجموعة" defaultValue={student.studyGroup || ''} onBlur={(e)=>setStudentGroup(row.studentId, e.target.value)} /></div>
                  <div className="flex gap-2 justify-end flex-wrap ms-auto">
                    <button onClick={() => { setSelectedStudentId(row.studentId); copyReport(row); }} className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1"><ClipboardList size={14}/> تقرير</button>
                    {wa && <a href={wa} target="_blank" rel="noreferrer" className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1"><MessageCircle size={14}/> ولي الأمر</a>}
                    <button onClick={() => sendAlertNotification(row)} className="bg-amber-600 text-white px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1"><Bell size={14}/> تنبيه</button>
                  </div>
                </div>
              );
            })}
            {insights.rows.length === 0 && <p className="text-center text-slate-500 py-10">لا توجد بيانات طلاب مطابقة.</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <h3 className="font-black mb-4 flex items-center gap-2"><BarChart3 className="text-amber-600"/> أكثر الفروع احتياجاً</h3>
            {insights.branches.slice(0, 8).map(b => <div key={b.branch} className="flex justify-between border-b py-2 text-sm"><span className="font-bold">{b.branch}</span><span className="text-red-600 font-black">{b.count} طالب</span></div>)}
            {insights.branches.length === 0 && <p className="text-slate-500 text-sm">لا يوجد تحليل فروع كافٍ.</p>}
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <h3 className="font-black mb-4 flex items-center gap-2"><Users className="text-blue-600"/> المجموعات</h3>
            {Object.entries(insights.groups).map(([name, rows]) => <div key={name} className="flex justify-between border-b py-2 text-sm"><span className="font-bold">{name}</span><span>{rows.length} طالب</span></div>)}
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <h3 className="font-black mb-4 flex items-center gap-2"><Crown className="text-amber-600"/> اشتراكات قاربت على الانتهاء</h3>
            {users.filter(u => u.subscriptionStatus === 'premium').slice(0, 8).map(u => <div key={u.id} className="flex justify-between border-b py-2 text-sm"><span className="font-bold">{u.name}</span><span className="text-slate-500">{u.subscriptionExpiry?.toDate?.().toLocaleDateString('ar-EG') || 'غير محدد'}</span></div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFollowUpPanel;
