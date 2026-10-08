// Pitch IQ prototype: shows the panel's decisions working together on sample data.
import { createPlayerIndex, describe } from "../src/search.js";
import { dayKeyTR, puzzleNumber, msUntilNextPuzzle, formatCountdown, seededIndex, updateStreak } from "../src/daily.js";
import { createDailyLimit } from "../src/limit.js";
import { createHintLadder, HINTS } from "../src/hints.js";
import { rankFor, RANKS, percentileBetter } from "../src/ranks.js";
import { shareText, drawStoryCard, shareResult } from "../src/share.js";
import { SAMPLE_PLAYERS } from "../src/players.sample.js";
import { percentPhrase } from "../src/text.js";

const LOGO = `<svg viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" fill="#0F5132"/><rect x="97" y="143" width="40" height="212" rx="8" fill="#F7F5EE"/><circle cx="285" cy="249" r="98" fill="none" stroke="#F7F5EE" stroke-width="40"/><line x1="347" y1="313" x2="395" y2="361" stroke="#FFD200" stroke-width="40" stroke-linecap="round"/><circle cx="285" cy="249" r="17" fill="#FFD200"/></svg>`;
const MODES = [
  { id: "grid", ico: "🔲", name: "Izgara", min: 4, diff: 3 },
  { id: "career", ico: "❓", name: "Kariyer", min: 2, diff: 2, playable: true },
  { id: "blitz", ico: "⚡", name: "Şimşek Tur", min: 1, diff: 2 },
  { id: "duel", ico: "⚔️", name: "Düello", min: 3, diff: 2 },
  { id: "secret", ico: "🕵️", name: "Gizli", min: 2, diff: 3 },
  { id: "common", ico: "🔗", name: "Ortak Takım", min: 2, diff: 2 },
  { id: "connect", ico: "🧩", name: "Bağlantılar", min: 5, diff: 3 },
  { id: "top10", ico: "🔟", name: "İlk 10", min: 4, diff: 1 },
];
const DEMO_LAUNCH = "2026-03-16"; // pretend the game has been live for a while
const SAMPLE_IQ = 148; // example score, marked as such on screen
const SAMPLE_DISTRIBUTION = [2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 8, 9]; // example: daily solve scores out of 10

