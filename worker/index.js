// File: worker/index.js  (REPLACES your existing file)
// worker/index.js
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Announcement", body: event.data?.text() };
  }

  event.waitUntil(
    (async () => {
      // Admin is already looking at the chat inbox: the page plays its own
      // sound, so skip the system notification to avoid a double alert.
      if (data.type === "chat") {
        const windows = await clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        const watching = windows.some(
          (c) =>
            c.visibilityState === "visible" &&
            new URL(c.url).pathname.startsWith("/admin/chats"),
        );
        if (watching) return;
      }

      await self.registration.showNotification(data.title || "Announcement", {
        body: data.body,
        tag: data.tag,
        renotify: Boolean(data.tag), // ring again when the same chat gets another message
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-96x96.png",
        data: { url: data.url || "/" },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const c of list) {
          if ("focus" in c) {
            c.navigate(url);
            return c.focus();
          }
        }
        return clients.openWindow(url);
      }),
  );
});
