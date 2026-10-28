//<CORE>
/* ============ yardımcılar ============ */
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const chance=p=>Math.random()<p;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const roundTo=(v,s)=>Math.round(v/s)*s;
const YEAR=2026;

/* ============ modeller ============ */
/* ============ modeller — TÜRKİYE PAZARI ============
   45 özgün marka, 130 model. Hiçbiri gerçek bir marka/model değil; adlar
   Türkiye pazarını çağrıştırıyor. np = bugünün sıfır anahtar teslim fiyatı,
   Ekim 2026 Türkiye fiyatlarına çapalandı (en ucuz hatchback ~1,46 milyon;
   Egea sedan ~1,50; Clio ~1,83; Mercedes A ~3,2; BMW X5 ~17,7; Range ~26,6).
   Klasiklerde np = bugünkü koleksiyon değeri. */
const MODELS=[
 {n:"Volkheim Golfo 1.6 Dizel",           seg:"hatch",    np:  1980000, dem:1.22, rel:0.80, f:"Dizel", g:0.40, y:[2011,2021], zf:["enjektor","debriyaj"], km:250},
 {n:"Volkheim Golfo 1.4 Turbo",           seg:"hatch",    np:  2150000, dem:1.18, rel:0.78, f:"Benzin", g:0.80, y:[2012,2020], zf:["otosanziman","zincir"], km:250, ky:"zincir"},
 {n:"Volkheim Polen 1.0 Benzin",          seg:"hatch",    np:  1420000, dem:1.16, rel:0.79, f:"Benzin", g:0.35, y:[2013,2023], zf:["debriyaj","klima"], km:250},
 {n:"Volkheim Polen 1.4 Dizel",           seg:"hatch",    np:  1510000, dem:1.10, rel:0.78, f:"Dizel", g:0.22, y:[2011,2018], zf:["debriyaj","klima"], km:250},
 {n:"Renolta Clip 1.5 Dizel",             seg:"hatch",    np:  1340000, dem:1.20, rel:0.72, f:"Dizel", g:0.26, y:[2010,2020], zf:["aku","debriyaj"], km:240},
 {n:"Renolta Clip 1.0 Turbo",             seg:"hatch",    np:  1480000, dem:1.14, rel:0.74, f:"Benzin", g:0.58, y:[2019,2024], zf:["multimedya","debriyaj"], km:240},
 {n:"Renolta Meganta 1.5 Dizel",          seg:"hatch",    np:  1690000, dem:1.08, rel:0.71, f:"Dizel", g:0.50, y:[2012,2021], zf:["otosanziman","enjektor"], km:230},
 {n:"Fiyat Egeo 1.3 Dizel",               seg:"hatch",    np:  1180000, dem:1.24, rel:0.70, f:"Dizel", g:0.18, y:[2016,2024], zf:["kapiboya","multimedya"], km:230, ky:"zincir"},
 {n:"Fiyat Egeo 1.4 Benzin",              seg:"hatch",    np:  1090000, dem:1.12, rel:0.69, f:"Benzin", g:0.20, y:[2015,2023], zf:["multimedya","camurluk"], km:230},
 {n:"Fiyat Pandora 1.2 Benzin",           seg:"hatch",    np:   830000, dem:1.02, rel:0.67, f:"Benzin", g:0.12, y:[2012,2022], zf:["aku","kapiboya"], km:220},
 {n:"Perrin 208 1.5 Dizel",               seg:"hatch",    np:  1460000, dem:1.10, rel:0.70, f:"Dizel", g:0.30, y:[2018,2024], zf:["enjektor","aku"], km:230},
 {n:"Perrin 308 1.6 Dizel",               seg:"hatch",    np:  1720000, dem:1.04, rel:0.69, f:"Dizel", g:0.38, y:[2012,2021], zf:["enjektor","multimedya"], km:230},
 {n:"Oberon Korsa 1.3 Dizel",             seg:"hatch",    np:  1250000, dem:1.00, rel:0.71, f:"Dizel", g:0.20, y:[2011,2019], zf:["enjektor","aku"], km:230},
 {n:"Oberon Astran 1.6 Dizel",            seg:"hatch",    np:  1580000, dem:1.02, rel:0.70, f:"Dizel", g:0.36, y:[2011,2020], zf:["enjektor","aku"], km:230},
 {n:"Hanseul i20 1.4 Benzin",             seg:"hatch",    np:  1310000, dem:1.20, rel:0.80, f:"Benzin", g:0.44, y:[2014,2023], zf:["doseme","camurluk"], km:250},
 {n:"Hanseul i10 1.0 Benzin",             seg:"hatch",    np:   980000, dem:1.14, rel:0.81, f:"Benzin", g:0.32, y:[2014,2023], zf:["torpido","kapiboya"], km:260},
 {n:"Kiva Rion 1.4 Benzin",               seg:"hatch",    np:  1240000, dem:1.10, rel:0.80, f:"Benzin", g:0.40, y:[2013,2022], zf:["doseme","multimedya"], km:250},
 {n:"Kiva Seedo 1.6 Dizel",               seg:"hatch",    np:  1560000, dem:1.00, rel:0.79, f:"Dizel", g:0.38, y:[2012,2020], zf:["doseme","multimedya"], km:250},
 {n:"Tanaro Yarin 1.5 Hibrit",            seg:"hatch",    np:  1880000, dem:1.26, rel:0.88, f:"Hibrit", g:0.95, y:[2016,2024], zf:["doseme","kapiboya"], km:270},
 {n:"Tanaro Aurin 1.8 Hibrit",            seg:"hatch",    np:  2240000, dem:1.18, rel:0.89, f:"Hibrit", g:0.97, y:[2013,2019], zf:["torpido","kapiboya"], km:270},
 {n:"Honzo Jazzo 1.3 Benzin",             seg:"hatch",    np:  1370000, dem:1.04, rel:0.85, f:"Benzin", g:0.42, y:[2011,2020], zf:["doseme","altsac"], km:270},
 {n:"Honzo Siviro 1.6 Benzin",            seg:"hatch",    np:  1690000, dem:1.06, rel:0.84, f:"Benzin", g:0.55, y:[2013,2022], zf:["torpido","camurluk"], km:260},
 {n:"Sakuda Swifto 1.2 Benzin",           seg:"hatch",    np:  1150000, dem:1.02, rel:0.82, f:"Benzin", g:0.30, y:[2012,2022], zf:["camurluk","torpido"], km:260},
 {n:"Nisan Mikro 1.2 Benzin",             seg:"hatch",    np:  1070000, dem:0.96, rel:0.77, f:"Benzin", g:0.28, y:[2011,2019], zf:["debriyaj","aku"], km:250},
 {n:"Nisan Pulsan 1.5 Dizel",             seg:"hatch",    np:  1430000, dem:0.98, rel:0.76, f:"Dizel", g:0.32, y:[2014,2020], zf:["debriyaj","multimedya"], km:240},
 {n:"Skava Fabian 1.4 Dizel",             seg:"hatch",    np:  1390000, dem:1.06, rel:0.76, f:"Dizel", g:0.28, y:[2011,2021], zf:["debriyaj","aku"], km:240},
 {n:"Skava Oktan 1.6 Dizel",              seg:"hatch",    np:  1760000, dem:1.12, rel:0.77, f:"Dizel", g:0.50, y:[2012,2022], zf:["otosanziman","enjektor"], km:250},
 {n:"Iberra Ibisa 1.2 Benzin",            seg:"hatch",    np:  1190000, dem:1.00, rel:0.72, f:"Benzin", g:0.26, y:[2012,2021], zf:["multimedya","debriyaj"], km:240},
 {n:"Iberra Leona 1.6 Dizel",             seg:"hatch",    np:  1540000, dem:1.04, rel:0.72, f:"Dizel", g:0.36, y:[2012,2021], zf:["multimedya","debriyaj"], km:240},
 {n:"Sitronel C3 1.5 Dizel",              seg:"hatch",    np:  1270000, dem:0.98, rel:0.67, f:"Dizel", g:0.24, y:[2013,2022], zf:["multimedya","camurluk"], km:220},
 {n:"Sitronel C4 1.6 Dizel",              seg:"hatch",    np:  1620000, dem:0.94, rel:0.66, f:"Dizel", g:0.34, y:[2012,2020], zf:["multimedya","kapiboya"], km:220},
 {n:"Daçya Sandro 1.5 Dizel",             seg:"hatch",    np:  1120000, dem:1.18, rel:0.73, f:"Dizel", g:0.16, y:[2013,2023], zf:["torpido","camurluk"], km:240},
 {n:"Daçya Sandro 1.0 Benzin",            seg:"hatch",    np:   990000, dem:1.08, rel:0.74, f:"Benzin", g:0.10, y:[2015,2023], zf:["doseme","kapiboya"], km:240},
 {n:"Bozkurt Ova 1.6 Benzin",             seg:"hatch",    np:  1160000, dem:1.00, rel:0.70, f:"Benzin", g:0.22, y:[2012,2021], zf:["camurluk","doseme"], km:230},
 {n:"Tunca Berk 1.4 Dizel",               seg:"hatch",    np:  1240000, dem:1.06, rel:0.74, f:"Dizel", g:0.24, y:[2013,2022], zf:["camurluk","enjektor"], km:240},
 {n:"Hessler A160 1.6 Dizel",             seg:"hatch",    np:  2480000, dem:1.08, rel:0.76, f:"Dizel", g:0.95, y:[2013,2021], zf:["enjektor","otosanziman"], km:240},
 {n:"Bavera 116 1.5 Benzin",              seg:"hatch",    np:  2620000, dem:1.10, rel:0.74, f:"Benzin", g:0.78, y:[2014,2022], zf:["yagkacak","otosanziman"], km:240},
 {n:"Aureon A3 1.6 Dizel",                seg:"hatch",    np:  2540000, dem:1.12, rel:0.75, f:"Dizel", g:0.74, y:[2013,2021], zf:["enjektor","otosanziman"], km:240},
 {n:"Mitsura Spaco 1.3 Benzin",           seg:"hatch",    np:  1020000, dem:0.90, rel:0.75, f:"Benzin", g:0.20, y:[2010,2018], zf:["altsac","aku"], km:240},
 {n:"Chenlu C3 1.5 Benzin",               seg:"hatch",    np:   940000, dem:0.86, rel:0.62, f:"Benzin", g:0.40, y:[2018,2024], zf:["klima","doseme"], km:210},
 {n:"Orvell E2 Elektrik",                 seg:"hatch",    np:  1680000, dem:0.92, rel:0.78, f:"Elektrik", g:1.00, y:[2020,2025], zf:["klima","doseme"], km:250},
 {n:"Voltaro V1 Elektrik",                seg:"hatch",    np:  1790000, dem:0.90, rel:0.76, f:"Elektrik", g:1.00, y:[2021,2025], zf:["klima","doseme"], km:240},
 {n:"Volkheim Passo 1.6 Dizel",           seg:"sedan",    np:  2180000, dem:1.16, rel:0.79, f:"Dizel", g:0.75, y:[2011,2020], zf:["otosanziman","enjektor"], km:250},
 {n:"Volkheim Jetro 1.4 Benzin",          seg:"sedan",    np:  1840000, dem:1.08, rel:0.78, f:"Benzin", g:0.80, y:[2012,2020], zf:["otosanziman","aku"], km:250},
 {n:"Renolta Meganto Sedan 1.5 Dizel",    seg:"sedan",    np:  1620000, dem:1.18, rel:0.71, f:"Dizel", g:0.55, y:[2012,2022], zf:["otosanziman","multimedya"], km:230},
 {n:"Renolta Flanso 1.5 Dizel",           seg:"sedan",    np:  1380000, dem:1.00, rel:0.69, f:"Dizel", g:0.50, y:[2010,2018], zf:["otosanziman","enjektor"], km:230},
 {n:"Fiyat Linas 1.3 Dizel",              seg:"sedan",    np:  1090000, dem:1.14, rel:0.68, f:"Dizel", g:0.14, y:[2007,2018], zf:["debriyaj","klima"], km:230, ky:"zincir"},
 {n:"Fiyat Egeo Sedan 1.6 Dizel",         seg:"sedan",    np:  1310000, dem:1.16, rel:0.70, f:"Dizel", g:0.40, y:[2015,2023], zf:["otosanziman","kapiboya"], km:230},
 {n:"Hanseul Aksento 1.6 Dizel",          seg:"sedan",    np:  1420000, dem:1.10, rel:0.80, f:"Dizel", g:0.36, y:[2011,2019], zf:["doseme","altsac"], km:250},
 {n:"Hanseul Elantro 1.6 Benzin",         seg:"sedan",    np:  1760000, dem:1.08, rel:0.81, f:"Benzin", g:0.58, y:[2013,2022], zf:["doseme","camurluk"], km:260},
 {n:"Kiva Ceratto 1.6 Benzin",            seg:"sedan",    np:  1680000, dem:1.04, rel:0.80, f:"Benzin", g:0.54, y:[2013,2022], zf:["doseme","klima"], km:250},
 {n:"Tanaro Korola 1.6 Benzin",           seg:"sedan",    np:  1980000, dem:1.26, rel:0.90, f:"Benzin", g:0.56, y:[2012,2022], zf:["doseme","camurluk"], km:280},
 {n:"Tanaro Korola 1.8 Hibrit",           seg:"sedan",    np:  2460000, dem:1.32, rel:0.91, f:"Hibrit", g:1.00, y:[2019,2025], zf:["doseme","kapiboya"], km:280},
 {n:"Honzo Siviro Sedan 1.6 Benzin",      seg:"sedan",    np:  1870000, dem:1.08, rel:0.85, f:"Benzin", g:0.60, y:[2012,2021], zf:["doseme","camurluk"], km:270},
 {n:"Nisan Almero 1.5 Dizel",             seg:"sedan",    np:  1340000, dem:0.94, rel:0.76, f:"Dizel", g:0.30, y:[2010,2017], zf:["debriyaj","klima"], km:240},
 {n:"Skava Oktan Sedan 1.6 Dizel",        seg:"sedan",    np:  1820000, dem:1.14, rel:0.77, f:"Dizel", g:0.52, y:[2012,2022], zf:["otosanziman","enjektor"], km:250},
 {n:"Skava Superba 2.0 Dizel",            seg:"sedan",    np:  2340000, dem:1.06, rel:0.76, f:"Dizel", g:0.68, y:[2013,2022], zf:["otosanziman","aku"], km:240},
 {n:"Iberra Toledo 1.6 Dizel",            seg:"sedan",    np:  1460000, dem:0.98, rel:0.72, f:"Dizel", g:0.32, y:[2012,2019], zf:["klima","debriyaj"], km:240},
 {n:"Sitronel C-Elise 1.6 Dizel",         seg:"sedan",    np:  1510000, dem:0.92, rel:0.66, f:"Dizel", g:0.36, y:[2012,2019], zf:["klima","kapiboya"], km:220},
 {n:"Perrin 301 1.6 Dizel",               seg:"sedan",    np:  1290000, dem:1.02, rel:0.69, f:"Dizel", g:0.22, y:[2013,2021], zf:["enjektor","aku"], km:230},
 {n:"Perrin 508 2.0 Dizel",               seg:"sedan",    np:  2280000, dem:0.96, rel:0.68, f:"Dizel", g:0.62, y:[2012,2020], zf:["enjektor","multimedya"], km:230},
 {n:"Oberon Insigna 1.6 Dizel",           seg:"sedan",    np:  1920000, dem:0.98, rel:0.70, f:"Dizel", g:0.54, y:[2011,2020], zf:["enjektor","aku"], km:230},
 {n:"Daçya Logana 1.5 Dizel",             seg:"sedan",    np:  1060000, dem:1.12, rel:0.73, f:"Dizel", g:0.14, y:[2012,2022], zf:["doseme","camurluk"], km:240},
 {n:"Bozkurt Ova Sedan 1.6 Dizel",        seg:"sedan",    np:  1280000, dem:1.02, rel:0.70, f:"Dizel", g:0.26, y:[2012,2021], zf:["kapiboya","doseme"], km:230},
 {n:"Tunca Berk Sedan 1.4 Dizel",         seg:"sedan",    np:  1340000, dem:1.06, rel:0.74, f:"Dizel", g:0.28, y:[2013,2022], zf:["kapiboya","enjektor"], km:240},
 {n:"Serhat Ege 1.6 Benzin",              seg:"sedan",    np:  1190000, dem:0.94, rel:0.68, f:"Benzin", g:0.20, y:[2010,2019], zf:["altsac","aku"], km:230},
 {n:"Hessler C200 2.0 Dizel",             seg:"sedan",    np:  3480000, dem:1.20, rel:0.78, f:"Dizel", g:0.97, y:[2013,2022], zf:["enjektor","turbo"], km:250},
 {n:"Hessler E220 2.0 Dizel",             seg:"sedan",    np:  4920000, dem:1.14, rel:0.77, f:"Dizel", g:0.94, y:[2013,2022], zf:["turbo","beyin"], km:250},
 {n:"Bavera 320 2.0 Dizel",               seg:"sedan",    np:  3620000, dem:1.22, rel:0.75, f:"Dizel", g:0.95, y:[2013,2022], zf:["zincir","enjektor"], km:240, ky:"zincir"},
 {n:"Bavera 520 2.0 Dizel",               seg:"sedan",    np:  5180000, dem:1.12, rel:0.74, f:"Dizel", g:0.96, y:[2013,2022], zf:["zincir","turbo"], km:240, ky:"zincir"},
 {n:"Aureon A4 2.0 Dizel",                seg:"sedan",    np:  3540000, dem:1.16, rel:0.75, f:"Dizel", g:0.90, y:[2013,2022], zf:["turbo","sanzimanrev"], km:240},
 {n:"Aureon A6 2.0 Dizel",                seg:"sedan",    np:  5060000, dem:1.06, rel:0.74, f:"Dizel", g:0.94, y:[2013,2021], zf:["turbo","otosanziman"], km:240},
 {n:"Nordahl S60 2.0 Dizel",              seg:"sedan",    np:  3180000, dem:1.00, rel:0.80, f:"Dizel", g:0.86, y:[2013,2021], zf:["klima","turbo"], km:250},
 {n:"Calvetti Giulio 2.0 Dizel",          seg:"sedan",    np:  3260000, dem:1.04, rel:0.66, f:"Dizel", g:0.92, y:[2016,2023], zf:["aku","multimedya"], km:220},
 {n:"Mitsura Lansa 1.6 Benzin",           seg:"sedan",    np:  1230000, dem:0.88, rel:0.76, f:"Benzin", g:0.34, y:[2010,2017], zf:["altsac","klima"], km:240},
 {n:"Daewon Lacetta 1.6 Benzin",          seg:"sedan",    np:  1010000, dem:0.84, rel:0.70, f:"Benzin", g:0.28, y:[2009,2016], zf:["yagkacak","aku"], km:230},
 {n:"Weibo W5 1.5 Benzin",                seg:"sedan",    np:  1090000, dem:0.88, rel:0.63, f:"Benzin", g:0.52, y:[2019,2025], zf:["aku","doseme"], km:210},
 {n:"Jinhai J7 1.5 Benzin",               seg:"sedan",    np:  1140000, dem:0.86, rel:0.62, f:"Benzin", g:0.50, y:[2019,2025], zf:["aku","torpido"], km:210},
 {n:"Amperon A3 Elektrik",                seg:"sedan",    np:  2340000, dem:0.95, rel:0.79, f:"Elektrik", g:1.00, y:[2021,2025], zf:["klima","torpido"], km:250},
 {n:"Orvell E4 Elektrik",                 seg:"sedan",    np:  2680000, dem:0.93, rel:0.77, f:"Elektrik", g:1.00, y:[2020,2025], zf:["aku","doseme"], km:250},
 {n:"Daçya Duste 1.5 Dizel",              seg:"suv",      np:  1480000, dem:1.28, rel:0.73, f:"Dizel", g:0.22, y:[2012,2023], zf:["enjektor","torpido"], km:240},
 {n:"Renolta Kadjor 1.5 Dizel",           seg:"suv",      np:  1980000, dem:1.12, rel:0.71, f:"Dizel", g:0.48, y:[2015,2022], zf:["beyin","debriyaj"], km:230},
 {n:"Hanseul Tucana 1.6 Dizel",           seg:"suv",      np:  2380000, dem:1.24, rel:0.78, f:"Dizel", g:0.66, y:[2015,2023], zf:["otosanziman","enjektor"], km:260},
 {n:"Hanseul Bayon 1.4 Benzin",           seg:"suv",      np:  1920000, dem:1.18, rel:0.82, f:"Benzin", g:0.60, y:[2021,2025], zf:["doseme","camurluk"], km:260},
 {n:"Kiva Sportago 1.6 Dizel",            seg:"suv",      np:  2420000, dem:1.20, rel:0.78, f:"Dizel", g:0.64, y:[2015,2023], zf:["otosanziman","torpido"], km:250},
 {n:"Tanaro Ravo 2.0 Hibrit",             seg:"suv",      np:  3180000, dem:1.30, rel:0.90, f:"Hibrit", g:1.00, y:[2019,2025], zf:["deri","kapiboya"], km:280},
 {n:"Tanaro Korila 1.8 Hibrit",           seg:"suv",      np:  2740000, dem:1.26, rel:0.90, f:"Hibrit", g:1.00, y:[2020,2025], zf:["doseme","kapiboya"], km:280},
 {n:"Nisan Kaskay 1.5 Dizel",             seg:"suv",      np:  2140000, dem:1.14, rel:0.77, f:"Dizel", g:0.56, y:[2014,2022], zf:["debriyaj","multimedya"], km:250},
 {n:"Nisan Jukar 1.5 Dizel",              seg:"suv",      np:  1740000, dem:1.02, rel:0.76, f:"Dizel", g:0.40, y:[2012,2020], zf:["debriyaj","multimedya"], km:240},
 {n:"Volkheim Tiguar 2.0 Dizel",          seg:"suv",      np:  2980000, dem:1.22, rel:0.79, f:"Dizel", g:0.78, y:[2013,2022], zf:["otosanziman","klima"], km:250},
 {n:"Volkheim Tirok 1.5 Benzin",          seg:"suv",      np:  2240000, dem:1.10, rel:0.79, f:"Benzin", g:0.70, y:[2018,2024], zf:["otosanziman","beyin"], km:250},
 {n:"Skava Kodak 2.0 Dizel",              seg:"suv",      np:  2860000, dem:1.14, rel:0.77, f:"Dizel", g:0.80, y:[2017,2024], zf:["otosanziman","beyin"], km:250},
 {n:"Skava Kamik 1.6 Dizel",              seg:"suv",      np:  2120000, dem:1.08, rel:0.78, f:"Dizel", g:0.62, y:[2019,2024], zf:["debriyaj","beyin"], km:250},
 {n:"Oberon Mokano 1.6 Dizel",            seg:"suv",      np:  1860000, dem:0.98, rel:0.70, f:"Dizel", g:0.46, y:[2014,2021], zf:["enjektor","beyin"], km:230},
 {n:"Perrin 3008 1.5 Dizel",              seg:"suv",      np:  2460000, dem:1.06, rel:0.69, f:"Dizel", g:0.72, y:[2016,2023], zf:["turbo","klima"], km:230},
 {n:"Sitronel C5 Aircro 1.5 Dizel",       seg:"suv",      np:  2180000, dem:0.96, rel:0.66, f:"Dizel", g:0.74, y:[2018,2024], zf:["klima","kapiboya"], km:220},
 {n:"Iberra Atego 1.6 Dizel",             seg:"suv",      np:  2260000, dem:1.04, rel:0.72, f:"Dizel", g:0.68, y:[2017,2023], zf:["beyin","otosanziman"], km:240},
 {n:"Fiyat Egeo Cross 1.3 Dizel",         seg:"suv",      np:  1540000, dem:1.10, rel:0.70, f:"Dizel", g:0.34, y:[2020,2025], zf:["klima","camurluk"], km:230},
 {n:"Mitsura Autlander 2.0 Benzin",       seg:"suv",      np:  2540000, dem:0.94, rel:0.76, f:"Benzin", g:0.82, y:[2013,2021], zf:["kapiboya","klima"], km:240},
 {n:"Honzo CRV 1.6 Dizel",                seg:"suv",      np:  2680000, dem:1.06, rel:0.85, f:"Dizel", g:0.55, y:[2015,2021], zf:["doseme","camurluk"], km:270},
 {n:"Sakuda Vitaro 1.4 Benzin",           seg:"suv",      np:  1960000, dem:1.00, rel:0.83, f:"Benzin", g:0.58, y:[2016,2023], zf:["kapiboya","torpido"], km:260},
 {n:"Daewon Trax 1.4 Benzin",             seg:"suv",      np:  1480000, dem:0.88, rel:0.70, f:"Benzin", g:0.52, y:[2014,2020], zf:["triger","multimedya"], km:230},
 {n:"Longwei L5 1.5 Benzin",              seg:"suv",      np:  1620000, dem:0.92, rel:0.63, f:"Benzin", g:0.58, y:[2019,2025], zf:["klima","doseme"], km:210},
 {n:"Chenlu C5 1.5 Benzin",               seg:"suv",      np:  1560000, dem:0.90, rel:0.62, f:"Benzin", g:0.56, y:[2019,2025], zf:["beyin","torpido"], km:210},
 {n:"Kestrel Ridge 2.0 Dizel",            seg:"suv",      np:  3980000, dem:1.04, rel:0.64, f:"Dizel", g:0.88, y:[2014,2022], zf:["klima","turbo"], km:220},
 {n:"Voltaro V5 Elektrik",                seg:"suv",      np:  2980000, dem:0.94, rel:0.77, f:"Elektrik", g:1.00, y:[2021,2025], zf:["multimedya","doseme"], km:250},
 {n:"Fiyat Dobla 1.6 Dizel",              seg:"ticari",   np:  1180000, dem:1.22, rel:0.71, f:"Dizel", g:0.10, y:[2011,2022], zf:["enjektor","debriyaj"], km:170},
 {n:"Fiyat Fiorina 1.3 Dizel",            seg:"ticari",   np:   980000, dem:1.16, rel:0.70, f:"Dizel", g:0.08, y:[2010,2021], zf:["aku","altsac"], km:170},
 {n:"Renolta Kango 1.5 Dizel",            seg:"ticari",   np:  1120000, dem:1.20, rel:0.72, f:"Dizel", g:0.10, y:[2011,2022], zf:["aku","debriyaj"], km:170},
 {n:"Renolta Trafiko 1.6 Dizel",          seg:"ticari",   np:  1740000, dem:1.10, rel:0.70, f:"Dizel", g:0.14, y:[2012,2022], zf:["klima","debriyaj"], km:170},
 {n:"Volkheim Kaddi 1.6 Dizel",           seg:"ticari",   np:  1420000, dem:1.12, rel:0.78, f:"Dizel", g:0.20, y:[2011,2021], zf:["debriyaj","aku"], km:180},
 {n:"Volkheim Transpo 2.0 Dizel",         seg:"ticari",   np:  2280000, dem:1.08, rel:0.78, f:"Dizel", g:0.26, y:[2012,2022], zf:["debriyaj","aku"], km:180},
 {n:"Perrin Partnero 1.6 Dizel",          seg:"ticari",   np:  1160000, dem:1.06, rel:0.69, f:"Dizel", g:0.10, y:[2011,2021], zf:["enjektor","aku"], km:160},
 {n:"Sitronel Berlingo 1.6 Dizel",        seg:"ticari",   np:  1140000, dem:1.04, rel:0.66, f:"Dizel", g:0.10, y:[2011,2021], zf:["aku","altsac"], km:160},
 {n:"Oberon Kombo 1.5 Dizel",             seg:"ticari",   np:  1200000, dem:1.00, rel:0.70, f:"Dizel", g:0.12, y:[2013,2022], zf:["enjektor","multimedya"], km:170},
 {n:"Daçya Dokkar 1.5 Dizel",             seg:"ticari",   np:  1080000, dem:1.14, rel:0.73, f:"Dizel", g:0.08, y:[2013,2022], zf:["doseme","camurluk"], km:170},
 {n:"Hessler Vitano 2.0 Dizel",           seg:"ticari",   np:  2640000, dem:1.06, rel:0.77, f:"Dizel", g:0.40, y:[2013,2022], zf:["enjektor","klima"], km:180},
 {n:"Hessler Sprinto 2.1 Dizel",          seg:"ticari",   np:  2980000, dem:1.02, rel:0.78, f:"Dizel", g:0.22, y:[2012,2022], zf:["turbo","klima"], km:180},
 {n:"Steinmann Daylo 2.3 Dizel",          seg:"ticari",   np:  1960000, dem:0.96, rel:0.72, f:"Dizel", g:0.10, y:[2011,2021], zf:["enjektor","altsac"], km:170},
 {n:"Fordan Transito 2.0 Dizel",          seg:"ticari",   np:  2240000, dem:1.14, rel:0.73, f:"Dizel", g:0.24, y:[2012,2022], zf:["debriyaj","enjektor"], km:170},
 {n:"Fordan Kurye 1.5 Dizel",             seg:"ticari",   np:  1240000, dem:1.08, rel:0.74, f:"Dizel", g:0.12, y:[2014,2023], zf:["debriyaj","enjektor"], km:170},
 {n:"Tanaro Proago 1.5 Dizel",            seg:"ticari",   np:  1320000, dem:1.04, rel:0.86, f:"Dizel", g:0.16, y:[2015,2023], zf:["torpido","camurluk"], km:190},
 {n:"Nisan NV200 1.5 Dizel",              seg:"ticari",   np:  1180000, dem:0.98, rel:0.76, f:"Dizel", g:0.10, y:[2012,2021], zf:["debriyaj","multimedya"], km:180},
 {n:"Bozkurt Ova Kombi 1.6 Dizel",        seg:"ticari",   np:  1360000, dem:1.00, rel:0.70, f:"Dizel", g:0.14, y:[2013,2022], zf:["camurluk","torpido"], km:170},
 {n:"Tunca Yük 2.0 Dizel",                seg:"ticari",   np:  1580000, dem:0.98, rel:0.73, f:"Dizel", g:0.12, y:[2014,2023], zf:["kapiboya","enjektor"], km:170},
 {n:"Zavod Okta 1.9 Dizel",               seg:"ticari",   np:   860000, dem:0.82, rel:0.58, f:"Dizel", g:0.04, y:[2009,2017], zf:["altsac","enjektor"], km:150},
 {n:"Romira Dastan 1.5 Dizel",            seg:"ticari",   np:   920000, dem:0.86, rel:0.60, f:"Dizel", g:0.06, y:[2011,2019], zf:["altsac","aku"], km:150},
 {n:"Longwei Kargo 1.6 Dizel",            seg:"ticari",   np:  1040000, dem:0.88, rel:0.62, f:"Dizel", g:0.14, y:[2018,2024], zf:["aku","doseme"], km:150},
 {n:"Hessler S400 3.0 Dizel",             seg:"lux",      np:  9800000, dem:1.06, rel:0.76, f:"Dizel", g:1.00, y:[2014,2022], zf:["turbo","klima"], km:210},
 {n:"Bavera 730 3.0 Dizel",               seg:"lux",      np: 10400000, dem:1.04, rel:0.73, f:"Dizel", g:1.00, y:[2014,2022], zf:["turbo","otosanziman"], km:200},
 {n:"Aureon A8 3.0 Dizel",                seg:"lux",      np:  9600000, dem:1.00, rel:0.74, f:"Dizel", g:1.00, y:[2013,2021], zf:["turbo","otosanziman"], km:210},
 {n:"Bavera X5 3.0 Dizel",                seg:"lux",      np:  7800000, dem:1.14, rel:0.73, f:"Dizel", g:1.00, y:[2014,2022], zf:["turbo","otosanziman"], km:200},
 {n:"Hessler GLE 2.9 Dizel",              seg:"lux",      np:  8200000, dem:1.12, rel:0.76, f:"Dizel", g:1.00, y:[2015,2023], zf:["turbo","beyin"], km:210},
 {n:"Vernon Highland 3.0 Dizel",          seg:"lux",      np: 16400000, dem:1.08, rel:0.58, f:"Dizel", g:1.00, y:[2013,2021], zf:["suspansiyon","beyin"], km:170},
 {n:"Vernon Sporta 3.0 Dizel",            seg:"lux",      np: 10800000, dem:1.06, rel:0.58, f:"Dizel", g:1.00, y:[2014,2022], zf:["multimedya","turbo"], km:170},
 {n:"Halloway Warden 3.0 Dizel",          seg:"suv",      np:  9200000, dem:0.98, rel:0.60, f:"Dizel", g:1.00, y:[2016,2023], zf:["klima","otosanziman"], km:210},
 {n:"Nordahl XC90 2.0 Hibrit",            seg:"lux",      np:  7400000, dem:1.02, rel:0.81, f:"Hibrit", g:1.00, y:[2017,2024], zf:["multimedya","aku"], km:220},
 {n:"Calvetti Stelvo 2.2 Dizel",          seg:"lux",      np:  6200000, dem:0.96, rel:0.64, f:"Dizel", g:1.00, y:[2018,2024], zf:["multimedya","turbo"], km:190},
 {n:"Brickley Contin 3.0 Benzin",         seg:"lux",      np: 26800000, dem:0.82, rel:0.56, f:"Benzin", g:1.00, y:[2016,2023], zf:["yagkacak","suspansiyon"], km:170},
 {n:"Amperon S Elektrik",                 seg:"lux",      np:  8600000, dem:0.95, rel:0.78, f:"Elektrik", g:1.00, y:[2021,2025], zf:["multimedya","deri"], km:210},
 {n:"Bozkurt Yaman 1.6",                  seg:"klasik",   np:   420000, dem:0.92, rel:0.50, f:"Benzin", g:0.00, y:[1978,1994], zf:["altsac","doseme"], km:0, cl:1},
 {n:"Serhat Efe 1.3",                     seg:"klasik",   np:   310000, dem:0.88, rel:0.48, f:"Benzin", g:0.00, y:[1975,1990], zf:["altsac","klima"], km:0, cl:1},
 {n:"Tunca Murat 1.3",                    seg:"klasik",   np:   268000, dem:0.96, rel:0.46, f:"Benzin", g:0.00, y:[1972,1988], zf:["altsac","triger"], km:0, cl:1},
 {n:"Volkheim Böcek 1.2",                 seg:"klasik",   np:   640000, dem:1.10, rel:0.44, f:"Benzin", g:0.00, y:[1965,1979], zf:["altsac","yagkacak"], km:0, cl:1},
 {n:"Renolta Toros 1.4",                  seg:"klasik",   np:   295000, dem:1.04, rel:0.47, f:"Benzin", g:0.00, y:[1976,1992], zf:["aku","debriyaj"], km:0, cl:1},
 {n:"Fiyat Şahan 1.6",                    seg:"klasik",   np:   340000, dem:1.10, rel:0.49, f:"Benzin", g:0.00, y:[1984,2002], zf:["aku","altsac"], km:0, cl:1},
 {n:"Hessler 190 2.0",                    seg:"klasik",   np:   980000, dem:1.06, rel:0.58, f:"Benzin", g:0.00, y:[1983,1993], zf:["altsac","yagkacak"], km:0, ky:"zincir", cl:1},
 {n:"Bavera E30 2.0",                     seg:"klasik",   np:  1240000, dem:1.14, rel:0.55, f:"Benzin", g:0.00, y:[1982,1991], zf:["triger","yagkacak"], km:0, cl:1},
 {n:"Perrin 205 1.4",                     seg:"klasik",   np:   380000, dem:0.94, rel:0.46, f:"Benzin", g:0.00, y:[1983,1994], zf:["triger","aku"], km:0, cl:1},
 {n:"Vernon Mk1 3.5",                     seg:"klasik",   np:  1480000, dem:0.90, rel:0.40, f:"Benzin", g:0.00, y:[1972,1985], zf:["altsac","aku"], km:0, ky:"zincir", cl:1}
];

