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
}) {
  if (!q) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Soru bulunamadı</p>
          <button
            onClick={goDashboard}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 text-white font-bold"
          >
            Panele dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-3 py-3 md:px-8 md:py-8 overflow-x-hidden">
      <button
        onClick={goDashboard}
        className="mb-3 text-xs md:text-sm text-emerald-400"
      >
        ← Panele dön
      </button>

      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-3.5 md:p-6">
          <p className="text-[11px] md:text-sm text-slate-400 mb-1">
            Soru {index + 1} / {total}
          </p>

          <p className="text-xs md:text-sm text-cyan-400 break-words whitespace-normal">
            {q.ders} • {q.konu}
          </p>

          <h2 className="mt-3 text-[15px] md:text-2xl font-bold leading-6 md:leading-relaxed break-words whitespace-normal [overflow-wrap:anywhere]">
            {q.q}
          </h2>
        </div>

        <div className="space-y-2.5">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`w-full min-w-0 text-left rounded-2xl border-2 p-3 md:p-5 flex items-start gap-3 transition-all ${
                selected === i
                  ? "border-fuchsia-500 bg-fuchsia-500/10"
                  : "border-slate-800 bg-slate-900/50"
              }`}
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold">
                {String.fromCharCode(65 + i)}
              </span>

              <span className="min-w-0 flex-1 break-words whitespace-normal [overflow-wrap:anywhere] text-sm md:text-base leading-5 md:leading-6">
                {opt}
              </span>
            </button>
          ))}
        </div>

        {!showAnswer ? (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={revealAnswer}
              className="px-4 py-3 rounded-2xl bg-emerald-500 text-white text-sm md:text-base font-bold"
            >
              Cevabı göster
            </button>

            <button
              onClick={goDashboard}
              className="px-4 py-3 rounded-2xl bg-slate-800 text-sm md:text-base font-bold"
            >
              Bitir
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 md:p-5">
              <p className="text-[11px] md:text-sm text-slate-400 mb-1">
                Doğru cevap
              </p>
              <p className="text-sm md:text-lg font-bold text-emerald-400 break-words">
                {String.fromCharCode(65 + q.correct)} - {q.options[q.correct]}
              </p>

              <div className="mt-3">
                <p className="text-[11px] md:text-sm text-slate-400 mb-1">
                  Açıklama
                </p>
                <p className="text-sm md:text-base text-slate-200 leading-6 break-words whitespace-normal [overflow-wrap:anywhere]">
                  {q.exp}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                className="px-4 py-3 rounded-2xl border border-slate-700 bg-slate-900 text-sm md:text-base font-bold disabled:opacity-50"
                onClick={prevQuestion}
                disabled={index === 0}
              >
                Önceki soru
              </button>

              <button
                onClick={nextQuestion}
                className="px-4 py-3 rounded-2xl bg-emerald-500 text-white text-sm md:text-base font-bold"
              >
                {index < total - 1 ? "Sonraki" : "Özete git"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
