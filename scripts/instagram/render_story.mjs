/**
 * Puppeteer renderer: story_template.html + question JSON → 1080×1920 JPEG
 * Usage: node render_story.mjs '<question-json>' /path/to/output.jpg
 */
import puppeteer from "puppeteer-core";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Chrome paths (Ubuntu runners have Chrome pre-installed) ──────────────────
const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  // macOS
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  // Windows
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (p && existsSync(p)) return p;
  }
  return null;
}

async function renderStory(questionJson, outputPath) {
  const question = JSON.parse(questionJson);

  // Read and prepare HTML
  const templatePath = join(__dir, "story_template.html");
  const templateHtml = readFileSync(templatePath, "utf8");
  const injectedHtml = templateHtml.replace(
    "var data = window.STORY_DATA || {};",
    `var data = window.STORY_DATA || ${JSON.stringify(question)};`
  );

  // Write temp HTML so we can load it as file:// (avoids CSP issues with inline scripts)
  const tmpHtml = join(tmpdir(), `tusoskop_story_${Date.now()}.html`);
  writeFileSync(tmpHtml, injectedHtml, "utf8");

  const chromePath = findChrome();
  if (!chromePath) {
    throw new Error(
      "Chrome/Chromium bulunamadı. CHROME_PATH env değişkenini ayarlayın. " +
        "Bulunan yollar:\n  " +
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
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

    // Load the temp file (allows Google Fonts network requests)
    await page.goto(`file://${tmpHtml}`, { waitUntil: "networkidle0", timeout: 30000 });

    // Wait for fonts to finish loading
    await page.evaluate(() => document.fonts.ready);

    // Extra settle time for rendering
    await new Promise((r) => setTimeout(r, 400));

    await page.screenshot({
      path: outputPath,
      type: "jpeg",
      quality: 95,
      clip: { x: 0, y: 0, width: 1080, height: 1920 },
    });

    console.log(`   → Kaydedildi: ${outputPath}`);
  } finally {
    await browser.close();
    // Clean up temp file
    try { unlinkSync(tmpHtml); } catch {}
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────
const [, , questionArg, outputArg] = process.argv;
if (!questionArg || !outputArg) {
  console.error("Kullanım: node render_story.mjs '<json>' /çıktı/yolu.jpg");
  process.exit(1);
}

renderStory(questionArg, outputArg).catch((err) => {
  console.error("❌ render_story hatası:", err.message);
  process.exit(1);
});
