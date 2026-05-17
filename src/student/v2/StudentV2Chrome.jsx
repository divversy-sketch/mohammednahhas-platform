import { signOut } from 'firebase/auth';
import {
  Bell,
  BookOpen,
  BrainCircuit,
  ClipboardCheck,
  Crown,
  FileCheck2,
  FolderOpen,
  Gamepad2,
  Headphones,
  Home,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  MoreVertical,
  PlaySquare,
  Route,
  Settings,
  StickyNote,
  Trophy,
  UserRound,
  Users,
  Zap,
} from 'lucide-react';
import ThemeToggle from '../../shared/ui/ThemeToggle.jsx';

const NAV_GROUPS = [
  { label: 'الرئيسية', items: [{ tab: 'home', label: 'لوحة المتابعة', icon: LayoutDashboard }, { tab: 'subscription', label: 'الباقة والاشتراك', icon: Crown, tone: 'premium' }] },
  { label: 'التعلم', permission: 'content', items: [
    { tab: 'courses', label: 'كورساتي', icon: BookOpen },
    { tab: 'videos', label: 'محاضراتي', icon: PlaySquare },
    { tab: 'learning_path', label: 'رحلتي التعليمية', icon: Route },
    { tab: 'remediation', label: 'الملف الذكي', icon: BrainCircuit },
    { tab: 'files', label: 'الموارد', icon: FolderOpen },
    { tab: 'htmls', label: 'المحتوى التفاعلي', icon: Gamepad2 },
    { tab: 'review_quiz', label: 'مراجعة سريعة', icon: Zap },
  ] },
  { label: 'الاختبارات', permission: 'exam', items: [
    { tab: 'exams', label: 'الاختبارات', icon: ClipboardCheck },
    { tab: 'assignments', label: 'الواجبات', icon: FileCheck2, alias: ['assignments', 'smart_hw_results', 'mistakes_bank'], action: 'learningHub' },
  ] },
  { label: 'المجتمع والتواصل', permission: 'content', items: [
    { tab: 'student_messages', label: 'الرسائل', icon: Mail },
    { tab: 'support', label: 'الدعم الفني', icon: Headphones },
  ] },
  { label: 'الحساب', items: [{ tab: 'settings', label: 'ملفي الشخصي والأداء', icon: UserRound, alias: ['settings', 'performance'] }] },
];

const BOTTOM_NAV = [
  { tab: 'home', label: 'الرئيسية', icon: Home },
  { tab: 'courses', label: 'الكورسات', icon: BookOpen },
  { tab: 'videos', label: 'المحاضرات', icon: PlaySquare },
  { tab: 'settings', label: 'الحساب', icon: UserRound },
  { tab: '_more', label: 'المزيد', icon: MoreVertical },
];

