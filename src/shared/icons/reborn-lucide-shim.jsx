import React from 'react';

/*
  Reborn icon shim
  بديل كامل للأيقونات المكسورة. ضع هذا الملف مكان:
  src/shared/icons/lucide-shim.jsx
*/

const common = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function IconShell({ refProp, size, color, strokeWidth, className, children, title, ...props }) {
  return (
    <svg
      ref={refProp}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`rb-icon ${className || ''}`.trim()}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

function makeIcon(name, paths) {
  const Icon = React.forwardRef(({ size = 22, color = 'currentColor', strokeWidth = 1.9, className = '', title, ...props }, ref) => (
    <IconShell refProp={ref} size={size} color={color} strokeWidth={strokeWidth} className={className} title={title} {...props}>
      {paths}
    </IconShell>
  ));
  Icon.displayName = name;
  return Icon;
}

const DUO = (shape, accent) => <>{accent}{shape}</>;
const circle = <circle cx="12" cy="12" r="9" />;
const plus = <><path d="M12 7v10" /><path d="M7 12h10" /></>;
const check = <path d="m5 12 4 4 10-10" />;
const x = <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>;
const user = <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.5-4.2 12.5-4.2 14 0" /></>;
const users = <><path d="M15.5 20c-.6-2.6-2.6-4-5.5-4s-4.9 1.4-5.5 4" /><circle cx="10" cy="8" r="3.5" /><path d="M18.5 19c-.2-1.9-1.3-3.2-3.2-3.8" /><path d="M15.8 5.1a3 3 0 0 1 0 5.8" /></>;
const file = <><path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5" /></>;
const search = <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>;
const menu = <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>;
const gear = <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>;

export const LayoutDashboard = makeIcon('LayoutDashboard', DUO(<><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="5" rx="2" /><rect x="13" y="11" width="7" height="9" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /></>, <path d="M6.5 6.5h2" opacity=".35" />));
export const LayoutGrid = LayoutDashboard;
export const Layout = LayoutDashboard;
export const Home = makeIcon('Home', <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></>);
export const BookOpen = makeIcon('BookOpen', <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H8a4 4 0 0 0-4 3Z" /><path d="M4 5.5V22" /><path d="M8 6h8" /><path d="M8 10h8" /></>);
export const BookMarked = makeIcon('BookMarked', <><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v19H8a3 3 0 0 0-3 3Z" /><path d="M15 2v8l-2.5-1.5L10 10V2" /></>);
export const PlayCircle = makeIcon('PlayCircle', <><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4Z" fill="currentColor" stroke="currentColor" /></>);
export const Play = makeIcon('Play', <path d="m8 5 12 7-12 7Z" fill="currentColor" stroke="currentColor" />);
export const Pause = makeIcon('Pause', <><path d="M8 5v14" /><path d="M16 5v14" /></>);
export const Video = makeIcon('Video', <><rect x="3" y="6" width="13" height="12" rx="3" /><path d="m16 10 5-3v10l-5-3" /></>);
export const GraduationCap = makeIcon('GraduationCap', <><path d="M3 8 12 4l9 4-9 4Z" /><path d="M7 10.5V15c2.7 2.2 7.3 2.2 10 0v-4.5" /><path d="M21 8v6" /></>);
export const ClipboardList = makeIcon('ClipboardList', <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4a3 3 0 0 1 6 0" /><path d="M9 10h6" /><path d="M9 14h6" /><path d="M9 18h3" /></>);
export const FileText = makeIcon('FileText', <>{file}<path d="M8 12h8" /><path d="M8 16h6" /></>);
export const FileChartColumn = makeIcon('FileChartColumn', <>{file}<path d="M9 17v-4" /><path d="M12 17v-7" /><path d="M15 17v-2" /></>);
export const FileWarning = makeIcon('FileWarning', <>{file}<path d="M12 10v4" /><path d="M12 17h.01" /></>);
export const FileCheck = makeIcon('FileCheck', <>{file}{check}</>);
export const ScrollText = makeIcon('ScrollText', <><path d="M8 21h8a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v13a3 3 0 0 0 3 3h1" /><path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h5" /></>);
export const MessageSquare = makeIcon('MessageSquare', <><path d="M5 5h14a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9l-6 4V8a3 3 0 0 1 3-3Z" /></>);
export const MessageSquareText = makeIcon('MessageSquareText', <><path d="M5 5h14a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9l-6 4V8a3 3 0 0 1 3-3Z" /><path d="M8 10h8" /><path d="M8 14h6" /></>);
export const MessageCircle = makeIcon('MessageCircle', <><path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-5.8A8 8 0 1 1 21 12Z" /></>);
export const Mail = makeIcon('Mail', <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>);
export const Send = makeIcon('Send', <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>);
export const LifeBuoy = makeIcon('LifeBuoy', <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="m5.6 5.6 4.2 4.2" /><path d="m14.2 14.2 4.2 4.2" /><path d="m18.4 5.6-4.2 4.2" /><path d="m9.8 14.2-4.2 4.2" /></>);
export const BadgeHelp = makeIcon('BadgeHelp', <>{circle}<path d="M9.5 9a2.7 2.7 0 0 1 5 1.4c0 2-2.5 2.2-2.5 4" /><path d="M12 18h.01" /></>);
export const HelpCircle = BadgeHelp;

export const Users = makeIcon('Users', users);
export const UsersRound = Users;
export const User = makeIcon('User', user);
export const UserCircle2 = makeIcon('UserCircle2', <>{circle}{user}</>);
export const CircleUserRound = UserCircle2;
export const UserCog = makeIcon('UserCog', <>{user}<circle cx="18" cy="17" r="2" /><path d="M18 13.8v-1.2" /><path d="M18 21.4v-1.2" /><path d="m20.9 15.3 1-.6" /><path d="m14.1 19.3-1 .6" /></>);
export const UserPlus = makeIcon('UserPlus', <>{user}<path d="M19 8v6" /><path d="M16 11h6" /></>);
export const UserRoundPlus = UserPlus;
export const Lock = makeIcon('Lock', <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>);
export const Unlock = makeIcon('Unlock', <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 7-2.7" /></>);
export const LockKeyhole = makeIcon('LockKeyhole', <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><circle cx="12" cy="15" r="1" /><path d="M12 16v2" /></>);
export const Key = makeIcon('Key', <><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8" /><path d="M16 5h3v3" /></>);
export const KeyRound = Key;
export const Shield = makeIcon('Shield', <><path d="M12 3 20 6v5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6Z" /></>);
export const ShieldCheck = makeIcon('ShieldCheck', <><path d="M12 3 20 6v5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6Z" />{check}</>);
export const ShieldAlert = makeIcon('ShieldAlert', <><path d="M12 3 20 6v5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6Z" /><path d="M12 8v5" /><path d="M12 16h.01" /></>);
export const AlertTriangle = makeIcon('AlertTriangle', <><path d="M12 3 22 20H2Z" /><path d="M12 9v5" /><path d="M12 17h.01" /></>);
export const AlertCircle = makeIcon('AlertCircle', <>{circle}<path d="M12 7v6" /><path d="M12 17h.01" /></>);
export const AlertOctagon = makeIcon('AlertOctagon', <><path d="M8 2h8l6 6v8l-6 6H8l-6-6V8Z" /><path d="M12 8v5" /><path d="M12 17h.01" /></>);

export const Settings = makeIcon('Settings', gear);
export const Search = makeIcon('Search', search);
export const Filter = makeIcon('Filter', <><path d="M3 5h18l-7 8v6l-4 2v-8Z" /></>);
export const Menu = makeIcon('Menu', menu);
export const MoreVertical = makeIcon('MoreVertical', <><circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" /></>);
export const X = makeIcon('X', x);
export const XCircle = makeIcon('XCircle', <>{circle}{x}</>);
export const Check = makeIcon('Check', check);
export const CheckCircle = makeIcon('CheckCircle', <>{circle}{check}</>);
export const CheckCircle2 = CheckCircle;
export const BadgeCheck = makeIcon('BadgeCheck', <><path d="m12 2 2.2 2 3-.2.8 2.9 2.6 1.5-1 2.8 1 2.8-2.6 1.5-.8 2.9-3-.2-2.2 2-2.2-2-3 .2-.8-2.9L3.4 14l1-2.8-1-2.8L6 6.9 6.8 4l3 .2Z" />{check}</>);
export const ChevronRight = makeIcon('ChevronRight', <path d="m9 18 6-6-6-6" />);
export const ChevronLeft = makeIcon('ChevronLeft', <path d="m15 18-6-6 6-6" />);
export const ArrowRight = makeIcon('ArrowRight', <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>);
export const ExternalLink = makeIcon('ExternalLink', <><path d="M14 4h6v6" /><path d="M10 14 20 4" /><path d="M20 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5" /></>);
export const Link = makeIcon('Link', <><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" /></>);
export const Reply = makeIcon('Reply', <><path d="m9 17-6-5 6-5" /><path d="M3 12h11a7 7 0 0 1 7 7v1" /></>);
export const LogOut = makeIcon('LogOut', <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>);
export const Trash2 = makeIcon('Trash2', <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5" /><path d="M14 11v5" /></>);
export const Edit = makeIcon('Edit', <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>);
export const PenLine = Edit;
export const PenTool = makeIcon('PenTool', <><path d="m12 19 7-7 3 3-7 7-3-3Z" /><path d="m18 13-7-7" /><path d="m2 22 7-7" /><path d="m9 15 2 2" /></>);
export const Save = makeIcon('Save', <><path d="M5 3h12l2 2v16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M7 3v6h9" /><path d="M8 21v-7h8v7" /></>);
export const Upload = makeIcon('Upload', <><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 21h14" /></>);
export const UploadCloud = Upload;
export const Download = makeIcon('Download', <><path d="M12 21V9" /><path d="m7 16 5 5 5-5" /><path d="M5 3h14" /></>);
export const DownloadCloud = Download;
export const Maximize2 = makeIcon('Maximize2', <><path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M16 3h3a2 2 0 0 1 2 2v3" /><path d="M8 21H5a2 2 0 0 1-2-2v-3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" /></>);
export const Minimize2 = makeIcon('Minimize2', <><path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M16 3v3a2 2 0 0 0 2 2h3" /><path d="M8 21v-3a2 2 0 0 0-2-2H3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" /></>);
export const Shrink = Minimize2;

export const Activity = makeIcon('Activity', <><path d="M22 12h-4l-3 8L9 4l-3 8H2" /></>);
export const LineChart = makeIcon('LineChart', <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 4-4 3 3 5-7" /></>);
export const BarChart3 = makeIcon('BarChart3', <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></>);
export const TrendingDown = makeIcon('TrendingDown', <><path d="M22 17 13.5 8.5 8.5 13.5 2 7" /><path d="M16 17h6v-6" /></>);
export const Target = makeIcon('Target', <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>);
export const Trophy = makeIcon('Trophy', <><path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v5a5 5 0 0 1-10 0Z" /><path d="M7 6H4a2 2 0 0 0 0 4h3" /><path d="M17 6h3a2 2 0 0 1 0 4h-3" /></>);
export const Crown = makeIcon('Crown', <><path d="m3 8 5 4 4-7 4 7 5-4-2 10H5Z" /><path d="M5 21h14" /></>);
export const Flame = makeIcon('Flame', <><path d="M12 22c4 0 7-2.8 7-6.5 0-3-1.8-5.4-4.2-7.5.2 2.3-.8 3.5-2 4.3.2-3.2-1.6-6-4-8.3.1 4.4-3.8 6.2-3.8 11.8C5 19.3 8 22 12 22Z" /></>);
export const Rocket = makeIcon('Rocket', <><path d="M4.5 16.5c-1 1-1.5 3-1.5 4.5 1.5 0 3.5-.5 4.5-1.5" /><path d="M9 15 5 19" /><path d="M15 9 9 15" /><path d="M14 4c2.7-.8 4.8-.5 6 0 .5 1.2.8 3.3 0 6l-5 5-6-6Z" /><circle cx="15" cy="9" r="1.5" /></>);
export const Sparkles = makeIcon('Sparkles', <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8Z" /></>);
export const Stars = Sparkles;
export const Wand2 = makeIcon('Wand2', <><path d="m21 3-6 6" /><path d="m15 3 6 6" /><path d="M3 21 14 10" /><path d="m6 3 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" /></>);
export const Brain = makeIcon('Brain', <><path d="M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v1a4 4 0 0 0 4 4" /><path d="M15 3a3 3 0 0 1 3 3v1a3 3 0 0 1 0 6v1a4 4 0 0 1-4 4" /><path d="M9 3v18" /><path d="M15 3v18" /><path d="M9 8h6" /><path d="M9 15h6" /></>);
export const BrainCircuit = Brain;
export const Bot = makeIcon('Bot', <><rect x="5" y="7" width="14" height="12" rx="3" /><path d="M12 7V3" /><path d="M8 12h.01" /><path d="M16 12h.01" /><path d="M9 16h6" /></>);
export const Lightbulb = makeIcon('Lightbulb', <><path d="M9 18h6" /><path d="M10 22h4" /><path d="M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 4H9c0-2 0-3-1-4Z" /></>);
export const Lamp = Lightbulb;

export const Bell = makeIcon('Bell', <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>);
export const BellRing = makeIcon('BellRing', <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /><path d="M4 4 2 6" /><path d="M20 4l2 2" /></>);
export const Calendar = makeIcon('Calendar', <><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4" /><path d="M16 3v4" /><path d="M4 10h16" /></>);
export const CalendarDays = Calendar;
export const CalendarClock = makeIcon('CalendarClock', <><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4" /><path d="M16 3v4" /><path d="M4 10h16" /><circle cx="15" cy="16" r="3" /><path d="M15 14.5V16l1 1" /></>);
export const Clock = makeIcon('Clock', <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const Clock3 = Clock;
export const Timer = makeIcon('Timer', <><path d="M10 2h4" /><path d="M12 14l3-3" /><circle cx="12" cy="14" r="8" /></>);
export const History = makeIcon('History', <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v6h6" /><path d="M12 7v6l4 2" /></>);
export const RefreshCw = makeIcon('RefreshCw', <><path d="M21 12a9 9 0 0 1-15.4 6.4L3 16" /><path d="M3 16h6" /><path d="M3 12A9 9 0 0 1 18.4 5.6L21 8" /><path d="M21 8h-6" /></>);

export const CreditCard = makeIcon('CreditCard', <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18" /><path d="M7 15h4" /></>);
export const WalletCards = makeIcon('WalletCards', <><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M7 6V4h10v2" /><path d="M16 13h3" /></>);
export const Smartphone = makeIcon('Smartphone', <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>);
export const Camera = makeIcon('Camera', <><path d="M8 6 9.5 4h5L16 6h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" /><circle cx="12" cy="13" r="4" /></>);
export const QrCode = makeIcon('QrCode', <><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="3" width="6" height="6" rx="1" /><rect x="3" y="15" width="6" height="6" rx="1" /><path d="M15 15h2v2h-2z" /><path d="M19 15h2v6h-6v-2" /></>);
export const Phone = makeIcon('Phone', <><path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 2.8a2 2 0 0 1-.6 1.8L7.7 9.6a16 16 0 0 0 6.7 6.7l1.3-1.3a2 2 0 0 1 1.8-.6l2.8.5a2 2 0 0 1 1.7 2Z" /></>);
export const Facebook = makeIcon('Facebook', <><path d="M15 8h-2a2 2 0 0 0-2 2v3H8v4h3v5h4v-5h3l1-4h-4v-2a1 1 0 0 1 1-1h3V6h-4Z" /></>);

export const MoonStar = makeIcon('MoonStar', <><path d="M21 13.4A8.5 8.5 0 1 1 10.6 3 7 7 0 0 0 21 13.4Z" /><path d="m18 3 .5 1.5L20 5l-1.5.5L18 7l-.5-1.5L16 5l1.5-.5Z" /></>);
export const SunMedium = makeIcon('SunMedium', <><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.9 4.9 1.4 1.4" /><path d="m17.7 17.7 1.4 1.4" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m4.9 19.1 1.4-1.4" /><path d="m17.7 6.3 1.4-1.4" /></>);
export const Power = makeIcon('Power', <><path d="M12 2v10" /><path d="M18.4 6.6a9 9 0 1 1-12.8 0" /></>);
export const Ban = makeIcon('Ban', <><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></>);
export const Flag = makeIcon('Flag', <><path d="M5 22V4" /><path d="M5 4h12l-1 5 1 5H5" /></>);
export const Layers = makeIcon('Layers', <><path d="m12 3 10 5-10 5L2 8Z" /><path d="m2 13 10 5 10-5" /><path d="m2 18 10 5 10-5" /></>);
export const Code = makeIcon('Code', <><path d="m8 9-4 3 4 3" /><path d="m16 9 4 3-4 3" /><path d="m14 5-4 14" /></>);
export const Feather = makeIcon('Feather', <><path d="M20.2 4.8c-3.6-1.3-7.9.3-10.6 3L4 13.4V20h6.6l5.6-5.6c2.7-2.7 4.3-7 3-10.6Z" /><path d="M4 20 14 10" /></>);
export const Radio = makeIcon('Radio', <><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8a6 6 0 0 1 0 8.4" /><path d="M7.8 16.2a6 6 0 0 1 0-8.4" /><path d="M19 5a10 10 0 0 1 0 14" /><path d="M5 19A10 10 0 0 1 5 5" /></>);
export const Megaphone = makeIcon('Megaphone', <><path d="M3 11v2a2 2 0 0 0 2 2h2l4 4v-4l8 2V7l-8 2H5a2 2 0 0 0-2 2Z" /><path d="M21 9v6" /></>);
export const Headphones = makeIcon('Headphones', <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="2" /><rect x="17" y="14" width="4" height="6" rx="2" /></>);
export const SkipForward = makeIcon('SkipForward', <><path d="m5 4 10 8-10 8Z" /><path d="M19 5v14" /></>);
export const MousePointerClick = makeIcon('MousePointerClick', <><path d="m4 3 7.5 18 2-7 7-2Z" /><path d="M13 13 20 20" /></>);
export const Building2 = makeIcon('Building2', <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 21v-4h6v4" /><path d="M8 7h.01" /><path d="M12 7h.01" /><path d="M16 7h.01" /><path d="M8 11h.01" /><path d="M12 11h.01" /><path d="M16 11h.01" /></>);
export const Quote = makeIcon('Quote', <><path d="M8 8H5a2 2 0 0 0-2 2v4h5V8Z" /><path d="M19 8h-3a2 2 0 0 0-2 2v4h5V8Z" /></>);
export const Loader2 = makeIcon('Loader2', <><path d="M21 12a9 9 0 1 1-6.2-8.6" /></>);

export const PlusCircle = makeIcon('PlusCircle', <>{circle}{plus}</>);
export const Minus = makeIcon('Minus', <path d="M5 12h14" />);
export const Eye = makeIcon('Eye', <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>);

const GenericIcon = makeIcon('Icon', <>{circle}<path d="M8 12h8" /><path d="M12 8v8" /></>);
export default GenericIcon;
