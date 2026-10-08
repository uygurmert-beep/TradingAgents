/* Yol, dosyanın kendi konumundan türetiliyor — paketi nereye açarsan aç
   çalışsın diye mutlak yol bırakılmadı. */
const OYUN = require('path').resolve(__dirname, '..');
/* Eski TL ölçekli kayıt açılınca ekonomi düzeliyor mu? */
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

  // eski kaydı üret, JSON'ını al
  const eski=await p.evaluate(()=>{
    S.tutorial=false; S.cash=4000000; S.debt=120000; S.xp=400; S.rep=70; S.stats.sold=9;
    const c=S.market[0]; buyCar(c, c.ask);
    S.cars[0].boughtFor=1250000; S.cars[0].spent=85000; S.cars[0].listPrice=1480000;
    // eski (dolar ölçekli) kaydı taklit et: fiyatları 80'e böl
    S.market.forEach(x=>{ x.ask=Math.round(x.ask/80); if(x.reserve) x.reserve=Math.round(x.reserve/80); });
    const d=JSON.parse(JSON.stringify(serialize()));
    delete d.surum;
    return JSON.stringify(d);
  });
  await p.close();

  // tertemiz bir oturumda, kayıt sayfa yüklenmeden önce yerleştirilir
  const ctx=await b.newContext({viewport:{width:420,height:900}});
  const q=await ctx.newPage();
  q.on('pageerror',e=>errs.push(e.message));
  await q.route('**/three.min.js', r=>r.fulfill({status:404,body:''}));
  await q.addInitScript(k=>{ try{ localStorage.setItem("preloved_v1", k);
    localStorage.setItem("preloved_v1_t", String(Date.now())); }catch(e){} }, eski);
  await q.goto('file://'+OYUN+'/preloved.html');
  await q.waitForTimeout(1800);
  const p2=q;

  const r=await p2.evaluate(()=>({
    surum:S.surum, nakit:Math.round(S.cash), borc:S.debt,
    enYuksekIstenen:Math.max(...S.market.map(c=>c.ask)),
    aracAlis:S.cars[0]?S.cars[0].boughtFor:null,
    aracIlan:S.cars[0]?S.cars[0].listPrice:null,
    seviye:level(), rep:Math.round(S.rep), satildi:S.stats.sold, started:S.started
  }));
  console.log(JSON.stringify(r));
  ok('sürüm damgalandı', r.surum===5);
  ok('piyasa makul TL fiyatlarında', r.enYuksekIstenen>200000 && r.enYuksekIstenen<30000000);
  ok('elindeki araç TL değerine çekildi', r.aracAlis>150000 && r.aracAlis<30000000 && r.aracIlan>r.aracAlis);
  ok('nakit TL ölçeğinde', r.nakit>=2800000 && r.nakit<=12000000);
  ok('borç silindi', r.borc===0);
  ok('kariyer korundu', r.satildi===9 && r.rep===70 && r.seviye>=3);
  ok('oyun açık kaldı', r.started===true);
  console.log('sayfa hatası:', errs.slice(0,2));
  await b.close();
})();
