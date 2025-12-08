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

        // MUST match structure from n8n
        window.AppState.profileStats = json.profile;
        window.AppState.bpRecords = json.records || [];

        console.log("Parsed profileStats:", AppState.profileStats);
        console.log("Parsed bpRecords count:", AppState.bpRecords.length);

        // initialize filtered with full set
        window.AppState.filteredBpRecords = [...window.AppState.bpRecords];

    } catch (err) {
        console.error("loadDashboardData error:", err);
        throw err;
    }
};

// ===============================
// RENDER DASHBOARD MAIN
// ===============================

window.renderDashboard = function () {
    const recs = window.AppState.bpRecords || [];
    const filtered = window.AppState.filteredBpRecords || [];

    // Average cards
    if (typeof renderAverages === "function") {
        renderAverages();
    }

    // Chart (from chart.js)
    if (typeof renderChart === "function") {
        renderChart();
    }

    // Table
    if (typeof renderTable === "function") {
        renderTable();
    }
};

// ===============================
// FILTER HELPERS
// ===============================

// Triggered on filter change
window.updateDashboardFilter = function () {
    const recs = window.AppState.bpRecords || [];
    const start = document.getElementById("dash-start").value;
    const end = document.getElementById("dash-end").value;

    const s = start ? new Date(start) : new Date("2000-01-01");
    const e = end ? new Date(end + "T23:59") : new Date();

    window.AppState.filteredBpRecords = recs.filter(r => {
        const d = new Date(r.date);
        return d >= s && d <= e;
    });

    window.renderDashboard();
};

// ===============================
// AVERAGES CARD (SYS/DIA/PULSE)
// ===============================
window.renderAverages = function () {
    const recs = window.AppState.filteredBpRecords || [];
    const C = document.getElementById("dash-stats");

    if (!recs.length) {
        C.innerHTML = `
            <div class="text-center text-slate-400 p-6">
                ไม่พบข้อมูลในช่วงนี้
            </div>
        `;
        return;
    }

    const avg = (key) => {
        const vals = recs.map(r => Number(r[key])).filter(x => x > 0 && !isNaN(x));
        if (!vals.length) return "-";
        return Math.round(vals.reduce((a,b) => a+b, 0) / vals.length);
    };

    C.innerHTML = `
        <div class="bg-white p-4 rounded-2xl shadow border">
            <h3 class="text-sm font-bold text-slate-600">SYS</h3>
            <p class="text-2xl font-bold text-pink-500">${avg("systolic")}</p>
        </div>

        <div class="bg-white p-4 rounded-2xl shadow border">
            <h3 class="text-sm font-bold text-slate-600">DIA</h3>
            <p class="text-2xl font-bold text-blue-500">${avg("diastolic")}</p>
        </div>

        <div class="bg-white p-4 rounded-2xl shadow border">
            <h3 class="text-sm font-bold text-slate-600">Pulse</h3>
            <p class="text-2xl font-bold text-amber-700">${avg("pulse")}</p>
        </div>
    `;
};

// ===============================
// TABLE RENDER
// ===============================
window.renderTable = function () {
    const recs = window.AppState.filteredBpRecords || [];
    const body = document.getElementById("dash-table-body");

    document.getElementById("dash-count").textContent = `${recs.length} รายการ`;

    if (!recs.length) {
        body.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-slate-400 py-4">
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

    body.innerHTML = sorted.map(r => `
        <tr>
            <td class="px-2 py-1">${r.date}</td>
            <td class="px-2 py-1">${r.time}</td>
            <td class="px-2 py-1 text-center">${r.systolic}</td>
            <td class="px-2 py-1 text-center">${r.diastolic}</td>
            <td class="px-2 py-1 text-center">${r.pulse ?? "-"}</td>
        </tr>
    `).join("");
};
