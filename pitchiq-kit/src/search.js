// Forgiving player search: Turkish characters, typos, nicknames ("Hagi", "R9", "CR7").
// Players: [{ id, name, born, pos, nation, aliases?: [] }]
import { normalizeName, editDistance, typoBudget } from "./text.js";

export const MIN_QUERY = 3; // no suggestions on 1–2 letters, so the list can't solve the puzzle for you

export function createPlayerIndex(players) {
  const entries = [];
  for (const p of players) {
    const names = [p.name, ...(p.aliases || [])].map(normalizeName).filter(Boolean);
    for (const n of new Set(names)) entries.push({ p, n, tokens: n.split(" "), alias: n !== normalizeName(p.name) });
  }

  function score(q, e) {
    const qTokens = q.split(" ");
    if (e.n === q) return 100;
    if (e.n.startsWith(q)) return 90 - (e.n.length - q.length) * 0.1;
    // every query token must match some name token (prefix or within typo budget)
    let total = 0;
    for (const qt of qTokens) {
      let best = 0;
      for (const t of e.tokens) {
        if (t === qt) best = Math.max(best, 80);
        else if (qt.length >= MIN_QUERY && t.startsWith(qt)) best = Math.max(best, 70);
        else {
          // whole-token typo ("ozli" → "ozil") or a typo while still typing ("ibrahm" → "ibrahimovic")
          const budget = typoBudget(qt.length);
          const d = Math.min(editDistance(qt, t, budget), qt.length >= 4 ? editDistance(qt, t.slice(0, qt.length), budget) : budget + 1);
          if (d <= budget) best = Math.max(best, 60 - d * 10);
        }
      }
      if (!best) return 0;
      total += best;
    }
    return total / qTokens.length - (e.alias ? 1 : 0);
  }

  return {
    search(query, { limit = 6 } = {}) {
      const q = normalizeName(query);
      if (q.replace(/ /g, "").length < MIN_QUERY) return [];
      const best = new Map();
      for (const e of entries) {
        const s = score(q, e);
        if (s > 0 && s > (best.get(e.p.id)?.score ?? 0)) best.set(e.p.id, { player: e.p, score: s, via: e.alias ? e.n : null });
      }
      return [...best.values()].sort((a, b) => b.score - a.score || a.player.name.localeCompare(b.player.name, "tr")).slice(0, limit);
    },
    // Is this free-typed answer the target player? Same rules as the suggestions.
    matches(query, playerId) {
      return this.search(query, { limit: 3 }).some((r) => r.player.id === playerId && r.score >= 50);
    },
  };
}

// "Cristiano Ronaldo · 1985 · Forvet" — keeps two Ronaldos apart in the list.
export const describe = (p) => [p.name, p.born, p.pos].filter(Boolean).join(" · ");
