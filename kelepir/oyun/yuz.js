/* ==================================================================
   PAZARLIK YÜZÜ (madde 2)
   Satıcının ve alıcının ruh hâli artık sadece bir çubuk değil: karşında
   tepki veren stilize bir yüz var. Tamamı satır içi SVG + CSS — canvas
   yok, resim yok, pakete tek bayt eklemiyor, 3B ile aynı karede FPS
   düşürmüyor. Kaş açısı, göz kısması, ağız kavisi ve ter damlası ruh hâli
   ile sabra bağlı; arketipe göre şapka, gözlük, bıyık gibi işaretler var.
   ================================================================== */
const YUZ_TEN=["#D9A878","#C08E62","#9C6B45","#E3BE98","#7E543A","#B98055"];
const YUZ_SAC=["#2A2420","#473229","#6E5443","#8E8B86","#1E1A18","#5B3A24"];

/* Arketip imzaları. kep: şapka, gozluk, biyik, sakal, kupe, tulum(yaka rengi) */
const YUZ_IMZA={
  /* --- satıcılar --- */
  acil:        {kep:0, gozluk:0, biyik:1, sakal:0, yaka:"#4A5A68", ten:1, sac:1},
  acemi:       {kep:0, gozluk:0, biyik:0, sakal:0, yaka:"#5B7A9B", ten:3, sac:2, genc:1},
  filo:        {kep:0, gozluk:1, biyik:0, sakal:0, yaka:"#2F3C49", ten:0, sac:3, kravat:1},
  duygusal:    {kep:0, gozluk:0, biyik:0, sakal:1, yaka:"#6B5A4A", ten:4, sac:0},
  galerici:    {kep:1, gozluk:1, biyik:1, sakal:0, yaka:"#1F2A33", ten:5, sac:4, zincir:1},
  koleksiyoncu:{kep:0, gozluk:1, biyik:0, sakal:1, yaka:"#4C4030", ten:2, sac:3, papyon:1},
  /* --- alıcılar --- */
  aile:        {kep:0, gozluk:0, biyik:1, sakal:0, yaka:"#3E6B52", ten:1, sac:1},
  genc:        {kep:1, gozluk:0, biyik:0, sakal:0, yaka:"#7A4A8C", ten:3, sac:5, genc:1, kupe:1},
  esnaf:       {kep:0, gozluk:0, biyik:1, sakal:1, yaka:"#7A6038", ten:5, sac:0, onluk:1},
  merakli:     {kep:1, gozluk:1, biyik:0, sakal:1, yaka:"#4A4A52", ten:0, sac:3},
  uzak:        {kep:0, gozluk:0, biyik:1, sakal:0, yaka:"#55606B", ten:2, sac:2}
};
/** Ruh hâli (0–100) ve sabır oranından (0–1) yüz üret. */
let _yuzNo=0;
function yuzSvg(k, mood, sabirOran, ek){
  const kid="ykafa"+(++_yuzNo);
  const z=YUZ_IMZA[k]||YUZ_IMZA.acemi;
  const ten=YUZ_TEN[z.ten%YUZ_TEN.length], sac=YUZ_SAC[z.sac%YUZ_SAC.length];
  const m=Math.max(0,Math.min(100,mood||0));
  const d=(m-50)/50;                       // -1 kızgın … +1 keyifli
  const kus=(50-m)/50;                     // kaş iç ucu düşme miktarı
  const agiz=18+d*13;                      // kontrol noktası sapması
  const gozRy=m<22?2.2:(m<42?3.3:4.3);
  const kasIc=46+Math.max(0,kus)*7;
  const kasDis=46-Math.max(0,kus)*1.5-Math.max(0,d)*3;
  const ter = (sabirOran!==undefined && sabirOran<=0.34);
  const kizgin = m<22;
  const ek2 = ek||"";
  return `<svg class="yuz ${ek2}" viewBox="0 0 120 124" aria-hidden="true">
    <defs><clipPath id="${kid}"><ellipse cx="60" cy="56" rx="29" ry="34"></ellipse></clipPath></defs>
    <!-- omuz / yaka -->
    <path d="M14 124 q6-22 24-27 q22 7 44 0 q18 5 24 27z" fill="${z.yaka}"></path>
    ${z.onluk?`<path d="M44 100 q16 7 32 0 l3 24 h-38z" fill="rgba(255,255,255,.14)"></path>`:""}
    ${z.kravat?`<path d="M57 97 l6 0 l3 8 l-6 16 l-6-16z" fill="#B4332C"></path>`:""}
    ${z.papyon?`<path d="M53 100 l-7-4 v8z M67 100 l7-4 v8z" fill="#8E2A24"></path>
                <circle cx="60" cy="100" r="3" fill="#8E2A24"></circle>`:""}
    ${z.zincir?`<path d="M48 98 q12 10 24 0" stroke="#E0B23C" stroke-width="2.4" fill="none"></path>`:""}
    <!-- boyun -->
    <rect x="52" y="82" width="16" height="14" rx="5" fill="${ten}" opacity=".92"></rect>
    <!-- kafa -->
    <ellipse cx="60" cy="56" rx="29" ry="34" fill="${ten}"></ellipse>
    <!-- kulaklar -->
    <ellipse cx="31" cy="58" rx="4.4" ry="6.2" fill="${ten}"></ellipse>
    <ellipse cx="89" cy="58" rx="4.4" ry="6.2" fill="${ten}"></ellipse>
    ${z.kupe?`<circle cx="89" cy="65" r="2.3" fill="#E2C14A"></circle>`:""}
    <!-- saç -->
    <g clip-path="url(#${kid})">
      ${z.kep
        ? `<path d="M26 40 q34-22 68 0 l0 6 q-34-14-68 0z" fill="${sac}"></path>`
        : `<path d="M31 46 q4-26 29-26 q25 0 29 26 q-10-12-29-12 q-19 0-29 12z" fill="${sac}"></path>`}
    </g>
    ${z.kep?`<path d="M22 40 q38-26 76 0 q-6 5-38 5 q-32 0-38-5z" fill="${k==="genc"?"#8E47A8":"#232C34"}"></path>
             <path d="M88 38 q18 2 22 8 q-18 4-24-2z" fill="${k==="genc"?"#7A3C92":"#1A222A"}"></path>`:""}
    <!-- kaşlar -->
    <path d="M41 ${kasDis} q7-4 14 ${kasIc-kasDis-2}" stroke="${sac}" stroke-width="3.4"
      fill="none" stroke-linecap="round"></path>
    <path d="M79 ${kasDis} q-7-4-14 ${kasIc-kasDis-2}" stroke="${sac}" stroke-width="3.4"
      fill="none" stroke-linecap="round"></path>
    <!-- gözler -->
    <ellipse class="yzgoz" cx="48" cy="58" rx="5.4" ry="${gozRy}" fill="#F3F1EC"></ellipse>
    <ellipse class="yzgoz" cx="72" cy="58" rx="5.4" ry="${gozRy}" fill="#F3F1EC"></ellipse>
    <circle cx="${48+d*1.1}" cy="58" r="2.3" fill="#1D2226"></circle>
    <circle cx="${72+d*1.1}" cy="58" r="2.3" fill="#1D2226"></circle>
    ${z.gozluk?`<g stroke="#2A3138" stroke-width="2.2" fill="none">
        <rect x="40" y="51" width="17" height="14" rx="4"></rect>
        <rect x="63" y="51" width="17" height="14" rx="4"></rect>
        <path d="M57 58 h6"></path><path d="M40 55 l-8-3"></path><path d="M80 55 l8-3"></path></g>`:""}
    <!-- burun -->
    <path d="M60 60 q-3 8 2 10" stroke="rgba(0,0,0,.22)" stroke-width="2" fill="none"
      stroke-linecap="round"></path>
    <!-- ağız -->
    <path d="M46 ${78-Math.max(0,d)*2} Q60 ${78+agiz-18+d*10} 74 ${78-Math.max(0,d)*2}"
      stroke="#7A3A33" stroke-width="3.2" fill="none" stroke-linecap="round"></path>
    ${kizgin?`<path d="M50 86 q10 3 20 0" stroke="rgba(0,0,0,.18)" stroke-width="2"
       fill="none" stroke-linecap="round"></path>`:""}
    ${z.biyik?`<path d="M47 74 q13-5 26 0 q-13 4-26 0z" fill="${sac}"></path>`:""}
    ${z.sakal?`<path d="M36 64 q2 26 24 27 q22-1 24-27 q-8 20-24 20 q-16 0-24-20z"
       fill="${sac}" opacity=".88"></path>`:""}
    ${z.genc?`<circle cx="42" cy="70" r="2" fill="rgba(200,110,90,.35)"></circle>
              <circle cx="78" cy="70" r="2" fill="rgba(200,110,90,.35)"></circle>`:""}
    ${ter?`<path class="yzter" d="M90 42 q4 7 0 10 q-4-3 0-10z" fill="#7FC4E8" opacity=".85"></path>`:""}
  </svg>`;
}
/** Hamleden sonra yüze kısa bir tepki sınıfı ver. */
function yuzTepki(sinif){
  requestAnimationFrame(()=>{
    document.querySelectorAll("#sheet .yuz").forEach(e=>{
      e.classList.remove("yz-shake","yz-nod","yz-kalk");
      if(sinif){ void e.offsetWidth; e.classList.add(sinif); }
    });
  });
}
/** Pazarlık başlığındaki yüz kartı. */
function yuzKart(k, ad, aciklama, mood, sabirOran, moodLbl, moodCol){
  return `<div class="yuzkart">
    <div class="yuzcer" style="--mrenk:${moodCol}">${yuzSvg(k, mood, sabirOran)}</div>
    <div style="flex:1;min-width:0">
      <b style="font-size:13.5px">${ad}</b>
      <div class="sec-note" style="line-height:1.4">${aciklama}</div>
    </div>
  </div>`;
}
