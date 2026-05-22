import { AnimatePresence, motion } from 'framer-motion';
import { PenLine, Play, Trash2, X } from '@shared/icons/lucide-shim.jsx';

export const VideoNotesPanel = ({
  showNotes,
  notes,
  currentNote,
  setCurrentNote,
  onClose,
  onAddNote,
  onJumpToTime,
  onDeleteNote,
  formatMinSec
}) => (
  <AnimatePresence>
    {showNotes && (
      <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }} className="w-full md:w-80 h-1/2 md:h-full bg-white rounded-t-2xl md:rounded-l-none md:rounded-r-2xl flex flex-col shadow-2xl relative z-[70] overflow-hidden">
        <div className="p-4 bg-blue-600 text-white font-bold flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2"><PenLine size={20}/> دفتر الملاحظات</div>
          <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
          {notes.length === 0 ? (
            <div className="text-center text-slate-400 mt-10"><PenLine size={40} className="mx-auto mb-2 opacity-50"/><p>لم تضف أي ملاحظات بعد.</p><p className="text-xs mt-1">الملاحظات بتتربط بوقت الفيديو عشان ترجعلها بسرعة.</p></div>
          ) : notes.map(note => (
            <div key={note.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 group">
              <div className="flex justify-between items-start mb-2">
                <button onClick={() => onJumpToTime(note.timestamp)} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold hover:bg-blue-200 transition flex items-center gap-1"><Play size={10} fill="currentColor"/> الدقيقة {formatMinSec(note.timestamp)}</button>
                <button onClick={() => onDeleteNote(note.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14}/></button>
              </div>
              <p className="text-sm text-slate-700 font-bold whitespace-pre-wrap">{note.text}</p>
            </div>
          ))}
        </div>
        <form onSubmit={onAddNote} className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2">
          <textarea className="w-full border-2 border-slate-200 rounded-xl p-2 text-sm focus:border-blue-500 outline-none transition resize-none h-20" placeholder="اكتب ملاحظتك هنا (سيتم حفظها بوقت الفيديو الحالي)..." value={currentNote} onChange={e => setCurrentNote(e.target.value)} />
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl shadow-md hover:bg-blue-700 transition">إضافة الملاحظة</button>
        </form>
      </motion.div>
    )}
  </AnimatePresence>
);

export default VideoNotesPanel;
