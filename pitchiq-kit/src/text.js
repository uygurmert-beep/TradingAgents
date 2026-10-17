// Turkish-aware text normalisation for answer matching.
// "Özil", "OZIL", "özil " and "Ozil" all become "ozil"; "İlkay" and "ilkay" match too.

const TR_MAP = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

export function normalizeName(input) {
  return String(input ?? "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşüâîû]/g, (c) => TR_MAP[c])
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // other accents: é, ã, ć …
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Optimal string alignment distance (Damerau–Levenshtein with adjacent swaps).
export function editDistance(a, b, max = Infinity) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows = [];
  for (let i = 0; i <= a.length; i++) rows.push([i]);
  for (let j = 1; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let best = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, rows[i - 2][j - 2] + 1);
      rows[i][j] = v;
      if (v < best) best = v;
    }
    if (best > max) return max + 1;
  }
  return rows[a.length][b.length];
}

// Typos allowed for a token of this length: none for very short names, 1 up to 6 letters, 2 beyond.
export const typoBudget = (len) => (len <= 3 ? 0 : len <= 6 ? 1 : 2);

// Ablative possessive suffix for a number as it is read aloud: %82'sinden, %40'ından, %100'ünden.
const LAST_WORD = { 0: "ından", 1: "inden", 2: "sinden", 3: "ünden", 4: "ünden", 5: "inden", 6: "sından", 7: "sinden", 8: "inden", 9: "undan" };
const TENS = { 10: "undan", 20: "sinden", 30: "undan", 40: "ından", 50: "sinden", 60: "ından", 70: "inden", 80: "inden", 90: "ından" };
export function suffixFrom(n) {
  n = Math.abs(Math.round(n));
  if (n === 0) return "ından";
  if (n % 1000 === 0) return "inden";   // bin
  if (n % 100 === 0) return "ünden";    // yüz
  if (n % 10 === 0) return TENS[n % 100];
  return LAST_WORD[n % 10];
}
export const percentPhrase = (n) => `%${n}'${suffixFrom(n)}`;
