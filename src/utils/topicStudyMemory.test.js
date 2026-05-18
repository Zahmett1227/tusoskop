import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  TUSOSKOP_LAST_TOPIC_STUDY_KEY,
  TUSOSKOP_RECENT_TOPIC_STUDIES_KEY,
  MAX_RECENT_TOPIC_STUDIES,
  getLastTopicStudy,
  getRecentTopicStudies,
  normalizeRecentTopicStudies,
  pickResumeCountMode,
  saveLastTopicStudy,
  saveRecentTopicStudy,
  upsertRecentTopicStudies,
} from "./topicStudyMemory";

describe("topicStudyMemory", () => {
  beforeEach(() => {
    const store = {};
    vi.stubGlobal("localStorage", {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => {
        store[k] = v;
      },
      removeItem: (k) => {
        delete store[k];
      },
    });
  });

  it("saveRecentTopicStudy yeni kaydı listenin başına ekler", () => {
    saveRecentTopicStudy({
      ders: "Patoloji",
      konu: "Hücre Hasarı",
      countMode: 10,
      resolvedCount: 10,
    });
    const list = getRecentTopicStudies();
    expect(list[0].ders).toBe("Patoloji");
    expect(list[0].konu).toBe("Hücre Hasarı");
  });

  it("liste en fazla 5 kayıt tutar", () => {
    for (let i = 0; i < 6; i += 1) {
      saveRecentTopicStudy({
        ders: "Fizyoloji",
        konu: `Konu ${i}`,
        countMode: 10,
        resolvedCount: 10,
      });
    }
    expect(getRecentTopicStudies()).toHaveLength(MAX_RECENT_TOPIC_STUDIES);
  });

  it("aynı ders+konu duplicate olmaz, başa taşınır", () => {
    saveRecentTopicStudy({
      ders: "Patoloji",
      konu: "A",
      countMode: 10,
      resolvedCount: 10,
    });
    saveRecentTopicStudy({
      ders: "Mikrobiyoloji",
      konu: "B",
      countMode: 20,
      resolvedCount: 20,
    });
    saveRecentTopicStudy({
      ders: "Patoloji",
      konu: "A",
      countMode: 40,
      resolvedCount: 40,
    });
    const list = getRecentTopicStudies();
    expect(list).toHaveLength(2);
    expect(list[0].ders).toBe("Patoloji");
    expect(list[0].countMode).toBe(40);
    expect(list[1].ders).toBe("Mikrobiyoloji");
  });

  it("bozuk JSON boş liste döner", () => {
    localStorage.setItem(TUSOSKOP_RECENT_TOPIC_STUDIES_KEY, "{bad");
    expect(getRecentTopicStudies()).toEqual([]);
    expect(localStorage.getItem(TUSOSKOP_RECENT_TOPIC_STUDIES_KEY)).toBeNull();
  });

  it("array olmayan recent veri boş liste döner", () => {
    localStorage.setItem(TUSOSKOP_RECENT_TOPIC_STUDIES_KEY, JSON.stringify("x"));
    expect(getRecentTopicStudies()).toEqual([]);
  });

  it("bozuk legacy last topic kaydı yok sayılır", () => {
    localStorage.setItem(TUSOSKOP_LAST_TOPIC_STUDY_KEY, "{bad");
    expect(getLastTopicStudy()).toBeNull();
    expect(localStorage.getItem(TUSOSKOP_LAST_TOPIC_STUDY_KEY)).toBeNull();
  });

  it("eksik ders/konu kayıt filtrelenir", () => {
    const list = normalizeRecentTopicStudies([
      { ders: "X", konu: "Y", countMode: 10, resolvedCount: 5, updatedAt: "t" },
      { konu: "Y", countMode: 10, resolvedCount: 5, updatedAt: "t" },
    ]);
    expect(list).toHaveLength(1);
  });

  it("eski tusoskopLastTopicStudy kaydı güvenli okunur", () => {
    localStorage.setItem(
      TUSOSKOP_LAST_TOPIC_STUDY_KEY,
      JSON.stringify({
        ders: "Küçük Stajlar",
        konu: "Nöroloji",
        countMode: "all",
        resolvedCount: 12,
        updatedAt: "2026-01-01T00:00:00.000Z",
      })
    );
    expect(getRecentTopicStudies()[0]?.ders).toBe("Küçük Stajlar");
    expect(getLastTopicStudy()?.ders).toBe("Küçük Stajlar");
  });

  it("geçersiz countMode fallback 10 olur", () => {
    const list = normalizeRecentTopicStudies([
      { ders: "X", konu: "Y", countMode: 99, resolvedCount: 5, updatedAt: "t" },
    ]);
    expect(list[0].countMode).toBe(10);
    expect(pickResumeCountMode(99, 20)).toBe(10);
  });

  it("saveLastTopicStudy yeni listeye yazar", () => {
    saveLastTopicStudy({
      ders: "Kadın Hastalıkları ve Doğum",
      konu: "Jinekoloji",
      countMode: 20,
      resolvedCount: 20,
    });
    const stored = JSON.parse(localStorage.getItem(TUSOSKOP_RECENT_TOPIC_STUDIES_KEY));
    expect(stored[0].ders).toBe("Kadın Hastalıkları ve Doğum");
  });

  it("upsertRecentTopicStudies 5 ile sınırlar", () => {
    const base = Array.from({ length: 5 }, (_, i) => ({
      ders: "D",
      konu: `K${i}`,
      countMode: 10,
      resolvedCount: 10,
      updatedAt: "t",
    }));
    const next = upsertRecentTopicStudies(base, {
      ders: "D",
      konu: "Yeni",
      countMode: 10,
      resolvedCount: 10,
      updatedAt: "t2",
    });
    expect(next).toHaveLength(5);
    expect(next[0].konu).toBe("Yeni");
  });
});
