import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";

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
    createdAt: new Date().toISOString(),
  };

  try {
    const ref = await addDoc(collection(db, "premiumPurchaseIntents"), payload);
    return { ok: true, id: ref.id };
  } catch (err) {
    console.error("createPremiumPurchaseIntent:", err);
    return { ok: false, error: err };
  }
}
