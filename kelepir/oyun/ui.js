/* ================= durum ================= */
/* ==================================================================
   TÜRKİYE İŞLETME SABİTLERİ
   Araç fiyatları Ekim 2026 Türkiye pazarına çapalı (bkz. MODELS).
   Hizmet kalemleri araç fiyatıyla aynı oranda büyümüyor: Türkiye'de
   işçilik araca göre ucuz. Bu bilinçli — "her tamiri yapma" dersi
   zayıflamasın diye büyük revizyon cezası (dm<1) korunuyor.
   ================================================================== */
const PARA={
  ekspertiz:   2500,      // bir araç ekspertizi
  otoparkGun:   350,      // araç başına günlük otopark + bekleme
  otoparkZor:   480,      // gerçekçi modda
  maasEksper:  2800,      // ekspertiz uzmanı, günlük
  maasSatis:   2400,      // satış danışmanı, günlük
  kiraTaban:   45000,     // sezon kapanışı dükkân kirası (15 günlük pay)
  kiraSlot:    12000,     // kontenjan başına ek sezon kirası
  kiraSeviye:  26000,     // her seviye için sezon kirasına eklenen basamak
  dukkanGun:        6,    // yandaki dükkân teklifi kaç gün açık kalır
  vitrin:      45000,     // 5 günlük vitrin ilanı
  krediDilim: 500000,     // bir çekişte alınan tutar
  krediEnAz:  400000,
  krediEnCok:12000000,
  slotTaban:  450000,     // +1 park kontenjanı
  slotArtis:  250000,
  satinalmaEsik:12000000, // rakip galeri satın alma kilidi (özsermaye)
  /* --- senetli alım --- */
  senetPesin:  0.50,      // peşin ödenen oran
  senetPrim:   0.07,      // vadeye eklenen bedel
  senetTaksit: 2,         // kalan kaç parçaya bölünür
  senetAra:    8,         // taksitler kaç gün arayla
  senetTavan:  2.2        // nakdinin en çok bu katına kadar araç alınabilir
};

const XP_LEVELS=[0,120,350,700,1200,1900,2800,4000];
/* Kayıt biçimi sürümü.
   3 = dolar ekonomisi (ABD sürümü)
   4 = Türkiye pazarı, TL ekonomisi, 45 marka / 130 model
   Daha eski bir kayıt açılırsa ekonomi yeniden kurulur (bkz. gocEt). */
const SURUM=5;   // 5: model tablosu B seviyesi isimlere geçti, yakıt modele bağlandı
let S;

function blankState(){
  return {
    day:1, cash:3100000, xp:0, rep:50, slots:3, debt:0,
    tab:"pazar", market:[], cars:[], auction:[], auctionDay:0, auctionBids:{},
    staff:{eksper:false, satis:false}, marketingDays:0,
    history:[], report:null, neg:null, seenTabs:{}, tutorial:true, ogretAdim:0, ogretIz:{}, rivals:newRivals(),
    receivables:[], perks:{}, perkPts:0, lastBill:0,
    started:false, archetype:null, filter:"hepsi", sale:null, offers:[], oidSeq:1,
    event:null, orders:[], contacts:{}, favors:{}, milestones:{}, bestRank:5, view3d:false,
    vedatDay:0, vedatCars:[], ordersDone:0, seasonProfit:0, seasonSales:0, lastRank:5,
    stats:{bought:0, sold:0, profit:0, repairs:0, caught:0},
    surum:SURUM, gunluk:null, gunSayac:null, seri:null,
    koleksiyon:{}, kolOdul:0, lig:null, sonLig:null, prestij:0, enIyiNetDeger:0,
    zorluk:"normal", lot:lotVarsayilan(), karne:null, karneSnap:null, meydan:null,
    demoYapildi:false, demoIslendi:false, giderToplam:0, senetler:[], senetSeq:1
  };
}
function tl(n){
  const v=Math.round(n||0);
  return (v<0?"-₺":"₺")+new Intl.NumberFormat(EN()?"en-US":"tr-TR").format(Math.abs(v));
}
function tlk(n){
  const v=Math.round(n||0), en=EN(), a=Math.abs(v), im=v<0?"-₺":"₺";
  const ond=(x,b)=>{ const s=String(+x.toFixed(b)); return en?s:s.replace(".",","); };
  if(a>=1000000) return im+ond(a/1000000,2)+"M";
  if(a>=100000)  return im+ond(a/1000,0)+"K";
  if(a>=10000)   return im+ond(a/1000,1)+"K";
  return tl(v);
}
function num(n){return new Intl.NumberFormat(EN()?"en-US":"tr-TR").format(Math.round(n))}
/* mesafe: TR'de km, EN'de mil (depoda hep km tutulur) */
function mesafe(k){
  const v=Math.round(k||0);
  return EN() ? new Intl.NumberFormat("en-US").format(Math.round(v*0.6214))+" mi"
              : new Intl.NumberFormat("tr-TR").format(v)+" km";
}
/** Yüzde: TR "%0,35" — EN "0.35%" */
function yuzde(v){
  const s=new Intl.NumberFormat(EN()?"en-US":"tr-TR",{maximumFractionDigits:2}).format(v);
  return EN() ? s+"%" : "%"+s;
}
function level(){ let l=1; for(let i=0;i<XP_LEVELS.length;i++) if(S.xp>=XP_LEVELS[i]) l=i+1; return l; }
function nextXp(){ const l=level(); return XP_LEVELS[l]||XP_LEVELS[XP_LEVELS.length-1]; }
function unlocked(t){
  // Müzayede 4. günde bir "tanıtım müzayedesi" ile açılır; seviye 2'yi
  // beklemek ilk oturumu tek döngüye hapsediyordu.
  if(t==="muzayede") return level()>=2 || S.day>=4;
  if(t==="galeri") return level()>=3 || S.day>=12;
  return true;
}

/* ================= kayıt ================= */
function save(){
  try{
    const metin=JSON.stringify(serialize());
    if(typeof KAYIT!=="undefined") KAYIT.yaz(metin);
    else localStorage.setItem("preloved_v1", metin);
  }catch(e){}
}
function serialize(){
  const carOut=c=>({...c, model:MODELS.indexOf(c.model), seller:c.seller?SELLERS.indexOf(c.seller):-1});
  return {...S, market:S.market.map(carOut), cars:S.cars.map(carOut),
          auction:S.auction.map(carOut), report:null, neg:null, sale:null,
          konsTeklif:S.konsTeklif?{...S.konsTeklif, car:carOut(S.konsTeklif.car)}:null,
          parti:S.parti?{...S.parti, cars:S.parti.cars.map(carOut)}:null};
}
function deserialize(d){
  const carIn=c=>({...c, model:MODELS[c.model]||MODELS[0], seller:c.seller>=0?SELLERS[c.seller]:null});
  d.market=(d.market||[]).map(carIn); d.cars=(d.cars||[]).map(carIn); d.auction=(d.auction||[]).map(carIn);
  if(d.konsTeklif) d.konsTeklif.car=carIn(d.konsTeklif.car);
  if(d.parti) d.parti.cars=(d.parti.cars||[]).map(carIn);
  /* Filo kaldırıldı (yerine konsinye geldi). Kiradaki araç sözleşmesi
     bitmiş sayılır ve normal stoğa döner — alan bırakılsaydı hiçbir
     ekran onu göstermeyeceği için araç görünmez bir kilitte kalırdı. */
  for(const c of d.cars) delete c.kira;
  d.report=null; d.neg=null; d.sale=null;
  return d;
}
/** Eski ölçekteki kayıtları Türkiye/TL ekonomisine taşı: piyasa yeniden
    kurulur, elindeki araçlar bugünkü TL değerinden alınmış sayılır, kariyer
    (gün, seviye, itibar, uzmanlık, defter, prestij) olduğu gibi korunur.
    Model listesi de değiştiği için kayıttaki araçlar yeni tabloya düşürülür. */
function gocEt(){
  if((S.surum||0)>=SURUM) return false;
  const sv=level();
  S.market=[]; S.auction=[]; S.auctionBids={};
  refreshMarket();
  for(const c of (S.cars||[])){
    // Eski kayıttaki model artık tabloda olmayabilir: segmentine uyan bir
    // modele taşı ki değerleme ve defter tutarlı kalsın.
    if(!MODELS.includes(c.model)){
      const uyan=MODELS.filter(m=>m.seg===(c.model&&c.model.seg));
      c.model = uyan.length ? pick(uyan) : pick(MODELS);
    }
    const ger=valueOf(c,false);
    c.boughtFor=Math.round(ger*0.9/500)*500;
    c.spent=0; c.daysListed=c.daysListed||0; c.leadsSeen=0;
    if(c.listPrice) c.listPrice=Math.round(ger*1.05/500)*500;
  }
  S.cash=2800000+(sv-1)*950000;
  S.debt=0; S.receivables=[];
  S.rivals=newRivals();
  S.offers=[]; S.orders=[];
  S.lig=null; S.sonLig=null;
  S.surum=SURUM;
  save();
  setTimeout(()=>toast("Oyun Türkiye pazarına taşındı — fiyatlar TL'ye çevrildi, piyasa ve kasan yeniden kuruldu. Kariyerin duruyor.","good"), 900);
  return true;
}
function load(){
  try{
    const raw=localStorage.getItem("preloved_v1");
    if(!raw) return false;
    S=deserialize(JSON.parse(raw));
    if(!S.stats) return false;
    return true;
  }catch(e){ return false; }
}

/* ================= piyasa ================= */
function marketSize(){ return 6+Math.min(3,level()-1); }
function fillMarket(){
  const n=marketSize();
  const budget=Math.max(900000, S.cash*1.06);
  let guard=0;
  const sayim=()=>{ const m={}; for(const c of S.market) m[c.model.n]=(m[c.model.n]||0)+1; return m; };
  while(S.market.length<n && guard++<600){
    const c=genCar();
    const m=sayim();
    if((m[c.model.n]||0)>=2 && guard<500) continue;   // aynı modelden en çok iki ilan
    S.market.push(c);
  }
  // İlk günlerde tüm sermayeyi tek araca gömme tuzağı olmasın: nakdinin
  // yarısının altında en az üç ilan bulunsun.
  if(S.day<=3 && S.cars.length===0 && !zorGercek()){
    const ucuz=Math.max(250000, S.cash*0.5);
    let t2=0;
    while(S.market.filter(c=>c.ask<=ucuz).length<3 && t2++<400){
      const c=genCar();
      if(c.ask<=ucuz){
        const pahali=[...S.market].sort((a,b)=>b.ask-a.ask)[0];
        if(pahali && S.market.length>=n) S.market.splice(S.market.indexOf(pahali),1);
        S.market.push(c);
      }
    }
  }
  // bütçene uygun en az iki ilan garantisi
  let tries=0;
  const enAz=zorGercek()?1:2;
  while(S.market.filter(c=>c.ask<=budget).length<enAz && tries++<300){
    const c=genCar();
    if(c.ask<=budget){
      const swap=S.market.findIndex(x=>x.ask>budget && !x.inspected);
      if(swap>=0) S.market[swap]=c; else S.market.push(c);
    }
  }
}
function refreshMarket(){ S.market=[]; fillMarket(); }

/** Tanıdıkların getirdiği özel ilanlar. */
function contactListings(rep){
  const selim=cLvl("selim");
  if(selim){
    const mevcut=S.market.filter(c=>c.fromSelim).length;
    for(let i=mevcut;i<selim;i++){
      let c=null;
      for(let t=0;t<40 && !c;t++){
        const x=genCar();
        if(openFaults(x).length>=3) c=x;
      }
      if(c){
        c.fromSelim=true;
        c.ask=Math.round(c.ask*rnd(.62,.76)/250)*250;
        c.reserve=Math.round(c.reserve*.72);
        S.market.unshift(c);
        if(rep&&chance(.5)) rep.events.push({t:`&Ccedil;ekici Selim haber verdi: ${c.model.n} ${c.year}, hurdadan &ccedil;ıkma, ${tl(c.ask)}.`});
      }
    }
  }
  const vedat=cLvl("vedat");
  if(vedat && S.day-(S.vedatDay||0)>=5){
    S.vedatDay=S.day;
    S.market=S.market.filter(c=>!c.fromVedat);
    for(let i=0;i<vedat;i++){
      const c=genCar();
      c.fromVedat=true;
      c.seller=SELLERS.find(s=>s.k==="galerici");
      c.ask=Math.round(valueOf(c,true)*rnd(.86,.96)/250)*250;
      c.reserve=Math.round(valueOf(c,false)*.84);
      c.pat=4;
      S.market.unshift(c);
    }
    if(rep) rep.events.push({t:`Galerici Vedat ${vedat} ara&ccedil; yolladı — elinden &ccedil;ıkarmak istedikleri pazarda.`});
  }
}

/** İlanlar bir gün eskir: bazıları kalkar, bazıları fiyat kırar. */
function ageMarket(rep){
  for(const c of [...S.market]){
    c.age=(c.age||0)+1;
    if(c.age>2 && chance(.09)){
      S.market=S.market.filter(x=>x!==c);
      if(c.inspected) rep.events.push({t:`${c.model.n} ${c.year} ilandan kalktı — satıcı vazgeçti. Ekspertiz parası cepte kaldı.`});
      continue;
    }
    if(c.age>3 && chance(.22)){
      c.ask=Math.round(c.ask*.97/250)*250;
      c.reserve=Math.round(c.reserve*.985);
      c.cutDay=S.day;
    }
  }
}

/* ================= rakip galeriler ================= */
function rivalPressure(seg){
  let n=0;
  for(const r of (S.rivals||[])) for(const it of r.stock) if(it.seg===seg) n++;
  return n;
}
function rivalsDay(rep){
  if(!S.rivals) S.rivals=newRivals();
  S.rivals.forEach((st,i)=>{
    const def=rivalDef(st,i);
    // stoğunu satmaya çalışır
    for(const it of [...st.stock]){
      it.days++;
      const p=clamp(.20 - it.margin*.40 + it.days*.015, .04, .45);
      if(Math.random()<p){
        const price=Math.round(it.val*rnd(.93,1.04));
        st.cash+=price; st.profit+=price-it.buy; st.sold++;
        st.stock=st.stock.filter(x=>x!==it);
      }
    }
    // pazardan araç kapar
    if(st.stock.length<def.cap && Math.random()<def.aggr){
      let best=null,bs=0;
      for(const c of S.market){
        if(!def.segs.includes(c.model.seg)) continue;
        if(c.ask>st.cash*.55) continue;
        const score=rivalValue(c)*def.target-c.ask*.88;
        if(score>bs){ bs=score; best=c; }
      }
      if(best){
        const price=Math.round(best.ask*rnd(.87,.96)/500)*500;
        st.cash-=price;
        const val=valueOf(best,false);
        // Rakip aracı vitrinine koyuyor: oyuncu onu fiyatıyla görebilsin.
        const ister=Math.round(val*rnd(1.04,1.16)/500)*500;
        st.stock.push({seg:best.model.seg, name:`${best.model.n} ${best.year}`,
                       buy:price, val, ister, margin:(val-price)/price, days:0});
        S.market=S.market.filter(c=>c.id!==best.id);
        /* Rakip sessizce araç götürüyordu; oyuncu kaybettiğini fark bile
           etmiyordu. Artık ilgilendiğin araçlar isimle rapora düşüyor. */
        const ad=`${best.model.n} ${best.year}`;
        if(best.inspected)
          rep.events.push({bad:true, t:`${st.n}, ekspertiz ettirdiğin <b>${ad}</b>'i kaptı — ${tl(price)}. Rapor parası boşa gitti.`});
        else if((best.bakilan||[]).length)
          rep.events.push({bad:true, t:`${st.n}, hızlı baktırdığın <b>${ad}</b>'i senden önce aldı — ${tl(price)}.`});
        else if(best.gorulen)
          rep.events.push({bad:true, t:`${st.n}, incelediğin <b>${ad}</b>'i kaptı — ${tl(price)}. Vitrinine ${tl(ister)} koydu.`});
        else if(chance(.45))
          rep.events.push({t:`${st.n}, ${ad} ilanını kapattı.`});
      }
    }
  });
}
function creditLimit(){
  const taban=clamp(netWorth()*.7*(S.rep/50), PARA.krediEnAz, PARA.krediEnCok);
  return Math.round((perk("banka")?taban*2:taban)/50000)*50000;
}
function prestijSatisCarpani(){ return 1+(S.prestij||0)*0.04; }
function netWorth(){
  /* senet borcu da bir yükümlülük: özsermaye hesabından düşülüyor */
  /* emanet aracın değeri bizim değil: sahibine borçlu olunan net düşülüyor */
  return S.cash + S.cars.reduce((s,c)=>s+valueOf(c,false)*.9,0) - S.debt - senetBorcu() - konsBorcu();
}
function standings(){
  const rows=(S.rivals||[]).map(r=>({n:r.n, d:r.d, w:r.cash+r.stock.reduce((s,i)=>s+i.val*.9,0), sold:r.sold, stock:r.stock.length, me:false}));
  rows.push({n:"Senin galerin", d:"", w:netWorth(), sold:S.stats.sold, stock:S.cars.length, me:true});
  return rows.sort((a,b)=>b.w-a.w);
}
function refreshAuction(){
  S.auction=[]; S.auctionBids={};
  const n=4;
  for(let i=0;i<n;i++) S.auction.push(genCar({auction:true}));
  S.auctionDay=S.day;
}

/* ================= gün döngüsü ================= */
function nextDay(){
  const rep={day:S.day, costs:[], offers:[], events:[], total:0, season:null};
  // giderler
  const park=S.cars.length*(zorGercek()?PARA.otoparkZor:PARA.otoparkGun);
  if(park) rep.costs.push(["Otopark / kira", park]);
  let salary=0;
  if(S.staff.eksper) salary+=PARA.maasEksper;
  if(S.staff.satis) salary+=PARA.maasSatis;
  if(salary) rep.costs.push(["Personel maaşı", salary]);
  let interest=0;
  if(S.debt>0){ interest=Math.round(S.debt*(perk("banka")?0.0018:0.0035)); rep.costs.push(["Kredi faizi", interest]); }
  // sezon kapanışı: sabit giderler
  if(S.day>1 && (S.day-1)%SEASON_LEN===0){
    const kira=kapanisKirasi(rep);
    const vergi=Math.round(Math.max(0,S.seasonProfit||0)*.08);
    rep.costs.push([`Sezon kapanışı — dükkân kirası`, kira]);
    if(vergi) rep.costs.push(["Sezon kapanışı — vergi (%8)", vergi]);
    rep.season={from:seasonOf(S.day-1).k, to:seasonOf(S.day).k};
    S.cash-=kira+vergi;
    rep.total+=kira+vergi;
  }
  // taksit tahsilatı
  for(const r of [...(S.receivables||[])]){
    if(r.due>S.day) continue;
    if(chance(r.risk)){
      S.receivables=S.receivables.filter(x=>x!==r);
      S.receivables=S.receivables.filter(x=>x.saleId!==r.saleId);
      S.rep=clamp(S.rep-3,0,100);
      rep.events.push({bad:true, t:`${r.who} taksitini ödemedi — ${r.n} satışından ${tl(r.amount*r.left)} tahsil edilemedi. İtibar −3.`});
    }else{
      S.cash+=r.amount;
      S.receivables=S.receivables.filter(x=>x!==r);
      rep.events.push({t:`${r.who} taksitini yatırdı — ${tl(r.amount)} (${r.n}).`});
    }
  }
  // İtibar tek yönlü düşmesin: kötü bir olay yaşanmadıysa her gün hafifçe
  // toparlanır. Taban 32 — dibe vurup oyunun ölmesini engeller.
  const kotuGun = rep.events.some(e=>e.bad);
  // Dipte kalıcı hapis olmasın: itibar 25'in altındaysa her gün biraz toparlar,
  // kötü gün olsa bile. Üstünde ise yalnızca temiz günlerde yükselir.
  if(S.rep<25) S.rep=clamp(S.rep+0.30,0,100);
  if(!kotuGun && S.rep<32) S.rep=clamp(S.rep+0.45,0,100);
  else if(!kotuGun && S.rep<55) S.rep=clamp(S.rep+0.12,0,100);

  try{ senetGun(rep); }catch(e){}
  const totalCost=park+salary+interest;
  S.cash-=totalCost;
  rep.total+=totalCost;
  S.giderToplam=(S.giderToplam||0)+rep.total;

  // ilanlar
  for(const c of S.cars){
    if(!c.listPrice) continue;
    c.daysListed++;
    if(Math.random()<leadChance(c,S)){
      c.leadsSeen++;
      const b=makeBuyer(c,S);
      if(b.walk){
        S.rep=clamp(S.rep-4,0,100); S.stats.caught++;
        rep.events.push({bad:true, t:`${c.model.n} — ${b.type?b.type.n.toLocaleLowerCase("tr"):"alıcı"} ekspertize götürdü, "${b.issues[0].t}" çıktı. Gizlediğin için vazgeçti. İtibar −4.`});
      }else{
        const teklif={oid:S.oidSeq++, carId:c.id, amount:b.offer, caught:b.caught, issues:b.issues,
                      inspects:b.inspects, type:b.type, takas:b.takas||null, taksit:b.taksit||null,
                      day:S.day, expires:S.day+2};
        S.offers.push(teklif); rep.offers.push(teklif.oid);
      }
    }
  }
  // piyasa olayı
  if(S.event){
    S.event.kalan--;
    if(S.event.kalan<=0){
      rep.events.push({t:`<b>${S.event.n}</b> etkisi bitti. Piyasa normale d&ouml;n&uuml;yor.`});
      S.event=null;
    }
  }else if(S.day>4 && chance(.16)){
    const def=pick(EVENTS);
    S.event={k:def.k, n:def.n, d:def.d, kalan:def.gun,
             model: def.model?pick(MODELS).n:null};
    rep.events.push({olay:true, t:`<b>${def.n}</b> — ${def.d}${S.event.model?` (${S.event.model})`:""}. ${def.gun} g&uuml;n s&uuml;recek.`});
  }

  // siparişler
  S.orders=(S.orders||[]).filter(o=>{
    if(o.deadline<S.day){
      // Park yerin doluysa zaten alamazdın: müşteri küsmez.
      const suc = S.cars.length < S.slots;
      if(suc){
        S.rep=clamp(S.rep-1,0,100);
        rep.events.push({t:`${o.who} beklediği aracı bulamadığın i&ccedil;in vazge&ccedil;ti. İtibar −1.`});
      } else {
        rep.events.push({t:`${o.who} beklemekten vazge&ccedil;ti &mdash; park yerin doluydu, kimse su&ccedil;lamadı.`});
      }
      return false;
    }
    return true;
  });
  // İlk sipariş 2. günde garanti gelir: oyuncu bu sistemi ilk oturumda görsün.
  if(S.orders.length<2 && ((S.day<=2 && S.orders.length===0) || (S.day>2 && chance(S.orders.length?.18:.34)))){
    const o=genOrder(S.day, level());
    S.orders.push(o);
    rep.events.push({siparis:true, t:`<b>${o.who}</b> ara&ccedil; arıyor: ${SEGLBL[o.seg]} &middot; ${o.minYear}+ &middot; en fazla ${mesafe(o.maxKm)}${o.gear?" &middot; "+o.gear:""}. B&uuml;t&ccedil;e ${tl(o.butce)}, prim ${tl(o.prim)}. ${o.deadline-S.day} g&uuml;n s&uuml;re.`});
  }

  // süresi dolan teklifler
  for(const o of [...(S.offers||[])]){
    if(o.expires<=S.day){
      const c=S.cars.find(x=>x.id===o.carId);
      S.offers=S.offers.filter(x=>x!==o);
      if(c) rep.events.push({t:`${c.model.n} i&ccedil;in ${o.type?o.type.n.toLocaleLowerCase("tr"):"alıcı"} teklifi d&uuml;şt&uuml; &mdash; ${tl(o.amount)}. Bir daha aramadı.`});
    }
  }
  if(S.marketingDays>0) S.marketingDays--;
  S.day++;
  ageMarket(rep);
  rivalsDay(rep);
  fillMarket();
  contactListings(rep);
  try{ yerGun(rep); }catch(e){}
  try{ konsinyeGun(rep); }catch(e){}
  try{ yanGorevGun(rep); }catch(e){}
  checkMilestones();
  gunlukKur(true);
  ligRakipGun();
  if(unlocked("muzayede") && (S.day%3===1 || S.auctionDay===0 || S.day===4)) refreshAuction();
  try{ karneKontrol(); }catch(e){}
  S.report=rep;
  save();
  openReport();
}

function carCost(c){ return c.boughtFor+c.spent+(c.inspected?PARA.ekspertiz:0)+c.daysListed*PARA.otoparkGun; }

function seasonIndex(){ return Math.floor((S.day-1)/SEASON_LEN); }

