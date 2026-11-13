// Série de jours avec joker : un jour manqué ne casse pas tout.
// Calculée uniquement à partir des jours joués (donc sûre à fusionner entre appareils).
// Règles : on commence avec 1 joker ; chaque 7e jour de série en rapporte un (2 au maximum) ;
// un jour manqué consomme un joker (la série est conservée mais n'avance pas), sans joker la série repart de zéro.
import { addDays } from "./dates.js";

export function computeStreak(s, today) {
  const played = Object.keys(s.days).filter((d) => s.days[d].tot > 0 && d <= today).sort();
  if (!played.length) return { current: 0, best: 0, jokers: 1, playedToday: false };
  const set = new Set(played);
  let streak = 0, jokers = 1, best = 0;
  for (let d = played[0]; d <= today; d = addDays(d, 1)) {
    if (set.has(d)) { streak++; if (streak % 7 === 0) jokers = Math.min(2, jokers + 1); }
    else if (d < today) { if (jokers > 0) jokers--; else streak = 0; }
    best = Math.max(best, streak);
  }
  return { current: streak, best, jokers, playedToday: set.has(today) };
}
