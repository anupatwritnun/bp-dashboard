// ===============================
// UTILS & HELPERS
// ===============================

// Helper to format date
window.formatDateThai = function (dateStr) {
    const d = new Date(dateStr);
    const months = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
};

/**
 * Evaluate Blood Pressure Status
 * Returns { text, color }
 */
window.evaluateBPStatus = function (sys, dia) {
    const s = Number(sys);
    const d = Number(dia);

    // 1. Crisis (อันตราย)
    // เงื่อนไข: ตัวบน > 180 หรือ ตัวล่าง > 120
    if (s > 180 || d > 120) {
        if (s > 180 && d > 120) {
            return { text: "อันตราย", color: "bg-red-500 text-white" };
        }
        if (s > 180) {
            return { text: "ความดันตัวบนอยู่ในเกณฑ์อันตราย", color: "bg-red-500 text-white" }; // Long text, maybe truncate in UI if needed?
        }
        return { text: "ความดันตัวล่างอยู่ในเกณฑ์อันตราย", color: "bg-red-500 text-white" };
    }

    // 2. Stage 2 (สูงมาก)
    // เงื่อนไข: ตัวบน ≥ 140 หรือ ตัวล่าง ≥ 90
    if (s >= 140 || d >= 90) {
        if (s >= 140 && d >= 90) {
            return { text: "สูงมาก", color: "bg-orange-500 text-white" };
        }
        if (s >= 140) {
            return { text: "ความดันตัวบนสูงมาก", color: "bg-orange-500 text-white" };
        }
        return { text: "ความดันตัวล่างสูงมาก", color: "bg-orange-500 text-white" };
    }

    // 3. Stage 1 (สูง)
    // เงื่อนไข: ตัวบน 130–139 หรือ ตัวล่าง 80–89
    // (Note: Since we filtered out >=140/>=90 above, we just check >=130 or >=80 here)
    if (s >= 130 || d >= 80) {
        if (s >= 130 && d >= 80) {
            return { text: "สูง", color: "bg-yellow-400 text-slate-800" };
        }
        if (s >= 130) {
            return { text: "ความดันตัวบนสูง", color: "bg-yellow-400 text-slate-800" };
        }
        return { text: "ความดันตัวล่างสูง", color: "bg-yellow-400 text-slate-800" };
    }

    // 4. Elevated (เริ่มเสี่ยง)
    // เงื่อนไข: ตัวบน 120–129 และ ตัวล่าง < 80
    if (s >= 120 && d < 80) {
        return { text: "เริ่มเสี่ยง", color: "bg-yellow-200 text-yellow-800" };
    }

    // 5. Normal (ปกติ)
    // เงื่อนไข: ตัวบน < 120 และ ตัวล่าง < 80
    if (s < 120 && d < 80) {
        return { text: "ปกติฮะ", color: "bg-green-100 text-green-700" };
    }

    // Fallback?
    return { text: "-", color: "bg-slate-100 text-slate-400" };
};
