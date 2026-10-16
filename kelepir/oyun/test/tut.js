/* Yol, dosyanın kendi konumundan türetiliyor — paketi nereye açarsan aç
   çalışsın diye mutlak yol bırakılmadı. */
const OYUN = require('path').resolve(__dirname, '..');
/* Rehber testi: ilk oyunda 7 adımın sırayla ilerlediğini ve bittiğini doğrular. */
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
  a=await adim(); ok('5. adıma geçti (hazırla)', a.i===4);
  ok('hazırla adımında hedef vurgulu', a.isik);

  // 5) hazırla (1.1: tamir ve ilan tek adım)
  await p.evaluate(()=>{ S.cash+=200000; const r=hazirlaYap(S.cars[0]); render(); });
  await p.waitForTimeout(200);
  a=await adim(); ok('6. adıma geçti (günü bitir)', a.i===5);

  // 6) günü bitir
  await p.evaluate(()=>{ nextDay(); render(); }); await p.waitForTimeout(250);
  a=await adim(); ok('7. adıma geçti (sat)', a.i===6);

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
  const atlaKutu=await p2.evaluate(()=>{ const r=document.querySelector('#ogret .atla').getBoundingClientRect(); return r.width>=44&&r.height>=44; });
  ok('atla düğmesi en az 44×44', atlaKutu);
  await p2.click('[data-act="ogretatla"]'); await p2.waitForTimeout(250);
  ok('atla önce onay istiyor', await p2.evaluate(()=>S.tutorial===true && !!document.querySelector('[data-act="onayevet"]')));
  await p2.click('[data-act="onayevet"]'); await p2.waitForTimeout(250);
  ok('atla çalışıyor', await p2.evaluate(()=>S.tutorial===false &&
      document.getElementById("ogret").classList.contains("hidden")));

  /* Kavranabilirlik oylaması Ö2/Ö3 ölçütü: yalnız vurgulanan düğmeye (ve
     onaylara) dokunan yeni oyuncu ilk satışı ≤15 dokunuşta yapar; rehber
     kartı hiçbir anda bildirimle ya da sayfa başlığıyla kesişmez. Rastgelelik
     tohumlanıyor ki ölçüm her çalıştırmada aynı olsun. */
  const p3=await b.newPage({viewport:{width:390,height:844}});
  p3.on('pageerror',e=>errs.push(e.message));
  await p3.route('**/three.min.js', r=>r.fulfill({status:404,body:''}));
  await p3.addInitScript(()=>{ let x=7932; Math.random=()=>{ x=(x*16807)%2147483647; return (x-1)/2147483646; }; });
  await p3.goto('file://'+OYUN+'/preloved.html');
  await p3.evaluate(()=>{try{localStorage.clear()}catch(e){}}); await p3.reload(); await p3.waitForTimeout(450);
  await p3.click('[data-act="startgame"]'); await p3.waitForTimeout(450);
  let dokunus=0, kesisim=0;
  for(let k=0;k<40;k++){
    const st=await p3.evaluate(()=>({tut:S.tutorial, sold:S.stats.sold||0}));
    if(st.sold>0 || !st.tut) break;
    const r=await p3.evaluate(()=>{
      const og=document.querySelector('#ogret .kutu'); let ks=false;
      if(og && og.offsetParent!==null){ const a=og.getBoundingClientRect();
        for(const e of [...document.querySelectorAll('.toast'), document.querySelector('.sheet-title')].filter(Boolean)){
          const q=e.getBoundingClientRect(); if(q.height>0 && a.left<q.right&&a.right>q.left&&a.top<q.bottom&&a.bottom>q.top) ks=true; } }
      const h=document.querySelector('.ogret-isik'); if(!h) return {yok:true, ks};
      h.click(); return {ks};
    });
    if(r.ks) kesisim++;
    if(!r.yok) dokunus++;
    await p3.waitForTimeout(r.yok?300:500);
  }
  const ilk=await p3.evaluate(()=>S.stats.sold||0);
  ok(`vurguyu izleyen oyuncu ilk satışı yaptı (${dokunus} dokunuş ≤ 15)`, ilk>0 && dokunus<=15);
  ok('rehber kartı bildirim ya da sayfa başlığıyla kesişmedi', kesisim===0);

  console.log('sayfa hatası:', errs.slice(0,3));
  await b.close();
})();
