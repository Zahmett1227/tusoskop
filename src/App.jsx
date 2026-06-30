import React, { lazy, Suspense, useCallback, useMemo, useState } from "react";
import "./index.css";
import { SeoLandingPage, PublicHome } from "./components/seo/PublicSeoPages";
import { getSeoPageByPath } from "./seo/seoContent";
import { useAppAccentTheme } from "./hooks/useAppAccentTheme";
import { useToast } from "./context/ToastContext";
import { isIOS } from "./utils/device";

// Asıl uygulama (Firebase Auth + Firestore + tüm ekranlar) yalnızca gerektiğinde
// lazy-load edilir. Böylece public SEO route'larında (/, /tus-*-sorulari …)
// Firebase Auth SDK'sı ve auth iframe'i hiç yüklenmez.
const AppAuthenticated = lazy(() => import("./AppAuthenticated"));

const SESSION_FLAG = "tusoskop_session";

function BootSplash({ iosDevice, accentTheme }) {
  return (
    <div className={`app-shell safe-screen ${iosDevice ? "ios-device" : ""}`}>
      <div
        className="flex flex-col items-center justify-center bg-slate-950 text-white p-6 min-h-dvh"
        style={{ paddingTop: "calc(2rem + env(safe-area-inset-top))" }}
      >
        <div className="mb-6 flex justify-center">
          <img
            src="/tusoskop-logo.png"
            alt=""
            width={128}
            height={128}
            decoding="async"
            className="h-28 w-28 md:h-32 md:w-32 rounded-full object-contain shadow-lg shadow-black/30"
            aria-hidden
          />
        </div>
        <h1 className={`text-5xl font-black mb-2 ${accentTheme.text} tracking-tighter`}>TUSOSKOP</h1>
      </div>
    </div>
  );
}

/**
 * Hafif route kabuğu — Firebase import etmez.
 *   - SEO sayfaları (getSeoPageByPath) → SeoLandingPage, auth beklemeden.
 *   - "/" anonim → PublicHome; firebase yalnız giriş butonuna tıklanınca yüklenir.
 *   - "/giris", "/app" veya mevcut oturum → AppAuthenticated lazy-load.
 */
export default function App() {
  const { accentTheme } = useAppAccentTheme();
  const { showToast } = useToast();
  const [iosDevice] = useState(() => isIOS());

  const publicSeoPage = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getSeoPageByPath(window.location.pathname);
  }, []);

  const pathRoute = useMemo(() => {
    if (typeof window === "undefined") return "home";
    const clean = window.location.pathname.replace(/\/+$/, "") || "/";
    if (clean === "/giris") return "login";
    if (clean === "/app") return "app";
    return "home";
  }, []);

  // localStorage'daki hafif oturum işareti (gerçek auth değil; sadece "uygulamayı
  // hemen yükle" sinyali). useAppAuthBootstrap girişte set, çıkışta temizler.
  const hasSession = useMemo(() => {
    try {
      return typeof window !== "undefined" && window.localStorage.getItem(SESSION_FLAG) === "1";
    } catch {
      return false;
    }
  }, []);

  const [enterApp, setEnterApp] = useState(
    () => pathRoute === "login" || pathRoute === "app" || (pathRoute === "home" && hasSession)
  );

  // Giriş butonuna tıklanınca firebase'i lazy import edip girişi başlat.
  const startLogin = useCallback(
    async (provider) => {
      try {
        const fb = await import("./firebase");
        const user = provider === "apple" ? await fb.loginWithApple() : await fb.loginWithGoogle();
        if (user) {
          try {
            window.localStorage.setItem(SESSION_FLAG, "1");
          } catch {
            /* localStorage kapalı olabilir; yok say */
          }
          setEnterApp(true);
        }
      } catch (error) {
        showToast(error?.userMessage || "Giriş başarısız oldu.", { type: "error" });
      }
    },
    [showToast]
  );

  // Public SEO sayfaları — auth/firebase yüklenmeden, auth state beklemeden render.
  if (publicSeoPage) {
    return (
      <div className={`app-shell safe-screen ${iosDevice ? "ios-device" : ""}`}>
        <SeoLandingPage page={publicSeoPage} />
      </div>
    );
  }

  // /giris, /app veya mevcut oturum → asıl uygulamayı (firebase ile) lazy yükle.
  if (enterApp) {
    return (
      <Suspense fallback={<BootSplash iosDevice={iosDevice} accentTheme={accentTheme} />}>
        <AppAuthenticated />
      </Suspense>
    );
  }

  // Anonim ana sayfa → PublicHome. SEO içeriği auth beklemeden anında görünür.
  return (
    <div className={`app-shell safe-screen ${iosDevice ? "ios-device" : ""}`}>
      <PublicHome
        accentTheme={accentTheme}
        onAppleLogin={() => startLogin("apple")}
        onGoogleLogin={() => startLogin("google")}
      />
    </div>
  );
}
