import React from "react";
import { EYLUL_PAKETI, DERSHANE_ANCHOR } from "../../constants/eylulPaketi";

/**
 * Sonuç ekranı satın alma anı kartı (plan §08 / K6). Kullanıcının niyetinin en
 * yüksek olduğu an — quiz/Mini TUS bitti, zayıf konusunu gördü — Eylül Paketi
 * fiyat çıpasını burada sunar. BİRİNCİL CTA değildir (o hâlâ ücretsiz kayıt);
 * ikincil, alttadır — soğuk edinim akışını bastırmadan çıpayı ekmek için.
 *
 * CTA /app?intent=plus'a gider: anonim → giriş → uygulama doğrudan Plus satın
 * alma ekranını açar (AppAuthenticated intent=plus deep-link).
 */
export default function EylulPaketiCard({ onClick }) {
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

      <a
        href="/app?intent=plus"
        onClick={onClick}
        className="mt-3 flex w-full items-center justify-center rounded-xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
      >
        {EYLUL_PAKETI.name}&apos;ni İncele →
      </a>

      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        TUS dershaneleri {DERSHANE_ANCHOR.priceLabel}. Tusoskop soru çözme + akıllı
        tekrar platformudur; sınava kadar (90 gün) sınırsız.
      </p>
    </div>
  );
}
