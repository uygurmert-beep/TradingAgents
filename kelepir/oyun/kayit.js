/* ==================================================================
   KAYIT KATMANI — IndexedDB + localStorage
   localStorage hızlı ama kırılgan: ~5 MB sınırı var, tarayıcı yer
   açarken silebiliyor ve bazı WebView'lerde kapalı geliyor. Bu yüzden
   asıl kayıt IndexedDB'ye, aynası localStorage'a yazılıyor. Açılışta
   hangisi daha yeniyse o kullanılıyor; ikisi de yoksa yeni oyun.
   ================================================================== */
/* YEDEK (1.3, save-systems): "İlerlemem silindi" en hızlı gelen tek yıldız.
   Üç katman:
   1. Günlük yedek — oyun günü her değiştiğinde son sağlam kayıt iki kuşak
      halinde saklanır (yedek = bu günün başı, yedek2 = bir önceki gün).
      "Sağlam" = JSON'a dönüyor ve kariyer alanları duruyor.
   2. Cihaz deposu — mağaza kabuğunda kayıt ve yedek ayrıca uygulamanın kendi
      veri klasörüne (Capacitor Filesystem, DATA) yazılır. iOS ve bazı
      Android'ler yer açarken WebView deposunu temizleyebiliyor; uygulama
      klasörü kaldırılana dek durur.
   3. Bozuk kayıt silinmez — eskiden açılamayan kayıt localStorage'dan
      siliniyor ve sıfırdan oyun açılıyordu. Artık "preloved_bozuk"a taşınır
      ve en yeni sağlam yedekten devam edilir. "Baştan başla" da son oyunu
      "silinen" yuvasına koyar, Ayarlar'dan geri getirilebilir. */
