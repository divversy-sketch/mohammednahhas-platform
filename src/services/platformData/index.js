import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, startAfter, where } from 'firebase/firestore';
import { db } from '../firebase.js';
import { COLLECTIONS } from '../../config/collections.js';

export const PLATFORM_COLLECTIONS = Object.freeze({
  users: COLLECTIONS.USERS,
  exams: COLLECTIONS.EXAMS,
  examResults: COLLECTIONS.EXAM_RESULTS,
  legacyExamResults: COLLECTIONS.LEGACY_EXAM_RESULTS,
  attempts: COLLECTIONS.ATTEMPTS,
  content: COLLECTIONS.CONTENT,
  courses: COLLECTIONS.COURSES,
  lessonProgress: COLLECTIONS.LESSON_PROGRESS,
  videoViews: COLLECTIONS.VIDEO_VIEWS,
  paymentRequests: COLLECTIONS.PAYMENT_REQUESTS,
  subscriptionCodes: COLLECTIONS.SUBSCRIPTION_CODES,
  courseAccessCodes: COLLECTIONS.COURSE_ACCESS_CODES,
  notifications: COLLECTIONS.NOTIFICATIONS,
  announcements: COLLECTIONS.ANNOUNCEMENTS,
  studentMessages: COLLECTIONS.STUDENT_MESSAGES,
  studentChats: COLLECTIONS.STUDENT_CHATS,
  systemErrors: COLLECTIONS.SYSTEM_ERRORS,
  performanceMetrics: COLLECTIONS.PERFORMANCE_METRICS,
});

export const normalizeStudentId = (row = {}) => row.studentId || row.userId || row.uid || row.id || '';
export const normalizeResult = (row = {}, source = PLATFORM_COLLECTIONS.examResults) => ({
  ...row,
  id: row.id,
  sourceCollection: row.sourceCollection || source,
  studentId: row.studentId || row.userId || row.uid || '',
  userId: row.userId || row.studentId || row.uid || '',
  percentage: Number(row.percentage ?? row.percent ?? 0),
  status: row.status || (row.submittedAt ? 'completed' : 'in_progress'),
});

export const normalizeProgress = (row = {}, source = PLATFORM_COLLECTIONS.lessonProgress) => ({
  ...row,
  sourceCollection: row.sourceCollection || source,
  userId: row.userId || row.studentId || row.uid || '',
  lessonId: row.lessonId || row.contentId || row.videoId || '',
  completed: Boolean(row.completed || row.finishedAt),
});

export const normalizeSubscription = (student = {}) => {
  const expiry = student.subscriptionExpiry || student.vipUntil || student.expiresAt || null;
  const isPremium = student.subscriptionStatus === 'premium' || student.vip === true || student.isVip === true;
  const expiryDate = expiry?.toDate ? expiry.toDate() : (expiry ? new Date(expiry) : null);
  const isExpired = expiryDate && !Number.isNaN(expiryDate.getTime()) && expiryDate.getTime() < Date.now();
  return {
    ...student,
    subscriptionStatus: isPremium && !isExpired ? 'premium' : (isExpired ? 'expired' : (student.subscriptionStatus || 'free')),
    subscriptionExpiry: expiry || null,
    isPremium: isPremium && !isExpired,
    isExpired: Boolean(isExpired),
  };
};

const mapDocs = (snapshot, source, normalizer = (row) => row) => snapshot.docs.map((d) => normalizer({ id: d.id, ...d.data() }, source));


export async function getPaginatedCollection({ collectionName, orderField = 'createdAt', direction = 'desc', pageSize = 50, cursor = null, filters = [], normalizer = (row) => row } = {}) {
  if (!collectionName) throw new Error('collectionName is required');
  const clauses = [orderBy(orderField, direction), limit(Number(pageSize) || 50)];
  if (cursor) clauses.splice(1, 0, startAfter(cursor));
  const snap = await getDocs(query(collection(db, collectionName), ...filters, ...clauses));
  const rows = snap.docs.map((d) => normalizer({ id: d.id, ...d.data() }, collectionName));
  return { rows, cursor: snap.docs.at(-1) || null, hasMore: snap.docs.length >= (Number(pageSize) || 50) };
}

