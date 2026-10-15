// Derived numbers for the student screens. Pure functions over the data the dashboard already loads.
import { getResultPercentage } from '@shared/core/platformShared.jsx';

export const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value === 'object' && Number.isFinite(value.seconds)) return new Date(value.seconds * 1000);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const pick = (item, keys, fallback = '') => {
  for (const k of keys) {
    const v = item?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return fallback;
};

export const titleOf = (item, fallback = 'بدون عنوان') => pick(item, ['title', 'name', 'lessonTitle', 'fileName'], fallback);
export const textOf = (item) => pick(item, ['description', 'desc', 'summary', 'body', 'notes'], '');
export const orderOf = (item, i = 0) => {
  const n = Number(pick(item, ['order', 'sortOrder', 'lessonOrder', 'position', 'index', 'rank'], i));
  return Number.isFinite(n) ? n : i;
};
export const fileUrlOf = (item) => pick(item, ['url', 'fileUrl', 'downloadUrl', 'downloadURL', 'link', 'href', 'contentUrl', 'storageUrl'], '');
export const thumbOf = (item) => {
  const direct = pick(item, ['thumbnail', 'thumbnailUrl', 'thumb', 'cover', 'coverUrl', 'image', 'imageUrl', 'poster'], '');
  if (direct) return direct;
  const url = String(pick(item, ['url', 'videoUrl', 'youtubeUrl', 'link'], ''));
  const yt = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return yt ? `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` : '';
};
export const percentOf = (result) => Math.round(Number(getResultPercentage(result)) || 0);

export const arabicDate = (value, opts = { day: 'numeric', month: 'long' }) => {
  const d = toDate(value);
  return d ? d.toLocaleDateString('ar-EG', opts) : '';
};
export const arabicDateTime = (value) => {
  const d = toDate(value);
  return d ? d.toLocaleString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }) : '';
};

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 5) return 'سهران بتذاكر';
  if (h < 12) return 'صباح الخير';
  if (h < 17) return 'نهارك سعيد';
  return 'مساء الخير';
}

/** Days with real study activity: videos watched, exams submitted, homework handed in. */
export function activityDays({ videoViews = [], examResults = [], assignmentSubmissions = [], hwResults = [] }) {
  const days = new Set();
  const add = (v) => { const d = toDate(v); if (d) days.add(dayKey(d)); };
  videoViews.forEach((v) => add(v.updatedAt || v.lastSeenAt || v.lastWatchedAt || v.createdAt));
  examResults.forEach((r) => add(r.submittedAt || r.completedAt || r.createdAt));
  assignmentSubmissions.forEach((s) => add(s.submittedAt || s.createdAt));
  hwResults.forEach((s) => add(s.submittedAt || s.createdAt));
  return days;
}

const WEEK_LETTERS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']; // getDay(): 0 = Sunday

/** Current streak plus the Egyptian school week (Saturday → Friday) with studied days marked. */
export function studyStreak(ctx, now = new Date()) {
  const days = activityDays(ctx);
  let streak = 0;
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1); // today not done yet does not break it
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  const start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 1) % 7)); // back to Saturday
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { letter: WEEK_LETTERS[d.getDay()], on: days.has(dayKey(d)), today: dayKey(d) === dayKey(now), future: d > now };
  });
  return { streak, week, studiedToday: days.has(dayKey(now)), activeThisWeek: week.filter((w) => w.on).length };
}

export function completedResults(examResults = []) {
  return examResults.filter((r) => r.status === 'completed');
}

/** Last N completed exams oldest → newest, for the trend chart. */
export function scoreSeries({ examResults = [], exams = [] }, n = 6) {
  return completedResults(examResults)
    .map((r) => ({ r, at: toDate(r.submittedAt || r.completedAt)?.getTime() || 0 }))
    .sort((a, b) => a.at - b.at)
    .slice(-n)
    .map(({ r }) => {
      const exam = exams.find((e) => e.id === r.examId);
      return { id: r.id, pct: percentOf(r), label: r.examTitle || exam?.title || 'امتحان', score: r.score, total: r.total || r.totalScore };
    });
}

export function examWindow(exam) {
  return { start: toDate(exam?.startTime), end: toDate(exam?.endTime) };
}

