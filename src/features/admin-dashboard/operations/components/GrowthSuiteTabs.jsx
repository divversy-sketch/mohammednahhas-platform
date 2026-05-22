export function GrowthSuiteTabs({ tabs = [], activeTab, onChange }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`rounded-2xl border p-3 text-sm font-black transition ${activeTab === key ? 'bg-amber-500 text-slate-950 border-amber-500 shadow' : 'bg-white text-slate-700 hover:bg-amber-50'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
