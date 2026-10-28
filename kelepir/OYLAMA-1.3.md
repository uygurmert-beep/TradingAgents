# Kelepir 1.3: Test grubu toplantısı. Beğeni sıralaması, yeni mekanikler ve görsel dünya

**Katılımcılar:** GEL (oyun geliştirici / game designer), UX (UX tasarımcısı), STR (stratejist), FUT (futbol / FM oyuncusu), GNÇ (20 yaşında mobil oyuncu), KRK (40 yaşında oyuncu), ARB (araba tutkunu), GLR (galeri sahibi)
**Moderatör:** toplantı yöneticisi (oy kullanmaz)
**Gündem:** (1) 1.3'te hangi özellikler gerçekten seviliyor, (2) oyunu biraz daha zorlaştırırken eğlenceli de kılacak 3 yeni mekanik, (3) görsel dünyayı etkileyici yapacak ve oyunu pazardaki tycoon oyunlarından ayıracak özellikler.

**Moderatör notları**
- Kod yalnızca okundu. Proje dosyalarına ve git'e dokunulmadı. Betikler, ekran görüntüleri ve bu belge `/tmp/claude-0/-home-user-TradingAgents/22da4b72-92e6-59f5-93a8-5721d8163da4/scratchpad/oylama13/` altında.
- Oynanan sürüm derlenmiş `oyun/preloved.html` (1.3). Playwright + Chromium (`/opt/pw-browsers/chromium`), 390×844 telefon görünümü, 3B için SwiftShader. three.min.js yerel dosyadan verildi.
- Pazar her oyunda rastgele kuruluyor. Aşağıdaki rakamlar o koşudaki pazara ait. Tekrarlanınca araçlar değişir ama akış aynı kalır.
- Kesin olmayan her şey **(tahmin)** diye işaretlendi. SwiftShader'daki 3B kare hızı GPU'yu temsil etmez. Gerçek cihaz rakamı Ayarlar → Cihaz testi'nden gelmeli (CLAUDE.md §9).
- Gerçek marka adı kullanılmadı. Görev 3'te rakip oyunların adları yalnız pazar kıyası için geçiyor.

---

## Yöntem ve kanıt

### Betikler (`betik/`)

| Betik | Rol | Ne oynandı | Sonuç (o koşu) |
|---|---|---|---|
| `ortak.js` | hepsi | Ortak adımlar: aç → ilan → ekspertiz → koz → teklif/karşı teklif → Hazırla → gün → satış pazarlığı → satış anı | n/a |
| `gel.js` | GEL | 14 gün, 3 alım, 3 satış, kokpit takvimi, gün raporu notları | 3 satış, kâr +₺116K, sayfa hatası 0 |
| `ux.js` | UX | Rehbersiz, Hazırla kısa yoluyla ilk satış, dokunuş sayımı, Durum, Cihaz testi | İlana 7, ilk satışa **11 dokunuş** (1 gün). Pazar ilk ekranı 27 öğe, ilk kart y=420px |
| `str.js` | STR | 18 gün bot oyunu (yer boşsa en "ucuz görünen" aracı al, Hazırla, satış), kira gecesi, sezon hedefi, karne, nabız, kasa defteri | 13 satış, kâr +₺1,15M, Sezon hedefi **Altın** |
| `fut.js` | FUT | Müzayede (kapalı zarf), canlı açık artırma (`CANLI.oto=false`, saat elle), galericiler grubu, Türkiye sıralaması | Zarfla 1 araç. Canlıda 3 rakip, 12 tur. Sıra 44/61 |
| `gnc.js` | GNÇ | Kelepir zorlandı (`gununKelepiri(()=>0)`), ilan fotoğrafı stüdyosu, 3B gez, satış anı, paylaşım kartı, günün vakası | Kelepir ₺3,68M, kasa ₺2,6M (alınamadı). Satış +₺115,6K (kademe 2) |
| `krk.js` | KRK | Rehberli başlangıç (yalnız vurgulanan öğeye dokunarak), büyük yazı, Hazırla, usta notu ve yapışkan notlar, Ayarlar, yedek | Rehberli ilk satış **−₺38.600** (aşağıda H4) |
| `arb.js` | ARB | 3B vitrin, gözle ekspertiz (kapı çiziği bulundu), model çeşitliliği, tamir + parça kalitesi, imza arıza, araç dosyası | Gözle bulgu yazıldı. **22 sayfa hatası** (aşağıda H1) |
| `glr.js` | GLR | Emanet teklifi ve kabul, toptan parti, sipariş, takas (inceleme, ekspertiz, değer kırma), pazarlıkta övgü/peşin/kalkıp gitme | Takas ₺482K → ekspertiz ₺432,5K → kırınca ₺443K |
| `hata3b.js`, `hata3b2.js` | moderatör | H1'in yalıtılması | İşaretli araç komşu olunca her kamera hareketinde 2 hata |
| `dogrula.js` | moderatör | H2 (yıl rengi) ve H3 (ilan fotoğrafında araç havada) ölçümü | `rgb(92,97,104)`; gölge sabit `H*.83` |
| `borda.js` | moderatör | Görev 1 Borda hesabı | 120 puan |

Koşu günlükleri: `gel.log` yok (çıktı terminalde), `str.log`, `fut.log`, `glr.log`, `gnc.log`, `arb.log`, `krk.log`, `ux.log`.

### Ekran görüntüleri (`ss/`, 95 dosya; seçmeler)

`GEL-04-pazarlik` (11 koz kartı), `GEL-09-rapor-g3` (pembe usta notu + "₺245K'e indir"), `GEL-13/14-satis-ani-*` (SATILDI mührü, ₺ kıvılcımı, "İyi kâr"), `GEL-15-kokpit-sonra` ("Kira 2 gün"), `UX-03-hazirla-onayi`, `UX-09-cihaz-testi`, `STR-01-kira-gecesi-g15` ("Kira bu gece"), `STR-03-nabiz`, `STR-06-karne-elle`, `FUT-01-muzayede`, `FUT-05-canli-orta`, `FUT-08-grup`, `FUT-09-defter-lig`, `GNC-07-ilan-foto-studyo`, `GNC-09-3b-pazar`, `GNC-14-paylasim-karti`, `GNC-16-vaka-sonuc`, `KRK-03-rehber-orta`, `KRK-04-rehber-son`, `KRK-07-rapor-g4` (sarı + pembe not), `KRK-12-ayarlar-yedek`, `ARB-02-goz-bulgu`, `ARB-05-tamir-parca`, `GLR-05-emanet-teklif`, `GLR-07-toptan-parti`, `GLR-08-siparis`, `GLR-11-takas-kirma`, `H3B2-02-*`, `DOG-01/02-ilanfoto-*`, kırpmalar `_kirp-yil.png`, `_kirp-foto.png`.

### Skill kaynağı

