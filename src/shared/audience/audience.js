// «مين يشوف ده؟» — نظام واحد لكل حاجة بتتنشر للطلبة (محتوى، امتحانات، إشعارات).
//
// audience  = { mode: 'all' | 'grades' | 'groups' | 'students', grades: [], groupIds: [], studentIds: [] }
// audienceKeys (بتتحفظ مع العنصر عشان الطالب يجيبه بسؤال واحد، وقواعد Firebase تتحقق منه):
//   'all'            كل الطلبة
//   'grade:<code>'   كل طلبة صف
//   'user:<uid>'     طالب معيّن (المجموعات بتتحول لطلبتها وقت النشر)
// العناصر القديمة اللي مالهاش audienceKeys بتفضل شغالة زي ما هي (بالصف + allowedEmails).

export const AUDIENCE_MODES = [
  { key: 'all', label: 'كل الطلبة', hint: 'في كل الصفوف' },
  { key: 'grades', label: 'صفوف معيّنة', hint: 'صف أو أكتر' },
  { key: 'groups', label: 'مجموعات', hint: 'من «المجموعات والدفعات»' },
  { key: 'students', label: 'طلبة بالاسم', hint: 'طالب واحد أو أكتر' },
];

export const defaultAudience = (grade) => ({ mode: 'grades', grades: grade ? [grade] : [], groupIds: [], studentIds: [] });

const uidOf = (u) => u?.id || u?.uid;

/** الطلبة اللي العنصر هيوصلهم فعلًا (من قايمة الطلبة اللي عند الأدمن). */
export function audienceStudents(audience, users = [], groups = []) {
  const a = audience || {};
  const students = users.filter((u) => (u.role || 'student') === 'student');
  if (a.mode === 'all') return students;
  if (a.mode === 'grades') return students.filter((u) => (a.grades || []).includes(u.grade));
  if (a.mode === 'groups') {
    const g = new Set(a.groupIds || []);
    const members = new Set(groups.filter((x) => g.has(x.id)).flatMap((x) => x.members || []));
    return students.filter((u) => members.has(uidOf(u)) || (u.groupIds || []).some((id) => g.has(id)) || g.has(u.groupId) || g.has(u.studyGroup));
  }
  if (a.mode === 'students') { const ids = new Set(a.studentIds || []); return students.filter((u) => ids.has(uidOf(u))); }
  return [];
}

/**
 * الحقول اللي بتتحفظ مع العنصر.
 * grade: للتوافق مع الأجزاء القديمة اللي بتقرا grade (صف واحد = هو، غير كده 'all' أو 'custom').
 */
export function resolveAudience(audience, users = [], groups = []) {
  const a = { mode: 'all', grades: [], groupIds: [], studentIds: [], ...(audience || {}) };
  if (a.mode === 'all') return { audience: { mode: 'all' }, audienceKeys: ['all'], grade: 'all', count: audienceStudents(a, users, groups).length };
  if (a.mode === 'grades') {
    const grades = [...new Set(a.grades || [])].filter(Boolean);
    return { audience: { mode: 'grades', grades }, audienceKeys: grades.map((g) => `grade:${g}`), grade: grades.length === 1 ? grades[0] : 'multi', count: audienceStudents(a, users, groups).length };
  }
  const list = audienceStudents(a, users, groups);
  const ids = a.mode === 'students' ? [...new Set(a.studentIds || [])] : list.map(uidOf);
  return {
    audience: { mode: a.mode, groupIds: a.mode === 'groups' ? a.groupIds : [], studentIds: ids },
    audienceKeys: ids.slice(0, 1500).map((id) => `user:${id}`),
    grade: 'custom',
    count: ids.length,
  };
}

/** المفاتيح اللي الطالب ده بيشوف بيها (لسؤال Firebase: array-contains-any). */
export const studentAudienceKeys = ({ uid, grade }) => ['all', grade ? `grade:${grade}` : null, uid ? `user:${uid}` : null].filter(Boolean);

/** الطالب ده يشوف العنصر ده؟ */
export function canStudentSee(item, { uid, grade, email } = {}) {
  if (!item) return false;
  if (Array.isArray(item.audienceKeys) && item.audienceKeys.length) {
    return item.audienceKeys.includes('all') || item.audienceKeys.includes(`grade:${grade}`) || item.audienceKeys.includes(`user:${uid}`);
  }
  // العناصر القديمة
  if (item.grade && item.grade !== 'all' && item.grade !== grade) return false;
  if (Array.isArray(item.allowedEmails) && item.allowedEmails.length && !item.allowedEmails.includes(email)) return false;
  return true;
}

/** وصف قصير: «كل الطلبة» / «تالتة ثانوي» / «٣ طلاب» … */
export function audienceLabel(item, { gradeLabel = (g) => g, groups = [] } = {}) {
  const a = item?.audience;
  const n = (x) => Number(x || 0).toLocaleString('ar-EG');
  if (!a) {
    if (Array.isArray(item?.allowedEmails) && item.allowedEmails.length) return `${n(item.allowedEmails.length)} طالب بالإيميل`;
    return item?.grade && item.grade !== 'all' ? gradeLabel(item.grade) : 'كل الطلبة';
  }
  if (a.mode === 'all') return 'كل الطلبة';
  if (a.mode === 'grades') return (a.grades || []).map(gradeLabel).join('، ') || '—';
  if (a.mode === 'groups') {
    const names = (a.groupIds || []).map((id) => groups.find((g) => g.id === id)?.name || groups.find((g) => g.id === id)?.title).filter(Boolean);
    return names.length ? `مجموعة: ${names.join('، ')}` : `${n((a.studentIds || []).length)} طالب من مجموعات`;
  }
  return (a.studentIds || []).length === 1 ? 'طالب واحد' : `${n((a.studentIds || []).length)} طلاب`;
}
