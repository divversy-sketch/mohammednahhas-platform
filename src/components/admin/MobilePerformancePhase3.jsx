// src/components/admin/MobilePerformancePhase3.jsx
import React from "react";
import { Smartphone, Gauge, CheckCircle, AlertTriangle, Zap } from "lucide-react";

export default function MobilePerformancePhase3() {
  const checks = [
    {
      title: "تقليل حجم AppShell لاحقًا",
      status: "تحسين لاحق",
      note: "الملف كبير جدًا، الأفضل تقسيمه بعد تثبيت المميزات الأساسية."
    },
    {
      title: "تحميل الصفحات عند الطلب",
      status: "مهم",
      note: "نستخدم lazy loading لاحقًا لتقليل حجم أول تحميل."
    },
    {
      title: "أزرار مناسبة للموبايل",
      status: "مفعل",
      note: "تم الحفاظ على min-height للأزرار في CSS."
    },
    {
      title: "تحسين تجربة الامتحان",
      status: "مفعل",
      note: "التسليم وملء الشاشة موجودين داخل صفحة الامتحان."
    }
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-gradient-to-r from-blue-700 to-slate-900 text-white rounded-3xl p-6 shadow-xl">
        <h2 className="text-2xl md:text-3xl font-black mb-2 flex items-center gap-2">
          <Smartphone /> تحسين الموبايل والأداء
        </h2>
        <p className="text-blue-100">
          لوحة متابعة جاهزية المنصة للموبايل وخطة تقليل الحجم بدون تغيير التصميم الحالي.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Box icon={<Smartphone />} title="الموبايل" value="جاهز مبدئيًا" />
        <Box icon={<Gauge />} title="الأداء" value="يحتاج تقسيم لاحق" />
        <Box icon={<Zap />} title="التحميل" value="مستقر" />
      </div>

      <section className="bg-white border rounded-3xl p-5 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 mb-4">خطة التحسين</h3>
        <div className="space-y-3">
          {checks.map((item, i) => (
            <div key={i} className="border rounded-2xl p-4 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <p className="font-black text-slate-900 flex items-center gap-2">
                  {item.status === "مفعل" ? <CheckCircle className="text-emerald-600" /> : <AlertTriangle className="text-amber-600" />}
                  {item.title}
                </p>
                <p className="text-sm text-slate-600 mt-1">{item.note}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-black ${
                item.status === "مفعل" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Box({ icon, title, value }) {
  return (
    <div className="bg-white border rounded-3xl p-5 shadow-sm">
      <div className="text-blue-700 mb-3">{icon}</div>
      <p className="text-sm text-slate-500 font-bold">{title}</p>
      <p className="text-xl font-black text-slate-900 mt-1">{value}</p>
    </div>
  );
}
