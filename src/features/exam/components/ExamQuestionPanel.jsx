import React from 'react';
import templateBg from '../../../assets/quick-review-template.png';
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

function buildQuestionParts(question) {
  const raw = String(question?.text || '').trim();
  const introFromField = String(question?.introText || question?.intro || '').trim();
  const sourceLabel = String(question?.sourceLabel || question?.sourceTag || question?.sourceType || question?.paperLabel || '').trim();
  if (!raw) return { prompt: '', intro: introFromField, sourceLabel };

  const introMatch = raw.match(/(?:^|\n)\s*(?:مقدمة|تمهيد)\s*[:：-]\s*(.+)/);
  const promptMatch = raw.match(/(?:^|\n)\s*(?:السؤال|سؤال)\s*[:：-]\s*(.+)/);
  if (promptMatch) {
    return {
      intro: introFromField || (introMatch ? introMatch[1].trim() : ''),
      prompt: promptMatch[1].trim(),
      sourceLabel,
    };
  }

  const pieces = raw.split(/[|\n]/).map((item) => item.trim()).filter(Boolean);
  if (pieces.length >= 2) {
    return {
      prompt: pieces[0],
      intro: introFromField || pieces.slice(1).join(' '),
      sourceLabel,
    };
  }

  return { prompt: raw, intro: introFromField, sourceLabel };
}

