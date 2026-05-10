import React, { Suspense, lazy, useEffect, useState } from 'react';
import { RouteLoadingScreen } from '../shared/ui/AppLoadingScreen.jsx';

const AdminApp = lazy(() => import('../admin/app/AdminApp.jsx'));
const StudentApp = lazy(() => import('../student/app/StudentApp.jsx'));

const getRouteMode = () => {
  if (typeof window === 'undefined') return 'student';
  const path = window.location.pathname || '/';
  return path.startsWith('/admin') ? 'admin' : 'student';
};

export default function AppRoot() {
  const [mode, setMode] = useState(getRouteMode);

  useEffect(() => {
    const sync = () => setMode(getRouteMode());
    window.addEventListener('popstate', sync);
    window.addEventListener('nahhas-route-change', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('nahhas-route-change', sync);
    };
  }, []);

  const SelectedApp = mode === 'admin' ? AdminApp : StudentApp;

  return (
    <Suspense fallback={<RouteLoadingScreen mode={mode} />}>
      <SelectedApp />
    </Suspense>
  );
}
