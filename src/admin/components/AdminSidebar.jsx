
import { ADMIN_TABS, canAccessAdminTab } from '../../config/adminPermissions';

export { ADMIN_TABS };

export default function AdminSidebar({ activeTab, setActiveTab, adminProfile }) {
  const visibleTabs = ADMIN_TABS.filter(([tab]) => canAccessAdminTab(adminProfile, tab));

  return (
    <div className="glass-panel p-4 rounded-xl h-fit space-y-2 flex md:flex-col overflow-x-auto md:overflow-x-visible whitespace-nowrap scrollbar-hide">
      {visibleTabs.map(([tab, label]) => (
        <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-right p-3 rounded-lg font-bold flex gap-2 transition-all ${activeTab===tab?'bg-amber-100 text-amber-700 shadow-sm border-b-4 md:border-b-0 md:border-r-4 border-amber-500':'hover:bg-slate-50 text-slate-600'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}
