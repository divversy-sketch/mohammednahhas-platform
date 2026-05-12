import Card from './Card.jsx';

export default function MetricCard({ label, value, hint, icon, tone = 'amber' }) {
  const toneClass = {
    amber: 'bg-amber-100 text-amber-700',
    teal: 'bg-teal-100 text-teal-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    sky: 'bg-sky-100 text-sky-700',
    red: 'bg-red-100 text-red-700',
    slate: 'bg-slate-100 text-slate-700',
  }[tone] || 'bg-amber-100 text-amber-700';

  return (
    <Card hover className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-black text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
        {hint && <p className="mt-2 text-sm font-bold text-slate-500">{hint}</p>}
      </div>
      {icon && <div className={`rounded-2xl p-3 ${toneClass}`}>{icon}</div>}
    </Card>
  );
}
