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

const publicDir = path.resolve("public");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function jsonLd(page, pagePath, faq = commonFaq) {
  const url = pageUrl(pagePath);
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
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
      {
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  });
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
  @media (max-width:720px){.nav{display:none}main{padding-top:38px}.topbar-inner{padding-inline:14px}}
`;

const footerLinks = [
  ["Tusoskop Nedir?", "/tusoskop-nedir"],
  ["TUS Hazırlık Platformu", "/tus-hazirlik-platformu"],
  ["TUS Soru Çözme Uygulaması", "/tus-soru-cozme-uygulamasi"],
  ["TUS Deneme Analizi", "/tus-deneme-analizi"],
  ["Tusoskop Özellikleri", "/tusoskop-ozellikleri"],
  ["Fiyatlandırma", "/tusoskop-fiyatlandirma"],
  ["Sık Sorulan Sorular", "/tusoskop-sss"],
  ["Gizlilik Sözleşmesi", "/gizlilik-sozlesmesi"],
  ["Kullanım Koşulları", "/kullanim-kosullari"],
  ["App Store", APP_STORE_URL],
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
          <a href="/tusoskop-fiyatlandirma">Fiyatlandırma</a>
          <a href="/tusoskop-sss">SSS</a>
        </nav>
        <a class="cta" href="/">Hemen Başla</a>
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

function renderPage(page, isLegal = false) {
  const pagePath = `/${page.slug}`;
  const faq = page.faq ?? commonFaq;
  const related = page.links?.length
    ? `<nav class="related" aria-label="İlgili sayfalar">
        <h2>İlgili bağlantılar</h2>
        <div class="link-list">
          ${page.links.map(([label, href]) => `<a class="pill" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join("")}
        </div>
      </nav>`
    : "";
  const faqBlock = isLegal
    ? ""
    : `<section class="faq">
        <h2>Sık sorulan sorular</h2>
        ${faq.slice(0, 6).map((item) => `
          <details>
            <summary>${escapeHtml(item.question)}</summary>
            <p>${escapeHtml(item.answer)}</p>
          </details>
        `).join("")}
      </section>`;
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
    <script type="application/ld+json">${jsonLd(page, pagePath, faq)}</script>
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
