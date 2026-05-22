import AdminDashboardRuntime, { AdminDashboard as NamedAdminDashboardRuntime } from './AdminDashboardRuntime.jsx';

// Phase 6 boundary file.
// New admin layout/controllers/modals should hang off features/admin-dashboard/*.
export function AdminDashboard(props) {
  const Component = NamedAdminDashboardRuntime || AdminDashboardRuntime;
  return <Component {...props} />;
}

export default AdminDashboard;
