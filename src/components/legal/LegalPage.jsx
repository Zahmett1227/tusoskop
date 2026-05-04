import React from "react";
import { getLegalPageById } from "../../content/legalPages";

export default function LegalPage({
  pageId,
  onBack,
  accentTheme,
  accentThemeKey,
}) {
  const theme = accentTheme;
  const isLightTheme =
    accentThemeKey === "light" || theme?.mode === "light";

  const page = getLegalPageById(pageId);
  const shell = isLightTheme
    ? "min-h-dvh bg-[#faf8f4] text-slate-950"
    : "min-h-dvh bg-slate-950 text-white";
  const card = isLightTheme
    ? "bg-white border border-slate-200/90 shadow-lg text-slate-900"
    : "bg-slate-900/80 border border-slate-800 text-slate-100";
  const muted = isLightTheme ? "text-slate-600" : "text-slate-400";
  const bodyText = isLightTheme ? "text-slate-700" : "text-slate-300";
  const btn = isLightTheme
    ? "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
    : "border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800";

  if (!page) {
    return (
      <div className={`${shell} px-4 py-8 font-sans`}>
        <div className="max-w-4xl mx-auto">
          <p className={muted}>Bu yasal metin bulunamadı.</p>
          <button
            type="button"
            onClick={onBack}
            className={`mt-6 min-h-11 px-5 rounded-2xl font-bold text-sm ${btn}`}
          >
            Geri dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${shell} px-4 py-6 md:px-6 md:py-10 font-sans`}
      style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }}
    >
      <div className="max-w-4xl mx-auto w-full min-w-0">
        <button
          type="button"
          onClick={onBack}
          className={`mb-5 min-h-10 inline-flex items-center gap-2 rounded-2xl px-4 text-sm font-bold transition ${btn}`}
        >
          ← Geri dön
        </button>

        <article
          className={`rounded-3xl p-5 sm:p-8 md:p-10 ${card}`}
        >
          <header
            className={`mb-8 pb-6 border-b ${
              isLightTheme ? "border-slate-200" : "border-slate-700/80"
            }`}
          >
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {page.title}
            </h1>
            <p className={`mt-3 text-sm font-semibold ${muted}`}>
              Son güncelleme: {page.updatedAt}
            </p>
            <p className={`mt-2 text-xs ${muted}`}>
              Bu metin taslak niteliğindedir; yürürlükteki mevzuat ve iş
              uygulamalarına göre güncellenebilir.
            </p>
          </header>

          <div className="space-y-8 text-sm md:text-base leading-relaxed">
            {page.content.map((section, idx) => (
              <section key={`${page.id}-${idx}`} className="min-w-0">
                <h2 className="text-base md:text-lg font-bold text-current mb-3">
                  {section.heading}
                </h2>
                <div className="space-y-3">
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className={`${bodyText} text-[15px] md:text-base`}>
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>

        <div className="h-8 md:h-12" aria-hidden />
      </div>
    </div>
  );
}
