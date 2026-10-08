/* Yol, dosyanın kendi konumundan türetiliyor — paketi nereye açarsan aç
   çalışsın diye mutlak yol bırakılmadı. */
const OYUN = require('path').resolve(__dirname, '..');
/* Kayıt katmanı: IndexedDB'ye yazılıyor mu, localStorage silinince
   oradan toparlıyor mu, dışa/içe aktarma çalışıyor mu. */
const {chromium}=require('playwright');
const ok=(k,v)=>console.log((v?'  ok   ':'  FAIL ')+k);
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
    args:['--headless=new','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const ctx=await b.newContext({viewport:{width:420,height:900}});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/three.min.js', r=>r.fulfill({status:404,body:''}));
  const URL='file://'+OYUN+'/preloved.html';
  await p.goto(URL); await p.waitForTimeout(500);
  await p.evaluate(()=>{try{localStorage.clear()}catch(e){}});
  await p.reload(); await p.waitForTimeout(500);
  await p.click('[data-act="startgame"]'); await p.waitForTimeout(400);

  // oyna ve kaydet
  await p.evaluate(()=>{ S.tutorial=false; nextDay(); nextDay(); S.cash=12345; save(); });
  await p.waitForTimeout(900);   // IndexedDB yazma gecikmesi (400 ms) + pay

  const idb=await p.evaluate(()=>new Promise(r=>{
    const q=indexedDB.open("preloved",1);
    q.onsuccess=()=>{ const d=q.result;
      const t=d.transaction("kayit","readonly").objectStore("kayit").get("ana");
      t.onsuccess=()=>r(t.result? {var:true, uzunluk:t.result.v.length, t:t.result.t} : {var:false});
      t.onerror=()=>r({var:false}); };
    q.onerror=()=>r({var:false});
  }));
  ok('IndexedDB kaydı yazıldı', idb.var && idb.uzunluk>500);

  // localStorage'ı sil → açılışta IndexedDB'den toparlamalı
  await p.evaluate(()=>{ localStorage.removeItem("preloved_v1");
                         localStorage.removeItem("preloved_v1_t"); });
  await p.reload(); await p.waitForTimeout(1400);
  const geri=await p.evaluate(()=>({gun:S.day, nakit:Math.round(S.cash), started:S.started,
                                    ls:!!localStorage.getItem("preloved_v1")}));
  ok('localStorage silinince IndexedDB kurtardı', geri.started && geri.gun===3 && geri.nakit===12345);
  ok('localStorage aynası geri yazıldı', geri.ls);

  // dışa / içe aktarma
  const dis=await p.evaluate(()=>KAYIT.disaAktar());
  ok('dışa aktarma metin veriyor', typeof dis==='string' && dis.length>500);
  const ic=await p.evaluate(m=>KAYIT.iceAl(m), dis);
  ok('içe alma kabul etti', ic===true);
  ok('bozuk veri reddedildi', (await p.evaluate(()=>KAYIT.iceAl("{bozuk")))===false);

  // sıfırlama
  await p.evaluate(()=>{ KAYIT.sil(); boot(true); }); await p.waitForTimeout(600);
  await p.reload(); await p.waitForTimeout(1200);
  ok('sıfırlama sonrası yeni oyun', await p.evaluate(()=>S.started!==true));

  console.log('sayfa hatası:', errs.slice(0,3));
  await b.close();
})();
