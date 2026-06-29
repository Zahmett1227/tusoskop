import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { renderHomeSeoStatic } from "./scripts/render-home-seo.mjs";

// Ana sayfa (/) için gerçek DOM fallback'i. SEO içeriği <noscript> içinde
// DEĞİL, doğrudan #root içinde servis edilir: curl, JS'siz tarayıcı ve AI
// tarama botları (GPTBot, ClaudeBot, PerplexityBot) içeriği okur. React mount
// olunca createRoot #root içeriğini temizleyip PublicHome'u render eder.
// Bot tespiti yoktur; herkese aynı HTML gider (cloaking değil).
function homeSeoFallbackPlugin() {
  return {
    name: "home-seo-fallback",
    transformIndexHtml(html) {
      return html.replace(
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