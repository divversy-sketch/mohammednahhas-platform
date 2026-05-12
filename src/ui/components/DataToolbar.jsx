import SearchInput from './SearchInput.jsx';
import FilterSelect from './FilterSelect.jsx';
import { cx } from '../theme/tokens.js';

export default function DataToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'ابحث بالاسم أو الإيميل أو الرقم...',
  filters = [],
  actions,
  meta,
  className = '',
}) {
  return (
    <div className={cx('v2-data-toolbar rounded-3xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur-xl', className)} dir="rtl">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
          {onSearchChange ? (
            <SearchInput value={searchValue} onChange={onSearchChange} placeholder={searchPlaceholder} />
          ) : null}
          {filters.map((filter) => (
            <FilterSelect key={filter.key || filter.label} {...filter} />
          ))}
        </div>
        {actions ? <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">{actions}</div> : null}
      </div>
      {meta ? <div className="mt-3 text-xs font-black text-slate-500">{meta}</div> : null}
    </div>
  );
}
