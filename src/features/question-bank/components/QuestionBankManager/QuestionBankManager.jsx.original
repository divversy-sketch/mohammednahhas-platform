import { useState, useEffect, useRef } from 'react';
import { doc, collection, addDoc, onSnapshot, serverTimestamp, writeBatch, query, orderBy, limit } from 'firebase/firestore';
import { UploadCloud, PenTool, Sparkles, FileCheck, Layers } from '@shared/icons/lucide-shim.jsx';

import { db } from '@services/firebase';


import { GradeOptions, getGradeLabel } from '@shared/constants/grades';


import { platformNotify, platformConfirm, safeNumber, getQuestionMaxScore } from '@shared/core/platformShared.jsx';

import { OPTION_LABELS } from '../constants/questionBankConstants.js';
import { parseQuestionBankLines, readDocxParagraphs, readPdfTextFile, readPlainTextFile } from '../utils/questionBankImport.js';

export const QuestionBankManager = ({ adminGradeFilter }) => {
  const [questions, setQuestions] = useState([]);
  const [filters, setFilters] = useState({ grade: adminGradeFilter === 'all' ? '' : adminGradeFilter, branch: '', type: '', topic: '', search: '' });
  const [form, setForm] = useState({ text: '', grade: adminGradeFilter === 'all' ? '3sec' : adminGradeFilter, branch: 'النحو', topic: '', type: 'mcq', difficulty: 'medium', optionsText: '', correctIdx: 0, explanation: '', mark: 1, tags: '' });
  const [importSettings, setImportSettings] = useState({ grade: adminGradeFilter === 'all' ? '3sec' : adminGradeFilter, branchMode: 'auto', branch: 'النحو', difficulty: 'medium', tags: 'استيراد' });
  const [importPreview, setImportPreview] = useState([]);
  const [importWarnings, setImportWarnings] = useState([]);
  const [importBusy, setImportBusy] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
      const unsub = onSnapshot(query(collection(db, 'question_bank'), orderBy('createdAt', 'desc'), limit(300)), (snap) => {
          const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setQuestions(rows);
      }, (error) => {
          console.warn('question_bank listener blocked:', error?.message);
          setQuestions([]);
      });
      return () => unsub();
  }, []);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    const options = form.type === 'mcq' ? form.optionsText.split('\n').map(o => o.trim().replace(/\*/g, '')).filter(Boolean) : [];
    if (!form.text.trim()) return platformNotify('اكتب نص السؤال أولاً');
    if (form.type === 'mcq' && options.length < 2) return platformNotify('أضف اختيارين على الأقل');
    await addDoc(collection(db, 'question_bank'), {
      text: form.text.trim(),
      grade: form.grade,
      branch: form.branch,
      topic: form.topic.trim() || 'عام',
      lesson: form.topic.trim() || 'عام',
      type: form.type,
      difficulty: form.difficulty,
      options,
      correctIdx: safeNumber(form.correctIdx, 0),
      explanation: form.explanation,
      mark: safeNumber(form.mark, form.type === 'essay' ? 10 : 1),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: serverTimestamp()
    });
    setForm(prev => ({ ...prev, text: '', optionsText: '', explanation: '', tags: '', topic: '' }));
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportBusy(true);
    setImportPreview([]);
    setImportWarnings([]);
    try {
      const lowerName = file.name.toLowerCase();
      let lines = [];
      if (lowerName.endsWith('.txt')) {
        lines = (await readPlainTextFile(file)).split(/\r?\n/).map((text) => ({ text, highlighted: false }));
      } else if (lowerName.endsWith('.docx')) {
        lines = await readDocxParagraphs(file);
      } else if (lowerName.endsWith('.pdf')) {
        lines = (await readPdfTextFile(file)).split(/\r?\n/).map((text) => ({ text, highlighted: false }));
        setImportWarnings(['ملفات PDF النصية مدعومة بعلامة * أو سطر الإجابة. تظليل PDF غالبًا لا يظهر في النص، لذلك DOCX أفضل لو هتستخدم التظليل.']);
      } else {
        platformNotify('ارفع ملف TXT أو DOCX أو PDF نصي فقط');
        return;
      }
      const parsed = parseQuestionBankLines(lines, {
        ...importSettings,
        tags: importSettings.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      });
      setImportPreview(parsed.questions);
      setImportWarnings((prev) => [...prev, ...parsed.warnings]);
      platformNotify(`تمت قراءة ${parsed.questions.length} سؤال من الملف`);
    } catch (error) {
      console.error('question bank import failed', error);
      platformNotify(error?.message || 'تعذر قراءة الملف');
    } finally {
      setImportBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveImportedQuestions = async () => {
    if (importPreview.length === 0) return platformNotify('لا توجد أسئلة جاهزة للحفظ');
    const ok = await platformConfirm(`سيتم حفظ ${importPreview.length} سؤال في بنك الأسئلة. هل نكمل؟`);
    if (!ok) return;
    try {
      let batch = writeBatch(db);
      let counter = 0;
      for (const importedQuestion of importPreview) {
        const ref = doc(collection(db, 'question_bank'));
        batch.set(ref, {
          ...importedQuestion,
          createdAt: serverTimestamp(),
          importedAt: serverTimestamp(),
        });
        counter += 1;
        if (counter % 400 === 0) {
          await batch.commit();
          batch = writeBatch(db);
        }
      }
      if (counter % 400 !== 0) await batch.commit();
      setImportPreview([]);
      setImportWarnings([]);
      platformNotify('تم حفظ الأسئلة المستوردة بنجاح');
    } catch (error) {
      console.error('save imported question bank failed', error);
      platformNotify('تعذر حفظ الأسئلة: ' + (error?.message || 'خطأ غير معروف'));
    }
  };

  const createExamFromBank = async () => {
    const pool = questions.filter(q => (!filters.grade || q.grade === filters.grade) && (!filters.branch || q.branch === filters.branch) && (!filters.type || q.type === filters.type) && (!filters.topic || (q.topic || q.lesson || '').includes(filters.topic)) && (!filters.search || `${q.text} ${(q.tags || []).join(' ')} ${q.explanation || ''}`.includes(filters.search)));
    if (pool.length === 0) return platformNotify('لا توجد أسئلة مطابقة للفلاتر الحالية');
    const selected = pool.slice(0, Math.min(pool.length, 20));
    const grouped = {};
    selected.forEach(q => {
      grouped[q.branch] = grouped[q.branch] || { text: q.branch, subQuestions: [] };
      grouped[q.branch].subQuestions.push({
        id: `qb_${q.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        text: q.text,
        options: q.options || [],
        correctIdx: q.correctIdx ?? 0,
        branch: q.branch,
        topic: q.topic || q.lesson || 'عام',
        type: q.type || 'mcq',
        explanation: q.explanation || '',
        maxScore: getQuestionMaxScore(q),
        modelAnswer: q.modelAnswer || ''
      });
    });
    await addDoc(collection(db, 'exams'), {
      title: `امتحان مُولَّد من بنك الأسئلة - ${getGradeLabel(filters.grade || selected[0].grade)}`,
      grade: filters.grade || selected[0].grade,
      duration: Math.max(15, selected.length * 2),
      startTime: new Date().toISOString().slice(0,16),
      endTime: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0,16),
      accessCode: Math.random().toString(36).slice(2, 7).toUpperCase(),
      isPremium: false,
      questions: Object.values(grouped),
      createdAt: serverTimestamp(),
      source: 'question_bank'
    });
    platformNotify('تم إنشاء امتحان جديد من بنك الأسئلة بنجاح');
  };

  const visible = questions.filter(q => (!filters.grade || q.grade === filters.grade) && (!filters.branch || q.branch === filters.branch) && (!filters.type || q.type === filters.type) && (!filters.topic || (q.topic || q.lesson || '').includes(filters.topic)) && (!filters.search || `${q.text} ${(q.tags || []).join(' ')} ${q.explanation || ''}`.includes(filters.search)));

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 md:p-6 rounded-xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-indigo-700 flex items-center gap-2"><Layers/> بنك الأسئلة الشامل</h2>
            <p className="text-sm text-slate-500 mt-1">ارفع ملفات نحو وبلاغة كاملة، والنظام يفرز الأسئلة حسب الفرع والموضوع، مع دعم علامة * والتظليل في Word.</p>
          </div>
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{questions.length} سؤال محفوظ</span>
        </div>

        <div className="bg-white/80 border border-dashed border-indigo-200 rounded-2xl p-4 mb-5">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3"><UploadCloud className="w-5 h-5"/> استيراد أسئلة من ملف</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <select className="border p-3 rounded" value={importSettings.grade} onChange={e=>setImportSettings({...importSettings, grade:e.target.value})}><GradeOptions/></select>
            <select className="border p-3 rounded" value={importSettings.branchMode} onChange={e=>setImportSettings({...importSettings, branchMode:e.target.value})}>
              <option value="auto">تحديد الفرع تلقائيًا من الملف</option>
              <option value="fixed">استخدام الفرع المختار لكل الملف</option>
            </select>
            <select className="border p-3 rounded" value={importSettings.branch} disabled={importSettings.branchMode === 'auto'} onChange={e=>setImportSettings({...importSettings, branch:e.target.value})}>
              <option value="النحو">النحو</option>
              <option value="البلاغة">البلاغة</option>
            </select>
            <select className="border p-3 rounded" value={importSettings.difficulty} onChange={e=>setImportSettings({...importSettings, difficulty:e.target.value})}>
              <option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option>
            </select>
            <input className="border p-3 rounded" placeholder="وسوم عامة: نحو,بلاغة" value={importSettings.tags} onChange={e=>setImportSettings({...importSettings, tags:e.target.value})}/>
          </div>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <input ref={fileInputRef} type="file" accept=".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleImportFile} className="block w-full text-sm text-slate-600 file:ml-3 file:rounded-xl file:border-0 file:bg-indigo-600 file:px-4 file:py-3 file:font-bold file:text-white hover:file:bg-indigo-700" />
            <button type="button" disabled={importBusy || importPreview.length === 0} onClick={saveImportedQuestions} className="bg-emerald-600 disabled:bg-slate-300 text-white py-3 px-6 rounded-xl font-bold whitespace-nowrap flex items-center justify-center gap-2"><FileCheck className="w-5 h-5"/> حفظ المعاينة</button>
          </div>
          <div className="mt-3 text-xs text-slate-600 leading-6 bg-slate-50 rounded-xl p-3">
            <b>الصيغ المدعومة:</b> TXT و DOCX و PDF نصي. ضع <b>*</b> بجانب الإجابة الصحيحة أو ظلّل سطر الإجابة في Word. اكتب عناوين مثل <b># النحو</b> ثم <b>## المنادى</b> أو <b># البلاغة</b> ثم <b>## التشبيه</b> عشان يتخزن الفرع والموضوع تلقائيًا.
          </div>
          {importWarnings.length > 0 && <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-sm space-y-1">{importWarnings.slice(0, 6).map((warning, idx) => <p key={idx}>• {warning}</p>)}</div>}
          {importPreview.length > 0 && <div className="mt-4 bg-slate-50 rounded-xl p-3 max-h-72 overflow-y-auto space-y-2">
            <div className="font-bold text-slate-700 flex items-center gap-2"><Sparkles className="w-4 h-4"/> معاينة {importPreview.length} سؤال قبل الحفظ</div>
            {importPreview.slice(0, 20).map((q, idx) => <div key={`${q.text}_${idx}`} className="bg-white border rounded-xl p-3">
              <div className="flex flex-wrap gap-2 mb-1 text-[11px]"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{q.branch}</span><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">{q.topic}</span><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">{q.type === 'mcq' ? 'اختياري' : 'مقالي'}</span></div>
              <p className="font-bold text-sm text-slate-800">{idx + 1}. {q.text}</p>
              {q.options?.length > 0 && <p className="text-xs text-emerald-700 mt-1">الإجابة: {OPTION_LABELS[q.correctIdx] || q.correctIdx + 1}) {q.options[q.correctIdx]}</p>}
            </div>)}
          </div>}
        </div>

        <form onSubmit={handleAddQuestion} className="grid gap-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><PenTool className="w-5 h-5"/> إضافة سؤال يدويًا</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select className="border p-3 rounded" value={form.grade} onChange={e=>setForm({...form, grade:e.target.value})}><GradeOptions/></select>
            <select className="border p-3 rounded" value={form.branch} onChange={e=>setForm({...form, branch:e.target.value})}><option value="النحو">النحو</option><option value="البلاغة">البلاغة</option></select>
            <input className="border p-3 rounded" placeholder="الموضوع مثل المنادى / التشبيه" value={form.topic} onChange={e=>setForm({...form, topic:e.target.value})}/>
            <select className="border p-3 rounded" value={form.type} onChange={e=>setForm({...form, type:e.target.value, mark: e.target.value === 'essay' ? 10 : 1})}>
              <option value="mcq">اختياري</option><option value="essay">مقالي</option>
            </select>
            <select className="border p-3 rounded" value={form.difficulty} onChange={e=>setForm({...form, difficulty:e.target.value})}>
              <option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option>
            </select>
          </div>
          <textarea className="border p-3 rounded h-24" placeholder="نص السؤال" value={form.text} onChange={e=>setForm({...form, text:e.target.value})}/>
          {form.type === 'mcq' && <textarea className="border p-3 rounded h-28 font-mono" placeholder={'كل اختيار في سطر منفصل\nمثال:\nنكرة مقصودة\nمضاف\nشبيه بالمضاف'} value={form.optionsText} onChange={e=>setForm({...form, optionsText:e.target.value})}/>}          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {form.type === 'mcq' && <input type="number" min="0" className="border p-3 rounded" placeholder="رقم الإجابة الصحيحة يبدأ من 0" value={form.correctIdx} onChange={e=>setForm({...form, correctIdx:e.target.value})}/>}            
            <input type="number" min="1" className="border p-3 rounded" placeholder="درجة السؤال" value={form.mark} onChange={e=>setForm({...form, mark:e.target.value})}/>
            <input className="border p-3 rounded" placeholder="tags مفصولة بفاصلة" value={form.tags} onChange={e=>setForm({...form, tags:e.target.value})}/>
          </div>
          <textarea className="border p-3 rounded h-20" placeholder="شرح الإجابة / قاعدة المراجعة الذكية" value={form.explanation} onChange={e=>setForm({...form, explanation:e.target.value})}/>
          <div className="flex flex-col md:flex-row gap-3">
            <button className="bg-indigo-600 text-white py-3 px-6 rounded-xl font-bold">إضافة للسجل</button>
            <button type="button" onClick={createExamFromBank} className="bg-emerald-600 text-white py-3 px-6 rounded-xl font-bold">توليد امتحان من الفلاتر الحالية</button>
          </div>
        </form>
      </div>
      <div className="glass-panel p-4 md:p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <select className="border p-3 rounded" value={filters.grade} onChange={e=>setFilters({...filters, grade:e.target.value})}><option value="">كل المراحل</option><GradeOptions/></select>
          <select className="border p-3 rounded" value={filters.branch} onChange={e=>setFilters({...filters, branch:e.target.value})}><option value="">النحو والبلاغة</option><option value="النحو">النحو</option><option value="البلاغة">البلاغة</option></select>
          <input className="border p-3 rounded" placeholder="فلترة الموضوع" value={filters.topic} onChange={e=>setFilters({...filters, topic:e.target.value})}/>
          <select className="border p-3 rounded" value={filters.type} onChange={e=>setFilters({...filters, type:e.target.value})}><option value="">كل الأنواع</option><option value="mcq">اختياري</option><option value="essay">مقالي</option></select>
          <input className="border p-3 rounded" placeholder="بحث في نص السؤال" value={filters.search} onChange={e=>setFilters({...filters, search:e.target.value})}/>
        </div>
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
          <p className="text-sm text-slate-500">المعروض الآن: <b>{visible.length}</b> سؤال</p>
          <button type="button" onClick={createExamFromBank} className="bg-emerald-600 text-white py-2 px-5 rounded-xl font-bold">توليد امتحان من النحو/البلاغة حسب الفلاتر</button>
        </div>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {visible.map(q => <div key={q.id} className="bg-white border rounded-xl p-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">{getGradeLabel(q.grade)}</span>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{q.branch}</span>
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">{q.topic || q.lesson || 'عام'}</span>
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded">{q.type === 'essay' ? 'مقالي' : 'اختياري'}</span>
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded">{getQuestionMaxScore(q)} درجة</span>
            </div>
            <p className="font-bold text-slate-800">{q.text}</p>
            {q.options?.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm">{q.options.map((option, idx) => <div key={idx} className={`border rounded-lg p-2 ${idx === q.correctIdx ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50'}`}>{OPTION_LABELS[idx] || idx + 1}) {option}</div>)}</div>}
            {q.explanation && <p className="text-xs text-slate-500 mt-2">شرح: {q.explanation}</p>}
          </div>)}
          {visible.length === 0 && <p className="text-slate-500 text-center py-8">لا توجد أسئلة مطابقة.</p>}
        </div>
      </div>
    </div>
  );
};

export default QuestionBankManager;
