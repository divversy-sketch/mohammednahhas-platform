import { StatBox } from './StatBox.jsx';

export function GrowthSuiteStatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
      <StatBox title="نشطون" value={stats.active} />
      <StatBox title="VIP" value={stats.premium} />
      <StatBox title="دفع معلق" value={stats.pendingPayments} />
      <StatBox title="أسئلة" value={stats.questionCount} />
      <StatBox title="وحدات" value={stats.units} />
      <StatBox title="تذاكر" value={stats.openTickets} />
      <StatBox title="متوسط" value={`${stats.avg}%`} />
    </div>
  );
}
