async function initLIFF() {
    try {
        await liff.init({ liffId: "2008641952-nWd4qpk6" });

        if (!liff.isLoggedIn()) return liff.login();

        const profile = await liff.getProfile();
        window.userId = profile.userId;

        document.querySelector("#loading-screen p").innerText = "กำลังโหลดข้อมูล...";
        await loadBpData(profile.userId);

        setupFilters();
    } catch (err) {
        console.error(err);
        alert("ไม่สามารถโหลด LIFF");
    }
}