const COLORS=[
 {n:"Beyaz",m:1.02},{n:"Siyah",m:1.02},{n:"Gri",m:1.01},{n:"Gümüş",m:1.00},
 {n:"Füme",m:1.01},{n:"Lacivert",m:1.00},{n:"Mavi",m:0.99},{n:"Kırmızı",m:0.97},
 {n:"Bordo",m:0.96},{n:"Yeşil",m:0.95},{n:"Kahverengi",m:0.95}
];

/* ============ zorluk ============
   İki kademe var, üç değil: her kademe ayrı bir denge koşusu demek ve üç
   kademenin ikisi hep kötü ayarlanmış kalıyor. "Gerçekçi" modda acemi
   toleransı yok, tamir pahalı, satıcı sert, alıcı cimri — karşılığında
   deneyim ve lig puanı daha hızlı birikir. Kayıt başladıktan sonra
   değişmez: ortasında zorluk düşürmek ilerlemenin anlamını siliyor. */
const ZORLUKLAR=[
 {k:"normal", n:"Normal", d:"İlk satışına kadar alıcı akışı yüksek, bütçene uygun ilan garantili.",
  not:"Önerilen"},
 {k:"gercek", n:"Gerçekçi", d:"Acemi toleransı yok. Tamirler %18 pahalı, satıcı taban fiyatını az kırar, alıcı daha cimri.",
  not:"Deneyim ve lig puanı %25 fazla"}
];
let ZOR=()=>"normal";
const zorGercek=()=>ZOR()==="gercek";
const zorXp=()=>zorGercek()?1.25:1;

