// Boutique : les étoiles gagnées en jouant s'échangent contre des accessoires pour les créatures.
// Données (dans la sauvegarde, donc synchronisées) : shop.owned = { idAccessoire: date d'achat } ; shop.worn = { idCréature: { slot: idAccessoire } }.
// Un accessoire acheté n'est jamais perdu (la fusion fait l'union). Le solde = étoiles gagnées − prix des accessoires possédés.
import { ITEMS, itemById } from "./accessories.js";

const shop = (s) => (s.shop ||= { owned: {}, worn: {} });
export const owned = (s, id) => !!(s.shop && s.shop.owned && s.shop.owned[id]);
export const ownedCount = (s) => (s.shop && s.shop.owned ? Object.keys(s.shop.owned).filter((id) => itemById(id)).length : 0);
export const spent = (s) => ITEMS.reduce((t, i) => t + (owned(s, i.id) ? i.price : 0), 0);
export const balance = (s) => Math.max(0, (s.c.stars || 0) - spent(s));
// Ce que porte une créature : { emplacement: idAccessoire }. Chaque choix est daté (le plus récent gagne à la fusion) ; id null = enlevé.
export function wornBy(s, creatureId) {
  const w = (s.shop && s.shop.worn && s.shop.worn[creatureId]) || {};
  return Object.fromEntries(Object.entries(w).filter(([, v]) => v && v.id && owned(s, v.id)).map(([slot, v]) => [slot, v.id]));
}

export function buy(s, id, date) {
  const it = itemById(id);
  if (!it) return { ok: false, why: "inconnu" };
  if (owned(s, id)) return { ok: false, why: "déjà" };
  if (balance(s) < it.price) return { ok: false, why: "étoiles", missing: it.price - balance(s) };
  shop(s).owned[id] = date;
  return { ok: true };
}

// Mettre / enlever un accessoire sur une créature (un seul par emplacement). Retourne ce qui est porté ensuite.
export function toggleWear(s, creatureId, id) {
  const it = itemById(id);
  if (!it || !owned(s, id)) return null;
  const w = (shop(s).worn[creatureId] ||= {});
  const wearing = w[it.slot] && w[it.slot].id === id;
  w[it.slot] = { id: wearing ? null : id, t: Date.now() };
  return wornBy(s, creatureId);
}
