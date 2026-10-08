/* ==================================================================
   KONSİNYE — başkasının aracını galeride satmak

   Burada önce FİLO vardı: aracı kiraya verip günlük gelir almak. Yer
   kıtlığı kurulunca filo kendi kendini cezalandıran bir özelliğe döndü —
   kiradaki araç park yerini işgal ediyor ama satılamıyordu, oyuncu
   kelepir kaçırmaya mahkûm oluyordu. Filo kaldırıldı, iskeleti ters
   yönde bir ekonomiye çevrildi:

     Biri aracını sana bırakıyor. Cebinden para çıkmıyor. Sahibi
     NET bir rakam istiyor; satarsan üstü senin. Ama araç YER KAPLIYOR
     ve sahibinin sabrı sınırlı — süre dolarsa aracını geri alıyor.

   Böylece konsinye yer kıtlığını güçlendiriyor: boş yeri olan oyuncu
   nakit bağlamadan kazanabiliyor, yeri dolu olan "bu emanet mi, o
   kelepir mi" diye seçmek zorunda kalıyor. Ekspertiz de anlam
   kazanıyor: sahibin söylediğiyle aracın gerçeği aynı olmayabilir.
   ================================================================== */
const KONS={
  sans:     0.22,      // boş yer varken günlük teklif olasılığı
  sansUn:   0.035,     // her memnun emanet sahibi ağızdan ağıza bu kadar ekler
  sansTavan:0.32,
  teklifGun:2,         // teklif kaç gün açık kalır
  tamirPay: 0.5,       // süre dolup araç geri dönerse sahibin ödediği tamir payı
  ilkGun:   3          // ilk teklif en erken bu günde
};

/* Sahip tipleri. net: gerçek değere göre istenen net oranı, sure: kaç
   gün bekler. Acelesi olan ucuza bırakır ama kısa süre verir; titiz
   sahip pahalı ister ama sabırlıdır. "saklar": kusur gizleme eğilimi. */
const KONS_SAHIP=[
  {k:"tasinan", n:"Yurt dışına taşınan Selin", line:"Haftaya u&ccedil;ağım var, satılınca hesabıma yatırırsın.",
   net:[.84,.89], sure:[5,7],  saklar:.15},
  {k:"miras",   n:"Miras kalan araba",         line:"Babamızdan kaldı, kardeşler anlaşamadık. Satılsın yeter.",
   net:[.86,.92], sure:[8,11], saklar:.05},
  {k:"emekli",  n:"Emekli &ouml;ğretmen Nail Bey", line:"Bakımları hep zamanında yapıldı, hakkını ver yeter.",
   net:[.92,.97], sure:[10,14],saklar:.02},
  {k:"sirket",  n:"Muhasebeci Ferda Hanım",    line:"Şirket aracını devrediyoruz, fatura kesilecek.",
   net:[.89,.93], sure:[7,10], saklar:.10},
  {k:"acil",    n:"Borcu sıkışan Erkan",       line:"Abi nakit lazım, ne kadar &ccedil;abuk o kadar iyi.",
   net:[.80,.86], sure:[4,6],  saklar:.45}
];

function konsSahip(k){ return KONS_SAHIP.find(s=>s.k===k)||KONS_SAHIP[1]; }
function konsBorcu(){ return S.cars.reduce((a,c)=>a+(c.konsinye?c.konsinye.net:0),0); }
function konsKalan(c){ return c.konsinye ? c.konsinye.bitis-S.day : 0; }

/** Yeni bir emanet teklifi kurar. Araç pazar üreticisinden geliyor,
    yani o modelin imza arızası ve gizli kusurları aynen geçerli. */
function konsTeklifUret(){
  const sh=pick(KONS_SAHIP);
  const c=genCar();
  // "Saklayan" sahip ilan dilinde kusuru söylemez — ekspertizsiz alan yanılır.
  if(!chance(sh.saklar)) c.faults.forEach(f=>{ if(!f.visible && chance(.5)) f.visible=true; });
  const deger=valueOf(c,false);
  const net=Math.round(deger*rnd(sh.net[0],sh.net[1])/2500)*2500;
  return {sahip:sh.k, car:c, net, sure:ri(sh.sure[0],sh.sure[1]), son:S.day+KONS.teklifGun};
}

