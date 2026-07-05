/**
 * K2 "Vaka Reels" kreatifini (index.html, CSS keyframe animasyonu) Playwright ile
 * kaydedip mp4'e encode eder. Yeni bir varyant için index.html'deki soru/şık metnini
 * değiştirip tekrar çalıştır: node scripts/ads-creative/k2-vaka-reels/capture.mjs
 */
import { chromium } from "playwright-core";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, ".raw");
const WIDTH = 1080;
const HEIGHT = 1920;
const CAPTURE_MS = 18500;
const OUT_DURATION = 18;
const OUT_FILE = join(__dirname, "..", "..", "..", "public", "reklam", "mq_pat_01_reels.mp4");

mkdirSync(RAW_DIR, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
  recordVideo: { dir: RAW_DIR, size: { width: WIDTH, height: HEIGHT } },
});
const page = await context.newPage();
await page.goto(`file://${join(__dirname, "index.html")}`);
await page.waitForTimeout(CAPTURE_MS);
await context.close();
await browser.close();

const webm = join(RAW_DIR, readdirSync(RAW_DIR).find((f) => f.endsWith(".webm")));

execFileSync("ffmpeg", [
  "-y",
  "-i", webm,
  "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
  "-t", String(OUT_DURATION),
  "-vf", `fade=t=out:st=${OUT_DURATION - 0.4}:d=0.4`,
  "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-preset", "slow", "-crf", "18",
  "-c:a", "aac", "-b:a", "128k", "-shortest",
  "-movflags", "+faststart",
  OUT_FILE,
]);

rmSync(RAW_DIR, { recursive: true, force: true });
console.log("Kaydedildi:", OUT_FILE);
