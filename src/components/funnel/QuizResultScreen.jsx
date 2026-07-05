import React, { useState } from "react";
import { renderMiniTusShareCard, shareOrDownloadCard } from "../../utils/miniTusShareCard";

/**
 * Mikro deneme sonuç ekranı — asıl dönüşüm noktası.
 * Skoru gösterir, ardından cihaza uygun CTA sunar. Otomatik yönlendirme YOK;
 * kullanıcı CTA'ya kendisi basar.
 */

function performanceLabel(ratio) {
  if (ratio >= 1) return "Mükemmel";
  if (ratio >= 0.66) return "İyi";
  if (ratio >= 0.34) return "Gelişmeye Açık";
  return "Yeni Başlangıç";
}

function performanceMessage(ratio, subject) {
  if (ratio >= 0.66) {
    return `${subject} temellerin sağlam. Tusoskop'ta konu bazlı çözerek zirveyi hedefle.`;
  }
  if (ratio >= 0.34) {
    return `${subject} için iyi bir başlangıç. Yanlışlarını takip edip tekrar planı kurarsan hızla ilerlersin.`;
  }
  return `Her uzman bir yerden başladı. Tusoskop kişisel tekrar planıyla ${subject} eksiklerini kapatmanı sağlar.`;
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round((ms || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes} dk ${seconds} sn`;
  return `${seconds} sn`;
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

function WebCta({ onClick, primary, label, subtitle }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        primary
          ? "flex w-full flex-col items-center justify-center rounded-2xl bg-emerald-500 px-5 py-4 text-center font-black text-slate-950 transition-colors hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          : "flex w-full items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/60 px-5 py-3.5 text-base font-bold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
      }
    >
      <span className="text-base">{label}</span>
      {primary && subtitle && (
        <span className="mt-0.5 text-xs font-semibold text-slate-800/80">{subtitle}</span>
      )}
    </button>
  );
}

export default function QuizResultScreen({
  score,
  total,
  durationMs,
  subject,
  deviceType,
  appStoreUrl,
  onAppStoreClick,
  onWebContinue,
  miniTusEstimate,
}) {
  const ratio = total > 0 ? score / total : 0;
  const percent = Math.round(ratio * 100);
  const [shareBusy, setShareBusy] = useState(false);

  const handleShare = async () => {
    if (shareBusy || !miniTusEstimate) return;
    setShareBusy(true);
    try {
      const blob = await renderMiniTusShareCard({
        score,
        total,
        tahminiPuan: miniTusEstimate.tahminiPuan,
        topPercent: miniTusEstimate.topPercent,
      });
      await shareOrDownloadCard(blob);
    } catch {
      /* paylaşım/indirme başarısız olursa sessizce geç — akış bozulmasın */
    } finally {
      setShareBusy(false);
    }
  };

  return (
    <div className="w-full text-center">
      <p className="text-sm font-black uppercase tracking-wide text-emerald-400">
        {miniTusEstimate ? "Mini TUS tamamlandı" : "Mini deneme tamamlandı"}
      </p>

      <div className="mx-auto mt-4 flex h-32 w-32 flex-col items-center justify-center rounded-full border-4 border-emerald-500/40 bg-emerald-500/5">
        <span className="text-4xl font-black text-emerald-300">
          {score}/{total}
        </span>
        <span className="mt-0.5 text-sm font-bold text-slate-400">%{percent}</span>
      </div>

      {miniTusEstimate ? (
        <>
          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Tahmini kalibrasyon puanın
            </p>
            <p className="mt-1 text-4xl font-black text-emerald-300">
              {String(miniTusEstimate.tahminiPuan).replace(".", ",")}
            </p>
            <p className="mt-2 text-sm font-bold text-slate-200">
              Türkiye'de tahmini{" "}
              <span className="text-emerald-300">ilk %{miniTusEstimate.topPercent}</span>
            </p>
          </div>

          <p className="mt-3 text-xs font-medium text-slate-500">
            İstatistiksel tahmindir; resmi ÖSYM puanı değildir. Süre: {formatDuration(durationMs)}
          </p>

          <button
            type="button"
            onClick={handleShare}
            disabled={shareBusy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3.5 text-base font-bold text-emerald-300 transition-colors hover:bg-emerald-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 disabled:opacity-60"
          >
            {shareBusy ? "Kart hazırlanıyor…" : "Sonucunu Paylaş"}
          </button>
        </>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-slate-700/70 bg-slate-800/40 px-3 py-3">
              <p className="text-xs font-semibold text-slate-400">Süre</p>
              <p className="mt-0.5 text-base font-black text-slate-100">
                {formatDuration(durationMs)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700/70 bg-slate-800/40 px-3 py-3">
              <p className="text-xs font-semibold text-slate-400">{subject} performansın</p>
              <p className="mt-0.5 text-base font-black text-emerald-300">
                {performanceLabel(ratio)}
              </p>
            </div>
          </div>

          <p className="mt-5 text-[15px] leading-relaxed text-slate-300">
            {performanceMessage(ratio, subject)}
          </p>
        </>
      )}

      {/* Web kayıt her cihazda BİRİNCİL CTA'dır: ölçülebilir tek gelir yolu web
         (PayTR) ve reklam optimizasyonu buradan beslenir. App Store, iOS'ta
         gerçek bir ikincil seçenek olarak kalır (ATT nedeniyle attribution'da kör). */}
      <div className="mt-6 flex flex-col gap-2.5">
        <WebCta
          onClick={onWebContinue}
          primary
          label="Skorunu Kaydet, Devam Et"
          subtitle="Zayıf konularını gör — ücretsiz"
        />
        {deviceType === "ios" && (
          <AppStoreCta href={appStoreUrl} onClick={onAppStoreClick} />
        )}
        {deviceType === "desktop" && (
          <AppStoreCta href={appStoreUrl} onClick={onAppStoreClick} />
        )}
      </div>

      <p className="mt-4 text-xs font-medium text-slate-500">
        Ücretsiz hesabınla skorun kaydedilir; yanlışların kişisel tekrar planına
        eklenir ve ders/konu bazlı çözmeye kaldığın yerden devam edersin.
      </p>
    </div>
  );
}
