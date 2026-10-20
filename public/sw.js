// SmartAvto service worker — FAQAT push-bildirishnomalar uchun.
// Ataylab "fetch" ishlovchisi yo'q: sayt keshlanmaydi, har doim yangi versiya yuklanadi.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data && event.data.text() }; }
  const title = data.title || "SmartAvto";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "Bugungi testlaringizni ishlash vaqti keldi.",
      icon: "/pwa-192.png",
      badge: "/favicon-192.png",
      tag: data.tag || "daily-plan",
      renotify: true,
      requireInteraction: true,
      vibrate: [400, 150, 400, 150, 800],
      data: { url: data.url || "/kunlik-reja" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/kunlik-reja";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) { c.navigate(url); return c.focus(); }
      }
      return self.clients.openWindow(url);
    }),
  );
});
