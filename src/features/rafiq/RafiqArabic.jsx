import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, writeBatch, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { BookOpen, BrainCircuit, CheckCircle, ClipboardList, Loader2, PlusCircle, Search, Sparkles, UploadCloud, XCircle, Lightbulb } from '../../shared/icons/lucide-shim.jsx';

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
const lessonKeyOf = (item = {}) => normalizeArabic([item.grade || 'all', item.branch || 'عام', item.lesson || item.title || ''].join('|'));

const uniqueList = (items = []) => [...new Set(items.map((x) => String(x || '').trim()).filter(Boolean))];

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
    const includeInQuizRaw = normalizeArabic(get(row, ['includeInQuiz', 'يدخل الامتحان', 'quiz']));
    return {
      grade: get(row, ['grade', 'الصف']) || 'all',
      lesson: get(row, ['lesson', 'الدرس']),
      branch: get(row, ['branch', 'الفرع']) || 'عام',
      question: get(row, ['question', 'السؤال']),
      options,
      correctIdx: correctIdx < 0 ? 0 : correctIdx,
      explanation: get(row, ['explanation', 'شرح', 'الشرح']),
      difficulty: get(row, ['difficulty', 'الصعوبة']) || 'medium',
      tags: parseKeywords(get(row, ['tags', 'keywords', 'كلمات مفتاحية'])),
      includeInQuiz: !['false', '0', 'لا', 'no'].includes(includeInQuizRaw)
    };
  }).filter((q) => q.question && q.options.length >= 2);
};

const flattenExamQuestions = (exam = {}) => {
  const blocks = Array.isArray(exam.questions) ? exam.questions : [];
  return blocks.flatMap((block) => {
    const subQuestions = Array.isArray(block?.subQuestions) ? block.subQuestions : [];
    return subQuestions.map((q, idx) => ({
      id: `exam_${exam.id || exam.title || 'unknown'}_${q.id || idx}`,
      source: 'exam',
      examId: exam.id || '',
      examTitle: exam.title || '',
      grade: exam.grade || 'all',
      lesson: exam.lesson || exam.title || q.lesson || '',
      branch: q.branch || exam.branch || 'عام',
      question: q.text || q.question || '',
      options: Array.isArray(q.options) ? q.options : [],
      correctIdx: Number.isFinite(Number(q.correctIdx)) ? Number(q.correctIdx) : 0,
      explanation: q.explanation || q.modelAnswer || '',
      difficulty: q.difficulty || 'medium',
      tags: parseKeywords([exam.title, exam.lesson, q.branch, q.tags].filter(Boolean).join(',')),
      includeInQuiz: true
    })).filter((q) => q.question && q.options.length >= 2);
  });
};

