const MOBILE_LABELS = {
  bottomNav: 'شريط تنقل سفلي',
  compactCards: 'كروت مختصرة',
  dataSaver: 'وضع توفير بيانات',
  examSafeMode: 'وضع امتحان آمن للموبايل',
  showInstallPrompt: 'إظهار زر تثبيت التطبيق',
};

const MOBILE_CHECKLIST = ['Dashboard مختصر', 'أزرار كبيرة', 'إخفاء الزحام أثناء الامتحان', 'تقليل تحميل PDF والفيديو عند الحاجة', 'زر تثبيت التطبيق'];

export function MobileSettingsPanel({ mobileSettings, onChange, onSave }) {
  return (
    <div className="space-y-5">
      <section className="bg-white rounded-3xl border p-5 grid md:grid-cols-2 gap-3">
        {Object.keys(mobileSettings).filter((key) => typeof mobileSettings[key] === 'boolean').map((key) => (
          <label key={key} className="bg-slate-50 rounded-2xl p-4 font-black flex gap-2">
            <input type="checkbox" checked={!!mobileSettings[key]} onChange={(event) => onChange({ ...mobileSettings, [key]: event.target.checked })} />
            {MOBILE_LABELS[key] || key}
          </label>
        ))}
        <button onClick={onSave} className="bg-slate-900 text-white rounded-xl p-3 font-black md:col-span-2">حفظ إعدادات الموبايل</button>
      </section>
      <section className="bg-white rounded-3xl border p-5">
        <h3 className="font-black mb-3">Checklist الموبايل</h3>
        {MOBILE_CHECKLIST.map((item) => <div key={item} className="border-b py-3 font-bold">✅ {item}</div>)}
      </section>
    </div>
  );
}
