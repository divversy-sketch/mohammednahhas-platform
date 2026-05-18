import { useState, useEffect, useCallback } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '../../services/firebase.js';
import { Trash2, BookOpen, ClipboardList } from '../../shared/icons/lucide-shim.jsx';

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */

function parseQuestionBlock(block) {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return null;

  let questionText = '';
  let label = '';
  let options = [];
  let correctIdx = -1;
  let explanation = '';
  let questionStarted = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // شرح
    if (/^(شرح|الشرح)\s*:/i.test(line)) {
      explanation = line.replace(/^(شرح|الشرح)\s*:\s*/i, '').trim();
      continue;
    }

    // خيار: يبدأ بـ * أو -
    if (line.startsWith('*') || line.startsWith('-')) {
      const isCorrect = line.startsWith('*');
      const text = line.replace(/^[*\-]\s*/, '').trim();
      if (isCorrect) correctIdx = options.length;
      options.push(text);
      questionStarted = true;
      continue;
    }

    // label: ثانوية أو نموذج
    const labelMatch = line.match(/(ثانوية عامة|نموذج استرشادي)\s*\d*/i);
    if (labelMatch && !questionStarted && !questionText) {
      label = line.trim();
      continue;
    }

    // نص السؤال
    if (!questionStarted) {
      questionText += (questionText ? ' ' : '') + line;
    }
  }

  if (!questionText.trim() || options.length < 2 || correctIdx === -1) return null;
  return { questionText: questionText.trim(), label, options, correctIdx, explanation };
}

function labelColor(label) {
  if (/ثانوية عامة/i.test(label)) return { bg: '#1a237e', text: '#fff' };
  if (/نموذج استرشادي/i.test(label)) return { bg: '#1b5e20', text: '#fff' };
  return { bg: '#37474f', text: '#fff' };
}

