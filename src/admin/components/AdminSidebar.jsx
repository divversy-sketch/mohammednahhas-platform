import { ADMIN_TABS, canAccessAdminTab } from '../../config/adminPermissions';

export { ADMIN_TABS };

const QUICK_TABS = new Set([
  'dashboard',
  'students',
  'pending',
  'payments',
  'courses',
  'exams',
  'content',
  'settings',
]);

export default function AdminSidebar({ activeTab, setActiveTab, adminProfile }) {
  const visibleTabs = ADMIN_TABS.filter(([tab]) => canAccessAdminTab(adminProfile, tab));
  const priorityTabs = visibleTabs.filter(([tab]) => QUICK_TABS.has(tab));
  const secondaryTabs = visibleTabs.filter(([tab]) => !QUICK_TABS.has(tab));
  const orderedTabs = [...priorityTabs, ...secondaryTabs];

  return (
    <nav className="v2-admin-command-nav glass-panel rounded-3xl p-3 md:p-4 sticky top-[5.75rem] z-30" aria-label="أقسام لوحة الإدارة">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">أقسام الإدارة</p>
          <h2 className="text-base md:text-lg font-black text-slate-950">تنقل سريع بدون Sidebar</h2>
        </div>
        <span className="hidden md:inline-flex rounded-full bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 text-xs font-black">
          {orderedTabs.length} قسم
        </span>
      </div>

      <div className="v2-admin-command-scroll" role="tablist" aria-label="تبويبات الإدارة">
        {orderedTabs.map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`v2-admin-command-chip ${activeTab === tab ? 'is-active' : ''}`}
            role="tab"
            aria-selected={activeTab === tab}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
