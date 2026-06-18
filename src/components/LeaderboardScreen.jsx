import React, { useCallback, useEffect, useState } from "react";
import { accentThemes } from "../theme/accentThemes";
import {
  getLeaderboardProfile,
  getTopRankings,
  getUserRank,
  getUserWeeklyStats,
  upsertLeaderboardProfile,
} from "../services/leaderboardService";
import {
  getCurrentWeekId,
  getTimeUntilWeekEnd,
  formatWeekLabel,
} from "../utils/weekIdUtils";
import { validateNickname } from "../utils/nicknameUtils";
import { checkNicknameAvailable } from "../services/leaderboardService";
import { getStreak } from "../services/streakService";
import UserRankCard from "./leaderboard/UserRankCard";
import LeaderboardList from "./leaderboard/LeaderboardList";
import NicknameSetupModal from "./leaderboard/NicknameSetupModal";

const LEAGUE_CONFIG = {
  temel: {
    label: "Temel Bilimler",
    shortLabel: "Temel",
    emoji: "🔬",
    from: "#818cf8",
    to: "#06b6d4",
    hex: "#818cf8",
    subjects: "Anatomi · Fizyoloji · Biyokimya · Mikrobiyoloji · Patoloji · Farmakoloji",
  },
  klinik: {
    label: "Klinik Bilimler",
    shortLabel: "Klinik",
    emoji: "🩺",
    from: "#fb923c",
    to: "#f43f5e",
    hex: "#fb923c",
    subjects: "Dahiliye · Pediatri · Genel Cerrahi · Kadın Hast. · Küçük Stajlar",
  },
};

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function LoadingSpinner({ hex }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 rounded-full border-2 border-slate-700 animate-spin"
        style={{ borderTopColor: hex }} />
    </div>
  );
}

function CountdownTimer() {
  const [remaining, setRemaining] = useState(() => getTimeUntilWeekEnd());
  useEffect(() => {
    const id = setInterval(() => setRemaining(getTimeUntilWeekEnd()), 60000);
    return () => clearInterval(id);
  }, []);
  if (!remaining) return null;
  const parts = [];
  if (remaining.days > 0) parts.push(`${remaining.days} gün`);
  if (remaining.hours > 0) parts.push(`${remaining.hours} saat`);
  if (remaining.days === 0) parts.push(`${remaining.minutes} dk`);
  return (
    <span className="text-xs text-slate-500 font-medium">
      {parts.join(" ")} kaldı
    </span>
  );
}

