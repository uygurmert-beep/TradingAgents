// Pitch IQ test ranks on the 0–200 scale. Çaylak and Galaktik Beyin come from the game;
// the names in between are the panel's proposal — replace them with the game's own if it has them.
export const RANKS = [
  // `to` is the name with its dative suffix: "Efsane'ye 12 puan".
  { min: 0, name: "Çaylak", to: "Çaylak'a" },
  { min: 40, name: "Yedek", to: "Yedek'e" },
  { min: 70, name: "İlk 11", to: "İlk 11'e" },
  { min: 100, name: "Kaptan", to: "Kaptan'a" },
  { min: 130, name: "Yıldız", to: "Yıldız'a" },
  { min: 160, name: "Efsane", to: "Efsane'ye" },
  { min: 185, name: "Galaktik Beyin", to: "Galaktik Beyin'e" },
];
export const MAX_IQ = 200;

export function rankFor(score) {
  const s = Math.max(0, Math.min(MAX_IQ, score));
  let i = 0;
  while (i + 1 < RANKS.length && s >= RANKS[i + 1].min) i++;
  const next = RANKS[i + 1] || null;
  return { index: i, rank: RANKS[i], next, toNext: next ? next.min - s : 0, progress: next ? (s - RANKS[i].min) / (next.min - RANKS[i].min) : 1 };
}

// "Oyuncuların %82'sinden iyi": share of a reference distribution strictly below the score.
export function percentileBetter(score, distribution) {
  if (!distribution?.length) return null;
  const below = distribution.filter((d) => d < score).length;
  return Math.round((below / distribution.length) * 100);
}
