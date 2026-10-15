import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronRight, FileText, Flag, HelpCircle, Layers, Maximize2, PenTool, UploadCloud, X } from '../../../shared/icons/lucide-shim.jsx';
import { LocalEssayReviewBox, LocalQuestionExplanation, renderBracketHighlightedText } from '../../../shared/core/platformShared.jsx';

const PASSAGE_FONT_KEY = 'exam-passage-font-size';
const PASSAGE_FONT_SIZES = ['text-sm leading-[1.9]', 'text-base leading-[2]', 'text-lg leading-[2.1]', 'text-xl leading-[2.2]', 'text-2xl leading-[2.2]'];

function readPassageFontIdx() {
  try {
    const stored = Number(localStorage.getItem(PASSAGE_FONT_KEY));
    if (Number.isInteger(stored) && stored >= 0 && stored < PASSAGE_FONT_SIZES.length) return stored;
  } catch { /* storage unavailable */ }
  return 1;
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
    <div role="radiogroup" aria-label="خيارات الإجابة" className="space-y-3 md:space-y-4">
      {(Array.isArray(question.options) ? question.options : []).map((option, idx) => {
        let optionClass = 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60 bg-white text-slate-800';
        const isSelected = answer === idx;

        if (isSubmitted) {
          if (idx === question.correctIdx) optionClass = 'border-green-500 bg-green-50 text-green-900 shadow-md ring-2 ring-green-200';
          else if (isSelected) optionClass = 'border-red-500 bg-red-50 text-red-900 shadow-md';
          else optionClass = 'border-slate-200 bg-slate-50 opacity-50';
        } else if (isSelected) {
          optionClass = 'border-indigo-500 bg-gradient-to-l from-indigo-50 to-violet-50 text-indigo-950 shadow-md shadow-indigo-100 ring-2 ring-indigo-100';
        }

        return (
          <div key={idx} onClick={() => !isSubmitted && onAnswer(question.id, idx)} role="radio" aria-checked={isSelected} tabIndex={isSubmitted ? -1 : 0} onKeyDown={(e) => { if (!isSubmitted && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onAnswer(question.id, idx); } }} className={`group p-3 md:p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center gap-4 ${optionClass}`}>
            <div className={`w-10 h-10 rounded-full border-2 font-black text-base flex items-center justify-center shrink-0 transition-colors ${isSelected || (isSubmitted && idx === question.correctIdx) ? 'border-transparent bg-current' : 'border-slate-300'}`}>
              {!isSubmitted && <span>{['أ','ب','ج','د','هـ','و'][idx] || idx + 1}</span>}
              {(isSubmitted && idx === question.correctIdx) && <Check size={16} className="text-white" />}
              {(isSubmitted && isSelected && idx !== question.correctIdx) && <X size={16} className="text-white" />}
            </div>
            <span className="font-['Cairo'] text-base md:text-xl font-bold leading-relaxed break-words min-w-0">{option}</span>
            {isSubmitted && idx === question.correctIdx && <span className="mr-auto text-green-600 bg-green-100 px-3 py-1 rounded-lg text-xs font-bold">الإجابة الصحيحة</span>}
            {isSubmitted && isSelected && idx !== question.correctIdx && <span className="mr-auto text-red-600 bg-red-100 px-3 py-1 rounded-lg text-xs font-bold">إجابتك (خطأ)</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function ExamQuestionPanel({
  exam,
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
  const scrollRef = useRef(null);
  const [passageOpen, setPassageOpen] = useState(false);
  const [passageCollapsed, setPassageCollapsed] = useState(false);
  const [passageFontIdx, setPassageFontIdx] = useState(readPassageFontIdx);
  const blockText = question?.blockText || '';
  const hasBlockText = blockText.trim().length > 0;

  // Back to the top of the panel on every question so the passage and question start in view.
  useEffect(() => {
    setPassageOpen(false);
    scrollRef.current?.scrollTo?.({ top: 0 });
  }, [question?.id]);
  // A new passage always opens expanded; questions sharing the same passage keep the student's choice.
  useEffect(() => { setPassageCollapsed(false); }, [blockText]);
  useEffect(() => {
    if (!passageOpen) return undefined;
    const onEscape = (event) => { if (event.key === 'Escape') setPassageOpen(false); };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [passageOpen]);
  const changePassageFont = (delta) => {
    setPassageFontIdx((current) => {
      const next = Math.min(PASSAGE_FONT_SIZES.length - 1, Math.max(0, current + delta));
      try { localStorage.setItem(PASSAGE_FONT_KEY, String(next)); } catch { /* storage unavailable */ }
      return next;
    });
  };
  const passageFontClass = PASSAGE_FONT_SIZES[passageFontIdx];
  const answer = answers?.[question.id];
  const questionNumber = flatQuestions.findIndex((origQ) => origQ.id === question.id) + 1;
  return (
    <div ref={scrollRef} className={`flex-1 flex flex-col ${hasBlockText ? 'xl:flex-row' : 'items-center'} min-h-0 overflow-y-auto overscroll-contain bg-transparent w-full p-2 sm:p-4 md:p-6 lg:p-8 gap-3 md:gap-6`}>
      {hasBlockText && (
        <div className="hidden xl:block flex-none w-full h-[48dvh] min-h-[260px] max-h-[520px] xl:h-auto xl:max-h-none xl:min-h-0 xl:flex-1 bg-white/95 p-4 sm:p-5 md:p-10 overflow-y-auto overscroll-contain rounded-[28px] shadow-[0_18px_60px_rgba(15,23,42,0.08)] border border-slate-200/80">
          <h3 className="font-bold text-blue-900 mb-6 flex items-center gap-2 text-xl border-b border-blue-100 pb-4 font-['Cairo']"><FileText size={24} /> نص المراجعة / القراءة:</h3>
          <div className="leading-[2] text-base sm:text-lg md:text-xl font-bold text-slate-700 whitespace-pre-wrap break-words font-['Cairo']">{renderBracketHighlightedText(question.blockText)}</div>
        </div>
      )}

      {hasBlockText && (
        <>
          {/* Phones and tablets: the passage is shown by default above the question and stays pinned while scrolling the answers. */}
          <section className="xl:hidden sticky -top-2 sm:-top-4 md:-top-6 lg:-top-8 z-40 w-full shrink-0 overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-lg" aria-label="نص القراءة">
            <div className="flex items-center gap-1.5 bg-indigo-700 px-2 py-1.5 text-white">
              <button
                type="button"
                onClick={() => setPassageCollapsed((value) => !value)}
                className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-xl px-2 text-right font-black"
                aria-expanded={!passageCollapsed}
              >
                <FileText size={18} className="shrink-0" />
                <span className="truncate text-sm sm:text-base">نص القراءة</span>
                <span className="mr-auto shrink-0 rounded-lg bg-white/15 px-2 py-1 text-xs">{passageCollapsed ? 'إظهار النص' : 'تصغير'}</span>
              </button>
              {!passageCollapsed && (
                <>
                  <button type="button" onClick={() => changePassageFont(-1)} disabled={passageFontIdx === 0} className="h-10 w-10 shrink-0 rounded-xl bg-white/15 text-sm font-black disabled:opacity-40" aria-label="تصغير خط النص">أ-</button>
                  <button type="button" onClick={() => changePassageFont(1)} disabled={passageFontIdx === PASSAGE_FONT_SIZES.length - 1} className="h-10 w-10 shrink-0 rounded-xl bg-white/15 text-base font-black disabled:opacity-40" aria-label="تكبير خط النص">أ+</button>
                </>
              )}
              <button type="button" onClick={() => setPassageOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-800" aria-label="فتح النص في شاشة كاملة">
                <Maximize2 size={18} />
              </button>
            </div>
            {!passageCollapsed && (
              <div
                className={`max-h-[30dvh] sm:max-h-[38dvh] overflow-y-auto overscroll-contain px-4 py-3 text-right font-bold text-slate-800 whitespace-pre-wrap break-words font-['Cairo'] [-webkit-overflow-scrolling:touch] ${passageFontClass}`}
                style={{ touchAction: 'pan-y' }}
              >
                {renderBracketHighlightedText(blockText)}
              </div>
            )}
          </section>
          {/* Portal to <body> so the reader sits above the exam header instead of under it. */}
          {passageOpen && createPortal(
            <div className="xl:hidden fixed inset-0 z-[100] flex flex-col bg-white" role="dialog" aria-modal="true" aria-label="نص القطعة" dir="rtl">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-indigo-700 px-4 py-3 text-white">
                <strong className="text-lg font-black">نص القراءة / النصوص</strong>
                <button type="button" onClick={() => setPassageOpen(false)} className="flex min-h-12 items-center gap-2 rounded-xl bg-white px-4 py-2 font-black text-indigo-800" aria-label="إغلاق القطعة والعودة للسؤال">
                  <X size={20} /> العودة للسؤال
                </button>
              </div>
              <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 pb-12 text-right font-bold text-slate-900 whitespace-pre-wrap break-words font-['Cairo'] [-webkit-overflow-scrolling:touch] ${passageFontClass}`} style={{ touchAction: 'pan-y' }}>
                {renderBracketHighlightedText(blockText)}
              </div>
            </div>,
            document.body,
          )}
        </>
      )}

      <div className={`${hasBlockText ? 'flex-none xl:flex-1' : 'w-full max-w-5xl mx-auto'} bg-white/95 p-3 md:p-8 lg:p-10 overflow-y-auto flex flex-col shadow-[0_20px_70px_rgba(15,23,42,0.09)] rounded-2xl md:rounded-[28px] min-h-fit border border-slate-200/80 relative`}>
        <div className="flex flex-wrap justify-between items-center gap-2 mb-3 border-b border-slate-100 pb-2 md:mb-6 md:pb-5">
          <div className="flex items-center gap-3">
            <span className="bg-gradient-to-br from-indigo-500 to-violet-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md font-['Cairo']">سؤال {questionNumber}</span>
            {question.branch && question.branch !== 'عام' && (
              <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100 flex items-center gap-2"><Layers size={16} /> {question.branch}</span>
            )}
            {question.type === 'essay' && (
              <span className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-bold border border-purple-100 flex items-center gap-2"><PenTool size={16} /> سؤال مقالي</span>
            )}
          </div>
          {!isSubmitted && (
            <button onClick={() => onFlagToggle(question.id)} className={`flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs md:px-5 md:py-2 md:text-sm font-bold transition shadow-sm ${flagged[question.id] ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
              <Flag size={16} /> {flagged[question.id] ? 'محدد للمراجعة' : 'تحديد لمراجعته لاحقاً'}
            </button>
          )}
        </div>

        <div className="bg-gradient-to-l from-slate-50 to-indigo-50/60 p-3 md:p-8 rounded-2xl border border-slate-200 mb-4 md:mb-7 text-right">
          <h3 className="text-lg md:text-2xl lg:text-3xl font-black text-slate-950 leading-[2] font-['Cairo'] drop-shadow-sm">
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

        <div className="mt-auto pt-8 flex items-center justify-between gap-3">
          <button disabled={currentQIndex === 0} onClick={onPrevious} className="min-h-12 px-4 sm:px-6 md:px-8 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold disabled:opacity-50 hover:bg-slate-300 transition shadow-sm font-['Cairo'] flex items-center gap-2"><ChevronRight size={20} /> السابق</button>
          <button disabled={currentQIndex === displayQuestions.length - 1} onClick={onNext} className="min-h-12 px-4 sm:px-6 md:px-8 py-3 rounded-xl bg-gradient-to-l from-indigo-600 to-violet-600 text-white font-bold disabled:opacity-50 hover:bg-slate-800 transition shadow-lg font-['Cairo'] flex items-center gap-2">التالي <ChevronRight size={20} className="rotate-180" /></button>
        </div>
      </div>
    </div>
  );
}
