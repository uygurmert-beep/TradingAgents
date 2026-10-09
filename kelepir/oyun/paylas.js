/* ==================================================================
   KARTI PAYLAŞ — günün vakasını 1080×1920 bir kareye çiziyor.

   İki kart var ve ikisi farklı iş yapıyor:
     SORU   — aracın künyesi ve ekspertizi, cevap YOK. İzleyen "ben şu
              kadar verirdim" diye yorum yazsın diye. Dağılımı bu taşıyor.
     SONUÇ  — oyuncunun puanı ve sapması. Paylaşan kendini gösteriyor,
              izleyen merak ediyor.

   Çizim canvas'ta yapılıyor; dışarıdan font ya da görsel çekilmiyor,
   oyun çevrimdışı çalışmaya devam ediyor.
   ================================================================== */
const KART={ G:1080, Y:1920 };
/* Showroom paleti: paylaşılan kart oyunun kendisiyle aynı görünsün. */
const KART_RENK={
  zemin:"#F3F1EC", zemin2:"#FFFFFF", petrol:"#0E5E4B", altin:"#9A6200",
  yazi:"#16181B", yazi2:"#5C6168", yazi3:"#6B7077",
  yesil:"#0F7F3F", kirmizi:"#C8323C", koyu:"#16181B", etiket:"#D9A03A"
};
const KART_SITE="kelepiroyunu.com";

