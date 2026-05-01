import React, { useEffect, useState } from 'react';
import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { BookOpen, BrainCircuit, CheckCircle, ClipboardList, Loader2, PlusCircle, Search, Sparkles, UploadCloud, XCircle } from '../../shared/icons/lucide-shim.jsx';

const GRADES = [
  ['all', 'كل الصفوف'], ['1prep', 'الصف الأول الإعدادي'], ['2prep', 'الصف الثاني الإعدادي'], ['3prep', 'الصف الثالث الإعدادي'],
  ['1sec', 'الصف الأول الثانوي'], ['2sec', 'الصف الثاني الثانوي'], ['3sec', 'الصف الثالث الثانوي']
];
const BRANCHES = ['عام', 'نحو', 'بلاغة', 'قراءة', 'نصوص', 'أدب', 'تعبير', 'قصة'];

const normalizeArabic = (value = '') => String(value || '')
  .toLowerCase()
  .replace(/[إأآا]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه')
  .replace(/[ًٌٍَُِّْـ]/g, '')
  .replace(/[،؛؟!,.()[\]{}"'`~@#$%^&*_+=|\\/:<>-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const tokenize = (value = '') => normalizeArabic(value).split(' ').map((w) => w.trim()).filter((w) => w.length > 2);
const parseKeywords = (value = '') => Array.isArray(value) ? value : String(value || '').split(/[،,\n]/g).map((k) => k.trim()).filter(Boolean);
const gradeMatches = (itemGrade, userGrade) => !itemGrade || itemGrade === 'all' || !userGrade || itemGrade === userGrade;

const scoreExplanation = (item, question, userGrade) => {
  if (!gradeMatches(item.grade, userGrade)) return -1;
  const qNorm = normalizeArabic(question);
  const words = tokenize(question);
  const haystack = normalizeArabic([item.title, item.lesson, item.branch, parseKeywords(item.keywords).join(' '), item.content].join(' '));
  let score = 0;
  if (item.grade === userGrade) score += 4;
  if (item.lesson && qNorm.includes(normalizeArabic(item.lesson))) score += 8;
  if (item.branch && qNorm.includes(normalizeArabic(item.branch))) score += 5;
  parseKeywords(item.keywords).forEach((kw) => { const n = normalizeArabic(kw); if (n && qNorm.includes(n)) score += 7; });
  words.forEach((w) => { if (haystack.includes(w)) score += 1; });
  return score;
};

const getAnswerFromContent = (content = '', question = '') => {
  const clean = String(content || '').trim();
  if (!clean) return '';
  const chunks = clean.split(/\n{2,}|(?<=[.!؟])\s+/g).map((c) => c.trim()).filter((c) => c.length > 30);
  if (chunks.length === 0) return clean.slice(0, 1400);
  const words = tokenize(question);
  const ranked = chunks.map((chunk) => {
    const n = normalizeArabic(chunk);
    return { chunk, score: words.reduce((sum, w) => sum + (n.includes(w) ? 1 : 0), 0) };
  }).sort((a, b) => b.score - a.score);
  const best = ranked.filter((r) => r.score > 0).slice(0, 3).map((r) => r.chunk);
  return (best.length ? best : chunks.slice(0, 2)).join('\n\n').slice(0, 1600);
};

const parseCsvLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i += 1; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim()); current = '';
    } else current += ch;
  }
  result.push(current.trim());
  return result;
};

const parseQuestionCsv = (csvText = '') => {
  const lines = String(csvText || '').split(/\r?\n/g).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => normalizeArabic(h));
  const get = (row, names) => {
    for (const name of names) { const idx = headers.indexOf(normalizeArabic(name)); if (idx >= 0) return row[idx] || ''; }
    return '';
  };
  return lines.slice(1).map((line) => {
    const row = parseCsvLine(line);
    const correctRaw = get(row, ['correctAnswer', 'correct', 'answer', 'الإجابة', 'الاجابة', 'correctIdx']);
    const options = [
      get(row, ['optionA', 'a', 'أ', 'ا', 'اختيار ا', 'الاختيار الاول']),
      get(row, ['optionB', 'b', 'ب', 'اختيار ب', 'الاختيار الثاني']),
      get(row, ['optionC', 'c', 'ج', 'اختيار ج', 'الاختيار الثالث']),
      get(row, ['optionD', 'd', 'د', 'اختيار د', 'الاختيار الرابع'])
    ].filter(Boolean);
    const c = normalizeArabic(correctRaw);
    const correctIdx = ['0', '1', '2', '3'].includes(correctRaw) ? Number(correctRaw) :
      ['a', 'ا'].includes(c) ? 0 : ['b', 'ب'].includes(c) ? 1 : ['c', 'ج'].includes(c) ? 2 : ['d', 'د'].includes(c) ? 3 :
      Math.max(0, options.findIndex((o) => normalizeArabic(o) === c));
    return {
      grade: get(row, ['grade', 'الصف']) || 'all',
      lesson: get(row, ['lesson', 'الدرس']),
      branch: get(row, ['branch', 'الفرع']) || 'عام',
      question: get(row, ['question', 'السؤال']),
      options,
      correctIdx: correctIdx < 0 ? 0 : correctIdx,
      explanation: get(row, ['explanation', 'شرح', 'الشرح']),
      difficulty: get(row, ['difficulty', 'الصعوبة']) || 'medium',
      tags: parseKeywords(get(row, ['tags', 'keywords', 'كلمات مفتاحية']))
    };
  }).filter((q) => q.question && q.options.length >= 2);
};

