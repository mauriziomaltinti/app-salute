const CACHE_NAME = "salute-v7";
const urlsToCache = [
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
];

// Installazione: memorizza i file e forza l'aggiornamento immediato
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installato (v7)");
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

// Attivazione: pulisce le vecchie cache e prende il controllo dei client
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Attivato (v7)");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log(
                "[Service Worker] Eliminazione vecchia cache:",
                cache,
              );
              return caches.delete(cache);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Intercettazione richieste di rete (Offline-first)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

// Gestione notifiche push dal server
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.text() : "Promemoria Salute!";
  event.waitUntil(
    self.registration.showNotification("Salute & Promemoria", {
      body: data,
      icon: "icon.png",
    }),
  );
});
