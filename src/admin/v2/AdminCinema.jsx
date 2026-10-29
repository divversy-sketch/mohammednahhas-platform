// «السينما» for the admin: top navigation with mega menus, a moving poster on the dashboard,
// a banner on every section, animated numbers, and a Ctrl/⌘ K jump-to-section palette.
import { useEffect, useMemo, useRef, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@services/firebase';
import { GradeOptions } from '@shared/constants/grades';
import { Icon } from '@v2/ui/Icon.jsx';
import { CountUp, formatNumber } from '@v2/ui/kit.jsx';
import { BrandMark } from '@v2/ui/Brand.jsx';
import { HeroCarousel, HERO_ART, ART } from '@v2/student/cinema.jsx';
import { usePrefs } from '@v2/prefs.js';
import { canAccessAdminTab, ADMIN_TABS } from '@config/adminPermissions';
import { getAdminPageMeta } from './adminPageMeta.js';
import { liveState } from './AdminExamLive.jsx';
import { AdminInboxButton } from './AdminInbox.jsx';

/* ── sections ── */
export const ADMIN_GROUPS = [
  { key: 'home', title: 'القيادة', icon: 'chart', tabs: ['dashboard', 'follow_up'] },
  { key: 'students', title: 'الطلاب', icon: 'users', tabs: ['users', 'all_users', 'student_groups', 'parent_portal', 'password_resets'] },
  { key: 'teach', title: 'التعليم', icon: 'book', tabs: ['courses', 'content', 'assignments', 'smart_hw'] },
  { key: 'exams', title: 'الاختبارات', icon: 'exam', tabs: ['exam_live', 'exams', 'question_bank', 'smart_teacher', 'smart_exam_engine', 'mistakes_admin', 'student_reports'] },
  { key: 'money', title: 'الماليات', icon: 'wallet', tabs: ['payments', 'subscriptions_legacy', 'finance_dashboard'] },
  { key: 'talk', title: 'التواصل', icon: 'message', tabs: ['messages_center', 'notifications_admin'] },
  { key: 'system', title: 'النظام', icon: 'settings', tabs: ['security_center', 'video_security', 'admin_roles', 'audit_logs', 'platform_settings', 'app_convert'] },
];

export const ADMIN_TAB_ICON = {
  dashboard: 'chart', follow_up: 'target', users: 'grade', all_users: 'users', password_resets: 'key',
  payments: 'wallet', subscriptions_legacy: 'ticket', finance_dashboard: 'trend', courses: 'book', content: 'layers',
  exam_live: 'live', exams: 'exam', question_bank: 'fileText', smart_teacher: 'spark', parent_portal: 'user', smart_exam_engine: 'rocket', assignments: 'file', smart_hw: 'qr',
  mistakes_admin: 'mistake', student_reports: 'trophy', student_groups: 'users', messages_center: 'message',
  notifications_admin: 'bell', security_center: 'shield', video_security: 'lock', app_convert: 'phone',
  admin_roles: 'key', audit_logs: 'fileText', platform_settings: 'settings',
};

export const tabLabel = (tab) => ADMIN_TABS.find(([key]) => key === tab)?.[1] || getAdminPageMeta(tab)?.title || tab;

export function useAdminGroups(adminProfile) {
  return useMemo(() => {
    const visible = new Set(ADMIN_TABS.filter(([tab]) => canAccessAdminTab(adminProfile, tab)).map(([tab]) => tab));
    const used = new Set();
    const groups = ADMIN_GROUPS.map((g) => {
      const tabs = g.tabs.filter((t) => visible.has(t));
      tabs.forEach((t) => used.add(t));
      return { ...g, tabs };
    }).filter((g) => g.tabs.length);
    const rest = [...visible].filter((t) => !used.has(t));
    if (rest.length) groups.push({ key: 'more', title: 'أخرى', icon: 'layers', tabs: rest });
    return groups;
  }, [adminProfile]);
}

export const groupOf = (tab) => ADMIN_GROUPS.find((g) => g.tabs.includes(tab)) || ADMIN_GROUPS[0];

function useScrolled(threshold = 40) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let frame = 0;
    const on = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => setScrolled(window.scrollY > threshold)); };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', on); };
  }, [threshold]);
  return scrolled;
}

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');

