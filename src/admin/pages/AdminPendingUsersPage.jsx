
import { Check, X } from '../../shared/icons/lucide-shim.jsx';

export default function AdminPendingUsersPage({ filteredPendingUsers, handleApprove, handleReject }) {
  return (
    <div className="glass-panel p-4 md:p-6 rounded-xl">
      <h2 className="font-bold mb-4 font-arabic text-xl">طلبات الانضمام</h2>
      {filteredPendingUsers.map(u => (
        <div key={u.id} className="border p-4 mb-2 rounded-lg flex flex-col md:flex-row gap-3 justify-between bg-white/50 backdrop-blur-sm">
          <div>
            <p className="font-bold">{u.name}</p>
            <p className="text-sm">{u.grade}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleApprove(u.id)} className="bg-green-600 text-white px-3 py-1 rounded shadow-lg hover:shadow-green-500/50 transition flex-1"><Check className="mx-auto"/></button>
            <button onClick={() => handleReject(u.id)} className="bg-red-600 text-white px-3 py-1 rounded shadow-lg hover:shadow-red-500/50 transition flex-1"><X className="mx-auto"/></button>
          </div>
        </div>
      ))}
    </div>
  );
}
