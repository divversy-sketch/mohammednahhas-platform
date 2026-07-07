const ICON_PATHS = {
  activity: 'M4 13h4l2-8 4 14 2-6h4',
  bell: 'M18 8.5a6 6 0 1 0-12 0c0 6.2-2.7 6.7-2.7 8.2h17.4c0-1.5-2.7-2-2.7-8.2Z M10 21h4',
  book: 'M4 5.5C6.5 4.2 9.2 4.4 12 6.4c2.8-2 5.5-2.2 8-.9v13.2c-2.5-1.3-5.2-1.1-8 1.1-2.8-2.2-5.5-2.4-8-1.1V5.5Z M12 6.4v13.4',
  bot: 'M8 8h8a4 4 0 0 1 4 4v4.5A3.5 3.5 0 0 1 16.5 20h-9A3.5 3.5 0 0 1 4 16.5V12a4 4 0 0 1 4-4Z M12 8V4 M9 4h6 M9 14h.01 M15 14h.01 M9 17h6',
  brain: 'M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 2.8c0 1 .5 1.9 1.2 2.4A3.4 3.4 0 0 0 8.5 18H10V4H9Z M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 2.8c0 1-.5 1.9-1.2 2.4A3.4 3.4 0 0 1 15.5 18H14V4h1Z M10 8H7.5 M14 8h2.5 M10 13H7 M14 13h3',
  calendar: 'M7 3v3 M17 3v3 M4 8h16 M5 5h14v15H5V5Z M8 12h3 M13 12h3 M8 16h3',
  chevronRight: 'M15 18l-6-6 6-6',
  clipboard: 'M9 4h6l1 2h3v15H5V6h3l1-2Z M9 11h6 M9 15h6',
  card: 'M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z M4 9h16 M7 15h4',
  file: 'M7 3.5h7.3L18 7.2v13.3H7V3.5Z M14 3.5V8h4 M10 12h5 M10 16h4',
  graduation: 'M3 8l9-4 9 4-9 4-9-4Z M7 10.5v4.2c2.9 2 7.1 2 10 0v-4.2 M20 9v5',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M9.8 9.3a2.4 2.4 0 0 1 4.4 1.2c0 1.6-1.6 2.1-2.1 3.2 M12 17h.01',
  key: 'M14 14.5a4.5 4.5 0 1 0-3.2-7.7 4.5 4.5 0 0 0 3.2 7.7Z M10.8 13.2 4 20 M6.5 17.5 8 19 M8.7 15.3 10.2 16.8',
  layers: 'M12 3l9 5-9 5-9-5 9-5Z M4 12l8 4.5 8-4.5 M4 16l8 4.5 8-4.5',
  lock: 'M7 10V8a5 5 0 0 1 10 0v2 M6 10h12v10H6V10Z M12 14v2',
  logout: 'M10 17l5-5-5-5 M15 12H3 M21 4v16h-8',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  message: 'M4 5h16v11H8l-4 4V5Z',
  phone: 'M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M11 18h2',
  qr: 'M4 4h6v6H4V4Z M14 4h6v6h-6V4Z M4 14h6v6H4v-6Z M14 14h2v2h-2v-2Z M18 14h2v6h-6v-2h4v-4Z M14 18h2v2h-2v-2Z',
  settings: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z M12 2v3 M12 19v3 M4.9 4.9 7 7 M17 17l2.1 2.1 M2 12h3 M19 12h3 M4.9 19.1 7 17 M17 7l2.1-2.1',
  shield: 'M12 3l7 3v5c0 4.6-2.8 8.2-7 10-4.2-1.8-7-5.4-7-10V6l7-3Z',
  shieldAlert: 'M12 3l7 3v5c0 4.6-2.8 8.2-7 10-4.2-1.8-7-5.4-7-10V6l7-3Z M12 8v5 M12 16h.01',
  spark: 'M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2Z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  trophy: 'M8 4h8v3a4 4 0 0 1-8 0V4Z M6 5H4v1a4 4 0 0 0 4 4 M18 5h2v1a4 4 0 0 1-4 4 M12 11v5 M9 21h6 M8 16h8',
  users: 'M16 21a6 6 0 0 0-12 0 M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M22 21a5 5 0 0 0-6-4.9 M16 3.5a3.5 3.5 0 0 1 0 7',
  wallet: 'M4 7.5A2.5 2.5 0 0 1 6.5 5H18v4H7a3 3 0 0 0 0 6h13v4H6.5A2.5 2.5 0 0 1 4 16.5v-9Z M16 12h5v4h-5a2 2 0 0 1 0-4Z',
};

export default function AdminNeoIcon({ name = 'spark', size = 22, className = '' }) {
  const path = ICON_PATHS[name] || ICON_PATHS.spark;
  return (
    <svg className={`admin-neo-svg ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}
