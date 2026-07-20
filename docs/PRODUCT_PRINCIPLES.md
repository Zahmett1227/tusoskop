# Ürün İlkeleri

> Her özellik/PR bu listeye karşı test edilir. İlke ihlali gerektiren iş `DECISION_LOG.md`'ye
> gerekçeli istisna olarak yazılmadan yapılmaz.

1. **Öncelik zinciri sabittir:** güvenilirlik → ölçüm → aktivasyon → retention → monetizasyon → ölçeklenme. Alt sıradaki iş, üst sırada kırmızı bir alarm varken yapılmaz.
2. **Ölçmediğin özelliği yayınlama.** Her yayının, yayın gününden önce tanımlı bir başarı metriği ve vazgeçme kriteri vardır (`GROWTH_EXPERIMENTS.md` formatı).
3. **Hafıza kutsaldır.** FSRS zamanlaması tek otoritedir (CLAUDE.md kuralı); hiçbir özellik kullanıcının tekrar takvimini pazarlama amacıyla bozamaz (ör. "bugün şunu da çöz" baskısı due kartların önüne geçemez).
4. **Değer önce, paywall sonra.** Kullanıcı kendi verisiyle değeri görmeden ödeme ekranı görmez. D0 cold paywall yasak.
5. **Sunucu, para ve yetkinin tek sahibidir.** Fiyat, premium durumu, kullanım limiti, lig skoru — istemciden asla yazılmaz/alınmaz. (PayTR deseni referanstır: `functions/paytr.js`.)
6. **Tıbbi içeriği yalnızca insan onaylar.** AI mevcut, uzman onaylı içeriğe yönlendirir; tıbbi metin üretmez. Soru/açıklama değişikliği uzman onayı olmadan merge edilmez (`QUESTION_BANK_QUALITY_WORKFLOW.md` kapıları).
7. **Kullanıcıya yalan söyleme.** Pazarlama sayıları her zaman gerçeğin altında yuvarlanır ("7.000+" kuralı). Sahte kullanıcı, şişirilmiş yüzdelik, kesinlik taşımayan kalibrasyonun kesinmiş gibi sunulması yasak. Az veri varsa "aralık + şeffaf etiket".
8. **Tek kurucu gerçeği:** aynı anda en fazla 2 iş akışı; en fazla 2 aktif deney. Haftalık en az 1 kullanıcıya-dokunan iş (moral + sinyal).
9. **Dershaneyle içerik hacminde yarışma.** Fark kişiselleştirme, analiz ve hızdır. "X bin soru" yarışına giren her iş reddedilir (`DO_NOT_BUILD.md`).
10. **Basit çözüm önce.** Yeni bağımlılık/servis eklemeden önce mevcut altyapıyla (Firebase, Vercel, mevcut desenler) çözülüp çözülemeyeceği yazılı olarak sorgulanır. Rewrite teklifleri varsayılan olarak reddedilir.
11. **Geri dönüşü olmayan işler (fiyat değişikliği, veri silme, Apple sözleşmeleri) bir gece bekletilir** ve `DECISION_LOG.md`'ye yazılmadan uygulanmaz.
12. **Türkçe, net, saygılı ürün dili.** Öğrenciye tepeden bakmayan, suçlamayan kopya ("streak kırıldı, berbatsın" değil; "kaldığın yerden 10 dakikada dönersin").
