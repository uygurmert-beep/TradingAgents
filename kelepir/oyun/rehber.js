/* ================= REHBER — ilk 90 saniye =================
   Elle tutulan bir başlangıç: her adımda tek bir iş, hedef düğme
   vurgulanır, oyuncu o işi yapınca adım kendiliğinden ilerler. */
/* 1.1 (kavranabilirlik oylaması Ö2): 8 adımdan 7'ye. Elle tamir ve elle
   ilan adımları "Hazırla ve ilana koy" tek adımına indi — rehberi izleyen
   oyuncu ilk satışa 19 dokunuşta varıyordu, ilk ilan bir koşuda +%0,3 kârdaydı.
   sec bir dizi olabilir: sırayla ilk bulunan vurgulanır. Sayfa (sheet) açıksa
   önce onun içindeki hedef aranır; rehber görünürken vurgusuz an kalmasın. */
const OGRET=[
 {k:"ac",      sekme:"pazar", sec:['#screen .ogret-oneri[data-act="open"]','#screen [data-act="open"]'],
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
 /* "Kabul et" yalnız karşı teklif önerilen tavanın içindeyse vurgulanır.
    Eskiden ilk bulunan kabul düğmesi yanıyordu: oyun aynı ekranda
    "Vazgeçmek mantıklı" derken rehber kabulü gösteriyor, rehberi izleyen
    oyuncunun ilk satışı zararına oluyordu (1.3 testi, H4). */
 {k:"al", sec:['[data-act="acceptcounter"].karli','[data-act="offer"]'],
  bas:"Aracı al",
  alt:"Teklif ver; satıcının sözü önerilen tavanın içine inince \"Kabul et\" yanar. Fazla zorlarsan masadan kalkar.",
  tamam:()=>S.cars.length>0},
 {k:"hazirla", sekme:"garaj",
  sec:['[data-act="alimgit"]','[data-act="onayevet"]','.garaj-ipucu [data-act="hazirla"]','[data-act="hazirla"]'],
  bas:"Hazırla ve ilana koy",
  alt:"Ekspertiz, kârlı tamir ve ilan tek dokunuşta. İnce ayar aracın sayfasında.",
  tamam:()=>S.cars.some(c=>c.listPrice)||(S.stats.sold||0)>0},
 {k:"gun",     sec:'[data-act="endday"]',
  bas:"Günü bitir",
  alt:"Alıcılar gece gelir. Otopark ve sabit giderler de her gün işler.",
  tamam:()=>S.day>=2},
 /* İlk gece alıcı gelmeyebilir (1.4'te rakip ve kapora zarları sırayı
    değiştirince tohumlu koşuda öyle oldu): rapor açık, vurgulanacak teklif
    yok, oyuncu takılıyordu. Teklif yoksa rapor kapat → günü bitir. */
 {k:"sat",     sekme:"garaj", sec:['[data-act="saleaccept"].karli','[data-act="saleoffer"]','[data-act="salenego"]','[data-act="dealdone"]','[data-act="closereport"]','[data-act="endday"]'],
  bas:"Gelen teklifi değerlendir",
  alt:"Maliyetinin üstündeki ilk ciddi teklifi kaçırma; beklemek her gün paraya mal olur.",
  tamam:()=>(S.stats.sold||0)>0}
];
/** Rehberin ilk ilan önerisi: kasanın yarısına sığan, görünen değerine göre
    en ucuz ilan. Eskiden listenin ilk kartı açtırılıyordu; bir koşuda kasa
    ₺2,6M iken ₺1,24M'lik, marjı olmayan bir araçtı (1.3 testi). */
function ogretOneriId(){
  const ad=(S.market||[]).filter(c=>c.ask && c.ask<=S.cash*.55);
  if(!ad.length) return null;
  const pay=c=>(valueOf(c,true)-c.ask)/c.ask + (c.gunun||c.kelepir?.08:0);
  return ad.reduce((a,c)=>pay(c)>pay(a)?c:a).id;
}
let _ogretIsik=null;
function ogretIsikTemizle(){
  if(_ogretIsik){ _ogretIsik.classList.remove("ogret-isik"); _ogretIsik=null; }
}
function ogretBitir(odul){
  S.tutorial=false; S.ogretIz={};
  ogretIsikTemizle();
  const el=document.getElementById("ogret"); if(el) el.classList.add("hidden");
  document.body.classList.remove("ogret-ac");
  if(odul){ kasaHareket(30000, "Rehber ikramiyesi"); S.xp+=40; toast("Rehber tamam — ilk işin için ₺30.000 ikramiye.","good");
    // STR ve ARB'nin şartı: kısa yol öğretildi, derinlik nerede söylensin
    toast("Elle tamir, parça, ilan dili ve sunum aracın sayfasında: en iyi kâr orada.","good"); }
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
  const modalAcik=!document.getElementById("modal").classList.contains("hidden");
  const secler=[].concat(ad.sec||[]);
  const bul=(kok)=>{ for(const q of secler){ const h=kok.querySelector(q); if(h && h.offsetParent!==null) return h; } return null; };
  // Önce açık sayfanın içi; yoksa doğru sekmede ekran; o da yoksa sekmeye yönlendir.
  let hedef = modalAcik ? bul(document.getElementById("modal")) : null;
  const sekmeGerek = !hedef && !modalAcik && ad.sekme && S.tab!==ad.sekme && unlocked(ad.sekme);
  if(!hedef && !sekmeGerek && !modalAcik) hedef=bul(document);
  let bas = sekmeGerek ? `${TABLBL[ad.sekme]} sekmesine geç` : ad.bas;
  let alt = sekmeGerek ? ad.bas + " — oradan devam edeceğiz." : ad.alt;
  // Hedef ekranda yoksa ara adım: araca dokun (vurgusuz an kalmasın)
  if(!hedef && !sekmeGerek && !modalAcik){
    const kart=document.querySelector('#screen [data-act="open"]');
    if(kart){ hedef=kart; alt="Önce araca dokun. "+alt; }
  }
  el.innerHTML=`<div class="kutu">
     <div class="say">${i+1}</div>
     <div class="gov">
       <div class="bas">${bas}</div>
       <div class="alt">${alt}</div>
       <div class="ilerle">${OGRET.map((_,k)=>`<i class="${k<i?"ok":""}"></i>`).join("")}</div>
     </div>
     <button class="atla" data-act="ogretatla" aria-label="Rehberi atla">Atla</button>
   </div>`;
  el.classList.remove("hidden");
  document.body.classList.add("ogret-ac");
  el.classList.toggle("ust", modalAcik);
  if(!modalAcik){
    const tabs=document.getElementById("tabs");
    el.style.bottom=((tabs?tabs.offsetHeight:62)+6)+"px";
  } else el.style.bottom="";
  /* Kartın boyu bir değişkende: açık sayfa kartın altından başlar, bildirimler
     kartın altına dizilir (Ö3: kart sayfa başlığını, bildirim kartı örtüyordu). */
  document.documentElement.style.setProperty("--ogret-h", (el.offsetHeight||0)+"px");

  if(sekmeGerek) hedef=document.querySelector(`#tabs button[data-t="${ad.sekme}"]`);
  if(hedef){ hedef.classList.add("ogret-isik"); _ogretIsik=hedef; }
}

/* tıklama sonrası rehberi tazele (sheet açılışları render çağırmaz) */
document.addEventListener("click", e=>{
  if(!S || !S.tutorial) return;
  if(!e.target.closest("[data-act]")) return;
  setTimeout(()=>{ try{ ogretCiz(); }catch(err){} }, 80);
});
