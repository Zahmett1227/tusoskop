/* eslint-disable react-refresh/only-export-components -- Provider + paylaşılan Context nesnesi */
import React, { createContext, useCallback, useMemo, useState } from "react";
import { loadAllQuestions, loadQuestionsForSubject } from "../data/questions";

export const QuestionsContext = createContext({
  questions: [],
  loading: false,
  error: null,
  ensureAllQuestions: async () => [],
  ensureSubjectQuestions: async () => [],
});

export function QuestionsProvider({ children }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadedSubjects, setLoadedSubjects] = useState(() => new Set());
  const [allLoaded, setAllLoaded] = useState(false);

  const ensureSubjectQuestions = useCallback(async (ders) => {
    if (!ders) return [];
    if (allLoaded || loadedSubjects.has(ders)) {
      return questions.filter((q) => q?.ders === ders);
    }
    setLoading(true);
    try {
      const list = await loadQuestionsForSubject(ders);
      setQuestions((prev) => {
        const byId = new Map(prev.map((q) => [q.id, q]));
        for (const q of list) byId.set(q.id, q);
        return [...byId.values()];
      });
      setLoadedSubjects((prev) => new Set(prev).add(ders));
      setError(null);
      return list;
    } catch (err) {
      console.error("Ders soru paketi yüklenemedi:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [allLoaded, loadedSubjects, questions]);

  const ensureAllQuestions = useCallback(async () => {
    if (allLoaded) return questions;
    setLoading(true);
    try {
      const list = await loadAllQuestions();
      setQuestions(list);
      setLoadedSubjects(new Set(list.map((q) => q?.ders).filter(Boolean)));
      setAllLoaded(true);
      setError(null);
      return list;
    } catch (err) {
      console.error("Soru bankası yüklenemedi:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [allLoaded, questions]);

  const value = useMemo(
    () => ({ questions, loading, error, ensureAllQuestions, ensureSubjectQuestions }),
    [questions, loading, error, ensureAllQuestions, ensureSubjectQuestions]
  );

  return <QuestionsContext.Provider value={value}>{children}</QuestionsContext.Provider>;
}
