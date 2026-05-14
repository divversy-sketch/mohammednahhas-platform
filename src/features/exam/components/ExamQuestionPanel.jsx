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


function PaperQuestionHeader({ title, sourceLabel }) {
  return (
    <div className="text-center mb-6 select-none">
      <div className="relative inline-flex items-center justify-center px-8 md:px-14 py-3">
        <span className="absolute inset-x-0 top-1/2 h-8 -translate-y-1/2 rounded-[40%] bg-slate-950 rotate-[-1deg] shadow-lg" />
        <h2 className="relative text-3xl md:text-5xl font-black leading-tight text-[#b66b38] [text-shadow:0_2px_0_#fff,0_4px_0_rgba(0,0,0,.2)] font-['Cairo']">
          {title || 'أسئلة ثانوية عامة واسترشادي'}
        </h2>
        <span className="absolute -left-8 md:-left-12 -top-2 grid h-12 w-12 place-items-center rounded-2xl bg-[#101735] text-3xl font-black text-[#e2b54a] shadow-xl rotate-6">؟</span>
      </div>
      {sourceLabel && (
        <div className="mt-3 inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm">
          {sourceLabel}
        </div>
      )}
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
    return (
      <div className="flex-1 h-full overflow-y-auto bg-[#160f13] p-3 md:p-8" dir="rtl">
        <div className="mx-auto max-w-6xl min-h-full rounded-[2rem] border-4 border-[#c9a24a] bg-[#f8f3e8] p-4 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 15% 10%, rgba(201,162,74,.22), transparent 28%), radial-gradient(circle at 85% 90%, rgba(126,47,46,.16), transparent 32%)' }} />
          <div className="relative z-10">
            <PaperQuestionHeader title={question.paperTitle} sourceLabel={question.sourceLabel} />
            <div className="rounded-[2rem] border-4 border-[#c05b79] bg-white/85 p-4 md:p-8 shadow-inner">
              <div className="mb-5 text-center text-xl md:text-3xl font-black text-slate-900 leading-loose font-['Cairo']">
                {String(question.text || '').split('|').map((part, i, arr) => (
                  <React.Fragment key={i}>{renderBracketHighlightedText(part.trim())}{i !== arr.length - 1 && <br />}</React.Fragment>
                ))}
              </div>
              <div className="mb-5 rounded-[1.5rem] border-2 border-slate-900 bg-[#f7fbfb] p-4 text-center text-lg md:text-2xl font-black leading-relaxed text-[#a33b3d] shadow-sm">
                {question.promptText || question.instruction || 'اختر الإجابة الصحيحة مما يلي.'}
              </div>
              <McqAnswerOptions question={question} answer={answer} isSubmitted={isSubmitted} onAnswer={onAnswer} />
            </div>
            {showPaperExplanation && (
              <div className={`mt-6 rounded-3xl border-2 p-5 md:p-6 shadow-lg ${isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`}>
                <p className="text-xl font-black mb-2">{isCorrect ? 'إجابة صحيحة 👏' : 'إجابة غير صحيحة'}</p>
                {!isCorrect && <p className="font-bold mb-2">الإجابة الصحيحة: {(question.options || [])[question.correctIdx]}</p>}
                {question.explanation ? <p className="leading-8 font-bold whitespace-pre-wrap">{question.explanation}</p> : <p className="text-sm opacity-80 font-bold">لا يوجد شرح مضاف لهذا السؤال.</p>}
              </div>
            )}
            <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
              <button disabled={currentQIndex === 0} onClick={onPrevious} className="px-8 py-4 rounded-2xl bg-white text-slate-800 border-2 border-slate-200 font-black disabled:opacity-40 hover:bg-slate-50 transition shadow-sm font-['Cairo'] flex items-center justify-center gap-2"><ChevronRight size={20} /> السابق</button>
              <button disabled={!hasAnsweredPaperQuestion && !isSubmitted || currentQIndex === displayQuestions.length - 1} onClick={onNext} className="group relative overflow-hidden px-10 py-4 rounded-2xl bg-gradient-to-l from-[#c77a2b] via-[#efb24a] to-[#7e2f2e] text-white font-black disabled:opacity-40 transition shadow-xl hover:shadow-amber-400/30 font-['Cairo'] flex items-center justify-center gap-3">
                <span className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                <span className="relative">السؤال التالي</span><ChevronRight size={22} className="relative rotate-180" />
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
