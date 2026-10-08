import { percentPhrase } from "./text.js";

// Spoiler-free result sharing: emoji text for WhatsApp, a 1080×1920 story card for Instagram.
export const PALETTES = {
  default: { hit: "🟩", near: "🟨", miss: "🟥", hint: "💡" },
  colorblind: { hit: "🟦", near: "🟨", miss: "🟧", hint: "💡" }, // blue/orange stays apart for red-green colour blindness
};

// results: array of rows, each an array of "hit" | "near" | "miss"
export function shareText({ title = "Pitch IQ", puzzleNo, results, time, hintsUsed = 0, better = null, url = "pitchiq.app", palette = "default" }) {
  const pal = PALETTES[palette] || PALETTES.default;
  const grid = results.map((row) => row.map((r) => pal[r] || "⬜").join("")).join("\n");
  const hits = results.flat().filter((r) => r === "hit").length;
  const total = results.flat().length;
  const meta = [`${hits}/${total}`, time && `⏱ ${time}`, hintsUsed ? `${pal.hint}×${hintsUsed}` : null, better != null ? `oyuncuların ${percentPhrase(better)} iyi` : null].filter(Boolean).join(" · ");
  return `${title} · Günün Maçı #${puzzleNo}\n${grid}\n${meta}\n${url}`;
}

export function drawStoryCard(canvas, { puzzleNo, results, time, better, palette = "default" }) {
  const W = 1080, H = 1920;
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext("2d");
  const g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#13663F"); g.addColorStop(0.5, "#0F5132"); g.addColorStop(1, "#041A10");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // pitch markings
  c.strokeStyle = "rgba(255,255,255,.08)"; c.lineWidth = 6;
  c.beginPath(); c.arc(W / 2, H / 2, 260, 0, Math.PI * 2); c.moveTo(0, H / 2); c.lineTo(W, H / 2); c.stroke();
  c.textAlign = "center"; c.fillStyle = "#F7F5EE";
  c.font = "120px Anton, Impact, sans-serif"; c.fillText("PITCH IQ", W / 2, 300);
  c.fillStyle = "#FFD200"; c.font = "700 56px 'Barlow Condensed', 'Arial Narrow', sans-serif";
  c.fillText(`GÜNÜN MAÇI #${puzzleNo}`, W / 2, 400);
  const colors = palette === "colorblind" ? { hit: "#2F7FD8", near: "#FFD200", miss: "#F08A24" } : { hit: "#2FA35F", near: "#FFD200", miss: "#D6493A" };
  const rows = results.length, cols = Math.max(...results.map((r) => r.length));
  const cell = Math.min(200, 760 / cols), gap = 22;
  const gw = cols * cell + (cols - 1) * gap, x0 = (W - gw) / 2, y0 = 620;
  results.forEach((row, i) => row.forEach((r, j) => {
    const x = x0 + j * (cell + gap), y = y0 + i * (cell + gap);
    c.fillStyle = colors[r] || "#2B3A32";
    roundRect(c, x, y, cell, cell, 28); c.fill();
    // shape mark so the card doesn't rely on colour alone
    c.fillStyle = "rgba(4,26,16,.55)"; c.font = `700 ${cell * 0.42}px Archivo, sans-serif`; c.textBaseline = "middle";
    c.fillText(r === "hit" ? "✓" : r === "near" ? "~" : "✕", x + cell / 2, y + cell / 2 + 4);
  }));
  c.textBaseline = "alphabetic";
  const yMeta = y0 + rows * (cell + gap) + 120;
  const hits = results.flat().filter((r) => r === "hit").length;
  c.fillStyle = "#F7F5EE"; c.font = "110px Anton, Impact, sans-serif";
  c.fillText(`${hits}/${results.flat().length}${time ? "  ·  " + time : ""}`, W / 2, yMeta);
  if (better != null) { c.fillStyle = "#FFD200"; c.font = "700 60px 'Barlow Condensed', sans-serif"; c.fillText(`OYUNCULARIN ${percentPhrase(better).toLocaleUpperCase("tr-TR")} İYİ`, W / 2, yMeta + 100); }
  c.fillStyle = "rgba(247,245,238,.8)"; c.font = "700 48px 'Barlow Condensed', sans-serif";
  c.fillText("SEN DE DENE · PITCHIQ.APP", W / 2, H - 160);
  return canvas;
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

// Web Share with the image when the device supports it, otherwise copy the text.
export async function shareResult({ text, canvas }) {
  try {
    if (canvas && navigator.canShare) {
      const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
      const file = new File([blob], "pitchiq.png", { type: "image/png" });
      if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return "shared"; }
    }
    if (navigator.share) { await navigator.share({ text }); return "shared"; }
  } catch (e) { if (e && e.name === "AbortError") return "cancelled"; }
  try { await navigator.clipboard.writeText(text); return "copied"; } catch { return "failed"; }
}
