/* ==================================================================
   YAN GÖREVLER — uzun oyunda baskı ve satış sonrası yaşam

   Denge simülasyonu 121 günde düz bir çizgi çiziyordu: 30. günden sonra
   her gün bir öncekinin kopyasıydı. Dört yan görev bu düzlüğü kırıyor,
   her biri oyunun başka bir kararını zorluyor:

     TOPTAN PARTİ   Galerici üç aracı tek fiyata veriyor, tanesi ~%15
                    ucuz — ama üç boş yer istiyor ve ekspertize izin
                    vermiyor. Büyütme baskısını doğrudan paraya çeviriyor.

     DÖNEN MÜŞTERİ  Siparişi memnun teslim ettiğin müşteri iki hafta
                    sonra daha büyük bütçeyle geri geliyor. İtibarın
                    ilk somut, isimli karşılığı.

     SANAYİ GÜNÜ    Nuri on günde bir toplu tamir yapıyor, işçilik %30
                    ucuz. Arızalı aracı o güne saklamak strateji oluyor:
                    stok tutmanın ilk olumlu sebebi.

     SEZON HEDEFİ   Mal sahibi her sezon bir kâr hedefi koyuyor. Tutarsa
                    gelecek sezonun kirası donuyor ve indiriliyor. Kira
                    cezadan yarışa dönüyor.
   ================================================================== */
const PARTI={
  sans:     0.15,          // günlük olasılık (koşullar uygunsa)
  ilkGun:   6,
  adet:     3,
  indirim:  [0.13,0.17],   // tek tek istenen toplam fiyata göre
  sure:     2,             // teklif kaç gün açık kalır
  bekleme:  5              // bir partiden sonra en az kaç gün yeni parti gelmez
};
const DONUS={
  gun:      [11,16],       // memnun müşteri kaç gün sonra döner
  butceKat: 1.28,          // her memnun dönüşte bütçe çarpanı
  katTavan: 2.2,
  primKat:  1.35
};
const SANAYI={ aralik:10, indirim:0.30 };
/* Hedef kendini yükseltiyor: kiranın katı ile geçen sezonun kârının
   %10 fazlasından büyük olanı. Sabit kat denenmişti; denge botu bile
   8 sezonun 7'sinde tutturuyordu, hedef bir yarış değil formaliteydi. */
const HEDEF={ kiraKat:3.2, taban:250000, indirim:0.25, artis:1.10 };

