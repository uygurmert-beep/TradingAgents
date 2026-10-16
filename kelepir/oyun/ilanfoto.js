/* ==================================================================
   İLAN FOTOĞRAFI — açı, ışık, arka plan

   İlanın vitrini fotoğraf. Eskiden "sunum" üç seviyeli bir para düğmesiydi;
   şimdi aracı 3B modelden kendin çekiyorsun. Her araç başka bir kadrajda
   parlıyor: lüks stüdyoda, klasik akşam ışığında, SUV doğada, ticari
   galeri önünde. Puan alıcı akışını ve alıcının ilk teklifini kıpırdatır.

   Ahlaki kısım: açı hasarı saklayabilir. Kapıdaki boyayı göstermeyen bir
   ön çapraz ilanı temiz gösterir, daha çok alıcı getirir — ama aracı görmeye
   gelen alıcı şüphelenir (ekspertize gitme olasılığı ×1,25) ve saklanan
   hasar dürüst olmayan ilanda gizli kusur sayılır (game.js hiddenIssues).
   Çekim arayüz durumu (IFOTO) kayda yazılmaz; yalnız seçilen kadraj ve
   puanı araçta durur (car.ilanFoto), görüntü her açılışta yeniden çekilir.
   ================================================================== */
const IFOTO_SECENEK={
  aci:  [{k:"on",n:"&Ouml;n &ccedil;apraz"},{k:"yan",n:"Yan profil"},{k:"arka",n:"Arka &ccedil;apraz"}],
  isik: [{k:"gun",n:"G&uuml;n ışığı"},{k:"studyo",n:"St&uuml;dyo"},{k:"aksam",n:"Akşam"}],
  zemin:[{k:"galeri",n:"Galeri &ouml;n&uuml;"},{k:"studyo",n:"St&uuml;dyo fonu"},{k:"doga",n:"Sahil yolu"}]
};
/* Hangi açı hangi kaporta hasarını kadraja sokuyor. Listede olmayan,
   görünür bir hasar o açıda fotoğrafta "saklanmış" olur. */
const IFOTO_GOSTERIR={ on:["camurluk","kompleboya"], yan:["kapiboya","camurluk","altsac","kompleboya"], arka:["kompleboya","altsac"] };
const IFOTO_KAPORTA=["kapiboya","camurluk","altsac","kompleboya"];
const IFOTO_KOYU=["Siyah","Füme","Lacivert","Bordo","Kahverengi"];
const IFOTO={ id:null, aci:"on", isik:"gun", zemin:"galeri", ren:null, onbellek:new Map() };

/** Saf puan hesabı — gerekçeleriyle. (Test ediliyor.) */
function ilanFotoPuan(c, s){
  const seg=c.model.seg, notlar=[];
  let p=52;
  const ekle=(d,t)=>{ p+=d; if(t) notlar.push({d,t}); };
  if(s.aci==="on") ekle(12,"&Ouml;n &ccedil;apraz: alıcının ilk baktığı a&ccedil;ı");
  else if(s.aci==="yan") ekle(["sedan","klasik","lux"].includes(seg)?10:4, ["sedan","klasik","lux"].includes(seg)?"Uzun g&ouml;vde yandan g&uuml;zel g&ouml;r&uuml;n&uuml;yor":"Yan profil d&uuml;z kalıyor");
  else ekle(["suv","ticari"].includes(seg)?6:-2, ["suv","ticari"].includes(seg)?"Arkadan bagaj ve hacim g&ouml;r&uuml;n&uuml;yor":"Arkadan &ccedil;ekilmiş ilan soğuk duruyor");
  if(s.isik==="gun") ekle(6, IFOTO_KOYU.includes(c.color)?"":"A&ccedil;ık renk g&uuml;n ışığında parlıyor");
  else if(s.isik==="studyo") ekle(seg==="lux"?12:4, seg==="lux"?"L&uuml;ks ara&ccedil; st&uuml;dyo ışığında değer kazanıyor":"");
  else{
    if(["klasik","lux"].includes(seg)) ekle(12,"Akşam ışığı bu araca hik&acirc;ye katıyor");
    else ekle(2,"");
    if(IFOTO_KOYU.includes(c.color)) ekle(-8,`${c.color} renk akşamda kayboluyor`);
  }
  if(s.zemin==="galeri") ekle(seg==="ticari"?10:4, seg==="ticari"?"Ticari ara&ccedil; galeri &ouml;n&uuml;nde iş aracı gibi duruyor":"");
  else if(s.zemin==="studyo") ekle(seg==="lux"?9:3, seg==="lux"?"Sade fon l&uuml;ks aracı &ouml;ne &ccedil;ıkarıyor":"");
  else ekle(["suv","klasik"].includes(seg)?11:5, ["suv","klasik"].includes(seg)?"Sahil yolu bu aracın doğal yeri":"");
  if(c.cosmetic) ekle(6,"Cilalı boya ışığı yakalıyor");
  const gizler=ilanFotoGizler(c, s.aci);
  if(gizler.length) ekle(4*gizler.length, `Kadraj ${gizler.map(g=>g.n.toLocaleLowerCase("tr")).join(", ")} g&ouml;stermiyor`);
  return {puan:clamp(Math.round(p),30,98), notlar, gizler};
}
/** Bu açıda kadraja girmeyen, bilinen ve açık kaporta hasarları. */
function ilanFotoGizler(c, aci){
  return openFaults(c).filter(f=>IFOTO_KAPORTA.includes(f.k) && known(c,f) && !IFOTO_GOSTERIR[aci].includes(f.k))
    .map(f=>({k:f.k, n:f.n}));
}
/** game.js leadChance: kendi fotoğrafı olmayan ilan etkilenmez. */
function ilanFotoAkis(car){ return car.ilanFoto ? 1+(car.ilanFoto.puan-55)/100*0.5 : 1; }
function ilanFotoKalite(car){ return car.ilanFoto ? 1+(car.ilanFoto.puan-55)/100*0.04 : 1; }

