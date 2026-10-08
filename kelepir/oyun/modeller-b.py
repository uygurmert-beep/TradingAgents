# -*- coding: utf-8 -*-
"""KELEPİR — model tablosu (B seviyesi isimlendirme).

İki şey değişiyor:

1) İSİM. Marka adı gerçek markanın ailesinde ama kopyası değil; model adı
   aynı hece ailesinden türetilmiş; asıl tanınırlığı motor bilgisi taşıyor
   ("1.6 Dizel"). Motor kısaltmaları (TDI, dCi, HDi...) BİLEREK kullanılmadı:
   onlar üreticilerin tescilli markaları, model adından daha riskli.
   Hacim + yakıt + güç üçlüsü ise kimsenin tekelinde değil ve Türk alıcının
   ilanda okuduğu şey zaten bu.

2) TİP DAĞILIMI. Türkiye ikinci el piyasası SUV ağırlıklı değil; hatchback
   ve sedan ağırlıklı, dizel ve manuel payı yüksek. Dağılım ona çekildi.

Alanlar:
  n   ad (marka + model + motor)        np  sıfır fiyatı (TL)
  seg segment                           dem talep çarpanı
  rel güvenilirlik (0-1)                y   model yılı aralığı
  f   yakıt (örnek üretiminde sabit)    g   otomatik olma olasılığı
  cl  klasik işareti
"""

M = []
def ek(n, seg, np_, y, rel, dem, f="Benzin", g=.45, cl=0):
    M.append(dict(n=n, seg=seg, np=np_, y=y, rel=rel, dem=dem, f=f, g=g, cl=cl))

