/* ==================================================================
   SES & HAPTİK
   Hiç ses dosyası yok: her efekt WebAudio ile anlık sentezleniyor.
   Böylece paket büyümüyor, yükleme gecikmesi olmuyor ve offline çalışıyor.
   İlk kullanıcı dokunuşunda bağlam açılır (mobil tarayıcı kuralı).
   ================================================================== */
const SES={
  ac:null, ana:null, acik:false, kapali:false, hazir:false,
  sonZaman:0, efekt:null, muzikBus:null, perde:1, sonPerde:{}
};
/* Ses grupları (1.3, audio-design): efektler ve müzik/ambiyans ayrı
   kanallardan ana çıkışa gider. Eskiden hepsi doğrudan anaya bağlıydı;
   müziği kısmak isteyen efektleri de kısıyordu ve satış akoru müziğin
   altında boğuluyordu. Seviyeler üç kademe: kısık / orta / tam. */
const SES_KADEME=[.35,.7,1];
function sesSeviyeOku(){
  try{ const v=JSON.parse(localStorage.getItem("preloved_seviye")||"null");
    return {efekt:v&&v.efekt!=null?v.efekt:2, muzik:v&&v.muzik!=null?v.muzik:2}; }
  catch(e){ return {efekt:2, muzik:2}; }
}
function sesSeviye(grup, kademe){
  const v=sesSeviyeOku();
  if(kademe!=null){ v[grup]=Math.max(0,Math.min(2,kademe|0));
    try{ localStorage.setItem("preloved_seviye", JSON.stringify(v)); }catch(e){} }
  if(SES.hazir){
    const node = grup==="efekt" ? SES.efekt : SES.muzikBus;
    if(node) node.gain.setTargetAtTime(SES_KADEME[v[grup]], SES.ac.currentTime, .05);
  }
  return v[grup];
}
/** Müziği kısa süre kıs (ducking): satış akoru ve kutlama duyulsun. */
function sesKis(sure){
  if(!SES.hazir || !SES.muzikBus) return;
  try{
    const g=SES.muzikBus.gain, t=SES.ac.currentTime, tam=SES_KADEME[sesSeviyeOku().muzik];
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(tam*.22, t+.08);
    g.setValueAtTime(tam*.22, t+(sure||1.4));
    g.linearRampToValueAtTime(tam, t+(sure||1.4)+.7);
  }catch(e){}
}
function sesAyarOku(){
  try{ return localStorage.getItem("preloved_ses")==="0"; }catch(e){ return false; }
}
function sesAyarYaz(k){ try{ localStorage.setItem("preloved_ses", k?"0":"1"); }catch(e){} }

function sesKur(){
  if(SES.hazir) return;
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC) return;
  try{
    SES.ac=new AC();
    SES.ana=SES.ac.createGain();
    SES.ana.gain.value=0.5;
    SES.ana.connect(SES.ac.destination);
    const sv=sesSeviyeOku();
    SES.efekt=SES.ac.createGain(); SES.efekt.gain.value=SES_KADEME[sv.efekt]; SES.efekt.connect(SES.ana);
    SES.muzikBus=SES.ac.createGain(); SES.muzikBus.gain.value=SES_KADEME[sv.muzik]; SES.muzikBus.connect(SES.ana);
    SES.hazir=true;
    SES.kapali=sesAyarOku();
    MUZ.acik=muzikAyarOku();
  }catch(e){ SES.hazir=false; }
}
function sesAc(){
  sesKur();
  if(SES.ac && SES.ac.state==="suspended")
    SES.ac.resume().then(muzikTazele, ()=>{});
  else muzikTazele();
}
/** İlk dokunuşta bağlam açıldığında bekleyen kipi gerçekten başlat. */
function muzikTazele(){
  if(!muzikAcikMi()) return;
  const k=MUZ.kip||"menu";
  if(!MUZ.tetik){ MUZ.kip=null; muzikKip(k); }
}
function sesKapaliMi(){ return SES.kapali; }
function sesAnahtar(){
  SES.kapali=!SES.kapali; sesAyarYaz(SES.kapali);
  if(SES.kapali) muzikDur();
  else { sesAc(); cal("tik"); muzikTazele(); }
  return SES.kapali;
}

