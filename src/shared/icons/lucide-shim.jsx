import React from 'react';

function makeIcon(label, path) {
  const Icon = React.forwardRef(({ size = 24, color = 'currentColor', strokeWidth = 2, className = '', ...props }, ref) => (
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
      {path}
    </svg>
  ));
  Icon.displayName = label;
  return Icon;
}

// ─── All icon paths ───────────────────────────────────────────────────────────

export const Play        = makeIcon('Play',        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="currentColor"/>);
export const PlayCircle  = makeIcon('PlayCircle',  <><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="currentColor"/></>);
export const Pause       = makeIcon('Pause',       <><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/></>);
export const SkipForward = makeIcon('SkipForward', <><polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/><line x1="19" y1="5" x2="19" y2="19"/></>);

export const X           = makeIcon('X',           <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>);
export const XCircle     = makeIcon('XCircle',     <><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></>);
export const Check       = makeIcon('Check',       <path d="m20 6-11 11-5-5"/>);
export const CheckCircle = makeIcon('CheckCircle', <><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></>);
export const Plus        = makeIcon('Plus',        <><path d="M12 5v14"/><path d="M5 12h14"/></>);
export const PlusCircle  = makeIcon('PlusCircle',  <><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></>);

export const Trash2      = makeIcon('Trash2',      <><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>);
export const Eye         = makeIcon('Eye',         <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>);
export const User        = makeIcon('User',        <><circle cx="12" cy="8" r="4"/><path d="M4 21c1.8-4 14.2-4 16 0"/></>);
export const Users       = makeIcon('Users',       <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/></>);