/* ---- çekim: ayrı, küçük bir çizici; foto.js'in sahnesine dokunmaz ---- */
function _ifCizici(){
  if(IFOTO.ren) return IFOTO.ren;
  try{
    const r=new THREE.WebGLRenderer({antialias:true, alpha:true, preserveDrawingBuffer:true});
    r.setPixelRatio(1); r.setSize(720, 405, false);
    if(THREE.sRGBEncoding) r.outputEncoding=THREE.sRGBEncoding;
    if(THREE.ACESFilmicToneMapping){ r.toneMapping=THREE.ACESFilmicToneMapping; r.toneMappingExposure=1.05; }
    r.setClearColor(0x000000, 0);
    IFOTO.ren=r;
  }catch(e){ IFOTO.ren=false; }
  return IFOTO.ren;
}
function _ifZemin(g, s, W, H){
  const ufuk=H*.58;
  if(s.zemin==="studyo"){
    const rg=g.createRadialGradient(W/2,H*.45,40,W/2,H*.5,W*.75);
    rg.addColorStop(0,"#FAFAF8"); rg.addColorStop(1,"#C9CCCF");
    g.fillStyle=rg; g.fillRect(0,0,W,H);
  }else{
    const gk=g.createLinearGradient(0,0,0,ufuk);
    gk.addColorStop(0,"#8EC5EC"); gk.addColorStop(1,"#E8F2F8");
    g.fillStyle=gk; g.fillRect(0,0,W,ufuk+2);
    if(s.zemin==="doga"){
      g.fillStyle="#3E86B8"; g.fillRect(0,ufuk-26,W,28);                // deniz
      g.fillStyle="#6E9E5A"; g.beginPath(); g.moveTo(0,ufuk-26);          // uzak tepe
      for(let x=0;x<=W;x+=40) g.lineTo(x, ufuk-34-Math.sin(x/90)*14-Math.sin(x/37)*5);
      g.lineTo(W,ufuk-26); g.closePath(); g.fill();
      const gy=g.createLinearGradient(0,ufuk,0,H); gy.addColorStop(0,"#9A9C9A"); gy.addColorStop(1,"#6F7273");
      g.fillStyle=gy; g.fillRect(0,ufuk,W,H-ufuk);                         // sahil yolu
      g.fillStyle="rgba(255,255,255,.75)";
      for(let x=10;x<W;x+=90) g.fillRect(x,H*.9,46,5);
    }else{
      g.fillStyle="#D9D4C7"; g.fillRect(0,ufuk-60,W,60);                  // galeri cephesi
      g.fillStyle="#1F2226"; g.fillRect(W*.1,ufuk-54,W*.8,18);            // tabela
      g.fillStyle="#F2A007"; g.font="700 13px 'Space Grotesk',sans-serif"; g.textAlign="center";
      g.fillText((typeof lotAd==="function"?lotAd():"GALERİ"), W/2, ufuk-40);
      const renk=["#E8453C","#F5B234","#2E8FD8","#3DBE72"];
      for(let i=0;i<24;i++){ g.fillStyle=renk[i%4]; g.beginPath();
        const x=i*W/24; g.moveTo(x,6); g.lineTo(x+W/24,6); g.lineTo(x+W/48,22); g.fill(); }
      const ga=g.createLinearGradient(0,ufuk,0,H); ga.addColorStop(0,"#5B6066"); ga.addColorStop(1,"#3B3F44");
      g.fillStyle=ga; g.fillRect(0,ufuk,W,H-ufuk);                        // asfalt
      g.strokeStyle="rgba(240,200,80,.8)"; g.lineWidth=3;
      for(let x=-W;x<W*2;x+=150){ g.beginPath(); g.moveTo(x,H); g.lineTo(x+120,ufuk); g.stroke(); }
    }
  }
  if(s.isik==="aksam"){
    const ak=g.createLinearGradient(0,0,0,H);
    ak.addColorStop(0,"rgba(255,140,60,.30)"); ak.addColorStop(1,"rgba(70,30,60,.22)");
    g.fillStyle=ak; g.fillRect(0,0,W,H);
  }
  // aracın gölgesi
  const sg=g.createRadialGradient(W/2,H*.83,10,W/2,H*.83,W*.36);
  sg.addColorStop(0,"rgba(0,0,0,.42)"); sg.addColorStop(1,"rgba(0,0,0,0)");
  g.fillStyle=sg; g.beginPath(); g.ellipse(W/2,H*.83,W*.36,H*.07,0,0,Math.PI*2); g.fill();
}
/** Kadrajı çeker, dataURL döndürür. WebGL yoksa 2B çizime düşer (null). */
function ilanFotoCek(c, s){
  const anahtar=[_ftAnahtar(c), s.aci, s.isik, s.zemin].join("~");
  if(IFOTO.onbellek.has(anahtar)) return IFOTO.onbellek.get(anahtar);
  if(typeof THREE==="undefined" || typeof window.W3D_buildCar!=="function") return null;
  const r=_ifCizici(); if(!r) return null;
  const W=720, H=405;
  const sc=new THREE.Scene();
  if(s.isik==="studyo"){
    sc.add(new THREE.HemisphereLight(0xFFFFFF, 0x50555C, 0.85));
    const k=new THREE.DirectionalLight(0xFFFFFF, 1.25); k.position.set(3,7,-4); sc.add(k);
    const rim=new THREE.DirectionalLight(0xDDE8FF, 0.7); rim.position.set(-5,3,5); sc.add(rim);
  }else if(s.isik==="aksam"){
    sc.add(new THREE.HemisphereLight(0xFFB27A, 0x2A2038, 0.7));
    const gun=new THREE.DirectionalLight(0xFF9A4D, 1.35); gun.position.set(6,2,-3); sc.add(gun);
  }else{
    sc.add(new THREE.HemisphereLight(0xEAF0FF, 0x5A5A4A, 1.0));
    const gun=new THREE.DirectionalLight(0xFFF4E0, 1.15); gun.position.set(4,8,-5); sc.add(gun);
  }
  const car=window.W3D_buildCar(c, false); sc.add(car);
  const L=(car.userData.size||{l:4.4}).l;
  const cam=new THREE.PerspectiveCamera(24, W/H, .1, 100);
  const d=L*1.8+0.8;
  const poz={ on:[d*.66,1.25,-d*.75], yan:[d,1.05,0.0001], arka:[d*.66,1.35,d*.75] }[s.aci]||[d*.66,1.25,-d*.75];
  cam.position.set(...poz); cam.lookAt(0,.62,0);
  r.render(sc, cam);
  const tuval=document.createElement("canvas"); tuval.width=W; tuval.height=H;
  const g=tuval.getContext("2d");
  _ifZemin(g, s, W, H);
  g.drawImage(r.domElement, 0, 0, W, H);
  car.traverse(o=>{
    if(o.geometry && !(o.geometry.userData&&o.geometry.userData.paylasimli)) o.geometry.dispose();
    if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose()); }
  });
  let url; try{ url=tuval.toDataURL("image/jpeg", .86); }catch(e){ url=null; }
  if(url){
    IFOTO.onbellek.set(anahtar, url);
    if(IFOTO.onbellek.size>24) IFOTO.onbellek.delete(IFOTO.onbellek.keys().next().value);
  }
  return url;
}

