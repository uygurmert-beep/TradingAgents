/* ==================================================================
   HAKEM HEYETİ (1.4, test grubu M1) — yalanın gecikmeli faturası
   Muğlak ya da abartılı ilanla satılan, gizli kusuru söylenmemiş araç
   4–12 gün sonra "ayıplı mal" şikâyetiyle döner. Satış artık bitiş değil.
   Olasılık: kusurun ağırlığı × alıcı tipi (meraklı ve aile babası peşini
   bırakmaz, galerici bırakır) × ilan dili. Oyuncunun üç yolu var:
     uzlaş   — kusur bedelini öde, itibar −1
     geri al — satış bedelini iade et, araç kusurlu hâliyle garaja döner
     itiraz  — ekspertiz raporu dosyadaysa heyet çoğu kez sana hak verir;
               kaybedersen bedel +%30 ve itibar −4
   3 gün içinde cevap verilmezse heyet alıcı lehine karar verir (bedel +%30,
   itibar −3). Dürüst ilanla satılan araç şikâyet almaz; ekspertizin
   satıştan sonra da bir değeri olur.
   ================================================================== */
/* Ayar (1.4 simülasyonu, 1.500 araç × 3 dil): şikâyet yokken muğlak ilan
   dürüstün zaten ~%49 gerisinde (yakalanma cezası). İlk ayarda (.30/.55,
   tavan %25) muğlak %85 geriye düştü — STR "muğlak dil tamamen ölmesin"
   demişti. Şikâyet yalnız yakalanmadan geçen yalanı vurur; abartılıyı daha
   sert. */
const SIKAYET={
  dil:{muglak:.10, abartili:.40, durust:0},
  tavan:.12,
  tip:{merakli:1.4, aile:1.3, genc:1.0, uzak:.8, esnaf:.9, galerici:.25},
  sure:3, ceza:1.3, itirazRapor:.65, itirazRaporsuz:.15
};
/** Satış anında çağrılır: şikâyet gelecekse şimdiden takvime yazılır. */
function sikayetKaydet(car, fiyat, bt){
  if(!acikMi("sikayet") || !car || car.disclosed) return;
  const dil=car.ilanDili||"muglak";
  const pDil=SIKAYET.dil[dil]; if(!pDil) return;
  const kusur=hiddenIssues(car); if(!kusur.length) return;
  const deger=valueOf(car,false);
  const kesinti=Math.min(SIKAYET.tavan, kusur.reduce((a,k)=>a+(k.cut||.03),0));
  const p=Math.min(.85, pDil*(SIKAYET.tip[bt&&bt.k]??1)*Math.min(1.6, .5+kesinti*6));
  if(!chance(p)) return;
  if(!S.sikayet) S.sikayet=[];
  S.sikayet.push({id:Date.now()+Math.random(), car, fiyat, kusur:kusur.slice(0,2).map(k=>k.t),
    bedel:Math.max(5000, Math.round(deger*kesinti/500)*500), alici:bt?bt.n:"Alıcı",
    rapor:!!car.inspected, gelis:S.day+ri(4,12), acildi:null});
}
function sikayetAcik(){ return (S.sikayet||[]).filter(s=>s.acildi!=null); }

KANCA.gun.push(rep=>{
  const liste=S.sikayet||[];
  for(const s of [...liste]){
    if(s.acildi==null && s.gelis<=S.day){
      s.acildi=S.day;
      rep.events.push({bad:true, sikayet:true,
        t:`<b>Hakem heyeti:</b> ${s.alici}, ${s.car.model.n} için "ayıplı mal" başvurusu yaptı: ${s.kusur[0]}. ${SIKAYET.sure} gün içinde cevap ver.`});
    }else if(s.acildi!=null && S.day-s.acildi>=SIKAYET.sure){
      // cevapsız dosya: heyet alıcı lehine
      const t=Math.round(s.bedel*SIKAYET.ceza/500)*500;
      kasaHareket(-t, `Hakem heyeti kararı: ${s.car.model.n}`);
      S.rep=clamp(S.rep-3,0,100);
      S.sikayet=S.sikayet.filter(x=>x!==s);
      rep.events.push({bad:true, t:`Hakem heyeti cevapsız dosyada alıcı lehine karar verdi: ${tl(t)} ödendi, itibar −3 (${s.car.model.n}).`});
    }
  }
});

KANCA.ikon.sikayet='<path d="M12 3v18M5 7h14M7 7l-3 7a3 3 0 0 0 6 0zM17 7l-3 7a3 3 0 0 0 6 0z"/>';
KANCA.ray.push(()=>sikayetAcik().map(s=>({ik:"sikayet", act:"sikayetac", data:`data-sid="${s.id}"`,
  bas:"Hakem heyeti", alt:`${s.car.model.n} · ${Math.max(0,SIKAYET.sure-(S.day-s.acildi))} gün`, rozet:"!", sinif:"acil"})));

