import React from "react";
import { accentThemes } from "../theme/accentThemes";
import { getSubjectVisual } from "../theme/subjectVisual";

const SUBJECT_ICONS = {
  Anatomi: "🧠",
  Fizyoloji: "⚙️",
  Biyokimya: "🧪",
  Mikrobiyoloji: "🦠",
  Patoloji: "🔬",
  Farmakoloji: "💊",
  Dahiliye: "🩺",
  Pediatri: "🧸",
  "Genel Cerrahi": "🏥",
  "Kadın Hastalıkları ve Doğum": "🌸",
  "Küçük Stajlar": "📚",
};

const SubjectCard = ({
  subject,
  count,
  onClick,
  accentTheme,
  isLightTheme = false,
  wrongCount = 0,
}) => {
  const theme = accentTheme || accentThemes.emerald;
  const subjectVisual = getSubjectVisual(subject?.name);
  /** Görsel ölçek: 500 soru = %100 (kişisel ilerleme değil, havuz büyüklüğü) */
  const poolFillPercent = Math.min(100, Math.max(0, Math.round((count / 500) * 100)));
  const barWidthPercent = Math.min(100, Math.max(8, poolFillPercent || 8));
  const icon = SUBJECT_ICONS[subject?.name] || "📘";
  const hoverBorderClass = {
    Emerald: "hover:border-emerald-400/40",
    Cyan: "hover:border-cyan-400/40",
    Violet: "hover:border-violet-400/40",
    Amber: "hover:border-amber-300/40",
  }[theme.name] || "hover:border-emerald-400/40";

  const hoverGlowClass = {
    Emerald: "hover:shadow-[0_0_36px_rgba(16,185,129,0.10)]",
    Cyan: "hover:shadow-[0_0_36px_rgba(34,211,238,0.10)]",
    Violet: "hover:shadow-[0_0_36px_rgba(168,85,247,0.10)]",
    Amber: "hover:shadow-[0_0_36px_rgba(251,191,36,0.10)]",
  }[theme.name] || "hover:shadow-[0_0_36px_rgba(16,185,129,0.10)]";

  const radialClass = {
    Emerald: "bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.10),transparent_60%)]",
    Cyan: "bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.10),transparent_60%)]",
    Violet: "bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.10),transparent_60%)]",
    Amber: "bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.10),transparent_60%)]",
  }[theme.name] || "bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.10),transparent_60%)]";

  const blurClass = {
    Emerald: "bg-emerald-400/[0.07] group-hover:bg-emerald-400/15",
    Cyan: "bg-cyan-400/[0.07] group-hover:bg-cyan-400/15",
    Violet: "bg-violet-400/[0.07] group-hover:bg-violet-400/15",
    Amber: "bg-amber-300/[0.07] group-hover:bg-amber-300/15",
  }[theme.name] || "bg-emerald-400/[0.07] group-hover:bg-emerald-400/15";

  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full h-full overflow-hidden
        rounded-3xl border
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${isLightTheme ? "focus-visible:ring-offset-[#faf8f4]" : "focus-visible:ring-offset-slate-950"}
        ${theme.ring}
        ${subjectVisual.border}
        ${isLightTheme ? "border-slate-200 shadow-sm bg-white" : "border-white/[0.08] bg-white/[0.025] backdrop-blur-xl"}
        p-5 text-left md:p-6
        transition-all duration-300
        hover:-translate-y-px
        ${hoverBorderClass}
        ${hoverGlowClass}
      `}
    >
      {/* Glow layer */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 ${radialClass}`} />

      {/* Floating blur */}
      <div className={`absolute -top-10 -right-10 w-28 h-28 blur-3xl rounded-full transition-all duration-500 ${blurClass}`} />

      <div className="relative z-10 flex h-full flex-col justify-between">
        {/* ÜST */}
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-1 text-xs font-bold ${theme.text} backdrop-blur ${isLightTheme ? "bg-slate-100" : "bg-white/[0.06]"}`}>
              <span className={`w-2 h-2 rounded-full ${subjectVisual.dot} shrink-0`} />
              {subject.type}
            </div>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-xl ${isLightTheme ? "border-slate-200 bg-white" : "border-white/10 bg-black/30"}`}>
              {icon}
            </span>
          </div>

          <h3 className={`text-xl md:text-2xl font-black leading-tight break-words min-w-0 ${isLightTheme ? "text-slate-900" : "text-white"} transition`}>
            {subject.name}
          </h3>

          <p className={`mt-3 text-sm leading-relaxed ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
            Mini test çöz, açıklamaları gör, tekrarını güçlendir.
          </p>
        </div>

        {/* ALT */}
        <div className="mt-6">
          <div className={`mb-4 h-2 overflow-hidden rounded-full ${isLightTheme ? "bg-slate-200" : "bg-white/10"}`}>
            <div
              className={`h-full rounded-full ${subjectVisual.bar} transition-all duration-500`}
              style={{ width: `${barWidthPercent}%` }}
            />
          </div>

          <div className={`flex items-center justify-between gap-2 text-sm font-bold ${theme.text} transition`}>
            <span>Çözmeye başla</span>
            <div className="flex items-center gap-2">
              {wrongCount > 0 ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                    wrongCount >= 4
                      ? isLightTheme
                        ? "bg-red-100 text-red-800"
                        : "bg-red-500/20 text-red-300"
                      : isLightTheme
                        ? "bg-amber-100 text-amber-800"
                        : "bg-amber-500/20 text-amber-200"
                  }`}
                >
                  {wrongCount} yanlış{wrongCount >= 4 ? " ⚠" : ""}
                </span>
              ) : null}
              <span className="text-lg transition group-hover:translate-x-1">→</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default SubjectCard;