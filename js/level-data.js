/**
 * file: js/level-data.js
 * Responsibility: specific configuration for Game Levels (XP, Names, Visuals)
 */

window.xpLevels = [
    {
        level: 1,
        minXP: 0,
        nextXP: 50,
        name: "ลูกปลาทองน้อย",
        description: "จุดเริ่มต้น ตัวเล็กน่ารัก เพิ่งเริ่มหัดว่ายในโลกสุขภาพ",
        colors: { primary: "#fdba74", secondary: "#ea580c" },
        visuals: { scale: 0.8, type: "fry" }
    },
    {
        level: 2,
        minXP: 50,
        nextXP: 100,
        name: "ปลาทองวัยสะรุ่น", // Changed Name
        description: "เริ่มโต เริ่มซน มีแรงบันดาลใจ (วัยรุ่นสายชิล)",
        colors: { primary: "rainbow", secondary: "rainbow" }, // Special Rainbow flag
        visuals: { scale: 0.9, type: "normal", hasHat: true } // Added Hat
    },
    {
        level: 3,
        minXP: 100,
        nextXP: 200,
        name: "ปลาทองจอมขยัน",
        description: "มีวินัย จดสม่ำเสมอ ว่ายน้ำไม่หยุดพัก",
        colors: { primary: "#ef4444", secondary: "#991b1b" },
        visuals: { scale: 1.0, type: "normal", headband: true }
    },
    {
        level: 4,
        minXP: 200,
        nextXP: 500,
        name: "ปลาทองหางพริ้ว",
        description: "สุขภาพเริ่มดี หางสวย สง่างามดั่งนกยูงรำแพน",
        colors: { primary: "#fcd34d", secondary: "#d97706" },
        visuals: { scale: 1.0, type: "peacock" } // Peacock tail
    },
    {
        level: 5,
        minXP: 500,
        nextXP: 1000,
        name: "ปลาทองหัววุ้น",
        description: "เริ่มมีภูมิปัญญา",
        colors: { primary: "#ffffff", secondary: "#cbd5e1" }, // White Body
        visuals: { scale: 1.1, type: "oranda", hasWen: true, wenColor: "#fb923c" } // Orange Wen
    },
    {
        level: 6,
        minXP: 1000,
        nextXP: 2000,
        name: "ปลาทองสิงห์แกร่ง",
        description: "แข็งแรง บึกบึน มีกล้ามแน่นปึ้ก!",
        colors: { primary: "#d97706", secondary: "#78350f" },
        visuals: { scale: 1.1, type: "ranchu", hasMuscles: true } // Added Muscles
    },
    {
        level: 7,
        minXP: 2000,
        nextXP: 5000,
        name: "หมอปลาทอง",
        description: "คุณหมอใจดี ผู้ดูแลสุขภาพ",
        colors: { primary: "#ffffff", secondary: "#94a3b8" }, // White Coat color
        visuals: { scale: 1.2, type: "doctor", hasDoctorKit: true } // Doctor Theme
    },
    {
        level: 8,
        minXP: 5000,
        nextXP: 10000,
        name: "เซียนปลาทอง",
        description: "ผู้รู้จริงเรื่องความดัน (อาจารย์ปลาทอง)",
        colors: { primary: "#81ecec", secondary: "#00cec9" },
        visuals: { scale: 1.2, type: "sage", hasBeard: true, hasWhiteHair: true, hasGlasses: true } // Hair + Glasses
    },
    {
        level: 9,
        minXP: 10000,
        nextXP: 20000,
        name: "ตำนานปลาทอง",
        description: "ผู้ที่จดมาอย่างยาวนาน ระดับราชา",
        colors: { primary: "#a29bfe", secondary: "#6c5ce7" },
        visuals: { scale: 1.3, type: "legend", glow: true, hasCrown: true } // Added Crown here
    },
    {
        level: 10,
        minXP: 20000,
        nextXP: 999999,
        name: "พญาปลาทอง",
        description: "เจ้าแห่งปลาทอง เทพเจ้าผู้พิทักษ์",
        colors: { primary: "#ffd700", secondary: "#b8860b" }, // Gold Color
        visuals: { scale: 1.4, type: "angel", hasWings: true, hasHalo: true, glow: true } // Angel theme
    }
];

// Global Style Prompt
window.fishStylePrompt = "Cute 3D stylized character, glossy toy texture, isometric view";
