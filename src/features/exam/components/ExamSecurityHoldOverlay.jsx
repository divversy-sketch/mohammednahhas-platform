
import { ShieldAlert } from '../../../shared/icons/lucide-shim.jsx';

export default function ExamSecurityHoldOverlay({ onClose }) {
  return (
    <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-7 max-w-lg w-full shadow-2xl text-center border-t-8 border-red-500">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-2xl font-black mb-2 text-slate-900">تم إيقاف المحاولة مؤقتًا</h3>
        <p className="text-slate-600 mb-5 font-bold leading-relaxed">
          تم رصد أكثر من مخالفة أمان أثناء الامتحان. تم حفظ إجاباتك والوقت المتبقي، ولن يتم تصفيرك تلقائيًا.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-right text-sm text-red-800 mb-6 space-y-2">
          <p><b>القرار الآن عند الأدمن فقط:</b></p>
          <p>يمكن للأدمن من لوحة النتائج أن يسمح لك باستكمال الامتحان بنفس الإجابات والوقت المتبقي.</p>
          <p>أو يسمح بإعادة الامتحان من البداية إذا رأى أن الحالة تستحق ذلك.</p>
          <p className="font-black">نظام الأمان سيظل نشطًا بنفس الصرامة بعد السماح.</p>
        </div>
        <button onClick={onClose} className="bg-slate-900 text-white py-3 px-8 rounded-xl font-bold hover:bg-slate-800 shadow-md transition">
          العودة للمنصة وانتظار قرار الأدمن
        </button>
      </div>
    </div>
  );
}
