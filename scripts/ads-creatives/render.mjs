import { chromium } from "@playwright/test";
const [,, htmlPath, outPath, w, h] = process.argv;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 }).then(c => c.newPage());
await page.goto("file://" + htmlPath, { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await page.screenshot({ path: outPath });
await browser.close();
console.log("rendered", outPath);
