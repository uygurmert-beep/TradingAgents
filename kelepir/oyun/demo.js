/* ==================================================================
   TANITIM TURU (demo)
   İlk kez oynayan biri için tek bir işi baştan sona birlikte yapıyoruz:
   ilan → ekspertiz → pazarlık → kârlı tamir → ilan → satış → hesap.
   Sayılar sabit ve elle ayarlı: tur, maliyetin yaklaşık %10'u kadar kârla
   bitiyor. Rastgelelik yok — anlatılan şeyin her oyuncuda aynı çıkması
   öğretici olmanın şartı.
   Tur bittiğinde sonuç gerçekten kariyere yazılır: oyuncu oyuna bir satış,
   bir deftere işlenmiş model ve kasasında o kârla başlar.
   ================================================================== */
const DEMO={
  adim:0, aktif:false,
  /* --- turun sabit sayıları --- */
  d:{
    ad:"Dovra Vela HB", yil:2018, km:96000, renk:"Füme", vites:"Otomatik", yakit:"Dizel",
    sorulan:1_150_000, gorunen:1_185_000, gercek:1_060_000,
    satici:"Acil nakit lazım", saticiK:"acil",
    eksper:2500, alis:955_000,
    tamir:[
      {n:"Debriyaj seti bitmiş", comp:"Şanzıman", bedel:30_000, deger:62_000, yap:true},
      {n:"Komple boya lazım",    comp:"Kaporta",  bedel:95_000, deger:61_000, yap:false}
    ],
    ilan:1_115_000, satis:1_086_000
  }
};
function demoMaliyet(){ const d=DEMO.d; return d.alis+d.eksper+d.tamir.filter(t=>t.yap).reduce((s,t)=>s+t.bedel,0); }
function demoKar(){ return DEMO.d.satis-demoMaliyet(); }
function demoMarj(){ return demoKar()/demoMaliyet()*100; }

