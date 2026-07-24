import React, { useEffect, useMemo, useState } from "react";
import { db, auth } from "../firebase";
import {
  doc, getDoc, setDoc,
} from "firebase/firestore";

import SubjectCard from "./SubjectCard";
import { SUBJECTS } from "../data/subjects";
import { FIXED_EXAM_CARD_SUBTITLE } from "../data/exams";
import { SUBJECT_QUESTION_COUNTS } from "../data/questions";
import { accentThemes } from "../theme/accentThemes";
import { isUserPremium } from "../utils/premiumUtils";
import { canShowExternalPayments } from "../utils/device";
import { setClarityTag, trackClarityEvent } from "../lib/clarity";
import DashboardProfileMenu from "./DashboardProfileMenu";
import { getMailtoFeedback, getMailtoPaymentIssue } from "../config/support";
import Footer from "./layout/Footer";
import { getStreak } from "../services/streakService";
import { getSmartReviews } from "../services/smartReviewService";
import { groupReviewsBySubject } from "../utils/smartReviewUtils";
import { FREE_LIMITS } from "../config/limits";
import { useToast } from "../context/ToastContext";

const ACCENT_HEX = {
  emerald: "#34d399",
  cyan: "#22d3ee",
  violet: "#a78bfa",
  amber: "#fbbf24",
  light: "#10b981",
};

const accentHex = (key) => ACCENT_HEX[key] || ACCENT_HEX.emerald;

