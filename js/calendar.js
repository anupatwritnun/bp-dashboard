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

  // Get data from AppState
  const records = AppState.bpRecords || [];
  const goodHabits = AppState.goodHabits || [];
  const badHabits = AppState.badHabits || [];
  const symptomLogs = AppState.symptomLogs || [];
  const weightLogs = AppState.weightLogs || [];

  // Map Thai time to English
  const timeMap = {
    'เช้า': 'morning',
    'บ่าย': 'afternoon',
    'เย็น': 'evening',
    'ดึก': 'night'
  };

  // Build lookup maps for habits/symptoms by date
  const goodHabitsByDate = {};
  goodHabits.forEach(h => {
    if (!goodHabitsByDate[h.date]) goodHabitsByDate[h.date] = [];
    goodHabitsByDate[h.date].push(h);
  });

  const badHabitsByDate = {};
  badHabits.forEach(h => {
    if (!badHabitsByDate[h.date]) badHabitsByDate[h.date] = [];
    badHabitsByDate[h.date].push(h);
  });

  const symptomsByDate = {};
  symptomLogs.forEach(s => {
    if (!symptomsByDate[s.date]) symptomsByDate[s.date] = [];
    symptomsByDate[s.date].push(s);
  });

  const weightByDate = {};
  weightLogs.forEach(w => {
    weightByDate[w.date] = w;
  });

  // Process BP records
  if (records.length > 0) {
    records.forEach(record => {
      const dateKey = record.date; // Format: YYYY-MM-DD

      // Get BP values (handle both field naming conventions)
      const sys = parseInt(record.systolic || record.sys) || 120;
      const dia = parseInt(record.diastolic || record.dia) || 80;
      const pulse = record.pulse ? parseInt(record.pulse) : null;

      // Map Thai time to internal format
      const timeValue = timeMap[record.time] || record.time || 'morning';

      // Classify status
      const status = classifyBP(sys, dia);

      // Get good habits for this date
      const dateGoodHabits = goodHabitsByDate[dateKey] || [];
      const habits = [];
      dateGoodHabits.forEach(h => {
        if (h.meditation) habits.push('meditation');
        if (h.high_veggies) habits.push('veggies');
        if (h.exercise_bracket && h.exercise_bracket !== 'none') habits.push('exercise');
      });

      // Get bad habits (risk factors) for this date
      const dateBadHabits = badHabitsByDate[dateKey] || [];
      const risks = [];
      dateBadHabits.forEach(h => {
        if (h.forgot_meds) risks.push('forgot_meds');
        if (h.high_salt) risks.push('salty');
        if (h.poor_sleep) risks.push('sleep');
        if (h.alcohol_intake) risks.push('alcohol');
        if (h.smoking) risks.push('smoking');
        if (h.high_stress) risks.push('stress');
      });

      // Get symptoms for this date
      const dateSymptoms = symptomsByDate[dateKey] || [];
      const symptoms = [];
      dateSymptoms.forEach(s => {
        if (s.fatigue) symptoms.push('fatigue');
        if (s.chest_pain) symptoms.push('chest_pain');
        if (s.breathlessness) symptoms.push('breathlessness');
        if (s.weak_limbs) symptoms.push('weak_limbs');
        if (s.headache) symptoms.push('headache');
        if (s.dizziness) symptoms.push('dizzy');
        if (s.blurred_vision) symptoms.push('blur');
        if (s.nosebleed) symptoms.push('nosebleed');
        if (s.swelling) symptoms.push('swelling');
      });

      // Get weight for this date
      const dateWeight = weightByDate[dateKey];

      // Build data entry (only keep first record for each date, or update with latest)
      if (!healthData[dateKey]) {
        healthData[dateKey] = {
          bp: `${sys}/${dia}`,
          sys: sys,
          dia: dia,
          pulse: pulse,
          status: status,
          time: timeValue,
          timeLabel: record.time || 'เช้า',
          risks: [...new Set(risks)], // Remove duplicates
          habits: [...new Set(habits)],
          symptoms: [...new Set(symptoms)],
          weight: dateWeight?.weight || null,
          bmi: dateWeight?.bmi || null
        };
      }
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
  coffee: { icon: '☕', label: 'กาแฟ' },
  forgot_meds: { icon: '💊', label: 'ลืมทานยา' }
};

const HABIT_ICONS = {
  veggies: { icon: '🥬', label: 'กินผัก' },
  exercise: { icon: '🏃', label: 'ออกกำลังกาย' },
  water: { icon: '💧', label: 'ดื่มน้ำ' },
  meditation: { icon: '🧘', label: 'นั่งสมาธิ' },
  sleep_well: { icon: '😴', label: 'นอนพอ' },
  medication: { icon: '💊', label: 'ยา/อาหารเสริม' }
};

const SYMPTOM_ICONS = {
  headache: { icon: '🤕', label: 'ปวดหัว' },
  dizzy: { icon: '💫', label: 'เวียนศีรษะ' },
  chest_pain: { icon: '💔', label: 'เจ็บหน้าอก' },
  nausea: { icon: '🤢', label: 'คลื่นไส้' },
  blur: { icon: '👁️', label: 'ตาพร่า' },
  fatigue: { icon: '😩', label: 'อ่อนเพลีย' },
  breathlessness: { icon: '😮‍💨', label: 'หายใจลำบาก' },
  weak_limbs: { icon: '🦵', label: 'แขนขาอ่อนแรง' },
  nosebleed: { icon: '🩸', label: 'เลือดกำเดา' },
  swelling: { icon: '🦶', label: 'บวม' }
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

  // Build risks tags HTML
  let riskTagsHtml = '';
  if (data.risks && data.risks.length > 0) {
    riskTagsHtml = data.risks.map(risk => {
      const riskInfo = RISK_ICONS[risk] || { icon: '⚡', label: risk };
      return `
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                <span>${riskInfo.icon}</span> ${riskInfo.label}
              </span>
            `;
    }).join('');
  }

  // Build habits tags HTML
  let habitTagsHtml = '';
  if (data.habits && data.habits.length > 0) {
    habitTagsHtml = data.habits.map(habit => {
      const habitInfo = HABIT_ICONS[habit] || { icon: '✅', label: habit };
      return `
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                <span>${habitInfo.icon}</span> ${habitInfo.label}
              </span>
            `;
    }).join('');
  }

  // Build symptoms tags HTML
  let symptomTagsHtml = '';
  if (data.symptoms && data.symptoms.length > 0) {
    symptomTagsHtml = data.symptoms.map(symptom => {
      const symptomInfo = SYMPTOM_ICONS[symptom] || { icon: '🩺', label: symptom };
      return `
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                <span>●</span> ${symptomInfo.label}
              </span>
            `;
    }).join('');
  }

  return `
    <div class="space-y-3">
      <!-- BP Header Card -->
      <div class="calendar-glass-card rounded-3xl overflow-hidden">
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
      
      <!-- Risk & Habits Row -->
      <div class="grid grid-cols-2 gap-3">
        <!-- ปัจจัยเสี่ยง Card -->
        <div class="calendar-glass-card rounded-2xl p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-lg">⚠️</span>
              <span class="text-sm font-bold text-slate-700">ปัจจัยเสี่ยง</span>
            </div>
            ${data.risks && data.risks.length > 0 ? `
              <div class="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                <svg class="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            ` : `
              <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            `}
          </div>
          <div class="flex flex-wrap gap-2">
            ${riskTagsHtml || '<span class="text-xs text-slate-400">ไม่มี</span>'}
          </div>
        </div>
        
        <!-- ทำได้ดี Card -->
        <div class="calendar-glass-card rounded-2xl p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-lg">🎉</span>
              <span class="text-sm font-bold text-slate-700">ทำได้ดี</span>
            </div>
            ${data.habits && data.habits.length > 0 ? `
              <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            ` : `
              <div class="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                <span class="text-[10px] text-slate-400">–</span>
              </div>
            `}
          </div>
          <div class="flex flex-wrap gap-2">
            ${habitTagsHtml || '<span class="text-xs text-slate-400">ไม่มี</span>'}
          </div>
        </div>
      </div>
      
      <!-- อาการวันนี้ Card (Full Width) -->
      <div class="calendar-glass-card rounded-2xl p-4">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 bg-teal-100 rounded-xl flex items-center justify-center">
            <span class="text-teal-600 text-sm">🩺</span>
          </div>
          <span class="text-sm font-bold text-slate-700">อาการวันนี้</span>
        </div>
        <div class="flex flex-wrap gap-2">
          ${symptomTagsHtml || '<span class="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">ไม่มีอาการผิดปกติ 🎉</span>'}
        </div>
      </div>
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
