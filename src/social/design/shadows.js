/** SVG gölge / derinlik tanımları (filter id suffix ile kullanılır) */
export function shadowFilters(uid) {
  return `
  <filter id="cardShadow-${uid}" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.45"/>
    <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#10b981" flood-opacity="0.08"/>
  </filter>
  <filter id="innerGlow-${uid}" x="-10%" y="-10%" width="120%" height="120%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
    <feOffset dx="0" dy="1"/>
    <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.06 0 0 0 0 0.73 0 0 0 0 0.51 0 0 0 0.15 0"/>
    <feBlend in="SourceGraphic" mode="normal"/>
  </filter>
  <filter id="noise-${uid}">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" result="noise"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer>
      <feFuncA type="linear" slope="0.035"/>
    </feComponentTransfer>
  </filter>`;
}

export const cardShadowFilter = (uid) => `url(#cardShadow-${uid})`;
