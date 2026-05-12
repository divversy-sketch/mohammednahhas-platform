export default function PageShell({ eyebrow, title, description, actions, children }) {
  return (
    <div className="page-soft-enter space-y-6" dir="rtl">
      <div className="v2-card rounded-3xl p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            {eyebrow && <p className="v2-kicker mb-3 w-fit">{eyebrow}</p>}
            <h1 className="v2-page-title text-3xl font-black text-slate-950 md:text-4xl">{title}</h1>
            {description && <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-slate-500 md:text-base">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}
