// Écran d'ouverture : la créature compagnon, dans son décor, accueille l'élève. Un appui, ou ~4 s, et on entre.
// Le soir (dès 18 h), une fois par jour : la créature pose son « énigme du soir » (une étoile en cadeau) ; « Plus tard » pour entrer.
import { h } from "../dom.js";
import { store } from "../store.js";
import { toKey } from "../dates.js";
import { CREATURES, featured, creatureById } from "../creatures.js";
import { scenePick } from "../shop.js";
import { sceneEl } from "./scene.js";
import { computeStreak } from "../streak.js";
import { sfx } from "../audio.js";
import { eveningOpen, eveningDone, EVENING_HOUR } from "../evening.js";
import { riddlePanel } from "./evening.js";

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
  const s = store.state, date = toKey(), hour = new Date().getHours();
  const streak = computeStreak(s, date).current, done = !!(s.daily[date] && s.daily[date].done);
  const compId = store.settings.companion && s.cre[store.settings.companion] && s.cre[store.settings.companion].s > 0 ? store.settings.companion : null;
  const feat = compId ? { c: { id: compId }, st: s.cre[compId].s, xp: (s.fam[creatureById(compId).fam] || { xp: 0 }).xp } : featured(s);
  const cid = feat ? feat.c.id : CREATURES[0].id, riddle = eveningOpen(s, date, hour);
  const sleepy = hour >= EVENING_HOUR && eveningDone(s, date);
  const art = h("div", { class: "splash-art scene-wrap" });
  let scene;
  if (feat) { const p = scenePick(s, feat.c.id); scene = sceneEl({ id: feat.c.id, stage: p.st, xp: feat.xp, pick: p, variant: "splash", sleepy }); }
  else scene = sceneEl({ id: CREATURES[0].id, stage: 0, variant: "splash" });
  art.append(scene);
  const g = greeting(hour, store.profile && store.profile.name, streak, done);
  let over = false, timer;
  const leave = () => {
    if (over) return; over = true; clearTimeout(timer); sfx.tap();
    box.classList.add("out"); setTimeout(() => { box.remove(); if (onEnter) onEnter(); }, 420);
  };
  const name = feat ? creatureById(cid).name : "Ton œuf";
  const zone = h("div", { class: "splash-zone" });
  if (riddle) {
    zone.append(h("p", { class: "splash-line" }, `🌙 ${name} a une petite énigme pour toi avant de dormir. Une étoile en cadeau !`),
      h("div", { class: "splash-actions" },
        h("button", { class: "btn green", type: "button", onclick: (e) => { e.stopPropagation(); openIt(); } }, "🌙 Voir l'énigme"),
        h("button", { class: "btn light", type: "button", onclick: (e) => { e.stopPropagation(); leave(); } }, "Plus tard")));
  } else zone.append(h("p", { class: "splash-line" }, g.line));
  function openIt() {
    sfx.tap();
    zone.replaceChildren(riddlePanel(cid, (ok, end) => {
      scene.classList.add("sleepy");
      end.append(h("button", { class: "btn green", type: "button", onclick: (e) => { e.stopPropagation(); leave(); } }, "Entrer"));
    }));
  }
  const box = h("div", { class: "splash" + (riddle ? " has-riddle" : ""), role: "dialog", "aria-label": "Bienvenue", onclick: riddle ? null : leave },
    h("div", { class: "splash-stars", "aria-hidden": "true" }, Array.from({ length: 14 }, (_, i) => h("i", { style: { left: ((i * 37) % 100) + "%", top: ((i * 53) % 70) + "%", animationDelay: (i % 5) * 0.4 + "s" } }))),
    h("div", { class: "splash-title" }, "Calcul CM2"),
    art, h("h1", { class: "splash-hello" }, g.who), zone,
    riddle ? null : h("div", { class: "splash-tap" }, "Touche l'écran pour commencer"));
  document.body.append(box);
  if (!riddle) timer = setTimeout(leave, 4500); // avec l'énigme, on attend son choix
  return true;
}
