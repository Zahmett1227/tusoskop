import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getPublicQuizSlugFromPath,
  getPublicQuizCampaignBySlug,
} from "../../data/publicQuizCampaigns";
import {
  initQuizSession,
  getQuizSession,
  updateQuizSession,
  buildResumeUrl,
  parseResumeToken,
  QUIZ_RESULT_KEY,
} from "../../utils/publicQuizSession";
import {
  trackPublicQuizEvent,
  ensureMetaPixel,
  trackMetaStandard,
  trackMetaCustom,
} from "../../lib/publicQuizAnalytics";
import { buildClientAppStoreUrl } from "../../utils/appStoreCampaignLink";
import { getDeviceType } from "../../utils/device";
import QuizQuestionCard from "./QuizQuestionCard";
import QuizResultScreen from "./QuizResultScreen";
import QuizContinueModal from "./QuizContinueModal";

/** Analitik/beacon oturum özetini serverless endpoint'e fire-and-forget gönderir. */
function postQuizSession(session, event, extra = {}) {
  if (typeof window === "undefined") return;
  try {
    const payload = JSON.stringify({
      sessionId: session.sessionId,
      campaignSlug: session.campaignSlug,
      campaignCode: session.campaignCode,
      deviceType: getDeviceType(),
      params: session.params,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      score: session.score,
      event,
      ...extra,
    });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/quiz-session", new Blob([payload], { type: "application/json" }));
      return;
    }
    fetch("/api/quiz-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analitik hatası akışı bozmaz */
  }
}

function ErrorScreen({ title, message }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 text-center">
      <img src="/tusoskop-mark.png" alt="" width={64} height={64} className="mb-5 h-16 w-16 rounded-2xl" aria-hidden />
      <h1 className="text-xl font-black text-slate-100">{title}</h1>
      <p className="mt-2 text-sm text-slate-400">{message}</p>
      <a
        href="https://www.tusoskop.com/"
        className="mt-6 rounded-2xl bg-emerald-500 px-6 py-3 font-black text-slate-950 hover:bg-emerald-400"
      >
        Tusoskop'a git
      </a>
    </div>
  );
}

