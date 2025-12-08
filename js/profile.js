// ===== PROFILE.JS =====

const navUsername = document.getElementById("nav-username");
const profileCard = document.getElementById("profile-card");
const profileStats = document.getElementById("profile-stats");
const profileFish = document.getElementById("profile-fish");

function renderProfile() {
  const line = AppState.profile;
  const p = AppState.profileStats;

  if (!line || !p) {
    profileCard.innerHTML = `
      <p class="text-sm text-slate-500">กำลังโหลดข้อมูลโปรไฟล์...</p>
    `;
    profileStats.innerHTML = "";
    profileFish.innerHTML = "";
    return;
  }

  // --- Profile card (ชื่อ, รูป, LV, XP bar) ---
  const xpPercent = p.xp_percent ?? 0;

  profileCard.innerHTML = `
    <div class="flex gap-4 items-center">
      <img src="${line.pictureUrl}" class="w-16 h-16 rounded-full shadow-md border" />

      <div class="flex-1">
        <h3 class="font-bold text-slate-800 text-lg">${line.displayName}</h3>
        <p class="text-sm text-slate-500">${p.level_name} (LV.${p.level})</p>

        <div class="mt-2 w-full bg-slate-200 rounded-full h-3">
          <div 
            class="h-3 rounded-full bg-orange-500 transition-all" 
            style="width: ${xpPercent}%;"></div>
        </div>
        <p class="text-[11px] text-slate-500 mt-1">
          XP: ${p.xp_total.toLocaleString()} / ${p.xp_range.next.toLocaleString()}
        </p>
      </div>
    </div>
  `;

  // --- Stats tiles ---
  profileStats.innerHTML = `
    <div class="bg-white border border-slate-100 rounded-2xl p-3 shadow">
      <p class="text-xs text-slate-400 mb-1">จำนวนการบันทึก</p>
      <p class="font-bold text-lg">${p.total_log_text}</p>
    </div>

    <div class="bg-white border border-slate-100 rounded-2xl p-3 shadow">
      <p class="text-xs text-slate-400 mb-1">สถิติต่อเนื่อง</p>
      <p class="font-bold text-lg">${p.streak_text}</p>
    </div>
  `;

  // --- Fish section ---
  profileFish.innerHTML = `
    <h3 class="text-sm font-bold text-slate-700 mb-2">ระดับการเติบโตของปลาท๊องง</h3>

    <div class="relative w-full h-32 flex items-center justify-center">
      <div class="relative w-40 h-24 animate-[swim_4s_ease-in-out_infinite]">
        <div class="absolute -right-6 top-1/2 -translate-y-1/2 border-y-[12px] border-y-transparent border-l-[26px] animate-[wag_1s_infinite]" style="border-left-color:#ea580c;"></div>
        <div class="absolute inset-0 rounded-[50%]" style="background: radial-gradient(circle at 30% 30%, #fed7aa, #f97316);"></div>
        <div class="absolute left-5 top-4 w-6 h-6 bg-white rounded-full flex items-center justify-center">
          <div class="w-3 h-3 bg-slate-900 rounded-full"></div>
        </div>
      </div>
    </div>

    <p class="text-center mt-2 text-sm text-slate-600">
      ตอนนี้ปลาท๊องงของคุณอยู่ที่ <strong>LV.${p.level}</strong>
    </p>
  `;
}

window.renderProfile = renderProfile;
