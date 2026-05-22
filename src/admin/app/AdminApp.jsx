import { Suspense, lazy } from 'react';
import { navigatePlatform } from '../../shared/core/debugTools.jsx';
import AppLoadingScreen from '../../shared/ui/AppLoadingScreen.jsx';
import { useAdminSession } from '../hooks/useAdminSession.js';
import { AdminRoute } from '../../app/routes.jsx';

const AdminDashboardPage = lazy(() => import('../../pages/admin/DashboardPage.jsx'));
const AuthPage = lazy(() => import('../../pages/public/AuthPage.jsx'));
const AdminAccessDeniedPage = lazy(() => import('../../pages/admin/AccessDeniedPage.jsx'));

function AdminRouteFallback() {
  return (
    <AppLoadingScreen
      title="لوحة إدارة منصة النحاس"
      message="بنجهز لوحة الإدارة..."
      variant="admin"
    />
  );
}

function AdminApp() {
  const { user, adminProfile, isAdminAccount, isLoading } = useAdminSession();

  if (isLoading) {
    return (
      <AppLoadingScreen
        title="لوحة إدارة منصة النحاس"
        message="جاري التحقق من صلاحيات الإدارة..."
        variant="admin"
      />
    );
  }

  return (
    <AdminRoute user={user}>
      <Suspense fallback={<AdminRouteFallback />}>
        {!user ? (
          <AuthPage key="admin-auth" onBack={() => navigatePlatform('/')} />
        ) : isAdminAccount ? (
          <AdminDashboardPage key="admin" user={user} adminProfile={adminProfile} />
        ) : (
          <AdminAccessDeniedPage key="admin-denied" user={user} />
        )}
      </Suspense>
    </AdminRoute>
  );
}

export default AdminApp;
