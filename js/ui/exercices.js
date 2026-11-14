import { h } from "../dom.js";
import { store } from "../store.js";
import { FAMILIES } from "../generator.js";
import { session, lvlStars } from "./play.js";
import { topbar } from "./common.js";
import { dueReviews } from "../progress.js";
import { launchFor, REVIEW_MAX } from "../next.js";
import { toKey } from "../dates.js";

export function exercicesScreen({ go }) {
  const root = h("main", { class: "screen" });
  const s = store.state;
  function start(families) {
    session.opts = { families, count: store.settings.count || 10, mode: store.settings.answer === "qcm" ? "qcm" : "input", back: "exercices" };
    go("jouer", true);
  }
  function startCourse(families) {
    session.opts = { families, count: 10, mode: "course", back: "exercices" };
    go("course", true);
  }
  function startDictee() {
    session.opts = { families: "mix", count: store.settings.count || 10, mode: "dictee", back: "exercices" };
    go("jouer", true);
  }
  function draw() {
    const set = store.settings;
    const seg = (key, options) => h("div", { class: "seg" }, options.map(([val, label]) =>
      h("button", { class: "seg-b" + (set[key] === val || (key === "count" && !set.count && val === 10) ? " on" : ""), type: "button", onclick: () => { store.set(key, val); draw(); } }, label)));
    // v0.14.1 : les calculs à revoir, bien visibles (rien s'il n'y en a pas)
    const date = toKey(), due = dueReviews(s, date).length, n = Math.min(due, REVIEW_MAX);
    const review = due ? h("div", { class: "card review-card" },
      h("div", { class: "row" }, h("span", { class: "review-ic", "aria-hidden": "true" }, "🎯"),
        h("div", { class: "grow" }, h("h2", {}, `Calculs à revoir (${due})`), h("p", {}, "Ceux qui t'ont résisté : on les retravaille pour qu'ils deviennent faciles."))),
      h("button", { class: "btn big green", type: "button", onclick: () => {
        session.opts = launchFor({ kind: "review", n }, date, { answer: set.answer, count: set.count }, "exercices").opts; go("jouer", true);
      } }, `🎯 Revoir ${n} calcul${n > 1 ? "s" : ""}`)) : null;
    root.replaceChildren(
      topbar("Exercices", null),
      h("div", { class: "screen-body" }, review,
        h("div", { class: "card" }, h("h2", {}, "Comment veux-tu répondre ?"), seg("answer", [["qcm", "4 choix"], ["input", "Je tape"]]),
          h("h2", { style: { marginTop: "12px" } }, "Combien de calculs ?"), seg("count", [[10, "10"], [15, "15"], [20, "20"]])),
        h("button", { class: "btn big green", onclick: () => start("mix") }, "🎲 Mélange de tout"),
        h("button", { class: "btn big light", onclick: startDictee }, "🎧 Dictée : écoute et calcule"),
        // v0.15 : la course des réponses — mélange ou une famille
        h("div", { class: "card course-card" },
          h("div", { class: "row" }, h("span", { class: "course-ic", "aria-hidden": "true" }, "🏃"),
            h("div", { class: "grow" }, h("h2", {}, "La course des réponses"), h("p", {}, "Ta créature court dans son décor : passe par la porte de la bonne réponse ! 10 portes, sans chrono."))),
          h("div", { class: "course-pick" },
            h("button", { class: "btn green course-mix", type: "button", onclick: () => startCourse("mix") }, "🎲 Mélange"),
            FAMILIES.map((f) => h("button", { class: "course-fam", type: "button", style: { "--fam": f.color, "--fam-ink": f.ink }, "aria-label": "Course : " + f.name, title: f.name, onclick: () => startCourse([f.id]) }, f.short)))),
        h("button", { class: "btn big light", onclick: () => go("apprendre") }, "💡 Apprendre : les fiches astuces"),
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
