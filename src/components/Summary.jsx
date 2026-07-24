import React from "react";

export default function Summary({
  currentSubject,
  score,
  total,
  onRetry,
  goDashboard,
  questionTimes = {},
  studyMode = "study",
  result = null,
  ders,
  konu,
  onNewTopic,
}) {
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

  const isTopic = studyMode === "topic";
  const correct = result?.correct ?? score;
  const wrong = result?.wrong ?? Math.max(0, total - score);
  const blank = result?.blank ?? 0;
  const net = result?.net ?? Math.max(0, Math.round((correct - wrong / 4) * 100) / 100);
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const title = isTopic && ders ? `${ders} · ${konu}` : currentSubject;

  const stats = [
    { label: "Doğru", value: correct, color: "text-emerald-400" },
    { label: "Yanlış", value: wrong, color: "text-rose-400" },
    { label: "Boş", value: blank, color: "text-slate-300" },
    { label: "Net", value: net, color: "text-cyan-400" },
  ];

  return (
    <div
      className="min-h-dvh bg-[#05070d] text-white p-6 md:p-10"
      style={{
        paddingTop: "max(1.5rem, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="max-w-3xl mx-auto bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl rounded-[2rem] p-8 md:p-10">
        <h2 className="text-3xl font-black mb-2 text-emerald-400">
          {isTopic ? "Konu Testi Tamamlandı" : "Test Tamamlandı"}
        </h2>
        {title ? <p className="text-lg text-slate-200 mb-1 break-words">{title}</p> : null}
        <p className="text-slate-400 mb-6">
          Doğruluk <span className="text-white font-bold">%{accuracy}</span> · {correct}/{total} doğru
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/[0.07] bg-black/20 px-3 py-4 text-center">
              <p className={`text-3xl font-black tabular-nums ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

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

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onRetry}
            className="px-5 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black hover:opacity-90"
          >
            {isTopic ? "Yeniden çöz" : "Tekrar çöz"}
          </button>
          {isTopic && typeof onNewTopic === "function" ? (
            <button
              onClick={onNewTopic}
              className="px-5 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white font-bold hover:bg-white/[0.1]"
            >
              Yeni konu seç
            </button>
          ) : null}
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
