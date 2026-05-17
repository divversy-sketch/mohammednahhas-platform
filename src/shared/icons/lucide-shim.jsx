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
export const GraduationCap = makeIcon('GraduationCap');
export const Quote = makeIcon('Quote');
export const Mail = makeIcon('Mail', <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>);
export const Loader2 = makeIcon('Loader2');
export const AlertTriangle = makeIcon('AlertTriangle');
export const Activity = makeIcon('Activity', <><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></>);
export const PlusCircle = makeIcon('PlusCircle');
export const ShieldAlert = makeIcon('ShieldAlert');
export const Video = makeIcon('Video');
export const Phone = makeIcon('Phone');
export const KeyRound = makeIcon('KeyRound');
export const Facebook = makeIcon('Facebook');
export const BookOpen = makeIcon('BookOpen');
export const Feather = makeIcon('Feather');
export const Radio = makeIcon('Radio');
export const ExternalLink = makeIcon('ExternalLink');
export const ClipboardList = makeIcon('ClipboardList');
export const Timer = makeIcon('Timer');
export const AlertOctagon = makeIcon('AlertOctagon');
export const Flag = makeIcon('Flag');
export const Save = makeIcon('Save');
export const HelpCircle = makeIcon('HelpCircle');
export const Reply = makeIcon('Reply');
export const Layout = makeIcon('Layout');
export const Trophy = makeIcon('Trophy');
export const Megaphone = makeIcon('Megaphone');
export const Bell = makeIcon('Bell');
export const Calendar = makeIcon('Calendar');
export const Clock = makeIcon('Clock');
export const Star = makeIcon('Star');
export const Bot = makeIcon('Bot');
export const Power = makeIcon('Power');
export const PenTool = makeIcon('PenTool');
export const Code = makeIcon('Code');
export const Sparkles = makeIcon('Sparkles');
export const Lamp = makeIcon('Lamp');
export const Ban = makeIcon('Ban');
export const Shield = makeIcon('Shield');
export const RefreshCw = makeIcon('RefreshCw');
export const Link = makeIcon('Link');
export const History = makeIcon('History');
export const Camera = makeIcon('Camera');
export const QrCode = makeIcon('QrCode');
export const MousePointerClick = makeIcon('MousePointerClick');
export const BarChart3 = makeIcon('BarChart3');
export const TrendingDown = makeIcon('TrendingDown', <><path d="M22 17 13.5 8.5 8.5 13.5 2 7" /><path d="M16 17h6v-6" /></>);
export const Layers = makeIcon('Layers');
export const BrainCircuit = makeIcon('BrainCircuit');
export const Headphones = makeIcon('Headphones');
export const SkipForward = makeIcon('SkipForward');
export const Target = makeIcon('Target');
export const AlertCircle = makeIcon('AlertCircle');
export const Crown = makeIcon('Crown');
export const CreditCard = makeIcon('CreditCard');
export const Key = makeIcon('Key');
export const Wand2 = makeIcon('Wand2');
export const WalletCards = makeIcon('WalletCards');
export const Smartphone = makeIcon('Smartphone');
export const Lightbulb = makeIcon('Lightbulb');

// Compatibility aliases for lucide icons used by V2 screens.
// Keep these aliases here so feature files do not need per-page fixes.
export const Clock3 = Clock;
export const ShieldCheck = Shield;
export default makeIcon('Icon');

