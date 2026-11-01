// مركز الرسائل — رسالة تفضل في «رسائلي» عند الطالب + إشعار، لمين ما تحب (نفس نظام «مين يشوف ده؟»).
import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@services/firebase';
import { getGradeLabel } from '@shared/constants/grades.jsx';
import { platformNotify, platformConfirm } from '@shared/core/platformShared.jsx';
import { Icon } from '@v2/ui/Icon.jsx';
import AudiencePicker, { useStudentGroups } from '@admin/v2/AudiencePicker.jsx';
import { audienceStudents, audienceLabel, resolveAudience } from '@shared/audience/audience.js';
import { buildNotification } from '@shared/notifications/notify.js';
import '@styles/pages/admin-people.css';

const clean = (v) => String(v || '').trim();
const n = (x) => Number(x || 0).toLocaleString('ar-EG');
const when = (v) => {
  const d = v?.toDate ? v.toDate() : v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—';
};
const TEMPLATES = [
  { label: 'تذكير بامتحان', title: 'تذكير: امتحان قريب', body: 'عندك امتحان قريب، راجع الدروس كويس وادخل في ميعادك.' },
  { label: 'غياب', title: 'وحشتنا!', body: 'لاحظنا إنك مدخلتش المنصة من فترة، ارجع كمّل وماتسيبش حاجة تفوتك.' },
  { label: 'تهنئة', title: 'برافو عليك', body: 'مستواك في آخر امتحان ممتاز، كمّل كده.' },
];

export function AdminMessagingCenter({ users = [], userData }) {
  const groups = useStudentGroups();
  const [messages, setMessages] = useState([]);
  const [audience, setAudience] = useState({ mode: 'all' });
  const [form, setForm] = useState({ title: '', body: '', notify: true, priority: 'normal' });
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => onSnapshot(query(collection(db, 'student_messages'), orderBy('createdAt', 'desc'), limit(80)),
    (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((m) => m.kind !== 'support')),
    () => setMessages([])), []);

  const reach = useMemo(() => resolveAudience(audience, users, groups), [audience, users, groups]);
  const set = (p) => setForm((f) => ({ ...f, ...p }));

  const send = async (e) => {
    e.preventDefault();
    if (!clean(form.title) || !clean(form.body)) return platformNotify('اكتب العنوان والرسالة');
    const isAll = audience.mode === 'all';
    const ids = isAll ? [] : audienceStudents(audience, users, groups).map((u) => u.id || u.uid).filter(Boolean);
    if (!isAll && !ids.length) return platformNotify('مفيش طلبة في الاختيار ده');
    setBusy(true);
    try {
      await addDoc(collection(db, 'student_messages'), {
        title: clean(form.title), body: clean(form.body), priority: form.priority,
        audience: isAll ? 'all' : 'custom', audienceInfo: reach.audience, audienceKeys: reach.audienceKeys,
        userIds: ids.slice(0, 2000), groupIds: audience.mode === 'groups' ? audience.groupIds || [] : [],
        targetType: audience.mode, createdAt: serverTimestamp(), createdBy: userData?.email || 'admin', seenBy: [],
      });
      if (form.notify) {
        await addDoc(collection(db, 'notifications'), buildNotification({
          audienceKeys: reach.audienceKeys, audience: reach.audience, category: form.priority === 'high' ? 'warning' : 'general', priority: form.priority,
          title: clean(form.title), body: clean(form.body), createdBy: userData?.email || 'admin',
        })).catch(() => {});
      }
      set({ title: '', body: '' });
      platformNotify(`اتبعتت الرسالة لـ ${n(isAll ? reach.count : ids.length)} طالب`);
    } catch (err) { platformNotify('ماتبعتتش: ' + (err?.message || 'خطأ')); }
    setBusy(false);
  };

  const remove = async (m) => {
    if (!(await platformConfirm(`تمسح الرسالة «${m.title}» من عند الطلبة؟`))) return;
    deleteDoc(doc(db, 'student_messages', m.id)).catch((e) => platformNotify(e?.message || 'خطأ'));
  };

  const label = (m) => {
    if (m.audienceInfo) return audienceLabel({ audience: m.audienceInfo }, { gradeLabel: getGradeLabel, groups });
    if (m.audience === 'all') return 'كل الطلبة';
    if (m.audience === 'group') return `مجموعة: ${groups.find((g) => g.id === m.groupId)?.name || '—'}`;
    return (m.userIds || []).length === 1 ? (users.find((u) => (u.id || u.uid) === m.userIds[0])?.name || 'طالب واحد') : `${n((m.userIds || []).length)} طالب`;
  };
  const shown = messages.filter((m) => !q.trim() || `${m.title} ${m.body}`.includes(q.trim()));

  return (
    <div className="apl amc">
      <p className="apl-lead"><Icon name="info" />الرسالة بتفضل محفوظة في «رسائلي» عند الطالب، وبيوصله إشعار كمان. للإعلانات السريعة استخدم «الإشعارات».</p>
      <div className="amc-cols">
        <form className="apl-section amc-form" onSubmit={send}>
          <h3><Icon name="message" />رسالة جديدة</h3>
          <AudiencePicker title="لمين؟" value={audience} onChange={setAudience} users={users} groups={groups} compact />
          <div className="amc-tpl">{TEMPLATES.map((t) => <button key={t.label} type="button" className="apl-chip" onClick={() => set({ title: t.title, body: t.body })}><Icon name="spark" />{t.label}</button>)}</div>
          <label className="apl-field"><span>العنوان</span><input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="عنوان قصير وواضح" /></label>
          <label className="apl-field"><span>الرسالة</span><textarea rows={5} value={form.body} onChange={(e) => set({ body: e.target.value })} placeholder="اكتب رسالتك للطلبة" /></label>
          <div className="amc-row">
            <label className="aas-check"><input type="checkbox" checked={form.notify} onChange={(e) => set({ notify: e.target.checked })} /><span>ابعت إشعار كمان</span></label>
            <label className="aas-check"><input type="checkbox" checked={form.priority === 'high'} onChange={(e) => set({ priority: e.target.checked ? 'high' : 'normal' })} /><span>مهمة (تتعلّم بالأحمر)</span></label>
          </div>
          <button className="apl-btn apl-btn--pri apl-btn--block" disabled={busy}><Icon name="rocket" />{busy ? 'بيتبعت…' : `ابعت${reach.count ? ` لـ ${n(reach.count)} طالب` : ''}`}</button>
        </form>

        <section className="apl-section amc-log">
          <h3><Icon name="clock" />اللي اتبعت قبل كده <span className="apl-count">{n(messages.length)}</span></h3>
          <label className="apl-search"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر في الرسائل" /></label>
          <div className="amc-list">
            {shown.map((m) => (
              <article key={m.id} className={`amc-msg${m.priority === 'high' ? ' is-high' : ''}`}>
                <header><b>{m.title || 'رسالة'}</b><button type="button" className="apl-icon" title="مسح" onClick={() => remove(m)}><Icon name="close" /></button></header>
                <p>{m.body}</p>
                <footer><span className="apl-chip"><Icon name="users" />{label(m)}</span><small className="dim">{when(m.createdAt)}</small></footer>
              </article>
            ))}
            {!shown.length && <div className="apl-empty"><Icon name="message" />مفيش رسائل</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminMessagingCenter;
