import { cx } from '../theme/tokens.js';

const tones = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  neutral: 'bg-slate-50 text-slate-700 border-slate-200',
};

export default function StatusBadge({ tone = 'neutral', children, className = '' }) {
  return (
    <span className={cx('inline-flex items-center rounded-full border px-3 py-1 text-xs font-black', tones[tone] || tones.neutral, className)}>
      {children}
    </span>
  );
}
