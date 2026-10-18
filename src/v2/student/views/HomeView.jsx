// Home · «السينما»: a moving poster with what matters now, then rails you swipe through.
import { useMemo } from 'react';
import { getGradeLabel } from '@shared/constants/grades';
import { Icon } from '../../ui/Icon.jsx';
import { CountUp, Empty, formatDuration, formatNumber, useNow } from '../../ui/kit.jsx';
import { arabicDate, arabicDateTime, greeting, orderOf, scoreSeries, studyStreak, thumbOf, todoList, titleOf } from '../insights.js';
import { ExamCard, ScoreChart, SectionHead, StreakCard } from '../parts.jsx';
import { HeroCarousel, Poster, Rail, TaskPoster } from '../cinema.jsx';

function useSlides(ctx, go, buckets, now) {
  const slides = [];
  const video = ctx.latestVideoActivity && !ctx.latestVideoActivity.isCompleted ? ctx.latestVideoActivity.video : null;
  const playVideo = (v) => () => ctx.handlePremiumClick(() => ctx.setPlayingVideo(v));
  if (video) {
    const pct = Math.round(ctx.getVideoWatchPercent(video) || 0);
    slides.push({ key: 'continue', kicker: 'كمّل المشاهدة', icon: 'play', glyph: '«', title: titleOf(video, 'محاضرة'), meta: `اتفرجت ${formatNumber(pct)}٪ من المحاضرة`, percent: pct, cta: 'كمّل', action: playVideo(video), image: thumbOf(video), secondary: { icon: 'focus', label: 'جلسة تركيز', action: () => ctx.setShowFocusMode(true) } });
  }
  if (ctx.inProgressExam) {
    slides.push({ key: 'resume', kicker: 'عندك امتحان مفتوح', icon: 'exam', glyph: 'م', title: ctx.inProgressExam.title || 'امتحان', meta: 'محاولتك محفوظة، كمّل من نفس السؤال', cta: 'كمّل الامتحان', action: () => ctx.startExamWithCode(ctx.inProgressExam) });
  } else if (buckets.open[0]) {
    const { exam, end } = buckets.open[0];
    slides.push({ key: 'open', kicker: end ? `بيقفل بعد ${formatDuration(end.getTime() - now)}` : 'امتحان متاح دلوقتي', icon: 'exam', glyph: 'م', title: exam.title || 'امتحان', meta: [exam.duration && `${formatNumber(exam.duration)} دقيقة`, buckets.open.length > 1 && `و${formatNumber(buckets.open.length - 1)} امتحان تاني متاح`].filter(Boolean).join(' · '), cta: 'ادخل الامتحان', action: () => go('exams:open') });
  }
  if (buckets.upcoming[0]) {
    const { exam, start } = buckets.upcoming[0];
    slides.push({ key: 'upcoming', kicker: `بيفتح بعد ${formatDuration(start.getTime() - now)}`, icon: 'calendar', glyph: 'ق', title: exam.title || 'امتحان جاي', meta: arabicDateTime(start), cta: 'شوف المواعيد', action: () => go('exams:upcoming') });
  }
  if (ctx.pendingAssignments?.[0]) {
    const a = ctx.pendingAssignments[0];
    slides.push({ key: 'hw', kicker: 'واجب مطلوب منك', icon: 'qr', glyph: 'و', title: a.title || 'واجب', meta: a.dueDate || a.deadline ? `آخر ميعاد ${arabicDate(a.dueDate || a.deadline)}` : 'سلّمه قبل آخر ميعاد', cta: 'افتح الواجب', action: () => go('exams:homework') });
  }
  if (!slides.length) {
    const first = [...(ctx.videos || [])].sort((a, b) => orderOf(a) - orderOf(b))[0];
    slides.push(first
      ? { key: 'start', kicker: 'ابدأ من هنا', icon: 'play', glyph: 'ا', title: titleOf(first, 'محاضرة'), meta: 'أول محاضرة في المنهج', cta: 'ابدأ المذاكرة', action: playVideo(first), image: thumbOf(first) }
      : { key: 'ready', kicker: 'المنصة جاهزة', icon: 'video', glyph: 'ن', title: 'أول ما المحاضرات تنزل هتلاقيها هنا', meta: getGradeLabel(ctx.userData?.grade), cta: 'شوف المحاضرات', action: () => go('learn') });
  }
  return slides.slice(0, 4);
}

