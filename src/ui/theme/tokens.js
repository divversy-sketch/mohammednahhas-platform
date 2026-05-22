export const tokens = Object.freeze({
  colors: { primary: 'var(--color-primary)', primarySoft: 'var(--color-primary-soft)', admin: 'var(--color-admin)', adminSoft: 'var(--color-admin-soft)', success: 'var(--color-success)', warning: 'var(--color-warning)', danger: 'var(--color-danger)', info: 'var(--color-info)', text: 'var(--color-text)', muted: 'var(--color-muted)', border: 'var(--color-border)', surface: 'var(--color-surface)', background: 'var(--color-background)' },
  radius: { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)', xl: 'var(--radius-xl)' },
  shadows: { card: 'var(--shadow-card)', modal: 'var(--shadow-modal)' },
  space: { xs: 'var(--space-xs)', sm: 'var(--space-sm)', md: 'var(--space-md)', lg: 'var(--space-lg)', xl: 'var(--space-xl)', xxl: 'var(--space-2xl)' }
});
export default tokens;

export function cx(...classes) {
  return classes.flat(Infinity).filter(Boolean).join(' ');
}
