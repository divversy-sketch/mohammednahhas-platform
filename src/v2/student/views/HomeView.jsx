import { useMemo } from 'react';
import { getGradeLabel } from '@shared/constants/grades';
import { Icon, KhatamStar } from '../../ui/Icon.jsx';
import { Button, Chip, CountUp, Empty, formatNumber, useNow } from '../../ui/kit.jsx';
import { greeting, orderOf, scoreSeries, studyStreak, todoList, titleOf } from '../insights.js';
import { ExamCard, LessonCard, ScoreChart, SectionHead, StreakCard } from '../parts.jsx';

function ContinueCard({ ctx, go, buckets }) {
  const video = ctx.latestVideoActivity && !ctx.latestVideoActivity.isCompleted ? ctx.latestVideoActivity.video : null;
  const percent = video ? Math.round(ctx.getVideoWatchPercent(video) || 0) : 0;
  let card;
  if (video) {
    card = { kicker: 'كمّل من مكان ما وقفت', title: titleOf(video, 'محاضرة'), meta: `اتفرجت ${formatNumber(percent)}٪`, percent, cta: 'كمّل المحاضرة', icon: 'play', action: () => ctx.handlePremiumClick(() => ctx.setPlayingVideo(video)) };
  } else if (ctx.inProgressExam) {
    card = { kicker: 'عندك امتحان مفتوح', title: ctx.inProgressExam.title || 'امتحان', meta: 'المحاولة محفوظة', cta: 'افتح الامتحان', icon: 'exam', action: () => ctx.startExamWithCode(ctx.inProgressExam) };
  } else if (buckets.open[0]) {
    const exam = buckets.open[0].exam;
    card = { kicker: 'امتحان متاح دلوقتي', title: exam.title || 'امتحان', meta: exam.duration ? `${formatNumber(exam.duration)} دقيقة` : 'ادخل قبل ما يقفل', cta: 'ادخل الامتحان', icon: 'exam', action: () => go('exams:open') };
  } else if (ctx.pendingAssignments?.[0]) {
    card = { kicker: 'واجب مطلوب منك', title: ctx.pendingAssignments[0].title || 'واجب', meta: 'سلّمه قبل آخر ميعاد', cta: 'افتح الواجب', icon: 'qr', action: () => go('exams:homework') };
  } else {
    const first = [...(ctx.videos || [])].sort((a, b) => orderOf(a) - orderOf(b))[0];
    card = first
      ? { kicker: 'ابدأ من هنا', title: titleOf(first, 'محاضرة'), meta: 'أول محاضرة في المنهج', cta: 'ابدأ المذاكرة', icon: 'play', action: () => ctx.handlePremiumClick(() => ctx.setPlayingVideo(first)) }
      : { kicker: 'المنصة جاهزة', title: 'أول ما المحاضرات تنزل هتلاقيها هنا', meta: getGradeLabel(ctx.userData?.grade), cta: 'شوف المحاضرات', icon: 'video', action: () => go('learn') };
  }
  return (
    <section className="nx-card nx-night nx-continue" aria-label={card.kicker}>
      <span className="nx-night__glow" aria-hidden="true" />
      <span className="nx-night__glow nx-night__glow--gold" aria-hidden="true" />
      <KhatamStar />
      <Chip tone="night" icon="spark">{card.kicker}</Chip>
      <div className="nx-continue__title">{card.title}</div>
      <div className="dim" style={{ fontSize: 'var(--nx-fs-s)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {card.meta}
      </div>
      {card.percent ? <div className="nx-bar" role="progressbar" aria-valuenow={card.percent}><i style={{ width: `${card.percent}%` }} /></div> : null}
      <div className="nx-continue__actions">
        <Button variant="pri" icon={card.icon} onClick={card.action} haptics="medium">{card.cta}</Button>
        <Button variant="glass" icon="focus" onClick={() => ctx.setShowFocusMode(true)}>جلسة تركيز</Button>
      </div>
    </section>
  );
}

function Kpis({ ctx, streak }) {
  const completed = (ctx.completedExamResults || []).length;
  return (
    <div className="nx-kpis nx-stagger">
      <div className="nx-kpi"><span className="nx-kpi__label"><Icon name="target" />متوسط درجاتك</span><span className="nx-kpi__value"><CountUp value={Math.round(ctx.averageScore || 0)} suffix="٪" /></span><span className="nx-kpi__hint">{completed ? `من ${formatNumber(completed)} امتحان` : 'لسه مفيش امتحانات'}</span></div>
      <div className="nx-kpi"><span className="nx-kpi__label"><Icon name="video" />المحاضرات</span><span className="nx-kpi__value"><CountUp value={ctx.videoCompletionPercent || 0} suffix="٪" /></span><span className="nx-kpi__hint">خلصت {formatNumber(ctx.completedVideoCount || 0)} من {formatNumber((ctx.videos || []).length)}</span></div>
      <div className="nx-kpi"><span className="nx-kpi__label"><Icon name="fire" />أيام ورا بعض</span><span className="nx-kpi__value"><CountUp value={streak.streak} /></span><span className="nx-kpi__hint">ذاكرت {formatNumber(streak.activeThisWeek)} أيام الأسبوع ده</span></div>
      <div className="nx-kpi"><span className="nx-kpi__label"><Icon name="mistake" />بنك الأخطاء</span><span className="nx-kpi__value"><CountUp value={(ctx.mistakes || []).length} /></span><span className="nx-kpi__hint">سؤال محتاج مراجعة</span></div>
    </div>
  );
}

function TodoCard({ ctx, go, buckets }) {
  const items = todoList(ctx, buckets);
  const act = (item) => {
    if (item.kind === 'exam') return item.exam === ctx.inProgressExam ? ctx.startExamWithCode(item.exam) : go('exams:open');
    if (item.kind === 'homework') return go('exams:homework');
    if (item.kind === 'mistakes') return go('progress:mistakes');
    return null;
  };
  return (
    <section className="nx-card nx-sec">
      <SectionHead title="مطلوب منك" icon="checkCircle" count={items.length} />
      {items.length ? (
        <div className="nx-list nx-stagger">
          {items.map((item) => (
            <button key={item.key} type="button" className="nx-row" onClick={() => act(item)}>
              <span className={`nx-tile nx-tile--${item.tone}`}><Icon name={item.icon} /></span>
              <span className="nx-row__main"><span className="nx-row__title">{item.title}</span><span className="nx-row__sub">{item.sub}</span></span>
              <Icon name="chevronLeft" />
            </button>
          ))}
        </div>
      ) : <Empty icon="checkCircle" title="مفيش حاجة متأخرة عليك" text="كل الامتحانات والواجبات المطلوبة خلصانة. راجع محاضرة أو حل مراجعة سريعة." />}
    </section>
  );
}

export default function HomeView({ ctx, go, buckets }) {
  const now = useNow(1000);
  const streak = useMemo(() => studyStreak(ctx), [ctx.videoViews, ctx.examResults, ctx.assignmentSubmissions, ctx.hwResults]); // eslint-disable-line react-hooks/exhaustive-deps
  const series = useMemo(() => scoreSeries(ctx, 7), [ctx.examResults, ctx.exams]); // eslint-disable-line react-hooks/exhaustive-deps
  const recent = useMemo(() => {
    const watched = new Set((ctx.videoViews || []).map((v) => v.videoId));
    const list = [...(ctx.videos || [])].sort((a, b) => orderOf(a) - orderOf(b));
    const unfinished = list.filter((v) => (ctx.getVideoWatchPercent(v) || 0) < 95);
    return (unfinished.length ? unfinished : list).sort((a, b) => Number(watched.has(b.id)) - Number(watched.has(a.id))).slice(0, 8);
  }, [ctx.videos, ctx.videoViews]); // eslint-disable-line react-hooks/exhaustive-deps
  const upcoming = buckets.upcoming.slice(0, 2);
  const daysLeft = ctx.subscriptionDaysLeft;

  return (
    <div className="nx-stack nx-home">
      <div className="nx-hello">
        <div className="nx-hello__txt">
          <h1>{greeting()}، {String(ctx.userData?.name || 'يا بطل').trim().split(/\s+/)[0]}</h1>
          <p>{getGradeLabel(ctx.userData?.grade)} {ctx.isPremium ? '· مشترك' : ''}</p>
        </div>
        {ctx.isPremium ? <Chip tone="gold" icon="crown">مشترك</Chip> : <Button variant="soft" size="s" icon="crown" onClick={() => go('account:billing')}>اشترك</Button>}
      </div>

      <div className="nx-split">
        <div className="nx-stack">
          <ContinueCard ctx={ctx} go={go} buckets={buckets} />
          <Kpis ctx={ctx} streak={streak} />
          <TodoCard ctx={ctx} go={go} buckets={buckets} />
        </div>
        <div className="nx-stack">
          <StreakCard streak={streak} />
          <section className="nx-card nx-sec">
            <SectionHead title="مستواك في آخر الامتحانات" icon="trend" action="التفاصيل" onAction={() => go('progress')} />
            <ScoreChart series={series} />
          </section>
          {upcoming.length > 0 && (
            <section className="nx-sec">
              <SectionHead title="امتحانات جاية" icon="calendar" action="الكل" onAction={() => go('exams:upcoming')} />
              {upcoming.map((entry) => <ExamCard key={entry.exam.id} entry={entry} ctx={ctx} now={now} mode="upcoming" />)}
            </section>
          )}
          {ctx.isPremium && Number.isFinite(daysLeft) && daysLeft <= 7 && (
            <button type="button" className="nx-card nx-card--tap nx-row" onClick={() => go('account:billing')}>
              <span className="nx-tile nx-tile--gold"><Icon name="crown" /></span>
              <span className="nx-row__main"><span className="nx-row__title">اشتراكك فاضله {formatNumber(Math.max(0, daysLeft))} {daysLeft === 1 ? 'يوم' : 'أيام'}</span><span className="nx-row__sub">جدّد عشان المحاضرات ما تقفلش</span></span>
              <Icon name="chevronLeft" />
            </button>
          )}
        </div>
      </div>

      <section className="nx-sec">
        <SectionHead title={recent.some((v) => (ctx.getVideoWatchPercent(v) || 0) > 0) ? 'كمّل محاضراتك' : 'محاضرات المنهج'} icon="video" action="كل المحاضرات" onAction={() => go('learn:lectures')} />
        {recent.length
          ? <div className="nx-hscroll">{recent.map((v, i) => <LessonCard key={v.id} item={v} ctx={ctx} index={i} />)}</div>
          : <Empty icon="video" title="لسه مفيش محاضرات" text="أول ما المستر ينزّل محاضرات لصفّك هتظهر هنا." />}
      </section>
    </div>
  );
}
