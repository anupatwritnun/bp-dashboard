const fishTypes = [
    {primary:"#fbbf24", secondary:"#ea580c"},
    {primary:"#e2e8f0", secondary:"#ef4444"},
    {primary:"#475569", secondary:"#1e293b"}
];

function renderFish(primary, secondary){
    return `
        <div class="relative w-48 h-32 animate-[swim_4s_ease-in-out_infinite]">
            <div class="absolute -right-10 top-1/2 -translate-y-1/2 border-l-[30px]
                        border-y-[14px] border-y-transparent animate-[wag_1s_infinite]"
                 style="border-left-color:${secondary}">
            </div>
            <div class="absolute inset-0 rounded-[50%]"
                 style="background: radial-gradient(circle at 30% 30%, ${primary}, ${secondary});"></div>
            <div class="absolute left-6 top-4 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <div class="w-3 h-3 bg-black rounded-full animate-pulse"></div>
            </div>
        </div>
    `;
}

function setFish(index){
    const f = fishTypes[index];
    document.getElementById("fishSection").innerHTML = renderFish(f.primary, f.secondary);
    document.getElementById("shareFish").innerHTML = renderFish(f.primary, f.secondary);
}
