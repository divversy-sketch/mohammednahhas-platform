// مركز إشعارات الطالب:
// - «مستنياك»: تنبيهات ذكية المنصة بتحسبها لوحدها (امتحان مفتوح ما دخلتوش، امتحان قرّب، واجب، اشتراك قرّب يخلص).
// - الإشعارات: نوع كل إشعار بأيقونته ولونه، المهم فوق، مقروء/مش مقروء، والضغط بيفتح الحاجة نفسها.
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { Sheet } from '../ui/kit.jsx';
import { NOTIFY_CATEGORIES } from '@shared/notifications/notify.js';
import { arabicDateTime } from './insights.js';

const ms = (v) => (v?.toMillis ? v.toMillis() : v?.seconds ? v.seconds * 1000 : v ? new Date(v).getTime() || 0 : 0);
const ago = (t) => {
  if (!t) return '';
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'دلوقتي';
  if (m < 60) return `من ${m.toLocaleString('ar-EG')} د`;
  const h = Math.round(m / 60);
  if (h < 24) return `من ${h.toLocaleString('ar-EG')} س`;
  const d = Math.round(h / 24);
  return d < 7 ? `من ${d.toLocaleString('ar-EG')} يوم` : arabicDateTime(t);
};
const readKey = (uid) => `nx-notif-read-${uid || 'me'}`;
const loadRead = (uid) => { try { return new Set(JSON.parse(localStorage.getItem(readKey(uid)) || '[]')); } catch { return new Set(); } };
const saveRead = (uid, set) => { try { localStorage.setItem(readKey(uid), JSON.stringify([...set].slice(-400))); } catch { /* ignore */ } };
const idOf = (n) => n.id || `${n.title}-${ms(n.createdAt)}`;

/** عدد الإشعارات اللي لسه ما اتقرتش (للجرس) */
export function useUnreadNotifications(ctx) {
  const uid = ctx.user?.uid;
  const [tick, setTick] = useState(0);
  useEffect(() => { const on = () => setTick((t) => t + 1); window.addEventListener('nx-notif-read', on); return () => window.removeEventListener('nx-notif-read', on); }, []);
  return useMemo(() => { const r = loadRead(uid); return (ctx.notifications || []).filter((n) => !r.has(idOf(n))).length; }, [ctx.notifications, uid, tick]); // eslint-disable-line react-hooks/exhaustive-deps
}

function smartItems(ctx, buckets) {
  const out = [];
  const now = Date.now();
  if (ctx.inProgressExam) out.push({ key: 'resume', icon: 'play', tone: 'copper', title: `كمّل امتحان «${ctx.inProgressExam.title || 'الامتحان'}»`, sub: 'عندك محاولة لسه مفتوحة', go: 'exams:open' });
  (buckets?.open || []).filter((x) => !(x.attempts || []).length).slice(0, 3).forEach((x) => out.push({ key: `open-${x.exam.id}`, icon: 'exam', tone: 'bad', title: `«${x.exam.title || 'امتحان'}» مفتوح ولسه ما دخلتوش`, sub: x.end ? `بيقفل ${arabicDateTime(x.end)}` : 'متاح دلوقتي', go: 'exams:open' }));
  (buckets?.upcoming || []).filter((x) => x.start && x.start.getTime() - now < 24 * 3600e3).slice(0, 2).forEach((x) => out.push({ key: `soon-${x.exam.id}`, icon: 'clock', tone: 'warn', title: `«${x.exam.title || 'امتحان'}» قرّب`, sub: `بيفتح ${arabicDateTime(x.start)}`, go: 'exams:upcoming' }));
  const hw = (ctx.pendingAssignments || []).length;
  if (hw) out.push({ key: 'hw', icon: 'qr', tone: 'info', title: hw === 1 ? 'عندك واجب مطلوب' : `عندك ${hw.toLocaleString('ar-EG')} واجبات مطلوبة`, sub: 'خلّصها قبل آخر ميعاد', go: 'exams:homework' });
  if (ctx.isPremium && Number.isFinite(ctx.subscriptionDaysLeft) && ctx.subscriptionDaysLeft <= 3) out.push({ key: 'sub', icon: 'wallet', tone: 'gold', title: ctx.subscriptionDaysLeft <= 0 ? 'اشتراكك بيخلص النهاردة' : `اشتراكك هيخلص بعد ${ctx.subscriptionDaysLeft.toLocaleString('ar-EG')} يوم`, sub: 'جدّده عشان المحاضرات ما تتقفلش', go: 'account:billing' });
  return out;
}

