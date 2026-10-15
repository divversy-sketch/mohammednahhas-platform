import { Icon, KhatamStar } from '../ui/Icon.jsx';
import { Button } from '../ui/kit.jsx';
import markLogo from '@assets/nahhas-logo-dark.webp';

const COPY = {
  pending: { icon: 'clock', tone: 'gold', title: 'طلبك وصل وبيتراجع', text: 'الإدارة بتراجع بياناتك وهتفعّل حسابك قريب. أول ما يتفعّل هتدخل على طول من غير ما تعمل حاجة.' },
  rejected: { icon: 'alert', tone: 'danger', title: 'طلب التسجيل اترفض', text: 'كلّم المستر أو الإدارة عشان تعرف السبب وتعدّل بياناتك.' },
  banned: { icon: 'lock', tone: 'danger', title: 'الحساب موقوف', text: 'حسابك متوقف من الإدارة. تواصل مع المستر أو الإدارة عشان تعرف السبب.' },
};

/** Full-screen message for accounts that cannot use the platform yet. */
export function AccountStatusScreen({ kind = 'pending', onSignOut }) {
  const c = COPY[kind] || COPY.pending;
  return (
    <div className="nx nx-status" dir="rtl">
      <section className="nx-card nx-night nx-status__card">
        <span className="nx-night__glow" aria-hidden="true" />
        <KhatamStar />
        <img src={markLogo} alt="منصة النحاس" className="nx-status__logo" />
        <span className={`nx-tile nx-tile--${c.tone}`} style={{ width: 64, height: 64, borderRadius: 22 }}><Icon name={c.icon} size={30} /></span>
        <h1>{c.title}</h1>
        <p className="dim">{c.text}</p>
        <Button variant="glass" icon="logout" onClick={onSignOut}>تسجيل الخروج</Button>
      </section>
    </div>
  );
}

export function AppLoading({ label = 'بيحمّل' }) {
  return (
    <div className="nx nx-status" dir="rtl" aria-busy="true">
      <span className="nx-spinner" role="status" aria-label={label} />
    </div>
  );
}
