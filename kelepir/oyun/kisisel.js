/* ==================================================================
   GARAJ KİŞİSELLEŞTİRME (madde 8)
   Tabela adı, tabela rengi, saha zemini ve flama. Hepsi bedava: kozmetik
   kendini ifade etmeyi paraya bağlamak ücretli bir oyunda cimri duruyor.
   Seçimler hem 2B başlıkta hem 3B sahada görünür.
   ================================================================== */
const LOT_RENK=[
 {k:"sodium", n:"Sodyum sarısı", h:"#F2A007", koyu:"#12171B"},
 {k:"mavi",   n:"Gece mavisi",   h:"#4FA6FF", koyu:"#0F1620"},
 {k:"yesil",  n:"Neon yeşili",   h:"#43C08A", koyu:"#101A16"},
 {k:"kirmizi",n:"Kiremit kırmızısı", h:"#F0665D", koyu:"#19100F"},
 {k:"beyaz",  n:"Soğuk beyaz",   h:"#EDEFF2", koyu:"#14181C"}
];
const LOT_ZEMIN=[
 {k:"asfalt", n:"Asfalt",  d:"Standart saha, boyalı şeritler"},
 {k:"beton",  n:"Beton",   d:"Açık renk, derzli plaka"},
 {k:"cakil",  n:"Çakıl",   d:"Taşra galerisi görünümü"}
];
const LOT_AD_SINIR=18;
function lotVarsayilan(){ return {ad:"", renk:"sodium", zemin:"asfalt", flama:true}; }
function lotAl(){
  if(!S.lot) S.lot=lotVarsayilan();
  if(typeof S.lot.flama!=="boolean") S.lot.flama=true;
  return S.lot;
}
/** Tabelada yazacak ad. Boşsa dile göre varsayılan. */
function lotAd(){
  const a=(lotAl().ad||"").trim();
  if(a) return a;
  return EN() ? "YOUR LOT" : "GALERİN";
}
function lotRenk(){ return LOT_RENK.find(r=>r.k===lotAl().renk) || LOT_RENK[0]; }
function lotZemin(){ return lotAl().zemin || "asfalt"; }
/** Girilen adı temizle: kontrol karakteri yok, uzunluk sınırlı, büyük harf. */
function lotAdTemizle(s){
  return String(s||"").replace(/[\u0000-\u001F<>&"'`\\]/g,"")
    .replace(/\s+/g," ").trim().slice(0,LOT_AD_SINIR).toLocaleUpperCase(EN()?"en":"tr");
}

/** Ekrandaki girdideki adı duruma al. Sayfa yeniden çizilirken çağrılır:
    renge basınca yazdığın tabela adı kaybolmasın. */
function lotAdOku(){
  const inp=document.getElementById("lotAdIn");
  if(inp) lotAl().ad=lotAdTemizle(inp.value);
}

/* ---- kişiselleştirme sayfası ---- */
function openLotCustom(){
  const l=lotAl();
  openSheet(`<div class="sheet-head">
      <div><div class="sheet-title">Galerinin kimliği</div>
        <div class="sheet-sub">Tabelan hem listede hem 3B sahada görünür</div></div>
      <button class="x" data-act="closesheet" aria-label="Kapat">&times;</button></div>

    <div class="lotonizle" style="--lotrenk:${lotRenk().h};--lotkoyu:${lotRenk().koyu}">
      <div class="lotsign"><b id="lotOnAd">${lotAd()}</b>
        <span>${EN()?"used cars &middot; safe deal":"ikinci el &middot; g&uuml;venli alım"}</span></div>
      <div class="lotzem ${l.zemin}"></div>
      ${l.flama?`<div class="lotflama"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`:""}
    </div>

    <div class="block"><h4>TABELA ADI</h4>
      <input class="offer-input" id="lotAdIn" type="text" maxlength="${LOT_AD_SINIR}"
        value="${l.ad||""}" placeholder="${EN()?"YOUR LOT":"GALERİN"}"
        style="text-align:left;font-size:17px;letter-spacing:.04em">
      <div class="sec-note" style="margin-top:6px">En fazla ${LOT_AD_SINIR} karakter. Boş bırakırsan varsayılan ad kullanılır.</div>
    </div>

    <div class="block"><h4>TABELA RENGİ</h4>
      <div class="lotrenkler">
        ${LOT_RENK.map(r=>`<button class="lotrenk ${l.renk===r.k?"on":""}" data-act="lotrenk" data-k="${r.k}"
          style="--h:${r.h}" aria-label="${r.n}"><i></i><span>${r.n}</span></button>`).join("")}
      </div></div>

    <div class="block"><h4>SAHA ZEMİNİ</h4>
      ${LOT_ZEMIN.map(z=>`<button class="mv ${l.zemin===z.k?"secili":""}" data-act="lotzemin" data-k="${z.k}"
        style="width:100%;margin-bottom:7px"><b>${z.n}</b><span>${z.d}</span></button>`).join("")}
    </div>

    <div class="block"><h4>FLAMA</h4>
      <div class="kv"><span>Direkler arası renkli flama<br>
        <small style="color:var(--muted-2)">Sahaya hareket katar, bazıları sade ister</small></span>
        <button class="btn" data-act="lotflama" style="min-height:36px;padding:7px 16px;font-size:14px">
          ${l.flama?"Açık":"Kapalı"}</button></div>
    </div>

    <button class="btn primary full" data-act="lotkaydet">Kaydet</button>
    <button class="btn ghost full" data-act="lotsifirla" style="margin-top:7px">Varsayılana dön</button>`);
  const inp=document.getElementById("lotAdIn");
  if(inp) inp.addEventListener("input", ()=>{
    const el=document.getElementById("lotOnAd");
    if(el) el.textContent=lotAdTemizle(inp.value)|| (EN()?"YOUR LOT":"GALERİN");
  });
}
function lotKaydet(){
  lotAdOku();
  save();
  try{ if(typeof W3D!=="undefined" && W3D.active) W3D.rebuild(); }catch(e){}
  closeSheet(); render();
  toast("Galerinin kimliği güncellendi.","good");
}
