import React from "react";

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

  // Başarı yüzdesine göre bar rengi belirleme
  const getProgressColor = (rate) => {
    if (rate >= 65) return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
    if (rate >= 45) return "bg-cyan-400";
    return "bg-rose-500";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Üst Başlık Alanı */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/60 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">📊</span>
              <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Deneme Analizi
              </h1>
            </div>
            <p className="text-slate-400 text-sm md:text-base">
              Sonuçların hazır. Hangi derste ne kadar ilerlediğini buradan takip edebilirsin.
            </p>
          </div>

          <button
            onClick={goDashboard}
            className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-all text-sm font-bold shadow-lg"
          >
            ← Panele Dön
          </button>
        </div>

        {/* Özet İstatistik Kartları */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 border border-slate-800 p-5 flex flex-col justify-center items-center text-center group hover:border-slate-600 transition-colors">
            <span className="text-slate-500 mb-1 text-xl">📝</span>
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Toplam</p>
            <p className="text-3xl font-black mt-1 text-slate-200">{examAnalysis.summary.total}</p>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 border border-emerald-900/50 p-5 flex flex-col justify-center items-center text-center group hover:border-emerald-700/50 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
            <span className="text-emerald-500 mb-1 text-xl">✅</span>
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Doğru</p>
            <p className="text-3xl font-black mt-1 text-emerald-400">{examAnalysis.summary.correct}</p>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 border border-rose-900/50 p-5 flex flex-col justify-center items-center text-center group hover:border-rose-700/50 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all"></div>
            <span className="text-rose-500 mb-1 text-xl">❌</span>
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Yanlış</p>
            <p className="text-3xl font-black mt-1 text-rose-400">{examAnalysis.summary.wrong}</p>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 border border-slate-800 p-5 flex flex-col justify-center items-center text-center group hover:border-slate-600 transition-colors">
            <span className="text-slate-500 mb-1 text-xl">⚪</span>
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Boş</p>
            <p className="text-3xl font-black mt-1 text-slate-300">{examAnalysis.summary.blank}</p>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-slate-800 to-slate-900 border border-cyan-900/50 p-5 flex flex-col justify-center items-center text-center shadow-[0_0_20px_rgba(34,211,238,0.05)]">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>
            <span className="text-cyan-400 mb-1 text-xl">🎯</span>
            <p className="text-cyan-200/70 text-xs uppercase tracking-wider font-semibold">Net Skor</p>
            <p className="text-4xl font-black mt-1 text-cyan-400">{examAnalysis.summary.net}</p>
          </div>
        </div>

        {/* İkili Grid: Tablo ve Tahmini Puan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Ders Bazlı Performans Tablosu */}
          <div className="lg:col-span-2 rounded-[2rem] bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="bg-slate-950/50 px-6 py-5 border-b border-slate-800">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="text-fuchsia-400">🔬</span> Ders Bazlı Performans
              </h2>
            </div>
            <div className="p-1 overflow-x-auto">
              <table className="w-full text-sm md:text-base border-collapse">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-800/50 bg-slate-900/30">
                    <th className="py-4 pl-5 font-medium">Ders</th>
                    <th className="py-4 px-2 font-medium text-center">Soru</th>
                    <th className="py-4 px-2 font-medium text-emerald-400/80 text-center">D</th>
                    <th className="py-4 px-2 font-medium text-rose-400/80 text-center">Y</th>
                    <th className="py-4 px-2 font-medium text-slate-500 text-center">B</th>
                    <th className="py-4 pr-5 font-medium text-right">Başarı Oranı</th>
                  </tr>
                </thead>
                <tbody>
                  {lessonRows.map(([lesson, stats]) => (
                    <tr key={lesson} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors group">
                      <td className="py-3 pl-5 font-semibold text-slate-200">{lesson}</td>
                      <td className="py-3 px-2 text-center text-slate-400">{stats.total}</td>
                      <td className="py-3 px-2 text-center text-emerald-400">{stats.correct}</td>
                      <td className="py-3 px-2 text-center text-rose-400">{stats.wrong}</td>
                      <td className="py-3 px-2 text-center text-slate-500">{stats.blank}</td>
                      <td className="py-3 pr-5">
                        <div className="flex items-center justify-end gap-3">
                          <span className="font-bold text-slate-200 min-w-[3rem] text-right">
                            %{stats.successRate}
                          </span>
                          <div className="h-2 w-20 md:w-28 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(stats.successRate)}`}
                              style={{ width: `${stats.successRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tahmini Puan Kutusu ve Aksiyonlar */}
          <div className="space-y-6">
            {estimatedTus && (
              <div className="relative rounded-[2rem] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700 p-8 overflow-hidden shadow-2xl group hover:border-emerald-500/30 transition-all duration-500">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                <div className="absolute right-4 top-4 text-6xl opacity-5">🏆</div>
                
                <h2 className="text-lg font-semibold text-slate-400 mb-1 uppercase tracking-widest">Tahmini Puan</h2>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-sm">
                    {estimatedTus.score}
                  </span>
                  <span className="text-xl text-slate-500 font-bold">Puan</span>
                </div>
                
                <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80">
                  <p className="text-lg font-bold text-slate-200 mb-1 flex items-center gap-2">
                    <span>💡</span> {estimatedTus.label}
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {estimatedTus.advice}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={startFullExam}
                className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-lg font-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <span>🔄</span> Yeni Deneme Çöz
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}