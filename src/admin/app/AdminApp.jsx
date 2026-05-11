import { Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ToastCenter } from '../../shared/core/platformShared.jsx';
import { DebugCollector, navigatePlatform } from '../../shared/core/debugTools.jsx';
import DesignSystemLoader from '../../shared/components/DesignSystemLoader.jsx';
import MobileExamHelperStyles from '../../shared/components/MobileExamHelperStyles.jsx';
import AppLoadingScreen from '../../shared/ui/AppLoadingScreen.jsx';
import PlatformPerformanceBooster from '../parts/PlatformPerformanceBooster.jsx';
import AppErrorBoundary from '../parts/AppErrorBoundary.jsx';
import { useAdminSession } from '../hooks/useAdminSession.js';

const AdminDashboard = lazy(() => import('../parts/AdminDashboard.jsx'));
const AuthPage = lazy(() => import('../../shared/platformParts/AuthPage.jsx'));
const AdminAccessDenied = lazy(() => import('../parts/AdminAccessDenied.jsx'));

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
    <AppErrorBoundary>
      <ToastCenter />
      <AnimatePresence mode="wait">
        <DesignSystemLoader />
        <DebugCollector user={user} />
        <PlatformPerformanceBooster />
        <MobileExamHelperStyles />
        <Suspense fallback={<AdminRouteFallback />}>
          {!user ? (
            <AuthPage key="admin-auth" onBack={() => navigatePlatform('/')} />
          ) : isAdminAccount ? (
            <AdminDashboard key="admin" user={user} adminProfile={adminProfile} />
          ) : (
            <AdminAccessDenied key="admin-denied" user={user} />
          )}
        </Suspense>
      </AnimatePresence>
    </AppErrorBoundary>
  );
}

export default AdminApp;
