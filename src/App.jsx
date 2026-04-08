import React, { useMemo, useState } from "react";
import SubjectCard from "./components/SubjectCard";
import TopicTracker from "./components/TopicTracker";
import TusCountDown from "./components/TusCountDown";
import { SUBJECTS } from "./data/subjects";
import { QUESTIONS } from "./data/questions";
import {
  buildFullExam,
  analyzeExamResults,
  getEstimatedTusResult,
} from "./utils/examUtils";

const FULL_EXAM_BLUEPRINT = {
  Anatomi: 13,
  Fizyoloji: 15,
  Biyokimya: 18,
  Mikrobiyoloji: 18,
  Patoloji: 18,
  Farmakoloji: 18,
  Dahiliye: 23,
  Pediatri: 25,
  "Genel Cerrahi": 20,
  "Kadın Hastalıkları ve Doğum": 10,
  "Küçük Stajlar": 22,
};

export default function App() {
  const [view, setView] = useState("dashboard");

  // Study mode state
  const [currentSubject, setCurrentSubject] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  // Topic setup state
  const [selectedLesson, setSelectedLesson] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [activeQuestions, setActiveQuestions] = useState([]);

  // Exam mode state
  const [examQuestions, setExamQuestions] = useState([]);
  const [examIndex, setExamIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState([]);
  const [examSelected, setExamSelected] = useState(null);

  const questions = activeQuestions;
  const q = questions[currentIndex];
  const progress = questions.length
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;

  const examQ = examQuestions[examIndex];
  const examProgress = examQuestions.length
    ? ((examIndex + 1) / examQuestions.length) * 100
    : 0;

  const examAnalysis = useMemo(() => {
    if (!examQuestions.length) return null;
    return analyzeExamResults(examQuestions, examAnswers);
  }, [examQuestions, examAnswers]);

  const estimatedTus = useMemo(() => {
    if (!examAnalysis) return null;
    return getEstimatedTusResult(examAnalysis.summary.net);
  }, [examAnalysis]);

  const resetStudyState = () => {
    setCurrentSubject(null);
    setCurrentIndex(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setSelectedLesson("");
    setSelectedTopic("");
    setActiveQuestions([]);
  };

  const resetExamState = () => {
    setExamQuestions([]);
    setExamIndex(0);
    setExamAnswers([]);
    setExamSelected(null);
  };

  const goDashboard = () => {
    resetStudyState();
    resetExamState();
    setView("dashboard");
  };

  const startSubject = (subjectName) => {
    const filtered = QUESTIONS.filter((item) => item.ders === subjectName);

    if (filtered.length === 0) return;

    resetStudyState();
    setCurrentSubject(subjectName);
    setActiveQuestions(filtered);
    setView("study");
  };

  const startTopicTest = () => {
    const filtered = QUESTIONS.filter(
      (item) => item.ders === selectedLesson && item.konu === selectedTopic
    );

    if (filtered.length === 0) {
      alert("Bu ders ve konu için henüz soru eklenmemiş.");
      return;
    }

    resetStudyState();
    setCurrentSubject(`${selectedLesson} / ${selectedTopic}`);
    setActiveQuestions(filtered);
    setView("study");
  };

  const startFullExam = () => {
    const exam = buildFullExam(QUESTIONS, FULL_EXAM_BLUEPRINT);

    if (!exam.length) {
      alert("Deneme oluşturulamadı. Soruların ders adlarını kontrol et.");
      return;
    }

    resetExamState();
    setExamQuestions(exam);
    setExamAnswers(Array(exam.length).fill(null));
    setExamIndex(0);
    setExamSelected(null);
    setView("exam");
  };

  const handleSelect = (index) => {
    if (showResult || !q) return;

    setSelected(index);
    setShowResult(true);

    if (index === q.correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setView("summary");
    }
  };

  const handleExamSelect = (index) => {
    setExamSelected(index);
  };

  const handleExamNext = () => {
    const updatedAnswers = [...examAnswers];
    updatedAnswers[examIndex] = examSelected;
    setExamAnswers(updatedAnswers);

    if (examIndex < examQuestions.length - 1) {
      const nextIndex = examIndex + 1;
      setExamIndex(nextIndex);
      setExamSelected(updatedAnswers[nextIndex] ?? null);
    } else {
      setView("examAnalysis");
    }
  };

  const handleExamBlank = () => {
    const updatedAnswers = [...examAnswers];
    updatedAnswers[examIndex] = null;
    setExamAnswers(updatedAnswers);

    if (examIndex < examQuestions.length - 1) {
      const nextIndex = examIndex + 1;
      setExamIndex(nextIndex);
      setExamSelected(updatedAnswers[nextIndex] ?? null);
    } else {
      setView("examAnalysis");
    }
  };

  const availableLessons = [...new Set(QUESTIONS.map((item) => item.ders))];
  const availableTopics = selectedLesson
    ? [
        ...new Set(
          QUESTIONS.filter((item) => item.ders === selectedLesson).map(
            (item) => item.konu
          )
        ),
      ]
    : [];

  if (view === "dashboard") {
    return (
      <div className="min-h-screen bg-slate-950 text-white px-4 py-6 md:px-8 md:py-10">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-10 md:mb-14">
            <div className="text-4xl md:text-5xl mb-3">🩺</div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-emerald-400">
              TUSOSKOP
            </h1>

            <p className="mt-4 text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
              Branş seç, test çöz, açıklamayla öğren. Hayalindeki bölüme bir adım at.
            </p>
          </header>

          <div className="mb-10">
            <TusCountDown />
          </div>

          <div className="mb-10 flex flex-col items-center gap-4">
            <div className="flex w-full flex-col items-stretch justify-center gap-3 lg:flex-row lg:items-center">
              <button
                onClick={() => setView("questionSetup")}
                className="
                  group relative overflow-hidden
                  w-full lg:flex-1 lg:min-w-[420px]
                  px-10 py-6 rounded-3xl
                  bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500
                  text-slate-950 text-lg md:text-xl font-black tracking-wide
                  shadow-[0_0_25px_rgba(16,185,129,0.45)]
                  hover:shadow-[0_0_50px_rgba(34,211,238,0.55)]
                  hover:scale-[1.03] active:scale-[0.98]
                  transition-all duration-300 animate-pulse
                "
              >
                <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.45),transparent)] -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="absolute -top-8 -left-8 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
                <span className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-cyan-200/20 blur-2xl" />

                <span className="relative z-10 flex items-center justify-center gap-4">
                  <span className="text-2xl">⚡</span>
                  <span>Ders / Konu Seçerek Çöz</span>
                  <span className="text-xl transition-transform duration-300 group-hover:translate-x-2">
                    →
                  </span>
                </span>
              </button>

              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col">
                <button
                  onClick={startFullExam}
                  className="
                    group relative overflow-hidden
                    w-full lg:min-w-[220px]
                    px-6 py-4 rounded-3xl
                    bg-gradient-to-r from-fuchsia-700 via-violet-700 to-fuchsia-700
                    text-white text-base font-bold
                    border border-fuchsia-300/20
                    shadow-[0_0_18px_rgba(168,85,247,0.18)]
                    hover:border-fuchsia-300/40
                    hover:shadow-[0_0_28px_rgba(168,85,247,0.25)]
                    hover:scale-[1.02]
                    transition-all duration-300
                  "
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <span className="text-lg">🧪</span>
                    <span>Deneme Çöz</span>
                  </span>
                </button>

                <button
                  onClick={() => setView("tracker")}
                  className="
                    group relative overflow-hidden
                    w-full lg:min-w-[220px]
                    px-6 py-4 rounded-3xl
                    bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800
                    text-white text-base font-bold
                    border border-emerald-400/20
                    shadow-[0_0_18px_rgba(16,185,129,0.10)]
                    hover:border-emerald-400/40
                    hover:shadow-[0_0_28px_rgba(16,185,129,0.18)]
                    hover:scale-[1.02]
                    transition-all duration-300
                  "
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <span className="text-lg">📚</span>
                    <span>TUS HARİTAM</span>
                  </span>
                </button>

                <button
                  onClick={() => setView("suggestions")}
                  className="
                    group relative overflow-hidden
                    w-full lg:min-w-[220px]
                    px-6 py-4 rounded-3xl
                    bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800
                    text-white text-base font-bold
                    border border-cyan-400/20
                    shadow-[0_0_18px_rgba(34,211,238,0.10)]
                    hover:border-cyan-400/40
                    hover:shadow-[0_0_28px_rgba(34,211,238,0.18)]
                    hover:scale-[1.02]
                    transition-all duration-300
                  "
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <span className="text-lg">💡</span>
                    <span>ÖNERİLER</span>
                  </span>
                </button>
              </div>
            </div>

            <p className="text-sm md:text-base text-emerald-300/90 font-medium text-center">
              İstediğin ders ve konudan hızlı test başlat, tam deneme çöz, eksiklerini gör.
            </p>
          </div>

          {["Temel", "Klinik"].map((type) => (
            <section key={type} className="mb-12">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl md:text-2xl font-bold text-slate-200 border-b border-slate-800 pb-3 w-full">
                  {type} Bilimler
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
                {SUBJECTS.filter((s) => s.type === type).map((s) => (
                  <SubjectCard
                    key={s.name}
                    subject={s}
                    count={QUESTIONS.filter((item) => item.ders === s.name).length}
                    onClick={() => startSubject(s.name)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  if (view === "questionSetup") {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-[2rem] p-8 md:p-10">
          <h2 className="text-3xl font-black mb-6 text-emerald-400">
            Ders ve konu seç
          </h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Ders</label>
              <select
                value={selectedLesson}
                onChange={(e) => {
                  setSelectedLesson(e.target.value);
                  setSelectedTopic("");
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-emerald-500"
              >
                <option value="">Ders seç</option>
                {availableLessons.map((lesson) => (
                  <option key={lesson} value={lesson}>
                    {lesson}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Konu</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                disabled={!selectedLesson}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-emerald-500 disabled:opacity-50"
              >
                <option value="">Konu seç</option>
                {availableTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            <button
              onClick={startTopicTest}
              disabled={!selectedLesson || !selectedTopic}
              className="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-bold hover:opacity-90 disabled:opacity-50"
            >
              Soruları başlat
            </button>

            <button
              onClick={goDashboard}
              className="px-5 py-3 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-700"
            >
              Panele dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "tracker") {
    return <TopicTracker onBack={goDashboard} />;
  }

  if (view === "suggestions") {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-[2rem] p-8 md:p-10">
          <h2 className="text-3xl font-black mb-6 text-emerald-400">
            2027/1 TUS birincisinden tavsiyeler
          </h2>

          <ul className="space-y-4 text-slate-300 leading-relaxed">
            <li>• Her gün az ama düzenli çalış.</li>
            <li>• Soru çözmeden TUS kazanılmaz.</li>
            <li>• Yanlış yaptığın soruları mutlaka tekrar et.</li>
            <li>• Son aylarda deneme ve tekrar ağırlıklı git.</li>
            <li>• Zayıf olduğun dersleri sona bırakma.</li>
            <li>• Kaynak sayısını değil, tekrar sayısını artır.</li>
            <li>• Motivasyon düşse bile rutini bırakma.</li>
          </ul>

          <div className="mt-8">
            <button
              onClick={goDashboard}
              className="px-5 py-3 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-700"
            >
              Panele dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "summary") {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-[2rem] p-8 md:p-10">
          <h2 className="text-3xl font-black mb-4 text-emerald-400">
            Test Tamamlandı
          </h2>

          <p className="text-xl text-slate-200 mb-3">{currentSubject}</p>

          <p className="text-slate-400 mb-8">
            Skor:{" "}
            <span className="text-white font-bold">
              {score} / {questions.length}
            </span>
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setSelected(null);
                setShowResult(false);
                setScore(0);
                setView("study");
              }}
              className="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-bold hover:opacity-90"
            >
              Tekrar çöz
            </button>

            <button
              onClick={goDashboard}
              className="px-5 py-3 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-700"
            >
              Panele dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "exam" && !examQ) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-2xl font-bold mb-3">Deneme oluşturulamadı</p>
          <button
            onClick={goDashboard}
            className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700"
          >
            Panele dön
          </button>
        </div>
      </div>
    );
  }

  if (view === "exam") {
    return (
      <div className="min-h-screen bg-slate-950 text-white px-4 py-6 md:px-8 md:py-10">
        <div className="max-w-5xl mx-auto">
          <header className="mb-6 md:mb-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <button
                onClick={goDashboard}
                className="group inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-slate-300 font-semibold transition hover:border-fuchsia-400/30 hover:text-white"
              >
                <span className="transition group-hover:-translate-x-1">←</span>
                <span>Panele dön</span>
              </button>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-right shadow-sm">
                <div className="text-sm text-slate-400">
                  Deneme • {examIndex + 1} / {examQuestions.length}
                </div>
                <div className="text-sm md:text-base text-fuchsia-300 font-bold">
                  200 soru
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-full bg-slate-800 h-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${examProgress}%` }}
              />
            </div>
          </header>

          <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 p-6 md:p-8 shadow-[0_0_40px_rgba(168,85,247,0.08)]">
            <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_35%)] pointer-events-none" />

            <div className="relative z-10">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-fuchsia-300">
                    <span className="h-2 w-2 rounded-full bg-fuchsia-400 animate-pulse" />
                    {examQ.ders} • {examQ.konu}
                  </div>

                  <h2 className="mt-4 text-2xl md:text-3xl font-black leading-tight text-white">
                    {examQ.q}
                  </h2>
                </div>

                <div className="shrink-0 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2">
                  <div className="flex gap-1 text-yellow-400 text-lg md:text-xl">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={i < examQ.diff ? "opacity-100" : "opacity-20"}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {examQ.options.map((opt, i) => {
                  const isSelected = examSelected === i;

                  return (
                    <button
                      key={i}
                      onClick={() => handleExamSelect(i)}
                      className={`group w-full text-left rounded-2xl border-2 p-4 md:p-5 transition-all duration-200 flex items-center gap-4 ${
                        isSelected
                          ? "border-fuchsia-500 bg-fuchsia-500/10 shadow-[0_0_20px_rgba(168,85,247,0.18)]"
                          : "border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/80 hover:-translate-y-[2px]"
                      }`}
                    >
                      <div
                        className={`flex h-11 w-11 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl font-black text-base md:text-lg transition ${
                          isSelected
                            ? "bg-fuchsia-500 text-white"
                            : "bg-slate-800 text-slate-300 group-hover:bg-slate-700"
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>

                      <div className="flex-1 text-base md:text-lg leading-relaxed text-white">
                        {opt}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleExamBlank}
                  className="px-5 py-3 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition"
                >
                  Boş bırak
                </button>

                <button
                  onClick={handleExamNext}
                  className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-6 py-3 text-white font-black shadow-[0_0_25px_rgba(168,85,247,0.25)] transition hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(34,211,238,0.25)]"
                >
                  <span>
                    {examIndex < examQuestions.length - 1
                      ? "Sonraki soru"
                      : "Analizi gör"}
                  </span>
                  <span className="transition group-hover:translate-x-1">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "examAnalysis" && examAnalysis) {
    const lessonRows = Object.entries(examAnalysis.byLesson);

    return (
      <div className="min-h-screen bg-slate-950 text-white px-4 py-6 md:px-8 md:py-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-fuchsia-300">
                Deneme Analizi
              </h2>
              <p className="mt-2 text-slate-400">
                Hangi derste zorlandın, hangi konulara dönmen gerekiyor, hepsi burada.
              </p>
            </div>

            <button
              onClick={goDashboard}
              className="px-5 py-3 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-700"
            >
              Panele dön
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Toplam</p>
              <p className="text-3xl font-black text-white">{examAnalysis.summary.total}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Doğru</p>
              <p className="text-3xl font-black text-emerald-400">{examAnalysis.summary.correct}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Yanlış</p>
              <p className="text-3xl font-black text-red-400">{examAnalysis.summary.wrong}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Boş</p>
              <p className="text-3xl font-black text-slate-200">{examAnalysis.summary.blank}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Net</p>
              <p className="text-3xl font-black text-fuchsia-300">{examAnalysis.summary.net}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            <div className="xl:col-span-2 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
              <h3 className="text-2xl font-black text-white mb-5">Ders bazlı performans</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-sm">
                      <th className="pb-3 pr-4">Ders</th>
                      <th className="pb-3 pr-4">Toplam</th>
                      <th className="pb-3 pr-4">Doğru</th>
                      <th className="pb-3 pr-4">Yanlış</th>
                      <th className="pb-3 pr-4">Boş</th>
                      <th className="pb-3 pr-4">Başarı</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessonRows.map(([lesson, stats]) => (
                      <tr key={lesson} className="border-b border-slate-900">
                        <td className="py-3 pr-4 font-semibold text-white">{lesson}</td>
                        <td className="py-3 pr-4 text-slate-300">{stats.total}</td>
                        <td className="py-3 pr-4 text-emerald-400 font-bold">{stats.correct}</td>
                        <td className="py-3 pr-4 text-red-400 font-bold">{stats.wrong}</td>
                        <td className="py-3 pr-4 text-slate-300">{stats.blank}</td>
                        <td className="py-3 pr-4 text-fuchsia-300 font-bold">%{stats.successRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-br from-fuchsia-900/30 via-slate-900 to-slate-950 p-6">
              <h3 className="text-2xl font-black text-white mb-4">Tahmini TUS bandı</h3>

              <div className="rounded-3xl bg-slate-950/70 border border-fuchsia-500/20 p-5">
                <p className="text-sm text-slate-400 mb-2">Tahmini puan</p>
                <p className="text-4xl font-black text-fuchsia-300 mb-2">{estimatedTus.score}</p>
                <p className="text-lg font-bold text-white mb-3">{estimatedTus.label}</p>
                <p className="text-slate-300 leading-relaxed">{estimatedTus.advice}</p>
              </div>

              <div className="mt-5 rounded-3xl bg-slate-950/70 border border-slate-800 p-5">
                <p className="text-sm text-slate-400 mb-2">Kaba yönlendirme</p>
                <p className="text-slate-300 leading-relaxed">
                  Bu ekran kesin tercih danışmanlığı değil. Ama mevcut performansınla
                  ulaşılabilir branş bandını kabaca gösterir. Netin arttıkça daha rekabetçi
                  merkezler ve bölümler masaya gelir.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 mb-8">
            <h3 className="text-2xl font-black text-white mb-5">Geliştirilmesi gereken alanlar</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {examAnalysis.weakestLessons.map((lesson) => (
                <div
                  key={lesson.lesson}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <h4 className="text-xl font-black text-fuchsia-300">{lesson.lesson}</h4>
                    <span className="text-sm font-bold text-slate-300">
                      %{lesson.successRate} başarı
                    </span>
                  </div>

                  <p className="text-slate-400 mb-3">
                    Doğru: <span className="text-emerald-400 font-bold">{lesson.correct}</span>{" "}
                    • Yanlış: <span className="text-red-400 font-bold">{lesson.wrong}</span>{" "}
                    • Boş: <span className="text-slate-200 font-bold">{lesson.blank}</span>
                  </p>

                  <div>
                    <p className="text-sm text-slate-400 mb-2">Yanlış yapılan konu başlıkları</p>

                    <div className="flex flex-wrap gap-2">
                      {lesson.weakTopics.length > 0 ? (
                        lesson.weakTopics.slice(0, 8).map((topic) => (
                          <span
                            key={topic}
                            className="px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-400/20 text-fuchsia-200 text-sm"
                          >
                            {topic}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500">Belirgin yanlış konu yok.</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={startFullExam}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-500 text-white font-black hover:opacity-90"
            >
              Yeni deneme çöz
            </button>

            <button
              onClick={goDashboard}
              className="px-5 py-3 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-700"
            >
              Panele dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!q && view === "study") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-2xl font-bold mb-3">Soru bulunamadı</p>

          <button
            onClick={goDashboard}
            className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700"
          >
            Panele dön
          </button>
        </div>
      </div>
    );
  }

  if (view !== "study") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 md:mb-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <button
              onClick={goDashboard}
              className="group inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-slate-300 font-semibold transition hover:border-emerald-400/30 hover:text-white"
            >
              <span className="transition group-hover:-translate-x-1">←</span>
              <span>Panele dön</span>
            </button>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-right shadow-sm">
              <div className="text-sm text-slate-400">
                {currentIndex + 1} / {questions.length}
              </div>
              <div className="text-sm md:text-base text-emerald-400 font-bold">
                Skor: {score}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-full bg-slate-800 h-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 p-6 md:p-8 shadow-[0_0_40px_rgba(16,185,129,0.08)]">
          <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_35%)] pointer-events-none" />
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {currentSubject}
                </div>

                <h2 className="mt-4 text-2xl md:text-3xl font-black leading-tight text-white">
                  {q.q}
                </h2>
              </div>

              <div className="shrink-0 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2">
                <div className="flex gap-1 text-yellow-400 text-lg md:text-xl">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={i < q.diff ? "opacity-100" : "opacity-20"}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {q.options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = q.correct === i;

                let classes =
                  "group w-full text-left rounded-2xl border-2 p-4 md:p-5 transition-all duration-200 flex items-center gap-4 ";

                if (showResult) {
                  if (isCorrect) {
                    classes +=
                      "border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.12)]";
                  } else if (isSelected && !isCorrect) {
                    classes +=
                      "border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.10)]";
                  } else {
                    classes += "border-slate-800 bg-slate-900/50";
                  }
                } else {
                  classes +=
                    "border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/80 hover:-translate-y-[2px]";
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={showResult}
                    className={classes}
                  >
                    <div
                      className={`flex h-11 w-11 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl font-black text-base md:text-lg transition ${
                        showResult
                          ? isCorrect
                            ? "bg-emerald-500 text-white"
                            : isSelected
                            ? "bg-red-500 text-white"
                            : "bg-slate-800 text-slate-400"
                          : "bg-slate-800 text-slate-300 group-hover:bg-slate-700"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>

                    <div className="flex-1 text-base md:text-lg leading-relaxed text-white">
                      {opt}
                    </div>
                  </button>
                );
              })}
            </div>

            {showResult && (
              <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950/90">
                <div
                  className={`h-1.5 w-full ${
                    selected === q.correct ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />

                <div className="p-6">
                  <p
                    className={`text-2xl font-black mb-3 ${
                      selected === q.correct ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {selected === q.correct ? "Doğru cevap" : "Yanlış cevap"}
                  </p>

                  <p className="text-slate-300 leading-relaxed mb-6">
                    <span className="font-bold text-white">Açıklama:</span> {q.exp}
                  </p>

                  <button
                    onClick={handleNext}
                    className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500 px-6 py-3 text-slate-950 font-black shadow-[0_0_25px_rgba(16,185,129,0.25)] transition hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(34,211,238,0.35)]"
                  >
                    <span>
                      {currentIndex < questions.length - 1
                        ? "Sonraki soru"
                        : "Testi bitir"}
                    </span>
                    <span className="transition group-hover:translate-x-1">→</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}