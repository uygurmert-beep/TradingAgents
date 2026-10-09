/* ==================================================================
   GALERİNİN YERİ — yan görev katmanı

   Oyunun uzun vadedeki eksiği şuydu: park kontenjanı bir menü satırıydı.
   "+1 kontenjan · ₺450.000" diye bir düğme vardı, kimse ona basmak için
   bir sebep hissetmiyordu. Oysa gerçek galericinin en somut sıkıntısı
   yerdir: iyi araç gelir, yer yoktur.

   İki yan görev bunu kuruyor:

     KAÇAN KELEPİR   Yerin doluyken pazarda sıra dışı bir fırsat çıkarsa
                     oyuncu onu GÖRÜYOR ama alamıyor. Ertesi gün bir
                     rakip kapıyor ve kaça aldığını yazıyor. Büyüme
                     kararı menüden değil, bu acıdan doğuyor.

     YANDAKİ DÜKKÂN  Birkaç gün üst üste dolu kalırsan komşu dükkân
                     boşalıyor: +2 kontenjan, normalden ucuz, ama
                     yalnızca birkaç gün açık. Süreli karar — sermayeni
                     araca mı yere mi bağlayacaksın?

   Maliyet arketipe göre değişiyor (slotKat): Otoparkçı'nın yeri bol,
   büyütmesi ucuz ama kirası yüksek; Dilbaz'ın dükkânı ucuz, büyütmesi
   zor. Aynı oyun üç farklı büyüme eğrisiyle oynanıyor.
   ================================================================== */

const GALERI = {
  doluEsik:   3,     // kaç gün üst üste dolu kalınca komşu dükkân boşalır
  firsatOran: 0.82,  // kelepir sayılmak için istenen fiyat / gerçek değer
  firsatSans: 0.55,  // yer doluyken fırsatın gözüne çarpma olasılığı
  dukkanSlot: 2,     // komşu dükkân kaç kontenjan katıyor
  dukkanInd:  0.78   // iki kontenjanın toplam fiyatına uygulanan indirim
};

/** Pazardaki en iyi fırsat — gerçek değerine göre en ucuz araç. */
function enIyiFirsat(){
  let en=null, enOran=1;
  for(const c of S.market){
    const d=valueOf(c, !c.inspected);
    if(d<=0) continue;
    const oran=c.ask/d;
    if(oran<enOran){ enOran=oran; en=c; }
  }
  return (en && enOran<=GALERI.firsatOran) ? {car:en, oran:enOran} : null;
}

/** Gün sonunda çağrılır: yer doluysa kaçan fırsatı göster, dolu gün say. */
function yerGun(rep){
  if(yerDolu()) S.doluGun=(S.doluGun||0)+1; else S.doluGun=0;

  // önceki günün kaçan fırsatını bir rakip kapsın
  if(S.kacan){
    const k=S.kacan; S.kacan=null;
    const hala=S.market.find(c=>c.id===k.id);
    if(hala){
      const alan=(S.rivals&&S.rivals.length)
        ? S.rivals[Math.floor(Math.random()*S.rivals.length)].n : "bir galerici";
      S.market=S.market.filter(c=>c.id!==k.id);
      rep.events.push({bad:true, t:`${alan}, d&uuml;n yerin olmadığı i&ccedil;in bakamadığın `+
        `<b>${k.ad}</b>'i aldı &mdash; ${tl(k.fiyat)}. Senin ka&ccedil;ırdığın k&acirc;r ${tl(k.kar)}.`});
      S.stats.kacanFirsat=(S.stats.kacanFirsat||0)+1;
      S.stats.kacanKar=(S.stats.kacanKar||0)+k.kar;
    }
  }

  if(!yerDolu()) return;
  if(!chance(GALERI.firsatSans)) return;
  const f=enIyiFirsat();
  if(!f) return;
  const c=f.car, deger=valueOf(c, !c.inspected);
  S.kacan={id:c.id, ad:`${c.model.n} ${c.year}`, fiyat:c.ask,
           kar:Math.max(0, Math.round(deger-c.ask)), oran:f.oran};
  rep.events.push({bad:true, firsat:true,
    t:`<b>Yerin yok.</b> ${S.kacan.ad} &middot; ${tl(c.ask)} &mdash; `+
      `değerinin %${Math.round((1-f.oran)*100)} altında. Bir ara&ccedil; satmazsan yarın gider.`});

  // Üst üste dolu kalındıysa komşu dükkân boşalıyor
  if((S.doluGun||0)>=GALERI.doluEsik && !S.dukkan && S.slots<10){
    const tam=slotFiyat()+Math.round((PARA.slotTaban+S.slots*PARA.slotArtis)*slotKat());
    S.dukkan={bitis:S.day+PARA.dukkanGun, slot:GALERI.dukkanSlot,
              bedel:Math.round(tam*GALERI.dukkanInd/1000)*1000};
    rep.events.push({t:`<b>Yandaki d&uuml;kk&acirc;n boşaldı.</b> +${GALERI.dukkanSlot} kontenjan, `+
      `${tl(S.dukkan.bedel)}. ${PARA.dukkanGun} g&uuml;n i&ccedil;inde karar vermen gerek.`});
  }
  // süresi dolan teklif
  if(S.dukkan && S.day>S.dukkan.bitis){
    S.dukkan=null;
    rep.events.push({t:"Yandaki d&uuml;kk&acirc;nı başkası tuttu. Fırsat ka&ccedil;tı."});
  }
}

