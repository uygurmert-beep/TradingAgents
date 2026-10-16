# Kelepir 1.0: "Kavraması zor" geri bildirimi. Ekip toplantısı ve oylama

**Katılımcılar:** GEL (oyun geliştirici / game designer), UX (UX tasarımcısı), STR (stratejist), FUT (futbol / FM oyuncusu), GNÇ (20 yaşında mobil oyuncu), KRK (40 yaşında oyuncu), ARB (araba tutkunu), GLR (galeri sahibi)
**Moderatör:** toplantı yöneticisi (oy kullanmaz)
**Gündem:** Oyunu ilk kez oynayan bir arkadaşın 1.0 geri bildirimi (iPhone, Netlify). Ana gözlem şu: *"Çok detaylıymış, içine girip hemen kavraması kolay değil."*

**Gündem dışı kalanlar (1.0.1'de düzeltildi, tartışılmadı):** 3B garajda üst düğmelerin dokunuşu almaması (`bind3d` içindeki `arayuz()` muafiyeti), "ilan vermeyi beceremiyorum" şikâyeti (garajın Hazırlıkta sekmesine yol gösterici ve doğrudan Hazırla düğmesi kondu, `viewGaraj` içindeki `.garaj-ipucu`), tamir atölyesinde kaydırmanın en tepeye dönmesi.

**Moderatör notları**
- Kod yalnızca okundu. Hiçbir dosya değişmedi, git kullanılmadı.
- Kanıt için derlenmiş oyun (`kelepir-tek.html`) Playwright ile 390×844 telefon görünümünde, yeni bir oyuncu gibi sıfır kayıtla açıldı. Betikler ve ekran görüntüleri `/tmp/claude-0/-home-user-TradingAgents/22da4b72-92e6-59f5-93a8-5721d8163da4/scratchpad/oylama/` altında: `olc.js` (rehberi izleyen oyuncu), `olc2.js` (rehberi atlayıp Hazırla kısa yolunu kullanan oyuncu), `olc3.js` (ilk 12 günde BUGÜN rayı), `olc4.js` (araç sayfalarının yoğunluğu). `*.png` dosyaları adımların ekran görüntüleri.
- Pazar her oyunda rastgele kuruluyor, bu yüzden aynı betiğin iki koşusunda farklı araçlar çıktı. Dokunuş sayıları her koşuda ±1 içinde tutarlıydı.

---

## Kanıt: ilk dakikaların sayımı (390×844)

### A. Ölçüm tablosu

"Etkileşimli" sütunu, görünür alandaki dokunulabilir öğelerin sayısıdır (düğme, `data-act`, girdi). "Sayı parçası" sütunu, ekrandaki ₺, % ve iki haneden uzun rakamların sayısıdır.

| Ekran | Etkileşimli | Kelime | Sayı parçası | Not |
|---|---|---|---|---|
| Giriş (`renderIntro`) | 7 | 109 | 1 | 3 başlangıç tipi ve 2 zorluk var. Zorluk için "sonradan değişmez" yazıyor. Yeni oyuncu oyunu görmeden iki karar veriyor. |
| Pazar, 1. gün (`viewPazar`) | **29** | 164 | **49** | Kokpitte kasa ve 6 metrik var: sezon çubuğu, Stok, İtibar, Sv + XP çubuğu, "₺0 bugün", "Kira 7K/110K". BUGÜN rayında 3 kart, 9 filtre çipi, Liste/3B anahtarı, Fotoğraflı/Kompakt anahtarı ve 6 sekme var (2'si kilitli). İlk ilan kartının üst kenarı **418px'te**, yani ekranın yarısında. Altta rehber kartı listeyi örtüyor (`02-pazar-ilk.png`). |
| Pazardaki ilan sayfası (sheet) | 33 | 254 | 71 | 6 bölüm: Ne kadar ediyor, Durum, Arızalar, Hasar geçmişi, İlan metni, Araç. Uzunluk **2,4 ekran** (1.987px). |
| Pazarlık (`renderNeg`) | **44** | 250 | 70 | 14 düğme görünüyor: 7 hamle kartı, 4 hızlı ayar, Tavan, girdi ve Teklif ver. |
| Sahip olunan araç, ekspertizsiz (`openOwnCar`) | 15 | 263 | 39 | Uzunluk **3 ekran** (2.506px). Hazırla düğmesi y=500px'te, ilk ekranda görünüyor (v3 kararı 4b tutmuş). |
| Sahip olunan araç, ekspertizden sonra | 20–26 | 209–235 | 39–62 | Uzunluk **3,5 ekran**. Tamir listesi uzun. |
| Satış pazarlığı | 33 | 204 | 43 | 7 hamle kartı ve "Üstüne ekstra koy" seçeneği var. |

### B. İlk satışa kaç dokunuş?

| Senaryo | Alım (ilan açıldıktan sonra) | İlan (alımdan sonra) | Satış (ilandan sonra) | **Toplam** (Galeriyi aç dahil) | Oyun günü |
|---|---|---|---|---|---|
| **A. Rehberi izleyen oyuncu** (`olc.js`, yalnız vurgulu öğeye ve sheet düğmelerine dokunur) | 9 (ekspertiz 1, pazarlık 1, önerilen teklif ya da teklif 6, kabul 1) | 5 (Garaj sekmesi, sheet kapat, araca dokun, tamir, ilana koy) | 4 (Günü bitir, teklife pazarlık, Fiyat ver, kabul) | **19** | 2 |
| **B. Rehberi atlayıp Hazırla'yı kullanan oyuncu** (`olc2.js`) | 3 (pazarlık, önerilen teklif, teklif ver) | 4 (alım özetini kapat, Garaj, Hazırla, onay) | 11 (3 boş gün: Günü bitir ve rapor kapat; sonra pazarlık, Fiyat ver, kabul, kapat) | **21** | 5 |

### C. Rehberin öğrettikleri ve öğretmedikleri (`rehber.js` `OGRET`, 8 adım)

- **Öğretiyor:** ilan aç → ekspertiz → pazarlık → al → **elle tamir** → **elle ilan** → günü bitir → teklifi değerlendir. Sonunda ₺30.000 ikramiye veriyor.
- **Öğretmiyor:**
  - **Hazırla** kısa yolu. 1.0.1'de garaja eklendi ama rehber adımlarında hiç geçmiyor. Rehber oyuncuyu 3,5 ekranlık araç sayfasında tamir düğmesini aramaya yolluyor.
  - Garajın Hazırlıkta / Satışta / Teklif alt sekmeleri.
  - BUGÜN rayındaki kartlar: görevler, sezon hedefi, vaka.
  - Kokpitteki İtibar, Sv ve "Kira 7K/110K".
  - Sipariş, emanet, galericiler grubu, piyasa nabzı, müzayede ve 3B gez.
- **Vurgusu olmayan adımlar (3 yer):**
  1. "Kârlı tamiri yap" adımında hedef (`[data-act="repair"]`) araç sayfası açılmadan DOM'da yok, yani vurgu yok. Oyuncu araca kendisi dokunmak zorunda.
  2. Alım özetinde rehber "Garaj sekmesine geç" diyor ve alttaki sekmeyi vurguluyor, ama sheet açık. Özetin kendi "Garaja git" (`alimgit`) düğmesi vurgulanmıyor.
  3. "Gelen teklifi değerlendir" adımında satış sheet'i içinde hiçbir düğme vurgulanmıyor (`saleoffer` / `saleaccept`).
- **Rehber metni örtülüyor:** Bir sheet açıkken rehber kartı `#ogret.ust` sınıfıyla ekranın tepesine çıkıyor ve sheet başlığını ("Pazarlık", "Satış pazarlığı") örtüyor. Aynı anda gelen toast ("Ekspertiz: 3 gizli bulgu çıktı", "… alındı", "Görev tamam …") da rehber kartının başlığını örtüyor. Oyuncu "Aracı al" ve "Gelen teklifi değerlendir" yönergelerini tam karar anında okuyamıyor (`05-pazarlik.png`, `06-alim-sonrasi.png`, `10-satis-sonrasi.png`).
- **Rehberin ilan adımı neredeyse kârsız fiyat kurabiliyor:** Bir koşuda ilan ₺994.500, maliyet ₺991.750 çıktı (+%0,3). Alıcı ₺831.000 ile açtı. Rehber "Fiyat koy" diyor, ama fiyat kaydırıcısının varsayılanını kabul eden yeni oyuncu zarara çok yakın bir ilanla başlıyor.

### D. Yan sistemler ilk günden mi açık? (`olc3.js`, yalnız "Günü bitir")

| Gün | BUGÜN rayındaki kart | Yeni gelen |
|---|---|---|
| 1 | 3 | Günün vakası, Günün görevleri, Sezon hedefi |
| 2 | **5** | Sipariş (Koleksiyoncu), **Galericiler grubu** |
| 3 | **7** | **Emanet teklifi**, **Piyasa nabzı** |
| 4 | 7 | Müzayede sekmesi açıldı |
| 5 | 8 | 2. sipariş |
| 7 | **9** | Piyasa olayı (Bayram öncesi), Sanayi günü |

İlk 3 günde 7 ayrı sistem rayda beliriyor. Hiçbiri tanıtılmıyor, açılışlar oyuncunun ilerlemesine (satış ya da seviye) bağlı değil. 12 gün boyunca hiç satış yapmayan oyuncuda da bu kartlar çıkıyor. Seviye 12. günde hâlâ 1, buna karşılık Müzayede 4. günde, Galeri 12. günde açılıyor. Ray 5 karttan sonra "Tümü" ile kesiliyor, yani oyuncu bazı sistemleri hiç görmüyor.

### E. Yolda görülen diğer şeyler (kavramayla ilgili)

1. **"Önerilen teklif" satıcının son sözünü bilmiyor.** Satıcı "₺747.500. Bundan aşağısı yok." dedikten sonra önerilen teklif yine ₺731.500 çıktı. Bu iki kez üst üste oldu (`06-alim-sonrasi.png`). Kısa yola güvenen yeni oyuncu aynı reddedilen teklifi tekrarlıyor ve sabır kaybediyor.
2. **Hazırla onayındaki "Beklenen kâr" ile gerçekleşen arasında 4 kat fark var.** Onayda "~₺72.265 (ekspertizsiz tahmin)" yazdı, satış +₺18.350 kârla kapandı (B senaryosu).
3. **Sayfa hataları (yan bulgu):**
   - Alım gerçekleşince `moveButtons()` satıcısı silinmiş araçta `c.seller.sert` okuyor ve hata veriyor (`TypeError … reading 'sert'`). `renderNeg` yedek satıcı kullanıyor, `moveButtons` kullanmıyor.
   - Satış kabul edildikten sonraki kısa gecikmede × ile kapatınca `finishSaleAfter()` içinde `S.sale.oid` null hatası oluşuyor (`finishSale` içindeki `setTimeout` yarışı).

   Bu ikisi Ö4'e ve yan görev olarak kayda geçti.

---

## TUR 1: Teşhis. "Kavraması zor" neden?

- **GEL:** Sorun derinlik değil, derinliğin **sırası**. Rehber 8 adımda tek bir döngüyü öğretip çekiliyor, sonra 2. ve 3. günde rayda 4 yeni sistem birden beliriyor. Bunların hiçbiri oyuncunun yaptığı bir şeyin ödülü olarak gelmiyor, takvimle geliyor. Oyuncu neyin ana iş, neyin yan iş olduğunu ayıramıyor.
- **UX:** Sayılar ortada. Pazarın ilk ekranında 29 dokunulabilir öğe ve 49 rakam var, ilk ilan ekranın yarısında başlıyor. Pazarlıkta 44 öğe var. Rehberde de 3 adımda vurgu yok ve yönerge kartı karar anında toast ve sheet başlığıyla çakışıyor. Yeni oyuncu rehberi takip etmeye çalışırken onu göremiyor. İlk satış 19 dokunuş; bunun 5'i yalnızca "araç nerede, düğme nerede" aramak.
- **STR:** Ben derinliği suçlamıyorum. Kısa yollar yeni oyuncuyu yanlış yönlendiriyor: önerilen teklif reddedilen rakamı tekrarlıyor, Hazırla 4 kat fazla kâr vaat ediyor. Oyuncu "anlamıyorum" diyor, çünkü oyunun kendi önerisi sonuçla uyuşmuyor. Mantığı tutarsız bir sistem karmaşık görünür.
- **FUT:** FM'i ilk açtığında her şey önüne serilmez. Önce kadro ve maç gelir, transfer bütçesi ve gençlik akademisi sonra. Burada 3. günde sipariş, emanet, galericiler grubu ve piyasa nabzı aynı rayda yan yana duruyor. Kademeli açılma yok, dolayısıyla "kilidi açtım" sevinci de yok.
- **GNÇ:** İlk satışa 19 dokunuş, 2 gün. Rehberi atlayıp kısa yolu kullanınca 21 dokunuş ve 5 gün sürdü, 3 gün boş "Günü bitir → raporu kapat" yaptım. Rehber bana Hazırla'yı göstermiyor, beni 3,5 ekranlık sayfada tamir aramaya yolluyor. Hızlı yol var ama oyun saklıyor.
- **KRK:** İlk ekranda "Kira 7K/110K", "Sv 1", "İtibar 50", "₺0 bugün" yazıyor. Hiçbiri anlatılmıyor ve hiçbiri ilk alımda işime yaramıyor. Tramer, değişen, ekspertiz gibi terimler de açıklamasız. Okuyorum ama neyin önemli olduğunu çıkaramıyorum.
- **ARB:** Bence detay oyunun ruhu: ekspertiz, kronik dert, hasar geçmişi. Sorun detayın ilk dakikada **aynı ağırlıkta** sunulması. 6 bölümlü ilan sayfasında neyin karar verdirdiği, neyin süs olduğu belli değil. 3B gez de ilk girişte nasıl çıkılacağını söylemiyor; 1.0'daki takılmanın yarısı buydu.
- **GLR:** Gerçek bir galeriye yeni çırak gelince ona her şeyi anlatmazsın. Önce "şu arabayı al, şu kadara sat" dersin, akşam da "bugün şunu yanlış yaptın" dersin. Oyunda bu akşam konuşması yok: gün raporu rakam veriyor ama ders vermiyor. Ayrıca "tramer", "değişen" gibi terimler gerçek ve kalmalı, ama ilk görüldükleri yerde bir cümleyle açıklanmalı.

**Moderatör özeti (teşhis):**
1. **Akış sırası:** Rehber tek döngüyü öğretiyor ama Hazırla kısa yolunu atlıyor. 3 adımında vurgu yok, yönergesi karar anında örtülüyor.
2. **Erken yoğunluk:** Pazarın ilk ekranında 29 öğe ve 49 rakam var. BUGÜN rayı 1. günde 3 karttan 7. günde 9 karta çıkıyor ve yan sistemler ilerlemeye değil takvime bağlı açılıyor.
3. **Güveni bozan kısa yollar:** Önerilen teklif reddedilen rakamı tekrarlıyor, Hazırla'nın kâr tahmini 4 kat sapıyor.
4. **Açıklama ve geri bildirim eksik:** Kokpit metrikleri ve sektör terimleri açıklamasız. Gün sonunda "ne oldu, şimdi ne yapmalı" dersi yok.

---

## TUR 2: Öneri havuzu

Her rol en fazla 2 öneri getirdi. Aynı şeyi söyleyen öneriler birleştirildi (Ö1: GEL ve FUT, Ö9: KRK ve GLR). Sonuçta 14 öneri kaldı.

| No | Öneri (sahibi) | Ne değişir | Neden kavramayı kolaylaştırır | İş | Risk |
|---|---|---|---|---|---|
| **Ö1** | **Kademeli açılış** (GEL + FUT) | Yan sistemler takvim yerine ilerlemeye bağlanır. İlk satışa kadar rayda yalnız Görevler ve Sezon hedefi görünür. Sipariş ve vaka 1. satıştan sonra gelir; emanet ile piyasa nabzı 1. satış ve 3. gün dolunca; galericiler grubu 2. satıştan sonra. **Günde en çok 1 yeni sistem** açılır. Açılan sistem rayda "YENİ" rozetiyle gelir; ilk dokunuşta 3 satırlık tanıtım açılır. | 3. günde 7 sistem yerine en çok 3–4 sistem olur. Her açılış bir başarının ödülü olarak gelir. | Orta | Usta oyuncu ve ikinci kariyer için yavaşlık. Eski kayıtlarla göç uyumu. |
| **Ö2** | **Rehber Hazırla yolunu öğretsin** (GNÇ) | `OGRET` içindeki "tamir" ve "ilan" adımları tek "Hazırla ve ilana koy" adımında birleşir; adım sayısı 8'den 7'ye iner. Alım özetinde "Garaja git", satış sheet'inde "Fiyat ver" / "Kabul et" vurgulanır. | Rehberin en çok dokunuş ve arama gerektiren kısmı kalkar. Oyuncu kısa yolu ilk günden öğrenir. | Küçük | Elle tamir ve ilan dili dersi rehberden çıkar. |
| **Ö3** | **Rehber kartı ve bildirimler çakışmasın** (UX) | Sheet açıkken rehber kartı sheet başlığını örtmez ve toast'lar rehber kartının altına dizilir. "Atla" düğmesi ≥44×44 olur ve onay ister. | Yönerge karar anında okunur hale gelir. | Küçük | CSS'te sheet başlığı, toast ve güvenli alan payları birbirini etkiliyor. |
| **Ö4** | **Önerilen teklif satıcının son sözünü bilsin** (STR) | "Bundan aşağısı yok" ya da karşı teklif varsa önerilen teklif bunu hesaba katar. Öneri tabanın altında kalıyorsa "Kabul et ₺X" vurgulanır ve "almaya değer mi" notu çıkar. Reddedilen tutar ikinci kez gönderilmez. Alım sonrası `moveButtons` hatası da bu işle kapanır. | Kısa yol tutarlı olur. Oyuncu aynı hatayı tekrarlamaz. | Küçük | Öneri pazarlığı fazla kolaylaştırabilir. |
| **Ö5** | **Sade kokpit, ilk satışa kadar** (KRK) | İlk satışa kadar kokpitte yalnız kasa, gün ve stok görünür. İtibar, Sv ve Kira ilk ilgili olayda tek cümlelik açıklamayla belirir. | İlk ekranda anlamı bilinmeyen 4 metrik eksilir. | Küçük | Kira sürprizi: oyuncu sezon sonunda kiranın kesileceğini geç öğrenir. |
| **Ö6** | **Araç sayfası: önce özet, ayrıntı katlanır** (UX) | `openOwnCar` ve pazardaki ilan sayfası önce bir özet bloğu gösterir: değer, hesap ve tek ana düğme. Durum, hasar, ilan metni ve künye "Ayrıntılar ▸" altına katlanır. Sayfa 2,4–3,5 ekrandan ≤1,3 ekrana iner. | Kararı verdiren bilgi ayrılır. | Orta | ARB: ekspertiz ve hasar ayrıntısı arka plana düşer. |
| **Ö7** | **İlk pazarlıklarda sade hamle seti** (FUT) | İlk alımda yalnız ekspertiz kozları ve teklif görünür. Övgü, Peşin, Blöf ve Kalkıp gitme 1. alımdan sonra "yeni hamle açıldı" diye gelir. | Pazarlıktaki 14 düğme 1. alımda yaklaşık 7'ye iner. | Orta | STR: pazarlık derinliği gizlenir; satıcı tipleri ilk alımda anlamsızlaşır. |
| **Ö8** | **"Sıradaki iş" düğmesi** (GNÇ) | Kokpitte her zaman tek bir "Şimdi: …" çipi durur. Garaj ve pazar durumuna göre (`siradakiAdim`) bir sonraki işi açar. | Kaybolan oyuncu tek dokunuşla yönünü bulur. | Orta | Rehberle ve garaj ipucuyla çakışan üçüncü yönlendirme sistemi olur. Oyunu oyun oynar. |
| **Ö9** | **Terim ipuçları** (KRK + GLR) | Tramer, değişen, boyalı, ekspertiz, muhammen, emanet, itibar ve kira ilk göründükleri yerde noktalı alt çizgiyle işaretlenir. Dokununca tek cümlelik açıklama çıkar. Sözlük `i18n` yanında tek tabloda durur. | Gerçek dil korunur, anlam açılır. | Küçük–orta | Ekran kalabalığı artar. Çok yere işaret konabilir. |
| **Ö10** | **Hazırla'da dürüst kâr aralığı** (STR) | Ekspertizsiz araçta onay "Beklenen kâr ~₺72K" yerine aralık gösterir ("₺5K – ₺75K, ekspertizden sonra kesinleşir"). Önce ekspertiz yapılıp kesin rakam gösterilir, onay ondan sonra istenir. | Vaat ile sonuç uyuşur. | Küçük | Onaya bir adım eklenebilir. |
| **Ö11** | **İlk gün "ilk iş" ilanı** (GEL) | 1. gün pazarında bütçeye uyan, hafif kusurlu ve kârlı bir ilan garanti edilir ("İlk iş için uygun" rozeti). Rehberin 1. adımı listenin ilk kartını değil bu ilanı vurgular. | İlk alım kesin kârlı ve öğretici olur. | Küçük | GLR: gerçekçilik; her kariyerde aynı his. |
| **Ö12** | **3B gezde ilk giriş ipucu** (ARB) | 3B gez ilk açıldığında tek seferlik bir üst yazı çıkar: "Araca dokun = dosyası · Liste = geri dön · sürükle = bak". | 1.0'daki "çıkamıyorum" deneyimi tekrarlanmaz. | Küçük | Az. |
| **Ö13** | **Kartta ekspertiz özet şeridi** (ARB) | Garaj ve pazar kartında motor, şanzıman, kaporta ve elektrik için 4 renkli küçük şerit (yeşil/sarı/kırmızı/gri = bilinmiyor) gösterilir. | Ayrıntı silinmeden tek bakışta okunur. | Orta | Kart yüksekliği ve v3'te sınırlanan ilk ekran ölçütü (ilk kart ≤400px). |
| **Ö14** | **Gün sonu "usta notu"** (GLR) | İlk 7 günde ya da ilk 3 satışa kadar gün raporunda tek cümlelik bir ders ve tek düğme çıkar ("İlan piyasanın %9 üstünde; alıcı az. ₺X'e kırarsan…" → `cutto`). Kurallar öncelik sırasıyla seçilir. | Neden-sonuç bağı kurulur, boş günler derse dönüşür. | Küçük–orta | GNÇ: kapatılan pencereye bir metin daha eklenir. |

---

## TUR 3: Tartışma (ayrışmalar)

### 1. Derinliği gizlemek mi, kademeli açmak mı? (Ö1, Ö5, Ö6, Ö7)
- **STR:** Ö7'ye karşıyım. Pazarlıkta Blöf ve Kalkıp gitme kartlarını saklarsak ilk alımda satıcı tipinin hiçbir anlamı kalmaz; oyun "teklif ver, kabul" oyununa döner. Ö1'e de soğuğum. Sipariş ve emanet oyunun ekonomisini yatay genişletiyor; geç gelirlerse usta oyuncu ilk haftada sıkılır.
- **FUT:** Saklamak değil, sıraya koymak. FM'de de ilk sezonda bütün menüler orada ama sana bir anda bütün e-postalar gelmiyor. Ö1'de hiçbir sistem silinmiyor, yalnız "ilk satıştan sonra" geliyor. 2. kariyer ve Ayarlar için "hepsi açık" anahtarı olsun.
- **GEL:** Ö1'i destekliyorum, Ö7'yi değil. Ö7 pazarlık motoruna dokunuyor (`moveButtons`, `doMove`). Ö1 ise yalnız raya ve üretim kapılarına dokunuyor: `bugunKartlari`, `KANCA.ray` kayıtları, `nextDay` içindeki sipariş ve emanet üretimi. Daha ucuz ve daha az riskli.
- **ARB:** Ö6 benim için tehlikeli. "Ayrıntılar ▸" altına giren bölüm hiç açılmaz; ekspertiz raporu oyunun kalbi. Ö13 gibi ayrıntıyı **özetleyen** çözümler bence doğru yol.
- **UX:** ARB haklı olabilir, ama 3,5 ekranlık sayfa da ölçülebilir bir sorun. Ö6 kazanmazsa en azından Ö2 oyuncuyu bu sayfadan geçirmeden ilana götürsün.
- **KRK:** Ö5 küçük ve net bir iş: ilk ekranda "Kira 7K/110K" yazısını gören 40 yaşındaki adam "borçlu muyum?" diye düşünür.
- **GLR:** Kirayı gizlemek gerçekçi değil. Dükkânı açan ilk gün kirayı bilir. Gizleyelim değil, açıklayalım (Ö9).

### 2. Zorunlu rehber mi, atlanabilir mi? (Ö2, Ö3, Ö8)
- **GNÇ:** Atlanabilir kalsın, ama kısa olsun. Rehber Hazırla'yı göstersin, 19 dokunuş 15'in altına insin. Ben Ö8'i de istiyorum: kaybolunca bir düğme olsun.
- **GEL:** Ö8'e veto düşünüyorum. Garajda zaten `siradakiAdim` rozeti, `.garaj-ipucu` ve rehber var. Üçüncü bir yönlendirme kokpite bir öğe daha ekler ve UX'in 29 öğe şikâyetini büyütür.
- **STR:** Ö8 oyunu oyunun yerine oynar. "Şimdi: Hazırla" → "Şimdi: Günü bitir" → "Şimdi: Kabul et" zincirinde karar yok.
- **UX:** Atlanabilir rehber doğru. Ancak "Atla" düğmesi 40×20px ve kazara basılıyor. Ö3'te ≥44px ve "₺30.000 ikramiye kaybolur, emin misin?" onayı istiyorum.
- **KRK:** Zorunlu olmasın, ama göründüğü an okunabilir olsun. Toast'un rehber metnini örttüğünü ekran görüntüsünde gördük.

### 3. Gerçekçilik mi, hız mı? (GLR ve GNÇ: Ö11, Ö14, Ö9)
- **GLR:** Ö11'deki "garantili kârlı ilan" kâğıt üstünde iyi, ama piyasada sana kimse kârlı araç hazırlamaz. Rozet varsa "tanıdık galericiden" bir hikâyesi olsun. Ö14 ise gerçek: akşam çay içerken usta ne yanlış yaptığını söyler.
- **GNÇ:** Gün raporunu zaten 3 kez okumadan kapattım. Bir cümle daha eklenirse onu da okumam. Ö14'e vetom var, yalnız "tek cümle ve tek düğme" şartı yazılırsa razıyım.
- **FUT:** Ö14 FM'deki asistan raporu gibi. Kısa olursa okunur ve boş günlere bir anlam katar. GNÇ'nin şartı makul: ≤140 karakter ve rakam içeren tek bir eylem.
- **STR:** Ö14'ü bu yüzden destekliyorum: oyuncuya neden-sonuç öğretir, derinliği saklamaz, açar.
- **ARB:** Ö9'u destekliyorum, terim açıklaması araca saygıdır. Ö11'de rozet gerçekçi bir sebebe bağlanırsa sorun yok.

### 4. Güven: kısa yollar tutarlı mı? (Ö4, Ö10)
- **STR:** Ö4 küçük ve doğrudan "anlamıyorum" hissini kesiyor. Önerilen teklif ₺731.500'ü iki kez önerdi, satıcı iki kez "₺747.500, aşağısı yok" dedi.
- **KRK:** Ö10 da önemli. ₺72K kâr yazıp ₺18K vermek mantıksız. Ama Ö4 kadar acil değil.
- **GEL:** Ö4'te iki hata da kapanır (`moveButtons` satıcısız araç). Az iş, çok etki.

---

## TUR 4: Oylama 1. Eleme (5-4-3-2-1)

Her rol 5 öneriye 5, 4, 3, 2 ve 1 puan verdi, yani her rol 15 puan dağıttı. Toplam 120 puan.

| Rol | Ö1 | Ö2 | Ö3 | Ö4 | Ö5 | Ö6 | Ö7 | Ö8 | Ö9 | Ö10 | Ö11 | Ö12 | Ö13 | Ö14 | Σ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GEL | 5 | 4 | 3 | 1 | | | | | | | 2 | | | | 15 |
| UX | 2 | 5 | 4 | | | 3 | | 1 | | | | | | | 15 |
| STR | | 3 | | 5 | | | | | 1 | 4 | | | | 2 | 15 |
| FUT | 5 | 1 | | | | | 4 | 3 | | | | | | 2 | 15 |
| GNÇ | 3 | 5 | 1 | | 2 | | | 4 | | | | | | | 15 |
| KRK | | | 3 | 1 | 5 | 2 | | | 4 | | | | | | 15 |
| ARB | | 1 | | 2 | | | | | 3 | | | 4 | 5 | | 15 |
| GLR | 1 | | | | | | | | 3 | 4 | 2 | | | 5 | 15 |
| **Toplam** | **16** | **19** | **11** | **9** | 7 | 5 | 4 | **8** | **11** | **8** | 4 | 4 | 5 | **9** | **120** |

**Sıralama:** Ö2 (19), Ö1 (16), Ö3 (11), Ö9 (11), Ö4 (9), Ö14 (9), Ö8 (8), Ö10 (8) → **finale kalan 8 öneri**.
Elenenler: Ö5 (7), Ö6 (5), Ö13 (5), Ö7 (4), Ö11 (4), Ö12 (4).

Oy gerekçeleri (kısa):
- **GEL:** Puanı maliyete göre dağıttı: Ö1 en yüksek etki, Ö2 ve Ö3 küçük iş. Kendi önerisi Ö11'e 2 verdi, "Ö1 varsa ilk iş ilanı ikincil" dedi.
- **UX:** Ölçülebilir akış önerilerine verdi: Ö2 (dokunuş sayısı), Ö3 (çakışma), Ö6 (sayfa uzunluğu).
- **STR:** Derinliği koruyan ve tutarlılığı artıran önerilere verdi (Ö4, Ö10, Ö14). Ö1 ve Ö7'ye puan vermedi.
- **FUT:** Kademeli açılmaya verdi (Ö1, Ö7), asistan raporu benzeri Ö14'e 2.
- **GNÇ:** Hıza verdi: Ö2, Ö8, Ö1. Ö5'e "ilk ekran sade" diye 2.
- **KRK:** Okunabilirliğe verdi: Ö5, Ö9, Ö3, Ö6. Ö4'e "mantık tutarlılığı" diye 1.
- **ARB:** Araç detayını özetleyen ya da koruyan önerilere verdi (Ö13, Ö12, Ö9). Ö6'ya puan vermedi.
- **GLR:** Gerçekçi ders ve dile verdi (Ö14, Ö10, Ö9). Ö11'e şartlı 2, Ö1'e 1.

---

## TUR 5: Oylama 2. Final (mutlaka = 2 / olsa iyi = 1 / gerek yok = 0, rol başına 1 veto)

| Rol | Ö2 | Ö1 | Ö3 | Ö9 | Ö4 | Ö14 | Ö8 | Ö10 | Σ | Veto |
|---|---|---|---|---|---|---|---|---|---|---|
| GEL | 2 | 2 | 2 | 0 | 1 | 1 | 0 | 1 | 9 | **Ö8** |
| UX | 2 | 2 | 2 | 1 | 1 | 0 | 1 | 1 | 10 | yok |
| STR | 1 | 0 | 1 | 1 | 2 | 2 | 0 | 2 | 9 | **Ö8** |
| FUT | 2 | 2 | 1 | 0 | 1 | 2 | 1 | 0 | 9 | yok |
| GNÇ | 2 | 2 | 2 | 0 | 1 | 0 | 2 | 0 | 9 | **Ö14** |
| KRK | 2 | 1 | 2 | 2 | 2 | 1 | 0 | 1 | 11 | yok |
| ARB | 1 | 1 | 1 | 2 | 1 | 2 | 0 | 1 | 9 | yok |
| GLR | 1 | 1 | 1 | 2 | 2 | 2 | 0 | 2 | 11 | yok |
| **Toplam** | **13** | **11** | **12** | 8 | **11** | **10** | 4 | 8 | **77** | |
| Veto sayısı | 0 | 0 | 0 | 0 | 0 | 1 | **2 → elendi** | 0 | | |

**Veto gerekçeleri**
- **GEL → Ö8:** "Garajda `siradakiAdim` rozeti, `.garaj-ipucu` ve rehber zaten var. Üçüncü yönlendirme kokpite öğe ekler; ilk ekrandaki 29 öğeyi azaltmak varken artırırız. Orta iş, düşük ek etki."
- **STR → Ö8:** "Tek düğmeli 'Şimdi:' zinciri karar bırakmaz. Oyuncu oyunu öğrenmez, düğmeyi takip eder. Kavramayı değil ezberi kolaylaştırır."
- **GNÇ → Ö14:** "Gün raporunu okumadan kapatıyorum, bir metin daha istemem." Tek veto olduğu için öneriyi elemedi. GNÇ'nin şartı (tek cümle, ≤140 karakter, tek düğme, kapat düğmesi yerinde) kabul ölçütüne yazıldı.

**Sıralama:** Ö2 (13), Ö3 (12), Ö1 (11), Ö4 (11), Ö14 (10) | Ö9 (8), Ö10 (8) | Ö8 (4, veto ile elendi).

**Eşitlik (Ö1 ve Ö4, 11 puan):** Kural gereği etki/iş oranına bakıldı. Etki 1–3, iş 1–3 (küçük = 1, orta = 2). Ö4: etki 2 / iş 1 = **2,0**. Ö1: etki 3 / iş 2 = **1,5**. Sırada Ö4 üstte. Moderatör notu: Ö1 tek başına en büyük etkili iş. Sıra uygulama önceliğini değil oyun sonucunu gösteriyor; Ö4 küçük olduğu için Ö1'den önce bitmesi zaten doğal.

---

## SONUÇ: Seçilen 5 öneri (öncelik sırasıyla)

### 1. Rehber Hazırla yolunu öğretsin ve her adımda bir hedef vurgulasın (Ö2) **13 puan**
- **Kural / davranış:**
  - `OGRET` 8 adımdan **7 adıma** iner: ilan aç → ekspertiz → pazarlığı başlat → al → **hazırla** → günü bitir → teklifi değerlendir. "tamir" ve "ilan" adımları kalkar.
  - Yeni "hazırla" adımı: `sekme:"garaj"`, `sec:'.garaj-ipucu [data-act="hazirla"]'`, ardından onay penceresinde `[data-act="onayevet"]`. Tamamlanma koşulu `S.cars.some(c=>c.listPrice)`. Alt metin: "Ekspertiz, kârlı tamir ve ilan tek dokunuşta. İnce ayar aracın sayfasında."
  - "al" adımından sonra sheet açıksa vurgu alttaki sekmeye değil **alım özetindeki "Garaja git"** (`alimgit`) düğmesine gider.
  - "sat" adımında `sec` sırayla `[data-act="salenego"]`, sonra satış sheet'inde `[data-act="saleaccept"]` (varsa), yoksa `[data-act="saleoffer"]` olur.
  - Kural: **rehber görünürken vurgulu bir hedefin bulunmadığı an olmaz.** Hedef DOM'da yoksa kart "Araca dokun" gibi bir ara adım gösterir ve aracın kartını vurgular.
  - Rehber bittiğinde tek seferlik bir toast: "Elle tamir, ilan dili ve sunum aracın sayfasında: en iyi kâr orada." (STR ve ARB'nin şartı.)
- **Dokunulacak yer:** `oyun/rehber.js` (`OGRET`, `ogretCiz` seçici dizisi desteği), `oyun/ui.js` (`viewGaraj` `.garaj-ipucu`; alım özeti `alimgit`), `oyun/test/tut.js` (7 adıma göre güncelle).
- **Kabul ölçütü:**
  - (a) 390×844'te sıfır kayıtla, yalnız `.ogret-isik` öğesine ve onay düğmesine dokunan betik **ilk satışı ≤15 dokunuşta** yapar (bugün 19).
  - (b) Rehberin her adımında `document.querySelector('.ogret-isik')` dolu (bugün 3 adımda boş).
  - (c) Rehberle kurulan ilk ilanda `listPrice ≥ carCost×1.03` (Hazırla'nın önerdiği fiyat; bugün bir koşuda +%0,3).
  - (d) `node test/tut.js` geçer.
- **Kim karşı çıktı:** STR (final 1) ve ARB (final 1). İkisi de karşı değil ama çekinceli: "Elle tamir ve ilan dili rehberden çıkarsa en kârlı yol hiç öğrenilmez." Rehber sonu toast'u bu yüzden eklendi.

### 2. Rehber kartı ve bildirimler çakışmasın (Ö3) **12 puan**
- **Kural / davranış:**
  - Sheet açıkken (`#ogret.ust`) rehber kartı sheet başlığının **üstüne değil altına** yerleşir: sheet'in `padding-top` değeri rehber kartının yüksekliği kadar artar.
  - `body.ogret-ac` iken toast kuyruğu rehber kartının alt kenarının 8px altından başlar. Rehber açıkken toast süresi en fazla 2,5 sn olur.
  - Rehber başlığı en az 15px, alt metni en az 13px olur.
  - "Atla" en az 44×44px olur ve onay ister: "Rehberi atlarsan ₺30.000 ikramiye gider. Atla / Devam".
- **Dokunulacak yer:** `oyun/shell.html` (`#ogret`, `#ogret.ust`, `#ogret .atla`, toast kabı), `oyun/rehber.js` `ogretCiz` (kart yüksekliğini bir CSS değişkenine yazar), `oyun/ui.js` `toast()` / `toastSiradaki()`.
- **Kabul ölçütü:**
  - (a) Rehberin 7 adımının her birinde ve o adımı tetikleyen eylemden 300 ms sonra `#ogret .bas` ile hiçbir `.toast` öğesinin dikdörtgeni kesişmez (kesişim alanı 0). Ayrıca `#ogret` ile `.sheet-title` kesişmez.
  - (b) `elementFromPoint` ile `#ogret .bas` merkezine bakıldığında `#ogret` içinde bir öğe döner.
  - (c) `.atla` için `getBoundingClientRect()` en az 44×44.
  - Bugün başarısız olan durumlar: `05-pazarlik.png`, `06-alim-sonrasi.png`, `10-satis-sonrasi.png`.
- **Kim karşı çıktı:** Kimse 0 vermedi. FUT, STR, ARB ve GLR "olsa iyi" (1) dedi: "İyi bir iş, ama tek başına kavramayı çözmez."

### 3. Önerilen teklif satıcının son sözünü bilsin (Ö4) **11 puan** (eşitlikte etki/iş oranı 2,0 ile üstte)
- **Kural / davranış:**
  - Pazarlıkta `n.tabanSoz` (satıcının "aşağısı yok" rakamı) ya da `n.counter` varsa:
    - `onerilenTeklif(c) ≥ tabanSoz` ise önerilen tutar `tabanSoz` olur ve "Kabul et ₺X" düğmesi birincil renge geçer.
    - `onerilenTeklif(c) < tabanSoz` ise girdiye öneri yazılmaz. Yerine şu not çıkar: "Satıcı ₺X'in altına inmiyor. Önerilen tavanın ₺Y: bu fiyatta kâr payı ~%Z." Kâr payı %5'ten azsa "vazgeçmek mantıklı" yazar.
  - Son reddedilen tutar girdide aynen duruyorsa "Teklif ver" pasif olur ve "Bu rakamı reddetti" etiketi gösterir.
  - `moveButtons()` satıcısı silinmiş araçta (`c.seller` null) çalışmaz. `renderNeg` içindeki yedek satıcıyı kullanır ya da alım bittiyse boş döner.
- **Dokunulacak yer:** `oyun/kolay.js` (`onerilenTeklif`), `oyun/ui.js` (`renderNeg`, `oneriteklif` eylemi, `doOffer`, `moveButtons`).
- **Kabul ölçütü:**
  - (a) Birim testi: 50 tohumlu pazarlıkta yalnız "önerilen teklif + teklif ver" kullanan betik **aynı tutarı arka arkaya iki kez göndermez**.
  - (b) Bu 50 pazarlığın en az %90'ı **≤4 dokunuşta** alımla ya da bilinçli vazgeçmeyle biter. Satıcının masadan kalkması bunu karşılamaz.
  - (c) Alım sonrası sayfa hatası 0 (`pageerror` dinleyicisi).
  - (d) `node test/v3-test.js` pazarlık bölümü geçer.
- **Kim karşı çıktı:** Kimse 0 vermedi. GEL, UX, FUT, GNÇ ve ARB "olsa iyi" (1) dedi. GNÇ'nin notu: "Kabul et zaten vardı, bunu görmeyen benim."

### 4. Kademeli açılış: yan sistemler ilerlemeyle, günde en çok bir tane (Ö1) **11 puan**
- **Kural / davranış:** Açılış takvimi aşağıdaki tabloda. Koşullar "ve" ile bağlı.

  | Sistem | Açılma koşulu |
  |---|---|
  | Günün görevleri, Sezon hedefi | 1. gün (bugünkü gibi) |
  | Günün vakası | `S.stats.sold ≥ 1` |
  | Sipariş (`S.orders` üretimi) | `sold ≥ 1` |
  | Emanet teklifi (`S.konsTeklif`) | `sold ≥ 1` ve `day ≥ 3` |
  | Piyasa nabzı | `sold ≥ 1` ve `day ≥ 3` |
  | Galericiler grubu | `sold ≥ 2` |
  | Toptan parti | `sold ≥ 2` |
  | Müzayede, Galeri sekmeleri | Değişmez (4. ve 12. gün) |

  - Koşulu sağlanan sistemlerden **günde en çok 1 tanesi** açılır.
  - Açılan sistem rayda ilk kez "YENİ" rozetiyle görünür. İlk dokunuşta 3 satırlık bir tanıtım (`openBilgi`) açılır: ne, neden, tek düğme.
  - Açılan sistemler `S.acilan` içinde tutulur.
  - Göç (`gocEt`): `sold ≥ 1` olan eski kayıtta bütün sistemler açık sayılır.
  - `prestij > 0` (ikinci kariyer) ya da Ayarlar'daki "Bütün sistemler baştan açık" anahtarı kademeyi kapatır (STR'nin şartı).
- **Dokunulacak yer:**
  - `oyun/ui.js`: `bugunKartlari`, `nextDay` içindeki sipariş ve emanet üretimi, `viewAyar` anahtarı, `gocEt`.
  - `oyun/kanca.js`: tek kapı fonksiyonu `acikMi(sistem)`. Kancalar kendi kartını döndürmeden önce bunu sorar.
  - `oyun/grup.js` ve `oyun/piyasa.js`: `KANCA.ray` kayıtlarına `acikMi` koşulu.
  - `oyun/konsinye.js`.
- **Kabul ölçütü:**
  - (a) `olc3.js` benzeri betikte (satışsız oyuncu) BUGÜN rayı 1.–3. günde **≤3 kart**, 7. günde ≤4 kart (bugün 3 → 5 → 7 → 9).
  - (b) 1. gün satış yapan oyuncuda 2.–7. günlerde her gün en çok 1 "YENİ" rozet görünür. 7. günde ray ≤6 kart.
  - (c) İlk satıştan önce `S.orders.length===0` ve `S.konsTeklif==null`.
  - (d) Eski kayıt (`test/goc-test.js`) açıldığında bütün sistemler görünür.
  - (e) `node test/ux-test.js` 13. bölüm (ölü düğme) ve yan sistem bölümleri geçer. Testler ya Ayarlar anahtarını açar ya da `sold ≥ 2` durumunda başlar.
- **Kim karşı çıktı:** STR (final 0): "Usta oyuncu ilk haftada sıkılır, ekonomi yatay genişlemeden çalışmaz." Ayarlar anahtarı ve ikinci kariyer istisnası bu itiraza karşılık eklendi; STR veto kullanmadı. KRK, ARB ve GLR "olsa iyi" (1) dedi. GLR'nin notu: "Gerçek galeride ilk gün de sipariş gelir."

### 5. Gün sonu "usta notu": tek cümle, tek düğme (Ö14) **10 puan**
- **Kural / davranış:**
  - İlk 7 oyun günü boyunca ya da `sold < 3` iken, `openReport()` raporun en üstüne **tek bir** `.usta-not` satırı koyar. Satır en fazla 140 karakterdir, en az bir rakam içerir, yanında tek bir eylem düğmesi vardır.
  - Kural önceliği:
    1. Teklif gelmedi ve `daysListed ≥ 2` → "İlan piyasanın %X üstünde, alıcı az geliyor." [₺Y'ye indir] (`cutto`)
    2. Gelen teklif maliyetin altında → "Teklif maliyetinin ₺X altında; pazarlıkta kozlarını kullan." [Teklife git]
    3. Stok boş ve bütçeye uyan ilan var → "Bütçene uyan N ilan var." [Pazar · Bütçeme uygun] (`filter`)
    4. Ekspertizsiz araç bekliyor → "Ekspertizsiz araç satılmaz: önce Hazırla." [Hazırla]
    5. Hiçbiri yoksa satır gösterilmez.
  - Kapat düğmesi yerinde kalır. Ayarlar'da "Usta notları" anahtarı vardır.
  - Konuşan karakter mevcut tanıdık **Kaportacı Nuri**'dir (`CONTACTS`), yeni karakter eklenmez.
- **Dokunulacak yer:** `oyun/ui.js` (`openReport`, `viewAyar`). Kural fonksiyonu `ustaNotu(rep)` `oyun/gunlukritim.js` içinde (önek kuralına uygun ad, `cakismaKontrol` için yeni üst düzey ad tek). Biçim için `oyun/shell.html` içinde `.usta-not`.
- **Kabul ölçütü:**
  - (a) Birim testi: 4 kural durumunun her biri doğru metni ve doğru `data-act` değerini üretir. Hiçbir durum yoksa `.usta-not` yoktur.
  - (b) B senaryosunda (`olc2.js`) 2.–4. günlerin raporlarında `.usta-not` görünür ve düğmesi `cutto`'dur.
  - (c) Rapor kelime sayısı en fazla 25 kelime artar (GNÇ'nin şartı).
  - (d) 8. günden sonra ya da 3. satıştan sonra `.usta-not` yoktur.
- **Kim karşı çıktı:** GNÇ veto etti: "Okumadığım pencereye bir metin daha." Tek veto olduğu için öneri elenmedi; GNÇ'nin şartları ölçüte yazıldı. UX final 0 verdi: "Rapor zaten 3 kez okunmadan kapatılıyor; etkisini ölçmek zor." UX, ölçüt (b) ve (c) ile tatmin oldu.

**Beklenen birleşik etki:** Ö2, Ö3 ve Ö4 rehberi izleyen oyuncuyu 19 yerine ≤15 dokunuşta ilk satışa götürür, yönerge her an okunur ve kısa yollar birbiriyle çelişmez. Ö1 sonraki günlerin yoğunluğunu ilerlemeye bağlar. Ö14, Ö1'in bıraktığı boş günleri derse çevirir.

---

## Elenenler ve neden elendikleri

| No | Öneri | Nerede elendi | Neden |
|---|---|---|---|
| Ö8 | "Sıradaki iş" düğmesi | Final, 4 puan, **2 veto** (GEL, STR) | Mevcut rehber, garaj ipucu ve `siradakiAdim` ile çakışan üçüncü yönlendirme. Kokpite öğe ekliyor. Karar bırakmıyor. |
| Ö9 | Terim ipuçları | Final, 8 puan (6.) | KRK, ARB ve GLR "mutlaka" dedi, ama GEL, FUT ve GNÇ 0 verdi. Ö10 ile 8'de eşit kaldı, ilk 5'e giremedi. **Bir sonraki tur için ilk aday.** Küçük iş, Ö1'in "YENİ" tanıtımlarıyla aynı sözlüğü kullanabilir. |
| Ö10 | Hazırla'da dürüst kâr aralığı | Final, 8 puan (7.) | STR ve GLR "mutlaka" dedi, FUT ve GNÇ 0 verdi. Ö4 tutarlılık ihtiyacının bir kısmını karşılıyor. Küçük bir metin işi olarak v3 kararı 7 (rakam ve metin doğruluğu paketi) altında ele alınabilir. |
| Ö5 | Sade kokpit | Tur 4, 7 puan (9.) | Yalnız KRK ve GNÇ'den puan aldı. GLR "kirayı gizlemek gerçekçi değil" dedi. Açıklama ihtiyacı Ö9'a, yoğunluk kaygısı Ö1'e kaldı. |
| Ö6 | Araç sayfası özet + katlanır ayrıntı | Tur 4, 5 puan | ARB ve STR ekspertiz ayrıntısının gömülmesinden korktu. Ö2, oyuncuyu bu sayfadan geçirmeden ilana götürdüğü için ihtiyaç azaldı. Sayfa uzunluğu (3,5 ekran) kayıtta kalsın. |
| Ö13 | Kartta ekspertiz özet şeridi | Tur 4, 5 puan | Yalnız ARB destekledi. Kart yüksekliği v3'teki "ilk kart ≤400px" ölçütüyle çatışıyor. |
| Ö7 | İlk pazarlıklarda sade hamle seti | Tur 4, 4 puan | STR derinlik kaybı dedi, GEL pazarlık motoru riski dedi. Yalnız FUT puan verdi. |
| Ö11 | İlk gün "ilk iş" ilanı | Tur 4, 4 puan | GLR gerçekçilik kaygısıyla yalnız 2 verdi. Ö1 ve Ö2 ilk dakikayı zaten sadeleştiriyor. |
| Ö12 | 3B gezde ilk giriş ipucu | Tur 4, 4 puan | 1.0.1'deki dokunma düzeltmesi asıl sorunu çözdü. Küçük olduğu için Ö3 ile aynı oturumda "fırsat varsa" yapılabilir. |

## Yan bulgular (oylamaya girmedi, kayda geçti)

- `ui.js` `finishSale()` → `setTimeout` → `finishSaleAfter()`: Kabulden hemen sonra × (`saleclose`) basılırsa `S.sale` null olur ve `S.sale.oid` hatası çıkar. Çözüm: `finishSaleAfter` başında `if(!S.sale) return;`, ya da gecikme sırasında `saleclose` yok sayılır.
- `ui.js` `moveButtons()`: Alım sonrası `c.seller` null olduğu için `c.seller.sert` okunurken hata veriyor. Ö4'ün kapsamına alındı.
