// Boutique de DÉCORS (v0.11) : les étoiles gagnées en jouant s'échangent contre des fonds, de la météo, des effets et des petits animaux.
// Données (dans la sauvegarde, donc synchronisées) :
//   decor.owned = { idDécor: date d'achat }   (union à la fusion : un achat n'est jamais perdu)
//   decor.pick  = { idCréature: { bg|wx|fx|pet: { id, t }, st: { id: stade, t } } }   (le choix le plus récent gagne à la fusion)
// Solde = étoiles gagnées − prix des objets ENCORE EN VENTE possédés. Les anciens accessoires (v0.10) ne sont plus en vente :
// leur prix n'est donc plus décompté (remboursement automatique), mais leurs achats restent dans la sauvegarde (shop.owned).
import { itemById } from "./accessories.js";
import { DECOR, decorById, DEFAULT_BG } from "./decor.js";

// ---- anciens accessoires : lecture seule (les ids restent valides, rien n'est effacé) ----
export const owned = (s, id) => !!(s.shop && s.shop.owned && s.shop.owned[id]);
export const ownedCount = (s) => (s.shop && s.shop.owned ? Object.keys(s.shop.owned).filter((id) => itemById(id)).length : 0);
export function wornBy(s, creatureId) {
  const w = (s.shop && s.shop.worn && s.shop.worn[creatureId]) || {};
  return Object.fromEntries(Object.entries(w).filter(([, v]) => v && v.id && owned(s, v.id)).map(([slot, v]) => [slot, v.id]));
}

// ---- décors ----
const deco = (s) => (s.decor ||= { owned: {}, pick: {} });
export const hasDecor = (s, id) => { const d = decorById(id); return !!d && (d.price === 0 || !!(s.decor && s.decor.owned && s.decor.owned[id])); };
export const decorCount = (s) => DECOR.filter((d) => d.price > 0 && hasDecor(s, d.id)).length;
export const spent = (s) => DECOR.reduce((t, d) => t + (d.price > 0 && hasDecor(s, d.id) ? d.price : 0), 0);
// Étoiles gagnées : celles des séries (compteur) + une par énigme du soir (comptées à part : elles s'additionnent entre appareils).
export const starsEarned = (s) => (s.c.stars || 0) + Object.keys(s.eve || {}).length;
export const balance = (s) => Math.max(0, starsEarned(s) - spent(s));

export function buyDecor(s, id, date) {
  const d = decorById(id);
  if (!d) return { ok: false, why: "inconnu" };
  if (hasDecor(s, id)) return { ok: false, why: "déjà" };
  if (balance(s) < d.price) return { ok: false, why: "étoiles", missing: d.price - balance(s) };
  deco(s).owned[id] = date;
  return { ok: true };
}

const maxStage = (s, cid) => (s.cre[cid] ? s.cre[cid].s : 0);
// Choisir un décor (kind = bg/wx/fx/pet ; id null = rien) ou la forme affichée (kind = "st", id = stade).
export function setPick(s, cid, kind, id, now = Date.now()) {
  if (kind === "st") { if (!(Number.isInteger(id) && id >= 1 && id <= maxStage(s, cid))) return false; }
  else if (id !== null) { const d = decorById(id); if (!d || d.kind !== kind || !hasDecor(s, id)) return false; }
  else if (kind === "bg") return false; // il y a toujours un fond
  const p = (deco(s).pick[cid] ||= {});
  p[kind] = { id, t: now };
  return true;
}

// Ce qu'affiche la scène d'une créature : { st, bg, wx, fx, pet } validés (stade débloqué, décor possédé).
export function scenePick(s, cid) {
  const p = (s.decor && s.decor.pick && s.decor.pick[cid]) || {};
  const ok = (kind) => { const v = p[kind] && p[kind].id; return v && decorById(v) && decorById(v).kind === kind && hasDecor(s, v) ? v : null; };
  const max = maxStage(s, cid), st = p.st && Number.isInteger(p.st.id) && p.st.id >= 1 && p.st.id <= max ? p.st.id : max;
  return { st, bg: ok("bg") || DEFAULT_BG, wx: ok("wx"), fx: ok("fx"), pet: ok("pet") };
}
