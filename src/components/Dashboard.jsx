import React, { useEffect, useMemo, useState } from "react";
import { db, auth } from "../firebase";
import {
  doc, getDoc, setDoc,
} from "firebase/firestore";

import SubjectCard from "./SubjectCard";
import TusCountDown from "./TusCountDown";
import StreakBadge from "./StreakBadge";
import { SUBJECTS } from "../data/subjects";
import { QUESTIONS } from "../data/questions";
import { accentThemes } from "../theme/accentThemes";
import { PRICING } from "../constants/pricing";
import {
  formatPremiumUntil,
  getPremiumStatusLabel,
  isUserPremium,
} from "../utils/premiumUtils";
import {
  buildTodayReviewQueue,
  getStudyCollectionSummary,
} from "../services/studyCollectionService";
import { trackClarityEvent } from "../lib/clarity";

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
}) {
  const theme = accentTheme || accentThemes.emerald;
  const premiumActive = isUserPremium(userData);
  const planTitle = premiumActive ? "Plus aktif" : "Free plan";
  const planSubText = premiumActive
    ? "Tüm Plus özellikleri açık. Çalışma akışın sınırsız devam eder."
    : "Plus ile sınırsız soru, deneme, tekrar ve gelişmiş analiz açılır.";
  const premiumMeta = userData?.lifetimePremium
    ? "Ömür boyu erişim aktif"
    : premiumActive
    ? `${formatPremiumUntil(userData?.premiumUntil)} tarihine kadar aktif`
    : "Bugünkü kullanımını buradan takip edebilirsin.";
  const freeQuestionUsed = Math.max(0, 30 - (remainingUsage?.questionRemaining ?? 30));
  const freeExamUsed = Math.max(0, 1 - (remainingUsage?.fullExamRemaining ?? 1));
  const freeReviewUsed = Math.max(0, 10 - (remainingUsage?.reviewRemaining ?? 10));
  const [myTarget, setMyTarget] = useState(65.00);
  const [tempTarget, setTempTarget] = useState(65.00);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [studySummary, setStudySummary] = useState({
    wrongCount: 0,
    favoriteCount: 0,
    reviewQueueCount: 0,
  });
  const subjectCounts = useMemo(() => {
    const counts = {};
    QUESTIONS.forEach((item) => {
      counts[item.ders] = (counts[item.ders] || 0) + 1;
    });
    return counts;
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const loadTarget = async () => {
      const authed = auth.currentUser;
      if (!authed?.uid) return;
      try {
        const userDoc = await getDoc(doc(db, "users", authed.uid));
        if (userDoc.exists() && userDoc.data().targetScore) {
          const target = userDoc.data().targetScore;
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
    let active = true;
    const loadStudySummary = async () => {
      try {
        const [summary, queue] = await Promise.all([
          getStudyCollectionSummary(user, userData),
          buildTodayReviewQueue(user, QUESTIONS, userData),
        ]);
        if (!active) return;
        setStudySummary({
          wrongCount: summary?.wrongCount || 0,
          favoriteCount: summary?.favoriteCount || 0,
          reviewQueueCount: queue.length,
        });
      } catch {
        if (!active) return;
        setStudySummary({ wrongCount: 0, favoriteCount: 0, reviewQueueCount: 0 });
      }
    };
    loadStudySummary();
    return () => {
      active = false;
    };
  }, [user?.uid, currentView, userData]);

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
      await setDoc(doc(db, "users", currentUser.uid), {
        targetScore: tempTarget
      }, { merge: true });
      setMyTarget(tempTarget);
      setIsEditingTarget(false);
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  return (
    <div
      className={`min-h-dvh bg-slate-950 text-white px-4 py-6 md:px-8 md:py-10 font-sans ${theme.softBg}`}
      style={{ paddingTop: "calc(1.5rem + env(safe-area-inset-top))" }}
    >
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <header className="flex items-center justify-between mb-10 gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🩺</span>
            <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${theme.text}`}>TUSOSKOP</h1>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {Object.keys(accentThemes).map((key) => {
              const t = accentThemes[key];
              const active = accentThemeKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onAccentThemeChange?.(key)}
                  className={`w-8 h-8 rounded-full ${t.primary} border-2 transition-all ${active ? "border-white scale-110" : "border-slate-700 hover:border-slate-500"}`}
                  title={t.name}
                  aria-label={`${t.name} teması`}
                />
              );
            })}
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-slate-500 text-xs font-bold hidden sm:block truncate max-w-[160px]">
                {user.displayName || user.email}
              </span>
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 text-xs font-bold transition-all"
              >
                Çıkış
              </button>
            </div>
          )}
        </header>
        <div className="md:hidden flex items-center justify-center gap-2 mb-6">
          {Object.keys(accentThemes).map((key) => {
            const t = accentThemes[key];
            const active = accentThemeKey === key;
            return (
              <button
                key={`mobile-${key}`}
                type="button"
                onClick={() => onAccentThemeChange?.(key)}
                className={`w-7 h-7 rounded-full ${t.primary} border transition-all ${active ? "border-white scale-110" : "border-slate-700"}`}
                title={t.name}
                aria-label={`${t.name} teması`}
              />
            );
          })}
        </div>

        <div
          className={`mb-6 rounded-[2rem] border p-4 md:p-5 ${
            premiumActive
              ? "border-emerald-300/35 bg-gradient-to-br from-slate-900/95 via-emerald-950/20 to-violet-950/20"
              : "border-slate-700 bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-950"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 md:gap-6 items-start">
            <div className="min-w-0">
              <p className={`text-[10px] uppercase tracking-[0.22em] font-black ${premiumActive ? "text-emerald-300" : "text-slate-500"}`}>
                PLANIN
              </p>
              <h3 className={`text-xl md:text-2xl font-black mt-1 ${premiumActive ? theme.text : "text-white"}`}>
                {planTitle}
              </h3>
              <p className="text-sm text-slate-300 mt-1.5 leading-snug">{planSubText}</p>
              <p className={`text-xs mt-2 ${premiumActive ? "text-emerald-200/90" : "text-slate-400"}`}>{premiumMeta}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {premiumActive ? (
                  <>
                    <span className="px-3 py-1.5 rounded-full border border-emerald-300/25 bg-emerald-500/10 text-emerald-200 text-xs font-bold">
                      Sınırsız soru
                    </span>
                    <span className="px-3 py-1.5 rounded-full border border-violet-300/25 bg-violet-500/10 text-violet-200 text-xs font-bold">
                      Sınırsız deneme
                    </span>
                    <span className="px-3 py-1.5 rounded-full border border-cyan-300/25 bg-cyan-500/10 text-cyan-200 text-xs font-bold">
                      Sınırsız tekrar
                    </span>
                  </>
                ) : (
                  <>
                    <span className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-950/60 text-slate-200 text-xs font-bold">
                      Bugün: {freeQuestionUsed}/30 soru
                    </span>
                    <span className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-950/60 text-slate-200 text-xs font-bold">
                      Deneme: {freeExamUsed}/1
                    </span>
                    <span className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-950/60 text-slate-200 text-xs font-bold">
                      Tekrar: {freeReviewUsed}/10
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="w-full md:w-48 shrink-0">
              <div className={`rounded-2xl border px-4 py-3 ${
                premiumActive
                  ? "border-emerald-300/25 bg-emerald-500/10"
                  : "border-slate-700 bg-slate-950/70"
              }`}>
                <p className="text-[11px] text-slate-400 font-bold">Plus fiyatı</p>
                <p className={`text-lg font-black mt-0.5 ${premiumActive ? "text-emerald-200" : "text-white"}`}>
                  {PRICING.PLUS_MONTHLY_LABEL} / ay
                </p>
              </div>
              <button
                type="button"
                onClick={() => setView("premiumInfo")}
                className={`mt-2 w-full min-h-11 px-4 rounded-2xl text-sm font-black transition ${
                  premiumActive
                    ? "bg-slate-100 text-slate-950 hover:bg-white"
                    : `${theme.primary} ${theme.primaryHover} text-slate-950`
                }`}
              >
                {premiumActive ? "Plan Detayı" : "Plus'ı İncele"}
              </button>
            </div>
          </div>
        </div>

        {/* ÜST SATIR: GERİ SAYIM + HEDEF + SERİ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <TusCountDown />

          <StreakBadge userId={user?.uid} />

          {/* Hedef Paneli */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-6 flex flex-col justify-center">
            {isEditingTarget ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => adjustTarget(-0.25)} className="w-12 h-12 rounded-full bg-slate-800 text-rose-400 text-2xl font-bold hover:bg-rose-500/10 transition-all">-</button>
                  <div className="text-center">
                    <span className="text-4xl font-black text-white">{tempTarget.toFixed(2)}</span>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Hedef Netin</p>
                  </div>
                  <button onClick={() => adjustTarget(0.25)} className={`w-12 h-12 rounded-full bg-slate-800 ${theme.text} text-2xl font-bold ${theme.softBg} transition-all`}>+</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveTarget} className={`flex-1 ${theme.primary} ${theme.primaryHover} text-slate-950 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg ${theme.glow}`}>KAYDET</button>
                  <button onClick={() => setIsEditingTarget(false)} className="px-4 py-3 bg-slate-800 text-slate-400 rounded-2xl font-bold text-sm">İPTAL</button>
                </div>
              </div>
            ) : (
              <div onClick={() => setIsEditingTarget(true)} className="group cursor-pointer text-center">
                <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] mb-1">Kişisel Hedefin</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl font-black text-white tracking-tighter">{myTarget.toFixed(2)}</span>
                  <span className={`${theme.text} text-xl animate-pulse`}>✎</span>
                </div>
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-wider mt-2">Düzenlemek için tıkla</p>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            HERO: DENEME KARTI — sitenin en değerli özelliği
        ═══════════════════════════════════════════════════════ */}
        <div
          onClick={() => setView("examSetSelect")}
          className={`group relative overflow-hidden rounded-[3rem] border ${theme.softBorder} bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900/80 p-8 md:p-10 mb-6 cursor-pointer hover:border-slate-500/70 transition-all duration-500`}
        >
          {/* Arka plan ışıltısı */}
          <div className={`absolute -top-20 -right-20 w-72 h-72 ${theme.softBg} rounded-full blur-3xl transition-all duration-700 pointer-events-none`} />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-8">

            {/* Sol: Başlık + özellikler */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full ${theme.softBg} border ${theme.softBorder} ${theme.text} text-[10px] font-black uppercase tracking-widest`}>
                  Akıllı Deneme Sistemi
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                TUS Denemesi Çöz
              </h2>
              <p className="text-slate-400 text-sm md:text-base mb-6 max-w-md">
                200 soruluk gerçek TUS formatında deneme. Bitirince sana özel derin analiz ve tahmini puan raporu hazırlanır.
              </p>

              {/* Özellik etiketleri */}
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { icon: "📊", label: "Ders bazlı başarı analizi" },
                  { icon: "🎯", label: "Tahmini TUS puanı" },
                  { icon: "⚠️", label: "Zayıf konu tespiti" },
                  { icon: "☁️", label: "Buluta otomatik kayıt" },
                ].map(f => (
                  <span key={f.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold">
                    <span>{f.icon}</span> {f.label}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl ${theme.primary} text-slate-950 font-black text-lg shadow-lg ${theme.glow} group-hover:scale-[1.03] transition-transform duration-300`}>
                  Denemeyi Başlat
                  <span className="text-xl">→</span>
                </div>
                <span className="text-slate-600 text-xs font-bold uppercase tracking-wider">200 Soru • ~150 dk</span>
              </div>
            </div>

            {/* Sağ: Analiz önizlemesi (sahte ama gerçekçi) */}
            <div className="lg:w-72 shrink-0">
              <div className="bg-slate-950/70 border border-slate-800 rounded-[2rem] p-5 backdrop-blur-sm">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
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
                    <div key={s.label} className="bg-slate-900 rounded-xl p-2.5 text-center">
                      <p className="text-[9px] text-slate-500 font-black uppercase">{s.label}</p>
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
                      <span className="text-[10px] text-slate-400 w-20 shrink-0">{r.ders}</span>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${r.oran >= 65 ? 'bg-emerald-500' : r.oran >= 45 ? 'bg-cyan-400' : 'bg-rose-500'}`}
                          style={{ width: `${r.oran}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold w-8 text-right">%{r.oran}</span>
                    </div>
                  ))}
                  <p className="text-[9px] text-slate-600 text-center pt-1 italic">+ tüm branşlar...</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="mb-6 rounded-[2.25rem] border border-emerald-300/20 bg-gradient-to-br from-slate-900 via-[#0b1326] to-emerald-950/20 p-5 md:p-7 shadow-[0_0_0_1px_rgba(16,185,129,0.08),0_28px_60px_-30px_rgba(16,185,129,0.35)]">
          <div className="min-w-0 space-y-4 md:space-y-5">
            <div className="min-w-0">
              <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.28em] ${theme.text}`}>
                ÇALIŞMA ALANIM
              </p>
              <h3 className="mt-1 text-xl md:text-2xl font-black tracking-tight text-white">
                Tekrarlarını tek yerden yönet
              </h3>
              <p className="mt-2 text-[13px] md:text-sm text-slate-300 leading-snug line-clamp-2">
                Yanlışların, favorilerin ve bugünkü tekrar kuyruğun burada.
              </p>
              <p className="mt-1.5 text-[11px] md:text-sm text-slate-400 leading-snug line-clamp-2 md:line-clamp-none">
                Deneme net grafiğinle birlikte neyi tekrar etmen gerektiğini daha net gör.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 md:gap-3 min-w-0">
              <div className="rounded-2xl border border-slate-700/70 bg-slate-950/55 px-3 py-3 md:px-4 md:py-3.5 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-black">Yanlışlarım</p>
                <p className="mt-1 text-lg md:text-xl font-black text-rose-300 tabular-nums">{studySummary.wrongCount || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-700/70 bg-slate-950/55 px-3 py-3 md:px-4 md:py-3.5 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-black">Favorilerim</p>
                <p className="mt-1 text-lg md:text-xl font-black text-amber-300 tabular-nums">{studySummary.favoriteCount || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-700/70 bg-slate-950/55 px-3 py-3 md:px-4 md:py-3.5 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-black">Tekrar Kuyruğu</p>
                <p className={`mt-1 text-lg md:text-xl font-black tabular-nums ${theme.text}`}>{studySummary.reviewQueueCount || 0}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/45 px-3.5 py-3 md:px-4 md:py-3.5">
              <div className="flex flex-col gap-3 md:gap-3.5">
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  {studySummary.reviewQueueCount > 0
                    ? `Bugünkü tekrarın hazır: ${studySummary.reviewQueueCount} soru`
                    : "Tekrar kuyruğun, yanlışların ve favorilerin biriktikçe oluşacak."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    trackClarityEvent("study_area_card_clicked");
                    setView("studyCollection");
                  }}
                  className="w-full md:w-auto md:self-start min-h-11 px-5 md:px-6 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-emerald-500/90 via-teal-500/85 to-violet-500/85 hover:from-emerald-400 hover:via-teal-400 hover:to-violet-400 shadow-[0_10px_30px_-16px_rgba(45,212,191,0.9)] transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60"
                >
                  Çalışma Alanını Aç
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* İKİNCİL AKSİYONLAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <button
            onClick={() => openTopicSetup?.()}
            className="group flex items-center gap-4 px-6 py-5 rounded-[2rem] bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all text-left"
          >
            <span className="text-2xl">⚡</span>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-black text-sm text-white">Ders/Konu seçerek çöz</p>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  premiumActive
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30"
                    : "bg-amber-500/15 text-amber-300 border border-amber-400/30"
                }`}>
                  {premiumActive ? "Plus" : "Plus'a özel"}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                {premiumActive ? "Ders ve konuya göre sınırsız çöz" : "Free kullanıcılar için kilitli"}
              </p>
            </div>
          </button>
          <button
            onClick={() => setView("tracker")}
            className="group relative flex items-center gap-4 px-7 py-6 rounded-[2rem] bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-400/20 border border-violet-300/35 hover:border-violet-200/70 transition-all text-left shadow-[0_0_0_1px_rgba(167,139,250,0.15),0_24px_45px_-24px_rgba(167,139,250,0.65)] sm:scale-[1.03] hover:scale-[1.05]"
          >
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_45%)] opacity-90 pointer-events-none" />
            <span className="relative z-10 text-3xl drop-shadow-[0_0_12px_rgba(167,139,250,0.85)]">🗺️</span>
            <div className="relative z-10">
              <p className="font-black text-base text-white tracking-tight">Konu Yeterlilik Düzeyim</p>
              <p className="text-[11px] text-violet-100/80 font-semibold">Konu bazında ustalık, tekrar ve güç alanların</p>
            </div>
          </button>
          <button
            onClick={() => setView("suggestions")}
            className="group flex items-center gap-4 px-6 py-5 rounded-[2rem] bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all text-left"
          >
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-black text-sm text-white">Öneriler</p>
              <p className="text-[10px] text-slate-500 font-medium">Strateji & tavsiyeler</p>
            </div>
          </button>
        </div>

        {isAdmin && (
          <div className="mb-10">
            <button
              type="button"
              onClick={() => setView("admin")}
              className="px-5 py-3 rounded-2xl bg-amber-300 text-slate-950 font-black text-sm hover:brightness-95 transition"
            >
              Admin Panel
            </button>
          </div>
        )}

        {/* BRANŞLAR */}
        {!premiumActive && (
          <p className="text-xs text-slate-400 mb-5">
            Free planda günlük 30 soruya kadar aşağıdaki ders kartlarından çözebilirsiniz.
          </p>
        )}
        {["Temel", "Klinik"].map((type) => (
          <section key={type} className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{type} Bilimler</h2>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SUBJECTS.filter((s) => s.type === type).map((s) => (
                <SubjectCard
                  key={s.name}
                  subject={s}
                  count={subjectCounts[s.name] || 0}
                  accentTheme={theme}
                  onClick={() => startSubject(s.name)}
                />
              ))}
            </div>
          </section>
        ))}

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
