import { useAdminDashboardController } from '@features/admin-dashboard/controllers/useAdminDashboardController.jsx';
import AdminDashboardShell from '@features/admin-dashboard/shell/AdminDashboardShell.jsx';

export const AdminDashboard = ({ user, adminProfile }) => {
  const controller = useAdminDashboardController({ user, adminProfile });

  return (
    <AdminDashboardShell
      user={user}
      adminProfile={adminProfile}
      {...controller}
    />
  );
};

export default AdminDashboard;
