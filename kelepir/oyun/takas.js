/* ==================================================================
   TAKAS — alıcının eski aracı

   Takas teklifi eskiden körlemesine bir evet/hayırdı: alıcı aracına bir
   değer biçiyordu, sen ekspertizsiz devralıyordun. Oysa takasın bütün
   oyunu o aracı okumak: alıcı kendi aracını %18 eksik de, %12 fazla da
   biçebilir. Artık:
     • takas aracının kendi sayfası var (3B fotoğraf, görünen kusurlar,
       senin tahmini değer aralığın),
     • ekspertize sokabilirsin — gerçek değer ve gizli kusurlar çıkar,
     • biçtiği değeri kırmayı deneyebilirsin. Ekspertizde kusur bulduysan
       elinde kanıt var, alıcı daha kolay iner. İki ret, son sözü olur.
   İyi okunan takas iki kez kazandırır: sattığın araçtan ve aldığından.
   ================================================================== */
const TAKAS={ eksperGerekce:.25, kirmaAdim:[8,15], enFazlaRet:2 };

function takasOffer(oid){ const o=getOffer(oid); return (o&&o.takas)?o:null; }

/** Alıcının gözünde kırmanın kabul olasılığı. Saf fonksiyon (test ediliyor). */
function takasKabulOlasiligi(t, yeni){
  const oran=yeni/t.ilk;
  let p=1-(1-oran)*4;                          // %8 → .68, %15 → .40
  if(t.bakildi && t.real<t.ilk) p+=TAKAS.eksperGerekce;  // kanıt masada
  if(yeni>=t.real) p+=.15;                     // hâlâ adil: itiraz azalır
  return clamp(p, .05, .95);
}

/** Teklif kartındaki takas kutusu (offerCard). */
function takasBlok(o){
  const t=o.takas; if(!t.ilk) t.ilk=t.claim;
  const bos=Math.max(0,S.slots-S.cars.length);
  return `<div class="takas-kutu">
    <div class="takas-ust">
      <div class="takas-foto">${aracFoto(t.car,"tam")}</div>
      <div class="takas-bilgi">
        <span class="takas-et">TAKAS TEKLİFİ</span>
        <b>${t.car.model.n} <i>${t.car.year}</i></b>
        <span>${mesafe(t.car.km)} &middot; ${t.car.gear}</span>
      </div>
    </div>
    <div class="kv"><span>Aracına bi&ccedil;tiği değer</span><b>${tl(t.claim)}${t.claim<t.ilk?` <s>${tlk(t.ilk)}</s>`:""}</b></div>
    <div class="kv"><span>&Uuml;st&uuml;ne vereceği nakit</span><b style="color:var(--gold)">${tl(o.amount-t.claim)}</b></div>
    ${t.bakildi?`<div class="kv"><span>Ekspertize g&ouml;re ger&ccedil;ek değeri</span>
      <b class="${t.real>=t.claim?"pos":"neg"}">${tl(t.real)}</b></div>`:""}
    <button class="btn full" data-act="takasac" data-oid="${o.oid}" style="margin-top:9px">
      Takas aracını incele${t.bakildi?"":" &middot; ekspertiz, pazarlık"}</button>
    <div class="sec-note" style="margin-top:6px">Park yerin ${bos} boş.</div>
  </div>`;
}