/* ================= final ================= */
function openEnding(){
  const st=S.stats;
  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">Piyasanın sahibi</div>
        <div class="sheet-sub">${S.day}. g&uuml;n</div></div></div>
    <div class="crest">
      <div class="eyebrow" style="margin-bottom:10px">D&ouml;rt galeri de senin</div>
      <div class="sn" style="color:var(--sodium)">Kapandı</div>
    </div>
    <div class="block">
      <div style="font-size:13.5px;line-height:1.6;color:#C3CBD1">
        Bir k&ouml;şedeki d&ouml;rt araba sığan otoparktan başladın. Şimdi bu şehirde ikinci el fiyatını sen belirliyorsun.
        Bu şehirde kaç tabela varsa indi.</div>
    </div>
    ${prestijKarti()}
    <button class="btn primary full" data-act="prestij" style="margin:8px 0 2px">Yeni şehre taşın &rarr;</button>
    <div class="block"><h4>KARİYER</h4>
      <div class="kv"><span>Ge&ccedil;en g&uuml;n</span><b>${S.day}</b></div>
      <div class="kv"><span>Alınan / satılan</span><b>${st.bought} / ${st.sold}</b></div>
      <div class="kv"><span>Toplam k&acirc;r</span><b class="pos">${tl(st.profit)}</b></div>
      <div class="kv"><span>&Ouml;zsermaye</span><b>${tl(netWorth())}</b></div>
      <div class="kv"><span>Teslim edilen sipariş</span><b>${S.ordersDone||0}</b></div>
      <div class="kv"><span>İtibar</span><b>${Math.round(S.rep)}</b></div>
    </div>
    <button class="btn primary full" data-act="close">Oynamaya devam et</button>`);
}

/* ================= tanıdıklar ================= */
function cLvl(k){ return contactLevel((S.contacts&&S.contacts[k])||0); }
function cGain(k,n){
  S.contacts=S.contacts||{};
  const once=cLvl(k);
  S.contacts[k]=(S.contacts[k]||0)+(n||1);
  const sonra=cLvl(k);
  if(sonra>once){
    const c=CONTACTS.find(x=>x.k===k);
    setTimeout(()=>toast(`${c.n} artık seviye ${sonra} — ${c.perLbl(sonra)}`,"good"),400);
  }
}
function eksperFiyat(){ return CONTACTS.find(c=>c.k==="hakan").per[cLvl("hakan")]; }

/* ================= GALERİNİN EKONOMİSİ =================
   Oyunun uzun vadedeki tek zayıf yeri, büyümenin tek yönlü olmasıydı:
   denge simülasyonunda 121 güne kadar düz bir yukarı çizgi vardı, borç
   hep sıfırdı, hiçbir noktada "yetişemiyorum" hissi doğmuyordu.
   Üç mekanizma bunu kırıyor:
     1. KİRA artık seviyeye göre basamak atlıyor — mahalle değerleniyor.
     2. BÜYÜME arketipe göre farklı pahalılıkta; Otoparkçı'nın yeri bol
        ama kirası yüksek, Dilbaz'ın dükkânı ucuz ama büyütmesi zor.
     3. YER DOLUNCA kaçan kelepir görünür oluyor: büyüme kararı menüden
        değil, gözünün önünden geçen fırsattan doğuyor. */
function arketip(){ return ARCHETYPES.find(a=>a.k===S.archetype) || ARCHETYPES[1]; }
function kiraKat(){ return arketip().kiraKat || 1; }
function slotKat(){ return arketip().slotKat || 1; }

/** Sezon kirası: taban + kontenjan + SEVİYE BASAMAĞI.
    Basamak, oyuncunun ucuz bantta tur atmasını engelliyor: seviye
    atladıkça sabit gider artıyor, bir üst segmente geçmek zorunlu oluyor. */
function sezonKirasi(){
  const basamak=PARA.kiraSeviye*Math.max(0, level()-1);
  return Math.round((PARA.kiraTaban + S.slots*PARA.kiraSlot + basamak)*kiraKat()/500)*500;
}
function gunlukKira(){ return Math.round(sezonKirasi()/SEASON_LEN); }
/** Bir sonraki kontenjanın bedeli. */
function slotFiyat(){
  // Taban üç kontenjana göre kurulu; altına düşen bir durumda formül
  // ucuzlayıp bedavaya yaklaşıyordu — tabana zemin konuldu.
  const ham=PARA.slotTaban+Math.max(0,S.slots-3)*PARA.slotArtis;
  return Math.round(ham*slotKat()/1000)*1000;
}
function yerDolu(){ return S.cars.length>=S.slots; }

/* ================= GALERİCİNİN DEFTERİ =================
   Oyunun en büyük eksiği, oyuncunun uzmanlığının birikmemesiydi: 10. günde
   öğrendiğin hiçbir şey 50. günde işine yaramıyordu. Artık her ekspertiz,
   gördüğün arızayı o modelin hanesine yazıyor. Aynı arızayı aynı modelde
   ikinci kez gördüğünde defter konuşmaya başlıyor:
     "Defterin: Fiyat Egeo'da 3 kez debriyaj gördün."
   Bu bilgi oyunun verdiği bir ipucu değil, oyuncunun kendi kazandığı
   sermaye — bu yüzden ekrana "senin defterin" diye çıkıyor. */
function notDefter(){ return (S.notlar = S.notlar || {}); }
function notAl(c, hepsi){
  if(!c || !c.model) return;
  const d=notDefter(), ad=c.model.n;
  const k=d[ad] || (d[ad]={g:0, f:{}});
  k.g++;                                   // kaç kez bu modeli inceledin
  for(const f of c.faults){
    if(!f.k) continue;
    if(!hepsi && !f.visible && !c.inspected) continue;
    k.f[f.k]=(k.f[f.k]||0)+1;
  }
}
/** Bu modelde en çok gördüğün arıza — en az iki gözlemden sonra konuşur. */
function notBilgi(model){
  if(!model) return null;
  const k=notDefter()[model.n];
  if(!k) return null;
  let en=null, say=0;
  for(const a in k.f) if(k.f[a]>say){ say=k.f[a]; en=a; }
  if(!en || say<2) return null;
  const f=FAULTS.find(x=>x.k===en);
  return f ? {ad:f.n, say, organ:COMPLBL[f.c], gozlem:k.g} : null;
}
/** Defter satırı — araç sayfasında ve pazar kartında aynı cümle. */
function notSatiri(model){
  const b=notBilgi(model);
  if(!b) return "";
  return `<div class="defternot"><b>Defterin</b> bu modelde ${b.say} kez
    <em>${b.ad}</em> g&ouml;rd&uuml;n &middot; ${b.gozlem} inceleme</div>`;
}

/* ================= kilometre taşları ================= */
function checkMilestones(){
  S.milestones=S.milestones||{};
  const eq=netWorth();
  const test={
    ilk:      ()=>S.stats.sold>=1,
    on:       ()=>S.stats.sold>=10,
    marj:     ()=>S.history.some(h=>h.buy>0 && h.profit/h.buy>=.30),
    sezon5:   ()=>(S.seasonSales||0)>=5,
    itibar:   ()=>S.rep>=80,
    siparis3: ()=>(S.ordersDone||0)>=3,
    lux:      ()=>S.history.some(h=>/Hessler|Steinmann S200|Aureon/.test(h.n)),
    muzayede: ()=>!!S.wonAuction,
    gecti:    ()=>{ const st=standings(); const r=st.findIndex(x=>x.me)+1; return r<5; },
    bes:      ()=>eq>=PARA.satinalmaEsik
  };
  for(const m of MILESTONES){
    if(S.milestones[m.k]) continue;
    if(test[m.k] && test[m.k]()){
      S.milestones[m.k]=S.day;
      if(m.odul.cash){ S.cash+=m.odul.cash; }
      if(m.odul.perk){ S.perkPts=(S.perkPts||0)+m.odul.perk; }
      if(m.odul.slot){ S.slots+=m.odul.slot; }
      const odulTxt = m.odul.cash?tl(m.odul.cash)
                    : m.odul.perk?`+${m.odul.perk} uzmanlık puanı`
                    : m.odul.slot?`+${m.odul.slot} park kontenjanı`
                    : "rakip galeri satın alma a&ccedil;ıldı";
      setTimeout(()=>toast(`Kilometre taşı: ${m.n} — ${odulTxt}`,"good"),300);
    }
  }
}

/* ================= teklif havuzu ================= */
function pendingOffers(){ return (S.offers||[]).filter(o=>S.cars.some(c=>c.id===o.carId)); }
function offerOf(carId){ return (S.offers||[]).find(o=>o.carId===+carId); }
function getOffer(oid){ return (S.offers||[]).find(o=>o.oid===+oid); }
function dropOffer(oid){ S.offers=(S.offers||[]).filter(o=>o.oid!==+oid); }
function reportOffers(){
  if(!S.report) return [];
  return (S.report.offers||[]).map(oid=>getOffer(oid)).filter(Boolean);
}

/* ================= işlemler ================= */
function buyCar(car, price, via, senetli){
  if(S.cars.length>=S.slots){ toast("Park yerin dolu. Önce bir araç sat veya kontenjan al.","bad"); return false; }
  let senet=null;
  if(senetli && price>S.cash){
    if(price>senetTavanNakit()){ toast("Senetle bile yetmiyor.","bad"); return false; }
    senet=senetAc(car, price);
    if(senet.pesin>S.cash){ S.senetler=S.senetler.filter(x=>x!==senet); toast("Peşinat yetmiyor.","bad"); return false; }
  } else if(price>S.cash){ toast("Nakit yetmiyor.","bad"); return false; }
  const odenen = senet ? senet.pesin : price;
  const kalan=S.cash-odenen;
  S.cash-=odenen;
  car.boughtFrom = car.seller ? car.seller.n : (via==="müzayede"?"Müzayede":"Takas");
  car.boughtVia = via || "pazarlık";
  car.askedAt = car.ask || null;
  car.priceCuts = 0; car.extras = car.extras || [];
  car.owned=true; car.boughtFor=price; car.seller=null; car.ask=null;
  car.boughtDay=S.day; car.daysListed=0; car.leadsSeen=0;
  S.cars.push(car);
  S.market=S.market.filter(c=>c.id!==car.id);
  S.auction=S.auction.filter(c=>c.id!==car.id);
  S.stats.bought++; gorevIlerle("al"); kolAlim(car);
  if(openFaults(car).length>=3) cGain("selim");
  if(car.boughtFrom==="Galerici") cGain("vedat");
  if(senet){
    toast(`${car.model.n} senetle alındı — peşin ${tl(senet.pesin)}, ${senet.kalan} taksit × ${tl(senet.taksit)}.`,"good");
  } else {
    toast(`${car.model.n} ${car.year} alındı — ${tl(price)}`,"good");
  }
  cal("kasa"); dokun("al"); nefes("good");
  if(kalan < S.cash*0.22 + price*0.22 && kalan < 260000)
    setTimeout(()=>toast(`Elinde ${tl(kalan)} kaldı — ekspertiz ve tamir i&ccedil;in nakit şart. Erken sat.`,"bad"), 1500);
  save();
  return true;
}
function sellCar(car, price, note){
  price=Math.round(price*prestijSatisCarpani());
  S.cash+=price;
  if(car.konsinye) konsSatildi(car);
  const extra=(car.inspected?PARA.ekspertiz:0)+car.daysListed*PARA.otoparkGun;
  const cost=car.boughtFor+car.spent+extra;
  const profit=price-cost;
  S.stats.sold++; S.stats.profit+=profit;
  kolSatis(car, profit); ligBenKar(profit*zorXp());
  gorevIlerle("sat");
  if(carCost(car)>0 && profit/carCost(car)>=0.12) gorevIlerle("iyiKar");
  S.seasonProfit=(S.seasonProfit||0)+Math.max(0,profit);
  S.seasonGross=(S.seasonGross||0)+profit;
  S.seasonSales=(S.seasonSales||0)+1;
  S.history.unshift({d:S.day, n:`${car.model.n} ${car.year}`, buy:car.boughtFor, sell:price, profit, note:note||""});
  S.history=S.history.slice(0,40);
  const gain=Math.round(Math.max(12, Math.round(Math.max(0,profit)/8000))*zorXp());
  const before=level();
  S.xp+=gain;
  S.cars=S.cars.filter(c=>c.id!==car.id);
  S.offers=(S.offers||[]).filter(o=>o.carId!==car.id);
  // Temiz ve kârlı satışlar üst üste geldikçe ağızdan ağıza yayılır.
  const temiz = profit>0 && (car.disclosed || hiddenIssues(car).length===0);
  let repDelta=0;
  if(temiz){
    S.temizSeri=(S.temizSeri||0)+1;
    repDelta=Math.min(3.2, 1.5+0.45*(S.temizSeri-1));
    repDelta *= Math.max(0.25, 1-S.rep/115);   // tepeye yaklaştıkça kazanç azalır
    S.rep=clamp(S.rep+repDelta,0,100);
    if(S.temizSeri===5) toast("Beş temiz satış üst üste — adın iyi anılıyor.","good");
  } else {
    S.temizSeri=0;
  }
  let lesson="";
  if(profit<0 && car.boughtFor>valueOf(car,false)) lesson="Bu aracı ger&ccedil;ek değerinin &uuml;st&uuml;nde aldın. Pazarlıkta koz &ccedil;ıkarmadan teklif vermek pahalıya patlıyor.";
  else if(car.spent>Math.max(0,profit)) lesson="Tamire, geri d&ouml;nd&uuml;ğ&uuml;nden fazlasını harcadın. B&uuml;y&uuml;k revizyonlar genelde zarardır.";
  else if(car.daysListed>10) lesson="Ara&ccedil; uzun s&uuml;re elde kaldı; otopark ve sezon gideri k&acirc;rı yedi. Fiyatı erken kırmak toplamda daha iyi olabilir.";
  else if(profit>0 && !car.disclosed && hiddenIssues(car).length) lesson="Kusuru gizleyerek kazandın &mdash; ama bu kumar her seferinde tutmaz.";
  S.lastDeal={n:`${car.model.n} ${car.year}`, buy:car.boughtFor, repair:car.spent, extra,
    sell:price, profit, xp:gain, rep:repDelta?("+"+String(Math.round(repDelta*10)/10).replace(".",",")):0, days:car.daysListed, note:note||"", lesson};
  cGain("yilmaz");
  cal(profit>=0?"satis":"reddet");
  dokun(profit>=0?"sat":"hata"); nefes(profit>=0?"good":"bad");
  toast(`${car.model.n} satıldı — ${profit>=0?"kâr":"zarar"} ${tl(Math.abs(profit))}`, profit>=0?"good":"bad");
  if(level()>before){
    S.perkPts += level()-before;
    setTimeout(()=>{ cal("seviye"); dokun("seviye"); nefes("big");
      parla(`${EN()?"LEVEL":"SEVİYE"} ${level()}`, levelPerk(level()));
      toast(`Seviye ${level()}! ${levelPerk(level())} · +1 uzmanlık puanı`,"good"); },700);
  }
  save();
}
/* ================= senetli alım =================
   Nakdinin üstündeki aracı almanın yolu: yarısı peşin, kalanı iki vadede
   ve üstüne %7. Kaldıraç gerçek bir kaldıraç — vade günü kasada para yoksa
   itibar düşer ve araç zorunlu satışa gider. */
function senetTavanNakit(){ return Math.round(S.cash*PARA.senetTavan); }
function senetAc(car, fiyat){
  const pesin=Math.round(fiyat*PARA.senetPesin/500)*500;
  const kalanHam=Math.round((fiyat-pesin)*(1+PARA.senetPrim));
  const taksit=Math.round(kalanHam/PARA.senetTaksit/500)*500;
  const s2={id:S.senetSeq++, carId:car.id, n:`${car.model.n} ${car.year}`,
            taksit, kalan:PARA.senetTaksit, vade:S.day+PARA.senetAra,
            toplam:taksit*PARA.senetTaksit, pesin};
  S.senetler=(S.senetler||[]).concat([s2]);
  return s2;
}
function senetBorcu(){ return (S.senetler||[]).reduce((a,x)=>a+x.taksit*x.kalan,0); }
/** Gün dönüşünde vadesi gelen senetleri tahsil et. */
function senetGun(rep){
  for(const sn of [...(S.senetler||[])]){
    if(sn.vade>S.day) continue;
    if(S.cash>=sn.taksit){
      S.cash-=sn.taksit; sn.kalan--;
      rep.costs.push([`Senet taksiti &mdash; ${sn.n}`, sn.taksit]);
      rep.total+=sn.taksit;
      if(sn.kalan<=0){ S.senetler=S.senetler.filter(x=>x!==sn);
        rep.events.push({t:`${sn.n} senedi kapandı.`}); }
      else sn.vade=S.day+PARA.senetAra;
    } else {
      // ödenmedi: itibar düşer, araç elindeyse zorunlu satışa gider
      S.rep=clamp(S.rep-6,0,100);
      const c=S.cars.find(x=>x.id===sn.carId);
      S.senetler=S.senetler.filter(x=>x!==sn);
      if(c){
        const bedel=Math.round(valueOf(c,false)*0.80/500)*500;
        S.cash+=bedel;
        S.cars=S.cars.filter(x=>x.id!==c.id);
        S.offers=(S.offers||[]).filter(o=>o.carId!==c.id);
        rep.events.push({bad:true, t:`<b>Senet &ouml;denemedi.</b> ${sn.n} ${tl(bedel)}'ye
          zorunlu satışa gitti (değerinin %80'i). İtibar &minus;6.`});
      } else {
        S.cash-=Math.min(S.cash, sn.taksit);
        rep.events.push({bad:true, t:`<b>Senet &ouml;denemedi</b> &mdash; ${sn.n}. İtibar &minus;6.`});
      }
    }
  }
}

/** Rakip galeriyi devral — onay sayfasından çağrılır. */
function rakipDevral(i, deger){
  const r=S.rivals[i];
  if(!r || S.cash<deger) return;
  S.cash-=deger; S.slots+=2;
  let alinan=0;
  for(const it of r.stock){
    if(S.cars.length>=S.slots) break;
    const c=genCar({model:MODELS.find(m=>m.seg===it.seg)||undefined});
    c.owned=true; c.inspected=true; c.boughtFor=it.buy; c.spent=0;
    c.boughtFrom=r.n; c.boughtVia="devralma"; c.boughtDay=S.day;
    c.daysListed=0; c.leadsSeen=0; c.priceCuts=0; c.extras=[];
    S.cars.push(c); alinan++;
  }
  S.rivals.splice(i,1);
  S.stats.rivalsBought=(S.stats.rivalsBought||0)+1;
  toast(`${r.n} senin oldu — ${alinan} ara&ccedil; devraldın, +2 kontenjan.`,"good");
  if(!S.rivals.length) setTimeout(()=>openEnding(),900);
  save(); render();
}
function levelPerk(l){
  if(l===2) return "Müzayedeler ve banka kredisi açıldı.";
  if(l===3) return "Galeri yönetimi açıldı.";
  if(l===4) return "Park kontenjanı ucuzladı, lüks segment arttı.";
  return "Piyasada daha iyi araçlar görünüyor.";
}

/* ================= ikonlar ================= */
const SHAPES={
  hatch:"M4,21 L8,13 L21,8 L40,8 L51,13 L60,15 L60,21 Z",
  sedan:"M3,21 L8,14 L21,8 L37,8 L47,14 L61,15.5 L61,21 Z",
  suv:  "M4,21 L6,11 L19,6 L43,6 L52,11 L60,13 L60,21 Z",
  ticari:"M4,21 L6,8 L20,5 L53,5 L60,10 L60,21 Z",
  lux:  "M2,21 L7,15 L22,9 L40,9 L50,14 L62,16 L62,21 Z",
  klasik:"M5,21 L7,13 L20,7 L44,7 L52,13 L59,14 L59,21 Z"
};
/* Eski hâli segmente göre tek silüet çiziyordu: 163 model, 6 resim.
   Artık her araç kendi çizimini alıyor (aracciz.js). Geri düşüş yolu
   duruyor — çizim motoru bir sebeple yoksa oyun yine açılır. */
const MOTOR_DESEN=/\s((?:\d\.\d(?:\s(?:Dizel|Benzin|Turbo|Hibrit))?)|Elektrik)$/;
/** "Fiyat Egeo 1.3 Dizel" → {ad:"Fiyat Egeo", mot:"1.3 Dizel"} */
function adBol(n){
  const m=String(n||"").match(MOTOR_DESEN);
  return m ? {ad:n.slice(0, n.length-m[0].length), mot:m[1]} : {ad:n, mot:""};
}
function carSvg(seg){
  return `<svg viewBox="0 0 64 28" aria-hidden="true">
   <path d="${SHAPES[seg]||SHAPES.sedan}" fill="#5E7286" stroke="#9FB4C6" stroke-width="1"/>
   <circle cx="17" cy="21" r="4.4" fill="#0D1218" stroke="#9FB4C6" stroke-width="1.2"/>
   <circle cx="47" cy="21" r="4.4" fill="#0D1218" stroke="#9FB4C6" stroke-width="1.2"/>
  </svg>`;
}
function aracGorsel(c, ayrinti){
  try{ if(typeof aracCiz==="function"){ const g=aracCiz(c, ayrinti); if(g) return g; } }catch(e){}
  return carSvg(c && c.model ? c.model.seg : "sedan");
}
function plateHtml(p){
  return `<span class="plate"><span class="no">${p}</span></span>`;
}
const ICONS={
  pazar:'<svg viewBox="0 0 24 24"><path d="M3 9l2-5h14l2 5"/><path d="M3 9h18v8H3z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>',
  garaj:'<svg viewBox="0 0 24 24"><path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-7h10v7"/><path d="M7 17h10"/></svg>',
  muzayede:'<svg viewBox="0 0 24 24"><path d="M4 20h9"/><path d="M6 13l7-7"/><path d="M9.5 3.5l5 5"/><path d="M14 8l5 5"/><path d="M17.5 9.5l-3 3"/></svg>',
  galeri:'<svg viewBox="0 0 24 24"><path d="M4 21V10l8-6 8 6v11z"/><path d="M9 21v-6h6v6"/></svg>',
  rapor:'<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h3"/></svg>',
  ayar:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.6v2.6M12 18.8v2.6M4.3 4.3l1.9 1.9M17.8 17.8l1.9 1.9M2.6 12h2.6M18.8 12h2.6M4.3 19.7l1.9-1.9M17.8 6.2l1.9-1.9"/></svg>'
};
const TABLBL={pazar:"Pazar",garaj:"Garaj",muzayede:"Müzayede",galeri:"Galeri",rapor:"Rapor",ayar:"Ayarlar"};

/* ================= 3B görünüm köprüsü ================= */
function can3d(){ return S.tab==="pazar"||S.tab==="garaj"; }
function sync3d(){
  const acik = S.view3d && can3d() && !W3D.failed;
  if(acik){
    const m = S.tab==="pazar" ? "pazar" : "garaj";
    const yeniden = W3D.active && W3D.mode===m;
    if(!yeniden || !W3D.guncel(m)){
      if(!W3D.active && W3D.perdeAc) W3D.perdeAc();
      if(!W3D.open(m, yeniden)){
        S.view3d=false;
        toast("Bu cihazda 3B g&ouml;r&uuml;n&uuml;m a&ccedil;ılamadı, listeye d&ouml;n&uuml;ld&uuml;.","bad");
        document.getElementById("app").classList.remove("in3d");
        return;
      }
    }else W3D.resume();
  }else{
    W3D.close();
  }
}
function toggle3d(v){
  S.view3d=v;
  if(!v){ W3D.close(); save(); render(); return; }
  // Perdeyi önce boya, sahneyi sonraki karede kur: siyah bir an görünmesin.
  try{
    const host=document.getElementById("world");
    if(host){ host.classList.remove("hidden"); }
    if(W3D.perdeAc) W3D.perdeAc();
  }catch(e){}
  save();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    render();
    if(W3D.active) setTimeout(()=>W3D.resize(),60);
  }));
}
function viewToggle(){
  return `<div class="viewtoggle">
    <button class="${S.view3d?"":"on"}" data-act="view" data-v="0">Liste</button>
    <button class="${S.view3d?"on":""}" data-act="view" data-v="1">3B gez</button>
  </div>`;
}

/* ================= render ================= */
/* Arama kutusu her tuşta tüm ekranı yeniden çizmiyor: yalnızca liste kabı
   tazeleniyor. Tam render odağı ve imleci kaybettiriyordu. */
function listeTazele(){
  const kap=document.getElementById("listeKap"); if(!kap) return;
  if(S.tab==="pazar"){
    kap.innerHTML=pazarListesi(filteredMarket());
    const ip=document.querySelector(".hint");
    if(ip) ip.innerHTML=`${S.market.length} ilan &middot; ${S.market.filter(c=>c.ask<=S.cash).length} tanesi b&uuml;t&ccedil;ede &middot; ${S.cars.length}/${S.slots} stok`;
  }else if(S.tab==="garaj"){
    const teklifli=pendingOffers().map(o=>o.carId);
    const grup={ hazir:S.cars.filter(c=>!c.listPrice),
                 satis:S.cars.filter(c=>c.listPrice&&!teklifli.includes(c.id)),
                 teklif:S.cars.filter(c=>c.listPrice&&teklifli.includes(c.id)) };
    let g=S.garajTab||"hazir";
    if(!grup[g]) g="hazir";
    kap.innerHTML=garajListesi(grup[g], g);
  }
  try{ altBosluk(document.getElementById("screen")); }catch(e){}
}
let _araZaman=null;
document.addEventListener("input", (e)=>{
  const t=e.target;
  if(t && t.id==="araInput"){
    const mod=t.dataset.mod;
    if(mod==="own") S.araGaraj=t.value; else S.ara=t.value;
    clearTimeout(_araZaman);
    _araZaman=setTimeout(listeTazele, 140);
  }
});
document.addEventListener("change", (e)=>{
  const t=e.target;
  if(t && t.id==="siraSec"){
    if(t.dataset.mod==="own") S.siraGaraj=t.value; else S.sira=t.value;
    listeTazele();
  }
});

function render(){
  try{ if(S.started && (!S.neg||S.neg.done)) muzikKip("saha"); }catch(e){}
  renderHud(); renderTabs();
  sync3d();
  const el=document.getElementById("screen");
  el.innerHTML = ({pazar:viewPazar, garaj:viewGaraj, muzayede:viewMuzayede,
                   galeri:viewGaleri, rapor:viewRapor, ayar:viewAyar}[S.tab]||viewPazar)();
  el.scrollTop=0; window.scrollTo(0,0);
  altBosluk(el);
  try{ ogretCiz(); }catch(e){}
}
/** Yapışkan eylem çubuğu listenin son kartını örtmesin. */
function altBosluk(el){
  try{
    const bar=el.querySelector(":scope > .actionbar");
    el.style.paddingBottom = bar ? (108 + bar.offsetHeight + 10) + "px" : "";
  }catch(e){}
}
function renderHud(){
  const l=level(), prev=XP_LEVELS[l-1]||0, next=nextXp();
  const sez=seasonOf(S.day), i=(S.day-1)%SEASON_LEN;
  const kalan=SEASON_LEN-i;
  const park=S.cars.length*(zorGercek()?PARA.otoparkZor:PARA.otoparkGun);
  const maas=(S.staff.eksper?PARA.maasEksper:0)+(S.staff.satis?PARA.maasSatis:0);
  const faiz=S.debt>0?Math.round(S.debt*(perk("banka")?0.0018:0.0035)):0;
  const kira=gunlukKira();
  const yakim=park+maas+faiz+kira;
  const parts=[[park,"var(--zarar)"],[maas,"#7A4B49"],[faiz,"#5E3B3A"],[kira,"#46383A"]];
  const dolu=clamp(yakim/Math.max(S.cash,1)*2000,3,100);   // nakdinin %5'i = tam çubuk
  const bar=parts.map(([v,c])=>v?`<i style="width:${(v/yakim*dolu).toFixed(1)}%;background:${c}"></i>`:"").join("");
  const ticks=Array.from({length:SEASON_LEN},(_,k)=>
    `<span class="${k===i?"now":(k<i?"done":"")}"></span>`).join("");
  const dots=Array.from({length:Math.min(S.slots,6)},(_,k)=>
    `<i class="${k<S.cars.length?"full":""}"></i>`).join("");
  const bekleyen=pendingOffers().length||((S.receivables||[]).some(r=>r.due<=S.day+1));

  nakitYaz(document.getElementById("hudCash"), S.cash);
  gunYaz(document.getElementById("brandLine"), `${sez.k} · ${S.day}. gün`);
  // Sezon zemine de işliyor: her mevsimin kendi ışık sıcaklığı var.
  document.documentElement.dataset.sezon=
    ["kis","ilkbahar","yaz","sonbahar"][SEASONS.indexOf(sez)]||"kis";
  document.getElementById("hudRow").innerHTML=`
    <div class="burn" style="grid-column:1/-1">
      <div class="burnbar">${bar}<i style="flex:1;background:var(--asphalt-3)"></i></div>
      <span>${tl(yakim)}/g&uuml;n</span>
    </div>
    <div class="hudgrid" style="grid-column:1/-1">
      <div><span class="minilbl">Sezon</span><div class="rail">${ticks}</div></div>
      <div><span class="minilbl">Stok</span><div class="dots">${dots}</div></div>
      <div><span class="minilbl">İtibar</span>
        <div class="hval" style="color:${S.rep>60?'var(--kar)':S.rep>35?'var(--sodium)':'var(--zarar)'}">${Math.round(S.rep)}</div></div>
      <div><span class="minilbl">Seviye</span>
        <div class="hval">Sv ${l}${bekleyen?'<span class="dot-badge"></span>':''}</div>
        <div class="xpcubuk" title="${S.xp}/${next} XP"><i style="width:${
          /* Son seviyede "5000/4000" gibi taşan bir kesir yazıyordu; artık
             ilerleme bir çubuk ve tavanda dolu kalıyor. */
          l>=XP_LEVELS.length?100:Math.round(clamp((S.xp-prev)/Math.max(1,next-prev),0,1)*100)}%"></i></div></div>
    </div>`;
}
function renderTabs(){
  document.getElementById("tabs").innerHTML=["pazar","garaj","muzayede","galeri","rapor","ayar"].map(t=>{
    const ok=unlocked(t);
    return `<button data-act="tab" data-t="${t}" class="${S.tab===t?'on':''} ${ok?'':'lock'}">
      ${ICONS[t]}<span>${TABLBL[t]}</span></button>`;
  }).join("");
}

/* ---- kart ---- */
function rivalInterest(seg){
  return RIVAL_DEFS.filter((d,i)=>d.segs.includes(seg) && S.rivals[i].stock.length<d.cap).length;
}
function cardHtml(c, mode){
  let price, plabel;
  if(mode==="market"){ price=c.ask; plabel="İstenen"; }
  else if(mode==="auction"){ price=Math.round(valueOf(c,true)*0.7); plabel="Muhammen"; }
  else { price=c.listPrice||valueOf(c,!c.inspected); plabel=c.listPrice?"İlan fiyatı":"Tahmini"; }

  const chips=[];
  let deal="";
  if(mode==="market"){
    // künye tek satır: plaka + en fazla iki çip. Önem sırası önde.
    const aday=[];
    if(c.gunun) aday.push(`<span class="chip firsat">Günün fırsatı</span>`);
    if((S.orders||[]).some(o=>orderMatches(o,c))) aday.push(`<span class="chip solid">Siparişe uyuyor</span>`);
    if(c.story) aday.push(`<span class="chip gold">${STORIES.find(s=>s.k===c.story).t}</span>`);
    if(c.inspected) aday.push(`<span class="chip good">Ekspertizli</span>`);
    if(c.claims.some(x=>CLAIMS_LIE.includes(x))) aday.push(`<span class="chip warn">İddialı ilan</span>`);
    if(c.fromSelim) aday.push(`<span class="chip">Selim&#39;den</span>`);
    if(c.fromVedat) aday.push(`<span class="chip">Vedat&#39;tan</span>`);
    const age=c.age||0;
    if(age>0) aday.push(`<span class="chip">${age} g&uuml;n${c.cutDay?" &middot; kırdı":""}</span>`);
    aday.push(`<span class="chip">${c.seller.n}</span>`);
    chips.push(...aday.slice(0,2));
    // görünen fiyat farkı doğrudan fiyatın altında
    // Ekspertizsiz araçta bu oran GÖRÜNEN değere göre: gizli kusur varsa
    // yanıltır. Bunu saklamak yerine belli ediyoruz — "~" ve soluk renk.
    const kesin=!!c.inspected;
    const ref=kesin?valueOf(c,false):valueOf(c,true);
    const pct=Math.round((ref-c.ask)/ref*100);
    const guclu = pct>3?"var(--kar)":(pct<-3?"var(--zarar)":"var(--muted)");
    const col = kesin ? guclu : "var(--muted-2)";
    plabel=`<span style="color:${col};font-weight:${kesin?600:500}">${kesin?"":"~"}%${Math.abs(pct)} `+
      `${pct>=0?"ucuz":"pahalı"}${kesin?"":" (tahmin)"}</span>`;
  }else if(mode==="auction"){
    chips.push(`<span class="chip">Olduğu gibi</span>`);
    const vf=c.faults.filter(f=>!f.fixed&&f.visible).length;
    if(vf) chips.push(`<span class="chip warn">${vf} g&ouml;r&uuml;n&uuml;r arıza</span>`);
  }else{
    if(!c.listPrice) chips.push(`<span class="chip">Hazırlıkta</span>`);
    else chips.push(`<span class="chip gold">${c.daysListed} g&uuml;nd&uuml;r ilanda</span>`);
    const of=openFaults(c).filter(f=>known(c,f)).length;
    if(of) chips.push(`<span class="chip warn">${of} açık arıza</span>`);
    if(c.listPrice&&!c.disclosed&&hiddenIssues(c).length) chips.push(`<span class="chip warn">Gizli kusur</span>`);
    deal=plBlock(c);
  }
  /* Kart yeniden kuruldu. Eskiden 66×30 piksellik bir pulun yanında dört
     katman metin vardı; başlık iki satıra sarıp "…" ile kesiliyordu ve
     150 modeli kodla çizen sistem hiç görünmüyordu. Artık araç kartın
     üstünde tam genişlikte bir şerit — gerçek bir ilan fotoğrafı gibi —
     altında tek satır ad, sağda fiyat. Dört katman ikiye indi. */
  const ab=adBol(c.model.n);
  return `<button class="card kart2" data-act="open" data-id="${c.id}" data-mode="${mode}">
    <div class="kart-sahne">
      ${aracGorsel(c,"tam")}
      <span class="kart-plaka">${plateHtml(c.plate)}</span>
    </div>
    <div class="kart-govde">
      <div class="kart-sol">
        <div class="kart-ad">${ab.ad} <i>${c.year}</i></div>
        <div class="kart-alt">${ab.mot?`${ab.mot} &middot; `:""}${mesafe(c.km)}${
          // Vites kartta üçüncü bilgi olunca satır "…" ile kesiliyordu;
          // motor ve km'den sonra yer kalırsa ekleniyor, kalmazsa düşüyor.
          ""}<span class="kart-vites"> &middot; ${c.gear}</span></div>
      </div>
      <div class="kart-fiyat">${tl(price)}<small>${plabel}</small></div>
    </div>
    ${chips.length?`<div class="kart-cip">${chips.join("")}</div>`:""}
    ${deal}
  </button>`;
}
/* ==================================================================
   SATIŞ PENCERESİ
   İki soruya aynı anda cevap veriyor: "bu fiyata ne kazanırım" ve
   "bu fiyata ne kadar beklerim". İkincisi olmadan birincisi yanıltıyor —
   yüksek fiyat kâğıt üstünde kârlı görünüp araç aylarca elde kalıyor.

   Süre tahmini uydurma değil: leadChance() zaten her gün alıcı gelme
   olasılığını hesaplıyor. Geometrik dağılımın çeyreklerini alıyoruz,
   böylece "4–9 gün" dediğimizde vakaların yarısı gerçekten o aralıkta.
   Satışı değil ALICIYI tahmin ediyoruz; satmak oyuncunun kararı.
   ================================================================== */
function satisPenceresi(c){
  const fiyat = c.listPrice || Math.round(valueOf(c,!c.inspected)/500)*500;
  const maliyet = carCost(c);
  // Kimse ilan fiyatını tam vermiyor; pazarlık sonrası yerleşen bant.
  const altFiyat = Math.round(fiyat*0.90/500)*500;
  const ustFiyat = Math.round(fiyat*0.995/500)*500;
  let p=0.08;
  try{
    const taklit = c.listPrice ? c : Object.assign({}, c, {listPrice:fiyat, daysListed:0});
    p = clamp(leadChance(taklit, S), 0.02, 0.92);
  }catch(e){}
  const q=(k)=>Math.max(1, Math.round(Math.log(k)/Math.log(1-p)));
  return { fiyat, maliyet,
           altKar: altFiyat-maliyet, ustKar: ustFiyat-maliyet,
           gunAlt:q(0.75), gunUst:q(0.25), p };
}
/** Kartın altındaki tek satırlık karar şeridi. */
function pencereSerit(c){
  const w=satisPenceresi(c);
  const iyi=w.ustKar>0, karma=w.altKar<0&&w.ustKar>0;
  const renk = !iyi?"var(--red)" : karma?"var(--orange)" : "var(--green)";
  const yavas = w.gunUst>14;
  return `<div class="pencere">
    <span class="pnc-et">Bu fiyata k&acirc;r</span>
    <b class="pnc-deg" style="color:${renk}">${w.altKar<0?"&minus;":""}${tlk(Math.abs(w.altKar))}
      &ndash; ${w.ustKar<0?"&minus;":""}${tlk(Math.abs(w.ustKar))}</b>
    <span class="pnc-ayr"></span>
    <span class="pnc-et">İlk alıcı</span>
    <b class="pnc-deg" style="color:${yavas?"var(--orange)":"var(--label)"}">${
      w.gunAlt===w.gunUst?w.gunAlt:`${w.gunAlt}&ndash;${w.gunUst}`} g&uuml;n</b>
  </div>`;
}

/** Garajdaki araç için maliyet–başabaş–bugünkü değer çubuğu */
function lpKarMetni(fiyat, cost){
  const fark=Math.round(fiyat-cost);
  const yuz=cost>0 ? Math.round(fark/cost*100) : 0;
  const iyi=fark>=0;
  const im=iyi?"+":"−";
  const oran = EN() ? `${im}${Math.abs(yuz)}%` : `${im}%${Math.abs(yuz)}`;
  return `<span class="lpet">Bu fiyata kârın</span>`+
    `<b class="${iyi?"pos":"neg"}">${im}${tl(Math.abs(fark)).replace("-","")} · ${oran}</b>`;
}
function plBlock(c){
  const cost=c.boughtFor+c.spent+(c.inspected?PARA.ekspertiz:0)+c.daysListed*PARA.otoparkGun;
  const now=c.listPrice?valueOf(c,false):valueOf(c,!c.inspected);
  const top=Math.max(cost,now)*1.18;
  const cp=clamp(cost/top*100,4,94), np=clamp(now/top*100,2,98);
  const bad=now<cost;
  return `<div class="pl">
    <div class="plbar">
      <span class="cost" style="width:${cp}%"></span>
      <span class="now" style="left:${Math.min(cp,np)}%;width:${Math.abs(np-cp)}%;
        background:${bad?"var(--zarar)":"var(--kar)"}"></span>
      <span class="be" style="left:${cp}%"></span>
      <span class="belbl" style="left:${cp}%">başabaş</span>
    </div>
    <div class="plrow"><span>maliyet ${tlk(cost)}</span>
      <span class="${bad?'neg':'pos'}">${c.listPrice?"bug&uuml;nk&uuml; değer":"tamir sonrası"} ${tlk(now)} &middot; ${now>=cost?"+":""}${tlk(now-cost)}</span></div>
    ${openFaults(c).length?"":pencereSerit(c)}
  </div>`;
}

