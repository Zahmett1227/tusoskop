export default function ExamScreen({
  examQ,
  examIndex,
  examQuestions,
  examSelected,
  handleExamSelect,
  handleExamBlank,
  handleExamNext,
  goDashboard,
}) {
  if (!examQ) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl font-bold mb-4">Deneme oluşturulamadı</p>
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
            Deneme • {examIndex + 1} / {examQuestions.length}
          </p>

          <p className="text-[11px] md:text-sm text-slate-500 mb-1">
            200 soru
          </p>

          <p className="text-xs md:text-sm text-cyan-400 break-words whitespace-normal">
            {examQ.ders} • {examQ.konu}
          </p>

          <h2 className="mt-3 text-[15px] md:text-2xl font-bold leading-6 md:leading-relaxed break-words whitespace-normal [overflow-wrap:anywhere]">
            {examQ.q}
          </h2>
        </div>

        <div className="space-y-2.5">
          {examQ.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleExamSelect(i)}
              className={`w-full min-w-0 text-left rounded-2xl border-2 p-3 md:p-5 flex items-start gap-3 transition-all ${
                examSelected === i
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

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleExamBlank}
            className="px-4 py-3 rounded-2xl border border-slate-700 bg-slate-900 text-sm md:text-base font-bold"
          >
            Boş bırak
          </button>

          <button
            onClick={handleExamNext}
            className="px-4 py-3 rounded-2xl bg-emerald-500 text-white text-sm md:text-base font-bold"
          >
            {examIndex < examQuestions.length - 1 ? "Sonraki" : "Analiz"}
          </button>
        </div>
      </div>
    </div>
  );
}