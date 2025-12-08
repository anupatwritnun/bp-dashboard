// ===== Global app state =====
window.AppState = {
  userId: null,
  profile: null,        // LINE profile (displayName, pictureUrl)
  bpRecords: [],        // from n8n -> records[]
  profileStats: null    // from n8n -> profile{}
};

// ===== Simple SPA Router =====
function navigate(page) {
  const pages = document.querySelectorAll(".page");
  pages.forEach(p => p.classList.remove("page-active"));

  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add("page-active");

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

// ===== LIFF + APP INIT =====
async function initApp() {
  const loader = document.getElementById("global-loader");
  const loaderText = document.getElementById("global-loader-text");

  try {
    loaderText.textContent = "กำลังเชื่อมต่อ LINE...";
    await liff.init({ liffId: "2008652706-EZVkykgG" });

    if (!liff.isLoggedIn()) {
      return liff.login({ redirectUri: window.location.href });
    }

    loaderText.textContent = "กำลังโหลดโปรไฟล์...";
    const profile = await liff.getProfile();
    AppState.userId = profile.userId;
    AppState.profile = profile;

    document.getElementById("nav-username").textContent =
      profile.displayName || "ผู้ใช้ LINE";

    // เรียก n8n เพื่อดึง profile + records
    loaderText.textContent = "กำลังโหลดข้อมูลจากเซิร์ฟเวอร์...";
    await loadDashboardData();   // จาก dashboard.js (ดูด้านล่าง)

    // render ทั้ง Dashboard + Profile จาก AppState
    renderDashboard();           // dashboard.js
    renderProfile();             // profile.js

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

window.addEventListener("load", initApp);
