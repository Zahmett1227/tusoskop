import {
  APP_STORE_URL,
  commonFaq,
  homeSeo,
  QUESTION_COUNT_LABEL,
  LESSON_COUNT,
  FREE_DAILY_QUESTIONS,
  FREE_DAILY_TOPIC_TESTS,
  HERO_STATS,
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
  ["TUS Deneme Çözme Platformu", "/tus-deneme-cozme-platformu"],
  ["TUS Deneme Analizi", "/tus-deneme-analizi"],
  ["TUS Puan Hesaplama", "/tus-puan-hesaplama"],
  ["TUS Kontenjan Tablosu", "/tus-kontenjan-tablosu"],
  ["TUS Konu Bazlı Soru Çözme", "/tus-konu-bazli-soru-cozme"],
  ["TUS Yanlış Takibi", "/tus-yanlis-takibi"],
  ["TUS Çalışma Takip Sistemi", "/tus-calisma-takip-sistemi"],
  ["TUS Mobil Uygulama", "/tus-mobil-uygulama"],
  ["Tusoskop Özellikleri", "/tusoskop-ozellikleri"],
  ["Fiyatlandırma", "/fiyatlandirma"],
  ["Hakkımızda", "/hakkimizda"],
  ["Sık Sorulan Sorular", "/tusoskop-sss"],
];

// Ana sayfa statik fallback'i için kendi kendine yeten satır içi CSS.
// JS bundle'ı yüklenene kadar (curl, no-JS tarayıcı, ilk boyama) içeriğin
// stillenmiş görünmesini sağlar. React mount olunca #root içeriği PublicHome
// ile değiştirilir.
const css = `
  #seo-home,#seo-home *{box-sizing:border-box}
  #seo-home{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:#020617;color:#f8fafc;line-height:1.65}
  #seo-home a{color:inherit;text-decoration:none}
  #seo-home .topbar{position:sticky;top:0;z-index:20;border-bottom:1px solid #1e293b;background:rgba(2,6,23,.9)}
  #seo-home .wrap{max-width:1120px;margin:0 auto;padding:14px 18px}
  #seo-home .topbar .wrap{display:flex;align-items:center;justify-content:space-between;gap:18px}
  #seo-home .brand{display:flex;align-items:center;gap:10px;font-weight:900;color:#fff}
  #seo-home .brand img{width:34px;height:34px;border-radius:9px}
  #seo-home .nav{display:flex;gap:18px;align-items:center;flex-wrap:wrap;font-size:14px;font-weight:700;color:#cbd5e1}
  #seo-home .cta{display:inline-flex;align-items:center;justify-content:center;border-radius:16px;background:#6ee7b7;color:#020617;font-weight:900;padding:10px 16px}
  #seo-home h1{font-size:clamp(34px,6vw,56px);line-height:1.07;letter-spacing:-.03em;margin:14px 0 0;color:#fff}
  #seo-home h2{font-size:clamp(24px,3vw,30px);line-height:1.18;letter-spacing:-.02em;margin:0 0 14px;color:#fff}
  #seo-home h3{margin:0;font-size:18px;color:#fff}
  #seo-home p{margin:0;color:#cbd5e1}
  #seo-home .eyebrow{font-size:12px;font-weight:900;letter-spacing:.24em;text-transform:uppercase;color:#6ee7b7}
  #seo-home .lead{margin-top:22px;max-width:680px;font-size:18px}
  #seo-home .answer{margin-top:26px;border:1px solid rgba(110,231,183,.28);background:rgba(110,231,183,.1);border-radius:22px;padding:20px;color:#ecfdf5;font-size:17px}
  #seo-home section{padding:44px 0;border-top:1px solid #1e293b}
  #seo-home .stats{margin-top:22px;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}
  #seo-home .stat{border:1px solid #1e293b;background:rgba(15,23,42,.62);border-radius:18px;padding:16px;text-align:center}
  #seo-home .stat b{display:block;font-size:26px;font-weight:900;color:#6ee7b7}
  #seo-home .stat span{display:block;margin-top:4px;font-size:13px;color:#94a3b8;font-weight:700}
  #seo-home .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:8px}
  #seo-home .card{border:1px solid #1e293b;background:rgba(15,23,42,.55);border-radius:18px;padding:18px}
  #seo-home .card p{margin-top:8px;font-size:15px}
  #seo-home .links{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px}
  #seo-home .pill{border:1px solid #334155;border-radius:16px;padding:9px 13px;color:#e2e8f0;font-size:14px;font-weight:800}
  #seo-home .ctarow{margin-top:26px;display:flex;flex-wrap:wrap;gap:12px}
  #seo-home .btn{display:inline-flex;align-items:center;justify-content:center;border-radius:16px;padding:13px 22px;font-weight:900}
  #seo-home .btn-primary{background:#6ee7b7;color:#020617}
  #seo-home .btn-ghost{border:1px solid #334155;color:#fff}
  #seo-home details{border-top:1px solid #1e293b;padding:16px 0}
  #seo-home details:first-of-type{border-top:0}
  #seo-home summary{cursor:pointer;font-weight:900;color:#fff}
  #seo-home details p{margin-top:9px;font-size:15px}
  #seo-home .faqbox{margin-top:6px;border:1px solid #1e293b;background:rgba(15,23,42,.55);border-radius:22px;padding:6px 20px}
  #seo-home .footer{border-top:1px solid #1e293b;background:#020617;color:#94a3b8}
  #seo-home .footer .wrap{display:grid;gap:22px;padding-top:34px;padding-bottom:40px}
  #seo-home .footer-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;font-size:14px;font-weight:700}
  #seo-home .footer-tags{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:14px;font-weight:700;margin-top:8px}
  #seo-home .tag-title{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#64748b;margin:6px 0 0}
  @media (max-width:720px){#seo-home .nav{display:none}}
`;

