# KELEPİR — devir briefi

Bu belge, oyunun bugün nerede durduğunu, nasıl buraya geldiğini ve kusursuza
gitmek için sırada ne olduğunu anlatıyor. `CLAUDE.md` **nasıl çalışılacağını**
söylüyor; bu dosya **ne yapılacağını**.

---

## 1. Tek cümlede durum

Oyun mağazaya yüklenebilir durumda ve önceki brief'teki derinlik eksikleri
kapandı: filo konsinyeye çevrildi, toptan parti, dönen müşteri, sanayi günü ve
sezon hedefi eklendi; Pazar ekranı yeniden düzenlendi (BUGÜN rayı). 3B
onarıldı (150 model kendi gövdesiyle, gerçekçi far/ızgara), yürüme yerine
vitrin ve gözle ekspertiz geldi. 326 otomatik kontrol geçiyor. Sırada **yalanın uzun vadeli faturası**
(tüketici şikâyeti) ve **satış sonrası evrak** (noter) var.

---

## 2. Nereden gelindi — oyunun omurgasını kuran altı karar

Bunları bilmek önemli, çünkü her biri bir sorunun cevabı. Geri alınırsa o sorun
geri gelir.

**1. Araç çizimi koda taşındı.** Önce 6 segment silüeti vardı; 163 model 6
resimle gösteriliyordu. Oyun "Excel tablosu gibi" görünüyordu. Artık her model
kendi adından türeyen sabit tohumla, gerçek araç ölçülerinden kurulan kendi
SVG'siyle çiziliyor. Sıfır görsel dosya, tamamen çevrimdışı.

**2. İsimlendirme B seviyesine çekildi.** "Ailesi belli, kopyası değil."
40 marka, 150 model. Motor kısaltmaları bilerek kullanılmadı (tescilli).

**3. Renk yönü: asfalt + evrak.** Koyu asfalt zemin, belgelerin kendi krem
kâğıt dünyası (`.belge` sınıfı bir bölgenin bütün renk jetonlarını kâğıda
çeviriyor). Üçüncü bir vurgu rengi YOK — kehribar yalnızca para, yeşil/kırmızı
yalnızca sonuç.

**4. Uzmanlık birikiyor.** Oyunun en büyük eksiği buydu: 10. günde öğrenilen
hiçbir şey 50. günde işe yaramıyordu. Üç parça çözdü:
- her modelin **imza arızası + km eşiği** var (eşik üstünde arızaların %50'si
  o modelin imzası, düz havuzda %10,5 olurdu)
- **galericinin defteri** gördüğün arızayı o modelin hanesine yazıyor
- **kademeli ekspertiz**: göz / hızlı bakış (tek organ, sen seçiyorsun) / tam

**5. Satış bir kompozisyon oldu.** Fiyat + ilan dili + sunum. Ölçüm:
dürüst → akış 0,51, ortalama teklif ₺730K, hiç yakalanma yok;
abartılı → akış 0,92, teklif ₺611K, alıcıların %61'i kaçıyor.

**6. Yer kıtlığı kuruldu.** Kira seviyeyle basamak atlıyor, büyüme maliyeti
arketipe göre değişiyor, ve yer doluyken kaçırdığın kelepiri ertesi gün bir
rakip alıp fiyatını yüzüne söylüyor.

**7. Filo konsinyeye döndü.** Kiradaki araç yer kaplayıp satılamıyordu, kıtlıkla
çelişiyordu. Artık biri aracını bırakıyor: sahibi net ister, üstü senin, nakit
çıkmaz ama yer kaplar ve sahibin sabrı sınırlı. Sahip tipleri (acelesi olan,
titiz, kusur saklayan) ekspertizi yeniden anlamlı kılıyor.

**8. Günün işleri tek rayda.** Pazar ekranı dikey bir yığınla açılıyordu, araç
listesi ikinci ekrana düşüyordu. Vaka, görevler, siparişler, emanet, parti,
sanayi ve hedef artık yatay BUGÜN rayında birer kart; liste ilk ekranda.

