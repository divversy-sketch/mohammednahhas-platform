// الواجبات — نشر واجب لمين ما تحب (كل الطلبة / صفوف / مجموعات / طلبة بالاسم) + إشعار تلقائي،
// وتصحيح التسليمات في نفس الصفحة (الدرجة + التعليق) بدل النوافذ اللي ورا بعض.
import { useEffect, useMemo, useState } from 'react';
import { doc, collection, addDoc, onSnapshot, updateDoc, deleteDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { getGradeLabel } from '../../shared/constants/grades';
import { platformNotify, platformConfirm, safeNumber } from '../../shared/core/platformShared.jsx';
import { Icon } from '@v2/ui/Icon.jsx';
import AudiencePicker, { useStudentGroups } from '@admin/v2/AudiencePicker.jsx';
import { defaultAudience, resolveAudience, audienceLabel } from '@shared/audience/audience.js';
import { buildNotification } from '@shared/notifications/notify.js';
import '@styles/pages/admin-people.css';

const n = (x) => Number(x || 0).toLocaleString('ar-EG');
const secs = (t) => (t?.seconds ? t.seconds * 1000 : t ? new Date(t).getTime() : 0);
const fmtDate = (ms) => (ms ? new Date(ms).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');
const DELIVERY = { text_or_image: 'نص أو صورة', image_only: 'صورة بس', text_only: 'نص بس' };
const blankForm = (grade) => ({ title: '', branch: 'التعبير', description: '', dueDate: '', totalMarks: 20, deliveryType: 'text_or_image', notify: true, audience: defaultAudience(grade && grade !== 'all' ? grade : '') });

function GradeBox({ item, onSaved }) {
  const max0 = item.maxScore ?? item.totalMarks ?? 20;
  const [score, setScore] = useState(item.score ?? '');
  const [max, setMax] = useState(max0);
  const [feedback, setFeedback] = useState(item.feedback || '');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (score === '' || Number.isNaN(Number(score))) return platformNotify('اكتب الدرجة');
    if (Number(score) > Number(max)) return platformNotify('الدرجة أكبر من النهاية العظمى');
    setBusy(true);
    try {
      await updateDoc(doc(db, 'assignment_submissions', item.id), { score: safeNumber(score, 0), maxScore: safeNumber(max, 20), feedback: feedback.trim(), reviewStatus: 'graded', gradedAt: serverTimestamp() });
      if (item.studentId) {
        await addDoc(collection(db, 'notifications'), buildNotification({ audienceKeys: [`user:${item.studentId}`], category: 'result', title: `اتصحح واجبك: ${item.assignmentTitle || 'واجب'}`, body: `درجتك ${score} من ${max}${feedback.trim() ? ` — ${feedback.trim()}` : ''}`, link: { kind: 'homework', id: item.assignmentId || '' } })).catch(() => {});
      }
      platformNotify('اتحفظ التصحيح ووصل للطالب');
      onSaved?.();
    } catch (e) { platformNotify('ماتحفظش: ' + (e?.message || 'خطأ')); }
    setBusy(false);
  };
  return (
    <div className="aas-grade">
      <div className="aas-grade__nums">
        <label className="apl-field"><span>الدرجة</span><input type="number" inputMode="decimal" min="0" value={score} onChange={(e) => setScore(e.target.value)} /></label>
        <b>من</b>
        <label className="apl-field"><span>النهاية</span><input type="number" min="1" value={max} onChange={(e) => setMax(e.target.value)} /></label>
      </div>
      <label className="apl-field"><span>تعليقك للطالب</span><textarea rows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="مثلاً: ممتاز، ركّز على الخاتمة" /></label>
      <button type="button" className="apl-btn apl-btn--ok" disabled={busy} onClick={save}><Icon name="check" />{item.reviewStatus === 'graded' ? 'تعديل التصحيح' : 'حفظ التصحيح'}</button>
    </div>
  );
}

export const AssignmentsManager = ({ adminGradeFilter = 'all', users = [] }) => {
  const groups = useStudentGroups();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [view, setView] = useState('subs');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(() => blankForm(adminGradeFilter));
  const [saving, setSaving] = useState(false);
  const [subFilter, setSubFilter] = useState('pending');
  const [subAssign, setSubAssign] = useState('');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState('');
  const [photo, setPhoto] = useState('');

  useEffect(() => onSnapshot(query(collection(db, 'assignments'), orderBy('createdAt', 'desc'), limit(150)), (snap) => {
    setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => secs(b.createdAt) - secs(a.createdAt)));
  }, (e) => { console.warn('assignments listener blocked:', e?.message); setAssignments([]); }), []);

  useEffect(() => onSnapshot(query(collection(db, 'assignment_submissions'), orderBy('submittedAt', 'desc'), limit(400)), (snap) => {
    setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => secs(b.submittedAt) - secs(a.submittedAt)));
  }, (e) => { console.warn('assignment_submissions listener blocked:', e?.message); setSubmissions([]); }), []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const reach = useMemo(() => resolveAudience(form.audience, users, groups), [form.audience, users, groups]);

  const byAssignment = useMemo(() => {
    const m = {};
    submissions.forEach((s) => { const k = s.assignmentId || ''; (m[k] ||= { all: 0, graded: 0 }); m[k].all += 1; if (s.reviewStatus === 'graded') m[k].graded += 1; });
    return m;
  }, [submissions]);

  const now = Date.now();
  const gradeOk = (g) => adminGradeFilter === 'all' || !g || g === adminGradeFilter || g === 'all' || g === 'multi' || g === 'custom';
  const visibleAssignments = assignments.filter((a) => gradeOk(a.grade) || (a.audience?.grades || []).includes(adminGradeFilter));
  const pendingCount = submissions.filter((s) => s.reviewStatus !== 'graded' && gradeOk(s.grade)).length;
  const kpis = [
    { key: 'active', label: 'واجبات شغالة', icon: 'file', value: visibleAssignments.filter((a) => a.status !== 'closed' && (!a.dueDate || secs(a.dueDate) > now)).length, tone: 'tone-info', go: () => setView('list') },
    { key: 'pending', label: 'مستني تصحيح', icon: 'clock', value: pendingCount, tone: 'tone-gold', go: () => { setView('subs'); setSubFilter('pending'); } },
    { key: 'graded', label: 'اتصحح', icon: 'checkCircle', value: submissions.filter((s) => s.reviewStatus === 'graded' && gradeOk(s.grade)).length, tone: '', go: () => { setView('subs'); setSubFilter('graded'); } },
    { key: 'late', label: 'خلص ميعادها', icon: 'calendar', value: visibleAssignments.filter((a) => a.dueDate && secs(a.dueDate) <= now).length, tone: 'tone-bad', go: () => setView('list') },
  ];

  const visibleSubs = submissions.filter((s) => {
    if (!gradeOk(s.grade)) return false;
    if (subAssign && s.assignmentId !== subAssign) return false;
    if (subFilter === 'pending' && s.reviewStatus === 'graded') return false;
    if (subFilter === 'graded' && s.reviewStatus !== 'graded') return false;
    if (q.trim()) { const t = q.trim().toLowerCase(); if (!`${s.studentName || ''} ${s.assignmentTitle || ''}`.toLowerCase().includes(t)) return false; }
    return true;
  });

  const publish = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return platformNotify('اكتب عنوان الواجب');
    if (!reach.audienceKeys.length) return platformNotify('اختار مين يشوف الواجب');
    setSaving(true);
    try {
      const { notify, audience: _a, ...rest } = form;
      const ref = await addDoc(collection(db, 'assignments'), {
        ...rest, title: form.title.trim(), description: form.description.trim(), totalMarks: safeNumber(form.totalMarks, 20),
        audience: reach.audience, audienceKeys: reach.audienceKeys, grade: reach.grade, createdAt: serverTimestamp(), status: 'active',
      });
      if (notify) {
        const due = form.dueDate ? ` — آخر ميعاد ${fmtDate(new Date(form.dueDate).getTime())}` : '';
        await addDoc(collection(db, 'notifications'), buildNotification({ audienceKeys: reach.audienceKeys, audience: reach.audience, category: 'homework', title: `واجب جديد: ${form.title.trim()}`, body: `${form.branch || ''}${due}`.replace(/^ — /, ''), link: { kind: 'homework', id: ref.id } })).catch(() => {});
      }
      platformNotify(notify ? `اتنشر الواجب ووصل إشعار لـ ${n(reach.count)} طالب` : 'اتنشر الواجب');
      setForm(blankForm(adminGradeFilter)); setShowForm(false); setView('list');
    } catch (err) { platformNotify('ماتنشرش: ' + (err?.message || 'خطأ')); }
    setSaving(false);
  };

  const toggleClose = (a) => updateDoc(doc(db, 'assignments', a.id), { status: a.status === 'closed' ? 'active' : 'closed' }).catch((e) => platformNotify(e?.message || 'خطأ'));
  const remove = async (a) => {
    if (!(await platformConfirm(`تحذف الواجب «${a.title}»؟ التسليمات بتاعته هتفضل في السجل.`))) return;
    deleteDoc(doc(db, 'assignments', a.id)).catch((e) => platformNotify(e?.message || 'خطأ'));
  };

  const label = (a) => audienceLabel(a, { gradeLabel: getGradeLabel, groups });

  return (
    <div className="apl aas">
      <div className="apl-kpis aas-kpis">
        {kpis.map((k) => (
          <button key={k.key} type="button" className={`apl-kpi ${k.tone}`} onClick={k.go}><span><Icon name={k.icon} />{k.label}</span><b>{n(k.value)}</b></button>
        ))}
      </div>

      <div className="apl-bar">
        <div className="aas-seg" role="tablist">
          <button type="button" className={view === 'subs' ? 'is-on' : ''} onClick={() => setView('subs')}><Icon name="checkCircle" />التسليمات{pendingCount ? <i>{n(pendingCount)}</i> : null}</button>
          <button type="button" className={view === 'list' ? 'is-on' : ''} onClick={() => setView('list')}><Icon name="file" />الواجبات المنشورة</button>
        </div>
        <span className="apl-sp" />
        <button type="button" className="apl-btn apl-btn--pri" onClick={() => setShowForm((v) => !v)}><Icon name={showForm ? 'close' : 'plus'} />{showForm ? 'إلغاء' : 'واجب جديد'}</button>
      </div>

      {showForm && (
        <form className="apl-section aas-form" onSubmit={publish}>
          <h3><Icon name="plus" />واجب جديد</h3>
          <div className="aas-grid">
            <label className="apl-field aas-span2"><span>عنوان الواجب</span><input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="مثلاً: موضوع تعبير عن الوطن" /></label>
            <label className="apl-field"><span>الفرع</span><input value={form.branch} onChange={(e) => set({ branch: e.target.value })} /></label>
            <label className="apl-field"><span>آخر ميعاد للتسليم</span><input type="datetime-local" value={form.dueDate} onChange={(e) => set({ dueDate: e.target.value })} /></label>
            <label className="apl-field"><span>الدرجة النهائية</span><input type="number" min="1" value={form.totalMarks} onChange={(e) => set({ totalMarks: e.target.value })} /></label>
            <label className="apl-field"><span>الطالب يسلّم إزاي</span><select value={form.deliveryType} onChange={(e) => set({ deliveryType: e.target.value })}>{Object.entries(DELIVERY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className="apl-field aas-span3"><span>المطلوب والتعليمات</span><textarea rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="اكتب للطالب المطلوب بالظبط" /></label>
          </div>
          <AudiencePicker title="مين يشوف الواجب؟" value={form.audience} onChange={(v) => set({ audience: v })} users={users} groups={groups} />
          <label className="aas-check"><input type="checkbox" checked={form.notify} onChange={(e) => set({ notify: e.target.checked })} /><span>ابعت إشعار للطلبة دول أول ما ينزل</span></label>
          <button className="apl-btn apl-btn--pri apl-btn--block" disabled={saving}><Icon name="rocket" />{saving ? 'بينشر…' : `انشر الواجب${reach.count ? ` لـ ${n(reach.count)} طالب` : ''}`}</button>
        </form>
      )}

      {view === 'list' && (
        <div className="apl-list">
          {visibleAssignments.map((a) => {
            const st = byAssignment[a.id] || { all: 0, graded: 0 };
            const due = secs(a.dueDate);
            const late = due && due <= now;
            return (
              <div key={a.id} className={`aas-item${a.status === 'closed' ? ' is-closed' : ''}`}>
                <div className="aas-item__main">
                  <b>{a.title || 'واجب بدون اسم'}</b>
                  <div className="aas-tags">
                    <span className="apl-chip"><Icon name="users" />{label(a)}</span>
                    {a.branch ? <span className="apl-chip">{a.branch}</span> : null}
                    <span className={`apl-chip${late ? ' is-bad' : ''}`}><Icon name="calendar" />{due ? (late ? `خلص ${fmtDate(due)}` : `لحد ${fmtDate(due)}`) : 'من غير ميعاد'}</span>
                    <span className="apl-chip">{n(a.totalMarks || 20)} درجة · {DELIVERY[a.deliveryType] || 'نص أو صورة'}</span>
                    {a.status === 'closed' ? <span className="apl-chip is-bad"><Icon name="lock" />مقفول</span> : null}
                  </div>
                </div>
                <button type="button" className="aas-item__stat" onClick={() => { setSubAssign(a.id); setSubFilter('all'); setView('subs'); }}>
                  <b>{n(st.all)}</b><span>تسليم</span><em>{st.all - st.graded ? `${n(st.all - st.graded)} مستني` : st.all ? 'كله اتصحح' : '—'}</em>
                </button>
                <div className="apl-acts">
                  <button type="button" className="apl-btn" onClick={() => toggleClose(a)}><Icon name={a.status === 'closed' ? 'key' : 'lock'} />{a.status === 'closed' ? 'افتحه تاني' : 'اقفل التسليم'}</button>
                  <button type="button" className="apl-icon" title="حذف" onClick={() => remove(a)}><Icon name="close" /></button>
                </div>
              </div>
            );
          })}
          {!visibleAssignments.length && <div className="apl-empty"><Icon name="file" /><b>مفيش واجبات لسه</b><span>دوس «واجب جديد» وابدأ</span></div>}
        </div>
      )}

      {view === 'subs' && (
        <>
          <div className="apl-bar">
            <label className="apl-search"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر باسم الطالب أو الواجب" /></label>
            <select className="apl-select" value={subAssign} onChange={(e) => setSubAssign(e.target.value)}>
              <option value="">كل الواجبات</option>
              {visibleAssignments.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
            <select className="apl-select" value={subFilter} onChange={(e) => setSubFilter(e.target.value)}>
              <option value="pending">مستني تصحيح</option><option value="graded">اتصحح</option><option value="all">الكل</option>
            </select>
            <span className="apl-count">{n(visibleSubs.length)} تسليم</span>
          </div>
          <div className="aas-subs">
            {visibleSubs.map((s) => {
              const open = openId === s.id;
              const graded = s.reviewStatus === 'graded';
              return (
                <article key={s.id} className={`apl-card aas-sub${graded ? ' is-done' : ''}`}>
                  <header>
                    <span className="aas-av">{(s.studentName || '?').trim().charAt(0)}</span>
                    <div><b>{s.studentName || 'طالب'}</b><small>{s.assignmentTitle || 'واجب'} · {getGradeLabel(s.grade) || ''}</small></div>
                    <span className={`aas-badge${graded ? ' is-ok' : ''}`}>{graded ? `${n(s.score)}/${n(s.maxScore)}` : 'مستني'}</span>
                  </header>
                  <small className="dim">اتسلّم {fmtDate(secs(s.submittedAt))}</small>
                  {s.answerText ? <p className="aas-ans">{s.answerText}</p> : null}
                  {s.answerImage ? <button type="button" className="aas-img" onClick={() => setPhoto(s.answerImage)}><img src={s.answerImage} alt="إجابة الطالب" loading="lazy" /><span><Icon name="eye" />كبّر</span></button> : null}
                  {graded && s.feedback && !open ? <p className="apl-note"><Icon name="message" />{s.feedback}</p> : null}
                  {open || !graded ? <GradeBox item={s} onSaved={() => setOpenId('')} /> : (
                    <button type="button" className="apl-btn" onClick={() => setOpenId(s.id)}><Icon name="edit" />عدّل التصحيح</button>
                  )}
                </article>
              );
            })}
          </div>
          {!visibleSubs.length && <div className="apl-empty"><Icon name="checkCircle" /><b>{subFilter === 'pending' ? 'مفيش حاجة مستنية تصحيح' : 'مفيش تسليمات'}</b><span>أول ما طالب يسلّم هيظهر هنا</span></div>}
        </>
      )}

      {photo && (
        <div className="apl-modal" role="dialog" aria-modal="true">
          <button type="button" className="apl-modal__scrim" aria-label="إغلاق" onClick={() => setPhoto('')} />
          <div className="aas-photo"><img src={photo} alt="إجابة الطالب" /><button type="button" className="apl-icon" onClick={() => setPhoto('')}><Icon name="close" /></button></div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsManager;
