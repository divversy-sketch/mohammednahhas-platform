import {
  C03BookIcon,
  C03CrownIcon,
  C03ExamIcon,
  C03HomeIcon,
  C03PlayIcon,
  C03ChartIcon,
} from '../icons/creative03Icons.jsx';
import { studentJourney, adminWorkCenters } from '../config/navigationJourneys.js';

export { studentJourney, adminWorkCenters };

export const MOBILE_STUDENT_NAV_ITEMS = [
  { key: 'home', label: 'الرئيسية', icon: C03HomeIcon },
  { key: 'videos', label: 'المحاضرات', icon: C03PlayIcon },
  { key: 'exams', label: 'الامتحانات', icon: C03ExamIcon },
  { key: 'settings', label: 'الأداء', icon: C03ChartIcon },
  { key: 'subscription', label: 'الاشتراك', icon: C03CrownIcon },
];

export const STUDENT_PRIMARY_JOURNEY = studentJourney;
export const ADMIN_WORK_CENTERS = adminWorkCenters;
export const DESKTOP_STUDENT_NAV_ITEMS = [
  ...MOBILE_STUDENT_NAV_ITEMS,
  { key: 'courses', label: 'الكورسات', icon: C03BookIcon },
];
