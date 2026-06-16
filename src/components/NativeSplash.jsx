import React, { useEffect, useState } from "react";
import { SplashScreen } from "@capacitor/splash-screen";
import { isNativePlatform } from "../utils/device";

/**
 * Giriş ekranıyla uyumlu, logolu marka splash'i.
 *
 * Native (iOS) tarafta capacitor.config.json içinde `launchAutoHide: false`
 * olduğundan, bu React bileşeni mount olunca native splash gizlenir ve
 * markalı React splash devralır. Auth durumu hazır olunca bileşen unmount
 * olur ve uygulama içeriği görünür.
 */
export default function NativeSplash({ accentTheme }) {
  const [visible, setVisible] = useState(false);
  const titleColor = accentTheme?.text || "text-emerald-400";

  useEffect(() => {
    // fade-in
    const raf = requestAnimationFrame(() => setVisible(true));

    // Native splash'i gizle ki markalı React splash görünsün (güvenlik ağı;
    // initNativeAppShell başlangıçta zaten çağırır).
    if (isNativePlatform()) {
      SplashScreen.hide().catch(() => {
        /* sessizce geç */
      });
    }

    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950"
      style={{ backgroundColor: "#020617" }}
    >
      <div
        className={`flex flex-col items-center transition-opacity duration-500 ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <img
          src="/tusoskop-mark.png"
          alt=""
          width={96}
          height={96}
          decoding="async"
          className="h-24 w-24 rounded-2xl object-contain shadow-2xl shadow-black/30"
          aria-hidden
        />
        <h1 className={`mt-5 text-4xl font-black tracking-tighter ${titleColor}`}>
          TUSOSKOP
        </h1>
        <div className="mt-8 h-8 w-8 rounded-full border-2 border-slate-700 border-t-emerald-400 animate-spin" />
      </div>
    </div>
  );
}
