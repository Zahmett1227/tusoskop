import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { renderHomeSeoNoscript } from "./scripts/render-home-seo.mjs";

// Ana sayfa (/) için JS'siz okunabilir içerik. AI tarama botları (GPTBot,
// ClaudeBot, PerplexityBot) bu <noscript> bloğunu okur; JS'li kullanıcı görmez.
function homeSeoNoscriptPlugin() {
  return {
    name: "home-seo-noscript",
    transformIndexHtml(html) {
      return html.replace(
        '<div id="root"></div>',
        `<div id="root"></div>\n    ${renderHomeSeoNoscript()}`,
      );
    },
  };
}

export default defineConfig({
  cacheDir: ".vite-cache",
  plugins: [react(), tailwindcss(), homeSeoNoscriptPlugin()],
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