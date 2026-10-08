/* ==================================================================
   FİLO — aracı satmak yerine kiraya vermek
   Oyuna yeni bir karar katmanı açıyor: "çevir mi, tut mu".
   Kiraya verilen araç her gün para getiriyor ama her gün km yiyor,
   aşınıyor ve arıza riski taşıyor. Hızlı çevirmek kadar kazandırmaz;
   karşılığında satış riski yok ve satılmayan stok para yakmayı bırakıyor.
   Kural: yalnızca ekspertizi yapılmış ve açık arızası olmayan araç
   kiraya verilebilir — yoldaki araç sağlam olmak zorunda.
   ================================================================== */
const KIRA={
  oran:   0.0022,   // günlük gelir = aracın değeri × bu
  kmGun:  [180,420],// günlük km aralığı
  asinma: 0.18,     // her parçaya günlük aşınma
  arizaGun:0.016,   // günlük yeni arıza olasılığı (30 günde ~%38)
  enAzGun: 2        // en az bu kadar gün kirada kalır
};

function kiraUygunMu(c){
  if(!c || !c.owned) return {ok:false, n:"Bu araç sende değil."};
  if(c.kira) return {ok:false, n:"Zaten kirada."};
  if(c.listPrice) return {ok:false, n:"İlandaki araç kiraya verilemez. Önce ilandan çek."};
  if(!c.inspected) return {ok:false, n:"Önce ekspertiz gerekiyor — kiracıya sağlam araç verilir."};
  if(openFaults(c).length) return {ok:false, n:"Açık arızası olan araç kiraya verilemez."};
  return {ok:true};
}
function kiraGelir(c){ return Math.round(valueOf(c,false)*KIRA.oran/50)*50; }

function kirayaVer(c){
  const u=kiraUygunMu(c);
  if(!u.ok){ toast(u.n,"bad"); return false; }
  c.kira={bas:S.day, gelirGun:kiraGelir(c), toplam:0, gun:0};
  cal("anahtar"); dokun("al");
  toast(`${c.model.n} kiraya verildi — g&uuml;nl&uuml;k ${tl(c.kira.gelirGun)}.`,"good");
  save(); return true;
}
function kiradanAl(c){
  if(!c.kira) return false;
  const k=c.kira;
  if(k.gun<KIRA.enAzGun){
    toast(`S&ouml;zleşme en az ${KIRA.enAzGun} g&uuml;n &mdash; ${KIRA.enAzGun-k.gun} g&uuml;n daha.`,"bad");
    return false;
  }
  c.kira=null;
  cal("kapa");
  toast(`${c.model.n} filodan &ccedil;ıktı &mdash; toplam ${tl(k.toplam)} getirdi.`,"good");
  save(); return true;
}

/** Gün dönüşünde çağrılır: gelir, aşınma ve arıza riski. */
function kiraGun(rep){
  let gelir=0, bozulan=[];
  for(const c of S.cars){
    if(!c.kira) continue;
    const k=c.kira;
    k.gun++;
    // gelir sözleşme günündeki değerden sabit — kiracı her gün pazarlık etmiyor
    gelir+=k.gelirGun; k.toplam+=k.gelirGun;
    // yol bedeli
    c.km += ri(KIRA.kmGun[0], KIRA.kmGun[1]);
    for(const p of COMPKEYS) c.wear[p]=clamp(c.wear[p]+KIRA.asinma*rnd(.7,1.3), 0, 62);
    // arıza riski
    if(chance(KIRA.arizaGun)){
      const f=pick(FAULTS);
      const cm=clamp(.5 + valueOf(c,false)/3000000, .5, 1.5);
      c.faults.push({id:Math.round(Math.random()*1e9), n:f.n, comp:f.c,
        cost:Math.round(f.cost*cm*rnd(.85,1.2)/250)*250, gain:f.gain, dm:f.dm,
        visible:true, fixed:false});
      c.kira=null;                       // arızalı araç yolda kalmaz, filodan düşer
      bozulan.push(`${c.model.n} kiradayken arızalandı (${f.n}) &mdash; filodan &ccedil;ıkarıldı.`);
    }
  }
  if(gelir){
    S.cash+=gelir;
    S.stats.kiraGeliri=(S.stats.kiraGeliri||0)+gelir;
    rep.costs.push(["Filo kira geliri", -gelir]);   // negatif gider = gelir
  }
  for(const b of bozulan) rep.events.push({bad:true, t:b});
  return gelir;
}

/** Garaj kartında ve araç sayfasında gösterilen kira şeridi. */
function kiraSerit(c){
  if(!c.kira) return "";
  const k=c.kira;
  return `<div class="kiraserit">
    <span class="kirarozet">FİLODA</span>
    <span class="kirabilgi">${k.gun}. g&uuml;n &middot; toplam ${tl(k.toplam)}</span>
    <b>${tl(k.gelirGun)}/g&uuml;n</b>
  </div>`;
}
/** Araç sayfasındaki filo bloğu. */
function kiraBlok(c){
  if(c.kira){
    const k=c.kira;
    return `<div class="block"><h4>FİLODA</h4>
      <div class="kv"><span>G&uuml;nl&uuml;k gelir</span><b class="pos">${tl(k.gelirGun)}</b></div>
      <div class="kv"><span>Ka&ccedil;ıncı g&uuml;n</span><b>${k.gun}</b></div>
      <div class="kv"><span>Bug&uuml;ne kadar getirdiği</span><b class="pos">${tl(k.toplam)}</b></div>
      <div class="sec-note" style="margin-top:6px">Kirada her g&uuml;n km ve aşınma biniyor,
      aracın değeri d&uuml;ş&uuml;yor. Arıza &ccedil;ıkarsa s&ouml;zleşme kendiliğinden bitiyor.</div>
      <button class="btn full" data-act="kiradanal" data-id="${c.id}" style="margin-top:9px">
        Filodan &ccedil;ıkar</button></div>`;
  }
  const u=kiraUygunMu(c);
  const g=kiraGelir(c);
  return `<div class="block"><h4>FİLOYA AL</h4>
    <div class="kv"><span>Tahmini g&uuml;nl&uuml;k gelir</span><b class="pos">${tl(g)}</b></div>
    <div class="kv"><span>30 g&uuml;nde</span><b class="pos">${tl(g*30)}</b></div>
    <div class="sec-note" style="margin-top:6px">Satmak yerine kiraya ver: her g&uuml;n para getirir,
    ama km ve aşınma biner. Satılmayan aracı bekletmek yerine &ccedil;alıştırmanın yolu.</div>
    <button class="btn full" data-act="kirayaver" data-id="${c.id}" style="margin-top:9px"
      ${u.ok?"":"disabled"}>${u.ok?"Kiraya ver":u.n}</button></div>`;
}
