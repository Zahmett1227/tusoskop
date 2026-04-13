import React, { useMemo, useState } from "react";
import { QUESTIONS } from "./data/questions";
import {
  buildFullExam,
  analyzeExamResults,
  getEstimatedTusResult,
} from "./utils/examUtils";

// Tüm sayfalarımızı dışarıdan tertemiz içeri alıyoruz
import Dashboard from "./components/Dashboard";
import Suggestions from "./components/Suggestions";
import Summary from "./components/Summary";
import ExamScreen from "./components/ExamScreen";
import ExamAnalysisScreen from "./components/ExamAnalysisScreen";
import StudyScreen from "./components/StudyScreen";
import QuestionSetupScreen from "./components/QuestionSetupScreen";
import ExamSetSelectScreen from "./components/ExamSetSelectScreen";
import TopicTracker from "./components/TopicTracker";

const FULL_EXAM_BLUEPRINT = {
  Anatomi: 13, Fizyoloji: 15, Biyokimya: 18, Mikrobiyoloji: 18, 
  Patoloji: 18, Farmakoloji: 18, Dahiliye: 23, Pediatri: 25, 
  "Genel Cerrahi": 20, "Kadın Hastalıkları ve Doğum": 10, "Küçük Stajlar": 22,
};

export default function App() {
  const [view, setView] = useState("dashboard");
  const [currentSubject, setCurrentSubject] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [examQuestions, setExamQuestions] = useState([]);
  const [examIndex, setExamIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState([]);
  const [examSelected, setExamSelected] = useState(null);

  const questions = activeQuestions;
  const q = questions[currentIndex];
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

  const resetStudyState = () => {
    setCurrentSubject(null); setCurrentIndex(0); setSelected(null);
    setShowResult(false); setScore(0); setSelectedLesson("");
    setSelectedTopic(""); setActiveQuestions([]);
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

  const handleReveal = () => {
    setShowResult(true);
    if (selected !== null && selected === q?.correct) setScore(prev => prev + 1);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1); setSelected(null); setShowResult(false);
    } else setView("summary");
  };

  const handleStudyPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1); setSelected(null); setShowResult(false);
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

  // --- SAYFA YÖNLENDİRME (ROUTING) ---
  switch (view) {
    case "dashboard":
      return <Dashboard setView={setView} startSubject={startSubject} />;
    
    case "questionSetup":
      return (
        <QuestionSetupScreen
          selectedLesson={selectedLesson} setSelectedLesson={setSelectedLesson}
          selectedTopic={selectedTopic} setSelectedTopic={setSelectedTopic}
          availableLessons={availableLessons} availableTopics={availableTopics}
          startTopicTest={startTopicTest} goDashboard={goDashboard}
        />
      );

    case "tracker": 
      return <TopicTracker onBack={goDashboard} />;
      
    case "suggestions": 
      return <Suggestions goDashboard={goDashboard} />;
      
    case "summary": 
      return (
        <Summary 
          currentSubject={currentSubject} 
          score={score} 
          total={questions.length} 
          onRetry={() => {setCurrentIndex(0); setView("study");}} 
          goDashboard={goDashboard} 
        />
      );
      
    case "examSetSelect": 
      return <ExamSetSelectScreen onSelectSet={startFullExam} goDashboard={goDashboard} />;
      
    case "exam": 
      return (
        <ExamScreen 
          examQ={examQ} 
          examIndex={examIndex} 
          examQuestions={examQuestions} 
          examAnswers={examAnswers} // Tüm cevapları optiğe gönderiyoruz
          examSelected={examSelected}
          // Soru atlama fonksiyonu
          onJump={(targetIndex) => {
            const updated = [...examAnswers];
            updated[examIndex] = examSelected;
            setExamAnswers(updated);
            setExamIndex(targetIndex);
            setExamSelected(updated[targetIndex] ?? null);
          }}
          handleExamSelect={handleExamSelect} 
          handleExamBlank={handleExamBlank} 
          handleExamNext={handleExamNext} 
          goDashboard={goDashboard} 
        />
      
      );
      
    case "examAnalysis": 
      return (
        <ExamAnalysisScreen 
          examAnalysis={examAnalysis} estimatedTus={estimatedTus} 
          startFullExam={startFullExam} goDashboard={goDashboard} 
        />
      );
      
    case "study": 
      return (
        <StudyScreen 
          q={q} index={currentIndex} total={questions.length} 
          selected={selected} setSelected={setSelected} 
          showAnswer={showResult} revealAnswer={handleReveal} 
          nextQuestion={handleNext} prevQuestion={handleStudyPrev} 
          goDashboard={goDashboard} 
        />
      );
      
    default: 
      return <Dashboard setView={setView} startSubject={startSubject} />;
  }
}