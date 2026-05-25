/**
 * Ders / konu bazlı dinamik görsel tema sistemi.
 * @typedef {object} TopicTheme
 * @property {string} id
 * @property {string} label
 * @property {string} icon — tema tanımlayıcı
 * @property {string} accentColor
 * @property {string} secondaryColor
 * @property {string} backgroundPattern
 * @property {(w: number, h: number, uid: string) => string} decorativeSvg
 * @property {{ cx: string, cy: string, r?: string }} glowPosition
 */

import { colors as baseColors } from "./colors.js";

const DEFAULT_THEME = {
  id: "default",
  label: "Tusoskop",
  icon: "brand",
  accentColor: baseColors.accent,
  secondaryColor: baseColors.accentBright,
  storyBackgroundImage: "/social/story-backgrounds/dahiliye.svg",
  safeLayout: "instagram_story",
  backgroundPattern: "dotGrid",
  glowPosition: { cx: "85%", cy: "8%", r: "55%" },
  softGlowColor: "#1e3a5f",
  decorativeSvg: () => "",
};

const STORY_BACKGROUNDS = {
  fizyoloji: "/social/story-backgrounds/fizyoloji.svg",
  anatomi: "/social/story-backgrounds/anatomi.svg",
  biyokimya: "/social/story-backgrounds/biyokimya.svg",
  mikrobiyoloji: "/social/story-backgrounds/mikrobiyoloji.svg",
  patoloji: "/social/story-backgrounds/patoloji.svg",
  farmakoloji: "/social/story-backgrounds/farmakoloji.svg",
  dahiliye: "/social/story-backgrounds/dahiliye.svg",
  pediatri: "/social/story-backgrounds/pediatri.svg",
  genelCerrahi: "/social/story-backgrounds/genel-cerrahi.svg",
  kadinDogum: "/social/story-backgrounds/kadin-dogum.svg",
  kucukStajlar: "/social/story-backgrounds/kucuk-stajlar.svg",
};

