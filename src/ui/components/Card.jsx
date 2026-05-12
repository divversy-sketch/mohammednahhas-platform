import { cx } from '../theme/tokens.js';

export default function Card({ className = '', children, hover = false, ...props }) {
  return (
    <section
      className={cx(
        'v2-card rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur-xl',
        hover && 'v2-dashboard-card-hover',
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}
