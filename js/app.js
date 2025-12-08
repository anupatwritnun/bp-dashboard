// ===== Global app state =====
window.AppState = {
  userId: null,
  profile: null,
  bpRecords: [],
  profileStats: null
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

// ===== LIFF + APP INIT =====
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

    document.getElementById("nav-username").textContent = profile.displayName || "ผู้ใช้ LINE";

    // Load dashboard data
    loaderText.textContent = "กำลังโหลดข้อมูล Dashboard...";
    await loadDashboardData(); // must exist in dashboard.js

    // Render dashboard UI
    renderDashboard();  

    // Profile page script runs automatically from profile.js (initProfilePage)

    navigate("profile");

  } catch (err) {
    console.error("initApp error", err);
    alert("โหลดระบบไม่สำเร็จ");
  } finally {
    loader.style.display = "none";
  }
}

// Refresh dashboard
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
