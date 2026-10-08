# KELEPİR — proje hafızası

Türkiye ikinci el araç piyasasında geçen bir galeri simülasyonu. Çevrimdışı,
reklamsız, uygulama içi satın alma yok. Tek fiyat: ₺49.

Bu dosya Claude Code'un her oturumda okuduğu proje hafızasıdır. Buradaki
kurallar tercih değil, **yapının taşıyıcısı** — ihlal edilirse derleme veya
testler kırılır.

---

## 1. Ne olduğu

| | |
|---|---|
| Hedef | Android (Play) + iOS (App Store), Türkiye öncelikli |
| Paket adı | `com.kelepiroyunu.kelepir` |
| Teknoloji | Saf JavaScript + HTML/CSS. Çatı yok, derleyici yok, bağımlılık yok. |
| 3B | three.js r149, **yerel dosya** (CDN yok) |
| Kabuk | Capacitor 8.5.2 (android + ios) |
| Dil | Arayüz Türkçe. İngilizce sözlük hazır ama `TEK_DIL="tr"` ile kilitli. |
| Kayıt | `localStorage`, `SURUM` numarasıyla göç (migration) |

Oyun döngüsü: **pazardan araç al → ekspertiz ettir → kârlı tamiri yaptır →
ilanı kur → alıcıyla pazarlık et → sat.** Yan katmanlar: sezonlar, günlük
görevler, tanıdıklar, rakip galericiler, lig, koleksiyon, 3B vitrin (gözle ekspertiz),
günün vakası, galeri kirası ve büyütme, konsinye (emanet araç), toptan parti,
dönen müşteri, sanayi günü ve sezon hedefi.

---

## 2. Mimari — en önemli kural

**Kaynak dosyalar ayrı, çıktı TEK dosya.** `build.py` bütün modülleri
birleştirip `shell.html` içindeki `/*BUNDLE*/` işaretinin yerine koyuyor.

```
hata.js → aracciz.js → kayit.js → i18n.js → ses.js → game.js → world.js
→ rehber.js → gunlukritim.js → koleksiyon.js → galeri.js → konsinye.js
→ yangorev.js → kolay.js → foto.js → sirala.js → cila.js → yuz.js → kisisel.js → karne.js → meydan.js
→ paylas.js → demo.js → ui.js → app.js
```

Bu sıra `build.py` ve `appbuild.py` içindeki `MODULLER` demetinde duruyor.
**Yeni modül eklerken iki dosyaya da eklemek gerekiyor.**

### Buradan çıkan ve asla unutulmaması gereken şey

Modüller **tek bir kapsamda** birleşiyor. Yani iki dosyada aynı üst düzey ad
varsa, sonradan yüklenen sessizce diğerini eziyor. Bu bir kez başımıza geldi:
`aracciz.js` içindeki `_ton` renk yardımcısı, `ses.js` içindeki `_ton` ses
fonksiyonuyla çakıştı; araç çizimi `AudioParam` hatası verip sessizce eski gri
silüete düştü. Hata hiçbir yerde görünmedi.

Bu yüzden her iki derleme betiğinde `cakismaKontrol()` var: aynı üst düzey adı
iki dosya tanımlıyorsa **derleme durur**. Bu kontrolü kaldırma.

Modüle özel yardımcıların adını önekle: `aracciz.js` içindekiler `_ac` ile
başlıyor (`_acRenk`, `_acTohum`, `AC_ISKELET`).

---

## 3. Komutlar

