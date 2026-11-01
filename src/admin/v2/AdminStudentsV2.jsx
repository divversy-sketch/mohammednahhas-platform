// «سجل الطلاب» بالشكل الجديد: نفس الإجراءات القديمة بالظبط (ملف الطالب، تعديل، VIP، حظر، كلمة السر، حذف،
// طلب تغيير الصف)، بس متنظمة: فلاتر بضغطة، بحث، صف واضح لكل طالب، وقائمة إجراءات.
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@v2/ui/Icon.jsx';
import { formatNumber } from '@v2/ui/kit.jsx';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades';
import { normalizeEgyptPhone } from '@shared/utils/phone';
import { platformConfirm } from '@shared/core/platformShared.jsx';
import '@styles/pages/admin-people.css';

const ms = (v) => (v?.toMillis ? v.toMillis() : v?.toDate ? v.toDate().getTime() : v?.seconds ? v.seconds * 1000 : v ? new Date(v).getTime() || 0 : 0);
const ago = (t) => {
  if (!t) return 'ما دخلش لسه';
  const d = Math.floor((Date.now() - t) / 864e5);
  if (d < 1) return 'دخل النهاردة';
  if (d === 1) return 'دخل امبارح';
  if (d < 30) return `من ${formatNumber(d)} يوم`;
  return new Date(t).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
};
const wa = (p) => `https://wa.me/2${String(p || '').replace(/\D/g, '').replace(/^2?/, '')}`;
const STATUS = { active: 'نشط', banned_all: 'حظر شامل', banned_exam: 'حظر امتحانات', banned_content: 'حظر محتوى', banned_cheating: 'محظور (غش)', rejected: 'مرفوض' };

function RowMenu({ u, ctx }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  }, [open]);
  const act = (fn) => () => { setOpen(false); fn(); };
  return (
    <div className="apl-menu" ref={ref}>
      <button type="button" className="apl-icon" onClick={() => setOpen((v) => !v)} aria-label="إجراءات" aria-expanded={open}><Icon name="menu" /></button>
      {open && (
        <div className="apl-menu__pop" role="menu">
          <button type="button" onClick={act(() => ctx.setEditingUser(u))}><Icon name="edit" />تعديل البيانات</button>
          <button type="button" onClick={act(() => ctx.handleToggleSubscription(u))}><Icon name="crown" />{u.subscriptionStatus === 'premium' ? 'إلغاء باقة VIP' : 'تفعيل باقة VIP'}</button>
          <button type="button" onClick={act(() => ctx.handleSendResetPassword(u))}><Icon name="key" />تغيير كلمة السر</button>
          {u.phone && <a href={wa(u.phone)} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}><Icon name="whatsapp" />واتساب الطالب</a>}
          {u.parentPhone && <a href={wa(u.parentPhone)} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}><Icon name="whatsapp" />واتساب ولي الأمر</a>}
          <button type="button" className="is-danger" onClick={act(() => ctx.handleDeleteUser(u.id))}><Icon name="close" />حذف الطالب</button>
        </div>
      )}
    </div>
  );
}

function EditModal({ ctx }) {
  const u = ctx.editingUser;
  if (!u) return null;
  const set = (patch) => ctx.setEditingUser({ ...u, ...patch });
  return (
    <div className="apl-modal" role="dialog" aria-modal="true" aria-label="تعديل بيانات الطالب" dir="rtl">
      <button type="button" className="apl-modal__scrim" onClick={() => ctx.setEditingUser(null)} aria-label="إغلاق" />
      <form className="apl-modal__box" onSubmit={ctx.handleUpdateUser}>
        <header><b><Icon name="edit" />تعديل بيانات الطالب</b><button type="button" className="apl-icon" onClick={() => ctx.setEditingUser(null)} aria-label="إغلاق"><Icon name="close" /></button></header>
        <label className="apl-field"><span>اسم الطالب</span><input value={u.name || ''} onChange={(e) => set({ name: e.target.value })} required /></label>
        <label className="apl-field"><span>موبايل الطالب</span><input type="tel" dir="ltr" value={u.phone || ''} onChange={(e) => set({ phone: normalizeEgyptPhone(e.target.value) })} required /></label>
        <label className="apl-field"><span>موبايل ولي الأمر</span><input type="tel" dir="ltr" value={u.parentPhone || ''} onChange={(e) => set({ parentPhone: normalizeEgyptPhone(e.target.value) })} required /></label>
        <label className="apl-field"><span>الصف</span><select value={u.grade || '1sec'} onChange={(e) => set({ grade: e.target.value })}><GradeOptions /></select></label>
        <button type="submit" className="apl-btn apl-btn--pri apl-btn--block"><Icon name="check" />احفظ التعديلات</button>
      </form>
    </div>
  );
}

