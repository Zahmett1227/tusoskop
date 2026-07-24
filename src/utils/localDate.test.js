import { afterEach, describe, expect, it, vi } from "vitest";
import {
  classifyDateKey,
  getLocalDateKey,
  getLocalDateKeyOffset,
} from "./localDate";

describe("localDate", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("yerel gün anahtarını YYYY-MM-DD olarak üretir", () => {
    const d = new Date(2026, 6, 24, 1, 30); // 24 Temmuz 2026, yerel 01:30
    expect(getLocalDateKey(d)).toBe("2026-07-24");
  });

  it("TR gece yarısı sonrası (yerel) doğru güne düşer — UTC kaymaz", () => {
    // TR (UTC+3) 24 Tem 01:00 → UTC'de hâlâ 23 Tem 22:00 olurdu.
    // Yerel anahtar 24 Temmuz olmalı ki gece çalışan kullanıcı doğru güne yazılsın.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 24, 1, 0, 0));
    expect(getLocalDateKey()).toBe("2026-07-24");
    expect(getLocalDateKeyOffset(-1)).toBe("2026-07-23");
  });

  it("classifyDateKey bugün/dün/eski/yok ayrımını yapar", () => {
    const now = new Date(2026, 6, 24, 12, 0);
    expect(classifyDateKey("2026-07-24", now)).toBe("today");
    expect(classifyDateKey("2026-07-23", now)).toBe("yesterday");
    expect(classifyDateKey("2026-07-20", now)).toBe("stale");
    expect(classifyDateKey(null, now)).toBe("none");
  });
});