/** TUS tarihine kalan süre (TusCountDown ile aynı hedef). */
const TUS_TARGET_DATE = new Date("2026-08-24T10:00:00");
function getTusCountdown() {
  const diff = TUS_TARGET_DATE - new Date();
  if (diff <= 0) return { finished: true, months: 0, days: 0, totalDays: 0 };
  const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { finished: false, months: Math.floor(totalDays / 30), days: totalDays % 30, totalDays };
}

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
      FREE_LIMITS.dailyQuestions - (Number.isFinite(questionRemaining) ? questionRemaining : FREE_LIMITS.dailyQuestions)
    ),
    examUsed: Math.max(0, FREE_LIMITS.monthlyFullExams - (Number.isFinite(examRemaining) ? examRemaining : FREE_LIMITS.monthlyFullExams)),
    reviewUsed: Math.max(
      0,
      FREE_LIMITS.dailyReviewQuestions - (Number.isFinite(reviewRemaining) ? reviewRemaining : FREE_LIMITS.dailyReviewQuestions)
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
  /** Misafir modu göstergesi (opsiyonel) */
  isGuest = false,
  guestRemaining = null,
  onGuestLogin,
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
      : "min-h-dvh bg-[#05070d] text-white");
  const hex = accentHex(accentThemeKey);
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
  const [planStreak, setPlanStreak] = useState(0);
  const [wrongBySubject, setWrongBySubject] = useState({});
  const tusLeft = useMemo(() => getTusCountdown(), []);
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

  // Seri + ders bazlı yanlış rozetleri — tek hafif yükleme.
  useEffect(() => {
    if (!user?.uid) {
      setPlanStreak(0);
      setWrongBySubject({});
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const [streakSnap, reviews] = await Promise.all([
          getStreak(user.uid),
          getSmartReviews(user),
        ]);
        if (!active) return;
        setPlanStreak(streakSnap?.currentStreak ?? 0);
        setWrongBySubject(groupReviewsBySubject(reviews));
      } catch {
        if (!active) return;
        setPlanStreak(0);
        setWrongBySubject({});
      }
    };
    load();
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
    if (!currentUser) {
      // Misafir/oturumsuz: yerel değeri güncelle, uyar.
      const saved = toSafeTargetScore(tempTarget);
      setMyTarget(saved);
      setIsEditingTarget(false);
      showToast("Hedefi kaydetmek için giriş yapın.", { type: "info" });
      return;
    }
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

  const priorityChips = [
    ...smartTopSubjects.slice(0, 2).map((s) => s.name),
    ...smartTopTopics.slice(0, 1).map((t) => t.name),
  ].filter(Boolean);

  const statCell = isLightTheme
    ? "border-slate-200 bg-white"
    : "border-white/[0.06] bg-white/[0.03]";

  return (
    <div
      className={`${pageClasses} px-4 py-6 md:px-8 md:py-10 font-sans`}
      style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top))" }}
    >
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <header className="flex items-center justify-between mb-6 gap-3">
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
          {user ? (
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
          ) : isGuest ? (
            <button
              type="button"
              onClick={() => onGuestLogin?.()}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black transition-all active:scale-95 ${
                isLightTheme
                  ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  : "border-white/[0.12] bg-white/[0.05] text-slate-200 hover:bg-white/[0.09]"
              }`}
            >
              <span aria-hidden>👤</span>
              Misafir
              {guestRemaining != null ? (
                <span className="rounded-full bg-slate-950/10 px-1.5 py-0.5 tabular-nums" style={{ color: hex }}>
                  {guestRemaining}/10
                </span>
              ) : null}
              <span className={isLightTheme ? "text-emerald-600" : theme.text}>· Giriş yap</span>
            </button>
          ) : null}
        </header>

        {/* ═══ 1. AKILLI TEKRAR — tek güçlü karar alanı ═══ */}
        <section
          className={`relative mb-5 overflow-hidden rounded-[28px] border px-5 py-6 backdrop-blur-xl md:px-7 ${
            isLightTheme
              ? "border-slate-200 bg-white/80 text-slate-950 shadow-sm"
              : "border-white/[0.08] bg-white/[0.03] text-white shadow-[0_24px_60px_-44px_rgba(0,0,0,0.9)]"
          }`}
          aria-labelledby="smart-review-heading"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl"
            style={{ background: `${hex}16` }}
          />

          <div className="relative">
            {/* rozet satırı */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]"
                style={{ borderColor: `${hex}40`, color: hex, backgroundColor: `${hex}14` }}
              >
                <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hex }} />
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
              className={`mt-3 text-[11px] font-black uppercase tracking-[0.28em] ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}
            >
              Bugünkü Tekrarım
            </h2>

            <div className="mt-1.5" role="status" aria-live="polite">
              {smartDue > 0 ? (
                <>
                  <span className="sr-only">Bugün {smartDue} soru hazır.</span>
                  <p className={`text-balance text-[1.55rem] font-black leading-[1.15] tracking-tight md:text-3xl ${isLightTheme ? "text-slate-950" : "text-white"}`}>
                    <span style={{ color: hex }}>{smartDue}</span> yüksek verimli tekrar hazır
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
            {smartDue > 0 && priorityChips.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className={`text-[11px] font-bold uppercase tracking-wide ${isLightTheme ? "text-slate-400" : "text-slate-500"}`}>
                  Öncelik
                </span>
                {priorityChips.map((name) => (
                  <span
                    key={name}
                    className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${
                      isLightTheme
                        ? "border-slate-200 bg-slate-50 text-slate-700"
                        : "border-white/10 bg-white/[0.05] text-slate-200"
                    }`}
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}

            {/* CTA — mobilde full width */}
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
                className={`group relative flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl px-6 text-base font-black text-slate-950 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 sm:w-auto sm:self-start sm:px-8 ${isLightTheme ? "focus-visible:ring-offset-white" : "focus-visible:ring-offset-slate-950"}`}
                style={{ backgroundColor: hex, boxShadow: `0 14px 34px -22px ${hex}` }}
              >
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

        {/* ═══ 2. Tek satır özet: Seri · Hedef net · TUS geri sayım ═══ */}
        <section className="mb-5" aria-label="Günün özeti">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className={`rounded-2xl border px-3 py-3 text-center ${statCell}`}>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Seri</p>
              <p className={`mt-1 text-2xl font-black tabular-nums md:text-3xl ${isLightTheme ? "text-slate-950" : "text-white"}`}>{planStreak}</p>
              <p className="text-[10px] font-semibold text-slate-500">gün</p>
            </div>

            <button
              type="button"
              onClick={() => { setTempTarget(displayTarget); setIsEditingTarget((v) => !v); }}
              className={`rounded-2xl border px-3 py-3 text-center transition-all active:scale-[0.98] ${statCell} ${isEditingTarget ? "ring-2" : ""}`}
              style={isEditingTarget ? { boxShadow: `0 0 0 2px ${hex}55` } : undefined}
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Hedef net</p>
              <p className={`mt-1 text-2xl font-black tabular-nums md:text-3xl ${isLightTheme ? "text-slate-950" : "text-white"}`}>{displayTarget.toFixed(2)}</p>
              <p className={`text-[10px] font-semibold ${isLightTheme ? "text-emerald-600" : theme.text}`}>düzenle ✎</p>
            </button>

            <div className={`rounded-2xl border px-3 py-3 text-center ${statCell}`}>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">TUS’a kalan</p>
              <p className={`mt-1 text-2xl font-black tabular-nums md:text-3xl ${isLightTheme ? "text-slate-950" : "text-white"}`}>
                {tusLeft.finished ? "🎉" : tusLeft.months > 0 ? `${tusLeft.months}a ${tusLeft.days}g` : `${tusLeft.days}g`}
              </p>
              <p className="text-[10px] font-semibold text-slate-500">{tusLeft.finished ? "TUS günü" : "yaklaşık"}</p>
            </div>
          </div>

          {/* Hedef net düzenleyici — açılır */}
          {isEditingTarget && (
            <div className={`mt-2.5 rounded-2xl border p-3 ${statCell}`}>
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => adjustTarget(-0.25)} className={`w-11 h-11 rounded-full text-rose-500 text-2xl font-bold transition-all ${isLightTheme ? "bg-slate-100 hover:bg-rose-100" : "bg-white/[0.06] hover:bg-rose-500/10"}`}>-</button>
                <div className="text-center">
                  <span className={`text-3xl font-black ${isLightTheme ? "text-slate-900" : "text-white"}`}>{displayTempTarget.toFixed(2)}</span>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>Hedef Netin</p>
                </div>
                <button type="button" onClick={() => adjustTarget(0.25)} className={`w-11 h-11 rounded-full ${theme.text} text-2xl font-bold transition-all ${isLightTheme ? "bg-emerald-50 hover:bg-emerald-100" : `bg-white/[0.06] ${theme.softBg}`}`}>+</button>
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={saveTarget} className={`flex-1 min-h-11 ${theme.primary} ${theme.primaryHover} text-slate-950 py-2.5 rounded-xl font-black text-sm transition-all shadow-lg ${theme.glow}`}>KAYDET</button>
                <button type="button" onClick={() => setIsEditingTarget(false)} className={`px-4 py-2.5 rounded-xl font-bold text-sm ${isLightTheme ? "bg-slate-100 text-slate-600 border border-slate-300" : "bg-white/[0.06] text-slate-400 border border-white/[0.08]"}`}>İPTAL</button>
              </div>
            </div>
          )}
        </section>

        {/* ═══ 3. Plan durumu — ince şerit ═══ */}
        <section className="mb-6">
          {isGuest ? (
            <div className={`flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 ${
              isLightTheme ? "border-amber-200 bg-amber-50" : "border-amber-400/20 bg-amber-500/[0.08]"
            }`}>
              <span aria-hidden>👤</span>
              <span className={`text-sm font-black ${isLightTheme ? "text-amber-800" : "text-amber-200"}`}>Misafir modu</span>
              <span className="text-xs font-bold" style={{ color: hex }}>
                kalan {guestRemaining ?? 0}/10 soru
              </span>
              <button
                type="button"
                onClick={() => onGuestLogin?.()}
                className={`ml-auto shrink-0 rounded-xl px-3 py-1.5 text-xs font-black transition ${isLightTheme ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white/90 text-slate-950 hover:bg-white"}`}
              >
                Giriş yap
              </button>
            </div>
          ) : premiumActive ? (
            <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
              isLightTheme ? "border-emerald-200 bg-emerald-50" : "border-emerald-400/20 bg-emerald-500/[0.08]"
            }`}>
              <span className="text-lg" aria-hidden>◆</span>
              <div className="min-w-0">
                <p className={`text-sm font-black ${isLightTheme ? "text-emerald-800" : "text-emerald-200"}`}>Plus aktif</p>
                <p className={`text-xs font-medium ${isLightTheme ? "text-emerald-700/80" : "text-emerald-300/80"}`}>Sınırsız soru, deneme ve tekrar açık.</p>
              </div>
            </div>
          ) : (
            <div className={`flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 ${
              isLightTheme ? "border-slate-200 bg-white" : "border-white/[0.08] bg-white/[0.025]"
            }`}>
              <span className={`text-xs font-bold ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>Bugün</span>
              <span className="text-xs font-black tabular-nums" style={{ color: hex }}>{freeQuestionUsed}/{FREE_LIMITS.dailyQuestions} soru</span>
              <span className="text-slate-500">·</span>
              <span className="text-xs font-black tabular-nums text-slate-400">Deneme {freeExamUsed}/{FREE_LIMITS.monthlyFullExams}</span>
              <span className="text-slate-500">·</span>
              <span className="text-xs font-black tabular-nums text-slate-400">Tekrar {freeReviewUsed}/{FREE_LIMITS.dailyReviewQuestions}</span>
              {showPlusBadges ? (
                <button
                  type="button"
                  onClick={() => setView("premiumInfo")}
                  className={`ml-auto shrink-0 rounded-xl px-3 py-1.5 text-xs font-black transition ${isLightTheme ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:brightness-105" : "bg-gradient-to-r from-amber-400 to-orange-600 text-slate-950 hover:brightness-110"}`}
                >
                  Plus’ı İncele
                </button>
              ) : null}
            </div>
          )}
        </section>

        {/* ═══ 4. İki ana yol: Çalışma Alanı + Deneme ═══ */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* ÇALIŞMA ALANI */}
          <div
            onClick={() => {
              trackClarityEvent("study_area_card_clicked");
              setView("studyCollection");
            }}
            className={`group relative cursor-pointer overflow-hidden rounded-[1.75rem] border p-5 transition-all duration-300 ${
              isLightTheme
                ? "border-slate-200 bg-white shadow-sm hover:shadow-md"
                : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.14]"
            }`}
          >
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: hex }}>ÇALIŞMA ALANIM</p>
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/25 bg-violet-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-violet-300">✨ AI</span>
            </div>
            <h3 className={`mt-3 text-xl font-black tracking-tight ${isLightTheme ? "text-slate-900" : "text-white"}`}>
              Tekrar · Yanlış · Favori
            </h3>
            <p className={`mt-1.5 text-sm leading-relaxed ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
              FSRS planın, AI önerilerin ve koleksiyonların tek akışta.
            </p>
            <div
              className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl text-sm font-black text-slate-950 transition-transform duration-300 group-hover:-translate-y-0.5"
              style={{ backgroundColor: hex, boxShadow: `0 14px 34px -22px ${hex}` }}
            >
              Çalışma Alanına Gir
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
          </div>

          {/* DENEME */}
          <div
            onClick={() => setView("examSetSelect")}
            className={`group relative cursor-pointer overflow-hidden rounded-[1.75rem] border p-5 transition-all duration-300 ${isLightTheme ? "border-slate-200 bg-white shadow-sm hover:shadow-md" : "border-white/[0.08] bg-white/[0.025] hover:border-white/[0.14]"}`}
          >
            <span className={`inline-flex px-3 py-1 rounded-full ${theme.softBg} border ${theme.softBorder} ${theme.text} text-[10px] font-black uppercase tracking-widest`}>
              Sabit Deneme Setleri
            </span>
            <h2 className={`mt-3 text-xl font-black tracking-tight ${isLightTheme ? "text-slate-950" : "text-white"}`}>
              TUS Denemesi Çöz
            </h2>
            <p className={`mt-1.5 text-sm leading-relaxed ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
              {FIXED_EXAM_CARD_SUBTITLE}. Bitince analiz ve tahmini puan raporu hazırlanır.
            </p>
            <div className={`mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl ${theme.primary} text-slate-950 font-black text-sm shadow-lg ${theme.glow} group-hover:-translate-y-0.5 transition-transform duration-300`}>
              Denemeyi Başlat →
            </div>
            <p className={`mt-2 text-center text-[11px] font-bold uppercase tracking-wider ${isLightTheme ? "text-slate-500" : "text-slate-600"}`}>200 Soru · ~150 dk</p>
          </div>
        </div>

        {/* Ders/Konu seçerek çöz — ikincil aksiyon */}
        <button
          type="button"
          onClick={() => openTopicSetup?.()}
          className={`group mb-8 flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isLightTheme ? "border-slate-200 bg-white hover:border-slate-300 shadow-sm focus-visible:ring-offset-[#faf8f4] focus-visible:ring-emerald-500/45" : "border-white/[0.08] bg-white/[0.025] hover:border-white/[0.14] focus-visible:ring-offset-slate-950 focus-visible:ring-white/30"}`}
        >
          <span className="text-2xl">⚡</span>
          <div className="min-w-0 flex-1">
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
            <p className={`text-[11px] font-medium ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>
              {premiumActive ? "Ders ve konuya göre sınırsız çöz" : "Dahiliye → Nefroloji gibi hedefli test oluştur"}
            </p>
          </div>
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 shrink-0 ${isLightTheme ? "text-slate-400" : "text-slate-500"}`}>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>

        {isAdmin && (
          <div className="mb-8">
            <button
              type="button"
              onClick={() => setView("admin")}
              className={`px-5 py-3 rounded-2xl bg-amber-300 text-slate-950 font-black text-sm hover:brightness-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/60 focus-visible:ring-offset-2 ${isLightTheme ? "focus-visible:ring-offset-[#faf8f4]" : "focus-visible:ring-offset-slate-950"}`}
            >
              Admin Panel
            </button>
          </div>
        )}

        {/* ═══ 5. BRANŞLAR ═══ */}
        <h2 className={`mb-2 text-2xl font-black tracking-tight ${isLightTheme ? "text-slate-900" : "text-white"}`}>
          Çalışılacak dersler
        </h2>
        {!premiumActive && (
          <p className={`text-xs mb-5 ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>
            Free planda günlük 30 soruya kadar aşağıdaki ders kartlarından çözebilirsiniz.
          </p>
        )}
        {["Temel", "Klinik"].map((type) => (
          <section key={type} className="mb-10">
            <div className={`mb-5 flex flex-col gap-2 rounded-[1.5rem] border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
              isLightTheme
                ? "border-slate-200 bg-white shadow-sm"
                : "border-white/[0.07] bg-white/[0.025] backdrop-blur-xl"
            }`}>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme.text}`}>
                  Branş seçimi
                </p>
                <h2 className={`mt-1 text-xl font-black uppercase tracking-tighter ${isLightTheme ? "text-slate-900" : "text-white"}`}>
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
