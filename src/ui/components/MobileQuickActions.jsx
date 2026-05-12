export default function MobileQuickActions({ actions = [], className = '' }) {
  const visibleActions = actions.filter(Boolean).slice(0, 5);
  if (!visibleActions.length) return null;

  return (
    <nav className={`v2-mobile-quick-actions ${className}`} aria-label="اختصارات سريعة">
      {visibleActions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.key || action.label}
            type="button"
            className={`v2-mobile-quick-action ${action.active ? 'is-active' : ''}`}
            onClick={action.onClick}
            aria-current={action.active ? 'page' : undefined}
          >
            {Icon ? <Icon size={18} aria-hidden="true" /> : null}
            <span>{action.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
