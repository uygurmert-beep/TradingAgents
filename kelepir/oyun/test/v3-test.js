/* v3 oyun testi kararları (OYUN-TESTI-KARARLAR-v3.md): araç karakteri,
   taksitli satış hesabı, bağlayıcı "altına inmem", satış tavanı, müzayede
   zarfı ve yeni ekranlar. Sayısal ölçütler kararların kabul ölçütlerinden. */
const OYUN = require('path').resolve(__dirname, '..');
const {chromium}=require('playwright');
let ok=0, fail=0;
const t=(ad,kos)=>{ if(kos){ok++;console.log('  ok   '+ad);} else {fail++;console.log('  FAIL '+ad);} };
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--headless=new','--no-sandbox']});
  const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route('**/three.min.js', r=>r.fulfill({path:OYUN+'/three.min.js',contentType:'application/javascript'}));
  await p.goto('file://'+OYUN+'/preloved.html');
  await p.evaluate(()=>{try{localStorage.clear()}catch(e){}}); await p.reload(); await p.waitForTimeout(400);
  await p.click('[data-act="startgame"]'); await p.waitForTimeout(300);
  await p.evaluate(()=>{ S.tutorial=false; S.ogretAdim=99; render(); });

  console.log('1) araç karakteri (5.000 araç)');
  const a=await p.evaluate(()=>{
    const r={zincirTriger:0, yersizImza:0, evImkansiz:0, otoDebriyaj:0, klasikFilo:0, klasikSay:0,
             yeniKoleksiyon:0, yeniSay:0, e30Ariza:0, e30Triger:0, h190Triger:0, sanzCift:0};
    const EVYOK=["triger","yagkacak","enjektor","turbo","motorrev","debriyaj","otosanziman","sanzimanrev"];
    for(let i=0;i<5000;i++){
      const c=genCar(), m=c.model, ks=c.faults.map(f=>f.k);
      if(m.ky==="zincir" && ks.includes("triger")) r.zincirTriger++;
      for(const f of c.faults){ const d=FAULTS.find(x=>x.k===f.k); if(d&&d.imza&&!(m.zf||[]).includes(f.k)) r.yersizImza++; }
      if(c.fuel==="Elektrik" && ks.some(k=>EVYOK.includes(k))) r.evImkansiz++;
      if(c.gear==="Otomatik" && ks.includes("debriyaj")) r.otoDebriyaj++;
      if(ks.includes("otosanziman") && ks.includes("sanzimanrev")) r.sanzCift++;
      if(m.seg==="klasik"){ r.klasikSay++; if(c.seller.k==="filo") r.klasikFilo++; }
      if(m.seg!=="klasik" && YEAR-c.year<5){ r.yeniSay++; if(c.seller.k==="koleksiyoncu") r.yeniKoleksiyon++; }
    }
    const e30=MODELS.find(m=>m.n==="Bavera E30 2.0"), h190=MODELS.find(m=>m.n==="Hessler 190 2.0");
    for(let i=0;i<600;i++){
      const c=genCar({model:e30}); r.e30Ariza+=c.faults.length; r.e30Triger+=c.faults.filter(f=>f.k==="triger").length;
      const d=genCar({model:h190}); r.h190Triger+=d.faults.filter(f=>f.k==="triger").length;
    }
    r.evDem=MODELS.filter(m=>m.f==="Elektrik").every(m=>m.dem<1);
    r.modelSay=MODELS.length;
    return r;
  });
  t('zincirli motorda triger arızası yok', a.zincirTriger===0);
  t('imza arızası (zincir, süspansiyon) yalnız kendi modelinde', a.yersizImza===0);
  t('elektrikli araçta imkânsız arıza yok', a.evImkansiz===0);
  t('otomatikte "debriyaj seti" yok', a.otoDebriyaj===0);
  t('şanzıman revizyonu ile bakımı aynı raporda yok', a.sanzCift===0);
  t(`klasikte filo satıcı yok (${a.klasikFilo}/${a.klasikSay})`, a.klasikFilo===0);
  t(`5 yaş altı araçta koleksiyoncu ≤%3 (${a.yeniKoleksiyon}/${a.yeniSay})`, a.yeniKoleksiyon<=a.yeniSay*.03);
  t(`E30'da arızaların ≥%25'i triger (${a.e30Triger}/${a.e30Ariza})`, a.e30Triger>=a.e30Ariza*.25);
  t('Hessler 190 (zincirli) triger çıkarmıyor', a.h190Triger===0);
  t('elektrikli modellerin talebi 1\'in altında', a.evDem);

  const kl=await p.evaluate(()=>{
    const cl=MODELS.filter(m=>m.cl); let esit=0, n=0, arizasiz=0;
    for(let i=0;i<500;i++){ const c=genCar({model:pick(cl)}); n++;
      const w=Object.values(c.wear).map(Math.round); if(w.every(x=>x===w[0])) esit++;
      if(!c.faults.length && c.klasikHal!=="restore") arizasiz++; }
    return {esit, n, arizasiz};
  });
  t(`klasiklerde organlar artık hep eşit değil (${kl.esit}/${kl.n})`, kl.esit<kl.n*.05);
  t('restore olmayan klasik en az bir arızayla geliyor', kl.arizasiz===0);

  console.log('2) alıcı-araç uyumu');
  const al=await p.evaluate(()=>{
    let pah=0, genc=0, tic=0, esnaf=0;
    for(let i=0;i<4000;i++){
      const c=genCar(); c.listPrice=Math.round(valueOf(c,false)*1.03);
      const bt=pickBuyerType(c);
      if(c.listPrice>1500000){ pah++; if(bt.k==="genc") genc++; }
      if(c.model.seg==="ticari"){ tic++; if(bt.k==="esnaf") esnaf++; }
    }
    return {pah, genc, tic, esnaf};
  });
  t(`₺1,5M üstü araçta genç sürücü ≤%5 (${al.genc}/${al.pah})`, al.genc<=al.pah*.05);
  t(`ticari araçta esnaf ≥%35 (${al.esnaf}/${al.tic})`, al.esnaf>=al.tic*.35);

  console.log('3) pazarlık kuralları');
  const pz=await p.evaluate(()=>{
    let tabanAlti=0, artis=0, alti=0, ilkKabul=0, n=0, esit=true;
    for(let k=0;k<5000;k++){
      const c=genCar(); const er=effReserve(c,[]); const ng={tur:0};
      let teklif=Math.round(c.ask*.80/500)*500, son=null;
      for(let t=0;t<7;t++){
        const r=sellerReply(c,teklif,er,ng);
        if(r.act==="accept"){ if(ng.tabanSoz && teklif<ng.tabanSoz) tabanAlti++; if(t===0) ilkKabul++; break; }
        ng.tur++; if(r.price<teklif) alti++; if(son!==null && r.price>son) artis++;
        son=r.price; ng.sonKarsi=r.price; if(r.taban) ng.tabanSoz=r.price;
        teklif = ng.tabanSoz ? ng.tabanSoz-5000 : Math.min(r.price, Math.round(teklif*1.03/500)*500);
      }
      n++;
    }
    // ekrandaki pazarlık ile kural motoru aynı koz tavanını kullanır
    const c=genCar(); S.neg={carId:c.id, disc:.5, hard:0, mood:50}; S.market.push(c);
    esit = negReserve()===effReserve(c,[{cut:.5}]);
    S.neg=null; S.market.pop();
    return {tabanAlti, artis, alti, ilkKabul, n, esit};
  });
  t('"altına inmem" denen fiyatın altı kabul edilmiyor', pz.tabanAlti===0);
  t('karşı teklif turdan tura yükselmiyor', pz.artis===0);
  t('karşı teklif oyuncunun teklifinin altına inmiyor', pz.alti===0);
  t(`ilanın %20 altına ilk teklif nadiren kabul (${pz.ilkKabul}/${pz.n})`, pz.ilkKabul<=pz.n*.10);
  t('ekran ve kural motoru aynı koz tavanı', pz.esit);

  console.log('4) satış tavanı');
  const st=await p.evaluate(()=>{
    let ustu=0, n=0;
    for(let k=0;k<5000;k++){
      const c=genCar(); c.owned=true; c.inspected=true; c.disclosed=true; c.listPrice=Math.round(valueOf(c,false)*1.03/500)*500;
      const bt=pickBuyerType(c);
      const s={bt, base:Math.round(c.listPrice*.9), list:c.listPrice, lifts:.2, guven:80, ilgi:70, counter:null, taksit:null,
               tavanKat:Math.min(1, (.965+Math.random()*.065)*Math.min(1.02,bt.sat.butce))};
      for(const f of [c.listPrice, c.listPrice*1.02, c.listPrice*1.10]){ const r=saleReply(s,Math.round(f)); if(r.act==="accept"&&f>c.listPrice) ustu++; if(r.price>c.listPrice) ustu++; }
      n++;
    }
    return {ustu, n};
  });
  t('taksitsiz satışta alıcı ilan fiyatının üstünü ödemiyor', st.ustu===0);

  console.log('5) taksitli satış hesabı');
  const tk=await p.evaluate(()=>{
    const c=genCar(); c.owned=true; c.boughtFor=400000; c.spent=0; c.inspected=true; c.ekspBedel=0; c.daysListed=0;
    S.cars.push(c); const kar0=S.stats.profit, kasa0=S.cash;
    sellCar(c, 200000, "taksitli", 300000);
    const d=S.lastDeal;
    return {kar:d.profit, sell:d.sell, alacak:d.alacak, kasaFark:S.cash-kasa0, statFark:S.stats.profit-kar0};
  });
  t(`taksitli satışta kâr satışın tamamından (${tk.kar})`, tk.kar>0 && tk.sell>=500000);
  t(`kasaya yalnız peşinat giriyor (${tk.kasaFark})`, tk.kasaFark>=200000 && tk.kasaFark<300000);   // görev ödülü de girebilir
  t('istatistik kârı da tamamdan', tk.statFark===tk.kar);

  console.log('6) müzayede');
  const mz=await p.evaluate(()=>{ let top=0, n=0, mx=0;
    for(let k=0;k<1000;k++){ const c=genCar({auction:true}); const rz=rakipZarflari(c); if(!rz.length) continue;
      const w=rz[0].bid/valueOf(c,false); top+=w; mx=Math.max(mx,w); n++; }
    return {ort:top/n}; });
  t(`kazanan zarf / gerçek değer ortalaması %88-100 (${(mz.ort*100).toFixed(1)})`, mz.ort>=.88 && mz.ort<=1.0);

  console.log('7) ekranlar');
  const ek=await p.evaluate(async()=>{
    const r={};
    for(const tab of ["pazar","garaj","muzayede","galeri","rapor","ayar"]){
      S.tab=tab; render();
      const e=[...document.querySelectorAll('#screen [data-act="endday"]')];
      r[tab]=e.length===1 && e[0].getBoundingClientRect().height>0;
    }
    S.tab="pazar"; render();
    // alım özeti
    const c=S.market.find(x=>x.ask<S.cash);
    S.cars=[]; S.neg=null; closeSheet();
    openMarketCar(c); document.querySelector('#sheet [data-act="negotiate"]').click();
    S.neg.sonKarsi=c.ask; document.getElementById('negInput').value=c.ask;
    document.querySelector('[data-act="offer"]').click();
    r.ozet=!!document.querySelector('#sheet .alim-ozet') && /inerdi|tabanından/.test(document.getElementById('sheet').innerText);
    document.querySelector('[data-act="alimgit"]').click();
    r.garaj=S.tab==="garaj" && S.garajTab==="hazir";
    // pencere açıkken arkadaki "Günü bitir" sayılmaz
    const gun=S.day; openSheet('<div class="sheet-head"><div class="sheet-title">x</div></div>');
    document.querySelector('#screen [data-act="endday"]').click();
    r.modalKoruma=S.day===gun; closeSheet();
    // yazı boyutu
    S.yazi=1.3; render();
    r.yazi=document.documentElement.classList.contains('yk') && parseFloat(getComputedStyle(document.querySelector('.sec-note, .hint')).fontSize)>=15.5;
    r.tasma=document.documentElement.scrollWidth<=390;
    S.yazi=1; render();
    return r;
  });
  for(const tab of ["pazar","garaj","muzayede","galeri","rapor","ayar"]) t(`"${tab}" sekmesinde tek Günü bitir`, ek[tab]);
  t('alımdan sonra alım özeti kartı', ek.ozet);
  t('"Garaja git" yeni aracın sekmesini açıyor', ek.garaj);
  t('pencere açıkken arkadan gün bitmiyor', ek.modalKoruma);
  t('çok büyük yazıda ikincil metin ≥15,6px', ek.yazi);
  t('çok büyük yazıda yatay taşma yok', ek.tasma);

  // 1.0 geri bildirimi: 3B'de üst düğmelere dokunuş sahneye yutuluyordu (iPhone)
  const dok=await p.evaluate(()=>{
    const host=document.getElementById('world');
    return ['.w3dback','.w3dgun'].map(sel=>{
      const el=host.querySelector(sel); if(!el) return false;
      const ev=new Event('touchstart',{bubbles:true,cancelable:true});
      el.dispatchEvent(ev); return !ev.defaultPrevented;
    });
  });
  t('3B üst düğmelerde dokunuş engellenmiyor (Liste, Günü bitir)', dok.every(Boolean));

  console.log('8) kademeli açılış (1.1)');
  const ka=await p.evaluate(()=>{
    const r={};
    // yeni kariyer benzetimi: satışsız oyuncu
    S.acilan={}; S.yeniSistem={}; S.hepsiAcik=false; S.prestij=0; S.stats.sold=0; S.orders=[]; S.konsTeklif=null; S.parti=null; S.day=1;
    S.cars=[]; S.tutorial=false; S.tab="pazar";
    const say=()=>{ render(); return document.querySelectorAll('.ray .ajkart:not(.ajtumu)').length + (document.querySelector('.ray .ajtumu')?99:0); };
    r.g=[];
    for(let d=1; d<=3; d++){ r.g.push(say()); closeSheet(); S.report=null; nextDay(); S.report=null; closeSheet(); }
    r.siparisYok=(S.orders||[]).length===0 && S.konsTeklif==null;
    // ilk satış sonrası: her gün en çok bir YENİ
    S.stats.sold=1; r.yeni=[];
    for(let d=0; d<4; d++){ nextDay(); S.report=null; closeSheet(); r.yeni.push(Object.keys(S.yeniSistem||{}).length); S.yeniSistem={}; }
    r.acilanSay=Object.keys(S.acilan).length;
    return r;
  });
  t(`satışsız oyuncuda 1.-3. gün rayda ≤3 kart (${ka.g.join(", ")})`, ka.g.every(x=>x<=3));
  t('ilk satıştan önce sipariş ve emanet yok', ka.siparisYok);
  t(`satıştan sonra günde en çok bir yeni sistem (${ka.yeni.join(", ")})`, ka.yeni.every(x=>x<=1) && ka.acilanSay>=2);

  console.log('9) usta notu (1.1)');
  const un=await p.evaluate(()=>{
    const r={}; S.ustaNotKapali=false; S.day=3; S.stats.sold=0;
    // 1) pahalı ilan, teklif yok
    const c=genCar(); c.owned=true; c.inspected=true; c.disclosed=true; c.boughtFor=100000; c.spent=0; c.daysListed=3;
    c.listPrice=Math.round(valueOf(c,false)*1.15); S.cars=[c];
    const a1=ustaNotu([]); r.k1=a1&&a1.act==="cutto" && /\d/.test(a1.t) && a1.t.length<=140;
    // 2) maliyet altı teklif
    c.listPrice=Math.round(valueOf(c,false)); c.boughtFor=valueOf(c,false)*2;
    const a2=ustaNotu([{oid:1, carId:c.id, amount:Math.round(valueOf(c,false))}]); r.k2=a2&&a2.act==="salenego";
    // 3) boş garaj
    S.cars=[]; S.cash=Math.max(S.cash, 5e6); const a3=ustaNotu([]); r.k3=a3&&a3.act==="ustapazar";
    // 4) ekspertizsiz araç
    const d=genCar(); d.owned=true; d.inspected=false; d.boughtDay=S.day-1; S.cars=[d]; const a4=ustaNotu([]); r.k4=a4&&a4.act==="hazirla";
    // 8. günden sonra ve 3 satıştan sonra yok
    S.day=9; S.stats.sold=3; r.yok=ustaNotu([])===null;
    S.cars=[]; return r;
  });
  t('usta notu: pahalı ilanda fiyat indirme', un.k1);
  t('usta notu: maliyet altı teklifte pazarlık', un.k2);
  t('usta notu: boş garajda pazara yönlendirme', un.k3);
  t('usta notu: ekspertizsiz araçta Hazırla', un.k4);
  t('usta notu: ilk günler geçince çıkmıyor', un.yok);

  console.log('\nsayfa hataları:', errs.length, errs.slice(0,3));
  console.log(`\n${ok} geçti, ${fail} kaldı`);
  await b.close();
  process.exit(fail||errs.length?1:0);
})();
