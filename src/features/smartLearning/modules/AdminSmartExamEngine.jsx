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

export function AdminSmartExamEngine({ adminGradeFilter = 'all', exams = [], examResults = [], userData }) {
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState({ grade: adminGradeFilter === 'all' ? '3sec' : adminGradeFilter, branch: '', topics: '', difficulty: '', count: 20, duration: 40, title: '', mode: 'filters', shuffleOptions: true, publishDays: 7, accessCode: '' });
  useEffect(() => onSnapshot(query(collection(db, 'question_bank'), orderBy('createdAt', 'desc'), limit(300)), (snap) => setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setQuestions([])), []);
  const weaknessMap = useMemo(() => buildWeaknessMap({ exams, examResults }), [exams, examResults]);
  const topics = useMemo(() => Array.from(new Set(questions.map(topicOf))).filter(Boolean).sort(), [questions]);
  const selectedTopics = form.topics.split(',').map(clean).filter(Boolean);
  const pool = questions.filter((q) => {
    if (form.grade && q.grade !== form.grade) return false;
    if (form.branch && branchOf(q) !== form.branch) return false;
    if (form.difficulty && q.difficulty !== form.difficulty) return false;
    if (selectedTopics.length && !selectedTopics.some((t) => topicOf(q).includes(t))) return false;
    return true;
  });
  const recommendedTopics = weaknessMap.slice(0, 6).map((w) => w.topic);
  const generatedPreview = useMemo(() => {
    const base = form.mode === 'weakness' && recommendedTopics.length
      ? pool.filter((q) => recommendedTopics.includes(topicOf(q)))
      : pool;
    return pickRandom(base.length ? base : pool, Math.min(Number(form.count) || 20, base.length || pool.length));
  }, [pool, form.mode, form.count, recommendedTopics.join('|')]);

  const createSmartExam = async () => {
    if (!generatedPreview.length) return platformNotify('لا توجد أسئلة مطابقة للاختيارات الحالية');
    const grouped = {};
    generatedPreview.forEach((q) => {
      const branch = branchOf(q);
      grouped[branch] = grouped[branch] || { text: branch, subQuestions: [] };
      const options = Array.isArray(q.options) ? [...q.options] : [];
      let correctIdx = Number(q.correctIdx ?? q.correctAnswerIndex ?? 0);
      if (form.shuffleOptions && options.length > 1) {
        const oldCorrect = options[correctIdx];
        options.sort(() => Math.random() - 0.5);
        correctIdx = Math.max(0, options.findIndex((x) => x === oldCorrect));
      }
      grouped[branch].subQuestions.push({
        id: `qb_${q.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        text: q.text,
        options,
        correctIdx,
        branch,
        topic: topicOf(q),
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation || '',
        modelAnswer: q.modelAnswer || '',
        maxScore: questionScore(q),
        sourceQuestionId: q.id,
      });
    });
    const now = new Date();
    const end = new Date(Date.now() + Number(form.publishDays || 7) * 86400000);
    await addDoc(collection(db, 'exams'), {
      title: clean(form.title) || `امتحان ذكي - ${form.branch || 'شامل'} - ${getGradeLabel(form.grade)}`,
      grade: form.grade,
      duration: Number(form.duration) || Math.max(15, generatedPreview.length * 2),
      startTime: now.toISOString().slice(0, 16),
      endTime: end.toISOString().slice(0, 16),
      accessCode: clean(form.accessCode) || Math.random().toString(36).slice(2, 7).toUpperCase(),
      isPremium: false,
      questions: Object.values(grouped),
      source: 'smart_learning_engine',
      smartExamConfig: form,
      createdBy: userData?.uid || userData?.id || userData?.email || 'admin',
      createdAt: serverTimestamp(),
    });
    platformNotify(`تم إنشاء امتحان ذكي من ${generatedPreview.length} سؤال`);
  };

  return <div className="space-y-6" dir="rtl">
    <PageHeader title="محرك الامتحانات الذكي" description="إنشاء امتحانات حقيقية من بنك الأسئلة مع اختيار النحو/البلاغة والموضوعات والصعوبة أو بناء امتحان علاجي من نقاط ضعف الطلاب." icon={<Wand2 className="text-purple-600"/>} />
    <div className="grid lg:grid-cols-3 gap-4">
      <StatCard title="أسئلة بنك الأسئلة" value={questions.length} tone="blue" />
      <StatCard title="أسئلة مطابقة للفلتر" value={pool.length} tone="amber" />
      <StatCard title="أسئلة ستدخل الامتحان" value={generatedPreview.length} tone="emerald" />
    </div>
    <section className="bg-white rounded-3xl border p-5 space-y-4">
      <div className="grid md:grid-cols-4 gap-3">
        <select className="border rounded-xl p-3 font-bold" value={form.grade} onChange={(e)=>setForm({...form, grade:e.target.value})}><GradeOptions/></select>
        <select className="border rounded-xl p-3 font-bold" value={form.branch} onChange={(e)=>setForm({...form, branch:e.target.value})}><option value="">كل الفروع</option><option>النحو</option><option>البلاغة</option><option>الأدب</option><option>القصة</option></select>
        <select className="border rounded-xl p-3 font-bold" value={form.difficulty} onChange={(e)=>setForm({...form, difficulty:e.target.value})}><option value="">كل الصعوبات</option><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select>
        <select className="border rounded-xl p-3 font-bold" value={form.mode} onChange={(e)=>setForm({...form, mode:e.target.value})}><option value="filters">حسب الفلاتر</option><option value="weakness">علاجي حسب نقاط الضعف</option></select>
      </div>
      <div className="grid md:grid-cols-4 gap-3">
        <input className="border rounded-xl p-3 font-bold md:col-span-2" placeholder="الموضوعات مفصولة بفاصلة: المنادى، التشبيه" value={form.topics} onChange={(e)=>setForm({...form, topics:e.target.value})}/>
        <input type="number" className="border rounded-xl p-3 font-bold" placeholder="عدد الأسئلة" value={form.count} onChange={(e)=>setForm({...form, count:e.target.value})}/>
        <input type="number" className="border rounded-xl p-3 font-bold" placeholder="مدة الامتحان" value={form.duration} onChange={(e)=>setForm({...form, duration:e.target.value})}/>
      </div>
      <div className="grid md:grid-cols-4 gap-3">
        <input className="border rounded-xl p-3 font-bold md:col-span-2" placeholder="عنوان الامتحان" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})}/>
        <input className="border rounded-xl p-3 font-bold" placeholder="كود الامتحان اختياري" value={form.accessCode} onChange={(e)=>setForm({...form, accessCode:e.target.value.toUpperCase()})}/>
        <label className="bg-slate-50 border rounded-xl p-3 font-bold flex items-center gap-2"><input type="checkbox" checked={form.shuffleOptions} onChange={(e)=>setForm({...form, shuffleOptions:e.target.checked})}/> خلط الاختيارات</label>
      </div>
      {form.mode === 'weakness' && <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-800 font-bold text-sm">أقوى نقاط ضعف حالية: {recommendedTopics.length ? recommendedTopics.join('، ') : 'لا توجد بيانات نتائج كافية بعد'}</div>}
      <div className="flex gap-2 flex-wrap">{topics.slice(0, 20).map((t) => <button key={t} onClick={()=>setForm({...form, topics: form.topics ? `${form.topics}, ${t}` : t})} className="bg-slate-100 hover:bg-amber-100 px-3 py-1 rounded-full text-xs font-black">{t}</button>)}</div>
      <button onClick={createSmartExam} className="bg-purple-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2"><Sparkles/> إنشاء الامتحان الآن</button>
    </section>
    <section className="bg-white rounded-3xl border p-5">
      <h3 className="font-black text-lg mb-3">معاينة الأسئلة المختارة</h3>
      <div className="space-y-2 max-h-96 overflow-auto">{generatedPreview.map((q, i) => <div key={q.id} className="border rounded-2xl p-3"><p className="font-black">{i+1}. {q.text}</p><p className="text-xs text-slate-500 mt-1">{branchOf(q)} / {topicOf(q)} / {q.difficulty || 'medium'}</p></div>)}</div>
    </section>
  </div>;
}
