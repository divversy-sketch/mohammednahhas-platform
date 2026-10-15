import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon.jsx';
import { haptic, onBackButton } from '../device/native.js';

const ar = (n, opts) => Number(n || 0).toLocaleString('ar-EG', opts);
export const formatNumber = ar;

const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return true;
  const root = document.documentElement;
  if (root.dataset.motion === 'reduced') return true;
  if (root.dataset.motion === 'full') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
};

/* Material ripple: only on Android, where people expect it. */
function spawnRipple(event) {
  if (document.documentElement.dataset.platform !== 'android') return;
  const host = event.currentTarget;
  const rect = host.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const dot = document.createElement('span');
  dot.className = 'nx-ripple';
  dot.style.width = dot.style.height = `${size}px`;
  dot.style.left = `${(event.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2}px`;
  dot.style.top = `${(event.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2}px`;
  host.appendChild(dot);
  window.setTimeout(() => dot.remove(), 600);
}

export function Button({ variant = 'default', size, block, icon, iconEnd, children, className = '', onClick, href, disabled, type = 'button', haptics = 'light', ...rest }) {
  const cls = ['nx-btn', variant !== 'default' && `nx-btn--${variant}`, size && `nx-btn--${size}`, block && 'nx-btn--block', className].filter(Boolean).join(' ');
  const handle = (event) => {
    spawnRipple(event);
    if (haptics) haptic(haptics);
    onClick?.(event);
  };
  const inner = <>{icon && <Icon name={icon} />}{children}{iconEnd && <Icon name={iconEnd} />}</>;
  if (href && !disabled) {
    return <a className={cls} href={href} target="_blank" rel="noreferrer" onClick={handle} {...rest}>{inner}</a>;
  }
  return <button type={type} className={cls} disabled={disabled} onClick={handle} {...rest}>{inner}</button>;
}

export function IconButton({ icon, label, badge, plain, onClick, className = '', ...rest }) {
  return (
    <button type="button" className={`nx-iconbtn ${plain ? 'nx-iconbtn--plain' : ''} ${className}`} aria-label={label} title={label}
      onClick={(event) => { spawnRipple(event); haptic('light'); onClick?.(event); }} {...rest}>
      <Icon name={icon} />
      {badge !== undefined && badge !== null && badge !== false && <span className="nx-dot">{badge === true ? '' : ar(badge)}</span>}
    </button>
  );
}

/** Counts up to `value` once it becomes visible; the final number is always in the DOM first. */
export function CountUp({ value, duration = 1200, suffix = '', prefix = '', decimals = 0 }) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(target);
  const ref = useRef(null);
  const ran = useRef(null);
  useEffect(() => {
    if (prefersReducedMotion() || ran.current === target) { setShown(target); return undefined; }
    const el = ref.current;
    let raf = 0;
    const run = () => {
      ran.current = target;
      const start = performance.now();
      const from = 0;
      const step = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - p) ** 3;
        setShown(from + (target - from) * eased);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    if (!el || !('IntersectionObserver' in window)) { run(); return () => cancelAnimationFrame(raf); }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); run(); }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target, duration]);
  return <span ref={ref} className="num">{prefix}{ar(shown, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}{suffix}</span>;
}

export function Ring({ value = 0, size = 150, stroke = 12, tone = 'patina', children, track = 'var(--nx-sunk)' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const [offset, setOffset] = useState(prefersReducedMotion() ? c * (1 - pct / 100) : c);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOffset(c * (1 - pct / 100)));
    return () => cancelAnimationFrame(id);
  }, [c, pct]);
  const gid = `nxr-${tone}`;
  const colors = {
    patina: ['var(--nx-patina)', 'var(--nx-gold-2)'],
    copper: ['var(--nx-copper)', 'var(--nx-gold-2)'],
    gold: ['var(--nx-gold)', 'var(--nx-gold-2)'],
    danger: ['var(--nx-danger)', 'var(--nx-copper-2)'],
  }[tone] || ['var(--nx-patina)', 'var(--nx-gold-2)'];
  return (
    <div className="nx-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs><linearGradient id={gid} x1="0" x2="1"><stop offset="0" stopColor={colors[0]} /><stop offset="1" stopColor={colors[1]} /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle className="nx-ring__arc" cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div className="nx-ring__label">{children}</div>
    </div>
  );
}

