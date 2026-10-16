/* ================= AÇILIŞ HATA AĞI =================
   Boş ekran yerine okunabilir bir panel: oyun açılamazsa sebebi görünsün.
   Her şeyden önce yüklenir, bu yüzden paketin ilk parçası. */
(function(){
  let gosterildi=false;
  function panel(baslik, mesaj){
    if(gosterildi) return; gosterildi=true;
    try{
      const d=document.createElement("div");
      d.setAttribute("style",
        "position:fixed;inset:0;z-index:99999;background:#0A0E13;color:#E8EDF2;"+
        "font:15px/1.5 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;"+
        "padding:28px 22px;overflow:auto;-webkit-overflow-scrolling:touch");
      d.innerHTML=
        '<div style="max-width:520px;margin:0 auto">'+
        '<div style="font-size:22px;font-weight:700;letter-spacing:-.02em;margin-bottom:6px">'+
        'Pre-Loved Auto açılamadı</div>'+
        '<div style="color:#8E9AA3;font-size:13.5px;margin-bottom:18px">'+baslik+'</div>'+
        '<pre style="white-space:pre-wrap;word-break:break-word;background:#141A22;'+
        'border:1px solid #28323D;border-radius:12px;padding:12px;font-size:12px;'+
        'color:#C9D3DB;margin:0 0 18px">'+String(mesaj).slice(0,1200)+'</pre>'+
        '<button id="__sifirla" style="width:100%;padding:13px;border:0;border-radius:12px;'+
        'background:#F2A007;color:#1A1205;font-weight:700;font-size:15px">'+
        'Kaydı sıfırla ve yeniden dene</button>'+
        '<div style="color:#5E686F;font-size:12px;margin-top:12px">'+
        'Reset the save and reload</div></div>';
      document.body.appendChild(d);
      const b=document.getElementById("__sifirla");
      if(b) b.onclick=()=>{ try{ localStorage.removeItem("preloved_v1"); }catch(e){}
                            location.reload(); };
    }catch(e){}
  }
  window.__plPanel=panel;
  window.addEventListener("error", e=>{
    const m=(e&&e.error&&e.error.stack)||(e&&e.message)||"bilinmeyen hata";
    // sadece açılış tamamlanmadıysa panel aç
    if(!window.__plAcildi) panel("Bir betik hatası oyunun açılmasını engelledi.", m);
  });
  window.addEventListener("unhandledrejection", e=>{
    if(!window.__plAcildi) panel("Bir işlem tamamlanamadı.",
      (e&&e.reason&&(e.reason.stack||e.reason.message))||String(e&&e.reason));
  });
  // 6 saniye içinde ekrana hiçbir şey çizilmediyse de panel aç
  setTimeout(()=>{
    if(window.__plAcildi) return;
    const ek=document.getElementById("screen"), gr=document.getElementById("introBody");
    const bos=(!ek || !ek.innerHTML.trim()) && (!gr || !gr.innerHTML.trim());
    if(bos) panel("Oyun başlatıldı ama ekrana hiçbir şey çizilmedi.",
      "boot() tamamlanmadı. Tarayıcı: "+(navigator.userAgent||"?"));
  }, 6000);
})();
