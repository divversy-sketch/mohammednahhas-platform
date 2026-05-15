import { signOut } from 'firebase/auth';
import {
  Bell, BookOpen, BrainCircuit, ClipboardList, Code,
  Crown, FileCheck, FileText, Headphones, LogOut, Menu,
  MessageSquare, MoreVertical, PlayCircle, Settings,
  Target, User, X, Sparkles, Trophy, Layout,
} from '../../shared/icons/lucide-shim.jsx';
import { ModernLogo } from '../../features/home/HomeWidgets.jsx';

/* ─── تعريف الأقسام ─── */
const NAV_GROUPS = [
  {
    label: 'الرئيسية',
    items: [
      { tab: 'home',         label: 'لوحة المتابعة',       icon: Layout        },
      { tab: 'subscription', label: 'الباقة والاشتراك',     icon: Crown, tone: 'amber' },
    ],
  },
  {
    label: 'التعلم',
    permission: 'content',
    items: [
      { tab: 'courses',       label: 'الكورسات',             icon: BookOpen      },
      { tab: 'videos',        label: 'المحاضرات',            icon: PlayCircle    },
      { tab: 'learning_path', label: 'مساري التعليمي',       icon: Target        },
      { tab: 'remediation',   label: 'العلاج الذكي',         icon: BrainCircuit  },
      { tab: 'files',         label: 'الملفات',              icon: FileText      },
      { tab: 'htmls',         label: 'محتوى تفاعلي',         icon: Code          },
    ],
  },
  {
    label: 'التواصل',
    permission: 'content',
    items: [
      { tab: 'student_messages', label: 'رسائلي',     icon: MessageSquare },
      { tab: 'support',          label: 'الدعم الفني', icon: Bell          },
    ],
  },
  {
    label: 'الاختبارات',
    permission: 'exam',
    items: [
      { tab: 'exams',       label: 'الامتحانات',           icon: ClipboardList },
      { tab: 'assignments', label: 'الواجبات وبنك الأخطاء', icon: FileCheck,
        alias: ['assignments','smart_hw_results','mistakes_bank'], action: 'learningHub' },
    ],
  },
  {
    label: 'الحساب',
    items: [
      { tab: 'settings', label: 'ملفي الشخصي والأداء', icon: Settings,
        alias: ['settings','performance'] },
    ],
  },
];

/* الـ 5 items للـ bottom nav على الموبايل */
const BOTTOM_NAV = [
  { tab: 'home',        label: 'الرئيسية',  icon: Layout        },
  { tab: 'courses',     label: 'كورسات',    icon: BookOpen      },
  { tab: 'exams',       label: 'امتحانات',  icon: ClipboardList },
  { tab: 'settings',    label: 'أدائي',     icon: Trophy        },
  { tab: '_more',       label: 'المزيد',    icon: MoreVertical  },
];

/* ─── Sidebar الرئيسي (مخفي على موبايل — يظهر md+) ─── */
export function StudentV2Sidebar({
  activeTab, setActiveTab, setMobileMenu,
  setLearningHubTab, isBannedContent, isBannedExam,
  auth, studentName, isPremium,
}) {
  const canShow = (group) => {
    if (group.permission === 'content') return !isBannedContent;
    if (group.permission === 'exam')    return !isBannedExam;
    return true;
  };

  const goTo = (item) => {
    if (item.action === 'learningHub') setLearningHubTab?.('assignments');
    setActiveTab(item.tab);
    setMobileMenu?.(false);
  };

  const isActive = (item) =>
    [item.tab, ...(item.alias || [])].includes(activeTab);

  const toneClass = {
    amber: 'nh-nav-item--amber',
  };

  return (
    <>
      {/* ── Icon Sidebar (md → lg) ── */}
      <aside className="nh-icon-sidebar" aria-label="قائمة الأقسام">
        <div className="nh-icon-sidebar__logo">
          <ModernLogo size={32} />
        </div>
        <nav className="nh-icon-sidebar__nav">
          {NAV_GROUPS.filter(canShow).flatMap(g => g.items).map(item => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <button
                key={item.tab}
                onClick={() => goTo(item)}
                className={`nh-icon-btn${active ? ' is-active' : ''}`}
                title={item.label}
                aria-label={item.label}
              >
                <Icon size={20} />
                {active && <span className="nh-icon-btn__dot" />}
              </button>
            );
          })}
        </nav>
        <button onClick={() => signOut(auth)} className="nh-icon-btn nh-icon-btn--logout mt-auto" title="خروج" aria-label="خروج">
          <LogOut size={20} />
        </button>
      </aside>

      {/* ── Text Sidebar (lg+) ── */}
      <aside className="nh-text-sidebar" aria-label="قائمة الأقسام الكاملة">
        <div className="nh-text-sidebar__header">
          <ModernLogo size={28} />
          <div className="nh-text-sidebar__brand">
            <span className="nh-text-sidebar__name">منصة النحاس</span>
            <span className="nh-text-sidebar__sub">
              {studentName ? studentName.split(' ')[0] : 'طالب'} · {isPremium ? '⭐ VIP' : 'مجاني'}
            </span>
          </div>
        </div>

        <nav className="nh-text-sidebar__nav">
          {NAV_GROUPS.filter(canShow).map(group => (
            <div key={group.label} className="nh-nav-group">
              <span className="nh-nav-group__label">{group.label}</span>
              {group.items.map(item => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <button
                    key={item.tab}
                    onClick={() => goTo(item)}
                    className={`nh-nav-item${active ? ' is-active' : ''}${toneClass[item.tone] ? ' ' + toneClass[item.tone] : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <button onClick={() => signOut(auth)} className="nh-nav-item nh-nav-item--logout">
          <LogOut size={17} />
          <span>تسجيل الخروج</span>
        </button>
      </aside>
    </>
  );
}

/* ─── Topbar (ثابت أعلى المحتوى على كل الشاشات) ─── */
export function StudentV2Topbar({
  setShowFocusMode, setShowNotifications, unseenNotificationCount,
  isPremium, subscriptionExpiry, setMobileMenu,
}) {
  const expiryLabel = subscriptionExpiry?.toDate
    ? subscriptionExpiry.toDate().toLocaleDateString('ar-EG')
    : null;

  return (
    <header className="nh-topbar">
      <div className="nh-topbar__left">
        {isPremium && (
          <span className="nh-topbar__vip">
            <Crown size={13} /> VIP {expiryLabel ? `حتى ${expiryLabel}` : 'مفعل'}
          </span>
        )}
      </div>
      <div className="nh-topbar__right">
        <button
          onClick={() => setShowFocusMode(true)}
          className="nh-topbar__btn"
          aria-label="وضع التركيز"
        >
          <Headphones size={17} />
          <span className="nh-topbar__btn-label">تركيز</span>
        </button>
        <button
          onClick={() => setShowNotifications(true)}
          className="nh-topbar__btn nh-topbar__btn--notif"
          aria-label="الإشعارات"
        >
          <Bell size={17} />
          {unseenNotificationCount > 0 && (
            <span className="nh-notif-badge">{unseenNotificationCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}

/* ─── Section Title ─── */
export function StudentV2SectionTitle({ badge, title, action }) {
  return (
    <div className="nh-section-title">
      <div>
        {badge && <span className="nh-kicker">{badge}</span>}
        <h2 className="nh-section-title__h">{title}</h2>
      </div>
      {action && <div className="nh-section-title__action">{action}</div>}
    </div>
  );
}
