import {
  FREE_CAMPAIGN_END_LABEL,
  FREE_CAMPAIGN_ENDS_AT,
  FREE_CAMPAIGN_LIVE,
} from "../src/seo/seoContent.js";
import { PLUS_PLANS } from "../src/config/plusPlans.js";

// Statik (JS'siz / prerender) sayfalar için web ücretsiz kampanyası blokları.
// React tarafındaki eşleri: src/components/campaign/FreeCampaign.jsx.
// Build anında kampanya aktif değilse hiçbir şey üretilmez; aktifse inline script
// geri sayımı işletir ve bitiş anı geçince [data-free-campaign] öğelerini kaldırır.

const GRADIENT = "linear-gradient(110deg,#b45309,#be185d,#6d28d9,#047857,#b45309)";
const BORDER_GRADIENT = "linear-gradient(110deg,#f59e0b,#ec4899,#8b5cf6,#10b981,#22d3ee,#f59e0b)";

function unit(key, label) {
  return `<div style="border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);border-radius:16px;padding:10px 4px;text-align:center">
          <b data-fc-unit="${key}" style="display:block;font-size:30px;line-height:1;font-weight:900;font-variant-numeric:tabular-nums">—</b>
          <span style="display:block;margin-top:6px;font-size:10px;font-weight:900;letter-spacing:.16em;color:rgba(255,255,255,.6)">${label}</span>
        </div>`;
}

/** Geri sayım + bitişte gizleme; sayfa başına bir kez, body sonunda. */
export function renderFreeCampaignRuntime() {
  if (!FREE_CAMPAIGN_LIVE) return "";
  const end = JSON.stringify(FREE_CAMPAIGN_ENDS_AT);
  return `<style>@keyframes tfcPan{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}@media (prefers-reduced-motion:reduce){[data-fc-anim]{animation:none!important}}</style>
    <script>(function(){if(window.__tfcInit)return;window.__tfcInit=true;var end=new Date(${end}).getTime();
      function pad(n){return String(n).padStart(2,"0")}
      function tick(){var left=end-Date.now();if(!(left>0)){document.querySelectorAll("[data-free-campaign]").forEach(function(el){el.remove()});return false}
        var s=Math.floor(left/1000),v={d:Math.floor(s/86400),h:Math.floor(s%86400/3600),m:Math.floor(s%3600/60),s:s%60};
        document.querySelectorAll("[data-fc-unit]").forEach(function(el){var k=el.getAttribute("data-fc-unit");el.textContent=k==="d"?v.d:pad(v[k])});
        document.querySelectorAll("[data-fc-inline]").forEach(function(el){el.textContent=v.d+"g "+pad(v.h)+":"+pad(v.m)+":"+pad(v.s)});return true}
      if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",function(){if(tick())setInterval(tick,1000)})}else if(tick())setInterval(tick,1000)})();</script>`;
}

/** Sayfanın en üstündeki ince animasyonlu şerit. */
export function renderFreeCampaignRibbonStatic() {
  if (!FREE_CAMPAIGN_LIVE) return "";
  return `<div data-free-campaign data-fc-anim role="region" aria-label="Sınırlı süre kampanyası" style="background:${GRADIENT};background-size:320% 320%;animation:tfcPan 9s ease infinite;color:#fff;text-align:center;font-weight:800;font-size:13px;line-height:1.35;padding:8px 16px">
      🎁 <span style="text-transform:uppercase;letter-spacing:.06em">Sınırlı süre</span> · Tüm Plus özellikleri <span style="background:rgba(255,255,255,.25);border-radius:6px;padding:1px 6px;font-weight:900">ÜCRETSİZ</span> · ⏳ <span data-fc-inline style="font-variant-numeric:tabular-nums">${FREE_CAMPAIGN_END_LABEL} tarihine kadar</span>
      <a href="/giris" style="margin-left:8px;display:inline-block;background:#fff;color:#020617;border-radius:999px;padding:3px 12px;font-size:12px;font-weight:900;text-decoration:none">Ücretsiz başla →</a>
    </div>`;
}

