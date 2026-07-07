export default function StudentFreshIcon({ name = 'spark', size = 22, className = '' }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.85,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    width: size,
    height: size,
    className: `student-fresh-icon ${className}`,
    'aria-hidden': true,
  };

  const icons = {
    home: <><path d="M3.5 11.2 12 4l8.5 7.2" /><path d="M5.5 10.2v9.3h13v-9.3" /><path d="M9.3 19.5v-5.2h5.4v5.2" /></>,
    courses: <><path d="M5 19.2A2.6 2.6 0 0 1 7.6 16.6H20" /><path d="M7.6 3.5H20v13.1H7.6A2.6 2.6 0 0 0 5 19.2V6.1a2.6 2.6 0 0 1 2.6-2.6Z" /><path d="M9 7.5h7" /></>,
    videos: <><rect x="3.5" y="6.5" width="12.5" height="11" rx="2.4" /><path d="m16 10 4.5-2.7v9.4L16 14" /><path d="m8.8 10 3.6 2-3.6 2v-4Z" /></>,
    path: <><path d="M4 18c4.5 0 4.5-12 9-12s4.5 12 9 12" /><circle cx="4" cy="18" r="2" /><circle cx="13" cy="6" r="2" /><circle cx="22" cy="18" r="2" /></>,
    brain: <><path d="M9 4.5a3.2 3.2 0 0 0-3.1 3.9A3.7 3.7 0 0 0 6 15.6a3.8 3.8 0 0 0 5 3.6V4.5H9Z" /><path d="M15 4.5a3.2 3.2 0 0 1 3.1 3.9 3.7 3.7 0 0 1-.1 7.2 3.8 3.8 0 0 1-5 3.6V4.5h2Z" /></>,
    files: <><path d="M7 3.5h6.8l4.2 4.2V20a1.8 1.8 0 0 1-1.8 1.8H7A1.8 1.8 0 0 1 5.2 20V5.3A1.8 1.8 0 0 1 7 3.5Z" /><path d="M13.8 3.5v4.8H18" /><path d="M8.4 13h6.7" /><path d="M8.4 16.6h4.2" /></>,
    html: <><path d="m8 9-3 3 3 3" /><path d="m16 9 3 3-3 3" /><path d="m13.5 6-3 12" /></>,
    quiz: <><path d="M9.4 9a3 3 0 1 1 5.2 2c-.9.8-1.6 1.4-1.6 2.7" /><path d="M12 18h.01" /><circle cx="12" cy="12" r="10" /></>,
    messages: <><path d="M4 5.5h16v10.8H8.4L4 20.2V5.5Z" /><path d="M8 9.4h8" /><path d="M8 13h5.5" /></>,
    support: <><path d="M5 12a7 7 0 0 1 14 0v3.5a2 2 0 0 1-2 2h-1.5" /><path d="M7 13v-2a5 5 0 0 1 10 0v2" /><path d="M10 19h4" /></>,
    exams: <><path d="M7 3.5h6.8l4.2 4.2V20a1.8 1.8 0 0 1-1.8 1.8H7A1.8 1.8 0 0 1 5.2 20V5.3A1.8 1.8 0 0 1 7 3.5Z" /><path d="M13.8 3.5v4.8H18" /><path d="m8.5 13 1.5 1.5 3.5-4" /></>,
    assignments: <><path d="M9 11l2 2 4-5" /><path d="M5 4h14v16H5z" /><path d="M8 17h8" /></>,
    settings: <><circle cx="12" cy="12" r="3.8" /><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2.2 2.2-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.7v.2h-3.1v-.2a1.8 1.8 0 0 0-1.1-1.7 1.8 1.8 0 0 0-2 .4l-.1.1L6 17.1l.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.7-1.1h-.2v-3.1h.2a1.8 1.8 0 0 0 1.7-1.1 1.8 1.8 0 0 0-.4-2L6 7.6l2.2-2.2.1.1a1.8 1.8 0 0 0 2 .4 1.8 1.8 0 0 0 1.1-1.7V4h3.1v.2a1.8 1.8 0 0 0 1.1 1.7 1.8 1.8 0 0 0 2-.4l.1-.1 2.2 2.2-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.7 1.1h.2v3.1h-.2a1.8 1.8 0 0 0-1.7 1.1Z" /></>,
    trophy: <><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" /><path d="M6 5H4v2a4 4 0 0 0 4 4" /><path d="M18 5h2v2a4 4 0 0 1-4 4" /><path d="M12 12v5" /><path d="M9 21h6" /><path d="M10 17h4" /></>,
    crown: <><path d="m4 8 4 4 4-7 4 7 4-4-1.5 10h-13L4 8Z" /><path d="M6 21h12" /></>,
    bell: <><path d="M18 9.5a6 6 0 0 0-12 0c0 6.8-2.6 7-2.6 8.8h17.2C20.6 16.5 18 16.3 18 9.5Z" /><path d="M10 21h4" /></>,
    focus: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3" /><path d="M12 19v3" /><path d="M2 12h3" /><path d="M19 12h3" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    logout: <><path d="M9 20.5H6.4A2.4 2.4 0 0 1 4 18.1V5.9a2.4 2.4 0 0 1 2.4-2.4H9" /><path d="M15 7.5 19.5 12 15 16.5" /><path d="M19.5 12H9" /></>,
    spark: <><path d="M12 3 13.8 8.2 19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="M19 15.5l.7 2.2 2.3.8-2.3.8-.7 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></>,
  };

  return <svg {...common}>{icons[name] || icons.spark}</svg>;
}
