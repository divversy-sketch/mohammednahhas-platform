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

export function StudentMessagesInbox({ user, userData }) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    if (!user?.uid) return undefined;
    const unsubs = [];
    unsubs.push(onSnapshot(query(collection(db, 'student_messages'), where('audience', '==', 'all')), (snap) => setMessages((prev)=>mergeMessages(prev, snap.docs.map((d)=>({id:d.id,...d.data()})))), () => {}));
    unsubs.push(onSnapshot(query(collection(db, 'student_messages'), where('userIds', 'array-contains', user.uid)), (snap) => setMessages((prev)=>mergeMessages(prev, snap.docs.map((d)=>({id:d.id,...d.data()})))), () => {}));
    (userData?.groupIds || []).forEach((gid) => unsubs.push(onSnapshot(query(collection(db, 'student_messages'), where('groupIds', 'array-contains', gid)), (snap) => setMessages((prev)=>mergeMessages(prev, snap.docs.map((d)=>({id:d.id,...d.data()})))), () => {})));
    return () => unsubs.forEach((u)=>u());
  }, [user?.uid, JSON.stringify(userData?.groupIds || [])]);
  return <div className="space-y-5" dir="rtl"><PageHeader title="رسائلي" description="رسائل الإدارة والتنبيهات المهمة تظهر هنا." icon={<MessageSquare className="text-emerald-600"/>}/>{messages.length ? messages.map((m)=><div key={m.id} className="bg-white rounded-3xl border p-5"><p className="font-black text-lg">{m.title}</p><p className="text-slate-600 font-bold leading-7 mt-2">{m.body}</p><p className="text-xs text-slate-400 mt-3">{arabicDate(m.createdAt)}</p></div>) : <EmptyState title="لا توجد رسائل حاليًا" icon="💬"/>}</div>;
}
function mergeMessages(oldRows, newRows) {
  const map = new Map([...oldRows, ...newRows].map((x)=>[x.id,x]));
  return [...map.values()].sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
}
