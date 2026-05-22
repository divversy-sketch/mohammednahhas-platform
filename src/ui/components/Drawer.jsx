export default function Drawer({ open, title, children, onClose, footer }) {
  if (!open) return null;
  return <div className="ui-drawer-backdrop" role="presentation" onClick={onClose}>
    <aside className="ui-drawer" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
      <header className="ui-drawer__header"><h2>{title}</h2><button type="button" onClick={onClose}>×</button></header>
      <div className="ui-drawer__body">{children}</div>{footer && <footer className="ui-drawer__footer">{footer}</footer>}
    </aside></div>;
}
