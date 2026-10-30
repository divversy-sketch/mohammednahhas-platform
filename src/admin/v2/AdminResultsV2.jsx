// صفحة نتائج الامتحانات (لوحة الأدمن).
// - اللي سلّم بيظهر «سلّم» ومقفول: مفيش «يكمّل» ولا «من الأول» على امتحان متسلّم.
// - ملخص لكل امتحان: سلّموا كام، المتوسط، أعلى وأقل درجة، نسبة النجاح، توزيع الدرجات، أضعف الفروع.
// - فلترة بالحالة، بحث، ترتيب، وتصدير Excel.
import { useMemo, useState } from 'react';
import { Icon } from '@v2/ui/Icon.jsx';
import { formatNumber } from '@v2/ui/kit.jsx';
import { getQuestionsForExam, generatePDF } from '@shared/core/platformShared.jsx';
import { downloadXlsx } from '@shared/utils/exportData.js';
import { liveState, useExamEvents, Timeline } from './AdminExamLive.jsx';
import { diagnoseAttempt, attemptStats, groupEvents, dur } from '@shared/exam/examDiagnosis.js';
import '@styles/pages/admin-results.css';

const toMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (v.toMillis) return v.toMillis();
  if (v.seconds) return v.seconds * 1000;
  const d = new Date(v).getTime();
  return Number.isFinite(d) ? d : 0;
};
const clock = (sec) => {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
};
const when = (ms) => (ms ? new Date(ms).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');
const pctOf = (r) => {
  if (Number.isFinite(Number(r?.percentage))) return Math.round(Number(r.percentage));
  const t = Number(r?.total) || 0;
  return t ? Math.round(((Number(r?.score) || 0) / t) * 100) : 0;
};

export const CHEAT_LABELS = {
  focus_or_visibility_lost: 'خرج من شاشة الامتحان',
  app_unpinned: 'فك تثبيت الشاشة',
  app_restarted: 'التطبيق اتقفل ورجع للامتحان',
  tab_switch: 'خرج لتبويب تاني (اتقفل فورًا)',
  app_switch: 'خرج لتطبيق تاني (اتقفل فورًا)',
  left_exam_and_closed_app: 'خرج من الامتحان وقفل التطبيق',
  screen_off: 'قفل شاشة الموبايل (مش غش)',
  right_click_attempt: 'ضغط كليك يمين',
  paste_attempt: 'حاول يلصق نص',
  copy_or_cut_attempt: 'حاول ينسخ',
  blocked_keyboard_shortcut: 'اختصار كيبورد ممنوع',
  fullscreen_exit: 'خرج من وضع ملء الشاشة',
  student_restart_after_security_warning: 'بدأ من الأول بعد تنبيه',
  admin_allowed_continue: 'الأدمن سمح يكمّل',
  admin_allowed_restart: 'الأدمن سمح يعيد',
};

const STATES = {
  submitted: { label: 'سلّم', icon: 'checkCircle', tone: 'ok' },
  live: { label: 'بيمتحن دلوقتي', icon: 'live', tone: 'live' },
  left: { label: 'خرج قبل التسليم', icon: 'logout', tone: 'warn' },
  held: { label: 'متوقف للأمان', icon: 'shield', tone: 'warn' },
  approved: { label: 'سمحت له يكمّل', icon: 'refresh', tone: 'info' },
  cheated: { label: 'مخالفة', icon: 'alert', tone: 'bad' },
};

const LEVELS = [
  { min: 85, label: 'ممتاز', tone: 'top' },
  { min: 75, label: 'جيد جدًا', tone: 'good' },
  { min: 65, label: 'جيد', tone: 'ok' },
  { min: 50, label: 'مقبول', tone: 'mid' },
  { min: 0, label: 'محتاج متابعة', tone: 'low' },
];
const levelOf = (p) => LEVELS.find((l) => p >= l.min);

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'submitted', label: 'سلّموا' },
  { key: 'decision', label: 'محتاج قرارك' },
  { key: 'live', label: 'بيمتحنوا دلوقتي' },
  { key: 'essay', label: 'مقالي محتاج تصحيح' },
];

function essayPending(r, exam) {
  if (!r.hasEssay || r.status !== 'completed') return false;
  const essays = getQuestionsForExam(exam).filter((q) => q.type === 'essay');
  if (!essays.length) return false;
  return essays.some((q) => r.essayScores?.[q.id] === undefined);
}