const COMPKEYS=["motor","sanziman","kaporta","ic","elektrik"];
const COMPLBL={motor:"Motor",sanziman:"Şanzıman",kaporta:"Kaporta",ic:"İç mekân",elektrik:"Elektrik"};
const COMPW={motor:.30,sanziman:.20,kaporta:.20,ic:.13,elektrik:.17};

/* ============ arıza kataloğu ============ */
const FAULTS=[
 {k:"triger", n:"Triger seti değişmeli",   c:"motor",     cost:18000,  gain:16, vis:.10, dm:1.2},
 {k:"yagkacak", n:"Yağ kaçağı",              c:"motor",     cost:14000,  gain:13, vis:.30, dm:1.3},
 {k:"enjektor", n:"Enjektör bakımı gerekli", c:"motor",     cost:32000,  gain:20, vis:.10, dm:1.0},
 {k:"turbo", n:"Turbo revizyonu",         c:"motor",     cost:58000,  gain:30, vis:.08, dm:0.75},
 {k:"motorrev", n:"Motor revizyonu şart",    c:"motor",     cost:145000, gain:48, vis:.15, dm:0.6},
 {k:"debriyaj", n:"Debriyaj seti bitmiş",    c:"sanziman",  cost:30000,  gain:24, vis:.20, dm:1.15},
 {k:"otosanziman", n:"Otomatik şanzıman bakımı",c:"sanziman",  cost:17000,  gain:16, vis:.12, dm:1.1},
 {k:"sanzimanrev", n:"Şanzıman revizyonu",      c:"sanziman",  cost:110000, gain:46, vis:.10, dm:0.6},
 {k:"kapiboya", n:"Kapı boyası gerekli",     c:"kaporta",   cost:9500,   gain:13, vis:.75, dm:1.45},
 {k:"camurluk", n:"Çamurluk düzeltme + boya",c:"kaporta",   cost:11000,  gain:15, vis:.72, dm:1.4},
 {k:"altsac", n:"Alt sac pas onarımı",     c:"kaporta",   cost:42000,  gain:23, vis:.35, dm:0.85},
 {k:"kompleboya", n:"Komple boya lazım",       c:"kaporta",   cost:95000,  gain:40, vis:.85, dm:0.8},
 {k:"doseme", n:"Döşeme yıpranmış",        c:"ic",        cost:32000,  gain:24, vis:.80, dm:1.4},
 {k:"torpido", n:"Torpido çatlağı",         c:"ic",        cost:13000,  gain:11, vis:.78, dm:1.5},
 {k:"deri", n:"Direksiyon/vites deri",   c:"ic",        cost:9000,   gain:9,  vis:.70, dm:1.55},
 {k:"aku", n:"Akü ölmüş",               c:"elektrik",  cost:7500,   gain:10, vis:.30, dm:1.35},
 {k:"klima", n:"Klima soğutmuyor",        c:"elektrik",  cost:24000,  gain:22, vis:.25, dm:1.1},
 {k:"multimedya", n:"Multimedya arızalı",      c:"elektrik",  cost:19000,  gain:14, vis:.45, dm:1.2},
 {k:"beyin", n:"Motor beyni arızası",     c:"elektrik",  cost:36000,  gain:28, vis:.08, dm:0.85},
 // yalnız imza arızası (v3 kararı 9): yalnız zf listesinde olan modelde çıkar
 {k:"zincir", n:"Zincir seti / gergi değişmeli", c:"motor", cost:38000, gain:24, vis:.06, dm:1.0, imza:1},
 {k:"suspansiyon", n:"Hava süspansiyonu arızalı", c:"elektrik", cost:65000, gain:25, vis:.30, dm:1.0, imza:1},
];

/* ============ parça kalitesi ============
   Tamir artık "yaptır / yaptırma" değil, "hangi parçayla". Ucuz parça kısa
   vadede kârı büyütür ama iki bedeli var: aracın GERÇEK değerinden düşer
   (ekspertize giden ya da dürüst ilanı okuyan alıcı bunu fiyatlar) ve
   birkaç gün içinde arıza geri gelebilir. İlk bakışta kimse fark etmez —
   gizlemek cazip, yakalanmak pahalı. risk: ~8 günde geri gelme olasılığı. */
const PARCA={
  orijinal: {n:"Orijinal",   d:"Garantili, değer kaybı yok",            kat:1.00, kayip:0,   risk:0},
  yansanayi:{n:"Yan sanayi", d:"%32 ucuz, ekspertizde fark edilir",     kat:0.68, kayip:.12, risk:.06},
  cikma:    {n:"&Ccedil;ıkma",      d:"Yarı fiyat, geri gelme riski y&uuml;ksek",   kat:0.45, kayip:.26, risk:.20}
};

/* ============ satıcı arketipleri ============ */
/* v3 kararı 1: ilan şişirmesi (galerici ×1,14) ve geniş taban, ilanın
   %16-27 altına almayı olağan yapıyordu; gerçekte %5-12 (galeri sahibi).
   İlan çarpanı indi, taban yükseldi; kozun payı kozTavan ile sınırlı. */
