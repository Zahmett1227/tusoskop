import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { isNativeIOS } from "../utils/device";

function createAppleCredential(provider, credential) {
  const idToken = credential?.idToken;
  const rawNonce = credential?.nonce;

  if (!idToken || !rawNonce) {
    throw new Error(
      "Apple ile giriş bilgileri alınamadı. Lütfen tekrar deneyin."
    );
  }

  return provider.credential({
    idToken,
    rawNonce,
  });
}

export async function signInWithNativeApple(auth, provider) {
  if (!isNativeIOS()) {
    throw new Error("Native Apple giriş yalnızca iOS uygulamasında kullanılabilir.");
  }

  console.log("[Apple] signInWithApple plugin çağrılıyor...");
  const result = await FirebaseAuthentication.signInWithApple({
    skipNativeAuth: true,
  });
  console.log("[Apple] Plugin yanıtı:", JSON.stringify({
    hasCredential: !!result?.credential,
    hasIdToken: !!result?.credential?.idToken,
    hasNonce: !!result?.credential?.nonce,
    nonceLength: result?.credential?.nonce?.length ?? 0,
  }));

  const credential = createAppleCredential(provider, result?.credential);
  console.log("[Apple] OAuthCredential oluşturuldu, signInWithCredential çağrılıyor...");

  try {
    const signInPromise = signInWithCredential(auth, credential);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Giriş zaman aşımına uğradı. İnternet bağlantınızı kontrol edin.")),
        12000
      )
    );
    const userCredential = await Promise.race([signInPromise, timeoutPromise]);
    console.log("[Apple] signInWithCredential başarılı:", userCredential.user?.uid);
    return userCredential.user;
  } catch (signInError) {
    console.error("[Apple] signInWithCredential hatası:", signInError?.code, signInError?.message);
    throw signInError;
  }
}

export async function signInWithNativeGoogle(auth) {
  console.log("[Google] signInWithGoogle plugin çağrılıyor...");
  const result = await FirebaseAuthentication.signInWithGoogle({
    skipNativeAuth: true,
  });
  console.log("[Google] Plugin yanıtı:", JSON.stringify({
    hasCredential: !!result?.credential,
    hasIdToken: !!result?.credential?.idToken,
    hasAccessToken: !!result?.credential?.accessToken,
  }));

  const idToken = result?.credential?.idToken;
  const accessToken = result?.credential?.accessToken;
  if (!idToken) {
    const err = new Error("Google girişi tamamlanamadı. (idToken yok)");
    err.userMessage = err.message;
    throw err;
  }
  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  console.log("[Google] OAuthCredential oluşturuldu, signInWithCredential çağrılıyor...");

  try {
    const signInPromise = signInWithCredential(auth, credential);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Giriş zaman aşımına uğradı. İnternet bağlantınızı kontrol edin.")),
        12000
      )
    );
    const userCredential = await Promise.race([signInPromise, timeoutPromise]);
    console.log("[Google] signInWithCredential başarılı:", userCredential.user?.uid);
    return userCredential.user;
  } catch (signInError) {
    console.error("[Google] signInWithCredential hatası:", signInError?.code, signInError?.message);
    throw signInError;
  }
}
