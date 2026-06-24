import {
  APP_STORE_URL,
  commonFaq,
  homeSeo,
  QUESTION_COUNT_LABEL,
  LESSON_COUNT,
  FREE_DAILY_QUESTIONS,
  FREE_DAILY_TOPIC_TESTS,
  subjectIndexLinks,
} from "../src/seo/seoContent.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const features = [
  [
    `${QUESTION_COUNT_LABEL} Soruyu Konu Konu Çöz`,
    `${LESSON_COUNT} dersten ve istediğin konudan seçerek yüksek kaliteli, TUS tarzı sorular çöz; çalıştığın konuyu hemen sına.`,
  ],
  ["Deneme Çöz", "TUS hazırlık sürecinde dijital denemelerle performansını ölç, neti zamanla takip et."],
  [
    "Akıllı Tekrar (FSRS)",
    "Yanlış yaptığın soruyu, beynin tam unutmaya başladığı anda bilimsel aralıklı tekrarla yeniden karşına çıkarırız.",
  ],
  [
    `Günde ${FREE_DAILY_QUESTIONS} Soru Ücretsiz`,
    `Free planda her gün ${FREE_DAILY_QUESTIONS} soru ve ${FREE_DAILY_TOPIC_TESTS} konu testi ücretsiz; nöbet arasında telefonundan çöz.`,
  ],
  ["AI Çalışma Planı", "Yapay zeka eksik konularını bulup sana günlük çalışma planı çıkarır."],
  ["Haftalık Ligde Yarış", "Binlerce TUS adayıyla aynı ligde yarış, haftalık sıralamada yüksel."],
];

const seoLinks = [
  ["Tusoskop Nedir?", "/tusoskop-nedir"],
  ["TUS Hazırlık Platformu", "/tus-hazirlik-platformu"],
  ["TUS Soru Çözme Uygulaması", "/tus-soru-cozme-uygulamasi"],
  ["TUS Deneme Analizi", "/tus-deneme-analizi"],
  ["TUS Konu Bazlı Soru Çözme", "/tus-konu-bazli-soru-cozme"],
  ["TUS Yanlış Takibi", "/tus-yanlis-takibi"],
  ["Tusoskop Özellikleri", "/tusoskop-ozellikleri"],
  ["Fiyatlandırma", "/tusoskop-fiyatlandirma"],
  ["Sık Sorulan Sorular", "/tusoskop-sss"],
];

/**
 * JS çalıştırmayan tarayıcılar ve AI tarama botları (GPTBot, ClaudeBot,
 * PerplexityBot vb.) için ana sayfa içeriği. JS'li gerçek kullanıcılar bu
 * bloğu hiç görmez — React mount olunca sade giriş ekranı render edilir.
 * Bot tespiti yoktur; herkese aynı HTML servis edilir.
 */
export function renderHomeSeoNoscript() {
  return `<noscript>
    <main>
      <h1>${escapeHtml(homeSeo.h1)}</h1>
      <p>${escapeHtml(homeSeo.answer)}</p>
      <p>Tusoskop; TUS'a hazırlanan tıp öğrencileri ve hekimler için konu bazlı test, deneme çözümü, yanlış/favori takibi, AI çalışma planı, haftalık lig ve performans analizi sunan mobil odaklı dijital çalışma platformudur.</p>
      <section>
        <h2>Tusoskop ile Ne Yapabilirsin?</h2>
        <ul>
          ${features.map(([title, body]) => `<li><strong>${escapeHtml(title)}:</strong> ${escapeHtml(body)}</li>`).join("\n          ")}
        </ul>
      </section>
      <section>
        <h2>Tusoskop Kimler İçin Uygun?</h2>
        <p>Tusoskop; TUS'a hazırlanan, konu çalıştıktan sonra soru çözmek isteyen, denemelerle ilerlemesini görmek isteyen ve yanlışlarını düzenli takip etmek isteyen tıp öğrencileri ve hekimler için uygundur. Ana odağı video ders değil; soru çözme, tekrar, deneme, AI destekli planlama ve analiz sürecini düzenli hale getirmektir.</p>
        <p>iOS cihazında App Store üzerinden indirebilir, web üzerinden de kullanabilirsin. <a href="${APP_STORE_URL}">Tusoskop'u App Store'da Gör</a>.</p>
      </section>
      <section>
        <h2>Sık Sorulan Sorular</h2>
        ${commonFaq.map((item) => `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`).join("\n        ")}
      </section>
      <nav aria-label="Tusoskop sayfaları">
        <h2>Tusoskop Sayfaları</h2>
        <ul>
          ${seoLinks.map(([label, href]) => `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`).join("\n          ")}
        </ul>
      </nav>
      <nav aria-label="Branşa göre TUS soruları">
        <h2>Branşa Göre TUS Soruları</h2>
        <ul>
          ${subjectIndexLinks.map(([label, href]) => `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`).join("\n          ")}
        </ul>
      </nav>
    </main>
  </noscript>`;
}