/* ---- PAZAR ---- */
/** Sipariş müşterisi aracı gözden geçirir: kalitesizse fiyat kırar ya da reddeder. */
function orderQuality(o, car){
  const kalite=condIndex(compsOf(car,false));
  const gizli=!car.disclosed && hiddenIssues(car).length>0;
  if(kalite<0.52) return {red:true, not:"Bu ara&ccedil; aradığım durumda değil, kusura bakma."};
  if(gizli && chance(.7)){
    return {tutar:Math.round(o.butce*0.85/500)*500, rep:-4,
            not:`${o.who} ekspertize g&ouml;t&uuml;rd&uuml;, gizlediğin kusuru buldu. Fiyat kırıldı, itibar −4.`};
  }
  if(kalite<0.66) return {tutar:Math.round(o.butce*0.94/500)*500, rep:1,
            not:`${o.who} aracı aldı ama durumu i&ccedil;in fiyat kırdı. Prim yok.`};
  return {tutar:o.butce+o.prim, rep:3,
          not:`${o.who} aracı teslim aldı. Prim d&acirc;hil ${tl(o.butce+o.prim)}. İtibar +3.`};
}
const SEGLBL={hatch:"Hatchback",sedan:"Sedan",suv:"SUV",ticari:"Ticari",lux:"L&uuml;ks",klasik:"Klasik"};
const FILTERS=[["hepsi","Hepsi"],["butce","B&uuml;t&ccedil;eme uygun"],["hatch","Hatchback"],
               ["sedan","Sedan"],["suv","SUV"],["ticari","Ticari"],["lux","L&uuml;ks"],["klasik","Klasik"]];
/* ---- arama ve sıralama ---- */
const SIRALAR=[["onerilen","&Ouml;nerilen"],["ucuz","Ucuzdan"],["pahali","Pahalıdan"],
               ["firsat","En iyi fark"],["yeni","Yeni ilan"]];
const SIRALAR_GARAJ=[["onerilen","Eklenme"],["kar","K&acirc;ra g&ouml;re"],
                     ["bekleyen","En &ccedil;ok bekleyen"],["ucuz","Ucuzdan"],["pahali","Pahalıdan"]];
function araNormal(x){
  return String(x||"").toLocaleLowerCase("tr")
    .replace(/ı/g,"i").replace(/İ/g,"i").replace(/ş/g,"s").replace(/ğ/g,"g")
    .replace(/ü/g,"u").replace(/ö/g,"o").replace(/ç/g,"c");
}
function araUyar(c, q){
  if(!q) return true;
  const n=araNormal(q).trim();
  if(!n) return true;
  const havuz=araNormal(`${c.model.n} ${c.year} ${SEGLBL[c.model.seg]} ${c.plate} ${c.gear} ${c.fuel} ${c.color||""}`);
  return n.split(/\s+/).every(k=>havuz.includes(k));
}
function siralaListe(liste, anahtar, mod){
  const a=liste.slice();
  const fark=(c)=>{ const ref=c.inspected?valueOf(c,false):valueOf(c,true);
                    return ref ? (ref-c.ask)/ref : 0; };
  if(anahtar==="ucuz")        a.sort((x,y)=>(mod==="own"?(x.listPrice||valueOf(x,false)):x.ask)-(mod==="own"?(y.listPrice||valueOf(y,false)):y.ask));
  else if(anahtar==="pahali") a.sort((x,y)=>(mod==="own"?(y.listPrice||valueOf(y,false)):y.ask)-(mod==="own"?(x.listPrice||valueOf(x,false)):x.ask));
  else if(anahtar==="firsat") a.sort((x,y)=>fark(y)-fark(x));
  else if(anahtar==="yeni")   a.sort((x,y)=>(x.age||0)-(y.age||0));
  else if(anahtar==="kar")    a.sort((x,y)=>((y.listPrice||valueOf(y,false))-carCost(y))-((x.listPrice||valueOf(x,false))-carCost(x)));
  else if(anahtar==="bekleyen") a.sort((x,y)=>(y.daysListed||0)-(x.daysListed||0));
  return a;
}
/** Arama + sıralama şeridi. Odak kaybolmasın diye liste ayrı kapta tazeleniyor. */
function araSerit(mod){
  const q=(mod==="own"?S.araGaraj:S.ara)||"";
  const sk=(mod==="own"?S.siraGaraj:S.sira)||"onerilen";
  const secenek=(mod==="own"?SIRALAR_GARAJ:SIRALAR);
  return `<div class="arasatir">
    <div class="arakutu">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle>
        <path d="M16.5 16.5 L21 21"></path></svg>
      <input id="araInput" type="search" inputmode="search" autocomplete="off"
             placeholder="Model, plaka, segment ara" value="${q.replace(/"/g,"&quot;")}"
             data-mod="${mod}">
      ${q?`<button class="arasil" data-act="arasil" data-mod="${mod}" aria-label="Aramayı temizle">&times;</button>`:""}
    </div>
    <select id="siraSec" class="sirasec" data-mod="${mod}" aria-label="Sıralama">
      ${secenek.map(([k,l])=>`<option value="${k}" ${sk===k?"selected":""}>${l}</option>`).join("")}
    </select>
  </div>`;
}
function filteredMarket(){
  const f=S.filter||"hepsi";
  let liste=S.market;
  if(f==="butce") liste=liste.filter(c=>c.ask<=S.cash);
  else if(f!=="hepsi") liste=liste.filter(c=>c.model.seg===f);
  // sipariş filtresi: "pazarda ara" düğmesinden geliyor
  const sip=(S.orders||[]).find(o=>o.id===S.siparisFiltre);
  if(sip) liste=liste.filter(c=>siparisKabaUyar(sip,c));
  liste=liste.filter(c=>araUyar(c, S.ara));
  return siralaListe(liste, S.sira||"onerilen", "market");
}
/** Siparişin künye şartları — satın almadan önceki kaba eleme. */
function siparisKabaUyar(o, c){
  if(c.model.seg!==o.seg) return false;
  if(c.year<o.minYear) return false;
  if(c.km>o.maxKm) return false;
  if(o.gear && c.gear!==o.gear) return false;
  return true;
}
/** Aktif sipariş filtresinin şeridi. */
function sipSeridi(){
  const o=(S.orders||[]).find(x=>x.id===S.siparisFiltre);
  if(!o) return "";
  return `<div class="sipserit">
    <span>${o.who} i&ccedil;in s&uuml;z&uuml;l&uuml;yor &middot; ${SEGLBL[o.seg]} &middot; ${o.minYear}+ &middot; max ${mesafe(o.maxKm)}</span>
    <button data-act="sipfiltrekapat">Kaldır</button></div>`;
}
/** Liste kabı — arama yazarken yalnızca burası tazeleniyor. */
function pazarListesi(list){
  if(list.length) return list.map(c=>cardHtml(c,"market")).join("");
  const arama=(S.ara||"").trim();
  if(arama) return `<div class="empty">"${arama}" i&ccedil;in ilan yok.
    <div class="bosbtn"><button class="btn" data-act="arasil" data-mod="market">Aramayı temizle</button></div></div>`;
  if(S.siparisFiltre) return `<div class="empty">Bu siparişe uyan ilan bug&uuml;n yok.
    <div class="bosbtn"><button class="btn" data-act="sipfiltrekapat">Filtreyi kaldır</button></div></div>`;
  if((S.filter||"hepsi")!=="hepsi") return `<div class="empty">Bu filtrede ilan yok.
    <div class="bosbtn"><button class="btn" data-act="filter" data-f="hepsi">T&uuml;m ilanları g&ouml;ster</button></div></div>`;
  return `<div class="empty">Bug&uuml;n pazarda ilan kalmadı.
    <div class="bosbtn"><button class="btn primary" data-act="endday">G&uuml;n&uuml; bitir</button></div></div>`;
}
function viewPazar(){
  const sez=seasonOf(S.day), kalan=SEASON_LEN-((S.day-1)%SEASON_LEN);
  const list=filteredMarket();

  return `${bugunRayi()}
    <div class="listbas">
      <span class="lb-et">İLANLAR</span><em>${S.market.length}</em>
      <small>${sez.k} kapanışına ${kalan} g&uuml;n</small>
      ${viewToggle()}
    </div>
    <div class="filters">
      ${FILTERS.map(([k,l])=>`<button class="chip ${S.filter===k?"solid":""}" data-act="filter" data-f="${k}">${l}</button>`).join("")}
    </div>
    ${araSerit("market")}
    ${sipSeridi()}
    <div id="listeKap">${pazarListesi(list)}</div>
    <div class="actionbar">
      <button class="btn primary full" data-act="endday">G&uuml;n&uuml; bitir &rarr;</button>
      <div class="hint">${S.market.length} ilan &middot; ${S.market.filter(c=>c.ask<=S.cash).length} tanesi b&uuml;t&ccedil;ede &middot; ${S.cars.length}/${S.slots} stok</div>
    </div>`;
}

/* ---- BUGÜN rayı ----
   Pazar ekranı eskiden dikey bir yığınla açılıyordu: vaka şeridi, görev
   kutusu, olay şeridi, her sipariş için ayrı büyük kart. Telefonda araç
   listesi ikinci ekrana düşüyor, oyunun asıl işi — araç seçmek — kaydırma
   arkasında kalıyordu. Artık günün bütün işleri tek satırlık yatay bir
   rayda; her kart dokununca kendi sayfasını açıyor. Liste ilk ekranda. */
const AJ_IKON={
  olay:'<path d="M12 4l9 16H3z"/><path d="M12 10v4"/><path d="M12 17v.5"/>',
  vaka:'<circle cx="12" cy="12" r="8.5"/><path d="M9.7 9.5a2.4 2.4 0 1 1 3.3 2.2c-.7.3-1 .8-1 1.5v.6"/><path d="M12 16.6v.4"/>',
  gorev:'<path d="M5 6.5l1.6 1.6L9.5 5"/><path d="M5 12.5l1.6 1.6 2.9-3.1"/><path d="M5 18.5l1.6 1.6 2.9-3.1"/><path d="M12.5 7h7M12.5 13h7M12.5 19h7"/>',
  siparis:'<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6"/>',
  emanet:'<circle cx="8" cy="15" r="3.6"/><path d="M10.6 12.4L19 4"/><path d="M15.5 7.5l2 2"/><path d="M17.5 5.5l2 2"/>',
  parti:'<rect x="3" y="12" width="6" height="7" rx="1.2"/><rect x="9" y="8" width="6" height="11" rx="1.2"/><rect x="15" y="12" width="6" height="7" rx="1.2"/>',
  sanayi:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8 7.2 20l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.3-.6-.6-2.3z"/>',
  hedef:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.3"/>'
};
function ajKart(o){
  return `<button class="ajkart ${o.sinif||""}" data-act="${o.act}" ${o.data||""}>
    <span class="aj-ust"><span class="aj-ik"><svg viewBox="0 0 24 24">${AJ_IKON[o.ik]}</svg></span>
      ${o.rozet?`<span class="aj-roz">${o.rozet}</span>`:""}</span>
    <b class="aj-bas">${o.bas}</b>
    <span class="aj-alt">${o.alt}</span>
    ${o.deger?`<span class="aj-deger">${o.deger}</span>`:""}
    ${o.cubuk!=null?`<span class="aj-cubuk"><i style="width:${Math.round(o.cubuk*100)}%"></i></span>`:""}
  </button>`;
}
function bugunKartlari(){
  const k=[];
  if(S.event) k.push({ik:"olay", sinif:"olay", act:"olayac", bas:S.event.n,
    alt:S.event.model||"Piyasa olayı", rozet:`${S.event.kalan} g&uuml;n`});
  if(S.parti) k.push({ik:"parti", sinif:"sicak", act:"partiac", bas:"Toptan parti",
    alt:`${S.parti.cars.length} ara&ccedil; &middot; ${S.parti.satici}`, deger:tlk(S.parti.fiyat),
    rozet:`%${Math.round((1-S.parti.fiyat/S.parti.tekTek)*100)}`});
  if(S.konsTeklif){ const t=S.konsTeklif;
    k.push({ik:"emanet", sinif:"sicak", act:"konsac", bas:"Emanet teklifi",
      alt:`${t.car.model.n}`, deger:`net ${tlk(t.net)}`, rozet:`${t.sure} g&uuml;n`}); }
  for(const o of (S.orders||[])){
    const uyan=S.cars.some(c=>orderMatches(o,c)), kalan=o.deadline-S.day;
    k.push({ik:"siparis", sinif:uyan?"uyan":(o.donen?"donen":""), act:"sipac", data:`data-o="${o.id}"`,
      bas:o.who, alt:`${SEGLBL[o.seg]} &middot; ${o.minYear}+`, deger:tlk(o.butce+o.prim),
      rozet:uyan?"uyan var":(o.donen?"d&ouml;nen":`${kalan} g&uuml;n`)});
  }
  try{ const m=meydanDurum(), bitti=meydanOynandiMi();
    k.push({ik:"vaka", sinif:bitti?"bitti":"", act:"meydanac", bas:"G&uuml;n&uuml;n vakası",
      alt:bitti?`${m.skor}/100 &middot; seri ${m.seri}`:"Tek soru, 20 saniye", rozet:bitti?"&#10003;":""});
  }catch(e){}
  if(S.gunluk){ const g=S.gunluk.gorevler, n=g.filter(x=>x.odendi).length;
    const kalan=g.filter(x=>!x.odendi).reduce((a,x)=>a+x.nakit,0);
    k.push({ik:"gorev", sinif:"gunluk-kart "+(n===g.length?"bitti":""), act:"gorevac", bas:"G&uuml;n&uuml;n g&ouml;revleri",
      alt:n===g.length?"Hepsi tamam":`${tl(kalan)} &ouml;d&uuml;l bekliyor`, rozet:`${n}/${g.length}`, cubuk:n/g.length}); }
  const sk=sanayiyeKalan();
  if(sk<=3) k.push({ik:"sanayi", sinif:sk===0?"sicak":"", act:"sanayiac",
    bas:sk===0?"Sanayi g&uuml;n&uuml;":"Sanayi g&uuml;n&uuml; yaklaşıyor", alt:`Tamirler %${Math.round(SANAYI.indirim*100)} ucuz`,
    rozet:sk===0?"bug&uuml;n":`${sk} g&uuml;n`});
  const h=hedef(), il=hedefIlerleme();
  k.push({ik:"hedef", sinif:il>=1?"bitti":"", act:"hedefac", bas:"Sezon hedefi",
    alt:`${tlk(S.seasonProfit||0)} / ${tlk(h.tutar)}`, rozet:il>=1?"&#10003;":`%${Math.round(il*100)}`, cubuk:il});
  return k;
}
function bugunRayi(){
  const k=bugunKartlari();
  return `<section class="bugun">
    <div class="bugun-bas"><span>BUG&Uuml;N</span><em>${k.length}</em></div>
    <div class="ray">${k.map(ajKart).join("")}</div>
  </section>`;
}
function siparisKart(o){
      const eslesen=S.cars.filter(c=>orderMatches(o,c))
        .sort((a,x)=>condIndex(compsOf(x,false))-condIndex(compsOf(a,false)));
      const kalan=o.deadline-S.day;
      return `<div class="ordercard ${eslesen.length?"match":""}">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
          <div style="min-width:0"><b style="font-size:14px">${o.who}</b>
            <div class="quote" style="margin:6px 0 0;font-size:12px">"${o.line}"</div></div>
          <span class="chip ${kalan<=2?"warn":""}">${kalan} g&uuml;n</span>
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin:9px 0 0">
          <span class="chip gold">${SEGLBL[o.seg]}</span>
          <span class="chip">${o.minYear}+ model</span>
          <span class="chip">max ${mesafe(o.maxKm)}</span>
          ${o.gear?`<span class="chip">${o.gear}</span>`:""}
        </div>
        <div class="pricerow" style="margin-top:9px">
          <span class="plabel">B&uuml;t&ccedil;e + prim</span>
          <span class="pval" style="color:var(--sodium)">${tl(o.butce+o.prim)}</span>
        </div>
        ${eslesen.length?(()=>{const q=orderQuality(o,eslesen[0]);
            return `<button class="btn ${q.red?"":"primary"} full" data-act="deliver" data-o="${o.id}" data-c="${eslesen[0].id}"
              style="margin-top:10px">${q.red?"Durumu yetersiz: "+eslesen[0].model.n
              :`${eslesen[0].model.n} ile teslim et &middot; ${tl(q.tutar)}`}</button>
              <div class="sec-note" style="margin-top:6px;display:flex;justify-content:space-between">
                <span>Bu ara&ccedil; piyasada ~${tlk(valueOf(eslesen[0],false))} eder</span>
                <span class="${q.tutar-valueOf(eslesen[0],false)>=0?"pos":"neg"}">${q.tutar-valueOf(eslesen[0],false)>=0?"+":""}${tlk(q.tutar-valueOf(eslesen[0],false))}</span>
              </div>`;})()
          :`<div class="sec-note" style="margin-top:7px">Garajında uyan ara&ccedil; yok.</div>
             <button class="btn full" data-act="sipfiltre" data-o="${o.id}" style="margin-top:8px">
               Pazarda bu şartlara uyanları g&ouml;ster</button>`}
      </div>`;}
function openSiparis(id){
  const o=(S.orders||[]).find(x=>x.id===+id); if(!o) return;
  const m=(S.musteriler||{})[o.who];
  openSheet(`<div class="sheet-head"><div>
      <div class="sheet-title">${o.who}</div>
      <div class="sheet-sub">${o.donen?`D&ouml;nen m&uuml;şteri &middot; ${m?m.memnun:1} memnun teslim`:"Sipariş"}</div></div>
      <button class="x" data-act="close" aria-label="Kapat">&times;</button></div>
    ${siparisKart(o)}
    <div class="sec-note" style="margin:10px 2px 0">Memnun teslim ettiğin m&uuml;şteri birka&ccedil; hafta sonra
      daha b&uuml;y&uuml;k b&uuml;t&ccedil;eyle geri d&ouml;ner. Gizli kusurlu ara&ccedil; onu sonsuza dek kaybettirir.</div>`);
}
function openBilgi(baslik, alt, govde){
  openSheet(`<div class="sheet-head"><div>
      <div class="sheet-title">${baslik}</div><div class="sheet-sub">${alt}</div></div>
      <button class="x" data-act="close" aria-label="Kapat">&times;</button></div>${govde}
    <button class="btn full" data-act="close" style="margin-top:12px">Tamam</button>`);
}

/* ---- GARAJ ---- */
/** Garaj liste kabı — arama yazarken yalnızca burası tazeleniyor. */
function garajListesi(liste, g){
  let a=liste.filter(c=>araUyar(c, S.araGaraj));
  a=siralaListe(a, S.siraGaraj||"onerilen", "own");
  if(a.length) return a.map(c=>cardHtml(c,"own")+konsSerit(c)).join("");
  const arama=(S.araGaraj||"").trim();
  if(arama) return `<div class="empty">"${arama}" i&ccedil;in ara&ccedil; yok.
    <div class="bosbtn"><button class="btn" data-act="arasil" data-mod="own">Aramayı temizle</button></div></div>`;
  const bos={
    hazir:["Hazırlıkta ara&ccedil; yok.","Pazara git",'data-act="tab" data-t="pazar"'],
    satis:["Satışta ara&ccedil; yok. Hazırlıktakini ilana koy.","Hazırlıktakilere bak",'data-act="garajtab" data-g="hazir"'],
    teklif:["Bekleyen teklif yok. İlan fiyatını kırmak alıcı akışını artırır.","Satıştakilere bak",'data-act="garajtab" data-g="satis"']
  }[g]||["Bu b&ouml;l&uuml;mde ara&ccedil; yok.","Pazara git",'data-act="tab" data-t="pazar"'];
  return `<div class="empty">${bos[0]}
    <div class="bosbtn"><button class="btn" ${bos[2]}>${bos[1]}</button></div></div>`;
}
function viewGaraj(){
  if(!S.cars.length) return `<div class="sec-head"><h2 class="sec">Garaj</h2><span class="sec-note">0/${S.slots} dolu</span></div>
    <div class="empty bosdurum">${bosSahne("garaj")}
      <b class="bd-bas">${S.slots} park yeri boş</b>
      Pazardan ucuz al, kârlı tamiri yap, doğru alıcıya sat.
      ${S.konsTeklif?`<br>Ya da nakit bağlamadan <b>emanet</b> bir ara&ccedil; al.`:""}
      <div class="bosbtn"><button class="btn primary" data-act="tab" data-t="pazar">Pazara git</button>
        ${S.konsTeklif?`<button class="btn" data-act="konsac">Emanet teklifi</button>`:""}</div></div>`;
  const teklifli=pendingOffers().map(o=>o.carId);
  const grup={
    hazir:S.cars.filter(c=>!c.listPrice),
    satis:S.cars.filter(c=>c.listPrice&&!teklifli.includes(c.id)),
    teklif:S.cars.filter(c=>c.listPrice&&teklifli.includes(c.id))
  };
  // Sekme seçimine saygı: oyuncu bir bölüme bastıysa boş da olsa orada kalır
  // ve ne yapması gerektiğini söyleyen boş durumu görür. Otomatik atlama
  // yalnızca ilk açılışta, henüz seçim yapılmamışken.
  let g=S.garajTab;
  if(!g){ g=["teklif","hazir","satis"].find(k=>grup[k].length)||"hazir"; }
  if(!grup[g]) g="hazir";
  const bekleyen=pendingOffers();
  const teklifBlok = bekleyen.length ? `
    <div class="sec-head" style="margin-top:0"><h2 class="sec">Bekleyen teklifler</h2>
      <span class="sec-note">${bekleyen.length} teklif</span></div>
    ${bekleyen.map(o=>{
      const cc=S.cars.find(x=>x.id===o.carId); if(!cc) return "";
      const kar=o.amount-carCost(cc), kalan=o.expires-S.day;
      return `<div class="offercard hot" style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
          <div style="min-width:0">
            <b style="font-size:14px">${cc.model.n} ${cc.year}</b>
            <div style="margin-top:5px">${o.type?`<span class="chip">${o.type.n}</span>`:""}
              <span class="chip ${kalan<=0?"warn":""}">${kalan<=0?"bug&uuml;n son g&uuml;n":kalan+" g&uuml;n ge&ccedil;erli"}</span>
              ${o.takas?`<span class="chip gold">takaslı</span>`:""}${o.taksit?`<span class="chip gold">taksitli</span>`:""}</div>
          </div>
        </div>
        <div class="pricerow" style="margin-top:10px">
          <span class="plabel">Gelen teklif</span>
          <span class="pval" style="color:var(--sodium)">${tl(o.amount)}</span></div>
        <div class="sec-note" style="display:flex;justify-content:space-between;margin-top:4px">
          <span>maliyet ${tlk(carCost(cc))}</span>
          <span class="${kar>=0?'pos':'neg'}">${kar>=0?"+":""}${tl(kar)}</span></div>
        <div class="btn-row" style="margin-top:11px">
          <button class="btn primary" data-act="salenego" data-oid="${o.oid}">Pazarlık et</button>
          <button class="btn" data-act="carfile" data-id="${cc.id}">Dosya</button>
        </div>
      </div>`;}).join("")}
    <div class="rule" style="margin:4px 0 10px"></div>` : "";

  return `${teklifBlok}
    <div class="sec-head" style="margin-top:0"><h2 class="sec">Garaj</h2>${viewToggle()}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:-4px;margin-bottom:2px;gap:8px">
      <span class="sec-note">${S.cars.length}/${S.slots} dolu &middot; tabela: <b style="color:${lotRenk().h}">${lotAd()}</b></span>
      <button class="btn ghost" data-act="lotac" style="padding:5px 11px;font-size:11.5px;min-height:0">Galerimi d&uuml;zenle</button>
    </div>
    <div class="seg">
      <button class="${g==="hazir"?"on":""}" data-act="garajtab" data-g="hazir">Hazırlıkta <em>${grup.hazir.length}</em></button>
      <button class="${g==="satis"?"on":""}" data-act="garajtab" data-g="satis">Satışta <em>${grup.satis.length}</em></button>
      <button class="${g==="teklif"?"on":""}" data-act="garajtab" data-g="teklif">Teklif <em>${grup.teklif.length}</em></button>
    </div>
    ${S.cars.length>3?araSerit("own"):""}
    <div id="listeKap">${garajListesi(grup[g], g)}</div>
    <button class="btn primary full" data-act="endday" style="margin-top:4px">G&uuml;n&uuml; bitir &rarr;</button>`;
}

/* ---- boş ekran sahneleri ----
   Boş garaj ve boş müzayede düz bir cümleydi; ekranın üçte ikisi siyah
   kalıyordu ve oyuncu "bozuk mu" diye düşünüyordu. Artık her boşluk kendi
   küçük sahnesini çiziyor: garajda gerçek kontenjan sayısı kadar park
   çizgisi, müzayedede bir sonraki kuruluşa kalan gün. Çizim kodla, dosya yok. */
function bosSahne(tur){
  if(tur==="garaj"){
    const n=Math.max(1,Math.min(S.slots,6)), w=300, aralik=w/n;
    const cizgi=Array.from({length:n+1},(_,i)=>`<line x1="${(i*aralik).toFixed(1)}" y1="18" x2="${(i*aralik).toFixed(1)}" y2="92"/>`).join("");
    const num=Array.from({length:n},(_,i)=>`<text x="${((i+.5)*aralik).toFixed(1)}" y="84">${i+1}</text>`).join("");
    return `<svg class="bossahne" viewBox="-10 0 320 110" aria-hidden="true">
      <rect x="-10" y="0" width="320" height="110" rx="14" class="bs-zemin"/>
      <g class="bs-cizgi">${cizgi}<line x1="0" y1="92" x2="${w}" y2="92"/></g>
      <g class="bs-no">${num}</g>
      <g class="bs-koni" transform="translate(${(aralik*.5).toFixed(1)} 34)">
        <path d="M-7 22 L0 0 L7 22 Z"/><rect x="-10" y="21" width="20" height="4" rx="1.5"/>
        <path class="bs-serit" d="M-4.4 13.5 L4.4 13.5 L3.3 10 L-3.3 10 Z"/></g>
    </svg>`;
  }
  if(tur==="muzayede"){
    return `<svg class="bossahne" viewBox="0 0 320 110" aria-hidden="true">
      <rect x="0" y="0" width="320" height="110" rx="14" class="bs-zemin"/>
      <g class="bs-tokmak" transform="translate(160 56) rotate(-28)">
        <rect x="-26" y="-12" width="52" height="24" rx="6"/><rect x="-4" y="12" width="8" height="40" rx="3"/></g>
      <rect x="112" y="84" width="96" height="10" rx="4" class="bs-kaide"/>
    </svg>`;
  }
  return "";
}
function muzayedeyeKalan(){ for(let k=1;k<=3;k++) if((S.day+k)%3===1) return k; return 3; }

/* ---- MÜZAYEDE ---- */
function viewMuzayede(){
  if(!unlocked("muzayede")) return lockedView("Müzayede","Seviye 2'de açılır.","Kârlı birkaç çevirme yap — müzayedede ekspertizsiz, ucuz araçlar var.");
  if(!S.auction.length){ const k=muzayedeyeKalan();
    return `<div class="sec-head"><h2 class="sec">Müzayede</h2></div>
    <div class="empty bosdurum">${bosSahne("muzayede")}
      <b class="bd-bas">${k===1?"Yarın m&uuml;zayede var":`M&uuml;zayedeye ${k} g&uuml;n`}</b>
      Kapalı zarf, ekspertizsiz, olduğu gibi. &Uuml;&ccedil; g&uuml;nde bir kurulur &mdash;
      o g&uuml;ne nakit ve boş yer ayır.
      <div class="bosbtn"><button class="btn" data-act="tab" data-t="pazar">Pazara git</button></div></div>`; }
  const bids=S.auctionBids||{};
  return `<div class="sec-head"><h2 class="sec">Oto müzayede</h2><span class="sec-note">Kapalı zarf · ekspertiz yok</span></div>
    <div class="block"><div class="help"><p>Araçlar <strong>olduğu gibi</strong> satılır. Sadece gözle görünenler belli. En yüksek zarfı veren alır — rakip galericiler de zarf veriyor.</p></div></div>
    ${S.auction.map(c=>`
      ${cardHtml(c,"auction")}
      <div class="block" style="margin-top:-6px;border-top-left-radius:0;border-top-right-radius:0">
        <div class="kv"><span>Zarfın</span><b>${bids[c.id]?tl(bids[c.id]):"—"}</b></div>
        <div class="btn-row" style="margin-top:8px">
          <button class="btn" data-act="bid" data-id="${c.id}">Zarf ver</button>
          ${bids[c.id]?`<button class="btn ghost danger" data-act="unbid" data-id="${c.id}">Çek</button>`:""}
        </div>
      </div>`).join("")}
    <button class="btn primary full" data-act="resolveauction" ${Object.keys(bids).length?"":"disabled"}>Zarfları aç</button>`;
}
function lockedView(t,sub,note){
  return `<div class="locked"><b>${t}</b>${sub}<div class="rule" style="margin:14px 0"></div>
    <span class="sec-note">${note}</span></div>`;
}

