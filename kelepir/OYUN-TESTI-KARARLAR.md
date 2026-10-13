# Kelepir v2: Ekip tartışması ve "MUTLAKA DEĞİŞMESİ GEREKENLER"

**Katılımcılar:** Oyun geliştirici (GEL), UX tasarımcısı (UX), Stratejist (STR), Futbol meraklısı / FM oyuncusu (FUT), 20 yaşında oyuncu (GNÇ), 40 yaşında oyuncu (KRK)
**Moderatör notu:** Altı rapor baştan sona okundu. GNÇ'nin raporunda "Geliştirilmesi gerekenler" bölümü yok ("aşağıdaki mesajda" yazıyor, dosyada bulunmuyor). Onun görüşleri canlı notlarından derlendi.
**Zaten düzeltildiği için gündem dışı:** müzayedede "Zarfları aç" çökmesi (S.rivals/RIVAL_DEFS indeks hatası; GEL, FUT ve KRK bunu KRİTİK olarak raporlamıştı) ile 3B vitrindeki araç değiştirme ve logo sorunları.
**Kod incelemesi:** Yalnızca okundu, hiçbir dosya değiştirilmedi. Kararlardaki dosya ve fonksiyon adları `/home/user/TradingAgents/kelepir/oyun/` altındaki kaynak dosyalara göredir.

---

## TUR 1: Gündem (tekilleştirilmiş bulgular)

Kısaltmalar: GEL, UX, STR, FUT, GNÇ, KRK. "Kanıt" sütununda raporlardaki somut örnekler yer alıyor.

### A. Ekonomi ve pazarlık

| # | Konu | Raporlayan | Kanıt (raporlardan) | Kod tespiti |
|---|---|---|---|---|
| A1 | **Karşı teklif mantığı tutarsız.** Monoton değil, "altına inmem" bağlayıcı değil, alıcı oyuncunun istediğinden fazlasını öneriyor, satışta karşı teklif açılış teklifinin altına iniyor. | **6/6** | Alışta: Daewon 520K→641,5K, 590K→602,5K. Şahan 150K→206K, 168K→197K. Longwei 829K→806,5K (GEL). Honzo'da "altına inmem 1.471K" denip 1.313K'ya inildi (STR). Bozkurt'ta "804K aşağısı yok" denip 792,5K'ya inildi (KRK). Satışta alıcı talebin üstüne çıkıyor: Daewon 698K→"708,5K" (GEL), NV200 655K→671,5K (STR), Logana 545K→554,5K (FUT), Weibo 795K→801K (GNÇ), Sakuda ilan 1,268M→1,284M (UX). Satışta açılışın altına iniyor: Kodak 1,853M→1,7195M (GEL), toptancı 630K→575,5K (STR), Trax 768K→704,5K→683,5K, Dastan 387K→367K (KRK), Egeo 770,5K→717K (GNÇ). FUT ise açılışın altına inmeyi "iyi ceza" olarak görüyor. | `game.js` `sellerReply()`: karşı teklif her turda `er*rnd(1.0,1.04)` / `er*rnd(1.05,1.12)` ile rastgele seçiliyor, yani monoton değil. `game.js` `saleReply()`: `price<=tavan` olduğunda karşı teklif `(price+tavan)/2` oluyor, bu da **oyuncunun istediğinden yüksek**. `price>tavan` olduğunda `tavan*rnd(.93,1.0)` oluyor ve bu değer açılışın altına düşebiliyor. |
| A2 | **Alış pazarlığı çok cömert.** İlk teklif hemen kabul ediliyor, yaklaşık %20 indirim garanti, "masada ne kaldı" bilgisi verilmiyor. | 6/6 (GNÇ "sıkılırım" çekincesiyle) | 3 alımın hepsinde yaklaşık %20 indirim (GEL). NV200 ve Fabian'da -%12 ilk teklifte kabul edildi (STR). 3 alımın 3'ü ilk teklifte kabul edildi; Weibo değeri ₺746K iken ₺540K'ya alındı (FUT). Tek hamlede -%22 (GNÇ). Atego -%21, Dastan -%15 (KRK). Sabır 3/3 iken hiç düşmedi (UX, KRK). "Acil nakit" satıcı ilk teklifin %76'sını kabul ediyor (GEL). | `game.js` `effReserve()`: kozlar rezervi **%30'a kadar** düşürüyor (Gerçekçi modda %24). `SELLERS` tablosunda acil res=0,78, acemi res=0,80. Bu ikisi üst üste binince rezerv piyasa değerinin yaklaşık %55-65'ine iniyor. |
| A3 | **"Önerilen tavan" çözümü hazır veriyor.** Ayrıca istenen fiyatın üstüne çıkabiliyor. | 6/6 (değerlendirmeler farklı) | ₺1.060.500 önerisi istenen ₺1.020.000'ün üstündeydi ve uyarısız satın alındı (UX). "Önerilen tavan" ile fiilen anlaşılan fiyat arasında %10'dan fazla fark var (STR). FUT bunun yalnızca kolay modda olmasını istiyor. KRK ve GNÇ ipucunu seviyor. | `kolay.js` `onerilenTeklif()` isteneni sınırlamıyor (`c.ask` ile min alınmıyor). `ui.js` `doOffer()` içinde teklif > `c.ask` kontrolü yok. |
| A4 | **Sipariş ekonomisi.** Ödül aşırı yüksek, üstelik hesap açıklanmıyor. | 4 (GEL, STR, FUT, GNÇ) | Honzo 1,33M→1,771M, piyasanın %33 üstü, +₺441K (STR). Longwei piyasanın %38 üstü, +₺451K (GEL). Buna karşılık kart "Bütçe+prim ₺908,5K" diyor ama teslim ₺712K'ya oldu (FUT). "₺743,5K" yazıyor, ödeme "₺601,5K" (GNÇ). | `game.js` `genOrder()`: `butce = taban*rnd(1.20,1.42)`. `ui.js` `orderQuality()` ödemeyi `butce+prim` olarak yapıyor; kalite düşükse `butce*0.94` veya `*0.85` uyguluyor ve bunun nedeni kartta yazmıyor. |
| A5 | **Sezon hedefi ve ilerleme eğrisi.** Normal modda hedef çok kolay. | 5 (GEL, STR, KRK, GNÇ, FUT karşı örnek) | ₺350K hedef 3. günde geçildi, 7. günde %364'e ulaştı (GEL). 5. günde %206 (STR). 6. günde %60 (KRK). Tek satış hedefin %29'u (GNÇ). **Karşı örnek:** FUT ₺315K ile hedefi kaçırdı. GEL'in Gerçekçi modda büyümesi de yavaş. | `yangorev.js` `HEDEF={kiraKat:3.2, taban:250000, artis:1.10}`. İlk sezonda hedef oyuncunun performansından bağımsız. |
| A6 | **Ekspertiz bedeli karar yaratmıyor.** | 5 (GEL, UX, STR, GNÇ, KRK) | GEL ekspertizi "bedava" gördü (8 araca 8 saniyede yaptı). UX ve STR'ye göre sabit ₺2.500 "zorunlu sürtünme". GNÇ'ye göre etiket "bedava" yazıyor ama ₺2.500 düşüyor. **KRK'ye göre ₺2.500 gerçekçi ve iyi.** Hızlı bakış (₺850) hiç mantıklı değil (UX, GEL). | `ui.js` `eksperFiyat()` Hakan'ın seviyesine göre ₺2.500 ile ₺1.200 arasında. Ekspertiz yalnızca **Günün fırsatı** aracında bedava (`c.gunun`). GEL ile GNÇ'nin gördüğü "bedava", o günün fırsat aracıydı; etiket öbür araçlarda doğru. |
| A7 | **Dürüstsüzlük kumarı.** Ödül büyük, ceza zayıf, ilan dili açıklaması sonuçla çelişiyor. | 4 (GEL, FUT, KRK, UX) | Kodak dürüst satışta +₺377K; abartılı ilanla hedef +₺1,18M, yakalanınca yalnızca itibar -4 (GEL). "Muğlak: sorarlarsa söylersin" deniyor, ama soran olmadan galerici yakaladı (FUT). "Kusurları bilmeyen alıcıya ₺1,75M" bir dolandırma teşviki (KRK) ve açıklaması yok (UX). | `game.js` `makeBuyer()`: yakalanınca %68/%55 ihtimalle alıcı yürüyüp gidiyor. Para cezası ya da ilan cezası yok. Fiyat kaydırıcısı `av` (kusurların görünmediği değer) değerine kadar çıkıyor. |
| A8 | **Ölü stok baskısı yok, tamir kararı fazla kolay.** | 2 (GEL, STR) | ₺350/gün elde tutma maliyeti, ₺100K'lık kârın yanında önemsiz kalıyor. Berk'te 4 tamirin 4'ü de "kârlı" (GEL). Sitronel 9 gün stokta kaldı ama risk hissi oluşmadı (STR). **Karşı görüş:** KRK ve GNÇ "2 gün teklif gelmedi, sıkıcı" diyor. | |
| A9 | **Takas şeffaflığı.** | 3 (KRK, GNÇ, FUT) | Açılış teklifinin "takaslı" olduğu küçük gri yazıyla gösteriliyor, oyuncu fark etmeden araç alıyor (GNÇ, KRK). "+₺72.400 kâr" kâğıt üstünde kalıyor (KRK). Perrin aynı kartta ₺189-366K, ₺275-339K ve "kâr %72" gösteriyor; gerçek değer ₺201K çıktı (FUT). | |
| A10 | **Rakipler ve lig ulaşılamaz, ödüller küçük.** | 4 (FUT, STR, UX, GNÇ) | Rakipler ₺38-45M, oyuncu ₺3M (FUT, STR, UX). Sezon ligi ödülü kapanışta gösterilmiyor (FUT). Kilometre taşı ödülü ₺600-1.500 (STR). Seviye atlama yalnızca kısa bir toast (UX, GNÇ). | |

