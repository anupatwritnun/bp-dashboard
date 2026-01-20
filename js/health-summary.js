// ===== Health Summary Module =====
// Apple Health-inspired health summary with calendar & daily timeline

window.HealthSummaryState = {
    currentYear: 2026,
    currentMonth: 0, // January (0-indexed)
    selectedDate: null,
    todayKey: null,
    healthLogs: {} // Will be populated from AppState
};

// ===== Thai Month Names =====
const TH_MONTHS_FULL = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const TH_MONTHS_SHORT = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const TH_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

// ===== Category Configuration =====
const LOG_CATEGORIES = {
    vitals: {
        icon: 'fa-heart-pulse',
        label: 'ความดันโลหิต',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-500',
        dotColor: 'bg-red-400'
    },
    medication: {
        icon: 'fa-pills',
        label: 'ทานยา',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-500',
        dotColor: 'bg-green-400'
    },
    meal: {
        icon: 'fa-utensils',
        label: 'มื้ออาหาร',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-500',
        dotColor: 'bg-orange-400'
    },
    symptom: {
        icon: 'fa-head-side-virus',
        label: 'อาการ',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-500',
        dotColor: 'bg-slate-400'
    },
    exercise: {
        icon: 'fa-person-running',
        label: 'ออกกำลังกาย',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-500',
        dotColor: 'bg-blue-400'
    },
    weight: {
        icon: 'fa-weight-scale',
        label: 'น้ำหนัก',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-500',
        dotColor: 'bg-purple-400'
    }
};

// ===== Build Health Logs from BP Records =====
function buildHealthLogsFromRecords() {
    const logs = {};

    if (AppState.bpRecords && AppState.bpRecords.length > 0) {
        AppState.bpRecords.forEach(record => {
            const dateKey = record.date;

            if (!logs[dateKey]) {
                logs[dateKey] = [];
            }

            // BP Record
            const sys = parseInt(record.sys) || 120;
            const dia = parseInt(record.dia) || 80;
            const pulse = parseInt(record.pulse) || 72;
            const timeOfDay = record.time || 'morning';

            logs[dateKey].push({
                time: timeOfDay === 'morning' ? '08:00' : timeOfDay === 'evening' ? '18:00' : '12:00',
                category: 'vitals',
                title: `ความดัน ${sys}/${dia} mmHg`,
                subtitle: `ชีพจร ${pulse} ครั้ง/นาที`,
                status: classifyBPStatus(sys, dia)
            });

            // Add symptoms if any
            if (record.symptoms && record.symptoms.length > 0) {
                record.symptoms.forEach(symptom => {
                    const symptomLabels = {
                        headache: 'ปวดหัว',
                        dizzy: 'เวียนศีรษะ',
                        chest_pain: 'เจ็บหน้าอก',
                        nausea: 'คลื่นไส้',
                        blur: 'ตาพร่า'
                    };

                    logs[dateKey].push({
                        time: timeOfDay === 'morning' ? '08:30' : '18:30',
                        category: 'symptom',
                        title: symptomLabels[symptom] || symptom,
                        subtitle: 'บันทึกอาการ'
                    });
                });
            }

            // Add positive habits as activities
            if (record.positive_habits && record.positive_habits.length > 0) {
                if (record.positive_habits.includes('exercise')) {
                    logs[dateKey].push({
                        time: '07:00',
                        category: 'exercise',
                        title: 'ออกกำลังกาย',
                        subtitle: 'กิจกรรมประจำวัน'
                    });
                }
            }
        });

        // Sort logs by time for each date
        Object.keys(logs).forEach(dateKey => {
            logs[dateKey].sort((a, b) => a.time.localeCompare(b.time));
        });
    }

    return logs;
}

