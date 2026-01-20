// ===== Health Summary Module =====
// Apple Health-inspired health summary dashboard

window.HealthSummaryState = {
  dateFilter: 'this-month', // 'custom', 'this-month', '3-months', 'all'
  startDate: null,
  endDate: null
};

// ===== Calculate Stats from BP Records =====
function calculateHealthStats() {
  const records = AppState.bpRecords || [];
  const goodHabits = AppState.goodHabits || [];
  const badHabits = AppState.badHabits || [];
  const symptomLogs = AppState.symptomLogs || [];
  const weightLogs = AppState.weightLogs || [];

  // Filter records based on date range
  let filteredRecords = filterRecordsByDateRange(records);
  let filteredGoodHabits = filterRecordsByDateRange(goodHabits);
  let filteredBadHabits = filterRecordsByDateRange(badHabits);
  let filteredSymptoms = filterRecordsByDateRange(symptomLogs);

  // BP Recording Stats - count by Thai time labels
  const morningRecords = filteredRecords.filter(r => r.time === 'เช้า');
  const eveningRecords = filteredRecords.filter(r => r.time === 'เย็น');
  const otherRecords = filteredRecords.filter(r => r.time !== 'เช้า' && r.time !== 'เย็น');

  // Aggregate good habits
  const positiveHabits = {};
  filteredGoodHabits.forEach(h => {
    if (h.meditation) positiveHabits['meditation'] = (positiveHabits['meditation'] || 0) + 1;
    if (h.high_veggies) positiveHabits['veggies'] = (positiveHabits['veggies'] || 0) + 1;
    if (h.exercise_bracket && h.exercise_bracket !== 'none') positiveHabits['exercise'] = (positiveHabits['exercise'] || 0) + 1;
  });

  // Aggregate bad habits (risk factors)
  const riskFactors = {};
  filteredBadHabits.forEach(h => {
    if (h.forgot_meds) riskFactors['forgot_meds'] = (riskFactors['forgot_meds'] || 0) + 1;
    if (h.high_salt) riskFactors['salty'] = (riskFactors['salty'] || 0) + 1;
    if (h.poor_sleep) riskFactors['sleep'] = (riskFactors['sleep'] || 0) + 1;
    if (h.alcohol_intake) riskFactors['alcohol'] = (riskFactors['alcohol'] || 0) + 1;
    if (h.smoking) riskFactors['smoking'] = (riskFactors['smoking'] || 0) + 1;
    if (h.high_stress) riskFactors['stress'] = (riskFactors['stress'] || 0) + 1;
  });

  // Aggregate symptoms
  const symptoms = {};
  filteredSymptoms.forEach(s => {
    if (s.fatigue) symptoms['fatigue'] = (symptoms['fatigue'] || 0) + 1;
    if (s.chest_pain) symptoms['chest_pain'] = (symptoms['chest_pain'] || 0) + 1;
    if (s.breathlessness) symptoms['breathlessness'] = (symptoms['breathlessness'] || 0) + 1;
    if (s.weak_limbs) symptoms['weak_limbs'] = (symptoms['weak_limbs'] || 0) + 1;
    if (s.headache) symptoms['headache'] = (symptoms['headache'] || 0) + 1;
    if (s.dizziness) symptoms['dizzy'] = (symptoms['dizzy'] || 0) + 1;
    if (s.blurred_vision) symptoms['blur'] = (symptoms['blur'] || 0) + 1;
    if (s.nosebleed) symptoms['nosebleed'] = (symptoms['nosebleed'] || 0) + 1;
    if (s.swelling) symptoms['swelling'] = (symptoms['swelling'] || 0) + 1;
  });

  // Get latest weight data
  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : null;

  return {
    totalRecords: filteredRecords.length,
    morningCount: morningRecords.length,
    eveningCount: eveningRecords.length,
    otherCount: otherRecords.length,
    weight: latestWeight?.weight || null,
    height: latestWeight?.height || null,
    bmi: latestWeight?.bmi || null,
    positiveHabits,
    riskFactors,
    symptoms,
    daysInRange: getDaysInRange()
  };
}

