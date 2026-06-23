import React from "react";

export const APP_STORE_URL = "https://apps.apple.com/tr/app/tusoskop/id6776331691?l=tr";

/**
 * Apple "App Store'dan İndir" rozeti — resmi badge stilinde, link gömülü.
 * Yeni sekmede App Store sayfasını açar.
 */
export default function AppStoreBadge({ className = "" }) {
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Tusoskop'u App Store'dan indir"
      className={`inline-flex items-center gap-3 rounded-2xl border border-slate-700 bg-black px-5 py-3 shadow-lg shadow-black/30 transition-transform hover:scale-[1.03] active:scale-95 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="currentColor" aria-hidden>
        <path d="M16.45 12.72c-.02-2.24 1.83-3.32 1.91-3.37-1.04-1.52-2.65-1.73-3.22-1.75-1.37-.14-2.67.8-3.36.8-.7 0-1.77-.78-2.91-.76-1.5.02-2.88.87-3.65 2.21-1.56 2.7-.4 6.7 1.12 8.89.74 1.07 1.63 2.28 2.79 2.23 1.12-.04 1.54-.72 2.9-.72 1.35 0 1.74.72 2.93.7 1.21-.02 1.98-1.09 2.72-2.16.85-1.24 1.2-2.44 1.22-2.5-.03-.01-2.34-.9-2.36-3.57z" />
        <path d="M14.24 6.15c.62-.75 1.04-1.79.92-2.83-.89.04-1.96.59-2.6 1.34-.57.66-1.07 1.72-.94 2.73.99.08 2-.5 2.62-1.24z" />
      </svg>
      <span className="flex flex-col leading-none text-left">
        <span className="text-[10px] font-medium text-slate-300">İndir</span>
        <span className="text-lg font-semibold text-white tracking-tight">App Store</span>
      </span>
    </a>
  );
}