function demoBaslat(){
  DEMO.adim=0; DEMO.aktif=true;
  // Giriş ekranı (#intro) modalın üstünde duruyor: tur boyunca onu gizle,
  // tur kapanınca oyun başlamadıysa geri getir.
  try{ document.getElementById("intro").classList.add("hidden"); }catch(e){}
  try{ document.getElementById("ogret").classList.add("hidden");
       document.body.classList.remove("ogret-ac"); }catch(e){}
  try{ muzikKip("menu"); }catch(e){}
  demoCiz();
}
/** Turdan çıkış: tek kapı — hem "atla" hem "bitir" buradan geçer. */
function demoKapat(){
  DEMO.aktif=false;
  closeSheet();
  if(!S.started) renderIntro(); else render();
}
function demoIleri(d){
  DEMO.adim=Math.max(0, Math.min(DEMO_ADIM.length-1, DEMO.adim+(d||1)));
  demoCiz();
  cal("sayfa");
}
function demoCiz(){
  const n=DEMO_ADIM.length, i=DEMO.adim;
  const s=DEMO_ADIM[i]();
  const son=(i===n-1);
  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">${s.bas}</div>
        <div class="sheet-sub">Tanıtım turu &middot; ${i+1} / ${n}</div>
        <div class="demoray">${Array.from({length:n},(_,k)=>
          `<i class="${k<i?"done":(k===i?"now":"")}"></i>`).join("")}</div></div>
      <button class="x" data-act="demokapat" aria-label="Kapat">&times;</button></div>
    ${s.govde}
    <div class="demoalt">
      ${i>0?`<button class="btn ghost" data-act="demogeri">&larr; Geri</button>`:
            `<button class="btn ghost" data-act="demokapat">Turu atla</button>`}
      <button class="btn primary" data-act="${son?"demobitti":"demoileri"}">${son?"Galeriyi a&ccedil;":"Devam &rarr;"}</button>
    </div>`);
}
/** Tur bitti: sonuç kariyere yazılır, oyuncu oyuna o kârla başlar. */
function demoBitir(){
  DEMO.aktif=false;
  const d=DEMO.d, kar=demoKar();
  S.demoYapildi=true;
  S.demoKar=kar;
  closeSheet();
  if(!S.started) renderIntro(); else render();
  toast(`Tanıtım turu tamam &mdash; ${tl(kar)} k&acirc;r kasana yazıldı.`,"good");
}
/** startGame içinden çağrılır: demo sonucunu gerçek kayda işle. */
function demoKariyereYaz(){
  if(!S.demoYapildi || S.demoIslendi) return;
  const d=DEMO.d, kar=demoKar();
  S.demoIslendi=true;
  S.cash+=kar;
  S.stats.bought=(S.stats.bought||0)+1;
  S.stats.sold=(S.stats.sold||0)+1;
  S.stats.repairs=(S.stats.repairs||0)+1;
  S.stats.profit=(S.stats.profit||0)+kar;
  S.xp+=Math.max(12, Math.round(kar/100));
  S.history.unshift({d:0, n:`${d.ad} ${d.yil}`, buy:d.alis, sell:d.satis, profit:kar,
                     note:"tanıtım turu"});
  try{
    const m=MODELS.find(x=>x.n===d.ad);
    if(m){ const k=S.koleksiyon||(S.koleksiyon={});
      const e=k[m.n]||(k[m.n]={al:0,sat:0,enKar:0,enIyiGun:0,ilkGun:1});
      e.al++; e.sat++; if(kar>e.enKar){ e.enKar=kar; e.enIyiGun=1; } }
  }catch(e){}
}

/* ---------- adımlar ---------- */
const DEMO_ADIM=[
 ()=>({bas:"Oyun &uuml;&ccedil; adımda", govde:`
   <div class="block"><div class="help">
     <p>Ucuza al, sadece k&acirc;rlı tamiri yap, doğru alıcıya sat. Zor olan kısım fiyat bi&ccedil;mek: ilanda yazan fiyat ile aracın ger&ccedil;ek değeri aynı şey değil.</p>
     <p>Şimdi bir işi baştan sona birlikte yapalım. Sonunda kazandığın k&acirc;r ger&ccedil;ekten kasana yazılacak.</p></div></div>
   <div class="demoadim">
     <div class="dstep"><b>1</b><span>İlana gir, ekspertize ver, &ccedil;ıkan kusuru pazarlıkta koz yap</span></div>
     <div class="dstep"><b>2</b><span>Sadece k&acirc;rlı tamiri yaptır &mdash; hepsini yapmak zarardır</span></div>
     <div class="dstep"><b>3</b><span>Fiyat koy, sat. Gizlediğin kusur yakalanırsa itibarın d&uuml;şer</span></div>
   </div>`}),

 ()=>{ const d=DEMO.d; return {bas:"1 &middot; İlan", govde:`
   <div class="block"><h4>PAZARDAKİ İLAN</h4>
     <div class="kv"><span>Ara&ccedil;</span><b>${d.ad} ${d.yil}</b></div>
     <div class="kv"><span>Kilometre</span><b>${mesafe(d.km)}</b></div>
     <div class="kv"><span>Vites / yakıt</span><b>${d.vites} &middot; ${d.yakit}</b></div>
     <div class="kv"><span>Satıcı</span><b>${d.satici}</b></div>
     <div class="kv" style="border-top:1px solid var(--line);margin-top:4px;padding-top:8px">
       <span style="color:var(--text)">Sorulan fiyat</span><b style="font-size:17px">${tl(d.sorulan)}</b></div>
   </div>
   <div class="block"><div class="help">
     <p>İlk bakışta bu ara&ccedil; ${tl(d.gorunen)} eder gibi duruyor, sorulan fiyat ise ${tl(d.sorulan)} &mdash; u&ccedil;uz g&ouml;r&uuml;n&uuml;yor.</p>
     <p>Ama g&ouml;z&uuml;nle g&ouml;rd&uuml;ğ&uuml;n her şey değil. Kaputun altında ne olduğunu bilmeden teklif vermek, bu oyunda para kaybetmenin bir numaralı yolu.</p></div></div>`};},

 ()=>{ const d=DEMO.d; return {bas:"2 &middot; Ekspertiz", govde:`
   <div class="block"><h4>EKSPERTİZ RAPORU &middot; ${tl(d.eksper)}</h4>
     ${d.tamir.map(t=>`<div class="fault"><div class="fname">${t.n}
       <br><small style="color:var(--muted-2)">${t.comp} &middot; tamir ${tl(t.bedel)}</small></div></div>`).join("")}
     <div class="kv" style="margin-top:8px"><span>İlk bakıştaki değer</span><b>${tl(d.gorunen)}</b></div>
     <div class="kv"><span>Rapordan sonra ger&ccedil;ek değer</span>
       <b style="color:var(--zarar)">${tl(d.gercek)}</b></div>
     <div class="kv" style="border-top:1px solid var(--line);margin-top:4px;padding-top:8px">
       <span style="color:var(--text)">Sorulan fiyat ger&ccedil;eğin &uuml;st&uuml;nde</span>
       <b class="neg">+${tl(d.sorulan-d.gercek)}</b></div>
   </div>
   <div class="block"><div class="help">
     <p>Ekspertize ${tl(d.eksper)} verdik ve iki kusur &ccedil;ıktı. Sorulan fiyat ger&ccedil;ek değerin ${tl(d.sorulan-d.gercek)} &uuml;st&uuml;ndeymiş &mdash; ekspertiz olmadan bu aracı alsaydık, daha ilk g&uuml;n zarar etmiş olurduk.</p>
     <p>Rapordaki her kusur aynı zamanda bir kozdur: pazarlıkta fiyatı aşağı &ccedil;ekmek i&ccedil;in elinde belge olur.</p></div></div>`};},

 ()=>{ const d=DEMO.d; return {bas:"3 &middot; Pazarlık", govde:`
   <div class="talk" style="max-height:none">
     <div class="bub them">Hoş geldin, aracı acil &ccedil;evirmem lazım. ${tl(d.sorulan)} istiyorum.</div>
     <div class="bub you">Ekspertiz raporu &ouml;n&uuml;mde: debriyaj seti bitmiş. Bunu fiyata yansıtman lazım.</div>
     <div class="bub them">Doğru, onu ben de biliyorum. Fiyatta biraz esneyebilirim.</div>
     <div class="bub you">Komple boya da lazım, ${tl(95000)} tutuyor. Peşin veriyorum, bug&uuml;n noteri hallederiz.</div>
     <div class="bub them">Nakit dedin de kulağım a&ccedil;ıldı. Konuşalım.</div>
     <div class="bub you">${tl(d.alis)}</div>
     <div class="bub them">Hayırlı olsun, anlaştık.</div>
   </div>
   <div class="block"><div class="help">
     <p>&Uuml;&ccedil; hamle yaptık: iki kozu rapordan sunduk, bir de peşin nakdi vurguladık. Satıcının acelesi vardı &mdash; bu tip satıcıda peşin &ccedil;ok işe yarar.</p>
     <p>Sonu&ccedil;: ${tl(d.sorulan)} istenen ara&ccedil; ${tl(d.alis)} oldu. Ger&ccedil;ek değerin ${tl(d.gercek-d.alis)} altında aldık &mdash; k&acirc;r burada doğuyor, satışta değil.</p></div></div>`};},

 ()=>{ const d=DEMO.d; return {bas:"4 &middot; Doğru tamiri se&ccedil;", govde:`
   <div class="block"><h4>HANGİ TAMİR K&Acirc;RLI?</h4>
     ${d.tamir.map(t=>{
       const net=t.deger-t.bedel;
       return `<div class="fault" style="border-color:${t.yap?"rgba(67,192,138,.34)":"rgba(229,84,78,.30)"}">
         <div class="fname">${t.n}
           <br><small style="color:var(--muted-2)">maliyet ${tl(t.bedel)} &middot; değer artışı ${tl(t.deger)}</small></div>
         <span class="chip ${net>0?"good":"warn"}">${net>0?"+":""}${tl(net)}</span></div>`;}).join("")}
     <div class="kv" style="margin-top:9px"><span>Yaptığımız</span><b>Debriyaj &middot; ${tl(580)}</b></div>
     <div class="kv"><span>Yapmadığımız</span><b style="color:var(--muted)">Komple boya</b></div>
   </div>
   <div class="block"><div class="help">
     <p>Boya ${tl(95000)} tutuyor ama aracın değerini sadece ${tl(61000)} artırıyor: yaparsak ${tl(34000)} zarar. Her kusuru onarmak zorunda değilsin.</p>
     <p>Kural kabaca şu: b&uuml;y&uuml;k revizyonlar ucuz ara&ccedil;ta zarar, pahalı ara&ccedil;ta k&acirc;rdır &mdash; &ccedil;&uuml;nk&uuml; pahalı ara&ccedil;ta b&uuml;y&uuml;k bir kusur alıcıyı tamir bedelinden fazla &uuml;rk&uuml;t&uuml;r.</p></div></div>`};},

 ()=>{ const d=DEMO.d; return {bas:"5 &middot; İlan ve satış", govde:`
   <div class="block"><h4>İLANA &Ccedil;IKTIK</h4>
     <div class="kv"><span>İlan fiyatı</span><b>${tl(d.ilan)}</b></div>
     <div class="kv"><span>İlanda kusuru a&ccedil;ıkladık mı?</span><b style="color:var(--kar)">Evet</b></div>
     <div class="sec-note" style="margin-top:4px">Boyayı ilanda yazdık. Fiyat biraz d&uuml;şt&uuml;, ama alıcı ekspertize g&ouml;t&uuml;r&uuml;p yakalayınca itibar kaybetmedik.</div>
   </div>
   <div class="talk" style="max-height:none">
     <div class="bub them">Yoldan geldim, boşuna gelmiş olmayayım. ${tl(1052000)} versem?</div>
     <div class="bub you">Debriyaj yeni yapıldı, fişi duruyor. ${tl(d.ilan)} nettir.</div>
     <div class="bub them">${tl(d.satis)} olsun, elimi sıkalım.</div>
     <div class="bub you">Anlaştık.</div>
   </div>
   <div class="block"><div class="help">
     <p>Yaptığımız tamiri koz olarak g&ouml;sterdik &mdash; fişi duran bir tamir alıcının g&uuml;venini y&uuml;kseltir ve tavanını a&ccedil;ar.</p></div></div>`};},

 ()=>{ const d=DEMO.d, mal=demoMaliyet(), kar=demoKar(), marj=demoMarj();
   return {bas:"6 &middot; Hesap", govde:`
   <div class="block"><h4>BU İŞİN HESABI</h4>
     <div class="kv"><span>Alış</span><b class="neg">&minus;${tl(d.alis)}</b></div>
     <div class="kv"><span>Ekspertiz</span><b class="neg">&minus;${tl(d.eksper)}</b></div>
     <div class="kv"><span>Tamir (debriyaj)</span><b class="neg">&minus;${tl(580)}</b></div>
     <div class="kv" style="border-top:1px solid var(--line);margin-top:4px;padding-top:8px">
       <span>Toplam maliyet</span><b>${tl(mal)}</b></div>
     <div class="kv"><span>Satış</span><b class="pos">+${tl(d.satis)}</b></div>
     <div class="kv" style="border-top:1px solid var(--line);margin-top:4px;padding-top:9px">
       <span style="color:var(--text)">K&acirc;r</span>
       <b class="pos" style="font-size:19px">+${tl(kar)}</b></div>
     <div class="kv"><span>Marj</span><b class="pos">${yuzde(Math.round(marj*10)/10)}</b></div>
   </div>
   <div class="block"><div class="help">
     <p>K&acirc;r, maliyetin yaklaşık ${yuzde(Math.round(marj))}'u kadar. Bu oyunda iyi bir iş b&ouml;yle g&ouml;r&uuml;n&uuml;r &mdash; ara&ccedil; başına birka&ccedil; bin dolar, sihir yok.</p>
     <p>K&acirc;rın &uuml;&ccedil; yerden geldi: ekspertizin bulduğu kusurlar, pazarlıkta a&ccedil;tığın pay ve yapmadığın tamir.</p></div></div>`};},

 ()=>{ const kar=demoKar();
   return {bas:"Sıra sende", govde:`
   <div class="block"><div class="help">
     <p>Tur bitti. Kazandığın ${tl(kar)} k&acirc;r ger&ccedil;ekten kasana yazılıyor ve bu model defterine işleniyor &mdash; oyuna bir satış &ouml;nde başlıyorsun.</p>
     <p>Bundan sonrası sende: pazardaki ilanlar her g&uuml;n değişiyor, rakip d&ouml;rt galeri aynı araba i&ccedil;in seninle yarışıyor ve her sezon farklı bir segment aranıyor.</p></div></div>
   <div class="block"><h4>İLK G&Uuml;N İ&Ccedil;İN &Uuml;&Ccedil; &Ouml;NERİ</h4>
     <div class="demoadim">
       <div class="dstep"><b>&middot;</b><span>Nakdinin tamamını tek araca g&ouml;mme &mdash; tamir ve ekspertiz i&ccedil;in pay bırak</span></div>
       <div class="dstep"><b>&middot;</b><span>Ekspertizsiz teklif verme; ${tl(2500)} genelde kendini katlayarak &ouml;der</span></div>
       <div class="dstep"><b>&middot;</b><span>G&uuml;n&uuml;n g&ouml;revlerine bak &mdash; zaten yapacağın işler i&ccedil;in nakit veriyor</span></div>
     </div>
   </div>`};}
];