/* ══════════════════════════════════════════════
   ADMIN PANEL
══════════════════════════════════════════════ */
export function AdminReviewQuizPanel() {
  const [bulk, setBulk]           = useState('');
  const [preview, setPreview]     = useState([]);
  const [saving, setSaving]       = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [grade, setGrade]         = useState('all');

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'review_questions'), orderBy('createdAt', 'desc')));
      setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const handlePreview = () => {
    const blocks = bulk.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
    setPreview(blocks.map(parseQuestionBlock).filter(Boolean));
  };

  const handleSave = async () => {
    if (!preview.length) return;
    setSaving(true);
    try {
      for (const q of preview) {
        await addDoc(collection(db, 'review_questions'), { ...q, grade, createdAt: serverTimestamp() });
      }
      setBulk(''); setPreview([]);
      await loadQuestions();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('حذف السؤال؟')) return;
    await deleteDoc(doc(db, 'review_questions', id));
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  return (
    <div className="space-y-6 font-['Cairo']" dir="rtl">

      {/* إضافة */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
          <ClipboardList size={20} className="text-amber-500" />
          إضافة أسئلة مراجعة سريعة
        </h2>
        <p className="text-sm text-slate-500 mb-4">فصل بين كل سؤال بسطر فارغ — تقدر تضيف أسئلة كتيرة مرة واحدة</p>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 text-sm text-amber-900 leading-7">
          <strong>طريقة الكتابة:</strong><br />
          <span className="font-mono text-xs bg-amber-100 rounded px-1">ثانوية عامة 2020</span> أو <span className="font-mono text-xs bg-amber-100 rounded px-1">نموذج استرشادي 2023</span> (سطر منفصل)<br />
          نص السؤال<br />
          <span className="font-mono text-xs bg-amber-100 rounded px-1">*الإجابة الصحيحة</span> (نجمة قبلها)<br />
          <span className="font-mono text-xs bg-amber-100 rounded px-1">-إجابة خاطئة</span><br />
          <span className="font-mono text-xs bg-amber-100 rounded px-1">شرح: نص الشرح</span> (اختياري)
        </div>

        <div className="mb-3">
          <label className="block text-sm font-bold text-slate-700 mb-1">المرحلة</label>
          <select className="border border-slate-200 rounded-xl p-2 text-sm w-48" value={grade} onChange={e => setGrade(e.target.value)}>
            <option value="all">كل المراحل</option>
            <option value="1sec">الأول الثانوي</option>
            <option value="2sec">الثاني الثانوي</option>
            <option value="3sec">الثالث الثانوي</option>
          </select>
        </div>

        <textarea
          value={bulk}
          onChange={e => setBulk(e.target.value)}
          rows={12}
          placeholder={`ثانوية عامة 2020\nما عاصمة مصر؟\n*القاهرة\n-الإسكندرية\n-الجيزة\n-أسوان\nشرح: القاهرة هي العاصمة الإدارية\n\nنموذج استرشادي 2023\nكم يساوي 2+2؟\n*4\n-3\n-5\n-6`}
          className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-mono leading-7 resize-y focus:outline-none focus:border-amber-400"
          dir="rtl"
        />

        <div className="flex gap-3 mt-3 flex-wrap">
          <button onClick={handlePreview} disabled={!bulk.trim()}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-slate-700 transition">
            معاينة
          </button>
          {preview.length > 0 && (
            <button onClick={handleSave} disabled={saving}
              className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 hover:bg-amber-600 transition">
              {saving ? 'جاري الحفظ...' : `حفظ ${preview.length} سؤال`}
            </button>
          )}
        </div>

        {preview.length > 0 && (
          <div className="mt-5 space-y-3">
            <p className="text-sm font-bold text-slate-600">معاينة ({preview.length} سؤال):</p>
            {preview.map((q, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                {q.label && (
                  <span className="inline-block text-[11px] font-black text-white rounded-lg px-3 py-0.5 mb-2"
                    style={{ background: labelColor(q.label).bg }}>{q.label}</span>
                )}
                <p className="font-bold text-slate-800 mb-2">{q.questionText}</p>
                <div className="space-y-1">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className={`text-sm px-3 py-1 rounded-lg ${oi === q.correctIdx ? 'bg-green-100 text-green-800 font-bold' : 'text-slate-500'}`}>
                      {oi === q.correctIdx ? '✓ ' : '- '}{opt}
                    </div>
                  ))}
                </div>
                {q.explanation && <p className="text-xs text-blue-700 mt-2 bg-blue-50 rounded-lg px-3 py-1.5">💡 {q.explanation}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* قائمة الموجودة */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-teal-600" />
          الأسئلة المضافة ({questions.length})
        </h3>
        {loading ? <p className="text-slate-400 text-sm">جاري التحميل...</p>
          : questions.length === 0 ? <p className="text-slate-400 text-sm">لم تُضف أسئلة بعد.</p>
          : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {questions.map(q => (
                <div key={q.id} className="flex items-start gap-3 border border-slate-100 rounded-2xl p-3 hover:bg-slate-50">
                  <div className="flex-1 min-w-0">
                    {q.label && (
                      <span className="inline-block text-[10px] font-black text-white rounded px-2 py-0.5 mb-1"
                        style={{ background: labelColor(q.label).bg }}>{q.label}</span>
                    )}
                    <p className="text-sm font-bold text-slate-800 truncate">{q.questionText}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{q.options.length} اختيارات · {q.grade || 'كل المراحل'}</p>
                  </div>
                  <button onClick={() => handleDelete(q.id)} className="text-red-400 hover:text-red-600 shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   STUDENT QUIZ — تصميم الصورة
══════════════════════════════════════════════ */
export function StudentReviewQuiz({ userData }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [current, setCurrent]     = useState(0);
  const [chosen, setChosen]       = useState(null);
  const [score, setScore]         = useState(0);
  const [finished, setFinished]   = useState(false);

  const grade = userData?.grade || 'all';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'review_questions'), orderBy('createdAt', 'desc')));
        let all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        all = all.filter(q => !q.grade || q.grade === 'all' || q.grade === grade);
        all = all.sort(() => Math.random() - 0.5);
        setQuestions(all);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [grade]);

  const q = questions[current];

  const handleChoice = (idx) => {
    if (chosen !== null) return;
    setChosen(idx);
    if (idx === q.correctIdx) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) { setFinished(true); return; }
    setCurrent(c => c + 1);
    setChosen(null);
  };

  const handleRestart = () => {
    setQuestions(prev => [...prev].sort(() => Math.random() - 0.5));
    setCurrent(0); setChosen(null); setScore(0); setFinished(false);
  };

  /* تحميل */
  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0d1b2a,#1a2744)' }}>
      <p style={{ color: '#c9a84c', fontWeight: 900, fontSize: 16 }}>جاري تحميل الأسئلة...</p>
    </div>
  );

  if (!questions.length) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0d1b2a,#1a2744)' }}>
      <p style={{ color: '#94a3b8', fontWeight: 700 }}>لا توجد أسئلة مراجعة متاحة حالياً.</p>
    </div>
  );

  /* نهاية */
  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg,#0d1b2a 0%,#1a2744 60%,#0d1b2a 100%)', padding: 16 }}
        dir="rtl" className="font-['Cairo']">
        <div style={{ background: 'linear-gradient(160deg,#f5efe0,#ede8d8)', border: '4px solid #c9a84c',
          borderRadius: 28, boxShadow: '0 0 60px rgba(201,168,76,.35)', padding: '40px 32px',
          maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{pct >= 80 ? '🏆' : pct >= 60 ? '💪' : '📚'}</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a1a', marginBottom: 8 }}>انتهت جلسة المراجعة!</h2>
          <p style={{ fontSize: 40, fontWeight: 900, marginBottom: 4,
            color: pct >= 80 ? '#2e7d32' : pct >= 60 ? '#e65100' : '#c62828' }}>
            {score} / {questions.length}
          </p>
          <p style={{ fontSize: 18, color: '#666', marginBottom: 24 }}>{pct}%</p>
          <button onClick={handleRestart}
            style={{ background: 'linear-gradient(135deg,#c9a84c,#a07930)', color: '#fff',
              border: 'none', borderRadius: 14, padding: '12px 32px', fontSize: 16,
              fontWeight: 900, cursor: 'pointer' }}>
            إعادة المراجعة
          </button>
        </div>
      </div>
    );
  }

  /* سؤال */
  const isCorrect = chosen === q?.correctIdx;

  return (
    <div dir="rtl" className="font-['Cairo']"
      style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0d1b2a 0%,#1a2744 60%,#0d1b2a 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'flex-start', padding: '24px 12px 40px' }}>

      {/* counter */}
      <p style={{ color: '#c9a84c', fontWeight: 900, fontSize: 13, marginBottom: 14 }}>
        سؤال {current + 1} من {questions.length} &nbsp;·&nbsp; نتيجتك: {score}
      </p>

      {/* البطاقة */}
      <div style={{ background: 'linear-gradient(160deg,#f5efe0,#ede8d8)',
        border: '3px solid #c9a84c', borderRadius: 24,
        boxShadow: '0 0 50px rgba(201,168,76,.3), inset 0 0 30px rgba(255,255,255,.4)',
        width: '100%', maxWidth: 680, padding: '32px 20px 22px', position: 'relative' }}>

        {/* شارة العنوان */}
        <div style={{ position: 'absolute', top: -20, right: 16,
          background: 'linear-gradient(135deg,#1a1a1a,#2d2d2d)',
          border: '2px solid #c9a84c', borderRadius: 12,
          padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15 }}>❓</span>
          <span style={{ color: '#f5c842', fontWeight: 900, fontSize: 12 }}>أسئلة مراجعة سريعة</span>
        </div>

        {/* السؤال */}
        <div style={{ border: '2px solid #c0392b', borderRadius: 14,
          padding: '14px 18px 14px 38px', marginBottom: 8,
          background: 'rgba(255,255,255,.45)', position: 'relative', minHeight: 72,
          display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            width: 14, height: 14, borderRadius: '50%', background: '#1a1a1a' }} />
          <p style={{ fontWeight: 900, fontSize: 16, color: '#1a1a1a', lineHeight: 1.6, flex: 1 }}>
            {q.questionText}
          </p>
        </div>

        {/* label */}
        {q.label && (
          <div style={{ textAlign: 'left', marginBottom: 10 }}>
            <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 900,
              padding: '3px 12px', borderRadius: 8,
              background: labelColor(q.label).bg, color: labelColor(q.label).text }}>
              {q.label}
            </span>
          </div>
        )}

        {/* الاختيارات */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {q.options.map((opt, i) => {
            let borderColor = '#c0392b';
            let bgColor = 'transparent';
            let textColor = '#1a1a1a';
            let dotColor = '#c0392b';

            if (chosen !== null) {
              if (i === q.correctIdx) {
                borderColor = '#2e7d32'; bgColor = 'rgba(46,125,50,.13)';
                textColor = '#1b5e20'; dotColor = '#2e7d32';
              } else if (i === chosen) {
                borderColor = '#c62828'; bgColor = 'rgba(198,40,40,.1)';
                textColor = '#7f0000'; dotColor = '#c62828';
              } else {
                textColor = '#999';
              }
            }

            return (
              <button key={i} onClick={() => handleChoice(i)}
                disabled={chosen !== null}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px 10px 38px', border: `2px solid ${borderColor}`,
                  borderRadius: 12, background: bgColor, color: textColor,
                  fontWeight: 700, fontSize: 15, cursor: chosen !== null ? 'default' : 'pointer',
                  transition: 'all .2s', position: 'relative', textAlign: 'right', width: '100%' }}>
                {opt}
                <span style={{ position: 'absolute', left: 12, width: 14, height: 14,
                  borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                {chosen !== null && i === q.correctIdx && <span style={{ color: '#2e7d32', fontWeight: 900 }}>✓</span>}
                {chosen === i && i !== q.correctIdx && <span style={{ color: '#c62828', fontWeight: 900 }}>✗</span>}
              </button>
            );
          })}
        </div>

        {/* الشرح */}
        {chosen !== null && q.explanation && (
          <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 12,
            background: isCorrect ? 'rgba(46,125,50,.1)' : 'rgba(198,40,40,.07)',
            border: `1px solid ${isCorrect ? '#2e7d32' : '#c62828'}`,
            color: '#1a1a1a', fontSize: 14, fontWeight: 600, lineHeight: 1.7 }}>
            💡 <strong>الشرح:</strong> {q.explanation}
          </div>
        )}

        {/* زر التالي */}
        {chosen !== null && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <span style={{ fontWeight: 900, fontSize: 15, color: isCorrect ? '#2e7d32' : '#c62828' }}>
              {isCorrect ? '✅ إجابة صحيحة!' : '❌ إجابة خاطئة'}
            </span>
            <button onClick={handleNext}
              style={{ background: 'linear-gradient(135deg,#c9a84c,#a07930)', color: '#fff',
                border: 'none', borderRadius: 12, padding: '10px 24px',
                fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>
              {current + 1 < questions.length ? 'السؤال التالي ←' : 'انهاء المراجعة'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
