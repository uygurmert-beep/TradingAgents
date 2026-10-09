# KELEPİR — yayın kontrol listesi

Sürüm 1.0.0 · paket kimliği `com.remark.kelepir` · fiyat **₺49**

Bu dosya, "derlendi" ile "mağazada" arasındaki her adımı sırayla veriyor.
Hazır olan işler ✅, senin yapman gerekenler ☐ ile işaretli.

---

## 0 · ÖNCE BU — geri dönüşü olmayan üç karar

| Karar | Şu anki değer | Not |
|---|---|---|
| **Paket kimliği** | `com.kelepiroyunu.kelepir` | İlk yüklemeden sonra **asla değişmez**. Remark'tan bağımsız; `kelepiroyunu.com` alan adını varsayıyor. Başka bir alan adı alacaksan **şimdi** değiştir. |
| **Uygulama adı** | Kelepir | Play'de değiştirilebilir, App Store'da sürümle birlikte değişir. |
| **Yükleme anahtarı** | `android/kelepir-upload.jks` | Kaybedersen Play'e güncelleme gönderemezsin. Sertifika `CN=Kelepir, O=Kelepir` — Remark adı geçmiyor. **Yedekle.** |

> Paket kimliğini değiştireceksen: `capacitor.config.json` içindeki `appId`,
> `android/app/build.gradle` içindeki `namespace` + `applicationId`,
> `android/app/src/main/res/values/strings.xml` içindeki `package_name` ve
> `custom_url_scheme`, `android/app/src/main/java/.../MainActivity.java`
> içindeki `package` satırı ve klasör yolu, Xcode'da
> `PRODUCT_BUNDLE_IDENTIFIER`. Sonra `npx cap sync`.

### Alan adı
Kontrol ettim: **`kelepir.com`, `kelepir.app`, `kelepir.net` ve
`kelepiroyunu.com` dışındaki kısa seçenekler dolu.** Boş görünenler:

| Alan adı | Not |
|---|---|
| **kelepiroyunu.com** | Önerilen. Türkçe okunur, .com güveni, paket kimliği buna göre ayarlandı. |
| kelepir.games | Kısa ve tematik; .com'a göre Türkiye'de daha az tanıdık. |
| kelepir.co / kelepir.io | Kısa ama anlamı yok. |
| oynakelepir.com | Yedek. |

Bunlar sorgu anındaki durumdur, almadan önce kayıt şirketinde tekrar bak.

> **Marka kontrolü:** "kelepir" Türkçe'de sıradan bir kelime, tek başına
> tescili zor. Yine de yayından önce TÜRKPATENT'te oyun/yazılım sınıflarında
> (9 ve 41) bir arama yaptır — maliyeti yok, sonradan ad değiştirmenin
> maliyeti var.

---

## 1 · ANDROID

