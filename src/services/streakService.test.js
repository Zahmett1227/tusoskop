import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const firestoreMocks = vi.hoisted(() => ({
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({})),
  getDoc: firestoreMocks.getDoc,
  setDoc: firestoreMocks.setDoc,
}));

vi.mock("../firebase", () => ({ db: {} }));

import { getStreak, updateStreak } from "./streakService";
import { getLocalDateKey, getLocalDateKeyOffset } from "../utils/localDate";

function snap(data) {
  return { exists: () => Boolean(data), data: () => data };
}

describe("streakService", () => {
  beforeEach(() => {
    firestoreMocks.getDoc.mockReset();
    firestoreMocks.setDoc.mockReset();
    firestoreMocks.setDoc.mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("dün aktif olan kullanıcının serisini artırır (yerel gün)", async () => {
    firestoreMocks.getDoc.mockResolvedValue(
      snap({ currentStreak: 5, longestStreak: 8, lastActiveDate: getLocalDateKeyOffset(-1) })
    );
    await updateStreak("u1");
    expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ currentStreak: 6, lastActiveDate: getLocalDateKey() }),
      { merge: true }
    );
  });

  it("migrate olmuş kullanıcıda iki gün önce aktifse seriyi 1'e sıfırlar", async () => {
    firestoreMocks.getDoc.mockResolvedValue(
      snap({
        currentStreak: 5,
        longestStreak: 8,
        lastActiveDate: getLocalDateKeyOffset(-2),
        streakDateScheme: "local",
      })
    );
    await updateStreak("u1");
    expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ currentStreak: 1, streakDateScheme: "local" }),
      { merge: true }
    );
  });

  it("UTC→yerel geçişinde (migrate olmamış, 2 gün geride) seriyi tek seferlik korur", async () => {
    // Eski UTC anahtarı yüzünden 'dün' çözümü -2 görünen kullanıcı: grace ile devam.
    firestoreMocks.getDoc.mockResolvedValue(
      snap({ currentStreak: 5, longestStreak: 8, lastActiveDate: getLocalDateKeyOffset(-2) })
    );
    await updateStreak("u1");
    expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ currentStreak: 6, streakDateScheme: "local" }),
      { merge: true }
    );
  });

  it("migrate olmamış ama 3 gün geride ise seriyi sıfırlar (grace yalnız -2 için)", async () => {
    firestoreMocks.getDoc.mockResolvedValue(
      snap({ currentStreak: 5, longestStreak: 8, lastActiveDate: getLocalDateKeyOffset(-3) })
    );
    await updateStreak("u1");
    expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ currentStreak: 1 }),
      { merge: true }
    );
  });

  it("bugün zaten sayıldıysa tekrar yazmaz", async () => {
    firestoreMocks.getDoc.mockResolvedValue(
      snap({ currentStreak: 5, lastActiveDate: getLocalDateKey() })
    );
    await updateStreak("u1");
    expect(firestoreMocks.setDoc).not.toHaveBeenCalled();
  });

  it("getStreak: kopmuş seriyi 0 gösterir (son aktiflik eski)", async () => {
    firestoreMocks.getDoc.mockResolvedValue(
      snap({ currentStreak: 12, longestStreak: 30, lastActiveDate: getLocalDateKeyOffset(-10) })
    );
    const result = await getStreak("u1");
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(30);
  });

  it("getStreak: dün aktifse seriyi canlı gösterir", async () => {
    firestoreMocks.getDoc.mockResolvedValue(
      snap({ currentStreak: 12, longestStreak: 30, lastActiveDate: getLocalDateKeyOffset(-1) })
    );
    const result = await getStreak("u1");
    expect(result.currentStreak).toBe(12);
  });
});