export default function AdminResultsV2({ ctx }) {
  const {
    examResults = [], examsList = [], activeUsersList = [], adminGradeFilter,
    setViewingResult, openAdminResultReview, sendWhatsAppToParent, handleDeleteResult,
    handleApproveSecurityContinue, handleApproveSecurityRestart, handleDeleteAllResults,
  } = ctx;

  const [examId, setExamId] = useState('');
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('score');
  const [limit, setLimit] = useState(60);
  const now = Date.now();

  const examsById = useMemo(() => new Map(examsList.map((e) => [e.id, e])), [examsList]);
  const usersById = useMemo(() => new Map(activeUsersList.map((u) => [u.id || u.uid, u])), [activeUsersList]);

  // امتحانات ليها نتائج، الأحدث فوق
  const examOptions = useMemo(() => {
    const stats = new Map();
    examResults.forEach((r) => {
      const s = stats.get(r.examId) || { n: 0, last: 0 };
      s.n += 1; s.last = Math.max(s.last, toMs(r.submittedAt), toMs(r.lastSavedAt));
      stats.set(r.examId, s);
    });
    return [...stats.entries()]
      .map(([id, s]) => ({ id, n: s.n, last: s.last, title: examsById.get(id)?.title || examResults.find((r) => r.examId === id)?.examTitle || 'امتحان محذوف' }))
      .sort((a, b) => b.last - a.last);
  }, [examResults, examsById]);

  const rows = useMemo(() => {
    const grade = adminGradeFilter && adminGradeFilter !== 'all' ? adminGradeFilter : '';
    return examResults
      .filter((r) => !examId || r.examId === examId)
      .map((r) => {
        const u = usersById.get(r.studentId) || {};
        const exam = examsById.get(r.examId);
        const state = liveState(r, now);
        const percentage = pctOf(r);
        return {
          r, u, exam, state, percentage,
          name: r.studentName || u.name || 'طالب',
          phone: u.phone || '',
          grade: u.grade || r.grade || exam?.grade || '',
          examTitle: exam?.title || r.examTitle || 'امتحان',
          submittedAt: toMs(r.submittedAt),
          lastAt: Math.max(toMs(r.submittedAt), toMs(r.lastSavedAt), toMs(r.lastSeenAt)),
          needsEssay: essayPending(r, exam),
        };
      })
      .filter((x) => !grade || !x.grade || x.grade === grade);
  }, [examResults, examId, usersById, examsById, adminGradeFilter, now]);

  const done = useMemo(() => rows.filter((x) => x.state === 'submitted'), [rows]);

  const summary = useMemo(() => {
    const ps = done.map((x) => x.percentage);
    const avg = ps.length ? Math.round(ps.reduce((a, b) => a + b, 0) / ps.length) : 0;
    const times = done.map((x) => Number(x.r.timeTaken) || 0).filter(Boolean);
    const buckets = LEVELS.map((l) => ({ ...l, n: 0 }));
    ps.forEach((p) => { buckets.find((b) => p >= b.min).n += 1; });
    // أضعف الفروع: مجموع اللي اتجاب ÷ مجموع الممكن في كل فرع
    const br = new Map();
    done.forEach((x) => Object.entries(x.r.branchStats || {}).forEach(([name, s]) => {
      const cur = br.get(name) || { earned: 0, possible: 0 };
      cur.earned += Number(s.earned ?? s.correct ?? 0) || 0;
      cur.possible += Number(s.possible ?? s.total ?? 0) || 0;
      br.set(name, cur);
    }));
    const branches = [...br.entries()].filter(([, s]) => s.possible > 0)
      .map(([name, s]) => ({ name, pct: Math.round((s.earned / s.possible) * 100) }))
      .sort((a, b) => a.pct - b.pct);
    return {
      submitted: done.length,
      avg,
      top: ps.length ? Math.max(...ps) : 0,
      low: ps.length ? Math.min(...ps) : 0,
      pass: ps.length ? Math.round((ps.filter((p) => p >= 50).length / ps.length) * 100) : 0,
      avgTime: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      decision: rows.filter((x) => ['left', 'held', 'cheated'].includes(x.state)).length,
      live: rows.filter((x) => x.state === 'live' || x.state === 'approved').length,
      essay: rows.filter((x) => x.needsEssay).length,
      buckets,
      branches,
    };
  }, [done, rows]);

  // الترتيب على الدرجة بين اللي سلّموا (نفس الامتحان)
  const rankOf = useMemo(() => {
    const m = new Map();
    if (!examId) return m;
    [...done].sort((a, b) => b.percentage - a.percentage || (Number(a.r.timeTaken) || 0) - (Number(b.r.timeTaken) || 0))
      .forEach((x, i) => m.set(x.r.id, i + 1));
    return m;
  }, [done, examId]);

  const shown = useMemo(() => {
    const term = q.trim();
    const list = rows.filter((x) => {
      if (filter === 'submitted' && x.state !== 'submitted') return false;
      if (filter === 'decision' && !['left', 'held', 'cheated'].includes(x.state)) return false;
      if (filter === 'live' && !['live', 'approved'].includes(x.state)) return false;
      if (filter === 'essay' && !x.needsEssay) return false;
      return !term || `${x.name} ${x.phone} ${x.examTitle}`.includes(term);
    });
    const order = { held: 0, cheated: 1, left: 2, live: 3, approved: 4, submitted: 5 };
    const sorters = {
      score: (a, b) => (a.state === 'submitted') - (b.state === 'submitted') || order[a.state] - order[b.state] || b.percentage - a.percentage,
      newest: (a, b) => b.lastAt - a.lastAt,
      name: (a, b) => a.name.localeCompare(b.name, 'ar'),
      fast: (a, b) => (Number(a.r.timeTaken) || 9e9) - (Number(b.r.timeTaken) || 9e9),
    };
    return list.sort(sorters[sort] || sorters.score);
  }, [rows, filter, q, sort]);

  const exportExcel = () => {
    const head = ['الترتيب', 'الطالب', 'الموبايل', 'الصف', 'الامتحان', 'الحالة', 'الدرجة', 'من', 'النسبة ٪', 'التقدير', 'الوقت (دقيقة)', 'وقت التسليم', 'تنبيهات الأمان', 'الشاشة'];
    const data = shown.map((x) => [
      rankOf.get(x.r.id) || '', x.name, x.phone, x.grade, x.examTitle, STATES[x.state]?.label || '',
      x.state === 'submitted' ? Number(x.r.score) || 0 : '', x.state === 'submitted' ? Number(x.r.total) || 0 : '',
      x.state === 'submitted' ? x.percentage : '', x.state === 'submitted' ? levelOf(x.percentage).label : '',
      x.r.timeTaken ? Math.round(Number(x.r.timeTaken) / 6) / 10 : '', x.submittedAt ? new Date(x.submittedAt).toLocaleString('ar-EG') : '',
      Number(x.r.antiCheatWarnings) || 0, x.r.examLock === 'pinned' ? 'مقفولة' : x.r.examLock === 'web' ? 'متصفح' : '',
    ]);
    const title = examId ? (examOptions.find((e) => e.id === examId)?.title || 'امتحان') : 'كل الامتحانات';
    downloadXlsx(`نتائج - ${title}`, [head, ...data]);
  };

  const pdf = (x) => {
    const questions = getQuestionsForExam(x.exam);
    generatePDF('admin', { ...x.r, total: x.r.total || 0, examTitle: x.exam?.title, questions, answers: x.r.answers });
  };

  return (
    <div className="ars" dir="rtl">
      <div className="ars-head">
        <label className="ars-pick">
          <Icon name="exam" />
          <select value={examId} onChange={(e) => { setExamId(e.target.value); setLimit(60); }} aria-label="اختار الامتحان">
            <option value="">كل الامتحانات ({formatNumber(examResults.length)} نتيجة)</option>
            {examOptions.map((e) => <option key={e.id} value={e.id}>{e.title} · {formatNumber(e.n)}</option>)}
          </select>
        </label>
        <label className="ars-search"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="اسم الطالب أو رقمه" /></label>
        <span className="ars-sp" />
        <label className="ars-sort">
          <span>ترتيب</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="score">الأعلى درجة</option>
            <option value="newest">الأحدث</option>
            <option value="fast">الأسرع في الحل</option>
            <option value="name">الاسم</option>
          </select>
        </label>
        <button type="button" className="ars-btn" onClick={exportExcel} disabled={!shown.length}><Icon name="download" />Excel</button>
      </div>

      <div className="ars-kpis">
        <div className="ars-kpi"><span><Icon name="checkCircle" />سلّموا</span><b>{formatNumber(summary.submitted)}</b></div>
        <div className="ars-kpi"><span><Icon name="chart" />متوسط الدرجات</span><b>{formatNumber(summary.avg)}<small>٪</small></b><i><em style={{ width: `${summary.avg}%` }} /></i></div>
        <div className="ars-kpi"><span><Icon name="trophy" />أعلى / أقل</span><b>{formatNumber(summary.top)}<small>٪</small> <span className="ars-dim">/ {formatNumber(summary.low)}٪</span></b></div>
        <div className="ars-kpi"><span><Icon name="target" />نسبة النجاح</span><b>{formatNumber(summary.pass)}<small>٪</small></b><i className="is-ok"><em style={{ width: `${summary.pass}%` }} /></i></div>
        <div className="ars-kpi"><span><Icon name="clock" />متوسط وقت الحل</span><b className="ars-mono">{summary.avgTime ? clock(summary.avgTime) : '—'}</b></div>
        <button type="button" className={`ars-kpi ars-kpi--act ${summary.decision ? 'is-warn' : ''}`} onClick={() => setFilter(filter === 'decision' ? 'all' : 'decision')}><span><Icon name="shield" />محتاج قرارك</span><b>{formatNumber(summary.decision)}</b></button>
      </div>

      {summary.submitted > 0 && (
        <div className="ars-insights">
          <section className="ars-card">
            <h4><Icon name="layers" />توزيع الدرجات</h4>
            <div className="ars-dist">
              {summary.buckets.map((b) => {
                const max = Math.max(1, ...summary.buckets.map((x) => x.n));
                return (
                  <div key={b.tone} className={`ars-dist__row lv-${b.tone}`}>
                    <span>{b.label}<small>{b.min ? `${formatNumber(b.min)}٪+` : 'أقل من ٥٠٪'}</small></span>
                    <i><em style={{ width: `${(b.n / max) * 100}%` }} /></i>
                    <b>{formatNumber(b.n)}</b>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="ars-card">
            <h4><Icon name="mistake" />أضعف الفروع</h4>
            {summary.branches.length === 0 && <p className="ars-dim">مفيش تفاصيل فروع للنتايج دي.</p>}
            <div className="ars-dist">
              {summary.branches.slice(0, 5).map((b) => (
                <div key={b.name} className={`ars-dist__row lv-${levelOf(b.pct).tone}`}>
                  <span>{b.name}</span>
                  <i><em style={{ width: `${b.pct}%` }} /></i>
                  <b>{formatNumber(b.pct)}٪</b>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <div className="ars-chips" role="tablist">
        {FILTERS.map((f) => {
          const n = f.key === 'all' ? rows.length : f.key === 'submitted' ? summary.submitted : f.key === 'decision' ? summary.decision : f.key === 'live' ? summary.live : summary.essay;
          return <button key={f.key} type="button" role="tab" aria-selected={filter === f.key} className={filter === f.key ? 'is-on' : ''} onClick={() => setFilter(f.key)}>{f.label}<b>{formatNumber(n)}</b></button>;
        })}
      </div>

      {shown.length === 0 && <p className="ars-empty">{examResults.length ? 'مفيش نتايج بالفلتر ده.' : 'لسه مفيش نتايج.'}</p>}

      {shown.length > 0 && (
        <div className="ars-list">
          <div className="ars-row ars-row--head"><span>#</span><span>الطالب</span><span>الحالة</span><span>الدرجة</span><span>الوقت</span><span>الأمان</span><span /></div>
          {shown.slice(0, limit).map((x) => {
            const st = STATES[x.state] || STATES.submitted;
            const lv = levelOf(x.percentage);
            const rank = rankOf.get(x.r.id);
            const decision = ['left', 'held', 'cheated'].includes(x.state);
            const warnings = Number(x.r.antiCheatWarnings) || 0;
            const lastEvent = (x.r.antiCheatLog || []).slice(-1)[0];
            return (
              <div key={x.r.id} className={`ars-row st-${st.tone}`}>
                <span className="ars-rank">{rank ? <b className={rank <= 3 ? `is-top${rank}` : ''}>{formatNumber(rank)}</b> : <small>—</small>}</span>
                <span className="ars-who">
                  <i>{String(x.name).trim().charAt(0)}</i>
                  <span><b>{x.name}</b><small>{examId ? (x.phone || x.grade || '') : x.examTitle}</small></span>
                </span>
                <span className="ars-st">
                  <em className="ars-badge"><Icon name={st.icon} />{st.label}</em>
                  {x.state === 'submitted' && <small className="ars-lockline"><Icon name="lock" />متسلّم ومقفول</small>}
                  {x.needsEssay && <small className="ars-essay">مقالي محتاج تصحيح</small>}
                </span>
                <span className="ars-score">
                  {x.state === 'submitted' ? (
                    <>
                      <span className="ars-score__top"><b>{formatNumber(x.r.score ?? 0)}</b><small>/ {formatNumber(x.r.total ?? 0)}</small><em className={`ars-lv lv-${lv.tone}`}>{formatNumber(x.percentage)}٪ · {lv.label}</em></span>
                      <i className={`lv-${lv.tone}`}><em style={{ width: `${x.percentage}%` }} /></i>
                    </>
                  ) : <small>{formatNumber(x.r.answeredCount ?? Object.keys(x.r.answers || {}).length)} إجابة لحد دلوقتي</small>}
                </span>
                <span className="ars-time">
                  {x.r.timeTaken ? <b className="ars-mono">{clock(x.r.timeTaken)}</b> : null}
                  <small>{when(x.submittedAt || x.lastAt)}</small>
                </span>
                <span className="ars-sec">
                  {warnings > 0 ? <em className="ars-warn" title={lastEvent ? CHEAT_LABELS[lastEvent.type] || lastEvent.type : ''}><Icon name="alert" />{formatNumber(warnings)} تنبيه</em> : <small className="ars-clean"><Icon name="shield" />نظيف</small>}
                  {x.r.examLock === 'pinned' && <small className="ars-pin"><Icon name="lock" />الشاشة مقفولة</small>}
                </span>
                <span className="ars-act">
                  {decision && handleApproveSecurityContinue && <button type="button" onClick={() => handleApproveSecurityContinue({ ...x.r, totalTime: x.r.totalTime || x.exam?.duration })}><Icon name="play" />يكمّل</button>}
                  {decision && handleApproveSecurityRestart && <button type="button" className="is-ghost" onClick={() => handleApproveSecurityRestart({ ...x.r, totalTime: x.r.totalTime || x.exam?.duration })}><Icon name="refresh" />من الأول</button>}
                  <button type="button" className={decision ? 'is-ghost' : ''} onClick={() => setViewingResult(x.r)}><Icon name={x.needsEssay ? 'edit' : 'fileText'} />{x.needsEssay ? 'صحّح' : 'الإجابات'}</button>
                  {x.state === 'submitted' && (
                    <details className="ars-more">
                      <summary aria-label="المزيد"><Icon name="menu" /></summary>
                      <div>
                        {openAdminResultReview && <button type="button" onClick={() => openAdminResultReview(x.r)}><Icon name="eye" />مراجعة زي الطالب</button>}
                        {sendWhatsAppToParent && <button type="button" onClick={() => sendWhatsAppToParent(x.r)}><Icon name="whatsapp" />ابعت لولي الأمر</button>}
                        {x.exam && <button type="button" onClick={() => pdf(x)}><Icon name="download" />تقرير PDF</button>}
                        {handleDeleteResult && <button type="button" className="is-danger" onClick={() => handleDeleteResult(x.r.id)}><Icon name="refresh" />يعيد الامتحان (يمسح النتيجة)</button>}
                      </div>
                    </details>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {shown.length > limit && <button type="button" className="ars-more-btn" onClick={() => setLimit(limit + 60)}>عرض {formatNumber(Math.min(60, shown.length - limit))} كمان</button>}

      <div className="ars-foot">
        <p className="ars-note"><Icon name="info" />اللي سلّم امتحانه مقفول: مينفعش يكمّله تاني. لو عايزه يمتحن من جديد اختار «يعيد الامتحان» من القائمة جنب اسمه.</p>
        {examResults.length > 0 && handleDeleteAllResults && <button type="button" className="ars-danger" onClick={handleDeleteAllResults}><Icon name="alert" />حذف كل النتائج</button>}
      </div>
    </div>
  );
}

/** راس صفحة تفاصيل نتيجة طالب: الملخص + سجل الأمان + قرار الأدمن (بس لو الامتحان مش متسلّم). */
export function ResultDetailHeader({ result, exam, onBack, onApproveContinue, onApproveRestart, onWhatsApp, onPdf }) {
  const done = result.status === 'completed';
  const p = pctOf(result);
  const lv = levelOf(p);
  const st = STATES[liveState(result)] || STATES.submitted;
  const log = result.antiCheatLog || [];
  const { batches } = useExamEvents({ attemptId: result.id });
  const events = useMemo(() => groupEvents(batches).get(result.id) || [], [batches, result.id]);
  const diag = diagnoseAttempt(result, events, { totalQuestions: getQuestionsForExam(exam).length });
  const tstats = attemptStats(result, events);
  const needsDecision = !done && ['security_hold', 'cheated', 'in_progress'].includes(result.status) && !['continue', 'restart'].includes(result.adminDecision);
  return (
    <div className="ars ars-detail" dir="rtl">
      <div className="ars-detail__bar">
        <button type="button" className="ars-btn is-ghost" onClick={onBack}><Icon name="arrowRight" />رجوع للنتايج</button>
        <span className="ars-sp" />
        {onWhatsApp && <button type="button" className="ars-btn is-ghost" onClick={onWhatsApp}><Icon name="whatsapp" />لولي الأمر</button>}
        {onPdf && <button type="button" className="ars-btn" onClick={onPdf}><Icon name="download" />التقرير</button>}
      </div>
      <div className={`ars-detail__hero st-${st.tone}`}>
        <div className="ars-who"><i>{String(result.studentName || 'ط').trim().charAt(0)}</i><span><b>{result.studentName || 'طالب'}</b><small>{exam?.title || result.examTitle || ''}</small></span></div>
        <em className="ars-badge"><Icon name={st.icon} />{st.label}</em>
        {done && (
          <div className="ars-detail__nums">
            <div><small>الدرجة</small><b>{formatNumber(result.score ?? 0)}<span>/ {formatNumber(result.total ?? 0)}</span></b></div>
            <div><small>النسبة</small><b className={`lv-${lv.tone}`}>{formatNumber(p)}٪</b><span className={`ars-lv lv-${lv.tone}`}>{lv.label}</span></div>
            <div><small>وقت الحل</small><b className="ars-mono">{result.timeTaken ? clock(result.timeTaken) : '—'}</b></div>
            <div><small>اتسلّم</small><b className="ars-small">{when(toMs(result.submittedAt))}</b></div>
          </div>
        )}
      </div>
      {done && <p className="ars-locked"><Icon name="lock" />الامتحان ده متسلّم ومقفول. الطالب مش هيقدر يكمّله أو يعدّل إجاباته.</p>}
      {needsDecision && (
        <div className="ars-decide">
          <p><Icon name="shield" /><b>المحاولة دي محتاجة قرارك</b> — الطالب ما سلّمش.</p>
          <div>
            {onApproveContinue && <button type="button" className="ars-btn" onClick={onApproveContinue}><Icon name="play" />يكمّل بنفس إجاباته ووقته</button>}
            {onApproveRestart && <button type="button" className="ars-btn is-ghost" onClick={onApproveRestart}><Icon name="refresh" />يبدأ من الأول</button>}
          </div>
        </div>
      )}
      <details className="ars-card ars-track" open={!done}>
        <summary><Icon name="route" />تتبع الامتحان<small>{diag.title}</small></summary>
        <div className={`ars-track__diag st-${diag.tone === 'live' ? 'live' : diag.tone}`}><Icon name={diag.icon} /><span><b>{diag.title}</b><small>{diag.detail}</small></span></div>
        <div className="ars-track__nums">
          <span>وقت جوه الامتحان <b>{tstats.activeSecs ? dur(tstats.activeSecs) : '—'}</b></span>
          <span>غيّر إجابات <b>{formatNumber(tstats.changes)}</b></span>
          <span>أطول سؤال <b>{tstats.longestQ ? `س${formatNumber(tstats.longestQ.i)} · ${dur(tstats.longestQ.secs)}` : '—'}</b></span>
          <span>النت فصل <b>{tstats.offlineCount ? `${formatNumber(tstats.offlineCount)} مرة` : 'ولا مرة'}</b></span>
          <span>ساب الشاشة <b>{tstats.hideCount ? `${formatNumber(tstats.hideCount)} مرة` : 'ولا مرة'}</b></span>
          {result.device?.app && <span>الجهاز <b>{result.device.app === 'app' ? 'التطبيق' : 'متصفح'}{result.device.model ? ` · ${result.device.model}` : ''}</b></span>}
        </div>
        <Timeline events={events} startAt={events[0]?.at || 0} />
      </details>
      {log.length > 0 && (
        <details className="ars-card ars-log">
          <summary><Icon name="shield" />سجل الأمان ({formatNumber(log.length)})</summary>
          <ol>
            {log.map((e, i) => <li key={i}><span>{CHEAT_LABELS[e.type] || e.type}</span><small>{e.at ? new Date(e.at).toLocaleString('ar-EG', { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : ''}</small></li>)}
          </ol>
        </details>
      )}
    </div>
  );
}
