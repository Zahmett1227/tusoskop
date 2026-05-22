/** Tipografi hiyerarşisi — sistem font stack (PNG export uyumlu) */
export const fonts = {
  display: "'Poppins', 'Montserrat', 'Segoe UI', system-ui, sans-serif",
  body: "'Inter', 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'Consolas', monospace",
};

export const typography = {
  hook: { size: 13, weight: 700, lineHeight: 1.35, letterSpacing: 0.06, transform: "uppercase" },
  eyebrow: { size: 12, weight: 600, lineHeight: 1.4, letterSpacing: 0.08 },
  meta: { size: 15, weight: 500, lineHeight: 1.45, letterSpacing: 0.01 },
  title: { size: 34, weight: 700, lineHeight: 1.22, letterSpacing: -0.02 },
  titleLg: { size: 40, weight: 700, lineHeight: 1.18, letterSpacing: -0.025 },
  body: { size: 22, weight: 500, lineHeight: 1.48, letterSpacing: 0 },
  bodySm: { size: 19, weight: 500, lineHeight: 1.45, letterSpacing: 0 },
  option: { size: 20, weight: 500, lineHeight: 1.38, letterSpacing: 0 },
  cta: { size: 15, weight: 700, lineHeight: 1.35, letterSpacing: 0.02 },
  micro: { size: 13, weight: 600, lineHeight: 1.35, letterSpacing: 0.04 },
  storyHero: { size: 44, weight: 700, lineHeight: 1.2, letterSpacing: -0.02 },
  storyDisplay: { size: 52, weight: 800, lineHeight: 1.12, letterSpacing: -0.03 },
};

export const fontSizeMin = 15;
export const fontSizeMax = {
  question: 36,
  option: 22,
  body: 24,
};
