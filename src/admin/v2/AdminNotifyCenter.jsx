// «ابعت إشعار»: إشعار واحد بيتحفظ مرة واحدة ويوصل للطلبة المختارين.
// - النوع (امتحان، تذكير، نتيجة، محاضرة، تهنئة…) بأيقونته، وقوالب جاهزة.
// - مين يوصله: كل الطلبة / صفوف / مجموعات / بالاسم، أو «ذكي»: اللي ما امتحنوش امتحان، اللي جابوا أقل من نسبة،
//   اللي ما دخلوش المنصة من كام يوم، اللي اشتراكهم قرّب يخلص، غير المشتركين.
// - يفتح امتحان أو درس لما الطالب يضغط عليه، مهم ولا عادي، دلوقتي ولا في ميعاد.
// - سجل الإشعارات اللي اتبعتت (والمجدولة) مع الحذف.
import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@services/firebase';
import { Icon } from '@v2/ui/Icon.jsx';
import { formatNumber } from '@v2/ui/kit.jsx';
import { getGradeLabel } from '@shared/constants/grades';
import { platformNotify, platformConfirm } from '@shared/core/platformShared.jsx';
import { NOTIFY_CATEGORIES, buildNotification } from '@shared/notifications/notify.js';
import { resolveAudience, audienceLabel, canStudentSee } from '@shared/audience/audience.js';
import AudiencePicker, { useStudentGroups } from './AudiencePicker.jsx';
import { useExamAttempts } from './AdminExamLive.jsx';
import '@styles/pages/admin-notify.css';

const TEMPLATES = [
  { category: 'exam', title: 'امتحان جديد نزل', body: 'الامتحان متاح دلوقتي على المنصة. ادخل امتحن قبل ما يقفل.' },
  { category: 'reminder', title: 'تذكير: الامتحان بكرة', body: 'جهّز نفسك وراجع الدروس. الامتحان بيفتح في ميعاده.' },
  { category: 'reminder', title: 'لسه ما امتحنتش!', body: 'الامتحان لسه مفتوح ومستنيك. ادخل امتحن قبل ما يقفل.' },
  { category: 'result', title: 'النتايج ظهرت', body: 'ادخل شوف درجتك ومراجعة إجاباتك والتصحيح.' },
  { category: 'content', title: 'محاضرة جديدة', body: 'محاضرة جديدة نزلت. اتفرج عليها وحل الامتحان بعدها.' },
  { category: 'congrats', title: 'مبروك يا بطل 👏', body: 'مستواك في الامتحان الأخير ممتاز. كمّل كده!' },
  { category: 'warning', title: 'محتاجين نشد حيلنا', body: 'درجتك في الامتحان الأخير محتاجة مراجعة. راجع بنك الأخطاء وحل تاني.' },
  { category: 'payment', title: 'اشتراكك قرّب يخلص', body: 'جدّد اشتراكك عشان المحاضرات والامتحانات ما تتقفلش.' },
];

const SMART = [
  { key: 'not_taken', label: 'ما امتحنوش امتحان', icon: 'exam', needsExam: true },
  { key: 'low_score', label: 'جابوا أقل من نسبة', icon: 'trend', needsExam: true },
  { key: 'top_score', label: 'جابوا أعلى من نسبة', icon: 'trophy', needsExam: true },
  { key: 'inactive', label: 'ما دخلوش المنصة من فترة', icon: 'clock' },
  { key: 'expiring', label: 'اشتراكهم قرّب يخلص', icon: 'wallet' },
  { key: 'free', label: 'مش مشتركين', icon: 'lock' },
];

const ms = (v) => (v?.toMillis ? v.toMillis() : v?.seconds ? v.seconds * 1000 : v ? new Date(v).getTime() || 0 : 0);
const pct = (r) => (Number.isFinite(Number(r?.percentage)) ? Number(r.percentage) : (r?.total ? Math.round(((r.score || 0) / r.total) * 100) : 0));
const sidOf = (r) => r?.studentId || r?.userId || r?.uid;

