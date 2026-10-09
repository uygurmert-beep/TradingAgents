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
  const aday=S.market.filter(c=>!c.inspected);
  if(aday.length){
    const c=pick(aday);
    c.gunun=true;
    if(c.reserve) c.reserve=Math.round(c.reserve*0.94);
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
      S.cash+=g.nakit; S.xp+=g.xp;
      cal("seviye"); titre(HAPTIK.basari);
      toast(`Görev tamam: ${g.bas} &middot; +${tl(g.nakit)}`,"good");
    }
  }
  if(degisti && !S.gunluk.hepsiOdendi && S.gunluk.gorevler.every(g=>g.odendi)){
    S.gunluk.hepsiOdendi=true;
    S.cash+=24000; S.xp+=40;
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
  S.cash+=odul;
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
