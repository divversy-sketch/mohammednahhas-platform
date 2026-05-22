import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, limit } from 'firebase/firestore';
import { db } from '@services/firebase';
import { BarChart3, ClipboardList, CreditCard, Download, Lock, MessageSquare, PlayCircle, Save, Send, Shield, Sparkles, Target, Users, Wand2 } from '@shared/icons/lucide-shim.jsx';
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

export function AdminMessagingCenter({ users = [], userData }) {
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState({ audience: 'all', studentId: '', groupId: '', title: '', body: '' });
  useEffect(() => onSnapshot(query(collection(db, 'student_groups'), orderBy('createdAt', 'desc'), limit(100)), (snap) => setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setGroups([])), []);
  useEffect(() => onSnapshot(query(collection(db, 'student_messages'), orderBy('createdAt')), (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse().slice(0, 50)), () => setMessages([])), []);
  const send = async (e) => {
    e.preventDefault();
    if (!clean(form.title) || !clean(form.body)) return platformNotify('اكتب العنوان والرسالة');
    const target = form.audience === 'student' ? [form.studentId] : form.audience === 'group' ? (groups.find((g) => g.id === form.groupId)?.members || []) : [];
    await addDoc(collection(db, 'student_messages'), { ...form, userIds: target, groupIds: form.groupId ? [form.groupId] : [], createdAt: serverTimestamp(), createdBy: userData?.email || 'admin', seenBy: [] });
    await addDoc(collection(db, 'notifications'), { title: form.title, body: form.body, targetType: form.audience, targetUserIds: target, targetGroupId: form.groupId || '', createdAt: serverTimestamp(), createdBy: userData?.email || 'admin' });
    setForm({ ...form, title: '', body: '' });
    platformNotify('تم إرسال الرسالة والإشعار');
  };
  return <div className="space-y-6" dir="rtl"><PageHeader title="مركز الرسائل" description="رسائل داخلية حقيقية لطالب واحد أو مجموعة أو كل الطلاب، مع تسجيلها في صندوق رسائل الطالب." icon={<MessageSquare className="text-emerald-600"/>}/>
    <form onSubmit={send} className="bg-white rounded-3xl border p-5 space-y-3">
      <div className="grid md:grid-cols-3 gap-3"><select className="border rounded-xl p-3 font-bold" value={form.audience} onChange={(e)=>setForm({...form, audience:e.target.value})}><option value="all">كل الطلاب</option><option value="group">مجموعة</option><option value="student">طالب محدد</option></select>{form.audience==='group' && <select className="border rounded-xl p-3 font-bold" value={form.groupId} onChange={(e)=>setForm({...form, groupId:e.target.value})}><option value="">اختر المجموعة</option>{groups.map((g)=><option key={g.id} value={g.id}>{g.name}</option>)}</select>}{form.audience==='student' && <select className="border rounded-xl p-3 font-bold" value={form.studentId} onChange={(e)=>setForm({...form, studentId:e.target.value})}><option value="">اختر الطالب</option>{users.map((u)=><option key={u.id || u.uid} value={u.id || u.uid}>{u.name || u.email}</option>)}</select>}</div>
      <input className="border rounded-xl p-3 font-bold w-full" placeholder="عنوان الرسالة" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})}/>
      <textarea className="border rounded-xl p-3 font-bold w-full min-h-32" placeholder="نص الرسالة" value={form.body} onChange={(e)=>setForm({...form,body:e.target.value})}/>
      <button className="bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black flex gap-2"><Send/> إرسال</button>
    </form>
    <div className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-3">آخر الرسائل</h3>{messages.map((m)=><div key={m.id} className="border rounded-2xl p-3 mb-2"><p className="font-black">{m.title}</p><p className="text-sm text-slate-600">{m.body}</p><p className="text-xs text-slate-400 mt-1">{arabicDate(m.createdAt)} • {m.audience}</p></div>)}</div>
  </div>;
}