export default function PublicQuizFunnel() {
  const slug = useMemo(
    () => (typeof window !== "undefined" ? getPublicQuizSlugFromPath(window.location.pathname) : null),
    []
  );
  const campaign = useMemo(() => getPublicQuizCampaignBySlug(slug), [slug]);
  const questions = useMemo(() => campaign?.questions ?? [], [campaign]);
  const total = questions.length;
  const deviceType = useMemo(() => getDeviceType(), []);

  const errorKind = !campaign
    ? "notfound"
    : !campaign.active
      ? "inactive"
      : total === 0
        ? "noquestions"
        : null;

  const sessionRef = useRef(null);
  if (!sessionRef.current && !errorKind) {
    const existing = getQuizSession(slug);
    if (existing) {
      sessionRef.current = existing;
    } else {
      const created = initQuizSession(slug, { campaignCode: campaign.campaignCode });
      /* Instagram/Facebook'tan gerçek Safari/Chrome'a "Linki Kopyala" ile geçen
         kullanıcı için: sessionStorage taşınmadığından skor URL'e gömülü gelir. */
      const resume = parseResumeToken();
      if (resume) {
        created.score = resume.score;
        created.completedAt = resume.completedAt;
        created.startedAt = resume.completedAt; // süre bu tarayıcıda anlamsız, 0'a sabitle
        created.currentIndex = total;
        created.firstAnswerTracked = true;
        created.completeTracked = true;
        updateQuizSession(slug, created);
      }
      sessionRef.current = created;
    }
  }
  const session = sessionRef.current;

  const [phase, setPhase] = useState(() =>
    session?.completedAt ? "result" : "quiz"
  );
  const [currentIndex, setCurrentIndex] = useState(() =>
    session ? Math.min(session.currentIndex || 0, Math.max(0, total - 1)) : 0
  );
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [score, setScore] = useState(() => session?.score || 0);
  const [durationMs, setDurationMs] = useState(() => {
    if (session?.completedAt && session?.startedAt) {
      return new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime();
    }
    return 0;
  });
  const questionStartRef = useRef(Date.now());

  const [modalOpen, setModalOpen] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const baseParams = useMemo(() => {
    if (!session) return {};
    const p = session.params || {};
    return {
      campaign_code: session.campaignCode || undefined,
      campaign_slug: session.campaignSlug || undefined,
      campaign_id: p.campaign_id,
      adset_id: p.adset_id,
      ad_id: p.ad_id,
      placement: p.placement,
      device_type: deviceType,
    };
  }, [session, deviceType]);

  /* noindex + başlık — reklam landing sayfaları indekslenmesin.
     index.html'deki mevcut robots meta'sını ÜZERİNE YAZ (çakışan ikinci etiket
     yaratma); yoksa oluştur. Ayrılırken orijinal değere geri al. */
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const prevTitle = document.title;
    document.title = campaign ? `${campaign.title} · Tusoskop` : "TUS Mikro Deneme · Tusoskop";

    let meta = document.querySelector('meta[name="robots"]');
    const created = !meta;
    const prevContent = meta ? meta.getAttribute("content") : null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex,nofollow");

    return () => {
      document.title = prevTitle;
      if (created) {
        meta.remove();
      } else if (prevContent !== null) {
        meta.setAttribute("content", prevContent);
      }
    };
  }, [campaign]);

  /* Landing izleme — bir kez. */
  useEffect(() => {
    if (errorKind || !session) return;
    ensureMetaPixel();
    if (!session.landingTracked) {
      trackPublicQuizEvent("quiz_landing_view", { ...baseParams, subject: campaign.subject });
      trackMetaStandard("ViewContent", {
        content_name: campaign.title,
        content_category: campaign.subject,
      });
      updateQuizSession(slug, { landingTracked: true });
      session.landingTracked = true;
      postQuizSession(session, "session_start");
    }
    questionStartRef.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = useCallback(
    (optionIndex) => {
      if (selectedIndex !== null || phase !== "quiz") return;
      const question = questions[currentIndex];
      if (!question) return;

      const responseTime = Date.now() - questionStartRef.current;
      const isCorrect = optionIndex === question.correctIndex;
      setSelectedIndex(optionIndex);

      const nextScore = isCorrect ? score + 1 : score;
      if (isCorrect) setScore(nextScore);

      const answers = [
        ...(session.answers || []),
        { questionId: question.id, selectedIndex: optionIndex, isCorrect, responseTime },
      ];

      if (!session.firstAnswerTracked) {
        trackPublicQuizEvent("quiz_start", { ...baseParams, subject: campaign.subject });
        trackMetaCustom("QuizStart", {
          campaign_code: session.campaignCode,
          subject: campaign.subject,
        });
        session.firstAnswerTracked = true;
      }

      trackPublicQuizEvent("question_answered", {
        ...baseParams,
        question_id: question.id,
        question_index: currentIndex,
        subject: question.subject,
        topic: question.topic,
        is_correct: isCorrect,
        response_time_ms: responseTime,
      });

      updateQuizSession(slug, {
        answers,
        score: nextScore,
        currentIndex,
        firstAnswerTracked: true,
      });
      session.answers = answers;
      session.score = nextScore;
    },
    [selectedIndex, phase, questions, currentIndex, score, session, baseParams, campaign, slug]
  );

  const finishQuiz = useCallback(() => {
    const completedAt = new Date().toISOString();
    const duration = new Date(completedAt).getTime() - new Date(session.startedAt).getTime();
    setDurationMs(duration);
    setPhase("result");

    const updated = updateQuizSession(slug, { completedAt, currentIndex: total });
    session.completedAt = completedAt;

    /* Sonucu Phase-2 içe aktarımı için sakla (kayıt sonrası hesaba bağlanabilir). */
    try {
      window.localStorage.setItem(
        QUIZ_RESULT_KEY,
        JSON.stringify({
          campaignCode: session.campaignCode,
          campaignSlug: session.campaignSlug,
          subject: campaign.subject,
          score,
          total,
          answers: session.answers,
          completedAt,
        })
      );
    } catch {
      /* kota — yut */
    }

    if (!session.completeTracked) {
      trackPublicQuizEvent("quiz_complete", {
        ...baseParams,
        subject: campaign.subject,
        score,
        question_count: total,
      });
      trackPublicQuizEvent("result_view", { ...baseParams, score, question_count: total });
      trackMetaCustom("QuizComplete", {
        campaign_code: session.campaignCode,
        score,
        question_count: total,
        value: 1,
        currency: "TRY",
      });
      session.completeTracked = true;
      updateQuizSession(slug, { completeTracked: true });
    }
    postQuizSession(updated, "quiz_complete", { score, questionCount: total });
  }, [session, slug, total, score, baseParams, campaign]);

  const handleNext = useCallback(() => {
    if (currentIndex >= total - 1) {
      finishQuiz();
      return;
    }
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setSelectedIndex(null);
    questionStartRef.current = Date.now();
    updateQuizSession(slug, { currentIndex: nextIndex });
  }, [currentIndex, total, finishQuiz, slug]);

  const appStoreUrl = useMemo(
    () => buildClientAppStoreUrl(campaign?.appleCampaignToken || session?.campaignCode),
    [campaign, session]
  );

  const handleAppStoreClick = useCallback(
    (event) => {
      /* App Store'a geçiş sayfayı anında koparabiliyor; pixel isteğinin ağa
         çıkması için navigasyonu kısa bir süre erteliyoruz. */
      event.preventDefault();
      trackPublicQuizEvent("appstore_click", { ...baseParams, destination: "appstore" });
      trackMetaCustom("AppStoreClick", { campaign_code: session.campaignCode });
      const updated = updateQuizSession(slug, { appStoreClicked: true });
      postQuizSession(updated, "appstore_click", { appStoreClicked: true });
      window.setTimeout(() => {
        window.location.href = appStoreUrl;
      }, 250);
    },
    [baseParams, session, slug, appStoreUrl]
  );

  const handleWebContinue = useCallback(() => {
    trackPublicQuizEvent("web_continue_click", { ...baseParams, destination: "website" });
    trackMetaCustom("WebContinueClick", { campaign_code: session.campaignCode });
    const updated = updateQuizSession(slug, { webContinueClicked: true });
    postQuizSession(updated, "web_continue_click", { webContinueClicked: true });
    setLoginError(null);
    setModalOpen(true);
  }, [baseParams, session, slug]);

  const runLogin = useCallback(
    async (method) => {
      setLoginBusy(true);
      setLoginError(null);
      trackPublicQuizEvent("signup_start", { ...baseParams, method });
      try {
        const firebase = await import("../../firebase");
        const loginFn = method === "apple" ? firebase.loginWithApple : firebase.loginWithGoogle;
        // Popup akışı bazen (özellikle Apple/Safari'de) auth başarıyla tamamlandığı
        // halde null döndürebilir (ör. auth/popup-closed-by-user iyi huylu kodu).
        // Böyle bir durumda auth.currentUser set olmuştur — onu fallback al ki
        // "giriş başarılı ama modalda kalıyor" durumu oluşmasın.
        const user = (await loginFn()) || firebase.auth?.currentUser || null;
        if (!user) {
          // Gerçek sessiz iptal (auth da yok) — kullanıcı modalda kalır.
          setLoginBusy(false);
          return;
        }
        trackMetaStandard("CompleteRegistration", { campaign_code: session.campaignCode });
        updateQuizSession(slug, { registered: true });
        // Tam uygulamaya (giriş yapılmış) yönlendir; acquisition mevcut akışta yazılır.
        window.location.href = "/";
      } catch (error) {
        setLoginError(error?.userMessage || "Giriş yapılamadı. Lütfen tekrar deneyin.");
        setLoginBusy(false);
      }
    },
    [baseParams, session, slug]
  );

  if (errorKind === "notfound") {
    return (
      <ErrorScreen
        title="Kampanya bulunamadı"
        message="Bu mini deneme bağlantısı geçersiz görünüyor. Tusoskop'ta binlerce soruyu çözmeye devam edebilirsin."
      />
    );
  }
  if (errorKind === "inactive") {
    return (
      <ErrorScreen
        title="Bu kampanya sona erdi"
        message="Bu mini deneme artık aktif değil. Tusoskop'ta güncel sorularla çalışmaya devam et."
      />
    );
  }
  if (errorKind === "noquestions") {
    return (
      <ErrorScreen
        title="Sorular yüklenemedi"
        message="Şu an bu mini denemeyi gösteremiyoruz. Lütfen daha sonra tekrar dene."
      />
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div
        className="mx-auto flex w-full max-w-md flex-col px-4 pb-10"
        style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top))" }}
      >
        {/* Header */}
        <header className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <img src="/tusoskop-mark.png" alt="Tusoskop" width={32} height={32} className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-black tracking-tight text-slate-100">TUSOSKOP</span>
          </div>
          <h1 className="mt-3 text-xl font-black text-slate-100">3 Soruluk TUS Mikro Denemesi</h1>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-slate-800/70 px-3 py-1 text-xs font-bold text-slate-300">
            Üyelik gerekmez
          </span>
        </header>

        {/* İçerik */}
        <main className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
          {phase === "quiz" && currentQuestion && (
            <>
              {/* İlerleme */}
              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>
                    Soru {currentIndex + 1} / {total}
                  </span>
                  <span>{Math.round(((currentIndex + (selectedIndex !== null ? 1 : 0)) / total) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${((currentIndex + (selectedIndex !== null ? 1 : 0)) / total) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <QuizQuestionCard
                question={currentQuestion}
                index={currentIndex}
                selectedIndex={selectedIndex}
                onSelect={handleSelect}
                onNext={handleNext}
                isLast={currentIndex >= total - 1}
              />
            </>
          )}

          {phase === "result" && (
            <QuizResultScreen
              score={score}
              total={total}
              durationMs={durationMs}
              subject={campaign.subject}
              deviceType={deviceType}
              appStoreUrl={appStoreUrl}
              onAppStoreClick={handleAppStoreClick}
              onWebContinue={handleWebContinue}
            />
          )}
        </main>
      </div>

      <QuizContinueModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        score={score}
        total={total}
        busy={loginBusy}
        error={loginError}
        onGoogle={() => runLogin("google")}
        onApple={() => runLogin("apple")}
        resumeUrl={buildResumeUrl(session)}
      />
    </div>
  );
}
