const CACHE_NAME = "petmosphere-shell-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL)),
  );
});

self.addEventListener("push", (event) => {
  let notification = null;
  try {
    notification = event.data ? event.data.json() : null;
  } catch {
    notification = null;
  }
  const safeUrl =
    typeof notification?.url === "string" &&
    notification.url.startsWith("/") &&
    !notification.url.startsWith("//")
      ? notification.url
      : "/home";
  event.waitUntil(
    self.registration.showNotification("Petmosphere", {
      body: notification?.body || "It’s time for today’s pet check-in.",
      data: { url: safeUrl },
      icon: "/icons/icon-192.svg",
      tag: notification?.tag || "petmosphere-daily-check-in",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/home";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find(
        (client) => new URL(client.url).pathname === targetUrl,
      );
      return existing ? existing.focus() : self.clients.openWindow(targetUrl);
    }),
  );
});
