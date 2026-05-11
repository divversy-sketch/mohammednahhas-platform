
import { BrainCircuit, CheckCircle, AlertTriangle, Target } from '../../shared/icons/lucide-shim.jsx';

const buildAdvice = (metrics = {}) => {
  const branches = Object.entries(metrics.branchStats || {}).map(([branch, data]) => {
    const possible = Number(data?.possible || 0);
    const earned = Number(data?.earned || 0);
    return {
      branch,
      pct: possible > 0 ? Math.round((earned / possible) * 100) : 0,
      wrong: Number(data?.wrong || 0)
    };
  }).sort((a, b) => a.pct - b.pct);
  return { weak: branches.filter((b) => b.pct < 70).slice(0, 3), strong: [...branches].sort((a, b) => b.pct - a.pct).slice(0, 2) };
};

export default function StudentLocalAdvice({ metrics }) {
  const { weak, strong } = buildAdvice(metrics);
  const percentage = Number(metrics?.percentage || 0);
  return (
    <div className="mt-5 bg-slate-900/70 border border-slate-700 rounded-2xl p-4">
      <h3 className="font-black text-amber-300 mb-3 flex items-center gap-2"><BrainCircuit size={20} /> تحليل ذكي داخلي</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white/5 rounded-xl p-3 border border-white/10"><p className="text-slate-400 text-xs">النسبة العامة</p><p className="text-2xl font-black text-white">{percentage}%</p></div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10"><p className="text-slate-400 text-xs">الدرجة</p><p className="text-2xl font-black text-emerald-300">{metrics?.totalScore || 0}/{metrics?.totalPossible || 0}</p></div>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10"><p className="text-slate-400 text-xs">عدد الفروع</p><p className="text-2xl font-black text-blue-300">{Object.keys(metrics?.branchStats || {}).length}</p></div>
      </div>
      {weak.length === 0 ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-200 font-bold flex gap-2"><CheckCircle size={18} /> ممتاز يا بطل. ركز فقط على تثبيت المستوى وحل أسئلة متنوعة.</div>
      ) : (
        <div className="space-y-2">{weak.map((b) => <div key={b.branch} className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-slate-100"><p className="font-black text-red-300 flex items-center gap-2"><AlertTriangle size={16} /> راجع فرع: {b.branch}</p><p className="text-sm mt-1">نسبتك فيه {b.pct}% وعندك {b.wrong} أخطاء. ابدأ بمراجعة القاعدة، ثم حل 10 أسئلة قصيرة، وبعدها ارجع لبنك الأخطاء.</p></div>)}</div>
      )}
      {strong.length > 0 && <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-blue-100 text-sm"><p className="font-black mb-1 flex items-center gap-2"><Target size={16} /> نقاط قوتك</p><p>{strong.map((s) => `${s.branch} (${s.pct}%)`).join(' - ')}</p></div>}
    </div>
  );
}
