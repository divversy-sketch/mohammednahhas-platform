import { lazy, Suspense } from 'react';
import { FloatingArabicBackground } from '@features/home/HomeWidgets';
import { DebugPanel } from '@shared/core/debugTools.jsx';
import AdminHeader from '@admin/components/AdminHeader.jsx';
import AdminSidebar from '@admin/components/AdminSidebar.jsx';
import AdminLazyFallback from '@admin/dashboard/AdminLazyFallback.jsx';

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
}) => (
  <div className="v2-admin-shell font-['Cairo'] relative overflow-x-hidden" dir="rtl">
    <DebugPanel user={user} />
    <FloatingArabicBackground />

    <Suspense fallback={<AdminLazyFallback />}>
      <AdminDashboardModals ctx={dashboardContext} />
    </Suspense>

    <AdminHeader adminGradeFilter={adminGradeFilter} setAdminGradeFilter={setAdminGradeFilter} />

    <div className="v2-admin-grid grid grid-cols-1 gap-5 p-4 md:p-6 relative z-10">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} adminProfile={adminProfile} />

      <Suspense fallback={<AdminLazyFallback />}>
        <AdminDashboardTabs ctx={dashboardContext} />
      </Suspense>
    </div>
  </div>
);

export default AdminDashboardShell;
