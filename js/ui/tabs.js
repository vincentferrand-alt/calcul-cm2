// Barre d'onglets (v0.13) : en bas de l'écran, à portée de pouce. Cachée pendant une partie et sur l'écran du prénom ;
// l'écran d'ouverture et les fenêtres (évolution, énigme) passent par-dessus (voir css : body:has(...)).
import { h } from "../dom.js";
import { sfx } from "../audio.js";

export const TABS = [
  { id: "", icon: "🏠", label: "Accueil" },
  { id: "exercices", icon: "🎯", label: "Exercices", also: ["apprendre", "fiche"] },
  { id: "album", icon: "🥚", label: "Créatures", also: ["carnet"] },
  { id: "boutique", icon: "🛍️", label: "Boutique" },
  { id: "trophees", icon: "🏆", label: "Trophées" },
];
export const NO_TABS = ["jouer", "profil", "course"]; // v0.15 : pas d'onglets pendant la course
export const showsTabs = (screen) => !NO_TABS.includes(screen);
// L'onglet allumé pour un écran (les sous-écrans allument leur onglet parent ; les réglages n'en allument aucun).
export const tabFor = (screen) => { const t = TABS.find((x) => x.id === screen || (x.also || []).includes(screen)); return t ? t.id : null; };

// badges : { idOnglet: nombre } — v0.14.1 : « 🎯 4 » sur Exercices quand il y a des calculs à revoir (rien si 0).
export function tabBar(screen, go, badges = {}) {
  const on = tabFor(screen);
  return h("nav", { class: "tabbar", "aria-label": "Navigation" }, TABS.map((t) =>
    h("button", { class: "tab-b" + (t.id === on ? " on" : ""), type: "button", "aria-current": t.id === on ? "page" : null,
      "aria-label": badges[t.id] > 0 ? `${t.label} : ${badges[t.id]} calcul${badges[t.id] > 1 ? "s" : ""} à revoir` : null,
      onclick: () => { sfx.tap(); if (t.id === screen) go(t.id, true); else go(t.id); } },
      h("span", { class: "tab-i", "aria-hidden": "true" }, t.icon, badges[t.id] > 0 ? h("span", { class: "tab-badge" }, String(Math.min(99, badges[t.id]))) : null),
      h("span", { class: "tab-l" }, t.label))));
}