/* ---- GALERİ ---- */
function viewGaleri(){
  if(!unlocked("galeri")) return lockedView("Galeri","Seviye 3'te açılır.","Personel, park kontenjanı, vitrin ilanı ve kredi burada yönetilir.");
  const slotCost=slotFiyat();
  return `<div class="sec-head"><h2 class="sec">Galeri y&ouml;netimi</h2></div>
    ${yerBlok()}

    <div class="block"><h4>TANIDIKLAR</h4>
      <div class="sec-note" style="margin-bottom:4px">İş yaptık&ccedil;a seviye atlarlar. Sezonda bir kez, tanıdıklarından birinden iyilik isteyebilirsin.</div>
      ${CONTACTS.map(c=>{
        const lvl=cLvl(c.k), xp=(S.contacts&&S.contacts[c.k])||0;
        const next=CONTACT_XP[Math.min(3,lvl+1)];
        const favorHazir=!!(S.favors&&S.favors[c.k]);
        return `<div class="contact">
          <div class="cav yuzlu">${yuzSvg(c.k, 55+lvl*12)}</div>
          <div style="flex:1;min-width:0">
            <b style="font-size:13.5px">${c.n}</b>
            <div class="sec-note" style="line-height:1.4">${c.d}</div>
            <div class="clvl">${[1,2,3].map(i=>`<i class="${i<=lvl?"on":""}"></i>`).join("")}</div>
            <div class="sec-note" style="margin-top:5px;color:${lvl?"#6FD3AB":"var(--muted-2)"}">${c.perLbl(lvl)}</div>
            ${lvl<3?`<div class="sec-note" style="color:var(--muted-2)">${xp}/${next} — ${c.xpLbl}</div>`:""}
            ${lvl>=2?`<button class="btn ${favorHazir?"":"ghost"}" data-act="favor" data-k="${c.k}"
               style="margin-top:8px;padding:7px 11px;font-size:12px" ${favorHazir?"disabled":""}>
               ${favorHazir?"İyilik hazır: "+c.favor:"İyilik iste &middot; "+c.favor}</button>`:""}
          </div>
        </div>`;}).join("")}
    </div>

    ${(S.milestones&&S.milestones.bes)?`<div class="block"><h4>Rakip galeri satın al</h4>
      <div class="sec-note" style="margin-bottom:8px">Satın aldığın galerinin stoğu sana ge&ccedil;er, segment baskısı kalkar, kontenjanın b&uuml;y&uuml;r.</div>
      ${(S.rivals||[]).map((r,i)=>{
        const deger=Math.round((r.cash+r.stock.reduce((s,x)=>s+x.val*.9,0))*1.4/100000)*100000;
        return `<div class="kv"><span>${r.n}<br><small style="color:var(--muted-2)">${r.stock.length} ara&ccedil; stok &middot; ${r.sold} satış</small></span>
          <button class="btn" data-act="buyrival" data-i="${i}" ${S.cash<deger?"disabled":""}
            style="padding:8px 12px;font-size:12px">${tlk(deger)}</button></div>`;}).join("")
        ||`<div class="sec-note">Piyasada rakip kalmadı.</div>`}
    </div>`:""}

    <div class="block"><h4>PERSONEL</h4>
      <div class="kv"><span>Ekspertiz uzmanı<br><small style="color:var(--muted-2)">Gözle görünmeyen arızaların yarısını ücretsiz görür</small></span>
        <b>${tl(110)}/gün</b></div>
      <button class="btn full" data-act="staff" data-k="eksper" style="margin:8px 0 14px">
        ${S.staff.eksper?"İşten çıkar":"İşe al"}</button>
      <div class="kv"><span>Satış danışmanı<br><small style="color:var(--muted-2)">İlanlara %22 daha fazla alıcı çeker</small></span>
        <b>${tl(95)}/gün</b></div>
      <button class="btn full" data-act="staff" data-k="satis" style="margin-top:8px">
        ${S.staff.satis?"İşten çıkar":"İşe al"}</button></div>

    <div class="block"><h4>VİTRİN İLANI</h4>
      <div class="help"><p>5 gün boyunca tüm ilanlarına gelen alıcı sayısını neredeyse ikiye katlar.</p></div>
      <div class="kv"><span>Kalan gün</span><b>${S.marketingDays}</b></div>
      <button class="btn full" data-act="marketing" style="margin-top:8px" ${S.cash<PARA.vitrin?"disabled":""}>Vitrine çık · ${tl(PARA.vitrin)}</button></div>

    <div class="block"><h4>BANKA</h4>
      <div class="kv"><span>Borç</span><b class="${S.debt?"neg":""}">${tl(S.debt)}</b></div>
      <div class="kv"><span>Kredi limitin</span><b>${tl(creditLimit())}</b></div>
      <div class="kv"><span>Günlük faiz</span><b>${yuzde(perk("banka")?0.18:0.35)}</b></div>
      <div class="sec-note" style="margin-top:6px">Limit özsermayene ve itibarına göre belirlenir.</div>
      <div class="btn-row" style="margin-top:9px">
        <button class="btn" data-act="borrow" ${S.debt>=creditLimit()?"disabled":""}>${tl(PARA.krediDilim)} çek</button>
        <button class="btn ghost" data-act="repay" ${S.debt<=0||S.cash<=0?"disabled":""}>Borç öde</button>
      </div></div>`;
}

/* ---- RAPOR ---- */
function viewRapor(){
  const st=S.stats;
  const equity=S.cash+S.cars.reduce((s,c)=>s+valueOf(c,false)*0.9,0)-S.debt;
  const alt=S.defterAlt||"durum";
  const sek=`<div class="altsek">
    <button class="${alt==="durum"?"on":""}" data-act="defteralt" data-s="durum">Durum</button>
    <button class="${alt==="koleksiyon"?"on":""}" data-act="defteralt" data-s="koleksiyon">Koleksiyon</button>
    <button class="${alt==="lig"?"on":""}" data-act="defteralt" data-s="lig">Lig</button>
  </div>`;
  // Defter bir kayıt belgesi: kâğıt yüzeyine oturuyor.
  if(alt==="koleksiyon")
    return `<div class="sec-head"><h2 class="sec">Defter</h2></div>${sek}
      <div class="belge">${viewKoleksiyon()}</div>`;
  if(alt==="lig")
    return `<div class="sec-head"><h2 class="sec">Defter</h2></div>${sek}
      <div class="belge">${(typeof ulusalKart==="function")?ulusalKart():""}${ligKarti()}${prestijKarti()}</div>`;
  return `<div class="sec-head"><h2 class="sec">Defter</h2></div>${sek}
    <div class="belge"><div class="block"><h4>DURUM</h4>
      <div class="kv"><span>Nakit</span><b>${tl(S.cash)}</b></div>
      <div class="kv"><span>Stok değeri (net)</span><b>${tl(S.cars.reduce((s,c)=>s+valueOf(c,false)*0.9,0))}</b></div>
      <div class="kv"><span>Borç</span><b class="${S.debt?"neg":""}">${tl(S.debt)}</b></div>
      ${senetBorcu()?`<div class="kv"><span>Senet borcu</span><b class="neg">${tl(senetBorcu())}</b></div>`:""}
      ${konsBorcu()?`<div class="kv"><span>Emanet sahiplerine borç</span><b class="neg">${tl(konsBorcu())}</b></div>`:""}
      <div class="kv"><span>Vadesi gelmemiş alacak</span><b>${tl((S.receivables||[]).reduce((s,r)=>s+r.amount,0))}</b></div>
      <div class="kv"><span>Özsermaye</span><b class="${equity>0?"pos":"neg"}">${tl(equity)}</b></div>
    </div>
    <div class="block"><h4>KARİYER</h4>
      <div class="kv"><span>Alınan / satılan</span><b>${st.bought} / ${st.sold}</b></div>
      <div class="kv"><span>Toplam kâr</span><b class="${st.profit>=0?"pos":"neg"}">${tl(st.profit)}</b></div>
      <div class="kv"><span>Yapılan tamir</span><b>${st.repairs}</b></div>
      <div class="kv"><span>Yakalandığın satış</span><b class="${st.caught?"neg":""}">${st.caught}</b></div>
    </div>
    <div class="block"><h4>KİLOMETRE TAŞLARI</h4>
      <div class="sec-note" style="margin-bottom:4px">${Object.keys(S.milestones||{}).length}/${MILESTONES.length} tamamlandı</div>
      ${MILESTONES.map(m=>{
        const ok=!!(S.milestones&&S.milestones[m.k]);
        const odul = m.odul.cash?tl(m.odul.cash) : m.odul.perk?`+${m.odul.perk} uzmanlık`
                   : m.odul.slot?`+${m.odul.slot} kontenjan` : "Rakip satın alma";
        return `<div class="msrow">
          <div class="mstick ${ok?"done":""}">${ok?"&#10003;":""}</div>
          <div style="flex:1;min-width:0">
            <b style="font-size:13px;color:${ok?"var(--muted)":"var(--text)"}">${m.n}</b>
            <div class="sec-note">${m.d}</div>
          </div>
          <span class="chip ${ok?"good":"gold"}">${odul}</span>
        </div>`;}).join("")}
    </div>

    <div class="block"><h4>UZMANLIKLAR</h4>
      <div class="kv"><span>Harcanabilir puan</span><b style="color:${S.perkPts?"var(--sodium)":"var(--muted)"}">${S.perkPts||0}</b></div>
      <div class="sec-note" style="margin:6px 0 10px">Her seviye atlayışında bir puan kazanırsın. Seçim kalıcıdır.</div>
      ${PERK_LIST.map(pk=>{
        const alindi=!!(S.perks||{})[pk.k];
        return `<div class="fault">
          <div class="fname"><span style="color:${alindi?'var(--kar)':'var(--text)'}">${pk.n}</span>
            <br><small style="color:var(--muted-2)">${pk.d}</small></div>
          ${alindi?`<span class="chip good">Açık</span>`
                 :`<button class="btn" data-act="perk" data-k="${pk.k}" ${S.perkPts?"":"disabled"}>Aç</button>`}
        </div>`;}).join("")}
    </div>
    ${(S.receivables&&S.receivables.length)?`<div class="block"><h4>ALACAKLAR</h4>
      ${S.receivables.map(r=>`<div class="kv"><span>${r.n}<br><small style="color:var(--muted-2)">${r.who} · ${r.due}. gün · risk %${Math.round(r.risk*100)}</small></span>
      <b>${tl(r.amount)}</b></div>`).join("")}</div>`:""}
    <div class="block"><h4>PİYASADAKİ GALERİLER</h4>
      ${standings().map((r,i)=>`<div class="kv" style="${r.me?'background:rgba(242,160,7,.07);margin:0 -6px;padding:6px;border-radius:6px':''}">
        <span><b style="color:${r.me?'var(--sodium)':'var(--text)'}">${i+1}. ${r.n}</b>
        <br><small style="color:var(--muted-2)">${r.d||`${r.sold} satış`} · stokta ${r.stock}</small></span>
        <b>${tlk(r.w)}</b></div>`).join("")}
      <div class="sec-note" style="margin-top:8px">Rakipler her gün pazardan araç kapıyor ve senin segmentinde ilan açıyor.</div>
    </div>
    <div class="block"><h4>SON SATIŞLAR</h4>
      ${S.history.length? S.history.slice(0,10).map(h=>`
        <div class="kv"><span>${h.n}<br><small style="color:var(--muted-2)">${h.d}. gün · alış ${tlk(h.buy)} → satış ${tlk(h.sell)}</small></span>
        <b class="${h.profit>=0?"pos":"neg"}">${h.profit>=0?"+":""}${tlk(h.profit)}</b></div>`).join("")
        : `<div class="sec-note">Henüz satış yok.</div>`}
    </div>
    <div class="block"><h4>KURALLAR</h4><div class="help">
      <p><strong>Ekspertiz ₺2.500.</strong> Gizli arızaları, tramer kaydını ve km oynamasını açığa çıkarır. Bulduğun her kusur pazarlıkta koz olur.</p>
      <p><strong>Pazarlık.</strong> Her turda hamle yaparsın: koz sunmak, övgü, peşin vurgusu, blöf, kalkıp gitme tehdidi. Satıcının <strong>ruh hâli</strong> kabul eşiğini oynatır, <strong>sabrı</strong> biterse görüşme kapanır.</p>
      <p><strong>Blöf.</strong> Olmayan bir kusur uydurabilirsin. Acemi satıcı yutar, galerici yakalar — yakalanırsan sabır gider, fiyat sertleşir, kalan kozların yarı etkiye düşer.</p>
      <p><strong>Rakipler.</strong> Dört galeri seninle aynı pazardan alıyor. Beğendiğin ilanı bekletirsen kapabilirler; senin segmentinde stok tutarlarsa ilanına gelen alıcı azalır.</p>
      <p><strong>Tamir.</strong> Her tamirin bir maliyeti ve değer artışı var. Hepsini yapmak zorunda değilsin — bazıları zarar.</p>
      <p><strong>İfşa.</strong> İlanda kusuru açıklarsan fiyat düşer ama itibarın korunur. Gizlersen alıcı ekspertize götürüp yakalayabilir.</p>
      <p><strong>İtibar</strong> alıcı akışını, fiyatı ve kredi limitini belirler. Sıfırlanırsa kimse ilanına bakmaz.</p>
      <p><strong>Alıcılar</strong> tek tip değil: aile babası sedan/SUV arar ve ekspertize götürür, genç sürücü taksit ister, esnaf ticariyi sıkı pazarlık eder, meraklı boyalı parçayı affetmez, galerici her şeyi yarı fiyata alır.</p>
      <p><strong>3B gezinti.</strong> Pazar ve Garaj ekranlarının sağ üstündeki <strong>"3B gez"</strong> düğmesiyle listeden çıkıp mekânı yürüyerek dolaşabilirsin. Telefonda sol yarıyı sürükleyerek yürürsün, sağ yarıyı sürükleyerek bakarsın; bilgisayarda WASD ve fare. Bir aracın yanına gelince ön camındaki fiyat kartı okunur hâle gelir ve alt çubuktan "İncele" dersin — kararlar yine bildiğin sayfalarda verilir. Cihaz kaldırmazsa otomatik olarak listeye döner.</p>
      <p><strong>Siparişler.</strong> Müşteriler belirli bir tarif getirir: segment, model yılı, azami km, bazen vites. Bulup teslim edersen piyasa üstü bir bedel ve prim alırsın — ama müşteri aracı gözden geçirir: durumu düşükse fiyat kırar, çok kötüyse kabul etmez, gizlediğin kusuru bulursa itibarını düşürür. Sipariş kartında aracın piyasada ne ettiği de yazar: <strong>en iyi aracını siparişe vermek çoğu zaman zarardır.</strong></p>
      <p><strong>Piyasa olayları.</strong> ÖTV zammı, kredi faizi indirimi, döviz şoku, akaryakıt zammı, yeni model çıkışı, piyasa denetimi, bayram yoğunluğu, durgunluk. Her biri birkaç gün sürer ve değerleri ya da alıcı akışını değiştirir. Sezonun üstüne binen ikinci bir hava durumu.</p>
      <p><strong>Hikâyeli araçlar.</strong> Arada bir ilanın bir geçmişi olur: garajda bekletilmiş, mirastan kalmış, modifiyeli, sigortadan çıkma. Bazıları meraklı alıcıya prim yaptırır, bazıları tuzaktır — sel hasarlı araçta gizli kusurların hiçbiri gözle görünmez.</p>
      <p><strong>Tanıdıklar.</strong> Kaportacı Nuri, ekspertizci Hakan, çekici Selim, noter Yılmaz ve rakip galerici Vedat. Onlarla iş yaptıkça seviye atlarlar: tamir ucuzlar, ekspertiz ucuzlar, pazara özel ilanlar düşer, ilanlarına daha çok alıcı gelir. Seviye 2'den sonra sezonda bir kez iyilik isteyebilirsin.</p>
      <p><strong>Kilometre taşları.</strong> On hedef, her birinin ödülü var: nakit, uzmanlık puanı, park kontenjanı. Özsermayen ₺12 milyona ulaşınca <strong>rakip galeri satın alma</strong> açılır — dördünü de devralırsan oyun biter.</p>
      <p><strong>Teklifler beklerler.</strong> Gelen teklif geldiği günün sonunda kaybolmaz — <strong>iki gün geçerlidir</strong>. Raporu kapatıp aracı incelemeye gidebilir, sonra Garaj'daki "Bekleyen teklifler" bölümünden geri dönebilirsin.</p>
      <p><strong>Araç dosyası.</strong> Her aracın dosyası var: kaça ve kimden aldığın, pazarlıkta ne kadar indirdiğin, ekspertiz raporunun tamamı, yaptırdığın tamirlerin tek tek dökümü, ilan geçmişi ve toplam maliyet. Teklif ekranından, garajdan ve pazarlığın içinden açılır — teklif kaybolmadan.</p>
      <p><strong>Satış pazarlığı.</strong> Gelen her teklifte "Pazarlık et" diyebilirsin. Burada bekleyen taraf sensin: araç her gün sana para yakıyor, alıcı ise kapıdan çıkabilir. İki gösterge var — <strong>güven</strong> alıcının ne kadar yukarı çıkacağını, <strong>ilgi</strong> ise daha kaç hamle dayanacağını belirler.</p>
      <p><strong>Satış hamleleri.</strong> Gerçek kozlarını göster (temiz ekspertiz raporu, tramersiz, yeni tamir, düşük km, sezonun aranan segmenti); "kendi ustana götür" diyerek güven kazan — ama gizlediğin kusur varsa orada yakalanırsın; üstüne ekstra koy (lastik, bakım, noter — cebinden çıkar, tavanı daha çok yükseltir); "başka alıcı var" blöfünü at; taksit öner; ya da "son fiyat" deyip diren.</p>
      <p><strong>Alıcıyı oku.</strong> Meraklı ilanın üstüne bile çıkar, esnaf sıkı ama ikna olur, genç sürücünün bütçesi tavan yapar, galerici direnirsen kapıdan çıkar.</p>
      <p><strong>Takas.</strong> Alıcı kendi aracını üste koyabilir — ama ona biçtiği değer gerçeği tutmayabilir ve aracı ekspertizsiz devralırsın. Beğenmezsen "nakit ısrar et" dersin: teklif %6 düşer, alıcının %42'si vazgeçer.</p>
      <p><strong>Taksit.</strong> Toplam fiyat yükselir, para 4 ve 8 gün sonra iki parça gelir. Ödemezse kalan yanar, itibarın düşer. Genç sürücüde risk en yüksek.</p>
      <p><strong>Sezonlar.</strong> Her 15 günde bir sezon döner: kışın SUV, yazın hatchback ve klasik, sonbaharda ticari aranır. Sezon kapanışında dükkân kirası ve kârın %8'i vergi olarak kesilir.</p>
      <p><strong>Uzmanlıklar.</strong> Her seviyede bir puan kazanırsın. Usta gözü, tramer ağı, pazarlık dili, poker suratı, vitrin ustası, anlaşmalı usta, banka ilişkisi — seçim kalıcı.</p>
    </div>
    </div></div>`;
}

/* ---- AYARLAR (kendi sekmesi) ---- */
/** Anahtar bileşeni: düğme değil, tek dokunuşluk toggle. */
function swc(act, acik, ek){
  return `<button class="swc ${acik?"on":""}" data-act="${act}" ${ek||""}
    role="switch" aria-checked="${acik?"true":"false"}"><i></i></button>`;
}
function viewAyar(){
  const z=ZORLUKLAR.find(x=>x.k===(S.zorluk||"normal"))||ZORLUKLAR[0];
  return `<div class="sec-head"><h2 class="sec">Ayarlar</h2></div>

    <div class="block"><h4>SES</h4>
      <div class="swsat"><span>Ses efektleri ve titreşim</span>${swc("ses", !sesKapaliMi())}</div>
      <div class="swsat"><span>M&uuml;zik ve ambiyans<br>
        <small style="color:var(--muted-2)">Men&uuml;, saha ve pazarlık i&ccedil;in ayrı katmanlar</small></span>
        ${swc("muzik", muzikAcikMi(), sesKapaliMi()?"disabled":"")}</div>
    </div>

    ${dilSecilebilir()?`<div class="block"><h4>DİL / LANGUAGE</h4>
      <div style="display:flex;gap:8px">
        <button class="dilbtn ${I18N.lang==="tr"?"on":""}" data-act="lang" data-l="tr">T&uuml;rk&ccedil;e</button>
        <button class="dilbtn ${I18N.lang==="en"?"on":""}" data-act="lang" data-l="en">English</button>
      </div></div>`:""}

    <div class="block"><h4>GALERİ</h4>
      <div class="kv"><span>Tabela</span><b style="color:${lotRenk().h}">${lotAd()}</b></div>
      <button class="btn full" data-act="lotac" style="margin-top:8px">Galerimi d&uuml;zenle</button>
    </div>

    <div class="block"><h4>ZORLUK</h4>
      <div class="kv"><span>Se&ccedil;ili kademe</span><b>${z.n}</b></div>
      <div class="sec-note">${z.d}</div>
      <div class="sec-note" style="margin-top:6px;color:var(--muted-2)">Zorluk oyun başında se&ccedil;ilir ve kayıt boyunca değişmez. Değiştirmek i&ccedil;in baştan başlaman gerekir.</div>
    </div>

    <div class="block"><h4>KAYIT YEDEĞİ</h4>
      <div class="btn-row">
        <button class="btn" data-act="kayitdisa">Kopyala</button>
        <button class="btn" data-act="kayitice">Y&uuml;kle</button>
      </div>
      <div class="sec-note" style="margin-top:7px">İlerlemen bu cihazda saklanır &mdash; yedeği kopyalayıp başka bir cihaza taşıyabilirsin.</div>
    </div>

    <div class="block"><h4>NASIL OYNANIR</h4>
      <div class="sec-note" style="margin-bottom:8px">Kuralların tamamı Defter sekmesinin altında.</div>
      <button class="btn full" data-act="demoac">Tanıtım turunu izle</button>
      <button class="btn ghost full" data-act="tab" data-t="rapor" style="margin-top:7px">Kurallara git</button>
    </div>

    <button class="btn ghost full danger" data-act="reset" style="margin-top:6px">Baştan başla</button>
    <div class="sec-note" style="text-align:center;margin-top:10px;color:var(--muted-2)">
      Kelepir &middot; reklamsız, &ccedil;evrimdışı, uygulama i&ccedil;i satın alma yok</div>`;
}

/* ================= modal ================= */
/* Belge niteliğindeki sayfalar (araç dosyası, defter, gün raporu, karne)
   kâğıt yüzeyine oturuyor: sinif="belge" verilince sayfanın altındaki
   bütün renk jetonları kâğıt/mürekkep değerleriyle değişiyor. */
/** Ekranın kimliği: başlık + alt başlık. Aynı sayfa yeniden çizildiğinde
    (tamir yaptırınca, pazarlıkta hamle yapınca) bunu karşılaştırıp kaydırma
    konumunu koruyoruz. Farklı bir araç ya da farklı bir ekran açılıyorsa
    anahtar değişir ve sayfa baştan başlar. */
function sheetAnahtar(html){
  const al=(sinif)=>{
    const m=html.match(new RegExp('class="'+sinif+'"[^>]*>([\\s\\S]*?)<\\/div>'));
    return m ? m[1] : "";
  };
  return (al("sheet-title")+"|"+al("sheet-sub"))
    .replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim();
}
function openSheet(html, sinif){
  const el=document.getElementById("sheet");
  const modal=document.getElementById("modal");
  // Sayfa zaten açıksa ve AYNI sayfa yeniden çiziliyorsa kaydırma korunur.
  // Eskiden her çizimde başa dönülüyordu: bir tamir yaptırınca ya da
  // pazarlıkta hamle yapınca oyuncu sayfanın tepesine fırlıyor, az önce
  // bastığı düğmeyi ve gelen cevabı göremiyordu.
  const acikti = !modal.classList.contains("hidden");
  const eskiAnahtar = el.dataset.ekran || "";
  const eskiKaydirma = el.scrollTop;
  const yeniAnahtar = sheetAnahtar(html);

  el.className="sheet"+(sinif?" "+sinif:"");
  el.innerHTML=html;
  el.dataset.ekran=yeniAnahtar;
  modal.classList.remove("hidden");
  document.body.classList.add("sheetacik");

  if(acikti && yeniAnahtar && yeniAnahtar===eskiAnahtar){
    // İçerik kısalmış olabilir (tamir edilen satır listeden düştü) — kırp.
    el.scrollTop=Math.max(0, Math.min(eskiKaydirma, el.scrollHeight-el.clientHeight));
  }else{
    el.scrollTop=0;
  }
  // Pazarlık ekranlarında son mesaj hep görünsün.
  if(html.indexOf('class="talk"')>=0 && typeof talkAlta==="function") talkAlta();
}
function closeSheet(){
  document.getElementById("modal").classList.add("hidden");
  document.body.classList.remove("sheetacik");
  if(S.view3d && can3d() && W3D.active) W3D.resume();
}

function findCar(id){ return [...S.market,...S.cars,...S.auction].find(c=>c.id===+id); }

function sheetHead(c, extra){
  return `<div class="sheet-head">
    <div><div class="sheet-title">${adBol(c.model.n).ad}</div>
      <div class="sheet-sub">${adBol(c.model.n).mot?adBol(c.model.n).mot+" · ":""}${c.year} · ${mesafe(c.km)} · ${c.color}</div>
      <div class="sheet-sub" style="color:var(--muted-2)">${c.gear} · ${c.fuel} · ${DOSEME_LBL[dosemeTipi(c)]}</div>
      <div style="margin-top:7px">${plateHtml(c.plate)}</div></div>
    <button class="x" data-act="close" aria-label="Kapat">×</button></div>
    <div class="aracsahne">${aracGorsel(c,"tam")}</div>${extra||""}`;
}
/* Son tamir edilen organ — yalnızca bir çizim boyunca yaşayan geçici
   durum. Kayda yazılmıyor: S'ye koyulsa eski kayıtta da canlanırdı. */
let SON_TAMIR=null;

/* ---- ekspertiz mührü ----
   Rapor sayı yığınıyla açılıyordu; sonucu okumak için beş çubuğu, tramer
   satırını ve değişen parçayı tek tek okumak gerekiyordu. Kauçuk mühür
   hükmü tek bakışta veriyor, detay altında duruyor. */
function muhurHukmu(c){
  const deger=Math.max(1, valueOf(c,false));
  if(c.tramer>deger*0.12 || c.degisen>=3) return {s:"agir", t:"AĞIR HASAR"};
  if(c.tramer>0 || c.degisen>0)           return {s:"tramer", t:"TRAMERLİ"};
  if(c.kmOynama)                          return {s:"tramer", t:"KM Ş&Uuml;PHELİ"};
  return {s:"temiz", t:"TEMİZ"};
}
function muhurCiz(c){
  const h=muhurHukmu(c);
  return `<span class="muhur ${h.s}" aria-hidden="true"><b>${h.t}</b>
    <i>EKSPERTİZ &middot; ${c.plate||""}</i></span>`;
}
function condBlock(c, full){
  const gorunen=compsOf(c, true), gercek=compsOf(c, false);
  // Ekspertiz raporu bir belge: kâğıt yüzeyine oturuyor. Gözle bakış
  // belge değil, sokakta verilen bir karar — koyu kalıyor.
  return `<div class="${full?"belge muhurlu":"block"}">${full?'<div class="block">':""}<h4>DURUM ${full?"&middot; EKSPERTİZ RAPORU":"&middot; G&Ouml;ZLE BAKIŞ"}</h4>
    ${full?muhurCiz(c):""}
    ${COMPKEYS.map(k=>{
      const v=full?gercek[k]:gorunen[k];
      const bilinmeyen=full?0:Math.max(0,gorunen[k]-gercek[k]);
      const col=v>72?"var(--kar)":v>45?"var(--sodium)":"var(--zarar)";
      const alt=Math.max(5,v-bilinmeyen);
      // Az önce tamir edilen organ eski genişlikte doğuyor; cubukDoldur()
      // bir kare sonra hedefe çekiyor, geçiş dolmayı gösteriyor.
      const t=SON_TAMIR;
      const canlan=t && t.id===c.id && t.comp===k;
      return `<div class="bar-row"><span class="lbl">${COMPLBL[k]}</span>
        <span class="bar"><i class="${canlan?"dolan":""}" style="width:${canlan?t.eski:alt}%;background:${col}"${canlan?` data-hedef="${alt}"`:""}></i><u style="width:${bilinmeyen}%"></u></span>
        <span class="val">${full?v:(bilinmeyen?alt+"&ndash;"+v:String(v))}</span></div>`;
    }).join("")}
    ${full?"":`<div class="hatchkey"><span></span>Taralı kısım kaputun altı &mdash; ekspertize kadar bilinmiyor</div>`}
  </div>`;
}
/* ---- kademeli ekspertiz: hangi organa, ne kadar bakacaksın ----
   Tam ekspertiz her şeyi açıyor ama pahalı. Hızlı bakış tek organ açıyor
   ve ucuz — hangisini seçeceğin defterindeki bilgiye bağlı. Model notu
   olan oyuncu doğru organa bakar, olmayan kör atar. Beceri tam burada. */
function hizliFiyat(){ return Math.round(eksperFiyat()*0.34/50)*50; }
function bakisBlok(c){
  if(c.inspected) return "";
  const acik=(c.bakilan||[]);
  const not=notBilgi(c.model);
  const kalan=COMPKEYS.filter(k=>acik.indexOf(k)<0);
  return `<section class="bakis">
    <div class="bakis-bas"><span class="bakis-et">NE KADAR BAKACAKSIN</span>
      <span class="bakis-rozet">${acik.length?acik.length+" organ a&ccedil;ık":"hen&uuml;z bakılmadı"}</span></div>
    ${not?`<div class="defternot vurgu"><b>Defterin</b> bu modelde ${not.say} kez
      <em>${not.ad}</em> g&ouml;rd&uuml;n &mdash; ${not.organ} organına bakmak mantıklı</div>`:""}
    ${kalan.length?`<div class="bakis-not">Hızlı bakış tek organ a&ccedil;ar &middot; ${tl(hizliFiyat())}</div>
    <div class="bakis-organ">
      ${kalan.map(k=>`<button class="btn bakbtn" data-act="hizlibak" data-id="${c.id}" data-c="${k}"
        ${S.cash<hizliFiyat()?"disabled":""}>${COMPLBL[k]}</button>`).join("")}
    </div>`:`<div class="bakis-not">T&uuml;m organlara bakıldı.</div>`}
    <button class="btn primary full" data-act="eksper" data-id="${c.id}"
      ${S.cash<eksperFiyat()&&!c.gunun?"disabled":""} style="margin-top:10px">
      Tam ekspertiz &middot; ${c.gunun?"bedava":tl(eksperFiyat())}</button>
    <div class="bakis-not alt">Tamamı ge&ccedil;mişi de a&ccedil;ar: tramer, boyalı ve değişen par&ccedil;a.</div>
  </section>`;
}
function known(c,f){
  if(c.inspected || f.visible) return true;
  if(bakildiMi(c,f.comp)) return true;
  if(S.staff.eksper && f.id%2===0) return true;
  if(perk("goz")){ // her araçta bir gizli arıza bedava görünür
    const gizli=c.faults.filter(x=>!x.fixed && !x.visible).sort((a,b)=>a.id-b.id);
    if(gizli.length && gizli[0].id===f.id) return true;
  }
  return false;
}
function seesHistory(c){ return c.inspected || perk("tramer"); }
function faultBlock(c, canRepair){
  const list=c.faults.filter(f=>!f.fixed && known(c,f));
  if(!list.length) return `<div class="block"><h4>ARIZALAR</h4>
    <div class="sec-note">${c.inspected?"Ekspertizde arıza çıkmadı.":"Gözle görünen arıza yok."}</div></div>`;
  return `<div class="block"><h4>ARIZALAR</h4>
    ${list.map(f=>`<div class="fault">
      <div class="fname">${f.n}<br><small style="color:var(--muted-2)">${COMPLBL[f.comp]}${f.visible?"":" · uzmanın gördü"}</small></div>
      <div class="fcost">${tl(f.cost)}</div>
      ${canRepair?`<button class="btn" data-act="repair" data-id="${c.id}" data-f="${f.id}" ${S.cash<f.cost?"disabled":""}>Yaptır</button>`:""}
    </div>`).join("")}
  </div>`;
}
function historyBlock(c){
  if(!seesHistory(c)) return `<div class="block"><h4>HASAR GEÇMİŞİ</h4>
    <div class="sec-note">Tramer sorgusu yapılmadı.</div></div>`;
  return `<div class="block"><h4>HASAR GEÇMİŞİ</h4>
    <div class="kv"><span>Tramer kaydı</span><b class="${c.tramer?"neg":"pos"}">${c.tramer?tl(c.tramer):"Yok"}</b></div>
    <div class="kv"><span>Değişen parça</span><b class="${c.degisen?"neg":""}">${c.degisen}</b></div>
    <div class="kv"><span>Boyalı parça</span><b class="${c.boyali>2?"neg":""}">${c.boyali}</b></div>
    <div class="kv"><span>Km tutarlılığı</span><b class="${c.kmOynama?"neg":"pos"}">${c.kmOynama?"Şüpheli":"Tutarlı"}</b></div>
  </div>`;
}
function valueBlock(c){
  const tv=valueOf(c,false), av=valueOf(c,true);
  const ask=c.ask||c.listPrice||tv;
  if(c.inspected){
    const lo=tv*0.96, hi=tv*1.05;
    const min=Math.min(lo,ask)*0.94, max=Math.max(hi,ask)*1.06;
    const p=v=>clamp((v-min)/(max-min)*100,0,100);
    return `<div class="block"><h4>NE KADAR EDİYOR &middot; RAPORLU</h4>
      <div class="band">
        <span class="tick" style="left:0">${tlk(min)}</span>
        <span class="tick" style="right:0">${tlk(max)}</span>
        <span class="track"></span>
        <span class="rng tight" style="left:${p(lo)}%;width:${p(hi)-p(lo)}%"></span>
        <span class="ask" style="left:${p(ask)}%"></span>
        <span class="asklbl" style="left:${p(ask)}%">${c.owned?"ilan":"istenen"} ${tlk(ask)}</span>
      </div>
      <div class="kv"><span>Ger&ccedil;ek piyasa değeri</span><b style="color:var(--sodium)">${tl(tv)}</b></div>
      ${av>tv*1.02?`<div class="kv"><span>Kusurları bilmeyen alıcıya</span><b>${tl(av)}</b></div>`:""}
    </div>`;
  }
  const lo=av*0.82, hi=av*1.08;
  const min=Math.min(lo,ask)*0.94, max=Math.max(hi,ask)*1.06;
  const p=v=>clamp((v-min)/(max-min)*100,0,100);
  const daralma=Math.round((hi-lo)-(tv*0.09));
  return `<div class="block"><h4>NE KADAR EDİYOR &middot; EKSPERTİZSİZ</h4>
    <div class="band">
      <span class="tick" style="left:0">${tlk(min)}</span>
      <span class="tick" style="right:0">${tlk(max)}</span>
      <span class="track"></span>
      <span class="rng" style="left:${p(lo)}%;width:${p(hi)-p(lo)}%"></span>
      <span class="ask" style="left:${p(ask)}%"></span>
      <span class="asklbl" style="left:${p(ask)}%">${c.owned?"ilan":"istenen"} ${tlk(ask)}</span>
    </div>
    <div class="note">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="M16 16l5 5"></path></svg>
      <div>Ekspertiz bu bandı yaklaşık <b class="mono">${tlk(Math.max(0,daralma))}</b> daraltır ve pazarlıkta koz &ccedil;ıkarır.</div>
    </div></div>`;
}

