function openShareModal(){
    document.getElementById("shareModal").classList.remove("hidden");
}
function closeShareModal(){
    document.getElementById("shareModal").classList.add("hidden");
}

async function confirmShare(){
    const card = document.getElementById("shareCard");
    const canvas = await html2canvas(card, {scale: 2});
    const blob = await new Promise(r => canvas.toBlob(r));

    const file = new File([blob], "share.png", {type:"image/png"});

    if(navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({
            title: "ปลาท๊องง",
            text: "แชร์สเตตัสสุขภาพของฉัน",
            files: [file]
        });
    }
}
