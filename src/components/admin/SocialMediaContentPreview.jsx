import React, { useState } from "react";

function InlineSvg({ svg, svgUrl, alt, className }) {
  if (svg) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: svg }}
        className={`overflow-hidden [&>svg]:w-full [&>svg]:h-auto [&>svg]:block ${className ?? ""}`}
      />
    );
  }
  if (svgUrl) {
    return <img src={svgUrl} alt={alt} className={className} />;
  }
  return (
    <div className={`flex items-center justify-center bg-slate-800 text-slate-500 text-sm ${className ?? ""}`}>
      Görsel yok
    </div>
  );
}

/** @param {{ content: object, phoneFrame?: boolean }} props */
export default function SocialMediaContentPreview({ content, phoneFrame = true }) {
  const [carouselIndex, setCarouselIndex] = useState(0);

  if (!content) return null;

  const slides =
    content.carouselSlides?.length > 0
      ? content.carouselSlides
      : content.visualUrl
        ? [{ svgUrl: content.visualUrl, svg: content.visualSvg, index: 0 }]
        : [];

  const activeSlide = slides[carouselIndex] || slides[0];
  const isCarousel = slides.length > 1;

  const frameClass = phoneFrame
    ? "mx-auto max-w-[280px] rounded-[2rem] border-[3px] border-slate-600 bg-slate-950 p-2 shadow-2xl shadow-black/50"
    : "";

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-emerald-400">
            {isCarousel ? `Carousel · ${slides.length} slayt` : "Post görseli"}
          </p>
          {content.visualMode === "carousel" ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              1080×1350
            </span>
          ) : null}
        </div>

        <div className={frameClass}>
          {activeSlide ? (
            <InlineSvg
              svg={activeSlide.svg}
              svgUrl={activeSlide.svgUrl}
              alt={content.title || "Post önizleme"}
              className="w-full rounded-2xl bg-slate-950"
            />
          ) : (
            <div className="h-48 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 text-sm">
              Görsel yok
            </div>
          )}
        </div>

        {isCarousel ? (
          <div className="mt-3 flex items-center justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCarouselIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === carouselIndex
                    ? "w-6 bg-emerald-400"
                    : "w-2 bg-slate-600 hover:bg-slate-500"
                }`}
                aria-label={`Slayt ${i + 1}`}
              />
            ))}
          </div>
        ) : null}

        {isCarousel ? (
          <div className="mt-2 flex justify-between">
            <button
              type="button"
              disabled={carouselIndex <= 0}
              onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))}
              className="text-xs font-bold text-slate-400 disabled:opacity-30"
            >
              ← Önceki
            </button>
            <span className="text-xs text-slate-500">
              {carouselIndex + 1} / {slides.length}
              {slides[carouselIndex]?.slideRole ? ` · ${slides[carouselIndex].slideRole}` : ""}
            </span>
            <button
              type="button"
              disabled={carouselIndex >= slides.length - 1}
              onClick={() => setCarouselIndex((i) => Math.min(slides.length - 1, i + 1))}
              className="text-xs font-bold text-slate-400 disabled:opacity-30"
            >
              Sonraki →
            </button>
          </div>
        ) : null}
      </div>

      {(content.storyVisualUrl || content.storyVisualSvg) ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-xs font-bold text-emerald-400 mb-2">Story · 9:16</p>
          <div
            className={
              phoneFrame
                ? "mx-auto max-w-[200px] rounded-[1.75rem] border-[3px] border-slate-600 bg-slate-950 p-1.5"
                : ""
            }
          >
            <InlineSvg
              svg={content.storyVisualSvg}
              svgUrl={content.storyVisualUrl}
              alt="Story"
              className="w-full rounded-xl bg-slate-950"
            />
          </div>
        </div>
      ) : null}

      {(content.storyAnswerVisualUrl || content.storyAnswerVisualSvg) ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-xs font-bold text-emerald-400 mb-2">Cevap Story · 9:16</p>
          <div
            className={
              phoneFrame
                ? "mx-auto max-w-[200px] rounded-[1.75rem] border-[3px] border-slate-600 bg-slate-950 p-1.5"
                : ""
            }
          >
            <InlineSvg
              svg={content.storyAnswerVisualSvg}
              svgUrl={content.storyAnswerVisualUrl}
              alt="Cevap Story"
              className="w-full rounded-xl bg-slate-950"
            />
          </div>
        </div>
      ) : null}

      <div className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <p className="text-xs font-bold text-slate-400 mb-2">Caption</p>
        <pre className="whitespace-pre-wrap text-sm text-slate-200 font-medium leading-relaxed">
          {content.caption || content.storyText || "—"}
        </pre>
        {content.hashtags?.length ? (
          <p className="mt-3 text-xs text-emerald-400/90">{content.hashtags.join(" ")}</p>
        ) : null}
      </div>
    </div>
  );
}
