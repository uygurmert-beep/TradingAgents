/* ==================================================================
   PİYASA NABZI — segment fiyat endeksi

   Fiyatları zaten sezon çarpanı ve piyasa olayları oynatıyordu ama oyuncu
   bunu yalnız sonuçtan (satış geç geldi, teklif düşük) seziyordu. Burada
   iki şey var:
     1. Segment dalgası: her segmentin yavaş, ortalamaya dönen bir fiyat
        dalgası (±%8). game.js valueOf onu çarpıyor — yani grafik süs
        değil, aracın gerçek değeri o eğriyle birlikte yürüyor.
     2. Grafik: son 30 günün endeksi (sezon × olay × dalga) ve önümüzdeki
        7 günün takvim tahmini. Takvim (sezon) bilinir; dalga ve olaylar
        bilinmez — tahmin kesikli ve yalnız takvimi gösteriyor.
   Ucuzken al, yükselirken sat: ezber yerine zamanlama.
   ================================================================== */
const NABIZ={ gun:30, tahmin:7, dalgaSinir:.08, donus:.9, oynaklik:.012 };
const NABIZ_SEG=["hatch","sedan","suv","ticari","lux","klasik"];

function nabizDurum(){
  if(!S.nabiz || !S.nabiz.d){
    // ilk açılış: geçmiş dalgasız, yalnız takvimden doldurulur
    const g={}, d={};
    for(const seg of NABIZ_SEG){
      d[seg]=0; g[seg]=[];
      for(let i=NABIZ.gun-1;i>=0;i--) g[seg].push(Math.round(seasonMul(Math.max(1,S.day-i),seg)*1000));
    }
    S.nabiz={d, g};
  }
  return S.nabiz;
}
/** valueOf çarpanı. S yokken (test, denge botu) etkisiz. */
function nabizKat(seg){
  if(typeof S==="undefined" || !S || !S.nabiz || !S.nabiz.d) return 1;
  return 1+(S.nabiz.d[seg]||0);
}
function nabizEndeks(seg, gun){ return seasonMul(gun,seg)*evMul("val",seg)*nabizKat(seg); }

KANCA.gun.push(()=>{
  const n=nabizDurum();
  for(const seg of NABIZ_SEG){
    // ortalamaya dönen rastgele yürüyüş: bugünün %90'ı + küçük bir sarsıntı
    const sars=(Math.random()+Math.random()+Math.random()-1.5)*2*NABIZ.oynaklik;
    n.d[seg]=clamp(n.d[seg]*NABIZ.donus+sars, -NABIZ.dalgaSinir, NABIZ.dalgaSinir);
    n.g[seg].push(Math.round(nabizEndeks(seg, S.day)*1000));
    if(n.g[seg].length>NABIZ.gun) n.g[seg].splice(0, n.g[seg].length-NABIZ.gun);
  }
});

/** Son 7 günde yüzde değişim. */
function nabizDegisim(seg){
  const g=nabizDurum().g[seg]; if(!g||g.length<2) return 0;
  const once=g[Math.max(0,g.length-8)], son=g[g.length-1];
  return (son-once)/once*100;
}
function nabizTahmin(seg){
  const n=nabizDurum(), out=[];
  for(let i=1;i<=NABIZ.tahmin;i++)
    out.push(Math.round(seasonMul(S.day+i,seg)*(1+(n.d[seg]||0)*Math.pow(NABIZ.donus,i))*1000));
  return out;
}
function _nbYuzde(x){ return (x>0?"+":x<0?"−":"")+Math.abs(x).toFixed(1).replace(".",",")+"%"; }

