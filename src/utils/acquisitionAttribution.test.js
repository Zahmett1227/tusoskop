import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  captureAcquisitionFromUrl,
  clearStoredAcquisitionForTests,
  getStoredAcquisition,
  parseAcquisitionFromSearchParams,
} from "./acquisitionAttribution.js";

describe("acquisitionAttribution", () => {
  beforeEach(() => {
    const store = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => {
        store.set(key, value);
      },
      removeItem: (key) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    });
    clearStoredAcquisitionForTests();
  });

  it("UTM parametrelerini parse eder", () => {
    const params = new URLSearchParams(
      "utm_source=instagram&utm_medium=story&utm_campaign=drtusspot"
    );
    expect(parseAcquisitionFromSearchParams(params)).toEqual({
      source: "instagram",
      medium: "story",
      campaign: "drtusspot",
      firstSeenAt: expect.any(String),
    });
  });

  it("UTM yoksa null döner", () => {
    expect(parseAcquisitionFromSearchParams(new URLSearchParams())).toBeNull();
  });

  it("ilk UTM ziyaretini localStorage'a yazar ve overwrite etmez", () => {
    captureAcquisitionFromUrl(
      "https://tusoskop.com/?utm_source=instagram&utm_medium=story&utm_campaign=drtusspot"
    );
    const first = getStoredAcquisition();
    expect(first?.campaign).toBe("drtusspot");

    captureAcquisitionFromUrl(
      "https://tusoskop.com/?utm_source=instagram&utm_medium=reels&utm_campaign=tusloop"
    );
    expect(getStoredAcquisition()?.campaign).toBe("drtusspot");
  });
});