const rankQuestions = (items = [], { answer, question, userGrade, excludeIds = [] }) => {
  const lesson = normalizeArabic(answer?.lesson || answer?.title || '');
  const branch = normalizeArabic(answer?.branch || '');
  const qWords = tokenize(question);
  const excluded = new Set(excludeIds);
  return items
    .filter((q) => gradeMatches(q.grade, userGrade))
    .filter((q) => q.includeInQuiz !== false)
    .filter((q) => !excluded.has(q.id))
    .map((q) => {
      const hay = normalizeArabic([q.lesson, q.branch, q.question, q.explanation, (q.tags || []).join(' '), q.examTitle].join(' '));
      let score = 0;
      if (lesson && hay.includes(lesson)) score += 10;
      if (branch && hay.includes(branch)) score += 3;
      qWords.forEach((w) => { if (hay.includes(w)) score += 1; });
      return { q, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.q);
};

const shuffle = (arr = []) => [...arr].sort(() => Math.random() - 0.5);


const extractLessonSections = (content = '') => {
  const raw = String(content || '').replace(/\r/g, '').trim();
  if (!raw) return [];
  const lines = raw.split('\n');
  const sections = [];
  let currentTitle = 'شرح عام';
  let buffer = [];
  const push = () => {
    const text = buffer.join('\n').trim();
    if (text) sections.push({ title: currentTitle, text, searchable: normalizeArabic([currentTitle, text].join(' ')) });
    buffer = [];
  };
  lines.forEach((line) => {
    const clean = line.trim();
    const looksLikeHeading = clean && clean.length <= 70 && (
      /^#{1,4}\s+/.test(clean) ||
      /^[-–—]{2,}/.test(clean) ||
      /^(النقطه|النقطة|الجزء|اولا|أولا|ثانيا|ثالثا|رابعا|خامسا|تعريف|مثال|قاعدة)[:：\-]/i.test(clean) ||
      /^\[[^\]]+\]$/.test(clean)
    );
    if (looksLikeHeading) {
      push();
      currentTitle = clean.replace(/^#{1,4}\s+/, '').replace(/^\[|\]$/g, '').trim();
    } else {
      buffer.push(line);
    }
  });
  push();
  if (sections.length === 0) return [{ title: 'شرح عام', text: raw, searchable: normalizeArabic(raw) }];
  return sections;
};

const findBestLessonPoint = (content = '', question = '', fallbackTitle = '') => {
  const sections = extractLessonSections(content);
  const words = tokenize(question);
  const ranked = sections.map((section) => {
    let score = 0;
    const titleNorm = normalizeArabic(section.title);
    words.forEach((w) => {
      if (section.searchable.includes(w)) score += 1;
      if (titleNorm.includes(w)) score += 4;
    });
    return { ...section, score };
  }).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score <= 0) return { pointTitle: fallbackTitle || 'شرح عام', pointText: getAnswerFromContent(content, question) };
  return { pointTitle: best.title || fallbackTitle || 'شرح عام', pointText: getAnswerFromContent(best.text, question) || best.text.slice(0, 1600) };
};

const makeSimplerExplanation = (text = '') => {
  const source = String(text || '').trim();
  if (!source) return '';
  const sentences = source.split(/(?<=[.!؟])\s+|\n+/g).map((x) => x.trim()).filter(Boolean).slice(0, 6);
  const bullets = sentences.map((sentence) => `• ${sentence.replace(/^[-•\s]+/, '')}`);
  return [
    'خلينا نبسطها خطوة خطوة:',
    ...bullets,
    'الخلاصة: ركّز على الكلمة الأساسية في السؤال، ثم طبّق القاعدة على المثال.'
  ].join('\n');
};

const buildQuestionSignature = (question = '') => normalizeArabic(question).split(' ').slice(0, 10).join(' ');

const RafiqHeader = ({ compact = false }) => (
  <div className={`bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white rounded-[2rem] ${compact ? 'p-5' : 'p-7'} shadow-xl border border-amber-500/20 overflow-hidden relative`}>
    <div className="absolute -left-16 -top-16 w-44 h-44 bg-amber-400/20 blur-3xl rounded-full" />
    <div className="relative z-10 flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg"><BrainCircuit size={28}/></div>
      <div>
        <p className="text-amber-200 font-black text-sm">من شرح المستر فقط</p>
        <h2 className="text-2xl md:text-3xl font-black">رفيقك في العربي</h2>
        <p className="text-slate-300 text-sm mt-1">اسأل في شرح الدرس، ولو احتجت أمثلة أكثر نجيبها من أسئلة المستر بدون ما تتكرر في الاختبار.</p>
      </div>
    </div>
  </div>
);

export const AdminRafiqPanel = ({ adminGradeFilter = 'all' }) => {
  const [form, setForm] = useState({ grade: adminGradeFilter || 'all', branch: 'عام', lesson: '', title: '', keywords: '', content: '' });
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ explanations: 0, questions: 0, exams: 0 });

  useEffect(() => {
    let active = true;
    Promise.all([
      getDocs(query(collection(db, 'lesson_explanations'), limit(500))),
      getDocs(query(collection(db, 'rafiq_question_bank'), limit(500))),
      getDocs(query(collection(db, 'exams'), limit(500)))
    ]).then(([exSnap, qSnap, examSnap]) => { if (active) setStats({ explanations: exSnap.size, questions: qSnap.size, exams: examSnap.size }); }).catch(() => {});
    return () => { active = false; };
  }, [message]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const saveExplanation = async () => {
    if (!form.lesson.trim() && !form.title.trim()) return alert('اكتب اسم الدرس أو عنوان الشرح أولًا.');
    if (!form.content.trim()) return alert('اكتب محتوى الشرح أولًا.');
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'lesson_explanations'), limit(700)));
      const incomingKey = lessonKeyOf(form);
      const existing = snap.docs.map((d) => ({ id: d.id, ...d.data() })).find((item) => lessonKeyOf(item) === incomingKey);
      const nowTitle = form.title.trim() || form.lesson.trim();
      const newKeywords = parseKeywords(form.keywords);
      if (existing) {
        const oldContent = String(existing.content || '').trim();
        const addition = String(form.content || '').trim();
        const mergedContent = oldContent.includes(addition)
          ? oldContent
          : `${oldContent}\n\n---\nإضافة جديدة من المستر:\n${addition}`.trim();
        const mergedKeywords = uniqueList([...(parseKeywords(existing.keywords) || []), ...newKeywords, form.lesson, form.branch]);
        await updateDoc(doc(db, 'lesson_explanations', existing.id), {
          title: existing.title || nowTitle,
          content: mergedContent,
          keywords: mergedKeywords,
          searchableText: normalizeArabic([existing.title || nowTitle, form.lesson, form.branch, mergedKeywords.join(' '), mergedContent].join(' ')),
          updatedAt: serverTimestamp(),
          lastMergeSource: 'admin'
        });
        setMessage(`تم دمج الإضافة الجديدة مع شرح درس: ${form.lesson || nowTitle}`);
      } else {
        await addDoc(collection(db, 'lesson_explanations'), {
          ...form,
          title: nowTitle,
          keywords: uniqueList([...newKeywords, form.lesson, form.branch]),
          searchableText: normalizeArabic([nowTitle, form.lesson, form.branch, form.keywords, form.content].join(' ')),
          createdAt: serverTimestamp(),
          source: 'admin'
        });
        setMessage('تم حفظ شرح جديد من المستر بنجاح.');
      }
      setForm((prev) => ({ ...prev, title: '', keywords: '', content: '' }));
    } catch (error) { alert('تعذر حفظ/دمج الشرح: ' + (error?.message || error)); }
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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm"><p className="text-sm text-slate-500 font-bold">شروحات محفوظة</p><p className="text-4xl font-black text-amber-700 mt-2">{stats.explanations}</p></div>
      <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-sm"><p className="text-sm text-slate-500 font-bold">أسئلة بنك رفيق</p><p className="text-4xl font-black text-blue-700 mt-2">{stats.questions}</p></div>
      <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-sm"><p className="text-sm text-slate-500 font-bold">امتحانات متاحة للأمثلة</p><p className="text-4xl font-black text-purple-700 mt-2">{stats.exams}</p></div>
      <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100 shadow-sm"><p className="text-sm text-emerald-700 font-black">المرحلة الثانية</p><p className="text-sm text-emerald-800 mt-2 leading-relaxed">دمج الشرح + أمثلة من أسئلة الامتحانات + منع تكرار نفس الأسئلة في اختبار الطالب.</p></div>
    </div>
    {message && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 font-black flex items-center gap-2"><CheckCircle/> {message}</div>}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2"><BookOpen className="text-amber-600"/> إضافة أو استكمال شرح درس</h3>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-sm text-amber-800 font-bold mb-4">لو كتبت نفس الصف + الفرع + اسم الدرس، الشرح الجديد هيتدمج مع القديم بدل ما يعمل تكرار.</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <select value={form.grade} onChange={(e) => update('grade', e.target.value)} className="border rounded-2xl p-3 font-bold bg-white">{GRADES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select>
          <select value={form.branch} onChange={(e) => update('branch', e.target.value)} className="border rounded-2xl p-3 font-bold bg-white">{BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}</select>
          <input value={form.lesson} onChange={(e) => update('lesson', e.target.value)} className="border rounded-2xl p-3 font-bold" placeholder="اسم الدرس: النعت" />
          <input value={form.title} onChange={(e) => update('title', e.target.value)} className="border rounded-2xl p-3 font-bold" placeholder="عنوان اختياري للشرح" />
        </div>
        <input value={form.keywords} onChange={(e) => update('keywords', e.target.value)} className="border rounded-2xl p-3 font-bold w-full mb-3" placeholder="كلمات مفتاحية مفصولة بفواصل: نعت، منعوت، إعراب" />
        <textarea value={form.content} onChange={(e) => update('content', e.target.value)} className="border rounded-2xl p-4 w-full min-h-[260px] leading-loose" placeholder="اكتب شرح المستر أو الإضافة الجديدة هنا..." />
        <button disabled={loading} onClick={saveExplanation} className="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 disabled:opacity-60">{loading ? <Loader2 className="animate-spin"/> : <PlusCircle/>} حفظ / دمج الشرح</button>
      </div>
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2"><ClipboardList className="text-blue-600"/> رفع أسئلة كثيرة مرة واحدة CSV</h3>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed mb-3" dir="ltr">grade,lesson,branch,question,optionA,optionB,optionC,optionD,correctAnswer,explanation,difficulty,tags,includeInQuiz<br/>1sec,النعت,نحو,"حدد النعت في الجملة","الطالب","المجتهد","في","الفصل",B,"النعت يصف المنعوت",easy,"نعت,منعوت",true</div>
        <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} className="border rounded-2xl p-4 w-full min-h-[320px] font-mono text-sm" placeholder="الصق ملف CSV هنا أو انسخ من Excel..." dir="ltr" />
        <div className="flex flex-col md:flex-row gap-3 mt-4"><button disabled={loading} onClick={uploadQuestions} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 disabled:opacity-60">{loading ? <Loader2 className="animate-spin"/> : <UploadCloud/>} رفع الأسئلة</button><button onClick={() => setCsvText('grade,lesson,branch,question,optionA,optionB,optionC,optionD,correctAnswer,explanation,difficulty,tags,includeInQuiz\n')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-black">قالب فارغ</button></div>
      </div>
    </div>
  </div>;
};

