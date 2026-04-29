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
  Activity,
  X,
  UserRound,
  GraduationCap,
  TimerReset,
  CheckCircle2
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
        .map(([branch, count]) => `${branch} (${count})`)
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
        latestExam: latestResult?.examTitle || latestResult?.title || "لا يوجد امتحان",
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

  const videosText = (row.videoViews || []).length
    ? (row.videoViews || [])
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
  watchSessions = [],
  content = [],
  onOpenStudent
}) {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const rows = useMemo(
    () => buildStudentRows({ users, results, mistakes, videoViews, content }),
    [users, results, mistakes, videoViews, watchSessions, content]
  );

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => {
      const byText =
        !s ||
        String(r.name).toLowerCase().includes(s) ||
        String(r.email).toLowerCase().includes(s) ||
        String(r.phone).includes(s) ||
        String(r.parentPhone).includes(s);

      const byStatus =
        statusFilter === "all" ||
        (statusFilter === "weak" && r.status === "يحتاج متابعة") ||
        (statusFilter === "active" && (r.activeDays > 0 || r.examsCount > 0 || r.watchedVideosCount > 0)) ||
        (statusFilter === "excellent" && r.status === "ممتاز");

      return byText && byStatus;
    });
  }, [rows, search, statusFilter]);

  const summary = useMemo(() => {
    const active = rows.filter((r) => r.activeDays > 0 || r.examsCount > 0 || r.watchedVideosCount > 0).length;
    const weak = rows.filter((r) => r.status === "يحتاج متابعة").length;
    const excellent = rows.filter((r) => r.status === "ممتاز").length;
    const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.avg, 0) / rows.length) : 0;
    const watchSeconds = rows.reduce((s, r) => s + r.totalWatchSeconds, 0);
    return { total: rows.length, active, weak, excellent, avg, watchSeconds };
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
    <div className="space-y-7 p-1 md:p-0" dir="rtl">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-l from-slate-950 via-indigo-950 to-indigo-700 p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute -top-20 -left-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-indigo-100 mb-4">
              <Users size={16} /> متابعة أولياء الأمور
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-2">
              لوحة متابعة ولي الأمر
            </h2>
            <p className="text-indigo-100 max-w-3xl leading-relaxed">
              متابعة منظمة لكل طالب: آخر نتيجة، النشاط، مشاهدة الفيديوهات، الأخطاء، ورسالة واتساب جاهزة لولي الأمر.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 min-w-[260px]">
            <HeroMini title="طلاب" value={summary.total} />
            <HeroMini title="متوسط" value={`${summary.avg}%`} />
            <HeroMini title="نشطون" value={summary.active} />
            <HeroMini title="متابعة" value={summary.weak} danger />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 md:gap-4">
        <Stat title="إجمالي الطلاب" value={summary.total} icon={<Users />} tone="indigo" />
        <Stat title="طلاب نشطون" value={summary.active} icon={<Activity />} tone="blue" />
        <Stat title="يحتاجون متابعة" value={summary.weak} icon={<AlertTriangle />} tone="red" />
        <Stat title="ممتازون" value={summary.excellent} icon={<CheckCircle2 />} tone="emerald" />
        <Stat title="إجمالي مشاهدة" value={formatDuration(summary.watchSeconds)} icon={<Clock />} tone="amber" />
      </div>

      <section className="bg-white border border-slate-200 rounded-[2rem] p-4 md:p-6 shadow-sm">
        <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-950">الطلاب</h3>
            <p className="text-sm text-slate-500 mt-1">اختار طالب لعرض التفاصيل أو إرسال تقرير واتساب.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 w-full 2xl:w-auto">
            <div className="relative flex-1 lg:w-96">
              <Search className="absolute right-4 top-3.5 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث باسم الطالب أو رقم ولي الأمر..."
                className="w-full pr-11 pl-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <FilterButton active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>الكل</FilterButton>
              <FilterButton active={statusFilter === "active"} onClick={() => setStatusFilter("active")}>نشطون</FilterButton>
              <FilterButton active={statusFilter === "weak"} onClick={() => setStatusFilter("weak")}>متابعة</FilterButton>
              <FilterButton active={statusFilter === "excellent"} onClick={() => setStatusFilter("excellent")}>ممتاز</FilterButton>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-slate-50 border border-dashed rounded-3xl p-10 text-center text-slate-500 font-bold">
            لا توجد بيانات مطابقة.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
            {filtered.map((row) => (
              <StudentCard
                key={row.id}
                row={row}
                onDetails={() => setSelectedStudent(row)}
                onWhatsApp={() => openWhatsApp(row)}
                onOpenStudent={onOpenStudent}
              />
            ))}
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

