# Tusoskop SEO Mimari Planı

Bu doküman iki bölümden oluşur:

1. **Bu turda yapılan acil SEO düzeltmeleri** (mevcut React/Vite içinde, düşük risk).
2. **Uzun vadeli mimari karşılaştırması** (Astro vs Next.js vs mevcut Vite) ve öneri.

---

## 1. Bu turda yapılanlar (mevcut React/Vite)

Amaç: Google'ın "Tarandı – şu anda dizine eklenmiş değil" ve "Yönlendirmeli sayfa"
sinyallerini düzeltmek; büyük migration yapmadan ana sayfayı login ekranı olmaktan
çıkarıp gerçek public landing'e çevirmek.

### Tespit edilen kök sorunlar

| # | Sorun | Çözüm |
|---|-------|-------|
| 1 | `PublicHome` bileşeni hazır ama hiç kullanılmıyordu; `/` anonim kullanıcıya **login ekranı** gösteriyordu (Google'ın gördüğü render buydu) | `App.jsx`'te `pathRoute` çözümlemesi: anonim `/` → `PublicHome` |
| 2 | Ana sayfa SEO içeriği yalnızca `<noscript>` içindeydi | İçerik artık `#root` içinde **gerçek DOM** (`renderHomeSeoStatic`), React mount olunca `PublicHome` ile değişir. `<noscript>` kullanımı kaldırıldı |
| 3 | Canonical/sitemap/robots **non-www** (`tusoskop.com`), site **www**'de çalışıyor | Tüm domain referansları `https://www.tusoskop.com`'a çekildi (tek kaynak: `seoContent.js > SITE_URL`) |
| 4 | `/giris` ve `/app` route ayrımı yoktu | Hafif pathname router: `/` (landing), `/giris` (login), `/app` (uygulama). react-router eklenmedi |
| 5 | İstenen bazı slug'lar eksik | `/hakkimizda` eklendi; `tusoskop-fiyatlandirma` → `/fiyatlandirma` (301 redirect ile) |

### Route haritası (mevcut, state + pathname hibrit)

| Yol | Anonim | Girişli | Notlar |
|-----|--------|---------|--------|
| `/` | `PublicHome` (zengin landing) | Uygulama (dashboard) | SEO için kritik |
| `/giris` | Login ekranı | Uygulama | `noindex,follow` |
| `/app` | Login ekranı | Uygulama | `noindex,follow` |
| `/tus-*-sorulari`, `/tusoskop-nedir`, `/fiyatlandirma`, `/hakkimizda`, … | Statik prerender + React `SeoLandingPage` | Aynı (auth'tan bağımsız) | Auth beklemeden render |
| `/gizlilik-sozlesmesi`, `/kullanim-kosullari` | Statik prerender | Aynı | FAQ şeması yok |

### Üç render katmanı (hepsi `src/seo/seoContent.js`'ten beslenir)

| Katman | Dosya | Görev |
|--------|-------|-------|
| React (canlı) | `src/components/seo/PublicSeoPages.jsx` | `PublicHome` + `SeoLandingPage` |
| Ana sayfa statik fallback | `scripts/render-home-seo.mjs` → `vite.config.js` | `#root` içine gerçek DOM home içeriği (curl/no-JS/AI botları) |
| Branş/içerik statik prerender | `scripts/generate-seo-pages.mjs` | `public/{slug}/index.html` + `sitemap.xml` + `robots.txt` |

### Doğrulama (bu turda)

- `npm run test` → 334/334 geçti.
- `npm run build` → başarılı.
- Tarayıcı (Chromium) render testi:
  - `/` → `PublicHome` (login değil) ✓
  - `/giris` → login ekranı ✓
  - `/tus-deneme-analizi` → SEO sayfası, auth beklemeden ✓
- `curl /` ham HTML'inde H1 + branş linkleri + FAQ mevcut (noscript değil).
- Tüm canonical / sitemap / robots `www`.

### Hâlâ açık / sonraki adımlar (bu turda kapsam dışı)

Bunlar yeni **özellik/araç** gerektirir, "acil SEO düzeltmesi" değildir:

- `/tus-puan-hesaplama` — interaktif TUS puan hesaplama aracı (net → tahmini puan).
  SEO değeri yüksek ("ücretsiz araç" sayfası). Mevcut sistemde içerik sayfası olarak
  başlatılıp sonra hesaplayıcı eklenebilir.
- `/tus-kontenjan-tablosu` — bilgi/tablo sayfası (yıllık ÖSYM kontenjan verisi).
  Veri kaynağı + güncelleme süreci gerektirir.
- Sitelink adaylarını güçlendirmek için iç linkleme ve içerik derinliği artırımı.

---

## 2. Uzun vadeli mimari karşılaştırması

Hedef yapı (kullanıcı tercihi):

```
www.tusoskop.com            → Public SEO / pazarlama sitesi (statik, hızlı)
www.tusoskop.com/app        → Mevcut React/Firebase uygulaması
www.tusoskop.com/giris      → Uygulama login route'u
www.tusoskop.com/tus-*      → SEO sayfaları
```

### Seçenek A — Astro (public site) + mevcut Vite app (/app)

**Artılar**
- İçerik/pazarlama sayfaları için en iyi statik HTML çıktısı; sıfıra yakın JS.
- "Islands" ile yalnızca gereken yerde React; SEO sayfaları çok hızlı açılır.
- Mevcut React bileşenleri (`PublicHome`, `SeoLandingPage`) `astro-react` ile
  büyük ölçüde yeniden kullanılabilir.
- `seoContent.js` tek doğruluk kaynağı olarak aynen kalabilir.

**Eksiler**
- İki build sistemi (Astro + Vite) ve iki ayrı dağıtım/output birleştirme.
- Dinamik/SSR ihtiyaçları (ör. server-side puan hesaplama API'leri) Astro
  endpoints ile karşılanır ama Next kadar olgun değil.

**Uygun olduğu durum:** Ağırlık içerik/marketing + statik araç sayfalarıysa.

### Seçenek B — Next.js (public + app birlikte)

**Artılar**
- SSR/SSG/ISR tek çatı altında; route bazlı `metadata` API'si ile canonical/OG
  yönetimi native.
- Programmatic SEO (yüzlerce konu sayfası), blog, dinamik tablolar (kontenjan)
  için en güçlü seçenek.
- React ekosistemiyle doğal uyum; mevcut bileşenler taşınabilir.

**Eksiler**
- En büyük migration: Firebase Auth (client SDK), Capacitor entegrasyonu ve
  mevcut `view`-state mimarisi App Router'a taşınmalı.
- App Router + Firebase client auth + statik export ikilemleri dikkat ister.

**Uygun olduğu durum:** İleride güçlü dinamik SEO + tek çatı isteniyorsa.

### Seçenek C — Mevcut Vite'ı koru (bu turda yapılan)

**Artılar**
- Sıfır migration riski; iOS/Capacitor ve Firebase Auth hiç etkilenmez.
- Prerender script + `#root` fallback ile temel SEO ihtiyacı bugün karşılandı.

**Eksiler**
- Ana sayfa hâlâ client-render + statik fallback hibriti (gerçek SSR değil).
- Programmatic SEO ölçeklenince script tabanlı prerender yönetimi ağırlaşır.

### Vercel routing notları

- `vercel.json` rewrites: statik dosyalar (prerender `public/{slug}/index.html`)
  filesystem'den servis edilir; eşleşmeyen yollar `/index.html`'e (SPA) düşer.
- İki katmanlı yapıda (örn. Astro + Vite): Astro `dist`'i kök, Vite app çıktısı
  `/app` altına monte edilir. Vercel'de bu, iki proje veya tek projede
  `outputDirectory` + path-based rewrite ile kurgulanabilir.

### Capacitor / iOS etkisi

- iOS uygulaması `index.html`'i **yerelden** yükler ve `ios-appstore-v1` branch'inde
  yaşar. Public marketing sitesi (Astro/Next) iOS bundle'a **dahil edilmez**;
  iOS yalnızca uygulama katmanını (`/app`) paketler.
- Bu turdaki değişiklikler `main` (web/PWA) odaklıdır. iOS branch'i için kritik
  not: iOS'ta anonim `/` artık `PublicHome` render eder — iOS'ta açılışta doğrudan
  login isteniyorsa, iOS branch'inde `/` → `/giris` yönlendirmesi veya
  `Capacitor.isNativePlatform()` kontrolü eklenmelidir (cherry-pick sırasında dikkat).

### Tahmini iş yükü

| Seçenek | Efor | Risk |
|---------|------|------|
| C (mevcut Vite, yapıldı) | Tamamlandı | Düşük |
| A (Astro public + /app) | ~1–2 hafta | Orta |
| B (Next.js tam migration) | ~3–5 hafta | Yüksek |

### Önerilen nihai mimari

Aşamalı:

1. **Şimdi (yapıldı):** Mevcut Vite içinde acil düzeltmeler — `/` public landing,
   www canonical, route ayrımı, sitemap/robots.
2. **Orta vade:** `/tus-puan-hesaplama` ve `/tus-kontenjan-tablosu` araç sayfalarını
   mevcut prerender sistemine ekle (hızlı kazanç, migration gerektirmez).
3. **Uzun vade:** İçerik/SEO yükü büyürse **Astro public site + `/app` altında mevcut
   React app** (Seçenek A). Next.js'e ancak güçlü dinamik/programmatic SEO ihtiyacı
   netleşirse geçilmeli. Her durumda `seoContent.js` tek doğruluk kaynağı korunmalı.
