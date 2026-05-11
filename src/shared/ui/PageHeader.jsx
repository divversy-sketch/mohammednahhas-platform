

export default function PageHeader({ title, description, icon, children, tone = 'amber' }) {
  const toneClass = tone === 'blue' ? 'from-blue-100 to-white text-blue-800' : tone === 'emerald' ? 'from-emerald-100 to-white text-emerald-800' : 'from-amber-100 to-white text-amber-800';
  return (
    <div className={`bg-gradient-to-l ${toneClass} rounded-3xl p-5 md:p-6 border shadow-sm`} dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black flex items-center gap-2">{icon}{title}</h2>
          {description && <p className="text-slate-600 font-bold mt-2 leading-7">{description}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
