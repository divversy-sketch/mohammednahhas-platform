import React from 'react';
import { Check, ChevronRight, FileText, Flag, HelpCircle, Layers, PenTool, UploadCloud, X } from '../../../shared/icons/lucide-shim.jsx';
import { LocalEssayReviewBox, LocalQuestionExplanation, renderBracketHighlightedText } from '../../../shared/core/platformShared.jsx';

function EssayAnswerEditor({ question, answer, isSubmitted, onAnswer, onImageUpload, onFileDialogOpen }) {
  if (isSubmitted) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="font-bold text-blue-800 mb-2">إجابتك النصية</p>
          <p className="whitespace-pre-wrap text-slate-700">
            {typeof answer === 'object' ? (answer?.text || 'لم يتم إدخال نص') : (answer || 'لم يتم إدخال نص')}
          </p>
        </div>
        {typeof answer === 'object' && answer?.image && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <p className="font-bold text-slate-800 mb-2">الصورة المرفوعة</p>
            <img src={answer.image} alt="إجابة مقالية" className="max-h-80 rounded-xl border border-slate-200 mx-auto" />
          </div>
        )}
        {question.modelAnswer && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <p className="font-bold text-green-800 mb-2">نموذج الإجابة</p>
            <p className="whitespace-pre-wrap text-slate-700">{question.modelAnswer}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <textarea
        className="w-full min-h-[180px] border-2 border-slate-200 rounded-2xl p-4 text-lg focus:border-amber-500 outline-none transition"
        placeholder="اكتب إجابتك المقالية هنا..."
        value={typeof answer === 'object' ? (answer?.text || '') : (answer || '')}
        onChange={(e) => {
          const previousImage = typeof answer === 'object' ? answer?.image : null;
          const previousFileName = typeof answer === 'object' ? answer?.fileName : null;
          onAnswer(question.id, { text: e.target.value, image: previousImage, fileName: previousFileName });
        }}
      />
      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 bg-slate-50">
        <label className="cursor-pointer flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-700 flex items-center gap-2"><UploadCloud size={18} /> أو ارفع صورة لإجابة مكتوبة يدويًا</p>
            <p className="text-sm text-slate-500 mt-1">فتح الكاميرا/الملفات لهذا السؤال لا يُعتبر غشًا.</p>
          </div>
          <span className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold">اختيار صورة</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onClick={onFileDialogOpen}
            onChange={(e) => onImageUpload(question.id, e.target.files?.[0])}
          />
        </label>
        {typeof answer === 'object' && answer?.image && (
          <div className="mt-4">
            <img src={answer.image} alt="إجابة مقالية" className="max-h-64 rounded-xl border border-slate-200 mx-auto" />
            <p className="text-xs text-slate-500 mt-2">{answer?.fileName || 'تم رفع صورة'}</p>
          </div>
        )}
      </div>
    </>
  );
}

