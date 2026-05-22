import React from 'react';

const baseProps = (size, className) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  className,
  'aria-hidden': true,
});

const Stroke = ({ children, size = 22, className }) => (
  <svg {...baseProps(size, className)} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

export const HomePanelIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><path d="M4 10.8 12 4l8 6.8"/><path d="M6.5 10.5V20h11v-9.5"/><path d="M9.5 20v-5h5v5"/></Stroke>;
export const LessonIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><rect x="4" y="5" width="16" height="12" rx="2.5"/><path d="M9.5 9.2v3.6L13 11z" fill="currentColor" stroke="none"/><path d="M7 20h10"/></Stroke>;
export const ExamIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><path d="M7 3.5h8l3 3V20.5H7z"/><path d="M15 3.5V7h3"/><path d="M9.5 11h5"/><path d="M9.5 14h3"/><path d="M9.5 17h5"/></Stroke>;
export const AssignmentIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4V2.8h6V4"/><path d="M9 10h6"/><path d="M9 14h6"/><path d="M9 18h3"/></Stroke>;
export const FileBoxIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><path d="M4 8h16v10.5A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5z"/><path d="M4 8l2.2-4h11.6L20 8"/><path d="M9 13h6"/></Stroke>;
export const InteractiveIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><path d="M8 8 4 12l4 4"/><path d="m16 8 4 4-4 4"/><path d="m13.5 5-3 14"/></Stroke>;
export const CourseIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v15H7.5A2.5 2.5 0 0 0 5 20.5z"/><path d="M5 5.5v15"/><path d="M9 7h7"/><path d="M9 10h5"/></Stroke>;
export const BrainIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><path d="M9 5.5A3 3 0 0 0 6 8.4 3.4 3.4 0 0 0 6.2 15 3 3 0 0 0 9 19"/><path d="M15 5.5a3 3 0 0 1 3 2.9 3.4 3.4 0 0 1-.2 6.6A3 3 0 0 1 15 19"/><path d="M9 5.5v13"/><path d="M15 5.5v13"/><path d="M9 10h6"/><path d="M9 14h6"/></Stroke>;
export const MessageIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v4A3.5 3.5 0 0 1 15.5 14H10l-5 5v-5.5z"/><path d="M8.5 7.5h7"/><path d="M8.5 10.5h4"/></Stroke>;
export const SupportIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><path d="M4.5 12a7.5 7.5 0 0 1 15 0"/><path d="M5 12v4a2 2 0 0 0 2 2h1v-6H7a2 2 0 0 0-2 2"/><path d="M19 12v4a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2"/><path d="M12 19h3"/></Stroke>;
export const ProfileIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><circle cx="12" cy="8" r="3.2"/><path d="M5 20a7 7 0 0 1 14 0"/></Stroke>;
export const TrophyIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><path d="M8 4h8v4.5a4 4 0 0 1-8 0z"/><path d="M8 6H5.5A1.5 1.5 0 0 0 4 7.5 4.5 4.5 0 0 0 8 12"/><path d="M16 6h2.5A1.5 1.5 0 0 1 20 7.5a4.5 4.5 0 0 1-4 4.5"/><path d="M12 12.5V17"/><path d="M9 20h6"/><path d="M10 17h4"/></Stroke>;
export const CrownIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><path d="m4 8 4 4 4-7 4 7 4-4-1.5 10h-13z"/><path d="M6 21h12"/></Stroke>;
export const BellIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><path d="M6 10a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 19a2 2 0 0 0 4 0"/></Stroke>;
export const FocusIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/></Stroke>;
export const LogoutIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><path d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H10"/><path d="M14 8l4 4-4 4"/><path d="M18 12H9"/></Stroke>;
export const MenuIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></Stroke>;
export const CloseIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><path d="M6 6l12 12"/><path d="M18 6 6 18"/></Stroke>;
export const MoreIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><circle cx="12" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/></Stroke>;
export const SparkIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><path d="M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9z"/><path d="M5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8z"/></Stroke>;
export const ArrowIcon = ({ size = 22, className = '' }) => <Stroke size={size} className={className}><path d="M15 6 9 12l6 6"/></Stroke>;