/* ---- pazar aracı detayı ---- */
function openMarketCar(c){
  c.gorulen=true;           // bu ilana baktın: rakip kaparsa haberin olsun
  const hikaye = c.story ? (()=>{const st=STORIES.find(s=>s.k===c.story);
    return `<div class="block" style="border-color:rgba(242,160,7,.35)">
      <h4>${st.t.toLocaleUpperCase("tr")}</h4>
      <div style="font-size:13px;line-height:1.55;color:#D9CDB4">${st.d}</div>
      ${st.riskli?`<div class="sec-note" style="color:#F08B86;margin-top:7px">Bu hik&acirc;ye riskli — g&ouml;r&uuml;nmeyeni ekspertizsiz anlayamazsın.</div>`
                 :`<div class="sec-note" style="margin-top:7px">Meraklı alıcılar b&ouml;yle ara&ccedil;lara prim &ouml;der.</div>`}
    </div>`;})() : "";
  const claims=`<div class="block"><h4>İLAN METNİ</h4>
     <div class="quote">"${c.claims.join(". ")}. ${c.seller.d}"</div>
     <div class="card-foot" style="border:none;padding:9px 0 0"><span class="chip">${c.seller.n}</span>
     <span class="chip">Sabır ${"&#9679;".repeat(c.pat+(perk("dil")?1:0))}</span>
     ${(c.age||0)>0?`<span class="chip agedots">${"<s></s>".repeat(Math.min(c.age,5))} ${c.age} g&uuml;n${c.cutDay?" &middot; fiyat kırdı":""}</span>`:""}</div></div>`;
  const specs=`<div class="block"><h4>ARA&Ccedil;</h4>
     <div class="kv"><span>Model yılı</span><b>${c.year}</b></div>
     <div class="kv"><span>Kilometre</span><b>${mesafe(c.km)}</b></div>
     <div class="kv"><span>Vites / yakıt</span><b>${c.gear} &middot; ${c.fuel}</b></div>
     <div class="kv"><span>Renk</span><b>${c.color}</b></div>
     <div class="kv"><span>İstenen fiyat</span><b style="color:var(--sodium)">${tl(c.ask)}</b></div></div>`;
  openSheet(sheetHead(c)+hikaye+valueBlock(c)+condBlock(c,c.inspected)+bakisBlok(c)+
    (c.inspected?notSatiri(c.model):"")+faultBlock(c,false)+historyBlock(c)+claims+specs+
    `<div class="actionbar">
       <div class="btn-row">
         ${c.inspected?"":`<button class="btn" data-act="eksper" data-id="${c.id}" ${S.cash<eksperFiyat()?"disabled":""}>Ekspertiz &middot; ${c.gunun?"bedava":tl(eksperFiyat())}</button>`}
         <button class="btn primary" data-act="negotiate" data-id="${c.id}">Pazarlığa otur</button>
       </div>
       ${(S.favors&&S.favors.selim&&!c.towed&&openFaults(c).length>=2)?`<button class="btn ghost full" data-act="tow" data-id="${c.id}">
         Selim &ccedil;eksin &middot; fiyattan ₺7.500 d&uuml;şer</button>`:""}
       <div class="hint">Nakit ${tl(S.cash)} &middot; park yerin ${Math.max(0,S.slots-S.cars.length)} boş</div>
     </div>`);
}

/* ---- müzayede aracı ---- */
function openAuctionCar(c){
  openSheet(sheetHead(c)+
    `<div class="block"><h4>MÜZAYEDE</h4>
      <div class="quote">"Olduğu gibi satılır. İade yok, ekspertiz yok."</div>
      <div class="kv" style="margin-top:8px"><span>Muhammen bedel</span><b>${tl(Math.round(valueOf(c,true)*0.7))}</b></div>
      <div class="kv"><span>Kilometre</span><b>${mesafe(c.km)}</b></div>
      <div class="kv"><span>Vites / yakıt</span><b>${c.gear} · ${c.fuel}</b></div></div>`+
    condBlock(c,false)+faultBlock(c,false)+
    `<div class="block"><h4>DEĞERLEME</h4>
      <div class="kv"><span>Kaba tahmin</span><b>${tlk(valueOf(c,true)*0.82)} – ${tlk(valueOf(c,true)*1.08)}</b></div>
      <div class="sec-note" style="margin-top:5px">Kaputun altı meçhul. Zarfını buna göre ver.</div></div>
     <button class="btn primary full" data-act="bid" data-id="${c.id}">Zarf ver</button>`);
}

/* ================= tamir atölyesi =================
   Tamir, raporun içinde bir satır değil; AYRI BİR ALAN. Ekspertiz raporu
   okunacak bir belge, atölye ise iş yapılacak bir tezgâh. Eskiden tamir
   satırları rapor bloklarının arasında, aynı kâğıt yüzeyinde duruyordu ve
   kayboluyordu. Artık kendi koyu paneli var, iki ekranda da EN ÜSTTE
   açılıyor, "Yaptır" dolu düğme ve fiyat düğmenin üstünde.

   act: "repair" (kendi aracın sayfası) | "repairfile" (araç dosyası) —
   hangi ekrandan çağrıldıysa tamirden sonra oraya dönsün diye. */
function atolyeBlok(c, act){
  const dosyaMi = act==="repairfile";
  const cilaAct = dosyaMi ? "cosmeticfile" : "cosmetic";
  const acik = c.faults.filter(f=>!f.fixed && known(c,f));
  const cila = !c.cosmetic;

  if(!acik.length && !cila)
    return `<section class="atolye bitti">
      <div class="atolye-bas"><span class="atolye-et">TAMİR ATÖLYESİ</span>
        <span class="atolye-rozet ok">Hazır</span></div>
      <div class="atolye-not">Bilinen arıza kalmadı, kozmetik hazırlık yapıldı.
        Ara&ccedil; satışa hazır.</div></section>`;

  const toplam = acik.reduce((s,f)=>s+repairCost(f),0);
  const karli  = acik.filter(f=>repairGain(c,f)>=repairCost(f)).length;

  const isSatir = (ad, alt, bedel, eylem, ek, karliMi)=>
    `<div class="isemri${karliMi?" karli":""}">
      <div class="ise-ad">${ad}<small>${alt}</small></div>
      <button class="btn ${karliMi?"primary":""} ise-btn" data-act="${eylem}" data-id="${c.id}"${ek}
        ${S.cash<bedel?"disabled":""}>Yaptır<em>${tl(bedel)}</em></button>
    </div>`;

  return `<section class="atolye">
    <div class="atolye-bas"><span class="atolye-et">TAMİR ATÖLYESİ</span>
      <span class="atolye-rozet">${acik.length?acik.length+" a&ccedil;ık arıza":"kozmetik hazırlık"}</span></div>
    ${acik.length?`<div class="atolye-ozet">
      <span>Hepsi <b>${tl(toplam)}</b></span>
      <span><b>${karli}</b> tanesi k&acirc;rlı</span></div>`:""}
    ${acik.map(f=>{
      const bedel=repairCost(f), g=repairGain(c,f), deger=g>=bedel;
      return isSatir(f.n,
        `${COMPLBL[f.comp]} &middot; değere +${tlk(g)}${deger?" &middot; k&acirc;rlı":" &middot; maliyetini &ccedil;ıkarmaz"}`,
        bedel, act, ` data-f="${f.id}"`, deger);
    }).join("")}
    ${cila?isSatir("Pasta cila + detaylı temizlik",
        "Ger&ccedil;ek değeri değiştirmez, ilk izlenimi g&uuml;&ccedil;lendirir",
        350, cilaAct, "", false):""}
    ${acik.length?`<div class="atolye-not">Hepsini yaptırmak zorunda değilsin —
      maliyetini &ccedil;ıkarmayan tamir senin cebinden gider.</div>`:""}
  </section>`;
}

/* ---- kendi aracın ---- */
function openOwnCar(c){
  /* emanet bloğu, değer bloğunun hemen altında — sahibine borç her an görünsün */
  const tv=valueOf(c,false), av=valueOf(c,true);
  const issues=hiddenIssues(c);
  const cost=c.boughtFor+c.spent+(c.inspected?PARA.ekspertiz:0)+c.daysListed*PARA.otoparkGun;
  let head=`<div class="block"><h4>HESAP</h4>
    <div class="kv"><span>${c.konsinye?"Sahibine net":"Alış"}</span><b>${tl(c.boughtFor)}</b></div>
    <div class="kv"><span>Tamir + masraf</span><b>${tl(c.spent+(c.inspected?PARA.ekspertiz:0)+c.daysListed*PARA.otoparkGun)}</b></div>
    <div class="kv"><span>Toplam maliyet</span><b>${tl(cost)}</b></div>
    <div class="kv"><span>Bugünkü değer</span><b style="color:var(--sodium)">${c.inspected?tl(tv):tlk(av*0.86)+" – "+tlk(av*1.06)}</b></div></div>`;

  let sellPart;
  if(c.listPrice){
    sellPart=`<div class="block"><h4>SATIŞTA</h4>
      <div class="kv"><span>İlan fiyatı</span><b style="color:var(--sodium)">${tl(c.listPrice)}</b></div>
      <div class="kv"><span>İlanda kaç gün</span><b>${c.daysListed}</b></div>
      <div class="kv"><span>Gelen alıcı</span><b>${c.leadsSeen}</b></div>
      <div class="kv"><span>Rakip ilanı (aynı segment)</span><b class="${rivalPressure(c.model.seg)?"neg":""}">${rivalPressure(c.model.seg)}</b></div>
      <div class="kv"><span>Kusurlar</span><b>${c.disclosed?"İlanda açıklandı":(issues.length?"Gizlendi":"Kusur yok")}</b></div>
      </div>
      <div class="actionbar">
        <div class="btn-row">
          <button class="btn" data-act="unlist" data-id="${c.id}">İlanı kaldır</button>
          <button class="btn ghost" data-act="cut" data-id="${c.id}">Fiyat kır %3</button></div>
        ${(S.favors&&S.favors.yilmaz)?`<button class="btn primary full" data-act="fastsale" data-id="${c.id}"
          style="margin-top:8px">Yılmaz&#39;ı ara &middot; aynı g&uuml;n alıcı bul</button>`:""}
      </div>`;
  }else{
    const press=rivalPressure(c.model.seg);
    const gizli=hiddenIssues(c).length;
    const dil=c.ilanDili||"muglak", sun=c.sunum|0;
    sellPart=`<section class="ilan">
      <div class="ilan-bas"><span class="ilan-et">İLANI KUR</span>
        <span class="ilan-rozet">${gizli?gizli+" gizli kusur":"gizlenecek kusur yok"}</span></div>
      <div class="ilan-alt">İLANIN DİLİ</div>
      <div class="ilan-secim">
        ${Object.keys(ILAN_DILI).map(k=>{const o=ILAN_DILI[k];
          return `<button class="ilansec ${dil===k?"on":""}" data-act="ilandil" data-id="${c.id}" data-k="${k}">
            <b>${o.n}</b><span>${o.d}</span></button>`;}).join("")}
      </div>
      <div class="ilan-not">${
        dil==="durust" ? "Az alıcı gelir ama ciddi gelir &mdash; ve kimse seni yakalayamaz."
        : dil==="abartili" ? (gizli
            ? "&Ccedil;ok alıcı gelir, pazarlık eder. Gizli kusurun var: ekspertize g&ouml;t&uuml;r&uuml;rse pahalıya patlar."
            : "&Ccedil;ok alıcı gelir, pazarlık eder. Gizleyecek kusurun yok &mdash; risk d&uuml;ş&uuml;k.")
        : "Dengeli. Sorarlarsa s&ouml;ylersin."}</div>
      <div class="ilan-alt">SUNUM</div>
      <div class="ilan-secim">
        ${ILAN_SUNUM.map((o,i)=>`<button class="ilansec ${sun===i?"on":""}" data-act="ilansunum" data-id="${c.id}" data-i="${i}"
          ${o.bedel&&S.cash<o.bedel?"disabled":""}>
          <b>${o.n}</b><span>${o.bedel?tl(o.bedel):"bedava"}</span></button>`).join("")}
      </div>
      <div class="ilan-not">${ILAN_SUNUM[sun].d} &middot; alıcı akışı
        &times;${ILAN_SUNUM[sun].akis.toFixed(2)}</div>
    </section>
    <div class="block"><h4>FİYAT</h4>
      <div class="sec-note" style="margin-bottom:8px">Fiyatı ne kadar yükseltirsen alıcı o kadar seyrelir.</div>
      ${press?`<div class="sec-note" style="color:#F5BC4C;margin-bottom:8px">Aynı segmentte ${press} rakip ilanı var — alıcı akışın %${Math.round((1-1/(1+.13*press))*100)} daha yavaş.</div>`:""}
      <div style="text-align:center;font-family:'IBM Plex Mono',monospace;font-size:22px;font-weight:600;color:var(--sodium)"
           id="lpLabel">${tl(c.inspected?tv:av)}</div>
      <input type="range" id="lpRange" min="70" max="140" value="100" step="1"
             data-base="${c.inspected?tv:av}" style="margin:10px 0 4px">
      <div class="sec-note" style="display:flex;justify-content:space-between"><span>Ucuz · hızlı</span><span>Pahalı · yavaş</span></div>
      <div id="lpKar" class="lpkar" data-cost="${cost}">${lpKarMetni(c.inspected?tv:av, cost)}</div>
      </div>
      <div class="actionbar">
        <button class="btn primary full" data-act="list" data-id="${c.id}">İlanı yayınla</button>
        ${c.konsinye?"":`<button class="btn ghost full" data-act="wholesale" data-id="${c.id}">
          Galericiye toptan sat &middot; ${tl(Math.round(tv*0.82))}</button>`}
      </div>`;
  }

  const bekTeklif=offerOf(c.id);
  const teklifKarti = bekTeklif ? `<div class="block" style="border-color:rgba(242,160,7,.45)">
      <h4>BEKLEYEN TEKLİF</h4>
      <div class="pricerow" style="border:none;padding:0 0 6px">
        <span class="plabel">${bekTeklif.type?bekTeklif.type.n:"Alıcı"}</span>
        <span class="pval" style="color:var(--sodium)">${tl(bekTeklif.amount)}</span></div>
      <div class="sec-note">Maliyetine g&ouml;re
        <b class="${bekTeklif.amount-carCost(c)>=0?"pos":"neg"}">${bekTeklif.amount-carCost(c)>=0?"+":""}${tl(bekTeklif.amount-carCost(c))}</b>
        &middot; ${bekTeklif.expires-S.day<=0?"bug&uuml;n son g&uuml;n":(bekTeklif.expires-S.day)+" g&uuml;n ge&ccedil;erli"}</div>
      <div class="btn-row" style="margin-top:10px">
        <button class="btn primary" data-act="salenego" data-oid="${bekTeklif.oid}">Pazarlık et</button>
        <button class="btn" data-act="dropoffer" data-oid="${bekTeklif.oid}">Reddet</button>
      </div>
    </div>` : "";

  const emanet=konsBlok(c);
  // Atölye her araçta en üstte: bekleyen teklifin hemen ardından,
  // değer ve hesap bloklarının ÖNÜNDE.
  openSheet(sheetHead(c)+teklifKarti+
    atolyeBlok(c,"repair")+
    `<button class="btn ghost full" data-act="carfile" data-id="${c.id}" data-back="own" style="margin-bottom:10px">
       Ara&ccedil; dosyası &middot; alış, tamirler, rapor</button>`+
    valueBlock(c)+emanet+head+
    (c.inspected?"":`<button class="btn full" data-act="eksper" data-id="${c.id}" style="margin-bottom:10px" ${S.cash<eksperFiyat()?"disabled":""}>Ekspertize ver &middot; ${c.gunun?"bedava":tl(eksperFiyat())}</button>`)+
    condBlock(c,c.inspected)+
    historyBlock(c)+sellPart);
}
function repairCost(f){
  /* Sanayi günü indirimi en sonda: zorluk çarpanıyla birlikte yuvarlanıyor
     ki iki ayrı yuvarlama ₺250'lik basamakları kaydırmasın. */
  const kat=(zorGercek()?1.18:1)*sanayiKat();
  if(kat===1) return _repairCost(f);
  return Math.round(_repairCost(f)*kat/250)*250;
}
function _repairCost(f){
  const nuri=CONTACTS.find(c=>c.k==="nuri").per[cLvl("nuri")]/100;
  return Math.round(f.cost*(perk("usta")?.8:1)*(1-nuri)/250)*250;
}
function repairGain(c,f){
  const before=valueOf(c,false);
  f.fixed=true; const after=valueOf(c,false); f.fixed=false;
  return after-before;
}

/* ---- pazarlık ---- */
function negLeverage(c){
  if(c.inspected) return hiddenIssues(c);
  if(!perk("tramer")) return [];
  const out=[];
  if(c.tramer>0) out.push({t:`Tramer kaydı: ${tl(c.tramer)}`, cut:.06});
  if(c.kmOynama) out.push({t:"Km'de oynama şüphesi", cut:.10});
  return out;
}
const MOOD_LBL=m=>m>=78?"Keyifli":m>=58?"Yumuşak":m>=40?"Nötr":m>=20?"Gergin":"Kızgın";
const MOOD_COL=m=>m>=58?"var(--kar)":m>=40?"var(--orange)":"var(--zarar)";

function openNegotiation(c){
  if(!S.neg||S.neg.carId!==c.id){
    S.neg={
      carId:c.id, pat:c.pat+(perk("dil")?1:0), mood:50, disc:0, hard:0,
      known:negLeverage(c).map((l,i)=>({...l,i})),
      usedKoz:[], bluffsUsed:[], walkUsed:false, distrust:false, ovguUsed:false, pesinUsed:false,
      log:[{who:"them", t:`${greeting(c)} ${tl(c.ask)} istiyorum.`}],
      counter:null, done:false, senet:false
    };
  }
  renderNeg();
}
function greeting(c){
  const g={acil:"Hoş geldin, aracı acil çevirmem lazım.",
           acemi:"Merhaba, babamın arabasıydı, ben pek anlamam.",
           filo:"Şirket aracıydı, tüm bakımları bizde yapıldı.",
           duygusal:"Bu araba bana emanet, kıymetini bilene vereceğim.",
           galerici:"Buyur usta, fiyatımız nettir.",
           koleksiyoncu:"Bu araçtan piyasada kaç tane kaldı, biliyor musun?"};
  return g[c.seller.k]||"Buyur.";
}
function negReserve(){
  const c=findCar(S.neg.carId), n=S.neg;
  const base=c.reserve*(1-Math.min(.34,n.disc))*(1+n.hard);
  return Math.round(base*(1-(n.mood-50)/500));
}
function say(who,t){ S.neg.log.push({who,t}); }
/** Pazarlık balonlarını en alta kaydır: son mesaj hep görünsün. */
function talkAlta(){
  requestAnimationFrame(()=>{
    const sheet=document.getElementById("sheet");
    document.querySelectorAll("#sheet .talk").forEach(e=>{
      e.scrollTop=e.scrollHeight;
      if(!sheet) return;
      // Balon kutusunun kendi içinde en alta inmek yetmiyor: kutu sayfanın
      // görünen alanının dışında kaldıysa oyuncu hamlesinin cevabını
      // göremiyor. Sayfayı, kutu görünecek KADAR kaydırıyoruz — başa atmadan.
      const r=e.getBoundingClientRect(), s=sheet.getBoundingClientRect();
      if(r.bottom > s.bottom-8)      sheet.scrollTop += r.bottom-(s.bottom-8);
      else if(r.top < s.top+8)       sheet.scrollTop -= (s.top+8)-r.top;
    });
  });
}
function moodShift(d){ S.neg.mood=clamp(S.neg.mood+d,0,100); }

/* --- hamleler --- */
function doMove(kind, idx){
  const c=findCar(S.neg.carId), n=S.neg, s=c.seller;
  if(n.done) return;
  const moodOnce=n.mood;

  if(kind==="koz"){
    const l=n.known[+idx]; if(!l||n.usedKoz.includes(+idx)) return;
    n.usedKoz.push(+idx);
    const dim=[1,.8,.6,.45,.35][Math.min(4,n.usedKoz.length-1)];
    const eff=l.cut*dim*(n.distrust?.5:1);
    n.disc+=eff; moodShift(-7);
    say("you", `Ekspertiz raporu önümde: ${l.t}. Bunu fiyata yansıtman lazım.`);
    if(s.sert>.4 && n.usedKoz.length>=3){
      n.pat--;
      say("them", pick([`Her şeyi kusur diye sayarsan bu iş olmaz.`,`Sen araba mı alacaksın, rapor mu yazacaksın?`]));
    }else{
      say("them", pick([
        `Doğru, onu ben de biliyorum. ${n.distrust?"Ama sana güvenim kalmadı.":"Bir şeyler yaparız."}`,
        `Tamam, orada haklısın. Fiyatta biraz esneyebilirim.`,
        `Peki. O kalem için bir miktar düşerim.`]));
    }
  }

  else if(kind==="blof"){
    const b=BLUFFS[+idx]; if(!b||n.bluffsUsed.includes(+idx)) return;
    n.bluffsUsed.push(+idx);
    say("you", b.t+".");
    const r=resolveBluff(c,b,n.mood);
    if(r.caught && perk("poker") && chance(.34)) r.caught=false;
    if(r.caught){
      n.pat-=2; moodShift(-24); n.hard+=.04; n.distrust=true;
      say("them", pick([
        `Yalan söylüyorsun. O araç daha geçen ay serviste bakıldı.`,
        `Hadi oradan. Beni acemi mi sandın sen?`,
        `Bak bu iş böyle yürümez. Fiyatım da artık nettir.`]));
    }else{
      const eff=b.cut*(r.gercek?1.25:1)*(n.distrust?.5:1);
      n.disc+=eff; moodShift(-6);
      say("them", r.gercek
        ? pick([`...Haklısın, orayı hiç konuşmayalım. Fiyattan düşerim.`,`Fark etmişsin. Peki, biraz kırarım.`])
        : pick([`Öyle mi? Ben fark etmemiştim... Neyse, bir miktar inerim.`,`Emin misin? Peki, ona göre konuşalım.`]));
    }
  }

  else if(kind==="ovgu"){
    if(n.ovguUsed) return; n.ovguUsed=true;
    say("you", pick([
      `Aracı çok güzel kullanmışsın, belli.`,
      `Bu modelin böyle bakımlısı zor bulunur.`,
      `Doğrusu arabaya emek verilmiş, gözden kaçmıyor.`]));
    moodShift(15);
    if(s.ego>0){
      n.disc+=.03*s.ego;
      if(n.pat<c.pat+(perk("dil")?1:0)) n.pat++;
      const rep={
        acil:[`Sağ ol. Bakımını hep yaptırdım, mecbur kalmasam satmazdım.`,`Eyvallah. Şartlar olmasa elden çıkarmazdım.`],
        acemi:[`Öyle mi? Babam çok titizdi arabaya.`,`Valla ben pek bilmem ama hep övülürdü.`],
        filo:[`Servis kayıtları elimizde, bakımlıdır tabii.`,`Filoda hepsi böyle takip edilir.`],
        duygusal:[`Bak, anlıyorsun. Doğru adama gitsin diye bekliyordum.`,`Sağ ol. Ben de kıymet bilen birine vermek istiyorum zaten.`],
        koleksiyoncu:[`Adamına düştü. Bunu anlayan az kaldı.`,`Bunu duymak güzel. Herkes fiyata bakıyor, arabaya bakan yok.`]
      }[s.k]||[`Sağ ol.`];
      say("them", pick(rep));
    }else{
      n.hard+=.015;
      say("them", `Tabii ki güzel. O yüzden fiyatı da bu.`);
    }
  }

  else if(kind==="pesin"){
    if(n.pesinUsed) return; n.pesinUsed=true;
    say("you", `Peşin veriyorum, bugün noteri hallederiz. Beklemek yok.`);
    n.disc+=s.pesin; moodShift(6);
    const pr={
      acil:[`Nakit dedin de kulağım açıldı. Konuşalım.`,`Bugün biterse benim için de iyi olur.`],
      acemi:[`Bugün biterse ben de rahatlarım açıkçası.`,`Peşin olsun tabii, taksitle uğraşamam.`],
      filo:[`Muhasebe ay sonunu bekliyor ama peşin iyidir.`,`Peşin işlemi hızlandırır, orası doğru.`],
      duygusal:[`Para benim için ikinci mesele.`,`Acelem yok, doğru kişiyi bekliyorum.`],
      galerici:[`Peşin herkesin işine gelir usta, fiyat fiyattır.`,`Burada her müşteri peşin ödüyor zaten.`],
      koleksiyoncu:[`Bekleyecek halim var, merak etme.`,`Nakit her yerde var, bu araç her yerde yok.`]
    }[s.k]||[`Peşin iyidir.`];
    say("them", pick(pr));
  }

  else if(kind==="yuru"){
    if(n.walkUsed) return; n.walkUsed=true;
    say("you", `Bu fiyata olmuyor. Kusura bakma, ben kalkıyorum.`);
    const p=clamp(s.motiv+(50-n.mood)/300, .05, .92);
    if(chance(p)){
      n.disc+=.08; moodShift(-4);
      say("them", pick([
        `Dur dur, otur. Bir daha konuşalım şunu.`,
        `Tamam tamam, kapıdan çevirdim seni. Söyle rakamını.`,
        `Acelen ne? Anlaşabiliriz.`]));
    }else{
      n.pat-=2; n.hard+=.03;
      say("them", pick([
        `Yolun açık olsun. Bu araç burada bekler, alıcısı çıkar.`,
        `Buyur. Kapı orada.`,
        `Git bak bakalım, bu fiyata bulursan haber ver.`]));
    }
  }

  if(n.pat<=0) endNeg(c);
  save(); renderNeg();
  yuzTepki(n.mood<moodOnce-12 ? "yz-shake" : (n.mood>moodOnce+6 ? "yz-nod" : null));
}
function endNeg(c){
  const n=S.neg;
  say("them", "Sen bu işe hazır değilsin. Başkasına satarım.");
  n.done=true; n.counter=null; n.dead=true;   // araç, ekran kapanınca pazardan düşer
}

function doOffer(){
  const c=findCar(S.neg.carId), n=S.neg;
  const raw=document.getElementById("negInput").value.replace(/[^\d]/g,"");
  const offer=parseInt(raw||"0",10);
  if(!offer){ toast("Bir rakam yaz.","bad"); return; }
  if(offer>S.cash && !n.senet){
    toast(offer<=senetTavanNakit() ? "Nakdin yetmiyor — senetle ödemeyi aç."
                                   : "O kadar nakdin yok.","bad");
    return;
  }
  if(offer>senetTavanNakit()){ toast("Senetle bile yetmiyor.","bad"); return; }
  say("you", tl(offer));
  const er=negReserve();
  const r=sellerReply(c,offer,er);
  if(r.act==="accept"){
    say("them", pick(["Hayırlı olsun, anlaştık.","Tamam, senin olsun.","Bu fiyata verdim gitti.","El sıkıştık."]));
    n.done=true; n.counter=null;
    renderNeg();
    setTimeout(()=>{ if(buyCar(c,offer,null,n.senet)){ S.neg=null; closeSheet(); S.tab="garaj"; render(); } },600);
    return;
  }
  n.pat-=r.pat||0;
  if(r.act==="insult"){
    moodShift(-22);
    say("them", pick([
      `Ciddi misin? ${tl(r.price)} altına konuşmam bile.`,
      `Bu araca o para verilmez mi ya... En son ${tl(r.price)}.`,
      `Vaktimi alma usta. ${tl(r.price)}.`]));
  }else{
    moodShift(offer>=er*.94?5:-6);
    say("them", pick([
      `${tl(r.price)} olsun, elimi sıkalım.`,
      `Bak ${tl(r.price)} diyorum, altına inmem.`,
      `${tl(r.price)}. Bundan aşağısı yok.`]));
  }
  n.counter = r.price<=(n.senet?senetTavanNakit():S.cash) ? r.price : null;
  if(n.pat<=0) endNeg(c);
  save(); renderNeg();
  yuzTepki(r.act==="insult" ? "yz-shake" : (r.act==="accept" ? "yz-nod" : null));
}

function moveButtons(){
  const c=findCar(S.neg.carId), n=S.neg, s=c.seller;
  const b=[];
  n.known.forEach((l,i)=>{
    if(n.usedKoz.includes(i)) return;
    const dim=[1,.8,.6,.45,.35][Math.min(4,n.usedKoz.length)];
    b.push(`<button class="mv" data-act="move" data-k="koz" data-i="${i}">
      <b>${l.t}</b><span>Rapordan koz sun &middot; &minus;${yuzde(Math.round(l.cut*dim*1000)/10)}</span></button>`);
  });
  if(!n.ovguUsed) b.push(`<button class="mv" data-act="move" data-k="ovgu">
    <b>&Ouml;vg&uuml; / sohbet</b><span>Havayı yumuşat, ruh h&acirc;lini y&uuml;kselt</span></button>`);
  if(!n.pesinUsed) b.push(`<button class="mv" data-act="move" data-k="pesin">
    <b>Peşin nakit</b><span>Acelesi olanı yumuşatır</span></button>`);
  b.push(`<button class="mv risk" data-act="bloflist">
    <b>Bl&ouml;f at</b><span>Yakalanırsan pahalıya patlar</span></button>`);
  if(!n.walkUsed) b.push(`<button class="mv risk" data-act="move" data-k="yuru">
    <b>Kalkıp gitme</b><span>Tek kullanımlık &middot; tutmazsa 2 sabır</span></button>`);
  return b.join("");
}

function renderNeg(){
  const c=findCar(S.neg.carId), n=S.neg;
  const patMax=c.pat+(perk("dil")?1:0);
  // Müzik gerilimi sabırla ters: son hamleye yaklaşırken nabız sertleşir.
  try{ muzikKip("pazarlik", 1-clamp(n.pat/Math.max(1,patMax),0,1)); }catch(e){}
  const er=negReserve();
  const sonTeklif=[...n.log].reverse().find(m=>m.who==="you"&&/^-?₺/.test(m.t));
  const sonVal=sonTeklif?parseInt(sonTeklif.t.replace(/[^\d]/g,""),10):0;
  const payi=Math.round(Math.min(.34,n.disc)*100)-Math.round(n.hard*100);
  const lo=Math.min(sonVal||c.ask*0.75, c.ask*0.72), hi=c.ask;
  const p=v=>clamp((v-lo)/(hi-lo)*100,0,100);
  const start=n.counter||Math.round(c.ask*0.88/500)*500;
  const moves=moveButtons();

  /* ---- PAZARLIK SAHNESİ ----
     Oyunun dramatik zirvesi bir form gibi duruyordu: yüz kartı, iki bar,
     balonlar. Artık ekranın üst üçte biri bir MEKÂN: araç arkada duruyor,
     satıcının yüzü önde, istenen fiyat ekranın en büyük tipografisi.
     Aynı bilgi — ama oyuncu bir masaya oturmuş hissediyor. */
  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">Pazarlık</div>
        <div class="sheet-sub">${c.model.n} ${c.year}</div></div>
      <button class="x" data-act="close" aria-label="Kapat">&times;</button></div>

    <section class="sahne">
      <div class="sahne-arac">${aracGorsel(c,"tam")}</div>
      <div class="sahne-on">
        <div class="sahne-yuz">${yuzKart(c.seller.k, c.seller.n, c.seller.d, n.mood,
                  clamp(n.pat/Math.max(1,patMax),0,1), MOOD_LBL(n.mood), MOOD_COL(n.mood))}</div>
        <div class="sahne-fiyat">
          <span>İSTENEN</span>
          <b>${tl(c.ask)}</b>
          <i class="${payi>0?"pos":payi<0?"neg":""}">a&ccedil;tığın pay ${payi>0?"+":""}%${payi}</i>
        </div>
      </div>
    </section>

    <div class="block" style="padding:11px 12px">
      <div class="gauge">
        <div class="gwrap">
          <div class="glbl"><span>RUH H&Acirc;Lİ</span><span style="color:${MOOD_COL(n.mood)}">${MOOD_LBL(n.mood)}</span></div>
          <div class="gmeter"><i style="width:${n.mood}%;background:${MOOD_COL(n.mood)}"></i></div>
        </div>
        <div class="gwrap">
          <div class="glbl"><span>SABIR</span><span>${Math.max(0,n.pat)} / ${patMax}</span></div>
          <div class="gmeter"><i style="width:${clamp(n.pat/patMax*100,0,100)}%;background:${n.pat>1?"var(--sodium)":"var(--zarar)"}"></i></div>
        </div>
      </div>
      ${n.distrust?`<div class="sec-note" style="color:#F08B86;margin-top:8px">Sana g&uuml;venmiyor &mdash; kozların yarı etkili.</div>`:""}
    </div>

    <div class="talk" id="talkKutu">${n.log.map(m=>`<div class="bub ${m.who}">${m.t}</div>`).join("")}</div>

    ${n.done?`<button class="btn full" data-act="close">Kapat</button>`:`
      ${moves?`<div style="display:flex;justify-content:space-between;align-items:baseline;margin:4px 0 4px">
        <span class="sec-note" style="letter-spacing:.11em;text-transform:uppercase;font-size:10px">Hamleler</span>
        <span class="sec-note">${!c.inspected&&!n.known.length?"ekspertizsiz &mdash; sadece bl&ouml;f":""}</span></div>
        <div class="railwrap"><div class="moverail">${moves}</div></div>`:""}

      <div class="actionbar">
        <div class="ruler">
          <span class="line"></span>
          <span class="won" style="left:0;width:${clamp(payi*2,0,60)}%"></span>
          <span class="m" style="left:0;background:var(--sodium-dim)"></span>
          <span class="lab" style="left:0;top:2px;color:var(--muted-2)">a&ccedil;tığın pay</span>
          ${sonVal?`<span class="m" style="left:${p(sonVal)}%;background:var(--sodium)"></span>
            <span class="lab" style="left:${clamp(p(sonVal)-18,0,62)}%;top:26px;color:var(--sodium)">son teklifin ${tlk(sonVal)}</span>`:""}
          <span class="m" style="right:0;background:var(--plate)"></span>
          <span class="lab" style="right:0;top:2px;color:var(--plate)">istenen ${tlk(c.ask)}</span>
        </div>
        ${(c.ask>S.cash*0.92)?`<div class="senetsat">
          <span>Senetle &ouml;de<br><small>%50 peşin &middot; ${PARA.senetTaksit} taksit &middot; +%7
          &middot; tavan ${tlk(senetTavanNakit())}</small></span>
          ${swc("senetac", !!n.senet)}</div>`:""}
        ${n.counter?`<button class="btn primary full" data-act="acceptcounter">Kabul et &middot; ${tl(n.counter)}</button>`:""}
        <input class="offer-input" id="negInput" type="text" inputmode="numeric" value="${num(start)}">
        <div class="quick">
          <button data-act="q" data-p="-10">&minus;%10</button>
          <button data-act="q" data-p="-5">&minus;%5</button>
          <button data-act="q" data-p="5">+%5</button>
          <button data-act="q" data-p="10">+%10</button></div>
        <button class="btn ${n.counter?"":"primary"} full" data-act="offer">Teklif ver</button>
      </div>`}`);
}