function classifyBPStatus(sys, dia) {
    if (sys < 120 && dia < 80) return { label: 'ปกติ', color: 'text-green-600', bg: 'bg-green-100' };
    if (sys < 130 && dia < 80) return { label: 'สูงกว่าปกติเล็กน้อย', color: 'text-amber-600', bg: 'bg-amber-100' };
    if (sys < 140 || dia < 90) return { label: 'ความดันสูงระยะ 1', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { label: 'ความดันสูงระยะ 2', color: 'text-red-600', bg: 'bg-red-100' };
}

// ===== Calendar Navigation =====
function navigateSummaryMonth(direction) {
    HealthSummaryState.currentMonth += direction;

    if (HealthSummaryState.currentMonth > 11) {
        HealthSummaryState.currentMonth = 0;
        HealthSummaryState.currentYear++;
    } else if (HealthSummaryState.currentMonth < 0) {
        HealthSummaryState.currentMonth = 11;
        HealthSummaryState.currentYear--;
    }

    renderHealthSummary();
}

function goToSummaryToday() {
    const today = new Date();
    HealthSummaryState.currentYear = today.getFullYear();
    HealthSummaryState.currentMonth = today.getMonth();
    HealthSummaryState.selectedDate = HealthSummaryState.todayKey;
    renderHealthSummary();
}

function selectSummaryDate(dateKey) {
    HealthSummaryState.selectedDate = dateKey;
    renderHealthSummary();
}

// ===== Get Days in Month =====
function getSummaryDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getSummaryFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

// ===== Format Date Key =====
function formatDateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ===== Render Health Summary =====
function renderHealthSummary() {
    const container = document.getElementById('health-summary-container');
    if (!container) return;

    // Build health logs from records
    HealthSummaryState.healthLogs = buildHealthLogsFromRecords();

    // Set today's date key
    const today = new Date();
    HealthSummaryState.todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    // Auto-select today if no date selected
    if (!HealthSummaryState.selectedDate) {
        HealthSummaryState.selectedDate = HealthSummaryState.todayKey;
    }

    const { currentYear, currentMonth, selectedDate, todayKey, healthLogs } = HealthSummaryState;
    const daysInMonth = getSummaryDaysInMonth(currentYear, currentMonth);
    const firstDay = getSummaryFirstDayOfMonth(currentYear, currentMonth);

    // Build calendar days HTML
    let daysHtml = '';

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        daysHtml += `<div class="h-10"></div>`;
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = formatDateKey(currentYear, currentMonth, day);
        const isSelected = selectedDate === dateKey;
        const isToday = todayKey === dateKey;
        const hasData = healthLogs[dateKey] && healthLogs[dateKey].length > 0;

        // Get category dots for this day
        let dotsHtml = '';
        if (hasData) {
            const categories = [...new Set(healthLogs[dateKey].map(l => l.category))];
            dotsHtml = `
        <div class="flex gap-0.5 justify-center mt-0.5">
          ${categories.slice(0, 3).map(cat => `
            <div class="w-1.5 h-1.5 rounded-full ${LOG_CATEGORIES[cat]?.dotColor || 'bg-slate-300'}"></div>
          `).join('')}
        </div>
      `;
        }

        // Day styling
        let dayClasses = 'relative h-10 w-10 mx-auto flex flex-col items-center justify-center rounded-full transition-all cursor-pointer font-poppins';

        if (isSelected) {
            dayClasses += ' bg-orange-500 text-white shadow-lg shadow-orange-500/30';
        } else if (isToday) {
            dayClasses += ' border-2 border-orange-400 text-orange-600 font-semibold';
        } else {
            dayClasses += ' hover:bg-slate-100 text-slate-600';
        }

        daysHtml += `
      <button onclick="selectSummaryDate('${dateKey}')" class="${dayClasses}">
        <span class="text-sm leading-none">${day}</span>
        ${!isSelected ? dotsHtml : ''}
      </button>
    `;
    }

    // Build timeline HTML
    const timelineHtml = renderTimeline(selectedDate, healthLogs[selectedDate] || []);

    // Parse selected date for display
    const selectedDateObj = selectedDate ? new Date(selectedDate) : new Date();
    const selectedDay = selectedDateObj.getDate();
    const selectedMonthShort = TH_MONTHS_SHORT[selectedDateObj.getMonth()];

    container.innerHTML = `
    <!-- Header -->
    <div class="health-summary-card rounded-3xl p-4 mb-4">
      <div class="flex items-center justify-between">
        <!-- Month Navigation -->
        <button onclick="navigateSummaryMonth(-1)" 
          class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all">
          <i class="fa-solid fa-chevron-left text-slate-500"></i>
        </button>
        
        <div class="text-center flex-1">
          <h2 class="text-xl font-bold text-slate-800 font-kanit">${TH_MONTHS_FULL[currentMonth]}</h2>
          <p class="text-sm text-slate-500 font-poppins">${currentYear + 543}</p>
        </div>
        
        <button onclick="navigateSummaryMonth(1)" 
          class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all">
          <i class="fa-solid fa-chevron-right text-slate-500"></i>
        </button>
      </div>
      
      <!-- Today Button -->
      <div class="flex justify-center mt-3">
        <button onclick="goToSummaryToday()" 
          class="px-4 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-full text-xs font-bold transition-all flex items-center gap-1.5">
          <i class="fa-solid fa-calendar-day"></i>
          วันนี้
        </button>
      </div>
    </div>
    
    <!-- Calendar Grid -->
    <div class="health-summary-card rounded-3xl p-4 mb-4">
      <!-- Day Headers -->
      <div class="grid grid-cols-7 gap-1 mb-2">
        ${TH_DAYS.map((d, i) => `
          <div class="text-center text-xs font-medium ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'} py-2 font-kanit">
            ${d}
          </div>
        `).join('')}
      </div>
      
      <!-- Calendar Days -->
      <div class="grid grid-cols-7 gap-1">
        ${daysHtml}
      </div>
      
      <!-- Legend -->
      <div class="mt-4 pt-4 border-t border-slate-100 flex flex-wrap justify-center gap-3">
        <div class="flex items-center gap-1.5">
          <div class="w-2 h-2 rounded-full bg-red-400"></div>
          <span class="text-[10px] text-slate-500">ความดัน</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-2 h-2 rounded-full bg-green-400"></div>
          <span class="text-[10px] text-slate-500">ยา</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-2 h-2 rounded-full bg-blue-400"></div>
          <span class="text-[10px] text-slate-500">ออกกำลังกาย</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-2 h-2 rounded-full bg-slate-400"></div>
          <span class="text-[10px] text-slate-500">อาการ</span>
        </div>
      </div>
    </div>
    
    <!-- Daily Log Timeline -->
    <div class="health-summary-card rounded-3xl p-4">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <i class="fa-solid fa-clipboard-list text-orange-500 text-sm"></i>
          </div>
          <div>
            <h3 class="font-bold text-slate-800 font-kanit">บันทึกประจำวัน</h3>
            <p class="text-xs text-slate-500">${selectedDay} ${selectedMonthShort} ${selectedDateObj.getFullYear() + 543}</p>
          </div>
        </div>
      </div>
      
      ${timelineHtml}
    </div>
  `;
}

