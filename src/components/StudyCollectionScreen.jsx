import { useCallback, useEffect, useMemo, useState } from "react";
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
import FsrsActivityCard from "./study/FsrsActivityCard";
import AiDailyPlanCard from "./study/AiDailyPlanCard";

const ACCENT_HEX = {
  emerald: "#34d399",
  cyan: "#22d3ee",
  violet: "#a78bfa",
  amber: "#fbbf24",
  light: "#10b981",
};

const accentHex = (key) => ACCENT_HEX[key] || ACCENT_HEX.emerald;

const TABS = [
  { key: "queue", label: "Kuyruk" },
  { key: "wrong", label: "Yanlışlarım" },
  { key: "favorite", label: "Favorilerim" },
];

const formatDate = (dateValue) => {
  if (!dateValue) return "—";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
};

const safePreview = (text) => {
  if (!text) return "Soru metni bulunamadı.";
  return String(text).slice(0, 120);
};

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ArrowRight({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function StudyCollectionScreen({
  user,
  userData,
  isAuthReady = true,
  questions,
  accentTheme,
  accentThemeKey = "emerald",
  goDashboard,
  openExamSetSelect,
  startReviewWithQuestions,
}) {
  const theme = accentTheme || accentThemes.emerald;
  const hex = accentHex(accentThemeKey);
  const [activeTab, setActiveTab] = useState("queue");
  const [wrongItems, setWrongItems] = useState([]);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [todayQueue, setTodayQueue] = useState([]);
  const [fsrsSummary, setFsrsSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const mapById = useMemo(
    () => new Map((questions || []).map((q) => [Number(q.id), q])),
    [questions]
  );

  const hydrate = async () => {
    setLoading(true);
    setHasError(false);
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
    } catch {
      setHasError(true);
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

  const priorityChips = useMemo(() => {
    const subjects = (fsrsSummary?.topSubjects || []).slice(0, 2).map((s) => s.name);
    const topics = (fsrsSummary?.topTopics || []).slice(0, 1).map((t) => t.name);
    return [...subjects, ...topics].filter(Boolean);
  }, [fsrsSummary]);

  const handleStartQueue = () => {
    if (!todayQueue.length) return;
    trackClarityEvent("bugunku_tekrar_baslatildi");
    startReviewWithQuestions?.(todayQueue, "todayQueue");
  };

  const handleStartTopicTest = useCallback(
    (lesson, topic) => {
      if (!questions?.length) return;
      let pool = [...questions];
      if (lesson) pool = pool.filter((q) => q.ders === lesson);
      if (topic) pool = pool.filter((q) => q.konu === topic);
      if (!pool.length) return;
      const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 20);
      trackClarityEvent("ai_plan_topic_test_baslatildi");
      startReviewWithQuestions?.(shuffled, "topic_practice");
    },
    [questions, startReviewWithQuestions]
  );

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

  const dueCount = todayQueue.length;
  const overdue = fsrsSummary?.overdueCount || 0;

  const collectionStats = [
    { key: "queue", label: "Kuyruk", value: dueCount, color: hex },
    { key: "wrong", label: "Yanlış", value: unresolvedWrong.length, color: "#fb7185" },
    { key: "favorite", label: "Favori", value: favoriteItems.length, color: "#fbbf24" },
  ];

  return (
    <div
      className="min-h-dvh bg-[#05070d] text-white"
      style={{
        paddingTop: "calc(0.75rem + env(safe-area-inset-top))",
        backgroundImage: `radial-gradient(125% 80% at 50% -10%, ${hex}12, transparent 55%)`,
      }}
    >
      <div className="mx-auto w-full max-w-2xl px-4 pb-28 md:px-6">
        {/* Üst bar */}
        <div className="flex items-center justify-between gap-3 py-3">
          <button
            type="button"
            onClick={goDashboard}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:bg-white/[0.08] active:scale-95"
            aria-label="Panele dön"
          >
            <ChevronLeft />
          </button>
          <div className="text-center">
            <p className="text-sm font-black tracking-tight text-white">Çalışma Alanı</p>
            <p className="text-[11px] font-medium text-slate-500">Tekrar · Yanlış · Favori</p>
          </div>
          <div className="h-10 w-10" aria-hidden="true" />
        </div>

        {/* Hata banner — Firestore ulaşılamazsa */}
        {hasError && (
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3">
            <span className="shrink-0 text-lg" aria-hidden="true">⚠️</span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-200">Veriler yüklenemedi</p>
              <p className="text-xs text-amber-300/70">İnternet bağlantını kontrol et ve</p>
            </div>
            <button
              type="button"
              onClick={hydrate}
              className="ml-auto shrink-0 rounded-xl border border-amber-400/30 bg-amber-400/15 px-3 py-1.5 text-xs font-black text-amber-200 transition-colors hover:bg-amber-400/25"
            >
              Yenile
            </button>
          </div>
        )}

        {/* ───────── HERO: FSRS Tekrar ───────── */}
        <section
          className="relative mt-1 overflow-hidden rounded-[30px] border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-6 shadow-[0_30px_70px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full blur-3xl"
            style={{ background: `${hex}1f` }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-cyan-400/[0.06] blur-3xl"
          />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
                style={{ borderColor: `${hex}40`, color: hex, backgroundColor: `${hex}14` }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: hex, boxShadow: `0 0 8px ${hex}` }}
                />
                FSRS Akıllı Tekrar
              </span>
              {overdue > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/25 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                  {overdue} gecikmiş
                </span>
              )}
            </div>

            {dueCount > 0 ? (
              <>
                <div className="mt-4 flex items-end gap-3">
                  <span
                    className="text-[64px] font-black leading-[0.85] tracking-tighter tabular-nums"
                    style={{ color: hex }}
                  >
                    {dueCount}
                  </span>
                  <span className="pb-1.5 text-base font-bold leading-tight text-slate-300">
                    soru bugün
                    <br />
                    tekrara hazır
                  </span>
                </div>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
                  Zorlandığın sorular FSRS zamanlamasıyla öne alındı. Şimdi çözmek
                  hafızanı en verimli noktada güçlendirir.
                </p>

                {priorityChips.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Öncelik
                    </span>
                    {priorityChips.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-bold text-slate-200"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleStartQueue}
                  className="group mt-5 flex min-h-[58px] w-full items-center justify-center gap-2.5 rounded-2xl px-6 text-base font-black text-slate-950 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99]"
                  style={{ backgroundColor: hex, boxShadow: `0 14px 34px -22px ${hex}` }}
                >
                  Tekrarı Başlat
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </>
            ) : (
              <>
                <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight text-white">
                  Bugün için tekrar yok
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                  FSRS planın temiz. Yeni konu çözerek planını besle ya da
                  aşağıdan özel çalışma başlat.
                </p>
                <div className="mt-5 flex flex-col gap-2.5">
                  {unresolvedWrong.length > 0 && (
                    <button
                      type="button"
                      onClick={handleStartWrongReview}
                      className="flex min-h-[52px] w-full items-center justify-between rounded-2xl border border-rose-400/20 bg-rose-500/[0.08] px-5 text-sm font-bold text-rose-200 transition-colors hover:bg-rose-500/[0.14] active:scale-[0.99]"
                    >
                      <span>Yanlışlardan çalış · {unresolvedWrong.length} soru</span>
                      <ArrowRight />
                    </button>
                  )}
                  {favoriteItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handleStartFavoriteReview}
                      className="flex min-h-[52px] w-full items-center justify-between rounded-2xl border border-amber-300/20 bg-amber-400/[0.08] px-5 text-sm font-bold text-amber-200 transition-colors hover:bg-amber-400/[0.14] active:scale-[0.99]"
                    >
                      <span>Favorilerden çalış · {favoriteItems.length} soru</span>
                      <ArrowRight />
                    </button>
                  )}
                  {unresolvedWrong.length === 0 && favoriteItems.length === 0 && (
                    <button
                      type="button"
                      onClick={goDashboard}
                      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-bold text-slate-200 transition-colors hover:bg-white/[0.08]"
                    >
                      Yeni konu çözmeye başla
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ───────── Koleksiyon istatistik pill'leri ───────── */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {collectionStats.map((s) => {
            const active = activeTab === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveTab(s.key)}
                className={`rounded-2xl border px-3 py-3 text-left transition-all active:scale-[0.97] ${
                  active
                    ? "border-white/20 bg-white/[0.07]"
                    : "border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.05]"
                }`}
              >
                <span
                  className="text-2xl font-black tabular-nums leading-none"
                  style={{ color: s.color }}
                >
                  {s.value}
                </span>
                <p className="mt-1 text-[11px] font-bold text-slate-400">{s.label}</p>
              </button>
            );
          })}
        </div>

        {/* ───────── FSRS aktivite grafiği ───────── */}
        <div className="mt-4">
          <FsrsActivityCard
            user={user}
            isAuthReady={isAuthReady}
            accentThemeKey={accentThemeKey}
            dueCountSnapshot={fsrsSummary?.dueCount ?? dueCount}
          />
        </div>

        {/* ───────── AI günlük plan ───────── */}
        <div className="mt-4">
          <AiDailyPlanCard
            user={user}
            theme={theme}
            onStartFsrs={dueCount > 0 ? handleStartQueue : undefined}
            onStartTopicTest={handleStartTopicTest}
          />
        </div>

        {/* ───────── Koleksiyon: tab + içerik ───────── */}
        <div className="mt-6">
          <div className="grid grid-cols-3 gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-1">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`min-h-10 truncate rounded-xl px-2 text-xs font-bold transition-all md:text-sm ${
                    active ? "text-slate-950" : "text-slate-400 hover:text-slate-200"
                  }`}
                  style={active ? { backgroundColor: hex } : undefined}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            {activeTab === "queue" && (
              <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Tekrar kuyruğu
                </p>
                {dueCount > 0 ? (
                  <>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      Bugün <span className="font-black" style={{ color: hex }}>{dueCount}</span> soru
                      hazır
                      {overdue > 0 ? `, bunların ${overdue} tanesi gecikmiş` : ""}.
                    </p>
                    {topWrongTopic && (
                      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3">
                        <span className="text-lg">🎯</span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            En çok tekrar gereken
                          </p>
                          <p className="truncate text-sm font-bold text-slate-200">
                            {topWrongTopic.ders} · {topWrongTopic.konu}
                          </p>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleStartQueue}
                      className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl text-sm font-black text-slate-950 transition-all active:scale-[0.99]"
                      style={{ backgroundColor: hex }}
                    >
                      Tekrarı Başlat
                      <ArrowRight />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-6 text-center">
                    <span className="text-3xl" aria-hidden="true">🎯</span>
                    <p className="mt-2 text-sm font-bold text-slate-300">Kuyruk temiz</p>
                    <p className="mt-1 max-w-xs text-xs text-slate-500">
                      Bugün tekrar zamanı gelen kart yok. Yeni soru çözdükçe kuyruğun dolar.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "wrong" && (
              <CollectionList
                items={wrongItems}
                mapById={mapById}
                hex={hex}
                emptyIcon="📝"
                emptyText="Yanlış yaptığın sorular burada birikecek."
                headerLabel={`${wrongItems.length} yanlış soru`}
                headerSub={
                  topWrongTopic
                    ? `En çok: ${topWrongTopic.ders} / ${topWrongTopic.konu}`
                    : null
                }
                onStartAll={unresolvedWrong.length ? handleStartWrongReview : null}
                renderMeta={(item) =>
                  `${item.wrongCount || 0}× yanlış · son ${formatDate(item.lastWrongAt)}`
                }
                onSolve={(q) => startReviewWithQuestions?.([q], "wrong-single")}
              />
            )}

            {activeTab === "favorite" && (
              <CollectionList
                items={favoriteItems}
                mapById={mapById}
                hex={hex}
                emptyIcon="⭐"
                emptyText="Favoriye eklediğin sorular burada görünecek."
                headerLabel={`${favoriteItems.length} favori soru`}
                headerSub={null}
                onStartAll={favoriteItems.length ? handleStartFavoriteReview : null}
                renderMeta={(item) => `Eklenme: ${formatDate(item.addedAt)}`}
                onSolve={(q) => startReviewWithQuestions?.([q], "favorite-single")}
                onRemove={handleRemoveFavorite}
              />
            )}
          </div>
        </div>

        {/* ───────── Deneme performansı ───────── */}
        <div className="mt-6">
          <PerformanceChartCard
            user={user}
            userData={userData}
            accentTheme={theme}
            accentThemeKey={accentThemeKey}
            onStartExam={openExamSetSelect}
          />
        </div>

        {loading && (
          <p className="mt-4 text-center text-xs text-slate-600">Yükleniyor…</p>
        )}
      </div>
    </div>
  );
}

function CollectionList({
  items,
  mapById,
  hex,
  emptyIcon,
  emptyText,
  headerLabel,
  headerSub,
  onStartAll,
  renderMeta,
  onSolve,
  onRemove,
}) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center">
        <span className="text-3xl" aria-hidden="true">{emptyIcon}</span>
        <p className="mt-2 max-w-xs text-sm text-slate-400">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-white">{headerLabel}</p>
          {headerSub && <p className="truncate text-[11px] text-slate-500">{headerSub}</p>}
        </div>
        {onStartAll && (
          <button
            type="button"
            onClick={onStartAll}
            className="shrink-0 rounded-xl px-3.5 py-2 text-xs font-black text-slate-950"
            style={{ backgroundColor: hex }}
          >
            Özel çalış
          </button>
        )}
      </div>

      {items.map((item) => {
        const q = mapById.get(item.questionId);
        return (
          <div
            key={item.questionId}
            className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-bold text-slate-300">
                {item.ders || "Ders"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-bold text-slate-400">
                {item.konu || "Konu"}
              </span>
            </div>
            <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-slate-300">
              {q ? safePreview(q.q) : "Soru bulunamadı"}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="truncate text-[11px] text-slate-500">{renderMeta(item)}</p>
              <div className="flex shrink-0 gap-2">
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(item)}
                    className="rounded-xl border border-rose-500/25 px-3 py-1.5 text-[11px] font-bold text-rose-300 transition-colors hover:bg-rose-500/10"
                  >
                    Çıkar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => q && onSolve(q)}
                  disabled={!q}
                  className="rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-bold text-slate-200 transition-colors hover:bg-white/[0.12] disabled:opacity-40"
                >
                  Çöz
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
