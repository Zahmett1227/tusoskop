import React, { useState } from "react";
import { accentThemes } from "../theme/accentThemes";
import { isUserPremium } from "../utils/premiumUtils";

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

function WrongQuestionsModal({ wrongByLessonTopic, totalWrong, onClose }) {
  const [openLesson, setOpenLesson] = useState(null);
  const [openTopic, setOpenTopic] = useState(null);
  const [expandedQ, setExpandedQ] = useState(null);

  const lessons = Object.keys(wrongByLessonTopic);

  const toggleLesson = (lesson) => {
    setOpenLesson(prev => prev === lesson ? null : lesson);
    setOpenTopic(null);
    setExpandedQ(null);
  };

  const toggleTopic = (topic) => {
    setOpenTopic(prev => prev === topic ? null : topic);
    setExpandedQ(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#05070d] overflow-hidden">

      {/* Başlık çubuğu */}
      <div className="flex items-center justify-between px-4 md:px-8 py-5 border-b border-white/[0.08] bg-[#05070d]/90 backdrop-blur-md shrink-0">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Yanlış Soru Analizi</h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            {totalWrong} yanlış soru • ders ve konuya göre gruplandırıldı
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-slate-400 font-bold transition-all"
        >
          ✕
        </button>
      </div>

      {/* İçerik */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-3">
        {lessons.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600 gap-3">
            <span className="text-5xl">🎉</span>
            <p className="font-bold">Hiç yanlış soru yok!</p>
          </div>
        )}

        {lessons.map((lesson) => {
          const topics = wrongByLessonTopic[lesson];
          const lessonWrongCount = Object.values(topics).reduce((s, qs) => s + qs.length, 0);
          const isLessonOpen = openLesson === lesson;

          return (
            <div key={lesson} className="rounded-[1.75rem] border border-white/[0.08] overflow-hidden">

              {/* Ders başlığı */}
              <button
                onClick={() => toggleLesson(lesson)}
                className="w-full flex items-center justify-between px-6 py-4 bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isLessonOpen ? 'bg-rose-400' : 'bg-slate-700'}`} />
                  <span className="font-black text-white text-sm md:text-base">{lesson}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/20 text-rose-400 text-xs font-black">
                    {lessonWrongCount} yanlış
                  </span>
                  <span className={`text-slate-500 transition-transform duration-300 ${isLessonOpen ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </button>

              {/* Konular */}
              {isLessonOpen && (
                <div className="divide-y divide-white/[0.06] bg-black/20">
                  {Object.keys(topics).map((topic) => {
                    const questions = topics[topic];
                    const isTopicOpen = openTopic === `${lesson}__${topic}`;
                    const topicKey = `${lesson}__${topic}`;

                    return (
                      <div key={topic}>

                        {/* Konu başlığı */}
                        <button
                          onClick={() => toggleTopic(topicKey)}
                          className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.04] transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span className="text-slate-300 text-sm font-semibold">{topic}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-amber-400 text-xs font-black">{questions.length} soru</span>
                            <span className={`text-slate-600 text-xs transition-transform duration-200 ${isTopicOpen ? 'rotate-180' : ''}`}>▼</span>
                          </div>
                        </button>

                        {/* Sorular */}
                        {isTopicOpen && (
                          <div className="px-4 pb-4 space-y-3">
                            {questions.map((wq, qi) => {
                              const qKey = `${topicKey}__${qi}`;
                              const isExpanded = expandedQ === qKey;

                              return (
                                <div
                                  key={qi}
                                  className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden"
                                >
                                  {/* Soru metni + genişlet butonu */}
                                  <button
                                    onClick={() => setExpandedQ(prev => prev === qKey ? null : qKey)}
                                    className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-white/[0.04] transition-colors"
                                  >
                                    <span className="mt-0.5 w-5 h-5 rounded-full bg-white/[0.06] text-slate-500 text-[10px] font-black flex items-center justify-center shrink-0">
                                      {qi + 1}
                                    </span>
                                    <p className="text-slate-300 text-sm leading-relaxed flex-1 text-left line-clamp-2">
                                      {wq.q}
                                    </p>
                                    <span className={`text-slate-600 text-xs shrink-0 mt-0.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                                  </button>

                                  {/* Cevap satırı (her zaman görünür) */}
                                  <div className="px-5 pb-4 flex flex-wrap gap-2">
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                                      <span className="opacity-60">Senin cevabın:</span>
                                      <span>{wq.userAnswer !== null && wq.userAnswer !== undefined ? LETTERS[wq.userAnswer] : '—'}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                                      <span className="opacity-60">Doğru cevap:</span>
                                      <span>{LETTERS[wq.correct]}</span>
                                    </span>
                                  </div>

                                  {/* Genişletilmiş detay */}
                                  {isExpanded && (
                                    <div className="border-t border-white/[0.08] px-5 py-4 space-y-3">
                                      {/* Tüm şıklar */}
                                      <div className="space-y-1.5">
                                        {wq.options.map((opt, oi) => {
                                          const isCorrect = oi === wq.correct;
                                          const isUserWrong = oi === wq.userAnswer && oi !== wq.correct;
                                          return (
                                            <div
                                              key={oi}
                                              className={`flex items-start gap-3 px-4 py-2.5 rounded-xl text-sm ${
                                                isCorrect
                                                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                                                  : isUserWrong
                                                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                                                  : 'text-slate-500'
                                              }`}
                                            >
                                              <span className={`font-black shrink-0 ${isCorrect ? 'text-emerald-400' : isUserWrong ? 'text-rose-400' : 'text-slate-600'}`}>
                                                {LETTERS[oi]}
                                              </span>
                                              <span className="leading-relaxed">{opt}</span>
                                              {isCorrect && <span className="ml-auto shrink-0 text-emerald-400">✓</span>}
                                              {isUserWrong && <span className="ml-auto shrink-0 text-rose-400">✗</span>}
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Açıklama */}
                                      {wq.exp && (
                                        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
                                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Açıklama</p>
                                          <p className="text-slate-300 text-sm leading-relaxed">{wq.exp}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ExamAnalysisScreen({
  examAnalysis,
  estimatedTus,
  startFullExam,
  goDashboard,
  accentTheme,
  user,
  userData,
}) {
  const theme = accentTheme || accentThemes.emerald;
  const premium = isUserPremium(userData, user);
  const [showWrongModal, setShowWrongModal] = useState(false);

  if (!examAnalysis) return null;

  const summary = examAnalysis.summary || {};
  const netScore = Number(summary.net);
  const lessonRows = Object.entries(examAnalysis.byLesson || {});

  const getProgressColor = (rate) => {
    if (rate >= 65) return `${theme.primary} ${theme.glow}`;
    if (rate >= 45) return "bg-cyan-400";
    return "bg-rose-500";
  };

  return (
    <>
      {showWrongModal && (
        <WrongQuestionsModal
          wrongByLessonTopic={examAnalysis.wrongByLessonTopic || {}}
          totalWrong={summary.wrong ?? 0}
          onClose={() => setShowWrongModal(false)}
        />
      )}

      <div className="min-h-screen bg-[#05070d] text-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-10">

          {/* Üst Başlık */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.08] pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📊</span>
                <h1 className={`text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${theme.gradient}`}>
                  Deneme Analizi
                </h1>
              </div>
              <p className="text-slate-400 text-sm md:text-base">
                Bu denemenin özeti. Ders bazlı sonuçları buradan görebilirsin.
              </p>
            </div>
            <button
              onClick={goDashboard}
              className="px-6 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.14] backdrop-blur-xl transition-all text-sm font-bold"
            >
              ← Panele Dön
            </button>
          </div>

          {/* Özet İstatistik Kartları */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="app-card flex flex-col justify-center items-center text-center hover:border-white/[0.14] transition-colors !py-6">
              <span className="text-slate-500 mb-1 text-xl">📝</span>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Toplam</p>
              <p className="text-3xl font-black mt-1 text-slate-200">{summary.total ?? 0}</p>
            </div>

            <div className={`app-card flex flex-col justify-center items-center text-center transition-colors relative overflow-hidden !py-6 border ${theme.softBorder}`}>
              <div className={`absolute top-0 right-0 w-24 h-24 ${theme.softBg} rounded-full blur-2xl`} />
              <span className={`${theme.text} mb-1 text-xl relative z-10`}>✅</span>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold relative z-10">Doğru</p>
              <p className={`text-3xl font-black mt-1 ${theme.text} relative z-10`}>{summary.correct ?? 0}</p>
            </div>

            {/* Yanlış — tıklanabilir, detaylı analiz açar */}
            <button
              onClick={() => setShowWrongModal(true)}
              className="app-card flex flex-col justify-center items-center text-center !border-rose-500/25 hover:!border-rose-500/50 hover:bg-rose-500/[0.06] transition-all relative overflow-hidden group !py-6"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all" />
              <span className="text-rose-500 mb-1 text-xl">❌</span>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Yanlış</p>
              <p className="text-3xl font-black mt-1 text-rose-400">{summary.wrong ?? 0}</p>
              <span className="text-[10px] text-rose-500/60 font-bold uppercase tracking-wider mt-1 group-hover:text-rose-400 transition-colors">
                detay →
              </span>
            </button>

            <div className="app-card flex flex-col justify-center items-center text-center hover:border-white/[0.14] transition-colors !py-6">
              <span className="text-slate-500 mb-1 text-xl">⚪</span>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Boş</p>
              <p className="text-3xl font-black mt-1 text-slate-300">{summary.blank ?? 0}</p>
            </div>

            <div className={`app-card relative flex flex-col justify-center items-center text-center !border ${theme.softBorder} ${theme.softBg} !py-6`}>
              <div className={`absolute -top-10 -right-10 w-32 h-32 ${theme.softBg} rounded-full blur-3xl`} />
              <span className={`relative z-10 ${theme.text} mb-1 text-xl`}>🎯</span>
              <p className={`relative z-10 ${theme.text}/70 text-xs uppercase tracking-wider font-semibold`}>Net Skor</p>
              <p className={`relative z-10 text-4xl font-black mt-1 ${theme.text}`}>
                {(Number.isFinite(netScore) ? netScore : 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Detaylı Analiz Butonu — belirgin */}
          {!premium && (
            <div className="w-full px-5 py-3 rounded-2xl border border-amber-300/20 bg-amber-500/10 text-amber-200 text-xs">
              Free planda temel analiz gorunur. Plus ile detayli zayif konu analizi sinirsiz acilir.
            </div>
          )}
          <button
            onClick={() => setShowWrongModal(true)}
            className="w-full flex items-center justify-between px-8 py-5 rounded-[2rem] bg-rose-950/30 border border-rose-500/25 hover:border-rose-500/50 hover:bg-rose-950/50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-xl shrink-0">
                🔍
              </div>
              <div className="text-left">
                <p className="font-black text-white text-base">Yanlış Soruların Detaylı Analizi</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {summary.wrong ?? 0} yanlış soru • ders ve konuya göre gruplandırılmış
                </p>
              </div>
            </div>
            <span className="text-rose-400 font-bold text-sm group-hover:translate-x-1 transition-transform">→</span>
          </button>

          {/* Tablo + Tahmini Puan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Ders Bazlı Performans Tablosu */}
            <div className="lg:col-span-2 rounded-[2rem] bg-white/[0.025] border border-white/[0.08] backdrop-blur-xl overflow-hidden">
              <div className="bg-white/[0.03] px-6 py-5 border-b border-white/[0.08]">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="text-fuchsia-400">🔬</span> Bu denemede ders performansı
                </h2>
              </div>
              <div className="p-1 overflow-x-auto">
                <table className="w-full text-sm md:text-base border-collapse">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="py-4 pl-5 font-medium">Ders</th>
                      <th className="py-4 px-2 font-medium text-center">Soru</th>
                      <th className={`py-4 px-2 font-medium ${theme.text}/80 text-center`}>D</th>
                      <th className="py-4 px-2 font-medium text-rose-400/80 text-center">Y</th>
                      <th className="py-4 px-2 font-medium text-slate-500 text-center">B</th>
                      <th className="py-4 pr-5 font-medium text-right">Bu testte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessonRows.map(([lesson, stats]) => (
                      <tr key={lesson} className="border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors">
                        <td className="py-3 pl-5 font-semibold text-slate-200">{lesson}</td>
                        <td className="py-3 px-2 text-center text-slate-400">{stats.total}</td>
                        <td className={`py-3 px-2 text-center ${theme.text}`}>{stats.correct}</td>
                        <td className="py-3 px-2 text-center text-rose-400">{stats.wrong}</td>
                        <td className="py-3 px-2 text-center text-slate-500">{stats.blank}</td>
                        <td className="py-3 pr-5">
                          <div className="flex items-center justify-end gap-3">
                            <span className="font-bold text-slate-200 min-w-[3rem] text-right">
                              %{stats.successRate}
                            </span>
                            <div className="h-2 w-20 md:w-28 bg-black/30 rounded-full overflow-hidden border border-white/[0.08]">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(stats.successRate)}`}
                                style={{ width: `${stats.successRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tahmini Puan + Aksiyonlar */}
            <div className="space-y-6">
              {estimatedTus && (
                <div className={`relative rounded-[2rem] bg-white/[0.025] backdrop-blur-xl border p-8 overflow-hidden group ${theme.softBorder} transition-all duration-500`}>
                  <div className={`absolute -right-10 -top-10 w-40 h-40 ${theme.softBg} rounded-full blur-3xl transition-all duration-500`} />
                  <div className="absolute right-4 top-4 text-6xl opacity-5">🏆</div>

                  <h2 className="text-lg font-semibold text-slate-400 mb-1 uppercase tracking-widest">Tahmini Puan</h2>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className={`text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r ${theme.gradient}`}>
                      {estimatedTus.score}
                    </span>
                    <span className="text-xl text-slate-500 font-bold">Puan</span>
                  </div>

                  <div className="bg-black/20 rounded-2xl p-4 border border-white/[0.06]">
                    <p className="text-lg font-bold text-slate-200 mb-1 flex items-center gap-2">
                      <span>💡</span> {estimatedTus.label}
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed">{estimatedTus.advice}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowWrongModal(true)}
                  className="w-full px-6 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 text-rose-300 font-black transition-all flex items-center justify-center gap-2"
                >
                  🔍 Yanlışlarımı İncele
                </button>
                <button
                  onClick={startFullExam}
                  className={`w-full px-6 py-4 rounded-2xl bg-gradient-to-r ${theme.gradient} text-slate-950 text-lg font-black shadow-lg ${theme.glow} hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2`}
                >
                  🔄 Yeni Deneme Çöz
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