const KAYIT = (function(){
  const AD="preloved", DEPO="kayit", ANAHTAR="ana", LS="preloved_v1";
  const LS_Y="preloved_yedek", LS_Y2="preloved_yedek2", LS_SIL="preloved_silinen", LS_BOZ="preloved_bozuk";
  const DOSYA="kelepir-kayit.json", DOSYA_Y="kelepir-yedek.json";
  let db=null, acilisDenendi=false, yazmaZaman=null, bekleyen=null;
  let yerelYedekler=[];          // IndexedDB/cihaz deposundan açılışta toplananlar

  /* --- cihaz deposu (yalnız kabukta) --- */
  function fs(){ try{ const c=window.Capacitor;
    return (c && c.Plugins && c.Plugins.Filesystem && (c.isNativePlatform?c.isNativePlatform():c.isNative)) ? c.Plugins.Filesystem : null; }catch(e){ return null; } }
  function dosyaYaz(ad, nesne){
    const F=fs(); if(!F) return Promise.resolve(false);
    return F.writeFile({path:ad, data:JSON.stringify(nesne), directory:"DATA", encoding:"utf8"}).then(()=>true, ()=>false);
  }
  function dosyaOku(ad){
    const F=fs(); if(!F) return Promise.resolve(null);
    return F.readFile({path:ad, directory:"DATA", encoding:"utf8"})
      .then(r=>{ try{ return JSON.parse(r.data); }catch(e){ return null; } }, ()=>null);
  }
  /** Sağlam mı: JSON, kariyer alanları ve gün var. Modeller deserialize'da kontrol edilir. */
  function saglam(metin){
    try{ const d=JSON.parse(metin); return !!(d && d.stats && d.day>=1 && Array.isArray(d.cars)) ? d : null; }
    catch(e){ return null; }
  }
  function lsJson(k){ try{ return JSON.parse(localStorage.getItem(k)||"null"); }catch(e){ return null; } }
  function lsJsonYaz(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }

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

  function idbYedekYaz(y){
    return ac().then(d=>{ if(!d) return;
      try{ d.transaction(DEPO,"readwrite").objectStore(DEPO).put({id:"yedek", t:y.t, gun:y.gun, v:y.v}); }catch(e){} }).catch(()=>{});
  }
  /** Gün değiştiyse sağlam kaydı yedeğe al (bir önceki yedek ikinci kuşağa kayar). */
  function yedekle(metin, d){
    const y=lsJson(LS_Y);
    if(y && y.gun===d.day) return;
    const yeni={t:Date.now(), gun:d.day, v:metin};
    if(y) lsJsonYaz(LS_Y2, y);
    if(!lsJsonYaz(LS_Y, yeni)){            // depo dolu: ikinci kuşağı feda et
      try{ localStorage.removeItem(LS_Y2); }catch(e){}
      lsJsonYaz(LS_Y, yeni);
    }
    idbYedekYaz(yeni); dosyaYaz(DOSYA_Y, yeni);
  }
  /** Oyun her kaydettiğinde çağrılır: localStorage anında, IndexedDB ve cihaz deposu kısa gecikmeyle. */
  function yaz(metin){
    const t=Date.now();
    lsYaz(metin); lsZamanYaz(t);
    const d=saglam(metin);
    if(d) try{ yedekle(metin, d); }catch(e){}
    bekleyen=metin;
    if(yazmaZaman) clearTimeout(yazmaZaman);
    yazmaZaman=setTimeout(()=>{ yazmaZaman=null; const v=bekleyen; bekleyen=null;
      if(v!=null){ idbYaz(v); dosyaYaz(DOSYA, {t, v}); } }, 400);
  }
  /** Sayfa kapanırken bekleyen yazmayı hemen geçir. */
  function hemen(){
    if(yazmaZaman){ clearTimeout(yazmaZaman); yazmaZaman=null; }
    if(bekleyen!=null){ const v=bekleyen; bekleyen=null; idbYaz(v); dosyaYaz(DOSYA, {t:Date.now(), v}); }
  }

  function idbOkuId(id){
    return ac().then(d=>{ if(!d) return null;
      return new Promise(coz=>{ try{ const i=d.transaction(DEPO,"readonly").objectStore(DEPO).get(id);
        i.onsuccess=()=>coz(i.result||null); i.onerror=()=>coz(null); }catch(e){ coz(null); } }); }).catch(()=>null);
  }
  /** Açılıştan önce: IndexedDB ya da cihaz deposu daha yeniyse localStorage'a yaz,
      oradaki yedekleri de topla. Sağlam olmayan bir kayıt daha yeni diye seçilmez. */
  function hazirla(){
    return Promise.all([idbOku(), dosyaOku(DOSYA), idbOkuId("yedek"), dosyaOku(DOSYA_Y)]).then(([idb, dosya, idbY, dosyaY])=>{
      let en={t:lsZaman(), v:lsOku()};
      if(!en.v || !saglam(en.v)) en={t:-1, v:en.v};
      for(const k of [idb, dosya]) if(k && k.v && saglam(k.v) && (k.t||0)>en.t) en={t:k.t||Date.now(), v:k.v};
      if(en.t>=0 && en.v!==lsOku()){ lsYaz(en.v); lsZamanYaz(en.t); }
      yerelYedekler=[idbY, dosyaY].filter(y=>y && y.v);
    }).catch(()=>{});
  }
  /** Bilinen bütün yedekler, en yenisi önce. kaynak: yedek | yedek2 | silinen */
  function yedekler(){
    const l=[];
    const ekle=(y,k)=>{ if(y && y.v && saglam(y.v) && !l.some(x=>x.v===y.v)) l.push({kaynak:k, t:y.t||0, gun:y.gun||saglam(y.v).day, v:y.v}); };
    ekle(lsJson(LS_Y),"yedek"); ekle(lsJson(LS_Y2),"yedek2");
    yerelYedekler.forEach(y=>ekle(y,"yedek"));
    const sl=lsJson(LS_SIL); if(sl) ekle(sl,"silinen");
    return l.sort((a,b)=>(a.kaynak==="silinen")-(b.kaynak==="silinen") || b.t-a.t);
  }
  /** Açılamayan ana kaydı kenara koy (silme): destek için iz kalsın. */
  function bozukKenara(){
    const v=lsOku(); if(!v) return;
    lsJsonYaz(LS_BOZ, {t:Date.now(), v:v.slice(0,400000)});
  }
  /** Bir yedeği ana kayıt yap. */
  function yedektenYukle(y){
    if(!y || !saglam(y.v)) return false;
    lsYaz(y.v); lsZamanYaz(Date.now()); idbYaz(y.v); dosyaYaz(DOSYA, {t:Date.now(), v:y.v});
    return true;
  }

  function sil(){
    if(yazmaZaman){ clearTimeout(yazmaZaman); yazmaZaman=null; }
    bekleyen=null;
    // "Baştan başla" yanlışlıkla basıldıysa son oyun geri getirilebilsin
    const eski=lsOku(), d=eski&&saglam(eski);
    if(d && d.started && (d.day>1 || (d.stats&&d.stats.sold))) lsJsonYaz(LS_SIL, {t:Date.now(), gun:d.day, v:eski});
    try{ localStorage.removeItem(LS); localStorage.removeItem(LS+"_t");
      localStorage.removeItem(LS_Y); localStorage.removeItem(LS_Y2); }catch(e){}
    yerelYedekler=[];
    const F=fs(); if(F){ F.deleteFile({path:DOSYA, directory:"DATA"}).catch(()=>{}); F.deleteFile({path:DOSYA_Y, directory:"DATA"}).catch(()=>{}); }
    return ac().then(d=>{
      if(!d) return;
      try{ const st=d.transaction(DEPO,"readwrite").objectStore(DEPO); st.delete(ANAHTAR); st.delete("yedek"); }catch(e){}
    }).catch(()=>{});
  }

  /** Dışa aktarma / içe alma — cihaz değiştirirken kaydı taşımak için. */
  function disaAktar(){ return lsOku(); }
  function iceAl(metin){
    if(!metin || !saglam(metin)) return false;
    yaz(metin); return true;
  }

  window.addEventListener("pagehide", hemen);
  window.addEventListener("blur", hemen);
  document.addEventListener("visibilitychange", ()=>{ if(document.hidden) hemen(); });

  return {yaz, hazirla, sil, hemen, disaAktar, iceAl, yedekler, yedektenYukle, bozukKenara, saglam};
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
