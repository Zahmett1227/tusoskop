import React, { useEffect, useMemo, useState } from "react";
import {
  TOPIC_STUDY_COUNT_OPTIONS,
  countQuestionsByTopic,
  filterTopicsBySearch,
  formatStudyStartLabel,
  resolveTopicStudyCount,
  sortedTopicNames,
} from "../utils/topicStudyUtils";
import {
  buildResumePlan,
  formatLastStudyCountLabel,
  getRecentTopicStudies,
  recentStudyKey,
} from "../utils/topicStudyMemory";
import { getWrongReviewCardCopy } from "../utils/questionSetupWrongCard";

export default function QuestionSetupScreen({
  subjectCatalog,
  subjectQuestionCounts,
  selectedLesson,
  setSelectedLesson,
  selectedTopic,
  setSelectedTopic,
  ensureSubjectQuestions,
  startTopicTest,
  goDashboard,
  wrongCount = 0,
  onStartWrongReview,
}) {
  const [topicSearch, setTopicSearch] = useState("");
  const [studyCount, setStudyCount] = useState(20);
  const [topicCountMap, setTopicCountMap] = useState(() => new Map());
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [recentPlans, setRecentPlans] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const knownSubjectNames = useMemo(
    () => new Set((subjectCatalog || []).map((s) => s.name)),
    [subjectCatalog]
  );

  useEffect(() => {
    let cancelled = false;
    setRecentLoading(true);
    (async () => {
      const memories = getRecentTopicStudies().filter((m) => knownSubjectNames.has(m.ders));
      const topicCache = new Map();
      const plans = [];
      for (const memory of memories) {
        if (cancelled) break;
        let map = topicCache.get(memory.ders);
        if (!map) {
          try {
            if (typeof ensureSubjectQuestions !== "function") continue;
            const list = await ensureSubjectQuestions(memory.ders);
            map = countQuestionsByTopic(list, memory.ders);
            topicCache.set(memory.ders, map);
          } catch {
            continue;
          }
        }
        const plan = buildResumePlan(memory, map, memory.ders);
        if (plan) {
          plans.push({ id: recentStudyKey(memory), ...plan });
        }
      }
      if (!cancelled) {
        setRecentPlans(plans);
        setRecentLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [knownSubjectNames, ensureSubjectQuestions]);

  const temelSubjects = useMemo(
    () => (subjectCatalog || []).filter((s) => s.type === "Temel"),
    [subjectCatalog]
  );
  const klinikSubjects = useMemo(
    () => (subjectCatalog || []).filter((s) => s.type === "Klinik"),
    [subjectCatalog]
  );

  useEffect(() => {
    if (!selectedLesson) {
      setTopicCountMap(new Map());
      setLoadError("");
      return;
    }
    let cancelled = false;
    setLoadingTopics(true);
    setLoadError("");
    (async () => {
      try {
        if (typeof ensureSubjectQuestions !== "function") {
          if (!cancelled) setLoadError("Konu listesi yüklenemedi.");
          return;
        }
        const list = await ensureSubjectQuestions(selectedLesson);
        if (cancelled) return;
        setTopicCountMap(countQuestionsByTopic(list, selectedLesson));
      } catch {
        if (!cancelled) setLoadError("Konu listesi yüklenemedi.");
      } finally {
        if (!cancelled) setLoadingTopics(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedLesson, ensureSubjectQuestions]);

  const allTopics = useMemo(() => sortedTopicNames(topicCountMap), [topicCountMap]);
  const visibleTopics = useMemo(
    () => filterTopicsBySearch(allTopics, topicSearch),
    [allTopics, topicSearch]
  );

  const topicQuestionCount = selectedTopic ? topicCountMap.get(selectedTopic) || 0 : 0;
  const resolvedCount = resolveTopicStudyCount(studyCount, topicQuestionCount);
  const canStart =
    Boolean(selectedLesson) &&
    Boolean(selectedTopic) &&
    topicQuestionCount > 0 &&
    resolvedCount > 0 &&
    !loadingTopics;

  const handleSelectLesson = (name) => {
    const lesson = typeof name === "string" ? name : name?.name;
    if (!lesson) return;
    if (typeof setSelectedLesson !== "function") {
      throw new Error("QuestionSetupScreen: setSelectedLesson prop must be a function");
    }
    if (typeof setSelectedTopic !== "function") {
      throw new Error("QuestionSetupScreen: setSelectedTopic prop must be a function");
    }
    setSelectedLesson(lesson);
    setSelectedTopic("");
    setTopicSearch("");
    setStudyCount(20);
    setLoadError("");
  };

  const handleStart = () => {
    if (!selectedLesson) {
      window.alert("Lütfen bir ders seçin.");
      return;
    }
    if (!selectedTopic) {
      window.alert("Lütfen bir konu seçin.");
      return;
    }
    if (topicQuestionCount < 1) {
      window.alert("Bu konuda henüz soru bulunmuyor.");
      return;
    }
    startTopicTest(studyCount);
  };

  const handleContinueRecent = async (plan) => {
    if (!plan) return;
    const { memory, countMode } = plan;
    setSelectedLesson(memory.ders);
    setSelectedTopic(memory.konu);
    setStudyCount(countMode);
    setTopicSearch("");
    await startTopicTest(countMode, {
      ders: memory.ders,
      konu: memory.konu,
      countMode,
    });
  };

  const wrongCard = getWrongReviewCardCopy(wrongCount);

  const renderSubjectCard = (subject) => {
    const count = subjectQuestionCounts?.[subject.name] ?? 0;
    const selected = selectedLesson === subject.name;
    return (
      <button
        key={subject.name}
        type="button"
        onClick={() => handleSelectLesson(subject.name)}
        className={`rounded-2xl border p-3 text-left transition-all min-h-[4.5rem] ${
          selected
            ? "border-emerald-500/80 bg-emerald-500/15 ring-1 ring-emerald-500/40"
            : "border-slate-800 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-900/80"
        }`}
      >
        <p className="font-bold text-sm text-slate-100 leading-snug break-words">{subject.name}</p>
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">
          {count} soru
        </p>
      </button>
    );
  };

  const renderCountOption = (option) => {
    const isAll = option === "all";
    const label = isAll ? "Tüm konu" : `${option} soru`;
    const disabled =
      !selectedTopic ||
      topicQuestionCount < 1 ||
      (!isAll && option > topicQuestionCount);
    const selected = studyCount === option;
    const hint =
      !isAll && selectedTopic && option > topicQuestionCount
        ? `Bu konuda yalnızca ${topicQuestionCount} soru var`
        : null;

    return (
      <div key={String(option)} className="flex flex-col gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setStudyCount(option)}
          className={`min-h-11 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
            selected
              ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
              : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600 disabled:opacity-40"
          }`}
        >
          {label}
        </button>
        {hint ? <span className="text-[10px] text-amber-400/90 px-1">{hint}</span> : null}
      </div>
    );
  };

  return (
    <div
      className="min-h-dvh bg-slate-950 text-white p-4 md:p-8 overflow-y-auto"
      style={{
        paddingTop: "calc(1rem + env(safe-area-inset-top))",
        paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <header>
          <button
            type="button"
            onClick={goDashboard}
            className="text-sm font-bold text-slate-500 hover:text-slate-300 mb-4"
          >
            ← Panele dön
          </button>
          <h2 className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tight">
            Konu seçerek çöz
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl">
            Konu seç, kısa bir çalışma oturumu başlat.
          </p>
        </header>

        <section className="bg-rose-500/10 border border-rose-500/30 rounded-[1.75rem] p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <p className="font-bold text-white">Yanlışlarımdan tekrar</p>
            <p className="text-sm text-slate-400 mt-1">Son yanlışlarını kısa bir oturumda toparla.</p>
            {wrongCard.statusLine ? (
              <p className="text-xs text-slate-400 mt-1">{wrongCard.statusLine}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onStartWrongReview?.()}
            disabled={!wrongCard.canStart}
            className="shrink-0 min-h-11 px-5 py-2.5 rounded-xl bg-rose-500 text-slate-950 font-black text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {wrongCard.buttonLabel}
          </button>
        </section>

        {!recentLoading && recentPlans.length > 0 ? (
          <section className="bg-slate-900/50 border border-slate-800 rounded-[1.75rem] p-4 md:p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/90 mb-3">
              Son çalışılan konular
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 sm:overflow-x-auto sm:pb-1">
              {recentPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="min-w-0 sm:min-w-[14rem] sm:flex-shrink-0 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3 flex flex-col gap-2"
                >
                  <p className="font-bold text-sm text-white break-words leading-snug">
                    {plan.memory.ders}
                  </p>
                  <p className="text-xs text-slate-300 break-words leading-snug">{plan.memory.konu}</p>
                  <p className="text-[10px] text-slate-500">
                    Son seçim: {formatLastStudyCountLabel(plan.countMode)}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleContinueRecent(plan)}
                    className="mt-auto min-h-10 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:opacity-90"
                  >
                    Devam et
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="bg-slate-900/50 border border-slate-800 rounded-[1.75rem] p-4 md:p-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-orange-400/90 mb-3">
            Temel Bilimler
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {temelSubjects.map(renderSubjectCard)}
          </div>
        </section>

        <section className="bg-slate-900/50 border border-slate-800 rounded-[1.75rem] p-4 md:p-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400/90 mb-3">
            Klinik Bilimler
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {klinikSubjects.map(renderSubjectCard)}
          </div>
        </section>

        {selectedLesson ? (
          <section className="bg-slate-900 border border-slate-800 rounded-[1.75rem] p-4 md:p-6 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-lg font-black text-white">{selectedLesson}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {loadingTopics
                    ? "Konular yükleniyor…"
                    : `${allTopics.length} konu · ${subjectQuestionCounts?.[selectedLesson] ?? 0} soru`}
                </p>
              </div>
              <input
                type="search"
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                placeholder="Konu ara…"
                disabled={loadingTopics || allTopics.length === 0}
                className="w-full sm:w-56 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:opacity-50"
              />
            </div>

            {loadError ? <p className="text-sm text-rose-400">{loadError}</p> : null}

            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-800 divide-y divide-slate-800/80">
              {loadingTopics ? (
                <p className="p-4 text-sm text-slate-500">Konular hazırlanıyor…</p>
              ) : visibleTopics.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">
                  {allTopics.length === 0 ? "Bu derste konu bulunamadı." : "Aramayla eşleşen konu yok."}
                </p>
              ) : (
                visibleTopics.map((topic) => {
                  const count = topicCountMap.get(topic) || 0;
                  const selected = selectedTopic === topic;
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setSelectedTopic(topic)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                        selected ? "bg-emerald-500/15" : "hover:bg-slate-800/60"
                      }`}
                    >
                      <span className="font-semibold text-sm text-slate-200 break-words flex-1 min-w-0">
                        {topic}
                      </span>
                      <span
                        className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${
                          selected
                            ? "bg-emerald-500/30 text-emerald-200"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {count} soru
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                Kaç soru çözmek istersin?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TOPIC_STUDY_COUNT_OPTIONS.map(renderCountOption)}
              </div>
            </div>

            <button
              type="button"
              onClick={handleStart}
              disabled={!canStart}
              className="w-full min-h-12 px-5 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-base hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {canStart
                ? formatStudyStartLabel(
                    studyCount === "all" ? "all" : resolveTopicStudyCount(studyCount, topicQuestionCount)
                  )
                : selectedTopic && topicQuestionCount < 1
                  ? "Bu konuda soru yok"
                  : "Ders ve konu seçin"}
            </button>
          </section>
        ) : (
          <p className="text-center text-sm text-slate-500 py-4">Başlamak için bir ders seçin.</p>
        )}
      </div>
    </div>
  );
}
