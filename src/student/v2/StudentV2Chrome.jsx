import { signOut } from 'firebase/auth';
import {
  Bell,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ClipboardCheck,
  Crown,
  FileCheck2,
  FolderOpen,
  Gamepad2,
  Headphones,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  MoreVertical,
  PlaySquare,
  Route,
  Settings,
  ShieldQuestion,
  Trophy,
  UserRound,
  Zap,
} from 'lucide-react';
import ThemeToggle from '../../shared/ui/ThemeToggle.jsx';

const NAV_GROUPS = [
  { label: 'الرئيسية', items: [{ tab: 'home', label: 'لوحة المتابعة', icon: LayoutDashboard }, { tab: 'subscription', label: 'الباقة والاشتراك', icon: Crown, tone: 'amber' }] },
  { label: 'التعلم', permission: 'content', items: [
    { tab: 'courses', label: 'كورساتي', icon: BookOpen },
    { tab: 'videos', label: 'محاضراتي', icon: PlaySquare },
    { tab: 'learning_path', label: 'مساري التعليمي', icon: Route },
    { tab: 'remediation', label: 'الملف الذكي', icon: BrainCircuit },
    { tab: 'files', label: 'الملفات', icon: FolderOpen },
    { tab: 'htmls', label: 'المحتوى التفاعلي', icon: Gamepad2 },
    { tab: 'review_quiz', label: 'مراجعة سريعة', icon: Zap },
  ] },
  { label: 'الاختبارات', permission: 'exam', items: [
    { tab: 'exams', label: 'الاختبارات', icon: ClipboardCheck },
    { tab: 'assignments', label: 'الواجبات وبنك الأخطاء', icon: FileCheck2, alias: ['assignments', 'smart_hw_results', 'mistakes_bank'], action: 'learningHub' },
  ] },
  { label: 'التواصل', permission: 'content', items: [
    { tab: 'student_messages', label: 'الرسائل', icon: Mail },
    { tab: 'support', label: 'الدعم الفني', icon: Headphones },
  ] },
  { label: 'الحساب', items: [{ tab: 'settings', label: 'ملفي الشخصي والأداء', icon: UserRound, alias: ['settings', 'performance'] }] },
];

const BOTTOM_NAV = [
  { tab: 'home', label: 'الرئيسية', icon: LayoutDashboard },
  { tab: 'courses', label: 'كورسات', icon: BookOpen },
  { tab: 'exams', label: 'امتحانات', icon: ClipboardCheck },
  { tab: 'settings', label: 'أدائي', icon: Trophy },
  { tab: '_more', label: 'المزيد', icon: MoreVertical },
];

const sidebarStyles = `
@keyframes nhSideGlow { 0%,100%{opacity:.58;transform:translateY(0)} 50%{opacity:1;transform:translateY(18px)} }
.nh-text-sidebar, .nh-icon-sidebar { background:linear-gradient(180deg,#071426 0%,#06101f 55%,#030814 100%) !important; border-left:1px solid rgba(34,211,238,.14) !important; box-shadow:-18px 0 65px rgba(2,6,23,.42), inset 1px 0 0 rgba(255,255,255,.04) !important; }
.nh-text-sidebar:after { content:""; position:absolute; inset:0; pointer-events:none; background:radial-gradient(circle at 60% 5%,rgba(245,158,11,.16),transparent 12rem),radial-gradient(circle at 50% 45%,rgba(34,211,238,.10),transparent 14rem); }
.nh-text-sidebar__nav, .nh-text-sidebar__header, .nh-nav-item, .nh-nav-group, .nh-nav-group__label, .nh-nav-item--logout { position:relative; z-index:2; }
.nh-text-sidebar__header { padding:24px 16px 18px !important; border-bottom:1px solid rgba(255,255,255,.08) !important; margin-bottom:14px !important; }
.nh-text-sidebar__name { font-size:17px !important; color:#fff !important; }
.nh-text-sidebar__sub { color:#fbbf24 !important; font-weight:900 !important; }
.nh-nav-group__label { color:rgba(148,163,184,.62) !important; font-size:11px !important; padding:12px 14px 6px !important; }
.nh-nav-item { height:48px !important; border-radius:16px !important; padding:0 14px !important; margin:3px 0 !important; color:#cbd5e1 !important; border:1px solid transparent !important; font-size:15px !important; font-weight:900 !important; gap:12px !important; }
.nh-nav-item svg { opacity:.95; }
.nh-nav-item:hover { background:rgba(255,255,255,.06) !important; color:#fff !important; transform:translateX(-3px); }
.nh-nav-item.is-active { background:linear-gradient(90deg,rgba(245,158,11,.88),rgba(245,158,11,.16)) !important; color:#fff !important; border-color:rgba(245,158,11,.45) !important; box-shadow:0 15px 45px rgba(245,158,11,.22), inset 0 0 22px rgba(255,255,255,.04) !important; }
.nh-nav-item.is-active:before { content:""; position:absolute; right:-8px; top:10px; height:28px; width:4px; border-radius:999px; background:#fbbf24; box-shadow:0 0 22px #f59e0b; }
.nh-nav-item.is-active svg { color:#fff !important; }
.nh-nav-item--logout { margin:14px 10px 0 !important; width:calc(100% - 20px) !important; color:#fca5a5 !important; }
.nh-side-logo-mark { position:relative; display:grid; place-items:center; width:54px; height:54px; border-radius:18px; background:linear-gradient(135deg,#fbbf24,#f97316); color:#06101f; box-shadow:0 0 40px rgba(245,158,11,.26); overflow:hidden; }
.nh-side-logo-mark:before { content:""; position:absolute; inset:10px; border:2px solid rgba(6,16,31,.85); border-bottom:0; border-radius:999px 999px 4px 4px; }
.nh-side-logo-mark:after { content:""; position:absolute; bottom:12px; width:32px; height:15px; background:#06101f; clip-path:polygon(0 100%,10% 45%,20% 45%,20% 100%,35% 100%,50% 30%,65% 100%,80% 100%,80% 45%,90% 45%,100% 100%); opacity:.85; }
@media(min-width:1200px){ .nh-text-sidebar{width:265px !important;} }
.nh-topbar { background:rgba(255,255,255,.92) !important; border:1px solid rgba(226,232,240,.7) !important; box-shadow:0 18px 50px rgba(15,23,42,.08) !important; }
`;