const RafiqHeader = ({ compact = false }) => (
  <div className={`bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white rounded-[2rem] ${compact ? 'p-5' : 'p-7'} shadow-xl border border-amber-500/20 overflow-hidden relative`}>
    <div className="absolute -left-16 -top-16 w-44 h-44 bg-amber-400/20 blur-3xl rounded-full" />
    <div className="relative z-10 flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg"><BrainCircuit size={28}/></div>
      <div>
        <p className="text-amber-200 font-black text-sm">من شرح المستر فقط</p>
        <h2 className="text-2xl md:text-3xl font-black">رفيقك في العربي</h2>
        <p className="text-slate-300 text-sm mt-1">اسأل في شرح الدرس، ولو المعلومة موجودة في مكتبة المستر هيرد عليك ويختبرك عليها.</p>
      </div>
    </div>
  </div>
);

export const AdminRafiqPanel = ({ adminGradeFilter = 'all' }) => {
  const [form, setForm] = useState({ grade: adminGradeFilter || 'all', branch: 'عام', lesson: '', title: '', keywords: '', content: '' });
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ explanations: 0, questions: 0 });

  useEffect(() => {
    let active = true;
    Promise.all([
      getDocs(query(collection(db, 'lesson_explanations'), limit(500))),
      getDocs(query(collection(db, 'rafiq_question_bank'), limit(500)))
    ]).then(([exSnap, qSnap]) => { if (active) setStats({ explanations: exSnap.size, questions: qSnap.size }); }).catch(() => {});
    return () => { active = false; };
  }, [message]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const saveExplanation = async () => {
    if (!form.title.trim() || !form.content.trim()) return alert('اكتب عنوان الشرح ومحتوى الشرح أولًا.');
    setLoading(true);
    try {
      await addDoc(collection(db, 'lesson_explanations'), { ...form, keywords: parseKeywords(form.keywords), searchableText: normalizeArabic([form.title, form.lesson, form.branch, form.keywords, form.content].join(' ')), createdAt: serverTimestamp(), source: 'admin' });
      setForm((prev) => ({ ...prev, title: '', lesson: '', keywords: '', content: '' }));
      setMessage('تم حفظ شرح المستر بنجاح.');
    } catch (error) { alert('تعذر حفظ الشرح: ' + (error?.message || error)); }
    finally { setLoading(false); }
  };

  const uploadQuestions = async () => {
    const rows = parseQuestionCsv(csvText);
    if (rows.length === 0) return alert('لم يتم العثور على أسئلة صالحة. تأكد من تنسيق CSV.');
    setLoading(true);
    try {
      let batch = writeBatch(db);
      let counter = 0;
      for (const row of rows) {
        const ref = doc(collection(db, 'rafiq_question_bank'));
        batch.set(ref, { ...row, searchableText: normalizeArabic([row.question, row.lesson, row.branch, row.explanation, (row.tags || []).join(' ')].join(' ')), createdAt: serverTimestamp(), source: 'csv' });
        counter += 1;
        if (counter % 400 === 0) { await batch.commit(); batch = writeBatch(db); }
      }
      await batch.commit();
      setCsvText('');
      setMessage(`تم رفع ${rows.length} سؤال إلى بنك رفيقك في العربي.`);
    } catch (error) { alert('تعذر رفع الأسئلة: ' + (error?.message || error)); }
    finally { setLoading(false); }
  };

  return <div className="space-y-6">
    <RafiqHeader />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm"><p className="text-sm text-slate-500 font-bold">شروحات محفوظة</p><p className="text-4xl font-black text-amber-700 mt-2">{stats.explanations}</p></div>
      <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-sm"><p className="text-sm text-slate-500 font-bold">أسئلة تدريبية</p><p className="text-4xl font-black text-blue-700 mt-2">{stats.questions}</p></div>
      <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100 shadow-sm"><p className="text-sm text-emerald-700 font-black">المرحلة الأولى</p><p className="text-sm text-emerald-800 mt-2 leading-relaxed">الرد من شرح المستر فقط + رفع أسئلة CSV + اختبار سريع من الأسئلة المرفوعة.</p></div>
    </div>
    {message && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 font-black flex items-center gap-2"><CheckCircle/> {message}</div>}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2"><BookOpen className="text-amber-600"/> إضافة شرح من المستر</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <select value={form.grade} onChange={(e) => update('grade', e.target.value)} className="border rounded-2xl p-3 font-bold bg-white">{GRADES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select>
          <select value={form.branch} onChange={(e) => update('branch', e.target.value)} className="border rounded-2xl p-3 font-bold bg-white">{BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}</select>
          <input value={form.lesson} onChange={(e) => update('lesson', e.target.value)} className="border rounded-2xl p-3 font-bold" placeholder="اسم الدرس" />
          <input value={form.title} onChange={(e) => update('title', e.target.value)} className="border rounded-2xl p-3 font-bold" placeholder="عنوان الشرح" />
        </div>
        <input value={form.keywords} onChange={(e) => update('keywords', e.target.value)} className="border rounded-2xl p-3 font-bold w-full mb-3" placeholder="كلمات مفتاحية مفصولة بفواصل: نعت، منعوت، إعراب" />
        <textarea value={form.content} onChange={(e) => update('content', e.target.value)} className="border rounded-2xl p-4 w-full min-h-[260px] leading-loose" placeholder="اكتب شرح المستر هنا بالتفصيل..." />
        <button disabled={loading} onClick={saveExplanation} className="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 disabled:opacity-60">{loading ? <Loader2 className="animate-spin"/> : <PlusCircle/>} حفظ الشرح</button>
      </div>
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2"><ClipboardList className="text-blue-600"/> رفع أسئلة كثيرة مرة واحدة CSV</h3>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed mb-3" dir="ltr">grade,lesson,branch,question,optionA,optionB,optionC,optionD,correctAnswer,explanation,difficulty,tags<br/>1sec,النعت,نحو,"حدد النعت في الجملة","الطالب","المجتهد","في","الفصل",B,"النعت يصف المنعوت",easy,"نعت,منعوت"</div>
        <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} className="border rounded-2xl p-4 w-full min-h-[320px] font-mono text-sm" placeholder="الصق ملف CSV هنا أو انسخ من Excel..." dir="ltr" />
        <div className="flex flex-col md:flex-row gap-3 mt-4"><button disabled={loading} onClick={uploadQuestions} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 disabled:opacity-60">{loading ? <Loader2 className="animate-spin"/> : <UploadCloud/>} رفع الأسئلة</button><button onClick={() => setCsvText('grade,lesson,branch,question,optionA,optionB,optionC,optionD,correctAnswer,explanation,difficulty,tags\n')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-black">قالب فارغ</button></div>
      </div>
    </div>
  </div>;
};

export const StudentRafiqAssistant = ({ user, userData }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [explanations, setExplanations] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState([]);
  const [selected, setSelected] = useState({});

  useEffect(() => {
    let active = true;
    Promise.all([
      getDocs(query(collection(db, 'lesson_explanations'), orderBy('createdAt', 'desc'), limit(600))),
      getDocs(query(collection(db, 'rafiq_question_bank'), orderBy('createdAt', 'desc'), limit(1200)))
    ]).then(([exSnap, qSnap]) => {
      if (!active) return;
      setExplanations(exSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setQuestions(qSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }).catch((error) => console.warn('Rafiq load failed:', error?.message || error)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const ask = async () => {
    if (!question.trim()) return;
    setQuiz([]); setSelected({});
    const userGrade = userData?.grade || 'all';
    const ranked = explanations.map((item) => ({ item, score: scoreExplanation(item, question, userGrade) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
    if (ranked.length === 0) {
      setAnswer({ missing: true, title: 'النقطة غير موجودة حاليًا', text: 'النقطة دي مش موجودة في شرح المستر المتاح حاليًا. تم تسجيلها كموضوع يحتاج إضافة شرح لاحقًا.', lesson: '' });
      try { await addDoc(collection(db, 'rafiq_unanswered_questions'), { studentId: user?.uid || '', studentName: userData?.name || user?.displayName || '', grade: userGrade, question, createdAt: serverTimestamp() }); } catch {}
      return;
    }
    const best = ranked[0].item;
    setAnswer({ missing: false, title: best.title || best.lesson || 'شرح المستر', lesson: best.lesson || '', branch: best.branch || 'عام', text: getAnswerFromContent(best.content, question), source: 'من مكتبة شرح المستر' });
  };

  const generateQuiz = () => {
    if (!answer || answer.missing) return;
    const lesson = normalizeArabic(answer.lesson || answer.title || '');
    const qWords = tokenize(question);
    const userGrade = userData?.grade || 'all';
    const ranked = questions.filter((q) => gradeMatches(q.grade, userGrade)).map((q) => {
      const hay = normalizeArabic([q.lesson, q.branch, q.question, q.explanation, (q.tags || []).join(' ')].join(' '));
      let score = 0;
      if (lesson && hay.includes(lesson)) score += 8;
      qWords.forEach((w) => { if (hay.includes(w)) score += 1; });
      return { q, score };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 6).map((x) => x.q);
    if (ranked.length === 0) return alert('لا توجد أسئلة مرتبطة بهذه النقطة حتى الآن. ارفع أسئلة من لوحة الأدمن.');
    setQuiz(ranked); setSelected({});
  };
  const correctCount = quiz.reduce((sum, q) => sum + (selected[q.id] === q.correctIdx ? 1 : 0), 0);

  return <div className="space-y-6 page-soft-enter">
    <RafiqHeader compact />
    <div className="bg-white rounded-3xl p-5 md:p-7 border border-slate-100 shadow-sm"><div className="flex flex-col md:flex-row gap-3"><input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask()} className="flex-1 border-2 border-slate-100 focus:border-amber-400 rounded-2xl p-4 font-bold outline-none" placeholder="اسأل رفيقك: مش فاهم النعت، إزاي أعرب الحال، الفرق بين التشبيه والاستعارة..." /><button onClick={ask} disabled={loading} className="bg-slate-950 hover:bg-slate-900 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 disabled:opacity-60">{loading ? <Loader2 className="animate-spin"/> : <Search/>} اسأل رفيقك</button></div><p className="text-xs text-slate-400 mt-3 font-bold">الردود تعتمد على الشرح الذي رفعه المستر داخل المنصة فقط.</p></div>
    {answer && <div className={`rounded-3xl p-6 border shadow-sm ${answer.missing ? 'bg-amber-50 border-amber-200' : 'bg-white border-emerald-100'}`}><div className="flex items-start justify-between gap-3 mb-4"><div><p className={`text-xs font-black mb-1 ${answer.missing ? 'text-amber-700' : 'text-emerald-700'}`}>{answer.source || 'مطلوب إضافة شرح'}</p><h3 className="text-2xl font-black text-slate-900">{answer.title}</h3>{!answer.missing && <p className="text-sm text-slate-500 mt-1">{answer.branch} {answer.lesson ? `— ${answer.lesson}` : ''}</p>}</div>{answer.missing ? <XCircle className="text-amber-600"/> : <Sparkles className="text-emerald-600"/>}</div><div className="bg-slate-50 rounded-2xl p-5 leading-loose text-slate-800 whitespace-pre-wrap font-bold">{answer.text}</div>{!answer.missing && <button onClick={generateQuiz} className="mt-5 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2"><ClipboardList/> اختبرني على النقطة دي</button>}</div>}
    {quiz.length > 0 && <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm"><div className="flex items-center justify-between gap-3 mb-5"><h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><ClipboardList className="text-amber-600"/> اختبار سريع من أسئلة المستر</h3><span className="bg-slate-900 text-white px-4 py-2 rounded-full font-black text-sm">{correctCount}/{quiz.length}</span></div><div className="space-y-4">{quiz.map((q, idx) => <div key={q.id || idx} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/70"><p className="font-black text-slate-900 mb-3">{idx + 1}. {q.question}</p><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{(q.options || []).map((opt, optIdx) => { const picked = selected[q.id] === optIdx; const revealed = selected[q.id] !== undefined; const correct = q.correctIdx === optIdx; return <button key={optIdx} onClick={() => setSelected((prev) => ({ ...prev, [q.id]: optIdx }))} className={`text-right p-3 rounded-xl border font-bold transition ${revealed && correct ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : picked ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-700 hover:border-amber-200'}`}>{opt}</button>; })}</div>{selected[q.id] !== undefined && q.explanation && <p className="mt-3 text-sm bg-white rounded-xl p-3 text-slate-600 leading-relaxed"><b>الشرح:</b> {q.explanation}</p>}</div>)}</div></div>}
  </div>;
};

export default StudentRafiqAssistant;