/** İlan formundaki satır. */
function ilanFotoBlok(c){
  const f=c.ilanFoto;
  return `<div class="ilan-alt">İLAN FOTOĞRAFI</div>
    <button class="ifoto-satir" data-act="ifotoac" data-id="${c.id}">
      <span class="ifoto-kucuk">${f?`<b>${f.puan}</b>`:`<svg viewBox="0 0 24 24"><path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>`}</span>
      <span class="ifoto-yazi"><b>${f?"Fotoğraf &ccedil;ekildi":"Kendin &ccedil;ek"}</b>
        <span>${f?`Puan ${f.puan}/100 &middot; alıcı akışı &times;${ilanFotoAkis(c).toFixed(2)}${f.gizler&&f.gizler.length?" &middot; hasar kadraj dışında":""}`
                :"A&ccedil;ı, ışık ve arka planı se&ccedil; — iyi kadraj daha &ccedil;ok alıcı getirir"}</span></span>
      <i>&rsaquo;</i>
    </button>`;
}

function openIlanFoto(id){
  const c=S.cars.find(x=>x.id===+id); if(!c) return;
  if(IFOTO.id!==c.id){
    IFOTO.id=c.id;
    const f=c.ilanFoto||{};
    IFOTO.aci=f.aci||"on"; IFOTO.isik=f.isik||"gun"; IFOTO.zemin=f.zemin||"galeri";
  }
  const s={aci:IFOTO.aci, isik:IFOTO.isik, zemin:IFOTO.zemin};
  const p=ilanFotoPuan(c, s);
  let url=null; try{ url=ilanFotoCek(c, s); }catch(e){ url=null; }
  const satir=(g, baslik)=>`<div class="ilan-alt">${baslik}</div>
    <div class="seg ifoto-seg">${IFOTO_SECENEK[g].map(o=>`<button class="${IFOTO[g]===o.k?"on":""}"
      data-act="ifsec" data-g="${g}" data-k="${o.k}" data-id="${c.id}">${o.n}</button>`).join("")}</div>`;
  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">İlan fotoğrafı</div>
      <div class="sheet-sub">${c.model.n} &middot; ${c.year} &middot; ${c.color}</div></div>
      <button class="x" data-act="close" aria-label="Kapat">&times;</button></div>
    <div class="ifoto-onizleme">${url?`<img src="${url}" alt="İlan fotoğrafı önizlemesi">`:aracGorsel(c,"tam")}
      <span class="ifoto-puan"><b>${p.puan}</b>/100</span></div>
    ${satir("aci","A&Ccedil;I")}${satir("isik","IŞIK")}${satir("zemin","ARKA PLAN")}
    <div class="block ifoto-not"><h4>NEDEN BU PUAN</h4>
      ${p.notlar.length?p.notlar.map(n=>`<div class="ifoto-gerekce ${n.d<0?"neg":""}"><b>${n.d>0?"+":""}${n.d}</b><span>${n.t}</span></div>`).join("")
        :`<div class="sec-note">Sıradan bir kadraj. Aracın segmentine uyan bir ışık ya da arka plan dene.</div>`}
      ${p.gizler.length?`<div class="sec-note ifoto-uyari">Bu a&ccedil;ı ${p.gizler.map(g=>g.n.toLocaleLowerCase("tr")).join(", ")} g&ouml;stermiyor.
        İlan temiz g&ouml;r&uuml;n&uuml;r ama aracı g&ouml;rmeye gelen şüphelenir; d&uuml;r&uuml;st ilan değilse saklanmış kusur sayılır.</div>`:""}
    </div>
    <div class="actionbar">
      <button class="btn primary full" data-act="ifkullan" data-id="${c.id}">Bu fotoğrafı kullan &middot; akış &times;${(1+(p.puan-55)/100*0.5).toFixed(2)}</button>
    </div>`);
}

KANCA.eylem.ifotoac=b=>openIlanFoto(b.dataset.id);
KANCA.eylem.ifsec=b=>{
  const g=b.dataset.g, k=b.dataset.k;
  if(!IFOTO_SECENEK[g] || !IFOTO_SECENEK[g].some(o=>o.k===k)) return;
  IFOTO[g]=k; openIlanFoto(b.dataset.id);
};
KANCA.eylem.ifkullan=(b, car)=>{
  if(!car || !car.owned) return;
  const s={aci:IFOTO.aci, isik:IFOTO.isik, zemin:IFOTO.zemin};
  const p=ilanFotoPuan(car, s);
  car.ilanFoto={...s, puan:p.puan, gizler:p.gizler};
  toast(`İlan fotoğrafı hazır — puan ${p.puan}.`,"good");
  save(); openOwnCar(car);
};