/* ── top navigation ── */
export function AdminCinemaNav({ activeTab, onNavigate, groups, adminProfile, grade, setGrade, alerts = 0, onSearch, onMenu, inbox, ctx }) {
  const scrolled = useScrolled();
  const { theme, toggleTheme } = usePrefs();
  const [open, setOpen] = useState(null);
  const [me, setMe] = useState(false);
  const closeTimer = useRef(0);
  const current = groupOf(activeTab);
  const over = !scrolled;
  const name = adminProfile?.name || adminProfile?.email || 'مدير المنصة';

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(null); setMe(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const hover = (key) => { window.clearTimeout(closeTimer.current); setOpen(key); };
  const leave = () => { closeTimer.current = window.setTimeout(() => setOpen(null), 160); };
  const go = (tab) => { setOpen(null); setMe(false); onNavigate(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <header className={`adx-nav ${over ? 'is-over' : ''}`} onMouseLeave={leave}>
      <button type="button" className="adx-nav__menu" onClick={onMenu} aria-label="كل الأقسام"><Icon name="menu" /></button>
      <button type="button" className="adx-brand" onClick={() => go('dashboard')} aria-label="مركز القيادة">
        <BrandMark size={36} /><span><b>النحاس</b><small>لوحة الإدارة</small></span>
      </button>
      <nav className="adx-links" aria-label="أقسام الإدارة">
        {groups.map((g) => (
          <div key={g.key} className="adx-links__item" onMouseEnter={() => hover(g.key)}>
            <button type="button" aria-expanded={open === g.key} aria-current={current.key === g.key ? 'page' : undefined}
              onClick={() => (g.tabs.length === 1 ? go(g.tabs[0]) : setOpen(open === g.key ? null : g.key))}>
              {g.title}{g.tabs.length > 1 && <Icon name="chevronDown" />}
            </button>
            {open === g.key && g.tabs.length > 1 && (
              <div className="adx-mega" role="menu" onMouseEnter={() => hover(g.key)}>
                <div className="adx-mega__head" style={{ background: HERO_ART[groups.indexOf(g) % HERO_ART.length] }}>
                  <Icon name={g.icon} /><b>{g.title}</b><small>{g.tabs.length} أقسام</small>
                </div>
                <div className="adx-mega__list">
                  {g.tabs.map((t, i) => (
                    <button key={t} type="button" role="menuitem" className={activeTab === t ? 'is-on' : ''} style={{ animationDelay: `${i * 0.035}s` }} onClick={() => go(t)}>
                      <i><Icon name={ADMIN_TAB_ICON[t] || 'layers'} /></i>
                      <span><b>{tabLabel(t)}</b><small>{getAdminPageMeta(t)?.description}</small></span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>
      <span className="adx-sp" />
      <button type="button" className="adx-search" onClick={onSearch} aria-label="انتقل لأي قسم"><Icon name="search" /><span>انتقل لقسم</span><kbd>{isMac() ? '⌘' : 'Ctrl'} K</kbd></button>
      <label className="adx-grade" title="فلترة المرحلة">
        <Icon name="grade" />
        <select value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="فلترة المرحلة الدراسية">
          <option value="all">كل المراحل</option>
          <GradeOptions />
        </select>
      </label>
      <button type="button" className="adx-icon" onClick={toggleTheme} aria-label={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'} title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>
      {inbox ? <AdminInboxButton inbox={inbox} onNavigate={go} ctx={ctx} /> : (
        <button type="button" className="adx-icon" onClick={() => go('dashboard')} aria-label="التنبيهات">
          <Icon name="bell" />{alerts > 0 && <em>{formatNumber(Math.min(alerts, 99))}</em>}
        </button>
      )}
      <div className="adx-me">
        <button type="button" className="adx-me__btn" onClick={() => setMe((v) => !v)} aria-expanded={me} aria-label="الحساب">
          <span className="adx-avatar">{String(name).trim().replace(/^أ\.\s*/, '').charAt(0)}</span>
        </button>
        {me && (
          <div className="adx-me__menu" role="menu">
            <div><b>{name}</b><small>{adminProfile?.adminRoleLabel || 'إدارة المنصة'}</small></div>
            <button type="button" role="menuitem" onClick={() => go('platform_settings')}><Icon name="settings" />إعدادات المنصة</button>
            <button type="button" role="menuitem" className="is-danger" onClick={() => signOut(auth)}><Icon name="logout" />تسجيل الخروج</button>
          </div>
        )}
      </div>
    </header>
  );
}

/* ── all sections (phone / tablet menu) ── */
export function AdminSectionsSheet({ open, onClose, groups, activeTab, onNavigate }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="adx-sheet" role="dialog" aria-modal="true" aria-label="كل الأقسام">
      <button type="button" className="adx-sheet__scrim" aria-label="إغلاق" onClick={onClose} />
      <div className="adx-sheet__panel">
        <div className="adx-sheet__head"><BrandMark size={34} /><b>كل الأقسام</b><span className="adx-sp" /><button type="button" className="adx-icon" onClick={onClose} aria-label="إغلاق"><Icon name="close" /></button></div>
        <div className="adx-sheet__body">
          {groups.map((g, gi) => (
            <section key={g.key} style={{ animationDelay: `${gi * 0.05}s` }}>
              <h3><Icon name={g.icon} />{g.title}</h3>
              <div>
                {g.tabs.map((t) => (
                  <button key={t} type="button" className={activeTab === t ? 'is-on' : ''} onClick={() => { onNavigate(t); onClose(); }}>
                    <i style={{ background: ART[(gi + g.tabs.indexOf(t)) % ART.length] }}><Icon name={ADMIN_TAB_ICON[t] || 'layers'} /></i>
                    <span>{tabLabel(t)}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          <button type="button" className="adx-sheet__out" onClick={() => signOut(auth)}><Icon name="logout" />تسجيل الخروج</button>
        </div>
      </div>
    </div>
  );
}

/* ── Ctrl/⌘ K ── */
export function AdminPalette({ open, onClose, groups, onNavigate }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef(null);
  const items = useMemo(() => {
    const all = groups.flatMap((g) => g.tabs.map((t) => ({ t, g, label: tabLabel(t), desc: getAdminPageMeta(t)?.description || '' })));
    const n = q.trim();
    return n ? all.filter((x) => `${x.label} ${x.g.title} ${x.desc}`.includes(n)) : all;
  }, [groups, q]);
  useEffect(() => { if (open) { setQ(''); setSel(0); window.setTimeout(() => input.current?.focus(), 30); } }, [open]);
  useEffect(() => { setSel(0); }, [q]);
  if (!open) return null;
  const pick = (x) => { if (!x) return; onNavigate(x.t); onClose(); window.scrollTo({ top: 0 }); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((v) => Math.min(items.length - 1, v + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((v) => Math.max(0, v - 1)); }
    else if (e.key === 'Enter') pick(items[sel]);
    else if (e.key === 'Escape') onClose();
  };
  return (
    <div className="adx-pal" role="dialog" aria-modal="true" aria-label="انتقل لقسم">
      <button type="button" className="adx-sheet__scrim" aria-label="إغلاق" onClick={onClose} />
      <div className="adx-pal__box">
        <label className="adx-pal__in"><Icon name="search" /><input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="اكتب اسم القسم… طلاب، امتحانات، مدفوعات" /><kbd>Esc</kbd></label>
        <div className="adx-pal__list" role="listbox">
          {items.length === 0 && <p className="adx-pal__none">مفيش قسم بالاسم ده</p>}
          {items.map((x, i) => (
            <button key={x.t} type="button" role="option" aria-selected={i === sel} onMouseEnter={() => setSel(i)} onClick={() => pick(x)}>
              <i><Icon name={ADMIN_TAB_ICON[x.t] || 'layers'} /></i>
              <span><b>{x.label}</b><small>{x.g.title} · {x.desc}</small></span>
              <Icon name="chevronLeft" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── numbers & pulse ── */
const toDate = (v) => { const d = v?.toDate ? v.toDate() : v ? new Date(v?.seconds ? v.seconds * 1000 : v) : null; return d && !Number.isNaN(d.getTime()) ? d : null; };

export function computeAdminPulse(data = {}) {
  const now = Date.now();
  const users = data.activeUsersList || [];
  const exams = data.examsList || [];
  const results = data.examResults || [];
  const running = exams.filter((e) => { const s = toDate(e.startTime); const en = toDate(e.endTime); return s && en && s.getTime() <= now && en.getTime() >= now; });
  const held = results.filter((r) => ['security_hold', 'cheated'].includes(r.status));
  const tickets = (data.messagesList || []).filter((m) => ['open', 'pending', 'new'].includes(m.status || 'open') && !m.reply && !m.adminReply);
  const done = results.filter((r) => r.status === 'completed' || r.percentage != null);
  const avg = done.length ? Math.round(done.reduce((s, r) => s + Number(r.percentage || 0), 0) / done.length) : 0;
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * 864e5); d.setHours(0, 0, 0, 0);
    return { t: d.getTime(), n: 0 };
  });
  results.forEach((r) => {
    const d = toDate(r.submittedAt || r.createdAt); if (!d) return;
    const k = days.findIndex((x, i) => d.getTime() >= x.t && (i === days.length - 1 || d.getTime() < days[i + 1].t));
    if (k >= 0) days[k].n += 1;
  });
  const states = results.map((r) => liveState(r, now));
  const liveNow = states.filter((x) => x === 'live').length;
  const leftNow = states.filter((x) => x === 'left').length;
  return {
    liveNow, leftNow,
    students: users.length,
    premium: users.filter((u) => u.subscriptionStatus === 'premium').length,
    exams: exams.length,
    content: (data.contentList || []).length,
    pending: (data.pendingUsers || []).length,
    resets: (data.passwordResetRequests || []).length,
    running, held: held.length, tickets: tickets.length, avg, attempts: done.length, days,
    alerts: (data.pendingUsers || []).length + (data.passwordResetRequests || []).length + held.length + tickets.length,
  };
}

function PulseChart({ days }) {
  const w = 640; const h = 170; const max = Math.max(1, ...days.map((d) => d.n));
  const pts = days.map((d, i) => [(i / (days.length - 1)) * w, h - 14 - (d.n / max) * (h - 40)]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${(w - x).toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L0,${h} L${w},${h} Z`;
  const total = days.reduce((s, d) => s + d.n, 0);
  return (
    <div className="adx-chart">
      <div className="adx-chart__head"><h3>حركة الامتحانات</h3><small>آخر ١٤ يوم · {formatNumber(total)} تسليم</small></div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="adxArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--nx-copper)" stopOpacity=".42" /><stop offset="1" stopColor="var(--nx-copper)" stopOpacity="0" /></linearGradient></defs>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} className="adx-chart__grid" />)}
        <path d={area} fill="url(#adxArea)" className="adx-chart__area" />
        <path d={line} className="adx-chart__line" pathLength="1" />
        {pts.map(([x, y], i) => days[i].n > 0 && <circle key={i} cx={w - x} cy={y} r="4" className="adx-chart__dot" style={{ animationDelay: `${0.9 + i * 0.04}s` }} />)}
      </svg>
      {total === 0 && <p className="adx-chart__empty">أول ما الطلاب يسلّموا امتحانات هتشوف حركتهم هنا</p>}
      <div className="adx-chart__days">{days.filter((_, i) => i % 2 === 1).map((d) => <span key={d.t}>{new Date(d.t).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>)}</div>
    </div>
  );
}

const QUICK = [
  { tab: 'exam_live', icon: 'live', title: 'مراقبة لايف', sub: 'مين بيمتحن دلوقتي' },
  { tab: 'exams', icon: 'exam', title: 'امتحان جديد', sub: 'أنشئ وحدد الوقت' },
  { tab: 'content', icon: 'video', title: 'ارفع محاضرة', sub: 'فيديو أو ملف' },
  { tab: 'users', icon: 'grade', title: 'طلبات الانضمام', sub: 'قبول ورفض' },
  { tab: 'payments', icon: 'wallet', title: 'المدفوعات', sub: 'فعّل الاشتراكات' },
  { tab: 'question_bank', icon: 'fileText', title: 'بنك الأسئلة', sub: 'رتّب أسئلتك' },
  { tab: 'notifications_admin', icon: 'bell', title: 'ابعت إشعار', sub: 'لكل الطلاب أو دفعة' },
  { tab: 'student_reports', icon: 'trophy', title: 'تقارير الطلاب', sub: 'مستوى كل طالب' },
  { tab: 'messages_center', icon: 'message', title: 'رسائل الدعم', sub: 'رد على الطلاب' },
];

/* ── banner on top of every admin section ── */
export function AdminCinemaHero({ activeTab, onNavigate, pulse, adminName, canOpen = () => true }) {
  const first = String(adminName || '').replace(/^أ\.\s*/, '').trim().split(/\s+/)[0] || '';
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'صباح الخير' : hour < 18 ? 'نهارك سعيد' : 'مساء الخير';

  if (activeTab !== 'dashboard') {
    const meta = getAdminPageMeta(activeTab) || {};
    const g = groupOf(activeTab);
    const idx = Math.max(0, ADMIN_GROUPS.indexOf(g));
    return (
      <section className="adx-phero" key={activeTab}>
        <span className="adx-phero__art" style={{ background: HERO_ART[idx % HERO_ART.length] }} />
        <span className="adx-phero__glyph" aria-hidden="true"><Icon name={ADMIN_TAB_ICON[activeTab] || g.icon} /></span>
        {[18, 44, 70].map((l, j) => <i key={j} className="cx-spark" style={{ left: `${l}%`, animationDelay: `${j * 1.3}s` }} />)}
        <div className="adx-phero__body">
          <span className="cx-kicker"><Icon name={g.icon} />{meta.eyebrow && meta.eyebrow !== g.title ? `${g.title} · ${meta.eyebrow}` : g.title}</span>
          <h1>{meta.title || tabLabel(activeTab)}</h1>
          {meta.description && <p>{meta.description}</p>}
        </div>
        {g.tabs.filter(canOpen).length > 1 && (
          <nav className="adx-siblings" aria-label={`أقسام ${g.title}`} ref={(el) => { const cur = el?.querySelector('[aria-current]'); if (cur && el.scrollWidth > el.clientWidth) el.scrollLeft += cur.getBoundingClientRect().left - el.getBoundingClientRect().left - (el.clientWidth - cur.clientWidth) / 2; }}>
            {g.tabs.filter(canOpen).map((t) => (
              <button key={t} type="button" aria-current={t === activeTab ? 'page' : undefined} onClick={() => onNavigate(t)}>
                <Icon name={ADMIN_TAB_ICON[t] || 'layers'} />{tabLabel(t)}
              </button>
            ))}
          </nav>
        )}
      </section>
    );
  }

  const p = pulse;
  const slides = [];
  if (p.pending > 0 && canOpen('users')) slides.push({ key: 'pending', icon: 'grade', kicker: 'مستني ردك', glyph: '«', title: p.pending === 1 ? 'طالب جديد طالب ينضم للمنصة' : `${formatNumber(p.pending)} طلبات انضمام جديدة`, meta: 'راجع البيانات واقبل أو ارفض بضغطة.', cta: 'راجع الطلبات', ctaIcon: 'arrowLeft', action: () => onNavigate('users') });
  if ((p.running.length > 0 || p.liveNow > 0) && canOpen('exams')) slides.unshift({ key: 'running', icon: 'live', kicker: 'لايف دلوقتي', glyph: '«', title: p.liveNow ? `${formatNumber(p.liveNow)} طالب بيمتحن دلوقتي` : p.running.length === 1 ? `«${p.running[0].title || 'امتحان'}» مفتوح للطلاب` : `${formatNumber(p.running.length)} امتحانات مفتوحة دلوقتي`, meta: p.leftNow ? `و${formatNumber(p.leftNow)} خرجوا من الامتحان قبل ما يسلّموا. قرّر تسمح لهم يكمّلوا ولا لأ.` : 'شوف مين بيمتحن ومين سلّم ومين لسه ما دخلش، لحظة بلحظة.', cta: 'مراقبة لايف', ctaIcon: 'arrowLeft', action: () => onNavigate('exam_live') });
  if (p.tickets > 0 && canOpen('messages_center')) slides.push({ key: 'tickets', icon: 'message', kicker: 'رسائل الطلاب', glyph: '«', title: `${formatNumber(p.tickets)} رسالة مستنية رد`, meta: 'الطالب اللي بيترد عليه بسرعة بيكمّل.', cta: 'افتح الرسائل', ctaIcon: 'arrowLeft', action: () => onNavigate('messages_center') });
  if (p.held > 0 && canOpen('security_center')) slides.push({ key: 'held', icon: 'shield', kicker: 'الحماية', glyph: '«', title: `${formatNumber(p.held)} محاولة امتحان متوقفة للمراجعة`, meta: 'قرّر تكمّل للطالب ولا تعيد له الامتحان.', cta: 'مركز الحماية', ctaIcon: 'arrowLeft', action: () => onNavigate('security_center') });
  if (p.resets > 0 && canOpen('password_resets')) slides.push({ key: 'resets', icon: 'key', kicker: 'الدخول', glyph: '«', title: `${formatNumber(p.resets)} طلب تغيير كلمة سر`, meta: 'طلاب مش عارفين يدخلوا ومستنيينك.', cta: 'شوف الطلبات', ctaIcon: 'arrowLeft', action: () => onNavigate('password_resets') });
  slides.push({ key: 'studio', icon: 'video', kicker: 'استوديو المستر', glyph: '«', title: p.content ? `${formatNumber(p.content)} محاضرة وملف على المنصة` : 'ارفع أول محاضرة للطلاب', meta: `${formatNumber(p.students)} طالب · ${formatNumber(p.premium)} مشترك VIP`, cta: 'ارفع محاضرة', ctaIcon: 'plus', action: () => onNavigate('content'), secondary: { icon: 'exam', label: 'امتحان جديد', action: () => onNavigate('exams') } });

  const stats = [
    { icon: 'users', label: 'الطلاب', value: p.students, sub: `${formatNumber(p.premium)} VIP`, tab: 'all_users' },
    { icon: 'live', label: 'بيمتحنوا دلوقتي', value: p.liveNow, sub: p.leftNow ? `${formatNumber(p.leftNow)} خرجوا قبل التسليم` : p.running.length ? `${formatNumber(p.running.length)} امتحان مفتوح` : 'مفيش امتحان مفتوح', tab: 'exam_live', hot: p.leftNow > 0 },
    { icon: 'target', label: 'متوسط الدرجات', value: p.avg, suffix: '٪', sub: `من ${formatNumber(p.attempts)} تسليم`, tab: 'student_reports' },
    { icon: 'bell', label: 'محتاج متابعة', value: p.alerts, sub: p.alerts ? 'طلبات ورسائل مستنية' : 'كله تمام', tab: 'follow_up', hot: p.alerts > 0 },
  ];

  return (
    <div className="adx-home">
      <HeroCarousel slides={slides} interval={6500} hello={<><b>{hello}{first ? `، ${first}` : ''}</b><span>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</span></>} />
      <div className="cx-stats adx-stats">
        {stats.map((s, i) => (
          <button key={s.label} type="button" className={`cx-stat ${s.hot ? 'is-hot' : ''}`} style={{ animationDelay: `${0.15 + i * 0.08}s` }} onClick={() => onNavigate(s.tab)}>
            <span><Icon name={s.icon} />{s.label}</span>
            <b><CountUp value={s.value} suffix={s.suffix || ''} /></b>
            <small>{s.sub}</small>
          </button>
        ))}
      </div>
      <div className="adx-duo">
        <PulseChart days={p.days} />
        <div className="adx-quick">
          <h3>اختصارات</h3>
          <div>
            {QUICK.filter((q) => canOpen(q.tab)).slice(0, 6).map((q, i) => (
              <button key={q.tab} type="button" style={{ animationDelay: `${0.25 + i * 0.06}s`, background: ART[i % ART.length] }} onClick={() => onNavigate(q.tab)}>
                <Icon name={q.icon} /><b>{q.title}</b><small>{q.sub}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
