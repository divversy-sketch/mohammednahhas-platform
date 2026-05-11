
import { AlertTriangle } from '../../../shared/icons/lucide-shim.jsx';

export default function ExamSubmitConfirmDialog({ onSubmit, onCancel }) {
  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border-t-8 border-amber-500">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2 text-slate-800">هل أنت متأكد من التسليم؟</h3>
        <p className="text-slate-500 mb-8 font-bold">لن يمكنك تعديل إجاباتك بعد ذلك، وسيتم نقلك للوحة النتيجة.</p>
        <div className="flex gap-4">
          <button onClick={onSubmit} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-md transition">نعم، سلم الآن</button>
          <button onClick={onCancel} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300 shadow-sm transition">تراجع</button>
        </div>
      </div>
    </div>
  );
}
