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
