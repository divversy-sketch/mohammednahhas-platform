// «السينما»: the student shell and home pieces. Full-bleed moving poster, horizontal rails, numbered rows.
import { useEffect, useState } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { IconButton, formatNumber, prefersReducedMotion } from '../ui/kit.jsx';
import { BrandMark } from '../ui/Brand.jsx';
import { haptic } from '../device/native.js';
import { SECTIONS, SUBS } from './nav.js';
import { thumbOf, titleOf } from './insights.js';

// Poster art when a lecture has no thumbnail: one gradient per branch / position.
export const ART = [
  'linear-gradient(135deg,#E5383B,#6A0F2A)', 'linear-gradient(135deg,#FFB547,#C2410C)', 'linear-gradient(135deg,#2563EB,#1E1B4B)',
  'linear-gradient(135deg,#059669,#064E3B)', 'linear-gradient(135deg,#7C3AED,#2E1065)', 'linear-gradient(135deg,#DB2777,#500724)',
  'linear-gradient(135deg,#0EA5E9,#0C4A6E)', 'linear-gradient(135deg,#475569,#0F172A)',
];
export const HERO_ART = [
  'radial-gradient(60% 80% at 20% 30%,#FFB547,transparent 60%),radial-gradient(60% 80% at 65% 70%,#E5383B,transparent 62%),linear-gradient(120deg,#3B0D0C,#1C0B1E 60%,#0C0A14)',
  'radial-gradient(60% 80% at 25% 40%,#7C3AED,transparent 60%),radial-gradient(60% 80% at 70% 60%,#DB2777,transparent 62%),linear-gradient(120deg,#160B33,#0A0718)',
  'radial-gradient(60% 80% at 20% 40%,#10B981,transparent 60%),radial-gradient(60% 80% at 70% 70%,#2563EB,transparent 62%),linear-gradient(120deg,#05241C,#06101F)',
  'radial-gradient(60% 80% at 25% 35%,#0EA5E9,transparent 60%),radial-gradient(60% 80% at 70% 70%,#6366F1,transparent 62%),linear-gradient(120deg,#071A2E,#0B0A1F)',
];

const firstName = (name) => String(name || 'طالب').trim().split(/\s+/)[0];

function useScrolled(threshold = 40) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let frame = 0;
    const on = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => setScrolled(window.scrollY > threshold)); };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', on); };
  }, [threshold]);
  return scrolled;
}

export function Avatar({ ctx }) {
  const name = ctx.userData?.name || 'طالب';
  const photo = ctx.userData?.photoURL || ctx.user?.photoURL;
  return <span className="nx-avatar" aria-hidden="true">{photo ? <img src={photo} alt="" loading="lazy" /> : name.trim().charAt(0)}</span>;
}

/** Top navigation for tablet and desktop. Sits over the poster on Home, turns solid once you scroll. */
export function CinemaNav({ ctx, route, go, badges, theme, toggleTheme, onSearch, onBell, device }) {
  const scrolled = useScrolled();
  const over = !scrolled; // every page opens with a poster or a banner under the bar
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
  return (
    <header className={`cx-nav ${over ? 'is-over' : ''} ${scrolled ? 'is-scrolled' : ''}`}>
      <button type="button" className="cx-brand" onClick={() => go('home')} aria-label="الرئيسية"><BrandMark size={36} /><b>النحاس</b></button>
      <nav className="cx-links" aria-label="التنقل الرئيسي">
        {SECTIONS.map((s) => (
          <button key={s.key} type="button" aria-current={route.section === s.key ? 'page' : undefined} onClick={() => go(s.key)}>
            {s.label}{badges[s.key] ? <span className="cx-badge">{formatNumber(badges[s.key])}</span> : null}
          </button>
        ))}
      </nav>
      <span className="cx-sp" />
      <button type="button" className="cx-search" onClick={onSearch} aria-label="بحث"><Icon name="search" />{device.form === 'desktop' && <><span>دوّر</span><kbd>{mac ? '⌘' : 'Ctrl'} K</kbd></>}</button>
      <IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'} plain onClick={toggleTheme} />
      <IconButton icon="bell" label="الإشعارات" plain badge={ctx.unseenNotificationCount || null} onClick={onBell} />
      <button type="button" className="cx-me" aria-label="حسابي" onClick={() => go('account:profile')}><Avatar ctx={ctx} /><span>{firstName(ctx.userData?.name)}</span></button>
    </header>
  );
}