export default function HomeView({ ctx, go, buckets }) {
  const now = useNow(30000);
  const streak = useMemo(() => studyStreak(ctx), [ctx.videoViews, ctx.examResults, ctx.assignmentSubmissions, ctx.hwResults]); // eslint-disable-line react-hooks/exhaustive-deps
  const series = useMemo(() => scoreSeries(ctx, 7), [ctx.examResults, ctx.exams]); // eslint-disable-line react-hooks/exhaustive-deps
  const ordered = useMemo(() => [...(ctx.videos || [])].sort((a, b) => orderOf(a) - orderOf(b)), [ctx.videos]);
  const watching = useMemo(() => ordered.filter((v) => { const p = ctx.getVideoWatchPercent(v) || 0; return p > 0 && p < 95; }), [ordered, ctx.videoViews]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = useMemo(() => ordered.filter((v) => (ctx.getVideoWatchPercent(v) || 0) < 95).slice(0, 5), [ordered, ctx.videoViews]); // eslint-disable-line react-hooks/exhaustive-deps
  const slides = useSlides(ctx, go, buckets, now);
  const todo = todoList(ctx, buckets);
  const completed = (ctx.completedExamResults || []).length;
  const daysLeft = ctx.subscriptionDaysLeft;
  const actTodo = (item) => {
    if (item.kind === 'exam') return item.exam === ctx.inProgressExam ? ctx.startExamWithCode(item.exam) : go('exams:open');
    if (item.kind === 'homework') return go('exams:homework');
    if (item.kind === 'mistakes') return go('progress:mistakes');
    return null;
  };
  const name = String(ctx.userData?.name || 'يا بطل').trim().split(/\s+/)[0];

  return (
    <div className="cx-home">
      <HeroCarousel slides={slides} hello={<><b>{greeting()}، {name}</b><span>{getGradeLabel(ctx.userData?.grade)}{ctx.isPremium ? ' · مشترك' : ''}</span></>} />

      <div className="cx-stats">
        <div className="cx-stat" style={{ animationDelay: '.1s' }}><span><Icon name="target" />متوسط درجاتك</span><b><CountUp value={Math.round(ctx.averageScore || 0)} suffix="٪" /></b><small>{completed ? `من ${formatNumber(completed)} امتحان` : 'لسه مفيش امتحانات'}</small></div>
        <div className="cx-stat" style={{ animationDelay: '.18s' }}><span><Icon name="video" />المحاضرات</span><b><CountUp value={ctx.videoCompletionPercent || 0} suffix="٪" /></b><small>خلصت {formatNumber(ctx.completedVideoCount || 0)} من {formatNumber(ordered.length)}</small></div>
        <div className="cx-stat" style={{ animationDelay: '.26s' }}><span><Icon name="fire" />أيام ورا بعض</span><b><CountUp value={streak.streak} /></b><small>ذاكرت {formatNumber(streak.activeThisWeek)} أيام الأسبوع ده</small></div>
        <button type="button" className="cx-stat" style={{ animationDelay: '.34s' }} onClick={() => go('progress:mistakes')}><span><Icon name="mistake" />بنك الأخطاء</span><b><CountUp value={(ctx.mistakes || []).length} /></b><small>سؤال محتاج مراجعة</small></button>
      </div>

      {watching.length > 0 && (
        <Rail title="كمّل المشاهدة" action="كل المحاضرات" onAction={() => go('learn:lectures')}>
          {watching.slice(0, 10).map((v, i) => <Poster key={v.id} item={v} ctx={ctx} index={i} />)}
        </Rail>
      )}

      {todo.length > 0 && (
        <Rail title="مطلوب منك" hint={`${formatNumber(todo.length)} حاجات`}>
          {todo.map((item, i) => <TaskPoster key={item.key} item={item} index={i} onOpen={() => actTodo(item)} />)}
        </Rail>
      )}

      {next.length > 0 && (
        <Rail title="رتّب مذاكرتك" hint="المحاضرات الجاية بالترتيب" action="المنهج كله" onAction={() => go('learn:lectures')}>
          {next.map((v, i) => <Poster key={v.id} item={v} ctx={ctx} index={i + 2} big number={ordered.indexOf(v) + 1} />)}
        </Rail>
      )}

      <div className="cx-duo">
        <section className="nx-card nx-sec">
          <SectionHead title="مستواك في آخر الامتحانات" icon="trend" action="التفاصيل" onAction={() => go('progress')} />
          <ScoreChart series={series} />
        </section>
        <div className="nx-stack">
          <StreakCard streak={streak} />
          {ctx.isPremium && Number.isFinite(daysLeft) && daysLeft <= 7 && (
            <button type="button" className="nx-card nx-card--tap nx-row" onClick={() => go('account:billing')}>
              <span className="nx-tile nx-tile--gold"><Icon name="crown" /></span>
              <span className="nx-row__main"><span className="nx-row__title">اشتراكك فاضله {formatNumber(Math.max(0, daysLeft))} {daysLeft === 1 ? 'يوم' : 'أيام'}</span><span className="nx-row__sub">جدّد عشان المحاضرات ما تقفلش</span></span>
              <Icon name="chevronLeft" />
            </button>
          )}
        </div>
      </div>

      {buckets.upcoming.length > 0 && (
        <section className="cx-row">
          <div className="cx-row__head"><h2>امتحانات جاية</h2><button type="button" onClick={() => go('exams:upcoming')}>الكل<Icon name="chevronLeft" /></button></div>
          <div className="cx-pad nx-grid nx-grid--exams">{buckets.upcoming.slice(0, 3).map((entry) => <ExamCard key={entry.exam.id} entry={entry} ctx={ctx} now={now} mode="upcoming" />)}</div>
        </section>
      )}

      {!ordered.length && <div className="cx-pad"><Empty icon="video" title="لسه مفيش محاضرات" text="أول ما المستر ينزّل محاضرات لصفّك هتظهر هنا." /></div>}
    </div>
  );
}
