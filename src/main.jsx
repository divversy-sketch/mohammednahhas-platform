import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './styles/v2-redesign/index.css';
import { registerPWAUpdate } from './pwaUpdate.js';
import { installGlobalErrorLogger } from './services/monitoring/errorLogger.js';

import { initializeFirebaseAppCheck } from './services/firebase.js';

initializeFirebaseAppCheck();

installGlobalErrorLogger();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

registerPWAUpdate()