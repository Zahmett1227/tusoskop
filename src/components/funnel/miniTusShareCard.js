/**
 * Mini TUS sonuç paylaşım kartı — 1080×1920 (9:16 story) canvas → PNG.
 *
 * Kullanıcı sonucunu Instagram/WhatsApp story olarak paylaşsın diye üretilir
 * (plan K1: "her katılımcıyı reklam panosuna çevirir"). DOĞRU CEVAP GÖSTERİLMEZ
 * — yalnızca toplam skor + tahmini puan + yüzdelik (teaser). Reklam kreatifinin
 * aksine bu istemci tarafında canvas ile çizilir (Chrome-headless değil).
 */

const W = 1080;
const H = 1920;
const NAVY = "#070c18";
const NAVY_2 = "#0e1a2e";
const EMERALD = "#10b981";
const EMERALD_L = "#34d399";
const SLATE = "#94a3b8";
const SLATE_D = "#64748b";
const WHITE = "#f1f5f9";
const FONT = '-apple-system, "Segoe UI", Roboto, system-ui, sans-serif';

const SITE = "tusoskop.com/coz/mini-tus";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Verilen result'ı 1080×1920 canvas context'ine çizer. */
export function drawMiniTusShareCard(ctx, result) {
  const { dogru, toplamCevap = 20, ilkYuzdelik, enIyiPuanTuru, tPuanAralik, kPuanAralik } = result;
  const aralik = enIyiPuanTuru === "K" ? kPuanAralik : tPuanAralik;

  // Arka plan — dikey lacivert gradyan
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, NAVY);
  bg.addColorStop(1, NAVY_2);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Üst emerald şerit
  ctx.fillStyle = EMERALD;
  ctx.fillRect(0, 0, W, 12);

  const cx = W / 2;
  ctx.textAlign = "center";

  // Marka
  ctx.fillStyle = EMERALD_L;
  ctx.font = `800 30px ${FONT}`;
  ctx.fillText("●", cx - 128, 158);
  ctx.fillStyle = WHITE;
  ctx.font = `900 48px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("TUSOSKOP", cx - 100, 170);
  ctx.textAlign = "center";

  // Başlık
  ctx.fillStyle = SLATE;
  ctx.font = `800 34px ${FONT}`;
  ctx.fillText("20 SORULUK MİNİ TUS", cx, 288);

  // Skor rozeti
  ctx.strokeStyle = "rgba(16,185,129,0.4)";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, 500, 150, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = EMERALD_L;
  ctx.font = `900 130px ${FONT}`;
  ctx.textBaseline = "middle";
  ctx.fillText(`${dogru}/${toplamCevap}`, cx, 495);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = SLATE;
  ctx.font = `700 34px ${FONT}`;
  ctx.fillText("doğru", cx, 705);

  // Tahmini puan
  ctx.fillStyle = SLATE;
  ctx.font = `700 36px ${FONT}`;
  ctx.fillText("Tahmini TUS puanım", cx, 835);
  ctx.fillStyle = WHITE;
  ctx.font = `900 96px ${FONT}`;
  ctx.fillText(`${enIyiPuanTuru} ≈ ${aralik[0]}–${aralik[1]}`, cx, 940);

  // Yüzdelik — asıl kanca
  const boxY = 1050;
  const boxH = 400;
  ctx.fillStyle = "rgba(16,185,129,0.10)";
  roundRect(ctx, 90, boxY, W - 180, boxH, 48);
  ctx.fill();
  ctx.strokeStyle = "rgba(16,185,129,0.35)";
  ctx.lineWidth = 4;
  roundRect(ctx, 90, boxY, W - 180, boxH, 48);
  ctx.stroke();

  ctx.fillStyle = SLATE;
  ctx.font = `700 40px ${FONT}`;
  ctx.fillText("Türkiye'de tahmini", cx, boxY + 110);
  ctx.fillStyle = EMERALD_L;
  ctx.font = `900 190px ${FONT}`;
  ctx.fillText(`İLK %${ilkYuzdelik}`, cx, boxY + 300);

  // Alt CTA
  ctx.fillStyle = WHITE;
  ctx.font = `800 48px ${FONT}`;
  ctx.fillText("Sen de 60 saniyede dene 👇", cx, 1600);
  ctx.fillStyle = EMERALD_L;
  ctx.font = `900 52px ${FONT}`;
  ctx.fillText(SITE, cx, 1680);

  // Feragat
  ctx.fillStyle = SLATE;
  ctx.font = `600 30px ${FONT}`;
  ctx.fillText("20 soruluk kalibrasyon · sonuç tahminidir · üyelik gerekmez", cx, 1790);
}

/** Offscreen canvas'a çizip PNG Blob döndürür. */
export async function generateMiniTusShareBlob(result) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  try {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  } catch {
    /* font yüklenmese de sistem fontuyla çizilir */
  }
  drawMiniTusShareCard(ctx, result);
  return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/**
 * Kartı paylaşır (Web Share API level 2 — dosya paylaşımı) ya da indirir.
 * @returns {Promise<"shared"|"downloaded"|"failed">}
 */
export async function shareMiniTusCard(result) {
  let blob;
  try {
    blob = await generateMiniTusShareBlob(result);
  } catch (error) {
    if (typeof console !== "undefined") console.warn("shareMiniTusCard render failed:", error);
    return "failed";
  }
  if (!blob) return "failed";
  const file = new File([blob], "tusoskop-mini-tus.png", { type: "image/png" });

  // Web Share API level 2 — dosya paylaşımı
  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [file] }) &&
    navigator.share
  ) {
    try {
      await navigator.share({
        files: [file],
        title: "Mini TUS sonucum",
        text: "20 soruluk Mini TUS'ta neredeyim? Sen de dene 👇",
      });
      return "shared";
    } catch (error) {
      // AbortError = kullanıcı paylaşım sayfasını kapattı; indirmeye zorlama.
      if (error && error.name === "AbortError") return "failed";
      // Diğer hatalar (NotAllowedError, transient activation süresi dolması vb.)
      // → paylaşım gerçekleşmedi, aşağıdaki indir fallback'ine düş (sessiz kalma).
      if (typeof console !== "undefined") console.warn("navigator.share failed, indiriliyor:", error);
    }
  }

  // Fallback: indir (paylaşım desteklenmiyor ya da başarısız oldu)
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tusoskop-mini-tus.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return "downloaded";
  } catch (error) {
    if (typeof console !== "undefined") console.warn("shareMiniTusCard download failed:", error);
    return "failed";
  }
}
