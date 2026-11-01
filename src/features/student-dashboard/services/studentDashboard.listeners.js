import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '@services/firebase';
import { COLLECTIONS } from '@config/collections';
import { mapDocs, sortByCreatedAtDesc, sortBySubmittedAtDesc, sortByTimestampDesc } from '@shared/firebase/firestoreMaps';
import { normalizeResult } from '@services/platformData';
import { canStudentSee, studentAudienceKeys } from '@shared/audience/audience.js';

// كل نوع (محتوى/امتحانات/واجبات/إشعارات) بيتجاب بطريقتين: بالصف (القديم) + بـ audienceKeys (الجديد:
// كل الطلبة / صفوف / طلبة معيّنين)، وبعدين بيتدمجوا ويتصفّوا باللي الطالب ده مسموح له يشوفه.
function mergedBucket(onChange) {
  const parts = {};
  return (name) => (rows) => {
    parts[name] = rows;
    const byId = new Map();
    Object.values(parts).forEach((list) => list.forEach((r) => byId.set(r.id, r)));
    onChange([...byId.values()]);
  };
}

const emptyOnBlocked = (label, setter) => (error) => {
  console.warn(`${label} listener blocked:`, error?.message);
  setter([]);
};

export function subscribeStudentDashboardData({ user, userData, handlers, onLatestNotification }) {
  const me = { uid: user.uid, grade: userData?.grade, email: user.email };
  const keys = studentAudienceKeys(me);
  const content = mergedBucket((rows) => handlers.setContent(rows.filter((item) => canStudentSee(item, me))));
  const exams = mergedBucket((rows) => handlers.setExams(rows.filter((exam) => exam.isPublished !== false && canStudentSee(exam, me))));
  const assignments = mergedBucket((rows) => handlers.setAssignments(sortByCreatedAtDesc(rows.filter((a) => canStudentSee(a, me)))));
  const nowMs = () => Date.now();
  const sendAtMs = (n) => (n.sendAt?.toMillis ? n.sendAt.toMillis() : n.sendAt ? new Date(n.sendAt).getTime() : 0);
  // الإشعارات المجدولة (sendAt): بنعيد الحساب كل دقيقة عشان تظهر في ميعادها حتى لو مفيش أي تغيير في البيانات
  let rawNotifications = [];
  let lastDueKey = '';
  const publishNotifications = () => {
    const now = nowMs();
    const list = rawNotifications
      .filter((n) => (!n.sendAt || sendAtMs(n) <= now) && (!n.expiresAt || sendAtMs({ sendAt: n.expiresAt }) > now))
      .sort((a, b) => (sendAtMs({ sendAt: b.sendAt || b.createdAt }) - sendAtMs({ sendAt: a.sendAt || a.createdAt })));
    const key = list.map((n) => n.id).join('|');
    if (key === lastDueKey) return;
    lastDueKey = key;
    handlers.setNotifications(list);
    if (list.length > 0) onLatestNotification?.(list[0]);
  };
  const notifications = mergedBucket((rows) => { rawNotifications = sortByCreatedAtDesc(rows); lastDueKey = ''; publishNotifications(); });
  const dueTimer = setInterval(publishNotifications, 60000);
  const examResultBuckets = { canonical: [], legacy: [] };
  const setUnifiedStudentResults = () => {
    const rows = [...examResultBuckets.canonical, ...examResultBuckets.legacy];
    handlers.setExamResults(sortBySubmittedAtDesc(rows));
  };
  return [
    () => clearInterval(dueTimer),
    onSnapshot(query(collection(db, COLLECTIONS.CONTENT), where('grade', '==', userData?.grade), limit(300)), (snapshot) => content('grade')(mapDocs(snapshot)), emptyOnBlocked('content', handlers.setContent)),
    onSnapshot(query(collection(db, COLLECTIONS.CONTENT), where('audienceKeys', 'array-contains-any', keys), limit(300)), (snapshot) => content('aud')(mapDocs(snapshot)), () => content('aud')([])),

    onSnapshot(query(collection(db, COLLECTIONS.EXAMS), where('grade', '==', userData?.grade), limit(200)), (snapshot) => exams('grade')(mapDocs(snapshot)), emptyOnBlocked('exams', handlers.setExams)),
    onSnapshot(query(collection(db, COLLECTIONS.EXAMS), where('audienceKeys', 'array-contains-any', keys), limit(200)), (snapshot) => exams('aud')(mapDocs(snapshot)), () => exams('aud')([])),

    onSnapshot(query(collection(db, COLLECTIONS.EXAM_RESULTS), where('studentId', '==', user.uid), limit(300)), (snapshot) => { examResultBuckets.canonical = mapDocs(snapshot).map((row) => normalizeResult(row, COLLECTIONS.EXAM_RESULTS)); setUnifiedStudentResults(); }, emptyOnBlocked('exam_results', handlers.setExamResults)),

    onSnapshot(query(collection(db, COLLECTIONS.LEGACY_EXAM_RESULTS), where('userId', '==', user.uid), limit(300)), (snapshot) => { examResultBuckets.legacy = mapDocs(snapshot).map((row) => normalizeResult(row, COLLECTIONS.LEGACY_EXAM_RESULTS)); setUnifiedStudentResults(); }, emptyOnBlocked('legacy_exam_results', handlers.setExamResults)),

    onSnapshot(query(collection(db, COLLECTIONS.HOMEWORK_RESULTS), where('studentId', '==', user.uid), limit(300)), (snapshot) => handlers.setHwResults(sortBySubmittedAtDesc(mapDocs(snapshot))), emptyOnBlocked('homework_results', handlers.setHwResults)),

    onSnapshot(query(collection(db, COLLECTIONS.STUDENT_MISTAKES), where('userId', '==', user.uid), limit(300)), (snapshot) => handlers.setMistakes(sortByTimestampDesc(mapDocs(snapshot))), emptyOnBlocked('student_mistakes', handlers.setMistakes)),

    onSnapshot(query(collection(db, COLLECTIONS.NOTIFICATIONS), where('audience', 'in', ['all', userData?.grade || 'all', `user:${user.uid}`]), orderBy('createdAt', 'desc'), limit(40)), (snapshot) => notifications('legacy')(mapDocs(snapshot)), emptyOnBlocked('notifications', handlers.setNotifications)),
    onSnapshot(query(collection(db, COLLECTIONS.NOTIFICATIONS), where('audienceKeys', 'array-contains-any', keys), orderBy('createdAt', 'desc'), limit(40)), (snapshot) => notifications('aud')(mapDocs(snapshot)), () => notifications('aud')([])),

    onSnapshot(query(collection(db, COLLECTIONS.ASSIGNMENTS), where('grade', '==', userData?.grade), limit(200)), (snapshot) => assignments('grade')(mapDocs(snapshot)), emptyOnBlocked('assignments', handlers.setAssignments)),
    onSnapshot(query(collection(db, COLLECTIONS.ASSIGNMENTS), where('audienceKeys', 'array-contains-any', keys), limit(200)), (snapshot) => assignments('aud')(mapDocs(snapshot)), () => assignments('aud')([])),

    onSnapshot(query(collection(db, COLLECTIONS.ASSIGNMENT_SUBMISSIONS), where('studentId', '==', user.uid), limit(300)), (snapshot) => handlers.setAssignmentSubmissions(sortBySubmittedAtDesc(mapDocs(snapshot))), emptyOnBlocked('assignment_submissions', handlers.setAssignmentSubmissions)),

    onSnapshot(query(collection(db, COLLECTIONS.VIDEO_VIEWS), where('userId', '==', user.uid), limit(300)), (snapshot) => handlers.setVideoViews(mapDocs(snapshot)), emptyOnBlocked('video_views', handlers.setVideoViews)),

    onSnapshot(query(collection(db, COLLECTIONS.EXAM_ACCESS_OVERRIDES), where('studentId', '==', user.uid), limit(200)), (snapshot) => handlers.setExamAccessOverrides?.(mapDocs(snapshot)), emptyOnBlocked('exam_access_overrides', handlers.setExamAccessOverrides || (() => {})))
  ];
}
