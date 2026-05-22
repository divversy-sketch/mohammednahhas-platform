export function GrowthSuiteHeader({ onExport }) {
  return (
    <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black">مركز التشغيل الشامل</h2>
          <p className="text-slate-300 font-bold mt-2">الـ 7 أفكار هنا شغالة كأدوات فعلية: إنشاء، تعديل حالة، إرسال، استيراد، تصدير، وردود دعم.</p>
        </div>
        <button onClick={onExport} className="bg-amber-500 text-slate-950 rounded-2xl px-5 py-3 font-black hover:bg-amber-400">تصدير ملخص التشغيل Excel</button>
      </div>
    </div>
  );
}
