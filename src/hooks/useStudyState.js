import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { trackClarityEvent } from "../lib/clarity";
import { FREE_LIMITS } from "../config/limits";
import { isUserPremium } from "../utils/premiumUtils";
import {
  canAnswerQuestion,
  canStartReview,
  incrementQuestionUsage,
  incrementReviewUsage,
} from "../services/usageLimitService";
import { updateStreak } from "../services/streakService";
import {
  addWrongQuestion,
  getWrongQuestions,
  toggleFavoriteQuestion,
  updateWrongQuestionAfterReview,
} from "../services/studyCollectionService";
import {
  upsertSmartReview,
  updateSmartReviewFromAnswer,
} from "../services/smartReviewService";
import {
  isGuestLimitReached,
  recordGuestAnswer,
} from "../services/guestModeService";
import { isReactEventOrDomNode, normalizeAnswerValue } from "../utils/examUtils";
import { recordQuestionHistory } from "../services/questionHistoryService";
import { submitQuestionScoreEvent, submitDailyBonusEvent } from "../services/leaderboardService";
import { getCurrentWeekId } from "../utils/weekIdUtils";
import { EVENT_TYPES } from "../utils/leaderboardScoreUtils";

/**
 * Çalışma / tekrar / konu modu state ve handler'ları.
 */