function openBluffList(){
  const n=S.neg;
  const avail=BLUFFS.map((b,i)=>({b,i})).filter(x=>!n.bluffsUsed.includes(x.i));
  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">Blöf at</div>
      <div class="sheet-sub">Söylediğin doğru çıkarsa yalanlaması zor olur</div></div>
      <button class="x" data-act="backneg">×</button></div>
    <div class="block"><div class="help">
      <p>Satıcı ne kadar işini biliyorsa blöfü o kadar kolay yakalar. <strong>Acemi ve acelesi olan</strong> satıcıda tutar, <strong>galericide</strong> genelde tutmaz.</p>
      <p>Yakalanırsan iki sabır hakkı gider, fiyat sertleşir ve kalan kozların yarı etkiye düşer.</p></div></div>
    ${avail.map(x=>`<button class="mv" style="width:100%;margin-bottom:8px" data-act="move" data-k="blof" data-i="${x.i}">
        <b>${x.b.t}</b><span>Tutarsa fiyattan &minus;%${Math.round(x.b.cut*100)}</span></button>`).join("")
      ||`<div class="empty">Kullanılmamış blöf kalmadı.</div>`}
    <button class="btn ghost full" data-act="backneg" style="margin-top:10px">Vazgeç</button>`);
}

/* ---- gün raporu ---- */
function offerCard(o){
  const c=S.cars.find(x=>x.id===o.carId); if(!c) return "";
  const cost=carCost(c);
  const p=o.amount-cost;
  const note = o.caught
    ? `<div class="sec-note" style="color:#F08B86;margin-top:5px">Ekspertize g&ouml;t&uuml;rd&uuml;: "${o.issues[0].t}". Teklifini kırdı.</div>`
    : (o.inspects?`<div class="sec-note" style="margin-top:5px">Ekspertize g&ouml;t&uuml;rd&uuml;, temiz &ccedil;ıktı.</div>`:"");
  let extra="";
  if(o.takas){
    const t=o.takas;
    extra=`<div class="block" style="margin:11px 0 0;background:var(--asphalt-3)">
      <h4>TAKAS TEKLİFİ</h4>
      <div class="card-body" style="padding:0 0 8px">
        <div class="thumb">${aracGorsel(t.car,"mini")}</div>
        <div class="card-main">
          <div class="card-title">${t.car.model.n} <span style="color:var(--muted)">${t.car.year}</span></div>
          <div class="card-sub">${mesafe(t.car.km)} &middot; ${t.car.gear} &middot; ${t.car.fuel}</div>
        </div>
      </div>
      <div class="kv"><span>Aracına bi&ccedil;tiği değer</span><b>${tl(t.claim)}</b></div>
      <div class="kv"><span>&Uuml;st&uuml;ne vereceği nakit</span><b style="color:var(--sodium)">${tl(t.cash)}</b></div>
      <div class="sec-note" style="margin-top:6px">Ekspertizsiz devralırsın. Park yerin ${Math.max(0,S.slots-S.cars.length)} boş.</div>
    </div>`;
  }else if(o.taksit){
    const k=o.taksit, kp=k.total-cost;
    extra=`<div class="block" style="margin:11px 0 0;background:var(--asphalt-3)">
      <h4>TAKSİT TEKLİFİ</h4>
      <div class="kv"><span>Toplam</span><b style="color:var(--sodium)">${tl(k.total)}</b></div>
      <div class="kv"><span>Peşinat (bug&uuml;n)</span><b>${tl(k.down)}</b></div>
      <div class="kv"><span>Kalan</span><b>${k.parts} taksit &middot; ${tl(Math.round((k.total-k.down)/k.parts))}</b></div>
      <div class="kv"><span>&Ouml;dememe riski</span><b class="${k.risk>.12?"neg":""}">%${Math.round(k.risk*100)}</b></div>
      <div class="sec-note" style="margin-top:6px">Taksitli k&acirc;r ${tlk(kp)} &mdash; nakitte ${tlk(p)}.</div>
    </div>`;
  }

  const kalan=o.expires-S.day;
  const actions=`
    <button class="btn ghost full" data-act="carfile" data-id="${c.id}" style="margin-top:11px">
      Ara&ccedil; dosyasını a&ccedil;
    </button>
    <div class="btn-row" style="margin-top:8px">
      <button class="btn primary" data-act="salenego" data-oid="${o.oid}">Pazarlık et</button>
      ${o.takas?`<button class="btn" data-act="taketakas" data-oid="${o.oid}" ${S.cars.length>=S.slots?"disabled":""}>Takası al</button>`
       :o.taksit?`<button class="btn" data-act="taketaksit" data-oid="${o.oid}">Taksitle sat</button>`
       :`<button class="btn" data-act="takeoffer" data-oid="${o.oid}">Kabul et</button>`}
    </div>
    <div class="btn-row" style="margin-top:8px">
      ${(o.takas||o.taksit)?`<button class="btn ghost" data-act="onlycash" data-oid="${o.oid}">Nakit ısrar et</button>`:""}
      <button class="btn ghost" data-act="dropoffer" data-oid="${o.oid}">Reddet</button>
    </div>`;

  return `<div class="offercard ${p>0?"hot":""}">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
      <div style="min-width:0">
        <b style="font-size:14px">${c.model.n} ${c.year}</b>
        <div style="margin-top:5px">${o.type?`<span class="chip">${o.type.n}</span>`:""}
          <span class="chip ${kalan<=0?"warn":""}">${kalan<=0?"bug&uuml;n son g&uuml;n":kalan+" g&uuml;n ge&ccedil;erli"}</span></div>
      </div>
    </div>
    <div class="pricerow" style="margin:11px 0 0">
      <span class="plabel">Gelen teklif</span>
      <span class="pval" style="color:var(--sodium)">${tl(o.amount)}</span>
    </div>
    <div class="sec-note" style="display:flex;justify-content:space-between;margin-top:4px">
      <span>İlan ${tlk(c.listPrice)} &middot; maliyet ${tlk(cost)}</span>
      <span class="${p>=0?'pos':'neg'}">${p>=0?"+":""}${tl(p)}</span></div>
    ${o.type?`<div class="quote" style="margin:10px 0 0;font-size:12.5px">"${o.type.line}"</div>`:""}
    ${note}${extra}${actions}</div>`;
}

/* ==================================================================
   GÜN RAPORU — tek sayfa
   Önceden iki adımdı: önce giderler, sonra teklifler. Oyuncu her gün iki
   kez düğmeye basıyordu ve teklifi görmek için özeti geçmek zorundaydı.
   Artık tek kaydırma: ne kaybettim, ne oldu, kim teklif verdi.
   ================================================================== */
function openReport(){
  const r=S.report;
  const ofs=reportOffers();
  if(r.season && !r.seasonSeen){ openSeasonSummary(); return; }
  if(S.karne){ openKarne(); return; }

  const gelir=r.costs.filter(([,v])=>v<0);
  const gider=r.costs.filter(([,v])=>v>0);
  const netGider=r.total;
  // Teklif getiren olaylar rapordan doğrudan kendi sayfasına açılıyor:
  // raporu kapatıp Pazar'da kartı aramak bir adım fazlaydı.
  const git={parti:S.parti?["partiac","Partiye bak"]:null, emanet:S.konsTeklif?["konsac","Teklife bak"]:null};
  const olay=r.events.map(e=>{
    const g=(e.parti&&git.parti)||(e.emanet&&git.emanet);
    return `<div class="olaysat ${e.bad?"kotu":""}">${e.t}${g?`<button class="olaygit" data-act="${g[0]}">${g[1]} &rsaquo;</button>`:""}</div>`;
  }).join("");

  const ozet=`<div class="raporozet">
    <div class="ro">
      <span>Teklif</span>
      <b style="color:${ofs.length?"var(--tint)":"var(--label-3)"}">${ofs.length}</b></div>
    <div class="ro"><span>G&uuml;n&uuml;n gideri</span>
      <b class="${netGider>0?"neg":"pos"}">${netGider>0?"&minus;":"+"}${tlk(Math.abs(netGider))}</b></div>
    <div class="ro"><span>Kasa</span><b>${tlk(S.cash)}</b></div>
  </div>`;

  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">${r.day}. g&uuml;n kapandı</div>
        <div class="sheet-sub">${ofs.length?`${ofs.length} teklif var`:"Teklif gelmedi"}</div></div>
      <button class="x" data-act="closereport" aria-label="Kapat">&times;</button></div>

    ${ozet}

    ${ofs.length?`<div class="sec-head" style="margin:4px 2px 2px"><h2 class="sec" style="font-size:19px">Gelen teklifler</h2></div>
      ${ofs.map(o=>offerCard(o)).join("")}`
     :`<div class="empty">Bug&uuml;n ilanlarına teklif gelmedi.
        <div class="sec-note" style="margin-top:6px">Fiyatı kırmak alıcı akışını belirgin artırıyor.</div>
        <div class="bosbtn"><button class="btn" data-act="closereportgaraj">Satıştakileri a&ccedil;</button></div></div>`}

    ${olay?`<div class="block"><h4>BUG&Uuml;N NE OLDU</h4>${olay}</div>`:""}

    ${r.costs.length?`<details class="kasafold" ${ofs.length?"":"open"}>
      <summary><span>Kasa hareketi</span>
        <b class="${netGider>0?"neg":"pos"}">${netGider>0?"&minus;":"+"}${tl(Math.abs(netGider))}</b></summary>
      <div class="kasagov">
        ${gelir.map(([k,v])=>`<div class="kv"><span>${k}</span><b class="pos">+${tl(-v)}</b></div>`).join("")}
        ${gider.map(([k,v])=>`<div class="kv"><span>${k}</span><b class="neg">&minus;${tl(v)}</b></div>`).join("")}
        <div class="kv" style="border-top:.5px solid var(--sep);margin-top:4px;padding-top:8px">
          <span style="color:var(--label)">Net</span>
          <b class="${netGider>0?"neg":"pos"}">${netGider>0?"&minus;":"+"}${tl(Math.abs(netGider))}</b></div>
      </div></details>`:""}

    <button class="btn ${ofs.length?"ghost":"primary"} full" data-act="closereport"
      style="margin-top:10px">Kapat</button>`, "belge");
}

/* ---- sezon özeti ---- */
function openSeasonSummary(){
  const r=S.report, s=r.season, sez=seasonOf(S.day);
  const kira=r.costs.find(x=>/kirası/.test(x[0]));
  const vergi=r.costs.find(x=>/vergi/.test(x[0]));
  const st=standings();
  const rank=st.findIndex(x=>x.me)+1;
  const delta=(S.lastRank||rank)-rank;
  S.lastRank=rank;
  const segs=[["klasik","Klasik"],["ticari","Ticari"],["sedan","Sedan"],["suv","SUV"],["hatch","Hatch"]];
  const fc=segs.map(([k,l])=>{
    const m=Math.round((sez.m[k]-1)*100);
    return `<span><b class="${m>4?"pos":m<-4?"neg":""}">${m>=0?"+":""}%${m}</b>${l}</span>`;
  }).join("");
  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">Sezon kapanışı</div>
        <div class="sheet-sub">${r.day}. g&uuml;n</div></div>
      <button class="x" data-act="seasondone" aria-label="Kapat">&times;</button></div>
    <div class="crest">
      <div class="sn" style="color:var(--muted)">${s.from}</div>
      <div class="arrow">bitti &middot; sıradaki</div>
      <div class="sn" style="color:var(--sodium)">${s.to}</div>
    </div>
    <div class="block"><h4>SEZON K&Acirc;R&ndash;ZARAR</h4>
      <div class="kv"><span>${S.seasonSales||0} satış</span><b class="pos">+${tl(S.seasonGross||0)}</b></div>
      ${kira?`<div class="kv"><span>D&uuml;kk&acirc;n kirası</span><b class="neg">&minus;${tl(kira[1])}</b></div>`:""}
      ${vergi?`<div class="kv"><span>Vergi (%8)</span><b class="neg">&minus;${tl(vergi[1])}</b></div>`:""}
      <div class="kv" style="border-top:1px solid var(--line);margin-top:4px;padding-top:9px">
        <span style="color:var(--text)">Sezon sonucu</span>
        <b class="${(S.seasonGross||0)-((kira?kira[1]:0)+(vergi?vergi[1]:0))>=0?"pos":"neg"}" style="font-size:17px">
          ${((S.seasonGross||0)-((kira?kira[1]:0)+(vergi?vergi[1]:0)))>=0?"+":""}${tl((S.seasonGross||0)-((kira?kira[1]:0)+(vergi?vergi[1]:0)))}</b></div>
    </div>
    <div class="block"><h4>PİYASADAKİ GALERİLER</h4>
      ${st.map((x,i)=>`<div class="rankrow">
        <span class="${x.me?"":""}" style="${x.me?"color:var(--sodium);font-weight:600":""}">${i+1}. ${x.n}
        ${x.me&&delta?`<span class="${delta>0?"pos":"neg"}" style="font-size:11px"> ${delta>0?"&#9650;":"&#9660;"} ${Math.abs(delta)} sıra</span>`:""}</span>
        <b class="mono" style="${x.me?"color:var(--sodium)":""}">${tlk(x.w)}</b></div>`).join("")}
    </div>
    <div class="block"><h4>${s.to.toLocaleUpperCase("tr")}${/[şçkptfhs]$/i.test(s.to)?"TA":"DA"} NE ARANACAK</h4>
      <div class="sec-note">${sez.d}</div>
      <div class="fc">${fc}</div>
    </div>
    <button class="btn primary full" data-act="seasondone">${s.to}a başla</button>`);
}



/* ================= araç dosyası ================= */
function openCarFile(carId, geri){
  const c=S.cars.find(x=>x.id===+carId); if(!c) return;
  S.fileBack=geri||S.fileBack||null;
  const cost=carCost(c);
  const tv=valueOf(c,false), av=valueOf(c,true);
  const bugun=c.inspected?tv:av;
  const tamirler=c.faults.filter(f=>f.fixed);
  const acik=c.faults.filter(f=>!f.fixed && known(c,f));
  const gizliVar=hiddenIssues(c).length>0;
  const ekstralar=(c.extras||[]);
  const otopark=c.daysListed*400;
  const o=offerOf(c.id);

  const comps=compsOf(c, !c.inspected);
  const gorunen=compsOf(c,true), gercek=compsOf(c,false);

  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">Ara&ccedil; dosyası</div>
        <div class="sheet-sub">${adBol(c.model.n).ad} ${c.year} &middot; ${mesafe(c.km)}</div>
        <div style="margin-top:7px">${plateHtml(c.plate)}</div></div>
      <button class="x" data-act="filedone" aria-label="Kapat">&times;</button></div>

    ${atolyeBlok(c,"repairfile")}

    ${o?`<div class="block" style="border-color:rgba(242,160,7,.4)">
      <h4>BEKLEYEN TEKLİF</h4>
      <div class="pricerow" style="margin-bottom:6px">
        <span class="plabel">${o.type?o.type.n:"Alıcı"}</span>
        <span class="pval" style="color:var(--sodium)">${tl(o.amount)}</span></div>
      <div class="sec-note">Maliyetine g&ouml;re <b class="${o.amount-cost>=0?"pos":"neg"}">${o.amount-cost>=0?"+":""}${tl(o.amount-cost)}</b>
        &middot; ${o.expires-S.day<=0?"bug&uuml;n son g&uuml;n":(o.expires-S.day)+" g&uuml;n ge&ccedil;erli"}</div>
    </div>`:""}

    <div class="block"><h4>ALIŞ</h4>
      <div class="kv"><span>Alındığı g&uuml;n</span><b>${c.boughtDay||"—"}. g&uuml;n</b></div>
      <div class="kv"><span>Kimden</span><b>${c.boughtFrom||"—"}</b></div>
      <div class="kv"><span>Nasıl</span><b>${c.boughtVia||"pazarlık"}</b></div>
      <div class="kv"><span>&Ouml;denen</span><b>${tl(c.boughtFor)}</b></div>
      ${c.askedAt?`<div class="kv"><span>İstenen fiyat</span><b>${tl(c.askedAt)}</b></div>
      <div class="kv"><span>${c.askedAt>=c.boughtFor?"Pazarlıkta indirdiğin":"Fazladan &ouml;dediğin"}</span>
        <b class="${c.askedAt>=c.boughtFor?"pos":"neg"}">${tl(Math.abs(c.askedAt-c.boughtFor))}
        <span style="color:var(--muted-2);font-weight:400"> (%${Math.abs(Math.round((c.askedAt-c.boughtFor)/c.askedAt*100))})</span></b></div>`:""}
    </div>

    <div class="block muhurlu"><h4>EKSPERTİZ RAPORU</h4>
      ${c.inspected?`${muhurCiz(c)}
        ${COMPKEYS.map(k=>{
          const v=gercek[k];
          const col=v>72?"var(--kar)":v>45?"var(--sodium)":"var(--zarar)";
          return `<div class="bar-row"><span class="lbl">${COMPLBL[k]}</span>
            <span class="bar"><i style="width:${v}%;background:${col}"></i></span>
            <span class="val">${v}</span></div>`;}).join("")}
        <div class="rule" style="margin:10px 0"></div>
        <div class="kv"><span>Tramer kaydı</span><b class="${c.tramer?"neg":"pos"}">${c.tramer?tl(c.tramer):"Yok"}</b></div>
        <div class="kv"><span>Değişen par&ccedil;a</span><b class="${c.degisen?"neg":""}">${c.degisen}</b></div>
        <div class="kv"><span>Boyalı par&ccedil;a</span><b class="${c.boyali>2?"neg":""}">${c.boyali}</b></div>
        <div class="kv"><span>Km tutarlılığı</span><b class="${c.kmOynama?"neg":"pos"}">${c.kmOynama?"Ş&uuml;pheli":"Tutarlı"}</b></div>`
      :`<div class="sec-note">Bu ara&ccedil; ekspertize verilmedi. Kaputun altı hakkında elinde kayıt yok.</div>
        <button class="btn full" data-act="eksper" data-id="${c.id}" style="margin-top:9px" ${S.cash<eksperFiyat()?"disabled":""}>
          Şimdi ekspertize ver &middot; ${tl(eksperFiyat())}</button>`}
    </div>

    <div class="block"><h4>YAPILAN TAMİRLER</h4>
      ${tamirler.length?tamirler.map(f=>`<div class="kv">
        <span>${f.n}<br><small style="color:var(--muted-2)">${COMPLBL[f.comp]}</small></span>
        <b class="neg">−${tl(repairCost(f))}</b></div>`).join("")
        :`<div class="sec-note">Hi&ccedil; tamir yaptırılmadı.</div>`}
      ${c.cosmetic?`<div class="kv"><span>Pasta cila + detaylı temizlik</span><b class="neg">−${tl(350)}</b></div>`:""}
      ${ekstralar.length?ekstralar.map(k=>{const e=SALE_EXTRAS.find(x=>x.k===k);
        return `<div class="kv"><span>${e.n}<br><small style="color:var(--muted-2)">satışta verildi</small></span>
        <b class="neg">−${tl(e.cost)}</b></div>`;}).join(""):""}
      ${c.spent?`<div class="kv" style="border-top:1px solid var(--line);margin-top:4px;padding-top:8px">
        <span style="color:var(--text)">Toplam tamir ve ekstra</span><b class="neg">−${tl(c.spent)}</b></div>`:""}
    </div>

    <div class="block"><h4>İLAN GE&Ccedil;MİŞİ</h4>
      <div class="kv"><span>İlan fiyatı</span><b>${c.listPrice?tl(c.listPrice):"İlanda değil"}</b></div>
      <div class="kv"><span>İlanda ge&ccedil;en g&uuml;n</span><b>${c.daysListed}</b></div>
      <div class="kv"><span>Gelen alıcı</span><b>${c.leadsSeen||0}</b></div>
      <div class="kv"><span>Fiyat kırma</span><b>${c.priceCuts||0} kez</b></div>
      <div class="kv"><span>İlanda kusur</span>
        <b class="${gizliVar&&!c.disclosed?"neg":"pos"}">${c.disclosed?"A&ccedil;ıklandı":(gizliVar?"Gizlendi":"Kusur yok")}</b></div>
      <div class="kv"><span>Rakip ilanı (aynı segment)</span><b class="${rivalPressure(c.model.seg)?"neg":""}">${rivalPressure(c.model.seg)}</b></div>
    </div>

    <div class="block" style="border-color:var(--sodium-dim)"><h4>HESAP</h4>
      <div class="kv"><span>Alış</span><b>${tl(c.boughtFor)}</b></div>
      <div class="kv"><span>Tamir ve ekstra</span><b>${tl(c.spent)}</b></div>
      <div class="kv"><span>Ekspertiz</span><b>${tl(c.inspected?PARA.ekspertiz:0)}</b></div>
      <div class="kv"><span>Otopark (${c.daysListed} g&uuml;n)</span><b>${tl(otopark)}</b></div>
      <div class="kv" style="border-top:1px solid var(--line);margin-top:4px;padding-top:8px">
        <span style="color:var(--text)">Toplam maliyet</span><b style="font-size:15px">${tl(cost)}</b></div>
      <div class="kv"><span>Bug&uuml;nk&uuml; değer</span>
        <b style="color:var(--sodium)">${c.inspected?tl(tv):tlk(av*.86)+" – "+tlk(av*1.06)}</b></div>
      <div class="kv"><span>Başabaş i&ccedil;in gereken</span>
        <b class="${bugun>=cost?"pos":"neg"}">${tl(cost)} &middot; ${bugun>=cost?"değerin altında":"değerin &uuml;st&uuml;nde"}</b></div>
    </div>

    <div class="actionbar">
      <button class="btn primary full" data-act="filedone">${o?"Teklife d&ouml;n":"Kapat"}</button>
    </div>`, "belge");
}

/* ================= satış pazarlığı ================= */
function openSaleNeg(oid){
  const o=getOffer(oid); if(!o) return;
  const car=S.cars.find(x=>x.id===o.carId);
  if(!car) return;
  if(!S.sale || S.sale.carId!==car.id){
    const bt=o.type||BUYERS[0];
    const list=car.listPrice||valueOf(car,false);
    S.sale={
      carId:car.id, oid:o.oid, bt, base:o.amount, list,
      lifts:0, extras:[], usedKoz:[], taksit:null, takas:o.takas||null,
      guven: Math.round(clamp(40+(S.rep-50)*.5+(car.disclosed?12:0)+((o.inspects&&!o.caught)?10:0), 10, 92)),
      ilgi:  Math.round(clamp(62+(S.rep-50)*.3+((o.inspects&&!o.caught)?10:0)-(bt.k==="galerici"?14:0), 20, 95)),
      tur:0, sabir:bt.sat.sabir, aciliyetUsed:false, ekspertizUsed:false, taksitUsed:false, sonUsed:false,
      kozlar:saleLeverage(car, S.rep, S.day),
      log:[{who:"them", t:`${bt.line} ${tl(o.amount)} veriyorum.`}],
      counter:null, done:false, sonuc:null
    };
  }
  renderSaleNeg();
}
function saleSay(who,t){ S.sale.log.push({who,t}); }
/** Aynı cümleyi üst üste söyletmeyen seçici. */
function sPick(arr){
  const son=[...S.sale.log].reverse().find(m=>m.who==="them");
  const uygun=arr.filter(t=>!son||t!==son.t);
  return pick(uygun.length?uygun:arr);
}
function saleShift(guven,ilgi){
  S.sale.guven=clamp(S.sale.guven+guven,0,100);
  S.sale.ilgi=clamp(S.sale.ilgi+ilgi,0,100);
}
function saleWalk(msg){
  const s=S.sale;
  saleSay("them", msg);
  s.done=true; s.counter=null; s.sonuc="kacti";
}

/* --- satış hamleleri --- */
function doSaleMove(kind, idx){
  const s=S.sale, car=S.cars.find(x=>x.id===s.carId), bt=s.bt;
  if(!s||s.done) return;
  const guvenOnce=s.guven;
  s.tur++;

  if(kind==="koz"){
    const k=s.kozlar[+idx]; if(!k||s.usedKoz.includes(+idx)) return;
    s.usedKoz.push(+idx);
    const dim=[1,.85,.7,.55,.45][Math.min(4,s.usedKoz.length-1)];
    s.lifts+=k.lift*dim*bt.sat.ikna;
    saleShift(Math.round(k.guven*dim*bt.sat.ikna), -2);
    saleSay("you", `${k.t}. ${k.d}.`);
    saleSay("them", sPick([
      `Onu ben de fark ettim, doğru.`,
      `Tamam, bu kıymetli. Ama fiyat da fiyat.`,
      `İyi ki s&ouml;yledin, bu benim i&ccedil;in &ouml;nemliydi.`,
      `Bunu duymak iyi oldu.`,
      `Hı hı. Not aldım.`]));
  }

  else if(kind==="aciliyet"){
    if(s.aciliyetUsed) return; s.aciliyetUsed=true;
    saleSay("you", `A&ccedil;ık konuşayım: bu ara&ccedil; i&ccedil;in başka bir alıcı daha var, yarın bakmaya geliyor.`);
    const yakalar=clamp(bt.sat.savvy*(1-(s.guven-45)/300), .05, .95);
    if(chance(yakalar)){
      saleShift(-26, -Math.round(bt.sat.kacma*90));
      s.lifts-=.04;
      saleSay("them", sPick([
        `Herkes b&ouml;yle diyor. İlan iki g&uuml;nd&uuml;r duruyor, ben de takip ediyorum.`,
        `Varsa ona sat o zaman. Beni sıkıştırma.`,
        `Bu numarayı bana yapma usta.`]));
    }else{
      saleShift(2, 14); s.lifts+=.045;
      saleSay("them", sPick([
        `Ya sabret, ben geldim buraya kadar. Bir rakam s&ouml;yle.`,
        `Kaptırmak istemem, konuşalım.`,
        `Peki, ciddiyim ben de. Ne diyorsun?`]));
    }
  }

  else if(kind==="ekstra"){
    const e=SALE_EXTRAS[+idx];
    if(!e || s.extras.includes(e.k)) return;
    if(S.cash<e.cost){ toast("Nakit yetmiyor.","bad"); s.tur--; return; }
    s.extras.push(e.k);
    car.extras=(car.extras||[]).concat([e.k]);
    S.cash-=e.cost; car.spent+=e.cost;
    s.lifts+=e.lift*bt.sat.ikna;
    saleShift(Math.round(e.guven*bt.sat.ikna), 4);
    saleSay("you", `${e.n} benden. ${e.d}.`);
    saleSay("them", sPick([
      `Bu iyi oldu, hesaba katarım.`,
      `Eyvallah, bu ayrı bir jest.`,
      `Tamam, o zaman fiyatı bir daha konuşalım.`]));
  }

  else if(kind==="ekspertiz"){
    if(s.ekspertizUsed) return; s.ekspertizUsed=true;
    saleSay("you", `İstersen kendi ustana g&ouml;t&uuml;r, ekspertize sok. Ben arkasındayım.`);
    const gizli=!car.disclosed && hiddenIssues(car).length>0;
    if(gizli){
      const iss=hiddenIssues(car);
      S.rep=clamp(S.rep-6,0,100); S.stats.caught++;
      s.lifts-=.10;
      saleShift(-45,-100);
      saleWalk(`G&ouml;t&uuml;rd&uuml;m. "${iss[0].t}" &ccedil;ıktı. Sen bunu bilmiyor muydun? İyi g&uuml;nler.`);
      toast("Yakalandın — itibar −6.","bad");
      save(); renderSaleNeg(); return;
    }
    s.lifts+=.065*bt.sat.ikna;
    saleShift(Math.round(20*bt.sat.ikna), 8);
    saleSay("them", sPick([
      `Bu s&ouml;z&uuml; duyunca rahatladım a&ccedil;ık&ccedil;ası.`,
      `Baktırdım zaten, temiz &ccedil;ıktı. G&uuml;venim geldi.`,
      `Adam gibi konuştun. Devam edelim.`]));
  }

  else if(kind==="taksit"){
    if(s.taksitUsed) return; s.taksitUsed=true;
    const risk = bt.k==="genc"?.17:(bt.k==="esnaf"?.10:.06);
    s.taksit={parts:2, gap:4, risk};
    s.lifts+=.10;
    saleShift(6, 10);
    saleSay("you", `Peşinat %40, kalanı iki taksitte senede bağlarız. B&ouml;ylece rakam biraz yukarı &ccedil;ıkabilir.`);
    saleSay("them", bt.sat.butce<1
      ? pick([`İşte şimdi konuşulur. B&uuml;t&ccedil;em rahatlar.`,`Peşin zorluyordu beni, b&ouml;yle olur.`])
      : pick([`Gerek yok aslında ama d&uuml;ş&uuml;n&uuml;r&uuml;m.`,`Nakit veririm ben, yine de bakalım.`]));
  }

  else if(kind==="son"){
    if(s.sonUsed) return; s.sonUsed=true;
    const fiyat=s.counter||s.list;
    saleSay("you", `${tl(fiyat)}. Son fiyatım, aşağısı yok.`);
    const tavan=buyerCeiling(s);
    if(fiyat<=tavan*1.03){
      saleSay("them", sPick([`Peki. Anlaştık.`,`Tamam, alıyorum.`,`El sıkıştık o zaman.`]));
      finishSale(fiyat);
      return;
    }
    saleShift(-8, -Math.round(bt.sat.kacma*115));
    saleSay("them", sPick([
      `O zaman olmadı. Ben biraz daha bakayım.`,
      `Bu rakama bende karşılığı yok.`,
      `Peki, kusura bakma.`]));
  }

  if(s.ilgi<=0 && !s.done) saleWalk(pick([
    "Ben biraz daha bakayım, sağ ol.",
    "Bu iş olmayacak galiba. İyi g&uuml;nler.",
    "Kusura bakma, vazge&ccedil;tim."]));
  save(); renderSaleNeg();
  yuzTepki(s.guven<guvenOnce-8 ? "yz-shake" : (s.guven>guvenOnce+5 ? "yz-nod" : null));
}

