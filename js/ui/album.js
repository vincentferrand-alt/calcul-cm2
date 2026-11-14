// Album des créatures (v0.14) : des cartes courtes en grille (scène, nom, barre, famille) ; un appui ouvre la page de la créature
// (#/album/<id>) avec l'histoire de ses 4 formes, le choix de la forme affichée et les raccourcis. Le carnet de rêves est à côté.
import { h } from "../dom.js";
import { store } from "../store.js";
import { sfx } from "../audio.js";
import { CREATURES, STAGE_XP, creatureById } from "../creatures.js";
import { famById } from "../generator.js";
import { topbar } from "./common.js";
import { scenePick, setPick } from "../shop.js";
import { creatureArt } from "./art.js";
import { sceneEl } from "./scene.js";
import { playEvolution } from "./evolve.js";
import { session } from "./play.js";
import { growthOf, unit } from "../goal.js";
import { famPill } from "./badges.js";

export { creatureArt };

// Carte « nouvelle créature / évolution » affichée à la fin d'une série.
export function creatureCard(e) {
  const c = creatureById(e.id);
  return h("div", { class: "creature-new" }, creatureArt(e.id, e.to, STAGE_XP[e.to], "n" + e.id + e.to),
    h("div", { class: "creature-name" }, c.name), h("div", { class: "creature-stage" }, c.forms[e.to - 1]),
    h("p", { class: "creature-story" }, c.story[e.to - 1]));
}

const stageOf = (s, id) => Math.max(0, s.cre[id] ? s.cre[id].s : 0);
const xpOf = (s, c) => (s.fam[c.fam] ? s.fam[c.fam].xp : 0);

export function albumScreen({ go, args = [] }) {
  const id = args[0] && creatureById(args[0]) ? args[0] : null;
  const root = h("main", { class: "screen" });
  const draw = () => root.replaceChildren(...(id ? detail(go, id, draw) : grid(go)));
  draw();
  return { el: root };
}

// Ce qui reste à faire, en clair (famille de calcul comprise : n'importe quel mode compte).
function growLine(s, c) {
  const g = growthOf(s, c.id);
  if (g.max) return "Stade maximum atteint, bravo ! 🌟";
  return g.stage === 0 ? `Encore ${unit(c.fam, g.remaining)} pour faire éclore l'œuf` : `Encore ${unit(c.fam, g.remaining)} pour devenir : ${c.forms[g.stage].toLowerCase()}`;
}

function grid(go) {
  const s = store.state;
  const nb = CREATURES.filter((c) => stageOf(s, c.id) > 0).length, nights = Object.keys(s.eve || {}).length, runs = Object.keys(s.run || {}).length;
  const cards = CREATURES.map((c) => {
    const f = famById(c.fam), st = stageOf(s, c.id), g = growthOf(s, c.id), pick = st ? scenePick(s, c.id) : null;
    const art = st ? sceneEl({ id: c.id, stage: pick.st, xp: xpOf(s, c), pick, variant: "album", lite: true }) : h("div", { class: "pet-egg" }, creatureArt(c.id, 0, xpOf(s, c), "al" + c.id));
    return h("button", { class: "pet pet-card", type: "button", style: { "--fam": f.color, "--fam-ink": f.ink }, "aria-label": `${st ? c.name : "Œuf mystère"} : ${growLine(s, c)}`,
      onclick: () => { sfx.tap(); go("album/" + c.id); } },
      art,
      h("span", { class: "pet-name" }, st ? c.name : "Mystère…"),
      h("span", { class: "bar small" }, h("span", { class: "bar-fill", style: { width: g.pct + "%" } })),
      h("span", { class: "pet-fam" }, famPill(c.fam, "tiny"), st ? c.forms[pick.st - 1] : f.name));
  });
  return [topbar("Mes créatures", null),
    h("div", { class: "screen-body" },
      h("div", { class: "album-head" },
        h("div", { class: "card center album-count" }, h("div", { class: "big-num" }, `🥚 ${nb} / ${CREATURES.length}`), h("p", {}, "Touche une créature pour voir son histoire.")),
        h("button", { class: "card dream-link", type: "button", onclick: () => { sfx.tap(); go("carnet"); } },
          h("span", { class: "dream-moon", "aria-hidden": "true" }, "🌙"), h("span", { class: "grow" }, h("b", {}, "Carnet de rêves"), h("small", {}, nights + runs ? [nights ? `${nights} soir${nights > 1 ? "s" : ""}` : null, runs ? `${runs} course${runs > 1 ? "s" : ""}` : null].filter(Boolean).join(" · ") : "Les souvenirs des énigmes du soir et des courses")), h("span", { class: "nb-go" }, "›"))),
      h("div", { class: "pets" }, cards))];
}

