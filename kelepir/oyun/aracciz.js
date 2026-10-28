/* ==================================================================
   ARAÇ ÇİZİMİ
   150 model için 150 ayrı araba, elle çizilmeden. Her model kendi
   adından türeyen sabit bir tohumla aynı arabayı üretiyor.

   Önceki sürüm gövdeyi serbest eğrilerle kuruyordu ve oranlar tutmuyordu.
   Bu sürüm arabayı gerçekte ölçüldüğü gibi kuruyor:

     dingil mesafesi + ön taşma + arka taşma = toplam boy
     teker yarıçapı → eşik yüksekliği → kuşak hattı → tavan

   Üstüne DÖNEM biniyor: 1975 modeli bir araba ile 2023 modeli aynı
   oranlarda olamaz. Eskiler uzun taşmalı, alçak kuşaklı, ince direkli,
   küçük tekerli ve kromlu; yeniler kısa taşmalı, yüksek kuşaklı, kalın
   direkli ve büyük tekerli.

   Örnek katmanı en sonda: boya, aşınma, boyalı panel, değişen panel,
   kırık far. Ekspertiz raporunun görsel karşılığı.
   ================================================================== */

function _acTohum(metin){
  let h=2166136261>>>0;
  for(let i=0;i<metin.length;i++){ h^=metin.charCodeAt(i); h=Math.imul(h,16777619)>>>0; }
  return h>>>0;
}
function _acRnd(t){
  let a=t>>>0;
  return ()=>{ a=(a+0x6D2B79F5)>>>0;
    let x=Math.imul(a^(a>>>15), 1|a);
    x=(x+Math.imul(x^(x>>>7), 61|x))^x;
    return ((x^(x>>>14))>>>0)/4294967296; };
}
const _acAr=(r,[a,b])=>a+(b-a)*r();
const _acN=(v)=>Math.round(v*10)/10;
function _acRenk(hex,k){
  const c=String(hex||"#8E9AA6").replace("#","");
  const s=c.length===3?c.split("").map(x=>x+x).join(""):c;
  const num=parseInt(s,16); if(isNaN(num)) return "#8E9AA6";
  const f=(v)=>Math.max(0,Math.min(255,Math.round(v*k)));
  return "#"+((1<<24)+(f((num>>16)&255)<<16)+(f((num>>8)&255)<<8)+f(num&255)).toString(16).slice(1);
}

/* Segment iskeletleri — gerçek gövde oranlarından.
   boy: toplam uzunluk · dingil: boyun yüzdesi olarak dingil mesafesi
   onTas: boyun yüzdesi olarak ön taşma · teker: boya göre teker yarıçapı
   govde: eşikten kuşağa yükseklik · kabin: kuşaktan tavana
   kaput: dingil arası içinde kaput payı · kuyruk: arka biçim */
/* Segment iskeletleri — uydurma değil, gerçek araç ölçülerinden türetildi.
   Hepsi aracın BOYUNA oranlanmış. Örnek (B segmenti hatchback):
     boy 4,05 m · teker çapı 0,63 m · eşik 0,34 m · kuşak 0,92 m · tavan 1,46 m
   → teker 0,078 · esik 0,084 · govde 0,143 · kabin 0,133

     dingil  dingil mesafesi / boy        onTas  ön taşma / boy
     teker   teker yarıçapı / boy         esik   eşik yüksekliği (yerden) / boy
     govde   eşikten kuşağa / boy         kabin  kuşaktan tavana / boy
     kaput   dingil arasındaki kaput payı */
