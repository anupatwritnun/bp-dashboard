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

    // Hide no-print elements completely (use display:none for html2canvas)
    const noPrintElements = document.querySelectorAll('.no-print');
    const noPrintOriginalDisplay = [];
    noPrintElements.forEach((el, index) => {
      noPrintOriginalDisplay[index] = el.style.display;
      el.style.display = 'none';
    });

    // ===== HIDE DECORATIVE BLUR ELEMENTS COMPLETELY =====
    const blurDecorations = document.querySelectorAll('[class*="blur-3xl"], [class*="blur-2xl"]');
    const blurOriginal = [];
    blurDecorations.forEach((el, index) => {
      blurOriginal[index] = el.style.display;
      el.style.display = 'none';
    });

    // ===== INJECT TEMPORARY STYLE TO OVERRIDE GLASSMORPHISM =====
    const pdfStyleFix = document.createElement('style');
    pdfStyleFix.id = 'pdf-style-fix';
    pdfStyleFix.textContent = `
      /* Global overrides for PDF capture */
      .pdf-capture-mode,
      .pdf-capture-mode * {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        filter: none !important;
      }
      .pdf-capture-mode nav {
        background-color: #ffffff !important;
      }
      /* Override all semi-transparent white backgrounds */
      .pdf-capture-mode [class*="bg-white/"],
      .pdf-capture-mode [class*="bg-slate/"],
      .pdf-capture-mode .calendar-glass-card,
      .pdf-capture-mode .calendar-header-glass,
      .pdf-capture-mode .health-summary-card,
      .pdf-capture-mode .health-summary-header {
        background-color: #ffffff !important;
        background: #ffffff !important;
      }
      /* Override semi-transparent colored backgrounds */
      .pdf-capture-mode [class*="/50"],
      .pdf-capture-mode [class*="/60"],
      .pdf-capture-mode [class*="/70"],
      .pdf-capture-mode [class*="/80"],
      .pdf-capture-mode [class*="/90"],
      .pdf-capture-mode [class*="/95"] {
        opacity: 1 !important;
      }
      /* Override health summary sticky header */
      .pdf-capture-mode #page-health-summary .sticky,
      .pdf-capture-mode #health-summary-container .sticky {
        background-color: #ffffff !important;
        background: #ffffff !important;
      }
      /* Ensure all cards have solid backgrounds */
      .pdf-capture-mode .rounded-2xl,
      .pdf-capture-mode .rounded-3xl,
      .pdf-capture-mode .rounded-xl {
        background-color: #ffffff !important;
      }
      /* Override nav bar for PDF */
      .pdf-capture-mode nav {
        background-color: #ffffff !important;
        background: #ffffff !important;
      }
      /* Override loader overlay if visible */
      .pdf-capture-mode .loader-overlay {
        display: none !important;
      }
    `;
    document.head.appendChild(pdfStyleFix);

    // ===== Add capture mode class to body =====
    document.body.classList.add('pdf-capture-mode');

    // ===== AGGRESSIVE FIX: Loop through ALL elements and fix glassmorphism =====
    const allElements = document.querySelectorAll('*');
    const elementOriginalStyles = new Map();

    allElements.forEach(el => {
      const computed = window.getComputedStyle(el);
      const classList = el.className || '';
      const classStr = typeof classList === 'string' ? classList : (classList.baseVal || '');

      // Save original styles for ALL elements (we'll restore later)
      const originalStyles = {
        backdropFilter: el.style.backdropFilter,
        webkitBackdropFilter: el.style.webkitBackdropFilter,
        opacity: el.style.opacity,
        backgroundColor: el.style.backgroundColor,
        filter: el.style.filter,
        boxShadow: el.style.boxShadow
      };

      let needsFix = false;

      // Check for backdrop-filter (various browser prefixes)
      const computedBackdrop = computed.backdropFilter || computed.webkitBackdropFilter || '';
      if (computedBackdrop && computedBackdrop !== 'none') {
        el.style.backdropFilter = 'none';
        el.style.webkitBackdropFilter = 'none';
        needsFix = true;
      }

      // Check for filter with blur
      const computedFilter = computed.filter || '';
      if (computedFilter && computedFilter !== 'none' && computedFilter.includes('blur')) {
        el.style.filter = 'none';
        needsFix = true;
      }

      // Check for opacity less than 1
      const computedOpacity = parseFloat(computed.opacity);
      if (computedOpacity < 1) {
        el.style.opacity = '1';
        needsFix = true;
      }

      // Check for any semi-transparent background (rgba with alpha < 1)
      const bgColor = computed.backgroundColor;
      if (bgColor && bgColor.includes('rgba')) {
        const rgbaMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
        if (rgbaMatch) {
          const r = parseInt(rgbaMatch[1]);
          const g = parseInt(rgbaMatch[2]);
          const b = parseInt(rgbaMatch[3]);
          const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;

          // If it has transparency (alpha < 1)
          if (a < 1) {
            // Convert to solid color - blend with white background
            const blendedR = Math.round(r * a + 255 * (1 - a));
            const blendedG = Math.round(g * a + 255 * (1 - a));
            const blendedB = Math.round(b * a + 255 * (1 - a));
            el.style.backgroundColor = `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
            needsFix = true;
          }
        }
      }

      // Check for Tailwind opacity classes in class name
      if (classStr.includes('bg-white/') ||
        classStr.includes('bg-slate/') ||
        classStr.includes('/50') ||
        classStr.includes('/60') ||
        classStr.includes('/70') ||
        classStr.includes('/80') ||
        classStr.includes('/90') ||
        classStr.includes('/95') ||
        classStr.includes('backdrop') ||
        classStr.includes('blur')) {
        el.style.backdropFilter = 'none';
        el.style.webkitBackdropFilter = 'none';
        el.style.filter = 'none';

        // For bg-white/* classes, set solid white
        if (classStr.includes('bg-white/')) {
          el.style.backgroundColor = '#ffffff';
        }
        needsFix = true;
      }

      if (needsFix) {
        elementOriginalStyles.set(el, originalStyles);
      }
    });

    // Longer delay to ensure styles are fully applied before capture
    await new Promise(resolve => setTimeout(resolve, 500));

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
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 800,
        removeContainer: true,
        onclone: (clonedDoc) => {
          // Fix all elements in the cloned document
          const allClonedElements = clonedDoc.querySelectorAll('*');
          allClonedElements.forEach(el => {
            const style = el.style;
            const computed = clonedDoc.defaultView.getComputedStyle(el);

            // Remove all blur/backdrop effects
            style.backdropFilter = 'none';
            style.webkitBackdropFilter = 'none';
            if (computed.filter && computed.filter.includes('blur')) {
              style.filter = 'none';
            }

            // Fix opacity
            if (parseFloat(computed.opacity) < 1) {
              style.opacity = '1';
            }

            // Fix semi-transparent backgrounds
            const bgColor = computed.backgroundColor;
            if (bgColor && bgColor.includes('rgba')) {
              const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
              if (match) {
                const r = parseInt(match[1]);
                const g = parseInt(match[2]);
                const b = parseInt(match[3]);
                const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
                if (a < 1) {
                  const blendedR = Math.round(r * a + 255 * (1 - a));
                  const blendedG = Math.round(g * a + 255 * (1 - a));
                  const blendedB = Math.round(b * a + 255 * (1 - a));
                  style.backgroundColor = `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
                }
              }
            }
          });
        }
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
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 800,
        onclone: (clonedDoc) => {
          // Fix all elements in the cloned document
          const allClonedElements = clonedDoc.querySelectorAll('*');
          allClonedElements.forEach(el => {
            const style = el.style;
            const computed = clonedDoc.defaultView.getComputedStyle(el);

            // Remove all blur/backdrop effects
            style.backdropFilter = 'none';
            style.webkitBackdropFilter = 'none';
            if (computed.filter && computed.filter.includes('blur')) {
              style.filter = 'none';
            }

            // Fix opacity
            if (parseFloat(computed.opacity) < 1) {
              style.opacity = '1';
            }

            // Fix semi-transparent backgrounds
            const bgColor = computed.backgroundColor;
            if (bgColor && bgColor.includes('rgba')) {
              const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
              if (match) {
                const r = parseInt(match[1]);
                const g = parseInt(match[2]);
                const b = parseInt(match[3]);
                const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
                if (a < 1) {
                  const blendedR = Math.round(r * a + 255 * (1 - a));
                  const blendedG = Math.round(g * a + 255 * (1 - a));
                  const blendedB = Math.round(b * a + 255 * (1 - a));
                  style.backgroundColor = `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
                }
              }
            }
          });
        }
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
    noPrintElements.forEach((el, index) => {
      el.style.display = noPrintOriginalDisplay[index] || '';
    });

    // Restore blur decorations
    blurDecorations.forEach((el, index) => {
      el.style.display = blurOriginal[index] || '';
    });

    // ===== Restore all glassmorphism effects =====
    elementOriginalStyles.forEach((originalStyle, el) => {
      el.style.backdropFilter = originalStyle.backdropFilter || '';
      el.style.webkitBackdropFilter = originalStyle.webkitBackdropFilter || '';
      el.style.opacity = originalStyle.opacity || '';
      el.style.backgroundColor = originalStyle.backgroundColor || '';
      el.style.filter = originalStyle.filter || '';
      el.style.boxShadow = originalStyle.boxShadow || '';
    });

    // ===== Remove PDF capture mode =====
    document.body.classList.remove('pdf-capture-mode');
    const pdfStyleFixEl = document.getElementById('pdf-style-fix');
    if (pdfStyleFixEl) pdfStyleFixEl.remove();

    // Create filename with date
    const today = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    const filename = `BP_Report_${today}.pdf`;

    // Get PDF as blob for better mobile/LIFF compatibility
    const pdfBlob = pdf.output('blob');

    // Check if running in LIFF or mobile
    const isLIFF = typeof liff !== 'undefined' && liff.isInClient && liff.isInClient();
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile || isLIFF) {
      // Try Web Share API first (works best on mobile for saving files)
      if (navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });
        const shareData = { files: [file] };

        if (navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            return; // Successfully shared/saved
          } catch (e) {
            console.log('Share cancelled or failed, trying fallback...');
          }
        }
      }

      // Fallback: Use download link approach (works better on mobile browsers)
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Create and trigger download link
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = filename;
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);

      // For iOS Safari, we need to use a different approach
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (isIOS && isLIFF) {
        // iOS in LIFF: Open in new tab for download (user can long-press to save)
        window.open(blobUrl, '_blank');
        // Show instruction to user
        setTimeout(() => {
          alert('💡 เปิด PDF แล้ว! กดค้างที่หน้าจอเพื่อบันทึก หรือใช้ปุ่ม Share ของ iOS');
        }, 500);
      } else {
        // Android and other mobile browsers: trigger download
        downloadLink.click();
      }

      // Cleanup
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

    } else {
      // Desktop: Use standard download
      pdf.save(filename);
    }

  } catch (err) {
    console.error('Failed to create PDF:', err);
    alert('ไม่สามารถสร้าง PDF ได้ กรุณาลองใหม่');

    // Restore styles on error
    try {
      document.querySelectorAll('.no-print').forEach(el => el.style.display = '');
      document.querySelectorAll('[class*="blur-3xl"], [class*="blur-2xl"]').forEach(el => el.style.display = '');
      document.querySelectorAll('[class*="shadow"], [class*="blur"], [class*="backdrop"], [class*="opacity"]').forEach(el => {
        el.style.boxShadow = '';
        el.style.filter = '';
        el.style.backdropFilter = '';
        el.style.webkitBackdropFilter = '';
        el.style.opacity = '';
        el.style.backgroundColor = '';
      });
      document.querySelectorAll('[class*="bg-white/"], [class*="bg-slate/"]').forEach(el => {
        el.style.backgroundColor = '';
      });
      // Remove PDF capture mode
      document.body.classList.remove('pdf-capture-mode');
      const pdfStyleFixEl = document.getElementById('pdf-style-fix');
      if (pdfStyleFixEl) pdfStyleFixEl.remove();
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
