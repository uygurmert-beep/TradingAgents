/* ==================================================================
   GALERİCİLER GRUBU — bilgi ve dedikodu

   Her gün grupta bir iki mesaj: bir ihbar ("Kadıköy'de acil satılık temiz
   bir Egeo var"), bir söylenti ("ÖTV zammı geliyormuş"), bir müzayede
   kulisi ("o Bavera'nın motoru yorgun"). Bazıları doğru, bazıları rakibin
   kurduğu tuzak. Tanıdıkların çoğunlukla doğru söyler, rakip galericiler
   çoğunlukla yem atar — ama kim olduğunu ekran söylemiyor, sen öğreniyorsun:
   her mesaj sonuçlanınca gönderenin karnesine yazılır ("3 doğru · 1 yanlış").
   Bilginin bir değeri olsun diye doğru ihbar gerçekten ucuz araç getirir,
   tuzak ihbar ise ucuz görünen ama altında büyük gizli arıza olan araç.
   ================================================================== */
const GRUP={ sinir:16, ikinciMesaj:.3, mesajOlasiligi:.85 };
const GRUP_SEMT=["Kadıköy","Bostancı","Bağcılar","İkitelli","Maltepe","Kartal","Esenyurt","Ümraniye","Bayrampaşa","Çorlu","Gebze","İzmit"];
const GRUP_DIS=[{n:"Kuzen Emre",g:.65},{n:"Komisyoncu Tayfun",g:.55}];

function grupDurum(){
  if(!S.grup) S.grup={m:[], st:{}, okundu:0, sira:1};
  return S.grup;
}
/** Grubun üyeleri ve (gizli) doğruluk payları. */
function grupUyeler(){
  const tanidik=CONTACTS.map(c=>({n:c.n.replace(/&Ccedil;/g,"Ç").replace(/&ccedil;/g,"ç"), g:.86, k:c.k}));
  let rakip=[];
  try{ rakip=(S.rivals||[]).map((st,i)=>({n:rivalDef(st,i).n, g:.42, rakip:true})); }catch(e){}
  return [...tanidik, ...rakip, ...GRUP_DIS];
}
function grupKarne(kim){
  const s=grupDurum().st[kim]; if(!s||!(s.d+s.y)) return "hen&uuml;z sicili yok";
  return `${s.d} doğru &middot; ${s.y} yanlış`;
}
function _grpSonuc(m, dogru){
  if(m.cozuldu) return;
  m.cozuldu=true; m.sonuc=dogru;
  const st=grupDurum().st; st[m.kim]=st[m.kim]||{d:0,y:0};
  if(dogru) st[m.kim].d++; else st[m.kim].y++;
}

/* ---- mesaj üreticileri ---- */
function _grpIhbar(kim){
  const tavan=Math.max(600000, S.cash*1.1);
  let c=null;
  for(let i=0;i<30;i++){ const d=genCar(); if(d.ask<=tavan){ c=d; break; } }
  if(!c) return null;
  const dogru=chance(kim.g);
  if(!dogru){
    // tuzak: ucuz görünür, altında görünmeyen büyük bir arıza yatar
    const fk=pick(["motorrev","sanzimanrev","turbo"]), ft=FAULTS.find(f=>f.k===fk);
    const cm=clamp(.5+baseValue(c.model,Math.max(1,YEAR-c.year))/3000000,.5,1.5);
    c.faults.push({id:_uid++, k:ft.k, n:ft.n, comp:ft.c, cost:Math.round(ft.cost*cm/25)*25,
                   gain:ft.gain, dm:ft.dm, visible:false, fixed:false});
  }
  c.seller=SELLERS.find(s=>s.k==="acil")||c.seller;
  const gorunen=valueOf(c,true);
  c.ask=roundTo(gorunen*(dogru?.84:.88), 2500);
  c.reserve=Math.round(valueOf(c,false)*(dogru?.74:.80));
  c.pat=c.seller.pat;
  S.market.push(c);
  const alt=Math.round((1-c.ask/gorunen)*100);
  return {tip:"ihbar", carId:c.id, dogru,
    metin:`${c.model.n} ${c.year}, ${pick(GRUP_SEMT)}'de. Sahibi acil satıyor, temiz diyorlar. Piyasanın %${alt} altı, pazara d&uuml;şt&uuml;.`};
}
function _grpSoylenti(kim){
  if(S.event) return null;
  const def=pick(EVENTS.filter(e=>!e.model));
  const dogru=chance(kim.g);
  return {tip:"soylenti", dogru, olay:{k:def.k, gun:S.day+2},
    metin:`Duyduğuma g&ouml;re iki g&uuml;ne <b>${def.n}</b> geliyormuş. ${def.d}. Haberiniz olsun.`};
}
function _grpKulis(kim){
  if(!S.auction||!S.auction.length) return null;
  const c=pick(S.auction);
  const hasarli=majorHidden(c);
  const dogru=chance(kim.g);
  const soylenen=dogru?hasarli:!hasarli;
  return {tip:"kulis", carId:c.id, dogru, hasarDedi:soylenen,
    metin:soylenen?`M&uuml;zayededeki ${c.model.n} ${c.year} &mdash; motoru yorgun, ben bulaşmam. Uzak durun.`
                  :`M&uuml;zayededeki ${c.model.n} ${c.year} tertemiz, kimse fark etmeden alın.`};
}

