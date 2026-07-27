(function () {
  "use strict";

  const API_BASE = "https://voice-recovery-planner-push.supaflux5.workers.dev";
  const VAPID_PUBLIC_KEY =
    "BGcsIV2r1ILTo64MSAfkIKLMEu7ndgaZIlwZUBGayicgbE1FWJciEi7jJqp5Birpd-7sk31u2o_KEYCj2lGiwks";
  const STORAGE_PREFIX = "vrp:";
  const PUSH_ID_KEY = STORAGE_PREFIX + "pushSubscriptionId";
  const ENABLED_KEY = STORAGE_PREFIX + "remindersEnabled";

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

  function getLocalId() {
    let id = localStorage.getItem(PUSH_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(PUSH_ID_KEY, id);
    }
    return id;
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  async function syncSchedule() {
    if (localStorage.getItem(ENABLED_KEY) !== "true") return;
    const id = getLocalId();
    const medications = readJSON("medicationRows", []);
    const appointments = readJSON("appointmentRows", []);
    try {
      await fetch(`${API_BASE}/api/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, medications, appointments }),
      });
    } catch (e) {
      console.error("reminder sync failed", e);
    }
  }

  async function enableReminders() {
    if (
      !confirm(
        "Turning on reminders sends your appointment and medication details (dates, providers, doses, times) to our reminder server, so it knows when to notify you. Everything else in this app stays on your device only. Continue?"
      )
    ) {
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert(
        "This browser doesn't support push notifications. On iPhone, add this page to your Home Screen first (Share > Add to Home Screen), then try again from there."
      );
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("Notification permission was not granted, so reminders can't be turned on.");
      return;
    }

    const registration = await navigator.serviceWorker.register("sw.js");
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const id = getLocalId();
    await fetch(`${API_BASE}/api/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, subscription: subscription.toJSON() }),
    });

    localStorage.setItem(ENABLED_KEY, "true");
    updateStatus();
    await syncSchedule();
    if (window.VRPAuth) window.VRPAuth.trackEvent("enabled_reminders");
  }

  function updateStatus() {
    const statusEl = document.getElementById("reminders-status");
    const toggleEl = document.getElementById("reminders-toggle");
    const dotEl = document.getElementById("reminders-dot");
    const enabled = localStorage.getItem(ENABLED_KEY) === "true";
    if (enabled) {
      statusEl.textContent = "Reminders are on — appointments & medications";
      toggleEl.textContent = "Re-sync now";
      dotEl.classList.add("active");
    } else {
      statusEl.textContent = "Reminders are off";
      toggleEl.textContent = "Enable reminders";
      dotEl.classList.remove("active");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateStatus();
    document.getElementById("reminders-toggle").addEventListener("click", async () => {
      if (localStorage.getItem(ENABLED_KEY) === "true") {
        await syncSchedule();
        alert("Synced your current appointments and medications for reminders.");
      } else {
        await enableReminders();
      }
    });
  });

  // Exposed so app.js can trigger a re-sync whenever appointments/medications change
  window.__vrpSyncReminders = syncSchedule;
})();
