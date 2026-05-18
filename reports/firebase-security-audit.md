# Tusoskop Firebase / Firestore Güvenlik Denetimi

**Tarih:** 2026-05-17  
**Kapsam:** Mevcut güvenlik modeli, `firestore.rules`, istemci yazma noktaları, admin/premium/usage akışları. Kod veya rules değişikliği yapılmadı.  
**Yöntem:** Statik kod/rules incelemesi; Firestore rules emulator test altyapısı **yok** (repo içinde `@firebase/rules-unit-testing` / emulator test bulunamadı).

---

## Genel Sonuç

Tusoskop’un Firestore güvenlik modeli **temel hedefleri büyük ölçüde karşılıyor**: kullanıcı `users/{uid}` ve alt koleksiyonlarında sahiplik kontrolü, premium alanlarının owner update’inde diff ile kilitlenmesi, `users/{uid}/usage` için istemci yazımının kapalı olması ve usage artışının `incrementUsage` callable + Admin SDK üzerinden yapılması doğru tasarlanmış. Admin yetkisi yalnızca `admins/{uid}` + `active == true` ile tanımlanıyor; `admins` koleksiyonuna istemci yazımı kapalı.

**Kritik (üretimde doğrudan istismar) bulgu tespit edilmedi** — kanıtlı: free kullanıcı rules üzerinden kendi `lifetimePremium` / `plan` alanlarını güncelleyemez; başka kullanıcının `users` belgesini okuyamaz; usage alt koleksiyonuna yazamaz; admin işlemleri rules’ta `isAdmin()` gerektirir.

**Orta seviye** riskler: purchase intent create sırasında alan doğrulaması eksikliği (spam / sahte status), callable başarısızken usage’un yalnızca `localStorage` ile sayılması, `users` belgesinde `role` / `isAdmin` / `admin` alanlarının korunmaması (şu an UI `admins` koleksiyonunu kullanıyor), rules’ta tanımlı ancak istemcide kullanılmayan koleksiyonlar (`examResults`, `studyCollections`, `streaks`).

Premium kararları `isUserPremium(userData)` ile Firestore `users` belgesinden geliyor; `localStorage` premium için güven kaynağı değil.

---

## Kritik Bulgular

Bu turda **kanıtlanmış kritik bulgu yok**.

| Risk | Dosya / rule path | Etki | Kanıt | Önerilen düzeltme | Aciliyet |
|------|-------------------|------|-------|-------------------|----------|
| *(yok)* | — | — | Rules + istemci yazma noktaları incelendi | — | — |

**Not:** Aşağıdaki maddeler bilinçli olarak kritik sayılmadı (kanıt / mevcut kod akışı):

- **Usage local fallback:** `incrementQuestionUsage` callable hata verince `getLocalUsage()` kullanıyor; fakat `App.jsx` önce `canAnswerQuestion` → `getUserUsage` (remote ile `max` merge) çağırıyor. Sunucuda limit doluysa merge ile kapı genelde kapanır. İstismar, callable’ı sürekli engelleyip Firestore okumasını da bozan senaryolara bağlı — **Orta** bölümde.
- **Firebase web API key:** `src/firebase.js` içinde açık; Firebase web SDK için beklenen durum, secret değil.

---

## Orta Seviye Bulgular