**9. Sezon hedefi kendini yükseltiyor.** Hedef = max(kira × 3,2, geçen sezon
kârı × 1,10). Sabit kat denendi; bot bile 8 sezonun 7'sini tutturuyordu.
Şimdi ~yarısı tutuyor. Tutunca gelecek sezon kirası donuyor ve %25 iniyor.

**10. 3B gezinti vitrine döndü.** İki pedle yürünen saha telefonda yorucuydu
ve oyuna bir şey katmıyordu. Artık kamera seçili aracın etrafında dönüyor
(sürükle, iki parmak/tekerlek yakınlaş, ‹ › ya da fiske ile sıradaki araç),
boşta araç döner tabladaki gibi dönüyor. Blok insan figürleri ve ayaklı fiyat
panoları kaldırıldı.

**11. Gözle ekspertiz.** Ekspertizsiz araçta boyalı panelin ton farkı, silik
kapı çiziği, çamurluk göçüğü, eşik pası, yağ lekesi araçta çizili. Oyuncu
vitrinde üstüne dokununca bulgu araç dosyasına yazılıyor ve pazarlıkta bedava
koz oluyor. Göz yalnız kaportayı görür; motoru ekspertiz söyler — ekspertiz
anlamını korur.

**12. 3B araç 2B ile tek kaynak.** Bkz. CLAUDE.md "3B araç". Kök hata, eski
isimlerle anahtarlı tablolar yüzünden 150 modelin 6 gövdeye düşmesiydi.

---

## 3. Sayılarla bugün

| | |
|---|---:|
| Model | 150 (40 marka) |
| Kod | ~13.300 satır, 23 modül |
| Çıktı | tek HTML, ~690 KB (+ three.js 608 KB) |
| Otomatik kontrol | 326 (116 kural + 95 arayüz + 26 vitrin + 26 mağaza + diğerleri) |
| Denge (121 gün, 3 koşu) | net değer ₺3,2M → ₺7,4M / ₺18,2M / ₺24,9M, borç 0, 99–154 satış |

Denge botu artık gerçek oyuncu gibi büyüyor (yer dolunca ve kasa rahatsa
kontenjan alıyor), kârlı görünen emaneti ve partiyi alıyor. Sonuçların
dağılması bilinçli: parti ve emanet risk taşıyor, kötü koşu mümkün.

Mağaza: `com.kelepiroyunu.kelepir`, targetSdk 36, minSdk 24, iOS 15.0,
imzalı `.aab` üretiliyor, `aapt2` ve `apksigner` ile doğrulandı.

---

## 4. Birikmiş iş — öncelik sırasıyla

### Yapıldı (bu oturum)

- **A. Filo → konsinye** (`konsinye.js`). Eski kayıttaki kiradaki araçlar
  yüklenirken normal stoğa döner.
- **B. Toptan parti + dönen müşteri** (`yangorev.js`). Partide bir ağır gizli
  kusurlu araç var, ekspertiz ancak aldıktan sonra. Memnun teslim edilen
  sipariş müşterisi 11–16 gün sonra ×1,28 bütçeyle döner, gizli kusur onu kaybettirir.
- **C'den ikisi: sanayi günü** (her 10. gün tamir %30 ucuz) ve **sezon hedefi**.
- **D'den: denge botu büyüyor.**
- **Arayüz:** BUGÜN rayı, kompakt ilan başlığı, seviye çubuğu (son seviyede
  "5000/4000" taşması bitti), boş garaj/müzayede sahneleri, tanıdıklara yüz,
  emanet sahibine yüz, sayfa eylem çubuğunun altından içerik görünmesi düzeldi,
  rapordaki parti/emanet olayından tek dokunuşla teklife gidiş.
- **Test düzeltmesi:** `ux-test.js` "ertesi gün rakip o aracı alıyor"
  pazarın rastgeleliğine göre kırmızı yanıyordu (sayaç geç okunuyordu).

### Sırada

- **Tüketici şikâyeti** — üst üste yakalanırsan dosya açılıyor: tazminat ya da
  bir sezon itibar kaybı. Yalanın uzun vadeli faturası. Dönen müşterinin
  karşılığı: itibar artık hem kazandırıyor hem de kaybettiriyor olmalı.
