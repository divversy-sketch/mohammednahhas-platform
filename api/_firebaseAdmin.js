import admin from 'firebase-admin';

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

export function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const projectId = requiredEnv('FIREBASE_PROJECT_ID');
    const clientEmail = requiredEnv('FIREBASE_CLIENT_EMAIL');
    const privateKey = requiredEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
  }
  return admin;
}

export async function assertAdminRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = String(authHeader).startsWith('Bearer ') ? String(authHeader).slice(7) : '';

  if (!token) {
    const error = new Error('يجب تسجيل الدخول أولاً.');
    error.statusCode = 401;
    throw error;
  }

  const firebaseAdmin = getFirebaseAdmin();
  const decoded = await firebaseAdmin.auth().verifyIdToken(token);
  const uid = decoded.uid;

  const adminSnap = await firebaseAdmin.firestore().collection('admins').doc(uid).get();
  const adminData = adminSnap.exists ? adminSnap.data() : null;

  if (!adminData || adminData.active !== true || adminData.role !== 'admin') {
    const error = new Error('هذا الحساب لا يملك صلاحية الإدارة.');
    error.statusCode = 403;
    throw error;
  }

  return { uid, email: adminData.email || decoded.email || '' };
}

export function requirePost(req) {
  if (req.method !== 'POST') {
    const error = new Error('Method not allowed');
    error.statusCode = 405;
    throw error;
  }
}

export function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    const error = new Error(`الحقل ${fieldName} مطلوب.`);
    error.statusCode = 400;
    throw error;
  }
  return value.trim();
}

export function sendApiError(res, error) {
  const statusCode = error?.statusCode || 500;
  return res.status(statusCode).json({
    ok: false,
    message: error?.message || 'حدث خطأ غير متوقع.'
  });
}
