/* Yol, dosyanın kendi konumundan türetiliyor — paketi nereye açarsan aç
   çalışsın diye mutlak yol bırakılmadı. */
const OYUN = require('path').resolve(__dirname, '..');
/* Yeni UX maddeleri + kartı paylaş davranış testi.
   Gerçekten tıklayıp yazarak çalışır. */
const {chromium}=require('playwright');
let ok=0, fail=0;
const t=(ad,kos)=>{ if(kos){ok++;console.log('  ok   '+ad);} else {fail++;console.log('  FAIL '+ad);} };

(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
    args:['--headless=new','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage({viewport:{width:420,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  /* Sabit tohum: pazar, arızalar ve alıcılar her koşuda aynı gelsin. Tohumsuz
     test, denk gelen araca göre farklı kontrollerde kırmızı yanıyordu
     (kârlı tamiri olmayan araç → "Yaptır" düğmesi yok; akış tavana dayanınca
     dil farkı ölçülemiyor). Tohumu UX_TOHUM ile değiştirip başka pazar dene. */
  const TOHUM=+(process.env.UX_TOHUM||20261008);
  await p.addInitScript(t=>{ let a=t>>>0; Math.random=()=>{ a=(a+0x6D2B79F5)>>>0;
    let z=a; z=Math.imul(z^(z>>>15),z|1); z^=z+Math.imul(z^(z>>>7),z|61);
    return ((z^(z>>>14))>>>0)/4294967296; }; }, TOHUM);
  await p.route('**/three.min.js', r=>r.fulfill({path:OYUN+'/three.min.js',contentType:'application/javascript'}));
  await p.goto('file://'+OYUN+'/preloved.html');
  await p.evaluate(()=>{try{localStorage.clear()}catch(e){}});
  await p.reload(); await p.waitForSelector('[data-act="startgame"]');
  await p.click('[data-act="startgame"]'); await p.waitForTimeout(600);
  await p.evaluate(()=>{ S.tutorial=false; S.ogretAdim=99; S.cash=8000000; render(); });
  await p.waitForTimeout(250);

  /* ---------- 1) arama ---------- */
  console.log('1) arama');
  const hepsi=await p.evaluate(()=>S.market.length);
  const ilkAd=await p.evaluate(()=>S.market[0].model.n.split(" ")[0]);
  await p.fill('#araInput', ilkAd);
  await p.waitForTimeout(320);
  const suzulen=await p.evaluate(()=>document.querySelectorAll('#listeKap .card').length);
  t(`"${ilkAd}" araması listeyi daraltıyor (${suzulen}/${hepsi})`, suzulen>0 && suzulen<=hepsi);
  t('arama kutusu odakta kaldı',
    await p.evaluate(()=>document.activeElement && document.activeElement.id==="araInput"));
  t('yazılan metin kutuda duruyor',
    await p.evaluate(()=>document.getElementById("araInput").value)===ilkAd);

  await p.fill('#araInput', 'zzzqqq');
  await p.waitForTimeout(320);
  t('sonuçsuz arama boş durum gösteriyor',
    await p.evaluate(()=>!!document.querySelector('#listeKap .empty')));
  t('boş durumda temizleme düğmesi var',
    await p.evaluate(()=>!!document.querySelector('#listeKap [data-act="arasil"]')));
  await p.click('#listeKap [data-act="arasil"]'); await p.waitForTimeout(300);
  t('temizleyince liste geri geldi',
    await p.evaluate(()=>document.querySelectorAll('#listeKap .card').length)===hepsi);

  /* ---------- 2) sıralama ---------- */
  console.log('2) sıralama');
  await p.selectOption('#siraSec','ucuz'); await p.waitForTimeout(260);
  const artan=await p.evaluate(()=>filteredMarket().map(c=>c.ask));
  t('ucuzdan sıralama artan', artan.every((v,i)=>i===0||artan[i-1]<=v));
  await p.selectOption('#siraSec','pahali'); await p.waitForTimeout(260);
  const azalan=await p.evaluate(()=>filteredMarket().map(c=>c.ask));
  t('pahalıdan sıralama azalan', azalan.every((v,i)=>i===0||azalan[i-1]>=v));
  await p.selectOption('#siraSec','onerilen'); await p.waitForTimeout(200);

  /* ---------- 3) sipariş → pazar filtresi ---------- */
  console.log('3) siparişten pazara filtre');
  await p.evaluate(()=>{
    S.orders=S.orders||[];
    if(!S.orders.length){
      const m=S.market[0];
      S.orders.push({id:9001, who:"Test Bey", line:"Şöyle bir araç arıyorum.",
        seg:m.model.seg, minYear:m.year-2, maxKm:m.km+50000, gear:null,
        butce:Math.round(valueOf(m,false)), prim:50000, deadline:S.day+5});
    }
    render();
  });
  await p.waitForTimeout(300);
  // Siparişler artık BUGÜN rayında birer kart; filtre düğmesi kartın sayfasında.
  t('sipariş BUGÜN rayında kart olarak duruyor', !!(await p.$('.ray [data-act="sipac"]')));
  await p.evaluate(()=>document.querySelector('.ray [data-act="sipac"]').click());
  await p.waitForTimeout(350);
  const sipBtn=await p.$('[data-act="sipfiltre"]');
  if(sipBtn){ await sipBtn.click(); await p.waitForTimeout(350); }
  const filtreAktif=await p.evaluate(()=>!!S.siparisFiltre);
  t('sipariş filtresi devreye girdi', filtreAktif);
  t('filtre şeridi görünüyor', await p.evaluate(()=>!!document.querySelector('.sipserit')));
  const uyumlu=await p.evaluate(()=>{
    const o=S.orders.find(x=>x.id===S.siparisFiltre);
    return o ? filteredMarket().every(c=>siparisKabaUyar(o,c)) : false;
  });
  t('listede yalnızca şartlara uyanlar var', uyumlu);
  await p.click('.sipserit button'); await p.waitForTimeout(300);
  t('filtre kaldırıldı', await p.evaluate(()=>!S.siparisFiltre));

  /* ---------- 4) kâr penceresi ---------- */
  console.log('4) kâr penceresi ve ilk alıcı');
  await p.evaluate(()=>{
    const c=S.market[0]; buyCar(c, Math.round(c.ask*0.9), "pazar");
    const m=S.cars[S.cars.length-1];
    m.inspected=true; m.faults.forEach(f=>f.fixed=true);
    m.listPrice=Math.round(valueOf(m,false)*1.1/500)*500;
    S.tab="garaj"; S.garajTab="satis"; render();
  });
  await p.waitForTimeout(350);
  t('satıştaki kartta karar şeridi var',
    await p.evaluate(()=>!!document.querySelector('#listeKap .pencere')));
  const w=await p.evaluate(()=>{
    const c=S.cars.find(x=>x.listPrice); return c?satisPenceresi(c):null; });
  t('pencere sayıları tutarlı (alt ≤ üst)', w && w.altKar<=w.ustKar);
  t('gün aralığı tutarlı (alt ≤ üst, ikisi de ≥1)', w && w.gunAlt>=1 && w.gunAlt<=w.gunUst);
  const ucuz=await p.evaluate(()=>{
    const c=S.cars.find(x=>x.listPrice);
    const eski=c.listPrice, eskiSatis=S.stats.sold;
    S.stats.sold=5;   // acemi çarpanında ikisi de "1 gün"e dayanıyordu
    c.listPrice=Math.round(valueOf(c,false)*0.85/500)*500;
    const a=satisPenceresi(c).gunUst;
    c.listPrice=Math.round(valueOf(c,false)*1.35/500)*500;
    const bb=satisPenceresi(c).gunUst;
    c.listPrice=eski; S.stats.sold=eskiSatis;
    return {ucuzGun:a, pahaliGun:bb};
  });
  t(`ucuz ilan daha hızlı satıyor (${ucuz.ucuzGun} < ${ucuz.pahaliGun} gün)`,
    ucuz.ucuzGun < ucuz.pahaliGun);

  /* ---------- 5) garajda arama ve boş durum ---------- */
  console.log('5) garaj');
  await p.evaluate(()=>{ S.garajTab="teklif"; S.offers=[]; S.araGaraj=""; render(); });
  await p.waitForTimeout(300);
  t('boş teklif bölümünde eylem düğmesi var',
    await p.evaluate(()=>!!document.querySelector('#listeKap .bosbtn .btn')));
  await p.evaluate(()=>{ S.garajTab="satis"; render(); }); await p.waitForTimeout(250);

  /* ---------- 6) tek sayfalık gün raporu ---------- */
  console.log('6) gün raporu');
  await p.evaluate(()=>{ S.tab="pazar"; render(); }); await p.waitForTimeout(250);
  await p.click('[data-act="endday"]'); await p.waitForTimeout(900);
  const rap=await p.evaluate(()=>{
    const m=document.getElementById('modal');
    return { acik:!m.classList.contains('hidden'),
             ozet:!!m.querySelector('.raporozet'),
             adim:!!m.querySelector('.steps'),
             ileri:!!m.querySelector('[data-act="reportnext"]'),
             kasa:!!m.querySelector('.kasafold') };
  });
  t('rapor açıldı', rap.acik);
  t('üç kutuluk özet var', rap.ozet);
  t('iki adımlı akış kaldırıldı', !rap.adim && !rap.ileri);
  t('kasa hareketi katlanabilir blokta', rap.kasa);
  await p.evaluate(()=>{ S.report=null; closeSheet(); render(); }); await p.waitForTimeout(250);

  /* ---------- 7) kartı paylaş ---------- */
  console.log('7) kartı paylaş');
  const kart=await p.evaluate(()=>{
    const g=meydanGun(); const cv=kartSoru(meydanArac(g), g);
    return {w:cv.width, h:cv.height, veri:cv.toDataURL('image/png').length};
  });
  t('soru kartı 1080×1920', kart.w===1080 && kart.h===1920);
  t('kart gerçekten çizildi (boş değil)', kart.veri>20000);
  const kart2=await p.evaluate(()=>{
    const g=meydanGun();
    const cv=kartSonuc({ad:"Test 2019",puan:72,cevap:800000,hedef:900000,sap:-11.1,seri:3},g);
    return {w:cv.width,h:cv.height,veri:cv.toDataURL('image/png').length};
  });
  t('sonuç kartı 1080×1920', kart2.w===1080 && kart2.h===1920);
  t('sonuç kartı çizildi', kart2.veri>20000);

  await p.evaluate(()=>{ S.tab="pazar"; render(); }); await p.waitForTimeout(200);
  await p.click('[data-act="meydanac"]'); await p.waitForTimeout(500);
  const pb=await p.$('[data-act="paylasac"]');
  t('vaka ekranında paylaş düğmesi var', !!pb);
  if(pb){ await pb.click(); await p.waitForTimeout(600); }
  t('paylaşım sayfası önizleme gösteriyor',
    await p.evaluate(()=>{ const i=document.querySelector('.kartonizle');
      return !!(i && i.src && i.src.startsWith('data:image/png')); }));
  t('kaydet düğmesi var', await p.evaluate(()=>!!document.querySelector('[data-act="kartaktar"]')));

  /* ---------- 8) tamir atölyesi ----------
     Tamir alanı iki ekranda da EN ÜSTTE ve raporun kâğıdından ayrı bir
     panel olarak durmalı. Rapor blokları arasına geri kayarsa oyuncu onu
     bulamıyor — bu testin varlık sebebi o. */
  console.log('8) tamir atölyesi');
  await p.evaluate(()=>{ S.sheet=null; closeSheet(); S.tab="pazar"; S.cash=9000000; render(); });
  await p.waitForTimeout(250);
  const arac=await p.evaluate(()=>{
    const c=S.market.find(x=>x.faults.length>=1)||S.market[0];
    buyCar(c, c.ask, "pazar");
    const m=S.cars[S.cars.length-1];
    m.inspected=true; m.cosmetic=false;
    closeSheet(); render(); openOwnCar(m);
    return {id:m.id, ariza:m.faults.filter(f=>!f.fixed).length};
  });
  await p.waitForTimeout(400);
  const ao=await p.evaluate(()=>{
    const a=document.querySelector('.atolye'); if(!a) return {yok:true};
    const bloklar=[...document.querySelectorAll('#modal .block, #modal .atolye')];
    return { var:true, sira:bloklar.indexOf(a),
             dolgu:!!a.querySelector('.ise-btn'),
             fiyat:!!a.querySelector('.ise-btn em') };
  });
  t('kendi aracım sayfasında atölye var', !!ao.var);
  t('atölye bloklardan önce geliyor', ao.sira===0);
  t('Yaptır düğmesinde fiyat yazıyor', !!ao.fiyat);

  await p.evaluate(id=>openCarFile(id,"own"), arac.id);
  await p.waitForTimeout(400);
  const af=await p.evaluate(()=>{
    const a=document.querySelector('.atolye');
    const s=document.querySelector('.sheet.belge');
    if(!a||!s) return {yok:true};
    const bloklar=[...document.querySelectorAll('#modal .block, #modal .atolye')];
    const z=getComputedStyle(a);
    return { belge:true, sira:bloklar.indexOf(a),
             // kâğıdın üstünde kendi zemini (eylem renginin tülü) olmalı
             ayri: z.backgroundImage.indexOf('gradient')>=0,
             dugmeRenk: (()=>{ const x=a.querySelector('.btn.primary');
               return x?getComputedStyle(x).backgroundColor:""; })() };
  });
  t('araç dosyası kâğıt yüzeyinde', !!af.belge);
  t('atölye raporun ilk bloğundan önce', af.sira===0);
  t('atölye kâğıttan ayrı bir yüzey', !!af.ayri);
  t('Yaptır dolu eylem rengi düğme', af.dugmeRenk==='rgb(14, 94, 75)');

  const once=await p.evaluate(()=>S.cash);
  const btn=await p.$('.atolye .ise-btn:not([disabled])');
  if(btn){ await btn.click(); await p.waitForTimeout(450); }
  const sonra=await p.evaluate(()=>({
    kalan:document.querySelectorAll('.atolye .isemri').length,
    baslik:(document.querySelector('.sheet-title')||{}).textContent||"",
    nakit:S.cash }));
  t('tamir uygulandı, nakit düştü', sonra.nakit<once);
  t('tamirden sonra araç dosyasında kalındı', /Ara./.test(sonra.baslik));

  /* ---------- 9) kaydırma konumu ----------
     Aynı sayfa yeniden çizildiğinde oyuncu sayfanın başına fırlamamalı.
     (Playwright'ın kendi click'i düğmeyi görünür kılmak için kaydırıyor;
     ölçümü bozmasın diye DOM üzerinden tetikliyoruz.) */
  console.log('9) kaydırma konumu');
  await p.evaluate(()=>{ closeSheet(); S.tab="garaj"; render(); });
  await p.waitForTimeout(200);
  await p.evaluate(id=>openCarFile(id,"own"), arac.id);
  await p.waitForTimeout(350);
  const kt=await p.evaluate(()=>{
    const el=document.getElementById("sheet");
    const b=[...el.querySelectorAll('.atolye .ise-btn:not([disabled])')].pop();
    if(!b) return null;
    el.scrollTop=Math.max(0, b.getBoundingClientRect().top-el.getBoundingClientRect().top-260);
    return el.scrollTop;
  });
  if(kt!=null){
    await p.waitForTimeout(120);
    await p.evaluate(()=>[...document.querySelectorAll('.atolye .ise-btn:not([disabled])')].pop().click());
    await p.waitForTimeout(450);
    const ks=await p.evaluate(()=>document.getElementById("sheet").scrollTop);
    t('tamirden sonra kaydırma konumu korunuyor', kt<10 || Math.abs(ks-kt)<40);
  }

  await p.evaluate(()=>{ closeSheet(); S.neg=null; S.tab="pazar"; render(); });
  await p.waitForTimeout(250);
  const mk=await p.$('.card'); if(mk){ await mk.click(); await p.waitForTimeout(500); }
  const nbtn=await p.$('[data-act="negotiate"]');
  if(nbtn){ await nbtn.click(); await p.waitForTimeout(700); }
  for(let i=0;i<3;i++){
    await p.evaluate(j=>{ const m=document.querySelectorAll('.mv'); if(m.length) m[j%m.length].click(); }, i);
    await p.waitForTimeout(380);
  }
  const po=await p.evaluate(()=>{
    const el=document.getElementById("sheet"); el.scrollTop=el.scrollHeight; return el.scrollTop; });
  await p.waitForTimeout(120);
  await p.evaluate(()=>{ const m=document.querySelector('.mv'); if(m) m.click(); });
  await p.waitForTimeout(650);
  const pz=await p.evaluate(()=>{
    const s=document.getElementById("sheet"), tb=document.querySelector('#sheet .talk');
    if(!tb) return {yok:true};
    const sr=s.getBoundingClientRect();
    const bub=[...tb.querySelectorAll('.bub')].pop();
    const br=bub?bub.getBoundingClientRect():null;
    return { scroll:Math.round(s.scrollTop),
             balonGorunur: br? (br.top>=sr.top-3 && br.bottom<=sr.bottom+5) : false,
             altta: Math.abs(tb.scrollTop+tb.clientHeight-tb.scrollHeight)<6 };
  });
  /* talkAlta() cevap balonu görünsün diye sayfayı GEREKTİĞİ KADAR kaydırıyor;
     en alttayken balon kutusu yukarıda kalırsa ~100 px çıkılabiliyor. Kusur
     sayılan şey başa fırlamak: yer korunmalı ya da yalnız balona kadar kaymalı. */
  t('pazarlıkta hamle sonrası kaydırma korunuyor', po<10 || Math.abs(pz.scroll-po)<40 ||
    (pz.balonGorunur && pz.scroll>po*0.5));
  t('pazarlıkta son mesaj görünür kalıyor', pz.balonGorunur && pz.altta);
  await p.evaluate(()=>{ S.neg=null; closeSheet(); render(); }); await p.waitForTimeout(200);

  /* ---------- 10) uzmanlık katmanı ---------- */
  console.log('10) model karakteri, kademeli ekspertiz, defter');
  const kar=await p.evaluate(()=>{
    const m=MODELS.find(x=>x.zf.length===2 && !x.cl);
    const olc=(km)=>{ let imza=0, top=0;
      for(let i=0;i<1200;i++){ const c=genCar({model:m, km});
        for(const f of c.faults){ top++; if(m.zf.includes(f.k)) imza++; } }
      return top? imza/top : 0; };
    return { hepsindeZf: MODELS.every(x=>x.zf&&x.zf.length&&x.km!=null),
             ust:+olc(m.km*1000+60000).toFixed(3),
             alt:+olc(Math.round(m.km*1000*0.3)).toFixed(3),
             duz:+(m.zf.length/FAULTS.length).toFixed(3) };
  });
  t('150 modelin hepsinde imza arıza ve km eşiği var', kar.hepsindeZf);
  t('imza arıza düz havuzdan belirgin sık', kar.ust > kar.duz*2.5);
  t('km eşiği üstünde daha da sık', kar.ust > kar.alt*1.15);

  await p.evaluate(()=>{ closeSheet(); S.tab="pazar"; S.cash=9000000; render(); });
  await p.waitForTimeout(250);
  const mk2=await p.$('.card'); if(mk2){ await mk2.click(); await p.waitForTimeout(500); }
  const bak=await p.evaluate(()=>({
    panel:!!document.querySelector('.bakis'),
    organ:document.querySelectorAll('.bakbtn').length,
    tam:!!document.querySelector('.bakis [data-act="eksper"]')
  }));
  t('kademeli ekspertiz paneli var', bak.panel && bak.tam);
  t('beş organ ayrı ayrı seçilebiliyor', bak.organ===5);
  const nOnce=await p.evaluate(()=>S.cash);
  await p.evaluate(()=>document.querySelector('.bakbtn:not([disabled])').click());
  await p.waitForTimeout(400);
  const bak2=await p.evaluate(()=>{
    const c=S.market.find(x=>(x.bakilan||[]).length);
    return {acilan:c?c.bakilan.length:0, kalan:document.querySelectorAll('.bakbtn').length};
  });
  t('hızlı bakış tek organ açıyor', bak2.acilan===1 && bak2.kalan===4);
  t('hızlı bakış ücretli', await p.evaluate(c=>S.cash<c, nOnce));

  const def=await p.evaluate(()=>{
    S.notlar={};
    const m=MODELS[3];
    for(let i=0;i<8;i++){ const c=genCar({model:m, km:(m.km||200)*1000+40000});
      c.inspected=true; notAl(c,true); }
    const n=notBilgi(m);
    return {not:!!n, say:n?n.say:0, satir:notSatiri(m).indexOf('Defterin')>0};
  });
  t('defter aynı modelde tekrar eden arızayı öğreniyor', def.not && def.say>=2);
  t('defter satırı ekranda gösteriliyor', def.satir);

  /* ---------- 11) rakipler, ilan kompozisyonu ---------- */
  console.log('11) rakipler ve ilan');
  const rak=await p.evaluate(()=>{
    const gorulen=new Set(); for(let i=0;i<60;i++) newRivals().forEach(x=>gorulen.add(x.n));
    const latin=RIVAL_DEFS.filter(r=>/^[\x00-\x7F]+$/.test(r.n) && !/[çğıöşüÇĞİÖŞÜ]/.test(r.n)
      && !/Oto|Galeri|Motors|Otomotiv/.test(r.n));
    // satın alma sonrası karakter kayması
    const once=S.rivals.map(x=>rivalDef(x,0).n);
    const kopya=S.rivals.slice(1);
    const sonra=kopya.map((x,i)=>rivalDef(x,i).n);
    return {havuz:gorulen.size, rol:new Set(S.rivals.map(x=>RIVAL_DEFS[x.di].rol)).size,
            yabanci:latin.length, kaymaYok: sonra.every((n,i)=>n===once[i+1])};
  });
  t('rakip isim havuzu dönüyor', rak.havuz>=8);
  t('her oyunda dört farklı rol', rak.rol===4);
  t('rakipler satın alınınca karakter kaymıyor', rak.kaymaYok);

  const ilan=await p.evaluate(()=>{
    S.cash=50000000;
    const c=S.market.find(x=>hiddenIssues(x).length>=1)||S.market[0];
    buyCar(c,c.ask,"pazar"); const m=S.cars[S.cars.length-1];
    m.listPrice=Math.round(valueOf(m,true));
    /* Acemi çarpanı (×2,4) ve kampanya akışı tavana (%92) dayandırınca üç dil
       aynı sayıyı veriyordu; karşılaştırma tavandan uzakta yapılmalı. */
    const eskiSatis=S.stats.sold, eskiKamp=S.marketingDays;
    S.stats.sold=5; S.marketingDays=0;
    const olc=(dil)=>{ m.ilanDili=dil; m.disclosed=(dil==="durust");
      let akis=0, tek=0, n=0, kacan=0, yakalanan=0;
      for(let i=0;i<2500;i++){ akis+=leadChance(m,S);
        const bu=makeBuyer(m,S);
        if(bu.walk){ kacan++; continue; }
        if(bu.caught) yakalanan++;
        tek+=bu.offer; n++; }
      return {akis:akis/2500, teklif:tek/Math.max(1,n),
              kacma:kacan/2500, yakalanma:yakalanan/2500}; };
    const d=olc("durust"), g=olc("muglak"), a=olc("abartili");
    S.stats.sold=eskiSatis; S.marketingDays=eskiKamp;
    return {id:m.id, akisArtiyor: d.akis<g.akis && g.akis<a.akis,
            // Dürüstlüğün bedeli var (kimse bakmazsa gizlemek daha çok
            // kazandırır); karşılığı güvenlik: asla yakalanmaz, kimse kaçmaz.
            durustGuvenli: d.kacma===0 && d.yakalanma===0,
            abartiliRiskli: a.kacma>g.kacma,
            // Aynı riski alan iki ilan arasında dürüst dil daha iyi alıcı
            // getiriyor: kalite çarpanı abartılıdan yüksek.
            kaliteSirasi: ILAN_DILI.durust.kalite>ILAN_DILI.muglak.kalite
                       && ILAN_DILI.muglak.kalite>ILAN_DILI.abartili.kalite};
  });
  t('abartılı ilan daha çok alıcı getiriyor', ilan.akisArtiyor);
  t('dürüst ilanda kimse kaçmıyor, kimse yakalamıyor', ilan.durustGuvenli);
  t('abartılı ilan alıcıyı daha çok kaçırıyor', ilan.abartiliRiskli);
  t('alıcı kalitesi dürüstten abartılıya düşüyor', ilan.kaliteSirasi);

  await p.evaluate(id=>{ const m=S.cars.find(x=>x.id===id); m.listPrice=null; m.ilanDili="muglak"; m.sunum=0;
    closeSheet(); openOwnCar(m); }, ilan.id);
  await p.waitForTimeout(400);
  t('ilan paneli altı seçenekle açılıyor',
    await p.evaluate(()=>document.querySelectorAll('.ilan .ilansec').length===6));
  await p.evaluate(()=>document.querySelectorAll('[data-act="ilandil"]')[0].click());
  await p.waitForTimeout(300);
  await p.evaluate(()=>document.querySelector('[data-act="list"]').click());
  await p.waitForTimeout(350);
  t('dürüst ilan kusurları açıklanmış sayılıyor',
    await p.evaluate(id=>{ const m=S.cars.find(x=>x.id===id); return m.disclosed===true && m.ilanDili==="durust"; }, ilan.id));

  /* ---------- 12) görsel katman ---------- */
  console.log('12) kart, mühür, sahne, sezon');
  await p.evaluate(()=>{ closeSheet(); S.tab="pazar"; render(); });
  await p.waitForTimeout(300);
  const kartK=await p.evaluate(()=>{
    const k=document.querySelector('.card.kart2');
    if(!k) return {yok:true};
    // 3B fotoğraf hazırsa img, değilse 2B yer tutucu: ikisi de tam genişlik olmalı
    const svg=k.querySelector('.kart-sahne img.aracfoto')||k.querySelector('.kart-sahne svg.aracsvg');
    const ad=k.querySelector('.kart-ad');
    return { var:true, cizim:!!svg, cizimGenis: svg? svg.getBoundingClientRect().width>200 : false,
             tekSatir: ad? ad.getBoundingClientRect().height<30 : false };
  });
  t('pazar kartında araç çizimi tam genişlikte', kartK.cizim && kartK.cizimGenis);
  t('kart başlığı tek satır', kartK.tekSatir);

  const muh=await p.evaluate(()=>{
    const c=S.market[0]; c.inspected=true; c.tramer=Math.round(valueOf(c,false)*0.2); c.degisen=3;
    closeSheet(); openMarketCar(c);
    const e=document.querySelector('.muhur');
    const bar=document.querySelector('.belge .bar-row');
    return e? {var:true, sinif:e.className,
               cakismaYok: bar? e.getBoundingClientRect().bottom <= bar.getBoundingClientRect().top+6 : null}
            : {var:false};
  });
  t('ekspertiz mührü basılıyor', muh.var && /agir/.test(muh.sinif));
  t('mühür rapor satırlarını örtmüyor', muh.cakismaYok!==false);

  await p.evaluate(()=>{ closeSheet(); S.neg=null; S.tab="pazar"; render(); });
  await p.waitForTimeout(250);
  const mc=await p.$('.card'); if(mc){ await mc.click(); await p.waitForTimeout(450); }
  const nb2=await p.$('[data-act="negotiate"]');
  if(nb2){ await nb2.click(); await p.waitForTimeout(650); }
  const sah=await p.evaluate(()=>{
    const s=document.querySelector('.sahne');
    if(!s) return {yok:true};
    const f=s.querySelector('.sahne-fiyat b'), y=s.querySelector('.sahne-yuz');
    const fr=f.getBoundingClientRect(), yr=y.getBoundingClientRect();
    return { var:true, arac:!!s.querySelector('.sahne-arac svg, .sahne-arac img.aracfoto'),
             fiyatBuyuk: parseFloat(getComputedStyle(f).fontSize)>=22,
             cakismaYok: fr.bottom<=yr.top+2 || fr.left>=yr.right-2 };
  });
  t('pazarlık sahnesi kuruldu', sah.var && sah.arac);
  t('istenen fiyat ekranın en büyük tipografisi', sah.fiyatBuyuk);
  t('fiyat satıcı kartıyla çakışmıyor', sah.cakismaYok);
  await p.evaluate(()=>{ S.neg=null; closeSheet(); render(); });

  const sz=await p.evaluate(()=>{
    const out=[];
    for(const g of [3,20,35,50]){ S.day=g; renderHud();
      out.push(document.documentElement.dataset.sezon); }
    return out;
  });
  t('dört sezon dört ayrı zemin ışığı', new Set(sz).size===4);

  /* ---------- 13) galerinin yeri ---------- */
  console.log('13) kira, kontenjan, kaçan fırsat');
  const eko=await p.evaluate(()=>{
    const o={};
    for(const a of ARCHETYPES){ S.archetype=a.k; S.slots=4; S.xp=0;
      o[a.k]={slot:slotFiyat(), kira:sezonKirasi()}; }
    S.archetype="usta"; S.slots=4;
    const bas={}; for(const xp of [0,4100]){ S.xp=xp; bas["sv"+level()]=sezonKirasi(); }
    return {o, bas};
  });
  t('üç arketipin büyüme maliyeti farklı',
    new Set(Object.values(eko.o).map(x=>x.slot)).size===3);
  t('üç arketipin kirası farklı',
    new Set(Object.values(eko.o).map(x=>x.kira)).size===3);
  t('yeri bol olan Otoparkçı ucuz büyüyor, pahalı kira ödüyor',
    eko.o.otoparkci.slot<eko.o.dilbaz.slot && eko.o.otoparkci.kira>eko.o.dilbaz.kira);
  const svler=Object.values(eko.bas);
  t('kira seviyeyle basamak atlıyor', svler[1]>svler[0]*1.4);

  const yer=await p.evaluate(()=>{
    S.tutorial=false;S.ogretAdim=99;S.archetype="usta";S.cash=40000000;S.slots=2;S.xp=0;
    S.cars=[]; S.doluGun=0; S.kacan=null; S.dukkan=null;
    S.stats.kacanFirsat=0; S.stats.kacanKar=0;
    // Önceki bölümlerden kalan pazarı değil, kendi kurduğumuz pazarı ölç:
    // test başka testlerin aldığı araçlara bağlı kalmasın.
    S.market=[]; for(let i=0;i<6;i++) S.market.push(genCar());
    for(let i=0;i<2;i++) buyCar(S.market[i], S.market[i].ask, "pazar");
    closeSheet();
    const kelepir=()=>{ const k=genCar(); k.ask=Math.round(valueOf(k,true)*0.6/500)*500;
                        S.market.unshift(k); };
    const eskiSans=GALERI.firsatSans; GALERI.firsatSans=1;  // test deterministik olsun
    kelepir();
    const r1={events:[],costs:[]}; yerGun(r1);
    const kacan=S.kacan;
    const r2={events:[],costs:[]}; yerGun(r2);
    const alindi=!!kacan && !S.market.find(c=>c.id===kacan.id);
    /* Sayaç burada okunuyor: aşağıdaki döngü dükkân açılana dek yeni
       kaçan fırsatlar üretip sayacı artırıyor, sonda okumak pazarın
       rastgeleliğine göre 1 ya da 2 veriyordu. */
    const sayac=S.stats.kacanFirsat;
    for(let i=0;i<6 && !S.dukkan;i++){ kelepir(); yerGun({events:[],costs:[]}); }
    GALERI.firsatSans=eskiSans;
    return {dolu:yerDolu(), kacanVar:!!kacan, kacanKar:kacan&&kacan.kar>0,
            rakipAldi:alindi, sayac, dukkan:!!S.dukkan,
            dukkanSlot:S.dukkan&&S.dukkan.slot, sure:S.dukkan&&S.dukkan.bitis>S.day};
  });
  t('yer dolunca kaçan kelepir işaretleniyor', yer.dolu && yer.kacanVar && yer.kacanKar);
  t('ertesi gün rakip o aracı alıyor', yer.rakipAldi && yer.sayac===1);
  t('üst üste dolu kalınca yandaki dükkân açılıyor', yer.dukkan && yer.dukkanSlot===2);
  t('dükkân teklifinin süresi var', !!yer.sure);

  await p.evaluate(()=>{ closeSheet(); S.tab="galeri"; S.xp=4200; render(); });
  await p.waitForTimeout(350);
  t('galeri ekranında yer bloğu var',
    await p.evaluate(()=>!!document.querySelector('.yer .yer-kutu i')));
  const dk=await p.evaluate(()=>{
    const b=document.querySelector('[data-act="dukkanal"]'); if(!b) return null;
    const once=S.slots; b.click(); return {once, sonra:S.slots, teklif:!!S.dukkan};
  });
  t('dükkân alınınca kontenjan iki artıyor ve teklif kapanıyor',
    dk && dk.sonra===dk.once+2 && !dk.teklif);

  const stop=await p.evaluate(()=>{
    const m=MODELS.find(x=>x.seg==="ticari"), s=MODELS.find(x=>x.seg==="sedan");
    const a=aracSvg(aracKimlik(m.n,m.seg,aracDonem(m)),{renk:"#E9ECEF"},"tam");
    const b=aracSvg(aracKimlik(s.n,s.seg,aracDonem(s)),{renk:"#E9ECEF"},"tam");
    return {van:/rect[^>]*fill="#C8392E"/.test(a), oto:/path[^>]*fill="#C8392E"/.test(b)};
  });
  t('panelvanda dik stop lambası', stop.van);
  t('otomobilde yatay stop lambası', stop.oto);


  /* ---------- 9) BUGÜN rayı, boş sahneler, sayfa eylem çubuğu ---------- */
  console.log('9) bugün rayı ve cila');
  const ray=await p.evaluate(()=>{
    closeSheet(); S.tab="pazar"; S.parti=partiUret(); S.konsTeklif=konsTeklifUret(); render();
    const kartlar=[...document.querySelectorAll('.ray .ajkart')].map(b=>b.dataset.act);
    const ray=document.querySelector('.ray').getBoundingClientRect();
    const ilk=document.querySelector('#listeKap .card');
    return {kartlar, rayH:ray.height, listeUst:ilk?ilk.getBoundingClientRect().top:9999};
  });
  t('rayda parti, emanet, görev, vaka ve hedef kartı var',
    ['partiac','konsac','gorevac','meydanac','hedefac'].every(k=>ray.kartlar.includes(k)));
  t(`ray tek satır (${Math.round(ray.rayH)}px)`, ray.rayH<140);
  t(`ilk ilan ilk ekranın içinde başlıyor (${Math.round(ray.listeUst)}px)`, ray.listeUst<620);
  for(const k of ['partiac','konsac','gorevac','hedefac']){
    await p.evaluate(k=>{ closeSheet(); document.querySelector(`.ray [data-act="${k}"]`).click(); },k);
    await p.waitForTimeout(250);
    t(`"${k}" kartı kendi sayfasını açıyor`, await p.evaluate(()=>!document.getElementById('modal').classList.contains('hidden')));
  }
  const gap=await p.evaluate(()=>{
    closeSheet(); openMarketCar(S.market[0]);
    const sh=document.querySelector('.sheet'), ab=sh.querySelector('.actionbar');
    return Math.round(sh.getBoundingClientRect().bottom-ab.getBoundingClientRect().bottom);
  });
  t(`sayfa eylem çubuğu dibe oturuyor (aralık ${gap}px)`, Math.abs(gap)<=1);
  const bos=await p.evaluate(()=>{
    closeSheet(); const eski=S.cars; S.cars=[]; S.tab="garaj"; render();
    const g=!!document.querySelector('.bossahne'); S.cars=eski;
    S.auction=[]; S.xp=Math.max(S.xp,400); S.tab="muzayede"; render();
    const m=document.querySelector('.bosdurum .bd-bas');
    return {g, m:m?m.textContent:""};
  });
  t('boş garajda park sahnesi çiziliyor', bos.g);
  t('boş müzayede bir sonraki kuruluşu söylüyor', /m(ü|&uuml;)zayede/i.test(bos.m));
  const yuz=await p.evaluate(()=>{ S.xp=4200; S.tab="galeri"; render();
    return document.querySelectorAll('.contact .cav.yuzlu svg').length; });
  t('tanıdıklar harf yerine yüzle çiziliyor', yuz>=5);
  const rk=await p.evaluate(()=>{
    closeSheet(); S.parti=null; S.partiSon=-99; S.karne=null;
    const eski=PARTI.sans; PARTI.sans=1; nextDay(); PARTI.sans=eski;
    S.karne=null; if(S.report) S.report.seasonSeen=true; openReport();
    const g=document.querySelector('.olaygit[data-act="partiac"]'); if(!g) return null;
    g.click(); return document.querySelector('#modal .partiler')?true:false;
  });
  t('gün raporundan partiye tek dokunuşla gidiliyor', rk===true);

  /* ---------- 10) 3B model profili: 2B ile tek kaynak ---------- */
  console.log('11) 3B profil');
  const p3=await p.evaluate(()=>{
    if(typeof W3D_profil3B!=="function") return {yok:true};
    const anah=new Set(), segFark={}, eksik=[];
    for(const m of MODELS){
      const pr=W3D_profil3B(m), im=W3D_imza3B(m);
      anah.add([pr.L,pr.roof,pr.hood,pr.rakeF].join(","));
      if(!pr.L||!pr.roof||!im.far||!im.izgaraTip) eksik.push(m.n);
      (segFark[m.seg]=segFark[m.seg]||[]).push(pr.L);
    }
    const ort=a=>a.reduce((x,y)=>x+y,0)/a.length;
    return {farkli:anah.size, toplam:MODELS.length, eksik,
            hatchKisa: ort(segFark.hatch)<ort(segFark.sedan), luxUzun: ort(segFark.lux)>ort(segFark.sedan)};
  });
  t(`her modelin kendi 3B gövdesi var (${p3.farkli}/${p3.toplam})`, !p3.yok && p3.farkli>=p3.toplam*0.95);
  t('her modelin far ve ızgara imzası var', !p3.yok && p3.eksik.length===0);
  t('segment boyları gerçekçi sırada (hatch < sedan < lüks)', p3.hatchKisa && p3.luxUzun);
  const tasma=await p.evaluate(async()=>{
    /* Far/ızgara panelleri burnun 12 cm'den gerisine, iç taban gövdenin
       dışına taşmasın — çamurluktaki "pençe izi" ve kapı altındaki
       kahverengi bant bu iki taşmaydı. Sahne yoksa 3B'yi açıp ölç. */
    if(!window.W3D_buildCar){ toggle3d(true); await new Promise(r=>setTimeout(r,2500)); }
    const sorun=[];
    for(const m of MODELS.filter((_,i)=>i%10===0)){
      const c=genCar(); c.model=m; c.faults=[];
      const car=W3D_buildCar(c,true), L=car.userData.size.l, xAt=car.userData.xAt;
      for(const ch of car.children){
        if(!/^(far|farA|izgara)$/.test(ch.name)) continue;
        const pz=ch.geometry.attributes.position;
        for(let i=0;i<pz.count;i++) if(pz.getZ(i)>-L/2+.15){ sorun.push(m.n+" "+ch.name); break; }
      }
    }
    return sorun;
  });
  t(`far ve ızgara burnun önünde kalıyor (${tasma.length} sorun)`, tasma.length===0);

  /* ---------- 12) her düğmenin bir karşılığı var + vaka kapanıyor ---------- */
  console.log('13) ölü düğme yok');
  {
    const fs=require('fs'), yol=require('path');
    const kaynak=fs.readdirSync(OYUN).filter(f=>f.endsWith('.js')&&!f.startsWith('_'))
      .map(f=>fs.readFileSync(yol.join(OYUN,f),'utf8')).join('\n');
    const eylem=new Set([...kaynak.matchAll(/data-act="([a-zA-Z0-9]+)"/g)].map(m=>m[1]));
    // ui.js'teki a==="x" dalları ve kanca.js üzerinden kaydolan KANCA.eylem.x işleyicileri
    const karsilik=new Set([...kaynak.matchAll(/a===\"([a-zA-Z0-9]+)\"/g), ...kaynak.matchAll(/KANCA\.eylem\.([a-zA-Z0-9]+)\s*=/g)].map(m=>m[1]));
    const olu=[...eylem].filter(e=>!karsilik.has(e));
    t(`her data-act'in bir karşılığı var${olu.length?' — ölü: '+olu.join(', '):''}`, olu.length===0);
  }
  const vk=await p.evaluate(async()=>{
    closeSheet(); S.meydan=null; openMeydan();
    const acik1=!document.getElementById('modal').classList.contains('hidden');
    document.querySelector('#sheet [data-act="closesheet"]').click();
    const kapandi1=document.getElementById('modal').classList.contains('hidden');
    openMeydan(); meydanCevapla();
    const sonucAcik=!document.getElementById('modal').classList.contains('hidden');
    document.querySelector('#sheet .x').click();
    const kapandi2=document.getElementById('modal').classList.contains('hidden');
    return {acik1,kapandi1,sonucAcik,kapandi2};
  });
  t('günün vakası cevaplamadan ✕ ile kapanıyor', vk.acik1 && vk.kapandi1);
  t('vaka sonucu ✕ ile kapanıyor', vk.sonucAcik && vk.kapandi2);

  /* ---------- 14) kolay oynanış + premium ---------- */
  console.log('14) hazırla, sıradaki adım, önerilen teklif, foto, durum, anlar');
  const ko=await p.evaluate(async()=>{
    closeSheet(); S.neg=null; S.cash=9e6; S.slots=8; S.cars=[]; S.offers=[];
    const c=[...S.market].sort((a,b)=>a.ask-b.ask)[0];
    buyCar(c, c.ask, "pazar"); closeSheet();
    const own=S.cars[0]; own.inspected=false; own.listPrice=null;
    const adim0=siradakiAdim(own).t;
    // Hazırla: ekspertiz + yalnız kârlı tamirler + dürüst ilan + önerilen fiyat
    const r=hazirlaYap(own);
    const karsizKaldi=openFaults(own).every(f=>repairGain(own,f)<repairCost(f) || !known(own,f) || true);
    const sonuc={adim0, hazir:!!r, inspected:own.inspected, durust:own.ilanDili==="durust"&&own.disclosed,
      fiyat:own.listPrice===onerilenIlan(own) || Math.abs(own.listPrice-onerilenIlan(own))<=500,
      karliKalmadi: karliTamirler(own).length===0 || S.cash<200000,
      adim1:siradakiAdim(own).t};
    // önerilen teklif: görünen değerin altında, pozitif
    const m=S.market[0]; const o=onerilenTeklif(m);
    sonuc.oneri = o>0 && o<valueOf(m,!m.inspected);
    openNegotiation(m); sonuc.oneriDugme=!!document.querySelector('[data-act="oneriteklif"]');
    document.querySelector('[data-act="oneriteklif"]').click();
    sonuc.oneriDoldu = document.getElementById('negInput').value.replace(/\D/g,"")===String(o);
    S.neg=null; closeSheet();
    // Durum sayfası
    document.querySelector('[data-act="durumac"]').click();
    sonuc.durum = /Durum/.test(document.querySelector('.sheet-title').textContent);
    closeSheet();
    // garaj kartında adım rozeti
    S.tab="garaj"; S.garajTab="satis"; render();
    sonuc.rozet = !!document.querySelector('.card .chip.adim');
    // rekor
    S.stats.rekorKar=1; S.stats.sold=Math.max(2,S.stats.sold);
    sellCar(own, own.listPrice+500000);
    sonuc.rekor = !!S.lastDeal.rekor;
    openDealSummary(S.lastDeal);
    sonuc.muhur = !!document.querySelector('.satildi') && !!document.querySelector('.rekor');
    closeSheet();
    return sonuc;
  });
  t('kart "Ekspertiz bekliyor" diyor', ko.adim0==="Ekspertiz bekliyor");
  t('Hazırla ekspertiz yapıyor, dürüst ilanla önerilen fiyata koyuyor', ko.hazir && ko.inspected && ko.durust && ko.fiyat);
  t('Hazırla kârlı tamirleri bitiriyor', ko.karliKalmadi);
  t('hazırlanan araç "Satışta"', /Satışta/.test(ko.adim1));
  t('önerilen teklif görünen değerin altında', ko.oneri);
  t('pazarlıkta önerilen tavan tek dokunuşla giriliyor', ko.oneriDugme && ko.oneriDoldu);
  t('kokpit şeridi Durum sayfasını açıyor', ko.durum);
  t('garaj kartında sıradaki adım rozeti var', ko.rozet);
  t('rekor kâr özetinde SATILDI mührü ve REKOR şeridi', ko.rekor && ko.muhur);
  const foto=await p.evaluate(async()=>{
    closeSheet(); S.tab="pazar"; render();
    // Çekimler boşta kalınca yapılıyor; yazılım çizicide yavaş — yokla.
    for(let k=0;k<30 && document.querySelectorAll('.kart-sahne img.aracfoto').length<3;k++)
      await new Promise(r=>setTimeout(r,500));
    return {img:document.querySelectorAll('.kart-sahne img.aracfoto').length, kart:document.querySelectorAll('.kart-sahne').length,
            font:document.fonts?[...document.fonts].some(f=>f.family.replace(/"/g,'')==="Space Grotesk"):true};
  });
  t(`liste kartlarında 3B fotoğraf (${foto.img}/${foto.kart})`, foto.img>=Math.min(3,foto.kart));
  t('Space Grotesk yazı tipi gömülü', foto.font);

  console.log('15) üst marka şeridi');
  /* Logo oyuna girince kayboluyordu. Şerit sayfa başında görünmeli, aşağı
     kaydırınca kokpitin arkasında kalmalı; kokpit yapışık kalmalı. */
  const um=await p.evaluate(async()=>{
    closeSheet(); S.tab="pazar"; render(); window.scrollTo(0,0);
    await new Promise(r=>setTimeout(r,150));
    const m=document.getElementById("ustmarka"), h=document.getElementById("hud");
    const bas={logo:!!m.querySelector(".glogo"), ad:/Kelepir/.test(m.textContent),
      tabela:(m.querySelector(".um-tabela")||{}).textContent===lotAd(),
      ustte:m.getBoundingClientRect().bottom<=h.getBoundingClientRect().top+1 && m.getBoundingClientRect().top>=0};
    document.body.style.minHeight="3000px"; window.scrollTo(0,400);
    await new Promise(r=>setTimeout(r,150));
    const kay={gizli:m.getBoundingClientRect().bottom<=h.getBoundingClientRect().top+1 && m.getBoundingClientRect().bottom<=1,
      hudUstte:Math.abs(h.getBoundingClientRect().top)<2};
    window.scrollTo(0,0); document.body.style.minHeight="";
    return {...bas,...kay};
  });
  t('sayfa başında logo ve Kelepir yazısı görünüyor', um.logo && um.ad && um.ustte);
  t('şeritte oyuncunun tabelası', um.tabela);
  t('aşağı kaydırınca logo çıkıyor, kokpit yapışık kalıyor', um.gizli && um.hudUstte);

  console.log('16) fotoğraf yeniden çekilirken titremiyor');
  /* Ekspertiz/tamir/cila fotoğraf anahtarını değiştiriyor. Yeni çekim bitene
     dek kart 2B çizime düşüp geri geliyordu; eski fotoğraf yerinde kalmalı. */
  const ft=await p.evaluate(async()=>{
    closeSheet(); S.cash=Math.max(S.cash,9e6);
    const c=S.market.find(x=>x.ask<=S.cash); if(!c) return {yok:true};
    S.tab="pazar"; render();
    for(let k=0;k<40 && FOTO.bellek.get(_ftAnahtar(c))===undefined;k++) await new Promise(r=>setTimeout(r,400));
    if(!FOTO.bellek.get(_ftAnahtar(c))) return {cekilmedi:true};
    buyCar(c,c.ask,"pazar"); closeSheet(); S.tab="garaj"; S.garajTab="hazir"; render();
    c.inspected=true; c.cosmetic=true; render();
    const kart=[...document.querySelectorAll('#screen .card')].find(e=>e.dataset.id==String(c.id));
    const sahne=kart&&kart.querySelector('.kart-sahne');
    return {svg:!!(sahne&&sahne.querySelector('svg.aracsvg')), eski:!!(sahne&&sahne.querySelector('img.aracfoto'))};
  });
  t('anahtar değişince kart eski fotoğrafı koruyor (2B yok)', ft.eski && !ft.svg);

  console.log('17) takas, parça, ilan fotoğrafı, piyasa nabzı, grup, canlı artırma');
  const ys=await p.evaluate(async()=>{
    closeSheet(); S.cash=9e6; S.slots=Math.max(S.slots,10); S.xp=Math.max(S.xp,900);
    const r={};
    /* parça: çıkma parça ucuz, gerçek değerden düşer, ilk bakışta görünmez; geri gelebilir */
    const c=genCar(); c.owned=true; c.inspected=true; c.boughtFor=c.ask||500000; c.spent=0;
    let f=c.faults.find(x=>!x.fixed);
    if(!f){ f={id:_uid++, k:"aku", n:"Akü ölmüş", comp:"elektrik", cost:7500, gain:10, dm:1.35, visible:true, fixed:false}; c.faults.push(f); }
    S.cars.push(c);
    r.ucuz = parcaBedel(f,"cikma") < parcaBedel(f,"yansanayi") && parcaBedel(f,"yansanayi") < parcaBedel(f,"orijinal");
    r.kazancSirasi = parcaKazanc(c,f,"cikma") < parcaKazanc(c,f,"orijinal");
    PARCA_SECIM="cikma"; const once=S.cash; parcaTamir(c,f); PARCA_SECIM="orijinal";
    r.odendi = S.cash===once-parcaBedel(f,"cikma") && f.fixed && f.parca==="cikma";
    r.gizli = hiddenIssues(c).some(x=>/parça/.test(x.t));
    const kaydir=Math.random; let n=0; Math.random=()=>0; KANCA.gun.forEach(g=>{ try{ g({events:[],costs:[],offers:[]}); }catch(e){} }); Math.random=kaydir;
    r.geriGeldi = !f.fixed && f.geriGeldi===true;
    /* ilan fotoğrafı: puan saf fonksiyon, segmente göre değişiyor, saklanan hasar işaretleniyor */
    const lux=genCar({model:MODELS.find(m=>m.seg==="lux")}), tic=genCar({model:MODELS.find(m=>m.seg==="ticari")});
    r.luxStudyo = ilanFotoPuan(lux,{aci:"on",isik:"studyo",zemin:"studyo"}).puan > ilanFotoPuan(lux,{aci:"arka",isik:"aksam",zemin:"galeri"}).puan || IFOTO_KOYU.includes(lux.color);
    r.ticGaleri = ilanFotoPuan(tic,{aci:"on",isik:"gun",zemin:"galeri"}).puan > ilanFotoPuan(tic,{aci:"on",isik:"gun",zemin:"studyo"}).puan;
    const h=genCar(); h.owned=true; h.faults.push({id:_uid++, k:"kapiboya", n:"Kapı boyası gerekli", comp:"kaporta", cost:9500, gain:13, dm:1.45, visible:true, fixed:false});
    const pk=ilanFotoPuan(h,{aci:"arka",isik:"gun",zemin:"galeri"});
    r.sakliyor = pk.gizler.some(g=>g.k==="kapiboya") && ilanFotoPuan(h,{aci:"yan",isik:"gun",zemin:"galeri"}).gizler.length===0;
    h.ilanFoto={aci:"arka",isik:"gun",zemin:"galeri",puan:90,gizler:pk.gizler}; h.listPrice=valueOf(h,false);
    r.akis = ilanFotoAkis(h)>1 && hiddenIssues(h).some(x=>/Fotoğrafta/.test(x.t));
    S.cars.push(h); openIlanFoto(h.id);
    r.foto = !!document.querySelector('#sheet .ifoto-onizleme') && document.querySelectorAll('#sheet [data-act="ifsec"]').length===9;
    /* takas: kayıt-yükleme, ekspertiz, değer kırma */
    h.listPrice=valueOf(h,false);
    let bt=null; for(let i=0;i<600 && !(bt&&bt.takas);i++) bt=makeBuyer(h,S);
    if(bt&&bt.takas){
      const o={oid:S.oidSeq++, carId:h.id, amount:bt.offer, caught:false, issues:[], inspects:false, type:bt.type,
               takas:bt.takas, taksit:null, day:S.day, expires:S.day+2};
      S.offers.push(o);
      const d=JSON.parse(JSON.stringify(serialize())); deserialize(d);
      r.takasKayit = MODELS.includes(d.offers.find(x=>x.oid===o.oid).takas.car.model);
      takasEksper(o.oid);
      r.takasEksper = o.takas.bakildi && o.takas.car.inspected && !!document.querySelector('#sheet .takas-hukum');
      const ilk=o.takas.claim; Math.random=()=>0; takasKir(o.oid,8); Math.random=kaydir;
      r.takasKir = o.takas.claim<ilk;
      r.olasilik = takasKabulOlasiligi({ilk:100,real:80,bakildi:true},92) > takasKabulOlasiligi({ilk:100,real:80,bakildi:false},92);
    }else r.takasYok=true;
    /* piyasa nabzı: dalga değeri oynatıyor, grafik çiziliyor */
    nabizDurum(); const seg=c.model.seg, v0=valueOf(c,false); S.nabiz.d[seg]=.05; const v1=valueOf(c,false); S.nabiz.d[seg]=0;
    r.nabizDeger = v1>v0;
    closeSheet(); openNabiz();
    r.nabizGrafik = document.querySelectorAll('#sheet .nb-svg').length===6 && !!document.querySelector('#sheet .nb-tahmin');
    /* grup: mesaj gelir, ihbar pazara araç koyar, sonuçlanınca sicile yazılır */
    S.grup=null; const g=grupDurum(); const uye=grupUyeler()[0];
    const m=_grpIhbar({...uye, g:1}); g.m.push({id:g.sira++, gun:S.day, kim:uye.n, cozuldu:false, ...m});
    r.grupIhbar = !!S.market.find(x=>x.id===m.carId) && m.dogru===true;
    S.market=S.market.filter(x=>x.id!==m.carId);
    KANCA.gun.forEach(fn=>{ try{ fn({events:[],costs:[],offers:[]}); }catch(e){} });
    r.grupSicil = g.m[0].cozuldu && g.st[uye.n] && g.st[uye.n].d>=1;
    closeSheet(); openGrup();
    r.grupEkran = document.querySelectorAll('#sheet .grp-msj').length>=1 && grupOkunmamis()===0;
    /* canlı artırma: saat, rakip, oyuncu teklifi, sonuç */
    closeSheet(); CANLI.oto=false; CANLI.aktif=false;
    const lot=genCar({auction:true}); S.canli={car:lot, donem:S.auctionDay, bitis:S.day+2, durum:"acik"};
    S.tab="muzayede"; render();
    r.canliKart = !!document.querySelector('.canli-kart');
    openCanli(); canliBasla(); const once2=CANLI.fiyat; canliTeklif(1);
    r.canliTeklif = CANLI.lider==="sen" && CANLI.fiyat>once2 && CANLI.kalan>=7000;
    CANLI.rakipler=[]; const sayi=S.cars.length; canliAdim(20000);
    r.canliKazandi = S.canli.durum==="bitti" && S.canli.sonuc==="sen" && S.cars.length===sayi+1;
    closeSheet();
    return r;
  });
  t('çıkma < yan sanayi < orijinal bedel', ys.ucuz);
  t('ucuz parça gerçek değere daha az katıyor', ys.kazancSirasi);
  t('parça tamiri bedeli düşüyor, parça arızaya yazılıyor', ys.odendi);
  t('ucuz parça gizli kusur sayılıyor', ys.gizli);
  t('ucuz parça geri gelebiliyor', ys.geriGeldi);
  t('lüks araç stüdyoda daha yüksek puan', ys.luxStudyo);
  t('ticari araç galeri önünde daha yüksek puan', ys.ticGaleri);
  t('arka açı kapı boyasını saklıyor, yan profil saklamıyor', ys.sakliyor);
  t('iyi fotoğraf akışı artırıyor, saklanan hasar gizli kusur', ys.akis);
  t('ilan fotoğrafı stüdyosu açılıyor (önizleme + 9 seçim)', ys.foto);
  if(!ys.takasYok){
    t('takas aracı kayıttan model bağıyla dönüyor', ys.takasKayit);
    t('takas aracı ekspertize sokulabiliyor', ys.takasEksper);
    t('takas değeri kırılabiliyor', ys.takasKir);
    t('ekspertiz kanıtı kırmayı kolaylaştırıyor', ys.olasilik);
  }
  t('piyasa dalgası aracın değerini oynatıyor', ys.nabizDeger);
  t('piyasa nabzı: 6 segment grafiği + tahmin', ys.nabizGrafik);
  t('gruptaki ihbar pazara araç koyuyor', ys.grupIhbar);
  t('sonuçlanan mesaj gönderenin siciline yazılıyor', ys.grupSicil);
  t('grup ekranı açılıyor, okunmamış sıfırlanıyor', ys.grupEkran);
  t('müzayedede canlı lot kartı', ys.canliKart);
  t('canlı artırmada teklif saati uzatıyor', ys.canliTeklif);
  t('saat bitince araç oyuncunun', ys.canliKazandi);

  console.log('\nsayfa hataları:', errs.length, errs.slice(0,3));
  if(errs.length) fail+=errs.length;
  await b.close();
  console.log(`\n${ok} geçti, ${fail} kaldı`);
  process.exit(fail?1:0);
})();
