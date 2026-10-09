/* ==================================================================
   CANLI AÇIK ARTIRMA

   Kapalı zarf sakin bir tahmin oyunu; canlı tur ise sinir. Her müzayede
   döneminde bir araç canlı satılır: açılış fiyatı düşük, saat 12 saniyeden
   geri sayar, her teklif saati en az 7 saniyeye geri kurar. Rakip
   galericiler kendi tavanlarına kadar yükseltir, saat azaldıkça daha
   atak olurlar (son saniye teklifi). En son teklif kimdeyse araç onun.

   Rakibin tavanı kapalı zarftaki zarfıyla aynı hesaptan gelir (rivalValue
   × kendi teklif karakteri); yani kapalı zarfta öğrendiğin şey burada da
   işe yarar. Canlı tur kayda yalnız "bu dönem oynandı mı" olarak yazılır;
   saat ve teklif geçmişi arayüz durumu (CANLI).
   ================================================================== */
const CANLI_AYAR={ baslangic:12000, uzatma:7000, tik:100 };
const CANLI={ aktif:false, oto:true, zaman:null, fiyat:0, lider:null, kalan:0, log:[], rakipler:[], adim:5000 };

function canliAc(){ return S.canli && S.canli.durum==="acik" && S.canli.bitis>=S.day ? S.canli : null; }

KANCA.gun.push(()=>{
  if(typeof unlocked==="function" && !unlocked("muzayede")) return;
  if(canliAc() || S.day<4) return;
  if(!S.auction || !S.auction.length) return;
  /* Her müzayede dönemine bir canlı lot. Bu kanca gün geçişinde müzayede
     yenilenmeden ÖNCE çalışıyor; "bugün kuruldu mu" diye bakınca lot hiç
     gelmiyordu. Dönemi kuruluş gününden tanıyoruz. */
  if(S.canli && S.canli.donem===S.auctionDay) return;
  S.canli={car:genCar({auction:true}), donem:S.auctionDay, bitis:S.day+2, durum:"acik"};
});

function canliAcilis(c){ return roundTo(valueOf(c,true)*0.45, 1000); }
function canliRakipler(c){
  const av=valueOf(c,true), acilis=canliAcilis(c), out=[];
  (S.rivals||[]).forEach((st,i)=>{
    const def=rivalDef(st,i);
    const fits=def.segs.includes(c.model.seg);
    let tavan=Math.round(rivalValue(c)*def.bid*rnd(fits?.92:.70, fits?1.06:.86)/1000)*1000;
    tavan=Math.min(tavan, Math.round((st.cash||def.cash)*.6));
    if(tavan>acilis*1.05) out.push({n:rivalDef(st,i).n, tavan, atak:def.aggr||.7});
  });
  return out.sort((a,b)=>b.tavan-a.tavan).slice(0,3);
}

