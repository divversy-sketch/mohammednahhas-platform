import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@services/firebase';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades';
import { platformConfirmAsync } from '@shared/core/platformShared.jsx';
import { Icon } from '../../ui/Icon.jsx';
import { Button, Chip, Segmented, Switch, formatNumber } from '../../ui/kit.jsx';
import { usePrefs } from '../../prefs.js';
import { useDevice } from '../../device/useDevice.js';
import { UpdateRow } from '../../device/UpdateRow.jsx';
import { arabicDate } from '../insights.js';
import { SectionHead } from '../parts.jsx';
import { Embed, StudentMessagesInbox } from '../embeds.jsx';

const logout = async () => {
  const ok = await platformConfirmAsync('هتخرج من حسابك على الجهاز ده. متأكد؟', { title: 'تسجيل الخروج', confirmLabel: 'اخرج', danger: true });
  if (ok) signOut(auth);
};

function Field({ label, icon, hint, children }) {
  return (
    <label className="nx-field">
      <span>{label}</span>
      <span className="nx-input">{icon && <Icon name={icon} />}{children}</span>
      {hint && <small>{hint}</small>}
    </label>
  );
}

function InstallCard({ installPrompt }) {
  const device = useDevice();
  if (device.standalone) return null;
  const install = async () => {
    if (typeof installPrompt === 'function') return installPrompt();
    if (installPrompt?.prompt) { installPrompt.prompt(); await installPrompt.userChoice; }
    return null;
  };
  const canPrompt = Boolean(installPrompt);
  return (
    <section className="nx-card nx-row">
      <span className="nx-tile nx-tile--copper"><Icon name="install" /></span>
      <span className="nx-row__main">
        <span className="nx-row__title">نزّل المنصة على {device.form === 'desktop' ? 'جهازك' : 'موبايلك'}</span>
        <span className="nx-row__sub" style={{ whiteSpace: 'normal' }}>
          {canPrompt ? 'بتفتح أسرع ومن غير شريط المتصفح.' : device.platform === 'ios' ? 'من سفاري: زرار المشاركة ثم «إضافة إلى الشاشة الرئيسية».' : 'من قايمة المتصفح اختار «تثبيت التطبيق».'}
        </span>
      </span>
      {canPrompt && <Button variant="soft" size="s" onClick={install}>تثبيت</Button>}
    </section>
  );
}

