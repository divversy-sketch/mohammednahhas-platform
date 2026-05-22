import { Suspense } from 'react';

export const LazyPanelFallback = () => (
  <div className="rounded-3xl border border-amber-100 bg-white/80 p-6 text-center text-sm font-bold text-amber-700 shadow-sm">
    جاري تحميل الجزء المطلوب...
  </div>
);

export default function LazyPanel({ children }) {
  return <Suspense fallback={<LazyPanelFallback />}>{children}</Suspense>;
}
