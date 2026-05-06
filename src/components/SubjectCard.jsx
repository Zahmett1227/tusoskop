import React from "react";
import { accentThemes } from "../theme/accentThemes";
import { getSubjectVisual } from "../theme/subjectVisual";

const SubjectCard = ({ subject, count, onClick, accentTheme, isLightTheme = false }) => {
  const theme = accentTheme || accentThemes.emerald;
  const subjectVisual = getSubjectVisual(subject?.name);
  const hoverBorderClass = {
    Emerald: "hover:border-emerald-400/40",
    Cyan: "hover:border-cyan-400/40",
    Violet: "hover:border-violet-400/40",
    Amber: "hover:border-amber-300/40",
  }[theme.name] || "hover:border-emerald-400/40";

  const hoverGlowClass = {
    Emerald: "hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]",
    Cyan: "hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]",
    Violet: "hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]",
    Amber: "hover:shadow-[0_0_40px_rgba(251,191,36,0.15)]",
  }[theme.name] || "hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]";

  const radialClass = {
    Emerald: "bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_60%)]",
    Cyan: "bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.15),transparent_60%)]",
    Violet: "bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.15),transparent_60%)]",
    Amber: "bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.15),transparent_60%)]",
  }[theme.name] || "bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_60%)]";

  const blurClass = {
    Emerald: "bg-emerald-400/10 group-hover:bg-emerald-400/20",
    Cyan: "bg-cyan-400/10 group-hover:bg-cyan-400/20",
    Violet: "bg-violet-400/10 group-hover:bg-violet-400/20",
    Amber: "bg-amber-300/10 group-hover:bg-amber-300/20",
  }[theme.name] || "bg-emerald-400/10 group-hover:bg-emerald-400/20";

  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full h-full overflow-hidden
        rounded-3xl border
        ${subjectVisual.border}
        ${isLightTheme ? "border-slate-300 shadow-md bg-gradient-to-br from-[#fffefb] via-[#faf8f4] to-[#ebe8e3]" : "border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950"}
        p-6 text-left
        transition-all duration-300
        hover:-translate-y-2
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
          <div className={`mb-3 inline-flex items-center gap-2 rounded-xl px-3 py-1 text-xs font-bold ${theme.text} backdrop-blur ${isLightTheme ? "bg-slate-100" : "bg-slate-800/80"}`}>
            <span className={`w-2 h-2 rounded-full ${subjectVisual.dot} shrink-0`} />
            {subject.type}
          </div>

          <h3 className={`text-xl md:text-2xl font-black leading-tight ${isLightTheme ? "text-slate-900" : "text-white"} ${theme.text} transition`}>
            {subject.name}
          </h3>

          <p className={`mt-3 text-sm leading-relaxed ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
            Mini test çöz, açıklamaları gör, tekrarını güçlendir.
          </p>
        </div>

        {/* ALT */}
        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className={`text-3xl font-black ${theme.text}`}>
              {count}
            </p>
            <p className={`text-sm ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>hazır soru</p>
          </div>

          <div className={`flex items-center gap-2 text-sm font-bold ${theme.text} transition group-hover:translate-x-1`}>
            Başla
            <span className="text-lg transition group-hover:translate-x-1">
              →
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default SubjectCard;