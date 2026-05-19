import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import SmartReviewPanel from "./SmartReviewPanel";
import { SUBJECT_TOPIC_FALLBACK } from "../utils/smartReviewUtils";

describe("SmartReviewPanel öncelikli dersler", () => {
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

  it("ders alt satırında konu adı görünür, Branş yoğunluğu yazmaz", async () => {
    await act(async () => {
      root.render(
        <SmartReviewPanel
          summary={{
            dueCount: 4,
            overdueCount: 0,
            totalCount: 4,
            topSubjects: [
              { name: "Pediatri", count: 3, topTopic: "Yenidoğan" },
              { name: "Anatomi", count: 2, topTopic: "Eklemler" },
            ],
            topTopics: [{ name: "Yenidoğan", count: 3 }],
          }}
          topicRows={[{ name: "Yenidoğan", count: 3, subtitle: "Pediatri" }]}
        />
      );
    });

    expect(container.textContent).toContain("Pediatri");
    expect(container.textContent).toContain("Yenidoğan");
    expect(container.textContent).toContain("Anatomi");
    expect(container.textContent).toContain("Eklemler");
    expect(container.textContent).not.toContain("Branş yoğunluğu");
  });

  it("konu yoksa güvenli fallback gösterir", async () => {
    await act(async () => {
      root.render(
        <SmartReviewPanel
          summary={{
            dueCount: 1,
            overdueCount: 0,
            totalCount: 1,
            topSubjects: [{ name: "Fizyoloji", count: 1 }],
            topTopics: [],
          }}
        />
      );
    });

    expect(container.textContent).toContain(SUBJECT_TOPIC_FALLBACK);
    expect(container.textContent).not.toContain("Branş yoğunluğu");
  });
});