const AC_ISKELET={
  hatch:  {boy:[146,158], dingil:[.628,.652], onTas:[.198,.214], teker:[.0755,.0800],
           esik:[.080,.090], govde:[.136,.150], kabin:[.126,.140], kaput:[.100,.122],
           kuyruk:"hatch", aRake:[.44,.58], cRake:[.26,.40], cam:[2,3]},
  sedan:  {boy:[174,188], dingil:[.578,.600], onTas:[.198,.214], teker:[.0685,.0725],
           esik:[.068,.078], govde:[.124,.136], kabin:[.106,.120], kaput:[.134,.158],
           kuyruk:"bagaj", aRake:[.48,.62], cRake:[.50,.70], cam:[3,3]},
  suv:    {boy:[164,178], dingil:[.580,.606], onTas:[.186,.204], teker:[.0790,.0840],
           esik:[.102,.116], govde:[.128,.142], kabin:[.132,.148], kaput:[.140,.166],
           kuyruk:"dik", aRake:[.40,.52], cRake:[.08,.18], cam:[3,3]},
  /* Panelvan: kasa tavanı arkaya kadar düz gidiyor, arka kapı neredeyse
     dik iniyor, B direğinden sonra cam yok. Doblo/Kangoo/Transit ölçüleri:
     boy 4,4 m · yükseklik 1,80 m → 0,41; tavan boyun %90'ına kadar sürüyor. */
  ticari: {boy:[180,196], dingil:[.615,.640], onTas:[.176,.192], teker:[.0660,.0700],
           esik:[.078,.090], govde:[.126,.140], kabin:[.168,.190], kaput:[.072,.104],
           kuyruk:"van", aRake:[.52,.68], cRake:[.03,.07], cam:[2,2]},
  lux:    {boy:[186,200], dingil:[.588,.610], onTas:[.184,.200], teker:[.0680,.0720],
           esik:[.062,.072], govde:[.118,.130], kabin:[.098,.112], kaput:[.214,.250],
           kuyruk:"bagaj", aRake:[.52,.66], cRake:[.56,.76], cam:[3,3]},
  klasik: {boy:[156,174], dingil:[.580,.604], onTas:[.186,.202], teker:[.0715,.0760],
           esik:[.080,.092], govde:[.110,.124], kabin:[.124,.140], kaput:[.186,.220],
           kuyruk:"bagaj", aRake:[.26,.38], cRake:[.30,.46], cam:[2,3]}
};
const AC_FAR=["dilim","yuvarlak","bumerang","L","ince"];
const AC_IZGARA=["trapez","petek","cubuk","kapali","yarik"];
const AC_JANT=["bes","cift","turbin","cok","celik"];

/** Modelin kalıcı kimliği. donem: 0 = 1970'ler, 1 = 2020'ler. */
function aracKimlik(ad, seg, donem){
  const r=_acRnd(_acTohum(ad+"|"+seg));
  const sk=AC_ISKELET[seg]||AC_ISKELET.sedan;
  const d=(donem==null?0.8:Math.max(0,Math.min(1,donem)));
  const klasik=seg==="klasik";

  // Dönem oranları kaydırıyor: eski araba uzun taşmalı, alçak kuşaklı,
  // küçük tekerli; yeni araba tam tersi.
  // Dönem oranları kaydırıyor ama gerçeklik bandının dışına taşırmıyor:
  // eski araba daha uzun taşmalı, alçak kuşaklı, bol camlı ve küçük
  // tekerli; yeni araba kısa taşmalı, yüksek kuşaklı, dar camlı.
  const boy   = _acAr(r,sk.boy);
  const teker = _acAr(r,sk.teker) * (0.94 + d*0.10);
  const esikH = _acAr(r,sk.esik);
  const govde = _acAr(r,sk.govde) * (0.90 + d*0.16);     // kuşak yüksekliği
  const kabin = _acAr(r,sk.kabin) * (1.08 - d*0.12);     // cam kuşağı payı
  const onTas = _acAr(r,sk.onTas) * (1.06 - d*0.09);
  const dingil= _acAr(r,sk.dingil)* (0.98 + d*0.03);
  const aRake = _acAr(r,sk.aRake) * (0.70 + d*0.40);     // ön cam eğimi

  return {
    seg, donem:d, kuyruk:sk.kuyruk,
    boy, teker, esikH, govde, kabin, onTas, dingil, aRake,
    cRake:_acAr(r,sk.cRake),
    kaput:_acAr(r,sk.kaput),
    cam: sk.cam[0]===sk.cam[1] ? sk.cam[0] : (r()<.45?sk.cam[0]:sk.cam[1]),
    kink: r()<.38 && d>.45,
    cizgi: d<.35 ? (r()<.5?1:0) : (r()<.30?0:(r()<.80?1:2)),
    // Yuvarlak far 2000'lerden sonra yok; modern araçta aile listesinden
    // çıkarılıyor, yoksa 2020 model yuvarlak farla çıkıyordu.
    far: klasik||d<.28 ? (r()<.55?"yuvarlak":"dilim")
                       : AC_FAR.filter(f=>f!=="yuvarlak")[(r()*(AC_FAR.length-1))|0],
    izgara: klasik||d<.3 ? "cubuk" : AC_IZGARA[(r()*AC_IZGARA.length)|0],
    jant: klasik||d<.3 ? "celik" : AC_JANT[(r()*AC_JANT.length)|0],
    krom: d<.32,
    rayli: seg==="suv" && r()<.68,
    kaplama: seg==="suv" && d>.32 && r()<.88,   // siyah çamurluk kaplaması
    spoyler: (seg==="hatch"||seg==="lux") && d>.5 && r()<.26,
    // Panelvanın arkası sacdır; camlı cam göz (kombi) azınlıkta kalıyor.
    sacArka: seg==="ticari" && r()<.82,
    // Panelvan tavanı kubbeli değil, düz bir kasa tavanı.
    tavanKuba: seg==="ticari" ? 0.2+r()*0.5 : 1.2 + r()*1.6
  };
}

