/**
 * Instagram okunabilirliği için metin yoğunluğu optimizasyonu.
 */

const FILLER_WORDS = /\b(olarak|için|gibi|dolayı|şekilde|ancak|fakat|ayrıca|bununla birlikte)\b/gi;

/** Uzun cümleleri kısalt, max 2 satırlık paragraflar */
export function optimizeForInstagram(text, { maxLineChars = 52, maxParagraphLines = 2 } = {}) {
  const raw = String(text || "").trim();
  if (!raw) return "";

  const sentences = raw
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks = [];
  for (const sentence of sentences) {
    const cleaned = sentence.replace(FILLER_WORDS, "").replace(/\s+/g, " ").trim();
    if (cleaned.length <= maxLineChars * maxParagraphLines) {
      chunks.push(cleaned);
    } else {
      const parts = splitAtNaturalBreaks(cleaned, maxLineChars);
      chunks.push(...parts.slice(0, maxParagraphLines));
    }
  }
  return chunks.join("\n");
}

function splitAtNaturalBreaks(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length <= maxChars) line = next;
    else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Metni bullet listesine dönüştür */
export function toBulletPoints(text, max = 4) {
  const raw = String(text || "").trim();
  if (!raw) return [];

  if (raw.includes("•")) {
    return raw
      .split("•")
      .map((s) => s.trim())
      .filter((s) => s.length > 4)
      .slice(0, max);
  }

  const sentences = raw
    .split(/[.!?;]\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8 && s.length < 90);

  if (sentences.length >= 2) return sentences.slice(0, max);

  const words = raw.split(/\s+/);
  if (words.length <= 6) return [raw];

  const mid = Math.ceil(words.length / 2);
  return [`${words.slice(0, mid).join(" ")}`, `${words.slice(mid).join(" ")}`].slice(0, max);
}

/** Mini bilgi kartları için yapılandırılmış içerik */
export function structureMiniTipContent({ title, point, mechanism, hint, contrast }) {
  const bullets = [];
  if (mechanism) bullets.push(mechanism);
  if (point) bullets.push(point);
  if (hint) bullets.push(`İpucu: ${hint}`);
  if (contrast) bullets.push(`Ayırıcı: ${contrast}`);

  return {
    title: title || point?.split(/[→:]/)[0]?.trim() || "Mini TUS",
    bullets: bullets.slice(0, 4),
    captionBody: bullets.map((b) => `• ${b}`).join("\n"),
  };
}

/** Soru kökünden kısa görsel özet (carousel slide 2 vb.) */
export function summarizeForSlide(text, maxLen = 140) {
  const t = String(text || "").trim();
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 60 ? lastSpace : maxLen - 1).trim()}…`;
}

/** Klinik püf nokta — exp metninden kısa çıkarım */
export function extractClinicalTip(explanation, maxLen = 160) {
  const exp = String(explanation || "").trim();
  if (!exp) return "Mekanizmayı ve ayırıcı tanıyı birlikte düşün.";
  const first = exp.split(/(?<=[.!?])\s+/)[0] || exp;
  return summarizeForSlide(first, maxLen);
}
