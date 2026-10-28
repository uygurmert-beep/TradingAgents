/* Yol, dosyanın kendi konumundan türetiliyor — paketi nereye açarsan aç
   çalışsın diye mutlak yol bırakılmadı. */
const OYUN = require('path').resolve(__dirname, '..');
/* Ekonomi dengesi: basit bir strateji ile 120 gün otomatik oyna, nakit/özsermaye izle. */
const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
    args:['--headless=new','--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage({viewport:{width:420,height:900}});
  p.on('pageerror',e=>console.log('PAGEERROR',e.message));
  await p.route('**/three.min.js', r=>r.fulfill({status:404,body:''}));
  await p.goto('file://'+OYUN+'/preloved.html');
  await p.evaluate(()=>{try{localStorage.clear()}catch(e){}});
  await p.reload(); await p.waitForTimeout(400);
  await p.click('[data-act="startgame"]'); await p.waitForTimeout(300);

  const r=await p.evaluate(async()=>{
    S.tutorial=false;
    const iz=[]; let teklif=0; const oran=[]; const alim=[];
    const net=()=>netWorth();
    const yeni={buyume:0, emanet:0, parti:0, hedef:0};
    for(let gun=1; gun<=120; gun++){
      /* 0) Gerçek oyuncu gibi davran: yer dolunca ve kasa rahatsa büyü,
         kârlı görünen emaneti ve partiyi al. Bot eskiden kontenjan hiç
         almıyordu; kira baskısını oyuncu gibi yaşamıyor, simülasyon
         ekonomiyi olduğundan rahat gösteriyordu. */
      if(S.cars.length>=S.slots && S.slots<10 && S.cash>slotFiyat()*3){ S.cash-=slotFiyat(); S.slots++; yeni.buyume++; }
      if(S.konsTeklif && S.cars.length<S.slots){
        const t=S.konsTeklif; if(valueOf(t.car,true)>t.net*1.12){ if(konsKabul()) yeni.emanet++; } else konsRed();
      }
      if(S.parti && S.slots-S.cars.length>=S.parti.cars.length && S.cash>S.parti.fiyat*1.6){ if(partiAl()) yeni.parti++; }
      // 1) boş yer varsa, iyi fiyatlı aracı al (sorulan fiyat tahmini değerin %88 altıysa)
      for(const c of [...S.market]){
        if(S.cars.length>=S.slots) break;
        let tv=valueOf(c,true);
        if(c.ask>tv*1.15 || (c.reserve||c.ask)*1.03>S.cash*0.5) continue;
        if(!c.inspected && S.cash>PARA.ekspertiz){ S.cash-=PARA.ekspertiz; c.inspected=true; }
        tv=valueOf(c,false);
        const pazar=Math.round((c.reserve||c.ask)*1.03/500)*500;   // iyi pazarlıkçı
        if(pazar<=tv*0.90 && pazar<=S.cash*0.5){
          c.ask=pazar;
          c.owned=true; c.boughtFor=pazar; c.spent=0; c.boughtDay=S.day;
          c.daysListed=0; c.leadsSeen=0; c.listPrice=0;
          S.cash-=pazar; S.cars.push(c);
          S.market.splice(S.market.indexOf(c),1);
          S.stats.bought=(S.stats.bought||0)+1; alim.push({al:pazar,ger:Math.round(valueOf(c,false))});
        }
      }
      // 2) ucuz tamirleri yap, sonra listele
      for(const c of S.cars){
        if(!c.inspected && S.cash>PARA.ekspertiz){ S.cash-=PARA.ekspertiz; c.inspected=true; }
        for(const f of (c.faults||[])){
          if(!f.fixed && f.cost<=S.cash*0.5){ const k=repairCost(f); S.cash-=k; c.spent+=k; f.fixed=true; }
        }
        if(!c.listPrice){ if(c.konsinye) c.inspected=true;
          c.listPrice=Math.round(Math.max(carCost(c)*1.08, valueOf(c,false)*1.02)/500)*500; c.disclosed=true; }
      }
      // 3) gelen teklifleri değerlendir: maliyetin üstündeyse kabul
      for(const o of [...(S.offers||[])]){
        const c=S.cars.find(x=>x.id===o.carId);
        if(!c){ dropOffer(o.oid); continue; }
        const mal=carCost(c);
        teklif++; oran.push(+(o.amount/mal).toFixed(3)); if(o.amount>=mal*1.04){ sellCar(c,o.amount,"sim"); dropOffer(o.oid); }
        else if(c.daysListed>14 && o.amount>=mal*0.97){ sellCar(c,o.amount,"sim"); dropOffer(o.oid); }
      }
      // 4) uzun süre satılmayanda fiyat kır
      for(const c of S.cars) if(c.daysListed>8 && c.daysListed%4===0)
        c.listPrice=Math.round(c.listPrice*0.97/500)*500;

      nextDay();
      // Arayüzdeki "sezonu kapat" düğmesinin yaptığı sıfırlama; bot düğmeye basmıyor.
      if(S.report&&S.report.season){ S.seasonGross=0; S.seasonSales=0; S.seasonProfit=0; S.report.seasonSeen=true; }
      if(gun%15===0) iz.push({gun:S.day, nakit:Math.round(S.cash), net:Math.round(net()),
        stok:S.cars.length, satildi:S.stats.sold||0, borc:Math.round(S.debt), rep:Math.round(S.rep),
        lv:level(), xp:Math.round(S.xp)});
    }
    yeni.hedef=S.stats.hedefTuttu||0; yeni.konsSatis=S.stats.konsSatis||0; yeni.konsIade=S.stats.konsIade||0;
    return {iz, yeni, son:{slot:S.slots, nakit:Math.round(S.cash), net:Math.round(netWorth()),
      satildi:S.stats.sold||0, alindi:S.stats.bought||0, teklif, alim, oranOrt:+(oran.reduce((a,b)=>a+b,0)/(oran.length||1)).toFixed(3), oranMax:Math.max(...oran), tas:Object.keys(S.milestones||{}).length}};
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})();
