import { Search, X } from '../../shared/icons/lucide-shim.jsx';
import { cx } from '../theme/tokens.js';

export default function SearchInput({ value = '', onChange, placeholder = 'ابحث...', className = '', clearLabel = 'مسح البحث', ...props }) {
  const setValue = (next) => {
    if (typeof onChange === 'function') onChange(next);
  };

  return (
    <label className={cx('v2-search-input relative block min-w-[220px] flex-1', className)}>
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
        <Search size={18} />
      </span>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3 pl-11 pr-11 text-sm font-bold text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100"
        {...props}
      />
      {value ? (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => setValue('')}
          className="absolute inset-y-0 left-3 my-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={16} />
        </button>
      ) : null}
    </label>
  );
}
