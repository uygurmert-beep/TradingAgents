# KELEPİR — devir briefi

Bu belge, oyunun bugün nerede durduğunu, nasıl buraya geldiğini ve kusursuza
gitmek için sırada ne olduğunu anlatıyor. `CLAUDE.md` **nasıl çalışılacağını**
söylüyor; bu dosya **ne yapılacağını**.

---

## 1. Tek cümlede durum

Oyun mağazaya yüklenebilir durumda: imzalı `.aab` üretiliyor, 221 otomatik
kontrol geçiyor, mağaza metni ve görselleri hazır. Eksik olan tek şey oyunun
kendisinde değil, **derinliğinde**: uzun oyunda baskı az, satış sonrası yaşam
yok, ve bazı sistemler (filo) yeni kurduğumuz kıtlık mantığıyla çelişiyor.

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

---

## 3. Sayılarla bugün

| | |
|---|---:|
| Model | 150 (40 marka) |
| Kod | ~12.800 satır, 22 modül |
| Çıktı | tek HTML, 665 KB (+ three.js 608 KB) |
| Otomatik kontrol | 221 (95 kural + 78 arayüz + 26 mağaza + diğerleri) |
| Denge (121 gün) | net değer ₺3,2M → ₺19,7M, borç 0, 127 satış |

Mağaza: `com.kelepiroyunu.kelepir`, targetSdk 36, minSdk 24, iOS 15.0,
imzalı `.aab` üretiliyor, `aapt2` ve `apksigner` ile doğrulandı.

---

## 4. Birikmiş iş — öncelik sırasıyla

### A. Filo yeniden değerlendirilmeli (çelişki)

`filo.js` bugün aracı kiraya verip günlük gelir üretiyor. **Yeni yer kıtlığıyla
çelişiyor:** kiradaki araç park yerini işgal ediyor ama satılamıyor, yani
oyuncuyu kelepir kaçırmaya mahkûm ediyor. Mevcut hâliyle cezalandıran bir
özellik.

İki yol:
- **Kaldır.** Oyun alım-satıma odaklanır, kimse aramaz.
- **Konsinyeye çevir** (önerilen). Biri aracını sana bırakıyor; cebinden para
  çıkmıyor, satarsan komisyon alıyorsun, ama **yer kaplıyor**. Aynı kod
  iskeleti, ters yönde bir ekonomi — ve yer kıtlığını güçlendiriyor.

### B. İki yan görev (en yüksek getiri)

**Toptan parti.** Bir galerici üç aracı tek fiyata veriyor, tanesi %15 ucuz;
üç boş yer gerekiyor. Büyütme baskısını doğrudan paraya çeviren en net mekanik.

**Dönen müşteri.** Sipariş sistemi var ama müşteriler anonim. İsim ver,
memnun ayrılanı bir ay sonra daha büyük bütçeyle geri getir. İtibarın ilk
somut karşılığı olur.

### C. Daha sonra

- **Sanayi günü** — Nuri ayda bir toplu tamirde %30 iniyor; arızalı aracı o
  güne saklamak strateji olur (stok tutmanın ilk olumlu sebebi).
- **Tüketici şikâyeti** — üst üste yakalanırsan dosya açılıyor: tazminat ya da
  bir sezon itibar kaybı. Yalanın uzun vadeli faturası.
- **Noterde iş** — satış sonrası evrak N gün içinde bitmezse ceza; Noter Yılmaz
  tanıdığı hızlandırıyor.
- **Sezon hedefi** — mal sahibi hedef koyuyor, tutturursan gelecek sezon kirası
  donuyor. Kirayı cezadan yarışa çevirir.

### D. Teknik borç

- `ui.js` 3.725 satır. Bölmek cazip ama modüller tek kapsamda birleşiyor;
  bölme kazancı risk kadar değil. Böleceksen `cakismaKontrol()`'e güven.
- `world.js` 3.195 satır, 3B. Testi yalnızca `pad-test.js` (kontroller).
  Sahne içeriği için otomatik kontrol yok.
- **İngilizce sözlük bakımsız.** `TEK_DIL="tr"` olduğu için fark edilmiyor.
  Global sürüm düşünülürse `en.js` baştan gözden geçirilmeli.
- **Artifact önizlemesinde paylaşım kartı indirilemiyor** (tarayıcı katmanı
  izin vermiyor). Uygulamada Filesystem eklentisiyle çalışıyor.
- Denge simülasyonundaki bot kontenjan satın almıyor; kira baskısını gerçek
  oyuncu gibi yaşamıyor. Bot'a "yer dolunca büyü" davranışı eklenirse
  simülasyon daha dürüst olur.

---

## 5. Yapılmayacaklar (bilinçli kararlar)

- **Reklam, uygulama içi satın alma, enerji/bekleme mekaniği.** Mağaza vaadi bu.
- **Filoyu derinleştirmek** (bakım paketi, sigorta, yedek araç, HGS/MTV).
  Değerlendirildi; oyunu alım-satımdan uzaklaştırıyor.
- **Gerçek marka adları.** B seviyesinin ötesine geçilmeyecek.
- **Yeni sekme.** Altı sekme zaten sınırda.
- **Liste/geçiş animasyonları.** Üç an için mikro hareket var (kasa sayıyor,
  gün basamak atlıyor, tamir çubuğu doluyor); ötesi telefonda yavaşlık.

---

## 6. İlk oturumda yapılacaklar

```bash
cd oyun
python3 build.py && python3 appbuild.py     # derlendiğini gör
node test/ux-test.js                        # 78 kontrol geçmeli
open preloved.html                          # oyunu aç, 10 dakika oyna
```

Sonra `A` maddesini (filo kararı) ver — çünkü o karar verilmeden `B` yapılırsa
yer ekonomisi iki yönden çekiştirilir.
