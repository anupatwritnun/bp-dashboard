/**
 * file: js/share.js
 * Dashboard sharing functionality - secure link & QR code generation
 */

// API Endpoints
const SHARE_GENERATE_URL = "https://n8n.srv1159869.hstgr.cloud/webhook/bp-share-generate";
const SHARE_VALIDATE_URL = "https://n8n.srv1159869.hstgr.cloud/webhook/bpvalidate";

// QR Code instance
let qrCodeInstance = null;

// ===== Generate Share Token =====
async function generateShareToken() {
    const userId = window.AppState.userId;

    if (!userId) {
        console.error("No userId available for sharing");
        return null;
    }

    try {
        const response = await fetch(SHARE_GENERATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        const data = await response.json();
        console.log("Share token generated:", data);
        return data;
    } catch (err) {
        console.error("Failed to generate share token:", err);
        return null;
    }
}

// ===== Validate Share Token =====
async function validateShareToken(token) {
    try {
        const response = await fetch(SHARE_VALIDATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        const data = await response.json();
        console.log("Token validation result:", data);
        return data;
    } catch (err) {
        console.error("Failed to validate share token:", err);
        return { valid: false, error: 'Network error' };
    }
}

// ===== Build Share URL =====
function buildShareUrl(token) {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?token=${token}`;
}

// ===== Copy to Clipboard =====
async function copyShareLink() {
    const linkInput = document.getElementById('share-link-input');
    const copyBtn = document.getElementById('copy-link-btn');

    if (!linkInput || !linkInput.value) return;

    try {
        await navigator.clipboard.writeText(linkInput.value);

        // Show success feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> คัดลอกแล้ว!`;
        copyBtn.classList.remove('bg-brand-500', 'hover:bg-brand-600');
        copyBtn.classList.add('bg-green-500');

        if (window.lucide) window.lucide.createIcons();

        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.classList.remove('bg-green-500');
            copyBtn.classList.add('bg-brand-500', 'hover:bg-brand-600');
            if (window.lucide) window.lucide.createIcons();
        }, 2000);

    } catch (err) {
        console.error("Failed to copy:", err);
        alert("ไม่สามารถคัดลอกได้ กรุณาคัดลอกด้วยตนเอง");
    }
}

// ===== Generate QR Code =====
function generateQRCode(url) {
    const container = document.getElementById('share-qr-container');
    if (!container) return;

    // Clear existing QR
    container.innerHTML = '';

    // Create new QR code
    if (window.QRCode) {
        qrCodeInstance = new QRCode(container, {
            text: url,
            width: 180,
            height: 180,
            colorDark: "#1e293b",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
    } else {
        container.innerHTML = '<p class="text-red-500 text-sm">QR Code library not loaded</p>';
    }
}

// ===== Format Expiry Time =====
function formatExpiryTime(expiresAt) {
    const expiry = new Date(expiresAt);
    return expiry.toLocaleString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short'
    });
}

// ===== Open Dashboard Share Modal =====
window.openDashboardShareModal = function () {
    const modal = document.getElementById('dashboard-share-modal');
    const warningState = document.getElementById('share-warning-state');
    const loadingState = document.getElementById('share-loading-state');
    const contentState = document.getElementById('share-content-state');
    const errorState = document.getElementById('share-error-state');

    if (!modal) return;

    // Show modal with warning state
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Reset to warning state
    if (warningState) warningState.classList.remove('hidden');
    if (loadingState) loadingState.classList.add('hidden');
    if (contentState) contentState.classList.add('hidden');
    if (errorState) errorState.classList.add('hidden');

    if (window.lucide) window.lucide.createIcons();
};

// ===== Confirm and Generate Share Link =====
window.confirmAndGenerateShareLink = async function () {
    const warningState = document.getElementById('share-warning-state');
    const loadingState = document.getElementById('share-loading-state');
    const contentState = document.getElementById('share-content-state');
    const errorState = document.getElementById('share-error-state');
    const linkInput = document.getElementById('share-link-input');
    const expiryText = document.getElementById('share-expiry-text');

    // Hide warning, show loading
    if (warningState) warningState.classList.add('hidden');
    if (loadingState) loadingState.classList.remove('hidden');

    // Generate token
    const result = await generateShareToken();

    if (result && result.success) {
        const shareUrl = buildShareUrl(result.token);

        // Update UI
        if (linkInput) linkInput.value = shareUrl;
        if (expiryText) expiryText.textContent = `หมดอายุเมื่อ ${formatExpiryTime(result.expiresAt)}`;

        // Generate QR code
        generateQRCode(shareUrl);

        // Show content state
        if (loadingState) loadingState.classList.add('hidden');
        if (contentState) contentState.classList.remove('hidden');
    } else {
        // Show error state
        if (loadingState) loadingState.classList.add('hidden');
        if (errorState) errorState.classList.remove('hidden');
    }

    if (window.lucide) window.lucide.createIcons();
};

// ===== Close Dashboard Share Modal =====
window.closeDashboardShareModal = function () {
    const modal = document.getElementById('dashboard-share-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

// ===== Check for Shared View Mode =====
window.checkSharedViewMode = async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        return { isShared: false };
    }

    console.log("Detected share token, validating...");

    const result = await validateShareToken(token);

    if (result && result.valid) {
        return {
            isShared: true,
            userId: result.userId,
            expiresAt: result.expiresAt
        };
    } else {
        return {
            isShared: true,
            error: result.error || 'Invalid token'
        };
    }
};

// ===== Render Shared View Banner =====
window.renderSharedViewBanner = function (expiresAt) {
    const banner = document.createElement('div');
    banner.id = 'shared-view-banner';
    banner.className = 'bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 flex items-center justify-between shadow-lg';
    banner.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-xl">🔗</span>
      <div>
        <p class="font-bold text-sm">กำลังดู Dashboard ที่แชร์</p>
        <p class="text-xs opacity-90">หมดอายุเมื่อ ${formatExpiryTime(expiresAt)}</p>
      </div>
    </div>
    <a href="${window.location.origin}${window.location.pathname}" 
       class="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-xs font-bold transition-colors">
      เปิดแอปของฉัน
    </a>
  `;

    // Insert at top of body
    document.body.insertBefore(banner, document.body.firstChild);
};

// ===== Render Share Error Page =====
window.renderShareError = function (error) {
    const main = document.querySelector('main');
    if (!main) return;

    let errorMessage = 'ลิงก์ไม่ถูกต้อง';
    let errorIcon = '❌';

    if (error === 'Token expired') {
        errorMessage = 'ลิงก์หมดอายุแล้ว';
        errorIcon = '⏰';
    } else if (error === 'Token not found') {
        errorMessage = 'ไม่พบลิงก์นี้';
        errorIcon = '🔍';
    }

    main.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div class="text-8xl mb-6">${errorIcon}</div>
      <h1 class="text-2xl font-bold text-slate-800 mb-2">${errorMessage}</h1>
      <p class="text-slate-500 mb-8">ลิงก์แชร์มีอายุ 6 ชั่วโมงหลังจากสร้าง</p>
      <a href="${window.location.origin}${window.location.pathname}"
         class="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-500/30 transition-all">
        🏠 กลับหน้าหลัก
      </a>
    </div>
  `;
};

// Export functions
window.generateShareToken = generateShareToken;
window.validateShareToken = validateShareToken;
window.copyShareLink = copyShareLink;
