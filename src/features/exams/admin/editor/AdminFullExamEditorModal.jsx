
import { useState } from 'react';
import { Edit, UploadCloud, X } from '@shared/icons/lucide-shim.jsx';
import { GradeOptions } from '@shared/constants/grades';
import { platformNotify, safeNumber } from '@shared/core/platformShared.jsx';
import { uploadToCloudinary } from '@services/cloudinaryUpload';
import ImageFitControls from '@shared/ui/ImageFitControls.jsx';

export default function AdminFullExamEditorModal({
  editingFullExam, setEditingFullExam,
  examEditMode, setExamEditMode,
  recalculateAfterExamEdit, setRecalculateAfterExamEdit,
  examEditDraft, setExamEditDraft,
  examEditQuestionsPreview, updateQuestionInExamDraft,
  saveFullExamEdit,
  examsList = []
}) {
  const [imageBusy, setImageBusy] = useState(false);
  const uploadExamImage = async (file) => {
    if (!file) return;
    try {
      setImageBusy(true);
      const uploaded = await uploadToCloudinary(file, { kind: 'image', folder: 'nahhas-platform/exam-images' });
      setExamEditDraft({ ...examEditDraft, examImageUrl: uploaded.url });
      platformNotify('تم رفع صورة الامتحان بنجاح.');
    } catch (err) {
      platformNotify(err?.message || 'فشل رفع صورة الامتحان.');
    } finally {
      setImageBusy(false);
    }
  };
  if (!editingFullExam) return null;
  return (
<div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
  <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl">
    <div className="flex justify-between items-center mb-5 border-b pb-3">
      <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Edit size={22}/> تعديل الامتحان بالكامل</h3>
      <button onClick={() => setEditingFullExam(null)} className="text-slate-400 hover:text-red-600"><X size={26}/></button>
    </div>

    {editingFullExam.hasResults && (
      <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-sm font-bold leading-relaxed">
        هذا الامتحان له نتائج طلاب سابقة. عند تعديل الإجابات الصحيحة يمكنك إعادة تصحيح نتائج الطلاب تلقائيًا بناءً على الإجابات الجديدة.
      </div>
    )}

    {editingFullExam.hasResults && examEditMode === 'direct' && (
      <label className="mb-4 flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl font-bold cursor-pointer">
        <input
          type="checkbox"
          className="mt-1"
          checked={recalculateAfterExamEdit}
          onChange={e => setRecalculateAfterExamEdit(e.target.checked)}
        />
        <span>
          إعادة تصحيح نتائج الطلاب القديمة تلقائيًا بعد حفظ التعديل
          <span className="block text-xs font-normal mt-1 text-emerald-700">
            استخدم هذا الخيار عند تعديل الإجابة الصحيحة أو درجة السؤال. سيعاد حساب الدرجة والفروع والتحليل لكل طالب حل الامتحان.
          </span>
        </span>
      </label>
    )}

    <form onSubmit={saveFullExamEdit} className="grid gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="bg-slate-50 border rounded-xl p-3 flex items-center gap-2 font-bold">
          <input type="radio" checked={examEditMode === 'direct'} onChange={() => setExamEditMode('direct')} />
          تعديل مباشر
        </label>
        <label className="bg-slate-50 border rounded-xl p-3 flex items-center gap-2 font-bold">
          <input type="radio" checked={examEditMode === 'clone'} onChange={() => setExamEditMode('clone')} />
          إنشاء نسخة جديدة آمنة
        </label>
        <label className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 font-bold text-amber-800">
          <input type="checkbox" checked={examEditDraft.isPremium} onChange={e => setExamEditDraft({...examEditDraft, isPremium: e.target.checked})} />
          VIP فقط
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="border p-3 rounded-xl" placeholder="عنوان الامتحان" value={examEditDraft.title} onChange={e => setExamEditDraft({...examEditDraft, title: e.target.value})} />
        <select className="border p-3 rounded-xl" value={examEditDraft.grade} onChange={e => setExamEditDraft({...examEditDraft, grade: e.target.value})}><GradeOptions/></select>
        <input type="number" className="border p-3 rounded-xl" placeholder="المدة بالدقائق" value={examEditDraft.duration} onChange={e => setExamEditDraft({...examEditDraft, duration: e.target.value})} />
        <input className="border p-3 rounded-xl" placeholder="كود الامتحان" value={examEditDraft.accessCode} onChange={e => setExamEditDraft({...examEditDraft, accessCode: e.target.value})} />
        <input type="datetime-local" className="border p-3 rounded-xl" value={examEditDraft.startTime} onChange={e => setExamEditDraft({...examEditDraft, startTime: e.target.value})} />
        <input type="datetime-local" className="border p-3 rounded-xl" value={examEditDraft.endTime} onChange={e => setExamEditDraft({...examEditDraft, endTime: e.target.value})} />
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
        <label className="block text-sm font-black text-emerald-900">صورة الامتحان / الغلاف</label>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <input className="border p-3 rounded-xl bg-white" placeholder="رابط الصورة أو ارفع صورة" value={examEditDraft.examImageUrl || ''} onChange={e => setExamEditDraft({...examEditDraft, examImageUrl: e.target.value})} />
          <label className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl font-black cursor-pointer">
            <UploadCloud size={16}/> {imageBusy ? 'جاري الرفع...' : 'رفع صورة'}
            <input type="file" accept="image/*" className="hidden" disabled={imageBusy} onChange={(e) => uploadExamImage(e.target.files?.[0])} />
          </label>
        </div>
        <ImageFitControls imageUrl={examEditDraft.examImageUrl} value={examEditDraft.imagePlacement} onChange={(v) => setExamEditDraft({...examEditDraft, imagePlacement: v})} title="تظبيط صورة الامتحان داخل الإطار" />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
        <label className="flex items-center gap-2 font-black text-blue-900 text-sm">
          <input
            type="checkbox"
            className="w-5 h-5"
            checked={!!examEditDraft.accessRule?.enabled}
            onChange={e => setExamEditDraft({...examEditDraft, accessRule: {...(examEditDraft.accessRule || {}), enabled: e.target.checked, visibilityWhenLocked: 'locked', allowAdminOverride: true}})}
          />
          شروط فتح الامتحان: يظهر مقفولًا للطالب حتى يجتاز امتحانًا سابقًا
        </label>
        {examEditDraft.accessRule?.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              className="border p-3 rounded-xl bg-white"
              value={examEditDraft.accessRule?.requiredExamId || ''}
              onChange={e => setExamEditDraft({...examEditDraft, accessRule: {...(examEditDraft.accessRule || {}), requiredExamId: e.target.value}})}
            >
              <option value="">اختر الامتحان السابق</option>
              {examsList.filter(exam => exam.id !== editingFullExam.id).map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
            </select>
            <input
              type="number"
              min="0"
              max="100"
              className="border p-3 rounded-xl"
              placeholder="النسبة المطلوبة %"
              value={examEditDraft.accessRule?.requiredPercentage ?? 70}
              onChange={e => setExamEditDraft({...examEditDraft, accessRule: {...(examEditDraft.accessRule || {}), requiredPercentage: Number(e.target.value)}})}
            />
            <label className="bg-white border rounded-xl p-3 text-sm font-bold text-slate-700 flex items-center gap-2">
              <input
                type="checkbox"
                checked={examEditDraft.accessRule?.useBestAttempt !== false}
                onChange={e => setExamEditDraft({...examEditDraft, accessRule: {...(examEditDraft.accessRule || {}), useBestAttempt: e.target.checked}})}
              />
              اعتماد أفضل محاولة للطالب
            </label>
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <label className="block font-black text-slate-800 mb-1">تصحيح الإجابات من داخل المنصة</label>
            <p className="text-xs text-slate-500">غيّر الإجابة الصحيحة أو درجة السؤال من هنا بدون كتابة كود. المادة/النص والامتحان يظلوا كما هم إلا لو عدلتهم بنفسك.</p>
          </div>
          <span className="bg-white border px-3 py-1 rounded-full text-xs font-bold text-slate-600">{examEditQuestionsPreview.length} سؤال</span>
        </div>

        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {examEditQuestionsPreview.length === 0 ? (
            <div className="bg-white border border-dashed rounded-xl p-5 text-center text-slate-400 font-bold">
              لا يمكن عرض محرر الأسئلة لأن صيغة الأسئلة غير مقروءة.
            </div>
          ) : examEditQuestionsPreview.map((q, idx) => (
            <div key={`${q.blockIndex}-${q.questionIndex}-${q.id || idx}`} className="bg-white border rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-bold">سؤال {idx + 1}</span>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold">{q.branch || 'عام'}</span>
                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-bold">{q.type === 'essay' ? 'مقالي' : 'اختياري'}</span>
                  </div>
                  <p className="font-bold text-slate-800 leading-relaxed">{String(q.text || '').replaceAll('|', ' / ')}</p>
                </div>
              </div>

              {q.type === 'essay' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500">درجة السؤال المقالي من</span>
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded-xl p-3 mt-1"
                      value={q.maxScore ?? q.mark ?? 10}
                      onChange={e => updateQuestionInExamDraft(q.blockIndex, q.questionIndex, { maxScore: safeNumber(e.target.value, 10), mark: safeNumber(e.target.value, 10) })}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500">نموذج إجابة مختصر</span>
                    <input
                      className="w-full border rounded-xl p-3 mt-1"
                      value={q.modelAnswer || ''}
                      onChange={e => updateQuestionInExamDraft(q.blockIndex, q.questionIndex, { modelAnswer: e.target.value })}
                      placeholder="اختياري"
                    />
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500">الإجابة الصحيحة</span>
                    <select
                      className="w-full border rounded-xl p-3 mt-1"
                      value={q.correctIdx ?? 0}
                      onChange={e => updateQuestionInExamDraft(q.blockIndex, q.questionIndex, { correctIdx: safeNumber(e.target.value, 0) })}
                    >
                      {(Array.isArray(q.options) ? q.options : []).map((opt, optIdx) => (
                        <option key={optIdx} value={optIdx}>{optIdx + 1} - {opt}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500">درجة السؤال</span>
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded-xl p-3 mt-1"
                      value={q.maxScore ?? q.mark ?? 1}
                      onChange={e => updateQuestionInExamDraft(q.blockIndex, q.questionIndex, { maxScore: safeNumber(e.target.value, 1), mark: safeNumber(e.target.value, 1) })}
                    />
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <details className="bg-white border rounded-2xl p-4">
          <summary className="cursor-pointer font-bold text-slate-700">تعديل متقدم للأسئلة بصيغة JSON</summary>
          <p className="text-xs text-slate-500 my-2">استخدمه فقط لو عايز تعدل نص السؤال أو الاختيارات أو الفروع بشكل متقدم.</p>
          <textarea className="w-full border rounded-xl p-3 min-h-[320px] font-mono text-xs text-left direction-ltr" dir="ltr" value={examEditDraft.questionsText} onChange={e => setExamEditDraft({...examEditDraft, questionsText: e.target.value})} />
        </details>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <button type="submit" className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black hover:bg-emerald-700">حفظ</button>
        <button type="button" onClick={() => setEditingFullExam(null)} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-black hover:bg-slate-300">إلغاء</button>
      </div>
    </form>
  </div>
</div>
  );
}
