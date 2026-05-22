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

export function ExamPreStartPanel({ exam, results = [], previousExam, previousPercent, onStart, onClose }) {
  if (!exam) return null;
  const questionCount = flattenExamQuestions(exam).length;
  const attempts = results.filter((r)=>r.examId===exam.id);
  return <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" dir="rtl"><div className="bg-white rounded-[2rem] max-w-2xl w-full p-6 shadow-2xl space-y-4"><div className="flex justify-between gap-4"><div><p className="text-xs font-black text-amber-600">صفحة ما قبل الامتحان</p><h2 className="text-2xl font-black">{exam.title}</h2></div><button onClick={onClose} className="bg-slate-100 rounded-full px-3 font-black">×</button></div><div className="grid md:grid-cols-3 gap-3"><StatCard title="المدة" value={`${exam.duration} د`} tone="blue"/><StatCard title="عدد الأسئلة" value={questionCount} tone="amber"/><StatCard title="محاولاتك السابقة" value={attempts.length} tone="slate"/></div>{exam.accessRule?.enabled && <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-blue-800 font-bold flex gap-2"><Lock/> شرط الدخول: اجتياز {previousExam?.title || 'الامتحان السابق'} بنسبة {exam.accessRule.requiredPercentage}% — درجتك الحالية: {previousPercent ?? 'لا توجد'}%</div>}<div className="bg-slate-50 rounded-2xl p-4"><p className="font-black mb-2">قبل البداية:</p><ul className="list-disc pr-5 text-sm font-bold text-slate-600 space-y-1"><li>تأكد من ثبات الإنترنت.</li><li>لا تغلق الصفحة أثناء الامتحان.</li><li>اقرأ السؤال جيدًا قبل اختيار الإجابة.</li></ul></div><button onClick={onStart} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2"><PlayCircle/> ابدأ الآن</button></div></div>;
}
