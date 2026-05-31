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

  const result = await FirebaseAuthentication.signInWithApple({
    skipNativeAuth: true,
  });
  const credential = createAppleCredential(provider, result?.credential);
  const userCredential = await signInWithCredential(auth, credential);
  return userCredential.user;
}

export async function signInWithNativeGoogle(auth) {
  const result = await FirebaseAuthentication.signInWithGoogle({
    skipNativeAuth: true,
  });
  const idToken = result?.credential?.idToken;
  const accessToken = result?.credential?.accessToken;
  if (!idToken) {
    const err = new Error("Google girişi tamamlanamadı.");
    err.userMessage = err.message;
    throw err;
  }
  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  const userCredential = await signInWithCredential(auth, credential);
  return userCredential.user;
}
