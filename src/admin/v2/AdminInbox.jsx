// جرس التنبيهات في لوحة الأدمن: كل حاجة مستنياك في مكان واحد، وبتتحدث لحظة بلحظة.
// طلبات انضمام · تغيير صف (موافقة/رفض من هنا) · تعديل بيانات · رسائل · كلمات سر · مدفوعات · امتحانات متوقفة.
// أول ما يوصل جديد: رسالة صغيرة فوق + صوت خفيف + إشعار على الجهاز (لو اتفعّل).
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '@services/firebase';
import { Icon } from '@v2/ui/Icon.jsx';
import { formatNumber } from '@v2/ui/kit.jsx';
import { getGradeLabel } from '@shared/constants/grades';
import { canAccessAdminTab } from '@config/adminPermissions';

const toMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (v.toMillis) return v.toMillis();
  if (v.seconds) return v.seconds * 1000;
  const d = new Date(v).getTime();
  return Number.isFinite(d) ? d : 0;
};
const ago = (ms) => {
  if (!ms) return '';
  const m = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (m < 1) return 'دلوقتي';
  if (m < 60) return `من ${formatNumber(m)} د`;
  const h = Math.round(m / 60);
  if (h < 24) return `من ${formatNumber(h)} س`;
  return new Date(ms).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
};

const KINDS = {
  join: { label: 'طلبات انضمام', icon: 'grade', tab: 'users', tone: 'gold' },
  grade: { label: 'طلبات تغيير الصف', icon: 'route', tab: 'all_users', tone: 'info' },
  profile: { label: 'تعديلات بيانات الطلاب', icon: 'edit', tab: 'all_users', tone: 'mute' },
  payment: { label: 'طلبات دفع', icon: 'wallet', tab: 'payments', tone: 'ok' },
  message: { label: 'رسائل مستنية رد', icon: 'message', tab: 'messages_center', tone: 'info' },
  reset: { label: 'طلبات كلمة سر', icon: 'key', tab: 'password_resets', tone: 'warn' },
  held: { label: 'امتحانات متوقفة', icon: 'shield', tab: 'exam_live', tone: 'bad' },
};
const ORDER = ['held', 'join', 'grade', 'payment', 'message', 'reset', 'profile'];
const DISMISS_KEY = 'nx-admin-inbox-dismissed';
const PROFILE_WINDOW = 14 * 864e5;

const readDismissed = () => { try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}'); } catch { return {}; } };
const writeDismissed = (v) => { try { localStorage.setItem(DISMISS_KEY, JSON.stringify(v)); } catch { /* ignore */ } };

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(880, ctx.currentTime); o.frequency.setValueAtTime(1175, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.36);
    setTimeout(() => ctx.close?.(), 600);
  } catch { /* ignore */ }
}

/** بيانات إضافية مش موجودة في لوحة الأدمن: طلبات الصف، آخر تعديلات البيانات، طلبات الدفع. */
function useInboxExtras() {
  const [gradeRequests, setGradeRequests] = useState([]);
  const [profileChanges, setProfileChanges] = useState([]);
  const [payments, setPayments] = useState([]);
  useEffect(() => {
    const map = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const off = [
      onSnapshot(query(collection(db, 'users'), where('gradeUpdateStatus', '==', 'pending'), limit(100)), (s) => setGradeRequests(map(s)), () => setGradeRequests([])),
      onSnapshot(query(collection(db, 'users'), orderBy('profileUpdatedAt', 'desc'), limit(30)), (s) => setProfileChanges(map(s)), () => setProfileChanges([])),
      onSnapshot(query(collection(db, 'payment_requests'), where('status', '==', 'pending'), limit(100)), (s) => setPayments(map(s)), () => setPayments([])),
    ];
    return () => off.forEach((u) => u?.());
  }, []);
  return { gradeRequests, profileChanges, payments };
}

