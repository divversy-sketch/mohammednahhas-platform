import { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore';
import { AlertTriangle, BarChart3, BookOpen, CheckCircle, FileCheck, FileText, Filter, Layers, PenTool, PlusCircle, Search, Sparkles, Trash2, UploadCloud } from '@shared/icons/lucide-shim.jsx';
import { db } from '@services/firebase';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades';
import { platformNotify, platformConfirm, safeNumber, getQuestionMaxScore } from '@shared/core/platformShared.jsx';
import { OPTION_LABELS } from '../constants/questionBankConstants.js';
import { parseQuestionBankLines, readDocxParagraphs, readPdfTextFile, readPlainTextFile } from '../utils/questionBankImport.js';

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-900/40';
const panelClass = 'rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_12px_35px_rgba(15,23,42,.08)] dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-[0_16px_40px_rgba(0,0,0,.28)]';

function parseCsvOrJson(text, fileName, settings) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.json')) {
    const data = JSON.parse(text);
    const rows = Array.isArray(data) ? data : (data.questions || []);
    return rows.map((row) => ({
      text: row.text || row.question || row.title || '',
      grade: row.grade || settings.grade,
      branch: row.branch || settings.branch || 'النحو',
      topic: row.topic || row.lesson || 'عام',
      lesson: row.topic || row.lesson || 'عام',
      type: row.type || ((row.options || row.choices)?.length ? 'mcq' : 'essay'),
      difficulty: row.difficulty || settings.difficulty,
      options: row.options || row.choices || [],
      correctIdx: safeNumber(row.correctIdx ?? row.answerIndex, 0),
      explanation: row.explanation || '',
      mark: safeNumber(row.mark, 1),
      tags: Array.from(new Set([...(row.tags || []), ...(settings.tags || [])])),
      source: 'question_bank_import',
    })).filter((q) => q.text);
  }
  if (lower.endsWith('.csv')) {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const split = (line) => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((v) => v.replace(/^\"|\"$/g, '').trim());
    const headers = split(lines[0]).map((h) => h.toLowerCase());
    return lines.slice(1).map((line) => {
      const values = split(line); const row = Object.fromEntries(headers.map((h, i) => [h, values[i] || '']));
      const options = [row.option1, row.option2, row.option3, row.option4, row.option5, row.option6].filter(Boolean);
      return {
        text: row.question || row.text || row['السؤال'] || '', grade: row.grade || settings.grade,
        branch: row.branch || settings.branch || 'النحو', topic: row.topic || row.lesson || 'عام', lesson: row.topic || row.lesson || 'عام',
        type: row.type || (options.length ? 'mcq' : 'essay'), difficulty: row.difficulty || settings.difficulty, options,
        correctIdx: Math.max(0, safeNumber(row.correctidx || row.answer || row['الإجابة'], 1) - 1), explanation: row.explanation || '',
        mark: safeNumber(row.mark, options.length ? 1 : 10), tags: settings.tags || [], source: 'question_bank_import',
      };
    }).filter((q) => q.text);
  }
  return [];
}

export const QuestionBankManager = ({ adminGradeFilter }) => {
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [filters, setFilters] = useState({ grade: adminGradeFilter === 'all' ? '' : adminGradeFilter, branch: '', type: '', difficulty: '', topic: '', search: '' });
  const [form, setForm] = useState({ text: '', grade: adminGradeFilter === 'all' ? '3sec' : adminGradeFilter, branch: 'النحو', topic: '', type: 'mcq', difficulty: 'medium', optionsText: '', correctIdx: 0, explanation: '', mark: 1, tags: '' });
  const [importSettings, setImportSettings] = useState({ grade: adminGradeFilter === 'all' ? '3sec' : adminGradeFilter, branchMode: 'auto', branch: 'النحو', difficulty: 'medium', tags: 'استيراد' });
  const [importPreview, setImportPreview] = useState([]);
  const [importWarnings, setImportWarnings] = useState([]);
  const [importRejected, setImportRejected] = useState([]);
  const [importBusy, setImportBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [expandedId, setExpandedId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'question_bank'), orderBy('createdAt', 'desc'), limit(1500)), (snap) => {
      setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (error) => { console.warn('question_bank listener blocked:', error?.message); setQuestions([]); });
    return () => unsub();
  }, []);

  const visible = useMemo(() => questions.filter((q) =>
    (!filters.grade || q.grade === filters.grade) && (!filters.branch || q.branch === filters.branch) &&
    (!filters.type || q.type === filters.type) && (!filters.difficulty || q.difficulty === filters.difficulty) &&
    (!filters.topic || (q.topic || q.lesson || '').includes(filters.topic)) &&
    (!filters.search || `${q.text} ${(q.tags || []).join(' ')} ${q.explanation || ''}`.toLowerCase().includes(filters.search.toLowerCase()))
  ), [questions, filters]);

  const topics = useMemo(() => Array.from(new Set(questions.map((q) => q.topic || q.lesson).filter(Boolean))).sort((a,b) => String(a).localeCompare(String(b), 'ar')), [questions]);
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const pagedVisible = useMemo(() => visible.slice((page - 1) * pageSize, page * pageSize), [visible, page, pageSize]);
  useEffect(() => { setPage(1); }, [filters, pageSize]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const stats = useMemo(() => ({
    total: questions.length,
    mcq: questions.filter((q) => q.type !== 'essay').length,
    essay: questions.filter((q) => q.type === 'essay').length,
    topics: new Set(questions.map((q) => q.topic || q.lesson).filter(Boolean)).size,
  }), [questions]);


  const reviewImportQuestions = useMemo(() => importPreview
    .map((question, index) => ({ question, index }))
    .filter(({ question }) => question.importConfidence === 'review'), [importPreview]);
  const readyImportQuestions = useMemo(() => importPreview
    .map((question, index) => ({ question, index }))
    .filter(({ question }) => question.importConfidence !== 'review'), [importPreview]);

  const updateImportQuestion = (index, patch) => {
    setImportPreview((current) => current.map((question, questionIndex) => (
      questionIndex === index ? { ...question, ...patch } : question
    )));
  };

  const updateImportOption = (questionIndex, optionIndex, value) => {
    setImportPreview((current) => current.map((question, currentIndex) => {
      if (currentIndex !== questionIndex) return question;
      const options = [...(question.options || [])];
      options[optionIndex] = value;
      return { ...question, options };
    }));
  };

  const removeImportQuestion = (index) => {
    setImportPreview((current) => current.filter((_, questionIndex) => questionIndex !== index));
  };

  const splitAmbiguousOption = (index) => {
    const target = importPreview[index];
    const source = (target?.options || []).join(' - ');
    const parts = source.split(/\s*[-–—ـ]\s*/u).map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) return platformNotify('لم أجد فواصل كافية لتقسيم الاختيارات تلقائيًا');
    updateImportQuestion(index, { options: parts, type: 'mcq', correctIdx: null, importConfidence: 'review' });
    platformNotify(`تم تقسيم النص إلى ${parts.length} اختيارات. اختر الإجابة الصحيحة ثم اعتمد السؤال.`);
  };

  const approveImportQuestion = (index) => {
    const target = importPreview[index];
    const options = (target?.options || []).map((option) => String(option || '').trim()).filter(Boolean);
    if (!String(target?.text || '').trim()) return platformNotify('اكتب نص السؤال أولًا');
    if (options.length < 2) return platformNotify('السؤال الاختياري يحتاج اختيارين على الأقل');
    if (!Number.isInteger(Number(target?.correctIdx)) || Number(target.correctIdx) < 0 || Number(target.correctIdx) >= options.length) return platformNotify('حدد الإجابة الصحيحة أولًا');
    updateImportQuestion(index, { options, type: 'mcq', correctIdx: Number(target.correctIdx), importConfidence: 'high' });
    platformNotify('تم اعتماد السؤال ونقله إلى قائمة الأسئلة الجاهزة');
  };

  const processFile = async (file) => {
    setImportBusy(true); setImportPreview([]); setImportWarnings([]); setImportRejected([]);
    try {
      const lower = file.name.toLowerCase(); let parsedQuestions = []; let lines = [];
      if (lower.endsWith('.txt')) lines = (await readPlainTextFile(file)).split(/\r?\n/).map((text) => ({ text, highlighted: false }));
      else if (lower.endsWith('.docx')) lines = await readDocxParagraphs(file);
      else if (lower.endsWith('.pdf')) {
        lines = (await readPdfTextFile(file)).split(/\r?\n/).map((text) => ({ text, highlighted: false }));
        setImportWarnings(['ملفات PDF المصورة تحتاج OCR خارجيًا. ملفات PDF النصية تعمل مباشرة.']);
      } else if (lower.endsWith('.json') || lower.endsWith('.csv')) {
        parsedQuestions = parseCsvOrJson(await file.text(), file.name, { ...importSettings, tags: importSettings.tags.split(',').map((t) => t.trim()).filter(Boolean) });
      } else if (lower.endsWith('.html') || lower.endsWith('.htm')) {
        const html = await file.text(); const text = new DOMParser().parseFromString(html, 'text/html').body?.innerText || '';
        lines = text.split(/\r?\n/).map((line) => ({ text: line, highlighted: false }));
      } else throw new Error('الصيغة غير مدعومة حاليًا. استخدم TXT أو DOCX أو PDF نصي أو CSV أو JSON أو HTML.');
      if (!parsedQuestions.length && lines.length) {
        const parsed = parseQuestionBankLines(lines, { ...importSettings, tags: importSettings.tags.split(',').map((t) => t.trim()).filter(Boolean) });
        parsedQuestions = parsed.questions; setImportWarnings((prev) => [...prev, ...parsed.warnings]); setImportRejected(parsed.rejected || []);
      }
      if (!parsedQuestions.length) throw new Error('تم فتح الملف لكن لم أجد أسئلة قابلة للتعرّف. نزّل ملف الأسطر غير المقروءة وعدّله ثم أعد رفعه.');
      setImportPreview(parsedQuestions); setActiveTab('import'); platformNotify(`تم اكتشاف ${parsedQuestions.length} سؤال`);
    } catch (error) { console.error(error); platformNotify(error?.message || 'تعذر قراءة الملف'); }
    finally { setImportBusy(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleImportFile = (event) => { const file = event.target.files?.[0]; if (file) processFile(file); };
  const onDrop = (event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files?.[0]; if (file) processFile(file); };

  const saveImportedQuestions = async () => {
    const readyQuestions = importPreview.filter((question) => question.importConfidence !== 'review');
    const pendingCount = importPreview.length - readyQuestions.length;
    if (!readyQuestions.length) return platformNotify('لا توجد أسئلة معتمدة وجاهزة للحفظ');
    const message = pendingCount
      ? `سيتم حفظ ${readyQuestions.length} سؤال معتمد، وسيبقى ${pendingCount} سؤال في قائمة المراجعة. هل نكمل؟`
      : `سيتم حفظ ${readyQuestions.length} سؤال. هل نكمل؟`;
    if (!(await platformConfirm(message))) return;
    try {
      let batch = writeBatch(db); let counter = 0;
      for (const q of readyQuestions) { batch.set(doc(collection(db, 'question_bank')), { ...q, createdAt: serverTimestamp(), importedAt: serverTimestamp() }); counter += 1; if (counter % 400 === 0) { await batch.commit(); batch = writeBatch(db); } }
      if (counter % 400 !== 0) await batch.commit();
      setImportPreview((current) => current.filter((question) => question.importConfidence === 'review'));
      if (!pendingCount) { setImportWarnings([]); setImportRejected([]); setActiveTab('browse'); }
      platformNotify(`تم حفظ ${readyQuestions.length} سؤال معتمد بنجاح`);
    } catch (error) { platformNotify('تعذر حفظ الأسئلة: ' + (error?.message || 'خطأ غير معروف')); }
  };

  const handleAddQuestion = async (event) => {
    event.preventDefault(); const options = form.type === 'mcq' ? form.optionsText.split('\n').map((o) => o.trim().replace(/\*/g, '')).filter(Boolean) : [];
    if (!form.text.trim()) return platformNotify('اكتب نص السؤال أولًا');
    if (form.type === 'mcq' && options.length < 2) return platformNotify('أضف اختيارين على الأقل');
    await addDoc(collection(db, 'question_bank'), { text: form.text.trim(), grade: form.grade, branch: form.branch, topic: form.topic.trim() || 'عام', lesson: form.topic.trim() || 'عام', type: form.type, difficulty: form.difficulty, options, correctIdx: safeNumber(form.correctIdx, 0), explanation: form.explanation, mark: safeNumber(form.mark, form.type === 'essay' ? 10 : 1), tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean), createdAt: serverTimestamp() });
    setForm((prev) => ({ ...prev, text: '', optionsText: '', explanation: '', tags: '', topic: '' })); platformNotify('تمت إضافة السؤال'); setActiveTab('browse');
  };

  const removeQuestion = async (question) => {
    if (!(await platformConfirm(`حذف السؤال: ${question.text.slice(0, 60)}؟`))) return;
    try { await deleteDoc(doc(db, 'question_bank', question.id)); platformNotify('تم حذف السؤال'); } catch (error) { platformNotify('تعذر حذف السؤال: ' + (error?.message || '')); }
  };


  const downloadRejectedQuestions = () => {
    if (!importRejected.length) return platformNotify('لا توجد أسئلة غير مقروءة لتصديرها');
    const body = importRejected.map((item, index) => [
      `السؤال غير المقروء رقم ${index + 1}`,
      `السبب: ${item.reason || 'تنسيق غير معروف'}`,
      `رأس القسم: ${item.heading || 'غير محدد'}`,
      item.question ? `نص السؤال: ${item.question}` : '',
      Array.isArray(item.options) && item.options.length ? `الاختيارات:
${item.options.map((option, i) => `${i + 1}- ${option}`).join('\n')}` : '',
      Array.isArray(item.raw) && item.raw.length ? `النص الأصلي:
${item.raw.join('\n')}` : '',
      'صيغة مقترحة بعد التعديل:',
      '1- اكتب نص السؤال هنا',
      'أ- الاختيار الأول',
      'ب- الاختيار الثاني',
      'ج- الاختيار الثالث',
      'د- الاختيار الرابع',
      'الإجابة: أ',
      '----------------------------------------',
    ].filter(Boolean).join('\n')).join('\n\n');
    const blob = new Blob([`تقرير الأسئلة التي تحتاج تعديلًا\n\n${body}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `questions-needing-review-${Date.now()}.txt`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  };

  const deleteAllQuestions = async () => {
    if (!(await platformConfirm('سيتم حذف كل أسئلة بنك الأسئلة نهائيًا، وليس الصفحة الحالية فقط. هل أنت متأكد؟'))) return;
    if (!(await platformConfirm('تأكيد أخير: لا يمكن التراجع بعد حذف جميع الأسئلة.'))) return;
    try {
      let deleted = 0;
      while (true) {
        const snap = await getDocs(query(collection(db, 'question_bank'), limit(400)));
        if (snap.empty) break;
        const batch = writeBatch(db);
        snap.docs.forEach((item) => batch.delete(item.ref));
        await batch.commit(); deleted += snap.size;
      }
      platformNotify(`تم حذف ${deleted} سؤال من بنك الأسئلة`);
    } catch (error) { platformNotify('تعذر حذف كل الأسئلة: ' + (error?.message || 'خطأ غير معروف')); }
  };

  const createExamFromBank = async () => {
    if (!visible.length) return platformNotify('لا توجد أسئلة مطابقة للفلاتر الحالية');
    const selected = visible.slice(0, Math.min(visible.length, 20)); const grouped = {};
    selected.forEach((q) => { grouped[q.branch] = grouped[q.branch] || { text: q.branch, subQuestions: [] }; grouped[q.branch].subQuestions.push({ id: `qb_${q.id}_${Date.now()}`, text: q.text, options: q.options || [], correctIdx: q.correctIdx ?? 0, branch: q.branch, topic: q.topic || q.lesson || 'عام', type: q.type || 'mcq', explanation: q.explanation || '', maxScore: getQuestionMaxScore(q), modelAnswer: q.modelAnswer || '' }); });
    await addDoc(collection(db, 'exams'), { title: `امتحان من بنك الأسئلة - ${getGradeLabel(filters.grade || selected[0].grade)}`, grade: filters.grade || selected[0].grade, duration: Math.max(15, selected.length * 2), startTime: new Date().toISOString().slice(0,16), endTime: new Date(Date.now() + 7*86400000).toISOString().slice(0,16), accessCode: Math.random().toString(36).slice(2,7).toUpperCase(), isPremium: false, questions: Object.values(grouped), createdAt: serverTimestamp(), source: 'question_bank' });
    platformNotify('تم إنشاء الامتحان بنجاح');
  };

  const tabs = [
    ['browse', 'استعراض الأسئلة', BookOpen], ['import', 'استيراد ملفات', UploadCloud], ['manual', 'إضافة يدوية', PenTool],
  ];

  return <div className="space-y-5 text-slate-800 dark:text-slate-100">
    <section className={`${panelClass} overflow-hidden`}>
      <div className="border-b border-slate-200 bg-gradient-to-l from-indigo-50 via-white to-white p-5 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><div className="mb-2 flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-indigo-300"><Sparkles className="h-4 w-4"/> QUESTION BANK V2</div><h2 className="flex items-center gap-2 text-2xl font-black"><Layers/> بنك الأسئلة الذكي</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">إدارة، تصنيف، استيراد ومراجعة الأسئلة من مكان واحد.</p></div>
          <div className="flex flex-wrap gap-2"><button onClick={deleteAllQuestions} className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-700 hover:bg-red-100"><Trash2 className="ml-2 inline h-5 w-5"/> حذف كل الأسئلة</button><button onClick={() => setActiveTab('import')} className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-700"><UploadCloud className="ml-2 inline h-5 w-5"/> استيراد ملف</button><button onClick={() => setActiveTab('manual')} className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold dark:border-slate-700 dark:bg-slate-800"><PlusCircle className="ml-2 inline h-5 w-5"/> سؤال جديد</button></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
        {[[stats.total,'إجمالي الأسئلة',BarChart3,'indigo'],[stats.mcq,'اختيار متعدد',CheckCircle,'emerald'],[stats.essay,'أسئلة مقالية',FileText,'amber'],[stats.topics,'موضوعًا',BookOpen,'violet']].map(([value,label,Icon,tone]) => <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70"><div className="flex items-center justify-between"><div><p className="text-2xl font-black">{value}</p><p className="text-xs text-slate-500 dark:text-slate-400">{label}</p></div><div className={`rounded-xl bg-${tone}-100 p-2 text-${tone}-700 dark:bg-${tone}-900/30 dark:text-${tone}-300`}><Icon className="h-5 w-5"/></div></div></div>)}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-slate-200 px-4 pt-4 dark:border-slate-700">{tabs.map(([key,label,Icon]) => <button key={key} onClick={() => setActiveTab(key)} className={`rounded-t-xl px-4 py-3 text-sm font-black transition ${activeTab===key?'bg-indigo-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}><Icon className="ml-2 inline h-4 w-4"/>{label}</button>)}</div>
    </section>

    {activeTab === 'import' && <section className={`${panelClass} p-5`}>
      <div className="mb-5"><h3 className="text-xl font-black">استيراد الأسئلة</h3><p className="text-sm text-slate-500 dark:text-slate-400">اسحب الملف أو اختره، ثم راجع المعاينة قبل الحفظ.</p></div>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5"><select className={inputClass} value={importSettings.grade} onChange={(e)=>setImportSettings({...importSettings,grade:e.target.value})}><GradeOptions/></select><select className={inputClass} value={importSettings.branchMode} onChange={(e)=>setImportSettings({...importSettings,branchMode:e.target.value})}><option value="auto">تحديد الفرع تلقائيًا</option><option value="fixed">فرع ثابت لكل الملف</option></select><select className={inputClass} disabled={importSettings.branchMode==='auto'} value={importSettings.branch} onChange={(e)=>setImportSettings({...importSettings,branch:e.target.value})}><option value="النحو">النحو</option><option value="البلاغة">البلاغة</option></select><select className={inputClass} value={importSettings.difficulty} onChange={(e)=>setImportSettings({...importSettings,difficulty:e.target.value})}><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select><input className={inputClass} placeholder="وسوم عامة" value={importSettings.tags} onChange={(e)=>setImportSettings({...importSettings,tags:e.target.value})}/></div>
      <div onDragOver={(e)=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={onDrop} className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${dragging?'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30':'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50'}`}><UploadCloud className="mx-auto mb-3 h-10 w-10 text-indigo-500"/><p className="font-black">اسحب ملف الأسئلة هنا</p><p className="mt-1 text-sm text-slate-500">TXT · DOCX · PDF نصي · CSV · JSON · HTML</p><input ref={fileInputRef} type="file" accept=".txt,.docx,.pdf,.csv,.json,.html,.htm" onChange={handleImportFile} className="hidden"/><button disabled={importBusy} onClick={()=>fileInputRef.current?.click()} className="mt-4 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-50">{importBusy?'جاري التحليل...':'اختيار ملف'}</button></div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"><b>المحلل الذكي:</b> يفهم ترقيم 1- أو -1، والاختيارات أ/ب/ج/د حتى لو جاءت في السطر نفسه أو انتقلت للصفحة التالية. في Word يتعرف على الإجابة التي تحتها خط أو المظللة، ويفهم أيضًا * أو «الإجابة: ب». يعرض أي سؤال غير مؤكد للمراجعة قبل الحفظ. ملفات PDF المصورة تحتاج OCR.</div>
      {!!importWarnings.length && <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200"><div className="mb-2 flex items-center gap-2 font-black"><AlertTriangle className="h-4 w-4"/> ملاحظات التحليل</div>{importWarnings.slice(0,8).map((w,i)=><p key={i}>• {w}</p>)}</div>}
      {!!reviewImportQuestions.length && <div className="mt-5 rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-4 dark:border-amber-700 dark:bg-amber-950/20">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h4 className="flex items-center gap-2 text-lg font-black text-amber-900 dark:text-amber-200"><AlertTriangle className="h-5 w-5"/> قائمة منفصلة للمراجعة والإصلاح</h4><p className="text-sm text-amber-800/80 dark:text-amber-300">هذه الأسئلة لم تختلط بباقي الأسئلة. أصلحها هنا مباشرة ثم اضغط «اعتماد السؤال».</p></div><span className="w-fit rounded-full bg-amber-200 px-3 py-1 text-sm font-black text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">{reviewImportQuestions.length} سؤال</span></div>
        <div className="space-y-4">{reviewImportQuestions.map(({question:q,index:idx},reviewIndex)=><article key={`review_${idx}_${q.text}`} className="rounded-2xl border border-amber-300 bg-white p-4 shadow-sm dark:border-amber-700 dark:bg-slate-900">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap gap-2 text-[11px]"><span className="rounded-full bg-amber-100 px-2 py-1 font-black text-amber-800">مراجعة رقم {reviewIndex+1}</span><span className="rounded-full bg-blue-100 px-2 py-1 text-blue-800">{q.branch}</span><span className="rounded-full bg-violet-100 px-2 py-1 text-violet-800">{q.topic}</span></div><button type="button" onClick={()=>removeImportQuestion(idx)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700"><Trash2 className="ml-1 inline h-4 w-4"/>حذف من المعاينة</button></div>
          <label className="mb-2 block text-sm font-black">نص السؤال</label><textarea className={`${inputClass} min-h-24`} value={q.text} onChange={(e)=>updateImportQuestion(idx,{text:e.target.value})}/>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><label className="text-sm font-black">الاختيارات — اختر الدائرة أمام الإجابة الصحيحة</label>{(q.options||[]).length===1&&<button type="button" onClick={()=>splitAmbiguousOption(idx)} className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">تقسيم النص بالشرطات تلقائيًا</button>}</div>
          <div className="mt-2 grid gap-2">{(q.options||[]).map((option,optionIndex)=><div key={optionIndex} className={`flex items-center gap-2 rounded-xl border p-2 ${Number(q.correctIdx)===optionIndex?'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20':'border-slate-200 dark:border-slate-700'}`}><input type="radio" name={`correct_${idx}`} checked={Number(q.correctIdx)===optionIndex} onChange={()=>updateImportQuestion(idx,{correctIdx:optionIndex})}/><span className="min-w-6 font-black">{OPTION_LABELS[optionIndex]||optionIndex+1})</span><input className={`${inputClass} py-2`} value={option} onChange={(e)=>updateImportOption(idx,optionIndex,e.target.value)}/><button type="button" onClick={()=>updateImportQuestion(idx,{options:(q.options||[]).filter((_,i)=>i!==optionIndex),correctIdx:null})} className="rounded-lg p-2 text-red-600"><Trash2 className="h-4 w-4"/></button></div>)}</div>
          <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={()=>updateImportQuestion(idx,{options:[...(q.options||[]),''],type:'mcq',correctIdx:q.correctIdx??null})} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black dark:border-slate-700 dark:bg-slate-800"><PlusCircle className="ml-1 inline h-4 w-4"/>إضافة اختيار</button><button type="button" onClick={()=>approveImportQuestion(idx)} className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-black text-white"><CheckCircle className="ml-1 inline h-4 w-4"/>اعتماد السؤال</button></div>
        </article>)}</div>
      </div>}
      {!!readyImportQuestions.length && <div className="mt-5"><div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h4 className="font-black">الأسئلة الجاهزة للحفظ: {readyImportQuestions.length}</h4>{reviewImportQuestions.length>0&&<p className="text-xs text-slate-500">لن يتم حفظ أسئلة المراجعة حتى تعتمدها.</p>}</div><button onClick={saveImportedQuestions} className="rounded-xl bg-emerald-600 px-5 py-3 font-black text-white"><FileCheck className="ml-2 inline h-5 w-5"/> حفظ الأسئلة الجاهزة</button></div><div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">{readyImportQuestions.map(({question:q,index:idx},readyIndex)=><div key={`${q.text}_${idx}`} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"><div className="mb-2 flex flex-wrap gap-2 text-[11px]"><span className="rounded-full bg-blue-100 px-2 py-1 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">{q.branch}</span><span className="rounded-full bg-violet-100 px-2 py-1 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200">{q.topic}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-700 dark:text-slate-200">{q.type==='mcq'?'اختياري':'مقالي'}</span></div><p className="font-black">{readyIndex+1}. {q.text}</p>{q.options?.length>0&&<div className="mt-3 grid gap-2 md:grid-cols-2">{q.options.map((o,i)=><div key={i} className={`rounded-xl border p-2 text-sm ${i===q.correctIdx?'border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200':'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'}`}>{OPTION_LABELS[i]||i+1}) {o}</div>)}</div>}</div>)}</div></div>}
    </section>}

    {activeTab === 'manual' && <section className={`${panelClass} p-5`}><h3 className="mb-4 text-xl font-black">إضافة سؤال يدويًا</h3><form onSubmit={handleAddQuestion} className="grid gap-4"><div className="grid grid-cols-1 gap-3 md:grid-cols-5"><select className={inputClass} value={form.grade} onChange={(e)=>setForm({...form,grade:e.target.value})}><GradeOptions/></select><select className={inputClass} value={form.branch} onChange={(e)=>setForm({...form,branch:e.target.value})}><option>النحو</option><option>البلاغة</option></select><input className={inputClass} placeholder="الموضوع" value={form.topic} onChange={(e)=>setForm({...form,topic:e.target.value})}/><select className={inputClass} value={form.type} onChange={(e)=>setForm({...form,type:e.target.value,mark:e.target.value==='essay'?10:1})}><option value="mcq">اختياري</option><option value="essay">مقالي</option></select><select className={inputClass} value={form.difficulty} onChange={(e)=>setForm({...form,difficulty:e.target.value})}><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select></div><textarea className={`${inputClass} min-h-28`} placeholder="نص السؤال" value={form.text} onChange={(e)=>setForm({...form,text:e.target.value})}/>{form.type==='mcq'&&<textarea className={`${inputClass} min-h-36`} placeholder={'كل اختيار في سطر منفصل'} value={form.optionsText} onChange={(e)=>setForm({...form,optionsText:e.target.value})}/>}<div className="grid gap-3 md:grid-cols-3">{form.type==='mcq'&&<input type="number" min="0" className={inputClass} placeholder="رقم الإجابة الصحيحة يبدأ من 0" value={form.correctIdx} onChange={(e)=>setForm({...form,correctIdx:e.target.value})}/>}<input type="number" min="1" className={inputClass} placeholder="الدرجة" value={form.mark} onChange={(e)=>setForm({...form,mark:e.target.value})}/><input className={inputClass} placeholder="وسوم مفصولة بفاصلة" value={form.tags} onChange={(e)=>setForm({...form,tags:e.target.value})}/></div><textarea className={`${inputClass} min-h-24`} placeholder="شرح الإجابة" value={form.explanation} onChange={(e)=>setForm({...form,explanation:e.target.value})}/><button className="w-fit rounded-xl bg-indigo-600 px-6 py-3 font-black text-white">حفظ السؤال</button></form></section>}

    {activeTab === 'browse' && <section className={`${panelClass} p-5`}>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div><div className="flex items-center gap-2"><Filter className="h-5 w-5 text-indigo-500"/><h3 className="text-xl font-black">استعراض وتنظيم الأسئلة</h3></div><p className="mt-1 text-sm text-slate-500">صفحات سريعة بدل عرض مئات الأسئلة مرة واحدة. اضغط على أي سؤال لعرض اختياراته.</p></div>
        <button onClick={createExamFromBank} className="rounded-xl bg-emerald-600 px-5 py-3 font-black text-white">توليد امتحان من النتائج الحالية</button>
      </div>
      <div className="sticky top-2 z-10 mb-4 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
          <div className="relative xl:col-span-2"><Search className="absolute right-3 top-3.5 h-4 w-4 text-slate-400"/><input className={`${inputClass} pr-10`} placeholder="ابحث في السؤال أو الشرح أو الوسوم" value={filters.search} onChange={(e)=>setFilters({...filters,search:e.target.value})}/></div>
          <select className={inputClass} value={filters.grade} onChange={(e)=>setFilters({...filters,grade:e.target.value})}><option value="">كل المراحل</option><GradeOptions/></select>
          <select className={inputClass} value={filters.branch} onChange={(e)=>setFilters({...filters,branch:e.target.value})}><option value="">كل الفروع</option><option>النحو</option><option>البلاغة</option><option>الأدب</option><option>القصة</option></select>
          <select className={inputClass} value={filters.topic} onChange={(e)=>setFilters({...filters,topic:e.target.value})}><option value="">كل الدروس والموضوعات</option>{topics.map((topic)=><option key={topic} value={topic}>{topic}</option>)}</select>
          <select className={inputClass} value={filters.type} onChange={(e)=>setFilters({...filters,type:e.target.value})}><option value="">كل الأنواع</option><option value="mcq">اختياري</option><option value="essay">مقالي</option></select>
          <select className={inputClass} value={filters.difficulty} onChange={(e)=>setFilters({...filters,difficulty:e.target.value})}><option value="">كل الصعوبات</option><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm"><p className="text-slate-500">النتائج: <b className="text-slate-900 dark:text-white">{visible.length}</b> سؤال من {questions.length}</p><button type="button" onClick={()=>setFilters({ grade: adminGradeFilter === 'all' ? '' : adminGradeFilter, branch:'', type:'', difficulty:'', topic:'', search:'' })} className="rounded-lg bg-slate-100 px-3 py-2 font-bold dark:bg-slate-800">مسح الفلاتر</button></div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="hidden grid-cols-[70px_1fr_130px_150px_110px] gap-3 bg-slate-100 px-4 py-3 text-xs font-black text-slate-600 lg:grid dark:bg-slate-800 dark:text-slate-300"><span>#</span><span>السؤال</span><span>الفرع</span><span>الدرس</span><span>النوع</span></div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">{pagedVisible.map((q,idx)=>{const expanded=expandedId===q.id; return <article key={q.id} className="bg-white dark:bg-slate-900">
          <button type="button" onClick={()=>setExpandedId(expanded?null:q.id)} className="grid w-full grid-cols-1 gap-2 px-4 py-4 text-right transition hover:bg-indigo-50/60 lg:grid-cols-[70px_1fr_130px_150px_110px] lg:items-center dark:hover:bg-indigo-950/20">
            <span className="text-xs font-black text-indigo-600">{(page-1)*pageSize+idx+1}</span><span className="line-clamp-2 font-black leading-7">{q.text}</span><span className="text-xs font-bold text-blue-700">{q.branch||'عام'}</span><span className="truncate text-xs font-bold text-violet-700">{q.topic||q.lesson||'عام'}</span><span className="text-xs font-bold">{q.type==='essay'?'مقالي':'اختياري'} · {getQuestionMaxScore(q)} د</span>
          </button>
          {expanded&&<div className="border-t border-indigo-100 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="mb-3 flex flex-wrap gap-2 text-[11px]"><span className="rounded-full bg-slate-200 px-2 py-1 dark:bg-slate-700">{getGradeLabel(q.grade)}</span><span className="rounded-full bg-amber-100 px-2 py-1">{q.difficulty||'medium'}</span>{(q.tags||[]).map((tag)=><span key={tag} className="rounded-full bg-white px-2 py-1 dark:bg-slate-900">#{tag}</span>)}</div>
            {q.options?.length>0&&<div className="grid gap-2 md:grid-cols-2">{q.options.map((o,i)=><div key={i} className={`rounded-xl border p-3 text-sm ${i===Number(q.correctIdx??0)?'border-emerald-400 bg-emerald-50 font-black text-emerald-900 underline decoration-2 underline-offset-4 dark:bg-emerald-950/30 dark:text-emerald-200':'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>{OPTION_LABELS[i]||i+1}) {o}</div>)}</div>}
            {q.explanation&&<p className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300"><b>شرح الإجابة:</b> {q.explanation}</p>}
            <div className="mt-3 flex justify-end"><button onClick={()=>removeQuestion(q)} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-bold text-red-600"><Trash2 className="ml-2 inline h-4 w-4"/>حذف السؤال</button></div>
          </div>}
        </article>})}</div>
      </div>
      {!visible.length&&<div className="py-14 text-center text-slate-500"><BookOpen className="mx-auto mb-3 h-10 w-10 opacity-50"/><p>لا توجد أسئلة مطابقة للفلاتر.</p></div>}
      {!!visible.length&&<div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 sm:flex-row dark:bg-slate-800/60"><div className="flex items-center gap-2"><span className="text-sm font-bold">عرض</span><select className="rounded-lg border bg-white px-3 py-2 font-bold dark:bg-slate-900" value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))}><option value={10}>10</option><option value={20}>20</option><option value={40}>40</option></select><span className="text-sm text-slate-500">في الصفحة</span></div><div className="flex items-center gap-2"><button disabled={page<=1} onClick={()=>setPage((p)=>Math.max(1,p-1))} className="rounded-lg border bg-white px-4 py-2 font-bold disabled:opacity-40 dark:bg-slate-900">السابق</button><span className="min-w-28 text-center text-sm font-black">صفحة {page} من {totalPages}</span><button disabled={page>=totalPages} onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} className="rounded-lg border bg-white px-4 py-2 font-bold disabled:opacity-40 dark:bg-slate-900">التالي</button></div></div>}
    </section>}
  </div>;
};

export default QuestionBankManager;
