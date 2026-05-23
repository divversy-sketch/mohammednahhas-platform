const Svg = ({ children, size = 22, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true" {...props}>
    {children}
  </svg>
);

export const C03HomeIcon = (props) => <Svg {...props}><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>;
export const C03PlayIcon = (props) => <Svg {...props}><rect x="3" y="4" width="18" height="16" rx="4" stroke="currentColor" strokeWidth="1.8"/><path d="m10 9 5 3-5 3V9Z" fill="currentColor"/></Svg>;
export const C03ExamIcon = (props) => <Svg {...props}><rect x="5" y="3" width="14" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M9 8h6M9 12h6M9 16h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="m14 16 1.2 1.2L18 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
export const C03BookIcon = (props) => <Svg {...props}><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21V5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20" stroke="currentColor" strokeWidth="1.8"/><path d="M8 7h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>;
export const C03FileIcon = (props) => <Svg {...props}><path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 3v5h5M9 13h6M9 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
export const C03MessageIcon = (props) => <Svg {...props}><path d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v5A3.5 3.5 0 0 1 16.5 15H11l-5 4v-4.4A3.5 3.5 0 0 1 4 11.5v-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M8 8h8M8 11h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>;
export const C03CrownIcon = (props) => <Svg {...props}><path d="m4 8 4 3 4-6 4 6 4-3-2 10H6L4 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M7 21h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>;
export const C03ChartIcon = (props) => <Svg {...props}><path d="M5 20V9M12 20V4M19 20v-7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/><path d="M3 20h18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></Svg>;
export const C03SettingsIcon = (props) => <Svg {...props}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l2-1.5-2-3.4-2.4 1a7.7 7.7 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.6A7.7 7.7 0 0 0 7 6.6l-2.4-1-2 3.4 2 1.5A9 9 0 0 0 4.5 12c0 .5 0 1 .1 1.5l-2 1.5 2 3.4 2.4-1a7.7 7.7 0 0 0 2.6 1.5L10 21.5h4l.4-2.6a7.7 7.7 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></Svg>;
export const C03RocketIcon = (props) => <Svg {...props}><path d="M13 4c3.5.3 6.2 3 6.5 6.5l-5.8 5.8-5.9-5.9L13 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 15 5 19l-.5-3.5L8 12M12 18l-3.5 3.5L8 18l3-3M14 8.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
export const C03CalendarIcon = (props) => <Svg {...props}><rect x="4" y="5" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>;
export const C03BellIcon = (props) => <Svg {...props}><path d="M18 10a6 6 0 0 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>;
export const C03UserIcon = (props) => <Svg {...props}><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>;
export const C03LogoutIcon = (props) => <Svg {...props}><path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4M15 7l5 5-5 5M20 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
export const C03SearchIcon = (props) => <Svg {...props}><path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></Svg>;
export const C03SparkIcon = (props) => <Svg {...props}><path d="M13 2 9.8 8.8 3 12l6.8 3.2L13 22l3.2-6.8L23 12l-6.8-3.2L13 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M5 3v4M3 5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></Svg>;

// Compatibility aliases for older navigation imports
export const HomePanelIcon = C03HomeIcon;
export const LessonIcon = C03PlayIcon;
export const ExamIcon = C03ExamIcon;
export const TrophyIcon = C03ChartIcon;
export const CrownIcon = C03CrownIcon;
export const CourseIcon = C03BookIcon;
