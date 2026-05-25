import { colors } from "./colors.js";
import { themePatternDefs } from "./topicThemes.js";

/** SVG gradient & pattern tanımları — tema renkleriyle */
export function gradientDefs(uid, theme = null) {
  const accent = theme?.accentColor || colors.accent;
  const soft = theme?.softGlowColor || "#1e3a5f";
  const glow = theme?.glowPosition || { cx: "85%", cy: "8%", r: "55%" };
  const chipStart = theme ? rgbaFromHex(accent, 0.28) : "rgba(16,185,129,0.28)";
  const chipEnd = theme ? rgbaFromHex(accent, 0.08) : "rgba(16,185,129,0.08)";

  return `
  <linearGradient id="bgGrad-${uid}" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0%" stop-color="${colors.bgElevated}"/>
    <stop offset="55%" stop-color="${colors.bg}"/>
    <stop offset="100%" stop-color="#030712"/>
  </linearGradient>
  <radialGradient id="glowAccent-${uid}" cx="${glow.cx}" cy="${glow.cy}" r="${glow.r || "55%"}">
    <stop offset="0%" stop-color="${accent}" stop-opacity="0.24"/>
    <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="glowSoft-${uid}" cx="15%" cy="92%" r="45%">
    <stop offset="0%" stop-color="${soft}" stop-opacity="0.4"/>
    <stop offset="100%" stop-color="${soft}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="glassGrad-${uid}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="rgba(255,255,255,0.06)"/>
    <stop offset="100%" stop-color="rgba(255,255,255,0.01)"/>
  </linearGradient>
  <linearGradient id="chipGrad-${uid}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="${chipStart}"/>
    <stop offset="100%" stop-color="${chipEnd}"/>
  </linearGradient>
  ${themePatternDefs(uid, theme || { backgroundPattern: "dotGrid", accentColor: accent })}`;
}

function rgbaFromHex(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
