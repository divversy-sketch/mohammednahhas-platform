import Modal from './Modal.jsx';
import Button from './Button.jsx';

export default function ConfirmDialog({ open, title = 'تأكيد العملية', message, confirmText = 'تأكيد', cancelText = 'إلغاء', tone = 'danger', busy = false, onConfirm, onCancel }) {
  const variant = tone === 'danger' ? 'danger' : 'admin';
  return (
    <Modal
      open={open}
      title={title}
      description={message}
      size="sm"
      onClose={busy ? undefined : onCancel}
      footer={(
        <>
          <Button variant="soft" onClick={onCancel} disabled={busy}>{cancelText}</Button>
          <Button variant={variant} onClick={onConfirm} disabled={busy}>{busy ? 'جاري التنفيذ...' : confirmText}</Button>
        </>
      )}
    >
      <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold leading-7 text-slate-600">
        راجع التفاصيل قبل التأكيد. العمليات الحساسة يتم تسجيلها في سجل النشاط.
      </div>
    </Modal>
  );
}
