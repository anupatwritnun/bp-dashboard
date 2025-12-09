# 🐠 Goldfish Guardian Project Specifications

## 📊 Experience Levels & Configuration
The leveling system consists of **10 Levels**, each with a unique Thai name, theme, and XP requirement.

| LV | Name (TH) | Name (EN) | Min XP | Theme | Visual Features |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | ลูกปลาทองน้อย | Fry | 0 | Beginner | Small size, Basic Orange. |
| **2** | ปลาทองวัยสะรุ่น | Teen | 50 | Playful | **Rainbow Color** 🌈, Baseball Hat 🧢. |
| **3** | ปลาทองจอมขยัน | Diligent | 100 | Work | Deep Orange, Headband (Hachimaki) 🥋. |
| **4** | ปลาทองหางพริ้ว | Peacock | 200 | Graceful | **Rainbow Fan Tail** 🦚. |
| **5** | ปลาทองหัววุ้น | Oranda | 500 | Wisdom | White Body, Orange Wen, Fan Tail. |
| **6** | ปลาทองสิงห์แกร่ง | Strong | 1,000 | Strength | Lionhead, **Lion Mane** 🦁, Muscles 💪, Fan Tail. |
| **7** | หมอปลาทอง | Doctor | 2,000 | Medical | **Doctor Kit** 🩺, White Coat Body, Fan Tail. |
| **8** | เซียนปลาทอง | Sage | 5,000 | Master | **Cloud Base** ☁️, Beard, Glasses, White Hair. Cyan Color. |
| **9** | ตำนานปลาทอง | Legend | 10,000 | Royal | **Cloud Base** ☁️, Purple/Royal Theme. |
| **10** | พญาปลาทอง | Angel | 20,000 | Divine | **Cloud Base** ☁️, Wings 🪽, Halo 😇, Gold Color. |

---

## 🎨 Visual Component Specifications (CSS)

### 🩺 Doctor Kit (Level 7)
The "Doctor Kit" composition consists of three CSS-rendered elements:

1.  **Head Mirror**:
    *   **Position**: Forehead (`top: -5px`, `left: 8px`).
    *   **Style**: Silver circle (`bg-slate-300`, `border-slate-400`) with a white reflective highlight.
    *   **Strap**: Dark band (`bg-slate-800`) rotated -10 degrees.
2.  **Stethoscope**:
    *   **Position**: Around neck/body.
    *   **Tubing**: A curved border shape (`rounded-bl-[40px]`, `border-slate-800`) providing the "U" loop.
    *   **Chest Piece**: Silver circle (`bg-slate-300`) at the end of the loop.
3.  **Medical Pocket**:
    *   **Position**: Lower body.
    *   **Style**: White patch with a standard **Red Cross** ✚ symbol.

### 🦚 Fan Tail (Peacock Style)
Used for Level 4 (Rainbow) and adapted for Levels 5-10 (Theme Colors).
*   **Structure**: 5 separate segments (`div`) rotated in a fan pattern (-30°, -15°, 0°, +15°, +30°).
*   **Animation**: `wag` (rotates entire tail base left/right).

### ☁️ Cloud Base
Used for Levels 8, 9, 10.
*   **Structure**: 3 overlapping circles with `blur`, `opacity`, and `bg-white/indigo-50`.
*   **Animation**: `float` (gentle up/down movement separate from the fish).

---

## 🖌️ Color Palette References

| Theme | Primary Hex | Secondary Hex | Used By |
| :--- | :--- | :--- | :--- |
| **Fry Orange** | `#fdba74` | `#ea580c` | Level 1 |
| **Deep Orange** | `#fb923c` | `#c2410c` | Level 2 |
| **Red Hardwork** | `#ef4444` | `#991b1b` | Level 3 |
| **Golden Yellow** | `#fcd34d` | `#d97706` | Level 4 |
| **White/Silver** | `#ffffff` | `#cbd5e1` / `#94a3b8` | Level 5 & 7 |
| **Muscle Orange** | `#d97706` | `#78350f` | Level 6 |
| **Sage Cyan** | `#81ecec` | `#00cec9` | Level 8 |
| **Royal Purple** | `#a29bfe` | `#6c5ce7` | Level 9 |
| **Divine Gold** | `#ffd700` | `#b8860b` | Level 10 |

---

## 🛠️ Code Implementation Files
*   **Configuration**: `js/level-data.js` (Contains `xpLevels` array).
*   **Rendering Logic**: `js/profile.js` (Function `getGoldfishHTML` handles all CSS drawing).
