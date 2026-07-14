function isQuestionAnswered(question, answers) {
  const value = answers?.[question.id];
  return value !== undefined && value !== '' && value !== null;
}

function getQuestionStatusClass({ question, answers, flagged, isSubmitted, isCurrent }) {
  const isAnswered = isQuestionAnswered(question, answers);
  if (isCurrent) return 'bg-gradient-to-br from-indigo-500 to-violet-700 text-white border-indigo-500 shadow-lg shadow-indigo-200';
  if (isSubmitted) {
    if (question.type === 'essay') return isAnswered ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-400 border-slate-200';
    if (answers?.[question.id] === question.correctIdx) return 'bg-emerald-500 text-white border-emerald-500';
    if (isAnswered) return 'bg-rose-500 text-white border-rose-500';
    return 'bg-white text-slate-400 border-slate-200';
  }
  if (flagged?.[question.id]) return 'bg-amber-400 text-slate-900 border-amber-400';
  if (isAnswered) return 'bg-emerald-500 text-white border-emerald-500';
  return 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50';
}

export default function ExamQuestionNavigator({ displayQuestions = [], flatQuestions = [], answers = {}, flagged = {}, isSubmitted, currentQIndex, onSelectQuestion }) {
  const answeredCount = displayQuestions.filter((question) => isQuestionAnswered(question, answers)).length;
  const flaggedCount = displayQuestions.filter((question) => flagged?.[question.id]).length;

  return (
    <aside className="order-2 flex w-full shrink-0 flex-col border-t border-slate-200 bg-white/90 p-3 shadow-[0_-8px_28px_rgba(15,23,42,0.05)] backdrop-blur md:order-none md:w-72 md:border-l md:border-t-0 md:p-5 md:shadow-[-8px_0_28px_rgba(15,23,42,0.04)]">
      <div className="mb-4 hidden md:block">
        <h2 className="text-center text-base font-black text-slate-900">التنقل بين الأسئلة</h2>
        <p className="mt-1 text-center text-xs font-bold text-slate-500">اختر رقم السؤال للانتقال إليه</p>
      </div>

      <div className="grid max-h-28 grid-flow-col grid-rows-2 gap-2 overflow-x-auto pb-1 md:max-h-none md:flex-1 md:grid-flow-row md:grid-cols-5 md:grid-rows-none md:content-start md:overflow-y-auto md:overflow-x-hidden md:pb-4 scrollbar-hide">
        {displayQuestions.map((question, idx) => {
          const originalIndex = flatQuestions.findIndex((origQ) => origQ.id === question.id) + 1;
          const statusClass = getQuestionStatusClass({ question, answers, flagged, isSubmitted, isCurrent: currentQIndex === idx });
          return (
            <button key={question.id || idx} onClick={() => onSelectQuestion(idx)} className={`relative h-10 min-w-10 rounded-xl border text-sm font-black transition-all md:aspect-square md:h-auto md:min-w-0 ${statusClass}`} aria-label={`السؤال ${originalIndex}`}>
              {originalIndex}
              {flagged?.[question.id] && !isSubmitted && currentQIndex !== idx && <span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-500" />}
            </button>
          );
        })}
      </div>

      <div className="mt-3 hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 md:block">
        <h3 className="mb-3 text-sm font-black text-slate-800">مفتاح الحالات</h3>
        <div className="space-y-2 text-xs font-bold text-slate-600">
          <div className="flex items-center justify-between"><span>تمت الإجابة</span><span className="h-3 w-3 rounded bg-emerald-500" /></div>
          <div className="flex items-center justify-between"><span>للمراجعة</span><span className="h-3 w-3 rounded bg-amber-400" /></div>
          <div className="flex items-center justify-between"><span>لم تتم الإجابة</span><span className="h-3 w-3 rounded border border-slate-300 bg-white" /></div>
          <div className="flex items-center justify-between"><span>السؤال الحالي</span><span className="h-3 w-3 rounded bg-indigo-600" /></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 text-center">
          <div><div className="text-lg font-black text-emerald-600">{answeredCount}</div><div className="text-[10px] text-slate-500">مجاب</div></div>
          <div><div className="text-lg font-black text-amber-600">{flaggedCount}</div><div className="text-[10px] text-slate-500">مراجعة</div></div>
        </div>
      </div>
    </aside>
  );
}
