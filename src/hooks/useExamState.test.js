import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "./useExamState.js"),
  "utf8"
);

describe("useExamState kaynak sözleşmesi", () => {
  it("gerekli state'ler tanımlı", () => {
    expect(src).toContain("const [examQuestions, setExamQuestions] = useState([])");
    expect(src).toContain("const [examIndex, setExamIndex] = useState(0)");
    expect(src).toContain("const [examAnswers, setExamAnswers] = useState({})");
    expect(src).toContain("const [examSelected, setExamSelected] = useState(null)");
    expect(src).toContain("const [selectedExamSet, setSelectedExamSet] = useState(null)");
  });

  it("examAnswersRef ve inProgressNotifiedRef tanımlı", () => {
    expect(src).toContain("const examAnswersRef = useRef({})");
    expect(src).toContain("const inProgressNotifiedRef = useRef(false)");
  });

  it("persistInProgressExam saveInProgressExam çağırır", () => {
    expect(src).toContain("persistInProgressExam");
    expect(src).toContain("saveInProgressExam");
  });

  it("handleExamNext tanımlı ve examIndex günceller", () => {
    expect(src).toContain("handleExamNext");
    expect(src).toContain("setExamIndex");
  });

  it("handleExamPrev tanımlı", () => {
    expect(src).toContain("handleExamPrev");
  });

  it("handleExamSelect tanımlı ve setExamSelected çağırır", () => {
    expect(src).toContain("handleExamSelect");
    expect(src).toContain("setExamSelected");
  });

  it("examAnalysis useMemo ile hesaplanıyor", () => {
    expect(src).toContain("examAnalysis");
    expect(src).toContain("useMemo");
    expect(src).toContain("analyzeExamResults");
  });

  it("hook tüm gerekli değerleri return ediyor", () => {
    const returnBlock = src.slice(src.lastIndexOf("return {"));
    expect(returnBlock).toContain("examQuestions");
    expect(returnBlock).toContain("examIndex");
    expect(returnBlock).toContain("examAnswers");
    expect(returnBlock).toContain("handleExamNext");
    expect(returnBlock).toContain("handleExamPrev");
    expect(returnBlock).toContain("handleExamSelect");
    expect(returnBlock).toContain("persistInProgressExam");
    expect(returnBlock).toContain("examAnalysis");
    expect(returnBlock).toContain("estimatedTus");
  });

  it("validateInProgressExam ve clearInProgressExam kullanılıyor", () => {
    expect(src).toContain("validateInProgressExam");
    expect(src).toContain("clearInProgressExam");
  });
});
