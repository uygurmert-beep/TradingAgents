/* Yol, dosyanın kendi konumundan türetiliyor — paketi nereye açarsan aç
   çalışsın diye mutlak yol bırakılmadı. */
const OYUN = require('path').resolve(__dirname, '..');
/* Günlük ritim testi: görevler üretiliyor mu, sayaçlar ilerliyor mu,
   ödül veriliyor mu, gün dönünce yenileniyor mu, seri işliyor mu. */
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
  await p.evaluate(()=>{ S.tutorial=false; render(); }); await p.waitForTimeout(200);

  const d=await p.evaluate(()=>({say:S.gunluk.gorevler.length,
    tekil:new Set(S.gunluk.gorevler.map(g=>g.sayac)).size,
    serit:!!document.querySelector(".gunluk-kart"),
    firsat:S.market.filter(c=>c.gunun).length,
    seri:S.seri.n}));
  ok('3 görev üretildi', d.say===3);
  ok('görevler farklı sayaçlarda', d.tekil===3);
  ok('şerit görünüyor', d.serit);
  ok('günün fırsatı işaretli', d.firsat===1);
  ok('seri 1. günde başladı', d.seri===1);

  // bir görevi zorla tamamla
  const r=await p.evaluate(()=>{
    const g=S.gunluk.gorevler[0]; const once=S.cash;
    for(let i=0;i<g.n;i++) gorevIlerle(g.sayac);
    return {odendi:g.odendi, kazanc:Math.round(S.cash-once), odul:g.nakit};
  });
  ok('görev ödendi', r.odendi);
  ok('nakit ödülü eklendi', r.kazanc===r.odul);

  // günün fırsatında ekspertiz bedava
  const e=await p.evaluate(async()=>{
    const c=S.market.find(x=>x.gunun); const once=S.cash;
    openMarketCar(c);
    document.querySelector('[data-act="eksper"]').click();
    await new Promise(r=>setTimeout(r,120));
    return {inspected:c.inspected, fark:Math.round(S.cash-once)};
  });
  ok('fırsat aracı ekspertiz edildi', e.inspected);
  ok('ekspertiz bedavaydı', e.fark>=0);

  // gün dönünce görevler yenilenir
  const y=await p.evaluate(()=>{
    const eski=S.gunluk.gorevler.map(g=>g.k).join(",");
    S.gunSayac.sat=99; nextDay(); render();
    return {gun:S.gunluk.gun, day:S.day, sifir:S.gunSayac.sat, odendi:S.gunluk.gorevler.filter(g=>g.odendi).length, eski};
  });
  ok('yeni gün için görevler yenilendi', y.gun===y.day && y.odendi===0);
  ok('sayaçlar sıfırlandı', y.sifir===0);

  // seri: dün oynanmış gibi
  await p.evaluate(()=>{
    const dun=new Date(Date.now()-864e5);
    S.seri={n:3, son:dun.getFullYear()+"-"+(dun.getMonth()+1)+"-"+dun.getDate()};
    S.seri.son="x"; // bugünden farklı
    const d2=new Date(Date.now()-864e5);
    S.seri.son=d2.getFullYear()+"-"+(d2.getMonth()+1)+"-"+d2.getDate();
    seriGuncelle();
  });
  ok('seri arttı', await p.evaluate(()=>S.seri.n===4));

  console.log('sayfa hatası:', errs.slice(0,3));
  await b.close();
})();
