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
dönen müşteri, sanayi günü ve sezon hedefi, takas (ekspertiz + değer kırma),
parça kalitesi, ilan fotoğrafı, piyasa nabzı, galericiler grubu, canlı açık artırma,
kapora, hakem heyeti (ayıplı mal şikâyeti), rakip kişilikleri, haftalık oto pazarı.

---

## 2. Mimari — en önemli kural

**Kaynak dosyalar ayrı, çıktı TEK dosya.** `build.py` bütün modülleri
birleştirip `shell.html` içindeki `/*BUNDLE*/` işaretinin yerine koyuyor.

```
hata.js → olcum.js → aracciz.js → kayit.js → i18n.js → ses.js → game.js → kanca.js → world.js
→ rehber.js → gunlukritim.js → koleksiyon.js → galeri.js → konsinye.js → kapora.js → sikayet.js
→ yangorev.js → kolay.js → foto.js → parca.js → takas.js → ilanfoto.js → piyasa.js
→ grup.js → canli.js → rakip.js → sirala.js → cila.js → yuz.js → kisisel.js → karne.js → meydan.js
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

### Yeni yan sistem: `kanca.js` üzerinden bağla

Gün geçişi, BUGÜN rayı ve düğme yönlendirmesi için `ui.js`'e satır ekleme.
Modül kendini kaydeder: `KANCA.gun.push(rep=>…)`, `KANCA.ray.push(()=>[kart…])`,
`KANCA.eylem.ad=(b,car)=>…`, ray simgesi `KANCA.ikon.ad`. `KANCA.gun` `S.day++`'tan
sonra çalışır: işlenen gece `S.day-1`. Kancalar korumalı
çağrılır; biri hata verirse gün durmaz. `ux-test.js` 13. bölüm (ölü düğme)
`KANCA.eylem.x=` kayıtlarını da karşılık sayıyor.

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
node test/ux-test.js       # arayüz, yeni sistemler, 3B profil, kolay oynanış, marka şeridi, foto, 6 yan sistem (139 kontrol; UX_TOHUM ile pazar değişir)
node test/magaza-test.js   # mağaza/kabuk uyumu (26 kontrol)
node test/tut.js           # rehber (7 adım, vurguyu izleyen oyuncu ≤15 dokunuşta ilk satış)
node test/gunluk.js        # günlük görevler
node test/kayittest.js     # kayıt / dışa aktarma / içe alma
node test/uzun.js          # uzun oyun, prestij
node test/goc-test.js      # eski kayıttan göç
node test/vitrin-test.js   # 3B vitrin + gözle ekspertiz + teker kemeri + tek araçta oklar (30 kontrol, birkaç dk)
node test/v13-test.js      # 1.3: satış anı, kayıt yedeği, ses grupları, ölçüm, nadir kelepir (29 kontrol)
node test/v14-test.js      # 1.4: Türk plakası, kaporta şeması, kapora, hakem heyeti, rakip kişilikleri, galeri kademesi, oto pazarı, SATILIK kâğıdı, tarama (31 kontrol)
node test/v3-test.js       # v3 kararları + 1.1 + 1.2: araç karakteri, taksit, pazarlık/satış/müzayede, yeni ekranlar, kademeli açılış, usta notu, duvar takvimi, gün notları (62 kontrol)

node test/denge.js         # 121 günlük denge simülasyonu (sayı basar, assert yok)

# mağaza görselleri
node ss-magaza.js          # Play 1080×1920 + iOS 1290×2796 ekran görüntüleri
node ozellik-araclar.js    # özellik grafiği için araç çizimleri
python3 magaza-gorsel.py   # özellik grafiği + başlıklı çerçeveler (yazı tipi oyun/font'tan, fontTools + cairosvg ister)

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
| `olcum.js` | 150 | kare süresi örnekleyici, Ayarlar → Cihaz testi (liste, sayfa, 3B) |
| `aracciz.js` | 442 | **araç çizimi** — 150 model için kodla üretilen SVG |
| `kayit.js` | 260 | localStorage + IndexedDB + cihaz deposu, günlük yedek, bozuk kayıttan dönüş, servis çalışanı |
| `i18n.js` | 216 | dil katmanı (tek dil kilidi burada) |
| `ses.js` | 354 | WebAudio ses ve müzik |
| `game.js` | 1214 | **kural motoru** — model tablosu, değerleme, arızalar, alıcı/satıcı |
| `world.js` | 4235 | 3B vitrin (three.js) — gövde profili `profil3B()` 2B kimlikten |
| `rehber.js` | 99 | ilk oyun rehberi |
| `gunlukritim.js` | 95 | günlük görevler ve seri |
| `koleksiyon.js` | 170 | koleksiyon, lig tablosu, rakip vitrini, prestij |
| `galeri.js` | 127 | **galerinin yeri** — kaçan kelepir, yandaki dükkân, sezon hedefi kutusu |
| `konsinye.js` | 178 | **emanet araç** — sahibi net ister, üstü senin, yer kaplar (filonun yerine) |
| `kapora.js` | 71 | kapora: alıcı %3–5 bırakır, 2–3 gün sonra gelir; bozarsan iki katı |
| `sikayet.js` | 117 | hakem heyeti: söylenmemiş kusur satıştan 4–12 gün sonra döner; galeri kademesi olayı |
| `yangorev.js` | 212 | toptan parti, dönen müşteri, sanayi günü, sezon hedefi |
| `kolay.js` | 102 | Hazırla (tek dokunuşla satışa), sıradaki adım rozeti, önerilen teklif |
| `foto.js` | 125 | listede/sayfada 3B stüdyo fotoğrafı (ayrı çizici, boşta kuyruk, 2B yedek) |
| `kanca.js` | 34 | yan sistemlerin gün / BUGÜN rayı / düğme bağlantısı |
| `parca.js` | 77 | tamirde parça kalitesi (orijinal / yan sanayi / çıkma), geri gelme |
| `takas.js` | 129 | takas aracını inceleme, ekspertiz, değer kırma |
| `ilanfoto.js` | 215 | ilan fotoğrafı stüdyosu (açı, ışık, arka plan → puan → alıcı akışı) |
| `piyasa.js` | 123 | segment dalgası (değeri oynatır) + 30 günlük nabız grafiği |
| `grup.js` | 156 | galericiler grubu: ihbar, söylenti, müzayede kulisi, gönderen sicili |
| `canli.js` | 190 | canlı açık artırma (geri sayım, rakip tavanları, son saniye) |
| `rakip.js` | 86 | rakip kişilikleri: puanlamalı ilan seçimi, "baktı" etiketi, zarf katsayısı |
| `sirala.js` | 74 | Türkiye sıralaması (60 sanal galeri) |
| `cila.js` | 125 | mikro animasyon, haptik, onay kutusu |
| `yuz.js` | 129 | satıcı/alıcı/tanıdık/emanet sahibi yüz çizimi (ruh hâline göre) |
| `kisisel.js` | 101 | galeri tabelası ve rengi |
| `karne.js` | 173 | sezon karnesi |
| `meydan.js` | 176 | günün vakası (günlük bilmece) |
| `paylas.js` | 377 | 1080×1920 paylaşım kartları (canvas) |
| `demo.js` | 213 | otomatik tanıtım turu |
| `ui.js` | 4826 | **bütün ekranlar ve olay yönlendirme** (BUGÜN rayı, gözle ekspertiz kuralları) |
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
- teker gövdeye yapıştırılmış gibi: kemer 1,085R'deydi, lastik üstünde boşluk
  yoktu ve kemerin içi boya renginde ışık alıyordu → `KEMER_ORAN` 1,16 (gövde
  kemeri, kovuk ve SUV kaplaması aynı sayıdan), kemer içinde kara `kovukGeo`,
  lastik zemine `temas` gölgesiyle basıyor, lastik çamurluktan 1–2 cm içeride
- jantla lastik arasında açık halka: yanağın düz yüzü yoktu → `yanakGeo` içine
  halka; klasik ve ticari araçta yıldız alaşım yerine sac jant
- boyalar soluk (bordo pembe, kırmızı somon): renk tablosu sRGB yazılı ama
  malzemeye doğrusala çevrilmeden veriliyordu → `matBoya` içinde
  `convertSRGBToLinear()`. Yeni renk eklerken tabloya sRGB yaz, çevirme orada.
- araç plastik/kil gibi: boya %11–17 yansımalı Phong'du (sahne ortamındaki çim
  yeşil leke yapmasın diye kısılmıştı) → boya kendi nötr ortamını yansıtıyor
  (`boyaOrtamTex`: gök, keskin ufuk, iki ışık kutusu), `MeshPhysicalMaterial`
  + clearcoat; metalik renkler `METALIK_RENK`. Zayıf cihazda (`HAFIF_CIZIM`)
  Phong'a düşer; `fiziksel()` tembel, çünkü bu kapsam THREE yüklenmeden çalışır.
- cam süt beyazı: %64 opak açık mavi → koyu füme, %86, yansımalı
- far kaputun 17 cm altında 8,5 cm'lik şerit: ön yüz boş duvar → far kaput
  çizgisinin 8 cm altında, büyük, koyu çerçeve + aydınlık iç + parlak lens;
  burnu eğik araçta yüzey dikleşene kadar iner (kaputa "kaş" gibi taşmasın)
- gövde yastık gibi şişkin: kesit 30 noktalı süperelipsti, alt yarı fıçı gibi
  içe kıvrılıyordu → açık profil (`PROF_YUM`/`PROF_KUT`, `kut` ile karışır):
  taç, dar omuz, karakter kırığı, dik kapı, yalnız eşikte kıvrım. Profilin y
  değerleri kesin azalan olmalı; `xAt` ve `ustY` ters aramaları buna dayanıyor.
  Gövdenin üst yüzeyine oturan her şey (derz, boyalı panel yaması) `ustY(z,x)`
  kullanır — süperelips formülünü bir yere geri kopyalama.
- kaput düz masa: burundan cama 4–8 cm yükselen kavis (`egim`), ön uç `s.hood`'da
  sabit (far, ızgara, derz ona göre); kaputun yan derzleri çamurlukla ayrımı verir
- far dış üst köşesi kaputun omzuna tırmanıp üstten kara üçgen: eğim döngüsü
  dış köşeyi de ölçüyor
- ön tampon her modelde aynıydı: model adından sabit tip (`uclu`, `genis`,
  `spor`, `arazi`, `ticari`); burnun altı eşikten 8,5 cm yukarıda bittiği için
  tampon parçaları `pr.sill+.06`'nın altına inmesin, yoksa gövdenin dışına düşer
- direkler yuvarlak hortum: elips kesitli `direk()` — yandan geniş, önden ince
- koltuklar kutu: `yastik()` (yuvarlatılmış, omuzda daralan) + yanaklar
- araç kafes gibi, kabinde boyalı platform: gövde kuşak hizasında kapalı bir
  tüptü, cam/direk/tavan üstüne ayrı parçalar olarak oturuyordu; camdan
  bakınca koltuklar o kapağın altında kalıyordu → cam evi gövde derisinin
  parçası (`govdeGeo` içinde kesitin tepe dalı 0..7 cam evine uzuyor). Ön cam,
  yan cam, tavan, B direği ve cam fitili aynı loft'un malzeme grupları
  (`camBolge`: 0 boya, 1 cam, 2 tavan, 3 koyu). Gövde mesh'inin malzemesi bu
  yüzden DİZİ; `gov.material.color` gibi tek malzeme varsayan kod yazma.
  İç kabukta (`detay`) cam grubu görünmez malzeme, yoksa camdan iç kaplama görünür.
- ön camdan bakınca bagaj yokmuş gibi dışarısı görünüyordu: iç kabuk (`icKabuk`,
  BackSide) eskiden yalnız `detay` çiziminde vardı; artık her araçta. Sedanda
  arka raf + bölme, hatch/SUV'da bagaj örtüsü
- 360° dönerken kapkara ekran: sınıra çarpan kamera aracın dibine iniyordu →
  kamera çitte kalır ama yükselir (`VT.vinc`); güneşin karşısından gölgesiz
  dolgu ışığı; lamba direkleri ve araya giren komşu araçlar saydamlaşır
  (`ENGELLER`, `engelleriGuncelle`). Direkler bu yüzden birleştirilmiş dekora girmez
- "OTO PAZARI" tabelası: yazı paneli kutunun ön yüzüyle aynı düzlemdeydi
  (z-fighting) ve HTML yer etiketi (`.w3dplace`) tabelanın önüne düşüyordu
- **THREE'ye modül yüklenirken dokunma** (`new THREE.X()` üst düzeyde): 3B'siz
  cihazda oyunun tamamı açılmaz; `test.js` 3. bölüm yakalar. Tembel oluştur
- sol jantların arka yüzü dışarı bakıyordu: `jantGeo` +x yüzüne göre kurulu,
  solda y ekseninde yarım tur döndürülüyor
- jantın üstünde kahverengi çeyrek (Hessler 190, 1.2): kabin arka tekerin üstüne
  uzanınca iç taban/etek kutuları kemer boşluğundan görünüyordu → eşik hizasındaki
  iç parçalar iki kemerin arasında (`icZ0/icZ1`). Yan yamalar (`yanKaplama`) da
  alt kenarı kemer tepesinin altındaysa kemer aralığına girmez; girerse kırpılan
  sütunlar kemer çizgisine sıçrayıp boşluğu çaprazlama kapatıyordu. `vitrin-test`
  tekere yandan ışın atıp ilk çarpanın teker parçası olduğunu ölçüyor

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
- **Fotoğraf anahtarı aracın görünen durumunu içeriyor** (ekspertiz, tamir,
  cila). Anahtar değişince yeni çekim bitene dek `FOTO.son` (araç id → son
  fotoğraf) yerinde kalıyor; 2B çizime düşmek "resim değişip geri geliyor"
  diye görünüyordu. Önbellek LRU: sık görülen aracın fotoğrafı düşmesin.
- **Piyasa dalgası `valueOf`'u çarpıyor** (`nabizKat`, ±%8, ortalamaya döner).
  Değer karşılaştıran testlerde dalgayı sıfırla (`S.nabiz.d[seg]=0`), yoksa
  gün geçince aynı aracın değeri kıpırdar.
- **Canlı artırma zamanlayıcısı** testte `CANLI.oto=false` ile kapatılır;
  saat `canliAdim(ms)` ile elle ilerletilir.
- **3B fotoğraf kuyruğu boşta çalışıyor.** `foto.js` oyuncu yazarken/kaydırırken
  çekim yapmıyor (`requestIdleCallback`). Testte ya da mağaza görüntüsünde
  fotoğraf bekleniyorsa `.fotobekle` kalmayana dek yokla, sabit süre bekleme.
- **Sayfa içi eylem çubuğu** (`.sheet>.actionbar`) `bottom:-24px` ile duruyor.
  Chromium yapışkan konumu kaydırıcının içerik kutusuna göre hesaplıyor; 0
  olunca çubuk sayfanın alt dolgusu kadar yukarıda kalıyor ve altından içerik
  görünüyordu. `ux-test.js` 9. bölüm bunu ölçüyor.
- **Kayıtta araç taşıyan her alan** `serialize`/`deserialize` içinde model
  indeksine çevrilmeli. `S.konsTeklif.car`, `S.parti.cars`, bekleyen
  tekliflerdeki `takas.car` ve `S.canli.car` bu yüzden orada;
  yeni bir "araç tutan teklif" eklersen oraya da ekle, yoksa model nesnesi
  JSON'a kopyalanır ve `MODELS.includes` sessizce yanlış döner.
- **Pazarlık kuralları** (`sellerReply`/`saleReply`, oyun testi kararı): karşı
  teklif oyuncunun teklifini geçmez/altına inmez, turdan tura tek yönde gider,
  "altına inmem" yalnız gerçek tabanda (`taban:true`). Satıcı tarafı önceki
  karşı teklifi `S.neg.sonKarsi`'de, alıcı tarafı `S.sale.counter`'da tutar.
  Değiştirirsen 10.000 turluk simülasyonla (ihlal 0) doğrula.
- **Rakipler `S.rivals`'tan okunur, `RIVAL_DEFS` sırasıyla değil.** Oyunda 4
  rakip var, tanım listesi 10; `RIVAL_DEFS.forEach((d,i)=>S.rivals[i]…)`
  müzayedeyi çökertiyordu. Tanım için `rivalDef(st,i)`.
- **Kasaya giren/çıkan her önemli tutar `kasaHareket(t, etiket)` ile** (ya da kasa
  zaten değiştiyse `kasaNot`). Durum sayfasındaki kasa defteri buradan dolar;
  `S.cash+=` ile sessiz ödül ekleme.
- **Bildirimler kuyrukta** (`toast` → `TOAST_Q`): aynı anda tek bildirim, satış
  özeti (`.satildi`) açıkken bekler. Testte bildirim metni arıyorsan bekle.
- **Üst şeritteki gider = bugün kasadan çıkan** (otopark, maaş, faiz). Kira
  sezon sonunda kesilir; şeritte ayrı birikme sayacı. İkisini birleştirme.
- **Satış sahnesinde eski fotoğraflı yer tutucu** (`.fotobekle.eskifoto`)
  `height:100%` ile yüksekliksiz kapta resmin doğal boyuna uzuyordu; kap
  `aspect-ratio` veriyor. Yeni bir fotoğraf kabı yazarsan yükseklik ver.
- **Koz tavanı tek tablodan** (`SELLERS[].kozTavan`, `kozTavan(s)`): ekrandaki
  pazarlık (`ui.js negReserve`) ile kural motoru (`effReserve`) aynı sınırı kullanır.
  v2'de tavan yalnız `effReserve`'e yazılmış, ekranda %34 kalmıştı. "Altına inmem"
  `S.neg.tabanSoz`'e yazılır ve bağlar; koz yalnız sayıyı söyleyerek indirebilir.
- **Satış tavanı ilanı aşmaz** (`S.sale.tavanKat`, satış açılırken bir kez çekilir).
- **Taksitli satış:** `sellCar(car, peşin, not, alacak)` — kâr tamamdan, kasaya peşin;
  ödenmeyen taksit `taksitKaybi()` ile kârdan düşer, alacak `netWorth`'te.
- **Ekspertiz maliyeti** `ekspMaliyet(c)` (gerçekte ödenen, `c.ekspBedel`); `PARA.ekspertiz`'i
  maliyete doğrudan yazma — bedava bakış ₺2.500 sayılıyordu.
- **Alımda araçtan `seller` ve `ask` silinir.** Alım özeti (`S.neg.alimOzet`) için
  `S.neg.satici` saklanıyor; alımdan sonra `c.seller.x` okuyan kod yazma.
- **Model verisi düzeltmesi `modeller-b.py` içindeki `ELLE` tablosunda.** `game.js`
  `MODELS` üretilir; elle düzeltme orada kalmaz. Ad ve sıra değişmez (kayıt indeksle tutar).
  `ky:"zincir"` modelde triger çıkmaz; `imza:1` arızalar (zincir, süspansiyon) yalnız
  `zf`'sinde olan modelde çıkar.
- **Rakip müzayede zarfı `rakipZarflari(c)`** (araçta `c.rz` saklanır): kapalı zarf,
  Vedat'ın fısıltısı ve canlı artırma aynı ölçüyü kullanır.
- **Pazar listesi varsayılan kompakt** (`S.listeMod`), BUGÜN şeridi 5 kart (`RAY_HEPSI`),
  arama satırı büyüteçle (`ARA_ACIK`). "Günü bitir" `render()` içinde eksik sekmeye eklenir;
  pencere açıkken arkadaki düğme sayılmaz.
- **3B sahnenin dokunma dinleyicisi** (`bind3d`, `#world` touchstart → preventDefault)
  arayüz öğelerini (`#w3dtop`, `#w3dbar`, düğmeler) muaf tutmalı; yoksa iPhone'da
  üstteki "Liste"/"Günü bitir" tıklaması hiç oluşmuyor (1.0.1). `v3-test.js` ölçüyor.