function canShow(group, isBannedContent, isBannedExam) {
  if (group.permission === 'content') return !isBannedContent;
  if (group.permission === 'exam') return !isBannedExam;
  return true;
}

export function StudentV2Sidebar({ activeTab, setActiveTab, setMobileMenu, setLearningHubTab, isBannedContent, isBannedExam, auth, studentName, isPremium }) {
  const goTo = (item) => {
    if (item.action === 'learningHub') setLearningHubTab?.('assignments');
    setActiveTab(item.tab);
    setMobileMenu?.(false);
  };
  const isActive = (item) => [item.tab, ...(item.alias || [])].includes(activeTab);
  const first = studentName ? studentName.split(' ')[0] : 'محمد';

  return (
    <>
      <style>{sidebarStyles}</style>
      <aside className="nh-icon-sidebar" aria-label="قائمة الأقسام">
        <div className="nh-icon-sidebar__logo"><span className="nh-side-logo-mark"><span className="relative z-10 text-xl font-black">ن</span></span></div>
        <nav className="nh-icon-sidebar__nav">
          {NAV_GROUPS.filter((g) => canShow(g, isBannedContent, isBannedExam)).flatMap((g) => g.items).map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return <button key={item.tab} onClick={() => goTo(item)} className={`nh-icon-btn${active ? ' is-active' : ''}`} title={item.label} aria-label={item.label}><Icon size={21} strokeWidth={1.9} />{active && <span className="nh-icon-btn__dot" />}</button>;
          })}
        </nav>
        <button onClick={() => signOut(auth)} className="nh-icon-btn nh-icon-btn--logout mt-auto" title="خروج" aria-label="خروج"><LogOut size={20} /></button>
      </aside>

      <aside className="nh-text-sidebar" aria-label="قائمة الأقسام الكاملة">
        <div className="nh-text-sidebar__header">
          <span className="nh-side-logo-mark"><span className="relative z-10 text-xl font-black">ن</span></span>
          <div className="nh-text-sidebar__brand">
            <span className="nh-text-sidebar__name">منصة النحاس</span>
            <span className="nh-text-sidebar__sub">{first} · {isPremium ? 'طالب مميز' : 'طالب نشط'}</span>
          </div>
        </div>
        <nav className="nh-text-sidebar__nav">
          {NAV_GROUPS.filter((g) => canShow(g, isBannedContent, isBannedExam)).map((group) => (
            <div key={group.label} className="nh-nav-group">
              <span className="nh-nav-group__label">{group.label}</span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <button key={item.tab} onClick={() => goTo(item)} className={`nh-nav-item${active ? ' is-active' : ''}${item.tone === 'amber' ? ' nh-nav-item--amber' : ''}`} aria-current={active ? 'page' : undefined}>
                    <Icon size={20} strokeWidth={1.85} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="nh-nav-item nh-nav-item--logout"><LogOut size={19} /><span>تسجيل الخروج</span></button>
      </aside>
    </>
  );
}

export function StudentV2Topbar({ setShowFocusMode, setShowNotifications, unseenNotificationCount, isPremium, subscriptionExpiry }) {
  const expiryLabel = subscriptionExpiry?.toDate ? subscriptionExpiry.toDate().toLocaleDateString('ar-EG') : null;
  return (
    <header className="nh-topbar">
      <div className="nh-topbar__left">
        {isPremium && <span className="nh-topbar__vip"><Crown size={13} /> VIP {expiryLabel ? `حتى ${expiryLabel}` : 'مفعل'}</span>}
      </div>
      <div className="nh-topbar__right">
        <ThemeToggle />
        <button onClick={() => setShowFocusMode(true)} className="nh-topbar__btn" aria-label="وضع التركيز"><Zap size={17} /><span className="nh-topbar__btn-label">تركيز</span></button>
        <button onClick={() => setShowNotifications(true)} className="nh-topbar__btn nh-topbar__btn--notif" aria-label="الإشعارات"><Bell size={17} />{unseenNotificationCount > 0 && <span className="nh-notif-badge">{unseenNotificationCount}</span>}</button>
      </div>
    </header>
  );
}

export function StudentV2SectionTitle({ badge, title, description, action }) {
  return (
    <div className="nh-section-title">
      <div>{badge && <span className="nh-kicker">{badge}</span>}<h2 className="nh-section-title__h">{title}</h2>{description && <p className="nh-section-title__desc">{description}</p>}</div>
      {action && <div className="nh-section-title__action">{action}</div>}
    </div>
  );
}

export { BOTTOM_NAV };
