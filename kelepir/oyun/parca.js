/* ==================================================================
   PARÇA SEÇİMİ — orijinal, yan sanayi, çıkma

   Atölyenin tepesinde tek bir seçim: bu araçta hangi parçayla çalışılsın.
   Her satır için ayrı bir soru sormak tamiri form doldurmaya çeviriyordu;
   seçim atölye boyunca geçerli, satırlardaki bedel ve "değere katkı" ona
   göre yeniden hesaplanıyor. Kurallar game.js'teki PARCA tablosunda:
     • bedel: orijinalin kat'ı kadar
     • gerçek değerden düşen pay (kayip): ekspertize giden alıcı görür
     • geri gelme riski: araç sende kaldıkça her gün küçük bir zar
   Seçim arayüz durumu, kayda yazılmaz (CLAUDE.md §4.4).
   ================================================================== */
let PARCA_SECIM="orijinal";

function parcaBedel(f, tur){
  const k=(PARCA[tur]||PARCA.orijinal).kat;
  return k===1 ? repairCost(f) : Math.round(repairCost(f)*k/250)*250;
}
/** Bu parçayla yapılırsa aracın gerçek değeri ne kadar artar. */
function parcaKazanc(c, f, tur){
  const once=f.parca;
  f.parca = tur==="orijinal" ? undefined : tur;
  const g=repairGain(c, f);
  f.parca=once;
  return g;
}
/** Atölyenin üstündeki seçim şeridi. dosya: araç dosyasından mı açıldı. */
function parcaSecimHtml(c, dosya){
  return `<div class="parca-sec" role="radiogroup" aria-label="Parça kalitesi">
    ${Object.keys(PARCA).map(k=>`<button class="${PARCA_SECIM===k?"on":""}" data-act="parcasec" data-k="${k}"
      data-id="${c.id}" data-dosya="${dosya?1:0}" role="radio" aria-checked="${PARCA_SECIM===k}">
      <b>${PARCA[k].n}</b><span>${k==="orijinal"?"tam fiyat":"%"+Math.round((1-PARCA[k].kat)*100)+" ucuz"}</span></button>`).join("")}
  </div>
  <div class="parca-not">${PARCA[PARCA_SECIM].d}${PARCA_SECIM!=="orijinal"
    ?` &middot; 8 g&uuml;nde geri gelme ihtimali %${Math.round(PARCA[PARCA_SECIM].risk*100)}`:""}</div>`;
}
/** Atölye satırının alt yazısı — seçili parçaya göre. */
function parcaSatirAlt(c, f){
  const tur=PARCA_SECIM, bedel=parcaBedel(f,tur), g=parcaKazanc(c,f,tur);
  return {bedel, g, karli:g>=bedel,
    alt:`${COMPLBL[f.comp]} &middot; değere +${tlk(g)}${g>=bedel?" &middot; k&acirc;rlı":" &middot; maliyetini &ccedil;ıkarmaz"}`};
}
/** Tamir uygula: bedeli düş, parçayı arızaya yaz. Nuri'nin iyiliği bedava. */
function parcaTamir(car, f){
  const tur=PARCA_SECIM, bedel=parcaBedel(f,tur);
  const bedava=!!(S.favors&&S.favors.nuri);
  if(!bedava && S.cash<bedel){ toast("Nakit yetmiyor.","bad"); return null; }
  if(bedava){ S.favors.nuri=false; toast("Nuri bu tamiri bedava yaptı.","good"); }
  else S.cash-=bedel;
  car.spent+=bedava?0:bedel;
  f.fixed=true;
  if(tur==="orijinal"){ delete f.parca; delete f.parcaGun; }
  else { f.parca=tur; f.parcaGun=S.day; }
  return {bedel:bedava?0:bedel, tur};
}

/* Geri gelme: ucuz parça sende kaldıkça her gün küçük bir zar. Satılan
   aracın sorunu artık alıcının; burada yalnız garajdakiler. */
KANCA.gun.push(rep=>{
  for(const c of S.cars){
    for(const f of c.faults){
      if(!f.fixed || !f.parca || !PARCA[f.parca]) continue;
      if(!chance(PARCA[f.parca].risk/8)) continue;
      const tur=PARCA[f.parca].n.replace("&Ccedil;","Ç");
      f.fixed=false; f.visible=true; f.geriGeldi=true;
      delete f.parca; delete f.parcaGun;
      rep.events.push({bad:true, t:`${c.model.n}: ${tur.toLocaleLowerCase("tr")} parçayla yapılan <b>${f.n}</b> geri geldi. Arıza yeniden a&ccedil;ık.`});
    }
  }
});

KANCA.eylem.parcasec=(b, car)=>{
  if(!PARCA[b.dataset.k]) return;
  PARCA_SECIM=b.dataset.k;
  if(!car) return;
  if(b.dataset.dosya==="1") openCarFile(car.id); else openOwnCar(car);
};
