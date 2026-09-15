# Reklam kreatifleri (SVG/HTML → Chrome PNG)

Meta reklam görselleri. Plan: `META_ADS_MEDIA_PLAN.md`. Üretim:

```bash
node scripts/ads-creatives/render.mjs <html> <out.png> <width> <height>
# örn:
node scripts/ads-creatives/render.mjs scripts/ads-creatives/k8-sosyal-kanit.html public/ads/k8-sosyal-kanit.png 1080 1350
```

- `k8-sosyal-kanit.html` → `public/ads/k8-sosyal-kanit.png` (K8 — App Store 5,0 ★ + 3 gerçek yorum kartı, 4:5). **Yorumlar birebir gerçek** (App Store, Haz 2026); sayı şişirilmez.
- PNG'ler `public/ads/` altında (deploy sonrası `https://www.tusoskop.com/ads/...` olarak Meta `image_url`'e verilebilir).
