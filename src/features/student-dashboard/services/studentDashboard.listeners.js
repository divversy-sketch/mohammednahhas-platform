import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@services/firebase';
import { COLLECTIONS } from '@config/collections';
import { mapDocs, sortByCreatedAtDesc, sortBySubmittedAtDesc, sortByTimestampDesc } from '@shared/firebase/firestoreMaps';
import { normalizeResult } from '@services/platformData';

const emptyOnBlocked = (label, setter) => (error) => {
  console.warn(`${label} listener blocked:`, error?.message);
  setter([]);
};

export function subscribeStudentDashboardData({ user, userData, handlers, onLatestNotification }) {
  const examResultBuckets = { canonical: [], legacy: [] };
  const setUnifiedStudentResults = () => {
    const rows = [...examResultBuckets.canonical, ...examResultBuckets.legacy];
    handlers.setExamResults(sortBySubmittedAtDesc(rows));
  };
  return [
    onSnapshot(query(collection(db, COLLECTIONS.CONTENT), where('grade', '==', userData?.grade), limit(300)), (snapshot) => {
      const allContent = mapDocs(snapshot);
      const visibleContent = allContent.filter((item) => !item.allowedEmails || item.allowedEmails.length === 0 || item.allowedEmails.includes(user.email));
      handlers.setContent(visibleContent);
    }, emptyOnBlocked('content', handlers.setContent)),

    onSnapshot(query(collection(db, COLLECTIONS.EXAMS), where('grade', '==', userData?.grade), limit(200)), (snapshot) => handlers.setExams(mapDocs(snapshot)), emptyOnBlocked('exams', handlers.setExams)),

    onSnapshot(query(collection(db, COLLECTIONS.EXAM_RESULTS), where('studentId', '==', user.uid), limit(300)), (snapshot) => { examResultBuckets.canonical = mapDocs(snapshot).map((row) => normalizeResult(row, COLLECTIONS.EXAM_RESULTS)); setUnifiedStudentResults(); }, emptyOnBlocked('exam_results', handlers.setExamResults)),

    onSnapshot(query(collection(db, COLLECTIONS.LEGACY_EXAM_RESULTS), where('userId', '==', user.uid), limit(300)), (snapshot) => { examResultBuckets.legacy = mapDocs(snapshot).map((row) => normalizeResult(row, COLLECTIONS.LEGACY_EXAM_RESULTS)); setUnifiedStudentResults(); }, emptyOnBlocked('legacy_exam_results', handlers.setExamResults)),

    onSnapshot(query(collection(db, COLLECTIONS.HOMEWORK_RESULTS), where('studentId', '==', user.uid), limit(300)), (snapshot) => handlers.setHwResults(sortBySubmittedAtDesc(mapDocs(snapshot))), emptyOnBlocked('homework_results', handlers.setHwResults)),

    onSnapshot(query(collection(db, COLLECTIONS.STUDENT_MISTAKES), where('userId', '==', user.uid), limit(300)), (snapshot) => handlers.setMistakes(sortByTimestampDesc(mapDocs(snapshot))), emptyOnBlocked('student_mistakes', handlers.setMistakes)),

    onSnapshot(query(collection(db, COLLECTIONS.NOTIFICATIONS), where('grade', 'in', ['all', userData?.grade]), limit(10)), (snapshot) => {
      const newNotifs = sortByCreatedAtDesc(mapDocs(snapshot));
      handlers.setNotifications(newNotifs);
      if (newNotifs.length > 0) onLatestNotification?.(newNotifs[0]);
    }, emptyOnBlocked('notifications', handlers.setNotifications)),

    onSnapshot(query(collection(db, COLLECTIONS.ASSIGNMENTS), where('grade', '==', userData?.grade), limit(200)), (snapshot) => handlers.setAssignments(sortByCreatedAtDesc(mapDocs(snapshot))), emptyOnBlocked('assignments', handlers.setAssignments)),

    onSnapshot(query(collection(db, COLLECTIONS.ASSIGNMENT_SUBMISSIONS), where('studentId', '==', user.uid), limit(300)), (snapshot) => handlers.setAssignmentSubmissions(sortBySubmittedAtDesc(mapDocs(snapshot))), emptyOnBlocked('assignment_submissions', handlers.setAssignmentSubmissions)),

    onSnapshot(query(collection(db, COLLECTIONS.VIDEO_VIEWS), where('userId', '==', user.uid), limit(300)), (snapshot) => handlers.setVideoViews(mapDocs(snapshot)), emptyOnBlocked('video_views', handlers.setVideoViews)),

    onSnapshot(query(collection(db, COLLECTIONS.EXAM_ACCESS_OVERRIDES), where('studentId', '==', user.uid), limit(200)), (snapshot) => handlers.setExamAccessOverrides?.(mapDocs(snapshot)), emptyOnBlocked('exam_access_overrides', handlers.setExamAccessOverrides || (() => {})))
  ];
}
