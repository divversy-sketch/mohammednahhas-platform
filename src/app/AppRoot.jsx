import { Suspense, lazy, useEffect, useState } from 'react';
import { getBrowserAppMode, APP_MODES } from './routing/appModes.js';
import { RouteLoadingScreen } from '../shared/ui/AppLoadingScreen.jsx';

const AdminApp = lazy(() => import('../admin/app/AdminApp.jsx'));
const StudentApp = lazy(() => import('../student/app/StudentApp.jsx'));

export default function AppRoot() {
  const [mode, setMode] = useState(getBrowserAppMode);

  useEffect(() => {
    const sync = () => setMode(getBrowserAppMode());
    window.addEventListener('popstate', sync);
    window.addEventListener('nahhas-route-change', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('nahhas-route-change', sync);
    };
  }, []);

  const SelectedApp = mode === APP_MODES.admin ? AdminApp : StudentApp;

  return (
    <Suspense fallback={<RouteLoadingScreen mode={mode} />}>
      <SelectedApp />
    </Suspense>
  );
}
