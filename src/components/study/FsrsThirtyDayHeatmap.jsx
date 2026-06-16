import React from "react";

function intensityClass(value, maxValue) {
  if (!value) return "bg-slate-800/60 border-slate-700/60";
  const ratio = value / Math.max(1, maxValue);
  if (ratio >= 0.75) return "bg-emerald-300 border-emerald-200";
  if (ratio >= 0.45) return "bg-emerald-400/75 border-emerald-300/50";
  if (ratio >= 0.2) return "bg-emerald-500/40 border-emerald-400/30";
  return "bg-emerald-500/20 border-emerald-500/20";
}

export default function FsrsThirtyDayHeatmap({ stats = [] }) {
  const total = stats.reduce((sum, item) => sum + Number(item.addedCount || 0), 0);
  const activeDays = stats.filter((item) => Number(item.addedCount || 0) > 0).length;
  const maxValue = Math.max(1, ...stats.map((item) => Number(item.addedCount || 0)));

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/55 p-5">
      <div>
        <h3 className="text-base font-black text-white">Son 30 Gün Aktivite</h3>
        <p className="mt-1 text-xs text-slate-500">
          FSRS yükün birikmeden çözülmeli.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-10 gap-1.5">
        {stats.map((item) => {
          const value = Number(item.addedCount || 0);
          return (
            <div
              key={item.date}
              className={`aspect-square rounded-md border ${intensityClass(value, maxValue)}`}
              title={`${item.date}: ${value} eklenen`}
              aria-label={`${item.date}: ${value} eklenen`}
            />
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
            Toplam eklenen
          </p>
          <p className="mt-1 text-xl font-black text-white">{total}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
            Aktif gün
          </p>
          <p className="mt-1 text-xl font-black text-white">{activeDays}/30</p>
        </div>
      </div>
    </div>
  );
}