/** Yandan profil SVG'si. ayrinti: "mini" | "tam" | "buyuk" */
function aracSvg(k, ornek, ayrinti){
  ornek=ornek||{}; ayrinti=ayrinti||"tam";
  const tam = ayrinti!=="mini";
  const renk = ornek.renk || "#8E9AA6";
  const asinma = Math.max(0, Math.min(1, ornek.asinma||0));
  const boyali = ornek.boyali||0, degisen = ornek.degisen||0;
  const kirik = !!ornek.kirikFar;

  // ---------- tuval ve ana ölçüler ----------
  const G=240, Y=104, zemin=86;
  const L=k.boy, x0=(G-L)/2, x1=x0+L;
  const R=L*k.teker;                       // teker yarıçapı
  const WB=L*k.dingil, FO=L*k.onTas;
  const onX=x0+FO, arkaX=onX+WB;
  const yTeker=zemin-R;
  const esik=zemin-L*k.esikH;              // eşik: yerden ölçülüyor, tekerden değil
  const kusak=esik-L*k.govde;              // cam alt hattı
  const tavan=kusak-L*k.kabin;             // tavan hattı

  // kaput: burundan cowl'a hafif yükselerek
  const kaputBoy=WB*k.kaput;
  const cowlX=onX-R*0.45+kaputBoy;
  const burunY=kusak+L*0.012;
  const cowlY=kusak-L*0.004;

  const tavanBas=cowlX+L*k.aRake*0.17;
  const cRun=L*k.cRake*0.17;

  // ---------- kuyruk ----------
  // Önce tavanın nerede biteceğini kesinleştiriyoruz; eskiden tavan sonu
  // kuyruk yolu kurulduktan SONRA kırpılıyordu ve arkada ince bir çıkıntı
  // kalıyordu.
  let tavanSon, kuyrukD, bagajY, bagajKapak=null;
  if(k.kuyruk==="bagaj"){
    // Sedanda kabin boyun ~%40'ı, bagaj ~%20'si. Önceki tavan sonu
    // dingilin yarısındaydı; araç kabini öne kaçmış bir kamyonete
    // benziyordu.
    tavanSon=Math.min(tavanBas+WB*0.66, x1-cRun-L*0.105);
    bagajY=kusak-L*0.014;
    const bagajBas=Math.max(tavanSon+L*0.024, Math.min(tavanSon+cRun, x1-L*0.085));
    bagajKapak=bagajBas;
    kuyrukD=`L${_acN(bagajBas)},${_acN(bagajY)} L${_acN(x1-L*0.020)},${_acN(bagajY-L*0.005)} `+
            `Q${_acN(x1)},${_acN(bagajY)} ${_acN(x1)},${_acN(bagajY+L*0.020)} L${_acN(x1)},${_acN(esik)}`;
  }else if(k.kuyruk==="hatch"){
    // Hatchback'te arka cam neredeyse tamponun üstünde biter; tavandan
    // sonra uzun bir güverte yoktur. Önceki oran onu kamyonete çeviriyordu.
    tavanSon=Math.min(tavanBas+WB*0.86, x1-cRun*0.55-L*0.030);
    bagajY=tavan+(kusak-tavan)*0.52;
    const bagajBas=Math.max(tavanSon+L*0.022, Math.min(tavanSon+cRun*0.75, x1-L*0.022));
    kuyrukD=`L${_acN(bagajBas)},${_acN(bagajY)} `+
            `Q${_acN(x1)},${_acN(bagajY+L*0.008)} ${_acN(x1)},${_acN(bagajY+L*0.028)} L${_acN(x1)},${_acN(esik)}`;
  }else if(k.kuyruk==="van"){
    // Kasa tavanı arka tampona kadar sürüyor, arka kapı dik iniyor.
    tavanSon=x1-L*0.040;
    // Tavan köşesi gövde konturunda tavan+0.022L'ye iniyor; arka kapı
    // bunun ALTINDAN başlamalı, yoksa köşede yukarı doğru bir çentik kalıyor.
    bagajY=tavan+Math.max((kusak-tavan)*0.10, L*0.032);
    kuyrukD=`L${_acN(x1-L*0.012)},${_acN(bagajY)} `+
            `Q${_acN(x1)},${_acN(bagajY+L*0.004)} ${_acN(x1)},${_acN(bagajY+L*0.020)} L${_acN(x1)},${_acN(esik)}`;
  }else{
    // SUV: tavan arka cama kadar sürüyor. Eskiden dingil mesafesine
    // bağlı bir tavan sonu vardı ve araç bagajlı bir sedan gibi çıkıyordu.
    tavanSon=Math.max(tavanBas+WB*0.66, x1-cRun-L*0.048);
    bagajY=tavan+(kusak-tavan)*0.20;
    const bagajBas=Math.max(tavanSon+L*0.018, Math.min(tavanSon+cRun, x1-L*0.020));
    kuyrukD=`L${_acN(bagajBas)},${_acN(bagajY)} `+
            `Q${_acN(x1)},${_acN(bagajY+L*0.006)} ${_acN(x1)},${_acN(bagajY+L*0.024)} L${_acN(x1)},${_acN(esik)}`;
  }
  const tavanOrta=(tavanBas+tavanSon)/2;

  // ---------- gövde konturu ----------
  const govde =
    `M${_acN(x0)},${_acN(esik)} `+
    `L${_acN(x0)},${_acN(burunY+L*0.020)} `+
    `Q${_acN(x0)},${_acN(burunY)} ${_acN(x0+L*0.026)},${_acN(burunY-L*0.004)} `+
    `L${_acN(cowlX)},${_acN(cowlY)} `+
    `Q${_acN(cowlX+(tavanBas-cowlX)*0.52)},${_acN(cowlY-(cowlY-tavan)*0.30)} `+
      `${_acN(tavanBas-L*0.012)},${_acN(tavan+L*0.012)} `+
    `Q${_acN(tavanBas)},${_acN(tavan)} ${_acN(tavanBas+L*0.028)},${_acN(tavan)} `+
    `Q${_acN(tavanOrta)},${_acN(tavan-k.tavanKuba)} ${_acN(tavanSon-L*0.018)},${_acN(tavan+L*0.004)} `+
    `Q${_acN(tavanSon)},${_acN(tavan+L*0.010)} ${_acN(tavanSon+L*0.012)},${_acN(tavan+L*0.022)} `+
    kuyrukD+` Z`;

  // ---------- camlar ----------
  const camUst=tavan+L*0.016;
  const camBas=tavanBas+L*0.020;
  // Panelvanda cam kuşağı kabinle biter; arkası yük kasasıdır. Diğer
  // gövdelerde cam, tavanın bittiği yere kadar sürüyor.
  const camSon = k.kuyruk==="van"
    ? camBas+(x1-camBas)*(k.sacArka?0.40:0.62)
    : Math.max(camBas+L*0.10, (k.kuyruk==="bagaj"?tavanSon+cRun*0.42:tavanSon+cRun*0.52));
  const camAlt=kusak-L*0.012;
  const adet=(k.kuyruk==="van") ? k.cam : (k.sacArka?Math.max(1,k.cam-1):k.cam);
  const bir=(camSon-camBas)/adet;
  const direk=L*(0.009+k.donem*0.006);
  let camlar="";
  for(let i=0;i<adet;i++){
    const a=camBas+i*bir+direk*0.5, b=a+bir-direk;
    const egA=i===0 ? (tavanBas-cowlX)*0.46 : direk*0.4;
    const egB=(i===adet-1) ? (k.kink ? -Math.min(cRun*0.16, L*0.012) : cRun*0.34) : direk*0.4;
    camlar+=`<path d="M${_acN(a+egA)},${_acN(camUst)} L${_acN(b-egB)},${_acN(camUst)} `+
            `L${_acN(b)},${_acN(camAlt)} L${_acN(a)},${_acN(camAlt)} Z" fill="rgba(170,202,226,.40)"/>`;
  }
  // Panelvanın yük kasası: camın bittiği yerden arka kapıya kadar sac.
  // Üstünde yalnızca kasa katlama çizgisi ve kapı ayrımı var.
  if(k.kuyruk==="van"){
    const kasaBas=camSon+direk, kasaSon=x1-L*0.028;
    if(kasaSon>kasaBas){
      camlar+=`<path d="M${_acN(kasaBas)},${_acN(camUst+L*0.004)} L${_acN(kasaSon)},${_acN(camUst+L*0.004)} `+
              `L${_acN(kasaSon)},${_acN(camAlt)} L${_acN(kasaBas)},${_acN(camAlt)} Z" `+
              `fill="${_acRenk(renk,.96)}" opacity=".9"/>`;
      if(tam){
        camlar+=`<path d="M${_acN(kasaBas)},${_acN(camUst+L*0.010)} L${_acN(kasaBas)},${_acN(esik-L*0.016)}" `+
                `stroke="rgba(0,0,0,.26)" stroke-width="1"/>`;
        if(!k.sacArka)  // kombi: kasanın üst yarısı camlı
          camlar+=`<path d="M${_acN(kasaBas+direk)},${_acN(camUst+L*0.008)} L${_acN(kasaSon-L*0.006)},${_acN(camUst+L*0.008)} `+
                  `L${_acN(kasaSon-L*0.006)},${_acN(camAlt-L*0.002)} L${_acN(kasaBas+direk)},${_acN(camAlt-L*0.002)} Z" `+
                  `fill="rgba(170,202,226,.34)"/>`;
      }
    }
  }

  // ---------- çamurluk kemerleri ve tekerler ----------
  const kemer=(cx)=>{
    const rr=R*1.14;
    return `<path d="M${_acN(cx-rr)},${_acN(esik)} A${_acN(rr)},${_acN(rr)} 0 0 1 ${_acN(cx+rr)},${_acN(esik)} Z" `+
           `fill="rgba(0,0,0,.42)"/>`;
  };
  /** SUV'un siyah çamurluk kaplaması — gövdenin üstüne biniyor. */
  const kaplamaCiz=()=>{
    if(!k.kaplama) return "";
    const rr=R*1.26, kal=L*0.016;
    const yay=(cx)=>`<path d="M${_acN(cx-rr)},${_acN(esik+kal)} A${_acN(rr)},${_acN(rr)} 0 0 1 ${_acN(cx+rr)},${_acN(esik+kal)}" `+
      `fill="none" stroke="#1B1F23" stroke-width="${_acN(kal)}"/>`;
    const etek=`<path d="M${_acN(x0+L*0.02)},${_acN(esik-L*0.004)} L${_acN(x1-L*0.02)},${_acN(esik-L*0.008)}" `+
      `stroke="#1B1F23" stroke-width="${_acN(L*0.020)}" opacity=".9"/>`;
    return etek+yay(onX)+yay(arkaX);
  };
  const jant=(cx)=>{
    const ic=R*0.56;
    let kol="";
    if(tam){
      const n={bes:5,cift:10,turbin:7,cok:12,celik:5}[k.jant]||5;
      for(let i=0;i<n;i++){
        const a=(i/n)*Math.PI*2, s=k.jant==="turbin"?.40:0;
        kol+=`<path d="M${_acN(cx+Math.cos(a)*ic*.24)},${_acN(yTeker+Math.sin(a)*ic*.24)} `+
             `L${_acN(cx+Math.cos(a+s)*ic*.86)},${_acN(yTeker+Math.sin(a+s)*ic*.86)}" `+
             `stroke="#96A2AC" stroke-width="${k.jant==="celik"?2.3:1.3}" stroke-linecap="round"/>`;
      }
    }
    return `<circle cx="${_acN(cx)}" cy="${_acN(yTeker)}" r="${_acN(R)}" fill="#0D1114"/>`+
      `<circle cx="${_acN(cx)}" cy="${_acN(yTeker)}" r="${_acN(R*.78)}" fill="#191F23"/>`+
      `<circle cx="${_acN(cx)}" cy="${_acN(yTeker)}" r="${_acN(ic)}" fill="#6B7780"/>${kol}`+
      `<circle cx="${_acN(cx)}" cy="${_acN(yTeker)}" r="${_acN(ic*.21)}" fill="#404A52"/>`;
  };

  // ---------- tampon / marşpiye ----------
  const tamponY=esik-L*0.030;
  // Eski araçta ince bir krom bant, yenide koyu bir tampon gölgesi.
  // Önceki hâlinde krom kalın beyaz bloklar hâlinde çıkıyordu.
  const tampon = k.krom
    ? `<path d="M${_acN(x0)},${_acN(tamponY)} L${_acN(x1)},${_acN(tamponY-L*0.004)}" `+
      `stroke="#C9D2D9" stroke-width="${_acN(L*0.011)}" opacity=".85"/>`
    : `<path d="M${_acN(x0)},${_acN(tamponY)} L${_acN(x1)},${_acN(tamponY-L*0.004)}" `+
      `stroke="rgba(0,0,0,.20)" stroke-width="${_acN(L*0.026)}"/>`;

  // ---------- far / stop ----------
  const farCiz=()=>{
    const fy=burunY-L*0.002, fx=x0+L*0.008, w=L*0.072, h=L*0.030;
    const d={
      dilim:`<path d="M${_acN(fx)},${_acN(fy)} L${_acN(fx+w)},${_acN(fy+h*.25)} L${_acN(fx+w)},${_acN(fy+h)} L${_acN(fx)},${_acN(fy+h*1.2)} Z"/>`,
      yuvarlak:`<circle cx="${_acN(fx+w*.42)}" cy="${_acN(fy+h*.6)}" r="${_acN(h*.62)}"/>`,
      bumerang:`<path d="M${_acN(fx)},${_acN(fy)} L${_acN(fx+w)},${_acN(fy+h*.4)} L${_acN(fx+w*.62)},${_acN(fy+h*1.25)} L${_acN(fx)},${_acN(fy+h*.9)} Z"/>`,
      L:`<path d="M${_acN(fx)},${_acN(fy)} L${_acN(fx+w*.9)},${_acN(fy)} L${_acN(fx+w*.9)},${_acN(fy+h*.5)} L${_acN(fx+w*.4)},${_acN(fy+h*.5)} L${_acN(fx+w*.4)},${_acN(fy+h*1.3)} L${_acN(fx)},${_acN(fy+h*1.3)} Z"/>`,
      ince:`<path d="M${_acN(fx)},${_acN(fy+h*.2)} L${_acN(fx+w*1.1)},${_acN(fy+h*.5)} L${_acN(fx+w*1.1)},${_acN(fy+h*.85)} L${_acN(fx)},${_acN(fy+h*.65)} Z"/>`
    }[k.far];
    return `<g fill="${kirik?"#6B7278":"#F7F9EE"}" opacity="${kirik?.5:.95}">${d}</g>`;
  };
  /* Stop lambası. Önceki hâlinde kuyruğun en tepe köşesinde, kırpma
     sınırına yapışmış ince bir çizgiydi; büyük kartta yarısı kesilmiş
     görünüyordu. Artık arka yüzeye oturuyor ve segmentine göre biçimi
     değişiyor: panelvanda dik dikdörtgen, otomobilde yatay blok. */
  const stopCiz=()=>{
    const ic=L*0.016;                       // kuyruk kenarından içeri
    if(k.kuyruk==="van"){
      const w=L*0.026, h=L*0.072;
      const sy=Math.min(bagajY+L*0.030, esik-h-L*0.045);
      return `<rect x="${_acN(x1-ic-w)}" y="${_acN(sy)}" width="${_acN(w)}" height="${_acN(h)}" `+
             `rx="${_acN(L*0.006)}" fill="#C8392E" opacity=".92"/>`;
    }
    const w=L*(k.kuyruk==="bagaj"?.060:.048), h=L*0.034;
    const sy=Math.min(bagajY+L*0.034, esik-h-L*0.040);
    return `<path d="M${_acN(x1-ic)},${_acN(sy)} L${_acN(x1-ic-w)},${_acN(sy+h*.14)} `+
           `L${_acN(x1-ic-w)},${_acN(sy+h)} L${_acN(x1-ic)},${_acN(sy+h*.88)} Z" `+
           `fill="#C8392E" opacity=".92"/>`;
  };
  const izgCiz=()=>{
    if(k.izgara==="kapali") return "";
    const gy=burunY+L*0.036, gx=x0+L*0.003, gw=L*0.042;
    const gh=Math.max(L*0.016, tamponY-gy-L*0.006);
    return {
      trapez:`<path d="M${_acN(gx)},${_acN(gy)} L${_acN(gx+gw)},${_acN(gy+gh*.14)} L${_acN(gx+gw)},${_acN(gy+gh*.88)} L${_acN(gx)},${_acN(gy+gh)} Z" fill="rgba(0,0,0,.45)"/>`,
      petek:`<rect x="${_acN(gx)}" y="${_acN(gy)}" width="${_acN(gw)}" height="${_acN(gh)}" rx="1.2" fill="rgba(0,0,0,.40)"/>`,
      cubuk:`<rect x="${_acN(gx)}" y="${_acN(gy)}" width="${_acN(gw)}" height="${_acN(gh)}" rx="1" fill="rgba(0,0,0,.34)"/>`+
        (tam?[0,1].map(i=>`<path d="M${_acN(gx)},${_acN(gy+gh*(.3+i*.38))} L${_acN(gx+gw)},${_acN(gy+gh*(.33+i*.38))}" stroke="#C2CBD3" stroke-width=".9"/>`).join(""):""),
      yarik:`<path d="M${_acN(gx)},${_acN(gy+gh*.35)} L${_acN(gx+gw)},${_acN(gy+gh*.42)} L${_acN(gx+gw)},${_acN(gy+gh*.70)} L${_acN(gx)},${_acN(gy+gh*.62)} Z" fill="rgba(0,0,0,.45)"/>`
    }[k.izgara]||"";
  };

  // ---------- kapı ayrımları, kol, ayna ----------
  let detay="";
  if(tam){
    for(let i=1;i<adet;i++){
      const dx=camBas+bir*i;
      detay+=`<path d="M${_acN(dx)},${_acN(camUst+2)} L${_acN(dx-L*0.004)},${_acN(esik-L*0.012)}" stroke="rgba(0,0,0,.24)" stroke-width="1"/>`;
    }
    for(let i=0;i<adet;i++){
      const hx=camBas+bir*i+bir*0.62;
      if(hx<camSon-L*0.02)
        detay+=`<rect x="${_acN(hx)}" y="${_acN(camAlt+L*0.020)}" width="${_acN(L*0.032)}" height="${_acN(L*0.010)}" rx="${_acN(L*0.005)}" fill="rgba(255,255,255,.34)"/>`;
    }
    detay+=`<path d="M${_acN(camBas+(tavanBas-cowlX)*0.50)},${_acN(camAlt-L*0.004)} l${_acN(-L*0.024)},${_acN(-L*0.004)} l${_acN(L*0.003)},${_acN(L*0.016)} l${_acN(L*0.024)},${_acN(L*0.003)} Z" fill="${_acRenk(renk,.70)}"/>`;
    // Bagaj kapağının ayrım çizgisi: bu olmadan arka güverte açık bir
    // kasa gibi okunuyor, araç sedandan çok kamyonete benziyordu.
    if(bagajKapak!=null)
      detay+=`<path d="M${_acN(bagajKapak+L*0.012)},${_acN(bagajY+L*0.004)} `+
             `L${_acN(bagajKapak-L*0.004)},${_acN(esik-L*0.030)}" `+
             `stroke="rgba(0,0,0,.26)" stroke-width="1"/>`;
    if(k.cizgi>0)
      detay+=`<path d="M${_acN(x0+L*0.06)},${_acN(camAlt+L*0.030)} L${_acN(x1-L*0.05)},${_acN(camAlt+L*0.020)}" stroke="rgba(255,255,255,.17)" stroke-width="1.1" fill="none"/>`;
    if(k.cizgi>1)
      detay+=`<path d="M${_acN(x0+L*0.08)},${_acN(esik-L*0.040)} L${_acN(x1-L*0.07)},${_acN(esik-L*0.048)}" stroke="rgba(0,0,0,.20)" stroke-width="1.2" fill="none"/>`;
  }

  // ---------- boyalı / değişen panel ----------
  let panel="";
  if(tam && (boyali||degisen)){
    const yer=[[x0+L*0.012, kaputBoy*0.82, true],
               [camBas+bir*0.05, bir*0.92, false],
               [Math.max(camSon-bir*1.0, x1-L*0.20), bir*0.88, false]];
    const say=Math.min(3,(boyali|0)+(degisen|0));
    for(let i=0;i<say;i++){
      const [px,pw,kaputMu]=yer[i], degMi=i<degisen;
      const ust=kaputMu?burunY+L*0.004:camAlt;
      panel+=`<rect x="${_acN(px)}" y="${_acN(ust)}" width="${_acN(pw)}" height="${_acN(esik-ust-L*0.006)}" `+
             `fill="${_acRenk(renk, degMi?0.83:1.11)}" opacity=".58"/>`;
      if(degMi) panel+=`<path d="M${_acN(px)},${_acN(ust)} L${_acN(px)},${_acN(esik-L*0.006)}" stroke="rgba(0,0,0,.40)" stroke-width="1.1"/>`;
    }
  }

  const mat=0.28+asinma*0.56;
  const id="ac"+(_acTohum(renk+"|"+L.toFixed(1)+"|"+k.seg)%1e5).toString(36);
  const parlak=tam?`<path d="M${_acN(x0+L*0.045)},${_acN(camAlt-L*0.012)} L${_acN(x1-L*0.055)},${_acN(camAlt-L*0.022)}" `+
    `stroke="rgba(255,255,255,${_acN(0.32*(1-mat))})" stroke-width="${_acN(L*0.014)}" stroke-linecap="round" fill="none"/>`:"";

  // Gövde dışına taşan hiçbir şey kalmasın: tampon, parlama, gövde
  // çizgileri ve paneller siluetin içine kırpılıyor. Eskiden ön ve arkada
  // ince çıkıntılar oluşuyordu, sebebi buydu.
  return `<svg viewBox="0 0 ${G} ${Y}" class="aracsvg" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
  <defs><clipPath id="${id}k"><path d="${govde}"/></clipPath>
  <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${_acRenk(renk,1.20)}"/>
    <stop offset="${_acN((tavan>0?(camAlt-tavan)/(esik-tavan):.5)*100)}%" stop-color="${renk}"/>
    <stop offset="1" stop-color="${_acRenk(renk,.56)}"/>
  </linearGradient></defs>
  <ellipse cx="${_acN((x0+x1)/2)}" cy="${_acN(zemin+2.4)}" rx="${_acN(L*.44)}" ry="2.6" fill="rgba(0,0,0,.30)"/>
  ${kemer(onX)}${kemer(arkaX)}
  <path d="${govde}" fill="url(#${id})"/>
  <g clip-path="url(#${id}k)">${panel}${parlak}${camlar}${detay}${tam?tampon:""}${tam?kaplamaCiz():""}${k.spoyler&&tam?`<path d="M${_acN(x1-L*0.075)},${_acN(bagajY+L*0.004)} L${_acN(x1-L*0.010)},${_acN(bagajY-L*0.002)}" stroke="${_acRenk(renk,.70)}" stroke-width="${_acN(L*0.014)}" stroke-linecap="round"/>`:""}${izgCiz()}${stopCiz()}${farCiz()}</g>
  ${k.rayli&&tam?`<path d="M${_acN(tavanBas+L*0.05)},${_acN(tavan-L*0.008)} L${_acN(tavanSon-L*0.02)},${_acN(tavan-L*0.008)}" stroke="#A9B3BC" stroke-width="${_acN(L*0.010)}" stroke-linecap="round"/>`:""}
  ${jant(onX)}${jant(arkaX)}
  <path d="${govde}" fill="none" stroke="rgba(0,0,0,.34)" stroke-width="1"/>
</svg>`;
}