/* ---------------- TOPTAN PARTİ ---------------- */
function partiUret(){
  const satici=(S.rivals&&S.rivals.length) ? pick(S.rivals).n : "Galerici Vedat";
  const cars=[];
  for(let i=0;i<PARTI.adet;i++) cars.push(genCar());
  /* Galerici partiye bir "elinde kalmışı" sıkıştırır: üçünden biri ağır
     gizli kusurlu. İndirim bunun bedeli — ekspertizsiz alanın riski. */
  const kotu=pick(cars);
  const f=pick(FAULTS.filter(x=>x.cost>=40000)) || pick(FAULTS);
  const cm=clamp(.5 + valueOf(kotu,false)/3000000, .5, 1.5);
  kotu.faults.push({id:_uid++, k:f.k, n:f.n, comp:f.c,
    cost:Math.round(f.cost*cm*rnd(.9,1.2)/250)*250, gain:f.gain, dm:f.dm, visible:false, fixed:false});
  const tekTek=cars.reduce((a,c)=>a+c.ask,0);
  const ind=rnd(PARTI.indirim[0],PARTI.indirim[1]);
  return {satici, cars, tekTek, fiyat:Math.round(tekTek*(1-ind)/5000)*5000, son:S.day+PARTI.sure};
}
function partiBosYer(){ return S.slots-S.cars.length; }
function partiAl(){
  const p=S.parti; if(!p) return false;
  if(partiBosYer()<p.cars.length){ toast(`Parti i&ccedil;in ${p.cars.length} boş yer gerekiyor.`,"bad"); return false; }
  if(S.cash<p.fiyat){ toast("Nakit yetmiyor. Parti senetle alınmaz.","bad"); return false; }
  S.cash-=p.fiyat;
  const oran=p.fiyat/p.tekTek;
  for(const c of p.cars){
    const fiyat=Math.round(c.ask*oran/500)*500;
    c.boughtFrom=p.satici; c.boughtVia="parti"; c.askedAt=c.ask;
    c.priceCuts=0; c.extras=c.extras||[];
    c.owned=true; c.boughtFor=fiyat; c.seller=null; c.ask=null;
    c.boughtDay=S.day; c.daysListed=0; c.leadsSeen=0;
    S.cars.push(c);
    S.stats.bought++; gorevIlerle("al"); kolAlim(c);
  }
  cGain("vedat");
  S.stats.parti=(S.stats.parti||0)+1;
  S.partiSon=S.day; S.parti=null;
  cal("kasa"); dokun("al"); nefes("good");
  toast(`Parti alındı &mdash; ${p.cars.length} ara&ccedil;, ${tl(p.fiyat)}. Ekspertizlerini yaptır.`,"good");
  save(); return true;
}
function openParti(){
  const p=S.parti; if(!p) return;
  const bos=partiBosYer(), kazanc=p.tekTek-p.fiyat;
  const yerYok=bos<p.cars.length, paraYok=S.cash<p.fiyat;
  openSheet(`<div class="sheet-head"><div>
      <div class="sheet-title">Toptan parti</div>
      <div class="sheet-sub">${p.satici} &middot; ${p.cars.length} ara&ccedil; tek fiyata</div></div>
      <button class="x" data-act="close" aria-label="Kapat">&times;</button></div>
    <div class="quote">"Hepsini birden alırsan fiyatta anlaşırız. Tek tek vermem, ekspertize de vakit yok."</div>
    <div class="partiler">${p.cars.map(c=>`<div class="partiarac">
        <div class="pa-gor">${aracFoto(c)}</div>
        <div class="pa-ad"><b>${adBol(c.model.n).ad}</b><span>${c.year} &middot; ${mesafe(c.km)}</span></div>
        <div class="pa-fiyat">${tlk(c.ask)}</div></div>`).join("")}</div>
    <div class="block">
      <div class="kv"><span>Tek tek istenen</span><b>${tl(p.tekTek)}</b></div>
      <div class="kv"><span>Parti fiyatı</span><b style="color:var(--sodium)">${tl(p.fiyat)}</b></div>
      <div class="kv"><span>G&ouml;r&uuml;nen indirim</span><b class="pos">${tl(kazanc)} &middot; %${Math.round(kazanc/p.tekTek*100)}</b></div>
      <div class="kv"><span>Gereken boş yer</span><b class="${yerYok?"neg":""}">${p.cars.length} &middot; sende ${Math.max(0,bos)}</b></div>
      <div class="sec-note" style="margin-top:6px">Galerici partiye genelde elinde kalmış bir aracı sıkıştırır.
        İndirim o riskin bedeli. Ekspertiz ancak aldıktan sonra.</div>
    </div>
    <div class="actionbar">
      ${yerYok?`<button class="btn full" data-act="buyslot" ${S.cash<slotFiyat()?"disabled":""}>+1 kontenjan &middot; ${tl(slotFiyat())}</button>`:""}
      <button class="btn primary full" data-act="partial" ${yerYok||paraYok?"disabled":""} ${yerYok?'style="margin-top:8px"':""}>
        ${yerYok?`${p.cars.length-Math.max(0,bos)} yer daha gerekiyor`:paraYok?"Nakit yetmiyor":`Partiyi al &middot; ${tl(p.fiyat)}`}</button>
      <div class="hint">Teklif ${Math.max(0,p.son-S.day)} g&uuml;n daha a&ccedil;ık</div>
    </div>`);
}

/* ---------------- DÖNEN MÜŞTERİ ---------------- */
/** Sipariş memnun teslim edildiğinde çağrılır. */
function musteriMemnun(o){
  const kayit=(S.musteriler=S.musteriler||{});
  const m=kayit[o.who]=kayit[o.who]||{memnun:0, toplam:0};
  m.memnun++; m.toplam+=o.butce+o.prim; m.son=S.day;
  S.donecek=(S.donecek||[]).filter(d=>d.who!==o.who);
  S.donecek.push({who:o.who, gun:S.day+ri(DONUS.gun[0],DONUS.gun[1])});
}
/** Müşteri küstüyse (gizli kusur, ret) dönüş iptal ve sayaç sıfırlanır. */
function musteriKustu(o){
  S.donecek=(S.donecek||[]).filter(d=>d.who!==o.who);
  if(S.musteriler&&S.musteriler[o.who]) S.musteriler[o.who].memnun=0;
}
function donusSiparisi(d){
  const cust=ORDER_CUSTOMERS.find(c=>c.n===d.who);
  if(!cust) return null;
  const m=(S.musteriler||{})[d.who]||{memnun:1};
  const o=genOrder(S.day, level(), cust);
  const kat=Math.min(DONUS.katTavan, Math.pow(DONUS.butceKat, m.memnun));
  o.butce=Math.round(o.butce*kat/2500)*2500;
  o.prim=Math.round(o.prim*DONUS.primKat/1000)*1000;
  o.deadline+=3; o.donen=m.memnun;
  o.line=m.memnun>1 ? `${m.memnun}. kez geliyorum. Sana g&uuml;veniyorum, bu sefer daha iyisini istiyorum.`
                    : "Ge&ccedil;en sefer &ccedil;ok memnun kaldım. B&uuml;t&ccedil;eyi b&uuml;y&uuml;tt&uuml;m.";
  return o;
}

