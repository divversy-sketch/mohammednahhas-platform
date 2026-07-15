/* منصة النحاس التعليمية - Safe PWA Service Worker */
const APP_VERSION = "2026.07.15.brand4";
const CACHE_NAME = `nahhas-platform-${APP_VERSION}`;
const ASSET_CACHE = ["/", "/offline.html", "/manifest.json?v=20260715-brand4", "/favicon.ico?v=20260715-brand4", "/icons/alnahhas-app-192-v4.png", "/icons/alnahhas-app-512-v4.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSET_CACHE).catch(() => null)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("nahhas-platform-") && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => { if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting(); });

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html").then((offline) => offline || caches.match("/"))));
    return;
  }

  const url = new URL(request.url);
  const isSafeAsset = url.origin === location.origin && (url.pathname.startsWith("/icons/") || url.pathname === "/favicon.ico" || url.pathname === "/manifest.json" || url.pathname.startsWith("/assets/"));
  if (isSafeAsset) {
    event.respondWith(fetch(request).then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => null);
      return response;
    }).catch(() => caches.match(request)));
  }
});
