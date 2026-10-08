/* Pre-Loved Auto — çevrimdışı önbellek.
   Uygulama kabuğu tek dosya; three.js yanında duruyor. İlk açılışta
   hepsi önbelleğe alınır, sonrasında ağ olmadan da açılır. */
const SURUM="preloved-v1";
const DOSYALAR=["./","./index.html","./three.min.js","./manifest.webmanifest",
                "./icon-192.png","./icon-512.png","./icon-maskable-512.png"];

self.addEventListener("install", e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(SURUM).then(c=>c.addAll(DOSYALAR).catch(()=>{})));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(
    ks.filter(k=>k!==SURUM).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e=>{
  const r=e.request;
  if(r.method!=="GET") return;
  // Önce ağ, olmazsa önbellek; HTML için ağ önceliği taze sürüm getirir.
  e.respondWith(
    fetch(r).then(y=>{
      if(y && y.status===200 && y.type==="basic"){
        const kopya=y.clone();
        caches.open(SURUM).then(c=>c.put(r,kopya).catch(()=>{}));
      }
      return y;
    }).catch(()=>caches.match(r).then(v=>v || caches.match("./index.html")))
  );
});