/** @type {Record<string, Omit<TopicTheme, 'decorativeSvg'> & { decorativeSvg: TopicTheme['decorativeSvg'] }>} */
const THEMES = {
  cardiology: {
    id: "cardiology",
    label: "Kardiyoloji",
    icon: "heart-ecg",
    accentColor: "#ef4444",
    secondaryColor: "#f87171",
    backgroundPattern: "ecgLine",
    glowPosition: { cx: "78%", cy: "12%", r: "50%" },
    softGlowColor: "#450a0a",
    decorativeSvg: (w, h, uid) => heartEcgDecor(w, h, uid, "#ef4444"),
  },
  hepatology: {
    id: "hepatology",
    label: "Hepatoloji",
    icon: "liver",
    accentColor: "#a16207",
    secondaryColor: "#ca8a04",
    backgroundPattern: "organicWave",
    glowPosition: { cx: "88%", cy: "15%", r: "48%" },
    softGlowColor: "#422006",
    decorativeSvg: (w, h, uid) => liverDecor(w, h, uid, "#ca8a04"),
  },
  pharmacology: {
    id: "pharmacology",
    label: "Farmakoloji",
    icon: "molecule",
    accentColor: "#8b5cf6",
    secondaryColor: "#a78bfa",
    backgroundPattern: "moleculeGrid",
    glowPosition: { cx: "82%", cy: "10%", r: "52%" },
    softGlowColor: "#2e1065",
    decorativeSvg: (w, h, uid) => moleculeDecor(w, h, uid, "#a78bfa"),
  },
  microbiology: {
    id: "microbiology",
    label: "Mikrobiyoloji",
    icon: "microbe",
    accentColor: "#06b6d4",
    secondaryColor: "#22d3ee",
    backgroundPattern: "cellDots",
    glowPosition: { cx: "90%", cy: "18%", r: "45%" },
    softGlowColor: "#083344",
    decorativeSvg: (w, h, uid) => microbeDecor(w, h, uid, "#22d3ee"),
  },
  pediatrics: {
    id: "pediatrics",
    label: "Pediatri",
    icon: "soft-star",
    accentColor: "#f472b6",
    secondaryColor: "#f9a8d4",
    backgroundPattern: "softStars",
    glowPosition: { cx: "80%", cy: "14%", r: "50%" },
    softGlowColor: "#500724",
    decorativeSvg: (w, h, uid) => softStarDecor(w, h, uid, "#f9a8d4"),
  },
  obgyn: {
    id: "obgyn",
    label: "Kadın Doğum",
    icon: "uterus",
    accentColor: "#ec4899",
    secondaryColor: "#f472b6",
    backgroundPattern: "monitorLine",
    glowPosition: { cx: "86%", cy: "12%", r: "48%" },
    softGlowColor: "#4a044e",
    decorativeSvg: (w, h, uid) => uterusDecor(w, h, uid, "#f472b6"),
  },
  neurology: {
    id: "neurology",
    label: "Nöroloji",
    icon: "brain",
    accentColor: "#6366f1",
    secondaryColor: "#818cf8",
    backgroundPattern: "neuralNet",
    glowPosition: { cx: "84%", cy: "10%", r: "52%" },
    softGlowColor: "#1e1b4b",
    decorativeSvg: (w, h, uid) => brainDecor(w, h, uid, "#818cf8"),
  },
  hematology: {
    id: "hematology",
    label: "Hematoloji",
    icon: "blood-cell",
    accentColor: "#dc2626",
    secondaryColor: "#ef4444",
    backgroundPattern: "flowLine",
    glowPosition: { cx: "88%", cy: "16%", r: "46%" },
    softGlowColor: "#450a0a",
    decorativeSvg: (w, h, uid) => erythrocyteDecor(w, h, uid, "#ef4444"),
  },
  pulmonology: {
    id: "pulmonology",
    label: "Göğüs Hastalıkları",
    icon: "lungs",
    accentColor: "#0ea5e9",
    secondaryColor: "#38bdf8",
    backgroundPattern: "alveoli",
    glowPosition: { cx: "85%", cy: "11%", r: "50%" },
    softGlowColor: "#0c4a6e",
    decorativeSvg: (w, h, uid) => lungsDecor(w, h, uid, "#38bdf8"),
  },
  nephrology: {
    id: "nephrology",
    label: "Nefroloji",
    icon: "kidney",
    accentColor: "#14b8a6",
    secondaryColor: "#2dd4bf",
    backgroundPattern: "nephronWave",
    glowPosition: { cx: "87%", cy: "13%", r: "48%" },
    softGlowColor: "#134e4a",
    decorativeSvg: (w, h, uid) => kidneyDecor(w, h, uid, "#2dd4bf"),
  },
  endocrinology: {
    id: "endocrinology",
    label: "Endokrinoloji",
    icon: "gland",
    accentColor: "#eab308",
    secondaryColor: "#facc15",
    backgroundPattern: "hormonePulse",
    glowPosition: { cx: "83%", cy: "9%", r: "52%" },
    softGlowColor: "#422006",
    decorativeSvg: (w, h, uid) => glandDecor(w, h, uid, "#facc15"),
  },
  gastroenterology: {
    id: "gastroenterology",
    label: "Gastroenteroloji",
    icon: "gi-tract",
    accentColor: "#f97316",
    secondaryColor: "#fb923c",
    backgroundPattern: "giCurve",
    glowPosition: { cx: "86%", cy: "14%", r: "47%" },
    softGlowColor: "#431407",
    decorativeSvg: (w, h, uid) => giDecor(w, h, uid, "#fb923c"),
  },
  infectious: {
    id: "infectious",
    label: "Enfeksiyon",
    icon: "virus",
    accentColor: "#84cc16",
    secondaryColor: "#a3e635",
    backgroundPattern: "virusMesh",
    glowPosition: { cx: "89%", cy: "12%", r: "48%" },
    softGlowColor: "#1a2e05",
    decorativeSvg: (w, h, uid) => virusDecor(w, h, uid, "#a3e635"),
  },
  physiology: {
    id: "physiology",
    label: "Fizyoloji",
    icon: "kidney",
    accentColor: "#14b8a6",
    secondaryColor: "#5eead4",
    storyBackgroundImage: STORY_BACKGROUNDS.fizyoloji,
    backgroundPattern: "nephronWave",
    glowPosition: { cx: "86%", cy: "12%", r: "50%" },
    softGlowColor: "#134e4a",
    decorativeSvg: (w, h, uid) => kidneyDecor(w, h, uid, "#5eead4"),
  },
  anatomy: {
    id: "anatomy",
    label: "Anatomi",
    icon: "skeleton",
    accentColor: "#38bdf8",
    secondaryColor: "#7dd3fc",
    storyBackgroundImage: STORY_BACKGROUNDS.anatomi,
    backgroundPattern: "organicWave",
    glowPosition: { cx: "78%", cy: "12%", r: "50%" },
    softGlowColor: "#0c4a6e",
    decorativeSvg: (w, h, uid) => lungsDecor(w, h, uid, "#7dd3fc"),
  },
  biochemistry: {
    id: "biochemistry",
    label: "Biyokimya",
    icon: "dna",
    accentColor: "#22c55e",
    secondaryColor: "#86efac",
    storyBackgroundImage: STORY_BACKGROUNDS.biyokimya,
    backgroundPattern: "moleculeGrid",
    glowPosition: { cx: "82%", cy: "10%", r: "52%" },
    softGlowColor: "#052e16",
    decorativeSvg: (w, h, uid) => moleculeDecor(w, h, uid, "#86efac"),
  },
  pathology: {
    id: "pathology",
    label: "Patoloji",
    icon: "histology",
    accentColor: "#fb7185",
    secondaryColor: "#fda4af",
    storyBackgroundImage: STORY_BACKGROUNDS.patoloji,
    backgroundPattern: "cellDots",
    glowPosition: { cx: "82%", cy: "16%", r: "48%" },
    softGlowColor: "#4c0519",
    decorativeSvg: (w, h, uid) => microbeDecor(w, h, uid, "#fda4af"),
  },
  internal_medicine: {
    id: "internal_medicine",
    label: "Dahiliye",
    icon: "organs",
    accentColor: "#2dd4bf",
    secondaryColor: "#67e8f9",
    storyBackgroundImage: STORY_BACKGROUNDS.dahiliye,
    backgroundPattern: "monitorLine",
    glowPosition: { cx: "86%", cy: "12%", r: "48%" },
    softGlowColor: "#164e63",
    decorativeSvg: (w, h, uid) => lungsDecor(w, h, uid, "#67e8f9"),
  },
  surgery: {
    id: "surgery",
    label: "Genel Cerrahi",
    icon: "surgery",
    accentColor: "#f97316",
    secondaryColor: "#fdba74",
    storyBackgroundImage: STORY_BACKGROUNDS.genelCerrahi,
    backgroundPattern: "flowLine",
    glowPosition: { cx: "84%", cy: "12%", r: "50%" },
    softGlowColor: "#431407",
    decorativeSvg: (w, h, uid) => giDecor(w, h, uid, "#fdba74"),
  },
  small_rotations: {
    id: "small_rotations",
    label: "Kucuk Stajlar",
    icon: "clinic",
    accentColor: "#818cf8",
    secondaryColor: "#a5b4fc",
    storyBackgroundImage: STORY_BACKGROUNDS.kucukStajlar,
    backgroundPattern: "neuralNet",
    glowPosition: { cx: "84%", cy: "10%", r: "52%" },
    softGlowColor: "#1e1b4b",
    decorativeSvg: (w, h, uid) => brainDecor(w, h, uid, "#a5b4fc"),
  },
};

