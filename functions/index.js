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
// Smart QR homework correction - secure server-side Gemini grading
// -----------------------------------------------------------------------------

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || (functions.config && functions.config().gemini && functions.config().gemini.key) || "";
}

function extractJsonObject(text) {
  const raw = String(text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(raw); } catch (_) {}
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(raw.slice(start, end + 1));
  }
  throw new Error("Gemini did not return valid JSON");
}

function toMillis(value) {
  if (!value) return null;
  if (value.toMillis) return value.toMillis();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function safeQuestionRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, 120).map((q, idx) => ({
    q: q.q || q.question || idx + 1,
    studentAnswer: String(q.studentAnswer || q.answer || "").slice(0, 80),
    correctAnswer: String(q.correctAnswer || "").slice(0, 80),
    isCorrect: Boolean(q.isCorrect),
    note: String(q.note || "").slice(0, 250)
  }));
}

async function callGeminiForHomework({ answerKey, imageBase64, mimeType, homework }) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new functions.https.HttpsError("failed-precondition", "لم يتم ضبط GEMINI_API_KEY على Cloud Functions.");
  }

  const promptText = `أنت مصحح واجبات عربي صارم وعادل. صحح صورة واجب الطالب حسب نموذج الإجابة التالي فقط.\n\nنموذج الإجابة:\n${answerKey}\n\nبيانات الواجب:\nالعنوان: ${homework.title || ""}\nالكتاب: ${homework.bookName || ""}\nعدد الأسئلة المتوقع: ${homework.totalQuestions || "غير محدد"}\n\nارجع JSON فقط بدون شرح خارجي وبالصيغة التالية:\n{"score": number, "total": number, "feedback": "تعليق مختصر بالعربية", "questions": [{"q": 1, "studentAnswer": "أ", "correctAnswer": "أ", "isCorrect": true, "note": ""}] }\nلو الصورة غير واضحة ارجع score=0 واكتب في feedback أن الصورة غير واضحة.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { text: promptText },
          { inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } }
        ]
      }],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Gemini API error", data);
    throw new functions.https.HttpsError("internal", "فشل الاتصال بخدمة التصحيح الذكي.");
  }

  const textResult = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
  const parsed = extractJsonObject(textResult);
  const score = Number(parsed.score || 0);
  const questions = safeQuestionRows(parsed.questions);
  const inferredTotal = questions.length || Number(homework.totalQuestions || 0) || Number(parsed.total || 0) || 0;
  const total = Math.max(0, Number(parsed.total || inferredTotal || 0));
  return {
    score: Number.isFinite(score) ? Math.max(0, score) : 0,
    total: Number.isFinite(total) ? total : 0,
    feedback: String(parsed.feedback || "تم التصحيح.").slice(0, 1200),
    questions
  };
}

exports.correctSmartHomework = functions
  .region("us-central1")
  .runWith({ timeoutSeconds: 120, memory: "512MB" })
  .https
  .onCall(async (data, context) => {
    const uid = context.auth && context.auth.uid;
    if (!uid) {
      throw new functions.https.HttpsError("unauthenticated", "يجب تسجيل الدخول أولاً.");
    }

    const homeworkId = requireString(data && data.homeworkId, "homeworkId");
    const imageBase64 = requireString(data && data.imageBase64, "imageBase64");
    const mimeType = String((data && data.mimeType) || "image/jpeg").slice(0, 80);
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(mimeType)) {
      throw new functions.https.HttpsError("invalid-argument", "صيغة الصورة غير مدعومة.");
    }
    if (imageBase64.length > 6_500_000) {
      throw new functions.https.HttpsError("invalid-argument", "الصورة كبيرة جدًا، أعد التصوير بجودة أقل.");
    }

    const hwRef = db.collection("smart_homeworks").doc(homeworkId);
    const hwSnap = await hwRef.get();
    if (!hwSnap.exists) {
      throw new functions.https.HttpsError("not-found", "الواجب غير موجود.");
    }
    const homework = hwSnap.data() || {};
    if (homework.status === "closed" || homework.isActive === false) {
      throw new functions.https.HttpsError("failed-precondition", "الواجب مغلق الآن.");
    }
    const nowMs = Date.now();
    const startMs = toMillis(homework.startAt);
    const endMs = toMillis(homework.endAt);
    if (startMs && nowMs < startMs) {
      throw new functions.https.HttpsError("failed-precondition", "الواجب لم يبدأ بعد.");
    }
    if (endMs && nowMs > endMs) {
      throw new functions.https.HttpsError("failed-precondition", "انتهى موعد تسليم الواجب.");
    }

    const privateSnap = await hwRef.collection("private").doc("answerKey").get();
    const answerKey = (privateSnap.exists && privateSnap.data().answerKey) || homework.answerKey || "";
    if (!answerKey) {
      throw new functions.https.HttpsError("failed-precondition", "نموذج الإجابة غير مضبوط لهذا الواجب.");
    }

    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.exists ? userSnap.data() : {};
    const studentGrade = userData.grade || "غير محدد";
    if (homework.grade && homework.grade !== "all" && studentGrade !== homework.grade) {
      throw new functions.https.HttpsError("permission-denied", "هذا الواجب ليس مخصصًا لمرحلتك.");
    }

    const resultDocId = `${homeworkId}_${uid}`;
    const resultRef = db.collection("homework_results").doc(resultDocId);
    const existingSnap = await resultRef.get();
    const existing = existingSnap.exists ? existingSnap.data() : null;
    const currentAttempts = Number(existing && existing.attemptCount ? existing.attemptCount : 0);
    const maxAttempts = Math.max(1, Number(homework.maxAttempts || 1));
    const allowResubmit = homework.allowResubmit === true;
    if (currentAttempts >= maxAttempts && !allowResubmit) {
      throw new functions.https.HttpsError("failed-precondition", "تم استهلاك عدد محاولات هذا الواجب.");
    }

    const aiResult = await callGeminiForHomework({ answerKey, imageBase64, mimeType, homework });
    const attemptCount = currentAttempts + 1;
    const wrongQuestions = (aiResult.questions || []).filter((q) => !q.isCorrect);
    const resultPayload = {
      studentId: uid,
      userId: uid,
      studentName: userData.name || context.auth.token.name || context.auth.token.email || "طالب",
      studentEmail: context.auth.token.email || userData.email || "",
      homeworkId,
      homeworkTitle: homework.title || "واجب QR",
      bookName: homework.bookName || "عام",
      grade: homework.grade || studentGrade || "غير محدد",
      score: aiResult.score,
      total: aiResult.total,
      feedback: aiResult.feedback,
      questions: aiResult.questions,
      wrongQuestionsCount: wrongQuestions.length,
      attemptCount,
      lastSubmittedAt: admin.firestore.FieldValue.serverTimestamp(),
      submittedAt: existing && existing.submittedAt ? existing.submittedAt : admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      correctionSource: "cloud_function_gemini",
      showResultToStudent: homework.showResultToStudent !== false,
      showFeedbackToStudent: homework.showFeedbackToStudent !== false,
      attempts: admin.firestore.FieldValue.arrayUnion({
        attemptNo: attemptCount,
        score: aiResult.score,
        total: aiResult.total,
        feedback: aiResult.feedback,
        questions: aiResult.questions,
        createdAt: new Date().toISOString()
      })
    };

    await resultRef.set(resultPayload, { merge: true });

    const mistakeWrites = wrongQuestions.slice(0, 50).map((q) => {
      const mistakeId = `${homeworkId}_${uid}_${String(q.q).replace(/[^\w\u0600-\u06FF-]+/g, "_")}`.slice(0, 140);
      return db.collection("student_mistakes").doc(mistakeId).set({
        userId: uid,
        studentId: uid,
        studentName: resultPayload.studentName,
        source: "smart_homework_qr",
        homeworkId,
        homeworkTitle: resultPayload.homeworkTitle,
        bookName: resultPayload.bookName,
        grade: resultPayload.grade,
        questionNo: q.q,
        studentAnswer: q.studentAnswer || "",
        correctAnswer: q.correctAnswer || "",
        note: q.note || aiResult.feedback || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });
    await Promise.all(mistakeWrites);

    const showResult = homework.showResultToStudent !== false;
    const showFeedback = homework.showFeedbackToStudent !== false;
    const studentResult = showResult ? {
      score: aiResult.score,
      total: aiResult.total,
      feedback: showFeedback ? aiResult.feedback : "تم التصحيح وحفظ النتيجة.",
      questions: showFeedback ? aiResult.questions : [],
      hiddenFromStudent: false
    } : {
      hiddenFromStudent: true,
      feedback: "تم تسليم الواجب بنجاح."
    };

    return {
      ok: true,
      result: studentResult,
      attemptCount,
      attemptsRemaining: allowResubmit ? null : Math.max(0, maxAttempts - attemptCount)
    };
  });
