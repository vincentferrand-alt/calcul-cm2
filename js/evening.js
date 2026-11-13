// « Énigme du soir » (v0.12) : une fois par jour, à partir de 18 h, la créature pose un calcul bonus avant de dormir.
// Une étoile en cadeau (même après deux essais : elle est récompensée d'avoir joué, jamais punie).
// Sauvegarde : eve = { date: { ok, n } } — union à la fusion ; une seule énigme par jour, même sur deux appareils.
import { generate, choices, makeRng } from "./generator.js";
import { CREATURES, creatureById } from "./creatures.js";

export const EVENING_HOUR = 18;
export const eveningDone = (s, date) => !!(s.eve && s.eve[date]);
export const eveningOpen = (s, date, hour) => hour >= EVENING_HOUR && !eveningDone(s, date);
export const eveningCount = (s) => Object.keys(s.eve || {}).length;

// Graine tirée de la date : la même énigme si elle rouvre l'appli (ou sur l'autre appareil) le même soir.
const seedOf = (date, id) => [...`${date}|${id}`].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);

// L'énigme de la créature affichée (famille de calcul de la créature, à son niveau ; l'œuf : additions au niveau 1).
export function eveningRiddle(s, date, creatureId) {
  const c = creatureById(creatureId) || CREATURES[0];
  const f = s.fam[c.fam], lvl = Math.max(1, Math.min(4, (f && f.lvl) || 1));
  const rng = makeRng(seedOf(date, c.id));
  const prob = generate(c.fam, lvl, rng);
  return { creature: c.id, prob, options: choices(prob, rng) };
}

export function completeEvening(s, date, ok, tries) {
  if (eveningDone(s, date)) return false;
  (s.eve ||= {})[date] = { ok: !!ok, n: tries };
  return true;
}
