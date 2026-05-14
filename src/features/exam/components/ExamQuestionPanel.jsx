import React from 'react';
import { Check, ChevronRight, FileText, Flag, HelpCircle, Layers, PenTool, UploadCloud, X } from '../../../shared/icons/lucide-shim.jsx';
import { LocalEssayReviewBox, LocalQuestionExplanation, renderBracketHighlightedText } from '../../../shared/core/platformShared.jsx';


const PAPER_OPTION_LABELS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

function PaperQuestionTemplate({
  question,
  answer,
  questionNumber,
  isSubmitted,
  currentQIndex,
  displayQuestions,
  onAnswer,
  onPrevious,
  onNext,
}) {
  const hasAnswered = answer !== undefined && answer !== null;
  const showFeedback = hasAnswered || isSubmitted;
  const isCorrect = answer === question.correctIdx;
  const sourceLabel = question.sourceLabel || question.paperSourceLabel || question.sourceTitle || question.year || 'تدريب';
  const title = question.paperTitle || question.title || 'أسئلة ثانوية عامة واسترشادي';
  const introText = question.introText || question.contextText || question.promptText || '';
  const options = Array.isArray(question.options) ? question.options : [];

  return (
    <div dir="rtl" className="flex-1 min-h-full overflow-y-auto bg-[#130f22] p-3 md:p-8 font-['Cairo']">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-[#d8b35d]/40 bg-[#fbf6e9] shadow-2xl">
        <div className="absolute inset-0 pointer-events-none opacity-70" style={{ background: 'radial-gradient(circle at 92% 8%, rgba(216,179,93,.22), transparent 25%), radial-gradient(circle at 8% 90%, rgba(105,33,48,.14), transparent 22%)' }} />
        <div className="relative p-4 md:p-8 lg:p-10">
          <div className="mx-auto mb-6 md:mb-8 max-w-3xl text-center">
            <div className="relative inline-block px-6 py-2">
              <div className="absolute inset-x-0 top-1/2 h-10 -translate-y-1/2 -rotate-1 rounded-full bg-[#1f1722] shadow-[0_10px_0_rgba(216,179,93,.24)]" />
              <h2 className="relative text-3xl md:text-5xl font-black tracking-tight text-[#b87442] drop-shadow-[0_3px_0_rgba(75,35,25,.25)]">
                {title}
              </h2>
            </div>
            <div className="mx-auto mt-4 h-1 w-28 rounded-full bg-gradient-to-l from-[#d8b35d] via-[#8f2f46] to-[#d8b35d]" />
          </div>

          <div className="rounded-[1.7rem] border-2 border-[#b63858] bg-white/66 p-4 md:p-7 shadow-inner backdrop-blur">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-2xl bg-[#1f1722] px-4 py-2 text-sm font-black text-white shadow-lg">سؤال {questionNumber}</span>
              <span className="rounded-xl border-2 border-[#74879a] bg-[#e8f2fb] px-4 py-2 text-sm md:text-base font-black text-[#17324a] -rotate-2 shadow-md">
                {sourceLabel}
              </span>
            </div>

            {introText && (
              <p className="mb-4 text-center text-xl md:text-3xl font-black leading-loose text-[#1f1722]">
                {renderBracketHighlightedText(introText)}
              </p>
            )}

            <div className="mb-5 rounded-full border-2 border-[#152030] bg-[#eef4ef] px-5 py-4 shadow-sm">
              <p className="text-center text-xl md:text-2xl font-black leading-relaxed text-[#a43145]">
                {renderBracketHighlightedText(question.text || '')}
              </p>
            </div>

            <div className="space-y-3">
              {options.map((option, idx) => {
                const selected = answer === idx;
                const correct = idx === question.correctIdx;
                let cls = 'border-[#b5aa9a] bg-[#f8f4eb] text-[#1f1722] hover:border-[#d8b35d] hover:bg-white cursor-pointer';
                if (showFeedback) {
                  if (correct) cls = 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-200';
                  else if (selected) cls = 'border-red-500 bg-red-50 text-red-950 ring-2 ring-red-200';
                  else cls = 'border-[#d7d0c4] bg-[#f2eee5] text-slate-500 opacity-70';
                }
                return (
                  <button
                    type="button"
                    key={idx}
                    disabled={showFeedback}
                    onClick={() => onAnswer(question.id, idx)}
                    className={`group flex w-full items-center gap-3 rounded-full border-2 px-3 py-3 text-right transition-all duration-200 ${cls}`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-black text-white shadow-md ${showFeedback && correct ? 'bg-emerald-600' : showFeedback && selected ? 'bg-red-600' : 'bg-[#a44a3f]'}`}>
                      {showFeedback && correct ? <Check size={20} /> : showFeedback && selected ? <X size={20} /> : (PAPER_OPTION_LABELS[idx] || idx + 1)}
                    </span>
                    <span className="flex-1 text-lg md:text-2xl font-black leading-relaxed">{option}</span>
                    {showFeedback && correct && <span className="hidden md:inline rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">الإجابة الصحيحة</span>}
                    {showFeedback && selected && !correct && <span className="hidden md:inline rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">اختيارك</span>}
                  </button>
                );
              })}
            </div>

            {showFeedback && (
              <div className={`mt-6 rounded-3xl border-2 p-5 shadow-lg ${isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                <p className={`mb-2 text-xl md:text-2xl font-black ${isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                  {isCorrect ? 'إجابة صحيحة — ممتاز!' : 'إجابة غير صحيحة'}
                </p>
                {!isCorrect && (
                  <p className="mb-3 text-base md:text-lg font-bold text-slate-800">
                    الإجابة الصحيحة: <span className="text-emerald-700">{options[question.correctIdx]}</span>
                  </p>
                )}
                {question.explanation && (
                  <div className="rounded-2xl bg-white/80 p-4 text-slate-800">
                    <p className="mb-1 font-black text-[#17324a]">سبب الإجابة</p>
                    <p className="whitespace-pre-wrap leading-loose font-bold">{question.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
            <button disabled={currentQIndex === 0} onClick={onPrevious} className="rounded-2xl border border-[#d8b35d]/50 bg-white/70 px-7 py-4 font-black text-[#1f1722] shadow-md transition hover:bg-white disabled:opacity-40">
              السابق
            </button>
            <button disabled={!showFeedback || currentQIndex === displayQuestions.length - 1} onClick={onNext} className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#7a2036] via-[#b87442] to-[#d8b35d] px-10 py-4 text-lg font-black text-white shadow-[0_14px_30px_rgba(122,32,54,.35)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(122,32,54,.45)] disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:hover:translate-y-0">
              <span className="relative z-10">{currentQIndex === displayQuestions.length - 1 ? 'انتهت الأسئلة' : 'انتقل للسؤال التالي ←'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  return (
    <div className="space-y-4">
      {(Array.isArray(question.options) ? question.options : []).map((option, idx) => {
        let optionClass = 'border-slate-200 hover:bg-slate-50 bg-white text-slate-700';
        const isSelected = answer === idx;

        if (isSubmitted) {
          if (idx === question.correctIdx) optionClass = 'border-green-500 bg-green-50 text-green-900 shadow-md ring-2 ring-green-200';
          else if (isSelected) optionClass = 'border-red-500 bg-red-50 text-red-900 shadow-md';
          else optionClass = 'border-slate-200 bg-slate-50 opacity-50';
        } else if (isSelected) {
          optionClass = 'border-amber-500 bg-amber-50 text-amber-900 shadow-md transform scale-[1.02] ring-2 ring-amber-200';
        }

        return (
          <div key={idx} onClick={() => onAnswer(question.id, idx)} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 ${optionClass}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected || (isSubmitted && idx === question.correctIdx) ? 'border-transparent bg-current' : 'border-slate-300'}`}>
              {(isSubmitted && idx === question.correctIdx) && <Check size={16} className="text-white" />}
              {(isSubmitted && isSelected && idx !== question.correctIdx) && <X size={16} className="text-white" />}
            </div>
            <span className="font-['Cairo'] text-xl font-bold leading-relaxed">{option}</span>
            {isSubmitted && idx === question.correctIdx && <span className="mr-auto text-green-600 bg-green-100 px-3 py-1 rounded-lg text-xs font-bold">الإجابة الصحيحة</span>}
            {isSubmitted && isSelected && idx !== question.correctIdx && <span className="mr-auto text-red-600 bg-red-100 px-3 py-1 rounded-lg text-xs font-bold">إجابتك (خطأ)</span>}
          </div>
        );
      })}
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
  const isPaperStyle = question?.template === 'paper-style' || question?.questionTemplate === 'paper-style';

  if (isPaperStyle && question.type !== 'essay') {
    return (
      <PaperQuestionTemplate
        question={question}
        answer={answer}
        questionNumber={questionNumber}
        isSubmitted={isSubmitted}
        currentQIndex={currentQIndex}
        displayQuestions={displayQuestions}
        onAnswer={onAnswer}
        onPrevious={onPrevious}
        onNext={onNext}
      />
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