/* --- temel üreteçler --- */
function _zarf(g, t0, a, d, s, r, tepe){
  g.gain.cancelScheduledValues(t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(tepe, t0+a);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001,tepe*s), t0+a+d);
  g.gain.exponentialRampToValueAtTime(0.0001, t0+a+d+r);
}
function _ton(frek, sure, tip, hacim, kayma){
  const ac=SES.ac, t0=ac.currentTime;
  const o=ac.createOscillator(), g=ac.createGain();
  o.type=tip||"sine";
  const p=SES.perde||1;
  o.frequency.setValueAtTime(frek*p, t0);
  if(kayma) o.frequency.exponentialRampToValueAtTime(Math.max(20,kayma*p), t0+sure);
  _zarf(g, t0, 0.006, sure*0.35, 0.35, sure*0.6, hacim||0.25);
  o.connect(g); g.connect(SES.efekt||SES.ana);
  o.start(t0); o.stop(t0+sure+0.08);
}
function _gurultu(sure, hacim, filtre, q){
  const ac=SES.ac, t0=ac.currentTime;
  const n=Math.floor(ac.sampleRate*sure);
  const buf=ac.createBuffer(1, n, ac.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
  const src=ac.createBufferSource(); src.buffer=buf;
  const bp=ac.createBiquadFilter();
  bp.type="bandpass"; bp.frequency.value=(filtre||1200)*(SES.perde||1); bp.Q.value=q||1.2;
  const g=ac.createGain();
  _zarf(g, t0, 0.004, sure*0.3, 0.2, sure*0.6, hacim||0.2);
  src.connect(bp); bp.connect(g); g.connect(SES.efekt||SES.ana);
  src.start(t0); src.stop(t0+sure+0.05);
}
function _akor(frekler, sure, hacim, gecikme){
  const p=SES.perde||1;     // gecikmeli notalar çalınırken perde sıfırlanmış olur; yakala
  frekler.forEach((f,i)=>setTimeout(()=>{ if(!SES.kapali) _ton(f*p, sure, "triangle", hacim); },
    i*(gecikme||70)));
}

/* --- efekt kataloğu --- */
const SESLER={
  tik:      ()=>_ton(1180, .035, "square", .05),
  sekme:    ()=>_ton(760, .05, "triangle", .10, 980),
  ac:       ()=>{ _ton(520,.07,"triangle",.10,780); },
  kapa:     ()=>{ _ton(620,.07,"triangle",.09,380); },
  para:     ()=>{ _akor([1245,1660,2490], .16, .13, 55); },
  kasa:     ()=>{ _ton(180,.10,"square",.10,120); setTimeout(()=>_gurultu(.18,.12,2600,1.4),60); },
  anahtar:  ()=>{ _gurultu(.09,.14,3400,2.6); setTimeout(()=>_gurultu(.07,.10,4200,3),70); },
  kaput:    ()=>{ _ton(96,.14,"sine",.22,62); _gurultu(.12,.12,420,1.1); },
  motor:    ()=>{ _ton(72,.55,"sawtooth",.10,120); },
  tamir:    ()=>{ _gurultu(.07,.14,2200,3); setTimeout(()=>_gurultu(.07,.12,1800,3),95);
                  setTimeout(()=>_gurultu(.08,.10,1500,3),190); },
  satis:    ()=>{ _akor([523,659,784,1047], .30, .14, 85); },
  buyukSatis:()=>{ _akor([1047,1319,1568,2093], .40, .10, 70); setTimeout(()=>_gurultu(.35,.05,6200,4),300); },
  alim:     ()=>{ _akor([392,523,659], .24, .12, 75); },
  hata:     ()=>{ _ton(220,.16,"square",.12,150); },
  uyari:    ()=>{ _ton(440,.10,"triangle",.11); setTimeout(()=>_ton(392,.14,"triangle",.11),110); },
  seviye:   ()=>{ _akor([523,659,784,1047,1319], .34, .15, 80); },
  gun:      ()=>{ _ton(294,.22,"triangle",.11); setTimeout(()=>_ton(392,.28,"triangle",.12),150); },
  teklif:   ()=>{ _ton(880,.09,"sine",.11); setTimeout(()=>_ton(1174,.12,"sine",.11),95); },
  reddet:   ()=>{ _ton(196,.20,"sawtooth",.09,140); },
  sayfa:    ()=>{ _gurultu(.10,.07,900,.8); }
};
const SES_DEGISKEN={tik:1, sekme:1, ac:1, kapa:1, para:1, kasa:1, anahtar:1, tamir:1, teklif:1, sayfa:1, hata:1};
function cal(ad){
  if(SES.kapali) return;
  if(!SES.hazir){ sesKur(); if(!SES.hazir) return; }
  if(SES.ac.state==="suspended") return;          // ilk dokunuş bekleniyor
  const now=performance.now();
  if(ad==="tik" && now-SES.sonZaman<40) return;   // tık spam'ini kes
  SES.sonZaman=now;
  const f=SESLER[ad];
  /* Tekrar eden seslerde küçük perde farkı: art arda on "tık" ya da "para"
     makineli tüfek gibi aynı duyuluyordu. ±%6 (bir yarım ton kadar), bir önceki
     ile aynı perdeye düşmesin. Müzikal akorlar (satış, seviye) sabit kalır. */
  SES.perde=1;
  if(SES_DEGISKEN[ad]){
    let p; do{ p=1+(Math.random()-.5)*.12; }while(Math.abs(p-(SES.sonPerde[ad]||0))<.008);
    SES.perde=SES.sonPerde[ad]=p;
  }
  if(f){ try{ f(); }catch(e){} }
  SES.perde=1;
}
/* ==================================================================
   MÜZİK VE AMBİYANS (madde 1)
   Hiç ses dosyası yok — her şey WebAudio ile anlık üretiliyor. Bu bilinçli
   bir karar: lisans belirsizliği sıfır, paket büyümüyor, çevrimdışı
   çalışıyor ve mod geçişleri anında oluyor.
   Üç kip var: menü (sıcak, yavaş), saha (seyrek, havadar + ambiyans yatağı),
   pazarlık (gergin nabız — satıcının sabrı azaldıkça yükselir).
   Zamanlama "lookahead" ile yapılıyor: 25 ms'lik bir tetik her seferinde
   önümüzdeki 180 ms'yi planlar, böylece sekme arkaya atılınca ritim kaymaz.
   ================================================================== */
const MUZ={
  acik:true, kip:null, bas:null, nabiz:0, zaman:0, tetik:null,
  gain:null, pad:null, amb:null, ambAcik:false, gerilim:0
};
function muzikAyarOku(){
  try{ const v=localStorage.getItem("preloved_muzik"); return v===null ? true : v==="1"; }
  catch(e){ return true; }
}
function muzikAyarYaz(a){ try{ localStorage.setItem("preloved_muzik", a?"1":"0"); }catch(e){} }
function muzikAcikMi(){ return MUZ.acik && !SES.kapali; }
function muzikAnahtar(){
  MUZ.acik=!MUZ.acik; muzikAyarYaz(MUZ.acik);
  if(!MUZ.acik) muzikDur();
  else { sesAc(); const k=MUZ.kip||"menu"; MUZ.kip=null; muzikKip(k); }
  return MUZ.acik;
}

/* --- kip tanımları: akor dizisi (yarım ton), tempo, karakter --- */
const MUZ_KIP={
  menu:   {bpm: 62, akor:[[0,3,7,10],[-4,0,3,7],[-7,-3,0,5],[-5,-1,2,7]],
           kok:[57,53,48,50], pad:.085, pluck:.055, yogun:.45, amb:false},
  saha:   {bpm: 54, akor:[[0,7,12],[2,7,11],[-3,4,9],[0,5,9]],
           kok:[50,52,45,48], pad:.055, pluck:.040, yogun:.26, amb:true},
  pazarlik:{bpm: 92, akor:[[0,3,7],[0,3,8],[0,2,7],[-1,3,6]],
           kok:[45,45,46,44], pad:.060, pluck:.050, yogun:.60, amb:false}
};
const _frk=(n)=>440*Math.pow(2,(n-69)/12);

function muzikKur(){
  sesKur();
  if(!SES.hazir) return false;
  if(!MUZ.gain){
    MUZ.gain=SES.ac.createGain();
    MUZ.gain.gain.value=0;
    MUZ.gain.connect(SES.muzikBus||SES.ana);
  }
  return true;
}
/** Kipi değiştir: aynı kip tekrar istenirse hiçbir şey yapılmaz. */
function muzikKip(kip, gerilim){
  if(gerilim!==undefined) MUZ.gerilim=clampSes(gerilim,0,1);
  if(!muzikAcikMi()){ MUZ.kip=kip; return; }
  if(!muzikKur()) return;
  if(SES.ac.state==="suspended") { MUZ.kip=kip; return; }   // ilk dokunuş bekleniyor
  if(MUZ.kip===kip && MUZ.tetik) return;
  MUZ.kip=kip;
  const d=MUZ_KIP[kip]; if(!d){ muzikDur(); return; }
  MUZ.bas=null; MUZ.nabiz=0;
  MUZ.zaman=SES.ac.currentTime+0.06;
  const hedef = kip==="pazarlik" ? 0.14 : (kip==="saha" ? 0.10 : 0.13);
  MUZ.gain.gain.cancelScheduledValues(SES.ac.currentTime);
  MUZ.gain.gain.setValueAtTime(Math.max(0.0001,MUZ.gain.gain.value), SES.ac.currentTime);
  MUZ.gain.gain.linearRampToValueAtTime(hedef, SES.ac.currentTime+1.1);
  if(d.amb) ambiyansAc(); else ambiyansKapa();
  if(!MUZ.tetik) MUZ.tetik=setInterval(muzikPlanla, 25);
}
function muzikDur(){
  if(MUZ.tetik){ clearInterval(MUZ.tetik); MUZ.tetik=null; }
  if(MUZ.gain && SES.hazir){
    try{
      MUZ.gain.gain.cancelScheduledValues(SES.ac.currentTime);
      MUZ.gain.gain.setValueAtTime(MUZ.gain.gain.value, SES.ac.currentTime);
      MUZ.gain.gain.linearRampToValueAtTime(0.0001, SES.ac.currentTime+0.35);
    }catch(e){}
  }
  ambiyansKapa();
  MUZ.kip=null;
}
const clampSes=(v,a,b)=>Math.max(a,Math.min(b,v));

/** Önümüzdeki 180 ms'yi planla. */
function muzikPlanla(){
  if(!muzikAcikMi() || !MUZ.kip || !SES.hazir) return;
  const d=MUZ_KIP[MUZ.kip]; if(!d) return;
  const ac=SES.ac;
  if(ac.state!=="running") return;
  const vuruş=60/d.bpm;
  let guard=0;
  while(MUZ.zaman < ac.currentTime+0.18 && guard++<24){
    const t=MUZ.zaman;
    const bar=Math.floor(MUZ.nabiz/4)%d.akor.length;
    const adim=MUZ.nabiz%4;
    const akor=d.akor[bar], kok=d.kok[bar];
    // --- bas: her barın başı ---
    if(adim===0) muzNota(kok-12, vuruş*3.1, "sine", d.pad*1.25, t, 420);
    // --- pad: bar başında yumuşak akor ---
    if(adim===0) for(let i=0;i<akor.length;i++)
      muzNota(kok+akor[i], vuruş*3.4, "triangle", d.pad*(i?0.52:0.68), t+i*0.012, 1600);
    // --- pluck: seyrek üst melodi ---
    const yogun = MUZ.kip==="pazarlik" ? d.yogun*(0.55+MUZ.gerilim*0.75) : d.yogun;
    if(adim!==0 && Math.random()<yogun){
      const n=kok+12+akor[Math.floor(Math.random()*akor.length)];
      muzNota(n, vuruş*0.85, "triangle", d.pluck, t+(Math.random()*0.03), 3200);
    }
    // --- pazarlık nabzı: gerilim yükseldikçe sertleşen vuruş ---
    if(MUZ.kip==="pazarlik" && adim%2===0)
      muzNota(kok-24, vuruş*0.32, "square", 0.030+MUZ.gerilim*0.045, t, 180);
    MUZ.nabiz++;
    MUZ.zaman += vuruş;
  }
}
function muzNota(nota, sure, tip, hacim, t0, lp){
  const ac=SES.ac;
  try{
    const o=ac.createOscillator(), g=ac.createGain(), f=ac.createBiquadFilter();
    o.type=tip; o.frequency.value=_frk(nota);
    f.type="lowpass"; f.frequency.value=lp||2000; f.Q.value=0.6;
    const a=Math.min(0.14, sure*0.22);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0005,hacim), t0+a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+sure);
    o.connect(f); f.connect(g); g.connect(MUZ.gain);
    o.start(t0); o.stop(t0+sure+0.05);
  }catch(e){}
}

