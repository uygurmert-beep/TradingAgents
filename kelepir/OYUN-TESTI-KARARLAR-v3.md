# Kelepir v3: Ekip tartışması ve "MUTLAKA DEĞİŞMESİ GEREKENLER"

**Katılımcılar:** Oyun geliştirici / game designer (GEL), UX tasarımcısı (UX), Stratejist (STR), Futbol meraklısı / FM oyuncusu (FUT), 20 yaşında oyuncu (GNÇ), 40 yaşında oyuncu (KRK), **Araba tutkunu (ARB, yeni)**, **Galeri sahibi (GLR, yeni)**

**Moderatör notları**
- Sekiz rapor (canlı notlar ve özet bölümleri) baştan sona okundu. STR, FUT ve GLR'nin birer oturumu tarayıcı çökmesiyle kesildi. Üçü de bunun oyundan değil, paralel çalışan Chromium'dan kaynaklandığını not etti; gündeme alınmadı.
- Kod yalnızca okundu. Dosya ve fonksiyon adları `/home/user/TradingAgents/kelepir/oyun/` altındaki kaynağa göre verildi. Satır numarası verilmedi, çünkü çalışma kopyasında `game.js` ve `ui.js` şu an düzenleniyor (aşağıya bakın).
- Gerçek marka adları bu belgede de kullanılmadı. ARB'nin "esinlendiği araç" sütunu dahili bir not; plan bölümünde onun yerine teknik tarif kullanıldı (ör. "kayışlı eski sıra altı").
- `MODELS` tablosu elle yazılmıyor: `modeller-b.py` üretiyor (imza arızaları `imza_ariza()` ile yordamsal). Bu yüzden model verisi düzeltmeleri `modeller-b.py` üzerinden yapılmalı; `game.js` içindeki tablo elle değiştirilirse bir sonraki üretimde geri gelir.

**Ana geliştirici tarafından ZATEN düzeltiliyor (gündem dışı, tartışılmadı)**

| Konu | Raporlayan | Durum |
|---|---|---|
| Taksitli satış "ZARARINA SATILDI" görünüyor; kâr, karne, özsermaye, sezon bozuluyor | KRK, GLR | Uygulanıyor (`sellCar(…, alacak)`, `netWorth` alacağı sayıyor, `taksitKaybi`) |
| "Altına inmem / bundan aşağısı yok" sonrası aşağı inilmesi; karşı tekliften düşük teklifin kabulü | GEL, STR, FUT, GNÇ, ARB, GLR | Uygulanıyor (`sellerReply` içinde `n.tabanSoz`, ilk tur toleransı) |
| "Ortada buluşalım" metninin rakamla uyuşmaması | GEL, STR, KRK, GLR | Uygulanıyor (`doSaleOffer`, `doOffer`) |
| EV/hibrit/otomatikte imkânsız arızalar, aynı şanzımanın iki kez arızalanması | GEL, STR, ARB | Uygulanıyor (`genCar` → `uymaz`, revizyon/bakım çakışması) |
| Klasiklerin 45×5 ve arızasız çıkması | ARB | Uygulanıyor (`genCar` → `klasikHal`) |
| Alım sonrası kasanın kırmızı görünmesi | GEL, FUT, GNÇ, KRK, UX | Uygulanıyor |
| Garajın alım sonrası yanlış alt sekmede açılması | UX, FUT, GNÇ, KRK | Uygulanıyor |
| Hazırla'nın parça seçimini yok sayması | STR, GLR | Uygulanıyor |
| `meta charset` eksikliği | UX | Uygulanıyor |

