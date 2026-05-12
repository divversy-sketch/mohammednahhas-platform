import { assertAdminRequest, getFirebaseAdmin, requirePost, requireString, sendApiError } from './_firebaseAdmin.js';

const COLLECTION_DELETE_RULES = [
  { collection: 'exam_results', fields: ['studentId', 'userId', 'uid'] },
  { collection: 'examResults', fields: ['studentId', 'userId', 'uid'] },
  { collection: 'homework_results', fields: ['studentId', 'userId', 'uid'] },
  { collection: 'assignment_submissions', fields: ['studentId', 'userId', 'uid'] },
  { collection: 'student_mistakes', fields: ['studentId', 'userId', 'uid'] },
  { collection: 'video_views', fields: ['userId', 'studentId', 'uid'] },
  { collection: 'video_notes', fields: ['userId', 'studentId', 'uid'] },
  { collection: 'enrollments', fields: ['userId', 'studentId', 'uid'] },
  { collection: 'lessonProgress', fields: ['userId', 'studentId', 'uid'] },
  { collection: 'lessonUnlockOverrides', fields: ['userId', 'studentId', 'uid'] },
  { collection: 'payment_requests', fields: ['userId', 'studentId', 'uid'] },
  { collection: 'password_reset_requests', fields: ['studentId', 'userId', 'uid'] },
  { collection: 'notifications', fields: ['userId', 'studentId', 'uid'] }
];

const chunk = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};

async function deleteDocumentRefs(db, refs) {
  let deleted = 0;
  for (const batchRefs of chunk(refs, 400)) {
    const batch = db.batch();
    batchRefs.forEach((ref) => batch.delete(ref));
    await batch.commit();
    deleted += batchRefs.length;
  }
  return deleted;
}

async function collectStudentRefs(db, studentId) {
  const refsByPath = new Map();

  for (const rule of COLLECTION_DELETE_RULES) {
    for (const field of rule.fields) {
      const snap = await db.collection(rule.collection).where(field, '==', studentId).get();
      snap.docs.forEach((docSnap) => refsByPath.set(docSnap.ref.path, docSnap.ref));
    }
  }

  // Documents with predictable ids like userId_courseId or userId_videoId.
  const prefixCollections = ['enrollments', 'lessonProgress', 'lessonUnlockOverrides', 'video_views', 'video_notes'];
  for (const collectionName of prefixCollections) {
    const snap = await db.collection(collectionName)
      .where('__name__', '>=', `${studentId}_`)
      .where('__name__', '<', `${studentId}_\uf8ff`)
      .get();
    snap.docs.forEach((docSnap) => refsByPath.set(docSnap.ref.path, docSnap.ref));
  }

  return Array.from(refsByPath.values());
}

export default async function handler(req, res) {
  try {
    requirePost(req);
    const adminUser = await assertAdminRequest(req, 'manage_users');
    const firebaseAdmin = getFirebaseAdmin();
    const db = firebaseAdmin.firestore();
    const fieldValue = firebaseAdmin.firestore.FieldValue;

    const studentId = requireString(req.body?.studentId, 'studentId');
    const archiveBeforeDelete = req.body?.archiveBeforeDelete !== false;
    const deleteRelatedData = req.body?.deleteRelatedData !== false;

    if (studentId === adminUser.uid) {
      const error = new Error('لا يمكن حذف حساب الأدمن الحالي. واضح إن الزرار سخن شوية 😄');
      error.statusCode = 400;
      throw error;
    }

    const userRef = db.collection('users').doc(studentId);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : null;

    if (!userSnap.exists) {
      const error = new Error('الطالب غير موجود في Firestore.');
      error.statusCode = 404;
      throw error;
    }

    if (userData?.role && userData.role !== 'student') {
      const error = new Error('هذا الحساب ليس طالبًا ولا يمكن حذفه من شاشة الطلاب.');
      error.statusCode = 400;
      throw error;
    }

    const relatedRefs = deleteRelatedData ? await collectStudentRefs(db, studentId) : [];

    if (archiveBeforeDelete) {
      await db.collection('deleted_users').doc(studentId).set({
        ...userData,
        originalUid: studentId,
        archivedFrom: 'users',
        deletedFromAuth: true,
        relatedDocsDeletedCount: relatedRefs.length,
        deletedAt: fieldValue.serverTimestamp(),
        deletedBy: adminUser.uid,
        deletedByEmail: adminUser.email || ''
      }, { merge: true });
    }

    let authDeleted = false;
    let authWasMissing = false;
    try {
      await firebaseAdmin.auth().deleteUser(studentId);
      authDeleted = true;
    } catch (authError) {
      if (authError?.code === 'auth/user-not-found') {
        authWasMissing = true;
      } else {
        throw authError;
      }
    }

    const relatedDeletedCount = await deleteDocumentRefs(db, relatedRefs);
    await userRef.delete();

    await db.collection('admin_audit_logs').add({
      action: 'adminDeleteStudent',
      adminUid: adminUser.uid,
      adminEmail: adminUser.email || '',
      studentId,
      studentEmail: userData?.email || '',
      studentName: userData?.name || '',
      authDeleted,
      authWasMissing,
      archiveBeforeDelete,
      deleteRelatedData,
      relatedDeletedCount,
      source: 'vercel_api',
      createdAt: fieldValue.serverTimestamp()
    });

    return res.status(200).json({
      ok: true,
      studentId,
      authDeleted,
      authWasMissing,
      firestoreDeleted: true,
      relatedDeletedCount,
      archived: archiveBeforeDelete
    });
  } catch (error) {
    return sendApiError(res, error);
  }
}
