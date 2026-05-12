
import { ADMIN_TABS, canAccessAdminTab } from '../../config/adminPermissions';

export { ADMIN_TABS };

export default function AdminSidebar({ activeTab, setActiveTab, adminProfile }) {
  const visibleTabs = ADMIN_TABS.filter(([tab]) => canAccessAdminTab(adminProfile, tab));

  return (
    <div className="v2-sidebar-nav glass-panel p-4 rounded-3xl h-fit space-y-2 flex md:flex-col overflow-x-auto md:overflow-x-visible whitespace-nowrap scrollbar-hide sticky top-28">
      {visibleTabs.map(([tab, label]) => (
        <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-right p-3.5 rounded-2xl font-black flex gap-2 transition-all ${activeTab===tab?'bg-gradient-to-l from-amber-500 to-orange-500 text-white shadow-md border border-amber-400':'hover:bg-amber-50 text-slate-600'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}
