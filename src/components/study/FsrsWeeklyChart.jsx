import React from "react";

const dayFormatter = new Intl.DateTimeFormat("tr-TR", { weekday: "short" });

export default function FsrsWeeklyChart({ stats = [], accentTheme }) {
  const theme = accentTheme || {};
  const textClass = theme.text || "text-emerald-300";
  const maxValue = Math.max(1, ...stats.map((item) => Number(item.addedCount || 0)));
  const total = stats.reduce((sum, item) => sum + Number(item.addedCount || 0), 0);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/55 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-white">Son 7 Gün</h3>
          <p className="mt-1 text-xs text-slate-500">
            FSRS’e eklenen soru sayısı
          </p>
        </div>
        <p className={`text-2xl font-black ${textClass}`}>{total}</p>
      </div>

      <div className="mt-5 flex h-32 items-end gap-2">
        {stats.map((item) => {
          const value = Number(item.addedCount || 0);
          const height = Math.max(8, Math.round((value / maxValue) * 100));
          const date = new Date(`${item.date}T12:00:00`);
          return (
            <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-24 w-full items-end rounded-full bg-slate-950/70 p-1">
                <div
                  className={`w-full rounded-full ${theme.primary || "bg-emerald-400"}`}
                  style={{ height: `${height}%`, opacity: value ? 1 : 0.18 }}
                  title={`${item.date}: ${value}`}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                {dayFormatter.format(date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

