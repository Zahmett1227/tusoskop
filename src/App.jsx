import React, { Suspense, lazy, useMemo, useState, useEffect, useRef, useCallback } from "react";
import './index.css';
import { initAnalytics, loginWithGoogle, logout } from "./firebase";

// Veri ve Yardımcı Araçlar
import { useQuestions } from "./hooks/useQuestions";
import { useAppAccentTheme } from "./hooks/useAppAccentTheme";
import { useAppAuthBootstrap } from "./hooks/useAppAuthBootstrap";
import { useTopicStudyFlow } from "./hooks/useTopicStudyFlow";
import { useExamState } from "./hooks/useExamState";
import { useStudyState } from "./hooks/useStudyState";
import { EXAM_SETS } from "./data/exams";
import {
  buildFullExam,
  getFixedExamQuestions,
  scaleBlueprintToTotal,
  getSelectedAnswerIndex,
} from "./utils/examUtils";
import { buildExamResultMetadata } from "./utils/examHistoryUtils";
import {
  buildInProgressExamPayload,
  clearInProgressExam,
  EXAM_IN_PROGRESS_RESET_MESSAGE,
  hasMeaningfulExamProgress,
  loadInProgressExamRaw,
  saveInProgressExam,
  shouldNotifyInProgressReset,
  validateInProgressExam,
} from "./utils/examInProgressUtils";
import { isIOS } from "./utils/device";
import { setClarityTag, trackClarityEvent } from "./lib/clarity";
import { getWrongQuestions } from "./services/studyCollectionService";
import {
  getDueSmartReviews,
  getSmartReviewSummary,
  resolveQuestionsFromReviews,
} from "./services/smartReviewService";

// Bileşenler (Screens)
import MobileBottomNav from "./components/MobileBottomNav";
import IOSInstallBanner from "./components/IOSInstallBanner";
import { LEGAL_PAGES } from "./content/legalPages";
import { FREE_LIMITS } from "./config/limits";
import { isUserPremium } from "./utils/premiumUtils";
import {
  canStartFullExam,
  canStartReview,
  incrementFullExamUsage,
  UsageLimitError,
  limitModalFromUsageError,
} from "./services/usageLimitService";
import { SUBJECTS as SUBJECT_CATALOG } from "./data/subjects";
import { SUBJECT_QUESTION_COUNTS } from "./data/questions";
import { applyQuestionTextFilter } from "./utils/questionTextFilter";

const Dashboard = lazy(() => import("./components/Dashboard"));
const Suggestions = lazy(() => import("./components/Suggestions"));
const Summary = lazy(() => import("./components/Summary"));
const ExamScreen = lazy(() => import("./components/ExamScreen"));
const ExamAnalysisScreen = lazy(() => import("./components/ExamAnalysisScreen"));
const StudyScreen = lazy(() => import("./components/StudyScreen"));
const StudyCollectionScreen = lazy(() => import("./components/StudyCollectionScreen"));
const ReviewSummaryScreen = lazy(() => import("./components/ReviewSummaryScreen"));
const QuestionSetupScreen = lazy(() => import("./components/QuestionSetupScreen"));
const ExamSetSelectScreen = lazy(() => import("./components/ExamSetSelectScreen"));
const TopicTracker = lazy(() => import("./components/TopicTracker"));
const AdminPanel = lazy(() => import("./components/admin/AdminPanel"));
const PremiumInfoScreen = lazy(() => import("./components/premium/PremiumInfoScreen"));
const LimitReachedModal = lazy(() => import("./components/premium/LimitReachedModal"));
const LegalPage = lazy(() => import("./components/legal/LegalPage"));
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
function RouteFallback() {
  return (
    <div className="min-h-dvh bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-5 text-center shadow-2xl">
        <div className="mx-auto mb-3 h-9 w-9 rounded-full border-2 border-slate-700 border-t-emerald-400 animate-spin" />
        <p className="text-sm font-bold text-slate-300">Yükleniyor...</p>
      </div>
    </div>
  );
}

