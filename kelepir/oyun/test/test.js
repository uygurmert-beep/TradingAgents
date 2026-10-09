/* Yol, dosyanın kendi konumundan türetiliyor — paketi nereye açarsan aç
   çalışsın diye mutlak yol bırakılmadı. */
const OYUN = require('path').resolve(__dirname, '..');
/* Pre-Loved Auto — duman testi: açılış, 3B sahne, gün döngüsü, pazarlık, satış. */
const {chromium}=require('playwright');
const ok=(k,v)=>console.log((v?'  ok   ':'  FAIL ')+k);
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
    args:['--headless=new','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  let hata=0;
  const sayfa=async(three=true)=>{
    const p=await b.newPage({viewport:{width:420,height:900}});
    p.errs=[]; p.on('pageerror',e=>p.errs.push(e.message));
    await p.route('**/three.min.js', r=> three
      ? r.fulfill({path:OYUN+'/three.min.js',contentType:'application/javascript'})
      : r.fulfill({status:404, body:''}));
    await p.goto('file://'+OYUN+'/preloved.html');
    await p.evaluate(()=>{try{localStorage.clear()}catch(e){}});
    await p.reload(); await p.waitForTimeout(500);
    await p.click('[data-act="startgame"]'); await p.waitForTimeout(300);
    return p;
  };

  console.log('1) 3B pazar + garaj');
  {
    const p=await sayfa();
    await p.evaluate(()=>{S.tutorial=false; S.view3d=true; render();});
    await p.waitForTimeout(1500);
    const a=await p.evaluate(()=>({act:W3D.active, mod:W3D.mode, fail:W3D.failed}));
    ok('pazar sahnesi kuruldu', a.act && a.mod==='pazar' && !a.fail); if(!a.act) hata++;
    await p.evaluate(()=>{ S.cash=3e6;
      for(let i=0;i<3;i++){const c=genCar(); c.owned=true; c.inspected=true;
        c.boughtFor=1; c.spent=0; c.boughtDay=1; c.daysListed=i; c.leadsSeen=0;
        c.priceCuts=0; c.extras=[]; if(i<2) c.listPrice=Math.round(valueOf(c,false));
        S.cars.push(c);}
      S.tab='garaj'; render(); });
    await p.waitForTimeout(1500);
    const g=await p.evaluate(()=>({act:W3D.active, mod:W3D.mode}));
    ok('garaj sahnesi kuruldu', g.act && g.mod==='garaj'); if(!g.act) hata++;
    await p.click('#w3dtop [data-act="view"][data-v="0"]'); await p.waitForTimeout(400);
    const l=await p.evaluate(()=>({v:S.view3d, act:W3D.active,
      gizli:document.getElementById('world').classList.contains('hidden')}));
    ok('listeye dönüş', !l.v && !l.act && l.gizli); if(l.v) hata++;
    ok('sayfa hatası yok', p.errs.length===0); if(p.errs.length){hata++;console.log('   ',p.errs[0]);}
    await p.close();
  }

  console.log('2) ikinci gün sahneyi yeniler');
  {
    const p=await sayfa();
    await p.evaluate(()=>{S.tutorial=false; S.view3d=true; render();});
    await p.waitForTimeout(1200);
    const g1=await p.evaluate(()=>S.market.map(c=>c.id).join(','));
    await p.evaluate(()=>{nextDay();}); await p.waitForTimeout(1200);
    const r=await p.evaluate(()=>({gun:S.day, act:W3D.active, mod:W3D.mode,
      ids:S.market.map(c=>c.id).join(',')}));
    ok('gün 2', r.gun===2); if(r.gun!==2) hata++;
    ok('sahne hâlâ aktif', r.act && r.mod==='pazar'); if(!r.act) hata++;
    ok('pazar değişti', r.ids!==g1);
    ok('sayfa hatası yok', p.errs.length===0); if(p.errs.length){hata++;console.log('   ',p.errs[0]);}
    await p.close();
  }

  console.log('3) THREE yokken oyun çalışır');
  {
    const p=await sayfa(false);
    await p.evaluate(()=>{S.tutorial=false; S.view3d=true; render();});
    await p.waitForTimeout(800);
    const r=await p.evaluate(()=>({v:S.view3d, fail:W3D.failed,
      liste:document.querySelectorAll('.card').length>0}));
    ok('3B kapalı, liste görünür', !r.v && r.liste); if(r.v||!r.liste) hata++;
    await p.close();
  }

  console.log('4) satın al → tamir → ilan → sat');
  {
    const p=await sayfa();
    const r=await p.evaluate(()=>{
      S.tutorial=false; S.cash=5e6;
      // En ucuz ilan: pazarın ilki 7–8 milyonluk bir lüks olabiliyor ve
      // 5 milyonla alınamayınca test rastgele düşüyordu.
      const c=[...S.market].sort((a,b)=>a.ask-b.ask)[0];
      buyCar(c, Math.round(c.ask*.9));
      const own=S.cars[0];
      const f=own.faults.find(x=>!x.fixed);
      if(f){ own.spent+=repairCost(f); f.fixed=true; S.stats.repairs++; }
      own.listPrice=Math.round(valueOf(own,false)*0.94);
      own.daysListed=0;
      let gun=0;
      while(S.cars.length && gun<40){ nextDay(); gun++;
        const of=(S.offers||[]).find(o=>o.carId===own.id);
        if(of){ const c2=S.cars.find(c=>c.id===of.carId);
          if(c2){ sellCar(c2, of.amount, "test"); dropOffer(of.oid); } }
      }
      return {alindi:S.stats.bought, satildi:S.stats.sold, gun, nakit:Math.round(S.cash)};
    });
    ok('araç alındı', r.alindi>=1); if(r.alindi<1) hata++;
    ok('araç satıldı', r.satildi>=1); if(r.satildi<1) hata++;
    ok('gün döngüsü çalıştı', r.gun>0); if(!r.gun) hata++;
    ok('sayfa hatası yok', p.errs.length===0); if(p.errs.length){hata++;console.log('   ',p.errs[0]);}
    console.log('   ', JSON.stringify(r));
    await p.close();
  }

  console.log(hata? `\n${hata} SORUN` : '\nhepsi temiz');
  process.exitCode=hata?1:0;
  await b.close();
})();
