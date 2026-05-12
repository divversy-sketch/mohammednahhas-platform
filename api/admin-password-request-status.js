import { assertAdminRequest, getFirebaseAdmin, requirePost, requireString, sendApiError } from './_firebaseAdmin.js';

export default async function handler(req, res) {
  try {
    requirePost(req);
    const adminUser = await assertAdminRequest(req, 'manage_users');
    const firebaseAdmin = getFirebaseAdmin();
    const db = firebaseAdmin.firestore();

    const requestId = requireString(req.body?.requestId, 'requestId');
    const status = requireString(req.body?.status, 'status');
    const allowed = ['pending', 'reviewing', 'completed', 'rejected'];

    if (!allowed.includes(status)) {
      const error = new Error('حالة الطلب غير صحيحة.');
      error.statusCode = 400;
      throw error;
    }

    await db.collection('password_reset_requests').doc(requestId).set({
      status,
      reviewedBy: adminUser.uid,
      reviewedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await db.collection('admin_audit_logs').add({
      action: 'updatePasswordResetRequestStatus',
      adminUid: adminUser.uid,
      requestId,
      status,
      source: 'vercel_api',
      createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({ ok: true, requestId, status });
  } catch (error) {
    return sendApiError(res, error);
  }
}
