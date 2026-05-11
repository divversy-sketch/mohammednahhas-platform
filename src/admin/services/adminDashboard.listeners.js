import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLLECTIONS } from '../../config/collections';
import { mapDocs } from '../../shared/firebase/firestoreMaps';
import { normalizeResult } from '../../services/platformData';

export function subscribeAdminDashboardData(handlers) {
  const examResultBuckets = { canonical: [], legacy: [] };
  const setUnifiedExamResults = () => {
    const byKey = new Map();
    [...examResultBuckets.canonical, ...examResultBuckets.legacy].forEach((row) => byKey.set(`${row.sourceCollection}:${row.id}`, row));
    handlers.setExamResults([...byKey.values()].sort((a, b) => {
      const at = a.submittedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
      const bt = b.submittedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
      return bt - at;
    }));
  };
  return [
    onSnapshot(query(collection(db, COLLECTIONS.USERS), where('status', '==', 'pending')), (snapshot) => handlers.setPendingUsers(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.USERS), where('status', 'in', ['active', 'banned_cheating', 'banned_all', 'banned_exam', 'banned_content', 'rejected'])), (snapshot) => handlers.setActiveUsersList(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.CONTENT), orderBy('createdAt', 'desc')), (snapshot) => handlers.setContentList(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.MESSAGES), orderBy('createdAt', 'desc')), (snapshot) => handlers.setMessagesList(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.EXAMS), orderBy('createdAt', 'desc')), (snapshot) => handlers.setExamsList(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.EXAM_RESULTS), orderBy('submittedAt', 'desc')), (snapshot) => { examResultBuckets.canonical = mapDocs(snapshot).map((row) => normalizeResult(row, COLLECTIONS.EXAM_RESULTS)); setUnifiedExamResults(); }),
    onSnapshot(query(collection(db, COLLECTIONS.LEGACY_EXAM_RESULTS), orderBy('submittedAt', 'desc')), (snapshot) => { examResultBuckets.legacy = mapDocs(snapshot).map((row) => normalizeResult(row, COLLECTIONS.LEGACY_EXAM_RESULTS)); setUnifiedExamResults(); }),
    onSnapshot(query(collection(db, COLLECTIONS.ANNOUNCEMENTS), orderBy('createdAt', 'desc')), (snapshot) => handlers.setAnnouncements(mapDocs(snapshot))),
    onSnapshot(collection(db, COLLECTIONS.QUOTES), (snapshot) => handlers.setQuotesList(mapDocs(snapshot))),
    onSnapshot(collection(db, COLLECTIONS.SMART_HOMEWORKS), (snapshot) => handlers.setSmartHomeworks(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.HOMEWORK_RESULTS), orderBy('submittedAt', 'desc')), (snapshot) => handlers.setHwResults(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.SUBSCRIPTION_CODES), orderBy('createdAt', 'desc')), (snapshot) => handlers.setSubscriptionCodes(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.ASSIGNMENTS), orderBy('createdAt', 'desc')), (snapshot) => handlers.setAssignments?.(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.ASSIGNMENT_SUBMISSIONS), orderBy('submittedAt', 'desc')), (snapshot) => handlers.setAssignmentSubmissions?.(mapDocs(snapshot))),
    onSnapshot(collection(db, COLLECTIONS.STUDENT_MISTAKES), (snapshot) => handlers.setMistakes?.(mapDocs(snapshot))),
    onSnapshot(collection(db, COLLECTIONS.VIDEO_VIEWS), (snapshot) => handlers.setVideoViews?.(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.PASSWORD_RESET_REQUESTS), orderBy('createdAt', 'desc')), (snapshot) => handlers.setPasswordResetRequests?.(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.EXAM_ACCESS_OVERRIDES), orderBy('createdAt', 'desc')), (snapshot) => handlers.setExamAccessOverrides?.(mapDocs(snapshot)))
  ];
}