function doSaleOffer(){
  const s=S.sale;
  const raw=document.getElementById("saleInput").value.replace(/[^\d]/g,"");
  const price=parseInt(raw||"0",10);
  if(!price){ toast("Bir rakam yaz.","bad"); return; }
  s.tur++;
  saleSay("you", tl(price));
  const r=saleReply(s, price);
  if(r.act==="accept"){
    saleSay("them", sPick(["Hayırlı olsun, aldım.","Tamam, anlaştık.","Bu fiyata alıyorum."]));
    finishSale(price);
    return;
  }
  saleShift(r.act==="offended"?-10:-3, -(r.drop||0));
  s.counter=r.price;
  if(r.act==="offended"){
    saleSay("them", sPick([
      `O rakam &ccedil;ok y&uuml;ksek. Benim verebileceğim en fazla ${tl(r.price)}.`,
      `Bu fiyata sıfırına yakınını bulurum. ${tl(r.price)} diyorum.`,
      `Ciddi misin? ${tl(r.price)}, fazlası yok.`]));
  }else{
    saleSay("them", sPick([
      `${tl(r.price)} olsun, kapatalım.`,
      `${tl(r.price)} verebilirim, daha fazlası zor.`,
      `Bak ${tl(r.price)} diyorum, ortada buluşalım.`]));
  }
  if(s.ilgi<=0) saleWalk(pick([
    "Olmadı. Başka bakarım ben.",
    "Vaktini aldım, kusura bakma.",
    "Bu fiyatlarla anlaşamayız."]));
  save(); renderSaleNeg();
}

function finishSale(price){
  const s=S.sale, car=S.cars.find(x=>x.id===s.carId);
  s.done=true; s.counter=null; s.sonuc="satildi"; s.finalPrice=price;
  save(); renderSaleNeg();
  setTimeout(()=>{
    if(s.takas){
      const t=s.takas;
      if(S.cars.length>=S.slots){ toast("Park yerin dolu — takas alınamadı, nakde d&ouml;n&uuml;ld&uuml;.","bad"); }
      else{
        sellCar(car, price, `takaslı &middot; ${t.car.model.n}`);
        S.cash-=t.claim;
        t.car.owned=true; t.car.boughtFor=t.claim; t.car.seller=null; t.car.ask=null;
        t.car.boughtFrom="Takas"; t.car.boughtVia="takas"; t.car.priceCuts=0; t.car.extras=[];
        t.car.boughtDay=S.day; t.car.daysListed=0; t.car.leadsSeen=0;
        S.cars.push(t.car);
        finishSaleAfter(); return;
      }
    }
    if(s.taksit){
      const k=s.taksit, saleId=Date.now()+Math.random();
      const down=Math.round(price*.4/500)*500;
      const parca=Math.round((price-down)/k.parts/500)*500;
      for(let i=1;i<=k.parts;i++){
        S.receivables.push({saleId, due:S.day+k.gap*i, amount:parca, left:k.parts-i+1,
          risk:k.risk, who:s.bt.n, n:`${car.model.n} ${car.year}`});
      }
      sellCar(car, down, `taksitli &middot; ${tl(price)}`);
      finishSaleAfter(); return;
    }
    sellCar(car, price, s.extras.length?`${s.extras.length} ekstra ile`:"");
    finishSaleAfter();
  }, 750);
}
function finishSaleAfter(){
  dropOffer(S.sale.oid);
  S.sale=null; save(); render();
  if(S.lastDeal) openDealSummary(S.lastDeal); else closeSheet();
}

function saleMoveButtons(){
  const s=S.sale, car=S.cars.find(x=>x.id===s.carId), bt=s.bt;
  const b=[];
  s.kozlar.forEach((k,i)=>{
    if(s.usedKoz.includes(i)) return;
    b.push(`<button class="mv" data-act="salemove" data-k="koz" data-i="${i}">
      <b>${k.t}</b><span>${k.d}</span></button>`);
  });
  if(!s.ekspertizUsed) b.push(`<button class="mv" data-act="salemove" data-k="ekspertiz">
    <b>Ekspertize yolla</b><span>"Kendi ustana g&ouml;t&uuml;r" &middot; g&uuml;ven kazandırır, gizlin varsa yakar</span></button>`);
  if(!s.aciliyetUsed) b.push(`<button class="mv risk" data-act="salemove" data-k="aciliyet">
    <b>Başka alıcı var</b><span>Aciliyet yarat &middot; yutmazsa ilgisi d&uuml;şer</span></button>`);
  b.push(`<button class="mv" data-act="extralist">
    <b>&Uuml;st&uuml;ne ekstra koy</b><span>Lastik, bakım, noter &mdash; cebinden &ccedil;ıkar ama tavanı y&uuml;kseltir</span></button>`);
  if(!s.taksitUsed && !s.takas) b.push(`<button class="mv" data-act="salemove" data-k="taksit">
    <b>Taksit &ouml;ner</b><span>Toplam y&uuml;kselir, tahsilat riski doğar</span></button>`);
  if(!s.sonUsed) b.push(`<button class="mv risk" data-act="salemove" data-k="son">
    <b>Son fiyat de</b><span>Tek kullanımlık &middot; tutmazsa alıcı gider</span></button>`);
  return b.join("");
}

function renderSaleNeg(){
  const s=S.sale, car=S.cars.find(x=>x.id===s.carId);
  const cost=car.boughtFor+car.spent+(car.inspected?PARA.ekspertiz:0)+car.daysListed*PARA.otoparkGun;
  const gunluk=PARA.otoparkGun+(S.staff.eksper?PARA.maasEksper:0)/Math.max(1,S.cars.length);
  const lo=Math.min(s.base,cost)*0.96, hi=Math.max(s.list,s.base)*1.04;
  const p=v=>clamp((v-lo)/(hi-lo)*100,0,100);
  const start=s.counter||s.list;
  const moves=saleMoveButtons();
  const kar=(s.counter||s.list)-cost;

  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">Satış pazarlığı</div>
        <div class="sheet-sub">${car.model.n} ${car.year} &middot; ilan ${tl(s.list)}</div>
        <button class="chip" data-act="carfile" data-id="${car.id}" data-back="sale"
          style="margin-top:8px;padding:5px 10px">Ara&ccedil; dosyasını a&ccedil;</button></div>
      <button class="x" data-act="saleclose" aria-label="Kapat">&times;</button></div>

    <div class="block" style="padding:11px 12px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:11px">
        ${yuzKart(s.bt.k, s.bt.n,
          `A&ccedil;ılış teklifi ${tl(s.base)}${s.takas?" &middot; takaslı":""}${s.taksit?" &middot; taksitli":""}`,
          clamp(s.guven,0,100), clamp(s.ilgi/100,0,1),
          s.ilgi>55?"İlgili":s.ilgi>25?"Kararsız":"Kapıya yakın",
          s.guven>62?"var(--kar)":s.guven>35?"var(--sodium)":"var(--zarar)")}
        <div style="text-align:right;flex:none">
          <div class="sec-note" style="font-size:9.5px">ELİNDE TUTMA</div>
          <b class="mono neg" style="font-size:13px">${tl(Math.round(gunluk))}/g&uuml;n</b></div>
      </div>
      <div class="gauge">
        <div class="gwrap">
          <div class="glbl"><span>G&Uuml;VEN</span><span style="color:${s.guven>62?"var(--kar)":s.guven>35?"var(--sodium)":"var(--zarar)"}">${s.guven>62?"Y&uuml;ksek":s.guven>35?"Orta":"D&uuml;ş&uuml;k"}</span></div>
          <div class="gmeter"><i style="width:${s.guven}%;background:${s.guven>62?"var(--kar)":s.guven>35?"var(--sodium)":"var(--zarar)"}"></i></div>
        </div>
        <div class="gwrap">
          <div class="glbl"><span>İLGİ</span><span style="color:${s.ilgi>55?"var(--kar)":s.ilgi>25?"var(--sodium)":"var(--zarar)"}">${s.ilgi>55?"Sıcak":s.ilgi>25?"Kararsız":"Kapıda"}</span></div>
          <div class="gmeter"><i style="width:${s.ilgi}%;background:${s.ilgi>55?"var(--kar)":s.ilgi>25?"var(--sodium)":"var(--zarar)"}"></i></div>
        </div>
      </div>
      ${s.extras.length?`<div class="sec-note" style="margin-top:8px">Verdiğin ekstralar: ${s.extras.map(k=>SALE_EXTRAS.find(e=>e.k===k).n).join(", ")}</div>`:""}
    </div>

    <div class="talk" id="talkKutu">${s.log.map(m=>`<div class="bub ${m.who}">${m.t}</div>`).join("")}</div>

    ${s.done?`
      <div class="block" style="border-color:${s.sonuc==="satildi"?"rgba(67,192,138,.35)":"rgba(229,84,78,.3)"}">
        <div style="font-size:13px;line-height:1.5">${s.sonuc==="satildi"
          ? `Anlaşma sağlandı &mdash; <b class="mono" style="color:var(--sodium)">${tl(s.finalPrice)}</b>`
          : `Alıcı gitti. Ara&ccedil; ilanda kalmaya devam ediyor; yarın başka alıcı gelebilir.`}</div>
      </div>
      ${s.sonuc==="satildi"?"":`<button class="btn full" data-act="saleclose">Kapat</button>`}`
    :`
      ${moves?`<div style="display:flex;justify-content:space-between;align-items:baseline;margin:4px 0">
        <span class="sec-note" style="letter-spacing:.11em;text-transform:uppercase;font-size:10px">Hamleler</span>
        <span class="sec-note">${s.kozlar.length-s.usedKoz.length} koz kaldı</span></div>
        <div class="railwrap"><div class="moverail">${moves}</div></div>`:""}

      <div class="actionbar">
        <div class="ruler">
          <span class="line"></span>
          <span class="won" style="left:${p(cost)}%;width:${Math.max(0,p(s.counter||s.list)-p(cost))}%"></span>
          <span class="m" style="left:${p(cost)}%;background:var(--plate)"></span>
          <span class="lab" style="left:0;top:2px;color:var(--muted-2)">maliyet ${tlk(cost)}</span>
          <span class="m" style="left:${p(s.base)}%;background:var(--muted-2)"></span>
          <span class="lab" style="left:${clamp(p(s.base)-14,0,58)}%;top:26px;color:var(--muted-2)">a&ccedil;ılış ${tlk(s.base)}</span>
          <span class="m" style="right:0;background:var(--sodium)"></span>
          <span class="lab" style="right:0;top:2px;color:var(--sodium)">ilan ${tlk(s.list)}</span>
        </div>
        ${s.counter?`<button class="btn primary full" data-act="saleaccept">
          Kabul et &middot; ${tl(s.counter)} <span style="opacity:.75;font-weight:400">(${kar>=0?"+":""}${tlk(kar)})</span></button>`:""}
        <input class="offer-input" id="saleInput" type="text" inputmode="numeric" value="${num(start)}">
        <div class="quick">
          <button data-act="sq" data-p="-5">&minus;%5</button>
          <button data-act="sq" data-p="-2">&minus;%2</button>
          <button data-act="sq" data-p="2">+%2</button>
          <button data-act="sq" data-p="5">+%5</button></div>
        <button class="btn ${s.counter?"":"primary"} full" data-act="saleoffer">Fiyat ver</button>
      </div>`}`);
}

function openExtraList(){
  const s=S.sale;
  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">&Uuml;st&uuml;ne ne koyacaksın</div>
        <div class="sheet-sub">Cebinden &ccedil;ıkar &mdash; ama alıcının tavanını daha &ccedil;ok y&uuml;kseltir</div></div>
      <button class="x" data-act="backsale">&times;</button></div>
    ${SALE_EXTRAS.map((e,i)=>s.extras.includes(e.k)?"":`
      <button class="mv" style="width:100%;margin-bottom:8px" data-act="salemove" data-k="ekstra" data-i="${i}"
        ${S.cash<e.cost?"disabled":""}>
        <b>${e.n} &middot; ${tl(e.cost)}</b><span>${e.d}</span></button>`).join("")
      ||`<div class="empty">Verecek ekstra kalmadı.</div>`}
    <button class="btn ghost full" data-act="backsale" style="margin-top:6px">Vazge&ccedil;</button>`);
}

/** Teklif üzerinde işlem sonrası doğru ekrana dön. */
function refreshOfferView(){
  if(S.report && reportOffers().length){ openReport(); }
  else if(S.report){ S.report=null; S.reportStep=0; closeSheet(); }
  else closeSheet();
  render();
}

