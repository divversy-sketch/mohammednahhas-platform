import React from 'react';

const baseStroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

function makeIcon(label, path = null) {
  const Icon = React.forwardRef(({ size = 24, color = 'currentColor', strokeWidth = 2, className = '', children, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {path || (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8" />
          <path d="M12 8v8" />
        </>
      )}
      {children}
    </svg>
  ));
  Icon.displayName = label;
  return Icon;
}

const playPath = <><polygon points="9 7 17 12 9 17 9 7" fill="currentColor" stroke="currentColor" /></>;
const xPath = <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>;
const checkPath = <><path d="m20 6-11 11-5-5" /></>;
const trashPath = <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></>;
const eyePath = <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>;
const userPath = <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.8-4 14.2-4 16 0" /></>;
const filePath = <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>;
const settingsPath = <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>;
const messagePath = <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /></>;
const uploadPath = <><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 21h14" /></>;
const downloadPath = <><path d="M12 21V9" /><path d="m7 16 5 5 5-5" /><path d="M5 3h14" /></>;
const lockPath = <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>;
const menuPath = <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>;
const chevronRightPath = <><path d="m9 18 6-6-6-6" /></>;
const maxPath = <><path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M16 3h3a2 2 0 0 1 2 2v3" /><path d="M8 21H5a2 2 0 0 1-2-2v-3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" /></>;
const minPath = <><path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M16 3v3a2 2 0 0 0 2 2h3" /><path d="M8 21v-3a2 2 0 0 0-2-2H3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" /></>;
const searchPath = <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>;
const penPath = <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>;

export const PlayCircle = makeIcon('PlayCircle', playPath);
export const Play = makeIcon('Play', playPath);
export const Pause = makeIcon('Pause', <><path d="M8 5v14" /><path d="M16 5v14" /></>);
export const X = makeIcon('X', xPath);
export const XCircle = makeIcon('XCircle', <><circle cx="12" cy="12" r="10" />{xPath}</>);
export const Check = makeIcon('Check', checkPath);
export const CheckCircle = makeIcon('CheckCircle', <><circle cx="12" cy="12" r="10" />{checkPath}</>);
export const Trash2 = makeIcon('Trash2', trashPath);
export const Eye = makeIcon('Eye', eyePath);
export const User = makeIcon('User', userPath);
export const Users = makeIcon('Users', <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /><path d="M16 3.1a4 4 0 0 1 0 7.8" /></>);
export const FileText = makeIcon('FileText', filePath);
export const Settings = makeIcon('Settings', settingsPath);
export const MessageCircle = makeIcon('MessageCircle', messagePath);
export const MessageSquare = makeIcon('MessageSquare', messagePath);
export const Send = makeIcon('Send', <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>);
export const Upload = makeIcon('Upload', uploadPath);
export const UploadCloud = makeIcon('UploadCloud', uploadPath);
export const Download = makeIcon('Download', downloadPath);
export const DownloadCloud = makeIcon('DownloadCloud', downloadPath);
export const Lock = makeIcon('Lock', lockPath);
export const Unlock = makeIcon('Unlock', <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 7-2.6" /></>);
export const Menu = makeIcon('Menu', menuPath);
export const MoreVertical = makeIcon('MoreVertical', <><circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" /></>);
export const ChevronRight = makeIcon('ChevronRight', chevronRightPath);
export const ChevronLeft = makeIcon('ChevronLeft', <><path d="m15 18-6-6 6-6" /></>);
export const Maximize2 = makeIcon('Maximize2', maxPath);
export const Minimize2 = makeIcon('Minimize2', minPath);
export const Search = makeIcon('Search', searchPath);
export const Filter = makeIcon('Filter', <><path d="M22 3H2l8 9.5V20l4 2v-9.5Z" /></>);
export const Shrink = makeIcon('Shrink', minPath);
export const PenLine = makeIcon('PenLine', penPath);
export const Edit = makeIcon('Edit', penPath);

export const FileWarning = makeIcon('FileWarning', filePath);
export const FileCheck = makeIcon('FileCheck', filePath);
export const LogOut = makeIcon('LogOut', <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>);
export const GraduationCap = makeIcon('GraduationCap', <><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c3.5 2 8.5 2 12 0v-5" /><path d="M22 10v6" /></>);
export const Quote = makeIcon('Quote', <><path d="M10 11H6a4 4 0 0 1 4-4v2a2 2 0 0 0-2 2v1h2v5H5v-6a6 6 0 0 1 6-6" /><path d="M19 11h-4a4 4 0 0 1 4-4v2a2 2 0 0 0-2 2v1h2v5h-5v-6a6 6 0 0 1 6-6" /></>);
export const Mail = makeIcon('Mail', <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>);
export const Loader2 = makeIcon('Loader2', <><path d="M21 12a9 9 0 1 1-6.2-8.6" /></>);
export const AlertTriangle = makeIcon('AlertTriangle', <><path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>);
export const Activity = makeIcon('Activity', <><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></>);
export const PlusCircle = makeIcon('PlusCircle', <><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></>);
export const ShieldAlert = makeIcon('ShieldAlert', <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="M12 8v4" /><path d="M12 16h.01" /></>);
export const Video = makeIcon('Video', <><rect x="3" y="5" width="14" height="14" rx="2" /><path d="m17 9 4-2v10l-4-2" /></>);
export const Phone = makeIcon('Phone', <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" /></>);
export const KeyRound = makeIcon('KeyRound', <><circle cx="7.5" cy="15.5" r="5.5" /><path d="m13 10 7-7" /><path d="m17 6 3 3" /></>);
export const Facebook = makeIcon('Facebook', <><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z" /></>);
export const BookOpen = makeIcon('BookOpen', <><path d="M2 4h7a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2Z" /><path d="M22 4h-7a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h8Z" /></>);
export const Feather = makeIcon('Feather', <><path d="M20.2 3.8c-2.8-2.8-8-2-11.6 1.6C5.1 8.9 4 13.5 6 16l-4 4 2 2 4-4c2.5 2 7.1.9 10.6-2.6 3.6-3.6 4.4-8.8 1.6-11.6Z" /><path d="M7 17c3-1 7-5 10-10" /></>);
export const Radio = makeIcon('Radio', <><path d="M4.9 19.1a10 10 0 0 1 0-14.2" /><path d="M7.8 16.2a6 6 0 0 1 0-8.5" /><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8a6 6 0 0 1 0 8.5" /><path d="M19.1 4.9a10 10 0 0 1 0 14.2" /></>);
export const ExternalLink = makeIcon('ExternalLink', <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="m10 14 11-11" /></>);
export const ClipboardList = makeIcon('ClipboardList', <><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M8 11h8" /><path d="M8 16h8" /></>);
export const Timer = makeIcon('Timer', <><path d="M10 2h4" /><path d="M12 14l3-3" /><circle cx="12" cy="14" r="8" /></>);
export const AlertOctagon = makeIcon('AlertOctagon', <><path d="M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9Z" /><path d="M12 8v4" /><path d="M12 16h.01" /></>);
export const Flag = makeIcon('Flag', <><path d="M4 22V4" /><path d="M4 4h12l-1 5 1 5H4" /></>);
export const Save = makeIcon('Save', <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8" /><path d="M7 3v5h8" /></>);
export const HelpCircle = makeIcon('HelpCircle', <><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4" /><path d="M12 17h.01" /></>);
export const Reply = makeIcon('Reply', <><path d="M9 17 4 12l5-5" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></>);
export const Layout = makeIcon('Layout', <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></>);
export const Trophy = makeIcon('Trophy', <><path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v5a5 5 0 0 1-10 0Z" /><path d="M5 5H3a2 2 0 0 0 2 4h2" /><path d="M19 5h2a2 2 0 0 1-2 4h-2" /></>);
export const Megaphone = makeIcon('Megaphone', <><path d="m3 11 18-5v12L3 14v-3Z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></>);
export const Bell = makeIcon('Bell', <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>);
export const Calendar = makeIcon('Calendar', <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>);
export const Clock = makeIcon('Clock', <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>);
export const Star = makeIcon('Star', <><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3L5.8 21 7 14.2 2 9.3l6.9-1Z" /></>);
export const Bot = makeIcon('Bot', <><rect x="5" y="8" width="14" height="10" rx="2" /><path d="M12 2v3" /><path d="M9 12h.01" /><path d="M15 12h.01" /><path d="M8 18v2" /><path d="M16 18v2" /></>);
export const Power = makeIcon('Power', <><path d="M12 2v10" /><path d="M18.4 6.6a9 9 0 1 1-12.8 0" /></>);
export const PenTool = makeIcon('PenTool', <><path d="m12 19 7-7 3 3-7 7-3-3Z" /><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18" /><path d="m2 2 7.6 7.6" /><circle cx="11" cy="11" r="2" /></>);
export const Code = makeIcon('Code');
export const Sparkles = makeIcon('Sparkles', <><path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7Z" /><path d="m5 15 .9 2.1L8 18l-2.1.9L5 21l-.9-2.1L2 18l2.1-.9Z" /><path d="m19 15 .7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7Z" /></>);
export const Lamp = makeIcon('Lamp', <><path d="M8 2h8l2 8H6Z" /><path d="M12 10v8" /><path d="M8 22h8" /><path d="M9 18h6" /></>);
export const Ban = makeIcon('Ban', <><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></>);
export const Shield = makeIcon('Shield', <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></>);
export const RefreshCw = makeIcon('RefreshCw', <><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>);
export const Link = makeIcon('Link', <><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" /></>);
export const History = makeIcon('History', <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 3v6h6" /><path d="M12 7v5l3 2" /></>);
export const Camera = makeIcon('Camera', <><path d="M14.5 4 13 2H11L9.5 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" /><circle cx="12" cy="12" r="3" /></>);
export const QrCode = makeIcon('QrCode', <><rect x="3" y="3" width="6" height="6" /><rect x="15" y="3" width="6" height="6" /><rect x="3" y="15" width="6" height="6" /><path d="M15 15h2v2h-2z" /><path d="M19 15h2v6h-6v-2" /></>);
export const MousePointerClick = makeIcon('MousePointerClick', <><path d="m3 3 7 18 2-8 8-2Z" /><path d="M14 14l5 5" /><path d="M14 3h1" /><path d="M19 7l1-1" /></>);
export const BarChart3 = makeIcon('BarChart3', <><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="5" /><rect x="12" y="8" width="3" height="9" /><rect x="17" y="5" width="3" height="12" /></>);
export const TrendingDown = makeIcon('TrendingDown', <><path d="M22 17 13.5 8.5 8.5 13.5 2 7" /><path d="M16 17h6v-6" /></>);
export const Layers = makeIcon('Layers', <><path d="m12 2 10 5-10 5L2 7Z" /><path d="m2 12 10 5 10-5" /><path d="m2 17 10 5 10-5" /></>);
export const BrainCircuit = makeIcon('BrainCircuit', <><path d="M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v2a4 4 0 0 0 4 4h1V3Z" /><path d="M15 3a3 3 0 0 1 3 3v1a3 3 0 0 1 0 6v2a4 4 0 0 1-4 4h-1V3Z" /><path d="M8 8h3" /><path d="M13 8h3" /><path d="M8 14h3" /><path d="M13 14h3" /></>);
export const Headphones = makeIcon('Headphones', <><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Z" /><path d="M3 19a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2Z" /></>);
export const SkipForward = makeIcon('SkipForward', <><polygon points="5 4 15 12 5 20 5 4" /><path d="M19 5v14" /></>);
export const Target = makeIcon('Target', <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>);
export const AlertCircle = makeIcon('AlertCircle', <><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></>);
export const Crown = makeIcon('Crown', <><path d="m2 6 5 5 5-8 5 8 5-5-2 13H4Z" /></>);
export const CreditCard = makeIcon('CreditCard', <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>);
export const Key = makeIcon('Key', <><circle cx="7.5" cy="15.5" r="5.5" /><path d="m13 10 7-7" /><path d="m17 6 3 3" /></>);
export const Wand2 = makeIcon('Wand2', <><path d="m21 3-6.5 6.5" /><path d="m14.5 3 6.5 6.5" /><path d="M3 21 14.5 9.5" /><path d="m5 3 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" /></>);
export const WalletCards = makeIcon('WalletCards', <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18" /><path d="M16 15h2" /></>);
export const Smartphone = makeIcon('Smartphone', <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>);
export const Lightbulb = makeIcon('Lightbulb', <><path d="M9 18h6" /><path d="M10 22h4" /><path d="M8 14a6 6 0 1 1 8 0c-1 1-1.5 2-1.5 4h-5c0-2-.5-3-1.5-4Z" /></>);

// Compatibility aliases for lucide icons used by V2 screens.
// Keep these aliases here so feature files do not need per-page fixes.
export const Clock3 = Clock;
export const ShieldCheck = Shield;
export default makeIcon('Icon');

