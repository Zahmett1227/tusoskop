import React, { useCallback, useEffect, useState } from "react";
import { getFreeCampaignEndLabels, padTime } from "../../utils/freeCampaign";
import { useFreeCampaignCountdown } from "./useFreeCampaignCountdown";

/**
 * Web ücretsiz erişim kampanyası görselleri (15 Eylül – 31 Ekim 2026).
 * Hepsi kampanya aktif değilse (bitti / native iOS / testler) hiçbir şey render etmez.
 * Geri sayım gerçek bitiş tarihine (src/config/freeAccessCampaign.js) göre işler.
 */

const PERKS = [
  ["♾️", "Sınırsız soru"],
  ["📝", "Sınırsız deneme"],
  ["🧠", "Akıllı tekrar"],
  ["📊", "Detaylı analiz"],
  ["🎯", "Ders/konu seçerek çöz"],
];

function CountdownBlocks({ countdown, tone = "dark", size = "lg" }) {
  const units = [
    ["GÜN", countdown.days],
    ["SAAT", countdown.hours],
    ["DAKİKA", countdown.minutes],
    ["SANİYE", countdown.seconds],
  ];
  const box =
    tone === "light"
      ? "border-slate-200 bg-white text-slate-950 shadow-sm"
      : "border-white/15 bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";
  const number = size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl";

  return (
    <div
      className="grid grid-cols-4 gap-2 sm:gap-3"
      role="timer"
      aria-label={`Fırsatın bitmesine ${countdown.days} gün ${countdown.hours} saat ${countdown.minutes} dakika kaldı`}
    >
      {units.map(([label, value]) => (
        <div key={label} className={`overflow-hidden rounded-2xl border px-1 py-2.5 text-center ${box}`}>
          <span key={value} className={`campaign-tick block font-black tabular-nums leading-none ${number}`}>
            {label === "GÜN" ? value : padTime(value)}
          </span>
          <span
            className={`mt-1.5 block text-[9px] font-black tracking-[0.16em] sm:text-[10px] ${
              tone === "light" ? "text-slate-500" : "text-white/60"
            }`}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** İnce, animasyonlu üst şerit — sayfanın en üstüne konur. */
export function FreeCampaignRibbon({ ctaHref, ctaLabel = "Hemen başla" }) {
  const countdown = useFreeCampaignCountdown();
  if (!countdown.active) return null;

  return (
    <div
      role="region"
      aria-label="Sınırlı süre kampanyası"
      className="campaign-gradient campaign-shine relative z-30 text-white"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2.5 gap-y-1 px-4 py-2 text-center text-[12px] font-extrabold leading-tight sm:text-sm">
        <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
          <span className="campaign-ping absolute inline-flex h-full w-full rounded-full bg-white" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        <span className="uppercase tracking-wider">🎁 Sınırlı süre</span>
        <span className="opacity-70" aria-hidden>·</span>
        <span>
          Tüm Plus özellikleri{" "}
          <span className="rounded-md bg-white/25 px-1.5 py-0.5 font-black">ÜCRETSİZ</span>
        </span>
        <span className="opacity-70" aria-hidden>·</span>
        <span className="tabular-nums">
          ⏳ {countdown.days}g {padTime(countdown.hours)}:{padTime(countdown.minutes)}:{padTime(countdown.seconds)}
        </span>
        {ctaHref ? (
          <a
            href={ctaHref}
            className="ml-1 hidden rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-950 no-underline transition hover:bg-white/90 sm:inline-flex"
          >
            {ctaLabel} →
          </a>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Büyük kampanya kartı: dönen gökkuşağı çerçeve, uçuşan emojiler, canlı geri sayım.
 * tone: "dark" | "light"; compact: dashboard/giriş gibi dar alanlar için.
 */
export function FreeCampaignHero({
  tone = "dark",
  compact = false,
  ctaLabel,
  ctaHref,
  onCta,
  className = "",
}) {
  const countdown = useFreeCampaignCountdown();
  if (!countdown.active) return null;

  const { long: endLong } = getFreeCampaignEndLabels();
  const light = tone === "light";
  const inner = light
    ? "bg-gradient-to-br from-[#fffaf3] via-white to-[#f5f3ff] text-slate-950"
    : "bg-slate-950 text-white";
  const muted = light ? "text-slate-600" : "text-slate-300";
  const chip = light
    ? "border-slate-200 bg-white/90 text-slate-800"
    : "border-white/10 bg-white/[0.05] text-slate-100";

  const cta = ctaLabel ? (
    ctaHref ? (
      <a
        href={ctaHref}
        onClick={onCta}
        className="campaign-gradient campaign-shine inline-flex min-h-12 items-center justify-center rounded-2xl px-6 text-base font-black text-white no-underline shadow-lg shadow-fuchsia-900/30 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300"
      >
        {ctaLabel}
      </a>
    ) : (
      <button
        type="button"
        onClick={onCta}
        className="campaign-gradient campaign-shine inline-flex min-h-12 items-center justify-center rounded-2xl px-6 text-base font-black text-white shadow-lg shadow-fuchsia-900/30 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300"
      >
        {ctaLabel}
      </button>
    )
  ) : null;

  return (
    <section
      aria-label="Sınırlı süre ücretsiz erişim kampanyası"
      className={`campaign-border rounded-[30px] p-[2px] shadow-[0_30px_80px_-40px_rgba(236,72,153,0.55)] ${className}`}
    >
      <div className={`relative overflow-hidden rounded-[28px] ${inner} ${compact ? "px-5 py-5 sm:px-7 sm:py-6" : "px-5 py-7 sm:px-9 sm:py-10"}`}>
        <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-amber-400/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-16 top-1/3 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
        <span aria-hidden className="campaign-float pointer-events-none absolute right-5 top-4 text-3xl sm:text-4xl">🎉</span>
        <span aria-hidden className="campaign-float pointer-events-none absolute right-24 top-12 hidden text-2xl sm:block" style={{ animationDelay: "0.8s" }}>✨</span>
        <span aria-hidden className="campaign-float pointer-events-none absolute bottom-5 right-8 hidden text-2xl md:block" style={{ animationDelay: "1.6s" }}>🎁</span>
        {!compact ? (
          <span aria-hidden className="campaign-float pointer-events-none absolute left-[46%] top-5 hidden text-xl lg:block" style={{ animationDelay: "2.2s" }}>⭐</span>
        ) : null}

        <div className={`relative grid gap-6 ${compact ? "lg:grid-cols-[1.25fr_1fr]" : "lg:grid-cols-[1.2fr_1fr] lg:gap-10"} lg:items-center`}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="campaign-gradient inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md">
                🔥 Sınırlı süre fırsatı
              </span>
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                  light ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                Kart yok · Ödeme yok
              </span>
            </div>

            <h2 className={`mt-4 pr-10 font-black leading-[1.05] tracking-tight ${compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-5xl"}`}>
              Tusoskop Plus şimdi{" "}
              <span className={`campaign-text-gradient ${light ? "campaign-text-gradient--light" : ""}`}>
                tamamen ÜCRETSİZ!
              </span>
            </h2>

            <p className={`mt-3 max-w-xl font-medium leading-relaxed ${muted} ${compact ? "text-sm sm:text-base" : "text-base sm:text-lg"}`}>
              <strong className={light ? "text-slate-950" : "text-white"}>{endLong} 23:59</strong>&apos;a kadar
              web&apos;de tüm Plus özellikleri senin. Sınırsız çöz, sınırsız tekrar et — süre dolunca
              ücretsiz plan limitleri geri gelir, bu fırsatı kaçırma.
            </p>

            {!compact ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {PERKS.map(([icon, label]) => (
                  <li key={label} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold sm:text-sm ${chip}`}>
                    <span aria-hidden>{icon}</span>
                    {label}
                  </li>
                ))}
              </ul>
            ) : null}

            {cta ? <div className="mt-6 flex flex-col gap-3 sm:flex-row">{cta}</div> : null}
          </div>

          <div className="min-w-0">
            <p className={`mb-2.5 text-[11px] font-black uppercase tracking-[0.22em] ${light ? "text-fuchsia-700" : "text-fuchsia-300"}`}>
              ⏳ Fırsatın bitmesine
            </p>
            <CountdownBlocks countdown={countdown} tone={tone} size={compact ? "md" : "lg"} />
          </div>
        </div>
      </div>
    </section>
  );
}

const CONFETTI_COLORS = ["#fbbf24", "#f472b6", "#a78bfa", "#34d399", "#22d3ee", "#fb7185"];

// Deterministik konfeti: render sırasında Math.random kullanmadan çeşitlilik.
const CONFETTI_PIECES = Array.from({ length: 70 }, (_, i) => ({
  left: (i * 37) % 100,
  width: 6 + (i % 4) * 2,
  height: 10 + (i % 3) * 4,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: ((i * 53) % 1400) / 1000,
  duration: 2.6 + ((i * 29) % 18) / 10,
  drift: ((i * 71) % 160) - 80,
  spin: 360 + ((i * 97) % 540),
}));

export function CampaignConfetti() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[130] overflow-hidden">
      {CONFETTI_PIECES.map((piece, i) => (
        <span
          key={i}
          className="campaign-confetti-piece"
          style={{
            left: `${piece.left}%`,
            width: piece.width,
            height: piece.height,
            background: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            "--campaign-drift": `${piece.drift}px`,
            "--campaign-spin": `${piece.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}

const CELEBRATION_KEY = "tusoskop_free_campaign_2026_celebrated";

/** Kampanya süresince her tarayıcıda bir kez: konfeti + "tüm Plus özellikleri açıldı" modalı. */
export function FreeCampaignCelebration({ onStart }) {
  const countdown = useFreeCampaignCountdown();
  const [open, setOpen] = useState(() => {
    try {
      return window.localStorage.getItem(CELEBRATION_KEY) !== "1";
    } catch {
      return false;
    }
  });

  const close = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(CELEBRATION_KEY, "1");
    } catch {
      /* localStorage kapalı olabilir */
    }
  }, []);

  useEffect(() => {
    if (!open || !countdown.active) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, countdown.active, close]);

  if (!open || !countdown.active) return null;

  const { long: endLong } = getFreeCampaignEndLabels();

  return (
    <>
      <CampaignConfetti />
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm"
        onClick={close}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="free-campaign-celebration-title"
          className="campaign-pop campaign-border w-full max-w-md rounded-[30px] p-[2px]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative overflow-hidden rounded-[28px] bg-slate-950 px-6 py-7 text-center text-white">
            <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-fuchsia-500/30 blur-3xl" />
            <p aria-hidden className="campaign-float relative text-5xl">🎉</p>
            <p className="relative mt-3 text-[11px] font-black uppercase tracking-[0.24em] text-amber-300">
              Sürpriz · Sınırlı süre
            </p>
            <h2 id="free-campaign-celebration-title" className="relative mt-2 text-3xl font-black leading-tight tracking-tight">
              Tüm Plus özellikleri{" "}
              <span className="campaign-text-gradient">senin!</span>
            </h2>
            <p className="relative mt-3 text-sm font-medium leading-relaxed text-slate-300">
              <strong className="text-white">{endLong} 23:59</strong>&apos;a kadar web&apos;de sınırsız soru,
              sınırsız deneme, akıllı tekrar ve detaylı analiz tamamen ücretsiz. Kart yok, ödeme yok.
            </p>
            <div className="relative mt-5">
              <CountdownBlocks countdown={countdown} size="md" />
            </div>
            <button
              type="button"
              onClick={() => {
                close();
                onStart?.();
              }}
              className="campaign-gradient campaign-shine relative mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-6 text-base font-black text-white shadow-lg transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300"
            >
              Hemen çözmeye başla 🚀
            </button>
            <button
              type="button"
              onClick={close}
              className="relative mt-3 text-xs font-semibold text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
