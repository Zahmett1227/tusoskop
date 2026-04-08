export default function ExamAnalysisScreen({
  examAnalysis,
  estimatedTus,
  startFullExam,
  goDashboard,
}) {
  if (!examAnalysis) {
    return null;
  }

  const lessonRows = Object.entries(examAnalysis.byLesson || {});

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black">Deneme Analizi</h1>
            <p className="text-slate-400 mt-2">
              Hangi derste zorlandığını burada göreceksin.
            </p>
          </div>

          <button
            onClick={goDashboard}
            className="px-5 py-3 rounded-2xl bg-slate-800 font-bold"
          >
            Panele dön
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
            <p className="text-slate-400 text-sm">Toplam</p>
            <p className="text-2xl font-black mt-2">{examAnalysis.summary.total}</p>
          </div>
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
            <p className="text-slate-400 text-sm">Doğru</p>
            <p className="text-2xl font-black mt-2">{examAnalysis.summary.correct}</p>
          </div>
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
            <p className="text-slate-400 text-sm">Yanlış</p>
            <p className="text-2xl font-black mt-2">{examAnalysis.summary.wrong}</p>
          </div>
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
            <p className="text-slate-400 text-sm">Boş</p>
            <p className="text-2xl font-black mt-2">{examAnalysis.summary.blank}</p>
          </div>
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
            <p className="text-slate-400 text-sm">Net</p>
            <p className="text-2xl font-black mt-2">{examAnalysis.summary.net}</p>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 overflow-x-auto">
          <h2 className="text-2xl font-black mb-4">Ders bazlı performans</h2>

          <table className="w-full text-sm md:text-base">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="py-3 pr-4">Ders</th>
                <th className="py-3 pr-4">Toplam</th>
                <th className="py-3 pr-4">Doğru</th>
                <th className="py-3 pr-4">Yanlış</th>
                <th className="py-3 pr-4">Boş</th>
                <th className="py-3 pr-4">Başarı</th>
              </tr>
            </thead>
            <tbody>
              {lessonRows.map(([lesson, stats]) => (
                <tr key={lesson} className="border-b border-slate-800/60">
                  <td className="py-3 pr-4">{lesson}</td>
                  <td className="py-3 pr-4">{stats.total}</td>
                  <td className="py-3 pr-4">{stats.correct}</td>
                  <td className="py-3 pr-4">{stats.wrong}</td>
                  <td className="py-3 pr-4">{stats.blank}</td>
                  <td className="py-3 pr-4">%{stats.successRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {estimatedTus && (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
            <h2 className="text-2xl font-black mb-4">Tahmini TUS bandı</h2>
            <p className="text-slate-400 mb-2">Tahmini puan</p>
            <p className="text-4xl font-black text-emerald-400">{estimatedTus.score}</p>
            <p className="mt-3 text-xl font-bold">{estimatedTus.label}</p>
            <p className="mt-2 text-slate-300">{estimatedTus.advice}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={startFullExam}
            className="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-bold"
          >
            Yeni deneme çöz
          </button>
          <button
            onClick={goDashboard}
            className="px-5 py-3 rounded-2xl bg-slate-800 font-bold"
          >
            Panele dön
          </button>
        </div>
      </div>
    </div>
  );
}