function McqAnswerOptions({ question, answer, isSubmitted, onAnswer }) {
  const locked = !isSubmitted && question.lockAfterAnswer && answer !== undefined && answer !== null;
  const feedbackMode = isSubmitted || locked;
  return (
    <div className="space-y-4">
      {(Array.isArray(question.options) ? question.options : []).map((option, idx) => {
        let optionClass = 'border-slate-200 hover:bg-slate-50 bg-white text-slate-700';
        const isSelected = answer === idx;

        if (feedbackMode) {
          if (idx === question.correctIdx) optionClass = 'border-green-500 bg-green-50 text-green-900 shadow-md ring-2 ring-green-200';
          else if (isSelected) optionClass = 'border-red-500 bg-red-50 text-red-900 shadow-md';
          else optionClass = 'border-slate-200 bg-slate-50 opacity-50';
        } else if (isSelected) {
          optionClass = 'border-amber-500 bg-amber-50 text-amber-900 shadow-md transform scale-[1.02] ring-2 ring-amber-200';
        }

        return (
          <div key={idx} onClick={() => { if (!locked) onAnswer(question.id, idx); }} className={`p-5 rounded-2xl border-2 ${locked ? 'cursor-not-allowed' : 'cursor-pointer'} transition-all duration-200 flex items-center gap-4 ${optionClass}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected || (feedbackMode && idx === question.correctIdx) ? 'border-transparent bg-current' : 'border-slate-300'}`}>
              {(feedbackMode && idx === question.correctIdx) && <Check size={16} className="text-white" />}
              {(feedbackMode && isSelected && idx !== question.correctIdx) && <X size={16} className="text-white" />}
            </div>
            <span className="font-['Cairo'] text-xl font-bold leading-relaxed">{option}</span>
            {feedbackMode && idx === question.correctIdx && <span className="mr-auto text-green-600 bg-green-100 px-3 py-1 rounded-lg text-xs font-bold">الإجابة الصحيحة</span>}
            {feedbackMode && isSelected && idx !== question.correctIdx && <span className="mr-auto text-red-600 bg-red-100 px-3 py-1 rounded-lg text-xs font-bold">إجابتك (خطأ)</span>}
          </div>
        );
      })}
    </div>
  );
}

function PaperMcqAnswerOptions({ question, answer, isSubmitted, onAnswer }) {
  const locked = !isSubmitted && question.lockAfterAnswer && answer !== undefined && answer !== null;
  const feedbackMode = isSubmitted || locked;
  const labels = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

  return (
    <div className="space-y-3 md:space-y-4">
      {(Array.isArray(question.options) ? question.options : []).map((option, idx) => {
        const isSelected = answer === idx;
        let stateClass = 'border-[#c8b9a4] bg-[#fffdf6] hover:bg-[#fff6dd] hover:border-[#a8623a] text-[#1f1b18]';
        let badgeClass = 'bg-[#9a5838] text-white shadow-[0_3px_0_rgba(0,0,0,.18)]';
        if (feedbackMode && idx === question.correctIdx) {
          stateClass = 'border-[#189262] bg-[#e9fff5] text-[#075238] shadow-[0_10px_25px_rgba(24,146,98,.16)] ring-2 ring-[#bdf3db]';
          badgeClass = 'bg-[#159462] text-white';
        } else if (feedbackMode && isSelected && idx !== question.correctIdx) {
          stateClass = 'border-[#d33f49] bg-[#fff0f0] text-[#781f26] shadow-[0_10px_25px_rgba(211,63,73,.14)]';
          badgeClass = 'bg-[#d33f49] text-white';
        } else if (feedbackMode) {
          stateClass = 'border-[#e5d8c3] bg-[#f8f1e5] text-[#817263] opacity-60';
          badgeClass = 'bg-[#b7aa99] text-white';
        }

        return (
          <button
            key={idx}
            type="button"
            onClick={() => { if (!locked) onAnswer(question.id, idx); }}
            disabled={locked || isSubmitted}
            className={`group w-full rounded-[1.35rem] border-2 px-3 md:px-5 py-3 md:py-4 text-right transition-all duration-200 flex items-center gap-3 md:gap-4 ${stateClass} ${locked || isSubmitted ? 'cursor-default' : 'cursor-pointer hover:-translate-y-0.5'}`}
          >
            <span className={`grid h-10 w-10 md:h-11 md:w-11 place-items-center rounded-full shrink-0 font-black text-xl ${badgeClass}`}>{labels[idx] || idx + 1}</span>
            <span className="flex-1 text-lg md:text-2xl font-black leading-relaxed" style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>{option}</span>
            {feedbackMode && idx === question.correctIdx && <Check className="h-6 w-6 text-[#159462]" />}
            {feedbackMode && isSelected && idx !== question.correctIdx && <X className="h-6 w-6 text-[#d33f49]" />}
          </button>
        );
      })}
    </div>
  );
}