# ======================= HATCHBACK (42) =======================
# Piyasanın belkemiği: B segmenti, 2010-2022, dizel/manuel ağırlıklı.
ek("Volkheim Golfo 1.6 Dizel",      "hatch", 1980000, [2011,2021], .80, 1.22, "Dizel",  .40)
ek("Volkheim Golfo 1.4 Turbo",      "hatch", 2150000, [2014,2023], .78, 1.18, "Benzin", .72)
ek("Volkheim Polen 1.0 Benzin",     "hatch", 1420000, [2013,2023], .79, 1.16, "Benzin", .35)
ek("Volkheim Polen 1.4 Dizel",      "hatch", 1510000, [2011,2018], .78, 1.10, "Dizel",  .22)
ek("Renolta Clip 1.5 Dizel",        "hatch", 1340000, [2010,2020], .72, 1.20, "Dizel",  .26)
ek("Renolta Clip 1.0 Turbo",        "hatch", 1480000, [2019,2024], .74, 1.14, "Benzin", .58)
ek("Renolta Meganta 1.5 Dizel",     "hatch", 1690000, [2012,2021], .71, 1.08, "Dizel",  .34)
ek("Fiyat Egeo 1.3 Dizel",          "hatch", 1180000, [2015,2023], .70, 1.24, "Dizel",  .18)
ek("Fiyat Egeo 1.4 Benzin",         "hatch", 1090000, [2015,2023], .69, 1.12, "Benzin", .20)
ek("Fiyat Pandora 1.2 Benzin",      "hatch",  830000, [2012,2022], .67, 1.02, "Benzin", .12)
ek("Perrin 208 1.5 Dizel",          "hatch", 1460000, [2013,2022], .70, 1.10, "Dizel",  .30)
ek("Perrin 308 1.6 Dizel",          "hatch", 1720000, [2012,2021], .69, 1.04, "Dizel",  .38)
ek("Oberon Korsa 1.3 Dizel",        "hatch", 1250000, [2011,2019], .71, 1.00, "Dizel",  .20)
ek("Oberon Astran 1.6 Dizel",       "hatch", 1580000, [2011,2020], .70, 1.02, "Dizel",  .36)
ek("Hanseul i20 1.4 Benzin",        "hatch", 1310000, [2014,2023], .80, 1.20, "Benzin", .44)
ek("Hanseul i10 1.0 Benzin",        "hatch",  980000, [2014,2023], .81, 1.14, "Benzin", .32)
ek("Kiva Rion 1.4 Benzin",          "hatch", 1240000, [2013,2022], .80, 1.10, "Benzin", .40)
ek("Kiva Seedo 1.6 Dizel",          "hatch", 1560000, [2012,2020], .79, 1.00, "Dizel",  .38)
ek("Tanaro Yarin 1.5 Hibrit",       "hatch", 1880000, [2016,2024], .88, 1.26, "Hibrit", .95)
ek("Tanaro Aurin 1.8 Hibrit",       "hatch", 2240000, [2015,2023], .89, 1.18, "Hibrit", .97)
ek("Honzo Jazzo 1.3 Benzin",        "hatch", 1370000, [2011,2020], .85, 1.04, "Benzin", .42)
ek("Honzo Siviro 1.6 Benzin",       "hatch", 1690000, [2013,2022], .84, 1.06, "Benzin", .55)
ek("Sakuda Swifto 1.2 Benzin",      "hatch", 1150000, [2012,2022], .82, 1.02, "Benzin", .30)
ek("Nisan Mikro 1.2 Benzin",        "hatch", 1070000, [2011,2019], .77, .96,  "Benzin", .28)
ek("Nisan Pulsan 1.5 Dizel",        "hatch", 1430000, [2014,2020], .76, .98,  "Dizel",  .32)
ek("Skava Fabian 1.4 Dizel",        "hatch", 1390000, [2011,2021], .76, 1.06, "Dizel",  .28)
ek("Skava Oktan 1.6 Dizel",         "hatch", 1760000, [2012,2022], .77, 1.12, "Dizel",  .42)
ek("Iberra Ibisa 1.2 Benzin",       "hatch", 1190000, [2012,2021], .72, 1.00, "Benzin", .26)
ek("Iberra Leona 1.6 Dizel",        "hatch", 1540000, [2012,2021], .72, 1.04, "Dizel",  .36)
ek("Sitronel C3 1.5 Dizel",         "hatch", 1270000, [2013,2022], .67, .98,  "Dizel",  .24)
ek("Sitronel C4 1.6 Dizel",         "hatch", 1620000, [2012,2020], .66, .94,  "Dizel",  .34)
ek("Daçya Sandro 1.5 Dizel",        "hatch", 1120000, [2013,2023], .73, 1.18, "Dizel",  .16)
ek("Daçya Sandro 1.0 Benzin",       "hatch",  990000, [2015,2023], .74, 1.08, "Benzin", .10)
ek("Bozkurt Ova 1.6 Benzin",        "hatch", 1160000, [2012,2021], .70, 1.00, "Benzin", .22)
ek("Tunca Berk 1.4 Dizel",          "hatch", 1240000, [2013,2022], .74, 1.06, "Dizel",  .24)
ek("Hessler A160 1.6 Dizel",        "hatch", 2480000, [2013,2021], .76, 1.08, "Dizel",  .70)
ek("Bavera 116 1.5 Benzin",         "hatch", 2620000, [2014,2022], .74, 1.10, "Benzin", .78)
ek("Aureon A3 1.6 Dizel",           "hatch", 2540000, [2013,2021], .75, 1.12, "Dizel",  .74)
ek("Mitsura Spaco 1.3 Benzin",      "hatch", 1020000, [2010,2018], .75, .90,  "Benzin", .20)
ek("Chenlu C3 1.5 Benzin",          "hatch",  940000, [2018,2024], .62, .86,  "Benzin", .40)
ek("Orvell E2 Elektrik",            "hatch", 1680000, [2020,2025], .78, 1.06, "Elektrik", 1.0)
ek("Voltaro V1 Elektrik",           "hatch", 1790000, [2021,2025], .76, 1.04, "Elektrik", 1.0)

