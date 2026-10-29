// «السينما» exam screen.
// Top: a dark «theater» band with the title, a countdown ring and the submit button, then the branch tabs
// (الكل · قراءة · نصوص · نحو …) each with its own progress. The student can work branch by branch or on everything.
// Body: passage beside the question on wide screens (above it on phones), big answer cards, numbers grouped by branch.
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ExamWatermarkLayer from '@features/exams/components/ExamWatermarkLayer.jsx';
import ExamSecurityHoldOverlay from '@features/exams/components/ExamSecurityHoldOverlay.jsx';
import { ConnectionStatusBanner } from '@shared/ui/ConnectionStatusBanner.jsx';
import { platformNotify } from '@shared/core/platformShared.jsx';
import { renderBracketHighlightedText } from '@shared/core/platform/text.jsx';
import { Icon } from '../ui/Icon.jsx';
import { InAppCamera, canUseInAppCamera } from './InAppCamera.jsx';
import { isExamLockSupported } from '@features/native-app/examLock.js';
import { formatNumber } from '../ui/kit.jsx';
import { BrandMark } from '../ui/Brand.jsx';
import { haptic } from '../device/native.js';
import '../styles/exam-cinema.css';

const ALL = '__all__';
const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];
const FONT_KEY = 'exam-passage-font-size';
const FONT_STEPS = [15, 17, 19, 21, 24];
const BRANCH_TINT = ['#E5383B', '#FFB547', '#2563EB', '#10B981', '#7C3AED', '#DB2777', '#0EA5E9', '#F97316'];
const answered = (v) => v !== undefined && v !== '' && v !== null && !(typeof v === 'object' && !v?.text && !v?.image);
const branchOf = (q) => (q?.branch && q.branch !== 'عام' ? q.branch : 'أسئلة عامة');

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
  const r = 21; const c = 2 * Math.PI * r;
  const tone = timeLeft <= 60 ? 'is-red' : timeLeft <= 300 ? 'is-amber' : '';
  return (
    <div className={`cxe-timer ${tone}`} role="timer" aria-label={`الوقت المتبقي ${clock(timeLeft)}`}>
      <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r={r} className="cxe-timer__track" /><circle cx="24" cy="24" r={r} className="cxe-timer__val" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} /></svg>
      <span><small>{timeLeft <= 300 ? 'الوقت قرّب يخلص' : 'الوقت الباقي'}</small><b>{clock(timeLeft)}</b></span>
    </div>
  );
}

function Passage({ text, font, setFont, pinned }) {
  const [closed, setClosed] = useState(false);
  const [full, setFull] = useState(false);
  useEffect(() => { setClosed(false); }, [text]);
  const size = { fontSize: `${FONT_STEPS[font]}px` };
  const tools = (
    <div className="cxe-passage__tools">
      <button type="button" onClick={() => setFont(-1)} disabled={font === 0} aria-label="تصغير الخط">أ-</button>
      <button type="button" onClick={() => setFont(1)} disabled={font === FONT_STEPS.length - 1} aria-label="تكبير الخط">أ+</button>
      {pinned && <button type="button" onClick={() => setFull(true)} aria-label="النص بملء الشاشة"><FullIcon /></button>}
    </div>
  );
  return (
    <section className={`cxe-passage ${pinned ? 'is-pinned' : ''} ${closed ? 'is-closed' : ''}`} aria-label="نص القراءة">
      <header>
        <button type="button" className="cxe-passage__title" onClick={() => pinned && setClosed((v) => !v)} aria-expanded={!closed}>
          <Icon name="book" /><b>النص</b>{pinned && <small>{closed ? 'اعرض النص' : 'صغّر'}</small>}
        </button>
        {!closed && tools}
      </header>
      {!closed && <div className="cxe-passage__text" style={size}>{renderBracketHighlightedText(text)}</div>}
      {full && createPortal(
        <div className="cxe-reader" role="dialog" aria-modal="true" aria-label="النص" dir="rtl">
          <header><b>النص</b>{tools}<button type="button" className="cxe-reader__back" onClick={() => setFull(false)}><Icon name="arrowRight" />ارجع للسؤال</button></header>
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
          <button key={i} type="button" role="radio" aria-checked={on} className={`cxe-opt ${on ? 'is-on' : ''}`} style={{ animationDelay: `${0.06 + i * 0.05}s` }} onClick={() => onPick(i)}>
            <i>{on ? <Icon name="check" /> : (LETTERS[i] || i + 1)}</i>
            <span>{opt}</span>
            <kbd aria-hidden="true">{i + 1}</kbd>
          </button>
        );
      })}
    </div>
  );
}

