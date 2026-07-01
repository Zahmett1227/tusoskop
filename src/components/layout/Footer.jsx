import React from "react";
import { LEGAL_PAGES } from "../../content/legalPages";
import { APP_STORE_URL } from "../../seo/seoContent";

const SEO_FOOTER_LINKS = [
  ["Tusoskop Nedir?", "/tusoskop-nedir"],
  ["TUS Hazırlık Platformu", "/tus-hazirlik-platformu"],
  ["TUS Soru Çözme Uygulaması", "/tus-soru-cozme-uygulamasi"],
  ["TUS Deneme Analizi", "/tus-deneme-analizi"],
  ["TUS Puan Hesaplama", "/tus-puan-hesaplama"],
  ["TUS Kontenjan Tablosu", "/tus-kontenjan-tablosu"],
  ["Tusoskop Özellikleri", "/tusoskop-ozellikleri"],
  ["Fiyatlandırma", "/fiyatlandirma"],
  ["Hakkımızda", "/hakkimizda"],
  ["Sık Sorulan Sorular", "/tusoskop-sss"],
  ["Gizlilik Sözleşmesi", "/gizlilik-sozlesmesi"],
  ["Kullanım Koşulları", "/kullanim-kosullari"],
  ["App Store", APP_STORE_URL],
];

/**
 * @param {(pageId: string) => void} onOpenLegal
 * @param {"default" | "premium"} variant — Plus sayfası açık zeminde
 */
export default function Footer({
  onOpenLegal,
  accentTheme,
  accentThemeKey,
  variant = "default",
}) {
  const theme = accentTheme ?? { mode: "dark" };
  const isLightTheme =
    accentThemeKey === "light" || theme?.mode === "light";

  const isPremiumSurface = variant === "premium";
  const border = isPremiumSurface
    ? "border-t border-neutral-200/90"
    : isLightTheme
      ? "border-t border-slate-200/90"
      : "border-t border-white/[0.08]";
  const textMuted = isPremiumSurface
    ? "text-neutral-600"
    : isLightTheme
      ? "text-slate-600"
      : "text-slate-400";
  const textTitle = isPremiumSurface
    ? "text-neutral-900"
    : isLightTheme
      ? "text-slate-900"
      : "text-white";
  const linkClass = isPremiumSurface
    ? "text-neutral-700 hover:text-neutral-950 underline-offset-2 hover:underline font-semibold text-left"
    : isLightTheme
      ? "text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline font-semibold text-left"
      : "text-slate-400 hover:text-white underline-offset-2 hover:underline font-semibold text-left";

  return (
    <footer
      className={`mt-12 pt-8 pb-10 ${border}`}
      style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="min-w-0 shrink-0 max-w-md">
          <p className={`text-sm font-black ${textTitle}`}>
            © 2026 Tusoskop
          </p>
          <p className={`mt-2 text-xs sm:text-sm leading-relaxed ${textMuted}`}>
            TUS hazırlığında soru çözme, deneme, AI çalışma planı, haftalık lig ve analiz sürecini destekleyen dijital platform.
          </p>
        </div>

        <nav
          aria-label="Tusoskop bağlantıları"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 min-w-0 lg:justify-end"
        >
          {SEO_FOOTER_LINKS.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className={`${linkClass} text-xs sm:text-sm py-1 sm:py-0`}
            >
              {label}
            </a>
          ))}
          {LEGAL_PAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpenLegal?.(p.id)}
              className={`${linkClass} text-xs sm:text-sm py-1 sm:py-0`}
            >
              {p.title}
            </button>
          ))}
        </nav>
      </div>
    </footer>
  );
}