// ===== Render Timeline =====
function renderTimeline(dateKey, logs) {
    if (!logs || logs.length === 0) {
        return `
      <div class="text-center py-8">
        <div class="text-5xl mb-3 animate-bounce-slow">🐠</div>
        <p class="text-slate-500 font-kanit">ยังไม่มีบันทึกในวันนี้</p>
        <p class="text-xs text-slate-400 mt-1">ไปบันทึกสุขภาพในแอป LINE กันเถอะ!</p>
      </div>
    `;
    }

    return `
    <div class="space-y-3">
      ${logs.map((log, index) => {
        const cat = LOG_CATEGORIES[log.category] || LOG_CATEGORIES.vitals;
        const isLast = index === logs.length - 1;

        return `
          <div class="relative flex gap-3 timeline-item" style="animation-delay: ${index * 0.1}s">
            <!-- Timeline Line -->
            ${!isLast ? `
              <div class="absolute left-4 top-10 w-0.5 h-full -translate-x-1/2 bg-gradient-to-b from-slate-200 to-transparent"></div>
            ` : ''}
            
            <!-- Time -->
            <div class="flex-shrink-0 w-12 text-right">
              <span class="text-xs font-semibold text-slate-400 font-poppins">${log.time}</span>
            </div>
            
            <!-- Card -->
            <div class="flex-1 ${cat.bgColor} ${cat.borderColor} border rounded-2xl p-3 relative overflow-hidden group hover:shadow-md transition-shadow">
              <!-- Decorative blur -->
              <div class="absolute -right-4 -top-4 w-16 h-16 ${cat.iconBg} rounded-full opacity-50 blur-xl"></div>
              
              <div class="flex items-start gap-3 relative">
                <div class="w-10 h-10 ${cat.iconBg} rounded-xl flex items-center justify-center flex-shrink-0">
                  <i class="fa-solid ${cat.icon} ${cat.iconColor}"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-slate-700 font-kanit text-sm">${log.title}</p>
                  <p class="text-xs text-slate-500">${log.subtitle || ''}</p>
                  ${log.status ? `
                    <span class="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 ${log.status.bg} ${log.status.color} rounded-full text-[10px] font-bold">
                      ${log.status.label}
                    </span>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
    }).join('')}
    </div>
  `;
}

// ===== Initialize Health Summary =====
function initHealthSummary() {
    // Set to current date
    const today = new Date();
    HealthSummaryState.currentYear = today.getFullYear();
    HealthSummaryState.currentMonth = today.getMonth();
    HealthSummaryState.selectedDate = null; // Will auto-select today

    // Render
    renderHealthSummary();
}

// Expose to global scope
window.navigateSummaryMonth = navigateSummaryMonth;
window.goToSummaryToday = goToSummaryToday;
window.selectSummaryDate = selectSummaryDate;
window.renderHealthSummary = renderHealthSummary;
window.initHealthSummary = initHealthSummary;
