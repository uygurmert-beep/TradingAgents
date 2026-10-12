/* ==================================================================
   3B DÜNYA — oto pazarını ve kendi galerini gezerek incelemek
   Kararlar hâlâ 2B sayfalarda veriliyor; burası sadece bakma yeri.
   ================================================================== */
const W3D=(()=>{
  let ren=null, scene=null, cam=null, raf=null, mode="pazar";
  let items=[];            // {obj, car, sprite, ring}
  let yaw=0, pitch=0;
  let px=0, pz=0;          // oyuncunun konumu
  let focus=null, lastT=0, bob=0;
  let bounds={x:16,z:22};
  let ready=false, failed=false;
  let ANISO=4;              // doku anizotropisi (renderer açılınca ayarlanır)
  let dprHedef=2, dprTavan=2, kare=0, kareSure=0, olcumT=0, isinma=0;
  let CANLI=[];          // her karede güncellenen hareketli öğeler (madde 13)
  /* --- kamera dili (madde 14): yumuşatılmış bakış, hız kickı, varış geçişi --- */
  let camYaw=0, camPitch=0, camRoll=0, fov=60, hizYum=0, varis=0;

  /* ---------- dokular ---------- */
  const texCache={};
  // davlumbaz yarıçapı / teker yarıçapı — gövde kemeri, kovuk ve kaplama aynı sayıdan
  const KEMER_ORAN=1.16;
  function tex(key, w, h, ciz, rep){
    if(texCache[key]) return texCache[key];
    const c=document.createElement("canvas"); c.width=w; c.height=h;
    ciz(c.getContext("2d"), w, h);
    const t=new THREE.CanvasTexture(c);
    if(THREE.sRGBEncoding) t.encoding=THREE.sRGBEncoding;
    t.anisotropy=ANISO;
    t.minFilter=THREE.LinearMipmapLinearFilter;
    t.generateMipmaps=true;
    if(rep){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rep[0],rep[1]); }
    texCache[key]=t; return t;
  }
  /** Otopark zemini: açık gri beton, derz çizgileri, hafif leke. */
  function betonTex(parlak){
    return tex("beton"+(parlak?"P":""), 512, 512, (g)=>{
      const taban=parlak?"#525960":"#484E55";
      g.fillStyle=taban; g.fillRect(0,0,512,512);
      // agrega serpintisi
      for(let i=0;i<16000;i++){
        const v=Math.random()<.5?70:190;
        g.fillStyle=`rgba(${v},${v+3},${v+6},${.05+Math.random()*.10})`;
        g.fillRect(Math.random()*512,Math.random()*512,1.6,1.6);
      }
      // hafif bulutlanma
      for(let i=0;i<40;i++){
        const v=Math.random()<.5?30:150;
        g.fillStyle=`rgba(${v},${v},${v},.035)`;
        g.beginPath(); g.ellipse(Math.random()*512,Math.random()*512,
          40+Math.random()*110, 30+Math.random()*80, Math.random()*3,0,7); g.fill();
      }
      // birkaç soluk leke
      for(let i=0;i<6;i++){
        g.fillStyle=`rgba(26,29,33,${.035+Math.random()*.05})`;
        g.beginPath(); g.ellipse(60+Math.random()*390, 60+Math.random()*390,
          14+Math.random()*34, 10+Math.random()*24, Math.random()*3,0,7); g.fill();
      }
      // beton plak derzleri — döşemenin tekrarı kasıtlı görünsün
      g.strokeStyle="rgba(26,30,34,.55)"; g.lineWidth=5;
      g.beginPath(); g.moveTo(0,2); g.lineTo(512,2); g.moveTo(2,0); g.lineTo(2,512); g.stroke();
      g.strokeStyle="rgba(150,158,166,.10)"; g.lineWidth=2;
      g.beginPath(); g.moveTo(0,7); g.lineTo(512,7); g.moveTo(7,0); g.lineTo(7,512); g.stroke();
    }, [8,10]);
  }
  /** Tavan: koyu beton döşeme, kalıp izleri. */
  function tavanTex(){
    return tex("tavan", 512, 512, (g)=>{
      g.fillStyle="#333A41"; g.fillRect(0,0,512,512);
      for(let i=0;i<4800;i++){
        const v=52+Math.random()*26;
        g.fillStyle=`rgba(${v},${v+3},${v+6},.5)`;
        g.fillRect(Math.random()*512,Math.random()*512,2,2);
      }
      g.strokeStyle="rgba(20,23,26,.55)"; g.lineWidth=5;
      for(let i=0;i<=512;i+=128){ g.beginPath(); g.moveTo(i,0); g.lineTo(i,512); g.stroke(); }
    }, [10,12]);
  }
  /** Sarı-siyah tehlike bandı (kolon dipleri). */
  function bantTex(){
    return tex("bant", 128, 32, (g)=>{
      g.fillStyle="#E8B31C"; g.fillRect(0,0,128,32);
      g.fillStyle="#1B1E22";
      for(let i=-32;i<160;i+=32){ g.beginPath(); g.moveTo(i,0); g.lineTo(i+14,0);
        g.lineTo(i-2,32); g.lineTo(i-16,32); g.fill(); }
    }, [4,1]);
  }
  function kolonKodTex(kod){
    return tex("kod"+kod, 128, 128, (g)=>{
      g.fillStyle="rgba(0,0,0,0)"; g.clearRect(0,0,128,128);
      g.fillStyle="#F2A007"; g.font="900 78px system-ui,-apple-system,'Segoe UI',sans-serif";
      g.textAlign="center"; g.fillText(kod, 64, 92);
    });
  }
  function yonTex(txt){
    return tex("yon"+txt, 512, 128, (g)=>{
      g.clearRect(0,0,512,128);
      g.fillStyle="#DDE3D8"; g.font="800 74px system-ui,-apple-system,'Segoe UI',sans-serif";
      g.textAlign="center"; g.fillText(txt, 256, 92);
    });
  }
  /* --- hasar dokuları (paylaşılan) --- */
  function dokuPas(){
    return tex("pas", 128, 128, (g)=>{
      g.clearRect(0,0,128,128);
      for(let i=0;i<220;i++){
        const x=Math.random()*128, y=Math.random()*128;
        const d=Math.hypot(x-64,y-64)/64;
        if(Math.random()<d*d) continue;
        g.fillStyle=`rgba(${120+Math.random()*70},${52+Math.random()*38},${18+Math.random()*20},${.5+Math.random()*.45})`;
        g.beginPath(); g.arc(x,y,2+Math.random()*9,0,7); g.fill();
      }
      for(let i=0;i<40;i++){   // delinmiş sac
        g.fillStyle=`rgba(28,22,18,${.4+Math.random()*.5})`;
        g.beginPath(); g.arc(20+Math.random()*88, 20+Math.random()*88, 1+Math.random()*4,0,7); g.fill();
      }
    });
  }
  function dokuCizik(){
    return tex("cizik", 128, 128, (g)=>{
      g.clearRect(0,0,128,128);
      g.lineCap="round";
      for(let i=0;i<16;i++){
        const y=18+Math.random()*92;
        g.strokeStyle=`rgba(232,236,240,${.30+Math.random()*.45})`;
        g.lineWidth=.8+Math.random()*1.6;
        g.beginPath(); g.moveTo(6+Math.random()*24, y);
        g.lineTo(64+Math.random()*58, y+(Math.random()-.5)*14); g.stroke();
      }
      g.fillStyle="rgba(20,22,26,.08)";
      g.beginPath(); g.ellipse(64,64,44,26,0,0,7); g.fill();
    });
  }
  function dokuGocuk(){
    return tex("gocuk", 128, 128, (g)=>{
      g.clearRect(0,0,128,128);
      const gr=g.createRadialGradient(60,68,3,64,64,58);
      /* Göçük bir gölge çukuru ve üst kenarında ışık yayıdır. Eskiden üstüne
         iki kalın siyah çizgi çiziliyordu; ön çamurlukta farın yanına düşünce
         araç pençe izi yemiş gibi görünüyordu. */
      gr.addColorStop(0,"rgba(6,8,11,.38)");
      gr.addColorStop(.45,"rgba(12,15,19,.22)");
      gr.addColorStop(.82,"rgba(16,19,24,.08)");
      gr.addColorStop(1,"rgba(0,0,0,0)");
      g.fillStyle=gr; g.beginPath(); g.ellipse(64,64,58,44,0,0,7); g.fill();
      g.strokeStyle="rgba(214,222,230,.30)"; g.lineWidth=2;
      g.beginPath(); g.arc(64,76,30,Math.PI*1.18,Math.PI*1.82); g.stroke();
    });
  }
  function dokuMat(){
    return tex("mat", 128, 128, (g)=>{
      g.clearRect(0,0,128,128);
      for(let i=0;i<26;i++){
        g.fillStyle=`rgba(206,208,204,${.06+Math.random()*.16})`;
        g.beginPath(); g.ellipse(Math.random()*128,Math.random()*128,
          10+Math.random()*30, 8+Math.random()*22, Math.random()*3,0,7); g.fill();
      }
    });
  }
  function dokuLeke(){
    return tex("leke", 128, 128, (g)=>{
      g.clearRect(0,0,128,128);
      const gr=g.createRadialGradient(64,64,3,64,64,58);
      gr.addColorStop(0,"rgba(8,7,6,.88)"); gr.addColorStop(.6,"rgba(16,13,10,.55)");
      gr.addColorStop(1,"rgba(0,0,0,0)");
      g.fillStyle=gr; g.beginPath(); g.ellipse(64,64,58,44,0,0,7); g.fill();
      for(let i=0;i<7;i++){
        g.fillStyle="rgba(12,10,8,.6)";
        g.beginPath(); g.arc(20+Math.random()*88, 20+Math.random()*88, 3+Math.random()*7,0,7); g.fill();
      }
    });
  }
  function dokuDoseme(){
    return tex("doseme", 128, 128, (g)=>{
      g.clearRect(0,0,128,128);
      for(let i=0;i<30;i++){
        g.fillStyle=`rgba(160,150,132,${.10+Math.random()*.26})`;
        g.beginPath(); g.ellipse(Math.random()*128,Math.random()*128,
          6+Math.random()*20, 5+Math.random()*14, Math.random()*3,0,7); g.fill();
      }
      g.strokeStyle="rgba(30,26,22,.5)"; g.lineWidth=2;
      for(let i=0;i<5;i++){
        g.beginPath(); g.moveTo(Math.random()*128, Math.random()*128);
        g.lineTo(Math.random()*128, Math.random()*128); g.stroke();
      }
    });
  }

  /** Ön cama konan fiyat kartı — uzaktan okunabilmesi için büyük. */
  function priceCard(car, kind){
    const c=document.createElement("canvas"); c.width=512; c.height=300;
    const g=c.getContext("2d");
    const r=18;
    g.fillStyle="#12171B";
    g.beginPath(); g.moveTo(r,0); g.arcTo(512,0,512,300,r); g.arcTo(512,300,0,300,r);
    g.arcTo(0,300,0,0,r); g.arcTo(0,0,512,0,r); g.fill();
    g.strokeStyle="#F2A007"; g.lineWidth=5; g.stroke();

    g.fillStyle="#8E9AA3"; g.font="600 22px system-ui,-apple-system,sans-serif";
    const durum = kind==="own" ? (car.listPrice?"İLANDA":"HAZIRLIKTA") : "SATILIK";
    g.fillText(cevir(durum), 26, 44);

    g.fillStyle="#F4F2EC"; g.font="800 40px system-ui,-apple-system,'Segoe UI',sans-serif";
    let ad=car.model.n; if(ad.length>18) ad=ad.slice(0,17)+"…";
    g.fillText(ad, 26, 96);
    g.fillStyle="#8E9AA3"; g.font="500 26px ui-monospace,SFMono-Regular,Menlo,monospace";
    g.fillText(`${car.year} · ${typeof mesafe==="function"?mesafe(car.km):car.km+" km"}`, 26, 134);
    g.fillText(cevir(car.gear)+" · "+cevir(car.fuel), 26, 168);

    const fiyat = kind==="own" ? (car.listPrice||valueOf(car,!car.inspected)) : car.ask;
    g.fillStyle="#F2A007"; g.font="600 54px ui-monospace,SFMono-Regular,Menlo,monospace";
    g.fillText("$"+new Intl.NumberFormat(EN()?"en-US":"tr-TR").format(Math.round(fiyat)), 26, 236);

    // plaka
    g.fillStyle="#F4F2EC"; g.fillRect(26,254,190,32);
    g.fillStyle="#2A5FA8"; g.fillRect(26,254,22,32);
    g.fillStyle="#0E1216"; g.font="600 20px ui-monospace,SFMono-Regular,Menlo,monospace";
    g.fillText(car.plate, 54, 277);

    if(kind!=="own"){
      const ref=car.inspected?valueOf(car,false):valueOf(car,true);
      const pct=Math.round((ref-car.ask)/ref*100);
      g.fillStyle = pct>3?"#43C08A" : pct<-3?"#E5544E" : "#657079";
      g.font="600 24px system-ui,-apple-system,sans-serif";
      g.textAlign="right";
      g.fillText(`${pct>=0?"−":"+"}%${Math.abs(pct)}`, 486, 277);
      g.textAlign="left";
    }
    const t=new THREE.CanvasTexture(c);
    t.anisotropy=ANISO;
    t.minFilter=THREE.LinearMipmapLinearFilter;
    if(THREE.sRGBEncoding) t.encoding=THREE.sRGBEncoding;
    return t;
  }
  /** Tabela dokusu. Yürürken mip seviyesi değiştikçe yazının dağılmaması için
      yüksek çözünürlük + anizotropik filtre + önbellek şart. */
  function signTex(txt, sub, renk, zemin){
    const H=renk||"#F2A007", Z=zemin||"#12171B";
    return tex("sign|"+I18N.lang+"|"+txt+"|"+sub+"|"+H+Z, 2048, 512, (g)=>{
      g.fillStyle=Z; g.fillRect(0,0,2048,512);
      g.strokeStyle="#2E3941"; g.lineWidth=16; g.strokeRect(8,8,2032,496);
      g.textAlign="center";
      g.fillStyle=H; g.font="900 196px system-ui,-apple-system,'Segoe UI',sans-serif";
      g.fillText(cevir(txt), 1024, 240);
      g.fillStyle="#A7B3BC"; g.font="600 78px system-ui,-apple-system,sans-serif";
      g.fillText(cevir(sub), 1024, 360);
    });
  }
  /** Pilon (dikey totem) için kare-ye yakın tabela dokusu. */
  function pilonTex(txt, sub, renk, zemin){
    const H=renk||"#F2A007", Z=zemin||"#12171B";
    return tex("pilon|"+I18N.lang+"|"+txt+"|"+sub+"|"+H+Z, 1024, 768, (g)=>{
      g.fillStyle=Z; g.fillRect(0,0,1024,768);
      g.strokeStyle="#2E3941"; g.lineWidth=14; g.strokeRect(7,7,1010,754);
      g.textAlign="center";
      g.fillStyle=H;
      const s=cevir(txt), kelime=s.split(" ");
      if(kelime.length>1 && s.length>9){
        const yari=Math.ceil(kelime.length/2);
        g.font="900 150px system-ui,-apple-system,'Segoe UI',sans-serif";
        g.fillText(kelime.slice(0,yari).join(" "), 512, 310);
        g.fillText(kelime.slice(yari).join(" "), 512, 460);
      } else {
        g.font="900 170px system-ui,-apple-system,'Segoe UI',sans-serif";
        g.fillText(s, 512, 400);
      }
      g.fillStyle="#A7B3BC"; g.font="600 60px system-ui,-apple-system,sans-serif";
      g.fillText(cevir(sub), 512, 600);
    });
  }

  /* ==================================================================
     ARAÇ MODELİ
     Gövde, yandan siluet + en kesiti boyunca "loft" edilerek kuruluyor:
     yuvarlatılmış omuzlar, davlumbaz kesikleri, karakter çizgisi, pürüzsüz
     normaller. Üstünde ayrı kavisli tavan kabuğu, boru direkler ve içi
     görünen camlar var. Boya, ortam yansıması olan Phong malzemesi.
     ================================================================== */
  const COLHEX={"Beyaz":0xE9E7E1,"Siyah":0x101317,"Gri":0x6E757B,"Gümüş":0xA9AFB4,
    "Füme":0x3A4046,"Lacivert":0x1B2743,"Mavi":0x24589C,"Kırmızı":0x9C2823,
    "Bordo":0x581E23,"Yeşil":0x234B36,"Kahverengi":0x51402F};


  /* ==================================================================
     GÜNÜN SAATİ (madde 16)
     Oyun günü ilerledikçe saha farklı bir ışıkta açılıyor: sabah altın,
     öğle berrak, ikindi sıcak, akşam turuncu. Mevsim de tonu kaydırıyor.
     Tüm doku anahtarları bu palete bağlı — ışık değişince doku yenilenir.
     ================================================================== */
  const SAATLER=[
    {k:"sabah", gokUst:"#4E86C4", gokOrta:"#86B9E2", gokAlt:"#EADFC8",
     gunes:0xFFE7BC, guc:1.12, yon:[-15,10,12], ortam:0xD9E6F4, ortamGuc:.30,
     yerRenk:0x6E7A64, sis:0xD5E2EA, sisY:40, sisU:135, pozlama:1.08, vinyet:"rgba(90,60,20,.16)"},
    {k:"ogle",  gokUst:"#2F74BC", gokOrta:"#7CB6E4", gokAlt:"#D8ECF6",
     gunes:0xFFF6E2, guc:1.36, yon:[-8,22,7], ortam:0xDCEAF6, ortamGuc:.30,
     yerRenk:0x707A64, sis:0xBCD9EC, sisY:46, sisU:145, pozlama:1.10, vinyet:"rgba(0,20,45,.14)"},
    {k:"ikindi",gokUst:"#3C86C6", gokOrta:"#93C3E0", gokAlt:"#F6E2BE",
     gunes:0xFFDC9E, guc:1.30, yon:[16,13,10], ortam:0xEDE6D6, ortamGuc:.32,
     yerRenk:0x8A8064, sis:0xE8DFC8, sisY:44, sisU:142, pozlama:1.12, vinyet:"rgba(150,85,20,.16)"},
    {k:"aksam", gokUst:"#2A4E86", gokOrta:"#7E86B6", gokAlt:"#F0B07A",
     gunes:0xFFCE93, guc:1.18, yon:[19,9,6], ortam:0xD8D2DC, ortamGuc:.44,
     yerRenk:0x7D7488, sis:0xE0C8AE, sisY:36, sisU:124, pozlama:1.22, vinyet:"rgba(150,70,15,.18)"}
  ];
  let SAAT=SAATLER[1];
  function saatSec(){
    const g=(typeof S!=="undefined" && S && S.day) ? S.day : 1;
    SAAT=SAATLER[(g-1)%SAATLER.length];
    return SAAT;
  }

  /* --- ortam yansıması: açık havadaki satış sahasının küresel haritası ---
     Equirect düzeni: üst yarı gökyüzü (zenitten ufka), ortada şehir silueti ve
     çit/çim şeridi, alt yarı asfalt. Araç boyası, krom ve camlar bunu
     yansıtıyor; doku yumuşak tutuluyor ki yansıma keskin desen basmasın. */
  function ortamTex(){
    const ak="__env"+SAAT.k;
    if(texCache[ak]) return texCache[ak];
    const W=1024, H=512;
    const c=document.createElement("canvas"); c.width=W; c.height=H;
    const g=c.getContext("2d");

    // gökyüzü: zenit → ufuk
    const gok=g.createLinearGradient(0,0,0,H*0.50);
    gok.addColorStop(0,SAAT.gokUst);
    gok.addColorStop(.48,SAAT.gokOrta);
    gok.addColorStop(1,SAAT.gokAlt);
    g.fillStyle=gok; g.fillRect(0,0,W,H*0.50);

    // güneş: yumuşak sıcak hâle (yönlü ışıkla aynı taraf)
    const gx=W*0.68, gy=H*0.16;
    const gun=g.createRadialGradient(gx,gy,0,gx,gy,H*0.42);
    gun.addColorStop(0,"rgba(255,246,222,.95)");
    gun.addColorStop(.18,"rgba(255,240,206,.45)");
    gun.addColorStop(.55,"rgba(255,238,205,.10)");
    gun.addColorStop(1,"rgba(255,238,205,0)");
    g.fillStyle=gun; g.fillRect(0,0,W,H*0.50);

    // bulut bantları — yumuşak elipsler, keskin kenar yok
    g.globalAlpha=.55;
    for(let i=0;i<22;i++){
      const bx=Math.random()*W, by=H*(0.06+Math.random()*0.30);
      const bw=H*(0.10+Math.random()*0.26), bh=bw*(0.22+Math.random()*0.16);
      const bg=g.createRadialGradient(bx,by,0,bx,by,bw);
      bg.addColorStop(0,"rgba(255,255,255,.95)");
      bg.addColorStop(.6,"rgba(255,255,255,.42)");
      bg.addColorStop(1,"rgba(255,255,255,0)");
      g.fillStyle=bg;
      g.save(); g.translate(bx,by); g.scale(1,bh/bw); g.beginPath();
      g.arc(0,0,bw,0,7); g.fill(); g.restore();
    }
    g.globalAlpha=1;

    // şehir silueti: ufkun hemen üstünde soluk mavi bloklar
    g.fillStyle="rgba(123,156,186,.58)";
    let x=0;
    while(x<W){
      const bw=16+Math.random()*52, bh=H*(0.020+Math.random()*0.065);
      g.fillRect(x, H*0.50-bh, bw, bh);
      x+=bw+(4+Math.random()*16);
    }

    // çit + çim şeridi (ufuk çizgisi)
    g.fillStyle="#2F7A4E"; g.fillRect(0, H*0.50, W, H*0.035);
    g.fillStyle="#6E7A62"; g.fillRect(0, H*0.535, W, H*0.020);
    // bayrak flamalarının renkli izi
    const flama=["#E2544C","#F2A007","#43C08A","#2C6FB5","#EDEFF2"];
    g.globalAlpha=.42;
    for(let i=0;i<34;i++){
      g.fillStyle=flama[i%flama.length];
      g.fillRect(i*(W/34)+3, H*0.470+Math.sin(i*0.9)*4, 10, 12);
    }
    g.globalAlpha=1;

    // asfalt: ufuktan aşağı koyulaşan zemin + şerit izi
    const yer=g.createLinearGradient(0,H*0.555,0,H);
    yer.addColorStop(0,"#8B939B");
    yer.addColorStop(.30,"#6E767E");
    yer.addColorStop(1,"#4A5158");
    g.fillStyle=yer; g.fillRect(0,H*0.555,W,H*0.445);
    g.fillStyle="rgba(240,240,240,.16)";
    g.fillRect(0, H*0.72, W, H*0.012);

    // Dokuyu iyice yumuşat: yansımada desen değil, ton istiyoruz. İki kademeli
    // küçült-büyüt + bulanıklık filtresi, keskin bulut/bina kenarlarını siler.
    try{
      const k1=document.createElement("canvas"); k1.width=W/8; k1.height=H/8;
      k1.getContext("2d").drawImage(c,0,0,W/8,H/8);
      const k2=document.createElement("canvas"); k2.width=W; k2.height=H;
      const g2=k2.getContext("2d");
      try{ g2.filter="blur(6px)"; }catch(e){}
      g2.drawImage(k1,0,0,W,H);
      g.clearRect(0,0,W,H);
      g.drawImage(k2,0,0);
      // güneşi geri koy: tek keskin parlak nokta kalsın
      const gun2=g.createRadialGradient(gx,gy,0,gx,gy,H*0.16);
      gun2.addColorStop(0,"rgba(255,250,232,.95)");
      gun2.addColorStop(.35,"rgba(255,244,214,.35)");
      gun2.addColorStop(1,"rgba(255,244,214,0)");
      g.fillStyle=gun2; g.fillRect(0,0,W,H*0.5);
    }catch(e){}

    const t=new THREE.CanvasTexture(c);
    t.mapping=THREE.EquirectangularReflectionMapping;
    t.anisotropy=ANISO;
    t.minFilter=THREE.LinearMipmapLinearFilter;
    t.generateMipmaps=true;
    if(THREE.sRGBEncoding) t.encoding=THREE.sRGBEncoding;
    texCache[ak]=t; return t;
  }
  /** Boya: açık havada cila yansıması belirgin. Koyu renkler daha çok yansıtır,
      açık/mat renkler daha az — gerçek boyada da böyle okunur. */
  /* Boyanın yansıttığı dünya. Sahne ortamında çim bandı vardı; yansıma
     ancak %11–17'ye kısılarak yeşil lekeden kurtulunuyordu ve gövde kil gibi
     mat kalıyordu. Boya artık kendi nötr ortamını yansıtıyor: açık gökyüzü,
     keskin bir ufuk çizgisi ve iki yumuşak ışık kutusu. Gerçek araç
     fotoğrafındaki "kapı boyunca uzanan ufuk yansıması" bu çizgiden geliyor. */
  const METALIK_RENK=["Gümüş","Gri","Füme","Lacivert","Mavi"];
  /* Cilalı boya (MeshPhysical + clearcoat) bir araçta iki kat ışık hesabı demek.
     2 GB ve altı bellek ya da 2 çekirdekli eski telefonlarda sahne 9 araçla
     takılmasın diye orada Phong + aynı boya ortamı kullanılıyor: yansıma
     yine var, cila katı yok. */
  const HAFIF_CIZIM = typeof navigator!=="undefined" &&
    ((navigator.deviceMemory && navigator.deviceMemory<=2) ||
     (navigator.hardwareConcurrency && navigator.hardwareConcurrency<=2));
  // tembel: bu kapsam sayfa yüklenirken çalışıyor, three.js henüz yoksa THREE tanımsız
  const fiziksel = ()=> typeof THREE!=="undefined" && !!THREE.MeshPhysicalMaterial && !HAFIF_CIZIM;
  function boyaOrtamTex(){
    if(texCache.__boyaEnv) return texCache.__boyaEnv;
    const W=1024, H=512, c=document.createElement("canvas"); c.width=W; c.height=H;
    const g=c.getContext("2d");
    const gok=g.createLinearGradient(0,0,0,H*.5);
    gok.addColorStop(0,"#9FB4C6"); gok.addColorStop(.7,"#DCE5EC"); gok.addColorStop(1,"#F4F7F9");
    g.fillStyle=gok; g.fillRect(0,0,W,H*.5);
    const yer=g.createLinearGradient(0,H*.5,0,H);
    yer.addColorStop(0,"#5E646A"); yer.addColorStop(.12,"#3E4348"); yer.addColorStop(1,"#26292D");
    g.fillStyle=yer; g.fillRect(0,H*.5,W,H*.5);
    // ışık kutuları: tavanda iki uzun yumuşak şerit
    for(const [x,w] of [[.18,.20],[.58,.26]]){
      const lg=g.createLinearGradient(0,H*.08,0,H*.30);
      lg.addColorStop(0,"rgba(255,255,255,0)"); lg.addColorStop(.5,"rgba(255,255,255,.95)"); lg.addColorStop(1,"rgba(255,255,255,0)");
      g.fillStyle=lg; g.fillRect(W*x,H*.08,W*w,H*.22);
    }
    const t=new THREE.CanvasTexture(c);
    t.mapping=THREE.EquirectangularReflectionMapping;
    if(THREE.sRGBEncoding) t.encoding=THREE.sRGBEncoding;
    return (texCache.__boyaEnv=t);
  }
  /** Cilalı boya. parlak: 76 bakımlı, 34 yıpranmış, 14 komple boya isteyen
      (eski Phong parlaklık ölçeği korunuyor ki çağıranlar değişmesin).
      metalik: gümüş/gri/füme gibi metalik renkler. */
  function matBoya(hex, parlak, metalik){
    const p=parlak===undefined?76:parlak;
    if(!fiziksel()){
      return new THREE.MeshPhongMaterial({color:hex, shininess:p, specular:0x5A646E,
        envMap:boyaOrtamTex(), reflectivity:.25, combine:THREE.MixOperation});
    }
    const yeni=clamp((p-14)/62, 0, 1);                       // 0 mat … 1 cilalı
    /* Renk tablosu sRGB yazıldı (#581E23 koyu bordo) ama malzemeye çevrilmeden
       veriliyordu; çizici sonucu bir kez daha sRGB'ye çevirince bütün boyalar
       soluyordu: bordo pembe, kırmızı somon, lacivert gök mavisi. */
    const renk=new THREE.Color(hex); if(renk.convertSRGBToLinear) renk.convertSRGBToLinear();
    return new THREE.MeshPhysicalMaterial({color:renk,
      metalness: metalik ? .55 : .04,
      // Taban pürüzü yüksek olunca bulanık yansıma koyu boyayı griye çekiyordu;
      // parlaklık cila katından (clearcoat) gelsin, taban sakin kalsın.
      roughness: metalik ? .34-.10*yeni : .62-.14*yeni,
      clearcoat: .15+.85*yeni, clearcoatRoughness: .04+.25*(1-yeni),
      envMap:boyaOrtamTex(), envMapIntensity: metalik ? .95 : .70});
  }
  /* Krom için ayrı, nötr bir stüdyo ortamı. Sahne ortamında çim bandı
     var; .92 yansıtıcılıkla krom ızgara ve tamponlar yeşil görünüyordu. */
  function kromOrtamTex(){
    if(texCache.__kromEnv) return texCache.__kromEnv;
    const W=512, H=256, c=document.createElement("canvas"); c.width=W; c.height=H;
    const g=c.getContext("2d");
    const gr=g.createLinearGradient(0,0,0,H);
    gr.addColorStop(0,"#F4F6F8"); gr.addColorStop(.40,"#C9CFD5"); gr.addColorStop(.49,"#7E868E");
    gr.addColorStop(.51,"#2A2F35"); gr.addColorStop(.70,"#5A6168"); gr.addColorStop(1,"#3A4046");
    g.fillStyle=gr; g.fillRect(0,0,W,H);
    // yumuşak kutu ışıkları: kromda parlak şeritler
    g.fillStyle="rgba(255,255,255,.85)";
    for(const x of [.12,.47,.80]) g.fillRect(W*x, H*.10, W*.07, H*.20);
    const t=new THREE.CanvasTexture(c);
    t.mapping=THREE.EquirectangularReflectionMapping;
    if(THREE.sRGBEncoding) t.encoding=THREE.sRGBEncoding;
    return (texCache.__kromEnv=t);
  }
  function matKrom(){
    return new THREE.MeshPhongMaterial({color:0xD3D8DD, shininess:180, specular:0xFFFFFF,
      envMap:kromOrtamTex(), reflectivity:.80, combine:THREE.MixOperation});
  }
  /* Cam eskiden açık mavi-beyaz ve %64 opaktı: süt camı gibi duruyor, içerisi
     gri lekeler hâlinde görünüyordu. Gerçek araç camı koyu (füme) ve
     yansımalı; içerisi ancak yakından seçilir. */
  /* Cam gövde derisinin parçası olunca ortamı çok güçlü yansıtıyor, süt gibi
     açık görünüyordu; içerisi soluk seçiliyordu. Koyu füme, daha az yansıma,
     biraz daha geçirgen: içi koyu bir camın arkasından net seçiliyor. */
  function matCam(koyu){
    if(fiziksel())
      return new THREE.MeshPhysicalMaterial({color:koyu?0x0E1418:0x080D11, transparent:true,
        opacity:koyu?.80:.76, side:THREE.DoubleSide, depthWrite:false,
        metalness:0, roughness:.04, envMap:boyaOrtamTex(), envMapIntensity:.36,
        specularIntensity:.6});
    return new THREE.MeshPhongMaterial({color:0x1E2A31, transparent:true,
      opacity:.82, side:THREE.DoubleSide, depthWrite:false, shininess:230,
      specular:0xDCEAF4, envMap:boyaOrtamTex(), reflectivity:.55, combine:THREE.MixOperation});
  }
  const matKara=(h,sh)=>new THREE.MeshPhongMaterial({color:h===undefined?0x191D22:h,
    shininess:sh===undefined?18:sh, specular:0x14181C});

  /* --- petek ızgara dokusu --- */
  function petekTex(){
    return tex("petek",128,128,(g)=>{
      g.fillStyle="#15191E"; g.fillRect(0,0,128,128);
      g.strokeStyle="#5A646E"; g.lineWidth=2.0;
      for(let y=0;y<128;y+=11) for(let x=0;x<128;x+=13){
        const ox=(Math.round(y/11)%2)?6.5:0;
        g.beginPath();
        for(let k=0;k<6;k++){
          const a=Math.PI/3*k+Math.PI/6;
          const px=x+ox+Math.cos(a)*5.4, py=y+Math.sin(a)*5.4;
          k?g.lineTo(px,py):g.moveTo(px,py);
        }
        g.closePath(); g.stroke();
      }
    },[4,3]);
  }
  function farTex(){
    return tex("far",128,64,(g)=>{
      g.fillStyle="#0E1216"; g.fillRect(0,0,128,64);
      const gr=g.createLinearGradient(0,0,128,64);
      gr.addColorStop(0,"#E9F3FA"); gr.addColorStop(.45,"#AFC6D6");
      gr.addColorStop(.7,"#6C8496"); gr.addColorStop(1,"#DDE9F2");
      g.fillStyle=gr; g.fillRect(2,2,124,60);
      g.fillStyle="rgba(255,255,255,.85)";
      for(let i=0;i<3;i++){ g.beginPath(); g.arc(24+i*38,32,11,0,7); g.fill(); }
      g.fillStyle="rgba(140,170,195,.55)";
      for(let i=0;i<3;i++){ g.beginPath(); g.arc(24+i*38,32,6,0,7); g.fill(); }
    });
  }
  /* ==================================================================
     FAR VE IZGARA DOKULARI
     Eskiden far, koyu bir kutunun içinde açık mavi bir gradyan ve üç beyaz
     daireydi; ızgara her araçta aynı petek doku üstüne geçirilmiş krom
     çubuklardı — ön yüz kafes gibi duruyordu. Artık ikisi de modelin 2B
     kimliğindeki aileye göre çiziliyor (far: dilim / bumerang / L / ince;
     ızgara: trapez / petek / çubuk / kapalı / yarık + marka ızgaraları),
     kenarı dokunun saydamlığıyla kesiliyor: far dikdörtgen değil kendi
     biçiminde. Tek tuval, model başına bir kez; çizim maliyeti yok. */
  function _yuvarlakYol(g,x,y,w,h,r){
    g.beginPath(); g.moveTo(x+r,y); g.lineTo(x+w-r,y); g.quadraticCurveTo(x+w,y,x+w,y+r);
    g.lineTo(x+w,y+h-r); g.quadraticCurveTo(x+w,y+h,x+w-r,y+h); g.lineTo(x+r,y+h);
    g.quadraticCurveTo(x,y+h,x,y+h-r); g.lineTo(x,y+r); g.quadraticCurveTo(x,y,x+r,y); g.closePath();
  }
  function _farSekil(g,tip,W,H){
    // dış sınır: iç kenar (merkeze bakan) solda, dış kenar sağda
    g.beginPath();
    if(tip==="bumerang"){ g.moveTo(W*.02,H*.30); g.lineTo(W*.70,H*.04); g.quadraticCurveTo(W*.99,H*.02,W*.98,H*.40);
      g.lineTo(W*.94,H*.92); g.lineTo(W*.30,H*.96); g.quadraticCurveTo(W*.04,H*.90,W*.02,H*.30); }
    else if(tip==="ince"){ g.moveTo(W*.02,H*.30); g.lineTo(W*.86,H*.06); g.quadraticCurveTo(W*.99,H*.06,W*.98,H*.40);
      g.lineTo(W*.96,H*.86); g.lineTo(W*.10,H*.94); g.quadraticCurveTo(W*.01,H*.90,W*.02,H*.30); }
    else if(tip==="L"){ _yuvarlakYol(g,W*.02,H*.06,W*.96,H*.88,H*.18); return; }
    else { _yuvarlakYol(g,W*.02,H*.08,W*.96,H*.84,H*.10); return; }   // dilim
    g.closePath();
  }
  function _projektor(g,x,y,r){
    const yan=g.createRadialGradient(x-r*.3,y-r*.3,r*.1,x,y,r);
    yan.addColorStop(0,"#F2F7FB"); yan.addColorStop(.35,"#9DB0BF"); yan.addColorStop(.75,"#2B3239"); yan.addColorStop(1,"#C7D0D8");
    g.fillStyle=yan; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
    g.strokeStyle="rgba(230,236,242,.9)"; g.lineWidth=r*.16; g.beginPath(); g.arc(x,y,r*.92,0,7); g.stroke();
    g.fillStyle="rgba(255,255,255,.95)"; g.beginPath(); g.ellipse(x-r*.35,y-r*.38,r*.22,r*.12,-.6,0,7); g.fill();
  }
  function _reflektor(g,x,y,r){
    const yan=g.createRadialGradient(x,y,r*.05,x,y,r);
    yan.addColorStop(0,"#FFFFFF"); yan.addColorStop(.18,"#E6EDF2"); yan.addColorStop(.55,"#9EAAB4"); yan.addColorStop(1,"#D8E0E6");
    g.fillStyle=yan; g.beginPath(); g.arc(x,y,r,0,7); g.fill();
    g.strokeStyle="rgba(120,132,142,.6)"; g.lineWidth=1.2;
    for(let k=1;k<4;k++){ g.beginPath(); g.arc(x,y,r*k/4,0,7); g.stroke(); }
  }
  function farTex(tip, ayna){
    tip=tip||"dilim";
    return tex("far2"+tip+(ayna?"A":""),256,128,(g,W,H)=>{
      g.clearRect(0,0,W,H);
      if(ayna){ g.translate(W,0); g.scale(-1,1); }
      g.save(); _farSekil(g,tip,W,H); g.clip();
      // gövde içi: koyu krom çanak
      /* İç gövde eskiden siyaha yakındı: far kör bir delik gibi duruyordu.
         Gerçek farın içi gümüş reflektör ve grafit plastik — ışığı geri verir. */
      const ic=g.createLinearGradient(0,0,0,H);
      ic.addColorStop(0,"#8A949D"); ic.addColorStop(.35,"#4A535C"); ic.addColorStop(.7,"#262C32"); ic.addColorStop(1,"#5C656E");
      g.fillStyle=ic; g.fillRect(0,0,W,H);
      if(tip==="dilim"){
        _reflektor(g,W*.30,H*.52,H*.30); _reflektor(g,W*.62,H*.52,H*.26);
        g.fillStyle="#E8A13A"; g.fillRect(W*.82,H*.22,W*.13,H*.58);
        g.fillStyle="rgba(255,236,190,.55)"; g.fillRect(W*.84,H*.26,W*.03,H*.50);
      }else if(tip==="bumerang"){
        _projektor(g,W*.30,H*.58,H*.24); _reflektor(g,W*.62,H*.58,H*.20);
        // bumerang gündüz farı: üst kenar boyunca, dış köşede aşağı kıvrılıyor
        g.strokeStyle="#F4FAFF"; g.lineCap="round"; g.lineWidth=H*.07;
        g.shadowColor="rgba(200,230,255,.9)"; g.shadowBlur=10;
        g.beginPath(); g.moveTo(W*.10,H*.30); g.lineTo(W*.72,H*.14); g.quadraticCurveTo(W*.92,H*.12,W*.90,H*.42); g.stroke();
        g.shadowBlur=0; g.fillStyle="#E8A13A"; g.fillRect(W*.80,H*.62,W*.12,H*.16);
      }else if(tip==="L"){
        _projektor(g,W*.40,H*.50,H*.25); _projektor(g,W*.66,H*.50,H*.20);
        g.strokeStyle="#F4FAFF"; g.lineCap="round"; g.lineWidth=H*.075;
        g.shadowColor="rgba(200,230,255,.9)"; g.shadowBlur=10;
        g.beginPath(); g.moveTo(W*.12,H*.20); g.lineTo(W*.12,H*.80); g.lineTo(W*.86,H*.80); g.stroke();
        g.shadowBlur=0; g.fillStyle="#E8A13A"; g.fillRect(W*.84,H*.16,W*.10,H*.14);
      }else{ // ince
        for(const x of [.36,.53,.70]){ g.fillStyle="#1E252B"; _yuvarlakYol(g,W*x-H*.17,H*.32,H*.34,H*.42,6); g.fill();
          _projektor(g,W*x,H*.53,H*.15); }
        g.strokeStyle="#F6FBFF"; g.lineCap="round"; g.lineWidth=H*.08;
        g.shadowColor="rgba(205,232,255,.95)"; g.shadowBlur=12;
        g.beginPath(); g.moveTo(W*.06,H*.30); g.lineTo(W*.90,H*.12); g.stroke();
        g.shadowBlur=0; g.fillStyle="#E8A13A"; g.fillRect(W*.86,H*.52,W*.09,H*.22);
      }
      // dış cam: üstten yumuşak parlama
      const cam=g.createLinearGradient(0,0,0,H*.5);
      cam.addColorStop(0,"rgba(255,255,255,.30)"); cam.addColorStop(1,"rgba(255,255,255,0)");
      g.fillStyle=cam; g.fillRect(0,0,W,H*.5);
      g.restore();
      // ince koyu çerçeve
      g.strokeStyle="rgba(10,12,15,.85)"; g.lineWidth=4; _farSekil(g,tip,W,H); g.stroke();
    });
  }
  /** Izgara yüzü. tip: trapez|petek|cubuk|kapali|yarik|bobrek|yildiz|bar */
  function izgaraTex(tip, krom){
    return tex("izg"+tip+(krom?"K":""),256,128,(g,W,H)=>{
      g.clearRect(0,0,W,H);
      const kromRenk=(y0,y1)=>{ const k=g.createLinearGradient(0,y0,0,y1);
        k.addColorStop(0,"#F6F8FA"); k.addColorStop(.45,"#9BA4AC"); k.addColorStop(.55,"#59616A"); k.addColorStop(1,"#DDE2E6"); return k; };
      const cerceve=krom?kromRenk(0,H):"#20262C";
      const delik=()=>{ const d=g.createLinearGradient(0,0,0,H); d.addColorStop(0,"#05070A"); d.addColorStop(1,"#14191E"); return d; };
      const petek=(x,y,w,h,r)=>{
        g.save(); g.beginPath(); g.rect(x,y,w,h); g.clip(); g.fillStyle=delik(); g.fillRect(x,y,w,h);
        g.strokeStyle="#3E464E"; g.lineWidth=2;
        for(let yy=y;yy<y+h+r;yy+=r*1.5) for(let xx=x;xx<x+w+r;xx+=r*1.74){
          const ox=(Math.round((yy-y)/(r*1.5))%2)?r*.87:0; g.beginPath();
          for(let k=0;k<6;k++){ const a=Math.PI/3*k+Math.PI/6; const px=xx+ox+Math.cos(a)*r, py=yy+Math.sin(a)*r; k?g.lineTo(px,py):g.moveTo(px,py); }
          g.closePath(); g.stroke(); }
        // petek hücrelerinin üst kenarında ışık
        g.strokeStyle="rgba(170,180,190,.25)"; g.lineWidth=1;
        for(let yy=y;yy<y+h;yy+=r*1.5){ g.beginPath(); g.moveTo(x,yy+1); g.lineTo(x+w,yy+1); g.stroke(); }
        g.restore();
      };
      const yatayCubuk=(x,y,w,h,n)=>{
        g.fillStyle=delik(); g.fillRect(x,y,w,h);
        for(let i=0;i<n;i++){ const yy=y+h*(i+.5)/n-h*.08/2*1; g.fillStyle=krom?kromRenk(yy,yy+h*.10):"#3A4249"; g.fillRect(x,yy,w,h*.10); }
      };
      if(tip==="bobrek"){
        for(const cx of [W*.27,W*.73]){
          g.save(); _yuvarlakYol(g,cx-W*.21,H*.06,W*.42,H*.88,H*.30); g.clip();
          g.fillStyle=delik(); g.fillRect(0,0,W,H);
          for(let i=0;i<9;i++){ const x=cx-W*.19+i*W*.047; g.fillStyle=krom?kromRenk(0,H):"#3A4249"; g.fillRect(x,0,W*.012,H); }
          g.restore();
          g.strokeStyle=cerceve; g.lineWidth=7; _yuvarlakYol(g,cx-W*.21,H*.06,W*.42,H*.88,H*.30); g.stroke();
        }
        return;
      }
      let yol;
      if(tip==="trapez"||tip==="yildiz") yol=()=>{ g.beginPath(); g.moveTo(W*.12,H*.06); g.lineTo(W*.88,H*.06);
        g.quadraticCurveTo(W*.97,H*.06,W*.95,H*.30); g.lineTo(W*.86,H*.90); g.quadraticCurveTo(W*.84,H*.96,W*.76,H*.96);
        g.lineTo(W*.24,H*.96); g.quadraticCurveTo(W*.16,H*.96,W*.14,H*.90); g.lineTo(W*.05,H*.30); g.quadraticCurveTo(W*.03,H*.06,W*.12,H*.06); g.closePath(); };
      else if(tip==="yarik") yol=()=>_yuvarlakYol(g,W*.04,H*.36,W*.92,H*.28,H*.12);
      else yol=()=>_yuvarlakYol(g,W*.03,H*.08,W*.94,H*.84,H*.14);
      g.save(); yol(); g.clip();
      if(tip==="petek"||tip==="trapez") petek(0,0,W,H,9);
      else if(tip==="cubuk") yatayCubuk(0,0,W,H,4);
      else if(tip==="yildiz"){ g.fillStyle=delik(); g.fillRect(0,0,W,H);
        for(let i=0;i<2;i++){ const yy=H*(.36+i*.30); g.fillStyle=kromRenk(yy,yy+H*.09); g.fillRect(0,yy,W,H*.09); } }
      else if(tip==="kapali"){ const k=g.createLinearGradient(0,0,0,H); k.addColorStop(0,"#2C3238"); k.addColorStop(.5,"#13171B"); k.addColorStop(1,"#262C31");
        g.fillStyle=k; g.fillRect(0,0,W,H); g.fillStyle="rgba(255,255,255,.10)"; g.fillRect(0,H*.12,W,H*.06); }
      else if(tip==="yarik") yatayCubuk(0,0,W,H,1);
      else { // bar — klasik: ince dikey + yatay krom kafes
        g.fillStyle=delik(); g.fillRect(0,0,W,H);
        for(let i=0;i<14;i++){ g.fillStyle=krom?kromRenk(0,H):"#3A4249"; g.fillRect(W*(i+.5)/14,0,W*.008,H); }
        for(let i=0;i<3;i++){ const yy=H*(i+.5)/3; g.fillStyle=krom?kromRenk(yy,yy+H*.07):"#3A4249"; g.fillRect(0,yy,W,H*.07); }
      }
      g.restore();
      g.strokeStyle=cerceve; g.lineWidth=7; yol(); g.stroke();
    });
  }
  /* Stop lambası eskiden düz kırmızı bir kutuydu. Gerçek lamba katmanlı:
     koyu yakut gövde, içinde parlayan bir C/şerit, beyaz geri vites ve
     turuncu sinyal bölmesi, üstte camın parlaması. */
  function stopTex(){
    return tex("stop2",256,128,(g,W,H)=>{
      g.fillStyle="#1A0A0A"; g.fillRect(0,0,W,H);
      const gov=g.createLinearGradient(0,0,0,H);
      gov.addColorStop(0,"#7A1712"); gov.addColorStop(.5,"#4A0D0B"); gov.addColorStop(1,"#6A1410");
      g.fillStyle=gov; g.fillRect(4,4,W-8,H-8);
      // ışık şeridi: parlayan C
      g.strokeStyle="#FF4A3A"; g.lineWidth=H*.10; g.lineCap="round";
      g.shadowColor="rgba(255,70,50,.95)"; g.shadowBlur=14;
      g.beginPath(); g.moveTo(W*.88,H*.22); g.lineTo(W*.22,H*.22); g.quadraticCurveTo(W*.10,H*.22,W*.10,H*.50);
      g.quadraticCurveTo(W*.10,H*.78,W*.22,H*.78); g.lineTo(W*.60,H*.78); g.stroke();
      g.shadowBlur=0;
      // geri vites (beyaz) ve sinyal (turuncu) bölmeleri
      g.fillStyle="#D8DDE2"; g.fillRect(W*.66,H*.62,W*.16,H*.20);
      g.fillStyle="#C9781E"; g.fillRect(W*.66,H*.36,W*.16,H*.18);
      // camın parlaması
      const p=g.createLinearGradient(0,0,0,H*.45);
      p.addColorStop(0,"rgba(255,220,210,.35)"); p.addColorStop(1,"rgba(255,220,210,0)");
      g.fillStyle=p; g.fillRect(4,4,W-8,H*.45);
    });
  }
  const PLAKA_EYALET=["CALIFORNIA","TEXAS","FLORIDA","ARIZONA","NEVADA","OREGON","GEORGIA","OHIO"];
  function plakaTex(txt){
    return tex("plaka"+txt,256,128,(g)=>{
      // zemin: hafif degrade beyaz
      const gr=g.createLinearGradient(0,0,0,128);
      gr.addColorStop(0,"#FBFCFD"); gr.addColorStop(.55,"#F1F4F7"); gr.addColorStop(1,"#E4E9EE");
      g.fillStyle=gr; g.fillRect(0,0,256,128);
      // eyalet adı (üstte, mavi)
      let h=0; const t=txt||"7ABC123";
      for(let i=0;i<t.length;i++) h=(h*31+t.charCodeAt(i))>>>0;
      g.fillStyle="#1B4C8C"; g.textAlign="center";
      g.font="700 19px ui-sans-serif,system-ui,Helvetica,Arial";
      g.fillText(PLAKA_EYALET[h%PLAKA_EYALET.length], 128, 24);
      // numara
      g.fillStyle="#17325C";
      g.font="700 56px ui-monospace,SFMono-Regular,Menlo,monospace";
      g.fillText(t, 128, 86);
      // alt yazı + tescil pulu
      g.fillStyle="#6A7684"; g.font="600 13px ui-sans-serif,system-ui,Helvetica,Arial";
      g.fillText("THE USED CAR STATE", 128, 110);
      g.fillStyle="#D9B526"; g.fillRect(210,96,30,22);
      g.fillStyle="#2A3340"; g.font="700 13px ui-sans-serif,system-ui,Helvetica,Arial";
      g.fillText(String(26+(h%3)), 225, 112);
      // kenar
      g.strokeStyle="#9AA3AD"; g.lineWidth=4; g.strokeRect(2,2,252,124);
      g.strokeStyle="#C8D0D8"; g.lineWidth=2; g.strokeRect(9,9,238,110);
    });
  }

  /* ================= MARKA AMBLEMLERİ =================
     Uydurma markaların rozetleri; esinlendikleri markaların biçim ailesini
     (yuvarlak/eşkenar dörtgen/kalkan/halka) taşır, adları kendilerinin. */
  /* ==================================================================
     MARKA AMBLEMLERİ
     Hepsi özgün: gerçek bir markanın işaretini taklit eden hiçbir biçim yok.
     Aile benzerliği sadece "otomotiv rozeti" dilinden geliyor — yuvarlak,
     kalkan, altıgen, oval — ve her rozet kendi harfini/kelimesini taşıyor.
     ================================================================== */
  const AMBLEM=(function(){
    const K={gumus:"#CBD2D8", acik:"#E7EBEF", koyu:"#141A20", cam:"#9AA4AD"};
    const halka=(g,r,w2,renk)=>{ g.strokeStyle=renk||K.gumus; g.lineWidth=w2;
      g.beginPath(); g.arc(64,64,r,0,7); g.stroke(); };
    const disk=(g,r,renk)=>{ g.fillStyle=renk; g.beginPath(); g.arc(64,64,r,0,7); g.fill(); };
    const kalkan=(g,dolgu,cizgi)=>{
      g.fillStyle=dolgu; g.beginPath();
      g.moveTo(20,16); g.lineTo(108,16); g.lineTo(108,72);
      g.quadraticCurveTo(108,104,64,120); g.quadraticCurveTo(20,104,20,72);
      g.closePath(); g.fill();
      g.strokeStyle=cizgi||K.gumus; g.lineWidth=5; g.stroke();
    };
    const harf=(g,t,px,y,renk)=>{ g.fillStyle=renk||K.acik;
      g.font="800 "+px+"px system-ui,-apple-system,'Segoe UI',sans-serif";
      g.textAlign="center"; g.fillText(t,64,y); };
    const kelime=(g,t,px,y,renk)=>{ g.fillStyle=renk||K.acik;
      g.font="700 "+px+"px system-ui,-apple-system,'Segoe UI',sans-serif";
      g.textAlign="center"; g.letterSpacing && (g.letterSpacing="1px");
      g.fillText(t,64,y); };

    return {
    // ---- yuvarlak ailesi ----
    "Hessler":(g)=>{                     // koyu disk, çapraz ufuk + H
      disk(g,60,"#101820");
      g.save(); g.beginPath(); g.arc(64,64,54,0,7); g.clip();
      g.fillStyle="#1E5FA8"; g.beginPath();
      g.moveTo(-10,100); g.lineTo(140,20); g.lineTo(140,140); g.lineTo(-10,140);
      g.closePath(); g.fill(); g.restore();
      halka(g,55,6);
      harf(g,"H",44,80);
    },
    "Steinmann":(g)=>{                   // halka içinde yukarı çift şerit
      disk(g,58,"#171D24"); halka(g,53,7);
      g.strokeStyle=K.acik; g.lineWidth=9; g.lineJoin="miter";
      g.beginPath(); g.moveTo(40,84); g.lineTo(64,40); g.lineTo(88,84); g.stroke();
      g.strokeStyle="#8E9AA3"; g.lineWidth=5;
      g.beginPath(); g.moveTo(46,96); g.lineTo(82,96); g.stroke();
    },
    "Norimo":(g)=>{                      // disk + çapraz bant + N
      disk(g,58,"#1A2026"); halka(g,53,6);
      g.save(); g.beginPath(); g.arc(64,64,53,0,7); g.clip();
      g.fillStyle="#2E3A45"; g.save(); g.translate(64,64); g.rotate(-0.62);
      g.fillRect(-70,-15,140,30);
      g.fillStyle="#9AA4AD"; g.fillRect(-70,-15,140,3); g.fillRect(-70,12,140,3);
      g.restore(); g.restore();
      harf(g,"N",42,79);
    },
    "Sakuda":(g)=>{                      // disk içinde iki yaprak (S akışı)
      disk(g,58,"#101519"); halka(g,53,6);
      g.strokeStyle=K.acik; g.lineWidth=12; g.lineCap="round";
      g.beginPath(); g.arc(64,46,19, Math.PI*0.62, Math.PI*1.92); g.stroke();
      g.beginPath(); g.arc(64,82,19, Math.PI*1.62, Math.PI*2.92); g.stroke();
      g.lineCap="butt";
    },
    "Orvell":(g)=>{                      // disk + üç yükselen çubuk
      disk(g,58,"#16202A"); halka(g,53,6);
      g.fillStyle="#E2B23A";
      g.fillRect(40,74,13,24); g.fillRect(58,60,13,38); g.fillRect(76,46,13,52);
    },
    "Vernon":(g)=>{                      // koyu disk + V
      disk(g,56,"#1D2A3C"); halka(g,50,6);
      harf(g,"V",54,84);
    },
    // ---- oval ailesi ----
    "Tanaro":(g)=>{                      // oval + dikey kiriş (T)
      g.fillStyle="#16303E"; g.beginPath(); g.ellipse(64,64,58,38,0,0,7); g.fill();
      g.strokeStyle=K.gumus; g.lineWidth=5; g.beginPath(); g.ellipse(64,64,52,32,0,0,7); g.stroke();
      g.fillStyle=K.acik; g.fillRect(28,52,72,10); g.fillRect(58,52,12,40);
    },
    "Hanjo":(g)=>{                       // oval + dik HJ bağı
      g.fillStyle="#0F1A24"; g.beginPath(); g.ellipse(64,64,58,38,0,0,7); g.fill();
      g.strokeStyle=K.gumus; g.lineWidth=5; g.beginPath(); g.ellipse(64,64,52,32,0,0,7); g.stroke();
      g.strokeStyle=K.acik; g.lineWidth=9; g.lineJoin="round";
      g.beginPath(); g.moveTo(44,46); g.lineTo(44,82); g.moveTo(44,64); g.lineTo(68,64);
      g.moveTo(68,46); g.lineTo(68,74); g.quadraticCurveTo(68,84,56,82); g.stroke();
    },
    "Harlow":(g)=>{                      // yatay dikdörtgen rozet + kelime
      g.fillStyle="#17427E"; g.beginPath();
      g.moveTo(14,40); g.lineTo(114,40); g.quadraticCurveTo(122,40,122,50)
      g.lineTo(122,78); g.quadraticCurveTo(122,88,114,88); g.lineTo(14,88);
      g.quadraticCurveTo(6,88,6,78); g.lineTo(6,50);
      g.quadraticCurveTo(6,40,14,40); g.fill();
      g.strokeStyle="#DDE4EA"; g.lineWidth=4; g.stroke();
      kelime(g,"HARLOW",21,71);
    },
    "Dovra":(g)=>{                       // koyu rozet + kehribar kama
      g.fillStyle="#141A21"; g.beginPath();
      g.moveTo(24,12); g.lineTo(104,12); g.quadraticCurveTo(118,12,118,26);
      g.lineTo(118,102); g.quadraticCurveTo(118,116,104,116); g.lineTo(24,116);
      g.quadraticCurveTo(10,116,10,102); g.lineTo(10,26);
      g.quadraticCurveTo(10,12,24,12); g.fill();
      g.strokeStyle="#D6DCE1"; g.lineWidth=4; g.stroke();
      g.fillStyle="#E09A1E"; g.beginPath();
      g.moveTo(64,28); g.lineTo(94,74); g.lineTo(64,62); g.lineTo(34,74); g.closePath(); g.fill();
      kelime(g,"DOVRA",17,102);
    },
    // ---- çokgen ailesi ----
    "Aureon":(g)=>{                      // iç içe iki altıgen + AU
      const altigen=(r,lw)=>{ g.beginPath();
        for(let i=0;i<6;i++){ const a=-Math.PI/2+i*Math.PI/3;
          const x=64+Math.cos(a)*r, y=64+Math.sin(a)*r;
          i?g.lineTo(x,y):g.moveTo(x,y); }
        g.closePath(); g.lineWidth=lw; g.strokeStyle=K.gumus; g.stroke(); };
      g.fillStyle="#131A21"; altigen(58,0); g.fill();
      altigen(58,7); altigen(40,5);
      harf(g,"AU",28,73);
    },
    "Rivelle":(g)=>{                     // altıgen + dikey kiriş
      g.save(); g.translate(64,64); g.rotate(Math.PI/6); g.translate(-64,-64);
      g.beginPath();
      for(let i=0;i<6;i++){ const a=-Math.PI/2+i*Math.PI/3;
        const x=64+Math.cos(a)*56, y=64+Math.sin(a)*56;
        i?g.lineTo(x,y):g.moveTo(x,y); }
      g.closePath(); g.fillStyle="#1B2730"; g.fill();
      g.strokeStyle=K.gumus; g.lineWidth=8; g.stroke(); g.restore();
      g.fillStyle=K.acik; g.fillRect(50,32,12,64);
      g.beginPath(); g.moveTo(62,32); g.lineTo(88,32); g.lineTo(88,62);
      g.lineTo(62,62); g.lineTo(62,52); g.lineTo(78,52); g.lineTo(78,42);
      g.lineTo(62,42); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(66,62); g.lineTo(80,62); g.lineTo(92,96);
      g.lineTo(78,96); g.closePath(); g.fill();
    },
    "Oberon":(g)=>{                      // yuvarlak kare + açık halka
      g.fillStyle="#173C74"; g.beginPath();
      g.moveTo(26,10); g.lineTo(102,10); g.quadraticCurveTo(118,10,118,26);
      g.lineTo(118,102); g.quadraticCurveTo(118,118,102,118); g.lineTo(26,118);
      g.quadraticCurveTo(10,118,10,102); g.lineTo(10,26);
      g.quadraticCurveTo(10,10,26,10); g.fill();
      g.strokeStyle="#E4E9EE"; g.lineWidth=5; g.stroke();
      // kalın "O" harfi, sağ üstte bir çentik — yasak levhasıyla karışmasın
      g.strokeStyle="#E4E9EE"; g.lineWidth=13;
      g.beginPath(); g.ellipse(64,62,31,34,0,0,7); g.stroke();
      g.save(); g.translate(86,40); g.rotate(-0.72);
      g.fillStyle="#173C74"; g.fillRect(-11,-7,22,14); g.restore();
      kelime(g,"OBERON",13,110);
    },
    // ---- kalkan ailesi ----
    "Perrin":(g)=>{                      // kalkan + soyut kanat
      kalkan(g,"#14181D");
      g.strokeStyle="#CBD2D8"; g.lineWidth=11; g.lineJoin="miter";
      g.beginPath(); g.moveTo(34,70); g.lineTo(64,40); g.lineTo(94,70); g.stroke();
      g.strokeStyle="#7E8A94"; g.lineWidth=9;
      g.beginPath(); g.moveTo(40,96); g.lineTo(64,72); g.lineTo(88,96); g.stroke();
    },
    "Kestrel":(g)=>{                     // yeşil kalkan + KS
      kalkan(g,"#1B2A22","#B9C2C8");
      harf(g,"KS",38,82);
    },
    "Brickley":(g)=>{                    // kırmızı kalkan + B
      kalkan(g,"#8E1B18","#D6DCE1");
      harf(g,"B",54,86,"#F0F2F4");
    }
    };
  })();
  /* ---- elle çizilmemiş markalar için tohumlu amblem ----
     45 markanın 16'sı elle çizili. Kalanı burada üretiliyor: marka adından
     türeyen sabit bir tohum, yedi gövde ailesinden birini, bir renk ve bir
     harf düzeni seçiyor. Aynı marka her zaman aynı amblemi alır. */
  const AMB_RENK=["#1E5FA8","#8E1B18","#1F6B4A","#2B2F36","#7A4C12",
                  "#4A2A6B","#0E5C6B","#8A6A12","#3B4A5A","#6B1B4A"];
  function _tohumAd(ad){
    let h=2166136261>>>0;
    for(let i=0;i<ad.length;i++){ h^=ad.charCodeAt(i); h=Math.imul(h,16777619)>>>0; }
    return h>>>0;
  }
  function amblemUret(marka){
    const K={gumus:"#CBD2D8", acik:"#E7EBEF", koyu:"#141A20"};
    const t=_tohumAd(marka);
    const aile=t%7, renk=AMB_RENK[(t>>>3)%AMB_RENK.length];
    const harf=marka[0].toLocaleUpperCase("tr");
    const ikiHarf=(t>>>7)%3===0 && marka.length>3;
    const yazi=ikiHarf ? marka.slice(0,2).toLocaleUpperCase("tr") : harf;
    return (g)=>{
      g.clearRect(0,0,128,128);
      const disk=(r,c)=>{ g.fillStyle=c; g.beginPath(); g.arc(64,64,r,0,7); g.fill(); };
      const halka=(r,w,c)=>{ g.strokeStyle=c||K.gumus; g.lineWidth=w;
        g.beginPath(); g.arc(64,64,r,0,7); g.stroke(); };
      const metin=(px,y,c)=>{ g.fillStyle=c||K.acik; g.textAlign="center";
        g.font="800 "+px+"px system-ui,-apple-system,'Segoe UI',sans-serif";
        g.fillText(yazi,64,y); };
      if(aile===0){                                   // disk + halka
        disk(58,K.koyu); disk(50,renk); halka(54,6);
        metin(ikiHarf?40:52, ikiHarf?78:82);
      } else if(aile===1){                            // kalkan
        g.fillStyle=renk; g.beginPath();
        g.moveTo(22,18); g.lineTo(106,18); g.lineTo(106,70);
        g.quadraticCurveTo(106,102,64,118); g.quadraticCurveTo(22,102,22,70);
        g.closePath(); g.fill();
        g.strokeStyle=K.gumus; g.lineWidth=5; g.stroke();
        metin(ikiHarf?38:50, ikiHarf?76:80);
      } else if(aile===2){                            // yatay oval
        g.fillStyle=K.koyu; g.beginPath();
        g.ellipse(64,64,58,38,0,0,7); g.fill();
        g.strokeStyle=renk; g.lineWidth=7; g.stroke();
        metin(ikiHarf?34:44, ikiHarf?76:78);
      } else if(aile===3){                            // altıgen
        g.fillStyle=renk; g.beginPath();
        for(let i=0;i<6;i++){ const a=Math.PI/6+i*Math.PI/3;
          const x=64+Math.cos(a)*56, y=64+Math.sin(a)*56;
          i?g.lineTo(x,y):g.moveTo(x,y); }
        g.closePath(); g.fill();
        g.strokeStyle=K.acik; g.lineWidth=4; g.stroke();
        metin(ikiHarf?36:48, ikiHarf?76:80);
      } else if(aile===4){                            // kanat
        disk(58,K.koyu);
        g.save(); g.beginPath(); g.arc(64,64,54,0,7); g.clip();
        g.fillStyle=renk;
        for(const yon of [-1,1]){
          g.beginPath();
          g.moveTo(64,52); g.lineTo(64+yon*62,34); g.lineTo(64+yon*62,58);
          g.lineTo(64,70); g.closePath(); g.fill();
        }
        g.restore(); halka(54,5);
        metin(34,104);
      } else if(aile===5){                            // yuvarlak kare + çapraz bant
        g.fillStyle=K.koyu;
        g.beginPath(); g.roundRect ? g.roundRect(10,10,108,108,22)
          : g.rect(10,10,108,108); g.fill();
        g.save(); g.beginPath();
        g.roundRect ? g.roundRect(10,10,108,108,22) : g.rect(10,10,108,108);
        g.clip();
        g.fillStyle=renk; g.save(); g.translate(64,64); g.rotate(-0.6);
        g.fillRect(-76,-17,152,34); g.restore(); g.restore();
        g.strokeStyle=K.gumus; g.lineWidth=4;
        g.beginPath(); g.roundRect ? g.roundRect(12,12,104,104,20) : g.rect(12,12,104,104);
        g.stroke();
        metin(ikiHarf?38:50, ikiHarf?78:82);
      } else {                                        // baklava
        g.fillStyle=renk; g.beginPath();
        g.moveTo(64,8); g.lineTo(118,64); g.lineTo(64,120); g.lineTo(10,64);
        g.closePath(); g.fill();
        g.strokeStyle=K.acik; g.lineWidth=4; g.stroke();
        metin(ikiHarf?34:46, ikiHarf?76:80);
      }
    };
  }
  function markaAdi(ad){
    const k=ad.split(" ")[0];
    if(!AMBLEM[k]) AMBLEM[k]=amblemUret(k);
    return k;
  }
  function amblemTex(ad){
    const k=markaAdi(ad);
    if(!k) return null;
    return tex("amb"+k,128,128,(g)=>{ g.clearRect(0,0,128,128); AMBLEM[k](g); });
  }

  /* Her model için yandan profil. Değerler metre; z ekseni uzunluk (ön = eksi). */
  /* ==================================================================
     MODEL PROFİLİ — 2B ile TEK KAYNAK
     Burada eskiden model adıyla anahtarlanmış iki elle yazılmış tablo
     vardı (SIL: gövde ölçüleri, IMZA: ızgara/krom/far). Model tablosu B
     seviyesi isimlere geçince ("Hanjo H20" → "Hanseul i10 1.0 Benzin")
     tablolar kimseye eşleşmez oldu; 150 modelin hepsi segmentinin tek
     varsayılan gövdesine düştü — her hatchback aynı, SUV station gibi,
     hiçbir markanın ızgarası yok — ve hiçbir test bunu görmedi.

     Artık 3B profil, 2B çizimin kullandığı aracKimlik()'ten türetiliyor:
     aynı tohum, aynı dönem, aynı oranlar. Model adı değişse de iki görünüm
     birlikte değişiyor; test/ux-test.js her modelin kendi profilini
     aldığını ölçüyor. Ölçü bantları metre cinsinden, segmentin gerçek
     araç aralığından (B hatch 3,85–4,35 m, D sedan 4,40–4,80 m …). */
  const PROFIL_BANT={
    hatch: {L:[3.85,4.35],W:[1.70,1.80],hood:[.84,.92],roof:[1.44,1.52],rakeF:[.56,.68],rearZ:[.18,.24],tail:[.78,.86],wr:[.300,.330],kaput:[.28,.31],deckK:.76,cls:"hatch"},
    sedan: {L:[4.40,4.80],W:[1.76,1.84],hood:[.86,.92],roof:[1.44,1.50],rakeF:[.58,.66],rearZ:[.26,.30],tail:[.84,.90],wr:[.315,.335],kaput:[.30,.32],cls:"sedan"},
    lux:   {L:[4.75,5.15],W:[1.84,1.90],hood:[.86,.94],roof:[1.44,1.50],rakeF:[.62,.70],rearZ:[.25,.29],tail:[.84,.90],wr:[.335,.355],kaput:[.32,.34],cls:"sedan"},
    suv:   {L:[4.15,4.85],W:[1.78,1.94],hood:[.98,1.08],roof:[1.60,1.72],rakeF:[.54,.62],rearZ:[.11,.15],tail:[.96,1.04],wr:[.350,.385],kaput:[.29,.32],deckK:.86,cls:"suv"},
    ticari:{L:[4.35,4.95],W:[1.80,1.94],hood:[1.02,1.12],roof:[1.80,2.04],rakeF:[.50,.58],rearZ:[.03,.06],tail:[1.20,1.50],wr:[.320,.355],cls:"van"},
    klasik:{L:[3.95,4.45],W:[1.60,1.70],hood:[.84,.92],roof:[1.40,1.48],rakeF:[.40,.50],rearZ:[.27,.31],tail:[.86,.92],wr:[.290,.315],kaput:[.31,.33],cls:"sedan",dik:1}
  };
  /* Marka karakteri — yalnızca ızgara ailesi ve krom eğilimi. İsimler B
     seviyesinde ("ailesi belli, kopyası değil"); ızgara da öyle. */
  const MARKA_IMZA={
    Hessler:{grille:"yildiz", chrome:.6, led:"cift"},  Steinmann:{grille:"yildiz", chrome:.75, led:"cift"},
    Bavera:{grille:"bobrek", chrome:.5, led:"cift"},   Aureon:{grille:"genis", chrome:.55, led:"seritli"},
    Calvetti:{grille:"genis", chrome:.6},             Vernon:{grille:"bar", chrome:.8},
    Brickley:{grille:"bar", chrome:1},                Halloway:{grille:"bar", chrome:.9}
  };
  const _profilBellek={};
  const _bant=(r,[a,b],t)=>a+(b-a)*(t==null?r():Math.max(0,Math.min(1,t)));
  const _oran=(v,[a,b])=>(v-a)/Math.max(1e-6,b-a);
  function profil3B(m){
    if(!m) return Object.assign({}, SILVAR.sedan);
    if(_profilBellek[m.n]) return _profilBellek[m.n];
    const seg=m.seg, b=PROFIL_BANT[seg]||PROFIL_BANT.sedan;
    const sk=(typeof AC_ISKELET!=="undefined"&&AC_ISKELET[seg])||null;
    const k=(typeof aracKimlik==="function") ? aracKimlik(m.n, seg, aracDonem(m)) : null;
    const r=tohum(_tohumAd(m.n+"|3b"));
    // 2B kimliğin oranlarını kendi bantlarındaki konumuna çevir: uzun 2B
    // gövde uzun 3B gövde, büyük 2B teker büyük 3B teker olsun.
    const t=(alan)=> (k&&sk&&sk[alan]) ? _oran(k[alan==="esik"?"esikH":alan], sk[alan]) : null;
    const L=_bant(r,b.L,t("boy"));
    const yuk=(k&&sk) ? (_oran(k.govde,sk.govde)+_oran(k.kabin,sk.kabin))/2 : null;
    const p={cls:b.cls, L:+L.toFixed(3),
      W:+_bant(r,b.W,(L-b.L[0])/(b.L[1]-b.L[0])*.7+r()*.3).toFixed(3),
      hood:+_bant(r,b.hood,t("govde")).toFixed(3),
      roof:+_bant(r,b.roof,yuk).toFixed(3),
      rakeF:+_bant(r,b.rakeF,k?_oran(k.aRake,[.30,.70]):null).toFixed(3),
      rearZ:+_bant(r,b.rearZ,(k&&sk)?_oran(k.cRake,sk.cRake):null).toFixed(3),
      tail:+_bant(r,b.tail).toFixed(3),
      wr:+_bant(r,b.wr,t("teker")).toFixed(3)};
    if(b.kaput) p.kaput=+_bant(r,b.kaput,(k&&sk)?_oran(k.onTas,sk.onTas):null).toFixed(3);
    // arka güverte yüksekliği kuyruk tipinden: bagajlıda kaputa yakın,
    // hatch/SUV'da tavanın biraz altı, panelvanda tavanla bir.
    p.deck = b.cls==="sedan" ? +(p.hood+.10+r()*.06).toFixed(3)
           : b.cls==="van"   ? +(p.roof-.06).toFixed(3)
           : +(p.roof*(b.deckK||.85)).toFixed(3);
    if(b.dik || (k && k.donem<.30)) p.dik=1;
    if(seg==="lux" && r()<.4) p.formal=1;
    return (_profilBellek[m.n]=p);
  }
  /** Marka + 2B kimlikten imza: ızgara, krom, far, kaplama, tavan rayı. */
  function imza3B(m){
    if(!m) return {};
    const marka=String(m.n).split(" ")[0];
    const k=(typeof aracKimlik==="function") ? aracKimlik(m.n, m.seg, aracDonem(m)) : {};
    const izg={trapez:"genis", petek:"genis", cubuk:"cubuk", kapali:"cubuk", yarik:"bar"}[k.izgara]||"genis";
    const im=Object.assign({grille:izg, chrome:k.krom?1:(m.seg==="lux"?.55:.3)}, MARKA_IMZA[marka]||{});
    if(k.far==="yuvarlak") im.yuvarlakFar=1;
    im.far = k.far==="yuvarlak" ? "dilim" : (k.far||"dilim");
    // marka ızgarası (böbrek/yıldız/bar) 2B ailesini geçersiz kılar
    im.izgaraTip = {bobrek:"bobrek", yildiz:"yildiz", bar:"bar"}[im.grille] || k.izgara || "trapez";
    if(k.donem<.35 && !MARKA_IMZA[marka]) im.izgaraTip="bar";
    if(k.krom || m.seg==="klasik") im.tampon=1;
    if(k.donem>.72 && !im.led) im.led = (k.far==="ince"||k.far==="L") ? "seritli" : "cift";
    if(k.rayli) im.ray=1;
    if(k.kaplama) im.kaplama=1;
    if(m.seg==="lux") im.ic=0x3A332C;
    if(m.seg==="klasik") im.ic=0x4E4335;
    return im;
  }
  const SILVAR={hatch:{L:4.2,W:1.78,cls:"hatch",hood:.88,roof:1.48,rakeF:.64,rearZ:.13,deck:1.26,tail:.82,wr:.315},
                sedan:{L:4.6,W:1.82,cls:"sedan",hood:.88,roof:1.45,rakeF:.64,rearZ:.30,deck:1.00,tail:.86,wr:.325},
                suv:  {L:4.4,W:1.84,cls:"suv",  hood:1.02,roof:1.64,rakeF:.58,rearZ:.13,deck:1.44,tail:1.00,wr:.365},
                van:  {L:5.0,W:1.94,cls:"van",  hood:1.12,roof:2.06,rakeF:.54,rearZ:.05,deck:2.00,tail:1.50,wr:.355},
                lux:  {L:4.8,W:1.85,cls:"sedan",hood:.88,roof:1.43,rakeF:.66,rearZ:.29,deck:1.00,tail:.86,wr:.335},
                ticari:{L:5.0,W:1.94,cls:"van", hood:1.12,roof:2.06,rakeF:.54,rearZ:.05,deck:2.00,tail:1.50,wr:.355},
                klasik:{L:4.2,W:1.66,cls:"sedan",hood:.90,roof:1.45,rakeF:.44,rearZ:.30,deck:1.02,tail:.92,wr:.315,dik:1}};


  const geoCache={};
  function kutu(w,h,d){
    const k=`b${w.toFixed(3)},${h.toFixed(3)},${d.toFixed(3)}`;
    if(!geoCache[k]){ geoCache[k]=new THREE.BoxGeometry(w,h,d); geoCache[k].userData.paylasimli=true; }
    return geoCache[k];
  }
  /** Köşeleri r yarıçapında yuvarlanmış kutu; daral>0 ise üst kenar o oranda
      dar (koltuk sırtı omuzda incelir). Koltuklar düz kutuyken iç mekân
      karton maket gibi duruyordu. */
  function yastik(w,h,d,r,daral){
    const k=`y${w.toFixed(3)},${h.toFixed(3)},${d.toFixed(3)},${r.toFixed(3)},${(daral||0).toFixed(2)}`;
    if(geoCache[k]) return geoCache[k];
    const g=new THREE.BoxGeometry(w,h,d,5,5,5), p=g.attributes.position, v=new THREE.Vector3();
    const ic=[Math.max(0,w/2-r), Math.max(0,h/2-r), Math.max(0,d/2-r)];
    for(let i=0;i<p.count;i++){
      v.fromBufferAttribute(p,i);
      const c=[Math.max(-ic[0],Math.min(ic[0],v.x)), Math.max(-ic[1],Math.min(ic[1],v.y)), Math.max(-ic[2],Math.min(ic[2],v.z))];
      const dx=v.x-c[0], dy=v.y-c[1], dz=v.z-c[2], l=Math.hypot(dx,dy,dz)||1;
      let x=c[0]+dx/l*r, y=c[1]+dy/l*r, z=c[2]+dz/l*r;
      if(daral) x*=1-daral*Math.max(0,(y/h+.5));
      p.setXYZ(i,x,y,z);
    }
    g.computeVertexNormals();
    g.userData.paylasimli=true;
    return (geoCache[k]=g);
  }
  function silindir(r1,r2,h,seg){
    const k=`c${r1.toFixed(3)},${r2.toFixed(3)},${h.toFixed(3)},${seg}`;
    if(!geoCache[k]){ geoCache[k]=new THREE.CylinderGeometry(r1,r2,h,seg); geoCache[k].userData.paylasimli=true; }
    return geoCache[k];
  }
  function tohum(n){ let t=(n*2654435761)>>>0; return ()=>{ t=(t*1664525+1013904223)>>>0; return t/4294967296; }; }

  /* --- geometri birleştirme (BufferGeometryUtils yok) --- */
  function birlestir(parcalar){
    const poz=[], nor=[], uvs=[];
    const v=new THREE.Vector3(), w=new THREE.Vector3();
    for(const {geo,mat} of parcalar){
      let g=geo.index?geo.toNonIndexed():geo;
      if(!g.attributes.normal){ g=g.clone(); g.computeVertexNormals(); }
      const m=mat||new THREE.Matrix4();
      const nm=new THREE.Matrix3().getNormalMatrix(m);
      const p=g.attributes.position, n=g.attributes.normal, t=g.attributes.uv;
      for(let i=0;i<p.count;i++){
        v.fromBufferAttribute(p,i).applyMatrix4(m); poz.push(v.x,v.y,v.z);
        w.fromBufferAttribute(n,i).applyMatrix3(nm).normalize(); nor.push(w.x,w.y,w.z);
        if(t) uvs.push(t.getX(i), t.getY(i)); else uvs.push(0,0);
      }
    }
    const out=new THREE.BufferGeometry();
    out.setAttribute("position", new THREE.Float32BufferAttribute(poz,3));
    out.setAttribute("normal", new THREE.Float32BufferAttribute(nor,3));
    out.setAttribute("uv", new THREE.Float32BufferAttribute(uvs,2));
    return out;
  }

  /* --- loft: kapalı en kesitlerin z boyunca süpürülmesi --- */
  /** grupFn(i,j) verilirse her dörtgen bir malzeme grubuna düşer (0 = varsayılan);
      gövde derisinde cam, tavan ve direk aynı yüzeyin bölgeleri. */
  function loft(kesitler, kapakli, grupFn){
    const NS=kesitler.length, NC=kesitler[0].length;
    const poz=[], gruplar=[[]];
    for(let i=0;i<NS;i++) for(let j=0;j<NC;j++){
      const p=kesitler[i][j]; poz.push(p[0],p[1],p[2]);
    }
    for(let i=0;i<NS-1;i++) for(let j=0;j<NC;j++){
      const j2=(j+1)%NC;
      const a=i*NC+j, b=i*NC+j2, c=(i+1)*NC+j2, d=(i+1)*NC+j;
      const gi=grupFn?grupFn(i,j):0;
      (gruplar[gi]||(gruplar[gi]=[])).push(a,b,d, b,c,d);
    }
    const idx=[];
    const g=new THREE.BufferGeometry();
    if(kapakli){
      // kapaklar ayrı köşelerle — kırılma korunur
      const ek=[];
      const kap=(sec, on)=>{
        let cx=0,cy=0,cz=0;
        for(const p of sec){ cx+=p[0]; cy+=p[1]; cz+=p[2]; }
        cx/=sec.length; cy/=sec.length; cz/=sec.length;
        for(let j=0;j<sec.length;j++){
          const a=sec[j], b=sec[(j+1)%sec.length];
          if(on) ek.push([cx,cy,cz],[b[0],b[1],b[2]],[a[0],a[1],a[2]]);
          else   ek.push([cx,cy,cz],[a[0],a[1],a[2]],[b[0],b[1],b[2]]);
        }
      };
      kap(kesitler[0], true); kap(kesitler[NS-1], false);
      const taban=poz.length/3;
      for(const p of ek) poz.push(p[0],p[1],p[2]);
      for(let i=0;i<ek.length;i++) gruplar[0].push(taban+i);
    }
    for(let k=0;k<gruplar.length;k++){
      const gr=gruplar[k]||[];
      if(grupFn && gr.length) g.addGroup(idx.length, gr.length, k);
      for(const v of gr) idx.push(v);
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(poz,3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  /** Açık ızgara yüzey (cam panelleri). fn(u,v) -> [x,y,z] */
  /* uv eskiden yoktu: bu yüzeylere giydirilen her doku (far, çizik, pas,
     göçük) tek bir köşe pikselinden örnekleniyordu — far düz siyah bir
     levha, hasar dokuları ya görünmez ya düz renk lekesiydi. */
  function yuzey(NU,NV,fn){
    const poz=[], idx=[], uv=[];
    for(let i=0;i<=NU;i++) for(let j=0;j<=NV;j++){
      const p=fn(i/NU, j/NV); poz.push(p[0],p[1],p[2]); uv.push(i/NU, j/NV);
    }
    const W=NV+1;
    for(let i=0;i<NU;i++) for(let j=0;j<NV;j++){
      const a=i*W+j, b=i*W+j+1, c=(i+1)*W+j+1, d=(i+1)*W+j;
      idx.push(a,b,d, b,c,d);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(poz,3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv,2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  function silProfil(s){
    const L=s.L, yarim=L/2;
    const dik=!!s.dik;
    /* Ön cam dibinin buruna uzaklığı (ön taşma + kaput). Eskiden sabit
       .36 (uzun kaputta .44) idi; gerçek araçlarda .29–.34. O değerle kabin
       kısalıyor, her sedan uzun burunlu bir kupeye dönüyordu. */
    const kaputZ = -yarim + L*(s.kaput || (s.uzunKaput?.36:(s.cls==="van"?.20:.31)));
    const camUst = kaputZ + s.rakeF;
    const tavanArka = yarim - L*s.rearZ;
    const bagajZ = s.cls==="sedan" ? yarim - L*.06 : yarim - L*.02;
    const sill=s.cls==="suv"?.40:(s.cls==="van"?.42:.33);
    // Burun ucu: modern araçlarda kaputtan sadece birkaç santim aşağıdadır.
    // Eskiden 15 cm düşüyordu ve kaput uzun bir kama gibi görünüyordu.
    const burun=s.hood-(s.dik?.04:(s.cls==="van"?.13:.085));
    // Kuşak (cam altı) kaputtan belirgin şekilde yüksektir; eşit alınırsa
    // cam bandı gövdenin yarısı kadar olur ve araç 80'ler minibüsüne benzer.
    const kusak = s.dik?.08 : (s.cls==="van"?.10 : (s.cls==="suv"?.12 : .13));
    const beltF=s.hood+kusak;
    let beltR, camAlt;
    if(s.cls==="sedan"){ beltR=Math.max(beltF-.01, s.deck+.02); camAlt=tavanArka + L*(dik?.055:.10); }
    else if(s.cls==="van"){ beltR=beltF+.10; camAlt=Math.min(bagajZ-.25, kaputZ+L*.30); }
    else { beltR=Math.max(beltF-.02, s.deck-(s.cls==="suv"?.40:.36)); camAlt=bagajZ-L*.055; }
    const kuyruk = s.cls==="sedan" ? s.tail : Math.min(s.tail, beltR);
    const onZ=-yarim + L*(s.cls==="van"?.19:.21);
    const arkaZ= yarim - L*(s.cls==="van"?.17:.19);
    return {sill, kaputZ, camUst, tavanArka, bagajZ, beltF, beltR, camAlt, burun, kuyruk, onZ, arkaZ};
  }

  /* Gövde loft'u: üst hat, alt hat (davlumbazlı), genişlik profili */
  function govdeGeo(anahtar, s, pr){
    if(geoCache[anahtar]) return geoCache[anahtar];
    const L=s.L, yarim=L/2, R=s.wr;
    /* Davlumbaz yayı. 1,085R'de lastikle kemer arasında yalnız ~1,5 cm kalıyordu;
       karanlık kovuk görünmüyor, teker gövdeye yapıştırılmış duruyordu. Gerçek
       araçta lastik üstü boşluk 4–6 cm: 1,16R. */
    const ra=R*KEMER_ORAN, kemerY=R;

    const ustHat=(z)=>{
      if(z<=-yarim+L*.008) return pr.burun;
      if(z<=-yarim+L*.052){
        const t=(z+yarim-L*.008)/(L*.044);
        return pr.burun + (s.hood-pr.burun)*(1-(1-t)*(1-t));   // hızlı, küt çıkış
      }
      /* Kaput eskiden burundan cama kadar düz bir masaydı (ortada 1,6 cm'lik
         tümsek): yandan bakınca kutu kapağı gibi duruyordu. Gerçek kaput
         burundan cam dibine 4–8 cm yükselir, önde dik, arkada yatık bir kavisle.
         Ön uç s.hood'da kalıyor: far, ızgara ve derzler o yüksekliğe göre. */
      const kaputArka=pr.kaputZ-L*.15, cowlBit=pr.kaputZ+L*.03;
      const egim=s.dik?.03:(s.cls==="van"?.04:(s.cls==="suv"?.05:.07));
      const kaputUc=s.hood+egim;
      if(z<=kaputArka){
        const t=(z+yarim-L*.052)/Math.max(.05,kaputArka+yarim-L*.052);
        return s.hood + egim*Math.sin(t*Math.PI/2);
      }
      if(z<=cowlBit){
        const t=(z-kaputArka)/(cowlBit-kaputArka);
        return kaputUc + (Math.max(kaputUc,pr.beltF)-kaputUc)*t*t*(3-2*t);
      }
      if(z<=pr.camAlt)
        return pr.beltF + (pr.beltR-pr.beltF)*((z-cowlBit)/Math.max(.05,pr.camAlt-cowlBit));
      if(s.cls==="van"){
        const ramp=L*.10;
        if(z<=pr.camAlt+ramp) return pr.beltR + (s.roof-.06-pr.beltR)*((z-pr.camAlt)/ramp);
        if(z<=pr.bagajZ)      return s.roof-.06;
        return (s.roof-.06) - ((s.roof-.06)-pr.kuyruk)*((z-pr.bagajZ)/Math.max(.05,yarim-pr.bagajZ));
      }
      if(s.cls==="sedan"){
        if(z<=pr.bagajZ)   return pr.beltR + .010;
        return pr.beltR - (pr.beltR-pr.kuyruk)*((z-pr.bagajZ)/(yarim-pr.bagajZ));
      }
      if(z<=yarim-L*.02)   return pr.beltR;
      return pr.beltR - (pr.beltR-pr.kuyruk)*((z-(yarim-L*.02))/(L*.02));
    };
    /* Kesitin tabanı (kemersiz). Eskiden davlumbaz, kesitin TAMAMINI
       yukarı sıkıştırarak açılıyordu: kemer üstündeki yan yüzey içe ve aşağı
       katlanıyor, ışık almayan bu katlar çamurlukta siyah pençe izi gibi
       görünüyordu. Artık kesit hep eşikten kuruluyor, kemer yalnızca onun
       altına düşen noktaları kemer hattına düzleştiriyor (kemerY). */
    const altHat0=(z)=>{
      let y=pr.sill;
      // ön/arka tampon altı hafif yükselir (yaklaşma açısı)
      const uc=Math.max(0, (Math.abs(z)-(yarim-L*.075))/(L*.075));
      y+=uc*uc*.085;
      return Math.min(y, ustHat(z)-.10);
    };
    const kemerHat=(z)=>{
      let y=-1;
      for(const zc of [pr.onZ, pr.arkaZ]){
        const d=Math.abs(z-zc);
        if(d<ra) y=Math.max(y, kemerY + Math.sqrt(ra*ra-d*d));
      }
      return y;
    };
    const altHat=(z)=>Math.min(Math.max(altHat0(z), kemerHat(z)), ustHat(z)-.10);
    const genislik=(z)=>{
      const hw=s.W/2;
      let f=1;
      const kn=s.dik?.40:1;
      const on=(-yarim+L*.17), arka=(yarim-L*.15);
      if(z<on)  f=1-.055*kn*Math.pow((on-z)/(on+yarim),2.4);
      if(z>arka)f=1-.055*kn*Math.pow((z-arka)/(yarim-arka),2.4);
      for(const zc of [pr.onZ, pr.arkaZ]){    // çamurluk kabarması
        const d=Math.abs(z-zc);
        if(d<ra*1.30) f+=.020*Math.cos(Math.PI*.5*d/(ra*1.30));
      }
      return hw*f;
    };

    // istasyonlar: temel + davlumbaz çevresinde sık
    const zs=new Set([-yarim, -yarim+.02]);
    for(let z=-yarim; z<=yarim; z+=L/28) zs.add(+z.toFixed(4));
    for(const zc of [pr.onZ, pr.arkaZ])
      // 16 adım: 8'de kemer kenarı testere dişi gibi basamaklı görünüyordu
      for(let k=-16;k<=16;k++) zs.add(+Math.max(-yarim,Math.min(yarim, zc+ra*k/16)).toFixed(4));
    for(const z of [pr.kaputZ, pr.camAlt, pr.bagajZ, yarim-.02, yarim]) zs.add(+z.toFixed(4));
    // cam evi sınırları: malzeme bölgeleri istasyonlara denk gelsin
    const van=s.cls==="van", HWg=s.W/2;
    const bz=pr.camUst+(pr.tavanArka-pr.camUst)*(van?.34:.42);
    const onCam0=pr.kaputZ+.03;
    const arkaCam1=van?yarim:pr.camAlt;
    /* yan camın arka ucu: sedanda C direği yelkeni arka cam başlayınca,
       hatch/SUV'da arka camın eğimine biraz girer (D direği dar kalsın) */
    const cBit = van ? pr.camAlt-.05
               : s.cls==="sedan" ? pr.tavanArka+.02
               : pr.tavanArka+(pr.camAlt-pr.tavanArka)*(s.cls==="suv"?.30:.22);
    for(const z of [onCam0, onCam0+.05, pr.camUst-.03, pr.camUst, pr.camUst+.03, pr.tavanArka-.03, pr.tavanArka,
                    pr.tavanArka+.03, bz-.05, bz+.05, cBit, arkaCam1-.03])
      if(z>-yarim && z<yarim) zs.add(+z.toFixed(4));
    for(let z=onCam0; z<arkaCam1; z+=L/44) zs.add(+z.toFixed(4));
    const sirali=[...zs].sort((a,b)=>a-b);
    const list=[];
    for(const z of sirali) if(!list.length || z-list[list.length-1]>.008 || z===yarim) list.push(z);

    /* Kesit eskiden 30 noktalı bir süperelipsti (üst n=9, alt n=3,6): alt yarı
       ortadan eşiğe kadar fıçı gibi içe kıvrılıyor, yan yüzey yastık gibi
       şişkin, ışık üzerinde yuvarlak bir leke olarak kayıyordu; karakter çizgisi
       de yumuşak bir tümsekti. Artık kesit açık bir profil: tepede hafif taç
       (kaput/bagaj kubbesi), dar omuz yarıçapı, omuzdan karakter kırığına içe
       yatan bel (tumblehome), kırığın altında hafif basamak, dik kapı yüzü ve
       yalnız eşikte toplanan alt kıvrım. Kutu gövdede (klasik, SUV, van)
       yarıçaplar küçülüyor. Profil yarım: (x oranı, y oranı), tepe ortadan
       eşik ortasına; y kesin azalan — xAt/ustY ters aramaları buna dayanıyor. */
    const kut = s.dik?1:(s.cls==="suv"||s.cls==="van"?.5:0);
    const PROF_YUM=[[0,1],[.22,.998],[.42,.993],[.60,.984],[.72,.972],[.81,.953],[.87,.928],[.91,.895],
      [.935,.855],[.955,.80],[.972,.72],[.985,.62],[.994,.52],[.999,.455],[1.0,.43],[.993,.405],[.991,.37],
      [.994,.25],[.996,.10],[.995,-.08],[.990,-.28],[.981,-.47],[.968,-.63],[.950,-.76],[.922,-.86],
      [.880,-.93],[.810,-.975],[.680,-.993],[.45,-.998],[.20,-.999],[0,-1]];
    const PROF_KUT=[[0,1],[.22,.999],[.42,.997],[.60,.993],[.72,.988],[.81,.982],[.87,.974],[.91,.963],
      [.935,.950],[.955,.928],[.970,.895],[.982,.84],[.991,.74],[.998,.60],[1.0,.52],[.995,.49],[.994,.44],
      [.996,.30],[.998,.10],[.998,-.08],[.996,-.28],[.992,-.47],[.986,-.63],[.977,-.76],[.962,-.86],
      [.935,-.93],[.88,-.975],[.75,-.993],[.50,-.998],[.22,-.999],[0,-1]];
    const PROF=PROF_YUM.map((a,i)=>[a[0]+(PROF_KUT[i][0]-a[0])*kut, a[1]+(PROF_KUT[i][1]-a[1])*kut]);
    const NP=PROF.length;
    /* Halka sırası eski süperelipsle aynı yönde (sağ orta → tepe → sol → alt),
       yüz yönleri ve normaller değişmesin. */
    const HALKA=[];
    const ki=PROF.findIndex(p=>p[1]<=.10);             // sağ yan orta noktası
    for(let i=ki;i>=0;i--) HALKA.push(PROF[i]);           // sağ yan → tepe
    for(let i=1;i<NP-1;i++) HALKA.push([-PROF[i][0],PROF[i][1]]);   // sol yan, aşağı
    HALKA.push(PROF[NP-1]);
    for(let i=NP-2;i>ki;i--) HALKA.push(PROF[i]);         // alt → sağ yan
    // halka sırası → profil indeksi (cam evi profilin tepe dalını, 0..7, değiştiriyor)
    const HALKA_P=[];
    for(let i=ki;i>=0;i--) HALKA_P.push(i);
    for(let i=1;i<NP-1;i++) HALKA_P.push(i);
    HALKA_P.push(NP-1);
    for(let i=NP-2;i>ki;i--) HALKA_P.push(i);
    const GP=7;                                  // tepe dalında cam evine geçen son nokta
    /* CAM EVİ GÖVDENİN DERİSİ. Eskiden gövde kuşak hizasında kapalı bir
       tüptü; cam, direk ve tavan onun üstüne ayrı parçalar olarak oturuyordu.
       İki sonucu vardı: araç tek parça değil, kutuya takılmış bir kafes gibi
       duruyordu (yuvarlak direkler, kenarı düz tavan levhası, cama göre
       içerde kalan çerçeve) ve kabinin içine bakınca kuşak hizasında boyalı
       düz bir platform görünüyordu — koltuk ve kapı içleri onun altında
       kalıyordu. Artık her istasyonda kesitin tepe dalı cam evine uzuyor:
       kuşaktan içe yatan yan cam, köşede direk/tavan kenarı, kubbeli tavan.
       Ön cam, tavan ve arka cam aynı yüzeyin bölgeleri (loft grupları). */
    const tepe=(z)=>{                            // cam evinin orta tepe yüksekliği
      const y0=pr.beltF-.03;
      if(z<onCam0) return -1;
      if(z<=pr.camUst) return y0+(s.roof-y0)*((z-onCam0)/Math.max(.05,pr.camUst-onCam0));
      if(van || z<=pr.tavanArka) return s.roof+.008*Math.sin(Math.PI*Math.min(1,(z-pr.camUst)/Math.max(.1,pr.tavanArka-pr.camUst)));
      if(z<=pr.camAlt){
        const y1=pr.beltR-.03;
        return s.roof+(y1-s.roof)*((z-pr.tavanArka)/Math.max(.05,pr.camAlt-pr.tavanArka));
      }
      return -1;
    };
    const camEvi=(z)=>{
      const yT=ustHat(z), t=tepe(z);
      return t<0 ? 0 : Math.max(0, t-(yT-.012));
    };
    const kavis=van?.04:.075;
    const kesitler=list.map(z=>{
      const yT=ustHat(z), yB=altHat0(z), hw=genislik(z);
      const cy=(yT+yB)/2, hh=Math.max(.03,(yT-yB)/2);
      const kh=Math.min(kemerHat(z), yT-.10);
      const halka=HALKA.map(p=>[hw*p[0], Math.max(cy+hh*p[1], kh), z]);
      const H=camEvi(z);
      if(H<=0) return halka;
      const kar=Math.min(1, H/.06);
      const yb=yT-.012, top=yb+H, kv=kavis*Math.min(1,H/.30);
      const xg=Math.min(HWg*.915, hw*.93), xr=Math.min(HWg*.862, xg-.02);
      const kenar=top-kv;
      const G=[[0,top],[.32*xr,top-kv*.10],[.64*xr,top-kv*.42],[.90*xr,top-kv*.82],[xr,kenar-.022*Math.min(1,H/.2)]];
      const ust=G[4];
      // 5 ince fitil (camın üst kenarı), 6 yan camın ortası
      for(const k of [.10,.55]) G.push([ust[0]+(xg-ust[0])*k+.006*Math.sin(Math.PI*k), ust[1]+(yb-ust[1])*k]);
      G.push([xg, yb]);                           // 7: camın oturduğu kuşak
      return halka.map((q,r)=>{
        const p=HALKA_P[r]; if(p>GP) return q;
        const gx=G[p][0]*Math.sign(q[0]||1), gy=G[p][1];
        return [q[0]+(gx-q[0])*kar, q[1]+(gy-q[1])*kar, z];
      });
    });
    // malzeme bölgeleri: 0 boya, 1 cam, 2 tavan, 3 koyu (B direği)
    const camBolge=(i,j)=>{
      const pa=HALKA_P[j], pb=HALKA_P[(j+1)%HALKA_P.length];
      if(pa>GP || pb>GP) return 0;
      const za=list[i], zb=list[i+1], zm=(za+zb)/2;
      if(Math.min(camEvi(za),camEvi(zb))<.035) return 0;
      const lo=Math.min(pa,pb);
      const onCam=zm<pr.camUst, tavan=!onCam && (van || zm<=pr.tavanArka);
      if(lo>=4){                                   // yan cam bandı
        const camda=zm>onCam0+.02 && zm<cBit;
        if(Math.abs(zm-bz)<.045 && !van) return 3;
        /* camın üst kenarında ince koyu fitil: cam ile direk/tavan aynı
           gökyüzünü yansıtınca sınır kayboluyor, tavan da cam sanılıyordu */
        if(lo===4) return camda ? 3 : 0;
        return camda ? 1 : 0;
      }
      if(lo===3) return tavan?2:0;                 // köşe: A/C direği, tavan kenarı
      return tavan?2:1;                            // tepe: ön cam, tavan, arka cam
    };

    /** Profilde y oranına karşılık gelen x oranı (yan dal). */
    const profX=(ey)=>{
      for(let i=1;i<NP;i++){
        const a=PROF[i-1], b=PROF[i];
        if(ey<=a[1] && ey>=b[1]){ const t=(a[1]-ey)/Math.max(1e-6,a[1]-b[1]); return a[0]+(b[0]-a[0])*t; }
      }
      return 0;
    };
    const kirikI=PROF.reduce((e,p,i)=>p[0]>PROF[e][0]?i:e,0);   // en geniş nokta (karakter kırığı)
    /** Profilde x oranına karşılık gelen üst yüzey y oranı (tepe → kırık). */
    const profUstY=(ex)=>{
      for(let i=1;i<=kirikI;i++){
        const a=PROF[i-1], b=PROF[i];
        if(ex>=a[0] && ex<=b[0]){ const t=(ex-a[0])/Math.max(1e-6,b[0]-a[0]); return a[1]+(b[1]-a[1])*t; }
      }
      return PROF[kirikI][1];
    };
    const xAt=(z,y)=>{
      const yT=ustHat(z), yB=altHat0(z), hw=genislik(z);
      const cy=(yT+yB)/2, hh=Math.max(.03,(yT-yB)/2);
      const ey=Math.max(-.995,Math.min(.995,(y-cy)/hh));
      return hw*profX(ey);
    };
    /** Gövdenin z kesitinde, yanal x'teki üst yüzey yüksekliği (kaput, bagaj, tavan altı kuşak). */
    const ustY=(z,x)=>{
      const yT=ustHat(z), yB=altHat0(z), hw=genislik(z);
      const cy=(yT+yB)/2, hh=Math.max(.03,(yT-yB)/2);
      return cy+hh*profUstY(Math.min(1,Math.abs(x)/Math.max(.01,hw)));
    };
    /* (x,y) noktasının gövde yüzeyine değdiği z. Nokta siluetin tam kenarına
       denk gelirse (ör. ızgaranın üst sırası) kayan nokta gürültüsü yüzünden
       istasyon atlanmasın diye "en yakın" istasyon da tutulur; böylece panel
       burna yapışık kalır, birden 5-6 cm öne fırlamaz. */
    const yuzeyZ=(x,y,ileri)=>{
      const ax=Math.abs(x);
      let enIyi=null, enAz=1e9;
      for(let i=0;i<=60;i++){
        const zz=ileri ? -yarim+i*0.012 : yarim-i*0.012;
        const u=ustHat(zz), a=altHat(zz);
        const yk=Math.min(u-.006, Math.max(a+.006, y));
        const fark=Math.max(0, y-(u-.005)) + Math.max(0, (a+.005)-y)
                 + Math.max(0, ax-xAt(zz,yk));
        if(fark<=1e-6) return zz;
        if(fark<enAz){ enAz=fark; enIyi=zz; }
      }
      return enIyi!==null ? enIyi : (ileri ? -yarim+0.30 : yarim-0.30);
    };
    /** (x,y) noktasının gövdenin ÖN yüzeyine değdiği z. */
    const zOn=(x,y)=>yuzeyZ(x,y,true);
    /** (x,y) noktasının gövdenin ARKA yüzeyine değdiği z. */
    const zArka=(x,y)=>yuzeyZ(x,y,false);
    const g=loft(kesitler, true, camBolge);
    /** Ön camın z'deki orta yüksekliği (silecek ve iç parçalar için). */
    const onCamY=(z)=>{ const t=tepe(z); return t<0?ustHat(z):t; };
    g.userData={genislik, ustHat, altHat, xAt, ustY, zOn, zArka, onCamY, bz, xCam:(z)=>Math.min(HWg*.915, genislik(z)*.93)};
    geoCache[anahtar]=g; g.userData.paylasimli=true;
    return g;
  }

  /* Tavan kabuğu: enine kavisli ince kabuk */
  /* --- yumuşak temas gölgesi --- */
  function golgeTex(){
    return tex("golge",128,128,(g)=>{
      g.clearRect(0,0,128,128);
      const gr=g.createRadialGradient(64,64,6,64,64,60);
      gr.addColorStop(0,"rgba(0,0,0,.62)");
      gr.addColorStop(.45,"rgba(0,0,0,.42)");
      gr.addColorStop(.78,"rgba(0,0,0,.14)");
      gr.addColorStop(1,"rgba(0,0,0,0)");
      g.fillStyle=gr; g.fillRect(0,0,128,128);
    });
  }
  /* ---------- döşeme malzemeleri ---------- */
  function kumasTex(){
    return tex("kumas",128,128,(g)=>{
      g.fillStyle="#C9C6C0"; g.fillRect(0,0,128,128);
      for(let y=0;y<128;y+=3){          // dokuma atkı
        g.fillStyle=`rgba(90,88,84,${.18+Math.random()*.10})`;
        g.fillRect(0,y,128,1.4);
      }
      for(let x=0;x<128;x+=3){
        g.fillStyle=`rgba(255,255,255,${.10+Math.random()*.10})`;
        g.fillRect(x,0,1.4,128);
      }
      for(let i=0;i<900;i++){
        const v=Math.random()<.5?0:255;
        g.fillStyle=`rgba(${v},${v},${v},.07)`;
        g.fillRect(Math.random()*128,Math.random()*128,2,2);
      }
    },[5,5]);
  }
  function deriTex(){
    return tex("deri",128,128,(g)=>{
      g.fillStyle="#B9B4AE"; g.fillRect(0,0,128,128);
      for(let i=0;i<340;i++){           // gözenekli tane
        const x=Math.random()*128, y=Math.random()*128, r=2+Math.random()*4.5;
        g.fillStyle=`rgba(120,114,108,${.10+Math.random()*.18})`;
        g.beginPath(); g.ellipse(x,y,r,r*(.6+Math.random()*.6),Math.random()*3,0,7); g.fill();
        g.fillStyle=`rgba(255,253,250,${.08+Math.random()*.14})`;
        g.beginPath(); g.ellipse(x-1,y-1,r*.55,r*.45,0,0,7); g.fill();
      }
      g.strokeStyle="rgba(70,66,62,.20)"; g.lineWidth=1;
      for(let i=0;i<12;i++){
        g.beginPath(); g.moveTo(Math.random()*128,Math.random()*128);
        g.bezierCurveTo(Math.random()*128,Math.random()*128,Math.random()*128,
          Math.random()*128,Math.random()*128,Math.random()*128); g.stroke();
      }
    },[3,3]);
  }
  function suniTex(){
    return tex("suni",128,128,(g)=>{
      g.fillStyle="#C2BEB9"; g.fillRect(0,0,128,128);
      for(let i=0;i<200;i++){
        g.fillStyle=`rgba(150,146,142,${.08+Math.random()*.10})`;
        g.beginPath(); g.arc(Math.random()*128,Math.random()*128,1.5+Math.random()*2.5,0,7); g.fill();
      }
      const gr=g.createLinearGradient(0,0,0,128);
      gr.addColorStop(0,"rgba(255,255,255,.10)"); gr.addColorStop(1,"rgba(0,0,0,.06)");
      g.fillStyle=gr; g.fillRect(0,0,128,128);
    },[3,3]);
  }
  function kadifeTex(){
    return tex("kadife",128,128,(g)=>{
      g.fillStyle="#BDB6AE"; g.fillRect(0,0,128,128);
      for(let i=0;i<2600;i++){         // havlı yüzey
        const y=Math.random()*128;
        g.fillStyle=`rgba(${Math.random()<.5?60:255},${Math.random()<.5?58:252},${Math.random()<.5?56:248},.08)`;
        g.fillRect(Math.random()*128, y, 1, 3+Math.random()*4);
      }
      for(let x=0;x<128;x+=16){
        g.fillStyle="rgba(70,66,62,.16)"; g.fillRect(x,0,2,128);
      }
    },[4,4]);
  }
  function haliTex(){
    return tex("hali",128,128,(g)=>{
      g.fillStyle="#7E7A75"; g.fillRect(0,0,128,128);
      for(let i=0;i<2200;i++){
        const v=Math.random()<.5?40:170;
        g.fillStyle=`rgba(${v},${v},${v},.12)`;
        g.fillRect(Math.random()*128,Math.random()*128,2,2);
      }
    },[4,6]);
  }
  /** Gösterge paneli: kadranlar, km, uyarı lambaları. */
  function gostergeTex(car){
    const _en=(typeof EN==="function"&&EN());
    const _deger=_en?Math.round(car.km*0.6214):car.km;
    const km=new Intl.NumberFormat(_en?"en-US":"tr-TR").format(_deger);
    const _br=_en?"mi":"km", _hiz=_en?"mph":"km/s";
    return tex("gsg"+I18N.lang+car.id+"_"+car.km, 512, 160, (g)=>{
      g.fillStyle="#0B0E11"; g.fillRect(0,0,512,160);
      const kadran=(cx,cy,r,ust,adet,renk)=>{
        g.strokeStyle="#2A3138"; g.lineWidth=3;
        g.beginPath(); g.arc(cx,cy,r,0,7); g.stroke();
        g.strokeStyle=renk; g.lineWidth=2.4;
        for(let i=0;i<=adet;i++){
          const a=Math.PI*.78 + (Math.PI*1.44)*(i/adet);
          const r1=r-(i%2?6:11), r2=r-2;
          g.beginPath(); g.moveTo(cx+Math.cos(a)*r1, cy+Math.sin(a)*r1);
          g.lineTo(cx+Math.cos(a)*r2, cy+Math.sin(a)*r2); g.stroke();
        }
        g.fillStyle="#8E9AA3"; g.font="600 13px system-ui,-apple-system,sans-serif"; g.textAlign="center";
        g.fillText(ust, cx, cy+r*.55);
        g.strokeStyle="#E2544C"; g.lineWidth=3.4;   // ibre
        const ai=Math.PI*.80;
        g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx+Math.cos(ai)*(r-14), cy+Math.sin(ai)*(r-14)); g.stroke();
        g.fillStyle="#1A2026"; g.beginPath(); g.arc(cx,cy,5,0,7); g.fill();
      };
      kadran(132,78,60,_hiz,12,"#CFD6DC");
      kadran(380,78,60,_en?"x1000 rpm":"x1000 d/dk",8,"#CFD6DC");
      g.fillStyle="#0E1318"; g.fillRect(206,60,100,44);
      g.strokeStyle="#2A3138"; g.lineWidth=2; g.strokeRect(206,60,100,44);
      g.fillStyle="#F2A007"; g.font="600 19px ui-monospace,SFMono-Regular,Menlo,monospace"; g.textAlign="center";
      g.fillText(km, 256, 84);
      g.fillStyle="#5B646C"; g.font="500 11px system-ui,-apple-system,sans-serif";
      g.fillText(_br, 256, 98);
      const lamba=(x,renk)=>{ g.fillStyle=renk; g.beginPath(); g.arc(x,136,6,0,7); g.fill(); };
      lamba(216,"#2E7D4F"); lamba(238,"#C8912A"); lamba(260,"#9E3A32"); lamba(282,"#2A5FA8");
    });
  }
  function ekranTex(){
    return tex("ekran",256,160,(g)=>{
      g.fillStyle="#0A0D10"; g.fillRect(0,0,256,160);
      g.fillStyle="#131A20"; g.fillRect(6,6,244,148);
      g.strokeStyle="#2A3942"; g.lineWidth=2;
      for(let i=0;i<6;i++){ g.beginPath(); g.moveTo(10,26+i*22); g.lineTo(150,26+i*22); g.stroke(); }
      g.fillStyle="#F2A007"; g.fillRect(10,14,64,8);
      g.fillStyle="#3C5A73"; g.beginPath();
      g.moveTo(160,140); g.lineTo(196,40); g.lineTo(214,74); g.lineTo(246,30);
      g.lineTo(246,140); g.closePath(); g.fill();
      g.fillStyle="#9FB4C4"; g.font="600 14px system-ui,-apple-system,sans-serif";
      g.fillText("FM 94.9", 12, 150);
    });
  }
  function plastikTex(){
    return tex("plastikD",128,128,(g)=>{
      g.fillStyle="#9A9A9A"; g.fillRect(0,0,128,128);
      for(let i=0;i<5200;i++){
        const v=Math.random()<.5?70:220;
        g.fillStyle=`rgba(${v},${v},${v},.10)`;
        g.fillRect(Math.random()*128,Math.random()*128,1.6,1.6);
      }
    },[6,6]);
  }
  function menfezTex(){
    return tex("menfez",64,64,(g)=>{
      g.fillStyle="#14181C"; g.fillRect(0,0,64,64);
      g.fillStyle="#39424A";
      for(let y=6;y<64;y+=10) g.fillRect(3,y,58,4);
    });
  }

  function lastikYaziTex(){
    return tex("lasyazi",128,128,(g)=>{
      g.fillStyle="#0D1013"; g.fillRect(0,0,128,128);
      g.strokeStyle="rgba(150,150,150,.16)"; g.lineWidth=2;
      for(let i=0;i<10;i++){ g.beginPath(); g.arc(64,64,20+i*4,0,7); g.stroke(); }
    });
  }

  /* ---------- tekerlek parçaları ---------- */
  function lastikGeo(R){
    const k=`las${R.toFixed(3)}`;
    if(geoCache[k]) return geoCache[k];
    const en=R*.52, p=[];
    p.push({geo:new THREE.CylinderGeometry(R,R,en*.72,32,1,true),
            mat:new THREE.Matrix4().makeRotationZ(Math.PI/2)});
    for(const sx of [-1,1]){        // omuz pahı
      const m=new THREE.Matrix4().makeRotationZ(Math.PI/2);
      m.setPosition(sx*en*.44,0,0);
      p.push({geo:new THREE.CylinderGeometry(R,R*.955,en*.16,32,1,true), mat:
        sx>0?m:new THREE.Matrix4().makeRotationZ(-Math.PI/2).setPosition(sx*en*.44,0,0)});
    }
    const g=birlestir(p); geoCache[k]=g; g.userData.paylasimli=true; return g;
  }
  function yanakGeo(R, kalin){
    const k=`yan${R.toFixed(3)}${kalin?"K":""}`;
    if(geoCache[k]) return geoCache[k];
    const en=R*.52, p=[];
    const rt=kalin?R*.855:R*.895, tt=kalin?R*.145:R*.105;
    for(const sx of [-1,1]){
      const m=new THREE.Matrix4().makeRotationY(Math.PI/2);
      m.setPosition(sx*en*.34,0,0);
      p.push({geo:new THREE.TorusGeometry(rt,tt,8,32), mat:m});
      /* Yanağın düz yüzü. Eskiden yalnız dış kenarda bir simit vardı; jant
         dudağı (R*.74) ile simit (R*.79) arasında boşluk kalıyor, oradan arka
         plan görünüyordu — jant lastiğe takılı değil, önüne yapıştırılmış
         gibi duruyordu. */
      const mr=new THREE.Matrix4().makeRotationY(sx*Math.PI/2);
      mr.setPosition(sx*en*.30,0,0);
      p.push({geo:new THREE.RingGeometry(R*.66, R*.93, 32, 1), mat:mr});
    }
    const g=birlestir(p); geoCache[k]=g; g.userData.paylasimli=true; return g;
  }
  /* Davlumbaz kovuğu: kemer açıklığının içi kapkara olmalı. Gövde kesiti
     kemerde düz bir tabanla kapanıyor; o taban boya renginde ve ışık alıyordu,
     tekerin üstünde açık renk bir boşluk kalıyor ve teker gövdeye takılı
     değil, yanına konmuş gibi görünüyordu. Kovuk: kemerin hemen içinde, üst
     yarıyı saran açık silindir + içe bakan kapak. */
  function kovukGeo(ra, derin){
    const k=`kov${ra.toFixed(3)}_${derin.toFixed(3)}`;
    if(geoCache[k]) return geoCache[k];
    const p=[];
    // yalnız üst yarı: fazlası tekerin önünde ve arkasında paça gibi sarkıyordu
    const yay=Math.PI*1.02, bas=-yay/2;
    const sil=new THREE.CylinderGeometry(ra, ra, derin, 32, 1, true, bas, yay);
    // silindir ekseni Y → X: üst yarı +Y'ye baksın
    p.push({geo:sil, mat:new THREE.Matrix4().makeRotationZ(Math.PI/2).multiply(new THREE.Matrix4().makeRotationY(Math.PI/2))});
    const kap=new THREE.CircleGeometry(ra, 32, -Math.PI*.01, Math.PI*1.02);
    const mk=new THREE.Matrix4().makeRotationY(Math.PI/2); mk.setPosition(-derin/2,0,0);
    p.push({geo:kap, mat:mk});
    const g=birlestir(p); geoCache[k]=g; g.userData.paylasimli=true; return g;
  }
  /** Lastiğin zemine bastığı yerdeki yumuşak temas gölgesi. */
  function temasTex(){
    return tex("temas",64,64,(g,w,h)=>{
      const rg=g.createRadialGradient(w/2,h/2,2,w/2,h/2,w/2);
      rg.addColorStop(0,"rgba(0,0,0,.78)"); rg.addColorStop(.45,"rgba(0,0,0,.42)"); rg.addColorStop(1,"rgba(0,0,0,0)");
      g.fillStyle=rg; g.fillRect(0,0,w,h);
    });
  }
  /* Alaşım jant. Kollar eskiden düz kutuydu ve uçlarında ikinci bir kutu
     vardı: yakından bakınca jant oyuncak tekerleğine benziyordu. Artık kol
     göbekte geniş, bilezikte dar (sivrilen) ve dışa bakan yüzü bileziğe
     doğru geriye yatıyor (çanak); bilezik ve göbek daha yuvarlak. */
  function jantGeo(R, kol){                 // parlak yüzey: bilezik + kollar + göbek
    const k=`jant2${R.toFixed(3)}_${kol}`;
    if(geoCache[k]) return geoCache[k];
    const en=R*.46, p=[];
    p.push({geo:new THREE.TorusGeometry(R*.695,R*.042,8,40),
            mat:new THREE.Matrix4().makeRotationY(Math.PI/2).setPosition(en*.30,0,0)});
    p.push({geo:new THREE.CylinderGeometry(R*.235,R*.25,en*.62,28),
            mat:new THREE.Matrix4().makeRotationZ(Math.PI/2).setPosition(en*.10,0,0)});
    const ikiz = kol>=6;                       // 6 kollu jant: üçer çift kol
    const say = ikiz ? kol : kol;
    for(let i=0;i<say;i++){
      const a=2*Math.PI*i/say + (ikiz && i%2 ? -.10 : 0) + (ikiz ? .05 : 0);
      const uz=R*.50;
      const sp=new THREE.BoxGeometry(en*.40, uz, R*.16, 1, 4, 1);
      const pp=sp.attributes.position, v=new THREE.Vector3();
      for(let j=0;j<pp.count;j++){
        v.fromBufferAttribute(pp,j);
        const t=v.y/uz+.5;                     // 0 göbek, 1 bilezik
        v.z*= (ikiz? .72:1) * (1.18-.50*t);    // sivrilme
        if(v.x>0) v.x-= en*.16*t*t;            // çanak: dış yüz bileziğe doğru geriye
        pp.setXYZ(j,v.x,v.y,v.z);
      }
      sp.computeVertexNormals();
      const rot=new THREE.Matrix4().makeRotationX(a);
      const tr=new THREE.Matrix4().makeTranslation(en*.22, Math.cos(a)*R*.46, Math.sin(a)*R*.46);
      p.push({geo:sp, mat:tr.multiply(rot)});
    }
    for(let i=0;i<5;i++){                    // bijon
      const a=2*Math.PI*i/5+.3;
      const b=new THREE.CylinderGeometry(R*.030,R*.034,R*.05,8);
      const rot=new THREE.Matrix4().makeRotationZ(Math.PI/2);
      const tr=new THREE.Matrix4().makeTranslation(en*.42, Math.cos(a)*R*.15, Math.sin(a)*R*.15);
      p.push({geo:b, mat:tr.multiply(rot)});
    }
    const g=birlestir(p); geoCache[k]=g; g.userData.paylasimli=true; return g;
  }
  function jantIcGeo(R){                    // koyu iç kısım (kollar arası boşluk)
    const k=`jic${R.toFixed(3)}`;
    if(geoCache[k]) return geoCache[k];
    const en=R*.46, p=[];
    p.push({geo:new THREE.CylinderGeometry(R*.66,R*.66,en*.70,18,1,true),
            mat:new THREE.Matrix4().makeRotationZ(Math.PI/2)});
    p.push({geo:new THREE.CylinderGeometry(R*.66,R*.66,R*.03,18),
            mat:new THREE.Matrix4().makeRotationZ(Math.PI/2).setPosition(-en*.20,0,0)});
    const g=birlestir(p); geoCache[k]=g; g.userData.paylasimli=true; return g;
  }
  function diskGeo(R){
    const k=`disk${R.toFixed(3)}`;
    if(geoCache[k]) return geoCache[k];
    const p=[{geo:new THREE.CylinderGeometry(R*.54,R*.54,R*.055,18),
              mat:new THREE.Matrix4().makeRotationZ(Math.PI/2)}];
    const g=birlestir(p); geoCache[k]=g; g.userData.paylasimli=true; return g;
  }

  function buildCar(car, detay){
    const ad=car.model.n;
    const s=Object.assign({}, profil3B(car.model));
    const imza=imza3B(car.model);
    const g=new THREE.Group();
    const pr=silProfil(s);
    const L=s.L, yarim=L/2, R=s.wr, HW=s.W/2;
    const onZ=pr.onZ, arkaZ=pr.arkaZ;
    const rr=tohum(car.id||1);

    /* ---- parça kovaları: aynı malzemeli her şey tek çizime iner ---- */
    const kova=new Map();
    const EK=(k, geo, poz, rot, olc)=>{
      const m=new THREE.Matrix4(), q=new THREE.Quaternion();
      if(rot) q.setFromEuler(new THREE.Euler(rot[0]||0, rot[1]||0, rot[2]||0));
      m.compose(new THREE.Vector3(poz?poz[0]:0, poz?poz[1]:0, poz?poz[2]:0), q,
                new THREE.Vector3(olc?olc[0]:1, olc?olc[1]:1, olc?olc[2]:1));
      let a=kova.get(k); if(!a){ a=[]; kova.set(k,a); }
      a.push({geo, mat:m});
    };
    const KUTU=(k,w,h,d,poz,rot)=>EK(k, kutu(w,h,d), poz, rot);

    /* ---- görünen kusurlar ---- */
    const gorulur=f=>!f.fixed && (f.visible || car.inspected);
    const kusur=n=>(car.faults||[]).some(f=>f.n===n && gorulur(f));
    const kompleBoya=kusur("Komple boya lazım");
    const pasVar    =kusur("Alt sac pas onarımı");
    const kapiBoya  =kusur("Kapı boyası gerekli");
    const camurluk  =kusur("Çamurluk düzeltme + boya");
    const yagKacak  =kusur("Yağ kaçağı");
    const dosemeEski=kusur("Döşeme yıpranmış");
    const torpidoCat=kusur("Torpido çatlağı");
    const kaportaAsn=(car.wear&&car.wear.kaporta)||0;

    /* ---- malzemeler ---- */
    const c0=new THREE.Color(COLHEX[car.color]!==undefined?COLHEX[car.color]:0x7A8288);
    if(kompleBoya) c0.lerp(new THREE.Color(0x71777D), .32);
    else if(kaportaAsn>30) c0.lerp(new THREE.Color(0x6E747A), .12);
    const ambT=amblemTex(ad);
    const icRenk=imza.ic||(car.model.seg==="lux"?0x33353A:0x24272C);
    const dTip=(typeof dosemeTipi==="function")?dosemeTipi(car):"kumas";
    const dMap={kumas:kumasTex(), deri:deriTex(), suni:suniTex(), kadife:kadifeTex()}[dTip];
    const dParlak={kumas:6, deri:64, suni:38, kadife:4}[dTip];
    const dSpec ={kumas:0x0E1012, deri:0x6A6259, suni:0x4A4C50, kadife:0x0C0E10}[dTip];
    const dRenk=new THREE.Color(icRenk).offsetHSL(0,0, dTip==="deri"?.10:.08);
    const dYan =new THREE.Color(icRenk).offsetHSL(0,0, dTip==="deri"?.03:.12);
    const ahsapVar = car.model.seg==="lux" || car.model.cl;
    const MAT={
      boya:  matBoya(c0.getHex(), kompleBoya?14:(kaportaAsn>26?34:76), METALIK_RENK.includes(car.color)),
      tavan: imza.kontrastTavan?matBoya(imza.kontrastTavan,44):null,
      koyu:  matKara(0x171B20, 24),
      koyuP: matKara(0x101418, 62),
      krom:  matKrom(),
      cam:   matCam(car.model.cl),
      ic:    new THREE.MeshLambertMaterial({color:icRenk,
               emissive:new THREE.Color(icRenk).multiplyScalar(.26)}),
      doseme:new THREE.MeshPhongMaterial({color:dRenk.getHex(), map:dMap,
               shininess:dParlak, specular:dSpec,
               emissive:new THREE.Color(icRenk).multiplyScalar(.16)}),
      dosemeYan:new THREE.MeshPhongMaterial({color:dYan.getHex(), map:dMap,
               shininess:dParlak*.8, specular:dSpec,
               emissive:new THREE.Color(icRenk).multiplyScalar(.15)}),
      dikis: new THREE.MeshLambertMaterial({color:dTip==="deri"?0xC9BFA8:0x8E9298,
               emissive:0x1A1C1E}),
      hali:  new THREE.MeshPhongMaterial({color:new THREE.Color(icRenk).offsetHSL(0,0,-.02).getHex(),
               map:haliTex(), shininess:3, emissive:new THREE.Color(icRenk).multiplyScalar(.12)}),
      plastik:new THREE.MeshPhongMaterial({color:new THREE.Color(icRenk).offsetHSL(0,0,.02).getHex(),
               map:plastikTex(), shininess:14, specular:0x1A1E22,
               emissive:new THREE.Color(icRenk).multiplyScalar(.13)}),
      ahsap: new THREE.MeshPhongMaterial({color:0x6B4A2A, shininess:90, specular:0x9A7A50,
               emissive:0x1A1008}),
      direksiyon:new THREE.MeshPhongMaterial({color:dTip==="deri"?0x2A2622:0x16191D,
               map:dTip==="deri"?dMap:null, shininess:dTip==="deri"?70:20,
               specular:dTip==="deri"?0x5E564C:0x161A1E, emissive:0x0C0E10}),
      kemer: new THREE.MeshLambertMaterial({color:0x2B3036, emissive:0x0E1013}),
      icKabuk:new THREE.MeshPhongMaterial({color:new THREE.Color(icRenk).offsetHSL(0,0,-.02).getHex(),
               side:THREE.BackSide, shininess:8,
               emissive:new THREE.Color(icRenk).multiplyScalar(.14)}),
      gosterge:new THREE.MeshBasicMaterial({map:gostergeTex(car)}),
      ekranIc:new THREE.MeshBasicMaterial({map:ekranTex()}),
      menfez: new THREE.MeshBasicMaterial({map:menfezTex()}),
      tavanIc:new THREE.MeshLambertMaterial({color:0x767C82, emissive:0x1E2226}),
      lastik:new THREE.MeshPhongMaterial({color:0x14181C, shininess:10, specular:0x0A0C0E}),
      yanak: new THREE.MeshPhongMaterial({map:lastikYaziTex(), shininess:16, specular:0x121618}),
      /* Alaşım jant artık parlak açık gri bir disk değil: daha koyu metal,
         daha az ayna. Açık gri, beyaz/gümüş gövdeyle birleşip tekeri tek renk
         bir oyuncak parçasına çeviriyordu. */
      jant:  new THREE.MeshPhongMaterial({color:imza.tampon?0xB9C0C6:(car.model.seg==="lux"?0x5E656C:0x858C93),
               shininess:90, specular:0xC9D0D6, envMap:ortamTex(), reflectivity:.30, combine:THREE.MixOperation}),
      sacJant:new THREE.MeshPhongMaterial({color:0x3A3F45, shininess:40, specular:0x5A6168}),
      kovuk: new THREE.MeshLambertMaterial({color:0x08090B, side:THREE.DoubleSide}),
      temas: new THREE.MeshBasicMaterial({map:temasTex(), transparent:true, depthWrite:false}),
      jantIc:matKara(0x0D0F12, 8),   // kollar arası: derin gölge, gri disk değil
      disk:  new THREE.MeshPhongMaterial({color:0x5A6167, shininess:60, specular:0x8A9298}),
      kaliper:new THREE.MeshPhongMaterial({color:car.model.seg==="lux"?0x8E2A24:0x3A4046, shininess:40}),
      petek: new THREE.MeshPhongMaterial({map:petekTex(), shininess:26, specular:0x2A3036}),
      far:   new THREE.MeshBasicMaterial({map:farTex(imza.far, false), transparent:true, alphaTest:.45}),
      farA:  new THREE.MeshBasicMaterial({map:farTex(imza.far, true),  transparent:true, alphaTest:.45}),
      izgara:new THREE.MeshPhongMaterial({map:izgaraTex(imza.izgaraTip, imza.chrome>=.45), transparent:true, alphaTest:.45,
               shininess:70, specular:0x5A6670}),
      stop:  new THREE.MeshBasicMaterial({map:stopTex()}),
      led:   new THREE.MeshBasicMaterial({color:0xE9F4FF}),
      sinyal:new THREE.MeshBasicMaterial({color:0xE8A63A}),
      geri:  new THREE.MeshBasicMaterial({color:0xE6EAEE}),
      lens:  fiziksel()
               ? new THREE.MeshPhysicalMaterial({color:0xE8EEF2, transparent:true, opacity:.22,
                   roughness:.02, metalness:0, clearcoat:1, clearcoatRoughness:.02,
                   envMap:boyaOrtamTex(), envMapIntensity:1.6, depthWrite:false})
               : new THREE.MeshPhongMaterial({color:0xBCCEDA, transparent:true, opacity:.30,
                   shininess:200, specular:0xFFFFFF, envMap:boyaOrtamTex(), reflectivity:.55,
                   combine:THREE.MixOperation, depthWrite:false}),
      lensK: fiziksel()
               ? new THREE.MeshPhysicalMaterial({color:0x9A1E18, transparent:true, opacity:.38,
                   roughness:.03, clearcoat:1, clearcoatRoughness:.03,
                   envMap:boyaOrtamTex(), envMapIntensity:1.2, depthWrite:false})
               : new THREE.MeshPhongMaterial({color:0xB4322A, transparent:true, opacity:.42,
                   shininess:180, specular:0xFFD9D0, depthWrite:false}),
      sisLens:new THREE.MeshPhongMaterial({color:0x7E8890, shininess:160, specular:0xFFFFFF,
               envMap:boyaOrtamTex(), reflectivity:.35, combine:THREE.MixOperation}),
      plaka: new THREE.MeshBasicMaterial({map:plakaTex(car.plate)}),
      amblem:ambT?new THREE.MeshBasicMaterial({map:ambT, transparent:true}):null,
      cizgi: new THREE.MeshBasicMaterial({color:0x07090C, transparent:true, opacity:.30, side:THREE.DoubleSide}),
      golge: new THREE.MeshBasicMaterial({map:golgeTex(), transparent:true, depthWrite:false, opacity:.55})
    };
    if(!MAT.tavan) MAT.tavan=MAT.boya;
    const boyaKey = "boya", tavanKey = imza.kontrastTavan?"tavan":"boya";

    /* ================= GÖVDE ================= */
    g.userData.boyaMat=[MAT.boya]; if(MAT.tavan!==MAT.boya) g.userData.boyaMat.push(MAT.tavan);
    g.userData.camMat=MAT.cam;
    g.userData.detay=!!detay;
    const gGeo=govdeGeo(ad+"|"+car.model.seg+"|g", s, pr);
    // tek deri: boya, cam, tavan, B direği aynı yüzeyin grupları
    const gov=new THREE.Mesh(gGeo, [MAT.boya, MAT.cam, MAT[tavanKey], MAT.koyuP]); gov.name="govde"; g.add(gov);
    if(detay){                       // içeriden bakınca boya değil, iç kaplama görünsün
      // cam bölgesi iç kabukta boş kalmalı, yoksa camdan bakınca iç kaplama görünür
      const gizli=new THREE.MeshBasicMaterial({visible:false});
      const ik=new THREE.Mesh(gGeo, [MAT.icKabuk, gizli, MAT.icKabuk, MAT.icKabuk]);
      ik.scale.set(.975,.985,.998); ik.position.y=.004; g.add(ik);
    }
    const genislik=gGeo.userData.genislik, xAt=gGeo.userData.xAt;
    const ustHat=gGeo.userData.ustHat, altHat=gGeo.userData.altHat;
    const ustY=gGeo.userData.ustY;
    const zOn=gGeo.userData.zOn, zArka=gGeo.userData.zArka;
    /** Gövdenin ön yüzeyine yapışan panel (far, ızgara, şerit...). */
    /** Panelin köşesi gövdenin dışına taşarsa yüzey örneklemesi başarısız olur;
        x'i o yükseklikteki azami yarı genişliğe çekerek panel burna yapışık kalır. */
    const kirp=(x,y)=>{
      const ax=Math.abs(x); if(ax<.02) return x;
      let en=0;
      for(let i=0;i<=40;i++){ const zz=-yarim+i*.014;
        if(y<=ustHat(zz)-.005 && y>=altHat(zz)+.005) en=Math.max(en, xAt(zz,y)); }
      if(en<=0 || ax<=en) return x;
      return (x<0?-1:1)*en;
    };
    /* Ön/arka panel noktası burundan en fazla bu kadar geride olabilir.
       kirp() genişliği burnun 56 cm gerisine kadar arıyordu; farın dış köşesi
       ön yüzü aşınca nokta çamurluğun yan yüzeyine, yarım metre geriye
       yapışıyor ve far çerçevesi çamurlukta siyah bir pençe izi gibi
       uzanıyordu. Şimdi nokta bu derinliği aşarsa içeri çekiliyor. */
    const PANEL_DERIN=.12;
    const onNokta=(x,y)=>{
      let z=zOn(x,y);
      if(z>-yarim+PANEL_DERIN && Math.abs(x)>.02){
        x=Math.sign(x)*Math.min(Math.abs(x), xAt(-yarim+PANEL_DERIN*.8, y)*.97);
        z=Math.min(zOn(x,y), -yarim+PANEL_DERIN);
      }
      return [x,z];
    };
    const arkaNokta=(x,y)=>{
      let z=zArka(x,y);
      if(z<yarim-PANEL_DERIN && Math.abs(x)>.02){
        x=Math.sign(x)*Math.min(Math.abs(x), xAt(yarim-PANEL_DERIN*.8, y)*.97);
        z=Math.max(zArka(x,y), yarim-PANEL_DERIN);
      }
      return [x,z];
    };
    const onPanel=(k, xm, ym, w, h, derz, nu, nv)=>{
      const gg=yuzey(nu||5, nv||3, (u,v)=>{
        const y=ym-h/2+h*v;
        const [x,z]=onNokta(kirp(xm-w/2+w*u, y), y);
        return [x, y, z-(derz||.012)];
      });
      const mm=new THREE.Mesh(gg, MAT[k]); mm.name=k;
      if(MAT[k]) MAT[k].side=THREE.DoubleSide;
      g.add(mm); return mm;
    };
    /** Ön yüzde alt kenarı üst kenarından farklı genişlikte panel (tampon ağzı). */
    const onTrapez=(k, xm, ym, wUst, wAlt, h, derz)=>{
      const gg=yuzey(6, 2, (u,v)=>{
        const y=ym-h/2+h*v, w=wAlt+(wUst-wAlt)*v;
        const [x,z]=onNokta(kirp(xm-w/2+w*u, y), y);
        return [x, y, z-(derz||.012)];
      });
      const mm=new THREE.Mesh(gg, MAT[k]); mm.name=k;
      if(MAT[k]) MAT[k].side=THREE.DoubleSide;
      g.add(mm); return mm;
    };
    /** Gövdenin arka yüzeyine yapışan panel. */
    const arkaPanel=(k, xm, ym, w, h, derz, nu, nv)=>{
      const gg=yuzey(nu||5, nv||3, (u,v)=>{
        const y=ym-h/2+h*v;
        const [x,z]=arkaNokta(xm-w/2+w*u, y);
        return [x, y, z+(derz||.012)];
      });
      const mm=new THREE.Mesh(gg, MAT[k]); mm.name=k;
      if(MAT[k]) MAT[k].side=THREE.DoubleSide;
      g.add(mm); return mm;
    };

    /* ================= CAM EVİ DETAYI =================
       Cam, direkler ve tavan artık gövde derisinin bölgeleri (govdeGeo).
       Burada yalnız derinin üstüne oturan ince parçalar kalıyor. */
    const camTepe=s.roof-.055;
    const onCamY=gGeo.userData.onCamY, xCam=gGeo.userData.xCam;
    const hwCam=HW*.915;
    const V=(x,y,z)=>new THREE.Vector3(x,y,z);
    // pencere fitili: camın kuşağa oturduğu yerde ince koyu şerit
    for(const sx of [-1,1]){
      EK("koyu", yuzey(10,1,(u,v)=>{
        const z=pr.kaputZ+.08+(pr.camAlt-.06-(pr.kaputZ+.08))*u;
        const yb=ustHat(z)-.012;
        return [sx*(xCam(z)+.004), yb-.006+.016*v, z];
      }));
    }
    // ön cam alt frit: camın kaputa değdiği yerde koyu bant
    EK("koyu", yuzey(8,1,(u,v)=>{
      const z=pr.kaputZ+.035+.035*v, x=(-1+2*u)*xCam(z)*.97;
      return [x, onCamY(z)+.003, z];
    }));
    // silecekler: ön camın dibinde, camın eğimine yatık
    {
      const z0=pr.kaputZ+.09, egim=Math.atan2(onCamY(z0+.1)-onCamY(z0), .1);
      // park konumunda yatay: kol ve süpürgeç camın dibinde, enine uzanır
      /* Eskiden iki kalın kutu yan yana: camın dibinde tek parça kalın bir
         tahta gibi görünüyordu. Artık ince süpürgeç + daha da ince kol, iki
         silecek arasında boşluk, her birinin dibinde pim. */
      for(const sx of [-1,1]){
        const uz=Math.min(.52,hwCam*.60), x=sx*hwCam*.42-.04;
        const yz=onCamY(z0)+.010;
        EK("koyuP", kutu(uz,.009,.014), [x, yz, z0], [-egim,0,sx*.035]);                  // süpürgeç
        EK("koyuP", kutu(uz*.92,.006,.008), [x+.01, yz+.010, z0-.004], [-egim,0,sx*.035]); // kol
        EK("koyuP", silindir(.014,.016,.02,10), [x+uz*.46, onCamY(z0-.02)+.006, z0-.02]);   // pim
      }
    }
    // köpekbalığı anten: kutu değil, arkaya yatık alçak bir kama
    if(!car.model.cl) EK("koyuP", new THREE.ConeGeometry(.032,.15,4,1), [0, s.roof+.022, pr.tavanArka-.14], [-Math.PI/2+.35,Math.PI/4,0], [1,1,.55]);

    /* ================= İÇ MEKÂN ================= */
    const kabinZ0=pr.kaputZ, kabinZ1=pr.camAlt, kabinUz=Math.max(.5,kabinZ1-kabinZ0);
    const belOrt=(pr.beltF+pr.beltR)/2;
    const tabanY=pr.sill+.04;   // eşik hizası — kuşak yüksekliğinden bağımsız
    /* İç parçalar gövdenin O YÜKSEKLİKTEKİ genişliğine göre. Eskiden araç
       genişliğine (s.W, HW) göre konuyordu; gövde eşik hizasında daralırken
       taban ve iç etek yanlardan dışarı taşıyor, iç rengi açık lüks/klasik
       araçta kapıların altında kahverengi bir bant çiziyordu. */
    const kabOrtZ=(kabinZ0+kabinZ1)/2;
    const icX=(y)=>Math.min(xAt(kabinZ0+.15,y), xAt(kabOrtZ,y), xAt(kabinZ1-.15,y));
    // taban + halı
    KUTU("ic", icX(tabanY-.06)*2-.06,.09,kabinUz+.34, [0, tabanY-.02, kabOrtZ+.02]);
    KUTU("hali", Math.min(s.W*.84, icX(tabanY+.03)*2-.10),.012,kabinUz*.95, [0, tabanY+.035, kabOrtZ]);
    for(const sx of [-1,1])
      KUTU("ic", .06,.34,kabinUz+.30, [sx*(icX(tabanY+.02)-.06), tabanY+.14, kabOrtZ+.02]);
    // kapı içleri: plastik gövde + döşeme dolgusu + kolçak
    for(const sx of [-1,1]){
      KUTU("ic", .055, Math.max(.12,belOrt-tabanY), kabinUz*.98,
        [sx*(icX(tabanY+.04)-.07), (tabanY+belOrt)/2, kabOrtZ]);
      KUTU("doseme", .022, Math.max(.08,(belOrt-tabanY)*.46), kabinUz*.52,
        [sx*(HW-.108), (tabanY+belOrt)/2+.02, kabinZ0+kabinUz*.36]);
      KUTU("ic", .075,.10, kabinUz*.42, [sx*(HW-.115), belOrt-.16, kabinZ0+.62]);
      if(detay){
        EK("koyuP", new THREE.CylinderGeometry(.075,.075,.022,14),
          [sx*(HW-.105), tabanY+.14, kabinZ0+.46], [0,0,Math.PI/2]);     // hoparlör
        KUTU("krom", .018,.022,.11, [sx*(HW-.108), belOrt-.09, kabinZ0+.40]); // iç kapı kolu
      }
    }
    // tavan döşemesi + güneşlikler + tavan lambası + dikiz aynası
    KUTU("tavanIc", s.W*.80,.030, (pr.tavanArka-pr.camUst)*.92,
      [0, s.roof-.085, (pr.camUst+pr.tavanArka)/2]);
    for(const sx of [-1,1])
      EK("tavanIc", kutu(.34,.020,.14), [sx*s.W*.22, camTepe-.045, pr.camUst+.06], [.30,0,0]);
    KUTU("koyuP", .12,.055,.035, [0, camTepe-.075, pr.camUst+.14]);
    if(detay){
      KUTU("koyuP", .16,.028,.09, [0, s.roof-.105, pr.camUst+.34]);
      KUTU("led", .10,.012,.05, [0, s.roof-.120, pr.camUst+.34]);
    }
    /* --- torpido ve kokpit: her şey sürücünün göz noktasına göre --- */
    const tUst=pr.beltF-.045;                 // torpido üstü = ön cam dibi
    const dX=-s.W*.23;
    const gozY=tUst+.24, gozZ=kabinZ0+.84;    // sürücünün gözü
    const bolmeH=Math.max(.14, tUst-tabanY);
    // motor bölmesini kapatan ön duvar
    KUTU("ic", Math.min(s.W*.94, xCam(kabinZ0+.05)*1.80), bolmeH, .06, [0, (tabanY+tUst)/2, kabinZ0+.05]);
    // torpido gövdesi + üst kaplama
    // torpido camın iç genişliğini aşmasın: cam evi gövdeye katılınca uçları
    // A direğinin dibinden dışarı taşıyıp bej bir kutu gibi görünüyordu
    const torW=Math.min(s.W*.90, xCam(kabinZ0+.19)*1.86);
    KUTU("plastik", torW, bolmeH*.94, .32, [0, tUst-bolmeH*.47, kabinZ0+.18]);
    KUTU("plastik", torW*.98,.034,.32, [0, tUst+.010, kabinZ0+.19]);
    if(ahsapVar) KUTU("ahsap", s.W*.76,.06,.05, [0, tUst-.13, kabinZ0+.048]);
    // sürücüye dönük yüzeylerin eğimi
    const bak=(y,z)=>-Math.atan2(gozY-y, Math.max(.05,gozZ-z));
    // gösterge kümesi
    {
      const gz=kabinZ0+.30, gy=tUst+.045, a=bak(gy,gz);
      KUTU("plastik", .48,.030,.20, [dX, gy, gz], [a,0,0]);
      EK("gosterge", new THREE.PlaneGeometry(.43,.135), [dX, gy+.018, gz+.014], [a,0,0]);
      // kaşlık: göstergenin hemen üstünde. Eskiden 12 cm yukarıda havada
      // duruyor, dışarıdan ön camın arkasında siyah bir levha gibi görünüyordu.
      KUTU("plastik", .44,.030,.14, [dX, tUst+.090, gz-.030], [a-.16,0,0]);
    }
    // orta ekran + menfezler + düğme sırası
    {
      const ez=kabinZ0+.30, ey=tUst+.020, a=bak(ey,ez);
      KUTU("plastik", .31,.026,.19, [.06, ey, ez], [a,0,0]);
      EK("ekranIc", new THREE.PlaneGeometry(.27,.160), [.06, ey+.016, ez+.013], [a,0,0]);
      for(const dx of [-s.W*.39, s.W*.39])
        EK("menfez", new THREE.PlaneGeometry(.14,.056), [dx, tUst-.010, kabinZ0+.30], [bak(tUst-.010,kabinZ0+.30),0,0]);
      for(const dx of [-.17,.17])
        EK("menfez", new THREE.PlaneGeometry(.11,.050), [dx, tUst+.018, kabinZ0+.27], [bak(tUst+.018,kabinZ0+.27),0,0]);
      KUTU("plastik", s.W*.44,.085,.05, [.06, tUst-.13, kabinZ0+.295], [bak(tUst-.13,kabinZ0+.295),0,0]);
      for(const dx of [-.09,0,.09])
        KUTU("krom", .036,.015,.02, [dx+.06, tUst-.13, kabinZ0+.318]);
    }
    // direksiyon: sürücünün 30 cm önünde, 26 cm altında
    const dirX=dX, dirY=gozY-.30, dirZ=kabinZ0+.42, dirEg=-.42;
    EK("direksiyon", new THREE.TorusGeometry(.168,.024,8,22), [dirX,dirY,dirZ], [dirEg,0,0]);
    for(let i=0;i<3;i++){
      const a=Math.PI/2 + i*(Math.PI*2/3);
      EK("direksiyon", kutu(.028,.148,.022),
        [dirX+Math.cos(a)*.082, dirY+Math.sin(a)*.082*Math.cos(dirEg), dirZ+.010-Math.sin(a)*.082*Math.sin(dirEg)],
        [dirEg,0,-a+Math.PI/2]);
    }
    EK("plastik", new THREE.CylinderGeometry(.062,.062,.030,16), [dirX,dirY,dirZ+.014], [dirEg+Math.PI/2,0,0]);
    if(MAT.amblem) EK("amblem", new THREE.CircleGeometry(.036,12), [dirX,dirY,dirZ+.032], [dirEg,0,0]);
    KUTU("plastik", .055,.055,.20, [dirX, dirY-.050, dirZ-.10], [dirEg,0,0]);
    if(detay){
      for(const sx of [-1,1])
        EK("plastik", new THREE.CylinderGeometry(.011,.011,.14,7),
          [dirX+sx*.135, dirY-.03, dirZ+.02], [0,0,Math.PI/2+sx*.22]);
      for(const dx of [-.11,.01,.12])
        KUTU("krom", .052,.012,.085, [dirX+dx, tabanY+.085, kabinZ0+.26], [-.35,0,0]);
    }
    /* --- koltuklar --- */
    /* Koltuk: yuvarlatılmış yastıklar. Oturak öne doğru hafif kalkık, iki
       yanında yükselen yanaklar; sırt omuzda daralıyor ve yan yanakları
       içe dönük (sarıyor); baş dayama iki çubuk üstünde ayrı bir yastık.
       Eskiden altı düz kutuydu, iç mekân karton maket gibi görünüyordu. */
    const koltuk=(x,z,en)=>{
      const ot=-.07, sr=-.20;                                        // oturak / sırt eğimi
      EK("doseme", yastik(en*.62,.12,.50,.045), [x, tabanY+.12, z], [ot,0,0]);
      EK("doseme", yastik(en*.60,.50,.11,.045,.12), [x, tabanY+.45, z+.28], [sr,0,0]);
      for(const sx2 of [-1,1]){
        EK("dosemeYan", yastik(en*.17,.15,.48,.05), [x+sx2*en*.38, tabanY+.155, z], [ot,0,sx2*.18]);
        EK("dosemeYan", yastik(en*.16,.46,.15,.05,.10), [x+sx2*en*.37, tabanY+.43, z+.25], [sr,-sx2*.38,0]);
      }
      EK("dosemeYan", yastik(en*.46,.17,.09,.042), [x, tabanY+.83, z+.37], [sr*.6,0,0]);   // baş dayama
      for(const sx2 of [-1,1]) EK("plastik", silindir(.008,.008,.10,6), [x+sx2*en*.12, tabanY+.73, z+.355], [sr,0,0]);
      // dikiş hatları: sırtın ve oturağın orta panelini ayıran iki çizgi
      for(const sx2 of [-1,1]){
        EK("dikis", kutu(.007,.40,.010), [x+sx2*en*.20, tabanY+.45, z+.222], [sr,0,0]);
        EK("dikis", kutu(.007,.010,.42), [x+sx2*en*.20, tabanY+.183, z], [ot,0,0]);
      }
      if(detay){
        KUTU("plastik", en*.86,.030,.22, [x, tabanY+.035, z-.02]);        // ray/altlık
      }
      if(dosemeEski){
        const y=new THREE.Mesh(new THREE.PlaneGeometry(en*.7,.34),
          new THREE.MeshBasicMaterial({map:dokuDoseme(), transparent:true, opacity:.8}));
        y.position.set(x, tabanY+.47, z+.217); y.rotation.x=sr+Math.PI; g.add(y);
      }
    };
    const onKz=kabinZ0+.66, arkaKz=Math.min(kabinZ1-.44, onKz+.90);
    koltuk(-s.W*.23, onKz, .48); koltuk(s.W*.23, onKz, .48);
    if(arkaKz>onKz+.35){
      // arka kanepe: iki oturma yeri belli olsun diye iki yastık + orta dolgu
      EK("doseme", yastik(s.W*.70,.13,.46,.05), [0, tabanY+.12, arkaKz], [-.06,0,0]);
      for(const sx of [-1,1]){
        EK("doseme", yastik(s.W*.30,.48,.12,.05,.08), [sx*s.W*.19, tabanY+.42, arkaKz+.27], [-.14,0,0]);
        EK("dosemeYan", yastik(.24,.15,.09,.04), [sx*s.W*.20, tabanY+.75, arkaKz+.32], [-.10,0,0]);
        EK("dikis", kutu(.007,.38,.010), [sx*s.W*.19, tabanY+.42, arkaKz+.207], [-.14,0,0]);
      }
      EK("dosemeYan", yastik(s.W*.14,.44,.11,.04), [0, tabanY+.40, arkaKz+.28], [-.14,0,0]);
    }
    // emniyet kemerleri
    if(detay) for(const sx of [-1,1]){
      const bz=pr.camUst+(pr.tavanArka-pr.camUst)*(s.cls==="van"?.34:.42);
      EK("kemer", kutu(.048,.62,.008), [sx*(HW-.115), tabanY+.50, bz-.12], [0,0,sx*.16]);
    }
    // orta konsol + vites + el freni
    KUTU("ic", .22,.18,.54, [0, tabanY+.14, kabinZ0+.64]);
    KUTU("plastik", .21,.020,.20, [0, tabanY+.235, kabinZ0+.54]);
    KUTU("plastik", .045,.13,.045, [0, tabanY+.28, kabinZ0+.52]);
    EK("direksiyon", new THREE.SphereGeometry(.038,10,8), [0, tabanY+.36, kabinZ0+.52]);
    if(detay){
      EK("plastik", new THREE.CylinderGeometry(.016,.016,.20,8),
        [.055, tabanY+.26, kabinZ0+.76], [-.55,0,0]);
      for(const dx of [-.055,.055])    // bardaklık
        EK("plastik", new THREE.CylinderGeometry(.038,.038,.03,10), [dx, tabanY+.24, kabinZ0+.88]);
    }
    if(s.cls==="sedan") KUTU("ic", s.W*.78,.04,.34, [0, pr.beltR-.05, kabinZ1-.16]);
    if(torpidoCat){
      const ct=new THREE.Mesh(new THREE.PlaneGeometry(s.W*.60,.15),
        new THREE.MeshBasicMaterial({map:dokuCizik(), transparent:true, opacity:.9}));
      ct.position.set(0, tabanY+.44, kabinZ0+.11); ct.rotation.x=-1.2; g.add(ct);
    }
    // sürücü göz noktası (araca binmek için)
    g.userData.surucu=[dX, gozY, gozZ];

    /* ================= PORT BAGAJ ================= */
    if(imza.ray){
      for(const sx of [-1,1]){
        const cv=new THREE.CatmullRomCurve3([
          V(sx*HW*.34, s.roof+.055, pr.camUst+.28),
          V(sx*HW*.35, s.roof+.072, (pr.camUst+pr.tavanArka)/2),
          V(sx*HW*.34, s.roof+.055, pr.tavanArka-.16)]);
        EK("jant", new THREE.TubeGeometry(cv,7,.030,7,false));
        for(const zz of [pr.camUst+.30, pr.tavanArka-.18])
          EK("koyu", kutu(.055,.06,.075), [sx*HW*.34, s.roof+.025, zz]);
      }
    }

    /* ================= TEKERLEKLER ================= */
    const kolSay = car.model.cl?4:(car.model.seg==="lux"?5:(rr()<.5?5:6));
    // Klasik ve ticari araçlarda alaşım değil sac jant: yıldız kollu jant bu
    // araçlarda dönemine ve sınıfına uymuyordu.
    const sacJant = car.model.cl || (car.model.seg==="ticari" && rr()<.7);
    for(const sx of [-1,1]) for(const z of [onZ,arkaZ]){
      const donus=rr()*Math.PI*2;
      // Çamurluk kenarı: gövdenin O YÜKSEKLİKTEKİ yarı genişliği (azami değil).
      // Aksi halde lastik, kesitin en geniş yerine hizalanıp davlumbazın dışına taşar.
      const kemerLip=R*(1+KEMER_ORAN);
      let dudak=0;
      for(let k=0;k<=6;k++) dudak=Math.max(dudak, xAt(z, kemerLip+.012+k*.035));
      const disYuz=Math.max(dudak-.012, genislik(z)*.86);
      // Lastik çamurluğun 1–2 cm içinde: dış yüzü tam hizada olunca gövdeden
      // dışarı taşmış, sonradan takılmış gibi duruyordu.
      const merkez=disYuz-R*.31;
      const lastikDis=merkez+R*.26;             // lastiğin dış yanağı — her şey buna göre
      const x=sx*merkez;
      // davlumbaz kovuğu: dışta çamurluk dudağının hemen içinden lastiğin iç yüzünün ötesine
      const kovDis=disYuz-.006, kovIc=merkez-R*.42, kovDerin=kovDis-kovIc;
      // kovuk kemerin biraz içinde: kemerin alt yüzü (boya rengi) aşağıdan bakınca açık bir şerit gibi görünüyordu
      EK("kovuk", kovukGeo(R*KEMER_ORAN*.975, kovDerin), [sx*(kovIc+kovDerin/2), R, z], [0, sx>0?0:Math.PI, 0]);
      // temas gölgesi: lastik zemine basıyor
      EK("temas", new THREE.PlaneGeometry(R*.95, R*1.55), [x, .004, z], [-Math.PI/2,0,0]);
      EK("lastik", lastikGeo(R), [x,R,z], [donus,0,0]);
      EK("yanak",  yanakGeo(R, !!car.model.cl), [x,R,z], [donus,0,0]);
      /* Jant geometrisi +x (sağ) yüzüne göre kurulu. Sol tekerlekte aynı
         geometri yalnız yer değiştiriyordu: dışa bakan yüz içe dönüyor,
         araç sol arkadan görülünce jantın arka yüzü (üç kalın kol, kara
         disk) görünüyordu. Solda y ekseninde yarım tur döndürülüyor. */
      const yon = sx>0 ? 0 : Math.PI;
      EK("jantIc", jantIcGeo(R,sx), [sx*(lastikDis-R*.42),R,z], [donus,yon,0]);
      if(sacJant){
        // klasik ve ticari: sac jant + küçük göbek kapağı
        /* Jant kapağı eskiden düz bir disk + tek halkaydı; plastik tabak gibi
           duruyordu. Klasikte tam kapak: dış bilezik, çevresinde havalandırma
           yarıkları, kubbe göbek. Ticaride kapaksız sac jant: delikli disk ve
           küçük göbek kapağı. */
        const dx=lastikDis;
        EK("sacJant", new THREE.CylinderGeometry(R*.66,R*.66,R*.05,32), [sx*(dx-R*.30),R,z], [0,0,Math.PI/2]);
        if(car.model.cl){
          EK("jant", new THREE.TorusGeometry(R*.60,R*.05,8,36), [sx*(dx-R*.26),R,z], [0,Math.PI/2,0]);
          EK("jant", new THREE.CylinderGeometry(R*.54,R*.58,R*.05,32), [sx*(dx-R*.255),R,z], [0,0,Math.PI/2]);
          for(let i=0;i<10;i++){
            const a=donus+2*Math.PI*i/10;
            EK("jantIc", kutu(R*.02,R*.13,R*.045), [sx*(dx-R*.225), R+Math.cos(a)*R*.43, z+Math.sin(a)*R*.43], [a,0,0]);
          }
          EK("jant", new THREE.SphereGeometry(R*.25,20,10,0,Math.PI*2,0,Math.PI/2), [sx*(dx-R*.24),R,z], [0,0,-sx*Math.PI/2], [1,.45,1]);
        }else{
          EK("sacJant", new THREE.TorusGeometry(R*.50,R*.035,6,32), [sx*(dx-R*.27),R,z], [0,Math.PI/2,0]);
          for(let i=0;i<6;i++){
            const a=donus+2*Math.PI*i/6;
            EK("jantIc", new THREE.CircleGeometry(R*.055,12), [sx*(dx-R*.27+.002), R+Math.cos(a)*R*.38, z+Math.sin(a)*R*.38], [0,sx*Math.PI/2,0]);
          }
          EK("jant", new THREE.CylinderGeometry(R*.20,R*.24,R*.09,24), [sx*(dx-R*.25),R,z], [0,0,Math.PI/2]);
        }
      }else
      EK("jant",   jantGeo(R,kolSay,sx), [sx*(lastikDis-R*.27),R,z], [donus,yon,0]);
      EK("disk",   diskGeo(R),   [sx*(lastikDis-R*.62),R,z]);
      // sac jantın arkasından kaliper taşıp jant yüzüne gri bir kutu gibi düşüyordu; sac jantlı araçta kampana fren
      if(!sacJant) EK("kaliper",kutu(R*.11,R*.36,R*.17), [sx*(lastikDis-R*.72), R+R*.36, z+(z<0?-R*.30:R*.30)]);
      if(MAT.amblem) EK("amblem", new THREE.CircleGeometry(R*.165,16),
        [sx*(lastikDis-R*.045), R, z], [0, sx*Math.PI/2, 0]);
      if(imza.kaplama){
        // Davlumbaz kaplaması: boru değil, çamurluğu saran yassı plastik bant.
        const bant=new THREE.RingGeometry(R*(KEMER_ORAN-.02), R*(KEMER_ORAN+.23), 22, 1, -0.22, Math.PI+0.44);
        EK("koyu", bant, [sx*(disYuz+.008), R, z], [0, sx*Math.PI/2, 0]);
        // dış dudak: bandın kenarında ince bir kabartı
        const lip=new THREE.TorusGeometry(R*(KEMER_ORAN+.21), .016, 5, 22, Math.PI+0.30);
        EK("koyu", lip, [sx*(disYuz+.002), R, z], [0, sx*Math.PI/2, -0.15]);
      }
    }
    // alt gövde/marşpiyel: kesit eşik hizasında daha dar olduğu için
    // tam genişlikte kutu yanlardan taşıyordu.
    KUTU("koyu", xAt((onZ+arkaZ)/2, pr.sill+.02)*1.86,.13,(arkaZ-onZ)*.80,
      [0, pr.sill-.02, (onZ+arkaZ)/2]);

    /* ================= ÖN YÜZ ================= */
    const zF=-yarim, burunZ=zF, farY=s.hood-.17;
    // gövdenin ilgili YÜKSEKLİKTEKİ yarı genişliği — parçalar havada kalmasın
    const hwOn = xAt(zF+.055, farY);                       // far/ızgara hizası
    const hwAlt= xAt(zF+.055, pr.sill+.13);                // tampon/sis/plaka hizası
    const kromKey = imza.chrome?"krom":boyaKey;

    if(imza.yuvarlakFar){
      for(const sx of [-1,1]){
        const fx=sx*(hwOn-.20);
        onPanel("far", fx, farY, .215,.215, .014, 4,4);
        EK(kromKey, new THREE.TorusGeometry(.122,.020,6,18), [fx, farY, zOn(fx,farY)-.012]);
        EK("lens", new THREE.SphereGeometry(.115,12,8,0,Math.PI*2,0,Math.PI/2),
          [fx, farY, zOn(fx,farY)-.012], [Math.PI/2,0,0], [1,.30,1]);
      }
    }else{
      // Far: biçimi dokunun saydamlığından gelen tek panel. Eskiden koyu kutu
      // + iki küre + ayrı LED şeritleri üst üste biniyordu.
      /* Far ünitesi: kaput çizgisinin hemen altında, köşeye kadar. Eskiden
         kaputun 17 cm altında, 8,5 cm boyunda bir şeritti; ön yüz boş bir
         duvar gibi kalıyor, araç oyuncak gibi görünüyordu. Üç katman:
         koyu çerçeve (gövdeye gömülü görünsün), iç (reflektör dokusu),
         parlak lens camı (ortamı yansıtır). */
      const FAR_OLCU={dilim:[.48,.20], bumerang:[.52,.19], L:[.48,.19], ince:[.54,.13]};
      const [fw0,fh]=FAR_OLCU[imza.far]||FAR_OLCU.dilim;
      // Üst kenar kaputun kavisine binmesin: orada yüzey yukarı bakıyor, çerçeve
      // kaputun üstüne kara bir kaş gibi yayılıyordu. Üst kenar kaputtan 8 cm aşağıda.
      let fy=Math.min(farY+.03, s.hood-fh/2-.08);
      /* Burnu eğik araçlarda (panelvan, bazı hatch) ön yüz o yükseklikte hâlâ
         geriye yatıyor; panel yüzeye yapıştığı için kaputa doğru uzayıp kaş gibi
         görünüyordu. Üst ve alt kenar arasındaki derinlik farkı 5 cm'yi
         aşıyorsa far, yüzeyin dikleştiği yere kadar iner. */
      /* Dış köşe de ölçülür: kesitin omzu orada üst kenarı aşağı çekiyor;
         yalnız ortaya bakılınca farın dış üst köşesi kaputun yanına tırmanıp
         yukarıdan kara bir üçgen gibi görünüyordu. */
      {
        const ox=hwOn*.55, ox2=hwOn-.05;
        for(let k=0;k<8;k++){
          const egim=Math.max(zOn(ox, fy+fh/2)-zOn(ox, fy-fh/2), zOn(ox2, fy+fh/2)-zOn(ox2, fy-fh/2)-.02);
          if(egim<=.05 || fy-fh/2<=pr.sill+.30) break;
          fy-=.025;
        }
      }
      for(const sx of [-1,1]){
        const fw=Math.min(fw0, hwOn*.54), fx=sx*(hwOn-fw/2-.02);
        onPanel("koyuP", fx, fy, fw+.030, fh+.026, .006, 6,3);
        onPanel(sx>0?"far":"farA", fx, fy, fw, fh, .012, 6,3);
        onPanel("lens", fx, fy, fw*.99, fh*.96, .022, 6,3);
      }
      // kaput derzi ve tampon ayrımı: ön yüz tek parça bir duvar gibi durmasın
      onPanel("cizgi", 0, s.hood-.055, hwOn*1.80, .006, .004, 14,1);
    }
    // ızgara: tek panel, biçimi dokudan
    const izgaraY=farY-.045;
    const IZG={trapez:[.80,.27], petek:[.82,.24], cubuk:[.80,.22], kapali:[.70,.11],
               yarik:[.96,.12], bobrek:[.62,.27], yildiz:[.78,.30], bar:[.88,.24]};
    const [gwK,gh]=IZG[imza.izgaraTip]||IZG.trapez;
    const gY=imza.izgaraTip==="yarik"?farY-.02:izgaraY;
    onPanel("izgara", 0, gY, hwOn*2*gwK*(imza.yuvarlakFar?.62:.55), gh, .012, 9,4);
    if(imza.izgaraTip==="yarik"||imza.izgaraTip==="kapali")   // alt hava girişi daha büyük
      onPanel("petek", 0, pr.sill+.20, hwAlt*1.20,.13, .010, 6,2);
    if(MAT.amblem){
      let zm=1e9;
      for(const dx of [-.075,0,.075]) for(const dy of [-.075,0,.075]) zm=Math.min(zm, zOn(dx, gY+.01+dy));
      EK("amblem", new THREE.CircleGeometry(.075,24), [0, gY+.01, Math.min(zm, zOn(0,gY+.01))-.026], [0,Math.PI,0]);
    }
    // tampon / hava girişi
    if(imza.tampon){
      for(const z of [zF-.030, yarim+.030]){
        const w=(z<0?xAt(zF+.06, pr.sill+.17):xAt(yarim-.06, pr.sill+.17))*1.96;
        KUTU(kromKey, w,.105,.070, [0, pr.sill+.17, z]);
        for(const sx of [-1,1]) KUTU(kromKey, .045,.13,.045, [sx*w*.30, pr.sill+.24, z]);
      }
    }else{
      /* Ön tampon. Eskiden her modelde aynı: plakanın altında tek bir petek
         şerit ve iki sis farı; plakanın iki yanı boş boya duvarıydı. Gerçek
         tamponda hava girişleri yüzün yarısıdır ve markayı ayırt ettirir.
         Model adından sabit bir tip seçiliyor (her araç hep aynı yüz):
           uclu  — orta alt giriş + iki köşe girişi, sis farı köşede
           genis — plakanın altında tek geniş trapez ağız, sis uçlarda
           spor  — büyük trapez ağız + köşelerde dikey hava perdesi yarıkları
           arazi — koyu plastik alt bant + gümüş karter koruma (SUV)
           ticari— boyasız koyu plastik alt tampon, kare sis
         Her girişin arkasında biraz daha büyük koyu bir çerçeve var: tek
         katman düz bir çıkartma gibi duruyordu, iki katman derinlik veriyor. */
      const tr=tohum(_tohumAd(car.model.n+"|tampon"));
      const seg=car.model.seg;
      const tTip = seg==="ticari" ? "ticari"
                 : (seg==="suv" || imza.kaplama) ? "arazi"
                 : ["uclu","uclu","genis","spor"][Math.floor(tr()*4)] ;
      const sis=(gx, gy, kare)=>{
        // sis farı: koyu yuva içinde küçük lens. Eskiden parlak beyaz bir disk
        // tampona yapıştırılmış düğme gibi duruyordu.
        if(kare) onPanel("koyuP", gx, gy, .13,.075, .008, 2,1);
        else EK("koyuP", new THREE.CylinderGeometry(.058,.058,.024,14),
          [gx, gy, zOn(gx,gy)-.006], [Math.PI/2,0,0], [1.35,1,.80]);
        EK("sisLens", new THREE.CircleGeometry(.030,14), [gx, gy, zOn(gx,gy)-.019],[0,Math.PI,0], [1.25,.85,1]);
      };
      // ağız: çerçeve + petek, alt kenar üst kenardan geniş (trapez)
      const agiz=(xm, ym, wUst, wAlt, h)=>{
        onTrapez("koyuP", xm, ym, wUst+.035, wAlt+.035, h+.030, .006);
        onTrapez("petek", xm, ym, wUst, wAlt, h, .011);
      };
      const y0=pr.sill;
      if(tTip==="uclu"){
        agiz(0, y0+.10, hwAlt*.80, hwAlt*.92, .085);
        for(const sx of [-1,1]){
          const gx=sx*(hwAlt-.15);
          agiz(gx, y0+.165, .19, .22, .15);
          sis(gx, y0+.165);
        }
      }else if(tTip==="genis"){
        agiz(0, y0+.095, hwAlt*1.25, hwAlt*1.48, .11);
        for(const sx of [-1,1]) sis(sx*(hwAlt-.12), y0+.205);
      }else if(tTip==="spor"){
        agiz(0, y0+.115, hwAlt*1.05, hwAlt*1.30, .17);
        for(const sx of [-1,1]){
          const gx=sx*(hwAlt-.07);
          onTrapez("koyuP", gx, y0+.17, .05, .075, .21, .008);       // hava perdesi
        }
        // spor ağızda plaka ağzın üstünde durur, ince bir dudak altta
        onPanel("koyu", 0, y0+.022, hwAlt*1.70,.03, .016, 7,1);
      }else if(tTip==="arazi"){
        // burnun altı eşikten 8,5 cm yukarıda bitiyor; karter koruma onun üstünde
        onPanel("koyu", 0, y0+.155, hwAlt*1.90,.16, .010, 9,2);
        agiz(0, y0+.185, hwAlt*.95, hwAlt*1.05, .06);
        onTrapez("jant", 0, y0+.112, hwAlt*.95, hwAlt*.80, .045, .018);  // karter koruma
        for(const sx of [-1,1]) sis(sx*(hwAlt-.13), y0+.17);
      }else{
        // burnun altı eşikten 8,5 cm yukarıda bitiyor; bant onun üstünde
        onPanel("koyu", 0, y0+.175, hwAlt*1.94,.18, .010, 9,2);
        agiz(0, y0+.135, hwAlt*1.10, hwAlt*1.16, .06);
        for(const sx of [-1,1]) sis(sx*(hwAlt-.14), y0+.20, true);
      }
      if(tTip!=="spor" && tTip!=="ticari") onPanel("koyu", 0, y0+.022, hwAlt*1.55,.04, .014, 7,1);
      arkaPanel("koyu", 0, pr.sill+.035, xAt(yarim-.06, pr.sill+.13)*1.70,.05, .014, 7,1);
      // arka difüzör: tampon altında koyu, ince kanatçıklı şerit
      if(seg==="lux"||tTip==="spor") for(let i=-2;i<=2;i++)
        arkaPanel("koyuP", i*.11, pr.sill+.07, .018,.06, .020, 1,1);
    }
    EK("plaka", new THREE.PlaneGeometry(.30,.150), [0, pr.sill+.20, zOn(0,pr.sill+.20)-.020], [0,Math.PI,0]);
    if(!imza.tampon){
      onPanel("cizgi", 0, pr.sill+.33, hwAlt*1.86, .006, .004, 14,1);
      arkaPanel("cizgi", 0, pr.sill+.33, xAt(yarim-.06, pr.sill+.33)*1.86, .006, .004, 14,1);
    }

    /* ================= ARKA YÜZ ================= */
    const arkaYuz=yarim-.02, stopY=pr.kuyruk-.14;
    const hwArka=xAt(arkaYuz-.05, stopY);
    for(const sx of [-1,1]){
      const tx=sx*(hwArka-.22);
      arkaPanel("koyuP", tx, stopY, .46,.21, .006, 5,3);
      arkaPanel("stop",  tx, stopY, .42,.175, .016, 5,3);
      arkaPanel("lensK", tx, stopY, .43,.185, .028, 5,3);
      arkaPanel("geri",  tx-sx*.115, stopY-.050, .09,.030, .034, 2,1);
    }
    if(imza.led && !car.model.cl)
      arkaPanel("stop", 0, stopY+.005, hwArka*1.35,.030, .016, 8,1);
    // krom tamponlu araçta plaka tamponun ÜSTÜNDE: eskiden tampon plakanın önünü kapatıyordu
    const plakaY = imza.tampon ? pr.sill+.30 : pr.sill+.20;
    EK("plaka", new THREE.PlaneGeometry(.30,.150), [0, plakaY, zArka(0,plakaY)+.020]);
    /* Arka amblem eskiden stop hizasının 15 cm üstündeydi; bu, arka yüzün üst
       kenarını (pr.kuyruk) aşıyor, düz disk bagaj kapağının kavisine gömülüp
       yarım ay gibi kesik görünüyordu. Artık arka yüzün dik bölgesinde, stop
       lambalarının arasında; yüzeyin eğimine yatırılıyor ve en dışa çıkan
       noktanın önüne konuyor. */
    if(MAT.amblem){
      const ar=.052, ay=Math.min(stopY+.07, pr.kuyruk-ar-.035);
      let zm=-1e9;
      for(const dx of [-ar,0,ar]) for(const dy of [-ar,0,ar]) zm=Math.max(zm, zArka(dx, ay+dy));
      const egimA=Math.atan2(zArka(0,ay+.04)-zArka(0,ay-.04), .08);
      EK("koyuP", new THREE.CylinderGeometry(ar*1.12,ar*1.12,.008,24), [0, ay, zm+.012], [Math.PI/2-egimA,0,0]);
      EK("amblem", new THREE.CircleGeometry(ar,24), [0, ay, zm+.0175], [-egimA,0,0]);
    }
    if(!car.model.cl){
      /* egzoz ucu tamponun altına gizli, yalnız 3–4 cm görünür; eskiden 12 cm
         dışarı taşıyor, arkadan bakınca araca sonradan takılmış bir çubuk gibiydi */
      const ex=[hwArka*.55]; if(car.model.seg==="lux"||car.model.seg==="suv") ex.push(-hwArka*.55);
      for(const x of ex){
        EK("krom", silindir(.036,.040,.12,12), [x, pr.sill+.035, arkaYuz-.025], [Math.PI/2,0,0]);
        EK("koyuP", new THREE.CircleGeometry(.028,12), [x, pr.sill+.035, arkaYuz+.036]);
      }
    }
    // yakıt kapağı
    {
      const zf=arkaZ-.30, yf=Math.min(pr.beltF,pr.beltR)-.24, sxf=rr()<.5?-1:1;
      EK(boyaKey, new THREE.CylinderGeometry(.075,.075,.012,14),
        [sxf*(xAt(zf,yf)+.008), yf, zf], [0,0,sxf*Math.PI/2]);
    }

    /* ================= YAN DETAY ================= */
    for(const sx of [-1,1]){
      /* Ayna kapı yüzeyine oturuyor: eskiden en geniş yarı genişliğin (HW)
         dışına konuyordu, kuşak hizasında gövde daha dar olduğu için ayna
         havada asılı bir tuğla gibi duruyordu. Kafa da artık yuvarlatılmış. */
      const az=pr.kaputZ+.17, ay=pr.beltF+.05, ax=xAt(az, pr.beltF-.03);
      KUTU("koyuP", .10,.028,.045, [sx*(ax+.04), ay-.02, az]);
      EK(boyaKey, new THREE.SphereGeometry(.1,12,8), [sx*(ax+.12), ay, az+.01], [0,sx*.15,0], [.55,.48,.80]);
      EK("koyuP", new THREE.CircleGeometry(.05,14), [sx*(ax+.125), ay, az+.087], [0,0,0], [1.05,.85,1]);
      KUTU("sinyal", .050,.010,.04, [sx*(ax+.135), ay-.040, az+.02]);
      const kapiZ=[onZ+.62, (onZ+arkaZ)/2+.18].filter(z=>z<pr.camAlt-.20);
      for(const kz of kapiZ){
        const yk=Math.min(pr.beltF,pr.beltR)-.13;
        EK(imza.chrome>=.7?"krom":boyaKey, kutu(.030,.042,.135), [sx*(xAt(kz+.30,yk)+.016), yk, kz+.30]);
        KUTU("koyuP", .014,.030,.10, [sx*(xAt(kz+.30,yk)+.006), yk-.008, kz+.30]);
      }
      if(imza.chrome>=.5){
        const cv=new THREE.CatmullRomCurve3([
          V(sx*(genislik(onZ)+.014), Math.min(pr.beltF,pr.beltR)-.075, onZ+.05),
          V(sx*(genislik((onZ+arkaZ)/2)+.016), Math.min(pr.beltF,pr.beltR)-.070, (onZ+arkaZ)/2),
          V(sx*(genislik(arkaZ)+.014), Math.min(pr.beltF,pr.beltR)-.075, arkaZ)]);
        EK("krom", new THREE.TubeGeometry(cv,10,.014,6,false));
      }
    }
    // panel ayrım hatları (kaput, bagaj, kapılar) — yüzeyi izleyen ince koyu şeritler
    const hatSerit=(z, y0, y1, kal)=>{
      const gg=yuzey(1,4,(u,v)=>{
        const yy=y0+(y1-y0)*v;
        return [0, yy, z];
      });
      return gg;
    };
    for(const sx of [-1,1]){
      const hatlar=[onZ+.52,(onZ+arkaZ)/2+.10,arkaZ-.30].filter(z=>z<pr.camAlt-.05);
      for(const kz of hatlar){
        const y0=pr.sill+.06, y1=Math.min(pr.beltF,pr.beltR)-.02;
        EK("cizgi", yuzey(1,4,(u,v)=>{
          const yy=y0+(y1-y0)*v;
          return [sx*(xAt(kz,yy)+.010), yy, kz-.006+.012*u];
        }));
      }
    }
    {  // kaput ve bagaj kenar çizgileri
      const kaputHat=(z)=>{
        EK("cizgi", yuzey(6,1,(u,v)=>{
          const xx=(-1+2*u)*genislik(z)*.86;
          return [xx, ustY(z,xx)+.004, z-.006+.012*v];
        }));
      };
      kaputHat(pr.kaputZ-.02);
      if(s.cls==="sedan") kaputHat(pr.camAlt+.03);
      /* Kaputun yan derzleri (çamurlukla birleştiği yer). Yoktu: kaput
         çamurluklarla tek bir kalıp gibi duruyor, üstten bakınca ön kısım
         "kapak" değil yekpare bir tümsek okunuyordu. */
      const kz0=-yarim+L*.03, kz1=pr.kaputZ-.03;
      if(kz1-kz0>.25) for(const sx of [-1,1]){
        EK("cizgi", yuzey(1,10,(u,v)=>{
          const zz=kz0+(kz1-kz0)*v;
          const xx=sx*(genislik(zz)*(.80+.03*v)+(u-.5)*.010);
          return [xx, ustY(zz,xx)+.004, zz];
        }));
      }
    }

    /* ================= HASAR KATMANI ================= */
    const yanUst=Math.min(pr.beltF,pr.beltR), yanY=(yanUst+pr.sill)/2+.05;
    const yanH=Math.max(.22, yanUst-pr.sill-.08);
    /* GÖZLE EKSPERTİZ ipuçları: ekspertizsiz araçta bakan gözün yakalayabileceği
       her iz bir nokta olarak kaydediliyor (yerel koordinat + yarıçap). Gizli
       kaporta kusurları da çiziliyor ama SİLİK — dikkatli bakan görür. */
    const ipucu=[];
    const gizliKusur=k=>!car.inspected && (car.faults||[]).find(f=>f.k===k && !f.fixed && !f.visible);

    /* Yan yüzeye yapışan yama (hasar, boyalı panel, pas...).
       Yamanın bir satırı o z'deki kesitin dışına (davlumbaz boşluğu, kuşak üstü)
       düşerse xAt kenarda sıfıra yaklaşır ve yama gövdeden kopup havada asılı
       görünür. Bu yüzden her sütunda y, o kesitin alt/üst hattına kırpılır:
       yama çamurluğun etrafından dolanır, boşlukta durmaz. */
    const yanKaplama=(sx, z, w, h, mat, dy)=>{
      const y0=yanY+(dy||0)-h/2, y1=y0+h, z0=z-w/2, z1=z+w/2;
      const geo=yuzey(9,6,(u,v)=>{
        const zz=z0+(z1-z0)*u;
        const yT=ustHat(zz)-.030, yB=altHat(zz)+.050;
        let yy=y0+(y1-y0)*v;
        if(yT>yB) yy=Math.min(yT, Math.max(yB, yy)); else yy=(yT+yB)/2;
        return [sx*(xAt(zz,yy)+.009), yy, zz];
      });
      const m=new THREE.Mesh(geo, mat); m.material.side=THREE.DoubleSide;
      m.renderOrder=2;
      g.add(m); return m;
    };
    const ustKaplama=(z, w, d, y, mat)=>{
      const geo=yuzey(7,5,(u,v)=>{
        const zz=z-d/2+d*u;
        const hw=genislik(zz);
        // x, o z'deki yarı genişliği aşarsa yama kaputun yanından taşar
        const xx=Math.max(-hw*.97, Math.min(hw*.97, -w/2+w*v));
        return [xx, ustY(zz,xx)+.006, zz];
      });
      const m=new THREE.Mesh(geo, mat); m.material.side=THREE.DoubleSide;
      m.renderOrder=2;
      g.add(m); return m;
    };
    const boyaliSay=Math.min(6, car.boyali||0), degisenSay=Math.min(5, car.degisen||0);
    if(boyaliSay+degisenSay>0){
      const hsl={}; c0.getHSL(hsl);
      const yon = hsl.l>.5 ? -1 : 1;
      /* Fark eskiden .130'du: boyalı kapı gövdeden başka bir araba gibi
         duruyordu (yeşil gövdede gri kapı). Gerçekte boyalı panel ancak
         ışığa göre fark edilen bir ton kaymasıdır; ekspertiz onu belirginleştirir. */
      const fark = (car.inspected ? .060 : .028)*yon;
      const sinir=[-yarim+L*.07, onZ+.52, (onZ+arkaZ)/2+.10, arkaZ-.30,
                   Math.min(pr.camAlt, yarim-L*.05)];
      const secim=[];
      for(const sx of [-1,1]) for(let i=0;i<sinir.length-1;i++){
        const a=sinir[i], b=sinir[i+1];
        if(b-a>.35) secim.push({sx, z:(a+b)/2, uz:b-a-.05});
      }
      secim.push({ust:"kaput"}, {ust:"bagaj"});
      for(let i=secim.length-1;i>0;i--){ const j=Math.floor(rr()*(i+1)); [secim[i],secim[j]]=[secim[j],secim[i]]; }
      const n=Math.min(secim.length, boyaliSay+degisenSay);
      for(let i=0;i<n;i++){
        const agir=i<degisenSay;
        const c2=c0.clone().offsetHSL(agir?.006:.003, agir?-.025:-.012, agir?fark*1.30:fark);
        const pm=matBoya(c2.getHex(), 60);
        const it=secim[i];
        if(it.ust==="kaput") ustKaplama((pr.kaputZ+(-yarim+L*.09))/2, s.W*.66,
          Math.max(.3,(pr.kaputZ-(-yarim+L*.09))*.86), s.hood, pm);
        else if(it.ust==="bagaj"){
          if(s.cls==="sedan") ustKaplama((pr.camAlt+pr.bagajZ)/2, s.W*.64,
            Math.max(.25,pr.bagajZ-pr.camAlt), pr.beltR, pm);
          else ustKaplama((pr.camUst+pr.tavanArka)/2, s.W*.72,
            Math.max(.3,(pr.tavanArka-pr.camUst)*.75), s.roof+.02, pm);
        }
        else yanKaplama(it.sx, it.z, it.uz||.78, yanH+.10, pm, .03);
        if(!car.inspected){
          const ip = it.ust==="kaput" ? [0, s.hood+.02, (pr.kaputZ+(-yarim+L*.09))/2]
                   : it.ust==="bagaj" ? [0, (s.cls==="sedan"?pr.beltR:s.roof)+.02, s.cls==="sedan"?(pr.camAlt+pr.bagajZ)/2:(pr.camUst+pr.tavanArka)/2]
                   : [it.sx*xAt(it.z,yanY), yanY, it.z];
          ipucu.push({k:agir?"degisen":"boyali", poz:ip, r:it.ust?.55:Math.max(.42,(it.uz||.78)*.6)});
        }
        if(agir && !it.ust){
          const gm=new THREE.MeshBasicMaterial({color:0x05070A, transparent:true, opacity:.22, side:THREE.DoubleSide});
          const zk=it.z+(it.uz||.78)/2;
          const lg=yuzey(1,6,(u,v)=>{
            const yT=ustHat(zk)-.030, yB=altHat(zk)+.050;
            let yy=yanY+.03-(yanH+.10)/2+(yanH+.10)*v;
            if(yT>yB) yy=Math.min(yT, Math.max(yB, yy)); else yy=(yT+yB)/2;
            return [it.sx*(xAt(zk,yy)+.016), yy, zk-.011+.022*u];
          });
          g.add(new THREE.Mesh(lg, gm));
        }
      }
    }
    const pasGizli=gizliKusur("altsac");
    if(pasVar||pasGizli){
      const pm=new THREE.MeshBasicMaterial({map:dokuPas(), transparent:true, opacity:pasVar?1:.45});
      if(!car.inspected) for(const sx of [-1,1]) ipucu.push({k:"altsac", poz:[sx*xAt((onZ+arkaZ)/2,pr.sill+.08), pr.sill+.08, (onZ+arkaZ)/2], r:(arkaZ-onZ)*.45});
      for(const sx of [-1,1]){
        const say=1+Math.floor(rr()*2);
        for(let i=0;i<say;i++){
          const z=onZ+.4+rr()*Math.max(.4,(arkaZ-onZ)-.6);
          yanKaplama(sx, z, .52+rr()*.36, .26, pm, -(yanH/2)+.01);
        }
      }
      // arka tampon üstü pas: düz düzlem kuyruktan kopuyordu, yüzeye oturtuldu
      {
        const w=s.W*.46, h=.20, ym=pr.sill+.06;
        const ag=yuzey(7,3,(u,v)=>{
          const xx=-w/2+w*u, yy=ym-h/2+h*v;
          return [xx, yy, zArka(xx,yy)+.010];
        });
        const am=new THREE.Mesh(ag, pm); am.material.side=THREE.DoubleSide;
        am.renderOrder=2; g.add(am);
      }
    }
    const kapiGizli=gizliKusur("kapiboya"), camGizli=gizliKusur("camurluk");
    if(kapiBoya||kapiGizli){
      const cm=new THREE.MeshBasicMaterial({map:dokuCizik(), transparent:true, opacity:kapiBoya?1:.40});
      const sx=rr()<.5?-1:1;
      yanKaplama(sx, onZ+.78, .80, yanH*.75, cm);
      yanKaplama(sx, onZ+1.36, .52, yanH*.55, cm, -.06);
      if(!car.inspected) ipucu.push({k:"kapiboya", poz:[sx*xAt(onZ+1.0,yanY), yanY, onZ+1.0], r:.60});
    }
    if(camurluk||camGizli){
      const gm=new THREE.MeshBasicMaterial({map:dokuGocuk(), transparent:true, opacity:camurluk?1:.55});
      const sx=rr()<.5?-1:1;
      yanKaplama(sx, onZ-.18, .66, Math.min(.58,yanH*1.0), gm, .04);
      if(!car.inspected) ipucu.push({k:"camurluk", poz:[sx*xAt(onZ-.18,yanY+.04), yanY+.04, onZ-.18], r:.48});
    }
    if(kompleBoya){
      const mm=new THREE.MeshBasicMaterial({map:dokuMat(), transparent:true, opacity:.9});
      ustKaplama((pr.kaputZ+(-yarim+L*.09))/2, s.W*.68,
        Math.max(.3,(pr.kaputZ-(-yarim+L*.09))*.84), s.hood, mm);
      ustKaplama((pr.camUst+pr.tavanArka)/2, s.W*.80,
        Math.max(.3,(pr.tavanArka-pr.camUst)*.82), s.roof+.03, mm);
      for(const sx of [-1,1]) yanKaplama(sx, (onZ+arkaZ)/2, (arkaZ-onZ)*.86, yanH*.9, mm);
    }
    const yagGizli=gizliKusur("yagkacak");
    if(yagKacak||yagGizli){
      const lm=new THREE.Mesh(new THREE.PlaneGeometry(1.15,.85),
        new THREE.MeshBasicMaterial({map:dokuLeke(), transparent:true, opacity:yagKacak?.85:.45}));
      lm.rotation.x=-Math.PI/2; lm.position.set(0,.035,onZ-.15); g.add(lm);
      lm.name="ipucuZemin";
      if(!car.inspected) ipucu.push({k:"yagkacak", poz:[0,.05,onZ-.15], r:.75});
    }
    if(kaportaAsn>26 && !kompleBoya){
      const cm=new THREE.MeshBasicMaterial({map:dokuCizik(), transparent:true,
        opacity:Math.min(.7,(kaportaAsn-26)/30)});
      for(const sx of [-1,1]) yanKaplama(sx, arkaZ-.55, .66, yanH*.5, cm, -.04);
    }

    /* ---- kovaları tek çizime indir ---- */
    for(const [k, parts] of kova){
      const mat=MAT[k]; if(!mat) continue;
      const m=new THREE.Mesh(birlestir(parts), mat); m.name=k; g.add(m);
    }

    // yumuşak temas gölgesi
    const sh=new THREE.Mesh(new THREE.PlaneGeometry(L*.96, s.W*1.30), MAT.golge);
    sh.rotation.x=-Math.PI/2; sh.position.y=.010; g.add(sh);

    g.userData.size={l:L,w:s.W,h:s.roof};
    g.userData.ipucu=ipucu;
    for(const q of ipucu) if((car.goz||[]).includes(q.k)) g.add(gozIsaretObj(q.poz));
    g.userData.xAt=xAt; g.userData.genislik=genislik; g.userData.spec=s; g.userData.pr=pr; g.userData.zOn=zOn; g.userData.zArka=zArka; g.userData.ustHat=gGeo.userData.ustHat; g.userData.altHat=gGeo.userData.altHat;
    return g;
  }

  /* ---------- kapalı otopark iskeleti ---------- */
  const TAVAN_Y=3.36;

  function kolon(x, z, kod){
    const g=new THREE.Group();
    const bet=new THREE.MeshLambertMaterial({color:0x3A4147});
    const g1=new THREE.Mesh(new THREE.BoxGeometry(.46,TAVAN_Y,.46), bet);
    g1.position.y=TAVAN_Y/2; g.add(g1);
    // sarı-siyah tehlike bandı
    const bant=new THREE.Mesh(new THREE.BoxGeometry(.48,.42,.48),
      new THREE.MeshLambertMaterial({map:bantTex()}));
    bant.position.y=.62; g.add(bant);
    // başlık
    const bas=new THREE.Mesh(new THREE.BoxGeometry(.62,.18,.62), new THREE.MeshLambertMaterial({color:0x323940}));
    bas.position.y=TAVAN_Y-.12; g.add(bas);
    if(kod){
      for(const sz of [1,-1]){
        const k=new THREE.Mesh(new THREE.PlaneGeometry(.36,.36),
          new THREE.MeshBasicMaterial({map:kolonKodTex(kod), transparent:true}));
        k.position.set(0,1.75,sz*.235); if(sz<0) k.rotation.y=Math.PI;
        g.add(k);
      }
    }
    g.position.set(x,0,z);
    return g;
  }
  function armatur(z, isik){
    const g=new THREE.Group();
    const govde=new THREE.Mesh(new THREE.BoxGeometry(.22,.10,1.70),
      new THREE.MeshLambertMaterial({color:0x1E242A}));
    govde.position.y=TAVAN_Y-.20; g.add(govde);
    const tup=new THREE.Mesh(new THREE.BoxGeometry(.17,.05,1.62),
      new THREE.MeshBasicMaterial({color:0xF3E9D2}));
    tup.position.y=TAVAN_Y-.26; g.add(tup);
    if(isik){
      const l=new THREE.PointLight(0xFFEBC8, 1.15, 17, 1.5);
      l.position.set(0,TAVAN_Y-.42,0); g.add(l);
    }
    g.position.set(0,0,z);
    return g;
  }
  /** Zemine boya çizgisi: (x,z) merkez, ang yönünde uzun. */
  function cizgi(x,z,uz,kal,ang,renk,op){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(uz,kal),
      new THREE.MeshBasicMaterial({color:renk, transparent:true, opacity:op===undefined?.55:op}));
    m.rotation.set(-Math.PI/2, 0, ang);
    m.position.set(x,.026,z);
    return m;
  }
  function zeminYazi(x,z,ang,txt,en){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(en||1.5,(en||1.5)/4),
      new THREE.MeshBasicMaterial({map:yonTex(txt), transparent:true, opacity:.55}));
    m.rotation.set(-Math.PI/2,0,ang);
    m.position.set(x,.028,z);
    return m;
  }

  /** Ortak kabuk: zemin, tavan, kirişler, duvarlar, kolonlar, aydınlatma. */
  /* eski kapalı otopark kabuğu kaldırıldı — yerini açık saha aldı */
  /* ==================================================================
     AÇIK HAVA GALERİ SAHASI
     Kapalı otopark yerine güneşli bir ikinci el oto plaza: mavi gökyüzü,
     asfalt saha, boyalı park yerleri, cam cepheli galeri binası, flama
     dizileri, direk lambalar, ağaçlar ve arkada şehir silueti.
     ================================================================== */
  const GOK_UST=0x3C86D8, GOK_ALT=0xBFE0F2;

  function gokTex(){
    const s=SAAT;
    return tex("gok"+s.k, 16, 256, (g)=>{
      const gr=g.createLinearGradient(0,0,0,256);
      gr.addColorStop(0,s.gokUst);
      gr.addColorStop(.20,s.gokUst);
      gr.addColorStop(.46,s.gokOrta);
      gr.addColorStop(.78,s.gokOrta);
      gr.addColorStop(1,s.gokAlt);
      g.fillStyle=gr; g.fillRect(0,0,16,256);
    });
  }
  function asfaltTex(){
    return tex("asfalt", 512, 512, (g)=>{
      g.fillStyle="#585F66"; g.fillRect(0,0,512,512);
      for(let i=0;i<9000;i++){
        const v=70+Math.random()*52;
        g.fillStyle=`rgba(${v},${v+3},${v+6},${.25+Math.random()*.4})`;
        g.fillRect(Math.random()*512, Math.random()*512, 2, 2);
      }
      for(let i=0;i<14;i++){            // çok hafif yama
        g.fillStyle=`rgba(46,50,56,${.02+Math.random()*.03})`;
        g.beginPath(); g.ellipse(Math.random()*512,Math.random()*512,
          40+Math.random()*90, 28+Math.random()*60, Math.random()*3,0,7); g.fill();
      }
      g.strokeStyle="rgba(44,48,54,.16)"; g.lineWidth=2;   // ince derz
      g.beginPath(); g.moveTo(0,3); g.lineTo(512,3); g.moveTo(3,0); g.lineTo(3,512); g.stroke();
    }, [7,9]);
  }
  function cimTex(){
    return tex("cim", 128, 128, (g)=>{
      g.fillStyle="#4E8C3C"; g.fillRect(0,0,128,128);
      for(let i=0;i<2600;i++){
        const v=Math.random()<.5?0:1;
        g.fillStyle=v?"rgba(120,180,90,.45)":"rgba(45,92,36,.45)";
        g.fillRect(Math.random()*128, Math.random()*128, 2, 3);
      }
    }, [10,10]);
  }
  function bulutTex(){
    return tex("bulut", 256, 128, (g)=>{
      g.clearRect(0,0,256,128);
      const puf=(x,y,r)=>{ const gr=g.createRadialGradient(x,y,r*.15,x,y,r);
        gr.addColorStop(0,"rgba(255,255,255,.95)");
        gr.addColorStop(.6,"rgba(255,255,255,.66)");
        gr.addColorStop(1,"rgba(255,255,255,0)");
        g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); };
      puf(84,74,44); puf(128,62,54); puf(172,76,42); puf(108,86,38); puf(150,88,36);
    });
  }
  function siluetTex(){
    return tex("siluet", 1024, 128, (g)=>{
      g.clearRect(0,0,1024,128);
      g.fillStyle="rgba(96,124,152,.55)";
      let x=0;
      while(x<1024){
        const w=26+Math.random()*64, h=26+Math.random()*82;
        g.fillRect(x, 128-h, w, h);
        if(Math.random()<.25) g.fillRect(x+w*.3, 128-h-12, w*.25, 12);
        x+=w+4+Math.random()*16;
      }
    });
  }
  /** Saha zemini: üç varyant. Çakıl ve beton daha açık, araç rengi öne çıkar. */
  function zeminTex(tip){
    if(tip==="beton") return betonTex();
    if(tip==="cakil")  return cakilTex();
    return asfaltTex();
  }
  function betonTex(){
    return tex("betonsaha", 512, 512, (g)=>{
      g.fillStyle="#B9BDBA"; g.fillRect(0,0,512,512);
      for(let i=0;i<2600;i++){
        g.fillStyle=`rgba(${120+Math.random()*90|0},${122+Math.random()*90|0},${118+Math.random()*90|0},.26)`;
        g.fillRect(Math.random()*512, Math.random()*512, 2+Math.random()*4, 2+Math.random()*4);
      }
      g.strokeStyle="rgba(92,98,98,.55)"; g.lineWidth=3;
      for(const v of [0,170,341,511]){
        g.beginPath(); g.moveTo(v,0); g.lineTo(v,512); g.stroke();
        g.beginPath(); g.moveTo(0,v); g.lineTo(512,v); g.stroke();
      }
    }, [7,7]);
  }
  function cakilTex(){
    return tex("cakilsaha", 512, 512, (g)=>{
      g.fillStyle="#9A9388"; g.fillRect(0,0,512,512);
      for(let i=0;i<5200;i++){
        const r=1.4+Math.random()*3.1;
        const t=Math.random();
        g.fillStyle = t<.34 ? "rgba(176,170,158,.80)"
                   : t<.68 ? "rgba(132,126,116,.75)"
                           : "rgba(206,200,186,.60)";
        g.beginPath(); g.arc(Math.random()*512, Math.random()*512, r, 0, 7); g.fill();
      }
    }, [11,11]);
  }
  function flamaTex(){
    return tex("flama", 256, 64, (g)=>{
      g.clearRect(0,0,256,64);
      const renk=["#E8453C","#F5B234","#2E8FD8","#3DBE72","#EDEDED"];
      for(let i=0;i<8;i++){
        g.fillStyle=renk[i%renk.length];
        const x=i*32;
        g.beginPath(); g.moveTo(x,0); g.lineTo(x+32,0); g.lineTo(x+16,58); g.closePath(); g.fill();
      }
      g.fillStyle="#3A4048"; g.fillRect(0,0,256,4);
    }, [1,1]);
  }

  /* ---------- saha nesneleri ---------- */
  function direkLamba(x, z){
    const g=new THREE.Group();
    const m=new THREE.MeshLambertMaterial({color:0x8A939C});
    const d=new THREE.Mesh(new THREE.CylinderGeometry(.075,.10,6.2,8), m);
    d.position.y=3.1; d.castShadow=true; g.add(d);
    for(const sx of [-1,1]){
      const kol=new THREE.Mesh(new THREE.BoxGeometry(1.0,.10,.10), m);
      kol.position.set(sx*.5, 6.1, 0); g.add(kol);
      const bas=new THREE.Mesh(new THREE.BoxGeometry(.72,.14,.42),
        new THREE.MeshLambertMaterial({color:0x2E353C}));
      bas.position.set(sx*.95, 6.02, 0); g.add(bas);
      const cam=new THREE.Mesh(new THREE.BoxGeometry(.60,.05,.34),
        new THREE.MeshBasicMaterial({color:0xF6EFD8}));
      cam.position.set(sx*.95, 5.94, 0); g.add(cam);
    }
    const taban=new THREE.Mesh(new THREE.CylinderGeometry(.30,.34,.28,10),
      new THREE.MeshLambertMaterial({color:0x6E767E}));
    taban.position.y=.14; g.add(taban);
    g.position.set(x,0,z);
    return g;
  }
  function agac(x, z, olcek){
    const g=new THREE.Group(), s=olcek||1;
    const govde=new THREE.Mesh(new THREE.CylinderGeometry(.13*s,.19*s,1.5*s,7),
      new THREE.MeshLambertMaterial({color:0x6B4A2E}));
    govde.position.y=.75*s; govde.castShadow=true; g.add(govde);
    const yaprakM=new THREE.MeshLambertMaterial({color:0x3E7A34});
    const yaprakM2=new THREE.MeshLambertMaterial({color:0x4F9440});
    const kure=(r,y,dx,dz,mm)=>{ const k=new THREE.Mesh(new THREE.IcosahedronGeometry(r*s,1), mm);
      k.position.set(dx*s, y*s, dz*s); k.castShadow=true; g.add(k); };
    kure(.92,2.05,0,0,yaprakM);
    kure(.62,1.75,.62,.28,yaprakM2);
    kure(.56,1.90,-.55,-.34,yaprakM2);
    kure(.50,2.62,.18,-.20,yaprakM2);
    g.position.set(x,0,z);
    return g;
  }
  function saksi(x, z){
    const g=new THREE.Group();
    const p=new THREE.Mesh(new THREE.CylinderGeometry(.34,.28,.50,10),
      new THREE.MeshLambertMaterial({color:0xBFB4A4}));
    p.position.y=.25; p.castShadow=true; g.add(p);
    const c=new THREE.Mesh(new THREE.IcosahedronGeometry(.42,1),
      new THREE.MeshLambertMaterial({color:0x4A8C3E}));
    c.position.y=.76; c.scale.y=.80; c.castShadow=true; g.add(c);
    g.position.set(x,0,z);
    return g;
  }
  /** İki direk arasına renkli flama dizisi (hafif sarkma ile). */
  function flamaDizisi(x1,z1,x2,z2,y){
    const uz=Math.hypot(x2-x1, z2-z1);
    const par=Math.max(6, Math.round(uz/1.15));
    const dok=flamaTex().clone();
    dok.needsUpdate=true;
    dok.wrapS=dok.wrapT=THREE.RepeatWrapping;
    dok.repeat.set(Math.max(2, Math.round(uz/1.55)), 1);   // flama boyu ~19 cm
    const mat=new THREE.MeshBasicMaterial({map:dok, transparent:true,
      side:THREE.DoubleSide, alphaTest:.35});
    const geo=new THREE.PlaneGeometry(uz, .30, par, 1);
    const p=geo.attributes.position;
    for(let i=0;i<p.count;i++){
      const t=(p.getX(i)/uz)+.5;
      p.setY(i, p.getY(i) - Math.sin(Math.PI*t)*.62);
    }
    geo.computeVertexNormals();
    const m=new THREE.Mesh(geo, mat);
    m.position.set((x1+x2)/2, y, (z1+z2)/2);
    m.rotation.y=Math.atan2(x2-x1, z2-z1)-Math.PI/2;
    return m;
  }
  /** Cam cepheli galeri binası + çatı tabelası. */
  function galeriBinasi(z, en, ad, alt, renk, zemin){
    const g=new THREE.Group();
    const Y=4.6, D=7.0;
    const duvar=new THREE.MeshLambertMaterial({color:0xE9EDF0});
    const govde=new THREE.Mesh(new THREE.BoxGeometry(en*1.62, Y, D), duvar);
    govde.position.set(0, Y/2, -D/2); govde.castShadow=true; govde.receiveShadow=true; g.add(govde);
    // cam cephe
    const cam=new THREE.Mesh(new THREE.PlaneGeometry(en*1.40, Y*.72),
      new THREE.MeshPhongMaterial({color:0x6E9FC0, shininess:90, specular:0x9FC8E0,
        transparent:true, opacity:.78}));
    cam.position.set(0, Y*.42, .02); g.add(cam);
    // cam bölme çıtaları
    const cita=new THREE.MeshLambertMaterial({color:0x36404A});
    for(let i=-3;i<=3;i++){
      const c=new THREE.Mesh(new THREE.BoxGeometry(.09, Y*.74, .09), cita);
      c.position.set(i*en*.20, Y*.42, .05); g.add(c);
    }
    const alttrim=new THREE.Mesh(new THREE.BoxGeometry(en*1.44,.22,.14), cita);
    alttrim.position.set(0, Y*.06, .05); g.add(alttrim);
    // saçak
    const sacak=new THREE.Mesh(new THREE.BoxGeometry(en*1.72,.34,D+1.2),
      new THREE.MeshLambertMaterial({color:0x2C6FB5}));
    sacak.position.set(0, Y+.14, -D/2+.6); sacak.castShadow=true; g.add(sacak);
    // çatı tabelası
    const tb=new THREE.Mesh(new THREE.PlaneGeometry(en*1.06, 1.5),
      new THREE.MeshBasicMaterial({map:signTex(ad, alt, renk, zemin), transparent:true}));
    tb.position.set(0, Y+1.15, .30); g.add(tb);
    const tbArka=new THREE.Mesh(new THREE.BoxGeometry(en*1.10, 1.6, .16),
      new THREE.MeshLambertMaterial({color:0x14202C}));
    tbArka.position.set(0, Y+1.15, .18); g.add(tbArka);
    for(const sx of [-1,1]){        // tabela ayakları
      const a=new THREE.Mesh(new THREE.BoxGeometry(.12,.9,.12),
        new THREE.MeshLambertMaterial({color:0x7B858E}));
      a.position.set(sx*en*.44, Y+.5, .18); g.add(a);
    }
    g.position.set(0,0,z);
    return g;
  }
  /** Girişteki pilon tabela (yol kenarı totem). */
  function pilon(x, z, ad, renk, zemin){
    const g=new THREE.Group();
    const ayak=new THREE.Mesh(new THREE.BoxGeometry(.46,4.2,.46),
      new THREE.MeshLambertMaterial({color:0x7B858E}));
    ayak.position.y=2.1; ayak.castShadow=true; g.add(ayak);
    const kutu=new THREE.Mesh(new THREE.BoxGeometry(2.5,1.9,.34),
      new THREE.MeshLambertMaterial({color:0x14202C}));
    kutu.position.y=5.0; kutu.castShadow=true; g.add(kutu);
    for(const sz of [1,-1]){
      const yz=new THREE.Mesh(new THREE.PlaneGeometry(2.3,1.7),
        new THREE.MeshBasicMaterial({map:pilonTex(ad,"ikinci el · güvenli alım", renk, zemin), transparent:true}));
      yz.position.set(0,5.0,sz*.18); if(sz<0) yz.rotation.y=Math.PI; g.add(yz);
    }
    g.position.set(x,0,z);
    return g;
  }
  /** Saha çevresi: beton bordür + yeşil file çit. */
  function citPaneli(uz, x, z, ry){
    const g=new THREE.Group();
    const bord=new THREE.Mesh(new THREE.BoxGeometry(uz,.42,.30),
      new THREE.MeshLambertMaterial({color:0xC6C2B6}));
    bord.position.y=.21; bord.receiveShadow=true; g.add(bord);
    const file=new THREE.Mesh(new THREE.PlaneGeometry(uz,1.55),
      new THREE.MeshLambertMaterial({color:0x3E7355, transparent:true, opacity:.80,
        side:THREE.DoubleSide}));
    file.position.y=1.20; g.add(file);
    const ust=new THREE.Mesh(new THREE.BoxGeometry(uz,.09,.09),
      new THREE.MeshLambertMaterial({color:0x8B949C}));
    ust.position.y=1.98; g.add(ust);
    for(let i=-Math.floor(uz/2/2.4); i<=Math.floor(uz/2/2.4); i++){
      const d=new THREE.Mesh(new THREE.BoxGeometry(.10,1.95,.10),
        new THREE.MeshLambertMaterial({color:0x8B949C}));
      d.position.set(i*2.4,1.0,0); g.add(d);
    }
    g.position.set(x,0,z); g.rotation.y=ry;
    return g;
  }

  /** Giriş balonu kümesi. */
  function balonlar(x, z){
    const g=new THREE.Group();
    const renk=[0xE8453C,0xF5B234,0x2E8FD8,0x3DBE72,0xEDEDED];
    for(let i=0;i<7;i++){
      const b=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),
        new THREE.MeshPhongMaterial({color:renk[i%renk.length], shininess:80,
          specular:0xFFFFFF}));
      const a=i*1.1, r=.34+ (i%3)*.12;
      b.position.set(Math.cos(a)*r, 2.6+(i%4)*.24, Math.sin(a)*r);
      b.scale.y=1.18; g.add(b);
      const ip=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,b.position.y-.9,4),
        new THREE.MeshBasicMaterial({color:0xE8E4D8}));
      ip.position.set(b.position.x*.5, (b.position.y+.9)/2-.12, b.position.z*.5);
      g.add(ip);
    }
    const ag=new THREE.Mesh(new THREE.CylinderGeometry(.24,.30,.60,10),
      new THREE.MeshLambertMaterial({color:0x8B949C}));
    ag.position.y=.30; ag.castShadow=true; g.add(ag);
    g.position.set(x,0,z);
    return g;
  }

  /** Statik dekoru malzeme benzerliğine göre tek çizime indirir.
      Saha hiç hareket etmediği için bu tamamen güvenli ve çizim
      çağrısını üçte birine düşürüyor. */
  function matAnahtar(m){
    return [m.type, m.color?m.color.getHexString():"-", m.map?m.map.uuid:"-",
            m.transparent?1:0, (m.opacity||1).toFixed(3), m.side,
            (m.alphaTest||0).toFixed(2), m.depthWrite?1:0,
            m.shininess||0, m.specular?m.specular.getHexString():"-",
            m.fog===false?"nf":"f"].join("|");
  }
  function dekorBirle(kok){
    kok.updateMatrixWorld(true);
    const kova=new Map(), hepsi=[];
    kok.traverse(o=>{ if(o.isMesh && o.material && !Array.isArray(o.material)) hepsi.push(o); });
    for(const o of hepsi){
      if(o.material.fog===false) continue;          // gök/bulut/siluet ayrı kalsın
      const k=matAnahtar(o.material);
      if(!kova.has(k)) kova.set(k,[]);
      kova.get(k).push(o);
    }
    for(const [,list] of kova){
      if(list.length<2) continue;
      const g=birlestir(list.map(o=>({geo:o.geometry, mat:o.matrixWorld})));
      const m=new THREE.Mesh(g, list[0].material);
      m.castShadow=list.some(o=>o.castShadow);
      m.receiveShadow=list.some(o=>o.receiveShadow);
      m.frustumCulled=false;
      scene.add(m);
      for(const o of list) if(o.parent) o.parent.remove(o);
    }
    scene.add(kok);
  }

  /** Ortak açık hava kabuğu. */
  function acikSaha(o){
    const en=o.en, z0=o.z0, z1=o.z1, derin=z0-z1, orta=(z0+z1)/2;
    SAHA={x:en-.2, z0:z0-.3, z1:z1+.3};
    const D=new THREE.Group();   // statik dekor (sonda birleştirilir)

    const S4=SAAT;
    scene.background=new THREE.Color(S4.gokOrta);
    scene.fog=new THREE.Fog(new THREE.Color(S4.sis).getHex(), S4.sisY, S4.sisU);

    /* --- ışık: güneş + gökyüzü (günün saatine göre) --- */
    scene.add(new THREE.AmbientLight(S4.ortam, S4.ortamGuc));
    scene.add(new THREE.HemisphereLight(new THREE.Color(S4.gokOrta).getHex(), S4.yerRenk, .62));
    const gun=new THREE.DirectionalLight(S4.gunes, S4.guc);
    gun.position.set(S4.yon[0], S4.yon[1], S4.yon[2]); gun.target.position.set(0,0,orta);
    gun.castShadow=true;
    gun.shadow.mapSize.set(2048,2048);
    const sc=gun.shadow.camera;
    sc.left=-en-4; sc.right=en+4; sc.top=derin/2+6; sc.bottom=-derin/2-6;
    sc.near=1; sc.far=64; sc.updateProjectionMatrix();
    gun.shadow.bias=-0.0011; gun.shadow.normalBias=0.024;
    scene.add(gun); scene.add(gun.target);

    /* --- gökyüzü kubbesi --- */
    const gok=new THREE.Mesh(new THREE.SphereGeometry(240, 28, 18),
      new THREE.MeshBasicMaterial({map:gokTex(), side:THREE.BackSide, fog:false}));
    gok.position.set(0, -30, orta); D.add(gok);

    /* --- bulutlar: yavaşça sürüklenirler (madde 13) --- */
    const bm=new THREE.MeshBasicMaterial({map:bulutTex(), transparent:true,
      depthWrite:false, fog:false});
    const bulutKok=new THREE.Group();
    bulutKok.position.set(0,0,orta);
    for(let i=0;i<7;i++){
      const b=new THREE.Mesh(new THREE.PlaneGeometry(34,17), bm);
      const a=(i/7)*Math.PI*2 + .4;
      b.position.set(Math.sin(a)*90, 30+((i*7)%16), Math.cos(a)*90);
      b.lookAt(new THREE.Vector3(0, 26, 0));
      bulutKok.add(b);
    }
    scene.add(bulutKok);
    CANLI.push((dt)=>{ bulutKok.rotation.y += dt*0.0042; });

    /* --- çitin ardındaki yoldan ara ara araç geçer (madde 13) --- */
    (function gecenArac(){
      const yol=en+6.4;                     // çitin dışındaki şerit
      const renkler=[0xD94F45,0x2F7FC4,0xE8EAEC,0x3E9E62,0x2A2F36,0xE0A33A];
      const yap=(renk)=>{
        const g2=new THREE.Group();
        const govde=new THREE.Mesh(new THREE.BoxGeometry(1.72,.74,4.30),
          new THREE.MeshLambertMaterial({color:renk}));
        govde.position.y=.74; g2.add(govde);
        const tavan=new THREE.Mesh(new THREE.BoxGeometry(1.56,.56,2.20),
          new THREE.MeshLambertMaterial({color:renk}));
        tavan.position.set(0,1.36,-.16); g2.add(tavan);
        const cam2=new THREE.Mesh(new THREE.BoxGeometry(1.58,.40,2.10),
          new THREE.MeshLambertMaterial({color:0x2A3A46}));
        cam2.position.set(0,1.40,-.16); g2.add(cam2);
        for(const sx of [-1,1]) for(const sz of [-1.35,1.35]){
          const tk=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.22,10),
            new THREE.MeshLambertMaterial({color:0x14181D}));
          tk.rotation.z=Math.PI/2; tk.position.set(sx*.88,.32,sz); g2.add(tk);
        }
        return g2;
      };
      const a1=yap(renkler[0]); a1.visible=false; scene.add(a1);
      let bekle=rnd(3,9), yonSag=true, ilerleme=0, aktif=false;
      CANLI.push((dt)=>{
        if(!aktif){
          bekle-=dt;
          if(bekle<=0){
            aktif=true; ilerleme=0; yonSag=Math.random()<.5;
            a1.children[0].material.color.setHex(renkler[ri(0,renkler.length-1)]);
            a1.children[1].material.color.copy(a1.children[0].material.color);
            a1.position.x = yonSag ? -yol : yol;
            a1.rotation.y = yonSag ? Math.PI/2 : -Math.PI/2;
            a1.visible=true;
          }
          return;
        }
        ilerleme += dt*9.5;
        const z2 = z1-4 + ilerleme;
        a1.position.set(yonSag?yol:-yol, 0, z2);
        a1.rotation.y = yonSag ? 0 : Math.PI;
        if(z2 > z0+10){ aktif=false; a1.visible=false; bekle=rnd(5,14); }
      });
    })();
    /* --- uzak şehir silueti --- */
    const sm=new THREE.MeshBasicMaterial({map:siluetTex(), transparent:true,
      depthWrite:false, fog:false});
    for(const [ax,az,ry] of [[0,z1-70,0],[0,z0+70,Math.PI],[-70,orta,Math.PI/2],[70,orta,-Math.PI/2]]){
      const b=new THREE.Mesh(new THREE.PlaneGeometry(190,22), sm);
      b.position.set(ax, 11, az); b.rotation.y=ry; D.add(b);
    }

    /* --- çevre çimi (sahanın dışı) --- */
    const cim=new THREE.Mesh(new THREE.PlaneGeometry(320,320),
      new THREE.MeshLambertMaterial({map:cimTex()}));
    cim.rotation.x=-Math.PI/2; cim.position.set(0,-.04,orta); D.add(cim);

    /* --- saha zemini (kişiselleştirilebilir) --- */
    const zem=new THREE.Mesh(new THREE.PlaneGeometry(en*2, derin),
      new THREE.MeshLambertMaterial({map:zeminTex(o.zemin)}));
    zem.rotation.x=-Math.PI/2; zem.position.z=orta; zem.receiveShadow=true; D.add(zem);
    // saha bordürü
    const bordM=new THREE.MeshLambertMaterial({color:0xCFCBBE});
    for(const sx of [-1,1]){
      const b=new THREE.Mesh(new THREE.BoxGeometry(.34,.20,derin), bordM);
      b.position.set(sx*(en+.17), .10, orta); b.receiveShadow=true; D.add(b);
    }
    for(const zz of [z0+.17, z1-.17]){
      const b=new THREE.Mesh(new THREE.BoxGeometry(en*2+.68,.20,.34), bordM);
      b.position.set(0,.10,zz); b.receiveShadow=true; D.add(b);
    }

    /* --- orta koridor çizgisi --- */
    D.add(cizgi(0, orta, derin*.94, .14, Math.PI/2, 0xF2F0E6, .55));
    for(let z=z1+5; z<z0-3; z+=7.5) D.add(zeminYazi(0, z, Math.PI/2, "▲", 1.2));

    /* --- çit: bina varsa dip tarafı açık bırakılır --- */
    for(const sx of [-1,1]) D.add(citPaneli(derin, sx*(en+.5), orta, Math.PI/2));
    if(!o.bina) D.add(citPaneli(en*2+1.0, 0, z1-.5, 0));
    D.add(citPaneli(en*2+1.0, 0, z0+.5, 0));

    /* --- galeri binası ya da giriş takı --- */
    if(o.bina) D.add(galeriBinasi(z1-1.2, en, o.ad, o.alt, o.renk, o.koyu));
    else{
      const tb=new THREE.Mesh(new THREE.PlaneGeometry(7.2,1.8),
        new THREE.MeshBasicMaterial({map:signTex(o.ad,o.alt,o.renk,o.koyu), transparent:true}));
      tb.position.set(0,3.5,z1-.45); D.add(tb);
      const kutu=new THREE.Mesh(new THREE.BoxGeometry(7.6,2.0,.30),
        new THREE.MeshLambertMaterial({color:0x14202C}));
      kutu.position.set(0,3.5,z1-.60); kutu.castShadow=true; D.add(kutu);
      for(const sx of [-1,1]){
        const a=new THREE.Mesh(new THREE.BoxGeometry(.34,3.6,.34),
          new THREE.MeshLambertMaterial({color:0x7B858E}));
        a.position.set(sx*3.5,1.8,z1-.60); a.castShadow=true; D.add(a);
      }
    }
    D.add(pilon(en-1.4, z0-2.2, o.ad, o.renk, o.koyu));

    /* --- direk lambalar + flamalar --- */
    const direkZ=[];
    const ilk = o.bina ? z1+7.5 : z1+4.5;
    for(let z=ilk; z<z0-1.5; z+=9.0) direkZ.push(z);
    for(const z of direkZ) for(const sx of [-1,1]) D.add(direkLamba(sx*(en-.9), z));
    const flamalar=[];
    if(o.flama!==false){
      for(const z of direkZ) flamalar.push(flamaDizisi(-(en-.9), z, (en-.9), z, 5.5));
      for(let i=0;i<direkZ.length-1;i++) for(const sx of [-1,1])
        flamalar.push(flamaDizisi(sx*(en-.9), direkZ[i], sx*(en-.9), direkZ[i+1], 5.2));
    }
    // Rüzgârda sallanırlar: statik dekora katılmaz, sahneye tek tek girerler.
    for(let i=0;i<flamalar.length;i++){
      const f=flamalar[i], y0=f.position.y, rz0=f.rotation.z, faz=i*1.37;
      scene.add(f);
      CANLI.push((dt,t2)=>{
        const s=t2*0.0011+faz;
        f.position.y = y0 + Math.sin(s)*0.055;
        f.rotation.z = rz0 + Math.sin(s*1.6)*0.022;
      });
    }

    /* --- yeşillik --- */
    for(let z=z1+6; z<z0-2; z+=11) for(const sx of [-1,1]) D.add(agac(sx*(en+3.2), z, 1+((z|0)%3)*.12));
    for(const z of direkZ) for(const sx of [-1,1]) D.add(saksi(sx*(en-.75), z+2.6));

    /* --- balonlar ---
       Koridorda yürüyen blok müşteri figürleri kaldırıldı: araçlarla aynı
       dünyadan değillerdi (kutu kafa, kutu gövde) ve sahneyi oyun oyuncağı
       gibi gösteriyorlardı. Pazar kalabalığını bayraklar ve balonlar taşıyor. */
    for(const sx of [-1,1]) D.add(balonlar(sx*(en-1.5), z0-1.4));
    dekorBirle(D);
  }

  /** Bir park yeri: iki kenar çizgisi + numara. */
  function parkYeri(x,z,ry,no,bos){
    const ang=ry-Math.PI/2;
    const px2=Math.cos(ry), pz2=-Math.sin(ry);      // eksene dik yön
    const renk=bos?0xC9CFC7:0xE8C24A;
    for(const k of [-1,1]){
      scene.add(cizgi(x+px2*1.42*k, z+pz2*1.42*k, 5.0, .12, ang, renk, bos?.34:.52));
    }
    // yerin dip çizgisi
    const dx=Math.sin(ry), dz=Math.cos(ry);
    scene.add(cizgi(x+dx*2.45, z+dz*2.45, 2.84, .12, ang+Math.PI/2, renk, bos?.34:.52));
    if(no){
      const m=zeminYazi(x-dx*2.0, z-dz*2.0, ang+Math.PI/2, String(no), 1.25);
      m.material.opacity=.40; scene.add(m);
    }
    if(bos){
      const m=zeminYazi(x, z, ang+Math.PI/2, "BOŞ", 2.6);
      m.material.opacity=.42; scene.add(m);
    }
  }

  function buildLot(){
    acikSaha({en:9.6, z0:13.4, z1:-20.4, bina:false,
      ad:"OTO PAZARI", alt:"günün ilanları · açık saha"});   // pazar herkesin, kişiselleştirilmez
    bounds={x:2.65, z:11.8};
  }

  function buildShowroom(){
    const kapasite=Math.max(3,S.slots);
    const sira=Math.ceil(kapasite/2);
    const z1=-(4.0+sira*4.3);
    const kis = (typeof lotAl==="function") ? lotAl() : {renk:"sodium", zemin:"asfalt", flama:true};
    const kr  = (typeof lotRenk==="function") ? lotRenk() : {h:"#F2A007", koyu:"#12171B"};
    acikSaha({en:9.6, z0:9.0, z1:Math.min(-12,z1), bina:true,
      ad:(typeof lotAd==="function")?lotAd():"GALERİN",
      alt:`${S.cars.length}/${S.slots} dolu · ${S.day}. gün`,
      renk:kr.h, koyu:kr.koyu, zemin:kis.zemin, flama:kis.flama!==false});
    // müşteri masası + şemsiye
    const masa=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.07,14),
      new THREE.MeshLambertMaterial({color:0xE6E2D8}));
    masa.position.set(-7.2,.76,6.2); masa.castShadow=true; scene.add(masa);
    const ayak=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.76,8),
      new THREE.MeshLambertMaterial({color:0x8B949C}));
    ayak.position.set(-7.2,.38,6.2); scene.add(ayak);
    const semsiyeD=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.4,8),
      new THREE.MeshLambertMaterial({color:0x8B949C}));
    semsiyeD.position.set(-7.2,1.2,6.2); scene.add(semsiyeD);
    const semsiye=new THREE.Mesh(new THREE.ConeGeometry(1.7,.62,10),
      new THREE.MeshLambertMaterial({color:0xE8453C}));
    semsiye.position.set(-7.2,2.46,6.2); semsiye.castShadow=true; scene.add(semsiye);
    for(const dx of [-1.15,1.15]){
      const s2=new THREE.Mesh(new THREE.BoxGeometry(.5,.06,.5),
        new THREE.MeshLambertMaterial({color:0xE6E2D8}));
      s2.position.set(-7.2+dx,.46,6.2); s2.castShadow=true; scene.add(s2);
      const sa=new THREE.Mesh(new THREE.BoxGeometry(.46,.46,.06),
        new THREE.MeshLambertMaterial({color:0xE6E2D8}));
      sa.position.set(-7.2+dx,.70,5.98); scene.add(sa);
    }
    bounds={x:2.65, z:Math.max(4, 9.0-1.6)};
  }

  /* ---------- araçları yerleştir ---------- */
  function placeCars(){
    const liste = mode==="pazar" ? (S.market||[]) : (S.cars||[]);
    const kind  = mode==="pazar" ? "market" : "own";
    items=[];
    const yerlestir=(car,i,z0)=>{
      const sag=i%2===1;
      const sr=Math.floor(i/2);
      const x=sag?5.5:-5.5, z=z0-sr*4.3;
      const ry=(sag?Math.PI/2:-Math.PI/2)+(sag?-.40:.40);   // burun koridora dönük
      parkYeri(x,z,ry,i+1,!car);
      if(!car) return;
      const obj=buildCar(car);
      obj.position.set(x,0,z);
      obj.rotation.y=ry;
      golgeAyarla(obj);
      scene.add(obj);
      const sil=profil3B(car.model);
      const yns=yerYansimasi(car, sil.L, sil.W);
      yns.position.set(x, 0.013, z); yns.rotation.z=ry;
      scene.add(yns);
      addCard(obj,car,kind, sag?-1:1);
    };
    if(mode==="pazar"){
      liste.slice(0,12).forEach((car,i)=>yerlestir(car,i,4.6));
    }else{
      const kapasite=Math.max(3,S.slots);
      for(let i=0;i<kapasite;i++) yerlestir(liste[i]||null, i, 1.6);
    }
  }
  /** Opak parçalar gölge versin; cam ve sahte gölge vermesin. */

  /* ==================================================================
     YER YANSIMASI (madde 12)
     Gerçek planar yansıma iki kat çizim demek; mobilde pahalı. Bunun
     yerine her aracın altına, gövde renginden türetilmiş yumuşak bir
     ışık lekesi koyuyoruz: asfalt ıslak/cilalı görünüyor, maliyet sıfıra
     yakın (tek şeffaf düzlem, gölge dökmez, derinliğe yazmaz).
     ================================================================== */
  function yansimaTex(){
    return tex("yansima", 128, 128, (g)=>{
      const gr=g.createRadialGradient(64,64,0,64,64,64);
      gr.addColorStop(0,"rgba(255,255,255,.85)");
      gr.addColorStop(.42,"rgba(255,255,255,.34)");
      gr.addColorStop(.78,"rgba(255,255,255,.08)");
      gr.addColorStop(1,"rgba(255,255,255,0)");
      g.fillStyle=gr; g.fillRect(0,0,128,128);
    });
  }
  function yerYansimasi(car, uzun, genis){
    const hex=COLHEX[car.color]!==undefined ? COLHEX[car.color] : 0x9AA2A8;
    const c=new THREE.Color(hex);
    // Asfalta vuran yansıma gerçek renkten daha soluk ve daha koyu olur.
    c.lerp(new THREE.Color(0x6E767E), .42);
    const m=new THREE.Mesh(
      new THREE.PlaneGeometry(genis*1.55, uzun*1.18),
      new THREE.MeshBasicMaterial({map:yansimaTex(), color:c, transparent:true,
        opacity:.34, depthWrite:false, blending:THREE.NormalBlending}));
    m.rotation.x=-Math.PI/2;
    m.position.y=0.013;
    m.renderOrder=1;
    return m;
  }

  function golgeAyarla(obj){
    obj.traverse(m=>{
      if(!m.isMesh) return;
      const mt=m.material;
      if(!mt || mt.transparent || mt.side===THREE.BackSide) return;
      m.castShadow=true;
    });
  }
  /* Ayaklı fiyat panoları vitrinle birlikte kalktı: bilgi alttaki kartta.
     Panolar arkadan bakınca koca siyah levhalar gibi duruyor, aracın önünü
     kapatıyordu. Araç yalnızca vitrin sırasına ekleniyor. */
  function addCard(obj, car, kind, yon){
    const sz=obj.userData.size||{l:4.5,w:1.8};
    items.push({obj, car, r:Math.max(1.5, sz.l*.34)});
  }


  /* ==================================================================
     VİTRİN — serbest yürüyüşün yerine
     Önce iki pedle yürünen bir saha vardı: telefonda iki parmakla yürüyüp
     arabaya hizalanmak yorucuydu ve oyunun asıl işine (arabaya bakmaya)
     hiçbir şey katmıyordu. Artık kamera seçili aracın etrafında dönüyor:
       tek parmak sürükle  → aracın etrafında dön / eğ
       iki parmak, tekerlek → yakınlaş / uzaklaş
       ‹ › , ok tuşları, hızlı kaydırma → sıradaki araç
       dokun              → başka araca geç; seçili araca dokun → incele
     Kimse dokunmazken araç vitrindeki gibi ağır ağır dönüyor.
     ================================================================== */
  const VFOV=50;
  let SAHA={x:9.4, z0:13, z1:-20};   // vitrin kamerasının kalması gereken saha (çit içi)
  const VT={i:0, aci:0, egim:.20, uzak:1, hAci:0, hEgim:.20, hUzak:1,
            T:null, hT:null, son:0, gecis:1, parmak:{}, pinch:null, surukle:null};
  function onKey(e,d){
    if(!d || !ready) return;
    const k=e.key;
    if(k==="ArrowRight"){ sec(VT.i+1); e.preventDefault(); }
    else if(k==="ArrowLeft"){ sec(VT.i-1); e.preventDefault(); }
    else if(k==="Enter" && focus){ openItem(focus); e.preventDefault(); }
  }
  function hedefKoy(it, anlik){
    if(!it) return;
    const o=it.obj, sz=o.userData.size||{l:4.4};
    VT.hT=new THREE.Vector3(o.position.x, .62, o.position.z);
    // önden üç çeyrek: burnun yönü + koridor tarafına doğru bir pay
    const burun=o.rotation.y+Math.PI;
    VT.hAci=burun + (o.position.x>0?.75:-.75);
    VT.hUzak=1; VT.uzunluk=sz.l;
    if(anlik || !VT.T){ VT.T=VT.hT.clone(); VT.aci=VT.hAci; VT.uzak=1; }
    else {
      // en kısa yönden dön
      while(VT.hAci-VT.aci>Math.PI) VT.hAci-=2*Math.PI;
      while(VT.aci-VT.hAci>Math.PI) VT.hAci+=2*Math.PI;
      VT.gecis=0;
    }
  }
  function sec(i, anlik){
    if(!items.length) return;
    VT.i=((i%items.length)+items.length)%items.length;
    focus=items[VT.i]; VT.son=performance.now();
    hedefKoy(focus, anlik);
    updateFocusBar();
    try{ if(typeof dokun==="function") dokun("sec"); }catch(e){}
  }
  /** Kamerayı odaktaki aracın sağ (sx=1) ya da sol (sx=-1) yanına çevir. */
  function yanaBak(sx){
    if(!focus) return;
    const ry=focus.obj.rotation.y;
    VT.hAci=Math.atan2(sx*Math.cos(ry), -sx*Math.sin(ry));
    while(VT.hAci-VT.aci>Math.PI) VT.hAci-=2*Math.PI;
    while(VT.aci-VT.hAci>Math.PI) VT.hAci+=2*Math.PI;
    VT.son=performance.now()+4000;   // döner tabla hemen kaçırmasın
  }
  function noktalar(e){ return e.changedTouches ? [...e.changedTouches] : [e]; }
  function pointerDown(e){
    if(!ready) return;
    VT.son=performance.now();
    for(const t of noktalar(e)){
      const id=t.identifier??"m";
      VT.parmak[id]={x:t.clientX, y:t.clientY, sx:t.clientX, sy:t.clientY, t:performance.now(), yol:0};
    }
    const ids=Object.keys(VT.parmak);
    if(ids.length>=2){
      const [a,b]=ids.map(k=>VT.parmak[k]);
      VT.pinch={d:Math.hypot(a.x-b.x,a.y-b.y), uzak:VT.hUzak};
    }
  }
  function pointerMove(e){
    if(!ready) return;
    let degisti=false;
    for(const t of noktalar(e)){
      const id=t.identifier??"m", p=VT.parmak[id]; if(!p) continue;
      const dx=t.clientX-p.x, dy=t.clientY-p.y;
      p.yol+=Math.abs(dx)+Math.abs(dy); p.x=t.clientX; p.y=t.clientY;
      if(!VT.pinch){
        VT.hAci -= dx*.0085;
        VT.hEgim = clamp(VT.hEgim + dy*.0045, .08, .80);
      }
      degisti=true;
    }
    if(VT.pinch && degisti){
      const ids=Object.keys(VT.parmak);
      if(ids.length>=2){ const [a,b]=ids.map(k=>VT.parmak[k]);
        const d=Math.hypot(a.x-b.x,a.y-b.y);
        VT.hUzak=clamp(VT.pinch.uzak*VT.pinch.d/Math.max(20,d), .62, 1.55); }
    }
    if(degisti) VT.son=performance.now();
  }
  function pointerUp(e){
    if(!ready) return;
    for(const t of noktalar(e)){
      const id=t.identifier??"m", p=VT.parmak[id]; if(!p) continue;
      delete VT.parmak[id];
      if(VT.pinch){ if(Object.keys(VT.parmak).length<2) VT.pinch=null; continue; }
      const sure=performance.now()-p.t, dx=t.clientX-p.sx;
      if(p.yol<8) tapAt(t.clientX, t.clientY);
      // hızlı ve yatay bir fiske sıradaki araca geçirir; yavaş sürükleme döndürür
      else if(sure<320 && Math.abs(dx)>70 && Math.abs(dx)>Math.abs(t.clientY-p.sy)*1.6){
        VT.hAci+=dx*.0085;   // fiskenin döndürdüğünü geri al
        sec(VT.i+(dx<0?1:-1));
      }
    }
    if(e.touches && e.touches.length===0){ VT.parmak={}; VT.pinch=null; }
  }
  function tekerlek(e){
    if(!ready) return;
    VT.hUzak=clamp(VT.hUzak*(e.deltaY>0?1.08:.93), .62, 1.55); VT.son=performance.now();
    e.preventDefault();
  }
  /** Yan etkisiz ışın sorgusu: (x,y) dokunuşu hangi araca, hangi ipucuna düşer. */
  function isabet(x,y){
    if(!ren||!focus) return null;
    const rect=ren.domElement.getBoundingClientRect();
    const nd=new THREE.Vector2(((x-rect.left)/rect.width)*2-1, -((y-rect.top)/rect.height)*2+1);
    const rc=new THREE.Raycaster(); rc.setFromCamera(nd, cam);
    const hit=rc.intersectObjects(items.map(i=>i.obj), true)[0];
    if(!hit) return {arac:null};
    let o=hit.object; while(o.parent && o!==focus.obj && !items.some(i=>i.obj===o)) o=o.parent;
    if(o!==focus.obj) return {arac:"baska"};
    const yerel=focus.obj.worldToLocal(hit.point.clone());
    const q=(focus.obj.userData.ipucu||[]).find(q=>Math.hypot(yerel.x-q.poz[0],yerel.y-q.poz[1],yerel.z-q.poz[2])<q.r);
    return {arac:"odak", ipucu:q?q.k:null};
  }
  function tapAt(x,y){
    if(!ren) return;
    const rect=ren.domElement.getBoundingClientRect();
    const nd=new THREE.Vector2(((x-rect.left)/rect.width)*2-1, -((y-rect.top)/rect.height)*2+1);
    const rc=new THREE.Raycaster(); rc.setFromCamera(nd, cam);
    const hedefler=items.map(i=>i.obj);
    const hit=rc.intersectObjects(hedefler, true)[0];
    if(!hit) return;
    if(typeof gozTik==="function" && gozTik(hit)) return;   // gözle ekspertiz işaretleri
    let o=hit.object; while(o.parent && !hedefler.includes(o)) o=o.parent;
    const k=items.findIndex(i=>i.obj===o);
    if(k<0) return;
    if(k===VT.i) openItem(items[k]); else sec(k);
  }
  /* ---- gözle ekspertiz: dokunulan nokta bir ipucunun yakınında mı ---- */
  function gozIsaretTex(){
    return tex("gozIsaret",64,64,(g)=>{
      g.clearRect(0,0,64,64);
      g.fillStyle="rgba(240,180,82,.28)"; g.beginPath(); g.arc(32,32,30,0,7); g.fill();
      g.strokeStyle="#F0B452"; g.lineWidth=5; g.beginPath(); g.arc(32,32,22,0,7); g.stroke();
      g.fillStyle="#F0B452"; g.beginPath(); g.arc(32,32,7,0,7); g.fill();
    });
  }
  function gozIsaretObj(poz){
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:gozIsaretTex(), depthTest:false, transparent:true}));
    sp.scale.set(.30,.30,.30); sp.position.set(poz[0],poz[1],poz[2]); sp.renderOrder=9; sp.name="gozIsaret";
    return sp;
  }
  function gozTik(hit){
    if(mode!=="pazar" || !focus || focus.car.inspected) return false;
    let o=hit.object; while(o.parent && o!==focus.obj) o=o.parent;
    if(o!==focus.obj) return false;
    const yerel=focus.obj.worldToLocal(hit.point.clone());
    // Üst üste binen izlerde (boyalı kapı + çizik) önce henüz bulunmamış olan
    const bulunan=focus.car.goz||[];
    let en=null, ed=1e9;
    for(const q of (focus.obj.userData.ipucu||[])){
      const d=Math.hypot(yerel.x-q.poz[0], yerel.y-q.poz[1], yerel.z-q.poz[2]);
      const puan=d+(bulunan.includes(q.k)?10:0);
      if(d<q.r && puan<ed){ ed=puan; en=q; }
    }
    if(!en){ gozSonuc("Burası temiz görünüyor.", false); return true; }
    const b=(typeof gozBul==="function") ? gozBul(focus.car, en.k) : null;
    if(b){
      focus.obj.add(gozIsaretObj(en.poz));
      try{ if(typeof cal==="function") cal("kasa"); if(typeof dokun==="function") dokun("al"); }catch(e){}
      gozSonuc(`Gözün yakaladı: ${b.t}. Pazarlıkta koz.`, true);
    } else gozSonuc("Bunu zaten not ettin.", false);
    return true;
  }
  function gozSonuc(metin, iyi){
    GOZ_SON={metin, iyi, t:performance.now()};
    updateFocusBar();
  }
  let GOZ_SON=null;   // son dokunuşun sonucu — geçici, kayda yazılmaz
  function gozDurum(c){
    if(mode!=="pazar" || c.inspected) return "";
    const n=(c.goz||[]).length;
    const son=GOZ_SON && performance.now()-GOZ_SON.t<6000 ? GOZ_SON : null;
    return `<div class="w3dgoz ${son?(son.iyi?"iyi":""):""}">
      <b>GÖZLE BAK</b><span>${son?son.metin:"Kusur görürsen üstüne dokun — bedava koz."}</span>
      ${n?`<em>${n} bulgu</em>`:""}</div>`;
  }

  function openItem(it){
    pause();
    if(mode==="pazar") openMarketCar(it.car); else openOwnCar(it.car);
  }

  /* ---------- döngü ---------- */
  function tick(t){
    raf=requestAnimationFrame(tick);
    const dt=Math.min(.05,(t-lastT)/1000||.016); lastT=t;

    kare++; kareSure+=dt;
    if(kare>=48){
      const fps=kare/Math.max(.001,kareSure);
      const ideal=Math.min(dprTavan, window.devicePixelRatio||1);
      // Metin okunabilirliği için taban: cihaz DPR'ının %65'inin altına inme.
      const taban=Math.max(1.0, Math.min(1.5, ideal*0.65));
      isinma++;                       // ilk iki pencere ölçüm gürültüsü, atlanır
      if(isinma>2){
        if(fps<36 && dprHedef>taban+0.02){
          dprHedef=Math.max(taban, dprHedef-0.20); ren.setPixelRatio(dprHedef); resize();
        } else if(fps>50 && dprHedef<ideal-0.05){
          dprHedef=Math.min(ideal, dprHedef+0.35); ren.setPixelRatio(dprHedef); resize();
        }
      }
      kare=0; kareSure=0;
    }

    /* --- vitrin kamerası --- */
    if(VT.T){
      const bos=performance.now()-VT.son;
      if(bos>3200 && !Object.keys(VT.parmak).length) VT.hAci += dt*.16;   // döner tabla
      VT.gecis=Math.min(1, VT.gecis+dt*1.6);
      const yum=Math.min(1, dt*(VT.gecis<1?4.5:7));
      VT.T.lerp(VT.hT, yum);
      VT.aci  += (VT.hAci-VT.aci)*yum;
      VT.egim += (VT.hEgim-VT.egim)*Math.min(1,dt*7);
      VT.uzak += (VT.hUzak-VT.uzak)*Math.min(1,dt*6);
      /* Mesafe yatay görüş açısından: dik telefonda yatay açı dar, araç
         boyu ekrana sığacak kadar uzakta dur. Sabit bir mesafe kullanıldığında
         araç kadrajdan taşıyor, komşu araçlar önüne giriyordu. */
      const yarimV=THREE.MathUtils.degToRad(VFOV/2);
      const yarimY=Math.atan(Math.tan(yarimV)*Math.max(.35,cam.aspect));
      const R=clamp((VT.uzunluk*.50+.55)/Math.tan(yarimY), 4.6, 11)*VT.uzak;
      // giriş: sahne açılırken biraz uzaktan süzülerek yerine otur
      varis=Math.min(1, varis+dt*1.1);
      const v=1-Math.pow(1-varis,3), Rv=R*(1+(1-v)*.45);
      const ce=Math.cos(VT.egim);
      /* Kamera çitin dışına çıkmasın: döndürünce sahanın kenarındaki yeşil
         cam panellerin arkasına düşüp aracı camın ardından gösteriyordu.
         Yatay doğrultuda sınıra çarpan yarıçap kısaltılıyor. */
      const dx=Math.sin(VT.aci)*ce, dz=Math.cos(VT.aci)*ce;
      let Rk=Rv;
      if(dx>1e-3) Rk=Math.min(Rk,(SAHA.x-VT.T.x)/dx); else if(dx<-1e-3) Rk=Math.min(Rk,(-SAHA.x-VT.T.x)/dx);
      if(dz>1e-3) Rk=Math.min(Rk,(SAHA.z0-VT.T.z)/dz); else if(dz<-1e-3) Rk=Math.min(Rk,(SAHA.z1-VT.T.z)/dz);
      Rk=Math.max(Rk, VT.uzunluk*.62);
      cam.position.set(VT.T.x+dx*Rk, VT.T.y+Math.sin(VT.egim)*Math.max(Rk,Rv*.8)+.15, VT.T.z+dz*Rk);
      cam.lookAt(VT.T.x, VT.T.y, VT.T.z);
      if(Math.abs(cam.fov-VFOV)>.01){ cam.fov=VFOV; cam.updateProjectionMatrix(); }
      px=cam.position.x; pz=cam.position.z;
    }

    for(const f of CANLI){ try{ f(dt,t); }catch(e){} }
    ren.render(scene,cam);
  }

  function updateFocusBar(){
    const bar=document.getElementById("w3dbar");
    if(!bar) return;
    if(!focus){ bar.innerHTML=`<div class="w3dhint">${mode==="pazar"?"Pazarda ilan yok":"Garajın boş"}</div>`; return; }
    const c=focus.car;
    const fiyat = mode==="pazar" ? c.ask : (c.listPrice||valueOf(c,!c.inspected));
    const gz=(typeof gozDurum==="function")?gozDurum(c):"";
    bar.innerHTML=`
      <div class="w3dcar">
        <button class="w3dok" data-act="w3donce" aria-label="Önceki araç">&lsaquo;</button>
        <div style="min-width:0;flex:1">
          <div class="w3dname">${c.model.n} <span style="color:var(--muted)">${c.year}</span></div>
          <div class="w3dsub">${typeof mesafe==="function"?mesafe(c.km):c.km+" km"} · ${c.gear} · ${c.fuel}
            <span class="w3dsira">${VT.i+1}/${items.length}</span></div>
        </div>
        <div class="w3dprice">${tl(fiyat)}</div>
        <button class="w3dok" data-act="w3dsonra" aria-label="Sonraki araç">&rsaquo;</button>
      </div>
      ${gz}
      <button class="btn primary full" data-act="w3dopen">İncele</button>
      <div class="w3dhint">Sürükle: etrafında dön &middot; iki parmak: yakınlaş</div>`;
  }

  /* ---------- açma / kapama ---------- */
  function pause(){ if(raf){ cancelAnimationFrame(raf); raf=null; } }
  function resume(){ if(!raf && ren){ lastT=performance.now(); raf=requestAnimationFrame(tick); } }

  function dispose(){
    pause();
    if(scene){
      scene.traverse(o=>{
        if(o.geometry) o.geometry.dispose();
        if(o.material){
          const ms=Array.isArray(o.material)?o.material:[o.material];
          ms.forEach(m=>{ if(m.map) m.map.dispose(); m.dispose(); });
        }
      });
    }
    CANLI=[];
    for(const k in geoCache) delete geoCache[k];
    for(const k in texCache) delete texCache[k];
    if(ren){ ren.dispose(); if(ren.domElement.parentNode) ren.domElement.parentNode.removeChild(ren.domElement); }
    ren=scene=cam=null; items=[]; focus=null; ready=false;
  }

  /** Sahnenin içeriği değişti mi? (gün dönümü, satış, tamir, fiyat) */
  function damga(m){
    const md=m||mode;
    const liste = md==="pazar" ? (S.market||[]) : (S.cars||[]);
    let d=md+"|"+S.slots+"|"+liste.length;
    for(const c of liste) d+="|"+c.id+","+Math.round(c.listPrice||c.ask||0)+","
      +(c.inspected?1:0)+","+(c.disclosed?1:0)+","+(c.faults||[]).filter(f=>f.fixed).length;
    return d;
  }
  let kurulanDamga="";
  function guncel(m){ return ready && mode===m && kurulanDamga===damga(m); }

  function open(m, koru){
    const eskiX=px, eskiZ=pz, eskiYaw=yaw, eskiPitch=pitch;
    mode=m;
    const host=document.getElementById("world");
    if(!host) return false;
    if(typeof THREE==="undefined"){ failed=true; return false; }
    // Renk yönetimi: materyal renkleri de dokular gibi sRGB kabul edilsin.
    // Açık olmazsa düz renkli yüzeyler dokuluların yanında soluk/pastel görünür.
    try{
      if(THREE.ColorManagement){
        if("legacyMode" in THREE.ColorManagement) THREE.ColorManagement.legacyMode=false;
        if("enabled" in THREE.ColorManagement) THREE.ColorManagement.enabled=true;
      }
    }catch(e){}
    dispose();
    saatSec();
    host.classList.remove("hidden");
    document.getElementById("app").classList.add("in3d");

    try{
      ren=new THREE.WebGLRenderer({antialias:true, powerPreference:"high-performance",
        stencil:false, alpha:false});
    }catch(e){ failed=true; host.classList.add("hidden"); return false; }
    const dpr=window.devicePixelRatio||1;
    dprTavan=Math.min(dpr, 2.75);
    dprHedef=Math.min(dpr, dpr>2.2?2.2:dprTavan);
    ren.setPixelRatio(dprHedef); isinma=0;
    if(THREE.sRGBEncoding) ren.outputEncoding=THREE.sRGBEncoding;
    if(THREE.ACESFilmicToneMapping){
      ren.toneMapping=THREE.ACESFilmicToneMapping;
        ren.toneMappingExposure=SAAT.pozlama;
    }
    try{ ANISO=Math.min(8, ren.capabilities.getMaxAnisotropy()||4); }catch(e){ ANISO=4; }
    ren.shadowMap.enabled=true;
    ren.shadowMap.type=THREE.PCFSoftShadowMap;
    ren.shadowMap.autoUpdate=false;
    kare=0; kareSure=0; olcumT=performance.now();
    const kutu=document.getElementById("w3dcanvas");
    kutu.appendChild(ren.domElement);
    resize();

    scene=new THREE.Scene();
    cam=new THREE.PerspectiveCamera(60, 1, .1, 420);
    // resize() kameraya ihtiyaç duyuyor: kamera kurulmadan çağrılırsa tuval
    // 300x150 varsayılanında kalıyor ve sahne bulanık/soluk görünüyordu.
    resize();
    if(mode==="pazar"){ buildLot(); px=0; pz=13.5; yaw=0; }
    else { buildShowroom(); px=0; pz=7.5; yaw=0; }
    pitch=-0.10;
    if(koru){ px=clamp(eskiX,-bounds.x,bounds.x); pz=clamp(eskiZ,-bounds.z,bounds.z);
              yaw=eskiYaw; pitch=eskiPitch; }
    placeCars();
    focus=null; VT.T=null; VT.parmak={}; VT.pinch=null; VT.hEgim=VT.egim=.20;
    if(items.length) sec(koru?Math.min(VT.i,items.length-1):0, true); else updateFocusBar();
    kurulanDamga=damga(mode);
    if(ren.shadowMap) ren.shadowMap.needsUpdate=true;
    const yer=document.getElementById("w3dplace");
    if(yer) yer.textContent = mode==="pazar" ? "OTO PAZARI" : "GALERİN";
    // kamera: varış geçişi için bir tık geride/yukarıda başla (madde 14)
    camYaw=yaw; camPitch=pitch; camRoll=0; fov=60; hizYum=0; varis=0;
    // renk katmanı günün saatine göre (madde 15)
    const grade=document.getElementById("w3dgrade");
    if(grade) grade.style.setProperty("--w3dton", SAAT.vinyet);
    ready=true;
    requestAnimationFrame(()=>{ resize(); requestAnimationFrame(resize); });
    resume();
    perdeKapat();
    return true;
  }
  /* ---------- yükleme perdesi (madde 4) ---------- */
  function perdeAc(){
    const p=document.getElementById("w3dload");
    if(p){ p.classList.remove("bitti"); p.style.display="flex"; }
  }
  function perdeKapat(){
    const p=document.getElementById("w3dload");
    if(!p) return;
    // ilk gerçek kare çizildikten sonra kaldır, siyah bir an görünmesin
    let sayac=0;
    const bak=()=>{
      if(++sayac<3) return requestAnimationFrame(bak);
      p.classList.add("bitti");
      setTimeout(()=>{ if(p.classList.contains("bitti")) p.style.display="none"; }, 460);
    };
    requestAnimationFrame(bak);
  }
  function close(){
    dispose();
    const host=document.getElementById("world");
    if(host) host.classList.add("hidden");
    const app=document.getElementById("app");
    if(app) app.classList.remove("in3d");
  }
  function resize(){
    if(!ren||!cam) return;
    const kutu=document.getElementById("w3dcanvas");
    const w=kutu.clientWidth||window.innerWidth, h=kutu.clientHeight||window.innerHeight;
    ren.setSize(w,h,false);
    cam.aspect=w/h;
    // Alt bilgi kartı ekranın altını kaplıyor: görüntü merkezi yukarı
    // kaydırılıyor ki araç kartın arkasında değil üstünde dursun.
    cam.setViewOffset(w, h, 0, h*.13, w, h);
    cam.updateProjectionMatrix();
  }
  function refresh(){ if(ready){ const m=mode; open(m, true); } }

  window.W3D_buildCar=buildCar;
  window.W3D_profil3B=profil3B; window.W3D_imza3B=imza3B; window.W3D_SILVAR=SILVAR; window.W3D_AMB=AMBLEM;
  window.W3D_profil=silProfil; window.W3D_govde=govdeGeo;
  window.W3D_dbg=()=>({scene, cam, ren});
  function tp(x,z,y,pi){ px=x; pz=z; yaw=y; pitch=pi; }
  return {open, close, pause, resume, resize, refresh, tp, guncel, perdeAc,
          get focus(){ return focus; }, get active(){ return ready; }, get mode(){ return mode; },
          get failed(){ return failed; },
          onKey, pointerDown, pointerMove, pointerUp, tekerlek,
          sonraki:()=>sec(VT.i+1), onceki:()=>sec(VT.i-1), sec:(i)=>sec(i), yanaBak, isabet, dokun:(x,y)=>tapAt(x,y),
          aciAyarla:(a)=>{ VT.hAci=a; VT.aci=a; VT.son=performance.now()+4000; },
          get vitrin(){ return {i:VT.i, aci:VT.aci, uzak:VT.uzak, adet:items.length}; }};
})();
