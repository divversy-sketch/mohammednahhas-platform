import { AlertOctagon } from '@shared/icons/lucide-shim.jsx';

export const ExamEmptyState = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white font-['Cairo']">
    عفواً، لا توجد أسئلة.
    <button onClick={onClose} className="ml-4 bg-gray-200 px-4 py-2 rounded">خروج</button>
  </div>
);

export const ExamCheatingScreen = ({ onClose }) => (
  <div className="fixed inset-0 z-[60] bg-red-900 flex items-center justify-center text-white text-center p-6" dir="rtl" style={{ fontFamily: "'Almarai', 'Readex Pro', system-ui, sans-serif" }}>
    <div style={{ maxWidth: 440 }}>
      <AlertOctagon size={76} className="mx-auto mb-4" />
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>اتقفل امتحانك</h1>
      <p className="text-red-100 mt-3" style={{ lineHeight: 1.9 }}>خرجت من شاشة الامتحان لتبويب أو تطبيق تاني، فاتسجلت محاولة غش ووصلت للمستر.</p>
      <p className="text-red-200 mt-2" style={{ lineHeight: 1.9, fontSize: 14 }}>إجاباتك اللي اتحفظت لحد دلوقتي موجودة. المستر بس هو اللي يقدر يسمح لك تكمّل أو تعيد الامتحان.</p>
      <button type="button" onClick={() => (onClose ? onClose() : window.location.reload())} className="mt-5 bg-white text-red-900 px-6 py-3 rounded-full font-bold">رجوع للرئيسية</button>
    </div>
  </div>
);
