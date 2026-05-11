import { useEffect, useState } from 'react';
import { sendSystemNotification } from '../../shared/core/platformShared.jsx';
import { subscribeStudentDashboardData } from '../services/studentDashboard.listeners';

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
  const [examAccessOverrides, setExamAccessOverrides] = useState([]);

  useEffect(() => {
    if (!userData || !user?.uid) return undefined;

    const urlParams = new URLSearchParams(window.location.search);
    const hwParam = urlParams.get('hw');
    if (hwParam) {
      setScanningHwId(hwParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const subscriptions = subscribeStudentDashboardData({
      user,
      userData,
      handlers: {
        setContent,
        setExams,
        setExamResults,
        setHwResults,
        setAssignments,
        setAssignmentSubmissions,
        setVideoViews,
        setMistakes,
        setNotifications,
        setExamAccessOverrides
      },
      onLatestNotification: (latest) => {
        setHasNewNotif(true);
        if (latest?.text) sendSystemNotification(latest.title || 'تنبيه جديد 🔔', latest.text);
      }
    });

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
    examAccessOverrides,
    setContent,
    setExams,
    setExamResults,
    setHwResults,
    setAssignments,
    setAssignmentSubmissions,
    setVideoViews,
    setMistakes,
    setNotifications,
    setHasNewNotif,
    setExamAccessOverrides
  };
}