| Risk | Dosya / rule path | Etki | Kanıt | Önerilen düzeltme | Aciliyet |
|------|-------------------|------|-------|-------------------|----------|
| Purchase intent create alan doğrulaması yok | `firestore.rules` `premiumPurchaseIntents/{intentId}` L118–122; `purchaseIntentService.js` L14–35 | Kullanıcı konsol/SDK ile `status: "manually_activated"`, sahte `activatedBy` vb. gönderebilir. Premium **otomatik verilmez** (grant yalnızca admin `users` update). Admin panelde yanıltıcı kayıt / spam mümkün | Rules: yalnızca `uid == auth.uid`. `status`, `activatedAt` vb. için kısıt yok. İstemci `status: "started"` yazar | Create’te `status == 'started'` zorunlu; `activated*`, `paymentChecked*` alanlarını create’te reddet | Orta |
| Sınırsız purchase intent spam | Aynı | Aynı kullanıcı binlerce intent oluşturabilir; admin listesi şişer, operasyonel yük | `addDoc` rate limit yok; delete kapalı | Rate limit (rules veya Cloud Function), admin filtre, eski intent arşivi | Orta |
| Usage: callable fail → local-only increment | `usageLimitService.js` L189–212, L226–244, vb. | Functions engellenirse günlük limit istemcide `tusoskopUsage` ile sayılabilir (cihaz başına ~FREE_LIMITS kadar). Sunucu sayacı güncellenmeyebilir | `catch` içinde `getLocalUsage()` ile artış; merge path’ten bağımsız | Callable hata verince **fail-closed** (işlemi başlatma) veya increment öncesi `getUserUsage` ile sunucu sayacını tekrar oku | Orta |
| Firestore okuma hatasında yalnızca local usage | `usageLimitService.js` L136–139 | `getDoc` fail olursa `return localUsage` — manipüle edilmiş local tek kaynak olur | `catch` dalı | Okuma hatasında limit gösterimini kısıtla / yeniden dene; premium yine Firestore’dan | Orta |
| `role`, `isAdmin`, `admin` users belgesinde korunmuyor | `firestore.rules` L19–63 | Owner `update` ile bu alanları set edebilir. **Şu an** `isCurrentUserAdmin` yalnızca `admins/{uid}` okur (`adminService.js` L18–21); UI bypass yok | `affectedKeys().hasAny` listesinde yok | Aynı premium listesine `role`, `isAdmin`, `admin` ekle | Orta (savunma derinliği) |
| Rules’ta tanımlı, istemcide kullanılmayan koleksiyonlar | `examResults`, `studyCollections`, `streaks` | Gelecekte yanlış path ile yazılırsa rules ayrı; streak gerçekte `users/{uid}` üzerinde (`streakService.js` L15–38) | `src` içinde `studyCollections` / `examResults` / `streaks/` referansı yok | Rules’ı gerçek path ile hizala veya kullanılmayan match’leri kaldırıp dokümante et | Orta |
| `premiumPurchaseIntents` kullanıcı read kapalı | Rules L121 | Kullanıcı kendi intent’ini okuyamaz (tasarım tercihi). UX sorunu, güvenlik açığı değil | `allow read: if isAdmin()` | Gerekirse `read: uid == auth.uid` (yalnızca kendi belgeleri) | Düşük-Orta |

---

## Düşük Seviye Bulgular

| Risk | Dosya / rule path | Etki | Kanıt | Önerilen düzeltme |
|------|-------------------|------|-------|-------------------|
| `users` listesi admin’e açık, pagination yok | `adminService.js` L44 | Büyük projede maliyet / yavaş panel | `getDocs(collection(db, "users"))` | Sayfalama, arama Cloud Function |
| `results` / `studySessions` immutable ama create serbest | Rules L104–115 | Sahte skor kaydı (kendi `userId` ile) | `userId == auth.uid` create | İsteğe bağlı sunucu doğrulama |
| Streak alanları `users` üzerinde owner yazılabilir | `streakService.js` | `currentStreak` şişirme (kozmetik) | Owner update streak alanları | Kritik değil; istenirse callable |
| Admin panel gizleme | `AdminPanel.jsx` L123 | UI-only değil; rules admin zorunlu | `if (!isAdmin) return null` + rules | Dokümantasyon |
| Firebase config repoda sabit | `src/firebase.js` L13–21 | Public web config | Standart Firebase pattern | İsteğe bağlı `VITE_*` env’e taşıma |
| Rules unit test yok | — | Regresyon riski | Grep: emulator test yok | `@firebase/rules-unit-testing` ekle (ayrı tur) |

---

## Koleksiyon Bazlı Yetki Matrisi

