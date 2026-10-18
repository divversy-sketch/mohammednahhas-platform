// «السينما» exam screen: countdown ring, passage beside the question, big answer cards with a fill animation,
// a numbers strip/grid for jumping, keyboard shortcuts, and a confirm sheet that counts what's left.
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ExamWatermarkLayer from '@features/exams/components/ExamWatermarkLayer.jsx';
import ExamSecurityHoldOverlay from '@features/exams/components/ExamSecurityHoldOverlay.jsx';
import { ConnectionStatusBanner } from '@shared/ui/ConnectionStatusBanner.jsx';
import { platformNotify } from '@shared/core/platformShared.jsx';
import { renderBracketHighlightedText } from '@shared/core/platform/text.jsx';
import { Icon } from '../ui/Icon.jsx';
import { formatNumber } from '../ui/kit.jsx';
import { BrandMark } from '../ui/Brand.jsx';
import { haptic } from '../device/native.js';
import '../styles/exam-cinema.css';

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];
const FONT_KEY = 'exam-passage-font-size';
const FONT_STEPS = [15, 17, 19, 21, 24];
const answered = (v) => v !== undefined && v !== '' && v !== null && !(typeof v === 'object' && !v?.text && !v?.image);

function FullIcon() {
  return <svg className="nx-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3.5H5.5a2 2 0 0 0-2 2V8M16 3.5h2.5a2 2 0 0 1 2 2V8M20.5 16v2.5a2 2 0 0 1-2 2H16M8 20.5H5.5a2 2 0 0 1-2-2V16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function clock(sec = 0) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const r = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`;
}

function readFont() {
  try { const v = Number(localStorage.getItem(FONT_KEY)); if (Number.isInteger(v) && v >= 0 && v < FONT_STEPS.length) return v; } catch { /* storage blocked */ }
  return 1;
}

function QuestionText({ text }) {
  return String(text || '').split('|').map((part, i, arr) => (
    <Fragment key={i}>{renderBracketHighlightedText(part.trim())}{i !== arr.length - 1 && <br />}</Fragment>
  ));
}

function Timer({ timeLeft, total }) {
  const pct = total > 0 ? Math.max(0, Math.min(1, timeLeft / total)) : 1;
  const r = 19; const c = 2 * Math.PI * r;
  const tone = timeLeft <= 60 ? 'is-red' : timeLeft <= 300 ? 'is-amber' : '';
  return (
    <div className={`cxe-timer ${tone}`} role="timer" aria-label={`الوقت المتبقي ${clock(timeLeft)}`}>
      <svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r={r} className="cxe-timer__track" /><circle cx="22" cy="22" r={r} className="cxe-timer__val" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} /></svg>
      <span><small>الوقت المتبقي</small><b>{clock(timeLeft)}</b></span>
    </div>
  );
}

function Passage({ text, font, setFont, collapsible }) {
  const [closed, setClosed] = useState(false);
  const [full, setFull] = useState(false);
  useEffect(() => { setClosed(false); }, [text]);
  const size = { fontSize: `${FONT_STEPS[font]}px` };
  const tools = (
    <div className="cxe-passage__tools">
      <button type="button" onClick={() => setFont(-1)} disabled={font === 0} aria-label="تصغير الخط">أ-</button>
      <button type="button" onClick={() => setFont(1)} disabled={font === FONT_STEPS.length - 1} aria-label="تكبير الخط">أ+</button>
      {collapsible && <button type="button" onClick={() => setFull(true)} aria-label="النص بملء الشاشة"><FullIcon /></button>}
    </div>
  );
  return (
    <section className={`cxe-passage ${collapsible ? 'is-pinned' : ''} ${closed ? 'is-closed' : ''}`} aria-label="نص القراءة">
      <header>
        <button type="button" className="cxe-passage__title" onClick={() => collapsible && setClosed((v) => !v)} aria-expanded={!closed}>
          <Icon name="book" /><b>نص القراءة</b>{collapsible && <small>{closed ? 'إظهار' : 'تصغير'}</small>}
        </button>
        {!closed && tools}
      </header>
      {!closed && <div className="cxe-passage__text" style={size}>{renderBracketHighlightedText(text)}</div>}
      {full && createPortal(
        <div className="cxe-reader" role="dialog" aria-modal="true" aria-label="نص القراءة" dir="rtl">
          <header><b>نص القراءة</b>{tools}<button type="button" className="cxe-reader__back" onClick={() => setFull(false)}><Icon name="arrowRight" />ارجع للسؤال</button></header>
          <div className="cxe-passage__text" style={size}>{renderBracketHighlightedText(text)}</div>
        </div>, document.body,
      )}
    </section>
  );
}

