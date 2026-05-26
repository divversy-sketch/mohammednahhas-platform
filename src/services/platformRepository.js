import {
  adminActivities,
  adminDonut,
  adminLine,
  adminStats,
  adminTickets,
  studentMessages,
  studentProgress,
  studentTasks,
} from '../data/platformData.js';

const STORAGE_KEY = 'platform-redesign-live-data-v1';

const seedData = {
  student: {
    profile: {
      name: 'أحمد الطالب',
      role: 'طالب متقدم',
      level: 6,
      streak: 18,
      points: 2450,
    },
    courses: studentProgress,
    tasks: studentTasks,
    messages: studentMessages,
    exams: [
      { title: 'اختبار التفاضل والتكامل', status: 'متاح الآن', score: '92%' },
      { title: 'اختبار الفيزياء العامة', status: 'غدًا', score: 'لم يبدأ' },
      { title: 'اختبار Python العملي', status: 'بعد يومين', score: 'لم يبدأ' },
    ],
    notifications: [
      'تم فتح جلسة مباشرة جديدة في الرياضيات.',
      'اقتراح ذكي: راجع درس الذكاء الاصطناعي للمبتدئين.',
      'تم تحديث واجهة الطالب بتجربة ترحيبية جديدة.',
    ],
    community: [
      { title: 'تحدي أسبوع البرمجة', members: 240, activity: 'نشط' },
      { title: 'نادي الرياضيات التطبيقية', members: 120, activity: 'جلسة اليوم' },
      { title: 'مجتمع الذكاء الاصطناعي', members: 390, activity: 'نقاش مباشر' },
    ],
  },
  admin: {
    profile: {
      name: 'أحمد المنصوري',
      role: 'مدير النظام',
      plan: 'Enterprise',
    },
    stats: adminStats,
    chart: adminLine,
    subscriptions: adminDonut,
    tickets: adminTickets,
    activities: adminActivities,
    students: [
      { name: 'سارة محمد', email: 'sara@example.com', plan: 'سنوي', status: 'نشط' },
      { name: 'محمد علي', email: 'mohamed@example.com', plan: 'شهري', status: 'نشط' },
      { name: 'نورة خالد', email: 'noura@example.com', plan: 'مؤسسة', status: 'بانتظار' },
    ],
    teachers: [
      { name: 'د. أحمد حسين', specialty: 'ذكاء اصطناعي', sessions: 32 },
      { name: 'م. سارة عادل', specialty: 'برمجة', sessions: 45 },
      { name: 'أ. محمد فؤاد', specialty: 'رياضيات', sessions: 28 },
    ],
    courses: [
      { title: 'الذكاء الاصطناعي للمبتدئين', students: 1240, status: 'منشور' },
      { title: 'الرياضيات المتقدمة', students: 980, status: 'منشور' },
      { title: 'تصميم الواجهات الاحترافية', students: 760, status: 'قيد المراجعة' },
    ],
    reports: [
      { title: 'تقرير الإيرادات الشهري', ready: true },
      { title: 'تقرير أداء الطلاب', ready: true },
      { title: 'تقرير الدعم الفني', ready: false },
    ],
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getPlatformData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Local storage may be unavailable in some embedded previews.
  }
  return clone(seedData);
}

export function savePlatformData(nextData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
  } catch {
    // Ignore write failures in preview environments.
  }
  return nextData;
}

export function resetPlatformData() {
  return savePlatformData(clone(seedData));
}

export function updatePlatformSlice(section, updater) {
  const data = getPlatformData();
  const nextSlice = updater(clone(data[section]));
  const nextData = { ...data, [section]: nextSlice };
  return savePlatformData(nextData);
}

export async function connectRealApi(endpoint, options = {}) {
  const response = await fetch(endpoint, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}
