/* ==================================================================
   KAPORA (1.4, test grubu M10)
   Bazı alıcılar (aile babası, genç sürücü, şehir dışından) anlaşınca hemen
   ödemez: satışın %3–5'i kadar kapora bırakır, 2–3 gün sonra gelir. Araç bu
   sürede "kaporalı": yer kaplar, ilan yarı yarıya alıcı çeker. Daha yüksek
   bir teklif gelirse ikilem: sözünü tut ya da kaporanın iki katını iade
   edip yeni alıcıya sat (itibar −2).
   STR'nin şartı: kapora bedava para olmasın. Alıcının gelme olasılığı ilan
   diline ve fiyat/değer oranına bağlı; abartılı ilanda alıcı aracı görünce
   kaçar ve çoğu kez kaporasını geri ister (itibar da düşer). Dürüst ilan
   kaporayı satışa çevirir.
   ================================================================== */
const KAPORA={ oran:[.03,.05], gun:[2,3],
  tip:{aile:.35, genc:.30, uzak:.45},                 // alıcı tipine göre kapora bırakma olasılığı
  gel:{durust:.93, muglak:.80, abartili:.52},         // ilan diline göre gelme olasılığı
  iade:.6 };                                           // abartılıda gelmeyenin kaporasını geri isteme olasılığı

/** Bu alıcı bu satışta kapora mı bırakır? Taksit ve takas satışlarında yok. */
function kaporaAday(s, car){
  if(!acikMi("kapora") || !s || !s.bt || s.takas || s.taksit || !car || car.kapora) return false;
  const p=KAPORA.tip[s.bt.k]||0;
  return p>0 && chance(p);
}
function kaporaAl(car, fiyat, bt){
  const tutar=Math.round(fiyat*rnd(KAPORA.oran[0],KAPORA.oran[1])/500)*500;
  car.kapora={tutar, fiyat, gelis:S.day+ri(KAPORA.gun[0],KAPORA.gun[1]), alici:bt?bt.n:"Alıcı", k:bt?bt.k:"", gun:S.day};
  kasaHareket(tutar, `Kapora: ${car.model.n}`);
  save();
  return car.kapora;
}
/** Alıcının gelme olasılığı: ilan dili ve fiyatın değere oranı. */
function kaporaGelmeOlasiligi(car){
  let p=KAPORA.gel[car.ilanDili||"muglak"] ?? .8;
  const oran=car.kapora.fiyat/Math.max(1,valueOf(car,false));
  if(oran>1.08) p-=.10;
  if(oran>1.18) p-=.10;
  return clamp(p,.2,.97);
}
/** Kaporalı araca başka alıcıya satış: kaporanın iki katı iade, itibar −2. */
function kaporaBoz(car){
  if(!car || !car.kapora) return 0;
  const k=car.kapora, iade=k.tutar*2;
  kasaHareket(-iade, `Kapora iadesi (iki katı): ${car.model.n}`);
  S.rep=clamp(S.rep-2,0,100);
  car.kapora=null;
  toast(`${k.alici} aradı: "Söz vermiştin." Kaporanın iki katı ${tl(iade)} iade edildi, itibar −2.`,"bad");
  return iade;
}

KANCA.gun.push(rep=>{
  for(const car of [...S.cars]){
    const k=car.kapora; if(!k || k.gelis>S.day-1) continue;      // gece işlenen gün = dün
    if(chance(kaporaGelmeOlasiligi(car))){
      // kalan ödeme: kapora zaten kasada, satış tutarı tamdan sayılır
      S.cash-=k.tutar; kasaNot(-k.tutar, `Kapora satıştan düşüldü: ${car.model.n}`);
      car.kapora=null;
      sellCar(car, k.fiyat, "kaporalı");
      const kar=S.lastDeal?S.lastDeal.profit:0;
      rep.events.push({t:`<b>${k.alici} geldi,</b> kalanı ödedi: ${car.model.n} ${tl(k.fiyat)}'ye satıldı${kar?` (${kar>=0?"+":"−"}${tl(Math.abs(kar))})`:""}.`});
    }else{
      car.kapora=null;
      if(car.ilanDili==="abartili" && chance(KAPORA.iade)){
        kasaHareket(-k.tutar, `Kapora iadesi: ${car.model.n}`);
        S.rep=clamp(S.rep-2,0,100);
        rep.events.push({bad:true, t:`${k.alici} aracı görünce "ilandaki gibi değil" dedi, kaporasını geri aldı. İtibar −2. ${car.model.n} yeniden ilanda.`});
      }else{
        rep.events.push({bad:true, t:`${k.alici} gelmedi. Kapora ${tl(k.tutar)} kasada kaldı; ${car.model.n} yeniden ilanda.`});
      }
    }
  }
});
