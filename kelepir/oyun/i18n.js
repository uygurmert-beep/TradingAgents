/* ==================================================================
   DİL KATMANI
   Kaynak dil Türkçe. İngilizce, oyunun ürettiği METİN DÜĞÜMLERİ üzerinde
   çalışan bir sözlükle veriliyor: HTML etiketlerine, sınıf adlarına ve
   data-* alanlarına hiç dokunulmuyor, HTML varlıkları da tarayıcı
   tarafından çözülmüş hâlde geliyor. Çevirisi olmayan metin Türkçe
   kalır — eksik çeviri oyunu asla bozmaz.
   ================================================================== */
/* ---- TEK DİL KİLİDİ ----
   Türkiye öncelikli yayın kararı: ilk sürüm yalnızca Türkçe çıkıyor.
   Sözlükler yerinde duruyor (sadece ~60 KB) — global sürümde bu sabiti
   null yapmak dili geri açmaya yetiyor, başka hiçbir değişiklik gerekmiyor. */
let TEK_DIL="tr";   // test/global sürüm için null yapılabilir

const I18N={
  lang:"tr",
  TAM:{},        // birebir eşleşen tam metinler
  DESEN:[],      // [RegExp, karşılık] — sayı taşıyan kalıplar
  PARCA:[]       // [metin, karşılık] — cümle içi atomik terimler (uzundan kısaya)
};

function dilKaydet(l){ try{ localStorage.setItem("preloved_lang", l); }catch(e){} }
function dilOku(){
  if(TEK_DIL) return TEK_DIL;
  try{ const v=localStorage.getItem("preloved_lang"); if(v) return v; }catch(e){}
  const n=(navigator.language||"tr").toLowerCase();
  return n.startsWith("tr") ? "tr" : "en";
}
/** Dil seçici gösterilsin mi? Tek dil kilidi açıkken gizli. */
const dilSecilebilir=()=>!TEK_DIL;
function dilAyarla(l, yenile){
  if(TEK_DIL) l=TEK_DIL;
  I18N.lang = (l==="en") ? "en" : "tr";
  dilKaydet(I18N.lang);
  document.documentElement.setAttribute("lang", I18N.lang);
  document.querySelectorAll('[lang]').forEach(e=>e.setAttribute("lang", I18N.lang));
  if(yenile!==false){
    try{ if(typeof render==="function") render(); }catch(e){}
    try{ if(typeof renderHud==="function") renderHud(); }catch(e){}
    try{ if(typeof renderTabs==="function") renderTabs(); }catch(e){}
    try{ if(typeof W3D!=="undefined" && W3D.active) W3D.refresh(); }catch(e){}
  }
}
const EN = ()=> I18N.lang==="en";

/* Türkçe sonek riski: "Motor" kalıbı "Motordan" kelimesinin içinde değişmemeli.
   Kalıp harfle bitiyorsa, ardından harf geliyorsa değişiklik yapılmaz. */
const HARF=/[0-9A-Za-zÇĞİÖŞÜçğıöşü]/;
/* Türkçe yüzde yazımı "%8" → İngilizce "8%". İngilizcede "%" rakamdan önce
   gelmez, bu yüzden dönüşüm güvenli ve her çıktıya uygulanabilir. */
function yuzdeDuzelt(t){
  if(typeof t!=="string" || t.indexOf("%")<0) return t;
  return t.replace(/%(\d+(?:[.,]\d+)?)/g, (m,n)=>n.replace(",",".")+"%");
}
function parcaDegistir(metin, kalip, karsilik){
  if(!kalip || metin.indexOf(kalip)<0) return metin;
  const sonHarf = HARF.test(kalip[kalip.length-1]);
  const ilkHarf = HARF.test(kalip[0]);
  if(!sonHarf && !ilkHarf) return metin.split(kalip).join(karsilik);
  let out="", i=0;
  while(true){
    const k=metin.indexOf(kalip, i);
    if(k<0){ out+=metin.slice(i); break; }
    const once=k>0?metin[k-1]:"";
    const sonra=metin[k+kalip.length]||"";
    const solTamam = !ilkHarf || !HARF.test(once);
    const sagTamam = !sonHarf || !HARF.test(sonra);
    out += metin.slice(i,k) + ((solTamam && sagTamam) ? karsilik : kalip);
    i=k+kalip.length;
  }
  return out;
}

