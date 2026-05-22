import { escapeXml, renderMultilineText } from "../textLayout.js";
import { colors } from "./colors.js";
import { radius } from "./spacing.js";
import { fonts, typography } from "./typography.js";
import { shadowFilters, cardShadowFilter } from "./shadows.js";
import { gradientDefs } from "./gradients.js";

export function makeUid(prefix = "s") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function svgDocument({ width, height, uid, body }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
${gradientDefs(uid)}
${shadowFilters(uid)}
</defs>
${renderCanvasBackground(width, height, uid)}
${body}
</svg>`;
}

export function renderCanvasBackground(width, height, uid) {
  return `
<rect width="${width}" height="${height}" fill="url(#bgGrad-${uid})"/>
<rect width="${width}" height="${height}" fill="url(#glowAccent-${uid})"/>
<rect width="${width}" height="${height}" fill="url(#glowSoft-${uid})"/>
<rect width="${width}" height="${height}" fill="url(#dotGrid-${uid})" opacity="0.5"/>
<rect width="${width}" height="${height}" filter="url(#noise-${uid})" opacity="0.6"/>`;
}

export function renderHookChip(text, x, y, { uid, maxWidth = 420 } = {}) {
  const label = String(text || "").toUpperCase();
  const t = typography.hook;
  const padX = 16;
  const padY = 10;
  const estW = Math.min(maxWidth, label.length * t.size * 0.58 + padX * 2);
  const h = t.size * t.lineHeight + padY * 2;

  return `
<g filter="${cardShadowFilter(uid)}">
  <rect x="${x}" y="${y}" width="${estW}" height="${h}" rx="${radius.pill}" fill="url(#chipGrad-${uid})" stroke="${colors.borderGlow}" stroke-width="1"/>
  <rect x="${x + 1}" y="${y + 1}" width="${estW - 2}" height="${h - 2}" rx="${radius.pill}" fill="url(#glassGrad-${uid})" opacity="0.5"/>
  ${renderMultilineText({
    lines: [label],
    x: x + padX,
    y: y + padY + t.size,
    fontSize: t.size,
    lineHeight: Math.round(t.size * t.lineHeight),
    fill: colors.accentBright,
    fontWeight: String(t.weight),
    fontFamily: fonts.display,
    letterSpacing: t.letterSpacing,
  })}
</g>`;
}

export function renderGlassCard(x, y, w, h, uid, { elevated = true } = {}) {
  const filter = elevated ? `filter="${cardShadowFilter(uid)}"` : "";
  return `
<g ${filter}>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius.lg}" fill="${colors.bgCard}" fill-opacity="0.88" stroke="${colors.glassBorder}" stroke-width="1"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius.lg}" fill="url(#glassGrad-${uid})" opacity="0.35"/>
  <rect x="${x + 16}" y="${y + 12}" width="${Math.min(80, w - 32)}" height="3" rx="1.5" fill="${colors.accent}" opacity="0.7"/>
</g>`;
}

export function renderOptionPill(letter, lines, x, y, w, fontSize, uid) {
  const lineH = Math.round(fontSize * 1.36);
  const cardH = Math.max(48, lines.length * lineH + 20);
  const badgeR = 16;

  return {
    height: cardH + 8,
    svg: `
<g filter="${cardShadowFilter(uid)}">
  <rect x="${x}" y="${y}" width="${w}" height="${cardH}" rx="${radius.md}" fill="${colors.bgCard}" fill-opacity="0.92" stroke="${colors.glassBorder}" stroke-width="1"/>
  <circle cx="${x + 28}" cy="${y + cardH / 2}" r="${badgeR}" fill="${colors.accentMuted}" stroke="${colors.borderGlow}" stroke-width="1"/>
  <text x="${x + 28}" y="${y + cardH / 2 + 6}" text-anchor="middle" fill="${colors.accentBright}" font-family="${fonts.display}" font-size="${Math.round(fontSize * 0.78)}" font-weight="800">${escapeXml(letter)}</text>
  ${renderMultilineText({
    lines,
    x: x + 54,
    y: y + 14 + fontSize,
    fontSize,
    lineHeight: lineH,
    fill: colors.textSecondary,
    fontWeight: "500",
    fontFamily: fonts.body,
  })}
</g>`,
  };
}

export function renderCtaBar(width, height, pad, uid, { primary, secondary, variant = "default" } = {}) {
  const barH = 56;
  const y = height - pad - barH - 8;
  const w = width - pad * 2;

  return `
