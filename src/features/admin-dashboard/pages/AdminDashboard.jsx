import AdminDashboardLegacy, { AdminDashboard as NamedAdminDashboardLegacy } from './legacy/AdminDashboardLegacy.jsx';

// Phase 6 boundary file.
// New admin layout/controllers/modals should hang off features/admin-dashboard/*.
export function AdminDashboard(props) {
  const Component = NamedAdminDashboardLegacy || AdminDashboardLegacy;
  return <Component {...props} />;
}

export default AdminDashboard;
