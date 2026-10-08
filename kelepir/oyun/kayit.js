/* ==================================================================
   KAYIT KATMANI — IndexedDB + localStorage
   localStorage hızlı ama kırılgan: ~5 MB sınırı var, tarayıcı yer
   açarken silebiliyor ve bazı WebView'lerde kapalı geliyor. Bu yüzden
   asıl kayıt IndexedDB'ye, aynası localStorage'a yazılıyor. Açılışta
   hangisi daha yeniyse o kullanılıyor; ikisi de yoksa yeni oyun.
   ================================================================== */
const KAYIT = (function(){
  const AD="preloved", DEPO="kayit", ANAHTAR="ana", LS="preloved_v1";
  let db=null, acilisDenendi=false, yazmaZaman=null, bekleyen=null;

  function ac(){
    return new Promise((coz)=>{
      if(db) return coz(db);
      if(acilisDenendi && !db) return coz(null);
      acilisDenendi=true;
      let istek;
      try{ istek=indexedDB.open(AD,1); }catch(e){ return coz(null); }
      if(!istek) return coz(null);
      istek.onupgradeneeded=()=>{
        try{ istek.result.createObjectStore(DEPO,{keyPath:"id"}); }catch(e){}
      };
      istek.onsuccess=()=>{ db=istek.result; coz(db); };
      istek.onerror=()=>coz(null);
      istek.onblocked=()=>coz(null);
      setTimeout(()=>coz(db), 1500);          // takılırsa oyunu bekletme
    });
  }

  function idbYaz(metin){
    return ac().then(d=>{
      if(!d) return false;
      return new Promise((coz)=>{
        try{
          const t=d.transaction(DEPO,"readwrite");
          t.objectStore(DEPO).put({id:ANAHTAR, t:Date.now(), v:metin});
          t.oncomplete=()=>coz(true);
          t.onerror=()=>coz(false);
          t.onabort=()=>coz(false);
        }catch(e){ coz(false); }
      });
    }).catch(()=>false);
  }

  function idbOku(){
    return ac().then(d=>{
      if(!d) return null;
      return new Promise((coz)=>{
        try{
          const t=d.transaction(DEPO,"readonly");
          const i=t.objectStore(DEPO).get(ANAHTAR);
          i.onsuccess=()=>coz(i.result||null);
          i.onerror=()=>coz(null);
        }catch(e){ coz(null); }
      });
    }).catch(()=>null);
  }

  function lsOku(){
    try{ return localStorage.getItem(LS); }catch(e){ return null; }
  }
  function lsYaz(metin){
    try{ localStorage.setItem(LS, metin); return true; }catch(e){ return false; }
  }
  function lsZaman(){
    try{ return +(localStorage.getItem(LS+"_t")||0); }catch(e){ return 0; }
  }
  function lsZamanYaz(t){
    try{ localStorage.setItem(LS+"_t", String(t)); }catch(e){}
  }

  /** Oyun her kaydettiğinde çağrılır: localStorage anında, IndexedDB kısa gecikmeyle. */
  function yaz(metin){
    const t=Date.now();
    lsYaz(metin); lsZamanYaz(t);
    bekleyen=metin;
    if(yazmaZaman) clearTimeout(yazmaZaman);
    yazmaZaman=setTimeout(()=>{ yazmaZaman=null; const v=bekleyen; bekleyen=null;
      if(v!=null) idbYaz(v); }, 400);
  }
  /** Sayfa kapanırken bekleyen yazmayı hemen geçir. */
  function hemen(){
    if(yazmaZaman){ clearTimeout(yazmaZaman); yazmaZaman=null; }
    if(bekleyen!=null){ const v=bekleyen; bekleyen=null; idbYaz(v); }
  }

  /** Açılıştan önce: IndexedDB daha yeniyse localStorage'a yaz. */
  function hazirla(){
    return idbOku().then(kayit=>{
      if(!kayit || !kayit.v) return;
      const yerelT=lsZaman(), yerel=lsOku();
      if(!yerel || (kayit.t||0) > yerelT){
        lsYaz(kayit.v); lsZamanYaz(kayit.t||Date.now());
      }
    }).catch(()=>{});
  }

  function sil(){
    if(yazmaZaman){ clearTimeout(yazmaZaman); yazmaZaman=null; }
    bekleyen=null;
    try{ localStorage.removeItem(LS); localStorage.removeItem(LS+"_t"); }catch(e){}
    return ac().then(d=>{
      if(!d) return;
      try{ d.transaction(DEPO,"readwrite").objectStore(DEPO).delete(ANAHTAR); }catch(e){}
    }).catch(()=>{});
  }

  /** Dışa aktarma / içe alma — cihaz değiştirirken kaydı taşımak için. */
  function disaAktar(){ return lsOku(); }
  function iceAl(metin){
    if(!metin) return false;
    try{ JSON.parse(metin); }catch(e){ return false; }
    yaz(metin); return true;
  }

  window.addEventListener("pagehide", hemen);
  window.addEventListener("blur", hemen);
  document.addEventListener("visibilitychange", ()=>{ if(document.hidden) hemen(); });

  return {yaz, hazirla, sil, hemen, disaAktar, iceAl};
})();

/* ---- çevrimdışı: servis çalışanı (yalnızca üst pencerede, https/dosya değil) ---- */
(function sw(){
  try{
    if(!("serviceWorker" in navigator)) return;
    if(window.top!==window.self) return;                 // gömülü çerçevede kayıt yapma
    if(location.protocol!=="https:") return;
    // Mağaza kabuğunda KAYIT YOK. Dosyalar zaten uygulamanın içinde, önbelleğe
    // alınacak bir şey yok; dahası Capacitor Android "https://localhost" şemasını
    // kullandığı için burada kayıt açılırsa güncellemeden sonra servis çalışanı
    // eski index.html'i sunmaya devam eder — klasik "güncelledim ama değişmedi"
    // hatası. Kabukta devre dışı, tarayıcıda açık.
    const kabuk=()=>{ try{ const c=window.Capacitor;
      return !!(c && (c.isNativePlatform ? c.isNativePlatform() : c.isNative)); }catch(e){ return false; } };
    if(kabuk()) return;
    window.addEventListener("load", ()=>{
      if(kabuk()) return;
      navigator.serviceWorker.register("sw.js").catch(()=>{});
    });
  }catch(e){}
})();