export const StudentRafiqAssistant = ({ user, userData }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [explanations, setExplanations] = useState([]);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [examQuestions, setExamQuestions] = useState([]);
  const [exampleQuestions, setExampleQuestions] = useState([]);
  const [exampleIds, setExampleIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState([]);
  const [selected, setSelected] = useState({});
  const [simplerText, setSimplerText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      getDocs(query(collection(db, 'lesson_explanations'), orderBy('createdAt', 'desc'), limit(700))),
      getDocs(query(collection(db, 'rafiq_question_bank'), orderBy('createdAt', 'desc'), limit(1500))),
      getDocs(query(collection(db, 'exams'), orderBy('createdAt', 'desc'), limit(400)))
    ]).then(([exSnap, qSnap, examSnap]) => {
      if (!active) return;
      setExplanations(exSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setBankQuestions(qSnap.docs.map((d) => ({ id: d.id, source: 'bank', ...d.data() })));
      const flattened = examSnap.docs.flatMap((d) => flattenExamQuestions({ id: d.id, ...d.data() }));
      setExamQuestions(flattened);
    }).catch((error) => console.warn('Rafiq load failed:', error?.message || error)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const allQuestions = useMemo(() => [...bankQuestions, ...examQuestions], [bankQuestions, examQuestions]);

  const logInteraction = async ({ type, payload = {} }) => {
    try {
      await addDoc(collection(db, 'rafiq_interactions'), {
        type,
        studentId: user?.uid || '',
        studentName: userData?.name || user?.displayName || '',
        grade: userData?.grade || 'all',
        question: question.trim(),
        questionSignature: buildQuestionSignature(question),
        answerTitle: answer?.title || '',
        lesson: answer?.lesson || '',
        pointTitle: answer?.pointTitle || '',
        createdAt: serverTimestamp(),
        ...payload
      });
    } catch {}
  };

  const ask = async () => {
    if (!question.trim()) return;
    setQuiz([]); setSelected({}); setExampleQuestions([]); setExampleIds([]); setSimplerText(''); setFeedbackSent(false);
    const userGrade = userData?.grade || 'all';
    const ranked = explanations
      .map((item) => ({ item, score: scoreExplanation(item, question, userGrade) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    if (ranked.length === 0) {
      setAnswer({ missing: true, title: 'النقطة غير موجودة حاليًا', text: 'النقطة دي مش موجودة في شرح المستر المتاح حاليًا. تم تسجيلها كموضوع يحتاج إضافة شرح لاحقًا.', lesson: '' });
      try { await addDoc(collection(db, 'rafiq_unanswered_questions'), { studentId: user?.uid || '', studentName: userData?.name || user?.displayName || '', grade: userGrade, question, createdAt: serverTimestamp() }); } catch {}
      return;
    }

    const best = ranked[0].item;
    const point = findBestLessonPoint(best.content, question, best.lesson || best.title || 'شرح عام');
    const newAnswer = {
      missing: false,
      title: best.title || best.lesson || 'شرح المستر',
      lesson: best.lesson || '',
      branch: best.branch || 'عام',
      pointTitle: point.pointTitle,
      text: point.pointText,
      source: 'من مكتبة شرح المستر'
    };
    setAnswer(newAnswer);
    try {
      await addDoc(collection(db, 'rafiq_answered_questions'), {
        studentId: user?.uid || '',
        studentName: userData?.name || user?.displayName || '',
        grade: userGrade,
        question,
        lesson: newAnswer.lesson,
        branch: newAnswer.branch,
        pointTitle: newAnswer.pointTitle,
        createdAt: serverTimestamp()
      });
    } catch {}
  };

  const showMoreExamples = () => {
    if (!answer || answer.missing) return;
    const userGrade = userData?.grade || 'all';
    const ranked = rankQuestions(allQuestions, { answer, question, userGrade, excludeIds: [] });
    const examples = shuffle(ranked).slice(0, 6);
    if (examples.length === 0) return alert('لا توجد أمثلة مرتبطة بهذه النقطة في أسئلة المستر أو الامتحانات حتى الآن.');
    setExampleQuestions(examples);
    setExampleIds(examples.map((q) => q.id));
    logInteraction({ type: 'examples_requested', payload: { exampleIds: examples.map((q) => q.id), examplesCount: examples.length } });
  };

  const explainSimpler = () => {
    if (!answer || answer.missing) return;
    const simplified = makeSimplerExplanation(answer.text);
    setSimplerText(simplified);
    logInteraction({ type: 'simpler_requested' });
  };

  const sendUnderstanding = async (understood) => {
    if (!answer || feedbackSent) return;
    setFeedbackSent(true);
    await logInteraction({ type: understood ? 'understood' : 'not_understood', payload: { understood } });
    if (!understood) {
      try {
        await addDoc(collection(db, 'rafiq_student_weak_points'), {
          studentId: user?.uid || '',
          studentName: userData?.name || user?.displayName || '',
          grade: userData?.grade || 'all',
          lesson: answer.lesson || '',
          branch: answer.branch || '',
          pointTitle: answer.pointTitle || answer.title || '',
          question,
          createdAt: serverTimestamp(),
          status: 'needs_review'
        });
      } catch {}
      if (!simplerText) setSimplerText(makeSimplerExplanation(answer.text));
    }
  };

  const generateQuiz = () => {
    if (!answer || answer.missing) return;
    const userGrade = userData?.grade || 'all';
    const ranked = rankQuestions(allQuestions, { answer, question, userGrade, excludeIds: exampleIds });
    const quizQuestions = shuffle(ranked).slice(0, 6);
    if (quizQuestions.length === 0) return alert('لا توجد أسئلة كافية مرتبطة بهذه النقطة بعد استبعاد أمثلة الشرح. ارفع أسئلة أكثر من لوحة الأدمن.');
    setQuiz(quizQuestions); setSelected({});
    logInteraction({ type: 'quiz_generated', payload: { quizIds: quizQuestions.map((q) => q.id), quizCount: quizQuestions.length } });
  };
  const correctCount = quiz.reduce((sum, q) => sum + (selected[q.id] === q.correctIdx ? 1 : 0), 0);

  return <div className="space-y-6 page-soft-enter">
    <RafiqHeader compact />
    <div className="bg-white rounded-3xl p-5 md:p-7 border border-slate-100 shadow-sm">
      <div className="flex flex-col md:flex-row gap-3">
        <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask()} className="flex-1 border-2 border-slate-100 focus:border-amber-400 rounded-2xl p-4 font-bold outline-none" placeholder="اسأل رفيقك: مش فاهم النعت الحقيقي، الفرق بين الحال والنعت، إزاي أطلع الاستعارة..." />
        <button onClick={ask} disabled={loading} className="bg-slate-950 hover:bg-slate-900 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 disabled:opacity-60">{loading ? <Loader2 className="animate-spin"/> : <Search/>} اسأل رفيقك</button>
      </div>
      <p className="text-xs text-slate-400 mt-3 font-bold">الرد يعتمد على شرح المستر أولًا، والأمثلة تأتي من أسئلة المستر والامتحانات بدون تكرارها في الاختبار الحالي.</p>
    </div>
    {answer && <div className={`rounded-3xl p-6 border shadow-sm ${answer.missing ? 'bg-amber-50 border-amber-200' : 'bg-white border-emerald-100'}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className={`text-xs font-black mb-1 ${answer.missing ? 'text-amber-700' : 'text-emerald-700'}`}>{answer.source || 'مطلوب إضافة شرح'}</p>
          <h3 className="text-2xl font-black text-slate-900">{answer.title}</h3>
          {!answer.missing && <p className="text-sm text-slate-500 mt-1">{answer.branch} {answer.lesson ? `— ${answer.lesson}` : ''}</p>}
          {!answer.missing && answer.pointTitle && <p className="inline-flex mt-3 bg-amber-50 text-amber-800 border border-amber-100 rounded-full px-4 py-1 text-xs font-black">النقطة المطابقة: {answer.pointTitle}</p>}
        </div>
        {answer.missing ? <XCircle className="text-amber-600"/> : <Sparkles className="text-emerald-600"/>}
      </div>
      <div className="bg-slate-50 rounded-2xl p-5 leading-loose text-slate-800 whitespace-pre-wrap font-bold">{answer.text}</div>
      {simplerText && <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-5 leading-loose text-blue-900 whitespace-pre-wrap font-bold">{simplerText}</div>}
      {!answer.missing && <div className="mt-5 flex flex-col md:flex-row flex-wrap gap-3">
        <button onClick={explainSimpler} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2"><BrainCircuit/> افهمني أكتر</button>
        <button onClick={showMoreExamples} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2"><Lightbulb/> أمثلة أكثر</button>
        <button onClick={generateQuiz} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2"><ClipboardList/> اختبرني على النقطة دي</button>
      </div>}
      {!answer.missing && <div className="mt-5 bg-slate-50 border border-slate-100 rounded-2xl p-4">
        <p className="text-sm font-black text-slate-700 mb-3">هل الشرح وضح لك النقطة؟</p>
        <div className="flex gap-2">
          <button disabled={feedbackSent} onClick={() => sendUnderstanding(true)} className="bg-emerald-600 disabled:opacity-60 text-white px-4 py-2 rounded-xl font-black">نعم فهمت</button>
          <button disabled={feedbackSent} onClick={() => sendUnderstanding(false)} className="bg-rose-600 disabled:opacity-60 text-white px-4 py-2 rounded-xl font-black">لا، محتاج أبسط</button>
        </div>
        {feedbackSent && <p className="text-xs text-slate-500 mt-2 font-bold">تم تسجيل إجابتك لتحسين متابعة نقاط ضعفك.</p>}
      </div>}
    </div>}
    {exampleQuestions.length > 0 && <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100 shadow-sm"><h3 className="text-xl font-black text-blue-900 flex items-center gap-2 mb-4"><Lightbulb/> أمثلة من أسئلة المستر والامتحانات</h3><div className="space-y-3">{exampleQuestions.map((q, idx) => <div key={q.id || idx} className="bg-white border border-blue-100 rounded-2xl p-4"><p className="font-black text-slate-900 mb-2">مثال {idx + 1}: {q.question}</p>{q.options?.length > 0 && <p className="text-sm text-slate-700 mb-2"><b>الإجابة:</b> {q.options[q.correctIdx] || q.options[0]}</p>}{q.explanation && <p className="text-sm text-blue-800 leading-relaxed"><b>الشرح:</b> {q.explanation}</p>}<p className="text-[11px] text-slate-400 mt-2">لن يظهر هذا السؤال في الاختبار الحالي بعد استخدامه كمثال.</p></div>)}</div></div>}
    {quiz.length > 0 && <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm"><div className="flex items-center justify-between gap-3 mb-5"><h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><ClipboardList className="text-amber-600"/> اختبار سريع من أسئلة المستر</h3><span className="bg-slate-900 text-white px-4 py-2 rounded-full font-black text-sm">{correctCount}/{quiz.length}</span></div><div className="space-y-4">{quiz.map((q, idx) => <div key={q.id || idx} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/70"><p className="font-black text-slate-900 mb-3">{idx + 1}. {q.question}</p><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{(q.options || []).map((opt, optIdx) => { const picked = selected[q.id] === optIdx; const revealed = selected[q.id] !== undefined; const correct = q.correctIdx === optIdx; return <button key={optIdx} onClick={() => setSelected((prev) => ({ ...prev, [q.id]: optIdx }))} className={`text-right p-3 rounded-xl border font-bold transition ${revealed && correct ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : picked ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-700 hover:border-amber-200'}`}>{opt}</button>; })}</div>{selected[q.id] !== undefined && q.explanation && <p className="mt-3 text-sm bg-white rounded-xl p-3 text-slate-600 leading-relaxed"><b>الشرح:</b> {q.explanation}</p>}</div>)}</div></div>}
  </div>;
};
