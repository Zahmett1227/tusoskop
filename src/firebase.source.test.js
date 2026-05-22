import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "./firebase.js"),
  "utf8"
);

describe("firebase.js — auth & cache sözleşmesi", () => {
  it("Firestore offline persistent cache aktif", () => {
    expect(src).toContain("initializeFirestore");
    expect(src).toContain("persistentLocalCache");
    expect(src).not.toMatch(/^export const db = getFirestore/m);
  });

  it("loginWithGoogle popup-first, redirect yalnız popup-blocked'da", () => {
    expect(src).toContain("signInWithPopup");
    // Tüm signInWithRedirect kullanımları auth/popup-blocked koşulu altında olmalı.
    const popupBlockedBlock = src.slice(
      src.indexOf("auth/popup-blocked"),
      src.indexOf("auth/popup-blocked") + 400
    );
    expect(popupBlockedBlock).toContain("signInWithRedirect");
  });

  it("consumePendingRedirectResult null kontrolü ile getRedirectResult sarar", () => {
    expect(src).toContain("consumePendingRedirectResult");
    expect(src).toContain("getRedirectResult");
    expect(src).toMatch(/if \(!result\) return null;/);
  });
});
