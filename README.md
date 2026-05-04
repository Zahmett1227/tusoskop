# Tusoskop

TUS hazırlık için **React 19**, **Vite 8**, **Tailwind 4** ve **Firebase** (Auth, Firestore, Analytics) kullanan web uygulaması.

## Gereksinimler

- Node.js **20+**
- npm

## Kurulum

```bash
npm ci
```

> **Not:** Gerekirse `.npmrc` içinde `legacy-peer-deps=true` gibi ek çözünürlükler kullanılabilir; yoksa standart `npm ci` yeterlidir.

## Ortam değişkenleri

`.env` veya `.env.local` içinde yalnızca `VITE_` önekli değişkenler istemciye enjekte edilir. Örnek için `.env.example` dosyasına bakın.

- **Microsoft Clarity:** `VITE_CLARITY_PROJECT_ID` — tanımlı değilse Clarity snippet’i üretilmez (`vite.config.js`).
- **Shopify Plus ödeme bağlantıları:** `VITE_SHOPIFY_PLUS_1M_URL`, `VITE_SHOPIFY_PLUS_3M_URL`, `VITE_SHOPIFY_PLUS_6M_URL` — `src/config/plusPlans.js` içinde kullanılır.

Firebase Web SDK yapılandırması şu an **`src/firebase.js`** içinde sabit tanımlıdır; fork veya farklı ortam için bu dosyayı güncelleyin veya ileride `VITE_` tabanlı yapılandırmaya taşıyın.

## Komutlar

| Komut | Açıklama |
|--------|----------|
| `npm run dev` | Geliştirme sunucusu (Vite) |
| `npm run build` | Üretim derlemesi (`dist/`) |
| `npm run preview` | Derlenmiş çıktıyı yerelde önizleme |
| `npm run lint` | ESLint |
| `npm run test` | Birim testleri (Vitest) |
| `npm run test:e2e` | Playwright e2e — derlenmiş `dist/` gerekir (`vite preview`); önce `npm run build` çalıştırın |
| `npm run test:e2e:full` | `build` + `test:e2e` (yerelde tek komut) |

## Kalite ve CI

- **Vitest:** `src/**/*.test.js` birim testleri; yapılandırma [`vitest.config.js`](vitest.config.js) ve isteğe bağlı [`src/test/setupTests.js`](src/test/setupTests.js).
- **Playwright:** `e2e/` — örnek duman testi ana sayfa başlığını doğrular.
- **GitHub Actions:** `.github/workflows/ci.yml` — `lint` → `test` → `build` → Playwright (Chromium).

## Soru bankası

Soru verisi [`src/data/questionChunks/`](src/data/questionChunks/) altında derse göre parçalara ayrılır; uygulama açılışında [`loadAllQuestions()`](src/data/questions.js) ile paralel yüklenir. Eski tek dosyalı (`QUESTIONS` dizi export) bir kaynağınız varsa bir kerelik parçalamak için:

```bash
node scripts/split-questions.mjs
```

(Komut, o anda [`src/data/questions.js`](src/data/questions.js) içinden tam `QUESTIONS` export’unu bekler — güncelleme akışınızda tam dizi dosyasını geçici olarak geri koymanız gerekebilir.)

## PWA ve çevrimdışı önbellek

- **Manifest:** [`public/manifest.json`](public/manifest.json) (ana ekran / PWA meta).
- **Service worker:** [`public/sw.js`](public/sw.js) kabuk varlıklarını hafifçe önbelleğe alır. Üretimde [`src/registerServiceWorker.js`](src/registerServiceWorker.js) `main.jsx` üzerinden kayıt edilir; geliştirme modunda kayıt yapılmaz. Soru bankası parçaları (JS chunk’lar) çalışma anında ağdan yüklenmeye devam eder.

## Firebase deploy

Firebase Hosting, Firestore kuralları ve **Cloud Functions** (`functions/`, `incrementUsage` callable) proje kökündeki [`firebase.json`](firebase.json) ve [`firestore.rules`](firestore.rules) ile yönetilir. Kullanım sayaçları yalnızca Functions + Admin SDK ile yazar; istemci doğrudan yazamaz.

```bash
cd functions && npm ci && cd ..
npm run build
npx -y firebase-tools@latest deploy --only hosting,firestore:rules,functions
```