### Derleme ✅ (hazır — doğrulandı)
- ✅ Hedef API **36** (Play'in 31 Ağustos 2026 zorunluluğu), minimum API 24
- ✅ Dikey kilit, koyu tema, açılışta beyaz kare yok
- ✅ Kenardan kenara (Android 15+ zorunlu) — güvenli alan dolgusu web tarafında
- ✅ Donanım geri tuşu: sayfa → 3B → sekme → çift basışta çıkış
- ✅ Arka plana geçince kayıt, dönünce devam
- ✅ İzinler: `INTERNET`, `VIBRATE` — başka yok (paylaşım ve dosya yazma izin istemiyor)
- ✅ Servis çalışanı kabukta kapalı (güncelleme sonrası eski sürüm sunma hatası)
- ✅ İmzalı `.aab` ve `.apk` üretildi

| Çıktı | Yol |
|---|---|
| Play'e yüklenecek paket | `android/app/build/outputs/bundle/release/app-release.aab` |
| Cihazda test için | `android/app/build/outputs/apk/release/app-release.apk` |

### Yeniden derlemek için
```bash
cd kelepir
npx cap sync
cd android && ./gradlew :app:bundleRelease
```

### Yapılacaklar
- ☐ **APK'yı gerçek bir Android telefona kur ve oyna.** Emülatörde değil —
  özellikle çentikli bir cihazda üst çubuğun oyunu kesmediğini, geri tuşunun
  doğru çalıştığını, titreşimin geldiğini gör.
- ☐ Play Console → yeni uygulama oluştur, Türkçe (tr-TR) varsayılan dil
- ☐ Mağaza sayfası: `magaza-metni.md` içindeki metinleri yapıştır
- ☐ Görseller: `ikon/play-512.png`, `ozellik-grafigi-1024x500.png`,
  `ss-cerceve/play/` içindeki 8 ekran görüntüsü
- ☐ Veri Güvenliği formu: `veri-guvenligi.md`
- ☐ İçerik derecelendirmesi (IARC): `yas-derecelendirme.md`
- ☐ Gizlilik politikası adresi (bkz. bölüm 4)
- ☐ Ücretli uygulama ayarı: **₺49** (bkz. bölüm 3)

### ⚠️ Yeni kişisel hesapta 12 test kuralı
Google, 13 Kasım 2023'ten sonra açılan **kişisel** geliştirici hesaplarından
üretime geçmeden önce şunu istiyor: **en az 12 test kullanıcısı, kesintisiz
14 gün** kapalı testte kalmalı. Opt-out eden tester sayılmıyor, sayaç
sıfırlanıyor.

**Bu kural kuruluş (organization) hesaplarında geçerli değil.** Remark bir
limited şirket olduğuna göre Play Console hesabını **kuruluş hesabı** olarak
aç — D-U-N-S numarası isteniyor ve alması birkaç gün sürüyor, ama karşılığında
14 günlük test zorunluluğunu ve 12 kişi bulma derdini tamamen atlıyorsun.
Kişisel hesapla gidersen takvime **+14 gün** ekle.

---

## 2 · iOS

### Proje hazır ✅
- ✅ Dağıtım hedefi iOS 15 (Apple'ın 9 Eylül 2026 itibarıyla istediği taban iOS 13'ün üstünde)
- ✅ Yalnızca iPhone (`TARGETED_DEVICE_FAMILY = 1`), yalnızca dikey
- ✅ `ITSAppUsesNonExemptEncryption = false` → her yüklemede şifreleme sorusu sorulmuyor
- ✅ Koyu arayüz zorlanmış, açılış ekranı marka zeminli
- ✅ `PrivacyInfo.xcprivacy` eklendi ve Xcode projesine bağlandı (ITMS-91053 uyarısını önler)
- ✅ Uygulama ikonu 1024×1024, **alfa kanalsız** (alfalı ikon reddediliyor)

### Yapılacaklar — bunlar için Mac şart
- ☐ **Xcode 26 veya üstü.** 28 Nisan 2026'dan beri App Store Connect yalnızca
  Xcode 26 / iOS 26 SDK ile derlenmiş paketleri kabul ediyor. Eski Xcode ile
  yüklersen paket reddediliyor.
- ☐ Apple Developer Program üyeliği (yıllık $99). Şirket adına alınacaksa
  D-U-N-S numarası gerekiyor.
- ☐ `cd kelepir && npx cap sync ios && npx cap open ios`
- ☐ Xcode → Signing & Capabilities → Team seç, otomatik imzalama
- ☐ Product → Archive → Distribute App → App Store Connect
- ☐ App Store Connect: `magaza-metni.md` metinleri, `ss-cerceve/ios/` görselleri
- ☐ App Privacy: "Veri toplamıyoruz" (`veri-guvenligi.md`)
- ☐ Yaş derecelendirme anketi — **yeni anket**, 31 Ocak 2026'da değişti
  (`yas-derecelendirme.md`)
- ☐ İncelemeye not: `magaza-metni.md` sonundaki metni yapıştır

> Mac'in yoksa: Mac olmadan App Store'a yükleme yolu yok. Bulut Mac kiralama
> (MacStadium, MacinCloud) veya bir geliştiriciden tek seferlik arşiv alma
> dışında seçenek bulunmuyor.

---

## 3 · FİYAT — ₺49

| Mağaza | Nasıl ayarlanır |
|---|---|
| **Google Play** | Para kazanma → Uygulama fiyatlandırması → Ücretli. Ana para birimini **TRY** seç, ₺49 gir. Diğer ülkeler otomatik dönüştürülsün. |
| **App Store** | Fiyatlandırma ve Kullanılabilirlik → ₺49'a en yakın fiyat noktasını seç (Apple sabit basamaklar kullanıyor, tam ₺49 olmayabilir — ₺49,99 çıkarsa onu al). |

### Ücretli uygulama için ön koşullar
- ☐ **Play:** Satıcı hesabı (merchant account) açılmalı — vergi bilgisi ve banka
  hesabı isteniyor. Ücretsiz yayımlanmış bir uygulama sonradan ücretliye
  **çevrilemez**; ilk yayından önce ücretli olarak ayarla.
- ☐ **App Store:** Anlaşmalar, Vergi ve Bankacılık bölümünde "Ücretli
  Uygulamalar" sözleşmesi imzalanmalı ve banka + vergi bilgisi girilmeli.
  Bu tamamlanmadan ücretli uygulama yayımlanamıyor.

### Neden ₺49
İki doğrudan rakip ₺4,99–₺9,99 bandında ve ikisinde de uygulama içi satın
alma var. ₺49, rakibin ~5 katı değil ~2 katı; farkı "tek ödeme, reklam yok,
IAP yok" ile savunabiliyorsun. Android'de rakip yok, orada fiyat baskısı
da yok.

---

## 4 · GİZLİLİK POLİTİKASI ADRESİ

Play, herkese açık bir gizlilik politikası adresini **zorunlu** tutuyor;
App Store da istiyor.

İki yerde hazır:

1. **Oyunun kendi sitesi** — tanıtım sayfasının `#gizlilik` bölümünde tam metin.
   Alan adını aldıktan sonra kalıcı adres burası olacak.
2. **Ayrı gizlilik sayfası** — yalnız politika, mağaza alanına yapıştırmak için.

**İkisi de şu an gizli.** Mağazaya vermeden önce sayfanın Paylaş menüsünden
"bağlantıya sahip herkes" olarak açman gerekiyor, yoksa Play incelemesi adrese
erişemez ve reddeder.

> Uzun vadede bu sayfayı kendi alan adına taşı (`remark…/kelepir/gizlilik`).
> Mağaza politikaları kalıcı adres bekliyor; şirket alan adı en güvenlisi.

Metinde üç alan boş bırakıldı, yayından önce doldurulacak:

- **Destek e-posta adresi** (Play ayrıca zorunlu tutuyor)
- **Yasal unvan** — mağaza hesabının açılacağı tüzel kişilik
- **Adres**

> Not: marka olarak Remark'tan bağımsız ilerliyoruz ama mağaza hesabı yine
> bir tüzel ya da gerçek kişiye ait olacak ve mağaza sayfasında görünecek.
> Geliştirici **görünen adı** "Kelepir" yapılabiliyor; hesabın arkasındaki
> unvan ayrı bir alan.

---

## 5 · YÜKLEMEDEN ÖNCE SON KONTROL

- ☐ Gizlilik sayfası herkese açık mı? (gizli linki Play reddediyor)
- ☐ Destek e-postası hem sayfada hem Play Console'da dolu mu?
- ☐ Ekran görüntüleri gerçekten oyunun şu anki hâlini mi gösteriyor?
  (Apple "görsel uygulamayı yansıtmıyor" diye reddediyor)
- ☐ APK gerçek cihazda test edildi mi?
- ☐ Yükleme anahtarı ve şifresi güvenli bir yere yedeklendi mi?
- ☐ Paket kimliğinden emin misin? (geri dönüşü yok)

---

## 6 · TAKVİM TAHMİNİ

| Adım | Süre |
|---|---|
| Play kuruluş hesabı + D-U-N-S | 3–7 gün |
| Apple Developer Program onayı | 1–3 gün (şirket ise daha uzun) |
| Satıcı/banka/vergi kurulumu | 1–3 gün |
| Play incelemesi (ilk sürüm) | 1–7 gün |
| App Store incelemesi | 1–3 gün |

Paralel yürütürsen **gerçekçi hedef: 2–3 hafta.** Kişisel Play hesabıyla
gidersen 14 günlük test zorunluluğu yüzünden **+2 hafta**.


---

## 7 · OYUNUN KENDİ SİTESİ

Tanıtım sitesi yazıldı ve yayımlandı: oyunun ne olduğu, döngü, günün vakası,
koşullar (reklam yok / IAP yok / çevrimdışı), ekran görüntüleri ve gizlilik
politikası tek sayfada. Remark'a hiçbir atıf yok.

Yapılacaklar:
- ☐ Alan adını al (öneri: `kelepiroyunu.com`)
- ☐ Sayfayı kendi alan adına taşı — tek HTML dosyası, herhangi bir statik
  barındırmada (Netlify, Cloudflare Pages, GitHub Pages) ücretsiz çalışır
- ☐ `destek@` e-posta kutusunu aç
- ☐ Mağaza bağlantılarını (App Store / Google Play) yayından sonra ekle
- ☐ TikTok biyosuna bu adresi koy — lansman planındaki "ara sayfa yok"
  kuralı, bio → mağaza demek; site mağaza linkini de taşısın
