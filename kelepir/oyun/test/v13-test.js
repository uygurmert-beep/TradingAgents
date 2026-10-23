/* 1.3 yayın öncesi: satış anı (game-feel), kayıt yedeği (save-systems),
   ölçüm altyapısı (performance), ses grupları (audio), nadir kelepir
   (procedural-gen). Kaynak: gamedev-skills/awesome-gamedev-agent-skills. */
const OYUN = require('path').resolve(__dirname, '..');
const {chromium}=require('playwright');
let ok=0, fail=0;
const t=(ad,kos,ek)=>{ if(kos){ok++;console.log('  ok   '+ad);} else {fail++;console.log('  FAIL '+ad+(ek?'  '+ek:''));} };
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--headless=new','--no-sandbox']});
  const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/three.min.js', r=>r.fulfill({path:OYUN+'/three.min.js',contentType:'application/javascript'}));
  await p.goto('file://'+OYUN+'/preloved.html');
  await p.evaluate(()=>{try{localStorage.clear()}catch(e){}}); await p.reload(); await p.waitForTimeout(400);
  await p.click('[data-act="startgame"]'); await p.waitForTimeout(300);
  await p.evaluate(()=>{ S.tutorial=false; S.ogretAdim=99; S.view3d=false; render(); });

  console.log('1) satış anı');
  const k=await p.evaluate(()=>[satisKademe(-5000,100000), satisKademe(3000,200000), satisKademe(30000,200000), satisKademe(60000,200000), satisKademe(300000,5000000)]);
  t('kademe: zarar 0, ufak 1, iyi 2, büyük 3', JSON.stringify(k)==='[0,1,2,3,3]', JSON.stringify(k));
  const sa=await p.evaluate(async()=>{
    const c=genCar(); c.owned=true; c.inspected=true; c.disclosed=true; c.boughtFor=Math.round(valueOf(c,false)*.5); c.spent=0; c.daysListed=1;
    S.cars=[c]; sellCar(c, Math.round(valueOf(c,false)*1.0)); openDealSummary(S.lastDeal);
    const el=document.querySelector('.satis-kar'), ilk=el.textContent;
    await new Promise(z=>setTimeout(z,450));
    const kiv=document.querySelectorAll('.kivilcim').length;
    await new Promise(z=>setTimeout(z,1200));
    return {kademe:S.lastDeal.kademe, ilk, son:el.textContent, hedef:"+"+tl(S.lastDeal.profit), rozet:!!document.querySelector('.satis-kademe.k3'), kiv:kiv+document.querySelectorAll('.kivilcim').length};
  });
  t('büyük kârda kademe 3 ve rozet', sa.kademe===3 && sa.rozet, JSON.stringify(sa));
  t('kâr sıfırdan sayıyor ve hedefe oturuyor', sa.ilk!==sa.hedef && sa.son===sa.hedef, sa.ilk+' → '+sa.son);
  t('büyük kârda ₺ kıvılcımı çıkıyor', sa.kiv>0, String(sa.kiv));
  const az=await p.evaluate(()=>{ closeSheet(); CILA.azHareket=true;
    const c=genCar(); c.owned=true; c.inspected=true; c.boughtFor=Math.round(valueOf(c,false)*.5); S.cars=[c];
    sellCar(c, Math.round(valueOf(c,false))); openDealSummary(S.lastDeal);
    const r=document.querySelector('.satis-kar').textContent==="+"+tl(S.lastDeal.profit) && !document.querySelector('.kivilcim');
    CILA.azHareket=false; closeSheet(); return r; });
  t('hareketi azalt: sayaç ve kıvılcım yok, rakam hemen', az);

  console.log('2) kayıt yedeği');
  const y=await p.evaluate(()=>{ S.cars=[]; S.day=5; save(); S.day=6; save(); S.day=6; save();
    const y1=JSON.parse(localStorage.getItem('preloved_yedek')||'null'), y2=JSON.parse(localStorage.getItem('preloved_yedek2')||'null');
    return {y1:y1&&y1.gun, y2:y2&&y2.gun}; });
  t('gün değişince yedek, önceki gün ikinci kuşak', y.y1===6 && y.y2===5, JSON.stringify(y));
  await p.evaluate(()=>{ KAYIT.hemen(); localStorage.setItem('preloved_v1','{"bozuk":'); });
  await p.waitForTimeout(600); await p.reload(); await p.waitForTimeout(1500);
  t('localStorage bozulsa da kayıt kaybolmuyor (kapanışta yazılan ya da IndexedDB kopyası)', await p.evaluate(()=>S.day===6 && !localStorage.getItem('preloved_bozuk')));
  // iki kopya da bozuk: yalnız günlük yedek kalıyor
  // sayfa kapanırken oyun kaydı yeniden yazar; bozma, yeni sayfa betiklerinden önce
  await p.addInitScript(()=>{ if(!sessionStorage.getItem('bozdum')){ sessionStorage.setItem('bozdum','1'); localStorage.setItem('preloved_v1','{"bozuk":'); } });
  await p.evaluate(()=>new Promise(z=>{
    const r=indexedDB.open('preloved',1); r.onsuccess=()=>{ const tx=r.result.transaction('kayit','readwrite');
      tx.objectStore('kayit').put({id:'ana', t:Date.now()+1e7, v:'{"bozuk":'}); tx.oncomplete=()=>z(); tx.onerror=()=>z(); }; r.onerror=()=>z(); }));
  await p.reload(); await p.waitForTimeout(1500);
  const by=await p.evaluate(()=>({gun:S.day, bozuk:!!localStorage.getItem('preloved_bozuk'), toast:[...(TOAST_Q||[])].map(x=>x.t).join(' ')+' '+(document.querySelector('.toast')||{}).textContent}));
  t('bozuk kayıtta yedekten açılıyor', by.gun===6, JSON.stringify(by));
  t('bozuk kayıt silinmiyor, kenara konuyor', by.bozuk);
  t('oyuncuya yedekten devam ettiği söyleniyor', /yedekten devam/.test(by.toast), by.toast);
  const ay=await p.evaluate(()=>{ S.tutorial=false; S.ogretAdim=99; S.tab='ayar'; render();
    const tx=document.getElementById('screen').innerText; return {oto:/Otomatik yedek/.test(tx), don:!!document.querySelector('[data-act=yedekdon]')}; });
  t('Ayarlar otomatik yedeği ve dönüş düğmesini gösteriyor', ay.oto && ay.don, JSON.stringify(ay));
  const sil=await p.evaluate(()=>{ KAYIT.sil(); return !!localStorage.getItem('preloved_silinen') && KAYIT.yedekler().some(x=>x.kaynak==='silinen'); });
  t('Baştan başla son oyunu "silinen" yuvasında tutuyor', sil);
  const ice=await p.evaluate(()=>{ save(); const once=window.prompt; let cagri=0; window.prompt=()=>{cagri++; return null;};
    document.querySelector('[data-act=kayitice]') ? 0 : (S.tab='ayar', render());
    document.querySelector('[data-act=kayitice]').click(); window.prompt=once;
    return {prompt:cagri, kutu:!!document.getElementById('iceMetin')}; });
  t('Yedek yükleme prompt() kullanmıyor (WebView\'da sessiz)', ice.prompt===0 && ice.kutu, JSON.stringify(ice));
  const iceBoz=await p.evaluate(()=>KAYIT.iceAl('{"x":1}'));
  t('yapısı bozuk metin içe alınmıyor', iceBoz===false);
  await p.evaluate(()=>{ closeSheet(); });

  console.log('3) ses grupları');
  const ses=await p.evaluate(()=>{ sesSeviye('muzik',0); sesSeviye('efekt',1);
    const v=JSON.parse(localStorage.getItem('preloved_seviye'));
    const perde=[]; const eski=SESLER.tik; SESLER.tik=()=>perde.push(SES.perde);
    const h=SES.hazir, a=SES.ac; SES.hazir=true; SES.ac={state:'running'}; SES.kapali=false;
    for(let i=0;i<8;i++){ SES.sonZaman=0; cal('tik'); }
    const sabit=[]; SESLER.tik=eski; const es=SESLER.satis; SESLER.satis=()=>sabit.push(SES.perde); cal('satis'); SESLER.satis=es;
    SES.hazir=h; SES.ac=a;
    S.tab='ayar'; render(); const btn=document.querySelectorAll('[data-act=sesseviye]').length;
    sesSeviye('muzik',2); sesSeviye('efekt',2);
    return {v, farkli:new Set(perde.map(x=>x.toFixed(4))).size, ardisik:perde.every((x,i)=>!i||Math.abs(x-perde[i-1])>=.008), aralik:perde.every(x=>x>=.94&&x<=1.06), sabit:sabit[0], btn, sonra:SES.perde};
  });
  t('müzik ve efekt seviyesi ayrı saklanıyor', ses.v.muzik===0 && ses.v.efekt===1, JSON.stringify(ses.v));
  t('tekrar eden seste perde değişiyor, art arda aynı değil', ses.farkli>=6 && ses.ardisik && ses.aralik, JSON.stringify(ses));
  t('satış akoru sabit perdede, sonra perde sıfırlanıyor', ses.sabit===1 && ses.sonra===1);
  t('Ayarlar\'da iki grup × üç kademe', ses.btn===6, String(ses.btn));

  console.log('4) ölçüm');
  const o=await p.evaluate(async()=>{ const r=await olcumOrnekle('x', 600);
    return {r, karne:olcumKarne({kare:10,medyan:16.7,takilmaOran:0}), zayif:olcumKarne({kare:10,medyan:60,takilmaOran:30}), cihaz:cihazBilgi()}; });
  t('örnekleyici kare, medyan ve %95 veriyor', o.r.kare>5 && o.r.medyan>0 && o.r.p95>=o.r.medyan, JSON.stringify(o.r));
  t('karne eşikleri', o.karne==='iyi' && o.zayif==='zayıf');
  t('cihaz bilgisi', o.cihaz.dpr>0 && typeof o.cihaz.gpu==='string');
  const ct=await p.evaluate(async()=>{ const once=can3d; window.can3d=()=>false;
    const r=await cihazTesti(); window.can3d=once; return {evre:r.evre.map(e=>e.etiket+':'+e.karne), metin:olcumMetin(r), kayit:JSON.parse(localStorage.getItem('preloved_olcum')||'[]').length, tab:S.tab}; });
  t('cihaz testi liste ve sayfa evresini ölçüyor', ct.evre.length>=2 && /Liste kaydırma/.test(ct.metin) && /Sayfa açma/.test(ct.metin), JSON.stringify(ct.evre));
  t('sonuç cihazda saklanıyor, sekme eski hâline dönüyor', ct.kayit>=1 && ct.tab==='ayar', JSON.stringify({k:ct.kayit,t:ct.tab}));
  const ft=await p.evaluate(async()=>{ document.getElementById('app').classList.add('in3d');
    const c=genCar(); FOTO.sira.length=0; FOTO.kapali=false; _ftSiraya(c,'test-'+c.id);
    await new Promise(z=>setTimeout(z,1500)); const bekl=FOTO.sira.length;
    document.getElementById('app').classList.remove('in3d'); FOTO.sira.length=0; return bekl; });
  t('3B sahadayken fotoğraf kuyruğu bekliyor', ft===1, String(ft));

  console.log('5) nadir kelepir');
  const n=await p.evaluate(()=>{
    let kel=0, kotu=0; for(let i=0;i<4000;i++){ const c=genCar(); nadirlikUygula(c,false);
      if(c.kelepir){ kel++; if(!kelepirSaglam(c) || c.ask>valueOf(c,false)*.8 || c.reserve>c.ask) kotu++; } }
    let ikinci=0; for(let i=0;i<500;i++){ const c=genCar(); nadirlikUygula(c,true); if(c.kelepir) ikinci++; }
    const g=gununKelepiri(()=>0), yok=gununKelepiri(()=>.99);
    S.day=10; S.market=[g]; g.age=1; const rep={events:[]}; ageMarket(rep);
    S.market=[gununKelepiri(()=>0)]; S.tab='pazar'; S.view3d=false; render();
    return {kel, kotu, ikinci, g:!!(g&&g.kelepir&&g.kelepirNeden), yok, kalkti:!S.market.length||true, olay:rep.events.map(e=>e.t).join(' '), cip:!!document.querySelector('.chip.kelepir')};
  });
  t('kelepir ilanları doğrulanmış (gizli ağır kusur yok, %80 altı)', n.kel>0 && n.kotu===0, JSON.stringify({kel:n.kel,kotu:n.kotu}));
  t('pazarda kelepir varken ikincisi çıkmıyor', n.ikinci===0);
  t('günlük zar: tutunca kelepir, tutmayınca yok', n.g && n.yok===null);
  t('kelepir iki günde kapılıyor (olay yazılıyor)', /galerici kapmış/.test(n.olay), n.olay);
  t('kartta Kelepir çipi', n.cip);

  console.log('\nsayfa hataları:', errs.length, errs.slice(0,3));
  console.log(`\n${ok} geçti, ${fail} kaldı`);
  await b.close();
  process.exit(fail||errs.length?1:0);
})();
