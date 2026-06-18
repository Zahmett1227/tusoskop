import React, { useEffect, useState } from "react";
import { getTopRankings, getUserWeeklyStats, getUserRank } from "../../services/leaderboardService";
import { getCurrentWeekId, formatWeekLabel } from "../../utils/weekIdUtils";
import AvatarIcon from "./AvatarIcon";

const MEDALS = ["🥇", "🥈", "🥉"];

const LEAGUE_CONFIG = {
  temel: { label: "Temel", emoji: "🔬", from: "#818cf8", to: "#06b6d4" },
  klinik: { label: "Klinik", emoji: "🩺", from: "#fb923c", to: "#f43f5e" },
};

export default function DashboardLeaderboardWidget({ user, isLightTheme, accentTheme, setView }) {
  const [selectedLeague, setSelectedLeague] = useState("temel");
  const [top3, setTop3] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  const weekId = getCurrentWeekId();
  const league = LEAGUE_CONFIG[selectedLeague];

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [top, stats, rank] = await Promise.all([
          getTopRankings(weekId, 3, selectedLeague),
          user?.uid ? getUserWeeklyStats(user.uid, weekId, selectedLeague) : null,
          user?.uid ? getUserRank(user.uid, weekId, selectedLeague) : null,
        ]);
        if (!active) return;
        setTop3(top);
        setUserStats(stats);
        setUserRank(rank);
      } catch {
        /* sessiz */
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [user?.uid, weekId, selectedLeague]);

  const cardBg = isLightTheme
    ? "border-slate-200 bg-white shadow-sm"
    : "border-white/[0.08] bg-white/[0.025]";

  const rowBg = isLightTheme
    ? "bg-slate-50 border border-slate-100"
    : "bg-white/[0.04] border border-white/[0.06]";

  const userInTop3 = userRank !== null && userRank <= 3;
  const leagueGradient = `linear-gradient(90deg, ${league.from}, ${league.to})`;

  return (
    <section
      className={`relative mb-6 overflow-hidden rounded-[28px] border p-5 ${cardBg}`}
      aria-labelledby="dash-leaderboard-heading"
    >
      {/* Dekoratif arka plan */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl opacity-30 transition-all duration-500"
        style={{ background: `${league.from}25` }}
      />

      <div className="relative z-10">
        {/* Başlık satırı */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.28em] mb-0.5 ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>
              Haftalık Sıralama
            </p>
            <h2
              id="dash-leaderboard-heading"
              className={`text-base font-black ${isLightTheme ? "text-slate-950" : "text-white"}`}
            >
              {formatWeekLabel(weekId)}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setView("leaderboard")}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition-all active:scale-95 text-white"
            style={{ background: leagueGradient }}
          >
            Tümünü Gör
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        {/* Liga seçici */}
        <div className="relative flex p-0.5 rounded-xl mb-3"
          style={{ background: isLightTheme ? "#f1f5f9" : "rgba(255,255,255,0.04)" }}>
          <div
            className="absolute top-0.5 bottom-0.5 rounded-lg transition-all duration-300 ease-out"
            style={{
              left: selectedLeague === "temel" ? "2px" : "calc(50% + 1px)",
              width: "calc(50% - 3px)",
              background: leagueGradient,
              opacity: 0.9,
            }}
          />
          {Object.entries(LEAGUE_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedLeague(key)}
              className="relative flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-black transition-colors duration-200 z-10"
              style={{ color: selectedLeague === key ? "#fff" : (isLightTheme ? "#94a3b8" : "#64748b") }}
            >
              <span>{cfg.emoji}</span>
              {cfg.label}
            </button>
          ))}
        </div>

        {/* İçerik */}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-6 w-6 rounded-full border-2 border-slate-700 animate-spin"
              style={{ borderTopColor: league.from }} />
          </div>
        ) : top3.length === 0 ? (
          <div className="py-4 text-center">
            <p className={`text-sm font-bold ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>
              Henüz bu haftada kimse puan almamış.
            </p>
            <button
              type="button"
              onClick={() => setView("leaderboard")}
              className="mt-2 text-xs font-black underline"
              style={{ color: league.from }}
            >
              İlk sen ol →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {top3.map((item, i) => {
              const isCurrentUser = item.docId === user?.uid;
              return (
                <div
                  key={item.docId}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${
                    isCurrentUser ? "border" : rowBg
                  }`}
                  style={isCurrentUser ? { borderColor: `${league.from}50`, backgroundColor: `${league.from}12` } : {}}
                >
                  <span className="text-lg w-7 text-center shrink-0">{MEDALS[i]}</span>
                  <AvatarIcon size={26} />
                  <span
                    className={`flex-1 text-sm font-black truncate ${!isCurrentUser ? (isLightTheme ? "text-slate-800" : "text-white") : ""}`}
                    style={isCurrentUser ? { color: league.from } : {}}
                  >
                    {item.nickname}
                    {isCurrentUser && <span className="ml-1.5 text-[10px] font-black opacity-60">(sen)</span>}
                  </span>
                  <span className={`text-sm font-black tabular-nums ${isLightTheme ? "text-slate-700" : "text-slate-200"}`}>
                    {item.score.toLocaleString("tr")}
                    <span className={`text-[10px] font-bold ml-0.5 ${isLightTheme ? "text-slate-400" : "text-slate-500"}`}>pt</span>
                  </span>
                </div>
              );
            })}

            {/* Kullanıcı top3'te değilse kendi satırını göster */}
            {!userInTop3 && userStats && userRank && (
              <>
                <div className={`my-1 flex items-center gap-2 ${isLightTheme ? "text-slate-300" : "text-slate-700"}`}>
                  <div className="flex-1 h-px bg-current opacity-40" />
                  <span className="text-[10px] font-bold">···</span>
                  <div className="flex-1 h-px bg-current opacity-40" />
                </div>
                <div
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 border"
                  style={{ borderColor: `${league.from}50`, backgroundColor: `${league.from}12` }}
                >
                  <span className={`text-sm font-black w-7 text-center shrink-0 tabular-nums ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>
                    {userRank}.
                  </span>
                  <AvatarIcon size={26} />
                  <span className="flex-1 text-sm font-black truncate" style={{ color: league.from }}>
                    Sen
                  </span>
                  <span className={`text-sm font-black tabular-nums ${isLightTheme ? "text-slate-700" : "text-slate-200"}`}>
                    {(userStats.score || 0).toLocaleString("tr")}
                    <span className={`text-[10px] font-bold ml-0.5 ${isLightTheme ? "text-slate-400" : "text-slate-500"}`}>pt</span>
                  </span>
                </div>
              </>
            )}

            {/* Katılmamışsa teşvik */}
            {!userStats && (
              <button
                type="button"
                onClick={() => setView("leaderboard")}
                className={`mt-1 w-full rounded-2xl border border-dashed py-3 text-xs font-black transition-all active:scale-[0.99] ${
                  isLightTheme
                    ? "border-slate-300 text-slate-500 hover:border-slate-400"
                    : "border-white/[0.12] text-slate-500 hover:border-white/25"
                }`}
              >
                Sıralamaya katıl →
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
