// Trophées à paliers (bronze, argent, or, platine, diamant) : il reste toujours un prochain but.
// IDENTIFIANTS STABLES : "t_xxx:palier" ne sont jamais renommés ni supprimés (tests/trophy-ids.json le vérifie).
// On peut AJOUTER des lignes ou des paliers ; on ne change jamais ce qui existe.
import { FAMILIES } from "./generator.js";

export const TIER_NAMES = ["Bronze", "Argent", "Or", "Platine", "Diamant"];
export const TIER_COLORS = ["#cd7f32", "#c3cad5", "#ffc933", "#8fd6e6", "#6fb7ff"];
const daysPlayed = (s) => Object.values(s.days).filter((d) => d.tot > 0).length;
const cre = (s, min) => Object.values(s.cre).filter((c) => c.s >= min).length;

export const LINES = [
  { id: "t_calc", name: "Calculs réussis", emoji: "✅", tiers: [25, 100, 300, 1000, 3000], value: (s) => s.c.ok, desc: (n) => `Réussir ${n} calculs` },
  { id: "t_streak", name: "Série de jours", emoji: "🔥", tiers: [3, 7, 14, 30, 60], value: (s) => s.c.streakBest, desc: (n) => `Jouer ${n} jours de suite` },
  { id: "t_days", name: "Jours de jeu", emoji: "📆", tiers: [3, 10, 25, 50, 100], value: daysPlayed, desc: (n) => `Jouer ${n} jours différents` },
  { id: "t_perfect", name: "Sans faute", emoji: "💯", tiers: [1, 5, 15, 40], value: (s) => s.c.perfect, desc: (n) => `Faire ${n} série${n > 1 ? "s" : ""} sans faute` },
  { id: "t_daily", name: "Défis du jour", emoji: "📅", tiers: [1, 5, 15, 40], value: (s) => s.c.daily, desc: (n) => `Terminer ${n} défi${n > 1 ? "s" : ""} du jour` },
  { id: "t_learn", name: "Curiosité", emoji: "💡", tiers: [3, 8, 14, 17], value: (s) => s.c.learn, desc: (n) => `Découvrir ${n} astuces` },
  { id: "t_dict", name: "Oreille fine", emoji: "🎧", tiers: [10, 50, 150, 400], value: (s) => s.c.dict, desc: (n) => `Réussir ${n} calculs en dictée` },
  { id: "t_easy", name: "Devenus faciles", emoji: "✨", tiers: [3, 15, 50, 150], value: (s) => s.c.easy, desc: (n) => `Maîtriser ${n} calculs qui étaient difficiles` },
  { id: "t_speed", name: "Éclair", emoji: "⚡", tiers: [1, 5, 15], value: (s) => s.c.speed, desc: (n) => `Battre ${n} fois ton record de temps` },
  { id: "t_missions", name: "Missions", emoji: "🧭", tiers: [3, 15, 50, 150], value: (s) => s.c.missions, desc: (n) => `Accomplir ${n} missions` },
  { id: "t_stars", name: "Étoiles", emoji: "⭐", tiers: [10, 50, 150, 400], value: (s) => s.c.stars, desc: (n) => `Gagner ${n} étoiles` },
  { id: "t_hatch", name: "Éclosions", emoji: "🥚", tiers: [1, 4, 8], value: (s) => cre(s, 1), desc: (n) => `Faire éclore ${n} créature${n > 1 ? "s" : ""}` },
  { id: "t_legend", name: "Légendes", emoji: "👑", tiers: [1, 3, 8], value: (s) => cre(s, 4), desc: (n) => `Amener ${n} créature${n > 1 ? "s" : ""} au dernier stade` },
  ...FAMILIES.map((f) => ({ id: "t_fam_" + f.id, name: f.name, emoji: f.short, tiers: [20, 80, 250, 700], value: (s) => (s.fam[f.id] ? s.fam[f.id].xp : 0), desc: (n) => `Réussir ${n} calculs de ${f.name.toLowerCase()}` })),
];
export const lineById = (id) => LINES.find((l) => l.id === id);
export const allTrophyIds = () => LINES.flatMap((l) => l.tiers.map((_, i) => `${l.id}:${i + 1}`));

// Attribue les trophées mérités ; ne retire jamais rien. Retourne les nouveaux.
export function checkTrophies(s, date) {
  const fresh = [];
  for (const l of LINES) {
    const v = l.value(s);
    l.tiers.forEach((t, i) => {
      const id = `${l.id}:${i + 1}`;
      if (v >= t && !s.tro[id]) { s.tro[id] = date; fresh.push({ id, line: l, tier: i + 1, target: t }); }
    });
  }
  return fresh;
}

// Prochain palier d'une ligne : { tier, target, value } ou null si tout est gagné.
export function nextTier(s, l) {
  const v = l.value(s);
  const i = l.tiers.findIndex((t, k) => !s.tro[`${l.id}:${k + 1}`] && v < t);
  return i < 0 ? null : { tier: i + 1, target: l.tiers[i], value: v };
}
export const earnedTier = (s, l) => l.tiers.reduce((n, _, i) => (s.tro[`${l.id}:${i + 1}`] ? i + 1 : n), 0);
export const trophyLabel = (line, tier) => `${TIER_NAMES[tier - 1]} · ${line.name}`;
