import { describe, expect, it } from "vitest";
import {
  APP_STORE_FALLBACK_URL,
  buildCampaignRedirectTargets,
  buildWebCampaignUrl,
  normalizeCampaignParam,
  normalizeMediumParam,
  detectPlatformFromUserAgentServer,
} from "./campaignLinks.js";

describe("normalizeCampaignParam", () => {
  it("c yoksa organic döner", () => {
    expect(normalizeCampaignParam(undefined, { paramPresent: false })).toBe("organic");
  });

  it("geçersiz c için unknown döner", () => {
    expect(normalizeCampaignParam("<script>", { paramPresent: true })).toBe("unknown");
  });

  it("geçerli kampanyayı normalize eder", () => {
    expect(normalizeCampaignParam("DrTusSpot", { paramPresent: true })).toBe("drtusspot");
  });
});

describe("normalizeMediumParam", () => {
  it("m yoksa story döner", () => {
    expect(normalizeMediumParam(undefined, { paramPresent: false })).toBe("story");
  });

  it("geçersiz m için story döner", () => {
    expect(normalizeMediumParam("bad medium!", { paramPresent: true })).toBe("story");
  });

  it("geçerli medium değerini korur", () => {
    expect(normalizeMediumParam("reels", { paramPresent: true })).toBe("reels");
  });
});

describe("buildCampaignRedirectTargets", () => {
  it("iOS için App Store fallback URL üretir", () => {
    const result = buildCampaignRedirectTargets({
      campaign: "drtusspot",
      medium: "story",
      platform: "ios",
      appleCampaignPt: null,
    });
    expect(result.destination).toBe("appstore");
    expect(result.redirectUrl).toBe(APP_STORE_FALLBACK_URL);
  });

  it("APPLE_CAMPAIGN_PT varsa ct parametresi ekler", () => {
    const result = buildCampaignRedirectTargets({
      campaign: "drtusspot",
      medium: "story",
      platform: "ios",
      appleCampaignPt: "123456",
    });
    expect(result.redirectUrl).toContain("ct=drtusspot");
    expect(result.redirectUrl).toContain("pt=123456");
  });

  it("Android için UTM'li web URL üretir", () => {
    const result = buildCampaignRedirectTargets({
      campaign: "tusloop",
      medium: "reels",
      platform: "android",
    });
    expect(result.destination).toBe("website");
    expect(result.redirectUrl).toBe(buildWebCampaignUrl("tusloop", "reels"));
    expect(result.redirectUrl).toContain("utm_campaign=tusloop");
    expect(result.redirectUrl).toContain("utm_medium=reels");
  });
});

describe("detectPlatformFromUserAgentServer", () => {
  it("iPhone UA için ios döner", () => {
    expect(
      detectPlatformFromUserAgentServer(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
      )
    ).toBe("ios");
  });

  it("Android UA için android döner", () => {
    expect(
      detectPlatformFromUserAgentServer("Mozilla/5.0 (Linux; Android 14; Pixel 7)")
    ).toBe("android");
  });

  it("Windows UA için desktop döner", () => {
    expect(
      detectPlatformFromUserAgentServer("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    ).toBe("desktop");
  });
});
