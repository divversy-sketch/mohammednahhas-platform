import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '@fontsource/almarai/400.css';
import '@fontsource/almarai/700.css';
import '@fontsource/almarai/800.css';
import '@fontsource/changa/600.css';
import '@fontsource/changa/700.css';
import '@fontsource/changa/800.css';
import './index.css';
import './styles/v2-redesign.css';
import './v2/styles/index.css';
import { startDeviceWatcher } from './v2/device/device.js';
import { loadNativePlugins } from './v2/device/native.js';
import { startPrefs } from './v2/prefs.js';
import { registerPWAUpdate } from './pwaUpdate.js';
import { installGlobalErrorLogger } from './services/monitoring/errorLogger.js';

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

// v2 design: device form/platform and display preferences go on <html> before the first paint.
document.documentElement.dataset.nx = '2';
startDeviceWatcher();
startPrefs();
loadNativePlugins().then(startPrefs);
import('./v2/platformSkin.js').then((m) => m.watchPlatformSkin()).catch(() => {});

const root = ReactDOM.createRoot(document.getElementById('root'));
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('nxPreview')) {
  // dev-only screen previews with sample data
  const which = new URLSearchParams(window.location.search).get('nxPreview');
  Promise.all([({ review: () => import('./v2/dev/ReviewPreview.jsx'), video: () => import('./v2/dev/VideoPreview.jsx'), admin: () => import('./v2/dev/AdminPreview.jsx'), exam: () => import('./v2/dev/ExamPreview.jsx'), landing: () => import('./v2/public/LandingV2.jsx'), auth: () => import('./shared/platformParts/AuthPage.jsx') }[which] || (() => import('./v2/dev/StudentPreview.jsx')))(), import('./v2/ui/Overlays.jsx')]).then(([{ default: Preview }, { NxToastCenter, NxPromptCenter }]) => {
    root.render(<><NxToastCenter /><NxPromptCenter /><Preview /></>);
  });
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

registerPWAUpdate()