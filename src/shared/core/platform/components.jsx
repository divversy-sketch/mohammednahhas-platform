import { useEffect, useState } from 'react';
import { BrainCircuit, PenTool } from '../../icons/lucide-shim.jsx';
import { safeNumber, getReviewRecommendations } from './metrics.js';

export const InlineTabs = ({ tabs = [], defaultTab }) => {
  const visibleTabs = tabs.filter(Boolean);
  const [activeKey, setActiveKey] = useState(defaultTab || visibleTabs[0]?.key);
  const current = visibleTabs.find(tab => tab.key === activeKey) || visibleTabs[0];
  useEffect(() => {
    if (visibleTabs.length && !visibleTabs.some(tab => tab.key === activeKey)) {
      setActiveKey(visibleTabs[0].key);
    }
  }, [activeKey, visibleTabs.map(tab => tab.key).join('|')]);
  if (!visibleTabs.length) return null;
  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-20 bg-white/85 backdrop-blur-xl border border-slate-100 rounded-2xl p-2 shadow-sm overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {visibleTabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveKey(tab.key)}
              className={`px-4 py-2.5 rounded-xl font-black text-sm transition whitespace-nowrap ${current?.key === tab.key ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div>{current?.content}</div>
    </div>
  );
};

export const TabPaneCard = ({ children, className = '' }) => (
  <div className={`glass-panel p-4 md:p-6 rounded-2xl ${className}`}>{children}</div>
);

export const StudentLocalAdvice = ({ metrics = {}, content = [] }) => {
  const branches = Object.entries(metrics?.branchStats || {}).map(([branch, data]) => ({ branch, pct: data.possible > 0 ? Math.round((safeNumber(data.earned, 0) / safeNumber(data.possible, 0)) * 100) : 0, wrong: safeNumber(data.wrong, 0) })).sort((a,b)=>a.pct-b.pct);
  const weakBranches = branches.filter(b => b.pct < 70).slice(0, 3);
  const recommendations = getReviewRecommendations(metrics?.branchStats || {}, content || []);
  return <div className="mt-5 bg-slate-900/70 border border-slate-700 rounded-3xl p-5 text-slate-100"><div className="flex items-center gap-2 mb-4"><BrainCircuit className="text-amber-400"/><h3 className="font-black text-xl">تحليل ذكي داخلي</h3></div><p className="text-sm text-slate-300 mb-4">التحليل مبني على إجابات الطالب ونسب الفروع داخل المنصة فقط، داخليًا.</p>{weakBranches.length===0?<div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-emerald-200 font-bold">ممتاز يا بطل. لا توجد فروع أقل من 70%. راجع الأخطاء الفردية وحافظ على مستواك.</div>:<div className="space-y-3">{weakBranches.map((b,idx)=>{const rec=recommendations.find(r=>r.branch===b.branch);return <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4"><div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2"><p className="font-black text-red-300">راجع فرع: {b.branch}</p><span className="text-xs bg-red-500/20 text-red-200 px-3 py-1 rounded-full font-bold">{b.pct}%</span></div><p className="text-sm text-slate-200 leading-relaxed">عندك {b.wrong} أخطاء في هذا الفرع. ابدأ بمراجعة القاعدة، ثم حل أسئلة قصيرة، وبعدها ارجع لبنك الأخطاء.</p>{rec?.title && <p className="text-xs text-amber-200 mt-2">اقتراح مراجعة: {rec.title}</p>}</div>})}</div>}</div>;
};

export const StudentLocalHomeCoach = ({ userResults = [], content = [] }) => { const branchStats={}; (userResults||[]).slice(0,10).forEach(r=>{const stats=r?.branchStats||r?.performanceAnalysis?.branchStats||r?.branchAnalysis||{}; Object.entries(stats).forEach(([branch,d])=>{branchStats[branch]=branchStats[branch]||{earned:0,possible:0,wrong:0}; branchStats[branch].earned+=safeNumber(d.earned,0); branchStats[branch].possible+=safeNumber(d.possible,d.total||0); branchStats[branch].wrong+=safeNumber(d.wrong,0);});}); return <StudentLocalAdvice metrics={{branchStats}} content={content}/>; };

export const LocalQuestionExplanation = ({ question, answers }) => { if(!question||question.type==='essay') return null; const selectedIdx=answers?.[question.id]; const correctIdx=safeNumber(question.correctIdx,0); const selectedText=selectedIdx!==undefined?question.options?.[selectedIdx]:'لم يتم اختيار إجابة'; const correctText=question.options?.[correctIdx]||'غير محدد'; const isCorrect=selectedIdx===correctIdx; return <div className={`mb-6 rounded-2xl p-4 border ${isCorrect?'bg-emerald-50 border-emerald-200 text-emerald-800':'bg-amber-50 border-amber-200 text-amber-900'}`}><h4 className="font-black mb-2">شرح المنصة بدون النظام</h4><p className="text-sm font-bold">إجابتك: {selectedText}</p><p className="text-sm font-bold">الإجابة الصحيحة: {correctText}</p>{question.explanation?<p className="text-sm mt-2 leading-relaxed">الشرح: {question.explanation}</p>:<p className="text-xs mt-2 opacity-80">راجع قاعدة هذا السؤال من فرع {question.branch || 'الدرس'} ثم أعد حل أسئلة مشابهة.</p>}</div>; };

export const LocalEssayReviewBox = ({ question, answer }) => { const answerText=typeof answer==='object'?answer?.text:answer; const hasAnswer=!!String(answerText||'').trim()||!!answer?.image; return <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4"><h4 className="font-black text-purple-800 flex items-center gap-2"><PenTool size={18}/> مراجعة مقالي بدون النظام</h4><p className="text-sm text-purple-700 mt-2">{hasAnswer?'تم حفظ إجابتك المقالية. التصحيح النهائي يتم من الأدمن حاليًا لحين تفعيل خطة النظام المدفوعة.':'لا توجد إجابة مقالية محفوظة لهذا السؤال.'}</p>{question?.modelAnswer&&<p className="text-xs text-slate-600 mt-2"><b>نموذج إجابة:</b> {question.modelAnswer}</p>}</div>; };

