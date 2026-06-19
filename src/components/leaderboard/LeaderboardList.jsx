import React from "react";

function Initials({ nickname, size = 32, hex }) {
  const letters = String(nickname || "?").trim().slice(0, 2).toUpperCase();
  return (
    <div
      className="shrink-0 rounded-full flex items-center justify-center font-black text-white border border-white/10"
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: `linear-gradient(135deg, ${hex}cc, ${hex}66)`,
        fontSize: size * 0.36,
      }}
    >
      {letters}
    </div>
  );
}

function RankBadge({ rank, hex }) {
  return (
    <span
      className="inline-flex items-center justify-center w-9 h-9 rounded-2xl text-sm font-black shrink-0 tabular-nums border"
      style={{
        color: hex,
        borderColor: `${hex}33`,
        background: `${hex}12`,
      }}
    >
      {rank}
    </span>
  );
}

function LeaderboardRow({ entry, isCurrentUser, accentHex }) {
  const hex = accentHex || "#34d399";

  return (
    <div
      className="relative flex items-center gap-3 px-3.5 py-3 rounded-2xl border transition-all duration-200"
      style={
        isCurrentUser
          ? {
              borderColor: `${hex}55`,
              background: `linear-gradient(90deg, ${hex}1f, ${hex}08)`,
              boxShadow: `0 0 24px -10px ${hex}70`,
            }
          : {
              borderColor: "rgba(255,255,255,0.05)",
              background: "rgba(255,255,255,0.025)",
            }
      }
    >
      <RankBadge rank={entry.rank} hex={hex} />
      <Initials nickname={entry.nickname} hex={hex} size={32} />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-black truncate"
          style={{ color: isCurrentUser ? hex : "#f1f5f9" }}
        >
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
          <span
            className={
              entry.accuracy >= 80
                ? "text-emerald-400/80"
                : entry.accuracy >= 60
                  ? "text-cyan-400/70"
                  : "text-slate-500"
            }
          >
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
          className="text-base font-black tabular-nums"
          style={{ color: isCurrentUser ? hex : "#f8fafc" }}
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
      <div className="relative flex flex-col items-center justify-center py-10 text-slate-600 overflow-hidden rounded-[1.75rem] border border-white/[0.06] bg-white/[0.02]">
        <div
          className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full blur-3xl opacity-20"
          style={{ background: hex }}
        />
        <span className="relative text-4xl mb-2 animate-bounce">🏁</span>
        <p className="relative font-black text-sm text-slate-400">Henüz kimse yok.</p>
        <p className="relative text-xs mt-1">Soru çözerek bu listeye gir!</p>
      </div>
    );
  }

  const inList = rankings.some((r) => r.docId === currentUserDocId);
  const userInTopList = inList && userRank != null && userRank <= rankings.length + 3;

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
