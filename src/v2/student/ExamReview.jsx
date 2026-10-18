// Full exam review for the student, in the «السينما» look.
// Opens once the exam window has closed for everyone (or right away when the teacher allows it):
// score, right / wrong / skipped, every question with the student's answer, the correct one and the explanation.
import { Fragment, useEffect, useMemo, useState } from 'react';
import { renderBracketHighlightedText } from '@shared/core/platform/text.jsx';
import { extractAllQuestions, getQuestionMaxScore } from '@shared/core/platform/metrics.js';
import { Icon } from '../ui/Icon.jsx';
import { CountUp, formatDuration, formatNumber, useNow } from '../ui/kit.jsx';
import { arabicDateTime, examWindow } from './insights.js';
import '../styles/exam-review.css';

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/** When the full review unlocks for this exam (null = already open). */
export function reviewOpensAt(exam, now = Date.now()) {
  if (!exam || exam.allowReviewImmediately) return null;
  const { end } = examWindow(exam);
  return end && end.getTime() > now ? end : null;
}

function isAnswered(q, a) {
  if (q.type === 'essay') return !!(a && ((typeof a === 'string' && a.trim()) || a.text || a.image));
  return a !== undefined && a !== null && a !== '';
}

function buildReview(exam, result) {
  const answers = result?.answers || {};
  const essayScores = result?.essayScores || {};
  const essayMax = result?.essayMaxScores || {};
  const essayGrades = result?.essayGrades || {};
  let lastBlock = null;
  const items = extractAllQuestions(exam).map((q, i) => {
    const a = answers[q.id];
    const answered = isAnswered(q, a);
    let state;
    let earned = 0;
    const max = q.type === 'essay' ? num(essayMax[q.id], getQuestionMaxScore(q)) : getQuestionMaxScore(q);
    if (q.type === 'essay') {
      const s = essayScores[q.id] ?? essayGrades[q.id]?.score;
      if (!answered) state = 'skipped';
      else if (s === undefined || s === null || s === '') state = 'pending';
      else { earned = num(s); state = earned >= max ? 'right' : earned > 0 ? 'partial' : 'wrong'; }
    } else if (!answered) state = 'skipped';
    else if (Number(a) === Number(q.correctIdx)) { state = 'right'; earned = max; }
    else state = 'wrong';
    const showPassage = q.blockText && q.blockText !== lastBlock;
    lastBlock = q.blockText || lastBlock;
    return { q, n: i + 1, answer: a, answered, state, earned, max, showPassage };
  });
  const count = (s) => items.filter((it) => it.state === s).length;
  const earned = items.reduce((s, it) => s + it.earned, 0);
  const possible = items.reduce((s, it) => s + it.max, 0);
  const pct = num(result?.percentage, possible ? Math.round((earned / possible) * 100) : 0);
  const branches = {};
  items.forEach((it) => {
    const b = it.q.branch || 'عام';
    branches[b] = branches[b] || { earned: 0, possible: 0, wrong: 0 };
    branches[b].earned += it.earned; branches[b].possible += it.max;
    if (it.state === 'wrong') branches[b].wrong += 1;
  });
  return { items, right: count('right'), wrong: count('wrong'), skipped: count('skipped'), pending: count('pending'), partial: count('partial'), earned, possible, pct, branches };
}

function verdict(p) {
  if (p >= 90) return 'ممتاز! ده مستوى الأوائل';
  if (p >= 75) return 'برافو، مستوى عالي';
  if (p >= 60) return 'كويس، وفاضل خطوة';
  if (p >= 50) return 'نجحت، بس محتاج تراجع أخطاءك';
  return 'متزعلش، الأخطاء دي هي اللي هتعلّمك';
}

function Ring({ pct }) {
  const r = 70; const c = 2 * Math.PI * r;
  const tone = pct >= 75 ? 'var(--nx-patina)' : pct >= 50 ? 'var(--nx-gold-2)' : 'var(--nx-copper)';
  return (
    <div className="xr-ring">
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="12" />
        <circle cx="80" cy="80" r={r} fill="none" stroke={tone} strokeWidth="12" strokeLinecap="round" strokeDasharray={c} style={{ '--off': c - (c * Math.max(0, Math.min(100, pct))) / 100, '--c': c }} className="xr-ring__arc" transform="rotate(-90 80 80)" />
      </svg>
      <b><CountUp value={pct} suffix="٪" /></b>
    </div>
  );
}