function Profile({ ctx, go }) {
  const form = ctx.editFormData || {};
  const set = (patch) => ctx.setEditFormData({ ...form, ...patch });
  const currentGrade = ctx.userData?.grade || '';
  const pendingGrade = ctx.userData?.gradeUpdateStatus === 'pending' && ctx.userData?.requestedGrade;
  const name = ctx.userData?.name || 'طالب';
  return (
    <div className="nx-stack">
      <section className="nx-card nx-profile-head">
        <span className="nx-avatar nx-avatar--l">{ctx.userData?.photoURL ? <img src={ctx.userData.photoURL} alt="" /> : name.trim().charAt(0)}</span>
        <div className="nx-stack" style={{ gap: 4 }}>
          <h2 style={{ fontSize: 'var(--nx-fs-xl)', fontWeight: 600 }}>{name}</h2>
          <span className="muted" style={{ fontSize: 'var(--nx-fs-s)' }}>{ctx.user?.email}</span>
          <div className="nx-choice" style={{ marginTop: 4 }}>
            <Chip tone="copper" icon="grade">{getGradeLabel(currentGrade)}</Chip>
            {ctx.isPremium ? <Chip tone="gold" icon="crown">مشترك</Chip> : <Chip>الباقة المجانية</Chip>}
          </div>
        </div>
      </section>
      <div className="nx-split">
        <section className="nx-card nx-sec">
          <SectionHead title="بياناتي" icon="user" />
          <form className="nx-stack" onSubmit={(e) => { e.preventDefault(); ctx.handleUpdateMyProfile(); }}>
            <Field label="الاسم" icon="user" hint="الاسم بيتغير من الإدارة بس."><input value={form.name || name} disabled /></Field>
            <Field label="رقم موبايلك" icon="phone"><input value={form.phone || ''} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" autoComplete="tel" dir="ltr" style={{ textAlign: 'right' }} /></Field>
            <Field label="رقم ولي الأمر" icon="phone" hint="رقم ولي الأمر بيتغير من الإدارة بس."><input value={form.parentPhone || ''} disabled dir="ltr" style={{ textAlign: 'right' }} /></Field>
            <Field label="الصف الدراسي" icon="grade" hint="تغيير الصف بيروح طلب للإدارة، ومش بيتفعّل غير بعد الموافقة.">
              <select value={form.grade || currentGrade} onChange={(e) => set({ grade: e.target.value })} disabled={Boolean(pendingGrade)}><GradeOptions /></select>
            </Field>
            {pendingGrade && (
              <div className="nx-card nx-card--sunk nx-row" role="status">
                <span className="nx-tile nx-tile--gold"><Icon name="clock" /></span>
                <span className="nx-row__main"><span className="nx-row__title">طلب تغيير الصف قيد المراجعة</span><span className="nx-row__sub">طلبت: {getGradeLabel(ctx.userData.requestedGrade)}</span></span>
              </div>
            )}
            <Button type="submit" variant="pri" icon="check">{pendingGrade ? 'احفظ رقم الموبايل' : 'احفظ التعديلات'}</Button>
          </form>
        </section>
        <div className="nx-stack">
          <InstallCard installPrompt={ctx.installPrompt} />
          <section className="nx-card nx-list">
            <button type="button" className="nx-row" onClick={() => go('account:billing')}><span className="nx-tile nx-tile--gold"><Icon name="wallet" /></span><span className="nx-row__main"><span className="nx-row__title">الاشتراك والدفع</span><span className="nx-row__sub">{ctx.isPremium ? `فاضل ${formatNumber(ctx.subscriptionDaysLeft ?? 0)} يوم` : 'اشحن كود أو ابعت طلب دفع'}</span></span><Icon name="chevronLeft" /></button>
            <button type="button" className="nx-row" onClick={() => go('account:support')}><span className="nx-tile nx-tile--info"><Icon name="message" /></span><span className="nx-row__main"><span className="nx-row__title">الرسائل والدعم</span><span className="nx-row__sub">رسايل المستر وتذاكر الدعم</span></span><Icon name="chevronLeft" /></button>
            <button type="button" className="nx-row" onClick={() => go('account:settings')}><span className="nx-tile"><Icon name="settings" /></span><span className="nx-row__main"><span className="nx-row__title">الإعدادات</span><span className="nx-row__sub">الوضع الليلي، حجم الخط، الحركة</span></span><Icon name="chevronLeft" /></button>
            <button type="button" className="nx-row" onClick={logout}><span className="nx-tile nx-tile--danger"><Icon name="logout" /></span><span className="nx-row__main"><span className="nx-row__title" style={{ color: 'var(--nx-danger)' }}>تسجيل الخروج</span></span></button>
          </section>
        </div>
      </div>
    </div>
  );
}

const METHODS = [
  { key: 'vodafone_cash', label: 'فودافون كاش' },
  { key: 'instapay', label: 'InstaPay' },
];

