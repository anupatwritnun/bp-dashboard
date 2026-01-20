// ===== Calendar Module =====
// Apple Health-inspired calendar view with glassmorphism

window.CalendarState = {
    currentYear: 2026,
    currentMonth: 0, // January (0-indexed)
    selectedDate: null,
    healthData: {} // Will be populated from AppState.bpRecords
};

// ===== Status Classification =====
function classifyBP(sys, dia) {
    if (sys < 120 && dia < 80) return 'normal';
    if (sys < 130 && dia < 80) return 'elevated';
    if (sys < 140 || dia < 90) return 'stage1';
    return 'stage2';
}

function getStatusConfig(status) {
    const configs = {
        normal: {
            label: 'ปกติ',
            gradient: 'from-emerald-100 to-green-200',
            textColor: 'text-emerald-700',
            bgColor: 'bg-emerald-500',
            ringColor: 'ring-emerald-400',
            icon: '✓',
            barColor: 'from-emerald-400 to-green-500'
        },
        elevated: {
            label: 'สูงกว่าปกติ',
            gradient: 'from-amber-100 to-yellow-200',
            textColor: 'text-amber-700',
            bgColor: 'bg-amber-500',
            ringColor: 'ring-amber-400',
            icon: '⚠',
            barColor: 'from-amber-400 to-yellow-500'
        },
        stage1: {
            label: 'ความดันสูง ระยะ 1',
            gradient: 'from-orange-100 to-amber-200',
            textColor: 'text-orange-700',
            bgColor: 'bg-orange-500',
            ringColor: 'ring-orange-400',
            icon: '!',
            barColor: 'from-orange-400 to-red-400'
        },
        stage2: {
            label: 'ความดันสูง ระยะ 2',
            gradient: 'from-red-100 to-rose-200',
            textColor: 'text-red-700',
            bgColor: 'bg-red-500',
            ringColor: 'ring-red-400',
            icon: '!!',
            barColor: 'from-red-400 to-rose-500'
        }
    };
    return configs[status] || configs.normal;
}

// ===== Build Health Data from BP Records =====
function buildHealthDataFromRecords() {
    const healthData = {};

    if (AppState.bpRecords && AppState.bpRecords.length > 0) {
        AppState.bpRecords.forEach(record => {
            const dateKey = record.date; // Format: YYYY-MM-DD

            // Get BP values
            const sys = parseInt(record.sys) || 120;
            const dia = parseInt(record.dia) || 80;
            const pulse = parseInt(record.pulse) || 72;

            // Classify status
            const status = classifyBP(sys, dia);

            // Build data entry
            healthData[dateKey] = {
                bp: `${sys}/${dia}`,
                sys: sys,
                dia: dia,
                pulse: pulse,
                status: status,
                time: record.time || 'morning',
                risks: record.risk_factors || [],
                habits: record.positive_habits || [],
                symptoms: record.symptoms || []
            };
        });
    }

    return healthData;
}

// ===== Month Navigation =====
function navigateMonth(direction) {
    CalendarState.currentMonth += direction;

    if (CalendarState.currentMonth > 11) {
        CalendarState.currentMonth = 0;
        CalendarState.currentYear++;
    } else if (CalendarState.currentMonth < 0) {
        CalendarState.currentMonth = 11;
        CalendarState.currentYear--;
    }

    CalendarState.selectedDate = null;
    renderCalendar();
}

// ===== Day Selection =====
function selectDate(dateKey) {
    CalendarState.selectedDate = dateKey;
    renderCalendar();
}

// ===== Get Days in Month =====
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

// ===== Thai Month Names =====
const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

// ===== Risk & Habit Icons =====
const RISK_ICONS = {
    salty: { icon: '🧂', label: 'กินเค็ม' },
    sleep: { icon: '😴', label: 'นอนน้อย' },
    stress: { icon: '😰', label: 'เครียด' },
    alcohol: { icon: '🍺', label: 'ดื่มเหล้า' },
    smoking: { icon: '🚬', label: 'สูบบุหรี่' },
    coffee: { icon: '☕', label: 'กาแฟ' }
};

