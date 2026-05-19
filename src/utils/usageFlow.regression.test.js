import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../App.jsx"),
  "utf8"
);

const topicStudyHookSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../hooks/useTopicStudyFlow.js"),
  "utf8"
);

const studyStateHookSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../hooks/useStudyState.js"),
  "utf8"
);

const combinedUsageSource = `${appSource}\n${topicStudyHookSource}\n${studyStateHookSource}`;

describe("usage increment call sites (App.jsx regression)", () => {
  it("await increment yalnızca dört akışta (tek çağrı each)", () => {
    const awaitIncrements = [
      ...combinedUsageSource.matchAll(/await increment(\w+)Usage/g),
    ].map((m) => `increment${m[1]}Usage`);
    expect(awaitIncrements.sort()).toEqual([
      "incrementFullExamUsage",
      "incrementQuestionUsage",
      "incrementReviewUsage",
      "incrementTopicTestUsage",
    ]);
  });

  it("deneme bitişinde usage increment yok", () => {
    const handleExamCompletedBlock = appSource.slice(
      appSource.indexOf("const handleExamCompleted"),
      appSource.indexOf("const withQuestionLoading")
    );
    expect(handleExamCompletedBlock).not.toMatch(/increment\w+Usage/);
  });

  it("başarısız soru increment sonrası cevap gösterilmiyor", () => {
    expect(studyStateHookSource).toContain("Kullanım sayacı yazılamadı; cevap gösterilmiyor.");
    expect(combinedUsageSource).not.toContain("cevap yine gösteriliyor");
  });

  it("konu testi increment sonrası study state başlar", () => {
    const start = topicStudyHookSource.indexOf("const startTopicTest = useCallback");
    const end = topicStudyHookSource.indexOf("const questionSetupScreenProps = useMemo");
    const block = topicStudyHookSource.slice(start, end);
    const incrementIdx = block.indexOf("incrementTopicTestUsage");
    const resetIdx = block.indexOf("resetStudyState()");
    expect(incrementIdx).toBeGreaterThan(-1);
    expect(resetIdx).toBeGreaterThan(incrementIdx);
  });

  it("startTopicTest topicOverride ile tek increment yolu", () => {
    const block = topicStudyHookSource.slice(
      topicStudyHookSource.indexOf("const startTopicTest = useCallback"),
      topicStudyHookSource.indexOf("const questionSetupScreenProps = useMemo")
    );
    expect(block).toMatch(/topicOverride\?\.ders/);
    expect(block).toMatch(/topicOverride\?\.countMode/);
    expect([...block.matchAll(/await incrementTopicTestUsage/g)]).toHaveLength(1);
  });
});