# ======================= SEDAN (38) =======================
ek("Volkheim Passo 1.6 Dizel",      "sedan", 2180000, [2011,2020], .79, 1.16, "Dizel",  .44)
ek("Volkheim Jetro 1.4 Benzin",     "sedan", 1840000, [2012,2020], .78, 1.08, "Benzin", .50)
ek("Renolta Meganto Sedan 1.5 Dizel","sedan", 1620000, [2012,2022], .71, 1.18, "Dizel",  .32)
ek("Renolta Flanso 1.5 Dizel",      "sedan", 1380000, [2010,2018], .69, 1.00, "Dizel",  .24)
ek("Fiyat Linas 1.3 Dizel",         "sedan", 1090000, [2010,2020], .68, 1.14, "Dizel",  .14)
ek("Fiyat Egeo Sedan 1.6 Dizel",    "sedan", 1310000, [2015,2023], .70, 1.16, "Dizel",  .26)
ek("Hanseul Aksento 1.6 Dizel",     "sedan", 1420000, [2011,2019], .80, 1.10, "Dizel",  .36)
ek("Hanseul Elantro 1.6 Benzin",    "sedan", 1760000, [2013,2022], .81, 1.08, "Benzin", .58)
ek("Kiva Ceratto 1.6 Benzin",       "sedan", 1680000, [2013,2022], .80, 1.04, "Benzin", .54)
ek("Tanaro Korola 1.6 Benzin",      "sedan", 1980000, [2012,2022], .90, 1.26, "Benzin", .56)
ek("Tanaro Korola 1.8 Hibrit",      "sedan", 2460000, [2019,2025], .91, 1.32, "Hibrit", 1.0)
ek("Honzo Siviro Sedan 1.6 Benzin", "sedan", 1870000, [2012,2021], .85, 1.08, "Benzin", .60)
ek("Nisan Almero 1.5 Dizel",        "sedan", 1340000, [2010,2017], .76, .94,  "Dizel",  .30)
ek("Skava Oktan Sedan 1.6 Dizel",   "sedan", 1820000, [2012,2022], .77, 1.14, "Dizel",  .44)
ek("Skava Superba 2.0 Dizel",       "sedan", 2340000, [2013,2022], .76, 1.06, "Dizel",  .68)
ek("Iberra Toledo 1.6 Dizel",       "sedan", 1460000, [2012,2019], .72, .98,  "Dizel",  .32)
ek("Sitronel C-Elise 1.6 Dizel",    "sedan", 1510000, [2012,2019], .66, .92,  "Dizel",  .36)
ek("Perrin 301 1.6 Dizel",          "sedan", 1290000, [2013,2021], .69, 1.02, "Dizel",  .22)
ek("Perrin 508 2.0 Dizel",          "sedan", 2280000, [2012,2020], .68, .96,  "Dizel",  .62)
ek("Oberon Insigna 1.6 Dizel",      "sedan", 1920000, [2011,2020], .70, .98,  "Dizel",  .54)
ek("Daçya Logana 1.5 Dizel",        "sedan", 1060000, [2012,2022], .73, 1.12, "Dizel",  .14)
ek("Bozkurt Ova Sedan 1.6 Dizel",   "sedan", 1280000, [2012,2021], .70, 1.02, "Dizel",  .26)
ek("Tunca Berk Sedan 1.4 Dizel",    "sedan", 1340000, [2013,2022], .74, 1.06, "Dizel",  .28)
ek("Serhat Ege 1.6 Benzin",         "sedan", 1190000, [2010,2019], .68, .94,  "Benzin", .20)
ek("Hessler C200 2.0 Dizel",        "sedan", 3480000, [2013,2022], .78, 1.20, "Dizel",  .88)
ek("Hessler E220 2.0 Dizel",        "sedan", 4920000, [2013,2022], .77, 1.14, "Dizel",  .94)
ek("Bavera 320 2.0 Dizel",          "sedan", 3620000, [2013,2022], .75, 1.22, "Dizel",  .90)
ek("Bavera 520 2.0 Dizel",          "sedan", 5180000, [2013,2022], .74, 1.12, "Dizel",  .94)
ek("Aureon A4 2.0 Dizel",           "sedan", 3540000, [2013,2022], .75, 1.16, "Dizel",  .90)
ek("Aureon A6 2.0 Dizel",           "sedan", 5060000, [2013,2021], .74, 1.06, "Dizel",  .94)
ek("Nordahl S60 2.0 Dizel",         "sedan", 3180000, [2013,2021], .80, 1.00, "Dizel",  .86)
ek("Calvetti Giulio 2.0 Dizel",     "sedan", 3260000, [2016,2023], .66, 1.04, "Dizel",  .92)
ek("Mitsura Lansa 1.6 Benzin",      "sedan", 1230000, [2010,2017], .76, .88,  "Benzin", .34)
ek("Daewon Lacetta 1.6 Benzin",     "sedan", 1010000, [2009,2016], .70, .84,  "Benzin", .28)
ek("Weibo W5 1.5 Benzin",           "sedan", 1090000, [2019,2025], .63, .88,  "Benzin", .52)
ek("Jinhai J7 1.5 Benzin",          "sedan", 1140000, [2019,2025], .62, .86,  "Benzin", .50)
ek("Amperon A3 Elektrik",           "sedan", 2340000, [2021,2025], .79, 1.08, "Elektrik", 1.0)
ek("Orvell E4 Elektrik",            "sedan", 2680000, [2020,2025], .77, 1.06, "Elektrik", 1.0)

