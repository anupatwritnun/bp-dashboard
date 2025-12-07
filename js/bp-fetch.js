async function loadBpData(userId) {
    try {
        const res = await fetch("https://n8n.srv1159869.hstgr.cloud/webhook/bp-dashboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId })
        });

        const data = await res.json();

        window.allBpRecords = data.map(r => ({
            date: r.date,
            time: r.period ?? r.time ?? "-",
            systolic: Number(r.systolic) || null,
            diastolic: Number(r.diastolic) || null,
            pulse: Number(r.pulse) || null
        }));

    } catch (err) {
        console.error(err);
        alert("โหลดข้อมูลไม่สำเร็จ");
    } finally {
        document.getElementById("loading-screen").style.display = "none";
    }
}
