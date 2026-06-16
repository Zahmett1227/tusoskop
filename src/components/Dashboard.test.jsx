import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SUBJECT_QUESTION_COUNTS } from "../data/questions";
import { SUBJECTS } from "../data/subjects";
import Dashboard from "./Dashboard";

vi.mock("../firebase", () => ({
  auth: { currentUser: null },
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
  setDoc: vi.fn(),
}));

vi.mock("../services/studyCollectionService", () => ({
  getStudyCollectionSummary: vi.fn().mockResolvedValue({
    wrongCount: 2,
    favoriteCount: 1,
  }),
}));

vi.mock("../services/streakService", () => ({
  getStreak: vi.fn().mockResolvedValue({ currentStreak: 3 }),
}));

const stableMockQuestions = [];
vi.mock("../hooks/useQuestions", () => ({
  useQuestions: () => ({ questions: stableMockQuestions }),
}));

vi.mock("../services/smartReviewService", () => ({
  getSmartReviewSummary: vi.fn().mockResolvedValue({
    dueCount: 5,
    overdueCount: 1,
    totalCount: 10,
    topSubjects: [],
    topTopics: [],
  }),
  getSmartReviews: vi.fn().mockResolvedValue([]),
}));

vi.mock("../lib/clarity", () => ({
  setClarityTag: vi.fn(),
  trackClarityEvent: vi.fn(),
}));

const dashboardSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "./Dashboard.jsx"),
  "utf8"
);

const appSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../App.jsx"),
  "utf8"
);

describe("Dashboard manifest ders sayıları", () => {
  it("Dahiliye ve Küçük Stajlar manifest count kullanır", () => {
    expect(SUBJECT_QUESTION_COUNTS.Dahiliye).toBe(678);
    expect(SUBJECT_QUESTION_COUNTS["Küçük Stajlar"]).toBe(512);
    expect(dashboardSource).toContain("SUBJECT_QUESTION_COUNTS[s.name]");
    expect(dashboardSource).not.toMatch(/QUESTIONS\.filter/);
  });
});

describe("Dashboard due count kaynağı", () => {
  it("buildTodayReviewQueue dashboard kaynak kodunda import edilmez", () => {
    expect(dashboardSource).not.toContain("buildTodayReviewQueue");
  });

  it("dashboard akıllı tekrar sayısını smartDue üzerinden gösterir", () => {
    expect(dashboardSource).toContain("smartDue");
    expect(dashboardSource).not.toContain("reviewQueueCount");
  });
});

describe("Dashboard kaynak metinleri", () => {
  it("Tekrar Kuyruğu kullanıcı metni yok, Akıllı Tekrar Planı var", () => {
    expect(dashboardSource).not.toMatch(/Tekrar [Kk]uyruğu/);
    expect(dashboardSource).toContain("Bugünkü Tekrarım");
    expect(dashboardSource).toContain("Tekrara Başla");
  });

  it("kullanıcıya görünen eski dinamik deneme ifadesi yok", () => {
    expect(dashboardSource).not.toMatch(/rastgele|dinamik deneme|havuzdan oluştur|her seferinde farklı/i);
    expect(dashboardSource).toContain("FIXED_EXAM_CARD_SUBTITLE");
    expect(dashboardSource).toMatch(/sabit 200 soruluk/i);
  });

  it("remainingUsage ve hedef net için güvenli yardımcılar var", () => {
    expect(dashboardSource).toContain("getFreeUsageUsed(remainingUsage)");
    expect(dashboardSource).toContain("toSafeTargetScore");
  });
});

describe("App.jsx Dashboard prop bağlantısı", () => {
  it("gerekli handler ve state prop'ları geçirilir", () => {
    const block = appSource.slice(
      appSource.indexOf("<Dashboard"),
      appSource.indexOf("/>", appSource.indexOf('case "dashboard"'))
    );
    expect(block).toContain("openTopicSetup={openTopicSetup}");
    expect(block).toContain("setView={guardedSetView}");
    expect(block).toContain("startSubject={startSubject}");
    expect(block).toContain("remainingUsage={remainingUsage}");
    expect(block).toContain("isAdmin={isAdmin}");
    expect(block).toContain("smartReviewSummary={smartReviewSummary}");
    expect(block).toContain("onStartSmartReview={startSmartReview}");
  });
});

