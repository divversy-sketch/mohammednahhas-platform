import { HomePanelIcon, LessonIcon, ExamIcon, TrophyIcon, CrownIcon, CourseIcon } from '../icons/nahhasCustomIcons.jsx';
import { studentJourney, adminWorkCenters } from '../config/navigationJourneys.js';

export { studentJourney, adminWorkCenters };

export const MOBILE_STUDENT_NAV_ITEMS = [
  { key: 'home', label: 'الرئيسية', icon: HomePanelIcon },
  { key: 'videos', label: 'المحاضرات', icon: LessonIcon },
  { key: 'exams', label: 'الامتحانات', icon: ExamIcon },
  { key: 'settings', label: 'الأداء', icon: TrophyIcon },
  { key: 'subscription', label: 'الباقة', icon: CrownIcon },
];

export const STUDENT_PRIMARY_JOURNEY = studentJourney;
export const ADMIN_WORK_CENTERS = adminWorkCenters;
export const DESKTOP_STUDENT_NAV_ITEMS = [
  ...MOBILE_STUDENT_NAV_ITEMS,
  { key: 'courses', label: 'الكورسات', icon: CourseIcon },
];