KANCA.gun.push(rep=>{
  const g=grupDurum();
  // önce bekleyenleri sonuçlandır
  for(const m of g.m){
    if(m.cozuldu) continue;
    if(m.tip==="ihbar"){
      const pazarda=S.market.find(x=>x.id===m.carId), bende=S.cars.find(x=>x.id===m.carId);
      if((bende&&bende.inspected) || (!pazarda&&!bende)) _grpSonuc(m, m.dogru);
    }else if(m.tip==="soylenti" && S.day>=m.olay.gun){
      if(m.dogru && !S.event){
        const def=EVENTS.find(e=>e.k===m.olay.k);
        if(def){ S.event={k:def.k, n:def.n, d:def.d, kalan:def.gun, model:null};
          rep.events.push({olay:true, t:`<b>${def.n}</b> — ${def.d}. Gruptaki ${m.kim} haklı &ccedil;ıktı. ${def.gun} g&uuml;n s&uuml;recek.`}); }
      }
      _grpSonuc(m, m.dogru);
    }else if(m.tip==="kulis" && !S.auction.some(x=>x.id===m.carId)){
      _grpSonuc(m, m.dogru);
    }
  }
  // yeni mesajlar
  const uye=grupUyeler();
  const yaz=()=>{
    const kim=pick(uye);
    const uret=[_grpIhbar,_grpSoylenti,_grpKulis];
    const tip=chance(.55)?0:(chance(.5)?1:2);
    let m=uret[tip](kim)||_grpIhbar(kim);
    if(!m) return;
    g.m.push({id:g.sira++, gun:S.day, kim:kim.n, kk:kim.k||"", rakip:!!kim.rakip, cozuldu:false, ...m});
  };
  if(chance(GRUP.mesajOlasiligi)) yaz();
  if(chance(GRUP.ikinciMesaj)) yaz();
  if(g.m.length>GRUP.sinir) g.m.splice(0, g.m.length-GRUP.sinir);
});

function grupOkunmamis(){ const g=grupDurum(); return g.m.filter(m=>m.id>g.okundu).length; }

function openGrup(){
  const g=grupDurum();
  const yeniSinir=g.okundu;
  g.okundu=g.m.length?g.m[g.m.length-1].id:0;
  const ne=(gun)=>gun===S.day?"bug&uuml;n":(S.day-gun===1?"d&uuml;n":`${S.day-gun} g&uuml;n &ouml;nce`);
  const bas=(m)=>m.kk&&typeof yuzSvg==="function"
    ? `<span class="grp-av yuzlu">${yuzSvg(m.kk,62)}</span>`
    : `<span class="grp-av">${m.kim.split(" ").map(x=>x[0]).join("").slice(0,2)}</span>`;
  const mesajlar=[...g.m].reverse().map(m=>{
    const pazarda=m.tip==="ihbar"&&S.market.find(x=>x.id===m.carId);
    return `<div class="grp-msj ${m.id>yeniSinir?"yeni":""}">
      ${bas(m)}
      <div class="grp-balon">
        <div class="grp-ust"><b>${m.kim}</b><span>${grupKarne(m.kim)}</span><em>${ne(m.gun)}</em></div>
        <div class="grp-metin">${m.metin}</div>
        <div class="grp-alt">
          ${pazarda?`<button class="btn" data-act="grupilan" data-id="${m.carId}">İlana bak</button>`:""}
          ${m.cozuldu?`<span class="chip ${m.sonuc?"good":"warn"}">${m.sonuc?"doğru &ccedil;ıktı":(m.tip==="ihbar"?"tuzaktı":"yanlış &ccedil;ıktı")}</span>`
                     :`<span class="chip">sonu&ccedil; bekleniyor</span>`}
        </div>
      </div>
    </div>`;}).join("");
  openSheet(`<div class="sheet-head"><div>
      <div class="sheet-title">Galericiler grubu</div>
      <div class="sheet-sub">${grupUyeler().length} &uuml;ye &middot; kimin s&ouml;z&uuml;ne g&uuml;veneceğini sicilden &ouml;ğren</div></div>
      <button class="x" data-act="close" aria-label="Kapat">&times;</button></div>
    ${mesajlar||`<div class="empty">Grup sessiz. Yarın biri mutlaka bir şey yazar.</div>`}`);
  try{ render(); }catch(e){}
}

KANCA.ikon.grup='<path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/>';
KANCA.ray.push(()=>{
  const g=grupDurum(); if(!g.m.length) return [];
  const son=g.m[g.m.length-1], n=grupOkunmamis();
  const ozet=son.metin.replace(/<[^>]+>/g,"").replace(/&[a-z]+;/g,c=>({"&uuml;":"ü","&ouml;":"ö","&ccedil;":"ç","&mdash;":"—"}[c]||""));
  return [{ik:"grup", sinif:n?"sicak":"", act:"grupac", bas:"Galericiler grubu",
    alt:`${son.kim.split(" ")[0]}: ${ozet.slice(0,34)}…`, rozet:n?`${n} yeni`:""}];
});
KANCA.eylem.grupac=()=>openGrup();
KANCA.eylem.grupilan=(b, car)=>{ if(car && !car.owned) openMarketCar(car); };
