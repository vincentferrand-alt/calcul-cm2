import { h } from "../dom.js";
import { store } from "../store.js";
import { sfx } from "../audio.js";
import { CREATURES, STAGE_XP, creatureById, progressInfo } from "../creatures.js";
import { famById } from "../generator.js";
import { topbar } from "./common.js";
import { scenePick, setPick } from "../shop.js";
import { creatureArt } from "./art.js";
import { sceneEl } from "./scene.js";
import { playEvolution } from "./evolve.js";

export { creatureArt };

// Carte « nouvelle créature / évolution » affichée à la fin d'une série.
export function creatureCard(e) {
  const c = creatureById(e.id);
  return h("div", { class: "creature-new" }, creatureArt(e.id, e.to, STAGE_XP[e.to], "n" + e.id + e.to),
    h("div", { class: "creature-name" }, c.name), h("div", { class: "creature-stage" }, c.forms[e.to - 1]),
    h("p", { class: "creature-story" }, c.story[e.to - 1]));
}

export function albumScreen({ go }) {
  const root = h("main", { class: "screen" });
  const redraw = () => root.replaceChildren(...build().children);
  const build = () => albumBody(go, redraw);
  root.append(...build().children);
  return { el: root };
}

function albumBody(go, redraw) {
  const s = store.state;
  const nb = CREATURES.filter((c) => s.cre[c.id] && s.cre[c.id].s > 0).length;
  const cards = CREATURES.map((c) => {
    const f = famById(c.fam), xp = s.fam[c.fam] ? s.fam[c.fam].xp : 0;
    const st = Math.max(s.cre[c.id] ? s.cre[c.id].s : 0, 0), pi = progressInfo(xp);
    const shown = Math.max(st, 0), pick = shown ? scenePick(s, c.id) : null;
    const art = shown ? sceneEl({ id: c.id, stage: pick.st, xp, pick, variant: "album", lite: true }) : creatureArt(c.id, 0, xp, "al");
    if (!shown) art.classList.add("egg");
    const line = shown >= 4 ? "Stade maximum atteint, bravo ! 🌟"
      : shown === 0 ? `Encore ${pi.remaining} bonne${pi.remaining > 1 ? "s" : ""} réponse${pi.remaining > 1 ? "s" : ""} en ${f.name.toLowerCase()} pour faire éclore l'œuf`
      : `Encore ${pi.remaining} bonne${pi.remaining > 1 ? "s" : ""} réponse${pi.remaining > 1 ? "s" : ""} pour devenir : ${c.forms[shown].toLowerCase()}`;
    // Les points des stades : un appui sur un stade débloqué choisit la forme affichée (partout dans l'appli).
    const dots = [1, 2, 3, 4].map((n) => h("button", { class: "dot" + (n <= shown ? " on" : "") + (pick && n === pick.st ? " sel" : ""), type: "button", disabled: n > shown,
      "aria-label": n <= shown ? `Afficher : ${c.forms[n - 1]}` : `Stade ${n} pas encore atteint`,
      onclick: () => { sfx.tap(); store.update((x) => { setPick(x, c.id, "st", n); }); redraw(); } }));
    return h("div", { class: "pet", style: { "--fam": f.color, "--fam-ink": f.ink } },
      art,
      h("div", { class: "pet-name" }, shown ? c.name : "Mystère…"),
      h("div", { class: "pet-fam" }, shown ? c.forms[pick.st - 1] : f.name),
      h("div", { class: "pet-dots" }, dots),
      shown >= 4 ? null : h("div", { class: "bar small" }, h("div", { class: "bar-fill", style: { width: pi.pct + "%" } })),
      h("div", { class: "pet-line" }, line),
      shown ? h("div", { class: "pet-desc" }, c.story[pick.st - 1]) : null,
      shown ? h("button", { class: "pet-replay", type: "button", "aria-label": `Revoir l'évolution : ${c.forms[pick.st - 1]}`, onclick: () => playEvolution(c.id, pick.st - 1, pick.st) }, "▶ Revoir l'évolution") : null,
      shown ? h("button", { class: "pet-pick" + (store.settings.companion === c.id ? " on" : ""), type: "button", onclick: () => { store.set("companion", store.settings.companion === c.id ? null : c.id); redraw(); } },
        store.settings.companion === c.id ? "⭐ Mon compagnon" : "☆ Choisir comme compagnon") : null);
  });
  return h("div", {}, topbar("Mes créatures", () => go("")),
    h("div", { class: "screen-body" },
      h("div", { class: "card center" }, h("div", { class: "big-num" }, `🥚 ${nb} / ${CREATURES.length}`), h("p", {}, "Chaque bonne réponse fait grandir la créature de sa famille de calculs. Choisis ton compagnon : il t'accompagne sur l'accueil ! Touche les points pour choisir sa forme.")),
      h("div", { class: "pets" }, cards)));
}
