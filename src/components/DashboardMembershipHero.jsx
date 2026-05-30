import React from "react";
import { PRICING } from "../constants/pricing";
import { formatPremiumUntil } from "../utils/premiumUtils";

function isExpiredPlus(userData) {
  if (!userData) return false;
  if (userData.lifetimePremium) return false;
  if (userData.plan !== "plus" || userData.premiumStatus !== "active") return false;
  if (!userData.premiumUntil) return false;
  const until = new Date(userData.premiumUntil?.toDate?.() ?? userData.premiumUntil);
  return !isNaN(until.getTime()) && until <= new Date();
}

/**
 * Dashboard üstü — plan özeti + Plus upsell / Plus durum kartı.
 * setView("premiumInfo") akışı korunur.
 */
export default function DashboardMembershipHero({
  isLightTheme,
  premiumActive,
  userData,
  freeQuestionUsed,
  freeExamUsed,
  freeReviewUsed,
  onOpenPremium,
}) {
  const lifetime = Boolean(userData?.lifetimePremium);
  const untilLabel = formatPremiumUntil(userData?.premiumUntil);

  const outer = isLightTheme
    ? "border-slate-200/90 bg-gradient-to-br from-white via-[#fffefb] to-[#f4f0ea] shadow-[0_20px_50px_-28px_rgba(15,23,42,0.12)] hover:shadow-[0_28px_60px_-26px_rgba(15,23,42,0.16)]"
    : premiumActive
      ? "border-emerald-500/25 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 shadow-[0_24px_60px_-28px_rgba(16,185,129,0.18)] hover:shadow-[0_28px_70px_-24px_rgba(16,185,129,0.22)]"
      : "border-slate-700/80 bg-gradient-to-br from-slate-950 via-[#0f1419] to-indigo-950/40 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)] hover:shadow-[0_28px_70px_-28px_rgba(99,102,241,0.12)]";

  const glowOrb = isLightTheme
    ? "bg-amber-200/30"
    : premiumActive
      ? "bg-emerald-500/15"
      : "bg-indigo-500/20";

  const leftTitle = premiumActive ? "Plus aktif" : "Ücretsiz plan";
  const leftLead = premiumActive
    ? "Sınırsız çalışma akışın açık. Tüm Plus avantajlarından yararlanıyorsun."
    : "Günlük soru, deneme ve tekrar limitlerini buradan takip edebilirsin.";
  const leftMeta = premiumActive
    ? lifetime
      ? "Ömür boyu erişim aktif."
      : untilLabel && untilLabel !== "-"
        ? `${untilLabel} tarihine kadar aktif.`
        : "Plus erişimin hazır."
    : "Limitler her gün yenilenir.";

  const rightBadge = premiumActive ? "Plus" : "Önerilen";
  const rightBadgeSub = premiumActive ? "Aktif üyelik" : "Sınırsız erişim";
  const rightHeadline = premiumActive
    ? "Avantajların aktif."
    : "Plus ile tüm sınırları kaldır.";
  const rightSub = premiumActive
    ? "Sınırsız soru, sınırsız deneme ve gelişmiş analiz erişimin hazır."
    : "Sınırsız soru çöz, deneme sınırlarını kaldır ve tekrar akışını kesintisiz sürdür.";
  const ctaLabel = premiumActive ? "Plan detayı" : "Plus'ı İncele";

  const chipBase = isLightTheme
    ? "border-slate-200/90 bg-white/90 text-slate-800 shadow-sm"
    : "border-white/10 bg-white/[0.04] text-slate-100 backdrop-blur-sm";

  const expiredPlus = isExpiredPlus(userData);

  return (
    <>
    {expiredPlus && (
      <div className={`mb-4 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${isLightTheme ? "border-amber-300 bg-amber-50 text-amber-900" : "border-amber-500/40 bg-amber-500/10 text-amber-200"}`}>
        <span aria-hidden>⚠</span>
        <span>Plus aboneliğin sona erdi. Devam etmek için yenile.</span>
        <button
          type="button"
          onClick={onOpenPremium}
          className={`ml-auto shrink-0 rounded-xl px-3 py-1.5 text-xs font-black transition ${isLightTheme ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-amber-500 text-slate-950 hover:bg-amber-400"}`}
        >
          Yenile
        </button>
      </div>
    )}
    <div
      className={`group relative mb-6 overflow-hidden rounded-3xl border p-5 sm:p-7 md:p-8 transition-all duration-300 ease-out hover:-translate-y-0.5 ${outer}`}
    >
      <div
        className={`pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full blur-3xl ${glowOrb}`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full blur-3xl ${isLightTheme ? "bg-violet-200/25" : "bg-violet-600/10"}`}
        aria-hidden
      />

      <div className="relative z-[1] grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10 lg:items-stretch">
        {/* Sol: plan özeti */}
        <div className="min-w-0 flex flex-col">
          <p
            className={`text-[10px] font-black uppercase tracking-[0.2em] ${
              isLightTheme ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Planın
          </p>
          <h2
            className={`mt-2 text-3xl sm:text-4xl font-black tracking-tight leading-tight ${
              isLightTheme ? "text-slate-950" : "text-white"
            }`}
          >
            {leftTitle}
          </h2>
          <p
            className={`mt-2 text-sm sm:text-base font-medium leading-relaxed max-w-md ${
              isLightTheme ? "text-slate-600" : "text-slate-300"
            }`}
          >
            {leftLead}
          </p>
          <p
            className={`mt-2 text-xs sm:text-sm font-medium ${
              premiumActive
                ? isLightTheme
                  ? "text-emerald-700"
                  : "text-emerald-300/90"
                : isLightTheme
                  ? "text-slate-500"
                  : "text-slate-400"
            }`}
          >
            {leftMeta}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {premiumActive ? (
              <>
                <span
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-semibold ${
                    isLightTheme
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                  }`}
                >
                  <span className="text-base leading-none opacity-90" aria-hidden>
                    ◆
                  </span>
                  Sınırsız soru
                </span>
                <span
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-semibold ${
                    isLightTheme
                      ? "border-violet-200 bg-violet-50 text-violet-900"
                      : "border-violet-400/25 bg-violet-500/10 text-violet-100"
                  }`}
                >
                  <span className="text-base leading-none opacity-90" aria-hidden>
                    ◆
                  </span>
                  Sınırsız deneme
                </span>
                <span
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-semibold ${
                    isLightTheme
                      ? "border-cyan-200 bg-cyan-50 text-cyan-900"
                      : "border-cyan-400/25 bg-cyan-500/10 text-cyan-100"
                  }`}
                >
                  <span className="text-base leading-none opacity-90" aria-hidden>
                    ◆
                  </span>
                  Sınırsız tekrar
                </span>
              </>
            ) : (
              <>
                <UsageChip
                  isLightTheme={isLightTheme}
                  chipBase={chipBase}
                  label="Bugün"
                  value={`${freeQuestionUsed}/30`}
                  suffix="soru"
                />
                <UsageChip
                  isLightTheme={isLightTheme}
                  chipBase={chipBase}
                  label="Deneme"
                  value={`${freeExamUsed}/1`}
                  suffix="bu ay"
                />
                <UsageChip
                  isLightTheme={isLightTheme}
                  chipBase={chipBase}
                  label="Tekrar"
                  value={`${freeReviewUsed}/10`}
                  suffix="bugün"
                />
              </>
            )}
          </div>
        </div>

        {/* Sağ: upsell / Plus paneli */}
        <div className="min-w-0 flex">
          <div
            className={`flex w-full flex-col justify-between rounded-2xl border p-5 sm:p-6 ${
              isLightTheme
                ? "border-slate-200/90 bg-gradient-to-br from-[#faf8f4] to-white shadow-inner"
                : premiumActive
                  ? "border-emerald-400/20 bg-gradient-to-br from-emerald-950/25 to-slate-900/80"
                  : "border-indigo-400/20 bg-gradient-to-br from-indigo-950/35 to-slate-900/90"
            }`}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    isLightTheme
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-amber-400/35 bg-amber-500/15 text-amber-200"
                  }`}
                >
                  {rightBadge}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isLightTheme ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  {rightBadgeSub}
                </span>
              </div>

              <h3
                className={`font-black leading-tight tracking-tight ${
                  premiumActive
                    ? `mt-3 text-2xl sm:text-3xl ${isLightTheme ? "text-slate-950" : "text-white"}`
                    : `mt-3 text-2xl sm:text-3xl md:text-[1.75rem] ${isLightTheme ? "text-slate-950" : "text-white"}`
                }`}
              >
                {rightHeadline}
              </h3>

              {!premiumActive ? (
                <p
                  className={`mt-2 text-lg sm:text-xl font-black leading-snug tracking-tight ${
                    isLightTheme ? "text-amber-800" : "text-amber-200"
                  }`}
                >
                  {PRICING.PLUS_STARTS_AT_LABEL}
                </p>
              ) : null}

              <p
                className={`mt-2 text-sm sm:text-base font-medium leading-relaxed ${
                  isLightTheme ? "text-slate-600" : "text-slate-300"
                }`}
              >
                {rightSub}
              </p>

              {!premiumActive ? (
                <ul
                  className={`mt-4 space-y-1.5 text-xs sm:text-sm font-semibold ${
                    isLightTheme ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  <li className="flex gap-2">
                    <span className="text-emerald-500 shrink-0" aria-hidden>
                      ✓
                    </span>
                    Sınırsız soru ve konu pratiği
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 shrink-0" aria-hidden>
                      ✓
                    </span>
                    Deneme ve tekrar limitleri kalkar
                  </li>
                </ul>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onOpenPremium}
              className={`mt-6 w-full min-h-[3.25rem] rounded-2xl text-base font-extrabold tracking-tight transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                premiumActive
                  ? isLightTheme
                    ? "border border-slate-300 bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-400 focus-visible:ring-offset-[#faf8f4]"
                    : "border border-white/15 bg-white/10 text-white hover:bg-white/15 focus-visible:ring-white/40 focus-visible:ring-offset-slate-900"
                  : isLightTheme
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-lg shadow-amber-900/15 hover:brightness-105 active:scale-[0.99] focus-visible:ring-amber-500 focus-visible:ring-offset-white"
                    : "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-600 text-slate-950 shadow-lg shadow-black/30 hover:brightness-110 active:scale-[0.99] focus-visible:ring-amber-400 focus-visible:ring-offset-slate-900"
              }`}
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function UsageChip({ isLightTheme, chipBase, label, value, suffix }) {
  return (
    <div
      className={`inline-flex min-w-0 max-w-full flex-col rounded-2xl border px-3.5 py-2.5 ${chipBase}`}
    >
      <span
        className={`text-[10px] font-bold uppercase tracking-wider ${
          isLightTheme ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {label}
      </span>
      <div className="mt-0.5 flex flex-wrap items-baseline gap-1.5">
        <span
          className={`text-sm font-black tabular-nums tracking-tight ${
            isLightTheme ? "text-slate-900" : "text-white"
          }`}
        >
          {value}
        </span>
        <span
          className={`text-xs font-semibold ${
            isLightTheme ? "text-slate-500" : "text-slate-400"
          }`}
        >
          {suffix}
        </span>
      </div>
    </div>
  );
}
