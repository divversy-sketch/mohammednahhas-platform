import React, { useMemo, useState } from "react";
import {
  Users,
  Search,
  Phone,
  TrendingUp,
  ClipboardCheck,
  AlertTriangle,
  Eye,
  MessageCircle,
  PlayCircle,
  Clock,
  Calendar,
  Video,
  FileText,
  Activity
} from "lucide-react";

const safeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getDateMs = (value) => {
  if (!value) return 0;
  if (value?.seconds) return value.seconds * 1000;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
};

const formatDate = (value) => {
  const ms = getDateMs(value);
  if (!ms) return "غير متاح";
  return new Date(ms).toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatDuration = (seconds) => {
  const total = Math.max(0, Math.round(safeNumber(seconds, 0)));
  if (total < 60) return `${total} ثانية`;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts = [];
  if (h) parts.push(`${h} ساعة`);
  if (m) parts.push(`${m} دقيقة`);
  if (!h && !m && s) parts.push(`${s} ثانية`);
  return parts.join(" و ") || "0 ثانية";
};

const normalizePhoneForWhatsApp = (phone = "") => {
  let p = String(phone || "").replace(/\D/g, "");
  if (!p) return "";
  if (p.startsWith("0")) p = "20" + p.slice(1);
  if (!p.startsWith("20") && p.length === 10) p = "20" + p;
  return p;
};

const getResultPercentage = (result = {}) => {
  if (safeNumber(result.percentage, -1) >= 0) return safeNumber(result.percentage, 0);
  const total = safeNumber(result.totalPossible || result.total, 0);
  const score = safeNumber(result.totalScore || result.score, 0);
  return total > 0 ? Math.round((score / total) * 100) : 0;
};

const getWatchedPercent = (view = {}, contentItem = {}) => {
  const watched = safeNumber(view.watchedSeconds || view.totalSeconds || view.seconds, 0);
  const duration = safeNumber(
    view.estimatedDuration ||
      view.durationSeconds ||
      contentItem.durationSeconds ||
      safeNumber(contentItem.estimatedDurationMinutes, 0) * 60,
    0
  );
  return duration > 0 ? Math.min(100, Math.round((watched / duration) * 100)) : safeNumber(view.watchedPercent, 0);
};

const buildStudentRows = ({ users = [], results = [], mistakes = [], videoViews = [], content = [] }) => {
  const contentById = {};
  (Array.isArray(content) ? content : []).forEach((item) => {
    if (item?.id) contentById[item.id] = item;
  });

  return (Array.isArray(users) ? users : [])
    .filter((u) => !u.isAdmin && u.role !== "admin")
    .map((student) => {
      const studentId = student.id || student.uid || student.userId;
      const studentEmail = student.email || "";

      const studentResults = (Array.isArray(results) ? results : [])
        .filter((r) =>
          r.studentId === studentId ||
          r.userId === studentId ||
          r.studentEmail === studentEmail ||
          r.userEmail === studentEmail
        )
        .filter((r) => r.status === "completed");

      const sortedResults = studentResults
        .slice()
        .sort((a, b) => getDateMs(b.submittedAt || b.createdAt) - getDateMs(a.submittedAt || a.createdAt));

      const latestResult = sortedResults[0] || null;

      const avg = sortedResults.length
        ? Math.round(sortedResults.reduce((sum, r) => sum + getResultPercentage(r), 0) / sortedResults.length)
        : 0;

      const studentMistakes = (Array.isArray(mistakes) ? mistakes : []).filter((m) =>
        m.userId === studentId ||
        m.studentId === studentId ||
        m.userEmail === studentEmail
      );

      const studentVideoViews = (Array.isArray(videoViews) ? videoViews : [])
        .filter((v) =>
          v.userId === studentId ||
          v.studentId === studentId ||
          v.userEmail === studentEmail
        )
        .map((v) => {
          const item = contentById[v.videoId] || contentById[v.contentId] || {};
          const watchedSeconds = safeNumber(v.watchedSeconds || v.totalSeconds || v.seconds, 0);
          const durationSeconds = safeNumber(
            v.estimatedDuration ||
              v.durationSeconds ||
              item.durationSeconds ||
              safeNumber(item.estimatedDurationMinutes, 0) * 60,
            0
          );
          return {
            ...v,
            title: v.videoTitle || item.title || "فيديو بدون عنوان",
            watchedSeconds,
            durationSeconds,
            watchedPercent: getWatchedPercent(v, item),
            lastViewedAt: v.viewedAt || v.updatedAt || v.createdAt || null
          };
        })
        .sort((a, b) => getDateMs(b.lastViewedAt) - getDateMs(a.lastViewedAt));

      const activeDays = new Set([
        ...sortedResults.map((r) => {
          const ms = getDateMs(r.submittedAt || r.createdAt);
          return ms ? new Date(ms).toDateString() : "";
        }),
        ...studentVideoViews.map((v) => {
          const ms = getDateMs(v.lastViewedAt);
          return ms ? new Date(ms).toDateString() : "";
        })
      ].filter(Boolean)).size;

      const lastActivityMs = Math.max(
        getDateMs(latestResult?.submittedAt || latestResult?.createdAt),
        ...studentVideoViews.map((v) => getDateMs(v.lastViewedAt)),
        getDateMs(student.lastLoginAt || student.lastSeenAt || student.updatedAt)
      );

      const totalWatchSeconds = studentVideoViews.reduce((sum, v) => sum + safeNumber(v.watchedSeconds, 0), 0);
      const completedVideos = studentVideoViews.filter((v) => safeNumber(v.watchedPercent, 0) >= 80).length;

      const weakBranches = {};
      sortedResults.forEach((result) => {
        const stats = result.branchStats || result.performanceAnalysis?.branchStats || {};
        Object.entries(stats).forEach(([branch, data]) => {
          const wrong = safeNumber(data.wrong, 0);
          if (wrong > 0) weakBranches[branch] = (weakBranches[branch] || 0) + wrong;
        });
      });

      const weakBranchesText = Object.entries(weakBranches)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([branch, count]) => `${branch} (${count} أخطاء)`)
        .join("، ");

      const status =
        avg >= 80
          ? "ممتاز"
          : avg >= 60
            ? "جيد"
            : sortedResults.length
              ? "يحتاج متابعة"
              : "لم يبدأ";

      return {
        id: studentId || studentEmail,
        name: student.name || student.displayName || studentEmail || "طالب",
        email: studentEmail,
        phone: student.phone || student.studentPhone || "",
        parentPhone: student.parentPhone || student.guardianPhone || "",
        grade: student.grade || "",
        examsCount: sortedResults.length,
        avg,
        latestResult,
        latestPercentage: latestResult ? getResultPercentage(latestResult) : 0,
        latestExam: latestResult?.examTitle || latestResult?.title || "لا يوجد",
        latestResultDate: latestResult?.submittedAt || latestResult?.createdAt || null,
        mistakesCount: studentMistakes.length,
        videoViews: studentVideoViews,
        watchedVideosCount: studentVideoViews.length,
        completedVideos,
        totalWatchSeconds,
        activeDays,
        lastActivityMs,
        weakBranchesText,
        status
      };
    });
};

