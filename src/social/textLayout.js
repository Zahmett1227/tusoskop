/**
 * SVG metin yerleşimi — tarayıcı ölçümü olmadan yaklaşık genişlik hesabı.
 * Oran: Segoe UI benzeri sans-serif ~0.52–0.58 × fontSize (px) / karakter
 */

const CHAR_WIDTH_RATIO = 0.54;

export function estimateTextWidth(text, fontSize) {
  return String(text).length * fontSize * CHAR_WIDTH_RATIO;
}

/**
 * Kelime bazlı satır kırma (max piksel genişliği).
 * @returns {string[]}
 */
export function wrapTextByWidth(text, maxWidthPx, fontSize) {
  const words = String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
  if (!words.length || !words[0]) return [];

  const lines = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (estimateTextWidth(candidate, fontSize) <= maxWidthPx || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Satır listesini maxLines ile sınırla; taşarsa son satıra ellipsis.
 */
export function splitLongText(lines, maxLines, ellipsis = "…") {
  if (lines.length <= maxLines) return { lines, truncated: false };
  const kept = lines.slice(0, maxLines);
  const last = kept[maxLines - 1];
  kept[maxLines - 1] = `${last.replace(/\s+\S*$/, "")}${ellipsis}`;
  return { lines: kept, truncated: true };
}

/**
 * Metni kutuya sığdır: önce wrap, gerekirse font küçült.
 */
export function fitTextToBox(text, options = {}) {
  const {
    maxWidthPx = 880,
    maxLines = 7,
    fontSizeMax = 40,
    fontSizeMin = 22,
    ellipsis = "…",
  } = options;

  for (let size = fontSizeMax; size >= fontSizeMin; size -= 2) {
    const wrapped = wrapTextByWidth(text, maxWidthPx, size);
    if (wrapped.length <= maxLines) {
      return { lines: wrapped, fontSize: size, truncated: false };
    }
  }

  const wrapped = wrapTextByWidth(text, maxWidthPx, fontSizeMin);
  const { lines, truncated } = splitLongText(wrapped, maxLines, ellipsis);
  return { lines, fontSize: fontSizeMin, truncated: true };
}

/**
 * SVG <text> + <tspan> bloğu.
 */
export function renderMultilineText({
  lines,
  x,
  y,
  fontSize,
  lineHeight,
  fill,
  fontWeight = "500",
  fontFamily = "Segoe UI, system-ui, sans-serif",
  textAnchor = "start",
}) {
  const lh = lineHeight || Math.round(fontSize * 1.38);
  const anchor = textAnchor === "middle" ? ' text-anchor="middle"' : textAnchor === "end" ? ' text-anchor="end"' : "";
  const tspans = lines
    .map((line, i) => {
      const dy = i === 0 ? 0 : lh;
      return `<tspan x="${x}" dy="${i === 0 ? 0 : dy}">${escapeXml(line)}</tspan>`;
    })
    .join("");
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}"${anchor}>${tspans}</text>`;
}

export function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** @deprecated use wrapTextByWidth */
export function wrapText(text, maxCharsPerLine) {
  const approxFont = 28;
  const maxWidth = maxCharsPerLine * approxFont * CHAR_WIDTH_RATIO;
  return wrapTextByWidth(text, maxWidth, approxFont).join("\n");
}
