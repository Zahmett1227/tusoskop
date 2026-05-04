import { useContext } from "react";
import { QuestionsContext } from "../context/QuestionsContext.jsx";

export function useQuestions() {
  return useContext(QuestionsContext);
}
