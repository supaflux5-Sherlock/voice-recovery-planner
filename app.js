(function () {
  "use strict";

  const STORAGE_PREFIX = "vrp:";

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  }

  function flashSaved(btn) {
    const original = btn.textContent;
    btn.textContent = "Saved ✓";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 1200);
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  // ---------- Tabs ----------
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".panel");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
      save("lastTab", tab.dataset.tab);
    });
  });
  const lastTab = load("lastTab", "daily");
  const lastTabBtn = document.querySelector(`.tab[data-tab="${lastTab}"]`);
  if (lastTabBtn) lastTabBtn.click();

  document.querySelectorAll(".profile-nav-link[data-jump]").forEach((link) => {
    link.addEventListener("click", () => {
      const target = document.querySelector(`.tab[data-tab="${link.dataset.jump}"]`);
      if (target) target.click();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // ---------- Pill groups (single-select) ----------
  document.querySelectorAll(".pill-group").forEach((group) => {
    const key = group.dataset.group;
    const saved = load(key, null);
    group.querySelectorAll("button").forEach((btn) => {
      if (btn.dataset.value === saved) btn.classList.add("selected");
      btn.addEventListener("click", () => {
        group.querySelectorAll("button").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        save(key, btn.dataset.value);
      });
    });
  });

  function selectedPill(group) {
    const el = document.querySelector(`.pill-group[data-group="${group}"] button.selected`);
    return el ? el.dataset.value : "";
  }

  function clearPill(group) {
    document.querySelectorAll(`.pill-group[data-group="${group}"] button`).forEach((b) =>
      b.classList.remove("selected")
    );
  }

  // ---------- Standalone checkboxes (persist immediately) ----------
  document.querySelectorAll(".checklist input[type=checkbox][data-key]").forEach((cb) => {
    cb.checked = load(cb.dataset.key, false);
    cb.addEventListener("change", () => save(cb.dataset.key, cb.checked));
  });

  // set default dates
  ["daily-date", "journal-date", "caregiver-date", "dietary-date", "wellbeing-date"].forEach((id) => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = todayISO();
  });

  // ---------- Daily Tracker (dated entries) ----------
  function renderHistory(entries, containerId, renderFn) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    entries
      .slice()
      .reverse()
      .forEach((entry) => {
        const div = document.createElement("div");
        div.className = "history-entry";
        div.innerHTML = renderFn(entry);
        container.appendChild(div);
      });
  }

  function setupDatedForm(config) {
    const entries = load(config.storageKey, []);
    renderHistory(entries, config.historyId, config.renderEntry);

    document.querySelector(`[data-save="${config.saveKey}"]`).addEventListener("click", () => {
      const entry = config.collect();
      entries.push(entry);
      save(config.storageKey, entries);
      renderHistory(entries, config.historyId, config.renderEntry);
      config.reset();
    });
  }

  setupDatedForm({
    saveKey: "daily",
    storageKey: "dailyEntries",
    historyId: "daily-history",
    collect() {
      const checks = {};
      document.querySelectorAll("#daily-checklist input[type=checkbox]").forEach((cb) => {
        checks[cb.dataset.key] = cb.checked;
      });
      return {
        date: document.getElementById("daily-date").value || todayISO(),
        checks,
        feel: selectedPill("daily-feel"),
        notes: document.getElementById("daily-notes").value,
      };
    },
    reset() {
      document.getElementById("daily-notes").value = "";
    },
    renderEntry(e) {
      const doneItems = Object.entries(e.checks || {})
        .filter(([, v]) => v)
        .map(([k]) => k.replace("daily-", "").replace(/-/g, " "))
        .join(", ");
      return `<div class="entry-date">${e.date}</div>
        <div>${e.feel ? "Voice: <strong>" + e.feel + "</strong>" : ""}</div>
        <div>${doneItems ? "Done: " + doneItems : ""}</div>
        <div>${e.notes ? e.notes : ""}</div>`;
    },
  });

  setupDatedForm({
    saveKey: "journal",
    storageKey: "journalEntries",
    historyId: "journal-history",
    collect() {
      return {
        date: document.getElementById("journal-date").value || todayISO(),
        noticed: document.getElementById("journal-noticed").value,
        severity: selectedPill("journal-severity"),
        helped: document.getElementById("journal-helped").value,
      };
    },
    reset() {
      document.getElementById("journal-noticed").value = "";
      document.getElementById("journal-helped").value = "";
    },
    renderEntry(e) {
      return `<div class="entry-date">${e.date}${e.severity ? " — " + e.severity : ""}</div>
        <div>${e.noticed || ""}</div>
        ${e.helped ? "<div><em>Helped:</em> " + e.helped + "</div>" : ""}`;
    },
  });

  setupDatedForm({
    saveKey: "wellbeing",
    storageKey: "wellbeingEntries",
    historyId: "wellbeing-history",
    collect() {
      const weighing = {};
      document.querySelectorAll("#wellbeing-weighing-checklist input[type=checkbox]").forEach((cb) => {
        weighing[cb.dataset.key] = cb.checked;
      });
      const helped = {};
      document.querySelectorAll("#wellbeing-helped-checklist input[type=checkbox]").forEach((cb) => {
        helped[cb.dataset.key] = cb.checked;
      });
      return {
        date: document.getElementById("wellbeing-date").value || todayISO(),
        mood: selectedPill("wellbeing-mood"),
        weighing,
        helped,
        goodThing: document.getElementById("wellbeing-good-thing").value,
        notes: document.getElementById("wellbeing-notes").value,
      };
    },
    reset() {
      document.getElementById("wellbeing-good-thing").value = "";
      document.getElementById("wellbeing-notes").value = "";
    },
    renderEntry(e) {
      const weighingItems = Object.entries(e.weighing || {})
        .filter(([, v]) => v)
        .map(([k]) => k.replace("wellbeing-weighing-", "").replace(/-/g, " "))
        .join(", ");
      const helpedItems = Object.entries(e.helped || {})
        .filter(([, v]) => v)
        .map(([k]) => k.replace("wellbeing-helped-", "").replace(/-/g, " "))
        .join(", ");
      return `<div class="entry-date">${e.date}${e.mood ? " — " + e.mood : ""}</div>
        <div>${weighingItems ? "On your mind: " + weighingItems : ""}</div>
        <div>${helpedItems ? "Helped: " + helpedItems : ""}</div>
        ${e.goodThing ? "<div><em>Good thing:</em> " + e.goodThing + "</div>" : ""}
        <div>${e.notes ? e.notes : ""}</div>`;
    },
  });

  setupDatedForm({
    saveKey: "caregiver",
    storageKey: "caregiverEntries",
    historyId: "caregiver-history",
    collect() {
      return {
        date: document.getElementById("caregiver-date").value || todayISO(),
        method: selectedPill("caregiver-method"),
        worked: document.getElementById("caregiver-worked").value,
        hard: document.getElementById("caregiver-hard").value,
        tryNext: document.getElementById("caregiver-try").value,
      };
    },
    reset() {
      document.getElementById("caregiver-worked").value = "";
      document.getElementById("caregiver-hard").value = "";
      document.getElementById("caregiver-try").value = "";
    },
    renderEntry(e) {
      return `<div class="entry-date">${e.date}${e.method ? " — " + e.method : ""}</div>
        ${e.worked ? "<div><em>Worked:</em> " + e.worked + "</div>" : ""}
        ${e.hard ? "<div><em>Hard:</em> " + e.hard + "</div>" : ""}
        ${e.tryNext ? "<div><em>Try next:</em> " + e.tryNext + "</div>" : ""}`;
    },
  });

  // ---------- Profile ----------
  document.getElementById("profile-name").value = load("profileName", "");
  document.getElementById("profile-diagnosis-date").value = load("profileDiagnosisDate", "");
  document.getElementById("profile-surgery-date").value = load("profileSurgeryDate", "");
  document.getElementById("profile-tracheostomy-date").value = load("profileTracheostomyDate", "");
  document.getElementById("profile-ent").value = load("profileEnt", "");
  document.getElementById("profile-slp").value = load("profileSlp", "");
  document.getElementById("profile-notes").value = load("profileNotes", "");

  document.querySelector('[data-save="profile"]').addEventListener("click", (e) => {
    save("profileName", document.getElementById("profile-name").value);
    save("profileDiagnosisDate", document.getElementById("profile-diagnosis-date").value);
    save("profileSurgeryDate", document.getElementById("profile-surgery-date").value);
    save("profileTracheostomyDate", document.getElementById("profile-tracheostomy-date").value);
    save("profileEnt", document.getElementById("profile-ent").value);
    save("profileSlp", document.getElementById("profile-slp").value);
    save("profileNotes", document.getElementById("profile-notes").value);
    flashSaved(e.currentTarget);
  });

  // ---------- Device Care ----------
  const deviceCleanedToday = document.getElementById("device-cleaned-today");
  deviceCleanedToday.checked = load("deviceCleanedToday:" + todayISO(), false);
  deviceCleanedToday.addEventListener("change", () =>
    save("deviceCleanedToday:" + todayISO(), deviceCleanedToday.checked)
  );

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekGrid = document.getElementById("device-week");
  const weekState = load("deviceWeek", {});
  DAYS.forEach((day) => {
    const wrap = document.createElement("div");
    wrap.className = "day";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!weekState[day];
    cb.addEventListener("change", () => {
      weekState[day] = cb.checked;
      save("deviceWeek", weekState);
    });
    const label = document.createElement("span");
    label.textContent = day;
    wrap.appendChild(cb);
    wrap.appendChild(label);
    weekGrid.appendChild(wrap);
  });

  document.getElementById("device-last-resupply").value = load("deviceLastResupply", "");
  document.getElementById("device-next-resupply").value = load("deviceNextResupply", "");
  document.getElementById("device-last-membrane").value = load("deviceLastMembrane", "");
  document.getElementById("device-next-membrane").value = load("deviceNextMembrane", "");
  document.getElementById("device-last-unit").value = load("deviceLastUnit", "");
  document.getElementById("device-next-unit").value = load("deviceNextUnit", "");
  document.getElementById("device-notes").value = load("deviceNotes", "");

  document.querySelector('[data-save="device"]').addEventListener("click", (e) => {
    save("deviceLastResupply", document.getElementById("device-last-resupply").value);
    save("deviceNextResupply", document.getElementById("device-next-resupply").value);
    save("deviceLastMembrane", document.getElementById("device-last-membrane").value);
    save("deviceNextMembrane", document.getElementById("device-next-membrane").value);
    save("deviceLastUnit", document.getElementById("device-last-unit").value);
    save("deviceNextUnit", document.getElementById("device-next-unit").value);
    save("deviceNotes", document.getElementById("device-notes").value);
    flashSaved(e.currentTarget);
  });

  // ---------- Editable tables (appointments / medications / bloodwork) ----------
  function setupTable(tableId, storageKey, columns, addKey, onChange) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    let rows = load(storageKey, []);

    function persist() {
      save(storageKey, rows);
      if (onChange) onChange();
    }

    function renderRow(row, index) {
      const tr = document.createElement("tr");
      columns.forEach((col) => {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.type = col.type || "text";
        input.value = row[col.key] || "";
        input.placeholder = col.placeholder || "";
        input.addEventListener("input", () => {
          row[col.key] = col.type === "checkbox" ? undefined : input.value;
          persist();
        });
        if (col.type === "checkbox") {
          input.checked = !!row[col.key];
          input.addEventListener("change", () => {
            row[col.key] = input.checked;
            persist();
          });
        }
        td.appendChild(input);
        tr.appendChild(td);
      });
      const removeTd = document.createElement("td");
      const removeBtn = document.createElement("button");
      removeBtn.className = "row-remove";
      removeBtn.textContent = "✕";
      removeBtn.addEventListener("click", () => {
        rows.splice(index, 1);
        persist();
        render();
      });
      removeTd.appendChild(removeBtn);
      tr.appendChild(removeTd);
      return tr;
    }

    function render() {
      tbody.innerHTML = "";
      rows.forEach((row, i) => tbody.appendChild(renderRow(row, i)));
    }

    render();

    document.querySelector(`[data-add="${addKey}"]`).addEventListener("click", () => {
      rows.push({});
      persist();
      render();
    });
  }

  setupTable(
    "appointments-table",
    "appointmentRows",
    [
      { key: "date", type: "date" },
      { key: "provider", placeholder: "Provider / Type" },
      { key: "reason", placeholder: "Reason" },
      { key: "followup", placeholder: "Follow-up?" },
    ],
    "appointments",
    () => window.__vrpSyncReminders && window.__vrpSyncReminders()
  );

  setupTable(
    "medications-table",
    "medicationRows",
    [
      { key: "medication", placeholder: "Medication" },
      { key: "dose", placeholder: "Dose" },
      { key: "time", placeholder: "Time" },
      { key: "taken", type: "checkbox" },
      { key: "notes", placeholder: "Notes" },
    ],
    "medications",
    () => window.__vrpSyncReminders && window.__vrpSyncReminders()
  );

  setupTable(
    "bloodwork-table",
    "bloodworkRows",
    [
      { key: "date", type: "date" },
      { key: "test", placeholder: "Test (e.g. Hemoglobin)" },
      { key: "result", placeholder: "Result" },
      { key: "range", placeholder: "Normal range" },
      { key: "notes", placeholder: "Notes" },
    ],
    "bloodwork"
  );

  // ---------- Dietary (dated entries) ----------
  // Note: the feeding-method checklist below is already wired up by the generic
  // ".checklist input[data-key]" handler near the top of this file.
  setupDatedForm({
    saveKey: "dietary",
    storageKey: "dietaryEntries",
    historyId: "dietary-history",
    collect() {
      const checks = {};
      document.querySelectorAll("#dietary-checklist input[type=checkbox]").forEach((cb) => {
        checks[cb.dataset.key] = cb.checked;
      });
      return {
        date: document.getElementById("dietary-date").value || todayISO(),
        checks,
        notes: document.getElementById("dietary-notes").value,
      };
    },
    reset() {
      document.getElementById("dietary-notes").value = "";
    },
    renderEntry(e) {
      const methods = Object.entries(e.checks || {})
        .filter(([, v]) => v)
        .map(([k]) => k.replace("dietary-", "").replace(/-/g, " "))
        .join(", ");
      return `<div class="entry-date">${e.date}</div>
        <div>${methods ? "Feeding: " + methods : ""}</div>
        <div>${e.notes ? e.notes : ""}</div>`;
    },
  });

  // ---------- Milestones ----------
  const MILESTONES = [
    "First successful voicing with the device",
    "First phone call",
    "First time ordering food out loud",
    "First full conversation without fatigue",
    "First time laughing out loud and being heard",
    "Return to a favorite activity",
    "First public conversation (work, appointment, etc.)",
    "One month cancer-free check-in",
    "Six-month cancer-free check-in",
    "One year cancer-free",
  ];
  const milestoneState = load("milestones", {});
  const milestoneList = document.getElementById("milestone-list");
  MILESTONES.forEach((label, i) => {
    const key = "m" + i;
    const state = milestoneState[key] || { done: false, date: "" };
    const item = document.createElement("div");
    item.className = "milestone-item";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = state.done;

    const labelEl = document.createElement("span");
    labelEl.className = "label";
    labelEl.textContent = label;

    const dateEl = document.createElement("input");
    dateEl.type = "date";
    dateEl.value = state.date;

    function persist() {
      milestoneState[key] = { done: cb.checked, date: dateEl.value };
      save("milestones", milestoneState);
    }
    cb.addEventListener("change", persist);
    dateEl.addEventListener("change", persist);

    item.appendChild(cb);
    item.appendChild(labelEl);
    item.appendChild(dateEl);
    milestoneList.appendChild(item);
  });

  // ---------- Export / Clear ----------
  document.getElementById("export-btn").addEventListener("click", () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(STORAGE_PREFIX)) {
        data[k.slice(STORAGE_PREFIX.length)] = JSON.parse(localStorage.getItem(k));
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voice-recovery-planner-data.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("clear-btn").addEventListener("click", () => {
    if (!confirm("This will erase all your saved entries on this device. This can't be undone. Continue?")) return;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
    location.reload();
  });
})();