# ======================= SUV (26) =======================
ek("Daçya Duste 1.5 Dizel",         "suv",  1480000, [2012,2023], .73, 1.28, "Dizel",  .22)
ek("Renolta Kadjor 1.5 Dizel",      "suv",  1980000, [2015,2022], .71, 1.12, "Dizel",  .48)
ek("Hanseul Tucana 1.6 Dizel",      "suv",  2380000, [2015,2023], .81, 1.24, "Dizel",  .66)
ek("Hanseul Bayon 1.4 Benzin",      "suv",  1920000, [2021,2025], .82, 1.18, "Benzin", .60)
ek("Kiva Sportago 1.6 Dizel",       "suv",  2420000, [2015,2023], .80, 1.20, "Dizel",  .64)
ek("Tanaro Ravo 2.0 Hibrit",        "suv",  3180000, [2019,2025], .90, 1.30, "Hibrit", 1.0)
ek("Tanaro Korila 1.8 Hibrit",      "suv",  2740000, [2020,2025], .90, 1.26, "Hibrit", 1.0)
ek("Nisan Kaskay 1.5 Dizel",        "suv",  2140000, [2014,2022], .77, 1.14, "Dizel",  .56)
ek("Nisan Jukar 1.5 Dizel",         "suv",  1740000, [2012,2020], .76, 1.02, "Dizel",  .40)
ek("Volkheim Tiguar 2.0 Dizel",     "suv",  2980000, [2013,2022], .79, 1.22, "Dizel",  .78)
ek("Volkheim Tirok 1.5 Benzin",     "suv",  2240000, [2018,2024], .79, 1.10, "Benzin", .70)
ek("Skava Kodak 2.0 Dizel",         "suv",  2860000, [2017,2024], .77, 1.14, "Dizel",  .80)
ek("Skava Kamik 1.6 Dizel",         "suv",  2120000, [2019,2024], .78, 1.08, "Dizel",  .62)
ek("Oberon Mokano 1.6 Dizel",       "suv",  1860000, [2014,2021], .70, .98,  "Dizel",  .46)
ek("Perrin 3008 1.5 Dizel",         "suv",  2460000, [2016,2023], .69, 1.06, "Dizel",  .72)
ek("Sitronel C5 Aircro 1.5 Dizel",  "suv",  2180000, [2018,2024], .66, .96,  "Dizel",  .74)
ek("Iberra Atego 1.6 Dizel",        "suv",  2260000, [2017,2023], .72, 1.04, "Dizel",  .68)
ek("Fiyat Egeo Cross 1.3 Dizel",    "suv",  1540000, [2020,2025], .70, 1.10, "Dizel",  .34)
ek("Mitsura Autlander 2.0 Benzin",  "suv",  2540000, [2013,2021], .76, .94,  "Benzin", .82)
ek("Honzo CRV 1.6 Dizel",           "suv",  2680000, [2013,2021], .85, 1.06, "Dizel",  .76)
ek("Sakuda Vitaro 1.4 Benzin",      "suv",  1960000, [2016,2023], .83, 1.00, "Benzin", .58)
ek("Daewon Trax 1.4 Benzin",        "suv",  1480000, [2014,2020], .70, .88,  "Benzin", .52)
ek("Longwei L5 1.5 Benzin",         "suv",  1620000, [2019,2025], .63, .92,  "Benzin", .58)
ek("Chenlu C5 1.5 Benzin",          "suv",  1560000, [2019,2025], .62, .90,  "Benzin", .56)
ek("Kestrel Ridge 2.0 Dizel",       "suv",  3980000, [2014,2022], .64, 1.04, "Dizel",  .88)
ek("Voltaro V5 Elektrik",           "suv",  2980000, [2021,2025], .77, 1.10, "Elektrik", 1.0)