/** Geri sayımlı büyük kampanya kartı. */
export function renderFreeCampaignBannerStatic() {
  if (!FREE_CAMPAIGN_LIVE) return "";
  return `<section data-free-campaign data-fc-anim aria-label="Sınırlı süre ücretsiz erişim kampanyası" style="margin-top:28px;border-radius:26px;padding:2px;background:${BORDER_GRADIENT};background-size:300% 300%;animation:tfcPan 8s ease infinite">
      <div style="border-radius:24px;background:#020617;color:#fff;padding:24px">
        <span data-fc-anim style="display:inline-block;border-radius:999px;padding:5px 12px;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;background:${GRADIENT};background-size:320% 320%;animation:tfcPan 9s ease infinite">🔥 Sınırlı süre fırsatı</span>
        <span style="display:inline-block;margin-left:6px;border:1px solid rgba(52,211,153,.35);border-radius:999px;padding:4px 10px;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#a7f3d0">Kart yok · Ödeme yok</span>
        <h2 style="margin:16px 0 0;font-size:clamp(24px,3.6vw,36px);line-height:1.08;letter-spacing:-.02em">🎉 Tusoskop Plus şimdi <span style="color:#f9a8d4">tamamen ÜCRETSİZ!</span></h2>
        <p style="margin:12px 0 0;color:#cbd5e1;font-size:16px;line-height:1.6"><strong style="color:#fff">${FREE_CAMPAIGN_END_LABEL} 23:59</strong>'a kadar web'de tüm Plus özellikleri senin: sınırsız soru, sınırsız deneme, akıllı tekrar, detaylı analiz ve AI çalışma planı. Süre dolunca ücretsiz plan limitleri geri gelir — bu fırsatı kaçırma.</p>
        <p style="margin:18px 0 8px;font-size:11px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:#f0abfc">⏳ Fırsatın bitmesine</p>
        <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;max-width:420px">
          ${unit("d", "GÜN")}${unit("h", "SAAT")}${unit("m", "DAKİKA")}${unit("s", "SANİYE")}
        </div>
        <a href="/giris" style="margin-top:20px;display:inline-flex;align-items:center;min-height:48px;border-radius:16px;padding:0 22px;background:${GRADIENT};background-size:320% 320%;color:#fff;font-weight:900;text-decoration:none">Hemen ücretsiz başla 🚀</a>
      </div>
    </section>`;
}

/** /fiyatlandirma plan listesi — gerçek fiyatlar src/config/plusPlans.js'ten. */
export function renderPlusPlansStatic() {
  const cta = FREE_CAMPAIGN_LIVE
    ? `<a class="cta" href="/giris">Şimdi ücretsiz başla</a>`
    : `<a class="cta" href="/app?intent=plus">Plus'a geç</a>`;
  const note = FREE_CAMPAIGN_LIVE
    ? `<p style="margin:12px 0 0;font-weight:800;color:#6ee7b7">🎁 ${FREE_CAMPAIGN_END_LABEL} tarihine kadar web'de ödeme gerekmez — tüm Plus özellikleri ücretsiz.</p>`
    : "";
  return `<section aria-label="Plus paketleri" style="margin-top:44px;border:1px solid #1e293b;background:rgba(15,23,42,.45);border-radius:22px;padding:28px">
      <p class="eyebrow" style="margin:0">Plus paketleri</p>
      <h2 style="margin-top:12px">Sınırsız soru, deneme ve tekrar</h2>
      ${note}
      <div style="margin-top:22px;display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
        ${PLUS_PLANS.map((plan) => `<div style="border:1px solid ${plan.highlight ? "rgba(110,231,183,.7)" : "#334155"};background:${plan.highlight ? "rgba(110,231,183,.1)" : "rgba(15,23,42,.5)"};border-radius:16px;padding:20px">
          <p style="font-weight:800;color:${plan.highlight ? "#6ee7b7" : "#cbd5e1"};margin:0">${plan.label}</p>
          <p style="margin-top:8px;font-size:28px;font-weight:900;color:#e2e8f0">${plan.totalPriceLabel}</p>
          <p style="margin-top:6px;color:#94a3b8;font-size:14px">${plan.durationLabel} · aylık ${plan.monthlyPriceLabel}</p>
        </div>`).join("")}
      </div>
      <div style="margin-top:22px;display:flex;gap:12px;flex-wrap:wrap">${cta}</div>
      <p style="margin-top:18px;font-size:13px;color:#64748b;line-height:1.6">Ödeme PayTR ile güvenli alınır ve onaylandığı anda hesabına tanımlanır.</p>
    </section>`;
}
