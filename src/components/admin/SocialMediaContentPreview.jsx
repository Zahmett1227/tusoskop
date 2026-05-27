import React, { useState, useEffect } from "react";
import StoryCard from "../social/StoryCard.jsx";

/** Simple promo slide preview (matches post_template.html slide 3). */
function PromoSlide({ previewWidth }) {
  const W = 1080;
  const H = 1350;
  const scale = previewWidth ? previewWidth / W : 1;

  const card = (
    <div
      style={{
        width: W,
        height: H,
        background:
          "radial-gradient(ellipse 70% 55% at 50% 20%, rgba(16,185,129,0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(16,185,129,0.10) 0%, transparent 55%), linear-gradient(180deg, #01030f 0%, #050e18 40%, #01030f 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="160" height="160" style={{ marginBottom: 36 }}>
        <rect width="512" height="512" rx="110" fill="#020617" />
        <rect x="130" y="148" width="252" height="52" rx="26" fill="#34d399" />
        <rect x="230" y="196" width="52" height="180" rx="26" fill="#34d399" />
        <circle cx="392" cy="380" r="48" fill="#059669" opacity="0.4" />
        <rect x="375" y="362" width="34" height="10" rx="5" fill="#34d399" />
        <rect x="387" y="350" width="10" height="34" rx="5" fill="#34d399" />
      </svg>

      {/* Brand name */}
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 80, fontWeight: 900, letterSpacing: "0.08em", color: "#fff", textAlign: "center", marginBottom: 10 }}>
        TUSOS<span style={{ color: "#34d399" }}>KOP</span>
      </div>

      {/* Divider */}
      <div style={{ width: 120, height: 3, background: "linear-gradient(90deg, transparent, #34d399, transparent)", margin: "20px auto 36px", borderRadius: 2 }} />

      {/* Lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "center" }}>
        {["TUSOSKOP'la soru çöz.", "Eksiklerini öğren.", "Hedefine bir adım at."].map((line, i) => (
          <div key={i} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 38, fontWeight: 700, color: "#dde6f0" }}>
            {line}
          </div>
        ))}
      </div>

      {/* URL */}
      <div style={{ marginTop: 44, fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 900, letterSpacing: "0.10em", color: "#34d399" }}>
        tusoskop.com
      </div>
    </div>
  );

  if (!previewWidth) return card;
  return (
    <div style={{ width: previewWidth, height: Math.round(H * scale), overflow: "hidden", position: "relative", borderRadius: 12 }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
        {card}
      </div>
    </div>
  );
}

function slideDataUrl(slide) {
  if (slide?.svgUrl) return slide.svgUrl;
  if (slide?.svg) return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(slide.svg)}`;
  return "";
}

function SvgSlidePreview({ slide, previewWidth }) {
  const W = slide.width || 1080;
  const H = slide.height || 1350;
  const src = slideDataUrl(slide);
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      style={{
        width: previewWidth,
        height: Math.round((H / W) * previewWidth),
        display: "block",
        borderRadius: 12,
        objectFit: "cover",
      }}
    />
  );
}

function normalizeOptions(options = []) {
  return options
    .map((opt, index) => ({
      letter: opt?.letter || String.fromCharCode(65 + index),
      text: String(opt?.text || opt || "").trim(),
    }))
    .filter((opt) => opt.text);
}

function parseQuestionFromCaption(caption = "") {
  const optionRe = /^([A-E])\)\s*(.+)$/;
  const options = [];
  const questionLines = [];
  let collectingQuestion = false;

  for (const raw of String(caption).split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const opt = line.match(optionRe);
    if (opt) {
      options.push({ letter: opt[1], text: opt[2].trim() });
      collectingQuestion = false;
      continue;
    }
    if (options.length || line.startsWith("#") || line.includes("Tusoskop")) continue;
    if (!collectingQuestion && line.length < 60) continue;
    collectingQuestion = true;
    questionLines.push(line);
  }

  return {
    questionText: questionLines.join(" ").trim(),
    options,
  };
}

function getPreviewData(content) {
  const visualSpec = content.visualSpec || {};
  const storyVisualSpec = content.storyVisualSpec || {};
  const answerSpec = content.storyAnswerVisualSpec || {};
  const parsed = parseQuestionFromCaption(content.caption);
  const answerPayload = content.answerPayload || {};

  return {
    questionText:
      storyVisualSpec.questionText ||
      visualSpec.questionText ||
      content.questionText ||
      parsed.questionText ||
      "",
    options: normalizeOptions(
      (storyVisualSpec.options?.length && storyVisualSpec.options) ||
      (visualSpec.options?.length && visualSpec.options) ||
      (content.options?.length && content.options) ||
      parsed.options
    ),
    ders: content.sourceDers || visualSpec.ders || storyVisualSpec.ders || content.ders || "",
    konu: content.sourceKonu || visualSpec.konu || storyVisualSpec.konu || content.konu || "",
    correctIndex:
      answerPayload.correctIndex ??
      answerSpec.correctIndex ??
      content.correctIndex ??
      -1,
    explanation:
      answerPayload.explanation ||
      answerSpec.explanation ||
      content.explanation ||
      "",
  };
}

/** @param {{ content: object, phoneFrame?: boolean }} props */
export default function SocialMediaContentPreview({ content, phoneFrame = true }) {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    setSlideIndex(0);
  }, [content?.id]);

  if (!content) return null;

  const preview = getPreviewData(content);

  const PREVIEW_W = 280;

  const frameClass = phoneFrame
    ? "mx-auto max-w-[300px] rounded-[1.75rem] border-[3px] border-slate-600 bg-slate-950 p-1.5 overflow-hidden"
    : "";

  // Prefer HTML/CSS StoryCard when we have structured question data.
  // SVG slides (from old pipeline) can't load web fonts inside <img> tags.
  const useStoryCard = Boolean(preview.questionText);
  const savedSlides = !useStoryCard && Array.isArray(content.carouselSlides)
    ? content.carouselSlides.filter((slide) => slideDataUrl(slide))
    : [];

  const slides = savedSlides.length
    ? savedSlides.map((slide, i) => ({
        label: ["Soru", "Cevap", "Promo"][i] || `Slayt ${i + 1}`,
        node: <SvgSlidePreview slide={slide} previewWidth={PREVIEW_W} />,
      }))
    : [
        {
          label: "Soru",
          node: (
            <StoryCard
              ders={preview.ders}
              konu={preview.konu}
              questionText={preview.questionText}
              options={preview.options}
              previewWidth={PREVIEW_W}
            />
          ),
        },
        {
          label: "Cevap",
          node: (
            <StoryCard
              ders={preview.ders}
              konu={preview.konu}
              questionText={preview.questionText}
              options={preview.options}
              showAnswer
              correctIndex={preview.correctIndex}
              explanation={preview.explanation}
              previewWidth={PREVIEW_W}
            />
          ),
        },
        { label: "Promo", node: <PromoSlide previewWidth={PREVIEW_W} /> },
      ];

  const active = slides[slideIndex] || slides[0];

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Carousel preview */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-emerald-400">
            Carousel · {slides.length} slayt · 1080×1350
          </p>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {active.label}
          </span>
        </div>

        <div className={frameClass}>
          {active.node}
        </div>

        {/* Dot nav */}
        <div className="mt-3 flex items-center justify-center gap-2">
          {slides.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlideIndex(i)}
              className={`h-2 rounded-full transition-all ${i === slideIndex ? "w-8 bg-emerald-400" : "w-2 bg-slate-600 hover:bg-slate-500"}`}
              aria-label={s.label}
            />
          ))}
        </div>

        {/* Arrow nav */}
        <div className="mt-2 flex justify-between">
          <button
            type="button"
            disabled={slideIndex <= 0}
            onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
            className="text-xs font-bold text-slate-400 disabled:opacity-30"
          >
            ← Önceki
          </button>
          <span className="text-xs text-slate-500">{slideIndex + 1} / {slides.length} · {active.label}</span>
          <button
            type="button"
            disabled={slideIndex >= slides.length - 1}
            onClick={() => setSlideIndex((i) => Math.min(slides.length - 1, i + 1))}
            className="text-xs font-bold text-slate-400 disabled:opacity-30"
          >
            Sonraki →
          </button>
        </div>
      </div>

      {/* Caption */}
      <div className="md:col-span-1 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <p className="text-xs font-bold text-slate-400 mb-2">Caption</p>
        <pre className="whitespace-pre-wrap text-sm text-slate-200 font-medium leading-relaxed">
          {content.caption || "—"}
        </pre>
        {content.hashtags?.length ? (
          <p className="mt-3 text-xs text-emerald-400/90">{content.hashtags.join(" ")}</p>
        ) : null}
      </div>
    </div>
  );
}
