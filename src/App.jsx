import React, { useMemo, useState, useEffect } from "react";
import './index.css';
import { auth, loginWithGoogle, logout } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

// Veri ve Yardımcı Araçlar
import { QUESTIONS } from "./data/questions";
import {
  buildFullExam,
  analyzeExamResults,
  getEstimatedTusResult,
} from "./utils/examUtils";

// Bileşenler (Screens)
import Dashboard from "./components/Dashboard";
import Suggestions from "./components/Suggestions";
import Summary from "./components/Summary";
import ExamScreen from "./components/ExamScreen";
import ExamAnalysisScreen from "./components/ExamAnalysisScreen";
import StudyScreen from "./components/StudyScreen";
import QuestionSetupScreen from "./components/QuestionSetupScreen";
import ExamSetSelectScreen from "./components/ExamSetSelectScreen";
import TopicTracker from "./components/TopicTracker";

// TUS Deneme Dağılımı (Blueprint)
const FULL_EXAM_BLUEPRINT = {
  Anatomi: 13, Fizyoloji: 15, Biyokimya: 18, Mikrobiyoloji: 18, 
  Patoloji: 18, Farmakoloji: 18, Dahiliye: 23, Pediatri: 25, 
  "Genel Cerrahi": 20, "Kadın Hastalıkları ve Doğum": 10, "Küçük Stajlar": 22,
};

