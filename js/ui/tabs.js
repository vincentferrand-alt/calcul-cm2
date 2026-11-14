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
export const NO_TABS = ["jouer", "profil"];
export const showsTabs = (screen) => !NO_TABS.includes(screen);
// L'onglet allumé pour un écran (les sous-écrans allument leur onglet parent ; les réglages n'en allument aucun).
export const tabFor = (screen) => { const t = TABS.find((x) => x.id === screen || (x.also || []).includes(screen)); return t ? t.id : null; };

export function tabBar(screen, go) {
  const on = tabFor(screen);
  return h("nav", { class: "tabbar", "aria-label": "Navigation" }, TABS.map((t) =>
    h("button", { class: "tab-b" + (t.id === on ? " on" : ""), type: "button", "aria-current": t.id === on ? "page" : null,
      onclick: () => { sfx.tap(); if (t.id === screen) go(t.id, true); else go(t.id); } },
      h("span", { class: "tab-i", "aria-hidden": "true" }, t.icon), h("span", { class: "tab-l" }, t.label))));
}
