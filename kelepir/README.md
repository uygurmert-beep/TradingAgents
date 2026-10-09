# Kelepir

İkinci el araç galerisi simülasyonu. Çevrimdışı, reklamsız, tek fiyat.

## Hızlı başlangıç

```bash
cd oyun
python3 build.py          # → preloved.html  (tarayıcıda aç)
python3 appbuild.py       # → app/www/       (Capacitor kabuğu)
node test/ux-test.js      # 78 kontrol
```

Gereken: Python 3, Node 18+, Playwright (Chromium `/opt/pw-browsers/chromium`).
Android sürümü için ek olarak JDK 17+ ve Android SDK 36.

## Nereden okumaya başlamalı

| Dosya | Ne anlatıyor |
|---|---|
| `CLAUDE.md` | mimari, komutlar, değiştirilemez kurallar, bilinen tuzaklar |
| `BRIEF.md` | bulunulan nokta, birikmiş iş listesi, bilinçli kararlar |
| `oyun/game.js` | kural motoru — değerleme, arızalar, alıcı/satıcı davranışı |
| `oyun/ui.js` | bütün ekranlar ve olay yönlendirme |
| `oyun/aracciz.js` | 150 modelin kodla üretilen çizimi |

## Dizin

```
oyun/        kaynak, derleyiciler, üreticiler
oyun/test/   testler ve denge simülasyonu
kabuk/       Capacitor projesi (android + ios)
magaza/      mağaza metinleri, ikonlar, ekran görüntüleri, gizlilik politikası
site.html    tanıtım sayfası
```

## Uyarı

`kabuk/android/kelepir-upload.jks` Play yükleme anahtarıdır. Kaybolursa bu
uygulama bir daha güncellenemez. Paketi herkese açık bir yere koyma.
