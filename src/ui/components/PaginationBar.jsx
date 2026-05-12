import { ChevronLeft, ChevronRight } from '../../shared/icons/lucide-shim.jsx';
import { cx } from '../theme/tokens.js';

export default function PaginationBar({ page = 1, totalPages = 1, totalItems = 0, pageSize = 20, onPageChange, label = 'النتائج', className = '' }) {
  if (!totalItems || totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);
  const go = (next) => onPageChange?.(Math.min(totalPages, Math.max(1, next)));

  return (
    <div className={cx('v2-pagination mt-4 flex flex-col items-center justify-between gap-3 rounded-3xl border border-white/70 bg-white/80 p-3 text-sm font-black text-slate-600 shadow-sm backdrop-blur-xl sm:flex-row', className)} dir="rtl">
      <span>{label}: {start} - {end} من {totalItems}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => go(page - 1)} disabled={page <= 1} className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
          <ChevronRight size={16} /> السابق
        </button>
        <span className="rounded-2xl bg-slate-100 px-4 py-2 text-slate-800">{page} / {totalPages}</span>
        <button type="button" onClick={() => go(page + 1)} disabled={page >= totalPages} className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
          التالي <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  );
}
