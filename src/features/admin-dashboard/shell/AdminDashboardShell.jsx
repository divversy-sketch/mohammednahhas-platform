import { lazy, Suspense, useState } from 'react';
import { DebugPanel } from '@shared/core/debugTools.jsx';
import AdminHeader from '@admin/components/AdminHeader.jsx';
import AdminSidebar, { TAB_ICONS, getLabel } from '@admin/components/AdminSidebar.jsx';
import AdminNeoIcon from '@admin/components/AdminNeoIcon.jsx';
import { canAccessAdminTab } from '@config/adminPermissions';
import AdminLazyFallback from '@admin/dashboard/AdminLazyFallback.jsx';
import '@styles/pages/admin-neo.css';

const AdminDashboardTabs = lazy(() => import('@admin/parts/AdminDashboardTabs.jsx'));
const AdminDashboardModals = lazy(() => import('@admin/parts/AdminDashboardModals.jsx'));

const MOBILE_TABS = ['dashboard', 'all_users', 'payments', 'exams'];
const SHORT = { dashboard: 'القيادة', all_users: 'الطلاب', payments: 'المدفوعات', exams: 'الامتحانات' };

// Phone only (≤820px): the four busiest centres + «كل الأقسام», which opens the full sidebar.
function AdminMobileTabbar({ activeTab, onNavigate, onMenu, adminProfile }) {
  const tabs = MOBILE_TABS.filter((tab) => canAccessAdminTab(adminProfile, tab));
  const inBar = tabs.includes(activeTab);
  return (
    <nav className="admin-neo-tabbar" aria-label="أهم الأقسام">
      {tabs.map((tab) => (
        <button key={tab} type="button" aria-current={activeTab === tab ? 'page' : undefined} onClick={() => onNavigate(tab)}>
          <i><AdminNeoIcon name={TAB_ICONS[tab] || 'help'} size={20} /></i><span>{SHORT[tab] || getLabel(tab)}</span>
        </button>
      ))}
      <button type="button" aria-current={!inBar ? 'page' : undefined} onClick={onMenu}><i><AdminNeoIcon name="grid" size={20} /></i><span>كل الأقسام</span></button>
    </nav>
  );
}

export const AdminDashboardShell = ({
  user,
  adminProfile,
  activeTab,
  setActiveTab,
  adminGradeFilter,
  setAdminGradeFilter,
  dashboardContext
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="admin-neo-shell" dir="rtl">
      <DebugPanel user={user} />
      <Suspense fallback={<AdminLazyFallback />}>
        <AdminDashboardModals ctx={dashboardContext} />
      </Suspense>
      {sidebarOpen && <button type="button" className="admin-neo-mobile-overlay" aria-label="إغلاق القائمة" onClick={() => setSidebarOpen(false)} />}
      <div className="admin-neo-layout">
        <AdminSidebar activeTab={activeTab} setActiveTab={handleNavigate} adminProfile={adminProfile} open={sidebarOpen} />
        <main className="admin-neo-main nx-bridge">
          <AdminHeader
            activeTab={activeTab}
            adminProfile={adminProfile}
            adminGradeFilter={adminGradeFilter}
            setAdminGradeFilter={setAdminGradeFilter}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <Suspense fallback={<AdminLazyFallback />}>
            <AdminDashboardTabs ctx={{ ...dashboardContext, setActiveTab: handleNavigate }} />
          </Suspense>
        </main>
      </div>
      <AdminMobileTabbar activeTab={activeTab} onNavigate={handleNavigate} onMenu={() => setSidebarOpen(true)} adminProfile={adminProfile} />
    </div>
  );
};

export default AdminDashboardShell;
