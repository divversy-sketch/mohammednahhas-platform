// src/components/admin/ContentOrganizerPhase3.jsx
import React, { useMemo, useState } from "react";
import { Layers, BookOpen, Search, FolderTree, Video, FileText, ClipboardList } from "lucide-react";

function getGradeLabel(g) {
  const map = {
    "1prep": "أولى إعدادي",
    "2prep": "تانية إعدادي",
    "3prep": "تالتة إعدادي",
    "1sec": "أولى ثانوي",
    "2sec": "تانية ثانوي",
    "3sec": "تالتة ثانوي"
  };
  return map[g] || g || "غير محدد";
}

function buildTree(items = [], exams = []) {
  const tree = {};

  (Array.isArray(items) ? items : []).forEach((item) => {
    const grade = item.grade || "غير محدد";
    const branch = item.branch || item.category || "عام";
    const unit = item.unit || item.chapter || "وحدة عامة";
    tree[grade] = tree[grade] || {};
    tree[grade][branch] = tree[grade][branch] || {};
    tree[grade][branch][unit] = tree[grade][branch][unit] || { content: [], exams: [] };
    tree[grade][branch][unit].content.push(item);
  });

  (Array.isArray(exams) ? exams : []).forEach((exam) => {
    const grade = exam.grade || "غير محدد";
    const branch = exam.branch || exam.category || "امتحانات";
    const unit = exam.unit || exam.chapter || "اختبارات عامة";
    tree[grade] = tree[grade] || {};
    tree[grade][branch] = tree[grade][branch] || {};
    tree[grade][branch][unit] = tree[grade][branch][unit] || { content: [], exams: [] };
    tree[grade][branch][unit].exams.push(exam);
  });

  return tree;
}

export default function ContentOrganizerPhase3({
  content = [],
  exams = [],
  onOpenContent,
  onOpenExam
}) {
  const [search, setSearch] = useState("");

  const filteredContent = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return content || [];
    return (content || []).filter((c) =>
      String(c.title || "").toLowerCase().includes(s) ||
      String(c.branch || "").toLowerCase().includes(s) ||
      String(c.unit || "").toLowerCase().includes(s)
    );
  }, [content, search]);

  const filteredExams = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return exams || [];
    return (exams || []).filter((e) =>
      String(e.title || "").toLowerCase().includes(s) ||
      String(e.branch || "").toLowerCase().includes(s) ||
      String(e.unit || "").toLowerCase().includes(s)
    );
  }, [exams, search]);

  const tree = useMemo(() => buildTree(filteredContent, filteredExams), [filteredContent, filteredExams]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-gradient-to-r from-emerald-700 to-slate-900 text-white rounded-3xl p-6 shadow-xl">
        <h2 className="text-2xl md:text-3xl font-black mb-2 flex items-center gap-2">
          <FolderTree /> تنظيم المحتوى
        </h2>
        <p className="text-emerald-100">
          عرض المحتوى بشكل شجري: مرحلة → فرع → وحدة → درس/امتحان.
        </p>
      </div>

      <section className="bg-white border rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="text-emerald-600" /> خريطة المنهج
          </h3>
          <div className="relative">
            <Search className="absolute right-3 top-3 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في المحتوى أو الامتحانات..."
              className="pr-10 pl-4 py-3 rounded-2xl border w-full md:w-96 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {Object.keys(tree).length === 0 ? (
          <div className="bg-slate-50 border rounded-2xl p-8 text-center text-slate-500 font-bold">
            لا يوجد محتوى منظم مطابق.
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(tree).map(([grade, branches]) => (
              <div key={grade} className="border rounded-3xl overflow-hidden">
                <div className="bg-slate-900 text-white p-4 font-black text-lg">
                  {getGradeLabel(grade)}
                </div>

                <div className="p-4 space-y-4 bg-slate-50">
                  {Object.entries(branches).map(([branch, units]) => (
                    <div key={branch} className="bg-white border rounded-2xl p-4">
                      <h4 className="font-black text-emerald-800 mb-3 flex items-center gap-2">
                        <BookOpen size={18} /> {branch}
                      </h4>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {Object.entries(units).map(([unit, group]) => (
                          <div key={unit} className="border rounded-2xl p-4 bg-slate-50">
                            <p className="font-black text-slate-900 mb-3">{unit}</p>

                            <div className="space-y-2">
                              {group.content.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => onOpenContent?.(item)}
                                  className="w-full text-right bg-white border rounded-xl p-3 hover:border-emerald-400 transition"
                                >
                                  <span className="font-bold text-slate-800 flex items-center gap-2">
                                    {item.type === "video" ? <Video size={16} /> : <FileText size={16} />}
                                    {item.title || "محتوى بدون عنوان"}
                                  </span>
                                </button>
                              ))}

                              {group.exams.map((exam) => (
                                <button
                                  key={exam.id}
                                  type="button"
                                  onClick={() => onOpenExam?.(exam)}
                                  className="w-full text-right bg-amber-50 border border-amber-100 rounded-xl p-3 hover:border-amber-400 transition"
                                >
                                  <span className="font-bold text-amber-800 flex items-center gap-2">
                                    <ClipboardList size={16} />
                                    {exam.title || "امتحان بدون عنوان"}
                                  </span>
                                </button>
                              ))}

                              {group.content.length === 0 && group.exams.length === 0 && (
                                <p className="text-sm text-slate-400">لا توجد عناصر داخل هذه الوحدة.</p>
                              )}
                            </div>
                          </div>
                        ))}
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
