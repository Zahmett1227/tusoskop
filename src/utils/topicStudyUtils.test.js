import { describe, expect, it } from "vitest";
import {
  countQuestionsByTopic,
  filterTopicsBySearch,
  resolveTopicStudyCount,
  sortedTopicNames,
} from "./topicStudyUtils";

const SAMPLE = [
  { id: 1, ders: "Fizyoloji", konu: "Kalp" },
  { id: 2, ders: "Fizyoloji", konu: "Kalp" },
  { id: 3, ders: "Fizyoloji", konu: "Böbrek" },
  { id: 4, ders: "Patoloji", konu: "İnflamasyon" },
];

describe("topicStudyUtils", () => {
  it("konu soru sayılarını doğru hesaplar", () => {
    const map = countQuestionsByTopic(SAMPLE, "Fizyoloji");
    expect(map.get("Kalp")).toBe(2);
    expect(map.get("Böbrek")).toBe(1);
    expect(map.has("İnflamasyon")).toBe(false);
  });

  it("ders adı exact eşleşme ister", () => {
    expect(countQuestionsByTopic(SAMPLE, "fizyoloji").size).toBe(0);
    expect(countQuestionsByTopic(SAMPLE, "Fizyoloji").size).toBe(2);
  });

  it("konu araması yalnızca konu adında filtreler", () => {
    const topics = sortedTopicNames(countQuestionsByTopic(SAMPLE, "Fizyoloji"));
    expect(filterTopicsBySearch(topics, "kal")).toEqual(["Kalp"]);
    expect(filterTopicsBySearch(topics, "")).toEqual(topics);
  });

  it("istenen soru sayısı konu havuzundan fazla olamaz", () => {
    expect(resolveTopicStudyCount(20, 5)).toBe(5);
    expect(resolveTopicStudyCount(10, 50)).toBe(10);
    expect(resolveTopicStudyCount("all", 12)).toBe(12);
    expect(resolveTopicStudyCount(10, 0)).toBe(0);
  });

  it("geçersiz topicCountMap veya topics patlatmaz", () => {
    expect(sortedTopicNames(null)).toEqual([]);
    expect(filterTopicsBySearch(undefined, "x")).toEqual([]);
  });
});