<g filter="${cardShadowFilter(uid)}">
  <rect x="${pad}" y="${y}" width="${w}" height="${barH}" rx="${radius.lg}" fill="${colors.bgCard}" fill-opacity="0.94" stroke="${colors.borderGlow}" stroke-width="1"/>
  <rect x="${pad}" y="${y}" width="${w}" height="${barH}" rx="${radius.lg}" fill="url(#glassGrad-${uid})" opacity="0.25"/>
  ${renderMultilineText({
    lines: [primary || "Kaydet · Tekrar et"],
    x: pad + 20,
    y: y + 22,
    fontSize: typography.cta.size,
    lineHeight: 20,
    fill: colors.accentBright,
    fontWeight: String(typography.cta.weight),
    fontFamily: fonts.display,
  })}
  ${
    secondary
      ? renderMultilineText({
          lines: [secondary],
          x: width - pad - 20,
          y: y + 22,
          fontSize: typography.micro.size,
          lineHeight: 18,
          fill: colors.mutedSoft,
          fontWeight: "600",
          fontFamily: fonts.body,
          textAnchor: "end",
        })
      : ""
  }
  ${variant === "story" ? renderStorySwipeHint(pad, y + barH + 12, width) : ""}
</g>`;
}

function renderStorySwipeHint(pad, y, width) {
  return `
<text x="${width / 2}" y="${y}" text-anchor="middle" fill="${colors.mutedSoft}" font-family="${fonts.body}" font-size="13" font-weight="600" opacity="0.85">↑ Kaydır · devam et</text>`;
}

export function renderBrandMark(width, pad, y, { size = 32 } = {}) {
  const cx = width - pad - size / 2 - 4;
  const cy = y + size / 2;
  return `
<g opacity="0.95">
  <circle cx="${cx}" cy="${cy}" r="${size / 2 + 4}" fill="${colors.accentMuted}" stroke="${colors.borderGlow}" stroke-width="1"/>
  <text x="${cx}" y="${cy + 7}" text-anchor="middle" fill="${colors.accentBright}" font-family="${fonts.display}" font-size="${Math.round(size * 0.55)}" font-weight="800">T</text>
</g>`;
}

export function renderSlideDots(width, height, pad, current, total) {
  if (total <= 1) return "";
  const dotR = 4;
  const gap = 12;
  const totalW = total * (dotR * 2) + (total - 1) * gap;
  let x = (width - totalW) / 2;
  const y = height - pad - 16;
  let out = "";
  for (let i = 0; i < total; i++) {
    const active = i === current;
    out += `<circle cx="${x + dotR}" cy="${y}" r="${active ? 5 : dotR}" fill="${active ? colors.accentBright : colors.muted}" opacity="${active ? 1 : 0.45}"/>`;
    x += dotR * 2 + gap;
  }
  return out;
}

export function renderMetaLine(text, x, y) {
  const t = typography.meta;
  return renderMultilineText({
    lines: [text],
    x,
    y: y + t.size,
    fontSize: t.size,
    lineHeight: Math.round(t.size * t.lineHeight),
    fill: colors.mutedSoft,
    fontWeight: String(t.weight),
    fontFamily: fonts.body,
  });
}

export function renderDisplayText(lines, x, y, { fontSize, maxSize = 36, weight = 700, centered = false, width } = {}) {
  const size = fontSize || maxSize;
  const anchor = centered && width ? "middle" : "start";
  const tx = centered && width ? width / 2 : x;
  return renderMultilineText({
    lines,
    x: tx,
    y: y + size,
    fontSize: size,
    lineHeight: Math.round(size * 1.24),
    fill: colors.text,
    fontWeight: String(weight),
    fontFamily: fonts.display,
    textAnchor: anchor,
  });
}

export function renderBulletCards(bullets, x, startY, contentW, uid, fontSize = 19) {
  let y = startY;
  const parts = [];
  for (const b of bullets.slice(0, 5)) {
    const lines = [String(b).replace(/^•\s*/, "")];
    const lineH = Math.round(fontSize * 1.4);
    const cardH = lineH + 28;
    parts.push(`
<g filter="${cardShadowFilter(uid)}">
  <rect x="${x}" y="${y}" width="${contentW}" height="${cardH}" rx="${radius.md}" fill="${colors.bgCard}" fill-opacity="0.9" stroke="${colors.glassBorder}" stroke-width="1"/>
  <circle cx="${x + 22}" cy="${y + cardH / 2}" r="4" fill="${colors.accentBright}"/>
  ${renderMultilineText({
    lines,
    x: x + 36,
    y: y + 16 + fontSize,
    fontSize,
    lineHeight: lineH,
    fill: colors.textSecondary,
    fontWeight: "500",
    fontFamily: fonts.body,
  })}
</g>`);
    y += cardH + 10;
  }
  return { svg: parts.join("\n"), endY: y };
}

export function finishVisual(svg, width, height, format, extra = {}) {
  return {
    svg,
    svgUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    width,
    height,
    format,
    ...extra,
  };
}
