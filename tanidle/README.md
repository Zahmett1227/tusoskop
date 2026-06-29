# Tanıdle 🩺

Günlük TUS klinik vaka tahmin oyunu — **Doctordle**'ın Türkçe / TUS uyarlaması.

Her gün bir klinik vaka. İlk ipucu açık başlar; her yanlış tahmin yeni bir ipucu
açar. Ne kadar az ipucuyla doğru tanıyı/yanıtı bulursan o kadar iyi.

Vakalar [Tusoskop](https://tusoskop.com) TUS soru bankasındaki gerçek klinik
vignette'lerden otomatik üretilir (cümle cümle ipucu yapısı).

## Mimari

- **Frontend**: React + Vite + TailwindCSS
- **Auth/DB**: Firebase — **Tusoskop ile aynı proje** (giriş opsiyonel; girişsiz
  localStorage ile tam çalışır, giriş yapılırsa `tanidleStats/{uid}` koleksiyonuna
  istatistik yedeklenir). Tusoskop koleksiyonlarına dokunulmaz.
- **Deploy**: Vercel (Tusoskop'tan bağımsız repo + proje)
- **Veri**: `public/questions.json` — build script tarafından üretilir.

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/
```

## Veriyi Yeniden Üretmek

`public/questions.json`, Tusoskop soru bankasından üretilir. Tusoskop reposunu
yan yana klonla, sonra:

```bash
# varsayılan kaynak: ../src/data/questionChunks (yan yana tusoskop reposu)
npm run data
# veya özel yol:
node scripts/build-questions.mjs /path/to/tusoskop/src/data/questionChunks
```

Pipeline klinik dersleri (Dahiliye, Pediatri, Genel Cerrahi, Kadın Hastalıkları
ve Doğum, Küçük Stajlar) tarar; çok cümleli vignette'leri ipucu setlerine çevirir.
Şu an **2009 vaka** üretiliyor (~5.5 yıllık günlük bulmaca).

## Ortam Değişkenleri

`.env.example` dosyasını `.env`'e kopyalayıp Firebase web config değerlerini gir.
Boş bırakılırsa oyun anonim modda çalışır.

## Bu Repoyu Ayrı Repo + Vercel'e Taşımak

Bu klasör Tusoskop reposundan ayrı, bağımsız bir uygulamadır. Kendi reposuna
taşımak için:

```bash
# tanidle/ klasörünü repo dışına kopyala
cp -r tanidle ~/tanidle && cd ~/tanidle
git init && git add . && git commit -m "Tanıdle ilk sürüm"
git branch -M main
git remote add origin git@github.com:KULLANICI/tanidle.git
git push -u origin main
```

Sonra Vercel'de **New Project → tanidle reposu** → Framework: Vite → Environment
Variables'a `VITE_FIREBASE_*` değerlerini ekle → Deploy.

> Firebase Console → Authentication → Settings → **Authorized domains** listesine
> yeni Vercel/özel domaini eklemeyi unutma (Google girişi için).
