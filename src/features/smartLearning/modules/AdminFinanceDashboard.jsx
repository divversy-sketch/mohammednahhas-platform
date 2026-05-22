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

export function AdminFinanceDashboard({ users = [], subscriptionCodes = [] }) {
  const [payments, setPayments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  useEffect(() => onSnapshot(query(collection(db, 'payment_requests'), orderBy('createdAt', 'desc'), limit(100)), (snap) => setPayments(snap.docs.map((d)=>({id:d.id,...d.data()}))), () => setPayments([])), []);
  useEffect(() => onSnapshot(query(collection(db, 'enrollments'), limit(300)), (snap) => setEnrollments(snap.docs.map((d)=>({id:d.id,...d.data()}))), () => setEnrollments([])), []);
  const pending = payments.filter((p)=>p.status==='pending').length;
  const accepted = payments.filter((p)=>['approved','completed','accepted'].includes(p.status)).length;
  const premium = users.filter((u)=>u.subscriptionStatus==='premium').length;
  const usedCodes = subscriptionCodes.filter((c)=>c.isUsed).length;
  return <div className="space-y-6" dir="rtl"><PageHeader title="اللوحة المالية والاشتراكات" description="ملخص عملي للدفع والاشتراكات والأكواد والكورسات المفتوحة، مرتبط بالبيانات الموجودة في المنصة." icon={<CreditCard className="text-emerald-600"/>}/><div className="grid md:grid-cols-4 gap-4"><StatCard title="طلبات دفع معلقة" value={pending} tone="amber"/><StatCard title="طلبات مكتملة" value={accepted} tone="emerald"/><StatCard title="طلاب VIP" value={premium} tone="blue"/><StatCard title="أكواد مستخدمة" value={usedCodes} tone="slate"/></div><div className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-3">آخر طلبات الدفع</h3>{payments.slice(0,20).map((p)=><div key={p.id} className="grid md:grid-cols-4 gap-2 border-b py-3 text-sm"><b>{p.studentName || p.name || p.email}</b><span>{p.amount || p.value || '—'} جنيه</span><span>{p.status}</span><span>{arabicDate(p.createdAt)}</span></div>)}</div><div className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-3">فتحات الكورسات</h3>{enrollments.slice(0,20).map((e)=><div key={e.id} className="grid md:grid-cols-4 gap-2 border-b py-3 text-sm"><b>{users.find((u)=>(u.id||u.uid)===e.userId)?.name || e.userId}</b><span>{e.courseId}</span><span>{e.status}</span><span>{e.openedBy || '—'}</span></div>)}</div></div>;
}
