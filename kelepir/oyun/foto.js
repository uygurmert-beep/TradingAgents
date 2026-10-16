/* ==================================================================
   ARAÇ FOTOĞRAFI — listede ve araç sayfasında 3B stüdyo çekimi

   Liste kartları ve araç sayfaları 2B yan profil çiziyordu; 3B vitrinde
   aynı araç bambaşka (ve artık daha iyi) görünüyordu. Bu modül her araç
   için 3B modelden bir kez stüdyo fotoğrafı çekip bellekte tutuyor:
   aynı gövde, aynı far/ızgara, aynı boya ve görünen kusurlar.

     • Ekran dışında küçük, ayrı bir çizici. W3D'nin sahnesine dokunmaz.
     • Kuyruklu: kare başına bir araç, arayüz takılmasın.
     • Fotoğraf hazır olana dek 2B çizim görünür, hazır olunca yer değişir.
     • three.js ya da WebGL yoksa (eski cihaz, test ortamı) 2B kalır.
   Anahtar, fotoğrafta görünen her şeyi kapsıyor (renk, yıl, boyalı/değişen,
   ekspertiz, görünen kusurlar); tamir ya da ekspertiz sonrası yeniden çekilir.
   ================================================================== */
const FOTO={en:960, boy:320, sinir:48, bellek:new Map(), son:new Map(), sira:[], ren:null, kapali:false, zamanlayici:null, sonEtkilesim:0};
/* FOTO.son: aracın (id) en son çekilmiş fotoğrafı. Ekspertiz, tamir, cila
   anahtarı değiştirince yeni çekim bitene kadar kart 2B çizime düşüp sonra
   fotoğrafa dönüyordu — oyuncu alıp satarken resim "değişip geri geliyordu".
   Artık yeni çekim hazır olana dek eski fotoğraf yerinde kalıyor. */
/* Oyuncu yazarken ya da kaydırırken çekim yapılmaz: bir çekim zayıf cihazda
   bir kareyi aşabiliyor ve arama kutusu takılıyordu. */
["input","keydown","touchmove","wheel","scroll"].forEach(t=>
  window.addEventListener(t, ()=>{ FOTO.sonEtkilesim=Date.now(); }, {passive:true, capture:true}));

