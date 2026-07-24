import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const hookSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "./useTopicStudyFlow.js"),
  "utf8"
);

const appSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../App.jsx"),
  "utf8"
);

describe("useTopicStudyFlow kaynak sözleşmesi", () => {
  it("selectedLesson ve selectedTopic state hook içinde", () => {
    expect(hookSource).toContain('const [selectedLesson, setSelectedLesson] = useState("")');
    expect(hookSource).toContain('const [selectedTopic, setSelectedTopic] = useState("")');
  });

  it("startTopicTest limit gate ve tek increment", () => {
    expect(hookSource).toContain("canStartTopicTest(user, userData)");
    expect(hookSource).toMatch(/topicOverride\?\.ders/);
    expect(hookSource).toMatch(/topicOverride\?\.countMode/);
    expect([...hookSource.matchAll(/await incrementTopicTestUsage/g)]).toHaveLength(1);
    expect(hookSource).toContain("await refreshRemainingUsage()");
  });

  it("increment başarısız olursa study başlamadan önce try/catch", () => {
    const start = hookSource.indexOf("const startTopicTest = useCallback");
    const end = hookSource.indexOf("const questionSetupScreenProps = useMemo");
    const block = hookSource.slice(start, end);
    const incrementIdx = block.indexOf("incrementTopicTestUsage");
    const resetIdx = block.indexOf("resetStudyState()");
    expect(incrementIdx).toBeGreaterThan(-1);
    expect(resetIdx).toBeGreaterThan(incrementIdx);
    expect(block).toContain("if (openLimitFromUsageError(err)) return");
  });

  it("premium olmayan (ve misafir olmayan) openTopicSetup gate", () => {
    // Misafir "her yeri denesin" için Plus kapısını atlar; free logged-in kapıya takılır.
    expect(hookSource).toContain("if (!isGuest && !isUserPremium(userData, user))");
    expect(hookSource).toContain("openSubjectTopicPlusGate()");
  });

  it("saveRecentTopicStudy ve questionSetupScreenProps", () => {
    expect(hookSource).toContain("saveRecentTopicStudy");
    expect(hookSource).toContain("questionSetupScreenProps");
    expect(hookSource).toContain("ensureSubjectQuestions: ensureQuestionsForSubject");
  });

  it("App.jsx hook kullanır ve startTopicTest App içinde kalmaz", () => {
    expect(appSource).toContain("useTopicStudyFlow");
    expect(appSource).toContain("{...questionSetupScreenProps}");
    expect(appSource).not.toMatch(/const startTopicTest = async/);
  });
});
