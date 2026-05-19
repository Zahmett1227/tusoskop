import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../App.jsx"),
  "utf8"
);

describe("App.jsx ekran geri navigasyonu", () => {
  it("StudyScreen, Summary, TopicTracker goDashboard/onBack alır", () => {
    const studyBlock = appSource.slice(
      appSource.indexOf('case "study"'),
      appSource.indexOf('case "studyCollection"')
    );
    expect(studyBlock).toContain("goDashboard={goDashboard}");

    const summaryBlock = appSource.slice(
      appSource.indexOf('case "summary"'),
      appSource.indexOf('case "examSetSelect"')
    );
    expect(summaryBlock).toContain("goDashboard={goDashboard}");

    const trackerBlock = appSource.slice(
      appSource.indexOf('case "tracker"'),
      appSource.indexOf('case "suggestions"')
    );
    expect(trackerBlock).toContain("<TopicTracker onBack={goDashboard}");
  });

  it("ExamAnalysisScreen analiz ve panele dön handler'ları alır", () => {
    const block = appSource.slice(
      appSource.indexOf('case "examAnalysis"'),
      appSource.indexOf('case "study"')
    );
    expect(block).toContain("goDashboard={goDashboard}");
    expect(block).toContain("startFullExam={startFullExam}");
    expect(block).toContain("examAnalysis={examState.examAnalysis}");
  });
});

describe("App.jsx eski rastgele deneme yolu", () => {
  it("buildFullExam yalnızca questionIds olmayan setler için fallback", () => {
    expect(appSource).toContain("activeSet?.questionIds");
    expect(appSource).toContain("getFixedExamQuestions(activeSet.questionIds");
    expect(appSource).toContain("buildFullExam(");
    expect(appSource).not.toMatch(/startRandomExam|rastgeleDeneme/i);
  });
});