- **Sayfa yeniden çizilince kaydırma dokunulan düğmeye sabitlenir** (`SAYFA_TIK`,
  atölyede `.atolye` bloğu); yalnız sayısal `scrollTop` iOS'ta yetmiyordu.
- **Kademeli açılış** (`kanca.js` `ACILIS`, `acikMi(k)`, `acilisGun`): vaka, sipariş,
  emanet, nabız, grup ve parti satışla açılır, günde en çok biri (`S.acilan`,
  "YENİ" rozeti `S.yeniSistem`). Yeni bir yan sistem eklersen buraya ekle ve
  üretimini `acikMi` ile kapıla. Testler `S.hepsiAcik=true` ile hepsini açar.
- **Rehber 7 adım** (`rehber.js OGRET`): `sec` dizi olabilir; açık sayfada önce
  sayfa içi hedef aranır. Rehber görünürken vurgusuz an kalmasın (`tut.js` ölçer:
  vurguyu izleyen oyuncu ilk satışı ≤15 dokunuşta yapar).
- **Usta notu** (`gunlukritim.js ustaNotu`): ilk 7 gün ya da ilk 3 satışa kadar gün
  raporunda tek cümle + tek düğme; 4 kural sırası `v3-test.js`'te.
- **Kokpit "duvar takvimi"** (1.2, ekip uzlaşması): 14 gün kutusu + kira halkası +
  kuyruk notu (`takvimHesap`, `takvimHtml`). Kira **sezonun 15. gecesi** kesilir
  (`S.day%SEASON_LEN===0`; 1.1'e kadar 16. gece kesiliyordu, takvim bir gün kayık
  söz veriyordu). Gösterilen kira `kiraTahmini()` = `kapanisKirasi()` hesabı (donuk/
  indirimli kira dahil); ayrı bir formül yazma. Eksik yalnız nakde göre (taksit kasa
  değil). Takvimde `--tint` yok. Sınıflar `tk-` önekli: düz `.bugun` rayın sınıfı.
