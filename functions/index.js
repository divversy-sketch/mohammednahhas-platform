const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Sends push notifications when a new document is created in notifications.
 *
 * Expected notification document:
 * {
 *   title: "عنوان الإشعار",
 *   message: "نص الإشعار",
 *   target: "all" | "grade" | "user",
 *   grade: "3sec",          // required if target === "grade"
 *   userId: "USER_UID",     // required if target === "user"
 *   url: "/",               // optional
 *   createdAt: serverTimestamp()
 * }
 *
 * Tokens collection:
 * notification_tokens/{token}
 * {
 *   token,
 *   userId,
 *   userName,
 *   grade,
 *   createdAt,
 *   updatedAt,
 *   enabled: true
 * }
 */
exports.sendPushOnNotificationCreate = functions
  .region("us-central1")
  .firestore
  .document("notifications/{notificationId}")
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    const title = data.title || "منصة النحاس التعليمية";
    const body = data.message || data.body || "لديك إشعار جديد";
    const target = data.target || "all";
    const grade = data.grade || "";
    const userId = data.userId || "";
    const url = data.url || "/";

    let query = db.collection("notification_tokens").where("enabled", "==", true);

    if (target === "grade" && grade) {
      query = query.where("grade", "==", grade);
    }

    if (target === "user" && userId) {
      query = query.where("userId", "==", userId);
    }

    const tokenSnap = await query.get();
    const tokens = [];
    tokenSnap.forEach((doc) => {
      const row = doc.data();
      if (row.token) tokens.push(row.token);
    });

    if (tokens.length === 0) {
      console.log("No tokens for notification", context.params.notificationId);
      await snap.ref.set({
        pushStatus: "no_tokens",
        pushSentCount: 0,
        pushFailedCount: 0,
        pushProcessedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return null;
    }

    const message = {
      notification: {
        title,
        body
      },
      data: {
        notificationId: context.params.notificationId,
        target: String(target),
        url: String(url)
      },
      webpush: {
        notification: {
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          requireInteraction: false
        },
        fcmOptions: {
          link: url
        }
      },
      tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    const invalidTokens = [];
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const code = res.error && res.error.code;
        console.log("Push failed:", tokens[idx], code, res.error && res.error.message);
        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    await Promise.all(
      invalidTokens.map((token) =>
        db.collection("notification_tokens").doc(token).set({
          enabled: false,
          disabledAt: admin.firestore.FieldValue.serverTimestamp(),
          disabledReason: "invalid_or_unregistered"
        }, { merge: true })
      )
    );

    await snap.ref.set({
      pushStatus: "processed",
      pushSentCount: response.successCount,
      pushFailedCount: response.failureCount,
      pushProcessedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log("Push sent:", response.successCount, "failed:", response.failureCount);
    return null;
  });

/**
 * Optional callable test function.
 * You can call it from Firebase console / emulator later if needed.
 */
exports.pingPushFunctions = functions
  .region("us-central1")
  .https
  .onCall(async () => {
    return { ok: true, message: "Push functions are working" };
  });

// -----------------------------------------------------------------------------
// Secure admin-only operations
// -----------------------------------------------------------------------------

async function assertAdmin(context) {
  const uid = context.auth && context.auth.uid;
  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "يجب تسجيل الدخول أولاً.");
  }

  const adminSnap = await db.collection("admins").doc(uid).get();
  const adminData = adminSnap.exists ? adminSnap.data() : null;

  if (!adminData || adminData.active !== true || adminData.role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "هذا الحساب لا يملك صلاحية الإدارة.");
  }

  return { uid, email: adminData.email || (context.auth.token && context.auth.token.email) || "" };
}

function requireString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new functions.https.HttpsError("invalid-argument", `الحقل ${fieldName} مطلوب.`);
  }
  return value.trim();
}

function cleanObject(input, allowedKeys) {
  const out = {};
  allowedKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(input || {}, key)) {
      out[key] = input[key];
    }
  });
  return out;
}

exports.deleteStudentAccount = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const adminUser = await assertAdmin(context);
    const studentId = requireString(data && data.studentId, "studentId");

    if (studentId === adminUser.uid) {
      throw new functions.https.HttpsError("failed-precondition", "لا يمكن حذف حساب الأدمن الحالي.");
    }

    const batch = db.batch();
    batch.delete(db.collection("users").doc(studentId));

    const ownedCollections = [
      "notification_tokens",
      "payment_requests",
      "lessonProgress",
      "enrollments",
      "examResults",
      "attempts",
      "exam_results",
      "homework_results",
      "assignment_submissions",
      "video_views",
      "video_notes",
      "student_mistakes"
    ];

    for (const collectionName of ownedCollections) {
      const snap = await db.collection(collectionName).where("userId", "==", studentId).limit(300).get();
      snap.forEach((docSnap) => batch.delete(docSnap.ref));

      const studentSnap = await db.collection(collectionName).where("studentId", "==", studentId).limit(300).get();
      studentSnap.forEach((docSnap) => batch.delete(docSnap.ref));
    }

    await batch.commit();

    try {
      await admin.auth().deleteUser(studentId);
    } catch (error) {
      console.warn("Auth user delete skipped/failed:", studentId, error && error.message);
    }

    await db.collection("admin_audit_logs").add({
      action: "deleteStudentAccount",
      adminUid: adminUser.uid,
      studentId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { ok: true };
  });

exports.setStudentStatus = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const adminUser = await assertAdmin(context);
    const studentId = requireString(data && data.studentId, "studentId");
    const status = requireString(data && data.status, "status");
    const allowed = ["pending", "active", "blocked", "banned", "suspended"];

    if (!allowed.includes(status)) {
      throw new functions.https.HttpsError("invalid-argument", "حالة الطالب غير مسموحة.");
    }

    await db.collection("users").doc(studentId).set({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: adminUser.uid
    }, { merge: true });

    await db.collection("admin_audit_logs").add({
      action: "setStudentStatus",
      adminUid: adminUser.uid,
      studentId,
      status,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { ok: true, status };
  });