export function useStudyState({
  user,
  userData,
  QUESTIONS,
  view,
  setView,
  refreshSmartReviewSummary,
  refreshRemainingUsage,
  openLimitFromUsageError,
  setLimitModal,
  favoriteQuestionIds,
  setFavoriteQuestionIds,
  isGuest = false,
  openGuestLoginPrompt,
  onGuestAnswered,
}) {
  const [currentSubject, setCurrentSubject] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [studyMode, setStudyMode] = useState("study");
  const [activeTopicSubject, setActiveTopicSubject] = useState("");
  const [activeTopicName, setActiveTopicName] = useState("");
  const [activeReviewContext, setActiveReviewContext] = useState(null);
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
  const [questionStartTime, setQuestionStartTime] = useState(() => Date.now());
  const [questionTimes, setQuestionTimes] = useState({});
  const [studyFeedback, setStudyFeedback] = useState(null);
  const [topicMastery, setTopicMastery] = useState({});
  const [feedbackMeta, setFeedbackMeta] = useState({
    count: 0,
    lastText: "",
    lastType: "",
    lastTopic: "",
  });
  const [favoriteFeedback, setFavoriteFeedback] = useState("");
  const [reviewSummary, setReviewSummary] = useState(null);
  const [questionActionLoading, setQuestionActionLoading] = useState({
    active: false,
    message: "",
  });
  const answeredQuestionIdsRef = useRef(new Set());
  const answeredReviewIdsRef = useRef(new Set());

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

  useEffect(() => {}, [QUESTIONS]);

  const resetStudyState = useCallback(() => {
    setCurrentSubject(null);
    setCurrentIndex(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setActiveQuestions([]);
    setStudyMode("study");
    setActiveTopicSubject("");
    setActiveTopicName("");
    setActiveReviewContext(null);
    setIsAutoAdvancing(false);
    setStreak(0);
    setQuestionTimes({});
    setStudyFeedback(null);
    setTopicMastery({});
    setFeedbackMeta({ count: 0, lastText: "", lastType: "", lastTopic: "" });
    answeredQuestionIdsRef.current = new Set();
    answeredReviewIdsRef.current = new Set();
  }, []);

  const getTimeMetrics = useCallback(() => {
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
  }, [questionTimes]);

  const persistStudySessionMetrics = useCallback(async () => {
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
  }, [
    activeQuestions.length,
    bestStreak,
    currentSubject,
    flowMode,
    getTimeMetrics,
    score,
    streak,
  ]);

  const getDifficultyLabel = useCallback((diff) => {
    const map = { 1: "Kolay", 2: "Orta", 3: "Orta-zor", 4: "Zor", 5: "Seçici" };
    return map[diff] || "Orta";
  }, []);

  const pickDifferentMessage = useCallback(
    (messages, fallback) => {
      const candidates = messages.filter((m) => m !== feedbackMeta.lastText);
      const pool = candidates.length ? candidates : messages;
      return pool[Math.floor(Math.random() * pool.length)] || fallback;
    },
    [feedbackMeta.lastText]
  );

  const shouldShowFeedback = useCallback(
    (type, question) => {
      if (type === "blank") return true;
      if ((question?.diff || 0) >= 4) return true;
      if (streak === 0 || streak % 3 === 0) return true;
      return (feedbackMeta.count + 1) % 3 === 0;
    },
    [feedbackMeta.count, streak]
  );

  const getFeedbackMessage = useCallback(
    (question, answer) => {
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
    },
    [feedbackMeta.lastTopic, getDifficultyLabel, pickDifferentMessage, shouldShowFeedback]
  );

  const recordQuestionTime = useCallback(
    (questionId) => {
      if (!questionId) return;
      setQuestionTimes((prev) => {
        if (prev[questionId]) return prev;
        const elapsedSeconds = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));
        return { ...prev, [questionId]: elapsedSeconds };
      });
    },
    [questionStartTime]
  );

  const updateStreakForQuestion = useCallback(
    (isCorrect, questionId) => {
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
    },
    [bestStreak]
  );

  const recordHistoryForQuestion = useCallback(
    ({ question, selectedOption, mode }) => {
      if (!question?.id) return;
      if (isReactEventOrDomNode(selectedOption)) {
        console.error("Invalid selected answer: React event/DOM node received");
        return;
      }
      const normalizedSelected = normalizeAnswerValue(selectedOption);
      const source =
        mode === "topic" ? "topic" : mode === "review" ? "review" : "study";
      void recordQuestionHistory(user, {
        question,
        selectedOption: normalizedSelected,
        source,
      }).catch((error) => {
        console.error("recordQuestionHistory error:", error);
      });
    },
    [user]
  );

  const revealCurrentAnswer = useCallback(
    async (answerOverride = selected) => {
      const isReview = studyMode === "review";
      const questionId = q?.id ? Number(q.id) : null;
      if (isGuest) {
        // Misafir: tek global soru sayacı; Cloud Function çağrılmaz. Aşınca giriş iste.
        if (questionId && !answeredQuestionIdsRef.current.has(questionId)) {
          if (isGuestLimitReached()) {
            openGuestLoginPrompt?.();
            return;
          }
          recordGuestAnswer();
          answeredQuestionIdsRef.current.add(questionId);
          onGuestAnswered?.();
        }
      } else if (questionId) {
        if (!isReview && !answeredQuestionIdsRef.current.has(questionId)) {
          const gate = await canAnswerQuestion(user, userData);
          if (!gate.allowed) {
            setLimitModal({
              open: true,
              title: "Bugünkü ücretsiz soru hakkın doldu",
              description:
                "Free planda günde 30 soru çözebilirsin. Plus ile sınırsız soru, deneme ve tekrar açılır.",
              remainingInfo: "",
              limitReason: "daily_question_limit",
            });
            return;
          }
          try {
            await incrementQuestionUsage(user, userData, 1);
            await refreshRemainingUsage();
            answeredQuestionIdsRef.current.add(questionId);
          } catch (err) {
            if (openLimitFromUsageError(err)) return;
            console.warn("Kullanım sayacı yazılamadı; cevap gösterilmiyor.", err);
            return;
          }
        }

        if (isReview && !answeredReviewIdsRef.current.has(questionId)) {
          const reviewGate = await canStartReview(user, userData, 1);
          if (!reviewGate.allowed) {
            setLimitModal({
              open: true,
              title: "Bugünkü ücretsiz tekrar hakkın doldu",
              description:
                "Free planda günde 10 tekrar sorusu çözebilirsin. Plus ile tekrar kuyruğun sınırsız açılır.",
              remainingInfo: "",
              limitReason: "daily_review_limit_study",
            });
            return;
          }
          try {
            await incrementReviewUsage(user, userData, 1);
            await refreshRemainingUsage();
            answeredReviewIdsRef.current.add(questionId);
          } catch (err) {
            if (openLimitFromUsageError(err)) return;
            console.warn("Tekrar kullanım sayacı yazılamadı; cevap gösterilmiyor.", err);
            return;
          }
        }
      }

      setShowResult(true);
      const answer = answerOverride;
      const isCorrect = answer !== null && answer !== undefined && answer === q?.correct;
      const isWrong =
        answer !== null && answer !== undefined && Number(answer) !== Number(q?.correct);
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

      // Leaderboard: soru puanı (fire-and-forget — kullanıcı deneyimini yavaşlatmaz)
      if (user?.uid && q?.id) {
        const weekId = getCurrentWeekId();
        submitQuestionScoreEvent(user.uid, {
          questionId: q.id,
          isCorrect,
          difficulty: q.diff,
          lessonName: q.ders,
          topicName: q.konu,
          weekId,
        }).catch(() => {});
        // Günlük çalışma bonusu (streak günü) — Firestore transaction deduplicate eder
        submitDailyBonusEvent(user.uid, {
          eventType: EVENT_TYPES.STREAK_DAY,
          weekId,
        }).catch(() => {});
      }

      if (studyMode === "review") {
        if (answer !== null && answer !== undefined && q?.id) {
          await updateWrongQuestionAfterReview(user, q, isCorrect, answer, userData);
          await updateSmartReviewFromAnswer(user, q, isCorrect, new Date(), activeTopicName);
        }
      } else if (isWrong && q?.id) {
        await addWrongQuestion(user, q, answer, userData);
        await upsertSmartReview(user, q, "wrong");
        await refreshSmartReviewSummary?.();
      }
    },
    [
      q,
      studyMode,
      user,
      userData,
      selected,
      setLimitModal,
      refreshRemainingUsage,
      openLimitFromUsageError,
      updateStreakForQuestion,
      recordQuestionTime,
      getFeedbackMessage,
      recordHistoryForQuestion,
      refreshSmartReviewSummary,
      activeTopicName,
      isGuest,
      openGuestLoginPrompt,
      onGuestAnswered,
    ]
  );

  const handleReveal = useCallback(async () => {
    await revealCurrentAnswer(selected);
  }, [revealCurrentAnswer, selected]);

  const getSocialProof = useCallback((question) => {
    const wrongRateByDiff = { 1: 28, 2: 41, 3: 56, 4: 68, 5: 79 };
    const wrongRate = wrongRateByDiff[question?.diff] ?? 52;
    const label =
      wrongRate >= 70 ? "Seçici soru" : wrongRate >= 55 ? "Sık zorlanılan soru" : "Dengeli zorluk";
    return { wrongRate, label };
  }, []);

  const getMasteryLevel = useCallback(
    (topic) => {
      const stats = topicMastery[topic] || { seen: 0, correct: 0 };
      const accuracy = stats.seen ? Math.round((stats.correct / stats.seen) * 100) : 0;
      const level =
        accuracy >= 85
          ? "Güçlü tempo"
          : accuracy >= 70
            ? "İyi tempo"
            : accuracy >= 50
              ? "Isınma"
              : "Başlangıç";
      const progress = Math.max(8, Math.min(100, accuracy || 8));
      return { ...stats, accuracy, level, progress };
    },
    [topicMastery]
  );

  const showFavoriteToast = useCallback((text) => {
    setFavoriteFeedback(text);
    setTimeout(() => setFavoriteFeedback(""), 1400);
  }, []);

  const handleToggleFavorite = useCallback(
    async (question) => {
      if (!question?.id) return;
      const isFavoriteNow = favoriteQuestionIds.has(Number(question?.id));
      if (
        !isFavoriteNow &&
        !isUserPremium(userData, user) &&
        favoriteQuestionIds.size >= FREE_LIMITS.maxFavorites
      ) {
        setLimitModal({
          open: true,
          title: "Favori sınırına ulaştın",
          description:
            "Free planda en fazla 20 soruyu favoriye ekleyebilirsin. Plus ile favorilerin sınırsız olur.",
          remainingInfo: "",
          limitReason: "favorite_limit",
        });
        return;
      }
      const result = await toggleFavoriteQuestion(user, question);
      setFavoriteQuestionIds((prev) => {
        const next = new Set(prev);
        if (result?.isFavorite) next.add(Number(question.id));
        else next.delete(Number(question.id));
        return next;
      });
      showFavoriteToast(result?.isFavorite ? "Favorilere eklendi" : "Favorilerden çıkarıldı");
    },
    [favoriteQuestionIds, user, userData, setLimitModal, setFavoriteQuestionIds, showFavoriteToast]
  );

  const handleNext = useCallback(async () => {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelected(null);
      setShowResult(false);
      setStudyFeedback(null);
    } else {
      if (studyMode === "review") {
        const wrongRecords = await getWrongQuestions(user, userData);
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

        // Leaderboard: Günlük FSRS tekrar tamamlama bonusu
        if (user?.uid && activeReviewContext === "daily_fsrs_review") {
          submitDailyBonusEvent(user.uid, {
            eventType: EVENT_TYPES.FSRS_DAILY_COMPLETED,
            weekId: getCurrentWeekId(),
          }).catch(() => {});
        }

        await refreshSmartReviewSummary();
        resetStudyState();
        setView("reviewSummary");
        return;
      }
      persistStudySessionMetrics();
      setView("summary");
    }
  }, [
    activeQuestions,
    activeReviewContext,
    currentIndex,
    persistStudySessionMetrics,
    refreshSmartReviewSummary,
    resetStudyState,
    score,
    setView,
    studyMode,
    user,
    userData,
  ]);

  const handleStudySelect = useCallback(
    async (optionIndex) => {
      setSelected(optionIndex);
      if (!flowMode || showResult || isAutoAdvancing) return;
      await revealCurrentAnswer(optionIndex);
      if (currentIndex >= activeQuestions.length - 1) return;
      setIsAutoAdvancing(true);
      setTimeout(() => {
        setIsAutoAdvancing(false);
        handleNext();
      }, 700);
    },
    [
      flowMode,
      showResult,
      isAutoAdvancing,
      revealCurrentAnswer,
      currentIndex,
      activeQuestions.length,
      handleNext,
    ]
  );

  const handleStudyPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelected(null);
      setShowResult(false);
    }
  }, [currentIndex]);

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

  return {
    q,
    currentSubject,
    setCurrentSubject,
    currentIndex,
    setCurrentIndex,
    selected,
    setSelected,
    showResult,
    setShowResult,
    score,
    setScore,
    activeQuestions,
    setActiveQuestions,
    studyMode,
    setStudyMode,
    activeTopicSubject,
    setActiveTopicSubject,
    activeTopicName,
    setActiveTopicName,
    activeReviewContext,
    setActiveReviewContext,
    flowMode,
    setFlowMode,
    isAutoAdvancing,
    setIsAutoAdvancing,
    streak,
    setStreak,
    bestStreak,
    setBestStreak,
    questionStartTime,
    setQuestionStartTime,
    questionTimes,
    setQuestionTimes,
    studyFeedback,
    setStudyFeedback,
    topicMastery,
    setTopicMastery,
    feedbackMeta,
    setFeedbackMeta,
    favoriteFeedback,
    setFavoriteFeedback,
    reviewSummary,
    setReviewSummary,
    questionActionLoading,
    setQuestionActionLoading,
    answeredQuestionIdsRef,
    answeredReviewIdsRef,
    resetStudyState,
    recordQuestionTime,
    updateStreakForQuestion,
    getDifficultyLabel,
    pickDifferentMessage,
    shouldShowFeedback,
    getFeedbackMessage,
    getSocialProof,
    getMasteryLevel,
    recordHistoryForQuestion,
    handleStudySelect,
    handleNext,
    handleStudyPrev,
    handleReveal,
    revealCurrentAnswer,
    persistStudySessionMetrics,
    getTimeMetrics,
    showFavoriteToast,
    handleToggleFavorite,
    topicProgress,
  };
}