export function Bar({ value = 0, tone }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return <div className={`nx-bar ${tone ? `nx-bar--${tone}` : ''}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>;
}

export function Chip({ tone, icon, children, live, className = '' }) {
  return <span className={`nx-chip ${tone ? `nx-chip--${tone}` : ''} ${live ? 'nx-chip--live' : ''} ${className}`}>{icon && <Icon name={icon} />}{children}</span>;
}

export function Tile({ icon, tone }) {
  return <span className={`nx-tile ${tone ? `nx-tile--${tone}` : ''}`}><Icon name={icon} /></span>;
}

/** Segmented control (iOS) that becomes Material tabs on Android through CSS. */
export function Segmented({ items, value, onChange, label }) {
  const wrap = useRef(null);
  const [thumb, setThumb] = useState(null);
  const measure = useCallback(() => {
    const el = wrap.current?.querySelector('[aria-selected="true"]');
    if (!el || !wrap.current) return;
    setThumb({ width: el.offsetWidth, x: el.offsetLeft });
  }, []);
  useLayoutEffect(() => { measure(); }, [value, items.length, measure]);
  useEffect(() => {
    window.addEventListener('resize', measure);
    document.fonts?.ready?.then(measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);
  useEffect(() => {
    const el = wrap.current?.querySelector('[aria-selected="true"]');
    el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [value]);
  return (
    <div className="nx-seg" role="tablist" aria-label={label} ref={wrap}>
      {thumb && <span className="nx-seg__thumb" style={{ width: thumb.width, transform: `translateX(${thumb.x}px)`, left: 0 }} aria-hidden="true" />}
      {items.map((item) => (
        <button key={item.key} type="button" role="tab" id={`seg-${item.key}`} aria-selected={value === item.key}
          onClick={() => { if (value !== item.key) { haptic('select'); onChange(item.key); } }}>
          {item.icon && <Icon name={item.icon} />}
          {item.label}
          {item.count ? <span className="nx-count">{ar(item.count)}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label, id }) {
  return <button type="button" id={id} role="switch" aria-checked={Boolean(checked)} aria-label={label} className="nx-switch" onClick={() => { haptic('select'); onChange(!checked); }} />;
}

/**
 * Bottom sheet on phones, centred dialog on tablets/desktop and on Android when `dialog` is set.
 * Closes with the scrim, Escape, the Android back button and the browser back gesture.
 */
export function Sheet({ open, onClose, title, children, footer, wide, full, dialog, className = '', labelledBy }) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (open) { setMounted(true); setClosing(false); return undefined; }
    if (!mounted) return undefined;
    setClosing(true);
    const t = window.setTimeout(() => { setMounted(false); setClosing(false); }, 260);
    return () => window.clearTimeout(t);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current?.(); };
    window.addEventListener('keydown', onKey);
    const offBack = onBackButton(() => { closeRef.current?.(); return true; });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); offBack(); document.body.style.overflow = prevOverflow; };
  }, [open]);

  if (!mounted) return null;
  const cls = ['nx-sheet', dialog && 'nx-sheet--dialog', wide && 'nx-sheet--wide', full && 'nx-sheet--full', className].filter(Boolean).join(' ');
  return createPortal(
    <div className={`nx nx-layer ${closing ? 'is-closing' : ''}`} dir="rtl">
      <div className="nx-scrim" onClick={() => onClose?.()} />
      <section className={cls} role="dialog" aria-modal="true" aria-labelledby={labelledBy || (title ? 'nx-sheet-title' : undefined)}>
        <div className="nx-sheet__grab" />
        {title !== undefined && (
          <header className="nx-sheet__head">
            <h2 className="nx-sheet__title" id="nx-sheet-title">{title}</h2>
            <IconButton icon="close" label="إغلاق" plain onClick={() => onClose?.()} />
          </header>
        )}
        <div className="nx-sheet__body">{children}</div>
        {footer && <footer className="nx-sheet__foot">{footer}</footer>}
      </section>
    </div>,
    document.body
  );
}

export function Empty({ icon = 'spark', title, text, action }) {
  return (
    <div className="nx-empty">
      <div className="nx-empty__art"><Icon name={icon} /></div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ h = 16, w = '100%', r }) {
  return <div className="nx-skel" style={{ height: h, width: w, borderRadius: r }} />;
}

/** One-shot confetti burst from the middle of the screen. */
export function burstConfetti(count = 42) {
  if (prefersReducedMotion() || typeof document === 'undefined') return;
  const host = document.createElement('div');
  host.className = 'nx-confetti';
  const colors = ['#E68A4E', '#F2C063', '#4CCDB4', '#C0592A', '#FFF1D6'];
  for (let i = 0; i < count; i += 1) {
    const p = document.createElement('i');
    const a = Math.random() * Math.PI * 2;
    const d = 120 + Math.random() * 220;
    p.style.left = '50%';
    p.style.top = '38%';
    p.style.setProperty('--x', `${Math.cos(a) * d}px`);
    p.style.setProperty('--y', `${Math.sin(a) * d + 120}px`);
    p.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = `${Math.random() * 0.2}s`;
    host.appendChild(p);
  }
  document.body.appendChild(host);
  haptic('success');
  window.setTimeout(() => host.remove(), 2400);
}

/** Live countdown, e.g. "٢ يوم ٣ س" or "٠٤:١٢:٣٣". */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function formatDuration(ms) {
  if (ms <= 0) return 'دلوقتي';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${ar(d)} يوم${h ? ` و${ar(h)} ساعة` : ''}`;
  if (h > 0) return `${ar(h)} ساعة${m ? ` و${ar(m)} دقيقة` : ''}`;
  const sec = s % 60;
  return `${ar(m)}:${sec < 10 ? '٠' : ''}${ar(sec)}`;
}
