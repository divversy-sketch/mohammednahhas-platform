// «مراقبة الامتحانات لايف»: كل طالب لحظة بلحظة + ليه اللي خرج خرج.
// - أرقام لايف: بيمتحنوا، النت فاصل، خرجوا، سلّموا، محتاجين قرارك، لسه ما دخلوش.
// - «ليه الطلبة بيخرجوا؟»: تجميع أسباب الخروج (النت، قفل التطبيق، الإشارة اتقطعت، التسليم فشل…) + مسار الامتحان.
// - لكل طالب: الحالة والسبب، السؤال اللي واقف عنده والوقت عليه، التقدم، الوقت الباقي، النت، البطارية، الجهاز.
// - النشاط اللحظي: آخر الأحداث من كل الطلبة.
// - تفاصيل الطالب: التشخيص، أرقام، الوقت على كل سؤال، والخط الزمني الكامل من أول ما فتح لحد ما خرج.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@services/firebase';
import { Icon } from '@v2/ui/Icon.jsx';
import { formatNumber } from '@v2/ui/kit.jsx';
import { getQuestionsForExam } from '@shared/core/platformShared.jsx';
import { diagnoseAttempt, attemptStats, groupEvents, eventText, EVENT_VIEW, DIAG_GROUPS, dur, ago, toMs } from '@shared/exam/examDiagnosis.js';
import '@styles/pages/admin-live.css';

