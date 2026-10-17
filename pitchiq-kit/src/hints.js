// Hint ladder: nationality → position → first letter. Cost and score penalty are shown before use.
export const HINTS = [
  { id: "nation", label: "Uyruk", cost: 1, penalty: 10, reveal: (p) => p.nation },
  { id: "pos", label: "Mevki", cost: 1, penalty: 15, reveal: (p) => p.pos },
  { id: "initial", label: "Baş harf", cost: 2, penalty: 30, reveal: (p) => p.name.trim()[0].toLocaleUpperCase("tr-TR") + "…" },
];

export function createHintLadder({ tokens = 0 } = {}) {
  const used = [];
  return {
    get used() { return [...used]; },
    get tokens() { return tokens; },
    get clean() { return used.length === 0; }, // leaderboards can mark clean solves
    next() { return HINTS[used.length] || null; },
    canUse() { const h = this.next(); return !!h && tokens >= h.cost; },
    use(player) {
      const h = this.next();
      if (!h || tokens < h.cost) return null;
      tokens -= h.cost;
      used.push(h.id);
      return { ...h, value: h.reveal(player) };
    },
    penalty() { return HINTS.filter((h) => used.includes(h.id)).reduce((s, h) => s + h.penalty, 0); },
  };
}
