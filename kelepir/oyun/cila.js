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
    else {
      CILA.sayac=null; el.textContent=tl(yeni);
      /* Renk sınıfı kalıcı kalıyordu: bir alımdan sonra kasa saatlerce
         kırmızı durup "zarardasın" diyordu. Sayaç bitince altına döner. */
      setTimeout(()=>el.classList.remove("pop-art","pop-eks"), 450);
    }
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
let _onayEylem=null, _onayGeri=null;
/** geri: "Vazgeç"te çağrılır (ör. araç sayfasına dön). Yoksa sayfa kapanır —
    eskiden Hazırla onayında Vazgeç araç sayfasını da kapatıyordu. */
function onay(baslik, metin, etiket, eylem, tehlike, geri){
  _onayEylem=(typeof eylem==="function")?eylem:null;
  _onayGeri=(typeof geri==="function")?geri:null;
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

/* ==================================================================
   SATIŞ ANI (1.3, game-feel)
   Satış özeti tek bir statik rakamdı: ₺4.000 kâr ile ₺400.000 kâr aynı
   sessizlikte iniyordu. Oyunun en tatlı anı bu; puan isteyeceğimiz an da
   bu. Kâr, maliyete oranına göre üç kademe:
     1 ufak  — rakam sayar, kısa para sesi
     2 iyi   — rakam sayar + pop, satış akoru, birkaç ₺ kıvılcımı
     3 büyük — uzun sayaç, bol kıvılcım, ekran nefesi, ikinci akor
   Müzik bu sürede kısılır ki akor duyulsun. Hareket azaltmada yalnız ses.
   ================================================================== */
function satisKademe(kar, maliyet){
  if(!(kar>0)) return 0;
  const o=kar/Math.max(1, maliyet);
  if(o>=.20 || kar>=250000) return 3;
  if(o>=.08 || kar>=80000) return 2;
  return 1;
}
const SATIS_KADEME_AD=["", "Ufak ama kâr", "İyi kâr", "Büyük kâr"];
function satisAni(d){
  const k=d.kademe||0;
  try{
    if(typeof sesKis==="function") sesKis(k>=3?2.2:1.4);
    if(k===0){ cal("reddet"); dokun("hata"); }
    else if(k===1){ cal("para"); dokun("al"); }
    else { cal("satis"); dokun(k>=3?"seviye":"sat"); }
    if(k>=3) setTimeout(()=>cal("buyukSatis"), 420);
  }catch(e){}
  const el=document.querySelector(".satis-kar");
  if(!el) return;
  const hedef=d.profit, metin=v=>(v>=0?"+":"")+tl(v);
  if(CILA.azHareket || k===0){ el.textContent=metin(hedef); return; }
  const sure=[0,520,850,1250][k], t0=performance.now();
  el.textContent=metin(0);
  const adim=t=>{
    const u=Math.min(1,(t-t0)/sure), e=1-Math.pow(1-u,3);
    el.textContent=metin(Math.round(hedef*e/100)*100);
    if(u<1) requestAnimationFrame(adim);
    else{
      el.textContent=metin(hedef);
      el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
      if(k>=2) paraKivilcim(el, k>=3?16:8);
      if(k>=3) nefes("big");
    }
  };
  requestAnimationFrame(adim);
}
/** Rakamın çevresinden saçılan ₺ kıvılcımları. Saf CSS: tuval ve döngü yok,
    sahne kapanınca kendiliğinden silinir. */
function paraKivilcim(el, adet){
  const kap=el.closest(".satis-sahne"); if(!kap) return;
  const r=el.getBoundingClientRect(), k=kap.getBoundingClientRect();
  const x0=r.left-k.left+r.width/2, y0=r.top-k.top+r.height/2;
  for(let i=0;i<adet;i++){
    const s=document.createElement("i");
    s.className="kivilcim";
    const a=-Math.PI/2+(Math.random()-.5)*Math.PI*1.1, uz=70+Math.random()*80;
    s.style.cssText=`left:${x0}px;top:${y0}px;--dx:${Math.cos(a)*uz}px;--dy:${Math.sin(a)*uz}px;--rt:${(Math.random()-.5)*160}deg;animation-delay:${i*18}ms`;
    s.textContent="₺";
    kap.appendChild(s);
    setTimeout(()=>s.remove(), 1300+i*18);
  }
}