function Options({ question, answer, onPick }) {
  const opts = Array.isArray(question.options) ? question.options : [];
  return (
    <div className="cxe-opts" role="radiogroup" aria-label="اختار الإجابة">
      {opts.map((opt, i) => {
        const on = answer === i;
        return (
          <button key={i} type="button" role="radio" aria-checked={on} className={`cxe-opt ${on ? 'is-on' : ''}`} style={{ animationDelay: `${0.08 + i * 0.06}s` }} onClick={() => onPick(i)}>
            <i>{on ? <Icon name="check" /> : (LETTERS[i] || i + 1)}</i>
            <span>{opt}</span>
            <kbd aria-hidden="true">{i + 1}</kbd>
          </button>
        );
      })}
    </div>
  );
}

function Essay({ question, answer, onAnswer, onImageUpload, onFileDialogOpen }) {
  const value = typeof answer === 'object' ? answer?.text || '' : answer || '';
  const image = typeof answer === 'object' ? answer?.image : null;
  return (
    <div className="cxe-essay">
      <textarea value={value} placeholder="اكتب إجابتك هنا…" onChange={(e) => onAnswer(question.id, { text: e.target.value, image, fileName: typeof answer === 'object' ? answer?.fileName : null })} />
      <label className="cxe-upload">
        <Icon name="plus" />
        <span><b>أو صوّر إجابتك من الورقة</b><small>فتح الكاميرا لهذا السؤال مش بيتحسب غش</small></span>
        <input type="file" accept="image/*" capture="environment" onClick={onFileDialogOpen} onChange={(e) => onImageUpload(question.id, e.target.files?.[0])} />
      </label>
      {image && <img className="cxe-essay__img" src={image} alt="صورة الإجابة" />}
    </div>
  );
}

function Navigator({ questions, flat, answers, flagged, current, onPick, compact }) {
  return (
    <div className={compact ? 'cxe-strip' : 'cxe-grid'}>
      {questions.map((q, i) => {
        const n = flat.findIndex((x) => x.id === q.id) + 1;
        const st = i === current ? 'is-cur' : flagged?.[q.id] ? 'is-flag' : answered(answers?.[q.id]) ? 'is-done' : '';
        return <button key={q.id || i} type="button" className={st} onClick={() => onPick(i)} aria-label={`السؤال ${n}`} aria-current={i === current ? 'step' : undefined}>{formatNumber(n)}</button>;
      })}
    </div>
  );
}

function ConfirmSubmit({ total, done, flaggedCount, onCancel, onSubmit, onJump }) {
  const left = total - done;
  return (
    <div className="cxe-modal" role="dialog" aria-modal="true" aria-label="تسليم الامتحان">
      <button type="button" className="cxe-modal__scrim" aria-label="رجوع" onClick={onCancel} />
      <div className="cxe-modal__box">
        <div className="cxe-modal__ring" style={{ '--p': total ? done / total : 0 }}><b>{formatNumber(done)}</b><small>من {formatNumber(total)}</small></div>
        <h3>{left > 0 ? `لسه فاضل ${formatNumber(left)} ${left === 1 ? 'سؤال' : 'أسئلة'} من غير إجابة` : 'جاوبت على كل الأسئلة'}</h3>
        <p>{flaggedCount > 0 ? `وعلّمت ${formatNumber(flaggedCount)} للمراجعة. ` : ''}بعد التسليم مش هتقدر تغيّر إجاباتك، ودرجتك هتظهر على طول.</p>
        <div className="cxe-modal__btns">
          {left > 0 && <button type="button" className="cxe-btn cxe-btn--ghost" onClick={onJump}><Icon name="arrowRight" />روح لأول سؤال فاضي</button>}
          <button type="button" className="cxe-btn cxe-btn--ghost" onClick={onCancel}>كمّل الامتحان</button>
          <button type="button" className="cxe-btn cxe-btn--pri" onClick={onSubmit}><Icon name="check" />سلّم دلوقتي</button>
        </div>
      </div>
    </div>
  );
}

