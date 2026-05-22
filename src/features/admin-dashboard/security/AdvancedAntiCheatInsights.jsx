import { useMemo } from 'react';


import { ShieldAlert } from '@shared/icons/lucide-shim.jsx';


import { safeNumber } from '@shared/core/platformShared.jsx';


export const AdvancedAntiCheatInsights = ({ examResults = [] }) => {
  const risky = useMemo(() => {
    return (examResults || [])
      .map(r => {
        const warnings = safeNumber(r.antiCheatWarnings, 0);
        const logCount = Array.isArray(r.antiCheatLog) ? r.antiCheatLog.length : 0;
        const risk = warnings * 25 + logCount * 10 + (r.status === 'security_hold' ? 40 : 0) + (r.status === 'cheated' ? 70 : 0);
        return { ...r, risk: Math.min(100, risk) };
      })
      .filter(r => r.risk > 0)
      .sort((a,b)=>b.risk-a.risk)
      .slice(0, 30);
  }, [examResults]);

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-red-600">
      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><ShieldAlert className="text-red-600"/> Anti-cheat Risk Center</h2>
      <div className="space-y-3">
        {risky.map(r => (
          <div key={r.id} className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-800">{r.studentName || 'طالب'}</h3>
              <p className="text-xs text-slate-500">{r.examTitle || 'امتحان'} • تحذيرات: {safeNumber(r.antiCheatWarnings,0)}</p>
            </div>
            <div className="min-w-[180px]">
              <div className="flex justify-between text-xs font-bold mb-1"><span>Risk</span><span>{r.risk}%</span></div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className={`${r.risk >= 70 ? 'bg-red-600' : r.risk >= 40 ? 'bg-amber-500' : 'bg-emerald-500'} h-full`} style={{width:`${r.risk}%`}}></div>
              </div>
            </div>
          </div>
        ))}
        {risky.length === 0 && <p className="text-center text-slate-400 py-10 font-bold">لا توجد مخاطر غش مسجلة.</p>}
      </div>
    </div>
  );
};

export default AdvancedAntiCheatInsights;
