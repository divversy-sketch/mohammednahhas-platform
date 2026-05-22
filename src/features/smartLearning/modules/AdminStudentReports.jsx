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

export function AdminStudentReports({ users = [], exams = [], examResults = [], content = [], videoViews = [], mistakes = [], assignments = [], assignmentSubmissions = [] }) {
  const [studentId, setStudentId] = useState(users[0]?.id || users[0]?.uid || '');
  useEffect(() => { if (!studentId && users[0]) setStudentId(users[0].id || users[0].uid); }, [users.length]);
  const student = users.find((u) => (u.id || u.uid) === studentId);
  const results = examResults.filter((r) => r.studentId === studentId);
  const views = videoViews.filter((v) => v.userId === studentId || v.studentId === studentId);
  const subs = assignmentSubmissions.filter((s) => s.userId === studentId || s.studentId === studentId);
  const avg = results.filter((r)=>r.status==='completed').length ? Math.round(results.filter((r)=>r.status==='completed').reduce((s,r)=>s+resultPercent(r, exams.find((e)=>e.id===r.examId)),0)/results.filter((r)=>r.status==='completed').length) : 0;
  const weak = buildWeaknessMap({ exams, examResults: results, mistakes: mistakes.filter((m)=>m.userId===studentId || m.studentId===studentId) }).slice(0,5);
  const exportReport = () => downloadText(`student-report-${student?.name || studentId}.txt`, `تقرير الطالب\nالاسم: ${student?.name || student?.email}\nالمتوسط: ${avg}%\nالامتحانات: ${results.length}\nالفيديوهات: ${views.length}\nالواجبات: ${subs.length}\nنقاط الضعف:\n${weak.map((w)=>`- ${w.branch} / ${w.topic}: ${w.average}%`).join('\n')}`);
  return <div className="space-y-6" dir="rtl"><PageHeader title="تقرير الطالب الاحترافي" description="صفحة متابعة حقيقية لكل طالب تجمع الامتحانات، المشاهدة، الواجبات، ونقاط الضعف مع تصدير تقرير." icon={<BarChart3 className="text-indigo-600"/>}/>
    <select className="bg-white border rounded-2xl p-3 font-black w-full max-w-lg" value={studentId} onChange={(e)=>setStudentId(e.target.value)}>{users.map((u)=><option key={u.id || u.uid} value={u.id || u.uid}>{u.name || u.email}</option>)}</select>
    {student ? <><div className="grid md:grid-cols-4 gap-4"><StatCard title="متوسط النتائج" value={`${avg}%`} tone={avg>=70?'emerald':avg>=50?'amber':'red'}/><StatCard title="عدد الامتحانات" value={results.length} tone="blue"/><StatCard title="مشاهدات الفيديو" value={views.length} tone="slate"/><StatCard title="تسليمات الواجب" value={subs.length} tone="emerald"/></div>
    <div className="grid lg:grid-cols-2 gap-5"><div className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-3">نقاط الضعف</h3>{weak.map((w)=><div key={`${w.branch}-${w.topic}`} className="border rounded-2xl p-3 mb-2"><p className="font-black">{w.branch} / {w.topic}</p><div className="h-2 bg-slate-100 rounded-full mt-2"><div className="h-2 bg-red-500 rounded-full" style={{width:`${100-w.average}%`}}/></div><p className="text-xs text-slate-500 mt-1">دقة الطالب: {w.average}%</p></div>)}{!weak.length && <EmptyState title="لا توجد نقاط ضعف كافية" icon="🎯"/>}</div><div className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-3">آخر النتائج</h3>{results.slice(0,8).map((r)=><div key={r.id} className="flex justify-between border-b py-2"><span className="font-bold">{exams.find((e)=>e.id===r.examId)?.title || r.examTitle || 'امتحان'}</span><span className="font-black">{resultPercent(r, exams.find((e)=>e.id===r.examId))}%</span></div>)}</div></div>
    <button onClick={exportReport} className="bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black flex gap-2"><Download/> تصدير تقرير</button></> : <EmptyState title="اختر طالبًا" icon="👤"/>}
  </div>;
}
