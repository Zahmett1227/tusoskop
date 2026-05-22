/**
 * Sosyal medya görsel testleri — SVG çıktıları scripts/output/social-visuals/ altına yazar.
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
  exp: "HBeAg pozitif kronik hepatit B'de biyopsi her zaman şart değildir; klinik ve laboratuvar bulguları tedavi kararı için yeterli olabilir.",
};

const cases = [
  { name: "01-hepatitis-b-premium", fn: () => renderQuestionPostSample() },
  {
    name: "02-short-question",
    fn: () =>
      renderSocialVisual({
        templateType: "question_post",
        hook: "Farmakolojide sık hata",
        metaLine: "Farmakoloji · Antihipertansifler",
        questionText: "ACE inhibitörlerinin en sık görülen yan etkisi hangisidir?",
        options: [
          { letter: "A", text: "Öksürük" },
          { letter: "B", text: "Bradikardi" },
          { letter: "C", text: "Hiperkalemi" },
          { letter: "D", text: "Hepatotoksisite" },
          { letter: "E", text: "Nefrotoksisite" },
        ],
      }),
  },
  {
    name: "05-mini-info-bullets",
    fn: () =>
      renderSocialVisual({
        templateType: "mini_info_post",
        hook: "1 DAKİKADA ÖĞREN",
        subline: "Penisilin",
        bullets: [
          "Hücre duvarı sentez inhibitörü",
          "Grup A streptokokta direnç nadir",
          "Eksüdatif tonsillitte ilk seçenek",
        ],
      }),
  },
  {
    name: "06-feature-premium",
    fn: () =>
      renderSocialVisual({
        templateType: "feature_post",
        hook: "Zayıf konunu hedefle",
        featureTitle: "Konu Testi",
        body: "Ders seç · odaklı çöz · yanlışları tekrar et.",
        footer: "tusoskop.com",
      }),
  },
  {
    name: "07-story-poll",
    fn: () =>
      renderStoryVisual({
        templateType: "story_question",
        hook: "ANKET",
        storyVariant: "poll",
        questionText: "Bugün kaç TUS sorusu çözdün?",
        footer: "↑ Kaydır · oy ver",
      }),
  },
  {
    name: "08-answer-premium",
    fn: () =>
      renderSocialVisual({
        templateType: "answer_post",
        hook: "CEVAP AÇIKLANDI",
        subline: "Dahiliye · dünün sorusu",
        answerLine: "Doğru cevap: D) Karaciğer biyopsisi tedavi kararı için şarttır.",
        explanation: "Biyopsi her zaman şart değildir; klinik ve lab yeterli olabilir.",
      }),
  },
];

let ok = 0;
let fail = 0;

for (const tc of cases) {
  try {
    const result = tc.fn();
    if (!result?.svg || result.width < 100) throw new Error("Geçersiz SVG");
    writeFileSync(join(OUT, `${tc.name}.svg`), result.svg, "utf8");
    console.log(`✓ ${tc.name} → ${result.width}x${result.height}`);
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
    const name = `09-carousel-${String(i + 1).padStart(2, "0")}-${specs[i].slideRole}`;
    writeFileSync(join(OUT, `${name}.svg`), slide.svg, "utf8");
    console.log(`✓ ${name} → ${slide.width}x${slide.height}`);
    ok++;
  });
} catch (err) {
  console.error(`✗ carousel: ${err.message}`);
  fail++;
}

console.log(`\n${ok} başarılı, ${fail} hata — ${OUT}`);
process.exit(fail > 0 ? 1 : 0);
