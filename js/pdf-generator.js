// ===============================
// pdf-generator.js
// Generate clean PDF without glassmorphism
// Sections are captured separately to avoid page-break cuts
// ===============================

/**
 * Generate PDF by creating clean HTML sections
 * Each section is captured and added separately to avoid cutting content at page breaks
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
    const goodHabits = window.AppState.goodHabits || [];
    const badHabits = window.AppState.badHabits || [];
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
    const stats = {
      sys: calcStats(records, 'systolic'),
      dia: calcStats(records, 'diastolic'),
      pulse: calcStats(records, 'pulse'),
      sysMorn: calcStats(morningRecs, 'systolic'),
      sysEve: calcStats(eveningRecs, 'systolic'),
      diaMorn: calcStats(morningRecs, 'diastolic'),
      diaEve: calcStats(eveningRecs, 'diastolic'),
      pulseMorn: calcStats(morningRecs, 'pulse'),
      pulseEve: calcStats(eveningRecs, 'pulse')
    };

    // Get date range text
    const startDate = document.getElementById('dash-start')?.value;
    const endDate = document.getElementById('dash-end')?.value;
    const dateRangeText = startDate && endDate
      ? `${formatThaiDate(startDate)} - ${formatThaiDate(endDate)}`
      : 'ทั้งหมด';

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    const maxContentHeight = pageHeight - (margin * 2);

    let currentY = margin;

    // Helper function to add a section to PDF
    const addSectionToPDF = async (htmlContent, sectionName) => {
      // Create temporary container
      const container = document.createElement('div');
      container.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 800px;
        background: #ffffff;
        font-family: 'Prompt', sans-serif;
        color: #334155;
        padding: 20px;
        box-sizing: border-box;
      `;
      container.innerHTML = getBaseStyles() + htmlContent;
      document.body.appendChild(container);

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture with html2canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800
      });

      document.body.removeChild(container);

      // Calculate dimensions
      const imgRatio = canvas.height / canvas.width;
      const imgWidth = contentWidth;
      const imgHeight = imgWidth * imgRatio;

      // Check if section fits on current page
      if (currentY + imgHeight > pageHeight - margin) {
        // Start new page
        pdf.addPage();
        currentY = margin;
      }

      // Add image to PDF
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 5; // 5mm gap between sections

      return imgHeight;
    };

    // ===== SECTION 1: Header =====
    await addSectionToPDF(`
      <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #f1f5f9;">
        <h1 style="font-size: 24px; color: #1e293b; margin: 0 0 3px 0;">🐠 สมุดพิทักษ์ใจ ปลาท๊องง</h1>
        <p style="color: #64748b; font-size: 12px; margin: 0;">รายงานสุขภาพความดันโลหิต</p>
        <div style="background: #fff7ed; color: #ea580c; padding: 6px 14px; border-radius: 20px; display: inline-block; margin-top: 8px; font-size: 11px; font-weight: 600;">📅 ${dateRangeText}</div>
      </div>
    `, 'header');

    // ===== SECTION 2: Stats Cards =====
    await addSectionToPDF(buildStatsSection(stats), 'stats');

    // ===== SECTION 3: Chart =====
    const existingChart = document.getElementById('bpLineChart');
    if (existingChart && existingChart.parentElement) {
      try {
        const chartCanvas = await html2canvas(existingChart.parentElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });

        const chartRatio = chartCanvas.height / chartCanvas.width;
        const chartWidth = contentWidth;
        const chartHeight = chartWidth * chartRatio;

        // Check if chart fits on current page
        if (currentY + chartHeight + 40 > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }

        // Add chart title
        await addSectionToPDF(`
          <div style="margin-bottom: 10px;">
            <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0;">แนวโน้มสุขภาพ</h3>
            <div style="display: flex; gap: 15px; margin-top: 8px; font-size: 11px;">
              <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 10px; height: 10px; border-radius: 50%; background: #ec4899;"></span> ความดันตัวบน (SYS)</span>
              <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 10px; height: 10px; border-radius: 50%; background: #0ea5e9;"></span> ความดันตัวล่าง (DIA)</span>
              <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 10px; height: 10px; border-radius: 50%; background: #92400e;"></span> ชีพจร (Pulse)</span>
            </div>
          </div>
        `, 'chart-title');

        // Add chart image
        pdf.addImage(chartCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, currentY, chartWidth, chartHeight);
        currentY += chartHeight + 10;
      } catch (e) {
        console.log('Could not capture chart:', e);
      }
    }

    // ===== SECTION 4: Records Table (split into chunks if needed) =====
    const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recordsPerPage = 15; // Records per chunk to avoid huge tables

    for (let i = 0; i < sortedRecords.length; i += recordsPerPage) {
      const chunk = sortedRecords.slice(i, i + recordsPerPage);
      const isFirst = i === 0;

      await addSectionToPDF(buildTableSection(chunk, isFirst, i + 1, Math.min(i + recordsPerPage, sortedRecords.length), sortedRecords.length), 'table-chunk');
    }

    // ===== SECTION 5: Health Summary =====
    const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : null;
    await addSectionToPDF(buildHealthSummarySection(latestWeight, goodHabits, badHabits), 'health-summary');

    // ===== SECTION 6: Footer =====
    await addSectionToPDF(`
      <div style="padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 10px;">
        <p style="margin: 0;">สร้างโดย สมุดพิทักษ์ใจ ปลาท๊องง • ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    `, 'footer');

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
 * Get base CSS styles
 */