export function CinemaPhoneTop({ ctx, route, title, onSearch, onBell, go }) {
  const scrolled = useScrolled(route.section === 'home' ? 120 : 40);
  const over = !scrolled;
  return (
    <header className={`cx-ptop ${over ? 'is-over' : ''} ${scrolled ? 'is-scrolled' : ''}`}>
      {route.section === 'home'
        ? <span className="cx-brand"><BrandMark size={32} /><b>النحاس</b></span>
        : <><IconButton icon="arrowRight" label="رجوع" plain onClick={() => go('home')} /><b className="cx-ptop__title">{title}</b></>}
      <span className="cx-sp" />
      <IconButton icon="search" label="بحث" plain onClick={onSearch} />
      <IconButton icon="bell" label="الإشعارات" plain badge={ctx.unseenNotificationCount || null} onClick={onBell} />
    </header>
  );
}

/** Poster that swaps itself every few seconds with a slow camera move. */
export function HeroCarousel({ slides, interval = 7000, hello }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;
  useEffect(() => {
    if (n < 2 || paused || prefersReducedMotion()) return undefined;
    const id = window.setTimeout(() => setI((v) => (v + 1) % n), interval);
    return () => window.clearTimeout(id);
  }, [i, n, paused, interval]);
  if (!n) return null;
  return (
    <section className="cx-hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="عرض متحرك">
      {slides.map((s, k) => (
        <div key={s.key} className={`cx-slide ${k === i ? 'is-on' : ''}`} aria-hidden={k !== i}>
          <span className="cx-slide__art" style={{ background: s.image ? undefined : HERO_ART[k % HERO_ART.length] }}>{s.image && <img src={s.image} alt="" />}</span>
          <span className="cx-slide__glyph" aria-hidden="true">{s.glyph || '«'}</span>
          {[12, 26, 41, 55, 68, 82].map((l, j) => <i key={j} className="cx-spark" style={{ left: `${l}%`, animationDelay: `${j * 0.9}s` }} />)}
          <div className="cx-slide__body">
            <span className="cx-kicker"><Icon name={s.icon} />{s.kicker}</span>
            <h1 key={k === i ? `on-${i}` : 'off'}>{s.title}</h1>
            {s.meta && <p className="cx-slide__meta">{s.meta}</p>}
            {Number.isFinite(s.percent) && s.percent > 0 && <div className="cx-slide__bar"><i style={{ width: `${s.percent}%` }} /></div>}
            <div className="cx-slide__cta">
              <button type="button" className="cx-btn cx-btn--white" tabIndex={k === i ? 0 : -1} onClick={() => { haptic('medium'); s.action(); }}><Icon name={s.ctaIcon || (s.icon === 'exam' ? 'arrowLeft' : 'play')} />{s.cta}</button>
              {s.secondary && <button type="button" className="cx-btn cx-btn--glass" tabIndex={k === i ? 0 : -1} onClick={s.secondary.action}><Icon name={s.secondary.icon} />{s.secondary.label}</button>}
            </div>
          </div>
        </div>
      ))}
      {hello && <div className="cx-hello">{hello}</div>}
      {n > 1 && (
        <div className="cx-dots" role="tablist" aria-label="الشرائح">
          {slides.map((s, k) => <button key={s.key} type="button" role="tab" aria-selected={k === i} aria-label={s.kicker} onClick={() => setI(k)}><b style={k === i ? { animationDuration: `${interval}ms`, animationPlayState: paused ? 'paused' : 'running' } : undefined} /></button>)}
        </div>
      )}
    </section>
  );
}

