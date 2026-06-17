import React from "react";

const RANK_COLORS = {
  1: "text-amber-400",
  2: "text-slate-300",
  3: "text-amber-700",
};

const RANK_BG = {
  1: "bg-amber-400/10 border-amber-400/20",
  2: "bg-slate-400/10 border-slate-400/20",
  3: "bg-amber-700/10 border-amber-700/20",
};

function RankBadge({ rank }) {
  const color = RANK_COLORS[rank] || "text-slate-600";
  const bg = RANK_BG[rank] || "bg-white/[0.03] border-white/[0.06]";
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl border text-xs font-black ${color} ${bg}`}>
      {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
    </span>
  );
}

function LeaderboardRow({ entry, isCurrentUser }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors
      ${isCurrentUser
        ? "bg-emerald-500/10 border border-emerald-500/20"
        : "bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04]"
      }`}>
      <RankBadge rank={entry.rank} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-black truncate ${isCurrentUser ? "text-emerald-400" : "text-white"}`}>
          {entry.nickname}
          {isCurrentUser && <span className="ml-1.5 text-[10px] font-bold text-emerald-500/70">Sen</span>}
        </p>
        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
          {entry.solvedCount} soru • %{entry.accuracy} doğru
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-black text-white">{entry.score?.toLocaleString("tr-TR")}</p>
        <p className="text-[10px] text-slate-600">puan</p>
      </div>
    </div>
  );
}

export default function LeaderboardList({ rankings, currentUserDocId, userRank }) {
  if (!rankings || rankings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-600">
        <span className="text-4xl mb-3">🏁</span>
        <p className="font-bold text-sm">Henüz sıralamada kimse yok.</p>
        <p className="text-xs mt-1">Soru çözerek ilk sıraya gir!</p>
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
        />
      ))}

      {!userInTopList && userRank != null && currentUserDocId && (
        <>
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] text-slate-600 font-bold">•••</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
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
          />
        </>
      )}
    </div>
  );
}