export default function AdminStudentsV2({ ctx }) {
  const {
    dailyFilteredActiveUsers = [], filteredActiveUsers = [], dailyAdminStats = {}, studentSearchTerm = '', setStudentSearchTerm,
    studentStatusFilter = 'all', setStudentStatusFilter, studentSubscriptionFilter = 'all', setStudentSubscriptionFilter,
    exportStudentsExcel, studentsPagination = {}, handleChangeUserStatus, openStudentProfile, approveGrade, rejectGrade,
  } = ctx;
  const items = studentsPagination.pageItems || [];
  const page = studentsPagination.page || 1;
  const pages = studentsPagination.totalPages || 1;

  const kpis = [
    { key: 'all', label: 'كل الطلاب', n: dailyAdminStats.total ?? filteredActiveUsers.length, icon: 'users', on: studentStatusFilter === 'all' && studentSubscriptionFilter === 'all', click: () => { setStudentStatusFilter('all'); setStudentSubscriptionFilter('all'); } },
    { key: 'vip', label: 'VIP', n: dailyAdminStats.vipUsers, icon: 'crown', tone: 'gold', on: studentSubscriptionFilter === 'premium', click: () => setStudentSubscriptionFilter(studentSubscriptionFilter === 'premium' ? 'all' : 'premium') },
    { key: 'free', label: 'مجاني', n: Math.max(0, (dailyAdminStats.total ?? 0) - (dailyAdminStats.vipUsers ?? 0)), icon: 'user', on: studentSubscriptionFilter === 'free', click: () => setStudentSubscriptionFilter(studentSubscriptionFilter === 'free' ? 'all' : 'free') },
    { key: 'banned', label: 'محظورين', n: dailyAdminStats.bannedUsers, icon: 'lock', tone: 'bad', on: studentStatusFilter === 'banned', click: () => setStudentStatusFilter(studentStatusFilter === 'banned' ? 'all' : 'banned') },
    { key: 'grade', label: 'طلبات تغيير صف', n: dailyAdminStats.pendingGradeUpdates, icon: 'route', tone: 'info' },
  ];

  return (
    <div className="apl" dir="rtl">
      <div className="apl-kpis">
        {kpis.map((k) => (
          <button key={k.key} type="button" className={`apl-kpi tone-${k.tone || 'ink'} ${k.on ? 'is-on' : ''}`} onClick={k.click} disabled={!k.click}>
            <span><Icon name={k.icon} />{k.label}</span><b>{formatNumber(k.n || 0)}</b>
          </button>
        ))}
      </div>

      <div className="apl-bar">
        <label className="apl-search"><Icon name="search" /><input value={studentSearchTerm} onChange={(e) => setStudentSearchTerm(e.target.value)} placeholder="دوّر بالاسم أو الرقم أو الإيميل" /></label>
        <select className="apl-select" value={studentStatusFilter} onChange={(e) => setStudentStatusFilter(e.target.value)} aria-label="الحالة">
          <option value="all">كل الحالات</option><option value="active">نشط</option><option value="banned">أي حظر</option>
          <option value="banned_exam">حظر امتحانات</option><option value="banned_content">حظر محتوى</option><option value="banned_all">حظر شامل</option>
        </select>
        <select className="apl-select" value={studentSubscriptionFilter} onChange={(e) => setStudentSubscriptionFilter(e.target.value)} aria-label="الاشتراك">
          <option value="all">كل الاشتراكات</option><option value="premium">VIP بس</option><option value="free">مجاني بس</option>
        </select>
        <span className="apl-sp" />
        <span className="apl-count">{formatNumber(dailyFilteredActiveUsers.length)} من {formatNumber(filteredActiveUsers.length)}</span>
        {exportStudentsExcel && <button type="button" className="apl-btn" onClick={exportStudentsExcel}><Icon name="download" />Excel</button>}
      </div>

      <div className="apl-list">
        {items.map((u) => {
          const banned = String(u.status || '').startsWith('banned');
          const vip = u.subscriptionStatus === 'premium';
          const exp = ms(u.subscriptionExpiry);
          const days = exp ? Math.ceil((exp - Date.now()) / 864e5) : null;
          return (
            <article key={u.id} className={`apl-row ${banned ? 'is-banned' : ''}`}>
              <div className="apl-who">
                <i>{String(u.name || 'ط').trim().charAt(0)}</i>
                <span>
                  <b>{u.name || 'طالب'}</b>
                  <small>{u.email || ''}</small>
                </span>
              </div>
              <div className="apl-tags">
                <em className="apl-chip">{getGradeLabel(u.grade) || u.grade || '—'}</em>
                {vip ? <em className="apl-chip is-gold"><Icon name="crown" />VIP{days !== null ? ` · ${days > 0 ? `${formatNumber(days)} يوم` : 'خلص'}` : ''}</em> : <em className="apl-chip is-mute">مجاني</em>}
                {banned && <em className="apl-chip is-bad"><Icon name="lock" />{STATUS[u.status] || 'محظور'}</em>}
              </div>
              <div className="apl-phones">
                {u.phone ? <a href={`tel:${u.phone}`} dir="ltr"><Icon name="phone" />{u.phone}</a> : <span className="dim">—</span>}
                {u.parentPhone && <a href={`tel:${u.parentPhone}`} dir="ltr" className="is-parent"><Icon name="users" />{u.parentPhone}</a>}
              </div>
              <div className="apl-seen"><small>{ago(ms(u.lastLoginAt || u.lastSeenAt))}</small></div>
              <div className="apl-acts">
                <select className={`apl-status ${banned ? 'is-bad' : ''}`} value={u.status} onChange={(e) => handleChangeUserStatus(u.id, e.target.value)} aria-label="حالة الطالب">
                  <option value="active">نشط</option><option value="banned_all">حظر شامل</option><option value="banned_exam">حظر امتحانات</option><option value="banned_content">حظر محتوى</option>
                </select>
                <button type="button" className="apl-btn apl-btn--pri" onClick={() => openStudentProfile(u)}><Icon name="fileText" />ملف الطالب</button>
                <RowMenu u={u} ctx={ctx} />
              </div>
              {u.gradeUpdateStatus === 'pending' && (
                <div className="apl-req">
                  <span><Icon name="route" />عايز يتنقل لـ <b>{getGradeLabel(u.requestedGrade) || u.requestedGrade}</b></span>
                  <button type="button" className="apl-btn apl-btn--ok" onClick={() => approveGrade(u)}><Icon name="check" />موافقة</button>
                  <button type="button" className="apl-btn" onClick={() => rejectGrade(u)}>رفض</button>
                </div>
              )}
            </article>
          );
        })}
        {dailyFilteredActiveUsers.length === 0 && <p className="apl-empty">مفيش طلاب بالفلاتر دي.</p>}
      </div>

      {pages > 1 && (
        <div className="apl-pages">
          <button type="button" className="apl-btn" disabled={page <= 1} onClick={() => studentsPagination.setPage(page - 1)}><Icon name="chevronRight" />السابق</button>
          <span>صفحة {formatNumber(page)} من {formatNumber(pages)}</span>
          <button type="button" className="apl-btn" disabled={page >= pages} onClick={() => studentsPagination.setPage(page + 1)}>التالي<Icon name="chevronLeft" /></button>
        </div>
      )}
      <EditModal ctx={ctx} />
    </div>
  );
}

