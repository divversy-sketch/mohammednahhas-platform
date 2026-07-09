import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, limit } from 'firebase/firestore';
import { db } from '@services/firebase';
import { BarChart3, ClipboardList, CreditCard, Download, Lock, MessageSquare, PlayCircle, Save, Send, Shield, Sparkles, Target, Users, Wand2 } from '@shared/icons/lucide-shim.jsx';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades.jsx';
import { platformConfirm, platformNotify } from '@shared/core/platformShared.jsx';
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
  useEffect(() => onSnapshot(query(collection(db, 'student_groups'), orderBy('createdAt')), (snap) => setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse()), () => setGroups([])), []);
  const createGroup = async (e) => {
    e.preventDefault();
    if (!clean(form.name)) return platformNotify('اكتب اسم المجموعة');
    await addDoc(collection(db, 'student_groups'), { ...form, members: [], createdAt: serverTimestamp(), createdBy: userData?.email || 'admin' });
    setForm({ ...form, name: '', description: '' });
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
  const deleteGroup = async (groupToDelete) => {
    if (!groupToDelete?.id) return;
    if (!platformConfirm(`حذف المجموعة "${groupToDelete.name || 'بدون اسم'}"؟ لن يتم حذف الطلاب، سيتم حذف المجموعة فقط وإزالة ربطها من الطلاب.`)) return;
    const memberIds = Array.isArray(groupToDelete.members) ? groupToDelete.members.filter(Boolean) : [];
    for (const id of memberIds) {
      const student = users.find((u) => (u.id || u.uid) === id);
      const currentGroupIds = Array.isArray(student?.groupIds) ? student.groupIds : [];
      await updateDoc(doc(db, 'users', id), { groupIds: currentGroupIds.filter((x) => x !== groupToDelete.id), updatedAt: serverTimestamp() }).catch(() => {});
    }
    await deleteDoc(doc(db, 'student_groups', groupToDelete.id));
    if (selectedGroup === groupToDelete.id) setSelectedGroup('');
    platformNotify('تم حذف المجموعة بنجاح.');
  };
  const group = groups.find((g) => g.id === selectedGroup) || groups[0];
  return <div className="space-y-6" dir="rtl">
    <PageHeader title="المجموعات والدفعات" description="قسّم الطلاب إلى دفعات ومجموعات، وبعدها اربط الامتحانات والرسائل والكورسات بالمجموعة بدل الاختيار اليدوي كل مرة." icon={<Users className="text-blue-600"/>}/>
    <form onSubmit={createGroup} className="bg-white rounded-3xl border p-5 grid md:grid-cols-4 gap-3">
      <input className="border rounded-xl p-3 font-bold" placeholder="اسم المجموعة" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})}/>
      <select className="border rounded-xl p-3 font-bold" value={form.grade} onChange={(e)=>setForm({...form, grade:e.target.value})}><GradeOptions/></select>
      <input className="border rounded-xl p-3 font-bold" placeholder="وصف مختصر" value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})}/>
      <button className="bg-blue-700 text-white rounded-xl font-black">إنشاء مجموعة</button>
    </form>
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="bg-white rounded-3xl border p-4 space-y-2">{groups.map((g)=> <div key={g.id} className={`flex items-center gap-2 rounded-2xl p-2 ${group?.id===g.id?'bg-blue-50 text-blue-700':'bg-slate-50'}`}><button type="button" onClick={()=>setSelectedGroup(g.id)} className="flex-1 text-right p-2 font-black">{g.name}<span className="block text-xs text-slate-500">{(g.members||[]).length} طالب</span></button><button type="button" onClick={()=>deleteGroup(g)} className="shrink-0 rounded-xl bg-red-50 text-red-700 px-3 py-2 text-xs font-black hover:bg-red-100" title="حذف المجموعة">حذف</button></div>)}{!groups.length && <EmptyState title="لا توجد مجموعات" icon="👥"/>}</div>
      <div className="lg:col-span-2 bg-white rounded-3xl border p-4"><h3 className="font-black mb-3">طلاب المجموعة: {group?.name || '—'}</h3><div className="grid md:grid-cols-2 gap-2 max-h-[520px] overflow-auto">{users.map((u)=>{ const id = u.id || u.uid; const active = (group?.members || []).includes(id); return <button key={id} disabled={!group} onClick={()=>toggleMember(group,u)} className={`text-right border rounded-2xl p-3 ${active?'bg-emerald-50 border-emerald-200':'bg-slate-50'}`}><p className="font-black">{u.name || u.displayName || u.email}</p><p className="text-xs text-slate-500">{u.email}</p><p className={`text-xs font-black ${active?'text-emerald-700':'text-slate-400'}`}>{active?'داخل المجموعة':'اضغط للإضافة'}</p></button>})}</div></div>
    </div>
  </div>;
}
