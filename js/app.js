// ===== Global app state =====
window.AppState = {
  userId: null,
  profile: null,
  bpRecords: [],     // dashboard.js จะใช้
  profileStats: null // profile.js จะใช้
};

// ===== Simple SPA Router =====
function navigate(page) {
  const pages = document.querySelectorAll(".page");
  pages.forEach(p => p.classList.remove("page-active"));

  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add("page-active");

  // update bottom nav active style
  document.querySelectorAll("nav [data-nav]").forEach(btn => {
    if (btn.getAttribute("data-nav") === page) {
      btn.classList.add("text-orange-500", "font-semibold");
    } else {
      btn.classList.remove("text-orange-500", "font-semibold");
    }
  });
}

function printDashboard() {
  window.print();
}

// ===== LIFF + App Init =====
async function initApp() {
  const loader = document.getElementById("global-loader");
  const loaderText = document.getElementById("global-loader-text");

  try {
    loaderText.textContent = "กำลังเชื่อมต่อ LINE...";
    await liff.init({ liffId: "2008641952-nWd4qpk6" });

    if (!liff.isLoggedIn()) {
      return liff.login({ redirectUri: window.location.href });
    }

    loaderText.textContent = "กำลังโหลดโปรไฟล์...";
    const profile = await liff.getProfile();
    AppState.userId = profile.userId;
    AppState.profile = profile;

    // แสดงชื่อบน navbar
    document.getElementById("nav-username").textContent = profile.displayName || "ผู้ใช้ LINE";

    // โหลดข้อมูล dashboard
    loaderText.textContent = "กำลังโหลดข้อมูล Dashboard...";
    await loadDashboardData(); // จาก dashboard.js

    // โหลดข้อมูลโปรไฟล์ (LV/EXP/streak/totalLog)
    loaderText.textContent = "กำลังโหลดข้อมูลโปรไฟล์...";
    await loadProfileStats(); // จาก profile.js

    // Render หน้า
    renderDashboard();  // dashboard.js
    renderProfile();    // profile.js

    // default page = profile
    navigate("profile");

  } catch (err) {
    console.error("initApp error", err);
    alert("โหลดระบบไม่สำเร็จ");
  } finally {
    loader.style.display = "none";
  }
}

// สำหรับปุ่มรีเฟรช dashboard
async function refreshDashboard() {
  if (!AppState.userId) return;
  const btn = event?.target;
  if (btn) {
    btn.disabled = true;
    btn.textContent = "กำลังโหลด...";
  }
  await loadDashboardData();
  renderDashboard();
  if (btn) {
    btn.disabled = false;
    btn.textContent = "รีเฟรชข้อมูล";
  }
}

// Start app
window.addEventListener("load", initApp);