/** Tek bir metin parçasını çevirir. Baştaki/sondaki boşluk korunur. */
function cevirHam(t){
  if(!EN() || !t) return t;
  const bas=t.match(/^\s*/)[0], son=t.match(/\s*$/)[0];
  let s=t.trim();
  if(!s) return t;
  const tam=I18N.TAM[s];
  if(tam!==undefined) return bas+tam+son;
  // Başlıklar toUpperCase ile üretiliyor: büyük harfli metni sözlükte ara,
  // bulunursa karşılığını yine büyük harfe çevir.
  if(s.length>2 && s===s.toLocaleUpperCase("tr") && /[A-ZÇĞİÖŞÜ]/.test(s)){
    if(!I18N.TAMU){
      I18N.TAMU={};
      for(const k in I18N.TAM) I18N.TAMU[k.toLocaleUpperCase("tr")]=I18N.TAM[k];
    }
    const u=I18N.TAMU[s];
    if(u!==undefined) return bas+u.toLocaleUpperCase("en")+son;
  }
  // HTML'den gelen satır sonu/girinti farkları eşleşmeyi bozmasın
  if(/\s{2,}|\n/.test(s)){
    const dz=s.replace(/\s+/g," ");
    if(!I18N.TAMN){
      I18N.TAMN={};
      for(const k in I18N.TAM) I18N.TAMN[k.replace(/\s+/g," ")]=I18N.TAM[k];
    }
    const t2=I18N.TAMN[dz];
    if(t2!==undefined) return bas+t2+son;
  }
  for(const [re,rep] of I18N.DESEN){
    if(re.test(s)){
      // kalıp çıktısının içindeki adlar da çevrilsin
      let d=s.replace(re,rep);
      const tam2=I18N.TAM[d]; if(tam2!==undefined) return bas+tam2+son;
      for(const [p,q] of I18N.PARCA) d=parcaDegistir(d,p,q);
      return bas+d+son;
    }
  }
  // Birleşik metinler (iddia cümleleri + satıcı tanımı gibi) cümle cümle
  // çevrilebiliyorsa çevrilsin; biri bile eksikse hiç dokunulmaz.
  if(s.indexOf(".")>0){
    const acQ = s[0]==='"' || s[0]==='“';
    const kapQ = s[s.length-1]==='"' || s[s.length-1]==='”';
    const ic = s.slice(acQ?1:0, kapQ ? -1 : undefined);
    // Not: lookbehind (?<=) eski iOS/WebView'lerde BETİĞİ TAMAMEN bozar.
    // Cümleleri elle ayırıyoruz: nokta + boşluk sınırı.
    const cumle=[]; let bas=0;
    for(let k=0;k<ic.length-1;k++){
      if(ic[k]==="." && /\s/.test(ic[k+1])){
        let s2=k+1; while(s2<ic.length && /\s/.test(ic[s2])) s2++;
        cumle.push(ic.slice(bas,k+1)); bas=s2; k=s2-1;
      }
    }
    if(bas<ic.length) cumle.push(ic.slice(bas));
    if(cumle.length>1){
      const ceviriler=[]; let hepsi=true;
      const bak=(h)=>{
        if(I18N.TAM[h]!==undefined) return I18N.TAM[h];
        for(const [p,q] of I18N.PARCA) if(p===h) return q;
        return undefined;
      };
      for(const c of cumle){
        const h=c.trim();
        let c2=bak(h);
        if(c2===undefined && /[.!?]$/.test(h)){
          const g=bak(h.slice(0,-1));
          if(g!==undefined) c2=g+h.slice(-1);
        }
        if(c2===undefined){ hepsi=false; break; }
        ceviriler.push(c2);
      }
      if(hepsi){
        const g=ceviriler.join(" ");
        return bas + (acQ?'"':"") + g + (kapQ?'"':"") + son;
      }
    }
  }
  // Uzun anlatı metinlerinde parça değişimi yapma: yarı çevrilmiş cümle,
  // hiç çevrilmemiş cümleden kötüdür. Kısa/bileşik metinlerde serbest.
  if(s.length>70) return t;
  let d=s;
  for(const [a,b] of I18N.PARCA) d=parcaDegistir(d,a,b);
  return bas+d+son;
}

function cevir(t){
  const s2=cevirHam(t);
  return EN() ? yuzdeDuzelt(s2) : s2;
}

/* ---- DOM'u gözleyip çeviriyi otomatik uygula ---- */
let _ceviriyor=false;
function dugumCevir(kok){
  if(!EN() || !kok) return;
  const w=document.createTreeWalker(kok, NodeFilter.SHOW_TEXT, {
    acceptNode(n){
      const p=n.parentNode, t=p&&p.nodeName;
      if(t==="SCRIPT"||t==="STYLE"||t==="TEXTAREA") return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const liste=[];
  while(w.nextNode()) liste.push(w.currentNode);
  if(kok.nodeType===3) liste.push(kok);
  for(const n of liste){
    const v=n.nodeValue;
    // Harf yoksa çeviri aranmaz — ama "%0" gibi salt yüzde düğümlerinde
    // İngilizce yazım düzeltmesi yine de uygulanmalı.
    if(!v || !/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(v)){
      if(v && /%\d/.test(v)){ const y=cevir(v); if(y!==v) n.nodeValue=y; }
      continue;
    }
    const c=cevir(v);
    if(c!==v) n.nodeValue=c;
  }
  // yer tutucu ve başlıklar
  if(kok.querySelectorAll) kok.querySelectorAll("[placeholder]").forEach(e=>{
    const c=cevir(e.getAttribute("placeholder"));
    if(c!==e.getAttribute("placeholder")) e.setAttribute("placeholder", c);
  });
}
function dilGozle(){
  const hedefler=["app","modal","toasts","intro","world","ogret"]
    .map(id=>document.getElementById(id)).filter(Boolean);
  const mo=new MutationObserver(kayitlar=>{
    if(_ceviriyor || !EN()) return;
    _ceviriyor=true;
    try{
      for(const k of kayitlar){
        if(k.type==="childList") k.addedNodes.forEach(n=>{
          if(n.nodeType===1) dugumCevir(n);
          else if(n.nodeType===3){ const c=cevir(n.nodeValue); if(c!==n.nodeValue) n.nodeValue=c; }
        });
        else if(k.type==="characterData"){
          const c=cevir(k.target.nodeValue);
          if(c!==k.target.nodeValue) k.target.nodeValue=c;
        }
      }
    } finally { _ceviriyor=false; }
  });
  for(const h of hedefler)
    mo.observe(h, {childList:true, subtree:true, characterData:true});
  for(const h of hedefler) dugumCevir(h);
}