# ======================= TİCARİ (22) =======================
ek("Fiyat Dobla 1.6 Dizel",         "ticari", 1180000, [2011,2022], .71, 1.22, "Dizel", .10)
ek("Fiyat Fiorina 1.3 Dizel",       "ticari",  980000, [2010,2021], .70, 1.16, "Dizel", .08)
ek("Renolta Kango 1.5 Dizel",       "ticari", 1120000, [2011,2022], .72, 1.20, "Dizel", .10)
ek("Renolta Trafiko 1.6 Dizel",     "ticari", 1740000, [2012,2022], .70, 1.10, "Dizel", .14)
ek("Volkheim Kaddi 1.6 Dizel",      "ticari", 1420000, [2011,2021], .78, 1.12, "Dizel", .20)
ek("Volkheim Transpo 2.0 Dizel",    "ticari", 2280000, [2012,2022], .78, 1.08, "Dizel", .26)
ek("Perrin Partnero 1.6 Dizel",     "ticari", 1160000, [2011,2021], .69, 1.06, "Dizel", .10)
ek("Sitronel Berlingo 1.6 Dizel",   "ticari", 1140000, [2011,2021], .66, 1.04, "Dizel", .10)
ek("Oberon Kombo 1.5 Dizel",        "ticari", 1200000, [2013,2022], .70, 1.00, "Dizel", .12)
ek("Daçya Dokkar 1.5 Dizel",        "ticari", 1080000, [2013,2022], .73, 1.14, "Dizel", .08)
ek("Hessler Vitano 2.0 Dizel",      "ticari", 2640000, [2013,2022], .77, 1.06, "Dizel", .40)
ek("Hessler Sprinto 2.1 Dizel",     "ticari", 2980000, [2012,2022], .78, 1.02, "Dizel", .22)
ek("Steinmann Daylo 2.3 Dizel",     "ticari", 1960000, [2011,2021], .72, .96,  "Dizel", .10)
ek("Fordan Transito 2.0 Dizel",     "ticari", 2240000, [2012,2022], .73, 1.14, "Dizel", .24)
ek("Fordan Kurye 1.5 Dizel",        "ticari", 1240000, [2014,2023], .74, 1.08, "Dizel", .12)
ek("Tanaro Proago 1.5 Dizel",       "ticari", 1320000, [2015,2023], .86, 1.04, "Dizel", .16)
ek("Nisan NV200 1.5 Dizel",         "ticari", 1180000, [2012,2021], .76, .98,  "Dizel", .10)
ek("Bozkurt Ova Kombi 1.6 Dizel",   "ticari", 1360000, [2013,2022], .70, 1.00, "Dizel", .14)
ek("Tunca Yük 2.0 Dizel",           "ticari", 1580000, [2014,2023], .73, .98,  "Dizel", .12)
ek("Zavod Okta 1.9 Dizel",          "ticari",  860000, [2009,2017], .58, .82,  "Dizel", .04)
ek("Romira Dastan 1.5 Dizel",       "ticari",  920000, [2011,2019], .60, .86,  "Dizel", .06)
ek("Longwei Kargo 1.6 Dizel",       "ticari", 1040000, [2018,2024], .62, .88,  "Dizel", .14)

