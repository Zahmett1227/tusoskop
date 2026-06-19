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
import { canShowExternalPayments } from "../utils/device";
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
import DashboardLeaderboardWidget from "./leaderboard/DashboardLeaderboardWidget";

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
  onOpenAccountSettings,
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
  const premiumActive = isUserPremium(userData, user);
  // iOS native'de Plus/free ayrımı yok; Plus rozetleri gizlenir.
  const showPlusBadges = canShowExternalPayments();
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
              onOpenAccountSettings={onOpenAccountSettings}
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

        {/* Akıllı Tekrar Kartı — mobil öncelikli premium hero CTA */}
        <section
          className={`relative mb-6 overflow-hidden rounded-3xl border px-5 py-5 shadow-xl backdrop-blur-xl md:px-7 md:py-6 ${
            isLightTheme
              ? "border-emerald-300/40 bg-white/70 text-slate-950 shadow-emerald-100/60"
              : "border-emerald-300/15 bg-slate-950/60 text-white shadow-black/40"
          }`}
          aria-labelledby="smart-review-heading"
        >
          {/* yumuşak premium glow — abartısız */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl"
          />

          <div className="relative">
            {/* rozet satırı */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
                  isLightTheme
                    ? "border-emerald-300/60 bg-emerald-50 text-emerald-700"
                    : "border-emerald-300/25 bg-emerald-400/10 text-emerald-300"
                }`}
              >
                <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                FSRS Akıllı Plan
              </span>
              {smartDue > 0 && smartOverdue > 0 && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                    isLightTheme
                      ? "border-amber-300/70 bg-amber-50 text-amber-700"
                      : "border-amber-300/25 bg-amber-400/10 text-amber-300"
                  }`}
                >
                  <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Gecikenler öncelikli
                </span>
              )}
            </div>

            {/* erişilebilir başlık — görünür eyebrow */}
            <h2
              id="smart-review-heading"
              className={`mt-3 text-[11px] font-black uppercase tracking-[0.28em] ${isLightTheme ? "text-emerald-700" : "text-emerald-300/80"}`}
            >
              Bugünkü Tekrarım
            </h2>

            <div className="mt-1.5" role="status" aria-live="polite">
              {smartDue > 0 ? (
                <>
                  <span className="sr-only">Bugün {smartDue} soru hazır.</span>
                  <p className={`text-balance text-[1.55rem] font-black leading-[1.15] tracking-tight md:text-3xl ${isLightTheme ? "text-slate-950" : "text-white"}`}>
                    <span className={isLightTheme ? "text-emerald-600" : "text-emerald-400"}>{smartDue}</span> yüksek verimli tekrar hazır
                  </p>
                  <p className={`mt-2 max-w-xl text-sm font-medium leading-relaxed ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>
                    Zorlandığın sorular bugün öne alındı.
                  </p>
                </>
              ) : (
                <>
                  <span className="sr-only">Bugün tekrar yok.</span>
                  <p className={`text-balance text-[1.45rem] font-black leading-[1.15] tracking-tight md:text-3xl ${isLightTheme ? "text-slate-950" : "text-white"}`}>
                    Bugün planlı tekrar yok
                  </p>
                  <p className={`mt-2 max-w-xl text-sm font-medium leading-relaxed ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>
                    Yeni konu çözerek planını besle; yanlış yaptığın sorular burada akıllıca zamanlanır.
                  </p>
                </>
              )}
            </div>

            {/* öncelik dersleri — chip formatı */}
            {smartDue > 0 && (smartTopSubjects.length > 0 || smartTopTopics.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className={`text-[11px] font-bold uppercase tracking-wide ${isLightTheme ? "text-slate-400" : "text-slate-500"}`}>
                  Öncelik
                </span>
                {[
                  ...smartTopSubjects.slice(0, 2).map((s) => s.name),
                  ...smartTopTopics.slice(0, 1).map((t) => t.name),
                ]
                  .filter(Boolean)
                  .map((name) => (
                    <span
                      key={name}
                      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${
                        isLightTheme
                          ? "border-slate-200 bg-slate-50 text-slate-700"
                          : "border-white/10 bg-white/[0.06] text-slate-200"
                      }`}
                    >
                      {name}
                    </span>
                  ))}
              </div>
            )}

            {/* CTA — mobilde full width, ~64px yükseklik */}
            <div className="mt-5">
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
                className="group relative flex min-h-[64px] w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 px-6 text-base font-black text-slate-950 shadow-[0_0_28px_rgba(45,212,191,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(45,212,191,0.4)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 sm:w-auto sm:self-start sm:px-8"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                />
                <span
                  aria-hidden="true"
                  className="relative flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/15 transition-transform duration-300 group-hover:scale-110"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 translate-x-px">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span className="relative">{smartDue > 0 ? "Akıllı Tekrara Başla" : "Çalışma Alanına Gir"}</span>
                {smartDue > 0 && (
                  <span className="relative inline-flex min-w-[1.75rem] items-center justify-center rounded-full bg-slate-950/20 px-2 py-0.5 text-sm font-black tabular-nums">
                    {smartDue}
                  </span>
                )}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="relative h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
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
          <div className="relative z-10">
            <h3 className={`max-w-3xl text-3xl font-black tracking-tight md:text-4xl ${isLightTheme ? "text-slate-950" : "text-white"}`}>
              Bugün ne çalışacağını tek bakışta gör.
            </h3>
            <p className={`mt-2 max-w-2xl text-sm font-medium leading-relaxed ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
              Seri, hedef net ve akıllı tekrar planın bir arada.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">
              {[
                ["Seri", planStreak, "gün"],
                ["Hedef net", displayTarget.toFixed(2), "kişisel"],
                ["Bugünkü tekrar", smartDue, "soru"],
              ].map(([label, value, suffix]) => (
                <div
                  key={label}
                  className={`rounded-2xl border px-3 py-3 text-center ${
                    isLightTheme
                      ? "border-white/80 bg-white/80 shadow-sm"
                      : "border-white/10 bg-white/[0.06] shadow-lg shadow-black/10"
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
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

        {/* Haftalık Sıralama widget'ı */}
        <DashboardLeaderboardWidget
          user={user}
          isLightTheme={isLightTheme}
          setView={setView}
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

        {/* Ana iki yol: çalışma alanı (öne) + deneme */}
        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">

        {/* ═══════════════════════════════════════════════════════
            HERO: ÇALIŞMA ALANI — uygulamanın kalbi
        ═══════════════════════════════════════════════════════ */}
        <div className={`relative h-full min-h-0 overflow-hidden rounded-[2.25rem] border p-5 md:p-7 ${
          isLightTheme
            ? "border-emerald-200/60 bg-[#fffefb] shadow-md"
            : "border-emerald-400/20 bg-gradient-to-br from-slate-900 via-[#0a1a1a] to-emerald-950/25 shadow-[0_0_0_1px_rgba(16,185,129,0.10),0_32px_64px_-28px_rgba(16,185,129,0.40)]"
        }`}>
          <div className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl ${theme.softBg}`} />
          <div className="pointer-events-none absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-cyan-400/8 blur-3xl" />

          <div className="relative z-10 min-w-0 space-y-4 md:space-y-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <p className={`text-[10px] font-black uppercase tracking-[0.28em] ${theme.text}`}>
                  ÇALIŞMA ALANIM
                </p>
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-violet-400">
                  ✨ AI Destekli
                </span>
              </div>
              <h3 className={`text-xl md:text-2xl font-black tracking-tight ${isLightTheme ? "text-slate-900" : "text-white"}`}>
                Tekrarlarını tek yerden yönet
              </h3>
              <p className={`mt-2 text-sm leading-relaxed ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>
                FSRS planın, AI önerilerin, yanlışların ve favorilerin burada. Her şey tek akışta.
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
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-black">FSRS Tekrar</p>
                <p className={`mt-1 text-lg md:text-xl font-black tabular-nums ${theme.text}`}>{smartDue || 0}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                trackClarityEvent("study_area_card_clicked");
                setView("studyCollection");
              }}
              className={`w-full min-h-12 rounded-2xl text-sm font-black text-slate-950 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isLightTheme ? "focus-visible:ring-offset-[#fffefb]" : "focus-visible:ring-offset-slate-950"} ${theme.primary} ${theme.primaryHover} shadow-lg ${theme.glow} ${theme.ring}`}
            >
              Çalışma Alanına Gir
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            DENEME KARTI
        ═══════════════════════════════════════════════════════ */}
        <div
          onClick={() => setView("examSetSelect")}
          className={`group relative h-full min-h-0 overflow-hidden rounded-[2.25rem] border p-6 md:p-8 cursor-pointer transition-all duration-500 ${isLightTheme ? "border-slate-300 bg-gradient-to-br from-[#fffefb] via-[#faf8f4] to-[#ebe8e3] hover:border-slate-400 shadow-md" : `${theme.softBorder} bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900/80 hover:border-slate-500/70`}`}
        >
          <div className={`absolute -top-20 -right-20 w-72 h-72 ${theme.softBg} rounded-full blur-3xl transition-all duration-700 pointer-events-none`} />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex h-full flex-col gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full ${theme.softBg} border ${theme.softBorder} ${theme.text} text-[10px] font-black uppercase tracking-widest`}>
                  Sabit Deneme Setleri
                </span>
              </div>
              <h2 className={`text-3xl md:text-4xl font-black tracking-tight mb-2 ${isLightTheme ? "text-slate-950" : "text-white"}`}>
                TUS Denemesi Çöz
              </h2>
              <p className={`text-sm mb-6 max-w-md ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                {FIXED_EXAM_CARD_SUBTITLE}. Bitince analiz ve tahmini puan raporu hazırlanır.
              </p>

              <div className="flex flex-wrap gap-2.5 mb-8">
                {[
                  { icon: "🎯", label: "Tahmini TUS puanı" },
                  { icon: "⚠️", label: "Zayıf konu özeti" },
                  { icon: "☁️", label: "Buluta otomatik kayıt" },
                ].map(f => (
                  <span key={f.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isLightTheme ? "bg-[#fffefb] border border-slate-300 text-slate-700 shadow-sm" : "bg-slate-800/80 border border-slate-700 text-slate-300"}`}>
                    <span>{f.icon}</span> {f.label}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className={`flex items-center justify-center gap-3 px-7 py-4 rounded-2xl ${theme.primary} text-slate-950 font-black text-base shadow-lg ${theme.glow} group-hover:scale-[1.01] transition-transform duration-300`}>
                  Denemeyi Başlat →
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${isLightTheme ? "text-slate-500" : "text-slate-600"}`}>200 Soru · ~150 dk</span>
              </div>
            </div>

            {/* Küçük analiz önizlemesi */}
            <div className={`border rounded-2xl p-4 ${isLightTheme ? "bg-[#fffefb] border-slate-200 shadow-sm" : "bg-slate-950/70 border-slate-800"}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${theme.primary} animate-ping inline-block`} />
                Deneme Sonu Analiz
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "Doğru", val: "89", color: "text-emerald-400" },
                  { label: "Yanlış", val: "21", color: "text-rose-400" },
                  { label: "Net",    val: "83.75", color: "text-cyan-400" },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl p-2 text-center ${isLightTheme ? "border border-slate-200 bg-[#ebe9e4]" : "bg-slate-900"}`}>
                    <p className="text-[10px] text-slate-500 font-black uppercase">{s.label}</p>
                    <p className={`text-base font-black ${s.color}`}>{s.val}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                {[{ ders: "Dahiliye", oran: 82 }, { ders: "Patoloji", oran: 61 }, { ders: "Farmakoloji", oran: 44 }].map(r => (
                  <div key={r.ders} className="flex items-center gap-2">
                    <span className={`text-[10px] w-20 shrink-0 ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>{r.ders}</span>
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isLightTheme ? "bg-slate-200" : "bg-slate-800"}`}>
                      <div className={`h-full rounded-full ${r.oran >= 65 ? "bg-emerald-500" : r.oran >= 45 ? "bg-cyan-400" : "bg-rose-500"}`} style={{ width: `${r.oran}%` }} />
                    </div>
                    <span className={`text-[10px] font-bold w-8 text-right ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>%{r.oran}</span>
                  </div>
                ))}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => openTopicSetup?.()}
            className={`group flex items-center gap-4 px-6 py-5 rounded-[2rem] transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isLightTheme ? "bg-[#fffefb] border border-slate-300 hover:border-slate-400 shadow-md focus-visible:ring-offset-[#faf8f4] focus-visible:ring-emerald-500/45" : "bg-slate-900 border border-slate-800 hover:border-slate-600 focus-visible:ring-offset-slate-950 focus-visible:ring-emerald-400/40"}`}
          >
            <span className="text-2xl">⚡</span>
            <div>
              <div className="flex items-center gap-2">
                <p className={`font-black text-sm ${isLightTheme ? "text-slate-900" : "text-white"}`}>Ders/Konu seçerek çöz</p>
                {showPlusBadges ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    premiumActive
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30"
                      : "bg-amber-500/15 text-amber-300 border border-amber-400/30"
                  }`}>
                    {premiumActive ? "Plus" : "Plus'a özel"}
                  </span>
                ) : null}
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
