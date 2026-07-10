import { lazy, Suspense, useState } from 'react';
import { DebugPanel } from '@shared/core/debugTools.jsx';
import AdminHeader from '@admin/components/AdminHeader.jsx';
import AdminSidebar from '@admin/components/AdminSidebar.jsx';
import AdminLazyFallback from '@admin/dashboard/AdminLazyFallback.jsx';
import '@styles/pages/admin-neo.css';

const AdminDashboardTabs = lazy(() => import('@admin/parts/AdminDashboardTabs.jsx'));
const AdminDashboardModals = lazy(() => import('@admin/parts/AdminDashboardModals.jsx'));

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
        <main className="admin-neo-main">
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
    </div>
  );
};

export default AdminDashboardShell;