/* --- ambiyans yatağı: rüzgâr + uzaktan geçen araç + kuş --- */
function ambiyansAc(){
  if(MUZ.ambAcik || !SES.hazir) return;
  const ac=SES.ac;
  try{
    const n=ac.sampleRate*2|0;
    const buf=ac.createBuffer(1,n,ac.sampleRate);
    const d=buf.getChannelData(0);
    let son=0;
    for(let i=0;i<n;i++){ const b=(Math.random()*2-1)*0.5; son=(son*0.94+b*0.06); d[i]=son*3.2; }
    const src=ac.createBufferSource(); src.buffer=buf; src.loop=true;
    const lp=ac.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=520; lp.Q.value=0.4;
    const g=ac.createGain(); g.gain.value=0.0001;
    src.connect(lp); lp.connect(g); g.connect(SES.muzikBus||SES.ana);
    src.start();
    g.gain.linearRampToValueAtTime(0.055, ac.currentTime+2.0);
    MUZ.amb={src, g, olay:null};
    MUZ.ambAcik=true;
    const olaylar=()=>{
      if(!MUZ.ambAcik) return;
      if(muzikAcikMi()){
        if(Math.random()<0.55) ambArac();
        else ambKus();
      }
      MUZ.amb.olay=setTimeout(olaylar, 4200+Math.random()*7000);
    };
    MUZ.amb.olay=setTimeout(olaylar, 2600+Math.random()*3000);
  }catch(e){ MUZ.ambAcik=false; }
}
function ambiyansKapa(){
  if(!MUZ.ambAcik || !MUZ.amb) return;
  const {src,g,olay}=MUZ.amb;
  MUZ.ambAcik=false;
  if(olay) clearTimeout(olay);
  try{
    g.gain.cancelScheduledValues(SES.ac.currentTime);
    g.gain.setValueAtTime(g.gain.value, SES.ac.currentTime);
    g.gain.linearRampToValueAtTime(0.0001, SES.ac.currentTime+0.5);
    setTimeout(()=>{ try{ src.stop(); }catch(e){} }, 700);
  }catch(e){}
  MUZ.amb=null;
}
/** Uzaktan geçen araç: bant geçiren gürültünün frekans süpürmesi. */
function ambArac(){
  try{
    const ac=SES.ac, t0=ac.currentTime, sure=1.6+Math.random()*1.2;
    const n=(ac.sampleRate*sure)|0;
    const buf=ac.createBuffer(1,n,ac.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<n;i++) d[i]=(Math.random()*2-1);
    const src=ac.createBufferSource(); src.buffer=buf;
    const bp=ac.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=1.1;
    bp.frequency.setValueAtTime(260, t0);
    bp.frequency.linearRampToValueAtTime(700, t0+sure*0.5);
    bp.frequency.linearRampToValueAtTime(240, t0+sure);
    const g=ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.045, t0+sure*0.45);
    g.gain.linearRampToValueAtTime(0.0001, t0+sure);
    src.connect(bp); bp.connect(g); g.connect(SES.muzikBus||SES.ana);
    src.start(t0); src.stop(t0+sure+0.05);
  }catch(e){}
}
/** Kuş: iki hızlı sinüs cıvıltısı. */
function ambKus(){
  try{
    const ac=SES.ac, t0=ac.currentTime+Math.random()*0.3;
    for(let i=0;i<2+((Math.random()*2)|0);i++){
      const o=ac.createOscillator(), g=ac.createGain();
      const t=t0+i*0.13, f=2300+Math.random()*1400;
      o.type="sine"; o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f*1.5, t+0.05);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.024, t+0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t+0.09);
      o.connect(g); g.connect(SES.muzikBus||SES.ana);
      o.start(t); o.stop(t+0.12);
    }
  }catch(e){}
}