function Billing({ ctx }) {
  const draft = ctx.paymentDraft || {};
  const setDraft = (patch) => ctx.setPaymentDraft({ ...draft, ...patch });
  const expiry = ctx.userData?.subscriptionExpiry;
  return (
    <div className="nx-split">
      <section className={`nx-card ${ctx.isPremium ? 'nx-night' : ''} nx-stack nx-plan`}>
        {ctx.isPremium && <span className="nx-night__glow nx-night__glow--gold" aria-hidden="true" />}
        <span className={`nx-tile ${ctx.isPremium ? 'nx-tile--gold' : ''}`} style={{ width: 54, height: 54 }}><Icon name="crown" size={28} /></span>
        <h2 style={{ fontSize: 'var(--nx-fs-2xl)', fontWeight: 700 }}>{ctx.isPremium ? 'إنت مشترك' : 'الباقة المجانية'}</h2>
        <p className="dim" style={{ fontSize: 'var(--nx-fs-s)' }}>
          {ctx.isPremium
            ? (expiry ? `اشتراكك شغّال لحد ${arabicDate(expiry, { day: 'numeric', month: 'long', year: 'numeric' })} (فاضل ${formatNumber(ctx.subscriptionDaysLeft ?? 0)} يوم).` : 'اشتراكك شغّال.')
            : 'الاشتراك بيفتح لك كل المحاضرات والملفات والدروس التفاعلية.'}
        </p>
        <form className="nx-stack" style={{ gap: 10 }} onSubmit={(e) => { e.preventDefault(); ctx.handleChargeSubscriptionCode(); }}>
          <Field label="عندك كود اشتراك؟" icon="key">
            <input value={ctx.subscriptionCodeInput || ''} onChange={(e) => ctx.setSubscriptionCodeInput(e.target.value)} placeholder="اكتب الكود هنا" autoComplete="off" autoCapitalize="characters" dir="ltr" style={{ textAlign: 'right' }} />
          </Field>
          <Button type="submit" variant="pri" icon="check" disabled={ctx.isCharging || !String(ctx.subscriptionCodeInput || '').trim()}>{ctx.isCharging ? 'بيتشحن...' : 'اشحن الكود'}</Button>
        </form>
      </section>
      <section className="nx-card nx-sec">
        <SectionHead title="دفعت تحويل؟ ابعت الطلب" icon="wallet" />
        <p className="muted" style={{ fontSize: 'var(--nx-fs-s)' }}>بعد ما تحوّل، اكتب المبلغ ورقم العملية، والإدارة هتفعّل اشتراكك بعد المراجعة.</p>
        <form className="nx-stack" onSubmit={(e) => { e.preventDefault(); ctx.handleSubmitPaymentRequest(); }}>
          <div className="nx-field"><span>طريقة الدفع</span>
            <div className="nx-choice" role="radiogroup" aria-label="طريقة الدفع">
              {METHODS.map((m) => <button key={m.key} type="button" role="radio" aria-checked={(draft.method || 'vodafone_cash') === m.key} aria-pressed={(draft.method || 'vodafone_cash') === m.key} onClick={() => setDraft({ method: m.key })}>{m.label}</button>)}
            </div>
          </div>
          <Field label="المبلغ بالجنيه" icon="wallet"><input value={draft.amount || ''} onChange={(e) => setDraft({ amount: e.target.value.replace(/[^\d.٠-٩]/g, '') })} inputMode="decimal" placeholder="مثلاً ٢٠٠" /></Field>
          <Field label="رقم العملية" icon="ticket" hint="رقم العملية من رسالة التحويل، أو آخر ٤ أرقام من الوصل."><input value={draft.transactionId || ''} onChange={(e) => setDraft({ transactionId: e.target.value })} dir="ltr" style={{ textAlign: 'right' }} /></Field>
          <label className="nx-field"><span>ملاحظة (اختياري)</span><span className="nx-input nx-input--area"><Icon name="edit" /><textarea value={draft.note || ''} onChange={(e) => setDraft({ note: e.target.value })} /></span></label>
          <Button type="submit" variant="pri" icon="arrowLeft" disabled={ctx.isSendingPayment}>{ctx.isSendingPayment ? 'بيتبعت...' : 'ابعت طلب الدفع'}</Button>
        </form>
      </section>
    </div>
  );
}

const CATEGORIES = [
  { key: 'exam', label: 'مشكلة امتحان' },
  { key: 'payment', label: 'دفع أو اشتراك' },
  { key: 'video', label: 'فيديو أو ملف' },
  { key: 'account', label: 'حسابي' },
  { key: 'other', label: 'حاجة تانية' },
];

function Support({ ctx }) {
  const draft = ctx.supportDraft || {};
  return (
    <div className="nx-split">
      <Embed><StudentMessagesInbox user={ctx.user} userData={ctx.userData} /></Embed>
      <section className="nx-card nx-sec">
        <SectionHead title="ابعت للدعم" icon="help" />
        <form className="nx-stack" onSubmit={(e) => { e.preventDefault(); ctx.handleSendSupportTicket(); }}>
          <div className="nx-field"><span>نوع المشكلة</span>
            <div className="nx-choice">
              {CATEGORIES.map((c) => <button key={c.key} type="button" aria-pressed={(draft.category || 'exam') === c.key} onClick={() => ctx.setSupportDraft({ ...draft, category: c.key })}>{c.label}</button>)}
            </div>
          </div>
          <label className="nx-field"><span>اكتب المشكلة بالتفصيل</span><span className="nx-input nx-input--area"><Icon name="message" /><textarea value={draft.message || ''} onChange={(e) => ctx.setSupportDraft({ ...draft, message: e.target.value })} placeholder="مثلاً: الفيديو مش بيشتغل من امبارح..." /></span></label>
          <Button type="submit" variant="pri" icon="arrowLeft" disabled={ctx.isSendingSupport || !String(draft.message || '').trim()}>{ctx.isSendingSupport ? 'بيتبعت...' : 'ابعت'}</Button>
        </form>
      </section>
    </div>
  );
}

