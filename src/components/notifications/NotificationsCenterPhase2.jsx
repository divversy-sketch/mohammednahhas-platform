// src/components/notifications/NotificationsCenterPhase2.jsx
import React, { useMemo, useState } from "react";
import { Bell, Send, Users, Megaphone, CheckCircle } from "lucide-react";

export default function NotificationsCenterPhase2({
  notifications = [],
  users = [],
  onCreateNotification,
  onMarkRead
}) {
  const [form, setForm] = useState({
    title: "",
    body: "",
    targetGrade: "all",
    type: "announcement"
  });

  const recent = useMemo(
    () =>
      (Array.isArray(notifications) ? notifications : [])
        .slice()
        .sort((a, b) => {
          const at = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
          const bt = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
          return bt - at;
        })
        .slice(0, 10),
    [notifications]
  );

  const grades = useMemo(() => {
    const set = new Set(["all"]);
    (users || []).forEach((u) => {
      if (u.grade) set.add(u.grade);
    });
    return Array.from(set);
  }, [users]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      alert("اكتب عنوان ونص الإشعار.");
      return;
    }

    onCreateNotification?.({
      ...form,
      title: form.title.trim(),
      body: form.body.trim(),
      readBy: [],
      createdAt: new Date().toISOString()
    });

    setForm({
      title: "",
      body: "",
      targetGrade: "all",
      type: "announcement"
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-900 text-white rounded-3xl p-6 shadow-xl">
        <h2 className="text-2xl md:text-3xl font-black mb-2 flex items-center gap-2">
          <Bell /> إشعارات المنصة
        </h2>
        <p className="text-blue-100">
          أرسل تنبيهات داخل المنصة للطلاب حسب الصف أو للجميع.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form
          onSubmit={submit}
          className="xl:col-span-1 bg-white border rounded-3xl p-5 shadow-sm space-y-4"
        >
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Send className="text-blue-600" /> إرسال إشعار
          </h3>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">
              العنوان
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded-2xl px-4 py-3 outline-none focus:border-blue-500"
              placeholder="مثال: امتحان جديد"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">
              نص الإشعار
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full border rounded-2xl px-4 py-3 min-h-28 outline-none focus:border-blue-500"
              placeholder="اكتب الرسالة التي ستظهر للطلاب..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">
              الصف المستهدف
            </label>
            <select
              value={form.targetGrade}
              onChange={(e) => setForm({ ...form, targetGrade: e.target.value })}
              className="w-full border rounded-2xl px-4 py-3 outline-none focus:border-blue-500"
            >
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g === "all" ? "كل الصفوف" : g}
                </option>
              ))}
            </select>
          </div>

          <button className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-2xl py-3 font-black">
            إرسال داخل المنصة
          </button>
        </form>

        <section className="xl:col-span-2 bg-white border rounded-3xl p-5 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
            <Megaphone className="text-indigo-600" /> آخر الإشعارات
          </h3>

          {recent.length === 0 ? (
            <div className="bg-slate-50 border rounded-2xl p-8 text-center text-slate-500 font-bold">
              لا توجد إشعارات حتى الآن.
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((n) => (
                <div
                  key={n.id}
                  className="bg-slate-50 border rounded-2xl p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900">{n.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{n.body}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        الصف: {n.targetGrade === "all" ? "كل الصفوف" : n.targetGrade || "كل الصفوف"}
                      </p>
                    </div>

                    <button
                      onClick={() => onMarkRead?.(n)}
                      className="bg-white border px-3 py-2 rounded-xl text-sm font-bold text-slate-700 flex items-center gap-1"
                    >
                      <CheckCircle size={16} /> تمت المراجعة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5 text-amber-800">
        <p className="font-black flex items-center gap-2 mb-1">
          <Users /> ملاحظة مهمة
        </p>
        <p className="text-sm">
          هذا نظام إشعارات داخل المنصة. يمكن لاحقًا ربطه بـ Push Notifications بعد ضبط Firebase Messaging بالكامل.
        </p>
      </div>
    </div>
  );
}
