/* Yol, dosyanın kendi konumundan türetiliyor — paketi nereye açarsan aç
   çalışsın diye mutlak yol bırakılmadı. */
const OYUN = require('path').resolve(__dirname, '..');
/* Koleksiyon / lig / prestij testleri (madde 7-8-10) */
const {chromium}=require('playwright');
const ok=(k,v)=>console.log((v?'  ok   ':'  FAIL ')+k);
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
    args:['--headless=new','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage({viewport:{width:420,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/three.min.js', r=>r.fulfill({status:404,body:''}));
  await p.goto('file://'+OYUN+'/preloved.html');
  await p.evaluate(()=>{try{localStorage.clear()}catch(e){}}); await p.reload(); await p.waitForTimeout(400);
  await p.click('[data-act="startgame"]'); await p.waitForTimeout(400);
  await p.evaluate(()=>{ S.tutorial=false; render(); });

  // 6 farklı model al-sat → defter + ödül
  const r=await p.evaluate(()=>{
    S.cash=5e5; S.slots=30;
    const kullanildi=new Set();
    for(const m of MODELS.slice(0,11)){
      const c=genCar({model:m});
      c.owned=true; c.boughtFor=600000; c.spent=0; c.boughtDay=S.day; c.daysListed=0;
      c.inspected=true; S.cars.push(c); S.stats.bought++; kolAlim(c);
      sellCar(c, 900000, "test");
      kullanildi.add(m.n);
    }
    return {tamam:kolTamam(), odul:S.kolOdul, perk:S.perkPts||0, lig:S.lig?S.lig.ben:null};
  });
  ok('defter 11 modeli işledi', r.tamam===11);
  ok('10. modelde ödül verildi', r.odul===1 && r.perk>=1);
  ok('lig kârı birikiyor', r.lig>0);

  // koleksiyon sayfası
  await p.evaluate(()=>{ S.tab="rapor"; S.defterAlt="koleksiyon"; render(); });
  await p.waitForTimeout(200);
  ok('koleksiyon sayfası çiziliyor',
     await p.evaluate(()=>document.querySelectorAll('.kolsat').length===MODELS.length));
  ok('tamamlananlar işaretli',
     await p.evaluate(()=>document.querySelectorAll('.kolsat.ok').length===11));

  // lig sayfası + sezon kapanışı ödülü
  await p.evaluate(()=>{ S.defterAlt="lig"; render(); }); await p.waitForTimeout(150);
  ok('lig tablosu 5 satır', await p.evaluate(()=>document.querySelectorAll('.ligsat').length===5));
  const lig=await p.evaluate(()=>{ const once=S.cash; const s=ligKapat();
    return {sira:s.sira, kazanc:Math.round(S.cash-once), sifir:S.lig.ben}; });
  ok('sezon ligi kapandı ve ödüllendi', lig.sira>=1 && lig.sira<=5 && lig.sifir===0);

  // prestij
  const pr=await p.evaluate(()=>{
    S.koleksiyon["Hanjo H20"]={al:1,sat:1,enKar:999,enIyiGun:1,ilkGun:1};
    prestijYap();
    return {prestij:S.prestij, kolVar:!!S.koleksiyon["Hanjo H20"], started:S.started};
  });
  await p.waitForTimeout(250);
  ok('prestij sayacı arttı', pr.prestij===1);
  ok('defter taşındı', pr.kolVar);
  ok('yeni oyun arketip seçimine döndü', pr.started===false);

  const bonus=await p.evaluate(()=>{ startGame(); return {slots:S.slots, cash:S.cash}; });
  ok('prestij park yeri bonusu', bonus.slots>=5);
  ok('prestij sermaye bonusu', bonus.cash>32000*1.15);

  console.log('sayfa hatası:', errs.slice(0,3));
  await b.close();
})();
