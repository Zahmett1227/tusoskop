/**
 * Meta reklam trafiği için "3 Soruluk TUS Mikro Denemesi" kampanya kataloğu.
 *
 * Mimari not (MVP):
 *  - Kampanya ve sorular STATİK olarak bundle edilir. Reklam trafiğinde ilk render
 *    hiçbir Firestore okumasına bağlanmaz (en hızlı ilk paint).
 *  - Ana soru bankası veya korumalı sorular public Firestore'a AÇILMAZ. Buradaki
 *    sorular yalnızca reklam kampanyalarında kullanılan, elle seçilmiş küçük bir settir.
 *  - Şema, ileride publicQuizCampaigns/{campaignCode} + publicQuizQuestions/{id}
 *    Firestore koleksiyonlarına taşımayı kolaylaştıracak biçimde tutulmuştur.
 *
 * `correctIndex` 0-tabanlıdır (ana bankadaki `correct` alanıyla aynı konvansiyon).
 *
 * Kampanya `type`:
 *  - varsayılan/`mini_deneme`: 3 soru, basit skor sonucu (mevcut Meta reklam funnel'ı)
 *  - `mini_tus`: 20 soru (10 Temel + 10 Klinik), tahmini puan + yüzdelik sonucu
 *
 * `bankId`: sorunun ANA BANKADAKİ sayısal id'si. Funnel sonuçları girişten sonra
 * hesaba işlenirken (`publicQuizImportService`) yanlış cevaplar bu sayısal id ile
 * wrongQuestions/FSRS'e eklenir — sentetik `id` (public_pat_001) ana bankada
 * çözülemez. Yeni soru eklerken bankId'yi mutlaka ana bankadan doğru al.
 */

/**
 * @typedef {Object} PublicQuizQuestion
 * @property {string} id
 * @property {number} bankId          Ana bankadaki sayısal soru id'si (import için)
 * @property {"temel"|"klinik"} [section]  Mini TUS puan hesabı için bölüm (yalnız mini_tus)
 * @property {string} questionText
 * @property {string[]} options
 * @property {number} correctIndex   0-tabanlı doğru şık indeksi
 * @property {string} explanation
 * @property {string} subject
 * @property {string} topic
 * @property {number} difficulty
 */

/**
 * @typedef {Object} PublicQuizCampaign
 * @property {string} slug            URL segmenti: /coz/:slug
 * @property {string} campaignCode    Analitik/attribution anahtarı (ör. mq_pat_01)
 * @property {string} title
 * @property {string} subject
 * @property {boolean} active
 * @property {string} appleCampaignToken  App Store Connect ct değeri
 * @property {"mini_deneme"|"mini_tus"} [type]  Akış tipi (varsayılan: mini_deneme, 3 soru)
 * @property {PublicQuizQuestion[]} questions
 */

import { MINI_TUS_QUESTIONS } from "./miniTusQuestions";

/** @type {PublicQuizCampaign[]} */
export const PUBLIC_QUIZ_CAMPAIGNS = [
  {
    slug: "mini-tus",
    campaignCode: "mq_minitus_01",
    title: "20 Soruluk Mini TUS",
    subject: "Karışık (Temel + Klinik)",
    active: true,
    type: "mini_tus",
    appleCampaignToken: "mq_minitus_01",
    questions: MINI_TUS_QUESTIONS,
  },
  {
    slug: "patoloji-01",
    campaignCode: "mq_pat_01",
    title: "3 Soruluk Patoloji Mini Denemesi",
    subject: "Patoloji",
    active: true,
    appleCampaignToken: "mq_pat_01",
    questions: [
      {
        id: "public_pat_001",
        bankId: 15,
        subject: "Patoloji",
        topic: "İnflamasyon",
        difficulty: 4,
        questionText:
          "Akut inflamasyonda lökositlerin endotelden transmigrasyonu (diapedez) aşamasında, lökositler ve endotel hücreleri üzerindeki homofilik etkileşimlerle bu geçişi sağlayan temel adezyon molekülü (CD31) aşağıdakilerden hangisidir?",
        options: ["PECAM-1", "ICAM-1", "VCAM-1", "L-Selektin", "P-Selektin"],
        correctIndex: 0,
        explanation:
          "Diapedez (transmigrasyon) sürecini yöneten temel molekül, hem lökositlerde hem de endotel hücrelerinde eksprese edilen ve homofilik bağlanma yapan PECAM-1'dir (Platelet Endothelial Cell Adhesion Molecule-1, CD31). ICAM ve VCAM sıkı tutunmada (adezyonda) rol oynar.",
      },
      {
        id: "public_pat_002",
        bankId: 18,
        subject: "Patoloji",
        topic: "Hemodinamik Bozukluklar",
        difficulty: 4,
        questionText:
          "Kalıtsal trombofililerin en sık nedeni olan ve Aktif Protein C'nin inaktivasyon etkisine karşı direnç göstererek venöz tromboz riskini belirgin şekilde artıran mutasyon aşağıdakilerden hangisidir?",
        options: [
          "Protrombin G20210A mutasyonu",
          "Faktör V Leiden mutasyonu",
          "Antitrombin III eksikliği",
          "Protein S eksikliği",
          "MTHFR gen mutasyonu",
        ],
        correctIndex: 1,
        explanation:
          "Faktör V Leiden mutasyonu, Faktör V molekülünde spesifik bir aminoasit değişikliğine yol açarak onun Aktif Protein C (APC) tarafından yıkılmasını engeller. Bu 'APC direnci', pıhtılaşma kaskadının frenlenememesine ve hiperkoagülabiliteye neden olur.",
      },
      {
        id: "public_pat_003",
        bankId: 19,
        subject: "Patoloji",
        topic: "Neoplazi",
        difficulty: 5,
        questionText:
          "Hücre siklusunun G1'den S fazına geçişini kontrol eden ve hipofosforile (aktif) durumdayken E2F transkripsiyon faktörüne sıkıca bağlanarak onu inhibe eden 'Hücre siklusunun valisi' olarak adlandırılan tümör süpresör gen aşağıdakilerden hangisidir?",
        options: ["p53", "Rb", "BRCA1", "APC", "PTEN"],
        correctIndex: 1,
        explanation:
          "Retinoblastom (Rb) geni, hücre döngüsünde kritik bir kontrol noktasıdır. Aktif (hipofosforile) Rb, E2F'ye bağlanarak DNA sentezi için gereken genlerin transkripsiyonunu durdurur. CDK'lar tarafından hiperfosforile edildiğinde ise E2F serbest kalır ve hücre S fazına geçer.",
      },
    ],
  },
];

const BY_SLUG = new Map(
  PUBLIC_QUIZ_CAMPAIGNS.map((campaign) => [campaign.slug, campaign])
);

/**
 * URL path'inden mikro deneme slug'ını çıkarır: "/coz/patoloji-01" -> "patoloji-01".
 * @param {string} pathname
 * @returns {string|null}
 */
export function getPublicQuizSlugFromPath(pathname) {
  if (!pathname) return null;
  const match = /^\/coz\/([^/?#]+)/i.exec(pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]).trim().toLowerCase();
  } catch {
    return String(match[1]).trim().toLowerCase();
  }
}

/**
 * @param {string} slug
 * @returns {PublicQuizCampaign|null}
 */
export function getPublicQuizCampaignBySlug(slug) {
  if (!slug) return null;
  return BY_SLUG.get(String(slug).trim().toLowerCase()) || null;
}
