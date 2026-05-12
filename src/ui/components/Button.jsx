import { cx } from '../theme/tokens.js';

const variants = {
  primary: 'bg-slate-950 text-white hover:bg-slate-800 border-slate-950',
  admin: 'bg-gradient-to-l from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 border-amber-400',
  student: 'bg-gradient-to-l from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 border-teal-400',
  soft: 'bg-white/80 text-slate-700 hover:bg-white border-slate-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 border-red-500',
};

export default function Button({ as: Comp = 'button', variant = 'primary', className = '', children, ...props }) {
  return (
    <Comp
      className={cx(
        'v2-btn inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 font-black transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant] || variants.primary,
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
