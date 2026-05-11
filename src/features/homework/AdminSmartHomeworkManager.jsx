import { useMemo, useState } from 'react';
import { addDoc, collection, doc, getDocs, query, serverTimestamp, setDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { BookOpen, ClipboardList, Download, QrCode, Trash2, BarChart3 } from '../../shared/icons/lucide-shim.jsx';
import { GradeOptions, getGradeLabel } from '../../shared/constants/grades';
import { platformConfirm } from '../../shared/core/platformShared.jsx';

const defaultHw = {
  title: '', bookName: '', grade: '3sec', answerKey: '', instructions: '',
  startAt: '', endAt: '', maxAttempts: 1, allowResubmit: false,
  showResultToStudent: true, showFeedbackToStudent: true, status: 'active'
};

const qrUrl = (link, size = 180) => `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(link)}`;

const AdminSmartHomeworkManager = ({ smartHomeworks = [], hwResults = [], adminGradeFilter = 'all', onNotify = () => {}, onDeleteAll }) => {
  const [draft, setDraft] = useState(defaultHw);
  const [saving, setSaving] = useState(false);

  const filteredHw = smartHomeworks.filter(hw => adminGradeFilter === 'all' || hw.grade === adminGradeFilter);
  const resultsByHw = useMemo(() => hwResults.reduce((acc, r) => { const id = r.homeworkId || r.hwId; if (!acc[id]) acc[id] = []; acc[id].push(r); return acc; }, {}), [hwResults]);

  const createHomework = async (e) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.bookName.trim() || !draft.answerKey.trim()) return onNotify('أكمل العنوان والكتاب ونموذج الإجابة.');
    setSaving(true);
    try {
      const publicPayload = {
        title: draft.title.trim(), bookName: draft.bookName.trim(), grade: draft.grade,
        instructions: draft.instructions.trim(), startAt: draft.startAt || null, endAt: draft.endAt || null,
        maxAttempts: Number(draft.maxAttempts || 1), allowResubmit: Boolean(draft.allowResubmit),
        showResultToStudent: Boolean(draft.showResultToStudent), showFeedbackToStudent: Boolean(draft.showFeedbackToStudent),
        status: draft.status || 'active', gradingMode: 'cloud_function', createdAt: serverTimestamp()
      };
      const ref = await addDoc(collection(db, 'smart_homeworks'), publicPayload);
      await setDoc(doc(db, 'smart_homeworks', ref.id, 'private', 'answerKey'), {
        answerKey: draft.answerKey.trim(), updatedAt: serverTimestamp()
      });
      setDraft(defaultHw);
      onNotify('تم إنشاء واجب QR آمن. نموذج الإجابة لم يعد يظهر للطالب.');
    } catch (error) {
      console.error(error);
      onNotify('حدث خطأ أثناء إنشاء واجب QR.');
    } finally { setSaving(false); }
  };

  const deleteHomework = async (hw) => {
    if (!platformConfirm('حذف واجب QR ونتائجه؟')) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, 'smart_homeworks', hw.id));
    batch.delete(doc(db, 'smart_homeworks', hw.id, 'private', 'answerKey'));
    const resultsSnap = await getDocs(query(collection(db, 'homework_results'), where('homeworkId', '==', hw.id)));
    resultsSnap.forEach(d => batch.delete(d.ref));
    await batch.commit();
    onNotify('تم حذف الواجب ونتائجه.');
  };

  const downloadQr = async (link, title) => {
    const a = document.createElement('a');
    a.href = qrUrl(link, 320);
    a.download = `${title || 'smart-homework'}-qr.png`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 md:p-6 rounded-3xl">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-5">
          <div><h2 className="text-2xl font-black text-blue-800 flex items-center gap-2"><QrCode/> واجب QR الذكي المطور</h2><p className="text-sm text-slate-500 mt-1">تصحيح آمن من Cloud Function، محاولات، مواعيد إتاحة، وتحليل نتائج.</p></div>
          {onDeleteAll && <button onClick={onDeleteAll} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 justify-center"><Trash2 size={16}/> حذف كل الواجبات والسجلات</button>}
        </div>
        <form onSubmit={createHomework} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="text-xs font-black text-slate-500">المرحلة</label><select className="border p-3 rounded-xl w-full bg-white" value={draft.grade} onChange={e=>setDraft({...draft, grade:e.target.value})}><GradeOptions/></select></div>
          <div><label className="text-xs font-black text-slate-500">اسم الكتاب</label><input className="border p-3 rounded-xl w-full" value={draft.bookName} onChange={e=>setDraft({...draft, bookName:e.target.value})} required/></div>
          <div className="md:col-span-2"><label className="text-xs font-black text-slate-500">عنوان الواجب / الصفحة</label><input className="border p-3 rounded-xl w-full" value={draft.title} onChange={e=>setDraft({...draft, title:e.target.value})} required/></div>
          <div className="md:col-span-2"><label className="text-xs font-black text-slate-500">تعليمات للطالب</label><textarea className="border p-3 rounded-xl w-full h-20" value={draft.instructions} onChange={e=>setDraft({...draft, instructions:e.target.value})}/></div>
          <div className="md:col-span-2"><label className="text-xs font-black text-slate-500">نموذج الإجابة الآمن</label><textarea className="border p-3 rounded-xl w-full h-24 font-mono" placeholder="1-أ, 2-ج, 3-د" value={draft.answerKey} onChange={e=>setDraft({...draft, answerKey:e.target.value})} required/></div>
          <div><label className="text-xs font-black text-slate-500">بداية الإتاحة</label><input type="datetime-local" className="border p-3 rounded-xl w-full" value={draft.startAt} onChange={e=>setDraft({...draft, startAt:e.target.value})}/></div>
          <div><label className="text-xs font-black text-slate-500">نهاية الإتاحة</label><input type="datetime-local" className="border p-3 rounded-xl w-full" value={draft.endAt} onChange={e=>setDraft({...draft, endAt:e.target.value})}/></div>
          <div><label className="text-xs font-black text-slate-500">عدد المحاولات</label><input type="number" min="1" className="border p-3 rounded-xl w-full" value={draft.maxAttempts} onChange={e=>setDraft({...draft, maxAttempts:e.target.value})}/></div>
          <div><label className="text-xs font-black text-slate-500">الحالة</label><select className="border p-3 rounded-xl w-full bg-white" value={draft.status} onChange={e=>setDraft({...draft, status:e.target.value})}><option value="active">متاح</option><option value="draft">مسودة</option><option value="closed">مغلق</option></select></div>
          <label className="flex items-center gap-2 bg-white rounded-xl border p-3 font-bold text-sm"><input type="checkbox" checked={draft.allowResubmit} onChange={e=>setDraft({...draft, allowResubmit:e.target.checked})}/> السماح بإعادة التسليم</label>
          <label className="flex items-center gap-2 bg-white rounded-xl border p-3 font-bold text-sm"><input type="checkbox" checked={draft.showResultToStudent} onChange={e=>setDraft({...draft, showResultToStudent:e.target.checked})}/> إظهار الدرجة للطالب</label>
          <label className="flex items-center gap-2 bg-white rounded-xl border p-3 font-bold text-sm"><input type="checkbox" checked={draft.showFeedbackToStudent} onChange={e=>setDraft({...draft, showFeedbackToStudent:e.target.checked})}/> إظهار التعليق والتفاصيل</label>
          <button disabled={saving} className="md:col-span-2 bg-blue-700 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-800">{saving ? 'جاري الحفظ...' : 'إنشاء واجب QR آمن'}</button>
        </form>
      </div>

      <div className="glass-panel p-4 md:p-6 rounded-3xl">
        <h3 className="font-black text-xl mb-5 flex items-center gap-2"><BookOpen className="text-amber-600"/> الواجبات والـ QR</h3>
        <div className="space-y-5">
          {filteredHw.length === 0 ? <p className="text-slate-500 bg-white rounded-2xl p-6 text-center">لا توجد واجبات QR.</p> : filteredHw.map(hw => {
            const link = `${window.location.origin}/?hw=${hw.id}`;
            const rows = resultsByHw[hw.id] || [];
            const avg = rows.length ? Math.round(rows.reduce((s, r) => s + ((Number(r.score||0) / Math.max(1, Number(r.total||1))) * 100), 0) / rows.length) : 0;
            return <div key={hw.id} className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm grid grid-cols-1 lg:grid-cols-[1fr_190px] gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2"><h4 className="font-black text-lg text-slate-900">{hw.title}</h4><span className="text-xs bg-slate-100 px-2 py-1 rounded-full font-bold">{getGradeLabel(hw.grade)}</span><span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-bold">{hw.bookName}</span></div>
                <p className="text-xs text-slate-500 mb-3">المحاولات: {hw.maxAttempts || 1} · التسليمات: {rows.length} · متوسط: {avg}% · الحالة: {hw.status || 'active'}</p>
                <code className="block bg-slate-50 border rounded-xl p-2 text-xs break-all select-all mb-3">{link}</code>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(link); onNotify('تم نسخ رابط الواجب.'); }} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2"><ClipboardList size={16}/> نسخ الرابط</button>
                  <button onClick={() => downloadQr(link, hw.title)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2"><Download size={16}/> تحميل QR</button>
                  <button onClick={() => deleteHomework(hw)} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2"><Trash2 size={16}/> حذف</button>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl border p-3"><img alt="QR" src={qrUrl(link)} className="w-40 h-40"/><p className="text-xs font-bold text-slate-500 mt-2">QR جاهز للطباعة</p></div>
            </div>;
          })}
        </div>
      </div>

      <div className="glass-panel p-4 md:p-6 rounded-3xl">
        <h3 className="font-black text-xl mb-5 flex items-center gap-2"><BarChart3 className="text-emerald-600"/> نتائج واجبات QR</h3>
        <div className="space-y-2 overflow-x-auto"><div className="min-w-[760px] space-y-2">
          {hwResults.filter(res => adminGradeFilter === 'all' || res.grade === adminGradeFilter).map(res => <div key={res.id} className="grid grid-cols-5 gap-3 bg-white border rounded-2xl p-3 items-center">
            <p className="font-black text-slate-800">{res.studentName}</p><p className="text-sm text-slate-500">{res.homeworkTitle}</p><p className="text-sm text-slate-500">{res.bookName}</p><p className="font-black text-emerald-700">{res.score}/{res.total}</p><p className="text-xs text-slate-400">{res.submittedAt?.toDate?.().toLocaleString('ar-EG') || '-'}</p>
          </div>)}
          {hwResults.length === 0 && <p className="text-center py-8 text-slate-500 bg-white rounded-2xl">لا توجد نتائج QR بعد.</p>}
        </div></div>
      </div>
    </div>
  );
};

export default AdminSmartHomeworkManager;
