/* ==================================================================
   KOLAY OYNANIŞ — aynı derinlik, daha az dokunuş

   Bir aracı satışa hazırlamak 6–8 dokunuştu: ekspertiz, her tamiri tek
   tek, ilan dili, sunum, fiyat kaydırıcısı, yayınla. Usta oyuncu için
   bu ayrıntı değerli; ama her araçta tekrarlamak oyunu bir form doldurma
   işine çeviriyordu. Bu modül ayrıntıyı silmiyor, önüne kısa yollar
   koyuyor:

     HAZIRLA          ekspertiz → yalnız kendini amorti eden tamirler →
                      dürüst ilan → önerilen fiyat. Tek dokunuş, onaylı.
     SIRADAKİ ADIM    garaj kartında aracın şu an neyi beklediği.
     ÖNERİLEN TEKLİF  pazarlıkta ~%12 kâr payı bırakan alış tavanı.

   Kısa yollar hep "makul" seçimi yapar, en iyisini değil: en iyi kâr hâlâ
   elle ayarlanan ilan dilinde, sunumda ve fiyat pazarlığında.
   ================================================================== */
const KOLAY={ ilanKat:1.03, hedefPay:1.12 };

/** Bilinen ve yaptırılınca kendini amorti eden arızalar, en kârlıdan. */
function karliTamirler(c){
  return openFaults(c).filter(f=>known(c,f) && repairGain(c,f)>=repairCost(f))
    .sort((a,b)=>(repairGain(c,b)-repairCost(b))-(repairGain(c,a)-repairCost(a)));
}
function onerilenIlan(c){ return Math.round(valueOf(c,false)*KOLAY.ilanKat/500)*500; }

/** Hazırla'nın ne yapacağının özeti — onay penceresi için. */
function hazirlaPlan(c){
  const ep = c.inspected ? 0 : (c.gunun ? 0 : eksperFiyat());
  const tam = c.inspected ? karliTamirler(c) : null;     // ekspertizsizse sonra belli olur
  return {ep, tam, tamTutar: tam ? tam.reduce((a,f)=>a+repairCost(f),0) : null};
}
function hazirlaYap(c){
  if(!c || !c.owned || c.listPrice) return null;
  const sonuc={ep:0, yapilan:[], harcanan:0};
  if(!c.inspected){
    const ep=c.gunun?0:eksperFiyat();
    if(S.cash<ep){ toast("Ekspertize nakit yetmiyor.","bad"); return null; }
    S.cash-=ep; sonuc.ep=ep;
    c.inspected=true; cGain("hakan"); gorevIlerle("eksper"); notAl(c,true);
  }
  // Nakit yettiği kadar, en kârlı tamirden başla. Kasa hiç sıfırlanmasın:
  // bir sonraki alım için bir yastık bırak.
  const yastik=Math.min(150000, S.cash*0.15);
  for(const f of karliTamirler(c)){
    const bd=repairCost(f);
    if(S.cash-bd<yastik) continue;
    S.cash-=bd; c.spent+=bd; f.fixed=true; S.stats.repairs++;
    cGain("nuri"); gorevIlerle("tamir");
    sonuc.yapilan.push(f); sonuc.harcanan+=bd;
  }
  c.ilanDili="durust"; c.disclosed=true; c.sunum=c.sunum|0;
  c.listPrice=onerilenIlan(c); c.daysListed=0; c.leadsSeen=0;
  gorevIlerle("ilan");
  sonuc.fiyat=c.listPrice; sonuc.kar=c.listPrice-carCost(c);
  try{ cal("kasa"); dokun("al"); }catch(e){}
  save();
  return sonuc;
}
/** Araç sayfasında ilan formunun üstündeki kısa yol kartı. */
function hazirlaKart(c){
  if(!c.owned || c.listPrice) return "";
  const p=hazirlaPlan(c);
  const satir=[];
  if(!c.inspected) satir.push(`Ekspertiz ${p.ep?tl(p.ep):"bedava"}`);
  if(p.tam) satir.push(p.tam.length?`${p.tam.length} kârlı tamir · ${tl(p.tamTutar)}`:"Kârlı tamir yok");
  else satir.push("çıkan kusurlardan yalnız kârlı olanlar");
  satir.push(`dürüst ilan · ~${tlk(onerilenIlan(c))}`);
  const sanayi=(typeof sanayiyeKalan==="function") ? sanayiyeKalan() : 9;
  return `<section class="hazirla">
    <div class="hz-bas"><b>HAZIRLA</b><span>tek dokunuşla satışa</span></div>
    <div class="hz-adim">${satir.map(t=>`<span>${t}</span>`).join("<i>&rsaquo;</i>")}</div>
    ${p.tam&&p.tam.length&&sanayi>0&&sanayi<=2?`<div class="hz-not">${sanayi===1?"Yarın":"İki gün sonra"} sanayi günü: tamirler %30 ucuz olur.</div>`:""}
    <button class="btn primary full" data-act="hazirla" data-id="${c.id}">Hazırla ve ilana koy</button>
    <div class="hz-alt">Ayrıntılı ayar istersen aşağıda ilan dili, sunum ve fiyat duruyor.</div>
  </section>`;
}

/** Garaj kartında aracın şu an beklediği adım. */
function siradakiAdim(c){
  if(offerOf(c.id)) return {t:"Teklif geldi", tip:"sicak"};
  if(c.konsinye && konsKalan(c)<=1) return {t:"Emanet süresi bitiyor", tip:"uyari"};
  if(c.listPrice){
    if(c.daysListed>=8) return {t:"Fiyat kırmayı düşün", tip:"uyari"};
    return {t:`Satışta · ${c.daysListed} gün`, tip:""};
  }
  if(!c.inspected) return {t:"Ekspertiz bekliyor", tip:"adim"};
  const k=karliTamirler(c).length;
  if(k) return {t:`${k} kârlı tamir`, tip:"adim"};
  return {t:"İlana hazır", tip:"adim"};
}

/** Pazarlıkta ~%12 kâr bırakan alış tavanı. Görünen değere, bilinen
    kârlı tamirlerin NET katkısı (değer artışı − bedel) eklenir: kusur
    zaten görünen değeri düşürmüş durumda, bedeli bir daha düşmek onu iki
    kez saymak olur. */
function onerilenTeklif(c){
  const deger=valueOf(c, !c.inspected);
  const net=openFaults(c).filter(f=>known(c,f)).reduce((a,f)=>a+Math.max(0, repairGain(c,f)-repairCost(f)),0);
  const masraf=PARA.ekspertiz+PARA.otoparkGun*6;
  return Math.max(500, Math.round((deger+net-masraf)/KOLAY.hedefPay/500)*500);
}