const sidebarStyles = `
@keyframes ndSidePulse{0%,100%{opacity:.55;transform:translateY(0)}50%{opacity:1;transform:translateY(20px)}}
.nh-text-sidebar,.nh-icon-sidebar{background:#0A1424!important;border-left:1px solid rgba(255,255,255,.08)!important;box-shadow:-30px 0 90px rgba(0,0,0,.45),inset 1px 0 0 rgba(255,255,255,.04)!important;color:#f8fafc!important;}
.nh-text-sidebar:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 60% 4%,rgba(139,92,246,.26),transparent 13rem),radial-gradient(circle at 20% 42%,rgba(59,130,246,.12),transparent 16rem),linear-gradient(180deg,#0A1424,#07111F 70%,#050b15);}
.nh-text-sidebar:after{content:"";position:absolute;left:0;top:5%;height:30%;width:2px;border-radius:999px;background:linear-gradient(180deg,transparent,#a855f7,#3b82f6,transparent);box-shadow:0 0 28px rgba(168,85,247,.7);animation:ndSidePulse 5.5s ease-in-out infinite;}
.nh-text-sidebar__nav,.nh-text-sidebar__header,.nh-nav-item,.nh-nav-group,.nh-nav-group__label,.nh-nav-item--logout{position:relative;z-index:2;}
.nh-text-sidebar__header{padding:24px 18px 18px!important;border-bottom:1px solid rgba(255,255,255,.08)!important;margin-bottom:14px!important;}
.nh-text-sidebar__name{font-size:18px!important;color:#fff!important;font-weight:1000!important;}
.nh-text-sidebar__sub{color:#c4b5fd!important;font-weight:900!important;}
.nh-nav-group__label{color:rgba(148,163,184,.72)!important;font-size:11px!important;padding:12px 14px 6px!important;}
.nh-nav-item{height:48px!important;border-radius:16px!important;padding:0 14px!important;margin:4px 0!important;color:#cbd5e1!important;border:1px solid transparent!important;font-size:15px!important;font-weight:900!important;gap:12px!important;transition:transform .22s ease,background .22s ease,color .22s ease,border-color .22s ease,box-shadow .22s ease!important;}
.nh-nav-item svg{opacity:.95;color:#94a3b8;}
.nh-nav-item:hover{background:rgba(255,255,255,.06)!important;color:#fff!important;transform:translateX(-3px);border-color:rgba(255,255,255,.08)!important;}
.nh-nav-item:hover svg{color:#c4b5fd!important;}
.nh-nav-item.is-active{background:linear-gradient(90deg,#8B5CF6,#6D28D9)!important;color:#fff!important;border-color:rgba(168,85,247,.62)!important;box-shadow:0 0 28px rgba(139,92,246,.35),0 18px 45px rgba(0,0,0,.22)!important;}
.nh-nav-item.is-active:before{content:"";position:absolute;right:-8px;top:10px;height:28px;width:4px;border-radius:999px;background:#a855f7;box-shadow:0 0 22px #a855f7;}
.nh-nav-item.is-active svg{color:#fff!important;}
.nh-nav-item--amber,.nh-nav-item--premium{color:#facc15!important;}
.nh-nav-item--logout{margin:14px 10px 0!important;width:calc(100% - 20px)!important;color:#fca5a5!important;}
.nd-side-logo-mark{position:relative;display:grid;place-items:center;width:54px;height:54px;border-radius:18px;background:linear-gradient(135deg,#8B5CF6,#3B82F6);color:#fff;box-shadow:0 0 35px rgba(139,92,246,.35);overflow:hidden;}
.nd-side-logo-mark:before{content:"";position:absolute;inset:11px;border:2px solid rgba(255,255,255,.78);border-bottom:0;border-radius:999px 999px 4px 4px;opacity:.6;}
.nd-side-logo-mark:after{content:"";position:absolute;bottom:10px;right:13px;width:28px;height:16px;background:rgba(255,255,255,.75);clip-path:polygon(0 100%,10% 45%,20% 45%,20% 100%,40% 100%,50% 30%,60% 100%,80% 100%,80% 45%,90% 45%,100% 100%);opacity:.45;}
.nh-icon-sidebar__logo .nh-side-logo-mark,.nh-text-sidebar__header .nh-side-logo-mark{display:none!important;}
.nh-icon-sidebar__logo:before{content:"ن";display:grid;place-items:center;width:54px;height:54px;border-radius:18px;background:linear-gradient(135deg,#8B5CF6,#3B82F6);color:#fff;font-weight:1000;font-size:22px;box-shadow:0 0 35px rgba(139,92,246,.35);}
.nh-text-sidebar__header:before{content:"ن";display:grid;place-items:center;width:54px;height:54px;border-radius:18px;background:linear-gradient(135deg,#8B5CF6,#3B82F6);color:#fff;font-weight:1000;font-size:22px;box-shadow:0 0 35px rgba(139,92,246,.35);}
.nh-topbar{background:rgba(10,20,36,.86)!important;color:#f8fafc!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:0 18px 50px rgba(0,0,0,.22)!important;backdrop-filter:blur(18px)!important;}
.nh-topbar__btn,.nh-topbar__vip{background:rgba(255,255,255,.06)!important;color:#e2e8f0!important;border:1px solid rgba(255,255,255,.08)!important;}
.nh-topbar__btn:hover{background:rgba(139,92,246,.16)!important;color:#fff!important;}
@media(min-width:1200px){.nh-text-sidebar{width:286px!important;}}
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
        <div className="nh-icon-sidebar__logo" />
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
                  <button key={item.tab} onClick={() => goTo(item)} className={`nh-nav-item${active ? ' is-active' : ''}${item.tone === 'premium' ? ' nh-nav-item--premium' : ''}`} aria-current={active ? 'page' : undefined}>
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
