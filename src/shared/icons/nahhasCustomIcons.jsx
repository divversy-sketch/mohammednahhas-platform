import React from 'react';

const Svg = ({ children, size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true" {...props}>
    {children}
  </svg>
);

const stroke = { stroke: 'currentColor', strokeWidth: 1.85, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const IconHome = (props) => <Svg {...props}><path d="M3.8 11.2 12 4.3l8.2 6.9v8a1.8 1.8 0 0 1-1.8 1.8h-4.1v-5.7H9.7V21H5.6a1.8 1.8 0 0 1-1.8-1.8v-8Z" {...stroke}/><path d="M9 21h6" {...stroke}/></Svg>;
export const IconBook = (props) => <Svg {...props}><path d="M5.2 5.7A2.7 2.7 0 0 1 7.9 3h11v15.8H7.5A2.5 2.5 0 0 0 5.2 21V5.7Z" {...stroke}/><path d="M5.2 6.2c.5 1.3 1.4 2 2.9 2h10.8M9.4 12.2h6.3M9.4 15.4h4.6" {...stroke}/></Svg>;
export const IconVideo = (props) => <Svg {...props}><rect x="3.4" y="5.8" width="12.6" height="12.4" rx="3" {...stroke}/><path d="m16 10.2 4.7-2.7v9L16 13.8v-3.6Z" {...stroke}/><path d="M8.2 9.5v5l4.2-2.5-4.2-2.5Z" fill="currentColor" opacity=".9"/></Svg>;
export const IconExam = (props) => <Svg {...props}><rect x="5" y="3.2" width="14" height="17.6" rx="3" {...stroke}/><path d="M8.8 8.4h6.4M8.8 12h5.2M8.8 15.6h3.3" {...stroke}/><path d="m14.7 16 1.35 1.35L19 14.3" {...stroke}/></Svg>;
export const IconTask = (props) => <Svg {...props}><rect x="4" y="4" width="16" height="16" rx="4" {...stroke}/><path d="m8 9 1.5 1.5L12.2 8M8 14.2h8M8 17h5" {...stroke}/></Svg>;
export const IconFiles = (props) => <Svg {...props}><path d="M7.2 3.2h7l4.6 4.6v11.7a1.7 1.7 0 0 1-1.7 1.7H7.2a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2Z" {...stroke}/><path d="M14 3.2v5h5M8.6 13h6.6M8.6 16.2h4.2" {...stroke}/></Svg>;
export const IconCode = (props) => <Svg {...props}><path d="m8.4 8-4 4 4 4M15.6 8l4 4-4 4M13.5 5.2l-3 13.6" {...stroke}/></Svg>;
export const IconBrain = (props) => <Svg {...props}><path d="M9.5 4.2a3.4 3.4 0 0 0-3.4 3.4 3.9 3.9 0 0 0-1.7 7.2 3.55 3.55 0 0 0 3.7 5H9.5V4.2ZM14.5 4.2a3.4 3.4 0 0 1 3.4 3.4 3.9 3.9 0 0 1 1.7 7.2 3.55 3.55 0 0 1-3.7 5h-1.4V4.2Z" {...stroke}/><path d="M9.5 8H7.8M14.5 8h1.7M9.5 12.7H7.2M14.5 12.7h2.3" {...stroke}/></Svg>;
export const IconWallet = (props) => <Svg {...props}><rect x="3.4" y="6.4" width="17.2" height="12.5" rx="3.2" {...stroke}/><path d="M16.8 10.4h3.8v4.5h-3.8a2.25 2.25 0 0 1 0-4.5ZM6.3 6.4V5.2A2.2 2.2 0 0 1 8.5 3h7.6" {...stroke}/></Svg>;
export const IconUser = (props) => <Svg {...props}><circle cx="12" cy="8.2" r="4" {...stroke}/><path d="M4.5 21a7.5 7.5 0 0 1 15 0" {...stroke}/></Svg>;
export const IconSupport = (props) => <Svg {...props}><path d="M5 13.2a7 7 0 1 1 14 0v4a2 2 0 0 1-2 2h-2" {...stroke}/><path d="M5 13.2h3v5H6a1 1 0 0 1-1-1v-4ZM19 13.2h-3v5h2a1 1 0 0 0 1-1v-4ZM12 19.2h3" {...stroke}/></Svg>;
export const IconMessage = (props) => <Svg {...props}><path d="M4 5.2h16v10.7H8.3L4 20.2v-15Z" {...stroke}/><path d="M8.2 9.1h7.8M8.2 12.4h5.4" {...stroke}/></Svg>;
export const IconBell = (props) => <Svg {...props}><path d="M18 9.8a6 6 0 1 0-12 0c0 6.8-2.5 6.8-2.5 8.7h17S18 16.6 18 9.8Z" {...stroke}/><path d="M9.5 20.2a2.5 2.5 0 0 0 5 0" {...stroke}/></Svg>;
export const IconLogout = (props) => <Svg {...props}><path d="M10 5H5.5A1.5 1.5 0 0 0 4 6.5v11A1.5 1.5 0 0 0 5.5 19H10M14 8l4 4-4 4M18 12H9" {...stroke}/></Svg>;
export const IconSpark = (props) => <Svg {...props}><path d="M12 3.2 14 8l4.8 2-4.8 2-2 4.8-2-4.8-4.8-2L10 8l2-4.8Z" {...stroke}/><path d="M5 16.5l.8 2.1L8 19.4l-2.2.8L5 22.2l-.8-2-2.2-.8 2.2-.8.8-2.1ZM19 2l.65 1.8 1.85.65-1.85.65L19 7l-.65-1.9-1.85-.65 1.85-.65L19 2Z" fill="currentColor"/></Svg>;
export const IconChart = (props) => <Svg {...props}><path d="M4 19.5V5M4 19.5h16" {...stroke}/><path d="M7.2 16.5c1.4-3.2 3-4.3 4.7-3.2 1.8 1.2 3.7.2 5.9-4.8" {...stroke}/><path d="m17.3 8.3.7-3.1-3 .9" {...stroke}/></Svg>;
export const IconChevron = (props) => <Svg {...props}><path d="m10 7 5 5-5 5" {...stroke}/></Svg>;
export const IconMenu = (props) => <Svg {...props}><path d="M4 7h16M4 12h16M4 17h16" {...stroke}/></Svg>;
export const IconX = (props) => <Svg {...props}><path d="M6 6l12 12M18 6 6 18" {...stroke}/></Svg>;
export const IconRocket = (props) => <Svg {...props}><path d="M14.5 4.2c2.6-.6 4.6.2 5.3.9.7.7 1.5 2.7.9 5.3-.7 3-3.3 5.9-7.7 8.7l-4.1-4.1c2.8-4.4 5.7-7 8.6-7.7Z" {...stroke}/><path d="M9 15 5.6 18.4M8.1 11.3 4.5 10.6l3.2-3.2 3.4.4M12.7 15.9l.4 3.4-3.2 3.2-.7-3.6" {...stroke}/><circle cx="16.2" cy="8.7" r="1.6" fill="currentColor"/></Svg>;
export const IconCrown = (props) => <Svg {...props}><path d="M4 17.5h16l-1.2-9-4.2 3.8L12 5.5l-2.6 6.8-4.2-3.8L4 17.5Z" {...stroke}/><path d="M5.5 20h13" {...stroke}/></Svg>;
export const IconCalendar = (props) => <Svg {...props}><rect x="4" y="5" width="16" height="15" rx="3" {...stroke}/><path d="M8 3.5v3M16 3.5v3M4 9h16" {...stroke}/></Svg>;
export const IconPlay = (props) => <Svg {...props}><circle cx="12" cy="12" r="9" {...stroke}/><path d="M10 8.8v6.4l5-3.2-5-3.2Z" fill="currentColor"/></Svg>;

export const PlatformMark = ({ size = 42, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="4" y="4" width="40" height="40" rx="15" fill="url(#nhCreativeMark)"/>
    <path d="M14.5 31.5V16.8h4.7l7.3 9.1v-9.1h4.7v14.7h-4.7l-7.3-9.1v9.1h-4.7Z" fill="white"/>
    <path d="M34 13.4 36 17l4 .7-2.8 2.8.5 4-3.7-1.8-3.7 1.8.5-4-2.8-2.8 4-.7 2-3.6Z" fill="#f472b6"/>
    <defs>
      <linearGradient id="nhCreativeMark" x1="7" y1="8" x2="42" y2="41" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7c3aed"/><stop offset=".48" stopColor="#ec4899"/><stop offset="1" stopColor="#2563eb"/>
      </linearGradient>
    </defs>
  </svg>
);
