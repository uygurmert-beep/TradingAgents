# Kokpit ilerleme çubuğu — ikna toplantısı ve uzlaşma

Konu: `#hud` içindeki sezon ilerleme çubuğu (`.hs-sezon`) ve onun çevresindeki şerit (`.hudserit`).
Hedef: Ekip tek bir tasarımda içtenlikle uzlaşana kadar ikna turları sürecek. Oylama yapılmadı.
Katılanlar: GEL, UX, STR, FUT, GNÇ, KRK, ARB, GLR. Moderatör: Claude.
Yöntem: Kaynak okundu (`oyun/ui.js` `renderHud()` ve `openDurum()`, `oyun/shell.html` `#hud`, `.hud-*`, `.hs-*`, `.rail`). Ardından `kelepir-tek.html` Playwright ile 390×844 boyutunda açıldı ve 1., 13. (kasa az), 15. ve 37. günlerin ölçümü alındı.
Görüntüler: `kokpit/01-gun1.png`, `02-gun13-kasa-az.png`, `03-gun15.png`, `04-gun37-sv.png`, `05-durum.png`. Betik: `kokpit/betik.js`.

---

## 1. Mevcut çubuğun teşhisi

### 1.1 Şu an ne gösteriyor (ölçüm, 390×844, DPR 2)

| Öğe | Konum / boy | Yazı | İçerik |
|---|---|---|---|
| `#ustmarka` | y 0, h 46 | — | Logo + "GALERİN" tabelası |
| `#hud` (kokpit) | y 46, **h 84** | — | Aşağıdaki iki satır |
| `#brandLine` | y 63, h 13 | 13px | "Kış · 13. gün". Mutlak gün yazıyor: 37. günde "Yaz · 37. gün" görünüyor, sezonun kaçıncı günü olduğu yazmıyor. |
| `#hudCash` | sağ üst | 26px, `--gold` | ₺60.000 |
| `.hudserit` (düğme) | y 92, h 28 | — | Dokununca `openDurum()` açılıyor. |
| `.hs-sezon` (**ilerleme çubuğu**) | şeridin üst kenarında, **2px** yükseklik, 358px genişlik | — | Dolgu genişliği `(i+1)/15`. Renk `--tint`. Zemin `rgba(20,24,28,.056)`. |
| Stok | x 16, w 50 | em 11px / b 14px | "0/4" |
| İtibar | x 78, w 48 | 11 / 14 | "50" |
| Sv | x 139, w 58 | 11 / 14 | "1" ve yanında 26×3px XP çubuğu (`--tint`) |
| bugün | x 225, w 53 | 11 / 12,5 | "₺0 bugün" |
| Kira | x 290, w 84 | 11 / **11,5** | "7K/110K", "95K/110K", 37. günde "136K/292K" |

İlk ilan kartının üst kenarı 418px'te duruyor; 4 durumda da aynı. Bu, v3 ölçütündeki ≤400px sınırının dışında.

### 1.2 Neyi anlatamıyor

1. **Çubuğun ne olduğu belli değil.** Şeridin üstündeki 2px çizgi etiketsiz. Zemin kontrastı yaklaşık **1,1:1**, yani boş kısım görünmüyor. Gün sayısı yazmıyor; kaç gün kaldığı yalnız `title` niteliğinde var, telefonda o da görünmüyor. Rengi `--tint`, oysa CLAUDE.md 5. kurala göre `--tint` yalnız eylem için kullanılabilir; çizgi tıklanabilir bir şeymiş gibi okunuyor. Çubuk bittiğinde ne olacağı da (kira kesimi) çubukta yazmıyor. 15. gün (`03-gun15.png`) 1. günden yalnız çizginin boyuyla ayrılıyor.
2. **Kira gerçek dünyada olmayan bir dille anlatılıyor.** "Kira 7K/110K" bir "biriken kira" sayacı. Gerçek bir galerici kirayı biriktirmez; kira gününü bilir ve o gün kasada para var mı diye bakar. Önceki raporlarda KRK "borçlu muyum?" diye sormuştu (OYLAMA Ö5). v3 B6'da da "Kira 28K/141" kırpılıyordu. Ölçüm: yazı 11,5px ve 12px'in altında. Üstelik **hesap yanlış olabiliyor**: HUD `sezonKirasi()` gösteriyor, ama `kapanisKirasi()` hedef ödülünde kirayı donuk ve indirimli kesiyor (`S.kiraDonuk`, `S.kiraIndirim`). Ödül kazanan oyuncu HUD'da kesilecek tutardan yüksek bir kira görüyor. Durum sayfası da yuvarlanmamış "₺136.031 / ₺291.500" yazıyor.
3. **Asıl tehlike görünmüyor.** 13. günde kasa ₺60.000, kesilecek kira ₺109.500 (`02-gun13-kasa-az.png`), ama kokpitte hiçbir şey değişmiyor. Uyarı yalnız Durum sayfasında, kırmızı tek bir cümle olarak çıkıyor. Kısaltmalar da sorun: "Sv" ne anlama geldiği belli olmayan bir kod. "₺0 bugün" ile kira yan yana duruyor; hangisi her gün çıkıyor, hangisi sezon sonunda, belli değil. Bunlara ek olarak 6 öğenin 5'inde etiket 11px.

