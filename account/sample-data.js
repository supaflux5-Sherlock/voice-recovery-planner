(function () {
  "use strict";

  const STORAGE_PREFIX = "vrp:";

  function save(key, value) {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  }

  function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  function loadSampleData() {
    // ---------- Profile ----------
    save("profileName", "Alex Rivera");
    save("profile-cause", "Total Laryngectomy");
    save("profileDiagnosisDate", daysAgo(210));
    save("profileSurgeryDate", daysAgo(180));
    save("profileTracheostomyDate", daysAgo(180));
    save("profile-communication", "Voice device (TEP)");
    save("profileEnt", "Dr. Patel, (555) 201-4477");
    save("profileSlp", "Jordan Kim, SLP, (555) 201-9982");
    save(
      "profileNotes",
      "No known drug allergies. Uses a humidifier at night. Prefers text/notes app when tired."
    );

    // ---------- Daily Tracker ----------
    const feels = ["Strained", "Tired", "Tired", "Okay", "Okay", "Clear", "Okay", "Clear", "Strong", "Clear", "Strong", "Clear", "Strong", "Strong"];
    const dailyEntries = feels.map((feel, i) => ({
      date: daysAgo(13 - i),
      checks: {
        "daily-diaphragmatic": i % 2 === 0,
        "daily-restperiod": true,
        "daily-pacing": i % 3 !== 0,
        "daily-humming": i % 2 === 1,
        "daily-therapy": i % 4 === 0,
      },
      feel,
      notes: i === 13 ? "Best voicing session yet — held a full sentence without a break." : "",
    }));
    save("dailyEntries", dailyEntries);

    // ---------- Wellbeing ----------
    const moods = ["Struggling", "Low", "Low", "Okay", "Okay", "Good", "Okay", "Good", "Good", "Strong", "Good", "Strong", "Good", "Strong"];
    const wellbeingEntries = moods.map((mood, i) => ({
      date: daysAgo(13 - i),
      mood,
      weighing: {
        "wellbeing-weighing-isolation": i < 3,
        "wellbeing-weighing-grief": i < 2,
        "wellbeing-weighing-anxiety": i === 4 || i === 5,
        "wellbeing-weighing-communication": i < 4,
        "wellbeing-weighing-recurrence": i === 6,
        "wellbeing-weighing-bodyimage": i < 3,
        "wellbeing-weighing-financial": false,
        "wellbeing-weighing-sleep": i < 3,
        "wellbeing-weighing-relationship": false,
        "wellbeing-weighing-other": false,
      },
      helped: {
        "wellbeing-helped-talked": i >= 4,
        "wellbeing-helped-group": i === 10,
        "wellbeing-helped-therapy": i === 3 || i === 10,
        "wellbeing-helped-meditation": i >= 6,
        "wellbeing-helped-activity": i >= 8,
        "wellbeing-helped-creative": i === 12,
        "wellbeing-helped-rest": i < 4,
        "wellbeing-helped-outdoors": i >= 9,
        "wellbeing-helped-other": false,
      },
      goodThing: i >= 8 ? "Went for a walk and talked with a neighbor using my device." : "",
      notes: "",
    }));
    save("wellbeingEntries", wellbeingEntries);

    // ---------- Medications ----------
    save("medicationRows", [
      { medication: "Levothyroxine", dose: "75mcg", time: "8:00 AM", taken: true, notes: "" },
      { medication: "Levothyroxine", dose: "75mcg", time: "8:00 AM", taken: true, notes: "" },
      { medication: "Levothyroxine", dose: "75mcg", time: "8:00 AM", taken: false, notes: "Forgot before leaving for appt" },
      { medication: "Pantoprazole", dose: "40mg", time: "Before breakfast", taken: true, notes: "" },
      { medication: "Pantoprazole", dose: "40mg", time: "Before breakfast", taken: true, notes: "" },
      { medication: "Multivitamin", dose: "1 tablet", time: "With lunch", taken: true, notes: "" },
      { medication: "Multivitamin", dose: "1 tablet", time: "With lunch", taken: false, notes: "" },
    ]);

    // ---------- Appointments ----------
    save("appointmentRows", [
      { date: daysAgo(30), provider: "Dr. Patel — ENT", reason: "3-month post-op follow-up", followup: "Yes — 3 months" },
      { date: daysAgo(14), provider: "Jordan Kim — SLP", reason: "Voice therapy session", followup: "Weekly" },
      { date: daysAgo(3), provider: "Dr. Ahmadi — Oncology", reason: "Surveillance scan review", followup: "6 months" },
      { date: daysAgo(-7), provider: "Dr. Patel — ENT", reason: "Stoma check", followup: "" },
    ]);

    // ---------- Bloodwork ----------
    save("bloodworkRows", [
      { date: daysAgo(30), test: "Hemoglobin", result: "12.8 g/dL", range: "13.5–17.5 g/dL", notes: "Slightly low, retest in 3 months" },
      { date: daysAgo(30), test: "TSH", result: "3.1 mIU/L", range: "0.4–4.0 mIU/L", notes: "Normal" },
      { date: daysAgo(30), test: "Vitamin D", result: "28 ng/mL", range: "30–100 ng/mL", notes: "Started supplement" },
      { date: daysAgo(90), test: "Hemoglobin", result: "13.9 g/dL", range: "13.5–17.5 g/dL", notes: "Normal" },
    ]);

    // ---------- Symptom Journal ----------
    save("journalEntries", [
      { date: daysAgo(25), noticed: "Dry throat in the evening", severity: "Mild", helped: "Extra humidification overnight" },
      { date: daysAgo(18), noticed: "Some mucus buildup around the stoma", severity: "Moderate", helped: "Saline rinses, cleared in 2 days" },
      { date: daysAgo(12), noticed: "Skin irritation around the HME", severity: "Moderate", helped: "Switched adhesive brand" },
      { date: daysAgo(6), noticed: "Slight bleeding after coughing", severity: "Concerning", helped: "Called SLP, resolved on its own" },
      { date: daysAgo(1), noticed: "Everything feels routine today", severity: "Mild", helped: "" },
    ]);

    // ---------- Milestones ----------
    save("milestones", {
      m0: { done: true, date: daysAgo(170) },
      m1: { done: true, date: daysAgo(150) },
      m2: { done: true, date: daysAgo(120) },
      m3: { done: true, date: daysAgo(90) },
      m4: { done: false, date: "" },
      m5: { done: true, date: daysAgo(45) },
      m6: { done: false, date: "" },
      m7: { done: true, date: daysAgo(150) },
      m8: { done: false, date: "" },
      m9: { done: false, date: "" },
    });

    // ---------- Caregiver Log ----------
    save("caregiverEntries", [
      {
        date: daysAgo(20),
        method: "Voice device (TEP)",
        worked: "Short sentences at the dinner table went well.",
        hard: "Group conversations are still tough — hard to jump in.",
        tryNext: "Agree on a hand signal for 'wait, I'm about to talk.'",
      },
      {
        date: daysAgo(7),
        method: "Writing / notes app",
        worked: "Notes app was fast for quick answers at the pharmacy.",
        hard: "Phone died mid-conversation, felt stuck.",
        tryNext: "Keep a small notepad as backup.",
      },
    ]);

    // ---------- Dietary ----------
    save("dietaryEntries", [
      { date: daysAgo(5), checks: { "dietary-mouth": true, "dietary-tube": false, "dietary-iv": false }, notes: "Soft foods, no issues." },
      { date: daysAgo(3), checks: { "dietary-mouth": true, "dietary-tube": false, "dietary-iv": false }, notes: "" },
      { date: daysAgo(1), checks: { "dietary-mouth": true, "dietary-tube": false, "dietary-iv": false }, notes: "Tried rice for the first time since surgery — went fine." },
    ]);

    // ---------- Device Care ----------
    save("deviceCleanedToday:" + daysAgo(0), true);
    save("deviceWeek", { Mon: true, Tue: true, Wed: true, Thu: true, Fri: false, Sat: true, Sun: false });
    save("deviceLastResupply", daysAgo(60));
    save("deviceNextResupply", daysAgo(-120));
    save("deviceLastMembrane", daysAgo(45));
    save("deviceNextMembrane", daysAgo(-15));
    save("deviceLastUnit", daysAgo(150));
    save("deviceNextUnit", daysAgo(-215));
    save("deviceNotes", "Unit performing well since the last membrane swap.");
    save("devicetype-avavoice", true);
    save("devicetype-laryngectomy", true);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("sample-data-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (
        !confirm(
          "This will replace all current data on this device with sample demo data. Continue?"
        )
      )
        return;
      loadSampleData();
      location.reload();
    });
  });
})();
