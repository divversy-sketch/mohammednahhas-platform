// هذا الملف يخبر المتصفح أن المنصة يمكن أن تعمل كتطبيق
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Installed');
});

self.addEventListener('fetch', (e) => {
  // ترك هذا فارغاً يكفي لتفعيل زر التثبيت
});