import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { Bar, Button, Chip, Empty, Sheet, formatDuration, formatNumber } from '../ui/kit.jsx';
import { arabicDate, arabicDateTime, attemptState, normalizeArabic, percentOf, searchIndex, thumbOf, titleOf, textOf } from './insights.js';
import { haptic } from '../device/native.js';
import { platformNotify } from '@shared/core/platform/notifications.jsx';

export function SectionHead({ title, icon, action, onAction, count }) {
  return (
    <div className="nx-sec__head">
      <h2 className="nx-sec__title">{icon && <Icon name={icon} />}{title}{count ? <span className="nx-chip nx-chip--copper">{formatNumber(count)}</span> : null}</h2>
      {action && <button type="button" className="nx-sec__more" onClick={onAction}>{action}<Icon name="chevronLeft" /></button>}
    </div>
  );
}

const LETTERS = ['ن', 'ب', 'ق', 'ع', 'ض', 'ل', 'ح', 'ص'];

export function LessonCard({ item, ctx, kind = 'video', index = 0 }) {
  const title = titleOf(item, kind === 'video' ? 'محاضرة' : 'درس تفاعلي');
  const percent = kind === 'video' && ctx.getVideoWatchPercent ? Math.round(ctx.getVideoWatchPercent(item) || 0) : null;
  const locked = ctx.isBannedContent || (!ctx.isPremium && item?.isPremium);
  const thumb = thumbOf(item);
  const open = () => {
    haptic('light');
    if (kind !== 'video') return ctx.handlePremiumClick ? ctx.handlePremiumClick(() => ctx.setPlayingHtml?.(item)) : ctx.setPlayingHtml?.(item);
    return ctx.handlePremiumClick ? ctx.handlePremiumClick(() => ctx.setPlayingVideo?.(item)) : ctx.setPlayingVideo?.(item);
  };
  return (
    <button type="button" className="nx-lesson" onClick={open} aria-label={`${locked ? 'مقفول: ' : ''}${title}`}>
      <div className="nx-lesson__art">
        {thumb && <img src={thumb} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
        <span className="nx-lesson__letter" aria-hidden="true">{LETTERS[index % LETTERS.length]}</span>
        <span className="nx-lesson__play"><Icon name={locked ? 'lock' : kind === 'video' ? 'play' : 'interactive'} /></span>
        <div className="nx-lesson__badges">
          {item?.isPremium ? <Chip tone="gold" icon="crown">VIP</Chip> : <span />}
          {percent !== null && percent >= 95 ? <Chip tone="patina" icon="check">خلصته</Chip> : item?.linkedExamId ? <Chip className="nx-chip--night" icon="exam">عليه امتحان</Chip> : null}
        </div>
      </div>
      <div className="nx-lesson__body">
        <div className="nx-lesson__title">{title}</div>
        {percent !== null && percent > 0 && percent < 95 && <Bar value={percent} />}
        <div className="nx-lesson__meta">
          <span>{kind === 'video' ? (percent ? `اتفرجت ${formatNumber(percent)}٪` : 'لسه ما بدأتش') : 'نشاط تفاعلي'}</span>
          {item?.duration ? <span>{item.duration}</span> : null}
        </div>
      </div>
    </button>
  );
}

export function ExamCard({ entry, ctx, now, mode = 'open' }) {
  const { exam, attempts = [], completed, start, end } = entry;
  const state = attemptState(attempts);
  const access = ctx.getExamAccessState ? ctx.getExamAccessState(exam) : { allowed: true };
  const pct = completed ? percentOf(completed) : null;
  const questionsCount = (exam.questions || []).reduce((n, g) => n + ((g.subQuestions || []).length || 1), 0);
  const canReview = completed && (now > (end?.getTime() || 0) || exam.allowReviewImmediately);
  const startExam = () => {
    if (exam.accessRule?.requiredExamId || exam.showPreStart) ctx.setPreExam?.(exam);
    else ctx.startExamWithCode?.(exam);
  };
  return (
    <article className="nx-exam">
      <span className={`nx-tile ${mode === 'done' ? (pct >= 75 ? 'nx-tile--patina' : pct >= 50 ? 'nx-tile--gold' : 'nx-tile--danger') : mode === 'upcoming' ? 'nx-tile--info' : 'nx-tile--copper'}`}>
        {mode === 'done' ? <b style={{ fontSize: 13 }}>{formatNumber(pct)}٪</b> : <Icon name={mode === 'upcoming' ? 'calendar' : 'exam'} />}
      </span>
      <div className="nx-exam__main">
        <div className="nx-exam__title">{exam.title || 'امتحان'}</div>
        <div className="nx-exam__meta">
          {exam.duration ? <span><Icon name="clock" />{formatNumber(exam.duration)} دقيقة</span> : null}
          {questionsCount ? <span><Icon name="fileText" />{formatNumber(questionsCount)} سؤال</span> : null}
          {mode === 'open' && end && <span><Icon name="flag" />بيقفل بعد <b className="nx-countdown">{formatDuration(end.getTime() - now)}</b></span>}
          {mode === 'upcoming' && start && <span><Icon name="calendar" />بيفتح بعد <b className="nx-countdown">{formatDuration(start.getTime() - now)}</b></span>}
          {mode === 'done' && <span><Icon name="checkCircle" />{completed.score !== undefined ? `درجتك ${formatNumber(completed.score)}${completed.total ? ` من ${formatNumber(completed.total)}` : ''}` : 'اتسلّم'} · {arabicDate(completed.submittedAt)}</span>}
          {mode === 'closed' && <span><Icon name="lock" />قفل {arabicDate(end)}</span>}
        </div>
        {state && mode !== 'done' && <div><Chip tone={state.tone}>{state.label}</Chip></div>}
        {mode === 'open' && !access.allowed && access.message && <small className="muted">{access.message}</small>}
      </div>
      <div className="nx-exam__actions">
        {mode === 'open' && (
          <Button variant="pri" icon={ctx.isBannedExam || !access.allowed ? 'lock' : 'arrowLeft'} onClick={startExam} disabled={ctx.isBannedExam || !access.allowed}>
            {ctx.isBannedExam ? 'محظور' : !access.allowed ? 'مقفول' : state ? 'كمّل الامتحان' : 'ادخل الامتحان'}
          </Button>
        )}
        {mode === 'upcoming' && <Button variant="soft" icon="bell" onClick={() => platformNotify(`«${exam.title || 'الامتحان'}» هيفتح ${arabicDateTime(start)}.`)}>هيفتح {arabicDate(start)}</Button>}
        {mode === 'done' && (
          <>
            <Button variant={canReview ? 'pri' : 'soft'} icon={canReview ? 'eye' : 'lock'} onClick={() => ctx.setReviewingExam?.(exam)}>{canReview ? 'راجع إجاباتك والتصويب' : `درجتك · المراجعة بعد ${formatDuration((end?.getTime() || 0) - now)}`}</Button>
          </>
        )}
      </div>
    </article>
  );
}

/** Area chart of the last results, drawn on one 0–100 scale. */
export function ScoreChart({ series }) {
  if (!series.length) return <Empty icon="chart" title="لسه مفيش نتايج" text="أول ما تخلص امتحان هيظهر هنا خط مستواك." />;
  const W = 600;
  const H = 160;
  const pad = 14;
  const xs = series.map((_, i) => (series.length === 1 ? W / 2 : pad + (i * (W - pad * 2)) / (series.length - 1)));
  const y = (pct) => pad + ((100 - pct) / 100) * (H - pad * 2);
  // RTL: newest result on the right
  const pts = series.map((s, i) => [W - xs[i], y(s.pct)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`;
  const last = pts[pts.length - 1];
  return (
    <div>
      <div className="nx-chart">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`آخر ${series.length} نتايج: ${series.map((s) => `${s.pct}٪`).join('، ')}`}>
          <defs>
            <linearGradient id="nxArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--nx-copper)" stopOpacity=".3" />
              <stop offset="1" stopColor="var(--nx-copper)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[100, 75, 50, 25].map((g) => <line key={g} x1="0" x2={W} y1={y(g)} y2={y(g)} stroke="var(--nx-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray={g === 50 ? '4 4' : undefined} />)}
          <path className="nx-chart__area" d={area} fill="url(#nxArea)" />
          <path className="nx-chart__line" d={line} fill="none" stroke="var(--nx-copper)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {pts.map((p, i) => <circle key={series[i].id || i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 0 : 0} fill="var(--nx-copper)" />)}
        </svg>
        <span style={{ position: 'absolute', left: `${(last[0] / W) * 100}%`, top: `${(last[1] / H) * 100}%`, width: 14, height: 14, marginLeft: -7, marginTop: -7, borderRadius: '50%', background: 'var(--nx-copper)', boxShadow: '0 0 0 5px color-mix(in srgb, var(--nx-copper) 25%, transparent)' }} />
      </div>
      <div className="nx-chart__labels" style={{ flexDirection: 'row-reverse' }}>
        {series.map((s, i) => <span key={s.id || i} title={s.label}><b style={{ color: 'var(--nx-ink)' }}>{formatNumber(s.pct)}٪</b><br />{s.label}</span>)}
      </div>
    </div>
  );
}

export function StreakCard({ streak }) {
  return (
    <section className="nx-card nx-stack" style={{ gap: 12 }}>
      <div className="nx-sec__head">
        <div className="nx-sec__title"><Icon name="fire" className="nx-flame" />
          {streak.streak > 0 ? <span>{formatNumber(streak.streak)} {streak.streak === 1 ? 'يوم' : streak.streak <= 10 ? 'أيام' : 'يوم'} مذاكرة ورا بعض</span> : <span>ابدأ سلسلة مذاكرة النهارده</span>}
        </div>
        <span className="muted" style={{ fontSize: 'var(--nx-fs-xs)' }}>{streak.studiedToday ? 'ذاكرت النهارده' : 'لسه ما ذاكرتش النهارده'}</span>
      </div>
      <div className="nx-streak">
        {streak.week.map((d, i) => (
          <div key={i} className={`nx-streak__day ${d.on ? 'is-on' : ''} ${d.today ? 'is-today' : ''}`} style={{ animationDelay: `${i * 70}ms` }}>
            <b style={d.on ? { animationDelay: `${0.2 + i * 0.08}s` } : undefined}>{d.on ? <Icon name="check" size={15} /> : d.letter}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

export function NotificationsSheet({ ctx, open, onClose }) {
  const list = ctx.notifications || [];
  return (
    <Sheet open={open} onClose={onClose} title="الإشعارات">
      {list.length ? (
        <div className="nx-list nx-stagger">
          {list.map((n, i) => (
            <div className="nx-row" key={n.id || i} style={{ alignItems: 'flex-start' }}>
              <span className="nx-tile nx-tile--copper"><Icon name="bell" /></span>
              <div className="nx-row__main">
                <b style={{ fontWeight: 600 }}>{n.title || 'تنبيه جديد'}</b>
                <p className="dim" style={{ fontSize: 'var(--nx-fs-s)', whiteSpace: 'pre-line' }}>{n.body || n.text || n.message || ''}</p>
                <small className="muted">{arabicDateTime(n.createdAt)}</small>
              </div>
            </div>
          ))}
        </div>
      ) : <Empty icon="bell" title="مفيش إشعارات" text="أول ما الإدارة تبعت حاجة جديدة هتلاقيها هنا." />}
    </Sheet>
  );
}

/** Search across lectures, files, exams and homework. Opens with Ctrl/⌘+K on desktop. */
export function CommandPalette({ ctx, open, onClose, onOpenRow }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const index = useMemo(() => searchIndex(ctx), [ctx.videos, ctx.htmls, ctx.interactiveExams, ctx.filesAndLinks, ctx.exams, ctx.assignments]); // eslint-disable-line react-hooks/exhaustive-deps
  const results = useMemo(() => {
    const needle = normalizeArabic(q);
    const rows = needle ? index.filter((r) => normalizeArabic(r.title).includes(needle)) : index.slice(0, 12);
    return rows.slice(0, 40);
  }, [index, q]);
  useEffect(() => { if (open) { setQ(''); setActive(0); window.setTimeout(() => inputRef.current?.focus(), 80); } }, [open]);
  useEffect(() => { setActive(0); }, [q]);
  const pickRow = (row) => { onClose(); onOpenRow(row); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    if (e.key === 'Enter' && results[active]) { e.preventDefault(); pickRow(results[active]); }
  };
  let lastGroup = null;
  return (
    <Sheet open={open} onClose={onClose} className="nx-palette">
      <div className="nx-palette__input" style={{ margin: '-4px -18px 0' }}>
        <Icon name="search" />
        <input ref={inputRef} id="nx-search-input" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="دوّر على درس، امتحان، ملف..." aria-label="بحث" />
        <span className="nx-kbd">Esc</span>
      </div>
      <div className="nx-palette__list" role="listbox" style={{ margin: '0 -18px' }}>
        {results.length ? results.map((row, i) => {
          const header = row.group !== lastGroup ? row.group : null;
          lastGroup = row.group;
          return (
            <div key={row.id}>
              {header && <div className="nx-palette__group">{header}</div>}
              <button type="button" role="option" aria-selected={i === active} className="nx-palette__item" onMouseEnter={() => setActive(i)} onClick={() => pickRow(row)}>
                <span className="nx-tile" style={{ width: 34, height: 34, borderRadius: 11 }}><Icon name={row.icon} /></span>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title}</span>
                <Icon name="chevronLeft" />
              </button>
            </div>
          );
        }) : <Empty icon="search" title="مفيش نتايج" text={`مفيش حاجة باسم «${q}». جرّب كلمة تانية.`} />}
      </div>
    </Sheet>
  );
}

export function FileRow({ item }) {
  const url = item.url || item.fileUrl || item.downloadUrl || item.link || item.href || item.contentUrl;
  const isLink = item.type === 'link';
  return (
    <a className="nx-row" href={url || undefined} target="_blank" rel="noreferrer" onClick={(e) => { if (!url) e.preventDefault(); haptic('light'); }} style={{ textDecoration: 'none' }}>
      <span className={`nx-tile ${isLink ? 'nx-tile--info' : 'nx-tile--copper'}`}><Icon name={isLink ? 'link' : 'fileText'} /></span>
      <span className="nx-row__main">
        <span className="nx-row__title">{titleOf(item, 'ملف')}</span>
        <span className="nx-row__sub">{textOf(item) || (isLink ? 'رابط خارجي' : 'ملف للمذاكرة')}</span>
      </span>
      <Icon name={url ? (isLink ? 'external' : 'download') : 'lock'} />
    </a>
  );
}
