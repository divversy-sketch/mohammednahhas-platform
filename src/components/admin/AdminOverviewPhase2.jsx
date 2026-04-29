// src/components/admin/AdminOverviewPhase2.jsx
import React, { useMemo } from "react";
import {
  Users,
  ClipboardCheck,
  CreditCard,
  Radio,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { buildAdminOverview } from "../../utils/adminAnalytics";

export default function AdminOverviewPhase2({
  users = [],
  results = [],
  paymentRequests = [],
  liveSessions = [],
  content = [],
  mistakes = [],
  onOpenStudents,
  onOpenPayments,
  onOpenResults,
  onOpenContent
}) {
  const overview = useMemo(
    () =>
      buildAdminOverview({
        users,
        results,
        paymentRequests,
        liveSessions,
        content,
        mistakes
      }),
    [users, results, paymentRequests, liveSessions, content, mistakes]
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-xl">
        <h2 className="text-2xl md:text-3xl font-black mb-2">
          لوحة إدارة المنصة
        </h2>
        <p className="text-blue-100">
          نظرة سريعة على الطلاب، النتائج، الاشتراكات، والمحتوى.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStat
          title="إجمالي الطلاب"
          value={overview.totalStudents}
          icon={<Users />}
          tone="bg-blue-50 text-blue-700 border-blue-100"
          onClick={onOpenStudents}
        />
        <AdminStat
          title="نشطون هذا الشهر"
          value={overview.activeStudents}
          icon={<TrendingUp />}
          tone="bg-emerald-50 text-emerald-700 border-emerald-100"
          onClick={onOpenStudents}
        />
        <AdminStat
          title="طلبات اشتراك"
          value={overview.pendingPayments}
          icon={<CreditCard />}
          tone="bg-amber-50 text-amber-700 border-amber-100"
          onClick={onOpenPayments}
        />
        <AdminStat
          title="محاضرات نشطة"
          value={overview.activeSessions}
          icon={<Radio />}
          tone="bg-red-50 text-red-700 border-red-100"
        />
        <AdminStat
          title="عدد النتائج"
          value={overview.totalResults}
          icon={<ClipboardCheck />}
          tone="bg-indigo-50 text-indigo-700 border-indigo-100"
          onClick={onOpenResults}
        />
        <AdminStat
          title="نتائج هذا الشهر"
          value={overview.thisMonthResults}
          icon={<BarChart3 />}
          tone="bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100"
          onClick={onOpenResults}
        />
        <AdminStat
          title="متوسط النتائج"
          value={`${overview.avgScore}%`}
          icon={<TrendingUp />}
          tone="bg-teal-50 text-teal-700 border-teal-100"
          onClick={onOpenResults}
        />
        <AdminStat
          title="المحتوى"
          value={overview.contentCount}
          icon={<BookOpen />}
          tone="bg-orange-50 text-orange-700 border-orange-100"
          onClick={onOpenContent}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel title="طلاب يحتاجون متابعة" icon={<AlertTriangle />}>
          {overview.weakStudents.length === 0 ? (
            <EmptyState text="لا توجد نتائج ضعيفة واضحة حاليًا." />
          ) : (
            <div className="space-y-3">
              {overview.weakStudents.map((s, i) => (
                <div
                  key={`${s.studentId}-${i}`}
                  className="bg-red-50 border border-red-100 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-red-900">{s.studentName}</p>
                      <p className="text-xs text-red-700">{s.examTitle}</p>
                    </div>
                    <span className="font-black text-red-700 text-lg">
                      {s.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="أكثر الفروع أخطاءً" icon={<BarChart3 />}>
          {overview.weakBranches.length === 0 ? (
            <EmptyState text="لا توجد أخطاء مجمعة كافية حتى الآن." />
          ) : (
            <div className="space-y-3">
              {overview.weakBranches.map((b) => (
                <div
                  key={b.branch}
                  className="bg-slate-50 border rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-black text-slate-900">{b.branch}</p>
                    <span className="text-red-600 font-black">
                      {b.wrong} خطأ
                    </span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden border">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${Math.min(100, b.wrong * 8)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="آخر النتائج" icon={<ClipboardCheck />}>
        {overview.recentResults.length === 0 ? (
          <EmptyState text="لا توجد نتائج حديثة." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="text-slate-500 border-b">
                  <th className="py-3">الطالب</th>
                  <th className="py-3">الامتحان</th>
                  <th className="py-3">النتيجة</th>
                  <th className="py-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentResults.map((r, i) => (
                  <tr key={r.id || i} className="border-b last:border-0">
                    <td className="py-3 font-bold text-slate-800">
                      {r.studentName || r.userName || "طالب"}
                    </td>
                    <td className="py-3 text-slate-600">
                      {r.examTitle || r.title || "امتحان"}
                    </td>
                    <td className="py-3 font-black text-blue-700">
                      {r.percentage ?? 0}%
                    </td>
                    <td className="py-3">
                      <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                        مكتمل
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function AdminStat({ title, value, icon, tone, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-right border rounded-3xl p-4 shadow-sm hover:shadow-md transition ${tone}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-sm">{title}</span>
        <span className="opacity-80">{icon}</span>
      </div>
      <p className="text-3xl font-black">{value}</p>
    </button>
  );
}

function Panel({ title, icon, children }) {
  return (
    <section className="bg-white rounded-3xl border shadow-sm p-5">
      <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-4">
        <span className="text-blue-600">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function EmptyState({ text }) {
  return (
    <div className="bg-slate-50 border rounded-2xl p-6 text-center text-slate-500 font-bold">
      {text}
    </div>
  );
}
