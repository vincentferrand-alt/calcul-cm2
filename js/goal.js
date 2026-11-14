// Objectifs de croissance des créatures (v0.13) : logique pure, testée (tests/goal.test.mjs).
//  - homeCreature : la créature affichée sur l'accueil / l'ouverture (compagnon, sinon la plus avancée, sinon l'œuf le plus avancé) ;
//  - homeGoal : la phrase et la barre sous la scène (« Prochaine évolution de Braise : encore 18 additions ») ;
//  - nearEvolution : en fin de série, la créature à ≤ 10 bonnes réponses de son évolution (« Encore 5 additions et Braise évolue ! »).
import { CREATURES, STAGE_XP, creatureById, featured, stageForXp } from "./creatures.js";
import { famById } from "./generator.js";
import { de } from "./fr.js";

// Ce qu'il faut réussir pour faire grandir chaque créature (1 = singulier, sinon pluriel).
export const UNITS = {
  add: ["addition", "additions"], sub: ["soustraction", "soustractions"], mul: ["multiplication", "multiplications"],
  dbl: ["calcul de doubles", "calculs de doubles"], frac: ["calcul de moitiés", "calculs de moitiés"],
  comp: ["complément", "compléments"], div: ["division", "divisions"], trick: ["astuce", "astuces"],
};
export const unit = (fam, n) => `${n} ${(UNITS[fam] || ["calcul", "calculs"])[n > 1 ? 1 : 0]}`;

const xpOf = (s, fam) => (s.fam && s.fam[fam] ? Number(s.fam[fam].xp) || 0 : 0);
const stageOf = (s, id) => (s.cre && s.cre[id] ? Number(s.cre[id].s) || 0 : 0);

// Où en est une créature : stade atteint, bonnes réponses qui manquent pour le suivant, pourcentage de la barre.
export function growthOf(s, id) {
  const c = creatureById(id) || CREATURES[0], xp = xpOf(s, c.fam);
  const stage = Math.min(4, Math.max(stageOf(s, c.id), stageForXp(xp)));
  if (stage >= 4) return { id: c.id, fam: c.fam, stage: 4, remaining: 0, pct: 100, max: true };
  const lo = STAGE_XP[stage], hi = STAGE_XP[stage + 1];
  return { id: c.id, fam: c.fam, stage, remaining: Math.max(1, hi - xp), pct: Math.max(0, Math.min(100, Math.round(100 * (xp - lo) / (hi - lo)))), max: false };
}

// La créature la plus proche de grandir (éclosion comprise), en excluant éventuellement certaines ; à égalité, l'ordre du bestiaire.
export function closestToGrow(s, { exclude = [], fams = null } = {}) {
  let best = null;
  for (const c of CREATURES) {
    if (exclude.includes(c.id) || (fams && !fams.includes(c.fam))) continue;
    const g = growthOf(s, c.id);
    if (g.max) continue;
    if (!best || g.remaining < best.remaining) best = g;
  }
  return best;
}

// La créature de l'accueil : { id, stage } (stage 0 = œuf).
export function homeCreature(s, companion) {
  if (companion && stageOf(s, companion) > 0 && creatureById(companion)) return { id: companion, stage: stageOf(s, companion) };
  const f = featured(s);
  if (f) return { id: f.c.id, stage: f.st };
  const egg = CREATURES.reduce((b, c) => (xpOf(s, c.fam) > xpOf(s, b.fam) ? c : b), CREATURES[0]);
  return { id: egg.id, stage: 0 };
}

const famLow = (fam) => famById(fam).name.toLowerCase();

// L'objectif affiché sous la scène de l'accueil. target = créature à faire grandir (null si toutes sont au stade maximum).
export function homeGoal(s, id) {
  const c = creatureById(id) || CREATURES[0], g = growthOf(s, c.id);
  if (!g.max) {
    const text = g.stage === 0 ? `Encore ${unit(c.fam, g.remaining)} pour faire éclore l'œuf`
      : `Prochaine évolution ${de(c.name)} : encore ${unit(c.fam, g.remaining)}`;
    return { ...g, target: c.id, text, label: g.stage === 0 ? `🥚 Faire éclore : ${famLow(c.fam)}` : `🎯 Faire grandir ${c.name}` };
  }
  const o = closestToGrow(s, { exclude: [c.id] });
  if (!o) return { ...g, target: null, text: "Toutes tes créatures sont légendaires, bravo ! 🌟", label: null };
  const oc = creatureById(o.id);
  const text = o.stage === 0 ? `${c.name} est au maximum ! Prochain objectif : un nouvel œuf, encore ${unit(o.fam, o.remaining)}`
    : `${c.name} est au maximum ! Prochain objectif : ${oc.name}, encore ${unit(o.fam, o.remaining)}`;
  return { ...o, target: o.id, text, label: o.stage === 0 ? `🥚 Faire éclore : ${famLow(o.fam)}` : `🎯 Faire grandir ${oc.name}` };
}

// Fin de série : une créature (des familles jouées) à ≤ limit bonnes réponses de son éclosion / évolution.
export const NEAR_LIMIT = 10;
export function nearEvolution(s, fams, limit = NEAR_LIMIT) {
  const list = !fams || fams === "mix" ? null : fams;
  const g = closestToGrow(s, { fams: list });
  if (!g || g.remaining > limit) return null;
  const c = creatureById(g.id);
  const text = g.stage === 0 ? `Encore ${unit(g.fam, g.remaining)} et l'œuf éclot !` : `Encore ${unit(g.fam, g.remaining)} et ${c.name} évolue !`;
  return { ...g, text };
}
