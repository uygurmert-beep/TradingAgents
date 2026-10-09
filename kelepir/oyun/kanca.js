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