| Koleksiyon | Owner read | Owner write | Admin read | Admin write | Client write güvenli mi? | Not |
|------------|------------|-------------|------------|-------------|---------------------------|-----|
| `users/{uid}` | Evet (`isOwner`) | Evet (premium alanları hariç) | Evet | Evet (tüm alanlar) | Premium: **evet** (rules). Diğer alanlar: evet | Streak `users` üzerinde |
| `users/{uid}/usage/{id}` | Evet | **Hayır** | Evet | Hayır (Functions) | **Evet** — yalnızca CF | `incrementUsage` |
| `users/{uid}/wrongQuestions/{id}` | Evet | Evet | Evet | Evet | Evet (owner path) | `studyCollectionService.js` |
| `users/{uid}/favoriteQuestions/{id}` | Evet | Evet | Evet | Evet | Evet | Aynı |
| `admins/{uid}` | Hayır | Hayır | Evet | Hayır | **Evet** | Yalnızca Console/Admin SDK |
| `adminLogs/{id}` | Hayır | Hayır | Evet | create only | **Evet** | update/delete kapalı |
| `premiumPurchaseIntents/{id}` | Hayır | create only (`uid==auth`) | Evet | Evet (update) | Kısmen — create alanları gevşek | Grant admin panelden |
| `results/{id}` | Kendi `userId` | create only | Evet | Hayır | Kısmen | `ExamScreen.jsx`, `logic.js` |
| `studySessions/{id}` | Kendi `userId` | create only | Evet | Hayır | Kısmen | `App.jsx` |
| `streaks/{uid}` | Evet (rules) | Evet | — | — | N/A | **İstemci kullanmıyor** |
| `studyCollections/{uid}/**` | Evet (rules) | Evet | — | — | N/A | **İstemci kullanmıyor** |
| `examResults/{uid}/**` | Evet (rules) | Evet | — | — | N/A | **İstemci `results` kullanıyor** |

**Default deny:** `firestore.rules` sonunda global allow yok; tanımsız koleksiyonlar reddedilir.

---

## Premium Alanları Koruma Matrisi

| Alan | Client create | Client update (owner) | Admin update | Durum |
|------|---------------|------------------------|--------------|-------|
| `lifetimePremium` | Güvenli değer zorunlu (alan varsa) | **Engelli** (diff) | İzinli | **Güvenli** |
| `premiumUntil` | Aynı | Engelli | İzinli | **Güvenli** |
| `premiumStatus` | Aynı | Engelli | İzinli | **Güvenli** |
| `premiumSource` | Aynı | Engelli | İzinli | **Güvenli** |
| `plan` | Aynı | Engelli | İzinli | **Güvenli** |
| `grantedBy` | Aynı | Engelli | İzinli | **Güvenli** |
| `grantedAt` | Aynı | Engelli | İzinli | **Güvenli** |
| `adminNote` | Aynı | Engelli | İzinli | **Güvenli** |
| `role` | **Kısıt yok** (alan yoksa create serbest) | **Yazılabilir** | İzinli | **Zayıf** — savunma derinliği |
| `isAdmin` | Kısıt yok | Yazılabilir | İzinli | **Zayıf** — UI `admins` kullanıyor |
| `admin` | Kısıt yok | Yazılabilir | İzinli | **Zayıf** |

**İstemci yazımı:** `userService.js` create/update güvenli premium varsayılanları kullanır. `adminService.js` grant/revoke yalnızca admin oturumunda (rules `isAdmin()`). `Dashboard.jsx` yalnızca `targetScore` yazar.

**Create bypass:** Owner, premium anahtarları **olmadan** create yapabilir; sonrasında premium anahtarlarını update ile ekleyemez (diff engeli).

---

## Kontrol Başlıkları Özeti

### 1. Kullanıcı ownership
- `users/{uid}`: read/write owner veya admin read — **OK**
- Başka `uid`: istemci yalnızca `user.uid` / `authed.uid` kullanıyor — **OK**
- `wrongQuestions` / `favoriteQuestions` / `usage`: owner veya admin read; usage write kapalı — **OK**
- `results`: `where("userId", "==", authed.uid)` (`PerformanceChartCard.jsx` L73–76) — rules ile uyumlu — **OK**
- `studyCollections` / `examResults`: rules var, istemci farklı path — **Manuel: rules hizalama**

