/* Özellik grafiği için araç çizimleri.
   Mağaza grafiğindeki araba oyunun kendi çizim motorundan çıkıyor; elle
   çizilmiş bir tanıtım görseli değil. Böylece grafikteki araç ile oyunda
   görünen araç birebir aynı oluyor — "görsel uygulamayı yansıtmıyor"
   itirazının önünü kesiyor. */
const {aracKimlik, aracSvg, aracDonem} = require('./aracciz.js');
const fs = require('fs');

const src = fs.readFileSync(__dirname + '/_modeller_b.js', 'utf8');
const MODELLER = [...src.matchAll(/\{n:"([^"]+)",\s*seg:"(\w+)",\s*np:\s*(\d+),[^}]*y:\[(\d+),(\d+)\]/g)]
  .map(m => ({n: m[1], seg: m[2], y: [+m[4], +m[5]]}));

const SEC = [
  ["Oberon Insigna 1.6 Dizel", "#D9A318"],   // sedan
  ["Volkheim Golfo 1.6 Dizel", "#B8332B"],   // hatchback
  ["Renolta Kango 1.5 Dizel",  "#E9ECEF"]    // panelvan
];

SEC.forEach(([ad, renk], i) => {
  const m = MODELLER.find(x => x.n === ad);
  if (!m) throw new Error("model bulunamadı: " + ad);
  const k = aracKimlik(m.n, m.seg, aracDonem(m));
  fs.writeFileSync(`${__dirname}/magaza/_oz-arac${i}.svg`,
                   aracSvg(k, {renk, asinma: 0.15}, "buyuk"));
  console.log("  magaza/_oz-arac" + i + ".svg  ·  " + ad);
});
