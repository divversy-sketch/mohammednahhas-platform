import { useEffect, useState } from 'react';
import { sendSystemNotification } from '@shared/core/platformShared.jsx';
import { subscribeStudentDashboardData } from '@features/student-dashboard/services/studentDashboard.listeners.js';

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

  const hasProfile = Boolean(userData);
  const uid = user?.uid;
  const email = user?.email;
  const grade = userData?.grade;

  // Listeners depend only on who the student is and their grade. Re-running on every
  // profile snapshot (lastLoginAt, deviceInfo...) used to tear down and re-read 11 collections.
  useEffect(() => {
    if (!hasProfile || !uid) return undefined;

    const urlParams = new URLSearchParams(window.location.search);
    const hwParam = urlParams.get('hw');
    if (hwParam) {
      setScanningHwId(hwParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const subscriptions = subscribeStudentDashboardData({
      user: { uid, email },
      userData: { grade },
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
        // Only alert for a notification the student has not been alerted about on this device.
        const key = `nahhas_last_notif_${uid}`;
        const latestId = latest?.id || `${latest?.title}-${latest?.text}`;
        let lastSeen = null;
        try { lastSeen = localStorage.getItem(key); } catch { /* storage blocked */ }
        if (lastSeen === latestId) return;
        try { localStorage.setItem(key, latestId); } catch { /* storage blocked */ }
        setHasNewNotif(true);
        if (lastSeen && latest?.text) sendSystemNotification(latest.title || 'تنبيه جديد', latest.text);
      }
    });

    return () => subscriptions.forEach((unsubscribe) => unsubscribe?.());
  }, [hasProfile, uid, email, grade, setScanningHwId]);

  useEffect(() => {
    if (!userData) return;
    setEditFormData({ name: userData?.name, phone: userData.phone, parentPhone: userData.parentPhone, grade: userData?.grade });
  }, [userData?.name, userData?.phone, userData?.parentPhone, userData?.grade, setEditFormData]); // eslint-disable-line react-hooks/exhaustive-deps

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
