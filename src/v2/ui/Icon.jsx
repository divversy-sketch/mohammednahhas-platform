// One stroke icon set for the whole v2 interface (24px grid, 1.9 stroke).
const P = {
  home: 'M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1z',
  learn: 'M4 5.8C6.6 4.5 9 4.5 12 6.4c3-1.9 5.4-1.9 8-.6v13.1c-2.6-1.3-5-1.3-8 .6-3-1.9-5.4-1.9-8-.6zM12 6.4v13.1',
  play: 'M8 5.5v13l10.5-6.5z',
  video: 'M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM10 9l5 3-5 3z',
  exam: 'M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h4',
  check: 'M20 6 9 17l-5-5',
  checkCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 12.5l2.3 2.3 4.7-5',
  chart: 'M4 20h16M7 16v-4M12 16V8M17 16v-6',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M18 14a6 6 0 0 1 4 7',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  calendar: 'M7 3v3M17 3v3M4 8h16M5 5h14v15H5zM8 12h3M13 12h3M8 16h3',
  flag: 'M5 21V4h11l-2 4 2 4H5',
  file: 'M7 3h7l4 4v14H7zM14 3v4h4',
  fileText: 'M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5',
  download: 'M12 3v12M12 15l5-5M12 15l-5-5M5 21h14',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  bell: 'M18 9a6 6 0 1 0-12 0c0 6-3 7-3 8h18c0-1-3-2-3-8M10 21h4',
  fire: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z',
  trophy: 'M8 4h8v4a4 4 0 0 1-8 0zM6 5H4v1a4 4 0 0 0 4 4M18 5h2v1a4 4 0 0 1-4 4M12 12v5M9 21h6M8 17h8',
  medal: 'M8 3h8l-2 6h-4zM12 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 13l1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L9 15.3l2-.3z',
  crown: 'M4 8.5l4.1 3.7L12 5l3.9 7.2L20 8.5 18.2 19H5.8zM7 21h10',
  spark: 'M12 3l1.8 5.6L19 10l-5.2 1.4L12 17l-1.8-5.6L5 10l5.2-1.4z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 15V9a3 3 0 0 1 3-3h7M18 9v6a3 3 0 0 1-3 3H8',
  mistake: 'M12 3 2 20h20zM12 10v4M12 17h.01',
  wallet: 'M3 7a2 2 0 0 1 2-2h14v4M3 7v11a2 2 0 0 0 2 2h16V9H5a2 2 0 0 1-2-2zM16 14.5h2',
  ticket: 'M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4zM10 6v12',
  message: 'M4 5h16v11H9l-5 4z',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 0 1 4.8.8c0 1.7-2.3 2-2.3 3.7M12 17h.01',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  moon: 'M21 14.8A8.5 8.5 0 0 1 9.2 3a7 7 0 1 0 11.8 11.8z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  logout: 'M15 17l5-5-5-5M20 12H9M12 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h7',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  close: 'M6 6l12 12M18 6 6 18',
  menu: 'M4 7h16M4 12h16M4 17h16',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronRight: 'M9 6l6 6-6 6',
  chevronDown: 'M6 9l6 6 6-6',
  arrowLeft: 'M19 12H5M11 18l-6-6 6-6',
  arrowRight: 'M5 12h14M13 18l6-6-6-6',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  key: 'M15 9a4 4 0 1 0-3.5 4L4 20.5V22h3v-2h2v-2h2l1.5-1.5M15.5 7.5h.01',
  shield: 'M12 3l7 3v5c0 4.6-2.8 8.2-7 10-4.2-1.8-7-5.4-7-10V6z',
  install: 'M12 3v11M12 14l4-4M12 14 8 10M5 16v2.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V16',
  live: 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 19a10 10 0 0 1 0-14M19 5a10 10 0 0 1 0 14',
  layers: 'M12 3 2 8l10 5 10-5zM2 13l10 5 10-5M2 17.5l10 5 10-5',
  interactive: 'M9 9l11 4-5 2-2 5zM4 4l3 3M4 10h3M10 4v3',
  book: 'M4 4h10a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H4zM18 8h2v13',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM18 14h2M14 18v2',
  focus: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5h4',
  text: 'M4 7V5h16v2M9 19h6M12 5v14',
  motion: 'M4 12c3-6 5-6 8 0s5 6 8 0',
  vibrate: 'M8 4h8v16H8zM4 8v8M20 8v8',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7L20 8M20 3v5h-5',
  plus: 'M12 5v14M5 12h14',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  grade: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v6',
  whatsapp: 'M4 20l1.3-4A8 8 0 1 1 8 18.7zM9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.3-1.7-1-1 .8a4 4 0 0 1-2-2l.8-1-1-1.7z',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  rocket: 'M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 15l-3-3c1-4 4.5-8 12-9-1 7.5-5 11-9 12zM15 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  alert: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v6M12 16h.01',
  wifiOff: 'M2 8.8a15 15 0 0 1 4.2-2.6M10.7 5.1A15 15 0 0 1 22 8.8M5 12.5a10 10 0 0 1 5.2-2.7M16.3 10.6a10 10 0 0 1 2.7 1.9M8.5 16a5 5 0 0 1 7 0M12 20h.01M3 3l18 18',
};

export const iconNames = Object.keys(P);

export function Icon({ name, size, className = '', title, ...rest }) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg viewBox="0 0 24 24" className={`nx-ico ${className}`} style={style} aria-hidden={title ? undefined : 'true'} role={title ? 'img' : undefined} {...rest}>
      {title && <title>{title}</title>}
      <path d={P[name] || P.spark} />
    </svg>
  );
}

/** Eight-point star (khatam) used behind night bands. */
export function KhatamStar({ className = 'nx-night__star' }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth=".7">
        <rect x="40" y="40" width="120" height="120" />
        <rect x="40" y="40" width="120" height="120" transform="rotate(45 100 100)" />
        <rect x="62" y="62" width="76" height="76" />
        <rect x="62" y="62" width="76" height="76" transform="rotate(45 100 100)" />
        <circle cx="100" cy="100" r="26" />
        <circle cx="100" cy="100" r="92" />
      </g>
    </svg>
  );
}

export default Icon;
