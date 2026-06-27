import { useEffect, useRef } from "react";

/**
 * Meta (Facebook) Pixel sarmalayıcısı.
 *
 * Clarity (`src/lib/clarity.js`) ile aynı yaklaşım: pixel ID yalnızca
 * `.env`'den (`VITE_META_PIXEL_ID`) okunur, `fbq` base snippet'i ilk
 * render'dan sonra `initMetaPixel()` ile JS'ten yüklenir. Pixel ID yoksa
 * ya da `fbq` (ad-blocker / yüklenmeme) yoksa her şey sessizce atlanır;
 * hiçbir event uygulamayı çökertmez.
 */

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;
let pixelInitialized = false;

function inBrowser() {
  return typeof window !== "undefined";
}

function fbqReady() {
  return inBrowser() && typeof window.fbq === "function";
}

/**
 * `fbq` base snippet'ini yükler ve init eder. İlk PageView'ı da burada atar.
 * `main.jsx`'te ilk paint sonrası, Clarity'nin yanında çağrılır.
 */
export function initMetaPixel() {
  if (!PIXEL_ID || !inBrowser() || pixelInitialized) {
    if (!PIXEL_ID && import.meta.env.DEV) {
      console.warn("[MetaPixel] VITE_META_PIXEL_ID tanımlı değil, pixel devre dışı.");
    }
    return;
  }

  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
  pixelInitialized = true;
}

function track(event, params) {
  if (!PIXEL_ID || !fbqReady()) return;
  try {
    params ? window.fbq("track", event, params) : window.fbq("track", event);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("[MetaPixel] track failed:", event, err);
    }
  }
}

export function trackPageView() {
  track("PageView");
}

export function trackCompleteRegistration({ method } = {}) {
  track("CompleteRegistration", {
    content_name: "Tusoskop Kayıt",
    status: true,
    ...(method ? { registration_method: method } : {}),
  });
}

export function trackPurchase({ value = 89.9, currency = "TRY", orderId } = {}) {
  track("Purchase", {
    content_name: "Tusoskop Plus Abonelik",
    content_type: "subscription",
    currency,
    value,
    ...(orderId ? { order_id: orderId } : {}),
  });
}

/**
 * react-router yok; App.jsx state-based `view` ile gezinir.
 * `view` değiştikçe PageView atar. İlk PageView `initMetaPixel()`'de
 * atıldığı için ilk effect çalışması (mount) guard ile atlanır —
 * StrictMode'da çift PageView'ı da önler.
 */
export function usePageTracking(view) {
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    trackPageView();
  }, [view]);
}