function StudentCard({ row, onDetails, onWhatsApp, onOpenStudent }) {
  const statusTone =
    row.status === "ممتاز"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : row.status === "جيد"
        ? "bg-blue-50 text-blue-700 border-blue-100"
        : row.status === "يحتاج متابعة"
          ? "bg-red-50 text-red-700 border-red-100"
          : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-slate-900 text-white flex items-center justify-center shadow">
              <UserRound size={20} />
            </div>
            <div className="min-w-0">
              <h4 className="font-black text-slate-950 truncate max-w-[240px]">{row.name}</h4>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <GraduationCap size={13} /> {row.grade || "غير محدد"}
              </p>
            </div>
          </div>
        </div>

        <span className={`shrink-0 px-3 py-1 rounded-full border text-xs font-black ${statusTone}`}>
          {row.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Metric label="المتوسط" value={`${row.avg}%`} />
        <Metric label="آخر نتيجة" value={`${row.latestPercentage}%`} />
        <Metric label="نشاط" value={`${row.activeDays} يوم`} />
      </div>

      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3 mb-4">
        <InfoLine icon={<Phone size={15} />} label="ولي الأمر" value={row.parentPhone || row.phone || "غير مسجل"} />
        <InfoLine icon={<ClipboardCheck size={15} />} label="آخر امتحان" value={row.latestExam} />
        <InfoLine icon={<Video size={15} />} label="الفيديوهات" value={`${row.watchedVideosCount} فيديو • ${formatDuration(row.totalWatchSeconds)}`} />
        <InfoLine icon={<AlertTriangle size={15} />} label="الأخطاء" value={`${row.mistakesCount} خطأ`} danger={row.mistakesCount > 0} />
      </div>

      {row.weakBranchesText && (
        <div className="mb-4 rounded-2xl bg-red-50 border border-red-100 p-3">
          <p className="text-xs font-black text-red-700 mb-1">فروع تحتاج متابعة</p>
          <p className="text-sm font-bold text-red-800 leading-relaxed">{row.weakBranchesText}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDetails}
          className="flex-1 min-w-[110px] bg-slate-900 text-white px-4 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition"
        >
          <Eye size={16} /> التفاصيل
        </button>
        <button
          type="button"
          onClick={onWhatsApp}
          className="flex-1 min-w-[110px] bg-green-600 text-white px-4 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition"
        >
          <MessageCircle size={16} /> واتساب
        </button>
        {onOpenStudent && (
          <button
            type="button"
            onClick={() => onOpenStudent(row)}
            className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-2xl font-black text-sm hover:bg-indigo-100 transition"
          >
            فتح
          </button>
        )}
      </div>
    </div>
  );
}

function StudentDetailsModal({ row, onClose, onWhatsApp }) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-5" dir="rtl">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-l from-slate-950 to-indigo-800 text-white p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-3xl bg-white/10 border border-white/10 flex items-center justify-center">
              <UserRound />
            </div>
            <div className="min-w-0">
              <h3 className="text-2xl md:text-3xl font-black truncate">{row.name}</h3>
              <p className="text-sm text-indigo-100">تقرير متابعة كامل لولي الأمر</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={onWhatsApp} className="bg-green-600 text-white px-4 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-green-700 transition">
              <MessageCircle size={18} /> إرسال واتساب
            </button>
            <button onClick={onClose} className="bg-white/10 text-white px-4 py-3 rounded-2xl font-black hover:bg-white/20 transition flex items-center gap-2">
              <X size={18} /> إغلاق
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto space-y-6 bg-slate-50">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Mini title="المتوسط" value={`${row.avg}%`} />
            <Mini title="آخر نتيجة" value={`${row.latestPercentage}%`} />
            <Mini title="الامتحانات" value={row.examsCount} />
            <Mini title="أيام النشاط" value={row.activeDays} />
            <Mini title="الأخطاء" value={row.mistakesCount} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="xl:col-span-1 bg-white border rounded-3xl p-5 shadow-sm">
              <h4 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <ClipboardCheck className="text-indigo-600" /> آخر نتيجة
              </h4>
              <div className="rounded-3xl border bg-indigo-50/50 p-5">
                <p className="font-black text-slate-900 mb-2">{row.latestExam}</p>
                <p className="text-indigo-700 font-black text-5xl">{row.latestPercentage}%</p>
                <p className="text-sm text-slate-500 mt-3">{formatDate(row.latestResultDate)}</p>
              </div>

              <div className="mt-4 rounded-3xl border bg-white p-4 space-y-3">
                <InfoLine icon={<Phone size={15} />} label="ولي الأمر" value={row.parentPhone || row.phone || "غير مسجل"} />
                <InfoLine icon={<TimerReset size={15} />} label="آخر نشاط" value={row.lastActivityMs ? formatDate(row.lastActivityMs) : "غير متاح"} />
                <InfoLine icon={<Clock size={15} />} label="إجمالي المشاهدة" value={formatDuration(row.totalWatchSeconds)} />
              </div>
            </section>

            <section className="xl:col-span-2 bg-white border rounded-3xl p-5 shadow-sm">
              <h4 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <PlayCircle className="text-blue-600" /> مشاهدة الفيديوهات
              </h4>

              {(row.videoViews || []).length === 0 ? (
                <div className="bg-slate-50 border border-dashed rounded-3xl p-8 text-center text-slate-500 font-bold">
                  لا توجد مشاهدات فيديو مسجلة لهذا الطالب.
                </div>
              ) : (
                <div className="space-y-3">
                  {(row.videoViews || []).map((v, i) => (
                    <VideoProgressCard key={`${v.videoId || v.contentId || i}`} view={v} />
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="bg-white border rounded-3xl p-5 shadow-sm">
            <h4 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="text-red-600" /> ملخص يحتاج متابعة
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SummaryBox title="الحالة العامة" value={row.status} />
              <SummaryBox title="فيديوهات مكتملة 80%+" value={row.completedVideos} />
              <SummaryBox title="فروع ضعيفة" value={row.weakBranchesText || "لا توجد"} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function VideoProgressCard({ view }) {
  const percent = Math.min(100, safeNumber(view.watchedPercent, 0));

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-black text-slate-900 flex items-center gap-2">
            <Video size={17} className="text-blue-600 shrink-0" />
            <span className="truncate">{view.title}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            آخر مشاهدة: {formatDate(view.lastViewedAt)}
          </p>
        </div>
        <span className="shrink-0 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-black border border-blue-100">
          {percent}%
        </span>
      </div>

      <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-slate-200">
        <div
          className="h-full bg-gradient-to-l from-blue-600 to-indigo-500 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-slate-600 mt-3">
        <span>شاهد: <b>{formatDuration(view.watchedSeconds)}</b></span>
        <span>مدة الفيديو: <b>{view.durationSeconds ? formatDuration(view.durationSeconds) : "غير محددة"}</b></span>
      </div>
    </div>
  );
}

function HeroMini({ title, value, danger }) {
  return (
    <div className={`rounded-3xl border p-4 backdrop-blur ${danger ? "bg-red-500/15 border-red-300/20" : "bg-white/10 border-white/10"}`}>
      <p className="text-xs text-white/70 font-bold mb-1">{title}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function Stat({ title, value, icon, tone = "indigo" }) {
  const styles = {
    indigo: "text-indigo-700 bg-indigo-50 border-indigo-100",
    blue: "text-blue-700 bg-blue-50 border-blue-100",
    red: "text-red-700 bg-red-50 border-red-100",
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-100",
    amber: "text-amber-700 bg-amber-50 border-amber-100"
  };

  return (
    <div className={`border rounded-3xl p-4 shadow-sm ${styles[tone] || styles.indigo}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-xs md:text-sm">{title}</span>
        {icon}
      </div>
      <p className="text-xl md:text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-3 rounded-2xl font-black text-sm whitespace-nowrap border transition ${
        active
          ? "bg-slate-900 text-white border-slate-900 shadow"
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 text-center">
      <p className="text-[11px] text-slate-500 font-bold mb-1">{label}</p>
      <p className="text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function InfoLine({ icon, label, value, danger }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-slate-500 shrink-0">
        {icon}
        <span className="font-bold">{label}</span>
      </div>
      <span className={`font-black text-left break-words ${danger ? "text-red-600" : "text-slate-800"}`}>
        {value}
      </span>
    </div>
  );
}

function SummaryBox({ title, value }) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      <p className="text-xs text-slate-500 font-bold mb-2">{title}</p>
      <p className="font-black text-slate-900 leading-relaxed">{value}</p>
    </div>
  );
}

function Mini({ title, value }) {
  return (
    <div className="bg-white border rounded-3xl p-4 text-center shadow-sm">
      <p className="text-xs text-slate-500 font-bold mb-2">{title}</p>
      <p className="text-2xl md:text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
}