/* --- haptik ---
   iOS'ta navigator.vibrate yok (WKWebView desteklemiyor), o yüzden kabukta
   Capacitor Haptics eklentisine düşüyoruz. Desen dizisi geldiğinde tek bir
   darbeye indiriyoruz — Haptics desen almıyor, şiddet alıyor. */
function _hapEklenti(){
  try{ const c=window.Capacitor; return (c && c.Plugins && c.Plugins.Haptics) || null; }catch(e){ return null; }
}
function titre(p){
  if(SES.kapali) return;
  const h=_hapEklenti();
  if(h){
    try{
      const sure = Array.isArray(p) ? p.reduce((a,b)=>a+b,0) : p;
      if(Array.isArray(p) && p.length>2 && h.notification){ h.notification({type:"SUCCESS"}); return; }
      const stil = sure>=34 ? "HEAVY" : (sure>=14 ? "MEDIUM" : "LIGHT");
      if(h.impact){ h.impact({style:stil}); return; }
      if(h.vibrate){ h.vibrate({duration: Math.min(120, Math.max(10, sure|0))}); return; }
    }catch(e){}
  }
  try{ if(navigator.vibrate) navigator.vibrate(p); }catch(e){}
}
const HAPTIK={ hafif:8, orta:18, cift:[14,40,14], basari:[10,50,10,50,24], hata:[40,60,40] };

/* --- ilk dokunuşta bağlamı aç --- */
(function sesBaslat(){
  const ac=()=>{ sesAc(); };
  ["pointerdown","touchstart","keydown"].forEach(e=>
    window.addEventListener(e, ac, {once:false, passive:true}));
})();
