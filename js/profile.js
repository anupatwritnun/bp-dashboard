/**
 * file: js/profile.js
 * Responsibility: Render the gamified profile UI and handle sharing.
 */

const LINE_OA_LINK = "https://lin.ee/diZ5ylu"; 

// --- XP CONFIGURATION ---
// "Level" is achieved when you reach "minXP"
const xpLevels = [
    { level: 1, minXP: 0, nextXP: 50 },
    { level: 2, minXP: 50, nextXP: 100 },
    { level: 3, minXP: 100, nextXP: 200 },
    { level: 4, minXP: 200, nextXP: 500 },
    { level: 5, minXP: 500, nextXP: 1000 },
    { level: 6, minXP: 1000, nextXP: 2000 },
    { level: 7, minXP: 2000, nextXP: 5000 },
    { level: 8, minXP: 5000, nextXP: 10000 },
    { level: 9, minXP: 10000, nextXP: 20000 },
    { level: 10, minXP: 20000, nextXP: 999999 } // Max level
];

// --- HELPER: Generate CSS Goldfish HTML ---
function getGoldfishHTML(primary, secondary) {
    return `
    <div class="relative w-64 h-64 flex items-center justify-center pointer-events-none">
        <div class="absolute top-0 right-10 flex flex-col gap-4">
            <div class="w-4 h-4 rounded-full bg-cyan-500/20 animate-[float_3s_ease-in-out_infinite]"></div>
            <div class="w-2 h-2 rounded-full bg-cyan-500/20 animate-[float_4s_ease-in-out_infinite_0.5s]"></div>
        </div>
        <div class="relative animate-[swim_4s_ease-in-out_infinite]">
            <div class="absolute -right-16 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[20px] border-y-transparent border-l-[40px] origin-left animate-[wag_1s_ease-in-out_infinite]"
                 style="border-left-color: ${secondary}"></div>
            <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-12 h-10 rounded-full origin-bottom rotate-12"
                 style="background-color: ${secondary}; opacity: 0.9"></div>
            <div class="absolute bottom-2 left-1/2 -translate-x-1/2 translate-y-4 w-10 h-8 rounded-full origin-top -rotate-12"
                 style="background-color: ${secondary}; opacity: 0.9"></div>
            <div class="relative w-48 h-32 rounded-[50%] flex items-center shadow-xl"
                 style="background: radial-gradient(circle at 30% 30%, ${primary}, ${secondary})">
                <div class="absolute left-6 top-8 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                    <div class="w-3 h-3 bg-slate-800 rounded-full animate-pulse"></div>
                </div>
                <div class="absolute left-16 top-1/2 -translate-y-1/2 w-8 h-16 border-r-4 border-black/5 rounded-r-full"></div>
                <div class="absolute inset-0 rounded-[50%] overflow-hidden opacity-10"
                     style="background-image: radial-gradient(circle at center, white 1px, transparent 1.5px); background-size: 10px 10px"></div>
            </div>
            <div class="absolute top-1/2 left-1/2 w-16 h-10 rounded-full origin-left animate-[paddle_2s_ease-in-out_infinite] shadow-sm"
                 style="background-color: ${secondary}"></div>
        </div>
    </div>
    `;
}