export function Rail({ title, hint, action, onAction, children }) {
  return (
    <section className="cx-row">
      <div className="cx-row__head"><h2>{title}{hint && <small>{hint}</small>}</h2>{action && <button type="button" onClick={onAction}>{action}<Icon name="chevronLeft" /></button>}</div>
      <div className="cx-rail">{children}</div>
    </section>
  );
}

/** Lecture poster. */
export function Poster({ item, ctx, index = 0, big, number }) {
  const title = titleOf(item, 'محاضرة');
  const percent = ctx.getVideoWatchPercent ? Math.round(ctx.getVideoWatchPercent(item) || 0) : 0;
  const locked = ctx.isBannedContent || (!ctx.isPremium && item?.isPremium);
  const thumb = thumbOf(item);
  const open = () => { haptic('light'); ctx.handlePremiumClick ? ctx.handlePremiumClick(() => ctx.setPlayingVideo?.(item)) : ctx.setPlayingVideo?.(item); };
  const card = (
    <button type="button" className={`cx-poster ${big ? 'cx-poster--tall' : ''} ${locked ? 'is-locked' : ''}`} style={{ animationDelay: `${0.12 + index * 0.07}s` }} onClick={open} aria-label={`${locked ? 'مقفول: ' : ''}${title}`}>
      <span className="cx-poster__art" style={{ background: ART[index % ART.length] }}>
        {thumb && <img src={thumb} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
        <span className="cx-poster__shade" />
        <span className="cx-poster__play"><Icon name={locked ? 'lock' : 'play'} /></span>
        {item?.isPremium && <span className="cx-poster__vip"><Icon name="crown" />VIP</span>}
        <b className="cx-poster__title">{title}</b>
        {percent > 0 && <span className="cx-poster__prog"><i style={{ width: `${Math.min(100, percent)}%` }} /></span>}
      </span>
      <small>{percent >= 95 ? 'خلصتها' : percent > 0 ? `اتفرجت ${formatNumber(percent)}٪` : locked ? 'محتاجة اشتراك' : 'لسه ما بدأتش'}{item?.duration ? ` · ${item.duration}` : ''}</small>
    </button>
  );
  if (number) return <div className="cx-numbered" style={{ animationDelay: `${0.12 + index * 0.08}s` }}><b aria-hidden="true">{formatNumber(number)}</b>{card}</div>;
  return card;
}

export function TaskPoster({ item, index, onOpen }) {
  return (
    <button type="button" className="cx-task" style={{ animationDelay: `${0.2 + index * 0.08}s`, background: ART[(index + 3) % ART.length] }} onClick={onOpen}>
      <Icon name={item.icon} />
      <b>{item.title}</b>
      <small>{item.sub}</small>
    </button>
  );
}

/** Banner on top of every inner page. */
export function PageHero({ route, title }) {
  const section = SECTIONS.find((s) => s.key === route.section);
  const sub = (SUBS[route.section] || []).find((s) => s.key === route.sub);
  const idx = Math.max(0, SECTIONS.findIndex((s) => s.key === route.section));
  const lines = {
    learn: 'كل محاضراتك وكورساتك وملفاتك في مكان واحد. كمّل من حيث ما وقفت.',
    exams: 'الامتحانات المفتوحة والجاية، ونتايجك ومراجعة إجاباتك بعد ما الامتحان يقفل.',
    progress: 'مستواك امتحان ورا امتحان، وأخطاءك، وترتيبك في الدفعة.',
    account: 'بياناتك واشتراكك والدعم وإعدادات الشكل.',
  };
  return (
    <section className="cx-phero" key={route.key}>
      <span className="cx-phero__art" style={{ background: HERO_ART[idx % HERO_ART.length] }} />
      <span className="cx-phero__glyph" aria-hidden="true">{String(sub?.label || section?.label || 'ن').replace(/^ال/, '').charAt(0)}</span>
      <div className="cx-phero__body">
        <span className="cx-kicker"><Icon name={section?.icon || 'home'} />{section?.title}</span>
        <h1>{sub?.label || title}</h1>
        <p>{lines[route.section] || ''}</p>
      </div>
    </section>
  );
}
