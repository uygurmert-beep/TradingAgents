/* ================= GÜNLÜK RİTİM — görevler, günün fırsatı, seri ================= */
const GOREV_HAVUZ=[
 {k:"eksper", n:1, bas:"Bir aracı ekspertize ver",      sayac:"eksper", nakit:7000, xp:15},
 {k:"eksper2",n:2, bas:"İki aracı ekspertize ver",      sayac:"eksper", nakit:15000, xp:25},
 {k:"al",     n:1, bas:"Bir araç satın al",             sayac:"al",     nakit:12000, xp:20},
 {k:"sat",    n:1, bas:"Bir araç sat",                  sayac:"sat",    nakit:15000, xp:25},
 {k:"tamir",  n:2, bas:"İki kusuru onar",               sayac:"tamir",  nakit:10000, xp:18},
 {k:"ilan",   n:1, bas:"Bir aracı satışa çıkar",        sayac:"ilan",   nakit:8000, xp:14},
 {k:"koz",    n:2, bas:"Pazarlıkta iki koz kullan",     sayac:"koz",    nakit:12000, xp:20},
 {k:"kar",    n:1, bas:"Tek satışta %12 üstü kâr yap",  sayac:"iyiKar", nakit:18000, xp:32},
 {k:"indir",  n:1, bas:"Bir ilanın fiyatını kır",       sayac:"kir",    nakit:6500, xp:12}
];
function gunSayacSifirla(){
  S.gunSayac={eksper:0, al:0, sat:0, tamir:0, ilan:0, koz:0, iyiKar:0, kir:0};
}
function gorevUret(){
  const havuz=[...GOREV_HAVUZ];
  const sec=[];
  while(sec.length<3 && havuz.length){
    const g=havuz.splice(ri(0,havuz.length-1),1)[0];
    if(sec.some(x=>x.sayac===g.sayac)) continue;
    sec.push({k:g.k, n:g.n, bas:g.bas, sayac:g.sayac, nakit:g.nakit, xp:g.xp, odendi:false});
  }
  return sec;
}
/** Her oyun gününde bir kez: görevler, günün fırsatı. */
function gunlukKur(zorla){
  if(!zorla && S.gunluk && S.gunluk.gun===S.day) return;
  S.gunluk={gun:S.day, gorevler:gorevUret(), hepsiOdendi:false};
  gunSayacSifirla();
  // günün fırsatı: pazardaki bir araç, tabanı düşük ve ekspertizi bedava
  for(const c of S.market) c.gunun=false;
  /* Rozet yalnız gerçekten ucuz ve ağır hasarsız araca. Eskiden rastgele bir
     araca veriliyordu: "~%17 pahalı (tahmin)" yazan araçta da, ağır hasarlı
     araçta da "Günün fırsatı" çıkıyor, oyuncunun rozetlere güvenini kırıyordu.
     Uygun aday yoksa o gün rozet yok. */
  const aday=S.market.filter(c=>!c.inspected && c.ask && c.ask<valueOf(c,false)*0.95
    && !(c.tramer>valueOf(c,false)*0.12 || c.degisen>=3));
  if(aday.length){
    const c=pick(aday);
    c.gunun=true;
    if(c.reserve) c.reserve=Math.round(c.reserve*0.97);   // fırsat ilanı zaten ucuz (v3 kararı 1)
  }
}
function gorevIlerle(sayac, adet){
  if(!S.gunluk) return;
  if(!S.gunSayac) gunSayacSifirla();
  S.gunSayac[sayac]=(S.gunSayac[sayac]||0)+(adet||1);
  let degisti=false;
  for(const g of S.gunluk.gorevler){
    if(g.odendi || g.sayac!==sayac) continue;
    if((S.gunSayac[sayac]||0)>=g.n){
      g.odendi=true; degisti=true;
      kasaHareket(g.nakit, `Görev: ${g.bas}`); S.xp+=g.xp;
      cal("seviye"); titre(HAPTIK.basari);
      toast(`Görev tamam: ${g.bas} &middot; +${tl(g.nakit)}`,"good");
    }
  }
  if(degisti && !S.gunluk.hepsiOdendi && S.gunluk.gorevler.every(g=>g.odendi)){
    S.gunluk.hepsiOdendi=true;
    kasaHareket(24000, "Üç görev ikramiyesi"); S.xp+=40;
    toast("Günün üç görevi de tamam — +₺24.000 ikramiye.","good");
  }
  if(degisti){ save(); renderHud(); }
}
/* ---- seri: gerçek takvim günü ---- */
function bugun(){ const d=new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
function dunDeger(){ const d=new Date(Date.now()-864e5); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
function seriGuncelle(){
  if(!S.seri) S.seri={n:0, son:null};
  const b=bugun();
  if(S.seri.son===b) return false;
  S.seri.n = (S.seri.son===dunDeger()) ? S.seri.n+1 : 1;
  S.seri.son=b;
  if(S.seri.n<2){ save(); return true; }     // ilk gün ikramiye yok
  const odul=Math.min(S.seri.n,7)*6000;
  kasaHareket(odul, `${S.seri.n}. gün seri ikramiyesi`);
  save();
  setTimeout(()=>toast(`${S.seri.n}. gün üst üste — +${tl(odul)} seri ikramiyesi.`,"good"), 700);
  return true;
}
/* ---- görünüm ---- */
function gunlukSerit(){
  if(!S.gunluk) return "";
  const g=S.gunluk.gorevler, bitti=g.filter(x=>x.odendi).length;
  const seri=(S.seri&&S.seri.n)||0;
  return `<div class="block gunluk">
    <div class="gbas"><h4 style="margin:0">GÜNÜN GÖREVLERİ</h4>
      <span class="gsay">${bitti}/3</span>
      ${seri>1?`<span class="gseri">${seri} gün seri</span>`:""}</div>
    ${g.map(x=>{
      const v=Math.min((S.gunSayac&&S.gunSayac[x.sayac])||0, x.n);
      return `<div class="gsatir ${x.odendi?"ok":""}">
        <span class="gtik">${x.odendi?"&#10003;":""}</span>
        <span class="gmet">${x.bas}</span>
        <span class="gilerle">${x.n>1?v+"/"+x.n:""}</span>
        <span class="godul">+${tl(x.nakit)}</span></div>`;
    }).join("")}
  </div>`;
}

/* ==================================================================
   USTA NOTU (1.1, kavranabilirlik oylaması Ö14)
   Gün raporu rakam veriyordu ama "ne oldu, şimdi ne yapmalı" demiyordu.
   İlk 7 günde ya da ilk 3 satışa kadar raporun başında Kaportacı Nuri'den
   tek cümle (≤140 karakter, en az bir rakam) ve tek eylem düğmesi.
   GNÇ'nin şartı: rapor en çok ~25 kelime uzar, kapat düğmesi yerinde kalır.
   Kural sırası: pahalı ilan → maliyet altı teklif → boş garaj → ekspertizsiz araç.
   ================================================================== */
function ustaNotu(ofs){
  if(S.ustaNotKapali) return null;
  if(!(S.day<=7 || ((S.stats&&S.stats.sold)||0)<3)) return null;
  ofs=ofs||[];
  if(!ofs.length){
    const ilan=S.cars.filter(c=>c.listPrice && c.daysListed>=2)
      .map(c=>({c, fark:c.listPrice/valueOf(c,!c.disclosed&&!c.inspected)-1}))
      .sort((a,b)=>b.fark-a.fark)[0];
    if(ilan && ilan.fark>0.02){
      const v=valueOf(ilan.c,!ilan.c.disclosed&&!ilan.c.inspected), yeni=Math.round(v*0.99/500)*500;
      return {t:`${ilan.c.model.n} ilanı piyasanın %${Math.round(ilan.fark*100)} üstünde, alıcı az geliyor.`,
              etiket:`${tlk(yeni)}'e indir`, act:"cutto", data:`data-id="${ilan.c.id}" data-v="${yeni}"`};
    }
  }
  const dusuk=ofs.map(o=>({o, c:S.cars.find(x=>x.id===o.carId)})).filter(x=>x.c && x.o.amount<carCost(x.c))
    .sort((a,b)=>(a.o.amount-carCost(a.c))-(b.o.amount-carCost(b.c)))[0];
  if(dusuk) return {t:`Teklif maliyetinin ${tlk(carCost(dusuk.c)-dusuk.o.amount)} altında; pazarlıkta kozlarını kullan.`,
              etiket:"Pazarlık et", act:"salenego", data:`data-oid="${dusuk.o.oid}"`};
  if(!S.cars.length){
    const n=S.market.filter(c=>c.ask<=S.cash).length;
    if(n) return {t:`Garaj boş, bütçene uyan ${n} ilan var. Ucuz ve temiz olanla başla.`,
                  etiket:"Pazara git", act:"ustapazar", data:""};
  }
  const ham=S.cars.find(c=>!c.listPrice && !c.konsinye);
  if(ham && !ham.inspected) return {t:`${ham.model.n} ${Math.max(1,S.day-(ham.boughtDay||S.day))} gündür bekliyor. Ekspertizsiz araç satılmaz: önce Hazırla.`,
              etiket:"Hazırla", act:"hazirla", data:`data-id="${ham.id}"`};
  if(ham) return {t:`${ham.model.n} hâlâ ilanda değil; her gün otopark parası yakıyor.`,
              etiket:"Hazırla", act:"hazirla", data:`data-id="${ham.id}"`};
  return null;
}

/* ---------------- GÜNÜN NOTLARI ----------------
   Gün raporunun altında yeni günün takvimi: sanayi günü, müzayede, taksit
   vadesi, süresi dolan teklif, kira gecesi. Eskiden bunlar "BUGÜN NE OLDU"
   olayları arasında kayboluyordu; galerici bunları masasındaki sarı nota
   yazar. En çok üç satır, önemli olan önce. */
function gunNotlari(){
  const n=[];
  try{ renderHud(); }catch(e){}     // HUD_SON yeni günün giderini taşısın
  const tk=(typeof takvimHesap==="function") ? takvimHesap(HUD_SON?HUD_SON.bugun:0) : null;
  if(tk && tk.eksik>0) n.push({kotu:true, t:`Kira gecesine ${tl(Math.ceil(tk.eksik/500)*500)} eksik var. Bir araç sat ya da gideri kıs.`});
  else if(tk && tk.kalan===1) n.push({t:`Bu gece kira kesiliyor: ${tl(tk.kira)}.`});
  else if(tk && tk.kalan<=3) n.push({t:`Kira ${tk.kalan} gün sonra: ${tl(tk.kira)}. Nakdi bağlama.`});
  const son=(S.offers||[]).filter(o=>o.expires<=S.day && S.cars.some(c=>c.id===o.carId)).length;
  if(son) n.push({t:`${son} teklifin bugün son günü; yarına kalmaz.`});
  if(typeof pazarGunu==="function" && pazarGunu()) n.push({t:"Bugün oto pazarı kurulu: sahada üç ilan fazla, erken gelen kapar."});
  else if(typeof pazarGunu==="function" && pazarGunu(S.day+1)) n.push({t:"Yarın oto pazarı kuruluyor: nakit ayır."});
  for(const sk of (typeof sikayetAcik==="function"?sikayetAcik():[]))
    n.push({kotu:true, t:`Hakem heyeti: ${sk.car.model.n} şikâyeti · ${Math.max(0,SIKAYET.sure-(S.day-sk.acildi))} gün içinde cevap ver.`});
  for(const c of (S.cars||[])) if(c.kapora && c.kapora.gelis===S.day)
    n.push({t:`Kaporalı ${c.model.n}: ${c.kapora.alici} bu akşam kalanı getiriyor.`});
  const vade=(S.receivables||[]).filter(r=>r.due===S.day+1).reduce((a,r)=>a+r.amount,0);
  if(vade) n.push({t:`Yarın taksit vadesi: ${tl(vade)} gelmesi bekleniyor.`});
  if(typeof sanayiGunu==="function" && sanayiGunu()) n.push({t:`Bugün sanayi günü: tamirler %${Math.round(SANAYI.indirim*100)} ucuz.`});
  else if(typeof sanayiyeKalan==="function" && sanayiyeKalan()===1) n.push({t:`Yarın sanayi günü: acil olmayan tamiri bekle.`});
  if(typeof unlocked==="function" && unlocked("muzayede")){
    if(S.auction.length && S.auctionDay===S.day) n.push({t:`Müzayede kuruldu: ${S.auction.length} araç, kapalı zarf.`});
    else if(typeof muzayedeyeKalan==="function" && muzayedeyeKalan()===1) n.push({t:`Yarın müzayede: nakit ve boş yer ayır.`});
  }
  return n.slice(0,3);
}