/** Gün sonu: süre takibi, geri alma, yeni teklif. */
function konsinyeGun(rep){
  for(const c of [...S.cars]){
    if(!c.konsinye) continue;
    const kalan=konsKalan(c), sh=konsSahip(c.konsinye.sahip);
    if(kalan<0){
      const iade=Math.round((c.spent||0)*KONS.tamirPay/250)*250;
      S.cars=S.cars.filter(x=>x!==c);
      S.offers=(S.offers||[]).filter(o=>o.carId!==c.id);
      if(iade) S.cash+=iade;
      S.stats.konsIade=(S.stats.konsIade||0)+1;
      rep.events.push({bad:true, t:`<b>${sh.n}</b> sabrı tükendi, ${c.model.n}'yu geri aldı.`+
        (iade?` Yaptığın tamirin yarısını &ouml;dedi: ${tl(iade)}.`:"")});
    }else if(kalan===0){
      rep.events.push({bad:true, t:`${sh.n}: "Yarın akşama kadar satılmazsa aracı alırım." &mdash; ${c.model.n}`});
    }
  }
  // Açık teklifin süresi
  if(S.konsTeklif && S.day>S.konsTeklif.son){
    rep.events.push({t:`${konsSahip(S.konsTeklif.sahip).n} aracını başka bir galeriye bıraktı.`});
    S.konsTeklif=null;
  }
  if(S.konsTeklif || S.day<KONS.ilkGun || yerDolu()) return;
  const sans=Math.min(KONS.sansTavan, KONS.sans+(S.stats.konsMemnun||0)*KONS.sansUn);
  if(!chance(sans)) return;
  S.konsTeklif=konsTeklifUret();
  const t=S.konsTeklif, sh=konsSahip(t.sahip);
  rep.events.push({emanet:true, t:`<b>${sh.n}</b> aracını sana bırakmak istiyor: ${t.car.model.n} ${t.car.year}. `+
    `Net ${tl(t.net)} istiyor, &uuml;st&uuml; senin. ${t.sure} g&uuml;n bekler.`});
}

function konsKabul(){
  const t=S.konsTeklif; if(!t) return false;
  if(yerDolu()){ toast("Yerin dolu. Emanet ara&ccedil; da park yeri ister.","bad"); return false; }
  const c=t.car, sh=konsSahip(t.sahip);
  c.owned=true; c.boughtFor=t.net; c.spent=c.spent||0;
  c.boughtFrom=sh.n; c.boughtVia="konsinye"; c.askedAt=null;
  c.priceCuts=0; c.extras=c.extras||[]; c.seller=null; c.ask=null;
  c.boughtDay=S.day; c.daysListed=0; c.leadsSeen=0;
  c.konsinye={sahip:t.sahip, net:t.net, bas:S.day, bitis:S.day+t.sure};
  S.cars.push(c); S.konsTeklif=null;
  S.stats.konsAlim=(S.stats.konsAlim||0)+1;
  cal("anahtar"); dokun("al");
  toast(`${c.model.n} emanete alındı &mdash; ${t.sure} g&uuml;n i&ccedil;inde net ${tl(t.net)} &uuml;st&uuml;ne sat.`,"good");
  save(); return true;
}
function konsRed(){
  if(!S.konsTeklif) return;
  S.konsTeklif=null; cal("kapa"); save();
}
/** Oyuncu emaneti erkenden geri veriyor: yer açılır, tamir parası gider. */
function konsIade(c){
  if(!c||!c.konsinye) return false;
  const sh=konsSahip(c.konsinye.sahip);
  S.cars=S.cars.filter(x=>x!==c);
  S.offers=(S.offers||[]).filter(o=>o.carId!==c.id);
  S.rep=clamp(S.rep-0.5,0,100);
  toast(`${c.model.n} sahibine d&ouml;nd&uuml;. ${sh.n} pek memnun kalmadı.`,"bad");
  save(); return true;
}
/** sellCar içinden çağrılır: sahibine net ödenir, memnuniyet yazılır. */
function konsSatildi(c){
  if(!c.konsinye) return;
  S.cash-=c.konsinye.net;
  S.stats.konsSatis=(S.stats.konsSatis||0)+1;
  // Zamanında ve temiz satış: sahibi çevresine anlatır, teklifler sıklaşır.
  if(c.disclosed || hiddenIssues(c).length===0) S.stats.konsMemnun=(S.stats.konsMemnun||0)+1;
}

