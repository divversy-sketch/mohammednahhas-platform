import { useMemo } from 'react';


import { BarChart3 } from '@shared/icons/lucide-shim.jsx';


import { safeNumber } from '@shared/core/platformShared.jsx';


export const PerformanceOverview = ({ examResults = [], content = [] }) => {
  const metrics = useMemo(() => {
    const completed = examResults.filter((r) => r?.status === 'completed');
    const avg = completed.length
      ? Math.round(
          completed.reduce((acc, item) => {
            const fallback = item?.total ? (safeNumber(item.score, 0) / safeNumber(item.total, 1)) * 100 : 0;
            return acc + safeNumber(item?.percentage, fallback);
          }, 0) / completed.length
        )
      : 0;
    return { completed, avg };
  }, [examResults]);

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800"><BarChart3/> تحليل الأداء</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-4 text-center"><p className="text-slate-500 text-sm">الاختبارات المكتملة</p><p className="text-3xl font-black text-blue-600">{metrics.completed.length}</p></div>
        <div className="bg-white border rounded-2xl p-4 text-center"><p className="text-slate-500 text-sm">متوسط الأداء</p><p className="text-3xl font-black text-emerald-600">{metrics.avg}%</p></div>
        <div className="bg-white border rounded-2xl p-4 text-center"><p className="text-slate-500 text-sm">محتوى متاح للمراجعة</p><p className="text-3xl font-black text-amber-600">{content.length}</p></div>
      </div>
    </div>
  );
};

export default PerformanceOverview;
