import React, { useMemo, useState } from "react";
import { Search, Video, Clock, PlayCircle, AlertTriangle, Users, Activity, SkipForward, Eye, X } from "lucide-react";

const n = (v, f = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : f;
};

const ms = (v) => {
  if (!v) return 0;
  if (v?.seconds) return v.seconds * 1000;
  if (typeof v?.toDate === "function") return v.toDate().getTime();
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
};

const fmtDate = (v) => {
  const t = typeof v === "number" ? v : ms(v);
  if (!t) return "غير متاح";
  return new Date(t).toLocaleString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const fmtDur = (sec) => {
  const total = Math.max(0, Math.round(n(sec)));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = [];
  if (h) p.push(`${h} س`);
  if (m) p.push(`${m} د`);
  if (!h && !m || s) p.push(`${s} ث`);
  return p.join(" ") || "0 ث";
};

export default function VideoWatchAnalyticsPhase4({ users = [], content = [], videoViews = [], watchSessions = [] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const userMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      const id = u.id || u.uid || u.userId;
      if (id) map[id] = u;
      if (u.email) map[u.email] = u;
    });
    return map;
  }, [users]);

  const contentMap = useMemo(() => {
    const map = {};
    (content || []).forEach((c) => {
      if (c.id) map[c.id] = c;
    });
    return map;
  }, [content]);

  const rows = useMemo(() => {
    return (watchSessions || []).map((s) => {
      const user = userMap[s.userId] || userMap[s.userEmail] || {};
      const item = contentMap[s.videoId] || {};
      return {
        ...s,
        studentName: s.userName || user.name || user.displayName || s.userEmail || "طالب",
        studentPhone: user.phone || user.studentPhone || "",
        parentPhone: user.parentPhone || user.guardianPhone || "",
        videoTitle: s.videoTitle || item.title || "فيديو بدون عنوان",
        openedMs: s.openedAtMs || ms(s.openedAt),
        closedMs: s.closedAtMs || ms(s.closedAt),
        watched: n(s.watchedSecondsThisSession || s.realPlaybackSeconds, 0),
        skipped: n(s.skippedSecondsIgnored, 0),
        startPos: n(s.startPositionSeconds, 0),
        endPos: n(s.endPositionSeconds, 0),
        duration: n(s.videoDurationSeconds || item.durationSeconds || n(item.estimatedDurationMinutes) * 60, 0)
      };
    }).sort((a, b) => (b.openedMs || 0) - (a.openedMs || 0));
  }, [watchSessions, userMap, contentMap]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      String(r.studentName).toLowerCase().includes(q) ||
      String(r.videoTitle).toLowerCase().includes(q) ||
      String(r.studentPhone).includes(q) ||
      String(r.parentPhone).includes(q)
    );
  }, [rows, search]);

  const summary = useMemo(() => {
    const students = new Set(rows.map((r) => r.userId || r.userEmail).filter(Boolean)).size;
    const videos = new Set(rows.map((r) => r.videoId || r.youtubeVideoId).filter(Boolean)).size;
    const watched = rows.reduce((sum, r) => sum + r.watched, 0);
    const skipped = rows.reduce((sum, r) => sum + r.skipped, 0);
    return { sessions: rows.length, students, videos, watched, skipped };
  }, [rows]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="rounded-[2rem] bg-gradient-to-l from-slate-950 via-blue-950 to-cyan-700 text-white p-6 md:p-8 shadow-2xl">
        <h2 className="text-3xl md:text-4xl font-black mb-2 flex items-center gap-3">
          <Video /> تحليل مشاهدة الفيديو
        </h2>
        <p className="text-cyan-100">جلسات مشاهدة تفصيلية: فتح، إغلاق، استكمال، مدة مشاهدة فعلية، والتقديم الذي لم يتم احتسابه.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <Card title="الجلسات" value={summary.sessions} icon={<PlayCircle />} />
        <Card title="طلاب شاهدوا" value={summary.students} icon={<Users />} />
        <Card title="فيديوهات" value={summary.videos} icon={<Video />} />
        <Card title="وقت فعلي" value={fmtDur(summary.watched)} icon={<Clock />} />
        <Card title="تقديم غير محسوب" value={fmtDur(summary.skipped)} icon={<SkipForward />} danger />
      </div>

      <section className="bg-white border rounded-[2rem] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-2xl font-black text-slate-950">سجل المشاهدة</h3>
            <p className="text-sm text-slate-500">كل صف يمثل مرة فتح أو استكمال للفيديو.</p>
          </div>
          <div className="relative w-full lg:w-96">
            <Search className="absolute right-4 top-3.5 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم الطالب أو الفيديو أو الهاتف..."
              className="w-full pr-11 pl-4 py-3 rounded-2xl border bg-slate-50 outline-none focus:border-cyan-600"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-slate-50 border border-dashed rounded-3xl p-10 text-center text-slate-500 font-bold">
            لا توجد جلسات مشاهدة حتى الآن.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <div key={r.id} className="border rounded-3xl p-5 bg-white hover:shadow-lg transition">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 truncate">{r.studentName}</h4>
                    <p className="text-sm text-slate-500 truncate">{r.videoTitle}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${r.sessionType === "resume" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {r.sessionType === "resume" ? "استكمال" : "فتح جديد"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Mini label="فتح" value={fmtDate(r.openedMs)} />
                  <Mini label="إغلاق" value={fmtDate(r.closedMs)} />
                  <Mini label="شاهد فعليًا" value={fmtDur(r.watched)} />
                  <Mini label="تقديم غير محسوب" value={fmtDur(r.skipped)} danger={r.skipped > 0} />
                </div>

                <div className="bg-slate-50 border rounded-2xl p-3 text-sm space-y-2">
                  <Line label="بدأ من" value={fmtDur(r.startPos)} />
                  <Line label="انتهى عند" value={fmtDur(r.endPos)} />
                  <Line label="مدة الفيديو" value={r.duration ? fmtDur(r.duration) : "غير محددة"} />
                </div>

                <button onClick={() => setSelected(r)} className="mt-4 w-full bg-slate-900 text-white rounded-2xl py-3 font-black flex items-center justify-center gap-2">
                  <Eye size={16} /> تفاصيل الجلسة
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-2xl font-black">تفاصيل الجلسة</h3>
              <button onClick={() => setSelected(null)} className="bg-slate-900 text-white p-2 rounded-xl"><X /></button>
            </div>
            <div className="space-y-3">
              <Detail label="الطالب" value={selected.studentName} />
              <Detail label="الفيديو" value={selected.videoTitle} />
              <Detail label="نوع الجلسة" value={selected.sessionType === "resume" ? "استكمال" : "فتح جديد"} />
              <Detail label="فتح الساعة" value={fmtDate(selected.openedMs)} />
              <Detail label="قفل الساعة" value={fmtDate(selected.closedMs)} />
              <Detail label="المدة الفعلية" value={fmtDur(selected.watched)} />
              <Detail label="تقديم غير محسوب" value={fmtDur(selected.skipped)} />
              <Detail label="بدأ من" value={fmtDur(selected.startPos)} />
              <Detail label="انتهى عند" value={fmtDur(selected.endPos)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, value, icon, danger }) {
  return (
    <div className={`border rounded-3xl p-4 shadow-sm ${danger ? "bg-red-50 text-red-700 border-red-100" : "bg-white text-cyan-700"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-sm">{title}</span>
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function Mini({ label, value, danger }) {
  return (
    <div className={`rounded-2xl border p-3 ${danger ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"}`}>
      <p className="text-xs text-slate-500 font-bold mb-1">{label}</p>
      <p className={`text-sm font-black ${danger ? "text-red-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function Line({ label, value }) {
  return <div className="flex justify-between gap-3"><span className="text-slate-500 font-bold">{label}</span><span className="font-black text-slate-900">{value}</span></div>;
}

function Detail({ label, value }) {
  return <div className="border rounded-2xl p-4 flex justify-between gap-3"><span className="text-slate-500 font-bold">{label}</span><span className="font-black text-slate-900 text-left">{value}</span></div>;
}