export function useAdminInbox(ctx = {}, adminProfile) {
  const { gradeRequests, profileChanges, payments } = useInboxExtras();
  const [dismissed, setDismissed] = useState(readDismissed);
  const can = (tab) => !adminProfile || canAccessAdminTab(adminProfile, tab);

  const items = useMemo(() => {
    const out = [];
    const now = Date.now();
    (ctx.pendingUsers || []).forEach((u) => out.push({ id: `join:${u.id}`, kind: 'join', title: u.name || 'طالب جديد', sub: `${getGradeLabel(u.grade) || ''}${u.phone ? ` · ${u.phone}` : ''}`, at: toMs(u.createdAt) }));
    gradeRequests.forEach((u) => out.push({ id: `grade:${u.id}:${u.requestedGrade}`, kind: 'grade', title: u.name || 'طالب', sub: `${getGradeLabel(u.grade) || '—'} ← ${getGradeLabel(u.requestedGrade) || u.requestedGrade}`, at: toMs(u.profileUpdatedAt || u.updatedAt), user: u }));
    profileChanges.forEach((u) => {
      const at = toMs(u.profileUpdatedAt);
      const key = `profile:${u.id}:${at}`;
      if (!at || now - at > PROFILE_WINDOW || dismissed[key]) return;
      const c = u.profileChange || {};
      const parts = [];
      if (c.newPhone) parts.push(`الموبايل: ${c.oldPhone || '—'} ← ${c.newPhone}`);
      if (c.requestedGrade) parts.push(`طلب صف: ${getGradeLabel(c.requestedGrade)}`);
      out.push({ id: key, kind: 'profile', title: u.name || 'طالب', sub: parts.join(' · ') || 'عدّل بياناته', at, dismissable: true });
    });
    payments.forEach((p) => out.push({ id: `payment:${p.id}`, kind: 'payment', title: p.userName || p.studentName || p.name || 'طلب دفع', sub: `${p.amount ? `${formatNumber(p.amount)} ج` : ''}${p.method ? ` · ${p.method === 'instapay' ? 'InstaPay' : 'فودافون كاش'}` : ''}`, at: toMs(p.createdAt) }));
    (ctx.messagesList || []).filter((m) => ['open', 'pending', 'new'].includes(m.status || 'open') && !m.reply && !m.adminReply)
      .forEach((m) => out.push({ id: `message:${m.id}`, kind: 'message', title: m.studentName || m.userName || m.name || 'رسالة', sub: String(m.text || m.message || m.subject || '').slice(0, 80), at: toMs(m.createdAt) }));
    (ctx.passwordResetRequests || []).filter((r) => !r.status || r.status === 'pending')
      .forEach((r) => out.push({ id: `reset:${r.id}`, kind: 'reset', title: r.name || r.studentName || r.email || r.phone || 'طالب', sub: 'مش عارف يدخل حسابه', at: toMs(r.createdAt) }));
    (ctx.examResults || []).filter((r) => ['security_hold', 'cheated'].includes(r.status))
      .forEach((r) => out.push({ id: `held:${r.id}`, kind: 'held', title: r.studentName || 'طالب', sub: `${r.examTitle || 'امتحان'} · ${formatNumber(r.antiCheatWarnings || 0)} تنبيه أمان`, at: toMs(r.securityHoldAt || r.lastSavedAt) }));
    return out.filter((x) => can(KINDS[x.kind].tab)).sort((a, b) => b.at - a.at);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.pendingUsers, ctx.messagesList, ctx.passwordResetRequests, ctx.examResults, gradeRequests, profileChanges, payments, dismissed, adminProfile]);

  const dismiss = (id) => {
    const next = { ...readDismissed(), [id]: Date.now() };
    // ما نخليش الملف يكبر للأبد
    Object.keys(next).forEach((k) => { if (Date.now() - next[k] > PROFILE_WINDOW * 2) delete next[k]; });
    writeDismissed(next); setDismissed(next);
  };

  // التنبيه بالجديد: بعد أول تحميل، أي عنصر جديد يطلع رسالة + صوت + إشعار جهاز
  const known = useRef(null);
  useEffect(() => {
    const ids = new Set(items.map((x) => x.id));
    if (known.current === null) {
      const t = setTimeout(() => { known.current = new Set(items.map((x) => x.id)); }, 4000);
      return () => clearTimeout(t);
    }
    const fresh = items.filter((x) => !known.current.has(x.id));
    known.current = ids;
    if (fresh.length) {
      const first = fresh[0];
      const msg = fresh.length === 1 ? `${KINDS[first.kind].label}: ${first.title}` : `${formatNumber(fresh.length)} تنبيهات جديدة`;
      window.dispatchEvent(new CustomEvent('nahhas-toast', { detail: { message: `🔔 ${msg}`, type: 'info' } }));
      beep();
      try {
        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          new Notification('منصة النحاس', { body: `${KINDS[first.kind].label}: ${first.title}${first.sub ? ` — ${first.sub}` : ''}`, icon: '/icons/alnahhas-app-192-v4.png', tag: first.id });
        }
      } catch { /* ignore */ }
    }
    return undefined;
  }, [items]);

  return { items, dismiss, count: items.length };
}