/* ---------- oyun köprüsü ---------- */
const _acBellek={};
function aracKimlikCache(ad, seg, donem){
  const a=ad+"|"+seg;
  return _acBellek[a] || (_acBellek[a]=aracKimlik(ad, seg, donem));
}
/** Modelin yıl aralığından dönem (0 = 70'ler, 1 = 2020'ler). */
function aracDonem(m){
  if(!m || !m.y) return 0.8;
  const orta=(m.y[0]+m.y[1])/2;
  return Math.max(0, Math.min(1, (orta-1968)/(2026-1968)));
}
/** Oyundaki araç nesnesinden SVG. Ekspertiz yapılmadıysa gizli kusurlar
    çizime yansımaz — gözle görülen neyse o. */
function aracCiz(c, ayrinti){
  if(!c || !c.model) return "";
  const k=aracKimlikCache(c.model.n, c.model.seg, aracDonem(c.model));
  const gorunur=!!c.inspected;
  const asinma=(typeof COMPKEYS!=="undefined" && c.wear)
    ? Math.min(1, COMPKEYS.reduce((s,x)=>s+(c.wear[x]||0),0)/COMPKEYS.length/70) : .25;
  const kirik=!!(c.faults||[]).some(f=>!f.fixed && /far|lamba/i.test(f.n) && (gorunur||f.visible));
  return aracSvg(k, {
    renk: RENK_KOD[c.color] || "#8E9AA6",
    asinma,
    boyali: gorunur ? (c.boyali||0) : Math.min(c.boyali||0, 1),
    degisen: gorunur ? (c.degisen||0) : 0,
    kirikFar: kirik
  }, ayrinti||"tam");
}
const RENK_KOD={
  "Beyaz":"#E9ECEF","Siyah":"#1A1E22","Gri":"#8A939B","Gümüş":"#B9C0C6",
  "Kırmızı":"#B8332B","Mavi":"#27497E","Lacivert":"#1B2E52","Yeşil":"#2B5E42",
  "Kahverengi":"#6B4A30","Bej":"#C9B48C","Sarı":"#D9A318","Turuncu":"#C96A1E",
  "Bordo":"#6E1F28","Füme":"#3A4046","Şampanya":"#C6B394","Antrasit":"#2E3338"
};

if(typeof module!=="undefined") module.exports={aracKimlik, aracSvg, aracCiz, aracDonem, RENK_KOD};
