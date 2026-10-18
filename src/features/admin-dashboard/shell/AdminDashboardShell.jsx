import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { DebugPanel } from '@shared/core/debugTools.jsx';
import { canAccessAdminTab } from '@config/adminPermissions';
import AdminLazyFallback from '@admin/dashboard/AdminLazyFallback.jsx';
import { Icon } from '@v2/ui/Icon.jsx';
import { AdminCinemaNav, AdminPalette, AdminSectionsSheet, ADMIN_TAB_ICON, tabLabel, useAdminGroups } from '@admin/v2/AdminCinema.jsx';
import '@styles/pages/admin-neo.css';
import '@styles/pages/admin-cinema.css';
import '@v2/styles/cinema.css';

const AdminDashboardTabs = lazy(() => import('@admin/parts/AdminDashboardTabs.jsx'));
const AdminDashboardModals = lazy(() => import('@admin/parts/AdminDashboardModals.jsx'));

const MOBILE_TABS = ['dashboard', 'all_users', 'payments', 'exams'];
const SHORT = { dashboard: 'القيادة', all_users: 'الطلاب', payments: 'المدفوعات', exams: 'الامتحانات' };

// Phone only: the four busiest sections + «كل الأقسام».
function AdminMobileTabbar({ activeTab, onNavigate, onMenu, adminProfile }) {
  const tabs = MOBILE_TABS.filter((tab) => canAccessAdminTab(adminProfile, tab));
  const inBar = tabs.includes(activeTab);
  return (
    <nav className="admin-neo-tabbar adx-tabbar" aria-label="أهم الأقسام">
      {tabs.map((tab) => (
        <button key={tab} type="button" aria-current={activeTab === tab ? 'page' : undefined} onClick={() => onNavigate(tab)}>
          <i><Icon name={ADMIN_TAB_ICON[tab] || 'layers'} /></i><span>{SHORT[tab] || tabLabel(tab)}</span>
        </button>
      ))}
      <button type="button" aria-current={!inBar ? 'page' : undefined} onClick={onMenu}><i><Icon name="menu" /></i><span>كل الأقسام</span></button>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const groups = useAdminGroups(adminProfile);

  const handleNavigate = useCallback((tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  }, [setActiveTab]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK')) { e.preventDefault(); setPaletteOpen((v) => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const alerts = (dashboardContext?.pendingUsers?.length || 0) + (dashboardContext?.passwordResetRequests?.length || 0);

  return (
    <div className="admin-neo-shell adx" dir="rtl">
      <DebugPanel user={user} />
      <Suspense fallback={<AdminLazyFallback />}>
        <AdminDashboardModals ctx={dashboardContext} />
      </Suspense>
      <AdminCinemaNav
        activeTab={activeTab}
        onNavigate={handleNavigate}
        groups={groups}
        adminProfile={adminProfile}
        grade={adminGradeFilter}
        setGrade={setAdminGradeFilter}
        alerts={alerts}
        onSearch={() => setPaletteOpen(true)}
        onMenu={() => setMenuOpen(true)}
      />
      <main className="adx-main nx-bridge">
        <Suspense fallback={<AdminLazyFallback />}>
          <AdminDashboardTabs ctx={{ ...dashboardContext, setActiveTab: handleNavigate }} />
        </Suspense>
      </main>
      <AdminMobileTabbar activeTab={activeTab} onNavigate={handleNavigate} onMenu={() => setMenuOpen(true)} adminProfile={adminProfile} />
      <AdminSectionsSheet open={menuOpen} onClose={() => setMenuOpen(false)} groups={groups} activeTab={activeTab} onNavigate={handleNavigate} />
      <AdminPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} groups={groups} onNavigate={handleNavigate} />
    </div>
  );
};

export default AdminDashboardShell;
