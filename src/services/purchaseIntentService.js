import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { setClarityTag, trackClarityEvent } from "../lib/clarity";

/**
 * Ödeme öncesi niyet kaydı — başarısız olsa bile ödeme akışı devam edebilir.
 */
export async function createPremiumPurchaseIntent(user, plan) {
  if (!plan?.id) {
    console.error("createPremiumPurchaseIntent: plan eksik");
    return { ok: false, error: new Error("Plan bilgisi yok") };
  }

  const payload = {
    uid: user?.uid ?? null,
    email: user?.email ?? null,
    planId: plan.id,
    planLabel: plan.label,
    planSku: plan.sku,
    durationDays: plan.durationDays,
    monthlyPrice: plan.monthlyPrice,
    monthlyPriceLabel: plan.monthlyPriceLabel,
    totalPrice: plan.totalPrice,
    totalPriceLabel: plan.totalPriceLabel,
    currency: "TRY",
    provider: "shopify",
    status: "started",
    shopifyUrlConfigured: Boolean(plan.shopifyUrl),
    shopifyOrderName: null,
    shopifyOrderId: null,
    paymentCheckedAt: null,
    paymentCheckedBy: null,
    adminNote: null,
    createdAt: new Date().toISOString(),
  };

  try {
    const ref = await addDoc(collection(db, "premiumPurchaseIntents"), payload);
    try {
      setClarityTag("purchase_intent_plan", plan.id);
      setClarityTag("purchase_intent_sku", plan.sku || "");
      setClarityTag("purchase_intent_total_price", plan.totalPriceLabel || "");
      trackClarityEvent("purchase_intent_created");
    } catch {
      /* tracking asla akışı bozmasın */
    }
    return { ok: true, id: ref.id };
  } catch (err) {
    console.error("createPremiumPurchaseIntent:", err);
    try {
      setClarityTag("purchase_intent_failed_plan", plan.id);
      trackClarityEvent("purchase_intent_failed");
    } catch {
      /* sessiz */
    }
    return { ok: false, error: err };
  }
}