const KONU_RULES = [
  { theme: "cardiology", patterns: [/kardiyol/i, /\bekg\b/i, /kalp/i, /aritmi/i, /hipertans/i] },
  { theme: "hepatology", patterns: [/hepatol/i, /karaciğ/i, /siroz/i, /sarılık/i, /hepatit/i, /safra/i] },
  { theme: "neurology", patterns: [/nörolo/i, /norol/i, /beyin/i, /inme/i, /epilep/i, /ms\b/i] },
  { theme: "hematology", patterns: [/hematol/i, /kan\b/i, /anemi/i, /lösemi/i, /koag/i, /tromb/i] },
  { theme: "pulmonology", patterns: [/göğüs/i, /gogus/i, /akciğer/i, /astım/i, /koah/i, /solunum/i, /pulmonol/i] },
  { theme: "nephrology", patterns: [/nefrol/i, /böbrek/i, /bobrek/i, /diyaliz/i, /glomer/i] },
  { theme: "endocrinology", patterns: [/endokrin/i, /tiroid/i, /diyabet/i, /adrenal/i, /hipofiz/i] },
  { theme: "gastroenterology", patterns: [/gastro/i, /mide/i, /bağırs/i, /bagirs/i, /kolon/i, /ibd/i, /crohn/i] },
  { theme: "infectious", patterns: [/enfeksiy/i, /sepsis/i, /antibiyot/i, /virüs/i, /virus/i, /hiv/i, /tbc/i] },
  { theme: "obgyn", patterns: [/doğum/i, /dogum/i, /jinekol/i, /obstet/i, /gebelik/i, /fetal/i, /uter/i] },
];

