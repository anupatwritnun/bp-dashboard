# 🐠 Heart Guardian (สมุดพิทักษ์ใจ) - Project Overview

**Heart Guardian** is a gamified Blood Pressure (BP) monitoring dashboard integrated with LINE. It transforms the routine task of blood pressure tracking into an engaging experience by evolving a digital goldfish "protector" as users maintain their health recording habits.

---

## 🚀 Core Features

### 1. 📊 Health Dashboard
A comprehensive view of your blood pressure trends and history.
*   **Visual Trends**: Interactive line charts showing Systolic (SYS), Diastolic (DIA), and Pulse readings over time.
*   **Bento-style Stats**: Quick-glance cards showing averages, minimums, and maximums, with color-coded indicators for high blood pressure.
*   **Timeline View**: A detailed history of all records, categorized by time of day (Morning/Evening) with health status badges.
*   **Quick Filters**: Easily view data for "This Month", "Last 3 Months", "This Year", or "All Time".

### 2. 🐟 Goldfish Evolution (Gamification)
The heart of the project. Your digital protector evolves based on your **XP (Experience Points)**, which you earn by consistently recording your blood pressure.
*   **10 Unique Levels**: From a tiny "Fry" to a divine "Angel Goldfish".
*   **Visual Progression**: Each level adds unique CSS-rendered features like hats, muscles, doctor kits, and even wings.
*   **Streak Bonus**: Maintain a daily recording streak to stay motivated.

### 3. 📤 Smart Sharing
Share your health progress with doctors or family members easily.
*   **Achievement Cards**: Generate a beautiful, high-resolution image of your current goldfish level and stats to share on social media or LINE.
*   **Secure Dashboard Links**: Generate a temporary (6-hour) link that allows others to view your dashboard without needing to log in. Includes a QR code for easy scanning.

### 4. 📲 LINE Integration
Seamlessly integrated with the LINE ecosystem using LIFF (LINE Front-end Framework).
*   **One-Click Login**: Access your dashboard directly from your LINE app.
*   **Automated Tracking**: Data is synchronized via n8n webhooks for real-time updates.

---

## 🧬 The Evolution Path

| Level | Thai Name | Theme | Special Traits |
| :--- | :--- | :--- | :--- |
| **1** | ลูกปลาทองน้อย | Beginner | Tiny, cute, and orange. |
| **2** | ปลาทองวัยสะรุ่น | Playful | **Rainbow Colors** 🌈 & Baseball Hat 🧢. |
| **3** | ปลาทองจอมขยัน | Work | Hachimaki Headband 🥋. |
| **4** | ปลาทองหางพริ้ว | Graceful | Majestic **Peacock Fan Tail** 🦚. |
| **5** | ปลาทองหัววุ้น | Wisdom | Classic Oranda look with an orange wen. |
| **6** | ปลาทองสิงห์แกร่ง | Strength | Buff muscles 💪 and a lion mane. |
| **7** | หมอปลาทอง | Medical | **Doctor Kit** 🩺 (Mirror, Stethoscope, Pocket). |
| **8** | เซียนปลาทอง | Master | Sage beard, glasses, and a **Cloud Base** ☁️. |
| **9** | ตำนานปลาทอง | Royal | Purple theme with a royal crown 👑. |
| **10** | พญาปลาทอง | Divine | Golden glow, halo 😇, and angelic wings 🪽. |

---

## 🛠️ Technical Architecture

*   **Frontend**: Vanilla HTML5, CSS3 (Tailwind CSS for utility styling), and JavaScript (ES6+).
*   **Visuals**: Pure CSS-rendered goldfish (no heavy images) for fast loading and dynamic scaling.
*   **Charts**: [Chart.js](https://www.chartjs.org/) for health data visualization.
*   **Platform**: [LINE LIFF](https://developers.line.biz/en/docs/liff/) for seamless mobile integration.
*   **Backend/API**: [n8n](https://n8n.io/) workflows via webhooks for data management.
*   **Deployment**: Optimized for Vercel with Google Analytics and Vercel Analytics integration.

---

## 🎯 Project Goals
The goal of **Heart Guardian** is to reduce the friction of health monitoring by adding a layer of joy and accomplishment. By turning data into "growth," users are more likely to stay consistent with their measurements, leading to better long-term health outcomes.