Not: Çalışma kopyasındaki değişiklik koz sunulunca satıcının yeni rakamı söylemesini de kapsıyor (GNÇ'nin "koz boş cümle" şikâyeti). Bu konu da gündem dışı tutuldu.

---

## TUR 1: Gündem (tekilleştirilmiş bulgular)

### v2 kararlarının durumu (sekiz raporun ortak okuması)

| v2 kararı | v3'teki durum |
|---|---|
| 1. Karşı teklif monotonluğu | Satışta düzelmiş (FUT, KRK, GLR). Alıştaki "altına inmem" kısmı şu an uygulanıyor. |
| 2. Alış cömertliği %8-14 hedefi | **Tutmadı.** Ölçülen ortalama indirim %16-27 (aşağıda A1). "Satıcı ₺X'e de inerdi" kodda var ama oyuncuların çoğu görmedi (B3). |
| 3. Gider şeffaflığı | Büyük ölçüde tamam. Eksikler: vergi tabanı yazmıyor, abartılı ilan cezası gün raporuna girmiyor, ekspertiz maliyeti bedava ekspertizde de sayılıyor. |
| 4. Sipariş ödemesi | Kesinti teslimden önce gösterilmiyor (GNÇ: kartta ₺823,8K, kasaya ₺671K). Kaçan siparişte itibar hâlâ −1. |
| 5. Dürüstsüzlük bedeli | Çalışıyor, herkes olumlu. Ceza kasaya giriyor ama rapor ve anlaşma özetinde görünmüyor (STR). |
| 6. Metin/etiket | Çoğu tamam. Yeni kalıntılar A6 ve B7'de. |
| 7. Para kaybı korumaları | Toptan sat onayı ve Hazırla/Vazgeç çalışıyor. "Nakit ısrar et" ve takaslı kabul yeni delikler. |
| 8. Pazarlık ekranı | Kısmen yapıldı: 2 sütunlu ızgara geldi. **Ölçüt (sohbet ≥300px, ≥4 hamle görünür) sağlanmıyor** (UX, STR, FUT, KRK). |
| 9. Toast kuyruğu ve kazanım kartı | Kuyruk geldi. Kazanım kartı yok; bayat ve gecikmeli toast'lar duruyor. |
| 10. Kademeli sezon hedefi | Kademeler var. Hedef hâlâ 4-9. günde doluyor; kapanış ekranında kademe, ödül ve eksik tutar satırı yok. |
| 11. Günün fırsatı | Düzelmiş (UX, KRK: rozetli araçlar gerçekten ucuz çıktı). |
| 12. Takas şeffaflığı | Teklif kartı ve satış özeti çok iyi. Takaslı **pazarlıkta** fark etmeden kabul açığı var (UX). |

### A. Ekonomi ve pazarlık

| # | Konu | Raporlayan | Kanıt (raporlardan) | Kod tespiti |
|---|---|---|---|---|
| A1 | **Alış pazarlığı hâlâ çok cömert; koz yığmak deterministik indirim.** Acil/acemi satıcı ilk teklifte çöküyor, "fiyatımız nettir" diyen galerici bile −%22 veriyor. | **8/8** | Ortalama indirim istenen fiyattan: STR −%20 (temiz araçta −%12, hasarlıda −%32), FUT −%11..−%26, GLR −%23..−%27, ARB −%14..−%22, KRK Mikro −%24 tek hamlede. Stelvo 7 koz + övgü → −%31,8 ve sabır **arttı** (STR). Galerici Egeo ilk teklifte −%22 (ARB). Oberon (acil + fırsat) ilk teklif %77,5'te kabul (STR). Koz yalnız sert satıcıda sabır yiyor (STR, FUT). | **Kök neden:** v2 kararıyla `effReserve()` içindeki koz tavanı %15'e indi, ama arayüzdeki pazarlık bu fonksiyonu kullanmıyor. `ui.js` `negReserve()` → `c.reserve*(1-Math.min(.34,n.disc))`, ayrıca ruh hâliyle ±%10 oynuyor. `n.disc`'e koz, övgü (`.03*ego`), peşin nakit (`s.pesin`) ve kalkıp gitme (`.08`) birlikte ekleniyor. Koz sabır maliyeti yalnız `s.sert>.4 && usedKoz≥3`; acil (.20) ve acemi (.18) satıcıda hiç yok. Övgü sabrı geri veriyor. Günün fırsatı `reserve*0.94` (`gunlukritim.js`). Çalışma kopyasında `sellerReply` ilk tur toleransı eklenmiş (uygulanıyor), ama tabanın kendisi yerinde duruyor. |
| A2 | **Satış tarafı risksiz.** İlan fiyatını yazmak her zaman kabul alıyor; alıcı ilanın üstünü ödüyor. | 5 (STR, ARB, GLR, KRK, GEL) | STR 8 satışın 8'inde ilanın %98-100'ü; "Kabul et" düğmesi Stelvo'da ₺303K kaybettiriyor. ARB 4 satışın 3'ünde **ilan fiyatının üstünde** (Egeo gerçek değerin +%10'u). GLR: alıcı açılıştan +%4,6 çıkıp ilana yakın ödüyor. KRK: "ilanın tamamını iste, kazanıyorsun". | `game.js` `buyerCeiling()`: `tavanCap = sale.list*bt.sat.butce`. `BUYERS` içinde `butce` Meraklı 1,12, Şehir dışından 1,06, Aile 1,03, yani tavan ilanın üstüne çıkabiliyor. Alıcının satışta kozdan gördüğü etki ekranda yazmıyor (FUT, KRK). |
| A3 | **Boş günler.** "Teklif gelmedi" art arda geliyor, oyuncuya yapacak iş kalmıyor ve neden olduğu söylenmiyor. | 6 (GEL, FUT, GNÇ, KRK, GLR, STR) | GEL 23 günün 13'ü (%56) boş. GNÇ 6 gün art arda boş ("sabırsız oyuncu 3. günde bırakır"). KRK: değer ₺769K'dan ₺703K'ya düşmüş, ilan %6 pahalı kalmış, bunu kendisi bulmuş. Boş garajda bile "Satıştakileri aç" (GNÇ). Toptan parti ₺7,3M'lik teklifi kasa ₺1,6M iken her gün geliyor (STR). | `ui.js` `openReport()` boş blok sabit metin. `pencereSerit()` / `satisPenceresi()` ilan fiyatı ile piyasa değeri farkını göstermiyor. `piyasa.js` `nabizKat` değeri günden güne oynatıyor ama karta yansımıyor. `yangorev.js` `partiUret()` kasayı hiç kontrol etmiyor. |
| A4 | **Müzayede kör kumar.** Muhammen ucuz bir çıpa, rakipler değerin üstüne çıkıyor. | 6 (STR, FUT, GNÇ, KRK, GLR, GEL) | Rakip zarfı muhammenin +%32..+%41'i (GEL, GNÇ, KRK, FUT); Trax'ta %134 (GLR). STR muhammenin gerçek değerin **tam %70'i** olduğunu 4/4 araçta doğruladı. Canlı artırmada hiç değer bilgisi yok (FUT). Sonuçta aracın gerçek değeri açıklanmıyor. | `ui.js` muhammen = `valueOf(c,true)*0.7`. `resolveAuction()` rakip zarfı = `av*def.bid*rnd(.94,1.10)` (segmente uyan rakip), yani görünen değerin %75-105'i ve muhammenin 1,07-1,50 katı. `canli.js` `canliRakipler()` aynı model, açılış `valueOf*0.45`. |
| A5 | **Para kaybettiren tek dokunuşlar.** | 5 (UX, STR, KRK, GNÇ, GLR) | "Nakit ısrar et" ₺443K'lık teklifi uyarısız sildi (UX), ₺556K nakit teklifi sildi; zaten nakit olan taksitli teklifte bu düğmenin anlamı yok (KRK); −₺57K'yı sessizce kesti (STR). Takaslı pazarlıkta ilan fiyatı yazılınca anlaşma takaslı kapandı (UX, 2 kez). "Teklif ona çekildi" uyarısıyla onaysız alım (GNÇ). Hazırla, beklenen kârı −₺42,8K olan ilanı uyarısız kurdu (GNÇ). Kabul anında onay yok (GLR). | `ui.js` `a==="onlycash"`: `chance(.42)` ile teklif düşüyor, aksi hâlde tutar ×0,94; düğmede risk yazmıyor. `offerCard()` taksitli teklifte "Kabul et" yerine yalnız "Taksitle sat" ve "Nakit ısrar et" gösteriyor. `doOffer()`: teklif `ust`'u aşınca kırpılıp **gönderiliyor**. `kolay.js` `hazirlaYap()` `sonuc.kar<0` iken durmuyor. |
| A6 | **Sipariş: kartta yazan ile ödenen farklı; itibar sessizce kesiliyor.** | 3 (GNÇ; FUT ve KRK itibar kısmını raporladı) | Kartta "Bütçe+prim ₺1.831.500", düğmede "Teslim et ₺823.800", kasaya giren ₺671.000; itibar 50'den 46'ya düştü, özet "İtibar 0" dedi (GNÇ). Kabul edilmemiş siparişte iki kez −1 (FUT). | `ui.js` `orderQuality()`; teslim düğmesi önizleme (`onizleme`) tutarını değil bütçeyi gösteriyor. Kaçan siparişte −0,5/0 kararı (v2 #4) uygulanmamış. |
| A7 | **Karne, sezon kapanışı ve lig yanlış sinyal veriyor.** | 6 (GEL, STR, FUT, GNÇ, KRK, UX) | Haftada +₺477K → "C, marj dar" (GEL); +₺664K → C (STR). Sezon kapanış haftası kira ve vergiyle D oluyor (GEL). Vergi tabanı yazmıyor; zararlı sezonda vergi kesiliyor (FUT, KRK). Sezon ligi ödülü ve kademe/eksik tutar kapanışta yok (FUT, KRK). Rakipler ₺13-45M, oyuncu ₺3M, "5." hiç kıpırdamıyor (GEL, FUT, GNÇ, KRK). "En iyi %73'lük dilim" 44/61 için ters okunuyor (FUT). | `karne.js` `karneNot()` büyümeyi `netWorth` farkından alıyor; sezon kirası ve vergi o haftaya düşünce not çöküyor. `sirala.js` `dilim` metni. `koleksiyon.js` / `standings()` "Piyasadaki galeriler" dev rakipleri listeliyor. |
| A8 | Ekspertiz bedeli araç değerinden bağımsız. | 4 (STR, GLR, GEL, FUT) | ₺1M araçta ₺2.500, ₺2,6M araçta ₺2.000 (STR). Gerçekte ₺3-6K sabit (GLR). Görev ödülü ₺7K ekspertiz bedelinin 2,8 katı (FUT). | `eksperFiyat()` Hakan seviyesine bağlı. |
| A9 | Tamir anında bitiyor, getirisi yüksek; orijinal parça hiç seçilmiyor. | 3 (STR, GLR, GEL) | Çıkma parça orijinalin 3 katı net kazanç bırakıyor (STR: Golfo, Oberon, Stelvo). Komple boya ₺82K → değer +₺177K (GLR). | `PARCA` katsayıları, `repairGain()`. |
| A10 | Emanet (konsinye) neredeyse risksiz serbest kâr. | 3 (STR, GLR, FUT) | 3/3 kârlı, +₺157-300K (STR). "Süre dolarsa sahibi yarısını öder" kimin neyi ödediği belirsiz (FUT, STR). | `konsinye.js` `KONS_SAHIP.net` [.80-.97]. |
| A11 | Toptan satış hep zarar; toptan parti çoğunlukla alınamıyor. | 3 (GLR, STR, FUT) | Toptan değerin %82'si (GLR: gerçekte %92-96). | `ui.js` `a==="wholesale"` → `valueOf*0.82`. |
| A12 | Günlük ödül ekonomisi (vaka ₺31K, görevler, ₺600 kilometre taşı) oransız. | 2 (FUT, KRK) | 20 saniyelik vaka bir ticaretin yarısı kadar kazandırıyor; "İlk satış ₺600" komik. | `meydan.js`, `gunlukritim.js`, `MILESTONES`. |

### B. Arayüz ve akış

| # | Konu | Raporlayan | Kanıt | Kod tespiti |
|---|---|---|---|---|
| B1 | **Pazarlık ekranı telefonda hâlâ sıkışık.** Karşı teklif gelince panel ekranın %31-45'ini kaplıyor, son mesaj panelin altında kalıyor, kaydırınca başlık ile satıcı kartı üst üste biniyor. | 6 (UX, STR, FUT, KRK, GEL, GNÇ) | Panel 584-844px (260px); sohbet ve hamleler için ~190px kalıyor (UX). 6 hamlenin 2'si görünüyor (FUT, KRK). Son balon panelin altında, `scrollTop=0` (UX). Satıcı kartı ~160-270px (UX, FUT). "İSTENEN" son karşı teklifi göstermiyor (UX). Senetle öde satırı paneli %45'e çıkarıyor (STR). | `ui.js` `renderNeg()`: `section.sahne` (araç fotoğrafı + yüz kartı) + `block` (ruh hâli/sabır) + `actionbar kompakt` (ruler + 5 hızlı düğme + girdi + kabul). `talkAlta()` var ama satış tarafında son balon görünmüyor. `.sheet-head` saydam. |
| B2 | **Pazar ana ekranı.** İlk ilan y≈520px'te başlıyor, "Önerilen" bütçeye bakmıyor, BUGÜN şeridi 8-10 karta çıktı. | 6 (UX, FUT, GNÇ, KRK, STR, ARB) | Kasa ₺2,1M iken en üstte ₺7,12M'lik ilan (UX, 5 gün boyunca); GNÇ ve FUT'ta da ilk kart bütçe dışı. Ekranda 1-2 ilan (UX, KRK). Şerit 10 kart (FUT). Kartta vites ve yakıt yok (ARB). Kompakt liste yok (UX, KRK). Fırsat filtresi yok (STR). | `ui.js` `siralaListe()`: `"onerilen"` hiçbir sıralama yapmıyor, pazar dizisinin sırasını aynen veriyor. `viewPazar()` BUGÜN şeridi `KANCA.ray` kartlarını öncelik vermeden diziyor. `cardHtml()` kart künyesi. |
| B3 | **Sahip olunan araç sayfası sırası ve sabit alanları.** | 2 (UX, FUT) | Ekspertizsiz araçta ilk blok Tamir atölyesi; Hazırla 1-2 ekran aşağıda (UX), FUT'ta 4-6 ekran aşağıda. Sabit başlık 135px + alt bar 165px; içerik penceresi %57. "Toptan sat" birincil düğme kadar ağır. | `ui.js` `openOwnCar()` blok sırası; `kolay.js` `hazirlaKart()`. |
| B4 | **Alım anı ve ödül anları kayboluyor.** | 5 (UX, GNÇ, KRK, FUT, GLR) | "Satıcı ₺X'e de inerdi" görülmedi (UX, FUT, KRK, GEL), çünkü sheet kapanıyor. Seviye 2'de kazanım kartı yok (UX, GNÇ, KRK). Bayat toast'lar: bir gün sonra "İlk satış ₺600", "satıldı" (UX, GNÇ). Sekme değişince "Galeri seviye 3'te" toast'u Ayarlar'da kalıyor (UX). REKOR KÂR yazısı satırların üstüne biniyor ve 2. satışta bile çıkıyor (UX, GLR). | `doOffer()` kabul dalı: sheet 600ms'de kapanıyor, "inerdi" toast'u 900ms'de geliyor. `sellCar()` seviye atlayınca yalnız `toast()`. `toast()` kuyruğu gün ve sekme damgası taşımıyor. |
| B5 | **"Günü bitir" her yerde değil; modal arkasından gün ilerleyebiliyor.** | 6 (UX, STR, FUT, KRK, ARB, GNÇ) | Müzayede, Galeri, Rapor, Ayarlar sekmelerinde yok (herkes). 3B gezde düğme 0×0 boyutlu; 3B tercihi sekmeler arasında yapışıyor (ARB). Karne açıkken HUD eski günü gösteriyor ve gün 3 kez ilerledi (ARB, GNÇ). Sekme adı "Rapor", sayfa başlığı "Defter" (UX, KRK). | `ui.js` `endday` düğmesi yalnız `viewPazar()` ve `viewGaraj()` içinde. `can3d()` pazar ve garaj için ortak. `TABLBL.rapor="Rapor"`. |
| B6 | **Okunabilirlik.** Yazı boyutu ayarı yok, ikincil metin 10-12px soluk gri; sürekli nabız animasyonu. | 4 (KRK, UX, GNÇ, ARB) | KRK bunu rolü için KRİTİK sayıyor. "Kira 28K/141" kırpılıyor (KRK). "Atla" ~40×20px, × 36px (UX). Nabız animasyonu düğmeyi "stabil değil" yapıyor (ARB). | `shell.html` sabit px ölçüleri; Ayarlar'da yazı boyutu ve hareket seçeneği yok. |
| B7 | **Küçük metin ve rakam tutarsızlıkları.** | 6 | 2 arızalı araçta "Ekspertiz temiz çıktı" (UX). Bedava ekspertizde maliyete ₺2.500 ekleniyor (KRK, FUT, GLR). Hazırla toast'u ₺108K, kart ₺92,3K (FUT). Km'si oynanmış ve 269 bin km'lik klasikte "Yaşına göre düşük km" kozu (GNÇ, ARB). Dürüst teslimde "kusuru gizleyerek kazandın" (GNÇ). Abartılı ilan cezası gün raporunun "Kasa hareketi"ne ve anlaşmanın "Sonuç"una girmiyor; yakalanınca ilan dili değişmediği için ceza ertesi gün yine kesiliyor (STR). Görülmemiş teklif "düştü" diye raporlanıyor (GEL). Vaka alt başlığında ISO tarih (UX). | `ekspMaliyet()` var ama `c.ekspBedel` her yolda yazılmıyor (doğrulanacak). `saleLeverage()` km kozu `bekKm` formülü. Ceza `kasaNot()` ile kesiliyor ama `rep.costs`'a girmiyor. |
| B8 | Kilitli Galeri sekmesi boş sayfa; ilerleme bilgisi yok. | 2 (UX, GNÇ) | "Seviye 3'te açılır" yazıyor, oysa sekme 12. günde de açılıyor; XP çubuğu yok. | `unlocked("galeri")` → `level()>=3 || S.day>=12`; `lockedView()` bunu söylemiyor. |

### C. Araç karakteri (ARB + GEL) ve gerçekçilik (GLR)

| # | Konu | Raporlayan | Kanıt | Kod tespiti |
|---|---|---|---|---|
| C1 | **Modelin karakteri oynanışa yansımıyor.** Görsel kimlik güçlü, mekanik kimlik zayıf. | 2 (GEL KRİTİK, ARB) | GEL'in 4.000 araçlık ölçümü: model başına beklenen arıza 1,2-2,8 (sapma 0,38); `rel` ile arıza maliyeti korelasyonu −0,10. "Galericinin defteri" 24 günde hiç konuşmadı. Bilinen dert oyuncuya gösterilmiyor. | `MODELS` alanları `dem`, `rel`, `zf` (2 imza), `km` (eşik) ve `g`. İmza arızası `modeller-b.py` `imza_ariza()` ile markadan yordamsal türüyor; modelin gerçek derdini taşımıyor. `ui.js` `notBilgi()` en az 2 gözlem istiyor. |
| C2 | **Model verisinde hatalar.** | 2 (ARB, GEL) | Üretimi bitmiş modelin 2020 ilanı (Linas). Zincirli motorda "Triger seti" (190, Mk1, Linas). Kayışlı klasikte triger yok (E30). Ad ile yıl uyuşmuyor (208 1.5 Dizel 2013). Hibrit modelin yıl aralığı fazla geniş (Aurin). EV talebi ve değeri fazla iyimser (`dem` 1,04-1,10, `valueOf` ×1,02). | `modeller-b.py` `ek(...)` satırları ve `imza_ariza()`; `game.js` `baseValue()` yakıta göre ayrışmıyor. |
| C3 | **Satıcı ve alıcı tipi modelden bağımsız.** | 3 (ARB, GEL, GLR) | 1985 klasik "Filo çıkışı"; 2024 araç "Koleksiyoncu" (ARB). ₺1,74M'lik hibriti "bütçem kısıtlı" genç sürücü aldı; ₺2,3M'lik premium sedanı "işte kullanacağım" esnaf aldı (GEL). Pazarın 5/9'u acil satıcı (GLR). | `game.js` `weightedSeller()` parametresiz. `pickBuyerType(seg)` yalnız segmente bakıyor. |
| C4 | **Gerçek ticaretle fark.** | 1 (GLR), tartışmada GEL ve GNÇ | Satış süresi gerçekte 3-6 hafta, oyunda 1-2 gün. Tamir 2-10 gün sürer ve çoğunlukla maliyetini ancak çıkarır. Toptan değerin %92-96'sı. Temerrütte araç geri alınır. Kapora yaygın. Müzayedede kazanan muhammenin %105-125'i, teminat var. | Tur 2, Konu 2. |

---

## TUR 2: Tartışma

### Konu 1: Alış pazarlığı (A1). Sekiz kişinin sekizi aynı şeyi söylüyor

- **GEL:** Bu kez sorun parametrede değil, bağlantıda. Geçen tur `effReserve()` tavanını %15'e çektik; ama `ui.js` pazarlığı kendi `negReserve()` fonksiyonuyla yürütüyor ve orada tavan hâlâ %34. Üstüne ruh hâli ±%10 ekliyor. Koz, övgü, peşin nakit ve kalkıp gitme aynı `n.disc` havuzuna akıyor. Yani v2 kararı kâğıt üstünde kaldı.
- **GLR:** On beş yıldır galericiyim. Ekspertiz kozunu görünce satıcı "o zaman beş on bin eksik ver" der, yüz bin değil. Galericiden %5-8, duygusal sahipten %8-12 inersin; %15'in üstü ayda bir iki kez çıkan gerçekten borçlu satıcıdır. Oyunda pazarın yarısı "acil".
- **GNÇ:** Gerçekçi olsun diye her araçta beş tur uğraştırırsanız bırakırım. Hızlı pazarlık oyunun en iyi yanı. Ama "ilanın %25 altını yaz, bitti" de 3. arabada sıkıcı oldu, kabul.
- **STR:** Benim derdim sömürü. Hasarlı araçta yedi koz art arda, sabır düşmüyor, övgü sabrı geri veriyor: −%32. Temiz araçta ise dört turluk, gerçekten iyi bir pazarlık çıkıyor (Orvell −%12). Yani oyun "kusurlu araç avla" diyor.
- **KRK:** Acil satıcının kolay inmesi gerçekçi, onu bozmayın. Ama "fiyatımız nettir" diyen galerici ilk teklifte −%22 veriyorsa ekrana güvenmem.
- **ARB:** Aynı gözlem. Duygusal 190 sahibi gerçek bir karşı teklif verdi ve harikaydı. Sorun satıcı tipleri arasındaki farkın kozla silinmesi.
- **FUT:** Bir ekleme: "Tavan" düğmesindeki rakam Pandora'da karşı teklifle birebir aynı çıktı. Bu bilgiyi sızdırıyor gibi.
- **GEL (kod):** `onerilenTeklif()` rezervden değil değerden hesaplanıyor; aynılık rastlantı. Tavan kalsın.
- **UX:** Kozun sabır maliyeti varsa kartın üstünde yazmalı. Koleksiyoncuyla STR ve FUT bunu sonradan öğrendi ve aracı kaybetti.
- **Uzlaşma:** Tur sayısı artmıyor (GNÇ'nin şartı). Koz havuzunun tavanı **satıcı tipine göre** konuyor: kolay satıcı kolay kalıyor, sert satıcı sertleşiyor (KRK, GLR). Kozlar azalan getiriyle çalışıyor; kolay satıcıda da 4. kozdan itibaren sabır yiyor ve bu kartta yazıyor (STR, UX). GLR'nin %5-12'lik gerçek bandı "Gerçekçi" mod için hedef; Normal mod biraz daha cömert kalıyor (GNÇ). **8/8 destek.**

### Konu 2: Gerçekçilik ile eğlence (GLR ile GEL ve GNÇ)

- **GLR:** Oyunda 2,6M sermayeyle beş günde %19 kazanılıyor; gerçekte ilk ay %6-9 olur, yani oyun yaklaşık 20 kat hızlı. Satış süresi, tamir süresi, sermaye maliyeti, toptan fiyatı, kapora, temerrütte aracın geri alınması: hepsi gerçek hayatın kalbi.
- **GEL:** 20 kat hız tasarım gereği; 15 günlük sezon ancak böyle işler. Benim ölçütüm şu: gerçekçilik bir **karar** üretiyorsa girer, yalnız **bekleme** üretiyorsa girmez. Satış süresini 3 haftaya çekmek karar üretmez; zaten en büyük şikâyetimiz boş günler.
- **GNÇ:** Aynen. Tamir için 3 gün beklemek sadece "Günü bitir"e üç kez basmak demek. Ama alıcının ilanın üstünü ödemesi bana da saçma geldi. O tür gerçekçilik oyunu daha iyi yapıyor.
- **GLR:** Peki. O zaman alıcı tavanı (ilanın üstü yok), müzayedede kazanılabilir rakip zarfı ve alış bandı girsin. Tamir süresi ile satış hızı girmesin. Toptanı da "yavaş araç için çıkış kapısı" yapalım: %92-94, ama kâr hep küçük.
- **STR:** Toptan %92 olursa, beklemek yerine her aracı galericiye satıp devir hızını şişiren bir strateji doğar. Önce alış ve satış dengesini oturtalım, sonra toptanı ölçelim.
- **GEL:** Katılıyorum. Temerrüt ve banka kredisi de taksit düzeltmesiyle aynı yerde; o iş bitmeden yeni katman koymayalım.
- **KRK:** Benim tek isteğim: oyun bana yalan söylemesin. Gerçekçilik derken onu anlıyorum.
- **Uzlaşma (ölçüt):** *Bir gerçeklik kuralı oyuncuya yeni bir karar veriyorsa ya da ekrandaki bir yalanı düzeltiyorsa bu tura girer; yalnızca bekleme ya da evrak üretiyorsa girmez.* Bu tura girenler: satış tavanı (karar 6), müzayede bandı (karar 8), satıcı tipine göre alış bandı (karar 1), satıcı-model uyumu (karar 9). Girmeyenler: tamir süresi, Normal modda satış hızının düşürülmesi, noter/harç/KDV, teminat. Toptan fiyatı, kapora, temerrütte aracın geri dönmesi ve sermaye maliyeti satırı **sonraya** kaldı. GLR "mantıklı bir süzgeç" dedi ve şerh düşmedi.

### Konu 3: Satış tarafı (A2)

- **STR:** Satış pazarlığında bir risk yok. Koz sun, ilanın %98'ini yaz, satıldı: 8'de 8. Alıcının açılışına "Kabul et" demek ise tuzak.
- **ARB:** Daha kötüsü, alıcı ilanın üstünü ödüyor. Kodda tavanın üst sınırı ilan × bütçe katsayısı; Meraklı'da bu 1,12.
- **GNÇ:** Satışı da zorlaştırırsanız ve boş günler de varsa oyun ölür.
- **FUT:** Alıcının gitmesi de güzel bir FM anı, ama "son sözüm" uyarısı olmadan gitmemeli. Alış tarafında satıcı uyarıyor, satışta alıcı uyarmıyor.
- **GLR:** Alıcı ilanın %5-10 altını ister, çoğu son anda %3-5 iner. İlanı tam yazmak bazen tutmalı, her zaman değil.
- **GEL:** Açılışa dokunmayalım, yalnız tepeyi kesip tavanı ilanın %95-100'ü arasında satış başına bir kez çekelim. Kozun etkisi de "+₺X tavan" diye yazsın; o zaman koz bir anlam taşır.
- **Uzlaşma:** Tavan ilanı asla aşmıyor (taksit hariç). İlanın tamamını istemek yaklaşık yarı yarıya tutuyor. İlgi eşiğe inince alıcı bir tur önce "son sözüm" diyor (FUT). Açılış teklifleri değişmiyor (GNÇ). **STR, ARB, GLR, GEL oyu; GNÇ şartlı destek.**

### Konu 4: Boş günler (A3)

- **GEL:** 23 günün 13'ü boş. Bekleme anlamlı olmalı: oyuncu neden teklif gelmediğini ve ne yapabileceğini görmeli.
- **KRK:** Benim aracımın değeri 8 günde %8,6 düştü ve ilanım pahalı kaldı. Bunu kendim keşfettim. "Fiyatı kırın" diyor ama ne kadar kıracağımı söylemiyor.
- **GLR:** "Bekleyen araba kâr eritir" cümlesi karnede var ve çok doğru, korunsun. Ama sayı yok.
- **GNÇ:** Garaj boşken "Satıştakileri aç" demesi de komik. Bana pazarı göstersin.
- **FUT:** Bir de toptan parti: param yokken her gün geliyor ve kaçıyor. Gürültü.
- **STR:** Otomatik fiyat kırma önermesin, oyuncu kendi karar versin. Tek dokunuşluk bir öneri yeter.
- **KRK:** "3 gün bekle" düğmesi de olsun.
- **GEL:** Toplu gün geçirmek olayları, siparişleri ve emanet sürelerini atlatır; riskli. Bu tura almayalım.
- **Uzlaşma:** Garaj kartında "%X pahalı" şeridi ve tek dokunuşla önerilen fiyat; gün raporunda araç başına neden ve öneri; boş garajda "Pazara git"; toptan parti yalnız alınabiliyorsa gelsin. "3 gün bekle" sonraya kaldı. **5 oy.**

### Konu 5: Pazarlık ekranı ve pazar ana ekranı (B1, B2, B3). İki büyük düzen işi aynı turda mı?

- **UX:** Geçen tur pazar ana ekranını "test yükü" diye erteledik. Bu tur 6 kişi aynı şeyi yazdı: ilk ekranda tek ilan var ve o da alınamayacak bir araç. Pazarlık ekranının ölçütü de tutmadı. İkisi de yapılmalı.
- **GEL:** Riskleri farklı. Pazar tarafında asıl kazanç `siralaListe()` içindeki "önerilen"in sıralama yapması: bu tek satırlık iş. Şerit kısıtı ve kompakt satır CSS işi. Pazarlıkta ise `renderNeg` başlığını satış tarafındaki kompakt başlıkla değiştirmek yeterli. Ayrı commitlerde, ayrı ekran görüntüsü testleriyle yapılabilir.
- **KRK:** Sahibinden tarzı liste olsun: küçük foto, model, km, fiyat. Ekranda 5-6 ilan görmek istiyorum.
- **GNÇ:** Ben büyük fotoğrafı seviyorum, 3B fotoğraf oyunun havası.
- **UX:** O zaman seçici olsun, kompakt varsayılan. Büyük kart "Fotoğraf" modu.
- **ARB:** Kartta "Dizel · Otomatik" yazmıyorsa araç karakterini anlatmanın anlamı yok. Künye çipi şart.
- **FUT:** Şeridin sırası da önemli: süresi dolan ve para kazandıran kart başta olsun, "Piyasa nabzı" ile "Sanayi günü" tek kartta birleşsin.
- **UX:** Sahip olunan araç sayfası da aynı sorunu taşıyor: Hazırla, atölyenin altında kalıyor.
- **Uzlaşma:** Pazar (karar 4a), araç sayfası (karar 4b) ve pazarlık ekranı (karar 5) üç ayrı iş ve üç ayrı test olarak yapılıyor. Kompakt liste varsayılan, "Fotoğraf" modu seçilebilir (GNÇ). Pazarlık ekranının oyu 3 olsa da moderatör onu 5. sıraya aldı: v2 kararı 8'in ölçütü karşılanmadı ve oyunun kalbindeki ekran.

### Konu 6: Araç karakteri (C1-C3). ARB, GEL, GLR, FUT

- **ARB:** Elimde 33 satırlık bir düzeltme tablosu var. En hızlı kazanç veri: zincirli motora triger yazılmış, kayışlı motorda triger yok; üretimi bitmiş model 2020 ilanıyla çıkıyor; EV talebi gerçeğin tersi.
- **GEL:** Veri düzeltmesi tek başına görünmez. Bu tur 4.000 araçlık ölçümde gördüm: model farkı gürültü içinde kalıyor çünkü oyuncu imza arızasını hiç görmüyor. En ucuz iki kol: (1) pazar kartında ve araç sayfasında "bilinen dert" satırı, (2) satıcı ve alıcı tipinin modele bağlanması. Önce bunlar, sonra veri.
- **ARB:** Tersini savunurum. Yanlış veriyi görünür yaparsan yalanı büyütmüş olursun. "Bu modelde bilinen: triger" yazan satır zincirli motorda kalırsa araba bilen herkes güler.
- **GEL:** Haklısın. O zaman sıra veri ve görünürlük birlikte olsun: önce veri, aynı commit dizisinde görünürlük.
- **GEL (kod):** İki uyarı. Birincisi, `MODELS` `modeller-b.py`'den üretiliyor; düzeltmeler oraya `ZF_ELLE` adında bir elle düzeltme tablosuyla girmeli. İkincisi, kayıtta araç modeli **dizi indeksiyle** saklanıyor (`MODELS.indexOf`), koleksiyon ve defter ise **model adıyla** tutuluyor; ayrıca 2B/3B çizim tohumu addan türüyor. Yeni model eklemek ya da ad değiştirmek (ARB'nin "3.0 değil 6.0", "2.0 değil 2.2" önerileri) eski kayıtları ve aracın görünüşünü değiştirir. Bunları sonraya bırakalım.
- **ARB:** Kabul, adlar beklesin. Ama yeni arıza kalemlerinden en az ikisi şart: zincirli motor için "zincir seti" ve lüks/SUV için "hava süspansiyonu".
- **GEL:** İkisi tamam, ama "yalnız imza" bayrağıyla: yalnızca `zf` listesinde olan modelde çıksınlar, genel havuza karışmasınlar. Çift kavramalı şanzıman (`sz`) ve yıla göre vites oranı (`gy`) güzel fikirler ama yeni bir alan, yeni bir arıza ve yeni bir koz demek; ayrı tur.
- **GLR:** Satıcı-model uyumu gerçeklik açısından en önemlisi. 1985 model aracı filo satmaz, 2024 aracı koleksiyoncu satmaz. Bunu ayrıca "acil satıcı oranı" ayarıyla birlikte yapın: pazarın yarısı acil olunca alış dengesi de bozuluyor.
- **FUT:** "Ustaya sor ₺X" gibi ücretli bir bilgi daha FM'vari olurdu.
- **ARB:** Araba bilen biri bu bilgiyi zaten bilir; ücretli yaparsan bilen oyuncuyu cezalandırırsın. Model adı açık, kronik dert de açık olmalı. Bu araçta olup olmadığını ekspertiz söyler.
- **GEL:** ARB'ye katılıyorum. Bilinen dert açık; bu araçta var mı sorusunu ekspertiz cevaplıyor. Böylece ekspertizin değeri de artıyor.
- **Uzlaşma:** Bu turda veri düzeltmesi + iki yeni imza arızası + "bilinen dert" satırı + satıcı ve alıcı tipinin modele bağlanması (karar 9). Klasik hâl değer çarpanı ve EV değer eğrisi de planın sonunda, zaman kalırsa. Ayrıntı **Bölüm 4**'te.

### Konu 7: Müzayede (A4)

- **FUT:** FM'de açık artırmanın tadı "değeri biliyorum, tavanımı koyuyorum" demektir. Burada muhammen yanlış çıpa ve canlı artırmada hiç çıpa yok.
- **GLR:** Gerçek ihalede kazanan muhammenin %105-125'ini verir; değerin üstünü kimse vermez, çünkü kâr edemez. Bir de teminat olmalı.
- **STR:** Muhammen = değer × 0,70 ve rakip değerin yaklaşık %95'ini veriyor. Pazarda pazarlıkla −%20 alınabilirken müzayede ekonomik olarak ölü bir sistem.
- **GEL:** Karar 1 pazarı sertleştirince müzayede doğal olarak cazipleşecek. O yüzden rakip zarfını gerçek değerin %85-102'sine sabitlemek yeterli; kazanana bir de marj kalsın.
- **GNÇ:** Kaybedince "Tamam" diyor ve bitiyor. Ne kadar vermem gerektiğini söylesin.
- **Uzlaşma:** Değer bandı, rakip zarf bandı ve sonuç ekranında gerçek değer. Teminat sonraya kaldı (GLR kabul etti: "önce kazanılabilir olsun"). **4 oy.**

### Konu 8: Ekspertiz bedeli (A8). Üçüncü kez gündemde

- **STR:** ₺2,6M'lik araçta ₺2.000, bilgi değeri ise ~₺189K. Her araca tam ekspertiz yapmak her zaman doğru, yani bir karar yok.
- **GLR:** Gerçekte ₺3-6K ve sabit bir ücret. Oranlı ücret gerçekçi değil.
- **KRK:** Geçen tur da söyledim: ₺2.500 hissediliyor, iyi.
- **GEL:** Karar 1 ile alış marjı düşünce ekspertizin göreli maliyeti kendiliğinden artacak. Ondan önce dokunmayalım.
- **Sonuç:** Oy almadı, **sonraya** kaldı. Yalnız "bedava ekspertizde maliyete ₺2.500 eklenmesi" hatası karar 7'deki pakete girdi.

### Konu 9: İlerleme hızı (B4, B8)

- **GNÇ:** On bir günde yeni sistem açılmadı, seviye 2'de kutlama yok. Galeri boş bir sayfa.
- **STR:** XP eğrisini oyuncunun hızına göre gevşetirsek ilk saatin tempo sorunu ilerlemenin içine kayar.
- **GEL (kod):** Galeri zaten 12. günde açılıyor, ama ekran "Seviye 3" diyor. Asıl sorun bilginin söylenmemesi. Eşiği 350'den 280'e çekmek GNÇ'nin hedefini karşılar; eğrinin geri kalanına dokunmayalım.
- **Uzlaşma:** Kazanım kartı, kilitli sekmede ilerleme bilgisi ve 3. seviye eşiği 280 XP (karar 11).

### Konu 10: Okunabilirlik (B6)

- **KRK:** Benim için kritik: 11px gri yazıyı okuyamıyorum.
- **UX:** Sadece büyütmek yetmez; 390px'te taşma olur. İkincil metin sınıfları tek bir değişkene bağlansın.
- **GEL:** `zoom` kullanmayalım; 3B tuvalini ve sabit konumlu öğeleri bozar. Küçük metin sınıflarını `calc(Npx*var(--yk))` ile ölçekleyelim.
- **ARB:** Hareketi azalt seçeneği de olsun; nabız animasyonu hem göz yoruyor hem otomasyonu bozuyor.
- **Uzlaşma:** Karar 13. **UX ve KRK oyu.**

---

## TUR 3: Oylama ve MUTLAKA DEĞİŞMESİ GEREKENLER

Her rol 6 oy verdi (8 × 6 = 48 oy).

| Konu | GEL | UX | STR | FUT | GNÇ | KRK | ARB | GLR | **Toplam** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| A1 Alış pazarlığı dengesi | ● | | ● | ● | | ● | ● | ● | **6** |
| A3 Boş günler / fiyat geri bildirimi | ● | | | ● | ● | ● | | ● | **5** |
| A5 Para kaybettiren tek dokunuşlar | | ● | ● | | ● | ● | | ● | **5** |
| B2+B3 Pazar ana ekranı ve araç sayfası | | ● | ● | ● | ● | | ● | | **5** |
| A2 Satış tavanı | ● | | ● | | | | ● | ● | **4** |
| A4 Müzayede çıpası | | | ● | ● | ● | | | ● | **4** |
| A6+B7 Rakam ve metin doğruluğu (sipariş dahil) | ● | | ● | | ● | | ● | | **4** |
| B1 Pazarlık ekranı yerleşimi | | ● | | ● | | ● | | | **3** |
| C1-C3 Araç karakteri, 1. adım | ● | | | | | | ● | ● | **3** |
| A7 Karne, sezon kapanışı, lig | ● | | | ● | | ● | | | **3** |
| B4+B8 Alım anı, seviye kartı, ilerleme | | ● | | | ● | | | | **2** |
| B5 Günü bitir / gezinme | | ● | | | | | ● | | **2** |
| B6 Okunabilirlik | | ● | | | | ● | | | **2** |
| A8 Ekspertiz bedeli, A9 tamir, A10 emanet, A11 toptan, A12 ödül ekonomisi, C4 gerçek ticaret katmanları | | | | | | | | | 0 |

**Eşik:** 2 ve üzeri oy alan 13 konu listeye girdi. Sıralama oy sayısına göre yapıldı; ancak bu turun ana hedefi arayüz ve oynanabilirlik olduğu için moderatör B1'i (pazarlık ekranı, 3 oy, 6 rapor, v2 ölçütü tutmadı) 5. sıraya aldı. Kararlar 1 ve 6 geliri düşüreceği için sezon hedefinin sayısal ayarı karar 10'a bağlandı.

**Uygulama düzeni:** Her karar tek oturumluk bir iş. "a/b" diye bölünenler ayrı commit. Her karardan sonra `python3 build.py && python3 appbuild.py`, ilgili testler ve ekran değiştiyse 390×844 ekran görüntüsü alınacak (CLAUDE.md §8).

---

### 1. Alış pazarlığında satıcı tipini geri getir, koz yığmayı sınırla [6/8: GEL, STR, FUT, KRK, ARB, GLR; 8/8 raporladı]
- **Sorun:** Ortalama alış indirimi istenen fiyatın %16-27'si (hedef %8-14). Hasarlı araçta 7 koz + övgü = −%32 ve sabır artıyor. "Fiyatımız nettir" diyen galerici ilk teklifte −%22 veriyor. v2'de konan %15 tavan arayüzdeki pazarlığa hiç bağlanmamış.
- **Kural ve sayılar:**
  - `ui.js` `negReserve()`: `Math.min(.34, n.disc)` yerine `Math.min(kozTavan(s), n.disc)`. Yeni alan `SELLERS[].kozTavan`: acil **.14**, acemi **.12**, filo **.09**, duygusal **.08**, galerici **.06**, koleksiyoncu **.06**. Gerçekçi modda ×0,8. Ruh hâli etkisi ±%10'dan **±%4**'e iner (`(n.mood-50)/1250`).
  - `effReserve()` (`game.js`) aynı `kozTavan` tablosunu kullanır; iki fonksiyon tek bir kaynaktan beslenir ve `test/yeni-test.js` bunu karşılaştırır.
  - Koz azalan getiri `doMove("koz")` içinde zaten var (`dim` 1/.8/.6/.45/.35); bu korunur. Ek olarak **4. kozdan itibaren her satıcıda** −1 sabır, sert satıcıda (`sert≥.4`) mevcut kural gibi 3. kozdan itibaren.
  - Övgü (`ovgu`) sabrı yalnız `n.pat` başlangıç değerinin altındaysa ve **müzakere başına bir kez** geri verir (şu an da bir kez; koz cezasını sıfırlamaması için koz sonrası övgü sabır vermez).
  - `moveButtons()`: koz kartının alt satırında sabır etkisi yazar: "−%4,5 · sabır −1" ya da "−%4,5 · sabır gitmez".
  - `SELLERS.w` (ağırlık): acil 18→**12**, acemi 14→**11** (GLR: pazarın 5/9'u acil). Diğerleri aynı.
  - `gunlukritim.js` `gunlukKur()`: fırsat aracında `reserve*0.94` → `reserve*0.97` (fırsatın kendisi zaten ucuz ilan).
  - Tur sayısı artmaz (GNÇ'nin şartı). Çalışma kopyasındaki `sellerReply` ilk tur toleransı korunur.
- **Sayısal hedef (Normal mod):** Ortalama indirim istenen fiyatın **%9-14**'ü; 3+ koz kullanılan hasarlı araçta **≤%20**; galerici/koleksiyoncuda **≤%9**. İlk teklifte kabul oranı acil/acemi **≤%40**, diğerleri **≤%10**. Ortalama tur sayısı v3'e göre en fazla +0,7.
- **Dokunulacak:** `ui.js` `negReserve()`, `doMove()`, `moveButtons()`; `game.js` `SELLERS`, `effReserve()`; `gunlukritim.js` `gunlukKur()`.
- **Kabul ölçütü:** `test/denge.js` alış botu (200 alım; strateji 1: "hep %75 aç, karşı teklife %3 yaklaş"; strateji 2: "bütün kozları sun, sonra tek teklif") satıcı tipine ve koz sayısına göre ortalama indirimi ve ilk teklif kabul oranını yazdırır; değerler hedef aralıkta olmalı. Birim testi: aynı `n.disc` için `negReserve()` ile `effReserve()` aynı değeri vermeli. ux-test: koz kartında "sabır" metni görünmeli.
- **Oy durumu:** 6/8. GNÇ "tur sayısı artmazsa" şartıyla destekledi; UX oyunu başka maddeye verdi ama sabır etiketi talebi buraya girdi.

### 2. Para kaybettiren tek dokunuşları kapat [5/8: UX, STR, GNÇ, KRK, GLR]
- **Sorun:** "Nakit ısrar et" ₺443K'lık ve ₺556K'lık teklifleri uyarısız sildi; taksitli teklifte zaten nakit seçeneği varken bu düğme anlamsız. Takaslı pazarlıkta ilan fiyatını yazmak anlaşmayı fark ettirmeden takaslı kapattı. Teklif üst sınıra çekildiğinde alım onaysız gerçekleşti. Hazırla beklenen kârı eksi olan ilanı uyarısız kurdu.
- **Kural ve sayılar:**
  - `ui.js` `offerCard()`: **taksitli** teklifte "Nakit ısrar et" kaldırılır; yerine iki eşit düğme gelir: "Nakit sat · ₺{o.amount} (+₺kâr)" (`takeoffer`) ve "Taksitle sat · ₺{toplam}" (`taketaksit`).
  - **Takaslı** teklifte düğme metni "Takassız iste · ₺{amount×0,94} · alıcı gidebilir (%42)" olur ve `onay()` ister. Sonuç (vazgeçti / ikna oldu) toast'ta değil kartın içinde yazar.
  - `renderSaleNeg()` takaslı konuşmada: başlıkta "TAKASLI: ₺{nakit} nakit + {araç} (biçilen ₺{claim})" çipi; kabul ve "Fiyat ver" düğmelerinin metni "₺{nakit} nakit + {araç}" olur; hamleler arasına "Takassız iste" eklenir (aynı %42 / ×0,94 kuralı, aynı uyarı).
  - `doOffer()`: teklif `ust`'u aştığında **gönderilmez**. Girdi `ust`'a çekilir, "Kabul et · ₺{ust}" düğmesi vurgulanır ve oyuncu bir kez daha dokunur.
  - `kolay.js` `hazirlaYap()` / `a==="hazirla"` onayı: `onerilenIlan(c)−carCost(c)−karlı tamirler < 0` ise onay kırmızı açılır: "Bu fiyatta ~₺X zarar. Yine de hazırla / Fiyatı kendim kurayım".
  - GLR'nin "₺500K üstü her alımda onay" önerisi **reddedildi** (GNÇ: akışı yavaşlatır). Yerine karar 11'deki alım özeti kartı geliyor.
- **Dokunulacak:** `ui.js` `offerCard()`, `a==="onlycash"`, `renderSaleNeg()`, `doSaleOffer()`, `doOffer()`, `a==="hazirla"`; `kolay.js` `hazirlaYap()`.
- **Kabul ölçütü:** Playwright (`test/ux-test.js` yeni bölüm): (a) taksitli teklif kartında "Nakit ısrar et" yok, "Nakit sat" var; (b) takaslı teklifte "Takassız iste"ye dokunmak önce onay açar ve tek dokunuş teklifi silmez; (c) takaslı satış pazarlığında kabul düğmesinin metni araç adını içerir; (d) `offer=ask+1` girilince `buyCar` çağrılmaz, girdi `ask` değerine çekilir; (e) beklenen kârı eksi olan araçta Hazırla onayı `.neg` sınıfı taşır.
- **Oy durumu:** 5/8.

### 3. Boş günleri bilgiye ve karara çevir [5/8: GEL, FUT, GNÇ, KRK, GLR]
- **Sorun:** Oyun günlerinin %40-56'sı "Teklif gelmedi" ile geçiyor. Oyuncu ilanının piyasa düştüğü için pahalı kaldığını görmüyor. Boş garajda bile "Satıştakileri aç" deniyor. Param yetmeyen toptan parti her gün bildirim gönderiyor.
- **Kural ve sayılar:**
  - `ui.js` `pencereSerit()` (garaj kartı): ilanda olan araçta `oran = listPrice / valueOf(c, !c.disclosed)`. Oran > 1,03 ise turuncu satır: "İlan ₺X · piyasa ₺Y · **%Z pahalı**" ve "₺W'ye çek" düğmesi. W = `onerilenIlan(c)` (değer × 1,03). Yeni eylem `KANCA.eylem.fiyatoner` ya da `ui.js` içinde `a==="fiyatoner"`. Oran < 0,97 ise yeşil "piyasanın altında".
  - Aynı kartta "Fiyat kır %3" düğmesinin altına tahmin: "ilk alıcı {gunAlt}-{gunUst} gün → {yeni aralık}" (`satisPenceresi()`, kırılmış fiyatla bir kez daha çağrılır).
  - `openReport()` boş blok: ilanda araç **yoksa** "Pazara git" (`tab=pazar`). Varsa en fazla 3 satır: "{model} · {daysListed} gün · %Z pahalı → [₺W'ye indir]". Pahalı değilse neden olarak aktif olay ya da segment yazılır (`evMul("val", seg)<1` ise "Döviz şoku: hatchback durgun, 3 gün kaldı"; değilse "Sezon: {seg} talebi ×{seasonMul}").
  - Bir ilan 2 gün üst üste teklifsiz kalırsa rapor bir yan iş önerir: o gün kapanan müzayede, emanet teklifi, açık sipariş ya da sanayi günü (öncelik sırasıyla). Yoksa öneri gösterilmez.
  - `yangorev.js` `yanGorevGun()` / `partiUret()`: parti yalnız `fiyat ≤ S.cash + kalan kredi limiti` ise üretilir. Üretilmediği gün bildirim gelmez.
  - "3 gün bekle" düğmesi bu turda **yok** (GEL: olayları atlatır).
- **Dokunulacak:** `ui.js` `pencereSerit()`, `satisPenceresi()`, `openReport()`, yeni `fiyatoner` eylemi; `kolay.js` `onerilenIlan()` ve `siradakiAdim()` ("Fiyat kırmayı düşün" eşiği 8 gün yerine "%3+ pahalı ve 3 gün"); `yangorev.js` `yanGorevGun()`.
- **Kabul ölçütü:** ux-test: değeri `nabiz` ile %6 düşürülmüş ilandaki garaj kartında "%6 pahalı" ve "₺W'ye çek" görünür, dokununca `listPrice` = `onerilenIlan`. Boş garajda gün raporunda "Pazara git" var, "Satıştakileri aç" yok. `test/denge.js`: 60 günlük botta "Teklif gelmedi" günü oranı raporlanır ve v3'e göre düşmüş olmalı (botun yeni öneriyi kullanan sürümüyle). 1.000 günlük simülasyonda kasası yetmeyen oyuncuya parti üretilmez.
- **Oy durumu:** 5/8. STR "otomatik fiyat kırma olmasın" şartını koydu; öneri yalnız tek dokunuşluk bir teklif.

### 4. Pazar ana ekranı (4a) ve sahip olunan araç sayfası (4b) [5/8: UX, STR, FUT, GNÇ, ARB]
- **Sorun:** İlk ilan y≈520px'te başlıyor ve 5 gün boyunca alınamayacak bir araçla açılıyor. Şerit 8-10 kart. Kartta vites ve yakıt yok. Sahip olunan araç sayfasında Hazırla atölyenin 1-2 ekran altında kalıyor; sabit alanlar ekranın %43'ünü kaplıyor.
- **4a Kural ve sayılar (pazar):**
  - `ui.js` `siralaListe()` `"onerilen"`: önce `c.ask ≤ S.cash` (senet açıksa `senetTavanNakit()`), sonra `fark(c)` azalan, sonra yaş. Alınamayanlar en sona.
  - BUGÜN şeridi (`viewPazar()` + `KANCA.ray`): kart yüksekliği **≤104px**. Sıra: bugün/yarın süresi dolan (teklif, sipariş, emanet, parti) → sezon hedefi → görevler → vaka. Piyasa nabzı, sanayi günü ve aktif olay **tek "Piyasa" kartında** birleşir. En fazla 5 kart, sonra "Tümü (N)" kartı.
  - `cardHtml()`: başlık iki satıra sarılır (kesilmez); altına künye çip satırı "Dizel · Otomatik · 2016 · 143 bin km". Fiyat bandı etiketi tek satır.
  - Kompakt liste satırı (88px: 64px fotoğraf, ad, künye, fiyat, rozet) **varsayılan**; "Fotoğraf" modu `araSerit()` içindeki bir anahtarla seçilir. Tercih `S.ayar.liste` alanında saklanır (eski kayıtta `||"kompakt"`).
  - Filtre çiplerine "Fırsat" eklenir: ekspertizli araçta `ask < valueOf(c,false)`, ekspertizsizde fırsat rozeti.
- **4b Kural ve sayılar (araç sayfası):**
  - `openOwnCar()` blok sırası: durum ve ekspertiz → **Hazırla kartı** (`hazirlaKart()`) → hesap → atölye → ilan kur.
  - Sabit başlık kaydırınca 56px'e daralır (yalnız ad + plaka).
  - Alt sabit çubukta tek birincil düğme ("İlanı yayınla" ya da "Hazırla ve ilana koy"). "Galericiye toptan sat · ₺X (−₺Y)" metin bağlantısına iner (onay korunur).
- **Dokunulacak:** `ui.js` `siralaListe()`, `viewPazar()`, `cardHtml()`, `araSerit()`, `filteredMarket()`, `openOwnCar()`; `kolay.js` `hazirlaKart()`; `shell.html` (`.kart`, şerit, `.actionbar` kuralları).
- **Kabul ölçütü:** ux-test 390×844: (a) pazar açılışında ilk ilan kartının üst kenarı **≤ 400px**; kompakt modda ilk ekranda **≥4 ilan**; (b) bütçeye uyan en az bir ilan varsa ilk kartın `ask ≤ S.cash`; (c) şeritte ≤5 kart + "Tümü"; (d) kart başlığında "…" kırpması yok (`scrollWidth ≤ clientWidth`); (e) ekspertizsiz sahip olunan araçta Hazırla düğmesi ilk ekranda (`getBoundingClientRect().bottom ≤ 844 − altÇubuk`); (f) alt çubukta tek `.btn.primary`. 150 modelin her biri için kompakt satırda yatay taşma 0.
- **Oy durumu:** 5/8. KRK oyunu başka maddeye verdi ama kompakt liste talebi onun; GNÇ "Fotoğraf modu kalsın" şartıyla.

### 5. Pazarlık ekranının telefon yerleşimini bitir [3/8: UX, FUT, KRK; 6/8 raporladı, moderatör önceliği]
- **Sorun:** Karşı teklif gelince panel 260px'e çıkıyor, son mesaj panelin altında kalıyor, 6 hamleden 2'si görünüyor. Satıcı kartı 160-270px. Kaydırınca başlık ile satıcı kartı üst üste biniyor. "İSTENEN" eski fiyatta kalıyor. v2 kararı 8'in ölçütü sağlanmadı.
- **Kural ve sayılar:**
  - `renderNeg()`: `section.sahne` (büyük araç fotoğrafı + yüz kartı) ile ruh hâli/sabır bloğu, satış tarafındaki kompakt başlıkla aynı bileşene dönüşür: **≤96px** (48px yüz, ad + tip, ruh hâli ve sabır tek satırda mini çubuk, sağda "İSTENEN" ya da karşı teklif varsa **"SON SÖZ ₺{n.sonKarsi}"**). Araç fotoğrafı 72px küçük resme iner.
  - `.actionbar.kompakt`: görünür kısım = [Kabul et · ₺X] (varsa) + girdi + "Teklif ver" → **≤150px**. Ruler, 5 hızlı düğme ve "Tavan" bir "▾ Hızlı ayar" açılırının içine girer. Senet satırı tek satırlık çip olur.
  - Her yeni mesajdan sonra `talkAlta()` sheet'i kaydırır; son balonun alt kenarı actionbar'ın üst kenarının üstünde kalır (`scrollIntoView({block:"end"})` + actionbar yüksekliği kadar pay). Aynı şey `renderSaleNeg()` için de geçerli.
  - `.sheet-head` yapışkan, opak (`background:var(--surface-tepe)`), içerikten yüksek `z-index`.
  - Hamle kartları eşit yükseklikte (2 satır, `line-clamp`), açıklama ≥12px.
- **Dokunulacak:** `ui.js` `renderNeg()`, `renderSaleNeg()`, `talkAlta()`, `moveButtons()`; `shell.html` `.sahne`, `.actionbar.kompakt`, `.sheet-head`, `.movegrid`.
- **Kabul ölçütü:** ux-test 390×844, alış ve satışta ayrı ayrı: (a) açılışta actionbar yüksekliği ≤150px (senetsiz); (b) ilk 4 hamle kartı kaydırmadan tamamen görünür; (c) karşı teklif sonrası son `.bub` için `bottom ≤ actionbar.top`; (d) sheet 400px kaydırıldığında `document.elementFromPoint` başlığın ortasında `.sheet-title` döndürür; (e) karşı teklif sonrası başlıkta "SON SÖZ" ve `n.sonKarsi` değeri yazar.
- **Oy durumu:** 3/8. Moderatör bu kararı ana hedefe (arayüz) ve v2'den kalan açık ölçüte dayanarak 5. sıraya aldı; itiraz gelmedi.

### 6. Satışta alıcı tavanı ilanı aşmasın; ilanın tamamını istemek risk taşısın [4/8: GEL, STR, ARB, GLR]
- **Sorun:** İlan fiyatını yazmak 8'de 8 kabul alıyor; alıcı ilanın üstünü ödüyor (ARB 4'te 3). Kozların satıştaki etkisi görünmüyor. Alıcı "son sözüm" demeden gidiyor (FUT).
- **Kural ve sayılar:**
  - `game.js` `buyerCeiling()`: taksitsiz satışta `tavanCap = sale.list × sale.tavanKat`; `sale.tavanKat` satış pazarlığı açılırken bir kez `rnd(.95, 1.00) × min(1, bt.sat.butce)` olarak çekilir ve kayda girer (`S.sale` zaten kayıtta). Taksitli satışta `list×1.22` yerine **`list×1.10`**.
  - `BUYERS[].sat.butce` 1,00'ın üstündekiler (Meraklı 1,12, Şehir dışından 1,06, Aile 1,03) tavan katsayısına göre 1,00'da kesilir; aradaki fark açılış ve esneklikte (`esnek`) kalır.
  - Satış kozu (`salemove`) cevabı sayıyı söyler: "Bunu duymak iyi: tavanım +₺X" ya da tavan ilanda ise "Fiyat zaten ilan fiyatında, bu koz işe yaramaz".
  - `doSaleOffer()`: `s.ilgi` 35'in altına inince (ve 0'a inmeden önce) alıcı bir kez "Son sözüm ₺{counter}. Bunun üstüne çıkarsan kalkarım" der; ancak bundan sonraki turda gidebilir.
  - Açılış teklifleri (`makeBuyer()` `offer`) **değişmez** (GNÇ'nin şartı).
- **Sayısal hedef:** 10.000 satış simülasyonunda taksitsiz satış fiyatı > ilan fiyatı: **0**. "İlanın %99'unu iste" stratejisinde kabul oranı **%35-60**. Ortalama satış/ilan oranı **%95-98**.
- **Dokunulacak:** `game.js` `buyerCeiling()`, `saleReply()`, `BUYERS`; `ui.js` `doSaleOffer()`, satış hamlesi işleyicisi (`salemove`), satış pazarlığını açan fonksiyon (`sale.tavanKat`).
- **Kabul ölçütü:** `test/yeni-test.js` yeni bölüm: yukarıdaki üç sayısal hedef. ux-test: satış kozundan sonra sohbet balonunda "₺" geçer. Elle test (ARB'nin Egeo senaryosu): ilan 984K, 1,01M istemek kabul almaz.
- **Oy durumu:** 4/8. GNÇ "açılış teklifleri aynı kalırsa" şartıyla destekledi.

### 7. Rakam ve metin doğruluğu paketi (sipariş dahil) [4/8: GEL, STR, GNÇ, ARB; 6 rol raporladı]
- **Sorun:** Kartta yazan ile kasaya giren tutar farklı; özet ile gerçek itibar farklı; bazı metinler rapora ters düşüyor. Tek tek küçük, ama hepsi KRK'nin dediği "oyun yalan söylemesin" kümesi.
- **Kural ve sayılar:**
  - **Sipariş:** `orderQuality(o, car, true)` önizleme tutarı teslim düğmesine ve sheet başlığına yazılır ("Alacağın ₺X"); bütçe küçük satıra iner. Kalite kesintisi ve itibar etkisi düğmenin altında gerekçesiyle yazılır ("Gizli kusur: −%15, itibar −4"). Anlaşma özeti itibar değişimini gerçek `S.rep` farkından gösterir. "Kusuru gizleyerek kazandın" yalnız `!car.disclosed && hiddenIssues(car).length` ise çıkar. Kabul edilmemiş, süresi dolan siparişte itibar **0** ve metin "{müşteri} başka yerden buldu."
  - **Ceza görünürlüğü:** Yanıltıcı ilan cezası gün raporunun `costs` listesine bir satır olarak girer ve araç satılınca anlaşma özetinde "Cezalar −₺X" satırı olarak düşer (araç üstünde `c.cezalar` toplamı). Yakalanınca ilan dili kendiliğinden "Muğlak"a iner ve raporda "İlanı düzelttim" notu çıkar; aynı araç ertesi gün aynı yalan için bir daha cezalanmaz.
  - **Ekspertiz maliyeti:** Bütün ekspertiz yolları (`inspect`, Hazırla, takas, emanet, iyilik, günün fırsatı) `c.ekspBedel`'e gerçekten ödenen tutarı yazar; `ekspMaliyet()` dışında `PARA.ekspertiz` kullanılmaz. Hesap satırı "Ekspertiz ₺X" ve "Tamir ₺Y" olarak ayrılır.
  - **Ekspertiz toast'ı** (`a==="inspect"`): gizli bulgu sayısı ve bilinen açık arıza sayısından tek cümle: "2 bulgu · tramersiz". "Temiz çıktı" yalnız ikisi de 0 ise.
  - **Satış kozu "Yaşına göre düşük km"** (`saleLeverage()`): `car.kmOynama` ise sunulmaz. Klasikte eşik `yaş×4.000` olur ve metin "Belgeli km" olur.
  - **Hazırla toast'ı ile garaj kartı** aynı fonksiyonu (`satisPenceresi()`) kullanır ve ikisi de aralık gösterir.
  - **"Gizli kusur" çipi** ekspertizden sonra "Açıklanmadı: N kusur" olur.
  - **Görülmemiş teklif** "düştü" diye raporlanmaz: teklif yalnız `reportOffers()` içinde gösterildiyse düşme olayı yazılır.
  - **REKOR KÂR** yalnız 3. satıştan sonra ve önceki rekoru en az %10 geçince çıkar. `parla()` katmanı anlaşma satırlarının üstüne değil sheet başlığının altına konur.
  - Vaka tarihi "13 Ekim" biçiminde. HUD'daki "Kira 28K/141K" 390px'te kırpılmaz.
- **Dokunulacak:** `ui.js` `orderQuality()`, sipariş sheet'i, `openDealSummary()`, `sellCar()`, gün sonu ceza dalı (`b.walk`), `ekspMaliyet()` ve bütün ekspertiz yolları, `a==="inspect"`, `reportOffers()`, `renderHud()`; `game.js` `saleLeverage()`; `meydan.js` tarih biçimi.
- **Kabul ölçütü:** Playwright: (a) GNÇ'nin sipariş senaryosunda düğmede yazan tutar = kasaya giren tutar; özetteki itibar = `S.rep` farkı; (b) abartılı ilanla iki gün geçince ceza tek kez kesilir ve gün raporunda satır olarak görünür; (c) günün fırsatı aracında "Ekspertiz ₺0"; (d) 5.000 araç üretiminde `kmOynama` taşıyan araçta "düşük km" kozu 0, 269 bin km'lik klasikte 0; (e) iki arızalı araçta "temiz çıktı" toast'u 0.
- **Oy durumu:** 4/8 (sipariş kısmı GNÇ'nin oyu).

### 8. Müzayedeye değer çıpası, kazanılabilir rakip zarfı ve sonuç dersi [4/8: STR, FUT, GNÇ, GLR; 6 raporladı]
- **Sorun:** Muhammen değerin %70'i, rakip zarfı muhammenin 1,07-1,50 katı. Canlı artırmada hiç çıpa yok. Kaybedince ne kadar vermek gerektiği öğrenilmiyor.
- **Kural ve sayılar:**
  - Zarf ekranı (`openBid()`) ve müzayede kartı: "Muhammen ₺X (açılış bedeli)" + "Tahmini değer ₺{av×0,82}-₺{av×1,08}" (pazarla aynı bant). Varsayılan zarf muhammen+%11 yerine **tahmini değerin %85'i**, etiketi "öneri".
  - `resolveAuction()`: rakip zarfı `rivalValue(c) × clamp(def.bid × rnd(.95,1.08), .80, 1.02)`. Segmente uymayan rakip ×0,85. Kazanan zarf gerçek değerin **%85-102**'si arasında kalır.
  - `canli.js` `canliRakipler()`: rakip tavanı aynı formülle; canlı ekranda açılışın yanında aynı tahmini bant ve "rakip sayısı".
  - Sonuç ekranı: "Kazanan ₺X · aracın gerçek değeri ₺Y · kazananın payı %Z". Son 5 müzayedenin "kazanan zarf / gerçek değer" ortalaması zarf ekranında bir satır (`S.muzGecmis`, en fazla 5 kayıt; eski kayıtta `||[]`).
  - Teminat bu turda yok.
- **Dokunulacak:** `ui.js` `openBid()`, `resolveAuction()`, müzayede kartı ve sonuç bloğu; `canli.js` `canliRakipler()`, `canliCiz()`; `kayit.js` gerekmiyor (`S.muzGecmis` düz sayılar).
- **Kabul ölçütü:** 1.000 müzayedelik simülasyon: kazanan zarf / gerçek değer ortalaması %88-100, en büyük değer ≤1,05. "Gerçek değerin %92'si" zarfını veren bot %25-45 kazanır. ux-test: zarf ekranında "Tahmini değer" ve sonuç ekranında "gerçek değeri" metni.
- **Oy durumu:** 4/8.

### 9. Araç karakteri, 1. adım: veri düzeltmesi, bilinen dert satırı, satıcı ve alıcının modele bağlanması [3/8: GEL, ARB, GLR]
- **Sorun:** Modelin gerçek dünya karakteri oynanışı değiştirmiyor; imza arızaları yordamsal ve bir kısmı yanlış; satıcı ve alıcı tipi modelden bağımsız.
- **Kural ve sayılar:** Bölüm 4'teki plan, iki commit halinde:
  - **9.1 Veri + görünürlük:** `modeller-b.py` içinde `ZF_ELLE` tablosu ve `ek()` satırı düzeltmeleri (Bölüm 4.1); iki yeni yalnız-imza arızası `zincir`, `suspansiyon` ve `ky` (zincir/kayış) alanı (M2); pazar kartında ve araç sayfasında "Bilinen dert" satırı (M3).
  - **9.2 Satıcı ve alıcı uyumu:** `weightedSeller(m, year)` ve `pickBuyerType(car)` (M4, M5).
- **Dokunulacak:** `modeller-b.py`, `game.js` (`FAULTS`, `genCar` → `uymaz`, `weightedSeller`, `pickBuyerType`, `makeBuyer`), `ui.js` (`cardHtml`, `openMarketCar`, `openOwnCar`), `en.js` (yeni metinler).
- **Kabul ölçütü:** Bölüm 4.4.
- **Oy durumu:** 3/8. FUT "ücretli usta bilgisi" önerisinde azınlıkta kaldı.

### 10. Karne, sezon kapanışı ve lig: ölçüt, vergi tabanı, yakın hedef [3/8: GEL, FUT, KRK; 6 raporladı]
- **Sorun:** +₺477K'lık hafta "C, marj dar" alıyor. Sezon kapanış haftası kira ve vergiyle D'ye düşüyor. Vergi tabanı yazmıyor ve zararlı sezonda da vergi kesiliyor. Kademe, ödül ve eksik tutar kapanışta yok. Lig dev rakiplerle kıyaslıyor ve "%73'lük dilim" ters okunuyor.
- **Kural ve sayılar:**
  - `karne.js` `karneNot()`: büyüme hesabına o haftaya düşen sezon kirası ve vergisi geri eklenir (`k.sezonGideri`); bu gider karnede ayrı satırda "sezon kapanışı" olarak gösterilir. Not kartının altında ölçüt tek satırda yazılır: "Büyüme %X (+3) · 3 satış (+1) · kâr (+1) · yakalanma yok".
  - "En büyük hata" adayları: zararlı satış, zararlı emanet dönüşü, kaybedilen ≥₺50K kârlı teklif, yakalanma, 10+ gün ilanda kalan araç.
  - `openSeasonSummary()`: "Vergi %8 × ₺X" satırı. Taban = `max(0, satış kârı − sezon kirası)`; zararlı sezonda vergi 0. Hedef kartı: "Bronz ✓ ₺312K · Gümüş için ₺98K eksik · ödül: gelecek sezon kira donuk". Sezon ligi sonucu ve ödülü ayrı satırda. Başlıkta "Kış bitti" bir kez.
  - Gün raporunda kapanış gecesinin gideri "Günün gideri" değil "Sezon kapanışı: kira + vergi" etiketiyle gösterilir. Seviye atlayınca kira payı değişirse bildirim: "Kira ₺110K → ₺141K (park kontenjanı arttı)".
  - Lig: karne ve Durum'daki "Piyasadaki galeriler" bloğu, Türkiye sıralamasındaki ±2 komşu ve "bir üst sıraya ₺X" ile değiştirilir; dev galeriler katlanabilir "Piyasanın büyükleri" başlığına iner. `sirala.js` metni "61 galeri içinde 44. · alt %28'lik dilim".
  - **Hedef ayarı (sıra şartı):** Kararlar 1 ve 6 uygulandıktan **sonra** `test/denge.js` ile `yangorev.js` `HEDEF` yeniden ayarlanır.
- **Sayısal hedef:** Denge botu Normal modda ilk sezonda gümüşe ortalama 10-13. günde ulaşır; altın oranı ≤%30 (v2 hedefi, tutmadı).
- **Dokunulacak:** `karne.js` `karneNot()`, `karneUret()`; `ui.js` `openSeasonSummary()`, `openReport()`; `sirala.js`; `koleksiyon.js` lig bloğu; `yangorev.js` `HEDEF`.
- **Kabul ölçütü:** Birim testi: kira haftasında 3 satış ve +%12 büyüme D değil en az C verir. Zararlı sezonda vergi 0. Kapanış ekranında "eksik" ya da "✓" kademe satırı (DOM). Denge raporundaki iki metrik.
- **Oy durumu:** 3/8.

### 11. Alım anı kartı, seviye kazanım kartı, kilitli sekmede ilerleme [2/8: UX, GNÇ; 5 raporladı]
- **Sorun:** Oyunun en önemli kararının sonucu (alım) bir saniyelik toast'la geçiyor. "Satıcı ₺X'e de inerdi" bilgisi, sheet 600ms'de kapandığı için görülmüyor. Seviye atlama sessiz. Bayat toast'lar ertesi gün çıkıyor. Galeri kilitli ekranı yanlış bilgi veriyor.
- **Kural ve sayılar:**
  - `doOffer()` kabul dalı: sheet kapanmaz; pazarlık sheet'i bir **alım özeti** bloğuna dönüşür: "Aldın ₺X · istenen ₺Y (−%Z) · tahmini değer ₺V" ve "Satıcı ₺W'ye de inerdi" ya da "Tam tabanından aldın". Tek düğme: "Garaja git" (yeni aracın alt sekmesinde açılır).
  - `sellCar()` seviye atlayınca: toast yerine anlaşma özeti kapandıktan sonra açılan bir **kazanım kartı** (sheet): "Seviye 2 · açıldı: Müzayede · +1 uzmanlık puanı · [Git]". Kilometre taşı ve usta seviyesi aynı kartta toplanır.
  - `toast()` kuyruğu her öğeye gün ve sekme damgası koyar; gün değişince ya da sekme değişince bekleyen bilgi toast'ları atılır. Anlaşma özeti açıkken "satıldı — kâr" toast'u hiç üretilmez.
  - `lockedView()` Galeri: kilit ikonu + "Seviye 3'te ya da 12. günde açılır · {kalan gün} gün / {kalan XP} XP". Sekme etiketinde kilit ikonu.
  - `XP_LEVELS[2]` 350 → **280**.
- **Dokunulacak:** `ui.js` `doOffer()`, `renderNeg()` (`n.done` görünümü), `sellCar()`, `toast()`, `toastSiradaki()`, `lockedView()`, `XP_LEVELS`; `cila.js` (kart animasyonu).
- **Kabul ölçütü:** ux-test: (a) alım sonrası sheet açık ve "inerdi" ya da "tabanından" metni görünür; (b) seviye 2'ye geçince `.kazanim` sheet'i açılır; (c) gün ilerleyince önceki günün toast'u gösterilmez; (d) kilitli Galeri'de "12. gün" metni.
- **Oy durumu:** 2/8. GLR'nin "alım anında onay" isteği bu kartla karşılandı (onay değil, özet).

### 12. "Günü bitir" her yerde; modal açıkken gün ilerlemesin; adlar tutarlı [2/8: UX, ARB; 6 raporladı]
- **Sorun:** Müzayede, Galeri, Rapor ve Ayarlar'da düğme yok. 3B gezde düğme 0×0. Karne açıkken arkadan gün 3 kez ilerledi. "Rapor" sekmesinin başlığı "Defter".
- **Kural ve sayılar:**
  - "Günü bitir" sekme çubuğunun hemen üstünde, **tek satır (56px)**, bütün sekmelerde ve 3B modda aynı bileşen. `viewPazar()` ve `viewGaraj()` içindeki iki ayrı kopya kaldırılır.
  - `openSheet()` açıkken alttaki `[data-act="endday"]` dokunuşları yok sayılır. HUD gün sayacı karne ve rapor açılmadan önce güncellenir.
  - 3B görünüm tercihi sekme başına tutulur (`can3d()` + sekmeye özel değişken); Garaj varsayılanı liste.
  - `TABLBL.rapor` "Defter" olur (sayfa başlığı ve "Kurallar Defter'in altında" metniyle uyumlu).
  - Raporun içinden pazarlığa gidip dönünce eski günün raporu yeniden açılmaz (KRK hata 8).
- **Dokunulacak:** `ui.js` `viewPazar()`, `viewGaraj()`, ana `render()` iskeleti, `can3d()`, olay yönlendiricisi (`a==="endday"`), `TABLBL`, `openReport()`; `shell.html` sekme çubuğu; `en.js`.
- **Kabul ölçütü:** ux-test: 6 sekmenin ve 3B modun her birinde görünür, boyutu > 0 olan tek bir "Günü bitir"; karne açıkken `endday` tıklaması `S.day`'i değiştirmez.
- **Oy durumu:** 2/8 (KRK, FUT, STR, GNÇ raporladı, oylarını başka maddelere verdi).

### 13. Okunabilirlik: yazı boyutu, ikincil metin tabanı, hareketi azalt [2/8: UX, KRK; 4 raporladı]
- **Sorun:** Yazı boyutu ayarı yok; hamle açıklamaları, fiyat bandı etiketleri ve rozetler 10-12px soluk gri. Nabız animasyonu durmuyor. Bazı dokunma hedefleri 36-40px.
- **Kural ve sayılar:**
  - Ayarlar: "Yazı boyutu: Normal / Büyük / Çok büyük" → `:root{--yk:1 | 1.15 | 1.3}`. `S.ayar.yazi` alanında (eski kayıtta `||1`).
  - İkincil metin sınıfları (`.sec-note`, `.chip`, `.mv span`, `.glbl`, `.pnc-et`, `.lab`, hızlı düğme etiketleri, rozetler) `font-size:calc(12px*var(--yk))`. Normal modda en küçük metin 12px, rengi `--label-2`. `zoom` kullanılmaz (3B tuvali ve sabit konumlar bozulur).
  - "Hareketi azalt": `prefers-reduced-motion` + ayar anahtarı. Birincil düğmenin nabız animasyonu her durumda 3 saniye sonra durur.
  - Dokunma hedefleri ≥44px: öğretici "Atla", sheet ×, 3B "‹ Liste".
- **Dokunulacak:** `shell.html` (CSS değişkenleri ve sınıflar), `ui.js` Ayarlar görünümü, `cila.js` (animasyonlar), `kayit.js` gerekmiyor (yeni alan `||` ile okunur).
- **Kabul ölçütü:** ux-test: "Çok büyük" modda 390px'te 6 sekmede ve pazarlıkta yatay taşma 0; hesaplanmış en küçük metin ≥15,6px. Normal modda ≥12px. 3 saniye sonra `animation-play-state` ya da `animation:none`. Dokunma hedefi testi (bounding box ≥44px).
- **Oy durumu:** 2/8.

---

## 4. Araç karakteri planı (ARB + GEL)

**Ortak ilke (ARB):** "Model adı açık, kronik derdi de açık; bu araçta var mı, onu ekspertiz söyler."
**Ortak ilke (GEL):** "Her karakter bilgisi bir mekaniğe bağlansın: ya bir olasılığı değiştirsin ya da bir kararı."
**Kısıt (GEL):** Model sırası ve adlar değişmeyecek. Kayıt `MODELS.indexOf` ile indeks tutuyor; koleksiyon (`S.koleksiyon`), defter (`S.notlar`) ve çizim tohumu (`aracKimlik(ad|seg)`) adla tutuluyor. Bu turda yeni model **eklenmiyor**, ad **değişmiyor**. Bütün veri işi `modeller-b.py`'de yapılıyor; ardından `python3 modeller-b.py` ile `game.js` `MODELS` ve `_modeller_b.js` yeniden üretiliyor.

### 4.1 Bu turda yapılacak veri düzeltmeleri

Uygulama: `ek(...)` satırında `y`, `rel`, `dem`, `g` doğrudan değişir. İmza arızası için yordamsal döngüden **sonra** uygulanan `ZF_ELLE = {ad: [zf1, zf2]}` tablosu eklenir. `ky` yeni bir alandır: `ek()` imzasına `ky=None` parametresi, çıktı satırına `ky:"zincir"` (yalnız doluysa) eklenir.

| # | Model (oyun adı) | Alan | Mevcut | Yeni | Gerekçe (ARB) |
|---|---|---|---|---|---|
| 1 | Bavera E30 2.0 | zf | yagkacak, debriyaj | **triger, yagkacak** | Kayışlı eski sıra altı: değiştirilmeyen kayış motoru götürür. Debriyaj kronik değil. |
| 2 | Hessler 190 2.0 | zf / ky | triger, aku | **altsac, yagkacak** / **zincir** | Zincirli motor; asıl dert pas ve supap kapağı kaçağı. |
| 3 | Vernon Mk1 3.5 | zf / ky | aku, triger | **altsac, aku** / **zincir** | Zincirli V8; şasi pası ve eski elektrik. |
| 4 | Volkheim Böcek 1.2 | zf | debriyaj, aku | **altsac, yagkacak** | Hava soğutmalı motor yağ sızdırır, taban pas yer. |
| 5 | Fiyat Şahan 1.6 | y / dem | [1980,1996] / 1,00 | **[1984,2002]** / **1,10** | Üretim daha uzun sürdü; en tanınan nostalji arabası, talep yüksek. zf (aku, altsac) doğru. |
| 6 | Fiyat Linas 1.3 Dizel | y / zf / ky | [2010,2020] / klima, altsac | **[2007,2018]** / **debriyaj, klima** / **zincir** | Üretim 2018'de bitti; motor zincirli (oyunda "2020 Linas · Triger seti" çıktı). |
| 7 | Fiyat Egeo 1.3 Dizel | y / zf / ky | [2015,2023] / klima, kapiboya | **[2016,2024]** / **kapiboya, multimedya** / **zincir** | Hatch kasa sonra çıktı; multimedya ve ince boya bu ailenin klişesi; aynı zincirli motor. |
| 8 | Fiyat Egeo Sedan 1.6 Dizel | g / zf | .26 / aku, camurluk | **.40** / **otosanziman, kapiboya** | Çift kavramalı otomatik sonradan yaygınlaştı. |
| 9 | Perrin 208 1.5 Dizel | y | [2013,2022] | **[2018,2024]** | Bu hacimli dizel 2018 sonrası; ad ile yıl uyuşmuyordu. |
| 10 | Tanaro Aurin 1.8 Hibrit | y | [2015,2023] | **[2013,2019]** | Üretim 2019'da bitti. zf'ye hibrit batarya eklenmesi: ana geliştiricinin EV/hibrit düzeltmesi bir batarya kalemi getirirse **torpido, {o kalem}**; getirmezse dokunulmaz. |
| 11 | Volkheim Golfo 1.6 Dizel | zf | debriyaj, klima | **enjektor, debriyaj** | Bu ailede enjektör ve kavrama asıl dert. |
| 12 | Volkheim Golfo 1.4 Turbo | y / g / zf / ky | [2014,2023] / .72 / otosanziman, aku | **[2012,2020]** / **.80** / **otosanziman, zincir** / **zincir** | Nesil 2020'de bitti; zincir gergisi bu motorun bilinen derdi; akü kronik değil. |
| 13 | Volkheim Passo 1.6 Dizel | g / zf | .44 / debriyaj, aku | **.75** / **otosanziman, enjektor** | Bu sınıf ikinci elde ağırlıkla çift kavramalı otomatik. |
| 14 | Volkheim Jetro 1.4 Benzin | g / zf | .50 / debriyaj, klima | **.80** / **otosanziman, aku** | Aynı aile mantığı. |
| 15 | Renolta Meganta 1.5 Dizel | g / zf | .34 / multimedya, debriyaj | **.50** / **otosanziman, enjektor** | Çift kavramalı otomatik bu ailede yaygın. |
| 16 | Renolta Meganto Sedan 1.5 Dizel | g / zf | .32 / multimedya, debriyaj | **.55** / **otosanziman, multimedya** | Aynı aile. |
| 17 | Renolta Flanso 1.5 Dizel | g / zf | .24 / aku, debriyaj | **.50** / **otosanziman, enjektor** | Otomatik sürümü çok satıldı. |
| 18 | Skava Oktan 1.6 Dizel ve Oktan Sedan | g / zf | .42 ve .44 / debriyaj, multimedya | **.50 ve .52** / **otosanziman, enjektor** | Şanzıman geçmişi fiyatı belirler. dem 1,12 doğru, kalır. |
| 19 | Bavera 320 2.0 Dizel | g / zf / ky | .90 / turbo, otosanziman | **.95** / **zincir, enjektor** / **zincir** | Arka zincir arızası bu motorun meşhur derdi; manueli nadir. |
| 20 | Bavera 520 2.0 Dizel | g / zf / ky | .94 / turbo, otosanziman | **.96** / **zincir, turbo** / **zincir** | Aynı motor ailesi. |
| 21 | Hessler A160 1.6 Dizel | g / zf | .70 / enjektor, aku | **.95** / **enjektor, otosanziman** | Neredeyse hep çift kavramalı otomatik. |
| 22 | Hessler C200 2.0 Dizel | g / zf | .88 / turbo, beyin | **.97** / **enjektor, turbo** | Manuel sürümü ikinci elde yok denecek kadar az. |
| 23 | Hanseul Tucana 1.6 Dizel | rel / zf | .81 / torpido, kapiboya | **.78** / **otosanziman, enjektor** | Çift kavramalı şanzıman ve enjektör şikâyeti bilinir. |
| 24 | Kiva Sportago 1.6 Dizel | rel / zf | .80 / torpido, beyin | **.78** / **otosanziman, torpido** | Aynı. |
| 25 | Honzo CRV 1.6 Dizel | y / g | [2013,2021] / .76 | **[2015,2021]** / **.55** | Bu dizel 2015 sonrası; iki çeker manueli yaygın. |
| 26 | Vernon Highland 3.0 Dizel | y / zf | [2016,2023] / beyin, turbo | **[2013,2021]** / **suspansiyon, beyin** | Hava süspansiyonu bu aracın bir numaralı pahalı derdi. |
| 27 | Brickley Contin 3.0 Benzin | zf | yagkacak, klima | **yagkacak, suspansiyon** | Ad düzeltmesi (motor hacmi) sonraya kaldı. |
| 28 | Calvetti Giulio 2.0 Dizel | zf | klima, turbo | **aku, multimedya** | Start-stop aküsü ve multimedya öne çıkar. Ad düzeltmesi sonraya kaldı. |
| 29 | Fiyat Dobla 1.6 Dizel | zf | aku, altsac | **enjektor, debriyaj** | Ticari kullanımda enjektör ve debriyaj-volan baş dert. |
| 30 | Daçya Duste 1.5 Dizel | zf | torpido, kapiboya | **enjektor, torpido** | Bu dizelde enjektör bilinir. dem 1,28 doğru, kalır. |
| 31 | Orvell E2 / Voltaro V1 / Amperon A3 / Orvell E4 / Voltaro V5 / Amperon S | dem | 1,06 / 1,04 / 1,08 / 1,06 / 1,10 / 1,10 | **0,92 / 0,90 / 0,95 / 0,93 / 0,94 / 0,95** | İkinci el EV'de batarya ve teknoloji kaygısı talebi düşürür. zf'ye batarya kalemi: 10. satırdaki koşulla aynı. |

**Dokunulmayacaklar (ARB "doğru yansıyor" dedi):** Tanaro ailesi (rel .85-.91, dem 1,18-1,32), Daçya ailesi, Fiyat Egeo 1,24 talebi, Renolta Clip, Çin markaları (rel .62-.63, dem .86-.92), lüks Alman satırlarının rel ve turbo/otomatik imzaları, Aureon A3 ve A4 imzaları, Perrin 205 ve Tunca Murat klasikleri, Hanseul Bayon yıl aralığı.

### 4.2 Bu turda yapılacak mekanikler (uygulama sırasıyla)

| Sıra | Kod | Mekanik | Somut kural | Dosya / fonksiyon | Kim istedi |
|---|---|---|---|---|---|
| 1 | M1 | Veri | 4.1 tablosu: `ZF_ELLE`, `ek(..., ky=None)`, çıktıya `ky`. Üretimden sonra `MODELS` 150 satır ve **ad sırası birebir aynı**. | `modeller-b.py` | ARB |
| 2 | M2 | İki yeni yalnız-imza arızası ve zincir/kayış ayrımı | `FAULTS`'a `{k:"zincir", n:"Zincir seti / gergi değişmeli", c:"motor", cost:38000, gain:24, vis:.06, dm:1.0, imza:1}` ve `{k:"suspansiyon", n:"Hava süspansiyonu arızalı", c:"elektrik", cost:65000, gain:25, vis:.30, dm:1.0, imza:1}`. `genCar` → `uymaz`: `f.imza && !m.zf.includes(f.k)` ise elenir; `m.ky==="zincir"` ise `triger` elenir. Ana geliştiricinin `uymaz` değişikliğine ek koşul olarak yazılır, onu değiştirmez. | `game.js` `FAULTS`, `genCar()`; `en.js` (2 ad) | ARB, GEL |
| 3 | M3 | "Bilinen dert" satırı | Pazar kartında (`cardHtml`, kompakt satırda küçük çip) ve araç sayfasında (`openMarketCar`, `openOwnCar`): "Bu modelde bilinen: {zf adları} · {m.km} bin km sonrası sıklaşır". Ekspertizden önce gri. Ekspertizden sonra bu araçta çıkan imza arızası varsa kırmızı ("Bu araçta var"), yoksa yeşil ("Bu araçta yok"). `km ≥ m.km×1000` ise turuncu "Eşik geçti" rozeti. Klasikte (`km:0`) eşik satırı yazılmaz. Mevcut "Defterin" satırı (`notSatiri`) oyuncunun kendi gözlemi olarak kalır. | `ui.js` `cardHtml()`, `openMarketCar()`, `openOwnCar()`; yeni yardımcı `bilinenDert(m, car)` | GEL, ARB |
| 4 | M4 | Satıcı-model uyumu | `weightedSeller(m, year)`: ağırlık çarpanları. Klasik: koleksiyoncu ×4, duygusal ×3, galerici ×1, acil ×0,7, acemi ×1, **filo ×0**. Ticari: filo ×3, acil ×1,5, koleksiyoncu ×0. Yaş < 5: galerici ×2, filo ×1,5, koleksiyoncu ×0,2. Lüks: galerici ×2, acil ×1,5. Çarpanlar karar 1'in yeni `w` değerleriyle çarpılır. `genCar` bu fonksiyonu `m` ve `year` ile çağırır. | `game.js` `weightedSeller()`, `genCar()` | ARB, GLR |
| 5 | M5 | Alıcı-araç uyumu | `pickBuyerType(car)`: segment havuzu korunur, üstüne çarpanlar. Genç sürücü: ilan ≤ ₺1,0M ×1; ₺1,0-1,5M ×0,4; > ₺1,5M ×0,1. Esnaf: ticari ×3 (dizelse ×1,5 daha). Meraklı: klasik ×3, lüks ve > ₺3M ×2. Aile: SUV ve sedan ×2, hibrit ×1,5. `makeBuyer` aracı geçirir. Yeni alıcı tipi eklenmez. | `game.js` `pickBuyerType()`, `makeBuyer()` | GEL |
| 6 | M6 | Klasik hâlin değere ve alıcıya yansıması (zaman kalırsa) | Ana geliştiricinin `car.klasikHal` alanı `valueOf()`'a çarpan olarak girer: orijinal ×1,15, restore ×1,05, yorgun ×1,00, proje ×0,80. (ARB 1,30 / 1,10 / 0,85 / 0,55 önerdi; GEL klasik zaten Meraklı alıcıdan prim aldığı için yumuşattı, ARB kabul etti.) Ekspertiz raporunda rozet ("ORİJİNAL", "PROJE"). Satış kozu: orijinal ve `boyali===0` ise "Orijinal boya, belgeli" (+%4). | `game.js` `valueOf()`, `saleLeverage()`; `ui.js` ekspertiz rozetleri | ARB |
| 7 | M7 | EV değer eğrisi (zaman kalırsa) | `baseValue()`: `m.f==="Elektrik"` ise yıllık katsayı `.92` (diğerleri aynı). `valueOf()` Elektrik ×1,02 → ×1,00. Hibrit ×1,06 kalır (iyi tutar). | `game.js` `baseValue()`, `valueOf()` | ARB, GEL |

### 4.3 Bu turda yapılmayacaklar (sıradaki tur için sıra)
1. Şanzıman türü alanı `sz` ("dct", "cvt", "tc", "amt", "mt") ve `mekatronik` arızası; çift kavramalı otomatikte eşik sonrası ×4 ağırlık; "Şanzıman geçmişi" kozu ve kart çipi.
2. Yıla göre vites oranı `gy` (ör. Golfo 1.6 Dizel `[[2011,.15],[2014,.55]]`) ve "ilk seri / son seri" küçük düzeltmeleri.
3. Model fişi: koleksiyon defterinde model ilk kez satılınca kronik dert, tipik alıcı ve talep eğilimi açılır; 3. ve 5. satışta ek ipucu.
4. Model bilen alıcı: `savvy>.5` alıcı ekspertizde önce imza bileşenine bakar (yakalanma ×1,5); "Kronik arıza giderildi (belgeli)" kozu.
5. Marka ailesi düzeyinde piyasa olayları (`EVENTS` aileye bağlanır).
6. Görsel imza: tohum `marka+aile` (ön yüz) ve `seg` (gövde); sedan ve hatch kardeşleri aynı burun; özel gövde (`gorunum`) ile klasik siluetler; nesil/facelift ayrımı. Bu iş `aracciz.js`'de 150 modelin yeniden göz kontrolünü gerektiriyor (CLAUDE.md §7).
7. Ad düzeltmeleri (lüks coupe motor hacmi, İtalyan sedanın dizel hacmi, büyük panelvanın 2.2/2.0 ayrımı) ve yeni model (benzinli yağlı kayışlı küçük hatch). Kayıt göçü (`SURUM`), koleksiyon ve defter anahtarlarının taşınması ve yeni çizim tohumu kontrolüyle birlikte yapılacak.
8. "Nostalji" alıcı tipi ve klasik değer çarpanlarının ARB'nin önerdiği tam aralığa çekilmesi (M6'nın etkisi ölçüldükten sonra).

### 4.4 Kabul ölçütleri (karar 9 ve plan)
- `python3 modeller-b.py` sonrasında `MODELS.length===150` ve ad listesi üretimden önceki listeyle **birebir aynı sırada** (`test/goc-test.js`'e assert). Eski kayıt yüklenince aynı araçlar aynı modelle açılır.
- 5.000 araç üretim testi (`test/yeni-test.js` yeni bölüm):
  - `ky:"zincir"` modellerde `triger` = 0; `zincir` yalnız zf'sinde olan modellerde, diğerlerinde 0; `suspansiyon` aynı kurala uyar.
  - Bavera E30'da arızaların en az %25'i `triger`; Hessler 190'da `triger` = 0.
  - Klasik satıcılarda `filo` = 0; 5 yaşından küçük araçlarda `koleksiyoncu` ≤ %3.
  - İlanı > ₺1,5M olan araçta "Genç sürücü" alıcı ≤ %5; ticari araçta Esnaf ≥ %35.
  - EV modellerinde `dem < 1`.
- ux-test: pazar kartında ve araç sayfasında "Bu modelde bilinen" metni; ekspertiz sonrası "Bu araçta var/yok" sınıfı değişiyor; km eşiğini geçmiş araçta "Eşik geçti" rozeti.
- `test/denge.js`: M4 ve M5 sonrası ortalama sezon kârı ±%5'ten fazla oynamamalı (karakter dengeyi bozmamalı); oynarsa karar 10'daki hedef ayarına girdi olarak yazılır.
- Gözle kontrol: veri değişikliği çizimi etkilemez (ad ve segment aynı), ama `g` değişen 20 model için 3B profil testi (`ux-test.js` 11. bölüm) yine geçmeli.

---

## 5. Sonraya bırakılanlar

| Konu | Raporlayan | Neden sonraya kaldı |
|---|---|---|
| **Ekspertiz bedelinin araç değeriyle oranlanması, hızlı bakışın yeniden dengelenmesi** | STR, GEL; GLR gerçek ücret bilgisi | Üçüncü kez oy almadı. GLR'ye göre gerçek ücret sabit ₺3-6K; KRK ₺2.500'ü "hissedilir" buluyor. Karar 1 alış marjını düşürünce ekspertizin göreli maliyeti kendiliğinden artacak; etkisi ölçülecek. |
| **Tamir süresi (1-3 gün) ve tamir getirisinin maliyetin %70-110'una sınırlanması; orijinal parçanın her zaman kaybetmesi** | GLR, STR, GEL | Konu 2'deki süzgeç: tamir süresi yalnız bekleme üretiyor (GNÇ, GEL). Getiri sınırı ve orijinal parçaya avantaj (garanti kozu vb.) karar 1 ile 6'dan sonra denge verisine göre ayrı bir atölye turunda ele alınacak. |
| **Toptan satışın %92-94'e çekilip "yavaş araç çıkışı" yapılması** | GLR | STR: devir hızını şişiren yeni bir baskın strateji yaratabilir. Alış ve satış dengesi oturduktan sonra ölçülecek. |
| **Emanet payının %6-12'ye daraltılması, komisyonlu ikinci emanet türü, "süre dolarsa" metninin netleşmesi** | STR, GLR, FUT | Oy almadı. "Sahibi yarısını öder" metninin "tamir masrafının yarısı ₺X geri gelir, net kayıp ₺Y" olarak açılması küçük bir iş; karar 7'nin bir sonraki metin paketine aday. |
| **Temerrütte aracın geri alınması, banka kredisiyle satış, kapora mini mekaniği, "geri geldi / ayıplı mal" olay kartı** | GLR | Taksit düzeltmesi ana geliştiricide sürüyor; o bitmeden yeni katman eklenmiyor. Kapora ve ayıplı mal itibar sistemini canlandırabilecek iyi adaylar. |
| **Normal modda satış hızının ilk 3 satıştan sonra düşürülmesi, sermaye maliyeti bilgi satırı, devir masrafı satırı** | GLR | Konu 2: boş gün şikâyeti varken bekleme artırılmıyor. Sermaye maliyeti satırı karnenin "bekleyen araç" cümlesiyle birlikte düşünülecek. |
| **Müzayedede teminat** | GLR | Önce müzayede kazanılabilir olmalı (karar 8). |
| **Rakip galericilere marka/segment uzmanlığı ve görünür zarf geçmişi** | GEL, FUT | Karar 8'in "son 5 müzayede" satırı ilk adım. Rakip kişiliklerinin alım davranışına bağlanması ayrı bir tasarım işi. |
| **"3 gün bekle" toplu gün geçirme** | KRK | Olayları, sipariş ve emanet sürelerini atlatma riski (GEL). Karar 3'ten sonra boş gün oranına bakılacak. |
| **"Siparişi üstlen" mekaniği ve her sipariş için en az bir uyan ilan garantisi** | FUT | Karar 7 kabul edilmemiş siparişin cezasını kaldırıyor; üstlenme mekaniği ayrı bir iş. |
| **Günlük ödül ekonomisi** (vakanın skora bağlanması, ekspertiz görevinin ₺7K'dan ₺3K'ya inmesi, kilometre taşı ödüllerinin büyütülmesi ya da kozmetiğe dönmesi) | FUT, KRK | Oy almadı. Karar 1 ve 6 sonrası gelir düşünce oranlar yeniden ölçülecek. |
| **Galericiler grubu ve alıcı/satıcı cümle çeşitliliği** | FUT, GLR, GEL | İçerik genişletme işi. GLR "Sen araba mı alacaksın, rapor mu yazacaksın?" repliğinin korunmasını istedi. |
| **İlan dili şablonlarının modele bağlanması** (klasik ilanında "kışlık lastik" gibi jenerik metin) | GEL, ARB | Araç karakteri 2. adımıyla birlikte (Bölüm 4.3). |
| **Araç karakteri 2. adım**: `sz`/`gy`, model fişi, model bilen alıcı, aile olayları, görsel aile imzası, ad düzeltmeleri, yeni model | ARB, GEL | Bölüm 4.3'teki sırayla. |
| **Giriş ekranının boşluğu, araç görseli** | GNÇ | Mağaza görselleri işiyle birlikte. |
| **Gerçek cihazda 3B performans ölçümü** (3B'den dönünce ilk tıklamanın 2,7 sn gecikmesi) | ARB | swiftshader ölçümü temsil edici değil. Yayın öncesi orta segment Android cihazda ölçülecek; 3B'den çıkarken `cancelAnimationFrame` kontrolü not edildi. |
| **Bulut kaydı** | (v2'den) | Yol haritasında, değişiklik yok. |