const DERS_RULES = [
  { theme: "physiology", patterns: [/fizyoloji/i] },
  { theme: "anatomy", patterns: [/anatomi/i] },
  { theme: "biochemistry", patterns: [/biyokimya/i, /biokimya/i] },
  { theme: "pathology", patterns: [/patoloji/i] },
  { theme: "pharmacology", patterns: [/farmakol/i] },
  { theme: "microbiology", patterns: [/mikrobiyol/i, /mikrobiol/i] },
  { theme: "internal_medicine", patterns: [/dahiliye/i] },
  { theme: "pediatrics", patterns: [/pediatr/i] },
  { theme: "surgery", patterns: [/genel cerrahi/i, /cerrahi/i] },
  { theme: "obgyn", patterns: [/kadın/i, /kadin/i, /doğum/i, /dogum/i] },
  { theme: "neurology", patterns: [/nörolo/i, /norol/i] },
  { theme: "cardiology", patterns: [/kardiyol/i] },
  { theme: "small_rotations", patterns: [/kucuk staj/i, /kucuk/i, /staj/i] },
  { theme: "infectious", patterns: [/enfeksiy/i] },
];

const STORY_BACKGROUND_BY_THEME = {
  cardiology: STORY_BACKGROUNDS.dahiliye,
  hepatology: STORY_BACKGROUNDS.genelCerrahi,
  pharmacology: STORY_BACKGROUNDS.farmakoloji,
  microbiology: STORY_BACKGROUNDS.mikrobiyoloji,
  pediatrics: STORY_BACKGROUNDS.pediatri,
  obgyn: STORY_BACKGROUNDS.kadinDogum,
  neurology: STORY_BACKGROUNDS.kucukStajlar,
  hematology: STORY_BACKGROUNDS.patoloji,
  pulmonology: STORY_BACKGROUNDS.anatomi,
  nephrology: STORY_BACKGROUNDS.fizyoloji,
  endocrinology: STORY_BACKGROUNDS.farmakoloji,
  gastroenterology: STORY_BACKGROUNDS.genelCerrahi,
  infectious: STORY_BACKGROUNDS.mikrobiyoloji,
};

function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function matchRules(text, rules) {
  const n = normalize(text);
  if (!n) return null;
  for (const rule of rules) {
    if (rule.patterns.some((p) => p.test(n))) return rule.theme;
  }
  return null;
}

/**
 * @param {{ ders?: string, konu?: string, metaLine?: string }} input
 * @returns {TopicTheme}
 */
export function getTopicTheme(input = {}) {
  let ders = input.ders || "";
  let konu = input.konu || "";

  if ((!ders || !konu) && input.metaLine) {
    const parts = String(input.metaLine).split("·").map((s) => s.trim());
    if (!ders && parts[0]) ders = parts[0];
    if (!konu && parts[1]) konu = parts[1];
  }

  const combined = `${normalize(ders)} ${normalize(konu)}`;
  const byKonu = matchRules(konu, KONU_RULES) || matchRules(combined, KONU_RULES);
  const byDers = matchRules(ders, DERS_RULES);
  const shouldKeepDers = byDers && !["internal_medicine"].includes(byDers);
  const id = (shouldKeepDers ? byDers : byKonu || byDers) || "default";
  const theme = THEMES[id] || DEFAULT_THEME;
  return {
    ...DEFAULT_THEME,
    ...theme,
    storyBackgroundImage:
      theme.storyBackgroundImage || STORY_BACKGROUND_BY_THEME[id] || DEFAULT_THEME.storyBackgroundImage,
  };
}