/** Galeri ekranındaki yer bloğu — kira, kontenjan ve süreli teklif. */
function yerBlok(){
  const dolu=S.cars.length, kap=S.slots;
  const sk=slotFiyat(), a=arketip();
  const d=S.dukkan;
  return `<section class="yer">
    <div class="yer-bas"><span class="yer-et">GALERİNİN YERİ</span>
      <span class="yer-rozet ${dolu>=kap?"dolu":""}">${dolu}/${kap} dolu</span></div>
    <div class="yer-kutu">
      ${Array.from({length:Math.min(kap,8)},(_,i)=>
        `<i class="${i<dolu?"var":""}"></i>`).join("")}
    </div>
    <div class="yer-satir"><span>Sezon kirası</span>
      <b>${tl(sezonKirasi())}</b></div>
    <div class="yer-satir"><span>G&uuml;nl&uuml;k payı</span>
      <b>${tl(gunlukKira())}</b></div>
    ${(()=>{ const h=hedef(), il=hedefIlerleme();
      return `<div class="yer-hedef" data-act="hedefac" role="button">
        <div class="yh-ust"><span>Sezon hedefi</span><b>${tlk(S.seasonProfit||0)} / ${tlk(h.tutar)}</b></div>
        <div class="hedefcubuk"><i style="width:${Math.round(il*100)}%"></i></div>
        <div class="yh-alt">${il>=1?"Tuttu &mdash; gelecek sezon kira donuk ve indirimli."
          :S.kiraDonuk?"Bu sezon kiran donuk. Yeni hedefi de tut, indirim s&uuml;rs&uuml;n."
          :"Tutarsa gelecek sezonun kirası donar ve indirilir."}</div></div>`; })()}
    <div class="yer-not">${a.n} olarak kiran ${a.kiraKat>1?"y&uuml;ksek":(a.kiraKat<1?"ucuz":"ortalama")},
      b&uuml;y&uuml;men ${a.slotKat>1?"pahalı":(a.slotKat<1?"ucuz":"ortalama")}. Seviye atladık&ccedil;a kira basamak atlıyor.</div>
    ${d?`<div class="yer-teklif">
      <div class="yt-bas">YANDAKİ D&Uuml;KK&Acirc;N <em>${Math.max(0,d.bitis-S.day+1)} g&uuml;n</em></div>
      <div class="yt-met">+${d.slot} kontenjan, tek seferde. Ayrı ayrı almaktan ucuz.</div>
      <button class="btn primary full" data-act="dukkanal" ${S.cash<d.bedel?"disabled":""}>
        Tut &middot; ${tl(d.bedel)}</button>
    </div>`:""}
    <button class="btn full" data-act="buyslot" style="margin-top:9px" ${S.cash<sk?"disabled":""}>
      +1 kontenjan &middot; ${tl(sk)}</button>
    ${(S.stats&&S.stats.kacanFirsat)?`<div class="yer-not alt">Yer yokken ${S.stats.kacanFirsat} fırsat ka&ccedil;ırdın
      &mdash; toplam ${tl(S.stats.kacanKar||0)} k&acirc;r.</div>`:""}
  </section>`;
}
