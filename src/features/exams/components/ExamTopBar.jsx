import { CheckCircle, Layout, Timer } from '../../../shared/icons/lucide-shim.jsx';

function formatTime(timeLeft = 0) {
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = Math.max(0, timeLeft % 60);
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

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
  const questionCount = Number(exam?.questionCount || exam?.questions?.length || 0);

  return (
    <header className="relative z-50 border-b border-slate-200/80 bg-white/95 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-3 px-3 py-3 md:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-700 text-2xl text-white shadow-lg shadow-indigo-200">◆</div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-black text-slate-900 md:text-xl">
              {exam?.title || 'الامتحان'} {isSubmitted ? '— مراجعة الإجابات' : ''}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-500 md:text-sm">
              {exam?.grade && <span>{exam.grade}</span>}
              {exam?.subject && <><span className="text-slate-300">•</span><span>{exam.subject}</span></>}
              {questionCount > 0 && <><span className="text-slate-300">•</span><span>{questionCount} سؤال</span></>}
              {exam?.totalScore && <><span className="text-slate-300">•</span><span>الدرجة الكلية: {exam.totalScore}</span></>}
            </div>
          </div>
        </div>

        {!isSubmitted ? (
          <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end">
            <div className="order-2 flex min-w-[156px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-center lg:order-none">
              <Timer size={20} className="text-slate-600" />
              <div>
                <div className="text-[11px] font-bold text-slate-500">الوقت المتبقي</div>
                <div className="font-mono text-lg font-black tracking-wider text-indigo-600 md:text-xl">{formatTime(timeLeft)}</div>
              </div>
            </div>
            <button onClick={onFullscreen} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700" title="ملء الشاشة">
              <Layout size={19} />
            </button>
            <button onClick={onSubmit} className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-black text-rose-600 transition hover:bg-rose-50">
              إنهاء الامتحان
            </button>
          </div>
        ) : (
          <button onClick={onDashboard} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-slate-800">
            العودة إلى النتيجة
          </button>
        )}
      </div>

      {isSubmitted && (
        <div className="border-t border-slate-100 px-3 pb-3 md:px-6">
          <div className="mx-auto flex max-w-[1700px] gap-2 overflow-x-auto pt-3 scrollbar-hide">
            <button onClick={() => onBranchChange('الكل')} className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-black transition ${activeBranchTab === 'الكل' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>الامتحان كله</button>
            {uniqueBranches.filter((branch) => branch !== 'الكل').map((branch) => (
              <button key={branch} onClick={() => onBranchChange(branch)} className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-black transition ${activeBranchTab === branch ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{branch}</button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
