import { useMemo, useState } from 'react';
import { Icon } from '../../ui/Icon.jsx';
import { Button, Chip, CountUp, Empty, Ring, formatNumber } from '../../ui/kit.jsx';
import { arabicDate, completedResults, normalizeArabic, percentOf, scoreSeries, toDate } from '../insights.js';
import { ScoreChart, SectionHead } from '../parts.jsx';
import { Embed, LeaderboardV2, StudentCertificatePanel, StudentGrowthPanel, StudentLearningPath, StudentRemediationCenter } from '../embeds.jsx';

const toneOf = (pct) => (pct >= 75 ? 'patina' : pct >= 50 ? 'gold' : 'danger');
const levelOf = (pct) => (pct >= 85 ? 'ممتاز' : pct >= 70 ? 'جيد جدًا' : pct >= 50 ? 'جيد' : 'محتاج مراجعة');

function Overview({ ctx, go }) {
  const series = useMemo(() => scoreSeries(ctx, 10), [ctx.examResults, ctx.exams]); // eslint-disable-line react-hooks/exhaustive-deps
  const results = useMemo(() => completedResults(ctx.examResults)
    .sort((a, b) => (toDate(b.submittedAt)?.getTime() || 0) - (toDate(a.submittedAt)?.getTime() || 0)), [ctx.examResults]);
  const avg = Math.round(ctx.averageScore || 0);
  const best = results.reduce((m, r) => Math.max(m, percentOf(r)), 0);
  const trend = series.length >= 2 ? series[series.length - 1].pct - series[series.length - 2].pct : null;
  const weak = ctx.weakBranches || [];
  return (
    <div className="nx-stack">
      <div className="nx-split">
        <section className="nx-card nx-progress-hero">
          <Ring value={avg} size={168} stroke={14} tone={toneOf(avg)}>
            <b style={{ fontSize: 'var(--nx-fs-3xl)', fontWeight: 700 }}><CountUp value={avg} suffix="٪" /></b>
            <span className="muted" style={{ fontSize: 'var(--nx-fs-xs)' }}>متوسطك</span>
          </Ring>
          <div className="nx-stack" style={{ gap: 8 }}>
            <Chip tone={toneOf(avg)}>{results.length ? levelOf(avg) : 'لسه بدري'}</Chip>
            <h2 style={{ fontSize: 'var(--nx-fs-xl)', fontWeight: 600 }}>{results.length ? `خلصت ${formatNumber(results.length)} امتحان` : 'ابدأ أول امتحان'}</h2>
            {trend !== null && (
              <p className="dim" style={{ fontSize: 'var(--nx-fs-s)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="trend" style={{ transform: trend < 0 ? 'scaleY(-1)' : undefined, color: trend >= 0 ? 'var(--nx-patina)' : 'var(--nx-danger)' }} />
                {trend === 0 ? 'نفس مستوى الامتحان اللي فات' : trend > 0 ? `أحسن من اللي فات بـ ${formatNumber(trend)}٪` : `أقل من اللي فات بـ ${formatNumber(Math.abs(trend))}٪`}
              </p>
            )}
            {best > 0 && <p className="muted" style={{ fontSize: 'var(--nx-fs-s)' }}>أعلى درجة جبتها: {formatNumber(best)}٪</p>}
          </div>
        </section>
        <section className="nx-card nx-sec">
          <SectionHead title="محتاج تركز على" icon="target" />
          {weak.length ? (
            <div className="nx-choice">{weak.slice(0, 10).map((w, i) => <Chip key={`${w?.name || w}-${i}`} tone="gold">{String(w?.name || w?.branch || w)}</Chip>)}</div>
          ) : <p className="muted" style={{ fontSize: 'var(--nx-fs-s)' }}>مفيش نقط ضعف واضحة لحد دلوقتي.</p>}
          <div className="nx-continue__actions">
            <Button variant="soft" icon="mistake" onClick={() => go('progress:mistakes')}>بنك الأخطاء ({formatNumber((ctx.mistakes || []).length)})</Button>
            <Button variant="ghost" icon="route" onClick={() => go('progress:path')}>مسار التعلم</Button>
          </div>
        </section>
      </div>
      <section className="nx-card nx-sec">
        <SectionHead title="مستواك امتحان ورا امتحان" icon="trend" />
        <ScoreChart series={series} />
      </section>
      {results.length > 0 && (
        <section className="nx-card nx-sec">
          <SectionHead title="كل نتايجك" icon="checkCircle" count={results.length} />
          <div className="nx-list nx-stagger">
            {results.map((r) => {
              const pct = percentOf(r);
              const exam = (ctx.exams || []).find((e) => e.id === r.examId);
              return (
                <button key={r.id} type="button" className="nx-row" onClick={() => (exam ? go('exams:done') : null)}>
                  <span className={`nx-tile nx-tile--${toneOf(pct)}`}><b style={{ fontSize: 12 }}>{formatNumber(pct)}٪</b></span>
                  <span className="nx-row__main">
                    <span className="nx-row__title">{r.examTitle || exam?.title || 'امتحان'}</span>
                    <span className="nx-row__sub">{r.score !== undefined ? `${formatNumber(r.score)}${r.total ? ` من ${formatNumber(r.total)}` : ''} · ` : ''}{arabicDate(r.submittedAt)}</span>
                  </span>
                  <Icon name="chevronLeft" />
                </button>
              );
            })}
          </div>
        </section>
      )}
      <Embed>
        <StudentGrowthPanel user={ctx.user} userData={ctx.userData} exams={ctx.exams} examResults={ctx.examResults} assignments={ctx.assignments}
          assignmentSubmissions={ctx.assignmentSubmissions} hwResults={ctx.hwResults} mistakes={ctx.mistakes} videoViews={ctx.videoViews} content={ctx.content}
          onStartMistakesExam={ctx.startMistakesExam} />
      </Embed>
    </div>
  );
}

function Mistakes({ ctx, go }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const list = ctx.mistakes || [];
  const needle = normalizeArabic(q);
  const shown = list.filter((m) => !needle || normalizeArabic(`${m.question?.text || ''} ${m.examTitle || ''}`).includes(needle));
  const byExam = list.reduce((acc, m) => { const k = m.examTitle || 'امتحان'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  return (
    <div className="nx-stack">
      <section className="nx-card nx-night nx-continue">
        <span className="nx-night__glow" aria-hidden="true" />
        <Chip tone="night" icon="mistake">بنك الأخطاء</Chip>
        <div className="nx-continue__title">{list.length ? `${formatNumber(list.length)} سؤال غلطت فيهم قبل كده` : 'مفيش أخطاء متسجلة. برافو!'}</div>
        <p className="dim" style={{ fontSize: 'var(--nx-fs-s)' }}>كل سؤال بتغلط فيه في الامتحانات بيتحفظ هنا عشان تراجعه. الامتحان السريع بيجيب لك لحد ٢٠ سؤال منهم بترتيب عشوائي.</p>
        <div className="nx-continue__actions">
          <Button variant="pri" icon="play" onClick={ctx.startMistakesExam} disabled={!list.length || ctx.isBannedExam} haptics="medium">امتحن نفسك فيهم</Button>
        </div>
      </section>
      {Object.keys(byExam).length > 1 && (
        <div className="nx-choice" aria-label="الأخطاء حسب الامتحان">
          {Object.entries(byExam).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([title, n]) => (
            <button key={title} type="button" aria-pressed={q === title} onClick={() => setQ(q === title ? '' : title)}>{title} <b>{formatNumber(n)}</b></button>
          ))}
        </div>
      )}
      {list.length > 0 && (
        <section className="nx-card nx-sec">
          <label className="nx-input"><Icon name="search" /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر في أخطائك" aria-label="دوّر في أخطائك" /></label>
          <div className="nx-list">
            {shown.slice(0, 80).map((m) => {
              const isOpen = open === m.id;
              return (
                <div key={m.id} className="nx-mistake">
                  <button type="button" className="nx-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : m.id)}>
                    <span className="nx-tile nx-tile--danger"><Icon name="mistake" /></span>
                    <span className="nx-row__main">
                      <span className="nx-row__title" style={{ whiteSpace: isOpen ? 'normal' : undefined }}>{m.question?.text || 'سؤال'}</span>
                      <span className="nx-row__sub">{m.examTitle || 'امتحان'}{m.timestamp ? ` · ${arabicDate(m.timestamp)}` : ''}</span>
                    </span>
                    <Icon name={isOpen ? 'chevronDown' : 'chevronLeft'} />
                  </button>
                  {isOpen && (
                    <div className="nx-mistake__body">
                      {m.question?.studentAnswerText && <p><Chip tone="danger" icon="close">إجابتك</Chip> {m.question.studentAnswerText}</p>}
                      {m.question?.correctAnswerText && <p><Chip tone="patina" icon="check">الصح</Chip> {m.question.correctAnswerText}</p>}
                      {m.question?.explanation && <p className="dim">{m.question.explanation}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {shown.length > 80 && <p className="muted" style={{ fontSize: 'var(--nx-fs-s)' }}>بيظهر أول ٨٠ سؤال. استخدم البحث عشان توصل لسؤال معين.</p>}
        </section>
      )}
      <Embed>
        <StudentRemediationCenter user={ctx.user} exams={ctx.exams} examResults={ctx.examResults} mistakes={ctx.mistakes} content={ctx.content}
          onStartMistakesExam={ctx.startMistakesExam} setActiveTab={go} />
      </Embed>
    </div>
  );
}

export default function ProgressView({ ctx, route, go }) {
  switch (route.sub) {
    case 'mistakes': return <Mistakes ctx={ctx} go={go} />;
    case 'path':
      return (
        <Embed>
          <StudentLearningPath videos={ctx.videos} exams={ctx.exams} examResults={ctx.examResults} assignments={ctx.assignments}
            assignmentSubmissions={ctx.assignmentSubmissions} videoViews={ctx.videoViews} mistakes={ctx.mistakes} setActiveTab={go} />
        </Embed>
      );
    case 'leaderboard': return <Embed><LeaderboardV2 ctx={ctx} /></Embed>;
    case 'certificates':
      return (
        <div className="nx-stack">
          <Embed><StudentCertificatePanel user={ctx.user} userData={ctx.userData} examResults={ctx.examResults} /></Embed>
          {!completedResults(ctx.examResults).length && <Empty icon="medal" title="شهادتك مستنياك" text="الشهادة بتتفتح بعد أول امتحان تخلصه بمتوسط ٦٠٪ أو أكتر." action={<Button variant="soft" onClick={() => go('exams:open')}>شوف الامتحانات</Button>} />}
        </div>
      );
    default: return <Overview ctx={ctx} go={go} />;
  }
}
