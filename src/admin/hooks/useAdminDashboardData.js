import { useEffect, useState } from 'react';
import { subscribeAdminDashboardData } from '../services/adminDashboard.listeners';

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
    const subscriptions = subscribeAdminDashboardData({
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
    });

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
