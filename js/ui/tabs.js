// Barre d'onglets (v0.13 ; v0.17 : Accueil · Jouer · Apprendre · Collection · Boutique — les trophées sont rangés dans « Collection ») : en bas de l'écran, à portée de pouce. Cachée pendant une partie et sur l'écran du prénom ;
// l'écran d'ouverture et les fenêtres (évolution, énigme) passent par-dessus (voir css : body:has(...)).
import { h } from "../dom.js";
import { sfx } from "../audio.js";

export const TABS = [
  { id: "", icon: "🏠", label: "Accueil" },
  { id: "exercices", icon: "🎮", label: "Jouer" },
  { id: "apprendre", icon: "💡", label: "Apprendre", also: ["fiche"] },
  { id: "album", icon: "🥚", label: "Collection", also: ["carnet", "trophees"] },
  { id: "boutique", icon: "🛍️", label: "Boutique" },
];
export const NO_TABS = ["jouer", "profil", "course"]; // v0.15 : pas d'onglets pendant la course
export const showsTabs = (screen) => !NO_TABS.includes(screen);
// L'onglet allumé pour un écran (les sous-écrans allument leur onglet parent ; les réglages n'en allument aucun).
export const tabFor = (screen) => { const t = TABS.find((x) => x.id === screen || (x.also || []).includes(screen)); return t ? t.id : null; };

// badges : { idOnglet: nombre } — v0.14.1 : « 4 » sur l'onglet Jouer quand il y a des calculs à revoir (rien si 0).
export function tabBar(screen, go, badges = {}) {
  const on = tabFor(screen);
  return h("nav", { class: "tabbar", "aria-label": "Navigation" }, TABS.map((t) =>
    h("button", { class: "tab-b" + (t.id === on ? " on" : ""), type: "button", "aria-current": t.id === on ? "page" : null,
      "aria-label": badges[t.id] > 0 ? `${t.label} : ${badges[t.id]} calcul${badges[t.id] > 1 ? "s" : ""} à revoir` : null,
      onclick: () => { sfx.tap(); if (t.id === screen) go(t.id, true); else go(t.id); } },
      h("span", { class: "tab-i", "aria-hidden": "true" }, t.icon, badges[t.id] > 0 ? h("span", { class: "tab-badge" }, String(Math.min(99, badges[t.id]))) : null),
      h("span", { class: "tab-l" }, t.label))));
}

// v0.17 : les trois pages de l'onglet « Collection » (créatures, carnet de rêves, trophées), en sous-onglets.
export const COLLECTION = [["album", "🥚 Créatures"], ["carnet", "🌙 Carnet"], ["trophees", "🏆 Trophées"]];
export function collectionTabs(current, go) {
  return h("div", { class: "seg sub-tabs", role: "tablist", "aria-label": "Ma collection" }, COLLECTION.map(([id, label]) =>
    h("button", { class: "seg-b" + (id === current ? " on" : ""), type: "button", role: "tab", "aria-selected": id === current ? "true" : "false",
      onclick: () => { if (id !== current) { sfx.tap(); go(id); } } }, label)));
}
