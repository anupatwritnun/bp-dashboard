function renderUserInfo(profile){
    document.getElementById("userInfo").innerHTML = `
        <div class="bg-white p-6 rounded-3xl shadow flex justify-between">
            <div class="flex items-center gap-4">
                <img src="${profile.pictureUrl}" class="w-16 h-16 rounded-2xl" />
                <div>
                    <h3 class="text-lg font-bold">${profile.displayName}</h3>
                    <p class="text-xs text-slate-500">ผู้ใช้ LINE</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-xs text-orange-500 uppercase">Level</p>
                <p id="levelText" class="text-4xl font-black">-</p>
            </div>
        </div>`;
}

function renderStats(data){
    document.getElementById("levelText").innerText = data.level;

    document.getElementById("statsGrid").innerHTML = `
        <div class="bg-orange-50 rounded-3xl p-5 shadow">
            <p class="text-orange-500 text-xs uppercase">Streak</p>
            <p class="text-3xl font-black">${data.streak} วัน</p>
        </div>

        <div class="bg-cyan-50 rounded-3xl p-5 shadow">
            <p class="text-cyan-600 text-xs uppercase">Total Log</p>
            <p class="text-3xl font-black">${data.totalLog} ครั้ง</p>
        </div>
    `;
}

function renderShareStats(data){
    document.getElementById("shareLevel").innerText = data.level;
    document.getElementById("shareStreak").innerText = data.streak + " วัน";
}