# ======================= LÜKS (12) =======================
ek("Hessler S400 3.0 Dizel",        "lux",  9800000, [2014,2022], .76, 1.06, "Dizel", 1.0)
ek("Bavera 730 3.0 Dizel",          "lux", 10400000, [2014,2022], .73, 1.04, "Dizel", 1.0)
ek("Aureon A8 3.0 Dizel",           "lux",  9600000, [2013,2021], .74, 1.00, "Dizel", 1.0)
ek("Bavera X5 3.0 Dizel",           "lux",  7800000, [2014,2022], .73, 1.14, "Dizel", 1.0)
ek("Hessler GLE 2.9 Dizel",         "lux",  8200000, [2015,2023], .76, 1.12, "Dizel", 1.0)
ek("Vernon Highland 3.0 Dizel",     "lux", 16400000, [2016,2023], .58, 1.08, "Dizel", 1.0)
ek("Vernon Sporta 3.0 Dizel",       "lux", 10800000, [2014,2022], .58, 1.06, "Dizel", 1.0)
ek("Halloway Warden 3.0 Dizel",     "lux",  9200000, [2016,2023], .60, .98,  "Dizel", 1.0)
ek("Nordahl XC90 2.0 Hibrit",       "lux",  7400000, [2017,2024], .81, 1.02, "Hibrit", 1.0)
ek("Calvetti Stelvo 2.2 Dizel",     "lux",  6200000, [2018,2024], .64, .96,  "Dizel", 1.0)
ek("Brickley Contin 3.0 Benzin",    "lux", 26800000, [2016,2023], .56, .82,  "Benzin", 1.0)
ek("Amperon S Elektrik",            "lux",  8600000, [2021,2025], .78, 1.10, "Elektrik", 1.0)

# ======================= KLASİK (10) =======================
ek("Bozkurt Yaman 1.6",             "klasik", 420000, [1978,1994], .50, .92, "Benzin", 0, 1)
ek("Serhat Efe 1.3",                "klasik", 310000, [1975,1990], .48, .88, "Benzin", 0, 1)
ek("Tunca Murat 1.3",               "klasik", 268000, [1972,1988], .46, .96, "Benzin", 0, 1)
ek("Volkheim Böcek 1.2",            "klasik", 640000, [1965,1979], .44, 1.10,"Benzin", 0, 1)
ek("Renolta Toros 1.4",             "klasik", 295000, [1976,1992], .47, 1.04,"Benzin", 0, 1)
ek("Fiyat Şahan 1.6",               "klasik", 340000, [1980,1996], .49, 1.00,"Benzin", 0, 1)
ek("Hessler 190 2.0",               "klasik", 980000, [1983,1993], .58, 1.06,"Benzin", 0, 1)
ek("Bavera E30 2.0",                "klasik",1240000, [1982,1991], .55, 1.14,"Benzin", 0, 1)
ek("Perrin 205 1.4",                "klasik", 380000, [1983,1994], .46, .94, "Benzin", 0, 1)
ek("Vernon Mk1 3.5",                "klasik",1480000, [1972,1985], .40, .90, "Benzin", 0, 1)

