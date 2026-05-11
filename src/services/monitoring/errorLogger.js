import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import { COLLECTIONS } from '../../config/collections.js';

const safe = (value, fallback = '') => {
  try {
    if (value == null) return fallback;
    if (typeof value === 'string') return value.slice(0, 1200);
    return JSON.stringify(value).slice(0, 1800);
  } catch {
    return fallback;
  }
};

export async function logSystemError(error, context = {}) {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, COLLECTIONS.SYSTEM_ERRORS), {
      message: safe(error?.message || error, 'unknown error'),
      stack: safe(error?.stack, ''),
      componentStack: safe(context.componentStack || context.info?.componentStack, ''),
      area: context.area || 'app',
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      userId: user?.uid || '',
      userEmail: user?.email || '',
      severity: context.severity || 'error',
      meta: context.meta || {},
      createdAt: serverTimestamp(),
    });
  } catch (loggingError) {
    console.warn('system error log failed:', loggingError?.message || loggingError);
  }
}

export async function logPerformanceMetric(metricName, valueMs, context = {}) {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, COLLECTIONS.PERFORMANCE_METRICS), {
      metricName,
      valueMs: Math.round(Number(valueMs) || 0),
      area: context.area || 'app',
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      userId: user?.uid || '',
      meta: context.meta || {},
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('performance metric log failed:', error?.message || error);
  }
}

export async function timedOperation(metricName, operation, context = {}) {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  try {
    return await operation();
  } finally {
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    logPerformanceMetric(metricName, end - start, context);
  }
}

export function installGlobalErrorLogger() {
  if (typeof window === 'undefined' || window.__nahhasErrorLoggerInstalled) return;
  window.__nahhasErrorLoggerInstalled = true;
  window.addEventListener('error', (event) => {
    logSystemError(event.error || event.message, { area: 'global', severity: 'error' });
  });
  window.addEventListener('unhandledrejection', (event) => {
    logSystemError(event.reason || 'Unhandled promise rejection', { area: 'promise', severity: 'error' });
  });
}