```bash
# derleme — her değişiklikten sonra
python3 build.py        # → preloved.html   (tarayıcı / artifact sürümü)
python3 appbuild.py     # → app/www/        (Capacitor kabuğu, tam HTML belge)
python3 webbuild.py     # → ../kelepir-web/ (Netlify) + ../kelepir-tek.html

# model tablosu (isimler, imza arızaları, km eşikleri)
python3 modeller-b.py   # → _modeller_b.js VE game.js içindeki MODELS tablosu

# testler — hepsi Playwright + Chromium, headless
node test/test.js          # ana akış dumanı
node test/yeni-test.js     # kural motoru (116 kontrol)
node test/ux-test.js       # arayüz, yeni sistemler, 3B profil, kolay oynanış, marka şeridi (112 kontrol)
node test/magaza-test.js   # mağaza/kabuk uyumu (26 kontrol)
node test/tut.js           # rehber (onboarding)
node test/gunluk.js        # günlük görevler
node test/kayittest.js     # kayıt / dışa aktarma / içe alma
node test/uzun.js          # uzun oyun, prestij
node test/goc-test.js      # eski kayıttan göç
node test/vitrin-test.js   # 3B vitrin + gözle ekspertiz (26 kontrol, ~1 dk)

node test/denge.js         # 121 günlük denge simülasyonu (sayı basar, assert yok)

# mağaza görselleri
node ss-magaza.js          # Play 1080×1920 + iOS 1290×2796 ekran görüntüleri
node ozellik-araclar.js    # özellik grafiği için araç çizimleri
python3 magaza-gorsel.py   # özellik grafiği + başlıklı çerçeveler

# Android sürüm
cd ../kabuk && npx cap sync
cd android && ./gradlew bundleRelease assembleRelease
```

Playwright Chromium yolu: `/opt/pw-browsers/chromium`.
`playwright install` ÇALIŞTIRMA — tarayıcı hazır kurulu.

---

## 4. Değiştirilemez kurallar

1. **Dış kaynak yok.** CDN, web fontu, analitik, uzak görsel — hiçbiri.
   Yazı tipi Space Grotesk (OFL) `oyun/font/` altında; `yazitipi.py` onu iki
   derleyicide de base64 olarak `/*FONT*/` yerine gömüyor. Tek aile bütün
   arayüzü taşıyor (`--sf`); `--imza-font` eski kurallar için takma ad.
   `appbuild.py` içinde `assert 'cdnjs' not in govde` var; ihlal derlemeyi
   durdurur. Oyun ilk açılıştan itibaren tamamen çevrimdışı çalışıyor.
2. **Reklam ve uygulama içi satın alma yok.** Mağaza metni bunu vaat ediyor.
3. **Gerçek marka adı yok.** Model adları "ailesi belli, kopyası değil"
   seviyesinde (B seviyesi): *Volkheim Golfo, Fiyat Egeo, Tanaro Korola*.
   Motor kısaltmaları (TDI, dCi, HDi) bilerek kullanılmadı — onlar tescilli.
   Hacim + yakıt (`1.6 Dizel`) kimsenin tekelinde değil.
4. **Kayıt uyumu.** `S` durumuna yeni alan eklerken eski kayıtlar bozulmamalı.
   Okurken `S.x || varsayilan` kullan. Şekil gerçekten değiştiyse `SURUM`
   artır ve `kayit.js` içine göç kodu yaz; `test/goc-test.js` bunu denetliyor.
   Geçici arayüz durumunu `S`'ye KOYMA (kayda yazılır) — modül düzeyinde
   değişken kullan. Örnek: `SON_TAMIR`.
5. **Renk.** Palet "Showroom" (açık): taş zemin, beyaz kart, **yarış yeşili
   (`--tint`) yalnızca eylem ve seçim**, koyu altın (`--gold`) yalnızca para,
   yeşil/kırmızı yalnızca sonuç. Sabit renk yazma; `--surface-tepe`, `--fill`
   gibi değişken kullan. Koyu temadan kalma `rgba(255,255,255,…)` dolgular açık
   zeminde görünmez, `rgba(0,0,0,…)` zeminler kirli gri yapar. 3B saha (`#world`)
   koyu bir sahne: orada `--label`, `--gold` vb. kendi parlak değerlerini alıyor,
   saha üstü katmana yeni öğe eklersen bu kapsamın içine koy.
6. **Dil.** Kod, değişken adları, yorumlar ve arayüz Türkçe. Yeni kullanıcıya
   görünen metin eklersen `en.js` sözlüğüne de karşılığını ekle.
