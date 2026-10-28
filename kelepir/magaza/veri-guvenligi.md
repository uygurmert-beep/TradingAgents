# Veri formları — Play "Veri Güvenliği" ve Apple "App Privacy"

Kelepir'in bütün formlarda tek bir cevabı var: **hiçbir veri toplanmıyor.**
Bu bir pazarlama cümlesi değil, mimarinin sonucu — oyunda sunucu çağrısı,
analitik SDK'sı, reklam SDK'sı ve çökme raporlayıcı yok. `magaza-test.js`
her derlemede kabuğun sıfır dış ağ isteği yaptığını doğruluyor.

> Dikkat: bu formları yanlış doldurmak, geç doldurmaktan çok daha pahalı.
> İkisi de beyan; sonradan SDK eklersen formu güncellemek **zorundasın**.

---

## GOOGLE PLAY — Veri Güvenliği formu

| Soru | Cevap |
|---|---|
| Uygulamanız kullanıcı verisi topluyor veya paylaşıyor mu? | **Hayır** |
| Veriler aktarım sırasında şifreleniyor mu? | Soru açılmıyor (veri toplanmıyor) |
| Kullanıcılar verilerinin silinmesini isteyebilir mi? | Soru açılmıyor |
| Uygulamanız Ailelere Uygun Programı'na katılıyor mu? | Hayır |
| Bağımsız güvenlik denetimi | Hayır |

**Gerekçe metni (form açıklama alanına):**
> Oyun tamamen çevrimdışı çalışır. Hesap, giriş, sunucu ve ağ bağlantısı
> yoktur. İlerleme yalnızca cihazda saklanır ve cihazdan çıkmaz.

### Play "Reklamlar" beyanı
| Soru | Cevap |
|---|---|
| Uygulamanızda reklam var mı? | **Hayır** |

### Play "Devlet uygulaması" / "Finans" soruları
İkisi de **Hayır**. Oyun içindeki paralar kurgudur, gerçek para hareketi yok.

---

## APPLE — App Privacy (Gizlilik Besin Etiketi)

App Store Connect → Uygulama Gizliliği:

| Adım | Cevap |
|---|---|
| Bu uygulamadan veri topluyor musunuz? | **Hayır, bu uygulamadan veri toplamıyoruz** |

Bu cevap seçildiğinde başka soru açılmıyor; mağaza sayfasında
**"Veri Toplanmıyor"** rozeti çıkıyor — Kelepir'in en güçlü ikinci
satış argümanı (birincisi fiyat).

### Gizlilik Bildirimi dosyası (PrivacyInfo.xcprivacy)
Projede hazır: `ios/App/App/PrivacyInfo.xcprivacy`.

| Alan | Değer |
|---|---|
| `NSPrivacyTracking` | `false` |
| `NSPrivacyTrackingDomains` | boş |
| `NSPrivacyCollectedDataTypes` | boş |
| `NSPrivacyAccessedAPITypes` | UserDefaults (`CA92.1`), DosyaZamanDamgası (`C617.1`), DiskAlanı (`E174.1`) |

Bu üç API, Capacitor'ün ve WKWebView'in kendi kullanımı. Beyan edilmezse
yükleme sırasında **ITMS-91053** uyarısı geliyor.

### İzleme izni (ATT)
Gerekmiyor — `NSUserTrackingUsageDescription` **eklenmemeli**. İzleme
yapmayan bir uygulamada bu anahtarın bulunması tek başına ret sebebi
olabiliyor.

---

## İZİNLER (Android)

Derlenen pakette (`com.kelepiroyunu.kelepir`) yalnızca üç izin var:

| İzin | Nereden | Neden |
|---|---|---|
| `INTERNET` | Capacitor çekirdeği | WebView yerel şemayı (`https://localhost`) bu izinle açıyor. Dışarı çağrı yapılmıyor. |
| `VIBRATE` | `@capacitor/haptics` | Pazarlıkta ve satışta haptik geri bildirim. |
| `…DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` | AndroidX | Sistem tarafından otomatik ekleniyor, kullanıcıya görünmüyor. |

Konum, kişiler, kamera, mikrofon, depolama, reklam kimliği **yok**.

> İsteğe bağlı sertleştirme: `INTERNET` iznini manifest'ten çıkarmak teknik
> olarak mümkün (oyun hiç ağ kullanmıyor) ve mağaza sayfasında "internet
> izni bile istemiyor" demene izin verir. Ama Capacitor'ün desteklediği
> yapılandırma değil — **çıkarmadan önce gerçek cihazda test et.**
> Satır: `android/app/src/main/AndroidManifest.xml` içindeki
> `<uses-permission android:name="android.permission.INTERNET" />`.

---

## PAYLAŞIM VE DOSYA ERİŞİMİ

"Kartı paylaş" özelliği `@capacitor/share` ve `@capacitor/filesystem`
kullanıyor. İkisi de **izin istemiyor**:

- Kart, uygulamanın kendi önbellek klasörüne yazılıyor (`Directory.Cache`) —
  paylaşılan depolamaya değil, bu yüzden `WRITE_EXTERNAL_STORAGE` gerekmiyor.
- Paylaşım, sistemin kendi paylaşım sayfasını açıyor; nereye gittiğini
  kullanıcı seçiyor, uygulama sonucu görmüyor.
- Kartın içinde yalnızca o günkü kurgusal aracın künyesi ve oyuncunun puanı
  var. Kişisel bilgi yok.

Bu özellik Play Veri Güvenliği ve Apple App Privacy cevaplarını değiştirmiyor:
**hâlâ hiçbir veri toplanmıyor.** Paylaşılan dosyayı kullanıcı kendi
iradesiyle gönderiyor, uygulama hiçbir yere iletmiyor.