function Essay({ question, answer, onAnswer, onImageUpload, onFileDialogOpen, onFileDialogClose }) {
  const value = typeof answer === 'object' ? answer?.text || '' : answer || '';
  const image = typeof answer === 'object' ? answer?.image : null;
  const [cam, setCam] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);
  // جوه تطبيق الأندرويد بالقفل: ممنوع نفتح أي تطبيق تاني (معرض الصور)، الكاميرا جوه الامتحان بس.
  const locked = isExamLockSupported();
  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try { await onImageUpload(question.id, file); } finally { setUploading(false); }
  };
  const openCamera = () => { onFileDialogOpen?.(); setCam(true); };
  const closeCamera = () => { setCam(false); onFileDialogClose?.(); };
  const pickFile = () => { onFileDialogOpen?.(); fileInput.current?.click(); };
  return (
    <div className="cxe-essay">
      <textarea value={value} placeholder="اكتب إجابتك هنا…" onChange={(e) => onAnswer(question.id, { text: e.target.value, image, fileName: typeof answer === 'object' ? answer?.fileName : null })} />
      <div className="cxe-upload-row">
        {canUseInAppCamera() && (
          <button type="button" className="cxe-upload" onClick={openCamera} disabled={uploading}>
            <Icon name="plus" />
            <span><b>{image ? 'صوّر الإجابة تاني' : 'صوّر إجابتك من الورقة'}</b><small>الكاميرا بتفتح جوه الامتحان، مش بتخرجك منه</small></span>
          </button>
        )}
        {(!locked || !canUseInAppCamera()) && (
          <button type="button" className="cxe-upload cxe-upload--ghost" onClick={pickFile} disabled={uploading}>
            <Icon name="file" />
            <span><b>اختار صورة</b><small>من الموبايل أو الكمبيوتر</small></span>
          </button>
        )}
        <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      {uploading && <p className="cxe-upload__state"><i className="cxe-cam__spin" />بنرفع الصورة…</p>}
      {image && <img className="cxe-essay__img" src={image} alt="صورة الإجابة" />}
      {cam && createPortal(
        <InAppCamera
          onClose={closeCamera}
          onCapture={(file) => { setCam(false); upload(file); }}
          onFallback={locked ? null : () => { setCam(false); pickFile(); }}
        />,
        document.body,
      )}
    </div>
  );
}

