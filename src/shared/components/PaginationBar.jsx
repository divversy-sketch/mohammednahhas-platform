export default function PaginationBar({ page, totalPages, totalItems, pageSize, onPageChange, label = 'النتائج' }) {
  if (!totalItems || totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);
  return (
    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm font-bold text-slate-600">
      <span>{label}: {start} - {end} من {totalItems}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className="rounded-xl border px-3 py-2 disabled:opacity-40">السابق</button>
        <span className="rounded-xl bg-slate-100 px-3 py-2">{page} / {totalPages}</span>
        <button type="button" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="rounded-xl border px-3 py-2 disabled:opacity-40">التالي</button>
      </div>
    </div>
  );
}
