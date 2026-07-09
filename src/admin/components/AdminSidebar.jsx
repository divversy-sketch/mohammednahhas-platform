import { ADMIN_TABS, canAccessAdminTab } from '../../config/adminPermissions';
import AdminNeoIcon from './AdminNeoIcon.jsx';

export { ADMIN_TABS };

const TAB_ICONS = {
  dashboard: 'activity',
  follow_up: 'target',
  users: 'graduation',
  all_users: 'users',
  password_resets: 'key',
  payments: 'card',
  subscriptions_legacy: 'wallet',
  finance_dashboard: 'card',
  courses: 'book',
  content: 'layers',
  exams: 'file',
  question_bank: 'clipboard',
  smart_exam_engine: 'brain',
  assignments: 'clipboard',
  smart_hw: 'qr',
  mistakes_admin: 'target',
  student_reports: 'trophy',
  student_groups: 'users',
  messages_center: 'message',
  notifications_admin: 'bell',
  security_center: 'shield',
  video_security: 'lock',
  app_convert: 'phone',
  admin_roles: 'shield',
  audit_logs: 'activity',
};

const GROUPS = [
  {
    title: 'القيادة اليومية',
    tabs: ['dashboard', 'follow_up', 'users', 'all_users', 'password_resets'],
  },
  {
    title: 'التعلم والمحتوى',
    tabs: ['courses', 'content', 'assignments', 'smart_hw'],
  },
  {
    title: 'الاختبارات والتحليل',
    tabs: ['exams', 'question_bank', 'smart_exam_engine', 'mistakes_admin', 'student_reports'],
  },
  {
    title: 'الماليات والاشتراكات',
    tabs: ['payments', 'subscriptions_legacy', 'finance_dashboard'],
  },
  {
    title: 'التواصل والدفعات',
    tabs: ['student_groups', 'messages_center', 'notifications_admin'],
  },
  {
    title: 'الأمان والتشغيل',
    tabs: ['security_center', 'video_security', 'app_convert', 'admin_roles', 'audit_logs'],
  },
];

const FALLBACK_GROUP = { title: 'أقسام إضافية', tabs: [] };

function getLabel(tab) {
  return ADMIN_TABS.find(([key]) => key === tab)?.[1] || tab;
}

function buildVisibleGroups(adminProfile) {
  const visibleSet = new Set(ADMIN_TABS.filter(([tab]) => canAccessAdminTab(adminProfile, tab)).map(([tab]) => tab));
  const used = new Set();
  const groups = GROUPS.map((group) => {
    const tabs = group.tabs.filter((tab) => visibleSet.has(tab));
    tabs.forEach((tab) => used.add(tab));
    return { ...group, tabs };
  }).filter((group) => group.tabs.length);

  const remaining = [...visibleSet].filter((tab) => !used.has(tab));
  if (remaining.length) groups.push({ ...FALLBACK_GROUP, tabs: remaining });
  return groups;
}

export default function AdminSidebar({ activeTab, setActiveTab, adminProfile, open = false }) {
  const groups = buildVisibleGroups(adminProfile);
  const total = groups.reduce((sum, group) => sum + group.tabs.length, 0);
  const adminName = adminProfile?.name || adminProfile?.email || 'مدير المنصة';

  return (
    <aside className={`admin-neo-sidebar ${open ? 'is-open' : ''}`} aria-label="لوحة تنقل الإدارة">
      <div className="admin-neo-brand">
        <div className="admin-neo-brand__mark">ن</div>
        <div className="admin-neo-brand__text">
          <span>منصة النحاس</span>
          <strong>Admin Command</strong>
        </div>
      </div>

      <section className="admin-neo-profile">
        <div className="admin-neo-profile__top">
          <div className="admin-neo-profile__avatar"><AdminNeoIcon name="bot" size={26} /></div>
          <div>
            <p>أهلًا بك</p>
            <h2>{adminName}</h2>
          </div>
        </div>
        <span className="admin-neo-status"><i /> {total} قسم متاح</span>
      </section>

      <nav className="admin-neo-nav" role="tablist" aria-label="تبويبات الإدارة">
        {groups.map((group) => (
          <section className="admin-neo-nav-group" key={group.title}>
            <p className="admin-neo-nav-group__title"><span>{group.title}</span><b>{group.tabs.length}</b></p>
            <div className="admin-neo-nav-list">
              {group.tabs.map((tab) => {
                const iconName = TAB_ICONS[tab] || 'help';
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    className={activeTab === tab ? 'is-active' : ''}
                    onClick={() => setActiveTab(tab)}
                  >
                    <AdminNeoIcon name={iconName} size={20} />
                    <span>{getLabel(tab)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
}
