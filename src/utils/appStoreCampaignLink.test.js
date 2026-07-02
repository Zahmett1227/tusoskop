import { describe, it, expect, afterEach, vi } from "vitest";
import { buildClientAppStoreUrl } from "./appStoreCampaignLink";
import { APP_STORE_FALLBACK_URL } from "../constants/campaignLinks";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("buildClientAppStoreUrl", () => {
  it("provider token yoksa TR fallback URL'i döner", () => {
    vi.stubEnv("VITE_APP_STORE_PROVIDER_TOKEN", "");
    expect(buildClientAppStoreUrl("mq_pat_01")).toBe(APP_STORE_FALLBACK_URL);
  });

  it("provider token varsa pt/ct/mt parametreli kampanya URL'i üretir", () => {
    vi.stubEnv("VITE_APP_STORE_PROVIDER_TOKEN", "PROVIDER123");
    vi.stubEnv("VITE_APP_STORE_BASE_URL", "");
    const url = buildClientAppStoreUrl("mq_pat_01");
    expect(url).toContain("pt=PROVIDER123");
    expect(url).toContain("ct=mq_pat_01");
    expect(url).toContain("mt=8");
    expect(url).toContain("apps.apple.com");
  });

  it("ct değerini 40 karakterle sınırlar", () => {
    vi.stubEnv("VITE_APP_STORE_PROVIDER_TOKEN", "PROVIDER123");
    const longToken = "x".repeat(60);
    const url = buildClientAppStoreUrl(longToken);
    const ct = new URL(url).searchParams.get("ct");
    expect(ct.length).toBe(40);
  });
});