const SELLERS=[
 {k:"acil",   n:"Acil nakit lazım",  d:"İhtiyaçtan satılık. Pazarlık payı geniş.",  ask:0.98, res:0.86, pat:4, sert:.20, w:12, savvy:.30, motiv:.80, ego:.3,  pesin:.055, kozTavan:0.14},
 {k:"acemi",  n:"Acemi satıcı",      d:"Piyasayı bilmiyor. Fiyatı rastgele koymuş.",ask:0.95, res:0.88, pat:5, sert:.18, w:11, savvy:.12, motiv:.62, ego:.5,  pesin:.045, kozTavan:0.12},
 {k:"filo",   n:"Filo çıkışı",       d:"Şirket aracı. Bakımlı ama km yüksek.",      ask:1.02, res:0.89, pat:3, sert:.50, w:16, savvy:.55, motiv:.50, ego:.15, pesin:.030, kozTavan:0.09},
 {k:"duygusal",n:"Duygusal sahibi",  d:"Arabasına kıyamıyor, fiyatı da öyle.",      ask:1.08, res:0.93, pat:3, sert:.72, w:18, savvy:.35, motiv:.30, ego:1.0, pesin:.012, kozTavan:0.08},
 {k:"galerici",n:"Galerici",         d:"İşini bilir, fiyatı ezberlemiş.",           ask:1.08, res:0.95, pat:3, sert:.88, w:22, savvy:.88, motiv:.25, ego:-1,  pesin:.015, kozTavan:0.06},
 {k:"koleksiyoncu",n:"Koleksiyoncu", d:"Değerini biliyor, acelesi yok.",            ask:1.08, res:0.94, pat:2, sert:.80, w:12, savvy:.80, motiv:.20, ego:.9,  pesin:.010, kozTavan:0.06}
];

/* ============ blöf iddiaları ============ */
const BLUFFS=[
 {t:"Motordan tıkırtı geliyor, ustam dinledi",      comp:"motor",    cut:.060},
 {t:"Debriyaj bitmiş, kavrama kaçırıyor",           comp:"sanziman", cut:.055},
 {t:"Sağ arka kapı boyalı, mikronla ölçtüm",        comp:"kaporta",  cut:.050},
 {t:"Klima gaz kaçırıyor, soğutmuyor",              comp:"elektrik", cut:.040},
 {t:"Döşeme yenilenmiş, altında ne var belli değil",comp:"ic",       cut:.035},
 {t:"Km'de oynama var, servis kayıtları tutmuyor",  comp:"__km",     cut:.075},
 {t:"Tramer sorgusu yaptırdım, temiz değilmiş",     comp:"__tramer", cut:.070}
];
function bluffIsTrue(car,b){
  if(b.comp==="__km") return !!car.kmOynama;
  if(b.comp==="__tramer") return car.tramer>0;
  return car.faults.some(f=>!f.fixed && f.comp===b.comp);
}
/** Blöfü satıcı yakalar mı? Doğru çıkan iddiayı yalanlamak zor. */
function resolveBluff(car, b, mood){
  const s=car.seller;
  const gercek=bluffIsTrue(car,b);
  const detect=clamp(s.savvy*(gercek?.30:1)*(1-(mood-50)/400), .02, .95);
  return {caught: Math.random()<detect, gercek};
}

const CLAIMS_TRUE=["Bakımları yetkili serviste","Tek elden","Garaj arabası","Hiç çarpılmadı","Kışlık lastikleri de var","Sigara içilmedi"];
const CLAIMS_LIE=["Hatasız boyasız","Tramer kaydı yok","Motoru sıfır gibi","Km'sine bakmayın, yeni gibi","Kadın sürücüden"];

/* ============ araç üretimi ============ */
let _uid=1;
/* İl kodlu Türk plakası (1.3 test grubu, V3). Eskiden plakalar ABD biçimindeydi
   ("2NDL305", üstünde CALIFORNIA): oyunun en çok görünen yüzeyi Türkiye
   değildi. İl, nüfusa kabaca orantılı ağırlıkla; harf grubu Türk plakasında
   kullanılmayan Ç, Ğ, İ, Ö, Ş, Ü, Q, W, X ve karışan I/O dışında. Rastgele bir
   plakanın gerçek bir araca denk gelmesi mümkün; oyun içi, kişiyle eşleşmez. */
const IL_PLAKA=[[34,"İstanbul",18],[6,"Ankara",7],[35,"İzmir",5],[16,"Bursa",4],[7,"Antalya",3],
  [41,"Kocaeli",3],[1,"Adana",3],[42,"Konya",3],[27,"Gaziantep",3],[33,"Mersin",2],[38,"Kayseri",2],
  [26,"Eskişehir",1.5],[55,"Samsun",1.5],[61,"Trabzon",1],[21,"Diyarbakır",2],[20,"Denizli",1],
  [54,"Sakarya",1],[59,"Tekirdağ",1],[10,"Balıkesir",1],[45,"Manisa",1.5],[31,"Hatay",1.5],[44,"Malatya",1]];
function ilCek(){
  const top=IL_PLAKA.reduce((a,x)=>a+x[2],0); let r=Math.random()*top;
  for(const x of IL_PLAKA){ r-=x[2]; if(r<=0) return x; }
  return IL_PLAKA[0];
}
function plakaIl(p){ const k=parseInt(String(p||""),10); const x=IL_PLAKA.find(i=>i[0]===k); return x?x[1]:null; }
function plate(il){
  const L="ABCDEFGHJKLMNPRSTUVYZ";
  const h=()=>L[ri(0,L.length-1)];
  const kod=String((il||ilCek())[0]).padStart(2,"0");
  const r=ri(0,2);
  if(r===0) return `${kod} ${h()} ${ri(1000,99999)}`;
  if(r===1) return `${kod} ${h()}${h()} ${ri(100,9999)}`;
  return `${kod} ${h()}${h()}${h()} ${ri(10,999)}`;
}

function genCar(opt={}){
  const m = opt.model || pick(opt.pool || MODELS);
  const year = ri(m.y[0], m.y[1]);
  const age = Math.max(1, YEAR-year);
  const kmBase = m.cl ? rnd(3500,18000)*Math.min(age,25) : rnd(8000,22000)*age;
  let km = (opt.km!=null) ? opt.km
         : Math.round(clamp(kmBase*rnd(.7,1.35), 3000, 680000)/500)*500;
  const color = pick(COLORS);
  // Yakıt artık modelin kendi bilgisi: adında "1.6 Dizel" yazan araç
  // benzinli çıkmıyor. Vites de modele göre — ticari araç çoğunlukla
  // manuel, lüks sedan neredeyse hep otomatik.
  const gear = m.cl ? "Manuel" : (chance(m.g!=null?m.g:.45) ? "Otomatik" : "Manuel");
  const fuel = m.cl ? "Benzin" : (m.f || "Benzin");

  // aşınma
  const wear={};
  for(const k of COMPKEYS) wear[k] = clamp((age*1.35 + km/17000) * (1.6-m.rel) * rnd(.75,1.3), 0, 55);
  /* Klasikte yaş formülü 40 yılda tavana çarpıyor, her organ 45/45/45 ve
     arızasız çıkıyordu (v3 testi, araba tutkunu): orijinal mi, restore mu,
     çürük mü keşfi ölüyordu. Klasiğin bir "hâli" var; organlar ona göre
     dağılır ve organlar arası fark büyüktür. */
  let klasikHal=null;
  if(m.cl){
    klasikHal=pick(["orijinal","orijinal","restore","yorgun","yorgun","proje"]);
    const bant={orijinal:[12,32], restore:[6,22], yorgun:[30,58], proje:[52,78]}[klasikHal];
    for(const k of COMPKEYS) wear[k]=Math.round(rnd(bant[0],bant[1]));
  }

  // arızalar — en fazla 5, yaş/km/güvenilirliğe göre
  const faults=[];
  const maxF = clamp(Math.round(1 + age/5 + km/180000), 0, 5);
  let nF = ri(0, maxF) + (chance(clamp((1.5-m.rel)*.35,0,.4))?1:0);
  if(klasikHal) nF = klasikHal==="restore" ? ri(0,1) : Math.max(klasikHal==="proje"?3:1, Math.min(nF, klasikHal==="orijinal"?2:4));
  /* Havuz artık düz değil: modelin imza arızaları ağırlıklı çekiliyor.
     Eşik km'yi geçmiş araçta ağırlık iyice artıyor — "bu modeli 180
     binden sonra alma" bilgisi böyle doğuyor. Eşiğin altında imza arıza
     yine mümkün ama seyrek: araç yaşlanmadan karakterini göstermiyor. */
  const esik = (m.km||200)*1000;
  const gecti = esik<=0 || km>=esik;
  const imza = new Set(m.zf||[]);
  /* Pahalı arıza seyrek kalsın diye eskiden ikinci bir kör çekiliş vardı;
     o kör çekiliş ağırlığı yok ediyordu. Artık frenin kendisi bir ağırlık
     çarpanı: imza arıza bundan muaf, araç kendi karakterini gösteriyor. */
  const agirlik=(f)=>{
    if(imza.has(f.k)) return gecti ? 9 : 2.6;
    return f.cost>40000 ? .30 : (f.cost>1500 ? .55 : 1);
  };
  /* Arıza aracın donanımına uymalı: manuel vitesli araçta "otomatik
     şanzıman bakımı", 1995 öncesi karbüratörlü araçta "motor beyni" ya da
     "enjektör" çıkıyordu (oyun testi, 1983 Şahan). */
  /* v3 testi: 4000 araçlık simülasyonda elektrikli araç arızalarının %31'i
     imkânsızdı (triger, enjektör, debriyaj…), otomatiklerin %13'ünde
     "debriyaj seti bitmiş" çıkıyordu. */
  const ev=fuel==="Elektrik", hibrit=fuel==="Hibrit";
  const EV_YOK=["triger","yagkacak","enjektor","turbo","motorrev","debriyaj","otosanziman","sanzimanrev"];
  const uymaz=(f)=> (f.imza && !imza.has(f.k))
                 || (f.k==="triger" && m.ky==="zincir")     // zincirli motorda kayış yok
                 || (f.k==="otosanziman" && gear!=="Otomatik")
                 || (f.k==="debriyaj" && (gear==="Otomatik" || hibrit))
                 || (ev && EV_YOK.includes(f.k))
                 || (hibrit && (f.k==="enjektor"||f.k==="turbo"))
                 || (year<1995 && (f.k==="beyin"||f.k==="enjektor"||f.k==="multimedya"||f.k==="turbo"));
  const pool=FAULTS.filter(f=>!uymaz(f));
  for(let i=0;i<Math.min(nF,5);i++){
    if(!pool.length) break;
    let top=0; for(const f of pool) top+=agirlik(f);
    let r=Math.random()*top, idx=pool.length-1;
    for(let j=0;j<pool.length;j++){ r-=agirlik(pool[j]); if(r<=0){ idx=j; break; } }
    const f=pool[idx];
    pool.splice(idx,1);
    if(!f) break;
    /* Aynı şanzıman iki kez arızalanmaz: "Şanzıman revizyonu" ile "Otomatik
       şanzıman bakımı" aynı raporda çıkıyordu (v3 testi). Revizyon bakımı kapsar. */
    if(f.k==="sanzimanrev"||f.k==="otosanziman")
      for(let j=pool.length-1;j>=0;j--) if(pool[j].k==="sanzimanrev"||pool[j].k==="otosanziman") pool.splice(j,1);
    const cm=clamp(.5 + baseValue(m,age)/3000000, .5, 1.5);
    faults.push({id:_uid++, k:f.k, n:f.n, comp:f.c, cost:Math.round(f.cost*cm*rnd(.85,1.2)/25)*25,
                 gain:f.gain, dm:f.dm, visible:chance(f.vis), fixed:false});
  }

  // hasar geçmişi
  const tramerRoll = chance(clamp(.16+age*.028,0,.55));
  const rawBase = baseValue(m, age);
  const tramer = tramerRoll ? Math.round(rawBase*(chance(.25)?rnd(.10,.22):rnd(.015,.09))/1000)*1000 : 0;
  const degisen = tramer>rawBase*.12 ? ri(1,5) : (tramer>0?ri(0,2):0);
  const boyali = tramer>0 ? ri(1,7) : (chance(.35)?ri(1,3):0);
  const kmOynama = !m.cl && age>7 && chance(.16);

  // hikâyeli araç
  let story=null;
  if(!opt.auction && chance(.07)){
    const st=pick(STORIES);
    story=st.k;
    km=Math.round(clamp(km*st.km,2000,820000)/500)*500;
    for(const k of COMPKEYS) wear[k]=clamp(wear[k]*st.wear,0,58);
    if(st.riskli && st.k==="sel"){
      // görünmeyen elektrik ve motor hasarı
      for(const f of faults) f.visible=false;
    }
  }

  const claims=[];
  const nTrue=ri(1,2);
  for(let i=0;i<nTrue;i++){const c=pick(CLAIMS_TRUE); if(!claims.includes(c))claims.push(c);}
  // "Km'sine bakmayın" yalnız yaşına göre gerçekten yüksek km'li araçta söylenir
  // (55.000 km'lik araçta da çıkıyordu)
  const kmYuksek = km > Math.max(1,YEAR-year)*17000;
  if(chance(.55)){const c=pick(CLAIMS_LIE.filter(x=>kmYuksek || !/Km/.test(x))); if(!claims.includes(c))claims.push(c);}

  const seller = opt.auction ? null : weightedSeller(m, year);

  const car={
    id:_uid++, model:m, year, km, plate:plate(), color:color.n, colorM:color.m,
    gear, fuel, wear, faults, klasikHal, tramer, degisen, boyali, kmOynama, claims, story,
    seller, inspected:false, owned:false, listPrice:null, disclosed:false,
    daysListed:0, boughtFor:0, spent:0, cosmetic:false, auction:!!opt.auction,
    listedDay:0, leadsSeen:0
  };
  const tv = valueOf(car,false);
  if(seller){
    car.ask = roundTo(tv*seller.ask*rnd(.96,1.06), 2500);
    car.reserve = Math.round(tv*seller.res*rnd(.97,1.04));
    car.pat = seller.pat;
  }
  return car;
}
/* ================= OTO PAZARI SABAHI (1.4, test grubu V1) =================
   Haftada bir (7, 14, 21… gün) açık oto pazarı kurulur: pazar sahası alçak
   sabah güneşinde ve pusta açılır, çay tezgâhı ve kalabalık gelir, ilan
   sayısı artar. Türkiye'de ikinci elin en tanıdık sahnesi. */
