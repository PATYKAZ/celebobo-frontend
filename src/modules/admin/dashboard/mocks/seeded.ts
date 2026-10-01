/** PRNG déterministe (mulberry32) pour des mocks stables sur une même journée. */
export function rng(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const todayKey = () => new Date().toISOString().slice(0, 10);

export const pct = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : 0);

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
export const monthLabel = (d: Date) => MONTHS[d.getMonth()];
export const dayLabel = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
