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
//import Dashboard from "./components/screens/Dashboard";
import ExamScreen from "./components/ExamScreen";
import ExamAnalysisScreen from "./components/ExamAnalysisScreen";
import StudyScreen from "./components/StudyScreen";
import QuestionSetupScreen from "./components/QuestionSetupScreen";
import ExamSetSelectScreen from "./components/ExamSetSelectScreen";

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
  
  const handleSelectExamSet = (setKey) => {
  console.log("Seçilen deneme seti:", setKey);
  startFullExam();
};

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
    const startTopicTest = () => {
  console.log("startTopicTest çalıştı");
  console.log("selectedLesson:", selectedLesson);
  console.log("selectedTopic:", selectedTopic);

  // mevcut kodların altı...
};

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
                  onClick={() => setView("examSetSelect")}
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
    <QuestionSetupScreen
      selectedLesson={selectedLesson}
      setSelectedLesson={setSelectedLesson}
      selectedTopic={selectedTopic}
      setSelectedTopic={setSelectedTopic}
      availableLessons={availableLessons}
      availableTopics={availableTopics}
      startTopicTest={startTopicTest}
      goDashboard={goDashboard}
    />
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
  if (view === "examSetSelect") {
  return (
    <ExamSetSelectScreen
      onSelectSet={handleSelectExamSet}
      goDashboard={goDashboard}
    />
  );
}
if (view === "exam") {
  return (
    <ExamScreen
      examQ={examQ}
      examIndex={examIndex}
      examQuestions={examQuestions}
      examSelected={examSelected}
      handleExamSelect={handleExamSelect}
      handleExamBlank={handleExamBlank}
      handleExamNext={handleExamNext}
      goDashboard={goDashboard}
    />
  );
}
  
 if (view === "examAnalysis" && examAnalysis) {
  return (
    <ExamAnalysisScreen
      examAnalysis={examAnalysis}
      estimatedTus={estimatedTus}
      startFullExam={startFullExam}
      goDashboard={goDashboard}
    />
  );
}
if (view === "study") {
  return (
    <StudyScreen
      q={q}
      index={currentIndex}
      total={questions.length}
      selected={selected}
      setSelected={setSelected}
      showAnswer={showResult}
      setShowAnswer={setShowResult}
      nextQuestion={handleNext}
      prevQuestion={() => {}}
      goDashboard={goDashboard}
    />
  );
}
}