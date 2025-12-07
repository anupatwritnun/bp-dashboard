async function initProfile(){
    await liff.init({ liffId:"YOUR_LIFF_ID" });
    if(!liff.isLoggedIn()) return liff.login();

    const profile = await liff.getProfile();

    // render UI
    renderUserInfo(profile);
    
    const res = await fetch("https://YOUR_N8N_URL/webhook/profile", {
        method:"POST",
        headers:{ "Content-Type":"application/json"},
        body:JSON.stringify({ userId: profile.userId })
    });

    const data = await res.json();
    renderStats(data);
    renderShareStats(data);

    // default fish
    setFish(0);
}

initProfile();