7. **Türkçe büyük harf:** `toLocaleUpperCase("tr")` — aksi hâlde "i" → "I".

---

## 5. Yorum yazma biçimi

Yorumlar **ne yaptığını değil, neden öyle olduğunu** anlatıyor. Özellikle bir
hata düzeltildiğinde, hatanın kendisi yorumda duruyor ki bir sonraki kişi aynı
şeyi geri getirmesin. Bu dosyanın her yerinde örneği var:

```js
/* Pahalı arıza seyrek kalsın diye eskiden ikinci bir kör çekiliş vardı;
   o kör çekiliş ağırlığı yok ediyordu. Artık frenin kendisi bir ağırlık
   çarpanı: imza arıza bundan muaf, araç kendi karakterini gösteriyor. */
```

Bu biçimi sürdür. "TODO" bırakma — ya yap ya da `BRIEF.md` içindeki birikmiş
iş listesine yaz.

---

## 6. Modül haritası

| Dosya | Satır | Sorumluluk |
|---|---:|---|
| `hata.js` | 51 | genel hata yakalayıcı, beyaz ekranı önler |
| `aracciz.js` | 442 | **araç çizimi** — 150 model için kodla üretilen SVG |
| `kayit.js` | 142 | localStorage, göç, dışa/içe aktarma, servis çalışanı |
| `i18n.js` | 216 | dil katmanı (tek dil kilidi burada) |
| `ses.js` | 354 | WebAudio ses ve müzik |
| `game.js` | 910 | **kural motoru** — model tablosu, değerleme, arızalar, alıcı/satıcı |
| `world.js` | 3407 | 3B vitrin (three.js) — gövde profili `profil3B()` 2B kimlikten |
| `rehber.js` | 99 | ilk oyun rehberi |
| `gunlukritim.js` | 95 | günlük görevler ve seri |
| `koleksiyon.js` | 170 | koleksiyon, lig tablosu, rakip vitrini, prestij |
| `galeri.js` | 127 | **galerinin yeri** — kaçan kelepir, yandaki dükkân, sezon hedefi kutusu |
| `konsinye.js` | 178 | **emanet araç** — sahibi net ister, üstü senin, yer kaplar (filonun yerine) |
| `yangorev.js` | 212 | toptan parti, dönen müşteri, sanayi günü, sezon hedefi |
| `kolay.js` | 102 | Hazırla (tek dokunuşla satışa), sıradaki adım rozeti, önerilen teklif |
| `foto.js` | 105 | listede/sayfada 3B stüdyo fotoğrafı (ayrı çizici, boşta kuyruk, 2B yedek) |
| `sirala.js` | 74 | Türkiye sıralaması (60 sanal galeri) |
| `cila.js` | 125 | mikro animasyon, haptik, onay kutusu |
| `yuz.js` | 129 | satıcı/alıcı/tanıdık/emanet sahibi yüz çizimi (ruh hâline göre) |
| `kisisel.js` | 101 | galeri tabelası ve rengi |
| `karne.js` | 173 | sezon karnesi |
| `meydan.js` | 176 | günün vakası (günlük bilmece) |
| `paylas.js` | 377 | 1080×1920 paylaşım kartları (canvas) |
| `demo.js` | 213 | otomatik tanıtım turu |
| `ui.js` | 4012 | **bütün ekranlar ve olay yönlendirme** (BUGÜN rayı, gözle ekspertiz kuralları) |
| `app.js` | 171 | Capacitor köprüsü, güvenli alan, geri tuşu |
| `shell.html` | 1786 | bütün CSS + belge iskeleti |

`ui.js` ve `game.js` büyük. Bölmeye kalkışmadan önce 2. bölümdeki ad çakışması
tuzağını hatırla — bölmek mimari kazanç sağlamıyor, risk ekliyor.

---

## 7. Araç çizimi (`aracciz.js`) — dokunmadan önce oku

150 model, 150 ayrı araba, elle çizilmeden. Her model kendi adından türeyen
sabit bir tohumla **hep aynı** arabayı üretiyor.