---

## 2. İlk öneriler

Her rol "gerçek dünyadan bir his" veren bir metafor getirdi. Yükseklik sınırı: mevcut `#hud` ≤ 84px.

| Rol | Başlık | Ne gösterir | Nasıl görünür | Neden gerçek his | Neyi kaybettirir |
|---|---|---|---|---|---|
| **GLR** | **Galerinin duvar takvimi** | Sezonun 15 günü. Geçen günlerin üstü çizili. Kira günü kalemle daire içine alınmış. Çek ve taksit vadeleri gün kutusunun altına not edilmiş. | 15 küçük gün kutusu ve sonda halka içinde kira günü. Yükseklik 18–22px. | "Her galericinin masasının arkasında sigortacının hediye ettiği bir takvim asılıdır. Akşam o günü çizeriz. Kira gününü kırmızıyla daire içine alırız, Ahmet'in senedini de altına yazarız." | Kokpitte bir satır daha yer kaplar. |
| **KRK** | **Kira günü yazılı takvim** | "Kira günü: 15. gün (8 gün sonra) · ₺110.000". Kısaltma yok. | İki satırlık metin, 13px. | Kâğıt üstündeki ödeme hatırlatmasına benzer, okununca anlaşılır. | Yer kaplar; metin kalabalık olur, göz gezdirerek okunmaz. |
| **UX** | **Yırtılan takvim yaprağı** | Sol üstte bugünün yaprağı ("KIŞ / 7"). Gün dönerken yaprak koparılıyor. | 40×36px yaprak, `brandLine`'ın yerinde. | Saatli maarif takvimini herkes bilir. | Kira ve sezonun bütünü görünmez; yaprak tek bir günü gösterir. |
| **GEL** | **Yakıt göstergesi (menzil)** | Kasa ÷ günlük gider = "kaç gün dayanırsın". İbre, rezerv çizgisi kira. | Yarım ay biçiminde ibre, 28px. | Arabadaki menzil göstergesi. | Gelir düzensiz olduğu için (satış) menzil anlamsız sayılar verir. Sezon günü görünmez. |
| **STR** | **Ödeme planı / vade çizelgesi** | Önümüzdeki günlerin nakit olayları: taksit tahsilatı (+), kira (−), kredi faizi. | Zaman çizgisi, olay işaretleri. | Muhasebecinin vade listesi. | Gün çizelgesi soyut kalır; olay yoksa çizgi boş görünür. |
| **FUT** | **Sezon fikstürü** | 15 maç günü. Oynanan günler kâr ya da zarar sonucuyla (yeşil/kırmızı nokta). Son gün "derbi", yani kira. | Fikstür şeridi. | FM'deki fikstür ekranı. | Her güne bir renk düşer; çok gürültülü olur. Kâr/zarar sonucu zaten kasa defterinde var. |
| **GNÇ** | **Story çubuğu** | Instagram hikâyesi gibi 15 parçalı şerit; bugün parlıyor. | 4px parçalı çizgi. | "Benim gerçek dünyam bu; parçaları görünce kaç tane kaldığını anlarım." | Kira yine görünmez, sadece biraz daha belirgin olur. |
| **ARB** | **Gösterge paneli: km sayacı ve yakıt lambası** | Gün, kilometre sayacı gibi yuvarlanan rakam. Kasa kiraya yetmezse sarı "rezerv lambası" yanıyor. | Rakam silindiri ve ikon. | Arabadaki rezerv lambası, kimse ona yanlış anlam yüklemez. | İki gösterge birbiriyle yarışır. Kokpit bir oto kokpitine dönüşür, galeri hissi kaybolur. |

