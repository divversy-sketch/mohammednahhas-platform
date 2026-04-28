import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported as isMessagingSupported } from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const FIREBASE_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

export const getBrowserMessaging = async () => {
  try {
    const supported = await isMessagingSupported();
    if (!supported) return null;
    return getMessaging(app);
  } catch (error) {
    console.warn('Firebase Messaging is not available:', error?.message);
    return null;
  }
};

export const savePushTokenForUser = async (user, userData = {}) => {
  if (!user?.uid) throw new Error('لا يوجد مستخدم مسجل');
  if (!('Notification' in window)) throw new Error('المتصفح لا يدعم الإشعارات');
  if (!FIREBASE_VAPID_KEY) throw new Error('مفتاح VAPID غير موجود في إعدادات Vercel');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('لم يتم السماح بالإشعارات');

  const messaging = await getBrowserMessaging();
  if (!messaging) throw new Error('خدمة إشعارات Firebase غير متاحة على هذا الجهاز');

  const registration = await navigator.serviceWorker.ready;
  const token = await getToken(messaging, { vapidKey: FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) throw new Error('تعذر إنشاء رمز الإشعارات');

  const tokenId = `${user.uid}_${token.slice(-18).replace(/[^a-zA-Z0-9]/g, '')}`;
  await setDoc(doc(db, 'notification_tokens', tokenId), {
    token,
    userId: user.uid,
    userName: user.displayName || userData?.name || 'طالب',
    email: user.email || userData?.email || '',
    grade: userData?.grade || 'all',
    platform: navigator.platform || '',
    userAgent: navigator.userAgent || '',
    enabled: true,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  }, { merge: true });

  return token;
};

export const setupForegroundPushListener = async (onPayload) => {
  const messaging = await getBrowserMessaging();
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    onPayload?.(payload);
    const title = payload?.notification?.title || payload?.data?.title || 'تنبيه جديد';
    const body = payload?.notification?.body || payload?.data?.body || payload?.data?.text || '';
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' });
      }
    } catch (error) {
      console.warn('Foreground notification failed:', error?.message);
    }
  });
};
