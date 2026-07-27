self.addEventListener("push", (event) => {
  let data = { title: "Voice Recovery Planner", body: "You have a reminder." };
  try {
    data = event.data.json();
  } catch (e) {
    /* fall back to default */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: undefined,
      tag: data.title,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes("/voice-recovery-planner/"));
      if (existing) return existing.focus();
      return self.clients.openWindow("./");
    })
  );
});