function getBaseStyles() {
  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Prompt', sans-serif; }
      
      .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
      .stat-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; }
      .stat-card.sys { border-top: 6px solid #ec4899; }
      .stat-card.dia { border-top: 6px solid #0ea5e9; }
      .stat-card.pulse { border-top: 6px solid #92400e; }
      
      .stat-header { padding: 12px 12px 0; display: flex; justify-content: space-between; align-items: flex-start; }
      .stat-header h3 { font-size: 11px; font-weight: 700; color: #475569; }
      .count-badge { font-size: 8px; font-weight: 700; color: #94a3b8; background: #f1f5f9; padding: 2px 6px; border-radius: 6px; }
      
      .main-value { font-size: 40px; font-weight: 700; text-align: left; padding: 2px 12px 0; letter-spacing: -2px; }
      .unit { font-size: 11px; color: #94a3b8; padding: 0 12px; }
      .range { font-size: 9px; color: #94a3b8; background: #f8fafc; padding: 3px 8px; margin: 8px 12px 0; border-radius: 6px; display: inline-block; }
      
      .time-grid { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #f1f5f9; margin-top: 10px; }
      .time-box { padding: 10px 8px; text-align: center; border-right: 1px solid #f1f5f9; }
      .time-box:last-child { border-right: none; }
      .time-label { font-size: 8px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; }
      .time-count { background: #f1f5f9; color: #64748b; padding: 1px 5px; border-radius: 8px; margin-left: 3px; font-size: 8px; }
      .time-value { font-size: 16px; font-weight: 700; color: #475569; }
      .time-range { font-size: 8px; color: #94a3b8; margin-top: 2px; }
      
      .section-title { font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 10px; padding-left: 10px; border-left: 4px solid #f97316; }
      
      .records-table { width: 100%; border-collapse: collapse; font-size: 10px; }
      .records-table th { background: #f8fafc; color: #64748b; font-weight: 600; padding: 8px 5px; text-align: center; border-bottom: 2px solid #e2e8f0; }
      .records-table td { padding: 6px 5px; text-align: center; border-bottom: 1px solid #f1f5f9; }
      .records-table tr:nth-child(even) { background: #fafafa; }
      .records-table .sys-val { color: #ec4899; font-weight: 600; }
      .records-table .dia-val { color: #0ea5e9; font-weight: 600; }
      .records-table .pulse-val { color: #92400e; font-weight: 600; }
      .records-table .status-badge { display: inline-block; padding: 2px 6px; border-radius: 8px; font-size: 8px; font-weight: 600; }
      
      .health-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .health-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; }
      .health-card h4 { font-size: 11px; font-weight: 600; color: #1e293b; margin-bottom: 8px; display: flex; align-items: center; gap: 5px; }
      .health-card .icon { width: 20px; height: 20px; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px; }
      .health-card .icon.green { background: #dcfce7; }
      .health-card .icon.red { background: #fee2e2; }
      .health-card .icon.blue { background: #dbeafe; }
      .health-card ul { list-style: none; }
      .health-card li { font-size: 10px; color: #475569; padding: 4px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; }
      .health-card li:last-child { border-bottom: none; }
      .health-card .count { font-weight: 600; color: #1e293b; }
      
      .body-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .body-stat { background: #f8fafc; border-radius: 8px; padding: 10px; text-align: center; }
      .body-stat .label { font-size: 9px; color: #64748b; margin-bottom: 2px; }
      .body-stat .value { font-size: 18px; font-weight: 700; color: #1e293b; }
      .body-stat .unit-text { font-size: 9px; color: #94a3b8; }
    </style>
  `;
}

/**
 * Build stats section HTML
 */
function buildStatsSection(stats) {
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
          <div class="time-label">🌞 เช้า <span class="time-count">${mornStats.count}</span></div>
          <div class="time-value">${mornStats.avg}</div>
          <div class="time-range">${mornStats.min}-${mornStats.max}</div>
        </div>
        <div class="time-box">
          <div class="time-label">🌙 เย็น <span class="time-count">${eveStats.count}</span></div>
          <div class="time-value">${eveStats.avg}</div>
          <div class="time-range">${eveStats.min}-${eveStats.max}</div>
        </div>
      </div>
    </div>
  `;

  return `
    <div class="stats-grid">
      ${createStatCard('ความดันตัวบน (SYS)', stats.sys, stats.sysMorn, stats.sysEve, 'sys', '#ec4899')}
      ${createStatCard('ความดันตัวล่าง (DIA)', stats.dia, stats.diaMorn, stats.diaEve, 'dia', '#0ea5e9')}
      ${createStatCard('ชีพจร (Pulse)', stats.pulse, stats.pulseMorn, stats.pulseEve, 'pulse', '#92400e')}
    </div>
  `;
}

/**
 * Build table section HTML
 */
function buildTableSection(records, isFirst, startNum, endNum, total) {
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

  return `
    <div>
      ${isFirst ? `<h3 class="section-title">ประวัติการบันทึก (${total} รายการ)</h3>` : `<p style="font-size: 10px; color: #94a3b8; margin-bottom: 8px;">ต่อ: รายการที่ ${startNum}-${endNum}</p>`}
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
          ${records.map(r => {
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
  `;
}

/**
 * Build health summary section HTML
 */
function buildHealthSummarySection(latestWeight, goodHabits, badHabits) {
  return `
    <div>
      <h3 class="section-title">สรุปสุขภาพ</h3>
      <div class="health-grid">
        ${latestWeight ? `
          <div class="health-card">
            <h4><span class="icon blue">📊</span> สัดส่วนร่างกาย</h4>
            <div class="body-stats">
              <div class="body-stat">
                <div class="label">น้ำหนัก</div>
                <div class="value">${latestWeight.weight || '-'}</div>
                <div class="unit-text">กก.</div>
              </div>
              <div class="body-stat">
                <div class="label">BMI</div>
                <div class="value">${latestWeight.bmi ? latestWeight.bmi.toFixed(1) : '-'}</div>
                <div class="unit-text">kg/m²</div>
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
