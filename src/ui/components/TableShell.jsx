import EmptyState from './EmptyState.jsx';
import SkeletonBlock from './SkeletonBlock.jsx';
import PaginationBar from './PaginationBar.jsx';
import { cx } from '../theme/tokens.js';

export default function TableShell({
  title,
  description,
  actions,
  toolbar,
  loading = false,
  empty = false,
  emptyTitle = 'لا توجد بيانات',
  emptyDescription = 'جرّب تغيير البحث أو الفلاتر.',
  pagination,
  children,
  className = '',
}) {
  return (
    <section className={cx('v2-table-shell v2-card rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur-xl', className)} dir="rtl">
      {(title || actions) && (
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            {title && <h3 className="text-xl font-black text-slate-950">{title}</h3>}
            {description && <p className="mt-1 text-sm font-bold text-slate-500">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {toolbar ? <div className="mb-4">{toolbar}</div> : null}
      {loading ? (
        <SkeletonBlock rows={5} />
      ) : empty ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="v2-table-scroll overflow-x-auto rounded-2xl border border-slate-100 bg-white">{children}</div>
      )}
      {pagination ? <PaginationBar {...pagination} /> : null}
    </section>
  );
}