export default function LeaderboardScreen({ user, accentTheme, accentThemeKey, goDashboard }) {
  const theme = accentTheme || accentThemes.emerald;
  const isLightTheme = theme.usesLightChrome ?? (theme.mode === "light" || accentThemeKey === "light");

  const weekId = getCurrentWeekId();

  const [selectedLeague, setSelectedLeague] = useState("temel");
  const league = LEAGUE_CONFIG[selectedLeague];

  const [profile, setProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNicknameModal, setShowNicknameModal] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const [savingOptIn, setSavingOptIn] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const [prof, stats, rank, top, streakData] = await Promise.all([
        getLeaderboardProfile(user.uid),
        getUserWeeklyStats(user.uid, weekId, selectedLeague),
        getUserRank(user.uid, weekId, selectedLeague),
        getTopRankings(weekId, 50, selectedLeague),
        getStreak(user.uid),
      ]);
      setProfile(prof);
      setUserStats(stats);
      setUserRank(rank);
      setRankings(top);
      setCurrentStreak(streakData?.currentStreak || 0);

      if (!prof) setShowNicknameModal(true);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, weekId, selectedLeague]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNicknameConfirm = async (nick) => {
    await upsertLeaderboardProfile(user.uid, { nickname: nick, isOptedIn: true });
    setShowNicknameModal(false);
    await loadData();
  };

  const handleNicknameSkip = () => {
    setShowNicknameModal(false);
  };

  const handleSaveNickname = async () => {
    const trimmed = editNickname.trim();
    const validation = validateNickname(trimmed);
    if (!validation.valid) { setNicknameError(validation.error); return; }
    setSavingNickname(true);
    try {
      const available = await checkNicknameAvailable(trimmed, user.uid);
      if (!available) { setNicknameError("Bu rumuz kullanımda."); return; }
      await upsertLeaderboardProfile(user.uid, { nickname: trimmed, isOptedIn: profile?.isOptedIn ?? true });
      await loadData();
      setShowSettings(false);
      setEditNickname("");
      setNicknameError("");
    } finally {
      setSavingNickname(false);
    }
  };

  const handleToggleOptIn = async () => {
    if (!profile) return;
    setSavingOptIn(true);
    try {
      const newOptIn = !profile.isOptedIn;
      await upsertLeaderboardProfile(user.uid, { nickname: profile.nickname, isOptedIn: newOptIn });
      setProfile((p) => ({ ...p, isOptedIn: newOptIn }));
    } finally {
      setSavingOptIn(false);
    }
  };

  const topScore = rankings[0]?.score || 0;

  const pageClasses = isLightTheme
    ? "min-h-dvh bg-[#faf8f4] text-slate-950"
    : "min-h-dvh bg-[#05070d] text-white";

  return (
    <div className={pageClasses}>
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-md border-b border-white/[0.06] relative overflow-hidden"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          background: `linear-gradient(180deg, ${league.from}26 0%, rgba(5,7,13,0.92) 100%)`,
        }}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-28 w-72 rounded-full blur-3xl opacity-50"
          style={{ background: `${league.from}55` }}
        />
        <div className="relative flex items-center justify-between px-4 py-4 max-w-lg mx-auto">
          <button type="button" onClick={goDashboard}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.05]
              border border-white/[0.08] text-slate-400 hover:text-white transition-colors active:scale-95">
            <ChevronLeft />
          </button>
          <div className="text-center">
            <h1 className="text-base font-black tracking-tight flex items-center justify-center gap-1.5">
              <span aria-hidden="true">🏆</span>
              <span className="text-white">Haftalık Sıralama</span>
            </h1>
            <CountdownTimer />
          </div>
          <button type="button"
            onClick={() => { setShowSettings((s) => !s); setEditNickname(profile?.nickname || ""); setNicknameError(""); }}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.05]
              border border-white/[0.08] text-slate-400 hover:text-white transition-colors active:scale-95">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 pb-32 space-y-5">
        {/* Hafta etiketi */}
        <p className="text-xs text-slate-600 font-medium text-center">{formatWeekLabel(weekId)}</p>

        {/* Liga seçici */}
        <div className="relative p-1 rounded-2xl border border-white/[0.08]"
          style={{ background: "rgba(255,255,255,0.03)" }}>
          {/* Sliding indicator */}
          <div
            className="absolute top-1 bottom-1 rounded-xl transition-all duration-300 ease-out"
            style={{
              left: selectedLeague === "temel" ? "4px" : "calc(50% + 2px)",
              width: "calc(50% - 6px)",
              background: `linear-gradient(90deg, ${league.from}, ${league.to})`,
              opacity: 0.95,
            }}
          />
          <div className="relative flex">
            {Object.entries(LEAGUE_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedLeague(key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-colors duration-200 z-10"
                style={{ color: selectedLeague === key ? "#fff" : "#64748b" }}
              >
                <span aria-hidden="true">{cfg.emoji}</span>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Liga açıklaması */}
        <div className="text-center">
          <p className="text-[10px] text-slate-600 font-medium">{league.subjects}</p>
        </div>

        {/* Ayarlar paneli */}
        {showSettings && (
          <div className="rounded-[1.75rem] border border-white/[0.10] bg-white/[0.03] p-5 space-y-4">
            <p className="text-sm font-black text-white">Ayarlar</p>

            {profile ? (
              <>
                <div>
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wide block mb-1.5">
                    Rumuzun
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editNickname}
                      onChange={(e) => { setEditNickname(e.target.value); setNicknameError(""); }}
                      maxLength={20}
                      placeholder={profile.nickname}
                      className="flex-1 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white placeholder-slate-600
                        px-3 py-2 text-sm focus:outline-none focus:border-white/25 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleSaveNickname}
                      disabled={savingNickname || !editNickname.trim() || editNickname.trim() === profile.nickname}
                      className="px-4 py-2 rounded-xl font-black text-white text-xs
                        transition-all active:scale-95 disabled:opacity-40"
                      style={{ background: `linear-gradient(90deg, ${league.from}, ${league.to})` }}
                    >
                      {savingNickname ? "…" : "Kaydet"}
                    </button>
                  </div>
                  {nicknameError && <p className="text-rose-400 text-xs mt-1">{nicknameError}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Sıralamaya katılım</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {profile.isOptedIn ? "Sıralamada görünüyorsun." : "Sıralamada görünmüyorsun."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleOptIn}
                    disabled={savingOptIn}
                    className="relative w-12 h-6 rounded-full transition-colors duration-200 disabled:opacity-40"
                    style={{ background: profile.isOptedIn ? `linear-gradient(90deg, ${league.from}, ${league.to})` : "#334155" }}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
                      ${profile.isOptedIn ? "translate-x-6" : "translate-x-0"}`} />
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => { setShowSettings(false); setShowNicknameModal(true); }}
                className="w-full py-3 rounded-2xl font-black text-white text-sm"
                style={{ background: `linear-gradient(90deg, ${league.from}, ${league.to})` }}
              >
                Sıralamaya Katıl
              </button>
            )}
          </div>
        )}

        {loading ? (
          <LoadingSpinner hex={league.hex} />
        ) : (
          <>
            {/* Opt-in değilse uyarı */}
            {profile && !profile.isOptedIn && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
                <p className="text-amber-400 text-xs font-bold">
                  Sıralamaya katılım kapalı — ayarlardan aktif edebilirsin.
                </p>
              </div>
            )}

            {/* Kullanıcının kendi kartı */}
            <div>
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-1">
                Bu Haftaki Durumun — {league.emoji} {league.label}
              </p>
              <UserRankCard
                stats={userStats}
                rank={userRank}
                nickname={profile?.nickname}
                topScore={topScore}
                currentStreak={currentStreak}
                accentTheme={{ hex: league.hex }}
              />
            </div>

            {/* Sıralama listesi */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                  Bu Hafta İlk {Math.min(rankings.length, 50)}
                </p>
                {rankings.length > 0 && (
                  <span className="text-[10px] text-slate-600">
                    {rankings.length} aktif kullanıcı
                  </span>
                )}
              </div>
              <LeaderboardList
                rankings={rankings}
                currentUserDocId={user?.uid}
                userRank={userRank}
                accentHex={league.hex}
              />
            </div>

            {/* Puanlama bilgisi */}
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full blur-3xl opacity-30"
                style={{ background: `${league.from}60` }} />
              <p className="relative text-xs font-black text-slate-300 mb-1 flex items-center gap-1.5">
                <span aria-hidden="true">💎</span> Puan Sistemi
              </p>
              <p className="relative text-[10px] text-slate-600 mb-3">
                Soru puanları sadece ilgili ligi; tekrar, streak ve deneme puanları her iki ligi etkiler.
              </p>
              <div className="relative space-y-2 text-xs">
                {[
                  { icon: "🔬", label: "Temel bilimler sorusu", pts: "+2–14", color: "#818cf8" },
                  { icon: "🩺", label: "Klinik bilimler sorusu", pts: "+2–14", color: "#fb923c" },
                  { icon: "✅", label: "Doğru cevap bonusu", pts: "+8", color: "#34d399" },
                  { icon: "🔥", label: "Zor soru (diff 4-5)", pts: "+4", color: "#fb923c" },
                  { icon: "📚", label: "Günlük FSRS tekrar", pts: "+20", color: "#a78bfa" },
                  { icon: "⚡", label: "Günlük çalışma bonusu", pts: "+10", color: "#fbbf24" },
                  { icon: "🎯", label: "Tam deneme tamamlama", pts: "+50", color: "#22d3ee" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-lg px-2 py-1.5 bg-white/[0.02]">
                    <span className="flex items-center gap-2 text-slate-400">
                      <span aria-hidden="true">{row.icon}</span>
                      {row.label}
                    </span>
                    <span className="font-black tabular-nums" style={{ color: row.color }}>{row.pts}</span>
                  </div>
                ))}
                <p className="text-slate-600 mt-2 border-t border-white/[0.06] pt-2.5 leading-relaxed">
                  💡 Aynı soru aynı hafta içinde yalnızca ilk çözümde puan verir.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Nickname Setup Modal */}
      {showNicknameModal && (
        <NicknameSetupModal
          onConfirm={handleNicknameConfirm}
          onSkip={handleNicknameSkip}
          accentTheme={theme}
        />
      )}
    </div>
  );
}
