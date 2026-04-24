importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDE7PASs4dt2aD912Jerm7260142Hee4W0",
  authDomain: "exam-f6804.firebaseapp.com",
  projectId: "exam-f6804",
  storageBucket: "exam-f6804.firebasestorage.app",
  messagingSenderId: "1029912301794",
  appId: "1:1029912301794:web:57673ad6f7331136e80ebb",
  measurementId: "G-PCEZQ7H2EV"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "منصة النحاس التعليمية";
  const options = {
    body: payload?.notification?.body || "لديك إشعار جديد",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: payload?.data || {}
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});