/* ---------------- SANAYİ GÜNÜ ---------------- */
function sanayiGunu(gun){ return ((gun||S.day)%SANAYI.aralik)===0; }
function sanayiyeKalan(){ const r=S.day%SANAYI.aralik; return r===0?0:SANAYI.aralik-r; }
function sanayiKat(){ return sanayiGunu() ? 1-SANAYI.indirim : 1; }

/* ---------------- SEZON HEDEFİ ---------------- */
/* Hedefin dönemi kira kapanışına göre sayılıyor, takvim sezonuna göre
   değil: kapanış 16., 31., … günün SONUNDA işliyor, o gün takvimde yeni
   sezonun ilk günü olsa da kâr hâlâ biten döneme yazılıyor. seasonIndex()
   kullanılınca 16. gün hedef erkenden yenileniyor, oyuncu son gününde
   başka bir rakama bakıyordu. */
function hedefDonem(){ return Math.floor(Math.max(0,S.day-2)/SEASON_LEN); }
function hedef(){
  const si=hedefDonem();
  if(!S.hedef || S.hedef.sezon!==si){
    const tutar=Math.round(Math.max(HEDEF.taban, sezonKirasi()*HEDEF.kiraKat,
                                     (S.hedefSon||0)*HEDEF.artis)/10000)*10000;
    S.hedef={sezon:si, tutar};
  }
  return S.hedef;
}
function hedefIlerleme(){ const h=hedef(); return clamp((S.seasonProfit||0)/h.tutar,0,1); }
/** Sezon kapanışında ödenecek kira: önceki sezonun hedefi tuttuysa donuk ve indirimli. */
function kapanisKirasi(rep){
  let kira=sezonKirasi();
  if(S.kiraDonuk){
    const eski=kira;
    kira=Math.round(Math.min(kira, S.kiraDonuk)*(1-HEDEF.indirim)/500)*500;
    rep.events.push({t:`Mal sahibi s&ouml;z&uuml;n&uuml; tuttu: kira donuk ve indirimli &mdash; ${tl(kira)} (normali ${tl(eski)}).`});
    S.kiraDonuk=null;
  }
  // Biten sezonun hedefi. Ekran hiç çizilmediyse (simülasyon, arka plan)
  // hedef henüz kurulmamış olabilir — burada kuruluyor ki dönem atlanmasın.
  const h=S.hedef||hedef();
  if(h){
    if((S.seasonProfit||0)>=h.tutar){
      S.kiraDonuk=sezonKirasi();
      S.stats.hedefTuttu=(S.stats.hedefTuttu||0)+1;
      rep.events.push({t:`<b>Sezon hedefi tuttu.</b> ${tl(S.seasonProfit)} k&acirc;r, hedef ${tl(h.tutar)}. `+
        `Gelecek sezon kiran donuk ve %${Math.round(HEDEF.indirim*100)} indirimli.`});
    }else{
      rep.events.push({bad:true, t:`Sezon hedefi ka&ccedil;tı: ${tl(S.seasonProfit||0)} / ${tl(h.tutar)}. Kira normal işleyecek.`});
    }
    S.hedefSon=S.seasonProfit||0;
    S.hedef=null;
  }
  return kira;
}

/* ---------------- gün sonu ---------------- */
function yanGorevGun(rep){
  // parti süresi
  if(S.parti && S.day>S.parti.son){
    rep.events.push({t:`${S.parti.satici} partiyi başka galeriye verdi.`});
    S.parti=null;
  }
  if(!S.parti && S.day>=PARTI.ilkGun && S.day-(S.partiSon||0)>=PARTI.bekleme && chance(PARTI.sans)){
    S.parti=partiUret();
    rep.events.push({parti:true, t:`<b>${S.parti.satici}</b> toptan parti teklif ediyor: ${S.parti.cars.length} ara&ccedil; `+
      `${tl(S.parti.fiyat)} &mdash; tek tek ${tl(S.parti.tekTek)}. ${S.parti.cars.length} boş yer gerekiyor.`});
  }
  // dönen müşteriler
  for(const d of [...(S.donecek||[])]){
    if(d.gun>S.day || (S.orders||[]).length>=3) continue;
    S.donecek=S.donecek.filter(x=>x!==d);
    const o=donusSiparisi(d); if(!o) continue;
    S.orders.push(o);
    rep.events.push({siparis:true, t:`<b>${o.who} geri d&ouml;nd&uuml;.</b> ${SEGLBL[o.seg]} arıyor, b&uuml;t&ccedil;e ${tl(o.butce)} + prim ${tl(o.prim)}.`});
  }
  // sanayi günü duyurusu
  if(sanayiGunu()) rep.events.push({t:`<b>Bug&uuml;n sanayi g&uuml;n&uuml;.</b> Nuri toplu tamirde, işçilik %${Math.round(SANAYI.indirim*100)} ucuz.`});
  else if(sanayiyeKalan()===2) rep.events.push({t:`Nuri haber yolladı: iki g&uuml;n sonra sanayi g&uuml;n&uuml;, tamirler %${Math.round(SANAYI.indirim*100)} ucuz.`});
}