/**
 * Ana sayfa (/) için gerçek DOM fallback'i. `<div id="root">` içine gömülür;
 * curl, JS'siz tarayıcı ve AI tarama botları (GPTBot, ClaudeBot, PerplexityBot)
 * bu içeriği okur. JS'li gerçek kullanıcılarda React mount olunca PublicHome
 * bu içeriğin yerini alır. Bot tespiti yoktur; herkese aynı HTML servis edilir.
 * SEO içeriği <noscript> içinde DEĞİL, normal DOM'da yer alır.
 */
export function renderHomeSeoStatic() {
  return `<div id="seo-home">
    <style>${css}</style>
    <header class="topbar">
      <div class="wrap">
        <a class="brand" href="/"><img src="/tusoskop-mark.png" alt="" width="34" height="34" /><span>Tusoskop</span></a>
        <nav class="nav" aria-label="Ana bağlantılar">
          <a href="/tusoskop-nedir">Nedir?</a>
          <a href="/tusoskop-ozellikleri">Özellikler</a>
          <a href="/tus-puan-hesaplama">Puan Hesaplama</a>
          <a href="/tus-kontenjan-tablosu">Kontenjanlar</a>
          <a href="/fiyatlandirma">Fiyatlandırma</a>
          <a href="/hakkimizda">Hakkımızda</a>
          <a href="/tusoskop-sss">SSS</a>
        </nav>
        <a class="cta" href="/giris">Giriş Yap</a>
      </div>
    </header>
    <main class="wrap">
      <section style="border-top:0;padding-top:48px">
        <p class="eyebrow">TUSOSKOP</p>
        <h1>${escapeHtml(homeSeo.h1)}</h1>
        <p class="lead">Tusoskop; TUS'a hazırlanan tıp öğrencileri ve hekimler için konu bazlı test, deneme çözümü, yanlış/favori takibi, AI çalışma planı, haftalık lig ve performans analizi sunan mobil odaklı dijital çalışma platformudur.</p>
        <div class="answer">${escapeHtml(homeSeo.answer)}</div>
        <div class="stats">
          ${HERO_STATS.map((s) => `<div class="stat"><b>${escapeHtml(s.value)}</b><span>${escapeHtml(s.label)}</span></div>`).join("")}
        </div>
        <div class="ctarow">
          <a class="btn btn-primary" href="/giris">Hemen Başla</a>
          <a class="btn btn-ghost" href="${escapeHtml(APP_STORE_URL)}">App Store'da Gör</a>
        </div>
      </section>

      <section>
        <h2>Tusoskop ile Ne Yapabilirsin?</h2>
        <div class="grid">
          ${features.map(([title, body]) => `<article class="card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></article>`).join("")}
        </div>
      </section>

      <section>
        <h2>Branşına Göre TUS Soruları</h2>
        <p>${escapeHtml(QUESTION_COUNT_LABEL)} soruyu ${LESSON_COUNT} dersten ve istediğin konudan seçerek çöz. Her branşta gerçek örnek soruları incele.</p>
        <nav class="links" aria-label="Branşa göre TUS soruları">
          ${subjectIndexLinks.map(([label, href]) => `<a class="pill" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join("")}
        </nav>
      </section>

      <section>
        <h2>Tusoskop Kimler İçin Uygun?</h2>
        <p>Tusoskop; TUS'a hazırlanan, konu çalıştıktan sonra soru çözmek isteyen, denemelerle ilerlemesini görmek isteyen ve yanlışlarını düzenli takip etmek isteyen tıp öğrencileri ve hekimler için uygundur. Ana odağı video ders değil; soru çözme, tekrar, deneme, AI destekli planlama ve analiz sürecini düzenli hale getirmektir.</p>
        <p style="margin-top:12px">iOS cihazında App Store üzerinden indirebilir, web üzerinden de kullanabilirsin. <a style="color:#6ee7b7;font-weight:800" href="${escapeHtml(APP_STORE_URL)}">Tusoskop'u App Store'da Gör</a>.</p>
      </section>

      <section>
        <h2>Sık Sorulan Sorular</h2>
        <div class="faqbox">
          ${commonFaq.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join("")}
        </div>
      </section>
    </main>
    <footer class="footer">
      <div class="wrap">
        <div>
          <strong style="color:#fff">© 2026 Tusoskop</strong>
          <p style="margin-top:6px;max-width:480px;font-size:14px">TUS hazırlığında soru çözme, deneme, tekrar, AI çalışma planı, haftalık lig ve analiz sürecini kolaylaştıran dijital platform.</p>
        </div>
        <nav class="footer-links" aria-label="Tusoskop sayfaları">
          ${seoLinks.map(([label, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join("")}
          <a href="/gizlilik-sozlesmesi">Gizlilik Sözleşmesi</a>
          <a href="/kullanim-kosullari">Kullanım Koşulları</a>
          <a href="${escapeHtml(APP_STORE_URL)}">App Store</a>
          <a href="/giris">Giriş Yap</a>
        </nav>
        <nav aria-label="Branşa göre TUS soruları">
          <p class="tag-title">Branşa göre sorular</p>
          <div class="footer-tags">
            ${subjectIndexLinks.map(([label, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(label.replace(/^TUS\s+/, "").replace(/\s+Soruları$/, ""))}</a>`).join("")}
          </div>
        </nav>
      </div>
    </footer>
  </div>`;
}
