import React, { useMemo, useState, useEffect, useRef } from "react";
import './index.css';
import { auth, db, loginWithGoogle, logout } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

// Veri ve Yardımcı Araçlar
import { QUESTIONS } from "./data/questions";
import { EXAM_SETS } from "./data/exams";
import {
  buildFullExam,
  scaleBlueprintToTotal,
  analyzeExamResults,
  getEstimatedTusResult,
  getSelectedAnswerIndex,
} from "./utils/examUtils";
import { updateStreak } from "./services/streakService";
import { isIOS } from "./utils/device";
import { accentThemes, getRandomAccentTheme } from "./theme/accentThemes";
import {
  identifyClarityUser,
  setClarityTag,
  trackClarityEvent,
} from "./lib/clarity";
import {
  addWrongQuestion,
  getFavoriteQuestions,
  getWrongQuestions,
  toggleFavoriteQuestion,
  updateWrongQuestionAfterReview,
} from "./services/studyCollectionService";

// Bileşenler (Screens)
import Dashboard from "./components/Dashboard";
import Suggestions from "./components/Suggestions";
import Summary from "./components/Summary";
import ExamScreen from "./components/ExamScreen";
import ExamAnalysisScreen from "./components/ExamAnalysisScreen";
import StudyScreen from "./components/StudyScreen";
import StudyCollectionScreen from "./components/StudyCollectionScreen";
import ReviewSummaryScreen from "./components/ReviewSummaryScreen";
import QuestionSetupScreen from "./components/QuestionSetupScreen";
import ExamSetSelectScreen from "./components/ExamSetSelectScreen";
import TopicTracker from "./components/TopicTracker";
import MobileBottomNav from "./components/MobileBottomNav";
import IOSInstallBanner from "./components/IOSInstallBanner";

// TUS Deneme Dağılımı (Blueprint)
const FULL_EXAM_BLUEPRINT = {
  Anatomi: 13, Fizyoloji: 15, Biyokimya: 18, Mikrobiyoloji: 18, 
  Patoloji: 18, Farmakoloji: 18, Dahiliye: 23, Pediatri: 25, 
  "Genel Cerrahi": 20, "Kadın Hastalıkları ve Doğum": 10, "Küçük Stajlar": 22,
};

// Alt navigasyon barının görüneceği view'lar
const BOTTOM_NAV_VIEWS = new Set([
  "dashboard",
  "examSetSelect",
  "questionSetup",
  "studyCollection",
  "tracker",
]);
const QUESTION_HISTORY_KEY = "tusoskop-question-history";
const isReactEventOrDomNode = (value) =>
  Boolean(
    value &&
      typeof value === "object" &&
      (value.nativeEvent ||
        value.currentTarget ||
        value.target ||
        value.nodeType ||
        value.__reactFiber)
  );