function QuickReviewTemplate({
  question,
  answer,
  isSubmitted,
  onAnswer,
  currentQIndex,
  displayQuestions,
  onPrevious,
  onNext,
}) {
  const parts = buildQuestionParts(question);
  const promptText = parts.prompt || String(question?.text || '');
  const introText = parts.intro;
  const sourceLabel = parts.sourceLabel || String(question?.branch || question?.topic || '').trim() || 'سؤال عام';
  const options = Array.isArray(question?.options) ? question.options : [];
  const letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
  const questionLocked = isSubmitted || answer !== undefined;
  const totalQuestions = displayQuestions?.length || 1;

  return (
    <div className="w-full h-full overflow-y-auto bg-[#05070d] p-3 md:p-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-3 flex items-center justify-center">
          <div className="rounded-full border border-amber-400/40 bg-black/55 px-5 py-2 text-amber-100 font-black shadow-lg" style={{ fontFamily: 'Cairo, sans-serif' }}>
            سؤال {currentQIndex + 1} من {totalQuestions}
          </div>
        </div>
        <div className="relative w-full aspect-[4/3] bg-center bg-contain bg-no-repeat" style={{ backgroundImage: `url(${templateBg})` }}>
          <div className="absolute inset-0">
            <div className="absolute left-[31.5%] right-[4.8%] top-[23.7%] h-[24.8%] flex items-center justify-center px-[6.2%] text-center">
              <div className="w-full leading-[1.18] text-[#9b3e36] font-black [text-shadow:0_1px_0_rgba(255,255,255,0.85)]" style={{ fontFamily: 'Cairo, sans-serif', fontSize: 'clamp(16px, 2.35vw, 30px)' }}>
                <div>{renderBracketHighlightedText(promptText)}</div>
                {introText ? <div className="mt-2">مقدمة: {renderBracketHighlightedText(introText)}</div> : null}
              </div>
            </div>

            <div className="absolute left-[9.8%] top-[39.2%] w-[12.5%] rotate-[-1deg] rounded-[14px] border-2 border-[#6d7b8c] bg-[#e9eef7] px-2 py-3 text-center text-[#0d2341] shadow-[0_5px_14px_rgba(0,0,0,0.18)] font-black" style={{ fontFamily: 'Cairo, sans-serif', fontSize: 'clamp(10px, 1.1vw, 15px)' }}>
              {sourceLabel}
            </div>

            {options.map((option, idx) => {
              const topBase = 57.2 + idx * 8.55;
              const isSelected = answer === idx;
              const isCorrect = idx === question.correctIdx;
              let badge = null;
              let lineBg = 'transparent';
              let lineBorder = 'transparent';
              let lineText = '#30261e';
              let circleBg = '#bb3c2b';
              if (!questionLocked && isSelected) {
                lineBg = 'rgba(255,199,67,0.22)';
                lineBorder = 'rgba(214,140,0,0.65)';
              }
              if (questionLocked) {
                if (isCorrect) {
                  lineBg = 'rgba(34,197,94,0.18)';
                  lineBorder = 'rgba(22,163,74,0.65)';
                  circleBg = '#128c3a';
                  badge = <Check className="w-[58%] h-[58%] text-white" />;
                } else if (isSelected) {
                  lineBg = 'rgba(239,68,68,0.14)';
                  lineBorder = 'rgba(220,38,38,0.55)';
                  circleBg = '#bb3c2b';
                  badge = <X className="w-[58%] h-[58%] text-white" />;
                }
              }
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => !questionLocked && onAnswer(question.id, idx)}
                  className="absolute left-[32%] right-[4.5%] h-[7.2%] rounded-full transition-all duration-200 text-right"
                  style={{ top: `${topBase}%`, background: lineBg, border: `2px solid ${lineBorder}` }}
                  disabled={questionLocked}
                >
                  <div className="relative h-full w-full">
                    <div className="absolute inset-y-0 right-[8.5%] left-[3%] flex items-center justify-end">
                      <span className="font-black leading-none" style={{ fontFamily: 'Cairo, sans-serif', color: lineText, fontSize: 'clamp(14px, 2vw, 28px)' }}>
                        {option}
                      </span>
                    </div>
                    <div className="absolute top-1/2 right-[0.8%] -translate-y-1/2 flex items-center justify-center rounded-full border-[3px] border-[#f4dac1] shadow-md"
                      style={{ width: 'clamp(24px, 3.2vw, 42px)', height: 'clamp(24px, 3.2vw, 42px)', background: circleBg }}>
                      {badge || <span className="text-white font-black" style={{ fontFamily: 'Cairo, sans-serif', fontSize: 'clamp(11px, 1.2vw, 16px)' }}>{letters[idx] || idx + 1}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {questionLocked && question?.explanation ? (
          <div className="mt-6 rounded-[28px] border border-amber-200 bg-[#fff7ea] p-5 md:p-6 shadow-lg">
            <div className="flex items-center gap-2 text-amber-700 font-black text-lg mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              <HelpCircle className="w-5 h-5" /> شرح الإجابة
            </div>
            <p className="text-slate-700 leading-8 whitespace-pre-wrap" style={{ fontFamily: 'Cairo, sans-serif' }}>{question.explanation}</p>
          </div>
        ) : null}



        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            disabled={currentQIndex === displayQuestions.length - 1}
            onClick={onNext}
            className="px-10 md:px-14 py-3 md:py-4 rounded-2xl text-white font-black shadow-[0_18px_35px_rgba(246,142,0,0.35)] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: 'Cairo, sans-serif', background: 'linear-gradient(90deg, #f97316 0%, #f59e0b 100%)' }}
          >
            Next
          </button>
        </div>
      </div>
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
  const answer = answers?.[question.id];
  const questionNumber = flatQuestions.findIndex((origQ) => origQ.id === question.id) + 1;
  const hasBlockText = question?.blockText && question.blockText.trim().length > 0;
  const isQuickReviewExam = Boolean(
    exam?.quickReview === true ||
    exam?.examType === 'quick_review' ||
    exam?.category === 'quick_review' ||
    String(exam?.title || '').includes('مراجعة ف السريع') ||
    String(exam?.title || '').includes('مراجعة في السريع')
  );

  const useReferenceTemplate = Boolean(
    isQuickReviewExam && (
      exam?.questionVisualTemplate === 'reference-paper' ||
      exam?.uiTemplate === 'reference-paper' ||
      exam?.templateDesign === 'reference-paper' ||
      question?.visualTemplate === 'reference-paper' ||
      question?.templateDesign === 'reference-paper' ||
      true
    )
  );

  if (useReferenceTemplate && question?.type !== 'essay') {
    return (
      <QuickReviewTemplate
        question={question}
        answer={answer}
        isSubmitted={isSubmitted}
        onAnswer={onAnswer}
        currentQIndex={currentQIndex}
        displayQuestions={displayQuestions}
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
