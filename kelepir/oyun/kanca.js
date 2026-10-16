/* ==================================================================
   KANCALAR — yan sistemlerin ui.js'e tek kapıdan bağlanması

   Takas, parça seçimi, ilan fotoğrafı, piyasa nabzı, galerici grubu ve
   canlı açık artırma ayrı modüllerde duruyor. Her biri gün geçişine, BUGÜN
   rayına ve düğme yönlendirmesine dokunmak zorunda; her biri için ui.js'e
   ayrı satır eklemek 4.000 satırlık dosyayı daha da büyütüyor ve bir
   sistemi çıkarmak birkaç yerden silmek demek oluyordu. Artık ui.js bu üç
   listeye bakıyor, modüller kendini buraya yazıyor.

     KANCA.gun    gün geçişinde (nextDay) rapor nesnesiyle çağrılır
     KANCA.ray    BUGÜN rayına eklenecek kartları döndürür
     KANCA.eylem  data-act → işleyici (b: düğme, car: data-id'deki araç)
     KANCA.ikon   ray kartı simgeleri (AJ_IKON'da olmayanlar)

   Bir kancanın hatası diğerlerini ve günü durdurmasın: her çağrı korumalı.
   ================================================================== */
const KANCA={ gun:[], ray:[], eylem:{}, ikon:{} };

function kancaGun(rep){
  for(const f of KANCA.gun){ try{ f(rep); }catch(e){ if(typeof console!=="undefined") console.error(e); } }
}
function kancaRay(){
  const out=[];
  for(const f of KANCA.ray){ try{ out.push(...(f()||[])); }catch(e){ if(typeof console!=="undefined") console.error(e); } }
  return out;
}
/** İşleyici varsa çalıştırır ve true döner; ui.js o zaman başka bir şey yapmaz. */
function kancaEylem(a, b, car){
  const f=KANCA.eylem[a];
  if(!f) return false;
  f(b, car);
  return true;
}

/* ==================================================================
   KADEMELİ AÇILIŞ (1.1, kavranabilirlik oylaması Ö1)
   İlk 3 günde rayda 7 ayrı sistem beliriyordu, hiçbiri tanıtılmıyordu ve
   hiçbiri oyuncunun ilerlemesine bağlı değildi ("çok detaylı, hemen
   kavraması kolay değil"). Artık yan sistemler satışla açılır, günde en çok
   bir tane, rayda "YENİ" rozeti ve ilk dokunuşta kısa tanıtımla.
   İkinci kariyer (prestij) ya da Ayarlar'daki anahtar kademeyi kapatır;
   eski kayıtta (gün > 1 ya da satış yapılmış) her şey açık sayılır.
   ================================================================== */
const ACILIS=[
  {k:"vaka",    sold:1, gun:0, ad:"Günün vakası",       d:"Her gün tek soru, 20 saniye. Doğru cevap küçük bir ödül ve seri getirir."},
  {k:"siparis", sold:1, gun:0, ad:"Siparişler",          d:"Müşteri tarif verir: segment, yıl, km. Uyan aracı bulup teslim edersen piyasanın biraz üstünü öder."},
  {k:"emanet",  sold:1, gun:3, ad:"Emanet araç",         d:"Sahibi net bir rakam ister, üstü senin. Nakit bağlamazsın ama park yeri kaplar."},
  {k:"nabiz",   sold:1, gun:3, ad:"Piyasa nabzı",        d:"Segmentlerin değeri dalgalanır. Yükselen segmentte al, zirvede sat."},
  {k:"grup",    sold:2, gun:0, ad:"Galericiler grubu",   d:"Diğer galericiler ihbar ve söylenti paylaşır. Kimin doğru çıktığı sicilde yazar."},
  {k:"parti",   sold:2, gun:0, ad:"Toptan parti",        d:"Birkaç aracı tek fiyata alırsın: tek tek almaktan ucuz, ama park yeri ister."}
];
function _acilisHepsi(){ const o={}; for(const a of ACILIS) o[a.k]=1; return o; }
function acikMi(k){
  if(typeof S==="undefined"||!S) return true;
  if(!ACILIS.some(a=>a.k===k)) return true;
  if(S.hepsiAcik || (S.prestij||0)>0) return true;
  if(!S.acilan){
    // eski kayıt: oyuna çoktan başlamış oyuncudan sistemleri geri alma
    S.acilan = ((S.stats&&S.stats.sold)||0)>0 || (S.day||1)>1 ? _acilisHepsi() : {};
  }
  return !!S.acilan[k];
}
/** Gün dönerken: koşulu sağlanan sistemlerden en çok biri açılır. */
function acilisGun(rep){
  if(S.hepsiAcik || (S.prestij||0)>0) return;
  acikMi("vaka");                    // S.acilan'ı kur
  const gun=(S.day||1)+1, sold=(S.stats&&S.stats.sold)||0;
  const a=ACILIS.find(x=>!S.acilan[x.k] && sold>=x.sold && gun>=x.gun);
  if(!a) return;
  S.acilan[a.k]=gun;
  S.yeniSistem=S.yeniSistem||{}; S.yeniSistem[a.k]=1;
  if(rep) rep.events.push({t:`<b>YENİ: ${a.ad}</b> açıldı. ${a.d}`});
}