export default function AdminNotifyCenter({ ctx }) {
  const { activeUsersList = [], examsList = [], contentList = [], userData } = ctx;
  const students = useMemo(() => activeUsersList.filter((u) => (u.role || 'student') === 'student'), [activeUsersList]);
  const groups = useStudentGroups();
  const [f, setF] = useState({ category: 'announcement', title: '', body: '', priority: 'normal', linkKind: '', linkId: '', when: 'now', sendAt: '' });
  const set = (p) => setF((x) => ({ ...x, ...p }));
  const [aMode, setAMode] = useState('pick'); // pick | smart
  const [audience, setAudience] = useState({ mode: 'all', grades: [], groupIds: [], studentIds: [] });
  const [smart, setSmart] = useState({ rule: 'not_taken', examId: '', threshold: 50, days: 7 });
  const [sending, setSending] = useState(false);

  const smartExam = examsList.find((e) => e.id === smart.examId);
  const attempts = useExamAttempts(aMode === 'smart' && smartExam ? [smartExam.id, smartExam.originalExamId].filter(Boolean) : []);

  // الطلبة اللي هيوصلهم
  const target = useMemo(() => {
    if (aMode === 'pick') {
      const r = resolveAudience(audience, students, groups);
      return { ...r, label: audienceLabel({ audience: r.audience }, { gradeLabel: getGradeLabel, groups }) };
    }
    const now = Date.now();
    let list = [];
    const rule = SMART.find((x) => x.key === smart.rule);
    if (rule?.needsExam) {
      if (!smartExam) return { audienceKeys: [], count: 0, audience: null, label: 'اختار الامتحان', list: [] };
      const eligible = students.filter((u) => (smartExam.audienceKeys?.length ? canStudentSee(smartExam, { uid: u.id, grade: u.grade, email: u.email }) : (!smartExam.grade || smartExam.grade === 'all' || u.grade === smartExam.grade)));
      const best = new Map();
      attempts.forEach((r) => { const id = sidOf(r); if (!id) return; const prev = best.get(id); if (!prev || (r.status === 'completed' && pct(r) > pct(prev))) best.set(id, r); });
      if (smart.rule === 'not_taken') list = eligible.filter((u) => !best.has(u.id));
      if (smart.rule === 'low_score') list = eligible.filter((u) => best.get(u.id)?.status === 'completed' && pct(best.get(u.id)) < Number(smart.threshold));
      if (smart.rule === 'top_score') list = eligible.filter((u) => best.get(u.id)?.status === 'completed' && pct(best.get(u.id)) >= Number(smart.threshold));
    } else if (smart.rule === 'inactive') {
      const limitMs = Number(smart.days) * 864e5;
      list = students.filter((u) => { const t = ms(u.lastLoginAt || u.lastSeenAt || u.updatedAt); return !t || now - t > limitMs; });
    } else if (smart.rule === 'expiring') {
      list = students.filter((u) => { const t = ms(u.subscriptionExpiry); return u.subscriptionStatus === 'premium' && t && t - now < 3 * 864e5 && t > now - 864e5; });
    } else if (smart.rule === 'free') {
      list = students.filter((u) => u.subscriptionStatus !== 'premium');
    }
    const ids = list.map((u) => u.id || u.uid);
    const desc = rule?.needsExam ? `${rule.label}: «${smartExam?.title || ''}»${smart.rule !== 'not_taken' ? ` (${smart.threshold}٪)` : ''}` : rule?.label;
    return { audience: { mode: 'smart', rule: smart.rule, examId: smart.examId || null, studentIds: ids }, audienceKeys: ids.map((id) => `user:${id}`), count: ids.length, label: desc, list };
  }, [aMode, audience, students, groups, smart, smartExam, attempts]);

  const useTemplate = (t) => set({ category: t.category, title: t.title, body: t.body });
  const linkOptions = f.linkKind === 'exam' ? examsList : f.linkKind === 'content' ? contentList : [];

  const send = async () => {
    if (!f.title.trim()) return platformNotify('اكتب عنوان الإشعار.');
    if (!target.audienceKeys.length) return platformNotify('مفيش طلبة هيوصلهم الإشعار ده.');
    if (f.when === 'later' && (!f.sendAt || new Date(f.sendAt).getTime() < Date.now())) return platformNotify('اختار ميعاد في المستقبل.');
    if (target.count > 50 && !platformConfirm(`الإشعار هيوصل لـ ${target.count} طالب. تبعت؟`)) return;
    setSending(true);
    try {
      const n = buildNotification({
        audienceKeys: target.audienceKeys, audience: target.audience, category: f.category, priority: f.priority,
        title: f.title, body: f.body, link: f.linkKind && f.linkId ? { kind: f.linkKind, id: f.linkId } : null,
        sendAt: f.when === 'later' ? new Date(f.sendAt) : null, source: aMode === 'smart' ? `smart_${smart.rule}` : 'admin_manual', createdBy: userData?.email || '',
      });
      await addDoc(collection(db, 'notifications'), { ...n, audienceLabel: target.label, recipients: target.count });
      platformNotify(f.when === 'later' ? `الإشعار اتجدول وهيوصل لـ ${target.count} طالب في ميعاده.` : `الإشعار وصل لـ ${target.count} طالب.`);
      set({ title: '', body: '', linkKind: '', linkId: '', when: 'now', sendAt: '', priority: 'normal' });
    } catch (e) {
      platformNotify(`ما اتبعتش: ${e?.message || 'خطأ'}`);
    } finally { setSending(false); }
  };

  // السجل
  const [history, setHistory] = useState([]);
  useEffect(() => onSnapshot(query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(60)), (s) => setHistory(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setHistory([])), []);
  const remove = async (n) => { if (!platformConfirm(`حذف «${n.title || n.text}»؟ هيختفي من عند الطلبة.`)) return; await deleteDoc(doc(db, 'notifications', n.id)).catch(() => platformNotify('ما اتحذفش.')); };
  const cat = NOTIFY_CATEGORIES[f.category] || NOTIFY_CATEGORIES.general;

  return (
    <div className="anc" dir="rtl">
      <div className="anc-grid">
        <section className="anc-card anc-compose">
          <h3><Icon name="bell" />إشعار جديد</h3>

          <div className="anc-label">النوع</div>
          <div className="anc-cats">
            {Object.entries(NOTIFY_CATEGORIES).map(([k, c]) => (
              <button key={k} type="button" className={`t-${c.tone} ${f.category === k ? 'is-on' : ''}`} onClick={() => set({ category: k })}><Icon name={c.icon} />{c.label}</button>
            ))}
          </div>

          <details className="anc-templates">
            <summary><Icon name="spark" />قوالب جاهزة</summary>
            <div>{TEMPLATES.map((t, i) => <button key={i} type="button" onClick={() => useTemplate(t)}><b>{t.title}</b><small>{t.body}</small></button>)}</div>
          </details>

          <label className="anc-field"><span>العنوان</span><input value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="مثلًا: امتحان البلاغة الشهري بكرة" maxLength={120} /></label>
          <label className="anc-field"><span>التفاصيل</span><textarea value={f.body} onChange={(e) => set({ body: e.target.value })} placeholder="اكتب اللي الطالب محتاج يعرفه…" rows={3} maxLength={600} /></label>

          <div className="anc-row">
            <label className="anc-field"><span>لما الطالب يضغط عليه يفتح</span>
              <select value={f.linkKind} onChange={(e) => set({ linkKind: e.target.value, linkId: '' })}>
                <option value="">ولا حاجة</option><option value="exam">امتحان</option><option value="content">محاضرة / درس</option>
              </select>
            </label>
            {f.linkKind && (
              <label className="anc-field"><span>{f.linkKind === 'exam' ? 'الامتحان' : 'الدرس'}</span>
                <select value={f.linkId} onChange={(e) => set({ linkId: e.target.value })}><option value="">اختار</option>{linkOptions.slice(0, 200).map((x) => <option key={x.id} value={x.id}>{x.title || 'بدون اسم'}</option>)}</select>
              </label>
            )}
          </div>

          <div className="anc-row">
            <div className="anc-seg"><span>الأهمية</span><div>
              <button type="button" className={f.priority === 'normal' ? 'is-on' : ''} onClick={() => set({ priority: 'normal' })}>عادي</button>
              <button type="button" className={f.priority === 'high' ? 'is-on is-high' : ''} onClick={() => set({ priority: 'high' })}><Icon name="alert" />مهم</button>
            </div></div>
            <div className="anc-seg"><span>إمتى</span><div>
              <button type="button" className={f.when === 'now' ? 'is-on' : ''} onClick={() => set({ when: 'now' })}>دلوقتي</button>
              <button type="button" className={f.when === 'later' ? 'is-on' : ''} onClick={() => set({ when: 'later' })}><Icon name="calendar" />في ميعاد</button>
            </div></div>
          </div>
          {f.when === 'later' && <label className="anc-field"><span>الميعاد</span><input type="datetime-local" value={f.sendAt} onChange={(e) => set({ sendAt: e.target.value })} /></label>}

          <div className="anc-label">مين يوصله</div>
          <div className="anc-amodes">
            <button type="button" className={aMode === 'pick' ? 'is-on' : ''} onClick={() => setAMode('pick')}><Icon name="users" />اختيار</button>
            <button type="button" className={aMode === 'smart' ? 'is-on' : ''} onClick={() => setAMode('smart')}><Icon name="spark" />ذكي</button>
          </div>
          {aMode === 'pick' ? (
            <AudiencePicker title="الطلبة" value={audience} onChange={setAudience} users={students} groups={groups} compact />
          ) : (
            <div className="anc-smart">
              <div className="anc-smart__rules">
                {SMART.map((r) => <button key={r.key} type="button" className={smart.rule === r.key ? 'is-on' : ''} onClick={() => setSmart((s) => ({ ...s, rule: r.key }))}><Icon name={r.icon} />{r.label}</button>)}
              </div>
              {SMART.find((r) => r.key === smart.rule)?.needsExam && (
                <div className="anc-row">
                  <label className="anc-field"><span>الامتحان</span><select value={smart.examId} onChange={(e) => setSmart((s) => ({ ...s, examId: e.target.value }))}><option value="">اختار</option>{examsList.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select></label>
                  {smart.rule !== 'not_taken' && <label className="anc-field anc-field--s"><span>النسبة ٪</span><input type="number" min="0" max="100" value={smart.threshold} onChange={(e) => setSmart((s) => ({ ...s, threshold: e.target.value }))} /></label>}
                </div>
              )}
              {smart.rule === 'inactive' && <label className="anc-field anc-field--s"><span>من كام يوم</span><input type="number" min="1" value={smart.days} onChange={(e) => setSmart((s) => ({ ...s, days: e.target.value }))} /></label>}
              <div className="anc-smart__list">
                <b><Icon name="users" />{formatNumber(target.count)} طالب</b>
                <span>{(target.list || []).slice(0, 12).map((u) => u.name || u.email).join('، ')}{target.count > 12 ? ` و${formatNumber(target.count - 12)} كمان` : ''}</span>
              </div>
            </div>
          )}

          <button type="button" className="anc-send" onClick={send} disabled={sending || !f.title.trim() || !target.count}>
            <Icon name="rocket" />{sending ? 'بيتبعت…' : f.when === 'later' ? `جدول لـ ${formatNumber(target.count)} طالب` : `ابعت لـ ${formatNumber(target.count)} طالب`}
          </button>
        </section>

        <aside className="anc-side">
          <section className="anc-card">
            <h3><Icon name="eye" />هيظهر للطالب كده</h3>
            <div className={`anc-preview t-${cat.tone} ${f.priority === 'high' ? 'is-high' : ''}`}>
              <i><Icon name={cat.icon} /></i>
              <span>
                <span className="anc-preview__top"><em>{cat.label}</em>{f.priority === 'high' && <em className="is-high">مهم</em>}<small>دلوقتي</small></span>
                <b>{f.title || 'عنوان الإشعار'}</b>
                <p>{f.body || 'تفاصيل الإشعار هتظهر هنا.'}</p>
                {f.linkKind && f.linkId && <span className="anc-preview__go">{f.linkKind === 'exam' ? 'افتح الامتحان' : 'افتح الدرس'}<Icon name="chevronLeft" /></span>}
              </span>
            </div>
            <p className="anc-note"><Icon name="info" />الإشعار بيوصل للطالب جوه المنصة على طول، ولو المنصة مفتوحة بيطلعله تنبيه.</p>
          </section>

          <section className="anc-card anc-auto">
            <h3><Icon name="spark" />بيتبعت لوحده</h3>
            <ul>
              <li><Icon name="exam" />امتحان جديد اتنشر ← للطلبة اللي هيشوفوه</li>
              <li><Icon name="clock" />تذكير قبل الامتحان بساعة</li>
              <li><Icon name="trophy" />«المراجعة اتفتحت» بعد ما الامتحان يقفل</li>
              <li><Icon name="video" />محاضرة أو ملف جديد</li>
            </ul>
          </section>
        </aside>
      </div>

      <section className="anc-card">
        <h3><Icon name="fileText" />آخر الإشعارات</h3>
        {history.length === 0 && <p className="anc-note">لسه مفيش إشعارات.</p>}
        <div className="anc-history">
          {history.map((n) => {
            const c = NOTIFY_CATEGORIES[n.category] || NOTIFY_CATEGORIES.general;
            const at = ms(n.sendAt) || ms(n.createdAt);
            const scheduled = ms(n.sendAt) > Date.now();
            return (
              <div key={n.id} className={`anc-h t-${c.tone}`}>
                <i><Icon name={c.icon} /></i>
                <span className="anc-h__main">
                  <b>{n.title || n.text || 'إشعار'}</b>
                  <small>{n.audienceLabel || (n.audienceKeys ? audienceLabel({ audience: n.audienceInfo, grade: n.grade }, { gradeLabel: getGradeLabel, groups }) : (n.audience === 'all' || !n.audience ? 'كل الطلبة' : String(n.audience).startsWith('user:') ? 'طالب واحد' : getGradeLabel(n.audience)))}{n.recipients ? ` · ${formatNumber(n.recipients)} طالب` : ''}{n.source?.startsWith('auto') ? ' · تلقائي' : ''}</small>
                </span>
                {scheduled ? <em className="anc-h__sched"><Icon name="calendar" />مجدول</em> : n.priority === 'high' ? <em className="anc-h__high">مهم</em> : null}
                <small className="anc-h__time">{at ? new Date(at).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''}</small>
                <button type="button" onClick={() => remove(n)} aria-label="حذف"><Icon name="close" /></button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

