/* ==================================================================
   RAKİP KİŞİLİKLERİ (1.4, test grubu M5; ai-behavior-trees-utility-ai)
   Rakipler eskiden tek bir "değer × hedef − fiyat" puanıyla ilan kapıyordu;
   dördü de aynı davranıyor, oyuncu hiçbirini "biri" olarak tanımıyordu.
   Artık her rakibin kişiliği var ve ilanı puanlamalı (utility) seçiyor:
     etkenler 0..1'e normalize: fiyat avantajı (a), araç durumu (d), nakit (n)
     skor = a^wa · d^wd · n^wn · (segment bonusu)   — ağırlıklı çarpım
   Eşitlikte gidip gelmesin diye dünkü hedef %10 histerezisle korunur.
   Oyuncunun açtığı ilanda rakip hemen almaz: önce "baktı" etiketi çıkar,
   karar ertesi gece (STR şartı: iyi ilan bekletilemez ama habersiz de
   kaçmaz). Kişilik müzayede ve canlı artırma tavanını da oynatır.
   `?rakipdebug` ile rakip vitrininde skor tablosu görünür.
   ================================================================== */
const KISILIK={
  agresif:{ad:"Agresif zarfçı",   w:{a:1.6, d:.25, n:.5}, zarf:1.05, d:"Ucuz gördüğüne atlar, kusura bakmaz."},
  temiz:  {ad:"Yalnız temiz araç", w:{a:.8, d:1.8, n:.6}, zarf:1.02, d:"Hasarlı araca dokunmaz, temize iyi para verir."},
  taksit: {ad:"Taksitçi",          w:{a:.9, d:.7, n:1.4}, zarf:.96,  d:"Ucuz ve hızlı dönen aracı sever, senetle satar."},
  merakli:{ad:"Klasik meraklısı",  w:{a:.6, d:1.0, n:.5}, zarf:.95,  d:"Klasik ve lüks araca gönlünü kaptırır.", bonus:{klasik:1.7, lux:1.3}}
};
/* Ayar (240 günlük simülasyon, 3 koşu): ilk değerlerle (eşik .16, kapma .55)
   ilanların %36'sı rakibe gidiyordu; STR şartı ≤%25. Şimdi %22–25, kapışların
   ~%90'ı önceden "baktı" etiketiyle uyarılmış ilanlarda. */
const RAKIP={ esik:.24, histerezis:.90, kapma:.32, sessiz:.15 };
const _RK_ROL={ucuz:"agresif", aile:"temiz", ticari:"taksit", lux:"merakli"};
function rakipKisilik(st,i){ return KISILIK[_RK_ROL[rivalDef(st,i).rol]] || KISILIK.agresif; }
function _rkDurum(c){
  const v=Math.max(1,valueOf(c,false));
  const gizli=(c.faults||[]).filter(f=>!f.fixed).reduce((a,f)=>a+f.cost,0);
  return clamp(1-((c.tramer||0)/v*4 + (c.degisen||0)*.18 + (c.kmOynama?.4:0) + gizli/v*3), .02, 1);
}
/** Bir rakibin bir ilana verdiği skor (0 = ilgilenmez). */
function rakipSkor(st,i,c){
  const def=rivalDef(st,i), k=rakipKisilik(st,i);
  if(!c || !c.ask || !def.segs.includes(c.model.seg)) return 0;
  const nakit=(st.cash||def.cash)*.55; if(c.ask>nakit) return 0;
  const a=clamp((rivalValue(c)-c.ask)/c.ask/.25, .02, 1);
  const d=_rkDurum(c);
  const n=clamp(1-c.ask/nakit, .02, 1);
  const b=(k.bonus&&k.bonus[c.model.seg])||1;
  return Math.pow(a,k.w.a)*Math.pow(d,k.w.d)*Math.pow(n,k.w.n)*b;
}
/** Rakibin en çok istediği ilan; dünkü hedef hâlâ yakınsa ondan vazgeçmez. */
function rakipHedef(st,i,haric){
  let en=null, es=0, onceki=null, os=0;
  for(const c of S.market){
    if(haric && haric.has(c.id)) continue;
    const sk=rakipSkor(st,i,c);
    if(sk>es){ es=sk; en=c; }
    if(c.id===st.goz){ onceki=c; os=sk; }
  }
  if(onceki && os>=es*RAKIP.histerezis && os>=RAKIP.esik) return {c:onceki, s:os};
  return es>=RAKIP.esik ? {c:en, s:es} : null;
}
/** Müzayede ve canlı artırmada kişilik tavanı oynatır. */
function rakipZarfKat(st,i,c){
  const k=rakipKisilik(st,i);
  let x=k.zarf;
  if(k===KISILIK.temiz && _rkDurum(c)<.6) x=.85;
  if(k.bonus && k.bonus[c.model.seg]) x*=1.10;
  return x;
}
/** Gece: önce dün "baktığı" ilana karar, sonra yarının hedefi. */
function rakipGece(st,i,rep,al){
  const def=rivalDef(st,i);
  if((st.stock||[]).length>=def.cap) { st.goz=null; return; }
  const alinan=new Set();
  // 1) dün baktığı ilan hâlâ duruyorsa: büyük olasılıkla alır (oyuncu uyarıldı)
  const dunku=st.goz ? S.market.find(c=>c.id===st.goz) : null;
  if(dunku && rakipSkor(st,i,dunku)>0 && chance(RAKIP.kapma)){ al(dunku); alinan.add(dunku.id); }
  // 2) oyuncunun görmediği ilanı bazen sessizce alır (eski davranışın yumuşağı)
  else{
    const h=rakipHedef(st,i,alinan);
    if(h && !h.c.gorulen && !h.c.rakipGoz && chance(RAKIP.sessiz*(def.aggr||.7))){ al(h.c); alinan.add(h.c.id); }
  }
  // 3) yarının hedefi: ilana etiket düşer
  if((st.stock||[]).length>=def.cap){ st.goz=null; return; }
  const yeni=rakipHedef(st,i,alinan);
  st.goz = yeni ? yeni.c.id : null;
  if(yeni) yeni.c.rakipGoz={n:st.n, kis:rakipKisilik(st,i).ad, gun:S.day};
}
