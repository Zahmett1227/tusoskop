import { describe, it, expect } from "vitest";
import {
  PUBLIC_QUIZ_CAMPAIGNS,
  getPublicQuizSlugFromPath,
  getPublicQuizCampaignBySlug,
} from "./publicQuizCampaigns";

describe("getPublicQuizSlugFromPath", () => {
  it("/coz/:slug segmentini döner", () => {
    expect(getPublicQuizSlugFromPath("/coz/patoloji-01")).toBe("patoloji-01");
  });

  it("query ve trailing içeriği yok sayar, küçük harfe indirger", () => {
    expect(getPublicQuizSlugFromPath("/coz/Patoloji-01?utm_source=x")).toBe("patoloji-01");
    expect(getPublicQuizSlugFromPath("/coz/patoloji-01/")).toBe("patoloji-01");
  });

  it("/coz dışındaki path'lerde null döner", () => {
    expect(getPublicQuizSlugFromPath("/dashboard")).toBeNull();
    expect(getPublicQuizSlugFromPath("/coz")).toBeNull();
    expect(getPublicQuizSlugFromPath("")).toBeNull();
  });
});

describe("getPublicQuizCampaignBySlug", () => {
  it("var olan kampanyayı döner", () => {
    const campaign = getPublicQuizCampaignBySlug("patoloji-01");
    expect(campaign).toBeTruthy();
    expect(campaign.campaignCode).toBe("mq_pat_01");
    expect(campaign.questions).toHaveLength(3);
  });

  it("bilinmeyen slug'da null döner", () => {
    expect(getPublicQuizCampaignBySlug("yok-boyle-01")).toBeNull();
    expect(getPublicQuizCampaignBySlug(null)).toBeNull();
  });
});

describe("kampanya veri bütünlüğü", () => {
  it("her sorunun correctIndex'i şık aralığında ve alanları dolu", () => {
    for (const campaign of PUBLIC_QUIZ_CAMPAIGNS) {
      expect(campaign.slug).toMatch(/^[a-z0-9-]+$/);
      expect(campaign.questions.length).toBeGreaterThan(0);
      for (const q of campaign.questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
        expect(q.questionText.length).toBeGreaterThan(0);
        expect(q.explanation.length).toBeGreaterThan(0);
      }
    }
  });
});
