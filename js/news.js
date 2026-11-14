// Nouvelles regroupées (v0.13) : à l'ouverture et après une synchro, trophées, évolutions et étoiles arrivent ensemble
// dans UN seul bandeau court. Logique pure, testée (tests/news.test.mjs).
import { creatureById } from "./creatures.js";

import { OVERSPENT_TEXT } from "./shop.js";

export const emptyNews = () => ({ trophies: [], creatures: [], stars: 0, overspent: false });

// Ajoute de nouvelles annonces à celles qui attendent : trophées sans doublon, une évolution par créature (du premier
// au dernier stade), étoiles additionnées.
export function mergeNews(a, b) {
  a = a || emptyNews(); b = b || emptyNews();
  const tro = new Map();
  for (const t of [...(a.trophies || []), ...(b.trophies || [])]) if (t && t.id && !tro.has(t.id)) tro.set(t.id, t);
  const cre = new Map();
  for (const e of [...(a.creatures || []), ...(b.creatures || [])]) {
    if (!e || !creatureById(e.id)) continue;
    const p = cre.get(e.id);
    cre.set(e.id, p ? { id: e.id, from: Math.min(p.from, e.from), to: Math.max(p.to, e.to) } : { id: e.id, from: e.from, to: e.to });
  }
  return { trophies: [...tro.values()], creatures: [...cre.values()], stars: Math.max(0, (a.stars || 0) + (b.stars || 0)), overspent: !!(a.overspent || b.overspent) };
}

export const isEmpty = (n) => !n || (!(n.trophies || []).length && !(n.creatures || []).length && !(n.stars > 0) && !n.overspent);

// Le texte du bandeau, son icône et l'écran où mène un appui (créatures d'abord, puis trophées, puis la boutique pour les étoiles).
export function newsSummary(raw) {
  const n = mergeNews(raw, null);
  if (isEmpty(n)) return null;
  const parts = [], cre = n.creatures || [], tro = n.trophies || [];
  if (cre.length === 1) { const e = cre[0], c = creatureById(e.id); parts.push(e.from === 0 ? `${c.name} est né !` : `${c.name} a évolué !`); }
  else if (cre.length > 1) parts.push(`${cre.length} créatures ont grandi !`);
  if (tro.length) parts.push(tro.length === 1 ? "1 nouveau trophée" : `${tro.length} nouveaux trophées`);
  if (n.stars > 0) parts.push(`+${n.stars} ⭐`);
  if (n.overspent) parts.unshift(OVERSPENT_TEXT); // v0.14.1 : expliqué une fois, gentiment, en premier
  const target = cre.length ? "album" : tro.length ? "trophees" : "boutique";
  return { text: parts.join(" · "), icon: cre.length ? "🥚" : tro.length ? "🏆" : n.overspent ? "🛍️" : "⭐", target, long: n.overspent };
}
