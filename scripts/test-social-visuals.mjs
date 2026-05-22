/**
 * Sosyal medya görsel testleri — SVG çıktıları scripts/output/social-visuals/ altına yazar.
 * Kullanım: node scripts/test-social-visuals.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  renderSocialVisual,
  renderStoryVisual,
  renderQuestionPostSample,
} from "../src/social/visualGenerator.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "output", "social-visuals");

mkdirSync(OUT, { recursive: true });

const cases = [
  {
    name: "01-hepatitis-b-acceptance",
    fn: () => renderQuestionPostSample(),
  },
  {
    name: "02-short-question",
    fn: () =>
      renderSocialVisual({
        templateType: "question_post",
        badge: "GÜNÜN TUS SORUSU",
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
    name: "03-long-question",
    fn: () =>
      renderSocialVisual({
        templateType: "question_post",
        metaLine: "Dahiliye · Hepatoloji",
        questionText:
          "Kronik hepatit B izlenen 28 yaşındaki erkek hastada HBeAg pozitif, ALT 2× üst sınırın üzerinde ve HBV DNA 10⁸ IU/mL düzeyinde saptanıyor. Karaciğer biyopsisi yapılmadan tedavi planlanıyor. Aşağıdaki ifadelerden hangisi yanlıştır?",
        options: [
          { letter: "A", text: "Nükleoz(t)id analog tedavisi önerilir." },
          { letter: "B", text: "Entekavir ilk basamak tedavide kullanılabilir." },
          { letter: "C", text: "Pegile interferon alfa tedavisi kesin kontrendikedir." },
          { letter: "D", text: "Karaciğer biyopsisi tedavi kararı için şarttır." },
          { letter: "E", text: "Tedavi yanıtı ALT ve HBV DNA ile izlenir." },
        ],
      }),
  },
  {
    name: "04-long-options",
    fn: () =>
      renderSocialVisual({
        templateType: "question_post",
        metaLine: "Pediatri · Neonatoloji",
        questionText: "Prematü bebekte nekrotizan enterokolit gelişiminde en önemli risk faktörü hangisidir?",
        options: [
          { letter: "A", text: "Erken doğum ve enteral beslenmenin erken başlanması" },
          { letter: "B", text: "Anne sütü ile beslenmenin geciktirilmesi" },
          { letter: "C", text: "Yüksek doz vitamin K profilaksisi" },
          { letter: "D", text: "Uzun süreli fototerapi uygulaması" },
          { letter: "E", text: "Rutin antibiyotik profilaksisi" },
        ],
      }),
  },
  {
    name: "05-mini-info",
    fn: () =>
      renderSocialVisual({
        templateType: "mini_info_post",
        headline: "Mini TUS Bilgisi",
        subline: "Addison krizi",
        body: "Addison krizinde önce sıvı replasmanı, ardından glukokortikoid verilir.",
        bullets: [
          "Hipotansiyon + hiperpigmentasyon ipucu",
          "Hiponatremi ve hiperkalemi sık",
          "SIADH ile karışabilir",
        ],
      }),
  },
  {
    name: "06-feature",
    fn: () =>
      renderSocialVisual({
        templateType: "feature_post",
        featureTitle: "Konu Testi",
        hook: "Zayıf konunu hedefle, hızlı ilerle.",
        body: "Ders ve konu seçerek odaklı test çöz. Yanlışları otomatik tekrar et.",
        footer: "tusoskop.com",
      }),
  },
  {
    name: "07-story",
    fn: () =>
      renderStoryVisual({
        templateType: "story_question",
        badge: "BUGÜNÜN SORUSU",
        questionText: "Bugün kaç TUS sorusu çözdün?",
        footer: "Ankete katıl",
      }),
  },
  {
    name: "08-answer",
    fn: () =>
      renderSocialVisual({
        templateType: "answer_post",
        subline: "Dahiliye · dünün sorusu",
        answerLine: "Doğru cevap: D) Karaciğer biyopsisi tedavi kararı için şarttır.",
        explanation:
          "HBeAg pozitif kronik hepatit B'de biyopsi her zaman şart değildir; klinik ve laboratuvar bulguları tedavi kararı için yeterli olabilir.",
      }),
  },
];

let ok = 0;
let fail = 0;

for (const tc of cases) {
  try {
    const result = tc.fn();
    if (!result?.svg || result.width < 100) {
      throw new Error("Geçersiz SVG çıktısı");
    }
    const path = join(OUT, `${tc.name}.svg`);
    writeFileSync(path, result.svg, "utf8");
    console.log(`✓ ${tc.name} → ${result.width}x${result.height}`);
    ok++;
  } catch (err) {
    console.error(`✗ ${tc.name}: ${err.message}`);
    fail++;
  }
}

console.log(`\n${ok} başarılı, ${fail} hata — çıktı: ${OUT}`);
process.exit(fail > 0 ? 1 : 0);
