self.addEventListener("install", (e) => {
  console.log("[Service Worker] Installato");
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  console.log("[Service Worker] Attivato");
});

// Listener per eventuali notifiche push dal server
self.addEventListener("push", (e) => {
  const data = e.data ? e.data.text() : "Promemoria Salute!";
  e.waitUntil(
    self.registration.showNotification("Salute & Promemoria", {
      body: data,
      icon: "icon.png",
    }),
  );
});

const CACHE_NAME = "salute-v2";
const urlsToCache = [
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request)),
  );
});