export async function getStudentsPage({ cursor = null, pageSize = 50, filters = [] } = {}) {
  return getPaginatedCollection({ collectionName: PLATFORM_COLLECTIONS.users, orderField: 'createdAt', direction: 'desc', pageSize, cursor, filters, normalizer: normalizeSubscription });
}

export async function getResultsPage({ cursor = null, pageSize = 50, filters = [] } = {}) {
  return getPaginatedCollection({ collectionName: PLATFORM_COLLECTIONS.examResults, orderField: 'submittedAt', direction: 'desc', pageSize, cursor, filters, normalizer: normalizeResult });
}

export async function getMessagesPage({ cursor = null, pageSize = 50, filters = [] } = {}) {
  return getPaginatedCollection({ collectionName: PLATFORM_COLLECTIONS.studentMessages, orderField: 'createdAt', direction: 'desc', pageSize, cursor, filters });
}

export async function getUnifiedExamResults({ studentId = '', examId = '', max = 500 } = {}) {
  const collections = [PLATFORM_COLLECTIONS.examResults, PLATFORM_COLLECTIONS.legacyExamResults];
  const chunks = await Promise.all(collections.map(async (name) => {
    const filters = [];
    if (studentId) filters.push(where(name === PLATFORM_COLLECTIONS.legacyExamResults ? 'userId' : 'studentId', '==', studentId));
    if (examId) filters.push(where('examId', '==', examId));
    const snap = await getDocs(query(collection(db, name), ...filters, limit(max)));
    return mapDocs(snap, name, normalizeResult);
  }));
  const byKey = new Map();
  chunks.flat().forEach((row) => {
    const key = `${row.sourceCollection}:${row.id}`;
    byKey.set(key, row);
  });
  return [...byKey.values()].sort((a, b) => {
    const at = a.submittedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
    const bt = b.submittedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
    return bt - at;
  });
}

export function listenUnifiedStudentMessages({ userId, grade, onData, onError }) {
  if (!userId) return () => {};
  const q = query(collection(db, PLATFORM_COLLECTIONS.studentMessages), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(q, (snap) => {
    const rows = mapDocs(snap, PLATFORM_COLLECTIONS.studentMessages).filter((row) => {
      const targetType = row.targetType || row.target || 'all';
      if (targetType === 'all') return true;
      if (targetType === 'user' || targetType === 'student') return [row.userId, row.studentId, row.targetUserId].includes(userId);
      if (targetType === 'grade') return !row.grade || row.grade === grade || row.targetGrade === grade;
      return false;
    });
    onData(rows);
  }, onError || (() => {}));
}

export async function writePlatformNotification({ title, body, target = 'all', grade = '', userId = '', createdBy = '', meta = {} }) {
  const payload = {
    title: title || 'تنبيه من المنصة',
    body: body || '',
    message: body || '',
    target,
    targetType: target,
    grade: grade || '',
    targetGrade: grade || '',
    userId: userId || '',
    targetUserId: userId || '',
    createdBy: createdBy || '',
    meta,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = doc(collection(db, PLATFORM_COLLECTIONS.studentMessages));
  await setDoc(ref, payload);
  await setDoc(doc(collection(db, PLATFORM_COLLECTIONS.notifications)), payload);
  return { id: ref.id, ...payload };
}

export const platformData = {
  collections: PLATFORM_COLLECTIONS,
  getUnifiedExamResults,
  listenUnifiedStudentMessages,
  writePlatformNotification,
  getPaginatedCollection,
  getStudentsPage,
  getResultsPage,
  getMessagesPage,
  normalizeResult,
  normalizeProgress,
  normalizeSubscription,
  normalizeStudentId,
};

export default platformData;