function openSikayet(sid){
  const s=(S.sikayet||[]).find(x=>String(x.id)===String(sid)) || sikayetAcik()[0]; if(!s) return;
  const kalan=Math.max(0, SIKAYET.sure-(S.day-s.acildi));
  const yerYok=S.cars.length>=S.slots;
  const pItiraz=Math.round((s.rapor?SIKAYET.itirazRapor:SIKAYET.itirazRaporsuz)*100);
  openSheet(`<div class="sheet-head"><div><div class="sheet-title">Hakem heyeti</div>
      <div class="sheet-sub">${s.car.model.n} ${s.car.year} &middot; ${s.alici} &middot; ${kalan} gün</div></div>
      <button class="x" data-act="closesheet" aria-label="Kapat">&times;</button></div>
    <div class="block"><h4>BAŞVURU</h4>
      <div style="font-size:14px;line-height:1.5">"Aracı ${tl(s.fiyat)}'ye aldım, ilanda yazmıyordu: <b>${s.kusur.join(", ")}</b>. Bedelini istiyorum."</div>
      <div class="kv" style="margin-top:8px"><span>Talep edilen</span><b class="neg">${tl(s.bedel)}</b></div>
      <div class="kv"><span>Ekspertiz raporu dosyada</span><b class="${s.rapor?"pos":"neg"}">${s.rapor?"Var":"Yok"}</b></div>
    </div>
    <button class="mv" style="width:100%;margin-bottom:8px" data-act="sikayetuzlas" data-sid="${s.id}">
      <b>Uzlaş &middot; ${tl(s.bedel)}</b><span>Bedeli öde, dosya kapanır. İtibar −1.</span></button>
    <button class="mv" style="width:100%;margin-bottom:8px" data-act="sikayetgerial" data-sid="${s.id}" ${yerYok?"disabled":""}>
      <b>Aracı geri al &middot; ${tl(s.fiyat)}</b><span>${yerYok?"Park yerin dolu.":"Satış bedelini iade et, araç kusuruyla garaja döner. İtibar değişmez."}</span></button>
    <button class="mv" style="width:100%;margin-bottom:8px" data-act="sikayetitiraz" data-sid="${s.id}">
      <b>İtiraz et &middot; ~%${pItiraz} şans</b><span>Kazanırsan bir şey ödemezsin. Kaybedersen ${tl(Math.round(s.bedel*SIKAYET.ceza/500)*500)} ve itibar −4.</span></button>
    <div class="sec-note">Ekspertiz raporu dosyadaysa heyet çoğu kez "alıcı da görebilirdi" der. ${kalan} gün içinde cevap vermezsen heyet alıcı lehine karar verir.</div>`);
}
function sikayetKapat(s){ S.sikayet=(S.sikayet||[]).filter(x=>x!==s); save(); closeSheet(); render(); }
function _skBul(b){ return (S.sikayet||[]).find(x=>String(x.id)===String(b.dataset.sid)); }
KANCA.eylem.sikayetac=(b)=>openSikayet(b.dataset.sid);
KANCA.eylem.sikayetuzlas=(b)=>{ const s=_skBul(b); if(!s) return;
  kasaHareket(-s.bedel, `Uzlaşma: ${s.car.model.n}`); S.rep=clamp(S.rep-1,0,100);
  toast(`Uzlaşıldı: ${tl(s.bedel)} ödendi, dosya kapandı.`); sikayetKapat(s); };
KANCA.eylem.sikayetgerial=(b)=>{ const s=_skBul(b); if(!s) return;
  if(S.cars.length>=S.slots){ toast("Park yerin dolu.","bad"); return; }
  kasaHareket(-s.fiyat, `Geri alım: ${s.car.model.n}`);
  const c=s.car; c.owned=true; c.boughtFor=s.fiyat; c.spent=0; c.listPrice=null; c.ilkIlan=null; c.kapora=null;
  c.daysListed=0; c.leadsSeen=0; c.boughtDay=S.day; c.boughtVia="geri alım"; c.boughtFrom=s.alici;
  S.cars.push(c);
  toast(`${c.model.n} geri alındı; kusuruyla garajda. Bu kez dürüst ilanla sat.`); sikayetKapat(s); };
KANCA.eylem.sikayetitiraz=(b)=>{ const s=_skBul(b); if(!s) return;
  if(chance(s.rapor?SIKAYET.itirazRapor:SIKAYET.itirazRaporsuz)){
    toast("Heyet itirazını haklı buldu: ekspertiz raporu dosyadaydı. Bir şey ödemedin.","good");
    try{ cal("satis"); }catch(e){}
  }else{
    const t=Math.round(s.bedel*SIKAYET.ceza/500)*500;
    kasaHareket(-t, `Hakem heyeti kararı: ${s.car.model.n}`); S.rep=clamp(S.rep-4,0,100);
    toast(`İtiraz reddedildi: ${tl(t)} ödendi, itibar −4.`,"bad");
  }
  sikayetKapat(s); };
