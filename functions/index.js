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
    const allowed = ["pending", "active", "blocked", "banned", "suspended", "rejected", "banned_all", "banned_exam", "banned_content", "banned_cheating"];

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


exports.adminSetStudentPassword = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const adminUser = await assertAdmin(context);
    const studentId = requireString(data && data.studentId, "studentId");
    const newPassword = requireString(data && data.newPassword, "newPassword");
    const requestId = typeof (data && data.requestId) === "string" ? data.requestId.trim() : "";

    if (newPassword.length < 8) {
      throw new functions.https.HttpsError("invalid-argument", "كلمة السر يجب ألا تقل عن 8 حروف/أرقام.");
    }

    const userRef = db.collection("users").doc(studentId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new functions.https.HttpsError("not-found", "الطالب غير موجود في قاعدة البيانات.");
    }

    await admin.auth().updateUser(studentId, {
      password: newPassword
    });

    await userRef.set({
      passwordLastChangedAt: admin.firestore.FieldValue.serverTimestamp(),
      passwordLastChangedBy: adminUser.uid,
      passwordResetRequired: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: adminUser.uid
    }, { merge: true });

    if (requestId) {
      await db.collection("password_reset_requests").doc(requestId).set({
        status: "completed",
        studentId,
        completedBy: adminUser.uid,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    await db.collection("admin_audit_logs").add({
      action: "adminSetStudentPassword",
      adminUid: adminUser.uid,
      studentId,
      requestId: requestId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { ok: true, studentId };
  });

exports.updatePasswordResetRequestStatus = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const adminUser = await assertAdmin(context);
    const requestId = requireString(data && data.requestId, "requestId");
    const status = requireString(data && data.status, "status");
    const allowed = ["pending", "reviewing", "completed", "rejected"];
    if (!allowed.includes(status)) {
      throw new functions.https.HttpsError("invalid-argument", "حالة الطلب غير صحيحة.");
    }

    await db.collection("password_reset_requests").doc(requestId).set({
      status,
      reviewedBy: adminUser.uid,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await db.collection("admin_audit_logs").add({
      action: "updatePasswordResetRequestStatus",
      adminUid: adminUser.uid,
      requestId,
      status,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { ok: true, requestId, status };
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

    const batch = db.batch();
    batch.delete(db.collection("exams").doc(examId));

    // نظافة إضافية: حذف نتائج ومحاولات هذا الامتحان حتى لا يظهر للطلاب كأنه ما زال له محاولة قديمة.
    const relatedCollections = ["exam_results", "examResults", "attempts"];
    for (const collectionName of relatedCollections) {
      const snap = await db.collection(collectionName).where("examId", "==", examId).limit(450).get();
      snap.forEach((docSnap) => batch.delete(docSnap.ref));
    }

    await batch.commit();
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

// -----------------------------------------------------------------------------
// Smart QR Homework: secure grading through Cloud Function
// -----------------------------------------------------------------------------
function getGeminiKey() {
  const cfgKey = functions.config && functions.config().gemini && functions.config().gemini.key;
  return cfgKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "";
}

function cleanGeminiJson(text) {
  const raw = String(text || "").trim().replace(/```json/gi, "").replace(/```/g, "").trim();
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  const jsonText = first >= 0 && last >= first ? raw.slice(first, last + 1) : raw;
  return JSON.parse(jsonText);
}

function normalizeQuestionRows(result) {
  if (!Array.isArray(result.questions)) return [];
  return result.questions.map((q, index) => ({
    q: q.q || q.number || index + 1,
    studentAnswer: String(q.studentAnswer || q.student_answer || "").trim(),
    correctAnswer: String(q.correctAnswer || q.correct_answer || "").trim(),
    isCorrect: Boolean(q.isCorrect ?? q.correct ?? false),
    note: String(q.note || q.feedback || "").trim()
  }));
}

exports.correctSmartHomework = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const uid = context.auth && context.auth.uid;
    if (!uid) {
      throw new functions.https.HttpsError("unauthenticated", "يجب تسجيل الدخول أولاً.");
    }

    const homeworkId = requireString(data && data.homeworkId, "homeworkId");
    const imageBase64 = requireString(data && data.imageBase64, "imageBase64");
    const mimeType = typeof data.mimeType === "string" ? data.mimeType : "image/jpeg";

    if (imageBase64.length > 7 * 1024 * 1024) {
      throw new functions.https.HttpsError("invalid-argument", "حجم الصورة كبير. صوّر الصفحة من بعيد قليلاً أو قلل الجودة.");
    }

    const [homeworkSnap, userSnap, oldResultSnap, privateKeySnap] = await Promise.all([
      db.collection("smart_homeworks").doc(homeworkId).get(),
      db.collection("users").doc(uid).get(),
      db.collection("homework_results").doc(`${homeworkId}_${uid}`).get(),
      db.collection("smart_homeworks").doc(homeworkId).collection("private").doc("answerKey").get()
    ]);

    if (!homeworkSnap.exists) {
      throw new functions.https.HttpsError("not-found", "الواجب غير موجود.");
    }

    const homework = homeworkSnap.data() || {};
    const student = userSnap.exists ? userSnap.data() : {};
    const now = new Date();
    const startAt = homework.startAt ? new Date(homework.startAt) : null;
    const endAt = homework.endAt ? new Date(homework.endAt) : null;
    if (homework.status && homework.status !== "active") {
      throw new functions.https.HttpsError("failed-precondition", "هذا الواجب غير متاح حالياً.");
    }
    if (startAt && now < startAt) {
      throw new functions.https.HttpsError("failed-precondition", "هذا الواجب لم يبدأ بعد.");
    }
    if (endAt && now > endAt) {
      throw new functions.https.HttpsError("failed-precondition", "انتهى وقت تسليم هذا الواجب.");
    }
    if (homework.grade && homework.grade !== "all" && student.grade && homework.grade !== student.grade) {
      throw new functions.https.HttpsError("permission-denied", "هذا الواجب غير مخصص لمرحلتك.");
    }

    const oldAttempts = Number(oldResultSnap.exists ? (oldResultSnap.data().attempts || 1) : 0);
    const maxAttempts = Number(homework.maxAttempts || 1);
    if (oldResultSnap.exists && homework.allowResubmit !== true && oldAttempts >= 1) {
      throw new functions.https.HttpsError("failed-precondition", "تم تسليم هذا الواجب من قبل.");
    }
    if (oldAttempts >= maxAttempts) {
      throw new functions.https.HttpsError("failed-precondition", "انتهى عدد المحاولات المسموح بها.");
    }

    const answerKey = (privateKeySnap.exists && privateKeySnap.data().answerKey) || homework.answerKey || "";
    if (!answerKey) {
      throw new functions.https.HttpsError("failed-precondition", "نموذج الإجابة غير موجود. تواصل مع الأدمن.");
    }

    const apiKey = getGeminiKey();
    if (!apiKey) {
      throw new functions.https.HttpsError("failed-precondition", "لم يتم ضبط مفتاح Gemini في Cloud Functions.");
    }

    const promptText = `أنت مصحح واجبات لغة عربية. صحح صورة إجابات الطالب بناءً على نموذج الإجابة التالي فقط: ${answerKey}\n\nالمطلوب: أعد JSON فقط بدون أي شرح خارج JSON بالشكل التالي:\n{\"score\": number, \"total\": number, \"feedback\": \"تعليق مختصر بالعربية\", \"questions\": [{\"q\": 1, \"studentAnswer\": \"أ\", \"correctAnswer\": \"ب\", \"isCorrect\": false, \"note\": \"سبب مختصر\"}]}\nلو الصورة غير واضحة اجعل score=0 واكتب في feedback أن الصورة غير واضحة.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: promptText },
            { inlineData: { mimeType, data: imageBase64 } }
          ]
        }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Gemini API error", response.status, body.slice(0, 600));
      throw new functions.https.HttpsError("internal", "فشل الاتصال بخدمة التصحيح.");
    }

    const modelData = await response.json();
    const text = modelData.candidates && modelData.candidates[0] && modelData.candidates[0].content && modelData.candidates[0].content.parts && modelData.candidates[0].content.parts[0] && modelData.candidates[0].content.parts[0].text;
    let parsed;
    try {
      parsed = cleanGeminiJson(text);
    } catch (error) {
      console.error("Failed to parse Gemini JSON", text);
      throw new functions.https.HttpsError("internal", "تعذر قراءة نتيجة التصحيح.");
    }

    const result = {
      score: Number(parsed.score || 0),
      total: Number(parsed.total || 0),
      feedback: String(parsed.feedback || "تم تصحيح الواجب.").slice(0, 1200),
      questions: normalizeQuestionRows(parsed)
    };
    if (!Number.isFinite(result.score) || result.score < 0) result.score = 0;
    if (!Number.isFinite(result.total) || result.total <= 0) result.total = Math.max(1, result.questions.length || 1);
    result.score = Math.min(result.score, result.total);

    const resultRef = db.collection("homework_results").doc(`${homeworkId}_${uid}`);
    const payload = {
      studentId: uid,
      userId: uid,
      studentName: student.name || (context.auth.token && context.auth.token.name) || "طالب",
      homeworkId,
      homeworkTitle: homework.title || "واجب QR",
      bookName: homework.bookName || "عام",
      grade: homework.grade || student.grade || "غير محدد",
      score: result.score,
      total: result.total,
      feedback: result.feedback,
      questions: result.questions,
      attempts: oldAttempts + 1,
      lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      gradingMode: "cloud_function",
      showResultToStudent: homework.showResultToStudent !== false,
      showFeedbackToStudent: homework.showFeedbackToStudent !== false
    };

    await resultRef.set(payload, { merge: true });

    const wrongQuestions = result.questions.filter((q) => !q.isCorrect);
    if (wrongQuestions.length) {
      const batch = db.batch();
      wrongQuestions.slice(0, 60).forEach((q) => {
        const mistakeRef = db.collection("student_mistakes").doc(`${homeworkId}_${uid}_${q.q}`);
        batch.set(mistakeRef, {
          userId: uid,
          studentId: uid,
          studentName: payload.studentName,
          source: "smart_homework_qr",
          homeworkId,
          homeworkTitle: payload.homeworkTitle,
          bookName: payload.bookName,
          branch: homework.bookName || "واجب QR",
          question: {
            text: `واجب ${payload.homeworkTitle} - سؤال ${q.q}`,
            studentAnswerText: q.studentAnswer || "غير واضح",
            correctAnswerText: q.correctAnswer || "غير محدد"
          },
          note: q.note || result.feedback,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      });
      await batch.commit();
    }

    return {
      ok: true,
      result: homework.showResultToStudent === false
        ? { score: result.score, total: result.total, feedback: "تم استلام الواجب وإرساله للمراجعة.", hidden: true }
        : { ...result, feedback: homework.showFeedbackToStudent === false ? "تم حفظ النتيجة." : result.feedback }
    };
  });

exports.redeemSubscriptionCode = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const uid = context.auth && context.auth.uid;
    if (!uid) throw new functions.https.HttpsError("unauthenticated", "يجب تسجيل الدخول أولاً.");
    const code = requireString(data && data.code, "code").toUpperCase();
    const snap = await db.collection("subscription_codes").where("code", "==", code).limit(1).get();
    if (snap.empty) throw new functions.https.HttpsError("not-found", "الكود غير صحيح أو غير موجود.");
    const codeRef = snap.docs[0].ref;
    const codeData = snap.docs[0].data() || {};
    const days = Number(codeData.days || codeData.durationDays || 30);
    if (!Number.isFinite(days) || days <= 0) throw new functions.https.HttpsError("failed-precondition", "مدة الكود غير صالحة.");
    let expiryDate;
    await db.runTransaction(async (tx) => {
      const freshCode = await tx.get(codeRef);
      const fresh = freshCode.data() || {};
      if (fresh.used === true || fresh.isUsed === true) throw new functions.https.HttpsError("failed-precondition", "هذا الكود تم استخدامه من قبل.");
      const userRef = db.collection("users").doc(uid);
      const userSnap = await tx.get(userRef);
      const user = userSnap.exists ? userSnap.data() : {};
      const currentExpiry = user.subscriptionExpiry && user.subscriptionExpiry.toDate ? user.subscriptionExpiry.toDate() : null;
      expiryDate = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
      tx.set(userRef, {
        subscriptionStatus: "premium",
        subscriptionExpiry: admin.firestore.Timestamp.fromDate(expiryDate),
        status: "active",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      tx.set(codeRef, {
        used: true,
        isUsed: true,
        usedBy: uid,
        usedById: uid,
        usedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });
    return { ok: true, days, expiry: expiryDate.toISOString() };
  });

// -----------------------------------------------------------------------------
// Operational hardening callable functions - server-side audit source of truth
// -----------------------------------------------------------------------------
async function writeAudit(action, adminUser, payload = {}) {
  return db.collection("admin_audit_logs").add({
    action,
    adminUid: adminUser.uid,
    adminEmail: adminUser.email || "",
    ...payload,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

exports.updateStudentSubscription = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const adminUser = await assertAdmin(context);
    const studentId = requireString(data && data.studentId, "studentId");
    const status = requireString(data && data.subscriptionStatus, "subscriptionStatus");
    const allowed = ["free", "premium", "expired", "suspended"];
    if (!allowed.includes(status)) {
      throw new functions.https.HttpsError("invalid-argument", "حالة الاشتراك غير مسموحة.");
    }
    const durationDays = Number(data && data.durationDays ? data.durationDays : 30);
    const patch = {
      subscriptionStatus: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: adminUser.uid
    };
    if (status === "premium") {
      patch.subscriptionExpiry = admin.firestore.Timestamp.fromDate(new Date(Date.now() + durationDays * 86400000));
      patch.status = "active";
    }
    await db.collection("users").doc(studentId).set(patch, { merge: true });
    await writeAudit("updateStudentSubscription", adminUser, { studentId, subscriptionStatus: status, durationDays });
    return { ok: true, studentId, subscriptionStatus: status };
  });

exports.banStudent = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const adminUser = await assertAdmin(context);
    const studentId = requireString(data && data.studentId, "studentId");
    const banType = requireString(data && data.banType, "banType");
    const allowed = ["banned_all", "banned_exam", "banned_content", "banned_cheating", "active"];
    if (!allowed.includes(banType)) {
      throw new functions.https.HttpsError("invalid-argument", "نوع الحظر غير صحيح.");
    }
    await db.collection("users").doc(studentId).set({
      status: banType,
      banReason: (data && data.reason) || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: adminUser.uid
    }, { merge: true });
    await writeAudit("banStudent", adminUser, { studentId, banType, reason: (data && data.reason) || "" });
    return { ok: true, studentId, status: banType };
  });

exports.sendInternalNotification = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const adminUser = await assertAdmin(context);
    const title = requireString(data && data.title, "title");
    const body = requireString(data && data.body, "body");
    const target = (data && data.target) || "all";
    const allowedTargets = ["all", "grade", "user"];
    if (!allowedTargets.includes(target)) {
      throw new functions.https.HttpsError("invalid-argument", "نوع المستلمين غير صحيح.");
    }
    const payload = {
      title,
      body,
      message: body,
      target,
      targetType: target,
      grade: (data && data.grade) || "",
      targetGrade: (data && data.grade) || "",
      userId: (data && data.userId) || "",
      targetUserId: (data && data.userId) || "",
      createdBy: adminUser.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const notificationRef = await db.collection("notifications").add(payload);
    const messageRef = await db.collection("student_messages").add(payload);
    await writeAudit("sendInternalNotification", adminUser, { target, grade: payload.grade, userId: payload.userId, notificationId: notificationRef.id, messageId: messageRef.id });
    return { ok: true, notificationId: notificationRef.id, messageId: messageRef.id };
  });

exports.replySupportTicket = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const adminUser = await assertAdmin(context);
    const ticketId = requireString(data && data.ticketId, "ticketId");
    const reply = requireString(data && data.reply, "reply");
    const status = (data && data.status) || "answered";
    await db.collection("student_messages").doc(ticketId).set({
      adminReply: reply,
      status,
      repliedBy: adminUser.uid,
      repliedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    await writeAudit("replySupportTicket", adminUser, { ticketId, status });
    return { ok: true, ticketId, status };
  });

exports.recordSystemMigrationReport = functions
  .region("us-central1")
  .https
  .onCall(async (data, context) => {
    const adminUser = await assertAdmin(context);
    const title = requireString(data && data.title, "title");
    const report = data && typeof data.report === "object" ? data.report : {};
    const ref = await db.collection("migration_reports").add({
      title,
      report,
      createdBy: adminUser.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await writeAudit("recordSystemMigrationReport", adminUser, { reportId: ref.id, title });
    return { ok: true, reportId: ref.id };
  });