- **Gün raporunda yapışkan notlar** (`gunlukritim.js gunNotlari`, `.not-pano .yapiskan`):
  sarı = yeni günün notu (kira gecesi, son günü dolan teklif, taksit vadesi, sanayi,
  müzayede; en çok 3), pembe = usta notu. Yeni bir "yarın olacak" bilgisi buraya.
- **3B oklar tek araçta sönük** (`.w3dok.tek`) ve dokununca neden geçmediğini söyler;
  oklar 44px. Tam renkli ama işlemeyen ok "çalışmıyor" diye bildirildi.
- **Satış anı** (`cila.js satisAni`, 1.3): kâr maliyete oranla 3 kademe (`satisKademe`:
  ≥%8 iyi, ≥%20 ya da ₺250K büyük). Ses/titreşim/sayaç `openDealSummary` ilk açılışında
  (`d.canlandi`), `sellCar` yalnız nefes verir. Hareket azaltmada sayaç ve kıvılcım yok.
- **Kayıt yedeği** (`kayit.js`, 1.3): gün değişince sağlam kayıt `preloved_yedek` (+`yedek2`
  bir önceki gün), IndexedDB "yedek" ve kabukta Capacitor Filesystem DATA dosyası.
  Açılmayan kayıt **silinmez**: `preloved_bozuk`'a konur, en yeni yedekten açılır
  (`yedektenAc`, oyuncuya bildirilir). "Baştan başla" son oyunu `preloved_silinen`'de tutar.
  Testte kayıt bozacaksan `addInitScript` ile yap: sayfa kapanırken oyun yeniden yazar.
