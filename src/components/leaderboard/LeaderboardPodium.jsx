import React from "react";

// İlk 3 için zengin, renkli podyum sahnesi.
// #1 ortada ve yüksekte (taç ile), #2 solda, #3 sağda.
const PLACES = {
  1: {
    medal: "🥇",
    ring: "linear-gradient(135deg, #fde68a, #fbbf24, #d97706)",
    glow: "0 0 36px -6px rgba(251,191,36,0.65)",
    pedestal: "linear-gradient(180deg, #fbbf24, #b45309)",
    pedestalGlow: "0 -8px 30px -8px rgba(251,191,36,0.7)",
    name: "#fde68a",
    score: "#fcd34d",
    height: 96,
    avatar: 60,
    order: 2,
  },
  2: {
    medal: "🥈",
    ring: "linear-gradient(135deg, #f1f5f9, #cbd5e1, #94a3b8)",
    glow: "0 0 26px -8px rgba(203,213,225,0.6)",
    pedestal: "linear-gradient(180deg, #cbd5e1, #64748b)",
    pedestalGlow: "0 -8px 24px -10px rgba(203,213,225,0.55)",
    name: "#e2e8f0",
    score: "#cbd5e1",
    height: 66,
    avatar: 50,
    order: 1,
  },
  3: {
    medal: "🥉",
    ring: "linear-gradient(135deg, #fdba74, #fb923c, #b45309)",
    glow: "0 0 24px -8px rgba(251,146,60,0.6)",
    pedestal: "linear-gradient(180deg, #fb923c, #9a3412)",
    pedestalGlow: "0 -8px 24px -10px rgba(251,146,60,0.55)",
    name: "#fed7aa",
    score: "#fdba74",
    height: 52,
    avatar: 50,
    order: 3,
  },
};

function Initials({ nickname, size, ring }) {
  const letters = String(nickname || "?")
    .trim()
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="relative rounded-full p-[3px]"
      style={{ background: ring, width: size + 6, height: size + 6 }}
    >
      <div
        className="rounded-full flex items-center justify-center font-black text-white"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #1e293b, #0f172a)",
          fontSize: size * 0.38,
        }}
      >
        {letters}
      </div>
    </div>
  );
}

function PodiumColumn({ entry, isCurrentUser, accentHex }) {
  const place = PLACES[entry.rank];
  if (!place) return null;

  return (
    <div
      className="flex flex-col items-center justify-end flex-1 min-w-0"
      style={{ order: place.order }}
    >
      {/* Taç — sadece 1. için */}
      {entry.rank === 1 && (
        <span className="text-2xl mb-0.5 animate-bounce" style={{ animationDuration: "2.2s" }}>
          👑
        </span>
      )}

      {/* Avatar + madalya */}
      <div className="relative" style={{ filter: `drop-shadow(${place.glow})` }}>
        <Initials nickname={entry.nickname} size={place.avatar} ring={place.ring} />
        <span
          className="absolute -bottom-1 -right-1 text-lg"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
        >
          {place.medal}
        </span>
      </div>

      {/* İsim */}
      <p
        className="mt-2 text-xs font-black truncate max-w-full px-1 text-center"
        style={{ color: isCurrentUser ? accentHex : place.name }}
      >
        {entry.nickname}
        {isCurrentUser && <span className="block text-[8px] opacity-80">(Sen)</span>}
      </p>

      {/* Puan */}
      <p className="text-sm font-black tabular-nums" style={{ color: place.score }}>
        {entry.score?.toLocaleString("tr-TR")}
      </p>

      {/* Pedestal */}
      <div
        className="w-full max-w-[92px] rounded-t-xl mt-1.5 flex items-start justify-center pt-1.5 relative overflow-hidden"
        style={{
          height: place.height,
          background: place.pedestal,
          boxShadow: place.pedestalGlow,
        }}
      >
        <span
          className="text-lg font-black text-white/90"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
        >
          {entry.rank}
        </span>
        {/* Parıltı */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)",
          }}
        />
      </div>
    </div>
  );
}

export default function LeaderboardPodium({ top3, currentUserDocId, accentHex }) {
  const hex = accentHex || "#34d399";
  if (!top3 || top3.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] px-3 pt-5 pb-0">
      {/* Arka plan ışıltıları */}
      <div
        className="pointer-events-none absolute -top-16 left-1/4 h-40 w-40 rounded-full blur-3xl opacity-30"
        style={{ background: "#fbbf24" }}
      />
      <div
        className="pointer-events-none absolute -bottom-10 right-1/4 h-32 w-32 rounded-full blur-3xl opacity-20"
        style={{ background: hex }}
      />
      <div className="relative flex items-end justify-center gap-1.5">
        {top3.map((entry) => (
          <PodiumColumn
            key={entry.docId || entry.rank}
            entry={entry}
            isCurrentUser={entry.docId === currentUserDocId}
            accentHex={hex}
          />
        ))}
      </div>
    </div>
  );
}
