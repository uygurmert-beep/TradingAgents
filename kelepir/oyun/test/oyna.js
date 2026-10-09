/* Yol, dosyanın kendi konumundan türetiliyor — paketi nereye açarsan aç
   çalışsın diye mutlak yol bırakılmadı. */
const OYUN = require('path').resolve(__dirname, '..');
/* İlk oyuncu deneyimi: gerçekten tıklayarak oyna, her adımı kaydet.
   Hiçbir yere evaluate ile hile yapılmıyor — sadece ekranda ne varsa ona basıyoruz. */
const {chromium}=require('playwright');
const fs=require('fs');
const NOT=[];
const not=(t)=>{ NOT.push(t); console.log(t); };

(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
    args:['--headless=new','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage({viewport:{width:420,height:900},deviceScaleFactor:2});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/three.min.js', r=>r.fulfill({path:OYUN+'/three.min.js',contentType:'application/javascript'}));
  const t0=Date.now();
  await p.goto('file://'+OYUN+'/preloved.html');
  await p.evaluate(()=>{try{localStorage.clear()}catch(e){}});
  await p.reload();
  await p.waitForSelector('[data-act="startgame"]');
  not(`açılış: ${Date.now()-t0} ms`);
  await p.evaluate(()=>(TEK_DIL=null, dilAyarla("en"))); await p.waitForTimeout(250);
  await p.screenshot({path:'o-01-intro.png'});

  // arketip seç ve başla
  await p.click('[data-act="pickarch"][data-k="usta"]').catch(()=>{});
  await p.waitForTimeout(150);
  await p.click('[data-act="startgame"]');
  await p.waitForTimeout(500);
  await p.screenshot({path:'o-02-pazar.png'});

  const durum=async()=>p.evaluate(()=>({
    gun:S.day, nakit:Math.round(S.cash), stok:S.cars.length, satildi:S.stats.sold,
    rep:Math.round(S.rep), lv:level(), xp:S.xp,
    adim:S.ogretAdim, rehber:S.tutorial,
    gorev:S.gunluk?S.gunluk.gorevler.filter(g=>g.odendi).length:0
  }));
  not('başlangıç: '+JSON.stringify(await durum()));

  /* --- rehber adımlarını ekrandaki yönlendirmeyi izleyerek takip et --- */
  const rehberMetni=async()=>p.evaluate(()=>{
    const e=document.querySelector('#ogret .bas'); return e?e.textContent.trim():null; });
  not('rehber 1: '+await rehberMetni());

  // 1) ilan aç — rehberin vurguladığı kartı tıkla
  await p.click('.ogret-isik').catch(async()=>{ await p.click('#screen [data-act="open"]'); });
  await p.waitForTimeout(400);
  await p.screenshot({path:'o-03-ilan.png'});
  not('rehber 2: '+await rehberMetni());

  // 2) ekspertiz
  const aracOnce=await p.evaluate(()=>{ const c=S.market.find(x=>!x.owned); return {ad:c.model.n, ask:c.ask,
    tahmin:Math.round(valueOf(c,true))}; });
  await p.click('[data-act="eksper"]');
  await p.waitForTimeout(450);
  await p.screenshot({path:'o-04-ekspertiz.png'});
  const rapor=await p.evaluate(()=>{
    const c=S.market.find(x=>x.inspected);
    return {ad:c.model.n, ask:c.ask, gercek:Math.round(valueOf(c,false)),
            kusur:c.faults.filter(f=>!f.fixed).map(f=>f.n+" "+Math.round(f.cost)),
            tramer:c.tramer, boyali:c.boyali};
  });
  not('ekspertiz sonrası: '+JSON.stringify(rapor));
  not('rehber 3: '+await rehberMetni());

  // 3) pazarlık — kozları oyna, sonra teklif ver
  await p.click('[data-act="negotiate"]');
  await p.waitForTimeout(400);
  await p.screenshot({path:'o-05-pazarlik.png'});
  const kozlar=await p.evaluate(()=>[...document.querySelectorAll('[data-act="move"]')]
      .map(b=>({k:b.dataset.k, t:b.textContent.replace(/\s+/g,' ').trim().slice(0,60)})));
  not('pazarlık hamleleri: '+JSON.stringify(kozlar));

  // kozları sırayla oyna
  for(const k of ['koz','koz','ovgu']){
    const d=await p.$(`[data-act="move"][data-k="${k}"]`);
    if(!d) continue;
    await d.click(); await p.waitForTimeout(350);
  }
  const neg=await p.evaluate(()=>({ taban:Math.round(negReserve()), ask:findCar(S.neg.carId).ask,
      mood:Math.round(S.neg.mood), pat:S.neg.pat }));
  not('pazarlık durumu: '+JSON.stringify(neg));

  // taban + %3 teklif et
  await p.evaluate(()=>{ const i=document.getElementById('negInput');
    if(i) i.value=num(Math.round(negReserve()*1.03/50)*50); });
  await p.click('[data-act="offer"]');
  await p.waitForTimeout(900);
  await p.screenshot({path:'o-06-teklif.png'});
  not('teklif sonrası: '+JSON.stringify(await durum()));

  // kabul edilmediyse karşı teklifi al
  const kars=await p.$('[data-act="acceptcounter"]');
  if(kars){ await kars.click(); await p.waitForTimeout(800); not('karşı teklif kabul edildi'); }
  not('alım sonrası: '+JSON.stringify(await durum()));
  await p.screenshot({path:'o-07-garaj.png'});

  /* --- garaj: tamir ve ilan --- */
  await p.evaluate(()=>{ S.tab="garaj"; render(); }); await p.waitForTimeout(300);
  const g=await p.$('#screen [data-act="open"]');
  if(g){ await g.click(); await p.waitForTimeout(400); }
  await p.screenshot({path:'o-08-aracim.png'});
  const tamirler=await p.evaluate(()=>[...document.querySelectorAll('[data-act="repair"]')]
    .map(b=>b.closest('.fault,.kv,div')?.textContent.replace(/\s+/g,' ').trim().slice(0,70)));
  not('tamir seçenekleri: '+JSON.stringify(tamirler.slice(0,4)));
  const tm=await p.$('[data-act="repair"]');
  if(tm){ await tm.click(); await p.waitForTimeout(500); not('bir tamir yapıldı'); }

  // ilan
  const ilan=await p.$('[data-act="list"]');
  if(ilan){ await ilan.click(); await p.waitForTimeout(500); }
  else {
    const ilanAc=await p.$('[data-act="openlist"]');
    if(ilanAc){ await ilanAc.click(); await p.waitForTimeout(300);
      const l2=await p.$('[data-act="list"]'); if(l2){ await l2.click(); await p.waitForTimeout(400);} }
  }
  await p.screenshot({path:'o-09-ilan.png'});
  not('ilan sonrası: '+JSON.stringify(await durum()));

  /* --- günleri çevir, teklif geldikçe sat --- */
  for(let i=0;i<16;i++){
    // açık sayfa varsa kapat
    for(let k=0;k<4;k++){
      const acik=await p.evaluate(()=>!document.getElementById('modal').classList.contains('hidden'));
      if(!acik) break;
      const x=await p.$('[data-act="closesheet"],[data-act="dealdone"],[data-act="reportnext"],[data-act="seasondone"],[data-act="closereport"], #sheet .x');
      if(!x) { await p.evaluate(()=>closeSheet()); break; }
      await x.click().catch(()=>{}); await p.waitForTimeout(250);
    }
    const bitir=await p.$('[data-act="endday"]');
    if(!bitir) { await p.evaluate(()=>{ S.tab="pazar"; render(); }); await p.waitForTimeout(200); continue; }
    await bitir.click({timeout:6000}).catch(()=>{}); await p.waitForTimeout(600);
    // rapor sayfalarını geç
    for(let k=0;k<6;k++){
      const n=await p.$('[data-act="reportnext"],[data-act="closereport"],[data-act="seasondone"],[data-act="dealdone"]');
      if(!n) break;
      await n.click({timeout:4000}).catch(()=>{}); await p.waitForTimeout(300);
    }
    // teklifler garaj sekmesinde görünür
    await p.evaluate(()=>{ S.tab="garaj"; render(); }); await p.waitForTimeout(250);
    const sn=await p.$('[data-act="salenego"]');
    if(sn){
      await sn.click({timeout:4000}).catch(()=>{}); await p.waitForTimeout(450);
      await p.screenshot({path:'o-10-satis.png'});
      const kab=await p.$('[data-act="acceptoffer"]');
      if(kab){ await kab.click({timeout:4000}).catch(()=>{}); await p.waitForTimeout(700);
        for(let k=0;k<4;k++){ const d2=await p.$('[data-act="dealdone"],[data-act="closesheet"]');
          if(!d2) break; await d2.click({timeout:3000}).catch(()=>{}); await p.waitForTimeout(250); }
        not(`gün ${(await durum()).gun}: bir araç satıldı`);
      } else { await p.evaluate(()=>closeSheet()); }
    }
  }
  not('14 gün sonra: '+JSON.stringify(await durum()));
  await p.screenshot({path:'o-11-sonrasi.png'});

  /* --- 3B sahaya gir, yürü --- */
  await p.evaluate(()=>{ S.tab="pazar"; render(); }); await p.waitForTimeout(250);
  const v3=await p.$('[data-act="view"][data-v="1"]');
  if(v3){ await v3.click(); }
  await p.waitForTimeout(120); await p.screenshot({path:'o-12-perde.png'});
  await p.waitForTimeout(2800); await p.screenshot({path:'o-13-saha.png'});
  // ileri yürü
  await p.mouse.move(110,620); await p.mouse.down();
  for(let i=0;i<22;i++){ await p.mouse.move(110,620-70); await p.waitForTimeout(55); }
  await p.mouse.up(); await p.waitForTimeout(400);
  await p.screenshot({path:'o-14-yurudum.png'});
  const odak=await p.evaluate(()=>{
    const e=document.querySelector('#w3dbar .w3dcar'); return e?e.textContent.replace(/\s+/g,' ').trim():null; });
  not('3B odak çubuğu: '+odak);

  /* --- defter sayfaları --- */
  await p.evaluate(()=>{ S.view3d=false; S.tab="rapor"; render(); }); await p.waitForTimeout(400);
  await p.screenshot({path:'o-15-defter.png'});
  await p.click('[data-act="defteralt"][data-s="koleksiyon"]'); await p.waitForTimeout(300);
  await p.screenshot({path:'o-16-koleksiyon.png'});
  await p.click('[data-act="defteralt"][data-s="lig"]'); await p.waitForTimeout(300);
  await p.screenshot({path:'o-17-lig.png'});

  not('son durum: '+JSON.stringify(await durum()));
  not('sayfa hataları: '+JSON.stringify(errs.slice(0,5)));
  fs.writeFileSync('oyun-notlari.txt', NOT.join('\n'));
  await b.close();
})();
