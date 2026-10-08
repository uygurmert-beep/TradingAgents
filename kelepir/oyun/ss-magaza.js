/* MAĞAZA EKRAN GÖRÜNTÜLERİ
   İki boyut üretiyor:
     Play telefon      1080×1920   (360×640 @3x)
     iPhone 6.9"       1290×2796   (430×932 @3x)
   Oyunu gerçekten oynayıp ilerletiyor; ekranlar uydurma durum değil, oynanmış
   bir kayıt üzerinden çıkıyor — mağaza incelemesinde "görsel uygulamayı
   yansıtmıyor" itirazı buradan gelir. */
const {chromium}=require('playwright');
const fs=require('fs');
const KOK=require('path').resolve(__dirname);
// Mağaza klasörü oyun/'un bir üstünde (kelepir/magaza). Eskiden KOK+'/magaza'
// yazıyordu; görseller oyun/magaza altına, kimsenin bakmadığı yere düşüyordu.
const CIK=require('path').resolve(__dirname,'..')+'/magaza/ss';

const BOY=[
  {ad:'play',   w:360, h:640, dsf:3},   // → 1080×1920
  {ad:'ios',    w:430, h:932, dsf:3},   // → 1290×2796
];

async function hazirla(p){
  await p.goto('file://'+KOK+'/preloved.html');
  await p.evaluate(()=>{try{localStorage.clear()}catch(e){}});
  await p.reload();
  await p.waitForSelector('[data-act="startgame"]');
  await p.waitForTimeout(400);
}

/* Oyunu belli bir noktaya getir: para, araçlar, emanet, satış geçmişi.
   Hepsi oyunun kendi fonksiyonlarıyla — elle state yazıp tutarsız ekran
   üretmemek için. */
async function oyna(p){
  return await p.evaluate(()=>{
    const sec=S.market.slice(0,3);
    for(const c of sec){ buyCar(c, Math.round(c.ask*0.93), "pazar"); }
    const m=S.cars.slice(-3);
    if(m[0]){ m[0].inspected=true; m[0].faults.forEach(f=>f.fixed=true);
              m[0].listPrice=Math.round(valueOf(m[0],false)*1.12); }
    // Filo yerine emanet: bir sahibin bıraktığı araç, oyunun kendi akışıyla.
    if(S.cars.length<S.slots){ S.konsTeklif=konsTeklifUret(); konsKabul();
      const e=S.cars.find(x=>x.konsinye); if(e){ e.inspected=true; } }
    render(); save();
    const f=S.cars.find(x=>x.konsinye);
    return f ? (f.model.n+" · net "+tl(f.konsinye.net)) : "YOK";
  });
}

const cek=async(p, ad, klasor)=>{
  // Bildirimler ekranın üstünü kapatıyor; mağaza görselinde uygulamanın
  // kendisi görünmeli, geçici uyarılar değil.
  await p.waitForTimeout(260);
  // Bildirimler ve rehber kartı ekranın üstünü kapatıyor; mağaza görselinde
  // uygulamanın kendisi görünmeli, geçici katmanlar değil.
  await p.evaluate(()=>{
    const t=document.getElementById('toasts'); if(t) t.innerHTML='';
    const o=document.getElementById('ogret'); if(o) o.innerHTML='';
  });
  await p.waitForTimeout(120);
  await p.screenshot({path:`${klasor}/${ad}.png`});
  console.log('   ', klasor.split('/').pop()+'/'+ad+'.png');
};

(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
    args:['--headless=new','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});

  for(const B of BOY){
    const klasor=`${CIK}/${B.ad}`;
    fs.mkdirSync(klasor,{recursive:true});
    console.log(`\n${B.ad} — ${B.w*B.dsf}×${B.h*B.dsf}`);
    const p=await b.newPage({viewport:{width:B.w,height:B.h},deviceScaleFactor:B.dsf});
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.route('**/three.min.js', r=>r.fulfill({path:KOK+'/three.min.js',contentType:'application/javascript'}));

    await hazirla(p);
    await cek(p,'01-giris',klasor);                       // açılış / kimlik seçimi

    // Önce dolu pazarı çek — araç alırsak liste boşalıyor.
    await p.click('[data-act="startgame"]');
    await p.waitForTimeout(600);
    await p.evaluate(()=>{ S.tutorial=false; S.ogretIz={}; S.ogretAdim=99;
                           S.cash=4200000; S.day=34; S.rep=72; S.xp=4100;
                           S.stats.sold=23; S.stats.profit=5120000; S.stats.bought=26;
                           S.tab="pazar"; render(); });
    await p.waitForTimeout(300);
    // Günlük görevler bloğu ilanları kıyının altına itiyor; listeye kaydır.
    // Kartı üst kokpitin ALTINA getir; scrollIntoView tek başına kartı
    // kokpitin arkasına sokuyor ve ilk ilan yarım görünüyordu.
    await p.evaluate(()=>{
      const k=document.querySelector('.card'); if(!k) return;
      k.scrollIntoView({block:'start'});
      const hud=document.getElementById('hud');
      const h=(hud?hud.getBoundingClientRect().height:0)+10;
      const kaydiricilar=[document.scrollingElement, document.querySelector('main')];
      for(const s of kaydiricilar){ if(s && s.scrollTop>0){ s.scrollTop-=h; break; } }
    });
    await p.waitForTimeout(350);
    await cek(p,'02-pazar',klasor);

    // araç dosyası: ekspertiz bandı ve gözle bakış — gerçekten tıklayarak
    const k1=await p.$('.card');
    if(k1){ await k1.click(); await p.waitForTimeout(700); }
    await cek(p,'03-arac',klasor);

    // pazarlık — müşteri yüzü
    const pz=await p.$('[data-act="negotiate"]');
    if(pz){ await pz.click(); await p.waitForTimeout(900); }
    await cek(p,'04-pazarlik',klasor);
    await p.evaluate(()=>{ S.neg=null; closeSheet(); render(); });
    await p.waitForTimeout(250);

    // şimdi stok kur: ilanda bir araç, bir de emanet
    const emanet=await oyna(p);
    console.log('     emanet aracı:', emanet);

    await p.evaluate(()=>{ S.tab="garaj"; S.garajTab="hazir"; render(); });
    await cek(p,'05-garaj',klasor);

    // Emanet bloğu araç SAYFASINDA (openOwnCar), "araç dosyası" sayfasında değil.
    await p.evaluate(()=>{ const c=S.cars.find(x=>x.konsinye); if(c) openOwnCar(c); });
    await p.waitForTimeout(650);
    await p.evaluate(()=>{
      const b=document.querySelector('#modal .block.emanet');
      if(b) b.scrollIntoView({block:'center'});
    });
    await p.waitForTimeout(400);
    await cek(p,'06-emanet',klasor);
    await p.evaluate(()=>{ closeSheet(); render(); }); await p.waitForTimeout(250);

    await p.evaluate(()=>{ S.tab="rapor"; S.defterAlt="lig"; render(); });
    await cek(p,'07-sirala',klasor);

    await p.evaluate(()=>{ S.tab="garaj"; S.view3d=false; render(); });
    await p.waitForTimeout(350);
    const g3=await p.$('[data-act="view"][data-v="1"]');
    if(g3){ await g3.click(); }
    await p.waitForTimeout(4200);
    await cek(p,'08-3b',klasor);

    console.log('    sayfa hatası:', errs.length);
    await p.close();
  }
  await b.close();
  console.log('\nbitti');
})();