Gövde serbest eğrilerle değil, **gerçek ölçülerle** kuruluyor:

```
dingil mesafesi + ön taşma + arka taşma = toplam boy
teker yarıçapı → eşik yüksekliği → kuşak hattı → tavan
```

`AC_ISKELET` içindeki bütün oranlar gerçek araç ölçülerinden türetildi ve
aracın BOYUNA oranlı. Üstüne **dönem** biniyor: 1975 modeli ile 2023 modeli
aynı oranlarda olamaz (taşma, kuşak, teker, direk kalınlığı, krom, far ailesi).

Kuyruk tipleri: `bagaj` (sedan/lüks/klasik) · `hatch` · `dik` (SUV) ·
`van` (panelvan, tavan arka tampona kadar düz).

Değişiklik yaptıysan **150'sini birden render edip gözle bak.** Daha önce
yakalanan ve tekrarlanmaması gereken kusurlar:

- gövde tekere göre kısa (iskeletler gerçek metreden yeniden kuruldu)
- tampon/parlama/far siluetin dışına taşıyor (gövde `clipPath` ile kırpıldı)
- kaput ~3 kat uzun (segment başına gerçek kaput boyundan hesaplandı)
- 2020 modelde yuvarlak far (modern aileden çıkarıldı)
- kuyrukta yukarı çıkıntı (`bagajBas` tavan sonunun önüne kelepçelendi)
- SUV kaplaması gövdenin altında kalıyor (üstüne alındı)
- sedan kabini öne kaçmış kamyonet gibi (tavan sonu %50 → %66)
- stop lambası kuyruğun tepe köşesinde ince çizgi (arka yüzeye oturtuldu)

### 3B araç (`world.js`)

3B gövde ölçüleri ve marka imzası **2B ile aynı kaynaktan** geliyor:
`profil3B(m)` ve `imza3B(m)` `aracKimlik()`'ten türetiyor. Burada eskiden
model adıyla anahtarlı elle yazılmış iki tablo vardı; isimler B seviyesine
geçince hiçbiri eşleşmedi ve 150 model 6 varsayılan gövdeye düştü. **Model
adıyla anahtarlı yeni bir 3B tablosu yazma.** `ux-test.js` 11. bölüm her
modelin kendi profilini aldığını ölçüyor.

3B'de tekrarlanmaması gereken kusurlar:

- çamurlukta siyah "pençe izi": far paneli burnun 56 cm gerisine taşıp
  çamurluğa yapışıyordu → `onPanel/arkaPanel` noktaları `PANEL_DERIN` (12 cm)
- kapı altında kahverengi/siyah bant: kabin tabanı ve iç etek `s.W`/`HW`'ye
  göre konuyordu → iç parçalar `xAt()` ile gövdenin o yükseklikteki genişliği
- far düz siyah levha, hasar dokuları görünmez: `yuzey()` uv üretmiyordu
- krom yeşil: sahne ortamındaki çim yansıyordu → `kromOrtamTex()` nötr stüdyo
- teker kemeri kesiti sıkıştırıyordu → kesit hep eşikten, kemer yalnız alt
  noktaları düzleştiriyor (`kemerHat`)
- ayna havada, silecek camın dışında: `HW` yerine `xAt()` / `hwCam`

Değişiklikten sonra 150 modeli çiz ve bak (oyun açıkken `W3D_buildCar`).

---

## 8. Doğrulama beklentisi

Her değişiklikten sonra:

1. `python3 build.py && python3 appbuild.py`
2. İlgili testler. Yeni bir sistem eklediysen **testini de yaz** —
   `test/ux-test.js` bölüm bölüm ilerliyor, sonuna ekle.
3. Ekran değiştiyse **ekran görüntüsü al ve bak.** Test "hata yok" diyebilir
   ama hizalama bozuk olabilir. Bu projede birkaç kusur sadece göze bakarak
   yakalandı.
4. Denge etkileyen değişiklikte `node test/denge.js`.

Testler kırmızıyken iş bitmiş sayılmaz.

---

## 9. Bilinen tuzaklar

