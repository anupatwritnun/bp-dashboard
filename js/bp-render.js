function renderDashboard() {
    renderAverages();
    renderChart();
    renderTable();
}

function renderAverages() {
    const box = document.getElementById("average-bento");
    const rec = window.filteredBpRecords;

    if (!rec.length) {
        box.innerHTML = "<p class='text-center text-slate-400 py-6'>ไม่พบข้อมูล</p>";
        return;
    }

    const morning = rec.filter(r => r.time.includes("เช้า"));
    const evening = rec.filter(r => r.time.includes("เย็น"));

    const card = (title, stats, color) => `
        <div class="p-4 rounded-xl border">
            <h3 class="font-bold mb-2">${title}</h3>
            <p class="text-4xl font-bold ${color}">${stats.avg}</p>
            <p class="text-xs text-slate-500">${stats.min} - ${stats.max}</p>
        </div>
    `;

    box.innerHTML = `
        ${card("SYS", calculateStats(rec, "systolic"), "text-pink-500")}
        ${card("DIA", calculateStats(rec, "diastolic"), "text-sky-500")}
        ${card("Pulse", calculateStats(rec, "pulse"), "text-amber-700")}
    `;
}

function renderChart() {
    const ctx = document.getElementById("bpLineChart").getContext("2d");

    if (window.bpChart) window.bpChart.destroy();

    const rec = window.filteredBpRecords;

    const byDate = {};
    rec.forEach(r => {
        if (!byDate[r.date]) byDate[r.date] = [];
        byDate[r.date].push(r);
    });

    const dates = Object.keys(byDate).sort();

    const avg = (arr, k) => {
        const v = arr.map(x => x[k]).filter(x => x);
        return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
    };

    window.bpChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: dates,
            datasets: [
                { label: "SYS", data: dates.map(d => avg(byDate[d], "systolic")), borderColor: "#ec4899" },
                { label: "DIA", data: dates.map(d => avg(byDate[d], "diastolic")), borderColor: "#0ea5e9" },
                { label: "Pulse", data: dates.map(d => avg(byDate[d], "pulse")), borderColor: "#92400e" }
            ]
        },
        options: { responsive: true }
    });
}

function renderTable() {
    const TB = document.getElementById("bp-table-body");
    const rec = window.filteredBpRecords;

    document.getElementById("record-count-badge").innerText = `${rec.length} รายการ`;

    TB.innerHTML = rec.map(r => {
        const st = getStatus(r.systolic, r.diastolic);
        return `
        <tr>
            <td>${r.date}</td>
            <td>${r.time}</td>
            <td>${r.systolic ?? "-"}</td>
            <td>${r.diastolic ?? "-"}</td>
            <td>${r.pulse ?? "-"}</td>
            <td class="${st.color}">${st.text}</td>
        </tr>
        `;
    }).join("");
}
