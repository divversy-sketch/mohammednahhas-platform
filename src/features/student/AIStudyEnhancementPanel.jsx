import React, { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, PenTool } from '../../shared/icons/lucide-shim.jsx';
import { auth } from '../../services/firebase';

const safeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getAdminAIHeaders = async () => {
  const token = await auth?.currentUser?.getIdToken?.();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const resultPercentage = (result) => {
  const total = safeNumber(result?.total, 0);
  if (safeNumber(result?.percentage, -1) >= 0) return safeNumber(result.percentage, 0);
  return total > 0 ? Math.round((safeNumber(result?.score, 0) / total) * 100) : 0;
};

export default function AIStudyEnhancementPanel({ user, userData, examResults = [], mistakes = [] }) {
  const memoryKey = `nahhas_ai_memory_${user?.uid || user?.email || 'guest'}`;
  const [memory, setMemory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(memoryKey) || '{}'); } catch { return {}; }
  });
  const [answerDraft, setAnswerDraft] = useState('');
  const [modelAnswerDraft, setModelAnswerDraft] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const smartMemory = useMemo(() => {
    const completed = (examResults || []).filter(r => r.status === 'completed' || r.score !== undefined).slice(0, 8);
    const avg = completed.length ? Math.round(completed.reduce((sum, r) => sum + resultPercentage(r), 0) / completed.length) : 0;
    const branches = {};
    completed.forEach(r => {
      const stats = r.performanceAnalysis?.branchStats || r.branchStats || r.branchAnalysis || {};
      Object.entries(stats).forEach(([branch, data]) => {
        branches[branch] = branches[branch] || { earned: 0, possible: 0, wrong: 0 };
        branches[branch].earned += safeNumber(data.earned, 0);
        branches[branch].possible += safeNumber(data.possible, safeNumber(data.total, 0));
        branches[branch].wrong += safeNumber(data.wrong, 0);
      });
    });
    const weak = Object.entries(branches)
      .map(([branch, d]) => ({ branch, pct: d.possible > 0 ? Math.round((d.earned / d.possible) * 100) : 0, wrong: d.wrong }))
      .filter(x => x.pct < 75 || x.wrong > 0)
      .sort((a, b) => a.pct - b.pct)[0] || null;
    return { averageScore: avg, weakestBranch: weak, mistakesCount: (mistakes || []).length, lastUpdated: new Date().toISOString() };
  }, [examResults, mistakes]);

  useEffect(() => {
    const next = { ...memory, ...smartMemory };
    try { localStorage.setItem(memoryKey, JSON.stringify(next)); } catch {}
    setMemory(next);
  }, [smartMemory.averageScore, smartMemory.weakestBranch?.branch, smartMemory.mistakesCount]);

  const localCorrection = () => ({
    score: answerDraft.trim().length > 80 ? 'جيد مبدئيًا' : 'يحتاج تطوير',
    summary: answerDraft.trim().length > 80 ? 'إجابتك فيها فكرة واضحة، لكن راجع ترتيب النقاط والشواهد.' : 'الإجابة قصيرة. زود الفكرة الأساسية ومثال أو شاهد مناسب.',
    improvements: ['ابدأ بجملة مباشرة تجيب عن المطلوب.', 'استخدم مثالًا أو شاهدًا يدعم كلامك.', 'راجع الإملاء وعلامات الترقيم قبل التسليم.']
  });

  const correctAnswer = async () => {
    if (!answerDraft.trim()) return alert('اكتب إجابتك أولًا.');
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: await getAdminAIHeaders(),
        body: JSON.stringify({
          mode: 'essay_correction',
          language: 'ar-EG',
          grade: userData?.grade || '',
          studentName: userData?.name || user?.displayName || 'طالب',
          studentAnswer: answerDraft,
          modelAnswer: modelAnswerDraft,
          studentMemory: memory,
          instruction: 'صحح إجابة الطالب بالعربية بإيجاز. أرجع summary وscore وimprovements.'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data.error || 'AI busy');
      const ai = data.analysis || data.data || {};
      setResult({
        score: ai.score || ai.grade || 'تقييم AI',
        summary: ai.summary || ai.feedback || ai.answer || localCorrection().summary,
        improvements: Array.isArray(ai.improvements) ? ai.improvements : Array.isArray(ai.recommendations) ? ai.recommendations : localCorrection().improvements
      });
    } catch {
      setResult(localCorrection());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
        <h3 className="font-black text-slate-900 mb-3 flex items-center gap-2"><BrainCircuit className="text-sky-600"/> ذاكرة المساعد</h3>
        <div className="space-y-2 text-sm font-bold text-slate-700">
          <p>متوسط آخر نتائجك: <span className="text-sky-700">{memory.averageScore || 0}%</span></p>
          <p>أكثر فرع محتاج تركيز: <span className="text-amber-700">{memory.weakestBranch?.branch || 'غير محدد بعد'}</span></p>
          <p>عدد الأسئلة للمساعد: <span className="text-emerald-700">{safeNumber(memory.questionsCount, 0)}</span></p>
        </div>
        <button onClick={() => { localStorage.removeItem(memoryKey); setMemory({}); }} className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-black">مسح الذاكرة</button>
      </div>

      <div className="xl:col-span-2 glass-panel rounded-3xl p-5 border-t-4 border-purple-600">
        <h3 className="font-black text-xl text-slate-900 mb-4 flex items-center gap-2"><PenTool className="text-purple-600"/> تصحيح إجابة مقالية</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <textarea rows={6} className="border rounded-2xl p-4 resize-none focus:border-purple-500 outline-none" placeholder="اكتب إجابتك هنا..." value={answerDraft} onChange={e=>setAnswerDraft(e.target.value)} />
          <textarea rows={6} className="border rounded-2xl p-4 resize-none focus:border-purple-500 outline-none" placeholder="نموذج الإجابة اختياري..." value={modelAnswerDraft} onChange={e=>setModelAnswerDraft(e.target.value)} />
        </div>
        <button disabled={loading} onClick={correctAnswer} className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl font-black disabled:opacity-50">{loading ? 'جاري التصحيح...' : 'صحح الإجابة'}</button>
        {result && <div className="mt-4 bg-purple-50 border border-purple-100 rounded-3xl p-4"><p className="font-black text-purple-800 mb-2">التقييم: {result.score}</p><p className="font-bold text-slate-700 leading-relaxed mb-3">{result.summary}</p><div className="space-y-2">{(result.improvements || []).map((x,i)=><div key={i} className="bg-white border border-purple-100 rounded-2xl p-3 text-sm font-bold text-slate-700">{i+1}. {x}</div>)}</div></div>}
      </div>
    </div>
  );
}
