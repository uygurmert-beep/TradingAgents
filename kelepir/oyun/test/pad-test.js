/* Yol, dosyanın kendi konumundan türetiliyor — paketi nereye açarsan aç
   çalışsın diye mutlak yol bırakılmadı. */
const OYUN = require('path').resolve(__dirname, '..');
/* Pedler gerçekten tepki veriyor mu? */
const {chromium}=require('playwright');
const ok=(k,v)=>console.log((v?'  ok   ':'  FAIL ')+k);
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
    args:['--headless=new','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage({viewport:{width:420,height:900},deviceScaleFactor:2});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/three.min.js', r=>r.fulfill({path:OYUN+'/three.min.js',contentType:'application/javascript'}));
  await p.goto('file://'+OYUN+'/preloved.html');
  await p.evaluate(()=>{try{localStorage.clear()}catch(e){}}); await p.reload(); await p.waitForTimeout(400);
  await p.evaluate(()=>dilAyarla("en")); await p.waitForTimeout(200);
  await p.click('[data-act="startgame"]'); await p.waitForTimeout(300);
  await p.evaluate(()=>{ S.tutorial=false; S.view3d=true; S.tab="pazar"; render(); });
  await p.waitForTimeout(2800);

  ok('pedler görünüyor', await p.evaluate(()=>
     !document.getElementById('w3dpad').classList.contains('hidden')));

  // sol ped: yürü
  const once=await p.evaluate(()=>{const d=W3D_dbg(); return {z:d.cam.position.z, y:d.cam.rotation.y};});
  const sol=await p.evaluate(()=>{const r=document.querySelector('#w3dpad .pad.sol .halka').getBoundingClientRect();
    return {x:r.left+r.width/2, y:r.top+r.height/2};});
  await p.mouse.move(sol.x, sol.y); await p.mouse.down(); await p.waitForTimeout(80);
  const basili=await p.evaluate(()=>({
    on:document.querySelector('#w3dpad .pad.sol').classList.contains('on'),
    tr:document.querySelector('#w3dpad .topuz').style.transform }));
  ok('sol ped basınca aydınlanıyor', basili.on);
  for(let i=0;i<16;i++){ await p.mouse.move(sol.x, sol.y-40); await p.waitForTimeout(50); }
  const topuz=await p.evaluate(()=>document.querySelector('#w3dpad .topuz').style.transform);
  ok('topuz parmağı izliyor', /translate\(.*-?\d/.test(topuz) && topuz!=='translate(0.0px,0.0px)');
  await p.mouse.up(); await p.waitForTimeout(250);
  const sonra=await p.evaluate(()=>{const d=W3D_dbg(); return {z:d.cam.position.z, y:d.cam.rotation.y};});
  ok('sol ped yürütüyor', Math.abs(sonra.z-once.z)>0.5);
  ok('bırakınca sönüyor', await p.evaluate(()=>!document.querySelector('#w3dpad .pad.sol').classList.contains('on')));

  // sağ ped: bak
  await p.mouse.move(210,300); await p.waitForTimeout(300);
  const sag=await p.evaluate(()=>{const r=document.querySelector('#w3dpad .pad.sag .goz').getBoundingClientRect();
    return {x:r.left+r.width/2, y:r.top+r.height/2};});
  await p.mouse.move(sag.x, sag.y); await p.mouse.down(); await p.waitForTimeout(80);
  ok('sağ ped basınca aydınlanıyor',
     await p.evaluate(()=>document.querySelector('#w3dpad .pad.sag').classList.contains('on')));
  for(let i=0;i<10;i++){ await p.mouse.move(sag.x-14*i, sag.y); await p.waitForTimeout(45); }
  const goz=await p.evaluate(()=>document.querySelector('#w3dpad .goz b').style.transform);
  ok('göz bebeği kayıyor', /translate\(-?\d/.test(goz) && goz!=='translate(0px, 0px)');
  await p.mouse.up(); await p.waitForTimeout(200);
  const bak=await p.evaluate(()=>W3D_dbg().cam.rotation.y);
  ok('sağ ped bakış açısını değiştiriyor', Math.abs(bak-once.y)>0.1);

  await p.screenshot({path:'pad-aktif.png'});
  console.log('sayfa hatası:', errs.slice(0,2));
  await b.close();
})();