- **`window.prompt`/`confirm` kullanma**: Capacitor WebView'da sessizce null/false döner.
  Kayıt içe alma da artık oyunun kendi sayfası (`kayitice` → `#iceMetin`).
- **Ses grupları** (`ses.js`, 1.3): efektler `SES.efekt`, müzik + ambiyans `SES.muzikBus`
  üzerinden; seviye `sesSeviye(grup,kademe)` (`preloved_seviye`), satışta `sesKis()`.
  Tekrar eden efektler (`SES_DEGISKEN`) ±%6 perde, akorlar sabit. Yeni bir sentez
  düğümünü doğrudan `SES.ana`'ya bağlama.
- **Performans** (1.3 ölçümü, SwiftShader vekili): 3B'deki uzun takılmaların kaynağı
  arka plandaki fotoğraf çiziciydi (`toDataURL` + derleme günlüğü). Fotoğraf kuyruğu
  `#app.in3d` iken bekler, çekim `toBlob` + nesne URL'si (LRU'dan çıkınca bırakılır),
  iki çizicide `debug.checkShaderErrors=false`. 3B kalite `preloved_hafif` (`hafifCizimMi`);
  tabanda 24 fps altı sürerse bir kez Hafif önerilir. Gerçek cihaz rakamı Ayarlar →
  Cihaz testi metninden gelir; sandbox rakamı GPU'yu temsil etmez.
