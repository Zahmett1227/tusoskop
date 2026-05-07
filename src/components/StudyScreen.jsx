import { useState } from "react";
import { usePrefersReducedMotion, useSwipeHandlers } from "../hooks/useSwipeHandlers";
import { accentThemes } from "../theme/accentThemes";
import { getSubjectVisual } from "../theme/subjectVisual";

export default function StudyScreen({
  q,
  index,
  total,
  selected,
  setSelected,
  showAnswer,
  revealAnswer,
  nextQuestion,
  prevQuestion,
  goDashboard,
  flowMode,
  setFlowMode,
  streak,
  bestStreak,
  feedback,
  isAutoAdvancing,
  socialProof,
  mastery,
  topicProgress,
  accentTheme,
  isFavorite,
  onToggleFavorite,
  favoriteFeedback,
}) {
  const theme = accentTheme || accentThemes.emerald;
  const subjectVisual = getSubjectVisual(q?.ders);
  const reducedMotion = usePrefersReducedMotion();
  const swipeStudy = useSwipeHandlers({
    enabled: Boolean(q) && showAnswer && !reducedMotion,
    onSwipeLeft: nextQuestion,
    onSwipeRight: index > 0 ? prevQuestion : undefined,
    reducedMotion,
  });
  const progressPercent = Math.round(((index + 1) / Math.max(1, total)) * 100);
  const [insightsOpen, setInsightsOpen] = useState(true);

  if (!q && total > 0) {
    return (
      <div
        className="min-h-dvh bg-slate-950 text-white overflow-x-hidden flex flex-col"
        style={{
          paddingTop: "calc(0.75rem + env(safe-area-inset-top))",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right))",
        }}
      >
        <div className="max-w-4xl w-full mx-auto space-y-3 md:space-y-5 md:px-2 flex-1">
          <div className="rounded-3xl p-4 md:p-6 border border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900/80">
            <div className="skeleton-shimmer h-3 w-36 rounded mb-4" />
            <div className="space-y-2">
              <div className="skeleton-shimmer h-4 w-full rounded" />
              <div className="skeleton-shimmer h-4 w-11/12 rounded" />
              <div className="skeleton-shimmer h-4 w-4/5 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton-shimmer h-14 rounded-2xl border border-slate-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="min-h-dvh bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Soru bulunamadı</p>
          <button
            onClick={goDashboard}
            className={`px-4 py-3 rounded-2xl ${theme.primary} text-slate-950 font-bold active:scale-95`}
          >
            Panele dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.10),transparent_35%),#020617] text-white overflow-x-hidden flex flex-col px-4 py-5 sm:py-8 md:py-10"
      style={{
        paddingTop: "calc(0.75rem + env(safe-area-inset-top))",
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      {/* Üst bar — tek satır rozetler + taşarsa yatay kaydırma */}
      <div className="sticky top-2 z-30 mx-auto mb-5 flex max-w-4xl w-full flex-col gap-2 rounded-[1.5rem] border border-slate-800/80 bg-slate-950/88 p-2 shadow-2xl shadow-black/30 sticky-bar-blur">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={goDashboard}
            className={`inline-flex shrink-0 items-center gap-2 rounded-2xl border ${theme.border} ${theme.softBg} px-3 py-2.5 text-sm font-extrabold ${theme.text} transition-all duration-200 hover:-translate-y-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] ${theme.ring}`}
          >
            <span>←</span> Panele dön
          </button>
          <div className="flex min-w-0 flex-1 justify-end gap-2 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setFlowMode?.(!flowMode)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] ${theme.ring} ${
                flowMode
                  ? `${theme.border} ${theme.softBg} ${theme.text} shadow-lg ${theme.glow}`
                  : "border-slate-700 bg-slate-900/70 text-slate-400"
              }`}
            >
              Akış modu
              <span className={`w-2 h-2 rounded-full ${flowMode ? theme.primary : "bg-slate-600"}`} />
            </button>
            <span
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold ${
                streak >= 3
                  ? "border-orange-400/20 bg-orange-400/10 text-orange-200 shadow-[0_0_25px_rgba(251,146,60,0.12)]"
                  : "border-slate-700 bg-slate-900/70 text-slate-400"
              }`}
            >
              {streak >= 10 ? `🔥 Seri: ${streak} | Klinik soğukkanlılık` : streak >= 5 ? `🔥 Seri: ${streak} | Isındın` : `🔥 Seri: ${streak}`}
              <span className="text-slate-400">Rekor: {bestStreak}</span>
            </span>
            <span className="inline-flex shrink-0 items-center rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-bold text-slate-400 tabular-nums">
              {index + 1} / {total}
            </span>
          </div>
        </div>
        <div className="basis-full px-1 pb-0.5">
          <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
            <span>İlerleme</span>
            <span>%{progressPercent}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${theme.gradient} shadow-[0_0_24px_rgba(16,185,129,0.32)] transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div
        className="mx-auto max-w-4xl w-full space-y-6 flex-1 pb-[calc(6.75rem+env(safe-area-inset-bottom))] md:pb-10 overscroll-y-contain touch-pan-y"
        {...swipeStudy}
      >
        {topicProgress && (
          <div className="rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold tracking-wide text-yellow-300">
                  {topicProgress.ders} • {topicProgress.konu}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {topicProgress.current} / {topicProgress.total} soru
                </div>
              </div>
              <div className="text-xs font-bold text-slate-300">
                %{Math.round((topicProgress.current / Math.max(1, topicProgress.total)) * 100)}
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 shadow-[0_0_20px_rgba(250,204,21,0.25)] transition-all duration-500"
                style={{
                  width: `${Math.round((topicProgress.current / Math.max(1, topicProgress.total)) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Soru kartı */}
        <div className={`relative overflow-hidden rounded-[2rem] border ${theme.border} ${subjectVisual.border} bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 shadow-2xl ${theme.glow} backdrop-blur-xl p-5 md:p-8`}>
          <div className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl ${theme.softBg}`} />
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleFavorite?.(q);
            }}
            title={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
            className={`absolute z-20 top-3 right-3 min-h-10 min-w-10 px-2 rounded-full border text-lg font-black pointer-events-auto transition-all ${
              isFavorite
                ? "border-amber-300/60 bg-amber-400/15 text-amber-200"
                : "border-slate-700 bg-slate-900/80 text-slate-400 hover:text-amber-200"
            }`}
          >
            {isFavorite ? "★" : "☆"}
          </button>
          <div className={`relative z-10 mb-4 inline-flex max-w-[calc(100%-3rem)] items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/60 px-3 py-1.5 text-xs md:text-sm font-extrabold tracking-wide ${theme.text} uppercase`}>
            <span className={`h-2 w-2 rounded-full ${subjectVisual.dot}`} />
            {q.ders} • {q.konu}
          </div>
          <div className="relative z-10 max-h-[min(52dvh,28rem)] md:max-h-[42vh] overflow-y-auto overscroll-y-contain pr-1 -mr-1">
            <div className="max-w-prose">
              <h2 className="exam-question-body mobile-reading-stem leading-relaxed tracking-tight text-slate-50 break-words whitespace-normal [overflow-wrap:anywhere]">
                {q.q}
              </h2>
            </div>
          </div>
        </div>

        {/* Mobil: içgörü — aç/kapa (varsayılan açık) */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setInsightsOpen((o) => !o)}
            className={`mb-2 flex w-full items-center justify-between rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-2.5 text-left text-xs font-extrabold text-slate-200 transition hover:bg-slate-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] ${theme.ring}`}
            aria-expanded={insightsOpen}
          >
            <span>İçgörü (sosyal kanıt & mastery)</span>
            <span className="tabular-nums text-slate-400">{insightsOpen ? "▼" : "▶"}</span>
          </button>
          {insightsOpen ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3">
              <div className={`inline-flex flex-wrap items-center gap-2 rounded-xl border ${theme.border} ${theme.softBg} px-3 py-2 shadow ${theme.glow}`}>
                <span className="text-[10px] uppercase tracking-wider font-black text-slate-400">Sosyal</span>
                <span className={`text-xs font-black ${theme.text}`}>%{socialProof?.wrongRate ?? 52}</span>
                <span className="text-[11px] text-slate-300">{socialProof?.label || "Dengeli"}</span>
              </div>
              <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-950/80 px-3 py-2 shadow">
                <span className="text-[10px] uppercase tracking-wider font-black text-slate-400">Mastery</span>
                <span className="text-xs font-bold text-slate-200">{mastery?.level || "Başlangıç"}</span>
                <span className={`text-xs font-black ${theme.text}`}>%{mastery?.accuracy ?? 0}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full border border-slate-700/70 bg-slate-800">
                <div
                  className={`h-full bg-gradient-to-r ${theme.gradient} transition-all duration-500`}
                  style={{ width: `${mastery?.progress ?? 8}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Desktop/tablet: geniş premium kartlar */}
        <div className="hidden md:grid grid-cols-2 gap-3">
          <div className={`rounded-2xl border ${theme.border} ${theme.softBg} px-4 py-3 shadow-lg ${theme.glow}`}>
            <p className="text-[11px] uppercase tracking-widest font-black text-slate-400 mb-1">Sosyal Kanıt</p>
            <p className={`text-sm font-bold ${theme.text}`}>
              Bu soru kullanıcıların %{socialProof?.wrongRate ?? 52}’si tarafından yanlış yanıtlanmış.
            </p>
            <p className="text-xs text-slate-400 mt-1">{socialProof?.label || "Dengeli zorluk"}</p>
          </div>
          <div className="rounded-2xl border border-slate-700/70 bg-slate-950/80 px-4 py-3 shadow-xl">
            <p className="text-[11px] uppercase tracking-widest font-black text-slate-400 mb-1">Konu Mastery</p>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-300 font-bold">{mastery?.level || "Başlangıç"}</span>
              <span className={`${theme.text} font-black`}>%{mastery?.accuracy ?? 0}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700/70">
              <div
                className={`h-full bg-gradient-to-r ${theme.gradient} transition-all duration-500`}
                style={{ width: `${mastery?.progress ?? 8}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {mastery?.seen || 0} soru • {mastery?.correct || 0} doğru
            </p>
          </div>
        </div>

        {/* Seçenekler */}
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            (() => {
              const isSelected = selected === i;
              const isCorrectOption = i === q.correct;
              const selectedIsWrong = showAnswer && isSelected && !isCorrectOption;
              const selectedIsCorrect = showAnswer && isSelected && isCorrectOption;
              const showCorrectHighlight = showAnswer && isCorrectOption;

              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelected(i)}
                  className={`group flex min-h-[58px] w-full min-w-0 items-start gap-3 rounded-[1.35rem] border px-4 py-4 text-left text-slate-100 shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] ${theme.ring} active:scale-[0.99] sm:items-center sm:gap-4 md:px-6 md:py-5
                    ${isSelected ? `${theme.border} ${theme.softBg} shadow-lg ${theme.glow}` : "border-slate-700/80 bg-slate-950/80 hover:-translate-y-px hover:bg-slate-900/95 hover:border-slate-500 hover:shadow-lg hover:shadow-black/20"}
                    ${showCorrectHighlight ? `${theme.border} ${theme.softBg}` : ""}
                    ${selectedIsWrong ? "border-amber-400/70 bg-amber-500/10 shadow-[0_0_35px_rgba(250,204,21,0.15)]" : ""}
                    ${selectedIsCorrect ? "correct-pop" : ""}
                  `}
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-extrabold transition-all mt-0.5 sm:mt-0
                    ${showCorrectHighlight
                      ? `${theme.primary} text-slate-950 ${theme.border}`
                      : isSelected
                      ? `${theme.primary} text-slate-950 ${theme.border}`
                      : "border-slate-600/70 bg-gradient-to-br from-slate-700 to-slate-900 text-slate-300"}
                  `}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="min-w-0 flex-1 break-words whitespace-normal [overflow-wrap:anywhere] text-base font-semibold leading-relaxed text-slate-100 md:text-[1.05rem] md:leading-relaxed">
                    {opt}
                  </span>
                  {showCorrectHighlight && (
                    <span className={`${theme.text} font-black text-sm`}>✔</span>
                  )}
                </button>
              );
            })()
          ))}
        </div>

        {feedback && (
          <div
            className={`rounded-[1.5rem] px-4 py-4 text-sm font-extrabold shadow-lg md:px-5 ${
              feedback.type === "correct"
                ? "border border-emerald-400/25 bg-gradient-to-r from-emerald-400/15 to-teal-400/10 text-emerald-100 shadow-[0_0_35px_rgba(52,211,153,0.14)]"
                : feedback.type === "wrong"
                ? "border border-red-400/25 bg-gradient-to-r from-red-400/15 to-amber-400/10 text-red-100 shadow-[0_0_35px_rgba(248,113,113,0.14)]"
                : "border border-slate-500/30 bg-slate-800/70 text-slate-300"
            }`}
          >
            {feedback.text}
          </div>
        )}
        {favoriteFeedback && (
          <div className="rounded-[1.5rem] px-4 py-4 text-sm font-extrabold border border-amber-300/25 bg-amber-400/10 text-amber-100 shadow-lg shadow-amber-950/10">
            {favoriteFeedback}
          </div>
        )}

        {/* Aksiyon butonları */}
        {!showAnswer ? (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mobile-action-bar sticky bottom-0 z-30 bg-slate-950/95 sticky-bar-blur rounded-2xl p-1 border border-slate-800/60 shadow-[0_-8px_32px_rgba(0,0,0,0.35)]">
            <button
              type="button"
              onClick={revealAnswer}
              disabled={isAutoAdvancing}
              className={`min-h-12 rounded-2xl px-6 py-4 font-extrabold text-slate-950 shadow-lg ${theme.glow} transition-all duration-200 hover:-translate-y-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] ${theme.ring} ${theme.primary} ${theme.primaryHover} disabled:opacity-50`}
            >
              {isAutoAdvancing ? "Geçiliyor..." : "Cevabı göster"}
            </button>
            <button
              type="button"
              onClick={goDashboard}
              className="min-h-12 rounded-2xl border border-slate-700/80 bg-slate-800/80 px-6 py-4 font-extrabold text-slate-100 transition-all duration-200 hover:-translate-y-px hover:bg-slate-700/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
            >
              Bitir
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cevap & açıklama */}
            <div className="rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900 to-slate-900/70 p-5 md:p-6">
              <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest mb-1">
                Doğru cevap
              </p>
              <p className={`text-sm md:text-base font-bold ${theme.text} break-words`}>
                {String.fromCharCode(65 + q.correct)} — {q.options[q.correct]}
              </p>
              {selected !== null && selected !== q.correct && (
                <p className="mt-2 text-xs text-amber-300/90 font-medium">
                  Bu soru çoğu kişinin zorlandığı yerlerden.
                </p>
              )}

              {q.exp && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest mb-1.5">
                    Açıklama
                  </p>
                  <p className="text-[0.9375rem] sm:text-sm md:text-base text-slate-300 leading-[1.68] md:leading-[1.65] break-words whitespace-normal [overflow-wrap:anywhere]">
                    {q.exp}
                  </p>
                </div>
              )}
            </div>

            {/* İleri/geri butonlar */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mobile-action-bar sticky bottom-0 z-30 bg-slate-950/95 sticky-bar-blur rounded-2xl p-1 border border-slate-800/60 shadow-[0_-8px_32px_rgba(0,0,0,0.35)]">
              <button
                type="button"
                className="min-h-12 rounded-2xl border border-slate-700/80 bg-slate-800/80 px-6 py-4 font-extrabold text-slate-100 transition-all duration-200 hover:-translate-y-px hover:bg-slate-700/90 disabled:opacity-40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]"
                onClick={prevQuestion}
                disabled={index === 0}
              >
                ← Önceki
              </button>
              <button
                type="button"
                onClick={nextQuestion}
                className={`min-h-12 rounded-2xl px-6 py-4 font-extrabold text-slate-950 shadow-lg ${theme.glow} transition-all duration-200 hover:-translate-y-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] ${theme.ring} ${theme.primary} ${theme.primaryHover}`}
              >
                {index < total - 1 ? "Sonraki →" : "Özete git"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
