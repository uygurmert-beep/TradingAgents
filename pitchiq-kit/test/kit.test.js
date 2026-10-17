import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeName, editDistance, percentPhrase } from "../src/text.js";
import { createPlayerIndex, describe, MIN_QUERY } from "../src/search.js";
import { dayKeyTR, puzzleNumber, msUntilNextPuzzle, formatCountdown, seededIndex, updateStreak } from "../src/daily.js";
import { createDailyLimit, FREE_GAMES_PER_DAY } from "../src/limit.js";
import { createHintLadder } from "../src/hints.js";
import { rankFor, percentileBetter } from "../src/ranks.js";
import { shareText } from "../src/share.js";
import { SAMPLE_PLAYERS } from "../src/players.sample.js";

const idx = createPlayerIndex(SAMPLE_PLAYERS);
const top = (q) => idx.search(q)[0]?.player.id;

test("Turkish normalisation", () => {
  assert.equal(normalizeName("Özil"), "ozil");
  assert.equal(normalizeName("  MESUT   ÖZİL "), "mesut ozil");
  assert.equal(normalizeName("Rüştü Reçber"), "rustu recber");
  assert.equal(normalizeName("Zlatan İbrahimović"), "zlatan ibrahimovic");
  assert.equal(normalizeName("Kerimoğlu"), "kerimoglu");
  assert.equal(normalizeName("Ronaldinho Gaúcho"), "ronaldinho gaucho");
});

test("edit distance handles swaps", () => {
  assert.equal(editDistance("ozli", "ozil"), 1);
  assert.equal(editDistance("hagi", "hagi"), 0);
});

test("search: Turkish chars typed on an English keyboard", () => {
  assert.equal(top("Ozil"), "ozil");
  assert.equal(top("rustu"), "rustu");
  assert.equal(top("hakan sukur"), "hakan");
  assert.equal(top("belozoglu"), "emre");
});

test("search: typos and partial typing", () => {
  assert.equal(top("ozli"), "ozil");
  assert.equal(top("drgoba"), "drogba");
  assert.equal(top("ibrahm"), "zlatan");
  assert.equal(top("sneider"), "sneijder");
});

test("search: nicknames", () => {
  assert.equal(top("Hagi"), "hagi");
  assert.equal(top("comandante"), "hagi");
  assert.equal(top("CR7"), "cr7");
  assert.equal(top("R9"), undefined, "2 characters is below the minimum");
  assert.equal(idx.search("R10")[0].player.id, "ronaldinho");
});

test("search: both Ronaldos are offered and described apart", () => {
  const ids = idx.search("ronaldo").map((r) => r.player.id);
  assert.ok(ids.includes("r9") && ids.includes("cr7"));
  assert.equal(describe(SAMPLE_PLAYERS.find((p) => p.id === "cr7")), "Cristiano Ronaldo · 1985 · Forvet");
});

test("search: no suggestions under the minimum length", () => {
  assert.equal(MIN_QUERY, 3);
  assert.deepEqual(idx.search("me"), []);
  assert.ok(idx.search("mes").length > 0);
});

test("answer matching", () => {
  assert.ok(idx.matches("Mesut Ozil", "ozil"));
  assert.ok(idx.matches("ozli", "ozil"));
  assert.ok(!idx.matches("Messi", "ozil"));
});

test("daily clock switches at 00:00 Turkey time", () => {
  assert.equal(dayKeyTR(new Date("2026-11-01T20:59:59Z")), "2026-11-01");
  assert.equal(dayKeyTR(new Date("2026-11-01T21:00:00Z")), "2026-11-02");
  assert.equal(puzzleNumber(new Date("2026-11-01T12:00:00Z")), 1);
  assert.equal(puzzleNumber(new Date("2026-11-03T22:00:00Z")), 4);
  assert.equal(puzzleNumber(new Date("2026-10-01T12:00:00Z")), 1, "never below #1");
  assert.equal(msUntilNextPuzzle(new Date("2026-11-01T20:00:00Z")), 3600 * 1000);
  assert.equal(formatCountdown(3725 * 1000), "01:02:05");
});

