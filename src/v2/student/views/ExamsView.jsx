import { lazy, useState } from 'react';
import { Icon } from '../../ui/Icon.jsx';
import { Button, Empty, formatNumber, useNow } from '../../ui/kit.jsx';
import { arabicDate, percentOf } from '../insights.js';
import { ExamCard, SectionHead } from '../parts.jsx';
import { Embed, StudentReviewQuiz } from '../embeds.jsx';

const StudentAssignmentsPanel = lazy(() => import('@features/students/assignments/StudentAssignmentsPanel.jsx'));

function BannedNote() {
  return <Empty icon="lock" title="الامتحانات مقفولة على حسابك" text="الإدارة وقفت دخول الامتحانات لحسابك. كلّم الدعم من صفحة حسابي لو محتاج تعرف السبب." />;
}

function Open({ ctx, buckets, now }) {
  const [showClosed, setShowClosed] = useState(false);
  return (
    <div className="nx-stack">
      {ctx.isBannedExam && <BannedNote />}
      {buckets.open.length
        ? <div className="nx-grid nx-grid--exams nx-stagger">{buckets.open.map((entry) => <ExamCard key={entry.exam.id} entry={entry} ctx={ctx} now={now} mode="open" />)}</div>
        : <Empty icon="exam" title="مفيش امتحانات مفتوحة دلوقتي" text={buckets.upcoming.length ? `فيه ${formatNumber(buckets.upcoming.length)} امتحان جاي. شوف مواعيدهم في «الجاية».` : 'أول امتحان يتنشر لصفّك هيظهر هنا على طول.'} />}
      {buckets.closed.length > 0 && (
        <section className="nx-sec">
          <button type="button" className="nx-sec__more" onClick={() => setShowClosed((v) => !v)} aria-expanded={showClosed} style={{ justifySelf: 'start' }}>
            {showClosed ? 'اخفي' : 'اعرض'} الامتحانات اللي فاتتك ({formatNumber(buckets.closed.length)})<Icon name={showClosed ? 'chevronDown' : 'chevronLeft'} />
          </button>
          {showClosed && <div className="nx-grid nx-grid--exams nx-stagger">{buckets.closed.map((entry) => <ExamCard key={entry.exam.id} entry={entry} ctx={ctx} now={now} mode="closed" />)}</div>}
        </section>
      )}
    </div>
  );
}

function Upcoming({ ctx, buckets, now }) {
  if (!buckets.upcoming.length) return <Empty icon="calendar" title="مفيش امتحانات متحددة" text="لما المستر يحدد ميعاد امتحان جديد هتلاقي عدّاد تنازلي هنا." />;
  return <div className="nx-grid nx-grid--exams nx-stagger">{buckets.upcoming.map((entry) => <ExamCard key={entry.exam.id} entry={entry} ctx={ctx} now={now} mode="upcoming" />)}</div>;
}

function Done({ ctx, buckets, now }) {
  if (!buckets.done.length) return <Empty icon="checkCircle" title="لسه ما خلصتش امتحانات" text="نتايجك ومراجعة إجاباتك هتظهر هنا بعد أول امتحان." />;
  const avg = Math.round(buckets.done.reduce((s, e) => s + percentOf(e.completed), 0) / buckets.done.length);
  return (
    <div className="nx-stack">
      <div className="nx-kpis">
        <div className="nx-kpi"><span className="nx-kpi__label"><Icon name="checkCircle" />امتحانات خلصتها</span><span className="nx-kpi__value">{formatNumber(buckets.done.length)}</span></div>
        <div className="nx-kpi"><span className="nx-kpi__label"><Icon name="target" />متوسطك فيها</span><span className="nx-kpi__value">{formatNumber(avg)}٪</span></div>
      </div>
      <div className="nx-grid nx-grid--exams nx-stagger">{buckets.done.map((entry) => <ExamCard key={entry.exam.id} entry={entry} ctx={ctx} now={now} mode="done" />)}</div>
    </div>
  );
}