function NumberGrid({ groups, numberOf, answers, flagged, currentId, onPick, compact }) {
  if (compact) {
    return (
      <div className="cxe-strip">
        {groups.flatMap((g) => g.items).map(({ q, idx }) => {
          const st = q.id === currentId ? 'is-cur' : flagged?.[q.id] ? 'is-flag' : answered(answers?.[q.id]) ? 'is-done' : '';
          return <button key={q.id} type="button" className={st} onClick={() => onPick(idx)} aria-label={`السؤال ${numberOf(q)}`}>{formatNumber(numberOf(q))}</button>;
        })}
      </div>
    );
  }
  return (
    <div className="cxe-groups">
      {groups.map((g) => (
        <section key={g.name}>
          {groups.length > 1 && <h4 style={{ '--tint': g.tint }}><i />{g.name}<small>{formatNumber(g.done)}/{formatNumber(g.items.length)}</small></h4>}
          <div className="cxe-grid">
            {g.items.map(({ q, idx }) => {
              const st = q.id === currentId ? 'is-cur' : flagged?.[q.id] ? 'is-flag' : answered(answers?.[q.id]) ? 'is-done' : '';
              return <button key={q.id} type="button" className={st} onClick={() => onPick(idx)} aria-label={`السؤال ${numberOf(q)}`}>{formatNumber(numberOf(q))}</button>;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function ConfirmSubmit({ total, done, flaggedCount, perBranch, onCancel, onSubmit, onJump }) {
  const left = total - done;
  return (
    <div className="cxe-modal" role="dialog" aria-modal="true" aria-label="تسليم الامتحان">
      <button type="button" className="cxe-modal__scrim" aria-label="رجوع" onClick={onCancel} />
      <div className="cxe-modal__box">
        <div className="cxe-modal__ring" style={{ '--p': total ? done / total : 0 }}><b>{formatNumber(done)}</b><small>من {formatNumber(total)}</small></div>
        <h3>{left > 0 ? `لسه فاضل ${formatNumber(left)} ${left === 1 ? 'سؤال' : left <= 10 ? 'أسئلة' : 'سؤال'} من غير إجابة` : 'جاوبت على كل الأسئلة'}</h3>
        {perBranch.length > 1 && (
          <div className="cxe-modal__branches">
            {perBranch.map((b) => <span key={b.name} className={b.done < b.items.length ? 'is-open' : ''} style={{ '--tint': b.tint }}><i />{b.name} <b>{formatNumber(b.done)}/{formatNumber(b.items.length)}</b></span>)}
          </div>
        )}
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
    currentQIndex, onSelectQuestion, currentQObj, onAnswer, onFlagToggle, onImageUpload, onFileDialogOpen, onFileDialogClose,
  } = props;
  const all = displayQuestions;
  const q = currentQObj || all[currentQIndex] || {};
  const total = all.length;
  const numberOf = (x) => flatQuestions.findIndex((f) => f.id === x.id) + 1;

  // branches in the order they first appear
  const groups = useMemo(() => {
    const map = new Map();
    all.forEach((x, idx) => {
      const name = branchOf(x);
      if (!map.has(name)) map.set(name, { name, items: [], tint: BRANCH_TINT[map.size % BRANCH_TINT.length] });
      map.get(name).items.push({ q: x, idx });
    });
    return [...map.values()].map((g) => ({ ...g, done: g.items.filter(({ q: x }) => answered(answers?.[x.id])).length }));
  }, [all, answers]);
  const done = groups.reduce((n, g) => n + g.done, 0);
  const flaggedCount = all.filter((x) => flagged?.[x.id]).length;

  const [branch, setBranch] = useState(ALL);
  const scope = branch === ALL ? groups : groups.filter((g) => g.name === branch);
  const scopeItems = scope.flatMap((g) => g.items);
  const posInScope = Math.max(0, scopeItems.findIndex((it) => it.idx === currentQIndex));
  const firstInScope = posInScope === 0;
  const lastInScope = posInScope >= scopeItems.length - 1;
  const currentBranch = groups.find((g) => g.name === branchOf(q));

  const hasPassage = String(q.blockText || '').trim().length > 0;
  const passageGroup = useMemo(() => all.filter((x) => x.blockText && x.blockText === q.blockText), [all, q.blockText]);
  const [font, setFontIdx] = useState(readFont);
  const [sheet, setSheet] = useState(false);
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1180);
  const [dir, setDir] = useState('next');
  const scroller = useRef(null);
  const tabsRef = useRef(null);
  const duration = Math.max(1, Number(exam.duration || 0) * 60);

  useEffect(() => {
    const on = () => setWide(window.innerWidth >= 1180);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  useEffect(() => { scroller.current?.scrollTo?.({ top: 0, behavior: 'smooth' }); }, [q.id]);
  // keep the active branch tab in view on phones
  useEffect(() => { tabsRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }, [branch]);

  const setFont = (d) => setFontIdx((v) => {
    const n = Math.min(FONT_STEPS.length - 1, Math.max(0, v + d));
    try { localStorage.setItem(FONT_KEY, String(n)); } catch { /* storage blocked */ }
    return n;
  });
  const pick = (i) => { haptic('light'); onAnswer(q.id, i); };
  const go = (idx) => { setDir(idx >= currentQIndex ? 'next' : 'prev'); onSelectQuestion(idx); setSheet(false); };
  const next = () => { if (!lastInScope) go(scopeItems[posInScope + 1].idx); else if (branch !== ALL) { const gi = groups.findIndex((g) => g.name === branch); const ng = groups[gi + 1]; if (ng) { setBranch(ng.name); go(ng.items[0].idx); } } };
  const prev = () => { if (!firstInScope) go(scopeItems[posInScope - 1].idx); };
  const chooseBranch = (name) => {
    haptic('light');
    setBranch(name);
    const list = name === ALL ? groups.flatMap((g) => g.items) : (groups.find((g) => g.name === name)?.items || []);
    if (!list.length || list.some((it) => it.idx === currentQIndex)) return;
    const firstOpen = list.find((it) => !answered(answers?.[it.q.id])) || list[0];
    go(firstOpen.idx);
  };
  const nextBranch = branch !== ALL && lastInScope ? groups[groups.findIndex((g) => g.name === branch) + 1] : null;

  // keyboard: 1-6 pick an answer, ← next, → previous (RTL), F flag
  useEffect(() => {
    const onKey = (e) => {
      if (showSubmitConfirm || e.target?.tagName === 'TEXTAREA' || e.target?.tagName === 'INPUT' || e.target?.tagName === 'SELECT' || e.ctrlKey || e.metaKey || e.altKey) return;
      const n = Number(e.key);
      if (q.type !== 'essay' && n >= 1 && n <= (q.options?.length || 0)) { e.preventDefault(); pick(n - 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); prev(); }
      else if (e.key === 'f' || e.key === 'F' || e.key === 'ب') onFlagToggle(q.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const firstEmpty = all.findIndex((x) => !answered(answers?.[x.id]));
  const fullscreen = () => document.documentElement.requestFullscreen?.().catch(() => platformNotify('لو ملء الشاشة ما اشتغلش، افتح المنصة من المتصفح نفسه مش من جوه تطبيق تاني.'));
  const inPassage = hasPassage ? passageGroup.findIndex((x) => x.id === q.id) + 1 : 0;

  return (
    <div className="cxe no-select" dir="rtl">
      <ExamWatermarkLayer positions={wmPositions} user={user} />
      <ConnectionStatusBanner isOnline={isOnline} lastLocalSaveAt={lastLocalSaveAt} />
      {showAntiCheatChoice && <ExamSecurityHoldOverlay onClose={onClose} />}
      {showSubmitConfirm && <ConfirmSubmit total={total} done={done} flaggedCount={flaggedCount} perBranch={groups} onCancel={onCancelSubmit} onSubmit={onSubmit} onJump={() => { onCancelSubmit(); if (firstEmpty >= 0) { setBranch(ALL); go(firstEmpty); } }} />}

      <header className="cxe-band">
        <span className="cxe-band__art" aria-hidden="true" />
        <div className="cxe-band__row">
          <span className="cxe-band__brand"><BrandMark size={38} /></span>
          <div className="cxe-band__title">
            <small>امتحان</small>
            <b>{exam.title || 'الامتحان'}</b>
          </div>
          <span className="cxe-sp" />
          <Timer timeLeft={timeLeft} total={duration} />
          <button type="button" className="cxe-icon" onClick={fullscreen} aria-label="ملء الشاشة" title="ملء الشاشة"><FullIcon /></button>
          <button type="button" className="cxe-btn cxe-btn--white cxe-band__submit" onClick={onConfirmSubmit}><Icon name="check" /><span>سلّم الامتحان</span></button>
        </div>
        <nav className="cxe-tabs" ref={tabsRef} role="tablist" aria-label="فروع الامتحان">
          <button type="button" role="tab" aria-selected={branch === ALL} onClick={() => chooseBranch(ALL)} style={{ '--tint': '#fff', '--p': total ? done / total : 0 }}>
            <i className="cxe-tabs__ring" /><span><b>كل الأسئلة</b><small>{formatNumber(done)} من {formatNumber(total)}</small></span>
          </button>
          {groups.length > 1 && groups.map((g) => (
            <button key={g.name} type="button" role="tab" aria-selected={branch === g.name} onClick={() => chooseBranch(g.name)} style={{ '--tint': g.tint, '--p': g.items.length ? g.done / g.items.length : 0 }}>
              <i className="cxe-tabs__ring" /><span><b>{g.name}</b><small>{formatNumber(g.done)} من {formatNumber(g.items.length)}</small></span>
            </button>
          ))}
        </nav>
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
          <NumberGrid compact groups={scope} numberOf={numberOf} answers={answers} flagged={flagged} currentId={q.id} onPick={go} />
          <button type="button" className="cxe-icon" onClick={() => setSheet(true)} aria-label="كل الأسئلة"><Icon name="layers" /></button>
        </div>
      )}

      <div className={`cxe-body ${wide ? 'is-wide' : ''} ${hasPassage && wide ? 'has-passage' : ''}`}>
        {hasPassage && wide && <Passage text={q.blockText} font={font} setFont={setFont} />}

        <main className="cxe-main" ref={scroller}>
          {hasPassage && !wide && <Passage pinned text={q.blockText} font={font} setFont={setFont} />}
          <article className={`cxe-q is-${dir}`} key={q.id} style={{ '--tint': currentBranch?.tint || 'var(--nx-copper)' }}>
            <div className="cxe-q__head">
              <span className="cxe-q__num"><small>سؤال</small><b>{formatNumber(numberOf(q) || currentQIndex + 1)}</b><small>من {formatNumber(flatQuestions.length || total)}</small></span>
              <span className="cxe-chip cxe-chip--branch"><i />{branchOf(q)}</span>
              {inPassage > 0 && passageGroup.length > 1 && <span className="cxe-chip"><Icon name="book" />سؤال {formatNumber(inPassage)} على النص</span>}
              {q.type === 'essay' && <span className="cxe-chip"><Icon name="edit" />مقالي</span>}
              <span className="cxe-sp" />
              <button type="button" className={`cxe-flag ${flagged?.[q.id] ? 'is-on' : ''}`} onClick={() => onFlagToggle(q.id)} aria-pressed={Boolean(flagged?.[q.id])}>
                <Icon name="flag" /><span>{flagged?.[q.id] ? 'متعلّم للمراجعة' : 'علّمه أرجعله'}</span>
              </button>
            </div>
            <h2 className="cxe-q__text"><QuestionText text={q.text} /></h2>
            {q.image && <img className="cxe-q__img" src={q.image} alt="صورة السؤال" />}
            {q.type === 'essay'
              ? <Essay question={q} answer={answers?.[q.id]} onAnswer={onAnswer} onImageUpload={onImageUpload} onFileDialogOpen={onFileDialogOpen} onFileDialogClose={onFileDialogClose} />
              : <Options question={q} answer={answers?.[q.id]} onPick={pick} />}
          </article>
          <div className="cxe-hint" aria-hidden="true"><kbd>1</kbd>–<kbd>4</kbd> للاختيار · <kbd>←</kbd> <kbd>→</kbd> للتنقل · <kbd>F</kbd> للتعليم</div>
        </main>

        {wide && (
          <aside className="cxe-side">
            <div className="cxe-side__head"><h3>{branch === ALL ? 'كل الأسئلة' : branch}</h3><small>اضغط على أي رقم تروحله</small></div>
            <NumberGrid groups={scope} numberOf={numberOf} answers={answers} flagged={flagged} currentId={q.id} onPick={go} />
            <div className="cxe-legend">
              <span><i className="is-done" />متجاوب</span><span><i className="is-flag" />متعلّم</span><span><i />فاضي</span>
            </div>
            <div className="cxe-side__stats">
              <div><b>{formatNumber(done)}</b><small>جاوبت</small></div>
              <div><b>{formatNumber(total - done)}</b><small>فاضل</small></div>
              <div><b>{formatNumber(flaggedCount)}</b><small>متعلّم</small></div>
            </div>
            <p className="cxe-save"><Icon name="checkCircle" />إجاباتك بتتحفظ أول بأول</p>
          </aside>
        )}
      </div>

      <footer className="cxe-foot">
        <button type="button" className="cxe-btn cxe-btn--ghost" disabled={firstInScope} onClick={prev}><Icon name="arrowRight" /><span>السابق</span></button>
        <span className="cxe-foot__count">
          <span><b>{formatNumber(posInScope + 1)}</b> / {formatNumber(scopeItems.length)}</span>
          {branch !== ALL && <small>{branch}</small>}
        </span>
        {nextBranch
          ? <button type="button" className="cxe-btn cxe-btn--pri" onClick={next}><span>{nextBranch.name}</span><Icon name="arrowLeft" /></button>
          : lastInScope
            ? <button type="button" className="cxe-btn cxe-btn--pri" onClick={onConfirmSubmit}><Icon name="check" />راجع وسلّم</button>
            : <button type="button" className="cxe-btn cxe-btn--pri" onClick={next}><span>التالي</span><Icon name="arrowLeft" /></button>}
      </footer>

      {sheet && (
        <div className="cxe-modal cxe-modal--sheet" role="dialog" aria-modal="true" aria-label="كل الأسئلة">
          <button type="button" className="cxe-modal__scrim" aria-label="إغلاق" onClick={() => setSheet(false)} />
          <div className="cxe-modal__box">
            <div className="cxe-side__head"><h3>{branch === ALL ? 'كل الأسئلة' : branch}</h3><small>جاوبت {formatNumber(done)} من {formatNumber(total)}</small></div>
            <NumberGrid groups={scope} numberOf={numberOf} answers={answers} flagged={flagged} currentId={q.id} onPick={go} />
            <div className="cxe-legend"><span><i className="is-done" />متجاوب</span><span><i className="is-flag" />متعلّم</span><span><i />فاضي</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