function filterRecordsByDateRange(records) {
  const { dateFilter, startDate, endDate } = HealthSummaryState;
  const now = new Date();
  let filterStart, filterEnd;

  switch (dateFilter) {
    case 'this-month':
      filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filterEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case '3-months':
      filterStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      filterEnd = now;
      break;
    case 'all':
      return records;
    case 'custom':
      filterStart = startDate ? new Date(startDate) : new Date(0);
      filterEnd = endDate ? new Date(endDate) : now;
      break;
    default:
      return records;
  }

  return records.filter(r => {
    const recordDate = new Date(r.date);
    return recordDate >= filterStart && recordDate <= filterEnd;
  });
}

function getDaysInRange() {
  const { dateFilter } = HealthSummaryState;
  const now = new Date();

  switch (dateFilter) {
    case 'this-month':
      return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    case '3-months':
      return 90;
    case 'all':
      return 365;
    default:
      return 31;
  }
}

function getDateRangeText() {
  const { dateFilter, startDate, endDate } = HealthSummaryState;
  const now = new Date();
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${(d.getFullYear() + 543) % 100}`;
  };

  switch (dateFilter) {
    case 'this-month':
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return `${formatDate(firstDay)} - ${formatDate(lastDay)}`;
    case '3-months':
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return `${formatDate(threeMonthsAgo)} - ${formatDate(now)}`;
    case 'all':
      return 'ทั้งหมด';
    case 'custom':
      if (startDate && endDate) {
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
      }
      return 'เลือกช่วงเวลา';
    default:
      return '';
  }
}

// ===== Habit & Risk Labels =====
const HABIT_LABELS = {
  medication: 'ทานยาตรงเวลา',
  veggies: 'ทานผัก/ผลไม้',
  exercise: 'ออกกำลังกาย',
  water: 'ดื่มน้ำเพียงพอ',
  sleep_well: 'นอนหลับเพียงพอ',
  meditation: 'นั่งสมาธิ/ผ่อนคลาย'
};

const RISK_LABELS = {
  salty: 'ทานรสเค็มจัด',
  sleep: 'นอนน้อย (< 6 ชม.)',
  stress: 'เครียด/กังวล',
  alcohol: 'ดื่มเครื่องดื่มแอลกอฮอล์',
  smoking: 'สูบบุหรี่',
  coffee: 'ดื่มกาแฟมาก',
  forgot_meds: 'ลืมทานยา'
};

const SYMPTOM_LABELS = {
  headache: 'ปวดหัว',
  dizzy: 'เวียนศีรษะ',
  fatigue: 'อ่อนเพลีย',
  nausea: 'คลื่นไส้',
  chest_pain: 'เจ็บหน้าอก',
  blur: 'ตาพร่ามัว',
  palpitation: 'ใจสั่น',
  breathlessness: 'หายใจลำบาก',
  weak_limbs: 'แขนขาอ่อนแรง',
  nosebleed: 'เลือดกำเดา',
  swelling: 'บวม'
};

// ===== Set Date Filter =====
function setHealthSummaryFilter(filter) {
  HealthSummaryState.dateFilter = filter;
  renderHealthSummary();
}

// ===== BMI Classification =====
function getBMIStatus(bmi) {
  if (!bmi) return { label: '-', color: 'gray' };
  if (bmi < 18.5) return { label: 'น้ำหนักน้อย', color: 'blue' };
  if (bmi < 25) return { label: 'น้ำหนักปกติ', color: 'purple' };
  if (bmi < 30) return { label: 'น้ำหนักเกิน', color: 'orange' };
  return { label: 'อ้วน', color: 'red' };
}

// ===== Render Health Summary =====
function renderHealthSummary() {
  const container = document.getElementById('health-summary-container');
  if (!container) return;

  const stats = calculateHealthStats();
  const dateRangeText = getDateRangeText();
  const bmiStatus = getBMIStatus(stats.bmi);

  // Sort habits and risks by count
  const sortedHabits = Object.entries(stats.positiveHabits).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const sortedRisks = Object.entries(stats.riskFactors).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const sortedSymptoms = Object.entries(stats.symptoms).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // Max values for progress bars
  const maxSymptomCount = sortedSymptoms.length > 0 ? sortedSymptoms[0][1] : 1;

  container.innerHTML = `
    <!-- Header Section -->
    <div class="sticky top-0 z-20 bg-white/95 backdrop-blur-sm pt-2 pb-4 border-b border-gray-50">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold text-gray-800">สรุปสุขภาพ</h1>
        <div class="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 text-gray-400">
          <i class="fa-solid fa-chart-pie"></i>
        </div>
      </div>

      <!-- Date Filter Pills -->
      <div class="w-full overflow-x-auto hide-scrollbar -mx-4 px-4 mb-3">
        <div class="flex space-x-3">
          <button onclick="setHealthSummaryFilter('custom')" 
            class="flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all active:scale-95
            ${HealthSummaryState.dateFilter === 'custom' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}">
            กำหนดเอง
          </button>
          <button onclick="setHealthSummaryFilter('this-month')"
            class="flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all active:scale-95
            ${HealthSummaryState.dateFilter === 'this-month' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}">
            เดือนนี้
          </button>
          <button onclick="setHealthSummaryFilter('3-months')"
            class="flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all active:scale-95
            ${HealthSummaryState.dateFilter === '3-months' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}">
            3 เดือน
          </button>
          <button onclick="setHealthSummaryFilter('all')"
            class="flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all active:scale-95
            ${HealthSummaryState.dateFilter === 'all' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}">
            ทั้งหมด
          </button>
        </div>
      </div>

      <!-- Selected Date Range Display -->
      <div class="bg-gray-50 rounded-2xl p-3 flex justify-between items-center border border-gray-100">
        <div class="flex items-center gap-3 text-gray-600">
          <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand-500 shadow-sm">
            <i class="fa-regular fa-calendar-days text-xs"></i>
          </div>
          <div class="flex flex-col">
            <span class="text-[10px] text-gray-400 font-medium">ช่วงเวลาที่เลือก</span>
            <span class="text-sm font-bold text-gray-700">${dateRangeText}</span>
          </div>
        </div>
        <i class="fa-solid fa-chevron-right text-xs text-gray-400"></i>
      </div>
    </div>

    <!-- Scrollable Content -->
    <div class="space-y-6 pb-8">
      
      <!-- Blood Pressure Section -->
      <div class="mt-6">
        <h3 class="text-sm font-bold text-gray-400 mb-3 pl-1">บันทึกความดันโลหิต</h3>
        <div class="bg-white border border-gray-100 rounded-3xl p-5 shadow-soft">
          <div class="flex justify-between items-center mb-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                <i class="fa-solid fa-heart-pulse"></i>
              </div>
              <div>
                <h4 class="font-bold text-gray-700">ความดันโลหิต</h4>
                <span class="text-xs text-gray-400">บันทึกทั้งหมด <strong class="text-gray-700">${stats.totalRecords}</strong> ครั้ง</span>
              </div>
            </div>
          </div>
          
          <!-- Time Periods Grid -->
          <div class="grid grid-cols-3 gap-3">
            <!-- Morning -->
            <div class="bg-orange-50/60 rounded-2xl p-3 text-center border border-orange-100/50">
              <i class="fa-regular fa-sun text-orange-400 mb-2 text-lg"></i>
              <div class="text-xs text-gray-500 mb-1 font-medium">เช้า</div>
              <div class="text-xl font-bold text-gray-800 font-poppins">${stats.morningCount}</div>
              <div class="text-[10px] text-gray-400">ครั้ง</div>
            </div>
            <!-- Evening -->
            <div class="bg-indigo-50/60 rounded-2xl p-3 text-center border border-indigo-100/50">
              <i class="fa-regular fa-moon text-indigo-400 mb-2 text-lg"></i>
              <div class="text-xs text-gray-500 mb-1 font-medium">เย็น</div>
              <div class="text-xl font-bold text-gray-800 font-poppins">${stats.eveningCount}</div>
              <div class="text-[10px] text-gray-400">ครั้ง</div>
            </div>
            <!-- Other -->
            <div class="bg-gray-50/80 rounded-2xl p-3 text-center border border-gray-100">
              <i class="fa-regular fa-clock text-gray-400 mb-2 text-lg"></i>
              <div class="text-xs text-gray-500 mb-1 font-medium">ช่วงอื่น</div>
              <div class="text-xl font-bold text-gray-800 font-poppins">${stats.otherCount}</div>
              <div class="text-[10px] text-gray-400">ครั้ง</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Body Metrics Section -->
      <div>
        <h3 class="text-sm font-bold text-gray-400 mb-3 pl-1">สัดส่วนร่างกาย</h3>
        <div class="grid grid-cols-2 gap-4">
          
          <!-- Weight Card -->
          <div class="bg-blue-50/50 p-4 rounded-3xl border border-blue-100 relative">
            <div class="flex justify-between items-start mb-2">
              <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-500 shadow-sm">
                <i class="fa-solid fa-weight-scale text-xs"></i>
              </div>
            </div>
            <div class="mt-2">
              <p class="text-xs text-gray-500 font-medium">น้ำหนัก</p>
              <h4 class="text-2xl font-poppins font-bold text-gray-800">
                ${stats.weight ? stats.weight : '-'} 
                <span class="text-sm text-gray-500 font-normal">กก.</span>
              </h4>
            </div>
            <div class="mt-3 flex items-center gap-1 text-[10px] text-gray-400">
              <i class="fa-solid fa-ruler-vertical"></i>
              <span>ส่วนสูง ${stats.height ? stats.height + ' ซม.' : '-'}</span>
            </div>
          </div>

          <!-- BMI Card -->
          <div class="bg-purple-50/50 p-4 rounded-3xl border border-purple-100">
            <div class="flex justify-between items-start mb-2">
              <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-purple-500 shadow-sm">
                <i class="fa-solid fa-chart-simple text-xs"></i>
              </div>
            </div>
            <div class="mt-2">
              <p class="text-xs text-gray-500 font-medium">BMI</p>
              <h4 class="text-2xl font-poppins font-bold text-gray-800">
                ${stats.bmi ? stats.bmi.toFixed(1) : '-'}
              </h4>
            </div>
            <div class="mt-3">
              <span class="text-[10px] font-bold text-${bmiStatus.color}-600 bg-${bmiStatus.color}-100 px-2 py-1 rounded-md">
                ${bmiStatus.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Habits Analysis -->
      <div>
        <h3 class="text-sm font-bold text-gray-400 mb-3 pl-1">วิเคราะห์พฤติกรรม</h3>
        
        <!-- Positive Habits -->
        <div class="bg-white border border-gray-100 rounded-3xl p-5 shadow-soft mb-4">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
              <i class="fa-solid fa-check"></i>
            </div>
            <h4 class="font-bold text-gray-700">ทำได้ดี</h4>
          </div>
          
          ${sortedHabits.length > 0 ? sortedHabits.map(([habit, count]) => {
    const percentage = Math.min((count / stats.daysInRange) * 100, 100);
    return `
              <div class="mb-4 last:mb-0">
                <div class="flex justify-between text-xs font-medium mb-1.5">
                  <span class="text-gray-600">${HABIT_LABELS[habit] || habit}</span>
                  <span class="text-gray-400">${count}/${stats.daysInRange} วัน</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="bg-green-500 h-2 rounded-full transition-all duration-1000" style="width: ${percentage}%"></div>
                </div>
              </div>
            `;
  }).join('') : `
            <p class="text-sm text-gray-400 text-center py-4">
              <i class="fa-regular fa-face-smile-beam text-2xl mb-2 block text-gray-300"></i>
              ยังไม่มีข้อมูลพฤติกรรมดี
            </p>
          `}
        </div>

        <!-- Risk Factors -->
        <div class="bg-red-50/60 rounded-3xl p-5 border border-red-100">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h4 class="font-bold text-gray-700">ต้องระวัง</h4>
          </div>

          ${sortedRisks.length > 0 ? sortedRisks.map(([risk, count]) => {
    const percentage = Math.min((count / stats.daysInRange) * 100, 100);
    return `
              <div class="mb-4 last:mb-0">
                <div class="flex justify-between text-xs font-medium mb-1.5">
                  <span class="text-gray-600">${RISK_LABELS[risk] || risk}</span>
                  <span class="text-red-500">${count}/${stats.daysInRange} วัน</span>
                </div>
                <div class="w-full bg-white rounded-full h-2">
                  <div class="bg-red-400 h-2 rounded-full transition-all duration-1000" style="width: ${percentage}%"></div>
                </div>
              </div>
            `;
  }).join('') : `
            <p class="text-sm text-gray-500 text-center py-4">
              <i class="fa-solid fa-shield-check text-2xl mb-2 block text-green-400"></i>
              ไม่พบปัจจัยเสี่ยง 🎉
            </p>
          `}
        </div>
      </div>

      <!-- Symptom Frequency Chart -->
      <div>
        <div class="flex justify-between items-end mb-3">
          <h3 class="text-sm font-bold text-gray-400 pl-1">อาการที่พบบ่อย</h3>
        </div>
        
        <div class="bg-white border border-gray-100 rounded-3xl p-5 shadow-soft">
          ${sortedSymptoms.length > 0 ? `
            <div class="space-y-4">
              ${sortedSymptoms.map(([symptom, count]) => {
    const percentage = (count / maxSymptomCount) * 100;
    const gradientClass = percentage > 60 ? 'from-orange-300 to-red-500' : percentage > 30 ? 'from-yellow-200 to-orange-400' : 'from-yellow-100 to-yellow-300';
    return `
                  <div class="flex items-center gap-3">
                    <div class="w-20 text-xs font-medium text-gray-500 truncate text-right">${SYMPTOM_LABELS[symptom] || symptom}</div>
                    <div class="flex-1 h-3 bg-gray-50 rounded-r-full rounded-l-sm relative">
                      <div class="absolute top-0 left-0 h-full rounded-r-full rounded-l-sm bg-gradient-to-r ${gradientClass} transition-all duration-1000" style="width: ${percentage}%"></div>
                    </div>
                    <div class="w-6 text-xs font-bold text-gray-700 text-right">${count}</div>
                  </div>
                `;
  }).join('')}
            </div>
          ` : `
            <p class="text-sm text-gray-400 text-center py-6">
              <i class="fa-solid fa-heart text-2xl mb-2 block text-green-400"></i>
              ไม่พบอาการผิดปกติ
            </p>
          `}
        </div>
      </div>

      <!-- Empty State (Show when no records) -->
      ${stats.totalRecords === 0 ? `
        <div class="text-center py-8">
          <div class="text-6xl mb-4 animate-bounce-slow">🐠</div>
          <h3 class="text-lg font-bold text-gray-700 mb-2">ยังไม่มีข้อมูลในช่วงเวลานี้</h3>
          <p class="text-sm text-gray-500">ลองเปลี่ยนช่วงเวลาดูนะ!</p>
        </div>
      ` : ''}

    </div>
  `;
}

// ===== Initialize Health Summary =====
function initHealthSummary() {
  // Set default filter to this month
  HealthSummaryState.dateFilter = 'this-month';

  // Render
  renderHealthSummary();
}

// Expose to global scope
window.setHealthSummaryFilter = setHealthSummaryFilter;
window.renderHealthSummary = renderHealthSummary;
window.initHealthSummary = initHealthSummary;
