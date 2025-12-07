function calculateStats(records, key) {
    const vals = records
        .map(r => Number(r[key]))
        .filter(v => v && v > 0);

    if (!vals.length) return { avg: "-", min: "-", max: "-", count: 0 };

    const sum = vals.reduce((a, b) => a + b, 0);

    return {
        avg: (sum / vals.length).toFixed(0),
        min: Math.min(...vals),
        max: Math.max(...vals),
        count: vals.length
    };
}

function getStatus(sys, dia) {
    if (!sys || !dia) return { text: "-", color: "text-slate-400" };

    if (sys >= 180 || dia >= 110) return { text: "อันตราย", color: "text-red-600" };
    if (sys >= 160 || dia >= 100) return { text: "สูงมาก", color: "text-orange-600" };
    if (sys >= 140 || dia >= 90) return { text: "สูง", color: "text-amber-600" };
    if (sys >= 130 || dia >= 80) return { text: "เริ่มสูง", color: "text-yellow-600" };

    return { text: "ปกติ", color: "text-emerald-600" };
}