function pazarGunu(gun){ return ((gun||(typeof S!=="undefined"&&S&&S.day)||1)%7)===0; }
/** Galerinin büyüklük kademesi (V9): saha dekoru ve bina bununla değişir. */
function galeriKademe(){
  if(typeof S==="undefined" || !S) return 1;
  const sv=(typeof level==="function")?level():1;
  if((S.prestij||0)>0 || sv>=6 || (S.slots||3)>=8) return 2;
  if(sv>=3 || (S.slots||3)>=5) return 1;
  return 0;
}

/* ================= KAPORTA ŞEMASI (1.4, test grubu V6) =================
   Türkiye'de ikinci el aracın kimlik kâğıdı ekspertiz şeması: 13 parça,
   orijinal / lokal boyalı / boyalı / değişen. Eskiden yalnız "boyalı 3,
   değişen 1" sayısı vardı ve 3B'deki boyalı yamalar kendi kör çekilişiyle
   seçiliyordu. Şema araç kimliğinden tohumla çıkar (kayda yazılmaz, hep
   aynı): 2B rapor, 3B yamalar ve tarama aynı paneli gösterir. */
const SEMA_PANEL=[["onTampon","Ön tampon"],["kaput","Kaput"],["tavan","Tavan"],["bagaj","Bagaj"],["arkaTampon","Arka tampon"],
  ["sol0","Sol ön çamurluk"],["sol1","Sol ön kapı"],["sol2","Sol arka kapı"],["sol3","Sol arka çamurluk"],
  ["sag0","Sağ ön çamurluk"],["sag1","Sağ ön kapı"],["sag2","Sağ arka kapı"],["sag3","Sağ arka çamurluk"]];
function ekspSema(c){
  let h=(((c&&c.id)||1)*2654435761)>>>0;
  const r=()=>{ h^=h<<13; h>>>=0; h^=h>>>17; h^=h<<5; h>>>=0; return h/4294967296; };
  // önce yan paneller ve kaput/bagaj (3B'de yaması olanlar), tamponlar ve tavan sonra
  const on=["kaput","bagaj","sol0","sol1","sol2","sol3","sag0","sag1","sag2","sag3"];
  for(let i=on.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [on[i],on[j]]=[on[j],on[i]]; }
  const sira=[...on,"onTampon","arkaTampon","tavan"];
  const out={}; for(const [k] of SEMA_PANEL) out[k]="orijinal";
  const deg=Math.min(sira.length, (c&&c.degisen)||0);
  const boy=Math.min(sira.length-deg, (c&&c.boyali)||0);
  for(let i=0;i<deg;i++) out[sira[i]]="degisen";
  for(let i=deg;i<deg+boy;i++) out[sira[i]] = r()<.3 ? "lokal" : "boyali";
  return out;
}

/* ================= NADİR İLAN (1.3, procedural-gen) =================
   Pazar her gün aynı dokudaydı: ilanların hepsi piyasanın %90–110'unda.
   Gerçek galericiyi sabah erkenden sahibinden'e baktıran şey arada bir
   düşen gerçek kelepir. Ağırlıklı tablo; kelepir aynı anda en çok bir
   tane, iki gün içinde biri kapar. Üretilen kelepir oyuncuya verilmeden
   doğrulanır: gizli ağır arıza ya da büyük hasar varsa "kelepir" değil,
   tuzaktır — o zaman yalnız "uygun" fiyatlı sıradan ilana iner. */
const NADIRLIK=[
  {k:"normal",  w:91},
  {k:"uygun",   w:6,  ask:[.86,.92]},
  {k:"kelepir", w:3,  ask:[.70,.78]}
];
const KELEPIR_NEDEN=[
  "Yurt dışına taşınıyor, hafta sonuna kadar gitmesi lazım",
  "Miras kaldı, kardeşler bir an önce bölüşmek istiyor",
  "Borcu sıkıştı, bugün nakit lazım",
  "Şirket aracı yeniledi, eskisini hemen çıkarıyor",
  "Boşanma: araçtan bir an önce kurtulmak istiyor",
  "Yaşlı sahibi ehliyetini bıraktı, oğlu satıyor"
];
function nadirlikCek(rng){
  const r=(rng||Math.random)()*NADIRLIK.reduce((a,x)=>a+x.w,0);
  let t=0; for(const x of NADIRLIK){ t+=x.w; if(r<t) return x; }
  return NADIRLIK[0];
}
/** Kelepir olmaya uygun mu: gerçek değerine göre gizli kusur ve hasar küçük. */
function kelepirSaglam(c){
  const tv=valueOf(c,false);
  const gizli=(c.faults||[]).filter(f=>!f.visible).reduce((a,f)=>a+f.cost,0);
  return tv>=120000 && gizli<tv*.08 && c.tramer<tv*.05 && c.degisen<=1 && !c.kmOynama && c.story!=="sel";
}
/** İlanı tablodan bir kademeye taşı. kelepirVar: pazarda zaten biri var mı. */
function nadirlikUygula(c, kelepirVar, rng){
  if(!c.seller || !c.ask) return c;
  let n=nadirlikCek(rng);
  if(n.k==="kelepir" && (kelepirVar || !kelepirSaglam(c))) n=NADIRLIK[1];
  if(n.k==="normal") return c;
  const tv=valueOf(c,false), k=rnd(n.ask[0], n.ask[1]);
  c.ask=roundTo(tv*k, 2500);
  c.reserve=Math.min(c.reserve, Math.round(c.ask*rnd(.95,.98)));
  if(n.k==="kelepir"){ c.kelepir=true; c.kelepirNeden=pick(KELEPIR_NEDEN); }
  return c;
}
/* İlan başına tablo tek başına yetmiyordu: pazara günde ortalama bir
   yeni ilan giriyor, doğrulamadan geçen kelepir ilanların %1,5'i — 120
   günlük simülasyonda oyuncu yalnız 2 gün kelepir gördü. Günlük zar:
   sağlam ve kasaya uygun bir aday bulunana dek en çok 60 araç denenir. */
const KELEPIR_GUN=.12;
function gununKelepiri(rng){
  const R=rng||Math.random;
  if(R()>=KELEPIR_GUN) return null;
  for(let i=0;i<60;i++){
    const c=genCar();
    if(!c.seller || !kelepirSaglam(c)) continue;
    const tv=valueOf(c,false), k=NADIRLIK[2].ask;
    c.ask=roundTo(tv*rnd(k[0],k[1]), 2500);
    /* Oyuncunun ulaşamayacağı kelepir tantalizm: 1.3 testinde 1. gün kasa
       ₺2,6M iken ₺3,68M'lik kelepir düştü. Senetle alınabilecek kadarı (×1,4). */
    if(typeof S!=="undefined" && S && S.cash && c.ask>Math.max(300000, S.cash*1.4)) continue;
    c.reserve=Math.min(c.reserve, Math.round(c.ask*rnd(.95,.98)));
    c.kelepir=true; c.kelepirNeden=pick(KELEPIR_NEDEN);
    return c;
  }
  return null;
}
/* Satıcı modele uysun (v3 kararı 9, M4): 1985 E30 "filo çıkışı", 2024
   araç "koleksiyoncu" çıkıyordu. Ağırlık = tablo w × model/yaş çarpanı. */
function saticiCarpan(k, m, year){
  if(!m) return 1;
  const yas=YEAR-(year||YEAR);
  let x=1;
  if(m.seg==="klasik") x*=({koleksiyoncu:4, duygusal:3, galerici:1, acil:.7, acemi:1, filo:0})[k];
  else if(m.seg==="ticari") x*=({filo:3, acil:1.5, koleksiyoncu:0})[k]??1;
  else if(m.seg==="lux") x*=({galerici:2, acil:1.5})[k]??1;
  if(m.seg!=="klasik" && yas<5) x*=({galerici:2, filo:1.5, koleksiyoncu:.2})[k]??1;
  return x;
}
function weightedSeller(m, year){
  const w=SELLERS.map(x=>x.w*saticiCarpan(x.k,m,year));
  const tot=w.reduce((a,b)=>a+b,0); let r=Math.random()*tot;
  for(let i=0;i<SELLERS.length;i++){ r-=w[i]; if(r<=0) return SELLERS[i]; }
  return SELLERS[0];
}

/* ============ döşeme tipi (mevcut alanlardan türetilir) ============ */
const DOSEME_LBL={kumas:"Kumaş döşeme", deri:"Deri döşeme",
                  suni:"Suni deri döşeme", kadife:"Kadife döşeme"};
function dosemeTipi(car){
  const m=car.model, i=(car.id||0);
  if(m.cl) return (i%3===0)?"kadife":"kumas";
  if(m.seg==="lux") return (i%5===0)?"suni":"deri";
  if(m.seg==="suv") return (i%3===0)?"deri":((i%3===1)?"suni":"kumas");
  if(m.seg==="ticari") return "kumas";
  return (i%4===0)?"suni":"kumas";
}

/* ============ değerleme ============ */
let VISION=null; // (car,fault)=>bool — personelin ek görüşü
/* Kademeli ekspertiz: oyuncu tek bir organa "hızlı bakış" yaptırabiliyor.
   O organ artık açık — ama yalnızca o organ. Ekspertizin tamamı tek bir
   düğme olduğu sürece "ne kadar bakayım" diye bir karar yoktu; asıl
   galericilik becerisi bu. c.bakilan: açılmış organların listesi. */
function bakildiMi(car, comp){
  return !!(car.bakilan && car.bakilan.indexOf(comp)>=0);
}
function seesFault(car,f,visibleOnly){
  return !visibleOnly || f.visible || bakildiMi(car,f.comp) || (VISION && VISION(car,f));
}
function compsOf(car, visibleOnly){
  const c={};
  for(const k of COMPKEYS){
    let v=100-car.wear[k];
    for(const f of car.faults){
      if(f.comp===k && !f.fixed && seesFault(car,f,visibleOnly)) v-=f.gain;
    }
    c[k]=clamp(Math.round(v),5,100);
  }
  return c;
}
function condIndex(comps){
  let s=0; for(const k of COMPKEYS) s+=comps[k]*COMPW[k];
  return s/100;
}
function baseValue(m, age){
  if(m.cl) return m.np*(1+Math.min(.42,age*.0062));   // klasikte np = bugünkü değer
  // Türkiye'de araç çok daha yavaş değer kaybeder: vergiler ve enflasyon ikinci
  // eli yukarıda tutuyor. Çapa: 2015 model Clio, 180 bin km → sıfırın ~%42'si.
  // Ticari (panelvan, kamyonet) neredeyse hiç düşmez; lüks daha hızlı erir.
  const dep = m.seg==="lux" ? .932 : (m.seg==="ticari" ? .962 : .95);
  const taban = m.seg==="lux" ? .26 : (m.seg==="ticari" ? .38 : .30);
  return Math.max(m.np*Math.pow(dep,age), m.np*taban);
}
/** apparent=true → gizli kusurlar hesaba katılmaz (alıcının ilk bakışı) */
function valueOf(car, apparent){
  const m=car.model, age=Math.max(1,YEAR-car.year);
  let v = baseValue(m, age);
  // km
  const expKm=(m.cl?7000:15000)*age+5000;   // TR ortalaması ABD'den düşük
  const dev=car.km-expKm;
  v *= 1 - clamp(dev/100000*.05, -.08, .18);
  // durum
  let wearIdx=0;
  for(const k of COMPKEYS) wearIdx += (100-car.wear[k])*COMPW[k];
  v *= .55 + .45*(wearIdx/100);
  // Bilinen açık arızalar alıcının kafasında doğrudan fiyattan düşer.
  // Pahalı araçta büyük kusur orantısız korkutur: 2,5 milyonluk bir araçta
  // "motor revizyonu şart" ibaresi, tamir bedelinden fazlasını götürür.
  // Böylece büyük revizyon ucuz araçta zarar, pahalı araçta kâr olur.
  // Büyük revizyonlarda (dm<1) etkili katsayı aracın değerine göre kayar:
  // ucuz araçta 0.6 (zarar), 2,6 milyon ve üstünde 1.30 (kâr). Karar böylece
  // "her zaman yapma" değil, "hangi araçta" sorusuna dönüşüyor.
  const zengin = clamp(baseValue(m,age)/2600000, 0, 1);
  for(const f of car.faults){
    // Ucuz parçayla onarılmış arıza ilk bakışta görünmez; gerçek değerden düşer.
    if(f.fixed){ if(!apparent && f.parca && PARCA[f.parca]) v -= f.cost*PARCA[f.parca].kayip; continue; }
    if(!seesFault(car,f,apparent)) continue;
    const dm0=f.dm||1;
    const dm = dm0<1 ? dm0 + (1.30-dm0)*zengin : dm0;
    v -= f.cost * dm;
  }
  // hasar kaydı
  if(!apparent){
    v *= 1 - Math.min(.28, car.tramer/(v*1.7));
    v *= clamp(1-(car.degisen*.030+car.boyali*.013), .70, 1);
    if(car.kmOynama) v*=.88;
  }
  v *= car.colorM;
  if(car.gear==="Otomatik") v*=1.045;
  if(car.fuel==="Hibrit") v*=1.06;
  if(car.fuel==="Elektrik") v*=1.02;
  if(car.fuel==="Dizel" && (m.seg==="suv"||m.seg==="ticari")) v*=1.03;
  v *= m.dem>1 ? 1+(m.dem-1)*.5 : 1-(1-m.dem)*.5;
  if(car.cosmetic && apparent) v*=1.045;
  if(car.story){
    const st=STORIES.find(s=>s.k===car.story);
    if(st) v*=st.val;
  }
  /* Klasiğin hâli değere girer (v3 kararı 9, M6); yalnız ekspertizle
     öğrenilir, ilk bakışta görünmez. ARB'nin 1,30/0,55 önerisi, meraklı
     alıcı primiyle üst üste binmesin diye yumuşatıldı. */
  if(car.klasikHal && !apparent) v *= ({orijinal:1.15, restore:1.05, yorgun:1.00, proje:0.80})[car.klasikHal]||1;
  v *= evMul("val", m.seg);
  // segmentin piyasa dalgası (piyasa.js) — grafikte görünen eğrinin kendisi
  if(typeof nabizKat==="function") v *= nabizKat(m.seg);
  v *= evMul("fuel", car.fuel);
  // Hurda tabanı: kusur bedeli değerin üstüne çıksa bile araç sökümlük
  // olarak bir şey eder. Bu taban olmadan 450 bin km'lik bir klasik
  // değerin altına düşüyor ve oyuncu için çalışılamaz bir tuzak oluyordu.
  const hurda = Math.max(90000, m.np*0.05);
  return Math.round(Math.max(v, hurda)/500)*500;
}
function openFaults(car){ return car.faults.filter(f=>!f.fixed); }
function majorHidden(car){
  return openFaults(car).some(f=>!f.visible && f.cost>=24000);
}
function hiddenIssues(car){
  const list=[];
  if(car.tramer>0) list.push({t:`Tramer kaydı: ${tl(car.tramer)}`, cut:.06});
  if(car.degisen>0) list.push({t:`${car.degisen} değişen parça`, cut:.045});
  if(car.boyali>2) list.push({t:`${car.boyali} boyalı parça`, cut:.03});
  if(car.kmOynama) list.push({t:"Km'de oynama şüphesi", cut:.10});
  for(const f of openFaults(car)) if(f.cost>=20000) list.push({t:f.n, cut:.045});
  for(const f of car.faults) if(f.fixed && f.parca && PARCA[f.parca] && f.parca!=="orijinal")
    list.push({t:`${f.n} — ${PARCA[f.parca].n.replace("&Ccedil;","Ç").toLocaleLowerCase("tr")} parça`, cut:f.parca==="cikma"?.05:.03});
  for(const g of ((car.ilanFoto&&car.ilanFoto.gizler)||[]))
    if(car.listPrice && openFaults(car).some(f=>f.k===g.k)) list.push({t:`Fotoğrafta gizlenen: ${g.n}`, cut:.035});
  const lie=car.claims.find(c=>CLAIMS_LIE.includes(c));
  if(lie && (car.tramer>0||car.boyali>0)) list.push({t:`İlanda "${lie}" yazıyor`, cut:.05});
  return list;
}

