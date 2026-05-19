import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXAM_SETS } from "../data/exams";
import {
  analyzeExamResults,
  getEstimatedTusResult,
  getSelectedAnswerIndex,
  isReactEventOrDomNode,
} from "../utils/examUtils";
import {
  buildInProgressExamPayload,
  clearInProgressExam,
  EXAM_IN_PROGRESS_RESET_MESSAGE,
  loadInProgressExamRaw,
  saveInProgressExam,
  shouldNotifyInProgressReset,
  validateInProgressExam,
} from "../utils/examInProgressUtils";

/**
 * Tam deneme (exam) ekranı state ve handler'ları.
 */
export function useExamState({
  user,
  userData,
  view,
  QUESTIONS,
  toDisplayQuestions,
  onExamFinish,
  recordHistoryForQuestion = () => {},
}) {
  // API parity with App.jsx; reserved for upcoming exam-side effects
  useEffect(() => {}, [user, userData, QUESTIONS, toDisplayQuestions]);
  const [examQuestions, setExamQuestions] = useState([]);
  const [examIndex, setExamIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState({});
  const [examSelected, setExamSelected] = useState(null);
  const [selectedExamSet, setSelectedExamSet] = useState(null);
  const examAnswersRef = useRef({});
  const inProgressNotifiedRef = useRef(false);

  useEffect(() => {
    const raw = loadInProgressExamRaw();
    if (!raw || inProgressNotifiedRef.current) return;
    const examSet = EXAM_SETS.find(
      (item) => Number(item.id) === Number(raw.examId ?? raw.examKey)
    );
    const check = validateInProgressExam(raw, examSet);
    if (!check.ok) {
      clearInProgressExam();
      if (shouldNotifyInProgressReset(check.reason)) {
        inProgressNotifiedRef.current = true;
        window.alert(EXAM_IN_PROGRESS_RESET_MESSAGE);
      }
    }
  }, []);

  const persistInProgressExam = useCallback(() => {
    if (view !== "exam" || !selectedExamSet || !examQuestions.length) return;
    const answers = examAnswersRef.current;
    saveInProgressExam(
      buildInProgressExamPayload({
        examSet: selectedExamSet,
        examQuestions,
        examIndex,
        answers,
        examSelected,
      })
    );
  }, [view, selectedExamSet, examQuestions, examIndex, examSelected]);

  useEffect(() => {
    persistInProgressExam();
  }, [persistInProgressExam, examAnswers]);

  const examAnalysis = useMemo(() => {
    if (!examQuestions.length) return null;
    return analyzeExamResults(examQuestions, examAnswers);
  }, [examQuestions, examAnswers]);

  const estimatedTus = useMemo(() => {
    if (!examAnalysis) return null;
    return getEstimatedTusResult(examAnalysis.summary.net);
  }, [examAnalysis]);

  const saveExamAnswer = useCallback((questionIndex, selectedIndex) => {
    if (questionIndex === undefined || questionIndex === null) return;
    examAnswersRef.current = { ...examAnswersRef.current, [questionIndex]: selectedIndex };
    setExamAnswers({ ...examAnswersRef.current });
  }, []);

  const saveExamBlank = useCallback(
    (questionIndex) => {
      saveExamAnswer(questionIndex, null);
    },
    [saveExamAnswer]
  );

  const handleExamNext = useCallback(
    (selectedOverride) => {
      const safeOverride = isReactEventOrDomNode(selectedOverride) ? undefined : selectedOverride;
      const currentQuestion = examQuestions[examIndex];
      if (!currentQuestion?.id) return;
      const persistedAnswer = getSelectedAnswerIndex(
        examAnswersRef.current,
        currentQuestion,
        examIndex
      );
      const currentAnswer =
        safeOverride !== undefined
          ? safeOverride
          : (persistedAnswer ?? examSelected ?? null);
      saveExamAnswer(examIndex, currentAnswer);
      const latestAnswers = examAnswersRef.current;
      recordHistoryForQuestion({
        question: currentQuestion,
        selectedOption: getSelectedAnswerIndex(latestAnswers, currentQuestion, examIndex),
        mode: "exam",
      });

      if (examIndex < examQuestions.length - 1) {
        const nextIdx = examIndex + 1;
        const nextQuestion = examQuestions[nextIdx];
        setExamIndex(nextIdx);
        setExamSelected(
          nextQuestion
            ? (getSelectedAnswerIndex(latestAnswers, nextQuestion, nextIdx) ?? null)
            : null
        );
      } else {
        onExamFinish?.();
      }
    },
    [
      examQuestions,
      examIndex,
      examSelected,
      saveExamAnswer,
      recordHistoryForQuestion,
      onExamFinish,
    ]
  );

  const handleExamPrev = useCallback(() => {
    if (examIndex <= 0) return;
    const currentQuestion = examQuestions[examIndex];
    if (currentQuestion?.id) {
      const currentAnswer =
        getSelectedAnswerIndex(examAnswersRef.current, currentQuestion, examIndex) ??
        examSelected ??
        null;
      saveExamAnswer(examIndex, currentAnswer);
    }
    const latestAnswers = examAnswersRef.current;
    recordHistoryForQuestion({
      question: currentQuestion,
      selectedOption: getSelectedAnswerIndex(latestAnswers, currentQuestion, examIndex),
      mode: "exam",
    });
    const newIndex = examIndex - 1;
    setExamIndex(newIndex);
    const prevQuestion = examQuestions[newIndex];
    setExamSelected(
      prevQuestion
        ? (getSelectedAnswerIndex(latestAnswers, prevQuestion, newIndex) ?? null)
        : null
    );
  }, [examIndex, examQuestions, examSelected, saveExamAnswer, recordHistoryForQuestion]);

  const handleExamSelect = useCallback(
    (optionIndex) => {
      if (!examQuestions[examIndex]) return;
      saveExamAnswer(examIndex, optionIndex);
      setExamSelected(optionIndex);
    },
    [examQuestions, examIndex, saveExamAnswer]
  );

  const handleExamSelectForQuestion = useCallback(
    (questionIdx, letterIdx) => {
      if (!examQuestions[questionIdx]) return;
      saveExamAnswer(questionIdx, letterIdx);
      setExamIndex(questionIdx);
      setExamSelected(letterIdx);
    },
    [examQuestions, saveExamAnswer]
  );

  return {
    examQuestions,
    setExamQuestions,
    examIndex,
    setExamIndex,
    examAnswers,
    setExamAnswers,
    examSelected,
    setExamSelected,
    selectedExamSet,
    setSelectedExamSet,
    examAnswersRef,
    inProgressNotifiedRef,
    persistInProgressExam,
    examAnalysis,
    estimatedTus,
    saveExamAnswer,
    saveExamBlank,
    handleExamNext,
    handleExamPrev,
    handleExamSelect,
    handleExamSelectForQuestion,
  };
}
