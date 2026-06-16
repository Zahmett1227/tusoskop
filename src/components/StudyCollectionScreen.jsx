import { useEffect, useMemo, useState } from "react";
import { accentThemes } from "../theme/accentThemes";
import { trackClarityEvent } from "../lib/clarity";
import {
  getFavoriteQuestions,
  getWrongQuestions,
  toggleFavoriteQuestion,
} from "../services/studyCollectionService";
import {
  getDueSmartReviews,
  getSmartReviewSummary,
  MAX_SESSION_DUE,
  resolveQuestionsFromReviews,
} from "../services/smartReviewService";
import { FREE_LIMITS } from "../config/limits";
import { isUserPremium } from "../utils/premiumUtils";
import PerformanceChartCard from "./PerformanceChartCard";
import FsrsStatsSection from "./study/FsrsStatsSection";

const TABS = [
  { key: "queue", label: "Tekrar Kuyruğu" },
  { key: "wrong", label: "Yanlışlarım" },
  { key: "favorite", label: "Favorilerim" },
];

const formatDate = (dateValue) => {
  if (!dateValue) return "—";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("tr-TR");
};

const safePreview = (text) => {
  if (!text) return "Soru metni bulunamadı.";
  return String(text).slice(0, 120);
};

export default function StudyCollectionScreen({
  user,
  userData,
  isAuthReady = true,
  questions,
  accentTheme,
  accentThemeKey,
  goDashboard,
  openExamSetSelect,
  startReviewWithQuestions,
}) {
  const theme = accentTheme || accentThemes.emerald;
  const [activeTab, setActiveTab] = useState("queue");
  const [wrongItems, setWrongItems] = useState([]);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [todayQueue, setTodayQueue] = useState([]);
  const [fsrsSummary, setFsrsSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const mapById = useMemo(
    () => new Map((questions || []).map((q) => [Number(q.id), q])),
    [questions]
  );

  const hydrate = async () => {
    setLoading(true);
    try {
      const isPremium = isUserPremium(userData);
      const dueLimit = isPremium ? MAX_SESSION_DUE : FREE_LIMITS.dailyReviewQuestions;
      const [wrong, favorites, dueReviews, smartSummary] = await Promise.all([
        getWrongQuestions(user, userData),
        getFavoriteQuestions(user),
        getDueSmartReviews(user, new Date(), { limit: dueLimit }),
        getSmartReviewSummary(user),
      ]);
      setWrongItems(wrong);
      setFavoriteItems(favorites);
      setTodayQueue(resolveQuestionsFromReviews(dueReviews, questions));
      setFsrsSummary(smartSummary ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrate();
    trackClarityEvent("tekrar_kuyrugu_acildi");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, questions?.length, userData]);

  const unresolvedWrong = useMemo(
    () => wrongItems.filter((item) => !item.isResolved),
    [wrongItems]
  );

  const topWrongTopic = useMemo(() => {
    const keyCount = {};
    wrongItems.forEach((item) => {
      const key = `${item.ders}__${item.konu}`;
      keyCount[key] = (keyCount[key] || 0) + (item.wrongCount || 1);
    });
    const best = Object.entries(keyCount).sort((a, b) => b[1] - a[1])[0];
    if (!best) return null;
    const [ders, konu] = best[0].split("__");
    return { ders, konu, count: best[1] };
  }, [wrongItems]);

  const handleStartQueue = () => {
    if (!todayQueue.length) return;
    trackClarityEvent("bugunku_tekrar_baslatildi");
    startReviewWithQuestions?.(todayQueue, "todayQueue");
  };

  const handleStartWrongReview = () => {
    const list = unresolvedWrong
      .map((item) => mapById.get(item.questionId))
      .filter(Boolean)
      .slice(0, 20);
    if (!list.length) return;
    startReviewWithQuestions?.(list, "wrong");
  };

  const handleStartFavoriteReview = () => {
    const list = favoriteItems
      .map((item) => mapById.get(item.questionId))
      .filter(Boolean)
      .slice(0, 20);
    if (!list.length) return;
    startReviewWithQuestions?.(list, "favorite");
  };

  const handleRemoveFavorite = async (item) => {
    const q = mapById.get(item.questionId);
    if (!q) return;
    await toggleFavoriteQuestion(user, q);
    await hydrate();
  };

  return (
    <div
      className={`min-h-dvh bg-slate-950 text-white px-4 py-5 md:px-8 ${theme.softBg}`}
      style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }}
    >
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.24em] ${theme.text}`}>
              Çalışma Alanım
            </p>
            <h1 className="text-2xl md:text-3xl font-black mt-1">Tekrar Merkezi</h1>
            <p className="text-sm text-slate-400 mt-1">
              Yanlışların, favorilerin, tekrar kuyruğun ve deneme netlerin tek yerde.
            </p>
          </div>
          <button
            type="button"
            onClick={goDashboard}
            className="px-4 py-2 rounded-2xl border border-slate-700 bg-slate-900/80 text-sm font-bold"
          >
            Panele dön
          </button>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950 p-5">
          {todayQueue.length === 0 ? (
            <div className="flex flex-col items-center text-center py-6">
              <span className="text-5xl mb-3" aria-hidden="true">🎯</span>
              <h2 className="text-xl font-black mb-1">Bugün tekrar zamanı gelen soru yok</h2>
              <p className="text-sm text-slate-400 max-w-sm">
                FSRS zamanlamasına göre bugün çalışman gereken kart bulunmuyor.
              </p>
              {(unresolvedWrong.length > 0 || favoriteItems.length > 0) && (
                <div className="mt-5 flex flex-col gap-2 w-full max-w-xs">
                  {unresolvedWrong.length > 0 && (
                    <button
                      type="button"
                      onClick={handleStartWrongReview}
                      className={`min-h-10 px-5 rounded-2xl text-sm font-black ${theme.primary} ${theme.primaryHover} text-slate-950 shadow-lg ${theme.glow}`}
                    >
                      Yanlışlardan Özel Çalışma ({unresolvedWrong.length} soru)
                    </button>
                  )}
                  {favoriteItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handleStartFavoriteReview}
                      className="min-h-10 px-5 rounded-2xl text-sm font-bold border border-slate-700 bg-slate-900/80 text-slate-200"
                    >
                      Favorilerden Özel Çalışma ({favoriteItems.length} soru)
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
          <h2 className="text-xl font-black mb-1">
            Bugünkü tekrarın hazır
          </h2>
          <p className="text-sm text-slate-400">
            {`${todayQueue.length} soruluk tekrar kuyruğu${
                  fsrsSummary?.overdueCount > 0
                    ? ` · ${fsrsSummary.overdueCount} soru gecikmiş`
                    : ""
                }`}
          </p>
          <p className={`text-xs mt-3 ${theme.text}`}>
            FSRS zamanlamasına göre bugün tekrar etmen gereken sorular.
          </p>
            </>
          )}
          {todayQueue.length > 0 && (
            <button
              type="button"
              onClick={handleStartQueue}
              className={`mt-4 min-h-10 px-5 rounded-2xl text-sm font-black ${theme.primary} ${theme.primaryHover} text-slate-950 shadow-lg ${theme.glow}`}
            >
              Tekrarı Başlat
            </button>
          )}
        </div>

        <FsrsStatsSection
          user={user}
          isAuthReady={isAuthReady}
          accentTheme={theme}
          dueCountSnapshot={fsrsSummary?.dueCount ?? todayQueue.length}
        />

        <PerformanceChartCard
          user={user}
          userData={userData}
          accentTheme={theme}
          accentThemeKey={accentThemeKey}
          onStartExam={openExamSetSelect}
        />

        <div className="rounded-full bg-slate-900/70 border border-slate-800 p-1 grid grid-cols-3 gap-1 min-w-0">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`min-h-10 rounded-full text-xs md:text-sm font-bold px-2 min-w-0 truncate transition-colors ${
                  active
                    ? `${theme.primary} text-slate-950 shadow-lg`
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "queue" && (
          <section className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-3 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-black">Kuyruk</p>
                <p className={`text-xl font-black ${theme.text}`}>{todayQueue.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-3 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-black">Yanlış</p>
                <p className="text-xl font-black text-rose-300">{unresolvedWrong.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-3 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-black">Favori</p>
                <p className="text-xl font-black text-amber-300">{favoriteItems.length}</p>
              </div>
            </div>
            {fsrsSummary && (fsrsSummary.overdueCount > 0 || fsrsSummary.dueCount > 0) && (
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 flex items-center gap-3">
                <span className="text-base">🧠</span>
                <div className="min-w-0">
                  <p className="text-xs font-black text-violet-300">
                    FSRS Tekrar Kuyruğu
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {fsrsSummary.dueCount} soru bekliyor
                    {fsrsSummary.overdueCount > 0
                      ? ` · ${fsrsSummary.overdueCount} gecikmiş`
                      : ""}
                  </p>
                </div>
              </div>
            )}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
              <p className="text-xs text-slate-400 mb-2">Ders/Konu mini özet</p>
              <div className="text-sm text-slate-200">
                {topWrongTopic
                  ? `${topWrongTopic.ders} • ${topWrongTopic.konu} (${topWrongTopic.count} tekrar ihtiyacı)`
                  : "Henüz tekrar önceliği oluşmadı."}
              </div>
            </div>
          </section>
        )}

        {activeTab === "wrong" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-slate-300 font-bold">Toplam yanlış soru: {wrongItems.length}</p>
                <p className="text-xs text-slate-500">
                  {topWrongTopic
                    ? `En çok: ${topWrongTopic.ders} / ${topWrongTopic.konu}`
                    : "Henüz yanlış kaydı yok"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartWrongReview}
                className={`min-h-10 px-4 rounded-2xl text-xs font-black ${theme.primary} text-slate-950`}
              >
                Özel Çalışma Başlat
              </button>
            </div>
            {!wrongItems.length && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-slate-500">
                Yanlış yaptığın sorular burada listelenecek.
              </div>
            )}
            {wrongItems.map((item) => {
              const q = mapById.get(item.questionId);
              return (
                <div key={item.questionId} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-2 py-1 rounded-full text-[10px] border border-slate-700 text-slate-300">
                          {item.ders || "Ders"}
                        </span>
                        <span className="px-2 py-1 rounded-full text-[10px] border border-slate-700 text-slate-300">
                          {item.konu || "Konu"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        wrongCount: {item.wrongCount || 0} • Son yanlış: {formatDate(item.lastWrongAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => q && startReviewWithQuestions?.([q], "wrong-single")}
                      className="min-h-10 px-4 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold"
                    >
                      Tekrar et
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-slate-300 line-clamp-2">
                    {q ? safePreview(q.q) : "Soru bulunamadı"}
                  </p>
                </div>
              );
            })}
          </section>
        )}

        {activeTab === "favorite" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-slate-300 font-bold">Toplam favori: {favoriteItems.length}</p>
              <button
                type="button"
                onClick={handleStartFavoriteReview}
                className={`min-h-10 px-4 rounded-2xl text-xs font-black ${theme.primary} text-slate-950`}
              >
                Özel Çalışma Başlat
              </button>
            </div>
            {!favoriteItems.length && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-slate-500">
                Favoriye eklediğin sorular burada görünecek.
              </div>
            )}
            {favoriteItems.map((item) => {
              const q = mapById.get(item.questionId);
              return (
                <div key={item.questionId} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-2 py-1 rounded-full text-[10px] border border-slate-700 text-slate-300">
                          {item.ders || "Ders"}
                        </span>
                        <span className="px-2 py-1 rounded-full text-[10px] border border-slate-700 text-slate-300">
                          {item.konu || "Konu"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Eklenme: {formatDate(item.addedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => q && startReviewWithQuestions?.([q], "favorite-single")}
                        className="min-h-10 px-3 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold"
                      >
                        Çöz
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFavorite(item)}
                        className="min-h-10 px-3 rounded-xl border border-rose-500/30 text-rose-300 text-xs font-bold"
                      >
                        Çıkar
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-300 line-clamp-2">
                    {q ? safePreview(q.q) : "Soru bulunamadı"}
                  </p>
                </div>
              );
            })}
          </section>
        )}
        {loading && <p className="text-xs text-slate-500">Yükleniyor...</p>}
        <div className="md:hidden h-24" aria-hidden="true" />
      </div>
    </div>
  );
}
