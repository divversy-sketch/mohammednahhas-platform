// Student navigation: five fixed sections, each with its own sub pages.
export const SECTIONS = [
  { key: 'home', label: 'الرئيسية', title: 'الرئيسية', icon: 'home' },
  { key: 'learn', label: 'المحاضرات', title: 'المحاضرات والكورسات', icon: 'video' },
  { key: 'exams', label: 'الامتحانات', title: 'الامتحانات والواجبات', icon: 'exam' },
  { key: 'progress', label: 'مستواي', title: 'مستواي', icon: 'chart' },
  { key: 'account', label: 'حسابي', title: 'حسابي', icon: 'user' },
];

export const SUBS = {
  learn: [
    { key: 'lectures', label: 'المحاضرات', icon: 'video' },
    { key: 'courses', label: 'الكورسات', icon: 'layers' },
    { key: 'interactive', label: 'دروس تفاعلية', icon: 'interactive' },
    { key: 'files', label: 'الملفات', icon: 'fileText' },
    { key: 'live', label: 'الحصص اللايف', icon: 'live' },
  ],
  exams: [
    { key: 'open', label: 'المتاحة', icon: 'exam' },
    { key: 'upcoming', label: 'الجاية', icon: 'calendar' },
    { key: 'done', label: 'اللي خلصتها', icon: 'checkCircle' },
    { key: 'homework', label: 'الواجبات', icon: 'qr' },
    { key: 'quiz', label: 'مراجعة سريعة', icon: 'spark' },
  ],
  progress: [
    { key: 'overview', label: 'نظرة عامة', icon: 'chart' },
    { key: 'mistakes', label: 'بنك الأخطاء', icon: 'mistake' },
    { key: 'path', label: 'مسار التعلم', icon: 'route' },
    { key: 'leaderboard', label: 'لوحة الشرف', icon: 'trophy' },
    { key: 'certificates', label: 'شهاداتي', icon: 'medal' },
  ],
  account: [
    { key: 'profile', label: 'بياناتي', icon: 'user' },
    { key: 'billing', label: 'الاشتراك والدفع', icon: 'wallet' },
    { key: 'support', label: 'الرسائل والدعم', icon: 'message' },
    { key: 'settings', label: 'الإعدادات', icon: 'settings' },
  ],
};

// Older screens still call setActiveTab('subscription'), ('mistakes_bank') ... map them to the new places.
const ALIASES = {
  home: 'home',
  lectures: 'learn:lectures', videos: 'learn:lectures', learn: 'learn',
  courses: 'learn:courses', htmls: 'learn:interactive', interactiveExams: 'learn:interactive', interactive: 'learn:interactive',
  files: 'learn:files', library: 'learn:files', live: 'learn:live',
  exams: 'exams', assignments: 'exams:homework', homework: 'exams:homework', smartHomeworkResults: 'exams:homework',
  reviewQuiz: 'exams:quiz', review_quiz: 'exams:quiz',
  performance: 'progress', progress: 'progress', mistakesBank: 'progress:mistakes', mistakes_bank: 'progress:mistakes', mistakes: 'progress:mistakes',
  remediation: 'progress:mistakes', learningPath: 'progress:path', learning_path: 'progress:path', leaderboard: 'progress:leaderboard',
  certificates: 'progress:certificates',
  account: 'account', profile: 'account:profile', settings: 'account:settings',
  subscription: 'account:billing', payments: 'account:billing', billing: 'account:billing',
  support: 'account:support', messages: 'account:support',
};

export function parseRoute(tab) {
  const raw = String(tab || 'home');
  const resolved = ALIASES[raw] || raw;
  const [section, sub] = resolved.split(':');
  const known = SECTIONS.some((s) => s.key === section) ? section : 'home';
  const subs = SUBS[known] || [];
  const validSub = subs.some((s) => s.key === sub) ? sub : subs[0]?.key || null;
  return { section: known, sub: validSub, key: validSub ? `${known}:${validSub}` : known };
}

export function routeTitle(route) {
  const section = SECTIONS.find((s) => s.key === route.section);
  if (!route.sub || route.section === 'home') return section?.title || 'الرئيسية';
  const sub = (SUBS[route.section] || []).find((s) => s.key === route.sub);
  return sub?.label || section?.title;
}