const store = (() => {
  const mem = {};
  const ok = (() => { try { localStorage.setItem("piq.t", "1"); localStorage.removeItem("piq.t"); return true; } catch { return false; } })();
  return {
    getItem: (k) => (ok ? localStorage.getItem(k) : mem[k] ?? null),
    setItem: (k, v) => { if (ok) { try { localStorage.setItem(k, v); } catch {} } else mem[k] = v; },
    removeItem: (k) => { if (ok) { try { localStorage.removeItem(k); } catch {} } delete mem[k]; },
  };
})();
const load = (k, d) => { try { return JSON.parse(store.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => store.setItem(k, JSON.stringify(v));

const index = createPlayerIndex(SAMPLE_PLAYERS);
const limit = createDailyLimit(store);
const today = dayKeyTR();
const dailyPlayer = SAMPLE_PLAYERS[seededIndex(today, SAMPLE_PLAYERS.length)];
let settings = load("piq.settings", { cb: false, fs: 16 });
let profile = load("piq.profile", null); // null = first launch
let streak = load("piq.streak", { count: 0, last: null, freezes: 1 });
let dailyDone = load("piq.daily", null);
dailyDone = dailyDone && dailyDone.day === today ? dailyDone : null;
let tokens = load("piq.tokens", 3);
const $app = document.getElementById("app");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function applySettings() {
  document.documentElement.dataset.cb = settings.cb ? "1" : "0";
  document.documentElement.style.setProperty("--fs", settings.fs + "px");
}

function toast(msg) {
  document.querySelector(".toast")?.remove();
  const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
  document.body.append(t); setTimeout(() => t.remove(), 2600);
}

function bar() {
  const r = limit.remaining();
  return `<header class="bar"><span class="logo">${LOGO}<span>PITCH <b>IQ</b></span></span><span class="spacer"></span>
    ${profile ? `<span class="chip ${r === 0 ? "zero" : ""}" title="Günün Maçı ve IQ Testi sayılmaz">⚽ ${esc(limit.label())}</span>` : ""}
    <button class="icon-btn" data-act="settings" aria-label="Ayarlar">⚙️</button></header>`;
}

/* ---------- home ---------- */
let timer;
function home() {
  clearInterval(timer);
  const n = puzzleNumber(undefined, DEMO_LAUNCH);
  const r = rankFor(SAMPLE_IQ);
  const lim = limit.remaining();
  $app.innerHTML = `${bar()}
  <section class="hero" aria-labelledby="daily-h">
    <span class="label">Günün Maçı · #${n}</span>
    ${dailyDone ? `
      <div class="solved"><span class="score">${dailyDone.won ? "✓" : "✕"}</span><div><h1 id="daily-h">${dailyDone.won ? "Bugünü kazandın" : "Bugün olmadı"}</h1><span>${dailyDone.won ? `${dailyDone.tries}. denemede · ${dailyDone.hints} ipucu` : "Cevap: " + esc(dailyPlayer.name)}</span></div></div>
      <div class="hero-row"><span class="chip streak">🔥 ${streak.count} gün seri</span><span class="chip">🧊 ${streak.freezes} koruyucu</span></div>
      <div><span class="label">Yeni bulmaca</span><div class="count" id="count">${formatCountdown(msUntilNextPuzzle())}</div></div>
      <button class="btn gold block" data-act="share-daily">Sonucu paylaş</button>`
    : `
      <h1 id="daily-h">Bugünün futbolcusu kim?</h1>
      <p>Herkese aynı bulmaca. Kariyer yolundan futbolcuyu bul.</p>
      <div class="hero-row"><span class="chip streak">🔥 ${streak.count} gün seri</span><span class="chip">⏳ <span id="count">${formatCountdown(msUntilNextPuzzle())}</span></span></div>
      <button class="btn gold block" data-act="play-daily">Günün Maçı'nı oyna</button>`}
  </section>

  ${lim === 0 ? `<div class="card" role="status"><b>Bugünkü 5 maçın bitti.</b><span class="muted">Günün Maçı ve IQ Testi her zaman açık. Yarın 00:00'da 5 maç daha.</span><button class="btn ghost" data-act="pro">Pro ile sınırsız oyna</button></div>` : ""}

  <h2 class="section">Modlar</h2>
  <div class="modes">${MODES.map((m) => `<button class="mode ${m.playable ? "" : "locked"}" data-mode="${m.id}">
    <span class="ico" aria-hidden="true">${m.ico}</span><b>${m.name}</b>
    <span class="meta">⏱ ${m.min} dk <span class="dots" aria-label="Zorluk ${m.diff}/3">${[1, 2, 3].map((i) => `<i class="${i <= m.diff ? "on" : ""}"></i>`).join("")}</span></span></button>`).join("")}</div>

  <h2 class="section">Rütben</h2>
  <section class="rank" aria-label="Rütbe yolculuğu">
    <div class="rank-top"><b>${r.rank.name}</b><span class="muted">IQ ${SAMPLE_IQ} (örnek)</span></div>
    <div class="ladder" aria-hidden="true">${RANKS.map((x, i) => `<span class="${i < r.index ? "done" : i === r.index ? "cur" : ""}"></span>`).join("")}</div>
    <div class="ladder-names"><span>${RANKS[0].name}</span><span>${r.next ? `${r.next.to} ${r.toNext} puan` : "Zirvedesin"}</span><span class="locked" aria-label="Kilitli rütbe">${RANKS[RANKS.length - 1].name}</span></div>
    <button class="btn ghost" data-act="iq">IQ Testini tekrar al</button>
  </section>
  <p class="demo-note">Prototip: Kariyer ve Günün Maçı oynanabilir; diğer modlar ve IQ testi gösterim amaçlı. Futbolcu verisi 18 kişilik örnek liste. Ayarlardan renk körü modunu ve yazı boyutunu deneyebilirsin.</p>`;
  timer = setInterval(() => { const c = document.getElementById("count"); if (c) c.textContent = formatCountdown(msUntilNextPuzzle()); }, 1000);
}

/* ---------- career round ---------- */
function career({ player, mode, firstRun = false }) {
  clearInterval(timer);
  const hints = createHintLadder({ tokens });
  const tries = [];
  const started = Date.now();
  let done = false;

  function render() {
    $app.innerHTML = `${firstRun ? `<header class="bar"><span class="logo">${LOGO}<span>PITCH <b>IQ</b></span></span></header><p class="label">İlk maçın · kayıt yok, hemen oyna</p>` : bar()}
      <h2 class="section" style="margin-top:8px">${mode === "daily" ? `Günün Maçı #${puzzleNumber(undefined, DEMO_LAUNCH)}` : "Kariyer"}</h2>
      <p class="muted">Bu kariyer yolu kimin? 3 hakkın var.</p>
      <ol class="path">${player.clubs.map((c) => `<li>${esc(c)}</li>`).join("")}</ol>
      <div class="guesses" aria-label="Tahminler">${[0, 1, 2].map((i) => {
        const t = tries[i];
        return t ? `<div class="g ${t.res}"><span><span class="sym" aria-hidden="true">${t.res === "hit" ? "✓" : t.res === "near" ? "~" : "✕"}</span>${esc(t.name)}</span></div>` : `<div class="g" aria-label="Boş tahmin">${i + 1}</div>`;
      }).join("")}</div>
      <p class="feedback" id="fb" role="status">${hintText()}</p>
      <div class="dock">
        <div class="hints" role="group" aria-label="İpuçları · ${hints.tokens} jeton">${HINTS.map((h, i) => {
          const used = hints.used.includes(h.id);
          const isNext = i === hints.used.length;
          return `<button class="hint ${used ? "used" : ""}" data-hint="${h.id}" ${used || !isNext || hints.tokens < h.cost ? "disabled" : ""}>
            <b>${used ? esc(h.reveal(player)) : h.label}</b><small>${used ? "açıldı" : `${h.cost} jeton · −${h.penalty} puan`}</small></button>`;
        }).join("")}</div>
        <div class="search"><div class="sugs" id="sugs" role="listbox" hidden></div>
          <input id="q" type="text" inputmode="search" autocomplete="off" autocapitalize="words" placeholder="Futbolcu yaz (en az 3 harf)" aria-label="Futbolcu ara" aria-controls="sugs"></div>
        <p class="muted" style="font-size:.85rem;margin:0">Jeton: ${hints.tokens} · Türkçe karakter şart değil: "ozil" da olur.</p>
      </div>`;
    wire();
  }
  function hintText() {
    if (!hints.used.length) return "";
    return "İpucu: " + hints.used.map((id) => HINTS.find((h) => h.id === id).reveal(player)).join(" · ");
  }
  function wire() {
    const q = document.getElementById("q"), sugs = document.getElementById("sugs");
    let sel = -1, list = [];
    const show = () => {
      list = index.search(q.value, { limit: 5 });
      sel = list.length ? 0 : -1;
      if (q.value.trim().length > 0 && q.value.replace(/\s/g, "").length < 3) { sugs.hidden = false; sugs.innerHTML = `<div class="hintline">Öneriler 3. harften sonra gelir</div>`; return; }
      sugs.hidden = !list.length;
      sugs.innerHTML = list.map((r, i) => `<button role="option" data-id="${r.player.id}" aria-selected="${i === sel}">${esc(r.player.name)}<small>${esc(describe(r.player).split(" · ").slice(1).join(" · "))}${r.via ? ` · “${esc(r.via)}”` : ""}</small></button>`).join("");
    };
    q.addEventListener("input", show);
    q.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (!list.length) return; sel = (sel + (e.key === "ArrowDown" ? 1 : list.length - 1)) % list.length; [...sugs.children].forEach((b, i) => b.setAttribute("aria-selected", i === sel)); }
      if (e.key === "Enter" && sel >= 0) guess(list[sel].player);
      if (e.key === "Escape") sugs.hidden = true;
    });
    sugs.addEventListener("click", (e) => { const b = e.target.closest("button[data-id]"); if (b) guess(SAMPLE_PLAYERS.find((p) => p.id === b.dataset.id)); });
    document.querySelectorAll("[data-hint]").forEach((b) => b.addEventListener("click", () => {
      if (hints.use(player)) { tokens = hints.tokens; save("piq.tokens", tokens); render(); document.getElementById("q").focus(); }
    }));
    if (!firstRun) document.querySelector('[data-act="settings"]')?.addEventListener("click", settingsSheet);
    q.focus({ preventScroll: true });
  }
  function guess(p) {
    if (done || tries.some((t) => t.id === p.id)) return;
    const res = p.id === player.id ? "hit" : p.clubs.some((c) => player.clubs.includes(c)) ? "near" : "miss";
    tries.push({ id: p.id, name: p.name.split(" ").slice(-1)[0], res });
    if (res === "hit" || tries.length === 3) return finish(res === "hit");
    render();
    const fb = document.getElementById("fb");
    fb.textContent = res === "near" ? `Yakın: ${p.name} ile aynı kulüpte oynamış.` : `${p.name} değil.`;
  }
  function finish(won) {
    done = true;
    const secs = Math.round((Date.now() - started) / 1000);
    const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
    const points = won ? Math.max(1, 10 - (tries.length - 1) * 3 - Math.round(hints.penalty() / 10)) : 0;
    const better = percentileBetter(points, SAMPLE_DISTRIBUTION);
    const results = [tries.map((t) => t.res)];
    if (mode === "daily") {
      dailyDone = { day: today, won, tries: tries.length, hints: hints.used.length, time, results, better };
      save("piq.daily", dailyDone);
      if (won) { streak = updateStreak(streak, today); save("piq.streak", streak); if (streak.frozeUsed) toast("Serin koruyucuyla kurtarıldı 🧊"); }
    } else if (!firstRun) limit.consume(mode);
    resultScreen({ won, player, time, results, better, hintsUsed: hints.used.length, firstRun, mode });
  }
  render();
}

/* ---------- result ---------- */
function resultScreen({ won, player, time, results, better, hintsUsed, firstRun, mode }) {
  const text = shareText({ puzzleNo: puzzleNumber(undefined, DEMO_LAUNCH), results, time, hintsUsed, better: won ? better : null, palette: settings.cb ? "colorblind" : "default" });
  $app.innerHTML = `${firstRun ? `<header class="bar"><span class="logo">${LOGO}<span>PITCH <b>IQ</b></span></span></header>` : bar()}
    <section class="card" aria-live="polite">
      <span class="label">${won ? "Gol!" : "Bu sefer olmadı"}</span>
      <span class="big">${won ? esc(player.name) : "Cevap: " + esc(player.name)}</span>
      ${won ? `<span>${results[0].length}. denemede · ⏱ ${time}${better != null ? ` · <b>oyuncuların ${percentPhrase(better)} iyi</b> <span class="muted">(örnek dağılım)</span>` : ""}</span>` : ""}
    </section>
    ${won ? "" : `<section class="card learn" aria-label="Öğrenme kartı">
      <span class="label">Bunu bil</span>
      <b>${esc(describe(player))} · ${esc(player.nation)}</b>
      <div class="clubs">${player.clubs.map((c) => `<span>${esc(c)}</span>`).join("")}</div>
      <button class="btn ghost" data-act="save-card">Kartı kaydet</button></section>`}
    ${mode === "daily" ? `<section class="card"><span class="label">Spoiler'sız paylaş</span>
      <div class="share-preview"><canvas id="story" aria-label="Story kartı önizlemesi"></canvas><pre class="sharetext">${esc(text)}</pre></div>
      <button class="btn gold" data-act="share">Paylaş</button></section>` : ""}
    <div class="dock">${firstRun
      ? `<form class="card" id="onb" style="margin:0"><span class="label">Skorunu sakla</span>
          <label class="field">Takma adın<input id="nick" required maxlength="20" placeholder="Örn. Sol Bek"></label>
          <label class="field">Tuttuğun takım (isteğe bağlı)<input id="team" maxlength="30" placeholder="Örn. Ankara"></label>
          <button class="btn gold block">Devam et</button>
          <span class="muted" style="font-size:.85rem">Hesap yok, e-posta yok. Canlı liderliği açarsan yalnızca takma adın ve skorun gönderilir.</span></form>`
      : `<button class="btn gold block" data-act="home">Ana ekrana dön</button>`}</div>`;
  if (mode === "daily") drawStoryCard(document.getElementById("story"), { puzzleNo: puzzleNumber(undefined, DEMO_LAUNCH), results, time, better: won ? better : null, palette: settings.cb ? "colorblind" : "default" });
  document.querySelector('[data-act="settings"]')?.addEventListener("click", settingsSheet);
  document.querySelector('[data-act="home"]')?.addEventListener("click", home);
  document.querySelector('[data-act="save-card"]')?.addEventListener("click", () => toast("Kart kaydedildi (prototip)"));
  document.querySelector('[data-act="share"]')?.addEventListener("click", async () => {
    const r = await shareResult({ text, canvas: document.getElementById("story") });
    toast(r === "shared" ? "Paylaşıldı" : r === "copied" ? "Sonuç metni kopyalandı" : r === "cancelled" ? "Paylaşım iptal edildi" : "Paylaşılamadı; metni seçip kopyalayabilirsin");
  });
  document.getElementById("onb")?.addEventListener("submit", (e) => {
    e.preventDefault();
    profile = { nick: document.getElementById("nick").value.trim(), team: document.getElementById("team").value.trim() };
    save("piq.profile", profile); toast(`Hoş geldin, ${profile.nick}!`); home();
  });
}

/* ---------- settings ---------- */
function settingsSheet() {
  const el = document.createElement("div"); el.className = "sheet";
  const draw = () => {
    el.innerHTML = `<div role="dialog" aria-modal="true" aria-labelledby="set-h"><h2 class="section" id="set-h" style="margin:0">Ayarlar</h2>
    <div class="row"><span><b>Renk körü modu</b><br><span class="muted" style="font-size:.9rem">Doğru mavi, yanlış turuncu; işaretler her zaman görünür.</span></span><button class="switch" role="switch" aria-checked="${settings.cb}" aria-label="Renk körü modu" data-s="cb"></button></div>
    <div class="row"><b>Yazı boyutu</b><span class="seg" role="group" aria-label="Yazı boyutu">${[[15, "A−"], [16, "A"], [19, "A+"], [22, "A++"]].map(([v, l]) => `<button data-fs="${v}" aria-pressed="${settings.fs === v}">${l}</button>`).join("")}</span></div>
    <button class="btn ghost" data-s="reset">Demoyu sıfırla (ilk açılış)</button>
    <button class="btn gold" data-s="close">Kapat</button></div>`;
  };
  draw(); document.body.append(el);
  el.addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (e.target === el) return el.remove(); if (!t) return;
    if (t.dataset.s === "cb") settings.cb = !settings.cb;
    if (t.dataset.fs) settings.fs = Number(t.dataset.fs);
    if (t.dataset.s === "reset") { ["piq.profile", "piq.streak", "piq.daily", "piq.tokens", "piq.limit"].forEach((k) => store.removeItem(k)); location.reload(); return; }
    if (t.dataset.s === "close") { el.remove(); return; }
    save("piq.settings", settings); applySettings(); draw();
  });
}

/* ---------- events ---------- */
$app.addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  const act = b.dataset.act;
  if (act === "settings") settingsSheet();
  if (act === "play-daily") career({ player: dailyPlayer, mode: "daily" });
  if (act === "share-daily" && dailyDone) resultScreen({ won: dailyDone.won, player: dailyPlayer, time: dailyDone.time, results: dailyDone.results, better: dailyDone.better, hintsUsed: dailyDone.hints, mode: "daily" });
  if (act === "iq") toast("IQ Testi bu prototipte yok");
  if (act === "pro") toast("Pro: aylık 49,90 TL · yıllık 499,90 TL (Google Play)");
  if (b.dataset.mode) {
    const m = MODES.find((x) => x.id === b.dataset.mode);
    if (!m.playable) return toast(`${m.name} bu prototipte yok; Kariyer'i dene`);
    if (!limit.canPlay(m.id)) return toast("Bugünkü 5 maçın bitti. Günün Maçı hâlâ açık!");
    const pool = SAMPLE_PLAYERS.filter((p) => p.id !== dailyPlayer.id);
    career({ player: pool[Math.floor(Math.random() * pool.length)], mode: m.id });
  }
});

applySettings();
if (profile) home();
else career({ player: SAMPLE_PLAYERS.find((p) => p.id === "hagi"), mode: "first", firstRun: true });
