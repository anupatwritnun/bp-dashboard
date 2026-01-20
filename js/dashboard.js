// ===============================
// dashboard.js
// Handles fetching + filtering +
// dashboard UI rendering
// ===============================

// Called by app.js
window.loadDashboardData = async function () {
  const userId = window.AppState.userId;
  if (!userId) {
    console.error("❌ No userId found");
    return;
  }

  console.log("Fetching data for:", userId);

  try {
    const res = await fetch(
      "https://n8n.srv1159869.hstgr.cloud/webhook/bp-dashboard",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      }
    );

    const text = await res.text();
    console.log("RAW RESPONSE FROM N8N:", text);

    if (!text || text.trim() === "") {
      console.error("Server returned EMPTY BODY.");
      throw new Error("Empty response from server");
    }

    const json = JSON.parse(text);
    const root = Array.isArray(json) ? json[0] : json;

    // Store profile stats
    window.AppState.profileStats = root.profile || {};

    // Store BP records
    window.AppState.bpRecords = (root.records || []).map(r => ({
      date: r.date,
      time: r.time || r.period || "-",
      systolic: r.systolic != null ? Number(r.systolic) : null,
      diastolic: r.diastolic != null ? Number(r.diastolic) : null,
      pulse: r.pulse != null ? Number(r.pulse) : null
    }));

    // Store additional data arrays from webhook
    window.AppState.goodHabits = root.good_habits || [];
    window.AppState.badHabits = root.bad_habits || [];
    window.AppState.symptomLogs = root.symptom_logs || [];
    window.AppState.weightLogs = root.weight_logs || [];

    console.log("Parsed profileStats:", window.AppState.profileStats);
    console.log("Parsed bpRecords count:", window.AppState.bpRecords.length);
    console.log("Parsed goodHabits count:", window.AppState.goodHabits.length);
    console.log("Parsed badHabits count:", window.AppState.badHabits.length);
    console.log("Parsed symptomLogs count:", window.AppState.symptomLogs.length);
    console.log("Parsed weightLogs count:", window.AppState.weightLogs.length);

    // default filtered = all
    window.AppState.filteredBpRecords = [...window.AppState.bpRecords];

    // setup filters + initial render
    setupDashboardFilters();
    window.updateDashboardFilter();

  } catch (err) {
    console.error("loadDashboardData error:", err);
    throw err;
  }
};

// ===============================
// FILTER HELPERS
// ===============================

function setupDashboardFilters() {
  const startInput = document.getElementById("dash-start");
  const endInput = document.getElementById("dash-end");
  const btns = document.querySelectorAll(".quick-filter-btn");

  if (!startInput || !endInput) return;

  function setActiveButton(btn) {
    btns.forEach(b => {
      b.classList.remove("bg-brand-500", "text-white", "shadow-md", "border-transparent");
      b.classList.add("border-slate-200", "text-slate-500", "bg-white");
    });
    if (btn) {
      btn.classList.remove("border-slate-200", "text-slate-500", "bg-white");
      btn.classList.add("bg-brand-500", "text-white", "shadow-md", "border-transparent");
    }
  }

  function applyQuickFilter(key, btn) {
    const now = new Date();
    let start;

    if (key === "this-month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (key === "last-3-months") {
      start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    } else if (key === "this-year") {
      start = new Date(now.getFullYear(), 0, 1);
    } else {
      start = new Date("2020-01-01");
    }

    startInput.value = key === "all-time" ? "" : start.toISOString().split("T")[0];
    endInput.value = now.toISOString().split("T")[0];

    setActiveButton(btn);
    window.updateDashboardFilter();
  }

  btns.forEach(b => {
    b.addEventListener("click", () => {
      const key = b.getAttribute("data-filter");
      applyQuickFilter(key, b);
    });
  });

  [startInput, endInput].forEach(input => {
    input.addEventListener("change", () => {
      // manual date change clears quick-filter styles
      setActiveButton(null);
      window.updateDashboardFilter();
    });
  });

  // default = this month
  const defaultBtn = document.querySelector('.quick-filter-btn[data-filter="this-month"]');
  if (defaultBtn) applyQuickFilter("this-month", defaultBtn);
}

