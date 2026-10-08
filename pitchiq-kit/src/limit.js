// Free tier: 5 games a day. Günün Maçı and the IQ test never count. Resets at 00:00 Turkey time.
import { dayKeyTR } from "./daily.js";

export const FREE_GAMES_PER_DAY = 5;
export const UNCOUNTED_MODES = new Set(["daily", "iq"]);

export function createDailyLimit(storage, { isPro = () => false, now = () => new Date(), key = "piq.limit" } = {}) {
  const read = () => {
    try { const v = JSON.parse(storage.getItem(key)); if (v && v.day === dayKeyTR(now())) return v; } catch {}
    return { day: dayKeyTR(now()), used: 0 };
  };
  const write = (v) => { try { storage.setItem(key, JSON.stringify(v)); } catch {} };
  return {
    remaining() { return isPro() ? Infinity : Math.max(0, FREE_GAMES_PER_DAY - read().used); },
    canPlay(mode) { return UNCOUNTED_MODES.has(mode) || this.remaining() > 0; },
    consume(mode) {
      if (UNCOUNTED_MODES.has(mode) || isPro()) return true;
      const v = read();
      if (v.used >= FREE_GAMES_PER_DAY) return false;
      write({ ...v, used: v.used + 1 });
      return true;
    },
    label() {
      const r = this.remaining();
      if (r === Infinity) return "Pro · sınırsız";
      if (r === 0) return "Bugünkü maçların bitti";
      return `Bugün ${r} maçın kaldı`;
    },
  };
}
