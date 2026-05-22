import { Settings, ShieldCheck, Clock3, RefreshCw } from '@shared/icons/lucide-shim.jsx';
import Button from '@ui/components/Button.jsx';
import GlowFrame from '@ui/components/GlowFrame.jsx';

export default function StudentMaintenanceScreen({ gate, user }) {
  const title = gate?.title || 'الموقع تحت الصيانة حاليًا';
  const message = gate?.message || 'نقوم بتجهيز التصميم الجديد للمنصة. برجاء المحاولة لاحقًا.';

  return (
    <main className="maintenance-page" dir="rtl">
      <section className="maintenance-shell">
        <GlowFrame tone="student" intensity="strong" className="maintenance-glow-card">
          <div className="maintenance-card">
            <div className="maintenance-icon-wrap">
              <Settings size={34} />
            </div>

            <p className="maintenance-kicker">منصة النحاس التعليمية</p>
            <h1>{title}</h1>
            <p className="maintenance-message">{message}</p>

            <div className="maintenance-status-grid">
              <div>
                <ShieldCheck size={18} />
                <span>التصميم الجديد قيد التجهيز</span>
              </div>
              <div>
                <Clock3 size={18} />
                <span>سيتم فتح الدخول بعد الاعتماد</span>
              </div>
            </div>

            {gate?.showLoginHint !== false && (
              <div className="maintenance-note">
                لو الإدارة سمحت لحسابك بالدخول التجريبي، سيتم فتح صفحة الطالب تلقائيًا بعد تسجيل الدخول.
              </div>
            )}

            {user?.email && (
              <div className="maintenance-current-user">
                الحساب الحالي: <strong>{user.email}</strong>
              </div>
            )}

            <Button className="maintenance-refresh-btn" onClick={() => window.location.reload()}>
              <RefreshCw size={17} />
              إعادة المحاولة
            </Button>
          </div>
        </GlowFrame>
      </section>
    </main>
  );
}
