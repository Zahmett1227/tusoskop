import { signInWithCredential } from "firebase/auth";

/**
 * window.handleAppleSignIn({idToken, nonce}) — Swift köprüsü.
 *
 * NativeAppleSignIn Capacitor plugin (NativeAppleSignIn.swift), ASAuthorizationAppleIDCredential
 * sonuçlarını call.resolve() ile JS'e döner; Capacitor bridge bu fonksiyonu çağırır.
 *
 * Alternatif olarak Swift tarafında doğrudan şöyle de kullanılabilir:
 *   self.bridge?.webView?.evaluateJavaScript(
 *     "window.handleAppleSignIn({idToken: '\(idToken)', nonce: '\(nonce)'})"
 *   )
 */
let _pendingAppleSignIn = null;

if (typeof window !== "undefined") {
  window.handleAppleSignIn = async (result) => {
    if (!_pendingAppleSignIn) return;
    const pending = _pendingAppleSignIn;
    _pendingAppleSignIn = null;
    await pending.handler(result);
  };

  window.handleAppleSignInError = (message) => {
    if (!_pendingAppleSignIn) return;
    const pending = _pendingAppleSignIn;
    _pendingAppleSignIn = null;
    pending.reject(new Error(message || "Apple ile giriş başarısız oldu."));
  };
}

/**
 * iOS native Apple Sign-In.
 *
 * NativeAppleSignIn Capacitor plugin'ini (NativeAppleSignIn.swift) tetikler.
 * Swift, ASAuthorizationAppleIDProvider'dan idToken + nonce alarak call.resolve() ile döner.
 * Bu Promise'in .then() sonucu window.handleAppleSignIn'e iletilir;
 * orada OAuthProvider.credential({idToken, rawNonce}) + signInWithCredential çalışır.
 */
export async function signInWithNativeApple(auth, provider) {
  const plugin = window?.Capacitor?.Plugins?.NativeAppleSignIn;

  if (!plugin?.signIn) {
    const err = new Error("Native Apple Sign-In bu cihazda kullanılamıyor.");
    err.userMessage = err.message;
    throw err;
  }

  return new Promise((resolve, reject) => {
    _pendingAppleSignIn = {
      reject,
      handler: async ({ idToken, nonce }) => {
        try {
          if (!idToken || !nonce) {
            throw new Error("Apple kimlik bilgileri eksik.");
          }
          const credential = provider.credential({ idToken, rawNonce: nonce });
          const userCred = await signInWithCredential(auth, credential);
          resolve(userCred.user);
        } catch (err) {
          reject(err);
        }
      },
    };

    plugin
      .signIn()
      .then((result) => {
        if (window.handleAppleSignIn) {
          window.handleAppleSignIn(result);
        }
      })
      .catch((err) => {
        _pendingAppleSignIn = null;
        if (err?.message === "USER_CANCELLED") {
          resolve(null);
        } else {
          const wrapped = new Error(
            err?.message || "Apple ile giriş tamamlanamadı. Lütfen tekrar deneyin."
          );
          wrapped.userMessage = wrapped.message;
          reject(wrapped);
        }
      });
  });
}