### B. Arayüz ve akış

| # | Konu | Raporlayan | Kanıt |
|---|---|---|---|
| B1 | **Pazarlık ekranında alan yetersiz.** Sabit panel ekranın yaklaşık %40'ını kaplıyor, hamleler yatay ve yarım görünüyor, sohbet kesiliyor. | 5 (UX, GEL, STR, FUT, KRK) | Kaydırılabilir alanda ~110-150px kalıyor. 11 hamleden 1,5'i görünüyor. "İSTENEN" bloğu × düğmesiyle çakışıyor (KRK). Satışta karşı teklif gelince hamleler tamamen kayboluyor (UX). |
| B2 | **Toast ve öğretici kartları içeriği örtüyor, ödül anları kayboluyor.** | 6/6 | 3-4 toast SATILDI damgasını kapatıyor (GEL, STR, UX). Öğretici kartı sheet başlığını ve × düğmesini örtüyor (GEL, UX, GNÇ). Görev ödülleri sessizce kasaya giriyor (UX: +₺4.500, KRK: +₺3.000, GNÇ: +₺12,5K, FUT: "kasada satır yok"). Seviye 2 ödülü kısa bir toast olarak geçiyor (GNÇ). |
| B3 | **Günlük gider göstergesi ve nakit akışı tutarsız.** | **6/6** | Üst bar "-₺9.717/gün" gösteriyor, gün sonu raporu "-₺350" (herkes). Kira sezon sonunda toplu kesiliyor ve bu hiçbir yerde yazmıyor (GEL, FUT). Sezon kapanışında +₺150K açıklamasız ekleniyor (GEL). Vergi tabanı belirsiz (FUT). Toast "beklenen kâr ₺102K" derken kart "₺28,8K-98,3K" gösteriyor (UX). Ekspertiz "₺2.000" yazıyor, ₺2.500 düşüyor (KRK). |
| B4 | **Geri dönüşsüz para kayıpları.** | 3 (UX, GNÇ, KRK) + GEL | Teklif istenen fiyatın üstünde kabul edildi, ₺40,5K fazla ödendi (UX). Karşı teklifin üstüne teklif verildi, ₺23,5K fazla ödendi (GEL). **"Galericiye toptan sat" onay sormadı, -₺73K** (GNÇ). Satışta ilan fiyatı üstüne uyarısız fiyat girilebiliyor (KRK). |
| B5 | **Pazar ana ekranı kalabalık.** BUGÜN şeridinde 6-9 yatay kart var, ilanlar ~200px'e sıkışıyor. | 3 (UX, STR, KRK) | Ekranda 2,3 ilan kartı görünüyor. Sipariş (₺259K prim) gibi önemli kartlar sağda kalıyor. |
| B6 | **Renk dili.** Pozitif itibar kırmızı, alım sonrası nakit kırmızı, "İtibar ++1". | 5 (UX, STR, FUT, GNÇ, GEL) | "İtibar +0,8" kırmızı (UX, STR, FUT, GNÇ). "İtibar ++1" (GEL). |
| B7 | **Garaj yanlış alt sekmede açılıyor; "Hazırla" onayındaki "Vazgeç" tüm sayfayı kapatıyor; "Günü bitir" bazı sekmelerde yok.** | 3 (UX, FUT, GNÇ) | |
| B8 | **Rapor/Defter adlandırması, uzmanlık düğmeleri (opaklık 0,3), erişilebilirlik ayarları.** | 2 (UX, GNÇ) | |
| B9 | **Müzayede ve canlı açık artırmada değer çıpası yok.** | 3 (GEL, UX, FUT) | Muhammen açıklanmıyor; tahmini aralık, rakip sayısı ve süre gösterilmiyor. |
| B10 | **Haftalık karne ölçütü belirsiz; garaj boşken oyun yönlendirmiyor; sezon kapanış başlığında gelen sezonun adı büyük yazılıyor.** | 2 (FUT, GEL) | Hafta 1'de +₺315K ile not "C" (FUT). |

### C. İçerik, metin ve güven

| # | Konu | Raporlayan | Kanıt | Kod tespiti |
|---|---|---|---|---|
| C1 | **"Günün fırsatı" ve "~%X ucuz (tahmin)" rozetleri yanıltıyor.** | 4 (STR, KRK, FUT, GEL dolaylı) | "Günün fırsatı" rozeti ~%17 pahalı Sitronel'de (STR). Perrin 208 %10 pahalı çıktı; Tanaro ağır hasarlı çıktı (KRK). Logana "%17 ucuz" denip %20 pahalı çıktı (FUT). | `gunlukritim.js` `gunlukKur()`: fırsat aracı **rastgele** seçiliyor (`pick(aday)`), fiyat kontrol edilmiyor. |
| C2 | **Arıza havuzu vites tipine ve model yılına bakmıyor.** | 2 (GEL, KRK) | Manuel Şahan'da "Otomatik şanzıman bakımı" (GEL). 1985 Şahan'da "Motor beyni arızası", E30'da "Enjektör" (KRK). | `game.js` `genCar()`: `const pool=[...FAULTS]`, filtre yok. |
| C3 | **Yanlış veya yanıltıcı metinler.** | 5 | "Ekspertize götürdü, temiz çıktı" tramerli ya da açık arızalı araçta çıkıyor (GEL, UX, KRK). "TEMİZ" rozeti Motor 12/Kaporta 34 olan araçta (UX, KRK). "Zarfın ($)" (GEL, FUT, KRK). "Kârlı tamir yok" (aslında "kalmadı") (UX). İlan metni km ile çelişiyor (KRK). "N gizli kusur" rozeti ekspertizden sonra da duruyor (KRK). Alıcı cümleleri tekrarlanıyor (UX, GEL). | `ui.js` `offerCard()` "temiz çıktı" metnini `o.inspects` olduğunda basıyor; araç ilanda açıklanmışsa da aynı cümle çıkıyor. `ui.js` satır ~3247 `Zarfın ($)`. |

### D. Mağaza ve platform

