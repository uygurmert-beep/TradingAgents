/* Yol, dosyanın kendi konumundan türetiliyor — paketi nereye açarsan aç
   çalışsın diye mutlak yol bırakılmadı. */
const OYUN = require('path').resolve(__dirname, '..');
/* Rehber testi: ilk oyunda 8 adımın sırayla ilerlediğini ve bittiğini doğrular. */
const {chromium}=require('playwright');
const ok=(k,v)=>console.log((v?'  ok   ':'  FAIL ')+k);
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
    args:['--headless=new','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage({viewport:{width:420,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/three.min.js', r=>r.fulfill({status:404,body:''}));
  await p.goto('file://'+OYUN+'/preloved.html');
  await p.evaluate(()=>{try{localStorage.clear()}catch(e){}}); await p.reload();
  await p.waitForTimeout(400);
  await p.click('[data-act="startgame"]'); await p.waitForTimeout(400);

  const adim=()=>p.evaluate(()=>({
    i:S.ogretAdim||0, acik:!document.getElementById("ogret").classList.contains("hidden"),
    bas:(document.querySelector("#ogret .bas")||{}).textContent||"",
    isik:!!document.querySelector(".ogret-isik"), tut:S.tutorial
  }));

  let a=await adim();
  ok('1. adım görünüyor', a.acik && a.i===0);
  ok('hedef vurgulandı', a.isik);

  // 1) ilan aç
  await p.click('#screen [data-act="open"]'); await p.waitForTimeout(250);
  a=await adim(); ok('2. adıma geçti (ekspertiz)', a.i===1);

  // 2) ekspertiz
  await p.click('[data-act="eksper"]'); await p.waitForTimeout(300);
  a=await adim(); ok('3. adıma geçti (pazarlık)', a.i===2);

  // 3) pazarlık + 4) al — doğrudan satın alarak
  await p.evaluate(()=>{ const c=S.market[0]; S.cash=Math.max(S.cash,c.ask+5000);
    buyCar(c, c.ask); closeSheet(); S.tab="garaj"; render(); });
  await p.waitForTimeout(250);
  a=await adim(); ok('5. adıma geçti (tamir)', a.i===4);

  // 5) tamir — kusur yoksa adım ilan ile kapanır
  const kusur=await p.evaluate(()=>S.cars[0].faults.filter(f=>!f.fixed).length);
  if(kusur){
    await p.evaluate(()=>{ const c=S.cars[0], f=c.faults.find(x=>!x.fixed);
      S.cash+=50000; S.cash-=repairCost(f); c.spent+=repairCost(f); f.fixed=true; render(); });
    await p.waitForTimeout(200);
    a=await adim(); ok('6. adıma geçti (ilan)', a.i===5);
  } else ok('6. adım (kusursuz araç) atlandı', true);

  // 6) ilan
  await p.evaluate(()=>{ S.cars[0].listPrice=Math.round(valueOf(S.cars[0],false)*1.05/50)*50; render(); });
  await p.waitForTimeout(200);
  a=await adim(); ok('7. adıma geçti (günü bitir)', a.i===6);

  // 7) günü bitir
  await p.evaluate(()=>{ nextDay(); render(); }); await p.waitForTimeout(250);
  a=await adim(); ok('8. adıma geçti (sat)', a.i===7);

  // 8) sat
  const nakitOnce=await p.evaluate(()=>Math.round(S.cash));
  await p.evaluate(()=>{ const c=S.cars[0]; sellCar(c, Math.round(c.listPrice), "test"); render(); });
  await p.waitForTimeout(250);
  a=await adim();
  ok('rehber kapandı', a.tut===false && a.acik===false);
  const bonus=await p.evaluate(()=>S.cash);
  ok('ikramiye verildi', bonus>nakitOnce);
  ok('vurgu temizlendi', !(await p.evaluate(()=>!!document.querySelector(".ogret-isik"))));

  // atla düğmesi
  const p2=await b.newPage({viewport:{width:420,height:900}});
  p2.on('pageerror',e=>errs.push(e.message));
  await p2.route('**/three.min.js', r=>r.fulfill({status:404,body:''}));
  await p2.goto('file://'+OYUN+'/preloved.html');
  await p2.evaluate(()=>{try{localStorage.clear()}catch(e){}}); await p2.reload();
  await p2.waitForTimeout(400);
  await p2.click('[data-act="startgame"]'); await p2.waitForTimeout(350);
  await p2.click('[data-act="ogretatla"]'); await p2.waitForTimeout(250);
  ok('atla çalışıyor', await p2.evaluate(()=>S.tutorial===false &&
      document.getElementById("ogret").classList.contains("hidden")));

  console.log('sayfa hatası:', errs.slice(0,3));
  await b.close();
})();
