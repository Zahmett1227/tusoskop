import React from "react";

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

export default function QuizResultScreen({
  score,
  total,
  durationMs,
  subject,
  deviceType,
  appStoreUrl,
  onAppStoreClick,
  onWebContinue,
}) {
  const ratio = total > 0 ? score / total : 0;
  const percent = Math.round(ratio * 100);

  return (
    <div className="w-full text-center">
      <p className="text-sm font-black uppercase tracking-wide text-emerald-400">
        Mini deneme tamamlandı
      </p>

      <div className="mx-auto mt-4 flex h-32 w-32 flex-col items-center justify-center rounded-full border-4 border-emerald-500/40 bg-emerald-500/5">
        <span className="text-4xl font-black text-emerald-300">
          {score}/{total}
        </span>
        <span className="mt-0.5 text-sm font-bold text-slate-400">%{percent}</span>
      </div>

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

      <div className="mt-6 flex flex-col gap-2.5">
        {deviceType === "ios" && (
          <>
            <AppStoreCta href={appStoreUrl} onClick={onAppStoreClick} primary />
            <WebCta onClick={onWebContinue} label="Web'de devam et" />
          </>
        )}

        {deviceType === "android" && (
          <WebCta onClick={onWebContinue} primary label="Web'de Ücretsiz Devam Et" />
        )}

        {deviceType === "desktop" && (
          <>
            <WebCta onClick={onWebContinue} primary label="Web'de Devam Et" />
            <AppStoreCta href={appStoreUrl} onClick={onAppStoreClick} />
          </>
        )}
      </div>

      <p className="mt-4 text-xs font-medium text-slate-500">
        Tusoskop'ta ders ve konu bazlı soruları çöz, yanlışlarını takip et ve kişisel
        tekrar planını oluştur.
      </p>
    </div>
  );
}