| # | Konu | Raporlayan |
|---|---|---|
| D1 | Bulut kaydı, bildirim ve hesap yok; kayıt yedeği elle kopyalanıyor. | 1 (STR, KRİTİK diyor) |
| D2 | SATILDI ekranında paylaş düğmesi yok (karne ve vakada var). | 1 (GNÇ) |
| D3 | 3B performansı gerçek cihazda ölçülmedi (swiftshader'da 1,7 fps). | 2 (GEL, GNÇ), doğrulanmadı |
| D4 | Araç görsel çeşitliliği düşük (sedanlar aynı gövdede), 3B sahne boş. | 1 (GNÇ) |
| D5 | Başlangıç nakdi yüksek; "nakit az" açıklaması çelişkili. | 2 (KRK, GEL) |
| D6 | Gerçek masraflar (noter, devir, ÖTV) yok. | 1 (KRK, "basitlik tercih edilirse sorun değil") |

---

## TUR 2: Tartışma

### Konu 1: Karşı teklif mantığı (A1)

- **GEL:** Bu bir denge sorunu değil, mantık hatası. `saleReply` içinde `price<=tavan` olduğunda `(price+tavan)/2` dönüyor; yani alıcı oyuncunun istediğinden fazlasını öneriyor. `sellerReply` her turda karşı teklifi yeniden zarla belirliyor, bu yüzden 590K verince 641K'dan 602K'ya inebiliyor. Oyuncu bunu fark edip sömürür. Düzeltmesi iki fonksiyonda yaklaşık 20 satır; maliyeti düşük.
- **KRK:** Gerçek hayatta "ortada buluşalım" diyen biri aşağı inmez. 768K açılan alıcı benim 830K'ma karşılık 704K demişti. Bunu hata sandım. Ekranda yalan söyleyen bir metin olamaz.
- **FUT:** Karşı çıkacağım. Aşırı isteyince alıcının soğuması FM'deki "kulüp masadan kalktı" hissi; bunu sevdim. Tümüyle kaldırılırsa satış pazarlığında risk kalmaz.
- **STR:** FUT haklı ama oyuncu cezayı **göremiyor**. KRK cezayı mantık hatası olarak okudu. Ceza kalabilir, yeter ki görünür ve kurallı olsun.
- **UX:** O zaman iki ayrı durum tanımlayalım. (1) Normal karşı teklif: açılış ile oyuncunun fiyatı arasında olur, asla dışına çıkmaz. (2) Geri çekilme: yalnızca ilgi eşiğin altına inince olur ve ayrı bir mesajla gösterilir ("İlgisi azaldı: teklifini ₺X'e çekti"). "Ortada buluşalım" cümlesi sadece sayı gerçekten ortadaysa kullanılır.
- **GNÇ:** Bir de satıcı "altına inmem" deyip sonra iniyor. Ben buna blöf demem, oyun bozuk derim.
- **GEL:** Alışta karşı teklif turdan tura yalnızca düşebilsin; "Bundan aşağısı yok" yalnızca rezervde söylensin. Yeni bir koz sunulursa satıcı inebilir, ama metin bunu açıkça söylesin ("Raporu görünce ₺X'e inerim").
- **Uzlaşma:** Monotonluk ve "teklifin dışına çıkmama" kuralı kesin. FUT'un istediği ceza "geri çekilme" olarak kalıyor, ancak açık bir mesajla ve yalnızca ilgi eşiğin altına indiğinde. **Oybirliği.**

### Konu 2: Alış pazarlığı ne kadar zorlaşmalı? (A2, A3)

- **FUT:** Satıcı hiç "hayır" demiyor. Gizli bir taban olmalı ve "Önerilen tavan" yalnızca kolay modda gösterilmeli.
- **GNÇ:** Pazarlık zorlaşırsa ve her araçta 5 tur uğraşırsam sıkılırım. Hızlı akış oyunun en iyi yanı. Ama "hep %22 aşağı yaz" stratejisi de 3. araçta sıkıcı oldu. İstediğim şey çeşitlilik, uzunluk değil.
- **KRK:** Gerçekçi olsun. Galerici "fiyatımız nettir" deyip %22 inmez. Öte yandan acil nakit satıcısının kolay inmesi gerçekçi. "Önerilen tavan"ı kaldırmayın; 40 yaşında hesap yapmak istemiyorum.
- **STR:** Mağaza açısından risk şu: ₺49 ödeyen oyuncu ilk saatte "çözdüm" hissine kapılırsa yorum puanı düşer. Diğer yandan zorluğu ani artırırsak ilk 10 dakikada kayıp yaşanır. Çözüm satıcı tipine göre ayrışma: acil ve acemi kolay kalsın, galerici, koleksiyoncu ve duygusal satıcı sert olsun.
- **GEL:** Kökte iki parametre var. `effReserve` içindeki %30 koz tavanı ve `SELLERS.res`. Kozlar rezervi %30 düşürünce acil satıcı (0,78) değerin %55'ine kadar iniyor. Koz tavanını %15'e çekmek yeterli olur, tur sayısını artırmaya gerek yok. Ayrıca "masada ne kaldı" bilgisini kabul ekranına eklemek tek satırlık iş ve öğretici.
- **UX:** "Önerilen tavan" kalabilir, ama adı ve anlamı doğru olsun. Bu bir kâr tavanı, satıcının tabanı değil. Ayrıca isteneni asla aşmamalı. ₺40,5K'yı bu düğme yüzünden kaybettim.
- **FUT:** Yalnızca kolay modda olması konusunda geri adım atıyorum, ama ipucu satıcının tabanını göstermemeli.
- **Uzlaşma:** Tur sayısı artmıyor (GNÇ'nin şartı). Rezerv cömertliği düşüyor ve satıcı tipleri arasında belirgin fark oluyor (KRK ve STR). Önerilen tavan kalıyor ama `min(tavan, istenen)` ile sınırlanıyor (UX). Kabul sonrasında "Satıcı ₺X'e de inerdi" gösteriliyor (FUT, STR, KRK).

### Konu 3: Para göstergeleri ve şeffaflık (B3)

- **UX:** Herkes aynı şeyi yazdı: "-₺9.717/gün" ile "-₺350". Oyuncu günde ₺9.717 kaybettiğini sanıyor. En çok güven kıran sayı bu.
- **GEL:** Kod doğru çalışıyor. `renderHud` içinde `yakim=park+maas+faiz+kira`; kira tahakkuk ediyor ve sezon sonunda toplu kesiliyor. Sorun etiket ve gösterim. Ayrıca sezon kapanışında açıklamasız +₺150K buldum (büyük olasılıkla hedef ödülü veya kira iadesi). Her nakit hareketinin bir satırı olmalı.
- **FUT:** FM'de bütçe ekranı kutsaldır. Vergi tabanını yazın; hedef hesabının neyi saydığını yazın (Perrin zararını saymadı).
- **KRK:** Ekspertiz "₺2.000" yazıp ₺2.500 düşmesi de aynı türden bir sorun. Küçük ama "bu oyun hesap bilmiyor" dedirtiyor.
- **STR:** Maliyeti düşük, etkisi yüksek. Mağaza yorumlarında "rakamlar tutmuyor" cümlesi ölümcül olur.
- **Uzlaşma:** Oybirliği. Gösterge iki parçaya ayrılıyor (gerçek günlük gider ve sezon sonu kira birikimi). Bir "Kasa defteri" listesi ekleniyor; her ödül ve kesinti bir satırla görünüyor.

### Konu 4: Sipariş ekonomisi (A4)

- **STR:** Tek sipariş üç normal satışa eşit; pazarlık, foto ve ilan dili anlamsızlaşıyor. Ödeme piyasa değerinin en fazla 1,15 katı olsun.
- **FUT:** Benim deneyimim tam tersiydi. Kart "₺908,5K" dedi, ₺712K ödendi. Zarar ettim ve süre dolunca itibar cezası da yedim.
- **GNÇ:** Bende de "743K" yazıp "601K" verdi. Neden olduğunu anlamadım, teslim etmedim.
- **GEL:** İkisi aynı kökten geliyor. `genOrder` bütçeyi yıpranmış örnek aracın değerinin 1,20-1,42 katı olarak hesaplıyor, yani bütçe çok şişik. `orderQuality` kalite düşükse sessizce `butce*0.94` veya `*0.85` ödüyor. Hem tavan çok yüksek, hem kesinti görünmüyor.
- **KRK:** Siparişin "aradığımı bul" hedefi güzel; kaldırmayın.
- **Uzlaşma:** Ödeme, teslim edilen aracın piyasa değerine bağlanıyor: `min(bütçe, piyasa×1,15) + prim`. Prim bütçenin %4-9'u olarak kalıyor. Kalite kesintisi teslimden **önce**, nedeniyle birlikte gösteriliyor. Kaçırılan siparişte itibar -1 yerine yumuşak bir mesaj (FUT'un isteği; STR "küçük ceza kalsın" dedi, sonuçta 0 ile -0,5 arası bir değer GEL'e bırakıldı).

### Konu 5: Dürüstsüzlük kumarı (A7)

- **GEL:** Abartılı ilanın beklenen değeri dürüst ilandan açıkça yüksek. Yakalanınca araç elde kalıyor ve ilan baştan açılıyor; bu fiilen bedava bir piyango bileti.
- **KRK:** "Kusurları bilmeyen alıcıya ₺1,75M" satırı dolandırıcılığı teşvik ediyor gibi. Gerçek hayatta bu dava ve tramer sorgusu demek.
- **GNÇ:** Risk olsun ama "yasak" olmasın. Kumar eğlenceli.
- **FUT:** Benim derdim açıklama. "Sorarlarsa söylersin" yazıyor, ama kimse sormadan yakalandım.
- **STR:** Mağaza tarafında "hile serbest" algısı rating açısından sorun değil, ama denge sorunu: bir kumar baskın strateji olmamalı.
- **UX:** İlan dili kartında sayısal risk yazsın ("Ekspertize götürme ihtimali ~%X; yakalanırsan itibar -Y, ₺Z ceza").
- **Uzlaşma:** Kumar kalıyor (GNÇ), ama yakalanmanın gerçek bir maliyeti oluyor ve risk önceden görünüyor. Bu madde GEL, STR ve FUT'tan oy aldı; KRK oyunu başka maddelere verdi ama destekliyor.

### Konu 6: Ekspertiz bedeli (A6). En gerçek anlaşmazlık

- **GEL:** Ekspertiz bedava ya da çok ucuz olunca her araca bakılıyor ve "ekspertiz yapayım mı" kararı ortadan kalkıyor. Günlük hak verilsin ya da araç değeriyle oranlı ücret alınsın.
- **KRK:** Hayır. ₺2.500 gerçekçi; ben 6 araca ₺15K harcadım ve hissettim. Günlük hak koymak gerçek hayatta yok, yapay kalır.
- **Moderatör (koda bakarak):** GEL'in gördüğü "bedava", Günün fırsatı aracına özel (`c.gunun`). Diğer araçlarda ücret ₺2.500. GNÇ'nin "bedava yazıyor ama para düşüyor" gözlemi de büyük olasılıkla farklı araçları karşılaştırmaktan geliyor.
- **STR:** Sabit ₺2.500 ₺3,3M'lik lüks araçta da aynı; oranlı olması hem daha gerçekçi hem stratejik.
- **GNÇ:** Ekspertiz için para ödemek beni yavaşlatmaz; ama günlük hak gelirse "bugün bakamıyorum" diye sinirlenirim.
- **Sonuç:** Günlük hak **reddedildi** (KRK ve GNÇ). Oranlı ücret makul bulundu, ancak oylamada "mutlaka" eşiğine ulaşmadı (yalnızca GEL ve STR'nin ilgisi vardı, ikisi de oylarını sipariş ve pazarlığa verdi). **Sonraya bırakıldı.** Yalnızca "Hızlı bakış" ile ücret etiketi tutarlılığı, metin paketine (madde 6) eklendi.

### Konu 7: Sezon hedefi (A5) ve ölü stok (A8)

- **STR:** 5. günde %206'ya ulaşan bir hedef, hedef değildir. Bronz, gümüş, altın kademeleri olsun.
- **FUT:** Ben ₺315K ile kaçırdım. Hedefi yükseltirseniz benim gibi oynayan biri hep kaçırır.
- **GEL:** İkiniz de haklısınız; çünkü madde 1, 2 ve 4 (pazarlık ve sipariş) düzelince gelir zaten %30-40 düşecek. Hedefi bu düzeltmelerden **sonra** `test/denge.js` ile yeniden ayarlayalım. Önceden ayarlarsak iki kez ayar yapmış oluruz.
- **KRK:** Kademe iyi fikir; FUT'un ₺315K'sı bronz sayılır.
- **GNÇ:** Ölü stok baskısı artırılırsa, iki gün teklif gelmeyen ilanım beni zaten sıkıyordu, daha da sıkılırım.
- **STR:** Ölü stoğu bu tur zorlamayalım, ama hedef kademeleri bu sürüme girsin.
- **Uzlaşma:** Hedef kademeli olacak ve sayısal değerler denge testine bağlanacak. Ölü stok (A8) ve tamir derinliği **sonraya** bırakıldı.

### Konu 8: Ekran ve akış (B1, B2, B4, B5)

- **UX:** Pazarlık ekranı oyunun kalbi, ama hamlelerin görünürlüğü %15. Hamleler 2 sütunlu bir ızgaraya alınmalı, teklif paneli katlanabilir olmalı.
- **KRK:** Telefonda hamleleri bulamadım. Bu madde benim için 8. sırada, ama olmalı.
- **GEL:** CSS ve `ui.js` `renderNeg` / `renderSaleNeg` düzeyinde bir iş; orta maliyetli. Toast kuyruğu ise tek fonksiyon (`ui.js` `toast()`): şu an her toast hemen DOM'a ekleniyor, kuyruk yok. Ucuz.
- **GNÇ:** Toptan sat düğmesi beni ₺73K'ya mal oldu ve onay sormadı. Bunu kimse "küçük" saymasın.
- **STR:** Para kaybettiren UI hataları en hızlı 1 yıldızlı yorumu getirir. Ucuz ve kesin; ilk sürüme girmeli.
- **UX:** BUGÜN şeridini (B5) bu sürüme almayalım; pazarlık ekranıyla aynı anda iki büyük düzen değişikliği yapmak test yükünü artırır.
- **Uzlaşma:** B4 (para kaybı korumaları), B1 (pazarlık düzeni) ve B2 (toast kuyruğu ile ödül anları) listede. B5 sonraya kaldı.

### Konu 9: Güven kıran içerik (C1-C3, B6)

- **KRK:** Rozet iki oyunda iki kez yalan söyledi. "Fırsat" diye ağır hasarlı aracı önerirseniz oyuncu rozete güvenmeyi bırakır. Bir de 1985 model araçta motor beyni olmaz; araba bilen herkesin gözüne batar.
- **STR:** Rozet tuzağı bilinçli bir tasarımsa "Günün fırsatı" adı yanlış. Adı "Bedava ekspertiz" olsun ya da gerçekten ucuz araca verilsin.
- **GEL:** `gunlukKur()` rastgele seçiyor. Seçim gerçek değere göre yapılabilir: istenen fiyat gerçek değerin %95'inin altında olmalı ve araç ağır hasarlı olmamalı. Maliyeti çok düşük.
- **UX ve GNÇ:** "İtibar +0,8" kırmızı ve "++1" sorunlarının kökü tek: `sellCar` `rep` alanını metin olarak ("+0,8") gönderiyor; `openDealSummary` bunu `d.rep>=0` ile karşılaştırıyor. Sayı olarak tutulsun.
- **Uzlaşma:** C1 ayrı madde (STR ve KRK oyu). C2, C3 ve B6 tek bir "metin, etiket ve renk doğruluğu" paketinde toplandı (UX, GNÇ ve KRK oyu).

### Konu 10: Takas (A9) ve bulut kaydı (D1)

- **KRK:** Takaslı satışta "+₺72K kâr" görüp nakit sandım. Gerçek kâr sıfır çıktı.
- **GNÇ:** Ben de takas olduğunu fark etmeden araba aldım.
- **FUT:** Takası seviyorum, kalsın; ama tek bir değer bandı göstersin.
- **STR:** Bulut kaydı ₺49'luk bir oyun için kritik. Telefon değişince ilerleme kayboluyor.
- **GEL:** Doğru, ama bu tek HTML ve saf JS. Google Play Games veya iCloud entegrasyonu bir yerel sarmalayıcı (Capacitor ya da benzeri) ve hesap altyapısı gerektiriyor; haftalar sürer. Kayıt yedeği şu an elle kopyalanıyor. Arada "dosya olarak dışa aktar / paylaş" eklenebilir.
- **STR:** Kabul. "Mutlaka" listesine değil, yayın öncesi yol haritasına girsin. Muhalefet şerhimi düşüyorum.
- **Uzlaşma:** Takas şeffaflığı listede. Bulut kaydı ve bildirimler sonraya kaldı.

---

## TUR 3: Oylama

Her rol en fazla 6 oy verdi (toplam 36 oy). Satırlar Tur 1'deki konu kümelerinden oluşuyor.

| Konu | GEL | UX | STR | FUT | GNÇ | KRK | **Toplam** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| A1 Karşı teklif mantığı | ● | ● | ● | ● | ● | ● | **6** |
| A2/A3 Alış pazarlığı cömertliği + önerilen tavan | ● | | ● | ● | | ● | **4** |
| B3 Gider ve nakit şeffaflığı | ● | ● | | ● | | ● | **4** |
| A4 Sipariş ekonomisi | ● | | ● | ● | | | **3** |
| A7 Dürüstsüzlük kumarı | ● | | ● | ● | | | **3** |
| C2+C3+B6 Metin, etiket ve renk doğruluğu | | ● | | | ● | ● | **3** |
| B4 Para kaybı korumaları | | ● | | | ● | | **2** |
| B1 Pazarlık ekranı düzeni | | ● | | | ● | | **2** |
| B2 Toast kuyruğu ve ödül anları | | ● | | | ● | | **2** |
| A5 Sezon hedefi kademeleri | ● | | ● | | | | **2** |
| C1 Günün fırsatı rozeti | | | ● | | | ● | **2** |
| A9 Takas şeffaflığı | | | | | ● | ● | **2** |
| A10 Rakip ölçeği / lig | | | | ● | | | **1** |
| A6 Ekspertiz oranlı ücret | | | | | | | 0 (tartışıldı, oy almadı) |
| D1 Bulut kaydı | | | | | | | 0 (STR oyunu A4'e kaydırdı) |
| **Kullanılan oy** | 6 | 6 | 6 | 6 | 6 | 6 | **36** |

Oy dökümü: GEL → A1, A2, B3, A4, A7, A5 · UX → A1, B3, metin/renk, B4, B1, B2 · STR → A1, A2, A4, A7, A5, C1 · FUT → A1, A2, B3, A4, A7, A10 · GNÇ → A1, metin/renk, B4, B1, B2, A9 · KRK → A1, A2, B3, metin/renk, C1, A9.

**Eşik:** 2 ve üzeri oy alan 12 konu "mutlaka" listesine girdi. Bu, istenen 8-12 aralığının üst sınırı. Eşit oy alanlar arasında sıralama; para kaybı, güven kaybı ve uygulama maliyeti ölçütlerine göre yapıldı. Tek oy alan A10 ile oy almayan A6 ve D1 sonraya bırakıldı.

---

## KARAR: Mutlaka değişmesi gerekenler (öncelik sırasıyla)

### 1. Karşı teklif mantığını tutarlı yap (alış ve satış) [6/6 oy]
- **Sorun:** Alışta daha yüksek teklif daha düşük karşı teklif getiriyor (Daewon 641,5K→602,5K, Şahan 206K→197K, Longwei 829K→806,5K). "Bundan aşağısı yok" dendikten sonra daha aşağı iniliyor. Satışta alıcı oyuncunun istediğinden fazlasını öneriyor (NV200 655K→671,5K, Logana 545K→554,5K, Weibo 795K→801K). "Ortada buluşalım" denip açılışın altına iniliyor (Trax 768K→704,5K→683,5K, Kodak 1,853M→1,7195M). Sonuçta oyuncu "pazarlık etme, ilk teklifi al" dersini çıkarıyor.
- **Çözüm:**
  - **Alış:** `game.js` `sellerReply()`. Karşı teklif bir önceki karşı teklifi **asla aşmaz** (`price = min(prevCounter, yeni)`) ve oyuncunun teklifinin altına düşmez. Rastgele aralık (`rnd(1.0,1.04)`, `rnd(1.05,1.12)`) müzakere başında bir kez seçilir ve her turda sabit bir adımla (kalan farkın %40-60'ı) daralır. "Bundan aşağısı yok / altına inmem" cümleleri yalnızca karşı teklif `er` (efektif rezerv) değerine eşit olduğunda kullanılır. Rezervin altındaki bir teklif aynı müzakerede kabul edilmez; ancak yeni bir koz sunulursa ve bu açıkça söylenirse ("Raporu görünce ₺X'e inerim") istisna yapılır. Sabır sıfırlanınca oyuncuya son karşı teklifi kabul etmesi için bir şans verilir ("Son sözüm ₺X, kabul et ya da kalk").
  - **Satış:** `game.js` `saleReply()`. `price<=tavan` olduğunda karşı teklif `min(price, (price+tavan)/2)` olur; pratikte ya kabul edilir ya da en fazla `price` önerilir. **Karşı teklif oyuncunun fiyatını asla aşmaz.** `price>tavan` olduğunda karşı teklif `max(sonAlıcıTeklifi, tavan*rnd(.97,1))` olur; **açılışın altına inmez.**
  - **Geri çekilme (FUT'un istediği ceza):** Yalnızca `ilgi < 25` olduğunda olur. Alıcı teklifini en fazla %5 düşürür ve ayrı bir mesajla bildirir: "İlgisi azaldı: teklifini ₺X'e çekti". "Ortada buluşalım" metni yalnızca sayı gerçekten iki tarafın arasındaysa seçilir (`ui.js` satış metinleri).
- **Kabul ölçütü:** `test/` altına eklenecek bir birim testi, 10.000 rastgele pazarlık dizisini (6 satıcı tipi, 3 alıcı tipi, koz var/yok) simüle eder. Alışta karşı teklif dizisi monoton olarak azalmamalı ve oyuncu teklifinin altına düşmemeli. Satışta karşı teklif hiçbir zaman oyuncunun fiyatını aşmamalı. Geri çekilme bayrağı yoksa karşı teklif açılışın altına inmemeli. İhlal sayısı 0 olmalı. Elle test: Trax/Dastan senaryosunda (açılış 768K, 830K iste) karşı teklif ≥ 768K çıkmalı.
- **Kapsam dışı:** Yeni pazarlık hamleleri, tur sayısı artışı, alıcı yapay zekâsının baştan yazılması.

### 2. Alış pazarlığındaki cömertliği azalt, satıcılar arasında fark yarat, "masada kalan"ı göster [4/6: GEL, STR, FUT, KRK]
- **Sorun:** Tüm testçilerin alımlarında yaklaşık %15-22 indirim ilk teklifte geldi (Weibo ₺746K değerinde araç ₺540K'ya, Atego -%21). Sabır düşmedi. "Önerilen tavan" isteneni aştı ve ₺40,5K fazla ödendi. Oyuncu ne kadar daha ucuza alabileceğini hiç öğrenmiyor.
- **Çözüm:**
  - `game.js` `effReserve()`: koz indirimi tavanı **%30'dan %15'e** iner (Gerçekçi modda %24'ten %12'ye).
  - `SELLERS.res`: acil 0,78→**0,84**, acemi 0,80→**0,86**. Galerici, koleksiyoncu ve duygusal satıcı aynı kalır. Böylece satıcı tipleri arasındaki fark korunur: acil ve acemi kolay, diğerleri sert.
  - `sellerReply()`: `r≥1` olduğunda hemen kabul edilmesi kalır. Ancak sert satıcılar (`sert≥.7`) ilk turda, `r<1.03` ise en az bir kez karşı teklif verir. Tur sayısı ortalaması en fazla +1 artar (GNÇ'nin şartı).
  - `kolay.js` `onerilenTeklif()` → `Math.min(öneri, c.ask)`. Etiket "Kâr tavanı (bunun üstü kârsız)" olarak değişir.
  - Satın alma kabul edildiğinde (`ui.js` `doOffer()` → accept dalı) tek satırlık bir geri bildirim gösterilir: "Satıcı ₺{er}'e kadar inerdi" (ya da "Tam tabanından aldın").
- **Sayısal hedef:** Normal modda ortalama alış indirimi istenen fiyatın **%8-14'ü** olmalı (şu an yaklaşık %20). İlk teklifte kabul oranı acil/acemi satıcılarda ≤%50, diğerlerinde ≤%20 olmalı.
- **Kabul ölçütü:** `test/denge.js` bota 200 alım yaptırır ve ortalama indirimi ile ilk teklif kabul oranını satıcı tipine göre yazdırır; değerler hedef aralıkta olmalı. Önerilen tavan hiçbir araçta `c.ask` değerini aşmamalı (assert).
- **Kapsam dışı:** "Önerilen tavan"ı kaldırmak ya da yalnızca kolay moda almak (FUT'un önerisi reddedildi; KRK ve GNÇ istiyor). Pazarlıkta tur sayısını ya da süresini artırmak.

### 3. Gider göstergesini ve nakit akışını şeffaf yap [4/6: GEL, UX, FUT, KRK; 6/6 raporladı]
- **Sorun:** Üst bar "-₺9.717/gün" gösteriyor, gün sonu raporu "-₺350" (6 testçinin 6'sı). Kira sezon sonunda toplu kesiliyor (₺140-145K) ve bu hiçbir yerde yazmıyor. Sezon kapanışında +₺150K açıklamasız ekleniyor. Görev ödülleri sessizce kasaya giriyor (+₺3K, +₺4,5K, +₺12,5K). Ekspertiz bir yerde "₺2.000" yazıyor, ₺2.500 düşüyor. Toast'taki kâr ₺102K, karttaki kâr aralığı ₺28,8-98,3K.
- **Çözüm:**
  - `ui.js` `renderHud()`: tek `yakim` rakamı yerine iki öğe gösterilir: **"Bugün −₺{park+maaş+faiz}"** ve **"Kira birikimi ₺{birikmiş}/₺{sezonKirasi()} · {kalan} gün"**. Dokununca Durum sayfasında döküm açılır.
  - Gün sonu raporuna "Kira tahakkuku (sezon sonunda ödenir) ₺{gunlukKira()}" satırı eklenir.
  - Yeni "Kasa defteri" (son 30 hareket) eklenir: her `S.cash` değişimi bir etiketle kaydedilir (görev ödülü, kilometre taşı, ekspertiz, kira, vergi, hedef ödülü, sipariş). Ödül toast'ları bu deftere bağlanır.
  - Sezon kapanış ekranında vergi tabanı ("%8 × net sezon kârı ₺X") ve hedef ödülü ayrı satırlarda gösterilir.
  - Ekspertiz ücreti tek kaynaktan gelir: `eksperFiyat()` hem etikette hem maliyette kullanılır (`PARA.ekspertiz` sabitinin `carCost()` ve `sellCar()` içindeki kullanımı `eksperFiyat()` ile değiştirilir ya da araca ödenen gerçek ücret yazılır).
- **Kabul ölçütü:** 16 günlük bir oyunda `başlangıç nakdi + Σ(kasa defteri) = S.cash` (otomatik assert, `test/denge.js`). Ekranda gösterilen her "/gün" rakamı, o günün gerçek nakit düşüşüyle ±₺1 içinde eşleşmeli. Toast'taki kâr ile karttaki kâr aynı fonksiyondan gelmeli.
- **Kapsam dışı:** Kira modelini değiştirmek (sezon sonu toplu ödeme kalıyor); noter, devir ve ÖTV gibi yeni masraf kalemleri (KRK'nin önerisi sonraya kaldı).

### 4. Sipariş ödemesini piyasa değerine bağla ve hesabı açık göster [3/6: GEL, STR, FUT; GNÇ de raporladı]
- **Sorun:** Bir sipariş piyasanın %33-38 üstünde ödeme yapıyor (Honzo +₺441K, Longwei +₺451K) ve tek başına sezon hedefini bitiriyor. Öte yandan kart "Bütçe+prim ₺908,5K / ₺743,5K" yazarken ödeme ₺712K / ₺601,5K oluyor ve nedeni gösterilmiyor (FUT, GNÇ).
- **Çözüm:**
  - `ui.js` `orderQuality()`: ödeme **`min(o.butce, piyasaDeğeri × 1,15) + o.prim`**. Sipariş primi + bütçe aşımı birlikte **piyasa değerinin en çok %15 üstü**, prim dahil en çok %20 üstü olur.
  - `game.js` `genOrder()`: `butce` çarpanı 1,20-1,42'den **1,05-1,20**'ye iner.
  - Kalite kesintileri (`*0.94`, `*0.85`, ret) sipariş sheet'inde **teslim düğmesinden önce** gerekçeyle yazılır: "Durum puanı 0,61 < 0,66: prim yok, bütçenin %94'ü ödenir".
  - Teslim düğmesi metni iki satıra sarılır; uzun model adında taşma olmamalı.
  - Kaçırılan siparişte itibar -1 yerine 0 ile -0,5 arası bir değer kullanılır ve yumuşak bir mesaj gösterilir.
- **Kabul ölçütü:** `test/denge.js` 120 günde tüm sipariş teslimlerini kaydeder; `ödeme / piyasaDeğeri ≤ 1,20` her teslimde sağlanmalı. Sipariş kârının toplam kâra oranı ≤ %25 olmalı. Elle test: 390px ekranda en uzun model adıyla teslim düğmesi kırpılmamalı. Kartta yazan rakam ile ödenen rakam ya eşit olmalı ya da fark kartta gerekçesiyle gösterilmeli.
- **Kapsam dışı:** Yeni sipariş türleri; "siparişe uyan araç" rozetinin pazarda vurgulanması (GNÇ'nin önerisi sonraya kaldı).

### 5. Dürüstsüzlük kumarına gerçek ve önceden görünen bir maliyet ekle [3/6: GEL, STR, FUT; KRK ve UX destekliyor]
- **Sorun:** Abartılı ilanla Kodak'ta +₺1,18M hedeflenebiliyor (dürüst satışta +₺377K). Yakalanınca yalnızca itibar -4 kesiliyor ve araç elde kalıyor. "Muğlak: sorarlarsa söylersin" açıklaması sonuçla çelişiyor (FUT, kimse sormadan yakalandı). "Kusurları bilmeyen alıcıya" rakamı açıklanmıyor (UX, KRK).
- **Çözüm:**
  - `game.js` `makeBuyer()`: `caught && walk` olduğunda (a) itibar **-4 yerine -8** (abartılı) ya da -5 (muğlak); (b) ilan "Kusurlu satış şüphesi" etiketiyle **2 gün** boyunca alıcı akışı ×0,5 olur; (c) abartılı ilanda **piyasa değerinin %3'ü** kadar "şikâyet/uzlaşma" bedeli kesilir.
  - İlan dili kartlarında (`ILAN_DILI`) sayısal risk gösterilir: "Alıcıların ~%X'i ekspertize götürür; gizli kusur yakalanırsa itibar −Y, ₺Z". Muğlak açıklaması "Yazmazsın; ekspertize götüren alıcı kusuru bulur" olarak değişir.
  - Fiyat kaydırıcısı abartılı ilanda `av` değerine kadar çıkabilir, ama kaydırıcının `mv` üstündeki bölgesi turuncu "risk bölgesi" olarak boyanır.
  - "Kusurları bilmeyen alıcıya" satırına bir açıklama eklenir: "kusur gizlenirse ilk bakışta biçilen değer, yakalanma riski var".
- **Sayısal hedef:** `test/denge.js` içinde "hep abartılı" stratejisinin 60 günlük beklenen kârı, "hep dürüst" stratejisini **en fazla %10** geçmeli (şu an yaklaşık 2-3 kat).
- **Kabul ölçütü:** Yukarıdaki denge karşılaştırması. Elle test: ilan dili ekranında risk yüzdesi görünmeli; yakalanma olayında üç cezanın üçü de deal ya da gün raporunda listelenmeli.
- **Kapsam dışı:** Dava ya da ilan yasağı gibi kalıcı mekanikler; abartılı ilan seçeneğini kaldırmak (GNÇ: "kumar kalsın").

### 6. Metin, etiket ve renk doğruluğu paketi [3/6: UX, GNÇ, KRK; 5 rol raporladı]
- **Sorun:** Bu küçük hatalar toplamda güven kırıyor:
  - Pozitif itibar kırmızı görünüyor, "İtibar ++1" yazıyor (UX, STR, FUT, GNÇ, GEL).
  - Manuel araçta "Otomatik şanzıman bakımı", 1985 model araçta "Motor beyni" ve "Enjektör" arızası çıkıyor (GEL, KRK).
  - Tramerli veya açık arızalı araçta "Ekspertize götürdü, temiz çıktı" yazıyor (GEL, UX, KRK).
  - Motor 12 / Kaporta 34 araçta "TEMİZ" rozeti (UX, KRK).
  - "Zarfın ($)" (GEL, FUT, KRK).
  - "Kârlı tamir yok" (aslında "kalmadı") (UX).
  - Ekspertizden sonra da duran "N gizli kusur" rozeti (KRK).
  - 55.000 km'lik araçta "km yüksek" ilan şablonu (KRK).
- **Çözüm:**
  - `ui.js` `sellCar()`: `S.lastDeal.rep` **sayı** olarak tutulur. `openDealSummary()` biçimlendirmeyi kendisi yapar (`+0,8`, renk `pos` ise yeşil). Alım sonrası nakit yanıp sönmesi kırmızı yerine nötr renkte olur.
  - `game.js` `genCar()`: `pool` filtrelenir. Manuel araçta `otosanziman` çıkmaz. Model yılı 1995'ten eski araçlarda `beyin`, `enjektor` ve benzeri elektronik arızalar çıkmaz (`FAULTS` girdilerine `minYil` / `vites` alanı eklenir).
  - `ui.js` `offerCard()`: `o.inspects && car.disclosed` durumunda metin "Ekspertize götürdü, ilandakiyle aynı çıktı" olur. "Temiz çıktı" yalnızca `hiddenIssues` boş **ve** açık arıza yoksa kullanılır.
  - Ekspertiz rozeti "TEMİZ" yerine **"TRAMERSİZ"** olur. Durum puanı ortalaması 45'in altındaysa ayrıca "YORGUN" rozeti gösterilir.
  - `ui.js` ~3247 satırında "Zarfın ($)" → "Zarfın (₺)".
  - "Kârlı tamir yok" → "Yapılacak kârlı tamir kalmadı".
  - Ekspertizli araçta "N gizli kusur" rozeti "N bilinen kusur" olarak değişir.
  - İlan şablonundaki "km yüksek / km'sine bakmayın" cümleleri yalnızca `km > yaş×18.000` olduğunda seçilir.
- **Kabul ölçütü:** Bir test betiği 5.000 araç üretir: manuel araçta `otosanziman` = 0, 1995 öncesi araçta elektronik arıza = 0, "temiz çıktı" metni kusurlu araçta = 0, "($)" metni = 0. Deal ekranı itibar değeri için görsel test: pozitif değer yeşil, tek "+" işaretli.
- **Kapsam dışı:** Diyalog havuzunun genişletilmesi ve cümle tekrarlarının azaltılması (sonraya); plaka formatı.

### 7. Geri dönüşsüz para kaybına karşı korumalar [2/6: UX, GNÇ; GEL ve KRK aynı durumu raporladı]
- **Sorun:** "Galericiye toptan sat" onay sormadan çalıştı, -₺73K (GNÇ). Alışta istenen fiyatın üstünde teklif uyarısız kabul edildi, ₺40,5K fazla ödendi (UX). Satıcının karşı teklifinin üstünde teklif verildi, ₺23,5K fazla ödendi (GEL). Satışta ilan fiyatının üstüne fiyat girilebiliyor ve uyarı yok (KRK). "Hazırla" onayındaki "Vazgeç" tüm araç sayfasını kapatıyor (FUT).
- **Çözüm:**
  - `ui.js` `a==="wholesale"` dalı: önce bir onay sheet'i açılır ("₺X'e sat, sonuç **−₺Y zarar**. Geri alınamaz"). Zarar varsa onay düğmesi kırmızı olur.
  - `ui.js` `doOffer()`: `offer > c.ask` ise teklif engellenir ve "İstenen fiyat ₺X. Daha fazlasını önermene gerek yok" mesajı gösterilir. `n.counter` varken `offer > n.counter` ise teklif otomatik olarak `n.counter` değerine düşürülür ya da "Karşı teklifi kabul et" önerilir.
  - Satış pazarlığında ilan fiyatının %5'inden fazla üstüne çıkan fiyat için uyarı gösterilir (engellenmez).
  - "Hazırla" onayındaki "Vazgeç" yalnızca onay sheet'ini kapatır.
- **Kabul ölçütü:** Playwright testi (`test/ux-test.js`): toptan sat düğmesine tek dokunuş satışı tamamlamamalı. `offer = ask + 1` gönderildiğinde `buyCar` çağrılmamalı. Hazırla → Vazgeç sonrası araç sheet'i açık kalmalı.
- **Kapsam dışı:** Genel bir "geri al" (undo) sistemi.

### 8. Pazarlık ekranının telefon düzenini düzelt [2/6: UX, GNÇ; 5 rol raporladı]
- **Sorun:** 390×844 ekranda sabit teklif paneli ekranın yaklaşık %40'ını, öğretici kartı ~90px daha kaplıyor. Sohbet ve hamleler için ~110-150px kalıyor. 11 hamleden 1,5'i görünüyor. Satışta karşı teklif gelince hamleler tamamen kayboluyor. Yeni cevap görünür alana kaymıyor. "İSTENEN" bloğu × düğmesiyle çakışıyor (UX, GEL, STR, FUT, KRK).
- **Çözüm:** `ui.js` `renderNeg()` / `renderSaleNeg()` ve `shell.html` CSS:
  - Hamleler yatay şerit yerine **2 sütunlu dikey ızgara** olur (kart yüksekliği ≤ 64px, kalan koz sayısı rozetle gösterilir).
  - Teklif paneli varsayılan olarak **tutar alanı + tek CTA** gösterir (≤ 140px). Hızlı düğmeler (±%5/10) ve önerilen tavan bir "▾" açılır alanına alınır.
  - Her yeni mesajdan sonra sohbet en alta kayar (`scrollIntoView` / `scrollTop = scrollHeight`).
  - Pazarlık sheet'i açıkken öğretici kartı sheet'in dışına (üst güvenli alana, tek satır) taşınır.
  - Hızlı düğmelerin neye göre hesaplandığı yazılır ("istenene göre −%5").
- **Kabul ölçütü:** `test/ux-test.js` 390×844 ekranda pazarlık sheet'i açıldığında: sohbet alanı ≥ 300px, en az 4 hamle kartı ekranda tamamen görünür, son mesaj görünür alanda, × düğmesi hiçbir öğe ile çakışmıyor (bounding box testi). Aynı ölçütler satış pazarlığında karşı teklif geldikten sonra da geçerli.
- **Kapsam dışı:** Pazarlık ekranının görsel yeniden tasarımı (yüz, animasyon); BUGÜN şeridi ve pazar ana ekranı (sonraya).

### 9. Toast kuyruğu ve ödül anları [2/6: UX, GNÇ; 6 rol raporladı]
- **Sorun:** 3-4 toast üst üste binip SATILDI damgasını ve "REKOR KÂR" yazısını kapatıyor (GEL, STR, UX). Öğretici kartı ve toast'lar sheet başlıklarını örtüyor. Seviye atlama, müzayedenin açılması, usta seviyesi ve kilometre taşları 2,2 saniyelik toast'larla geçip gidiyor (GNÇ, UX, FUT).
- **Çözüm:**
  - `ui.js` `toast()`: **kuyruk** kurulur. Aynı anda en fazla 1 toast görünür, sonraki 300ms arayla gelir. Aynı kaynaktan gelen ödüller (3 görev + ikramiye) tek toast'ta birleşir ("3 görev tamam · +₺31.000").
  - Deal özeti (`openDealSummary`) açıkken toast'lar bekletilir ve "Devam"a basılınca gösterilir.
  - **Seviye atlama** ve **yeni özellik açılışı** (müzayede, kredi, galeri) için tam ekran olmayan bir "kazanım kartı" (sheet) gösterilir: ne açıldı, nerede bulunur, "Git" düğmesi.
  - Kilometre taşı ve usta seviyesi kasa defterine (madde 3) yazılır.
- **Kabul ölçütü:** Sipariş teslimi senaryosunda (bu senaryo 4 toast üretiyor) ekranda hiçbir anda 1'den fazla toast olmamalı ve SATILDI damgası görünür kalmalı (Playwright ekran görüntüsü + DOM sayımı). Seviye 2'ye çıkınca kazanım kartı açılmalı.
- **Kapsam dışı:** Ses ve haptik yeniden tasarımı; kilometre taşı ödüllerinin büyütülmesi ve kozmetik ödüller (sonraya).

### 10. Sezon hedefini kademeli yap ve dengeyi 1, 2, 4 numaralı maddelerden sonra yeniden ayarla [2/6: GEL, STR; 5 rol raporladı]
- **Sorun:** Normal modda ₺350K hedef 3. ile 6. gün arasında geçiliyor (%206-364). FUT ise ₺315K ile hedefi kaçırdı. Hedef tek eşikli ve oyuncunun performansından bağımsız. Sezon kapanışında hedef sonucu ve ödülü görünmüyor (GEL, FUT).
- **Çözüm:**
  - `yangorev.js` `hedef()`: üç kademe **bronz / gümüş / altın = tutar × 0,6 / 1,0 / 1,6**. İlk sezonun `tutar` değeri `max(HEDEF.taban, sezonKirasi()*kiraKat, başlangıçNakdi × 0,20)` olur; Otoparkçı için yaklaşık ₺520K. Böylece FUT'un ₺315K'sı bronz sayılır, GEL'in ₺1,27M'si altının üstünde kalır.
  - Ödüller kademeli verilir: bronz kira dondurma, gümüş +%10 kira indirimi, altın +%25 kira indirimi ve 1 uzmanlık puanı.
  - Sezon kapanış ekranına "Hedef: ₺X / ₺Y · GÜMÜŞ" kartı ve sezon ligi ödül kartı eklenir. Başlık "Kış bitti" olur; gelen sezonun adı küçük puntoyla yazılır.
  - **Sıra:** Bu madde 1, 2 ve 4 numaralı maddeler uygulandıktan **sonra** sayısal olarak ayarlanır.
- **Sayısal hedef:** `test/denge.js` botunun Normal moddaki ilk sezonunda gümüşe ortalama **10-13. günde** ulaşması; altına ulaşma oranının ≤ %30 olması.
- **Kabul ölçütü:** Denge raporunda yukarıdaki iki metrik. Elle test: sezon kapanışında kademe kartı görünmeli.
- **Kapsam dışı:** Rakip galericilerin ölçeği ve lig yeniden tasarımı (sonraya); başlangıç nakdinin değiştirilmesi.

### 11. "Günün fırsatı" rozetini doğru araca ver [2/6: STR, KRK; FUT de raporladı]
- **Sorun:** "Günün fırsatı" rozeti %10-20 pahalı (Perrin 208, Logana, Sitronel) ve ağır hasarlı (Tanaro) araçlarda çıkıyor. KRK'ye göre "iki oyunda iki kez yalan söyledi". Rozet ile "~%17 pahalı" etiketi aynı kartta yer alıyor.
- **Çözüm:**
  - `gunlukritim.js` `gunlukKur()`: aday listesi filtrelenir: `!c.inspected && c.ask <= valueOf(c,false) × 0,95 && !ağırHasar(c)`. Bu koşulu sağlayan araç yoksa o gün fırsat rozeti verilmez.
  - Rozet seçildikten sonra uygulanan `reserve × 0,94` indirimi kalır.
  - "~%X ucuz (tahmin)" etiketi ekspertiz öncesinde "tahmin ±%Y" güven aralığıyla gösterilir.
- **Kabul ölçütü:** 1.000 günlük simülasyonda fırsat rozetli araçların %100'ünde `ask ≤ gerçekDeğer × 0,95` ve ağır hasar = 0 olmalı. Pazar ekranında rozet ve "pahalı" etiketi aynı kartta asla birlikte görünmemeli.
- **Kapsam dışı:** Diğer ilan rozetlerinin ("İddialı ilan" vb.) yeniden tasarımı.

### 12. Takaslı teklif ve takaslı kârı açık göster [2/6: GNÇ, KRK; FUT de raporladı]
- **Sorun:** Açılış teklifinin "takaslı" olduğu küçük gri bir etiketle gösteriliyor ve oyuncu fark etmeden araç alıyor (GNÇ, KRK). Satış özetinde takaslı kâr nakit gibi görünüyor ("+₺72.400", gerçek kâr yaklaşık 0). Takas aracı kartında birbiriyle çelişen üç değer var (₺189-366K, ₺275-339K, "kâr %72"; gerçek değer ₺201K) (FUT).
- **Çözüm:**
  - Teklif kartında ve pazarlık başlığında "TAKASLI: ₺{nakit} nakit + {araç} (biçilen ₺{claim})" iki satırda, vurgulu bir çiple gösterilir. "Nakit ısrar et" seçeneği aynı görünür alanda olur.
  - Satış özetinde (`openDealSummary`) "Nakit ₺X + Takas aracı (biçilen) ₺Y" ayrı satırlarda gösterilir. Sonuç "kâğıt üstünde: takas aracı satılınca netleşir" notunu taşır.
  - Ekspertizi yapılmamış takas aracında tek bir değer bandı ("Biçilen ₺186K · tahmini ₺X-Y") gösterilir. "Kâr %72" ve "tamir sonrası ₺491K +₺155K" gibi rakamlar ekspertiz yapılana kadar **gösterilmez**.
- **Kabul ölçütü:** Elle test (KRK'nin Perrin 208 senaryosu): pazarlıkta takas bilgisi ilk ekranda görünür olmalı; satış özetinde nakit ve araç ayrı satırlarda yer almalı. Ekspertizsiz takas aracının garaj kartında yalnızca tek bir aralık bulunmalı (DOM testi).
- **Kapsam dışı:** Takas olasılığı ve değerlemesinin yeniden dengelenmesi.

---

## Sonraya bırakılanlar

| Konu | Neden sonraya kaldı |
|---|---|
| **Bulut kaydı (Google Play Games / iCloud), hesap, bildirimler** (STR) | Tek HTML ve saf JS mimarisinde yerel sarmalayıcı ve hesap altyapısı gerekiyor; haftalar sürer. Mağaza yayını öncesi yol haritasına alındı. Ara çözüm olarak "kayıt dosyasını dışa aktar / paylaş" düğmesi değerlendirilebilir. |
| **Ekspertiz ücretinin araç değeriyle oranlı olması, Hızlı bakışın yeniden dengelenmesi** (GEL, UX, STR) | KRK'ye göre ₺2.500 gerçekçi; günlük hak önerisi KRK ve GNÇ tarafından reddedildi. Madde 2 ile 5 ekonomiyi değiştireceği için etkisi bu değişikliklerden sonra yeniden ölçülecek. |
| **Ölü stok baskısı ve tamir derinliği** (tamir süresi, atölye kuyruğu, başarısızlık riski) (GEL, STR) | KRK ve GNÇ "ilan bekletmek zaten sıkıcı" diyor. 1, 2 ve 4 numaralı maddeler kâr marjını düşüreceği için elde tutma maliyetinin göreli ağırlığı kendiliğinden artacak. Ayrı bir tasarım turu gerekiyor. |
| **Rakip galericilerin ölçeği, gerçek ya da asenkron lig, kilometre taşı ödüllerinin büyütülmesi** (FUT, STR, UX) | Tek oy aldı. Rakip ekonomisinin yeniden kurulması büyük bir iş; önce madde 10'daki hedef dengesi oturmalı. |
| **Pazar ana ekranı / BUGÜN şeridi (6-9 kart), kompakt liste görünümü** (UX, STR, KRK) | Pazarlık ekranıyla aynı anda iki büyük düzen değişikliği test yükünü artırır; bir sonraki UX turuna kaldı. |
| **Müzayede ve canlı açık artırmada değer çıpası** (muhammen açıklaması, tahmini aralık, rakip sayısı) (GEL, UX, FUT) | Zarf çökmesi yeni düzeltildi; önce müzayedenin denge verisi toplanmalı. |
| **Rapor/Defter adlandırması, uzmanlık düğmesi opaklığı, erişilebilirlik ayarları** (yazı boyutu, hareketi azaltma, ses ve titreşimin ayrılması) (UX) | Önemli ama "mutlaka" eşiğinin altında kaldı; erişilebilirlik ayrı bir sprintte toplu ele alınacak. |
| **Haftalık karne ölçütünün açıklanması, garaj boşken "Pazara git: N fırsat" kartı, garajın doğru alt sekmede açılması, "Günü bitir"in her sekmede görünmesi** (FUT, UX, GNÇ) | Küçük akış iyileştirmeleri; 8 ve 9 numaralı maddelerle birlikte yapılabilir, ama zorunlu değil. |
| **SATILDI ekranına paylaş düğmesi, araç gövde çeşitliliği, 3B sahnenin zenginleştirilmesi** (GNÇ) | Büyüme ve içerik işleri; temel denge düzelmeden yapılırsa önceliği yanlış olur. |
| **Gerçek cihazda 3B performans ölçümü** (GEL, GNÇ) | Bir hata kanıtı yok (swiftshader ölçümü temsil edici değil). Yayın öncesi orta segment Android cihazda ölçüm görevi olarak not edildi. |
| **Başlangıç nakdi ve "nakit az" açıklaması, arketip farkı; noter, devir ve ÖTV masrafları** (KRK, GEL) | Madde 2, 4 ve 10'dan sonra denge yeniden ölçülünce karar verilecek. |
| **Alıcı ve satıcı cümle çeşitliliği** (UX, GEL) | İçerik genişletme işi; madde 6 yalnızca yanlış ve çelişkili metinleri düzeltiyor. |