test("seeded pick is stable and in range", () => {
  const a = seededIndex("2026-11-01", 20000);
  assert.equal(a, seededIndex("2026-11-01", 20000));
  assert.ok(a >= 0 && a < 20000);
  const days = new Set(Array.from({ length: 30 }, (_, i) => seededIndex(`2026-11-${String(i + 1).padStart(2, "0")}`, 20000)));
  assert.ok(days.size > 25, "different days give different puzzles");
});

test("streak with one freeze", () => {
  let s = updateStreak({}, "2026-11-01");
  assert.equal(s.count, 1);
  s = updateStreak(s, "2026-11-02"); assert.equal(s.count, 2);
  s = updateStreak(s, "2026-11-02"); assert.equal(s.changed, false);
  s = updateStreak(s, "2026-11-04"); assert.equal(s.count, 3); assert.ok(s.frozeUsed); assert.equal(s.freezes, 0);
  s = updateStreak(s, "2026-11-06"); assert.equal(s.count, 1); assert.ok(s.reset);
});

test("daily limit: 5 counted games, daily and IQ test free, resets next day", () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  let now = new Date("2026-11-01T10:00:00Z");
  const lim = createDailyLimit(storage, { now: () => now });
  for (let i = 0; i < FREE_GAMES_PER_DAY; i++) assert.ok(lim.consume("grid"));
  assert.equal(lim.remaining(), 0);
  assert.ok(!lim.consume("grid"));
  assert.ok(lim.canPlay("daily") && lim.canPlay("iq"));
  assert.equal(lim.label(), "Bugünkü maçların bitti");
  now = new Date("2026-11-01T21:30:00Z");
  assert.equal(lim.label(), "Bugün 5 maçın kaldı");
  const pro = createDailyLimit(storage, { isPro: () => true });
  assert.equal(pro.label(), "Pro · sınırsız");
});

test("hint ladder order, cost and penalty", () => {
  const p = SAMPLE_PLAYERS[0];
  const h = createHintLadder({ tokens: 3 });
  assert.ok(h.clean);
  assert.equal(h.use(p).value, "Almanya");
  assert.equal(h.use(p).value, "Ofansif orta saha");
  assert.equal(h.next().id, "initial");
  assert.equal(h.canUse(), false, "first letter costs 2, only 1 token left");
  assert.equal(h.use(p), null);
  assert.equal(h.penalty(), 25);
  assert.ok(!h.clean);
});

test("ranks and percentile", () => {
  assert.equal(rankFor(0).rank.name, "Çaylak");
  assert.equal(rankFor(148).rank.name, "Yıldız");
  assert.equal(rankFor(148).toNext, 12);
  assert.equal(rankFor(148).next.to, "Efsane'ye");
  assert.equal(rankFor(200).rank.name, "Galaktik Beyin");
  assert.equal(rankFor(200).next, null);
  assert.equal(percentileBetter(80, [10, 50, 70, 90, 100]), 60);
});

test("share text has no answers in it", () => {
  const t = shareText({ puzzleNo: 214, results: [["hit", "hit", "near"], ["hit", "miss", "hit"]], time: "1:42", hintsUsed: 1, better: 82 });
  assert.equal(t, "Pitch IQ · Günün Maçı #214\n🟩🟩🟨\n🟩🟥🟩\n4/6 · ⏱ 1:42 · 💡×1 · oyuncuların %82'sinden iyi\npitchiq.app");
  assert.match(shareText({ puzzleNo: 1, results: [["hit", "miss"]], palette: "colorblind" }), /🟦🟧/);
});

test("Turkish percentage suffix follows how the number is read", () => {
  const cases = { 82: "%82'sinden", 40: "%40'ından", 100: "%100'ünden", 1: "%1'inden", 6: "%6'sından", 9: "%9'undan", 10: "%10'undan", 73: "%73'ünden", 50: "%50'sinden", 95: "%95'inden", 0: "%0'ından", 64: "%64'ünden", 30: "%30'undan" };
  for (const [n, want] of Object.entries(cases)) assert.equal(percentPhrase(Number(n)), want);
});
