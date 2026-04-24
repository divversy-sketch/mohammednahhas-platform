self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker Activated');
});

self.addEventListener('fetch', event => {
  // simple pass-through
});