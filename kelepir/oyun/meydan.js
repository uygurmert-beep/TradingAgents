/* ==================================================================
   GÜNÜN VAKASI (madde 7) — günlük meydan okuma
   Takvim gününden türeyen sabit bir tohum: aynı gün herkese aynı araç
   düşer, sunucu gerekmiyor. Oyuncunun tek işi, önündeki tam ekspertiz
   raporuna bakıp "bu araca en fazla kaç para verirsin" sorusuna cevap
   vermek — oyunun öğrettiği becerinin ta kendisi, 20 saniyede.
   Oyun durumuna dokunmaz: araç sahte bir evrende üretilir, pazara girmez.
   ================================================================== */
function meydanGun(){
  const d=new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
/** 32-bit karma: aynı tarih her cihazda aynı sayıyı verir. */
function meydanTohum(s){
  let h=2166136261>>>0;
  for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; }
  return h>>>0;
}
function mulberry(a){
  return function(){
    a=(a+0x6D2B79F5)>>>0;
    let t=a;
    t=Math.imul(t^(t>>>15), t|1);
    t^=t+Math.imul(t^(t>>>7), t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
/** Math.random'ı geçici olarak tohumlu üreteçle değiştirip aracı üret. */
function meydanArac(gun){
  const eski=Math.random;
  const r=mulberry(meydanTohum("preloved|"+gun));
  let car=null;
  try{
    Math.random=r;
    // Zorluk/olay etkisi dışarıda kalsın: vaka herkes için aynı olmalı.
    const eskiMarket=MARKET, eskiZor=ZOR, eskiPerks=PERKS;
    MARKET=()=>null; ZOR=()=>"normal"; PERKS=()=>({});
    try{
      const havuz=MODELS.filter(m=>m.seg!=="klasik" || r()<.5);
      car=genCar({pool:havuz.length?havuz:MODELS});
      car.inspected=true;              // rapor tam açık — soru değerleme, keşif değil
      for(const f of car.faults) f.visible=true;
    } finally { MARKET=eskiMarket; ZOR=eskiZor; PERKS=eskiPerks; }
  } finally { Math.random=eski; }
  return car;
}
function meydanDurum(){
  if(!S.meydan) S.meydan={gun:null, skor:0, seri:0, sonSeri:null, oynanan:0, enIyi:0};
  return S.meydan;
}
function meydanOynandiMi(){ return meydanDurum().gun===meydanGun(); }

/** Doğru cevap: aracın gerçek değerinin %88'i — kârlı bir alımın tavanı. */
function meydanHedef(car){ return Math.round(valueOf(car,false)*0.88/500)*500; }
/** Sapmaya göre puan: %2 içinde 100, %25'te 0. */
function meydanPuan(cevap, hedef){
  const sap=Math.abs(cevap-hedef)/Math.max(1,hedef);
  if(sap<=0.02) return 100;
  return Math.max(0, Math.round(100-(sap-0.02)/0.23*100));
}
function meydanOdul(puan){
  return {nakit: Math.round(puan*450/500)*500, xp: Math.round(puan*0.22)};
}

let _meydanCar=null;
function openMeydan(){
  const gun=meydanGun();
  _meydanCar=meydanArac(gun);
  const c=_meydanCar, m=meydanDurum();
  const yas=Math.max(1,YEAR-c.year);
  const kusur=c.faults.filter(f=>!f.fixed);
  if(meydanOynandiMi()){ openMeydanSonuc(m.sonSonuc); return; }
  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">G&uuml;n&uuml;n vakası</div>
        <div class="sheet-sub">${gun} &middot; bug&uuml;n herkese aynı ara&ccedil;</div></div>
      <button class="x" data-act="closesheet" aria-label="Kapat">&times;</button></div>

    <div class="block"><div class="help">
      <p>Rapor tamamen a&ccedil;ık. Tek soru şu: bu araca en fazla ka&ccedil; lira verirsin?</p>
      <p>Hedef, k&acirc;rlı bir alımın tavanı. Ne kadar yakınsan o kadar puan.</p></div></div>

    <div class="block"><h4>ARA&Ccedil;</h4>
      <div class="kv"><span>Model</span><b>${c.model.n} ${c.year}</b></div>
      <div class="kv"><span>Segment / yaş</span><b>${SEGLBL[c.model.seg]} &middot; ${yas} yıl</b></div>
      <div class="kv"><span>Kilometre</span><b>${mesafe(c.km)}</b></div>
      <div class="kv"><span>Vites / yakıt</span><b>${c.gear} &middot; ${c.fuel}</b></div>
      <div class="kv"><span>Renk</span><b>${c.color}</b></div>
    </div>

    <div class="block"><h4>EKSPERTİZ RAPORU</h4>
      ${condBlock(c, true)}
      ${kusur.length?kusur.map(f=>`<div class="fault"><div class="fname">${f.n}
          <br><small style="color:var(--muted-2)">${COMPLBL[f.comp]} &middot; tamir ${tl(f.cost)}</small></div></div>`).join("")
        :`<div class="sec-note">A&ccedil;ık arıza yok.</div>`}
      <div class="kv" style="margin-top:6px"><span>Tramer</span><b class="${c.tramer?"neg":""}">${c.tramer?tl(c.tramer):"kayıt yok"}</b></div>
      <div class="kv"><span>Değişen / boyalı</span><b>${c.degisen} / ${c.boyali}</b></div>
      ${c.kmOynama?`<div class="sec-note" style="color:#F08B86">Km'de oynama ş&uuml;phesi var.</div>`:""}
      ${c.story?`<div class="sec-note" style="margin-top:5px">Hik&acirc;ye: ${(STORIES.find(s=>s.k===c.story)||{}).t||""}</div>`:""}
    </div>

    <div class="block"><h4>SENİN TAVANIN</h4>
      <input class="offer-input" id="meydanIn" type="text" inputmode="numeric"
        value="${num(Math.round(valueOf(c,true)*0.8/5000)*5000)}">
      <button class="btn primary full" data-act="meydanver" style="margin-top:9px">Cevabı ver</button>
      <button class="btn ghost full" data-act="paylasac" data-t="soru" style="margin-top:7px">
        Soruyu kart olarak payla&#351;</button>
      <div class="sec-note" style="margin-top:7px">G&uuml;nde bir kez. Seri: ${m.seri||0} g&uuml;n &middot; en iyi puan ${m.enIyi||0}</div>
    </div>`);
}
function meydanCevapla(){
  const inp=document.getElementById("meydanIn");
  const c=_meydanCar;
  if(!inp||!c) return;
  const cevap=parseInt(String(inp.value).replace(/[^\d]/g,""),10)||0;
  if(cevap<=0){ toast("Bir tutar gir.","bad"); return; }
  const hedef=meydanHedef(c);
  const puan=meydanPuan(cevap, hedef);
  const odul=meydanOdul(puan);
  const m=meydanDurum();
  // seri: bir önceki takvim günü oynanmışsa artar
  const dun=(()=>{ const d=new Date(Date.now()-864e5);
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); })();
  m.seri = (m.gun===dun) ? (m.seri||0)+1 : 1;
  m.gun=meydanGun(); m.skor=puan; m.oynanan=(m.oynanan||0)+1;
  m.enIyi=Math.max(m.enIyi||0, puan);
  const seriPrim = Math.min(5, m.seri-1)*0.06;
  const nakit=Math.round(odul.nakit*(1+seriPrim)/10)*10;
  S.cash+=nakit; S.xp+=odul.xp;
  const sonuc={ad:`${c.model.n} ${c.year}`, cevap, hedef, puan, nakit, xp:odul.xp,
    seri:m.seri, gercek:Math.round(valueOf(c,false)),
    sap:Math.round((cevap-hedef)/Math.max(1,hedef)*1000)/10};
  m.sonSonuc=sonuc;
  cal(puan>=70?"seviye":"uyari"); titre(puan>=70?HAPTIK.basari:HAPTIK.orta);
  save(); renderHud();
  openMeydanSonuc(sonuc);
}
function openMeydanSonuc(s){
  if(!s){ closeSheet(); return; }
  const renk=s.puan>=85?"var(--kar)":s.puan>=55?"var(--sodium)":"var(--zarar)";
  const yorum = s.puan>=85 ? "Nokta atışı. Bu gözle para kazanılır."
              : s.puan>=55 ? "Fena değil — ama bu fark bir tamir bedeli eder."
              : s.sap>0    ? "Fazla verdin. Pazarlıkta koz çıkarmadan teklif böyle olur."
                           : "Çok aşağıdan girdin; bu fiyata kimse satmaz, araç elinden gider.";
  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">G&uuml;n&uuml;n vakası &mdash; sonu&ccedil;</div>
        <div class="sheet-sub">${s.ad}</div></div>
      <button class="x" data-act="closesheet" aria-label="Kapat">&times;</button></div>
    <div class="meyskor"><b style="color:${renk}">${s.puan}</b><span>/ 100</span></div>
    <div class="block">
      <div class="kv"><span>Senin tavanın</span><b>${tl(s.cevap)}</b></div>
      <div class="kv"><span>K&acirc;rlı alımın tavanı</span><b style="color:var(--sodium)">${tl(s.hedef)}</b></div>
      <div class="kv"><span>Aracın ger&ccedil;ek değeri</span><b>${tl(s.gercek)}</b></div>
      <div class="kv"><span>Sapma</span><b class="${Math.abs(s.sap)<=3?"pos":"neg"}">${s.sap>0?"+":""}${String(s.sap).replace(".",EN()?".":",")}%</b></div>
    </div>
    <div class="block"><div style="font-size:13px;line-height:1.5">${yorum}</div></div>
    <div class="block">
      <div class="kv"><span>&Ouml;d&uuml;l</span><b class="pos">+${tl(s.nakit)} &middot; +${s.xp} XP</b></div>
      <div class="kv"><span>Seri</span><b>${s.seri} g&uuml;n</b></div>
      <div class="sec-note" style="margin-top:4px">Yeni vaka yarın. Seri b&uuml;y&uuml;d&uuml;k&ccedil;e nakit &ouml;d&uuml;l artar (en &ccedil;ok %30).</div>
    </div>
    <div class="btn-row" style="margin-top:2px">
      <button class="btn primary" data-act="paylasac" data-t="sonuc">Kart&#305; payla&#351;</button>
      <button class="btn" data-act="closesheet">Kapat</button>
    </div>`);
}
/** Pazar ekranındaki giriş şeridi. */
function meydanSerit(){
  const m=meydanDurum();
  const bitti=meydanOynandiMi();
  return `<button class="meyserit ${bitti?"bitti":""}" data-act="meydanac">
    <span class="meyik">${bitti?"&#10003;":"?"}</span>
    <span class="meymet"><b>G&uuml;n&uuml;n vakası</b>
      <small>${bitti?`Bug&uuml;n ${m.skor}/100 &middot; seri ${m.seri} g&uuml;n`
        :"Tek soru, 20 saniye &mdash; herkese aynı ara&ccedil;"}</small></span>
    <span class="meyok">&rsaquo;</span></button>`;
}
