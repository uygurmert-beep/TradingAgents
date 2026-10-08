/* ==================================================================
   CİLA (madde 5) — mikro animasyon ve dokunsal geri bildirim
   Buradaki hiçbir şey oyunu değiştirmiyor; algılanan kaliteyi değiştiriyor.
   Üç parça var: sayan sayılar (nakit), ekran nefesi (alım/satış/seviye) ve
   dokunsal desenler. Hepsi prefers-reduced-motion'a ve kullanıcının ses/
   titreşim ayarına saygı duyuyor — kapatan için hiçbiri çalışmaz.
   ================================================================== */
const CILA={azHareket:false, sayac:null, sonNakit:null};
(function cilaKur(){
  try{
    const mq=window.matchMedia("(prefers-reduced-motion: reduce)");
    CILA.azHareket=!!mq.matches;
    if(mq.addEventListener) mq.addEventListener("change", e=>{ CILA.azHareket=!!e.matches; });
    else if(mq.addListener) mq.addListener(e=>{ CILA.azHareket=!!e.matches; });
  }catch(e){}
})();

/** Nakit rakamını eski değerden yenisine saysın. Fark küçükse anında yaz. */
function nakitYaz(el, yeni){
  if(!el) return;
  const eski=CILA.sonNakit;
  CILA.sonNakit=yeni;
  if(CILA.azHareket || eski===null || Math.abs(yeni-eski)<120){
    el.textContent=tl(yeni);
    return;
  }
  if(CILA.sayac){ cancelAnimationFrame(CILA.sayac); CILA.sayac=null; }
  const sure=Math.min(850, 260+Math.abs(yeni-eski)/40);
  const t0=performance.now();
  el.classList.remove("pop-art","pop-eks");
  void el.offsetWidth;
  el.classList.add(yeni>=eski?"pop-art":"pop-eks");
  const adim=(t)=>{
    const u=Math.min(1,(t-t0)/sure);
    const e=1-Math.pow(1-u,3);                       // easeOutCubic
    el.textContent=tl(Math.round(eski+(yeni-eski)*e));
    if(u<1) CILA.sayac=requestAnimationFrame(adim);
    else { CILA.sayac=null; el.textContent=tl(yeni); }
  };
  CILA.sayac=requestAnimationFrame(adim);
}

/** Ekran nefesi: önemli bir şey olduğunda tüm arayüz bir kez hafifçe nefes alır. */
/* ---- GÜN SAYACI: basamak atlama ----
   Gün dönerken sayı birden değişiyordu; oyuncu günün döndüğünü ancak
   ekranın geri kalanından anlıyordu. Artık sayı yukarı kayarak değişiyor. */
function gunYaz(el, metin){
  if(!el) return;
  if(CILA.azHareket || el.textContent===metin){ el.textContent=metin; return; }
  if(el.dataset.ilk!=="1"){ el.dataset.ilk="1"; el.textContent=metin; return; }
  el.classList.remove("gun-don"); void el.offsetWidth;
  el.textContent=metin;
  el.classList.add("gun-don");
}
/* ---- TAMİR EDİLEN ORGANIN ÇUBUĞU ----
   Tamirden sonra çubuk zaten yeni değeriyle çiziliyordu; dolma anı
   görünmüyordu. Çubuk eski genişlikte doğuyor, bir kare sonra yenisine
   geçiyor — CSS geçişi aradaki dolmayı gösteriyor. */
function cubukDoldur(){
  if(CILA.azHareket) return;
  const hedef=document.querySelectorAll(".bar i[data-hedef]");
  if(!hedef.length) return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    hedef.forEach(e=>{ e.style.width=e.dataset.hedef+"%"; e.removeAttribute("data-hedef"); });
  }));
}
function nefes(kind){
  if(CILA.azHareket) return;
  const app=document.getElementById("app");
  if(!app) return;
  const sinif = kind==="bad" ? "nefes-kotu" : (kind==="big" ? "nefes-buyuk" : "nefes-iyi");
  app.classList.remove("nefes-iyi","nefes-kotu","nefes-buyuk");
  void app.offsetWidth;
  app.classList.add(sinif);
  setTimeout(()=>app.classList.remove(sinif), 760);
}

/** Ekranın ortasında bir kez parlayan büyük rakam (seviye, ikramiye, karne notu). */
function parla(metin, alt, renk){
  if(CILA.azHareket) { toast(metin+(alt?" &middot; "+alt:""),"good"); return; }
  const el=document.createElement("div");
  el.className="parla";
  el.innerHTML=`<b style="color:${renk||"var(--sodium)"}">${metin}</b>${alt?`<span>${alt}</span>`:""}`;
  document.body.appendChild(el);
  setTimeout(()=>{ el.classList.add("git"); }, 900);
  setTimeout(()=>el.remove(), 1500);
}

/* ==================================================================
   ONAY KUTUSU
   window.confirm() mobil WebView'da (Capacitor/Android) ana makine
   uygulaması bir diyalog işleyicisi sağlamadıkça SESSİZCE false döner —
   "Baştan başla" düğmesinin çalışmamasının sebebi buydu. Artık onay
   oyunun kendi sayfasıyla alınıyor: her yerde çalışır, çevrilir ve
   tasarıma uyar.
   ================================================================== */
let _onayEylem=null;
function onay(baslik, metin, etiket, eylem, tehlike){
  _onayEylem=(typeof eylem==="function")?eylem:null;
  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">${baslik}</div></div>
      <button class="x" data-act="onayhayir" aria-label="Kapat">&times;</button></div>
    <div class="block"><div style="font-size:13.5px;line-height:1.55">${metin}</div></div>
    <button class="btn ${tehlike?"danger":"primary"} full" data-act="onayevet">${etiket}</button>
    <button class="btn ghost full" data-act="onayhayir" style="margin-top:7px">Vazge&ccedil;</button>`);
}
function onayCalistir(){
  const f=_onayEylem; _onayEylem=null;
  closeSheet();
  if(f) try{ f(); }catch(e){}
}

/* --- dokunsal desenler: tek kapıdan geçsin ki ayar her yerde geçerli olsun --- */
const DOKUN={
  al:   [12,30,18],
  sat:  [10,40,10,40,26],
  hata: [40,60,40],
  koz:  [8,24,8],
  gun:  [16],
  seviye:[10,50,10,50,10,50,30]
};
function dokun(ad){
  const p=DOKUN[ad];
  if(p) titre(p);
}
