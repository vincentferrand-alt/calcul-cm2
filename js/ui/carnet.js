// Carnet de rêves (v0.14) : une carte souvenir par énigme du soir, à feuilleter (glisser, flèches, ou ← → sur l'iMac).
// v0.15 : aussi les photos-souvenirs des courses, mélangées par ordre chronologique inverse, avec un filtre « Tout / Soirs / Courses ».
import { h } from "../dom.js";
import { store } from "../store.js";
import { sfx } from "../audio.js";
import { creatureById } from "../creatures.js";
import { jourLong, dateLongue } from "../dates.js";
import { famById } from "../generator.js";
import { memoryCards } from "../dreams.js";
import { homeCreature } from "../goal.js";
import { sceneEl } from "./scene.js";
import { topbar } from "./common.js";
import { collectionTabs } from "./tabs.js";
import { famPill } from "./badges.js";
import { carnetFrame } from "../shop.js";

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
// La photo d'une course : la créature en plein saut dans son décor, à l'heure de la course, avec le score.
export function runPhotoEl(d, variant = "dream") {
  const hour = Number.isFinite(d.hour) ? d.hour : Number(String(d.key || "").slice(11, 13)) || 12;
  const sc = sceneEl({ id: d.c, stage: d.st, pick: { bg: d.bg }, variant: "dream", lite: true, hour });
  sc.classList.add("run-photo", "rp-" + variant);
  sc.append(h("div", { class: "rp-lines", "aria-hidden": "true" }, h("i"), h("i"), h("i")), h("div", { class: "rp-score" }, `🏃 ${d.ok} / ${d.n}`));
  return sc;
}
const FILTERS = [["all", "Tout"], ["eve", "🌙 Soirs"], ["run", "🏃 Courses"]];

export function carnetScreen({ go, args = [] }) {
  const s = store.state;
  const fallback = homeCreature(s, store.settings.companion).id;
  let filter = args[0] === "courses" ? "run" : args[0] === "soirs" ? "eve" : "all";
  const body = h("div", { class: "screen-body carnet" });
  const root = h("main", { class: "screen" }, topbar("Ma collection", null), body); // v0.17 : le carnet est un sous-onglet de « Collection »
  let onKey = null;
  function draw() {
    if (onKey) document.removeEventListener("keydown", onKey);
    onKey = null;
    const all = memoryCards(s, fallback, "all"), cards = memoryCards(s, fallback, filter);
    const fr = carnetFrame(s), fcls = fr ? " frame-" + fr.replace("frame_", "") : ""; // v0.16 : le cadre choisi dans la boutique
    const seg = all.some((d) => d.type === "run") ? h("div", { class: "seg dream-filter" }, FILTERS.map(([id, label]) =>
      h("button", { class: "seg-b" + (id === filter ? " on" : ""), type: "button", "aria-pressed": id === filter ? "true" : "false", onclick: () => { filter = id; sfx.tap(); draw(); } }, label))) : null;
    if (!cards.length) {
      body.replaceChildren(...[collectionTabs("carnet", go), seg, h("div", { class: "card center" }, h("div", { class: "dream-empty", "aria-hidden": "true" }, filter === "run" ? "🏃" : "🌙"),
        h("h2", {}, "Ton carnet t'attend"),
        h("p", {}, filter === "run" ? "Chaque course des réponses terminée ajoute ici une photo-souvenir : ta créature en plein saut dans son décor."
          : "Chaque soir, à partir de 18 h, ta créature te pose une petite énigme avant de dormir. Chaque énigme faite ajoute ici une carte souvenir : ta créature endormie dans son décor, la date et le calcul. Les courses des réponses y ajoutent aussi leurs photos !"))].filter(Boolean));
      return;
    }
    const strip = h("div", { class: "dreams", tabindex: "0", "aria-label": "Cartes souvenirs" }, cards.map((d) => {
      const c = creatureById(d.c), day = `${cap(jourLong(d.date))} ${dateLongue(d.date)}`;
      if (d.type === "run") {
        const f = d.fam !== "mix" && famById(d.fam);
        return h("article", { class: "dream run" + fcls }, runPhotoEl(d),
          h("div", { class: "dream-date" }, `${day} · ${d.key.slice(11, 16).replace(":", " h ")}`),
          h("div", { class: "dream-calc" }, `🏃 ${d.ok} / ${d.n}`),
          h("div", { class: "dream-who" }, f ? famPill(d.fam, "tiny") : null, ` Course des réponses · ${f ? f.name : "Mélange"}`));
      }
      const scene = sceneEl({ id: d.c, stage: d.st, pick: { bg: d.bg }, variant: "dream", lite: true, hour: 22, sleepy: true });
      return h("article", { class: "dream" + fcls }, scene,
        h("div", { class: "dream-date" }, day),
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
    const nE = cards.filter((d) => d.type === "eve").length, nR = cards.length - nE;
    const lead = [nE ? `${nE} soir${nE > 1 ? "s" : ""} de rêves` : null, nR ? `${nR} course${nR > 1 ? "s" : ""}` : null].filter(Boolean).join(" et ");
    body.replaceChildren(...[collectionTabs("carnet", go), seg, h("p", { class: "lead center" }, `${cap(lead)}, du plus récent au plus ancien`), strip, nav,
      h("div", { class: "kbd-hint" }, "Clavier : ← → pour feuilleter")].filter(Boolean));
    onKey = (e) => { if (e.key === "ArrowLeft") { e.preventDefault(); to(at() - 1); } else if (e.key === "ArrowRight") { e.preventDefault(); to(at() + 1); } };
    document.addEventListener("keydown", onKey);
  }
  draw();
  return { el: root, destroy: () => { if (onKey) document.removeEventListener("keydown", onKey); } };
}
