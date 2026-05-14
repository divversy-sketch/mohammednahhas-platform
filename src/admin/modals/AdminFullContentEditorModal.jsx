
import { useState } from 'react';
import { Edit, UploadCloud, X } from '../../shared/icons/lucide-shim.jsx';
import { GradeOptions } from '../../shared/constants/grades';
import { uploadToCloudinary } from '../../services/cloudinaryUpload';
import { platformNotify } from '../../shared/core/platformShared.jsx';
import ImageFitControls from '../../shared/ui/ImageFitControls.jsx';

export default function AdminFullContentEditorModal({
  editingFullContent, setEditingFullContent,
  contentEditMode, setContentEditMode,
  contentEditDraft, setContentEditDraft,
  examsList, saveFullContentEdit
}) {
  const [thumbBusy, setThumbBusy] = useState(false);
  const uploadThumb = async (file) => {
    if (!file) return;
    try {
      setThumbBusy(true);
      const uploaded = await uploadToCloudinary(file, { kind: 'image', folder: 'nahhas-platform/images' });
      setContentEditDraft({ ...contentEditDraft, thumbnailUrl: uploaded.url });
      platformNotify('تم رفع صورة المحتوى بنجاح.');
    } catch (err) {
      platformNotify(err?.message || 'فشل رفع صورة المحتوى.');
    } finally {
      setThumbBusy(false);
    }
  };
  if (!editingFullContent) return null;
  return (
<div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
  <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl">
    <div className="flex justify-between items-center mb-5 border-b pb-3">
      <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Edit size={22}/> تعديل المحتوى بالكامل</h3>
      <button onClick={() => setEditingFullContent(null)} className="text-slate-400 hover:text-red-600"><X size={26}/></button>
    </div>

    <form onSubmit={saveFullContentEdit} className="grid gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="bg-slate-50 border rounded-xl p-3 flex items-center gap-2 font-bold">
          <input type="radio" checked={contentEditMode === 'direct'} onChange={() => setContentEditMode('direct')} />
          تعديل مباشر
        </label>
        <label className="bg-slate-50 border rounded-xl p-3 flex items-center gap-2 font-bold">
          <input type="radio" checked={contentEditMode === 'clone'} onChange={() => setContentEditMode('clone')} />
          إنشاء نسخة جديدة
        </label>
        <label className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 font-bold text-amber-800">
          <input type="checkbox" checked={contentEditDraft.isPremium} onChange={e => setContentEditDraft({...contentEditDraft, isPremium: e.target.checked})} />
          VIP فقط
        </label>
      </div>

      <input className="border p-3 rounded-xl" placeholder="العنوان" value={contentEditDraft.title} onChange={e => setContentEditDraft({...contentEditDraft, title: e.target.value})} />
      <input className="border p-3 rounded-xl" placeholder="الرابط / رابط الفيديو / رابط الملف" value={contentEditDraft.url} onChange={e => setContentEditDraft({...contentEditDraft, url: e.target.value})} />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div>
            <label className="block text-sm font-black text-amber-900 mb-1">صورة المحتوى / الغلاف</label>
            <input className="border p-3 rounded-xl w-full bg-white" placeholder="رابط الصورة أو ارفع صورة" value={contentEditDraft.thumbnailUrl || ''} onChange={e => setContentEditDraft({...contentEditDraft, thumbnailUrl: e.target.value})} />
            <p className="text-xs text-amber-800 font-bold mt-1">تظهر مع الفيديو، PDF، المحتوى التفاعلي، الامتحان التفاعلي، والروابط.</p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center justify-center gap-2 bg-amber-600 text-white px-5 py-3 rounded-xl font-black cursor-pointer">
              <UploadCloud size={16}/> {thumbBusy ? 'جاري الرفع...' : 'رفع صورة'}
              <input type="file" accept="image/*" className="hidden" disabled={thumbBusy} onChange={(e) => uploadThumb(e.target.files?.[0])} />
            </label>
          </div>
          <div className="md:col-span-2">
            <ImageFitControls imageUrl={contentEditDraft.thumbnailUrl} value={contentEditDraft.imagePlacement} onChange={(v) => setContentEditDraft({...contentEditDraft, imagePlacement: v})} />
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select className="border p-3 rounded-xl" value={contentEditDraft.type} onChange={e => setContentEditDraft({...contentEditDraft, type: e.target.value})}>
          <option value="video">فيديو مدمج</option><option value="file">ملف PDF</option><option value="html">HTML تفاعلي</option><option value="interactive_exam">امتحان تفاعلي</option><option value="link">رابط خارجي</option>
        </select>
        <select className="border p-3 rounded-xl" value={contentEditDraft.grade} onChange={e => setContentEditDraft({...contentEditDraft, grade: e.target.value})}><GradeOptions/></select>
        <input className="border p-3 rounded-xl" placeholder="الفرع" value={contentEditDraft.branch} onChange={e => setContentEditDraft({...contentEditDraft, branch: e.target.value})} />
      </div>

      {contentEditDraft.type === 'video' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <select className="border p-3 rounded-xl bg-white" value={contentEditDraft.videoSection} onChange={e => setContentEditDraft({...contentEditDraft, videoSection: e.target.value})}>
            <option value="explanation">شرح الدرس</option><option value="exercises">حل التدريبات</option><option value="reviews">مراجعة نهائية</option>
          </select>
          <select className="border p-3 rounded-xl bg-white" value={contentEditDraft.linkedExamId} onChange={e => setContentEditDraft({...contentEditDraft, linkedExamId: e.target.value})}>
            <option value="">بدون امتحان مرتبط</option>
            {examsList.filter(exam => !contentEditDraft.grade || exam.grade === contentEditDraft.grade).map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
          </select>
          <input type="number" min="1" className="border p-3 rounded-xl bg-white" placeholder="مدة الفيديو بالدقائق" value={contentEditDraft.estimatedDurationMinutes} onChange={e => setContentEditDraft({...contentEditDraft, estimatedDurationMinutes: e.target.value})} />
        </div>
      )}

      <textarea className="border p-3 rounded-xl min-h-[80px]" placeholder="إيميلات مسموحة مفصولة بفاصلة، أو اتركها فارغة للجميع" value={contentEditDraft.allowedEmailsText} onChange={e => setContentEditDraft({...contentEditDraft, allowedEmailsText: e.target.value})} />
      <label className="flex items-center gap-2 bg-slate-50 border rounded-xl p-3 font-bold"><input type="checkbox" checked={contentEditDraft.isPublic} onChange={e => setContentEditDraft({...contentEditDraft, isPublic: e.target.checked})}/> يظهر للزوار في الصفحة الرئيسية</label>

      <div className="flex flex-col md:flex-row gap-3">
        <button type="submit" className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black hover:bg-emerald-700">حفظ</button>
        <button type="button" onClick={() => setEditingFullContent(null)} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-black hover:bg-slate-300">إلغاء</button>
      </div>
    </form>
  </div>
</div>
  );
}
