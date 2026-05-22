import { signOut } from 'firebase/auth';
import {
  AssignmentIcon,
  BellIcon,
  BrainIcon,
  CourseIcon,
  CrownIcon,
  ExamIcon,
  FileBoxIcon,
  FocusIcon,
  HomePanelIcon,
  InteractiveIcon,
  LessonIcon,
  LogoutIcon,
  MessageIcon,
  ProfileIcon,
  SupportIcon,
  TrophyIcon,
} from '@shared/icons/nahhasCustomIcons.jsx';

const BrandMark = ({ size = 34 }) => (
  <span className="nh-brand-mark" style={{ width: size, height: size }} aria-hidden="true">
    <span>ن</span>
  </span>
);

const NAV_GROUPS = [
  {
    label: 'البداية',
    items: [
      { tab: 'home', label: 'لوحة الطالب', icon: HomePanelIcon },
      { tab: 'subscription', label: 'الباقة والاشتراك', icon: CrownIcon, tone: 'gold' },
    ],
  },
  {
    label: 'التعلم',
    permission: 'content',
    items: [
      { tab: 'courses', label: 'الكورسات', icon: CourseIcon },
      { tab: 'videos', label: 'المحاضرات', icon: LessonIcon },
      { tab: 'learning_path', label: 'مساري التعليمي', icon: FocusIcon },
      { tab: 'remediation', label: 'العلاج الذكي', icon: BrainIcon },
      { tab: 'files', label: 'الملفات', icon: FileBoxIcon },
      { tab: 'htmls', label: 'محتوى تفاعلي', icon: InteractiveIcon },
      { tab: 'review_quiz', label: 'مراجعة سريعة', icon: ExamIcon },
    ],
  },
  {
    label: 'التواصل',
    permission: 'content',
    items: [
      { tab: 'student_messages', label: 'رسائلي', icon: MessageIcon },
      { tab: 'support', label: 'الدعم الفني', icon: SupportIcon },
    ],
  },
  {
    label: 'الاختبارات',
    permission: 'exam',
    items: [
      { tab: 'exams', label: 'الامتحانات', icon: ExamIcon },
      { tab: 'assignments', label: 'الواجبات وبنك الأخطاء', icon: AssignmentIcon, alias: ['assignments','smart_hw_results','mistakes_bank'], action: 'learningHub' },
    ],
  },
  {
    label: 'الحساب',
    items: [
      { tab: 'settings', label: 'ملفي والأداء', icon: ProfileIcon, alias: ['settings','performance'] },
    ],
  },
];

export function StudentV2Sidebar({
  activeTab, setActiveTab, setMobileMenu,
  setLearningHubTab, isBannedContent, isBannedExam,
  auth, studentName, isPremium,
}) {
  const canShow = (group) => {
    if (group.permission === 'content') return !isBannedContent;
    if (group.permission === 'exam') return !isBannedExam;
    return true;
  };

  const goTo = (item) => {
    if (item.action === 'learningHub') setLearningHubTab?.('assignments');
    setActiveTab(item.tab);
    setMobileMenu?.(false);
  };

  const isActive = (item) => [item.tab, ...(item.alias || [])].includes(activeTab);
  const studentFirst = studentName ? String(studentName).trim().split(' ')[0] : 'طالب';

  return (
    <>
      <aside className="nh-icon-sidebar" aria-label="قائمة الأقسام">
        <div className="nh-icon-sidebar__logo"><BrandMark size={34} /></div>
        <nav className="nh-icon-sidebar__nav">
          {NAV_GROUPS.filter(canShow).flatMap((group) => group.items).map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <button key={item.tab} onClick={() => goTo(item)} className={`nh-icon-btn${active ? ' is-active' : ''}`} title={item.label} aria-label={item.label}>
                <Icon size={20} />
                {active && <span className="nh-icon-btn__dot" />}
              </button>
            );
          })}
        </nav>
        <button onClick={() => signOut(auth)} className="nh-icon-btn nh-icon-btn--logout mt-auto" title="خروج" aria-label="خروج"><LogoutIcon size={20} /></button>
      </aside>

      <aside className="nh-text-sidebar" aria-label="قائمة الأقسام الكاملة">
        <div className="nh-text-sidebar__header">
          <BrandMark size={40} />
          <div className="nh-text-sidebar__brand">
            <span className="nh-text-sidebar__name">منصة النحاس</span>
            <span className="nh-text-sidebar__sub">{studentFirst} · {isPremium ? 'VIP' : 'مجاني'}</span>
          </div>
        </div>

        <nav className="nh-text-sidebar__nav">
          {NAV_GROUPS.filter(canShow).map((group) => (
            <div key={group.label} className="nh-nav-group">
              <span className="nh-nav-group__label">{group.label}</span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <button key={item.tab} onClick={() => goTo(item)} className={`nh-nav-item${active ? ' is-active' : ''}${item.tone ? ` nh-nav-item--${item.tone}` : ''}`} aria-current={active ? 'page' : undefined}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <button onClick={() => signOut(auth)} className="nh-nav-item nh-nav-item--logout"><LogoutIcon size={18} /><span>تسجيل الخروج</span></button>
      </aside>
    </>
  );
}

export function StudentV2Topbar({ setShowFocusMode, setShowNotifications, unseenNotificationCount, isPremium, subscriptionExpiry }) {
  const expiryLabel = subscriptionExpiry?.toDate ? subscriptionExpiry.toDate().toLocaleDateString('ar-EG') : null;

  return (
    <header className="nh-topbar">
      <div className="nh-topbar__brand-mobile">
        <BrandMark size={34} />
        <div><strong>منصة النحاس</strong><span>تعلّم منظم</span></div>
      </div>
      <div className="nh-topbar__left">
        {isPremium ? <span className="nh-topbar__vip"><CrownIcon size={14} /> VIP {expiryLabel ? `حتى ${expiryLabel}` : 'مفعل'}</span> : <span className="nh-topbar__vip nh-topbar__vip--free">حساب مجاني</span>}
      </div>
      <div className="nh-topbar__right">
        <button onClick={() => setShowFocusMode(true)} className="nh-topbar__btn" aria-label="وضع التركيز"><FocusIcon size={17} /><span className="nh-topbar__btn-label">تركيز</span></button>
        <button onClick={() => setShowNotifications(true)} className="nh-topbar__btn nh-topbar__btn--notif" aria-label="الإشعارات"><BellIcon size={17} />{unseenNotificationCount > 0 && <span className="nh-notif-badge">{unseenNotificationCount}</span>}</button>
      </div>
    </header>
  );
}

export function StudentV2SectionTitle({ badge, title, action }) {
  return (
    <div className="nh-section-title">
      <div>{badge && <span className="nh-kicker">{badge}</span>}<h2 className="nh-section-title__h">{title}</h2></div>
      {action && <div className="nh-section-title__action">{action}</div>}
    </div>
  );
}
