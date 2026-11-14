// « Ma semaine » (v0.14.1) : les 7 jours de la semaine en cours (lundi → dimanche), joués ou non, et les bonnes réponses.
// Logique pure, testée (tests/week.test.mjs). Elle ne lit que s.days, qui fusionne sans perte entre appareils.
import { weekDays, jourCourt } from "./dates.js";

export function weekSummary(s, date) {
  const days = weekDays(date).map((d) => {
    const r = (s.days || {})[d];
    return { date: d, letter: jourCourt(d), played: !!(r && r.tot > 0), ok: r ? Number(r.ok) || 0 : 0, today: d === date, future: d > date };
  });
  return { days, ok: days.reduce((t, d) => t + d.ok, 0), played: days.filter((d) => d.played).length };
}
