import { cx } from '../theme/tokens.js';

export default function SkeletonBlock({ rows = 4, className = '' }) {
  return (
    <div className={cx('v2-skeleton space-y-3 rounded-3xl border border-slate-100 bg-white/70 p-4', className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}
