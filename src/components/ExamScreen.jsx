import React, { useState, useEffect } from "react";
import { usePrefersReducedMotion, useSwipeHandlers } from "../hooks/useSwipeHandlers";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { updateStreak } from "../services/streakService";
import { accentThemes } from "../theme/accentThemes";
import { getSubjectVisual } from "../theme/subjectVisual";
import { getSelectedAnswerIndex } from "../utils/examUtils";
import {
  appendLocalExamHistory,
  buildExamResultMetadata,
  estimatedTusNumericFromNet,
} from "../utils/examHistoryUtils";
import { trackClarityEvent } from "../lib/clarity";
import { addWrongQuestion } from "../services/studyCollectionService";
import { upsertSmartReview } from "../services/smartReviewService";
import FsrsDifficultyRating from "./FsrsDifficultyRating";

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// ─── Yanlış Soru Detay Modalı ────────────────────────────────────────────────
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

  const toggleTopic = (key) => {
    setOpenTopic(prev => prev === key ? null : key);
    setExpandedQ(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 overflow-hidden">
      {/* Başlık */}
      <div
        className="flex items-center justify-between px-4 md:px-8 py-5 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md shrink-0"
        style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top))" }}
      >
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Yanlış Soru Analizi</h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            {totalWrong} yanlış soru • ders ve konuya göre gruplandırıldı
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 font-bold transition-all"
        >
          ✕
        </button>
      </div>

      {/* İçerik */}
        <div className="flex-1 overflow-y-auto overscroll-y-contain px-4 md:px-8 py-6 space-y-3">
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
            <div key={lesson} className="rounded-[1.75rem] border border-slate-800 overflow-hidden">

              {/* Ders başlığı */}
              <button
                onClick={() => toggleLesson(lesson)}
                className="w-full flex items-center justify-between px-6 py-4 bg-slate-900/60 hover:bg-slate-900 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${isLessonOpen ? 'bg-rose-400' : 'bg-slate-700'}`} />
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
                <div className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {Object.keys(topics).map((topic) => {
                    const questions = topics[topic];
                    const topicKey = `${lesson}__${topic}`;
                    const isTopicOpen = openTopic === topicKey;

                    return (
                      <div key={topic}>
                        {/* Konu başlığı */}
                        <button
                          onClick={() => toggleTopic(topicKey)}
                          className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-slate-900/50 transition-colors text-left"
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
                                <div key={qi} className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">

                                  {/* Soru metni */}
                                  <button
                                    onClick={() => setExpandedQ(prev => prev === qKey ? null : qKey)}
                                    className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-slate-800/30 transition-colors"
                                  >
                                    <span className="mt-0.5 w-5 h-5 rounded-full bg-slate-800 text-slate-500 text-[10px] font-black flex items-center justify-center shrink-0">
                                      {qi + 1}
                                    </span>
                                    <p className="text-slate-300 text-sm leading-relaxed flex-1 line-clamp-2">{wq.q}</p>
                                    <span className={`text-slate-600 text-xs shrink-0 mt-0.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                                  </button>

                                  {/* Cevap özeti */}
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
                                    <div className="border-t border-slate-800 px-5 py-4 space-y-3">
                                      <div className="space-y-1.5">
                                        {wq.options.map((opt, oi) => {
                                          const isCorrect = oi === wq.correct;
                                          const isUserWrong = oi === wq.userAnswer && !isCorrect;
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
                                              <span className="leading-relaxed flex-1">{opt}</span>
                                              {isCorrect && <span className="ml-auto shrink-0 text-emerald-400">✓</span>}
                                              {isUserWrong && <span className="ml-auto shrink-0 text-rose-400">✗</span>}
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {wq.exp && (
                                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
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

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export default function ExamScreen({
  examQ,
  examIndex,
  examQuestions,
  examAnswers,
  examSelected,
  examSetMeta,
  onJump,
  handleExamSelect,
  handleExamSelectForQuestion,
  handleExamBlank,
  handleExamNext,
  handleExamPrev = () => {},
  getExamAnswersSnapshot,
  goDashboard,
  onExamCompleted,
  userId,
  userData,
  user = null,
  accentTheme,
}) {
  const theme = accentTheme || accentThemes.emerald;
  const subjectVisual = examQ ? getSubjectVisual(examQ.ders) : getSubjectVisual("");
  const examProgressPct = Math.min(
    100,
    ((examIndex + 1) / Math.max(1, examQuestions?.length || 1)) * 100
  );
  const [isOpticalOpen, setIsOpticalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState(null);
  const [wrongByLessonTopic, setWrongByLessonTopic] = useState({});
  const [showWrongModal, setShowWrongModal] = useState(false);
  const [userTarget, setUserTarget] = useState(65);
  const [showWrongFeedback, setShowWrongFeedback] = useState(false);
  const candidateName = auth.currentUser?.displayName || auth.currentUser?.email || "ADAY";
  const examUser = user || auth.currentUser;

  useEffect(() => {
    setShowWrongFeedback(false);
  }, [examIndex]);

  const currentAnswerIsWrong =
    examSelected !== null &&
    examSelected !== undefined &&
    Number(examSelected) !== Number(examQ?.correct);

  const advanceExam = () => {
    setShowWrongFeedback(false);
    if (examIndex < examQuestions.length - 1) {
      handleExamNext();
    } else {
      handleFinish();
    }
  };

  const handleSonrakiClick = () => {
    if (isSaving) return;
    if (currentAnswerIsWrong) {
      if (!showWrongFeedback) {
        setShowWrongFeedback(true);
      }
      return;
    }
    advanceExam();
  };

  const handleFsrsDone = () => {
    setShowWrongFeedback(false);
    advanceExam();
  };

  useEffect(() => {
    const fetchTarget = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().targetScore) {
            setUserTarget(userDoc.data().targetScore);
          }
        } catch (e) {
          console.error("Hedef puan çekilemedi.", e);
        }
      }
    };
    fetchTarget();
  }, []);

  // ── Sınavı Bitir ─────────────────────────────────────────────────────────
  const handleFinish = async () => {
    const user = auth.currentUser;
    if (!user) { alert("Lütfen giriş yapın!"); return; }

    if (userId) updateStreak(userId);
    setIsSaving(true);
    try {
      const latestAnswers = getExamAnswersSnapshot ? getExamAnswersSnapshot() : examAnswers;
      // Son sorunun cevabını da dahil et (examSelected henüz examAnswers'a eklenmemiş olabilir)
      const currentQuestion = examQuestions[examIndex];
      const persistedAnswer = getSelectedAnswerIndex(latestAnswers, currentQuestion, examIndex);
      const finalAnswers = {
        ...latestAnswers,
        ...(currentQuestion != null && examIndex != null
          ? { [examIndex]: persistedAnswer ?? examSelected ?? null }
          : {}),
      };

      let correct = 0, wrong = 0, empty = 0;
      const breakdown = {};
      const wByLT = {}; // wrongByLessonTopic

      examQuestions.forEach((q, idx) => {
        const userAnswer = getSelectedAnswerIndex(finalAnswers, q, idx);
        const ders = q.ders || "Genel";
        const konu = q.konu || "Diğer";

        if (!breakdown[ders]) breakdown[ders] = { c: 0, w: 0, b: 0, total: 0 };
        breakdown[ders].total += 1;

        if (userAnswer === undefined || userAnswer === null) {
          empty++;
          breakdown[ders].b += 1;
        } else if (userAnswer === q.correct) {
          correct++;
          breakdown[ders].c += 1;
        } else {
          wrong++;
          breakdown[ders].w += 1;

          // Yanlış soruyu grupla
          if (!wByLT[ders]) wByLT[ders] = {};
          if (!wByLT[ders][konu]) wByLT[ders][konu] = [];
          wByLT[ders][konu].push({
            q: q.q,
            options: q.options,
            userAnswer,
            correct: q.correct,
            exp: q.exp || null,
          });
        }
      });

      const wrongSaveTasks = examQuestions
        .map((q, idx) => {
          const userAnswer = getSelectedAnswerIndex(finalAnswers, q, idx);
          if (userAnswer === undefined || userAnswer === null || userAnswer === q.correct) {
            return null;
          }
          return Promise.all([
            addWrongQuestion(user, q, userAnswer, userData),
            upsertSmartReview(user, q, "wrong"),
          ]);
        })
        .filter(Boolean);
      if (wrongSaveTasks.length) {
        await Promise.allSettled(wrongSaveTasks);
      }

      const tusNet = Number((correct - wrong / 4).toFixed(2));
      const totalNet = tusNet;
      const completedAt = new Date().toISOString();
      const estimatedTusScore = estimatedTusNumericFromNet(totalNet);
      const resultMeta = examSetMeta ?? buildExamResultMetadata(null);

      const docRef = await addDoc(collection(db, "results"), {
        userId: user.uid,
        ...resultMeta,
        completedAt,
        date: serverTimestamp(),
        tusNet,
        stats: { correct, wrong, empty, totalNet },
        estimatedTusScore,
        breakdown,
      });

      appendLocalExamHistory({
        id: docRef.id,
        completedAt,
        tusNet,
        estimatedTusScore,
        totalCorrect: correct,
        totalWrong: wrong,
        totalBlank: empty,
        totalNet,
        ...resultMeta,
      });

      try {
        window.dispatchEvent(new CustomEvent("tusoskop-exam-saved"));
      } catch {
        /* ignore */
      }

      trackClarityEvent("deneme_tamamlandi");
      onExamCompleted?.();

      setResults({ correct, wrong, empty, totalNet, breakdown });
      setWrongByLessonTopic(wByLT);
      setIsFinished(true);
    } catch (error) {
      alert("Kayıt hatası: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const reducedMotion = usePrefersReducedMotion();
  const examSwipe = useSwipeHandlers({
    enabled: Boolean(examQ) && !isOpticalOpen && !reducedMotion,
    onSwipeLeft: () => {
      if (isSaving) return;
      if (examIndex < examQuestions.length - 1) handleExamNext();
      else void handleFinish();
    },
    onSwipeRight: () => {
      if (isSaving) return;
      handleExamPrev?.();
    },
    reducedMotion,
  });

  // ── Analiz Ekranı (Sınav bittikten sonra) ────────────────────────────────
  if (isFinished && results) {
    const distance = (userTarget - results.totalNet).toFixed(2);
    const isTargetMet = results.totalNet >= userTarget;

    return (
      <>
        {showWrongModal && (
          <WrongQuestionsModal
            wrongByLessonTopic={wrongByLessonTopic}
            totalWrong={results.wrong}
            onClose={() => setShowWrongModal(false)}
          />
        )}

        <div
          className="min-h-dvh bg-slate-950 text-white p-4 md:p-10 overflow-y-auto"
          style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }}
        >
          <div className="max-w-4xl mx-auto">

            {/* Başlık */}
            <header className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-3xl">📊</span>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  Deneme Analizi
                </h1>
              </div>
              <p className="text-slate-400 text-sm">
                Kişisel Hedefin: <span className="text-white font-bold">{userTarget} Net</span>
              </p>
            </header>

            {/* Özet Kartlar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] text-center">
                <p className="text-[10px] uppercase font-black text-cyan-500/80 mb-1">Net Skor</p>
                <p className="text-4xl font-black text-cyan-400">{results.totalNet}</p>
              </div>
              <div className="bg-slate-900 border border-emerald-900/50 p-6 rounded-[2rem] text-center">
                <p className="text-[10px] uppercase font-black text-emerald-500 mb-1">Doğru</p>
                <p className="text-4xl font-black text-emerald-400">{results.correct}</p>
              </div>

              {/* Yanlış — tıklanabilir */}
              <button
                onClick={() => setShowWrongModal(true)}
                className={`bg-slate-900 border ${theme.softBorder} ${theme.softBg} p-6 rounded-[2rem] text-center transition-all group`}
              >
                <p className={`text-[10px] uppercase font-black ${theme.text} mb-1`}>Yanlış</p>
                <p className={`text-4xl font-black ${theme.text}`}>{results.wrong}</p>
                <p className={`text-[9px] ${theme.text}/70 font-bold uppercase tracking-wider mt-1 transition-colors`}>
                  detay →
                </p>
              </button>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] text-center">
                <p className="text-[10px] uppercase font-black text-slate-500 mb-1">Boş</p>
                <p className="text-4xl font-black text-slate-400">{results.empty}</p>
              </div>
            </div>

            {/* Hedef Durum Kartı */}
            <div className={`p-8 rounded-[2.5rem] text-center mb-6 border-2 transition-all ${isTargetMet ? `${theme.softBg} ${theme.border}` : 'bg-slate-900 border-slate-800'}`}>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Hedef Durumu</h3>
              <p className="text-5xl font-black mb-3">
                {isTargetMet ? "HEDEF TAMAM! 🎉" : `${distance} Net Kaldı`}
              </p>
              <p className="text-slate-400 text-sm italic">
                {isTargetMet
                  ? "Kişisel hedefine ulaştın, bu tempoyu koru!"
                  : `Hedeflediğin ${userTarget} nete ulaşmak için biraz daha gayret.`}
              </p>
            </div>

            {/* Detaylı Analiz Butonu */}
            <button
              onClick={() => setShowWrongModal(true)}
              className="w-full flex items-center justify-between px-8 py-5 rounded-[2rem] bg-rose-950/30 border border-rose-500/25 hover:border-rose-500/50 hover:bg-rose-950/50 transition-all group mb-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-xl shrink-0">
                  🔍
                </div>
                <div className="text-left">
                  <p className="font-black text-white text-base">Yanlış Soruların Detaylı Analizi</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {results.wrong} yanlış soru • ders ve konuya göre gruplandırılmış, doğru cevaplarla
                  </p>
                </div>
              </div>
              <span className="text-rose-400 font-bold text-sm group-hover:translate-x-1 transition-transform">→</span>
            </button>

            {/* Ders Bazlı Tablo */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl">
              <div className="p-6 border-b border-slate-800 font-bold flex items-center gap-2">
                <span className="text-fuchsia-400">🔬</span> Bu denemede branş performansı
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 text-[10px] font-black text-slate-500 uppercase">
                    <tr>
                      <th className="p-5">Branş</th>
                      <th className="p-5 text-center text-emerald-500">D</th>
                      <th className="p-5 text-center text-rose-500">Y</th>
                      <th className="p-5 text-center text-slate-600">B</th>
                      <th className="p-5 text-right">Bu testte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {Object.keys(results.breakdown).map((ders) => {
                      const b = results.breakdown[ders];
                      const rate = b.total > 0 ? Math.round((b.c / b.total) * 100) : 0;
                      return (
                        <tr key={ders} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-5 font-bold">{ders}</td>
                          <td className="p-5 text-center font-bold text-emerald-400">{b.c}</td>
                          <td className="p-5 text-center font-bold text-rose-400">{b.w}</td>
                          <td className="p-5 text-center text-slate-500">{b.b}</td>
                          <td className="p-5">
                            <div className="flex items-center justify-end gap-3">
                              <span className="font-black text-slate-200 min-w-[3rem] text-right">%{rate}</span>
                              <div className="h-2 w-20 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                <div
                                  className={`h-full rounded-full ${rate >= 65 ? 'bg-emerald-500' : rate >= 45 ? 'bg-cyan-400' : 'bg-rose-500'}`}
                                  style={{ width: `${rate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={goDashboard}
              className={`w-full py-6 ${theme.primary} ${theme.primaryHover} text-slate-950 font-black rounded-[2rem] hover:scale-[1.02] active:scale-95 transition-all shadow-lg ${theme.glow}`}
            >
              PANELE DÖN VE GRAFİĞİ GÖR
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Sınav Ekranı ─────────────────────────────────────────────────────────
  if (!examQ) return null;

  return (
    <div className="flex h-dvh bg-[#020617] text-white overflow-x-hidden relative">

      {/* SOL: Soru Alanı */}
      <div
        className="flex-1 overflow-y-auto border-r border-slate-900 overscroll-y-contain touch-pan-y"
        {...examSwipe}
      >
        <div
          className="sticky top-0 z-50 bg-slate-950/95 sticky-bar-blur border-b border-slate-800/80 px-3 md:px-8 py-2.5"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
        >
          <div className="max-w-4xl mx-auto w-full flex items-center gap-3">
            <button
              type="button"
              onClick={goDashboard}
              aria-label="Panele dön ve sınavdan çık"
              className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 active:scale-95 transition-all text-lg font-bold"
            >
              ←
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                <span className="tabular-nums text-slate-200">
                  Soru {examIndex + 1} / {examQuestions.length}
                </span>
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${subjectVisual.dot}`}
                    aria-hidden
                  />
                  <span className="truncate text-slate-300 normal-case tracking-normal">
                    {examQ.ders}
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ease-out ${theme.primary}`}
                  style={{ width: `${examProgressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 py-5 md:py-10 pb-8 md:pb-10">
          <div className="max-w-4xl mx-auto w-full space-y-6 md:space-y-8">
          {/* Soru Kartı */}
          <div
            className={`max-w-4xl mx-auto w-full rounded-3xl border ${theme.border} ${subjectVisual.border} bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl p-5 md:p-8 shadow-2xl ${theme.glow}`}
          >
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="px-4 py-2 rounded-full bg-slate-800/80 text-slate-300 text-xs font-black uppercase tracking-widest tabular-nums">
                SORU {examIndex + 1}
              </span>
              <span
                className={`flex max-w-[65%] items-center gap-2 truncate ${theme.text} text-xs md:text-sm font-bold uppercase tracking-widest`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${subjectVisual.dot}`}
                  aria-hidden
                />
                <span className="truncate">{examQ.ders}</span>
              </span>
            </div>
            <div className="text-xs md:text-sm text-slate-400 mb-4 leading-relaxed">
              {examQ.konu || "Konu"}
            </div>
            <div className="mx-auto max-w-prose">
              <h2 className="exam-question-body mobile-reading-stem leading-relaxed text-slate-50 break-words whitespace-pre-wrap [overflow-wrap:anywhere]">
                {examQ.q}
              </h2>
            </div>
          </div>

          {/* Şıklar */}
          <div
            className="space-y-3"
            style={{ paddingBottom: "calc(9.5rem + env(safe-area-inset-bottom))" }}
          >
            {examQ.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={examSelected === i}
                onClick={() => handleExamSelect(i)}
                className={`group flex min-h-[52px] w-full items-start gap-3 rounded-2xl border p-4 md:gap-4 md:p-5 text-left shadow-sm transition-[transform,box-shadow,background-color,border-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] ${theme.ring} ${
                  examSelected === i
                    ? `${theme.border} ${theme.softBg} shadow-lg ${theme.glow}`
                    : "border-slate-700 bg-slate-900/70 hover:bg-slate-800/80 hover:border-slate-500"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black mt-0.5 ${
                    examSelected === i
                      ? `${theme.primary} text-slate-950`
                      : "bg-slate-800 text-slate-500 group-hover:bg-slate-700"
                  }`}
                >
                  {LETTERS[i]}
                </span>
                <span className="flex-1 pt-0.5 text-base leading-relaxed text-slate-200 md:text-[1.05rem] md:leading-relaxed">
                  {opt}
                </span>
              </button>
            ))}
          </div>

          {showWrongFeedback && currentAnswerIsWrong && (
            <div className="max-w-4xl mx-auto w-full space-y-4 rounded-3xl border border-rose-500/25 bg-slate-900/90 p-5 md:p-6">
              <p className="text-[11px] font-black uppercase tracking-widest text-rose-300/90">
                Yanlış cevap — inceleme
              </p>
              <p className={`text-sm font-bold ${theme.text}`}>
                Doğru cevap: {LETTERS[examQ.correct]} — {examQ.options[examQ.correct]}
              </p>
              {examQ.exp && (
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                  {examQ.exp}
                </p>
              )}
              <FsrsDifficultyRating
                question={examQ}
                user={examUser}
                isLightTheme={false}
                accentTheme={theme}
                onRated={handleFsrsDone}
                onSkip={handleFsrsDone}
              />
            </div>
          )}

          {/* Alt kontrol — zen: Önceki | Boş | Sonraki */}
          <div
            className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-3 gap-2 border-t border-slate-800 bg-slate-950/95 px-3 pt-3 sticky-bar-blur lg:static lg:z-auto lg:border-t-0 lg:bg-transparent lg:px-0 lg:pt-0 lg:backdrop-blur-none"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <button
              type="button"
              onClick={() => handleExamPrev()}
              disabled={examIndex <= 0}
              className={`min-h-[52px] rounded-2xl border px-2 py-3 text-sm font-bold transition-all active:scale-[0.98] ${
                examIndex <= 0
                  ? "cursor-not-allowed border-slate-800 bg-slate-900/40 text-slate-600"
                  : "border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
              }`}
            >
              Önceki
            </button>
            <button
              type="button"
              onClick={() => handleExamBlank()}
              className="min-h-[52px] rounded-2xl border border-slate-700 bg-slate-900/70 px-2 py-3 text-sm font-bold text-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              Boş
            </button>
            <button
              type="button"
              onClick={handleSonrakiClick}
              disabled={isSaving || (showWrongFeedback && currentAnswerIsWrong)}
              className={`min-h-[52px] rounded-2xl px-2 py-3 text-sm font-black shadow-lg transition-all active:scale-[0.98] ${
                isSaving
                  ? "bg-slate-700 text-slate-500"
                  : `bg-gradient-to-r ${theme.gradient} text-slate-950 ${theme.glow}`
              }`}
            >
              {isSaving
                ? "…"
                : examIndex < examQuestions.length - 1
                  ? "Sonraki"
                  : "Bitir"}
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* SAĞ: Optik Form */}
      <div className={`
        fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-0
        w-full lg:w-80 bg-[#f4f4f2] flex flex-col transition-transform duration-300
        ${isOpticalOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"}
        lg:flex
      `}>
        <button
          type="button"
          onClick={() => setIsOpticalOpen(false)}
          className="lg:hidden absolute right-4 w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold z-10"
          style={{ top: "calc(1rem + env(safe-area-inset-top))" }}
          aria-label="Optik formu kapat"
        >
          ✕
        </button>

        <div className="p-6 bg-[#e5e5e3] border-b border-[#d1d1cf]">
          <h3 className="text-slate-800 font-black text-center tracking-tighter text-xl mb-4">CEVAP KAĞIDI</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-2 border border-[#d1d1cf] rounded shadow-sm text-center">
              <p className="text-[9px] text-slate-400 uppercase font-black mb-0.5">Aday</p>
              <p className="text-[11px] text-slate-800 font-bold truncate uppercase">{candidateName}</p>
            </div>
            <div className="bg-white p-2 border border-[#d1d1cf] rounded shadow-sm text-center">
              <p className="text-[9px] text-slate-400 uppercase font-black mb-0.5">ÖSYM</p>
              <p className="text-[11px] text-slate-800 font-bold">2026-TUS</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {examQuestions.map((_, idx) => {
            const currentQuestion = examQuestions[idx];
            const currentAnswer = idx === examIndex
              ? examSelected
              : getSelectedAnswerIndex(examAnswers, currentQuestion, idx);
            const rowBg = idx % 2 === 0 ? "bg-white" : "bg-[#f9efe2]";
            const activeStyle = idx === examIndex ? "bg-cyan-100 ring-1 ring-cyan-300 z-10" : rowBg;

            return (
              <div
                key={idx}
                onClick={() => { onJump(idx); if (window.innerWidth < 1024) setIsOpticalOpen(false); }}
                className={`flex items-center gap-3 p-1.5 rounded transition-all cursor-pointer group ${activeStyle}`}
              >
                <span className={`w-6 text-[10px] font-black ${idx === examIndex ? "text-cyan-700" : "text-slate-400"} text-right`}>
                  {idx + 1}
                </span>
                <div className="flex gap-1.5">
                  {LETTERS.map((letter, letterIdx) => (
                    <div
                      key={letter}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExamSelectForQuestion(idx, letterIdx);
                        if (window.innerWidth < 1024) setIsOpticalOpen(false);
                      }}
                      className={`w-6 h-6 rounded-full border border-slate-400 flex items-center justify-center text-[10px] font-bold cursor-pointer active:scale-90 transition-transform ${
                        currentAnswer === letterIdx
                          ? "bg-[#2d2d2d] text-white border-[#2d2d2d] scale-105"
                          : "bg-white text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {currentAnswer === letterIdx ? "" : letter}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobil FAB — safe area hesaplı */}
      <button
        onClick={() => setIsOpticalOpen(true)}
        className={`lg:hidden fixed right-5 w-14 h-14 rounded-full ${theme.primary} text-slate-950 shadow-2xl ${theme.glow} flex items-center justify-center z-40 active:scale-90`}
        style={{ bottom: "calc(6.75rem + env(safe-area-inset-bottom))" }}
      >
        <span className="text-[10px] font-black leading-tight text-center">OPTİK</span>
      </button>
    </div>
  );
}
