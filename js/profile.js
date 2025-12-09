/**
 * file: js/profile.js
 * Responsibility: Render the gamified profile UI and handle sharing.
 */

const LINE_OA_LINK = "https://lin.ee/diZ5ylu";

// --- XP CONFIGURATION ---
// config is now loaded from js/level-data.js (window.xpLevels)
const xpLevels = window.xpLevels || [];


// --- HELPER: Generate CSS Goldfish HTML ---
function getGoldfishHTML(primary, secondary, visuals = {}) {
    const scale = visuals.scale || 1;
    const isRainbow = primary === 'rainbow';

    // Feature flags
    const type = visuals.type || 'normal';
    const hasWen = visuals.hasWen;
    const wenColor = visuals.wenColor || '#ef4444';
    const hasCrown = visuals.hasCrown;
    const hasHalo = visuals.hasHalo;
    const hasWings = visuals.hasWings;
    const hasHeadband = visuals.hasHeadband || visuals.headband; // Standardize
    const hasHat = visuals.hasHat;
    const hasBeard = visuals.hasBeard;
    const hasWhiteHair = visuals.hasWhiteHair;
    const hasGlasses = visuals.hasGlasses;
    const hasMuscles = visuals.hasMuscles;
    const hasMane = visuals.hasMane;
    const isBeauty = visuals.isBeauty;
    const isGlowing = visuals.glow;
    const useFanTail = visuals.useFanTail;     // propagate peacock tail
    const hasCloud = visuals.hasCloud;         // sit on cloud
    const hasNecklace = visuals.hasNecklace;   // jewelry
    const hasEarring = visuals.hasEarring;     // jewelry
    const hasDoctorKit = visuals.hasDoctorKit; // Doctor Theme

    // --- Dynamic Styles ---
    let bodyBg = `background: radial-gradient(circle at 30% 30%, ${primary}, ${secondary});`;
    if (isRainbow) {
        bodyBg = `background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 25%, #ffd1ff 50%, #a1c4fd 75%, #c2e9fb 100%); background-size: 150% 150%;`;
    }

    let bodyClass = "w-48 h-32 rounded-[50%]";
    if (type === 'pearlscale' || type === 'fry') bodyClass = "w-40 h-40 rounded-full";
    if (type === 'ranchu') bodyClass = "w-48 h-36 rounded-[40%]"; // Boxier

    // --- Parts HTML ---

    const dorsalFin = (type === 'ranchu' || type === 'angel') ? '' : `
        <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-12 h-10 rounded-full origin-bottom rotate-12"
             style="background-color: ${isRainbow ? '#ff69b4' : secondary}; opacity: 0.9"></div>
    `;

    // TAIL VARIATIONS
    let tailHTML = `
        <div class="absolute -right-16 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[20px] border-y-transparent border-l-[40px] origin-left animate-[wag_1s_ease-in-out_infinite]"
             style="border-left-color: ${isRainbow ? '#845ec2' : secondary}"></div>
    `;

    // Logic: If 'peacock' (Level 4) -> Rainbow Fan. 
    // If 'useFanTail' (Levels 5+) -> Same shape, but use Primary/Secondary colors (or hardcoded if simple).

    if (type === 'peacock' || useFanTail) {
        // If it's the specific "Peacock" level (4), use the colorful palette.
        // If it's later levels (useFanTail), use their body colors or gold/white.

        let c1 = '#fb923c', c2 = '#fcd34d', c3 = '#ef4444', c4 = '#fcd34d', c5 = '#fb923c'; // Defaults

        if (type === 'peacock') {
            c1 = 'orange'; c2 = 'yellow'; c3 = 'red'; c4 = 'yellow'; c5 = 'orange';
        } else {
            // Adopt fish colors
            c1 = secondary; c2 = primary; c3 = secondary; c4 = primary; c5 = secondary;
        }

        tailHTML = `
            <div class="absolute -right-20 top-1/2 -translate-y-1/2 origin-left animate-[wag_2s_ease-in-out_infinite] z-[-1]">
                 <div class="absolute top-0 right-0 w-24 h-8 bg-[${c1}] rounded-full rotate-[-30deg] origin-left opacity-80 border border-white/20" style="background-color: ${c1}"></div>
                 <div class="absolute top-0 right-0 w-24 h-8 bg-[${c2}] rounded-full rotate-[-15deg] origin-left opacity-80 border border-white/20" style="background-color: ${c2}"></div>
                 <div class="absolute top-0 right-0 w-28 h-10 bg-[${c3}] rounded-full rotate-[0deg] origin-left opacity-90 border border-white/20" style="background-color: ${c3}"></div>
                 <div class="absolute top-0 right-0 w-24 h-8 bg-[${c4}] rounded-full rotate-[15deg] origin-left opacity-80 border border-white/20" style="background-color: ${c4}"></div>
                 <div class="absolute top-0 right-0 w-24 h-8 bg-[${c5}] rounded-full rotate-[30deg] origin-left opacity-80 border border-white/20" style="background-color: ${c5}"></div>
            </div>
        `;
    }

    // SPECIAL ACCESSORIES
    const crownHTML = hasCrown ? `<div class="absolute -top-14 left-8 text-5xl animate-bounce drop-shadow-lg filter z-50">👑</div>` : '';

    const haloHTML = hasHalo ? `
        <div class="absolute -top-16 left-1/2 -translate-x-1/2 w-20 h-6 border-4 border-yellow-300 rounded-[50%] shadow-[0_0_15px_gold] animate-pulse z-50"></div>
    ` : '';

    const wingsHTML = hasWings ? `
        <div class="absolute -top-12 -left-12 text-[80px] opacity-90 animate-[float_3s_ease-in-out_infinite] z-[-1] drop-shadow-[0_0_10px_white]">🪽</div>
        <div class="absolute -top-12 -right-12 text-[80px] opacity-90 animate-[float_3s_ease-in-out_infinite_0.5s] scale-x-[-1] z-[-1] drop-shadow-[0_0_10px_white]">🪽</div>
    ` : '';

    const cloudHTML = hasCloud ? `
        <div class="absolute -bottom-16 left-1/2 -translate-x-1/2 w-64 h-20 z-[-2] flex justify-center opacity-80 animate-[float_4s_ease-in-out_infinite]">
            <div class="absolute bottom-0 w-32 h-32 bg-white rounded-full blur-xl opacity-80"></div>
            <div class="absolute bottom-2 -left-10 w-24 h-24 bg-indigo-50 rounded-full blur-lg opacity-80"></div>
            <div class="absolute bottom-2 -right-10 w-24 h-24 bg-indigo-50 rounded-full blur-lg opacity-80"></div>
        </div>
    ` : '';

    const wenHTML = hasWen ? `
        <div class="absolute -top-4 left-2 w-16 h-10 bg-[${wenColor}] rounded-full opacity-95 animate-pulse shadow-sm z-20"></div>
        <div class="absolute -top-2 left-8 w-10 h-8 bg-[${wenColor}] rounded-full opacity-90 z-20"></div>
    ` : '';

    const maneHTML = hasMane ? `
        <!-- Lion Mane Effect -->
        <div class="absolute -top-6 -left-2 w-32 h-32 rounded-full border-[12px] border-amber-500/30 bg-transparent z-[-1] blur-sm"></div>
        <div class="absolute -top-4 left-0 w-24 h-24 rounded-full border-[8px] border-amber-600 bg-transparent z-10 shadow-lg"></div>
    ` : '';

    const hatHTML = hasHat ? `
        <div class="absolute -top-12 left-4 z-50">
             <div class="w-20 h-10 bg-indigo-500 rounded-t-full relative shadow-lg transform -rotate-12">
                <div class="absolute bottom-0 -right-4 w-28 h-2 bg-indigo-600 rounded-full"></div>
                <div class="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-700 rounded-full -translate-y-1/2"></div>
             </div>
        </div>
    ` : '';

    const headbandHTML = hasHeadband ? `
        <div class="absolute top-3 left-6 w-20 h-5 bg-white rotate-[-5deg] shadow-sm z-30 flex items-center justify-center border-y-2 border-slate-100">
            <div class="w-4 h-4 bg-red-600 rounded-full"></div>
        </div>
    ` : '';

    const hairHTML = hasWhiteHair ? `
        <div class="absolute -top-6 left-4 w-24 h-12 bg-slate-100 rounded-t-full z-20 shadow-sm"></div>
    ` : '';

    const glassesHTML = hasGlasses ? `
        <div class="absolute top-8 left-4 flex gap-2 z-40 transform rotate-[-5deg]">
            <div class="w-10 h-10 rounded-full border-4 border-slate-800 bg-white/30 backdrop-blur-sm shadow-sm relative">
                 <div class="absolute top-2 right-2 w-2 h-2 bg-white rounded-full opacity-80"></div>
            </div>
            <div class="w-10 h-10 rounded-full border-4 border-slate-800 bg-white/30 backdrop-blur-sm shadow-sm relative">
                 <div class="absolute top-2 right-2 w-2 h-2 bg-white rounded-full opacity-80"></div>
            </div>
            <div class="absolute top-4 left-9 w-4 h-1.5 bg-slate-800"></div>
        </div>
    ` : '';

    // MEDICAL KIT: Stethoscope, Head Mirror, Pocket
    const doctorHTML = hasDoctorKit ? `
        <!-- Head Mirror -->
        <div class="absolute -top-5 left-8 w-10 h-10 bg-slate-300 rounded-full border-4 border-slate-400 shadow-lg z-50 flex items-center justify-center">
            <div class="w-4 h-4 bg-white rounded-full opacity-50"></div>
        </div>
        <div class="absolute -top-2 left-6 w-14 h-2 bg-slate-800 rotate-[-10deg] z-40"></div>
        
        <!-- Stethoscope -->
        <div class="absolute top-16 left-0 w-20 h-24 border-b-4 border-l-4 border-slate-800 rounded-bl-[40px] z-30 opacity-80 rotate-12 pointer-events-none"></div>
        <div class="absolute top-32 left-10 w-6 h-6 bg-slate-300 rounded-full border-2 border-slate-500 shadow-sm z-30"></div>

        <!-- Pocket with Cross -->
        <div class="absolute bottom-6 left-12 w-10 h-10 bg-white border border-slate-200 rounded-b-lg shadow-sm z-20 flex items-center justify-center">
            <div class="w-6 h-6 flex items-center justify-center">
                 <div class="absolute w-1 h-4 bg-red-500"></div>
                 <div class="absolute w-4 h-1 bg-red-500"></div>
            </div>
        </div>
    ` : '';

    // JEWELRY: Necklace (on body) and Earring
    const necklaceHTML = hasNecklace ? `
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-16 rounded-full border-b-4 border-dotted border-cyan-100 shadow-sm z-30 opacity-80"></div>
        <div class="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-cyan-300 rounded-full rotate-45 border-2 border-white shadow-[0_0_10px_cyan] animate-pulse z-40"></div>
    ` : '';

    const earringHTML = hasEarring ? `
        <div class="absolute top-12 left-14 w-1 h-4 bg-white z-40"></div>
        <div class="absolute top-16 left-14 w-3 h-4 bg-cyan-200 rounded-[50%] border border-white shadow-[0_0_5px_cyan] z-40 animate-bounce"></div>
    ` : '';

    const beardHTML = hasBeard ? `
        <div class="absolute top-20 left-6 flex gap-4 z-30">
             <div class="w-3 h-20 bg-white rounded-full rotate-[25deg] shadow-sm border border-slate-100"></div>
             <div class="w-3 h-20 bg-white rounded-full rotate-[-25deg] shadow-sm border border-slate-100"></div>
        </div>
    ` : '';

    const musclesHTML = hasMuscles ? `
        <div class="absolute top-12 -left-8 w-14 h-20 bg-orange-600 rounded-2xl rotate-12 flex items-center justify-center border border-orange-700 shadow-md z-[-1]">
            <div class="absolute -left-2 top-2 w-10 h-10 bg-orange-500 rounded-full shadow-inner"></div>
        </div>
        <div class="absolute top-12 -right-4 w-14 h-20 bg-orange-600 rounded-2xl -rotate-12 z-[-1] border border-orange-700 shadow-md"></div>
    ` : '';

    const beautyHTML = isBeauty ? `
        <div class="absolute top-12 left-2 w-4 h-3 bg-pink-300 rounded-full blur-md opacity-60 z-20"></div>
        <div class="absolute top-12 left-16 w-4 h-3 bg-pink-300 rounded-full blur-md opacity-60 z-20"></div>
    ` : '';

    // EYES
    let eyeHTML = `
        <div class="absolute left-6 top-8 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 z-10 overflow-visible">
            <div class="w-3 h-3 bg-slate-800 rounded-full animate-pulse"></div>
            ${isBeauty ? `
                <div class="absolute -top-3 -left-1 w-4 h-0.5 bg-slate-800 rotate-[-45deg]"></div>
                <div class="absolute -top-4 left-1.5 w-4 h-0.5 bg-slate-800 rotate-[-80deg]"></div>
                <div class="absolute -top-3 -right-1 w-4 h-0.5 bg-slate-800 rotate-[-135deg]"></div>
            ` : ''}
        </div>
    `;

    const glowStyle = isGlowing ? `filter: drop-shadow(0 0 20px ${isRainbow ? 'gold' : primary});` : '';

    return `
    <div class="relative flex items-center justify-center pointer-events-none" style="transform: scale(${scale}); ${glowStyle}">
        ${wingsHTML}
        ${cloudHTML}
        
        <div class="absolute top-0 right-10 flex flex-col gap-4">
            <div class="w-4 h-4 rounded-full bg-cyan-500/20 animate-[float_3s_ease-in-out_infinite]"></div>
            <div class="w-2 h-2 rounded-full bg-cyan-500/20 animate-[float_4s_ease-in-out_infinite_0.5s]"></div>
        </div>
        
        <div class="relative animate-[swim_4s_ease-in-out_infinite]">
            ${tailHTML}
            ${dorsalFin}

            <!-- Body -->
            <div class="relative ${bodyClass} flex items-center shadow-xl overflow-visible"
                 style="${bodyBg}">
                
                ${musclesHTML}
                ${maneHTML}
                ${wenHTML}
                
                <!-- Face Area -->
                ${eyeHTML}
                ${glassesHTML}
                ${beautyHTML}
                ${beardHTML}

                <!-- Head Accessories -->
                ${crownHTML}
                ${haloHTML}
                ${hatHTML}
                ${headbandHTML}
                ${hairHTML}
                
                ${doctorHTML}
                ${necklaceHTML}
                ${earringHTML}

                <!-- Gill/Detail -->
                <div class="absolute left-16 top-1/2 -translate-y-1/2 w-8 h-16 border-r-4 border-black/5 rounded-r-full"></div>
                
                <!-- Scales Texture -->
                <div class="absolute inset-0 rounded-[50%] overflow-hidden opacity-10 pointer-events-none"
                     style="background-image: radial-gradient(circle at center, white 1px, transparent 1.5px); background-size: 10px 10px"></div>
            </div>
            
            <!-- Side Fin -->
            <div class="absolute top-1/2 left-1/2 w-16 h-10 rounded-full origin-left animate-[paddle_2s_ease-in-out_infinite] shadow-sm mix-blend-multiply"
                 style="background-color: ${isRainbow ? 'white' : secondary}; opacity: 0.8"></div>
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

    // Find current level based on XP table
    let levelInfo = xpLevels[0];
    for (let i = 0; i < xpLevels.length; i++) {
        if (currentXP >= xpLevels[i].minXP) {
            levelInfo = xpLevels[i];
        } else {
            break;
        }
    }

    // Dynamic Fish Colors based on Level
    const fishColor = levelInfo.colors || { primary: "#fbbf24", secondary: "#ea580c" };

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
            
            <div id="fish-visual-container" class="relative z-10 w-64 h-64 flex items-center justify-center transition-all duration-500">
               ${levelInfo.imagePath
            ? `<img src="${levelInfo.imagePath}" class="w-full h-full object-contain drop-shadow-2xl animate-[float_6s_ease-in-out_infinite]" alt="${levelInfo.name}">`
            : getGoldfishHTML(fishColor.primary, fishColor.secondary, levelInfo.visuals)
        }
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
                    <p class="text-slate-400 text-xs">Level ${level} • ${levelInfo.name}</p>
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
                       ${getGoldfishHTML(fishColor.primary, fishColor.secondary, levelInfo.visuals || {})}
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

window.openShareModal = function () {
    const modal = document.getElementById('share-modal-overlay');
    if (modal) {
        modal.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
    }
};

window.closeShareModal = function () {
    const modal = document.getElementById('share-modal-overlay');
    if (modal) {
        modal.classList.add('hidden');
    }
};

window.generateAndShare = function () {
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
            } catch (e) {
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