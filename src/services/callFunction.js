import { httpsCallable } from 'firebase/functions';
import { auth, functions } from './firebase';

// Inside the Capacitor app relative /api paths hit the app's own bundle, so the deployed site is used.
const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
export const apiUrl = (path) => `${API_BASE}${path}`;

// These codes mean the Cloud Function isn't deployed or reachable, so the same handler is run on Vercel.
const FALLBACK_CODES = new Set(['functions/not-found', 'functions/internal', 'functions/unavailable', 'functions/unimplemented', 'functions/deadline-exceeded']);

const callViaApi = async (name, data) => {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : '';
  const response = await fetch(apiUrl('/api/callable'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ name, data }),
  });
  const body = await response.json().catch(() => null);
  if (!body) throw new Error('تعذر الوصول للسيرفر. تأكد من الاتصال وحاول مرة أخرى.');
  if (!response.ok || body.ok === false) {
    const error = new Error(body.message || 'فشل تنفيذ العملية من السيرفر.');
    error.code = body.code || 'internal';
    throw error;
  }
  return body.data;
};

export async function callFunction(name, data = {}) {
  try {
    const result = await httpsCallable(functions, name)(data);
    return result.data;
  } catch (error) {
    if (!FALLBACK_CODES.has(error?.code)) throw error;
    return callViaApi(name, data);
  }
}