exports.createSubscriptionCode = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const adminUser = await assertAdmin(context);
    const code = requireString(data && data.code, "code").toUpperCase();
    const payload = cleanObject(data || {}, ["grade", "durationDays", "type", "note", "value"]);

    await db.collection("subscription_codes").doc(code).set({
      ...payload,
      code,
      isUsed: false,
      usedBy: null,
      usedAt: null,
      createdBy: adminUser.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: false });

    await db.collection("admin_audit_logs").add({
      action: "createSubscriptionCode",
      adminUid: adminUser.uid,
      code,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { ok: true, code };
  });

exports.approvePaymentRequest = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const adminUser = await assertAdmin(context);
    const requestId = requireString(data && data.requestId, "requestId");
    const durationDays = Number(data && data.durationDays ? data.durationDays : 30);

    if (!Number.isFinite(durationDays) || durationDays <= 0 || durationDays > 730) {
      throw new functions.https.HttpsError("invalid-argument", "مدة الاشتراك غير صحيحة.");
    }

    const requestRef = db.collection("payment_requests").doc(requestId);
    const requestSnap = await requestRef.get();
    if (!requestSnap.exists) {
      throw new functions.https.HttpsError("not-found", "طلب الدفع غير موجود.");
    }

    const requestData = requestSnap.data() || {};
    const userId = requestData.userId;
    if (!userId) {
      throw new functions.https.HttpsError("failed-precondition", "طلب الدفع لا يحتوي على userId.");
    }

    const expiry = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    await db.runTransaction(async (tx) => {
      tx.set(requestRef, {
        status: "approved",
        approvedBy: adminUser.uid,
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      tx.set(db.collection("users").doc(userId), {
        subscriptionStatus: "premium",
        subscriptionExpiry: admin.firestore.Timestamp.fromDate(expiry),
        status: "active",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: adminUser.uid
      }, { merge: true });
    });

    await db.collection("admin_audit_logs").add({
      action: "approvePaymentRequest",
      adminUid: adminUser.uid,
      requestId,
      userId,
      durationDays,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { ok: true, userId, durationDays };
  });

exports.deleteExam = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const adminUser = await assertAdmin(context);
    const examId = requireString(data && data.examId, "examId");

    await db.collection("exams").doc(examId).delete();
    await db.collection("admin_audit_logs").add({
      action: "deleteExam",
      adminUid: adminUser.uid,
      examId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { ok: true };
  });

exports.setExamPublishedState = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const adminUser = await assertAdmin(context);
    const examId = requireString(data && data.examId, "examId");
    const isPublished = Boolean(data && data.isPublished);

    await db.collection("exams").doc(examId).set({
      isPublished,
      status: isPublished ? "published" : "draft",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: adminUser.uid
    }, { merge: true });

    await db.collection("admin_audit_logs").add({
      action: "setExamPublishedState",
      adminUid: adminUser.uid,
      examId,
      isPublished,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { ok: true, examId, isPublished };
  });

exports.updateResultScore = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const adminUser = await assertAdmin(context);
    const resultId = requireString(data && data.resultId, "resultId");
    const allowed = [
      "score", "totalScore", "percentage", "status", "teacherNote", "feedback",
      "essayScore", "manualScore", "reviewed", "reviewedAt", "reviewedBy"
    ];
    const payload = cleanObject((data && data.payload) || {}, allowed);

    if (Object.keys(payload).length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "لا توجد بيانات صالحة للتحديث.");
    }

    payload.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    payload.updatedBy = adminUser.uid;
    if (payload.reviewed === true) {
      payload.reviewedAt = admin.firestore.FieldValue.serverTimestamp();
      payload.reviewedBy = adminUser.uid;
    }

    await db.collection("exam_results").doc(resultId).set(payload, { merge: true });

    await db.collection("admin_audit_logs").add({
      action: "updateResultScore",
      adminUid: adminUser.uid,
      resultId,
      changedKeys: Object.keys(payload).filter((key) => !["updatedAt", "updatedBy"].includes(key)),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { ok: true, resultId };
  });

exports.deleteAdminDocument = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const adminUser = await assertAdmin(context);
    const collectionName = requireString(data && data.collectionName, "collectionName");
    const docId = requireString(data && data.docId, "docId");
    const allowedCollections = [
      "messages", "announcements", "quotes", "content", "exam_results",
      "smart_homeworks", "student_mistakes", "subscription_codes"
    ];

    if (!allowedCollections.includes(collectionName)) {
      throw new functions.https.HttpsError("permission-denied", "لا يمكن حذف مستند من هذه المجموعة عبر هذه الدالة.");
    }

    await db.collection(collectionName).doc(docId).delete();
    await db.collection("admin_audit_logs").add({
      action: "deleteAdminDocument",
      adminUid: adminUser.uid,
      collectionName,
      docId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { ok: true, collectionName, docId };
  });

exports.rejectPaymentRequest = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const adminUser = await assertAdmin(context);
    const requestId = requireString(data && data.requestId, "requestId");
    const reason = typeof (data && data.reason) === "string" ? data.reason.trim() : "";

    await db.collection("payment_requests").doc(requestId).set({
      status: "rejected",
      rejectReason: reason || "rejected_by_admin",
      reviewedBy: adminUser.uid,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await db.collection("admin_audit_logs").add({
      action: "rejectPaymentRequest",
      adminUid: adminUser.uid,
      requestId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { ok: true, requestId };
  });