function openTakas(oid){
  const o=takasOffer(oid); if(!o) return;
  const t=o.takas, c=t.car; if(!t.ilk) t.ilk=t.claim;
  const av=valueOf(c,true);
  const gorunen=c.faults.filter(f=>!f.fixed && known(c,f));
  const ep=eksperFiyat();
  const kilit=(t.ret||0)>=TAKAS.enFazlaRet;
  const fark=t.real-t.claim;
  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">Takas aracı</div>
      <div class="sheet-sub">${c.model.n} &middot; ${c.year} &middot; ${mesafe(c.km)} &middot; ${c.color}</div></div>
      <button class="x" data-act="close" aria-label="Kapat">&times;</button></div>
    <div class="aracsahne">${aracFoto(c,"tam")}</div>
    <div class="block"><h4>ALICININ BİÇTİĞİ</h4>
      <div class="kv"><span>Takas değeri</span><b>${tl(t.claim)}</b></div>
      <div class="kv"><span>Sattığın ara&ccedil; i&ccedil;in toplam</span><b>${tl(o.amount)}</b></div>
      <div class="kv"><span>Eline ge&ccedil;ecek nakit</span><b style="color:var(--gold)">${tl(o.amount-t.claim)}</b></div>
    </div>
    <div class="block"><h4>${t.bakildi?"EKSPERTİZ SONUCU":"SENİN TAHMİNİN &middot; EKSPERTİZSİZ"}</h4>
      ${t.bakildi
        ?`<div class="kv"><span>Ger&ccedil;ek değeri</span><b class="${fark>=0?"pos":"neg"}">${tl(t.real)}</b></div>
          <div class="takas-hukum ${fark>=0?"iyi":"kotu"}">${fark>=0
            ?`Aracını <b>${tlk(fark)}</b> ucuz bi&ccedil;miş. Takas sana kazandırıyor.`
            :`Aracını <b>${tlk(-fark)}</b> pahalı bi&ccedil;miş. Değerini kırmak i&ccedil;in kanıtın var.`}</div>`
        :`<div class="kv"><span>G&ouml;r&uuml;nene g&ouml;re</span><b>${tlk(av*0.86)} &ndash; ${tlk(av*1.06)}</b></div>
          <div class="sec-note" style="margin-top:6px">Kaputun altını g&ouml;rmeden bu aralık. Alıcı aracını
            hem eksik hem fazla bi&ccedil;ebilir.</div>`}
      ${gorunen.length?`<div class="takas-kusur">${gorunen.map(f=>`<span class="chip warn">${f.n}</span>`).join("")}</div>`:""}
    </div>
    <div class="block"><h4>DEĞERİNİ KIR</h4>
      ${kilit?`<div class="sec-note">“Son s&ouml;z&uuml;m bu, kardeşim.” Alıcı daha inmiyor.</div>`
      :`<div class="btn-row">${TAKAS.kirmaAdim.map(k=>{
          const yeni=Math.round(t.claim*(1-k/100)/1000)*1000;
          return `<button class="btn" data-act="takaskir" data-oid="${o.oid}" data-k="${k}">
            &minus;%${k} &middot; ${tlk(yeni)}<em>%${Math.round(takasKabulOlasiligi(t,yeni)*100)} ihtimal</em></button>`;}).join("")}</div>
        <div class="sec-note" style="margin-top:6px">${t.bakildi&&t.real<t.ilk
          ?"Ekspertiz raporu elinde: alıcı daha kolay iner."
          :"Kanıtsız kırmak zor. Ekspertiz kusur bulursa elin g&uuml;&ccedil;lenir."} ${TAKAS.enFazlaRet-(t.ret||0)} hakkın var.</div>`}
    </div>
    <div class="actionbar">
      ${t.bakildi?"":`<button class="btn full" data-act="takaseksper" data-oid="${o.oid}" ${S.cash<ep?"disabled":""}>
        Ekspertize sok &middot; ${tl(ep)}</button>`}
      <button class="btn primary full" data-act="taketakas" data-oid="${o.oid}" ${S.cars.length>=S.slots?"disabled":""}
        style="margin-top:8px">Takası al &middot; ${tl(o.amount-t.claim)} nakit</button>
    </div>`);
}

function takasEksper(oid){
  const o=takasOffer(oid); if(!o) return;
  const t=o.takas, ep=eksperFiyat();
  if(t.bakildi) return;
  if(S.cash<ep){ toast("Ekspertize nakit yetmiyor.","bad"); return; }
  S.cash-=ep; t.bakildi=true; t.car.inspected=true;
  t.real=valueOf(t.car,false);
  try{ cGain("hakan"); }catch(e){}
  toast(t.real<t.claim?"Ekspertiz kusur buldu — pazarlıkta kozun var.":"Ekspertiz temiz çıktı.", t.real<t.claim?"bad":"good");
  save(); renderHud(); openTakas(oid);
}

function takasKir(oid, k){
  const o=takasOffer(oid); if(!o) return null;
  const t=o.takas; if(!t.ilk) t.ilk=t.claim;
  if((t.ret||0)>=TAKAS.enFazlaRet) return null;
  const yeni=Math.round(t.claim*(1-k/100)/1000)*1000;
  const kabul=chance(takasKabulOlasiligi(t,yeni));
  if(kabul){
    t.claim=yeni; t.cash=o.amount-yeni;
    toast(`Alıcı indi: takas değeri ${tl(yeni)}.`,"good");
  }else{
    t.ret=(t.ret||0)+1;
    toast(t.ret>=TAKAS.enFazlaRet?"“Son sözüm bu.” Alıcı inmiyor.":"“Olmaz, arabam ondan iyi.” Alıcı direndi.","bad");
  }
  save(); openTakas(oid);
  return kabul;
}

KANCA.eylem.takasac=b=>openTakas(b.dataset.oid);
KANCA.eylem.takaseksper=b=>takasEksper(b.dataset.oid);
KANCA.eylem.takaskir=b=>takasKir(b.dataset.oid, +b.dataset.k);
