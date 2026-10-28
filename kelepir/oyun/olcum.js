/* ==================================================================
   ÖLÇÜM (1.3, performance-optimization)
   Zayıf cihazda takılma ikinci büyük düşük puan sebebi; ama şimdiye dek
   hiç ölçülmemişti, yalnız tahmin ediliyordu. Bu modül iki şey yapar:
   1. Kare süresi örnekleyici: requestAnimationFrame aralıklarını toplar,
      medyan / %95 / takılma (>50 ms) çıkarır. Dış servis yok, veri cihazda
      kalır (localStorage "preloved_olcum", son 5 test).
   2. Cihaz testi (Ayarlar → Cihaz testi): liste kaydırma, 3B saha ve sayfa
      açma süresini sırayla ölçer; sonucu kopyalanabilir metin olarak verir.
      Kapalı testte oyuncu bu metni bize yollar.
   Ölçüm sırasında oyun durumu değişmez: sekme ve 3B görünümü eski hâline döner.
   ================================================================== */
const OLCUM={calisiyor:false, son:null};

function _olcYuzde(a, p){
  if(!a.length) return 0;
  const s=[...a].sort((x,y)=>x-y);
  return s[Math.min(s.length-1, Math.floor(p*(s.length-1)+.5))];
}
/** ms boyunca kare aralıklarını örnekle. adim(t) her karede çağrılır (senaryo sürmek için). */
function olcumOrnekle(etiket, ms, adim){
  return new Promise(coz=>{
    const araliklar=[]; let onceki=0, uzunGorev=0, gozcu=null;
    try{
      if(window.PerformanceObserver && (PerformanceObserver.supportedEntryTypes||[]).includes("longtask")){
        gozcu=new PerformanceObserver(l=>{ uzunGorev+=l.getEntries().length; });
        gozcu.observe({entryTypes:["longtask"]});
      }
    }catch(e){ gozcu=null; }
    const t0=performance.now();
    const kare=t=>{
      if(onceki) araliklar.push(t-onceki);
      onceki=t;
      try{ if(adim) adim(t-t0); }catch(e){}
      if(t-t0<ms) requestAnimationFrame(kare);
      else{
        try{ gozcu && gozcu.disconnect(); }catch(e){}
        const top=araliklar.reduce((a,b)=>a+b,0)||1;
        const takilma=araliklar.filter(x=>x>50).length;
        coz({etiket, kare:araliklar.length,
          medyan:Math.round(_olcYuzde(araliklar,.5)*10)/10,
          p95:Math.round(_olcYuzde(araliklar,.95)*10)/10,
          enUzun:Math.round(Math.max(0,...araliklar)),
          fps:Math.round(araliklar.length/(top/1000)),
          takilma, takilmaOran:Math.round(takilma/Math.max(1,araliklar.length)*1000)/10, uzunGorev});
      }
    };
    requestAnimationFrame(kare);
  });
}
function cihazBilgi(){
  const n=navigator||{};
  let gpu="";
  try{
    const c=document.createElement("canvas"), gl=c.getContext("webgl")||c.getContext("experimental-webgl");
    const ek=gl && gl.getExtension("WEBGL_debug_renderer_info");
    gpu = gl ? String(ek ? gl.getParameter(ek.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) : "WebGL yok";
    const kay=gl && gl.getExtension("WEBGL_lose_context"); if(kay) kay.loseContext();
  }catch(e){ gpu="?"; }
  return {ua:(n.userAgent||"").replace(/\s*\(KHTML.*$/,"").slice(0,140), dpr:window.devicePixelRatio||1,
    ekran:`${screen.width}×${screen.height}`, cekirdek:n.hardwareConcurrency||0, bellek:n.deviceMemory||0,
    gpu:gpu.slice(0,90), hafif:typeof hafifCizimMi==="function"?hafifCizimMi():false,
    surum:typeof OYUN_SURUM!=="undefined"?OYUN_SURUM:""};
}
/** Medyan kare süresine göre karne: 60 fps rahat, 30 fps oynanır, altı zayıf. */
function olcumKarne(r){
  if(!r || !r.kare) return "—";
  if(r.medyan<=20 && r.takilmaOran<3) return "iyi";
  if(r.medyan<=34 && r.takilmaOran<10) return "orta";
  return "zayıf";
}
/** Ayarlar'daki "Cihaz testi": üç evre, toplam ~14 sn. */
async function cihazTesti(ilerle){
  if(OLCUM.calisiyor) return null;
  OLCUM.calisiyor=true;
  const eski={tab:S.tab, v3:S.view3d, liste:S.listeMod};
  const sonuc={t:Date.now(), cihaz:cihazBilgi(), evre:[]};
  const bekle=ms=>new Promise(z=>setTimeout(z,ms));
  try{
    // 1) pazar listesi, otomatik kaydırma (kart fotoğrafları ve gölgeler)
    ilerle&&ilerle("Liste kaydırılıyor…");
    closeSheet&&closeSheet(); S.tab="pazar"; S.view3d=false; S.listeMod="foto"; render();
    await bekle(400);
    const kap=document.scrollingElement||document.documentElement;
    const boy=Math.max(1, kap.scrollHeight-innerHeight);
    sonuc.evre.push(await olcumOrnekle("Liste kaydırma", 4000, t=>{
      const u=(t%2000)/2000; kap.scrollTop=boy*(u<.5?u*2:2-u*2); }));
    kap.scrollTop=0;
    // 2) sayfa açma: bir ilanın inceleme sayfası kaç ms'de çiziliyor
    ilerle&&ilerle("Sayfa açma ölçülüyor…");
    const sayfa=[];
    for(let i=0;i<Math.min(5,S.market.length);i++){
      const t0=performance.now();
      try{ openMarketCar(S.market[i]); }catch(e){}
      await new Promise(z=>requestAnimationFrame(()=>z()));
      sayfa.push(performance.now()-t0);
      closeSheet&&closeSheet(); await bekle(120);
    }
    sonuc.evre.push({etiket:"Sayfa açma", medyan:Math.round(_olcYuzde(sayfa,.5)), p95:Math.round(Math.max(0,...sayfa)), kare:sayfa.length, takilmaOran:0, fps:0, takilma:0, enUzun:Math.round(Math.max(0,...sayfa)), sayfa:true});
    // 3) 3B saha: ısınma, sonra araçtan araca gezinti
    if(typeof can3d==="function" && can3d()){
      ilerle&&ilerle("3B saha ölçülüyor…");
      S.view3d=true; render();
      await bekle(2500);
      let son=0;
      sonuc.evre.push(await olcumOrnekle("3B saha", 6000, t=>{
        if(t-son>1500){ son=t; try{ W3D.sonraki(); }catch(e){} } }));
    }
  }finally{
    S.tab=eski.tab; S.view3d=eski.v3; S.listeMod=eski.liste; render();
    OLCUM.calisiyor=false;
  }
  sonuc.evre.forEach(e=>{ e.karne = e.sayfa ? (e.medyan<=120?"iyi":e.medyan<=300?"orta":"zayıf") : olcumKarne(e); });
  OLCUM.son=sonuc;
  try{
    const l=JSON.parse(localStorage.getItem("preloved_olcum")||"[]");
    l.unshift(sonuc); localStorage.setItem("preloved_olcum", JSON.stringify(l.slice(0,5)));
  }catch(e){}
  return sonuc;
}
/** Paylaşılabilir düz metin: kapalı testte geri bildirim formuna yapıştırılır. */
function olcumMetin(r){
  if(!r) return "";
  const c=r.cihaz;
  return [`Kelepir ${c.surum} · cihaz testi · ${new Date(r.t).toLocaleString("tr-TR")}`,
    `Cihaz: ${c.ua}`, `Ekran ${c.ekran} @${c.dpr}x · ${c.cekirdek||"?"} çekirdek · ${c.bellek||"?"} GB · GPU ${c.gpu}${c.hafif?" · hafif çizim":""}`,
    ...r.evre.map(e=>e.sayfa
      ? `${e.etiket}: medyan ${e.medyan} ms, en uzun ${e.enUzun} ms → ${e.karne}`
      : `${e.etiket}: ${e.fps} fps, kare medyan ${e.medyan} ms, %95 ${e.p95} ms, takılma %${e.takilmaOran} (${e.takilma}), uzun görev ${e.uzunGorev} → ${e.karne}`)
  ].join("\n");
}