const buildWhatsAppMessage = (row) => {
  const latest = row.latestResult
    ? `${row.latestExam} - ${row.latestPercentage}% بتاريخ ${formatDate(row.latestResultDate)}`
    : "لا توجد نتيجة امتحان حتى الآن";

  const videosText = row.videoViews.length
    ? row.videoViews
        .slice(0, 5)
        .map((v, i) => {
          const duration = v.durationSeconds ? ` من ${formatDuration(v.durationSeconds)}` : "";
          return `${i + 1}) ${v.title}: شاهد ${formatDuration(v.watchedSeconds)}${duration} (${v.watchedPercent || 0}%)`;
        })
        .join("\n")
    : "لا توجد مشاهدات فيديو مسجلة حتى الآن";

  return `تقرير متابعة الطالب: ${row.name}

الحالة العامة: ${row.status}
متوسط الأداء: ${row.avg}%
عدد الامتحانات: ${row.examsCount}
آخر نتيجة: ${latest}
عدد أيام فتح/استخدام المنصة: ${row.activeDays}
آخر نشاط: ${row.lastActivityMs ? formatDate(row.lastActivityMs) : "غير متاح"}
الأخطاء المحفوظة للمراجعة: ${row.mistakesCount}
الفروع التي تحتاج متابعة: ${row.weakBranchesText || "لا توجد فروع ضعيفة واضحة"}

مشاهدة الفيديوهات:
${videosText}

منصة النحاس التعليمية`;
};

