/* 1.4 test grubu kararları: Türk plakası (V3), SATILIK kâğıdı (V2),
   kaporta şeması + tarama (V6), kapora (M10), hakem heyeti (M1), rakip
   kişilikleri (M5), galeri büyümesi (V9), oto pazarı sabahı (V1) ve
   H1–H8 hataları. 3B bölümü SwiftShader ister. */
const OYUN = require('path').resolve(__dirname, '..');
const {chromium}=require('playwright');
let ok=0, fail=0;
const t=(ad,kos,ek)=>{ if(kos){ok++;console.log('  ok   '+ad);} else {fail++;console.log('  FAIL '+ad+(ek?'  '+ek:''));} };
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
    args:['--headless=new','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/three.min.js', r=>r.fulfill({path:OYUN+'/three.min.js',contentType:'application/javascript'}));
  await p.goto('file://'+OYUN+'/preloved.html');
  await p.evaluate(()=>{try{localStorage.clear()}catch(e){}}); await p.reload(); await p.waitForTimeout(400);
  await p.click('[data-act="startgame"]'); await p.waitForTimeout(300);
  await p.evaluate(()=>{ S.tutorial=false; S.ogretAdim=99; S.view3d=false; S.hepsiAcik=true; render(); });

  console.log('1) Türk plakası');
  const pl=await p.evaluate(()=>{ const a=[]; for(let i=0;i<300;i++) a.push(plate()); return a; });
  t('300 plakanın hepsi "34 ABC 123" biçiminde', pl.every(x=>/^\d{2} [A-Z]{1,3} \d{2,5}$/.test(x)), pl.find(x=>!/^\d{2} [A-Z]{1,3} \d{2,5}$/.test(x)));
  t('il kodu tabloda (plakaIl)', await p.evaluate((a)=>a.every(x=>!!plakaIl(x)), pl));
  t('İstanbul en sık il', await p.evaluate((a)=>{ const m={}; for(const x of a) m[x.slice(0,2)]=(m[x.slice(0,2)]||0)+1;
    return Object.entries(m).sort((x,y)=>y[1]-x[1])[0][0]==="34"; }, pl));
  t('plakada TR bandı', await p.evaluate(()=>/class="plate tr"|plate tr/.test(plateHtml("34 ABC 123"))));

  console.log('2) kaporta şeması');
  const sm=await p.evaluate(()=>{
    let tutarli=true, ayni=true;
    for(let i=0;i<200;i++){ const c=genCar(); const s=ekspSema(c);
      const say=d=>Object.values(s).filter(x=>x===d).length;
      if(say("degisen")!==Math.min(13,c.degisen) || say("boyali")+say("lokal")!==Math.min(13-say("degisen"),c.boyali)) tutarli=false;
      if(JSON.stringify(ekspSema(c))!==JSON.stringify(s)) ayni=false; }
    const c=genCar(); c.degisen=2; c.boyali=3; c.inspected=true;
    const svg=semaSvg(c);
    return {tutarli, ayni, panel:(svg.match(/class="sema-p /g)||[]).length, deg:(svg.match(/sema-p degisen/g)||[]).length};
  });
  t('şema araç sayılarıyla tutarlı (200 araç)', sm.tutarli);
  t('şema her çağrıda aynı (tohumlu)', sm.ayni);
  t('SVG 13 panel, 2 değişen kırmızı', sm.panel===13 && sm.deg===2, JSON.stringify(sm));

  console.log('3) kapora');
  const kp=await p.evaluate(()=>{
    const c=genCar(); c.owned=true; c.inspected=true; c.disclosed=true; c.boughtFor=1; c.spent=0; c.ilanDili="durust";
    c.listPrice=Math.round(valueOf(c,false)); S.cars=[c];
    const kasa0=S.cash, k=kaporaAl(c, c.listPrice, {n:"Murat Bey", k:"aile"});
    const oranOk=k.tutar>=c.listPrice*.028 && k.tutar<=c.listPrice*.052 && S.cash===kasa0+k.tutar;
    const gunOk=k.gelis-S.day>=2 && k.gelis-S.day<=3;
    const p1=kaporaGelmeOlasiligi(c); c.ilanDili="abartili"; const p2=kaporaGelmeOlasiligi(c); c.ilanDili="durust";
    // boz: iki katı iade, itibar −2
    const kasa1=S.cash, rep0=S.rep; kaporaBoz(c);
    const boz=S.cash===kasa1-k.tutar*2 && S.rep===Math.max(0,rep0-2) && !c.kapora;
    // gelme: gün kancası satışı tamamlar
    kaporaAl(c, c.listPrice, {n:"Murat Bey", k:"aile"}); c.kapora.gelis=S.day; const sat0=S.stats.sold||0;
    const mr=Math.random; Math.random=()=>0.01;
    const rep={events:[]};
    S.day++; KANCA.gun.forEach(f=>{ try{ if(String(f).includes("car.kapora")) f(rep); }catch(e){} }); S.day--;
    Math.random=mr;
    return {oranOk, gunOk, p1, p2, boz, satildi:(S.stats.sold||0)>sat0 && !S.cars.includes(c)};
  });
  t('kapora %3–5, kasaya girer, 2–3 gün', kp.oranOk && kp.gunOk, JSON.stringify(kp));
  t('dürüst ilanda alıcı daha çok gelir', kp.p1>kp.p2+.25, kp.p1+' / '+kp.p2);
  t('kapora bozulunca iki katı iade, itibar −2', kp.boz);
  t('alıcı gelince satış tamamlanır', kp.satildi);
  const kc=await p.evaluate(()=>{ const c=genCar(); c.owned=true; c.boughtFor=1; c.spent=0; c.listPrice=Math.round(valueOf(c,false));
    S.cars=[c]; kaporaAl(c,c.listPrice,{n:"X",k:"genc"}); S.tab="garaj"; render(); return !!document.querySelector('.chip.kaporali'); });
  t('garajda "kaporalı" etiketi', kc);

  console.log('4) hakem heyeti');
  const sk=await p.evaluate(()=>{
    S.sikayet=[]; const mr=Math.random;
    const yap=(dil)=>{ const c=genCar(); c.kmOynama=true; c.inspected=false; c.disclosed=false; c.ilanDili=dil; return c; };
    Math.random=()=>0.001; sikayetKaydet(yap("durust"), 500000, {n:"A",k:"aile"}); const durust=S.sikayet.length;
    sikayetKaydet(yap("abartili"), 500000, {n:"A",k:"aile"}); Math.random=mr; const abart=S.sikayet.length;
    const s=S.sikayet[0]; s.gelis=S.day;
    const rep={events:[]}; KANCA.gun.forEach(f=>{ if(String(f).includes("ayıplı mal")) f(rep); });
    const acildi=s.acildi===S.day && rep.events.some(e=>e.sikayet);
    RAY_HEPSI=true; const ray=/data-act="sikayetac"/.test(bugunRayi()); RAY_HEPSI=false;
    openSikayet(s.id); const sayfa=!!document.querySelector('[data-act="sikayetuzlas"]') && !!document.querySelector('[data-act="sikayetitiraz"]');
    closeSheet();
    // cevapsız: 3 gün sonra bedel ×1,3, itibar −3
    const kasa=S.cash, r0=S.rep; S.day+=3; KANCA.gun.forEach(f=>{ if(String(f).includes("ayıplı mal")) f(rep); }); S.day-=3;
    const ceza=Math.round(s.bedel*1.3/500)*500;
    return {durust, abart, acildi, ray, sayfa, cevapsiz:S.cash===kasa-ceza && S.rep===Math.max(0,r0-3) && !S.sikayet.includes(s)};
  });
  t('dürüst ilan şikâyet almaz, abartılı alır', sk.durust===0 && sk.abart===1, JSON.stringify(sk));
  t('gününde dosya açılır, rapora düşer', sk.acildi);
  t('BUGÜN rayında hakem heyeti kartı', sk.ray);
  t('sayfada uzlaş / itiraz', sk.sayfa);
  t('cevapsız dosya: bedel ×1,3, itibar −3', sk.cevapsiz);
  const itz=await p.evaluate(()=>{ const sonuc={rapor:0, raporsuz:0};
    for(const r of [true,false]) for(let i=0;i<400;i++){ const s={id:i, car:genCar(), bedel:10000, rapor:r, acildi:S.day};
      S.sikayet=[s]; const k=S.cash; KANCA.eylem.sikayetitiraz({dataset:{sid:String(i)}}); if(S.cash===k) sonuc[r?"rapor":"raporsuz"]++; }
    TOAST_Q && (TOAST_Q.length=0); return sonuc; });
  t(`ekspertiz raporu itirazı kazandırır (${itz.rapor}/400 ↔ ${itz.raporsuz}/400)`, itz.rapor>200 && itz.raporsuz<100);

  console.log('5) rakip kişilikleri');
  const rk=await p.evaluate(()=>{
    const kis=new Set(S.rivals.map((st,i)=>rakipKisilik(st,i).ad));
    // 120 gece: ilanların ne kadarı rakibe gidiyor, kaçı önceden "baktı" etiketliydi
    let ilan=0, giden=0, uyarili=0; const once=new Map();
    S.cash=5e6;
    for(let g=0;g<120;g++){
      for(const c of S.market){ if(!once.has(c.id)){ once.set(c.id,false); ilan++; } if(c.rakipGoz) once.set(c.id,true); }
      const ids=new Set(S.market.map(c=>c.id)); const rep={events:[]};
      rivalsDay(rep);
      for(const id of ids) if(!S.market.some(c=>c.id===id)){ giden++; if(once.get(id)) uyarili++; }
      S.day++; ageMarket(rep); fillMarket();
    }
    return {kis:kis.size, oran:giden/ilan, uyari:giden?uyarili/giden:1};
  });
  t('dört rakip, en az üç farklı kişilik', rk.kis>=3, String(rk.kis));
  t(`rakibe giden ilan ≤ %25 (${(rk.oran*100).toFixed(0)}%)`, rk.oran<=.26);
  t(`kapılanların çoğu önceden "baktı" etiketliydi (${(rk.uyari*100).toFixed(0)}%)`, rk.uyari>=.6);

  console.log('6) galeri büyümesi, oto pazarı, kelepir');
  const gk=await p.evaluate(()=>{
    const yedek={slots:S.slots, prestij:S.prestij, xp:S.xp};
    S.slots=3; S.prestij=0; S.xp=0; const k0=galeriKademe();
    S.slots=5; const k1=galeriKademe(); S.slots=8; const k2=galeriKademe();
    Object.assign(S,yedek);
    const g6=pazarGunu(6), g7=pazarGunu(7), g14=pazarGunu(14);
    const d=S.day; S.day=7; const m7=marketSize(); S.day=8; const m8=marketSize(); S.day=d;
    return {k:[k0,k1,k2], g6, g7, g14, m7, m8};
  });
  t('kademe 0 → 1 → 2 (park yeri)', JSON.stringify(gk.k)==='[0,1,2]', JSON.stringify(gk.k));
  t('her 7. gün oto pazarı', !gk.g6 && gk.g7 && gk.g14);
  t('pazar gününde 3 ilan fazla', gk.m7===gk.m8+3, gk.m7+' / '+gk.m8);
  const not=await p.evaluate(()=>{ const d=S.day; S.day=6; const a=JSON.stringify(gunNotlari()||""); S.day=d; return /oto pazar/i.test(a); });
  t('pazardan önceki gün yapışkan not', not);
  const tz=await p.evaluate(()=>{ S.day=4; S.market=[]; fillMarket(); const once=S.market.map(c=>c.id).join();
    const mr=Math.random; let x=11; Math.random=()=>{ x=(x*16807)%2147483647; return .97; };  // rakip ve satıcı zarları "olmaz"
    const ilan=new Set(S.market.map(c=>c.id));
    try{ nextDay(); }finally{ Math.random=mr; }
    closeSheet(); return S.market.some(c=>!ilan.has(c.id)); });
  t('hiçbir ilan kalkmasa da sabah en az bir yeni ilan', tz);

  console.log('7) rehber ve arayüz (H-maddeleri)');
  const rh=await p.evaluate(()=>{ const c=S.market[0]; return typeof ogretOneriId==="function" && (ogretOneriId()===null || S.market.some(x=>x.id===ogretOneriId())); });
  t('rehber önerisi pazardaki bir ilan', rh);

  console.log('8) 3B: plaka dokusu, SATILIK kâğıdı, tarama');
  await p.evaluate(()=>{ S.cars=[]; S.day=5;
    for(let i=0;i<3;i++){ const c=genCar(); c.owned=true; c.inspected=true; c.boughtFor=1; c.spent=0; c.boughtDay=1; c.daysListed=0;
      c.extras=[]; c.listPrice=i<2?Math.round(valueOf(c,false)):null; S.cars.push(c); }
    S.cars[0].degisen=2; S.cars[0].boyali=2;
    S.view3d=true; S.tab="garaj"; render(); });
  await p.waitForTimeout(3500);
  const d3=await p.evaluate(()=>{ const {scene}=W3D_dbg(); const ad=[]; scene.traverse(o=>{ if(o.name) ad.push(o.name); });
    const ebeveyn=new Set(); scene.traverse(o=>{ if(o.name==="satilik") ebeveyn.add(o.parent); });
    return {satilik:ad.filter(x=>x==="satilik").length, arac:ebeveyn.size, aktif:W3D.active}; });
  t('3B garaj açık', d3.aktif);
  t(`ilandaki iki araçta, iki yanda SATILIK kâğıdı (${d3.arac} araç, ${d3.satilik} kâğıt)`, d3.arac===2 && d3.satilik===4);
  const tr=await p.evaluate(async()=>{ W3D.ekspertizTara(S.cars[0].id); W3D.refresh(); await new Promise(r=>setTimeout(r,600));
    const {scene}=W3D_dbg(); let n=0; scene.traverse(o=>{ if(o.name==="semaKat" && o.visible) n++; }); return n; });
  t(`tarama sırasında şema katmanı görünür (${tr})`, tr>0);
  // H1: göz işareti komşusunda engel ışını hata vermez (sprite raycast kamerası)
  await p.evaluate(()=>{ for(let i=0;i<4;i++) W3D.sonraki(); });
  await p.waitForTimeout(800);
  t('sayfa hatası yok', errs.length===0, errs.join(' | '));
  console.log(`\n${ok} geçti, ${fail} kaldı`);
  await b.close(); process.exit(fail?1:0);
})();
