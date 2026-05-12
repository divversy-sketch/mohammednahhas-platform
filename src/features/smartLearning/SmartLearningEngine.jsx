import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { BarChart3, ClipboardList, CreditCard, Download, Lock, MessageSquare, PlayCircle, Save, Send, Shield, Sparkles, Target, Users, Wand2 } from '../../shared/icons/lucide-shim.jsx';
import { GradeOptions, getGradeLabel } from '../../shared/constants/grades.jsx';
import { platformNotify } from '../../shared/core/platformShared.jsx';
import PageHeader from '../../shared/ui/PageHeader.jsx';
import EmptyState from '../../shared/ui/EmptyState.jsx';

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

export function buildWeaknessMap({ exams = [], examResults = [], mistakes = [] }) {
  const examById = new Map(exams.map((e) => [e.id, e]));
  const buckets = {};
  const ensure = (branch, topic) => {
    const key = `${branch || 'عام'}__${topic || 'عام'}`;
    buckets[key] = buckets[key] || { branch: branch || 'عام', topic: topic || 'عام', attempts: 0, correct: 0, total: 0, mistakes: 0, average: 0 };
    return buckets[key];
  };
  examResults.filter((r) => r.status === 'completed').forEach((r) => {
    const exam = examById.get(r.examId);
    const questions = flattenExamQuestions(exam);
    const answers = r.answers || {};
    if (!questions.length) {
      const b = ensure(r.branch || 'امتحانات', r.examTitle || exam?.title || 'عام');
      b.attempts += 1;
      b.total += 100;
      b.correct += resultPercent(r, exam);
      return;
    }
    questions.forEach((q, index) => {
      const branch = branchOf(q);
      const topic = topicOf(q);
      const b = ensure(branch, topic);
      b.attempts += 1;
      b.total += 1;
      const answer = answers[q.id] ?? answers[index] ?? answers[String(index)];
      const isRight = answer !== undefined && Number(answer) === Number(q.correctIdx ?? q.answerIndex ?? q.correctAnswerIndex ?? -999);
      if (isRight) b.correct += 1;
      else b.mistakes += 1;
    });
  });
  mistakes.forEach((m) => {
    const b = ensure(branchOf(m.question || m), topicOf(m.question || m));
    b.mistakes += 1;
    b.total += 1;
  });
  return Object.values(buckets).map((b) => ({ ...b, average: b.total ? Math.round((b.correct / b.total) * 100) : 0 })).sort((a, b) => (b.mistakes - a.mistakes) || (a.average - b.average));
}

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
      <div className="bg-white rounded-3xl border p-4 space-y-2">{groups.map((g)=> <button key={g.id} onClick={()=>setSelectedGroup(g.id)} className={`w-full text-right p-3 rounded-2xl font-black ${group?.id===g.id?'bg-blue-50 text-blue-700':'bg-slate-50'}`}>{g.name}<span className="block text-xs text-slate-500">{(g.members||[]).length} طالب</span></button>)}{!groups.length && <EmptyState title="لا توجد مجموعات" icon="👥"/>}</div>
      <div className="lg:col-span-2 bg-white rounded-3xl border p-4"><h3 className="font-black mb-3">طلاب المجموعة: {group?.name || '—'}</h3><div className="grid md:grid-cols-2 gap-2 max-h-[520px] overflow-auto">{users.map((u)=>{ const id = u.id || u.uid; const active = (group?.members || []).includes(id); return <button key={id} disabled={!group} onClick={()=>toggleMember(group,u)} className={`text-right border rounded-2xl p-3 ${active?'bg-emerald-50 border-emerald-200':'bg-slate-50'}`}><p className="font-black">{u.name || u.displayName || u.email}</p><p className="text-xs text-slate-500">{u.email}</p><p className={`text-xs font-black ${active?'text-emerald-700':'text-slate-400'}`}>{active?'داخل المجموعة':'اضغط للإضافة'}</p></button>})}</div></div>
    </div>
  </div>;
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

