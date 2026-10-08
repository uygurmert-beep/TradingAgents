/* ==================================================================
   KOLEKSİYON DEFTERİ (madde 7) + SEZON LİGİ (madde 8) + PRESTİJ (madde 10)
   Üçü de aynı amaca hizmet ediyor: oyuncuya "bitti" demeyen uzun bir hat.
   ================================================================== */

/* ---------------- 7 · koleksiyon defteri ---------------- */
function kolKayit(){
  if(!S.koleksiyon) S.koleksiyon={};
  return S.koleksiyon;
}
function kolAlim(car){
  const k=kolKayit(), ad=car.model.n;
  const e=k[ad]||(k[ad]={al:0, sat:0, enKar:0, enIyiGun:0, ilkGun:S.day});
  e.al++;
}
function kolSatis(car, kar){
  const k=kolKayit(), ad=car.model.n;
  const e=k[ad]||(k[ad]={al:0, sat:0, enKar:0, enIyiGun:0, ilkGun:S.day});
  e.sat++;
  if(kar>e.enKar){ e.enKar=Math.round(kar); e.enIyiGun=S.day; }
  kolOdulKontrol();
}
function kolTamam(){
  const k=kolKayit();
  return MODELS.filter(m=>(k[m.n]||{}).sat>0).length;
}
/** Her 5 modelde bir ödül: uzmanlık puanı ve nakit. */
function kolOdulKontrol(){
  const n=kolTamam();
  S.kolOdul=S.kolOdul||0;
  // 130 model var: her 5'te bir ödül 26 uzmanlık puanı demek olurdu (7 uzmanlık
  // var). Kademe 10'a çıkıyor; nakit ödül her kademede büyüyor.
  const hak=Math.floor(n/10);
  while(S.kolOdul<hak){
    S.kolOdul++;
    S.perkPts=(S.perkPts||0)+1;
    const nakit=60000+S.kolOdul*40000;
    S.cash+=nakit;
    toast(`Defterde ${S.kolOdul*10} model tamam — +1 uzmanlık puanı, +${tl(nakit)}.`,"good");
  }
}
const SEG_SIRA=["hatch","sedan","suv","lux","ticari","klasik"];
function viewKoleksiyon(){
  const k=kolKayit();
  const n=kolTamam(), top=MODELS.length;
  const yuzdeTam=Math.round(n/top*100);
  const grup=SEG_SIRA.map(seg=>{
    const liste=MODELS.filter(m=>m.seg===seg);
    if(!liste.length) return "";
    const satir=liste.map(m=>{
      const e=k[m.n];
      const satildi=e&&e.sat>0;
      const gorulen=e&&(e.al>0||e.sat>0);
      return `<div class="kolsat ${satildi?"ok":(gorulen?"yari":"")}">
        <span class="koltik">${satildi?"&#10003;":(gorulen?"&middot;":"")}</span>
        <span class="kolad">${satildi||gorulen?m.n:"????"}</span>
        <span class="kolkar">${satildi?tlk(e.enKar):(gorulen?"elinde oldu":"&mdash;")}</span>
      </div>`;
    }).join("");
    return `<div class="block"><h4>${SEGLBL[seg]}</h4>${satir}</div>`;
  }).join("");
  return `
    <div class="block">
      <div class="kv"><span>Defterde tamamlanan</span><b>${n}/${top}</b></div>
      <div class="kolbar"><i style="width:${yuzdeTam}%"></i></div>
      <div class="sec-note" style="margin-top:6px">Bir modeli <strong>satınca</strong> deftere işlenir. Her 10 modelde bir uzmanlık puanı ve artan bir nakit ödül kazanırsın.</div>
    </div>
    ${grup}`;
}

/* ---------------- 8 · sezon ligi ---------------- */
/** Sezon başında herkesin kârı sıfırlanır; sezon sonunda sıralama ödüllenir. */
function ligBaslat(){
  S.lig={sezon:seasonIndex(), ben:0, rakip:(S.rivals||[]).map(()=>0)};
}
function ligBenKar(k){
  if(!S.lig) ligBaslat();
  S.lig.ben=(S.lig.ben||0)+Math.max(0,k);
}
function ligRakipGun(){
  if(!S.lig) ligBaslat();
  const r=S.rivals||[];
  for(let i=0;i<r.length;i++){
    // Rakipler her gün satış yaptıkça kâr biriktirir; seviyene göre ölçeklenir.
    const def=RIVAL_DEFS[i]||{aggr:.6};
    const taban=19000+level()*8500;
    S.lig.rakip[i]=(S.lig.rakip[i]||0)+Math.round(taban*def.aggr*rnd(.25,1.35));
  }
}
function ligTablo(){
  const r=S.rivals||[];
  const satir=[{n:"Senin galerin", k:Math.round((S.lig&&S.lig.ben)||0), me:true}]
    .concat(r.map((x,i)=>({n:x.n, k:Math.round(((S.lig&&S.lig.rakip[i])||0)), me:false})));
  satir.sort((a,b)=>b.k-a.k);
  return satir;
}
const LIG_ODUL=[{nakit:150000, xp:60, rep:4},{nakit:70000, xp:35, rep:2},
                {nakit:30000, xp:20, rep:0},{nakit:0, xp:10, rep:0},{nakit:0, xp:0, rep:-2}];
