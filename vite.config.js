import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const clarityProjectId = env.VITE_CLARITY_PROJECT_ID;

  return {
    cacheDir: ".vite-cache",
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "clarity-head-snippet",
        transformIndexHtml(html) {
          if (!clarityProjectId) return html;
          const idLiteral = JSON.stringify(clarityProjectId);
          const snippet = `
    <!-- Microsoft Clarity (resmi snippet; ID: VITE_CLARITY_PROJECT_ID) -->
    <script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", ${idLiteral});
    </script>`;
          return html.replace("</head>", `${snippet}\n  </head>`);
        },
      },
    ],
    build: {
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
  };
});