---

## 3. İkna turları

### Tur 1 — "Gerçek his" neyden gelir?

- **GLR (savunma):** "Oyuncunun derdi tek soru: *kira gününe kadar kasa yetecek mi?* Gerçek galerici buna takvime bakarak cevap verir, kadrana ya da fikstüre bakmaz. Takvimde günü çizmek, sezonun geçtiğini elle hissettirir."
- **GEL (itiraz):** "Takvim gün sayar ama paranın yetip yetmediğini söylemez. Benim göstergem söylüyor."
- **GLR (cevap):** "Galerici menzil hesabı yapmaz, çünkü yarın bir araba satar ve menzil değişir. Ama kira günü değişmez. Sabit olan tarih, değişen kasa. Takvimdeki kira halkasının rengi kasaya göre değişsin, menzilin işi de görülmüş olur."
- **UX (itiraz, GLR'ye):** "15 kutu ve üstüne rakamlar, ilk ekrandaki 29 öğe şikâyetine bir de 15 öğe ekler."
- **GLR:** "Duvar takvimine bakarken de rakamları okumayız, çizilere bakarız. Rakam yalnız bugünde ve kira gününde olsun."
- **FUT (itiraz, herkese):** "Fikstürde günlerin bir sonucu var, takvimde yok."
- **KRK (FUT'a):** "Her güne renk verirsen ben neye bakacağımı bilemem. Kâr/zarar kasa defterinde zaten yazılı."
- **GNÇ:** "Takvim kutuları zaten benim story parçalarım. Tek bakışta okunuyorsa itirazım yok. Yalnız bir şart: ikinci satır yazı olmasın."
- **ARB:** "Rezerv lambası fikrimden vazgeçmem."

| Rol | Tur 1 sonu |
|---|---|
| GLR | Duvar takvimi |
| KRK | Takvim (KRK'nın kendi önerisi de takvimdi), ama metin istiyor |
| UX | Yaprak; takvime şartlı açık (rakamsız kutular) |
| GNÇ | Story = takvim kutuları, şartlı destek |
| GEL | Yakıt / menzil |
| STR | Vade çizelgesi |
| FUT | Fikstür |
| ARB | Gösterge paneli / rezerv lambası |

### Tur 2 — Birleşmeler

- **GEL (yeni öneri):** "Menzili ayrı bir kadran yapmayalım. Ama 'kasa yetiyor mu' hesabı kasaya yalnız bugünü değil, kira gecesine kadar her gün çıkacak otopark, maaş ve faizi de katsın: `S.cash − bugün × kalanGün`. 13. günde 4 aracı olan oyuncu bugün yetiyor sanıp kira gecesi açık verebilir."
- **GLR:** "Doğru. Galerici de 'otopark ve çırağın parası da çıkacak' der. Kabul."
- **GEL → ikna oldu:** "**GLR beni ikna etti, çünkü** sabit olan tek şey kira günü. Menzil hesabımı halkanın rengine gömmek benim derdimi tamamen çözüyor, kokpite ikinci bir gösterge de girmiyor."
- **STR (savunma):** "Taksit tahsilatları da kasaya girecek. Kira gecesinden önce 2 taksit geliyorsa oyuncuya 'eksik' demek yanlış."
- **GLR (itiraz):** "Hiçbir galerici tahsil edilmemiş çeke güvenerek kira planlamaz. Çek karşılıksız da çıkar; oyunda da `r.risk` var. Kasa, kasadaki paradır."
- **STR (cevap):** "O zaman en azından vadeyi takvime yaz. Senin takviminde Ahmet'in senedi altına not ediliyordu."
- **GLR:** "Evet. Vade günü kutunun altında küçük bir altın nokta olur. Altın para demek, kural da bu. 'Eksik' hesabına girmez, ama Durum sayfasında 'vadesi gelen taksitlerle ₺X gelebilir' satırı olur."
- **STR → ikna oldu:** "**GLR ikna etti, çünkü** benim vade çizelgem takvimin üstüne oturunca ayrı bir zaman çizgisine gerek kalmıyor. 'Eksik'i nakde göre hesaplamak da oyunun kendi risk kuralıyla tutarlı."
- **UX (savunma):** "Yaprağı bırakıyorum. Ama 'bugün' kutusu takvimin içinde yaprak gibi koyu dursun ve sezonun gününü yazsın. 37. günde 'Yaz · 37. gün' yazınca sezonun kaçıncı günü olduğu okunmuyor."
- **UX → ikna oldu (birleşerek):** "**Takvime geçiyorum, çünkü** yaprağın gösterdiği tek bilgi, yani bugün, takvimde koyu kutu olarak duruyor. Takvim bunun üstüne kira gününü ve sezonun bütününü de taşıyor."
- **KRK (itiraz):** "Bugün kutusunda '7' yazsın, kira kutusunda '15'. Kira tutarı da kısaltmasız yazılsın; 'Sv' kalksın."
- **GNÇ (itiraz, KRK'ya):** "Uzun cümle yazarsan bakmam. 'Kira ₺110K' yeter. 3 gün kalınca 'Kira 3 gün', o kadar."
- **KRK:** "₺110K'yı kabul ederim; ₺ işareti varsa ne olduğu anlaşılır. 7K/110K gibi bölü işareti olmasın."

| Rol | Tur 2 sonu |
|---|---|
| GLR, GEL, STR, UX | Duvar takvimi (birleşik: halka rengi = kasa kira gecesine yetiyor mu, vade noktaları, koyu bugün kutusu) |
| KRK | Takvime yakın; metin biçimi konusunda pazarlık sürüyor |
| GNÇ | Destek; kısa metin şartıyla |
| FUT | Fikstür, yalnız kaldı |
| ARB | Rezerv lambası |

### Tur 3 — Son itirazlar

- **ARB (savunma):** "Rezerv lambası, arabası olan herkesin bildiği bir 'dikkat' dili. Takvimin halkası lambanın yerini tutar mı?"
- **GLR:** "Halka zaten senin lamban. Normalde altın (para), kira yaklaşınca turuncu, para yetmiyorsa kırmızı. Lambanın yandığı yer de bilgi verir: neyin bittiğini, yani kira gününü gösterir."
- **UX:** "Ayrı bir ikon kokpite bir öğe daha ekler. Halka bunu sıfır ek öğeyle yapıyor."
- **ARB → ikna oldu:** "**GLR ve UX beni ikna etti, çünkü** halka bir rezerv lambası gibi çalışıyor: normalde sakin, gerektiğinde renk değiştiriyor ve yeri sabit. Bir şartım var: nabız animasyonu yok (v3 B6'da 'stabil değil' demiştim)."
- **FUT (savunma):** "Fikstürde sezonun son maçı ayrı hissettirilir. Takvimde 15. gün sıradan bir gün gibi kalırsa sezon kapanışı yine sürpriz olur."
- **KRK:** "Son gün için ayrı bir durum yapalım: bugün kutusu ile kira halkası birleşsin, kuyrukta 'Kira bu gece' yazsın."
- **GLR:** "Galerici de son gün takvime bakıp 'yarın kira' der. Kirayı oyun gece kesiyor (`(S.day-1)%15===0` yeni günün başında işliyor), yani 'bu gece' doğru söz."
- **FUT → ikna oldu:** "**KRK ve GLR beni ikna etti, çünkü** benim istediğim, sezon finalinin hissedilmesiydi; bugün kutusu ile kira halkasının birleşmesi bunu veriyor. Günlere sonuç rengi koymaktan vazgeçtim: sonuç kasa defterinde, gürültü üretmesin."
- **KRK (son itiraz):** "Şeritteki öteki metrikler de 11px. Kira kuyruğa taşınınca yer açılıyor; 'Sv' yerine 'Seviye' yazılsın, bütün etiketler en az 12px olsun."
- **GEL:** "Ölçtüm: Kira öğesi (84px) şeritten çıkınca 'Stok 12/12 · İtibar 100 · Seviye 12 · −₺48.500 bugün' 12/13px ile yaklaşık 330px tutuyor, 358px'e sığar."
- **KRK → ikna oldu:** "**GEL'in ölçümü ve GLR'nin takvimi beni ikna etti, çünkü** 'Kira 7K/110K' tamamen kalkıyor. Yerine 'kaç gün' ve 'kaç lira' geliyor, Sv de Seviye oluyor. Tek bakışta okuyabiliyorum."
- **GNÇ:** "Satırlar bir öncekinden uzun değilse ve dokununca ayrıntı açılıyorsa varım."

| Rol | Tur 3 sonu |
|---|---|
| GLR, GEL, STR, UX, ARB, FUT, KRK | Duvar takvimi (birleşik) — içten destek |
| GNÇ | Destek, "yükseklik artmazsa" şartıyla |

### Tur 4 — Ölçü ve renk kontrolü (uzlaşma kilidi)

- **UX:** "Yükseklik: üç satır 84px'e sığmalı. Hesap: üst boşluk 5 + kasa satırı 25 + aralık 5 + takvim 22 + aralık 5 + metrik satırı 16 + alt boşluk 6 = **84**." GNÇ'nin şartı sağlandı.
- **UX (kontrast, ölçüldü, zemin #F3F1EC):** `--gold` 4,51 ✓, `--red` 4,68 ✓, `--label-3` 4,76 ✓. `--orange` **3,79**, 12px metinde AA geçmiyor. `--red` metin `--red-soft` zeminde 4,11 ✗.
  Karar: turuncu yalnız halkada kullanılacak (grafik için 3:1 yeterli). "Yaklaşıyor" metni `--label` renginde. "Eksik" metni `--red` renginde ama zemini düz `--bg`; `--red-soft` yalnız halkanın içinde.
- **UX:** Boş gün kutusunun kenarı `--sep` ile 1,3:1 ve görünmüyor. Yeni değişken `--takvim-bos:#85898F` (3,12:1).
- **STR:** "Mevcut çubuk ve XP çubuğu `--tint` kullanıyor, bu kural ihlali. Takvimde `--tint` hiç olmasın. XP çubuğu `--label-3` olsun."
- **GEL:** "Kira tutarı `kapanisKirasi()` ile aynı olmalı. Yan etkisi olmayan bir `kiraTahmini()` yazıyorum. Donuk ve indirimli kira o zaman doğru görünür."
- **ARB:** "Animasyon yok. Varsa da `CILA.azHareket` kapatsın."

**Son durum: 8/8 içten destek.** Kimse "karşı değilim" konumunda kalmadı; GNÇ'nin şartı ölçümle karşılandı.

| Rol | Son durum |
|---|---|
| GLR | ✔ önerinin sahibi |
| GEL | ✔ menzil hesabı halka rengine gömüldü |
| STR | ✔ vade noktaları eklendi |
| UX | ✔ bugün kutusu = yaprak; yükseklik ve kontrast doğrulandı |
| KRK | ✔ "Sv" ve "7K/110K" kalktı, metin ≥12px |
| GNÇ | ✔ yükseklik artmıyor, kısa metin, tek dokunuş |
| ARB | ✔ halka = rezerv lambası, nabız yok |
| FUT | ✔ son gün durumu = sezon finali |

---

## 4. UZLAŞILAN TASARIM — "Duvar takvimi"

### 4.1 Yerleşim (390px, üç satır, `#hud` ≤ 84px)

```
┌──────────────────────────────────────────────────────┐
│ Kış · 7. gün                          ₺2.600.000     │  1. satır (25px) — değişmedi
│ ╳ ╳ ╳ ╳ ╳ ╳ [7] □ □ □ □ □ □ □ (15)   Kira ₺110K      │  2. satır takvim (22px)
│ Stok 0/4   İtibar 50   Seviye 1 ▭        ₺0 bugün    │  3. satır metrikler (16px)
└──────────────────────────────────────────────────────┘
   2. ve 3. satır birlikte tek düğme (.hudserit) → openDurum()
```

Dikey ölçüler: `#hud` padding `calc(5px + var(--sat)) var(--pad) 6px`, satır arası `gap:5px`.
Kasa satırı: `.hud-cash` font 24px, line-height 1.05 (≈25px).
`.hudserit`: `min-height:44px` (takvim 22 + aralık 5 + metrik 16 + 1), `margin:0`, `padding:0`, `flex-direction:column`. Toplam 5+25+5+44+5 = **84px**.

### 4.2 İçerik ve sıra

1. **1. satır (değişmedi):** `#brandLine` "Kış · 37. gün" (mutlak gün, testler ve kasa defteri buna bağlı) + `#hudCash`.
2. **2. satır — takvim `.takvim`** (soldan sağa):
   - **14 gün kutusu** `.tk-gun`, 1.–14. sezon günleri. `flex:1; min-width:12px; height:16px; border-radius:3px; gap:2px`.
     - Geçmiş gün `.gecti`: zemin `var(--fill)`, üstünde kalem çizgisi: `linear-gradient(to top right, transparent calc(50% - .75px), var(--label-3) 50%, transparent calc(50% + .75px))`. Rakam yok.
     - Bugün `.bugun`: zemin `var(--label)`, sezon günü rakamı (`i+1`) 12px/700 `var(--bg)`, `height:20px` (yaprak gibi kabarık).
     - Gelecek gün: zemin yok, `1px solid var(--takvim-bos)`. Rakam yok.
     - Vade günü `.vade` (o gün `S.receivables` içinde `due` olan bir taksit varsa): kutunun altında 4px çaplı `var(--gold)` nokta (`::after`, `bottom:-5px`).
   - **Kira halkası** `.tk-kira` (15. gün): 22×22px daire, `border:2px solid var(--gold)`, içinde "15", 12px/700 `var(--gold)`.
   - **Kuyruk** `.tk-not`: `margin-left:6px; max-width:96px; font-size:12px; font-weight:700; white-space:nowrap`. Metin duruma göre değişir (4.3).
3. **3. satır — metrikler** (`.hs-oge`, sırası korunuyor): Stok `S.cars.length/S.slots` · İtibar · **Seviye** (eski "Sv") + 26×3px XP çubuğu (`--label-3`) + teklif noktası `.dot-badge` · sağa yaslı `−₺X bugün`. Etiket `em` 12px `--label-3`, değer `b` 13px. Bugün değeri 13px `--label-2`.

**Kalkanlar:** `.hs-sezon` (2px çubuk) ve CSS'i, `.hs-oge.gider.kira` ("Kira 7K/110K") ve iki CSS kuralı (shell.html 392 ve 406. satırlar). `.rail` yalnız Durum'da kullanılıyordu; yerine büyük takvim geldi.
**Taşınanlar:** Kira bilgisi şeritten takvim kuyruğuna taşındı. "Biriken kira" kavramı tamamen kalkıyor (Durum sayfası dahil).

### 4.3 Durumlar (öncelik sırası yukarıdan aşağıya; ilk uyan uygulanır)

Hesap:
- `kalan = 15 − i` (bugün dahil), `i = (S.day−1) % 15`
- `kira = kiraTahmini()`
- `bugun` = otopark + maaş + faiz
- `kiraGecesiKasa = S.cash − bugun × kalan`
- `eksik = kira − kiraGecesiKasa`

| Durum | Koşul | Halka | Kuyruk metni | `.takvim` sınıfı |
|---|---|---|---|---|
| **Kasa kiraya yetmiyor** | `eksik > 0` | `border-color:var(--red)`, iç `var(--red-soft)`, rakam `--red` | "₺50K eksik" (`kisaTl(eksik)`, yukarı yuvarlanmış), `color:var(--red)` | `eksik` |
| **Sezon son günü** | `kalan === 1` | Bugün ile birleşir: zemin `var(--label)`, rakam `var(--bg)`, `border:2px solid var(--gold)`; ayrı bir bugün kutusu çizilmez | "Kira bu gece", `--label` | `songun` |
| **Kira günü yaklaşıyor** | `kalan ≤ 3` | `border-color:var(--orange)` (grafik 3,79:1) | "Kira 3 gün" / "Kira 2 gün", `--label` | `yakin` |
| **Normal** | diğer | `--gold` | "Kira ₺110K", `--label-2`; tutar `--gold` | — |

Eksik ve son gün aynı anda geçerliyse kuyrukta eksik yazar, halka son gün biçiminde ama kenarı `--red` olur.
Animasyon yok. Sezon dönerken takvim yeni sezona boş çizilir; isteğe bağlı 200ms solma eklenebilir, `CILA.azHareket` açıksa yapılmaz.

### 4.4 Renk kuralları (CLAUDE.md 5)

- `--tint` takvimde ve şeritte **hiç kullanılmaz**. XP çubuğu da `--label-3`'e geçer.
- `--gold` yalnız para için: kira halkası, kira tutarı, vade noktası.
- `--red` yalnız "eksik" durumunda. `--orange` yalnız grafikte (halka), metinde değil.
- Yeni değişken: `:root{--takvim-bos:#85898F}`. Kâğıt kapsamında (`--kagit` blok, shell.html ~1576) aynı değer; 3B kapsamı etkilenmez (`#app.in3d #hud{display:none}`).

### 4.5 Etkileşim

- `.hudserit`'e (2. ve 3. satır) dokununca `openDurum()` açılır; bu davranış değişmedi.
- `aria-label` dinamik: "Kış, sezonun 7. günü, 15 günden. Kira 8 gün sonra, ₺109.500. Kasa yetiyor. Stok 0/4, İtibar 50, Seviye 1. Ayrıntılar." Eksik durumda: "Kira gecesi kasada ₺49.500 eksik kalıyor."
- **Durum sayfası** (`openDurum()`):
  - "SEZON" bloğu büyük takvim gösterir: `takvimHtml(true)`, kutu 20px, bütün gün rakamları görünür, 12px.
  - Altında: "Kira günü: 15. gün gecesi · 8 gün sonra · ₺109.500".
  - Ödül varsa: "(donuk ve %10 indirimli; normali ₺…)".
  - Ardından: "Kira gecesi tahmini kasa: ₺… (bugünkü giderler × 8 gün düşüldü)".
  - Eksikse kırmızı "₺… eksik". Vadesi gelen taksit varsa: "Vadesi gelen taksitlerle ₺… gelebilir (garanti değil)".
  - "Dükkân kirası (biriken / toplam)" satırı kalkar; yerine "Kesilecek kira" gelir, `tl()` ile yuvarlanmış.

### 4.6 Erişilebilirlik

- `#hud` içindeki bütün metinler ≥ 12px.
- Metin kontrastı ≥ 4,5:1 (zemin #F3F1EC): `--label` 15,8, `--label-2` 5,5, `--label-3` 4,8, `--gold` 4,51, `--red` 4,68.
- Grafikler ≥ 3:1: boş kutu `--takvim-bos` 3,12, turuncu halka 3,79, çizik `--label-3` 4,8.
- Dokunma alanı ≥ 44px yükseklik. Durumlar yalnız renkle anlatılmaz, kuyruk metni de değişir.

### 4.7 Dokunulacak kod

- `oyun/ui.js`
  - Yeni `kiraTahmini()`: `kapanisKirasi()` ile aynı hesap, yan etkisi yok. `let k=sezonKirasi(); if(S.kiraDonuk){ const ind=S.kiraIndirim!=null?S.kiraIndirim:HEDEF.indirim; k=Math.round(Math.min(k,S.kiraDonuk)*(1-ind)/500)*500; } return k;`. Ad çakışması aranmalı; `takvim*` ve `kiraTahmini` adları şu an kodda yok.
  - Yeni `takvimHtml(buyuk)`: 4.2'deki işaretlemeyi ve 4.3'teki durum sınıfını üretir. `HUD_SON`'a `{kalan,kira,kiraGecesiKasa,eksik,vadeler}` eklenir.
  - `renderHud()`: `.hs-sezon` ve kira `span`'i silinir; takvim satırı eklenir; "Sv" → "Seviye".
  - `openDurum()`: `.rail` yerine `takvimHtml(true)`; kira satırları 4.5'teki gibi.
  - `en.js`: "Kira", "eksik", "Kira bu gece", "Kira {n} gün", "Seviye", "Kira günü", "Kesilecek kira" karşılıkları.
- `oyun/shell.html`
  - `#hud` padding ve gap, `.hud-cash` 24px (iki yerde: 173 ve 1053).
  - `.hudserit` sütun düzeni, `.hs-oge em` 12px, `.hs-oge b` 13px, `.hs-oge u i` → `--label-3`.
  - Yeni `.takvim`, `.tk-gun(.gecti/.bugun/.vade)`, `.tk-kira`, `.tk-not` ve `.takvim.eksik/.songun/.yakin`; `--takvim-bos`.
  - Silinecek: `.hs-sezon*` ve `.hs-oge.gider.kira*`.
- **Kayıt alanı gerekmiyor.** Hepsi türetilmiş veri. Okumalar `S.receivables||[]`, `S.kiraDonuk||null`, `S.kiraIndirim` (null kontrolü) ile yapılır. `SURUM` değişmez.

### 4.8 Kabuk ölçütleri (Playwright, 390×844, `ux-test.js`'e eklenecek)

1. `#hud` `getBoundingClientRect().height ≤ 84`; `.hudserit` yüksekliği ≥ 44.
2. `.takvim` içinde 14 `.tk-gun` ve 1 `.tk-kira` var. `S.day=7` iken `.tk-gun.gecti` sayısı 6, `.tk-gun.bugun` sayısı 1 ve metni "7".
3. `#hud` içindeki metin taşıyan her öğede `getComputedStyle().fontSize ≥ 12px`.
4. `#hud` metninde `/\d+K\/\d+K/` ve `/\bSv\b/` geçmiyor; "Seviye" geçiyor.
5. Durumlar (otopark 0, araç yok):
   - `S.day=7`, kasa ₺2,6M → sınıf yok, kuyruk "Kira ₺110K".
   - `S.day=13`, kasa ₺900K → `.yakin`, "Kira 3 gün".
   - `S.day=15`, kasa ₺900K → `.songun`, "Kira bu gece", `.tk-gun.bugun` yok, `.tk-kira` koyu zeminli.
   - `S.day=13`, kasa ₺60K → `.eksik`, "₺50K eksik".
   - Gider etkisi: `S.day=10`, 4 araç, kasa = kira + 1 → `.eksik` (gün giderleri × 6 gün düşülünce).
6. `S.kiraDonuk=80000; S.kiraIndirim=.1` → kuyruk "Kira ₺72K". `kiraTahmini()` değeri, aynı durumda gün sonu işlenince kasadan düşen kira tutarına eşit (birim testi).
7. `S.receivables=[{due:S.day+2,…}]` → `i+2`. kutuda `.vade` var.
8. Takvim öğelerinin hiçbirinin hesaplanmış rengi `--tint` (rgb(14,94,75)) değil.
9. `.hudserit` tıklanınca Durum açılıyor; içinde `.takvim` ve "Kira günü" var, "biriken" yok, tutarlar `tl()` ile yuvarlanmış (`/₺\d{1,3}(\.\d{3})*$/`, 500'ün katı).
10. En kötü durumda (Stok 12/12, İtibar 100, Seviye 12, bugün −₺48.500, eksik ₺1,2M) `.hudserit` için `scrollWidth ≤ clientWidth` ve `.tk-not` kırpılmıyor.
11. `CILA.azHareket=true` iken `.takvim *` üzerinde `animation-name` "none".
12. İlk ilan kartının üst kenarı değişmeden en çok 418px, yani gerilemiyor.

---

## 5. Son sözler

- **GLR:** Masamın arkasındaki takvim ekrana geldi: günü çiziyorum, kira gününü halkalıyorum, senet vadesini altına not ediyorum. Gerçek galeri böyle işler.
- **GEL:** Menzil hesabım kaybolmadı, kira halkasının rengine gömüldü: kira gecesine kadar çıkacak gider de hesapta.
- **STR:** Vade noktaları takvime oturunca ayrı bir nakit çizelgesine gerek kalmadı. "Eksik"i yalnız nakde göre hesaplamak oyunun risk kuralıyla tutarlı.
- **UX:** Yükseklik 84px'te kaldı, `--tint` ihlali bitti; bugün kutusu yırtılan yaprağın işini görüyor.
- **KRK:** "Kira 7K/110K" ve "Sv" gitti; yerine "Kira 3 gün", "₺50K eksik" ve "Seviye" geldi, hepsi 12px ve üstü.
- **GNÇ:** Story çubuğum aynı yerde ama artık neyin bittiğini söylüyor; tek bakış, tek dokunuş.
- **ARB:** Halka benim rezerv lambam: sakin durur, gerektiğinde renk değiştirir, nabız atmaz.
- **FUT:** Son gün bugün ile kiranın birleşmesi, sezon finali hissini veriyor; fikstür rengine gerek kalmadı.
