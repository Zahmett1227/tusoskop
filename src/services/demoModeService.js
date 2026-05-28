import { isNativeIOS } from "../utils/device";

export const DEMO_USER = Object.freeze({
  uid: null,
  displayName: "Demo Kullanıcı",
  email: "demo@tusoskop.local",
  isDemo: true,
});

export const DEMO_USER_DATA = Object.freeze({
  demoMode: true,
  plan: "demo",
  premiumStatus: "inactive",
  lifetimePremium: false,
  premiumUntil: null,
  isDemo: true,
});

export function isDemoMode(user, userData) {
  return Boolean(
    user?.isDemo === true ||
      userData?.demoMode === true ||
      userData?.isDemo === true ||
      userData?.plan === "demo"
  );
}

export function shouldShowDemoLogin() {
  return isNativeIOS();
}