export default function CinemaExam(props) {
  const {
    exam, user, wmPositions, isOnline, lastLocalSaveAt, showAntiCheatChoice, submissionError, submitting, onClose,
    showSubmitConfirm, onSubmit, onCancelSubmit, timeLeft, onConfirmSubmit, displayQuestions, flatQuestions, answers, flagged,
    currentQIndex, onSelectQuestion, currentQObj, onAnswer, onFlagToggle, onImageUpload, onFileDialogOpen, onPrevious, onNext,
  } = props;
  const q = currentQObj || displayQuestions[currentQIndex] || {};
  const total = displayQuestions.length;
  const done = useMemo(() => displayQuestions.filter((x) => answered(answers?.[x.id])).length, [displayQuestions, answers]);
  const flaggedCount = displayQuestions.filter((x) => flagged?.[x.id]).length;
  const number = flatQuestions.findIndex((x) => x.id === q.id) + 1;
  const hasPassage = String(q.blockText || '').trim().length > 0;
  const [font, setFontIdx] = useState(readFont);
  const [sheet, setSheet] = useState(false);
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1180);
  const scroller = useRef(null);
  const duration = Math.max(1, Number(exam.duration || 0) * 60);
  const last = currentQIndex >= total - 1;

  useEffect(() => {
    const on = () => setWide(window.innerWidth >= 1180);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  useEffect(() => { scroller.current?.scrollTo?.({ top: 0, behavior: 'smooth' }); }, [q.id]);

  const setFont = (d) => setFontIdx((v) => {
    const n = Math.min(FONT_STEPS.length - 1, Math.max(0, v + d));
    try { localStorage.setItem(FONT_KEY, String(n)); } catch { /* storage blocked */ }
    return n;
  });
  const pick = (i) => { haptic('light'); onAnswer(q.id, i); };
  const go = (i) => { onSelectQuestion(i); setSheet(false); };

  // keyboard: 1-6 pick an answer, ← next, → previous (RTL), F flag
  useEffect(() => {
    const onKey = (e) => {
      if (showSubmitConfirm || e.target?.tagName === 'TEXTAREA' || e.target?.tagName === 'INPUT' || e.ctrlKey || e.metaKey || e.altKey) return;
      const n = Number(e.key);
      if (q.type !== 'essay' && n >= 1 && n <= (q.options?.length || 0)) { e.preventDefault(); pick(n - 1); }
      else if (e.key === 'ArrowLeft' && !last) { e.preventDefault(); onNext(); }
      else if (e.key === 'ArrowRight' && currentQIndex > 0) { e.preventDefault(); onPrevious(); }
      else if (e.key === 'f' || e.key === 'F' || e.key === 'ب') onFlagToggle(q.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const firstEmpty = displayQuestions.findIndex((x) => !answered(answers?.[x.id]));
  const fullscreen = () => document.documentElement.requestFullscreen?.().catch(() => platformNotify('لو ملء الشاشة ما اشتغلش، افتح المنصة من المتصفح نفسه مش من جوه تطبيق تاني.'));

  return (
    <div className="cxe no-select" dir="rtl">
      <ExamWatermarkLayer positions={wmPositions} user={user} />
      <ConnectionStatusBanner isOnline={isOnline} lastLocalSaveAt={lastLocalSaveAt} />
      {showAntiCheatChoice && <ExamSecurityHoldOverlay onClose={onClose} />}
      {showSubmitConfirm && <ConfirmSubmit total={total} done={done} flaggedCount={flaggedCount} onCancel={onCancelSubmit} onSubmit={onSubmit} onJump={() => { onCancelSubmit(); if (firstEmpty >= 0) go(firstEmpty); }} />}

      <header className="cxe-top">
        <span className="cxe-top__brand"><BrandMark size={34} /></span>
        <div className="cxe-top__title">
          <b>{exam.title || 'الامتحان'}</b>
          <small>{formatNumber(total)} سؤال{exam.duration ? ` · ${formatNumber(exam.duration)} دقيقة` : ''}</small>
        </div>
        <span className="cxe-sp" />
        <Timer timeLeft={timeLeft} total={duration} />
        <button type="button" className="cxe-icon" onClick={fullscreen} aria-label="ملء الشاشة" title="ملء الشاشة"><FullIcon /></button>
        <button type="button" className="cxe-btn cxe-btn--pri cxe-top__submit" onClick={onConfirmSubmit}><Icon name="check" /><span>سلّم الامتحان</span></button>
        <div className="cxe-progress" aria-label={`جاوبت ${done} من ${total}`}><i style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
      </header>

      {(submissionError || submitting) && (
        <div role="alert" className="cxe-alert">
          <span>{submitting ? 'بنرفع إجاباتك ونسلّم الامتحان…' : submissionError}</span>
          {submissionError && <button type="button" className="cxe-btn cxe-btn--pri" disabled={submitting} onClick={onSubmit}>جرّب التسليم تاني</button>}
        </div>
      )}

      {!wide && (
        <div className="cxe-stripbar">
          <Navigator compact questions={displayQuestions} flat={flatQuestions} answers={answers} flagged={flagged} current={currentQIndex} onPick={go} />
          <button type="button" className="cxe-icon" onClick={() => setSheet(true)} aria-label="كل الأسئلة"><Icon name="layers" /></button>
        </div>
      )}

      <div className={`cxe-body ${wide ? 'is-wide' : ''} ${hasPassage && wide ? 'has-passage' : ''}`}>
        {hasPassage && wide && <Passage text={q.blockText} font={font} setFont={setFont} />}

        <main className="cxe-main" ref={scroller}>
          {hasPassage && !wide && <Passage collapsible text={q.blockText} font={font} setFont={setFont} />}
          <article className="cxe-q" key={q.id}>
            <div className="cxe-q__head">
              <span className="cxe-q__num"><small>سؤال</small><b>{formatNumber(number || currentQIndex + 1)}</b><small>من {formatNumber(flatQuestions.length || total)}</small></span>
              {q.branch && q.branch !== 'عام' && <span className="cxe-chip"><Icon name="layers" />{q.branch}</span>}
              {q.type === 'essay' && <span className="cxe-chip"><Icon name="edit" />سؤال مقالي</span>}
              <span className="cxe-sp" />
              <button type="button" className={`cxe-flag ${flagged?.[q.id] ? 'is-on' : ''}`} onClick={() => onFlagToggle(q.id)} aria-pressed={Boolean(flagged?.[q.id])}>
                <Icon name="flag" /><span>{flagged?.[q.id] ? 'متعلّم للمراجعة' : 'علّمه أرجعله'}</span>
              </button>
            </div>
            <h2 className="cxe-q__text"><QuestionText text={q.text} /></h2>
            {q.image && <img className="cxe-q__img" src={q.image} alt="صورة السؤال" />}
            {q.type === 'essay'
              ? <Essay question={q} answer={answers?.[q.id]} onAnswer={onAnswer} onImageUpload={onImageUpload} onFileDialogOpen={onFileDialogOpen} />
              : <Options question={q} answer={answers?.[q.id]} onPick={pick} />}
          </article>
          <div className="cxe-hint" aria-hidden="true"><kbd>1</kbd>–<kbd>4</kbd> للاختيار · <kbd>←</kbd> <kbd>→</kbd> للتنقل · <kbd>F</kbd> للتعليم</div>
        </main>

        {wide && (
          <aside className="cxe-side">
            <div className="cxe-side__head"><h3>الأسئلة</h3><small>اضغط على أي رقم تروحله</small></div>
            <Navigator questions={displayQuestions} flat={flatQuestions} answers={answers} flagged={flagged} current={currentQIndex} onPick={go} />
            <div className="cxe-legend">
              <span><i className="is-done" />متجاوب</span><span><i className="is-flag" />متعلّم</span><span><i />فاضي</span>
            </div>
            <div className="cxe-side__stats">
              <div><b>{formatNumber(done)}</b><small>جاوبت</small></div>
              <div><b>{formatNumber(total - done)}</b><small>فاضل</small></div>
              <div><b>{formatNumber(flaggedCount)}</b><small>متعلّم</small></div>
            </div>
            <p className="cxe-save"><Icon name="checkCircle" />إجاباتك بتتحفظ على جهازك أول بأول</p>
          </aside>
        )}
      </div>

      <footer className="cxe-foot">
        <button type="button" className="cxe-btn cxe-btn--ghost" disabled={currentQIndex === 0} onClick={onPrevious}><Icon name="arrowRight" /><span>السابق</span></button>
        <span className="cxe-foot__count">{formatNumber(currentQIndex + 1)} / {formatNumber(total)}</span>
        {last
          ? <button type="button" className="cxe-btn cxe-btn--pri" onClick={onConfirmSubmit}><Icon name="check" />راجع وسلّم</button>
          : <button type="button" className="cxe-btn cxe-btn--pri" onClick={onNext}><span>التالي</span><Icon name="arrowLeft" /></button>}
      </footer>

      {sheet && (
        <div className="cxe-modal cxe-modal--sheet" role="dialog" aria-modal="true" aria-label="كل الأسئلة">
          <button type="button" className="cxe-modal__scrim" aria-label="إغلاق" onClick={() => setSheet(false)} />
          <div className="cxe-modal__box">
            <div className="cxe-side__head"><h3>كل الأسئلة</h3><small>جاوبت {formatNumber(done)} من {formatNumber(total)}</small></div>
            <Navigator questions={displayQuestions} flat={flatQuestions} answers={answers} flagged={flagged} current={currentQIndex} onPick={go} />
            <div className="cxe-legend"><span><i className="is-done" />متجاوب</span><span><i className="is-flag" />متعلّم</span><span><i />فاضي</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
