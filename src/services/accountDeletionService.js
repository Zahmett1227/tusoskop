import { httpsCallable } from "firebase/functions";
import { functions, logout } from "../firebase";

export async function deleteCurrentAccountAndData() {
  const callable = httpsCallable(functions, "deleteAccountAndData");
  let result;
  try {
    result = await callable({});
  } catch (error) {
    console.error("[AccountDeletion] callable hatası:", error?.code, error?.message, error?.details);
    const code = error?.code ? ` (${error.code})` : "";
    const message = error?.message || "Bilinmeyen hata";
    throw new Error(`Hesap silme tamamlanamadı.${code}\n${message}`);
  }
  if (result?.data?.success !== true) {
    throw new Error("Hesap silme işlemi tamamlanamadı.");
  }
  await logout();
  return result.data;
}
