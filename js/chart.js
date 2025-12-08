// ===============================
// chart.js
// BP trend chart (Goldfish style)
// ===============================

let bpChartInstance = null;

window.renderChart = function () {
  const records = (window.AppState && window.AppState.filteredBpRecords) || [];
  const canvas = document.getElementById("bpLineChart");

  if (!canvas) {
    console.warn("bpLineChart not found");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("Canvas context not ready");
    return;
  }

  if (bpChartInstance) {
    bpChartInstance.destroy();
    bpChartInstance = null;
  }

  if (!records.length) {
    console.log("No BP records to display in chart");
    return;
  }

  const grouped = {};
  records.forEach(r => {
    if (!grouped[r.date]) grouped[r.date] = [];
    grouped[r.date].push(r);
  });

  const dates = Object.keys(grouped).sort();

  const avgVal = (arr, key) => {
    const vals = arr
      .map(i => Number(i[key]))
      .filter(x => x && x > 0 && !isNaN(x));
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const COLORS = {
    sys: "#ec4899",   // Pink
    dia: "#0ea5e9",   // Blue
    pulse: "#92400e", // Brown
  };

  bpChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates.map(d =>
        new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short" })
      ),
      datasets: [
        {
          label: "ตัวบน (SYS)",
          data: dates.map(d => avgVal(grouped[d], "systolic")),
          borderColor: COLORS.sys,
          backgroundColor: COLORS.sys,
          borderWidth: 3,
          pointBackgroundColor: "#fff",
          pointBorderColor: COLORS.sys,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
          tension: 0.4
        },
        {
          label: "ตัวล่าง (DIA)",
          data: dates.map(d => avgVal(grouped[d], "diastolic")),
          borderColor: COLORS.dia,
          backgroundColor: COLORS.dia,
          borderWidth: 3,
          pointBackgroundColor: "#fff",
          pointBorderColor: COLORS.dia,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
          tension: 0.4
        },
        {
          label: "ชีพจร (Pulse)",
          data: dates.map(d => avgVal(grouped[d], "pulse")),
          borderColor: COLORS.pulse,
          backgroundColor: COLORS.pulse,
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: "#fff",
          pointBorderColor: COLORS.pulse,
          pointRadius: 3,
          fill: false,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          titleColor: "#334155",
          bodyColor: "#475569",
          borderColor: "#f1f5f9",
          borderWidth: 1,
          padding: 12,
          titleFont: { family: "'Prompt', sans-serif", weight: "600" },
          bodyFont: { family: "'Prompt', sans-serif" },
          displayColors: true
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: "'Prompt', sans-serif" },
            color: "#94a3b8"
          }
        },
        y: {
          grid: {
            color: "#f8fafc",
            borderDash: [5, 5]
          },
          ticks: {
            font: { family: "'Prompt', sans-serif" },
            color: "#94a3b8"
          },
          beginAtZero: false
        }
      }
    }
  });

  setTimeout(() => {
    if (bpChartInstance) bpChartInstance.resize();
  }, 100);
};
