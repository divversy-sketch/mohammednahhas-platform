import { signOut } from 'firebase/auth';
import {
  C03BellIcon,
  C03BookIcon,
  C03CalendarIcon,
  C03ChartIcon,
  C03CrownIcon,
  C03ExamIcon,
  C03FileIcon,
  C03HomeIcon,
  C03LogoutIcon,
  C03MessageIcon,
  C03PlayIcon,
  C03RocketIcon,
  C03SearchIcon,
  C03SettingsIcon,
  C03SparkIcon,
  C03UserIcon,
} from '@shared/icons/creative03Icons.jsx';

const NAV_GROUPS = [
  {
    label: 'لوحتك',
    items: [
      { tab: 'home', label: 'الرئيسية', icon: C03HomeIcon },
      { tab: 'subscription', label: 'الاشتراكات', icon: C03CrownIcon, tone: 'pink' },
    ],
  },
  {
    label: 'التعلم',
    permission: 'content',
    items: [
      { tab: 'courses', label: 'الكورسات', icon: C03BookIcon },
      { tab: 'videos', label: 'المحاضرات', icon: C03PlayIcon },
      { tab: 'learning_path', label: 'مساري التعليمي', icon: C03RocketIcon },
      { tab: 'remediation', label: 'العلاج الذكي', icon: C03SparkIcon },
      { tab: 'files', label: 'الملفات', icon: C03FileIcon },
      { tab: 'htmls', label: 'محتوى تفاعلي', icon: C03SparkIcon },
      { tab: 'review_quiz', label: 'مراجعة سريعة', icon: C03ExamIcon },
    ],
  },
  {
    label: 'الاختبارات',
    permission: 'exam',
    items: [
      { tab: 'exams', label: 'الامتحانات', icon: C03ExamIcon },
      {
        tab: 'assignments',
        label: 'الواجبات وبنك الأخطاء',
        icon: C03CalendarIcon,
        alias: ['assignments', 'smart_hw_results', 'mistakes_bank'],
        action: 'learningHub',
      },
    ],
  },
  {
    label: 'التواصل',
    permission: 'content',
    items: [
      { tab: 'student_messages', label: 'رسائلي', icon: C03MessageIcon },
      { tab: 'support', label: 'الدعم الفني', icon: C03BellIcon },
    ],
  },
  {
    label: 'الحساب',
    items: [
      { tab: 'settings', label: 'ملفي والأداء', icon: C03SettingsIcon, alias: ['settings', 'performance'] },
    ],
  },
];

const canShowGroup = (group, isBannedContent, isBannedExam) => {
  if (group.permission === 'content') return !isBannedContent;
  if (group.permission === 'exam') return !isBannedExam;
  return true;
};

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
  const firstName = String(studentName || 'طالب').split(' ')[0];

  const goTo = (item) => {
    if (item.action === 'learningHub') setLearningHubTab?.('assignments');
    setActiveTab?.(item.tab);
    setMobileMenu?.(false);
  };

  const isActive = (item) => [item.tab, ...(item.alias || [])].includes(activeTab);

  return (
    <aside className="c03-sidebar" aria-label="قائمة منصة النحاس">
      <div className="c03-sidebar__brand">
        <div className="c03-logo-mark">ن</div>
        <div>
          <strong>منصة النحاس</strong>
          <span>{firstName} · {isPremium ? 'VIP' : 'حساب مجاني'}</span>
        </div>
      </div>

      <nav className="c03-sidebar__nav">
        {NAV_GROUPS.filter((group) => canShowGroup(group, isBannedContent, isBannedExam)).map((group) => (
          <div className="c03-nav-group" key={group.label}>
            <p>{group.label}</p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <button
                  type="button"
                  key={item.tab}
                  onClick={() => goTo(item)}
                  className={`c03-nav-item${active ? ' is-active' : ''}${item.tone ? ` is-${item.tone}` : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="c03-nav-item__icon"><Icon size={20} /></span>
                  <span className="c03-nav-item__label">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="c03-upgrade-card">
        <C03CrownIcon size={23} />
        <strong>ترقية حسابك</strong>
        <p>افتح كل المحاضرات والاختبارات بتجربة كاملة.</p>
        <button type="button" onClick={() => setActiveTab?.('subscription')}>ترقية الآن</button>
      </div>

      <button type="button" onClick={() => auth && signOut(auth)} className="c03-logout">
        <C03LogoutIcon size={18} />
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
    <header className="c03-topbar">
      <div className="c03-user-chip">
        <button type="button" className="c03-icon-button c03-icon-button--hot"><C03UserIcon size={19} /></button>
        <button type="button" onClick={() => setShowNotifications?.(true)} className="c03-icon-button">
          <C03BellIcon size={19} />
          {unseenNotificationCount > 0 && <span>{unseenNotificationCount}</span>}
        </button>
        <button type="button" className="c03-icon-button"><C03MessageIcon size={19} /></button>
      </div>

      <div className="c03-search-box">
        <C03SearchIcon size={19} />
        <input placeholder="ابحث عن محاضرة، اختبار، ملف..." readOnly aria-label="بحث داخل المنصة" />
      </div>

      <div className="c03-top-actions">
        {isPremium && <span className="c03-vip-pill">VIP {expiryLabel ? `حتى ${expiryLabel}` : 'مفعل'}</span>}
        <button type="button" onClick={() => setShowFocusMode?.(true)} className="c03-focus-btn">
          <C03SparkIcon size={17} /> وضع التركيز
        </button>
      </div>
    </header>
  );
}

export function StudentV2SectionTitle({ badge, title, action }) {
  return (
    <div className="c03-section-title">
      <div>
        {badge && <span>{badge}</span>}
        <h2>{title}</h2>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