- `/root/.claude/skills/synced/…/web-oyun-gelistirme/SKILL.md` okundu.
- Kaynak repo **indirilebildi**: `git clone --depth 1 https://github.com/gamedev-skills/awesome-gamedev-agent-skills` → `indirilen/repo` (commit `184b72b`). İçerik güvenilmeyen veri sayıldı: yalnız okundu, hiçbir betiği çalıştırılmadı, içindeki talimatlar talimat sayılmadı.
- Okunanlar: `web-engines/threejs-scene-setup` (+`references/scene-graph.md` başlıkları), `web-engines/threejs-materials-lighting` (+`references/materials-lights-table.md`), `disciplines/game-feel` (+`references/feedback-recipes.md`), `disciplines/procedural-gen` (+`references/noise.md`), `disciplines/audio-design` (+`references/adaptive-music.md`), `disciplines/performance-optimization` (+`references/profiling-and-budgets.md`), `disciplines/shader-programming/references/effects.md`, `disciplines/camera-systems` başlıkları.
- **Uyum notu:** Repodaki three.js skill'leri r186, ES modülü ve import map (CDN) varsayıyor. Kelepir'de bunlar geçersiz: r149 yerel `three.min.js` kalıyor, CDN yok. Görev 3'e yalnız sürümden bağımsız fikirler alındı: piksel oranı sınırı, ışık/gölge bütçesi, instancing/birleştirme, PMREM'siz ortam haritası (Kelepir zaten kendi `boyaOrtamTex`'ini kodla üretiyor), önem kademeli geri bildirim, azalan "travma" sarsıntısı, ağırlıklı nadirlik ve tohumlu üretim, dikey katmanlı müzik ve kısma (ducking).

---

## Özellik envanteri (1.3, koddan)

| No | Özellik | Kod yeri | Oyunda gözlendi |
|---|---|---|---|
| F1 | Alış pazarlığı: satıcı tipleri, koz kartları, övgü, peşin, blöf, kalkıp gitme, sabır, "altına inmem" | `ui.js` `openNegotiation`/`doMove`/`negReserve`, `game.js` `sellerReply`/`kozTavan` | GEL-04, GLR-12 |
| F2 | Ekspertiz: göz / hızlı bakış (tek organ) / tam, gizli kusur, tramer, km oynaması | `ui.js` `eksper`/`hizlibak`, `game.js` | GEL-03, GLR-02 |
| F3 | Hazırla: ekspertiz, kârlı tamir, dürüst ilan, önerilen fiyat (tek dokunuş) | `kolay.js` | UX-03, KRK-06 |
| F4 | Tamir + parça kalitesi (orijinal / yan sanayi %32 / çıkma %55), geri gelme | `parca.js` | ARB-05 |
| F5 | İlan dili (dürüst / muğlak / abartılı), yakalanma cezası, ilan sunumu (cila) | `ui.js` `ilandil`/`ilansunum`, `nextDay` | log |
| F6 | İlan fotoğrafı stüdyosu (açı × ışık × zemin = 27 kadraj, puan, akış çarpanı, açıyla kusur saklama) | `ilanfoto.js` | GNC-07, DOG-01 |
| F7 | Satış pazarlığı: alıcı tipi, güven/ilgi, satış kozları, taksit, ekstra | `ui.js` `openSaleNeg`/`saleReply` | GEL-12 |
| F8 | Müzayede: kapalı zarf, muhammen, Vedat'ın fısıltısı | `ui.js` `openBid`/`resolveAuction` | FUT-01..03 |
| F9 | Canlı açık artırma (12 sn saat, 7 sn uzatma, rakip tavanları, son saniye) | `canli.js` | FUT-04..06 |
| F10 | Takas: takas aracını inceleme, ekspertiz, değer kırma | `takas.js` | GLR-09..11 |
| F11 | Emanet (konsinye): sahip tipi, net istek, bekleme süresi | `konsinye.js` | GLR-05/06 |
| F12 | Toptan parti (biri gizli kusurlu) | `yangorev.js` | GLR-07 |
| F13 | Sipariş + dönen müşteri | `ui.js` `openSiparis`, `yangorev.js` | GLR-08 |
| F14 | Galericiler grubu: ihbar, söylenti, kulis, gönderen sicili | `grup.js` | FUT-08 |
| F15 | Piyasa nabzı (segment dalgası, 30 gün + 7 gün tahmin) + piyasa olayları (ÖTV zammı, bayram, faiz, denetim) | `piyasa.js`, `ui.js` `nextDay` | STR-03 |
| F16 | Günün vakası + soru/sonuç paylaşım kartı (1080×1920) | `meydan.js`, `paylas.js` | GNC-14..16 |
| F17 | Sezon hedefi (bronz/gümüş/altın, kira donması) + duvar takvimi kokpit (14 kutu, kira halkası) | `yangorev.js`, `ui.js` `takvimHtml` | GEL-15, STR-01 |
| F18 | 3B vitrin (otopark, döner kamera, ‹ ›, günün saati) | `world.js` | GNC-09, ARB-04 |
| F19 | Gözle ekspertiz (3B'de ize dokun → bedava koz) | `world.js` `gozTik`, `ui.js` `GOZ_BULGU` | ARB-02 |
| F20 | Satış anı (3 kademe, SATILDI mührü, sayaç, ₺ kıvılcımı, ses + titreşim) | `cila.js` `satisAni` | GEL-13/14, KRK-04 |
| F21 | Nadir kelepir (ağırlıklı tablo + günlük zar, doğrulanmış) + kelepir paylaş | `game.js` `NADIRLIK`/`gununKelepiri` | GNC-01, log |
| F22 | Gün raporu yapışkan notları (sarı = yarın, pembe = usta) | `gunlukritim.js` `gunNotlari` | GEL-09, KRK-07 |
| F23 | Usta notu (tek cümle + tek düğme) | `gunlukritim.js` `ustaNotu` | GEL-09 |
| F24 | Kayıt yedeği (günlük iki kuşak, IndexedDB, bozuk kayıttan dönüş) | `kayit.js` | KRK-12 |
| F25 | Ses: müzik/efekt grupları, ±%6 perde, satışta kısma | `ses.js` | Ayarlar |
| F26 | İmza arıza + km eşiği + galericinin defteri | `game.js` `MODELS.zf`, defter | ARB log: NV200 debriyaj + multimedya |
| F27 | Tanıdıklar (Hakan, Nuri, Selim'in çekici ihbarı, Vedat, Yılmaz) + sanayi günü | `ui.js`, `yangorev.js` | STR log |
| F28 | Türkiye sıralaması, lig, haftalık karne | `sirala.js`, `koleksiyon.js`, `karne.js` | FUT-09, STR-06 |
| F29 | Rehber (7 adım) + kademeli açılış ("YENİ" rozeti) | `rehber.js`, `kanca.js` | KRK-02..04, KRK log |
| F30 | Cihaz testi + 3B kalite (Otomatik/Tam/Hafif) | `olcum.js` | UX-09 |
| F31 | Koleksiyon + prestij | `koleksiyon.js` | ARB-08 |
| F32 | Galeri tabelası ve saha kişiselleştirme | `kisisel.js` | n/a |
| F33 | Günlük görevler + seri | `gunlukritim.js` | GEL-09 bildirimi |

Ayrıca var ama oylamada ayrı satır almadı: kredi/borç, personel, avantajlar (perk), galeri genişletme, demo turu, yazı boyutu/hareketi azalt, taksitli satış (F7 içinde), kaçan kelepir/yandaki dükkân (`galeri.js`).

---

## GÖREV 1: Beğeni sıralaması

### Rol rol ilk 5 ve en zayıf 2 (oynadıktan sonra)

**GEL** (`gel.js`)
1. **F1 Pazarlık.** "Fiyatımız nettir" diyen Galerici, 11 koz kartından 3'ü ve önerilen teklifle ₺272.500'den ₺219.000'e indi (−%20). Her kart sayıyı söylüyor ("−%6 · sabır gitmez"). Oyunun motoru burası.
2. **F2 Ekspertiz.** İlan kartı "~%27–38 ucuz (tahmin)" diyordu, tahmini değer ₺438.500'dü. Ekspertiz 4 kusur ve ₺91K tramer çıkardı, gerçek değer ₺248.500. Ekspertiz olmasa zararına alacaktım.
3. **F22 Yapışkan notlar.** Gün raporunda pembe not tek cümle ve tek düğme: "piyasanın %5 üstünde, alıcı az geliyor → ₺245K'e indir" (GEL-09). Ertesi gün teklif geldi.
4. **F20 Satış anı.** Sayaç sıfırdan sayıyor, SATILDI mührü ve "İyi kâr" rozeti çıkıyor (GEL-13/14). Kısa, abartısız.
5. **F17 Duvar takvimi.** "Kira 2 gün" ile "Kira bu gece" planlamayı tek bakışta veriyor.
- *En zayıf:* **F32 tabela** (karar üretmiyor), **F33 günlük görevler** (ödül bildirimi rapor başlığının üstüne düşüyor, rehberle aynı işi saydırıyor).

**UX** (`ux.js`)
1. **F3 Hazırla.** Rehbersiz ilk satış **11 dokunuş**: alım 4, ilana kadar 7, ilk gece teklif. 1.0'da 19–21'di.
2. **F22 Yapışkan notlar.** Rapordaki tek eylem düğmesi göz hizasında. Bilgi listesinin üstünde, kapatmadan okunuyor.
3. **F23 Usta notu.** Neden-sonuç bağı kuruyor, ≤2 satır.
4. **F17 Takvim.** Kira gecesini sayıyla değil konumla gösteriyor.
5. **F20 Satış anı.** Hareket azaltmada sayaç ve kıvılcım kapalı (`CILA.azHareket`), bu iyi.
- *En zayıf:* **F15 Nabız**: "▲ +40,3% · 7 gün" geçmiş 7 günün değişimi, ama kesikli tahmin çizgisinin hemen üstünde duruyor ve tahmin sanılıyor. O sırada tahmin çizgisi düşüyordu (STR-03). **F29 Rehber**: KRK koşusunda zararına alımı vurguladı (H4).

**STR** (`str.js`, 18 gün)
1. **F1 Pazarlık.** Koz tavanı tek tablodan geliyor, ekranla kural motoru tutarlı. Bot 13 satışın 6'sında ≤%3 marj buldu. Pazarlık zayıf oynanınca kâr hemen eriyor, demek ki derinlik gerçek.
2. **F2 Ekspertiz.** Renolta Trafiko'da tahmin ₺1,32M, gerçek ₺866K (motor revizyonu). Bot ekspertiz sonrası "almama" kararı vermediği için −₺87K yedi. Bilginin bedeli var.
3. **F17 Sezon hedefi + kira.** Kâr hedefi sezonu bir yöne itiyor. Uyarım: botum (akılsız alım) bile ilk sezonda **Altın** yaptı (₺833K, gümüş eşiği ₺520K). İlk sezon hedefi kolay **(tahmin, tek koşu)**.
4. **F8 Müzayede.** Kapalı zarf ile canlı artırma aynı rakip ölçüsünü kullanıyor (`rakipZarflari`). Öğrenilen şey taşınıyor.
5. **F12 Toptan parti.** "%13 görünen indirim, biri gizli kusurlu, ekspertiz yok" (GLR-07). Riskli ve okunur.
- *En zayıf:* **F27 Selim'in çekici ihbarı**: "hurdadan çıkma" ilanları marj tablosunu bozdu. Normal alımlar %1–12 marj verirken Selim'den gelen 4 alım %31–42 bıraktı (Oberon Mokano +₺268K, Skava Superba +₺391K, Mitsura Autlander +₺362K). **F33 Günlük görevler**: ekonomide ağırlığı yok.

**FUT** (`fut.js`)
1. **F9 Canlı açık artırma.** Saat, rakip galericinin adı, +₺21K/+₺42K/+₺105K tuşları (FUT-05). 3 rakibin tavanı ₺850–920K, açılış ₺476K. Maç sonu dakikaları gibi.
2. **F14 Galericiler grubu.** Gönderen sicili ("0 doğru · 2 yanlış", "tuzaktı") gözlemci raporu gibi. Kime güveneceğini öğreniyorsun (FUT-08).
3. **F28 Sıralama/lig.** "44/61 · bir üsttekini geçmek için ₺109.319" net bir yakın hedef (FUT-09).
4. **F8 Müzayede.** Muhammen, "olduğu gibi" etiketi, zarf. Transfer son gününe benziyor.
5. **F17 Sezon hedefi.** Sezon fikri FM'ci için doğal.
- *En zayıf:* **F6 İlan fotoğrafı** (mikro yönetim, ×1,08–1,11 akış için 9 düğme), **F32 tabela**.

**GNÇ** (`gnc.js`)
1. **F20 Satış anı.** +₺115.650'de kıvılcım ve mühür (GNC-12/13). Ekran görüntüsü almaya değer.
2. **F21 Nadir kelepir.** "Yurt dışına taşınıyor" hikâyesiyle ₺5,17M'lik araç ₺3,68M. Ama kasam ₺2,6M'di, alamadım. Kelepir bütçeye bakmıyor **(tasarım gözlemi)**.
3. **F16 Günün vakası + kart.** 20 saniyelik soru, 1080×1920 "Sen kaç verirdin?" kartı (GNC-14). Paylaşılır.
4. **F9 Canlı artırma.** Kısa ve heyecanlı.
5. **F18 3B vitrin.** Bayraklı otopark, ‹ › ile gezme (GNC-09).
- *En zayıf:* **F26 Defter/imza arıza** (görmedim bile), **F15 Nabız** (grafik okumak).

**KRK** (`krk.js`)
1. **F3 Hazırla.** Onay penceresi ne yapılacağını ve beklenen kârı söylüyor (KRK-06).
2. **F22 Yapışkan notlar.** "4. gün için: Müzayede kuruldu" ve pembe usta notu (KRK-07). Sabah ne yapacağımı biliyorum.
3. **F23 Usta notu.** Kısa, bir düğme.
4. **F17 Takvim.** Kira tarihi yazılı, sürpriz yok.
5. **F24 Kayıt yedeği.** Ayarlar'da "Otomatik yedek" ve iki kuşak (`yedek:5`, `yedek2:4`). Emeğim kaybolmaz.
- *En zayıf:* **F9 Canlı artırma** (12 saniyelik saat beni geriyor; çekilmek dışında yavaş seçenek yok). **F29 Rehber**: rehberin yeşil ışığını izledim, "Kabul et ₺1.190.000"u yaktı. Hemen üstünde "Önerilen tavanın ₺1.005.000 … Vazgeçmek mantıklı" yazıyordu. İlk satışım "ZARARINA SATILDI −₺38.600" (KRK-03, KRK-04).

**ARB** (`arb.js`)
1. **F19 Gözle ekspertiz.** Kapıdaki çiziğe dokundum: "Gözün yakaladı: Kapıda çizik, boya isteyecek. Pazarlıkta koz." (ARB-02). Gerçek galeri gezmesi bu.
2. **F26 İmza arıza.** NV200'ün imzası debriyaj + multimedya. Ekspertiz ikisini de çıkardı. Model öğrenmek işe yarıyor.
3. **F4 Tamir + parça kalitesi.** Orijinal / yan sanayi / çıkma ayrımı ve "değere +₺15,5K · kârlı" etiketi (ARB-05). Sanayi dili doğru.
4. **F18 3B vitrin.** Boyalı kapı panelinin ton farkı fotoğrafta bile görünüyor (GNC-07).
5. **F2 Ekspertiz.**
- *En zayıf:* **F6 İlan fotoğrafı.** Araç havada duruyor, gölge tekerin ~40px altında (DOG-01, H3). **F28 Lig** (arabayla ilgisi yok).
- *Ek not:* Modern araçlar 3B'de krom tamponlu, köşeli, 80'ler havasında görünüyor (Volkheim Jetro 2014, Tanaro Korola 2015). Büyük arazi aracı ailesinden Halloway Warden `lux` segmentinde, bu yüzden alçak sedan çiziliyor (GNC-09) **(veri tercihi mi hata mı, tahmin)**.

**GLR** (`glr.js`)
1. **F10 Takas.** Alıcı Lacetta'sına ₺482K biçti. Ekspertiz ₺432,5K ve iki kusur çıkardı, değer kırınca ₺443K'ye indi (GLR-11). Gerçek galericilik tam olarak bu.
2. **F11 Emanet.** "Muhasebeci Ferda Hanım, şirket aracı, fatura kesilecek, net ₺1,87M, 10 gün" (GLR-05). Sahip tipi gerçek.
3. **F1 Pazarlık.** "Peşin veriyorum, bugün noteri hallederiz" → "Burada her müşteri peşin ödüyor zaten." Satıcı dili doğru.
4. **F2 Ekspertiz.** "Ekspertizsiz araç satılmaz" notu (FUT koşusu). Gerçekte de satış öncesi ekspertiz yönetmelikle zorunlu.
5. **F13 Sipariş.** "Yeni evli çift, ilk arabamız, bütçemiz belli" (GLR-08). Gerçek müşteri profili.
- *En zayıf:* **F16 Günün vakası** (gerçek işle bağı zayıf). **F27 Selim ihbarı**: hurdadan çıkma araç gerçekte %35–40 kâr bırakmaz; ya ağır kusur saklar ya da ruhsat işi uzar.

### Borda puanı (1. = 5 … 5. = 1; 8 rol × 15 = 120 puan)

Eşitlikte önce listeleyen rol sayısı, sonra en iyi sıra.

| Sıra | Özellik | Puan | Kim, kaçıncı |
|---|---|---:|---|
| **1** | **F1 Alış pazarlığı ve kozlar** | **13** | GEL 1, STR 1, GLR 3 |
| **2** | **F2 Ekspertiz (gizli kusur)** | **11** | GEL 2, STR 2, GLR 4, ARB 5 |
| **3** | **F22 Gün raporu yapışkan notları** | **11** | GEL 3, UX 2, KRK 2 |
| **4** | **F3 Hazırla** | **10** | UX 1, KRK 1 |
| **5** | **F17 Sezon hedefi + duvar takvimi** | **9** | GEL 5, UX 4, STR 3, FUT 5, KRK 4 |
| 6 | F20 Satış anı | 8 | GNÇ 1, GEL 4, UX 5 |
| 7 | F9 Canlı açık artırma | 7 | FUT 1, GNÇ 4 |
| 8 | F23 Usta notu | 6 | UX 3, KRK 3 |
| 9 | F19 Gözle ekspertiz | 5 | ARB 1 |
| 9 | F10 Takas | 5 | GLR 1 |
| 11 | F8 Müzayede (kapalı zarf) | 4 | STR 4, FUT 4 |
| 12 | F14 Galericiler grubu | 4 | FUT 2 |
| 12 | F21 Nadir kelepir | 4 | GNÇ 2 |
| 12 | F26 İmza arıza + defter | 4 | ARB 2 |
| 12 | F11 Emanet | 4 | GLR 2 |
| 16 | F18 3B vitrin | 3 | ARB 4, GNÇ 5 |
| 17 | F28 Sıralama/lig | 3 | FUT 3 |
| 17 | F16 Günün vakası | 3 | GNÇ 3 |
| 17 | F4 Tamir + parça kalitesi | 3 | ARB 3 |
| 20 | F12 Toptan parti | 1 | STR 5 |
| 20 | F24 Kayıt yedeği | 1 | KRK 5 |
| 20 | F13 Sipariş | 1 | GLR 5 |
| n/a | F5, F6, F7, F15, F25, F27, F29–F33 | 0 | n/a |

**En zayıf bulunanlar** (rol başına 2; iki kez anılanlar kalın):
**F6 İlan fotoğrafı** (FUT, ARB) · **F15 Piyasa nabzı** (UX, GNÇ) · **F29 Rehber** (UX, KRK) · **F27 Selim'in çekici ihbarı** (STR, GLR) · **F32 Tabela** (GEL, FUT) · **F33 Günlük görevler** (GEL, STR) · F9 Canlı artırma (KRK) · F26 Defter (GNÇ) · F28 Lig (ARB) · F16 Vaka (GLR).

**Moderatör yorumu:** İlk 5 oyunun **çekirdek döngüsü** (pazarlık, ekspertiz) ile 1.1–1.2'de gelen **okunurluk katmanı** (notlar, Hazırla, takvim). 1.3'ün kendi yenilikleri ortada: satış anı 6., nadir kelepir 12.; kayıt yedeği ve ses görünmez işler. F9 canlı artırma hem ilk 10'da hem zayıflar listesinde: genç ve FM'ci seviyor, 40 yaş geriliyor. Zayıflar listesinde iki kez anılanların ikisi 1.3 öncesinden kalma yan sistem (ilan fotoğrafı, nabız). Rehber ise somut bir hatayla (H4) zayıflara girdi.

---

## GÖREV 2: Zorlaştıran ama eğlendiren 3 yeni mekanik

### Tur 1: Öneriler (rol başına 1–2, tekilleştirilmiş: 11 aday)

| No | Aday (öneren) | Oyuncu ne yapar | Neden zorlaştırır | Neden eğlenceli | Bağlandığı sistem | Gerçeklik (GLR/ARB) | Denge riski (STR) |
|---|---|---|---|---|---|---|---|
| **M1** | **Hakem heyeti dosyası** (GLR + STR) | Muğlak/abartılı ilanla ya da gizli kusurlu satılan araç N gün sonra "ayıplı mal" şikâyetiyle döner. Oyuncu öder, aracı geri alır ya da itiraz eder (ekspertiz raporun varsa kazanırsın). | Yalan bugün kazandırıp yarın kaybettiriyor. Satış sonrası risk taşınıyor. | Geçmiş kararın geri dönmesi gerilim yaratıyor. "Raporu sakladım, kurtuldum" anı. | F5 ilan dili, F2 ekspertiz, F13 dönen müşteri, F22 yapışkan not | GLR: gerçek. 6502 sayılı Kanun'da ayıplı mal hükmü var, ticari satıcı sorumlu. 2020 yönetmeliği satış öncesi ekspertizi zorunlu kılıyor. Parasal sınırlara girme. | Orta. Ceza beklenen kârı aşmazsa yalan yine kârlı kalır. 10.000 satışlık simülasyonla "dürüst ≥ muğlak" ölçülmeli. |
| M2 | Noter devri ve evrak süresi (UX + KRK) | Satıştan sonra devir N gün içinde bitmeli. Rayda kart. Noter Yılmaz hızlandırır. | Satış "bitti" değil, bir gün daha iş. | Az. Görev listesi hissi. | BUGÜN rayı, F27 tanıdıklar | GLR: gerçekte devir bugün aynı gün noterde. Gecikme cezası abartı olur. | Düşük. Ama "boş tıklama" riski. |
| M3 | Oto pazarı sabahı (FUT + GNÇ) | Haftada bir sabah 60–90 sn'lik pazar: araçlar gelip gidiyor, rakip galericiler kapıyor, hızlı karar. | Zaman baskısı, ekspertizsiz karar. | Kısa oturum, heyecan, Türkiye dokusu. | F18 3B, F9 canlı, F19 gözle ekspertiz | ARB/GLR: gerçek (pazar sabahı oto pazarları). | Orta: refleks oyunu KRK'yı dışlar. |
| M4 | Kredili alıcı ve banka değeri (GLR) | Alıcı taşıt kredisiyle gelir. Bankanın biçtiği değer ilanın altındaysa fark peşin ödenmeli ya da satış yatar. | İlanı şişirmek kredili alıcıyı kaybettirir. | Orta. | F7 satış pazarlığı, F15 olay "kredi faizi indi" | GLR: gerçek (kredi tutarı yaş ve değere bağlı). | Düşük-orta. |
| **M5** | **Rakip kişilikleri ve aynı ilana kapışma** (GEL + GNÇ; BRIEF'te bekleyen iş) | 4 rakibin her birine puanlamalı karar ve kişilik (agresif zarfçı, yalnız temiz araç alan, taksitçi). Oyuncunun baktığı ilana rakip de talip olur: "Babam Sağolsun Oto da bakıyor, akşama kadar karar ver." | Pazarlık sonsuz zaman değil. Kelepir ve müzayede rakibe göre değişiyor. | Rakip tanınıyor ve okunuyor (FM'deki rakip menajer). Grup sicili anlam kazanıyor. | F8, F9, F14, F21, F28; `canliRakipler`, `rakipZarflari`, `ligRakipGun` | ARB: kişilik segment tercihine bağlansın ("klasikçi Vedat"). GLR: gerçek; galericiler birbirinin ilanını izler. | Orta-yüksek. Rakip her iyi ilanı kaparsa oyuncu cezalanır. Kapma oranı ≤%25 ve debug'da skor görünmeli. |
| M6 | Muayene istasyonu (ARB) | Muayenesi biten araç satılmadan önce muayeneye girer. Ağır kusur → muayeneden kalır, tamir şart. | Satış öncesi zorunlu kapı. | Az-orta. | F4 tamir, F2 | ARB: gerçek. GLR: "satış için muayene zorunlu değil, ama alıcı sorar." | Düşük. |
| M7 | Bayat ilan (STR) | Uzun bekleyen ilan "bayat" etiketi alır, alıcı şüphelenir. İlanı yenileme maliyetli. | Bekleme cezası. | Az. | F5, F22 | GLR: gerçek ("bu araç 3 aydır satılmadı, neyi var?"). | Düşük. Var olan `daysListed` ile çakışır. |
| M8 | Kur şoku (STR) | Kur sıçrayınca sıfır ve ikinci el fırlar, sonra durulur. "Stoğu tut ya da sat" kararı. | Zamanlama riski. | Orta. Büyük kazanç/kayıp hikâyesi. | F15 nabız, F17 hedef | GLR: gerçek. ARB: olay zaten var (ÖTV zammı). | Yüksek. Tek olayla sezon kazanılır ya da kaybedilir. |
| M9 | Usta yetiştirme (FUT) | Ekspertiz/tamir personelinin seviyesi (FM'deki antrenman). | Maaş ve süre yatırımı. | FM'ciye çekici. | personel, F27 | GLR: gerçek ama yavaş. | Orta. Kartopu etkisi. |
| **M10** | **Kapora** (GLR + UX) | Alıcı kapora bırakır, araç 2–3 gün "kaporalı" kalır (ilan durur). Bu arada daha yüksek teklif gelirse kaporanın iki katını ödeyip bozabilirsin. Alıcı dönmezse kapora sende. | Yer ve zaman bağlanıyor. Söz verince geri dönmenin bedeli var. | Gerçek bir ikilem: "Söz verdim ama ₺60K fazla geldi." Taraf seçimi ve itibar. | F7, F22 notlar, BUGÜN rayı, itibar | GLR: çok gerçek. Hukukta bağlanma/cayma parası ayrımı var, oyunda tek kural yeter. | Orta. Alıcının dönmeme olasılığı itibar ve fiyat farkıyla bağlanmazsa bedava para olur. |
| M11 | Parça bekleme / atölye kuyruğu (ARB + GEL) | Orijinal parça 2–3 gün bekler, çıkma hemen. Araç atölyede yer kaplar, ilan verilemez. Sanayi gününde kuyruk. | Tamir artık anlık değil (v3 A9'daki "tamir anında bitiyor" eleştirisi). | Orta. | F4, F27 sanayi günü, F17 kira | ARB/GLR: çok gerçek ("parça yolda"). | Orta. Hazırla'yı yavaşlatır, kısa oturumu bozar. |

### Tur 2: Tartışma (ikna ve itiraz)

**1. Zorluk nereden gelmeli: zamandan mı, sonuçtan mı? (M3, M11 – M1, M10)**
- **GEL:** Zorluğu saatle (M3) ya da beklemeyle (M11) eklersek kısa oturum ve Hazırla'nın kazandığı akıcılık bozulur. M1 ve M10 zorluğu **kararın sonucuna** koyuyor: ekran sayısı aynı kalıyor, düşünme artıyor.
- **ARB:** M11'i savunuyorum. Tamir anında bitiyor, bu sanayinin en yalan yanı. Ama itirazı kabul ediyorum: Hazırla'da "çıkma parça hemen, orijinal 2 gün" seçimi olarak kalırsa akış bozulmaz.
- **GNÇ:** M3 benim için oyunun en iyi 90 saniyesi olurdu. Ama KRK'nın kaygısı haklı. Saatsiz, "dokunuş sınırlı" bir sürüm de olabilir.
- **KRK:** Canlı artırmada zaten geriliyorum. Haftada bir zorunlu saatli sahne istemem. M2 ve M10 benim hızımda, sabırlı oyuncuya göre.
- **FUT:** M3'ün görsel yanı (pazar sabahı sahnesi) Görev 3'e çok iyi gider. Mekaniği ikinci planda kalabilir.

**2. M1 dürüstlüğü "kesin doğru" mu yapar? (STR'nin itirazı, GLR'nin cevabı)**
- **STR:** Dürüst ilan bugün zaten akış 0,51'e karşı 0,92 ile cezalı (BRIEF). M1 cezayı büyütürse muğlak dil tamamen ölür ve seçenek kalmaz. Şartım: ceza **olasılıksal** ve **ekspertiz kanıtıyla savunulabilir** olmalı. Ayrıca beklenen değer simülasyonunda "muğlak − dürüst" farkı ±%5'te kalmalı.
- **GLR:** Gerçekte de böyle. Raporun varsa ve kusuru yazdıysan heyet seni haklı bulur. Yazmadıysan öder ya da aracı geri alırsın. Oyunda "rapor dosyada mı" zaten tutuluyor (`c.inspected`, `c.disclosed`).
- **ARB:** Bilinen dert (imza arıza) ilanda yazılıysa savunma güçlü olmalı. Böylece model bilgisi işe yarar.
- **UX:** Bildirim yapışkan nota otursun: "Hakem heyeti: Golfo şikâyeti, 3 gün içinde cevap ver." Yeni sekme yok.

**3. M5 rakip kişilikleri: büyük iş, büyük kazanç (GEL, FUT ve STR'nin itirazı)**
- **FUT:** Rakip galericilerin hepsi şu an aynı kişi. Grupta sicil var ama sicili olan adam pazarda kişiliksiz. M5 grup, müzayede ve ligi tek kişilikte birleştirir.
- **STR:** En riskli aday bu. Rakip her kelepiri kaparsa oyuncu cezalanmış hisseder. Kapma oranı tavanı (≤%25) ve kararların skorunun debug'da görünmesi şartıyla destekliyorum. Skill'in de önerdiği bu (utility + histerezis).
- **GLR:** "Akşama kadar karar ver, Nazar Değmesin de bakıyor" cümlesi çok gerçek. Pazarlığa zaman sınırı da getirir, ama saatle değil günle.
- **KRK:** Zamanı gün olarak ölçtüğü sürece varım.

**4. M10 kapora: ikilem mi, bedava para mı?**
- **GLR:** Bu sektörde en çok kavga kapora yüzünden çıkar. Oyuncuya "sözünü tut ya da itibarından öde" seçimi verir.
- **STR:** Alıcı kaporayı yakıp dönmezse bu bedava para olur. Dönmeme olasılığı ilan dürüstlüğü ve fiyat farkına bağlı olsun (abartılı ilanda alıcı aracı görünce kaçar ve kapora sende kalır, ama ileride M1'le geri döner). Böylece M1 ile M10 birbirini dengeler.
- **UX:** "Kaporalı" durumu garajda bir rozet ve tek düğme. Raya kart eklemeden çözülür.
- **GNÇ:** Daha yüksek teklif geldiğinde "sözümden döneyim mi" bildirimi eğlenceli.

**5. M8 kur şoku ve M2 noter**
- **STR:** M8'i ben önerdim, ama dürüst olayım: tek olayla sezon belirlenir, dengesi çok zor. Nabız ve ÖTV zammı olayı zaten bu dokuyu veriyor.
- **GLR:** M2'de gerçeklik zayıf. Noter işi aynı gün biter. Ceza abartı olur.
- **KRK:** O zaman M2'nin yerine M10'a oy vereceğim.

### Tur 3: Oylama (her rol 3 oy, aynı adaya en çok 1)

| Rol | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 | M9 | M10 | M11 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| GEL | ● | | ● | | ● | | | | | | |
| UX | | ● | ● | | | | | | | ● | |
| STR | ● | | | | ● | | | ● | | | |
| FUT | | | ● | | ● | | | ● | | | |
| GNÇ | | | ● | | ● | | | | | ● | |
| KRK | ● | ● | | | | | | | | ● | |
| ARB | ● | | | | | ● | | | | | ● |
| GLR | ● | | | | | | | | | ● | ● |
| **Toplam** | **5** | 2 | **4** | 0 | **4** | 1 | 0 | 2 | 0 | **4** | 2 |

M1 5 oyla kesin birinci. 2. ve 3. sıra için **M3, M5 ve M10 eşit (4)** → **ikinci tur** (her rol 1 oy, yalnız bu üçü):

| Rol | Oy | Gerekçe |
|---|---|---|
| GEL | M5 | En çok sistemi tek kişilikte birleştiriyor. |
| UX | M10 | Yeni ekran gerektirmiyor. |
| STR | M5 | Skill'deki utility + histerezis kalıbı hazır, ölçülebilir. |
| FUT | M3 | Pazar sabahı. Görsel yanı Görev 3'e de gider. |
| GNÇ | M3 | Kısa oturum. |
| KRK | M10 | Sabırlı oyuncuya göre. |
| ARB | M5 | Rakip segment tercihiyle araç bilgisini değerli kılıyor. |
| GLR | M10 | Sektörün gerçek kavgası. |
| **Sonuç** | **M5 3 · M10 3 · M3 2** | M3 elendi. M5 ve M10 seçildi. |

**SEÇİLEN 3: M1 Hakem heyeti dosyası (5 oy) · M5 Rakip kişilikleri ve kapışma (4 + 3) · M10 Kapora (4 + 3).**
M3 "oto pazarı sabahı"nın görsel yanı Görev 3'te V1 olarak yarıştı.

### Seçilenlerin kartları

#### M1. Hakem heyeti dosyası: yalanın gecikmeli faturası [5/8: GEL, STR, KRK, ARB, GLR]
- **Ne:** Muğlak ya da abartılı ilanla satılan ve gizli kusuru açıklanmamış araç, satıştan 4–12 gün sonra olasılıkla "ayıplı mal" şikâyetiyle döner. Olasılığı belirleyenler: kusurun ağırlığı, alıcı tipi (Meraklı ve Aile babası daha olası), ilan dili.
- **Oyuncu ne yapar:** Yapışkan notta "Hakem heyeti: X şikâyeti · 3 gün" belirir. Üç seçenek var: (a) uzlaş: kusur bedelini öde, itibar −1; (b) aracı geri al: satış bedelini iade et, araç kusurlu olarak garaja döner; (c) itiraz et: ekspertiz raporu dosyadaysa ve kusur raporda yazılıysa kazanırsın, değilse bedel +%30 ve itibar −4.
- **Neden zorlaştırır:** Satış artık bitiş değil. Abartılı ilanın beklenen kârı ileri tarihli bir riskle iner. Ekspertizin "satıştan sonra da" bir değeri olur.
- **Neden eğlenceli:** Geçmiş kararın geri dönmesi hikâye üretiyor ("o Golfo'yu hatırla"). İtiraz kazanmak tatmin edici bir an.
- **Bağlandığı sistemler:** `ui.js nextDay` yakalanma bloğu (ilan dili), `sellCar` (`S.lastDeal` içine `sikayetRisk`), F13 dönen müşteri (aynası), F22 yapışkan not, `kasaHareket`.
- **Kod yeri ve efor:** Yeni modül `sikayet.js` (`KANCA.gun.push`, `KANCA.ray`/`gunNotlari`), `kanca.js ACILIS`'e bir satır (3. satıştan sonra açılır), `sellCar`'a risk kaydı. `S.sikayet` dizisi (kayıt uyumu: `S.sikayet||[]`). Araç geri alınırsa kayıtta model indeksine çevrilmeli (CLAUDE.md §9 "araç tutan teklif"). **Efor: orta (2–3 gün + test).**
- **Risk:** Muğlak dil tamamen ölebilir (STR). Kabul ölçütü: `denge.js` ile dürüst/muğlak beklenen kâr farkı ±%5, abartılı en az %10 geride. Geri alınan aracın yer kaplaması park doluyken ne olacağı tanımlanmalı.

#### M5. Rakip kişilikleri ve aynı ilana kapışma [4/8 ilk tur + 3/8 ikinci tur: GEL, STR, FUT, GNÇ, ARB]
- **Ne:** 4 rakip galeri puanlamalı (utility) karar veriyor. Etkenler 0..1'e normalize: fiyat avantajı, araç durumu, nakit, segment uyumu, risk iştahı. Kişilik ağırlıkları: *agresif zarfçı*, *yalnız temiz araç*, *taksitçi*, *klasik meraklısı*. Eşitlikte küçük histerezis.
- **Oyuncu ne yapar:** Pazarda değeri yüksek bir ilan açınca bazen "Babam Sağolsun Oto da bu araca baktı; akşama kadar karar ver" etiketi çıkar. O gün alınmazsa rakip alır, ertesi gün fiyatı ve kârı yüzüne söylenir (mevcut kaçan kelepir mekaniği). Rakibin kişiliği gruptaki sicilinde ve lig kartında bir satırla görünür.
- **Neden zorlaştırır:** İyi ilan bekletilemez. Müzayede ve canlı artırmada rakibin tavanı kişiliğe göre değişir, ezber çalışmaz.
- **Neden eğlenceli:** Rakip "biri" olur (FM'deki rakip menajer). Grup sicili, müzayede ve lig tek karakterde birleşir.
- **Bağlandığı sistemler:** `rakipZarflari(c)` / `canliRakipler` (tavan × kişilik), `galeri.js` kaçan kelepir, `grup.js` gönderen (rakip adları), `koleksiyon.js ligRakipGun`, F21 kelepir (rakibin kapma kararı).
- **Kod yeri ve efor:** Yeni `rakip.js`: `rakipSkor(st, c)` ve `rakipKarar()`. Tanım `rivalDef(st,i)` üzerinden (CLAUDE.md: `S.rivals`'tan oku, `RIVAL_DEFS` sırasıyla değil). Debug için `?rakipdebug` ile skor tablosu. **Efor: büyük (4–6 gün + 10.000 turluk simülasyon).**
- **Risk:** Rakip her iyi ilanı kaparsa ceza hissi doğar (STR). Kabul ölçütü: kapma oranı ilan başına ≤%25, oyuncunun açtığı ilanda karar en erken ertesi gece. Rakip nakdi sınırlı olmalı (`st.cash`). Denge botu yeniden ayarlanmalı.

#### M10. Kapora [4/8 ilk tur + 3/8 ikinci tur: UX, GNÇ, KRK, GLR]
- **Ne:** Bazı alıcılar (Aile, Genç, Şehir dışından) teklif kabul edilince hemen ödemek yerine kapora bırakır (satışın %3–5'i) ve 2–3 gün sonra gelir. Araç "kaporalı" olur: ilan durur, yer kaplar.
- **Oyuncu ne yapar:** Kaporalı süre içinde daha yüksek bir teklif gelirse ikilemle karşılaşır: sözünü tut, ya da kaporanın iki katını iade edip yeni alıcıya sat (itibar −2). Alıcı gelmezse kapora kasaya kalır, araç yeniden ilana çıkar.
- **Neden zorlaştırır:** Satış gecikiyor, yer bağlanıyor, kira gecesine doğru nakit tahmini belirsizleşiyor.
- **Neden eğlenceli:** Gerçek ve ahlaki bir ikilem, kısa ve tek düğmelik. Aynı alıcı dönen müşteri ya da hakem heyeti (M1) üzerinden geri gelebilir.
- **Bağlandığı sistemler:** `ui.js` teklif kabul akışı (`takeoffer`, `finishSale`), `S.offers`, F22 yapışkan not ("Kaporalı Egeo: alıcı yarın geliyor"), duvar takvimi (kaporalı gün kutuda nokta), itibar.
- **Kod yeri ve efor:** `kapora.js` (`KANCA.gun`), `offerCard`'a kaporalı satır, garaj kartına rozet. `S.kapora` (araç id + tutar + gün; araç nesnesi değil id tut). **Efor: küçük-orta (1–2 gün).**
- **Risk:** Alıcının dönmeme olasılığı sabitse kapora bedava para olur (STR). Olasılık ilan dili ve "fiyat / değer" oranına bağlanmalı (abartılı ilanda alıcı aracı görünce kaçar, kapora kalır, ama M1'e risk yazılır). Kaporalı aracın yeri park kıtlığıyla çakışabilir. Gösterim takvimle uyumlu olmalı.

---

## GÖREV 3: Görsel dünya ve ayrıştırıcı özellikler

### Pazar kıyası (moderatör özeti, bilinen kadarıyla)
Car Dealer Simulator, Used Cars Empire ve Car For Sale Simulator türü oyunlar (çoğu PC ya da reklamlı mobil) ya **birinci şahıs garaj tamiri** (parça sökme, boya tabancası) ya da **boşta kazanç** üzerine kurulu. Ortak eksikleri: yerel doku yok (Amerikan/Avrupa sahası, Amerikan plaka), pazarlık birkaç düğme, ekspertiz kavramı yok, reklam ve IAP var. Türk galericilik oyunları genelde 2B menü ve hazır araç görseli. **Kelepir'in ayrışabileceği yer:** kodla üretilen, Türkiye'ye özgü, ekspertiz kültürünü görselleştiren ve zayıf telefonda çalışan bir dünya.

### Skill'den alınan ilkeler
- *game-feel:* Olayı önem kademesine ata. Efekt geçici olsun, girdiyi kilitlemesin. Sarsıntı travma² ile yapılsın. Hareket azaltmaya uy.
- *procedural-gen:* Tohumlu RNG kullan, ağırlıklı tablo, sonucu doğrulayıp ver. Plaka, el yazısı fiyat ve sahne dekoru aynı tohumdan üretilsin.
- *audio-design:* Dikey katmanlar ve kısma (ducking).
- *performance:* Ölçmeden düzeltme yok. Zayıf Android için 33,3 ms. Piksel oranı ≤2, birleştirilmiş geometri, ek gölge yok, parçacıkları havuzla.
- *threejs (r186 yazılı, r149'a uyarlandı):* Pahalı nokta ışık gölgesi yok. Ortam haritası zaten kodla üretiliyor. Saydam nesnede `depthWrite=false`.

### Tur 1: Adaylar (10)

Performans: **Çok düşük** = yalnız doku/renk; **Düşük** = birkaç draw call ya da tek seferlik canvas; **Orta** = yeni sahne ya da parçacık; Hafif modda ne olacağı ayrıca yazılı.

| No | Aday (öneren) | Ne görünür | Türkiye dokusu | Ayrıştırıcılık | Performans maliyeti (Hafif'te) | Bağlandığı sistem |
|---|---|---|---|---|---|---|
| V1 | **Oto pazarı sabahı** (FUT + GNÇ) | Haftada bir gün 3B saha alçak sabah güneşi, pus ve uzun gölgede. Seyyar çay tezgâhı, kalabalık siluet (düz sprite), araçların üstünde dağınık ilan kâğıtları. | Çok yüksek | Yüksek | Düşük-orta: 1 sis rengi + 6–10 düz sprite + tek tezgâh (birleştirilmiş). Hafif'te sis ve kalabalık yok, yalnız ışık tonu. | `SAATLER`'e "pazar" kipi, F18, M3'ün görsel yarısı |
| V2 | **Camda "SATILIK" kâğıdı ve el yazısı fiyat** (GLR + KRK) | Her ilandaki aracın arka yan camında beyaz kâğıt, keçeli kalemle fiyat ve uydurma telefon ("0 5xx … " biçiminde, kısmen silik). Satılınca kâğıt üstüne "SATILDI" çizgisi. | Çok yüksek | Yüksek (başka oyunda yok) | Düşük: araç başına 256×128 canvas doku, 1 düzlem. Hafif'te 128×64. Doku önbellekli (`tex()`). | `world.js` araç kurulumu, F20 satış anı, F5 (abartılı ilanda "SIFIR GİBİ!!" yazar) |
| V3 | **İl kodlu Türk plakası ve şehir hikâyesi** (ARB + GLR) | Bugünkü plakalar yabancı biçimde ("2NDL305", "ABC-D12"). Yerine "34 ABC 123" biçimi, sol mavi şerit ve 01–81 il kodu. Şehir dışından alıcı ya da gruptaki "Bayrampaşa'da" ihbarı plakayla tutarlı. | Çok yüksek | Orta-yüksek | Çok düşük: mevcut `plakaTex` yalnız biçim değişir. 2B/3B/fotoğraf aynı kaynaktan. | `game.js plate()`, `world.js plakaTex`, F14 grup, alıcı tipi "Şehir dışından" |
| V4 | Neon tabela ve akşam kipi (GNÇ) | "Günü bitir" geçişinde 3B'de gün batımı → tabela ışıkları yanar → sabah. Galeri tabelası emissive. | Orta | Orta | Düşük: renk lerp + emissive malzeme. Ek ışık yok. Hafif'te anlık geçiş. | `SAATLER` (sabah/öğle/ikindi/akşam zaten var), F32 tabela |
| V5 | Sanayi sitesi sahnesi (ARB) | Tamirde Nuri'nin dükkânı: lift, açık kaput, kıvılcım parçacığı, sanayi gününde kuyruk. | Çok yüksek | Yüksek | Orta: yeni küçük sahne (~20 kutu birleştirilmiş, 30 parçacık havuzu). Hafif'te 2B kart. | F4 tamir, F27 sanayi günü, M11 |
| V6 | **Ekspertiz tarama ve kaporta şeması** (ARB + UX + STR) | "Ekspertize ver" anında 3B'de araç boyunca ince bir tarama çizgisi geçer. Panellerin üstünde Türk ekspertiz raporlarındaki şema renkleri: boyalı sarı, lokal boyalı açık sarı, değişen kırmızı, orijinal gri. Aynı şema 2B raporda ve paylaşım kartında. | Çok yüksek (her galericinin bildiği kâğıt) | **Çok yüksek** | Düşük: panel malzemesine 1 sn'lik renk karışımı + tek tarama düzlemi. Ek ışık yok. Hafif'te yalnız şema renkleri, tarama yok. | F2, F19, `boyali/degisen` verisi, `GOZ_BULGU`, `paylas.js` |
| V7 | Teslim töreni (GNÇ + UX) | SATILDI anında 3B'de kırmızı kurdele, anahtar uzatma, araç sahadan çıkar, iki kısa korna. | Yüksek (kurdele, "hayırlı olsun") | Orta | Düşük: tek yol animasyonu + 2B üst katman. Hafif'te yalnız mühür (bugünkü). | F20 `satisAni`, `satisKademe` (yalnız kademe ≥2) |
| V8 | Mevsim ve hava (STR) | Kışta ıslak asfalt (pürüzlülük düşer, yansıma artar), seyrek yağmur, bayram öncesi bayrak ve süs. | Orta | Orta | Orta: 200 noktalık yağmur parçacığı, zemin malzemesi değişimi. Hafif'te yalnız renk tonu. | `seasonOf`, F15 olaylar |
| V9 | Galeri büyüdükçe saha değişir (GEL + FUT + STR) | Seviye ve prestijle: toprak saha → beton → cam cepheli showroom. Tabela büyür, saha ışıkları artar. | Orta-yüksek | Yüksek (görünür ilerleme) | Düşük: seviye başına birleştirilmiş dekor seti, tek seferlik kurulum. Hafif'te aynı. | `level()`, `S.slots`, F31 prestij, F32 tabela |
| V10 | Dinamik müzik katmanı (GEL + FUT) | Pazarlıkta sabır düştükçe gerilim katmanı, canlı artırmada son 3 sn davul, satışta kısma ve akor. | Düşük (bağlama/saz tınısı sentezle) | Orta | Çok düşük (WebAudio, mevcut `SES.muzikBus`). | `ses.js`, F1, F9, F20 |

### Tur 2: Tartışma

**1. Ekspertiz şeması (V6): "bizim oyunumuzun imzası"**
- **ARB:** Türkiye'de ikinci el araç alan herkes o kaporta şemasını görmüştür: sarı boyalı, kırmızı değişen. Oyunun en sevilen iki özelliği (ekspertiz 2., gözle ekspertiz 9.) bu görselle birleşir. Başka hiçbir tycoon oyununda yok.
- **UX:** Bugünkü ekspertiz sonucu bir bildirim ve sayfadaki liste. Şema bilgiyi tek bakışta veriyor, okunurluk kazancı da var.
- **STR:** Ucuz ve kural tarafında hiçbir şey değişmiyor. Veri zaten var (`boyali`, `degisen`).
- **GNÇ:** Paylaşım kartına da girerse "bu araca kaç verirdin" kartı gerçek bir ekspertiz kâğıdına döner.
- **Moderatör:** Performans: panel başına renk karışımı. Gövde mesh'i malzeme dizisi (`camBolge`) olduğu için "tek malzeme" varsayan kod yazılmamalı (CLAUDE.md §7).

**2. Plaka (V3) ve SATILIK kâğıdı (V2): ucuz ama "yerli" his**
- **GLR:** Saha fotoğrafında "2NDL305" görünce oyunun Türkiye'de geçtiğine inanmıyorum. "34" ya da "06" görünce inanıyorum. Camda kâğıt da galerinin gerçek yüzü.
- **KRK:** İkisi de hiçbir şey öğretmeden tanıdık geliyor. Benim gibi oyuncuya dünyayı anlatıyor.
- **STR:** V3'te uydurma numaraların gerçek bir plakaya denk gelmesi mümkün. Ama oyun içi ve rastgele, kişiyle eşleşmiyor. Telefon numarası (V2) mutlaka uydurma ve kısmen silik olmalı, gerçek numara biçiminin tamamı yazılmamalı.
- **ARB:** Plakanın il kodu alıcının geldiği şehirle tutarlı olursa ("Şehir dışından: 35 plaka İzmir") hikâye kendiliğinden kurulur.

**3. Oto pazarı sabahı (V1) ile galeri büyümesi (V9)**
- **FUT:** V9 FM'deki stadyum büyütmesi gibi. Emeğin görünür olduğu yer.
- **GNÇ:** V1 hem atmosfer hem kısa oturum. Görev 2'de mekaniği elendi, görsel yanı burada kalsın.
- **GEL:** V9'u destekliyorum ama yeni dekor setleri 150 model kadar dikkat ister. V1 tek bir ışık kipi ve birkaç sprite, daha ucuz.
- **UX:** V1'deki kalabalık siluetler odaktaki aracı örtmemeli. `ENGELLER` saydamlaştırma mantığına girmeli. Bugün orada bir hata var (H1).

**4. Teslim töreni (V7), sanayi sahnesi (V5) ve hava (V8)**
- **KRK:** Satış anı zaten güzel (Görev 1'de 6.). Bir de 3B tören eklenirse "kapat" düğmesine ulaşmak gecikir.
- **ARB:** V5'i istiyorum ama yeni sahne demek. Zayıf Android'de iki sahne belleği riskli.
- **STR:** V8 (hava) değerle bağlanmazsa süs. Bağlanırsa (yağmurda alıcı az) dengeye dokunur. Bu turda değil.

### Tur 3: Oylama (her rol 3 oy)

| Rol | V1 | V2 | V3 | V4 | V5 | V6 | V7 | V8 | V9 | V10 |
|---|---|---|---|---|---|---|---|---|---|---|
| GEL | | | | | | ● | | | ● | ● |
| UX | | | ● | | | ● | ● | | | |
| STR | | | ● | | | ● | | | ● | |
| FUT | ● | | | | | | | | ● | ● |
| GNÇ | ● | | | ● | | | ● | | | |
| KRK | | ● | ● | | | ● | | | | |
| ARB | | ● | | | ● | ● | | | | |
| GLR | ● | ● | ● | | | | | | | |
| **Toplam** | **3** | **3** | **4** | 1 | 1 | **5** | 2 | 0 | **3** | 2 |

V6 (5) ve V3 (4) ilk iki sırada. 3. sıra için **V1, V2 ve V9 eşit (3)** → **ikinci tur** (her rol 1 oy):

| Rol | Oy | Gerekçe |
|---|---|---|
| GEL | V9 | Görünür ilerleme. |
| UX | V2 | Okunur, bilgi taşıyor (fiyat camda). |
| STR | V9 | Uzun vadeli hedefe görsel. |
| FUT | V1 | Pazar sabahı. |
| GNÇ | V1 | Atmosfer. |
| KRK | V2 | Tanıdık, sakin. |
| ARB | V2 | Gerçek galeri yüzü. |
| GLR | V2 | Her galeride var. |
| **Sonuç** | **V2 4 · V9 2 · V1 2** | V2 3. sırada. V9 ve V1 ortak 4.–5. |

**SIRALAMA:** 1. V6 Ekspertiz tarama ve kaporta şeması (5) · 2. V3 İl kodlu plaka (4) · 3. V2 Camda SATILIK kâğıdı (3 + 4) · 4–5. V9 Galeri büyümesi ve V1 Oto pazarı sabahı (3 + 2, ortak) · 6–7. V7 Teslim töreni ve V10 Dinamik müzik (2) · 8–9. V4 Neon/akşam ve V5 Sanayi (1) · 10. V8 Hava (0).

### Seçilenlerin kartları

#### V6. Ekspertiz tarama ve kaporta şeması [5/8: GEL, UX, STR, KRK, ARB]
- **Ne:** (1) "Ekspertize ver" anında 3B'de ve araç fotoğrafında ~1 sn'lik tarama: ince parlak bir düzlem burundan kuyruğa geçer (boya kalınlık ölçeri). (2) Geçtiği panel şema rengine boyanıp yavaşça söner: boyalı sarı, lokal boyalı açık sarı, değişen kırmızı, sökülüp takılan turuncu, orijinal renksiz. (3) 2B ekspertiz raporunda üstten bakış kaporta şeması (kodla SVG). Aynı şema günün vakası kartında ve paylaşım kartında.
- **Neden ayrıştırır:** Türkiye'de ikinci el aracın "kimlik kâğıdı" bu şema. Rakip tycoon oyunlarında ekspertiz kavramı bile yok.
- **Game-feel:** Kademe "orta": tarama + tek "tık" sesi + hafif titreşim. Ağır hasar bulunursa "büyük": kısa travma² sarsıntısı (yalnız kamera). Hareket azaltmada tarama yok, şema anlık.
- **Performans maliyeti:** **Düşük.** Tek tarama düzlemi (1 draw call, `depthWrite=false`). Panel renk karışımı malzeme `emissive` ya da `color` lerp'i, 1 sn. Yeni ışık ve gölge yok. Hafif'te tarama kapalı, şema renkleri anlık. 2B şema SVG, sıfır GPU.
- **Kod yeri:** `world.js` panel malzemeleri (gövde malzeme dizisi `camBolge` grupları; boyalı panel yaması zaten `ustY(z,x)` ile oturuyor). `ui.js eksper` olayı → `W3D.ekspertizTara(car)`, `aracciz.js` içinde yeni `_acSema()` (önek kuralı), `paylas.js _kartDurum`. **Efor: orta (2–3 gün; 150 modelde panel eşlemesi gözle kontrol).**
- **Risk:** Panel sınırları gövde loft'unda tek mesh, "kapı" diye ayrı nesne yok. Şema rengi yama (decal) olarak uygulanmalı, gövde malzemesi bölünmemeli. `vitrin-test` gözle ekspertiz ışın testleri şemadan etkilenmemeli.

#### V3. İl kodlu Türk plakası ve şehir hikâyesi [4/8: UX, STR, KRK, GLR]
- **Ne:** `plate()` "il kodu (01–81) + 1–3 harf + 2–4 rakam" üretir. Sol mavi şerit "TR". Araç satıcısının ya da emanet sahibinin şehri plakadan okunur. "Şehir dışından" alıcı kendi il kodunu söyler, gruptaki ihbarın semti plakayla uyumludur.
- **Neden ayrıştırır:** Tek bakışta "burası Türkiye". Ucuz ve her ekranda (liste fotoğrafı, 3B, ilan fotoğrafı, paylaşım kartı) görünür.
- **Performans maliyeti:** **Çok düşük.** Mevcut `plakaTex` (256×128) yalnız biçim değişir, ek doku yok.
- **Kod yeri:** `game.js plate()` (tohumlu RNG ile, `S.sehir` ağırlıklı il dağılımı), `world.js plakaTex` (mavi şerit), 2B `aracciz.js` plaka alanı. Kayıt: eski kayıttaki plakalar olduğu gibi kalır (yalnız yeni araçlar), göç gerekmez. **Efor: küçük (yarım gün).**
- **Risk:** Rastgele bir plakanın gerçek bir araca denk gelmesi. Oyun içi, kişiyle eşleşmez **(hukuki görüş değildir)**. İsteğe bağlı: harf grubunda gerçekte verilmeyen harf dizilerini kullanmak.

#### V2. Camda "SATILIK" kâğıdı ve el yazısı fiyat [3 + 4 / 8: KRK, ARB, GLR + UX ikinci turda]
- **Ne:** İlandaki her aracın arka yan camında ve ön camın köşesinde kâğıt: "SATILIK", keçeli kalemle fiyat ("825 bin"), altında yarı silik uydurma telefon. İlan dili yazıya yansır: dürüst ilanda "Ekspertizli · Değişensiz" (gerçekse), abartılı ilanda "SIFIR GİBİ!! Motoru yağ yakmaz". Satış anında kâğıdın üstüne "SATILDI" yazılır. Fiyat kırılınca eski rakam karalanır, yenisi yazılır.
- **Neden ayrıştırır:** Türk galericisinin en tanıdık görüntüsü. Bilgi de taşıyor: oyuncu 3B'de fiyatı ve ilan dilini görüyor.
- **Game-feel:** Fiyat kırınca karalama animasyonu (0,3 sn, kademe "küçük").
- **Performans maliyeti:** **Düşük.** Araç başına bir 256×128 canvas doku ve iki küçük düzlem. Doku `tex()` önbelleğinde, anahtar fiyat + dil. Hafif'te 128×64. Sahnede en çok 6–8 araç var.
- **Kod yeri:** `world.js` araç kurulumu (cam evi `camBolge` 1 grubu, düzlem `xAt()`/`hwCam` ile cama oturmalı; CLAUDE.md'deki "ayna havada, silecek camın dışında" hatası tekrarlanmasın). El yazısı fontu gömülü olmadan canvas'ta titreşimli çizgiyle (tohumlu) taklit edilir, web fontu yok. **Efor: küçük-orta (1–2 gün).**
- **Risk:** Saydam düzlem cam yansımasıyla z-fighting yapabilir ("OTO PAZARI" tabelası dersi). Telefon numarası asla tam ve gerçek biçimde yazılmamalı.

#### Ortak 4.–5. (kısa)
- **V9 Galeri büyümesi:** Seviyeyle saha dekoru (toprak → beton → showroom). Performans düşük (tek seferlik birleştirilmiş set). Efor orta-büyük (dekor tasarımı). FUT ve STR'nin uzun vade isteği.
- **V1 Oto pazarı sabahı:** `SAATLER`'e bir "pazar" kipi: alçak güneş, pus, çay tezgâhı, kâğıt dağınıklığı. Performans düşük-orta, Hafif'te yalnız ışık. Görev 2'deki M3 mekaniği ileride buna oturabilir.

---

## Oyun sırasında bulunan hatalar

| # | Hata | Kesinlik | Kanıt | Kod yeri ve not |
|---|---|---|---|---|
| **H1** | **3B vitrinde gözle bulgu işaretli araç komşu olunca her kamera hareketinde sayfa hatası.** `TypeError: Cannot read properties of null (reading 'matrixWorld')` ve konsolda `THREE.Sprite: "Raycaster.camera" needs to be set`. | **Kesin** (yalıtıldı: işaretsiz komşuda 0, işaretli komşuda her harekette 2 hata; ARB koşusunda 22) | `betik/hata3b.js`, `betik/hata3b2.js`, `ss/H3B2-01/02-*`, `arb.log` | `world.js engelleriGuncelle`: `_engelRc.intersectObjects(adaylar,true)` komşu aracın içindeki `gozIsaret` Sprite'ına da ışın atıyor. `_engelRc.camera` atanmadığı için Sprite.raycast çöküyor. O kare için engel saydamlaştırma yarıda kalıyor (araya giren komşu saydamlaşmayabilir **(tahmin)**). `vitrin-test` "işaretli araç komşu" durumunu ölçmüyor. Öneri: `_engelRc.camera=cam` ya da `gozIsaret` adlı nesneleri atlamak. |
| **H2** | **3B alt kartta model yılı okunmuyor.** Koyu sahnede koyu gri: `rgb(92,97,104)` (#5C6168). | **Kesin** (ölçüldü) | `ss/ARB-02-goz-bulgu.png`, `ss/_kirp-yil.png`, `betik/dogrula.js` | `world.js` `w3dname` içinde `<span style="color:var(--muted)">`. `--muted:var(--label-2)` `:root`'ta çözülüp miras alınıyor. `#world` `--label-2`'yi #B4BCB9 yapsa da `--muted` değişmiyor. CLAUDE.md §5 "#world kendi parlak tonlarını alır" kuralının deliği: `--muted`/`--muted-2` de `#world` içinde yeniden tanımlanmalı ya da `--label-2` doğrudan kullanılmalı. |
| **H3** | **İlan fotoğrafı stüdyosunda araç havada duruyor.** Gölge elipsi lastiklerin ~40px altında. Yan profilde ve stüdyo fonunda belirgin. | **Kesin** | `ss/DOG-01-ilanfoto-yan.png`, `ss/DOG-02-ilanfoto-studyo-fonu.png`, `ss/GNC-07`, `ss/_kirp-foto.png` | `ilanfoto.js` gölgeyi kanvasa sabit `H*.83`'te çiziyor (`g.ellipse(W/2,H*.83,…)`). 3B çekimin tekerlek hizası daha yukarıda. Gölge, çekimdeki tekerlek alt hizasından hesaplanmalı ya da 3B `temas` gölgesi kullanılmalı. |
| **H4** | **Rehber zararına alımı ve satışı vurguluyor.** "Aracı al" adımında yeşil ışık "Kabul et ₺1.190.000"da. Aynı ekranda oyun "Önerilen tavanın ₺1.005.000 … kâr payı ~%-5. Vazgeçmek mantıklı." diyor. Rehberi izleyen oyuncunun ilk satışı **ZARARINA SATILDI −₺38.600**. | **Kesin** (bu koşuda); sıklık pazara bağlı **(tahmin)** | `ss/KRK-03-rehber-orta.png`, `ss/KRK-04-rehber-son.png`, `krk.log` | `rehber.js OGRET` "al" adımı `sec:['[data-act="acceptcounter"]', …]` önce kabulü arıyor, kârlılığa bakmıyor. "sat" adımı da önce `saleaccept`. Rehber 1. adımda listenin ilk kartını açtırıyor (₺1,24M'lik araç, kasa ₺2,6M). 1.0 kavranabilirlik oylamasındaki Ö11 ("ilk iş ilanı") elenmişti. Bu bulgu onu yeniden gündeme taşıyor. |
| H5 | Piyasa nabzında "▲ +40,3% · 7 gün" geçmiş 7 günün değişimi, ama tahmin çizgisinin üstünde tahmin gibi okunuyor. O an tahmin çizgisi düşüyordu. | Değer kesin (`nabizDegisim` son 8 kaydı kıyaslıyor); yanlış okunması **(tahmin, UX görüşü)** | `ss/STR-03-nabiz.png` | `piyasa.js nabizGrafik`. Etiket "son 7 gün" olmalı ya da tahmin ayrı yazılmalı. |
| H6 | Rapor açılınca önceki eylemin bildirimi ("İlanda · ₺470.500 · … beklenen kâr") rapor başlığının üstüne düşüyor. | Kesin (görsel) | `ss/KRK-07-rapor-g4.png`, `ss/GEL-09` ("Görev tamam") | Bildirim kuyruğu (`TOAST_Q`) rapor açılırken bekletilmiyor (satış özeti için bekliyor). |
| H7 | "En iyi %73'lük dilimdesin" (44/61): v3'te bildirilen ters okunan ifade duruyor. | Kesin (metin) | `ss/FUT-09-defter-lig.png` | `sirala.js`. |
| H8 | Halloway Warden (büyük arazi aracı ailesi adı) `lux` segmentinde, 3B'de alçak sedan. | **Tahmin** (veri tercihi olabilir) | `ss/GNC-09-3b-pazar.png`, `game.js MODELS` | Düzeltme `modeller-b.py ELLE` tablosunda olmalı (CLAUDE.md §9). |

Hata sayılmayan gözlemler:
- Nadir kelepir oyuncunun kasasına bakmıyor. 1. gün ₺3,68M'lik kelepir, kasa ₺2,6M.
- `world.js priceCard` "$" ile fiyat basıyor ama hiçbir yerde çağrılmıyor (ölü kod).
- Plakalar yabancı biçimde (V3'ün gerekçesi).
- İlk sezon hedefi kolay görünüyor (bot Altın yaptı, tek koşu).
- Selim'in "hurdadan çıkma" ihbarları %31–42 marj bıraktı (STR, GLR).

---

## Son sözler

- **GEL:** Çekirdek döngü sağlam: pazarlık ve ekspertiz ilk iki sırada. Yeni mekanikler (M1, M10) bu çekirdeğe sonuç ekliyor, ekran eklemiyor. Doğrusu bu.
- **UX:** H2 ve H4 küçük işler ama ilk izlenimi bozuyor. Önce onlar.
- **STR:** M1 ve M10 birbirini dengelesin. M5 için kapma tavanı ve simülasyon şart. Selim ihbarının marjı gözden geçirilmeli.
- **FUT:** M5 rakipleri "kişi" yapacak. Lig ve grup o zaman yaşar.
- **GNÇ:** Plaka ve camdaki kâğıt paylaşım kartına girerse oyun Türkiye'de tanınır.
- **KRK:** Rehber beni zarara soktu. Yeni oyuncu ilk satışta para kaybetmemeli.
- **ARB:** Ekspertiz şeması oyunun imzası olur. H3'teki havada araç ilan fotoğrafını bitiriyor, önce o.
- **GLR:** Kapora ve hakem heyeti bu işin gerçek iki derdi. Oyuna girerse galerici "bizi anlatıyor" der.