export default function App() {
  // --- 1. KULLANICI VE NAVİGASYON ---
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");

  // --- 2. ÇALIŞMA MODU (STUDY) STATE ---
  const [currentSubject, setCurrentSubject] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [activeQuestions, setActiveQuestions] = useState([]);

  // --- 3. DENEME MODU (EXAM) STATE ---
  const [examQuestions, setExamQuestions] = useState([]);
  const [examIndex, setExamIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState([]);
  const [examSelected, setExamSelected] = useState(null);

  // --- 4. KONU SEÇİM STATE ---
  const [selectedLesson, setSelectedLesson] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  // --- 5. HESAPLANAN VERİLER (MEMO) ---
  const q = activeQuestions[currentIndex];
  const examQ = examQuestions[examIndex];

  const examAnalysis = useMemo(() => {
    if (!examQuestions.length) return null;
    return analyzeExamResults(examQuestions, examAnswers);
  }, [examQuestions, examAnswers]);

  const estimatedTus = useMemo(() => {
    if (!examAnalysis) return null;
    return getEstimatedTusResult(examAnalysis.summary.net);
  }, [examAnalysis]);

  const availableLessons = [...new Set(QUESTIONS.map((item) => item.ders))];
  const availableTopics = selectedLesson
    ? [...new Set(QUESTIONS.filter((item) => item.ders === selectedLesson).map((item) => item.konu))]
    : [];

  // --- 6. FIREBASE AUTH TAKİBİ ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // --- 7. YARDIMCI FONKSİYONLAR ---
  const resetStudyState = () => {
    setCurrentSubject(null); setCurrentIndex(0); setSelected(null);
    setShowResult(false); setScore(0); setActiveQuestions([]);
  };

  const goDashboard = () => { resetStudyState(); setView("dashboard"); };

  const startSubject = (subjectName) => {
    const filtered = QUESTIONS.filter((item) => item.ders === subjectName);
    if (filtered.length === 0) return;
    resetStudyState();
    setCurrentSubject(subjectName);
    setActiveQuestions(filtered);
    setView("study");
  };

  const startTopicTest = () => {
    const filtered = QUESTIONS.filter(item => item.ders === selectedLesson && item.konu === selectedTopic);
    if (filtered.length === 0) { alert("Soru bulunamadı."); return; }
    resetStudyState();
    setCurrentSubject(`${selectedLesson} / ${selectedTopic}`);
    setActiveQuestions(filtered);
    setView("study");
  };

  const startFullExam = () => {
    const exam = buildFullExam(QUESTIONS, FULL_EXAM_BLUEPRINT);
    if (!exam.length) return;
    setExamQuestions(exam);
    setExamAnswers(Array(exam.length).fill(null));
    setExamIndex(0);
    setExamSelected(null);
    setView("exam");
  };

  // --- 8. EVENT HANDLERS ---
  const handleReveal = () => {
    setShowResult(true);
    if (selected !== null && selected === q?.correct) setScore(prev => prev + 1);
  };

  const handleNext = () => {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1); setSelected(null); setShowResult(false);
    } else setView("summary");
  };

  const handleStudyPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1); setSelected(null); setShowResult(false);
    }
  };

  const handleExamNext = () => {
    const updated = [...examAnswers];
    updated[examIndex] = examSelected;
    setExamAnswers(updated);

    if (examIndex < examQuestions.length - 1) {
      setExamIndex(prev => prev + 1);
      setExamSelected(updated[examIndex + 1] ?? null);
    } else setView("examAnalysis");
  };

  // --- 9. GİRİŞ EKRANI (LOGIN) ---
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
        <div className="text-6xl mb-6">🩺</div>
        <h1 className="text-5xl font-black mb-2 text-emerald-400 tracking-tighter">TUSOSKOP</h1>
        <p className="text-slate-400 mb-10 text-center max-w-sm">
          TUS hazırlık sürecini dijital asistanınla yönet. Verilerini bulutta sakla.
        </p>
       <button 
          type="button" // SAYFA YENİLENMESİNİ ENGELLER
          onClick={loginWithGoogle}
          className="flex items-center gap-4 px-8 py-4 bg-white text-slate-900 rounded-3xl font-black shadow-2xl hover:scale-105 transition-transform"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />
          Google ile Giriş Yap
        </button>
      </div>
    );
  }

  // --- 10. ANA YÖNLENDİRME (ROUTING) ---
  switch (view) {
    case "dashboard":
      return <Dashboard setView={setView} startSubject={startSubject} user={user} onLogout={logout} />;
    
    case "questionSetup":
      return (
        <QuestionSetupScreen
          selectedLesson={selectedLesson} setSelectedLesson={setSelectedLesson}
          selectedTopic={selectedTopic} setSelectedTopic={setSelectedTopic}
          availableLessons={availableLessons} availableTopics={availableTopics}
          startTopicTest={startTopicTest} goDashboard={goDashboard}
        />
      );

    case "tracker": return <TopicTracker onBack={goDashboard} />;
    case "suggestions": return <Suggestions goDashboard={goDashboard} />;
    case "summary": return <Summary currentSubject={currentSubject} score={score} total={activeQuestions.length} onRetry={() => {setCurrentIndex(0); setView("study");}} goDashboard={goDashboard} />;
    case "examSetSelect": return <ExamSetSelectScreen onSelectSet={startFullExam} goDashboard={goDashboard} />;
    
    case "exam": 
      return (
        <ExamScreen 
          examQ={examQ} examIndex={examIndex} examQuestions={examQuestions} 
          examAnswers={examAnswers} examSelected={examSelected}
          onJump={(idx) => {
            const updated = [...examAnswers]; updated[examIndex] = examSelected;
            setExamAnswers(updated); setExamIndex(idx); setExamSelected(updated[idx] ?? null);
          }}
          handleExamSelect={setExamSelected} 
          handleExamBlank={() => {
            const updated = [...examAnswers]; updated[examIndex] = null;
            setExamAnswers(updated); handleExamNext();
          }} 
          handleExamNext={handleExamNext} 
          goDashboard={goDashboard} 
        />
      );
      
    case "examAnalysis": 
      return <ExamAnalysisScreen examAnalysis={examAnalysis} estimatedTus={estimatedTus} startFullExam={startFullExam} goDashboard={goDashboard} />;
      
    case "study": 
      return (
        <StudyScreen 
          q={q} index={currentIndex} total={activeQuestions.length} 
          selected={selected} setSelected={setSelected} 
          showAnswer={showResult} revealAnswer={handleReveal} 
          nextQuestion={handleNext} prevQuestion={handleStudyPrev} 
          goDashboard={goDashboard} 
        />
      );
      
    default: return <Dashboard setView={setView} startSubject={startSubject} user={user} onLogout={logout} />;
  }
}