import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  APP_STORE_URL,
  BRAND_NAME,
  LASTMOD,
  OG_IMAGE,
  SITE_URL,
  commonFaq,
  homeSeo,
  legalStaticPages,
  pageUrl,
  seoPages,
  sitemapEntries,
  subjectIndexLinks,
} from "../src/seo/seoContent.js";
import {
  TUS_SCORE_ANCHORS,
  TUS_SECTION_QUESTIONS,
  TUS_DEDUCTION_RATE,
  MAX_MODEL_SCORE,
} from "../src/seo/tusScoring.js";

const publicDir = path.resolve("public");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function jsonLd(page, pagePath, faq = []) {
  const url = pageUrl(pagePath);
  const graph = [
    {
      "@type": "Organization",
      name: BRAND_NAME,
      url: SITE_URL,
      logo: OG_IMAGE,
      sameAs: [APP_STORE_URL],
    },
    {
      "@type": "WebSite",
      name: BRAND_NAME,
      url: SITE_URL,
      inLanguage: "tr-TR",
    },
    {
      "@type": "SoftwareApplication",
      name: BRAND_NAME,
      applicationCategory: "EducationalApplication",
      operatingSystem: "iOS, Web",
      description: homeSeo.answer,
      url: SITE_URL,
      sameAs: [APP_STORE_URL],
      offers: {
        "@type": "Offer",
        priceCurrency: "TRY",
        availability: "https://schema.org/InStock",
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Ana sayfa",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: page.h1,
          item: url,
        },
      ],
    },
  ];

  // FAQPage şemasını yalnızca sayfada görünen sorular varsa ekle —
  // böylece JSON-LD sayfadaki içerikle birebir hizalı kalır.
  if (faq.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

const css = `
  *,*::before,*::after{box-sizing:border-box}
  html{background:#020617;color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}
  body{margin:0;background:#020617;color:#f8fafc;line-height:1.65;-webkit-font-smoothing:antialiased}
  a{color:inherit;text-decoration:none}
  .topbar{position:sticky;top:0;z-index:20;border-bottom:1px solid #1e293b;background:rgba(2,6,23,.9);backdrop-filter:blur(18px)}
  .topbar-inner{max-width:1120px;margin:0 auto;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:18px}
  .brand{display:flex;align-items:center;gap:10px;font-weight:900;color:#fff}
  .brand img{width:36px;height:36px;border-radius:10px}
  .nav{display:flex;gap:18px;align-items:center;flex-wrap:wrap;font-size:14px;font-weight:750;color:#cbd5e1}
  .nav a:hover,.footer a:hover{color:#fff}
  .cta{display:inline-flex;align-items:center;justify-content:center;border-radius:16px;background:#6ee7b7;color:#020617;font-weight:900;padding:10px 16px}
  main{max-width:900px;margin:0 auto;padding:54px 18px}
  .eyebrow{font-size:12px;font-weight:900;letter-spacing:.24em;text-transform:uppercase;color:#6ee7b7}
  h1{font-size:clamp(36px,6vw,56px);line-height:1.08;letter-spacing:-.03em;margin:16px 0 0;color:#fff}
  h2{font-size:clamp(24px,3vw,32px);line-height:1.18;letter-spacing:-.02em;margin:0 0 12px;color:#fff}
  p{margin:0;color:#cbd5e1}
  .answer{margin-top:28px;border:1px solid rgba(110,231,183,.28);background:rgba(110,231,183,.1);border-radius:22px;padding:20px;color:#ecfdf5;font-size:17px}
  .stats{margin-top:22px;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}
  .stat{border:1px solid #1e293b;background:rgba(15,23,42,.62);border-radius:18px;padding:16px;text-align:center}
  .stat b{display:block;font-size:26px;font-weight:900;color:#6ee7b7;letter-spacing:-.02em}
  .stat span{display:block;margin-top:4px;font-size:13px;color:#94a3b8;font-weight:700}
  .qcard{margin-top:30px;border:1px solid #1e293b;background:rgba(15,23,42,.62);border-radius:24px;padding:22px}
  .qcard .badge{display:inline-block;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#020617;background:#6ee7b7;border-radius:999px;padding:5px 11px}
  .qcard .qkonu{margin-left:8px;font-size:13px;font-weight:800;color:#94a3b8}
  .qcard .qtext{margin-top:14px;font-size:17px;font-weight:750;color:#f8fafc;line-height:1.5}
  .qopts{margin-top:16px;display:grid;gap:9px}
  .qopt{display:flex;gap:10px;align-items:flex-start;border:1px solid #334155;border-radius:14px;padding:11px 13px;font-size:15px;color:#e2e8f0}
  .qopt .qkey{font-weight:900;color:#94a3b8;flex:0 0 auto}
  .qopt.correct{border-color:#6ee7b7;background:rgba(110,231,183,.12);color:#ecfdf5}
  .qopt.correct .qkey{color:#6ee7b7}
  .qexp{margin-top:16px;border-top:1px solid #1e293b;padding-top:14px}
  .qexp strong{color:#6ee7b7;font-weight:900}
  .qexp p{margin-top:6px;font-size:15px}
  .sections{margin-top:44px;display:grid;gap:34px}
  .section{border-bottom:1px solid #1e293b;padding-bottom:28px}
  .section:last-child{border-bottom:0}
  .section p+p{margin-top:12px}
  .related,.faq{margin-top:38px;border:1px solid #1e293b;background:rgba(15,23,42,.62);border-radius:26px;padding:20px}
  .link-list{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
  .pill{border:1px solid #334155;border-radius:16px;padding:9px 13px;color:#e2e8f0;font-size:14px;font-weight:800}
  .pill:hover{border-color:#6ee7b7}
  details{border-top:1px solid #1e293b;padding:16px 0}
  details:first-of-type{border-top:0}
  summary{cursor:pointer;font-weight:900;color:#fff}
  details p{margin-top:9px;font-size:15px}
  .appstore{display:inline-flex;margin-top:16px;border:1px solid #334155;background:#000;border-radius:16px;padding:10px 14px;font-weight:900}
  .footer{border-top:1px solid #1e293b;background:#020617;color:#94a3b8}
  .footer-inner{max-width:1120px;margin:0 auto;padding:36px 18px;display:grid;gap:28px}
  .footer p{font-size:14px;max-width:480px}
  .footer-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;font-size:14px;font-weight:750}
  .footer-tags-title{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#64748b;margin:6px 0 8px}
  .footer-tags{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:14px;font-weight:750}
  .topics{margin-top:30px}
  .topics h2{margin-bottom:8px}
  .topic-chips{list-style:none;margin:14px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
  .topic-chips li{border:1px solid #334155;background:rgba(15,23,42,.55);border-radius:16px;padding:8px 13px;font-size:14px;font-weight:800;color:#e2e8f0}
  .calc{margin-top:30px;border:1px solid #1e293b;background:rgba(15,23,42,.62);border-radius:24px;padding:22px}
  .calc-grid{display:grid;gap:14px;grid-template-columns:1fr 1fr}
  .calc-sec{border:1px solid #1e293b;background:rgba(2,6,23,.5);border-radius:18px;padding:16px}
  .calc-sec h3{margin:0;font-size:15px;color:#fff}
  .calc-sec .net{float:right;font-size:14px;font-weight:800;color:#6ee7b7}
  .calc-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
  .calc-field label{display:block;font-size:13px;font-weight:700;color:#cbd5e1;margin-bottom:6px}
  .calc-field input{width:100%;border:1px solid #334155;background:#020617;color:#fff;border-radius:14px;padding:11px 13px;font-size:16px;font-weight:700;outline:none}
  .calc-field input:focus{border-color:#6ee7b7}
  .calc-out{display:grid;grid-template-columns:1fr 2fr;gap:12px;margin-top:16px}
  .calc-box{border:1px solid #1e293b;background:#020617;border-radius:16px;padding:14px;text-align:center}
  .calc-box.hi{border-color:rgba(110,231,183,.4);background:rgba(110,231,183,.1)}
  .calc-box small{display:block;font-size:12px;font-weight:700;color:#94a3b8}
  .calc-box.hi small{color:#a7f3d0}
  .calc-box b{display:block;margin-top:4px;font-size:22px;font-weight:900;color:#fff}
  .calc-box.hi b{font-size:30px;color:#6ee7b7}
  .calc-box .band{display:block;margin-top:4px;font-size:12px;font-weight:700;color:#a7f3d0}
  .calc-note{margin-top:14px;font-size:13px;color:#94a3b8}
  .calc-blank{margin-top:10px;font-size:12px;font-weight:700;color:#94a3b8}
  .calc-overflow{margin-top:4px;font-size:12px;font-weight:800;color:#fb7185}
  .calc-toggle{margin-top:18px;width:100%;display:flex;align-items:center;justify-content:space-between;gap:14px;border:1px solid rgba(252,211,77,.35);background:rgba(252,211,77,.1);border-radius:18px;padding:13px 16px;cursor:pointer;text-align:left;font:inherit;color:inherit}
  .calc-toggle .ttl{font-size:14px;font-weight:900;color:#fde68a}
  .calc-toggle .desc{display:block;margin-top:2px;font-size:12px;font-weight:600;color:rgba(253,230,138,.8)}
  .calc-switch{position:relative;flex:0 0 auto;width:48px;height:28px;border-radius:999px;background:#334155;transition:background .15s}
  .calc-switch.on{background:#34d399}
  .calc-switch i{position:absolute;top:2px;left:2px;width:24px;height:24px;border-radius:999px;background:#fff;transition:transform .15s}
  .calc-switch.on i{transform:translateX(20px)}
  .calc-raw{margin-top:4px;font-size:11px;font-weight:700;color:rgba(110,231,183,.65)}
  .ref-table,.kontenjan-table{margin-top:24px;overflow-x:auto;border:1px solid #1e293b;border-radius:20px}
  .ref-table table,.kontenjan-table table{width:100%;border-collapse:collapse;font-size:14px}
  .ref-table thead tr,.kontenjan-table thead tr{background:rgba(15,23,42,.7);text-align:left;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8}
  .ref-table th,.ref-table td,.kontenjan-table th,.kontenjan-table td{padding:11px 15px}
  .kontenjan-table th{cursor:pointer;user-select:none}
  .ref-table tbody tr,.kontenjan-table tbody tr{border-top:1px solid #1e293b}
  .ref-table td:first-child,.kontenjan-table td:first-child{font-weight:800;color:#e2e8f0}
  .ref-table td:nth-child(2){font-weight:900;color:#6ee7b7}
  .kontenjan-table td.puan{font-weight:900;color:#6ee7b7}
  .ref-note{border-top:1px solid #1e293b;padding:10px 15px;font-size:12px;color:#64748b}
  .reverse-box{margin-top:32px;border:1px solid #1e293b;background:rgba(2,6,23,.5);border-radius:18px;padding:20px}
  .reverse-box h3{margin:0;font-size:16px;color:#fff}
  .reverse-box .hint{margin-top:6px;font-size:12px;color:#94a3b8}
  .reverse-row{margin-top:14px;display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px}
  .reverse-field label{display:block;font-size:13px;font-weight:700;color:#cbd5e1;margin-bottom:6px}
  .reverse-field input{width:160px;border:1px solid #334155;background:#0f172a;color:#fff;border-radius:14px;padding:11px 13px;font-size:16px;font-weight:700;outline:none}
  .reverse-out{border:1px solid #1e293b;background:rgba(15,23,42,.62);border-radius:14px;padding:11px 16px}
  .reverse-out small{display:block;font-size:12px;font-weight:700;color:#94a3b8}
  .reverse-out b{display:block;margin-top:2px;font-size:20px;font-weight:900;color:#fff}
  .reverse-warn{margin-top:10px;font-size:12px;font-weight:700;color:#fbbf24}
  .kontenjan-search{width:100%;max-width:360px;border:1px solid #334155;background:#020617;color:#fff;border-radius:16px;padding:10px 15px;font-size:14px;font-weight:700;outline:none}
  .kontenjan-search:focus{border-color:#6ee7b7}
  .kontenjan-meta{margin-top:10px;font-size:12px;font-weight:700;color:#64748b}
  @media (max-width:560px){.calc-grid{grid-template-columns:1fr}.calc-out{grid-template-columns:1fr}}
  @media (max-width:720px){.nav{display:none}main{padding-top:38px}.topbar-inner{padding-inline:14px}}
`;

const footerLinks = [
  ["Tusoskop Nedir?", "/tusoskop-nedir"],
  ["TUS Hazırlık Platformu", "/tus-hazirlik-platformu"],
  ["TUS Soru Çözme Uygulaması", "/tus-soru-cozme-uygulamasi"],
  ["TUS Deneme Analizi", "/tus-deneme-analizi"],
  ["TUS Puan Hesaplama", "/tus-puan-hesaplama"],
  ["TUS Kontenjan Tablosu", "/tus-kontenjan-tablosu"],
  ["Tusoskop Özellikleri", "/tusoskop-ozellikleri"],
  ["Fiyatlandırma", "/fiyatlandirma"],
  ["Hakkımızda", "/hakkimizda"],
  ["Sık Sorulan Sorular", "/tusoskop-sss"],
  ["Gizlilik Sözleşmesi", "/gizlilik-sozlesmesi"],
  ["Kullanım Koşulları", "/kullanim-kosullari"],
  ["App Store", APP_STORE_URL],
  ["Giriş Yap", "/giris"],
];

function renderHeader() {
  return `
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="/">
          <img src="/tusoskop-mark.png" alt="" width="36" height="36" />
          <span>Tusoskop</span>
        </a>
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
    </header>`;
}

function renderFooter() {
  return `
    <footer class="footer">
      <div class="footer-inner">
        <div>
          <strong style="color:#fff">© 2026 Tusoskop</strong>
          <p>TUS hazırlığında soru çözme, deneme, AI çalışma planı, haftalık lig ve analiz sürecini destekleyen dijital platform.</p>
        </div>
        <nav class="footer-links" aria-label="Footer bağlantıları">
          ${footerLinks.map(([label, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join("")}
        </nav>
        <nav aria-label="Branşa göre TUS soruları">
          <p class="footer-tags-title">Branşa göre sorular</p>
          <div class="footer-tags">
            ${subjectIndexLinks.map(([label, href]) => `<a href="${escapeHtml(href)}">${escapeHtml(label.replace(/^TUS\s+/, "").replace(/\s+Soruları$/, ""))}</a>`).join("")}
          </div>
        </nav>
      </div>
    </footer>`;
}

const OPTION_KEYS = ["A", "B", "C", "D", "E"];

function renderStats(stats) {
  if (!stats?.length) return "";
  return `<div class="stats">
    ${stats.map((s) => `<div class="stat"><b>${escapeHtml(s.value)}</b><span>${escapeHtml(s.label)}</span></div>`).join("")}
  </div>`;
}

function renderTopics(subject, topics) {
  if (!topics?.length) return "";
  return `<section class="topics" aria-label="${escapeHtml(subject)} konuları">
    <h2>${escapeHtml(subject)} konuları</h2>
    <p>Tusoskop'ta ${escapeHtml(subject)} dersini şu konulara ayırarak konu konu çözebilirsin:</p>
    <ul class="topic-chips">
      ${topics.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}
    </ul>
  </section>`;
}

function renderSample(sample, subject) {
  if (!sample) return "";
  const options = sample.options
    .map((opt, index) => {
      const isCorrect = index === sample.correct;
      return `<li class="qopt${isCorrect ? " correct" : ""}"><span class="qkey">${OPTION_KEYS[index] ?? index + 1}</span><span>${escapeHtml(opt)}</span></li>`;
    })
    .join("");
  return `<section class="qcard" aria-label="Örnek soru">
    <span class="badge">Örnek Soru</span><span class="qkonu">${escapeHtml(subject)} · ${escapeHtml(sample.konu)}</span>
    <p class="qtext">${escapeHtml(sample.q)}</p>
    <ul class="qopts">${options}</ul>
    <div class="qexp"><strong>Doğru cevap: ${OPTION_KEYS[sample.correct]}</strong><p>${escapeHtml(sample.exp)}</p></div>
  </section>`;
}

// TUS puan hesaplama aracı — statik HTML + satır-içi vanilla JS.
// React hesaplayıcısıyla (PublicSeoPages.jsx) aynı çapa tablosunu (tusScoring.js)
// kullanır; production'da bu statik sürüm servis edilir.
function renderScoreTool() {
  const anchors = JSON.stringify(TUS_SCORE_ANCHORS);
  const refRows = TUS_SCORE_ANCHORS.map(
    ([net, score]) => `<tr><td>${net}</td><td>${score}</td></tr>`
  ).join("");
  return `<section class="calc" aria-label="TUS puan hesaplama aracı">
      <div class="calc-grid">
        <div class="calc-sec">
          <h3>Temel Tıp Bilimleri <span class="net">Net: <span id="temel-net">0</span></span></h3>
          <div class="calc-row">
            <div class="calc-field"><label for="td">Doğru</label><input id="td" type="number" inputmode="numeric" min="0" max="${TUS_SECTION_QUESTIONS}" placeholder="0" /></div>
            <div class="calc-field"><label for="ty">Yanlış</label><input id="ty" type="number" inputmode="numeric" min="0" max="${TUS_SECTION_QUESTIONS}" placeholder="0" /></div>
          </div>
          <p class="calc-blank">Boş: <span id="temel-blank">${TUS_SECTION_QUESTIONS}</span> / ${TUS_SECTION_QUESTIONS}</p>
          <p class="calc-overflow" id="temel-overflow" style="display:none">Bu bölümde en fazla ${TUS_SECTION_QUESTIONS} soru olabilir.</p>
        </div>
        <div class="calc-sec">
          <h3>Klinik Tıp Bilimleri <span class="net">Net: <span id="klinik-net">0</span></span></h3>
          <div class="calc-row">
            <div class="calc-field"><label for="kd">Doğru</label><input id="kd" type="number" inputmode="numeric" min="0" max="${TUS_SECTION_QUESTIONS}" placeholder="0" /></div>
            <div class="calc-field"><label for="ky">Yanlış</label><input id="ky" type="number" inputmode="numeric" min="0" max="${TUS_SECTION_QUESTIONS}" placeholder="0" /></div>
          </div>
          <p class="calc-blank">Boş: <span id="klinik-blank">${TUS_SECTION_QUESTIONS}</span> / ${TUS_SECTION_QUESTIONS}</p>
          <p class="calc-overflow" id="klinik-overflow" style="display:none">Bu bölümde en fazla ${TUS_SECTION_QUESTIONS} soru olabilir.</p>
        </div>
      </div>

      <button type="button" class="calc-toggle" id="kesinti-toggle" role="switch" aria-checked="false">
        <span>
          <span class="ttl" title="Daha önce bir TUS ile uzmanlık/yan dal eğitimine yerleşip devam etmemiş adaylara ÖSYM tarafından uygulanan kesinti.">%5 Puan Kesintisi ⓘ</span>
          <span class="desc">Daha önce TUS ile yerleşip devam etmemiş adaylar için geçerli</span>
        </span>
        <span class="calc-switch" id="kesinti-switch" aria-hidden="true"><i></i></span>
      </button>

      <div class="calc-out">
        <div class="calc-box"><small>Toplam Net</small><b id="toplam-net">0</b></div>
        <div class="calc-box hi">
          <small id="puan-label">Tahmini TUS Puanı</small>
          <b id="tahmini-puan">—</b>
          <span class="band" id="puan-band">Doğru ve yanlış sayını gir</span>
          <span class="calc-raw" id="puan-ham" style="display:none"></span>
        </div>
      </div>
      <p class="calc-note">Sonuç tahminidir. Net = doğru − yanlış/4. Gerçek TUS puanı ÖSYM'nin ilgili dönemdeki ortalama ve standart sapmasına göre standardize edilir.</p>

      <div class="ref-table" aria-label="Net - tahmini puan referans tablosu">
        <table>
          <thead><tr><th>Toplam Net</th><th>Tahmini TUS Puanı</th></tr></thead>
          <tbody>${refRows}</tbody>
        </table>
        <p class="ref-note">Ara değerler için hesaplayıcı doğrusal aradeğerleme kullanır.</p>
      </div>

      <div class="reverse-box">
        <h3>Hedef puana kaç net gerekir?</h3>
        <p class="hint" id="reverse-hint">Ulaşmak istediğin tahmini TUS puanını gir; yaklaşık gereken toplam neti hesaplayalım.</p>
        <div class="reverse-row">
          <div class="reverse-field"><label for="hedef-puan">Hedef Puan</label><input id="hedef-puan" type="number" inputmode="decimal" min="0" max="100" placeholder="örn. 65" /></div>
          <div class="reverse-out"><small>Gereken Toplam Net</small><b id="gerekli-net">—</b></div>
        </div>
        <p class="reverse-warn" id="reverse-warn" style="display:none"></p>
      </div>

      <script>
        (function(){
          var ANCHORS=${anchors},SEC=${TUS_SECTION_QUESTIONS},RATE=${TUS_DEDUCTION_RATE},MAXS=${MAX_MODEL_SCORE};
          var kesinti=false;
          function r1(x){return Math.round(x*10)/10;}
          function net(c,w){var n=(Number(c)||0)-(Number(w)||0)/4;return n>0?r1(n):0;}
          function blank(c,w){var b=SEC-(Number(c)||0)-(Number(w)||0);return b>=0?b:0;}
          function overflow(c,w){return (Number(c)||0)+(Number(w)||0)>SEC;}
          function est(n){n=Number(n);if(!isFinite(n)||n<=0)return 0;var f=ANCHORS[0],l=ANCHORS[ANCHORS.length-1];if(n<=f[0])return r1(f[1]*n/f[0]);if(n>=l[0])return l[1];for(var i=0;i<ANCHORS.length-1;i++){var a=ANCHORS[i],b=ANCHORS[i+1];if(n>=a[0]&&n<=b[0]){var t=(n-a[0])/(b[0]-a[0]);return r1(a[1]+t*(b[1]-a[1]));}}return l[1];}
          function netForScore(s){s=Number(s);if(!isFinite(s)||s<=0)return 0;var f=ANCHORS[0],l=ANCHORS[ANCHORS.length-1];if(s<=f[1])return r1(f[0]*s/f[1]);if(s>=l[1])return l[0];for(var i=0;i<ANCHORS.length-1;i++){var a=ANCHORS[i],b=ANCHORS[i+1];if(s>=a[1]&&s<=b[1]){var t=(s-a[1])/(b[1]-a[1]);return r1(a[0]+t*(b[0]-a[0]));}}return l[0];}
          function deduct(s,active){s=Number(s)||0;return active?r1(s*(1-RATE)):s;}
          function band(s){s=Number(s)||0;if(s>=68)return"Yüksek · Rekabetçi branşlar için güçlü bir aralık.";if(s>=60)return"İyi · Birçok branş için yeterli; netlerini biraz daha yükselt.";if(s>=54)return"Orta · Temel ve klinik açıklarını kapatmaya odaklan.";return"Geliştirilmeli · Düzenli soru çözümü ve tekrarla net artışı hedefle.";}
          function cap(el){var x=el.value.replace(/[^0-9]/g,'');if(x!=='')x=String(Math.min(Number(x),SEC));el.value=x;return x;}
          var td=document.getElementById('td'),ty=document.getElementById('ty'),kd=document.getElementById('kd'),ky=document.getElementById('ky');
          var tOverflowEl=document.getElementById('temel-overflow'),kOverflowEl=document.getElementById('klinik-overflow');
          var toggleBtn=document.getElementById('kesinti-toggle'),switchEl=document.getElementById('kesinti-switch');
          var hedefEl=document.getElementById('hedef-puan'),hintEl=document.getElementById('reverse-hint'),warnEl=document.getElementById('reverse-warn');
          var lastScore=0;
          function upd(){
            var tc=cap(td),tw=cap(ty),kc=cap(kd),kw=cap(ky);
            var tn=net(tc,tw),kn=net(kc,kw),sum=r1(tn+kn);
            document.getElementById('temel-net').textContent=tn;
            document.getElementById('klinik-net').textContent=kn;
            document.getElementById('toplam-net').textContent=sum;
            document.getElementById('temel-blank').textContent=blank(tc,tw);
            document.getElementById('klinik-blank').textContent=blank(kc,kw);
            tOverflowEl.style.display=overflow(tc,tw)?'block':'none';
            kOverflowEl.style.display=overflow(kc,kw)?'block':'none';
            var has=td.value||ty.value||kd.value||ky.value;
            var rawScore=est(sum);
            lastScore=rawScore;
            var shown=kesinti?deduct(rawScore,true):rawScore;
            document.getElementById('puan-label').textContent=kesinti?'Tahmini TUS Puanı (−%5 kesintili)':'Tahmini TUS Puanı';
            document.getElementById('tahmini-puan').textContent=has?shown:'—';
            document.getElementById('puan-band').textContent=has?band(shown):'Doğru ve yanlış sayını gir';
            var hamEl=document.getElementById('puan-ham');
            if(has&&kesinti){hamEl.style.display='block';hamEl.textContent='Ham puan: '+rawScore;}else{hamEl.style.display='none';}
            updReverse();
          }
          function updReverse(){
            hintEl.textContent='Ulaşmak istediğin tahmini TUS puanını gir; yaklaşık gereken toplam neti hesaplayalım'+(kesinti?' (kesinti anahtarı açıkken hedefin kesinti sonrası puan olarak alındığı varsayılır).':'.');
            var raw=hedefEl.value.replace(/[^0-9.]/g,'');
            if(raw!==hedefEl.value)hedefEl.value=raw;
            var s=Number(raw);
            var valid=raw!==''&&isFinite(s)&&s>0;
            var effective=valid&&kesinti?s/(1-RATE):s;
            var unreachable=valid&&effective>MAXS;
            document.getElementById('gerekli-net').textContent=valid?(unreachable?(MAXS+'+'):netForScore(effective)):'—';
            warnEl.style.display=unreachable?'block':'none';
            if(unreachable)warnEl.textContent='Bu modelde ulaşılabilecek azami tahmini puan '+MAXS+'\\'dir. Daha yüksek hedefler gerçek dönem istatistiklerine göre değişir.';
          }
          toggleBtn.addEventListener('click',function(){
            kesinti=!kesinti;
            toggleBtn.setAttribute('aria-checked',String(kesinti));
            switchEl.className='calc-switch'+(kesinti?' on':'');
            upd();
          });
          [td,ty,kd,ky].forEach(function(el){el.addEventListener('input',upd);});
          hedefEl.addEventListener('input',updReverse);
          upd();
        })();
      </script>
    </section>`;
}

// TUS kontenjan tablosu — sıralanabilir/aranabilir statik tablo + satır-içi JS.
function renderKontenjanTable(data, donem) {
  const rows = data
    .map(
      (r) =>
        `<tr data-dal="${escapeHtml(r.dal.toLocaleLowerCase("tr"))}" data-kontenjan="${r.kontenjan}" data-taban="${r.tabanPuan ?? -1}" data-yerlesen="${r.yerlesen}">` +
        `<td>${escapeHtml(r.dal)}</td><td>${r.kontenjan}</td><td class="puan">${r.tabanPuan != null ? r.tabanPuan : "—"}</td><td>${r.yerlesen}</td></tr>`
    )
    .join("");
  return `<section aria-label="TUS kontenjan tablosu" style="margin-top:30px">
      <input type="text" id="kontenjan-search" class="kontenjan-search" placeholder="Uzmanlık dalı ara…" />
      <p class="kontenjan-meta">${escapeHtml(donem)} · <span id="kontenjan-count">${data.length}</span> dal</p>
      <div class="kontenjan-table">
        <table>
          <thead>
            <tr>
              <th data-key="dal" data-type="str">Uzmanlık Dalı</th>
              <th data-key="kontenjan" data-type="num">Kontenjan</th>
              <th data-key="taban" data-type="num">Taban Puan</th>
              <th data-key="yerlesen" data-type="num">Yerleşen</th>
            </tr>
          </thead>
          <tbody id="kontenjan-body">${rows}</tbody>
        </table>
      </div>
      <script>
        (function(){
          var search=document.getElementById('kontenjan-search');
          var body=document.getElementById('kontenjan-body');
          var countEl=document.getElementById('kontenjan-count');
          var headers=document.querySelectorAll('.kontenjan-table th[data-key]');
          var rows=Array.prototype.slice.call(body.querySelectorAll('tr'));
          var sortKey='dal',sortDir=1;
          function applyFilter(){
            var q=search.value.trim().toLocaleLowerCase('tr');
            var visible=0;
            rows.forEach(function(tr){
              var match=!q||tr.getAttribute('data-dal').indexOf(q)!==-1;
              tr.style.display=match?'':'none';
              if(match)visible++;
            });
            countEl.textContent=visible;
          }
          function applySort(){
            var attr=sortKey==='dal'?'data-dal':sortKey==='kontenjan'?'data-kontenjan':sortKey==='taban'?'data-taban':'data-yerlesen';
            var sorted=rows.slice().sort(function(a,b){
              var av=a.getAttribute(attr),bv=b.getAttribute(attr);
              if(attr==='data-dal')return sortDir*av.localeCompare(bv,'tr');
              return sortDir*(Number(av)-Number(bv));
            });
            sorted.forEach(function(tr){body.appendChild(tr);});
          }
          headers.forEach(function(th){
            th.addEventListener('click',function(){
              var key=th.getAttribute('data-key');
              if(sortKey===key){sortDir=-sortDir;}else{sortKey=key;sortDir=key==='dal'?1:-1;}
              applySort();
            });
          });
          search.addEventListener('input',applyFilter);
        })();
      </script>
    </section>`;
}

function renderPage(page, isLegal = false) {
  const pagePath = `/${page.slug}`;
  // Sayfada görünen FAQ seti — legal sayfalarda FAQ gösterilmez.
  const visibleFaq = isLegal ? [] : (page.faq ?? commonFaq).slice(0, 6);
  const related = page.links?.length
    ? `<nav class="related" aria-label="İlgili sayfalar">
        <h2>İlgili bağlantılar</h2>
        <div class="link-list">
          ${page.links.map(([label, href]) => `<a class="pill" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join("")}
        </div>
      </nav>`
    : "";
  const faqBlock = visibleFaq.length
    ? `<section class="faq">
        <h2>Sık sorulan sorular</h2>
        ${visibleFaq.map((item) => `
          <details>
            <summary>${escapeHtml(item.question)}</summary>
            <p>${escapeHtml(item.answer)}</p>
          </details>
        `).join("")}
      </section>`
    : "";
  const appStore = page.slug === "tus-mobil-uygulama"
    ? `<a class="appstore" href="${APP_STORE_URL}">Tusoskop'u App Store'da Gör</a>`
    : "";

  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${pageUrl(pagePath)}" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${pageUrl(pagePath)}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${OG_IMAGE}" />
    <script type="application/ld+json">${jsonLd(page, pagePath, visibleFaq)}</script>
    <style>${css}</style>
  </head>
  <body>
    ${renderHeader()}
    <main>
      <p class="eyebrow">${isLegal ? "Tusoskop Yasal" : "Tusoskop Rehberi"}</p>
      <h1>${escapeHtml(page.h1)}</h1>
      <div class="answer">${escapeHtml(page.intro)}</div>
      ${renderStats(page.stats)}
      ${renderSample(page.sample, page.subject)}
      ${page.isSubject ? renderTopics(page.subject, page.topics) : ""}
      ${page.tool === "score" ? renderScoreTool() : ""}
      ${page.tool === "kontenjan" ? renderKontenjanTable(page.kontenjanData, page.kontenjanDonem) : ""}
      ${appStore}
      <div class="sections">
        ${page.sections.map((section) => `
          <section class="section">
            <h2>${escapeHtml(section.heading)}</h2>
            ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          </section>
        `).join("")}
      </div>
      ${related}
      ${faqBlock}
    </main>
    ${renderFooter()}
  </body>
</html>
`;
}

async function writePage(page, isLegal = false) {
  const dir = path.join(publicDir, page.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), renderPage(page, isLegal), "utf8");
}

async function writeRobots() {
  const bots = [
    "Googlebot",
    "Bingbot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "GPTBot",
    "PerplexityBot",
    "ClaudeBot",
    "Claude-User",
    "Applebot",
    "*",
  ];
  const body = `${bots.map((bot) => `User-agent: ${bot}\nAllow: /`).join("\n\n")}\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  await writeFile(path.join(publicDir, "robots.txt"), body, "utf8");
}

async function writeSitemap() {
  const urls = sitemapEntries.map((entry) => `  <url>
    <loc>${pageUrl(entry.path)}</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  await writeFile(path.join(publicDir, "sitemap.xml"), xml, "utf8");
}

await Promise.all([
  ...seoPages.map((page) => writePage(page)),
  ...legalStaticPages.map((page) => writePage(page, true)),
  writeRobots(),
  writeSitemap(),
]);

console.log(`Generated ${seoPages.length + legalStaticPages.length} SEO pages, robots.txt and sitemap.xml.`);
