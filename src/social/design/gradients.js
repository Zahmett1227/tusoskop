import { colors } from "./colors.js";

/** SVG gradient & pattern tanımları */
export function gradientDefs(uid) {
  return `
  <linearGradient id="bgGrad-${uid}" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0%" stop-color="${colors.bgElevated}"/>
    <stop offset="55%" stop-color="${colors.bg}"/>
    <stop offset="100%" stop-color="#030712"/>
  </linearGradient>
  <radialGradient id="glowAccent-${uid}" cx="85%" cy="8%" r="55%">
    <stop offset="0%" stop-color="${colors.accent}" stop-opacity="0.22"/>
    <stop offset="100%" stop-color="${colors.accent}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="glowSoft-${uid}" cx="15%" cy="92%" r="45%">
    <stop offset="0%" stop-color="#1e3a5f" stop-opacity="0.35"/>
    <stop offset="100%" stop-color="#1e3a5f" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="glassGrad-${uid}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="rgba(255,255,255,0.06)"/>
    <stop offset="100%" stop-color="rgba(255,255,255,0.01)"/>
  </linearGradient>
  <linearGradient id="chipGrad-${uid}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="rgba(16,185,129,0.28)"/>
    <stop offset="100%" stop-color="rgba(16,185,129,0.08)"/>
  </linearGradient>
  <pattern id="dotGrid-${uid}" width="24" height="24" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="0.8" fill="${colors.muted}" opacity="0.12"/>
  </pattern>`;
}
