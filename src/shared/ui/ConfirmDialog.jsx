
import { AlertTriangle, X } from '../icons/lucide-shim.jsx';

export default function ConfirmDialog({ open, title = 'تأكيد العملية', message, confirmText = 'تأكيد', cancelText = 'إلغاء', tone = 'danger', busy = false, onConfirm, onCancel }) {
  if (!open) return null;
  const isDanger = tone === 'danger';
  return (
    <div className="fixed inset-0 z-[10020] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl border shadow-2xl overflow-hidden">
        <div className={`p-5 flex items-start gap-3 ${isDanger ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'}`}>
          <div className={`p-3 rounded-2xl ${isDanger ? 'bg-red-100' : 'bg-amber-100'}`}><AlertTriangle /></div>
          <div className="flex-1">
            <h3 className="text-xl font-black">{title}</h3>
            <p className="mt-1 text-sm font-bold leading-7 text-slate-600">{message}</p>
          </div>
          <button type="button" onClick={onCancel} className="p-2 rounded-xl hover:bg-white/70" disabled={busy}><X size={18} /></button>
        </div>
        <div className="p-4 flex gap-3 justify-end">
          <button type="button" onClick={onCancel} disabled={busy} className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black hover:bg-slate-200">{cancelText}</button>
          <button type="button" onClick={onConfirm} disabled={busy} className={`px-5 py-3 rounded-2xl text-white font-black shadow ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>{busy ? 'جاري التنفيذ...' : confirmText}</button>
        </div>
      </div>
    </div>
  );
}
