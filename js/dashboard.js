let bpChart = null;

// เรียกจาก app.js
async function loadDashboardData() {
  const userId = AppState.userId;
  if (!userId) return;

  const start = document.getElementById("dash-start").value || null;
  const end = document.getElementById("dash-end").value || null;

  const body = { userId };
  if (start) body.startDate = start;
  if (end) body.endDate = end;

  const res = await fetch("https://n8n.srv1159869.hstgr.cloud/webhook/bp-dashboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  AppState.bpRecords = data.map(r => ({
    date: r.date,
    time: r.period ?? r.time ?? "-",
    systolic: r.systolic ? Number(r.systolic) : null,
    diastolic: r.diastolic ? Number(r.diastolic) : null,
    pulse: r.pulse ? Number(r.pulse) : null
  }));
}

function calcStats(records, key) {
  const vals = records.map(r => Number(r[key])).filter(v => v && v > 0);
  if (!vals.length) return { avg: "-", min: "-", max: "-", count: 0 };
  const sum = vals.reduce((a, b) => a + b, 0);
  return {
    avg: (sum / vals.length).toFixed(0),
    min: Math.min(...vals),
    max: Math.max(...vals),
    count: vals.length
  };
}

// render ทั้ง dashboard (cards + chart + table)
function renderDashboard() {
  const records = AppState.bpRecords || [];

  // Stats cards
  const statsEl = document.getElementById("dash-stats");
  if (!records.length) {
    statsEl.innerHTML = `<div class="col-span-full text-center text-xs text-slate-400 py-6">ยังไม่มีข้อมูลความดัน</div>`;
  } else {
    const sys = calcStats(records, "systolic");
    const dia = calcStats(records, "diastolic");
    const pulse = calcStats(records, "pulse");

    const card = (label, stat, color) => `
      <div class="bg-white rounded-2xl p-3 shadow border border-slate-100">
        <p class="text-[11px] text-slate-400 mb-1">${label}</p>
        <p class="text-2xl font-bold ${color}">${stat.avg}</p>
        <p class="text-[11px] text-slate-400">${stat.min} - ${stat.max} | ${stat.count} ครั้ง</p>
      </div>`;

    statsEl.innerHTML =
      card("SYS (ความดันตัวบน)", sys, "text-pink-500") +
      card("DIA (ความดันตัวล่าง)", dia, "text-sky-500") +
      card("ชีพจร", pulse, "text-amber-700");
  }

  // Chart
  const ctx = document.getElementById("bpLineChart").getContext("2d");
  if (bpChart) bpChart.destroy();

  const byDate = {};
  records.forEach(r => {
    if (!byDate[r.date]) byDate[r.date] = [];
    byDate[r.date].push(r);
  });
  const dates = Object.keys(byDate).sort();
  const avg = (arr, key) => {
    const vs = arr.map(r => r[key]).filter(v => v);
    if (!vs.length) return null;
    return vs.reduce((a, b) => a + b, 0) / vs.length;
  };

  bpChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: "SYS",
          data: dates.map(d => avg(byDate[d], "systolic")),
          borderColor: "#ec4899",
          tension: 0.3
        },
        {
          label: "DIA",
          data: dates.map(d => avg(byDate[d], "diastolic")),
          borderColor: "#0ea5e9",
          tension: 0.3
        },
        {
          label: "Pulse",
          data: dates.map(d => avg(byDate[d], "pulse")),
          borderColor: "#92400e",
          borderDash: [4, 4],
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });

  // Table
  const tbody = document.getElementById("dash-table-body");
  const countEl = document.getElementById("dash-count");
  countEl.textContent = `${records.length} รายการ`;

  if (!records.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-xs text-slate-400 py-4">ไม่มีข้อมูล</td></tr>`;
  } else {
    const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
    tbody.innerHTML = sorted.map(r => `
      <tr class="border-b border-slate-100">
        <td class="px-2 py-1">${r.date}</td>
        <td class="px-2 py-1">${r.time}</td>
        <td class="px-2 py-1 text-center">${r.systolic ?? "-"}</td>
        <td class="px-2 py-1 text-center">${r.diastolic ?? "-"}</td>
        <td class="px-2 py-1 text-center">${r.pulse ?? "-"}</td>
      </tr>
    `).join("");
  }
}