export function AdminInboxButton({ inbox, onNavigate, ctx }) {
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'));
  const box = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onKey); };
  }, [open]);

  const groups = ORDER.map((k) => ({ k, list: inbox.items.filter((x) => x.kind === k) })).filter((g) => g.list.length);
  const go = (tab) => { setOpen(false); onNavigate(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const askPerm = async () => { try { setPerm(await Notification.requestPermission()); } catch { /* ignore */ } };

  return (
    <div className="adx-inbox" ref={box}>
      <button type="button" className={`adx-icon ${open ? 'is-on' : ''}`} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={`التنبيهات${inbox.count ? ` (${inbox.count})` : ''}`}>
        <Icon name="bell" />{inbox.count > 0 && <em>{formatNumber(Math.min(inbox.count, 99))}</em>}
      </button>
      {open && (
        <div className="adx-inbox__panel" role="dialog" aria-label="التنبيهات">
          <div className="adx-inbox__head">
            <b>التنبيهات</b>
            <small>{inbox.count ? `${formatNumber(inbox.count)} حاجة مستنياك` : 'كله تمام'}</small>
          </div>
          {perm === 'default' && (
            <button type="button" className="adx-inbox__perm" onClick={askPerm}><Icon name="bell" />فعّل التنبيهات على الجهاز ده عشان يوصلك أي جديد حتى لو الصفحة مش قدامك</button>
          )}
          <div className="adx-inbox__body">
            {groups.length === 0 && <p className="adx-inbox__empty"><Icon name="checkCircle" />مفيش حاجة مستنياك دلوقتي.</p>}
            {groups.map(({ k, list }) => (
              <section key={k} className={`adx-inbox__grp tone-${KINDS[k].tone}`}>
                <h4><i><Icon name={KINDS[k].icon} /></i>{KINDS[k].label}<span>{formatNumber(list.length)}</span><button type="button" onClick={() => go(KINDS[k].tab)}>الكل<Icon name="chevronLeft" /></button></h4>
                {list.slice(0, 4).map((x) => (
                  <div key={x.id} className="adx-inbox__item">
                    <button type="button" className="adx-inbox__main" onClick={() => go(KINDS[k].tab)}>
                      <b>{x.title}</b>
                      {x.sub && <small>{x.sub}</small>}
                    </button>
                    <span className="adx-inbox__side">
                      <small>{ago(x.at)}</small>
                      {k === 'grade' && ctx?.approveGrade && (
                        <span className="adx-inbox__acts">
                          <button type="button" className="is-ok" onClick={() => ctx.approveGrade(x.user)}><Icon name="check" />موافقة</button>
                          <button type="button" onClick={() => ctx.rejectGrade?.(x.user)}>رفض</button>
                        </span>
                      )}
                      {x.dismissable && <button type="button" className="adx-inbox__x" onClick={() => inbox.dismiss(x.id)} aria-label="تمام، شفته"><Icon name="check" /></button>}
                    </span>
                  </div>
                ))}
                {list.length > 4 && <button type="button" className="adx-inbox__more" onClick={() => go(KINDS[k].tab)}>و{formatNumber(list.length - 4)} كمان</button>}
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const AdminInboxContext = createContext(null);
export const useAdminInboxContext = () => useContext(AdminInboxContext);

/** صف «مستنياك دلوقتي» في الرئيسية: كل نوع بعدّاده، والضغط بيوديك للقسم. */
export function AdminInboxStrip({ onNavigate }) {
  const inbox = useAdminInboxContext();
  if (!inbox) return null;
  const groups = ORDER.map((k) => ({ k, list: inbox.items.filter((x) => x.kind === k) })).filter((g) => g.list.length);
  return (
    <section className="adx-waiting">
      <div className="adx-waiting__head"><h2>مستنياك دلوقتي</h2><small>{inbox.count ? `${formatNumber(inbox.count)} حاجة محتاجة ردك` : 'مفيش حاجة مستنياك. كله تمام ✓'}</small></div>
      {groups.length > 0 && (
        <div className="adx-waiting__grid">
          {groups.map(({ k, list }, i) => (
            <button key={k} type="button" className={`adx-waiting__card tone-${KINDS[k].tone}`} style={{ animationDelay: `${i * 0.05}s` }} onClick={() => { onNavigate(KINDS[k].tab); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <i><Icon name={KINDS[k].icon} /></i>
              <span><b>{formatNumber(list.length)}</b><small>{KINDS[k].label}</small></span>
              <em>{list[0]?.title}{list.length > 1 ? ` و${formatNumber(list.length - 1)} كمان` : ''}</em>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
