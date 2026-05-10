import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLLECTIONS } from '../../config/collections';
import { mapDocs } from '../../shared/firebase/firestoreMaps';

export function subscribeAdminDashboardData(handlers) {
  return [
    onSnapshot(query(collection(db, COLLECTIONS.USERS), where('status', '==', 'pending')), (snapshot) => handlers.setPendingUsers(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.USERS), where('status', 'in', ['active', 'banned_cheating', 'banned_all', 'banned_exam', 'banned_content', 'rejected'])), (snapshot) => handlers.setActiveUsersList(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.CONTENT), orderBy('createdAt', 'desc')), (snapshot) => handlers.setContentList(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.MESSAGES), orderBy('createdAt', 'desc')), (snapshot) => handlers.setMessagesList(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.EXAMS), orderBy('createdAt', 'desc')), (snapshot) => handlers.setExamsList(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.EXAM_RESULTS), orderBy('submittedAt', 'desc')), (snapshot) => handlers.setExamResults(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.ANNOUNCEMENTS), orderBy('createdAt', 'desc')), (snapshot) => handlers.setAnnouncements(mapDocs(snapshot))),
    onSnapshot(collection(db, COLLECTIONS.QUOTES), (snapshot) => handlers.setQuotesList(mapDocs(snapshot))),
    onSnapshot(collection(db, COLLECTIONS.SMART_HOMEWORKS), (snapshot) => handlers.setSmartHomeworks(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.HOMEWORK_RESULTS), orderBy('submittedAt', 'desc')), (snapshot) => handlers.setHwResults(mapDocs(snapshot))),
    onSnapshot(query(collection(db, COLLECTIONS.SUBSCRIPTION_CODES), orderBy('createdAt', 'desc')), (snapshot) => handlers.setSubscriptionCodes(mapDocs(snapshot)))
  ];
}
