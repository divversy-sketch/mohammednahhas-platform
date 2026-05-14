
import { CheckCircle, Layout, Timer } from '../../../shared/icons/lucide-shim.jsx';

export default function ExamTopBar({
  exam,
  isSubmitted,
  timeLeft,
  activeBranchTab,
  uniqueBranches = [],
  onDashboard,
  onSubmit,
  onBranchChange,
  onFullscreen,
}) {
  return (
    <div className="bg-slate-900 text-white p-4 flex flex-col md:flex-row justify-between items-center shadow-md relative z-50 gap-4">
      <div className="flex items-center gap-4 w-full md:w-auto justify-between">
        {isSubmitted && (
          <button onClick={onDashboard} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 shadow-sm text-sm">
            <Layout size={16} /> العودة للنتيجة
          </button>
        )}
        <h2 className="font-bold text-lg font-sans text-amber-400 truncate hidden md:block">{exam?.title} {isSubmitted ? '(مراجعة الإجابات)' : ''}</h2>
        {!isSubmitted && (
          <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
            <div className="bg-slate-800 px-4 md:px-6 py-2 rounded-full font-mono shadow-inner border border-slate-700 font-bold text-amber-400 text-base md:text-lg flex items-center gap-2">
              <Timer size={18} /> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </div>
            <button
              onClick={onFullscreen}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-3 md:px-4 py-2 rounded-xl font-black transition whitespace-nowrap flex items-center gap-2 shadow-lg"
              title="تفعيل ملء الشاشة"
            >
              <Layout size={18} /> ملء الشاشة
            </button>
            <button onClick={onSubmit} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2 shadow-lg">
              <CheckCircle size={18} /> تسليم
            </button>
          </div>
        )}
      </div>

      {isSubmitted && (
        <div className="flex flex-wrap gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide items-center">
          <button
            onClick={() => onBranchChange('الكل')}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-colors ${activeBranchTab === 'الكل' ? 'bg-emerald-500 text-slate-900 shadow-md' : 'bg-emerald-900/40 text-emerald-200 hover:bg-emerald-900/60'}`}
          >
            مراجعة الامتحان كله
          </button>
          {uniqueBranches.filter(branch => branch !== 'الكل').map((branch, i) => (
            <button
              key={i}
              onClick={() => onBranchChange(branch)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-colors ${activeBranchTab === branch ? 'bg-amber-500 text-slate-900 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              {branch}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
