/* Yol, dosyanın kendi konumundan türetiliyor — paketi nereye açarsan aç
   çalışsın diye mutlak yol bırakılmadı. */
const OYUN = require('path').resolve(__dirname, '..');
/* MAĞAZA KABUĞU TESTİ
   Tarayıcıdaki oyunu değil, Android/iOS kabuğuna giren dosyayı sınar
   (app/www/index.html). Buradaki hatalar mağaza reddine ya da "kullanıcıda
   açılmıyor" şikâyetine dönüşüyor, o yüzden ayrı tutuluyor. */
const {chromium}=require('playwright');
const fs=require('fs');
let ok=0, fail=0;
const t=(ad,kos)=>{ if(kos){ok++;console.log('  ok   '+ad);} else {fail++;console.log('  FAIL '+ad);} };
const KOK=OYUN+'/app/www';

(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
    args:['--headless=new','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});

  /* ---------- 1) dış kaynak yok ---------- */
  console.log('1) çevrimdışı bütünlük');
  const kabukHtml=fs.readFileSync(KOK+'/index.html','utf8');
  t('kabukta cdnjs yok', !/cdnjs|unpkg|jsdelivr/i.test(kabukHtml));
  t('kabukta http(s) betik/stil yok',
    !/(src|href)\s*=\s*["']https?:\/\//i.test(kabukHtml));
  t('three.js yerel dosyadan', /src="three\.min\.js"/.test(kabukHtml));
  for(const d of ['three.min.js','manifest.webmanifest','icon-512.png'])
    t('paket içinde '+d, fs.existsSync(KOK+'/'+d));
  const man=JSON.parse(fs.readFileSync(KOK+'/manifest.webmanifest','utf8'));
  t('manifest adı Kelepir', man.short_name==='Kelepir');
  t('manifest dikey kilitli', man.orientation==='portrait');
  t('manifest dili tr', man.lang==='tr');

  /* ---------- 2) kabuk temiz açılıyor ---------- */
  console.log('2) kabuk açılışı');
  const p=await b.newPage({viewport:{width:393,height:852}});
  const errs=[], dis=[];
  p.on('pageerror',e=>errs.push(e.message));
  p.on('request',r=>{ if(!/^file:|^data:|^blob:/.test(r.url())) dis.push(r.url()); });
  // Capacitor köprüsünü taklit et: kabukta neyin değiştiğini görmek için
  await p.addInitScript(()=>{
    const cagrilar=[];
    window.__cagrilar=cagrilar;
    const kaydet=(ad)=>new Proxy({},{get:(_,k)=>(...a)=>{cagrilar.push(ad+'.'+String(k));return Promise.resolve();}});
    window.Capacitor={
      isNativePlatform:()=>true, getPlatform:()=>'android',
      Plugins:{ App:{addListener:(ev,fn)=>{window.__geri=ev==='backButton'?fn:window.__geri;
                                           cagrilar.push('App.addListener:'+ev);},
                     exitApp:()=>{cagrilar.push('App.exitApp');}},
                SystemBars:kaydet('SystemBars'),
                SplashScreen:kaydet('SplashScreen'),
                ScreenOrientation:kaydet('ScreenOrientation'),
                Haptics:kaydet('Haptics') }
    };
  });
  await p.goto('file://'+KOK+'/index.html');
  await p.waitForSelector('[data-act="startgame"]');
  await p.waitForTimeout(700);
  t('sayfa hatası yok ('+errs.length+')', errs.length===0);
  t('dış ağ isteği yok ('+dis.length+')', dis.length===0);

  const cag=await p.evaluate(()=>window.__cagrilar);
  t('açılış ekranı kapatıldı', cag.some(x=>x.startsWith('SplashScreen.hide')));
  t('dikey kilit istendi', cag.some(x=>x.startsWith('ScreenOrientation.lock')));
  t('sistem çubuğu koyu temaya alındı', cag.some(x=>x.startsWith('SystemBars.setStyle')));
  t('geri tuşu dinleyicisi bağlandı', cag.includes('App.addListener:backButton'));

  /* ---------- 3) servis çalışanı kabukta kayıtlı DEĞİL ---------- */
  console.log('3) servis çalışanı');
  // Capacitor Android "https://localhost" şeması kullanıyor; burada kayıt
  // açılsaydı güncellemeden sonra eski index.html sunulurdu.
  const swVar=await p.evaluate(async()=>{
    if(!navigator.serviceWorker) return false;
    const r=await navigator.serviceWorker.getRegistrations().catch(()=>[]);
    return r.length>0;
  });
  t('kabukta servis çalışanı kaydı yok', swVar===false);

  /* ---------- 4) güvenli alan zinciri ---------- */
  console.log('4) güvenli alan');
  const sa=await p.evaluate(()=>{
    const d=document.documentElement, g=()=>getComputedStyle(d).getPropertyValue('--sat').trim();
    const once=g();
    d.style.setProperty('--safe-area-inset-top','48px');   // Capacitor'ün yaptığı
    const sonra=g();
    d.style.removeProperty('--safe-area-inset-top');
    return {once, sonra};
  });
  t('enjekte edilen inset --sat üzerine geçiyor ('+sa.sonra+')', sa.sonra==='48px');
  t('inset gelmeden emniyet tabanı var ('+sa.once+')', parseFloat(sa.once)>0);

  /* ---------- 5) haptik kabukta Capacitor'e gidiyor ---------- */
  console.log('5) haptik');
  const hap=await p.evaluate(()=>{
    const n=window.__cagrilar.length;
    try{ titre(HAPTIK.orta); }catch(e){ return 'hata:'+e.message; }
    return window.__cagrilar.slice(n);
  });
  t('titreşim Capacitor Haptics üzerinden', Array.isArray(hap) && hap.some(x=>x.startsWith('Haptics.')));

  /* ---------- 6) donanım geri tuşu sırası ---------- */
  console.log('6) geri tuşu');
  await p.click('[data-act="startgame"]'); await p.waitForTimeout(500);
  const ust=await p.evaluate(()=>{
    document.documentElement.style.setProperty('--safe-area-inset-top','48px');
    const el=document.querySelector('#hud');
    const d=el?parseFloat(getComputedStyle(el).paddingTop):-1;
    document.documentElement.style.removeProperty('--safe-area-inset-top');
    return d;
  });
  t('üst kokpit çentik kadar aşağı itiliyor ('+ust+'px)', ust>=48);
  await p.evaluate(()=>{ S.tab="rapor"; render(); }); await p.waitForTimeout(150);
  await p.evaluate(()=>APP.geriAdim()); await p.waitForTimeout(150);
  t('sekmeden pazara döndü', await p.evaluate(()=>S.tab==="pazar"));

  await p.evaluate(()=>{ S.view3d=true; render(); }); await p.waitForTimeout(250);
  await p.evaluate(()=>APP.geriAdim()); await p.waitForTimeout(150);
  t('3B görünümden çıktı', await p.evaluate(()=>S.view3d===false));

  const kart=await p.$('.card');
  if(kart){ await kart.click(); await p.waitForTimeout(350); }
  t('araç sayfası açıldı', await p.evaluate(()=>!document.getElementById('modal').classList.contains('hidden')));
  await p.evaluate(()=>APP.geriAdim()); await p.waitForTimeout(250);
  t('geri tuşu sayfayı kapattı',
    await p.evaluate(()=>document.getElementById('modal').classList.contains('hidden')));
  t('ana ekranda geri boşa düşüyor (çıkış onayına kalıyor)',
    await p.evaluate(()=>APP.geriAdim()===false));

  /* ---------- 7) duraklat/devam et ---------- */
  console.log('7) yaşam döngüsü');
  const yasam=await p.evaluate(async()=>{
    S.day=7; S.cash=1234567; save();
    window.dispatchEvent(new Event('blur'));
    await new Promise(r=>setTimeout(r,250));
    const ham=localStorage.getItem('preloved_v1');
    return !!(ham && JSON.parse(ham).cash===1234567);
  });
  t('arka plana geçerken kayıt yazıldı', yasam);

  await b.close();
  console.log(`\n${ok} geçti, ${fail} kaldı`);
  process.exit(fail?1:0);
})();
