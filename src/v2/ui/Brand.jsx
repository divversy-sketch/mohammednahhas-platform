// The «السينما» brand: a play-button ن on a deep plate. The light sweep runs every few seconds.
import { useId } from 'react';

export function BrandMark({ size = 40, animated = true }) {
  const id = `nxb${useId().replace(/:/g, '')}`;
  return (
    <svg className={`nx-brandmark ${animated ? 'is-anim' : ''}`} viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFB547" /><stop offset="1" stopColor="#E5383B" /></linearGradient>
        <radialGradient id={`${id}r`} cx=".3" cy=".2" r=".9"><stop offset="0" stopColor="#2A1A16" /><stop offset="1" stopColor="#0E0A09" /></radialGradient>
        <clipPath id={`${id}c`}><rect x="2" y="2" width="60" height="60" rx="17" /></clipPath>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="17" fill={`url(#${id}r)`} />
      <path d="M16.5 27c0 13 6.5 19.5 15.5 19.5S47.5 40 47.5 27" fill="none" stroke={`url(#${id}g)`} strokeWidth="7.5" strokeLinecap="round" />
      <path d="M27.5 12.5l11.5 7-11.5 7z" fill="#FFB547" stroke="#FFB547" strokeWidth="2" strokeLinejoin="round" />
      <g clipPath={`url(#${id}c)`}><rect className="nx-brandmark__sweep" x="-24" y="0" width="14" height="64" fill="#fff" opacity=".16" /></g>
    </svg>
  );
}

export function BrandLockup({ size = 40, sub = 'منصة اللغة العربية' }) {
  return (
    <span className="nx-lockup">
      <BrandMark size={size} />
      <span><b>النحاس</b>{sub && <small>{sub}</small>}</span>
    </span>
  );
}
