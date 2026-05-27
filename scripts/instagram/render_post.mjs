/**
 * Puppeteer renderer: post_template.html + question JSON → 3 × 1080×1350 JPEG
 * Usage: node render_post.mjs '<question-json>' /slide1.jpg /slide2.jpg /slide3.jpg
 */
import puppeteer from "puppeteer-core";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (p && existsSync(p)) return p;
  }
  return null;
}

async function renderPost(questionJson, outputPaths) {
  const question = JSON.parse(questionJson);

  const templatePath = join(__dir, "post_template.html");
  const templateHtml = readFileSync(templatePath, "utf8");

  // Inject data and set initial slideType=1
  const dataWithSlide = { ...question, slideType: 1 };
  const injectedHtml = templateHtml.replace(
    "var data = window.STORY_DATA || {};",
    `var data = window.STORY_DATA || ${JSON.stringify(dataWithSlide)};`
  );

  const tmpHtml = join(tmpdir(), `tusoskop_post_${Date.now()}.html`);
  writeFileSync(tmpHtml, injectedHtml, "utf8");

  const chromePath = findChrome();
  if (!chromePath) {
    throw new Error(
      "Chrome/Chromium bulunamadı. CHROME_PATH env değişkenini ayarlayın.\n" +
        CHROME_PATHS.filter(Boolean).join("\n  ")
    );
  }
  console.log(`   → Chrome: ${chromePath}`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--hide-scrollbars",
    ],
    headless: "new",
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });

    await page.goto(`file://${tmpHtml}`, { waitUntil: "networkidle0", timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 400));

    const clip = { x: 0, y: 0, width: 1080, height: 1350 };

    // Slide 1 — question (already rendered on load)
    await page.screenshot({ path: outputPaths[0], type: "jpeg", quality: 95, clip });
    console.log(`   → Slide 1: ${outputPaths[0]}`);

    // Slide 2 — answer revealed
    await page.evaluate(() => window.renderContent(2));
    await new Promise((r) => setTimeout(r, 200));
    await page.screenshot({ path: outputPaths[1], type: "jpeg", quality: 95, clip });
    console.log(`   → Slide 2: ${outputPaths[1]}`);

    // Slide 3 — promo
    await page.evaluate(() => window.renderContent(3));
    await new Promise((r) => setTimeout(r, 200));
    await page.screenshot({ path: outputPaths[2], type: "jpeg", quality: 95, clip });
    console.log(`   → Slide 3: ${outputPaths[2]}`);
  } finally {
    await browser.close();
    try { unlinkSync(tmpHtml); } catch {}
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────
const [, , questionArg, out1, out2, out3] = process.argv;
if (!questionArg || !out1 || !out2 || !out3) {
  console.error("Kullanım: node render_post.mjs '<json>' /slide1.jpg /slide2.jpg /slide3.jpg");
  process.exit(1);
}

renderPost(questionArg, [out1, out2, out3]).catch((err) => {
  console.error("❌ render_post hatası:", err.message);
  process.exit(1);
});
