import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../AppAuthenticated.jsx"),
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
  it("await increment yalnızca deneme ve konu testinde (soru/tekrar optimistik)", () => {
    // Soru/tekrar reveal'ı optimistik: sayaç arka planda (await yok).
    // Deneme/konu testi başlangıçta senkron sayılır (await).
    const awaitIncrements = [
      ...combinedUsageSource.matchAll(/await increment(\w+)Usage/g),
    ].map((m) => `increment${m[1]}Usage`);
    expect(awaitIncrements.sort()).toEqual([
      "incrementFullExamUsage",
      "incrementTopicTestUsage",
    ]);
    // Soru/tekrar sayacı arka planda çağrılır (fire-and-forget).
    expect(studyStateHookSource).toMatch(/incrementQuestionUsage\(user, userData, 1\)\s*\.then/);
    expect(studyStateHookSource).toMatch(/incrementReviewUsage\(user, userData, 1\)\s*\.then/);
  });

  it("deneme bitişinde usage increment yok", () => {
    const handleExamCompletedBlock = appSource.slice(
      appSource.indexOf("const handleExamCompleted"),
      appSource.indexOf("const withQuestionLoading")
    );
    expect(handleExamCompletedBlock).not.toMatch(/increment\w+Usage/);
  });

  it("optimistik reveal: limit kapısı senkron, sayaç arka planda + yerel fail-safe", () => {
    // Cevap artık sayaç yazımını beklemez (eski fail-closed mesajı kaldırıldı).
    expect(studyStateHookSource).not.toContain("cevap gösterilmiyor");
    // Ama limit kapısı hâlâ senkron: hak dolduysa modal + return (reveal yok).
    expect(studyStateHookSource).toContain("if (!gate.allowed)");
    expect(studyStateHookSource).toContain("daily_question_limit");
    // Arka plan sayaç hatası yutulur, reveal engellenmez.
    expect(studyStateHookSource).toContain("incrementQuestionUsage arka plan hatası");
    // Fail-safe: callable kesilse bile limit yerelde uygulanır (bypass olmaz).
    expect(studyStateHookSource).toContain('bumpLocalUsage(user, userData, "question"');
    expect(studyStateHookSource).toContain('bumpLocalUsage(user, userData, "review"');
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
