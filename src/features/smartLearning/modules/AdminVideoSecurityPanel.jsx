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

export function AdminVideoSecurityPanel() {
  const [settings, setSettings] = useState({ watermark: true, blockSeek: true, maxDevices: 1, requireWatchPercent: 75 });
  useEffect(() => onSnapshot(doc(db, 'platform_settings', 'video_security'), (snap) => snap.exists() && setSettings((s)=>({...s,...snap.data()})), () => {}), []);
  const save = async () => { await setDoc(doc(db, 'platform_settings', 'video_security'), { ...settings, updatedAt: serverTimestamp() }, { merge: true }); platformNotify('تم حفظ حماية الفيديوهات'); };
  return <div className="space-y-6" dir="rtl"><PageHeader title="حماية الفيديوهات" description="إعدادات حقيقية تتحكم في سياسات المشاهدة، وتتكامل مع المشغل الحالي وعلامة الطالب المائية." icon={<Shield className="text-red-600"/>}/><div className="bg-white rounded-3xl border p-5 grid md:grid-cols-2 gap-4"><label className="bg-slate-50 rounded-2xl p-4 font-black flex gap-2"><input type="checkbox" checked={settings.watermark} onChange={(e)=>setSettings({...settings, watermark:e.target.checked})}/> علامة مائية باسم الطالب</label><label className="bg-slate-50 rounded-2xl p-4 font-black flex gap-2"><input type="checkbox" checked={settings.blockSeek} onChange={(e)=>setSettings({...settings, blockSeek:e.target.checked})}/> منع التقديم السريع داخل كورسات YouTube</label><div><label className="font-black text-sm">نسبة فتح امتحان الفيديو</label><input type="number" className="border rounded-xl p-3 w-full" value={settings.requireWatchPercent} onChange={(e)=>setSettings({...settings, requireWatchPercent:e.target.value})}/></div><div><label className="font-black text-sm">عدد الأجهزة المسموح</label><input type="number" className="border rounded-xl p-3 w-full" value={settings.maxDevices} onChange={(e)=>setSettings({...settings, maxDevices:e.target.value})}/></div><button onClick={save} className="bg-red-700 text-white px-6 py-3 rounded-2xl font-black flex gap-2 w-fit"><Save/> حفظ الإعدادات</button></div></div>;
}
