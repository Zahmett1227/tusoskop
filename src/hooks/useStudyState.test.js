import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "./useStudyState.js"),
  "utf8"
);

describe("useStudyState kaynak sözleşmesi", () => {
  it("temel çalışma state'leri tanımlı", () => {
    expect(src).toContain("const [currentIndex, setCurrentIndex] = useState(0)");
    expect(src).toContain("const [selected, setSelected] = useState(null)");
    expect(src).toContain("const [showResult, setShowResult] = useState(false)");
    expect(src).toContain("const [score, setScore] = useState(0)");
    expect(src).toContain("const [activeQuestions, setActiveQuestions] = useState([])");
    expect(src).toContain("const [studyMode, setStudyMode] = useState");
  });

  it("streak state'leri tanımlı", () => {
    expect(src).toContain("const [streak, setStreak] = useState(0)");
    expect(src).toContain("const [bestStreak, setBestStreak] = useState");
  });

  it("FSRS entegrasyonu — updateSmartReviewFromAnswer kullanılıyor", () => {
    expect(src).toContain("updateSmartReviewFromAnswer");
    expect(src).toContain("upsertSmartReview");
  });

  it("revealCurrentAnswer limit kontrolü yapıyor", () => {
    expect(src).toContain("revealCurrentAnswer");
    expect(src).toContain("canAnswerQuestion");
  });

  it("resetStudyState tüm state'leri sıfırlıyor", () => {
    const resetBlock = src.slice(
      src.indexOf("const resetStudyState"),
      src.indexOf("const resetStudyState") + 600
    );
    expect(resetBlock).toContain("setCurrentIndex(0)");
    expect(resetBlock).toContain("setSelected(null)");
    expect(resetBlock).toContain("setShowResult(false)");
    expect(resetBlock).toContain("setScore(0)");
    expect(resetBlock).toContain("setActiveQuestions([])");
  });

  it("handleToggleFavorite toggleFavoriteQuestion çağırıyor", () => {
    expect(src).toContain("handleToggleFavorite");
    expect(src).toContain("toggleFavoriteQuestion");
  });

  it("addWrongQuestion yanlış cevaplarda çağrılıyor", () => {
    expect(src).toContain("addWrongQuestion");
  });

  it("recordQuestionHistory çalışma/review geçmişi yazar", () => {
    expect(src).toContain("recordQuestionHistory");
    expect(src).not.toContain("tusoskop-question-history");
  });

  it("hook tüm gerekli değerleri return ediyor", () => {
    const returnBlock = src.slice(src.lastIndexOf("return {"));
    expect(returnBlock).toContain("activeQuestions");
    expect(returnBlock).toContain("setActiveQuestions");
    expect(returnBlock).toContain("resetStudyState");
    expect(returnBlock).toContain("revealCurrentAnswer");
    expect(returnBlock).toContain("handleStudySelect");
    expect(returnBlock).toContain("handleNext");
    expect(returnBlock).toContain("handleToggleFavorite");
    expect(returnBlock).toContain("topicProgress");
  });

  it("answeredQuestionIdsRef ve answeredReviewIdsRef tanımlı", () => {
    expect(src).toContain("answeredQuestionIdsRef");
    expect(src).toContain("answeredReviewIdsRef");
  });
});
