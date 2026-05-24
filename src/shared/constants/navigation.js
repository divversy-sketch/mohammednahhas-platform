import { BookOpen, ClipboardList, CreditCard, Layout, PlayCircle, Trophy } from '../icons/lucide-shim.jsx';
import { studentJourney, adminWorkCenters } from '../config/navigationJourneys.js';

export { studentJourney, adminWorkCenters };

export const MOBILE_STUDENT_NAV_ITEMS = [
  { key: 'home', label: 'الرئيسية', icon: Layout },
  { key: 'videos', label: 'المحاضرات', icon: PlayCircle },
  { key: 'exams', label: 'الامتحانات', icon: ClipboardList },
  { key: 'settings', label: 'الأداء', icon: Trophy },
  { key: 'subscription', label: 'الدعم', icon: CreditCard },
];

export const STUDENT_PRIMARY_JOURNEY = studentJourney;
export const ADMIN_WORK_CENTERS = adminWorkCenters;
export const DESKTOP_STUDENT_NAV_ITEMS = [
  ...MOBILE_STUDENT_NAV_ITEMS,
  { key: 'courses', label: 'الكورسات', icon: BookOpen },
];
