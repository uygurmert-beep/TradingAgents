/* ==================================================================
   UYGULAMA KABUĞU — Capacitor / PWA köprüsü
   Tarayıcıda da, Android/iOS kabuğunda da aynı dosya çalışır: her şey
   özellik yoklamasıyla korunuyor, kabuk yoksa hiçbir şey olmaz.
   ================================================================== */
const APP = (function(){
  const cap = ()=> (typeof window!=="undefined" && window.Capacitor) || null;
  const yerli = ()=>{ const c=cap(); return !!(c && (c.isNativePlatform ? c.isNativePlatform() : c.isNative)); };
  const eklenti = (ad)=>{ const c=cap(); return (c && c.Plugins && c.Plugins[ad]) || null; };

  /* ---- dikey kilit ---- */
  async function dikeyKilitle(){
    const so=eklenti("ScreenOrientation");
    if(so && so.lock){ try{ await so.lock({orientation:"portrait"}); return true; }catch(e){} }
    try{
      if(screen.orientation && screen.orientation.lock){
        await screen.orientation.lock("portrait");
        return true;
      }
    }catch(e){}
    return false;
  }

  /* ---- sistem çubukları ----
     Android 15+ (hedef API 36) pencereyi zorunlu olarak kenardan kenara
     açıyor: setBackgroundColor ve setOverlaysWebView artık etkisiz, hatta
     setOverlaysWebView(false) çağırmak düzeni bozuyor. Doğrusu çubuğun
     ardını gövde rengiyle doldurup dolguyu güvenli alandan almak — CSS
     tarafı bunu yapıyor. Burada yalnızca yazı/ikon rengini koyu temaya
     ayarlıyoruz. Capacitor 8'de bu çekirdekteki SystemBars; eski
     kabuklarda StatusBar eklentisi. İkisini de deniyoruz. */
  async function sistemCubuklari(){
    const sys=eklenti("SystemBars");
    if(sys && sys.setStyle){
      try{ await sys.setStyle({style:"dark"}); return; }catch(e){}
    }
    const sb=eklenti("StatusBar");
    if(!sb) return;
    try{ if(sb.setStyle) await sb.setStyle({style:"DARK"}); }catch(e){}
  }

  /* ---- açılış ekranı: sahne hazır olunca kapat ---- */
  async function acilisKapat(){
    const sp=eklenti("SplashScreen");
    if(sp && sp.hide){ try{ await sp.hide(); }catch(e){} }
  }

  /* ---- geri tuşu (Android) ----
     Sırayla: açık sayfa > 3B gezinti > pazar sekmesi > çıkış onayı. */
  function geriAdim(){
    try{
      // Tanıtım turu kendi akışını yönetiyor; geri tuşu turu bitirir.
      if(typeof DEMO!=="undefined" && DEMO && DEMO.aktif){
        if(typeof demoKapat==="function"){ demoKapat(); return true; }
      }
      const modal=document.getElementById("modal");
      if(modal && !modal.classList.contains("hidden")){
        if(typeof S!=="undefined" && S && S.neg){ S.neg=null; }
        if(typeof S!=="undefined" && S && S.report){ S.report=null; S.reportStep=0; }
        closeSheet(); render(); return true;
      }
      if(typeof S!=="undefined" && S && S.view3d){ S.view3d=false; render(); return true; }
      if(typeof S!=="undefined" && S && S.tab && S.tab!=="pazar"){ S.tab="pazar"; render(); return true; }
    }catch(e){}
    return false;
  }
  let cikisSorusu=0;
  function geriTus(){
    if(geriAdim()) return;
    const simdi=Date.now();
    if(simdi-cikisSorusu<2200){
      const app=eklenti("App");
      if(app && app.exitApp){ try{ app.exitApp(); }catch(e){} }
      return;
    }
    cikisSorusu=simdi;
    try{ toast("Çıkmak için tekrar geri tuşuna bas.","warn"); }catch(e){}
  }
  function geriBagla(){
    const app=eklenti("App");
    if(app && app.addListener){
      try{ app.addListener("backButton", geriTus); return; }catch(e){}
    }
    // Tarayıcı yedeği yalnızca tam ekran/yüklü kullanımda; gömülü çerçevede
    // (artifact önizlemesi) geçmişe dokunmayız.
    let bagimsiz=false;
    try{ bagimsiz = (window.top===window.self) &&
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches); }catch(e){}
    if(!bagimsiz) return;
    try{
      history.pushState({pl:1}, "");
      window.addEventListener("popstate", ()=>{
        history.pushState({pl:1}, "");
        if(!geriAdim()){ try{ toast("Çıkmak için uygulamayı kapat.","warn"); }catch(e){} }
      });
    }catch(e){}
  }

  /* ---- uygulama arka plana geçince kaydet, dönünce devam et ---- */
  function yasamDongusu(){
    const app=eklenti("App");
    let kipYedek=null;
    const dur=()=>{ try{ if(typeof S!=="undefined" && S && S.started) save();
                     if(typeof W3D!=="undefined") W3D.pause();
                     // Arka planda ses çalan uygulama hem pil yakar hem mağaza
                     // incelemesinde soru işareti. Kabukta müziği açıkça kesip
                     // bağlamı askıya alıyoruz; hangi kipte olduğunu saklıyoruz
                     // ki dönüşte aynı yerden devam etsin.
                     if(!yerli()) return;
                     if(typeof MUZ!=="undefined" && MUZ) kipYedek=MUZ.kip||null;
                     if(typeof muzikDur==="function") muzikDur();
                     if(typeof SES!=="undefined" && SES && SES.ac && SES.ac.suspend) SES.ac.suspend();
                   }catch(e){} };
    const devam=()=>{ try{
                       // Bağlam askıya alınmış dönüyor; dokunuş beklemeden aç.
                       if(yerli() && typeof sesAc==="function"){
                         sesAc();
                         if(kipYedek && typeof muzikKip==="function") muzikKip(kipYedek);
                         kipYedek=null;
                       }
                       if(typeof seriGuncelle==="function" && seriGuncelle()) render();
                       if(typeof S!=="undefined" && S && S.view3d && typeof W3D!=="undefined") W3D.resume();
                     }catch(e){} };
    if(app && app.addListener){
      try{
        app.addListener("appStateChange", st=>{ if(st && st.isActive===false) dur(); else devam(); });
      }catch(e){}
    }
    window.addEventListener("pagehide", dur);
    window.addEventListener("blur", dur);
  }

  /* ---- güvenli alanlar ----
     CSS tarafı zinciri kuruyor: --safe-area-inset-* (Capacitor Android'de
     enjekte ediyor) > env() (iOS) > 0. Buradaki iş yalnızca son emniyet
     kemeri: kabuk içindeyiz, iki kaynak da boş döndü ve üstte durum çubuğu
     var. Enjeksiyon gecikmeli geldiği için biraz bekleyip bakıyoruz, aksi
     halde gerçek değerin üstüne yazardık. */
  function guvenliAlan(){
    if(!yerli()) return;
    const d=document.documentElement;
    const bak=()=>{
      const inj=getComputedStyle(d).getPropertyValue("--safe-area-inset-top").trim();
      if(inj) return;                                   // gerçek değer geldi
      const st=getComputedStyle(d).getPropertyValue("--sat").trim();
      if(st && parseFloat(st)>0) return;                // env() dolu (iOS)
      // Emniyet kemerini --sat'a DEĞİL, Capacitor'ün yazdığı değişkene
      // koyuyoruz. Sebep: --sat'a satır içi yazarsak :root zincirini kalıcı
      // olarak ezeriz ve inset geç gelirse (ya da döndürme/klavye ile
      // değişirse) gerçek değer bir daha devreye giremez. Aynı değişkene
      // yazınca Capacitor'ün sonraki enjeksiyonu bizimkini doğal olarak
      // yerinden ediyor.
      d.style.setProperty("--safe-area-inset-top","24px");
    };
    setTimeout(bak, 450);
  }

  async function kur(){
    guvenliAlan();
    geriBagla();
    yasamDongusu();
    await dikeyKilitle();
    await sistemCubuklari();
    // ilk kare çizildikten sonra açılış ekranını kaldır
    requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(acilisKapat, 120)));
  }

  return {kur, yerli, geriAdim, dikeyKilitle};
})();
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", ()=>APP.kur());
else APP.kur();
