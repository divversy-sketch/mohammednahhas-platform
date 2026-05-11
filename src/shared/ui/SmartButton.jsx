

export default function SmartButton({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-slate-900 hover:bg-slate-800 text-white',
    amber: 'bg-amber-600 hover:bg-amber-700 text-white',
    green: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    soft: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200',
  };
  return <button type="button" className={`px-5 py-3 rounded-2xl font-black shadow-sm transition disabled:opacity-50 ${variants[variant] || variants.primary} ${className}`} {...props}>{children}</button>;
}
