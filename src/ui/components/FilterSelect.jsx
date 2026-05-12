import { Filter } from '../../shared/icons/lucide-shim.jsx';
import { cx } from '../theme/tokens.js';

export default function FilterSelect({ label, value = '', onChange, options = [], className = '', ...props }) {
  return (
    <label className={cx('v2-filter-select flex min-w-[170px] flex-col gap-1 text-xs font-black text-slate-500', className)}>
      {label ? <span>{label}</span> : null}
      <span className="relative block">
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          <Filter size={16} />
        </span>
        <select
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          className="w-full appearance-none rounded-2xl border border-slate-200 bg-white/90 py-3 pl-8 pr-10 text-sm font-black text-slate-700 shadow-sm transition focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100"
          {...props}
        >
          {options.map((option) => {
            const item = typeof option === 'string' ? { value: option, label: option } : option;
            return (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            );
          })}
        </select>
      </span>
    </label>
  );
}
