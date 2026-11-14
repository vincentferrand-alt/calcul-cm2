// « Que faire maintenant ? » (v0.13) : logique pure, testée (tests/next.test.mjs).
// Dans l'ordre : le défi du jour s'il n'est pas fait, sinon les calculs à revoir, sinon la créature la plus proche d'évoluer,
// sinon une mission. Le bouton dit ce qu'il va lancer ; launchFor() traduit la proposition en série à jouer (ou en écran).
import { themeFor, DAILY_COUNT } from "./daily.js";
import { dueReviews } from "./progress.js";
import { closestToGrow, unit } from "./goal.js";
import { creatureById } from "./creatures.js";
import { famById } from "./generator.js";
import { missionText } from "./missions.js";

export const REVIEW_MAX = 10; // une série « à revoir » : au plus 10 calculs

export function whatNext(s, date) {
  if (!(s.daily[date] && s.daily[date].done)) {
    const t = themeFor(date);
    return { kind: "daily", icon: "🏁", label: `Défi du jour : ${t.label}`, theme: t.id };
  }
  const due = dueReviews(s, date).length;
  if (due > 0) {
    const n = Math.min(due, REVIEW_MAX);
    return { kind: "review", icon: "🎯", label: `${n} calcul${n > 1 ? "s" : ""} à revoir`, n };
  }
  const g = closestToGrow(s);
  if (g) {
    const c = creatureById(g.id);
    return g.stage === 0
      ? { kind: "grow", icon: "🥚", label: `Faire éclore un œuf : encore ${unit(g.fam, g.remaining)}`, id: g.id, fam: g.fam }
      : { kind: "grow", icon: "🌱", label: `Faire grandir ${c.name} : encore ${unit(g.fam, g.remaining)}`, id: g.id, fam: g.fam };
  }
  const ratio = (m) => (m.target ? Math.min(1, (m.progress || 0) / m.target) : 0);
  const m = [...(s.m.active || [])].filter((x) => !x.done).sort((a, b) => ratio(b) - ratio(a) || (a.id < b.id ? -1 : 1))[0];
  if (m) return { kind: "mission", icon: "🧭", label: missionText(m, date), mission: m };
  return { kind: "mix", icon: "🎲", label: "Un mélange de tout", };
}

// Traduit la proposition en action : { route: "jouer", opts } (série à jouer) ou { route: "apprendre" }.
// settings : { answer, count } (réglages de l'appareil) ; back : l'écran où revenir après la série.
export function launchFor(next, date, settings = {}, back = "") {
  const mode = settings.answer === "input" ? "input" : "qcm", count = settings.count || 10;
  const play = (o) => ({ route: "jouer", opts: { mode, count, back, ...o } });
  if (next.kind === "daily") return play({ families: themeFor(date).families, count: DAILY_COUNT, daily: true });
  if (next.kind === "review") return play({ families: "mix", count: next.n || REVIEW_MAX, reviewOnly: true });
  if (next.kind === "grow") return play({ families: [next.fam] });
  if (next.kind === "mission") {
    const m = next.mission, p = m.params || {};
    if (m.tpl === "fam" && famById(p.fam)) return play({ families: [p.fam] });
    if (m.tpl === "mode") return play({ families: "mix", mode: p.mode === "input" ? "input" : "qcm" });
    if (m.tpl === "dictee") return play({ families: "mix", mode: "dictee" });
    if (m.tpl === "review") return play({ families: "mix", count: REVIEW_MAX, reviewOnly: true });
    if (m.tpl === "daily") return play({ families: themeFor(date).families, count: DAILY_COUNT, daily: true });
    if (m.tpl === "learn") return { route: "apprendre" };
    if (m.tpl === "perfect") return play({ families: "mix", count: Math.max(count, 10) });
  }
  return play({ families: "mix" });
}
