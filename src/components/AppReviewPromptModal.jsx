import React, { useEffect } from "react";
import { trackClarityEvent } from "../lib/clarity";

/**
 * Nazik değerlendirme ön-sorusu.
 * Beğenenler App Store değerlendirmesine, beğenmeyenler geri bildirim e-postasına
 * yönlendirilir (herkese açık düşük puan yerine özel geri bildirim).
 */
export default function AppReviewPromptModal({
  open,
  onLike,
  onDislike,
  onClose,
  mailtoFeedback,
}) {
  useEffect(() => {
    if (!open) return;
    try {
      trackClarityEvent("app_review_prompt_shown");
    } catch {
      /* sessiz */
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0a0d15] p-6 text-white shadow-[0_28px_80px_-28px_rgba(0,0,0,0.8)]">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-3xl">
            ⭐
          </div>
        </div>

        <h3 className="text-center text-xl font-black leading-tight text-white">
          Tusoskop’u beğendin mi?
        </h3>
        <p className="mt-2 text-center text-sm font-medium leading-relaxed text-slate-300">
          Kısa bir geri bildirimin bize çok yardımcı olur. Deneyimin nasıl?
        </p>

        <button
          type="button"
          onClick={() => {
            try {
              trackClarityEvent("app_review_like");
            } catch {
              /* sessiz */
            }
            onLike?.();
          }}
          className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 text-base font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition-transform hover:scale-[1.01] active:scale-95"
        >
          Evet, beğendim 💚
        </button>

        <a
          href={mailtoFeedback || "#"}
          onClick={() => {
            try {
              trackClarityEvent("app_review_dislike");
            } catch {
              /* sessiz */
            }
            onDislike?.();
          }}
          className="mt-2 flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] px-6 text-sm font-bold text-slate-200 transition hover:bg-white/[0.08]"
        >
          Daha iyi olabilir
        </a>

        <button
          type="button"
          onClick={() => onClose?.()}
          className="mt-2 min-h-[40px] w-full rounded-2xl px-6 text-xs font-bold text-slate-500 transition hover:text-slate-300"
        >
          Şimdi değil
        </button>
      </div>
    </div>
  );
}
