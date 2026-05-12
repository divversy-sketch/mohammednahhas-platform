import { X } from '../../shared/icons/lucide-shim.jsx';
import { cx } from '../theme/tokens.js';

export default function Modal({ open, title, description, children, footer, onClose, size = 'md', className = '' }) {
  if (!open) return null;
  const sizeClass = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' }[size] || 'max-w-2xl';

  return (
    <div className="v2-modal-backdrop fixed inset-0 z-[10050] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" dir="rtl" role="dialog" aria-modal="true">
      <section className={cx('v2-modal-panel w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl', sizeClass, className)}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/80 p-5">
          <div>
            {title ? <h2 className="text-2xl font-black text-slate-950">{title}</h2> : null}
            {description ? <p className="mt-2 text-sm font-bold leading-7 text-slate-500">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900">
            <X size={18} />
          </button>
        </header>
        <div className="max-h-[72vh] overflow-y-auto p-5">{children}</div>
        {footer ? <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/70 p-4">{footer}</footer> : null}
      </section>
    </div>
  );
}
