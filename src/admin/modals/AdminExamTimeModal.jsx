
import { X, Calendar } from '../../shared/icons/lucide-shim.jsx';

export default function AdminExamTimeModal({ editingExamTime, setEditingExamTime, newEndTime, setNewEndTime, handleUpdateExamTime }) {
  if (!editingExamTime) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
        <button onClick={() => setEditingExamTime(null)} className="absolute top-4 left-4 text-slate-400 hover:text-red-500"><X size={24}/></button>
        <h3 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2"><Calendar size={24}/> تمديد وقت الامتحان</h3>
        <p className="text-sm text-slate-600 mb-6 font-bold">{editingExamTime.title}</p>
        <form onSubmit={handleUpdateExamTime}>
          <label className="block text-sm font-bold mb-2 text-slate-800">تاريخ ووقت الانتهاء الجديد:</label>
          <input type="datetime-local" className="w-full border-2 border-blue-200 p-3 rounded-xl mb-6 bg-blue-50 focus:border-blue-500 outline-none transition" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} required />
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/50">حفظ التعديل</button>
        </form>
      </div>
    </div>
  );
}
