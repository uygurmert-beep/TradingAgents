/* ==================================================================
   HAFTALIK KARNE (madde 3)
   Her 7 oyun gününde bir: satış grafiği, en iyi iş, en büyük hata, rakip
   sıralaması ve bir harf notu. Amaç iki yönlü: oyuncuya kendi oyununu
   okutmak ve paylaşılabilir tek bir kare üretmek.
   Yeni sayaç tutmuyoruz — veri S.history, S.stats ve bir haftalık
   fotoğraftan (S.karneSnap) çıkıyor.
   ================================================================== */
const KARNE_GUN=7;

function karneFoto(){
  return {day:S.day, net:Math.round(netWorth()), sold:S.stats.sold||0,
          profit:Math.round(S.stats.profit||0), gider:Math.round(S.giderToplam||0),
          caught:S.stats.caught||0, rep:Math.round(S.rep), bought:S.stats.bought||0};
}
function karneGerek(){
  if(S.day<=KARNE_GUN) return false;
  const son=(S.karneSnap&&S.karneSnap.day)||1;
  return S.day-son>=KARNE_GUN;
}
/** A–F notu: haftalık özsermaye büyümesi, kâr marjı ve temizlik. */
function karneNot(k){
  let p=0;
  const buyume=k.netOnce>0 ? (k.net-k.netOnce)/k.netOnce : 0;
  if(buyume>=.22) p+=3; else if(buyume>=.12) p+=2; else if(buyume>=.04) p+=1;
  else if(buyume<-.06) p-=1;
  if(k.satis>=4) p+=2; else if(k.satis>=2) p+=1; else if(k.satis===0) p-=1;
  if(k.netKar>0) p+=1;
  if(k.yakalanan>0) p-=2;
  if(k.repDelta>=4) p+=1; else if(k.repDelta<=-4) p-=1;
  const harf=p>=6?"A":p>=4?"B":p>=2?"C":p>=0?"D":"F";
  const soz={A:"Piyasa seni konuşuyor.", B:"Sağlam bir hafta.",
             C:"İdare eder — ama marj dar.", D:"Zar zor döndün.",
             F:"Bu hafta para kaybettin."}[harf];
  return {harf, soz, puan:p};
}
function karneUret(){
  const snap=S.karneSnap||{day:1, net:0, sold:0, profit:0, gider:0, caught:0, rep:50, bought:0};
  const bas=snap.day, bit=S.day-1;
  const satislar=(S.history||[]).filter(h=>h.d>=bas && h.d<=bit);
  const netKar=satislar.reduce((s,h)=>s+h.profit,0);
  const gider=Math.round((S.giderToplam||0)-snap.gider);
  // günlük kâr çubukları
  const gunler=[];
  for(let d=bas; d<=bit; d++){
    const k=satislar.filter(h=>h.d===d).reduce((s,h)=>s+h.profit,0);
    gunler.push({gun:d, kar:Math.round(k), adet:satislar.filter(h=>h.d===d).length});
  }
  const siraliKar=[...satislar].sort((a,b)=>b.profit-a.profit);
  const enIyi=siraliKar[0]||null;
  const enKotu=siraliKar.length>1?siraliKar[siraliKar.length-1]:null;
  // en büyük hata: zararlı satış > yakalanma > elde çürüyen araç
  let hata=null;
  if(enKotu && enKotu.profit<0)
    hata={t:`${enKotu.n} zararına gitti`, d:`alış ${tlk(enKotu.buy)} → satış ${tlk(enKotu.sell)}`, v:enKotu.profit};
  else if((S.stats.caught||0)>snap.caught)
    hata={t:"Gizlediğin kusur yakalandı", d:`${(S.stats.caught||0)-snap.caught} alıcı ekspertizden sonra vazge&ccedil;ti`, v:0};
  else {
    const curuyen=[...S.cars].filter(c=>c.listPrice&&c.daysListed>=10)
      .sort((a,b)=>b.daysListed-a.daysListed)[0];
    if(curuyen) hata={t:`${curuyen.model.n} ${curuyen.daysListed} g&uuml;n ilanda`,
      d:"otopark ve sezon gideri k&acirc;rı yiyor — fiyatı kır", v:0};
    else if(!satislar.length) hata={t:"Bu hafta hi&ccedil; satış yok", d:"stok para yakıyor, fiyat ya da ilan sorunu var", v:0};
  }
  const tablo=standings();
  const sira=tablo.findIndex(x=>x.me)+1;
  const k={
    bas, bit, satis:satislar.length, alim:(S.stats.bought||0)-snap.bought,
    netKar:Math.round(netKar), gider, net:Math.round(netWorth()), netOnce:snap.net||1,
    yakalanan:(S.stats.caught||0)-snap.caught, repDelta:Math.round(S.rep)-snap.rep,
    gunler, enIyi, hata, sira, tablo, sezon:seasonOf(S.day).k,
    enUzun: gunler.length
  };
  k.not=karneNot(k);
  return k;
}
/** Günü bitirirken çağrılır: gerekiyorsa karneyi hazırla. */
function karneKontrol(){
  if(!karneGerek()) return false;
  S.karne=karneUret();
  S.karneSnap=karneFoto();
  return true;
}

