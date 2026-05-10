import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';

const mapDocs = (snapshot) => snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

export function useAdminDashboardData() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsersList, setActiveUsersList] = useState([]);
  const [contentList, setContentList] = useState([]);
  const [messagesList, setMessagesList] = useState([]);
  const [examsList, setExamsList] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [quotesList, setQuotesList] = useState([]);
  const [smartHomeworks, setSmartHomeworks] = useState([]);
  const [hwResults, setHwResults] = useState([]);
  const [subscriptionCodes, setSubscriptionCodes] = useState([]);

  useEffect(() => {
    const subscriptions = [
      onSnapshot(query(collection(db, 'users'), where('status', '==', 'pending')), (snapshot) => setPendingUsers(mapDocs(snapshot))),
      onSnapshot(query(collection(db, 'users'), where('status', 'in', ['active', 'banned_cheating', 'banned_all', 'banned_exam', 'banned_content', 'rejected'])), (snapshot) => setActiveUsersList(mapDocs(snapshot))),
      onSnapshot(query(collection(db, 'content'), orderBy('createdAt', 'desc')), (snapshot) => setContentList(mapDocs(snapshot))),
      onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'desc')), (snapshot) => setMessagesList(mapDocs(snapshot))),
      onSnapshot(query(collection(db, 'exams'), orderBy('createdAt', 'desc')), (snapshot) => setExamsList(mapDocs(snapshot))),
      onSnapshot(query(collection(db, 'exam_results'), orderBy('submittedAt', 'desc')), (snapshot) => setExamResults(mapDocs(snapshot))),
      onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), (snapshot) => setAnnouncements(mapDocs(snapshot))),
      onSnapshot(collection(db, 'quotes'), (snapshot) => setQuotesList(mapDocs(snapshot))),
      onSnapshot(collection(db, 'smart_homeworks'), (snapshot) => setSmartHomeworks(mapDocs(snapshot))),
      onSnapshot(query(collection(db, 'homework_results'), orderBy('submittedAt', 'desc')), (snapshot) => setHwResults(mapDocs(snapshot))),
      onSnapshot(query(collection(db, 'subscription_codes'), orderBy('createdAt', 'desc')), (snapshot) => setSubscriptionCodes(mapDocs(snapshot)))
    ];

    return () => subscriptions.forEach((unsubscribe) => unsubscribe?.());
  }, []);

  return {
    pendingUsers,
    activeUsersList,
    contentList,
    messagesList,
    examsList,
    examResults,
    announcements,
    quotesList,
    smartHomeworks,
    hwResults,
    subscriptionCodes,
    setPendingUsers,
    setActiveUsersList,
    setContentList,
    setMessagesList,
    setExamsList,
    setExamResults,
    setAnnouncements,
    setQuotesList,
    setSmartHomeworks,
    setHwResults,
    setSubscriptionCodes
  };
}