function PaperQuestionHeader({ title }) {
  return (
    <div className="relative mb-7 flex justify-center select-none">
      <div className="relative px-5 md:px-12 py-2 md:py-4 text-center">
        <span className="absolute inset-x-0 top-1/2 h-11 md:h-16 -translate-y-1/2 -rotate-1 rounded-[30%] bg-[#191212] shadow-[0_10px_0_rgba(117,56,34,.25)]" />
        <span className="absolute -right-5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-[#191212]" />
        <span className="absolute left-3 top-3 h-2 w-10 rotate-[-18deg] rounded-full bg-[#191212]" />
        <h2
          className="relative z-10 text-[2rem] md:text-[4.25rem] font-black leading-[1.05] tracking-tight text-[#b77542]"
          style={{
            fontFamily: "'Cairo', 'Tajawal', sans-serif",
            WebkitTextStroke: '1px rgba(74,35,25,.35)',
            textShadow: '0 2px 0 #fff1d7, 0 5px 0 rgba(64,32,20,.28), 0 10px 20px rgba(0,0,0,.22)',
          }}
        >
          {title || 'أسئلة ثانوية عامة واسترشادي'}
        </h2>
      </div>
      <div className="absolute -left-1 md:left-[9%] top-0 grid h-14 w-16 md:h-20 md:w-24 place-items-center rounded-[1.1rem] bg-[#171532] text-4xl md:text-6xl font-black text-[#d7ad47] shadow-2xl rotate-6 border-2 border-[#d7ad47]">؟</div>
    </div>
  );
}

function SourceStamp({ value }) {
  if (!value) return null;
  return (
    <div className="relative shrink-0 w-24 md:w-32 min-h-[58px] rounded-[0.55rem] border-2 border-[#526174] bg-[#eef7ff] px-2 py-2 text-center text-xs md:text-sm font-black text-[#172334] shadow-[3px_4px_0_rgba(0,0,0,.16)] -rotate-2">
      <span className="absolute -top-2 right-4 h-3 w-7 rounded-b bg-[#d7b45c] opacity-80" />
      <span className="block leading-relaxed whitespace-pre-wrap">{value}</span>
    </div>
  );
}


