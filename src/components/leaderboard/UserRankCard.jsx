import React from "react";
import { getMotivationMessage } from "../../utils/leaderboardScoreUtils";

function StatPill({ label, value, accent = false }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-base font-black ${accent ? "text-emerald-400" : "text-white"}`}>
        {value}
      </span>
      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{label}</span>
    </div>
  );
}

export default function UserRankCard({ stats, rank, nickname, topScore, currentStreak, accentTheme }) {
  const theme = accentTheme || {};

  if (!stats) {
    return (
      <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-5">
        <p className="text-slate-500 text-sm text-center">Bu hafta henüz puan kazanmadın.</p>
        <p className="text-slate-600 text-xs text-center mt-1">Soru çöz ve puan kazan!</p>
      </div>
    );
  }

  const rankLabel = rank ? `${rank}. sıra` : "—";
  const motivation = getMotivationMessage({
    rank: rank || 999,
    score: stats.score,
    topScore: topScore || stats.score,
    solvedCount: stats.solvedCount,
  });

  return (
    <div className={`rounded-[1.75rem] border border-white/[0.10] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Sen</p>
          <p className="text-lg font-black text-white tracking-tight">{nickname || "Anonim"}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white">{stats.score?.toLocaleString("tr-TR")}</p>
          <p className="text-xs text-slate-500 font-medium">puan</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-4">
        <StatPill label="Sıra" value={rankLabel} accent />
        <div className="w-px h-8 bg-white/[0.06]" />
        <StatPill label="Soru" value={stats.solvedCount} />
        <div className="w-px h-8 bg-white/[0.06]" />
        <StatPill label="Doğru" value={`%${stats.accuracy}`} />
        <div className="w-px h-8 bg-white/[0.06]" />
        <StatPill label="Streak" value={currentStreak ? `🔥 ${currentStreak}` : "—"} />
      </div>

      {stats.fsrsCompletedCount > 0 || stats.streakBonusCount > 0 || stats.mockExamCount > 0 ? (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {stats.fsrsCompletedCount > 0 && (
            <span className="px-2 py-1 rounded-lg bg-violet-500/15 border border-violet-500/20 text-violet-400 text-[10px] font-bold">
              📚 Tekrar ×{stats.fsrsCompletedCount}
            </span>
          )}
          {stats.streakBonusCount > 0 && (
            <span className="px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
              🔥 Streak ×{stats.streakBonusCount}
            </span>
          )}
          {stats.mockExamCount > 0 && (
            <span className="px-2 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold">
              📝 Deneme ×{stats.mockExamCount}
            </span>
          )}
        </div>
      ) : null}

      <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2">
        <p className="text-xs text-slate-400 leading-relaxed">{motivation}</p>
      </div>
    </div>
  );
}
