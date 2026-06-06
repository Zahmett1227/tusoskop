import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { setClarityTag, trackClarityEvent } from "../lib/clarity";
import { isUserPremium } from "../utils/premiumUtils";
import {
  canStartTopicTest,
  incrementTopicTestUsage,
} from "../services/usageLimitService";
import { getStudyCollectionSummary } from "../services/studyCollectionService";
import { resolveTopicStudyCount } from "../utils/topicStudyUtils";
import { saveRecentTopicStudy } from "../utils/topicStudyMemory";
import { useToast } from "../context/ToastContext";

/**
 * Konu seçerek çöz (questionSetup → topic study) akışı.
 * Study ekranı state'i App.jsx'te kalır; bu hook seçim, limit ve başlatmayı yönetir.
 */
export function useTopicStudyFlow({
  user,
  userData,
  view,
  setView,
  ensureQuestionsForSubject,
  refreshRemainingUsage,
  resetStudyState,
  setStudyMode,
  setActiveTopicSubject,
  setActiveTopicName,
  setCurrentSubject,
  setActiveQuestions,
  toDisplayQuestions,
  setLimitModal,
  openLimitFromUsageError,
}) {
  const { showToast } = useToast();
  const [selectedLesson, setSelectedLesson] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [questionSetupWrongCount, setQuestionSetupWrongCount] = useState(0);
  const questionSetupNonPremiumHandledRef = useRef(false);

  useEffect(() => {
    if (!selectedLesson) return;
    ensureQuestionsForSubject(selectedLesson).catch((error) => {
      console.error("Konu listesi için ders soruları yüklenemedi:", error);
    });
  }, [selectedLesson, ensureQuestionsForSubject]);

  const openSubjectTopicPlusGate = useCallback(() => {
    trackClarityEvent("subject_topic_plus_gate_shown");
    setLimitModal({
      open: true,
      title: "Ders ve konu seçerek çözme Plus'a özel",
      description:
        "Free planda günlük ücretsiz soru hakkınızla çalışmaya devam edebilirsiniz. Ders ve konu seçerek sınırsız çalışma Plus üyelikte açılır.",
      remainingInfo: "",
      ctaLabel: "Plus'ı İncele",
      secondaryLabel: "Free ile Devam Et",
      premiumMessage: "Aylık bir kahve ücretine Plus üyelik almak ister misiniz?",
      premiumDescription:
        "Plus ile istediğiniz ders ve konudan sınırsız soru çözebilir, tekrar kuyruğunuzu ve analizlerinizi daha geniş kullanabilirsiniz.",
      limitReason: "subject_topic_gate",
    });
  }, [setLimitModal]);

  useEffect(() => {
    if (view !== "questionSetup" || !user?.uid) return;
    let active = true;
    const loadWrongCount = async () => {
      try {
        const summary = await getStudyCollectionSummary(user, userData);
        if (active) {
          setQuestionSetupWrongCount(
            summary?.unresolvedWrongCount ?? summary?.wrongCount ?? 0
          );
        }
      } catch {
        if (active) setQuestionSetupWrongCount(0);
      }
    };
    loadWrongCount();
    return () => {
      active = false;
    };
  }, [view, user, userData]);

  useEffect(() => {
    if (view !== "questionSetup") {
      questionSetupNonPremiumHandledRef.current = false;
      return;
    }
    if (isUserPremium(userData)) return;
    if (questionSetupNonPremiumHandledRef.current) return;
    questionSetupNonPremiumHandledRef.current = true;
    openSubjectTopicPlusGate();
    setView("dashboard");
  }, [view, userData, setView, openSubjectTopicPlusGate]);

  const openTopicSetup = useCallback(() => {
    if (!isUserPremium(userData)) {
      openSubjectTopicPlusGate();
      return;
    }
    trackClarityEvent("subject_topic_started");
    setView("questionSetup");
  }, [userData, openSubjectTopicPlusGate, setView]);

  const startTopicTest = useCallback(
    async (questionLimit = "all", topicOverride) => {
      if (!isUserPremium(userData)) {
        openSubjectTopicPlusGate();
        return;
      }
      const lesson = topicOverride?.ders ?? selectedLesson;
      const topic = topicOverride?.konu ?? selectedTopic;
      const limit = topicOverride?.countMode ?? questionLimit;
      if (!lesson || !topic) {
        showToast("Lütfen ders ve konu seçin.", { type: "info" });
        return;
      }
      const loaded = await ensureQuestionsForSubject(lesson);
      const filtered = loaded.filter((item) => item.ders === lesson && item.konu === topic);
      if (filtered.length === 0) {
        showToast("Bu konuda soru bulunamadı.", { type: "info" });
        return;
      }
      const take = resolveTopicStudyCount(limit, filtered.length);
      const subset = filtered.slice(0, take);
      const gate = await canStartTopicTest(user, userData);
      if (!gate.allowed) {
        setLimitModal({
          open: true,
          title: "Günlük konu testi limitine ulaştın",
          description:
            "Free planda günde en fazla 2 konu testi başlatabilirsin. Plus ile sınırsız konu testi açılır.",
          remainingInfo: "",
          limitReason: "daily_topic_test_limit",
        });
        return;
      }
      try {
        await incrementTopicTestUsage(user, userData);
        await refreshRemainingUsage();
      } catch (err) {
        if (openLimitFromUsageError(err)) return;
        throw err;
      }
      saveRecentTopicStudy({
        ders: lesson,
        konu: topic,
        countMode: limit,
        resolvedCount: take,
      });
      trackClarityEvent("konu_testi_baslatildi");
      setClarityTag("son_ders", lesson);
      setClarityTag("son_konu", topic);
      setClarityTag("son_mod", "konu_testi");
      resetStudyState();
      setStudyMode("topic");
      setSelectedLesson(lesson);
      setSelectedTopic(topic);
      setActiveTopicSubject(lesson);
      setActiveTopicName(topic);
      setCurrentSubject(`${lesson} / ${topic}`);
      setActiveQuestions(toDisplayQuestions(subset));
      setView("study");
    },
    [
      user,
      userData,
      selectedLesson,
      selectedTopic,
      ensureQuestionsForSubject,
      refreshRemainingUsage,
      openLimitFromUsageError,
      resetStudyState,
      setStudyMode,
      setActiveTopicSubject,
      setActiveTopicName,
      setCurrentSubject,
      setActiveQuestions,
      toDisplayQuestions,
      setView,
      setLimitModal,
      openSubjectTopicPlusGate,
      showToast,
    ]
  );

  const questionSetupScreenProps = useMemo(
    () => ({
      selectedLesson,
      setSelectedLesson,
      selectedTopic,
      setSelectedTopic,
      ensureSubjectQuestions: ensureQuestionsForSubject,
      startTopicTest,
      wrongCount: questionSetupWrongCount,
    }),
    [
      selectedLesson,
      selectedTopic,
      ensureQuestionsForSubject,
      startTopicTest,
      questionSetupWrongCount,
    ]
  );

  return {
    selectedLesson,
    setSelectedLesson,
    selectedTopic,
    setSelectedTopic,
    openTopicSetup,
    startTopicTest,
    questionSetupWrongCount,
    questionSetupScreenProps,
    openSubjectTopicPlusGate,
  };
}
