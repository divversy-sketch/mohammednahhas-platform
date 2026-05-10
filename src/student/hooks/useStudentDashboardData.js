import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { sendSystemNotification } from '../../shared/core/platformShared.jsx';

const mapDocs = (snapshot) => snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
const sortBySubmittedAtDesc = (rows) => rows.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
const sortByCreatedAtDesc = (rows) => rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
const sortByTimestampDesc = (rows) => rows.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

export function useStudentDashboardData({ user, userData, setScanningHwId, setEditFormData }) {
  const [content, setContent] = useState([]);
  const [exams, setExams] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [hwResults, setHwResults] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [videoViews, setVideoViews] = useState([]);
  const [mistakes, setMistakes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [hasNewNotif, setHasNewNotif] = useState(false);

  useEffect(() => {
    if (!userData || !user?.uid) return undefined;

    const urlParams = new URLSearchParams(window.location.search);
    const hwParam = urlParams.get('hw');
    if (hwParam) {
      setScanningHwId(hwParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const subscriptions = [
      onSnapshot(query(collection(db, 'content'), where('grade', '==', userData?.grade)), (snapshot) => {
        const allContent = mapDocs(snapshot);
        const visibleContent = allContent.filter((item) => !item.allowedEmails || item.allowedEmails.length === 0 || item.allowedEmails.includes(user.email));
        setContent(visibleContent);
      }, (error) => { console.warn('content listener blocked:', error?.message); setContent([]); }),

      onSnapshot(query(collection(db, 'exams'), where('grade', '==', userData?.grade)), (snapshot) => setExams(mapDocs(snapshot)), (error) => { console.warn('exams listener blocked:', error?.message); setExams([]); }),

      onSnapshot(query(collection(db, 'exam_results'), where('studentId', '==', user.uid)), (snapshot) => setExamResults(sortBySubmittedAtDesc(mapDocs(snapshot))), (error) => { console.warn('exam_results listener blocked:', error?.message); setExamResults([]); }),

      onSnapshot(query(collection(db, 'homework_results'), where('studentId', '==', user.uid)), (snapshot) => setHwResults(sortBySubmittedAtDesc(mapDocs(snapshot))), (error) => { console.warn('homework_results listener blocked:', error?.message); setHwResults([]); }),

      onSnapshot(query(collection(db, 'student_mistakes'), where('userId', '==', user.uid)), (snapshot) => setMistakes(sortByTimestampDesc(mapDocs(snapshot))), (error) => { console.warn('student_mistakes listener blocked:', error?.message); setMistakes([]); }),

      onSnapshot(query(collection(db, 'notifications'), where('grade', 'in', ['all', userData?.grade]), limit(10)), (snapshot) => {
        const newNotifs = sortByCreatedAtDesc(mapDocs(snapshot));
        setNotifications(newNotifs);
        if (newNotifs.length > 0) {
          setHasNewNotif(true);
          const latest = newNotifs[0];
          if (latest.text) sendSystemNotification(latest.title || 'تنبيه جديد 🔔', latest.text);
        }
      }, (error) => { console.warn('notifications listener blocked:', error?.message); setNotifications([]); }),

      onSnapshot(query(collection(db, 'assignments'), where('grade', '==', userData?.grade)), (snapshot) => setAssignments(sortByCreatedAtDesc(mapDocs(snapshot))), (error) => { console.warn('assignments listener blocked:', error?.message); setAssignments([]); }),

      onSnapshot(query(collection(db, 'assignment_submissions'), where('studentId', '==', user.uid)), (snapshot) => setAssignmentSubmissions(sortBySubmittedAtDesc(mapDocs(snapshot))), (error) => { console.warn('assignment_submissions listener blocked:', error?.message); setAssignmentSubmissions([]); }),

      onSnapshot(query(collection(db, 'video_views'), where('userId', '==', user.uid)), (snapshot) => setVideoViews(mapDocs(snapshot)), (error) => { console.warn('video_views listener blocked:', error?.message); setVideoViews([]); })
    ];

    setEditFormData({ name: userData?.name, phone: userData.phone, parentPhone: userData.parentPhone, grade: userData?.grade });

    return () => subscriptions.forEach((unsubscribe) => unsubscribe?.());
  }, [userData, user, setScanningHwId, setEditFormData]);

  return {
    content,
    exams,
    examResults,
    hwResults,
    assignments,
    assignmentSubmissions,
    videoViews,
    mistakes,
    notifications,
    hasNewNotif,
    setContent,
    setExams,
    setExamResults,
    setHwResults,
    setAssignments,
    setAssignmentSubmissions,
    setVideoViews,
    setMistakes,
    setNotifications,
    setHasNewNotif
  };
}
