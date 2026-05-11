import { assertAdminRequest, getFirebaseAdmin, requirePost, requireString, sendApiError } from './_firebaseAdmin.js';

export default async function handler(req, res) {
  try {
    requirePost(req);
    const adminUser = await assertAdminRequest(req);
    const firebaseAdmin = getFirebaseAdmin();
    const db = firebaseAdmin.firestore();

    const studentId = requireString(req.body?.studentId, 'studentId');
    const newPassword = requireString(req.body?.newPassword, 'newPassword');
    const requestId = typeof req.body?.requestId === 'string' ? req.body.requestId.trim() : '';

    if (newPassword.length < 8) {
      const error = new Error('كلمة السر يجب ألا تقل عن 8 حروف/أرقام.');
      error.statusCode = 400;
      throw error;
    }

    const userRef = db.collection('users').doc(studentId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      const error = new Error('الطالب غير موجود في قاعدة البيانات.');
      error.statusCode = 404;
      throw error;
    }

    await firebaseAdmin.auth().updateUser(studentId, { password: newPassword });

    await userRef.set({
      passwordLastChangedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      passwordLastChangedBy: adminUser.uid,
      passwordResetRequired: false,
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      updatedBy: adminUser.uid
    }, { merge: true });

    if (requestId) {
      await db.collection('password_reset_requests').doc(requestId).set({
        status: 'completed',
        studentId,
        completedBy: adminUser.uid,
        completedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    await db.collection('admin_audit_logs').add({
      action: 'adminSetStudentPassword',
      adminUid: adminUser.uid,
      studentId,
      requestId: requestId || null,
      source: 'vercel_api',
      createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({ ok: true, studentId });
  } catch (error) {
    return sendApiError(res, error);
  }
}
