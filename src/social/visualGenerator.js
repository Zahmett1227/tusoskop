import { SOCIAL_CONFIG } from "./socialConfig.js";

const FORMATS = {
  "1080x1080": { width: 1080, height: 1080 },
  "1080x1350": { width: 1080, height: 1350 },
  "1080x1920": { width: 1080, height: 1920 },
};

/**
 * Tusoskop marka renkleriyle SVG post/story görseli üretir.
 * MVP: SVG data URL — PNG dönüşümü exportPackage'te canvas ile yapılır.
 */
export function renderSocialVisual(visualSpec = {}) {
  const format = visualSpec.format || "1080x1080";
  const { width, height } = FORMATS[format] || FORMATS["1080x1080"];
  const c = SOCIAL_CONFIG.colors;

  const headline = escapeXml(visualSpec.headline || SOCIAL_CONFIG.brandName);
  const subline = escapeXml(visualSpec.subline || "");
  const body = wrapText(escapeXml(visualSpec.body || ""), format === "1080x1920" ? 28 : 24, width - 160);
  const footer = escapeXml(visualSpec.footer || "tusoskop.com");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c.bg}"/>
      <stop offset="100%" stop-color="#0b1220"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="48" y="48" width="${width - 96}" height="${height - 96}" rx="32" fill="${c.card}" stroke="${c.border}" stroke-width="2"/>
  <rect x="48" y="48" width="${width - 96}" height="8" rx="4" fill="${c.accent}"/>
  <text x="96" y="${format === "1080x1920" ? 180 : 160}" fill="${c.accentSoft}" font-family="Segoe UI, system-ui, sans-serif" font-size="36" font-weight="700">${headline}</text>
  ${subline ? `<text x="96" y="${format === "1080x1920" ? 240 : 220}" fill="${c.muted}" font-family="Segoe UI, system-ui, sans-serif" font-size="26" font-weight="600">${subline}</text>` : ""}
  <text x="96" y="${format === "1080x1920" ? 320 : 300}" fill="${c.text}" font-family="Segoe UI, system-ui, sans-serif" font-size="${format === "1080x1920" ? 34 : 30}" font-weight="500">${body}</text>
  <text x="96" y="${height - 96}" fill="${c.accent}" font-family="Segoe UI, system-ui, sans-serif" font-size="24" font-weight="700">${footer}</text>
  <circle cx="${width - 120}" cy="${height - 120}" r="36" fill="${c.accent}" opacity="0.15" filter="url(#glow)"/>
  <text x="${width - 120}" y="${height - 110}" text-anchor="middle" fill="${c.accentSoft}" font-family="Segoe UI, system-ui, sans-serif" font-size="20" font-weight="800">T</text>
</svg>`;

  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return { svg, svgUrl, width, height, format };
}

export function renderStoryVisual(storySpec) {
  return renderSocialVisual(storySpec);
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Basit satır kaydırma — SVG tspan yerine çok satırlı tek text (yaklaşık) */
function wrapText(text, maxCharsPerLine, maxWidthHint) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  const approxCharWidth = maxWidthHint / maxCharsPerLine;
  const maxChars = Math.max(20, Math.floor(maxWidthHint / approxCharWidth) || maxCharsPerLine);

  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 8).join("\n");
}

/** SVG → PNG (tarayıcıda export için) */
export async function svgToPngDataUrl(svg, width, height) {
  if (typeof document === "undefined") {
    return null;
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = SOCIAL_CONFIG.colors.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("SVG PNG dönüşümü başarısız"));
    };
    img.src = url;
  });
}
