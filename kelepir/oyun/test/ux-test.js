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
    const eski=c.listPrice;
    c.listPrice=Math.round(valueOf(c,false)*0.85/500)*500;
    const a=satisPenceresi(c).gunUst;
    c.listPrice=Math.round(valueOf(c,false)*1.35/500)*500;
    const bb=satisPenceresi(c).gunUst;
    c.listPrice=eski;
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
             // kâğıdın üstünde kendi koyu zemini olmalı
             ayri: z.backgroundImage.indexOf('gradient')>=0,
             dugmeRenk: (()=>{ const x=a.querySelector('.btn.primary');
               return x?getComputedStyle(x).backgroundColor:""; })() };
  });
  t('araç dosyası kâğıt yüzeyinde', !!af.belge);
  t('atölye raporun ilk bloğundan önce', af.sira===0);
  t('atölye kâğıttan ayrı bir yüzey', !!af.ayri);
  t('Yaptır dolu kehribar düğme', af.dugmeRenk==='rgb(240, 180, 82)');

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
  t('pazarlıkta hamle sonrası kaydırma korunuyor', po<10 || Math.abs(pz.scroll-po)<40);
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
    const svg=k.querySelector('.kart-sahne svg.aracsvg');
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
    return { var:true, arac:!!s.querySelector('.sahne-arac svg'),
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

  console.log('\nsayfa hataları:', errs.length, errs.slice(0,3));
  if(errs.length) fail+=errs.length;
  await b.close();
  console.log(`\n${ok} geçti, ${fail} kaldı`);
  process.exit(fail?1:0);
})();
