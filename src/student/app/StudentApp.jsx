import React, { useState } from 'react';
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
import StudentDashboard from '../parts/StudentDashboard.jsx';
import LandingPage from '../parts/LandingPage.jsx';
import AuthPage from '../../shared/platformParts/AuthPage.jsx';
import AppErrorBoundary from '../parts/AppErrorBoundary.jsx';

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
        {!user ? (
          viewMode === 'landing'
            ? <LandingPage key="landing" onAuthClick={() => setViewMode('auth')} installPrompt={installPrompt} />
            : <AuthPage key="auth" onBack={() => setViewMode('landing')} />
        ) : (
          <StudentDashboard key="student" user={user} userData={userData} installPrompt={installPrompt} />
        )}
      </AnimatePresence>
    </AppErrorBoundary>
  );
}

export default StudentApp;
