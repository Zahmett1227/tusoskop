function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * @param {{
 *   statusMessage: string,
 *   appStoreUrl: string,
 *   webUrl: string,
 *   redirectUrl: string,
 *   appStoreDeepLink: string,
 *   platform: string,
 * }} params
 */
export function renderRedirectPage({
  statusMessage,
  appStoreUrl,
  webUrl,
  redirectUrl,
  appStoreDeepLink,
  platform,
}) {
  const isIos = platform === "ios";
  const autoRedirectScript = isIos
    ? `window.location.replace(${JSON.stringify(appStoreDeepLink)});
       window.setTimeout(function () {
         window.location.replace(${JSON.stringify(redirectUrl)});
       }, 900);`
    : `window.location.replace(${JSON.stringify(redirectUrl)});`;

  return `<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Tusoskop — Yönlendiriliyor</title>
    <link rel="icon" href="/favicon.png" type="image/png" />
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 24px;
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
        background: #05070d;
        color: #e2e8f0;
      }
      main {
        width: min(100%, 26rem);
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.025);
        backdrop-filter: blur(16px);
        border-radius: 1.75rem;
        padding: 2rem 1.5rem;
      }
      .mark {
        width: 3rem;
        height: 3rem;
        margin: 0 auto 1rem;
        border-radius: 999px;
        border: 2px solid rgba(16, 185, 129, 0.35);
        border-top-color: #34d399;
        animation: spin 0.9s linear infinite;
      }
      h1 { margin: 0 0 0.5rem; font-size: 1.125rem; font-weight: 800; }
      p { margin: 0; color: #94a3b8; font-size: 0.9375rem; line-height: 1.5; }
      .links { margin-top: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
      a { color: #6ee7b7; font-weight: 700; text-decoration: none; }
      a:hover { text-decoration: underline; }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <main>
      <div class="mark" aria-hidden="true"></div>
      <h1>Tusoskop'a yönlendiriliyorsun</h1>
      <p id="status">${escapeHtml(statusMessage)}</p>
      <div class="links">
        <a id="ios-link" href="${escapeHtml(appStoreUrl)}">App Store'da Aç</a>
        <a id="web-link" href="${escapeHtml(webUrl)}">Web Sitesine Git</a>
      </div>
    </main>
    <script>
      (function () {
        ${autoRedirectScript}
      })();
    </script>
  </body>
</html>`;
}
