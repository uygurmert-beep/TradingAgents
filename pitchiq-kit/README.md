# Pitch IQ Kit

Persona masasının kararlarını oyuna taşımak için hazırlanmış, bağımlılığı olmayan modüller. Oyunun kodu
henüz bu repoda olmadığı için kararlar burada **oyuna takılabilir parçalar** olarak uygulandı. Tıklanabilir bir
prototip de var. Oyunun `index.html`'i gelince bu modüller doğrudan içine bağlanacak.

```bash
npm test            # 16 test: arama, Türkçe ekler, Günün Maçı saati, seri, limit, ipucu, rütbe, paylaşım
npm run demo        # demo/dist/pitch-iq-prototip.html (tek dosya, telefonda açılır)
```

## Kararlar → modüller

| # | Karar | Durum | Nerede |
|---|---|---|---|
| 2 | Günün Maçı ana ekranın en büyük kartı: geri sayım, seri, çözülmüş hâli | ✅ | `src/daily.js` (TSİ 00:00, sabit numara, herkese aynı seçim), `demo/app.js › home()` |
| 1 | Önce oyna, sonra kaydol | ✅ | `demo/app.js`: ilk açılış doğrudan bir Kariyer turu; takma ad skordan sonra |
| 4 | Akıllı futbolcu arama | ✅ | `src/text.js`, `src/search.js`: Türkçe karakter, yazım hatası, lakap, en az 3 harf, doğum yılı + mevkiyle ayırt etme |
| 8 | Spoiler'sız paylaşım (metin + 1080×1920 story) | ✅ | `src/share.js`: Web Share, olmazsa kopyalama |
| 19 | Kademeli ipucu | ✅ | `src/hints.js`: uyruk → mevki → baş harf; jeton ve puan cezası önceden görünür, "temiz çözüm" bayrağı |
| 5 | Yanlışta öğreten kart | ✅ | `demo/app.js › resultScreen()` |
| 16 | Rütbe yolculuğu | ✅ | `src/ranks.js` (ara rütbe adları masanın önerisi, oyununkiyle değiştirilebilir) |
| 7 | Mod kartlarında süre + zorluk | ✅ | `demo/app.js › MODES` (süreler tahmini; gerçek oyun verisinden hesaplanmalı) |
| 13 | Görünür günlük sayaç, yumuşak limit | ✅ | `src/limit.js`: 5 oyun, Günün Maçı ve IQ Testi sayılmaz, TSİ gece yarısı sıfırlanır |
| 12 | Büyük yazı, renk körü dostu sonuçlar | ✅ | `rem` tabanlı ölçek + ayar; doğru/yakın/yanlış her zaman ✓ ~ ✕ işaretli; mavi/turuncu paleti |
| 3 · 20 · 6 · 11 | A/B testine kalanlar | 🧪 kısmen | Seri + koruyucu (`updateStreak`) ve yüzdelik (`percentileBetter`, `percentPhrase`) hazır, test bayrağının arkasına konacak. Dönem filtresi ve başparmak düzeni oyun koduyla yapılacak. |
| 9 · 18 | Arkadaş ligi, maç takvimi etkinlikleri | 🗺️ yol haritası | Sunucu gerektiriyor |
| 17 · 14 · 10 · 15 | Sonra / rafa kalkanlar | — | — |

## Oyuna bağlarken

Oyun tek dosyalık bir `index.html` olduğu için modüller iki şekilde eklenebilir:
- `<script type="module">` ile `src/*.js` dosyalarını oyunun yanına kopyalayıp import etmek, ya da
- `demo/build.mjs`'deki gibi modülleri tek bir inline script'e paketlemek.

Bağlantı noktaları:
- **Arama:** `createPlayerIndex(oyunun futbolcu listesi)`. Listede `aliases` alanı yoksa lakap listesi ayrıca
  derlenmeli (ör. `{ id, aliases: ["Hagi", "Comandante"] }`). Bu bir veri işi.
- **Günün Maçı:** `seededIndex(dayKeyTR(), bulmacaSayısı)` her cihazda aynı bulmacayı seçer. `LAUNCH_DAY`'i
  gerçek çıkış tarihine çek.
- **Limit:** her mod başlarken `limit.canPlay(mod)`, oyun bitince `limit.consume(mod)`. Pro durumu `isPro` ile verilir.
- **Paylaşım kartı** Anton ve Barlow Condensed fontlarını kullanır. Fontlar yüklenmeden çizilirse yedek fonta düşer;
  çizmeden önce `await document.fonts.ready` çağır.

## Prototipte bilerek olmayanlar

Diğer 7 mod, IQ testinin kendisi, canlı liderlik ve Pro satın alma gösterim amaçlı. Futbolcu verisi 18 kişilik
örnek bir liste (`src/players.sample.js`). Yüzdelik dağılımı ve IQ 148 örnek değerdir.