function ligKapat(){
  const t=ligTablo();
  const sira=t.findIndex(x=>x.me);
  const o=LIG_ODUL[Math.min(sira, LIG_ODUL.length-1)];
  S.cash+=o.nakit; S.xp+=o.xp;
  if(o.rep) S.rep=clamp(S.rep+o.rep,0,100);
  S.sonLig={sira:sira+1, tablo:t, odul:o};
  ligBaslat();
  return S.sonLig;
}
function ligKarti(){
  const t=ligTablo();
  return `<div class="block"><h4>SEZON LİGİ</h4>
    ${t.map((x,i)=>`<div class="ligsat ${x.me?"me":""}">
      <span class="ligno">${i+1}</span>
      <span class="ligad">${x.n}</span>
      <span class="ligkar">${tlk(x.k)}</span></div>`).join("")}
    <div class="sec-note" style="margin-top:6px">Sezon kapanınca ilk üç nakit ve uzmanlık puanı alır.</div>
  </div>` + rakipVitrin();
}

/* Rakibin vitrini. Daha önce rakipler sadece bir sıralama satırıydı; aracı
   sessizce alıp sessizce satıyorlardı. Artık ne aldıklarını ve kaça
   istediklerini görüyorsun — kendi fiyatını ona göre koyuyorsun. */
function rakipVitrin(){
  const r=(S.rivals||[]).filter(x=>x.stock&&x.stock.length);
  if(!r.length) return `<div class="block"><h4>RAKİP VİTRİNLERİ</h4>
    <div class="sec-note">Şu an rakiplerin vitrininde ara&ccedil; yok.</div></div>`;
  return `<div class="block"><h4>RAKİP VİTRİNLERİ</h4>
    ${r.map(x=>`<div class="vitrin">
      <div class="vitrin-bas">${x.n}<small>${x.d}</small></div>
      ${x.stock.map(it=>`<div class="vitrin-sat">
        <span class="vs-ad">${it.name}</span>
        <span class="vs-gun">${it.days} g&uuml;n</span>
        <span class="vs-fiyat">${tlk(it.ister||it.val)}</span></div>`).join("")}
    </div>`).join("")}
    <div class="sec-note" style="margin-top:8px">Aynı segmentte rakip ilanı varsa sana gelen alıcı seyreliyor.</div>
  </div>`;
}

/* ---------------- 10 · prestij: yeni şehir ---------------- */
function prestijBonus(){
  const p=S.prestij||0;
  return {slot:p, satisCarpan:1+p*0.04, baslangic:1+p*0.18, ad:p};
}
function prestijYap(){
  const p=(S.prestij||0)+1;
  const kol=S.koleksiyon||{};           // defter taşınır
  const kolOdul=S.kolOdul||0;
  const enIyi=Math.max(S.enIyiNetDeger||0, Math.round(netWorth()));
  const dil=I18N.lang;
  S=blankState();
  S.prestij=p; S.koleksiyon=kol; S.kolOdul=kolOdul; S.enIyiNetDeger=enIyi;
  const b=prestijBonus();
  S.started=false;                      // arketip seçimi yeniden
  save();
  dilAyarla(dil,false);
  renderIntro();
  document.getElementById("intro").classList.remove("hidden");
  toast(`Yeni şehir ${p}. kez açıldı — +${b.slot} park yeri, satışlarda +%${Math.round((b.satisCarpan-1)*100)}.`,"good");
}
function prestijKarti(){
  const p=S.prestij||0;
  const b=prestijBonus();
  return `<div class="block"><h4>YENİ ŞEHİR</h4>
    <div class="kv"><span>Taşınma sayısı</span><b>${p}</b></div>
    <div class="kv"><span>Kalıcı park yeri</span><b>+${b.slot}</b></div>
    <div class="kv"><span>Satışta kalıcı prim</span><b>+%${Math.round((b.satisCarpan-1)*100)}</b></div>
    <div class="kv"><span>Başlangıç sermayesi</span><b>+%${Math.round((b.baslangic-1)*100)}</b></div>
    <div class="sec-note" style="margin-top:6px">Dört galeriyi de devraldığında yeni bir şehre taşınabilirsin: defterin ve kalıcı primlerin seninle gelir, piyasa sıfırdan başlar.</div>
  </div>`;
}
