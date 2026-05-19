import { describe, expect, it } from "vitest";
import {
  SUBJECT_TOPIC_FALLBACK,
  buildTopSubjectsWithTopics,
  buildTopicRows,
  getSubjectRowSubtitle,
} from "./smartReviewUtils";

describe("buildTopSubjectsWithTopics", () => {
  const dueItems = [
    { ders: "Pediatri", konu: "Yenidoğan" },
    { ders: "Pediatri", konu: "Yenidoğan" },
    { ders: "Pediatri", konu: "Aşılar" },
    { ders: "Anatomi", konu: "Eklemler" },
    { ders: "Anatomi", konu: "Eklemler" },
    { ders: "Anatomi", konu: "Kaslar" },
  ];

  it("her ders için en yoğun konuyu topTopic/konu olarak döndürür", () => {
    const rows = buildTopSubjectsWithTopics(dueItems);
    const pediatri = rows.find((r) => r.name === "Pediatri");
    const anatomi = rows.find((r) => r.name === "Anatomi");
    expect(pediatri?.count).toBe(3);
    expect(pediatri?.topTopic).toBe("Yenidoğan");
    expect(pediatri?.konu).toBe("Yenidoğan");
    expect(anatomi?.topTopic).toBe("Eklemler");
  });

  it("ders sıralaması toplam due sayısına göredir", () => {
    const rows = buildTopSubjectsWithTopics([
      ...dueItems,
      { ders: "Pediatri", konu: "Yenidoğan" },
    ]);
    expect(rows[0].name).toBe("Pediatri");
    expect(rows[0].count).toBe(4);
    expect(rows[1].name).toBe("Anatomi");
  });

  it("konu yoksa topTopic alanı eklenmez", () => {
    const rows = buildTopSubjectsWithTopics([{ ders: "Fizyoloji", konu: "" }]);
    expect(rows).toHaveLength(1);
    expect(rows[0].topTopic).toBeUndefined();
    expect(rows[0].konu).toBeUndefined();
  });
});

describe("getSubjectRowSubtitle", () => {
  it("topTopic veya konu varsa onu döndürür", () => {
    expect(getSubjectRowSubtitle({ name: "Pediatri", topTopic: "Yenidoğan" })).toBe(
      "Yenidoğan"
    );
    expect(getSubjectRowSubtitle({ name: "Anatomi", konu: "Eklemler" })).toBe("Eklemler");
  });

  it("konu yoksa güvenli fallback döndürür", () => {
    expect(getSubjectRowSubtitle({ name: "Fizyoloji", count: 2 })).toBe(
      SUBJECT_TOPIC_FALLBACK
    );
    expect(getSubjectRowSubtitle({})).toBe(SUBJECT_TOPIC_FALLBACK);
  });
});

describe("buildTopicRows", () => {
  it("öncelikli konularda konu ana satır, ders alt satır kalır", () => {
    const summary = {
      topTopics: [{ name: "Yenidoğan", count: 2 }],
    };
    const reviews = [
      { konu: "Yenidoğan", ders: "Pediatri" },
      { konu: "Yenidoğan", ders: "Pediatri" },
    ];
    const rows = buildTopicRows(summary, reviews);
    expect(rows[0].name).toBe("Yenidoğan");
    expect(rows[0].subtitle).toBe("Pediatri");
  });
});