function detail(go, id, redraw) {
  const s = store.state, c = creatureById(id), f = famById(c.fam), st = stageOf(s, id), g = growthOf(s, id), xp = xpOf(s, c);
  const pick = st ? scenePick(s, id) : null;
  const scene = st ? sceneEl({ id, stage: pick.st, xp, pick, variant: "shop" }) : sceneEl({ id, stage: 0, xp, variant: "shop" });
  const grow = g.max ? null : h("button", { class: "btn big green", type: "button", onclick: () => {
    session.opts = { families: [c.fam], count: store.settings.count || 10, mode: store.settings.answer === "qcm" ? "qcm" : "input", back: "album/" + id };
    go("jouer", true);
  } }, st ? `🎯 Faire grandir ${c.name} : ${f.name.toLowerCase()}` : `🥚 Faire éclore : ${f.name.toLowerCase()}`);
  const comp = store.settings.companion === id;
  const actions = st ? h("div", { class: "pet-actions" },
    h("button", { class: "btn light", type: "button", onclick: () => playEvolution(id, pick.st - 1, pick.st) }, "▶ Revoir l'évolution"),
    h("button", { class: "btn" + (comp ? "" : " light"), type: "button", onclick: () => { sfx.tap(); store.set("companion", comp ? null : id); redraw(); } }, comp ? "⭐ Mon compagnon" : "☆ Choisir comme compagnon"),
    h("button", { class: "btn light", type: "button", onclick: () => go("boutique/" + id) }, "🛍️ Ses décors")) : null;
  // L'histoire des 4 formes : celles pas encore atteintes restent en silhouette ; un appui sur une forme atteinte l'affiche partout.
  const forms = [1, 2, 3, 4].map((n) => {
    const got = n <= st, sel = pick && pick.st === n, next = n === st + 1;
    const art = creatureArt(id, n, 0, `hf${id}${n}`); if (!got) art.classList.add("silhouette");
    const body = h("span", { class: "form-body" },
      h("span", { class: "form-name" }, got ? c.forms[n - 1] : "Forme mystère", sel ? h("span", { class: "form-sel" }, "affichée") : null),
      h("span", { class: "form-story" }, got ? c.story[n - 1] : next ? `Encore ${unit(c.fam, g.remaining)} pour la découvrir !` : "Un secret pour plus tard…"));
    return got ? h("button", { class: "form-row" + (sel ? " sel" : ""), type: "button", "aria-pressed": sel ? "true" : "false",
      onclick: () => { sfx.tap(); store.update((x) => { setPick(x, id, "st", n); }); redraw(); } }, h("span", { class: "form-art" }, art), body)
      : h("div", { class: "form-row locked" }, h("span", { class: "form-art" }, art), body);
  });
  return [topbar(st ? c.name : "Œuf mystère", () => go("album")),
    h("div", { class: "screen-body pet-page", style: { "--fam": f.color, "--fam-ink": f.ink } },
      h("div", { class: "pet-page-a" }, scene,
        h("div", { class: "card pet-sum" },
          h("div", { class: "pet-sum-t" }, famPill(c.fam), h("b", {}, st ? `${f.name} · ${c.forms[pick.st - 1]}` : f.name)),
          st ? h("p", { class: "pet-desc" }, c.desc) : null,
          h("div", { class: "bar small" }, h("div", { class: "bar-fill", style: { width: g.pct + "%" } })),
          h("p", { class: "pet-line" }, growLine(s, c)), grow),
        actions),
      h("div", { class: "pet-page-b card" }, h("h2", {}, "📖 Son histoire"), h("div", { class: "forms" }, forms)))];
}
