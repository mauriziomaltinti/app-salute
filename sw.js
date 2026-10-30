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
