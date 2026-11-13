// Écran d'ouverture : la créature compagnon, dans son décor, accueille l'élève. Un appui, ou ~4 s, et on entre.
import { h } from "../dom.js";
import { store } from "../store.js";
import { toKey } from "../dates.js";
import { CREATURES, featured, creatureById } from "../creatures.js";
import { scenePick } from "../shop.js";
import { sceneEl } from "./scene.js";
import { computeStreak } from "../streak.js";
import { sfx } from "../audio.js";

export function greeting(hour, name, streak, done) {
  const base = hour < 5 ? "Déjà debout" : hour < 12 ? "Bonjour" : hour < 18 ? "Coucou" : "Bonsoir";
  const who = name ? `${base} ${name} !` : `${base} !`;
  const line = done ? "Le défi du jour est déjà réussi, bravo !" : streak >= 2 ? `${streak} jours de suite : quelle belle série !` : "Un petit défi de calcul, ça te dit ?";
  return { who, line };
}

let shownOnce = false;
export const splashDone = () => shownOnce;

export function showSplash(onEnter) {
  if (shownOnce) return false;
  shownOnce = true;
  const s = store.state, date = toKey();
  const streak = computeStreak(s, date).current, done = !!(s.daily[date] && s.daily[date].done);
  const compId = store.settings.companion && s.cre[store.settings.companion] && s.cre[store.settings.companion].s > 0 ? store.settings.companion : null;
  const feat = compId ? { c: { id: compId }, st: s.cre[compId].s, xp: (s.fam[creatureById(compId).fam] || { xp: 0 }).xp } : featured(s);
  const art = h("div", { class: "splash-art scene-wrap" });
  if (feat) { const p = scenePick(s, feat.c.id); art.append(sceneEl({ id: feat.c.id, stage: p.st, xp: feat.xp, pick: p, variant: "splash" })); }
  else art.append(sceneEl({ id: CREATURES[0].id, stage: 0, variant: "splash" }));
  const g = greeting(new Date().getHours(), store.profile && store.profile.name, streak, done);
  let over = false, timer;
  const leave = () => {
    if (over) return; over = true; clearTimeout(timer); sfx.tap();
    box.classList.add("out"); setTimeout(() => { box.remove(); if (onEnter) onEnter(); }, 420);
  };
  const box = h("div", { class: "splash", role: "dialog", "aria-label": "Bienvenue", onclick: leave },
    h("div", { class: "splash-stars", "aria-hidden": "true" }, Array.from({ length: 14 }, (_, i) => h("i", { style: { left: ((i * 37) % 100) + "%", top: ((i * 53) % 70) + "%", animationDelay: (i % 5) * 0.4 + "s" } }))),
    h("div", { class: "splash-title" }, "Calcul CM2"),
    art, h("h1", { class: "splash-hello" }, g.who), h("p", { class: "splash-line" }, g.line),
    h("div", { class: "splash-tap" }, "Touche l'écran pour commencer"));
  document.body.append(box);
  timer = setTimeout(leave, 4500);
  return true;
}
