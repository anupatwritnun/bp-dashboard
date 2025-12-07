// dummy fish styles
const fishTypes = [
  { id: 0, name: "ทองอุไร", primary: "#fbbf24", secondary: "#ea580c" },
  { id: 1, name: "สามสี", primary: "#e2e8f0", secondary: "#ef4444" },
  { id: 2, name: "นิลดำ", primary: "#475569", secondary: "#1e293b" }
];

let currentFishIndex = 0;

// เรียกจาก app.js
async function loadProfileStats() {
  const userId = AppState.userId;
  if (!userId) return;

  // TODO: เปลี่ยน URL ให้ตรงกับ n8n ของคุณ
  const res = await fetch("https://n8n.srv1159869.hstgr.cloud/webhook/bp-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  // คาดว่า data = { level, exp, streak, totalLog }
  AppState.profileStats = data;
}

function renderProfile() {
  const profile = AppState.profile;
  const stats = AppState.profileStats || { level: "-", exp: 0, streak: 0, totalLog: 0 };
  if (!profile) return;

  // User card
  const cardEl = document.getElementById("profile-card");
  cardEl.innerHTML = `
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-3">
        <img src="${profile.pictureUrl || ""}" class="w-14 h-14 rounded-2xl object-cover bg-slate-200" />
        <div>
          <p class="text-sm font-bold text-slate-800">${profile.displayName || "ผู้ใช้ LINE"}</p>
          <p class="text-[11px] text-slate-400">เพื่อนของปลาท๊องง</p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-[10px] text-orange-500 uppercase">Level</p>
        <p class="text-3xl font-black text-slate-900">${stats.level}</p>
      </div>
    </div>
  `;

  // Stats box
  const statsEl = document.getElementById("profile-stats");
  statsEl.innerHTML = `
    <div class="bg-orange-50 border border-orange-100 rounded-3xl p-4">
      <p class="text-[11px] text-orange-500 uppercase mb-1">Streak</p>
      <p class="text-2xl font-bold text-slate-900">${stats.streak} <span class="text-xs text-slate-500">วัน</span></p>
    </div>
    <div class="bg-cyan-50 border border-cyan-100 rounded-3xl p-4">
      <p class="text-[11px] text-cyan-600 uppercase mb-1">Total Log</p>
      <p class="text-2xl font-bold text-slate-900">${stats.totalLog} <span class="text-xs text-slate-500">ครั้ง</span></p>
    </div>
  `;

  renderProfileFish();
}

// วาดปลาท๊องง + ปุ่มเลือก
function renderProfileFish() {
  const container = document.getElementById("profile-fish");
  const fish = fishTypes[currentFishIndex];

  container.innerHTML = `
    <div class="flex justify-between gap-3 items-center">
      <div class="flex-1">
        <p class="text-[11px] text-slate-500 uppercase mb-1">เพื่อนดูแลใจ</p>
        <p class="text-lg font-bold text-slate-800 mb-2">${fish.name}</p>
        <p class="text-xs text-slate-500 mb-3">เลือกปลาที่ถูกใจ แล้วจดบันทึกต่อเนื่องเพื่อเลเวลอัป</p>
        <div class="flex gap-2">
          ${fishTypes.map((f, idx) => `
            <button
              onclick="selectFish(${idx})"
              class="w-7 h-7 rounded-full border-2 ${idx === currentFishIndex ? "border-orange-500 scale-110" : "border-transparent opacity-60"}"
              style="background:${f.primary}">
            </button>
          `).join("")}
        </div>
      </div>
      <div class="w-32 h-24 relative animate-[swim_4s_ease-in-out_infinite]">
        <div class="absolute -right-6 top-1/2 -translate-y-1/2 border-y-[10px] border-y-transparent border-l-[26px]" style="border-left-color:${fish.secondary}; animation: wag 1s infinite;"></div>
        <div class="absolute inset-0 rounded-[50%]" style="background: radial-gradient(circle at 30% 30%, ${fish.primary}, ${fish.secondary});"></div>
        <div class="absolute left-4 top-3 w-5 h-5 bg-white rounded-full flex items-center justify-center">
          <div class="w-2.5 h-2.5 bg-slate-900 rounded-full"></div>
        </div>
      </div>
    </div>
  `;
}

function selectFish(idx) {
  currentFishIndex = idx;
  renderProfileFish();
}

// ====== Share Modal (simple version) ======
function openShareModal() {
  const stats = AppState.profileStats || { level: "-", streak: "-" };
  const modal = document.createElement("div");
  modal.id = "share-modal";
  modal.className = "fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4";
  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-sm p-4 space-y-3">
      <div class="flex justify-between items-center">
        <h3 class="font-bold text-slate-800 text-sm">แชร์ความสำเร็จ</h3>
        <button onclick="closeShareModal()" class="text-slate-400 text-sm">✕</button>
      </div>
      <div id="share-card" class="bg-gradient-to-b from-cyan-50 to-white rounded-2xl p-4 text-center shadow">
        <p class="text-xs text-slate-500 mb-1">ปลาท๊องง</p>
        <p class="text-base font-bold mb-2">Level ${stats.level}</p>
        <p class="text-xs text-slate-500 mb-4">ต่อเนื่อง ${stats.streak} วัน</p>
        <div class="flex justify-center">
          <!-- reuse fish display -->
          <div class="w-28 h-20 relative">
            <!-- จะใช้ html2canvas แคปทั้งกล่อง -->
          </div>
        </div>
      </div>
      <button onclick="shareImage()" class="w-full bg-green-500 text-white text-sm py-2.5 rounded-xl font-semibold">
        แชร์ไปยัง LINE / Apps อื่น
      </button>
    </div>
  `;
  document.body.appendChild(modal);
}

function closeShareModal() {
  document.getElementById("share-modal")?.remove();
}

async function shareImage() {
  const card = document.getElementById("share-card");
  if (!card) return;
  const canvas = await html2canvas(card, { scale: 2 });
  const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
  const file = new File([blob], "plathong-profile.png", { type: "image/png" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: "ปลาท๊องง | สมุดพิทักษ์ใจ",
      text: "มาจดบันทึกความดันด้วยกันสิ",
      files: [file]
    });
  } else {
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "plathong-profile.png";
    a.click();
    alert("บันทึกรูปภาพแล้ว");
  }
}