const getWhatsAppLink = (row) => {
  const phone = normalizePhoneForWhatsApp(row.parentPhone || row.phone);
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppMessage(row))}`;
};

export default function ParentProgressPhase3({
  users = [],
  results = [],
  mistakes = [],
  videoViews = [],
  content = [],
  onOpenStudent
}) {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const rows = useMemo(
    () => buildStudentRows({ users, results, mistakes, videoViews, content }),
    [users, results, mistakes, videoViews, content]
  );

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
    const active = rows.filter((r) => r.activeDays > 0 || r.examsCount > 0 || r.watchedVideosCount > 0).length;
    const weak = rows.filter((r) => r.status === "يحتاج متابعة").length;
    const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.avg, 0) / rows.length) : 0;
    const watchSeconds = rows.reduce((s, r) => s + r.totalWatchSeconds, 0);
    return { total: rows.length, active, weak, avg, watchSeconds };
  }, [rows]);

  const openWhatsApp = (row) => {
    const link = getWhatsAppLink(row);
    if (!link) {
      alert("لا يوجد رقم ولي أمر أو رقم طالب صالح لإرسال واتساب.");
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-gradient-to-r from-indigo-700 to-slate-900 text-white rounded-3xl p-6 shadow-xl">
        <h2 className="text-2xl md:text-3xl font-black mb-2 flex items-center gap-2">
          <Users /> متابعة ولي الأمر
        </h2>
        <p className="text-indigo-100">
          تقرير كامل عن الطالب: النتائج، أيام استخدام المنصة، مشاهدة الفيديوهات، الأخطاء، ورابط واتساب جاهز لولي الأمر.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat title="إجمالي الطلاب" value={summary.total} icon={<Users />} />
        <Stat title="طلاب نشطون" value={summary.active} icon={<Activity />} />
        <Stat title="يحتاجون متابعة" value={summary.weak} icon={<AlertTriangle />} />
        <Stat title="متوسط عام" value={`${summary.avg}%`} icon={<TrendingUp />} />
        <Stat title="إجمالي مشاهدة" value={formatDuration(summary.watchSeconds)} icon={<Clock />} />
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
                  <th className="py-3">ولي الأمر</th>
                  <th className="py-3">آخر نتيجة</th>
                  <th className="py-3">أيام النشاط</th>
                  <th className="py-3">الفيديوهات</th>
                  <th className="py-3">مشاهدة</th>
                  <th className="py-3">أخطاء</th>
                  <th className="py-3">الحالة</th>
                  <th className="py-3">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-3">
                      <p className="font-black text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-400">{row.grade || "غير محدد"}</p>
                    </td>
                    <td className="py-3 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Phone size={14} />
                        {row.parentPhone || row.phone || "غير مسجل"}
                      </div>
                    </td>
                    <td className="py-3">
                      <p className="font-black text-indigo-700">{row.latestPercentage}%</p>
                      <p className="text-xs text-slate-500">{row.latestExam}</p>
                    </td>
                    <td className="py-3 font-bold text-slate-700">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {row.activeDays}
                      </div>
                    </td>
                    <td className="py-3 font-bold text-blue-700">{row.watchedVideosCount}</td>
                    <td className="py-3 text-slate-700">{formatDuration(row.totalWatchSeconds)}</td>
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
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(row)}
                          className="bg-slate-900 text-white px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1"
                        >
                          <Eye size={14} /> التفاصيل
                        </button>
                        <button
                          type="button"
                          onClick={() => openWhatsApp(row)}
                          className="bg-green-600 text-white px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1"
                        >
                          <MessageCircle size={14} /> واتساب
                        </button>
                        {onOpenStudent && (
                          <button
                            type="button"
                            onClick={() => onOpenStudent(row)}
                            className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-xl font-bold text-xs"
                          >
                            فتح
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedStudent && (
        <StudentDetailsModal
          row={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onWhatsApp={() => openWhatsApp(selectedStudent)}
        />
      )}
    </div>
  );
}

function StudentDetailsModal({ row, onClose, onWhatsApp }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-t-3xl">
          <div>
            <h3 className="text-2xl font-black text-slate-900">{row.name}</h3>
            <p className="text-sm text-slate-500">تقرير متابعة كامل لولي الأمر</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onWhatsApp} className="bg-green-600 text-white px-4 py-2 rounded-xl font-black flex items-center gap-2">
              <MessageCircle size={18} /> إرسال واتساب
            </button>
            <button onClick={onClose} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black">
              إغلاق
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Mini title="المتوسط" value={`${row.avg}%`} />
            <Mini title="آخر نتيجة" value={`${row.latestPercentage}%`} />
            <Mini title="الامتحانات" value={row.examsCount} />
            <Mini title="أيام النشاط" value={row.activeDays} />
            <Mini title="الأخطاء" value={row.mistakesCount} />
          </div>

          <section className="border rounded-3xl p-5 bg-slate-50">
            <h4 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
              <ClipboardCheck className="text-indigo-600" /> آخر نتيجة امتحان
            </h4>
            <div className="bg-white border rounded-2xl p-4">
              <p className="font-black text-slate-900">{row.latestExam}</p>
              <p className="text-indigo-700 font-black text-2xl mt-1">{row.latestPercentage}%</p>
              <p className="text-sm text-slate-500 mt-1">{formatDate(row.latestResultDate)}</p>
            </div>
          </section>

          <section className="border rounded-3xl p-5 bg-slate-50">
            <h4 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
              <PlayCircle className="text-blue-600" /> مشاهدة الفيديوهات
            </h4>

            {row.videoViews.length === 0 ? (
              <div className="bg-white border rounded-2xl p-6 text-center text-slate-500 font-bold">
                لا توجد مشاهدات فيديو مسجلة لهذا الطالب.
              </div>
            ) : (
              <div className="space-y-3">
                {row.videoViews.map((v, i) => (
                  <div key={`${v.videoId || v.contentId || i}`} className="bg-white border rounded-2xl p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="font-black text-slate-900 flex items-center gap-2">
                          <Video size={16} className="text-blue-600" />
                          {v.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          آخر مشاهدة: {formatDate(v.lastViewedAt)}
                        </p>
                      </div>
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-black">
                        {v.watchedPercent || 0}%
                      </span>
                    </div>

                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${Math.min(100, v.watchedPercent || 0)}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-slate-600 mt-3">
                      <span>شاهد: <b>{formatDuration(v.watchedSeconds)}</b></span>
                      <span>مدة الفيديو: <b>{v.durationSeconds ? formatDuration(v.durationSeconds) : "غير محددة"}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="border rounded-3xl p-5 bg-slate-50">
            <h4 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="text-red-600" /> ملخص يحتاج متابعة
            </h4>
            <div className="bg-white border rounded-2xl p-4 space-y-2 text-slate-700 font-bold">
              <p>الحالة العامة: {row.status}</p>
              <p>إجمالي وقت مشاهدة الفيديوهات: {formatDuration(row.totalWatchSeconds)}</p>
              <p>الفيديوهات المكتملة بنسبة 80% أو أكثر: {row.completedVideos}</p>
              <p>الفروع التي تحتاج متابعة: {row.weakBranchesText || "لا توجد فروع ضعيفة واضحة"}</p>
            </div>
          </section>
        </div>
      </div>
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
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function Mini({ title, value }) {
  return (
    <div className="bg-white border rounded-2xl p-4 text-center">
      <p className="text-xs text-slate-500 font-bold mb-2">{title}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}