function _kf(boy, agirlik=600){
  return `${Math.min(agirlik,700)} ${boy}px "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif`;
}
/** Metni genişliğe sığdırarak satırlara böl. */
function _sar(ctx, metin, genislik){
  const kel=String(metin).split(/\s+/); const out=[]; let s="";
  for(const k of kel){
    const d=(s?s+" ":"")+k;
    if(ctx.measureText(d).width<=genislik){ s=d; }
    else { if(s) out.push(s); s=k; }
  }
  if(s) out.push(s);
  return out;
}
function _yuvarlakYol(ctx,x,y,g,y2,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+g-r,y); ctx.quadraticCurveTo(x+g,y,x+g,y+r);
  ctx.lineTo(x+g,y+y2-r); ctx.quadraticCurveTo(x+g,y+y2,x+g-r,y+y2);
  ctx.lineTo(x+r,y+y2); ctx.quadraticCurveTo(x,y+y2,x,y+y2-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
/** Marka işareti — uygulama ikonuyla aynı geometri. */
function _kartIsaret(ctx, x, y, boy){
  const s=boy/100;
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
  ctx.translate(50,50); ctx.rotate(-10*Math.PI/180); ctx.scale(.84,.84); ctx.translate(-50,-50);
  const etiket=new Path2D("M14,50 L46,17 A9,9 0 0 1 53,14 L82,14 A8,8 0 0 1 90,22 L90,51 "+
                          "A9,9 0 0 1 87,58 L55,90 A8,8 0 0 1 43,90 L14,61 A8,8 0 0 1 14,50 Z");
  ctx.fillStyle=KART_RENK.etiket; ctx.fill(etiket);
  ctx.fillStyle=KART_RENK.koyu;
  ctx.beginPath(); ctx.arc(34,32,8.5,0,Math.PI*2); ctx.fill();
  ctx.save();
  ctx.translate(55,55); ctx.rotate(10*Math.PI/180); ctx.translate(2,0);
  ctx.scale(.8,.8); ctx.translate(-55,-55);
  ctx.strokeStyle=KART_RENK.koyu; ctx.lineWidth=7.4;
  ctx.lineCap="round"; ctx.lineJoin="round";
  ctx.beginPath(); ctx.moveTo(52,33); ctx.lineTo(52,69); ctx.lineTo(70,78); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(41,49); ctx.lineTo(69,37); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(41,60); ctx.lineTo(69,48); ctx.stroke();
  ctx.restore(); ctx.restore();
}

function _kartZemin(ctx){
  const g=ctx.createLinearGradient(0,0,KART.G,KART.Y);
  g.addColorStop(0,KART_RENK.zemin2); g.addColorStop(.55,KART_RENK.zemin);
  g.addColorStop(1,"#E9E6DF");
  ctx.fillStyle=g; ctx.fillRect(0,0,KART.G,KART.Y);
  // sol üstte petrol ışıması
  const h=ctx.createRadialGradient(150,120,20,150,120,900);
  h.addColorStop(0,"rgba(14,94,75,.08)"); h.addColorStop(1,"rgba(14,94,75,0)");
  ctx.fillStyle=h; ctx.fillRect(0,0,KART.G,KART.Y);
  // alt kenarda petrol çizgi
  ctx.fillStyle=KART_RENK.petrol; ctx.fillRect(0,KART.Y-10,KART.G,10);
}
function _kartBaslik(ctx, ustMetin){
  _kartIsaret(ctx, 80, 86, 104);
  ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  ctx.fillStyle=KART_RENK.yazi; ctx.font=_kf(50,800);
  ctx.fillText("KELEPİR", 212, 150);
  ctx.fillStyle=KART_RENK.petrol; ctx.font=_kf(22,700);
  ctx.letterSpacing && (ctx.letterSpacing="3px");
  ctx.fillText(ustMetin, 214, 186);
  ctx.letterSpacing && (ctx.letterSpacing="0px");
}
function _kartAltlik(ctx, sagMetin){
  ctx.textAlign="left"; ctx.fillStyle=KART_RENK.yazi3; ctx.font=_kf(26,600);
  ctx.fillText(KART_SITE, 80, KART.Y-72);
  ctx.textAlign="right";
  ctx.fillText(sagMetin, KART.G-80, KART.Y-72);
}
/** Künye rozetleri — satır satır sarılıyor. */
function _kartCipler(ctx, ciplar, x, y, maxG){
  ctx.font=_kf(28,600); ctx.textBaseline="middle";
  let cx=x, cy=y;
  for(const [metin,renk] of ciplar){
    const g=ctx.measureText(metin).width+46;
    if(cx+g>x+maxG){ cx=x; cy+=72; }
    ctx.fillStyle=renk==="altin"?"rgba(168,106,0,.10)"
                 :renk==="kirmizi"?"rgba(200,50,60,.09)":"rgba(20,24,28,.05)";
    _yuvarlakYol(ctx,cx,cy-27,g,54,27); ctx.fill();
    ctx.fillStyle=renk==="altin"?KART_RENK.altin
                 :renk==="kirmizi"?KART_RENK.kirmizi:KART_RENK.yazi2;
    ctx.fillText(metin, cx+23, cy+1);
    cx+=g+14;
  }
  ctx.textBaseline="alphabetic";
  return cy+54;
}


/** Gözle bakış çubukları — kartın asıl içeriği bu. */
function _kartDurum(ctx, c, x, y, genislik){
  const comps=compsOf(c,false);
  ctx.fillStyle=KART_RENK.yazi3; ctx.font=_kf(24,700);
  ctx.letterSpacing && (ctx.letterSpacing="3px");
  ctx.textAlign="left"; ctx.fillText("GÖZLE BAKIŞ", x, y);
  ctx.letterSpacing && (ctx.letterSpacing="0px");
  let cy=y+46;
  for(const k of COMPKEYS){
    const v=comps[k];
    ctx.fillStyle=KART_RENK.yazi2; ctx.font=_kf(30,500);
    ctx.textAlign="left"; ctx.fillText(COMPLBL[k], x, cy+30);
    const bx=x+230, bg=genislik-300, by=cy+18;
    ctx.fillStyle="rgba(20,24,28,.08)";
    _yuvarlakYol(ctx,bx,by,bg,16,8); ctx.fill();
    const renk = v>=75?KART_RENK.yesil : v>=48?KART_RENK.altin : KART_RENK.kirmizi;
    ctx.fillStyle=renk;
    _yuvarlakYol(ctx,bx,by,Math.max(16,bg*v/100),16,8); ctx.fill();
    ctx.fillStyle=KART_RENK.yazi; ctx.font=_kf(28,700);
    ctx.textAlign="right"; ctx.fillText(String(v), x+genislik, cy+30);
    cy+=58;
  }
  ctx.textAlign="left";
  return cy;
}

/** SORU KARTI — cevap yok, yorum için. */
/** Ekspertiz mührü — oyundaki kâğıt raporun üstündeki damganın aynısı.
    Paylaşılan kart ile oyunun içindeki belge aynı dili konuşsun diye. */
function _kartMuhur(ctx, c, x, y){
  const h = (typeof muhurHukmu==="function") ? muhurHukmu(c)
          : (c.tramer? {s:"tramer", t:"TRAMERLİ"} : {s:"temiz", t:"TEMİZ"});
  const renk = h.s==="agir" ? KART_RENK.kirmizi : h.s==="tramer" ? KART_RENK.altin : KART_RENK.yesil;
  const metin = h.t.replace(/&Uuml;/g,"Ü");
  ctx.save();
  ctx.translate(x,y); ctx.rotate(-9*Math.PI/180);
  ctx.font=_kf(40,800);
  ctx.letterSpacing && (ctx.letterSpacing="6px");
  const g=ctx.measureText(metin).width+56, yk=108;
  ctx.globalAlpha=.82;
  ctx.strokeStyle=renk; ctx.lineWidth=6;
  _yuvarlakYol(ctx,-g/2,-yk/2,g,yk,10); ctx.stroke();
  ctx.lineWidth=2.5;
  _yuvarlakYol(ctx,-g/2+9,-yk/2+9,g-18,yk-18,6); ctx.stroke();
  ctx.fillStyle=renk; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(metin, 0, -12);
  ctx.font=_kf(19,600);
  ctx.letterSpacing && (ctx.letterSpacing="4px");
  ctx.fillText("EKSPERTİZ", 0, 26);
  ctx.letterSpacing && (ctx.letterSpacing="0px");
  ctx.restore();
  ctx.textBaseline="alphabetic"; ctx.textAlign="left"; ctx.globalAlpha=1;
}

function kartSoru(c, gun){
  const cv=document.createElement("canvas");
  cv.width=KART.G; cv.height=KART.Y;
  const ctx=cv.getContext("2d");
  _kartZemin(ctx);
  _kartBaslik(ctx, "GÜNÜN VAKASI · "+gun);

  // araç adı
  ctx.textAlign="left"; ctx.fillStyle=KART_RENK.yazi; ctx.font=_kf(92,800);
  let y=392;
  for(const satir of _sar(ctx, c.model.n, KART.G-160).slice(0,2)){
    ctx.fillText(satir, 80, y); y+=104;
  }
  ctx.fillStyle=KART_RENK.altin; ctx.font=_kf(62,700);
  ctx.fillText(String(c.year), 80, y);
  // Mühür yıl satırının sağında: başlık kaç satır sarsa da onu örtmüyor.
  _kartMuhur(ctx, c, KART.G-245, y-24);
  y+=56;

  // künye
  const yas=Math.max(1,(typeof YEAR!=="undefined"?YEAR:c.year)-c.year);
  const ciplar=[[mesafe(c.km),""],[c.gear,""],[c.fuel,""],[yas+" yıl",""]];
  if(c.tramer) ciplar.push(["Tramer "+tlk(c.tramer),"kirmizi"]);
  if(c.degisen) ciplar.push([c.degisen+" değişen","kirmizi"]);
  if(c.boyali) ciplar.push([c.boyali+" boyalı","altin"]);
  if(c.kmOynama) ciplar.push(["Km şüpheli","kirmizi"]);
  y=_kartCipler(ctx, ciplar, 80, y+44, KART.G-160)+36;

  // gözle bakış — kartı dolduran asıl içerik
  y=_kartDurum(ctx, c, 80, y+40, KART.G-160)+28;

  // açık arızalar
  const kusur=(c.faults||[]).filter(f=>!f.fixed);
  ctx.fillStyle=KART_RENK.yazi3; ctx.font=_kf(24,700);
  ctx.letterSpacing && (ctx.letterSpacing="3px");
  ctx.fillText(kusur.length?"EKSPERTİZDEN ÇIKANLAR":"EKSPERTİZ TEMİZ", 80, y);
  ctx.letterSpacing && (ctx.letterSpacing="0px");
  y+=52;
  ctx.font=_kf(33,500);
  for(const f of kusur.slice(0,4)){
    ctx.fillStyle=KART_RENK.yazi;
    ctx.fillText("· "+f.n, 80, y);
    ctx.fillStyle=KART_RENK.yazi3; ctx.textAlign="right";
    ctx.fillText(tl(f.cost), KART.G-80, y); ctx.textAlign="left";
    y+=50;
  }
  if(!kusur.length){ ctx.fillStyle=KART_RENK.yesil; ctx.fillText("Açık arıza yok.", 80, y); y+=50; }
  if(kusur.length>4){ ctx.fillStyle=KART_RENK.yazi3;
    ctx.fillText("+"+(kusur.length-4)+" kusur daha", 80, y); y+=50; }


  // soru bloğu — her zaman altta, sabit yerde
  const by=KART.Y-470;
  ctx.fillStyle="rgba(14,94,75,.07)";
  _yuvarlakYol(ctx,80,by,KART.G-160,250,28); ctx.fill();
  ctx.strokeStyle="rgba(14,94,75,.35)"; ctx.lineWidth=3;
  _yuvarlakYol(ctx,80,by,KART.G-160,250,28); ctx.stroke();
  ctx.textAlign="center";
  ctx.fillStyle=KART_RENK.petrol; ctx.font=_kf(26,700);
  ctx.letterSpacing && (ctx.letterSpacing="4px");
  ctx.fillText("BU ARACA EN FAZLA", KART.G/2, by+74);
  ctx.letterSpacing && (ctx.letterSpacing="0px");
  ctx.fillStyle=KART_RENK.yazi; ctx.font=_kf(74,800);
  ctx.fillText("SEN KAÇ VERİRDİN?", KART.G/2, by+166);
  ctx.fillStyle=KART_RENK.yazi3; ctx.font=_kf(28,500);
  ctx.fillText("Cevabını yoruma yaz", KART.G/2, by+218);

  _kartAltlik(ctx, "Her gün yeni vaka");
  return cv;
}

/** SONUÇ KARTI — puan ve sapma. */
function kartSonuc(s, gun){
  const cv=document.createElement("canvas");
  cv.width=KART.G; cv.height=KART.Y;
  const ctx=cv.getContext("2d");
  _kartZemin(ctx);
  _kartBaslik(ctx, "GÜNÜN VAKASI · "+gun);

  const renk = s.puan>=85?KART_RENK.yesil : s.puan>=55?KART_RENK.altin : KART_RENK.kirmizi;

  ctx.textAlign="left"; ctx.fillStyle=KART_RENK.yazi2; ctx.font=_kf(40,600);
  let y=360;
  for(const satir of _sar(ctx, s.ad, KART.G-160).slice(0,2)){ ctx.fillText(satir,80,y); y+=54; }

  // puan
  ctx.textAlign="center";
  ctx.fillStyle=renk; ctx.font=_kf(300,800);
  ctx.fillText(String(s.puan), KART.G/2, y+310);
  ctx.fillStyle=KART_RENK.yazi3; ctx.font=_kf(44,600);
  ctx.fillText("/ 100", KART.G/2, y+372);

  // karşılaştırma
  let ky=y+480;
  const satirlar=[
    ["Senin tavanın", tl(s.cevap), KART_RENK.yazi],
    ["Kârlı alımın tavanı", tl(s.hedef), KART_RENK.altin],
    ["Sapma", (s.sap>0?"+":"")+String(s.sap).replace(".",",")+"%",
      Math.abs(s.sap)<=3?KART_RENK.yesil:KART_RENK.kirmizi]
  ];
  ctx.fillStyle="#FFFFFF";
  _yuvarlakYol(ctx,80,ky-34,KART.G-160,satirlar.length*86+28,28); ctx.fill();
  for(const [et,deg,c2] of satirlar){
    ctx.textAlign="left"; ctx.fillStyle=KART_RENK.yazi2; ctx.font=_kf(34,500);
    ctx.fillText(et, 124, ky+34);
    ctx.textAlign="right"; ctx.fillStyle=c2; ctx.font=_kf(44,700);
    ctx.fillText(deg, KART.G-124, ky+34);
    ky+=86;
  }

  // seri
  ctx.textAlign="center"; ctx.fillStyle=KART_RENK.petrol; ctx.font=_kf(36,600);
  ctx.fillText(s.seri+" günlük seri", KART.G/2, ky+92);

  // davet: izleyen de denesin
  const dy=KART.Y-330;
  ctx.fillStyle="rgba(14,94,75,.07)";
  _yuvarlakYol(ctx,80,dy,KART.G-160,180,28); ctx.fill();
  ctx.strokeStyle="rgba(14,94,75,.35)"; ctx.lineWidth=3;
  _yuvarlakYol(ctx,80,dy,KART.G-160,180,28); ctx.stroke();
  ctx.textAlign="center"; ctx.fillStyle=KART_RENK.yazi; ctx.font=_kf(58,800);
  ctx.fillText("SEN KAÇ VERİRDİN?", KART.G/2, dy+88);
  ctx.fillStyle=KART_RENK.yazi3; ctx.font=_kf(28,500);
  ctx.fillText("Aynı araç bugün herkese çıkıyor", KART.G/2, dy+136);

  _kartAltlik(ctx, "Sen kaç verirdin?");
  return cv;
}

/* ---------- dışa aktarma ---------- */
function _kartDosyaAdi(tip, gun){ return `kelepir-${gun}-${tip}.png`; }

function kartYerliMi(){
  const cap=(typeof window!=="undefined" && window.Capacitor) || null;
  return !!(cap && (cap.isNativePlatform?cap.isNativePlatform():cap.isNative));
}
/** Kabukta sistem paylaşım sayfası; tarayıcıda indirme.
   Not: gömülü çerçevede (artifact önizlemesi) indirme izni verilmiyor ve
   bağlantı sessizce hiçbir şey yapmıyor. Orada indirme denemiyoruz —
   kullanıcıya görsele uzun basmasını söylüyoruz, o yol çalışıyor. */
async function kartDisaAktar(cv, ad){
  const veri=cv.toDataURL("image/png");
  const cap=(typeof window!=="undefined" && window.Capacitor) || null;
  const P=(cap && cap.Plugins) || {};
  if(kartYerliMi() && P.Filesystem && P.Share){
    try{
      const yaz=await P.Filesystem.writeFile({
        path:ad, data:veri.split(",")[1], directory:"CACHE"
      });
      await P.Share.share({ title:"Kelepir — günün vakası",
        text:"Sen kaç verirdin?", files:[yaz.uri] });
      return "paylasildi";
    }catch(e){ /* kullanıcı iptal etmiş olabilir */ return "iptal"; }
  }
  let gomulu=true;
  try{ gomulu = (window.top!==window.self); }catch(e){}
  if(gomulu) return "uzunbas";
  try{
    const a=document.createElement("a");
    a.href=veri; a.download=ad;
    document.body.appendChild(a); a.click(); a.remove();
    return "indirildi";
  }catch(e){ return "uzunbas"; }
}

/** Paylaşım sayfası: önizleme + iki düğme. */
let _kartCanvas=null, _kartAd="kelepir.png";
function openPaylas(tip){
  const gun=meydanGun();
  const m=meydanDurum();
  let cv, baslik, aciklama;
  if(tip==="sonuc" && m.sonSonuc){
    cv=kartSonuc(m.sonSonuc, gun);
    baslik="Sonuç kartı";
    aciklama="Puanını paylaş. İzleyen kendi tahminini yoruma yazsın.";
  }else{
    const c=(typeof _meydanCar!=="undefined" && _meydanCar) || meydanArac(gun);
    cv=kartSoru(c, gun);
    baslik="Soru kartı";
    aciklama="Cevap kartta yok. Paylaşınca insanlar kendi rakamını yazar.";
  }
  _kartCanvas=cv;
  _kartAd=_kartDosyaAdi(tip==="sonuc"?"sonuc":"soru", gun);
  const url=cv.toDataURL("image/png");
  const bittiMi=meydanOynandiMi();
  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">${baslik}</div>
        <div class="sheet-sub">1080 &times; 1920 &middot; ${gun}</div></div>
      <button class="x" data-act="closesheet" aria-label="Kapat">&times;</button></div>
    <img class="kartonizle" src="${url}" alt="Payla&#351;ım kart&#305; &ouml;nizlemesi">
    <div class="sec-note" style="margin:10px 2px 12px">${aciklama}</div>
    <div class="altsek" style="margin-bottom:10px">
      <button class="${tip!=="sonuc"?"on":""}" data-act="paylastip" data-t="soru">Soru</button>
      <button class="${tip==="sonuc"?"on":""}" data-act="paylastip" data-t="sonuc"
        ${bittiMi?"":"disabled"}>Sonu&ccedil;</button>
    </div>
    ${bittiMi?"":`<div class="sec-note" style="margin:-4px 2px 10px">Sonu&ccedil; kart&#305; i&ccedil;in
      &ouml;nce bug&uuml;nk&uuml; vakay&#305; cevapla.</div>`}
    <button class="btn primary full" data-act="kartaktar">${
      kartYerliMi()?"Kaydet &middot; payla&#351;":"Kart&#305; kaydet"}</button>
    ${kartYerliMi()?"":`<div class="sec-note" style="margin-top:8px;text-align:center">
      Taray&#305;c&#305;da g&ouml;rsele uzun bas&#305;p kaydedebilirsin.
      Uygulamada tek dokunu&#351;la payla&#351;&#305;m sayfas&#305; a&ccedil;&#305;l&#305;yor.</div>`}`);
}
async function kartAktarTikla(){
  if(!_kartCanvas) return;
  const sonuc=await kartDisaAktar(_kartCanvas, _kartAd);
  if(sonuc==="paylasildi") toast("Payla&#351;&#305;m sayfas&#305; a&ccedil;&#305;ld&#305;.","good");
  else if(sonuc==="indirildi") toast("Kart indirildi.","good");
  else if(sonuc==="iptal") toast("Payla&#351;&#305;m kapat&#305;ld&#305;.","warn");
  else toast("G&ouml;rsele uzun bas &rarr; <b>Resmi kaydet</b>. "+
             "Uygulamada tek dokunu&#351;la payla&#351;&#305;m sayfas&#305; a&ccedil;&#305;l&#305;yor.","warn");
}
