// درجات امتحان الحصة (HTML): كل طالب ودرجته، اللي اتحظر أو خرج، واللي لسه ماامتحنش — والإعادة بضغطة.
import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '@services/firebase';
import { Icon } from '@v2/ui/Icon.jsx';
import { getGradeLabel } from '@shared/constants/grades';
import { platformNotify } from '@shared/core/platformShared.jsx';
import { audienceStudents } from '@shared/audience/audience.js';
import { buildNotification } from '@shared/notifications/notify.js';
import '@styles/pages/admin-people.css';

const n = (x) => Number(x || 0).toLocaleString('ar-EG');
const ms = (v) => (v?.seconds ? v.seconds * 1000 : v ? new Date(v).getTime() || 0 : 0);
const when = (v) => { const t = ms(v); return t ? new Date(t).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'; };
const dur = (s) => (s ? `${n(Math.floor(s / 60))}:${String(Math.round(s % 60)).padStart(2, '0').replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d])}` : '—');
const STATUS = {
  completed: { label: 'اتسلّم', tone: 'ok', icon: 'checkCircle' },
  cheated: { label: 'اتحظر (غش)', tone: 'bad', icon: 'shield' },
  timed_out: { label: 'الوقت خلص', tone: 'bad', icon: 'clock' },
  exited: { label: 'خرج قبل التسليم', tone: 'bad', icon: 'lock' },
  in_progress: { label: 'بيمتحن / قفل التطبيق', tone: 'gold', icon: 'live' },
  retake_allowed: { label: 'مسموح يعيد', tone: 'gold', icon: 'key' },
};
const RANK = { completed: 0, retake_allowed: 1, in_progress: 2, cheated: 3, timed_out: 4, exited: 5 };

export default function AdminLessonExamGrades({ content, users = [], groups = [], onClose }) {
  const [rows, setRows] = useState([]);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState('');
  const [busy, setBusy] = useState('');
  const [marks, setMarks] = useState({});

  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined' && window.__nxDemoLessonGrades) { setRows(window.__nxDemoLessonGrades); setReady(true); return undefined; } // معاينة التطوير بس
    return onSnapshot(query(collection(db, 'exam_results'), where('examId', '==', content.id)), (snap) => {
    setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setReady(true);
  }, () => setReady(true));
  }, [content.id]);

  // محاولة واحدة لكل طالب (لو فيه أكتر من مستند ناخد الأهم)
  const attempts = useMemo(() => {
    const by = new Map();
    rows.forEach((r) => { const cur = by.get(r.studentId); if (!cur || (RANK[r.status] ?? 9) < (RANK[cur.status] ?? 9)) by.set(r.studentId, r); });
    return [...by.values()];
  }, [rows]);
  const audience = content.audience || { mode: 'grades', grades: content.grade ? [content.grade] : [] };
  const targets = useMemo(() => audienceStudents(audience, users, groups), [audience, users, groups]);
  const notTaken = targets.filter((u) => !attempts.some((a) => a.studentId === (u.id || u.uid)));
  const done = attempts.filter((a) => a.status === 'completed');
  const closed = attempts.filter((a) => ['cheated', 'timed_out', 'exited', 'in_progress'].includes(a.status));
  const asks = attempts.filter((a) => a.studentNotes === 'retake_request' && a.status !== 'retake_allowed');
  const pcts = done.filter((a) => a.score !== undefined && a.score !== null).map((a) => Number(a.percentage) || 0);
  const avg = pcts.length ? Math.round(pcts.reduce((s, x) => s + x, 0) / pcts.length) : 0;
  const top = pcts.length ? Math.max(...pcts) : 0;

  const list = (tab === 'none' ? [] : tab === 'done' ? done : tab === 'closed' ? closed : tab === 'asks' ? asks : attempts)
    .filter((a) => !q.trim() || String(a.studentName || '').includes(q.trim()))
    .sort((a, b) => (Number(b.percentage) || -1) - (Number(a.percentage) || -1));
  const missing = notTaken.filter((u) => !q.trim() || String(u.name || '').includes(q.trim()));

  const allowRetake = async (r) => {
    setBusy(r.id);
    try {
      await updateDoc(doc(db, 'exam_results', r.id), { status: 'retake_allowed', adminDecision: 'restart', retakeGrantedAt: serverTimestamp(), retakeCount: (Number(r.retakeCount) || 0) + 1, studentNotes: '' });
      if (r.studentId) await addDoc(collection(db, 'notifications'), buildNotification({ audienceKeys: [`user:${r.studentId}`], category: 'exam', title: `تقدر تعيد «${content.title || 'امتحان الحصة'}»`, body: 'المدرس وافق إنك تمتحن تاني. افتحه من الامتحانات ← امتحانات الحصة.' })).catch(() => {});
      platformNotify(`اتسمح لـ ${r.studentName || 'الطالب'} يعيد، ووصله إشعار`);
    } catch (e) { platformNotify('ماتحفظش: ' + (e?.message || 'خطأ')); }
    setBusy('');
  };

  // تسليم من غير درجة (الصفحة مابعتتهاش): المدرس يحطها
  const saveMark = async (r) => {
    const m = marks[r.id] || {};
    const score = Number(m.score); const total = Number(m.total || r.total || 0);
    if (!Number.isFinite(score) || !total || score < 0 || score > total) return platformNotify('اكتب الدرجة صح (الدرجة ≤ النهاية)');
    setBusy(r.id);
    try {
      await updateDoc(doc(db, 'exam_results', r.id), { score, total, totalPossible: total, percentage: Math.round((score / total) * 100), gradedByAdminAt: serverTimestamp(), 'performanceAnalysis.ungraded': false });
      if (r.studentId) await addDoc(collection(db, 'notifications'), buildNotification({ audienceKeys: [`user:${r.studentId}`], category: 'result', title: `درجتك في «${content.title || 'امتحان الحصة'}»`, body: `${score} من ${total}` })).catch(() => {});
      platformNotify('اتحفظت الدرجة ووصلت للطالب');
    } catch (e) { platformNotify('ماتحفظش: ' + (e?.message || 'خطأ')); }
    setBusy('');
  };

  const exportCsv = () => {
    const head = ['الطالب', 'الصف', 'الحالة', 'الدرجة', 'من', 'النسبة', 'الوقت (ث)', 'التحذيرات', 'التاريخ'];
    const lines = attempts.map((a) => [a.studentName, getGradeLabel(a.grade) || a.grade, STATUS[a.status]?.label || a.status, a.score ?? '', a.total ?? '', a.percentage ?? '', a.timeTaken ?? '', a.antiCheatWarnings ?? 0, when(a.submittedAt || a.updatedAt)]);
    notTaken.forEach((u) => lines.push([u.name, getGradeLabel(u.grade) || u.grade, 'لسه ماامتحنش', '', '', '', '', '', '']));
    const csv = '﻿' + [head, ...lines].map((r) => r.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `درجات-${content.title || 'امتحان'}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  return (
    <div className="apl-modal alg" role="dialog" aria-modal="true">
      <button type="button" className="apl-modal__scrim" aria-label="إغلاق" onClick={onClose} />
      <div className="alg-box apl">
        <header className="alg-head">
          <span className="acn-row__ico t-interactive_exam"><Icon name="exam" /></span>
          <div><small>درجات امتحان الحصة</small><h3>{content.title || 'امتحان'}</h3></div>
          <button type="button" className="apl-btn" onClick={exportCsv}><Icon name="download" />Excel</button>
          <button type="button" className="apl-icon" title="إغلاق" onClick={onClose}><Icon name="close" /></button>
        </header>

        <div className="apl-kpis alg-kpis">
          <button type="button" className="apl-kpi" onClick={() => setTab('done')}><span><Icon name="checkCircle" />امتحنوا</span><b>{n(done.length)}</b></button>
          <div className="apl-kpi"><span><Icon name="chart" />المتوسط</span><b>{n(avg)}٪</b></div>
          <div className="apl-kpi"><span><Icon name="trophy" />أعلى درجة</span><b>{n(top)}٪</b></div>
          <button type="button" className="apl-kpi tone-bad" onClick={() => setTab('closed')}><span><Icon name="shield" />اتقفل عليهم</span><b>{n(closed.length)}</b></button>
          <button type="button" className="apl-kpi tone-gold" onClick={() => setTab('none')}><span><Icon name="clock" />لسه ماامتحنوش</span><b>{n(notTaken.length)}</b></button>
        </div>

        <div className="apl-bar">
          <div className="aas-seg">
            {[['all', 'الكل', attempts.length], ['done', 'اتسلّم', done.length], ['closed', 'اتقفل', closed.length], ['asks', 'طالبين إعادة', asks.length], ['none', 'لسه ماامتحنوش', notTaken.length]].map(([k, l, c]) => (
              <button key={k} type="button" className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}>{l}{c ? <i>{n(c)}</i> : null}</button>
            ))}
          </div>
          <span className="apl-sp" />
          <label className="apl-search"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر باسم الطالب" /></label>
        </div>

        <div className="alg-list">
          {!ready && <div className="apl-empty"><Icon name="clock" />بيحمّل…</div>}
          {ready && tab !== 'none' && list.map((a, i) => {
            const st = STATUS[a.status] || { label: a.status, tone: '', icon: 'info' };
            const det = a.performanceAnalysis?.details || [];
            const open = openId === a.id;
            return (
              <div key={a.id} className={`alg-row is-${st.tone}`}>
                <span className="alg-rank">{a.status === 'completed' ? n(i + 1) : '—'}</span>
                <div className="alg-main">
                  <b>{a.studentName || 'طالب'}</b>
                  <div className="aas-tags">
                    <span className={`apl-chip${st.tone === 'bad' ? ' is-bad' : st.tone === 'gold' ? ' is-gold' : ''}`}><Icon name={st.icon} />{st.label}{a.status === 'cheated' && a.securityReason ? ` — ${a.securityReason}` : ''}</span>
                    {a.grade ? <span className="apl-chip">{getGradeLabel(a.grade) || a.grade}</span> : null}
                    {a.timeTaken ? <span className="apl-chip"><Icon name="clock" />{dur(a.timeTaken)}</span> : null}
                    {Number(a.antiCheatWarnings) > 0 && <span className="apl-chip is-gold"><Icon name="alert" />{n(a.antiCheatWarnings)} تحذير</span>}
                    {a.performanceAnalysis?.autoSubmitted && <span className="apl-chip">اتسلّم لوحده</span>}
                    {a.status === 'completed' && (a.score === undefined || a.score === null) && <span className="apl-chip is-bad"><Icon name="edit" />من غير درجة — حطها</span>}
                    {a.performanceAnalysis?.inferred && <span className="apl-chip">الدرجة اتقرت من الصفحة</span>}
                    {a.studentNotes === 'retake_request' && a.status !== 'retake_allowed' && <span className="apl-chip is-gold"><Icon name="refresh" />طالب يعيد</span>}
                    <span className="apl-chip is-mute">{when(a.submittedAt || a.updatedAt || a.createdAt)}</span>
                  </div>
                  {open && det.length > 0 && (
                    <div className="alg-qs">
                      {det.map((d, k) => <span key={k} className={d.ok ? 'is-ok' : d.answer === undefined || d.answer === null ? 'is-skip' : 'is-bad'} title={String(d.text || '').replace(/<[^>]*>/g, '').slice(0, 120)}>{n(d.n || k + 1)}{d.ok ? '✓' : d.answer === undefined || d.answer === null ? '–' : '✗'}</span>)}
                    </div>
                  )}
                </div>
                <div className="alg-score">
                  {a.status === 'completed' && (a.score === undefined || a.score === null) ? (
                    <div className="alg-mark">
                      <input type="number" min="0" placeholder="الدرجة" value={marks[a.id]?.score ?? ''} onChange={(e) => setMarks((x) => ({ ...x, [a.id]: { ...x[a.id], score: e.target.value } }))} />
                      <span>من</span>
                      <input type="number" min="1" placeholder="١٠" value={marks[a.id]?.total ?? ''} onChange={(e) => setMarks((x) => ({ ...x, [a.id]: { ...x[a.id], total: e.target.value } }))} />
                      <button type="button" className="apl-btn apl-btn--ok" disabled={busy === a.id} onClick={() => saveMark(a)}><Icon name="check" /></button>
                    </div>
                  ) : a.status === 'completed' ? <><b>{n(a.score)}<small>/{n(a.total)}</small></b><em className={Number(a.percentage) >= 75 ? 'is-ok' : Number(a.percentage) >= 50 ? 'is-mid' : 'is-bad'}>{n(a.percentage)}٪</em></> : <b className="is-dim">—</b>}
                </div>
                <div className="apl-acts">
                  {det.length > 0 && <button type="button" className="apl-btn" onClick={() => setOpenId(open ? '' : a.id)}><Icon name={open ? 'chevronDown' : 'eye'} />الأسئلة</button>}
                  {a.status !== 'retake_allowed' && <button type="button" className="apl-btn" disabled={busy === a.id} onClick={() => allowRetake(a)}><Icon name="refresh" />اسمح يعيد</button>}
                </div>
              </div>
            );
          })}
          {ready && tab === 'none' && missing.map((u) => (
            <div key={u.id || u.uid} className="alg-row is-gold">
              <span className="alg-rank">—</span>
              <div className="alg-main"><b>{u.name || 'طالب'}</b><div className="aas-tags"><span className="apl-chip is-gold"><Icon name="clock" />لسه ماامتحنش</span>{u.grade ? <span className="apl-chip">{getGradeLabel(u.grade)}</span> : null}</div></div>
              <div className="alg-score"><b className="is-dim">—</b></div>
              <div className="apl-acts">{u.phone ? <a className="apl-btn" href={`https://wa.me/2${String(u.phone).replace(/\D/g, '').replace(/^2/, '')}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" />فكّره</a> : null}</div>
            </div>
          ))}
          {ready && ((tab === 'none' && !missing.length) || (tab !== 'none' && !list.length)) && <div className="apl-empty"><Icon name="users" />مفيش طلبة هنا</div>}
        </div>
      </div>
    </div>
  );
}