/* ---- anlaşma özeti ---- */
function openDealSummary(d){
  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">Anlaşma</div>
        <div class="sheet-sub">${d.n}</div></div>
      <button class="x" data-act="dealdone" aria-label="Kapat">&times;</button></div>
    <div class="block">
      <div class="kv"><span>Alış</span><b>&minus;${tl(d.buy)}</b></div>
      <div class="kv"><span>Tamir</span><b class="${d.repair?"neg":""}">${d.repair?"&minus;"+tl(d.repair):"&mdash;"}</b></div>
      <div class="kv"><span>Ekspertiz ve otopark</span><b class="neg">&minus;${tl(d.extra)}</b></div>
      <div class="kv"><span>Satış${d.note?" ("+d.note+")":""}</span><b style="color:var(--sodium)">+${tl(d.sell)}</b></div>
      <div class="kv" style="border-top:1px solid var(--line);margin-top:4px;padding-top:9px">
        <span style="color:var(--text)">Sonu&ccedil;</span>
        <b class="${d.profit>=0?"pos":"neg"}" style="font-size:19px">${d.profit>=0?"+":""}${tl(d.profit)}</b></div>
    </div>
    <div class="block"><h4>KAZANIM</h4>
      <div class="kv"><span>Deneyim</span><b class="pos">+${d.xp} xp</b></div>
      <div class="kv"><span>İtibar</span><b class="${d.rep>=0?"pos":"neg"}">${d.rep>=0?"+":""}${d.rep}</b></div>
      <div class="kv"><span>Elde tuttuğun g&uuml;n</span><b>${d.days}</b></div>
    </div>
    ${d.lesson?`<div class="block" style="border-color:var(--sodium-dim)">
      <div style="font-size:12.5px;line-height:1.55;color:#D9CDB4">${d.lesson}</div></div>`:""}
    <button class="btn primary full" data-act="dealdone">Devam</button>`);
}

/* ---- müzayede zarf ---- */
function openBid(c){
  const est=Math.round(valueOf(c,true)*0.78/500)*500;
  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">Zarf ver</div>
      <div class="sheet-sub">${c.model.n} ${c.year} · ${mesafe(c.km)}</div></div>
      <button class="x" data-act="close">×</button></div>
    <div class="block"><div class="help">
      <p>Rakip galericiler de zarf veriyor. En yüksek zarf alır, <strong>verdiğin rakamı ödersin</strong>.</p>
      <p>Kaputun altını kimse görmedi — bu yüzden ucuz, bu yüzden riskli.</p></div></div>
    <div class="sec-note" style="text-align:center;margin-bottom:5px">Zarfın ($)</div>
    ${c.whisper?`<div class="note" style="margin-bottom:10px">
      <svg viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0-6 6c0 4 3 5 3 8h6c0-3 3-4 3-8a6 6 0 0 0-6-6z"></path></svg>
      <div>Vedat fısıldadı: en y&uuml;ksek rakip zarfı <b class="mono">${tl(c.whisper.best)}</b> — ${c.whisper.who}.</div></div>`
    :((S.favors&&S.favors.vedat)?`<button class="btn full" data-act="whisper" data-id="${c.id}" style="margin-bottom:10px">
       Vedat&#39;a sor &middot; rakip zarfını &ouml;ğren</button>`:"")}
    <input class="offer-input" id="bidInput" type="text" inputmode="numeric" value="${num(est)}">
    <div class="sec-note" style="text-align:center;margin:8px 0 14px">Nakit: ${tl(S.cash)}</div>
    <button class="btn primary full" data-act="savebid" data-id="${c.id}">Zarfı bırak</button>`);
}
function resolveAuction(){
  const results=[];
  for(const c of [...S.auction]){
    const my=S.auctionBids[c.id];
    if(!my) continue;
    const av=valueOf(c,true);
    let best=0, winner="";
    RIVAL_DEFS.forEach((def,i)=>{
      const st=S.rivals[i];
      const fits=def.segs.includes(c.model.seg);
      const bid=Math.round(av*def.bid*rnd(fits?.94:.72, fits?1.10:.88)/500)*500;
      if(bid>st.cash*.6) return;
      if(bid>best){ best=bid; winner=def.n; }
    });
    if(my>best){
      if(S.cars.length>=S.slots){ results.push(`<div class="block"><b>${c.model.n} ${c.year}</b><div class="sec-note">Kazandın ama park yerin dolu — satış iptal.</div></div>`); continue; }
      if(my>S.cash){ results.push(`<div class="block"><b>${c.model.n} ${c.year}</b><div class="sec-note">Kazandın ama nakit yetmedi — ceza olarak ${tl(450)} kesildi.</div></div>`); S.cash-=450; continue; }
      buyCar(c,my,"müzayede"); S.wonAuction=true;
      const tv=valueOf(c,false);
      results.push(`<div class="block" style="border-color:rgba(67,192,138,.3)"><b>${c.model.n} ${c.year}</b>
        <div class="sec-note">Senin oldu · ${tl(my)} · en yakın rakip ${winner||"—"} ${tl(best)}</div>
        <div class="kv" style="margin-top:6px"><span>Gerçek değeri</span><b class="${tv>my?"pos":"neg"}">${tl(tv)}</b></div></div>`);
    }else{
      results.push(`<div class="block"><b>${c.model.n} ${c.year}</b>
        <div class="sec-note">Kaptırdın · senin ${tl(my)} · ${winner||"rakip"} ${tl(best)} verdi</div></div>`);
    }
  }
  S.auctionBids={};
  S.auction=S.auction.filter(c=>!c.owned);
  save();
  openSheet(`<div class="sheet-head"><div><div class="sheet-title">Zarflar açıldı</div>
      <div class="sheet-sub">${results.length} araç</div></div>
      <button class="x" data-act="close">×</button></div>
    ${results.join("")||`<div class="empty">Zarf vermedin.</div>`}
    <button class="btn primary full" data-act="close">Tamam</button>`);
}

/* ================= toast ================= */
function toast(t,kind){
  cal(kind==="good"?"para":(kind==="bad"?"hata":"uyari"));
  titre(kind==="bad"?HAPTIK.hata:HAPTIK.hafif);
  const el=document.createElement("div");
  el.className="toast "+(kind||"");
  el.innerHTML=t;   // metinler uygulama içinde yazılır, kullanıcı girdisi değil
  document.getElementById("toasts").appendChild(el);
  setTimeout(()=>{el.style.transition="opacity .3s";el.style.opacity="0";},2200);
  setTimeout(()=>el.remove(),2600);
}

/* ================= olaylar ================= */
const SES_EYLEM={
  tab:"sekme", open:"ac", close:"kapa", closesheet:"kapa", closereport:"kapa",
  endday:"gun", buy:"alim", inspect:"anahtar", repair:"tamir", cosmetic:"tamir",
  list:"para", delist:"sayfa", negotiate:"kaput", offer:"teklif",
  acceptoffer:"satis", acceptcounter:"alim", reject:"reddet", walk:"reddet",
  bluff:"uyari", perk:"seviye", hire:"kasa", loan:"kasa", repay:"kasa",
  deliver:"satis", bid:"teklif", feature:"para", view:"sayfa", lang:"sekme",
  startgame:"ac", pickarch:"tik", paylasac:"sayfa", kartaktar:"tik"
};
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-act]"); if(!b) return;
  const a=b.dataset.act, id=b.dataset.id;
  const car=id?findCar(id):null;
  if(S.tutorial){ if(!S.ogretIz) S.ogretIz={}; S.ogretIz[a]=true; }
  if(a==="ogretatla"){ ogretBitir(false); render(); return; }
  cal(SES_EYLEM[a]||"tik");
  titre(a==="endday"||a==="buy"||a==="acceptoffer" ? HAPTIK.orta : HAPTIK.hafif);

  if(a==="ses"){ const kapali=sesAnahtar(); render();
    toast(kapali?"Ses kapatıldı.":"Ses açıldı."); return; }
  if(a==="tab"){
    const t=b.dataset.t;
    if(S.view3d && !(t==="pazar"||t==="garaj")) W3D.close();
    if(!unlocked(t)){ toast(t==="muzayede"?"Müzayede seviye 2'de açılır.":"Galeri seviye 3'te açılır."); }
    S.tab=t; render(); return;
  }
  if(a==="close"){
    if(S.neg&&S.neg.dead){
      const gone=findCar(S.neg.carId);
      S.market=S.market.filter(x=>x.id!==S.neg.carId);
      if(gone) toast(`${gone.model.n} elinden gitti.`,"bad");
    }
    S.neg=null; closeSheet(); render();
    try{ muzikKip("saha"); }catch(e){}
    return;
  }
  if(a==="closereport"){ S.report=null; S.reportStep=0; closeSheet(); render(); return; }
  if(a==="closereportgaraj"){ S.report=null; S.reportStep=0; closeSheet();
    S.tab="garaj"; S.garajTab="satis"; render(); return; }
  /* --- arama, sıralama, sipariş filtresi --- */
  if(a==="arasil"){
    if(b.dataset.mod==="own") S.araGaraj=""; else S.ara="";
    render(); return;
  }
  /* --- BUGÜN rayı kartları --- */
  if(a==="sipac"){ openSiparis(b.dataset.o); return; }
  if(a==="gorevac"){ openBilgi("G&uuml;n&uuml;n g&ouml;revleri", (S.seri&&S.seri.n>1)?`${S.seri.n} g&uuml;nl&uuml;k seri`:"Her g&uuml;n yenilenir",
      gunlukSerit()+`<div class="sec-note" style="margin:8px 2px 0">G&ouml;rev bitince &ouml;d&uuml;l anında kasaya girer. Her g&uuml;n oynamak seri ikramiyesi getirir.</div>`); return; }
  if(a==="olayac"){ if(S.event) openBilgi(S.event.n, `${S.event.kalan} g&uuml;n s&uuml;recek`,
      `<div class="block"><div class="sec-note" style="font-size:14px;line-height:1.5">${S.event.d}${S.event.model?` &mdash; <b>${S.event.model}</b>`:""}</div></div>`); return; }
  if(a==="sanayiac"){ const sk=sanayiyeKalan();
    openBilgi("Sanayi g&uuml;n&uuml;", sk===0?"Bug&uuml;n":`${sk} g&uuml;n sonra`,
      `<div class="block"><div class="sec-note" style="font-size:14px;line-height:1.5">Kaportacı Nuri on g&uuml;nde bir sanayide toplu iş alıyor.
       O g&uuml;n b&uuml;t&uuml;n tamirler <b>%${Math.round(SANAYI.indirim*100)} ucuz</b>. Acelesi olmayan arızalı aracı o g&uuml;ne saklamak k&acirc;rı b&uuml;y&uuml;t&uuml;r &mdash;
       ama beklediğin her g&uuml;n otopark ve kira işliyor.</div></div>`); return; }
  if(a==="hedefac"){ const h=hedef(), il=hedefIlerleme();
    openBilgi("Sezon hedefi", seasonOf(S.day).k+" sezonu",
      `<div class="block"><div class="kv"><span>Mal sahibinin hedefi</span><b>${tl(h.tutar)}</b></div>
        <div class="kv"><span>Bu sezonki k&acirc;rın</span><b class="${il>=1?"pos":""}">${tl(S.seasonProfit||0)}</b></div>
        <div class="hedefcubuk"><i style="width:${Math.round(il*100)}%"></i></div>
        <div class="sec-note" style="margin-top:8px;line-height:1.5">Tutarsan gelecek sezonun kirası <b>donar</b> &mdash; seviye atlasan da artmaz &mdash;
          ve <b>%${Math.round(HEDEF.indirim*100)} indirimli</b> işler. Tutturamazsan kira normal.</div>
        ${S.kiraDonuk?`<div class="sec-note pos" style="margin-top:8px">Ge&ccedil;en sezonun hedefi tuttu: bu sezon kiran donuk.</div>`:""}</div>`); return; }
  if(a==="sipfiltre"){
    closeSheet();
    S.siparisFiltre=+b.dataset.o; S.filter="hepsi"; S.ara="";
    S.tab="pazar"; render();
    try{ document.getElementById("listeKap").scrollIntoView({block:"start",behavior:"smooth"}); }catch(e){}
    return;
  }
  if(a==="sipfiltrekapat"){ S.siparisFiltre=null; render(); return; }
  if(a==="prestij"){
    onay("Yeni şehir",
      "Piyasa sıfırlanır: kasan, garajın ve rakipler yeniden kurulur. Defterin, prestij primleri ve park yeri bonusun seninle gelir.",
      "Taşın", ()=>{ closeSheet(); prestijYap(); });
    return;
  }
  if(a==="defteralt"){ S.defterAlt=b.dataset.s; save(); render(); return; }
  if(a==="seasondone"){
    S.report.seasonSeen=true; S.seasonGross=0; S.seasonSales=0; S.seasonProfit=0;
    try{ const sl=ligKapat();
      if(sl.odul.nakit||sl.odul.xp) toast(`Sezon ligi ${sl.sira}. &mdash; +${tl(sl.odul.nakit)} &middot; +${sl.odul.xp} XP`, sl.sira<=3?"good":"");
    }catch(e){}
    save(); openReport(); return;
  }
  if(a==="dealdone"){
    S.lastDeal=null;
    refreshOfferView(); return;
  }
  if(a==="salenego"){ openSaleNeg(b.dataset.oid); return; }
  if(a==="carfile"){ openCarFile(id, b.dataset.back||null); return; }
  if(a==="filedone"){
    const geri=S.fileBack; S.fileBack=null;
    if(geri==="sale" && S.sale){ renderSaleNeg(); return; }
    if(geri==="own"){ const cc=S.cars.find(x=>x.id===+id); if(cc){ openOwnCar(cc); return; } }
    refreshOfferView(); return;
  }
  if(a==="repairfile"){
    const cc=S.cars.find(x=>x.id===+id);
    const f=cc&&cc.faults.find(x=>x.id===+b.dataset.f);
    const bedel=f?repairCost(f):0;
    if(!f||S.cash<bedel){ toast("Nakit yetmiyor.","bad"); return; }
    const oncekiRF=compsOf(cc,false)[f.comp];
    S.cash-=bedel; cc.spent+=bedel; f.fixed=true; S.stats.repairs++; cGain("nuri"); gorevIlerle("tamir");
    SON_TAMIR={id:cc.id, comp:f.comp, eski:oncekiRF};
    toast(`${f.n} yapıldı — ${tl(bedel)}`,"good");
    save(); renderHud(); openCarFile(cc.id); cubukDoldur(); SON_TAMIR=null; return;
  }
  if(a==="salemove"){ doSaleMove(b.dataset.k, b.dataset.i); return; }
  if(a==="extralist"){ openExtraList(); return; }
  if(a==="backsale"){ renderSaleNeg(); return; }
  if(a==="saleoffer"){ doSaleOffer(); return; }
  if(a==="saleaccept"){ finishSale(S.sale.counter); return; }
  if(a==="sq"){
    const inp=document.getElementById("saleInput");
    const v=parseInt(inp.value.replace(/[^\d]/g,"")||"0",10);
    inp.value=num(Math.round(v*(1+(+b.dataset.p)/100)/500)*500);
    return;
  }
  if(a==="saleclose"){
    const s=S.sale;
    if(s && s.sonuc==="kacti"){ dropOffer(s.oid); toast("Alıcı gitti. Ara&ccedil; ilanda kaldı.","bad"); }
    S.sale=null; save(); refreshOfferView(); return;
  }
  if(a==="pickarch"){ S.archetype=b.dataset.k; renderIntro(); return; }
  if(a==="pickzor"){ S.zorluk=b.dataset.k; renderIntro(); return; }
  /* --- tanıtım turu --- */
  if(a==="demoac"){ demoBaslat(); return; }
  if(a==="demoileri"){ demoIleri(1); return; }
  if(a==="demogeri"){ demoIleri(-1); return; }
  if(a==="demobitti"){ demoBitir(); return; }
  if(a==="demokapat"){ demoKapat(); return; }
  if(a==="muzik"){ const acik=muzikAnahtar(); render();
    toast(acik?"Müzik açıldı.":"Müzik kapatıldı."); return; }
  /* --- garaj kişiselleştirme --- */
  if(a==="lotac"){ openLotCustom(); return; }
  if(a==="lotrenk"){ lotAdOku(); lotAl().renk=b.dataset.k; openLotCustom(); return; }
  if(a==="lotzemin"){ lotAdOku(); lotAl().zemin=b.dataset.k; openLotCustom(); return; }
  if(a==="lotflama"){ lotAdOku(); lotAl().flama=!lotAl().flama; openLotCustom(); return; }
  if(a==="lotkaydet"){ lotKaydet(); return; }
  if(a==="lotsifirla"){ S.lot=lotVarsayilan(); openLotCustom(); return; }
  /* --- günün vakası --- */
  if(a==="meydanac"){ openMeydan(); return; }
  if(a==="meydanver"){ meydanCevapla(); return; }
  /* --- kartı paylaş --- */
  if(a==="paylasac"){ openPaylas(b.dataset.t||"soru"); return; }
  if(a==="paylastip"){ openPaylas(b.dataset.t); return; }
  if(a==="kartaktar"){ kartAktarTikla(); return; }
  /* --- haftalık karne --- */
  if(a==="karnekopya"){ karneKopyala(); return; }
  if(a==="karnekapat"){ S.karne=null; closeSheet(); render(); return; }
  if(a==="lang"){ dilAyarla(b.dataset.l, false);
    if(S.started){ render(); renderHud(); renderTabs();
      try{ if(W3D.active) W3D.refresh(); }catch(e){} }
    else renderIntro();
    return; }
  if(a==="startgame"){ startGame(); return; }
  if(a==="fastsale"){
    if(!(S.favors&&S.favors.yilmaz)){ return; }
    S.favors.yilmaz=false;
    const b2=makeBuyer(car,S);
    if(b2.walk){ toast("Yılmaz&#39;ın bulduğu alıcı ekspertizde kusuru g&ouml;rd&uuml; ve vazge&ccedil;ti.","bad"); save(); openOwnCar(car); return; }
    const teklif={oid:S.oidSeq++, carId:car.id, amount:b2.offer, caught:b2.caught, issues:b2.issues,
                  inspects:b2.inspects, type:b2.type, takas:b2.takas||null, taksit:b2.taksit||null,
                  day:S.day, expires:S.day+2};
    S.offers.push(teklif);
    toast("Yılmaz bir alıcı buldu.","good");
    save(); closeSheet(); S.tab="garaj"; render(); return;
  }
  if(a==="favor"){
    const k=b.dataset.k;
    if(cLvl(k)<2){ toast("Bu tanıdık hen&uuml;z bu seviyede değil.","bad"); return; }
    S.favors=S.favors||{};
    if(S.favors[k]){ toast("Zaten iyilik istedin, kullanmayı bekliyor."); return; }
    if(S.favorSeason===seasonIndex()){ toast("Bu sezon bir iyilik hakkını kullandın.","bad"); return; }
    S.favors[k]=true; S.favorSeason=seasonIndex();
    const c=CONTACTS.find(x=>x.k===k);
    toast(`${c.n}: "${c.favor}" — hazır.`,"good");
    save(); render(); return;
  }
  if(a==="buyrival"){
    const i=+b.dataset.i, r=S.rivals[i];
    if(!r) return;
    const deger=Math.round((r.cash+r.stock.reduce((s,x)=>s+x.val*.9,0))*1.4/2500)*2500;
    if(S.cash<deger){ toast("Nakit yetmiyor.","bad"); return; }
    onay("Rakip galeriyi devral",
      `${r.n} ${tl(deger)} karşılığında senin olur. Stoğu sana ge&ccedil;er, park kontenjanın +2 artar ve o segmentteki baskı kalkar.`,
      `Devral &middot; ${tl(deger)}`, ()=>rakipDevral(i, deger));
    return;
  }
  if(a==="deliver"){
    const o=(S.orders||[]).find(x=>x.id===+b.dataset.o);
    const cc=S.cars.find(x=>x.id===+b.dataset.c);
    if(!o||!cc) return;
    const q=orderQuality(o,cc);
    if(q.red){
      S.rep=clamp(S.rep-1,0,100); musteriKustu(o);
      toast(`${o.who}: "${q.not}" — aracı kabul etmedi.`,"bad");
      closeSheet(); save(); render(); return;
    }
    const tutar=q.tutar;
    S.orders=S.orders.filter(x=>x!==o);
    S.ordersDone=(S.ordersDone||0)+1;
    S.rep=clamp(S.rep+q.rep,0,100);
    if(q.rep>=3) musteriMemnun(o); else musteriKustu(o);
    sellCar(cc, tutar, `sipariş &middot; ${o.who}`);
    toast(q.not, q.rep>0?"good":"bad");
    checkMilestones(); save(); render();
    if(S.lastDeal) openDealSummary(S.lastDeal);
    return;
  }
  if(a==="view"){ toggle3d(b.dataset.v==="1"); return; }
  if(a==="w3dopen"){ const f=W3D.focus; if(f){ W3D.pause();
      if(S.tab==="pazar") openMarketCar(f.car); else openOwnCar(f.car); } return; }
  if(a==="filter"){ S.filter=b.dataset.f; render(); return; }
  if(a==="garajtab"){ S.garajTab=b.dataset.g; S.araGaraj=""; render(); return; }
  if(a==="hidetut"){ S.tutorial=false; save(); render(); return; }
  if(a==="endday"){ closeSheet(); nextDay(); return; }

  if(a==="open"){
    const m=b.dataset.mode;
    if(m==="market") openMarketCar(car);
    else if(m==="auction") openAuctionCar(car);
    else openOwnCar(car);
    return;
  }
  if(a==="hizlibak"){
    const org=b.dataset.c, bedel=hizliFiyat();
    if(!car || car.inspected) return;
    if(S.cash<bedel){ toast("Nakit yetmiyor.","bad"); return; }
    car.bakilan=car.bakilan||[];
    if(car.bakilan.indexOf(org)<0) car.bakilan.push(org);
    S.cash-=bedel; cGain("hakan");
    // Tek organ açıldı: o organın arızaları da deftere yazılıyor.
    notAl(car, false);
    const cikan=car.faults.filter(f=>!f.fixed && f.comp===org && !f.visible);
    toast(cikan.length
      ? `${COMPLBL[org]}: ${cikan.map(f=>f.n).join(", ")}`
      : `${COMPLBL[org]} temiz çıktı.`, cikan.length?"bad":"good");
    save(); renderHud();
    car.owned?openOwnCar(car):openMarketCar(car);
    return;
  }
  if(a==="eksper"){
    const ep=car.gunun?0:eksperFiyat();
    if(S.cash<ep && !(S.favors&&S.favors.hakan)){ toast("Nakit yetmiyor.","bad"); return; }
    if(car.gunun) toast("Günün fırsatı — ekspertiz bedava.","good");
    else if(S.favors&&S.favors.hakan){ S.favors.hakan=false; toast("Hakan bu araca bedava baktı.","good"); }
    else S.cash-=ep;
    car.inspected=true; cGain("hakan"); gorevIlerle("eksper");
    notAl(car, true);                      // tam ekspertiz → defter dolar
    save();
    const iss=hiddenIssues(car);
    toast(iss.length?`Ekspertiz: ${iss.length} bulgu çıktı.`:"Ekspertiz temiz çıktı.", iss.length?"bad":"good");
    renderHud();
    car.owned?openOwnCar(car):openMarketCar(car);
    return;
  }
  if(a==="negotiate"){ openNegotiation(car); return; }
  if(a==="tow"){
    if(!(S.favors&&S.favors.selim)) return;
    S.favors.selim=false; car.towed=true;
    car.ask=Math.max(250,car.ask-450); car.reserve=Math.max(250,car.reserve-450);
    toast("Selim &ccedil;ekme masrafını &uuml;stlendi — ₺7.500 d&uuml;şt&uuml;.","good");
    save(); openMarketCar(car); return;
  }
  if(a==="q"){
    const inp=document.getElementById("negInput");
    const v=parseInt(inp.value.replace(/[^\d]/g,"")||"0",10);
    inp.value=num(Math.round(v*(1+(+b.dataset.p)/100)/500)*500);
    return;
  }
  if(a==="offer"){ doOffer(); return; }
  if(a==="move"){ if(b.dataset.k==="koz"||b.dataset.k==="blof") gorevIlerle("koz"); doMove(b.dataset.k, b.dataset.i); return; }
  if(a==="bloflist"){ openBluffList(); return; }
  if(a==="backneg"){ renderNeg(); return; }
  if(a==="acceptcounter"){
    const c=findCar(S.neg.carId), p=S.neg.counter;
    if(buyCar(c,p,null,S.neg.senet)){ S.neg=null; closeSheet(); S.tab="garaj"; render(); }
    return;
  }
  if(a==="senetac"){ if(S.neg){ S.neg.senet=!S.neg.senet; renderNeg(); } return; }
  /* --- toptan parti --- */
  if(a==="partiac"){ openParti(); return; }
  if(a==="partial"){ if(partiAl()){ closeSheet(); S.tab="garaj"; S.garajTab="hazir"; render(); } return; }
  /* --- konsinye --- */
  if(a==="konsac"){ openKonsTeklif(); return; }
  if(a==="konskabul"){ if(konsKabul()){ closeSheet(); S.tab="garaj"; S.garajTab="hazir"; render(); } return; }
  if(a==="konsred"){ konsRed(); closeSheet(); render(); return; }
  if(a==="konsiade"){ const cc=S.cars.find(x=>x.id===+id);
    if(cc) onay("Sahibine iade et", `${cc.model.n} ${konsSahip(cc.konsinye.sahip).n}'e d&ouml;ner, yerin a&ccedil;ılır. Tamire harcadığın geri gelmez, itibarın biraz d&uuml;şer.`,
      "İade et", ()=>{ if(konsIade(cc)){ closeSheet(); render(); } }, true);
    return; }
  if(a==="repair"){
    const f=car.faults.find(x=>x.id===+b.dataset.f);
    const bedel=f?repairCost(f):0;
    if(!f||S.cash<bedel){ toast("Nakit yetmiyor.","bad"); return; }
    const oncekiR=compsOf(car,false)[f.comp];
    if(S.favors&&S.favors.nuri){ S.favors.nuri=false; toast("Nuri bu tamiri bedava yaptı.","good"); }
    else S.cash-=bedel;
    car.spent+=(S.favors&&S.favors.nuri)?0:bedel; f.fixed=true; S.stats.repairs++; cGain("nuri"); gorevIlerle("tamir");
    SON_TAMIR={id:car.id, comp:f.comp, eski:oncekiR};
    toast(`${f.n} yapıldı — ${tl(bedel)}`,"good");
    save(); renderHud(); openOwnCar(car); cubukDoldur(); SON_TAMIR=null; return;
  }
  if(a==="cosmetic" || a==="cosmeticfile"){
    if(S.cash<350){ toast("Nakit yetmiyor.","bad"); return; }
    S.cash-=350; car.spent+=350; car.cosmetic=true;
    toast("Araç pırıl pırıl oldu.","good"); save(); renderHud();
    // Hangi ekrandan basıldıysa oraya dön; araç dosyasındayken kendi araç
    // sayfasına atlamak kullanıcıyı kaybediyordu.
    if(a==="cosmeticfile") openCarFile(car.id); else openOwnCar(car);
    return;
  }
  if(a==="list"){
    const range=document.getElementById("lpRange");
    const base=+range.dataset.base;
    const price=Math.round(base*(+range.value)/100/500)*500;
    // Kusurların açıklanıp açıklanmadığı artık ayrı bir onay kutusu değil,
    // ilanın DİLİNİN sonucu: dürüst ilan = açıklanmış ilan.
    car.ilanDili=car.ilanDili||"muglak";
    car.disclosed = car.ilanDili==="durust";
    car.listPrice=price;
    car.daysListed=0; car.leadsSeen=0; gorevIlerle("ilan");
    toast(`İlan yayında — ${tl(price)} · ${ILAN_DILI[car.ilanDili].n.replace(/&uuml;/g,"ü")}`,"good");
    save(); closeSheet(); S.tab="garaj"; render(); return;
  }
  if(a==="ilandil"){
    if(!car) return;
    car.ilanDili=b.dataset.k; save(); openOwnCar(car); return;
  }
  if(a==="ilansunum"){
    if(!car) return;
    const i=+b.dataset.i, o=ILAN_SUNUM[i], eski=ILAN_SUNUM[car.sunum|0];
    const fark=o.bedel-eski.bedel;
    if(fark>0 && S.cash<fark){ toast("Nakit yetmiyor.","bad"); return; }
    if(fark>0){ S.cash-=fark; car.spent+=fark; if(i===2) car.cosmetic=true; }
    car.sunum=i; save(); renderHud(); openOwnCar(car); return;
  }
  if(a==="unlist"){ car.listPrice=null; save(); closeSheet(); render(); return; }
  if(a==="cut"){ car.listPrice=Math.round(car.listPrice*0.97/500)*500; car.priceCuts=(car.priceCuts||0)+1; gorevIlerle("kir");
    toast(`Yeni fiyat ${tl(car.listPrice)}`); save(); openOwnCar(car); return; }
  if(a==="wholesale"){
    const p=Math.round(valueOf(car,false)*0.82/500)*500;
    sellCar(car,p,"toptan"); render(); if(S.lastDeal) openDealSummary(S.lastDeal); return;
  }
  if(a==="takeoffer"){
    const o=getOffer(b.dataset.oid); if(!o) return;
    const car2=S.cars.find(x=>x.id===o.carId); if(!car2) return;
    sellCar(car2,o.amount);
    dropOffer(o.oid);
    render(); if(S.lastDeal) openDealSummary(S.lastDeal); return;
  }
  if(a==="taketakas"){
    const o=getOffer(b.dataset.oid); if(!o||!o.takas) return;
    const car2=S.cars.find(x=>x.id===o.carId); if(!car2) return;
    if(S.cars.length>=S.slots){ toast("Park yerin dolu.","bad"); return; }
    const t=o.takas;
    sellCar(car2, o.amount, `takaslı · ${t.car.model.n}`);
    S.cash-=t.claim;   // aracın bedeli nakitten değil, takastan karşılandı
    t.car.owned=true; t.car.boughtFor=t.claim; t.car.seller=null; t.car.ask=null;
    t.car.boughtFrom="Takas &middot; "+(o.type?o.type.n:"alıcı"); t.car.boughtVia="takas";
    t.car.priceCuts=0; t.car.extras=[];
    t.car.boughtDay=S.day; t.car.daysListed=0; t.car.leadsSeen=0;
    S.cars.push(t.car);
    toast(`${t.car.model.n} takasla garaja girdi — ${tl(t.claim)} üzerinden.`);
    dropOffer(o.oid);
    save(); render(); if(S.lastDeal) openDealSummary(S.lastDeal); return;
  }
  if(a==="taketaksit"){
    const o=getOffer(b.dataset.oid); if(!o||!o.taksit) return;
    const car2=S.cars.find(x=>x.id===o.carId); if(!car2) return;
    const k=o.taksit, saleId=Date.now()+Math.random();
    const parca=Math.round((k.total-k.down)/k.parts/500)*500;
    for(let i=1;i<=k.parts;i++){
      S.receivables.push({saleId, due:S.day+k.gap*i, amount:parca, left:k.parts-i+1,
        risk:k.risk, who:o.type?o.type.n:"Alıcı", n:`${car2.model.n} ${car2.year}`});
    }
    sellCar(car2, k.down, `taksitli · ${tl(k.total)}`);
    toast(`Peşinat alındı. ${k.parts} taksit senede bağlandı.`,"good");
    dropOffer(o.oid);
    save(); render(); if(S.lastDeal) openDealSummary(S.lastDeal); return;
  }
  if(a==="onlycash"){
    const o=getOffer(b.dataset.oid); if(!o) return;
    const yeni=Math.round(o.amount*.94/500)*500;
    if(chance(.42)){
      toast("Alıcı vazgeçti — takas/taksit olmadan alamayacakmış.","bad");
      dropOffer(o.oid);
    }else{
      o.takas=null; o.taksit=null; o.amount=yeni;
      toast(`Nakde ikna ettin — teklif ${tl(yeni)}.`,"good");
    }
    save(); refreshOfferView(); return;
  }
  if(a==="dropoffer"){
    const o=getOffer(b.dataset.oid); if(o) dropOffer(o.oid);
    toast("Teklif reddedildi.");
    save(); refreshOfferView(); return;
  }
  if(a==="bid"){ openBid(car); return; }
  if(a==="whisper"){
    if(!(S.favors&&S.favors.vedat)){ toast("Vedat&#39;tan iyilik istemedin.","bad"); return; }
    S.favors.vedat=false;
    const c=findCar(id); if(!c) return;
    const av=valueOf(c,true);
    let best=0,who="";
    RIVAL_DEFS.forEach((def,i)=>{
      const fits=def.segs.includes(c.model.seg);
      const bid=Math.round(av*def.bid*(fits?1.02:.80)/500)*500;
      if(bid>best){best=bid;who=def.n;}
    });
    c.whisper={who,best};
    toast("Vedat fısıldadı.","good"); save(); openBid(c); return;
  }
  if(a==="savebid"){
    const v=parseInt(document.getElementById("bidInput").value.replace(/[^\d]/g,"")||"0",10);
    if(!v){ toast("Bir rakam yaz.","bad"); return; }
    if(v>S.cash){ toast("Nakit yetmiyor.","bad"); return; }
    S.auctionBids[id]=v; save(); closeSheet(); render(); toast("Zarf bırakıldı."); return;
  }
  if(a==="unbid"){ delete S.auctionBids[id]; save(); render(); return; }
  if(a==="resolveauction"){ resolveAuction(); render(); return; }
  if(a==="perk"){
    const k=b.dataset.k;
    if(!S.perkPts||(S.perks||{})[k]) return;
    S.perks=S.perks||{}; S.perks[k]=true; S.perkPts--;
    const pk=PERK_LIST.find(x=>x.k===k);
    toast(`${pk.n} açıldı.`,"good"); save(); render(); return;
  }
  if(a==="buyslot"){
    const cost=slotFiyat();
    if(S.cash<cost){ toast("Nakit yetmiyor.","bad"); return; }
    S.cash-=cost; S.slots++; toast(`Kontenjan ${S.slots} oldu.`,"good"); save(); render();
    // Parti sayfasından büyütüldüyse sayfa yeni yer sayısıyla açık kalsın.
    if(S.parti && document.querySelector(".partiler")) openParti();
    return;
  }
  if(a==="dukkanal"){
    const d=S.dukkan;
    if(!d){ toast("Teklif kalmadı.","bad"); return; }
    if(S.cash<d.bedel){ toast("Nakit yetmiyor.","bad"); return; }
    S.cash-=d.bedel; S.slots+=d.slot; S.dukkan=null; S.doluGun=0;
    S.stats.dukkan=(S.stats.dukkan||0)+1;
    cal("kasa"); toast(`Yandaki d&uuml;kk&acirc;n senin — kontenjan ${S.slots} oldu.`,"good");
    save(); render(); return;
  }
  if(a==="staff"){ S.staff[b.dataset.k]=!S.staff[b.dataset.k];
    toast(S.staff[b.dataset.k]?"İşe alındı.":"İşten çıkarıldı."); save(); render(); return; }
  if(a==="marketing"){
    if(S.cash<PARA.vitrin){ toast("Nakit yetmiyor.","bad"); return; }
    S.cash-=PARA.vitrin; S.marketingDays=5; toast("5 gün vitrindesin.","good"); save(); render(); return;
  }
  if(a==="borrow"){
    const acik=creditLimit()-S.debt;
    if(acik<=0){ toast("Limitin dolu.","bad"); return; }
    const m=Math.min(PARA.krediDilim,acik);
    S.cash+=m; S.debt+=m; toast(`${tl(m)} kredi çekildi.`); save(); render(); return;
  }
  if(a==="repay"){
    const p=Math.min(S.cash,S.debt); S.cash-=p; S.debt-=p;
    toast(`${tl(p)} borç ödendi.`,"good"); save(); render(); return;
  }
  if(a==="kayitdisa"){
    const m=(typeof KAYIT!=="undefined") ? KAYIT.disaAktar() : null;
    if(!m){ toast("Kopyalanacak kayıt yok.","bad"); return; }
    const bitir=(tamam)=>toast(tamam?"Kayıt panoya kopyalandı.":"Kopyalanamadı — metni elle seç.", tamam?"good":"bad");
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(m).then(()=>bitir(true), ()=>bitir(false));
      } else {
        const ta=document.createElement("textarea");
        ta.value=m; ta.setAttribute("style","position:fixed;opacity:0");
        document.body.appendChild(ta); ta.select();
        const o=document.execCommand("copy"); ta.remove(); bitir(o);
      }
    }catch(e){ bitir(false); }
    return;
  }
  if(a==="kayitice"){
    const m=prompt("Yedek metnini yapıştır:");
    if(!m) return;
    if(typeof KAYIT==="undefined" || !KAYIT.iceAl(m)){ toast("Bu metin geçerli bir kayıt değil.","bad"); return; }
    toast("Kayıt yüklendi.","good");
    setTimeout(()=>location.reload(), 600);
    return;
  }
  if(a==="reset"){
    onay("Baştan başla",
      "T&uuml;m ilerleme silinecek: kasan, garajın, defterin ve kilometre taşların. Bu geri alınamaz.",
      "Evet, her şeyi sil", ()=>{
        try{ if(typeof KAYIT!=="undefined") KAYIT.sil(); else localStorage.removeItem("preloved_v1"); }catch(e){}
        try{ localStorage.removeItem("preloved_v1"); }catch(e){}
        closeSheet();
        S=blankState();
        try{ save(); }catch(e){}
        boot(true);
      }, true);
    return;
  }
  if(a==="onayevet"){ onayCalistir(); return; }
  if(a==="onayhayir"){ _onayEylem=null; closeSheet(); render(); return; }
});
document.addEventListener("input",e=>{
  if(e.target.id==="lpRange"){
    const base=+e.target.dataset.base;
    const fiyat=Math.round(base*(+e.target.value)/100/1000)*1000;
    document.getElementById("lpLabel").textContent=tl(fiyat);
    const k=document.getElementById("lpKar");
    if(k){ k.innerHTML=lpKarMetni(fiyat, +k.dataset.cost); dugumCevir(k); }
  }
  if(e.target.id==="negInput"||e.target.id==="bidInput"||e.target.id==="saleInput"){
    const v=e.target.value.replace(/[^\d]/g,"");
    e.target.value=v?num(parseInt(v,10)):"";
  }
});
document.getElementById("modal").addEventListener("click",e=>{
  if(e.target.id==="modal"){
    if(S.sale && !S.sale.done) return;   // pazarlık ortasında yanlışlıkla kapanmasın
    if(S.report){ S.report=null; }
    if(S.neg&&S.neg.dead) S.market=S.market.filter(x=>x.id!==S.neg.carId);
    S.neg=null; closeSheet(); render(); save();
  }
});


/* ================= açılış ================= */
const ARCHETYPES=[
 {k:"otoparkci", n:"Otopark&ccedil;ı", d:"Babandan kalan k&ouml;şede d&ouml;rt araba sığıyor. Nakit az, yerin bol.",
  perk:"+1 kontenjan &middot; b&uuml;y&uuml;tmek ucuz, kira pahalı", cash:2600000, slots:4, gives:null,
  slotKat:0.70, kiraKat:1.18,
  ic:'<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="12" rx="2"></rect><path d="M7 7V4h10v3"></path><path d="M7 13h10"></path></svg>'},
 {k:"usta", n:"Usta", d:"Yıllarca serviste &ccedil;alıştın. Kaputun altını a&ccedil;madan tahmin edersin.",
  perk:"Tamirler %20 ucuz &middot; kira ve b&uuml;y&uuml;me dengeli", cash:2800000, slots:3, gives:["goz","usta"],
  slotKat:1.00, kiraKat:1.00,
  ic:'<svg viewBox="0 0 24 24"><path d="M14 4l6 6-4 4-6-6z"></path><path d="M10 8L4 14v6h6l6-6"></path></svg>'},
 {k:"dilbaz", n:"Dilbaz", d:"Nasıl sattığını bilirsin. Kimse senden ucuza almaz.",
  perk:"+1 sabır &middot; kira ucuz ama b&uuml;y&uuml;mek pahalı", cash:3100000, slots:3, gives:["dil"],
  slotKat:1.34, kiraKat:0.82,
  ic:'<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"></path><path d="M8 10h8"></path></svg>'}
];
/** Kelepir logosu — ön camdaki fiyat etiketi: delikli kart, içinde iki satır
    ve altında araç tabanı. Geçici yer tutucu; 24 pikselde de okunuyor. */
/* Marka işareti: eğik fiyat etiketi, içinde ₺. Uygulama ikonuyla birebir aynı
   geometri (ikon.py tek kaynaktan üretiyor) — başlatıcıdaki simgeyle giriş
   ekranındaki işaret aynı şey olmalı, yoksa marka iki parçaya bölünüyor. */
const LOGO_SVG=`<svg class="glogo" viewBox="0 0 100 100" aria-hidden="true">
  <g transform="rotate(-10 50 50) translate(50 50) scale(.9) translate(-50 -50)">
    <path d="M14,50 L46,17 A9,9 0 0 1 53,14 L82,14 A8,8 0 0 1 90,22 L90,51
             A9,9 0 0 1 87,58 L55,90 A8,8 0 0 1 43,90 L14,61 A8,8 0 0 1 14,50 Z"
          fill="var(--gold)"></path>
    <circle cx="34" cy="32" r="8.5" fill="#0A1416"></circle>
    <g transform="rotate(10 55 55) translate(57 55) scale(.8) translate(-55 -55)"
       fill="none" stroke="#0A1416" stroke-width="7.4"
       stroke-linecap="round" stroke-linejoin="round">
      <path d="M52,33 L52,69 L70,78"></path>
      <path d="M41,49 L69,37"></path>
      <path d="M41,60 L69,48"></path>
    </g>
  </g>
</svg>`;

function renderIntro(){
  const sel=S.archetype||"otoparkci";
  const a=ARCHETYPES.find(x=>x.k===sel)||ARCHETYPES[0];
  const zk=S.zorluk||"normal";
  const z=ZORLUKLAR.find(x=>x.k===zk)||ZORLUKLAR[0];
  document.getElementById("introBody").innerHTML=`
    <div class="introbar">
      <div class="marka">${LOGO_SVG}<span>Kelepir</span></div>
      ${dilSecilebilir()?`<span style="display:flex;gap:6px">
        <button class="dilbtn ${I18N.lang==="tr"?"on":""}" data-act="lang" data-l="tr">T&uuml;rk&ccedil;e</button>
        <button class="dilbtn ${I18N.lang==="en"?"on":""}" data-act="lang" data-l="en">English</button>
      </span>`:`<span class="markaalt">oto galeri sim&uuml;lasyonu</span>`}
    </div>

    <p class="girisozet">İkinci el piyasasında bir galeri kur. Ucuza al, doğru tamiri yap, doğru alıcıya sat.</p>

    <div class="girisbolum">
      <h4>NEREDEN BAŞLIYORSUN</h4>
      <div class="ucluSec">
        ${ARCHETYPES.map(x=>`<button class="minipick ${sel===x.k?"on":""}" data-act="pickarch" data-k="${x.k}">
          <span class="ic">${x.ic}</span><b>${x.n}</b></button>`).join("")}
      </div>
      <div class="secaciklama"><p>${a.d}</p><span class="perk">${a.perk}</span></div>
    </div>

    <div class="girisbolum">
      <h4>ZORLUK <em>sonradan değişmez</em></h4>
      <div class="ikiliSec">
        ${ZORLUKLAR.map(x=>`<button class="${zk===x.k?"on":""}" data-act="pickzor" data-k="${x.k}">${x.n}</button>`).join("")}
      </div>
      <div class="secaciklama"><p>${z.d}</p><span class="perk">${z.not}</span></div>
    </div>

    <div class="girisadim">
      <span><i>1</i>İlana gir, ekspertize ver, &ccedil;ıkan kusuru pazarlıkta koz yap</span>
      <span><i>2</i>Sadece k&acirc;rlı tamiri yaptır &mdash; hepsini yapmak zarardır</span>
      <span><i>3</i>Fiyat koy, sat. Gizlediğin kusur yakalanırsa itibarın d&uuml;şer</span>
    </div>

    <div class="girisalt">
      ${S.demoYapildi?`<div class="demonot">Tanıtım turu tamam &mdash; ${tl(demoKar())} k&acirc;r kasana eklenecek</div>`:""}
      <button class="btn primary full" data-act="startgame">Galeriyi a&ccedil;</button>
      ${S.demoYapildi?"":`<button class="btn full" data-act="demoac">İlk kez mi? Tanıtım turu &middot; 1 dk</button>`}
      <div class="hint">İlerlemen bu cihazda saklanır &middot; reklamsız, &ccedil;evrimdışı</div>
    </div>`;
  document.getElementById("intro").classList.remove("hidden");
  try{ muzikKip("menu"); }catch(e){}
}
function startGame(){
  const a=ARCHETYPES.find(x=>x.k===(S.archetype||"otoparkci"));
  const pb=prestijBonus();
  S.cash=Math.round(a.cash*pb.baslangic); S.slots=a.slots+pb.slot; S.archetype=a.k;
  S.perks=S.perks||{};
  (a.gives||[]).forEach(k=>{S.perks[k]=true;});
  S.started=true;
  try{ demoKariyereYaz(); }catch(e){}
  document.getElementById("intro").classList.add("hidden");
  refreshMarket();
  gunlukKur(true);
  ligRakipGun(); seriGuncelle();
  save(); render();
}

/* ================= başlat ================= */
function boot(fresh){
  if(fresh || !load()){
    S=blankState();
  }
  if(!I18N.kuruldu){ I18N.kuruldu=true; dilAyarla(dilOku(), false); dilGozle(); }
  VISION=(car,f)=>S.staff.eksper && f.id%2===0;
  PRESSURE=seg=>rivalPressure(seg);
  PERKS=()=>S.perks||{};
  MARKET=()=>S.event;
  ZOR=()=>S.zorluk||"normal";
  NOTER=()=>CONTACTS.find(c=>c.k==="yilmaz").per[cLvl("yilmaz")];
  if(!S.rivals) S.rivals=newRivals();
  if(!S.started){ renderIntro(); window.__plAcildi=true; return; }
  document.getElementById("intro").classList.add("hidden");
  try{ gocEt(); }catch(e){}
  if(!S.market.length) refreshMarket();
  gunlukKur(false);
  seriGuncelle();
  render();
  window.__plAcildi=true;
}
(function bind3d(){
  const host=document.getElementById("world");
  if(!host) return;
  host.addEventListener("touchstart", e=>{ if(e.target.closest("#w3dbar")) return; W3D.pointerDown(e); e.preventDefault();}, {passive:false});
  host.addEventListener("touchmove",  e=>{W3D.pointerMove(e); e.preventDefault();}, {passive:false});
  host.addEventListener("touchend",   e=>{W3D.pointerUp(e);}, {passive:false});
  host.addEventListener("touchcancel",e=>{W3D.pointerUp(e);}, {passive:false});
  host.addEventListener("mousedown", e=>{ if(e.target.closest("#w3dbar")) return; W3D.pointerDown(e); });
  window.addEventListener("mousemove", e=>W3D.pointerMove(e));
  window.addEventListener("mouseup",   e=>W3D.pointerUp(e));
  window.addEventListener("keydown", e=>W3D.onKey(e,true));
  window.addEventListener("keyup",   e=>W3D.onKey(e,false));
  window.addEventListener("resize", ()=>W3D.resize());
  document.addEventListener("visibilitychange", ()=>{ if(document.hidden) W3D.pause(); else if(S&&S.view3d&&can3d()) W3D.resume(); });
})();

/* Açılış: bozuk bir kayıt yüzünden boş ekran kalmasın — bir kez sıfırdan dener. */
function acilis(){
  try{ boot(); }
  catch(e){
    try{ localStorage.removeItem("preloved_v1"); }catch(_){}
    try{ boot(true); }
    catch(e2){
      if(window.__plPanel) window.__plPanel("Kayıt sıfırlandıktan sonra da açılamadı.",
        (e2&&e2.stack)||String(e2));
      else throw e2;
    }
  }
}
/* IndexedDB'deki kayıt localStorage'dakinden yeniyse önce onu yerine koy. */
if(typeof KAYIT!=="undefined" && KAYIT.hazirla) KAYIT.hazirla().then(acilis, acilis);
else acilis();