// Triggered on filter change
window.updateDashboardFilter = function () {
  const recs = window.AppState.bpRecords || [];
  const startVal = document.getElementById("dash-start")?.value;
  const endVal = document.getElementById("dash-end")?.value;

  const s = startVal ? new Date(startVal) : new Date("2000-01-01");
  const e = endVal ? new Date(endVal + "T23:59") : new Date();

  window.AppState.filteredBpRecords = recs.filter(r => {
    const d = new Date(r.date);
    return d >= s && d <= e;
  });

  window.renderDashboard();
};

// ===============================
// RENDER DASHBOARD MAIN
// ===============================

window.renderDashboard = function () {
  if (typeof renderAverages === "function") renderAverages();
  if (typeof renderChart === "function") renderChart();
  if (typeof renderTable === "function") renderTable();
};

// ===============================
// HELPERS FOR STATS
// ===============================

function calcStats(records, key) {
  const vals = records
    .map(r => Number(r[key]))
    .filter(v => v !== null && v !== undefined && v > 0 && !isNaN(v));

  if (!vals.length) return { avg: "-", min: "-", max: "-", count: 0 };

  const sum = vals.reduce((a, b) => a + b, 0);
  return {
    avg: (sum / vals.length).toFixed(0),
    min: Math.min(...vals),
    max: Math.max(...vals),
    count: vals.length
  };
}

function getArrowIndicator(value, type) {
  const val = Number(value);
  if (isNaN(val)) return "";

  if ((type === "sys" && val >= 160) || (type === "dia" && val >= 100)) {
    return '<span class="text-red-500 text-lg font-bold ml-1.5 animate-pulse">↑↑</span>';
  }
  if ((type === "sys" && val >= 140) || (type === "dia" && val >= 90)) {
    return '<span class="text-red-500 text-lg font-bold ml-1.5">↑</span>';
  }
  return "";
}

// ===============================
// AVERAGE CARDS (Goldfish Bento)
// ===============================

