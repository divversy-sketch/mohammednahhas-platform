import { AlertTriangle } from '../../../shared/icons/lucide-shim.jsx';

export default function ExamSubmitConfirmDialog({ onSubmit, onCancel }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" dir="rtl">
      <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white p-7 text-center shadow-2xl md:p-9">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-500"><AlertTriangle className="h-9 w-9" /></div>
        <h3 className="text-2xl font-black text-slate-900">هل تريد إنهاء الامتحان؟</h3>
        <p className="mt-3 font-bold leading-7 text-slate-500">بعد التسليم لن تتمكن من تعديل إجاباتك، وسيتم نقلك مباشرة إلى صفحة النتيجة.</p>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="rounded-xl border border-slate-200 bg-white py-3 font-black text-slate-700 transition hover:bg-slate-50">العودة للامتحان</button>
          <button onClick={onSubmit} className="rounded-xl bg-gradient-to-l from-indigo-600 to-violet-600 py-3 font-black text-white shadow-lg shadow-indigo-200 transition hover:brightness-105">تأكيد التسليم</button>
        </div>
      </div>
    </div>
  );
}
