import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  doc, getDoc, setDoc,
} from "firebase/firestore";

import SubjectCard from "./SubjectCard";
import SmartReviewPanel from "./SmartReviewPanel";
import TusCountDown from "./TusCountDown";
import StreakBadge from "./StreakBadge";
import { SUBJECTS } from "../data/subjects";
import { FIXED_EXAM_CARD_SUBTITLE } from "../data/exams";
import { SUBJECT_QUESTION_COUNTS } from "../data/questions";
import { accentThemes } from "../theme/accentThemes";
import { isUserPremium } from "../utils/premiumUtils";
import {
  getStudyCollectionSummary,
} from "../services/studyCollectionService";
import { setClarityTag, trackClarityEvent } from "../lib/clarity";
import DashboardMembershipHero from "./DashboardMembershipHero";
import DashboardProfileMenu from "./DashboardProfileMenu";
import { getMailtoFeedback, getMailtoPaymentIssue } from "../config/support";
import Footer from "./layout/Footer";
import { getStreak } from "../services/streakService";
import { getSmartReviewSummary, getSmartReviews } from "../services/smartReviewService";
import { buildTopicRows, groupReviewsBySubject } from "../utils/smartReviewUtils";
import { useToast } from "../context/ToastContext";

function toSafeTargetScore(value, fallback = 65) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** remainingUsage yüklenmeden veya Plus’ta güvenli kullanım göstergesi */
function getFreeUsageUsed(remainingUsage) {
  if (!remainingUsage || remainingUsage.unlimited) {
    return { questionUsed: 0, examUsed: 0, reviewUsed: 0 };
  }
  const questionRemaining = Number(remainingUsage.questionRemaining);
  const examRemaining = Number(remainingUsage.fullExamRemaining);
  const reviewRemaining = Number(remainingUsage.reviewRemaining);
  return {
    questionUsed: Math.max(
      0,
      30 - (Number.isFinite(questionRemaining) ? questionRemaining : 30)
    ),
    examUsed: Math.max(0, 1 - (Number.isFinite(examRemaining) ? examRemaining : 1)),
    reviewUsed: Math.max(
      0,
      10 - (Number.isFinite(reviewRemaining) ? reviewRemaining : 10)
    ),
  };
}

