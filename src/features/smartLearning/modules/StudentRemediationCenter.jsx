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
import { buildWeaknessMap } from './buildWeaknessMap.jsx';

export function StudentRemediationCenter({ user, exams = [], examResults = [], mistakes = [], content = [], onStartMistakesExam, setActiveTab }) {
  const weak = buildWeaknessMap({ exams, examResults, mistakes }).slice(0, 6);
  const recommended = weak.flatMap((w) => content.filter((c) => `${c.title || ''} ${c.branch || ''} ${c.topic || ''}`.includes(w.topic) || `${c.title || ''}`.includes(w.branch)).slice(0, 2));
  return <div className="space-y-6" dir="rtl"><PageHeader title="العلاج الذكي" description="المنصة تحلل أخطاءك ونتائجك وتقترح دروسًا وتدريبات مناسبة بدل ما تسيبك تايه في المنهج." icon={<Target className="text-red-600"/>}/><div className="grid md:grid-cols-3 gap-4"><StatCard title="نقاط ضعف مكتشفة" value={weak.length} tone="red"/><StatCard title="أسئلة في بنك الأخطاء" value={mistakes.length} tone="amber"/><StatCard title="توصيات مراجعة" value={recommended.length} tone="emerald"/></div><div className="grid lg:grid-cols-2 gap-5"><section className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-3">أولويات المراجعة</h3>{weak.map((w)=><div key={`${w.branch}-${w.topic}`} className="border rounded-2xl p-3 mb-2"><p className="font-black">{w.branch} / {w.topic}</p><p className="text-sm text-slate-500">الدقة الحالية: {w.average}% • أخطاء: {w.mistakes}</p></div>)}{!weak.length && <EmptyState title="لا توجد بيانات كافية بعد" icon="🎯"/>}</section><section className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-3">دروس مقترحة</h3>{recommended.map((c)=><button key={c.id} onClick={()=>setActiveTab?.('videos')} className="w-full text-right border rounded-2xl p-3 mb-2 hover:bg-slate-50"><p className="font-black">{c.title}</p><p className="text-xs text-slate-500">{c.type || 'محتوى'} • {c.branch || 'عام'}</p></button>)}{!recommended.length && <p className="text-slate-500 font-bold">بعد ظهور نتائج أكثر، هنرشح لك دروسًا أدق.</p>}</section></div><button onClick={onStartMistakesExam} className="bg-red-700 text-white px-6 py-3 rounded-2xl font-black flex gap-2"><ClipboardList/> ابدأ تدريب بنك الأخطاء</button></div>;
}