export function NotificationCenter({ ctx, open, onClose, go, onOpenRow, buckets }) {
  const uid = ctx.user?.uid;
  const [read, setRead] = useState(() => loadRead(uid));
  const [tab, setTab] = useState('all');
  useEffect(() => { if (open) setRead(loadRead(uid)); }, [open, uid]);
  const list = useMemo(() => {
    const all = [...(ctx.notifications || [])];
    return all.sort((a, b) => ((b.priority === 'high') - (a.priority === 'high')) || (ms(b.sendAt || b.createdAt) - ms(a.sendAt || a.createdAt)));
  }, [ctx.notifications]);
  const unread = list.filter((n) => !read.has(idOf(n)));
  const shown = tab === 'unread' ? unread : list;
  const smart = useMemo(() => smartItems(ctx, buckets), [ctx, buckets]);

  const markRead = (ids) => { const next = new Set(read); ids.forEach((id) => next.add(id)); setRead(next); saveRead(uid, next); window.dispatchEvent(new Event('nx-notif-read')); };
  const openLink = (n) => {
    markRead([idOf(n)]);
    const l = n.link;
    if (!l) return;
    onClose();
    if (l.kind === 'exam') {
      const done = (buckets?.done || []).some((x) => x.exam.id === l.id);
      const upcoming = (buckets?.upcoming || []).some((x) => x.exam.id === l.id);
      go(done || n.category === 'result' ? 'exams:done' : upcoming ? 'exams:upcoming' : 'exams:open');
    } else if (l.kind === 'homework') {
      go('exams:homework');
    } else if (l.kind === 'content') {
      const pools = [['video', ctx.videos], ['html', ctx.htmls], ['html', ctx.interactiveExams], ['file', ctx.filesAndLinks]];
      for (const [kind, arr] of pools) {
        const item = (arr || []).find((x) => x.id === l.id);
        if (item) { onOpenRow?.({ kind, item }); return; }
      }
      go('learn');
    } else if (l.kind === 'route' && l.to) go(l.to);
    else if (l.kind === 'url' && l.url) window.open(l.url, '_blank', 'noopener');
  };

  return (
    <Sheet open={open} onClose={onClose} title="الإشعارات" className="nxn">
      <div className="nxn-wrap">
        {smart.length > 0 && (
          <section className="nxn-smart">
            <h4><Icon name="spark" />مستنياك</h4>
            {smart.map((s) => (
              <button key={s.key} type="button" className={`nxn-smart__item t-${s.tone}`} onClick={() => { onClose(); go(s.go); }}>
                <i><Icon name={s.icon} /></i><span><b>{s.title}</b><small>{s.sub}</small></span><Icon name="chevronLeft" />
              </button>
            ))}
          </section>
        )}

        <div className="nxn-bar">
          <div className="nxn-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'all'} className={tab === 'all' ? 'is-on' : ''} onClick={() => setTab('all')}>الكل</button>
            <button type="button" role="tab" aria-selected={tab === 'unread'} className={tab === 'unread' ? 'is-on' : ''} onClick={() => setTab('unread')}>مش مقروءة{unread.length ? <b>{unread.length.toLocaleString('ar-EG')}</b> : null}</button>
          </div>
          {unread.length > 0 && <button type="button" className="nxn-readall" onClick={() => markRead(unread.map(idOf))}><Icon name="check" />علّم الكل مقروء</button>}
        </div>

        {shown.length === 0 ? (
          <div className="nxn-empty"><Icon name="bell" /><b>{tab === 'unread' ? 'قريت كل حاجة' : 'مفيش إشعارات'}</b><small>أول ما المستر يبعت حاجة جديدة هتلاقيها هنا.</small></div>
        ) : (
          <div className="nxn-list">
            {shown.map((n) => {
              const c = NOTIFY_CATEGORIES[n.category] || NOTIFY_CATEGORIES[n.source?.includes('exam') ? 'exam' : 'general'];
              const isRead = read.has(idOf(n));
              return (
                <button key={idOf(n)} type="button" className={`nxn-item t-${c.tone} ${isRead ? '' : 'is-new'} ${n.priority === 'high' ? 'is-high' : ''}`} onClick={() => openLink(n)}>
                  <i><Icon name={c.icon} /></i>
                  <span className="nxn-item__main">
                    <span className="nxn-item__top"><em>{c.label}</em>{n.priority === 'high' && <em className="is-high">مهم</em>}<small>{ago(ms(n.sendAt || n.createdAt))}</small></span>
                    <b>{n.title || 'تنبيه جديد'}</b>
                    {(n.body || n.text || n.message) && (n.body || n.text || n.message) !== n.title && <p>{n.body || n.text || n.message}</p>}
                    {n.link && <span className="nxn-item__go">{n.link.kind === 'exam' ? 'افتح الامتحان' : n.link.kind === 'content' ? 'افتح الدرس' : n.link.kind === 'homework' ? 'افتح الواجب' : 'افتح'}<Icon name="chevronLeft" /></span>}
                  </span>
                  {!isRead && <span className="nxn-dot" aria-label="جديد" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Sheet>
  );
}

export default NotificationCenter;
