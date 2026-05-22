export function StatBox({ title, value }) {
  return (
    <div className="rounded-3xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-black text-slate-500 mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}
