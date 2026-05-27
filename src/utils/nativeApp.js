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
  StatusBar.setBackgroundColor({ color: "#020617" }).catch(() => {});
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