function Hero({ exam, result, stats, locked, opensAt, now }) {
  const scoreText = result?.score !== undefined ? `${formatNumber(num(result.score))} من ${formatNumber(num(result.total ?? result.totalPossible, stats.possible))}` : `${formatNumber(stats.earned)} من ${formatNumber(stats.possible)}`;
  const taken = num(result?.timeTaken);
  return (
    <section className="xr-hero">
      <span className="xr-hero__art" />
      <span className="xr-hero__glyph" aria-hidden="true">{stats.pct >= 75 ? '★' : '«'}</span>
      <div className="xr-hero__in">
        <Ring pct={stats.pct} />
        <div className="xr-hero__txt">
          <span className="xr-kicker"><Icon name="checkCircle" />نتيجتك في الامتحان</span>
          <h1>{exam.title || 'امتحان'}</h1>
          <p className="xr-verdict">{verdict(stats.pct)}</p>
          <div className="xr-meta">
            <span><Icon name="grade" />درجتك {scoreText}</span>
            {taken > 0 && <span><Icon name="clock" />خلصته في {formatNumber(Math.floor(taken / 60))} د {formatNumber(taken % 60)} ث</span>}
            {result?.submittedAt && <span><Icon name="calendar" />{arabicDateTime(result.submittedAt)}</span>}
          </div>
          {locked && (
            <div className="xr-lock">
              <Icon name="lock" />
              <div><b>المراجعة الكاملة بتفتح بعد <span className="xr-count">{formatDuration(opensAt.getTime() - now)}</span></b>
                <small>الإجابات الصح والتصويب بيظهروا لما وقت الامتحان يخلص عند الكل ({arabicDateTime(opensAt)})، عشان محدش ياخد الإجابات من حد.</small></div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Option({ text, idx, q, answer }) {
  const correct = idx === Number(q.correctIdx);
  const mine = answer !== undefined && Number(answer) === idx;
  const cls = correct ? 'is-right' : mine ? 'is-wrong' : '';
  return (
    <div className={`xr-opt ${cls}`}>
      <i>{correct ? <Icon name="check" size={16} /> : mine ? <Icon name="close" size={16} /> : LETTERS[idx] || idx + 1}</i>
      <span>{text}</span>
      {correct && <em>{mine ? 'إجابتك صح' : 'الإجابة الصح'}</em>}
      {mine && !correct && <em>إجابتك</em>}
    </div>
  );
}

function QuestionCard({ it }) {
  const { q, n, answer, state } = it;
  const [passageOpen, setPassageOpen] = useState(true);
  const label = { right: 'صح', wrong: 'غلط', skipped: 'ما جاوبتش', pending: 'لسه بيتصحح', partial: 'جزء من الدرجة' }[state];
  const img = q.image || q.imageUrl || q.questionImage;
  return (
    <article className={`xr-q is-${state}`} id={`xr-q-${n}`}>
      <header className="xr-q__head">
        <span className="xr-q__n">{formatNumber(n)}</span>
        {q.branch && <span className="xr-tag">{q.branch}</span>}
        {q.type === 'essay' && <span className="xr-tag">مقالي</span>}
        <span className={`xr-state is-${state}`}>{label}</span>
        <span className="xr-pts">{formatNumber(it.earned)} / {formatNumber(it.max)}</span>
      </header>
      {it.showPassage && (
        <div className="xr-passage">
          <button type="button" onClick={() => setPassageOpen((v) => !v)} aria-expanded={passageOpen}><Icon name="fileText" />نص القراءة<Icon name={passageOpen ? 'chevronDown' : 'chevronLeft'} /></button>
          {passageOpen && <div className="xr-passage__txt">{renderBracketHighlightedText(q.blockText)}</div>}
        </div>
      )}
      <h3 className="xr-q__text">{String(q.text || '').split('|').map((part, i, arr) => <Fragment key={i}>{renderBracketHighlightedText(part.trim())}{i < arr.length - 1 && <br />}</Fragment>)}</h3>
      {img && <img className="xr-q__img" src={img} alt="صورة السؤال" loading="lazy" />}
      {q.type === 'essay' ? (
        <div className="xr-essay">
          <small>إجابتك</small>
          {it.answered ? (
            <>
              {(typeof answer === 'string' ? answer : answer?.text) && <p>{typeof answer === 'string' ? answer : answer.text}</p>}
              {answer?.image && <img src={answer.image} alt="إجابتك المصورة" loading="lazy" />}
            </>
          ) : <p className="xr-dim">ما كتبتش إجابة للسؤال ده.</p>}
          {q.modelAnswer && <div className="xr-model"><small>الإجابة النموذجية</small><p>{q.modelAnswer}</p></div>}
        </div>
      ) : (
        <div className="xr-opts">
          {(Array.isArray(q.options) ? q.options : []).map((o, idx) => <Option key={idx} text={o} idx={idx} q={q} answer={answer} />)}
          {!it.answered && <p className="xr-dim xr-skip"><Icon name="info" size={15} />ما اخترتش إجابة للسؤال ده.</p>}
        </div>
      )}
      {q.explanation && (
        <div className="xr-explain"><b><Icon name="spark" />التصويب والشرح</b><p>{q.explanation}</p></div>
      )}
    </article>
  );
}

export default function ExamReview({ exam, result, onClose, onPracticeMistakes }) {
  const now = useNow(1000);
  const opensAt = reviewOpensAt(exam, now);
  const locked = Boolean(opensAt);
  const stats = useMemo(() => buildReview(exam, result), [exam, result]);
  const [filter, setFilter] = useState('all');
  useEffect(() => { window.scrollTo({ top: 0 }); }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const filters = [['all', 'الكل', stats.items.length], ['wrong', 'الغلط', stats.wrong + stats.partial], ['right', 'الصح', stats.right], ['skipped', 'المتروك', stats.skipped], ['pending', 'بيتصحح', stats.pending]].filter(([k, , c]) => k === 'all' || c > 0);
  const shown = stats.items.filter((it) => filter === 'all' || it.state === filter || (filter === 'wrong' && it.state === 'partial'));
  const jump = (n) => document.getElementById(`xr-q-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="nx xr" dir="rtl">
      <header className="xr-bar">
        <button type="button" className="xr-back" onClick={onClose}><Icon name="arrowRight" />رجوع</button>
        <b className="xr-bar__title">{exam.title || 'مراجعة الامتحان'}</b>
        <span className="xr-bar__score">{formatNumber(stats.pct)}٪</span>
      </header>

      <Hero exam={exam} result={result} stats={stats} locked={locked} opensAt={opensAt} now={now} />

      <div className="xr-body">
        <div className="xr-tiles">
          <div className="xr-tile is-right" style={{ animationDelay: '.1s' }}><Icon name="checkCircle" /><b><CountUp value={stats.right} /></b><small>إجابة صح</small></div>
          <div className="xr-tile is-wrong" style={{ animationDelay: '.18s' }}><Icon name="mistake" /><b><CountUp value={stats.wrong} /></b><small>إجابة غلط</small></div>
          <div className="xr-tile is-skipped" style={{ animationDelay: '.26s' }}><Icon name="help" /><b><CountUp value={stats.skipped} /></b><small>ما جاوبتش</small></div>
          <div className="xr-tile" style={{ animationDelay: '.34s' }}><Icon name="grade" /><b>{formatNumber(stats.earned)}<small> / {formatNumber(stats.possible)}</small></b><small>{stats.pending ? `${formatNumber(stats.pending)} مقالي لسه بيتصحح` : 'مجموع الدرجات'}</small></div>
        </div>

        {Object.keys(stats.branches).length > 1 && (
          <section className="xr-card">
            <h2><Icon name="chart" />مستواك في كل فرع</h2>
            <div className="xr-branches">
              {Object.entries(stats.branches).map(([b, s]) => {
                const p = s.possible ? Math.round((s.earned / s.possible) * 100) : 0;
                return (
                  <div key={b} className="xr-branch">
                    <div><b>{b}</b><span>{formatNumber(p)}٪{s.wrong ? ` · ${formatNumber(s.wrong)} غلط` : ''}</span></div>
                    <div className="xr-bar2"><i style={{ width: `${p}%`, background: p >= 75 ? 'var(--nx-patina)' : p >= 50 ? 'var(--nx-gold-2)' : 'var(--nx-copper)' }} /></div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {locked ? (
          <section className="xr-card xr-wait">
            <Icon name="lock" size={34} />
            <h2>الإجابات هتظهر هنا بعد {formatDuration(opensAt.getTime() - now)}</h2>
            <p>شايف درجتك وعدد الصح والغلط دلوقتي. أول ما وقت الامتحان يخلص هتقدر تشوف كل سؤال، إجابتك، الإجابة الصح، والشرح.</p>
          </section>
        ) : (
          <>
            <section className="xr-card">
              <h2><Icon name="layers" />كل الأسئلة</h2>
              <div className="xr-nav">
                {stats.items.map((it) => <button key={it.n} type="button" className={`is-${it.state}`} onClick={() => { setFilter('all'); setTimeout(() => jump(it.n), 30); }} aria-label={`سؤال ${it.n}`}>{formatNumber(it.n)}</button>)}
              </div>
              <div className="xr-legend"><span className="is-right">صح</span><span className="is-wrong">غلط</span><span className="is-skipped">ما جاوبتش</span>{stats.pending > 0 && <span className="is-pending">بيتصحح</span>}</div>
            </section>

            <div className="xr-filters" role="group" aria-label="فلترة الأسئلة">
              {filters.map(([k, l, c]) => <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}<span>{formatNumber(c)}</span></button>)}
            </div>

            <div className="xr-list">
              {shown.map((it) => <QuestionCard key={it.q.id || it.n} it={it} />)}
              {!shown.length && <p className="xr-dim" style={{ textAlign: 'center', padding: 30 }}>مفيش أسئلة في الفلتر ده.</p>}
            </div>

            {(stats.wrong > 0 && onPracticeMistakes) && (
              <section className="xr-card xr-cta">
                <div><b>عايز تتأكد إنك فهمت أخطاءك؟</b><small>الأسئلة اللي غلطت فيها اتضافت لبنك الأخطاء. امتحن نفسك فيها تاني.</small></div>
                <button type="button" className="xr-btn" onClick={onPracticeMistakes}><Icon name="mistake" />امتحن نفسك في أخطائك</button>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