function Settings({ ctx }) {
  const { prefs, setPref } = usePrefs();
  const device = useDevice();
  const [notifState, setNotifState] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  useEffect(() => { if (typeof Notification !== 'undefined') setNotifState(Notification.permission); }, []);
  const deviceName = { ios: device.form === 'phone' ? 'آيفون' : 'آيباد', android: device.form === 'phone' ? 'موبايل أندرويد' : 'تابلت أندرويد', web: device.form === 'desktop' ? 'كمبيوتر' : 'متصفح' }[device.platform];
  return (
    <div className="nx-split">
      <section className="nx-card nx-sec">
        <SectionHead title="الشكل" icon="sun" />
        <div className="nx-field"><span>الوضع</span>
          <Segmented label="الوضع" value={prefs.theme} onChange={(v) => setPref('theme', v)} items={[{ key: 'system', label: 'زي الجهاز' }, { key: 'light', label: 'نهاري' }, { key: 'dark', label: 'ليلي' }]} />
        </div>
        <div className="nx-field"><span>حجم الخط</span>
          <Segmented label="حجم الخط" value={prefs.text} onChange={(v) => setPref('text', v)} items={[{ key: 'small', label: 'صغير' }, { key: 'normal', label: 'عادي' }, { key: 'large', label: 'كبير' }, { key: 'xlarge', label: 'أكبر' }]} />
        </div>
        <div className="nx-field"><span>الحركة والأنيميشن</span>
          <Segmented label="الحركة" value={prefs.motion === 'reduced' ? 'reduced' : 'full'} onChange={(v) => setPref('motion', v)} items={[{ key: 'full', label: 'كاملة' }, { key: 'reduced', label: 'أقل' }]} />
          <small>«أقل» بيوقف الحركات الكبيرة ويوفّر بطارية على الأجهزة القديمة.</small>
        </div>
      </section>
      <section className="nx-card nx-sec">
        <SectionHead title="الجهاز" icon="phone" />
        <div className="nx-list">
          {device.native && <UpdateRow />}
          {device.platform !== 'web' && (
            <div className="nx-row"><span className="nx-tile"><Icon name="vibrate" /></span><span className="nx-row__main"><span className="nx-row__title">اهتزاز خفيف مع اللمس</span></span><Switch checked={prefs.haptics !== 'off'} onChange={(v) => setPref('haptics', v ? 'on' : 'off')} label="الاهتزاز" /></div>
          )}
          <div className="nx-row"><span className="nx-tile"><Icon name="bell" /></span><span className="nx-row__main"><span className="nx-row__title">الإشعارات</span><span className="nx-row__sub">{notifState === 'granted' ? 'مفعّلة' : 'التنبيهات بتظهر جوه المنصة'}</span></span></div>
          <button type="button" className="nx-row" onClick={() => ctx.setShowFocusMode(true)}><span className="nx-tile nx-tile--patina"><Icon name="focus" /></span><span className="nx-row__main"><span className="nx-row__title">وضع التركيز (بومودورو)</span><span className="nx-row__sub">٢٥ دقيقة مذاكرة و٥ راحة</span></span><Icon name="chevronLeft" /></button>
          <div className="nx-row"><span className="nx-tile"><Icon name="info" /></span><span className="nx-row__main"><span className="nx-row__title">النسخة</span><span className="nx-row__sub">نسخة {deviceName}{device.native ? ' (التطبيق)' : device.standalone ? ' (متثبتة)' : ''}</span></span></div>
          <button type="button" className="nx-row" onClick={logout}><span className="nx-tile nx-tile--danger"><Icon name="logout" /></span><span className="nx-row__main"><span className="nx-row__title" style={{ color: 'var(--nx-danger)' }}>تسجيل الخروج</span></span></button>
        </div>
      </section>
    </div>
  );
}

export default function AccountView({ ctx, route, go }) {
  switch (route.sub) {
    case 'billing': return <Billing ctx={ctx} />;
    case 'support': return <Support ctx={ctx} />;
    case 'settings': return <Settings ctx={ctx} />;
    default: return <Profile ctx={ctx} go={go} />;
  }
}