/** Tema renklerini render palette'e dönüştür */
export function themeToPalette(theme) {
  const accent = theme.accentColor || baseColors.accent;
  const bright = theme.secondaryColor || baseColors.accentBright;
  return {
    ...baseColors,
    accent,
    accentBright: bright,
    accentMuted: hexAlpha(accent, 0.15),
    borderGlow: hexAlpha(accent, 0.38),
    chipGradStart: hexAlpha(accent, 0.28),
    chipGradEnd: hexAlpha(accent, 0.08),
    softGlow: theme.softGlowColor || "#1e3a5f",
  };
}

function hexAlpha(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** SVG pattern tanımları — tema bazlı */
export function themePatternDefs(uid, theme) {
  const accent = theme.accentColor || baseColors.accent;
  const pattern = theme.backgroundPattern || "dotGrid";
  const patterns = {
    dotGrid: `<pattern id="topicPattern-${uid}" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.8" fill="${baseColors.muted}" opacity="0.12"/>
    </pattern>`,
    ecgLine: `<pattern id="topicPattern-${uid}" width="120" height="40" patternUnits="userSpaceOnUse">
      <path d="M0 20 H20 L25 8 L32 32 L38 20 H120" fill="none" stroke="${accent}" stroke-width="1" opacity="0.14"/>
    </pattern>`,
    organicWave: `<pattern id="topicPattern-${uid}" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M0 40 Q20 20 40 40 T80 40" fill="none" stroke="${accent}" stroke-width="1" opacity="0.12"/>
      <path d="M0 55 Q25 35 50 55 T100 55" fill="none" stroke="${accent}" stroke-width="0.8" opacity="0.08"/>
    </pattern>`,
    moleculeGrid: `<pattern id="topicPattern-${uid}" width="48" height="48" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="3" fill="${accent}" opacity="0.15"/>
      <circle cx="36" cy="36" r="3" fill="${accent}" opacity="0.12"/>
      <line x1="12" y1="12" x2="36" y2="36" stroke="${accent}" stroke-width="0.8" opacity="0.1"/>
    </pattern>`,
    cellDots: `<pattern id="topicPattern-${uid}" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="16" cy="16" r="6" fill="none" stroke="${accent}" stroke-width="0.8" opacity="0.12"/>
      <circle cx="16" cy="16" r="2" fill="${accent}" opacity="0.18"/>
    </pattern>`,
    softStars: `<pattern id="topicPattern-${uid}" width="36" height="36" patternUnits="userSpaceOnUse">
      <circle cx="8" cy="8" r="1.2" fill="${accent}" opacity="0.2"/>
      <circle cx="28" cy="22" r="1.5" fill="${accent}" opacity="0.15"/>
      <circle cx="18" cy="30" r="1" fill="${accent}" opacity="0.18"/>
    </pattern>`,
    monitorLine: `<pattern id="topicPattern-${uid}" width="100" height="32" patternUnits="userSpaceOnUse">
      <path d="M0 16 H15 L20 10 L25 22 L30 16 H100" fill="none" stroke="${accent}" stroke-width="1" opacity="0.13"/>
    </pattern>`,
    neuralNet: `<pattern id="topicPattern-${uid}" width="64" height="64" patternUnits="userSpaceOnUse">
      <circle cx="16" cy="16" r="2" fill="${accent}" opacity="0.2"/>
      <circle cx="48" cy="48" r="2" fill="${accent}" opacity="0.15"/>
      <line x1="16" y1="16" x2="48" y2="48" stroke="${accent}" stroke-width="0.7" opacity="0.1"/>
      <circle cx="48" cy="16" r="1.5" fill="${accent}" opacity="0.12"/>
      <line x1="16" y1="16" x2="48" y2="16" stroke="${accent}" stroke-width="0.6" opacity="0.08"/>
    </pattern>`,
    flowLine: `<pattern id="topicPattern-${uid}" width="90" height="24" patternUnits="userSpaceOnUse">
      <ellipse cx="20" cy="12" rx="8" ry="5" fill="none" stroke="${accent}" stroke-width="0.8" opacity="0.14"/>
      <ellipse cx="50" cy="12" rx="8" ry="5" fill="none" stroke="${accent}" stroke-width="0.8" opacity="0.12"/>
      <ellipse cx="80" cy="12" rx="8" ry="5" fill="none" stroke="${accent}" stroke-width="0.8" opacity="0.1"/>
    </pattern>`,
    alveoli: `<pattern id="topicPattern-${uid}" width="56" height="56" patternUnits="userSpaceOnUse">
      <circle cx="18" cy="28" r="10" fill="none" stroke="${accent}" stroke-width="0.8" opacity="0.11"/>
      <circle cx="38" cy="28" r="10" fill="none" stroke="${accent}" stroke-width="0.8" opacity="0.11"/>
    </pattern>`,
    nephronWave: `<pattern id="topicPattern-${uid}" width="70" height="70" patternUnits="userSpaceOnUse">
      <path d="M10 35 Q35 10 60 35 Q35 60 10 35" fill="none" stroke="${accent}" stroke-width="0.9" opacity="0.12"/>
    </pattern>`,
    hormonePulse: `<pattern id="topicPattern-${uid}" width="80" height="40" patternUnits="userSpaceOnUse">
      <path d="M0 20 Q20 5 40 20 T80 20" fill="none" stroke="${accent}" stroke-width="1" opacity="0.13"/>
    </pattern>`,
    giCurve: `<pattern id="topicPattern-${uid}" width="60" height="80" patternUnits="userSpaceOnUse">
      <path d="M30 5 Q45 25 30 45 Q15 65 30 75" fill="none" stroke="${accent}" stroke-width="1" opacity="0.12"/>
    </pattern>`,
    virusMesh: `<pattern id="topicPattern-${uid}" width="48" height="48" patternUnits="userSpaceOnUse">
      <circle cx="24" cy="24" r="8" fill="none" stroke="${accent}" stroke-width="0.8" opacity="0.12"/>
      <line x1="24" y1="8" x2="24" y2="16" stroke="${accent}" stroke-width="0.7" opacity="0.1"/>
      <line x1="24" y1="32" x2="24" y2="40" stroke="${accent}" stroke-width="0.7" opacity="0.1"/>
      <line x1="8" y1="24" x2="16" y2="24" stroke="${accent}" stroke-width="0.7" opacity="0.1"/>
      <line x1="32" y1="24" x2="40" y2="24" stroke="${accent}" stroke-width="0.7" opacity="0.1"/>
    </pattern>`,
  };
  return patterns[pattern] || patterns.dotGrid;
}

function decorGroup(svg, opacity = 0.22) {
  return `<g opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round">${svg}</g>`;
}

function heartEcgDecor(w, h, _uid, c) {
  const x = w - 220;
  const y = 80;
  return decorGroup(`
    <path d="M${x + 60} ${y + 30} C${x + 45} ${y + 10} ${x + 20} ${y + 15} ${x + 20} ${y + 38} C${x + 20} ${y + 58} ${x + 60} ${y + 78} ${x + 60} ${y + 78} C${x + 60} ${y + 78} ${x + 100} ${y + 58} ${x + 100} ${y + 38} C${x + 100} ${y + 15} ${x + 75} ${y + 10} ${x + 60} ${y + 30} Z" fill="none" stroke="${c}" stroke-width="2"/>
    <path d="M${x} ${y + 95} H${x + 25} L${x + 32} ${y + 78} L${x + 40} ${y + 108} L${x + 48} ${y + 88} H${x + 130}" fill="none" stroke="${c}" stroke-width="1.5"/>
  `);
}

function liverDecor(w, h, _uid, c) {
  const cx = w - 160;
  const cy = 120;
  return decorGroup(`
    <path d="M${cx} ${cy} C${cx - 50} ${cy - 30} ${cx - 70} ${cy + 20} ${cx - 40} ${cy + 45} C${cx - 10} ${cy + 65} ${cx + 40} ${cy + 55} ${cx + 55} ${cy + 25} C${cx + 65} ${cy + 5} ${cx + 30} ${cy - 15} ${cx} ${cy} Z" fill="none" stroke="${c}" stroke-width="2"/>
  `, 0.2);
}

function moleculeDecor(w, h, _uid, c) {
  const cx = w - 150;
  const cy = 110;
  return decorGroup(`
    <circle cx="${cx}" cy="${cy}" r="14" fill="none" stroke="${c}" stroke-width="1.5"/>
    <circle cx="${cx + 45}" cy="${cy - 25}" r="10" fill="none" stroke="${c}" stroke-width="1.2"/>
    <circle cx="${cx + 50}" cy="${cy + 30}" r="12" fill="none" stroke="${c}" stroke-width="1.2"/>
    <line x1="${cx + 12}" y1="${cy - 8}" x2="${cx + 38}" y2="${cy - 20}" stroke="${c}" stroke-width="1"/>
    <line x1="${cx + 12}" y1="${cy + 8}" x2="${cx + 42}" y2="${cy + 22}" stroke="${c}" stroke-width="1"/>
  `);
}

function microbeDecor(w, h, _uid, c) {
  const cx = w - 140;
  const cy = 115;
  return decorGroup(`
    <ellipse cx="${cx}" cy="${cy}" rx="28" ry="18" fill="none" stroke="${c}" stroke-width="1.5"/>
    <path d="M${cx - 20} ${cy} Q${cx} ${cy - 8} ${cx + 20} ${cy}" fill="none" stroke="${c}" stroke-width="1"/>
    <line x1="${cx - 28}" y1="${cy - 10}" x2="${cx - 38}" y2="${cy - 18}" stroke="${c}" stroke-width="1"/>
    <line x1="${cx + 28}" y1="${cy + 8}" x2="${cx + 38}" y2="${cy + 16}" stroke="${c}" stroke-width="1"/>
  `);
}

function softStarDecor(w, h, _uid, c) {
  return decorGroup(`
    <circle cx="${w - 120}" cy="100" r="3" fill="${c}"/>
    <circle cx="${w - 90}" cy="130" r="2.5" fill="${c}"/>
    <circle cx="${w - 150}" cy="140" r="2" fill="${c}"/>
    <circle cx="${w - 70}" cy="95" r="2" fill="${c}"/>
  `, 0.35);
}

function uterusDecor(w, h, _uid, c) {
  const cx = w - 130;
  const cy = 120;
  return decorGroup(`
    <path d="M${cx} ${cy - 35} C${cx - 25} ${cy - 35} ${cx - 30} ${cy} ${cx - 25} ${cy + 35} C${cx - 10} ${cy + 50} ${cx + 10} ${cy + 50} ${cx + 25} ${cy + 35} C${cx + 30} ${cy} ${cx + 25} ${cy - 35} ${cx} ${cy - 35} Z" fill="none" stroke="${c}" stroke-width="1.8"/>
    <path d="M${cx - 40} ${cy + 10} Q${cx - 55} ${cy + 25} ${cx - 35} ${cy + 35}" fill="none" stroke="${c}" stroke-width="1.2"/>
    <path d="M${cx + 40} ${cy + 10} Q${cx + 55} ${cy + 25} ${cx + 35} ${cy + 35}" fill="none" stroke="${c}" stroke-width="1.2"/>
  `, 0.2);
}

function brainDecor(w, h, _uid, c) {
  const cx = w - 135;
  const cy = 115;
  return decorGroup(`
    <path d="M${cx - 35} ${cy} C${cx - 40} ${cy - 35} ${cx - 5} ${cy - 45} ${cx + 10} ${cy - 25} C${cx + 35} ${cy - 45} ${cx + 45} ${cy - 10} ${cx + 35} ${cy + 15} C${cx + 25} ${cy + 40} ${cx - 15} ${cy + 40} ${cx - 30} ${cy + 15} C${cx - 45} ${cy - 5} ${cx - 35} ${cy} Z" fill="none" stroke="${c}" stroke-width="1.8"/>
    <path d="M${cx - 5} ${cy - 30} Q${cx} ${cy - 10} ${cx + 5} ${cy - 30}" fill="none" stroke="${c}" stroke-width="1"/>
  `, 0.2);
}

function erythrocyteDecor(w, h, _uid, c) {
  const y = 110;
  return decorGroup(`
    <ellipse cx="${w - 160}" cy="${y}" rx="22" ry="12" fill="none" stroke="${c}" stroke-width="1.5"/>
    <ellipse cx="${w - 110}" cy="${y + 8}" rx="22" ry="12" fill="none" stroke="${c}" stroke-width="1.3"/>
    <ellipse cx="${w - 60}" cy="${y - 4}" rx="22" ry="12" fill="none" stroke="${c}" stroke-width="1.3"/>
  `, 0.22);
}

function lungsDecor(w, h, _uid, c) {
  const cx = w - 130;
  const cy = 120;
  return decorGroup(`
    <path d="M${cx} ${cy - 30} L${cx} ${cy + 40}" stroke="${c}" stroke-width="1.5"/>
    <path d="M${cx} ${cy - 10} C${cx - 35} ${cy - 5} ${cx - 40} ${cy + 35} ${cx - 25} ${cy + 45} C${cx - 15} ${cy + 25} ${cx - 10} ${cy + 5} ${cx} ${cy - 10} Z" fill="none" stroke="${c}" stroke-width="1.5"/>
    <path d="M${cx} ${cy - 10} C${cx + 35} ${cy - 5} ${cx + 40} ${cy + 35} ${cx + 25} ${cy + 45} C${cx + 15} ${cy + 25} ${cx + 10} ${cy + 5} ${cx} ${cy - 10} Z" fill="none" stroke="${c}" stroke-width="1.5"/>
  `, 0.2);
}

function kidneyDecor(w, h, _uid, c) {
  const cx = w - 125;
  const cy = 118;
  return decorGroup(`
    <path d="M${cx - 20} ${cy - 25} C${cx - 45} ${cy - 15} ${cx - 45} ${cy + 30} ${cx - 20} ${cy + 40} C${cx - 5} ${cy + 20} ${cx - 5} ${cy - 5} ${cx - 20} ${cy - 25} Z" fill="none" stroke="${c}" stroke-width="1.8"/>
    <path d="M${cx + 20} ${cy - 25} C${cx + 45} ${cy - 15} ${cx + 45} ${cy + 30} ${cx + 20} ${cy + 40} C${cx + 5} ${cy + 20} ${cx + 5} ${cy - 5} ${cx + 20} ${cy - 25} Z" fill="none" stroke="${c}" stroke-width="1.8"/>
  `, 0.2);
}

function glandDecor(w, h, _uid, c) {
  const cx = w - 130;
  const cy = 115;
  return decorGroup(`
    <circle cx="${cx}" cy="${cy}" r="18" fill="none" stroke="${c}" stroke-width="1.5"/>
    <circle cx="${cx}" cy="${cy}" r="6" fill="${c}" opacity="0.35"/>
    <path d="M${cx - 30} ${cy} Q${cx - 15} ${cy - 20} ${cx} ${cy - 18}" fill="none" stroke="${c}" stroke-width="1"/>
    <path d="M${cx + 30} ${cy} Q${cx + 15} ${cy + 20} ${cx} ${cy + 18}" fill="none" stroke="${c}" stroke-width="1"/>
  `, 0.22);
}

function giDecor(w, h, _uid, c) {
  const cx = w - 120;
  return decorGroup(`
    <ellipse cx="${cx}" cy="95" rx="22" ry="18" fill="none" stroke="${c}" stroke-width="1.5"/>
    <path d="M${cx} 113 Q${cx + 15} 130 ${cx} 145 Q${cx - 15} 160 ${cx} 175" fill="none" stroke="${c}" stroke-width="1.5"/>
  `, 0.2);
}

function virusDecor(w, h, _uid, c) {
  const cx = w - 130;
  const cy = 115;
  return decorGroup(`
    <circle cx="${cx}" cy="${cy}" r="20" fill="none" stroke="${c}" stroke-width="1.5"/>
    <line x1="${cx}" y1="${cy - 28}" x2="${cx}" y2="${cy - 20}" stroke="${c}" stroke-width="1.2"/>
    <line x1="${cx}" y1="${cy + 20}" x2="${cx}" y2="${cy + 28}" stroke="${c}" stroke-width="1.2"/>
    <line x1="${cx - 28}" y1="${cy}" x2="${cx - 20}" y2="${cy}" stroke="${c}" stroke-width="1.2"/>
    <line x1="${cx + 20}" y1="${cy}" x2="${cx + 28}" y2="${cy}" stroke="${c}" stroke-width="1.2"/>
    <line x1="${cx - 18}" y1="${cy - 18}" x2="${cx - 12}" y2="${cy - 12}" stroke="${c}" stroke-width="1"/>
    <line x1="${cx + 18}" y1="${cy + 18}" x2="${cx + 12}" y2="${cy + 12}" stroke="${c}" stroke-width="1"/>
  `, 0.2);
}

export { DEFAULT_THEME, THEMES };