# ======================= ARIZA KARAKTERİ =======================
# Her modelin kendi zayıf noktası var. Önceki sürümde arıza 19 maddelik
# global havuzdan eşit olasılıkla çekiliyordu: Bavera 520 ile Tunca Murat
# aynı sıklıkla turbo revizyonuna giriyordu, yani 150 model 150 fiyat
# etiketinden ibaretti. Artık her modelin 2 imza arızası ve bir km eşiği
# var — oyuncu zamanla "bu modeli 180 binden sonra alma" diyebiliyor.
#
# Profil markanın ailesinden türüyor; yakıt, vites ve yaş üstüne biniyor.
# Üretim deterministik: ad → tohum, her çalıştırmada aynı tablo çıkıyor.

MARKA_ZAYIF = {
    # Alman                      # Fransız                   # Japon
    "Volkheim": ["sanziman", "elektrik"],
    "Hessler":  ["motor", "elektrik"],
    "Bavera":   ["motor", "sanziman"],
    "Aureon":   ["motor", "sanziman"],
    "Steinmann":["motor", "kaporta"],
    "Fordan":   ["sanziman", "motor"],
    "Oberon":   ["motor", "elektrik"],
    "Skava":    ["sanziman", "elektrik"],
    "Iberra":   ["elektrik", "sanziman"],
    "Renolta":  ["elektrik", "sanziman"],
    "Perrin":   ["motor", "elektrik"],
    "Sitronel": ["elektrik", "kaporta"],
    "Daçya":    ["ic", "kaporta"],
    "Fiyat":    ["elektrik", "kaporta"],
    "Calvetti": ["elektrik", "motor"],
    "Tanaro":   ["ic", "kaporta"],
    "Honzo":    ["ic", "kaporta"],
    "Nisan":    ["sanziman", "elektrik"],
    "Sakuda":   ["kaporta", "ic"],
    "Mitsura":  ["kaporta", "elektrik"],
    "Hanseul":  ["ic", "kaporta"],
    "Kiva":     ["ic", "elektrik"],
    "Daewon":   ["motor", "elektrik"],
    # İngiliz / İsveç / lüks
    "Nordahl":  ["elektrik", "motor"],
    "Kestrel":  ["elektrik", "motor"],
    "Vernon":   ["elektrik", "motor"],
    "Halloway": ["elektrik", "sanziman"],
    "Brickley": ["motor", "elektrik"],
    # Çin / Doğu Bloku / yerli
    "Chenlu":   ["elektrik", "ic"],
    "Longwei":  ["elektrik", "ic"],
    "Weibo":    ["elektrik", "ic"],
    "Jinhai":   ["elektrik", "ic"],
    "Zavod":    ["kaporta", "motor"],
    "Romira":   ["kaporta", "elektrik"],
    "Bozkurt":  ["kaporta", "ic"],
    "Tunca":    ["kaporta", "motor"],
    "Serhat":   ["kaporta", "elektrik"],
    # Elektrikli
    "Orvell":   ["elektrik", "ic"],
    "Voltaro":  ["elektrik", "ic"],
    "Amperon":  ["elektrik", "ic"],
}

def _tohum(s):
    h = 2166136261
    for ch in s:
        h = ((h ^ ord(ch)) * 16777619) & 0xFFFFFFFF
    return h

def imza_ariza(m, organ, tohum):
    """Organı somut bir arızaya çeviriyor: yakıt, vites, fiyat ve yaş bakılarak."""
    elektrikli = m["f"] in ("Elektrik", "Hibrit")
    otomatik   = m["g"] >= .66
    eski       = m["cl"] or m["y"][0] < 2012
    pahali     = m["np"] >= 3000000
    if organ == "motor":
        if elektrikli:                       # elektrikli araçta motor arızası olmaz
            return "beyin" if tohum % 2 else "aku"
        if m["f"] == "Dizel":
            return "turbo" if (pahali or tohum % 3 == 0) else "enjektor"
        return "triger" if tohum % 2 else "yagkacak"
    if organ == "sanziman":
        if elektrikli:
            return "beyin"
        if otomatik:
            return "sanzimanrev" if (pahali and tohum % 3 == 0) else "otosanziman"
        return "debriyaj"
    if organ == "kaporta":
        if eski:
            return "altsac"
        return "camurluk" if tohum % 2 else "kapiboya"
    if organ == "ic":
        if pahali:
            return "deri"
        return "doseme" if tohum % 2 else "torpido"
    # elektrik — akü tek başına baskın çıkmasın diye üçe dağıtılıyor
    if eski:
        return ["aku", "klima", "aku"][tohum % 3]
    if pahali or m["seg"] in ("lux", "suv"):
        return ["beyin", "multimedya", "klima"][tohum % 3]
    return ["klima", "multimedya", "aku"][tohum % 3]

