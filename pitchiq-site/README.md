# Pitch IQ — Web sitesi

Pitch IQ'nun tanıtım + destek sitesi. Bağımlılığı olmayan statik bir site üreticisi (Node 18+) kullanır.

| Sayfa | URL |
|---|---|
| Ana sayfa (landing) | `/` |
| Gizlilik Politikası (TR + EN) | `/privacy/` (`/gizlilik`, `/privacy.html` buraya yönlenir) |
| Destek & İletişim | `/support/` (`/iletisim`, `/destek` buraya yönlenir) |
| Tarayıcıda oyna | `/play/` (`/app` buraya yönlenir) |
| Android TWA doğrulaması | `/.well-known/assetlinks.json` |

Mağaza formlarında kullanılacak URL'ler: **`https://<alan-adı>/privacy/`** ve **`https://<alan-adı>/support/`**.

## Build / önizleme

```bash
node build.mjs                    # dist/ klasörünü üretir
python3 -m http.server -d dist    # http://localhost:8000
```

## Netlify'a deploy

1. Netlify › *Add new site* › *Import from Git* ile bu repoyu seç.
2. **Base directory: `pitchiq-site`** (repo kökünde başka proje var). Build komutu ve yayın klasörü `netlify.toml`'dan okunur (`node build.mjs` → `dist`).
3. *Domain management* bölümünden özel alan adını (ör. `pitchiq.app`) bağla; HTTPS otomatik açılır.
4. Alan adı kesinleşince `src/config.json` içindeki `siteUrl`'i güncelle (canonical, OG, sitemap ve JSON-LD bunu kullanır).

## Metinleri düzenleme

- **Tüm site metinleri:** `src/i18n/tr.json` — başlıklar, mod açıklamaları, SSS, fiyat kartları… (`MAGAZA-METINLERI.md`'deki mod açıklamaları buraya kopyalanabilir.)
- **Ayarlar:** `src/config.json` — mağaza linkleri, e-posta, fiyatlar, alan adı, analytics, gizlilik yürürlük tarihi.
- **Gizlilik metni:** `src/content/privacy-tr.html` ve `privacy-en.html`. Mağaza paketindeki `privacy.html`'in TR/EN bölümlerini (yalnızca `<body>` içeriğini) buraya yapıştır. `{{email}}` otomatik olarak iletişim e-postasıyla değiştirilir.

### İngilizce eklemek
`src/i18n/tr.json`'u `en.json` olarak kopyalayıp çevir, `config.json`'da `"locales": ["tr", "en"]` yap. Site `/en/...` altında üretilir, sitemap ve `hreflang` etiketleri otomatik eklenir.

## Marka ve logo

Logo: **Yön A · Orta Saha**. "IQ"daki Q sahanın orta yuvarlağı, altın nokta başlama noktası.
Kaynak dosyalar `brand/` klasöründe (SVG), mağaza dosyaları `brand/export/` içinde:

| Dosya | Nereye |
|---|---|
| `play-store-icon-512.png` | Google Play › Uygulama simgesi (512×512, köşeleri Google yuvarlatır) |
| `play-feature-graphic-1024x500.png` | Google Play › Öne çıkan grafik |
| `app-store-icon-1024.png` | App Store Connect (şeffaflık yok) |
| `android-adaptive-foreground/background/monochrome-432.png` | Android Studio / Bubblewrap uyarlanabilir ikon katmanları |
| `pwa-icon-192/512.png`, `pwa-maskable-192/512.png` | Oyunun PWA `manifest.json`'ı (PWABuilder bunları ister) |
| `logo-horizontal-dark/light.png` | Basın, sosyal medya, sunum |

SVG'leri değiştirirsen PNG'leri yeniden üret: `node tools/render-brand.cjs` (Playwright + Chromium ve
Anton / Barlow Condensed fontlarının yerelde kurulu olması gerekir). Bu komut sitenin
`static/assets/icons/` dosyalarını da günceller.

Ekran görüntüleri hâlâ **yer tutucu**: `static/assets/screenshots/01-home.webp` … `05-iq-test.webp`
dosyalarını paketteki gerçek görsellerle değiştir.

Ekran görüntülerini WebP'ye çevirip doğru adlarla kaydetmek için:

```bash
pip install pillow
python3 tools/optimize-images.py ~/Downloads/pitchiq-paket/screenshots
```

(Dosyalar baştaki numaraya göre eşlenir: `01…` → `01-home.webp` vb.)

**Google Play rozeti:** Resmi Türkçe rozeti Google'ın marka kitinden (https://play.google.com/intl/tr/badges/) indirip `static/assets/badges/google-play-tr.png` olarak kaydet. Dosya varsa büyük indirme butonları otomatik olarak resmi rozeti kullanır; yoksa marka renklerinde bir buton gösterilir.

Gerçek kulüp logosu / marka görseli **eklemeyin** (lisans riski); yalnızca oyun ekran görüntüleri kullanılır.

## assetlinks.json (Android TWA)

1. PWABuilder'ın ürettiği `assetlinks.json` içeriğini `static/.well-known/assetlinks.json` dosyasına yapıştır (şu an placeholder olarak `[]`).
2. Play Console › *Uygulama bütünlüğü* › *Uygulama imzalama* sayfasındaki **SHA-256** parmak izinin dosyada olduğundan emin ol (Play App Signing kullanılıyorsa Google'ın anahtarı).
3. Deploy sonrası doğrula:
   ```bash
   curl -sI https://<alan-adı>/.well-known/assetlinks.json   # Content-Type: application/json
   ```
   ve https://developers.google.com/digital-asset-links/tools/generator ile kontrol et.

`netlify.toml` bu yolu `Content-Type: application/json` ile servis eder.

## /play — oynanabilir web sürümü

Oyunun tek dosyalık `index.html`'ini `static/play/index.html` olarak koy (ek dosyaları — manifest, service worker, ikonlar — yanına). Build sırasında yer tutucu sayfanın yerine geçer. TWA bu adresi açacaksa PWA manifest'indeki `start_url` / `scope` değerlerini `/play/` olarak ayarla.

## Mağaza linkleri

`src/config.json` › `links.googlePlay` (şimdilik `com.pitchiq.app` placeholder'ı). App Store yayınlanınca `links.appStore`'u doldur.

## Analytics (isteğe bağlı)

Çerezsiz Plausible desteklenir: `config.json` › `analytics.plausibleDomain` alanına alan adını yaz. Boşsa hiçbir analytics betiği yüklenmez. İndirme butonları `Download+Hero`, `Download+Final` vb. olaylarla ölçülür; çerez bannerı gerekmez.

## Kontrol listesi

- Lighthouse (mobil, yerel ölçüm): Performans / Erişilebilirlik / En iyi uygulamalar / SEO = 100
- 360px'te yatay kaydırma yok; açık ve koyu tema (sistem tercihi + manuel geçiş).