function karneSatirlari(k){
  const tepe=Math.max(600, ...k.gunler.map(g=>Math.abs(g.kar)));
  return k.gunler.map(g=>{
    const h=Math.round(Math.abs(g.kar)/tepe*100);
    const art=g.kar>=0;
    return `<div class="krgun">
      <div class="krcub"><i class="${art?"art":"eks"}" style="height:${Math.max(g.kar?6:2,h)}%"></i></div>
      <span class="krno">${g.gun}</span>
    </div>`;
  }).join("");
}
function openKarne(){
  const k=S.karne; if(!k) return;
  const n=k.not;
  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">Haftalık karne</div>
        <div class="sheet-sub">${k.bas}&ndash;${k.bit}. g&uuml;n &middot; ${k.sezon}</div></div>
      <button class="x" data-act="karnekapat" aria-label="Kapat">&times;</button></div>

    <div class="karnekart" id="karneKart">
      <div class="krnot ${n.harf.toLowerCase()}"><b>${n.harf}</b><span>${n.soz}</span></div>
      <div class="krdort">
        <div><span>Satışlar</span><b>${k.satis}</b></div>
        <div><span>Net k&acirc;r</span><b class="${k.netKar>=0?"pos":"neg"}">${k.netKar>=0?"+":""}${tlk(k.netKar)}</b></div>
        <div><span>Gider</span><b class="neg">&minus;${tlk(k.gider)}</b></div>
        <div><span>Sıralama</span><b>${EN()?"#"+k.sira:k.sira+"."}</b></div>
      </div>
      <div class="krgraf">${karneSatirlari(k)}</div>
      <div class="sec-note" style="text-align:center;margin-top:2px">g&uuml;nl&uuml;k k&acirc;r</div>
    </div>

    <div class="block"><h4>HAFTANIN İŞİ</h4>
      ${k.enIyi?`<div class="kv"><span>${k.enIyi.n}<br>
        <small style="color:var(--muted-2)">alış ${tlk(k.enIyi.buy)} → satış ${tlk(k.enIyi.sell)} &middot; ${k.enIyi.d}. g&uuml;n</small></span>
        <b class="${k.enIyi.profit>=0?"pos":"neg"}">${k.enIyi.profit>=0?"+":""}${tl(k.enIyi.profit)}</b></div>`
        :`<div class="sec-note">Bu hafta satış olmadı.</div>`}
    </div>

    <div class="block" style="border-color:rgba(229,84,78,.26)"><h4>EN B&Uuml;Y&Uuml;K HATA</h4>
      ${k.hata?`<div style="font-size:13px;line-height:1.5"><b>${k.hata.t}</b>
        <div class="sec-note" style="margin-top:3px">${k.hata.d}</div></div>`
        :`<div class="sec-note">Temiz hafta — g&ouml;ze &ccedil;arpan bir hata yok.</div>`}
    </div>

    <div class="block"><h4>PİYASADAKİ GALERİLER</h4>
      ${k.tablo.map((x,i)=>`<div class="rankrow">
        <span style="${x.me?"color:var(--sodium);font-weight:600":""}">${i+1}. ${x.n}</span>
        <b class="mono" style="${x.me?"color:var(--sodium)":""}">${tlk(x.w)}</b></div>`).join("")}
    </div>

    <div class="btn-row">
      <button class="btn" data-act="karnekopya">&Ouml;zeti kopyala</button>
      <button class="btn primary" data-act="karnekapat">Devam</button>
    </div>`);
}
/** Paylaşılabilir metin: pano varsa panoya, yoksa paylaşım sayfasına. */
function karneMetni(){
  const k=S.karne; if(!k) return "";
  const cubuk=k.gunler.map(g=>g.kar>400?"█":g.kar>0?"▄":g.kar<0?"▁":"·").join("");
  return [
    `Pre-Loved Auto — ${EN()?"weekly report":"haftalık karne"} ${k.bas}-${k.bit}`,
    `${EN()?"Grade":"Not"}: ${k.not.harf} · ${k.satis} ${EN()?"sales":"satış"} · ${k.netKar>=0?"+":""}${tlk(k.netKar)}`,
    cubuk,
    `${EN()?"Rank":"Sıra"}: ${k.sira}/${k.tablo.length} · ${EN()?"net worth":"özsermaye"} ${tlk(k.net)}`
  ].join("\n");
}
function karneKopyala(){
  const t=karneMetni();
  const bitti=()=>toast(EN()?"Summary copied.":"Özet kopyalandı.","good");
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(t).then(bitti, ()=>karnePaylas(t));
      return;
    }
  }catch(e){}
  karnePaylas(t);
}
function karnePaylas(t){
  try{
    if(navigator.share){ navigator.share({text:t}).catch(()=>{}); return; }
  }catch(e){}
  // son çare: seçilebilir bir alan göster
  openSheet(`<div class="sheet-head"><div><div class="sheet-title">Haftalık özet</div>
      <div class="sheet-sub">Metni se&ccedil;ip kopyalayabilirsin</div></div>
      <button class="x" data-act="karnekapat">&times;</button></div>
    <textarea class="offer-input" readonly style="height:140px;text-align:left;font-size:13px;
      line-height:1.5;white-space:pre">${t}</textarea>
    <button class="btn primary full" data-act="karnekapat" style="margin-top:9px">Kapat</button>`);
}
