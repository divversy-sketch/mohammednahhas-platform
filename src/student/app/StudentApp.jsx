import { Suspense, lazy, useState } from 'react';
import AppLoadingScreen from '../../shared/ui/AppLoadingScreen.jsx';
import { usePwaInstallPrompt } from '../../shared/pwa/usePwaInstallPrompt.js';
import { useServiceWorkerRegistration } from '../../shared/pwa/useServiceWorkerRegistration.js';
import { useStudentSession } from '../hooks/useStudentSession.js';
import { StudentRoute } from '../../app/routes.jsx';
import { StudentPortalGate } from '../../features/platform-maintenance/index.js';

const StudentDashboardPage = lazy(() => import('../../pages/student/DashboardPage.jsx'));
const LandingPage = lazy(() => import('../../pages/public/LandingPage.jsx'));
const AuthPage = lazy(() => import('../../pages/public/AuthPage.jsx'));

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
    <StudentRoute user={user}>
      <Suspense fallback={<StudentRouteFallback />}>
        {!user ? (
          viewMode === 'landing'
            ? <LandingPage key="landing" onAuthClick={() => setViewMode('auth')} installPrompt={installPrompt} />
            : <AuthPage key="auth" onBack={() => setViewMode('landing')} />
        ) : (
          <StudentPortalGate user={user}>
            <StudentDashboardPage key="student" user={user} userData={userData} installPrompt={installPrompt} />
          </StudentPortalGate>
        )}
      </Suspense>
    </StudentRoute>
  );
}

export default StudentApp;
