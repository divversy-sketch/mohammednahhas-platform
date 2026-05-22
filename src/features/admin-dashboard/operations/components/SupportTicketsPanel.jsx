import { StatBox } from './StatBox.jsx';

export function SupportTicketsPanel({ supportTickets = [], openTickets = 0, replyDrafts = {}, setReplyDrafts, replyTicket, closeTicket, statusLabel }) {
  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-3 gap-3">
        <StatBox title="تذاكر مفتوحة" value={openTickets} />
        <StatBox title="كل التذاكر" value={supportTickets.length} />
        <StatBox title="تم الرد" value={supportTickets.filter((ticket) => ticket.status === 'replied').length} />
      </div>
      <section className="bg-white rounded-3xl border p-5">
        <h3 className="font-black mb-3">تذاكر الطلاب</h3>
        {supportTickets.length ? supportTickets.map((ticket) => (
          <div key={ticket.id} className="border rounded-2xl p-4 mb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <b>{ticket.studentName || ticket.studentEmail || ticket.id}</b>
                <p className="text-sm text-slate-600">{ticket.lastMessage || ticket.lastReply || '—'}</p>
                <p className="text-xs text-slate-400">{ticket.category || 'عام'} • {statusLabel(ticket.status || 'open')}</p>
              </div>
              <button onClick={() => closeTicket(ticket)} className="bg-slate-100 text-slate-700 rounded-xl px-3 py-2 font-bold">إغلاق</button>
            </div>
            <div className="grid md:grid-cols-[1fr_auto] gap-2 mt-3">
              <input className="border rounded-xl p-3" placeholder="رد الإدارة" value={replyDrafts[ticket.id] || ''} onChange={(event) => setReplyDrafts({ ...replyDrafts, [ticket.id]: event.target.value })} />
              <button onClick={() => replyTicket(ticket)} className="bg-sky-700 text-white rounded-xl px-5 py-3 font-black">رد</button>
            </div>
          </div>
        )) : <p className="text-slate-500 font-bold">لا توجد تذاكر بعد.</p>}
      </section>
    </div>
  );
}