### 2. Premium alanları
- Owner update diff ile korunuyor — **OK**
- Client’ta premium grant yalnızca admin servisleri — **OK**

### 3. Admin yetki modeli
- `isAdmin()` → `admins/{uid}` + `active == true` — **OK**
- `admins` write: false — **OK**
- `adminLogs` / `users` list / grant: admin rules — **OK**
- UI: `AdminPanel` admin değilse `null` — rules da koruyor — **OK**

### 4. Usage limit
- `users/{uid}/usage` client write: false — **OK**
- `incrementUsage`: `request.auth.uid`, client uid parametresi yok — **OK**
- Callable fail → local increment — **Orta risk**
- Başka kullanıcı usage: path owner — **OK**

### 5. Purchase intent
- Create: `uid == auth.uid` — **OK**
- Update/read: admin only — kullanıcı `status` değiştiremez — **OK**
- Otomatik premium yok (`PremiumInfoScreen` → intent + Shopify; grant admin) — **OK**
- Spam / sahte status on create — **Orta**

### 6. Query / rules uyumu
- `results` filtered by `userId` — **OK**
- `getDocs(users)` — yalnızca admin tüm belgeleri okuyabilir — **OK**
- Collection group query yok — **OK**

### 7. Local fallback
- Premium: Firestore `userData` — **OK**
- Usage: `tusoskopUsage` — UX / offline; güven sınırı değil ama limit bypass senaryosu — **Orta**
- Wrong/favorite: local fallback kabul edilebilir — **OK**

### 8. Firebase config / secrets
- `src/firebase.js`: public web config — **OK**
- `.env.example`: placeholder, secret yok — **OK**
- `.gitignore`: `.env` ignored — **OK**
- PayTR/Groq/service account client’ta yok — **OK**

### 9. Cloud Functions
- Tek callable: `incrementUsage` — auth zorunlu — **OK**
- CORS: allowlist — **OK**
- Başka HTTP endpoint yok — **OK**

### 10. Risk önceliklendirme
Yukarıdaki tablolarda sınıflandırıldı.

---

## İlk Düzeltme Önerisi

**Tek problem, tek dosya:** `firestore.rules` içinde `premiumPurchaseIntents` **create** kuralına alan doğrulaması ekleyin:

- `request.resource.data.status == 'started'`
- Create’te `manually_activated`, `activatedAt`, `activatedBy`, `paymentCheckedBy` vb. alanların **olmaması** veya null olması
- İsteğe bağlı: `planId` / `provider` enum doğrulaması

**Gerekçe:** Premium grant hâlâ admin’de kalsa da, sahte `status` ve intent spam’i operasyonel güvenliği ve admin sürecini doğrudan zayıflatır; değişiklik yalnızca rules’ta, istemci davranışını bozmaz.

**İkinci öncelik (ayrı PR):** `users` update/create’te `role`, `isAdmin`, `admin` alanlarını premium listesine eklemek.

---

## Doğrulama Komutları

| Komut | Sonuç |
|-------|--------|
| `npm run lint` | **Geçti** (eslint, exit 0) |
| `npm run test` | **Geçti** — 21 dosya, **205/205** test |
| `npm run validate:questions` | **Geçti** — 4114 soru |
| `npm run build` | **Geçti** (vite build) |
| Firestore rules emulator test | **Yok** — kurulmadı |

---

## İncelenen Ana Dosyalar

- `firestore.rules`, `firebase.json`
- `src/firebase.js`, `src/App.jsx`, `src/hooks/useAppAuthBootstrap.js`
- `src/utils/premiumUtils.js`, `src/services/usageLimitService.js` (kullanıcı `usageService` yerine)
- `src/services/userService.js`, `purchaseIntentService.js`, `adminService.js`, `studyCollectionService.js`, `streakService.js`
- `src/components/admin/*`, `src/components/premium/PremiumInfoScreen.jsx`
- `functions/index.js`

---

*Bu rapor yalnızca statik analizdir. Production Firestore rules sürümünün deploy edilmiş haliyle birebir aynı olduğu varsayılmıştır — **manuel doğrulama:** Firebase Console → Firestore Rules son deploy tarihi.*