- **Nadir kelepir** (`game.js NADIRLIK`, `gununKelepiri`, 1.3): ilan başına ağırlıklı tablo
  (normal 91 / uygun 6 / kelepir 3) + günlük %12 zar; kelepir `kelepirSaglam` ile
  doğrulanır (gizli ağır kusur, büyük hasar, km oynaması yok), aynı anda en çok bir
  tane, 2 günde kapılır. Simülasyon: günlerin ~%21'inde pazarda bir kelepir.
- **Türk plakası** (`game.js IL_PLAKA`, `plate(il)`, 1.4): "34 ABC 123" biçimleri, il
  ağırlıklı. 2B `plateHtml` mavi TR bandını `/^\d{2} /` ile tanır; 3B `plakaTex` 512×112.
  Şehir dışı alıcının ili teklifte `il` alanında.
- **Kaporta şeması tek kaynak** (`ekspSema(c)`, 1.4): araç id'sinden tohumlu, kayda yazılmaz.
  2B SVG (`semaSvg`), 3B boyalı/değişen yamaları (`yanSlot`) ve ekspertiz taraması aynı
  tabloyu okur. Değişen önce dağıtılır; sayı `c.degisen`/`c.boyali` ile birebir (v14-test).
  Tarama `W3D.ekspertizTara(id)` + yeniden kurulumla başlar (`TARA`, 3 sn içinde kurulmalı).