/** Garaj kartının altındaki emanet şeridi. */
function konsSerit(c){
  if(!c.konsinye) return "";
  const k=konsKalan(c);
  return `<div class="kiraserit">
    <span class="kirarozet">EMANET</span>
    <span class="kirabilgi">${konsSahip(c.konsinye.sahip).n} &middot; ${k<=0?"bug&uuml;n son g&uuml;n":k+" g&uuml;n"}</span>
    <b>net ${tlk(c.konsinye.net)}</b>
  </div>`;
}
/** Araç sayfasındaki emanet bloğu. */
function konsBlok(c){
  if(!c.konsinye) return "";
  const k=c.konsinye, sh=konsSahip(k.sahip), kalan=konsKalan(c);
  return `<div class="block emanet"><h4>EMANET &middot; ${sh.n}</h4>
    <div class="kv"><span>Sahibine &ouml;denecek net</span><b>${tl(k.net)}</b></div>
    <div class="kv"><span>Kalan s&uuml;re</span><b class="${kalan<=1?"neg":""}">${kalan<=0?"bug&uuml;n son g&uuml;n":kalan+" g&uuml;n"}</b></div>
    <div class="kv"><span>Bug&uuml;nk&uuml; değer</span><b style="color:var(--sodium)">${c.inspected?tl(valueOf(c,false)):"ekspertizsiz"}</b></div>
    <div class="sec-note" style="margin-top:6px">Netin &uuml;st&uuml;ndeki her lira senin. Tamir senin cebinden;
      s&uuml;re dolarsa sahibi yarısını &ouml;der. Erken iade yer a&ccedil;ar ama sahibini k&uuml;st&uuml;r&uuml;r.</div>
    <button class="btn ghost full" data-act="konsiade" data-id="${c.id}" style="margin-top:9px">Sahibine iade et</button>
  </div>`;
}
/** Emanet teklifinin ayrıntı sayfası. */
function openKonsTeklif(){
  const t=S.konsTeklif; if(!t) return;
  const c=t.car, sh=konsSahip(t.sahip);
  const av=valueOf(c,true);
  const fark=Math.round(av-t.net);
  openSheet(`<div class="sheet-head"><div>
      <div class="sheet-title">Emanet teklifi</div>
      <div class="sheet-sub">${sh.n}</div></div>
      <button class="x" data-act="close" aria-label="Kapat">&times;</button></div>
    <div class="kons-sahip"><div class="cav yuzlu">${yuzSvg(sh.k, 62)}</div>
      <div class="quote" style="margin:0">"${sh.line}"</div></div>
    <div class="aracsahne">${aracFoto(c,"tam")}</div>
    <div class="block"><h4>${c.model.n} ${c.year}</h4>
      <div class="kv"><span>Kilometre</span><b>${mesafe(c.km)}</b></div>
      <div class="kv"><span>Sahibinin istediği net</span><b>${tl(t.net)}</b></div>
      <div class="kv"><span>G&ouml;r&uuml;nen değer</span><b style="color:var(--sodium)">~${tlk(av)}</b></div>
      <div class="kv"><span>G&ouml;r&uuml;nen pay</span><b class="${fark>=0?"pos":"neg"}">${fark>=0?"+":""}${tl(fark)}</b></div>
      <div class="kv"><span>Bekleme s&uuml;resi</span><b>${t.sure} g&uuml;n</b></div>
      <div class="sec-note" style="margin-top:6px">Cebinden para &ccedil;ıkmaz ama bir park yeri tutar.
        Sahibinin s&ouml;ylediğini ekspertiz doğrulamadı &mdash; g&ouml;r&uuml;nen pay yanıltabilir.</div>
    </div>
    <div class="actionbar"><div class="btn-row">
      <button class="btn" data-act="konsred">Geri &ccedil;evir</button>
      <button class="btn primary" data-act="konskabul" ${yerDolu()?"disabled":""}>${yerDolu()?"Yer yok":"Emanete al"}</button>
    </div><div class="hint">Teklif ${Math.max(0,t.son-S.day)} g&uuml;n daha a&ccedil;ık &middot; ${S.cars.length}/${S.slots} dolu</div></div>`);
}
