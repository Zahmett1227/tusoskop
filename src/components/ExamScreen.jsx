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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">Deneme oluşturulamadı</p>
          <button
            onClick={goDashboard}
            className="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-bold"
          >
            Panele dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <button
        onClick={goDashboard}
        className="mb-6 text-sm md:text-base text-emerald-400"
      >
        ← Panele dön
      </button>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 md:p-6">
          <p className="text-sm text-slate-400 mb-2">
            Deneme • {examIndex + 1} / {examQuestions.length}
          </p>
          <p className="text-sm text-slate-400 mb-2">200 soru</p>
          <p className="text-sm md:text-base text-cyan-400">
            {examQ.ders} • {examQ.konu}
          </p>

          <h2 className="mt-4 text-lg md:text-2xl font-bold leading-relaxed">
            {examQ.q}
          </h2>
        </div>

        <div className="space-y-3">
          {examQ.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleExamSelect(i)}
              className={`w-full text-left rounded-2xl border-2 p-4 md:p-5 flex items-center gap-4 ${
                examSelected === i
                  ? "border-fuchsia-500 bg-fuchsia-500/10"
                  : "border-slate-800 bg-slate-900/50"
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <span>{opt}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExamBlank}
            className="px-5 py-3 rounded-2xl border border-slate-700 bg-slate-900 font-bold"
          >
            Boş bırak
          </button>

          <button
            onClick={handleExamNext}
            className="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-bold"
          >
            {examIndex < examQuestions.length - 1 ? "Sonraki soru" : "Analizi gör"} →
          </button>
        </div>
      </div>
    </div>
  );
}