import React from "react";

const SubjectCard = ({ subject, count, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="
        group relative w-full h-full overflow-hidden
        rounded-3xl border border-slate-800
        bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950
        p-6 text-left
        transition-all duration-300
        hover:-translate-y-2
        hover:border-emerald-400/40
        hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]
      "
    >
      {/* Glow layer */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_60%)]" />

      {/* Floating blur */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-400/10 blur-3xl rounded-full group-hover:bg-emerald-400/20 transition-all duration-500" />

      <div className="relative z-10 flex h-full flex-col justify-between">
        {/* ÜST */}
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-xl bg-slate-800/80 px-3 py-1 text-xs font-bold text-emerald-300 backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {subject.type}
          </div>

          <h3 className="text-xl md:text-2xl font-black leading-tight text-white group-hover:text-emerald-300 transition">
            {subject.name}
          </h3>

          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Mini test çöz, açıklamaları gör, tekrarını güçlendir.
          </p>
        </div>

        {/* ALT */}
        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-3xl font-black text-emerald-400">
              {count}
            </p>
            <p className="text-sm text-slate-500">hazır soru</p>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-emerald-300 transition group-hover:translate-x-1">
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