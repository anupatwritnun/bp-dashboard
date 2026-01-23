// ===============================
// pdf-generator.js
// Generate clean PDF without glassmorphism
// ===============================

/**
 * Generate PDF by creating a clean HTML template
 * This approach renders content to a hidden container with NO glassmorphism,
 * then captures it with html2canvas for crisp, clear PDF output.
 */
window.generateCleanPDF = async function () {
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

    // Get data from AppState
    const records = window.AppState.filteredBpRecords || [];
    const allRecords = window.AppState.bpRecords || [];
    const profileStats = window.AppState.profileStats || {};
    const goodHabits = window.AppState.goodHabits || [];
    const badHabits = window.AppState.badHabits || [];
    const symptomLogs = window.AppState.symptomLogs || [];
    const weightLogs = window.AppState.weightLogs || [];

    // Calculate stats helper
    const calcStats = (recs, key) => {
      const vals = recs.map(r => Number(r[key])).filter(v => v > 0 && !isNaN(v));
      if (!vals.length) return { avg: '-', min: '-', max: '-', count: 0 };
      const sum = vals.reduce((a, b) => a + b, 0);
      return {
        avg: (sum / vals.length).toFixed(0),
        min: Math.min(...vals),
        max: Math.max(...vals),
        count: vals.length
      };
    };

    // Filter morning/evening records
    const morningRecs = records.filter(r => r.time && r.time.includes('เช้า'));
    const eveningRecs = records.filter(r => r.time && r.time.includes('เย็น'));

    // Calculate all stats
    const sysStats = calcStats(records, 'systolic');
    const diaStats = calcStats(records, 'diastolic');
    const pulseStats = calcStats(records, 'pulse');

    const sysMorn = calcStats(morningRecs, 'systolic');
    const sysEve = calcStats(eveningRecs, 'systolic');
    const diaMorn = calcStats(morningRecs, 'diastolic');
    const diaEve = calcStats(eveningRecs, 'diastolic');
    const pulseMorn = calcStats(morningRecs, 'pulse');
    const pulseEve = calcStats(eveningRecs, 'pulse');

    // Get date range text
    const startDate = document.getElementById('dash-start')?.value;
    const endDate = document.getElementById('dash-end')?.value;
    const dateRangeText = startDate && endDate
      ? `${formatThaiDate(startDate)} - ${formatThaiDate(endDate)}`
      : 'ทั้งหมด';

    // Capture the existing chart
    let chartImageData = null;
    const existingChart = document.getElementById('bpLineChart');
    if (existingChart) {
      try {
        const chartCanvas = await html2canvas(existingChart.parentElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        chartImageData = chartCanvas.toDataURL('image/png');
      } catch (e) {
        console.log('Could not capture chart:', e);
      }
    }

    // Create the clean PDF container
    const pdfContainer = document.createElement('div');
    pdfContainer.id = 'pdf-clean-container';
    pdfContainer.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 800px;
      background: #ffffff;
      font-family: 'Prompt', sans-serif;
      color: #334155;
      padding: 40px;
      box-sizing: border-box;
    `;

    // Build the HTML content - completely clean, no glassmorphism
    pdfContainer.innerHTML = buildPDFContent({
      records,
      sysStats, diaStats, pulseStats,
      sysMorn, sysEve, diaMorn, diaEve, pulseMorn, pulseEve,
      dateRangeText,
      profileStats,
      goodHabits,
      badHabits,
      symptomLogs,
      weightLogs,
      chartImageData
    });

    document.body.appendChild(pdfContainer);

    // Wait for fonts and content to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Capture with html2canvas
    const canvas = await html2canvas(pdfContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 800
    });

    // Remove the temporary container
    document.body.removeChild(pdfContainer);

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    // Calculate dimensions
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgRatio = canvas.height / canvas.width;
    const imgWidth = contentWidth;
    const imgHeight = imgWidth * imgRatio;

    // Add image to PDF (may span multiple pages)
    let yPosition = margin;
    let remainingHeight = imgHeight;
    let sourceY = 0;

    while (remainingHeight > 0) {
      const availableHeight = pageHeight - margin - yPosition;
      const sliceHeight = Math.min(remainingHeight, availableHeight);
      const sliceRatio = sliceHeight / imgHeight;

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = canvas.height * sliceRatio;
      const sliceCtx = sliceCanvas.getContext('2d');
      sliceCtx.drawImage(
        canvas,
        0, sourceY * (canvas.height / imgHeight),
        canvas.width, sliceCanvas.height,
        0, 0,
        sliceCanvas.width, sliceCanvas.height
      );

      pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, yPosition, imgWidth, sliceHeight);

      sourceY += sliceHeight;
      remainingHeight -= sliceHeight;

      if (remainingHeight > 0) {
        pdf.addPage();
        yPosition = margin;
      }
    }

    // Create filename with date
    const today = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    const filename = `BP_Report_${today}.pdf`;

    // Download PDF
    downloadPDF(pdf, filename);

  } catch (err) {
    console.error('Failed to create PDF:', err);
    alert('ไม่สามารถสร้าง PDF ได้ กรุณาลองใหม่');
  } finally {
    if (btn) {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  }
};

/**
 * Build the clean PDF HTML content
 */
function buildPDFContent(data) {
  const {
    records, sysStats, diaStats, pulseStats,
    sysMorn, sysEve, diaMorn, diaEve, pulseMorn, pulseEve,
    dateRangeText, profileStats, goodHabits, badHabits,
    symptomLogs, weightLogs, chartImageData
  } = data;

  // Get BP status evaluation
  const getBPStatusText = (sys, dia) => {
    const s = Number(sys);
    const d = Number(dia);
    if (isNaN(s) || isNaN(d)) return { text: '-', color: '#94a3b8' };
    if (s < 120 && d < 80) return { text: 'ปกติ', color: '#10b981' };
    if (s < 130 && d < 85) return { text: 'ค่อนข้างสูง', color: '#f59e0b' };
    if (s < 140 && d < 90) return { text: 'สูงเล็กน้อย', color: '#f97316' };
    if (s < 160 && d < 100) return { text: 'สูงปานกลาง', color: '#ef4444' };
    return { text: 'สูงมาก', color: '#dc2626' };
  };

  // Sort records by date (newest first)
  const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

  // Latest weight data
  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : null;

  // Create stat card with morning/evening
  const createStatCard = (title, mainStats, mornStats, eveStats, colorClass, colorHex) => `
    <div class="stat-card ${colorClass}">
      <div class="stat-header">
        <h3>${title}</h3>
        <span class="count-badge">ทั้งหมด ${mainStats.count} ครั้ง</span>
      </div>
      <div class="main-value" style="color: ${colorHex}">${mainStats.avg}</div>
      <div class="unit">เฉลี่ย</div>
      <div class="range">ต่ำสุด ${mainStats.min} • สูงสุด ${mainStats.max}</div>
      <div class="time-grid">
        <div class="time-box">
          <div class="time-label">🌞 ช่วงเช้า <span class="time-count">${mornStats.count}</span></div>
          <div class="time-value">${mornStats.avg}</div>
          <div class="time-range">${mornStats.min}-${mornStats.max}</div>
        </div>
        <div class="time-box">
          <div class="time-label">🌙 ช่วงเย็น <span class="time-count">${eveStats.count}</span></div>
          <div class="time-value">${eveStats.avg}</div>
          <div class="time-range">${eveStats.min}-${eveStats.max}</div>
        </div>
      </div>
    </div>
  `;

  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      .pdf-body { font-family: 'Prompt', sans-serif; color: #334155; line-height: 1.5; }
      
      .pdf-header { text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #f1f5f9; }
      .pdf-header h1 { font-size: 24px; color: #1e293b; margin-bottom: 3px; }
      .pdf-header .subtitle { color: #64748b; font-size: 12px; }
      .pdf-header .date-range { background: #fff7ed; color: #ea580c; padding: 6px 14px; border-radius: 20px; display: inline-block; margin-top: 8px; font-size: 11px; font-weight: 600; }
      
      /* Stat Cards - matching UI */
      .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
      .stat-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; }
      .stat-card.sys { border-top: 6px solid #ec4899; }
      .stat-card.dia { border-top: 6px solid #0ea5e9; }
      .stat-card.pulse { border-top: 6px solid #92400e; }
      
      .stat-header { padding: 15px 15px 0; display: flex; justify-content: space-between; align-items: flex-start; }
      .stat-header h3 { font-size: 13px; font-weight: 700; color: #475569; }
      .count-badge { font-size: 9px; font-weight: 700; color: #94a3b8; background: #f1f5f9; padding: 3px 8px; border-radius: 6px; }
      
      .main-value { font-size: 48px; font-weight: 700; text-align: left; padding: 5px 15px 0; letter-spacing: -2px; }
      .unit { font-size: 12px; color: #94a3b8; padding: 0 15px; }
      .range { font-size: 10px; color: #94a3b8; background: #f8fafc; padding: 4px 10px; margin: 10px 15px 0; border-radius: 6px; display: inline-block; }
      
      .time-grid { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #f1f5f9; margin-top: 12px; }
      .time-box { padding: 12px 10px; text-align: center; border-right: 1px solid #f1f5f9; }
      .time-box:last-child { border-right: none; }
      .time-label { font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
      .time-count { background: #f1f5f9; color: #64748b; padding: 1px 6px; border-radius: 8px; margin-left: 4px; }
      .time-value { font-size: 18px; font-weight: 700; color: #475569; }
      .time-range { font-size: 9px; color: #94a3b8; margin-top: 2px; }
      
      /* Chart Section */
      .chart-section { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; margin-bottom: 25px; }
      .chart-section h3 { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 10px; }
      .chart-legend { display: flex; gap: 15px; margin-bottom: 15px; font-size: 11px; }
      .chart-legend span { display: flex; align-items: center; gap: 5px; }
      .chart-legend .dot { width: 10px; height: 10px; border-radius: 50%; }
      .chart-legend .dot.sys { background: #ec4899; }
      .chart-legend .dot.dia { background: #0ea5e9; }
      .chart-legend .dot.pulse { background: #92400e; }
      .chart-img { width: 100%; height: auto; border-radius: 10px; }
      
      /* Section styling */
      .section { margin-bottom: 20px; }
      .section-title { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 12px; padding-left: 10px; border-left: 4px solid #f97316; }
      
      /* Records Table */
      .records-table { width: 100%; border-collapse: collapse; font-size: 11px; }
      .records-table th { background: #f8fafc; color: #64748b; font-weight: 600; padding: 10px 6px; text-align: center; border-bottom: 2px solid #e2e8f0; }
      .records-table td { padding: 8px 6px; text-align: center; border-bottom: 1px solid #f1f5f9; }
      .records-table tr:nth-child(even) { background: #fafafa; }
      .records-table .sys-val { color: #ec4899; font-weight: 600; }
      .records-table .dia-val { color: #0ea5e9; font-weight: 600; }
      .records-table .pulse-val { color: #92400e; font-weight: 600; }
      .records-table .status-badge { display: inline-block; padding: 3px 8px; border-radius: 10px; font-size: 9px; font-weight: 600; }
      
      /* Health Cards */
      .health-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
      .health-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; }
      .health-card h4 { font-size: 12px; font-weight: 600; color: #1e293b; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
      .health-card .icon { width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; }
      .health-card .icon.green { background: #dcfce7; }
      .health-card .icon.red { background: #fee2e2; }
      .health-card .icon.blue { background: #dbeafe; }
      .health-card ul { list-style: none; }
      .health-card li { font-size: 11px; color: #475569; padding: 5px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; }
      .health-card li:last-child { border-bottom: none; }
      .health-card .count { font-weight: 600; color: #1e293b; }
      
      .body-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .body-stat { background: #f8fafc; border-radius: 10px; padding: 12px; text-align: center; }
      .body-stat .label { font-size: 10px; color: #64748b; margin-bottom: 3px; }
      .body-stat .value { font-size: 20px; font-weight: 700; color: #1e293b; }
      .body-stat .unit { font-size: 10px; color: #94a3b8; }
      
      .footer { margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 10px; }
    </style>
    
    <div class="pdf-body">
      <!-- Header -->
      <div class="pdf-header">
        <h1>🐠 สมุดพิทักษ์ใจ ปลาท๊องง</h1>
        <p class="subtitle">รายงานสุขภาพความดันโลหิต</p>
        <div class="date-range">📅 ${dateRangeText}</div>
      </div>
      
      <!-- BP Stats Cards with Morning/Evening -->
      <div class="stats-grid">
        ${createStatCard('ความดันตัวบน (SYS)', sysStats, sysMorn, sysEve, 'sys', '#ec4899')}
        ${createStatCard('ความดันตัวล่าง (DIA)', diaStats, diaMorn, diaEve, 'dia', '#0ea5e9')}
        ${createStatCard('ชีพจร (Pulse)', pulseStats, pulseMorn, pulseEve, 'pulse', '#92400e')}
      </div>
      
      <!-- Chart Section -->
      ${chartImageData ? `
        <div class="chart-section">
          <h3>แนวโน้มสุขภาพ</h3>
          <div class="chart-legend">
            <span><span class="dot sys"></span> ความดันตัวบน (SYS)</span>
            <span><span class="dot dia"></span> ความดันตัวล่าง (DIA)</span>
            <span><span class="dot pulse"></span> ชีพจร (Pulse)</span>
          </div>
          <img src="${chartImageData}" class="chart-img" />
        </div>
      ` : ''}
      
      <!-- Records Table -->
      <div class="section">
        <h3 class="section-title">ประวัติการบันทึก (${sortedRecords.length} รายการล่าสุด)</h3>
        <table class="records-table">
          <thead>
            <tr>
              <th>วันที่</th>
              <th>ช่วงเวลา</th>
              <th>ตัวบน</th>
              <th>ตัวล่าง</th>
              <th>ชีพจร</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            ${sortedRecords.map(r => {
    const status = getBPStatusText(r.systolic, r.diastolic);
    return `
                <tr>
                  <td>${formatThaiDate(r.date)}</td>
                  <td>${r.time || '-'}</td>
                  <td class="sys-val">${r.systolic ?? '-'}</td>
                  <td class="dia-val">${r.diastolic ?? '-'}</td>
                  <td class="pulse-val">${r.pulse ?? '-'}</td>
                  <td><span class="status-badge" style="background: ${status.color}20; color: ${status.color}">${status.text}</span></td>
                </tr>
              `;
  }).join('')}
          </tbody>
        </table>
      </div>
      
      <!-- Health Summary -->
      <div class="section">
        <h3 class="section-title">สรุปสุขภาพ</h3>
        <div class="health-grid">
          ${latestWeight ? `
            <div class="health-card">
              <h4><span class="icon blue">📊</span> สัดส่วนร่างกาย</h4>
              <div class="body-stats">
                <div class="body-stat">
                  <div class="label">น้ำหนัก</div>
                  <div class="value">${latestWeight.weight || '-'}</div>
                  <div class="unit">กก.</div>
                </div>
                <div class="body-stat">
                  <div class="label">BMI</div>
                  <div class="value">${latestWeight.bmi ? latestWeight.bmi.toFixed(1) : '-'}</div>
                  <div class="unit">kg/m²</div>
                </div>
              </div>
            </div>
          ` : ''}
          
          <div class="health-card">
            <h4><span class="icon green">✓</span> ทำได้ดี</h4>
            <ul>
              ${getHabitsSummary(goodHabits)}
            </ul>
          </div>
          
          <div class="health-card">
            <h4><span class="icon red">⚠</span> ต้องระวัง</h4>
            <ul>
              ${getRisksSummary(badHabits)}
            </ul>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <p>สร้างโดย สมุดพิทักษ์ใจ ปลาท๊องง • ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>
  `;
}

/**
 * Format date to Thai format
 */
function formatThaiDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${(d.getFullYear() + 543) % 100}`;
}

/**
 * Get habits summary HTML
 */
function getHabitsSummary(habits) {
  if (!habits || habits.length === 0) {
    return '<li style="color: #94a3b8; text-align: center;">ยังไม่มีข้อมูล</li>';
  }

  const labels = {
    meditation: 'นั่งสมาธิ/ผ่อนคลาย',
    veggies: 'ทานผัก/ผลไม้',
    exercise: 'ออกกำลังกาย'
  };

  const counts = {};
  habits.forEach(h => {
    if (h.meditation) counts.meditation = (counts.meditation || 0) + 1;
    if (h.high_veggies) counts.veggies = (counts.veggies || 0) + 1;
    if (h.exercise_bracket && h.exercise_bracket !== 'none') counts.exercise = (counts.exercise || 0) + 1;
  });

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (entries.length === 0) {
    return '<li style="color: #94a3b8; text-align: center;">ยังไม่มีข้อมูล</li>';
  }

  return entries.map(([key, count]) =>
    `<li><span>${labels[key] || key}</span><span class="count">${count} วัน</span></li>`
  ).join('');
}

/**
 * Get risks summary HTML
 */
function getRisksSummary(badHabits) {
  if (!badHabits || badHabits.length === 0) {
    return '<li style="color: #10b981; text-align: center;">🎉 ไม่พบปัจจัยเสี่ยง</li>';
  }

  const labels = {
    forgot_meds: 'ลืมทานยา',
    salty: 'ทานรสเค็มจัด',
    sleep: 'นอนน้อย',
    alcohol: 'ดื่มแอลกอฮอล์',
    smoking: 'สูบบุหรี่',
    stress: 'เครียด'
  };

  const counts = {};
  badHabits.forEach(h => {
    if (h.forgot_meds) counts.forgot_meds = (counts.forgot_meds || 0) + 1;
    if (h.high_salt) counts.salty = (counts.salty || 0) + 1;
    if (h.poor_sleep) counts.sleep = (counts.sleep || 0) + 1;
    if (h.alcohol_intake) counts.alcohol = (counts.alcohol || 0) + 1;
    if (h.smoking) counts.smoking = (counts.smoking || 0) + 1;
    if (h.high_stress) counts.stress = (counts.stress || 0) + 1;
  });

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (entries.length === 0) {
    return '<li style="color: #10b981; text-align: center;">🎉 ไม่พบปัจจัยเสี่ยง</li>';
  }

  return entries.map(([key, count]) =>
    `<li><span>${labels[key] || key}</span><span class="count" style="color: #dc2626;">${count} วัน</span></li>`
  ).join('');
}

/**
 * Download PDF with mobile compatibility
 */
function downloadPDF(pdf, filename) {
  const pdfBlob = pdf.output('blob');
  const isLIFF = typeof liff !== 'undefined' && liff.isInClient && liff.isInClient();
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile || isLIFF) {
    // Try Web Share API first
    if (navigator.share && navigator.canShare) {
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });
      const shareData = { files: [file] };

      if (navigator.canShare(shareData)) {
        navigator.share(shareData).catch(() => {
          fallbackDownload(pdfBlob, filename);
        });
        return;
      }
    }
    fallbackDownload(pdfBlob, filename);
  } else {
    pdf.save(filename);
  }
}

/**
 * Fallback download method
 */
function fallbackDownload(blob, filename) {
  const blobUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = blobUrl;
  downloadLink.download = filename;
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    window.open(blobUrl, '_blank');
    setTimeout(() => {
      alert('💡 เปิด PDF แล้ว! กดค้างที่หน้าจอเพื่อบันทึก');
    }, 500);
  } else {
    downloadLink.click();
  }

  document.body.removeChild(downloadLink);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

// Export function to global scope
window.saveDashboardPDF = window.generateCleanPDF;
