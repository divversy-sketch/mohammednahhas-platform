import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, limit, writeBatch } from 'firebase/firestore';
import { db } from '@services/firebase';
import { BarChart3, ClipboardList, CreditCard, Download, Lock, MessageSquare, PlayCircle, Save, Send, Shield, Sparkles, Target, Trash2, Users, Wand2 } from '@shared/icons/lucide-shim.jsx';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades.jsx';
import { platformNotify } from '@shared/core/platformShared.jsx';
import PageHeader from '@shared/ui/PageHeader.jsx';
import EmptyState from '@shared/ui/EmptyState.jsx';

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, Number(n) || 0));
const clean = (v) => String(v || '').trim();
const arabicDate = (v) => {
  const date = v?.toDate ? v.toDate() : v ? new Date(v) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString('ar-EG') : '—';
};
const resultPercent = (result, exam) => {
  const explicit = Number(result?.percentage ?? result?.percent ?? result?.scorePercentage);
  if (Number.isFinite(explicit) && explicit > 0) return clamp(explicit);
  const score = Number(result?.score ?? result?.totalScore ?? 0);
  const total = Number(result?.total ?? result?.maxScore ?? 0) || flattenExamQuestions(exam).reduce((s, q) => s + Number(q.maxScore || q.mark || 1), 0) || 1;
  return clamp((score / total) * 100);
};
const flattenExamQuestions = (exam) => (exam?.questions || []).flatMap((group) => group?.subQuestions || []);
const questionScore = (q) => Number(q?.maxScore || q?.mark || 1) || 1;
const pickRandom = (items, count) => [...items].sort(() => Math.random() - 0.5).slice(0, count);
const downloadText = (filename, content, type = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
const topicOf = (item) => clean(item?.topic || item?.lesson || item?.branch || 'عام');
const branchOf = (item) => clean(item?.branch || 'عام');

function StatCard({ title, value, hint, tone = 'slate' }) {
  const toneClass = {
    slate: 'bg-slate-50 text-slate-900 border-slate-100',
    amber: 'bg-amber-50 text-amber-800 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    blue: 'bg-blue-50 text-blue-800 border-blue-100',
    red: 'bg-red-50 text-red-800 border-red-100',
  }[tone] || 'bg-slate-50 text-slate-900 border-slate-100';
  return <div className={`rounded-3xl border p-5 ${toneClass}`}><p className="text-xs font-black opacity-70 mb-2">{title}</p><p className="text-3xl font-black">{value}</p>{hint && <p className="text-xs font-bold opacity-70 mt-2">{hint}</p>}</div>;
}

export function AdminGroupsManager({ users = [], userData }) {
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({ name: '', grade: '3sec', description: '' });
  const [selectedGroup, setSelectedGroup] = useState('');
  const [mode, setMode] = useState('members');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sessionTitle, setSessionTitle] = useState('');
  const [attendanceMap, setAttendanceMap] = useState({});
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  useEffect(() => onSnapshot(query(collection(db, 'student_groups'), orderBy('createdAt')), (snap) => setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse()), () => setGroups([])), []);
  const createGroup = async (e) => {
    e.preventDefault();
    if (!clean(form.name)) return platformNotify('اكتب اسم المجموعة');
    await addDoc(collection(db, 'student_groups'), { ...form, members: [], createdAt: serverTimestamp(), createdBy: userData?.email || 'admin' });
    setForm({ ...form, name: '', description: '' });
  };
  const deleteGroup = async (group) => {
    if (!group?.id) return;
    const name = group.name || 'هذه المجموعة';
    if (!window.confirm(`هل أنت متأكد من حذف مجموعة: ${name}؟`)) return;
    const memberIds = Array.isArray(group.members) ? group.members : [];
    await Promise.all(memberIds.map(async (id) => {
      const student = users.find((u) => (u.id || u.uid) === id);
      const currentGroupIds = Array.isArray(student?.groupIds) ? student.groupIds : [];
      if (currentGroupIds.includes(group.id)) {
        await updateDoc(doc(db, 'users', id), { groupIds: currentGroupIds.filter((x) => x !== group.id), updatedAt: serverTimestamp() });
      }
    }));
    await deleteDoc(doc(db, 'student_groups', group.id));
    setSelectedGroup('');
    platformNotify('تم حذف المجموعة بنجاح');
  };

  const toggleMember = async (group, student) => {
    const id = student.id || student.uid;
    const members = Array.isArray(group.members) ? group.members : [];
    const next = members.includes(id) ? members.filter((x) => x !== id) : [...members, id];
    await updateDoc(doc(db, 'student_groups', group.id), { members: next, updatedAt: serverTimestamp() });
    const currentGroupIds = Array.isArray(student.groupIds) ? student.groupIds : [];
    const nextGroupIds = next.includes(id) ? Array.from(new Set([...currentGroupIds, group.id])) : currentGroupIds.filter((x) => x !== group.id);
    await updateDoc(doc(db, 'users', id), { groupIds: nextGroupIds, updatedAt: serverTimestamp() });
  };
  const group = groups.find((g) => g.id === selectedGroup) || groups[0];
  const groupMembers = (Array.isArray(group?.members) ? group.members : [])
    .map((id) => users.find((user) => (user.id || user.uid) === id))
    .filter(Boolean);

  useEffect(() => {
    if (!group?.id || !attendanceDate) return undefined;
    const q = query(collection(db, 'attendance_records'), where('groupId', '==', group.id), where('dateKey', '==', attendanceDate));
    return onSnapshot(q, (snap) => {
      const next = {};
      snap.docs.forEach((record) => {
        const data = record.data();
        if (data.studentId) next[data.studentId] = data.status || 'present';
      });
      setAttendanceMap(next);
    }, () => setAttendanceMap({}));
  }, [group?.id, attendanceDate]);

  const setAllAttendance = (status) => {
    const next = {};
    groupMembers.forEach((student) => { next[student.id || student.uid] = status; });
    setAttendanceMap(next);
  };

  const saveAttendance = async () => {
    if (!group?.id) return platformNotify('اختر مجموعة أولًا', 'error');
    if (!groupMembers.length) return platformNotify('المجموعة لا تحتوي على طلاب', 'error');
    if (!clean(sessionTitle)) return platformNotify('اكتب اسم الحصة', 'error');
    setAttendanceSaving(true);
    try {
      const batch = writeBatch(db);
      groupMembers.forEach((student) => {
        const studentId = student.id || student.uid;
        const status = attendanceMap[studentId] || 'present';
        const recordId = `${group.id}_${attendanceDate}_${studentId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        batch.set(doc(db, 'attendance_records', recordId), {
          studentId,
          studentName: student.name || student.displayName || student.email || 'طالب',
          groupId: group.id,
          groupName: group.name || '',
          sessionTitle: clean(sessionTitle),
          status,
          dateKey: attendanceDate,
          date: new Date(`${attendanceDate}T12:00:00`),
          updatedAt: serverTimestamp(),
          recordedBy: userData?.email || 'admin',
        }, { merge: true });
      });
      await batch.commit();
      platformNotify('تم حفظ كشف الحضور والغياب بنجاح');
    } catch (error) {
      platformNotify(error.message || 'تعذر حفظ الحضور', 'error');
    } finally {
      setAttendanceSaving(false);
    }
  };
  return <div className="space-y-6" dir="rtl">
    <PageHeader title="المجموعات والدفعات" description="اختر المجموعة مرة واحدة، نظّم طلابها، وسجّل الحضور والغياب من كشف سريع بدون بحث عن كل طالب." icon={<Users className="text-blue-600"/>}/>
    <div className="bg-white rounded-3xl border p-2 flex gap-2 w-fit">
      <button type="button" onClick={() => setMode('members')} className={`px-5 py-3 rounded-2xl font-black ${mode === 'members' ? 'bg-blue-700 text-white' : 'bg-slate-50 text-slate-700'}`}>إدارة طلاب المجموعة</button>
      <button type="button" onClick={() => setMode('attendance')} className={`px-5 py-3 rounded-2xl font-black ${mode === 'attendance' ? 'bg-amber-500 text-slate-950' : 'bg-slate-50 text-slate-700'}`}>الحضور والغياب</button>
    </div>

    {mode === 'members' && <>
      <form onSubmit={createGroup} className="bg-white rounded-3xl border p-5 grid md:grid-cols-4 gap-3">
        <input className="border rounded-xl p-3 font-bold" placeholder="اسم المجموعة" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})}/>
        <select className="border rounded-xl p-3 font-bold" value={form.grade} onChange={(e)=>setForm({...form, grade:e.target.value})}>{GradeOptions.map((grade) => <option key={grade.value} value={grade.value}>{grade.label}</option>)}</select>
        <input className="border rounded-xl p-3 font-bold" placeholder="وصف مختصر" value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})}/>
        <button className="bg-blue-700 text-white rounded-xl font-black">إنشاء مجموعة</button>
      </form>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border p-4 space-y-2">{groups.map((g)=> <div key={g.id} className={`flex items-center gap-2 rounded-2xl p-2 ${group?.id===g.id?'bg-blue-50':'bg-slate-50'}`}><button type="button" onClick={()=>setSelectedGroup(g.id)} className={`flex-1 text-right p-2 rounded-xl font-black ${group?.id===g.id?'text-blue-700':'text-slate-800'}`}>{g.name}<span className="block text-xs text-slate-500">{(Array.isArray(g.members) ? g.members : []).length} طالب</span></button><button type="button" title="حذف المجموعة" onClick={()=>deleteGroup(g)} className="shrink-0 rounded-xl border border-red-100 bg-red-50 p-2 text-red-700 hover:bg-red-100"><Trash2 size={18}/></button></div>)}{!groups.length && <EmptyState title="لا توجد مجموعات" icon="👥"/>}</div>
        <div className="lg:col-span-2 bg-white rounded-3xl border p-4"><h3 className="font-black mb-3">طلاب المجموعة: {group?.name || '—'}</h3><div className="grid md:grid-cols-2 gap-2 max-h-[520px] overflow-auto">{users.map((u)=>{ const id = u.id || u.uid; const active = (Array.isArray(group?.members) ? group.members : []).includes(id); return <button key={id} disabled={!group} onClick={()=>toggleMember(group,u)} className={`text-right border rounded-2xl p-3 ${active?'bg-emerald-50 border-emerald-200':'bg-slate-50'}`}><p className="font-black">{u.name || u.displayName || u.email}</p><p className="text-xs text-slate-500">{u.email}</p><p className={`text-xs font-black ${active?'text-emerald-700':'text-slate-400'}`}>{active?'داخل المجموعة':'اضغط للإضافة'}</p></button>})}</div></div>
      </div>
    </>}

    {mode === 'attendance' && <div className="grid lg:grid-cols-[280px_1fr] gap-5">
      <aside className="bg-white rounded-3xl border p-4 space-y-2 h-fit">
        <h3 className="font-black mb-3">اختر المجموعة</h3>
        {groups.map((g) => <button key={g.id} type="button" onClick={() => setSelectedGroup(g.id)} className={`w-full text-right p-3 rounded-2xl font-black ${group?.id === g.id ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-50 text-slate-700'}`}><span>{g.name}</span><small className="block mt-1 text-slate-500">{(Array.isArray(g.members) ? g.members : []).length} طالب</small></button>)}
      </aside>
      <section className="bg-white rounded-3xl border p-5">
        <div className="flex flex-wrap items-end gap-3 border-b pb-5 mb-5">
          <label className="font-black text-sm">تاريخ الحصة<input type="date" className="block mt-2 border rounded-xl p-3 font-bold" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} /></label>
          <label className="font-black text-sm flex-1 min-w-[220px]">اسم الحصة<input className="block mt-2 w-full border rounded-xl p-3 font-bold" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} placeholder="مثال: حصة اسم الفاعل" /></label>
          <button type="button" onClick={() => setAllAttendance('present')} className="bg-emerald-600 text-white px-4 py-3 rounded-xl font-black">الكل حاضر</button>
          <button type="button" onClick={() => setAllAttendance('absent')} className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-xl font-black">الكل غائب</button>
        </div>
        <div className="flex items-center justify-between mb-4"><div><small className="font-black text-amber-700">كشف الحضور</small><h3 className="text-2xl font-black">{group?.name || 'اختر مجموعة'}</h3></div><span className="bg-slate-100 rounded-full px-4 py-2 font-black">{groupMembers.length} طالب</span></div>
        {!groupMembers.length ? <EmptyState title="لا يوجد طلاب داخل هذه المجموعة" icon="🧑‍🎓"/> : <div className="space-y-2 max-h-[560px] overflow-auto pr-1">{groupMembers.map((student, index) => {
          const id = student.id || student.uid;
          const status = attendanceMap[id] || 'present';
          return <article key={id} className="grid md:grid-cols-[48px_1fr_auto] items-center gap-3 border rounded-2xl p-3 bg-slate-50">
            <b className="w-10 h-10 rounded-xl bg-white border grid place-items-center">{index + 1}</b>
            <div><strong className="block">{student.name || student.displayName || student.email}</strong><small className="text-slate-500">{student.phone || student.email || getGradeLabel(student.grade)}</small></div>
            <div className="flex gap-2">
              {[['present','حاضر','bg-emerald-600 text-white'],['late','متأخر','bg-amber-400 text-slate-950'],['absent','غائب','bg-red-600 text-white']].map(([value,label,activeClass]) => <button type="button" key={value} onClick={() => setAttendanceMap((current) => ({ ...current, [id]: value }))} className={`px-3 py-2 rounded-xl font-black border ${status === value ? activeClass : 'bg-white text-slate-600'}`}>{label}</button>)}
            </div>
          </article>;
        })}</div>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white rounded-2xl p-4">
          <div className="flex gap-4 text-sm font-black"><span>حاضر: {groupMembers.filter((s) => (attendanceMap[s.id || s.uid] || 'present') === 'present').length}</span><span>متأخر: {groupMembers.filter((s) => attendanceMap[s.id || s.uid] === 'late').length}</span><span>غائب: {groupMembers.filter((s) => attendanceMap[s.id || s.uid] === 'absent').length}</span></div>
          <button type="button" disabled={attendanceSaving || !groupMembers.length} onClick={saveAttendance} className="bg-amber-400 text-slate-950 px-6 py-3 rounded-xl font-black disabled:opacity-50">{attendanceSaving ? 'جاري الحفظ...' : 'حفظ كشف الحضور'}</button>
        </div>
      </section>
    </div>}
  </div>;
}
