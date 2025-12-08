// ===== DASHBOARD.JS =====
const API_URL = "https://n8n.srv1159869.hstgr.cloud/webhook/bp-dashboard";

async function loadDashboardData() {
  if (!AppState.userId) return;

  const url = `${API_URL}?user_id=${encodeURIComponent(AppState.userId)}`;
  const res = await fetch(url);
  const data = await res.json();

  // expected structure from n8n code node:
  // { profile: {...}, records: [...] }
  AppState.profileStats = data.profile || null;
  AppState.bpRecords = data.records || [];
}

function renderDashboard() {
  const records = AppState.bpRecords || [];

  // count
  const countEl = document.getElementById("dash-count");
  if (countEl) {
    countEl.textContent = `${records.length} รายการ`;
  }

  // table
  const tbody = document.getElementById("dash-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  records.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-2 py-1">${r.date}</td>
      <td class="px-2 py-1">${r.time}</td>
      <td class="px-2 py-1 text-center">${r.systolic ?? "-"}</td>
      <td class="px-2 py-1 text-center">${r.diastolic ?? "-"}</td>
      <td class="px-2 py-1 text-center">${r.pulse ?? "-"}</td>
    `;
    tbody.appendChild(tr);
  });

  // TODO: เชื่อม Chart.js ที่ bpLineChart จาก records ถ้าต้องการ
}

window.loadDashboardData = loadDashboardData;
window.renderDashboard = renderDashboard;