describe("Dashboard render ve CTA", () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function renderDashboard(overrides = {}) {
    const setView = vi.fn();
    const openTopicSetup = vi.fn();
    const startSubject = vi.fn();

    act(() => {
      root.render(
        <Dashboard
          setView={setView}
          openTopicSetup={openTopicSetup}
          startSubject={startSubject}
          user={null}
          userData={null}
          remainingUsage={null}
          onLogout={vi.fn()}
          accentThemeKey="emerald"
          isAdmin={false}
          currentView="dashboard"
          {...overrides}
        />
      );
    });

    return { setView, openTopicSetup, startSubject };
  }

  it("ders kartları manifest sayısıyla render olur", async () => {
    renderDashboard();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(container.textContent).toContain("Kadın Hastalıkları ve Doğum");
    expect(container.textContent).toContain("Küçük Stajlar");
  });

  it("remainingUsage null iken patlamaz", async () => {
    expect(() => renderDashboard({ remainingUsage: null })).not.toThrow();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(container.textContent).toContain("TUSOSKOP");
  });

  it("premium kullanıcıda unlimited upsell metni görünür", async () => {
    const future = new Date(Date.now() + 86400000 * 30);
    renderDashboard({
      userData: {
        plan: "plus",
        premiumStatus: "active",
        premiumUntil: future,
      },
      remainingUsage: { unlimited: true },
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(container.textContent).toContain("Plus aktif");
    expect(container.textContent).toContain("Sınırsız soru");
  });

  it("admin olmayan kullanıcıda Admin Panel görünmez", async () => {
    renderDashboard({ isAdmin: false });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(container.textContent).not.toContain("Admin Panel");
  });

  it("admin kullanıcıda Admin Panel görünür", async () => {
    renderDashboard({ isAdmin: true });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(container.textContent).toContain("Admin Panel");
  });

  it("Deneme ve konu CTA doğru handler çağırır", async () => {
    const { setView, openTopicSetup } = renderDashboard();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    const buttons = [...container.querySelectorAll("button")];
    const examBtn = buttons.find((b) => b.textContent?.includes("TUS denemesi seç"));
    const topicBtn = buttons.find((b) =>
      b.textContent?.includes("Ders veya konu seçerek çöz")
    );
    expect(examBtn).toBeTruthy();
    expect(topicBtn).toBeTruthy();

    await act(() => {
      examBtn.click();
    });
    expect(setView).toHaveBeenCalledWith("examSetSelect");

    await act(() => {
      topicBtn.click();
    });
    expect(openTopicSetup).toHaveBeenCalled();
  });

  it("dueCount > 0 iken Bugünkü Tekrarım kartı ve Tekrara Başla görünür", async () => {
    const onStartSmartReview = vi.fn();
    renderDashboard({
      smartReviewSummary: {
        dueCount: 5,
        overdueCount: 2,
        totalCount: 10,
        topSubjects: [{ name: "Fizyoloji", count: 3 }],
        topTopics: [],
      },
      onStartSmartReview,
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(container.textContent).toContain("Bugünkü Tekrarım");
    expect(container.textContent).toContain("Bugün 5 soru hazır");
    const startBtn = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Tekrara Başla")
    );
    expect(startBtn).toBeTruthy();
    expect(startBtn.disabled).toBe(false);
    await act(() => {
      startBtn.click();
    });
    expect(onStartSmartReview).toHaveBeenCalled();
  });

  it("dueCount == 0 iken empty state gösterilir", async () => {
    renderDashboard({
      smartReviewSummary: {
        dueCount: 0,
        overdueCount: 0,
        totalCount: 0,
        topSubjects: [],
        topTopics: [],
      },
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(container.textContent).toContain("Bugün tekrar yok");
  });

  it("ders kartı tıklanınca startSubject exact ders adıyla çağrılır", async () => {
    const { startSubject } = renderDashboard();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    const patoloji = SUBJECTS.find((s) => s.name === "Patoloji");
    const btn = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Patoloji")
    );
    expect(btn).toBeTruthy();
    await act(() => {
      btn.click();
    });
    expect(startSubject).toHaveBeenCalledWith("Patoloji");
    expect(patoloji).toBeTruthy();
  });
});

describe("getFreeUsageUsed davranışı (kaynak)", () => {
  it("unlimited remainingUsage için kullanım 0 gösterilir", () => {
    expect(dashboardSource).toMatch(/remainingUsage\.unlimited/);
  });
});
