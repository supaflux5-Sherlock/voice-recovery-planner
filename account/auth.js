(function () {
  "use strict";

  const API_BASE = "https://voice-recovery-planner-push.supaflux5.workers.dev";
  const TOKEN_KEY = "vrpAccountToken";
  const EMAIL_KEY = "vrpAccountEmail";

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setSession(token, email) {
    localStorage.setItem(TOKEN_KEY, token);
    if (email) localStorage.setItem(EMAIL_KEY, email);
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
  }

  function isLoggedIn() {
    return !!getToken();
  }

  async function request(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
  }

  async function signup(email, password) {
    const data = await request("/api/signup", { email, password });
    setSession(data.token, email);
  }

  async function login(email, password) {
    const data = await request("/api/login", { email, password });
    setSession(data.token, email);
  }

  async function loginWithGoogle(credential) {
    const data = await request("/api/google-login", { credential });
    setSession(data.token, data.email);
    if (data.name && !localStorage.getItem("vrp:profileName")) {
      localStorage.setItem("vrp:profileName", JSON.stringify(data.name));
    }
  }

  function logout() {
    clearSession();
    location.href = "login.html";
  }

  function trackEvent(eventName) {
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/api/track-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ event: eventName }),
    }).catch(() => {});
  }

  window.VRPAuth = { getToken, isLoggedIn, signup, login, loginWithGoogle, logout, trackEvent, EMAIL_KEY };

  document.addEventListener("DOMContentLoaded", () => {
    ["logout-btn", "header-logout-btn"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener("click", logout);
    });
  });
})();
