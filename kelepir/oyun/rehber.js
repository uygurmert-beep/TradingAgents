/* ================= REHBER — ilk 90 saniye =================
   Elle tutulan bir başlangıç: her adımda tek bir iş, hedef düğme
   vurgulanır, oyuncu o işi yapınca adım kendiliğinden ilerler. */
const OGRET=[
 {k:"ac",      sekme:"pazar", sec:'#screen [data-act="open"]',
  bas:"Pazardan bir ilan aç",
  alt:"Vitrindeki araçlardan birine dokun. Künyesi, iddiaları ve istenen fiyatı içeride.",
  tamam:()=>!!(S.ogretIz&&S.ogretIz.open)},
 {k:"ekspertiz", sec:'[data-act="eksper"]',
  bas:"Ekspertize ver",
  alt:"Gizli kusurlar ancak raporla görünür — ve her kusur pazarlıkta koza dönüşür.",
  tamam:()=>[...S.market,...S.cars].some(c=>c.inspected)},
 {k:"pazarlik", sec:'[data-act="negotiate"]',
  bas:"Pazarlığı başlat",
  alt:"Raporda çıkan kusurları masaya koy, fiyatı aşağı çek. Satıcının sabrı sınırlı.",
  tamam:()=>!!(S.ogretIz&&S.ogretIz.negotiate)||S.cars.length>0},
 {k:"al",
  bas:"Aracı al",
  alt:"Teklifin satıcının gizli tabanına yaklaşınca kabul eder. Fazla zorlarsan masadan kalkar.",
  tamam:()=>S.cars.length>0},
 {k:"tamir",   sekme:"garaj", sec:'[data-act="repair"]',
  bas:"Kârlı tamiri yap",
  alt:"Her tamir geri dönmez. Küçük kusurlar ucuz, büyük revizyonlar genelde zarar.",
  tamam:()=>S.cars.some(c=>(c.faults||[]).some(f=>f.fixed))||S.cars.some(c=>c.listPrice)},
 {k:"ilan",    sekme:"garaj", sec:'[data-act="list"]',
  bas:"Fiyat koy, satışa çıkar",
  alt:"Yüksek fiyat alıcı akışını yavaşlatır, düşük fiyat kârı yer. Çubukla dene.",
  tamam:()=>S.cars.some(c=>c.listPrice)},
 {k:"gun",     sec:'[data-act="endday"]',
  bas:"Günü bitir",
  alt:"Alıcılar gece gelir. Otopark ve sabit giderler de her gün işler.",
  tamam:()=>S.day>=2},
 {k:"sat",     sekme:"garaj", sec:'[data-act="salenego"]',
  bas:"Gelen teklifi değerlendir",
  alt:"Maliyetinin üstündeki ilk ciddi teklifi kaçırma; beklemek her gün paraya mal olur.",
  tamam:()=>(S.stats.sold||0)>0}
];
let _ogretIsik=null;
function ogretIsikTemizle(){
  if(_ogretIsik){ _ogretIsik.classList.remove("ogret-isik"); _ogretIsik=null; }
}
function ogretBitir(odul){
  S.tutorial=false; S.ogretIz={};
  ogretIsikTemizle();
  const el=document.getElementById("ogret"); if(el) el.classList.add("hidden");
  document.body.classList.remove("ogret-ac");
  if(odul){ S.cash+=30000; S.xp+=40; toast("Rehber tamam — ilk işin için ₺30.000 ikramiye.","good"); }
  save();
}
function ogretCiz(){
  const el=document.getElementById("ogret");
  if(!el) return;
  ogretIsikTemizle();
  // Oyun henüz başlamadıysa ya da tanıtım turu oynuyorsa rehber kartı
  // görünmemeli: giriş ekranının ve tur sayfasının üstüne biniyordu.
  const gizle = !S.tutorial || !S.started || (typeof DEMO!=="undefined" && DEMO.aktif);
  if(gizle){ el.classList.add("hidden"); document.body.classList.remove("ogret-ac"); return; }
  if(!S.ogretIz) S.ogretIz={};
  let i=S.ogretAdim||0;
  while(i<OGRET.length){ let t=false; try{ t=OGRET[i].tamam(); }catch(e){}
    if(!t) break; i++; }
  if(i!==(S.ogretAdim||0)){ S.ogretAdim=i; save(); }
  if(i>=OGRET.length){ ogretBitir(true); render(); return; }

  const ad=OGRET[i];
  const sekmeGerek = ad.sekme && S.tab!==ad.sekme && unlocked(ad.sekme);
  const bas = sekmeGerek ? `${TABLBL[ad.sekme]} sekmesine geç` : ad.bas;
  const alt = sekmeGerek ? ad.bas + " — oradan devam edeceğiz." : ad.alt;
  el.innerHTML=`<div class="kutu">
     <div class="say">${i+1}</div>
     <div class="gov">
       <div class="bas">${bas}</div>
       <div class="alt">${alt}</div>
       <div class="ilerle">${OGRET.map((_,k)=>`<i class="${k<i?"ok":""}"></i>`).join("")}</div>
     </div>
     <button class="atla" data-act="ogretatla">Atla</button>
   </div>`;
  el.classList.remove("hidden");
  document.body.classList.add("ogret-ac");
  const modalAcik=!document.getElementById("modal").classList.contains("hidden");
  el.classList.toggle("ust", modalAcik);
  if(!modalAcik){
    const tabs=document.getElementById("tabs");
    el.style.bottom=((tabs?tabs.offsetHeight:62)+6)+"px";
  } else el.style.bottom="";

  const sec = sekmeGerek ? `#tabs button[data-t="${ad.sekme}"]` : ad.sec;
  if(sec){
    const h=document.querySelector(sec);
    if(h){ h.classList.add("ogret-isik"); _ogretIsik=h; }
  }
}

/* tıklama sonrası rehberi tazele (sheet açılışları render çağırmaz) */
document.addEventListener("click", e=>{
  if(!S || !S.tutorial) return;
  if(!e.target.closest("[data-act]")) return;
  setTimeout(()=>{ try{ ogretCiz(); }catch(err){} }, 80);
});
