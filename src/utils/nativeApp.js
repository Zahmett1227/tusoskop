import { Keyboard } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { isNativeIOS, isNativePlatform } from "./device";

export function initNativeAppShell() {
  if (!isNativePlatform()) return;

  document.documentElement.classList.add("native-app");
  if (isNativeIOS()) {
    document.documentElement.classList.add("native-ios");
  }

  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  // setBackgroundColor/setOverlaysWebView Android-only'dir; iOS'ta no-op olur.
  // iOS'ta overlay davranışı Info.plist / güvenli alan CSS'i ile yönetilir.
  StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
  SplashScreen.hide().catch(() => {});

  Keyboard.addListener("keyboardWillShow", (event) => {
    document.documentElement.style.setProperty(
      "--native-keyboard-height",
      `${event.keyboardHeight || 0}px`
    );
    document.documentElement.classList.add("keyboard-visible");
  }).catch(() => {});

  Keyboard.addListener("keyboardWillHide", () => {
    document.documentElement.style.setProperty("--native-keyboard-height", "0px");
    document.documentElement.classList.remove("keyboard-visible");
  }).catch(() => {});
}

/**
 * Status bar metin rengini aktif temaya göre ayarlar.
 * Capacitor: Style.Light = koyu metin (açık zemin için), Style.Dark = beyaz metin.
 * "Beyaz" tema seçildiğinde beyaz metin okunmaz kalıyordu — bu onu düzeltir.
 * @param {boolean} isLightTheme
 */
export function applyStatusBarForTheme(isLightTheme) {
  if (!isNativePlatform()) return;
  StatusBar.setStyle({ style: isLightTheme ? Style.Light : Style.Dark }).catch(() => {});
}