// --- MAIN RENDER FUNCTION ---
function renderProfile() {
    const container = document.getElementById("page-profile");

    // 1. Check Data
    const profile = AppState.profile;
    const stats = AppState.profileStats;

    if (!profile || !stats) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 text-slate-400">
                <div class="loader mb-4"></div>
                <p>กำลังโหลดข้อมูล...</p>
            </div>`;
        return;
    }

    // 2. Prepare Variables & Calculate Level
    const currentXP = stats.xp_total || 0;
    const streak = stats.current_streak || 0;
    const totalLogs = stats.total_log_days || 0;
    
    // Hardcoded Colors for "Gold" Fish
    const fishColor = { primary: "#fbbf24", secondary: "#ea580c" };

    // Find current level based on XP table
    let levelInfo = xpLevels[0];
    for (let i = 0; i < xpLevels.length; i++) {
        if (currentXP >= xpLevels[i].minXP) {
            levelInfo = xpLevels[i];
        } else {
            break;
        }
    }

    const level = levelInfo.level;
    const nextXP = levelInfo.nextXP;
    const prevXP = levelInfo.minXP;

    // Calculate percentage based on range (so the bar fills up for the current level)
    // Formula: (Current - Base) / (Goal - Base)
    let percentCalc = 0;
    if (level === 10) {
        percentCalc = 100; // Max level
    } else {
        const range = nextXP - prevXP;
        const progress = currentXP - prevXP;
        percentCalc = Math.min((progress / range) * 100, 100);
    }
    const xpPercent = percentCalc;

    // 3. Build HTML Template
    container.innerHTML = `
    <div class="pb-8 relative pt-4">
        
        <div class="flex justify-end mb-4">
            <button onclick="openShareModal()" 
                class="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-200 rounded-full font-bold transition-all text-xs">
                <i data-lucide="share-2" class="w-4 h-4"></i> ชวนเพื่อน
            </button>
        </div>

        <div class="relative min-h-[300px] w-full bg-gradient-to-br from-cyan-100/90 to-blue-100/90 backdrop-blur-xl border border-cyan-200/50 rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center overflow-hidden mb-6">
            
            <div id="fish-visual-container" class="relative z-10 scale-110 transition-all duration-500">
               ${getGoldfishHTML(fishColor.primary, fishColor.secondary)}
            </div>
            
        </div>

        <div class="bg-white backdrop-blur-sm border border-slate-100 rounded-3xl p-5 flex items-center justify-between shadow-lg shadow-slate-200/50 mb-6">
            <div class="flex items-center gap-4">
                <div class="relative">
                    <img src="${profile.pictureUrl}" alt="Profile" class="w-14 h-14 rounded-2xl shadow-md border border-white">
                    <div class="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-slate-800">${profile.displayName}</h3>
                    <p class="text-slate-400 text-xs">Level ${level} • ${stats.level_name || 'Novice'}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-0.5">Level</p>
                <p class="text-4xl font-black text-slate-800 leading-none">${level}</p>
            </div>
        </div>

        <div class="bg-white border border-slate-100 rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-orange-100/50 mb-4">
            <div class="flex justify-between items-end mb-3 relative z-10">
                <div>
                    <p class="text-slate-500 text-xs font-bold uppercase tracking-wide">แต้มสุขภาพ (XP)</p>
                    <div class="flex items-baseline gap-2 mt-1">
                        <span class="text-3xl font-black text-slate-800 tracking-tight">${currentXP}</span>
                        <span class="text-slate-400 font-medium text-sm">/ ${nextXP > 900000 ? 'MAX' : nextXP}</span>
                    </div>
                </div>
                <div class="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg text-xs font-bold">
                    XP
                </div>
            </div>
            <div class="h-6 w-full bg-slate-100 rounded-full p-1 shadow-inner">
                <div class="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 rounded-full shadow-sm relative overflow-hidden transition-all duration-1000" 
                     style="width: ${xpPercent}%">
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full animate-[shimmer_2s_infinite] -skew-x-12"></div>
                </div>
            </div>
            <p class="mt-3 text-xs text-slate-400 font-medium flex items-center gap-2">
                <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                ${level === 10 ? 'คุณคือสุดยอดผู้พิทักษ์!' : 'บันทึกต่อเนื่องเพื่อรับโบนัส XP!'}
            </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div class="bg-orange-50 border border-orange-100 rounded-3xl p-5 flex flex-col justify-between group hover:-translate-y-1 transition-transform">
                <div class="bg-white p-2.5 w-fit rounded-xl shadow-sm text-orange-500 mb-6">
                    <i data-lucide="flame" class="w-5 h-5 fill-orange-500"></i>
                </div>
                <div>
                    <p class="text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">ต่อเนื่อง</p>
                    <h4 class="text-3xl font-black text-slate-800">${streak} <span class="text-sm text-slate-500 font-medium">วัน</span></h4>
                </div>
            </div>
            
            <div class="bg-cyan-50 border border-cyan-100 rounded-3xl p-5 flex flex-col justify-between group hover:-translate-y-1 transition-transform">
                <div class="bg-white p-2.5 w-fit rounded-xl shadow-sm text-cyan-600 mb-6">
                    <i data-lucide="book-open" class="w-5 h-5"></i>
                </div>
                <div>
                    <p class="text-cyan-600 text-xs font-bold uppercase tracking-wider mb-1">บันทึกมาแล้ว</p>
                    <h4 class="text-3xl font-black text-slate-800">${totalLogs} <span class="text-sm text-slate-500 font-medium">วัน</span></h4>
                </div>
            </div>
        </div>

    </div>
    
    <div id="share-modal-overlay" class="fixed inset-0 z-[60] hidden flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
            <button onclick="closeShareModal()" class="absolute top-4 right-4 z-20 p-2 bg-white/50 rounded-full hover:bg-white transition-colors">
                <i data-lucide="x" class="w-5 h-5 text-slate-800"></i>
            </button>

            <div class="p-4 border-b border-slate-100 text-center">
                <h3 class="font-bold text-slate-800">แชร์ความสำเร็จ</h3>
            </div>

            <div class="p-6 bg-slate-50 flex justify-center">
                <div id="share-capture-card" class="w-[300px] h-[500px] bg-gradient-to-b from-cyan-50 to-white rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col text-center font-sans">
                     <div class="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
                         <div class="absolute top-[-10%] right-[-30%] w-[250px] h-[250px] bg-cyan-200 rounded-full blur-[60px]"></div>
                         <div class="absolute bottom-[20%] left-[-20%] w-[200px] h-[200px] bg-orange-200 rounded-full blur-[50px]"></div>
                    </div>

                    <div class="relative z-10 pt-10 px-6">
                       <div class="flex items-center justify-center gap-2 mb-2">
                         <div class="bg-orange-500 p-1.5 rounded-lg shadow-sm">
                            <i data-lucide="heart" class="w-4 h-4 text-white fill-white"></i>
                         </div>
                         <span class="font-black text-slate-800 text-xl tracking-tight">ปลา<span class="text-orange-500">ท๊องง</span></span>
                       </div>
                       <div class="inline-block bg-white/60 px-3 py-1 rounded-full border border-slate-200/50 text-[10px] text-cyan-800 font-bold uppercase tracking-wider">
                          บันทึกความดันโลหิต
                       </div>
                    </div>

                    <div class="relative z-10 flex-grow flex items-center justify-center -my-4 scale-90">
                       ${getGoldfishHTML(fishColor.primary, fishColor.secondary)}
                    </div>

                    <div class="relative z-10 px-6 mb-8">
                        <div class="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm flex justify-between items-center">
                             <div>
                                <p class="text-[10px] text-slate-400 font-bold uppercase">Level</p>
                                <p class="text-3xl font-black text-slate-800 leading-none">${level}</p>
                             </div>
                             <div class="h-8 w-px bg-slate-200"></div>
                             <div class="text-right">
                                <p class="text-[10px] text-orange-500 font-bold uppercase">ต่อเนื่อง</p>
                                <p class="text-3xl font-black text-orange-500 leading-none">${streak} <span class="text-sm text-slate-400 font-normal">วัน</span></p>
                             </div>
                        </div>
                    </div>

                    <div class="relative z-10 bg-slate-900 text-white p-6 mt-auto">
                        <p class="font-black text-lg text-orange-400 tracking-wide">"มาจดความดันด้วยกันสิ"</p>
                    </div>
                </div>
            </div>

            <div class="p-4 border-t border-slate-100">
                <button id="btn-do-share" onclick="generateAndShare()" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2">
                    <i data-lucide="share" class="w-5 h-5"></i> แชร์ไปยัง LINE / FB
                </button>
            </div>
        </div>
    </div>
    `;

    // 4. Initialize Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// --- INTERACTIVE FUNCTIONS ---

window.openShareModal = function() {
    const modal = document.getElementById('share-modal-overlay');
    if (modal) {
        modal.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
    }
};

window.closeShareModal = function() {
    const modal = document.getElementById('share-modal-overlay');
    if (modal) {
        modal.classList.add('hidden');
    }
};

window.generateAndShare = function() {
    const card = document.getElementById('share-capture-card');
    const btn = document.getElementById('btn-do-share');
    
    // Get Stats for Text Generation
    const stats = AppState.profileStats || {};
    const streak = stats.current_streak || 0;
    const total = stats.total_log_days || 0;

    if (!card || !window.html2canvas) return;

    // Loading State
    const originalBtnText = btn.innerHTML;
    btn.innerHTML = `<div class="loader w-4 h-4 border-2 border-white border-t-transparent mr-2"></div> กำลังสร้าง...`;
    btn.disabled = true;

    html2canvas(card, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true 
    }).then(async (canvas) => {
        
        // 1. Prepare Image
        // Convert canvas to Blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], "plathong-share.png", { type: "image/png" });

        // 2. Prepare Text
        let shareText = "มาจดบันทึกความดันด้วยกันสิ ";
        if (streak > 0) {
            shareText += `ฉันจดมาต่อเนื่อง ${streak} วันแล้ว`;
        } else {
            shareText += `ฉันจดมาทั้งหมด ${total} วันแล้ว`;
        }
        
        const fullShareData = {
            title: 'สมุดพิทักษ์ใจ',
            text: `${shareText}\n${LINE_OA_LINK}`,
            files: [file]
        };

        // 3. Try Native Share (Mobile)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share(fullShareData);
                btn.innerHTML = `<i data-lucide="check" class="w-5 h-5"></i> แชร์สำเร็จ!`;
            } catch (err) {
                console.log("Share cancelled or failed", err);
                btn.innerHTML = originalBtnText; // Revert if cancelled
            }
        } 
        // 4. Fallback for Desktop (Download Image)
        else {
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.download = `plathong-stats-${Date.now()}.png`;
            link.href = image;
            link.click();
            
            try {
                await navigator.clipboard.writeText(`${shareText}\n${LINE_OA_LINK}`);
                alert("บันทึกรูปแล้ว! ข้อความถูกคัดลอกไปยัง Clipboard");
            } catch(e) {
                alert("บันทึกรูปเรียบร้อย");
            }
            btn.innerHTML = originalBtnText;
        }

        setTimeout(() => {
            btn.disabled = false;
            if (btn.innerText.includes("สำเร็จ")) btn.innerHTML = originalBtnText;
        }, 2000);

    }).catch(err => {
        console.error("Capture failed:", err);
        alert("เกิดข้อผิดพลาดในการสร้างรูปภาพ");
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
    });
};

window.renderProfile = renderProfile;