/* ==================================================================
   TÜRKİYE SIRALAMASI
   Sunucu yok, hesap yok, internet yok — oyun çevrimdışı çalışıyor.
   Onun yerine sabit tohumlu bir ulusal merdiven: 60 sanal galeri, her
   birinin kendi büyüme eğrisi var ve gün geçtikçe yükseliyorlar.
   Oyuncu bu merdivende kendi özsermayesiyle bir yere oturuyor.
   Dürüstlük notu: bunun gerçek oyuncular olmadığı ekranda yazıyor.
   ================================================================== */
const SIRA_AD1=["Yıldız","Gü​ven","Anadolu","Ege","Marmara","Başkent","Deniz","Şafak","Zirve",
  "Çınar","Pusula","Köprü","Kuzey","Akdeniz","Boğaz","Hilal","Meydan","Fırat","Toros","Sahil"];
const SIRA_AD2=["Oto","Motors","Otomotiv","Galeri","Auto","Araç","Car","Oto Center"];
const SIRA_SAYI=60;

function _siraTohum(n){
  let h=(2166136261^n)>>>0;
  for(let i=0;i<4;i++){ h=Math.imul(h^(h>>>13), 16777619)>>>0; }
  return h>>>0;
}
function _sr(n,k){ const t=_siraTohum(n*97+k*7919); return (t%100000)/100000; }

/** Sanal galerilerin listesi. Her çağrıda aynı — tohum sabit. */
function ulusalListe(gun){
  const out=[];
  for(let i=0;i<SIRA_SAYI;i++){
    const a=SIRA_AD1[_siraTohum(i*3+1)%SIRA_AD1.length];
    const b=SIRA_AD2[_siraTohum(i*5+2)%SIRA_AD2.length];
    // taban 600 bin ile 9 milyon arası, büyüme günlük %0,4 ile %2,6 arası
    const taban = 600000 + _sr(i,1)*8400000;
    const oran  = 0.004 + _sr(i,2)*0.022;
    const deger = Math.round(taban*Math.pow(1+oran, Math.max(0,gun-1)));
    out.push({n:`${a} ${b}`, deger, me:false});
  }
  return out;
}
/** Oyuncunun ulusal merdivendeki yeri. */
function ulusalSira(){
  const gun=S.day, benim=Math.round(netWorth());
  const liste=ulusalListe(gun);
  liste.push({n:lotAd(), deger:benim, me:true});
  liste.sort((a,b)=>b.deger-a.deger);
  const sira=liste.findIndex(x=>x.me)+1;
  const toplam=liste.length;
  const dilim=Math.max(1, Math.ceil(sira/toplam*100));   // "en iyi %X'lik dilim"
  const ust=liste[sira-2]||null;          // bir üstteki
  return {liste, sira, toplam, dilim, benim, ust,
          fark: ust ? ust.deger-benim : 0};
}
/** Defterdeki ulusal sıralama kartı. */
function ulusalKart(){
  const u=ulusalSira();
  const bas=Math.max(0, u.sira-4), son=Math.min(u.toplam, u.sira+3);
  const dilim=u.liste.slice(bas, son);
  return `<div class="block"><h4>T&Uuml;RKİYE SIRALAMASI</h4>
    <div class="siraust">
      <div class="sirano"><b>${u.sira}</b><span>/ ${u.toplam}</span></div>
      <div class="sirayan">
        <div class="sirayuzde">En iyi %${u.dilim}'lik dilimdesin</div>
        ${u.ust?`<div class="sec-note">Bir &uuml;sttekini ge&ccedil;mek i&ccedil;in ${tl(u.fark)} daha gerek.</div>`
               :`<div class="sec-note">Listenin tepesindesin.</div>`}
      </div>
    </div>
    <div class="siralist">
      ${dilim.map((x,i)=>{
        const no=bas+i+1;
        return `<div class="sirasat ${x.me?"me":""}">
          <span class="sno">${no}</span>
          <span class="sad">${x.n}</span>
          <span class="sdeg">${tlk(x.deger)}</span></div>`;}).join("")}
    </div>
    <div class="sec-note" style="margin-top:8px">Bu galeriler oyunun kendi &uuml;rettiği
    rakipler &mdash; ger&ccedil;ek oyuncular değil. Oyun &ccedil;evrimdışı &ccedil;alışıyor,
    hi&ccedil;bir verin dışarı &ccedil;ıkmıyor. Herkeste aynı merdiven var, kıyas adil.</div>
  </div>`;
}
