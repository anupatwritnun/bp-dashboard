// ===== Global app state =====
window.AppState = {
  userId: null,
  profile: null,        // LINE profile (displayName, pictureUrl)
  bpRecords: [],        // from n8n -> records[]
  profileStats: null,   // from n8n -> profile{}
  isSharedView: false,  // true when viewing via shared link
  // Additional data from webhook
  goodHabits: [],       // from n8n -> good_habits[]
  badHabits: [],        // from n8n -> bad_habits[]
  symptomLogs: [],      // from n8n -> symptom_logs[]
  weightLogs: []        // from n8n -> weight_logs[]
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

  // Initialize calendar when navigating to it
  if (page === 'calendar' && window.initCalendar) {
    window.initCalendar();
  }

  // Initialize health summary when navigating to it
  if (page === 'health-summary' && window.initHealthSummary) {
    window.initHealthSummary();
  }
}

// ===== Print / Save Dashboard =====
async function printDashboard() {
  // Check if mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    // Mobile: Generate image and save to files
    await saveDashboardAsImage();
  } else {
    // Desktop: Use native print
    window.print();
  }
}

// ===== Save Dashboard as Image (for mobile) =====
window.saveDashboardAsImage = async function () {
  const dashboardPage = document.getElementById('page-dashboard');
  if (!dashboardPage) return;

  // Show loading feedback
  const btn = event?.target?.closest('button');
  let originalHTML = '';
  if (btn) {
    originalHTML = btn.innerHTML;
    btn.innerHTML = '📸 กำลังสร้างรูป...';
    btn.disabled = true;
  }

  try {
    // Hide elements that shouldn't be in the screenshot
    const noPrintElements = document.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.style.visibility = 'hidden');

    // Use html2canvas to capture the dashboard
    const canvas = await html2canvas(dashboardPage, {
      scale: 2, // Higher resolution
      useCORS: true,
      backgroundColor: '#fdfbf7',
      logging: false,
      windowWidth: 800, // Consistent width for better layout
    });

    // Restore hidden elements
    noPrintElements.forEach(el => el.style.visibility = 'visible');

    // Convert to blob and download
    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert('ไม่สามารถสร้างรูปภาพได้');
        return;
      }

      // Create filename with date
      const today = new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-');
      const filename = `BP_Dashboard_${today}.png`;

      // Try using Web Share API first (better for mobile)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], filename, { type: 'image/png' });
        const shareData = { files: [file] };

        if (navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            return;
          } catch (e) {
            // User cancelled or share failed, fall back to download
            console.log('Share cancelled, falling back to download');
          }
        }
      }

      // Fallback: Direct download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    }, 'image/png', 0.95);

  } catch (err) {
    console.error('Failed to save dashboard:', err);
    alert('ไม่สามารถบันทึกได้ กรุณาลองใหม่');
  } finally {
    // Restore button
    if (btn) {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  }
}

// ===== LIFF + APP INIT =====
async function initApp() {
  const loader = document.getElementById("global-loader");
  const loaderText = document.getElementById("global-loader-text");

  try {
    // ===== CHECK FOR SHARED VIEW MODE FIRST =====
    const urlParams = new URLSearchParams(window.location.search);
    const shareToken = urlParams.get('token');

    if (shareToken) {
      console.log("Detected share token, entering shared view mode...");
      loaderText.textContent = "กำลังตรวจสอบลิงก์แชร์...";

      // Validate token via n8n
      const validation = await window.checkSharedViewMode();

      if (validation.isShared && validation.userId) {
        // Valid token - load shared user's data
        AppState.userId = validation.userId;
        AppState.isSharedView = true;

        // Hide share button in shared view
        const shareBtn = document.querySelector('[onclick="openDashboardShareModal()"]');
        if (shareBtn) shareBtn.style.display = 'none';

        // Update nav to show shared mode
        document.getElementById("nav-username").textContent = "กำลังดู Dashboard ที่แชร์";

        // Load the shared user's data
        loaderText.textContent = "กำลังโหลดข้อมูลที่แชร์...";
        await loadDashboardData();

        // Render dashboard only (no profile in shared view)
        renderDashboard();

        // Show shared view banner
        if (window.renderSharedViewBanner) {
          window.renderSharedViewBanner(validation.expiresAt);
        }

        // Navigate to dashboard
        navigate("dashboard");

        // In shared view: Show Dashboard, Health Summary, Calendar tabs
        // Only hide Profile tab for privacy
        const profileTab = document.querySelector('[data-nav="profile"]');
        if (profileTab) profileTab.style.display = 'none';

        loader.style.display = "none";
        return; // Exit early, don't need LIFF login

      } else {
        // Invalid or expired token
        loader.style.display = "none";
        if (window.renderShareError) {
          window.renderShareError(validation.error || 'Invalid token');
        }
        return;
      }
    }

    // ===== NORMAL LIFF FLOW (No share token) =====
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

    // default page = dashboard
    navigate("dashboard");

    // DEBUG: Auto-open share modal if query param present
    if (urlParams.get('debug_share')) {
      console.log("Debug: Opening share modal...");
      navigate("profile"); // Switch to profile page so they see it
      setTimeout(() => {
        if (window.openShareModal) window.openShareModal();
      }, 500);
    }

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