/** طلبات الانضمام */
export function AdminJoinRequestsV2({ pendingUsers = [], handleApprove, handleReject }) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const list = pendingUsers.filter((u) => !q.trim() || `${u.name || ''} ${u.phone || ''} ${u.email || ''}`.includes(q.trim()))
    .sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
  const approveAll = async () => {
    if (!list.length || !platformConfirm(`قبول ${list.length} طالب مرة واحدة؟`)) return;
    setBusy(true);
    try { for (const u of list) { await handleApprove(u.id); } } finally { setBusy(false); }
  };
  return (
    <div className="apl" dir="rtl">
      <div className="apl-bar">
        <label className="apl-search"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر بالاسم أو الرقم" /></label>
        <span className="apl-sp" />
        <span className="apl-count">{formatNumber(list.length)} طلب</span>
        {list.length > 1 && <button type="button" className="apl-btn apl-btn--ok" disabled={busy} onClick={approveAll}><Icon name="check" />{busy ? 'بيقبل…' : 'قبول الكل'}</button>}
      </div>
      {list.length === 0 && <p className="apl-empty"><Icon name="checkCircle" />مفيش طلبات انضمام مستنية.</p>}
      <div className="apl-cards">
        {list.map((u) => (
          <article key={u.id} className="apl-card">
            <header className="apl-who"><i>{String(u.name || 'ط').trim().charAt(0)}</i><span><b>{u.name || 'طالب جديد'}</b><small>{ms(u.createdAt) ? `سجّل ${new Date(ms(u.createdAt)).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : ''}</small></span></header>
            <dl>
              <div><dt>الصف</dt><dd>{getGradeLabel(u.grade) || u.grade || '—'}</dd></div>
              <div><dt>موبايل الطالب</dt><dd dir="ltr">{u.phone ? <a href={wa(u.phone)} target="_blank" rel="noreferrer">{u.phone}</a> : '—'}</dd></div>
              <div><dt>ولي الأمر</dt><dd dir="ltr">{u.parentPhone ? <a href={wa(u.parentPhone)} target="_blank" rel="noreferrer">{u.parentPhone}</a> : '—'}</dd></div>
              {u.email && <div><dt>الإيميل</dt><dd dir="ltr">{u.email}</dd></div>}
            </dl>
            <footer>
              <button type="button" className="apl-btn apl-btn--ok" onClick={() => handleApprove(u.id)}><Icon name="check" />قبول</button>
              <button type="button" className="apl-btn apl-btn--danger" onClick={() => handleReject(u.id)}><Icon name="close" />رفض</button>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