/** Sorts every exam into one bucket the student can act on. */
export function examBuckets({ exams = [], examResults = [] }, now = Date.now()) {
  const byExam = new Map();
  examResults.forEach((r) => {
    const list = byExam.get(r.examId) || [];
    list.push(r);
    byExam.set(r.examId, list);
  });
  const open = [];
  const upcoming = [];
  const closed = [];
  const done = [];
  exams.forEach((exam) => {
    const attempts = byExam.get(exam.id) || [];
    const completed = attempts.find((r) => r.status === 'completed');
    const { start, end } = examWindow(exam);
    const entry = { exam, attempts, completed, start, end };
    if (completed) done.push(entry);
    else if (start && start.getTime() > now) upcoming.push(entry);
    else if (end && end.getTime() < now) closed.push(entry);
    else open.push(entry);
  });
  open.sort((a, b) => (a.end?.getTime() || Infinity) - (b.end?.getTime() || Infinity));
  upcoming.sort((a, b) => a.start.getTime() - b.start.getTime());
  done.sort((a, b) => (toDate(b.completed.submittedAt)?.getTime() || 0) - (toDate(a.completed.submittedAt)?.getTime() || 0));
  return { open, upcoming, closed, done };
}

export function attemptState(attempts = []) {
  if (attempts.some((r) => r.adminDecision === 'continue' || r.adminDecision === 'restart')) return { label: 'الأدمن وافق تكمّل', tone: 'patina' };
  if (attempts.some((r) => r.status === 'security_hold')) return { label: 'موقوف للمراجعة', tone: 'gold' };
  if (attempts.some((r) => r.status === 'cheated')) return { label: 'مسجّل مخالفة', tone: 'danger' };
  if (attempts.some((r) => r.status === 'in_progress')) return { label: 'محاولة مش مكتملة', tone: 'gold' };
  return null;
}

/** Simple, ranked list of what the student should do next. */
export function todoList(ctx, buckets) {
  const items = [];
  if (ctx.inProgressExam) items.push({ key: `resume-${ctx.inProgressExam.id}`, icon: 'exam', tone: 'copper', title: `كمّل: ${ctx.inProgressExam.title || 'امتحان'}`, sub: 'عندك محاولة لسه مفتوحة', kind: 'exam', exam: ctx.inProgressExam });
  buckets.open.slice(0, 3).forEach(({ exam, end }) => {
    if (ctx.inProgressExam?.id === exam.id) return;
    items.push({ key: `exam-${exam.id}`, icon: 'exam', tone: 'copper', title: exam.title || 'امتحان متاح', sub: end ? `بيقفل ${arabicDateTime(end)}` : 'متاح دلوقتي', kind: 'exam', exam, end });
  });
  (ctx.pendingAssignments || []).slice(0, 3).forEach((a) => {
    items.push({ key: `hw-${a.id}`, icon: 'qr', tone: 'patina', title: a.title || 'واجب جديد', sub: a.dueDate || a.deadline ? `آخر ميعاد ${arabicDate(a.dueDate || a.deadline)}` : 'واجب مطلوب', kind: 'homework', assignment: a });
  });
  if ((ctx.mistakes || []).length) items.push({ key: 'mistakes', icon: 'mistake', tone: 'gold', title: `راجع ${Number(ctx.mistakes.length).toLocaleString('ar-EG')} سؤال من بنك الأخطاء`, sub: 'امتحان قصير من أخطائك بس', kind: 'mistakes' });
  return items;
}

/** Everything a student can jump to from search. */
export function searchIndex(ctx) {
  const rows = [];
  (ctx.videos || []).forEach((v) => rows.push({ id: `v-${v.id}`, group: 'محاضرات', title: titleOf(v, 'محاضرة'), icon: 'video', kind: 'video', item: v }));
  (ctx.htmls || []).forEach((v) => rows.push({ id: `h-${v.id}`, group: 'دروس تفاعلية', title: titleOf(v, 'درس'), icon: 'interactive', kind: 'html', item: v }));
  (ctx.interactiveExams || []).forEach((v) => rows.push({ id: `i-${v.id}`, group: 'دروس تفاعلية', title: titleOf(v, 'نشاط'), icon: 'interactive', kind: 'html', item: v }));
  (ctx.filesAndLinks || []).forEach((v) => rows.push({ id: `f-${v.id}`, group: 'ملفات', title: titleOf(v, 'ملف'), icon: 'fileText', kind: 'file', item: v }));
  (ctx.exams || []).forEach((v) => rows.push({ id: `e-${v.id}`, group: 'امتحانات', title: v.title || 'امتحان', icon: 'exam', kind: 'exam', item: v }));
  (ctx.assignments || []).forEach((v) => rows.push({ id: `a-${v.id}`, group: 'واجبات', title: v.title || 'واجب', icon: 'qr', kind: 'homework', item: v }));
  return rows;
}

/** Arabic-aware matching: ignores diacritics, hamza shapes, taa marbuta and alif maqsura. */
export function normalizeArabic(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .trim();
}
