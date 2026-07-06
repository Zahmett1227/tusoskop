# Yapılmayacaklar Listesi (DO NOT BUILD)

> Bu liste bir özellik mezarlığı değil, odak sözleşmesidir. Buradan bir maddeyi çıkarmak
> `DECISION_LOG.md`'de gerekçeli karar gerektirir. "Şimdilik değil" maddelerinde koşul yazılıdır.

## Asla (öngörülebilir gelecekte)

| Yapma | Neden |
|---|---|
| Video ders / hoca içeriği | Dershanelerin sahası; üretim maliyeti tek kurucuyu bitirir. Moat kişiselleştirme. |
| "En çok soru" yarışı (pazarlamada veya üretimde hedef olarak soru adedi) | İçerik hacmi savunulamaz; kalite hattı hacimle ölçeklenmez. Soru eklemenin tek meşru gerekçesi müfredat boşluğudur. |
| AI'ın doğrudan kullanıcıya tıbbi içerik üretmesi (soru, açıklama, tanı bilgisi) | Halüsinasyon = sağlık alanında itibar ölümü. AI yalnızca yönlendirir/sıralar (PRODUCT_PRINCIPLES #6). |
| Sahte kullanıcı/skor eklemek (leaderboard dahil) | Güven tek seferde kaybedilir. Mevcut `seedFakeLeaderboard.mjs` kalıntısı temizlenecek (TD-16). |
| Kredi kartı bilgisi saklamak / kendi ödeme altyapısı | PCI yükü; PayTR bu işi yapıyor. |
| Sürekli/kalıcı indirim | Fiyat algısını kalıcı bozar. İndirim yalnızca win-back ve ölü sezon kampanyası. |
| Genel amaçlı sohbet botu ("TUS asistanına soru sor") | Sınırsız yüzey, halüsinasyon riski, yüksek maliyet, ölçülemez değer. |

## Şimdilik değil (koşula bağlı)

| Yapma | Ne zaman yeniden değerlendirilir |
|---|---|
| Android uygulaması | Web mobil (Android tarayıcı) DAU'su iOS DAU'yu geçer ve W4 retention hedefte olursa (Dönem 5). Capacitor sayesinde kapı açık. |
| TUS dışı sınavlar (DUS, YDUS, USMLE) | 24 aydan önce asla; TUS'ta NSM yıllık 3x'e ulaşmadan asla. Veri moat'u sınava özgü. |
| B2B / dershane ortaklığı | Bireysel retention kanıtlanmadan kurumsal satış tek kurucunun tüm zamanını yer. |
| react-router / Next / Astro'ya geçiş, genel mimari rewrite | Yalnızca ölçülmüş bir kullanıcı problemi (CWV, geliştirme hızında somut tıkanma) kanıtlarsa. `SEO_MIGRATION_PLAN.md` tartışması dondurulmuştur. |
| Push bildirimi çeşitlendirmesi (2+ bildirim türü) | Tek "due tekrar" bildirimi opt-out <%10 ile 3 ay çalışmadan yeni tür eklenmez. |
| Referral programı | Aktivasyon ≥%35 ve W4 retention hedefte olmadan davet edilen kullanıcı da sızar (delik kova). |
| Soru bankasında toplu AI üretimi | Ancak Dönem 5+, çift hekim onaylı ayrı havuz süreciyle (MASTER_PLAN §5.9). |
| iOS'ta PayTR/harici ödeme linki göstermek | Hiçbir zaman — Apple 3.1.1. iOS monetizasyonu ya IAP ya hiç (D-007 kararına kadar satın alma yüzeyi iOS'ta gizli kalır). |
| Kişiselleştirilmiş fiyatlandırma / karanlık desen (sahte sayaç, "son 3 saat" vb.) | Asla — güven ilkesiyle çelişir; KVKK/tüketici hukuku riski. |
