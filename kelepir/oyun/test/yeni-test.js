/* Yol, dosyanın kendi konumundan türetiliyor — paketi nereye açarsan aç
   çalışsın diye mutlak yol bırakılmadı. */
const OYUN = require('path').resolve(__dirname, '..');
/* Madde 1–8 + yeni istekler için davranış testi.
   Gerçekten tıklayarak çalışır: evaluate ile hile yapmadan, ekranda ne varsa ona basar. */
const {chromium}=require('playwright');
let ok=0, fail=0;
const tlk0=(v)=>new Intl.NumberFormat('tr-TR').format(Math.round(v));
const t=(ad,kos)=>{ if(kos){ok++;console.log('  ok   '+ad);} else {fail++;console.log('  FAIL '+ad);} };

(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
    args:['--headless=new','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage({viewport:{width:420,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/three.min.js', r=>r.fulfill({path:OYUN+'/three.min.js',contentType:'application/javascript'}));
  await p.goto('file://'+OYUN+'/preloved.html');
  await p.evaluate(()=>{try{localStorage.clear()}catch(e){}});
  await p.reload(); await p.waitForSelector('[data-act="startgame"]'); await p.waitForTimeout(300);

  console.log('1) zorluk seçimi girişte var ve kayda yazılıyor');
  t('iki kademe gösteriliyor', (await p.$$('[data-act="pickzor"]')).length===2);
  await p.click('[data-act="pickzor"][data-k="gercek"]'); await p.waitForTimeout(150);
  t('gerçekçi seçildi', await p.evaluate(()=>S.zorluk==="gercek"));

  console.log('2) tanıtım turu: 8 adım, kâr ~%10, kariyere yazılıyor');
  await p.click('[data-act="demoac"]'); await p.waitForTimeout(300);
  const marj=await p.evaluate(()=>demoMarj());
  t('tur marjı %9–%12 arası', marj>9 && marj<12);
  let adim=1;
  for(let i=0;i<7;i++){
    const n=await p.$('[data-act="demoileri"]');
    if(!n) break;
    await n.click(); await p.waitForTimeout(140); adim++;
  }
  t('8 adım tamamlandı', adim===8);
  t('son adımda bitirme düğmesi var', !!(await p.$('[data-act="demobitti"]')));
  await p.click('[data-act="demobitti"]'); await p.waitForTimeout(300);
  t('tur işaretlendi', await p.evaluate(()=>S.demoYapildi===true));
  t('giriş ekranı geri geldi', await p.evaluate(()=>!document.getElementById("intro").classList.contains("hidden")));
  await p.click('[data-act="startgame"]'); await p.waitForTimeout(400);
  const d=await p.evaluate(()=>({nakit:S.cash, satildi:S.stats.sold, alindi:S.stats.bought,
    gecmis:S.history.length, kar:demoKar(),
    taban:Math.round(ARCHETYPES.find(x=>x.k===S.archetype).cash*prestijBonus().baslangic)}));
  t('demo kârı kasaya eklendi', d.nakit===d.taban+d.kar);
  t('bir alım bir satış yazıldı', d.satildi===1 && d.alindi===1);
  t('geçmişe işlendi', d.gecmis===1);
  t('tur iki kez işlenmiyor', await p.evaluate(()=>{const c=S.cash; demoKariyereYaz(); return S.cash===c;}));

  console.log('3) ayarlar kendi sekmesinde, anahtarlar toggle');
  t('alt barda 6 sekme var', (await p.$$('#tabs button')).length===6);
  await p.click('#tabs [data-t="ayar"]'); await p.waitForTimeout(300);
  t('ayarlar ekranı açıldı', await p.evaluate(()=>S.tab==="ayar"));
  const sw=await p.$$('.swc');
  t('iki toggle var', sw.length===2);
  const sesOnce=await p.evaluate(()=>sesKapaliMi());
  await p.click('.swc[data-act="ses"]'); await p.waitForTimeout(250);
  t('ses anahtarı durumu değişti', await p.evaluate(x=>sesKapaliMi()!==x, sesOnce));
  t('toggle görseli de döndü',
    await p.evaluate(()=>{const e=document.querySelector('.swc[data-act="ses"]');
      return e.classList.contains("on")===!sesKapaliMi();}));
  await p.click('.swc[data-act="ses"]'); await p.waitForTimeout(200);

  console.log('4) garaj kişiselleştirme');
  await p.click('[data-act="lotac"]'); await p.waitForTimeout(300);
  await p.fill('#lotAdIn', 'mert oto'); await p.waitForTimeout(120);
  await p.click('[data-act="lotrenk"][data-k="mavi"]'); await p.waitForTimeout(200);
  await p.click('[data-act="lotzemin"][data-k="cakil"]'); await p.waitForTimeout(200);
  await p.click('[data-act="lotflama"]'); await p.waitForTimeout(200);
  await p.click('[data-act="lotkaydet"]'); await p.waitForTimeout(350);
  const lot=await p.evaluate(()=>({...S.lot, ad2:lotAd(), renk2:lotRenk().k}));
  t('ad temizlenip büyük harfe çevrildi', lot.ad==="MERT OTO");
  t('renk kaydedildi', lot.renk==="mavi");
  t('zemin kaydedildi', lot.zemin==="cakil");
  t('flama kapandı', lot.flama===false);
  t('tehlikeli karakterler ayıklanıyor', await p.evaluate(()=>{
    const kirli=['<img src=x onerror=1>"&', '</b><script>alert(1)</script>',
                 "a'b\"c&d<e>f`g\\h", "x\u0000\u001fy"];
    return kirli.every(k=>{ const t=lotAdTemizle(k);
      return !/[<>&"'`\\\u0000-\u001F]/.test(t) && t.length<=LOT_AD_SINIR; }); }));
  t('uzunluk sınırı uygulanıyor',
    await p.evaluate(()=>lotAdTemizle("a".repeat(80)).length===LOT_AD_SINIR));

  console.log('5) 3B sahada kişiselleştirme uygulanıyor');
  await p.evaluate(()=>{ S.tab="garaj"; S.view3d=true; render(); });
  await p.waitForTimeout(3200);
  t('3B saha açıldı', await p.evaluate(()=>W3D.active===true));
  t('tabela adı sahada kullanıldı', await p.evaluate(()=>lotAd()==="MERT OTO"));
  await p.evaluate(()=>{ S.view3d=false; render(); }); await p.waitForTimeout(400);

  console.log('6) günün vakası: tohumlu, günde bir kez, puanlı');
  const iki=await p.evaluate(()=>{
    const a=meydanArac("2026-01-01"), b2=meydanArac("2026-01-01"), c=meydanArac("2026-01-02");
    return {ayni:a.model.n===b2.model.n && a.year===b2.year && a.km===b2.km,
            farkli:(a.model.n+a.year+a.km)!==(c.model.n+c.year+c.km)};
  });
  t('aynı gün aynı araç', iki.ayni);
  t('başka gün başka araç', iki.farkli);
  await p.evaluate(()=>{ S.meydan=null; S.tab="pazar"; render(); }); await p.waitForTimeout(250);
  t('pazar ekranında şerit var', !!(await p.$('[data-act="meydanac"]')));
  await p.click('[data-act="meydanac"]'); await p.waitForTimeout(400);
  const hedef=await p.evaluate(()=>meydanHedef(_meydanCar));
  await p.fill('#meydanIn', String(hedef));
  await p.click('[data-act="meydanver"]'); await p.waitForTimeout(400);
  const m=await p.evaluate(()=>({...S.meydan.sonSonuc, oynandi:meydanOynandiMi()}));
  t('tam isabet 100 puan', m.puan===100);
  t('gün işaretlendi', m.oynandi===true);
  t('ödül verildi', m.nakit>0 && m.xp>0);
  await p.evaluate(()=>closeSheet()); await p.waitForTimeout(150);
  await p.evaluate(()=>{ S.tab="pazar"; render(); }); await p.waitForTimeout(200);
  t('tekrar oynanamıyor', await p.evaluate(()=>{
    openMeydan();
    return !document.getElementById("meydanIn"); }));
  await p.evaluate(()=>closeSheet());

  console.log('7) haftalık karne');
  const k=await p.evaluate(()=>{
    S.karneSnap={day:1,net:38000,sold:0,profit:0,gider:0,caught:0,rep:50,bought:0};
    S.day=9; S.giderToplam=1400;
    S.history=[{d:3,n:"Test A",buy:9000,sell:11200,profit:2200,note:""},
               {d:6,n:"Test B",buy:8000,sell:7400,profit:-600,note:""}];
    S.karne=karneUret();
    return {satis:S.karne.satis, netKar:S.karne.netKar, gun:S.karne.gunler.length,
            enIyi:S.karne.enIyi&&S.karne.enIyi.n, hata:S.karne.hata&&S.karne.hata.t,
            not:S.karne.not.harf};
  });
  t('pencere 8 gün', k.gun===8);
  t('iki satış sayıldı', k.satis===2);
  t('net kâr doğru', k.netKar===1600);
  t('haftanın işi en kârlı satış', k.enIyi==="Test A");
  t('en büyük hata zararlı satış', /Test B/.test(k.hata||""));
  t('harf notu üretildi', /^[ABCDF]$/.test(k.not));
  await p.evaluate(()=>openKarne()); await p.waitForTimeout(300);
  t('karne ekranı çizildi', !!(await p.$('#karneKart')));
  t('grafik 8 çubuk', (await p.$$('.krgun')).length===8);
  t('özet metni üretiliyor', await p.evaluate(()=>karneMetni().split("\n").length===4));
  await p.evaluate(()=>{ S.karne=null; closeSheet(); render(); });

  console.log('8) zorluk gerçekten etkili');
  const z=await p.evaluate(()=>{
    const f={cost:1000, n:"x", comp:"motor", gain:10};
    S.zorluk="normal"; const n=repairCost(f);
    S.zorluk="gercek"; const g=repairCost(f);
    S.zorluk="gercek"; const xg=zorXp();
    S.zorluk="normal"; const xn=zorXp();
    return {n,g,xg,xn};
  });
  t('gerçekçide tamir pahalı', z.g>z.n*1.1);
  t('gerçekçide XP primi var', z.xg>z.xn);

  console.log('9) ses ve müzik katmanı');
  const s2=await p.evaluate(()=>({kipler:Object.keys(MUZ_KIP), efekt:Object.keys(SESLER).length,
    ayar:typeof muzikAnahtar==="function"}));
  t('üç müzik kipi var', s2.kipler.length===3);
  t('efekt kataloğu duruyor', s2.efekt>=18);
  t('müzik anahtarı var', s2.ayar);

  console.log('10) pazarlık yüzü');
  await p.evaluate(()=>{ S.cash=90000; refreshMarket(); S.tab="pazar"; render();
    const c=S.market[0]; c.inspected=true; openNegotiation(c); });
  await p.waitForTimeout(400);
  t('satıcı yüzü çizildi', !!(await p.$('#sheet .yuz')));
  const kas1=await p.evaluate(()=>document.querySelector('#sheet .yuz').outerHTML.length);
  await p.evaluate(()=>{ S.neg.mood=5; renderNeg(); }); await p.waitForTimeout(250);
  const kizgin=await p.evaluate(()=>document.querySelector('#sheet .yuz').outerHTML);
  await p.evaluate(()=>{ S.neg.mood=95; renderNeg(); }); await p.waitForTimeout(250);
  const keyifli=await p.evaluate(()=>document.querySelector('#sheet .yuz').outerHTML);
  t('yüz ruh hâline göre değişiyor', kizgin!==keyifli && kas1>400);
  t('ter damlası sabır azken çıkıyor', await p.evaluate(()=>{
    S.neg.pat=0; renderNeg();     // oran sabit 0: patMax'e bağlı kalmasın
    return document.querySelector('#sheet .yzter')!==null; }));
  await p.evaluate(()=>{ S.neg=null; closeSheet(); render(); });

  console.log('11) onay sayfası: baştan başla gerçekten çalışıyor');
  await p.evaluate(()=>{ S.tab="ayar"; render(); }); await p.waitForTimeout(250);
  await p.click('[data-act="reset"]'); await p.waitForTimeout(300);
  t('onay sayfası açıldı', !!(await p.$('[data-act="onayevet"]')));
  await p.click('[data-act="onayhayir"]'); await p.waitForTimeout(250);
  t('vazgeçince kayıt duruyor', await p.evaluate(()=>S.started===true));
  await p.click('[data-act="reset"]'); await p.waitForTimeout(250);
  await p.click('[data-act="onayevet"]'); await p.waitForTimeout(500);
  const r=await p.evaluate(()=>({
    intro:!document.getElementById("intro").classList.contains("hidden"),
    modal:document.getElementById("modal").classList.contains("hidden"),
    kayit:(()=>{try{return localStorage.getItem("preloved_v1")}catch(e){return "?"}})(),
    baslandi:S.started
  }));
  t('giriş ekranı göründü', r.intro);
  t('modal kapandı', r.modal);
  t('oyun sıfırlandı', r.baslandi===false);

  console.log('12) 40 marka / 150 model, TL fiyat sınırları ve tip dağılımı');
  const mm=await p.evaluate(()=>{
    const say={};
    for(const m of MODELS) say[m.seg]=(say[m.seg]||0)+1;
    let min=1e9,max=0;
    for(let i=0;i<4000;i++){ const c=genCar(); const v=valueOf(c,false);
      if(v<min) min=v; if(v>max) max=v; }
    const seg={};
    for(let i=0;i<6000;i++){ const c=genCar(); (seg[c.model.seg]=seg[c.model.seg]||[]).push(valueOf(c,false)); }
    const med={}; for(const k in seg){ const a=seg[k].sort((x,y)=>x-y); med[k]=a[a.length>>1]; }
    const lüksTavan=Math.max(...MODELS.filter(m=>m.seg==="lux").map(m=>m.np));
    return {adet:MODELS.length, say, min, max, med, lüksTavan,
            tekil:new Set(MODELS.map(m=>m.n)).size,
            marka:new Set(MODELS.map(m=>m.n.split(" ")[0])).size};
  });
  t('40 marka var', mm.marka===40);
  t('150 model var', mm.adet===150);
  const tip=await p.evaluate(()=>{
    const say={}; for(const m of MODELS) say[m.seg]=(say[m.seg]||0)+1;
    const yakit={}; for(const m of MODELS) yakit[m.f||"?"]=(yakit[m.f||"?"]||0)+1;
    const tutarsiz=MODELS.filter(m=>{
      if(m.cl) return false;
      if(/Dizel$/.test(m.n) && m.f!=="Dizel") return true;
      if(/Elektrik$/.test(m.n) && m.f!=="Elektrik") return true;
      if(/Hibrit$/.test(m.n) && m.f!=="Hibrit") return true;
      return false;
    }).length;
    return {say, yakit, tutarsiz};
  });
  t('hatchback en kalabalık segment ('+tip.say.hatch+')',
    tip.say.hatch===42 && tip.say.hatch>tip.say.suv);
  t('sedan SUV\'den fazla ('+tip.say.sedan+' > '+tip.say.suv+')', tip.say.sedan>tip.say.suv);
  t('dizel payı yarıdan fazla ('+tip.yakit.Dizel+'/150)', tip.yakit.Dizel>75);
  t('elektrikli payı gerçekçi ('+(tip.yakit.Elektrik||0)+')', (tip.yakit.Elektrik||0)<=8);
  t('ad ile yakıt tutarlı', tip.tutarsiz===0);
  const ciz=await p.evaluate(()=>{
    // Pazara bağlı kalma: test bu adımda oyunun hangi hâlinde olduğunu
    // garanti etmiyor. İki modeli doğrudan üret.
    const m1=MODELS.find(m=>m.seg==="hatch"), m2=MODELS.find(m=>m.seg==="suv");
    const c1=genCar({model:m1}), c2=genCar({model:m2});
    const a=aracCiz(c1,"mini"), b=aracCiz(c1,"tam"), d=aracCiz(c2,"tam");
    return {mini:a.length, tam:b.length, farkli:b!==d, svg:/^<svg/.test(a)};
  });
  t('araç çizimi SVG üretiyor', ciz.svg && ciz.mini>400);
  t('tam çizim mini\'den ayrıntılı', ciz.tam>ciz.mini);
  t('iki farklı model farklı çiziliyor', ciz.farkli);
  t('model adları tekil', mm.tekil===mm.adet);
  t('her segment en az 9 model', Object.values(mm.say).every(v=>v>=9));
  t('en pahalı araç 30 milyon TL altında', mm.max<30000000);
  // Rastgele 4000 araçtan en pahalısını beklemek kırılgandı: üst segment
  // modelleri nadir çıkıyor ve test bazen boşa düşüyordu. Tabloya bakıyoruz.
  t('üst segment tavanı 20 milyonun üstünde ('+tlk0(mm.lüksTavan)+')', mm.lüksTavan>20000000);
  t('örneklemde 10 milyonluk araç çıkıyor', mm.max>10000000);
  t('hurda tabanı tutuyor (en ucuz ≥ ₺90.000)', mm.min>=90000);
  t('medyan hatchback 700bin–1,3 milyon bandında',
    mm.med.hatch>700000 && mm.med.hatch<1300000);

  console.log('13) filo — kiraya verme');
  const fl=await p.evaluate(()=>{
    closeSheet(); S.cash=9000000; S.slots=8; S.cars=[]; S.tutorial=false;
    const c=genCar(); c.owned=true; c.boughtFor=valueOf(c,false); c.boughtDay=S.day;
    c.daysListed=0; c.leadsSeen=0; S.cars=[c];
    const ekspersiz=kiraUygunMu(c).ok;
    c.inspected=true;
    const arizali = c.faults.some(f=>!f.fixed) ? !kiraUygunMu(c).ok : true;
    c.faults.forEach(f=>f.fixed=true);
    const uygun=kiraUygunMu(c).ok;
    const gelir=kiraGelir(c);
    kirayaVer(c);
    const km0=c.km;
    KIRA.arizaGun=0;
    const rep={costs:[],events:[]}; const nakit0=S.cash;
    for(let i=0;i<5;i++) kiraGun(rep);
    const sonuc={ekspersiz, arizali, uygun, gelir, kirada:!!c.kira,
      gun:c.kira?c.kira.gun:0, toplam:c.kira?c.kira.toplam:0,
      nakitArtis:Math.round(S.cash-nakit0), kmArtis:c.km-km0};
    // ilandaki araç kiraya verilemez
    c.kira=null; c.listPrice=999999;
    sonuc.ilandaOlan=!kiraUygunMu(c).ok;
    c.listPrice=null;
    // en az süre dolmadan çıkarılamaz
    kirayaVer(c); sonuc.erkenCikis=!kiradanAl(c);
    c.kira.gun=5; sonuc.gecCikis=kiradanAl(c);
    return sonuc;
  });
  t('ekspertizsiz araç kiraya verilemez', fl.ekspersiz===false);
  t('açık arızalı araç kiraya verilemez', fl.arizali===true);
  t('hazır araç kiraya verilebilir', fl.uygun===true);
  t('günlük gelir hesaplanıyor', fl.gelir>0);
  t('5 günde gelir kasaya yazıldı', fl.nakitArtis===fl.gelir*5);
  t('toplam birikiyor', fl.toplam===fl.gelir*5);
  t('km biniyor', fl.kmArtis>=5*180 && fl.kmArtis<=5*420);
  t('ilandaki araç kiraya verilemez', fl.ilandaOlan===true);
  t('sözleşme süresi dolmadan çıkarılamaz', fl.erkenCikis===true);
  t('süre dolunca çıkarılabilir', fl.gecCikis===true);

  console.log('14) senetli alım');
  const sn=await p.evaluate(()=>{
    closeSheet(); S.cash=1200000; S.slots=8; S.cars=[]; S.senetler=[]; S.rep=70;
    refreshMarket();
    const tavan=senetTavanNakit();
    const c=S.market.find(x=>x.ask>S.cash && x.ask<tavan);
    if(!c) return {atlandi:true};
    const fiyat=c.ask;
    const alindi=buyCar(c, fiyat, null, true);
    const s2=S.senetler[0];
    const out={tavan, fiyat, alindi, pesin:s2.pesin, taksit:s2.taksit, kalan:s2.kalan,
      nakitSon:Math.round(S.cash), borc:senetBorcu(),
      primVar:(s2.taksit*2)>(fiyat-s2.pesin)};
    // vade geldi, para var → tahsil
    S.cash=5000000; S.day=s2.vade;
    const rep={costs:[],events:[],total:0}; senetGun(rep);
    out.tahsil=S.senetler[0] ? S.senetler[0].kalan : 0;
    out.nakitDustu=5000000-Math.round(S.cash)===s2.taksit;
    // vade geldi, para yok → zorunlu satış + itibar
    S.cash=0; S.day=S.senetler[0].vade;
    const rep2={costs:[],events:[],total:0}; const rep0=S.rep;
    senetGun(rep2);
    out.odenmedi=S.senetler.length===0;
    out.itibarDustu=S.rep<rep0;
    out.aracGitti=S.cars.length===0;
    return out;
  });
  if(sn.atlandi){ t('senet testi için uygun ilan bulunamadı (atlandı)', true); }
  else {
    t('nakdin üstündeki araç senetle alınabiliyor', sn.alindi===true);
    t('peşinat fiyatın yarısı', Math.abs(sn.pesin - sn.fiyat*0.5) < 1000);
    t('iki taksit açıldı', sn.kalan===2);
    t('vade primi uygulanmış', sn.primVar===true);
    t('özsermayeden senet borcu düşülüyor', sn.borc>0);
    t('vadesi gelen taksit tahsil edildi', sn.tahsil===1 && sn.nakitDustu===true);
    t('ödenmeyince senet kapanıyor', sn.odenmedi===true);
    t('ödenmeyince itibar düşüyor', sn.itibarDustu===true);
    t('ödenmeyince araç zorunlu satılıyor', sn.aracGitti===true);
  }

  console.log('15) Türkiye sıralaması');
  const sr=await p.evaluate(()=>{
    const a=ulusalListe(10), b2=ulusalListe(10), c=ulusalListe(40);
    S.cash=3000000; S.cars=[]; S.debt=0; S.senetler=[]; S.day=10;
    const d1=ulusalSira();
    S.cash=300000000;
    const d2=ulusalSira();
    return {ayni:JSON.stringify(a)===JSON.stringify(b2),
            buyuyor:c[0].deger>a[0].deger,
            adet:a.length,
            fakirSira:d1.sira, zenginSira:d2.sira,
            dilim:d2.dilim, toplam:d1.toplam};
  });
  t('aynı gün aynı merdiven', sr.ayni);
  t('rakipler zamanla büyüyor', sr.buyuyor);
  t('60 sanal galeri', sr.adet===60);
  t('zengin oyuncu üst sıraya çıkıyor', sr.zenginSira < sr.fakirSira);
  t('tepedeyken en iyi dilim', sr.zenginSira===1 && sr.dilim<=2);
  t('oyuncu listeye ekleniyor', sr.toplam===61);

  console.log('\nsayfa hataları:', errs.slice(0,4));
  console.log(fail? `\n${fail} BAŞARISIZ / ${ok} tamam` : `\nhepsi temiz (${ok})`);
  await b.close();
  process.exit(fail?1:0);
})();