/* ============ pazarlık ============ */
/* Oyun testinde altı oyuncunun dördü alımın "hep ilk teklifte, hep %20
   altına" bittiğini yazdı: kozlar rezervi %30'a kadar eritiyordu ve acil /
   acemi satıcının tabanı çok düşüktü. Tavan %15'e, tabanlar yukarı çekildi. */
/* Koz tavanı satıcıya göre (v3 kararı 1): v2'de konan %15 tavan yalnız
   burada duruyordu, ekrandaki pazarlık ui.js negReserve() ile %34'e kadar
   iniyordu. İki yol artık aynı tablodan okur. */
function kozTavan(s){ return ((s&&s.kozTavan)||.10)*(zorGercek()?.8:1); }
function effReserve(car, leverage){
  let cut=0; for(const l of leverage) cut+=l.cut;
  return Math.round(car.reserve*(1-Math.min(kozTavan(car.seller),cut)));
}
/** Satıcının cevabı. Kurallar (test/yeni-test.js 16. bölüm ölçüyor):
    • karşı teklif oyuncunun teklifinin altına inmez,
    • turdan tura yalnız düşer (önceki karşı teklifin üstüne çıkmaz),
    • oyuncu önceki karşı teklife geldiyse anlaşma olur,
    • "altına inmem" yalnız gerçek tabanda söylenir (taban:true),
    • sert satıcı ilk turda kolay kabul etmez, en az bir karşı teklif verir.
    Eskiden her tur karşı teklif rastgele yeniden çekiliyordu: daha yüksek
    teklife daha düşük karşı teklif geliyor, "bundan aşağısı yok" diyen
    satıcı sonra daha da iniyordu. n: pazarlık durumu (S.neg). */
function sellerReply(car, offer, er, n){
  const s=car.seller, r=offer/er;
  const onceki=(n&&n.sonKarsi)||car.ask;
  if(offer>=onceki) return {act:"accept", price:offer};
  /* Söz bağlar (v3 oyun testi, 6/8 kişi): "altına inmem" denen fiyatın altı
     artık hiçbir yoldan kabul edilmiyor. Eskiden r≥.955 bandındaki zar ya da
     yeni bir koz satıcıyı söylediği tabanın altına indirebiliyordu. */
  if(n && n.tabanSoz && offer<n.tabanSoz)
    return {act:"counter", price:n.tabanSoz, pat:1, taban:true};
  let sonuc;
  if(r>=1){
    /* Tabanın üstünde bile her teklif kabul değil: satıcı son sözüyle teklif
       arasındaki farkın ancak bir kısmını yutar. Eskiden rezervin üstündeki
       her rakam anında "Tamam, senin olsun" alıyordu; acil satıcıya ilanın
       %25 altını yazmak tek strateji olmuştu. Tolerans turla büyür, sert
       satıcıda dardır. */
    const fark=(onceki-offer)/onceki;
    const tol=.035+.075*(1-s.sert)+.025*((n&&n.tur)||0);
    if(fark<=tol && !(n && !n.tur && s.sert>=.5 && offer<car.ask*.97)) return {act:"accept", price:offer};
    const pay=.42+.26*s.sert;
    sonuc={act:"counter", price:Math.max(Math.round(er/500)*500, Math.round((offer+(onceki-offer)*pay)/500)*500), pat:0};
  }
  else if(r>=.955) sonuc = (n&&n.tur) && chance(.45-s.sert*.25)
      ? {act:"accept", price:offer}
      : {act:"counter", price:Math.round((offer+er)/2/500)*500, pat:0};
  else if(r>=.87) sonuc={act:"counter", price:Math.round(er*rnd(1.0,1.04)/500)*500, pat:1};
  else if(r>=.75) sonuc={act:"counter", price:Math.round(er*rnd(1.05,1.12)/500)*500, pat:1};
  else sonuc={act:"insult", price:Math.round(car.ask*.98/500)*500, pat:2};
  if(sonuc.act==="accept") return sonuc;
  sonuc.price=Math.min(sonuc.price, onceki);
  if(sonuc.price<=offer) return {act:"accept", price:offer};
  sonuc.taban = sonuc.price<=er*1.01;
  return sonuc;
}


/* ============ sezonlar ============ */
const SEASON_LEN=15;
const SEASONS=[
 {k:"Kış",       d:"SUV ve 4x4 aranıyor, açık renk hatchback bekliyor",
  m:{suv:1.28, ticari:1.02, sedan:0.96, hatch:0.88, lux:0.85, klasik:0.80}},
 {k:"İlkbahar",  d:"Piyasa canlanıyor, klasiklere talep artıyor",
  m:{suv:1.02, ticari:1.12, sedan:1.06, hatch:1.06, lux:1.06, klasik:1.18}},
 {k:"Yaz",       d:"Tatil sezonu: küçük araç ve lüks hareketli, SUV durgun",
  m:{suv:0.90, ticari:1.06, sedan:1.04, hatch:1.16, lux:1.16, klasik:1.24}},
 {k:"Sonbahar",  d:"Okul ve hasat dönemi: ticari ve SUV güçlü",
  m:{suv:1.16, ticari:1.18, sedan:1.02, hatch:0.96, lux:0.94, klasik:0.88}}
];
function seasonOf(day){ return SEASONS[Math.floor((day-1)/SEASON_LEN)%4]; }
function seasonMul(day, seg){ return seasonOf(day).m[seg]||1; }

/* ============ uzmanlıklar ============ */
const PERK_LIST=[
 {k:"goz",    n:"Usta gözü",        d:"Her araçta gizli arızalardan biri ekspertizsiz görünür"},
 {k:"tramer", n:"Tramer ağı",       d:"Tramer kaydı ve km oynaması ekspertiz olmadan görünür"},
 {k:"dil",    n:"Pazarlık dili",    d:"Her satıcıda bir sabır hakkın daha olur"},
 {k:"poker",  n:"Poker suratı",     d:"Blöfte yakalanma ihtimalin üçte bir azalır"},
 {k:"vitrin", n:"Vitrin ustası",    d:"İlanlarına %18 daha fazla alıcı gelir"},
 {k:"usta",   n:"Anlaşmalı usta",   d:"Bütün tamirler %20 daha ucuz"},
 {k:"banka",  n:"Banka ilişkisi",   d:"Kredi limitin iki katı, faiz yarı yarıya"}
];
let PERKS=null; // ()=>S.perks
const perk=k=>!!(PERKS&&PERKS()[k]);

/* ============ alıcı arketipleri ============ */
const BUYERS=[
 {k:"aile",  n:"Aile babası",     segs:["sedan","suv"],       insp:.48, pay:1.00, haggle:.05, takas:.32, taksit:.14,
  sat:{esnek:.11, kacma:.16, ikna:1.20, sabir:4, savvy:.35, butce:1.03},
  line:"Çocuklarla kullanacağız, güvenli ve sorunsuz olsun."},
 {k:"genc",  n:"Genç sürücü",     segs:["hatch"],             insp:.22, pay:0.96, haggle:.09, takas:.10, taksit:.46,
  sat:{esnek:.08, kacma:.22, ikna:1.35, sabir:3, savvy:.18, butce:0.95},
  line:"İlk arabam olacak, bütçem kısıtlı ama çok istiyorum."},
 {k:"esnaf", n:"Esnaf",           segs:["ticari","sedan"],    insp:.62, pay:0.94, haggle:.10, takas:.28, taksit:.28,
  sat:{esnek:.10, kacma:.20, ikna:0.80, sabir:4, savvy:.70, butce:1.00},
  line:"İşte kullanacağım, motoru sağlam olsun yeter."},
 {k:"merakli",n:"Meraklı",        segs:["klasik","lux"],      insp:.72, pay:1.09, haggle:.03, takas:.14, taksit:.05,
  sat:{esnek:.18, kacma:.12, ikna:1.10, sabir:5, savvy:.55, butce:1.12},
  line:"Orijinalliği önemli. Boyalı parça istemem."},
 {k:"galerici",n:"Galerici",      segs:null,                  insp:1,   pay:0.83, haggle:.00, takas:.00, taksit:.00,
  sat:{esnek:.04, kacma:.32, ikna:0.40, sabir:2, savvy:.95, butce:0.90},
  line:"Toptan alırım, üstüne para koymam."},
 {k:"uzak",  n:"Şehir dışından",  segs:null,                  insp:.55, pay:1.03, haggle:.02, takas:.06, taksit:.10,
  sat:{esnek:.13, kacma:.28, ikna:1.00, sabir:3, savvy:.45, butce:1.06},
  line:"Yoldan geldim, boşuna gelmiş olmayayım."}
];
/* Alıcı araca uysun (v3 kararı 9, M5): ₺1,74M'lik hibriti "bütçem kısıtlı,
   ilk arabam" diyen genç alıyordu. Segment havuzu korunur (uyan ×2), üstüne
   fiyat/yakıt/segment çarpanları. Eski çağrı (yalnız segment) hâlâ çalışır. */
function pickBuyerType(segOrCar){
  const car=(segOrCar&&segOrCar.model)?segOrCar:null;
  const seg=car?car.model.seg:segOrCar;
  const fiyat=car?(car.listPrice||car.ask||0):0, yakit=car?car.fuel:"";
  const w=BUYERS.map(b=>{
    let x = b.segs ? (b.segs.includes(seg)?2:0) : 1;
    if(!x || !car) return x;
    if(b.k==="genc") x*= fiyat>1500000?.1 : fiyat>1000000?.4 : 1;
    if(b.k==="esnaf" && seg==="ticari") x*= yakit==="Dizel"?4.5:3;
    if(b.k==="merakli") x*= seg==="klasik"?3 : (seg==="lux"||fiyat>3000000)?2:1;
    if(b.k==="aile") x*= (seg==="suv"||seg==="sedan"?2:1)*(yakit==="Hibrit"?1.5:1);
    return x;
  });
  const tot=w.reduce((a,b)=>a+b,0);
  if(!tot) return pick(BUYERS);
  let r=Math.random()*tot;
  for(let i=0;i<BUYERS.length;i++){ r-=w[i]; if(r<=0) return BUYERS[i]; }
  return BUYERS[BUYERS.length-1];
}
/** Takas için alıcının getireceği araç: teklifin %70'ini geçmeyen bir araç. */
function genTradeIn(maxVal){
  for(let i=0;i<25;i++){
    const c=genCar({auction:true});
    const v=valueOf(c,false);
    if(v>maxVal*.15 && v<maxVal*.58){ c.tradeIn=true; return c; }
  }
  return null;
}



/* ============ piyasa olayları ============ */
const EVENTS=[
 {k:"otv",    n:"&Ouml;TV zammı", d:"Sıfır ara&ccedil; pahalandı, ikinci ele talep patladı",
  gun:8,  val:1.06, lead:1.15, seg:null},
 {k:"kredi",  n:"Kredi faizi indi",  d:"Bankalar taşıt kredisini ucuzlattı",
  gun:6,  val:1.00, lead:1.38, seg:null},
 {k:"doviz",  n:"D&ouml;viz şoku",        d:"İthal ve l&uuml;ks segment u&ccedil;tu, ucuz segment durdu",
  gun:7,  val:1.00, lead:1.00, seg:{lux:1.12, suv:1.05, hatch:0.94, sedan:0.98}},
 {k:"yakit",  n:"Akaryakıt zammı",   d:"Dizel ve elektrikli aranıyor, benzinli bekliyor",
  gun:8,  val:1.00, lead:1.00, fuel:{Dizel:1.14, Elektrik:1.16, Benzin:0.90, Hibrit:1.20}},
 {k:"yenimodel",n:"Yeni model &ccedil;ıktı", d:"Bir modelin ikinci eli baskı altında",
  gun:10, val:1.00, lead:1.00, model:true},
 {k:"denetim",n:"Piyasa denetimi",   d:"Kusur gizleyenlere ceza kesiliyor",
  gun:6,  val:1.00, lead:0.95, denetim:true},
 {k:"bayram", n:"Bayram &ouml;ncesi",    d:"Herkes ara&ccedil; bakıyor ama herkes pazarlıkta",
  gun:5,  val:1.00, lead:1.30, pazarlik:1.5},
 {k:"durgun", n:"Piyasa durgun",     d:"Kimse alım yapmıyor, ilanlar bekliyor",
  gun:6,  val:0.97, lead:0.62, seg:null}
];
let MARKET=null;   // ()=>S.event  — aktif olay
function evMul(kind, key){
  const e=MARKET&&MARKET();
  if(!e) return 1;
  const def=EVENTS.find(x=>x.k===e.k); if(!def) return 1;
  if(kind==="val"){
    let m=def.val||1;
    if(def.seg&&def.seg[key]) m*=def.seg[key];
    if(def.model&&e.model===key) m*=0.88;
    return m;
  }
  if(kind==="lead") return def.lead||1;
  if(kind==="fuel") return (def.fuel&&def.fuel[key])||1;
  return 1;
}
function evFlag(f){
  const e=MARKET&&MARKET(); if(!e) return false;
  const def=EVENTS.find(x=>x.k===e.k);
  return !!(def&&def[f]);
}

