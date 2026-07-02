/**
 * iOS/Safari detection using multiple signals.
 * Avoids relying solely on User-Agent which can be spoofed or change across versions.
 */
export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent ?? '';
  const platform = navigator.platform ?? '';
  const maxTouch = navigator.maxTouchPoints ?? 0;

  // Classic iPhone / iPod / iPad (pre-iPadOS 13)
  if (/iPhone|iPod/.test(ua)) return true;
  if (/iPad/.test(ua)) return true;

  // iPadOS 13+ reports as 'MacIntel' but has multi-touch
  if (platform === 'MacIntel' && maxTouch > 1) return true;

  return false;
}

/**
 * Returns true when the app is running in standalone (PWA) mode —
 * either added to home screen on iOS or installed as PWA on Android/desktop.
 */
export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

/**
 * Returns true only on iOS Safari (not Chrome/Firefox/Edge for iOS).
 * Useful for showing the "Add to Home Screen" prompt, which only works in Safari.
 */
export function isIOSSafari() {
  if (!isIOS()) return false;
  const ua = navigator.userAgent ?? '';
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

/**
 * Kaba cihaz sınıfı: "ios" | "android" | "desktop".
 * /coz mikro deneme akışında cihaza uygun CTA seçmek için kullanılır.
 */
export function getDeviceType() {
  if (isIOS()) return 'ios';
  if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent ?? '')) {
    return 'android';
  }
  return 'desktop';
}

// Backward-compatible aliases for clearer naming in UI components.
export const isIOSDevice = isIOS;
export const isStandaloneMode = isStandalone;
