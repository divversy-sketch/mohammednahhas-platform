// src/components/parent/ParentProgressPhase3.jsx
import React, { useMemo, useState } from "react";
import { Users, Search, Phone, TrendingUp, ClipboardCheck, AlertTriangle, Eye } from "lucide-react";

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getResultPercentage(result = {}) {
  if (safeNumber(result.percentage, -1) >= 0) return safeNumber(result.percentage, 0);
  const total = safeNumber(result.totalPossible || result.total, 0);
  const score = safeNumber(result.totalScore || result.score, 0);
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

function getDateMs(value) {
  if (!value) return 0;
  if (value?.seconds) return value.seconds * 1000;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function buildParentRows(users = [], results = [], mistakes = []) {
  const students = (Array.isArray(users) ? users : []).filter((u) => !u.isAdmin && u.role !== "admin");

  return students.map((student) => {
    const studentResults = (Array.isArray(results) ? results : []).filter((r) => {
      return r.studentId === student.id || r.studentId === student.uid || r.userId === student.id || r.userId === student.uid || r.studentEmail === student.email;
    });

    const completed = studentResults.filter((r) => r.status === "completed");
    const latest = completed.slice().sort((a, b) => getDateMs(b.submittedAt || b.createdAt) - getDateMs(a.submittedAt || a.createdAt))[0] || null;

    const avg = completed.length
      ? Math.round(completed.reduce((sum, r) => sum + getResultPercentage(r), 0) / completed.length)
      : 0;

    const studentMistakes = (Array.isArray(mistakes) ? mistakes : []).filter((m) => {
      return m.userId === student.id || m.userId === student.uid || m.studentId === student.id || m.studentId === student.uid;
    });

    return {
      id: student.id || student.uid || student.email,
      name: student.name || student.displayName || student.email || "طالب",
      email: student.email || "",
      phone: student.phone || student.studentPhone || "",
      parentPhone: student.parentPhone || student.guardianPhone || "",
      grade: student.grade || "",
      examsCount: completed.length,
      avg,
      latestPercentage: latest ? getResultPercentage(latest) : 0,
      latestExam: latest?.examTitle || latest?.title || "لا يوجد",
      mistakesCount: studentMistakes.length,
      status: avg >= 80 ? "ممتاز" : avg >= 60 ? "جيد" : completed.length ? "يحتاج متابعة" : "لم يبدأ"
    };
  });
}

export default function ParentProgressPhase3({
  users = [],
  results = [],
  mistakes = [],
  onOpenStudent
}) {
  const [search, setSearch] = useState("");

  const rows = useMemo(() => buildParentRows(users, results, mistakes), [users, results, mistakes]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      String(r.name).toLowerCase().includes(s) ||
      String(r.email).toLowerCase().includes(s) ||
      String(r.phone).includes(s) ||
      String(r.parentPhone).includes(s)
    );
  }, [rows, search]);

  const summary = useMemo(() => {
    const active = rows.filter((r) => r.examsCount > 0).length;
    const weak = rows.filter((r) => r.status === "يحتاج متابعة").length;
    const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.avg, 0) / rows.length) : 0;
    return { total: rows.length, active, weak, avg };
  }, [rows]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-gradient-to-r from-indigo-700 to-slate-900 text-white rounded-3xl p-6 shadow-xl">
        <h2 className="text-2xl md:text-3xl font-black mb-2 flex items-center gap-2">
          <Users /> متابعة ولي الأمر
        </h2>
        <p className="text-indigo-100">
          صفحة متابعة سريعة تعرض مستوى الطالب، آخر نتيجة، الأخطاء، وبيانات التواصل مع ولي الأمر.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat title="إجمالي الطلاب" value={summary.total} icon={<Users />} />
        <Stat title="طلاب نشطون" value={summary.active} icon={<ClipboardCheck />} />
        <Stat title="يحتاجون متابعة" value={summary.weak} icon={<AlertTriangle />} />
        <Stat title="متوسط عام" value={`${summary.avg}%`} icon={<TrendingUp />} />
      </div>

      <section className="bg-white border rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <h3 className="text-xl font-black text-slate-900">قائمة متابعة الطلاب</h3>
          <div className="relative">
            <Search className="absolute right-3 top-3 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم الطالب أو رقم ولي الأمر..."
              className="pr-10 pl-4 py-3 rounded-2xl border w-full md:w-96 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-slate-50 border rounded-2xl p-8 text-center text-slate-500 font-bold">
            لا توجد بيانات مطابقة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="text-slate-500 border-b">
                  <th className="py-3">الطالب</th>
                  <th className="py-3">الصف</th>
                  <th className="py-3">ولي الأمر</th>
                  <th className="py-3">امتحانات</th>
                  <th className="py-3">المتوسط</th>
                  <th className="py-3">آخر امتحان</th>
                  <th className="py-3">أخطاء</th>
                  <th className="py-3">الحالة</th>
                  <th className="py-3">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-3 font-black text-slate-900">{row.name}</td>
                    <td className="py-3 text-slate-600">{row.grade || "غير محدد"}</td>
                    <td className="py-3 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Phone size={14} />
                        {row.parentPhone || row.phone || "غير مسجل"}
                      </div>
                    </td>
                    <td className="py-3 font-bold">{row.examsCount}</td>
                    <td className="py-3 font-black text-indigo-700">{row.avg}%</td>
                    <td className="py-3">
                      <div>
                        <p className="font-bold text-slate-700">{row.latestExam}</p>
                        <p className="text-xs text-slate-400">{row.latestPercentage}%</p>
                      </div>
                    </td>
                    <td className="py-3 font-bold text-red-600">{row.mistakesCount}</td>
                    <td className="py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${
                        row.status === "ممتاز"
                          ? "bg-emerald-50 text-emerald-700"
                          : row.status === "جيد"
                            ? "bg-blue-50 text-blue-700"
                            : row.status === "يحتاج متابعة"
                              ? "bg-red-50 text-red-700"
                              : "bg-slate-100 text-slate-600"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => onOpenStudent?.(row)}
                        className="bg-slate-900 text-white px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1"
                      >
                        <Eye size={14} /> فتح
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ title, value, icon }) {
  return (
    <div className="bg-white border rounded-3xl p-4 shadow-sm">
      <div className="flex items-center justify-between text-indigo-700 mb-3">
        <span className="font-bold text-sm">{title}</span>
        {icon}
      </div>
      <p className="text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}
