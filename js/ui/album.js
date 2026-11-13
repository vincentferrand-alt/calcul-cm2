import { h, svgEl } from "../dom.js";
import { store } from "../store.js";
import { CREATURES, STAGE_XP, STAGE_NAMES, creatureById, creatureSVG, creatureEgg, progressInfo, stageForXp } from "../creatures.js";
import { famById } from "../generator.js";
import { topbar } from "./common.js";

// Image d'une créature (ou de son œuf) à l'état courant.
export function creatureArt(id, stage, xp = 0, uid = "a") {
  const w = h("div", { class: "creature-art" });
  w.append(svgEl(stage <= 0 ? creatureEgg(id, xp, uid) : creatureSVG(id, stage, uid)));
  return w;
}

// Carte « nouvelle créature / évolution » affichée à la fin d'une série.
export function creatureCard(e) {
  const c = creatureById(e.id);
  return h("div", { class: "creature-new" }, creatureArt(e.id, e.to, STAGE_XP[e.to], "n" + e.id + e.to),
    h("div", { class: "creature-name" }, c.name), h("div", { class: "creature-stage" }, STAGE_NAMES[e.to]));
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
    const shown = Math.max(st, 0);
    const art = creatureArt(c.id, shown, xp, "al");
    if (!shown) art.classList.add("egg");
    const line = shown >= 4 ? "Stade maximum atteint, bravo ! 🌟"
      : shown === 0 ? `Encore ${pi.remaining} bonne${pi.remaining > 1 ? "s" : ""} réponse${pi.remaining > 1 ? "s" : ""} en ${f.name.toLowerCase()} pour faire éclore l'œuf`
      : `Encore ${pi.remaining} bonne${pi.remaining > 1 ? "s" : ""} réponse${pi.remaining > 1 ? "s" : ""} pour devenir ${STAGE_NAMES[shown + 1].toLowerCase()}`;
    return h("div", { class: "pet", style: { "--fam": f.color, "--fam-ink": f.ink } },
      art,
      h("div", { class: "pet-name" }, shown ? c.name : "Mystère…"),
      h("div", { class: "pet-fam" }, f.name),
      h("div", { class: "pet-dots" }, [1, 2, 3, 4].map((n) => h("span", { class: "dot" + (n <= shown ? " on" : "") }))),
      shown >= 4 ? null : h("div", { class: "bar small" }, h("div", { class: "bar-fill", style: { width: pi.pct + "%" } })),
      h("div", { class: "pet-line" }, line),
      shown ? h("div", { class: "pet-desc" }, c.desc) : null,
      shown ? h("button", { class: "pet-pick" + (store.settings.companion === c.id ? " on" : ""), type: "button", onclick: () => { store.set("companion", store.settings.companion === c.id ? null : c.id); redraw(); } },
        store.settings.companion === c.id ? "⭐ Mon compagnon" : "☆ Choisir comme compagnon") : null);
  });
  return h("div", {}, topbar("Mes créatures", () => go("")),
    h("div", { class: "screen-body" },
      h("div", { class: "card center" }, h("div", { class: "big-num" }, `🥚 ${nb} / ${CREATURES.length}`), h("p", {}, "Chaque bonne réponse fait grandir la créature de sa famille de calculs. Choisis ton compagnon : il t'accompagne sur l'accueil !")),
      h("div", { class: "pets" }, cards)));
}
