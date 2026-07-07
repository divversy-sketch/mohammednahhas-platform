import { Suspense, lazy, useMemo, useState } from 'react';
import AppLoadingScreen from '../../shared/ui/AppLoadingScreen.jsx';
import { usePwaInstallPrompt } from '../../shared/pwa/usePwaInstallPrompt.js';
import { useServiceWorkerRegistration } from '../../shared/pwa/useServiceWorkerRegistration.js';
import { useStudentSession } from '../hooks/useStudentSession.js';
import StudentLayout from '../../layouts/StudentLayout.jsx';

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
  const initialPublicMode = useMemo(() => {
    if (typeof window === 'undefined') return 'landing';
    if (window.location.pathname === '/login') return 'auth-login';
    if (window.location.pathname === '/register') return 'auth-register';
    return 'landing';
  }, []);
  const [viewMode, setViewMode] = useState(() => initialPublicMode);
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
    <StudentLayout user={user}>
      <Suspense fallback={<StudentRouteFallback />}>
        {!user ? (
          viewMode === 'landing'
            ? <LandingPage
                key="landing"
                onAuthClick={(mode = 'login') => setViewMode(mode === 'register' ? 'auth-register' : 'auth-login')}
                onRegisterClick={() => setViewMode('auth-register')}
                installPrompt={installPrompt}
              />
            : <AuthPage
                key={viewMode}
                initialMode={viewMode === 'auth-register' ? 'register' : 'login'}
                onBack={() => setViewMode('landing')}
              />
        ) : (
          <StudentDashboardPage key="student" user={user} userData={userData} installPrompt={installPrompt} />
        )}
      </Suspense>
    </StudentLayout>
  );
}

export default StudentApp;