export function AdminVideoSecurityPanel() {
  const [settings, setSettings] = useState({ watermark: true, blockSeek: true, maxDevices: 1, requireWatchPercent: 75 });
  useEffect(() => onSnapshot(doc(db, 'platform_settings', 'video_security'), (snap) => snap.exists() && setSettings((s)=>({...s,...snap.data()})), () => {}), []);
  const save = async () => { await setDoc(doc(db, 'platform_settings', 'video_security'), { ...settings, updatedAt: serverTimestamp() }, { merge: true }); platformNotify('تم حفظ حماية الفيديوهات'); };
  return <div className="space-y-6" dir="rtl"><PageHeader title="حماية الفيديوهات" description="إعدادات حقيقية تتحكم في سياسات المشاهدة، وتتكامل مع المشغل الحالي وعلامة الطالب المائية." icon={<Shield className="text-red-600"/>}/><div className="bg-white rounded-3xl border p-5 grid md:grid-cols-2 gap-4"><label className="bg-slate-50 rounded-2xl p-4 font-black flex gap-2"><input type="checkbox" checked={settings.watermark} onChange={(e)=>setSettings({...settings, watermark:e.target.checked})}/> علامة مائية باسم الطالب</label><label className="bg-slate-50 rounded-2xl p-4 font-black flex gap-2"><input type="checkbox" checked={settings.blockSeek} onChange={(e)=>setSettings({...settings, blockSeek:e.target.checked})}/> منع التقديم السريع داخل كورسات YouTube</label><div><label className="font-black text-sm">نسبة فتح امتحان الفيديو</label><input type="number" className="border rounded-xl p-3 w-full" value={settings.requireWatchPercent} onChange={(e)=>setSettings({...settings, requireWatchPercent:e.target.value})}/></div><div><label className="font-black text-sm">عدد الأجهزة المسموح</label><input type="number" className="border rounded-xl p-3 w-full" value={settings.maxDevices} onChange={(e)=>setSettings({...settings, maxDevices:e.target.value})}/></div><button onClick={save} className="bg-red-700 text-white px-6 py-3 rounded-2xl font-black flex gap-2 w-fit"><Save/> حفظ الإعدادات</button></div></div>;
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

export function StudentRemediationCenter({ user, exams = [], examResults = [], mistakes = [], content = [], onStartMistakesExam, setActiveTab }) {
  const weak = buildWeaknessMap({ exams, examResults, mistakes }).slice(0, 6);
  const recommended = weak.flatMap((w) => content.filter((c) => `${c.title || ''} ${c.branch || ''} ${c.topic || ''}`.includes(w.topic) || `${c.title || ''}`.includes(w.branch)).slice(0, 2));
  return <div className="space-y-6" dir="rtl"><PageHeader title="العلاج الذكي" description="المنصة تحلل أخطاءك ونتائجك وتقترح دروسًا وتدريبات مناسبة بدل ما تسيبك تايه في المنهج." icon={<Target className="text-red-600"/>}/><div className="grid md:grid-cols-3 gap-4"><StatCard title="نقاط ضعف مكتشفة" value={weak.length} tone="red"/><StatCard title="أسئلة في بنك الأخطاء" value={mistakes.length} tone="amber"/><StatCard title="توصيات مراجعة" value={recommended.length} tone="emerald"/></div><div className="grid lg:grid-cols-2 gap-5"><section className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-3">أولويات المراجعة</h3>{weak.map((w)=><div key={`${w.branch}-${w.topic}`} className="border rounded-2xl p-3 mb-2"><p className="font-black">{w.branch} / {w.topic}</p><p className="text-sm text-slate-500">الدقة الحالية: {w.average}% • أخطاء: {w.mistakes}</p></div>)}{!weak.length && <EmptyState title="لا توجد بيانات كافية بعد" icon="🎯"/>}</section><section className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-3">دروس مقترحة</h3>{recommended.map((c)=><button key={c.id} onClick={()=>setActiveTab?.('videos')} className="w-full text-right border rounded-2xl p-3 mb-2 hover:bg-slate-50"><p className="font-black">{c.title}</p><p className="text-xs text-slate-500">{c.type || 'محتوى'} • {c.branch || 'عام'}</p></button>)}{!recommended.length && <p className="text-slate-500 font-bold">بعد ظهور نتائج أكثر، هنرشح لك دروسًا أدق.</p>}</section></div><button onClick={onStartMistakesExam} className="bg-red-700 text-white px-6 py-3 rounded-2xl font-black flex gap-2"><ClipboardList/> ابدأ تدريب بنك الأخطاء</button></div>;
}

export function ExamPreStartPanel({ exam, results = [], previousExam, previousPercent, onStart, onClose }) {
  if (!exam) return null;
  const questionCount = flattenExamQuestions(exam).length;
  const attempts = results.filter((r)=>r.examId===exam.id);
  return <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" dir="rtl"><div className="bg-white rounded-[2rem] max-w-2xl w-full p-6 shadow-2xl space-y-4"><div className="flex justify-between gap-4"><div><p className="text-xs font-black text-amber-600">صفحة ما قبل الامتحان</p><h2 className="text-2xl font-black">{exam.title}</h2></div><button onClick={onClose} className="bg-slate-100 rounded-full px-3 font-black">×</button></div><div className="grid md:grid-cols-3 gap-3"><StatCard title="المدة" value={`${exam.duration} د`} tone="blue"/><StatCard title="عدد الأسئلة" value={questionCount} tone="amber"/><StatCard title="محاولاتك السابقة" value={attempts.length} tone="slate"/></div>{exam.accessRule?.enabled && <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-blue-800 font-bold flex gap-2"><Lock/> شرط الدخول: اجتياز {previousExam?.title || 'الامتحان السابق'} بنسبة {exam.accessRule.requiredPercentage}% — درجتك الحالية: {previousPercent ?? 'لا توجد'}%</div>}<div className="bg-slate-50 rounded-2xl p-4"><p className="font-black mb-2">قبل البداية:</p><ul className="list-disc pr-5 text-sm font-bold text-slate-600 space-y-1"><li>تأكد من ثبات الإنترنت.</li><li>لا تغلق الصفحة أثناء الامتحان.</li><li>اقرأ السؤال جيدًا قبل اختيار الإجابة.</li></ul></div><button onClick={onStart} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2"><PlayCircle/> ابدأ الآن</button></div></div>;
}
