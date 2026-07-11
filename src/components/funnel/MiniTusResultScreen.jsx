import React, { useState } from "react";
import { shareMiniTusCard } from "./miniTusShareCard";

/**
 * Mini TUS (20 soruluk kalibrasyon) sonuç ekranı.
 * Tahmini T/K puan aralığı + Türkiye yüzdeliği + zayıf alan ipucu gösterir,
 * ardından birincil web-kayıt CTA sunar. Tüm dil "TAHMİNİ / KALİBRASYON" —
 * 20 soruluk örneklem kesin puan vermez, plan bu dürüstlüğü şart koşuyor.
 */

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round((ms || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes} dk ${seconds} sn`;
  return `${seconds} sn`;
}

function zayifAlanIpucu(result) {
  const { temelDogru, klinikDogru } = result;
  if (temelDogru === klinikDogru) {
    return "Temel ve klinik dengeli gidiyor. Konu bazlı çalışarak netlerini yukarı taşı.";
  }
  return temelDogru < klinikDogru
    ? "Temel bilimlerde daha fazla açık var — Tusoskop'ta temel derslere ağırlık ver."
    : "Klinik bilimlerde daha fazla açık var — Tusoskop'ta klinik derslere ağırlık ver.";
}

function AppStoreCta({ href, onClick, primary }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={
        primary
          ? "flex w-full flex-col items-center justify-center rounded-2xl bg-emerald-500 px-5 py-4 text-center font-black text-slate-950 transition-colors hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          : "flex w-full items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/60 px-5 py-3.5 text-center font-bold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
      }
    >
      <span className="text-base">Uygulamada Devam Et</span>
      {primary && (
        <span className="mt-0.5 text-xs font-semibold text-slate-800/80">
          App Store'dan ücretsiz indir
        </span>
      )}
    </a>
  );
}

function WebCta({ onClick, primary, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        primary
          ? "flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-5 py-4 text-base font-black text-slate-950 transition-colors hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          : "flex w-full items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/60 px-5 py-3.5 text-base font-bold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
      }
    >
      {label}
    </button>
  );
}

function PuanSatiri({ etiket, aralik, band }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-800/40 px-4 py-3">
      <div>
        <p className="text-xs font-semibold text-slate-400">{etiket}</p>
        <p className="text-xs font-medium text-slate-500">{band?.label}</p>
      </div>
      <p className="text-lg font-black text-emerald-300">
        ≈ {aralik[0]}–{aralik[1]}
      </p>
    </div>
  );
}

export default function MiniTusResultScreen({
  result,
  total,
  durationMs,
  deviceType,
  appStoreUrl,
  onAppStoreClick,
  onWebContinue,
  onShared,
}) {
  const [shareBusy, setShareBusy] = useState(false);
  const [shareDone, setShareDone] = useState(false);
  if (!result) return null;
  const { dogru, ilkYuzdelik, enIyiPuanTuru, tPuanAralik, kPuanAralik, tBand, kBand } = result;

  const handleShare = async () => {
    if (shareBusy) return;
    setShareBusy(true);
    try {
      const outcome = await shareMiniTusCard(result);
      if (outcome !== "failed") {
        setShareDone(true);
        if (typeof onShared === "function") onShared(outcome);
      }
    } finally {
      // Ne olursa olsun butonu tekrar aktif et (kalıcı "hazırlanıyor" kalmasın).
      setShareBusy(false);
    }
  };

  return (
    <div className="w-full text-center">
      <p className="text-sm font-black uppercase tracking-wide text-emerald-400">
        Mini TUS tamamlandı
      </p>

      <div className="mx-auto mt-4 flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-emerald-500/40 bg-emerald-500/5">
        <span className="text-3xl font-black text-emerald-300">{dogru}/{total}</span>
        <span className="mt-0.5 text-xs font-bold text-slate-400">doğru</span>
      </div>

      {/* Yüzdelik — asıl kanca */}
      <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4">
        <p className="text-sm font-semibold text-slate-300">Bu kalibrasyona göre</p>
        <p className="mt-1 text-2xl font-black text-emerald-300">
          Türkiye'de tahmini ilk %{ilkYuzdelik}
        </p>
        <p className="mt-1 text-xs font-medium text-slate-400">
          {enIyiPuanTuru} puanı türünde (tahmini)
        </p>
      </div>

      {/* Tahmini puan aralıkları */}
      <div className="mt-4 space-y-2 text-left">
        <p className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">
          Tahmini TUS puan aralığın
        </p>
        <PuanSatiri etiket="T Puanı (Temel ağırlıklı)" aralik={tPuanAralik} band={tBand} />
        <PuanSatiri etiket="K Puanı (Klinik ağırlıklı)" aralik={kPuanAralik} band={kBand} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 text-left">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-800/40 px-3 py-3">
          <p className="text-xs font-semibold text-slate-400">Süre</p>
          <p className="mt-0.5 text-base font-black text-slate-100">{formatDuration(durationMs)}</p>
        </div>
        <div className="rounded-2xl border border-slate-700/70 bg-slate-800/40 px-3 py-3">
          <p className="text-xs font-semibold text-slate-400">Odaklan</p>
          <p className="mt-0.5 text-xs font-bold text-emerald-300">
            {result.temelDogru < result.klinikDogru ? "Temel bilimler" : result.temelDogru > result.klinikDogru ? "Klinik bilimler" : "Dengeli"}
          </p>
        </div>
      </div>

      <p className="mt-4 text-[15px] leading-relaxed text-slate-300">{zayifAlanIpucu(result)}</p>

      <div className="mt-6 flex flex-col gap-2.5">
        {deviceType === "ios" && (
          <>
            <WebCta onClick={onWebContinue} primary label="Skorunu kaydet, zayıf konularını gör" />
            <AppStoreCta href={appStoreUrl} onClick={onAppStoreClick} />
          </>
        )}
        {deviceType === "android" && (
          <WebCta onClick={onWebContinue} primary label="Skorunu kaydet, zayıf konularını gör" />
        )}
        {deviceType === "desktop" && (
          <>
            <WebCta onClick={onWebContinue} primary label="Skorunu kaydet, zayıf konularını gör" />
            <AppStoreCta href={appStoreUrl} onClick={onAppStoreClick} />
          </>
        )}

        <button
          type="button"
          onClick={handleShare}
          disabled={shareBusy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3.5 text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {shareBusy ? "Kart hazırlanıyor…" : shareDone ? "Kart hazır ✓ Tekrar paylaş" : "Sonuç kartını paylaş"}
        </button>
      </div>

      <p className="mt-4 text-xs font-medium text-slate-500">
        Bu sonuç 20 soruluk bir <span className="font-bold">kalibrasyondur</span>, kesin puan
        değildir. Gerçek TUS 200 sorudur; buradaki puan yalnızca tahminidir.
      </p>
    </div>
  );
}
