import { ChevronRight } from '../../shared/icons/lucide-shim.jsx';
import { getAdminPageMeta } from './adminPageMeta.js';

export default function AdminV2PageFrame({ activeTab, onNavigate, adminName = '', children }) {
  const meta = getAdminPageMeta(activeTab);
  const isDashboard = activeTab === 'dashboard';
  return (
    <section className="v2-admin-workspace" dir="rtl">
      {!isDashboard && (
        <div className="nh-glass nh-analytics mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="nh-kicker">{meta.eyebrow || 'الإدارة'}</span>
            <h1 className="mt-3 text-3xl font-black text-white">{meta.title}</h1>
            {adminName ? <p className="nh-muted mt-1">مرحبًا {adminName}</p> : null}
          </div>
          <button type="button" onClick={() => onNavigate?.('dashboard')} className="nh-neon-btn secondary">
            العودة للوحة التحكم <ChevronRight size={16} />
          </button>
        </div>
      )}
      {children}
    </section>
  );
}