window.renderAverages = function () {
  const recs = window.AppState.filteredBpRecords || [];
  const C = document.getElementById("dash-stats");

  if (!C) return;

  if (!recs.length) {
    C.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <p>ไม่พบข้อมูลในช่วงเวลานี้</p>
      </div>
    `;
    return;
  }

  const morningRecs = recs.filter(r => r.time && r.time.includes("เช้า"));
  const eveningRecs = recs.filter(r => r.time && r.time.includes("เย็น"));

  const createCard = (title, mainStats, mornStats, eveStats, theme, type) => {
    const arrowMain = getArrowIndicator(mainStats.avg, type);
    const arrowMorn = getArrowIndicator(mornStats.avg, type);
    const arrowEve = getArrowIndicator(eveStats.avg, type);

    return `
      <div class="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col relative overflow-hidden group">
        <div class="h-1.5 w-full ${theme.bgMain}"></div>
        <div class="p-6 pb-4">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-bold text-slate-700 text-lg">${title}</h3>
            <span class="text-[10px] font-bold tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
              ทั้งหมด ${mainStats.count} ครั้ง
            </span>
          </div>
          <div class="flex items-baseline mt-2">
            <span class="text-5xl font-bold ${theme.text} tracking-tight">${mainStats.avg}</span>
            ${arrowMain}
            <span class="text-sm font-medium text-slate-400 ml-2">เฉลี่ย</span>
          </div>
          <div class="mt-2 inline-flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
            <span>ต่ำสุด ${mainStats.min}</span>
            <span class="text-slate-300">•</span>
            <span>สูงสุด ${mainStats.max}</span>
          </div>
        </div>
        <div class="relative h-px bg-slate-100 w-full"></div>
        <div class="grid grid-cols-2 divide-x divide-slate-100 bg-white flex-grow">
          <div class="p-4 text-center group-hover:bg-slate-50/50 transition-colors">
            <div class="text-[10px] text-slate-400 font-bold uppercase mb-1 flex justify-center items-center gap-1">
              🌞 ช่วงเช้า
              <span class="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full ml-1 min-w-[20px]">${mornStats.count}</span>
            </div>
            <div class="flex items-center justify-center">
              <span class="text-xl font-bold text-slate-700">${mornStats.avg}</span>
              ${arrowMorn}
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5">${mornStats.min}-${mornStats.max}</div>
          </div>
          <div class="p-4 text-center group-hover:bg-slate-50/50 transition-colors">
            <div class="text-[10px] text-slate-400 font-bold uppercase mb-1 flex justify-center items-center gap-1">
              🌙 ช่วงเย็น
              <span class="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full ml-1 min-w-[20px]">${eveStats.count}</span>
            </div>
            <div class="flex items-center justify-center">
              <span class="text-xl font-bold text-slate-700">${eveStats.avg}</span>
              ${arrowEve}
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5">${eveStats.min}-${eveStats.max}</div>
          </div>
        </div>
      </div>
    `;
  };

  const sysMain = calcStats(recs, "systolic");
  const sysMorn = calcStats(morningRecs, "systolic");
  const sysEve = calcStats(eveningRecs, "systolic");

  const diaMain = calcStats(recs, "diastolic");
  const diaMorn = calcStats(morningRecs, "diastolic");
  const diaEve = calcStats(eveningRecs, "diastolic");

  const pulseMain = calcStats(recs, "pulse");
  const pulseMorn = calcStats(morningRecs, "pulse");
  const pulseEve = calcStats(eveningRecs, "pulse");

  C.innerHTML =
    createCard("ความดันตัวบน (SYS)", sysMain, sysMorn, sysEve,
      { bgMain: "bg-sys-main", text: "text-sys-main" }, "sys") +
    createCard("ความดันตัวล่าง (DIA)", diaMain, diaMorn, diaEve,
      { bgMain: "bg-dia-main", text: "text-dia-main" }, "dia") +
    createCard("ชีพจร (Pulse)", pulseMain, pulseMorn, pulseEve,
      { bgMain: "bg-pulse-main", text: "text-pulse-main" }, "pulse");
};

// ===============================
// TABLE RENDER (Goldfish style)
// ===============================

window.renderTable = function () {
  const recs = window.AppState.filteredBpRecords || [];
  const body = document.getElementById("dash-table-body");
  const badge = document.getElementById("dash-count");

  if (!body || !badge) return;

  badge.textContent = `${recs.length} รายการ`;

  if (!recs.length) {
    body.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-12 text-slate-300">
          ไม่พบข้อมูล
        </td>
      </tr>
    `;
    return;
  }

  const sorted = [...recs].sort((a, b) => {
    const d1 = new Date(a.date);
    const d2 = new Date(b.date);
    return d2 - d1;
  });

  body.innerHTML = sorted.map(r => {
    const status = window.evaluateBPStatus
      ? window.evaluateBPStatus(r.systolic, r.diastolic)
      : { text: "-", color: "bg-slate-100 text-slate-400" };

    const timeIcon = r.time?.includes("เช้า") ? "🌞" :
      r.time?.includes("เย็น") ? "🌙" : "";

    const dateLabel = window.formatDateThai
      ? window.formatDateThai(r.date)
      : new Date(r.date).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });

    return `
      <tr class="group hover:bg-orange-50/30 transition-colors border-b border-slate-50 last:border-none">
        <td class="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
          ${dateLabel}
        </td>
        <td class="px-6 py-4 text-slate-500 whitespace-nowrap text-xs">
          <span class="px-2 py-1 rounded bg-slate-100 group-hover:bg-white transition-colors flex items-center w-fit gap-1">
            ${timeIcon} ${r.time || "-"}
          </span>
        </td>
        <td class="px-6 py-4 text-center font-bold text-sys-main">${r.systolic ?? "-"}</td>
        <td class="px-6 py-4 text-center font-bold text-dia-main">${r.diastolic ?? "-"}</td>
        <td class="px-6 py-4 text-center font-medium text-pulse-main">${r.pulse ?? "-"}</td>
        <td class="px-6 py-4 text-center">
          <span class="inline-block px-3 py-1 rounded-full text-[10px] tracking-wide shadow-sm ${status.color}">
            ${status.text}
          </span>
        </td>
      </tr>
    `;
  }).join("");
};
