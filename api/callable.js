// Runs the callable handlers from functions/index.js on Vercel, so every server action works
// even when the Firebase project has no deployed Cloud Functions (Spark plan, no Blaze).
// The client tries the real Cloud Function first and falls back here (src/services/callFunction.js).
import Module, { createRequire } from 'module';
import { getFirebaseAdmin, requirePost, requireString, sendApiError } from './_firebaseAdmin.js';

const require = createRequire(import.meta.url);

class HttpsError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

const STATUS = { 'invalid-argument': 400, 'failed-precondition': 400, 'out-of-range': 400, unauthenticated: 401, 'permission-denied': 403, 'not-found': 404, 'already-exists': 409, 'resource-exhausted': 429, unimplemented: 501, unavailable: 503 };

let handlers = null;

function loadHandlers() {
  if (handlers) return handlers;
  const realAdmin = getFirebaseAdmin();
  const noTrigger = () => null;
  const triggers = { onWrite: noTrigger, onCreate: noTrigger, onUpdate: noTrigger, onDelete: noTrigger, onRun: noTrigger };
  const builder = {};
  Object.assign(builder, {
    region: () => builder,
    runWith: () => builder,
    https: { onCall: (fn) => ({ __callable: fn }), onRequest: noTrigger, HttpsError },
    firestore: { document: () => triggers },
    pubsub: { schedule: () => ({ ...triggers, timeZone: () => triggers }) },
    auth: { user: () => triggers },
    config: () => ({}),
  });
  const fakeAdmin = new Proxy(realAdmin, { get: (target, key) => (key === 'initializeApp' ? () => target.app() : target[key]) });
  const originalLoad = Module._load;
  Module._load = function patchedLoad(request, ...rest) {
    if (request === 'firebase-functions' || request.startsWith('firebase-functions/')) return builder;
    if (request === 'firebase-admin') return fakeAdmin;
    return originalLoad.call(this, request, ...rest);
  };
  try {
    const mod = require('../functions/index.js');
    handlers = {};
    Object.entries(mod).forEach(([name, value]) => { if (value && typeof value.__callable === 'function') handlers[name] = value.__callable; });
  } finally {
    Module._load = originalLoad;
  }
  return handlers;
}

export default async function handler(req, res) {
  try {
    requirePost(req);
    const name = requireString(req.body?.name, 'name');
    const fn = loadHandlers()[name];
    if (!fn) return res.status(404).json({ ok: false, code: 'not-found', message: 'هذه العملية غير متاحة على السيرفر.' });

    const header = String(req.headers.authorization || req.headers.Authorization || '');
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    let auth = null;
    if (token) {
      const decoded = await getFirebaseAdmin().auth().verifyIdToken(token);
      auth = { uid: decoded.uid, token: decoded };
    }
    const data = await fn(req.body?.data || {}, { auth, rawRequest: req });
    return res.status(200).json({ ok: true, data: data ?? null });
  } catch (error) {
    if (error instanceof HttpsError || error?.code) {
      return res.status(STATUS[error.code] || 500).json({ ok: false, code: error.code, message: error.message || 'حدث خطأ غير متوقع.' });
    }
    return sendApiError(res, error);
  }
}
