# Instagram Otomasyon

Günlük TUS sorusu story'si. GitHub Actions ile otomatik çalışır.

## Kurulum

### 1. Font dosyaları
`scripts/instagram/fonts/` klasörüne Inter fontlarını ekle:
- `Inter-Bold.ttf`
- `Inter-Regular.ttf`

[Google Fonts](https://fonts.google.com/specimen/Inter) → "Download family"

### 2. Arka plan görselleri (opsiyonel)
`scripts/instagram/backgrounds/` klasörüne her ders için PNG eklenirse
story arka planı o görseli kullanır. Yoksa gradient arka plan kullanılır.

Dosya isimleri: `fizyoloji.png`, `dahiliye.png`, `mikrobiyoloji.png`, vb.

### 3. GitHub Secrets
Repo → Settings → Secrets → Actions:

| Secret | Değer |
|--------|-------|
| `IG_USERNAME` | Instagram kullanıcı adı |
| `IG_PASSWORD` | Instagram şifresi |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON (tek satır) |

Firebase service account'u tek satıra çevirmek için:
```bash
cat serviceAccount.json | python -c "import sys,json; print(json.dumps(json.load(sys.stdin)))"
```

### 4. Manuel test
```bash
# Önce soruları dışa aktar
node scripts/export-questions.mjs

# Sonra test PNG üret (Instagram'a göndermez)
cd scripts/instagram
pip install -r requirements.txt
python story_image.py

# Gerçek yayın
python post_story.py
```

## Workflow
GitHub Actions her gün saat 10:00 İstanbul (07:00 UTC) otomatik çalışır.
Ayrıca Actions sekmesinden "Run workflow" ile manuel tetiklenebilir.