/* ============ hikâyeli araçlar ============ */
const STORIES=[
 {k:"garaj",   t:"Garaj arabası",       d:"22 yıl kapalı otoparkta bekledi, &ccedil;ok az kullanıldı",
  km:.35, wear:.55, val:1.14, koleksiyon:1.28, riskli:false},
 {k:"miras",   t:"Merhum amcadan kaldı",d:"Ailesi satıyor, kimse arabaya binmemiş",
  km:.55, wear:.70, val:1.08, koleksiyon:1.15, riskli:false},
 {k:"modifiye",t:"Modifiyeli",           d:"Motor ve şanzıman elden ge&ccedil;miş, orijinal değil",
  km:1.15, wear:1.0, val:0.92, koleksiyon:1.35, riskli:true},
 {k:"unlu",    t:"Bilinen bir isimden",  d:"Ruhsatta tanıdık bir ad var, belgesi duruyor",
  km:1.0, wear:.9, val:1.10, koleksiyon:1.30, riskli:false},
 {k:"sel",     t:"Sigortadan &ccedil;ıkma",    d:"Kayıtlarda 'su hasarı' yazıyor, elektrikte ne var belli değil",
  km:.9, wear:1.45, val:0.70, koleksiyon:0.75, riskli:true},
 {k:"filo",    t:"Filo ihalesinden tek", d:"Servis kayıtları eksiksiz, ama y&uuml;ksek km",
  km:1.45, wear:.85, val:1.02, koleksiyon:0.95, riskli:false},
 {k:"ilk",     t:"İlk sahibinden",       d:"Tek elden, faturası ve t&uuml;m fişleri duruyor",
  km:.85, wear:.75, val:1.09, koleksiyon:1.12, riskli:false}
];

/* ============ siparişler ============ */
const ORDER_CUSTOMERS=[
 {n:"Nakliyeci Kemal",   segs:["ticari"],           line:"İşi b&uuml;y&uuml;tt&uuml;m, ikinci bir ara&ccedil; şart."},
 {n:"Dr. Aylin",         segs:["sedan","suv"],      line:"G&uuml;venli ve bakımlı olsun, pazarlıkla uğraşamam."},
 {n:"S&uuml;r&uuml;c&uuml; kursu",     segs:["hatch","sedan"],    line:"Kursa iki ara&ccedil; alıyoruz, manuel olacak."},
 {n:"Koleksiyoncu Reha", segs:["klasik"],           line:"Orijinalliği bozulmamış olsun, fiyat ikinci mesele."},
 {n:"Mimar B&uuml;ro",         segs:["lux","suv"],        line:"M&uuml;şteri karşılayacağız, temsil edecek bir ara&ccedil; lazım."},
 {n:"&Ccedil;iftlik sahibi",     segs:["suv","ticari"],     line:"K&ouml;y yolu &ccedil;ok bozuk, sağlam olsun."},
 {n:"Yeni evli &ccedil;ift",     segs:["hatch","sedan"],    line:"İlk arabamız, b&uuml;t&ccedil;emiz belli."}
];
function genOrder(day, seviye, ozel){
  const cust=ozel||pick(ORDER_CUSTOMERS);
  const seg=pick(cust.segs);
  const havuz=MODELS.filter(m=>m.seg===seg);
  const m=pick(havuz);
  const klasik=!!m.cl;
  const minYear = klasik ? m.y[0] : clamp(ri(m.y[0], m.y[1]-2), m.y[0], m.y[1]);
  const maxKm = klasik ? ri(150,400)*1000 : ri(80,260)*1000;
  const gear = (!klasik && chance(.45)) ? pick(["Otomatik","Manuel"]) : null;
  const ornek={model:m, year:minYear+1, km:Math.round(maxKm*.7), wear:{}, faults:[], tramer:0,
               degisen:0, boyali:0, kmOynama:false, colorM:1, gear:gear||"Manuel",
               fuel:"Benzin", cosmetic:false};
  for(const k of COMPKEYS) ornek.wear[k]=30;
  const taban=valueOf(ornek,false);
  /* Bütçe çarpanı 1,20–1,42'ydi: tek sipariş üç normal satışın kârını
     getiriyor, pazarlık/tamir/ilan döngüsünü gereksiz kılıyordu (oyun testi). */
  const butce=Math.round(taban*rnd(1.05,1.20)/2500)*2500;
  return {
    id:Math.round(Math.random()*1e9), who:cust.n, line:cust.line,
    seg, minYear, maxKm, gear, butce,
    prim: Math.round(butce*rnd(.04,.09)/1000)*1000,
    day, deadline: day+ri(6,10)
  };
}
function orderMatches(o, car){
  if(car.model.seg!==o.seg) return false;
  if(car.year<o.minYear) return false;
  if(car.km>o.maxKm) return false;
  if(o.gear && car.gear!==o.gear) return false;
  return true;
}

/* ============ tanıdıklar ============ */
const CONTACTS=[
 {k:"nuri",  n:"Kaportacı Nuri",  d:"Sanayide k&ouml;şe başı. Tamirlerde eli a&ccedil;ık.",
  xpLbl:"her tamirde +1", per:[0,8,15,22], perLbl:l=>l?`Tamirler %${[0,8,15,22][l]} ucuz`:"Henüz indirim yok · sanayi gününde %30",
  favor:"Bir tamiri bedava yapar"},
 {k:"hakan", n:"Ekspertizci Hakan", d:"Rampanın altında ne varsa g&ouml;r&uuml;r.",
  xpLbl:"her ekspertizde +1", per:[2500,2000,1600,1200], perLbl:l=>`Ekspertiz ${["₺2.500","₺2.000","₺1.600","₺1.200"][l]}`,
  favor:"Bir aracı bedava ekspertiz eder"},
 {k:"selim", n:"&Ccedil;ekici Selim",  d:"Hurdadan &ccedil;ıkma ara&ccedil;ları haber verir.",
  xpLbl:"arızalı ara&ccedil; aldık&ccedil;a +1", per:[0,1,2,3], perLbl:l=>l?`Pazarda ${l} ucuz hurda ilanı`:"Hen&uuml;z ilan getirmiyor",
  favor:"Bir aracı bedava &ccedil;eker (₺7.500)"},
 {k:"yilmaz",n:"Noter Yılmaz",    d:"Devir işlerini aynı g&uuml;n bitirir.",
  xpLbl:"her satışta +1", per:[0,8,15,22], perLbl:l=>`İlanlarına %${[0,8,15,22][l]} fazla alıcı`,
  favor:"Bir satışı aynı g&uuml;n kapatır"},
 {k:"vedat", n:"Galerici Vedat",  d:"Rakip ama işine gelmeyeni sana yollar.",
  xpLbl:"galericiyle iş yaptık&ccedil;a +1", per:[0,1,2,3], perLbl:l=>l?`Her 5 g&uuml;nde ${l} &ouml;zel ilan`:"Hen&uuml;z ara&ccedil; yollamıyor",
  favor:"Bir m&uuml;zayede zarfını sana fısıldar"}
];
const CONTACT_XP=[0,4,12,26];   // seviye eşikleri
function contactLevel(xp){ let l=0; for(let i=0;i<CONTACT_XP.length;i++) if(xp>=CONTACT_XP[i]) l=i; return l; }

/* ============ kilometre taşları ============ */
const MILESTONES=[
 {k:"ilk",     n:"İlk satış",              d:"Bir aracı sat",                    odul:{cash:600}},
 {k:"on",      n:"10 satış",               d:"Toplam 10 ara&ccedil; sat",              odul:{perk:1}},
 {k:"marj",    n:"K&ouml;şeyi d&ouml;nd&uuml;n",          d:"Tek satışta %30 k&acirc;r yap",         odul:{cash:1500}},
 {k:"sezon5",  n:"Yoğun sezon",            d:"Bir sezonda 5 satış yap",          odul:{slot:1}},
 {k:"itibar",  n:"Adın duyuldu",           d:"İtibarı 80'e &ccedil;ıkar",              odul:{cash:3000}},
 {k:"siparis3",n:"G&uuml;venilir tedarik&ccedil;i",  d:"3 siparişi zamanında teslim et",   odul:{perk:1}},
 {k:"lux",     n:"&Uuml;st segment",            d:"L&uuml;ks bir ara&ccedil; sat",              odul:{cash:1800}},
 {k:"muzayede",n:"Zarf ustası",            d:"Bir m&uuml;zayede kazan",               odul:{cash:900}},
 {k:"gecti",   n:"Rakibi ge&ccedil;",            d:"Piyasa sıralamasında bir rakibi ge&ccedil;",   odul:{cash:4500}},
 {k:"bes",     n:"Piyasa oyuncusu",        d:"&Ouml;zsermayeyi ₺12 milyon yap",       odul:{unlock:"satinalma"}}
];

/* ============ satış pazarlığı ============ */
const SALE_EXTRAS=[
 {k:"lastik", n:"Kışlık lastik takımı", d:"Dolaba atılmış set, alıcıya ge&ccedil;er", cost:11000, lift:.030, guven:8},
 {k:"bakim",  n:"1 yıl bakım hediye",   d:"Anlaşmalı serviste iki periyodik", cost:17000, lift:.045, guven:14},
 {k:"koruma", n:"Boya koruma + i&ccedil; detay", d:"Ara&ccedil; teslimde pırıl pırıl", cost:7500,  lift:.022, guven:6},
 {k:"noter",  n:"Noter ve devir masrafı", d:"Alıcının cebinden &ccedil;ıkmaz",   cost:9500, lift:.028, guven:10}
];

/** Aracın gerçekten sahip olduğu satış kozları. */
function saleLeverage(car, rep, day){
  const out=[];
  const yas=Math.max(1,YEAR-car.year);
  const bekKm=(car.model.cl?9000:18000)*yas+5000;
  const iss=hiddenIssues(car);
  if(car.inspected && iss.length===0)
    out.push({k:"rapor", t:"Ekspertiz raporu temiz", d:"Rapor elimde, isteyen bakar", lift:.060, guven:9});
  if(car.tramer===0)
    out.push({k:"tramer", t:"Tramer kaydı yok", d:"Sorgusu tertemiz", lift:.050, guven:8});
  const tamirler=car.faults.filter(f=>f.fixed);
  if(tamirler.length){
    const parcalar=[...new Set(tamirler.map(f=>COMPLBL[f.comp]))];
    out.push({k:"tamir",
      t: tamirler.length>1 ? `${tamirler.length} kalem yeni tamir` : `${parcalar[0]} tarafı yenilendi`,
      d: `${parcalar.join(", ")} &middot; fişi duruyor, ${tl(car.spent)} harcandı`,
      lift:.030+Math.min(.03,tamirler.length*.012), guven:6});
  }
  /* km oynanmış araçta bu koz yalan olurdu; klasikte "yaşına göre düşük"
     anlamsız (41 yaşında E30'a sunuluyordu) — klasikte belgeli km (v3 kararı 7) */
  if(!car.kmOynama){
    if(car.model.cl){ if(car.km < Math.max(1,YEAR-car.year)*4000)
      out.push({k:"km", t:"Belgeli km", d:`${num(car.km)} km &mdash; yaşına g&ouml;re az kullanılmış klasik`, lift:.040, guven:4}); }
    else if(car.km < bekKm*0.8)
      out.push({k:"km", t:"Yaşına g&ouml;re d&uuml;ş&uuml;k km", d:`${num(car.km)} km &mdash; ortalamanın altında`, lift:.040, guven:4});
  }
  if(car.cosmetic)
    out.push({k:"bakimli", t:"Bakımlı g&ouml;r&uuml;n&uuml;m", d:"Pasta cila yeni yapıldı", lift:.020, guven:3});
  if(car.gear==="Otomatik" || car.fuel==="Hibrit")
    out.push({k:"donanim", t:car.gear==="Otomatik"?"Otomatik vites":"Hibrit motor", d:"Şehir i&ccedil;i i&ccedil;in aranan &ouml;zellik", lift:.028, guven:2});
  if(seasonMul(day, car.model.seg)>1.07)
    out.push({k:"sezon", t:"Sezonun aranan segmenti", d:seasonOf(day).d, lift:.045, guven:2});
  if(rep>=70)
    out.push({k:"itibar", t:"Galerinin itibarı y&uuml;ksek", d:"Referans verebilirim", lift:.030, guven:7});
  return out;
}

/** Alıcının tavanı: açılış teklifi + esneklik + kozlar; ilan fiyatını (taksit yoksa) aşamaz. */
function buyerCeiling(sale){
  const bt=sale.bt.sat;
  const guvenBonus=(sale.guven-45)/100*.11;          // güven tavanı ±%10 oynatır
  const lift=sale.lifts + Math.max(0,guvenBonus);
  const ham=sale.base*(1+bt.esnek+lift);
  /* Alıcı ilanın üstünü ödemez (v3 kararı 6: 4 satışın 3'ü ilan fiyatının
     üstünde kapanıyordu, "ilanın tamamını iste" hep tutuyordu). Tavan
     ilanın %95-100'ü arasında, satış açılırken bir kez çekilir. */
  const tavanCap=sale.taksit ? sale.list*1.10 : sale.list*(sale.tavanKat||Math.min(1,bt.butce));
  return Math.round(Math.min(ham, tavanCap)/500)*500;
}
/** Alıcının fiyata tepkisi. */
/** Alıcının fiyata tepkisi. Kurallar:
    • karşı teklif oyuncunun istediğini aşmaz (eskiden (fiyat+tavan)/2
      oyuncunun fiyatından YÜKSEKTİ: "Bak ₺801.000, ortada buluşalım"),
    • alıcının önceki teklifinin (ilk tur: açılış) altına inmez; tek istisna
      ilgisi bitmek üzere olan alıcının en çok %5 geri çekilmesi (doSaleOffer),
    • oyuncu alıcının son teklifine indiyse anlaşma olur. */