const HABIT_ICONS = {
    veggies: { icon: '🥬', label: 'กินผัก' },
    exercise: { icon: '🏃', label: 'ออกกำลัง' },
    water: { icon: '💧', label: 'ดื่มน้ำ' },
    meditation: { icon: '🧘', label: 'นั่งสมาธิ' },
    sleep_well: { icon: '😴', label: 'นอนพอ' }
};

const SYMPTOM_ICONS = {
    headache: { icon: '🤕', label: 'ปวดหัว' },
    dizzy: { icon: '💫', label: 'เวียนศีรษะ' },
    chest_pain: { icon: '💔', label: 'เจ็บหน้าอก' },
    nausea: { icon: '🤢', label: 'คลื่นไส้' },
    blur: { icon: '👁️', label: 'ตาพร่า' }
};

// ===== Render Calendar =====
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    if (!container) return;

    // Build health data from records
    CalendarState.healthData = buildHealthDataFromRecords();

    const { currentYear, currentMonth, selectedDate, healthData } = CalendarState;
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    // Build calendar days HTML
    let daysHtml = '';

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        daysHtml += `<div class="calendar-day-empty"></div>`;
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const data = healthData[dateKey];
        const isSelected = selectedDate === dateKey;
        const hasData = !!data;

        // Calculate animation delay for staggered effect
        const animDelay = (firstDay + day - 1) * 0.02;

        // Determine status colors
        let statusClass = '';
        let statusBg = '';
        if (hasData) {
            const config = getStatusConfig(data.status);
            statusBg = `bg-gradient-to-br ${config.gradient}`;
        }

        const selectedClass = isSelected
            ? 'ring-4 ring-blue-400 ring-offset-2 scale-110 z-10 shadow-lg shadow-blue-500/30'
            : '';

        const dataIndicator = hasData
            ? `<div class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${getStatusConfig(data.status).bgColor}"></div>`
            : '';

        daysHtml += `
      <button 
        onclick="selectDate('${dateKey}')"
        class="calendar-day relative aspect-square rounded-xl flex items-center justify-center font-medium
               ${hasData ? statusBg : 'bg-white/50 hover:bg-white/80'} 
               ${selectedClass}
               transition-all duration-200 calendar-pop-in"
        style="animation-delay: ${animDelay}s"
      >
        <span class="${hasData ? 'text-slate-700 font-semibold' : 'text-slate-500'}">${day}</span>
        ${dataIndicator}
      </button>
    `;
    }

    // Build detail panel
    let detailPanelHtml = '';
    if (selectedDate && healthData[selectedDate]) {
        detailPanelHtml = renderDetailPanel(selectedDate, healthData[selectedDate]);
    } else {
        detailPanelHtml = renderEmptyState(selectedDate);
    }

    container.innerHTML = `
    <!-- Mesh Gradient Background -->
    <div class="calendar-bg absolute inset-0 -z-10"></div>
    
    <!-- Header with Glass Effect -->
    <div class="calendar-header-glass rounded-2xl p-4 mb-4 flex items-center justify-between">
      <button onclick="navigateMonth(-1)" class="w-10 h-10 rounded-xl bg-white/30 hover:bg-white/50 flex items-center justify-center transition-all">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <div class="text-center">
        <h2 class="text-xl font-bold text-white">${THAI_MONTHS[currentMonth]}</h2>
        <p class="text-sm text-white/70">${currentYear + 543}</p>
      </div>
      <button onclick="navigateMonth(1)" class="w-10 h-10 rounded-xl bg-white/30 hover:bg-white/50 flex items-center justify-center transition-all">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
    
    <!-- Calendar Grid (Glass Card) -->
    <div class="calendar-glass-card rounded-3xl p-4 mb-4">
      <!-- Day Headers -->
      <div class="grid grid-cols-7 gap-2 mb-3">
        ${THAI_DAYS.map(d => `<div class="text-center text-xs font-medium text-slate-400 py-1">${d}</div>`).join('')}
      </div>
      
      <!-- Calendar Days -->
      <div class="grid grid-cols-7 gap-2">
        ${daysHtml}
      </div>
      
      <!-- Legend -->
      <div class="mt-4 pt-4 border-t border-slate-100 flex flex-wrap justify-center gap-3 text-xs">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-100 to-green-200"></div>
          <span class="text-slate-500">ปกติ</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-gradient-to-br from-amber-100 to-yellow-200"></div>
          <span class="text-slate-500">สูงกว่าปกติ</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-gradient-to-br from-orange-100 to-amber-200"></div>
          <span class="text-slate-500">ระยะ 1</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full bg-gradient-to-br from-red-100 to-rose-200"></div>
          <span class="text-slate-500">ระยะ 2</span>
        </div>
      </div>
    </div>
    
    <!-- Detail Panel -->
    <div class="detail-panel-slide">${detailPanelHtml}</div>
  `;
}

