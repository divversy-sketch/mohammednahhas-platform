import { cx } from '../theme/tokens.js';

export default function EmptyState({ title = 'لا توجد بيانات', description = 'سيظهر المحتوى هنا بمجرد إضافته.', icon = '📭', action, className = '' }) {
  return (
    <div className={cx('v2-empty-state rounded-3xl border border-dashed border-slate-200 bg-white/75 p-8 text-center shadow-sm backdrop-blur-xl', className)} dir="rtl">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-4xl">{icon}</div>
      <h3 className="text-xl font-black text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm font-bold leading-7 text-slate-500">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