export const FileText    = makeIcon('FileText',    <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></>);
export const FileCheck   = makeIcon('FileCheck',   <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></>);
export const FileWarning = makeIcon('FileWarning', <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 11v4"/><path d="M12 17h.01"/></>);
export const Save        = makeIcon('Save',        <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></>);

export const Settings    = makeIcon('Settings',    <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>);
export const LogOut      = makeIcon('LogOut',      <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>);
export const Lock        = makeIcon('Lock',        <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>);
export const Unlock      = makeIcon('Unlock',      <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></>);
export const Key         = makeIcon('Key',         <><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></>);
export const KeyRound    = makeIcon('KeyRound',    <><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></>);
export const Shield      = makeIcon('Shield',      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>);
export const ShieldAlert = makeIcon('ShieldAlert', <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 14h.01"/></>);

export const Mail        = makeIcon('Mail',        <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>);
export const Phone       = makeIcon('Phone',       <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5 12.8 12.8 0 0 0 2.8.7A2 2 0 0 1 22 16.9z"/>);
export const MessageSquare = makeIcon('MessageSquare', <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>);
export const MessageCircle = makeIcon('MessageCircle', <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></>);
export const Send        = makeIcon('Send',        <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>);
export const Bell        = makeIcon('Bell',        <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>);
export const Megaphone   = makeIcon('Megaphone',   <><path d="m3 11 19-9-9 19-2-8-8-2z"/></>);

export const Search      = makeIcon('Search',      <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>);
export const Filter      = makeIcon('Filter',      <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>);
export const Menu        = makeIcon('Menu',        <><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></>);
export const MoreVertical = makeIcon('MoreVertical', <><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></>);

export const ChevronRight = makeIcon('ChevronRight', <path d="m9 18 6-6-6-6"/>);
export const ChevronLeft  = makeIcon('ChevronLeft',  <path d="m15 18-6-6 6-6"/>);
export const ChevronDown  = makeIcon('ChevronDown',  <path d="m6 9 6 6 6-6"/>);
export const ChevronUp    = makeIcon('ChevronUp',    <path d="m18 15-6-6-6 6"/>);

export const Upload       = makeIcon('Upload',      <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>);
export const UploadCloud  = makeIcon('UploadCloud', <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>);
export const Download     = makeIcon('Download',    <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>);
export const DownloadCloud = makeIcon('DownloadCloud', <><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></>);

export const Maximize2   = makeIcon('Maximize2',   <><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></>);
export const Minimize2   = makeIcon('Minimize2',   <><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M16 3v3a2 2 0 0 0 2 2h3"/><path d="M8 21v-3a2 2 0 0 0-2-2H3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></>);
export const Shrink      = makeIcon('Shrink',      <><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M16 3v3a2 2 0 0 0 2 2h3"/><path d="M8 21v-3a2 2 0 0 0-2-2H3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></>);

export const PenLine     = makeIcon('PenLine',     <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></>);
export const Edit        = makeIcon('Edit',        <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></>);
export const PenTool     = makeIcon('PenTool',     <><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></>);

export const GraduationCap = makeIcon('GraduationCap', <><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/><path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5"/></>);
export const BookOpen    = makeIcon('BookOpen',    <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>);
export const ClipboardList = makeIcon('ClipboardList', <><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></>);
export const Layout      = makeIcon('Layout',      <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></>);
export const Layers      = makeIcon('Layers',      <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>);
export const Code        = makeIcon('Code',        <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>);

export const Trophy      = makeIcon('Trophy',      <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></>);
export const Star        = makeIcon('Star',        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/>);
export const Crown       = makeIcon('Crown',       <><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/></>);
export const Sparkles    = makeIcon('Sparkles',    <><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/></>);
export const Target      = makeIcon('Target',      <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>);
export const Lightbulb   = makeIcon('Lightbulb',   <><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></>);

export const Activity    = makeIcon('Activity',    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>);
export const BarChart3   = makeIcon('BarChart3',   <><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></>);
export const TrendingDown = makeIcon('TrendingDown', <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>);

export const Clock       = makeIcon('Clock',       <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>);
export const Timer       = makeIcon('Timer',       <><line x1="10" y1="2" x2="14" y2="2"/><line x1="12" y1="14" x2="12" y2="8"/><path d="M4.6 11a8 8 0 1 0 .3-2.7"/><path d="M4 6V2H2"/></>);
export const Calendar    = makeIcon('Calendar',    <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>);
export const History     = makeIcon('History',     <><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></>);
export const RefreshCw   = makeIcon('RefreshCw',   <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></>);

export const Camera      = makeIcon('Camera',      <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>);
export const QrCode      = makeIcon('QrCode',      <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3z"/><path d="M17 17h4"/><path d="M17 21v-4"/></>);
export const Smartphone  = makeIcon('Smartphone',  <><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>);
export const Video       = makeIcon('Video',       <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>);
export const Headphones  = makeIcon('Headphones',  <><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></>);

export const Quote       = makeIcon('Quote',       <><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></>);
export const Feather     = makeIcon('Feather',     <><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></>);

export const AlertTriangle = makeIcon('AlertTriangle', <><path d="m10.29 3.86-8.29 14a1 1 0 0 0 .86 1.5h16.28a1 1 0 0 0 .86-1.5l-8.29-14a1 1 0 0 0-1.72 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>);
export const AlertOctagon = makeIcon('AlertOctagon', <><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>);
export const AlertCircle = makeIcon('AlertCircle', <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>);
export const HelpCircle  = makeIcon('HelpCircle',  <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>);
export const Flag        = makeIcon('Flag',        <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>);
export const Ban         = makeIcon('Ban',         <><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></>);

export const ExternalLink = makeIcon('ExternalLink', <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>);
export const Link        = makeIcon('Link',        <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>);
export const Reply       = makeIcon('Reply',       <><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></>);
export const Facebook    = makeIcon('Facebook',    <><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></>);

export const Loader2     = makeIcon('Loader2',     <><path d="M21 12a9 9 0 1 1-6.219-8.56"/></>);
export const Power       = makeIcon('Power',       <><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></>);
export const MousePointerClick = makeIcon('MousePointerClick', <><path d="m9 9 5 12 1.774-5.226L21 14 9 9z"/><path d="m16.071 16.071 4.243 4.243"/><path d="m7.188 2.239.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656-2.12 2.122"/></>);

export const Radio       = makeIcon('Radio',       <><circle cx="12" cy="12" r="2"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M7.76 7.76a6 6 0 0 0 0 8.49"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/></>);
export const Bot         = makeIcon('Bot',         <><path d="M12 8V4H8"/><rect x="2" y="8" width="20" height="14" rx="2"/><path d="M6 8v1"/><path d="M18 8v1"/><path d="M8 14h8"/><path d="M8 18h8"/></>);
export const BrainCircuit = makeIcon('BrainCircuit', <><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M9 13a4.5 4.5 0 0 0 3-4"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M12 13h4"/><path d="M12 18h6a2 2 0 0 1 2 2v1"/><path d="M12 8h8"/><path d="M16 8V5a2 2 0 0 1 2-2"/><circle cx="16" cy="13" r=".5"/><circle cx="18" cy="3" r=".5"/><circle cx="20" cy="21" r=".5"/><circle cx="20" cy="8" r=".5"/></>);
export const Lamp        = makeIcon('Lamp',        <><path d="M8 2h8l4 10H4L8 2z"/><path d="M12 12v6"/><path d="M8 22h8"/></>);
export const Wand2       = makeIcon('Wand2',       <><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></>);
export const CreditCard  = makeIcon('CreditCard',  <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>);
export const WalletCards = makeIcon('WalletCards', <><rect x="2" y="2" width="20" height="14" rx="2"/><path d="M2 14h20"/><path d="M2 20h20"/><path d="M6 20v-6"/><path d="M10 20v-6"/></>);

export const Zoom        = makeIcon('Zoom',        <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/></>);
export const ZoomIn      = makeIcon('ZoomIn',      <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/></>);
export const ZoomOut     = makeIcon('ZoomOut',     <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6"/></>);

// ─── Aliases ──────────────────────────────────────────────────────────────────
export const Clock3         = Clock;
export const ShieldCheck    = Shield;
export const Pencil         = Edit;
export const Pen            = PenLine;
export const Mic            = makeIcon('Mic', <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></>);
export const Volume2        = makeIcon('Volume2', <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></>);

export default makeIcon('Default', <><circle cx="12" cy="12" r="10"/></>);
