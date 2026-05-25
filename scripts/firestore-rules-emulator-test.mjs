import assert from "node:assert/strict";

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || "tusoskop";
const HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
const ROOT = `http://${HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function base64Url(value) {
  return Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function authHeader(uid) {
  if (!uid) return {};
  const now = Math.floor(Date.now() / 1000);
  const token = [
    base64Url({ alg: "none", type: "JWT" }),
    base64Url({
      aud: PROJECT_ID,
      auth_time: now,
      email: `${uid}@example.test`,
      email_verified: true,
      exp: now + 3600,
      firebase: { identities: {}, sign_in_provider: "custom" },
      iat: now,
      iss: `https://securetoken.google.com/${PROJECT_ID}`,
      sub: uid,
      user_id: uid,
    }),
    "",
  ].join(".");
  return { Authorization: `Bearer ${token}` };
}

function ownerHeader() {
  return { Authorization: "Bearer owner" };
}

function toFirestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([key, child]) => [key, toFirestoreValue(child)])
        ),
      },
    };
  }
  return { stringValue: String(value) };
}

function fields(data) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value)])
  );
}

async function request(method, path, data, uid) {
  const headers = {
    "Content-Type": "application/json",
    ...(uid === "owner" ? ownerHeader() : authHeader(uid)),
  };
  return fetch(`${ROOT}/${path}`, {
    method,
    headers,
    body: data === undefined ? undefined : JSON.stringify({ fields: fields(data) }),
  });
}

async function clearAll() {
  const res = await fetch(
    `http://${HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE", headers: ownerHeader() }
  );
  assert.ok(res.ok, `emulator clear failed: ${res.status} ${await res.text()}`);
}

async function seed(path, data) {
  const res = await request("PATCH", path, data, "owner");
  assert.ok(res.ok, `seed failed for ${path}: ${res.status} ${await res.text()}`);
}

async function assertAllowed(label, operation) {
  const res = await operation();
  assert.ok(res.ok, `${label} should be allowed, got ${res.status}: ${await res.text()}`);
}

async function assertDenied(label, operation) {
  const res = await operation();
  assert.equal(res.status, 403, `${label} should be denied, got ${res.status}: ${await res.text()}`);
}

const safeUser = (uid) => ({
  uid,
  email: `${uid}@example.test`,
  displayName: uid,
  photoURL: null,
  plan: "free",
  premiumStatus: "inactive",
  premiumSource: "none",
  premiumUntil: null,
  lifetimePremium: false,
  adminNote: null,
  grantedBy: null,
  grantedAt: null,
  createdAt: "2026-05-24T00:00:00.000Z",
  updatedAt: "2026-05-24T00:00:00.000Z",
  lastLoginAt: "2026-05-24T00:00:00.000Z",
});

const safeIntent = (uid) => ({
  uid,
  email: `${uid}@example.test`,
  planId: "plus-1m",
  planLabel: "Plus 1 Ay",
  planSku: "PLUS_1M",
  durationDays: 30,
  monthlyPrice: 99,
  monthlyPriceLabel: "99 TL",
  totalPrice: 99,
  totalPriceLabel: "99 TL",
  currency: "TRY",
  provider: "shopify",
  status: "started",
  shopifyUrlConfigured: true,
  shopifyOrderName: null,
  shopifyOrderId: null,
  paymentCheckedAt: null,
  paymentCheckedBy: null,
  adminNote: null,
  createdAt: "2026-05-24T00:00:00.000Z",
});

await clearAll();

await assertDenied("anonymous cannot read a user profile", () => request("GET", "users/alice"));
await assertAllowed("owner can create safe user profile", () =>
  request("PATCH", "users/alice", safeUser("alice"), "alice")
);
await assertDenied("owner cannot create user profile with isAdmin", () =>
  request("PATCH", "users/mallory", { ...safeUser("mallory"), isAdmin: true }, "mallory")
);
await assertDenied("owner cannot update premium fields", () =>
  request("PATCH", "users/alice", { ...safeUser("alice"), lifetimePremium: true }, "alice")
);
await assertDenied("owner cannot update role fields", () =>
  request("PATCH", "users/alice", { ...safeUser("alice"), role: "admin" }, "alice")
);
await assertDenied("another user cannot read owner profile", () =>
  request("GET", "users/alice", undefined, "bob")
);

await assertDenied("client cannot write admins collection", () =>
  request("PATCH", "admins/alice", { active: true }, "alice")
);
await seed("admins/admin", { active: true });
await assertAllowed("admin can read user profile", () =>
  request("GET", "users/alice", undefined, "admin")
);
await assertAllowed("admin can grant premium fields", () =>
  request("PATCH", "users/alice", { ...safeUser("alice"), lifetimePremium: true }, "admin")
);

await assertDenied("owner cannot write usage counters", () =>
  request("PATCH", "users/alice/usage/usage_2026-05-24", { questionCount: 1 }, "alice")
);
await seed("users/alice/usage/usage_2026-05-24", { questionCount: 3 });
await assertAllowed("owner can read usage counters", () =>
  request("GET", "users/alice/usage/usage_2026-05-24", undefined, "alice")
);

await assertAllowed("owner can create safe purchase intent", () =>
  request("PATCH", "premiumPurchaseIntents/intent_safe", safeIntent("alice"), "alice")
);
await assertDenied("owner cannot create activated purchase intent", () =>
  request(
    "PATCH",
    "premiumPurchaseIntents/intent_bad",
    { ...safeIntent("alice"), status: "manually_activated", activatedBy: "alice" },
    "alice"
  )
);
await assertDenied("owner cannot read purchase intent", () =>
  request("GET", "premiumPurchaseIntents/intent_safe", undefined, "alice")
);
await assertAllowed("admin can read purchase intent", () =>
  request("GET", "premiumPurchaseIntents/intent_safe", undefined, "admin")
);
await assertAllowed("admin can update purchase intent", () =>
  request("PATCH", "premiumPurchaseIntents/intent_safe", { ...safeIntent("alice"), status: "reviewed" }, "admin")
);

await assertAllowed("owner can create own result", () =>
  request("PATCH", "results/result_alice", { userId: "alice", score: 72 }, "alice")
);
await assertDenied("owner cannot create another user's result", () =>
  request("PATCH", "results/result_bob", { userId: "bob", score: 72 }, "alice")
);
await assertDenied("result cannot be updated by owner", () =>
  request("PATCH", "results/result_alice", { userId: "alice", score: 80 }, "alice")
);

await assertAllowed("questionHistory requires matching path id", () =>
  request("PATCH", "users/alice/questionHistory/42", { questionId: 42, attempts: 1 }, "alice")
);
await assertDenied("questionHistory rejects mismatched questionId", () =>
  request("PATCH", "users/alice/questionHistory/43", { questionId: 42, attempts: 1 }, "alice")
);

console.log("Firestore rules emulator tests passed.");