- **Playwright'ın `click()`'i** düğmeyi görünür kılmak için sayfayı kendisi
  kaydırıyor. Kaydırma konumu ölçen testlerde `evaluate(()=>el.click())` kullan.
- **Android 15+ kenardan kenara zorunlu.** `env(safe-area-inset-*)` orada 0
  döndürüyor; Capacitor çekirdeği `--safe-area-inset-*` değişkenlerini
  enjekte ediyor. Zincir `shell.html` içinde kurulu, bozma.
- **Servis çalışanı mağaza kabuğunda KAYITLI DEĞİL.** Capacitor Android
  `https://localhost` kullandığı için kayıt açılırsa güncellemeden sonra eski
  `index.html` sunulur. `kayit.js` içinde `kabuk()` kontrolü bunu engelliyor.
- **`backdrop-filter`** desteklenmeyen ortamda yarı saydam katmanların altı
  okunuyor. Üst kokpit/sekme şeridi opaklığı bu yüzden yüksek (.955/.96).
- **3B vitrin testleri ekran koordinatına güvenmesin.** Yandan bakınca komşu
  araçlar görüş hattına giriyor; dokunuş onlara düşerse odak doğru biçimde
  oraya geçer. Test önce `W3D.isabet(x,y)` ile ışını yan etkisiz sorar, sonra
  aynı karede `W3D.dokun(x,y)` der (`vitrin-test.js`).
- **Üst marka şeridi (`#ustmarka`) kokpitin üstünde, akışın içinde.** Yapışkan
  değil: aşağı kaydırınca kendiliğinden çıkıyor. JS ile gizle/göster yapma —
  kokpit boyu değişince içerik zıplıyor. Güvenli alan şeridin üstünde, eksi
  alt pay kokpitin dolgusuyla örtüşüyor.
- **3B fotoğraf kuyruğu boşta çalışıyor.** `foto.js` oyuncu yazarken/kaydırırken
  çekim yapmıyor (`requestIdleCallback`). Testte ya da mağaza görüntüsünde
  fotoğraf bekleniyorsa `.fotobekle` kalmayana dek yokla, sabit süre bekleme.
- **Sayfa içi eylem çubuğu** (`.sheet>.actionbar`) `bottom:-24px` ile duruyor.
  Chromium yapışkan konumu kaydırıcının içerik kutusuna göre hesaplıyor; 0
  olunca çubuk sayfanın alt dolgusu kadar yukarıda kalıyor ve altından içerik
  görünüyordu. `ux-test.js` 9. bölüm bunu ölçüyor.
- **Kayıtta araç taşıyan her alan** `serialize`/`deserialize` içinde model
  indeksine çevrilmeli. `S.konsTeklif.car` ve `S.parti.cars` bu yüzden orada;
  yeni bir "araç tutan teklif" eklersen oraya da ekle, yoksa model nesnesi
  JSON'a kopyalanır ve `MODELS.includes` sessizce yanlış döner.
- **`openSheet` kaydırmayı koruyor.** Aynı sayfa yeniden çizilirse (tamir,
  pazarlık hamlesi) konum korunuyor; anahtar başlık + alt başlık. Yeni bir
  sayfa yazarken bu ikisini anlamlı doldur.

---

## 10. Dosya konumları

```
oyun/            kaynak + derleyiciler + üreticiler
oyun/test/       bütün testler ve denge simülasyonu
oyun/font/       Space Grotesk woff2 + OFL lisansı (derlemede gömülür)
kabuk/           Capacitor projesi (android + ios)
kabuk/android/   kelepir-upload.jks + keystore.properties  ← GİZLİ, kaybetme
magaza/          mağaza metinleri, ikonlar, ekran görüntüleri, gizlilik
site.html        tanıtım sayfası
BRIEF.md         bulunulan nokta ve birikmiş iş listesi
```

**Yükleme anahtarı (`kelepir-upload.jks`) kaybolursa Play'de bu uygulamayı bir
daha güncelleyemezsin.** Paketi gizli tut, anahtarı ayrıca yedekle.
