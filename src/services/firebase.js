import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

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
export const functions = getFunctions(app, 'us-central1');

// Push notifications are intentionally paused for now.
// Firestore in-app notifications remain available inside the platform.
export const FIREBASE_VAPID_KEY = '';
export const getBrowserMessaging = async () => null;
export const savePushTokenForUser = async () => null;
export const setupForegroundPushListener = async () => () => {};


export async function initializeFirebaseAppCheck() {
  if (!import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY) {
    if (import.meta.env.PROD) console.warn('App Check disabled: VITE_RECAPTCHA_V3_SITE_KEY is missing.');
    return null;
  }

  try {
    const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check');
    return initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    console.warn('App Check init skipped:', error);
    return null;
  }
}
