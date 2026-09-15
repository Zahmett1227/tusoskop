import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { renderHomeSeoStatic } from "./scripts/render-home-seo.mjs";
import { homeSeo } from "./src/seo/seoContent.js";

// Ana sayfa (/) için gerçek DOM fallback'i. SEO içeriği <noscript> içinde
// DEĞİL, doğrudan #root içinde servis edilir: curl, JS'siz tarayıcı ve AI
// tarama botları (GPTBot, ClaudeBot, PerplexityBot) içeriği okur. React mount
// olunca createRoot #root içeriğini temizleyip PublicHome'u render eder.
// Bot tespiti yoktur; herkese aynı HTML gider (cloaking değil).
function homeSeoFallbackPlugin() {
  return {
    name: "home-seo-fallback",
    transformIndexHtml(html) {
      // Meta açıklamaları seoContent.homeSeo ile tek kaynaktan (kampanya metni dahil).
      const description = homeSeo.description.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
      return html
        .replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`)
        .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`)
        .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`)
        .replace(
          '<div id="root"></div>',
          `<div id="root">${renderHomeSeoStatic()}</div>`,
        );
    },
  };
}

export default defineConfig({
  cacheDir: ".vite-cache",
  plugins: [react(), tailwindcss(), homeSeoFallbackPlugin()],
  build: {
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) return "react";
          if (id.includes("node_modules/firebase")) return "firebase";
          if (id.includes("node_modules/chart.js") || id.includes("node_modules/react-chartjs-2")) return "charts";
          return undefined;
        },
      },
    },
  },
});