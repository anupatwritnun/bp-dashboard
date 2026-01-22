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

// ===== Save Dashboard + Health Summary as PDF =====
window.saveDashboardPDF = async function () {
  const btn = event?.target?.closest('button');
  let originalHTML = '';

  // Show loading feedback
  if (btn) {
    originalHTML = btn.innerHTML;
    btn.innerHTML = '📄 กำลังสร้าง PDF...';
    btn.disabled = true;
  }

  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      alert('ไม่สามารถโหลด PDF library ได้');
      return;
    }

    // Create PDF in A4 size
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    // Hide no-print elements
    const noPrintElements = document.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.style.visibility = 'hidden');

    // ===== Temporarily remove shadows and blur for clean PDF =====
    const elementsWithShadow = document.querySelectorAll('[class*="shadow"], [class*="blur"]');
    const originalStyles = [];
    elementsWithShadow.forEach((el, index) => {
      originalStyles[index] = {
        boxShadow: el.style.boxShadow,
        filter: el.style.filter
      };
      el.style.boxShadow = 'none';
      el.style.filter = 'none';
    });

    // Also handle elements with backdrop-blur
    const backdropElements = document.querySelectorAll('[class*="backdrop"]');
    const backdropOriginal = [];
    backdropElements.forEach((el, index) => {
      backdropOriginal[index] = el.style.backdropFilter;
      el.style.backdropFilter = 'none';
    });

    // ===== Capture Dashboard (ภาพรวม) =====
    const dashboardPage = document.getElementById('page-dashboard');
    if (dashboardPage) {
      // Temporarily show the dashboard
      const wasActive = dashboardPage.classList.contains('page-active');
      dashboardPage.classList.add('page-active');
      dashboardPage.style.display = 'block';

      const dashboardCanvas = await html2canvas(dashboardPage, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fdfbf7',
        logging: false,
        windowWidth: 800,
      });

      // Calculate dimensions to fit page
      const dashImgData = dashboardCanvas.toDataURL('image/jpeg', 0.95);
      const dashRatio = dashboardCanvas.height / dashboardCanvas.width;
      const dashImgWidth = contentWidth;
      const dashImgHeight = dashImgWidth * dashRatio;

      // Add dashboard image (may span multiple pages)
      let yPosition = margin;
      let remainingHeight = dashImgHeight;
      let sourceY = 0;

      while (remainingHeight > 0) {
        const availableHeight = pageHeight - margin - yPosition;
        const sliceHeight = Math.min(remainingHeight, availableHeight);
        const sliceRatio = sliceHeight / dashImgHeight;

        // Create a temp canvas for this slice
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = dashboardCanvas.width;
        sliceCanvas.height = dashboardCanvas.height * sliceRatio;
        const sliceCtx = sliceCanvas.getContext('2d');
        sliceCtx.drawImage(
          dashboardCanvas,
          0, sourceY * (dashboardCanvas.height / dashImgHeight),
          dashboardCanvas.width, sliceCanvas.height,
          0, 0,
          sliceCanvas.width, sliceCanvas.height
        );

        pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, yPosition, dashImgWidth, sliceHeight);

        sourceY += sliceHeight;
        remainingHeight -= sliceHeight;

        if (remainingHeight > 0) {
          pdf.addPage();
          yPosition = margin;
        }
      }

      if (!wasActive) {
        dashboardPage.classList.remove('page-active');
        dashboardPage.style.display = '';
      }
    }

    // ===== Capture Health Summary (สรุปสุขภาพ) =====
    const healthSummaryPage = document.getElementById('page-health-summary');
    if (healthSummaryPage) {
      // Initialize health summary if not already done
      if (window.initHealthSummary) {
        await window.initHealthSummary();
      }

      // Temporarily show the health summary
      const wasActive = healthSummaryPage.classList.contains('page-active');
      healthSummaryPage.classList.add('page-active');
      healthSummaryPage.style.display = 'block';

      // Small delay to let it render
      await new Promise(resolve => setTimeout(resolve, 300));

      const healthCanvas = await html2canvas(healthSummaryPage, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fdfbf7',
        logging: false,
        windowWidth: 800,
      });

      // Add new page for health summary
      pdf.addPage();

      const healthImgData = healthCanvas.toDataURL('image/jpeg', 0.95);
      const healthRatio = healthCanvas.height / healthCanvas.width;
      const healthImgWidth = contentWidth;
      const healthImgHeight = healthImgWidth * healthRatio;

      // Add health summary image (may span multiple pages)
      let yPosition = margin;
      let remainingHeight = healthImgHeight;
      let sourceY = 0;

      while (remainingHeight > 0) {
        const availableHeight = pageHeight - margin - yPosition;
        const sliceHeight = Math.min(remainingHeight, availableHeight);
        const sliceRatio = sliceHeight / healthImgHeight;

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = healthCanvas.width;
        sliceCanvas.height = healthCanvas.height * sliceRatio;
        const sliceCtx = sliceCanvas.getContext('2d');
        sliceCtx.drawImage(
          healthCanvas,
          0, sourceY * (healthCanvas.height / healthImgHeight),
          healthCanvas.width, sliceCanvas.height,
          0, 0,
          sliceCanvas.width, sliceCanvas.height
        );

        pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, yPosition, healthImgWidth, sliceHeight);

        sourceY += sliceHeight;
        remainingHeight -= sliceHeight;

        if (remainingHeight > 0) {
          pdf.addPage();
          yPosition = margin;
        }
      }

      if (!wasActive) {
        healthSummaryPage.classList.remove('page-active');
        healthSummaryPage.style.display = '';
      }
    }

    // Restore no-print elements
    noPrintElements.forEach(el => el.style.visibility = 'visible');

    // ===== Restore shadows and blur effects =====
    elementsWithShadow.forEach((el, index) => {
      el.style.boxShadow = originalStyles[index]?.boxShadow || '';
      el.style.filter = originalStyles[index]?.filter || '';
    });
    backdropElements.forEach((el, index) => {
      el.style.backdropFilter = backdropOriginal[index] || '';
    });

    // Create filename with date
    const today = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    const filename = `BP_Report_${today}.pdf`;

    // Save the PDF
    pdf.save(filename);

  } catch (err) {
    console.error('Failed to create PDF:', err);
    alert('ไม่สามารถสร้าง PDF ได้ กรุณาลองใหม่');

    // Restore styles on error
    try {
      document.querySelectorAll('.no-print').forEach(el => el.style.visibility = 'visible');
      document.querySelectorAll('[class*="shadow"], [class*="blur"]').forEach(el => {
        el.style.boxShadow = '';
        el.style.filter = '';
      });
      document.querySelectorAll('[class*="backdrop"]').forEach(el => {
        el.style.backdropFilter = '';
      });
    } catch (e) { }
  } finally {
    // Restore button
    if (btn) {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  }
};

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
