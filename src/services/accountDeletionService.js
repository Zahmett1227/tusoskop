import { httpsCallable } from "firebase/functions";
import { functions, logout } from "../firebase";

export async function deleteCurrentAccountAndData() {
  const callable = httpsCallable(functions, "deleteAccountAndData");
  const result = await callable({});
  if (result?.data?.success !== true) {
    throw new Error("Hesap silme işlemi tamamlanamadı.");
  }
  await logout();
  return result.data;
}