const clock = (sec) => { const s = Math.max(0, Math.round(sec || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export const LIVE_STATES = {
  live: { label: 'بيمتحن دلوقتي', icon: 'live', tone: 'live' },
  left: { label: 'خرج من الامتحان', icon: 'logout', tone: 'warn' },
  held: { label: 'متوقف للأمان', icon: 'shield', tone: 'warn' },
  approved: { label: 'وافقت يكمّل', icon: 'refresh', tone: 'info' },
  submitted: { label: 'سلّم', icon: 'checkCircle', tone: 'ok' },
  cheated: { label: 'مخالفة', icon: 'alert', tone: 'bad' },
  absent: { label: 'لسه ما دخلش', icon: 'clock', tone: 'mute' },
};

/** Where an attempt stands right now. */
export function liveState(r, now = Date.now()) {
  if (!r) return 'absent';
  if (r.status === 'completed') return 'submitted';
  if (r.status === 'cheated') return 'cheated';
  if (r.status === 'security_hold') return 'held';
  if (['continue', 'restart'].includes(r.adminDecision)) return 'approved';
  const beat = toMs(r.lastSeenAt);
  const last = Math.max(beat, toMs(r.lastSavedAt), toMs(r.submittedAt), r.lastEvent?.at || 0);
  const limitMs = beat ? 75e3 : 180e3; // with the 30s heartbeat, 75s of silence means the student is gone
  if (r.presence === 'away' || r.appState === 'background' || now - last > limitMs) return 'left';
  return 'live';
}

function examWindowOpen(e, now) {
  const s = toMs(e.startTime); const en = toMs(e.endTime);
  return s && en && s <= now && en >= now;
}

/** دفعات أحداث امتحان (أو محاولة واحدة) لايف */
export function useExamEvents({ examId, attemptId }) {
  const [batches, setBatches] = useState([]);
  const [state, setState] = useState('idle');
  useEffect(() => {
    if (!examId && !attemptId) { setBatches([]); return undefined; }
    if (import.meta.env.DEV && typeof window !== 'undefined' && window.__nxDemoEvents) { // معاينة التطوير بس
      setBatches(window.__nxDemoEvents.filter((b) => (attemptId ? b.attemptId === attemptId : b.examId === examId))); setState('ok'); return undefined;
    }
    setState('loading');
    const q = attemptId
      ? query(collection(db, 'exam_events'), where('attemptId', '==', attemptId), limit(500))
      : query(collection(db, 'exam_events'), where('examId', '==', examId), limit(3000));
    return onSnapshot(q, (snap) => { setBatches(snap.docs.map((d) => d.data())); setState('ok'); }, () => setState('error'));
  }, [examId, attemptId]);
  return { batches, state };
}

function beep(kind = 'warn') {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
    const ctx = new Ctx(); const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = kind === 'bad' ? 520 : 760; o.type = 'triangle';
    g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.42); setTimeout(() => ctx.close?.(), 700);
  } catch { /* ignore */ }
}

const IMPORTANT = new Set(['open', 'resume', 'hide', 'offline', 'online', 'unpin', 'warn', 'hold', 'cheated', 'battery_low', 'error', 'submit_try', 'submit_ok', 'submit_fail', 'close', 'time_up', 'upload_fail']);
const ALERT = new Set(['offline', 'hide', 'unpin', 'hold', 'cheated', 'submit_fail', 'close', 'error']);

function Signals({ r }) {
  if (!r) return null;
  const d = r.device || {};
  const bat = r.battery;
  return (
    <span className="elv-sig">
      {r.network === 'offline' ? <i className="is-bad" title="النت فاصل"><Icon name="wifiOff" /></i> : r.network ? <i className="is-ok" title="النت شغال"><Icon name="live" /></i> : null}
      {d.app && <i title={d.app === 'app' ? `تطبيق ${d.model || ''}` : `متصفح ${d.model || ''}`}><Icon name={d.app === 'app' ? 'phone' : 'external'} /></i>}
      {r.examLock === 'pinned' && <i className="is-ok" title="الشاشة متثبتة"><Icon name="lock" /></i>}
      {bat && <b className={bat.level <= 15 && !bat.charging ? 'is-bad' : ''} title={bat.charging ? 'بيشحن' : 'البطارية'}>{bat.charging ? '⚡' : ''}{formatNumber(bat.level)}٪</b>}
    </span>
  );
}

function Timeline({ events, startAt }) {
  const [all, setAll] = useState(false);
  const list = all ? events : events.filter((e) => IMPORTANT.has(e.t) || e.t === 'ans' || e.t === 'q');
  if (!events.length) return <p className="elv-empty">مفيش أحداث متسجلة للمحاولة دي (الطالب كان على نسخة قديمة، أو قواعد Firebase لسه ما اتحدثتش).</p>;
  return (
    <div className="elv-tl">
      <label className="elv-tl__all"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />كل الأحداث ({formatNumber(events.length)})</label>
      <ol>
        {list.map((e, i) => {
          const v = EVENT_VIEW[e.t] || { icon: 'info', tone: 'mute' };
          return (
            <li key={`${e.at}-${i}`} className={`tone-${v.tone}`}>
              <i><Icon name={v.icon} /></i>
              <span>{eventText(e)}</span>
              <small title={new Date(e.at).toLocaleString('ar-EG')}>{new Date(e.at).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}{startAt ? ` · +${dur((e.at - startAt) / 1000)}` : ''}</small>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StudentDrawer({ x, exam, events, onClose, actions }) {
  const questions = useMemo(() => getQuestionsForExam(exam), [exam]);
  if (!x) return null;
  const r = x.r || {};
  const st = attemptStats(r, events);
  const qt = r.questionTimes || {};
  const maxT = Math.max(1, ...Object.values(qt));
  const startAt = events[0]?.at || 0;
  return createPortal(
    <div className="elv-drawer nx-bridge" role="dialog" aria-modal="true" aria-label={`تتبع ${x.name}`}>
      <button type="button" className="elv-drawer__scrim" onClick={onClose} aria-label="إغلاق" />
      <aside className="elv-drawer__panel" dir="rtl">
        <header>
          <span className="elv-who"><i>{String(x.name).trim().charAt(0)}</i><span><b>{x.name}</b><small>{x.phone || x.grade || ''}{r.device?.model ? ` · ${r.device.model}` : ''}{r.device?.app ? ` · ${r.device.app === 'app' ? 'التطبيق' : 'متصفح'}` : ''}</small></span></span>
          <button type="button" className="elv-x" onClick={onClose} aria-label="إغلاق"><Icon name="close" /></button>
        </header>
        <div className={`elv-diag tone-${x.diag.tone}`}>
          <i><Icon name={x.diag.icon} /></i>
          <span><b>{x.diag.title}</b><small>{x.diag.detail}</small></span>
        </div>
        {actions}
        <div className="elv-stats">
          <div><small>التقدم</small><b>{formatNumber(x.answered)}<span>/ {formatNumber(x.total)}</span></b></div>
          <div><small>وقت جوه الامتحان</small><b className="sm">{st.activeSecs ? dur(st.activeSecs) : '—'}</b></div>
          <div><small>غيّر إجابات</small><b>{formatNumber(st.changes)}</b></div>
          <div><small>أطول سؤال</small><b className="sm">{st.longestQ ? `س${formatNumber(st.longestQ.i)} · ${dur(st.longestQ.secs)}` : '—'}</b></div>
          <div><small>النت فصل</small><b className="sm">{st.offlineCount ? `${formatNumber(st.offlineCount)} مرة · ${dur(st.offlineSecs)}` : 'ولا مرة'}</b></div>
          <div><small>ساب الشاشة</small><b className="sm">{st.hideCount ? `${formatNumber(st.hideCount)} مرة · ${dur(st.hideSecs)}` : 'ولا مرة'}</b></div>
        </div>
        {questions.length > 0 && (
          <section className="elv-qmap">
            <h4>الأسئلة <small>اللون = جاوب ولا لأ · الطول = الوقت عليه</small></h4>
            <div>
              {questions.map((q, i) => {
                const a = r.answers?.[q.id];
                const done = a !== undefined && a !== null && a !== '';
                const t = qt[String(i + 1)] || 0;
                const cur = (Number(r.currentQIndex) || 0) === i && x.state !== 'submitted';
                const right = done && q.type !== 'essay' && a === q.correctIdx;
                return (
                  <span key={q.id || i} className={`${done ? (x.state === 'submitted' && q.type !== 'essay' ? (right ? 'is-right' : 'is-wrong') : 'is-done') : ''} ${cur ? 'is-cur' : ''}`} title={`سؤال ${i + 1}${t ? ` · ${dur(t)}` : ''}${done ? ' · متجاوب' : ' · من غير إجابة'}`}>
                    <em style={{ height: `${Math.max(8, (t / maxT) * 100)}%` }} />
                    <b>{formatNumber(i + 1)}</b>
                  </span>
                );
              })}
            </div>
          </section>
        )}
        <section>
          <h4 className="elv-h4">الخط الزمني للامتحان</h4>
          <Timeline events={events} startAt={startAt} />
        </section>
      </aside>
    </div>,
    document.body,
  );
}

export default function AdminExamLive({ ctx }) {
  const { examsList = [], examResults = [], activeUsersList = [], handleApproveSecurityContinue, handleApproveSecurityRestart, openAdminResultReview, adminGradeFilter } = ctx;
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(id); }, []);

  const openExams = useMemo(() => examsList.filter((e) => examWindowOpen(e, now)), [examsList, now]);
  const recent = useMemo(() => {
    const ids = new Set(examResults.filter((r) => now - Math.max(toMs(r.lastSeenAt), toMs(r.lastSavedAt), toMs(r.submittedAt)) < 48 * 3600e3).map((r) => r.examId));
    return examsList.filter((e) => ids.has(e.id) && !examWindowOpen(e, now));
  }, [examsList, examResults, now]);
  const [examId, setExamId] = useState('');
  const chosen = examId || openExams[0]?.id || recent[0]?.id || examsList[0]?.id || '';
  const exam = examsList.find((e) => e.id === chosen);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [sound, setSound] = useState(() => { try { return localStorage.getItem('nx-live-sound') === '1'; } catch { return false; } });
  const [feedAll, setFeedAll] = useState(false);
  const [openId, setOpenId] = useState(null);
  const { batches, state: evState } = useExamEvents({ examId: chosen });
  const eventsBy = useMemo(() => groupEvents(batches), [batches]);
  const totalQ = useMemo(() => (exam?.questions || []).reduce((n, b) => n + (b.subQuestions || []).length, 0), [exam]);

  const rows = useMemo(() => {
    if (!exam) return [];
    const usersById = new Map(activeUsersList.map((u) => [u.id || u.uid, u]));
    const latest = new Map();
    examResults.filter((r) => r.examId === exam.id).forEach((r) => {
      const key = r.studentId || r.id;
      const prev = latest.get(key);
      const rank = (x) => (x.status === 'completed' ? 3 : 1) * 1e13 + Math.max(toMs(x.lastSeenAt), toMs(x.lastSavedAt), toMs(x.submittedAt));
      if (!prev || rank(r) > rank(prev)) latest.set(key, r);
    });
    const list = [...latest.values()].map((r) => {
      const u = usersById.get(r.studentId) || {};
      const state = liveState(r, now);
      const events = eventsBy.get(r.id) || [];
      const total = r.totalQuestions || totalQ;
      const answered = r.answeredCount ?? Object.values(r.answers || {}).filter((v) => v !== undefined && v !== null && v !== '').length;
      const beat = Math.max(toMs(r.lastSeenAt), toMs(r.lastSavedAt), r.lastEvent?.at || 0);
      const remaining = state === 'live' && r.remainingTime != null ? r.remainingTime - (now - Math.max(toMs(r.lastSeenAt), toMs(r.lastSavedAt))) / 1000 : r.remainingTime;
      const diag = diagnoseAttempt(r, events, { now, totalQuestions: totalQ });
      return { r, u, state, diag, events, name: r.studentName || u.name || 'طالب', phone: u.phone || '', grade: u.grade || r.grade || '', total, answered, beat, remaining };
    });
    const started = new Set(list.map((x) => x.r.studentId));
    const grade = exam.grade && exam.grade !== 'all' ? exam.grade : (adminGradeFilter && adminGradeFilter !== 'all' ? adminGradeFilter : '');
    if (examWindowOpen(exam, now)) {
      activeUsersList.filter((u) => (!grade || u.grade === grade) && !started.has(u.id || u.uid) && (u.role || 'student') === 'student')
        .forEach((u) => list.push({ r: null, u, state: 'absent', diag: { code: 'absent', tone: 'mute', icon: 'clock', title: 'لسه ما دخلش', detail: '' }, events: [], name: u.name || 'طالب', phone: u.phone || '', grade: u.grade || '', total: totalQ, answered: 0, beat: 0, remaining: null }));
    }
    const order = { held: 0, cheated: 1, left: 2, live: 3, approved: 4, submitted: 5, absent: 6 };
    return list.sort((a, b) => order[a.state] - order[b.state] || b.beat - a.beat);
  }, [exam, examResults, activeUsersList, now, adminGradeFilter, eventsBy, totalQ]);

  const k = useMemo(() => {
    const c = { live: 0, offline: 0, left: 0, submitted: 0, absent: 0, decision: 0 };
    let prog = 0; let progN = 0;
    rows.forEach((x) => {
      if (x.state === 'live' || x.state === 'approved') { c.live += 1; if (x.diag.code === 'live_offline') c.offline += 1; }
      if (x.state === 'left') c.left += 1;
      if (x.state === 'submitted') c.submitted += 1;
      if (x.state === 'absent') c.absent += 1;
      if (x.state === 'held' || x.state === 'cheated') c.decision += 1;
      if (x.r && x.total) { prog += x.answered / x.total; progN += 1; }
    });
    c.progress = progN ? Math.round((prog / progN) * 100) : 0;
    return c;
  }, [rows]);

  // ليه بيخرجوا؟ + مسار الامتحان
  const reasons = useMemo(() => {
    const m = new Map();
    rows.filter((x) => x.r && !['submitted', 'live', 'approved'].includes(x.state)).forEach((x) => m.set(x.diag.code, (m.get(x.diag.code) || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);
  const funnel = useMemo(() => {
    const opened = rows.filter((x) => x.r).length;
    const half = rows.filter((x) => x.r && x.total && x.answered >= x.total / 2).length;
    const all = rows.filter((x) => x.r && x.total && x.answered >= x.total).length;
    return [
      { label: 'الطلبة المستهدفين', n: rows.length },
      { label: 'فتحوا الامتحان', n: opened },
      { label: 'جاوبوا نص الأسئلة', n: half },
      { label: 'جاوبوا كل الأسئلة', n: all },
      { label: 'سلّموا', n: k.submitted },
    ];
  }, [rows, k.submitted]);

  // النشاط اللحظي
  const nameOf = useMemo(() => new Map(rows.filter((x) => x.r).map((x) => [x.r.id, x.name])), [rows]);
  const feed = useMemo(() => {
    const all = [];
    eventsBy.forEach((list, id) => list.forEach((e) => { if (feedAll || IMPORTANT.has(e.t)) all.push({ ...e, id }); }));
    return all.sort((a, b) => b.at - a.at).slice(0, 60);
  }, [eventsBy, feedAll]);

  // تنبيه صوتي لما حد يخرج / النت يفصل / يتقفل
  const seen = useRef(null);
  useEffect(() => {
    const keys = new Set(feed.map((e) => `${e.id}:${e.at}:${e.t}`));
    if (seen.current && sound) {
      const fresh = feed.filter((e) => ALERT.has(e.t) && !seen.current.has(`${e.id}:${e.at}:${e.t}`) && now - e.at < 120e3);
      if (fresh.length) beep(fresh.some((e) => ['cheated', 'hold', 'submit_fail'].includes(e.t)) ? 'bad' : 'warn');
    }
    seen.current = keys;
  }, [feed, sound, now]);
  const toggleSound = () => { const v = !sound; setSound(v); try { localStorage.setItem('nx-live-sound', v ? '1' : '0'); } catch { /* ignore */ } if (v) beep(); };

  const shown = rows.filter((x) => {
    if (filter === 'live' && !(x.state === 'live' || x.state === 'approved')) return false;
    if (filter === 'offline' && x.diag.code !== 'live_offline') return false;
    if (!['all', 'live', 'offline', 'decision'].includes(filter) && x.state !== filter) return false;
    if (filter === 'decision' && !['held', 'cheated'].includes(x.state)) return false;
    return !q || `${x.name} ${x.phone}`.includes(q.trim());
  });
  const open = rows.find((x) => x.r?.id === openId) || null;
  const endsIn = exam ? toMs(exam.endTime) - now : 0;

  const actionsFor = (x) => (
    <div className="elv-acts">
      {['left', 'held', 'cheated'].includes(x.state) && handleApproveSecurityContinue && <button type="button" onClick={(e) => { e.stopPropagation(); handleApproveSecurityContinue({ ...x.r, totalTime: x.r.totalTime || exam.duration }); }}><Icon name="play" />يكمّل</button>}
      {['left', 'held', 'cheated'].includes(x.state) && handleApproveSecurityRestart && <button type="button" className="is-ghost" onClick={(e) => { e.stopPropagation(); handleApproveSecurityRestart({ ...x.r, totalTime: x.r.totalTime || exam.duration }); }}><Icon name="refresh" />من الأول</button>}
      {x.state === 'submitted' && openAdminResultReview && <button type="button" className="is-ghost" onClick={(e) => { e.stopPropagation(); openAdminResultReview(x.r); }}><Icon name="eye" />الإجابات</button>}
      {x.phone && x.state !== 'submitted' && x.state !== 'live' && <a className="is-ghost" href={`https://wa.me/2${String(x.phone).replace(/^\+?2?/, '')}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}><Icon name="whatsapp" />كلّمه</a>}
    </div>
  );

  const KPIS = [
    { key: 'live', label: 'بيمتحنوا دلوقتي', icon: 'live', tone: 'live', n: k.live },
    { key: 'offline', label: 'النت فاصل عندهم', icon: 'wifiOff', tone: 'warn', n: k.offline },
    { key: 'left', label: 'خرجوا قبل التسليم', icon: 'logout', tone: 'warn', n: k.left },
    { key: 'decision', label: 'محتاجين قرارك', icon: 'shield', tone: 'bad', n: k.decision },
    { key: 'submitted', label: 'سلّموا', icon: 'checkCircle', tone: 'ok', n: k.submitted },
    { key: 'absent', label: 'لسه ما دخلوش', icon: 'clock', tone: 'mute', n: k.absent },
  ];

  return (
    <div className="elv" dir="rtl">
      <div className="elv-head">
        <label className="elv-pick">
          <Icon name="exam" />
          <select value={chosen} onChange={(e) => { setExamId(e.target.value); setOpenId(null); }} aria-label="اختار الامتحان">
            {openExams.length > 0 && <optgroup label="مفتوح دلوقتي">{openExams.map((e) => <option key={e.id} value={e.id}>● {e.title || 'امتحان'}</option>)}</optgroup>}
            {recent.length > 0 && <optgroup label="آخر يومين">{recent.map((e) => <option key={e.id} value={e.id}>{e.title || 'امتحان'}</option>)}</optgroup>}
            <optgroup label="كل الامتحانات">{examsList.filter((e) => !openExams.includes(e) && !recent.includes(e)).map((e) => <option key={e.id} value={e.id}>{e.title || 'امتحان'}</option>)}</optgroup>
          </select>
        </label>
        {exam && <span className={`elv-window ${examWindowOpen(exam, now) ? 'is-open' : ''}`}><i />{examWindowOpen(exam, now) ? `مفتوح · بيقفل بعد ${dur(endsIn / 1000)}` : 'مقفول'}</span>}
        <span className="elv-sp" />
        <label className="elv-search"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="اسم الطالب أو رقمه" /></label>
        <button type="button" className={`elv-sound ${sound ? 'is-on' : ''}`} onClick={toggleSound} title="صوت لما طالب يخرج أو النت يفصل أو يتقفل"><Icon name="bell" />{sound ? 'الصوت شغال' : 'الصوت مقفول'}</button>
      </div>

      <div className="elv-kpis">
        {KPIS.map((x, i) => (
          <button key={x.key} type="button" className={`elv-kpi tone-${x.tone} ${filter === x.key ? 'is-on' : ''} ${x.n && ['warn', 'bad'].includes(x.tone) ? 'is-hot' : ''}`} style={{ animationDelay: `${i * 0.04}s` }} onClick={() => setFilter(filter === x.key ? 'all' : x.key)}>
            <span><Icon name={x.icon} />{x.label}</span><b>{formatNumber(x.n)}</b>
          </button>
        ))}
        <div className="elv-kpi elv-kpi--prog"><span><Icon name="chart" />متوسط التقدم</span><b>{formatNumber(k.progress)}<small>٪</small></b><i><em style={{ width: `${k.progress}%` }} /></i></div>
      </div>

      {!exam && <p className="elv-empty">مفيش امتحانات لسه.</p>}

      {exam && (
        <div className="elv-grid">
          <div className="elv-main">
            {(reasons.length > 0 || funnel[1].n > 0) && (
              <div className="elv-analysis">
                <section className="elv-card">
                  <h3><Icon name="help" />ليه الطلبة خرجوا من غير ما يسلّموا؟</h3>
                  {reasons.length === 0 ? <p className="elv-dim">محدش خرج لحد دلوقتي.</p> : (
                    <div className="elv-bars">
                      {reasons.map(([code, n]) => (
                        <button key={code} type="button" onClick={() => setFilter(['cheated', 'hold'].includes(code) ? 'decision' : 'left')}>
                          <span>{DIAG_GROUPS[code] || code}</span>
                          <i><em style={{ width: `${(n / Math.max(...reasons.map((r) => r[1]))) * 100}%` }} className={['cheated', 'hold', 'submit_failed', 'error'].includes(code) ? 'is-bad' : ''} /></i>
                          <b>{formatNumber(n)}</b>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
                <section className="elv-card">
                  <h3><Icon name="route" />مسار الامتحان</h3>
                  <div className="elv-funnel">
                    {funnel.map((f, i) => (
                      <div key={f.label}>
                        <span>{f.label}</span>
                        <i><em style={{ width: `${funnel[0].n ? (f.n / funnel[0].n) * 100 : 0}%`, opacity: 1 - i * 0.12 }} /></i>
                        <b>{formatNumber(f.n)}</b>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {shown.length === 0 && <p className="elv-empty">{filter === 'all' ? 'لسه محدش دخل الامتحان ده.' : 'مفيش طلاب في الحالة دي.'}</p>}
            <div className="elv-list">
              {shown.slice(0, 300).map((x) => {
                const st = LIVE_STATES[x.state];
                const pct = x.total ? Math.round((x.answered / x.total) * 100) : 0;
                const qNow = (Number(x.r?.currentQIndex) || 0) + 1;
                const onQ = x.state === 'live' && x.r?.lastEvent?.at ? Math.round((now - x.r.lastEvent.at) / 1000) : 0;
                return (
                  <div key={x.r?.id || x.u.id} className={`elv-row tone-${x.diag.tone}`} role={x.r ? 'button' : undefined} tabIndex={x.r ? 0 : undefined}
                    onClick={() => x.r && setOpenId(x.r.id)} onKeyDown={(e) => { if (x.r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpenId(x.r.id); } }}>
                    <span className="elv-who"><i>{String(x.name).trim().charAt(0)}</i><span><b>{x.name}</b><small>{x.phone || x.grade || ''}</small></span></span>
                    <span className="elv-state">
                      <em className="elv-badge"><Icon name={x.diag.icon || st.icon} />{x.state === 'submitted' || x.state === 'absent' ? st.label : x.diag.title}</em>
                      {x.diag.detail && x.state !== 'absent' && <small>{x.diag.detail}</small>}
                    </span>
                    <span className="elv-prog">
                      {x.state === 'submitted'
                        ? <b className="elv-score">{formatNumber(x.r.score ?? 0)} / {formatNumber(x.r.total ?? x.total)} · {formatNumber(x.r.percentage ?? 0)}٪</b>
                        : x.r ? <><i><em style={{ width: `${pct}%` }} /></i><small>{formatNumber(x.answered)} من {formatNumber(x.total)}{x.state === 'live' ? ` · على س${formatNumber(qNow)}${onQ > 60 ? ` من ${dur(onQ)}` : ''}` : ''}</small></> : <small>—</small>}
                    </span>
                    <span className="elv-time">{x.state === 'submitted' ? <small>{x.r.timeTaken ? `خلص في ${clock(x.r.timeTaken)}` : 'اتسلّم'}</small> : x.remaining != null ? <b>{clock(x.remaining)}</b> : <small>—</small>}<small>{x.state === 'submitted' ? ago(toMs(x.r.submittedAt), now) : x.beat ? ago(x.beat, now) : ''}</small></span>
                    <span className="elv-sigcol"><Signals r={x.r} />{x.r?.antiCheatWarnings ? <small className="elv-warn">{formatNumber(x.r.antiCheatWarnings)} تنبيه</small> : null}</span>
                    {actionsFor(x)}
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="elv-feed elv-card">
            <h3><span className="elv-dot" />النشاط اللحظي<label><input type="checkbox" checked={feedAll} onChange={(e) => setFeedAll(e.target.checked)} />كل حاجة</label></h3>
            {evState === 'error' && <p className="elv-dim">مش قادر يقرا التتبع. نفّذ: firebase deploy --only firestore:rules</p>}
            {evState !== 'error' && feed.length === 0 && <p className="elv-dim">أول ما الطلبة يبدأوا هتشوف كل حركة هنا.</p>}
            <ol>
              {feed.map((e, i) => {
                const v = EVENT_VIEW[e.t] || { icon: 'info', tone: 'mute' };
                return (
                  <li key={`${e.id}-${e.at}-${i}`} className={`tone-${v.tone}`} onClick={() => setOpenId(e.id)}>
                    <i><Icon name={v.icon} /></i>
                    <span><b>{nameOf.get(e.id) || 'طالب'}</b> {eventText(e)}</span>
                    <small>{ago(e.at, now)}</small>
                  </li>
                );
              })}
            </ol>
          </aside>
        </div>
      )}

      <p className="elv-note"><Icon name="info" />اضغط على أي طالب تشوف تتبع امتحانه كامل من أول ما فتح لحد ما خرج. الصفحة بتتحدث لوحدها.</p>
      {open && <StudentDrawer x={open} exam={exam} events={open.events} onClose={() => setOpenId(null)} actions={actionsFor(open)} />}
    </div>
  );
}

export { StudentDrawer, Timeline };
