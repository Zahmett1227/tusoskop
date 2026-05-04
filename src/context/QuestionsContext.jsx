/* eslint-disable react-refresh/only-export-components -- Provider + paylaşılan Context nesnesi */
import React, { createContext, useEffect, useMemo, useState } from "react";
import { loadAllQuestions } from "../data/questions";

export const QuestionsContext = createContext({
  questions: [],
  loading: true,
  error: null,
});

export function QuestionsProvider({ children }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadAllQuestions()
      .then((list) => {
        if (!cancelled) {
          setQuestions(list);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Soru bankası yüklenemedi:", err);
          setError(err);
          setQuestions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ questions, loading, error }),
    [questions, loading, error]
  );

  return <QuestionsContext.Provider value={value}>{children}</QuestionsContext.Provider>;
}
