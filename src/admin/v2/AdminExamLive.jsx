// «مراقبة الامتحانات لايف»: every attempt and what's happening with it right now —
// بيمتحن دلوقتي · خرج من الامتحان · سلّم · متوقف للأمان · مخالفة · وافقت يكمّل · لسه ما دخلش.
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@v2/ui/Icon.jsx';
import { formatNumber } from '@v2/ui/kit.jsx';
import '@styles/pages/admin-live.css';

const toMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (v.toMillis) return v.toMillis();
  if (v.seconds) return v.seconds * 1000;
  const d = new Date(v).getTime();
  return Number.isFinite(d) ? d : 0;
};
const ago = (ms, now) => {
  if (!ms) return '—';
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 45) return 'دلوقتي';
  const m = Math.round(s / 60);
  if (m < 60) return `من ${formatNumber(m)} دقيقة`;
  const h = Math.round(m / 60);
  return h < 24 ? `من ${formatNumber(h)} ساعة` : new Date(ms).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
};
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
  const last = Math.max(beat, toMs(r.lastSavedAt), toMs(r.submittedAt));
  const limit = beat ? 75e3 : 180e3; // with the 30s heartbeat, 75s of silence means the student is gone
  if (r.presence === 'away' || now - last > limit) return 'left';
  return 'live';
}

function examWindowOpen(e, now) {
  const s = toMs(e.startTime); const en = toMs(e.endTime);
  return s && en && s <= now && en >= now;
}