export default function ExamQuestionPanel({
  question,
  flatQuestions = [],
  displayQuestions = [],
  answers = {},
  flagged = {},
  currentQIndex,
  isSubmitted,
  onAnswer,
  onFlagToggle,
  onImageUpload,
  onFileDialogOpen,
  onPrevious,
  onNext,
}) {
  const answer = answers?.[question.id];
  const questionNumber = flatQuestions.findIndex((origQ) => origQ.id === question.id) + 1;
  const hasBlockText = question?.blockText && question.blockText.trim().length > 0;
  const isPaperStyle = question?.template === 'paper-style';
  const hasAnsweredPaperQuestion = isPaperStyle && answer !== undefined && answer !== null;
  const showPaperExplanation = isSubmitted || hasAnsweredPaperQuestion;

  if (isPaperStyle && question.type !== 'essay') {
    const isCorrect = answer === question.correctIdx;
    const isLastQuestion = currentQIndex === displayQuestions.length - 1;
    return (
      <div className="flex-1 h-full overflow-y-auto bg-[#130e17] p-2 md:p-6" dir="rtl">
        <div className="mx-auto max-w-7xl min-h-full rounded-[2.2rem] border-[3px] border-[#d7b45c] bg-[#fff8ea] p-3 md:p-8 shadow-[0_24px_80px_rgba(0,0,0,.45)] relative overflow-hidden">
          <div className="absolute inset-y-0 right-0 w-2 bg-[#d7b45c] opacity-70" />
          <div className="absolute inset-y-0 left-0 w-2 bg-[#d7b45c] opacity-70" />
          <div className="absolute inset-0 pointer-events-none opacity-70" style={{ backgroundImage: 'radial-gradient(circle at 12% 12%, rgba(215,180,92,.22), transparent 22%), radial-gradient(circle at 86% 90%, rgba(155,63,73,.15), transparent 30%), linear-gradient(135deg, rgba(255,255,255,.45), transparent 35%)' }} />
          <div className="absolute right-4 top-4 h-20 w-20 rounded-full border border-[#d7b45c]/40 opacity-40" />
          <div className="absolute left-8 bottom-6 h-28 w-28 rounded-full border border-[#b75b77]/30 opacity-30" />

          <div className="relative z-10">
            <PaperQuestionHeader title={question.paperTitle} />

            <section className="rounded-[2rem] md:rounded-[2.6rem] border-[3px] md:border-4 border-[#b75b77] bg-[#fffdf7]/95 p-4 md:p-8 shadow-[inset_0_0_0_1px_rgba(255,255,255,.75),0_18px_35px_rgba(80,30,40,.12)]">
              {question.introText && (
                <div className="mb-5 text-center text-xl md:text-3xl font-black leading-loose text-[#24211f]" style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
                  {String(question.introText || '').split('|').map((part, i, arr) => (
                    <React.Fragment key={i}>{renderBracketHighlightedText(part.trim())}{i !== arr.length - 1 && <br />}</React.Fragment>
                  ))}
                </div>
              )}

              <div className="mb-5 flex flex-col md:flex-row items-stretch md:items-center gap-3 rounded-[1.6rem] border-2 border-[#1b1b1b] bg-[#f4fbfb] px-3 md:px-5 py-3 md:py-4 shadow-sm">
                <span className="hidden md:block h-7 w-7 rounded-full bg-[#0d1016] shrink-0" />
                <div className="flex-1 text-center text-xl md:text-3xl font-black leading-relaxed text-[#a43b43]" style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
                  {String(question.text || question.promptText || question.instruction || 'اختر الإجابة الصحيحة مما يلي.').split('|').map((part, i, arr) => (
                    <React.Fragment key={i}>{renderBracketHighlightedText(part.trim())}{i !== arr.length - 1 && <br />}</React.Fragment>
                  ))}
                </div>
                <SourceStamp value={question.sourceLabel} />
              </div>

              <PaperMcqAnswerOptions question={question} answer={answer} isSubmitted={isSubmitted} onAnswer={onAnswer} />
            </section>

            {showPaperExplanation && (
              <div className={`mt-6 rounded-[1.6rem] border-2 p-5 md:p-6 shadow-lg ${isCorrect ? 'border-[#159462] bg-[#edfff6] text-[#075238]' : 'border-[#d33f49] bg-[#fff2f2] text-[#781f26]'}`}>
                <p className="text-xl md:text-2xl font-black mb-2">{isCorrect ? 'إجابة صحيحة 👏' : 'إجابة غير صحيحة'}</p>
                {!isCorrect && <p className="font-black mb-2">الإجابة الصحيحة: {(question.options || [])[question.correctIdx]}</p>}
                {question.explanation ? <p className="leading-8 font-bold whitespace-pre-wrap">{question.explanation}</p> : <p className="text-sm opacity-80 font-bold">لا يوجد شرح مضاف لهذا السؤال.</p>}
              </div>
            )}

            <div className="mt-7 flex flex-col sm:flex-row justify-between gap-4">
              <button disabled={currentQIndex === 0} onClick={onPrevious} className="px-7 py-4 rounded-2xl bg-[#fffdf7] text-[#45362d] border-2 border-[#d9cab4] font-black disabled:opacity-40 hover:bg-[#fff6dd] transition shadow-sm flex items-center justify-center gap-2" style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}><ChevronRight size={20} /> السابق</button>
              <button disabled={!hasAnsweredPaperQuestion && !isSubmitted || isLastQuestion} onClick={onNext} className="group relative overflow-hidden px-9 md:px-12 py-4 rounded-2xl bg-gradient-to-l from-[#7b2b2f] via-[#c77837] to-[#f0bd52] text-white font-black disabled:opacity-40 transition shadow-[0_14px_28px_rgba(167,85,40,.28)] hover:shadow-[0_18px_34px_rgba(167,85,40,.42)] flex items-center justify-center gap-3" style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
                <span className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                <span className="relative">{isLastQuestion ? 'انتهت الأسئلة' : 'السؤال التالي'}</span><ChevronRight size={22} className="relative rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col ${hasBlockText ? 'md:flex-row' : 'items-center'} h-full overflow-hidden bg-slate-100 w-full p-4 md:p-8 gap-6`}>
      {hasBlockText && (
        <div className="flex-1 w-full bg-white p-6 md:p-10 overflow-y-auto rounded-3xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-blue-900 mb-6 flex items-center gap-2 text-xl border-b border-blue-100 pb-4 font-['Cairo']"><FileText size={24} /> نص المراجعة / القراءة:</h3>
          <div className="leading-loose text-lg md:text-xl font-bold text-slate-700 font-['Cairo']">{renderBracketHighlightedText(question.blockText)}</div>
        </div>
      )}

      <div className={`${hasBlockText ? 'flex-1' : 'w-full max-w-4xl mx-auto'} bg-white p-6 md:p-10 overflow-y-auto flex flex-col shadow-xl rounded-3xl h-full border border-slate-200 relative`}>
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <span className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md font-['Cairo']">سؤال {questionNumber}</span>
            {question.branch && question.branch !== 'عام' && (
              <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100 flex items-center gap-2"><Layers size={16} /> {question.branch}</span>
            )}
            {question.type === 'essay' && (
              <span className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-bold border border-purple-100 flex items-center gap-2"><PenTool size={16} /> سؤال مقالي</span>
            )}
          </div>
          {!isSubmitted && (
            <button onClick={() => onFlagToggle(question.id)} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition shadow-sm ${flagged[question.id] ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
              <Flag size={16} /> {flagged[question.id] ? 'محدد للمراجعة' : 'تحديد لمراجعته لاحقاً'}
            </button>
          )}
        </div>

        <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 mb-8 shadow-inner text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-loose font-['Cairo'] drop-shadow-sm">
            {String(question.text || '').split('|').map((part, i, arr) => (
              <React.Fragment key={i}>
                {renderBracketHighlightedText(part.trim())}
                {i !== arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </h3>
        </div>

        {isSubmitted && (
          <div className="mb-6">
            <LocalQuestionExplanation question={question} answers={answers} />
          </div>
        )}

        {question.type === 'essay' ? (
          <div className="space-y-4">
            {isSubmitted && <LocalEssayReviewBox question={question} answer={answer} />}
            <EssayAnswerEditor
              question={question}
              answer={answer}
              isSubmitted={isSubmitted}
              onAnswer={onAnswer}
              onImageUpload={onImageUpload}
              onFileDialogOpen={onFileDialogOpen}
            />
          </div>
        ) : (
          <McqAnswerOptions question={question} answer={answer} isSubmitted={isSubmitted} onAnswer={onAnswer} />
        )}

        {isSubmitted && question.explanation && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5 text-right">
            <p className="font-bold text-blue-800 mb-2 flex items-center gap-2"><HelpCircle size={18}/> شرح الإجابة</p>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{question.explanation}</p>
          </div>
        )}

        <div className="mt-auto pt-10 flex justify-between">
          <button disabled={currentQIndex === 0} onClick={onPrevious} className="px-8 py-4 rounded-xl bg-slate-200 text-slate-700 font-bold disabled:opacity-50 hover:bg-slate-300 transition shadow-sm font-['Cairo'] flex items-center gap-2"><ChevronRight size={20} /> السابق</button>
          <button disabled={currentQIndex === displayQuestions.length - 1} onClick={onNext} className="px-8 py-4 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-50 hover:bg-slate-800 transition shadow-lg font-['Cairo'] flex items-center gap-2">التالي <ChevronRight size={20} className="rotate-180" /></button>
        </div>
      </div>
    </div>
  );
}
