// src/components/admin/SubscriptionManagerPhase2.jsx
import React, { useMemo, useState } from "react";
import { CreditCard, CheckCircle, XCircle, Clock, Search } from "lucide-react";
import { buildSubscriptionSummary, getDateMs } from "../../utils/adminAnalytics";

export default function SubscriptionManagerPhase2({
  users = [],
  paymentRequests = [],
  onApproveRequest,
  onRejectRequest,
  onExtendStudent
}) {
  const [search, setSearch] = useState("");

  const summary = useMemo(
    () => buildSubscriptionSummary(users, paymentRequests),
    [users, paymentRequests]
  );

  const filteredRequests = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (paymentRequests || [])
      .filter((p) => {
        if (!s) return true;
        return (
          String(p.userName || p.studentName || "").toLowerCase().includes(s) ||
          String(p.email || p.userEmail || "").toLowerCase().includes(s) ||
          String(p.phone || "").includes(s)
        );
      })
      .sort((a, b) => getDateMs(b.createdAt) - getDateMs(a.createdAt));
  }, [paymentRequests, search]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-gradient-to-r from-amber-600 to-orange-700 text-white rounded-3xl p-6 shadow-xl">
        <h2 className="text-2xl md:text-3xl font-black mb-2">
          الاشتراكات والباقات
        </h2>
        <p className="text-amber-50">
          متابعة الطلبات، تفعيل الطلاب، وتجديد الاشتراكات.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SubStat title="نشطة" value={summary.active} icon={<CheckCircle />} tone="emerald" />
        <SubStat title="منتهية" value={summary.expired} icon={<XCircle />} tone="red" />
        <SubStat title="قيد المراجعة" value={summary.pending} icon={<Clock />} tone="amber" />
        <SubStat title="كل الطلبات" value={summary.totalPaymentRequests} icon={<CreditCard />} tone="blue" />
      </div>

      <section className="bg-white border rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <h3 className="text-xl font-black text-slate-900">
            طلبات الدفع والتفعيل
          </h3>

          <div className="relative">
            <Search className="absolute right-3 top-3 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم الطالب أو الهاتف..."
              className="pr-10 pl-4 py-3 rounded-2xl border w-full md:w-80 outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="bg-slate-50 border rounded-2xl p-8 text-center text-slate-500 font-bold">
            لا توجد طلبات مطابقة.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="border rounded-2xl p-4 bg-slate-50"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <p className="font-black text-slate-900">
                      {req.userName || req.studentName || "طالب"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {req.email || req.userEmail || "بدون بريد"} — {req.phone || "بدون هاتف"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      الباقة: {req.plan || req.packageName || "غير محددة"} — الحالة: {req.status || "pending"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onApproveRequest?.(req)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold"
                    >
                      قبول
                    </button>
                    <button
                      onClick={() => onRejectRequest?.(req)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold"
                    >
                      رفض
                    </button>
                    <button
                      onClick={() => onExtendStudent?.(req)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold"
                    >
                      تمديد يدوي
                    </button>
                  </div>
                </div>

                {req.note && (
                  <div className="mt-3 bg-white border rounded-xl p-3 text-sm text-slate-600">
                    {req.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SubStat({ title, value, icon, tone }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    red: "bg-red-50 text-red-700 border-red-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100"
  };

  return (
    <div className={`border rounded-3xl p-4 shadow-sm ${styles[tone]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-sm">{title}</span>
        {icon}
      </div>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
}
