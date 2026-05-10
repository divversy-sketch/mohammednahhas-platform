import React, { Suspense, lazy, useEffect, useState } from 'react';

const AdminApp = lazy(() => import('../admin/AdminApp.jsx'));
const StudentApp = lazy(() => import('../student/StudentApp.jsx'));

const getRouteMode = () => {
  if (typeof window === 'undefined') return 'student';
  const path = window.location.pathname || '/';
  return path.startsWith('/admin') ? 'admin' : 'student';
};

const RouteLoader = ({ mode }) => (
  <div className="h-screen flex items-center justify-center font-['Cairo'] bg-slate-50" dir="rtl">
    <div className="bg-white border border-slate-100 rounded-3xl shadow-xl p-8 w-[88%] max-w-sm text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-500 mx-auto mb-4 animate-pulse" />
      <h2 className="text-xl font-black text-slate-900 mb-2">منصة النحاس التعليمية</h2>
      <p className="text-slate-500 font-bold">
        {mode === 'admin' ? 'جاري تحميل لوحة الإدارة...' : 'جاري تحميل واجهة الطالب...'}
      </p>
    </div>
  </div>
);

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
    <Suspense fallback={<RouteLoader mode={mode} />}>
      <SelectedApp />
    </Suspense>
  );
}
