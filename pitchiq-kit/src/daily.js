// Günün Maçı clock. Everyone gets the same puzzle, which changes at 00:00 Turkey time.
// Turkey has used a fixed UTC+3 (no DST) since 2016.
const TR_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const LAUNCH_DAY = "2026-11-01"; // puzzle #1 — change to the real launch date

export function dayKeyTR(date = new Date()) {
  return new Date(date.getTime() + TR_OFFSET_MS).toISOString().slice(0, 10);
}

export function puzzleNumber(date = new Date(), launch = LAUNCH_DAY) {
  const days = Math.floor((Date.parse(dayKeyTR(date)) - Date.parse(launch)) / DAY_MS);
  return Math.max(1, days + 1); // before launch every day shows #1
}

export function msUntilNextPuzzle(date = new Date()) {
  const t = date.getTime() + TR_OFFSET_MS;
  return DAY_MS - (((t % DAY_MS) + DAY_MS) % DAY_MS);
}

export function formatCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

// Deterministic pick for the day, identical on every device.
export function seededIndex(dayKey, length, salt = "pitchiq") {
  let h = 2166136261;
  for (const ch of salt + dayKey) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let x = h >>> 0;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) % length;
}

// Streak: consecutive TR days with a solved daily puzzle. One "freeze" covers one missed day.
export function updateStreak(state, today = dayKeyTR()) {
  const s = { count: 0, last: null, freezes: 1, ...state };
  if (s.last === today) return { ...s, changed: false };
  const gap = s.last ? Math.round((Date.parse(today) - Date.parse(s.last)) / DAY_MS) : Infinity;
  if (gap === 1) return { ...s, count: s.count + 1, last: today, changed: true, frozeUsed: false };
  if (gap === 2 && s.freezes > 0) return { ...s, count: s.count + 1, last: today, freezes: s.freezes - 1, changed: true, frozeUsed: true };
  return { ...s, count: 1, last: today, changed: true, frozeUsed: false, reset: s.count > 0 };
}
