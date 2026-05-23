import {
  IconHome,
  IconVideo,
  IconExam,
  IconChart,
  IconWallet,
  IconBook,
} from '../icons/nahhasCustomIcons.jsx';
import { studentJourney, adminWorkCenters } from '../config/navigationJourneys.js';

export { studentJourney, adminWorkCenters };

export const MOBILE_STUDENT_NAV_ITEMS = [
  { key: 'home', label: 'الرئيسية', icon: IconHome },
  { key: 'videos', label: 'المحاضرات', icon: IconVideo },
  { key: 'exams', label: 'الامتحانات', icon: IconExam },
  { key: 'settings', label: 'الأداء', icon: IconChart },
  { key: 'subscription', label: 'الاشتراك', icon: IconWallet },
];

export const STUDENT_PRIMARY_JOURNEY = studentJourney;
export const ADMIN_WORK_CENTERS = adminWorkCenters;
export const DESKTOP_STUDENT_NAV_ITEMS = [
  ...MOBILE_STUDENT_NAV_ITEMS,
  { key: 'courses', label: 'الكورسات', icon: IconBook },
];