const normalizeAnswerValue = (value) => {
  if (value === null || value === undefined) return null;
  if (isReactEventOrDomNode(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function App() {
  // iOS tespiti — ilk render'da hesapla, değişmez
  const [iosDevice] = useState(() => isIOS());

  // --- 1. KULLANICI VE NAVİGASYON ---
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [accentThemeKey, setAccentThemeKey] = useState(() => {
    if (typeof window === "undefined") return "emerald";
    const localKey = localStorage.getItem("tusoskop-accent-theme-preference");
    if (localKey && accentThemes[localKey]) return localKey;
    const sessionKey = sessionStorage.getItem("tusoskop-accent-theme");
    if (sessionKey && accentThemes[sessionKey]) return sessionKey;
    const randomKey = getRandomAccentTheme();
    sessionStorage.setItem("tusoskop-accent-theme", randomKey);
    return randomKey;
  });
  const accentTheme = accentThemes[accentThemeKey] || accentThemes.emerald;

  const handleAccentThemeChange = (themeKey) => {
    if (!accentThemes[themeKey]) return;
    setAccentThemeKey(themeKey);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("tusoskop-accent-theme", themeKey);
      localStorage.setItem("tusoskop-accent-theme-preference", themeKey);
    }
  };

  // --- 2. ÇALIŞMA MODU (STUDY) STATE ---
  const [currentSubject, setCurrentSubject] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [studyMode, setStudyMode] = useState("study");
  const [activeTopicSubject, setActiveTopicSubject] = useState("");
  const [activeTopicName, setActiveTopicName] = useState("");
  const [flowMode, setFlowMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("tusoskop-flow-mode") === "true";
  });
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("tusoskop-best-streak") || 0);
  });
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionTimes, setQuestionTimes] = useState({});
  const [studyFeedback, setStudyFeedback] = useState(null);
  const [topicMastery, setTopicMastery] = useState({});
  const [feedbackMeta, setFeedbackMeta] = useState({ count: 0, lastText: "", lastType: "", lastTopic: "" });
  const [favoriteQuestionIds, setFavoriteQuestionIds] = useState(new Set());
  const [favoriteFeedback, setFavoriteFeedback] = useState("");
  const [reviewSummary, setReviewSummary] = useState(null);

  // --- 3. DENEME MODU (EXAM) STATE ---
  const [examQuestions, setExamQuestions] = useState([]);
  const [examIndex, setExamIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState({});
  const [examSelected, setExamSelected] = useState(null);
  const [selectedExamSet, setSelectedExamSet] = useState(null);
  const examAnswersRef = useRef({});

  // --- 4. KONU SEÇİM STATE ---
  const [selectedLesson, setSelectedLesson] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  // --- 5. HESAPLANAN VERİLER (MEMO) ---
  const q = activeQuestions[currentIndex];
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tusoskop-flow-mode", String(flowMode));
    }
  }, [flowMode]);

  useEffect(() => {
    if (view === "study") {
      setQuestionStartTime(Date.now());
    }
  }, [view, currentIndex]);

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

  useEffect(() => {
    if (user?.uid) {
      identifyClarityUser(user.uid);
    }
  }, [user?.uid]);

  useEffect(() => {
    let active = true;
    const loadFavorites = async () => {
      const list = await getFavoriteQuestions(user);
      if (!active) return;
      setFavoriteQuestionIds(new Set(list.map((item) => Number(item.questionId))));
    };
    loadFavorites();
    return () => {
      active = false;
    };
  }, [user?.uid]);

  // --- 7. YARDIMCI FONKSİYONLAR ---
  const resetStudyState = () => {
    setCurrentSubject(null); setCurrentIndex(0); setSelected(null);
    setShowResult(false); setScore(0); setActiveQuestions([]);
    setStudyMode("study");
    setActiveTopicSubject("");
    setActiveTopicName("");
    setIsAutoAdvancing(false);
    setStreak(0);
    setQuestionTimes({});
    setStudyFeedback(null);
    setTopicMastery({});
    setFeedbackMeta({ count: 0, lastText: "", lastType: "", lastTopic: "" });
  };

  const goDashboard = () => { resetStudyState(); setView("dashboard"); };

  const showFavoriteToast = (text) => {
    setFavoriteFeedback(text);
    setTimeout(() => setFavoriteFeedback(""), 1400);
  };

  const handleToggleFavorite = async (question) => {
    if (!question?.id) return;
    console.log("FAVORITE BUTTON CLICKED", {
      questionId: question?.id,
      userUid: user?.uid,
      isFavorite: favoriteQuestionIds.has(Number(question?.id)),
    });
    const result = await toggleFavoriteQuestion(user, question);
    console.log("FAVORITE TOGGLE RESULT", {
      questionId: question?.id,
      userUid: user?.uid,
      result,
    });
    setFavoriteQuestionIds((prev) => {
      const next = new Set(prev);
      if (result?.isFavorite) next.add(Number(question.id));
      else next.delete(Number(question.id));
      return next;
    });
    showFavoriteToast(result?.isFavorite ? "Favorilere eklendi" : "Favorilerden çıkarıldı");
  };

  const startReviewWithQuestions = (questionList, source = "custom") => {
    const list = Array.isArray(questionList) ? questionList.filter(Boolean) : [];
    if (!list.length) return;
    resetStudyState();
    setStudyMode("review");
    setCurrentSubject("Çalışma Alanım Tekrarı");
    setActiveTopicSubject("Çalışma Alanım");
    setActiveTopicName(source);
    setActiveQuestions(list);
    setView("study");
    setClarityTag("son_mod", "review");
    trackClarityEvent("bugunku_tekrar_baslatildi");
  };

  const startSubject = (subjectName) => {
    const filtered = QUESTIONS.filter((item) => item.ders === subjectName);
    if (filtered.length === 0) return;
    trackClarityEvent("ders_karti_tiklandi");
    setClarityTag("son_ders", subjectName);
    resetStudyState();
    setStudyMode("study");
    setCurrentSubject(subjectName);
    setActiveQuestions(filtered);
    setView("study");
  };

  const startTopicTest = () => {
    const filtered = QUESTIONS.filter(item => item.ders === selectedLesson && item.konu === selectedTopic);
    if (filtered.length === 0) { alert("Soru bulunamadı."); return; }
    trackClarityEvent("konu_testi_baslatildi");
    setClarityTag("son_ders", selectedLesson);
    setClarityTag("son_konu", selectedTopic);
    setClarityTag("son_mod", "konu_testi");
    resetStudyState();
    setStudyMode("topic");
    setActiveTopicSubject(selectedLesson);
    setActiveTopicName(selectedTopic);
    setCurrentSubject(`${selectedLesson} / ${selectedTopic}`);
    setActiveQuestions(filtered);
    setView("study");
  };

  const startFullExam = (setId) => {
    const fallbackSet = EXAM_SETS[0] || null;
    const activeSet =
      EXAM_SETS.find((item) => item.id === setId) ||
      selectedExamSet ||
      fallbackSet;

    const totalQuestions = activeSet?.questionCount || 200;
    const scaledBlueprint = scaleBlueprintToTotal(FULL_EXAM_BLUEPRINT, totalQuestions);
    const exam = buildFullExam(QUESTIONS, scaledBlueprint);
    if (!exam.length) return;
    trackClarityEvent("deneme_baslatildi");
    setClarityTag("son_mod", "deneme");
    setSelectedExamSet(activeSet);
    setExamQuestions(exam);
    examAnswersRef.current = {};
    setExamAnswers({});
    setExamIndex(0);
    setExamSelected(null);
    setView("exam");
  };

  // --- 8. EVENT HANDLERS ---
  const handleReveal = async () => {
    await revealCurrentAnswer(selected);
  };

  const getTimeMetrics = () => {
    const numericTimes = Object.entries(questionTimes)
      .filter(([key, value]) => !String(key).startsWith("q-") && Number.isFinite(value))
      .map(([, value]) => Number(value));

    if (!numericTimes.length) {
      return { avgTime: 0, fastest: 0, slowest: 0, answeredCount: 0 };
    }

    return {
      avgTime: Math.round(numericTimes.reduce((sum, sec) => sum + sec, 0) / numericTimes.length),
      fastest: Math.min(...numericTimes),
      slowest: Math.max(...numericTimes),
      answeredCount: numericTimes.length,
    };
  };

  const persistStudySessionMetrics = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const { avgTime, fastest, slowest, answeredCount } = getTimeMetrics();
      await addDoc(collection(db, "studySessions"), {
        userId: currentUser.uid,
        subject: currentSubject || "Genel",
        totalQuestions: activeQuestions.length,
        score,
        streak,
        bestStreak,
        flowMode,
        timing: { avgTime, fastest, slowest, answeredCount },
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Study session metrics save error:", error);
    }
  };

  const getDifficultyLabel = (diff) => {
    const map = { 1: "Kolay", 2: "Orta", 3: "Orta-zor", 4: "Zor", 5: "Seçici" };
    return map[diff] || "Orta";
  };

  const pickDifferentMessage = (messages, fallback) => {
    const candidates = messages.filter((m) => m !== feedbackMeta.lastText);
    const pool = candidates.length ? candidates : messages;
    return pool[Math.floor(Math.random() * pool.length)] || fallback;
  };

  const shouldShowFeedback = (type, question) => {
    // Critical moments are always shown.
    if (type === "blank") return true;
    if ((question?.diff || 0) >= 4) return true;
    if (streak === 0 || streak % 3 === 0) return true;
    // Otherwise reduce frequency: show every 2nd-3rd interaction.
    return (feedbackMeta.count + 1) % 3 === 0;
  };

  const getFeedbackMessage = (question, answer) => {
    const level = getDifficultyLabel(question?.diff);
    const topic = question?.konu || "";
    const type =
      answer === null || answer === undefined
        ? "blank"
        : answer === question?.correct
        ? "correct"
        : "wrong";

    if (!shouldShowFeedback(type, question)) {
      return null;
    }

    if (type === "blank") {
      const text = pickDifferentMessage(
        [
          "Boş bırakıldı. Bu soruyu tekrar listesine eklemek mantıklı.",
          "Bu soru boş geçti; dönüşte kısa bir tekrar iyi çalışır.",
          "Boş bıraktın, sorun değil. Bunu tekrar turuna almak faydalı olur.",
        ],
        "Boş bırakıldı. Bu soruyu tekrar listesine eklemek mantıklı."
      );
      return { type, text };
    }

    if (type === "correct") {
      const topicAware =
        feedbackMeta.lastTopic && feedbackMeta.lastTopic === topic
          ? [
              `${topic} tarafında çizgiyi korudun, çok iyi gidiyorsun.`,
              `${topic} sorularında ritmi yakaladın.`,
              `${topic} için net bir okuma yaptın, devam.`,
            ]
          : [];
      const text = pickDifferentMessage(
        [
          ...topicAware,
          `İyi yakaladın. Bu soru ${level.toLowerCase()} seviyedeydi.`,
          `Temiz cevap. ${level} düzeyindeki bu soruda doğru çizgide kaldın.`,
          `Güzel okuma. ${level} seviyesinde iyi karar verdin.`,
        ],
        `İyi yakaladın. Bu soru ${level.toLowerCase()} seviyedeydi.`
      );
      return { type, text };
    }

    const topicAwareWrong =
      feedbackMeta.lastTopic && feedbackMeta.lastTopic === topic
        ? [
            `${topic} tarafı seçici olabilir; kısa bir konu dönüşü iyi gelir.`,
            `${topic} sorularında küçük bir tekrar net fark yaratır.`,
            `${topic} içinde benzer çeldiriciler var, sakin tempo iyi gider.`,
          ]
        : [];
    const text = pickDifferentMessage(
      [
        ...topicAwareWrong,
        "Burada takılman normal. Bu konu TUS'ta sık çeldirir.",
        "Bu tip sorular seçici olur; kısa bir tekrar büyük fark yaratır.",
        "Çeldirici bir nokta. Konunun ana ayrımını tekrar etmek iyi olur.",
      ],
      "Burada takılman normal. Bu konu TUS'ta sık çeldirir."
    );
    return { type, text };
  };

  const recordQuestionTime = (questionId) => {
    if (!questionId) return;
    setQuestionTimes((prev) => {
      if (prev[questionId]) return prev;
      const elapsedSeconds = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));
      return { ...prev, [questionId]: elapsedSeconds };
    });
  };

  const updateStreakForQuestion = (isCorrect, questionId) => {
    if (!questionId) return;
    const key = `q-${questionId}`;
    setQuestionTimes((prev) => {
      if (prev[key] !== undefined) return prev;
      setStreak((prevStreak) => {
        if (isCorrect) {
          const next = prevStreak + 1;
          if (next > bestStreak) {
            setBestStreak(next);
            if (typeof window !== "undefined") {
              localStorage.setItem("tusoskop-best-streak", String(next));
            }
          }
          return next;
        }
        return 0;
      });
      return { ...prev, [key]: isCorrect ? 1 : 0 };
    });
  };

  const revealCurrentAnswer = async (answerOverride = selected) => {
    setShowResult(true);
    const answer = answerOverride;
    const isCorrect = answer !== null && answer !== undefined && answer === q?.correct;
    const isWrong =
      answer !== null &&
      answer !== undefined &&
      Number(answer) !== Number(q?.correct);
    console.log("STUDY ANSWER CHECK", {
      questionId: q?.id,
      selectedAnswer: answer,
      correctAnswer: q?.correct,
      isCorrect,
      isWrong,
      studyMode,
    });
    if (isCorrect) setScore((prev) => prev + 1);
    updateStreakForQuestion(isCorrect, q?.id);
    recordQuestionTime(q?.id);
    const feedback = getFeedbackMessage(q, answer);
    setStudyFeedback(feedback);
    setFeedbackMeta((prev) => ({
      count: prev.count + 1,
      lastText: feedback?.text || prev.lastText,
      lastType: feedback?.type || prev.lastType,
      lastTopic: q?.konu || prev.lastTopic,
    }));
    if (q?.konu) {
      setTopicMastery((prev) => {
        const current = prev[q.konu] || { seen: 0, correct: 0 };
        return {
          ...prev,
          [q.konu]: {
            seen: current.seen + 1,
            correct: current.correct + (isCorrect ? 1 : 0),
          },
        };
      });
    }
    recordHistoryForQuestion({
      question: q,
      selectedOption: answer,
      mode: studyMode === "topic" ? "topic" : studyMode === "review" ? "review" : "study",
    });
    if (user) updateStreak(user.uid);
    if (studyMode === "review") {
      if (answer !== null && answer !== undefined && q?.id) {
        await updateWrongQuestionAfterReview(user, q, isCorrect, answer);
      }
    } else if (isWrong && q?.id) {
      await addWrongQuestion(user, q, answer);
    }
  };

  const getSocialProof = (question) => {
    const wrongRateByDiff = { 1: 28, 2: 41, 3: 56, 4: 68, 5: 79 };
    const wrongRate = wrongRateByDiff[question?.diff] ?? 52;
    const label =
      wrongRate >= 70 ? "Seçici soru" : wrongRate >= 55 ? "Sık zorlanılan soru" : "Dengeli zorluk";
    return { wrongRate, label };
  };

  const getMasteryLevel = (topic) => {
    const stats = topicMastery[topic] || { seen: 0, correct: 0 };
    const accuracy = stats.seen ? Math.round((stats.correct / stats.seen) * 100) : 0;
    const level = accuracy >= 85 ? "Ustalık" : accuracy >= 70 ? "Oturma" : accuracy >= 50 ? "Isınma" : "Başlangıç";
    const progress = Math.max(8, Math.min(100, accuracy || 8));
    return { ...stats, accuracy, level, progress };
  };

  const saveQuestionHistory = (entry) => {
    if (typeof window === "undefined" || !entry?.questionId) return;
    try {
      const safeEntry = {
        questionId: Number(entry.questionId),
        ders: String(entry.ders || ""),
        konu: String(entry.konu || ""),
        selected: normalizeAnswerValue(entry.selected),
        correct: Number(entry.correct),
        isCorrect: Boolean(entry.isCorrect),
        mode: String(entry.mode || "exam"),
        answeredAt: String(entry.answeredAt || new Date().toISOString()),
      };
      if (!Number.isFinite(safeEntry.questionId) || !Number.isFinite(safeEntry.correct)) {
        console.error("Question history save skipped: invalid numeric fields", entry);
        return;
      }
      const raw = localStorage.getItem(QUESTION_HISTORY_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const next = [...list.filter((item) => item.questionId !== safeEntry.questionId), safeEntry];
      localStorage.setItem(QUESTION_HISTORY_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Question history save error:", error);
    }
  };

  const recordHistoryForQuestion = ({ question, selectedOption, mode }) => {
    if (!question?.id) return;
    if (isReactEventOrDomNode(selectedOption)) {
      console.error("Invalid selected answer: React event/DOM node received", selectedOption);
    }
    const normalizedSelected = normalizeAnswerValue(selectedOption);
    const normalizedCorrect = Number(question.correct);
    saveQuestionHistory({
      questionId: Number(question.id),
      ders: String(question.ders || ""),
      konu: String(question.konu || ""),
      selected: normalizedSelected,
      correct: normalizedCorrect,
      isCorrect:
        normalizedSelected !== null &&
        Number.isFinite(normalizedCorrect) &&
        normalizedSelected === normalizedCorrect,
      mode: mode || "exam",
      answeredAt: new Date().toISOString(),
    });
  };

  const handleStudySelect = (optionIndex) => {
    setSelected(optionIndex);
    if (!flowMode || showResult || isAutoAdvancing) return;
    revealCurrentAnswer(optionIndex);
    if (currentIndex >= activeQuestions.length - 1) return;
    setIsAutoAdvancing(true);
    setTimeout(() => {
      setIsAutoAdvancing(false);
      handleNext();
    }, 700);
  };

  const handleNext = async () => {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1); setSelected(null); setShowResult(false);
      setStudyFeedback(null);
    } else {
      if (studyMode === "review") {
        const wrongRecords = await getWrongQuestions(user);
        const activeIds = new Set(activeQuestions.map((item) => Number(item.id)));
        const stillNeedsReview = wrongRecords.filter(
          (item) => activeIds.has(Number(item.questionId)) && !item.isResolved
        ).length;
        setReviewSummary({
          total: activeQuestions.length,
          correct: score,
          wrong: Math.max(0, activeQuestions.length - score),
          stillNeedsReview,
        });
        trackClarityEvent("tekrar_tamamlandi");
        resetStudyState();
        setView("reviewSummary");
        return;
      }
      persistStudySessionMetrics();
      setView("summary");
    }
  };

  const handleStudyPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1); setSelected(null); setShowResult(false);
    }
  };

  const saveExamAnswer = (questionId, selectedIndex) => {
    if (questionId === undefined || questionId === null) return;
    examAnswersRef.current = { ...examAnswersRef.current, [questionId]: selectedIndex };
    setExamAnswers(examAnswersRef.current);
  };

  const saveExamBlank = (questionId) => {
    saveExamAnswer(questionId, null);
  };

  const handleExamNext = (selectedOverride) => {
    const safeOverride = isReactEventOrDomNode(selectedOverride) ? undefined : selectedOverride;
    const currentQuestion = examQuestions[examIndex];
    if (!currentQuestion?.id) return;
    const persistedAnswer = getSelectedAnswerIndex(examAnswersRef.current, currentQuestion, examIndex);
    const currentAnswer =
      safeOverride !== undefined
        ? safeOverride
        : (persistedAnswer ?? examSelected ?? null);
    saveExamAnswer(currentQuestion.id, currentAnswer);
    const latestAnswers = examAnswersRef.current;
    recordHistoryForQuestion({
      question: currentQuestion,
      selectedOption: latestAnswers[currentQuestion.id],
      mode: "exam",
    });

    if (examIndex < examQuestions.length - 1) {
      setExamIndex(prev => prev + 1);
      const nextQuestion = examQuestions[examIndex + 1];
      setExamSelected(nextQuestion?.id ? (getSelectedAnswerIndex(latestAnswers, nextQuestion, examIndex + 1) ?? null) : null);
    } else setView("examAnalysis");
  };

  const handleExamSelect = (optionIndex) => {
    const currentQuestion = examQuestions[examIndex];
    if (!currentQuestion?.id) return;
    saveExamAnswer(currentQuestion.id, optionIndex);
    setExamSelected(optionIndex);
  };

  const handleExamSelectForQuestion = (questionIdx, letterIdx) => {
    const question = examQuestions[questionIdx];
    if (!question?.id) return;
    saveExamAnswer(question.id, letterIdx);
    setExamIndex(questionIdx);
    setExamSelected(letterIdx);
  };

  const topicProgress = useMemo(() => {
    if (studyMode !== "topic" || !activeTopicSubject || !activeTopicName || !q) return null;
    const totalQuestions = activeQuestions.length;
    if (!totalQuestions) return null;
    return {
      ders: activeTopicSubject,
      konu: activeTopicName,
      current: Math.min(currentIndex + 1, totalQuestions),
      total: totalQuestions,
    };
  }, [studyMode, activeTopicSubject, activeTopicName, q, activeQuestions.length, currentIndex]);

  // --- 9. GİRİŞ EKRANI (LOGIN) ---
  if (!user) {
    return (
      <div className={`app-shell safe-screen ${iosDevice ? "ios-device" : ""}`}>
        <div
          className="flex flex-col items-center justify-center bg-slate-950 text-white p-6 min-h-dvh"
          style={{ paddingTop: "calc(2rem + env(safe-area-inset-top))" }}
        >
          <div className="text-6xl mb-6">🩺</div>
          <h1 className={`text-5xl font-black mb-2 ${accentTheme.text} tracking-tighter`}>TUSOSKOP</h1>
          <p className="text-slate-400 mb-10 text-center max-w-sm">
            TUS hazırlık sürecini dijital asistanınla yönet. Verilerini bulutta sakla.
          </p>
          <button
            type="button"
            onClick={loginWithGoogle}
            className={`flex items-center gap-4 px-8 py-4 ${accentTheme.primary} ${accentTheme.primaryHover} text-slate-950 rounded-3xl font-black shadow-2xl ${accentTheme.glow} hover:scale-105 transition-transform active:scale-95`}
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />
            Google ile Giriş Yap
          </button>
        </div>
        <IOSInstallBanner />
      </div>
    );
  }

  // --- 10. ANA YÖNLENDİRME (ROUTING) ---
  const showBottomNav = BOTTOM_NAV_VIEWS.has(view);
  let screenContent;
  switch (view) {
    case "dashboard":
      screenContent = (
        <Dashboard
          setView={setView}
          startSubject={startSubject}
          user={user}
          onLogout={logout}
          accentTheme={accentTheme}
          accentThemeKey={accentThemeKey}
          onAccentThemeChange={handleAccentThemeChange}
          currentView={view}
        />
      );
      break;

    case "questionSetup":
      screenContent = (
        <QuestionSetupScreen
          selectedLesson={selectedLesson} setSelectedLesson={setSelectedLesson}
          selectedTopic={selectedTopic} setSelectedTopic={setSelectedTopic}
          availableLessons={availableLessons} availableTopics={availableTopics}
          startTopicTest={startTopicTest} goDashboard={goDashboard}
        />
      );
      break;

    case "tracker":
      screenContent = <TopicTracker onBack={goDashboard} />;
      break;

    case "suggestions":
      screenContent = <Suggestions goDashboard={goDashboard} />;
      break;

    case "summary":
      screenContent = (
        <Summary
          currentSubject={currentSubject} score={score} total={activeQuestions.length}
          questionTimes={questionTimes}
          onRetry={() => { setCurrentIndex(0); setView("study"); }}
          goDashboard={goDashboard}
        />
      );
      break;

    case "examSetSelect":
      screenContent = <ExamSetSelectScreen onSelectSet={startFullExam} goDashboard={goDashboard} />;
      break;

    case "exam":
      screenContent = (
        <ExamScreen
          examQ={examQ} examIndex={examIndex} examQuestions={examQuestions}
          examAnswers={examAnswers} examSelected={examSelected}
          examTitle={selectedExamSet?.title || "TUS Genel Deneme"}
          accentTheme={accentTheme}
          userId={user?.uid}
          getExamAnswersSnapshot={() => examAnswersRef.current}
          onJump={(idx) => {
            const currentQuestion = examQuestions[examIndex];
            const latestAnswers = examAnswersRef.current;
            recordHistoryForQuestion({
              question: currentQuestion,
              selectedOption: currentQuestion?.id ? (getSelectedAnswerIndex(latestAnswers, currentQuestion, examIndex) ?? null) : null,
              mode: "exam",
            });
            const nextQuestion = examQuestions[idx];
            setExamAnswers(latestAnswers); setExamIndex(idx); setExamSelected(nextQuestion?.id ? (getSelectedAnswerIndex(latestAnswers, nextQuestion, idx) ?? null) : null);
          }}
          handleExamSelect={handleExamSelect}
          handleExamSelectForQuestion={handleExamSelectForQuestion}
          handleExamBlank={() => {
            const currentQuestion = examQuestions[examIndex];
            if (!currentQuestion?.id) return;
            saveExamBlank(currentQuestion.id);
            setExamSelected(null);
            handleExamNext(null);
          }}
          handleExamNext={handleExamNext}
          goDashboard={goDashboard}
        />
      );
      break;

    case "examAnalysis":
      screenContent = (
        <ExamAnalysisScreen
          examAnalysis={examAnalysis} estimatedTus={estimatedTus}
          accentTheme={accentTheme}
          startFullExam={startFullExam} goDashboard={goDashboard}
        />
      );
      break;

    case "study":
      screenContent = (
        <StudyScreen
          q={q} index={currentIndex} total={activeQuestions.length}
          selected={selected} setSelected={handleStudySelect}
          showAnswer={showResult} revealAnswer={handleReveal}
          nextQuestion={handleNext} prevQuestion={handleStudyPrev}
          flowMode={flowMode}
          setFlowMode={setFlowMode}
          streak={streak}
          bestStreak={bestStreak}
          feedback={studyFeedback}
          isAutoAdvancing={isAutoAdvancing}
          socialProof={getSocialProof(q)}
          mastery={getMasteryLevel(q?.konu)}
          topicProgress={topicProgress}
          accentTheme={accentTheme}
          isFavorite={favoriteQuestionIds.has(Number(q?.id))}
          onToggleFavorite={handleToggleFavorite}
          favoriteFeedback={favoriteFeedback}
          goDashboard={goDashboard}
        />
      );
      break;

    case "studyCollection":
      screenContent = (
        <StudyCollectionScreen
          user={user}
          questions={QUESTIONS}
          accentTheme={accentTheme}
          accentThemeKey={accentThemeKey}
          goDashboard={goDashboard}
          openExamSetSelect={() => setView("examSetSelect")}
          startReviewWithQuestions={startReviewWithQuestions}
        />
      );
      break;

    case "reviewSummary":
      screenContent = (
        <ReviewSummaryScreen
          summary={reviewSummary}
          accentTheme={accentTheme}
          goStudyCollection={() => setView("studyCollection")}
        />
      );
      break;

    default:
      screenContent = (
        <Dashboard
          setView={setView}
          startSubject={startSubject}
          user={user}
          onLogout={logout}
          accentTheme={accentTheme}
          accentThemeKey={accentThemeKey}
          onAccentThemeChange={handleAccentThemeChange}
          currentView={view}
        />
      );
  }

  return (
    <div className={`app-shell safe-screen ${iosDevice ? "ios-device" : ""}`}>
      {screenContent}
      {showBottomNav && (
        <MobileBottomNav currentView={view} setView={setView} accentTheme={accentTheme} />
      )}
      <IOSInstallBanner />
    </div>
  );
}