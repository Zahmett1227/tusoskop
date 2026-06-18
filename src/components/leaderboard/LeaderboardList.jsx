import React from "react";
import AvatarIcon from "./AvatarIcon";

// Top 3 için zengin podyum stilleri — gradient + glow + parıltı
const PODIUM = {
  1: {
    medal: "🥇",
    ring: "from-amber-300 via-yellow-400 to-amber-500",
    glow: "shadow-[0_0_28px_-6px_rgba(251,191,36,0.55)]",
    rowBg: "bg-gradient-to-r from-amber-400/[0.14] via-amber-300/[0.07] to-transparent border-amber-400/30",
    name: "text-amber-200",
    score: "text-amber-300",
    badgeShadow: "shadow-[0_4px_14px_-2px_rgba(251,191,36,0.5)]",
  },
  2: {
    medal: "🥈",
    ring: "from-slate-200 via-slate-300 to-slate-400",
    glow: "shadow-[0_0_22px_-8px_rgba(203,213,225,0.5)]",
    rowBg: "bg-gradient-to-r from-slate-300/[0.12] via-slate-200/[0.05] to-transparent border-slate-300/25",
    name: "text-slate-100",
    score: "text-slate-200",
    badgeShadow: "shadow-[0_4px_12px_-2px_rgba(203,213,225,0.4)]",
  },
  3: {
    medal: "🥉",
    ring: "from-orange-300 via-amber-600 to-orange-700",
    glow: "shadow-[0_0_20px_-8px_rgba(217,119,6,0.5)]",
    rowBg: "bg-gradient-to-r from-orange-500/[0.12] via-amber-700/[0.05] to-transparent border-orange-600/25",
    name: "text-orange-200",
    score: "text-orange-300",
    badgeShadow: "shadow-[0_4px_12px_-2px_rgba(217,119,6,0.4)]",
  },
};

function RankBadge({ rank }) {
  const p = PODIUM[rank];
  if (p) {
    return (
      <span className="relative inline-flex items-center justify-center shrink-0">
        <span
          className={`flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-br ${p.ring} ${p.badgeShadow}`}
        >
          <span className="text-base drop-shadow">{p.medal}</span>
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-xs font-black text-slate-400 shrink-0 tabular-nums">
      {rank}
    </span>
  );
}

function LeaderboardRow({ entry, isCurrentUser, accentHex }) {
  const hex = accentHex || "#34d399";
  const p = PODIUM[entry.rank];
  const baseBg = isCurrentUser
    ? "border transition-all duration-200"
    : p
      ? `${p.rowBg} ${p.glow}`
      : "bg-white/[0.025] border-white/[0.05] hover:bg-white/[0.05]";

  return (
    <div
      className={`relative flex items-center gap-3 px-3.5 py-3 rounded-2xl border transition-all duration-200 ${baseBg}`}
      style={isCurrentUser ? {
        borderColor: `${hex}50`,
        backgroundColor: `${hex}16`,
        boxShadow: `0 0 22px -10px ${hex}60`,
      } : {}}
    >
      <RankBadge rank={entry.rank} />
      <AvatarIcon size={30} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-black truncate ${p && !isCurrentUser ? p.name : "text-white"}`}
          style={isCurrentUser ? { color: hex } : {}}>
          {entry.nickname}
          {isCurrentUser && (
            <span
              className="ml-1.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider align-middle"
              style={{ backgroundColor: `${hex}25`, color: hex }}
            >
              Sen
            </span>
          )}
        </p>
        <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
          <span>{entry.solvedCount} soru</span>
          <span className="text-slate-700">•</span>
          <span className={entry.accuracy >= 80 ? "text-emerald-400/80" : entry.accuracy >= 60 ? "text-cyan-400/70" : ""}>
            %{entry.accuracy} doğru
          </span>
          {entry.fsrsCompletedCount > 0 && (
            <>
              <span className="text-slate-700">•</span>
              <span className="text-violet-400/80">📚 {entry.fsrsCompletedCount}</span>
            </>
          )}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p
          className={`text-base font-black tabular-nums ${p && !isCurrentUser ? p.score : "text-white"}`}
          style={isCurrentUser ? { color: hex } : {}}
        >
          {entry.score?.toLocaleString("tr-TR")}
        </p>
        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">puan</p>
      </div>
    </div>
  );
}

export default function LeaderboardList({ rankings, currentUserDocId, userRank, accentHex }) {
  const hex = accentHex || "#34d399";
  if (!rankings || rankings.length === 0) {
    return (
      <div className="relative flex flex-col items-center justify-center py-12 text-slate-600 overflow-hidden rounded-[1.75rem] border border-white/[0.06] bg-white/[0.02]">
        <div
          className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full blur-3xl opacity-20"
          style={{ background: hex }}
        />
        <span className="relative text-5xl mb-3 animate-bounce">🏁</span>
        <p className="relative font-black text-sm text-slate-400">Henüz sıralamada kimse yok.</p>
        <p className="relative text-xs mt-1">Soru çözerek ilk sıraya gir!</p>
      </div>
    );
  }

  const inList = rankings.some((r) => r.docId === currentUserDocId);
  const userInTopList = inList && userRank != null && userRank <= rankings.length;

  return (
    <div className="space-y-2">
      {rankings.map((entry) => (
        <LeaderboardRow
          key={entry.docId || entry.rank}
          entry={entry}
          isCurrentUser={entry.docId === currentUserDocId}
          accentHex={hex}
        />
      ))}

      {!userInTopList && userRank != null && currentUserDocId && (
        <>
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/[0.08]" />
            <span className="text-[10px] text-slate-600 font-bold">•••</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/[0.08]" />
          </div>
          <LeaderboardRow
            entry={{
              rank: userRank,
              nickname: "Sen",
              score: 0,
              solvedCount: 0,
              accuracy: 0,
              docId: currentUserDocId,
            }}
            isCurrentUser
            accentHex={hex}
          />
        </>
      )}
    </div>
  );
}
