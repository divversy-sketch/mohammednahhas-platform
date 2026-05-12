import { cx } from '../theme/tokens.js';

export default function FormField({ label, hint, error, children, className = '' }) {
  return (
    <label className={cx('v2-form-field block space-y-2', className)} dir="rtl">
      {label ? <span className="text-sm font-black text-slate-700">{label}</span> : null}
      {children}
      {error ? <span className="block text-xs font-black text-red-600">{error}</span> : null}
      {!error && hint ? <span className="block text-xs font-bold leading-6 text-slate-500">{hint}</span> : null}
    </label>
  );
}
