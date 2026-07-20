import React, { useState } from "react";
import { EYLUL_PAKETI, DERSHANE_ANCHOR } from "../../constants/eylulPaketi";
import { isInAppBrowser } from "../../utils/device";

/**
 * Sonuç ekranı satın alma anı kartı (plan §08 / K6). Kullanıcının niyetinin en
 * yüksek olduğu an — quiz/Mini TUS bitti, zayıf konusunu gördü — Eylül Paketi
 * fiyat çıpasını burada sunar. BİRİNCİL CTA değildir (o hâlâ ücretsiz kayıt);
 * ikincil, alttadır — soğuk edinim akışını bastırmadan çıpayı ekmek için.
 *
 * CTA /app?intent=plus'a gider: anonim → giriş → uygulama doğrudan Plus satın
 * alma ekranını açar (AppAuthenticated intent=plus deep-link).
 *
 * IN-APP TARAYICI: Instagram/Facebook uygulama-içi tarayıcısında Google girişi
 * (signInWithPopup/Redirect) Google politikası gereği engelli. Kartı hard-nav ile
 * /app?intent=plus'a gönderince anonim kullanıcı giriş duvarına toslar ve satış
 * kaybolur (canlıda gözlemlendi: EylulPaketiClick > 0 ama InitiateCheckout = 0).
 * Bu yüzden in-app tarayıcıda navigasyon YAPMAYIZ; QuizContinueModal'daki desenle
 * "Tarayıcıda Aç / Linki Kopyala" ipucu gösteririz (link gerçek Safari/Chrome'da
 * açılınca giriş çalışır, intent=plus doğrudan satın alma ekranını açar).
 */
export default function EylulPaketiCard({ onClick }) {
  const inApp = isInAppBrowser();
  const [showHint, setShowHint] = useState(false);
  const [copied, setCopied] = useState(false);

  const plusUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/app?intent=plus`
      : "/app?intent=plus";

  // In-app tarayıcıda: navigasyon etme (duvar), analitiği yine at, ipucunu aç.
  const handleInAppClick = (event) => {
    if (event) event.preventDefault();
    if (typeof onClick === "function") onClick(event, { noNav: true });
    setShowHint(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plusUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard yoksa/başarısızsa sessiz — kullanıcı "Tarayıcıda Aç"ı kullanır */
    }
  };

  const ctaClass =
    "mt-3 flex w-full items-center justify-center rounded-xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70";

  return (
    <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.12] to-slate-900/30 p-4 text-left">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
        🍂 {EYLUL_PAKETI.name}
      </p>
      <p className="mt-1.5 text-[15px] font-bold leading-snug text-slate-100">
        Zayıf konularını sınava kadar sınırsız çöz
      </p>

      {/* Kıyas — yanıltıcı "indirim" (üstü çizili eski fiyat) değil, iki ayrı
          ürünün etiketli karşılaştırması (plan K6 dürüstlük guardrail'i). */}
      <div className="mt-3 flex items-stretch gap-2">
        <div className="flex-1 rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Dershane</p>
          <p className="mt-0.5 text-base font-black text-slate-400">{DERSHANE_ANCHOR.priceLabel}</p>
        </div>
        <div className="flex-1 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-300">{EYLUL_PAKETI.name}</p>
          <p className="mt-0.5 text-base font-black text-emerald-300">
            {EYLUL_PAKETI.priceLabel}
            <span className="ml-1 text-[11px] font-bold text-slate-400">{EYLUL_PAKETI.perDayLabel}</span>
          </p>
        </div>
      </div>

      <p className="mt-2 text-xs font-semibold text-slate-400">
        {EYLUL_PAKETI.proofLine}
      </p>

      {inApp ? (
        <button type="button" onClick={handleInAppClick} className={ctaClass}>
          {EYLUL_PAKETI.name}&apos;ni İncele →
        </button>
      ) : (
        <a href="/app?intent=plus" onClick={onClick} className={ctaClass}>
          {EYLUL_PAKETI.name}&apos;ni İncele →
        </a>
      )}

      {/* In-app tarayıcı ipucu — QuizContinueModal deseniyle aynı. */}
      {inApp && showHint && (
        <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
          <p className="text-xs font-bold text-amber-300">Satın alma için tarayıcıda aç</p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-100/90">
            Instagram/Facebook uygulama-içi tarayıcısındasın; giriş burada çalışmayabilir.
            Sağ üstteki <span className="font-semibold">&quot;•••&quot;</span> menüsünden{" "}
            <span className="font-semibold">&quot;Tarayıcıda Aç&quot;</span>ı seç ya da linki
            kopyalayıp Safari/Chrome&apos;da aç.
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-2 rounded-lg border border-amber-400/40 px-3 py-1.5 text-[11px] font-bold text-amber-200 transition hover:bg-amber-500/10"
          >
            {copied ? "Kopyalandı ✓" : "Linki Kopyala"}
          </button>
        </div>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        TUS dershaneleri {DERSHANE_ANCHOR.priceLabel}. Tusoskop soru çözme + akıllı
        tekrar platformudur; sınava kadar (90 gün) sınırsız.
      </p>
    </div>
  );
}