function Homework({ ctx }) {
  const smart = ctx.hwResults || [];
  return (
    <div className="nx-stack">
      <section className="nx-card nx-row" style={{ borderStyle: 'dashed' }}>
        <span className="nx-tile nx-tile--patina"><Icon name="qr" /></span>
        <span className="nx-row__main">
          <span className="nx-row__title">واجب الكتاب بالكود</span>
          <span className="nx-row__sub" style={{ whiteSpace: 'normal' }}>صوّر كود الواجب اللي في الكتاب بكاميرا الموبايل، وهيفتح لك التصحيح الذكي هنا على طول.</span>
        </span>
      </section>
      <Embed>
        <StudentAssignmentsPanel assignments={ctx.assignments} submissions={ctx.assignmentSubmissions} user={ctx.user} userData={ctx.userData} />
      </Embed>
      {!(ctx.assignments || []).length && <Empty icon="qr" title="مفيش واجبات مطلوبة" text="الواجبات الجديدة هتظهر هنا مع آخر ميعاد للتسليم." />}
      {smart.length > 0 && (
        <section className="nx-card nx-sec">
          <SectionHead title="نتايج التصحيح الذكي" icon="spark" count={smart.length} />
          <div className="nx-list nx-stagger">
            {smart.map((hw) => {
              const pct = hw.total ? Math.round((Number(hw.score) / Number(hw.total)) * 100) : null;
              return (
                <div key={hw.id} className="nx-row" style={{ alignItems: 'flex-start' }}>
                  <span className={`nx-tile ${pct === null ? '' : pct >= 75 ? 'nx-tile--patina' : pct >= 50 ? 'nx-tile--gold' : 'nx-tile--danger'}`}>{pct === null ? <Icon name="qr" /> : <b style={{ fontSize: 12 }}>{formatNumber(pct)}٪</b>}</span>
                  <span className="nx-row__main">
                    <span className="nx-row__title">{hw.homeworkTitle || 'واجب'}{hw.bookName ? ` · ${hw.bookName}` : ''}</span>
                    <span className="nx-row__sub">{hw.score !== undefined ? `${formatNumber(hw.score)} من ${formatNumber(hw.total)}` : 'اتسلّم'} · {arabicDate(hw.submittedAt)}</span>
                    {hw.feedback && <p className="dim" style={{ fontSize: 'var(--nx-fs-s)', whiteSpace: 'pre-line', marginTop: 4 }}>{hw.feedback}</p>}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Quiz({ ctx }) {
  return (
    <div className="nx-stack">
      <section className="nx-card nx-row">
        <span className="nx-tile nx-tile--gold"><Icon name="mistake" /></span>
        <span className="nx-row__main">
          <span className="nx-row__title">امتحان من أخطائك</span>
          <span className="nx-row__sub">{(ctx.mistakes || []).length ? `${formatNumber(Math.min(20, ctx.mistakes.length))} سؤال من بنك أخطائك` : 'بنك الأخطاء فاضي لحد دلوقتي'}</span>
        </span>
        <Button variant="soft" size="s" disabled={!(ctx.mistakes || []).length || ctx.isBannedExam} onClick={ctx.startMistakesExam}>ابدأ</Button>
      </section>
      <Embed><StudentReviewQuiz userData={ctx.userData} /></Embed>
    </div>
  );
}

export default function ExamsView({ ctx, route, buckets }) {
  const now = useNow(1000);
  switch (route.sub) {
    case 'upcoming': return <Upcoming ctx={ctx} buckets={buckets} now={now} />;
    case 'done': return <Done ctx={ctx} buckets={buckets} now={now} />;
    case 'homework': return <Homework ctx={ctx} />;
    case 'quiz': return <Quiz ctx={ctx} />;
    default: return <Open ctx={ctx} buckets={buckets} now={now} />;
  }
}

