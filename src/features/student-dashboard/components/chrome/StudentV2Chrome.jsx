import { signOut } from 'firebase/auth';
import {
  IconHome,
  IconBook,
  IconVideo,
  IconExam,
  IconTask,
  IconFiles,
  IconCode,
  IconBrain,
  IconWallet,
  IconUser,
  IconSupport,
  IconMessage,
  IconBell,
  IconLogout,
  IconSpark,
  IconChart,
  IconRocket,
  PlatformMark,
} from '@shared/icons/nahhasCustomIcons.jsx';

const NAV_GROUPS = [
  {
    label: 'لوحتك',
    items: [
      { tab: 'home', label: 'الرئيسية', icon: IconHome },
      { tab: 'subscription', label: 'الاشتراكات', icon: IconWallet, tone: 'pink' },
    ],
  },
  {
    label: 'التعلم',
    permission: 'content',
    items: [
      { tab: 'courses', label: 'الكورسات', icon: IconBook },
      { tab: 'videos', label: 'المحاضرات', icon: IconVideo },
      { tab: 'learning_path', label: 'مساري التعليمي', icon: IconRocket },
      { tab: 'remediation', label: 'العلاج الذكي', icon: IconBrain },
      { tab: 'files', label: 'الملفات', icon: IconFiles },
      { tab: 'htmls', label: 'محتوى تفاعلي', icon: IconCode },
    ],
  },
  {
    label: 'التقييم',
    permission: 'exam',
    items: [
      { tab: 'exams', label: 'الامتحانات', icon: IconExam },
      { tab: 'assignments', label: 'الواجبات', icon: IconTask, alias: ['assignments','smart_hw_results','mistakes_bank'], action: 'learningHub' },
      { tab: 'review_quiz', label: 'مراجعة سريعة', icon: IconChart },
    ],
  },
  {
    label: 'التواصل',
    items: [
      { tab: 'student_messages', label: 'الرسائل', icon: IconMessage },
      { tab: 'support', label: 'الدعم الفني', icon: IconSupport },
      { tab: 'settings', label: 'الإعدادات', icon: IconUser, alias: ['settings','performance'] },
    ],
  },
];

export function StudentV2Sidebar({
  activeTab,
  setActiveTab,
  setMobileMenu,
  setLearningHubTab,
  isBannedContent,
  isBannedExam,
  auth,
  studentName,
  isPremium,
}) {
  const canShow = (group) => {
    if (group.permission === 'content') return !isBannedContent;
    if (group.permission === 'exam') return !isBannedExam;
    return true;
  };

  const goTo = (item) => {
    if (item.action === 'learningHub') setLearningHubTab?.('assignments');
    setActiveTab?.(item.tab);
    setMobileMenu?.(false);
  };

  const isActive = (item) => [item.tab, ...(item.alias || [])].includes(activeTab);
  const firstName = String(studentName || 'طالب').trim().split(' ')[0] || 'طالب';

  return (
    <aside className="creative-sidebar" aria-label="قائمة الطالب">
      <div className="creative-sidebar__brand">
        <PlatformMark size={46} />
        <div>
          <strong>منصة النحاس</strong>
          <small>{firstName} · {isPremium ? 'عضوية مميزة' : 'حساب مجاني'}</small>
        </div>
      </div>

      <nav className="creative-nav" aria-label="أقسام المنصة">
        {NAV_GROUPS.filter(canShow).map((group) => (
          <div key={group.label} className="creative-nav__group">
            <span className="creative-nav__label">{group.label}</span>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => goTo(item)}
                  className={`creative-nav__item${active ? ' is-active' : ''}${item.tone ? ` is-${item.tone}` : ''}`}
                  aria-current={active ? 'page' : undefined}
                  title={item.label}
                >
                  <span className="creative-nav__icon"><Icon size={20} /></span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="creative-sidebar__upgrade">
        <span className="creative-upgrade__icon"><IconSpark size={22} /></span>
        <strong>{isPremium ? 'عضويتك مفعلة' : 'ترقية حسابك'}</strong>
        <small>{isPremium ? 'استمتع بكل محتوى المنصة.' : 'افتح تجربة تعليمية كاملة.'}</small>
        <button type="button" onClick={() => setActiveTab?.('subscription')}>{isPremium ? 'إدارة الاشتراك' : 'ترقية الآن'}</button>
      </div>

      <button type="button" onClick={() => signOut(auth)} className="creative-nav__item creative-sidebar__logout">
        <span className="creative-nav__icon"><IconLogout size={20} /></span>
        <span>تسجيل الخروج</span>
      </button>
    </aside>
  );
}

export function StudentV2Topbar({
  setShowFocusMode,
  setShowNotifications,
  unseenNotificationCount,
  isPremium,
  subscriptionExpiry,
}) {
  const expiryLabel = subscriptionExpiry?.toDate
    ? subscriptionExpiry.toDate().toLocaleDateString('ar-EG')
    : null;

  return (
    <header className="creative-topbar">
      <div className="creative-topbar__profile">
        <button type="button" onClick={() => setShowNotifications?.(true)} className="creative-topbar__icon" aria-label="الإشعارات">
          <IconBell size={20} />
          {!!unseenNotificationCount && <span>{unseenNotificationCount}</span>}
        </button>
        <button type="button" className="creative-topbar__icon" aria-label="الرسائل">
          <IconMessage size={20} />
        </button>
        <div className="creative-avatar"><IconUser size={22} /></div>
      </div>

      <div className="creative-search" role="search">
        <input type="search" placeholder="ابحث عن محاضرة، امتحان، ملف..." aria-label="بحث داخل المنصة" />
        <IconSpark size={18} />
      </div>

      <div className="creative-topbar__actions">
        {isPremium && <span className="creative-vip">VIP {expiryLabel ? `حتى ${expiryLabel}` : 'مفعل'}</span>}
        <button type="button" onClick={() => setShowFocusMode?.(true)} className="creative-focus-btn">
          <IconBrain size={18} /> وضع التركيز
        </button>
      </div>
    </header>
  );
}

export function StudentV2SectionTitle({ badge, title, action }) {
  return (
    <div className="creative-section-title">
      <div>
        {badge && <span className="creative-kicker">{badge}</span>}
        <h2>{title}</h2>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
