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

const ADMIN_PERMISSION_ALIASES = {
  all: ['all', 'owner', 'super_admin'],
  manage_users: ['manage_users', 'users', 'students'],
  manage_subscriptions: ['manage_subscriptions', 'subscriptions', 'payments', 'manage_payments'],
  manage_payments: ['manage_payments', 'payments', 'manage_subscriptions'],
  manage_exams: ['manage_exams', 'exams', 'results', 'question_bank'],
  manage_content: ['manage_content', 'content', 'courses', 'lessons'],
  manage_notifications: ['manage_notifications', 'notifications', 'messages'],
  manage_support: ['manage_support', 'support', 'messages'],
  manage_system: ['manage_system', 'system', 'migration', 'audit'],
  manage_homework: ['manage_homework', 'homework', 'assignments']
};

function normalizePermissions(adminData) {
  const raw = Array.isArray(adminData?.permissions) ? adminData.permissions : [];
  const role = adminData?.role ? [adminData.role] : [];
  const adminRole = adminData?.adminRole ? [adminData.adminRole] : [];
  return new Set([...raw, ...role, ...adminRole].map((item) => String(item || '').trim()).filter(Boolean));
}

function hasAdminPermission(adminData, permission) {
  const permissions = normalizePermissions(adminData);
  if (ADMIN_PERMISSION_ALIASES.all.some((key) => permissions.has(key))) return true;
  const aliases = ADMIN_PERMISSION_ALIASES[permission] || [permission];
  return aliases.some((key) => permissions.has(key));
}

export async function assertAdminRequest(req, requiredPermission = null) {
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

  if (requiredPermission && !hasAdminPermission(adminData, requiredPermission)) {
    const error = new Error('لا تملك الصلاحية المطلوبة لتنفيذ هذه العملية.');
    error.statusCode = 403;
    throw error;
  }

  return {
    uid,
    email: adminData.email || decoded.email || '',
    permissions: Array.from(normalizePermissions(adminData))
  };
}


export async function assertAuthenticatedRequest(req) {
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

  const [userSnap, adminSnap] = await Promise.all([
    firebaseAdmin.firestore().collection('users').doc(uid).get(),
    firebaseAdmin.firestore().collection('admins').doc(uid).get()
  ]);

  const userData = userSnap.exists ? userSnap.data() : null;
  const adminData = adminSnap.exists ? adminSnap.data() : null;
  const isAdmin = !!adminData && adminData.active === true && adminData.role === 'admin';
  const isActiveStudent = !!userData && userData.status !== 'blocked' && userData.status !== 'rejected' && !String(userData.status || '').startsWith('banned_all');

  if (!isAdmin && !isActiveStudent) {
    const error = new Error('هذا الحساب لا يملك صلاحية استخدام هذه الخدمة.');
    error.statusCode = 403;
    throw error;
  }

  return {
    uid,
    email: decoded.email || adminData?.email || userData?.email || '',
    role: isAdmin ? 'admin' : 'student',
    admin: isAdmin ? adminData : null,
    user: userData
  };
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