export default function AdminExamLive({ ctx }) {
  const { examsList = [], examResults = [], activeUsersList = [], handleApproveSecurityContinue, handleApproveSecurityRestart, openAdminResultReview, adminGradeFilter } = ctx;
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(id); }, []);

  const openExams = useMemo(() => examsList.filter((e) => examWindowOpen(e, now)), [examsList, now]);
  const recent = useMemo(() => {
    const ids = new Set(examResults.filter((r) => now - Math.max(toMs(r.lastSeenAt), toMs(r.lastSavedAt), toMs(r.submittedAt)) < 6 * 3600e3).map((r) => r.examId));
    return examsList.filter((e) => ids.has(e.id) && !examWindowOpen(e, now));
  }, [examsList, examResults, now]);
  const [examId, setExamId] = useState('');
  const chosen = examId || openExams[0]?.id || recent[0]?.id || examsList[0]?.id || '';
  const exam = examsList.find((e) => e.id === chosen);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

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
      const total = r.totalQuestions || (exam.questions || []).reduce((n, b) => n + (b.subQuestions || []).length, 0);
      const answered = r.answeredCount ?? Object.values(r.answers || {}).filter((v) => v !== undefined && v !== null && v !== '').length;
      const beat = Math.max(toMs(r.lastSeenAt), toMs(r.lastSavedAt));
      const remaining = state === 'live' && r.remainingTime != null ? r.remainingTime - (now - beat) / 1000 : r.remainingTime;
      return { r, u, state, name: r.studentName || u.name || 'طالب', phone: u.phone || '', grade: u.grade || r.grade || '', total, answered, beat, remaining };
    });
    // students of this exam's grade who never opened it
    const started = new Set(list.map((x) => x.r.studentId));
    const grade = exam.grade && exam.grade !== 'all' ? exam.grade : (adminGradeFilter && adminGradeFilter !== 'all' ? adminGradeFilter : '');
    if (examWindowOpen(exam, now)) {
      activeUsersList.filter((u) => (!grade || u.grade === grade) && !started.has(u.id || u.uid) && (u.role || 'student') === 'student')
        .forEach((u) => list.push({ r: null, u, state: 'absent', name: u.name || 'طالب', phone: u.phone || '', grade: u.grade || '', total: 0, answered: 0, beat: 0, remaining: null }));
    }
    const order = { live: 0, left: 1, held: 2, approved: 3, cheated: 4, submitted: 5, absent: 6 };
    return list.sort((a, b) => order[a.state] - order[b.state] || b.beat - a.beat);
  }, [exam, examResults, activeUsersList, now, adminGradeFilter]);

  const counts = rows.reduce((acc, x) => { acc[x.state] = (acc[x.state] || 0) + 1; return acc; }, {});
  const shown = rows.filter((x) => (filter === 'all' || x.state === filter) && (!q || `${x.name} ${x.phone}`.includes(q.trim())));

  return (
    <div className="alv">
      <div className="alv-head">
        <label className="alv-pick">
          <Icon name="exam" />
          <select value={chosen} onChange={(e) => setExamId(e.target.value)} aria-label="اختار الامتحان">
            {openExams.length > 0 && <optgroup label="مفتوح دلوقتي">{openExams.map((e) => <option key={e.id} value={e.id}>● {e.title || 'امتحان'}</option>)}</optgroup>}
            {recent.length > 0 && <optgroup label="اتقفل قريب">{recent.map((e) => <option key={e.id} value={e.id}>{e.title || 'امتحان'}</option>)}</optgroup>}
            <optgroup label="كل الامتحانات">{examsList.filter((e) => !openExams.includes(e) && !recent.includes(e)).map((e) => <option key={e.id} value={e.id}>{e.title || 'امتحان'}</option>)}</optgroup>
          </select>
        </label>
        {exam && <span className={`alv-window ${examWindowOpen(exam, now) ? 'is-open' : ''}`}><i />{examWindowOpen(exam, now) ? `مفتوح · بيقفل ${new Date(toMs(exam.endTime)).toLocaleString('ar-EG', { weekday: 'long', hour: 'numeric', minute: '2-digit' })}` : 'مقفول'}</span>}
        <span className="alv-sp" />
        <label className="alv-search"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="اسم الطالب أو رقمه" /></label>
      </div>

      <div className="alv-stats">
        {['live', 'left', 'held', 'submitted', 'absent'].map((k, i) => (
          <button key={k} type="button" className={`alv-stat alv-tone-${LIVE_STATES[k].tone} ${filter === k ? 'is-on' : ''}`} style={{ animationDelay: `${i * 0.05}s` }} onClick={() => setFilter(filter === k ? 'all' : k)}>
            <span><Icon name={LIVE_STATES[k].icon} />{LIVE_STATES[k].label}</span>
            <b>{formatNumber(counts[k] || 0)}</b>
          </button>
        ))}
      </div>

      {!exam && <p className="alv-empty">مفيش امتحانات لسه.</p>}
      {exam && shown.length === 0 && <p className="alv-empty">{filter === 'all' ? 'لسه محدش دخل الامتحان ده.' : 'مفيش طلاب في الحالة دي.'}</p>}

      {shown.length > 0 && (
        <div className="alv-list" role="table" aria-label="حالة الطلاب">
          <div className="alv-row alv-row--head" role="row"><span>الطالب</span><span>الحالة</span><span>التقدم</span><span>الوقت الباقي</span><span>آخر ظهور</span><span /></div>
          {shown.slice(0, 300).map((x) => {
            const st = LIVE_STATES[x.state];
            const pct = x.total ? Math.round((x.answered / x.total) * 100) : 0;
            return (
              <div key={x.r?.id || x.u.id} className={`alv-row alv-tone-${st.tone}`} role="row">
                <span className="alv-who"><i>{String(x.name).trim().charAt(0)}</i><span><b>{x.name}</b><small>{x.phone || x.grade || ''}</small></span></span>
                <span><em className="alv-badge"><Icon name={st.icon} />{st.label}</em>{x.r?.antiCheatWarnings ? <small className="alv-warn">{formatNumber(x.r.antiCheatWarnings)} تنبيه أمان</small> : null}</span>
                <span className="alv-prog">{x.state === 'submitted'
                  ? <b className="alv-score">{formatNumber(x.r.score ?? 0)} / {formatNumber(x.r.total ?? x.total)} · {formatNumber(x.r.percentage ?? 0)}٪</b>
                  : x.r ? <><i><em style={{ width: `${pct}%` }} /></i><small>{formatNumber(x.answered)} من {formatNumber(x.total)}</small></> : <small>—</small>}</span>
                <span>{x.state === 'submitted' ? <small>{x.r.timeTaken ? `خلص في ${clock(x.r.timeTaken)}` : 'اتسلّم'}</small> : x.remaining != null ? <b className="alv-time">{clock(x.remaining)}</b> : <small>—</small>}</span>
                <span><small>{x.state === 'submitted' ? ago(toMs(x.r.submittedAt), now) : ago(x.beat, now)}</small></span>
                <span className="alv-act">
                  {['left', 'held', 'cheated'].includes(x.state) && handleApproveSecurityContinue && <button type="button" onClick={() => handleApproveSecurityContinue({ ...x.r, totalTime: x.r.totalTime || exam.duration })}><Icon name="play" />يكمّل</button>}
                  {['left', 'held', 'cheated'].includes(x.state) && handleApproveSecurityRestart && <button type="button" className="is-ghost" onClick={() => handleApproveSecurityRestart({ ...x.r, totalTime: x.r.totalTime || exam.duration })}><Icon name="refresh" />من الأول</button>}
                  {x.state === 'submitted' && openAdminResultReview && <button type="button" className="is-ghost" onClick={() => openAdminResultReview(x.r)}><Icon name="eye" />الإجابات</button>}
                  {x.state === 'absent' && x.phone && <a className="is-ghost" href={`https://wa.me/2${String(x.phone).replace(/^\+?2?/, '')}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" />كلّمه</a>}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <p className="alv-note"><Icon name="info" />الصفحة بتتحدّث لوحدها. «خرج من الامتحان» يعني قفل الصفحة أو سابها أكتر من دقيقة؛ تقدر تسمح له يكمّل بنفس إجاباته ووقته الباقي، أو يبدأ من الأول.</p>
    </div>
  );
}