export default function App() {
  const {
    questions,
    error: questionBankError,
    ensureAllQuestions,
    ensureSubjectQuestions,
  } = useQuestions();
  const QUESTIONS = useMemo(() => questions ?? [], [questions]);

  // iOS tespiti — ilk render'da hesapla, değişmez
  const [iosDevice] = useState(() => isIOS());

  useEffect(() => {
    const startAnalytics = () => initAnalytics();
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(startAnalytics, { timeout: 3000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = setTimeout(startAnalytics, 1200);
    return () => clearTimeout(id);
  }, []);

  const [view, setView] = useState("dashboard");
  const legalReturnViewRef = useRef("dashboard");
  const [legalPageId, setLegalPageId] = useState(LEGAL_PAGES[0].id);
  const { accentThemeKey, accentTheme, handleAccentThemeChange } = useAppAccentTheme();
  const {
    user,
    userData,
    isAdmin,
    remainingUsage,
    refreshRemainingUsage,
    favoriteQuestionIds,
    setFavoriteQuestionIds,
  } = useAppAuthBootstrap(setView);

  const [bottomNavReviewCount, setBottomNavReviewCount] = useState(0);
  const [smartReviewSummary, setSmartReviewSummary] = useState({
    dueCount: 0,
    overdueCount: 0,
    totalCount: 0,
    topSubjects: [],
    topTopics: [],
  });

  const refreshSmartReviewSummary = useCallback(async () => {
    try {
      const summary = await getSmartReviewSummary(user);
      setSmartReviewSummary(summary);
      setBottomNavReviewCount(summary?.dueCount ?? 0);
    } catch {
      setSmartReviewSummary({
        dueCount: 0,
        overdueCount: 0,
        totalCount: 0,
        topSubjects: [],
        topTopics: [],
      });
      setBottomNavReviewCount(0);
    }
  }, [user]);

  useEffect(() => {
    refreshSmartReviewSummary();
  }, [refreshSmartReviewSummary, userData, QUESTIONS, view]);

  const bottomNavExamLocked =
    !isUserPremium(userData) && (remainingUsage?.fullExamRemaining ?? 1) <= 0;

  const [limitModal, setLimitModal] = useState({
    open: false,
    title: "",
    description: "",
    remainingInfo: "",
    ctaLabel: "",
    secondaryLabel: "",
    premiumMessage: "",
    premiumDescription: "",
    limitReason: "",
  });
  const openLimitFromUsageError = (error) => {
    if (!(error instanceof UsageLimitError)) return false;
    const base = limitModalFromUsageError(error.code);
    setLimitModal({
      open: true,
      title: base.title,
      description: base.description,
      remainingInfo: "",
      ctaLabel: "Plus'ı İncele",
      secondaryLabel: "Şimdilik Vazgeç",
      premiumMessage: "Aylık bir kahve ücretine Plus üyelik almak ister misiniz?",
      premiumDescription:
        "Plus ile soru çözme sınırları kalkar; denemeler, tekrarlar ve gelişmiş analizler tamamen açılır.",
      limitReason: base.limitReason || "",
    });
    return true;
  };

  const studyState = useStudyState({
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
  });

  const goDashboard = () => {
    studyState.resetStudyState();
    setView("dashboard");
  };

  const handleExamCompleted = () => {
    clearInProgressExam();
  };

  const { setQuestionActionLoading } = studyState;
  const withQuestionLoading = useCallback(async (message, task) => {
    setQuestionActionLoading({ active: true, message });
    try {
      return await task();
    } finally {
      setQuestionActionLoading({ active: false, message: "" });
    }
  }, [setQuestionActionLoading]);

  const ensureQuestionsForSubject = useCallback(
    async (subjectName) => {
      if (!subjectName) return [];
      return withQuestionLoading(`${subjectName} soruları hazırlanıyor…`, () =>
        ensureSubjectQuestions(subjectName)
      );
    },
    [ensureSubjectQuestions, withQuestionLoading]
  );

  const ensureAllQuestionsLoaded = async (message = "Soru bankası hazırlanıyor…") =>
    withQuestionLoading(message, () => ensureAllQuestions());

  const toDisplayQuestions = (list) => {
    const safeList = Array.isArray(list) ? list : [];
    return safeList.map((q) => applyQuestionTextFilter(q));
  };

  const examState = useExamState({
    user,
    userData,
    view,
    QUESTIONS,
    toDisplayQuestions,
    onExamFinish: () => setView("examAnalysis"),
    recordHistoryForQuestion: studyState.recordHistoryForQuestion,
  });
  const examQ = examState.examQuestions[examState.examIndex];

  const topicStudy = useTopicStudyFlow({
    user,
    userData,
    view,
    setView,
    ensureQuestionsForSubject,
    refreshRemainingUsage,
    resetStudyState: studyState.resetStudyState,
    setStudyMode: studyState.setStudyMode,
    setActiveTopicSubject: studyState.setActiveTopicSubject,
    setActiveTopicName: studyState.setActiveTopicName,
    setCurrentSubject: studyState.setCurrentSubject,
    setActiveQuestions: studyState.setActiveQuestions,
    toDisplayQuestions,
    setLimitModal,
    openLimitFromUsageError,
  });

  const { openTopicSetup, questionSetupScreenProps } = topicStudy;

  const guardedSetView = async (nextView) => {
    if (nextView === "questionSetup") {
      openTopicSetup();
      return;
    }
    if (nextView === "studyCollection" || nextView === "tracker") {
      await ensureAllQuestionsLoaded("Çalışma verileri hazırlanıyor…");
    }
    setView(nextView);
  };

  const openLegalPage = (id) => {
    const valid = LEGAL_PAGES.some((p) => p.id === id) ? id : LEGAL_PAGES[0].id;
    legalReturnViewRef.current = view;
    setLegalPageId(valid);
    setView("legal");
  };

  const closeLegalPage = () => {
    setView(legalReturnViewRef.current || "dashboard");
  };

  const startReviewWithQuestions = (questionList, source = "custom") => {
    const list = Array.isArray(questionList) ? questionList.filter(Boolean) : [];
    if (!list.length) return;
    canStartReview(user, userData, list.length).then((gate) => {
      if (!gate.allowed) {
        setLimitModal({
          open: true,
          title: "Bugünkü ücretsiz tekrar hakkın doldu",
          description: "Free planda günde 10 tekrar sorusu çözebilirsin. Plus ile tekrar kuyruğun sınırsız açılır.",
          remainingInfo: "",
          limitReason: "daily_review_limit",
        });
        return;
      }
      const safeList = isUserPremium(userData)
        ? list
        : list.slice(0, Math.min(FREE_LIMITS.dailyReviewQuestions, gate.allowedCount || FREE_LIMITS.dailyReviewQuestions));
      studyState.resetStudyState();
      studyState.setStudyMode("review");
      studyState.setCurrentSubject("Çalışma Alanım Tekrarı");
      studyState.setActiveTopicSubject("Çalışma Alanım");
      studyState.setActiveTopicName(source);
      studyState.setActiveQuestions(toDisplayQuestions(safeList));
      setView("study");
      setClarityTag("son_mod", "review");
      trackClarityEvent("bugunku_tekrar_baslatildi");
    });
  };

  const startWrongReview = async () => {
    await ensureAllQuestionsLoaded("Yanlış sorular hazırlanıyor…");
    const wrongItems = await getWrongQuestions(user, userData);
    const mapById = new Map(QUESTIONS.map((q) => [Number(q.id), q]));
    const list = wrongItems
      .filter((item) => !item.isResolved)
      .map((item) => mapById.get(item.questionId))
      .filter(Boolean)
      .slice(0, 20);
    startReviewWithQuestions(list, "wrong");
  };

  const startSmartReview = async () => {
    await ensureAllQuestionsLoaded("Akıllı tekrar planı hazırlanıyor…");
    const due = await getDueSmartReviews(user);
    const list = resolveQuestionsFromReviews(due, QUESTIONS);
    if (!list.length) return;
    setClarityTag("akilli_tekrar_due", String(list.length));
    trackClarityEvent("akilli_tekrar_baslatildi");
    startReviewWithQuestions(list, "smart");
  };

  const startSubject = (subjectName) => {
    (async () => {
      const loaded = await ensureQuestionsForSubject(subjectName);
      const filtered = loaded.filter((item) => item.ders === subjectName);
      if (filtered.length === 0) return;
      trackClarityEvent("ders_karti_tiklandi");
      setClarityTag("son_ders", subjectName);
      studyState.resetStudyState();
      studyState.setStudyMode("study");
      studyState.setCurrentSubject(subjectName);
      studyState.setActiveQuestions(toDisplayQuestions(filtered));
      setView("study");
    })();
  };

  const startFullExam = async (setId) => {
    const allQuestions = await ensureAllQuestionsLoaded("Tam deneme hazırlanıyor…");
    const gate = await canStartFullExam(user, userData);
    if (!gate.allowed) {
      setLimitModal({
        open: true,
        title: "Bu ayki ücretsiz deneme hakkını kullandın",
        description: "Free planda ayda 1 tam deneme çözebilirsin. Plus ile sınırsız deneme ve gelişmiş analiz açılır.",
        remainingInfo: "",
        limitReason: "monthly_exam_limit",
      });
      return;
    }
    const fallbackSet = EXAM_SETS[0] || null;
    const activeSet =
      EXAM_SETS.find((item) => item.id === setId) ||
      examState.selectedExamSet ||
      fallbackSet;

    const totalQuestions = activeSet?.questionCount || 200;
    const rawExam =
      Array.isArray(activeSet?.questionIds) && activeSet.questionIds.length > 0
        ? getFixedExamQuestions(activeSet.questionIds, allQuestions)
        : buildFullExam(
            allQuestions,
            scaleBlueprintToTotal(FULL_EXAM_BLUEPRINT, totalQuestions)
          );
    const exam = toDisplayQuestions(rawExam);
    if (!exam.length) return;

    const existingRaw = loadInProgressExamRaw();
    if (
      existingRaw &&
      Number(existingRaw.examId ?? existingRaw.examKey) !== Number(activeSet.id)
    ) {
      clearInProgressExam();
    } else if (existingRaw && Number(existingRaw.examId ?? existingRaw.examKey) === Number(activeSet.id)) {
      const check = validateInProgressExam(existingRaw, activeSet);
      if (!check.ok) {
        clearInProgressExam();
        if (shouldNotifyInProgressReset(check.reason)) {
          window.alert(EXAM_IN_PROGRESS_RESET_MESSAGE);
        }
      } else if (hasMeaningfulExamProgress(check.data)) {
        const resume = window.confirm("Yarım kalan denemeye devam etmek ister misiniz?");
        if (resume) {
          const restored = getFixedExamQuestions(check.data.questionIdsSnapshot, allQuestions);
          if (restored.length === check.data.questionIdsSnapshot.length) {
            const displayExam = toDisplayQuestions(restored);
            const idx = check.data.examIndex;
            const currentQ = displayExam[idx];
            examState.setSelectedExamSet(activeSet);
            examState.setExamQuestions(displayExam);
            examState.examAnswersRef.current = { ...check.data.answers };
            examState.setExamAnswers({ ...check.data.answers });
            examState.setExamIndex(idx);
            examState.setExamSelected(
              check.data.examSelected ??
                (currentQ
                  ? (getSelectedAnswerIndex(check.data.answers, currentQ, idx) ?? null)
                  : null)
            );
            setView("exam");
            return;
          }
          clearInProgressExam();
          window.alert(EXAM_IN_PROGRESS_RESET_MESSAGE);
        } else {
          clearInProgressExam();
        }
      }
    }

    try {
      await incrementFullExamUsage(user, userData);
      await refreshRemainingUsage();
    } catch (err) {
      if (openLimitFromUsageError(err)) return;
      throw err;
    }
    trackClarityEvent("deneme_baslatildi");
    setClarityTag("son_mod", "deneme");
    examState.setSelectedExamSet(activeSet);
    examState.setExamQuestions(exam);
    examState.examAnswersRef.current = {};
    examState.setExamAnswers({});
    examState.setExamIndex(0);
    examState.setExamSelected(null);
    saveInProgressExam(
      buildInProgressExamPayload({
        examSet: activeSet,
        examQuestions: exam,
        examIndex: 0,
        answers: {},
        examSelected: null,
      })
    );
    setView("exam");
  };

  if (!user) {
    return (
      <div className={`app-shell safe-screen ${iosDevice ? "ios-device" : ""}`}>
        <div
          className="flex flex-col items-center justify-center bg-slate-950 text-white p-6 min-h-dvh"
          style={{ paddingTop: "calc(2rem + env(safe-area-inset-top))" }}
        >
          <div className="mb-6 flex justify-center">
            <img
              src="/tusoskop-mark.png"
              alt=""
              width={96}
              height={96}
              decoding="async"
              className="h-20 w-20 md:h-24 md:w-24 rounded-2xl object-contain shadow-lg shadow-black/20"
              aria-hidden
            />
          </div>
          <h1 className={`text-5xl font-black mb-2 ${accentTheme.text} tracking-tighter`}>TUSOSKOP</h1>
          <p className="text-slate-400 mb-10 text-center max-w-sm">
            TUS hazırlık sürecini dijital asistanınla yönet. Verilerini bulutta sakla.
          </p>
          <button
            type="button"
            onClick={loginWithGoogle}
            className={`flex items-center gap-4 px-8 py-4 ${accentTheme.primary} ${accentTheme.primaryHover} text-slate-950 rounded-3xl font-black shadow-2xl ${accentTheme.glow} hover:scale-105 transition-transform active:scale-95`}
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" loading="lazy" decoding="async" />
            Google ile Giriş Yap
          </button>
        </div>
        <IOSInstallBanner />
      </div>
    );
  }

  const showBottomNav = BOTTOM_NAV_VIEWS.has(view);
  let screenContent;
  switch (view) {
    case "dashboard":
      screenContent = (
        <Dashboard
          setView={guardedSetView}
          openTopicSetup={openTopicSetup}
          startSubject={startSubject}
          user={user}
          userData={userData}
          remainingUsage={remainingUsage}
          onLogout={logout}
          isAdmin={isAdmin}
          accentTheme={accentTheme}
          accentThemeKey={accentThemeKey}
          onAccentThemeChange={handleAccentThemeChange}
          currentView={view}
          onOpenLegalPage={openLegalPage}
          smartReviewSummary={smartReviewSummary}
          onStartSmartReview={startSmartReview}
        />
      );
      break;

    case "questionSetup":
      if (!isUserPremium(userData)) {
        screenContent = (
          <Dashboard
            setView={guardedSetView}
            openTopicSetup={openTopicSetup}
            startSubject={startSubject}
            user={user}
            userData={userData}
            remainingUsage={remainingUsage}
            onLogout={logout}
            isAdmin={isAdmin}
            accentTheme={accentTheme}
            accentThemeKey={accentThemeKey}
            onAccentThemeChange={handleAccentThemeChange}
            currentView={view}
            onOpenLegalPage={openLegalPage}
            smartReviewSummary={smartReviewSummary}
            onStartSmartReview={startSmartReview}
          />
        );
        break;
      }
      screenContent = (
        <QuestionSetupScreen
          subjectCatalog={SUBJECT_CATALOG}
          subjectQuestionCounts={SUBJECT_QUESTION_COUNTS}
          {...questionSetupScreenProps}
          goDashboard={goDashboard}
          onStartWrongReview={startWrongReview}
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
          currentSubject={studyState.currentSubject} score={studyState.score} total={studyState.activeQuestions.length}
          questionTimes={studyState.questionTimes}
          onRetry={() => { studyState.setCurrentIndex(0); setView("study"); }}
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
          examQ={examQ} examIndex={examState.examIndex} examQuestions={examState.examQuestions}
          examAnswers={examState.examAnswers} examSelected={examState.examSelected}
          examSetMeta={buildExamResultMetadata(examState.selectedExamSet)}
          accentTheme={accentTheme}
          userId={user?.uid}
          user={user}
          userData={userData}
          getExamAnswersSnapshot={() => examState.examAnswersRef.current}
          onJump={(idx) => {
            const currentQuestion = examState.examQuestions[examState.examIndex];
            if (examState.examSelected !== null && examState.examSelected !== undefined) {
              examState.saveExamAnswer(examState.examIndex, examState.examSelected);
            }
            const latestAnswers = examState.examAnswersRef.current;
            studyState.recordHistoryForQuestion({
              question: currentQuestion,
              selectedOption: getSelectedAnswerIndex(latestAnswers, currentQuestion, examState.examIndex) ?? null,
              mode: "exam",
            });
            const nextQuestion = examState.examQuestions[idx];
            examState.setExamAnswers({ ...latestAnswers });
            examState.setExamIndex(idx);
            examState.setExamSelected(
              nextQuestion ? (getSelectedAnswerIndex(latestAnswers, nextQuestion, idx) ?? null) : null
            );
          }}
          handleExamSelect={examState.handleExamSelect}
          handleExamSelectForQuestion={examState.handleExamSelectForQuestion}
          handleExamBlank={() => {
            examState.saveExamBlank(examState.examIndex);
            examState.setExamSelected(null);
            examState.handleExamNext(null);
          }}
          handleExamNext={examState.handleExamNext}
          handleExamPrev={examState.handleExamPrev}
          onExamCompleted={handleExamCompleted}
          goDashboard={goDashboard}
        />
      );
      break;

    case "examAnalysis":
      screenContent = (
        <ExamAnalysisScreen
          examAnalysis={examState.examAnalysis} estimatedTus={examState.estimatedTus}
          userData={userData}
          accentTheme={accentTheme}
          startFullExam={startFullExam} goDashboard={goDashboard}
        />
      );
      break;

    case "study":
      screenContent = (
        <StudyScreen
          q={studyState.q} index={studyState.currentIndex} total={studyState.activeQuestions.length}
          selected={studyState.selected} setSelected={studyState.handleStudySelect}
          showAnswer={studyState.showResult} revealAnswer={studyState.handleReveal}
          nextQuestion={studyState.handleNext} prevQuestion={studyState.handleStudyPrev}
          flowMode={studyState.flowMode}
          setFlowMode={studyState.setFlowMode}
          streak={studyState.streak}
          bestStreak={studyState.bestStreak}
          feedback={studyState.studyFeedback}
          isAutoAdvancing={studyState.isAutoAdvancing}
          socialProof={studyState.getSocialProof(studyState.q)}
          mastery={studyState.getMasteryLevel(studyState.q?.konu)}
          topicProgress={studyState.topicProgress}
          accentTheme={accentTheme}
          isFavorite={favoriteQuestionIds.has(Number(studyState.q?.id))}
          onToggleFavorite={studyState.handleToggleFavorite}
          favoriteFeedback={studyState.favoriteFeedback}
          goDashboard={goDashboard}
          user={user}
        />
      );
      break;

    case "studyCollection":
      screenContent = (
        <StudyCollectionScreen
          user={user}
          userData={userData}
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
          summary={studyState.reviewSummary}
          accentTheme={accentTheme}
          goStudyCollection={() => setView("studyCollection")}
        />
      );
      break;

    case "admin":
      screenContent = isAdmin ? (
        <AdminPanel currentUser={user} />
      ) : (
        <div className="min-h-dvh bg-slate-950 text-white p-6 flex items-center justify-center">
          <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-center">
            <h2 className="text-xl font-black mb-2">Bu alan için yetkin yok</h2>
            <p className="text-slate-400 text-sm mb-5">
              Admin paneline erişim sadece yetkili hesaplara açıktır.
            </p>
            <button
              type="button"
              onClick={() => setView("dashboard")}
              className={`px-5 py-2.5 rounded-2xl font-black text-slate-950 ${accentTheme.primary} ${accentTheme.primaryHover}`}
            >
              Dashboard&apos;a dön
            </button>
          </div>
        </div>
      );
      break;

    case "premiumInfo":
      screenContent = (
        <PremiumInfoScreen
          user={user}
          userData={userData}
          onBack={() => setView("dashboard")}
          accentTheme={accentTheme}
          accentThemeKey={accentThemeKey}
          onOpenLegalPage={openLegalPage}
        />
      );
      break;

    case "legal":
      screenContent = (
        <LegalPage
          pageId={legalPageId}
          onBack={closeLegalPage}
          accentTheme={accentTheme}
          accentThemeKey={accentThemeKey}
        />
      );
      break;

    default:
      screenContent = (
        <Dashboard
          setView={guardedSetView}
          openTopicSetup={openTopicSetup}
          startSubject={startSubject}
          user={user}
          userData={userData}
          remainingUsage={remainingUsage}
          onLogout={logout}
          isAdmin={isAdmin}
          accentTheme={accentTheme}
          accentThemeKey={accentThemeKey}
          onAccentThemeChange={handleAccentThemeChange}
          currentView={view}
          onOpenLegalPage={openLegalPage}
          smartReviewSummary={smartReviewSummary}
          onStartSmartReview={startSmartReview}
        />
      );
  }

  return (
    <div className={`app-shell safe-screen ${iosDevice ? "ios-device" : ""}`}>
      <Suspense fallback={<RouteFallback />}>
        {screenContent}
      </Suspense>
      {studyState.questionActionLoading.active && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-6">
          <div className="rounded-3xl border border-slate-700 bg-slate-900/90 px-6 py-5 text-center shadow-2xl">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full border-2 border-slate-600 border-t-emerald-400 animate-spin" />
            <p className="text-sm font-semibold text-slate-200">
              {studyState.questionActionLoading.message || "Hazırlanıyor…"}
            </p>
            {questionBankError && (
              <p className="mt-2 text-xs text-rose-300">
                Son yüklemede bir hata algılandı; ağ bağlantınızı kontrol edin.
              </p>
            )}
          </div>
        </div>
      )}
      {limitModal.open && (
        <Suspense fallback={null}>
          <LimitReachedModal
            open={limitModal.open}
            title={limitModal.title}
            description={limitModal.description}
            remainingInfo={limitModal.remainingInfo}
            ctaLabel={limitModal.ctaLabel || "Plus'ı İncele"}
            secondaryLabel={limitModal.secondaryLabel || "Şimdilik Vazgeç"}
            premiumMessage={limitModal.premiumMessage || "Aylık bir kahve ücretine Plus üyelik almak ister misiniz?"}
            premiumDescription={limitModal.premiumDescription || "Plus ile soru çözme sınırları kalkar; denemeler, tekrarlar ve gelişmiş analizler tamamen açılır."}
            user={user}
            limitReason={limitModal.limitReason || ""}
            onClose={() => setLimitModal((prev) => ({ ...prev, open: false }))}
            onUpgradeClick={() => {
              setLimitModal((prev) => ({ ...prev, open: false }));
              setView("premiumInfo");
            }}
          />
        </Suspense>
      )}
      {showBottomNav && (
        <MobileBottomNav
          currentView={view}
          setView={guardedSetView}
          accentTheme={accentTheme}
          reviewQueueCount={bottomNavReviewCount}
          examLocked={bottomNavExamLocked}
        />
      )}
      <IOSInstallBanner />
    </div>
  );
}