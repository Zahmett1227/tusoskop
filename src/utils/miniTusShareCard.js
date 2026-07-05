// Mini TUS sonuç paylaşım kartı — client-side canvas ile 1080×1920 PNG üretir.
// Sunucu/headless render GEREKMEZ; kullanıcının tarayıcısında anında oluşur.
// Marka sistemi kreatif brief'iyle birebir: #070C18 zemin, #10B981 vurgu.

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Mini TUS sonuç kartını canvas'a çizer ve PNG Blob döner.
 * @param {{score:number, total:number, tahminiPuan:number, topPercent:number}} data
 * @returns {Promise<Blob|null>} Blob desteklenmiyorsa null.
 */
export async function renderMiniTusShareCard({ score, total, tahminiPuan, topPercent }) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Zemin
  ctx.fillStyle = "#070c18";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Marka şeridi
  ctx.textAlign = "center";
  ctx.fillStyle = "#e8eefb";
  ctx.font = "700 44px Arial, sans-serif";
  ctx.fillText("TUSOSKOP", CARD_WIDTH / 2, 160);

  ctx.fillStyle = "#8496b8";
  ctx.font = "600 30px Arial, sans-serif";
  ctx.fillText("MİNİ TUS · İSTATİSTİKSEL TAHMİN", CARD_WIDTH / 2, 210);

  // Tahmini puan
  ctx.fillStyle = "#8496b8";
  ctx.font = "600 34px Arial, sans-serif";
  ctx.fillText("TAHMİNİ KALİBRASYON PUANIM", CARD_WIDTH / 2, 640);

  ctx.fillStyle = "#10b981";
  ctx.font = "800 220px Arial, sans-serif";
  ctx.fillText(String(tahminiPuan).replace(".", ","), CARD_WIDTH / 2, 880);

  // Yüzdelik kutusu
  const boxW = 760;
  const boxH = 220;
  const boxX = (CARD_WIDTH - boxW) / 2;
  const boxY = 1000;
  ctx.strokeStyle = "rgba(16,185,129,0.4)";
  ctx.lineWidth = 3;
  roundRect(ctx, boxX, boxY, boxW, boxH, 28);
  ctx.stroke();

  ctx.fillStyle = "#e8eefb";
  ctx.font = "600 36px Arial, sans-serif";
  ctx.fillText("Türkiye'de tahmini", CARD_WIDTH / 2, boxY + 75);

  ctx.fillStyle = "#10b981";
  ctx.font = "800 96px Arial, sans-serif";
  ctx.fillText(`İlk %${topPercent}`, CARD_WIDTH / 2, boxY + 175);

  // Skor detayı
  ctx.fillStyle = "#8496b8";
  ctx.font = "600 32px Arial, sans-serif";
  ctx.fillText(`${score}/${total} doğru · 20 soruluk karışık deneme`, CARD_WIDTH / 2, 1310);

  // Alt bilgi + dürüstlük dipnotu
  ctx.fillStyle = "#5b6a87";
  ctx.font = "500 26px Arial, sans-serif";
  ctx.fillText("İstatistiksel tahmindir, resmi ÖSYM puanı değildir.", CARD_WIDTH / 2, 1700);

  ctx.fillStyle = "#10b981";
  ctx.font = "700 40px Arial, sans-serif";
  ctx.fillText("tusoskop.com/coz/mini-tus", CARD_WIDTH / 2, 1800);

  // Logo (varsa) — sessizce atla, kart logosuz da anlamlı.
  try {
    const logo = await loadImage("/tusoskop-mark.png");
    const logoSize = 96;
    ctx.drawImage(logo, CARD_WIDTH / 2 - logoSize / 2, 40, logoSize, logoSize);
  } catch {
    /* logo yüklenemedi — kart yine de tam */
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
  });
}

/**
 * Kartı indirir ya da (destekleniyorsa) native paylaşım sayfasını açar.
 * @param {Blob} blob
 */
export async function shareOrDownloadCard(blob) {
  if (!blob) return;
  const file = new File([blob], "tusoskop-mini-tus-sonucum.png", { type: "image/png" });

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: "Tusoskop Mini TUS Sonucum",
        text: "Mini TUS'ta tahmini kalibrasyon puanımı gördüm — sen de dene:",
      });
      return;
    } catch {
      /* kullanıcı paylaşımı iptal etti — sessizce indirmeye düş */
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tusoskop-mini-tus-sonucum.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
