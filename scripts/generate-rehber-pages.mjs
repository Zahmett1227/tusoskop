/**
 * Statik TUS rehber landing sayfalarını public/rehber/ altına yazar.
 * Firebase Hosting’de dosya varsa rewrite’tan önce sunulur (SEO).
 *
 * Çalıştır: node scripts/generate-rehber-pages.mjs
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "rehber");

const SITE_ORIGIN = "https://tusoskop.com";

const SUBJECTS = [
  {
    slug: "anatomi",
    name: "Anatomi",
    type: "Temel",
    blurb:
      "TUS Anatomi sorularında güçlü olmak için sistem bazlı çalışma ve tekrar şart. Tusoskop’ta branşa göre soru çözümü ve konu takibi ile eksiklerinizi netleştirin.",
  },
  {
    slug: "fizyoloji",
    name: "Fizyoloji",
    type: "Temel",
    blurb:
      "Fizyoloji, TUS temel bilimlerinin omurgasıdır. Grafik ve mekanizma sorularında hız kazanmak için düzenli soru pratiği ve konu testleri kullanın.",
  },
  {
    slug: "biyokimya",
    name: "Biyokimya",
    type: "Temel",
    blurb:
      "Metabolizma yolları ve enzimler TUS’ta sık tekrarlanır. Tusoskop ile Biyokimya sorularında boş bırakma oranınızı düşürün.",
  },
  {
    slug: "mikrobiyoloji",
    name: "Mikrobiyoloji",
    type: "Temel",
    blurb:
      "Etken- tedavi eşleştirmesi ve virüs detayları için soru bankası pratiği kritiktir. Branş bazlı çalışma ile netleri yükseltin.",
  },
  {
    slug: "patoloji",
    name: "Patoloji",
    type: "Temel",
    blurb:
      "Mikroskopi ve patogenez sorularında görsel hafıza kadar mantık da önemlidir. Tekrar ve özet destekli soru çözümü ile pekiştirin.",
  },
  {
    slug: "farmakoloji",
    name: "Farmakoloji",
    type: "Temel",
    blurb:
      "Yan etki, kontrendikasyon ve mekanizma soruları için Farmakoloji’de bol soru çözün. Tusoskop’ta konu bazlı testlerle eksik konuları kapatın.",
  },
  {
    slug: "dahiliye",
    name: "Dahiliye",
    type: "Klinik",
    blurb:
      "TUS Dahiliye yüksek soru hacmiyle öne çıkar. Vaka odaklı sorularda süre yönetimi ve güncel yaklaşımlar için düzenli deneme şart.",
  },
  {
    slug: "pediatri",
    name: "Pediatri",
    type: "Klinik",
    blurb:
      "Pediatride yaş grupları ve aşı takvimleri sık müfredattır. Konu takibi ve tekrar kuyruğu ile bilgiyi kalıcı hale getirin.",
  },
  {
    slug: "genel-cerrahi",
    name: "Genel Cerrahi",
    type: "Klinik",
    blurb:
      "Cerrahi endikasyonları ve acil vaka senaryoları TUS’ta belirleyicidir. Branş soruları ve tam denemelerle hazırlanın.",
  },
  {
    slug: "kadin-hastaliklari-dogum",
    name: "Kadın Hastalıkları ve Doğum",
    type: "Klinik",
    blurb:
      "Gebelik takibi, obstetrik aciller ve jinekoloji konularında soru çeşitliliği yüksektir. Hedefli soru setleri ile eksikleri kapatın.",
  },
  {
    slug: "kucuk-stajlar",
    name: "Küçük Stajlar",
    type: "Klinik",
    blurb:
      "Küçük stajlar branşları TUS’ta geniş bir yelpaze sunar. Tusoskop ile dağılıma uygun pratik yapın ve analiz ekranlarından zayıf alanları görün.",
  },
];

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pageHtml(subject) {
  const path = `/rehber/${subject.slug}.html`;
  const url = `${SITE_ORIGIN}${path}`;
  const title = `TUS ${subject.name} Soru Çözümü ve Deneme | Tusoskop`;
  const description = `${subject.name} (${subject.type}) için TUS soru pratiği ve deneme. ${subject.blurb.slice(0, 120)}…`;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="keywords" content="TUS, ${escapeHtml(subject.name)}, TUS ${escapeHtml(subject.name)} soru, TUS deneme, Tusoskop" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${SITE_ORIGIN}/og-share.png" />
  <meta property="og:locale" content="tr_TR" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${SITE_ORIGIN}/og-share.png" />
  <meta name="theme-color" content="#020617" />
  <style>
    body { font-family: system-ui, sans-serif; background: #020617; color: #e2e8f0; margin: 0; line-height: 1.6; }
    main { max-width: 42rem; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
    h1 { font-size: 1.75rem; margin-bottom: 0.75rem; color: #f8fafc; }
    .badge { display: inline-block; font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 9999px; background: #1e293b; color: #94a3b8; margin-bottom: 1rem; }
    p { color: #cbd5e1; margin: 0 0 1rem; }
    a.cta { display: inline-block; margin-top: 0.5rem; padding: 0.75rem 1.25rem; background: #059669; color: white; text-decoration: none; border-radius: 0.75rem; font-weight: 600; }
    a.cta:hover { background: #047857; }
    nav { margin-top: 2rem; font-size: 0.9rem; }
    nav a { color: #38bdf8; }
    footer { margin-top: 3rem; font-size: 0.8rem; color: #64748b; }
  </style>
</head>
<body>
  <main>
    <p class="badge">${escapeHtml(subject.type)} bilim</p>
    <h1>TUS ${escapeHtml(subject.name)}</h1>
    <p>${escapeHtml(subject.blurb)}</p>
    <p>Tusoskop’ta bu branş için soru çözümü, konu testleri, tam TUS formatında deneme ve performans analizi kullanabilirsiniz.</p>
    <a class="cta" href="/">Uygulamayı aç</a>
    <nav>
      <a href="/rehber/index.html">Tüm rehber sayfaları</a>
    </nav>
    <footer>Tusoskop — Tıpta Uzmanlık Sınavı hazırlık platformu</footer>
  </main>
</body>
</html>
`;
}

function indexHtml() {
  const links = SUBJECTS.map(
    (s) =>
      `    <li><a href="/rehber/${s.slug}.html">TUS ${escapeHtml(s.name)}</a> <span style="color:#64748b">(${escapeHtml(s.type)})</span></li>`
  ).join("\n");

  const title = "TUS Branş Rehberi — Tusoskop";
  const description =
    "TUS temel ve klinik bilimler için branş bazlı hazırlık sayfaları. Soru çözümü ve deneme için Tusoskop’a geçin.";

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${SITE_ORIGIN}/rehber/index.html" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${SITE_ORIGIN}/rehber/index.html" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${SITE_ORIGIN}/og-share.png" />
  <meta property="og:locale" content="tr_TR" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="theme-color" content="#020617" />
  <style>
    body { font-family: system-ui, sans-serif; background: #020617; color: #e2e8f0; margin: 0; line-height: 1.6; }
    main { max-width: 42rem; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
    h1 { font-size: 1.75rem; margin-bottom: 1rem; }
    ul { padding-left: 1.25rem; }
    li { margin: 0.5rem 0; }
    a { color: #38bdf8; }
    .cta { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.25rem; background: #059669; color: white; text-decoration: none; border-radius: 0.75rem; font-weight: 600; }
  </style>
</head>
<body>
  <main>
    <h1>TUS branş rehberi</h1>
    <p>Aşağıdaki sayfalar uzun kuyruk arama ve sosyal paylaşım için optimize edilmiş statik giriş noktalarıdır. Asıl uygulama tek sayfadır; ana deneyim için ana sayfaya gidin.</p>
    <a class="cta" href="/">Tusoskop’u aç</a>
    <h2 style="margin-top:2rem;font-size:1.1rem">Branş sayfaları</h2>
    <ul>
${links}
    </ul>
  </main>
</body>
</html>
`;
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "index.html"), indexHtml(), "utf8");
for (const s of SUBJECTS) {
  writeFileSync(join(OUT_DIR, `${s.slug}.html`), pageHtml(s), "utf8");
}
console.log(`Wrote ${SUBJECTS.length + 1} files to ${OUT_DIR}`);
