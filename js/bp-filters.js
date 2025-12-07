function setupFilters() {
    const s = document.getElementById("startDate");
    const e = document.getElementById("endDate");

    function apply() {
        const start = s.value ? new Date(s.value) : new Date("2000-01-01");
        const end = e.value ? new Date(e.value + "T23:59") : new Date();

        window.filteredBpRecords = window.allBpRecords.filter(r => {
            const d = new Date(r.date);
            return d >= start && d <= end;
        });

        renderDashboard();
    }

    s.onchange = e.onchange = apply;
    apply();
}
