// « La course des réponses » 🏃 (v0.15) : logique pure, testée (tests/course.test.mjs).
// La créature court vers le haut de l'écran ; des rangées de 3 portes arrivent sur 3 couloirs, une seule porte porte la bonne réponse.
// Rythme DOUX : lent au départ, un cran plus rapide après chaque série de 3 bonnes réponses, un cran plus lent après une erreur,
// avec un plafond bas (la justesse avant la vitesse). Animations réduites : vitesse 0, les portes attendent son choix.
// Chaque passage de porte compte comme une réponse normale (créatures, missions, trophées, niveau, calculs à revoir).
import { choices, shuffle } from "./generator.js";
import { buildSession, starsFor } from "./progress.js";
import { afterAnswer, afterSession } from "./game.js";

export const LANES = 3;
export const GATES = 10; // une course = 10 portes (~2 min)
export const MODE = "course";
// Temps (en secondes) pour qu'une rangée de portes descende du haut de l'écran jusqu'à la créature, du plus lent au plus rapide.
export const TRAVEL = [8, 7.2, 6.5, 6];
export const MAX_LEVEL = TRAVEL.length - 1;
export const PACE_STEP = 3; // 3 bonnes réponses d'affilée = un cran plus vite

// Les calculs d'une course : un cran plus faciles que le niveau de chaque famille (comme le début du défi du jour).
export function courseProblems(s, families, rng = Math.random, date) {
  return buildSession(s, { families: families && families !== "mix" ? families : "mix", count: GATES, easier: true }, rng, date).slice(0, GATES);
}

// Une rangée de portes : la bonne réponse + 2 erreurs typiques (celles du QCM), toutes différentes et positives, dans 3 couloirs.
export function gateRow(prob, rng = Math.random) {
  const wrong = choices(prob, rng).filter((v) => v !== prob.a).slice(0, LANES - 1);
  const values = shuffle([prob.a, ...wrong], rng);
  return { values, good: values.indexOf(prob.a), a: prob.a };
}

// Passage d'une porte : la créature est dans le couloir lane quand la rangée arrive sur elle.
export function passGate(row, lane) {
  const l = Math.max(0, Math.min(LANES - 1, Number.isInteger(lane) ? lane : 1));
  return { ok: l === row.good, lane: l, value: row.values[l], good: row.good, answer: row.a };
}

// Rythme : { level, streak } → nouvel état après une porte.
export const startPace = () => ({ level: 0, streak: 0 });
export function paceAfter(p, ok) {
  if (!ok) return { level: Math.max(0, p.level - 1), streak: 0 };
  const streak = p.streak + 1;
  return { level: streak % PACE_STEP === 0 ? Math.min(MAX_LEVEL, p.level + 1) : p.level, streak };
}
// Vitesse de défilement en « longueurs de piste par seconde » (0 = les portes attendent, animations réduites).
export const speedOf = (p, calm = false) => (calm ? 0 : 1 / TRAVEL[Math.max(0, Math.min(MAX_LEVEL, p.level))]);

// Changer de couloir : -1 (gauche) / +1 (droite), sans sortir de la piste.
export const moveLane = (lane, dir) => Math.max(0, Math.min(LANES - 1, lane + dir));
// Toucher la piste : le couloir sous le doigt (x de 0 à width).
export const laneAt = (x, width) => Math.max(0, Math.min(LANES - 1, Math.floor((x / Math.max(1, width)) * LANES)));

// Une réponse de la course : exactement comme ailleurs (mode = "course", niveau adaptatif normal).
export const courseAnswer = (s, { prob, ok, run, date }) => afterAnswer(s, { prob, ok, review: !!prob.review, run, date, mode: MODE, adapt: true, hinted: false });
// Fin de course : étoiles de fin de série (1 à 3, toujours au moins une), missions, trophées.
export const courseEnd = (s, { ok, total, date }) => afterSession(s, { ok, total, mode: MODE, daily: false, date });
export const courseStars = starsFor;

// ---------- photo-souvenir (sauvegarde : run = { "<date>T<hh:mm>": { c, st, bg, ok, n, fam } }, union à la fusion) ----------
const pad = (n) => String(n).padStart(2, "0");
export const RUN_KEY = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
export function runKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
// Ajoute la photo d'une course (au plus une par course). Deux courses dans la même minute : on ajoute les secondes.
export function addRunPhoto(s, { c, st, bg, ok, n, fam }, when = new Date()) {
  s.run ||= {};
  let key = runKey(when);
  if (s.run[key]) key += ":" + pad(when.getSeconds());
  for (let i = 0; s.run[key] && i < 60; i++) key = key.slice(0, 16) + ":" + pad((when.getSeconds() + i + 1) % 60);
  s.run[key] = { c, st, bg, ok, n, fam: fam || "mix" };
  return key;
}
export const runCount = (s) => Object.keys(s.run || {}).filter((k) => RUN_KEY.test(k)).length;
