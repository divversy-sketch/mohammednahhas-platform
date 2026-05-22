import { AlertOctagon } from '@shared/icons/lucide-shim.jsx';

export const ExamEmptyState = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white font-['Cairo']">
    عفواً، لا توجد أسئلة.
    <button onClick={onClose} className="ml-4 bg-gray-200 px-4 py-2 rounded">خروج</button>
  </div>
);

export const ExamCheatingScreen = () => (
  <div className="fixed inset-0 z-[60] bg-red-900 flex items-center justify-center text-white text-center font-['Cairo']">
    <div>
      <AlertOctagon size={80} className="mx-auto mb-4" />
      <h1>تم رصد محاولة غش!</h1>
      <p className="text-red-200 mt-2">خرجت من الامتحان. تم رصد درجتك (صفر) وحظرك من الامتحانات القادمة.</p>
      <button onClick={() => window.location.reload()} className="mt-4 bg-white text-red-900 px-6 py-2 rounded-full font-bold">العودة للرئيسية</button>
    </div>
  </div>
);
