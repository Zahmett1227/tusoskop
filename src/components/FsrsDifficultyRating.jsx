import React, { useState } from "react";
import { updateSmartReviewGrade } from "../services/smartReviewService";

const OPTIONS = [
  {
    grade: "again",
    label: "Çok Zor",
    hint: "yarın tekrar",
    border: "border-rose-500/50",
    bg: "bg-rose-500/10 hover:bg-rose-500/20",
    text: "text-rose-300",
    active: "ring-rose-400/60",
  },
  {
    grade: "hard",
    label: "Zor",
    hint: "4 gün sonra",
    border: "border-amber-500/50",
    bg: "bg-amber-500/10 hover:bg-amber-500/20",
    text: "text-amber-200",
    active: "ring-amber-400/60",
  },
  {
    grade: "good",
    label: "Normal",
    hint: "10 gün sonra",
    border: "border-emerald-500/50",
    bg: "bg-emerald-500/10 hover:bg-emerald-500/20",
    text: "text-emerald-200",
    active: "ring-emerald-400/60",
  },
  {
    grade: "easy",
    label: "Kolay",
    hint: "28 gün sonra",
    border: "border-cyan-500/50",
    bg: "bg-cyan-500/10 hover:bg-cyan-500/20",
    text: "text-cyan-200",
    active: "ring-cyan-400/60",
  },
];

export default function FsrsDifficultyRating({
  question,
  user,
  isLightTheme = false,
  accentTheme,
  onRated,
  onSkip,
}) {
  const [loading, setLoading] = useState(false);
  const ringClass = accentTheme?.ring || "focus-visible:ring-violet-400/50";

  const handleSelect = async (grade) => {
    if (loading) return;
    setLoading(true);
    try {
      if (user?.uid && question) {
        await updateSmartReviewGrade(user, question, grade);
      }
    } catch {
      /* sessiz */
    } finally {
      setLoading(false);
      onRated?.(grade);
    }
  };

  const titleClass = isLightTheme ? "text-slate-500" : "text-slate-400";

  return (
    <div className="w-full max-w-xl mx-auto">
      <p className={`mb-2.5 text-xs font-semibold ${titleClass}`}>
        Bu soruyu ne kadar zorlandın?
      </p>
      <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-4 min-[400px]:gap-1.5 sm:gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.grade}
            type="button"
            disabled={loading}
            onClick={() => handleSelect(opt.grade)}
            className={`flex min-h-[4.25rem] flex-col items-center justify-center rounded-xl border px-1 py-2 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${opt.border} ${opt.bg} ${opt.text} ${ringClass} ${
              isLightTheme ? "focus-visible:ring-offset-white" : "focus-visible:ring-offset-slate-950"
            } active:scale-[0.98] hover:-translate-y-px`}
          >
            {loading ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden
              />
            ) : (
              <>
                <span className="text-xs font-black leading-tight sm:text-sm">{opt.label}</span>
                <span className="mt-0.5 text-[10px] font-medium opacity-80 leading-tight">{opt.hint}</span>
              </>
            )}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className={`text-[10px] font-medium ${isLightTheme ? "text-slate-400" : "text-slate-600"}`}>
          İstersen şimdi değerlendirmeden geçebilirsin
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={() => onSkip?.()}
          className={`shrink-0 min-h-[36px] px-4 rounded-xl border text-xs font-bold transition-all disabled:opacity-50 active:scale-[0.97] ${
            isLightTheme
              ? "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-400"
              : "border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:border-white/[0.16]"
          }`}
        >
          Geç →
        </button>
      </div>
    </div>
  );
}
