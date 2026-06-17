import React from "react";
import { getMotivationMessage } from "../../utils/leaderboardScoreUtils";
import AvatarIcon from "./AvatarIcon";

function StatPill({ label, value, accent = false, color }) {
  return (
    <div className="flex flex-col items-center gap-0.5 flex-1">
      <span
        className={`text-base font-black tabular-nums ${accent ? "" : "text-white"}`}
        style={accent && color ? { color } : {}}
      >
        {value}
      </span>
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
    </div>
  );
}

// Sıraya göre üst şerit rengi/etiketi
function rankTheme(rank) {
  if (rank === 1) return { label: "🥇 Lider", from: "#fbbf24", to: "#f59e0b", text: "text-amber-300" };
  if (rank === 2) return { label: "🥈 2. Sıra", from: "#e2e8f0", to: "#94a3b8", text: "text-slate-200" };
  if (rank === 3) return { label: "🥉 3. Sıra", from: "#fb923c", to: "#b45309", text: "text-orange-300" };
  if (rank && rank <= 10) return { label: `⭐ İlk 10 — ${rank}.`, from: "#34d399", to: "#06b6d4", text: "text-emerald-300" };
  return null;
}

export default function UserRankCard({ stats, rank, nickname, topScore, currentStreak, accentTheme }) {
  const theme = accentTheme || {};
  const hex = theme.hex || "#34d399";

  if (!stats) {
    return (
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-6 text-center">
        <div
          className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-32 w-40 rounded-full blur-3xl opacity-40"
          style={{ background: `${hex}30` }}
        />
        <span className="relative text-4xl block mb-2">🚀</span>
        <p className="relative text-slate-300 text-sm font-bold">Bu hafta henüz puan kazanmadın.</p>
        <p className="relative text-slate-500 text-xs mt-1">Soru çöz, tekrar yap, zirveye tırman!</p>
      </div>
    );
  }

  const rankLabel = rank ? `${rank}.` : "—";
  const rt = rankTheme(rank);
  const motivation = getMotivationMessage({
    rank: rank || 999,
    score: stats.score,
    topScore: topScore || stats.score,
    solvedCount: stats.solvedCount,
  });

  // Zirveye uzaklık göstergesi
  const gap = topScore && topScore > stats.score ? topScore - stats.score : 0;
  const progressPct = topScore > 0 ? Math.min(100, Math.round((stats.score / topScore) * 100)) : 100;

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.12] p-5"
      style={{
        background: `linear-gradient(135deg, ${hex}1f 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.01) 100%)`,
      }}>
      {/* Dekoratif ışıltılar */}
      <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full blur-3xl opacity-50"
        style={{ background: `${hex}40` }} />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative z-10">
        {/* Üst şerit — sıra rozeti */}
        {rt && (
          <div className="mb-3 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black text-slate-950"
            style={{ background: `linear-gradient(90deg, ${rt.from}, ${rt.to})` }}>
            {rt.label}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <AvatarIcon size={36} />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Senin Kartın</p>
              <p className="text-xl font-black text-white tracking-tight truncate">{nickname || "Anonim"}</p>
            </div>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-3xl font-black tabular-nums leading-none" style={{ color: hex }}>
              {stats.score?.toLocaleString("tr-TR")}
            </p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">puan</p>
          </div>
        </div>

        {/* Zirveye ilerleme çubuğu */}
        {gap > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
              <span className="text-slate-400">Zirveye {gap.toLocaleString("tr-TR")} puan</span>
              <span style={{ color: hex }}>%{progressPct}</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${hex}, #06b6d4)` }} />
            </div>
          </div>
        )}

        {/* İstatistik şeridi */}
        <div className="flex items-center justify-between gap-1 mb-4 rounded-2xl bg-black/20 border border-white/[0.06] px-3 py-3">
          <StatPill label="Sıra" value={rankLabel} accent color={hex} />
          <div className="w-px h-8 bg-white/[0.08]" />
          <StatPill label="Soru" value={stats.solvedCount} />
          <div className="w-px h-8 bg-white/[0.08]" />
          <StatPill label="Doğru" value={`%${stats.accuracy}`}
            accent color={stats.accuracy >= 80 ? "#34d399" : stats.accuracy >= 60 ? "#22d3ee" : "#fb7185"} />
          <div className="w-px h-8 bg-white/[0.08]" />
          <StatPill label="Seri" value={currentStreak ? `🔥${currentStreak}` : "—"}
            accent color={currentStreak ? "#fbbf24" : undefined} />
        </div>

        {/* Bonus rozetleri */}
        {(stats.fsrsCompletedCount > 0 || stats.streakBonusCount > 0 || stats.mockExamCount > 0) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {stats.fsrsCompletedCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-500/25 to-violet-500/10 border border-violet-400/30 text-violet-300 text-[10px] font-black">
                📚 Tekrar ×{stats.fsrsCompletedCount}
              </span>
            )}
            {stats.streakBonusCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/25 to-amber-500/10 border border-amber-400/30 text-amber-300 text-[10px] font-black">
                🔥 Streak ×{stats.streakBonusCount}
              </span>
            )}
            {stats.mockExamCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/25 to-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-black">
                📝 Deneme ×{stats.mockExamCount}
              </span>
            )}
          </div>
        )}

        {/* Motivasyon */}
        <div className="rounded-xl px-3 py-2.5 border border-white/[0.08]"
          style={{ background: `linear-gradient(90deg, ${hex}12, rgba(255,255,255,0.02))` }}>
          <p className="text-xs text-slate-300 leading-relaxed font-medium flex items-start gap-2">
            <span className="text-sm shrink-0">✨</span>
            <span>{motivation}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
