// Sonuç paylaşım görseli — canvas ile 1080×1080 PNG kart üretir.
// Emoji yerine kareler doğrudan çizilir (tüm cihazlarda tutarlı görünüm).

const SIZE = 1080;
const SITE = "tanidle"; // domain bağlanınca güncellenir

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Sonuç kartını çizip Blob döndürür.
export async function renderResultCard({
  number,
  guesses,
  solved,
  maxGuesses,
  ders,
  konu,
}) {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");

  // Arka plan gradyanı
  const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  grad.addColorStop(0, "#0c9061");
  grad.addColorStop(1, "#0a4b37");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.textAlign = "center";

  // Başlık
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 84px Inter, sans-serif";
  ctx.fillText("🩺 Tanıdle", SIZE / 2, 180);

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "600 40px Inter, sans-serif";
  ctx.fillText(`Günün Vakası #${number}`, SIZE / 2, 250);

  // Skor kareleri
  const n = maxGuesses;
  const box = 120;
  const gap = 24;
  const totalW = n * box + (n - 1) * gap;
  const startX = (SIZE - totalW) / 2;
  const y = 360;
  for (let i = 0; i < n; i++) {
    const g = guesses[i];
    ctx.fillStyle = !g ? "rgba(255,255,255,0.18)" : g.correct ? "#3fce93" : "#fb7185";
    roundRect(ctx, startX + i * (box + gap), y, box, box, 24);
    ctx.fill();
  }

  // Sonuç metni
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 72px Inter, sans-serif";
  const scoreLabel = solved
    ? `${guesses.filter((x) => !x.correct).length + 1}/${maxGuesses} ile bildim`
    : "Bulamadım";
  ctx.fillText(scoreLabel, SIZE / 2, 620);

  // Branş
  if (ders) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "600 44px Inter, sans-serif";
    const sub = konu ? `${ders} · ${konu}` : ders;
    ctx.fillText(truncate(ctx, sub, SIZE - 160), SIZE / 2, 710);
  }

  // Çağrı
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "600 42px Inter, sans-serif";
  ctx.fillText("Sen kaç ipucuyla bulurdun?", SIZE / 2, 880);

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "500 36px Inter, sans-serif";
  ctx.fillText(`🏥 ${SITE}  ·  Tusoskop TUS soru bankası`, SIZE / 2, 980);

  return await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png")
  );
}

function truncate(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

// Görseli paylaş: native file share → indirme.
export async function shareImageBlob(blob, text) {
  const file = new File([blob], "tanidle.png", { type: "image/png" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return "shared";
    }
  } catch {
    /* iptal / desteklenmiyor */
  }
  // İndir
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tanidle.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}
