import React from "react";

function Metric({ label, value, className = "text-white" }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-black ${className}`}>{value}</p>
    </div>
  );
}

export default function FsrsTodaySummaryCard({ stats, accentTheme, loading }) {
  const theme = accentTheme || {};
  const textClass = theme.text || "text-emerald-300";
  const data = stats || {};

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/55 p-5">
        <div className="h-4 w-40 animate-pulse rounded-full bg-slate-800" />
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-800/70" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/95 via-slate-900/75 to-slate-950 p-5 shadow-2xl shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.22em] ${textClass}`}>
            Bugünkü Tekrar Hafızan
          </p>
          <h2 className="mt-1 text-xl font-black text-white">
            Bugün tekrar hafızan çalışıyor.
          </h2>
        </div>
        <span className="rounded-2xl border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-[10px] font-black text-violet-200">
          FSRS
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Metric label="Eklenen" value={data.addedCount || 0} className={textClass} />
        <Metric label="Tekrar" value={data.reviewedCount || 0} className="text-cyan-200" />
        <Metric label="Bekleyen" value={data.dueCountSnapshot || 0} className="text-amber-200" />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
          Kaynak kırılımı
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-black text-rose-300">{data.wrongAddedCount || 0}</p>
            <p className="text-[11px] text-slate-500">Yanlışlardan</p>
          </div>
          <div>
            <p className="text-lg font-black text-amber-300">{data.favoriteAddedCount || 0}</p>
            <p className="text-[11px] text-slate-500">Favorilerden</p>
          </div>
          <div>
            <p className="text-lg font-black text-sky-300">{data.manualAddedCount || 0}</p>
            <p className="text-[11px] text-slate-500">Manuel</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Yanlışlardan gelen tekrarlar öğrenmenin yakıtı.
        </p>
      </div>
    </div>
  );
}

