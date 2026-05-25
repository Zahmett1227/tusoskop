/**
 * Sosyal medya görsel testleri — konu temaları dahil.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  renderSocialVisual,
  renderStoryVisual,
  renderQuestionPostSample,
} from "../src/social/visualGenerator.js";
import { renderCarousel, generateCarouselSlides } from "../src/social/carouselGenerator.js";
import { getTopicTheme } from "../src/social/design/topicThemes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "output", "social-visuals");
mkdirSync(OUT, { recursive: true });

const sampleQuestion = {
  id: 1,
  ders: "Dahiliye",
  konu: "Hepatoloji",
  q: "Kronik hepatit B izlenen hastada HBeAg pozitif ve HBV DNA çok yüksek seviyede saptanıyor. Aşağıdaki ifadelerden hangisi yanlıştır?",
  options: [
    "Nükleoz(t)id analog tedavisi önerilir.",
    "Entekavir ilk basamak tedavide kullanılabilir.",
    "Pegile interferon alfa tedavisi kesin kontrendikedir.",
    "Karaciğer biyopsisi tedavi kararı için şarttır.",
    "Tedavi yanıtı ALT ve HBV DNA ile izlenir.",
  ],
  correct: 3,
  exp: "HBeAg pozitif kronik hepatit B'de biyopsi her zaman şart değildir.",
};

const storyQuestionOptions = sampleQuestion.options.map((text, index) => ({
  letter: String.fromCharCode(65 + index),
  text,
}));

const themedCases = [
  {
    name: "theme-hepatology",
    fn: () => renderQuestionPostSample(),
    expectTheme: "hepatology",
  },
  {
    name: "theme-cardiology",
    fn: () =>
      renderSocialVisual({
        templateType: "question_post",
        ders: "Dahiliye",
        konu: "Kardiyoloji",
        hook: "Klinikte karşına çıkar",
        metaLine: "Dahiliye · Kardiyoloji",
        questionText: "Akut miyokard enfarktüsünde en erken yükselen biyobelirteç hangisidir?",
        options: [
          { letter: "A", text: "Troponin" },
          { letter: "B", text: "CK-MB" },
          { letter: "C", text: "LDH" },
          { letter: "D", text: "AST" },
          { letter: "E", text: "Myoglobin" },
        ],
      }),
    expectTheme: "cardiology",
  },
  {
    name: "theme-pharmacology",
    fn: () =>
      renderSocialVisual({
        templateType: "mini_info_post",
        ders: "Farmakoloji",
        konu: "Antihipertansifler",
        hook: "1 DAKİKADA ÖĞREN",
        subline: "ACE inhibitörleri",
        bullets: ["Öksürük en sık yan etki", "Bilateral RAS'ta kontrendike", "Hiperkalemi riski"],
      }),
    expectTheme: "pharmacology",
  },
  {
    name: "theme-pediatrics-story",
    fn: () =>
      renderStoryVisual({
        templateType: "story_question",
        ders: "Pediatri",
        konu: "Neonatoloji",
        hook: "QUIZ",
        storyVariant: "poll",
        questionText: "Prematüde NEC için en önemli risk?",
        footer: "↑ Kaydır · oy ver",
      }),
    expectTheme: "pediatrics",
  },
  {
    name: "theme-microbiology",
    fn: () =>
      renderSocialVisual({
        templateType: "mini_info_post",
        ders: "Mikrobiyoloji",
        konu: "Bakteriyoloji",
        hook: "Mini ama kritik bilgi",
        bullets: ["Grup A strep → penisilin", "Direnç nadirdir"],
      }),
    expectTheme: "microbiology",
  },
  {
    name: "story-fizyoloji-question",
    fn: () =>
      renderStoryVisual({
        templateType: "story_question",
        ders: "Fizyoloji",
        konu: "Nefron",
        questionText:
          "Aşağıdakilerden hangisi nefronun proksimal tübülünde geri emilen maddelerden biri değildir?",
        options: [
          { letter: "A", text: "Glukoz SGLT2 taşıyıcısı ile tamamen geri emilir" },
          { letter: "B", text: "Amino asitler Na+ bağımlı kotransport ile reabsorbe edilir" },
          { letter: "C", text: "Kreatinin proksimal tübülde geri emilmez, sekrete edilir" },
          { letter: "D", text: "Bikarbonat karbonik anhidraz ile geri emilir" },
        ],
      }),
    expectTheme: "physiology",
  },
  {
    name: "story-fizyoloji-answer",
    fn: () =>
      renderSocialVisual({
        templateType: "story_answer",
        ders: "Fizyoloji",
        konu: "Nefron",
        options: [
          { letter: "A", text: "Glukoz SGLT2 taşıyıcısı ile tamamen geri emilir" },
          { letter: "B", text: "Amino asitler Na+ bağımlı kotransport ile reabsorbe edilir" },
          { letter: "C", text: "Kreatinin proksimal tübülde geri emilmez, sekrete edilir" },
          { letter: "D", text: "Bikarbonat karbonik anhidraz ile geri emilir" },
        ],
        correctIndex: 2,
        correctText: "Kreatinin proksimal tübülde geri emilmez, sekrete edilir",
        explanation:
          "Kreatinin glomerüler filtrasyonla süzülür ve proksimal tübülde geri emilmez. Organik katyon taşıyıcıları ile aktif sekresyona uğrar.",
      }),
    expectTheme: "physiology",
  },
  {
    name: "story-pediatri-question",
    fn: () =>
      renderStoryVisual({
        templateType: "story_question",
        ders: "Pediatri",
        konu: "Neonatoloji",
        questionText: "Prematüre bebekte nekrotizan enterokolit için en güçlü risk faktörü hangisidir?",
        options: storyQuestionOptions,
      }),
    expectTheme: "pediatrics",
  },
  {
    name: "story-farmakoloji-question",
    fn: () =>
      renderStoryVisual({
        templateType: "story_question",
        ders: "Farmakoloji",
        konu: "Reseptörler",
        questionText: "Aşağıdaki ilaçlardan hangisi beta-2 agonist etki ile bronkodilatasyon sağlar?",
        options: storyQuestionOptions,
      }),
    expectTheme: "pharmacology",
  },
  {
    name: "story-dahiliye-nefroloji-question",
    fn: () =>
      renderStoryVisual({
        templateType: "story_question",
        ders: "Dahiliye",
        konu: "Nefroloji",
        questionText: "Akut böbrek hasarında prerenal azotemiyi düşündüren laboratuvar bulgusu hangisidir?",
        options: storyQuestionOptions,
      }),
    expectTheme: "nephrology",
  },
];

let ok = 0;
let fail = 0;

for (const tc of themedCases) {
  try {
    const result = tc.fn();
    if (!result?.svg) throw new Error("SVG yok");
    if (tc.expectTheme && result.themeId !== tc.expectTheme) {
      throw new Error(`Tema beklenen ${tc.expectTheme}, gelen ${result.themeId}`);
    }
    if (tc.name.startsWith("story-") && !result.svg.includes("/social/story-backgrounds/")) {
      throw new Error("Story arka plan gorseli baglanmadi");
    }
    writeFileSync(join(OUT, `${tc.name}.svg`), result.svg, "utf8");
    console.log(`✓ ${tc.name} → ${result.width}x${result.height} · tema: ${result.themeId}`);
    ok++;
  } catch (err) {
    console.error(`✗ ${tc.name}: ${err.message}`);
    fail++;
  }
}

try {
  const specs = generateCarouselSlides(sampleQuestion);
  const carousel = renderCarousel(specs);
  carousel.slides.forEach((slide, i) => {
    if (slide.themeId !== "hepatology") throw new Error(`Carousel tema hepatology olmalı, ${slide.themeId}`);
    const name = `carousel-hepatology-${String(i + 1).padStart(2, "0")}`;
    writeFileSync(join(OUT, `${name}.svg`), slide.svg, "utf8");
    console.log(`✓ ${name} → tema: ${slide.themeId}`);
    ok++;
  });
} catch (err) {
  console.error(`✗ carousel: ${err.message}`);
  fail++;
}

const defaultTheme = getTopicTheme({ ders: "Uzay", konu: "Genel" });
if (defaultTheme.id !== "default") {
  console.error(`✗ default theme: beklenen default, gelen ${defaultTheme.id}`);
  fail++;
} else {
  console.log("✓ default theme fallback");
  ok++;
}

console.log(`\n${ok} başarılı, ${fail} hata — ${OUT}`);
process.exit(fail > 0 ? 1 : 0);
