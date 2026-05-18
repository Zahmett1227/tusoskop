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
  const skipClass = isLightTheme
    ? "text-slate-500 hover:text-slate-700"
    : "text-slate-500 hover:text-slate-300";

  return (
    <div className="w-full max-w-xl mx-auto">
      <p className={`mb-2.5 text-xs font-semibold ${titleClass}`}>
        Bu soruyu ne kadar zorlandın?
      </p>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
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
                <span className="text-[10px] font-black leading-tight sm:text-xs">{opt.label}</span>
                <span className="mt-0.5 text-[9px] font-medium opacity-80 leading-tight">{opt.hint}</span>
              </>
            )}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          disabled={loading}
          onClick={() => onSkip?.()}
          className={`text-xs font-bold underline-offset-2 transition hover:underline disabled:opacity-50 ${skipClass}`}
        >
          Geç →
        </button>
      </div>
    </div>
  );
}
