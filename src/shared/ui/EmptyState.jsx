

export default function EmptyState({ title = 'لا توجد بيانات', description = 'سيظهر المحتوى هنا بمجرد إضافته.', icon = '📭', action }) {
  return (
    <div className="bg-white rounded-3xl border p-8 text-center shadow-sm" dir="rtl">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="text-xl font-black text-slate-800">{title}</h3>
      <p className="text-sm font-bold text-slate-500 mt-2 leading-7">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
