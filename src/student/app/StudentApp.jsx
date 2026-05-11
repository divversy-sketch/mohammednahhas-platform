import { Suspense, lazy, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ToastCenter } from '../../shared/core/platformShared.jsx';
import { DebugCollector } from '../../shared/core/debugTools.jsx';
import DesignSystemLoader from '../../shared/components/DesignSystemLoader.jsx';
import MobileExamHelperStyles from '../../shared/components/MobileExamHelperStyles.jsx';
import AppLoadingScreen from '../../shared/ui/AppLoadingScreen.jsx';
import { usePwaInstallPrompt } from '../../shared/pwa/usePwaInstallPrompt.js';
import { useServiceWorkerRegistration } from '../../shared/pwa/useServiceWorkerRegistration.js';
import { useStudentSession } from '../hooks/useStudentSession.js';
import PlatformPerformanceBooster from '../parts/PlatformPerformanceBooster.jsx';
import AppErrorBoundary from '../parts/AppErrorBoundary.jsx';

const StudentDashboard = lazy(() => import('../parts/StudentDashboard.jsx'));
const LandingPage = lazy(() => import('../parts/LandingPage.jsx'));
const AuthPage = lazy(() => import('../../shared/platformParts/AuthPage.jsx'));

function StudentRouteFallback() {
  return (
    <AppLoadingScreen
      title="منصة النحاس التعليمية"
      message="بنجهز الصفحة المطلوبة..."
      variant="student"
    />
  );
}

function StudentApp() {
  const [viewMode, setViewMode] = useState(() => 'landing');
  const { user, userData, isLoading } = useStudentSession();
  const { installPrompt } = usePwaInstallPrompt();

  useServiceWorkerRegistration();

  if (isLoading) {
    return (
      <AppLoadingScreen
        title="منصة النحاس التعليمية"
        message="بنجهز تجربتك التعليمية..."
        variant="student"
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
        <Suspense fallback={<StudentRouteFallback />}>
          {!user ? (
            viewMode === 'landing'
              ? <LandingPage key="landing" onAuthClick={() => setViewMode('auth')} installPrompt={installPrompt} />
              : <AuthPage key="auth" onBack={() => setViewMode('landing')} />
          ) : (
            <StudentDashboard key="student" user={user} userData={userData} installPrompt={installPrompt} />
          )}
        </Suspense>
      </AnimatePresence>
    </AppErrorBoundary>
  );
}

export default StudentApp;
