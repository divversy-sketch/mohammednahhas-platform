import { useMemo, useState } from 'react';
import { ADMIN_TABS, canAccessAdminTab } from '../../config/adminPermissions';
import AdminNeoIcon from './AdminNeoIcon.jsx';

export { ADMIN_TABS };

const TAB_ICONS = {
  dashboard: 'activity', follow_up: 'target', users: 'graduation', all_users: 'users', password_resets: 'key',
  payments: 'card', subscriptions_legacy: 'wallet', finance_dashboard: 'card', courses: 'book', content: 'layers',
  exams: 'file', question_bank: 'clipboard', smart_teacher: 'brain', parent_portal: 'users', smart_exam_engine: 'brain', assignments: 'clipboard', smart_hw: 'qr',
  mistakes_admin: 'target', student_reports: 'trophy', student_groups: 'users', messages_center: 'message',
  notifications_admin: 'bell', security_center: 'shield', video_security: 'lock', app_convert: 'phone',
  admin_roles: 'shield', audit_logs: 'activity',
};

const GROUPS = [
  { title: 'الرئيسية', tabs: ['dashboard', 'follow_up'] },
  { title: 'الطلاب', tabs: ['users', 'all_users', 'student_groups', 'parent_portal', 'password_resets'] },
  { title: 'التعليم', tabs: ['courses', 'content', 'assignments', 'smart_hw'] },
  { title: 'الاختبارات', tabs: ['exams', 'question_bank', 'smart_teacher', 'smart_exam_engine', 'mistakes_admin', 'student_reports'] },
  { title: 'الماليات', tabs: ['payments', 'subscriptions_legacy', 'finance_dashboard'] },
  { title: 'التواصل', tabs: ['messages_center', 'notifications_admin'] },
  { title: 'النظام', tabs: ['security_center', 'video_security', 'app_convert', 'admin_roles', 'audit_logs'] },
];

const getLabel = (tab) => ADMIN_TABS.find(([key]) => key === tab)?.[1] || tab;

function buildVisibleGroups(adminProfile) {
  const visible = new Set(ADMIN_TABS.filter(([tab]) => canAccessAdminTab(adminProfile, tab)).map(([tab]) => tab));
  const used = new Set();
  const groups = GROUPS.map((group) => {
    const tabs = group.tabs.filter((tab) => visible.has(tab));
    tabs.forEach((tab) => used.add(tab));
    return { ...group, tabs };
  }).filter((group) => group.tabs.length);
  const remaining = [...visible].filter((tab) => !used.has(tab));
  if (remaining.length) groups.push({ title: 'أخرى', tabs: remaining });
  return groups;
}

export default function AdminSidebar({ activeTab, setActiveTab, adminProfile, open = false }) {
  const groups = useMemo(() => buildVisibleGroups(adminProfile), [adminProfile]);
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const displayedGroups = groups.map((group) => ({
    ...group,
    tabs: normalizedQuery ? group.tabs.filter((tab) => getLabel(tab).toLowerCase().includes(normalizedQuery)) : group.tabs,
  })).filter((group) => group.tabs.length);
  const adminName = adminProfile?.name || adminProfile?.email || 'مدير المنصة';
  const role = adminProfile?.adminRoleLabel || adminProfile?.adminRole || 'إدارة المنصة';

  return (
    <aside className={`admin-neo-sidebar ${open ? 'is-open' : ''}`} aria-label="لوحة تنقل الإدارة">
      <div className="admin-neo-brand">
        <div className="admin-neo-brand__mark">ن</div>
        <div className="admin-neo-brand__text"><strong>منصة النحاس</strong><span>لوحة الإدارة</span></div>
      </div>

      <label className="admin-neo-nav-search">
        <AdminNeoIcon name="search" size={16} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث في الأقسام" />
      </label>

      <nav className="admin-neo-nav" aria-label="أقسام الإدارة">
        {displayedGroups.map((group) => (
          <section className="admin-neo-nav-group" key={group.title}>
            <p className="admin-neo-nav-group__title">{group.title}</p>
            <div className="admin-neo-nav-list">
              {group.tabs.map((tab) => (
                <button key={tab} type="button" aria-current={activeTab === tab ? 'page' : undefined} className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)}>
                  <AdminNeoIcon name={TAB_ICONS[tab] || 'help'} size={17} />
                  <span>{getLabel(tab)}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </nav>

      <div className="admin-neo-sidebar__account">
        <div className="admin-neo-profile__avatar"><AdminNeoIcon name="bot" size={18} /></div>
        <div><strong>{adminName}</strong><span>{role}</span></div>
      </div>
    </aside>
  );
}