def km_esigi(m):
    """Zayıf noktanın kendini göstermeye başladığı km (bin). Güvenilirlik
       yükseldikçe eşik geriye gidiyor; ticari araç erken yoruluyor."""
    taban = 70 + m["rel"] * 230          # rel .46 → 176 bin · rel .91 → 279 bin
    if m["seg"] == "ticari": taban *= .72
    if m["seg"] == "lux":    taban *= .86
    if m["cl"]:              taban  = 0   # klasikte eşik yok, hepsi yorgun
    return int(round(taban / 10) * 10)

for m in M:
    marka = m["n"].split()[0]
    organlar = MARKA_ZAYIF.get(marka)
    assert organlar, "marka profili eksik: " + marka
    t = _tohum(m["n"])
    a = imza_ariza(m, organlar[0], t)
    b = imza_ariza(m, organlar[1], t >> 7)
    m["zf"] = [a] if a == b else [a, b]
    m["km"] = km_esigi(m)

# ======================= doğrulama + çıktı =======================
from collections import Counter
say = Counter(m["seg"] for m in M)
hedef = {"hatch":42, "sedan":38, "suv":26, "ticari":22, "lux":12, "klasik":10}
print("segment dağılımı:")
for k, v in hedef.items():
    isaret = "OK " if say[k] == v else "FARK"
    print(f"  {isaret} {k:7} {say[k]:3} / hedef {v}")
print("toplam:", len(M))

adlar = [m["n"] for m in M]
assert len(adlar) == len(set(adlar)), "tekrar eden ad var: " + str(
    [a for a, c in Counter(adlar).items() if c > 1])

yak = Counter(m["f"] for m in M)
print("yakıt:", dict(yak))
print("ortalama otomatik olasılığı:", round(sum(m["g"] for m in M)/len(M), 2))

satir = []
for m in M:
    s = (f' {{n:"{m["n"]}",'.ljust(42) +
         f'seg:"{m["seg"]}",'.ljust(16) +
         f'np:{m["np"]:>9},' +
         f' dem:{m["dem"]:.2f}, rel:{m["rel"]:.2f},' +
         f' f:"{m["f"]}", g:{m["g"]:.2f},' +
         f' y:[{m["y"][0]},{m["y"][1]}],' +
         ' zf:[' + ",".join(f'"{z}"' for z in m["zf"]) + f'], km:{m["km"]}' +
         (", cl:1" if m["cl"] else "") + "}")
    satir.append(s)
js = "const MODELS=[\n" + ",\n".join(satir) + "\n];"
open("_modeller_b.js", "w", encoding="utf-8").write(js)
print("yazıldı: _modeller_b.js", len(js), "bayt")

# Tabloyu game.js'in içine de yaz. Daha önce buradaki çıktı elle
# kopyalanıyordu ve iki dosya sessizce ayrışabiliyordu — üretici artık
# tek kaynak.
import re as _re
g = open("game.js", encoding="utf-8").read()
yeni, adet = _re.subn(r"const MODELS=\[[\s\S]*?\n\];", js, g, count=1)
assert adet == 1, "game.js içinde MODELS tablosu bulunamadı"
open("game.js", "w", encoding="utf-8").write(yeni)
print("game.js içindeki MODELS tablosu güncellendi")