function _ftAnahtar(c){
  const gorunen=(c.faults||[]).filter(f=>!f.fixed && (f.visible||c.inspected)).map(f=>f.k).sort().join(".");
  return [c.model&&c.model.n, c.color, c.year, c.boyali|0, c.degisen|0, c.inspected?1:0,
          c.cosmetic?1:0, gorunen, (c.goz||[]).join(".")].join("|");
}
function _ftHazirMi(){
  if(FOTO.kapali) return false;
  if(typeof THREE==="undefined" || typeof window.W3D_buildCar!=="function") return false;
  return true;
}
/** Kartta ve sayfada kullanılacak görsel: hazırsa fotoğraf, değilse 2B + kuyruk. */
function aracFoto(c, ayrinti){
  if(!c || !c.model || !_ftHazirMi()) return aracGorsel(c, ayrinti);
  const k=_ftAnahtar(c), url=FOTO.bellek.get(k);
  if(url){
    // en son kullanılan sona: sınır aşılınca hep en eskisi düşsün (LRU)
    FOTO.bellek.delete(k); FOTO.bellek.set(k, url);
    if(c.id!=null) FOTO.son.set(c.id, url);
    return `<img class="aracfoto" src="${url}" alt="${c.model.n}" draggable="false">`;
  }
  _ftSiraya(c, k);
  const eski = c.id!=null ? FOTO.son.get(c.id) : null;
  const yer = eski ? `<img class="aracfoto" src="${eski}" alt="${c.model.n}" draggable="false">` : aracGorsel(c, ayrinti);
  return `<span class="fotobekle${eski?" eskifoto":""}" data-foto="${encodeURIComponent(k)}">${yer}</span>`;
}
function _ftSiraya(c, k){
  if(FOTO.sira.some(x=>x.k===k)) return;
  FOTO.sira.push({c, k});
  _ftPlanla(250);
}
function _ftCizici(){
  if(FOTO.ren) return FOTO.ren;
  try{
    const r=new THREE.WebGLRenderer({antialias:true, alpha:true, preserveDrawingBuffer:true});
    r.setPixelRatio(1); r.setSize(FOTO.en, FOTO.boy, false);
    if(THREE.sRGBEncoding) r.outputEncoding=THREE.sRGBEncoding;
    if(THREE.ACESFilmicToneMapping){ r.toneMapping=THREE.ACESFilmicToneMapping; r.toneMappingExposure=1.05; }
    r.setClearColor(0x000000, 0);
    FOTO.ren=r;
  }catch(e){ FOTO.kapali=true; }
  return FOTO.ren;
}
function _ftCek(c){
  const r=_ftCizici(); if(!r) return null;
  const sc=new THREE.Scene();
  // stüdyo: yumuşak tepe ışığı, sıcak ana ışık (imza turuncusuna yakın), soğuk kontur
  sc.add(new THREE.HemisphereLight(0xEAF0FF, 0x2A2F3A, 0.95));
  const ana=new THREE.DirectionalLight(0xFFF1E0, 1.05); ana.position.set(4.5,6,-5); sc.add(ana);
  const kontur=new THREE.DirectionalLight(0x9CC0FF, 0.55); kontur.position.set(-5,3,4); sc.add(kontur);
  const car=window.W3D_buildCar(c, false);
  sc.add(car);
  const L=(car.userData.size||{l:4.4}).l;
  const cam=new THREE.PerspectiveCamera(20, FOTO.en/FOTO.boy, .1, 100);
  const d=L*1.55+1.05;   // 3:1 şeritte araç boyu kadrajın ~%85i
  cam.position.set(d*.66, 1.35, -d*.75); cam.lookAt(0, .58, 0);
  r.render(sc, cam);
  let url;
  try{ url=r.domElement.toDataURL("image/webp", .86); }catch(e){}
  if(!url || url.indexOf("image/webp")<0) url=r.domElement.toDataURL("image/png");
  // paylaşılmayan geometri ve malzemeleri bırak; dokular W3D önbelleğinde
  car.traverse(o=>{
    if(o.geometry && !(o.geometry.userData&&o.geometry.userData.paylasimli)) o.geometry.dispose();
    if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose()); }
  });
  return url;
}
function _ftPlanla(gecikme){
  if(FOTO.zamanlayici) return;
  FOTO.zamanlayici=setTimeout(()=>{
    FOTO.zamanlayici=null;
    if(Date.now()-FOTO.sonEtkilesim<700){ _ftPlanla(350); return; }
    if(typeof requestIdleCallback==="function") requestIdleCallback(_ftCalis, {timeout:1500});
    else _ftCalis();
  }, gecikme);
}
function _ftCalis(){
  const is=FOTO.sira.shift(); if(!is) return;
  let url=null;
  try{ url=_ftCek(is.c); }catch(e){ FOTO.kapali=true; }
  if(url){
    FOTO.bellek.set(is.k, url);
    if(is.c.id!=null) FOTO.son.set(is.c.id, url);
    if(FOTO.son.size>FOTO.sinir*2) FOTO.son.delete(FOTO.son.keys().next().value);
    if(FOTO.bellek.size>FOTO.sinir) FOTO.bellek.delete(FOTO.bellek.keys().next().value);
    const sec=`.fotobekle[data-foto="${CSS.escape(encodeURIComponent(is.k))}"]`;
    document.querySelectorAll(sec).forEach(el=>{
      const img=document.createElement("img");
      // eski fotoğrafın yerine geçen yenisi zıplamadan, yumuşakça gelsin
      img.className=el.classList.contains("eskifoto")?"aracfoto":"aracfoto yeni";
      img.src=url; img.alt=""; img.draggable=false;
      el.replaceWith(img);
    });
  }
  if(FOTO.sira.length) _ftPlanla(80);
}
