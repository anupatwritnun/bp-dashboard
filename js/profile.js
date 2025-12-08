// 1. Find the profile item (the one that has streak/xp/level)
const profileItem = items.find(i =>
  i.json.xp_total !== undefined ||
  i.json.level !== undefined ||
  i.json.current_streak !== undefined
);

if (!profileItem) {
  return [{ json: { error: "No profile data found" }}];
}

const p = profileItem.json;

// ===== PROFILE METRICS =====
const totalLogDays = p.total_log_days || p.total_logs || 0;
const currentStreak = p.current_streak || 0;
const xp = p.xp_total || 0;
const level = p.level || 1;
const levelName = p.level_name || '';
const todayXp = p.today_xp || 0;

// ===== XP BAR LOGIC =====
// Level XP thresholds (same as your table)
const xpThresholds = {
  1: 0,
  2: 200,
  3: 550,
  4: 2000,
  5: 6000,
  6: 17500,
  7: 69350,
  8: 121500,
  9: 185000,
  10: 260000
};

const currentLevelXp = xpThresholds[level] || 0;
const nextLevelXp = xpThresholds[level + 1] || xpThresholds[level];

// Avoid division by zero
const xpPercent = nextLevelXp > currentLevelXp
  ? ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
  : 100;

// ===== LINE PROFILE INFO =====
const lineName = p.line_name || "ผู้ใช้งาน";
const linePicture = p.line_picture || "";

// Final profile output
const profile = {
  name: lineName,
  picture: linePicture,

  total_log_text: `บันทึกทั้งหมด ${totalLogDays} วัน`,
  streak_text: `ตอนนี้บันทึกติดต่อกันมาแล้ว ${currentStreak} วัน`,

  level: level,
  level_name: levelName,

  xp_total: xp,
  xp_percent: Math.min(Math.max(xpPercent, 0), 100), // clamp 0–100
  xp_range: {
    current: currentLevelXp,
    next: nextLevelXp
  }
};

// ===== FORMAT BP RECORDS =====
const records = items
  .filter(i => i !== profileItem) // exclude profile row
  .map(item => {
    const r = item.json;
    const d = new Date(r.measured_at);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return {
      date: `${y}-${m}-${day}`,
      time: r.period || '',
      systolic: r.systolic,
      diastolic: r.diastolic,
      pulse: r.pulse
    };
  });

return [
  {
    json: {
      profile,
      records
    }
  }
];
