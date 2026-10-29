import { useMemo } from 'react';
import { canAccessAdminTab } from '@config/adminPermissions';
import { AdminCinemaHero, computeAdminPulse } from './AdminCinema.jsx';
import { AdminInboxStrip } from './AdminInbox.jsx';

// Every admin section: a cinema banner on top (the moving poster + live numbers on the dashboard), then the section itself.
export default function AdminV2PageFrame({ activeTab, onNavigate, data = {}, adminProfile, adminName, children }) {
  const pulse = useMemo(() => computeAdminPulse(data), [data]);
  const canOpen = (tab) => !adminProfile || canAccessAdminTab(adminProfile, tab);
  return (
    <section className={`adx-page ${activeTab === 'dashboard' ? 'is-home' : ''}`}>
      <AdminCinemaHero activeTab={activeTab} onNavigate={onNavigate} pulse={pulse} adminName={adminName} canOpen={canOpen} />
      {activeTab === 'dashboard' && <AdminInboxStrip onNavigate={onNavigate} />}
      {activeTab === 'dashboard' && <div className="adx-sec-title"><h2>تفاصيل المنصة</h2><small>بحث، متابعة الطلاب، والتحليلات</small></div>}
      <div className="admin-neo-workspace adx-work" key={activeTab}>{children}</div>
    </section>
  );
}
