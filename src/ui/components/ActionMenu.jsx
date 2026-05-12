import { MoreVertical } from '../../shared/icons/lucide-shim.jsx';
import { cx } from '../theme/tokens.js';

export default function ActionMenu({ label = 'إجراءات', actions = [], className = '' }) {
  return (
    <details className={cx('v2-action-menu relative', className)} dir="rtl">
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50">
        <MoreVertical size={16} /> {label}
      </summary>
      <div className="absolute left-0 z-30 mt-2 min-w-48 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1 shadow-xl">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled={action.disabled}
            onClick={(event) => {
              event.currentTarget.closest('details')?.removeAttribute('open');
              action.onClick?.(event);
            }}
            className={cx('block w-full rounded-xl px-3 py-2 text-right text-sm font-bold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50', action.danger ? 'text-red-600' : 'text-slate-700')}
          >
            {action.label}
          </button>
        ))}
      </div>
    </details>
  );
}
