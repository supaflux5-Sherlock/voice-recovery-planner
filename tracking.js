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

  const MILESTONE_TOTAL = 10;
  const FEEL_SCORE = { Strained: 1, Tired: 2, Okay: 3, Clear: 4, Strong: 5 };
  const SEVERITY_ORDER = ["Mild", "Moderate", "Concerning", "Call the doctor"];
  const SEVERITY_COLOR = { Mild: "#86b6ef", Moderate: "#3987e5", Concerning: "#256abf", "Call the doctor": "#104281" };
  const GOOD = "#0ca30c";
  const CRITICAL = "#d03b3b";
  const TRACK = "#e4edfb";

  function svgEl(tag, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const parts = iso.split("-");
    return parts.length === 3 ? `${parts[1]}/${parts[2]}` : iso;
  }

  // ---------- shared tooltip ----------
  function attachTooltip(wrapEl) {
    let tip = wrapEl.querySelector(".chart-tooltip");
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "chart-tooltip";
      wrapEl.style.position = "relative";
      wrapEl.appendChild(tip);
    }
    return tip;
  }

  function bindHover(mark, tip, wrapEl, text) {
    function show(evt) {
      tip.textContent = text;
      tip.classList.add("visible");
      const wrapRect = wrapEl.getBoundingClientRect();
      const markRect = mark.getBoundingClientRect();
      let x = markRect.left + markRect.width / 2 - wrapRect.left;
      let y = markRect.top - wrapRect.top;
      tip.style.left = x + "px";
      tip.style.top = Math.max(0, y - 8) + "px";
      mark.classList.add("mark-hover");
    }
    function hide() {
      tip.classList.remove("visible");
      mark.classList.remove("mark-hover");
    }
    mark.addEventListener("pointerenter", show);
    mark.addEventListener("pointermove", show);
    mark.addEventListener("pointerleave", hide);
    mark.addEventListener("focus", show);
    mark.addEventListener("blur", hide);
  }

  // ---------- empty state ----------
  function renderEmpty(wrapEl, message) {
    wrapEl.innerHTML = "";
    const p = document.createElement("p");
    p.className = "chart-empty";
    p.textContent = message;
    wrapEl.appendChild(p);
  }

  // ---------- stat tiles ----------
  function renderStatTiles(containerEl, tiles) {
    containerEl.innerHTML = "";
    tiles.forEach((tile) => {
      const div = document.createElement("div");
      div.className = "stat-tile";
      const label = document.createElement("span");
      label.className = "stat-label";
      label.textContent = tile.label;
      const value = document.createElement("span");
      value.className = "stat-value";
      value.textContent = tile.value;
      div.appendChild(label);
      div.appendChild(value);
      containerEl.appendChild(div);
    });
  }

  // ---------- bar chart ----------
  // items: [{ label, value, color, title }]  max: numeric axis ceiling  ticks: array of numbers
  function renderBarChart(wrapEl, { items, max, ticks }) {
    wrapEl.innerHTML = "";
    const W = 640;
    const H = 180;
    const padLeft = 28;
    const padBottom = 22;
    const padTop = 10;
    const plotW = W - padLeft - 8;
    const plotH = H - padBottom - padTop;

    const svg = svgEl("svg", {
      viewBox: `0 0 ${W} ${H}`,
      preserveAspectRatio: "none",
      class: "chart-svg",
      role: "img",
      "aria-label": "Bar chart",
    });

    // gridlines + ticks
    ticks.forEach((t) => {
      const y = padTop + plotH - (t / max) * plotH;
      svg.appendChild(
        svgEl("line", {
          x1: padLeft,
          x2: W - 4,
          y1: y.toFixed(1),
          y2: y.toFixed(1),
          class: "chart-grid",
        })
      );
      const label = svgEl("text", { x: 0, y: (y + 3).toFixed(1), class: "chart-tick" });
      label.textContent = t;
      svg.appendChild(label);
    });

    const band = plotW / items.length;
    const barW = Math.min(24, band * 0.62);

    items.forEach((item, i) => {
      const cx = padLeft + band * i + band / 2;
      const hPx = max > 0 ? (item.value / max) * plotH : 0;
      const y = padTop + plotH - hPx;
      const x = cx - barW / 2;
      const color = item.color || "var(--accent)";

      const group = svgEl("g", { tabindex: "0", class: "bar-mark" });
      const rect = svgEl("rect", {
        x: x.toFixed(1),
        y: y.toFixed(1),
        width: barW.toFixed(1),
        height: Math.max(hPx, 1).toFixed(1),
        rx: 4,
        ry: 4,
        fill: color,
      });
      group.appendChild(rect);
      if (hPx > 4) {
        // square the baseline corner
        const squareOff = svgEl("rect", {
          x: x.toFixed(1),
          y: (padTop + plotH - 4).toFixed(1),
          width: barW.toFixed(1),
          height: 4,
          fill: color,
        });
        group.appendChild(squareOff);
      }
      svg.appendChild(group);

      const xLabel = svgEl("text", {
        x: cx.toFixed(1),
        y: H - 4,
        class: "chart-axis-label",
        "text-anchor": "middle",
      });
      xLabel.textContent = item.label;
      svg.appendChild(xLabel);

      const tip = attachTooltip(wrapEl);
      const ariaText = `${item.label}: ${item.title || item.value}`;
      group.setAttribute("aria-label", ariaText);
      bindHover(group, tip, wrapEl, ariaText);
    });

    wrapEl.appendChild(svg);
  }

  // ---------- donut chart ----------
  // items: [{ label, value, color }]
  function renderDonutChart(wrapEl, items, unit) {
    wrapEl.innerHTML = "";
    const total = items.reduce((s, it) => s + it.value, 0);
    const size = 160;
    const r = 56;
    const stroke = 26;
    const C = 2 * Math.PI * r;
    const gap = total > 0 ? 3 : 0;

    const svg = svgEl("svg", {
      viewBox: `0 0 ${size} ${size}`,
      class: "chart-svg donut-svg",
      role: "img",
      "aria-label": "Donut chart",
    });
    const g = svgEl("g", { transform: `rotate(-90 ${size / 2} ${size / 2})` });

    // track
    g.appendChild(
      svgEl("circle", {
        cx: size / 2,
        cy: size / 2,
        r,
        fill: "none",
        stroke: TRACK,
        "stroke-width": stroke,
      })
    );

    let offset = 0;
    const tip = attachTooltip(wrapEl);
    items.forEach((item) => {
      if (item.value <= 0) return;
      const frac = item.value / total;
      const len = Math.max(frac * C - gap, 0);
      const circle = svgEl("circle", {
        cx: size / 2,
        cy: size / 2,
        r,
        fill: "none",
        stroke: item.color,
        "stroke-width": stroke,
        "stroke-dasharray": `${len.toFixed(1)} ${(C - len).toFixed(1)}`,
        "stroke-dashoffset": (-offset).toFixed(1),
        "stroke-linecap": "butt",
        tabindex: "0",
        class: "donut-slice",
      });
      const pct = Math.round(frac * 100);
      const ariaText = `${item.label}: ${item.value}${unit || ""} (${pct}%)`;
      circle.setAttribute("aria-label", ariaText);
      bindHover(circle, tip, wrapEl, ariaText);
      g.appendChild(circle);
      offset += frac * C;
    });

    svg.appendChild(g);

    const centerVal = svgEl("text", {
      x: size / 2,
      y: size / 2 - 3,
      "text-anchor": "middle",
      class: "donut-center-value",
    });
    centerVal.textContent = total > 0 ? total + (unit || "") : "0";
    const centerLabel = svgEl("text", {
      x: size / 2,
      y: size / 2 + 14,
      "text-anchor": "middle",
      class: "donut-center-label",
    });
    centerLabel.textContent = "total";
    svg.appendChild(centerVal);
    svg.appendChild(centerLabel);

    wrapEl.appendChild(svg);

    // legend
    const legend = document.createElement("div");
    legend.className = "chart-legend";
    items.forEach((item) => {
      const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
      const row = document.createElement("span");
      row.className = "legend-item";
      const swatch = document.createElement("span");
      swatch.className = "legend-swatch";
      swatch.style.background = item.color;
      const text = document.createElement("span");
      text.textContent = `${item.label} — ${item.value} (${pct}%)`;
      row.appendChild(swatch);
      row.appendChild(text);
      legend.appendChild(row);
    });
    wrapEl.appendChild(legend);
  }

  // ---------- table view ----------
  function renderTable(containerEl, headers, rows) {
    containerEl.innerHTML = "";
    const table = document.createElement("table");
    table.className = "log-table chart-data-table";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headers.forEach((h) => {
      const th = document.createElement("th");
      th.textContent = h;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      r.forEach((cellText) => {
        const td = document.createElement("td");
        td.textContent = cellText;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    containerEl.appendChild(table);
  }

  // ---------- build everything ----------
  function renderTracking() {
    // Stat tiles
    const milestoneState = load("milestones", {});
    const milestonesDone = Object.values(milestoneState).filter((m) => m && m.done).length;

    const dailyEntries = load("dailyEntries", []);
    const now = new Date();
    const thisMonthEntries = dailyEntries.filter((e) => e.date && e.date.slice(0, 7) === now.toISOString().slice(0, 7));

    const weekState = load("deviceWeek", {});
    const daysCleaned = Object.values(weekState).filter(Boolean).length;

    renderStatTiles(document.getElementById("tracking-stats"), [
      { label: "Milestones achieved", value: `${milestonesDone} / ${MILESTONE_TOTAL}` },
      { label: "Voice entries logged this month", value: String(thisMonthEntries.length) },
      { label: "Device cleaned this week", value: `${daysCleaned} / 7` },
    ]);

    // Voice quality bar chart
    const scored = dailyEntries
      .filter((e) => e.feel && FEEL_SCORE[e.feel])
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(-14);

    const voiceWrap = document.getElementById("chart-voice");
    if (scored.length === 0) {
      renderEmpty(voiceWrap, "No voice-quality entries logged yet — save a Daily Tracker entry to see this chart.");
    } else {
      renderBarChart(voiceWrap, {
        items: scored.map((e) => ({
          label: fmtDate(e.date),
          value: FEEL_SCORE[e.feel],
          title: e.feel,
        })),
        max: 5,
        ticks: [1, 3, 5],
      });
    }
    renderTable(
      document.getElementById("chart-voice-table"),
      ["Date", "Voice quality"],
      scored.map((e) => [e.date, e.feel])
    );

    // Medication adherence bar chart
    const medRows = load("medicationRows", []).filter((r) => r.medication && r.medication.trim());
    const takenCount = medRows.filter((r) => r.taken).length;
    const notTakenCount = medRows.length - takenCount;

    const medWrap = document.getElementById("chart-meds");
    if (medRows.length === 0) {
      renderEmpty(medWrap, "No medications logged yet — add a row in Medications to see this chart.");
    } else {
      renderBarChart(medWrap, {
        items: [
          { label: "Taken", value: takenCount, color: GOOD, title: `${takenCount} doses` },
          { label: "Not taken", value: notTakenCount, color: CRITICAL, title: `${notTakenCount} doses` },
        ],
        max: Math.max(takenCount, notTakenCount, 1),
        ticks: [0, Math.max(takenCount, notTakenCount, 1)],
      });
    }
    renderTable(
      document.getElementById("chart-meds-table"),
      ["Status", "Count"],
      [
        ["Taken", String(takenCount)],
        ["Not taken", String(notTakenCount)],
      ]
    );

    // Symptom severity donut
    const journalEntries = load("journalEntries", []);
    const severityCounts = SEVERITY_ORDER.map((label) => ({
      label,
      value: journalEntries.filter((e) => e.severity === label).length,
      color: SEVERITY_COLOR[label],
    }));
    const severityWrap = document.getElementById("chart-severity");
    if (journalEntries.length === 0) {
      renderEmpty(severityWrap, "No symptom journal entries logged yet.");
    } else {
      renderDonutChart(severityWrap, severityCounts, "");
    }
    renderTable(
      document.getElementById("chart-severity-table"),
      ["Severity", "Count"],
      severityCounts.map((s) => [s.label, String(s.value)])
    );

    // Milestones donut
    const milestoneWrap = document.getElementById("chart-milestones");
    renderDonutChart(milestoneWrap, [
      { label: "Achieved", value: milestonesDone, color: "#1b63d6" },
      { label: "Remaining", value: MILESTONE_TOTAL - milestonesDone, color: TRACK },
    ]);
    renderTable(
      document.getElementById("chart-milestones-table"),
      ["Status", "Count"],
      [
        ["Achieved", String(milestonesDone)],
        ["Remaining", String(MILESTONE_TOTAL - milestonesDone)],
      ]
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderTracking();
    const trackingTab = document.querySelector('.tab[data-tab="tracking"]');
    if (trackingTab) trackingTab.addEventListener("click", renderTracking);
    const printBtn = document.getElementById("print-tracking-btn");
    if (printBtn) printBtn.addEventListener("click", () => window.print());
  });
})();
