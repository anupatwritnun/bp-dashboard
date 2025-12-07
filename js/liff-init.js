async function initLIFF() {
    try {
        await liff.init({ liffId: "2008641952-nWd4qpk6" });

        if (!liff.isLoggedIn()) {
            return liff.login({
                redirectUri: window.location.href
            });
        }

        const profile = await liff.getProfile();
        window.userId = profile.userId;

        // ให้ dashboard ใช้งานต่อ
        if (typeof onLiffReady === "function") {
            onLiffReady(profile);
        }

    } catch (err) {
        console.error(err);
        alert("โหลด LIFF ไม่สำเร็จ");
    }
}

initLIFF();
