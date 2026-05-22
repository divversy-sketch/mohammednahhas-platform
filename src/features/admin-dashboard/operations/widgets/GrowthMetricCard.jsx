export default function GrowthMetricCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs font-bold text-slate-400">{hint}</p>}
    </div>
  );
}