// ===== Render Empty State =====
function renderEmptyState(selectedDate) {
    const dateStr = selectedDate
        ? new Date(selectedDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })
        : 'เลือกวันที่';

    return `
    <div class="calendar-glass-card rounded-3xl p-8 text-center">
      <div class="text-6xl mb-4 animate-bounce-slow">🐠</div>
      <h3 class="text-lg font-bold text-slate-700 mb-2">
        ${selectedDate ? `ยังไม่มีข้อมูล` : 'เลือกวันที่เพื่อดูรายละเอียด'}
      </h3>
      <p class="text-sm text-slate-500">
        ${selectedDate ? `วันที่ ${dateStr} ยังไม่มีการบันทึกความดัน` : 'แตะที่วันใดๆ ในปฏิทินเพื่อดูข้อมูลสุขภาพ'}
      </p>
      ${selectedDate ? `
        <div class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-full text-sm font-medium">
          <span>📝</span> ไปบันทึกในแอป LINE
        </div>
      ` : ''}
    </div>
  `;
}

// ===== Render Detail Panel (Bento Grid) =====
function renderDetailPanel(dateKey, data) {
    const config = getStatusConfig(data.status);
    const date = new Date(dateKey);
    const dateStr = date.toLocaleDateString('th-TH', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Calculate BP bar width (max 200 for SYS)
    const bpBarWidth = Math.min((data.sys / 200) * 100, 100);

    // Build risks HTML
    let risksHtml = '';
    if (data.risks && data.risks.length > 0) {
        risksHtml = data.risks.map(risk => {
            const riskInfo = RISK_ICONS[risk] || { icon: '⚠️', label: risk };
            return `
        <div class="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl">
          <span class="text-lg">${riskInfo.icon}</span>
          <span class="text-xs font-medium text-red-600">${riskInfo.label}</span>
        </div>
      `;
        }).join('');
    } else {
        risksHtml = '<p class="text-xs text-slate-400">ไม่มีปัจจัยเสี่ยง</p>';
    }

    // Build habits HTML
    let habitsHtml = '';
    if (data.habits && data.habits.length > 0) {
        habitsHtml = data.habits.map(habit => {
            const habitInfo = HABIT_ICONS[habit] || { icon: '✅', label: habit };
            return `
        <div class="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl">
          <span class="text-lg">${habitInfo.icon}</span>
          <span class="text-xs font-medium text-green-600">${habitInfo.label}</span>
        </div>
      `;
        }).join('');
    } else {
        habitsHtml = '<p class="text-xs text-slate-400">ไม่มีพฤติกรรมดี</p>';
    }

    // Build symptoms HTML
    let symptomsHtml = '';
    if (data.symptoms && data.symptoms.length > 0) {
        symptomsHtml = data.symptoms.map(symptom => {
            const symptomInfo = SYMPTOM_ICONS[symptom] || { icon: '🩺', label: symptom };
            return `
        <div class="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl">
          <span class="text-lg">${symptomInfo.icon}</span>
          <span class="text-xs font-medium text-amber-700">${symptomInfo.label}</span>
        </div>
      `;
        }).join('');
    }

    return `
    <div class="calendar-glass-card rounded-3xl overflow-hidden">
      <!-- Header with BP -->
      <div class="bg-gradient-to-br ${config.gradient} p-5">
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="text-xs ${config.textColor} opacity-70">${dateStr}</p>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="text-4xl font-bold ${config.textColor}">${data.bp}</span>
              <span class="text-sm ${config.textColor} opacity-70">mmHg</span>
            </div>
          </div>
          <div class="px-3 py-1.5 ${config.bgColor} text-white rounded-full text-xs font-bold shadow-lg">
            ${config.label}
          </div>
        </div>
        
        <!-- Visual Gauge -->
        <div class="relative h-2 bg-white/30 rounded-full overflow-hidden mt-4">
          <div class="absolute inset-0 bg-gradient-to-r ${config.barColor} rounded-full transition-all duration-500"
               style="width: ${bpBarWidth}%"></div>
        </div>
        <div class="flex justify-between text-[10px] ${config.textColor} opacity-50 mt-1">
          <span>80</span>
          <span>120</span>
          <span>140</span>
          <span>180+</span>
        </div>
      </div>
      
      <!-- Bento Grid -->
      <div class="p-4 grid grid-cols-2 gap-3">
        <!-- Pulse Card -->
        <div class="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
          <div class="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
            <span class="text-rose-500 text-lg">❤️</span>
          </div>
          <div>
            <p class="text-2xl font-bold text-slate-700">${data.pulse || '–'}</p>
            <p class="text-xs text-slate-400">ชีพจร/นาที</p>
          </div>
        </div>
        
        <!-- Time Card -->
        <div class="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <span class="text-blue-500 text-lg">${data.time === 'morning' ? '🌅' : data.time === 'evening' ? '🌆' : '⏰'}</span>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-700">${data.time === 'morning' ? 'เช้า' : data.time === 'evening' ? 'เย็น' : 'อื่นๆ'}</p>
            <p class="text-xs text-slate-400">ช่วงเวลาวัด</p>
          </div>
        </div>
        
        <!-- Risks Card -->
        <div class="bg-white border border-red-100 rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-sm">⚠️</span>
            <span class="text-xs font-bold text-red-600">ปัจจัยเสี่ยง</span>
          </div>
          <div class="flex flex-wrap gap-2">
            ${risksHtml}
          </div>
        </div>
        
        <!-- Habits Card -->
        <div class="bg-white border border-green-100 rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-sm">✅</span>
            <span class="text-xs font-bold text-green-600">พฤติกรรมดี</span>
          </div>
          <div class="flex flex-wrap gap-2">
            ${habitsHtml}
          </div>
        </div>
      </div>
      
      <!-- Symptoms (Full Width) -->
      ${data.symptoms && data.symptoms.length > 0 ? `
        <div class="px-4 pb-4">
          <div class="bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-sm">🩺</span>
              <span class="text-xs font-bold text-amber-700">อาการที่พบ</span>
            </div>
            <div class="flex flex-wrap gap-2">
              ${symptomsHtml}
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// ===== Initialize Calendar =====
function initCalendar() {
    // Set to current date
    const today = new Date();
    CalendarState.currentYear = today.getFullYear();
    CalendarState.currentMonth = today.getMonth();

    // Render
    renderCalendar();
}

// Expose to global scope
window.navigateMonth = navigateMonth;
window.selectDate = selectDate;
window.renderCalendar = renderCalendar;
window.initCalendar = initCalendar;
