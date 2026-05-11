import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { registerPWAUpdate } from './pwaUpdate.js';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

if (import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    })
  } catch (error) {
    console.warn('App Check init skipped:', error)
  }
} else if (import.meta.env.PROD) {
  console.warn('App Check disabled: VITE_RECAPTCHA_V3_SITE_KEY is missing.')
}

installGlobalErrorLogger();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

registerPWAUpdate()