function openCanli(){
  const L=canliAc(); if(!L) return;
  const c=L.car, av=valueOf(c,true);
  if(!CANLI.aktif){
    CANLI.fiyat=canliAcilis(c); CANLI.lider=null; CANLI.kalan=CANLI_AYAR.baslangic; CANLI.log=[];
    CANLI.adim=Math.max(5000, roundTo(av*0.02, 1000));
    CANLI.rakipler=canliRakipler(c);
  }
  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">Canlı a&ccedil;ık artırma</div>
      <div class="sheet-sub">${c.model.n} &middot; ${c.year} &middot; ${mesafe(c.km)}</div></div>
      <button class="x" data-act="canlicekil" aria-label="Kapat">&times;</button></div>
    <div id="canliKap" class="canli">
      <div class="aracsahne">${aracFoto(c,"tam")}</div>
      <div class="cn-pano">
        <span class="cn-et" id="cnLider">${CANLI.aktif?"":"A&Ccedil;ILIŞ"}</span>
        <b class="cn-fiyat" id="cnFiyat">${tl(CANLI.fiyat)}</b>
        <span class="cn-sure"><i id="cnSure" style="width:100%"></i></span>
        <span class="cn-sn" id="cnSn">${(CANLI.kalan/1000).toFixed(1)} sn</span>
      </div>
      <div class="cn-log" id="cnLog">${CANLI.aktif?"":`<div class="sec-note">${CANLI.rakipler.length} galerici masada.
        Ekspertiz yok, olduğu gibi. Saat her teklifte 7 saniyeye geri kurulur.</div>`}</div>
      <div class="cn-tus" id="cnTus">${canliTuslar()}</div>
      <div class="sec-note" style="text-align:center;margin-top:8px">Nakit: ${tl(S.cash)} &middot; park yerin ${Math.max(0,S.slots-S.cars.length)} boş</div>
    </div>`);
  canliCiz();
}
function canliTuslar(){
  if(!CANLI.aktif) return `<button class="btn primary full" data-act="canlibasla" ${S.cars.length>=S.slots?"disabled":""}>
    ${S.cars.length>=S.slots?"Park yerin dolu":"Masaya otur &middot; başlat"}</button>`;
  const sen=CANLI.lider==="sen";
  return `<div class="btn-row">${[1,2,5].map(k=>{
      const yeni=CANLI.fiyat+CANLI.adim*k;
      return `<button class="btn ${k===1?"primary":""}" data-act="canliteklif" data-k="${k}" ${sen||yeni>S.cash?"disabled":""}>
        +${tlk(CANLI.adim*k)}</button>`;}).join("")}</div>
    <button class="btn ghost full" data-act="canlicekil" style="margin-top:8px">${sen?"Liderdesin &middot; bekle":"&Ccedil;ekil"}</button>`;
}
function canliCiz(){
  const el=id=>document.getElementById(id);
  if(!el("canliKap")) return;
  el("cnFiyat").textContent=tl(CANLI.fiyat);
  el("cnLider").innerHTML=CANLI.aktif?(CANLI.lider?(CANLI.lider==="sen"?"SENDE":CANLI.lider.toLocaleUpperCase("tr")):"TEKLİF BEKLENİYOR"):"A&Ccedil;ILIŞ";
  el("cnLider").className="cn-et"+(CANLI.lider==="sen"?" sen":"");
  el("cnSure").style.width=Math.max(0,CANLI.kalan/CANLI_AYAR.baslangic*100).toFixed(1)+"%";
  el("cnSure").className=CANLI.kalan<3000?"az":"";
  el("cnSn").textContent=(Math.max(0,CANLI.kalan)/1000).toFixed(1)+" sn";
  if(CANLI.aktif) el("cnLog").innerHTML=CANLI.log.slice(-5).reverse().map(l=>
    `<div class="cn-satir ${l.sen?"sen":""}"><b>${l.kim}</b><span>${tl(l.fiyat)}</span></div>`).join("");
  el("cnTus").innerHTML=canliTuslar();
}
function _cnTeklif(kim, fiyat){
  CANLI.fiyat=fiyat; CANLI.lider=kim;
  CANLI.kalan=Math.max(CANLI.kalan, CANLI_AYAR.uzatma);
  CANLI.log.push({kim:kim==="sen"?"Sen":kim, fiyat, sen:kim==="sen"});
}
/** Saati ms kadar ilerletir. Testler doğrudan çağırıyor (CANLI.oto=false). */
function canliAdim(ms){
  if(!CANLI.aktif) return;
  for(let t=0;t<ms;t+=CANLI_AYAR.tik){
    CANLI.kalan-=CANLI_AYAR.tik;
    // rakip hamlesi: saat azaldıkça daha atak (son saniye teklifi)
    const baski=CANLI.kalan<3000?3.2:1;
    for(const r of CANLI.rakipler){
      if(CANLI.lider===r.n) continue;
      const yeni=CANLI.fiyat+CANLI.adim*(chance(.2)?2:1);
      if(yeni>r.tavan) continue;
      if(chance(.022*r.atak*baski)){ _cnTeklif(r.n, yeni); try{ cal("tik"); }catch(e){} break; }
    }
    if(CANLI.kalan<=0){ canliBitir(); return; }
  }
}
function canliBasla(){
  if(!canliAc() || CANLI.aktif) return;
  CANLI.aktif=true;
  if(CANLI.oto){
    clearInterval(CANLI.zaman);
    CANLI.zaman=setInterval(()=>{
      // sayfa başka bir yere geçtiyse oyuncu masadan kalkmış sayılır
      if(!document.getElementById("canliKap")){ canliCekil(); return; }
      canliAdim(CANLI_AYAR.tik); canliCiz();
    }, CANLI_AYAR.tik);
  }
  canliCiz();
}
function canliTeklif(k){
  if(!CANLI.aktif || CANLI.lider==="sen") return false;
  const yeni=CANLI.fiyat+CANLI.adim*k;
  if(yeni>S.cash){ toast("Nakit yetmiyor.","bad"); return false; }
  _cnTeklif("sen", yeni);
  try{ titre(HAPTIK.orta); }catch(e){}
  canliCiz();
  return true;
}
/** Masadan kalk: kalan süre oyuncusuz oynanır, sonuç yine yazılır. */
function canliCekil(){
  if(CANLI.aktif){ while(CANLI.aktif) canliAdim(1000); }
  else closeSheet();
}
function canliBitir(){
  clearInterval(CANLI.zaman); CANLI.zaman=null;
  CANLI.aktif=false;
  const L=S.canli; if(!L) return;
  const c=L.car;
  L.durum="bitti";
  let govde;
  if(CANLI.lider==="sen"){
    if(S.cars.length>=S.slots){ govde=`<div class="sec-note">Kazandın ama park yerin dolu — satış iptal.</div>`; L.sonuc="iptal"; }
    else if(CANLI.fiyat>S.cash){ govde=`<div class="sec-note">Kazandın ama nakit yetmedi.</div>`; L.sonuc="iptal"; }
    else{
      buyCar(c, CANLI.fiyat, "canlı müzayede"); S.wonAuction=true; L.sonuc="sen";
      const tv=valueOf(c,false);
      govde=`<div class="kv"><span>Ödediğin</span><b>${tl(CANLI.fiyat)}</b></div>
        <div class="kv"><span>Ger&ccedil;ek değeri</span><b class="${tv>CANLI.fiyat?"pos":"neg"}">${tl(tv)}</b></div>`;
      try{ cal("kasa"); }catch(e){}
    }
  }else{
    L.sonuc=CANLI.lider||"satılmadı";
    govde=CANLI.lider?`<div class="sec-note">${CANLI.lider} ${tl(CANLI.fiyat)} ile aldı.</div>`
                     :`<div class="sec-note">Kimse a&ccedil;ılışa girmedi, ara&ccedil; satılmadı.</div>`;
  }
  save();
  if(document.getElementById("canliKap")||!document.getElementById("modal").classList.contains("hidden"))
    openSheet(`<div class="sheet-head"><div>
        <div class="sheet-title">${L.sonuc==="sen"?"Senin oldu":"Tokmak indi"}</div>
        <div class="sheet-sub">${c.model.n} &middot; ${c.year}</div></div>
        <button class="x" data-act="close" aria-label="Kapat">&times;</button></div>
      <div class="block">${govde}</div>
      <button class="btn primary full" data-act="close">Tamam</button>`);
  try{ render(); }catch(e){}
}

/** Müzayede ekranının başındaki canlı lot kutusu. */
function canliBlok(){
  const L=canliAc();
  if(!L) return "";
  return `<button class="canli-kart" data-act="canliac">
    <span class="canli-foto">${aracFoto(L.car,"tam")}</span>
    <span class="canli-yazi"><span class="canli-rozet">● CANLI</span>
      <b>${L.car.model.n} <i>${L.car.year}</i></b>
      <span>A&ccedil;ılış ${tl(canliAcilis(L.car))} &middot; ${L.bitis-S.day<=0?"bug&uuml;n son g&uuml;n":(L.bitis-S.day+1)+" g&uuml;n a&ccedil;ık"}</span></span>
    <i>&rsaquo;</i></button>`;
}

KANCA.eylem.canliac=()=>openCanli();
KANCA.eylem.canlibasla=()=>canliBasla();
KANCA.eylem.canliteklif=b=>canliTeklif(+b.dataset.k);
KANCA.eylem.canlicekil=()=>canliCekil();
