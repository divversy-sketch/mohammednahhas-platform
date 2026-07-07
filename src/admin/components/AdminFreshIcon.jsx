export default function AdminFreshIcon({ name = 'spark', size = 22, className = '' }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.85,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    width: size,
    height: size,
    className: `admin-fresh-icon ${className}`,
    'aria-hidden': true,
  };

  const icons = {
    shield: (
      <>
        <path d="M12 3.2 19.5 6.4v5.7c0 4.2-2.9 7.3-7.5 8.4-4.6-1.1-7.5-4.2-7.5-8.4V6.4L12 3.2Z" />
        <path d="m8.8 12.2 2.1 2.1 4.5-5" />
      </>
    ),
    logout: (
      <>
        <path d="M9 20.5H6.4A2.4 2.4 0 0 1 4 18.1V5.9a2.4 2.4 0 0 1 2.4-2.4H9" />
        <path d="M15 7.5 19.5 12 15 16.5" />
        <path d="M19.5 12H9" />
      </>
    ),
    filter: (
      <>
        <path d="M4 5.5h16" />
        <path d="M7 12h10" />
        <path d="M10 18.5h4" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4.3" />
        <path d="M12 2.8v2.3M12 18.9v2.3M21.2 12h-2.3M5.1 12H2.8M18.5 5.5l-1.6 1.6M7.1 16.9l-1.6 1.6M18.5 18.5l-1.6-1.6M7.1 7.1 5.5 5.5" />
      </>
    ),
    moon: <path d="M20 14.1A8.5 8.5 0 1 1 9.9 4 6.9 6.9 0 0 0 20 14.1Z" />,
    users: (
      <>
        <circle cx="9" cy="8" r="3.4" />
        <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" />
        <path d="M16.5 10.5a3.1 3.1 0 0 0 0-6.1" />
        <path d="M18.2 20a5.6 5.6 0 0 0-3-4.8" />
      </>
    ),
    content: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2.4" />
        <path d="M8 9h8" />
        <path d="M8 13h5.5" />
        <path d="M8 16.5h7" />
      </>
    ),
    video: (
      <>
        <rect x="3.5" y="6.5" width="12.5" height="11" rx="2.4" />
        <path d="m16 10 4.5-2.7v9.4L16 14" />
        <path d="m8.8 10 3.6 2-3.6 2v-4Z" />
      </>
    ),
    exam: (
      <>
        <path d="M7 3.5h6.8l4.2 4.2V20a1.8 1.8 0 0 1-1.8 1.8H7A1.8 1.8 0 0 1 5.2 20V5.3A1.8 1.8 0 0 1 7 3.5Z" />
        <path d="M13.8 3.5v4.8H18" />
        <path d="M8.4 13h6.7" />
        <path d="M8.4 16.6h4.2" />
      </>
    ),
    wallet: (
      <>
        <path d="M4 7.3h14.8a2 2 0 0 1 2 2v8.5H5.6A2.6 2.6 0 0 1 3 15.2V8.3a1 1 0 0 1 1-1Z" />
        <path d="M16.5 12.2h4.3v3.3h-4.3a1.7 1.7 0 0 1 0-3.3Z" />
        <path d="M4.3 7.3 14.5 3.9l2.1 3.4" />
      </>
    ),
    course: (
      <>
        <path d="M5 19.2A2.6 2.6 0 0 1 7.6 16.6H20" />
        <path d="M7.6 3.5H20v13.1H7.6A2.6 2.6 0 0 0 5 19.2V6.1a2.6 2.6 0 0 1 2.6-2.6Z" />
        <path d="M9 7.5h7" />
      </>
    ),
    identity: (
      <>
        <circle cx="12" cy="8" r="3.8" />
        <path d="M4.2 20.8a7.8 7.8 0 0 1 15.6 0" />
        <path d="M17.5 3.5h3v3" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19.5V4.5" />
        <path d="M4 19.5h16.5" />
        <path d="M8 15.5l3.2-4.2 3.1 2.1 4.3-7.2" />
        <path d="M18.6 6.2h-3.1" />
      </>
    ),
    bell: (
      <>
        <path d="M18 9.5a6 6 0 0 0-12 0c0 6.8-2.6 7-2.6 8.8h17.2C20.6 16.5 18 16.3 18 9.5Z" />
        <path d="M10 21h4" />
      </>
    ),
    key: (
      <>
        <circle cx="7.5" cy="14.5" r="3.4" />
        <path d="M10.1 12 18 4.1" />
        <path d="M14.8 7.2 17 9.4" />
        <path d="M17 5 19.2 7.2" />
      </>
    ),
    message: (
      <>
        <path d="M4 5.5h16v10.8H8.4L4 20.2V5.5Z" />
        <path d="M8 9.4h8" />
        <path d="M8 13h5.5" />
      </>
    ),
    qr: (
      <>
        <path d="M4 4h6v6H4z" />
        <path d="M14 4h6v6h-6z" />
        <path d="M4 14h6v6H4z" />
        <path d="M14 14h2v2h-2z" />
        <path d="M18 14h2v6h-6v-2h4z" />
      </>
    ),
    settings: (
      <>
        <path d="M12 8.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Z" />
        <path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2.2 2.2-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.7v.2h-3.1v-.2a1.8 1.8 0 0 0-1.1-1.7 1.8 1.8 0 0 0-2 .4l-.1.1L6 17.1l.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.7-1.1h-.2v-3.1h.2a1.8 1.8 0 0 0 1.7-1.1 1.8 1.8 0 0 0-.4-2L6 7.6l2.2-2.2.1.1a1.8 1.8 0 0 0 2 .4 1.8 1.8 0 0 0 1.1-1.7V4h3.1v.2a1.8 1.8 0 0 0 1.1 1.7 1.8 1.8 0 0 0 2-.4l.1-.1 2.2 2.2-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.7 1.1h.2v3.1h-.2a1.8 1.8 0 0 0-1.7 1.1Z" />
      </>
    ),
    plus: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </>
    ),
    edit: (
      <>
        <path d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20Z" />
        <path d="M13.5 6 18 10.5" />
      </>
    ),
    delete: (
      <>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="M7 7l1 13h8l1-13" />
        <path d="M10.5 11v5" />
        <path d="M13.5 11v5" />
      </>
    ),
    eye: (
      <>
        <path d="M2.8 12s3.5-6.2 9.2-6.2S21.2 12 21.2 12s-3.5 6.2-9.2 6.2S2.8 12 2.8 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    spark: (
      <>
        <path d="M12 3 13.8 8.2 19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
        <path d="M19 15.5l.7 2.2 2.3.8-2.3.8-.7 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
      </>
    ),
  };

  return <svg {...common}>{icons[name] || icons.spark}</svg>;
}
