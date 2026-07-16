import { describe, it, expect } from "vitest";
import { KONTENJAN_DATA } from "./kontenjanData.js";
import {
  getDoluluk,
  getDolulukYuzde,
  getRekabetTier,
  getMatchLevel,
  REKABET_TIERS,
  REKABET_ESIK,
  MATCH_RAHAT_MARGIN,
} from "./kontenjanMetrics.js";

const derma = KONTENJAN_DATA.find((r) => r.dal === "Deri ve Zührevi Hastalıkları");
const askeri = KONTENJAN_DATA.find((r) => r.dal === "Askeri Sağlık Hizmetleri");

describe("kontenjanData tutarlılığı", () => {
  it("dolan her dalda taban <= ortalama <= tavan", () => {
    KONTENJAN_DATA.forEach((r) => {
      if (r.tabanPuan == null) {
        expect(r.ortalamaPuan).toBeNull();
        expect(r.tavanPuan).toBeNull();
        return;
      }
      expect(r.ortalamaPuan).not.toBeNull();
      expect(r.tavanPuan).not.toBeNull();
      expect(r.tabanPuan).toBeLessThanOrEqual(r.ortalamaPuan);
      expect(r.ortalamaPuan).toBeLessThanOrEqual(r.tavanPuan);
    });
  });

  it("yerlesen negatif değildir", () => {
    KONTENJAN_DATA.forEach((r) => {
      expect(r.yerlesen).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("getDoluluk / getDolulukYuzde", () => {
  it("dolan dal için oran verir", () => {
    expect(getDoluluk(derma)).toBeCloseTo(303 / 306, 5);
    expect(getDolulukYuzde(derma)).toBe(99);
  });

  it("kontenjanı dolmayan dalda 0 doluluk", () => {
    expect(getDolulukYuzde(askeri)).toBe(0);
  });
});

describe("getRekabetTier", () => {
  it("Dermatoloji taban düşük olsa da 'Çok Rekabetçi' olur", () => {
    expect(derma.tabanPuan).toBeLessThan(REKABET_ESIK.cokRekabetci);
    expect(getRekabetTier(derma)).toBe(REKABET_TIERS.cokRekabetci);
  });

  it("kontenjanı dolmayan dal 'Kontenjan Açık' olur", () => {
    expect(getRekabetTier(askeri)).toBe(REKABET_TIERS.dolmadi);
  });

  it("eşiklere göre doğru kademe döner", () => {
    expect(getRekabetTier({ tabanPuan: 40, ortalamaPuan: 70 }).key).toBe("cokRekabetci");
    expect(getRekabetTier({ tabanPuan: 40, ortalamaPuan: 62 }).key).toBe("rekabetci");
    expect(getRekabetTier({ tabanPuan: 40, ortalamaPuan: 55 }).key).toBe("orta");
    expect(getRekabetTier({ tabanPuan: 40, ortalamaPuan: 48 }).key).toBe("erisilebilir");
  });
});

describe("getMatchLevel", () => {
  const row = { tabanPuan: 59, ortalamaPuan: 72, tavanPuan: 83 };

  it("ortalamanın marj kadar üzerinde: rahat", () => {
    expect(getMatchLevel(row, 72 + MATCH_RAHAT_MARGIN)).toBe("rahat");
  });

  it("taban ile ortalama+marj arasında: sinirda", () => {
    expect(getMatchLevel(row, 65)).toBe("sinirda");
  });

  it("ortalamanın 1.5 puandan az üstünde de sinirda (istenen davranış)", () => {
    expect(getMatchLevel({ tabanPuan: 46.57, ortalamaPuan: 56.8 }, 58)).toBe("sinirda");
  });

  it("tabanın altında: uzak", () => {
    expect(getMatchLevel(row, 50)).toBe("uzak");
  });

  it("kontenjan dolmadıysa: acik", () => {
    expect(getMatchLevel({ tabanPuan: null, ortalamaPuan: null }, 50)).toBe("acik");
  });
});