export default function Dashboard({
  setView,
  openTopicSetup,
  startSubject,
  user,
  userData,
  remainingUsage,
  onLogout,
  accentTheme,
  accentThemeKey,
  onAccentThemeChange,
  isAdmin = false,
  /** App içinden gelen görünüm — dashboard’a her dönüşte geçmiş yenilenebilir */
  currentView = "dashboard",
  onOpenLegalPage,
  smartReviewSummary = {
    dueCount: 0,
    overdueCount: 0,
    totalCount: 0,
    topSubjects: [],
    topTopics: [],
  },
  onStartSmartReview,
}) {
  const { showToast } = useToast();
  const theme = accentTheme || accentThemes.emerald;
  const isLightTheme =
    theme.usesLightChrome ??
    (theme.mode === "light" || accentThemeKey === "light");
  const pageClasses =
    theme.shellBg ??
    (isLightTheme
      ? "min-h-dvh bg-[#faf8f4] text-slate-950"
      : "min-h-dvh bg-slate-950 text-white");
  const appCardShell = isLightTheme ? "app-card app-card--light" : "app-card";
  const premiumActive = isUserPremium(userData);
  const { questionUsed: freeQuestionUsed, examUsed: freeExamUsed, reviewUsed: freeReviewUsed } =
    getFreeUsageUsed(remainingUsage);
  const [myTarget, setMyTarget] = useState(65.0);
  const [tempTarget, setTempTarget] = useState(65.0);
  const displayTarget = toSafeTargetScore(myTarget);
  const displayTempTarget = toSafeTargetScore(tempTarget);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [studySummary, setStudySummary] = useState({
    wrongCount: 0,
    favoriteCount: 0,
  });
  const [planStreak, setPlanStreak] = useState(0);
  const [panelSummary, setPanelSummary] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelTopicRows, setPanelTopicRows] = useState([]);
  const [wrongBySubject, setWrongBySubject] = useState({});
  const smartDue = Number(smartReviewSummary?.dueCount) || 0;
  const smartOverdue = Number(smartReviewSummary?.overdueCount) || 0;
  const smartTopSubjects = smartReviewSummary?.topSubjects || [];
  const smartTopTopics = smartReviewSummary?.topTopics || [];

  useEffect(() => {
    if (!user?.uid) return;
    const loadTarget = async () => {
      const authed = auth.currentUser;
      if (!authed?.uid) return;
      try {
        const userDoc = await getDoc(doc(db, "users", authed.uid));
        if (userDoc.exists() && userDoc.data().targetScore != null) {
          const target = toSafeTargetScore(userDoc.data().targetScore);
          setMyTarget(target);
          setTempTarget(target);
        }
      } catch (err) {
        console.error("Hedef net verisi alınamadı:", err);
      }
    };
    loadTarget();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setPanelSummary(null);
      setPanelTopicRows([]);
      setWrongBySubject({});
      setPanelLoading(false);
      return;
    }
    let active = true;
    const loadPanel = async () => {
      setPanelLoading(true);
      try {
        const [summary, reviews] = await Promise.all([
          getSmartReviewSummary(user),
          getSmartReviews(user),
        ]);
        if (!active) return;
        setPanelSummary(summary);
        setPanelTopicRows(buildTopicRows(summary, reviews));
        setWrongBySubject(groupReviewsBySubject(reviews));
      } catch {
        if (!active) return;
        setPanelSummary(null);
        setPanelTopicRows([]);
        setWrongBySubject({});
      } finally {
        if (active) setPanelLoading(false);
      }
    };
    loadPanel();
    return () => {
      active = false;
    };
  }, [user, userData, currentView]);

  useEffect(() => {
    let active = true;
    const loadStudySummary = async () => {
      try {
        const [summary, streakSnap] = await Promise.all([
          getStudyCollectionSummary(user, userData),
          user?.uid ? getStreak(user.uid) : Promise.resolve({ currentStreak: 0 }),
        ]);
        if (!active) return;
        setStudySummary({
          wrongCount: summary?.wrongCount || 0,
          favoriteCount: summary?.favoriteCount || 0,
        });
        setPlanStreak(streakSnap?.currentStreak ?? 0);
      } catch {
        if (!active) return;
        setStudySummary({ wrongCount: 0, favoriteCount: 0 });
        setPlanStreak(0);
      }
    };
    loadStudySummary();
    return () => {
      active = false;
    };
  }, [user, currentView, userData]);

  const adjustTarget = (amount) => {
    setTempTarget(prev => {
      const val = parseFloat(prev) + amount;
      return parseFloat(val.toFixed(2));
    });
  };

  const saveTarget = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const saved = toSafeTargetScore(tempTarget);
      await setDoc(doc(db, "users", currentUser.uid), {
        targetScore: saved,
      }, { merge: true });
      setMyTarget(saved);
      setTempTarget(saved);
      setIsEditingTarget(false);
      showToast("Hedef netin kaydedildi.", { type: "success" });
    } catch {
      showToast("Hedef kaydedilemedi. Lütfen tekrar dene.", { type: "error" });
    }
  };

  return (
    <div
      className={`${pageClasses} px-4 py-6 md:px-8 md:py-10 font-sans`}
      style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top))" }}
    >
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <header className="flex items-center justify-between mb-8 gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/tusoskop-mark.png"
              alt=""
              width={40}
              height={40}
              decoding="async"
              className="h-9 w-9 md:h-10 md:w-10 shrink-0 rounded-lg object-contain"
              aria-hidden
            />
            <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${isLightTheme ? "text-slate-950" : theme.text}`}>TUSOSKOP</h1>
          </div>
          {user && (
            <DashboardProfileMenu
              user={user}
              isLightTheme={isLightTheme}
              theme={theme}
              accentThemeKey={accentThemeKey}
              onAccentThemeChange={onAccentThemeChange}
              onLogout={onLogout}
              mailtoSupport={getMailtoPaymentIssue(user)}
              mailtoFeedback={getMailtoFeedback(user)}
              onSupportClick={() => {
                try {
                  setClarityTag("support_email_provider", "gmail");
                  setClarityTag("support_email_address_type", "gmail");
                  trackClarityEvent("support_payment_issue_click");
                } catch {
                  /* sessiz */
                }
              }}
              onFeedbackClick={() => {
                try {
                  setClarityTag("support_email_provider", "gmail");
                  setClarityTag("support_email_address_type", "gmail");
                  trackClarityEvent("feedback_email_click");
                } catch {
                  /* sessiz */
                }
              }}
            />
          )}
        </header>

        {/* Akıllı Tekrar Planı — bugünkü due tekrarlar */}
        <section
          className={`relative mb-6 overflow-hidden rounded-[2rem] border p-5 shadow-xl md:p-7 ${
            isLightTheme
              ? "border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/60 to-cyan-50/40 text-slate-950 shadow-emerald-100/60"
              : "border-emerald-500/25 bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-900 text-white shadow-black/30"
          }`}
          aria-labelledby="smart-review-heading"
        >
          <h2
            id="smart-review-heading"
            className={`mb-1 text-[10px] font-black uppercase tracking-[0.32em] ${isLightTheme ? "text-emerald-700" : "text-emerald-300"}`}
          >
            Akıllı Tekrar Planı
          </h2>
          <p className={`text-2xl font-black tracking-tight md:text-3xl ${isLightTheme ? "text-slate-950" : "text-white"}`}>
            Bugünkü Tekrarım
          </p>
          <p className={`mt-2 max-w-2xl text-sm font-semibold leading-relaxed ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>
            FSRS tabanlı akıllı plan, zorlandığın soruları doğru zamanda geri getirir.
          </p>
          <div className="mt-4 space-y-2" role="status">
            {smartDue > 0 ? (
              <>
                <p className={`text-base font-bold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>
                  Bugün {smartDue} soru hazır
                  {smartOverdue > 0 ? (
                    <span className={`ml-2 text-sm font-extrabold ${isLightTheme ? "text-amber-700" : "text-amber-300"}`}>
                      · Geciken {smartOverdue} tekrar
                    </span>
                  ) : null}
                </p>
                {(smartTopSubjects.length > 0 || smartTopTopics.length > 0) && (
                  <p className={`text-xs font-semibold ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>
                    Öncelik:{" "}
                    {[
                      ...smartTopSubjects.slice(0, 2).map((s) => s.name),
                      ...smartTopTopics.slice(0, 1).map((t) => t.name),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </>
            ) : (
              <p className={`text-sm font-semibold ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>
                Bugün tekrar yok. Yeni konu çözerek planını besleyebilirsin. Yanlış yaptığın yeni sorular burada zamanlanır.
              </p>
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                trackClarityEvent("bugunku_tekrarim_cta");
                if (smartDue > 0 && onStartSmartReview) {
                  onStartSmartReview();
                } else {
                  setView("studyCollection");
                }
              }}
              className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-6 py-3 text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isLightTheme ? "focus-visible:ring-offset-emerald-50" : "focus-visible:ring-offset-slate-950"} ${theme.primary} ${theme.primaryHover} text-slate-950 shadow-lg ${theme.glow} ${theme.ring}`}
            >
              Tekrara Başla
            </button>
            {smartDue <= 0 && (
              <button
                type="button"
                onClick={() => openTopicSetup?.()}
                className={`inline-flex min-h-12 items-center justify-center rounded-2xl border px-5 py-3 text-sm font-bold transition-all ${isLightTheme ? "border-slate-300 bg-white text-slate-800 hover:bg-slate-50" : "border-slate-600 bg-slate-900/60 text-slate-200 hover:bg-slate-800"}`}
              >
                Yeni konu çöz
              </button>
            )}
          </div>
        </section>

        {/* Bugünün planı — ilk ekranda tek güçlü karar alanı */}
        <section
          className={`relative mb-6 md:mb-8 overflow-hidden rounded-[2rem] md:rounded-[3rem] border p-5 shadow-2xl md:p-8 ${
            isLightTheme
              ? "border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_35%),linear-gradient(135deg,#fffefb,#f4fbf7_45%,#ebe8e3)] text-slate-950 shadow-slate-200/80"
              : `${theme.softBorder} bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.20),transparent_38%),linear-gradient(135deg,#020617,#0f172a_48%,#04140f)] text-white shadow-black/40`
          }`}
          aria-labelledby="today-plan-heading"
        >
          <div className={`pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl ${theme.softBg}`} />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
          <h2
            id="today-plan-heading"
            className={`relative z-10 mb-3 text-[10px] font-black uppercase tracking-[0.32em] ${isLightTheme ? "text-slate-500" : theme.text}`}
          >
            Bugünün planı
          </h2>
          <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
            <div>
              <h3 className={`max-w-3xl text-3xl font-black tracking-tight md:text-5xl ${isLightTheme ? "text-slate-950" : "text-white"}`}>
                Bugün ne çalışacağını tek bakışta gör.
              </h3>
              <p className={`mt-3 max-w-2xl text-sm font-semibold leading-relaxed md:text-base ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>
                Seri, hedef net ve akıllı tekrar planını bir araya getirdik. Kaldığın yerden devam et ya da sabit 200 soruluk TUS denemesine geç.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-3">
                {[
                  ["Seri", planStreak, "gün"],
                  ["Hedef net", displayTarget.toFixed(2), "kişisel"],
                  ["Bugünkü tekrar", smartDue, "soru"],
                ].map(([label, value, suffix]) => (
                  <div
                    key={label}
                    className={`rounded-2xl border px-3 py-3 text-center sm:px-4 sm:text-left ${
                      isLightTheme
                        ? "border-white/80 bg-white/80 shadow-sm"
                        : "border-white/10 bg-white/[0.06] shadow-lg shadow-black/10"
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 sm:text-[10px]">
                      {label}
                    </p>
                    <p className={`mt-1 text-2xl font-black tabular-nums md:text-3xl ${label === "Bugünkü tekrar" ? theme.text : isLightTheme ? "text-slate-950" : "text-white"}`}>
                      {value}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500">{suffix}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={`rounded-[1.75rem] border p-4 ${
              isLightTheme
                ? "border-slate-200 bg-white/85 shadow-sm"
                : "border-white/10 bg-slate-950/55 shadow-xl shadow-black/20"
            }`}>
              <p className={`mb-3 text-xs font-extrabold uppercase tracking-[0.18em] ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>
                Hızlı başlangıç
              </p>
              <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  trackClarityEvent("today_plan_primary_cta");
                  if (smartDue > 0 && onStartSmartReview) {
                    onStartSmartReview();
                  } else {
                    setView("studyCollection");
                  }
                }}
                className={`inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-6 py-4 text-sm font-black transition-all hover:-translate-y-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isLightTheme ? "focus-visible:ring-offset-[#fffefb]" : "focus-visible:ring-offset-slate-950"} ${theme.primary} ${theme.primaryHover} text-slate-950 shadow-lg ${theme.glow} ${theme.ring}`}
              >
                {smartDue > 0
                  ? `Tekrara başla (${smartDue})`
                  : "Çalışma alanını aç"}
              </button>
              <button
                type="button"
                onClick={() => {
                  trackClarityEvent("today_plan_secondary_exam");
                  setView("examSetSelect");
                }}
                className={`inline-flex min-h-12 w-full items-center justify-center rounded-2xl border px-5 text-sm font-bold transition-all hover:-translate-y-px active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isLightTheme ? "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-offset-[#fffefb] focus-visible:ring-emerald-500/50" : "border-slate-700 bg-slate-950/50 text-slate-200 hover:bg-slate-900 focus-visible:ring-offset-slate-950 focus-visible:ring-emerald-400/40"}`}
              >
                TUS denemesi seç
              </button>
              <button
                type="button"
                onClick={() => {
                  trackClarityEvent("today_plan_tertiary_topic_setup");
                  openTopicSetup?.();
                }}
                className={`w-full rounded-xl px-2 py-2 text-left text-sm font-extrabold underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isLightTheme ? "text-slate-700 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-[#fffefb]" : "text-slate-300 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-slate-950"}`}
              >
                Ders veya konu seçerek çöz →
              </button>
              </div>
              <p className={`mt-3 text-xs font-medium leading-relaxed ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>
                Bugünkü hedefin hazır; tekrarlarını, denemeni ve konu çalışmanı aynı akıştan yönet.
              </p>
            </div>
          </div>
        </section>

        <SmartReviewPanel
          summary={panelSummary}
          loading={panelLoading}
          isLightTheme={isLightTheme}
          accentTheme={theme}
          appCardShell={appCardShell}
          topicRows={panelTopicRows}
          onStartReview={() => setView("studyCollection")}
        />

        <DashboardMembershipHero
          isLightTheme={isLightTheme}
          premiumActive={premiumActive}
          userData={userData}
          freeQuestionUsed={freeQuestionUsed}
          freeExamUsed={freeExamUsed}
          freeReviewUsed={freeReviewUsed}
          onOpenPremium={() => setView("premiumInfo")}
        />

        {/* İkincil katman: takvim, seri, hedef — ana hero ile rekabet etmez */}
        <section
          className="mb-5"
          aria-labelledby="planning-strip-heading"
        >
          <h2
            id="planning-strip-heading"
            className={`mb-3 text-[10px] font-black uppercase tracking-[0.28em] ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}
          >
            Takvim ve hedef
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          <TusCountDown isLightTheme={isLightTheme} />

          <StreakBadge userId={user?.uid} isLightTheme={isLightTheme} />

          {/* Hedef Paneli */}
          <div className={`${appCardShell} flex flex-col justify-center`}>
            {isEditingTarget ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => adjustTarget(-0.25)} className={`w-12 h-12 rounded-full text-rose-500 text-2xl font-bold transition-all ${isLightTheme ? "bg-slate-100 hover:bg-rose-100" : "bg-slate-800 hover:bg-rose-500/10"}`}>-</button>
                  <div className="text-center">
                    <span className={`text-4xl font-black ${isLightTheme ? "text-slate-900" : "text-white"}`}>{displayTempTarget.toFixed(2)}</span>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>Hedef Netin</p>
                  </div>
                  <button onClick={() => adjustTarget(0.25)} className={`w-12 h-12 rounded-full ${theme.text} text-2xl font-bold transition-all ${isLightTheme ? "bg-emerald-50 hover:bg-emerald-100" : `bg-slate-800 ${theme.softBg}`}`}>+</button>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={saveTarget} className={`flex-1 min-h-12 ${theme.primary} ${theme.primaryHover} text-slate-950 py-3 rounded-2xl font-black text-sm transition-all shadow-lg ${theme.glow} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isLightTheme ? "focus-visible:ring-offset-[#faf8f4]" : "focus-visible:ring-offset-slate-950"} ${theme.ring}`}>KAYDET</button>
                  <button type="button" onClick={() => setIsEditingTarget(false)} className={`px-4 py-3 rounded-2xl font-bold text-sm focus-visible:outline-none focus-visible:ring-2 ${isLightTheme ? "bg-slate-100 text-slate-600 border border-slate-300 focus-visible:ring-slate-400/50" : "bg-slate-800 text-slate-400 focus-visible:ring-slate-500/40"}`}>İPTAL</button>
                </div>
              </div>
            ) : (
              <div onClick={() => setIsEditingTarget(true)} className="group cursor-pointer text-center">
                <p className={`text-xs font-black uppercase tracking-[0.3em] mb-1 ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>Kişisel Hedefin</p>
                <div className="flex items-center justify-center gap-3">
                  <span className={`text-5xl font-black tracking-tighter ${isLightTheme ? "text-slate-950" : "text-white"}`}>{displayTarget.toFixed(2)}</span>
                  <span className={`${theme.text} text-xl animate-pulse`}>✎</span>
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${isLightTheme ? "text-slate-500" : "text-slate-600"}`}>Düzenlemek için tıkla</p>
              </div>
            )}
          </div>
          </div>
        </section>

        {/* Ana iki yol: deneme + çalışma alanı */}
        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">
        {/* ═══════════════════════════════════════════════════════
            HERO: DENEME KARTI — sitenin en değerli özelliği
        ═══════════════════════════════════════════════════════ */}
        <div
          onClick={() => setView("examSetSelect")}
          className={`group relative h-full min-h-0 overflow-hidden rounded-[2.25rem] border p-6 md:p-8 cursor-pointer transition-all duration-500 ${isLightTheme ? "border-slate-300 bg-gradient-to-br from-[#fffefb] via-[#faf8f4] to-[#ebe8e3] hover:border-slate-400 shadow-md" : `${theme.softBorder} bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900/80 hover:border-slate-500/70`}`}
        >
          {/* Arka plan ışıltısı */}
          <div className={`absolute -top-20 -right-20 w-72 h-72 ${theme.softBg} rounded-full blur-3xl transition-all duration-700 pointer-events-none`} />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex h-full flex-col gap-6 lg:flex-row lg:items-center">

            {/* Sol: Başlık + özellikler */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full ${theme.softBg} border ${theme.softBorder} ${theme.text} text-[10px] font-black uppercase tracking-widest`}>
                  Sabit Deneme Setleri
                </span>
              </div>

              <h2 className={`text-3xl md:text-4xl font-black tracking-tight mb-2 ${isLightTheme ? "text-slate-950" : "text-white"}`}>
                TUS Denemesi Çöz
              </h2>
              <p className={`text-sm md:text-base mb-6 max-w-md ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                {FIXED_EXAM_CARD_SUBTITLE}. Her kullanıcıda aynı soru seti ve sıra; bitince analiz ve tahmini puan raporu hazırlanır.
              </p>

              {/* Özellik etiketleri */}
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { icon: "📋", label: "Sabit set · aynı sıra" },
                  { icon: "🎯", label: "Tahmini TUS puanı" },
                  { icon: "⚠️", label: "Bu denemede zayıf konu özeti" },
                  { icon: "☁️", label: "Buluta otomatik kayıt" },
                ].map(f => (
                  <span key={f.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isLightTheme ? "bg-[#fffefb] border border-slate-300 text-slate-700 shadow-sm" : "bg-slate-800/80 border border-slate-700 text-slate-300"}`}>
                    <span>{f.icon}</span> {f.label}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl ${theme.primary} text-slate-950 font-black text-lg shadow-lg ${theme.glow} group-hover:scale-[1.01] transition-transform duration-300`}>
                  Denemeyi Başlat
                  <span className="text-xl">→</span>
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${isLightTheme ? "text-slate-500" : "text-slate-600"}`}>200 Soru · ~150 dk · Sabit set</span>
              </div>
            </div>

            {/* Sağ: Analiz önizlemesi (sahte ama gerçekçi) */}
            <div className="w-full shrink-0 lg:w-72">
              <div className={`border rounded-[2rem] p-5 backdrop-blur-sm ${isLightTheme ? "bg-[#fffefb] border-slate-300 shadow-sm" : "bg-slate-950/70 border-slate-800"}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${theme.primary} animate-ping inline-block`} />
                  Deneme Sonu Analiz Ekranı
                </p>

                {/* Sahte net kartları */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "Doğru", val: "89", color: "text-emerald-400" },
                    { label: "Yanlış", val: "21", color: "text-rose-400" },
                    { label: "Net", val: "83.75", color: "text-cyan-400" },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl p-2.5 text-center ${isLightTheme ? "border border-slate-200 bg-[#ebe9e4]" : "bg-slate-900"}`}>
                      <p className="text-[10px] text-slate-500 font-black uppercase">{s.label}</p>
                      <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* Sahte ders satırları */}
                <div className="space-y-2">
                  {[
                    { ders: "Dahiliye", oran: 82 },
                    { ders: "Patoloji", oran: 61 },
                    { ders: "Farmakoloji", oran: 44 },
                  ].map(r => (
                    <div key={r.ders} className="flex items-center gap-2">
                      <span className={`text-[10px] w-20 shrink-0 ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>{r.ders}</span>
                      <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isLightTheme ? "bg-slate-200" : "bg-slate-800"}`}>
                        <div
                          className={`h-full rounded-full ${r.oran >= 65 ? 'bg-emerald-500' : r.oran >= 45 ? 'bg-cyan-400' : 'bg-rose-500'}`}
                          style={{ width: `${r.oran}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold w-8 text-right ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>%{r.oran}</span>
                    </div>
                  ))}
                  <p className={`text-[10px] text-center pt-1 italic ${isLightTheme ? "text-slate-500" : "text-slate-600"}`}>+ tüm branşlar...</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className={`h-full min-h-0 rounded-[2.25rem] border p-5 md:p-7 ${isLightTheme ? "border-slate-300 bg-[#fffefb] shadow-md" : "border-emerald-300/20 bg-gradient-to-br from-slate-900 via-[#0b1326] to-emerald-950/20 shadow-[0_0_0_1px_rgba(16,185,129,0.08),0_28px_60px_-30px_rgba(16,185,129,0.35)]"}`}>
          <div className="min-w-0 space-y-4 md:space-y-5">
            <div className="min-w-0">
              <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.28em] ${theme.text}`}>
                ÇALIŞMA ALANIM
              </p>
              <h3 className={`mt-1 text-xl md:text-2xl font-black tracking-tight ${isLightTheme ? "text-slate-900" : "text-white"}`}>
                Tekrarlarını tek yerden yönet
              </h3>
              <p className={`mt-2 text-[13px] md:text-sm leading-snug line-clamp-2 ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>
                Yanlışların, favorilerin ve akıllı tekrar planın burada.
              </p>
              <p className={`mt-1.5 text-[11px] md:text-sm leading-snug line-clamp-2 md:line-clamp-none ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>
                Deneme net grafiğinle birlikte neyi tekrar etmen gerektiğini daha net gör.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 md:gap-3 min-w-0">
              <div className={`rounded-2xl border px-3 py-3 md:px-4 md:py-3.5 min-w-0 ${isLightTheme ? "border-slate-300 bg-[#f5f2ec]" : "border-slate-700/70 bg-slate-950/55"}`}>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-black">Yanlışlarım</p>
                <p className="mt-1 text-lg md:text-xl font-black text-rose-300 tabular-nums">{studySummary.wrongCount || 0}</p>
              </div>
              <div className={`rounded-2xl border px-3 py-3 md:px-4 md:py-3.5 min-w-0 ${isLightTheme ? "border-slate-300 bg-[#f5f2ec]" : "border-slate-700/70 bg-slate-950/55"}`}>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-black">Favorilerim</p>
                <p className="mt-1 text-lg md:text-xl font-black text-amber-300 tabular-nums">{studySummary.favoriteCount || 0}</p>
              </div>
              <div className={`rounded-2xl border px-3 py-3 md:px-4 md:py-3.5 min-w-0 ${isLightTheme ? "border-slate-300 bg-[#f5f2ec]" : "border-slate-700/70 bg-slate-950/55"}`}>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-black">Akıllı tekrar</p>
                <p className={`mt-1 text-lg md:text-xl font-black tabular-nums ${theme.text}`}>{smartDue || 0}</p>
              </div>
            </div>

            <div className={`rounded-2xl border px-3.5 py-3 md:px-4 md:py-3.5 ${isLightTheme ? "border-slate-300 bg-[#f5f2ec]" : "border-slate-800/80 bg-slate-950/45"}`}>
              <div className="flex flex-col gap-3 md:gap-3.5">
                <p className={`text-xs md:text-sm leading-relaxed ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                  {smartDue > 0
                    ? `Bugünkü tekrarın hazır: ${smartDue} soru`
                    : "Akıllı tekrar planın, yanlışların ve favorilerin biriktikçe oluşacak."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    trackClarityEvent("study_area_card_clicked");
                    setView("studyCollection");
                  }}
                  className={`w-full md:w-auto md:self-start min-h-12 px-5 md:px-6 rounded-2xl text-sm font-black text-slate-950 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isLightTheme ? "focus-visible:ring-offset-[#f5f2ec]" : "focus-visible:ring-offset-slate-950"} ${theme.primary} ${theme.primaryHover} shadow-lg ${theme.glow} ${theme.ring}`}
                >
                  Çalışma Alanını Aç
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Diğer araçlar */}
        <section className="mb-10" aria-labelledby="other-tools-heading">
          <h2
            id="other-tools-heading"
            className={`mb-3 text-xs font-black uppercase tracking-[0.22em] ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}
          >
            Diğer araçlar
          </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => openTopicSetup?.()}
            className={`group flex items-center gap-4 px-6 py-5 rounded-[2rem] transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isLightTheme ? "bg-[#fffefb] border border-slate-300 hover:border-slate-400 shadow-md focus-visible:ring-offset-[#faf8f4] focus-visible:ring-emerald-500/45" : "bg-slate-900 border border-slate-800 hover:border-slate-600 focus-visible:ring-offset-slate-950 focus-visible:ring-emerald-400/40"}`}
          >
            <span className="text-2xl">⚡</span>
            <div>
              <div className="flex items-center gap-2">
                <p className={`font-black text-sm ${isLightTheme ? "text-slate-900" : "text-white"}`}>Ders/Konu seçerek çöz</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  premiumActive
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30"
                    : "bg-amber-500/15 text-amber-300 border border-amber-400/30"
                }`}>
                  {premiumActive ? "Plus" : "Plus'a özel"}
                </span>
              </div>
              <p className={`text-[10px] font-medium ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>
                {premiumActive ? "Ders ve konuya göre sınırsız çöz" : "Free kullanıcılar için kilitli"}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setView("tracker")}
            className={`group relative flex items-center gap-4 px-7 py-6 rounded-[2rem] transition-all text-left hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isLightTheme ? "bg-gradient-to-br from-violet-100 via-fuchsia-50 to-cyan-100 border border-violet-300 hover:border-violet-400 shadow-md focus-visible:ring-offset-[#faf8f4] focus-visible:ring-violet-400/50" : "bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-400/20 border border-violet-300/35 hover:border-violet-200/70 shadow-[0_0_0_1px_rgba(167,139,250,0.15),0_24px_45px_-24px_rgba(167,139,250,0.65)] focus-visible:ring-offset-slate-950 focus-visible:ring-violet-400/45"}`}
          >
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_45%)] opacity-90 pointer-events-none" />
            <span className="relative z-10 text-3xl drop-shadow-[0_0_12px_rgba(167,139,250,0.85)]">🗺️</span>
            <div className="relative z-10">
              <p className={`font-black text-base tracking-tight ${isLightTheme ? "text-slate-900" : "text-white"}`}>Konu Yeterlilik Düzeyim</p>
              <p className={`text-[11px] font-semibold ${isLightTheme ? "text-violet-700" : "text-violet-100/80"}`}>Konu bazında ustalık, tekrar ve güç alanların</p>
            </div>
          </button>
        </div>
        </section>

        {isAdmin && (
          <div className="mb-10">
            <button
              type="button"
              onClick={() => setView("admin")}
              className={`px-5 py-3 rounded-2xl bg-amber-300 text-slate-950 font-black text-sm hover:brightness-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/60 focus-visible:ring-offset-2 ${isLightTheme ? "focus-visible:ring-offset-[#faf8f4]" : "focus-visible:ring-offset-slate-950"}`}
            >
              Admin Panel
            </button>
          </div>
        )}

        {/* BRANŞLAR */}
        <h2 className={`mb-2 text-2xl font-black tracking-tight ${isLightTheme ? "text-slate-900" : "text-white"}`}>
          Çalışılacak dersler
        </h2>
        {!premiumActive && (
          <p className={`text-xs mb-5 ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>
            Free planda günlük 30 soruya kadar aşağıdaki ders kartlarından çözebilirsiniz.
          </p>
        )}
        {["Temel", "Klinik"].map((type) => (
          <section key={type} className="mb-12">
            <div className={`mb-6 flex flex-col gap-3 rounded-[1.75rem] border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
              isLightTheme
                ? "border-slate-200 bg-white/70 shadow-sm"
                : "border-slate-800 bg-slate-900/45"
            }`}>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme.text}`}>
                  Branş seçimi
                </p>
                <h2 className={`mt-1 text-2xl font-black uppercase tracking-tighter ${isLightTheme ? "text-slate-900" : "text-white"}`}>
                  {type} Bilimler
                </h2>
              </div>
              <p className={`max-w-md text-sm font-medium leading-relaxed ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                {type === "Temel"
                  ? "Temel bilimlerde hızlı tekrar yap, hazır sorularla ritmini koru."
                  : "Klinik branşlarda vaka odaklı çözüm pratiğini güçlendir."}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {SUBJECTS.filter((s) => s.type === type).map((s) => (
                <SubjectCard
                  key={s.name}
                  subject={s}
                  count={SUBJECT_QUESTION_COUNTS[s.name] ?? 0}
                  wrongCount={wrongBySubject[s.name] || 0}
                  accentTheme={theme}
                  isLightTheme={isLightTheme}
                  onClick={() => startSubject(s.name)}
                />
              ))}
            </div>
          </section>
        ))}

        {typeof onOpenLegalPage === "function" ? (
          <Footer
            onOpenLegal={onOpenLegalPage}
            accentTheme={theme}
            accentThemeKey={accentThemeKey}
          />
        ) : null}

        {/* Alt navigasyon bar için boşluk — sadece mobil */}
        <div
          className="md:hidden"
          style={{ height: "calc(4.5rem + env(safe-area-inset-bottom))" }}
          aria-hidden="true"
        />

      </div>
    </div>
  );
}
