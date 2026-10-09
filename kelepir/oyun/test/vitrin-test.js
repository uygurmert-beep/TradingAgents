/* Yol, dosyanın kendi konumundan türetiliyor — paketi nereye açarsan aç
   çalışsın diye mutlak yol bırakılmadı. */
const OYUN = require('path').resolve(__dirname, '..');
/* 3B vitrin: yürüme pedlerinin yerine gelen döndür-yakınlaş-geç görünümü.
   Gerçekten sürükleyip dokunarak çalışır. */
const {chromium}=require('playwright');
let ok=0, fail=0;
const t=(ad,kos)=>{ if(kos){ok++;console.log('  ok   '+ad);} else {fail++;console.log('  FAIL '+ad);} };
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
    args:['--headless=new','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/three.min.js', r=>r.fulfill({path:OYUN+'/three.min.js',contentType:'application/javascript'}));
  await p.goto('file://'+OYUN+'/preloved.html');
  await p.evaluate(()=>{try{localStorage.clear()}catch(e){}}); await p.reload(); await p.waitForTimeout(400);
  await p.click('[data-act="startgame"]'); await p.waitForTimeout(300);
  await p.evaluate(()=>{ S.tutorial=false; S.ogretAdim=99; S.view3d=true; S.tab="pazar"; render(); });
  await p.waitForTimeout(3500);

  const v0=await p.evaluate(()=>W3D.vitrin);
  t('vitrin ilk araçla açılıyor', v0.adet>0 && v0.i===0);
  t('yürüme pedleri yok', await p.evaluate(()=>!document.getElementById('w3dpad')));
  t('alt kartta önceki/sonraki ve sıra var', await p.evaluate(()=>
    !!document.querySelector('[data-act="w3dsonra"]') && !!document.querySelector('.w3dsira')));

  // ilk kare: odaktaki araç ekranın üst üçte ikisinde, kadrajın içinde
  const kadraj=await p.evaluate(()=>{
    const {cam}=W3D_dbg(); const f=W3D.focus.obj; const v=f.position.clone(); v.y=.7; v.project(cam);
    return {x:v.x, y:v.y};
  });
  t(`araç kadrajın ortasında (x ${kadraj.x.toFixed(2)})`, Math.abs(kadraj.x)<.35);
  t(`araç alt kartın üstünde (y ${kadraj.y.toFixed(2)})`, kadraj.y>-.35);

  // sürükle: kamera aracın etrafında döner
  const a0=(await p.evaluate(()=>W3D.vitrin)).aci;
  await p.mouse.move(220,330); await p.mouse.down();
  for(let i=0;i<14;i++){ await p.mouse.move(220-i*12,330); await p.waitForTimeout(35); }
  await p.mouse.up(); await p.waitForTimeout(700);
  const a1=(await p.evaluate(()=>W3D.vitrin)).aci;
  t('sürüklemek aracın etrafında döndürüyor', Math.abs(a1-a0)>.4);
  t('sürüklemek aracı değiştirmiyor', (await p.evaluate(()=>W3D.vitrin)).i===0);

  // kamera çitin dışına çıkmıyor
  const cit=await p.evaluate(async()=>{
    let enDis=0;
    for(let k=0;k<24;k++){ W3D.sec(0); await new Promise(r=>setTimeout(r,20)); }
    const {cam}=W3D_dbg();
    for(let k=0;k<36;k++){
      W3D.pointerDown({clientX:200,clientY:300}); W3D.pointerMove({clientX:140,clientY:300}); W3D.pointerUp({clientX:140,clientY:300});
      await new Promise(r=>setTimeout(r,60)); enDis=Math.max(enDis, Math.abs(cam.position.x));
    }
    return enDis;
  });
  t(`kamera saha çitinin içinde kalıyor (en dış x ${cit.toFixed(1)})`, cit<10.1);

  // sonraki/önceki
  await p.evaluate(()=>document.querySelector('[data-act="w3dsonra"]').click()); await p.waitForTimeout(400);
  t('› sıradaki araca geçiyor', (await p.evaluate(()=>W3D.vitrin)).i===1);
  await p.evaluate(()=>document.querySelector('[data-act="w3donce"]').click()); await p.waitForTimeout(400);
  t('‹ geri dönüyor', (await p.evaluate(()=>W3D.vitrin)).i===0);
  await p.evaluate(()=>W3D.onceki()); await p.waitForTimeout(200);
  t('baştan geri basınca sona sarıyor', await p.evaluate(()=>W3D.vitrin.i===W3D.vitrin.adet-1));

  // hızlı fiske sıradakine geçirir
  await p.evaluate(()=>W3D.sec(0)); await p.waitForTimeout(300);
  // Başsız tarayıcıda her fare olayı bir kare bekliyor; fiske zamanlaması
  // kesin olsun diye olaylar doğrudan veriliyor (gerçek dokunuşla aynı yol).
  await p.evaluate(()=>{ W3D.pointerDown({clientX:300,clientY:330}); W3D.pointerMove({clientX:220,clientY:332});
    W3D.pointerMove({clientX:150,clientY:334}); W3D.pointerUp({clientX:150,clientY:334}); });
  await p.waitForTimeout(300);
  t('hızlı sola fiske sıradaki araca geçiyor', (await p.evaluate(()=>W3D.vitrin)).i===1);

  // tekerlek yakınlaştırır
  const u0=(await p.evaluate(()=>W3D.vitrin)).uzak;
  await p.mouse.move(200,300); for(let i=0;i<5;i++){ await p.mouse.wheel(0,-120); await p.waitForTimeout(40); }
  await p.waitForTimeout(600);
  t('tekerlek yakınlaştırıyor', (await p.evaluate(()=>W3D.vitrin)).uzak < u0-.1);

  /* ---------- gözle ekspertiz ---------- */
  // ilk ilana tek bir bilinen iz koy: gizli kapı çiziği (boyalı panel yok —
  // rastgele yerleşen paneller "temiz" noktayı bozmasın)
  await p.evaluate(()=>{ closeSheet();
    const c=S.market[0]; c.inspected=false; c.boyali=0; c.degisen=0; c.goz=[];
    c.faults=c.faults.filter(f=>!["kapiboya","camurluk","altsac","yagkacak"].includes(f.k));
    const f=FAULTS.find(x=>x.k==="kapiboya");
    c.faults.push({id:_uid++,k:f.k,n:f.n,comp:f.c,cost:f.cost,gain:f.gain,dm:f.dm,visible:false,fixed:false});
    W3D.refresh(); });
  await p.waitForTimeout(2500);
  await p.evaluate(()=>W3D.sec(0)); await p.waitForTimeout(1800);
  t('ekspertizsiz araçta GÖZLE BAK şeridi var', await p.evaluate(()=>!!document.querySelector('.w3dgoz')));
  t('gizli kapı çiziği bir ipucu olarak çiziliyor', await p.evaluate(()=>W3D.focus.obj.userData.ipucu.some(q=>q.k==="kapiboya")));
  /* Komşu araçlar görüş hattına girebiliyor (dokunuş onlara düşerse odak
     doğru biçimde oraya geçer). Test, dokunmadan önce yan etkisiz ışınla
     hem çiziğin hem de izsiz bir noktanın odaktaki araca düştüğü bir açı arar. */
  const acilar=await p.evaluate(async()=>{
    const ekr=(q)=>{ const {cam,ren}=W3D_dbg(); const o=W3D.focus.obj; const r=ren.domElement.getBoundingClientRect();
      const v=o.localToWorld(new THREE.Vector3(...q)); v.project(cam); return {x:r.left+(v.x+1)/2*r.width, y:r.top+(1-v.y)/2*r.height}; };
    const o=W3D.focus.obj, q=o.userData.ipucu.find(x=>x.k==="kapiboya");
    const sx=Math.sign(q.poz[0])||1, ry=o.rotation.y;
    const taban=Math.atan2(sx*Math.cos(ry), -sx*Math.sin(ry));
    for(const d of [0,.35,-.35,.7,-.7,1.0,-1.0,1.3,-1.3]){
      W3D.aciAyarla(taban+d); await new Promise(r=>setTimeout(r,900));
      const k=ekr(q.poz), b=ekr([q.poz[0]*.9, .55, -o.userData.size.l/2+.30]);   // burun köşesi: iz yok
      const hk=W3D.isabet(k.x,k.y), hb=W3D.isabet(b.x,b.y);
      if(hk&&hk.arac==="odak"&&hk.ipucu==="kapiboya" && hb&&hb.arac==="odak"&&!hb.ipucu){
        // Kontrol ile dokunuş aynı karede: arada kamera kayıp dokunuşu başka
        // yere düşürmesin. Ekran→sahne eşlemesi fiske/dokunuş testlerinde sınanıyor.
        W3D.dokun(b.x,b.y);
        const temiz=/temiz/.test(document.querySelector('.w3dgoz').textContent) && !(S.market[0].goz||[]).length;
        const kapali=document.getElementById('modal').classList.contains('hidden');
        W3D.dokun(k.x,k.y);
        return {temiz, kapali};
      }
    }
    return null;
  });
  t('çiziği ve temiz bir noktayı gösteren açı bulundu', !!acilar);
  t('izsiz yere dokunmak "temiz" diyor ve bulgu yazmıyor', !!acilar && acilar.temiz);
  t('pazarda araca dokunmak sayfa açmıyor (göz modu)', !!acilar && acilar.kapali);
  await p.waitForTimeout(400);
  const gz=await p.evaluate(()=>({goz:S.market[0].goz, gorunur:S.market[0].faults.find(f=>f.k==="kapiboya").visible,
    koz:negLeverage(S.market[0]).map(l=>l.t), isaret:W3D.focus.obj.children.filter(c=>c.name==="gozIsaret").length}));
  t('ize dokunmak bulguyu araca yazıyor', (gz.goz||[]).includes("kapiboya"));
  t('bulunan gizli kusur artık görünür', gz.gorunur===true);
  t('bulgu pazarlıkta koz oluyor', gz.koz.some(x=>/Kapıda çizik/.test(x)));
  t('araçta işaret beliriyor', gz.isaret>=1);
  await p.evaluate(()=>W3D.refresh()); await p.waitForTimeout(2500);
  t('işaret sahne yenilense de kalıyor', await p.evaluate(()=>W3D.focus.obj.children.some(c=>c.name==="gozIsaret")));
  // İncele düğmesi sayfayı açar
  await p.evaluate(()=>document.querySelector('[data-act="w3dopen"]').click()); await p.waitForTimeout(500);
  t('İncele düğmesi inceleme sayfasını açıyor',
    await p.evaluate(()=>!document.getElementById('modal').classList.contains('hidden')));
  const neg=await p.evaluate(()=>{ closeSheet(); openNegotiation(S.market[0]); return S.neg.known.map(k=>k.t); });
  t('pazarlık ekranında gözle bulunan koz listede', neg.some(x=>/Kapıda çizik/.test(x)));
  // ekspertizli araçta göz modu yok
  t('ekspertizli araçta GÖZLE BAK yok', await p.evaluate(()=>{ closeSheet(); S.neg=null; S.market[0].inspected=true; W3D.refresh(); return true; }) &&
    await (async()=>{ await p.waitForTimeout(2500); return p.evaluate(()=>{ W3D.sec(0); return !document.querySelector('.w3dgoz'); }); })());

  console.log('\nsayfa hataları:', errs.slice(0,3));
  if(errs.length) fail+=errs.length;
  console.log(`\n${ok} geçti, ${fail} kaldı`);
  await b.close(); process.exit(fail?1:0);
})();
