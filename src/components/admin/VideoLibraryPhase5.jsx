// src/components/admin/VideoLibraryPhase5.jsx
import React, { useMemo, useState } from "react";
import { Video, Search, PlayCircle, Youtube, Film, PlusCircle, ExternalLink, FolderTree, Clock } from "lucide-react";

const getProvider = (item = {}) => {
  const url = String(item.url || item.file || item.videoUrl || item.link || "");
  if (item.provider === "vimeo" || url.includes("vimeo.com")) return "vimeo";
  if (item.provider === "youtube" || url.includes("youtube") || url.includes("youtu.be")) return "youtube";
  return "direct";
};

const getGradeLabel = (g) => {
  const map = {
    "1prep": "أولى إعدادي", "2prep": "تانية إعدادي", "3prep": "تالتة إعدادي",
    "1sec": "أولى ثانوي", "2sec": "تانية ثانوي", "3sec": "تالتة ثانوي"
  };
  return map[g] || g || "غير محدد";
};

export default function VideoLibraryPhase5({ content = [], onOpenContent, onGoContentManager }) {
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState("all");
  const [provider, setProvider] = useState("all");

  const videos = useMemo(() => (content || []).filter((item) => {
    const type = String(item.type || "").toLowerCase();
    const url = String(item.url || item.file || item.videoUrl || item.link || "");
    return type === "video" || url.includes("youtube") || url.includes("youtu.be") || url.includes("vimeo.com") || url.endsWith(".mp4");
  }), [content]);

  const grades = useMemo(() => ["all", ...Array.from(new Set(videos.map((v) => v.grade).filter(Boolean)))], [videos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return videos.filter((v) => {
      const p = getProvider(v);
      const byText = !q || [v.title, v.branch, v.unit, v.chapter].join(" ").toLowerCase().includes(q);
      return byText && (grade === "all" || v.grade === grade) && (provider === "all" || p === provider);
    });
  }, [videos, search, grade, provider]);

  const groups = useMemo(() => {
    const map = {};
    filtered.forEach((v) => {
      const g = v.grade || "غير محدد";
      const branch = v.branch || v.category || "عام";
      map[g] = map[g] || {};
      map[g][branch] = map[g][branch] || [];
      map[g][branch].push(v);
    });
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="rounded-[2rem] bg-gradient-to-l from-slate-950 via-red-950 to-orange-700 text-white p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold mb-4">
              <Video size={16} /> مكتبة الفيديوهات
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-2">الفيديوهات والمحاضرات</h2>
            <p className="text-orange-100 max-w-3xl">صفحة منظمة لعرض فيديوهاتك بدون تغيير مشغل الفيديو القديم السريع.</p>
          </div>
          <button onClick={onGoContentManager} className="bg-white text-slate-950 px-5 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl">
            <PlusCircle size={18} /> إدارة المحتوى
          </button>
        </div>
      </div>

      <section className="bg-white border rounded-[2rem] p-5 shadow-sm">
        <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-950 flex items-center gap-2">
              <FolderTree className="text-orange-600" /> الفيديوهات المتاحة
            </h3>
            <p className="text-sm text-slate-500 mt-1">عدد الفيديوهات: {filtered.length}</p>
          </div>
          <div className="flex flex-col lg:flex-row gap-3 w-full 2xl:w-auto">
            <div className="relative flex-1 lg:w-96">
              <Search className="absolute right-4 top-3.5 text-slate-400" size={18} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث باسم الفيديو أو الفرع..." className="w-full pr-11 pl-4 py-3 rounded-2xl border bg-slate-50 outline-none focus:border-orange-500" />
            </div>
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className="px-4 py-3 rounded-2xl border bg-slate-50 font-bold outline-none">
              {grades.map((g) => <option key={g} value={g}>{g === "all" ? "كل الصفوف" : getGradeLabel(g)}</option>)}
            </select>
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className="px-4 py-3 rounded-2xl border bg-slate-50 font-bold outline-none">
              <option value="all">كل المصادر</option><option value="youtube">YouTube</option><option value="vimeo">Vimeo احتياطي</option><option value="direct">مباشر</option>
            </select>
          </div>
        </div>

        {Object.keys(groups).length === 0 ? (
          <div className="bg-slate-50 border border-dashed rounded-3xl p-10 text-center text-slate-500 font-bold">لا توجد فيديوهات مطابقة.</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groups).map(([g, branches]) => (
              <div key={g} className="border rounded-3xl overflow-hidden">
                <div className="bg-slate-950 text-white p-4 font-black text-lg">{getGradeLabel(g)}</div>
                <div className="p-4 bg-slate-50 space-y-5">
                  {Object.entries(branches).map(([branch, items]) => (
                    <div key={branch}>
                      <h4 className="font-black text-slate-900 mb-3">{branch}</h4>
                      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                        {items.map((item) => <VideoCard key={item.id} item={item} onOpen={() => onOpenContent?.(item)} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function VideoCard({ item, onOpen }) {
  const provider = getProvider(item);
  const providerStyle = provider === "youtube" ? "bg-red-50 text-red-700 border-red-100" : provider === "vimeo" ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-emerald-50 text-emerald-700 border-emerald-100";

  return (
    <div className="bg-white border rounded-3xl p-5 shadow-sm hover:shadow-lg transition">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center shrink-0">
          {provider === "youtube" ? <Youtube /> : provider === "vimeo" ? <Film /> : <Video />}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-black border ${providerStyle}`}>{provider === "youtube" ? "YouTube" : provider === "vimeo" ? "Vimeo" : "مباشر"}</span>
      </div>
      <h5 className="text-lg font-black text-slate-950 mb-2 line-clamp-2">{item.title || "فيديو بدون عنوان"}</h5>
      <p className="text-sm text-slate-500 mb-4">{item.unit || item.chapter || "بدون وحدة"} • {item.branch || "عام"}</p>
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4"><Clock size={14} /><span>{item.estimatedDurationMinutes ? `${item.estimatedDurationMinutes} دقيقة تقريبًا` : "مدة غير محددة"}</span></div>
      <div className="flex gap-2">
        <button onClick={onOpen} className="flex-1 bg-slate-950 text-white py-3 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition"><PlayCircle size={17} /> فتح</button>
        {(item.url || item.file || item.videoUrl) && <a href={item.url || item.file || item.videoUrl} target="_blank" rel="noopener noreferrer" className="bg-slate-100 text-slate-700 p-3 rounded-2xl hover:bg-slate-200 transition"><ExternalLink size={18} /></a>}
      </div>
    </div>
  );
}
