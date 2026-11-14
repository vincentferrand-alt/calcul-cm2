// Carnet de rêves (v0.14) : une carte souvenir par énigme du soir, à feuilleter (glisser, flèches, ou ← → sur l'iMac).
import { h } from "../dom.js";
import { store } from "../store.js";
import { sfx } from "../audio.js";
import { creatureById } from "../creatures.js";
import { jourLong, dateLongue } from "../dates.js";
import { dreamCards } from "../dreams.js";
import { homeCreature } from "../goal.js";
import { sceneEl } from "./scene.js";
import { topbar } from "./common.js";

export function carnetScreen({ go }) {
  const s = store.state;
  const fallback = homeCreature(s, store.settings.companion).id;
  const cards = dreamCards(s, fallback);
  const body = h("div", { class: "screen-body carnet" });
  const root = h("main", { class: "screen" }, topbar("Carnet de rêves", () => go("album")), body);
  if (!cards.length) {
    body.append(h("div", { class: "card center" }, h("div", { class: "dream-empty", "aria-hidden": "true" }, "🌙"),
      h("h2", {}, "Ton carnet t'attend"),
      h("p", {}, "Chaque soir, à partir de 18 h, ta créature te pose une petite énigme avant de dormir. Chaque énigme faite ajoute ici une carte souvenir : ta créature endormie dans son décor, la date et le calcul.")));
    return { el: root };
  }
  const strip = h("div", { class: "dreams", tabindex: "0", "aria-label": "Cartes souvenirs" }, cards.map((d) => {
    const c = creatureById(d.c);
    const scene = sceneEl({ id: d.c, stage: d.st, pick: { bg: d.bg }, variant: "dream", lite: true, hour: 22, sleepy: true });
    const day = jourLong(d.date);
    return h("article", { class: "dream" },
      scene,
      h("div", { class: "dream-date" }, `${day.charAt(0).toUpperCase() + day.slice(1)} ${dateLongue(d.date)}`),
      h("div", { class: "dream-calc" }, d.calc),
      h("div", { class: "dream-who" }, d.st > 0 ? `💤 ${c.name} s'est endormi${c.id === "trick" ? "e" : ""} après l'énigme` : "💤 Ton œuf s'est endormi au chaud"));
  }));
  const count = h("span", { class: "dream-count" }, `1 / ${cards.length}`);
  const at = () => Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth));
  const to = (i) => { sfx.tap(); strip.scrollTo({ left: Math.max(0, Math.min(cards.length - 1, i)) * strip.clientWidth, behavior: "smooth" }); };
  strip.addEventListener("scroll", () => { count.textContent = `${Math.min(cards.length, at() + 1)} / ${cards.length}`; }, { passive: true });
  const nav = h("div", { class: "dream-nav" },
    h("button", { class: "icon-round", type: "button", "aria-label": "Carte précédente", onclick: () => to(at() - 1) }, "‹"), count,
    h("button", { class: "icon-round", type: "button", "aria-label": "Carte suivante", onclick: () => to(at() + 1) }, "›"));
  body.append(h("p", { class: "lead center" }, `${cards.length} soir${cards.length > 1 ? "s" : ""} de rêves, du plus récent au plus ancien`), strip, nav,
    h("div", { class: "kbd-hint" }, "Clavier : ← → pour feuilleter"));
  const onKey = (e) => { if (e.key === "ArrowLeft") { e.preventDefault(); to(at() - 1); } else if (e.key === "ArrowRight") { e.preventDefault(); to(at() + 1); } };
  document.addEventListener("keydown", onKey);
  return { el: root, destroy: () => document.removeEventListener("keydown", onKey) };
}
