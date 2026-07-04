import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  APP_STORE_URL,
  BRAND_NAME,
  LASTMOD,
  OG_IMAGE,
  SITE_URL,
  buildSiteNavigationNodes,
  commonFaq,
  homeSeo,
  legalStaticPages,
  pageUrl,
  seoPages,
  sitemapEntries,
  subjectIndexLinks,
} from "../src/seo/seoContent.js";
import {
  TUS_SECTION_QUESTIONS,
  TUS_DEDUCTION_RATE,
  TUS_BARAJ_PUANI,
  TEMEL_ORTALAMA,
  TEMEL_STDDEV,
  KLINIK_ORTALAMA,
  KLINIK_STDDEV,
  T_PUANI_AGIRLIK,
  K_PUANI_AGIRLIK,
} from "../src/seo/tusScoring.js";
import { KONTENJAN_DATA } from "../src/seo/kontenjanData.js";
import { getDolulukYuzde, getRekabetTier } from "../src/seo/kontenjanMetrics.js";
import { SUBJECTS } from "../src/data/subjects.js";

const TEMEL_DERSLER = SUBJECTS.filter((s) => s.type === "Temel").map((s) => s.name);
const KLINIK_DERSLER = SUBJECTS.filter((s) => s.type === "Klinik").map((s) => s.name);

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
    ...buildSiteNavigationNodes(),
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
  .calc>.accent-bar{height:4px;margin:-22px -22px 22px;background:linear-gradient(90deg,#7dd3fc,#6ee7b7,#34d399)}
  .calc-out{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:16px}
  .calc-box{border:1px solid #1e293b;background:#020617;border-radius:16px;padding:14px;text-align:center}
  .calc-box.hi{border-color:rgba(110,231,183,.4);background:rgba(110,231,183,.1)}
  .calc-box.hi-t{border-color:rgba(125,211,252,.4);background:rgba(125,211,252,.1)}
  .calc-box small{display:block;font-size:12px;font-weight:700;color:#94a3b8}
  .calc-box.hi small{color:#a7f3d0}
  .calc-box.hi-t small{color:#bae6fd}
  .calc-box b{display:block;margin-top:4px;font-size:22px;font-weight:900;color:#fff}
  .calc-box.hi b,.calc-box.hi-t b{font-size:27px}
  .calc-box .band{display:block;margin-top:4px;font-size:11px;font-weight:700;color:#a7f3d0}
  .calc-box.hi-t .band{color:#bae6fd}
  .calc-box .usedby{display:block;margin-top:6px;font-size:10px;font-weight:600;color:#64748b}
  .calc-note{margin-top:14px;font-size:13px;color:#94a3b8}
  .calc-note b{color:#6ee7b7}
  .calc-note b.t{color:#7dd3fc}
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
  .puan-badge{display:inline-flex;align-items:center;border-radius:999px;padding:2px 8px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;border:1px solid;white-space:nowrap}
  .puan-badge.t{border-color:rgba(125,211,252,.4);background:rgba(125,211,252,.1);color:#bae6fd}
  .puan-badge.k{border-color:rgba(110,231,183,.4);background:rgba(110,231,183,.1);color:#a7f3d0}
  .method-note{margin-top:24px;border:1px solid #1e293b;background:rgba(2,6,23,.5);border-radius:18px;padding:20px}
  .method-note summary{cursor:pointer;font-size:14px;font-weight:900;color:#fff}
  .method-note .body{margin-top:12px;display:grid;gap:8px}
  .method-note p{font-size:12px;color:#94a3b8;line-height:1.6}
  .method-note b{color:#cbd5e1}
  .match-panel{margin-top:32px;border:1px solid #1e293b;background:rgba(2,6,23,.5);border-radius:18px;padding:20px}
  .match-panel h3{margin:0;font-size:16px;color:#fff}
  .match-panel .hint{margin-top:6px;font-size:12px;color:#94a3b8}
  .match-panel .lead{margin-top:14px;font-size:14px;font-weight:800;color:#6ee7b7}
  .match-panel .lead.warn{color:#fbbf24}
  .match-list{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
  .match-chip{display:flex;align-items:center;gap:6px;border-radius:14px;padding:7px 12px;font-size:12px;font-weight:800;border:1px solid rgba(110,231,183,.3);background:rgba(110,231,183,.1);color:#ecfdf5}
  .match-chip.sinirda{border-color:rgba(252,211,77,.3);background:rgba(252,211,77,.1);color:#fef3c7}
  .match-chip.open{border-color:#334155;background:rgba(15,23,42,.6);color:#cbd5e1}
  .match-group{margin-top:16px}
  .match-group-title{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.06em}
  .match-group-title.rahat{color:rgba(110,231,183,.8)}
  .match-group-title.sinirda{color:rgba(252,211,77,.8)}
  .match-group-title.open{color:#64748b}
  .match-group-title span{color:#64748b;font-weight:700}
  .rekabet-badge{display:inline-flex;align-items:center;white-space:nowrap;border-radius:999px;padding:3px 9px;font-size:11px;font-weight:900;border:1px solid}
  .rekabet-badge.cokRekabetci{border-color:rgba(251,113,133,.4);background:rgba(251,113,133,.1);color:#fda4af}
  .rekabet-badge.rekabetci{border-color:rgba(253,186,116,.4);background:rgba(253,186,116,.1);color:#fdba74}
  .rekabet-badge.orta{border-color:rgba(252,211,77,.4);background:rgba(252,211,77,.1);color:#fcd34d}
  .rekabet-badge.erisilebilir{border-color:rgba(110,231,183,.4);background:rgba(110,231,183,.1);color:#a7f3d0}
  .rekabet-badge.dolmadi{border-color:rgba(100,116,139,.5);background:rgba(51,65,85,.2);color:#cbd5e1}
  .doluluk-cell{display:flex;align-items:center;gap:8px}
  .doluluk-bar{display:none;height:6px;width:56px;overflow:hidden;border-radius:999px;background:#334155}
  .doluluk-bar>i{display:block;height:100%;border-radius:999px}
  .doluluk-bar.full>i{background:#34d399}
  .doluluk-bar.high>i{background:#38bdf8}
  .doluluk-bar.low>i{background:#fbbf24}
  @media(min-width:640px){.doluluk-bar{display:block}}
  .kontenjan-help{margin-top:8px;font-size:12px;line-height:1.6;color:#94a3b8}
  .kontenjan-help b{color:#6ee7b7;font-weight:700}
  .match-near{margin-top:16px;border-top:1px solid #1e293b;padding-top:14px}
  .match-near-title{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:#64748b}
  .match-near-row{display:flex;align-items:center;justify-content:space-between;margin-top:8px;font-size:14px;gap:10px}
  .match-near-row .dal{display:flex;align-items:center;gap:6px;color:#cbd5e1;font-weight:700}
  .match-near-row .gap{font-size:11px;color:#64748b;font-weight:700}
  .kontenjan-table,.ref-table{margin-top:24px;overflow-x:auto;border:1px solid #1e293b;border-radius:20px}
  .kontenjan-table table,.ref-table table{width:100%;border-collapse:collapse;font-size:14px}
  .kontenjan-table thead tr,.ref-table thead tr{background:rgba(15,23,42,.7);text-align:left;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8}
  .kontenjan-table th,.kontenjan-table td,.ref-table th,.ref-table td{padding:11px 15px}
  .kontenjan-table th{cursor:pointer;user-select:none}
  .kontenjan-table tbody tr,.ref-table tbody tr{border-top:1px solid #1e293b}
  .kontenjan-table td:first-child{font-weight:800;color:#e2e8f0}
  .kontenjan-table td.puan{font-weight:900;color:#6ee7b7}
  .kontenjan-search{width:100%;max-width:360px;border:1px solid #334155;background:#020617;color:#fff;border-radius:16px;padding:10px 15px;font-size:14px;font-weight:700;outline:none}
  .kontenjan-search:focus{border-color:#6ee7b7}
  .kontenjan-meta{margin-top:10px;font-size:12px;font-weight:700;color:#64748b;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .reverse-box{margin-top:32px;border:1px solid #1e293b;background:rgba(2,6,23,.5);border-radius:18px;padding:20px}
  .reverse-box h3{margin:0;font-size:16px;color:#fff}
  .reverse-box .hint{margin-top:6px;font-size:12px;color:#94a3b8}
  .reverse-row{margin-top:14px;display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px}
  .reverse-field label{display:block;font-size:13px;font-weight:700;color:#cbd5e1;margin-bottom:6px}
  .reverse-field input{width:160px;border:1px solid #334155;background:#0f172a;color:#fff;border-radius:14px;padding:11px 13px;font-size:16px;font-weight:700;outline:none}
  .seg-group{display:flex;overflow:hidden;border-radius:16px;border:1px solid #334155}
  .seg-btn{padding:11px 16px;font-size:14px;font-weight:900;background:#0f172a;color:#94a3b8;cursor:pointer;border:none;font-family:inherit}
  .seg-btn.active-t{background:#7dd3fc;color:#020617}
  .seg-btn.active-k{background:#6ee7b7;color:#020617}
  .reverse-out-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
  .reverse-out{border:1px solid #1e293b;background:rgba(15,23,42,.62);border-radius:14px;padding:11px 16px}
  .reverse-out small{display:block;font-size:12px;font-weight:700;color:#94a3b8}
  .reverse-out b{display:block;margin-top:2px;font-size:20px;font-weight:900;color:#fff}
  .reverse-warn{margin-top:6px;font-size:11px;font-weight:700;color:#fbbf24}
  @media (max-width:560px){.calc-grid{grid-template-columns:1fr}.calc-out{grid-template-columns:1fr}.reverse-out-grid{grid-template-columns:1fr}}
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
// React hesaplayıcısıyla (PublicSeoPages.jsx) aynı formülü ve sabitleri
// (tusScoring.js, kontenjanData.js) kullanır; production'da bu statik sürüm
// crawler'lara ve ilk boyamaya servis edilir.
function renderScoreTool() {
  const kontenjanJson = JSON.stringify(KONTENJAN_DATA.map((r) => [r.dal, r.tabanPuan, r.puanTuru, r.ortalamaPuan]));
  return `<section class="calc" aria-label="TUS puan hesaplama aracı">
      <div class="accent-bar"></div>
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
        <div class="calc-box hi-t">
          <small>T Puanı</small>
          <b id="t-puani">—</b>
          <span class="band" id="t-band">Doğru ve yanlış sayını gir</span>
          <span class="usedby">${TEMEL_DERSLER.length} temel ders (${escapeHtml(TEMEL_DERSLER.join(", "))})</span>
        </div>
        <div class="calc-box hi">
          <small>K Puanı</small>
          <b id="k-puani">—</b>
          <span class="band" id="k-band">Doğru ve yanlış sayını gir</span>
          <span class="usedby">${KLINIK_DERSLER.length} klinik ders (${escapeHtml(KLINIK_DERSLER.join(", "))})</span>
        </div>
      </div>
      <p class="calc-note">Sonuç tahminidir. Net = doğru − yanlış/4. TUS'ta tek bir puan değil, ayrı ayrı <b class="t">T Puanı</b> ve <b>K Puanı</b> hesaplanır; hangi dala yerleşeceğine göre ilgili puan geçerlidir.</p>

      <div class="match-panel" id="match-panel" style="display:none">
        <h3>Bu puanla hangi dallara girebilirsin?</h3>
        <p class="hint">2026-TUS 1. Dönem verisine göre yaklaşık kıyaslama — her dal kendi puan türüyle (T veya K) karşılaştırılır. Bir dala taban puanla girmek mümkün olsa da, ortalama puanın altındaysan alt sıralarda ve rekabetçi kalırsın. Puanlar dönemden döneme değişir; bu bir garanti değil, referanstır.</p>
        <p class="lead" id="match-lead" style="display:none"></p>
        <div id="match-groups"></div>
        <div class="match-near" id="match-near" style="display:none">
          <p class="match-near-title">Az kalanlar</p>
          <div id="match-near-rows"></div>
        </div>
        <a href="/tus-kontenjan-tablosu" style="display:inline-flex;margin-top:16px;font-size:14px;font-weight:800;color:#6ee7b7">Tüm kontenjan tablosunu gör →</a>
      </div>

      <details class="method-note">
        <summary>Nasıl hesaplanıyor?</summary>
        <div class="body">
          <p><b>1. Standart puan:</b> her bölümün neti, o bölümün ortalama ve standart sapmasına göre 50 ortalamalı bir standart puana çevrilir: SP = 50 + 10 × (Net − Ortalama) / Standart Sapma.</p>
          <p><b>2. Ağırlıklı birleşim:</b> <b class="t">T Puanı</b> = %${T_PUANI_AGIRLIK.temel * 100} Temel + %${T_PUANI_AGIRLIK.klinik * 100} Klinik · <b>K Puanı</b> = %${K_PUANI_AGIRLIK.temel * 100} Temel + %${K_PUANI_AGIRLIK.klinik * 100} Klinik.</p>
          <p><b>3. Baraj:</b> T veya K puanından ${TUS_BARAJ_PUANI} puanın altında kalan bir puan türüyle tercih yapılamaz.</p>
          <p>ÖSYM, dönem bazlı ortalama/standart sapmayı resmi olarak yayımlamaz. Buradaki hesaplama Temel ≈${TEMEL_ORTALAMA} ve Klinik ≈${KLINIK_ORTALAMA} net ortalamasına dayalı yaklaşık bir referans kullanır; gerçek dönem istatistikleri farklı olabilir.</p>
        </div>
      </details>

      <div class="reverse-box">
        <h3>Hedef puana kaç net gerekir?</h3>
        <p class="hint" id="reverse-hint">Hedef puan türünü ve puanı gir; bir bölümdeki mevcut netini sabit tutup diğer bölümde gereken neti hesaplayalım.</p>
        <div class="reverse-row">
          <div class="reverse-field">
            <label>Puan Türü</label>
            <div class="seg-group">
              <button type="button" class="seg-btn active-k" id="hedef-t" data-tur="T">T Puanı</button>
              <button type="button" class="seg-btn active-k" id="hedef-k" data-tur="K">K Puanı</button>
            </div>
          </div>
          <div class="reverse-field"><label for="hedef-puan">Hedef Puan</label><input id="hedef-puan" type="number" inputmode="decimal" min="0" max="100" placeholder="örn. 55" /></div>
        </div>
        <div class="reverse-out-grid">
          <div class="reverse-out"><small id="reverse-label-k">Temel net sabit kalırsa, gereken Klinik net</small><b id="gerekli-klinik-net">—</b></div>
          <div class="reverse-out"><small id="reverse-label-t">Klinik net sabit kalırsa, gereken Temel net</small><b id="gerekli-temel-net">—</b></div>
        </div>
      </div>

      <script>
        (function(){
          var SEC=${TUS_SECTION_QUESTIONS},RATE=${TUS_DEDUCTION_RATE},BARAJ=${TUS_BARAJ_PUANI};
          var TO=${TEMEL_ORTALAMA},TS=${TEMEL_STDDEV},KO=${KLINIK_ORTALAMA},KS=${KLINIK_STDDEV};
          var TW={temel:${T_PUANI_AGIRLIK.temel},klinik:${T_PUANI_AGIRLIK.klinik}};
          var KW={temel:${K_PUANI_AGIRLIK.temel},klinik:${K_PUANI_AGIRLIK.klinik}};
          var KONTENJAN=${kontenjanJson};
          var kesinti=false,hedefTuru='K',RAHAT_MARJ=1.5;
          function r1(x){return Math.round(x*10)/10;}
          function net(c,w){var n=(Number(c)||0)-(Number(w)||0)/4;return n>0?r1(n):0;}
          function blank(c,w){var b=SEC-(Number(c)||0)-(Number(w)||0);return b>=0?b:0;}
          function overflow(c,w){return (Number(c)||0)+(Number(w)||0)>SEC;}
          function sp(n,o,s){return 50+10*((Number(n)||0)-o)/s;}
          function tPuani(tn,kn){return r1(Math.max(0,TW.temel*sp(tn,TO,TS)+TW.klinik*sp(kn,KO,KS)));}
          function kPuani(tn,kn){return r1(Math.max(0,KW.temel*sp(tn,TO,TS)+KW.klinik*sp(kn,KO,KS)));}
          function deduct(s,active){s=Number(s)||0;return active?r1(s*(1-RATE)):s;}
          function band(s){s=Number(s)||0;if(s<BARAJ)return"Baraj Altı · "+BARAJ+" puan barajının altındasın; bu puan türüyle tercih hakkın doğmuyor.";if(s<55)return"Baraj Üstü · Barajı geçtin; rekabetin düşük olduğu dallarda seçeneklerin olabilir.";if(s<65)return"İyi · Birçok branş için yeterli; netlerini biraz daha yükselt.";return"Yüksek · Rekabetçi branşlar için güçlü bir aralık.";}
          function cap(el){var x=el.value.replace(/[^0-9]/g,'');if(x!=='')x=String(Math.min(Number(x),SEC));el.value=x;return x;}
          function netForTarget(target,tur,fixedT,fixedK){
            var w=tur==='T'?TW:KW;
            var spTFixed=sp(fixedT,TO,TS);
            var neededSpK=(target-w.temel*spTFixed)/w.klinik;
            var neededK=r1(KO+(KS*(neededSpK-50))/10);
            var spKFixed=sp(fixedK,KO,KS);
            var neededSpT=(target-w.klinik*spKFixed)/w.temel;
            var neededT=r1(TO+(TS*(neededSpT-50))/10);
            return {t:neededT,k:neededK};
          }
          var td=document.getElementById('td'),ty=document.getElementById('ty'),kd=document.getElementById('kd'),ky=document.getElementById('ky');
          var tOverflowEl=document.getElementById('temel-overflow'),kOverflowEl=document.getElementById('klinik-overflow');
          var toggleBtn=document.getElementById('kesinti-toggle'),switchEl=document.getElementById('kesinti-switch');
          var hedefEl=document.getElementById('hedef-puan'),hintEl=document.getElementById('reverse-hint');
          var hedefTBtn=document.getElementById('hedef-t'),hedefKBtn=document.getElementById('hedef-k');
          var matchPanel=document.getElementById('match-panel'),matchLead=document.getElementById('match-lead'),matchGroups=document.getElementById('match-groups');
          var matchNear=document.getElementById('match-near'),matchNearRows=document.getElementById('match-near-rows');
          var lastTemelNet=0,lastKlinikNet=0;
          function badgeHtml(r){return '<span class="puan-badge '+(r[2]==='T'?'t':'k')+'">'+r[2]+'</span> ';}
          function renderGroup(title,titleClass,note,items,chipClass,fmt){
            if(!items.length)return;
            var wrap=document.createElement('div');
            wrap.className='match-group';
            var h=document.createElement('p');
            h.className='match-group-title '+titleClass;
            h.innerHTML=title+(note?' <span>'+note+'</span>':'');
            wrap.appendChild(h);
            var ul=document.createElement('ul');
            ul.className='match-list';
            items.forEach(function(r){
              var li=document.createElement('li');
              li.className='match-chip'+(chipClass?' '+chipClass:'');
              li.innerHTML=badgeHtml(r)+r[0]+' · '+fmt(r);
              ul.appendChild(li);
            });
            wrap.appendChild(ul);
            matchGroups.appendChild(wrap);
          }
          function renderMatch(tShown,kShown){
            var hasScore=tShown>0||kShown>0;
            matchPanel.style.display=hasScore?'block':'none';
            if(!hasScore)return;
            function relevant(r){return r[2]==='T'?tShown:kShown;}
            var rahat=[],sinirda=[],open=[],near=[];
            KONTENJAN.forEach(function(r){
              var s=relevant(r);
              if(r[1]==null){open.push(r);return;}
              if(s<r[1]){near.push(r);return;}
              if(r[3]!=null&&s>=r[3]+RAHAT_MARJ)rahat.push(r);else sinirda.push(r);
            });
            rahat.sort(function(a,b){return b[3]-a[3];});
            sinirda.sort(function(a,b){return a[3]-b[3];});
            near.sort(function(a,b){return (a[1]-relevant(a))-(b[1]-relevant(b));});
            near=near.slice(0,5);
            var total=rahat.length+sinirda.length+open.length;
            if(total>0){
              matchLead.style.display='none';
            }else{
              matchLead.style.display='block';
              matchLead.className='lead warn';
              matchLead.textContent='Bu puanla geçen dönem taban puanı oluşan hiçbir dala girebilmiş değilsin'+(open.length?', ancak kontenjanı hiç dolmayan '+open.length+' dal her zaman açık kalıyor.':'.');
            }
            matchGroups.innerHTML='';
            renderGroup('Rahat girersin','rahat','(ortalamanın en az +1.5 üzerindesin)',rahat,'',function(r){return 'ort. '+r[3];});
            renderGroup('Sınırda / rekabetçi','sinirda','(taban üstü, ortalamaya +1.5’e kadar yakın)',sinirda,'sinirda',function(r){return 'taban '+r[1]+' · ort. '+r[3];});
            renderGroup('Kontenjanı dolmayan dallar','open','',open,'open',function(){return 'kontenjan dolmadı';});
            matchNear.style.display=near.length?'block':'none';
            matchNearRows.innerHTML='';
            near.forEach(function(r){
              var row=document.createElement('div');
              row.className='match-near-row';
              var badge='<span class="puan-badge '+(r[2]==='T'?'t':'k')+'">'+r[2]+'</span>';
              row.innerHTML='<span class="dal">'+badge+' '+r[0]+'</span><span class="gap">'+r[1]+' (+'+r1(r[1]-relevant(r))+' puan)</span>';
              matchNearRows.appendChild(row);
            });
          }
          function upd(){
            var tc=cap(td),tw=cap(ty),kc=cap(kd),kw=cap(ky);
            var tn=net(tc,tw),kn=net(kc,kw);
            lastTemelNet=tn;lastKlinikNet=kn;
            document.getElementById('temel-net').textContent=tn;
            document.getElementById('klinik-net').textContent=kn;
            document.getElementById('toplam-net').textContent=r1(tn+kn);
            document.getElementById('temel-blank').textContent=blank(tc,tw);
            document.getElementById('klinik-blank').textContent=blank(kc,kw);
            tOverflowEl.style.display=overflow(tc,tw)?'block':'none';
            kOverflowEl.style.display=overflow(kc,kw)?'block':'none';
            var has=td.value||ty.value||kd.value||ky.value;
            var rawT=tPuani(tn,kn),rawK=kPuani(tn,kn);
            var shownT=kesinti?deduct(rawT,true):rawT;
            var shownK=kesinti?deduct(rawK,true):rawK;
            document.getElementById('t-puani').textContent=has?shownT:'—';
            document.getElementById('k-puani').textContent=has?shownK:'—';
            document.getElementById('t-band').textContent=has?band(shownT):'Doğru ve yanlış sayını gir';
            document.getElementById('k-band').textContent=has?band(shownK):'Doğru ve yanlış sayını gir';
            renderMatch(has?shownT:0,has?shownK:0);
            updReverse();
          }
          function updReverse(){
            hintEl.textContent='Hedef puan türünü ve puanı gir; bir bölümdeki mevcut netini sabit tutup diğer bölümde gereken neti hesaplayalım'+(kesinti?' (kesinti anahtarı açıkken hedefin kesinti sonrası puan olarak alındığı varsayılır).':'.');
            var raw=hedefEl.value.replace(/[^0-9.]/g,'');
            if(raw!==hedefEl.value)hedefEl.value=raw;
            var s=Number(raw);
            var valid=raw!==''&&isFinite(s)&&s>0;
            var effective=valid&&kesinti?s/(1-RATE):s;
            var kEl=document.getElementById('gerekli-klinik-net'),tEl=document.getElementById('gerekli-temel-net');
            if(!valid){kEl.textContent='—';tEl.textContent='—';return;}
            var needed=netForTarget(effective,hedefTuru,lastTemelNet,lastKlinikNet);
            kEl.textContent=needed.k<0?'Zaten üzerinde':(needed.k>SEC?(SEC+'+'):needed.k);
            tEl.textContent=needed.t<0?'Zaten üzerinde':(needed.t>SEC?(SEC+'+'):needed.t);
          }
          toggleBtn.addEventListener('click',function(){
            kesinti=!kesinti;
            toggleBtn.setAttribute('aria-checked',String(kesinti));
            switchEl.className='calc-switch'+(kesinti?' on':'');
            upd();
          });
          [td,ty,kd,ky].forEach(function(el){el.addEventListener('input',upd);});
          hedefEl.addEventListener('input',updReverse);
          [hedefTBtn,hedefKBtn].forEach(function(btn){
            btn.addEventListener('click',function(){
              hedefTuru=btn.getAttribute('data-tur');
              hedefTBtn.className='seg-btn'+(hedefTuru==='T'?' active-t':'');
              hedefKBtn.className='seg-btn'+(hedefTuru==='K'?' active-k':'');
              updReverse();
            });
          });
          upd();
        })();
      </script>
    </section>`;
}

// TUS kontenjan tablosu — sıralanabilir/aranabilir statik tablo + satır-içi JS.
function renderKontenjanTable(data, donem) {
  const sorted = [...data].sort((a, b) => (b.ortalamaPuan ?? -1) - (a.ortalamaPuan ?? -1));
  const rows = sorted
    .map((r) => {
      const tier = getRekabetTier(r);
      const yuzde = getDolulukYuzde(r);
      const barClass = yuzde == null ? "" : yuzde >= 100 ? "full" : yuzde >= 90 ? "high" : "low";
      const doluluk =
        yuzde == null
          ? '<span style="color:#64748b">—</span>'
          : `<span class="doluluk-cell"><span class="doluluk-bar ${barClass}"><i style="width:${Math.min(yuzde, 100)}%"></i></span><span style="font-weight:600;color:#cbd5e1">%${yuzde}</span></span>`;
      const aralik =
        r.tabanPuan != null ? `${r.tabanPuan} <span style="color:#475569">–</span> ${r.tavanPuan}` : "—";
      return (
        `<tr data-dal="${escapeHtml(r.dal.toLocaleLowerCase("tr"))}" data-kontenjan="${r.kontenjan}" data-taban="${r.tabanPuan ?? -1}" data-ortalama="${r.ortalamaPuan ?? -1}" data-doluluk="${yuzde ?? -1}">` +
        `<td>${escapeHtml(r.dal)}</td>` +
        `<td><span class="puan-badge ${r.puanTuru === "T" ? "t" : "k"}">${r.puanTuru}</span></td>` +
        `<td><span class="rekabet-badge ${tier.key}">${escapeHtml(tier.label)}</span></td>` +
        `<td class="puan">${r.ortalamaPuan != null ? r.ortalamaPuan : "—"}</td>` +
        `<td style="color:#94a3b8;font-weight:600">${aralik}</td>` +
        `<td>${r.kontenjan}</td>` +
        `<td>${doluluk}</td></tr>`
      );
    })
    .join("");
  return `<section aria-label="TUS kontenjan tablosu" style="margin-top:30px">
      <input type="text" id="kontenjan-search" class="kontenjan-search" placeholder="Uzmanlık dalı ara…" />
      <p class="kontenjan-meta">${escapeHtml(donem)} · <span id="kontenjan-count">${data.length}</span> dal · <span class="puan-badge t">T</span> temel bilim · <span class="puan-badge k">K</span> klinik</p>
      <p class="kontenjan-help">Bir dalın rekabetini yalnızca <b style="color:#cbd5e1">taban puanla</b> değerlendirme: taban, o dala giren <b style="color:#cbd5e1">son kişinin</b> puanıdır. <b>Ortalama</b> ve <b>tavan</b> puan ile <b>rekabet</b> rozeti, dalın gerçek yarışını daha doğru gösterir.</p>
      <div class="kontenjan-table">
        <table>
          <thead>
            <tr>
              <th data-key="dal" data-type="str">Uzmanlık Dalı</th>
              <th>Tür</th>
              <th data-key="ortalama" data-type="num">Rekabet</th>
              <th data-key="ortalama" data-type="num">Ortalama</th>
              <th data-key="taban" data-type="num">Taban–Tavan</th>
              <th data-key="kontenjan" data-type="num">Kontenjan</th>
              <th data-key="doluluk" data-type="num">Doluluk</th>
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
          var sortKey='ortalama',sortDir=-1;
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
            var attr='data-'+sortKey;
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