function saleReply(sale, price){
  const tavan=buyerCeiling(sale), bt=sale.bt.sat;
  const taban=Math.max(sale.base||0, sale.counter||0);
  if(price<=taban) return {act:"accept", price};
  if(price<=tavan){
    const rahat=(tavan-price)/Math.max(tavan,1);
    const p=clamp(.50+rahat*3.2+(sale.guven-45)/260+(sale.ilgi-60)/300, .25, .97);
    if(chance(p)) return {act:"accept", price};
    const karsi=Math.round((price+taban)/2/500)*500;
    return karsi>=price ? {act:"accept", price} : {act:"counter", price:Math.max(taban,karsi), drop:4};
  }
  const asim=(price-tavan)/tavan;
  const drop=Math.round(bt.kacma*100*clamp(asim*4.5,.25,3.2));
  const karsi=Math.max(taban, Math.min(price-500, Math.round(tavan*rnd(.93,1.0)/500)*500));
  return {act: asim>.16?"offended":"counter", price:karsi, drop};
}

/* ============ rakip galeriler ============ */
/* ============ rakip galericiler ============
   İsimler Türkiye'deki galeri tabelalarının ritminde ama içlerinde kamyon
   arkası nüktesi var — oyunun mizahı buradan geliyor. Her oyunda havuzdan
   dördü seçiliyor: aynı dünyada iki kez aynı rakip takımıyla oynamıyorsun.
   Segment dengesi korunuyor: bir ucuzcu, bir aileci, bir lüksçü, bir ticari. */
const RIVAL_DEFS=[
 // ucuzcu / hızlı çeviren
 {n:"Babam Sağolsun Oto",  d:"Baba parasıyla kuruldu, baba parasıyla çevriliyor",
  cash:14000000, target:0.99, cap:4, aggr:.82, segs:["hatch","sedan","klasik"], bid:.86, rol:"ucuz"},
 {n:"Yolun Sonu Oto",      d:"Kilometreyi çok, fiyatı az sever",
  cash:11000000, target:1.00, cap:4, aggr:.86, segs:["hatch","ticari","klasik"], bid:.84, rol:"ucuz"},
 {n:"Kader Böyle İstedi",  d:"Ne bulursa alır, ne bulursa satar",
  cash:12500000, target:0.98, cap:5, aggr:.88, segs:["hatch","sedan","suv"],    bid:.87, rol:"ucuz"},
 // aileci / temiz iş
 {n:"Helal Olsun Motors",  d:"Fiyatı nettir, pazarlık sevmez",
  cash:22000000, target:1.02, cap:4, aggr:.66, segs:["sedan","suv","ticari"],   bid:.92, rol:"aile"},
 {n:"Nazar Değmesin Galeri",d:"Her araca mavi boncuk, her pazarlığa tahtaya vur",
  cash:19000000, target:1.01, cap:4, aggr:.72, segs:["sedan","hatch","suv"],    bid:.90, rol:"aile"},
 {n:"Ustam Hoca Otomotiv", d:"Her aracı kendi tamir eder, kârı tamirden çıkarır",
  cash:17000000, target:1.04, cap:3, aggr:.70, segs:["sedan","suv","hatch"],    bid:.93, rol:"aile"},
 // lüksçü
 {n:"Kıskananlar Çatlasın",d:"Vitrini parlak, ekspertizi karanlık",
  cash:45000000, target:0.95, cap:3, aggr:.58, segs:["lux","suv"],              bid:.80, rol:"lux"},
 {n:"Gurbet Kuşu Oto",     d:"Almanya'dan gelen neyse onu satar",
  cash:38000000, target:0.97, cap:3, aggr:.54, segs:["lux","sedan"],            bid:.82, rol:"lux"},
 // ticari / sabırlı
 {n:"Sabır Taşı Otomotiv", d:"Aracı altı ay bekletir, fiyatından inmez",
  cash:13000000, target:1.06, cap:3, aggr:.52, segs:["ticari","klasik","sedan"],bid:.95, rol:"ticari"},
 {n:"Dert Bende Galeri",   d:"Zararına satar, sonra herkese anlatır",
  cash:12000000, target:0.96, cap:4, aggr:.78, segs:["ticari","hatch","klasik"],bid:.85, rol:"ticari"}
];
/** Rakip galericinin gözü: gizli kusurların çoğunu görür, hepsini değil. */
function rivalValue(car){ return valueOf(car,true)*.35 + valueOf(car,false)*.65; }
/** Her rolden bir tane — dört rakip, her oyunda farklı takım. */
function newRivals(){
  const out=[];
  for(const rol of ["ucuz","aile","lux","ticari"]){
    const aday=RIVAL_DEFS.map((r,i)=>({r,i})).filter(x=>x.r.rol===rol);
    const s=aday[Math.floor(Math.random()*aday.length)];
    out.push({di:s.i, n:s.r.n, d:s.r.d, cash:s.r.cash, stock:[], sold:0, profit:0});
  }
  return out;
}
/** Rakibin tanımı — DİZİ SIRASINDAN DEĞİL, kendi di alanından.
    Eskiden RIVAL_DEFS[i] okunuyordu; bir rakibi satın alıp listeden
    çıkarınca kalanlar başkasının karakterine bürünüyordu. */
function rivalDef(st, i){
  return RIVAL_DEFS[st && st.di!=null ? st.di : i] || RIVAL_DEFS[0];
}

/* ============ alıcı davranışı ============ */
let PRESSURE=null; // (seg)=>aynı segmentte kaç rakip ilanı var
let NOTER=null;    // ()=>noter tanıdığının ilan hızlandırma yüzdesi
/* ============ İLANIN KOMPOZİSYONU ============
   Satış tarafı alış tarafı kadar derin değildi: alışta ruh hâli, sabır ve
   hamleler varken satışta tek bir fiyat kaydırıcısı vardı. Artık ilan üç
   parçadan oluşuyor — fiyat, DİL ve SUNUM — ve bunlar alıcı SAYISINI değil
   KALİTESİNİ değiştiriyor. Yüksek sesli ilan kalabalık getirir, kalabalık
   pazarlık eder; dürüst ilan az ama ciddi alıcı getirir.
     durust   kusurları açıkla   · az alıcı, ciddi alıcı, asla yakalanmazsın
     muglak   es geç             · denge
     abartili şişir              · çok alıcı, pazarlıkçı, ekspertize götürür */
const ILAN_DILI={
  durust:   {n:"D&uuml;r&uuml;st",  d:"Kusurları ilanda yazarsın",         akis:.86, kalite:1.035, supheli:0.70},
  muglak:   {n:"Muğlak",            d:"Yazmazsın; alıcı ekspertize g&ouml;t&uuml;r&uuml;rse &ccedil;ıkar", akis:1.00, kalite:1.000, supheli:1.00},
  abartili: {n:"Abartılı",          d:"&#8220;Hatasız boyasız&#8221; dersin", akis:1.32, kalite:0.955, supheli:1.45}
};
/** Gizli kusurlu araçta bir alıcının ekspertize götürüp yakalama olasılığı (arketip ortalaması). */
function yakalanmaRiski(car, dilK){
  if(!hiddenIssues(car).length) return 0;
  const d=ILAN_DILI[dilK]||ILAN_DILI.muglak;
  const ins=BUYERS.reduce((a,b)=>a+b.insp,0)/BUYERS.length;
  return clamp(ins*d.supheli, 0, .97);
}
const ILAN_SUNUM=[
  {n:"Olduğu gibi", d:"Telefonla &ccedil;ekilmiş iki foto",        bedel:0,     akis:1.00, kalite:1.000},
  {n:"Temiz foto",  d:"Yıkanmış ara&ccedil;, d&uuml;zg&uuml;n kadraj", bedel:2500,  akis:1.10, kalite:1.020},
  {n:"Tam sunum",   d:"Detaylı temizlik, 20 foto, video",          bedel:9000,  akis:1.20, kalite:1.045}
];
const ilanDili  = (car)=>ILAN_DILI[car.ilanDili] || ILAN_DILI.muglak;
const ilanSunum = (car)=>ILAN_SUNUM[car.sunum|0] || ILAN_SUNUM[0];

function leadChance(car, S){
  const mv=valueOf(car,false), av=valueOf(car,true);
  const ref=car.disclosed?mv:av;
  const ratio=car.listPrice/ref;
  let p=clamp(1.95-1.42*ratio, .03, 1.15);
  p*=car.model.dem;
  p*=.72+(S.rep/100)*.56;
  if(S.staff.satis) p*=1.22;
  if(S.marketingDays>0) p*=1.85;
  if(perk("vitrin")) p*=1.18;
  p*=seasonMul(S.day, car.model.seg);
  p*=evMul("lead");
  if(PRESSURE) p*= 1/(1+.13*PRESSURE(car.model.seg));
  if(NOTER) p*= 1+NOTER()/100;          // Noter Yılmaz: ilanlara ek alıcı
  // Elden geçmiş araç daha hızlı satılır: açık arızası kalmamış ve kusurları
  // ilanda açıklanmış araca alıcı daha rahat geliyor.
  const acikArz=car.faults.filter(f=>!f.fixed).length;
  if(acikArz===0){ p*=1.18; if(car.disclosed) p*=1.08; }
  // ilanın dili ve sunumu akışı değiştiriyor
  p*=ilanDili(car).akis * ilanSunum(car).akis;
  // yakalanan ilan iki gün "soğuk": haber yayılıyor, alıcı yarıya iniyor
  if(car.sogukGun && car.sogukGun>S.day) p*=.5;
  // kendi çektiğin ilan fotoğrafı (ilanfoto.js); çekmediysen etkisiz
  if(typeof ilanFotoAkis==="function") p*=ilanFotoAkis(car);
  // Acemi dönemi: ilk satışa kadar alıcı akışı belirgin şekilde yüksek.
  // İlk haftasını tek bir ilana bakarak geçiren oyuncu oyunu bırakıyor.
  // Gerçekçi modda bu tolerans yok — oyuncu bunu bilerek seçti.
  if(zorGercek()) p*=.86;
  else if((S.stats.sold||0)===0) p*=2.4;
  else if((S.stats.sold||0)<3) p*=1.5;
  // İlan uzun süre bekledikçe ilgi artsın (fiyat kırmayı beklemeden)
  if(car.daysListed>6) p*=1+Math.min(.6,(car.daysListed-6)*.09);
  return clamp(p*.5, .02, .92);
}
function makeBuyer(car, S){
  const bt=pickBuyerType(car);
  const dil=ilanDili(car), sun=ilanSunum(car);
  const mv=valueOf(car,false), av=valueOf(car,true);
  // Abartılı ilan alıcıyı şüphelendirir: daha sık ekspertize götürür.
  // Fotoğrafta hasarı saklayan ilan, aracı görmeye gelen alıcıyı şüphelendirir.
  const fotoSuphe = (car.ilanFoto&&car.ilanFoto.gizler&&car.ilanFoto.gizler.length&&!car.disclosed) ? 1.25 : 1;
  const inspects = chance(clamp(bt.insp*dil.supheli*fotoSuphe,0,.97)) || car.disclosed;
  const ref = (car.disclosed || inspects) ? mv : av;
  const sez = 1+(seasonMul(S.day,car.model.seg)-1)*.35;
  // Alıcı KALİTESİ: dürüst ilan ve iyi sunum daha az pazarlıkçı alıcı getirir.
  const fotoK = (typeof ilanFotoKalite==="function") ? ilanFotoKalite(car) : 1;
  let offer = Math.round(ref*bt.pay*sez*dil.kalite*sun.kalite*fotoK*(1-rnd(0,bt.haggle))*(zorGercek()?.97:1)/500)*500;
  // Bakımlı araç primi: hiç açık arızası kalmamışsa alıcı biraz daha cömert.
  if(car.faults.every(f=>f.fixed)) offer=Math.round(offer*1.035/500)*500;
  // kimse ilan fiyatını doğrudan vermez; pazarlığa her zaman bir aralık kalır
  offer = Math.min(offer, Math.round(car.listPrice*(1-rnd(.005,.03))/500)*500);
  const issues = hiddenIssues(car);
  const caught = inspects && !car.disclosed && issues.length>0;
  if(caught){
    // Abartılı ilanda yakalanmak daha pahalı: alıcı yalanı da fiyatlandırıyor.
    const abartili = car.ilanDili==="abartili";
    if(chance(abartili?.68:.55)) return {walk:true, issues, type:bt, abartili};
    offer = Math.round(mv*(abartili?rnd(.66,.77):rnd(.74,.84))/500)*500;
  }
  if(bt.k==="merakli" && inspects && car.boyali>2) offer=Math.round(offer*.90/500)*500;
  if(car.story && (bt.k==="merakli"||bt.k==="uzak")){
    const st=STORIES.find(s=>s.k===car.story);
    if(st) offer=Math.round(offer*(1+(st.koleksiyon-1)*(bt.k==="merakli"?.55:.2))/500)*500;
  }
  const out={walk:false, offer, inspects, caught, issues, type:bt};
  if(!caught && chance(bt.takas)){
    const tc=genTradeIn(offer);
    if(tc){
      const real=valueOf(tc,false);
      const claim=Math.round(real*rnd(.82,1.12)/1000)*1000;
      if(claim<offer*.80) out.takas={car:tc, claim, cash:offer-claim, real};
    }
  }
  if(!out.takas && !caught && chance(bt.taksit)){
    const total=Math.round(offer*rnd(1.09,1.18)/1000)*1000;
    const down=Math.round(total*.4/1000)*1000;
    out.taksit={total, down, parts:2, gap:4, risk: bt.k==="genc"?.17:(bt.k==="esnaf"?.10:.06)};
  }
  return out;
}
//</CORE>

/* ============ kasa defteri ============
   Oyun testinde altı oyuncunun altısı da "para nereden geldi / nereye
   gitti" diye takıldı: ödüller kasaya sessizce giriyor, üstteki gider
   rakamı gün sonu raporuyla tutmuyordu. Kasaya giren ve çıkan her önemli
   hareket buradan geçer ve Durum sayfasındaki defterde etiketiyle görünür. */
const KASA_SINIR=40;
function kasaHareket(tutar, etiket){
  if(!tutar) return;
  S.cash+=tutar;
  kasaNot(tutar, etiket);
}
/** Kasa zaten değiştiyse yalnız deftere yazar. */
function kasaNot(tutar, etiket){
  if(!tutar || typeof S==="undefined" || !S) return;
  if(!S.kasa) S.kasa=[];
  S.kasa.push({g:S.day, t:Math.round(tutar), e:String(etiket||"")});
  if(S.kasa.length>KASA_SINIR) S.kasa.splice(0, S.kasa.length-KASA_SINIR);
}
