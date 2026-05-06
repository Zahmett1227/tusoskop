import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  cacheDir: ".vite-cache",
  plugins: [react(), tailwindcss()],
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