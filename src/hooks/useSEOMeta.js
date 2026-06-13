import { useEffect } from "react";

const BASE_URL = "https://www.tusoskop.com";

const SEO_BY_VIEW = {
  login: {
    title: "TUS Hazırlık | Tusoskop — Akıllı TUS Soru Bankası",
    description:
      "TUS hazırlığını akıllı tekrar sistemi ve kapsamlı soru bankasıyla güçlendir. Konu bazlı TUS soruları, TUS denemesi ve kişiselleştirilmiş çalışma planıyla TUS sınavına hazırlan.",
    path: "/",
  },
  dashboard: {
    title: "TUS Hazırlık | Tusoskop — Akıllı TUS Soru Bankası",
    description:
      "TUS hazırlık panondan akıllı tekrar kuyruğunu ve konu ilerlemeni takip et. Günlük TUS çalışma rutinini Tusoskop ile yönet.",
    path: "/",
  },
  study: {
    title: "TUS Soruları Çöz | Tusoskop",
    description:
      "Konu bazlı TUS soruları çöz, anında açıklama gör. Anatomi, Dahiliye, Pediatri ve tüm TUS ders gruplarında soru çözme pratiği yap.",
    path: "/",
  },
  exam: {
    title: "TUS Denemesi | Tusoskop",
    description:
      "Gerçek TUS sınavı formatında 200 soruluk TUS denemesi çöz. Performansını ölç, zayıf konularını keşfet ve TUS hazırlık sürecini optimize et.",
    path: "/",
  },
  examAnalysis: {
    title: "Deneme Analizi | Tusoskop",
    description:
      "TUS deneme sınav sonuçlarını analiz et. Konu bazlı doğru/yanlış dağılımını gör ve TUS çalışma stratejini şekillendir.",
    path: "/",
  },
  premiumInfo: {
    title: "Tusoskop Plus | Sınırsız TUS Hazırlık",
    description:
      "Sınırsız TUS sorusu, sınırsız deneme sınavı ve akıllı tekrar kuyruğu. Tusoskop Plus ile TUS sınavı hazırlığında üst seviyeye geç.",
    path: "/",
  },
  tracker: {
    title: "Konu Takipçisi | Tusoskop TUS Hazırlık",
    description:
      "TUS konu ilerlemeni takip et. Hangi TUS konularında güçlü, hangilerinde zayıf olduğunu gör ve çalışma planını buna göre düzenle.",
    path: "/",
  },
};

function setMeta(attrName, attrValue, content) {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * View adına göre sayfa başlığı, meta description ve canonical tag'ini günceller.
 * react-helmet gerektirmez; doğrudan DOM üzerinde çalışır.
 */
export function useSEOMeta(viewName) {
  useEffect(() => {
    const seo = SEO_BY_VIEW[viewName] || SEO_BY_VIEW.login;
    const canonical = `${BASE_URL}${seo.path}`;

    document.title = seo.title;
    setMeta("name", "description", seo.description);
    setMeta("property", "og:title", seo.title);
    setMeta("property", "og:description", seo.description);
    setMeta("property", "og:url", canonical);
    setCanonical(canonical);
  }, [viewName]);
}
