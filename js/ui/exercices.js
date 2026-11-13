import { h } from "../dom.js";
import { store } from "../store.js";
import { FAMILIES } from "../generator.js";
import { session, lvlStars } from "./play.js";
import { topbar } from "./common.js";

export function exercicesScreen({ go }) {
  const root = h("main", { class: "screen" });
  const s = store.state;
  function start(families) {
    session.opts = { families, count: store.settings.count || 10, mode: store.settings.answer === "qcm" ? "qcm" : "input", back: "exercices" };
    go("jouer", true);
  }
  function draw() {
    const set = store.settings;
    const seg = (key, options) => h("div", { class: "seg" }, options.map(([val, label]) =>
      h("button", { class: "seg-b" + (set[key] === val || (key === "count" && !set.count && val === 10) ? " on" : ""), type: "button", onclick: () => { store.set(key, val); draw(); } }, label)));
    root.replaceChildren(
      topbar("Exercices", () => go("")),
      h("div", { class: "screen-body" },
        h("div", { class: "card" }, h("h2", {}, "Comment veux-tu répondre ?"), seg("answer", [["qcm", "4 choix"], ["input", "Je tape"]]),
          h("h2", { style: { marginTop: "12px" } }, "Combien de calculs ?"), seg("count", [[10, "10"], [15, "15"], [20, "20"]])),
        h("button", { class: "btn big green", onclick: () => start("mix") }, "🎲 Mélange de tout"),
        h("div", { class: "fam-grid" }, FAMILIES.map((f) => {
          const fs = s.fam[f.id];
          return h("button", { class: "fam-card", style: { "--fam": f.color, "--fam-ink": f.ink }, onclick: () => start([f.id]) },
            h("span", { class: "fam-sym" }, f.short), h("span", { class: "fam-name" }, f.name),
            h("span", { class: "fam-lvl" }, lvlStars(fs ? fs.lvl : 1)));
        }))));
  }
  draw();
  return { el: root };
}
