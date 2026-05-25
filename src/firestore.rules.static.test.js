import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const rules = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../firestore.rules"),
  "utf8"
);

describe("firestore.rules statik regresyon", () => {
  it("users create güvenli premium defaultları zorunlu kılar", () => {
    expect(rules).toContain("hasRequiredSelfCreatePremiumKeys()");
    expect(rules).toContain("hasOnlySafeSelfCreatePremiumValues()");
    expect(rules).toContain("hasAllowedSelfUserCreateKeys()");
    expect(rules).not.toContain("hasProtectedPremiumKeysOnCreate");
    expect(rules).toMatch(
      /allow create: if isOwner\(uid\)[\s\S]*hasOnlySafeSelfCreatePremiumValues\(\)/
    );
  });

  it("users create admin benzeri alanlara izin vermez", () => {
    const allowedCreateKeysBlock = rules.slice(
      rules.indexOf("function hasAllowedSelfUserCreateKeys"),
      rules.indexOf("match /users/{uid}")
    );
    expect(allowedCreateKeysBlock).not.toContain("'role'");
    expect(allowedCreateKeysBlock).not.toContain("'isAdmin'");
    expect(allowedCreateKeysBlock).not.toContain("'admin'");
  });

  it("questionHistory path owner write ve questionId eşleşmesi", () => {
    expect(rules).toContain("match /users/{uid}/questionHistory/{questionId}");
    expect(rules).toMatch(
      /request\.resource\.data\.questionId == int\(questionId\)/
    );
  });

  it("admin update kuralları korunur", () => {
    expect(rules).toMatch(/allow update: if isAdmin\(\)/);
    expect(rules).toContain("'lifetimePremium'");
    expect(rules).toContain("'role'");
    expect(rules).toContain("'isAdmin'");
    expect(rules).toContain("'admin'");
  });
});