- **Camdaki SATILIK kâğıdı** (`satilikKagidi`, 1.4): yan cam çizgisi `govdeGeo` userData'daki
  `camYan(z)`'den gelir. `xAt` kuşak üstünde camı değil gövde kenarını verir; `ustHat` kuşak
  hattıdır, tavan `s.roof`. Kâğıt tek yüz + ters doku (`satilikDoku`); DoubleSide karşı
  camdan ayna yazı gösteriyordu. Saydam geçişte, `renderOrder` 6: opakta füme cam örtüyordu.
- **Kapora** (`kapora.js`, 1.4): `finishSale` başında `kaporaAday`; kaporalı aracı başkasına
  satmak `sellCar` başında `kaporaBoz` (iki katı, itibar −2). Gün kancası `S.day-1`'i işler
  (kanca `S.day++`'tan sonra çalışır). Kapora kasaya girdiği için gelişte satış tamdan
  sayılır, kapora kasadan düşülür.
- **Hakem heyeti** (`sikayet.js`, 1.4): `sellCar` her satışta `sikayetKaydet` çağırır;
  dürüst (`disclosed`) satış şikâyet almaz. `S.sikayet[].car` kayıtta model indeksine
  çevrilir (serialize). Oranlar yorumdaki simülasyonla ayarlı; muğlak ilanın taban cezası
  şikâyetten bağımsız, ±%5 hedefi şikâyetle tutturulamaz.
- **Rakip kişilikleri** (`rakip.js`, 1.4): rakip ilanı önce "baktı" der (`c.rakipGoz`, her gece
  silinip yeniden konur), ertesi gece `kapma` olasılığıyla alır; geçerse o ilandan vazgeçer
  (`c.rakipPas`). Olmasa aynı ilana her gece zar atılıyor, oran ilan ömrüyle büyüyordu.
  Müzayede/canlı tavanı `rakipZarfKat`. Ayar sonrası oyuncusuz koşuyla ölç (≤%25).
- **Sabah en az bir yeni ilan** (`nextDay`): gece hiçbir ilan kalkmadıysa oyuncunun açmadığı
  en eski ilan düşer. Testler "pazar değişti"ye dayanıyor.
- **Oto pazarı** (`pazarGunu(gun)`, her 7. gün): `marketSize` +3, 3B `PAZAR_SABAH` ışığı ve
  `pazarDekoru` (Hafif çizimde yalnız ışık). **Galeri kademesi** `galeriKademe()` 0/1/2
  (park yeri, seviye, prestij): 3B bina `galeriBinasi(...,kademe)`. Showroom içi aydınlığı
  bina kutusunun ÖNÜNDE (kutunun içinde kalınca ön yüz örtüyordu).
- **Rehber 7. adımı** ilk gece teklif gelmezse rapor kapat → günü bitir'i vurgular.
- **Yazı boyutu** `S.yazi` → `html.yk` + `--yk`; `zoom` kullanma (3B tuval bozulur).
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