- **Noterde iş** — satış sonrası evrak N gün içinde bitmezse ceza; Noter Yılmaz
  tanıdığı hızlandırıyor. BUGÜN rayına bir kart olarak oturur.
- **Çerçeveli mağaza görselleri yeniden üretilmeli.** Ham ekranlar
  (`magaza/ss/{play,ios}`) yeni arayüzle üretildi, `06-filo` yerine `06-emanet`.
  Çerçeveli olanlar (`magaza/ss-cerceve`) ve özellik grafiği Poppins fontu
  gerektiriyor; bu ortamda font yoktu. Fontun olduğu makinede
  `pip install cairosvg && python3 magaza-gorsel.py`. Eski `ss-cerceve/*/06-filo.png`
  o zaman silinmeli. (İki üreticideki `magaza/` yol hatası düzeltildi: görseller
  `oyun/magaza` altına düşüyordu.)
- **Android/iOS paketi yeniden üretilmeli.** Kabuktaki `public/` klasörleri
  git'e girmiyor; `python3 appbuild.py && cd ../kabuk && npx cap sync` ve
  `./gradlew bundleRelease` imza anahtarının olduğu makinede çalıştırılmalı.

### Teknik borç

- `ui.js` 3.881 satır. Bölmek cazip ama modüller tek kapsamda birleşiyor;
  bölme kazancı risk kadar değil. Böleceksen `cakismaKontrol()`'e güven.
- `world.js` ~3.400 satır, 3B. `vitrin-test.js` vitrini ve gözle ekspertizi,
  `ux-test.js` 11. bölüm model profilini ölçüyor; görsel kalite için 150
  modeli çizip bakmak hâlâ elle. Emanet aracı 3B'de ayrı işaretlenmiyor.
- **3B'de daha gidilecek yol:** iç mekân koltukları kutu, arka stop lambaları
  ve tampon detayı ön yüz kadar işlenmedi; hatchback'ler hâlâ biraz uzun
  tavanlı. Göz ipuçları yalnız kaporta; lastik diş derinliği, far sararması
  gibi yeni ipuçları kural tarafında karşılık isteyecek.
- **İngilizce sözlük bakımsız.** `TEK_DIL="tr"` olduğu için fark edilmiyor.
  Yeni ekranların başlıkları eklendi, uzun cümleler eklenmedi.
- **Artifact önizlemesinde paylaşım kartı indirilemiyor** (tarayıcı katmanı
  izin vermiyor). Uygulamada Filesystem eklentisiyle çalışıyor.

---

## 5. Yapılmayacaklar (bilinçli kararlar)

- **Reklam, uygulama içi satın alma, enerji/bekleme mekaniği.** Mağaza vaadi bu.
- **Filoyu geri getirmek ya da derinleştirmek** (kiralama, bakım paketi,
  sigorta, yedek araç, HGS/MTV). Filo kaldırıldı; oyunu alım-satımdan
  uzaklaştırıyor ve yer kıtlığıyla çelişiyordu.
- **Gerçek marka adları.** B seviyesinin ötesine geçilmeyecek.
- **Yeni sekme.** Altı sekme zaten sınırda. Yeni bir yan görev BUGÜN rayına
  kart olarak girer, sekme olarak değil.
- **Liste/geçiş animasyonları.** Üç an için mikro hareket var (kasa sayıyor,
  gün basamak atlıyor, tamir çubuğu doluyor); ötesi telefonda yavaşlık.

---

## 6. İlk oturumda yapılacaklar

```bash
cd oyun
python3 build.py && python3 appbuild.py     # derlendiğini gör
node test/yeni-test.js && node test/ux-test.js
open preloved.html                          # oyunu aç, 10 dakika oyna
```

Sonra **tüketici şikâyeti**ni yap: dönen müşterinin aynası. İkisi birlikte
itibarı soyut bir sayıdan, oyuncunun hesabına giren bir şeye çeviriyor.
