import React from "react";

export default function Summary({ currentSubject, score, total, onRetry, goDashboard, questionTimes = {} }) {
  const numericTimes = Object.entries(questionTimes)
    .filter(([key, value]) => !String(key).startsWith("q-") && Number.isFinite(value))
    .map(([, value]) => Number(value));

  const avgTime = numericTimes.length
    ? Math.round(numericTimes.reduce((sum, sec) => sum + sec, 0) / numericTimes.length)
    : 0;
  const fastest = numericTimes.length ? Math.min(...numericTimes) : 0;
  const slowest = numericTimes.length ? Math.max(...numericTimes) : 0;
  const tempoComment = avgTime === 0
    ? "Süre verisi henüz oluşmadı."
    : avgTime < 25
    ? "Hız iyi, ama doğrulukla birlikte değerlendirmek lazım."
    : avgTime <= 45
    ? "Dengeli tempo."
    : "Yavaş çözüyorsun; bu oturumda tempo veya karar süresi uzuyor olabilir.";

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl rounded-[2rem] p-8 md:p-10">
        <h2 className="text-3xl font-black mb-4 text-emerald-400">
          Test Tamamlandı
        </h2>
        <p className="text-xl text-slate-200 mb-3">{currentSubject}</p>
        <p className="text-slate-400 mb-8">
          Skor: <span className="text-white font-bold">{score} / {total}</span>
        </p>
        <div className="rounded-3xl border border-white/[0.07] bg-black/20 p-5 mb-8">
          <p className="text-sm text-slate-400 font-bold mb-1">⏱ Ortalama süre</p>
          <p className="text-2xl font-black text-white mb-3">{avgTime} sn / soru</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2">
              <p className="text-slate-500">En hızlı</p>
              <p className="font-bold text-emerald-300">{fastest} sn</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2">
              <p className="text-slate-500">En yavaş</p>
              <p className="font-bold text-amber-300">{slowest} sn</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">{tempoComment}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-bold hover:opacity-90"
          >
            Tekrar çöz
          </button>
          <button
            onClick={goDashboard}
            className="px-5 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white font-bold hover:bg-white/[0.1]"
          >
            Panele dön
          </button>
        </div>
      </div>
    </div>
  );
}