/** Tek segmentin küçük grafiği: 30 gün düz çizgi, 7 gün kesikli tahmin. */
function nabizGrafik(seg, en=300, boy=92){
  const g=nabizDurum().g[seg], t=nabizTahmin(seg);
  const hep=[...g,...t], min=Math.min(...hep, 960), max=Math.max(...hep, 1040);
  const pay=(max-min)*.12, lo=min-pay, hi=max+pay;
  const ust=8, alt=18, sol=2, sag=34;
  const x=i=>sol+i*(en-sol-sag)/(hep.length-1), y=v=>ust+(hi-v)/(hi-lo)*(boy-ust-alt);
  const yol=a=>a.map((v,i)=>`${i?"L":"M"}${x(v.i).toFixed(1)},${y(v.v).toFixed(1)}`).join("");
  const gecmis=g.map((v,i)=>({i,v})), gelecek=[{i:g.length-1,v:g[g.length-1]},...t.map((v,i)=>({i:g.length+i,v}))];
  const sonX=x(g.length-1), sonY=y(g[g.length-1]);
  const y100=y(1000);
  return `<svg class="nb-svg" viewBox="0 0 ${en} ${boy}" role="img"
      aria-label="${SEGLBL[seg].replace(/&uuml;/g,"ü")} endeksi, son ${g.length} gün ve ${t.length} günlük tahmin">
    <line x1="${sol}" x2="${en-sag}" y1="${y100.toFixed(1)}" y2="${y100.toFixed(1)}" class="nb-taban"/>
    <text x="${en-sag+4}" y="${(y100+3.5).toFixed(1)}" class="nb-eksen">%0</text>
    <line x1="${sonX.toFixed(1)}" x2="${sonX.toFixed(1)}" y1="${ust}" y2="${boy-alt}" class="nb-bugun"/>
    <text x="${sonX.toFixed(1)}" y="${boy-5}" class="nb-eksen" text-anchor="middle">bug&uuml;n</text>
    <text x="${sol}" y="${boy-5}" class="nb-eksen">${g.length} g&uuml;n &ouml;nce</text>
    <path d="${yol(gecmis)}" class="nb-cizgi"/>
    <path d="${yol(gelecek)}" class="nb-tahmin"/>
    ${gecmis.map(p=>`<circle cx="${x(p.i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="7" class="nb-hedef"><title>${S.day-(g.length-1-p.i)}. g&uuml;n: ${_nbYuzde((p.v-1000)/10)}</title></circle>`).join("")}
    <circle cx="${sonX.toFixed(1)}" cy="${sonY.toFixed(1)}" r="4" class="nb-son"/>
  </svg>`;
}

function openNabiz(){
  nabizDurum();
  const sirali=[...NABIZ_SEG].sort((a,b)=>Math.abs(nabizDegisim(b))-Math.abs(nabizDegisim(a)));
  openSheet(`<div class="sheet-head"><div>
      <div class="sheet-title">Piyasa nabzı</div>
      <div class="sheet-sub">Segment fiyat endeksi &middot; son ${NABIZ.gun} g&uuml;n + ${NABIZ.tahmin} g&uuml;n takvim tahmini</div></div>
      <button class="x" data-act="close" aria-label="Kapat">&times;</button></div>
    <div class="nb-aciklama"><span class="nb-lej"><i class="duz"></i>ger&ccedil;ekleşen</span>
      <span class="nb-lej"><i class="kesik"></i>takvime g&ouml;re tahmin</span>
      <span class="sec-note">%0 = normal fiyat seviyesi. Eğri aracın ger&ccedil;ek değerini oynatır; olaylar &ouml;nceden bilinmez.</span></div>
    ${sirali.map(seg=>{
      const g=nabizDurum().g[seg], simdi=(g[g.length-1]-1000)/10, ch=nabizDegisim(seg);
      return `<div class="block nb-kutu">
        <div class="nb-bas"><b>${SEGLBL[seg]}</b>
          <span class="nb-deger">${_nbYuzde(simdi)}</span>
          <span class="nb-ok ${ch>0.05?"yukari":ch<-0.05?"asagi":""}">${ch>0.05?"&#9650;":ch<-0.05?"&#9660;":"&#9644;"} ${_nbYuzde(ch)} &middot; 7 g&uuml;n</span></div>
        ${nabizGrafik(seg)}
      </div>`;}).join("")}
    <div class="sec-note" style="margin:4px 2px 0">Ucuzken al, y&uuml;kselirken sat. Sezon değişimi kesikli &ccedil;izgide g&ouml;r&uuml;n&uuml;r — kışın SUV, yazın hatchback &ouml;ne &ccedil;ıkar.</div>`);
}

/** Pazar/araç sayfası için tek satır. */
function nabizSatir(seg){
  const ch=nabizDegisim(seg);
  return `<div class="kv"><span>Piyasa (${SEGLBL[seg]})</span>
    <b><button class="nb-link" data-act="nabizac">${ch>0.05?"&#9650;":ch<-0.05?"&#9660;":"&#9644;"} ${_nbYuzde(ch)} &middot; 7 g&uuml;n</button></b></div>`;
}

KANCA.ikon.nabiz='<path d="M3 13h4l2-5 4 10 2-5h6"/>';
KANCA.ray.push(()=>{
  if(S.day<3) return [];
  const enCok=[...NABIZ_SEG].sort((a,b)=>Math.abs(nabizDegisim(b))-Math.abs(nabizDegisim(a)))[0];
  const ch=nabizDegisim(enCok);
  return [{ik:"nabiz", act:"nabizac", bas:"Piyasa nabzı",
    alt:`${SEGLBL[enCok]} ${ch>=0?"y&uuml;kseliyor":"d&uuml;ş&uuml;yor"}`, rozet:_nbYuzde(ch)}];
});
KANCA.eylem.nabizac=()=>openNabiz();
